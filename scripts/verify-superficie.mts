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

// ── RC-wire (v0.13.0): el wire de plataforma, importable y TIPADO ────────────
// Misma lección: si un tipo o una constante deja de exportarse, esto no compila.
import {
  FOUNDATION_JWKS_USERS_PATH,
  FOUNDATION_JWKS_SERVICES_PATH,
  FOUNDATION_ENTITLEMENTS_CHECK_PATH,
  FOUNDATION_ENTITLEMENTS_CHECK_MODULE_QUERY,
  FOUNDATION_SHELL_PATH,
  PLATFORM_JWT_ALG,
  PADRON_PARTIES_PATH,
  PADRON_PARTIES_IDENTIFIER_QUERY,
  padronPartyPath,
  padronPartyRolesPath,
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENCY_REPLAYED_HEADER,
  PARTY_IDENTIFIER_SEPARATOR,
  isIdentifierType,
  parsePartyIdentifier,
  formatPartyIdentifier,
  isPartyIdentifierString,
  isErrorEnvelope,
  MODULE_KINDS,
  CAPABILITY_AVAILABILITIES,
  ENTITLEMENT_STATUSES,
  LAUNCHER_ACTIONS,
  TOKEN_INITIATORS,
  type PlatformJwk,
  type PlatformJwks,
  type PlatformTokenHeader,
  type PlatformTokenClaims,
  type EntitlementsCheckQuery,
  type ResolvedFunctionAccess,
  type EntitlementsCheckResponse,
  type ShellUser,
  type ShellTenant,
  type ShellLauncherItem,
  type ShellBalance,
  type ShellBranding,
  type ShellPlatform,
  type ShellResponse,
  type PartyIdentifier,
  type ParsePartyIdentifierResult,
  type PartyFields,
  type PartyUpsertRequest,
  type PartyRow,
  type PartyRoleRow,
  type PartyContactRow,
  type PartyBranchRow,
  type PartyDetailsResponse,
  type PartyUpsertResponse,
  type PartyRolesResponse,
  type ErrorEnvelope,
  type EntitlementStatus,
  type LauncherAction,
  type TokenInitiator,
  type CapabilityAvailability,
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

// ── RC-wire: literales que COMPILEN contra cada forma del wire ───────────────
// Valores ficticios; la validación semántica contra los schemas es trabajo de
// verify-wire.mts. Lo que se prueba acá es que la FORMA exportada es la firmada.
const jwk: PlatformJwk = { kty: "OKP", crv: "Ed25519", x: "x", kid: "kid", alg: PLATFORM_JWT_ALG, use: "sig" };
const jwks: PlatformJwks = { keys: [jwk] };
const header: PlatformTokenHeader = { alg: "Ed25519", kid: jwk.kid };
const unInitiator: TokenInitiator = TOKEN_INITIATORS[0]!;
const claims: PlatformTokenClaims = {
  sub: "u", iss: "https://suynda.com", aud: "suynda-users", iat: 1, nbf: 1, exp: 2, jti: "j",
  initiator: unInitiator, tenant_id: "t", mandateId: "m",
};
const query: EntitlementsCheckQuery = { module: "lab" };
const unStatus: EntitlementStatus = ENTITLEMENT_STATUSES[0]!;
const unaPolitica: CapabilityAvailability = CAPABILITY_AVAILABILITIES[1]!;
const acceso: ResolvedFunctionAccess = { function_key: "cargar", scope_type: "departamento", scope_refs: [], all_scopes: false };
const check: EntitlementsCheckResponse = {
  tenant_id: "t", module: query.module, activo: true, status: unStatus, valid_to: null,
  politica: unaPolitica, cache_max_seconds: 60, verificado_at: ahora, grants: ["ver"], functions: [acceso],
};
const unaAccion: LauncherAction = LAUNCHER_ACTIONS[0]!;
const unKindDeModulo: ModuleKind = MODULE_KINDS[0]!;
const item: ShellLauncherItem = { key: "lab", nombre: "Laboratorio", descripcion: "", nivel: 1, entitled: true, action: unaAccion, kind: unKindDeModulo, url: null };
const usuario: ShellUser = { id: "u", nombre: "Livio" };
const espacio: ShellTenant = { id: "t", razon_social: null, nombre_negocio: "Lucero" };
const saldo: ShellBalance = { saldo: 0, en_sobregiro: false, bajo: false, gracia_restante: null };
const marca: ShellBranding = { logo_url: null, color_primario: null, color_acento: null };
const plataforma: ShellPlatform = { hub_url: "https://suynda.com/panel" };
const shell: ShellResponse = { user: usuario, tenant: espacio, launcher: [item], balance: saldo, branding: marca, platform: plataforma };
const ident: PartyIdentifier = { tipo: "RUC", countryCode: "PY", valor: "80012345-6" };
const parseado: ParsePartyIdentifierResult = parsePartyIdentifier(formatPartyIdentifier(ident));
const campos: PartyFields = { nombre_fantasia: null };
const pedido: PartyUpsertRequest = { identifier: { tipo: "RUC", valor: "1" }, razonSocial: "X", fields: campos, roles: ["proveedor"] };
const fila: PartyRow = {
  id: "p", tenant_id: "t", tipo: null, razon_social: "X", nombre_fantasia: null, tipo_contribuyente: null,
  tipo_regimen: null, actividades_economicas: null, es_consumidor_final: false, entity_version: 1,
  deleted_at: null, created_at: ahora, updated_at: ahora,
};
const rol: PartyRoleRow = { id: "r", tenant_id: "t", party_id: "p", rol: "proveedor", activo: true, activated_at: ahora, deactivated_at: null };
const contacto: PartyContactRow = { id: "c", tenant_id: "t", party_id: "p", tipo: null, valor: null, principal: false, created_at: ahora };
const sucursal: PartyBranchRow = { id: "b", tenant_id: "t", party_id: "p", codigo: null, nombre: null, direccion: null, ciudad_id: null, tipo: null, entity_version: 1, created_at: ahora, updated_at: ahora };
const detalle: PartyDetailsResponse = { party: fila, roles: [rol], contacts: [contacto], branches: [sucursal] };
const alta: PartyUpsertResponse = { party: fila, created: true };
const roles: PartyRolesResponse = { roles: [rol] };
const sobre: ErrorEnvelope = { error: { code: "CAPABILITY_DENIED", message: "No" } };

// ── RC-wire: los VALORES ────────────────────────────────────────────────────
if (FOUNDATION_JWKS_USERS_PATH !== "/.well-known/jwks-users.json" || FOUNDATION_JWKS_SERVICES_PATH !== "/.well-known/jwks-services.json") {
  problemas.push("los paths del JWKS de Foundation no son los observados");
}
if (FOUNDATION_ENTITLEMENTS_CHECK_PATH !== "/v1/entitlements/check" || FOUNDATION_ENTITLEMENTS_CHECK_MODULE_QUERY !== "module" || FOUNDATION_SHELL_PATH !== "/v1/shell") {
  problemas.push("los paths de entitlements/shell de Foundation no son los observados");
}
if (PADRON_PARTIES_PATH !== "/padron/v1/parties" || PADRON_PARTIES_IDENTIFIER_QUERY !== "identifier" || PARTY_IDENTIFIER_SEPARATOR !== ":") {
  problemas.push("los paths de parties de Padrón no son los observados");
}
if (IDEMPOTENCY_KEY_HEADER !== "idempotency-key" || IDEMPOTENCY_REPLAYED_HEADER !== "idempotency-replayed") {
  problemas.push("los headers de idempotencia no son los observados");
}
if (padronPartyPath("a b") !== "/padron/v1/parties/a%20b" || padronPartyRolesPath("x") !== "/padron/v1/parties/x/roles") {
  problemas.push("los compositores de path de parties no componen lo esperado");
}
if (!parseado.ok || parseado.value.valor !== ident.valor || !isPartyIdentifierString("CI::1") || !isIdentifierType("CI") || isIdentifierType("DNI")) {
  problemas.push("el codec del identificador no llega funcionando desde el entry");
}
if (!isErrorEnvelope(sobre) || isErrorEnvelope({ detail: "x" })) {
  problemas.push("isErrorEnvelope no distingue el sobre de la plataforma");
}
if (JSON.stringify([...MODULE_KINDS]) !== JSON.stringify(["vertical", "horizontal"])) {
  problemas.push(`MODULE_KINDS debe ser exactamente vertical,horizontal; llegó ${JSON.stringify(MODULE_KINDS)}`);
}
if (JSON.stringify([...CAPABILITY_AVAILABILITIES]) !== JSON.stringify(["FAIL_OPEN", "FAIL_AFTER_GRACE", "FAIL_CLOSED"])) {
  problemas.push(`CAPABILITY_AVAILABILITIES cambió: ${JSON.stringify(CAPABILITY_AVAILABILITIES)}`);
}
if (JSON.stringify([...ENTITLEMENT_STATUSES]) !== JSON.stringify(["active", "suspended", "vencido", "ausente", "plataforma"])) {
  problemas.push(`ENTITLEMENT_STATUSES cambió: ${JSON.stringify(ENTITLEMENT_STATUSES)}`);
}
if (JSON.stringify([...LAUNCHER_ACTIONS]) !== JSON.stringify(["open", "expand"]) || JSON.stringify([...TOKEN_INITIATORS]) !== JSON.stringify(["user", "system"])) {
  problemas.push("LAUNCHER_ACTIONS o TOKEN_INITIATORS cambiaron");
}
if (jwks.keys.length !== 1 || header.kid !== jwk.kid || claims.initiator !== "user" || check.functions?.length !== 1 || shell.launcher[0]?.key !== "lab" || detalle.roles.length !== 1 || !alta.created || roles.roles.length !== 1 || pedido.roles?.[0] !== "proveedor") {
  problemas.push("las formas del wire no traen los valores esperados");
}

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
console.log("superficie: RC-wire — 6 constantes de Foundation, 7 de Padron + 4 funciones del codec, isErrorEnvelope, 5 enums y 27 tipos del wire importables y TIPADOS desde el entry.");
