/**
 * Event envelope types + the only runtime logic in this package:
 * validateEnvelope() runs the closed JSON Schema (additionalProperties: false).
 */

import { Ajv2020 } from "ajv/dist/2020.js";
import type { ErrorObject } from "ajv";
import addFormatsImport from "ajv-formats";
import envelopeSchema from "../schema/event-envelope.schema.json" with {
  type: "json",
};
import type { ModuleKey } from "./enums.js";
import type { EventType } from "./events.js";

// CJS interop under NodeNext / verbatimModuleSyntax
const addFormats = addFormatsImport as unknown as (
  ajv: InstanceType<typeof Ajv2020>,
) => void;

/** Reference only — never business payload. */
export interface EventRef {
  id: string;
}

/**
 * Closed event envelope (§6.1 / §6.2).
 * Unknown fields are rejected by validateEnvelope.
 */
export interface EventEnvelope {
  event: EventType;
  /** Schema version of the message. */
  version: number;
  /** Idempotency key for subscribers. */
  event_id: string;
  /** Tenant UUID. */
  tenant_id: string;
  origen_module: ModuleKey;
  ref: EventRef;
  /** Monotonic per entity, set by the owner. */
  entity_version: number;
  /** Field names / counters only, never values. */
  change_mask: string[];
  /** ISO-8601 date-time. */
  occurred_at: string;
}

export interface ValidateEnvelopeResult {
  ok: boolean;
  errors: string[];
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validate = ajv.compile(envelopeSchema);

/**
 * Validates an object against schema/event-envelope.schema.json.
 * Rejects unknown fields (additionalProperties: false).
 * No business logic beyond schema validation.
 */
export function validateEnvelope(obj: unknown): ValidateEnvelopeResult {
  const ok = validate(obj) as boolean;
  if (ok) {
    return { ok: true, errors: [] };
  }
  const errors = (validate.errors ?? []).map((e: ErrorObject) => {
    const path = e.instancePath === "" ? "/" : e.instancePath;
    return `${path} ${e.message ?? "invalid"}`.trim();
  });
  return { ok: false, errors };
}
