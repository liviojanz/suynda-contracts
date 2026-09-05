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

// ── Depósito (RC v0.11.0): la superficie de la frontera, importable y tipada ──
// La lección de v0.9.0 aplicada de antemano: los tipos que Núcleo y Depósito
// van a compilar tienen que salir del entry. Si uno deja de exportarse, esto
// no compila — que es la única forma de verlo.
import {
  DEPOSITO_MANIFEST,
  ITEM_TYPES,
  INVENTORY_OPERATION_TYPES,
  COST_EFFECT_KINDS,
  CONSEQUENCE_ROLES,
  QUANTITY_BRANCHES,
  type EconomicConsequence,
  type CostEffectDto,
  type InventoryMovementDto,
  type InventoryProvocation,
  type ProvocationLine,
  type CausalIdentity,
  type PoolRef,
  type DecimalString,
  type DepositCurrency,
  type IsoDateTime,
  type ItemType,
  type CostEffectKind,
  type ConsequenceRole,
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
  "orden",
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

// ── Depósito: una consecuencia y una provocación literales que COMPILEN ──────
// Si un campo cambia de nombre o de nulabilidad en src/deposito.ts sin pasar
// por acá, esto deja de compilar. Los valores son ficticios y no se validan
// contra el schema (eso es trabajo del borde de Depósito); lo que se prueba es
// que la FORMA exportada es la que el diseño aprobó.
const ahora: IsoDateTime = "2026-09-04T12:00:00.000Z";
const causa: CausalIdentity = { origen_module: "deposito", documento_causante: "OP-1" };
const pool: PoolRef = "pool-opaco";
const cero: DecimalString = "0";
const moneda: DepositCurrency = "PYG";

const movimiento: InventoryMovementDto = {
  movement_id: "mov-1",
  item: { item_id: "item-1", item_nombre_cache: "Reactivo X", item_cache_at: ahora, item_entity_version: 1 },
  tenant_id: "550e8400-e29b-41d4-a716-446655440000",
  almacen_id: "alm-1",
  lot_id: null,
  branch: "AVAILABLE",
  unallocated: false,
  delta: "-5",
  effective_at: ahora,
  recorded_at: ahora,
};

const efecto: CostEffectDto = {
  cost_effect_id: "ce-1",
  kind: "ISSUE_COST",
  grupo_id: "550e8400-e29b-41d4-a716-446655440001",
  pool_ref: pool,
  cost_state: "FINAL",
  provisional_basis: null,
  true_up_mode: null,
  amount: cero,
  currency: moneda,
  effective_at: ahora,
  recorded_at: ahora,
  target_effective_as_of: null,
  resolves_cost_effect_id: null,
};

const consecuencia: EconomicConsequence = {
  operation_id: "op-1",
  operation_type: "ISSUE",
  version: 1,
  role: "ORIGINAL",
  cause: causa,
  tenant_id: movimiento.tenant_id,
  grupo_id: efecto.grupo_id,
  effective_at: ahora,
  recorded_at: ahora,
  movements: [movimiento],
  cost_effects: [efecto],
  reverses_operation_id: null,
};

const linea: ProvocationLine = { item_id: "item-1", quantity: "5" };
const provocacion: InventoryProvocation = {
  operation_type: "ISSUE",
  cause: { origen_module: "lab", documento_causante: "SOL-42" },
  tenant_id: movimiento.tenant_id,
  almacen_id: "alm-1",
  almacen_destino_id: null,
  effective_at: ahora,
  lines: [linea],
};

const unTipo: ItemType = ITEM_TYPES[0]!;
const unKind: CostEffectKind = COST_EFFECT_KINDS[0]!;
const unRol: ConsequenceRole = CONSEQUENCE_ROLES[0]!;

// ── Los VALORES de Depósito ───────────────────────────────────────────────
if (JSON.stringify([...ITEM_TYPES]) !== JSON.stringify(["PRODUCT", "SERVICE"])) {
  problemas.push(`ITEM_TYPES debe ser exactamente PRODUCT,SERVICE; llegó ${JSON.stringify(ITEM_TYPES)}`);
}
// Blocker 1 de la pasada de contrato: REVERSAL es ROL, jamás KIND. Si vuelve
// al kind, revertir un IMPAIRMENT pierde el eje costo/valor (DEP-36).
if ((COST_EFFECT_KINDS as readonly string[]).includes("REVERSAL")) {
  problemas.push("COST_EFFECT_KINDS no puede contener REVERSAL (vive en ConsequenceRole)");
}
if (!(CONSEQUENCE_ROLES as readonly string[]).includes("REVERSAL")) {
  problemas.push("CONSEQUENCE_ROLES debe contener REVERSAL");
}
if (!(QUANTITY_BRANCHES as readonly string[]).includes("SHORTFALL") || (QUANTITY_BRANCHES as readonly string[]).includes("RESERVED")) {
  problemas.push("QUANTITY_BRANCHES debe tener SHORTFALL y NO tener RESERVED (recorte E)");
}
if (!(INVENTORY_OPERATION_TYPES as readonly string[]).includes("RECEIPT") || (INVENTORY_OPERATION_TYPES as readonly string[]).some((t) => t.startsWith("MANUAL_"))) {
  problemas.push("INVENTORY_OPERATION_TYPES: RECEIPT/ISSUE sin prefijo MANUAL_ (el origen vive en la causa)");
}
if (DEPOSITO_MANIFEST.module_key !== "deposito") {
  problemas.push("DEPOSITO_MANIFEST no llega desde el entry");
}
if (consecuencia.role !== unRol || provocacion.lines.length !== 1 || unTipo !== "PRODUCT" || unKind !== "RECEIPT_COST") {
  problemas.push("las formas de Depósito no traen los valores esperados");
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
console.log(
  `superficie: deposito — EconomicConsequence, InventoryProvocation y ${
    ITEM_TYPES.length + INVENTORY_OPERATION_TYPES.length + COST_EFFECT_KINDS.length + CONSEQUENCE_ROLES.length + QUANTITY_BRANCHES.length
  } valores de enum importables desde el entry; REVERSAL es rol, no kind.`,
);
