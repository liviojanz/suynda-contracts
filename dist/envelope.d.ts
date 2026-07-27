/**
 * Event envelope types + the only runtime logic in this package:
 * validateEnvelope() runs the closed JSON Schema (additionalProperties: false).
 */
import type { ModuleKey } from "./enums.js";
import type { EventType } from "./events.js";
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
/**
 * Validates an object against schema/event-envelope.schema.json.
 * Rejects unknown fields (additionalProperties: false).
 * No business logic beyond schema validation.
 */
export declare function validateEnvelope(obj: unknown): ValidateEnvelopeResult;
//# sourceMappingURL=envelope.d.ts.map