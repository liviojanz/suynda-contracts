/**
 * Enums — canonical members live in data/enums.json.
 * Do not re-declare these lists elsewhere (§11 / architecture §6.7).
 */

import enumsData from "../data/enums.json" with { type: "json" };

export const MODULE_KEYS = enumsData.ModuleKey;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export const MODULE_CLASSES = enumsData.ModuleClass;
export type ModuleClass = (typeof MODULE_CLASSES)[number];

/** 1 | 2 for commercial modules; null for plataforma. */
export const MODULE_LEVELS = enumsData.ModuleLevel;
export type ModuleLevel = (typeof MODULE_LEVELS)[number];

export const PARTY_ROLES = enumsData.PartyRole;
export type PartyRole = (typeof PARTY_ROLES)[number];

export const IDENTITY_TYPES = enumsData.IdentityType;
export type IdentityType = (typeof IDENTITY_TYPES)[number];

export const CREDENTIAL_TYPES = enumsData.CredentialType;
export type CredentialType = (typeof CREDENTIAL_TYPES)[number];

export const IDENTIFIER_TYPES = enumsData.IdentifierType;
export type IdentifierType = (typeof IDENTIFIER_TYPES)[number];

/** [PROPUESTO] plan keys — prices live in Foundation module_plans, never here. */
export const PLAN_KEYS = enumsData.PlanKey.values;
export type PlanKey = (typeof PLAN_KEYS)[number];

/**
 * [PROPUESTO] membership roles within a tenant (catálogo C7).
 * `PRIVILEGED_ROLE_KEYS` require a personal identity (§2.4.4) and cannot be
 * created by password-only provisioning.
 */
export const ROLE_KEYS = enumsData.Role.values;
export type Role = (typeof ROLE_KEYS)[number];
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
} as const;
