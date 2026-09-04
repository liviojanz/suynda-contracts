/**
 * La SUPERFICIE del paquete — lo que un consumidor puede importar del entry.
 *
 * POR QUE EXISTE: `v0.9.0` definio `ModuleKind` en `src/modules.ts` y no lo
 * exporto desde `src/index.ts`. Foundation no podia importarlo, y la unica
 * salida habria sido duplicar la union `"vertical" | "horizontal"` alla —
 * exactamente lo que la regla dura prohibe: todo enum viene de contracts,
 * jamas como string libre.
 *
 * `verify-v0.mjs` no lo atrapo, y no era su trabajo: valida DATOS —cuenta
 * modulos, valida el sobre, corre los guards— y nunca mira que el indice
 * exporte lo que el contrato promete. Este archivo cubre esa mitad.
 *
 * ES UN ARCHIVO `.mts` A PROPOSITO. Un chequeo de exports en JavaScript solo
 * puede ver los valores; los TIPOS desaparecen al compilar. Este archivo se
 * TYPECHEQUEA, asi que un tipo que deja de exportarse rompe la compilacion —
 * que es la unica forma de verlo.
 *
 * Se importa desde `../dist/index.js`, el entry publicado, y NO desde `../src`:
 * lo que hay que probar es lo que el consumidor recibe, no lo que el fuente
 * tiene adentro.
 */

import {
  MODULES,
  moduleByKey,
  type ModuleSeed,
  type ModuleKind,
  type ModuleKey,
  type ModuleClass,
  type ModuleLevel,
} from "../dist/index.js";

// ── Los TIPOS: si alguno deja de exportarse, esto no compila ───────────────
const kinds: ModuleKind[] = ["vertical", "horizontal"];
const unaSemilla: ModuleSeed = MODULES[0]!;
const unaKey: ModuleKey = unaSemilla.key;
const unaClase: ModuleClass = unaSemilla.clase;
const unNivel: ModuleLevel = unaSemilla.nivel;

// Y que `ModuleSeed` describa de verdad lo que `MODULES` trae: si alguien
// agrega un campo al JSON sin agregarlo al tipo, o al reves, esto lo dice.
const camposDelTipo: Array<keyof ModuleSeed> = [
  "key",
  "clase",
  "nivel",
  "nombre_es",
  "descripcion_es",
  "activo",
  "subdomain",
  "kind",
];

// ── Los VALORES ───────────────────────────────────────────────────────────
const problemas: string[] = [];

if (typeof moduleByKey !== "function") {
  problemas.push("moduleByKey no se exporta como funcion");
}
if (!Array.isArray(MODULES) || MODULES.length === 0) {
  problemas.push("MODULES no llega como arreglo con contenido");
}
if (!kinds.includes("vertical") || !kinds.includes("horizontal")) {
  problemas.push("ModuleKind no admite los dos valores del vocabulario");
}
if (unaKey === undefined || unaClase === undefined || unNivel === undefined) {
  problemas.push("una semilla llego sin sus campos base");
}

// El tipo y el dato tienen que decir lo mismo, en las dos direcciones.
const camposDelDato = Object.keys(MODULES[0]!).sort();
const esperados = [...camposDelTipo].sort();
const sobran = camposDelDato.filter((c) => !esperados.includes(c as keyof ModuleSeed));
const faltan = esperados.filter((c) => !camposDelDato.includes(c));
if (sobran.length) problemas.push(`el JSON trae campos que el tipo no declara: ${sobran.join(", ")}`);
if (faltan.length) problemas.push(`el tipo declara campos que el JSON no trae: ${faltan.join(", ")}`);

if (problemas.length) {
  console.error("SUPERFICIE ROTA:");
  for (const p of problemas) console.error(`  - ${p}`);
  process.exit(1);
}

console.log("superficie: MODULES, moduleByKey, ModuleSeed, ModuleKind, ModuleKey,");
console.log("            ModuleClass, ModuleLevel — todos importables desde el entry.");
console.log(`superficie: tipo y dato coinciden en ${camposDelDato.length} campos.`);
