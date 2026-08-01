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
  ROLE_KEYS,
  PRIVILEGED_ROLE_KEYS,
  COMPRA_MANIFEST,
} from "../dist/index.js";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

function sorted(arr) {
  return [...arr].sort();
}

function sameSet(a, b) {
  return JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
}

/** Internal checks for data/manifests/compra.json (Bloque 1 / 6.1). */
function verifyCompraManifest(m) {
  const errors = [];
  const fnKeys = new Set(m.functions.map((f) => f.function_key));
  const roleKeys = new Set(m.roles.map((r) => r.role_key));
  const byRole = Object.fromEntries(
    m.roles.map((r) => [r.role_key, r.functions]),
  );

  const superadmin = byRole.superadmin ?? [];
  const admin = byRole.admin ?? [];
  const approver = byRole.approver ?? [];
  const uploader = byRole.uploader ?? [];

  const expectedSuper = sorted([...admin, "configurar_verificacion_fiscal"]);
  if (!sameSet(superadmin, expectedSuper)) {
    errors.push(
      `superadmin must equal admin + configurar_verificacion_fiscal; got ${JSON.stringify(sorted(superadmin))}`,
    );
  }

  const expectedApprover = sorted(
    admin.filter((f) => f !== "reprocesar_facturas"),
  );
  if (!sameSet(approver, expectedApprover)) {
    errors.push(
      `approver must equal admin − reprocesar_facturas; got ${JSON.stringify(sorted(approver))}`,
    );
  }

  if (!sameSet(uploader, ["cargar_facturas"])) {
    errors.push(
      `uploader must be only cargar_facturas; got ${JSON.stringify(uploader)}`,
    );
  }

  for (const role of m.roles) {
    for (const fk of role.functions) {
      if (!fnKeys.has(fk)) {
        errors.push(`role ${role.role_key} references unknown function ${fk}`);
      }
    }
  }

  for (const [grantor, grantees] of Object.entries(m.role_grant_matrix)) {
    if (!roleKeys.has(grantor)) {
      errors.push(`role_grant_matrix key unknown: ${grantor}`);
    }
    for (const g of grantees) {
      if (!roleKeys.has(g)) {
        errors.push(`role_grant_matrix[${grantor}] grants unknown role ${g}`);
      }
    }
  }

  for (const f of m.functions) {
    const expectCanal = f.function_key === "cargar_facturas";
    if (f.autorizada_por_canal !== expectCanal) {
      errors.push(
        `${f.function_key}: autorizada_por_canal should be ${expectCanal}`,
      );
    }
  }

  return errors;
}

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

// Expected event types — derived from the canonical source (data/events.json),
// not hand-maintained here. This keeps the check as "the BUILT bundle (EVENTS in
// dist) still reflects the source rows" instead of a third hand-kept copy.
const expectedEvents = JSON.parse(
  readFileSync(join("data", "events.json"), "utf8"),
).map((e) => e.type);
const expectedMetered = JSON.parse(
  readFileSync(join("data", "metered-operations.json"), "utf8"),
).operations.length;
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

const rolesOk =
  JSON.stringify(ROLE_KEYS) ===
    JSON.stringify(["superadmin", "admin", "approver", "uploader"]) &&
  JSON.stringify(PRIVILEGED_ROLE_KEYS) ===
    JSON.stringify(["superadmin", "admin"]);
console.log("Role C7 catalog:", rolesOk, ROLE_KEYS, PRIVILEGED_ROLE_KEYS);

const manifestErrors = verifyCompraManifest(COMPRA_MANIFEST);
console.log("compra manifest checks:", manifestErrors.length === 0 ? "ok" : manifestErrors);

const grantEvents = [
  "module_grant.created",
  "module_grant.role_changed",
  "module_grant.suspended",
  "module_grant.reactivated",
];
const grantEventsOk = grantEvents.every((t) => actualTypes.includes(t));
console.log("module_grant events present:", grantEventsOk);

const pass =
  ok1.ok === true &&
  ok2.ok === false &&
  MODULES.length === 15 &&
  MODULE_KEYS.length === 15 &&
  EVENTS.length === expectedEvents.length &&
  missing.length === 0 &&
  extra.length === 0 &&
  schema.additionalProperties === false &&
  !/"creditos"\s*:/.test(dataText) &&
  METERED_OPERATIONS.length === expectedMetered &&
  rolesOk &&
  manifestErrors.length === 0 &&
  grantEventsOk;

console.log(pass ? "\nDoD CHECK: PASS" : "\nDoD CHECK: FAIL");
process.exit(pass ? 0 : 1);
