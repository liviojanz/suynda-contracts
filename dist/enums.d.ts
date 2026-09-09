/**
 * Enums — canonical members live in data/enums.json.
 * Do not re-declare these lists elsewhere (§11 / architecture §6.7).
 */
export declare const MODULE_KEYS: string[];
export type ModuleKey = (typeof MODULE_KEYS)[number];
export declare const MODULE_CLASSES: string[];
export type ModuleClass = (typeof MODULE_CLASSES)[number];
/** 1 | 2 for commercial modules; null for plataforma. */
export declare const MODULE_LEVELS: (number | null)[];
export type ModuleLevel = (typeof MODULE_LEVELS)[number];
export declare const PARTY_ROLES: string[];
export type PartyRole = (typeof PARTY_ROLES)[number];
export declare const IDENTITY_TYPES: string[];
export type IdentityType = (typeof IDENTITY_TYPES)[number];
export declare const CREDENTIAL_TYPES: string[];
export type CredentialType = (typeof CREDENTIAL_TYPES)[number];
export declare const IDENTIFIER_TYPES: string[];
export type IdentifierType = (typeof IDENTIFIER_TYPES)[number];
/**
 * Tipos de asiento del credit_ledger (v0.7.0, Frente 1 corrida A) — migrado
 * verbatim desde foundation `src/credits/repository.ts` + `welcome_gift`.
 * Foundation adopta este import en la corrida B del mismo frente.
 */
export declare const LEDGER_TIPOS: string[];
export type LedgerTipo = (typeof LEDGER_TIPOS)[number];
/** [PROPUESTO] plan keys — prices live in Foundation module_plans, never here. */
export declare const PLAN_KEYS: string[];
export type PlanKey = (typeof PLAN_KEYS)[number];
/**
 * [PROPUESTO] membership roles within a tenant (catálogo C7).
 * `PRIVILEGED_ROLE_KEYS` require a personal identity (§2.4.4) and cannot be
 * created by password-only provisioning.
 */
export declare const ROLE_KEYS: string[];
export type Role = (typeof ROLE_KEYS)[number];
export declare const PRIVILEGED_ROLE_KEYS: string[];
export declare const ITEM_TYPES: string[];
export type ItemType = (typeof ITEM_TYPES)[number];
export declare const INVENTORY_OPERATION_TYPES: string[];
export type InventoryOperationType = (typeof INVENTORY_OPERATION_TYPES)[number];
export declare const COST_STATES: string[];
export type CostState = (typeof COST_STATES)[number];
export declare const PROVISIONAL_BASES: string[];
export type ProvisionalBasis = (typeof PROVISIONAL_BASES)[number];
export declare const COST_FORMULAS: string[];
export type CostFormula = (typeof COST_FORMULAS)[number];
export declare const TRACKING_CLASSES: string[];
export type TrackingClass = (typeof TRACKING_CLASSES)[number];
export declare const QUANTITY_BRANCHES: string[];
export type QuantityBranch = (typeof QUANTITY_BRANCHES)[number];
export declare const TRUE_UP_MODES: string[];
export type TrueUpMode = (typeof TRUE_UP_MODES)[number];
/** La NATURALEZA del efecto. REVERSAL no es kind: vive en ConsequenceRole. */
export declare const COST_EFFECT_KINDS: string[];
export type CostEffectKind = (typeof COST_EFFECT_KINDS)[number];
export declare const CONSEQUENCE_ROLES: string[];
export type ConsequenceRole = (typeof CONSEQUENCE_ROLES)[number];
export declare const MODULE_KINDS: string[];
export type ModuleKind = (typeof MODULE_KINDS)[number];
export declare const CAPABILITY_AVAILABILITIES: string[];
export type CapabilityAvailability = (typeof CAPABILITY_AVAILABILITIES)[number];
export declare const ENTITLEMENT_STATUSES: string[];
export type EntitlementStatus = (typeof ENTITLEMENT_STATUSES)[number];
export declare const LAUNCHER_ACTIONS: string[];
export type LauncherAction = (typeof LAUNCHER_ACTIONS)[number];
export declare const TOKEN_INITIATORS: string[];
export type TokenInitiator = (typeof TOKEN_INITIATORS)[number];
export declare const ENUMS: {
    readonly ModuleKey: string[];
    readonly ModuleClass: string[];
    readonly ModuleLevel: (number | null)[];
    readonly PartyRole: string[];
    readonly IdentityType: string[];
    readonly CredentialType: string[];
    readonly IdentifierType: string[];
    readonly LedgerTipo: string[];
    readonly PlanKey: string[];
    readonly Role: string[];
    readonly ItemType: string[];
    readonly InventoryOperationType: string[];
    readonly CostState: string[];
    readonly ProvisionalBasis: string[];
    readonly CostFormula: string[];
    readonly TrackingClass: string[];
    readonly QuantityBranch: string[];
    readonly TrueUpMode: string[];
    readonly CostEffectKind: string[];
    readonly ConsequenceRole: string[];
    readonly ModuleKind: string[];
    readonly CapabilityAvailability: string[];
    readonly EntitlementStatus: string[];
    readonly LauncherAction: string[];
    readonly TokenInitiator: string[];
};
//# sourceMappingURL=enums.d.ts.map