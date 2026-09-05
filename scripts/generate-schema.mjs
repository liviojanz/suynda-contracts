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

const valuesOf = (key) =>
  key === "ModuleKey" ? moduleEnum : enums[key].values;

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
    node.description = `${inj.key}${inj.nullable ? " | null" : ""} — ${GEN} ${src} by scripts/generate-schema.mjs. Do not edit by hand.${tail}`;
    node.enum = inj.nullable ? [...values, null] : [...values];
    node.type = inj.nullable ? ["string", "null"] : "string";
    done.push(`${inj.path.at(-1)}=${values.length}`);
  }
  await writeFile(p, JSON.stringify(s, null, 2) + "\n", "utf8");
  console.log(`generate-schema: ${done.join(", ")} written to schema/${file}`);
}
