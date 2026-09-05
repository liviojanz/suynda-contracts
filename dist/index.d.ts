/**
 * @suynda/contracts v0 — structural only.
 * Canonical definitions: /data (JSON) + /schema (JSON Schema).
 * This package wraps them for TypeScript; Python reads /data/*.json directly.
 * No commercial values. No business logic beyond validateEnvelope().
 */
export { MODULE_KEYS, MODULE_CLASSES, MODULE_LEVELS, PARTY_ROLES, IDENTITY_TYPES, CREDENTIAL_TYPES, IDENTIFIER_TYPES, LEDGER_TIPOS, PLAN_KEYS, ROLE_KEYS, PRIVILEGED_ROLE_KEYS, ITEM_TYPES, INVENTORY_OPERATION_TYPES, COST_STATES, PROVISIONAL_BASES, COST_FORMULAS, TRACKING_CLASSES, QUANTITY_BRANCHES, TRUE_UP_MODES, COST_EFFECT_KINDS, CONSEQUENCE_ROLES, ENUMS, type ModuleKey, type ModuleClass, type ModuleLevel, type PartyRole, type IdentityType, type CredentialType, type IdentifierType, type LedgerTipo, type PlanKey, type Role, type ItemType, type InventoryOperationType, type CostState, type ProvisionalBasis, type CostFormula, type TrackingClass, type QuantityBranch, type TrueUpMode, type CostEffectKind, type ConsequenceRole, } from "./enums.js";
export { MODULES, moduleByKey, type ModuleSeed, type ModuleKind, } from "./modules.js";
export { COMPRA_MANIFEST, LAB_MANIFEST, DEPOSITO_MANIFEST, MANIFESTS, manifestByModuleKey, type ModuleManifest, type ManifestFunction, type ManifestRole, type ManifestPermissionPreset, } from "./manifests.js";
export { EVENTS, EVENT_TYPES, type EventCatalogEntry, type EventType, } from "./events.js";
export { CAPABILITIES, type Capability, type CapabilityKey, type CapabilityAvailability, type CapabilityInitiator, } from "./capabilities.js";
export { ERROR_CODES, errorByCode, type ErrorCode, type ErrorCodeKey, } from "./errors.js";
export { validateEnvelope, type EventEnvelope, type EventRef, type ValidateEnvelopeResult, } from "./envelope.js";
export { type ReferenceCacheColumns, type PartyReference, type ItemReference, type ReferenceColumns, } from "./reference.js";
export { METERED_OPERATIONS, type MeteredOperation, type MeteredOperationKey, } from "./metered-operations.js";
export { type DecimalString, type DepositCurrency, type PoolRef, type IsoDateTime, type CausalIdentity, type InventoryMovementDto, type CostEffectDto, type EconomicConsequence, type ProvocationLine, type InventoryProvocation, } from "./deposito.js";
//# sourceMappingURL=index.d.ts.map