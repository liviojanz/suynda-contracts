import {
  validateEnvelope,
  MODULES,
  MODULE_KEYS,
  EVENTS,
  CAPABILITIES,
  ERROR_CODES,
  METERED_OPERATIONS,
  ENUMS,
  PLAN_KEYS,
} from "../dist/index.js";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.(json|ts|md)$/.test(e.name)) out.push(p);
  }
  return out;
}

const good = {
  event: "party.created",
  version: 1,
  event_id: "evt-1",
  tenant_id: "550e8400-e29b-41d4-a716-446655440000",
  origen_module: "padron",
  ref: { id: "party-1" },
  entity_version: 1,
  change_mask: ["nombre"],
  occurred_at: "2026-07-23T12:00:00.000Z",
};
const bad = { ...good, extra_payload: { foo: 1 } };

const ok1 = validateEnvelope(good);
const ok2 = validateEnvelope(bad);

console.log("valid envelope:", ok1);
console.log("unknown field rejected:", ok2.ok === false, ok2.errors);
console.log("modules:", MODULES.length, "keys:", MODULE_KEYS.length);
console.log(
  "events:",
  EVENTS.length,
  "all v1:",
  EVENTS.every((e) => e.version === 1),
);
console.log("capabilities:", CAPABILITIES.length);
console.log("errors:", ERROR_CODES.length);
console.log(
  "metered:",
  METERED_OPERATIONS.length,
  "has creditos key?",
  METERED_OPERATIONS.some((o) => Object.hasOwn(o, "creditos")),
);
console.log("PlanKey:", PLAN_KEYS);
console.log(
  "enums ModuleKey order match:",
  JSON.stringify(ENUMS.ModuleKey) === JSON.stringify(MODULE_KEYS),
);

const dataFiles = walk("data");
const schemaFiles = walk("schema");
for (const f of [...dataFiles, ...schemaFiles]) {
  JSON.parse(readFileSync(f, "utf8"));
}
console.log("all data/schema JSON valid");

const dataText = dataFiles.map((f) => readFileSync(f, "utf8")).join("\n");
console.log('data has "creditos":', /"creditos"\s*:/.test(dataText));
console.log('data has "precio', /"precio/.test(dataText));

// Expected event types from spec §5
const expectedEvents = [
  "party.created",
  "party.updated",
  "party.role_added",
  "party.role_deactivated",
  "party.deleted",
  "item.created",
  "item.updated",
  "item.deleted",
  "branch.created",
  "branch.updated",
  "tax_rate.published",
  "stock.adjusted",
  "stock.transferred",
  "sale.completed",
  "sale.voided",
  "document.approved",
  "document.rejected",
  "purchase.registered",
  "purchase.approved",
  "employee.status_changed",
  "tenant.module_activated",
  "tenant.module_deactivated",
  "tenant.provisioned",
  "credits.granted",
  "credits.low_balance",
  "credits.exhausted",
  "credits.overdraft_started",
  "credits.operation_unpriced",
];
const actualTypes = EVENTS.map((e) => e.type);
const missing = expectedEvents.filter((t) => !actualTypes.includes(t));
const extra = actualTypes.filter((t) => !expectedEvents.includes(t));
console.log("event missing:", missing);
console.log("event extra:", extra);

// schema closed
const schema = JSON.parse(
  readFileSync("schema/event-envelope.schema.json", "utf8"),
);
console.log(
  "envelope additionalProperties:",
  schema.additionalProperties,
);

const pass =
  ok1.ok === true &&
  ok2.ok === false &&
  MODULES.length === 15 &&
  MODULE_KEYS.length === 15 &&
  EVENTS.length === 28 &&
  missing.length === 0 &&
  extra.length === 0 &&
  schema.additionalProperties === false &&
  !/"creditos"\s*:/.test(dataText) &&
  METERED_OPERATIONS.length === 9;

console.log(pass ? "\nDoD CHECK: PASS" : "\nDoD CHECK: FAIL");
process.exit(pass ? 0 : 1);
