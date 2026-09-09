/**
 * @suynda/contracts v0 — structural only.
 * Canonical definitions: /data (JSON) + /schema (JSON Schema).
 * This package wraps them for TypeScript; Python reads /data/*.json directly.
 * No commercial values. No business logic beyond validateEnvelope().
 */
export { MODULE_KEYS, MODULE_CLASSES, MODULE_LEVELS, PARTY_ROLES, IDENTITY_TYPES, CREDENTIAL_TYPES, IDENTIFIER_TYPES, LEDGER_TIPOS, PLAN_KEYS, ROLE_KEYS, PRIVILEGED_ROLE_KEYS, ITEM_TYPES, INVENTORY_OPERATION_TYPES, COST_STATES, PROVISIONAL_BASES, COST_FORMULAS, TRACKING_CLASSES, QUANTITY_BRANCHES, TRUE_UP_MODES, COST_EFFECT_KINDS, CONSEQUENCE_ROLES, MODULE_KINDS, CAPABILITY_AVAILABILITIES, ENTITLEMENT_STATUSES, LAUNCHER_ACTIONS, TOKEN_INITIATORS, ENUMS, } from "./enums.js";
export { MODULES, moduleByKey, } from "./modules.js";
export { COMPRA_MANIFEST, LAB_MANIFEST, DEPOSITO_MANIFEST, MANIFESTS, manifestByModuleKey, } from "./manifests.js";
export { EVENTS, EVENT_TYPES, } from "./events.js";
export { CAPABILITIES, } from "./capabilities.js";
export { ERROR_CODES, errorByCode, } from "./errors.js";
export { validateEnvelope, } from "./envelope.js";
export {} from "./reference.js";
export { METERED_OPERATIONS, } from "./metered-operations.js";
export {} from "./deposito.js";
// ── RC-wire (v0.13.0): el wire de los servicios compartidos de plataforma ────
// Foundation y Padrón (D21). NO es precedente para las APIs de un módulo.
export { FOUNDATION_JWKS_USERS_PATH, FOUNDATION_JWKS_SERVICES_PATH, FOUNDATION_ENTITLEMENTS_CHECK_PATH, FOUNDATION_ENTITLEMENTS_CHECK_MODULE_QUERY, FOUNDATION_SHELL_PATH, PLATFORM_JWT_ALG, } from "./foundation.js";
export { PADRON_PARTIES_PATH, PADRON_PARTIES_IDENTIFIER_QUERY, padronPartyPath, padronPartyRolesPath, IDEMPOTENCY_KEY_HEADER, IDEMPOTENCY_REPLAYED_HEADER, PARTY_IDENTIFIER_SEPARATOR, isIdentifierType, parsePartyIdentifier, formatPartyIdentifier, isPartyIdentifierString, } from "./padron.js";
export { isErrorEnvelope } from "./error-envelope.js";
//# sourceMappingURL=index.js.map