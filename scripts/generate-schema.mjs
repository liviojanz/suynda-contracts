/**
 * Generate the closed enums in schema/event-envelope.schema.json FROM the canonical
 * data files (data/events.json, data/modules.json). Run automatically as `prebuild`.
 *
 * Why generate instead of a test: EventType/ModuleKey (the TypeScript types emitters
 * use) derive from data/*.json, while validateEnvelope() compiles this schema for
 * INGEST. If the two lists diverge, a legitimately-typed event is rejected at ingest.
 * A test would only warn after they diverged; generation makes divergence impossible.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const eventsPath = join(root, "data", "events.json");
const modulesPath = join(root, "data", "modules.json");
const schemaPath = join(root, "schema", "event-envelope.schema.json");

const readJson = async (p) => JSON.parse(await readFile(p, "utf8"));

const events = await readJson(eventsPath);
const modules = await readJson(modulesPath);
const schema = await readJson(schemaPath);

const eventEnum = events.map((e) => e.type);
const moduleEnum = modules.map((m) => m.key);

const GEN = "GENERATED from";
schema.properties.event.description = `EventType — ${GEN} data/events.json by scripts/generate-schema.mjs. Do not edit by hand.`;
schema.properties.event.enum = eventEnum;
schema.properties.origen_module.description = `ModuleKey of the owner that emitted the event — ${GEN} data/modules.json by scripts/generate-schema.mjs. Do not edit by hand.`;
schema.properties.origen_module.enum = moduleEnum;

await writeFile(schemaPath, JSON.stringify(schema, null, 2) + "\n", "utf8");

console.log(
  `generate-schema: event.enum=${eventEnum.length}, origen_module.enum=${moduleEnum.length} written to schema/event-envelope.schema.json`,
);

// ── Depósito (RC v0.11.0): los schemas de la frontera beben de data/enums.json ──
// Misma razón que arriba: EconomicConsequence / InventoryProvocation se tipan en
// TS desde data/enums.json y se validan en el borde con estos schemas. Si un
// valor nuevo entra al enum y no al schema, una consecuencia legítimamente
// tipada se rechaza al validar. Se genera; no se copia.
//
// Cada inyección nombra el archivo, la RUTA dentro del schema, la clave del
// enum en data/enums.json (o "ModuleKey" para modules.json) y si admite null
// (entonces el enum termina en null y el type es ["string","null"]).
const enumsPath = join(root, "data", "enums.json");
const enums = await readJson(enumsPath);

// RC-wire v0.13.0: los enums "planos" de data/enums.json (IdentifierType,
// PartyRole, ModuleLevel…) son arreglos sin `values`; los anotados lo traen.
const valuesOf = (key) => {
  if (key === "ModuleKey") return moduleEnum;
  const raw = enums[key];
  if (raw === undefined) throw new Error(`generate-schema: enum ${key} no existe en data/enums.json`);
  return Array.isArray(raw) ? raw : raw.values;
};

const INJECTIONS = {
  "economic-consequence.schema.json": [
    { path: ["$defs", "causalIdentity", "properties", "origen_module"], key: "ModuleKey", nullable: false, source: "data/modules.json" },
    { path: ["$defs", "inventoryMovement", "properties", "branch"], key: "QuantityBranch", nullable: false },
    { path: ["$defs", "costEffect", "properties", "kind"], key: "CostEffectKind", nullable: false },
    { path: ["$defs", "costEffect", "properties", "cost_state"], key: "CostState", nullable: false },
    { path: ["$defs", "costEffect", "properties", "provisional_basis"], key: "ProvisionalBasis", nullable: true },
    { path: ["$defs", "costEffect", "properties", "true_up_mode"], key: "TrueUpMode", nullable: true },
    { path: ["$defs", "economicConsequence", "properties", "operation_type"], key: "InventoryOperationType", nullable: false },
    { path: ["$defs", "economicConsequence", "properties", "role"], key: "ConsequenceRole", nullable: false },
  ],
  "inventory-provocation.schema.json": [
    { path: ["$defs", "causalIdentity", "properties", "origen_module"], key: "ModuleKey", nullable: false, source: "data/modules.json" },
    { path: ["$defs", "inventoryProvocation", "properties", "operation_type"], key: "InventoryOperationType", nullable: false },
  ],
  // ── RC-wire (v0.13.0): el wire de Foundation y Padrón. D28: TypeScript y
  // JSON Schema beben del MISMO conjunto — por eso ModuleKind y
  // CapabilityAvailability se promovieron a data/enums.json en vez de copiarse.
  "foundation-wire.schema.json": [
    { path: ["$defs", "platformTokenClaims", "properties", "initiator"], key: "TokenInitiator", nullable: false },
    { path: ["$defs", "entitlementsCheckResponse", "properties", "module"], key: "ModuleKey", nullable: false, source: "data/modules.json" },
    { path: ["$defs", "entitlementsCheckResponse", "properties", "status"], key: "EntitlementStatus", nullable: false },
    { path: ["$defs", "entitlementsCheckResponse", "properties", "politica"], key: "CapabilityAvailability", nullable: false },
    { path: ["$defs", "shellLauncherItem", "properties", "key"], key: "ModuleKey", nullable: false, source: "data/modules.json" },
    { path: ["$defs", "shellLauncherItem", "properties", "nivel"], key: "ModuleLevel", nullable: false },
    { path: ["$defs", "shellLauncherItem", "properties", "action"], key: "LauncherAction", nullable: false },
    { path: ["$defs", "shellLauncherItem", "properties", "kind"], key: "ModuleKind", nullable: true },
  ],
  "padron-parties.schema.json": [
    { path: ["$defs", "partyIdentifier", "properties", "tipo"], key: "IdentifierType", nullable: false },
    { path: ["$defs", "partyUpsertRequest", "properties", "roles", "items"], key: "PartyRole", nullable: false },
    { path: ["$defs", "partyRoleRow", "properties", "rol"], key: "PartyRole", nullable: false },
  ],
};

for (const [file, injections] of Object.entries(INJECTIONS)) {
  const p = join(root, "schema", file);
  const s = await readJson(p);
  const done = [];
  for (const inj of injections) {
    const node = inj.path.reduce((acc, k) => acc[k], s);
    const values = valuesOf(inj.key);
    const src = inj.source ?? "data/enums.json";
    const tail = node.description.includes(" Do not edit by hand.")
      ? node.description.slice(node.description.indexOf(" Do not edit by hand.") + " Do not edit by hand.".length)
      : "";
    // RC-wire v0.13.0: un enum puede traer valores numéricos (ModuleLevel) o
    // incluir null en su propia lista; el tipo se DERIVA de los valores. Para
    // los enums de Depósito —strings sin null— la salida es idéntica byte a
    // byte a la de antes.
    const nonNull = values.filter((v) => v !== null);
    const hasNull = Boolean(inj.nullable) || nonNull.length !== values.length;
    const base = typeof nonNull[0] === "number" ? "integer" : "string";
    node.description = `${inj.key}${hasNull ? " | null" : ""} — ${GEN} ${src} by scripts/generate-schema.mjs. Do not edit by hand.${tail}`;
    node.enum = hasNull ? [...nonNull, null] : [...nonNull];
    node.type = hasNull ? [base, "null"] : base;
    done.push(`${inj.path.at(-1)}=${values.length}`);
  }
  await writeFile(p, JSON.stringify(s, null, 2) + "\n", "utf8");
  console.log(`generate-schema: ${done.join(", ")} written to schema/${file}`);
}
