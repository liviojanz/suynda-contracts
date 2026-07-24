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
