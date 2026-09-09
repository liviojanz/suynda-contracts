/**
 * VERIFY-WIRE — la compuerta del wire de plataforma (RC-wire v0.13.0).
 *
 * Tres cosas, y cada una se ve ROJA con un caso plantado antes de creerle al
 * verde:
 *
 *   1. El codec del identificador de Padrón: parse ↔ format, exactamente la
 *      semántica de `padron/src/http/routes/parties.ts:326-329`.
 *   2. El sobre de error: `isErrorEnvelope` distingue el sobre de la
 *      plataforma del `{ detail }` de compra.
 *   3. Los tres schemas nuevos contra FIXTURES construidos desde el código del
 *      productor (con su cita en `_source`), validados con ajv 2020 + formats.
 *      Un fixture con `_expect: "invalid"` es un rojo plantado: tiene que
 *      FALLAR — un enum inyectado vacío o un schema laxo lo dejaría pasar.
 *
 * Se importa desde `../dist/index.js`, el entry publicado, y se typechequea
 * como `verify-superficie.mts`. Sin red, sin Foundation, sin Padrón.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormatsImport from "ajv-formats";
import {
  parsePartyIdentifier,
  formatPartyIdentifier,
  isPartyIdentifierString,
  isIdentifierType,
  isErrorEnvelope,
} from "../dist/index.js";

const addFormats = addFormatsImport as unknown as (ajv: InstanceType<typeof Ajv2020>) => void;

const problemas: string[] = [];
let verificaciones = 0;
function check(condicion: boolean, mensaje: string): void {
  verificaciones += 1;
  if (!condicion) problemas.push(mensaje);
}

// ── 1 · El codec ─────────────────────────────────────────────────────────────

const validos: Array<[string, { tipo: string; countryCode: string | null; valor: string }]> = [
  ["RUC:PY:80012345-6", { tipo: "RUC", countryCode: "PY", valor: "80012345-6" }],
  ["CI::1234567", { tipo: "CI", countryCode: null, valor: "1234567" }],
  ["PASSPORT:AR:AB:12", { tipo: "PASSPORT", countryCode: "AR", valor: "AB:12" }],
  ["FOREIGN_TAX_ID:BR:12.345.678/0001-95", { tipo: "FOREIGN_TAX_ID", countryCode: "BR", valor: "12.345.678/0001-95" }],
];
for (const [raw, esperado] of validos) {
  const r = parsePartyIdentifier(raw);
  check(r.ok, `codec: ${raw} debería parsear`);
  if (r.ok) {
    check(
      r.value.tipo === esperado.tipo && r.value.countryCode === esperado.countryCode && r.value.valor === esperado.valor,
      `codec: ${raw} parseó distinto: ${JSON.stringify(r.value)}`,
    );
    check(formatPartyIdentifier(r.value) === raw, `codec: format(parse(${raw})) no vuelve a ${raw}`);
  }
  check(isPartyIdentifierString(raw), `codec: isPartyIdentifierString(${raw}) debería ser true`);
}

const invalidos: Array<[string, "forma" | "tipo" | "valor"]> = [
  ["RUC", "forma"],
  ["RUC:PY", "forma"],
  ["", "forma"],
  ["XXX:PY:1", "tipo"],
  ["ruc:PY:1", "tipo"],
  ["RUC:PY:", "valor"],
];
for (const [raw, motivo] of invalidos) {
  const r = parsePartyIdentifier(raw);
  check(!r.ok && r.reason === motivo, `codec ROJO plantado: ${JSON.stringify(raw)} debía fallar por «${motivo}»; dio ${JSON.stringify(r)}`);
  check(!isPartyIdentifierString(raw), `codec: isPartyIdentifierString(${JSON.stringify(raw)}) debería ser false`);
}
check(isIdentifierType("CI") && !isIdentifierType("DNI"), "isIdentifierType no valida contra IDENTIFIER_TYPES");
// El codec NO normaliza: eso es Padrón.
const sinNormalizar = parsePartyIdentifier("RUC:py: 8001 ");
check(sinNormalizar.ok && sinNormalizar.value.countryCode === "py" && sinNormalizar.value.valor === " 8001 ", "el codec no debe normalizar mayúsculas ni espacios");

// ── 2 · El sobre ─────────────────────────────────────────────────────────────

check(isErrorEnvelope({ error: { code: "CAPABILITY_DENIED", message: "No tenés permiso" } }), "sobre: el mínimo debe pasar");
check(isErrorEnvelope({ error: { code: "X", message: "y", detail: { capability: "z" } } }), "sobre: con detail debe pasar");
check(isErrorEnvelope({ error: { code: "X", message: "y" }, extra: 1 }), "sobre: es extensible, una clave de más pasa");
check(!isErrorEnvelope({ detail: "Sesión requerida" }), "sobre ROJO plantado: el { detail } de compra NO es el sobre");
check(!isErrorEnvelope({ error: "x" }), "sobre ROJO plantado: error como string no es el sobre");
check(!isErrorEnvelope({ error: { code: 1, message: "y" } }), "sobre ROJO plantado: code numérico no es el sobre");
check(!isErrorEnvelope(null) && !isErrorEnvelope("x"), "sobre: null y string no son el sobre");

// ── 3 · Los schemas contra los fixtures ──────────────────────────────────────

interface Fixture {
  _schema: string;
  _def: string;
  _source: string;
  _expect?: "valid" | "invalid";
  body: unknown;
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const SCHEMAS = ["error-envelope", "foundation-wire", "padron-parties"] as const;
for (const s of SCHEMAS) {
  ajv.addSchema(JSON.parse(readFileSync(join("schema", `${s}.schema.json`), "utf8")) as object);
}

const dir = join("fixtures", "wire");
const nombres = readdirSync(dir).filter((n) => n.endsWith(".json")).sort();
check(nombres.length >= 12, `fixtures: se esperaban al menos 12, hay ${nombres.length}`);
let rojosPlantados = 0;
for (const nombre of nombres) {
  const fx = JSON.parse(readFileSync(join(dir, nombre), "utf8")) as Fixture;
  if (!fx._schema || !fx._def || !fx._source || !("body" in fx)) {
    problemas.push(`${nombre}: un fixture lleva _schema, _def, _source y body`);
    continue;
  }
  const validate = ajv.compile({ $ref: `https://suynda.com/schemas/${fx._schema}.schema.json#/$defs/${fx._def}` });
  const paso = validate(fx.body) === true;
  const debiaPasar = (fx._expect ?? "valid") === "valid";
  if (!debiaPasar) rojosPlantados += 1;
  check(
    paso === debiaPasar,
    `${nombre}: esperaba ${debiaPasar ? "VÁLIDO" : "INVÁLIDO (rojo plantado)"} y ${paso ? "pasó" : "falló"}${paso ? "" : ` — ${JSON.stringify(validate.errors)}`}`,
  );
}
check(rojosPlantados >= 4, `fixtures: se esperaban al menos 4 rojos plantados, hay ${rojosPlantados}`);

// Los enums inyectados NO pueden haber quedado vacíos: un enum vacío haría que
// TODO valor fallara, y eso lo destaparían los fixtures válidos; pero un enum
// que nadie inyectó porque el path de INJECTIONS está mal escrito sigue en []
// y también lo destapan. Se mira igual, de frente.
const vacios: string[] = [];
function buscarEnumsVacios(nodo: unknown, ruta: string): void {
  if (typeof nodo !== "object" || nodo === null) return;
  const n = nodo as Record<string, unknown>;
  if (Array.isArray(n["enum"]) && n["enum"].length === 0) vacios.push(ruta);
  for (const [k, v] of Object.entries(n)) buscarEnumsVacios(v, `${ruta}/${k}`);
}
for (const s of SCHEMAS) {
  buscarEnumsVacios(JSON.parse(readFileSync(join("schema", `${s}.schema.json`), "utf8")), s);
}
check(vacios.length === 0, `schemas con enum vacío (sin inyectar): ${vacios.join(", ")}`);

// ── Veredicto ────────────────────────────────────────────────────────────────

if (problemas.length) {
  console.error("WIRE ROTO:");
  for (const p of problemas) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`verify-wire: ${verificaciones} verificaciones · codec, sobre y ${nombres.length} fixtures (${rojosPlantados} rojos plantados) contra ${SCHEMAS.length} schemas — OK`);
