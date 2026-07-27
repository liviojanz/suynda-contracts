/**
 * Event envelope types + the only runtime logic in this package:
 * validateEnvelope() runs the closed JSON Schema (additionalProperties: false).
 */
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormatsImport from "ajv-formats";
import envelopeSchema from "../schema/event-envelope.schema.json" with {
    type: "json"
};
// CJS interop under NodeNext / verbatimModuleSyntax
const addFormats = addFormatsImport;
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(envelopeSchema);
/**
 * Validates an object against schema/event-envelope.schema.json.
 * Rejects unknown fields (additionalProperties: false).
 * No business logic beyond schema validation.
 */
export function validateEnvelope(obj) {
    const ok = validate(obj);
    if (ok) {
        return { ok: true, errors: [] };
    }
    const errors = (validate.errors ?? []).map((e) => {
        const path = e.instancePath === "" ? "/" : e.instancePath;
        return `${path} ${e.message ?? "invalid"}`.trim();
    });
    return { ok: false, errors };
}
//# sourceMappingURL=envelope.js.map