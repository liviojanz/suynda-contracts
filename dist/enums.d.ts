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
/** [PROPUESTO] plan keys — prices live in Foundation module_plans, never here. */
export declare const PLAN_KEYS: string[];
export type PlanKey = (typeof PLAN_KEYS)[number];
/**
 * [PROPUESTO] membership roles within a tenant. `PRIVILEGED_ROLE_KEYS` require a
 * personal identity (§2.4.4) and cannot be created by password-only provisioning.
 */
export declare const ROLE_KEYS: string[];
export type Role = (typeof ROLE_KEYS)[number];
export declare const PRIVILEGED_ROLE_KEYS: string[];
export declare const ENUMS: {
    readonly ModuleKey: string[];
    readonly ModuleClass: string[];
    readonly ModuleLevel: (number | null)[];
    readonly PartyRole: string[];
    readonly IdentityType: string[];
    readonly CredentialType: string[];
    readonly IdentifierType: string[];
    readonly PlanKey: string[];
    readonly Role: string[];
};
//# sourceMappingURL=enums.d.ts.map