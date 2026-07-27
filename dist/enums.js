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
/** [PROPUESTO] plan keys — prices live in Foundation module_plans, never here. */
export const PLAN_KEYS = enumsData.PlanKey.values;
/**
 * [PROPUESTO] membership roles within a tenant. `PRIVILEGED_ROLE_KEYS` require a
 * personal identity (§2.4.4) and cannot be created by password-only provisioning.
 */
export const ROLE_KEYS = enumsData.Role.values;
export const PRIVILEGED_ROLE_KEYS = enumsData.Role.privileged;
export const ENUMS = {
    ModuleKey: MODULE_KEYS,
    ModuleClass: MODULE_CLASSES,
    ModuleLevel: MODULE_LEVELS,
    PartyRole: PARTY_ROLES,
    IdentityType: IDENTITY_TYPES,
    CredentialType: CREDENTIAL_TYPES,
    IdentifierType: IDENTIFIER_TYPES,
    PlanKey: PLAN_KEYS,
    Role: ROLE_KEYS,
};
//# sourceMappingURL=enums.js.map