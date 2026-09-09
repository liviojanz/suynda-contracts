/**
 * Enums — canonical members live in data/enums.json.
 * Do not re-declare these lists elsewhere (§11 / architecture §6.7).
 */
import enumsData from "../data/enums.json" with { type: "json" };
export const MODULE_KEYS = enumsData.ModuleKey;
export const MODULE_CLASSES = enumsData.ModuleClass;
/** 1 | 2 for commercial modules; null for plataforma. */
export const MODULE_LEVELS = enumsData.ModuleLevel;
export const PARTY_ROLES = enumsData.PartyRole;
export const IDENTITY_TYPES = enumsData.IdentityType;
export const CREDENTIAL_TYPES = enumsData.CredentialType;
export const IDENTIFIER_TYPES = enumsData.IdentifierType;
/**
 * Tipos de asiento del credit_ledger (v0.7.0, Frente 1 corrida A) — migrado
 * verbatim desde foundation `src/credits/repository.ts` + `welcome_gift`.
 * Foundation adopta este import en la corrida B del mismo frente.
 */
export const LEDGER_TIPOS = enumsData.LedgerTipo.values;
/** [PROPUESTO] plan keys — prices live in Foundation module_plans, never here. */
export const PLAN_KEYS = enumsData.PlanKey.values;
/**
 * [PROPUESTO] membership roles within a tenant (catálogo C7).
 * `PRIVILEGED_ROLE_KEYS` require a personal identity (§2.4.4) and cannot be
 * created by password-only provisioning.
 */
export const ROLE_KEYS = enumsData.Role.values;
export const PRIVILEGED_ROLE_KEYS = enumsData.Role.privileged;
// ── Depósito (RC v0.11.0) ────────────────────────────────────────────────────
// Source: SUYNDA-DEPOSITO-DOMAIN-v1.0-FROZEN — la justificación de cada lista
// vive en el `_note` de data/enums.json, no acá. ItemType es de Padrón
// (Enablement E2) y vive en el paquete porque Depósito lo consume.
export const ITEM_TYPES = enumsData.ItemType.values;
export const INVENTORY_OPERATION_TYPES = enumsData.InventoryOperationType.values;
export const COST_STATES = enumsData.CostState.values;
export const PROVISIONAL_BASES = enumsData.ProvisionalBasis.values;
export const COST_FORMULAS = enumsData.CostFormula.values;
export const TRACKING_CLASSES = enumsData.TrackingClass.values;
export const QUANTITY_BRANCHES = enumsData.QuantityBranch.values;
export const TRUE_UP_MODES = enumsData.TrueUpMode.values;
/** La NATURALEZA del efecto. REVERSAL no es kind: vive en ConsequenceRole. */
export const COST_EFFECT_KINDS = enumsData.CostEffectKind.values;
export const CONSEQUENCE_ROLES = enumsData.ConsequenceRole.values;
// ── RC-wire (v0.13.0) ───────────────────────────────────────────────────────
// D28: un tipo TS y un JSON Schema para la misma superficie beben del MISMO
// conjunto. ModuleKind y CapabilityAvailability eran uniones TS sin fuente
// material; ahora nacen acá y src/modules.ts / src/capabilities.ts las
// re-exportan por su path público de siempre. Los tres restantes son el wire
// de Foundation, verificados cerrados uno por uno (rc-wire-diseno.md §3).
export const MODULE_KINDS = enumsData.ModuleKind.values;
export const CAPABILITY_AVAILABILITIES = enumsData.CapabilityAvailability.values;
export const ENTITLEMENT_STATUSES = enumsData.EntitlementStatus.values;
export const LAUNCHER_ACTIONS = enumsData.LauncherAction.values;
export const TOKEN_INITIATORS = enumsData.TokenInitiator.values;
export const ENUMS = {
    ModuleKey: MODULE_KEYS,
    ModuleClass: MODULE_CLASSES,
    ModuleLevel: MODULE_LEVELS,
    PartyRole: PARTY_ROLES,
    IdentityType: IDENTITY_TYPES,
    CredentialType: CREDENTIAL_TYPES,
    IdentifierType: IDENTIFIER_TYPES,
    LedgerTipo: LEDGER_TIPOS,
    PlanKey: PLAN_KEYS,
    Role: ROLE_KEYS,
    ItemType: ITEM_TYPES,
    InventoryOperationType: INVENTORY_OPERATION_TYPES,
    CostState: COST_STATES,
    ProvisionalBasis: PROVISIONAL_BASES,
    CostFormula: COST_FORMULAS,
    TrackingClass: TRACKING_CLASSES,
    QuantityBranch: QUANTITY_BRANCHES,
    TrueUpMode: TRUE_UP_MODES,
    CostEffectKind: COST_EFFECT_KINDS,
    ConsequenceRole: CONSEQUENCE_ROLES,
    ModuleKind: MODULE_KINDS,
    CapabilityAvailability: CAPABILITY_AVAILABILITIES,
    EntitlementStatus: ENTITLEMENT_STATUSES,
    LauncherAction: LAUNCHER_ACTIONS,
    TokenInitiator: TOKEN_INITIATORS,
};
//# sourceMappingURL=enums.js.map