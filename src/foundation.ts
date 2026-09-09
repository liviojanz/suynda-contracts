/**
 * El wire de FOUNDATION, visto desde un consumidor — RC-wire (v0.13.0).
 *
 * ── OWNERSHIP (D21, 9-sep-2026) ─────────────────────────────────────────────
 *
 * Foundation es un SERVICIO COMPARTIDO DE PLATAFORMA: lo consume todo módulo,
 * no tiene OpenAPI propio consumible por tag, y sus paths ya estaban cableados
 * en tres repos distintos. Por eso su transporte —método, path, query, headers,
 * request, response— es contrato de plataforma y vive acá.
 *
 * ESTO NO ES PRECEDENTE PARA LAS APIs DE UN MÓDULO. Lab, Depósito, Ventas y los
 * que vengan conservan el transporte de sus propias APIs en su propio repo
 * (ver el encabezado de `src/deposito.ts`). La distinción es por clase de
 * servicio: plataforma compartida → contracts; módulo autónomo → su repo.
 *
 * Contracts declara el PROTOCOLO. Jamás la implementación de quien lo consume:
 * ni fetch, ni caché, ni retry, ni timeout, ni gracia, ni diagnóstico.
 *
 * ── LA REGLA DE FORMA (D13, D20) ────────────────────────────────────────────
 *
 * Todo lo de acá refleja lo que Foundation EMITE HOY, con los nombres tal cual
 * viajan — snake y camel mezclados incluidos—, sin alias y sin reinterpretar.
 * Se declara la superficie pública que el productor garantiza, la lean o no los
 * consumidores actuales. Evidencia por campo en docs/design/rc-wire-recon.md.
 */

import type {
  CapabilityAvailability,
  EntitlementStatus,
  LauncherAction,
  ModuleKey,
  ModuleKind,
  ModuleLevel,
  TokenInitiator,
} from "./enums.js";
import type { IsoDateTime } from "./deposito.js";

// ── Transporte ───────────────────────────────────────────────────────────────

/** GET. JWKS de los tokens de PERSONA. `foundation/src/http/routes/jwks.ts:14`. */
export const FOUNDATION_JWKS_USERS_PATH = "/.well-known/jwks-users.json" as const;

/** GET. JWKS de los tokens de SERVICIO. `jwks.ts:19`. */
export const FOUNDATION_JWKS_SERVICES_PATH = "/.well-known/jwks-services.json" as const;

/**
 * GET. ¿Este tenant tiene este módulo, y con qué funciones? Query
 * `module=<ModuleKey>`. Auth: token de persona, o de servicio con la claim
 * `capability: "entitlements.check"`. El tenant sale del TOKEN, jamás de la
 * query. Sin tenant → 403 `TENANT_MISMATCH`; `module` que no esté en
 * `MODULE_KEYS` → 400 `ENTITLEMENT_MODULE_INVALID`.
 * `foundation/src/http/routes/entitlements.ts:81-111`.
 */
export const FOUNDATION_ENTITLEMENTS_CHECK_PATH = "/v1/entitlements/check" as const;

/** El único query param de `/v1/entitlements/check`. `entitlements.ts:105`. */
export const FOUNDATION_ENTITLEMENTS_CHECK_MODULE_QUERY = "module" as const;

/**
 * GET. El marco: launcher, espacio, saldo, branding y la URL del hub. Auth:
 * SÓLO token de persona; el tenant sale del token.
 * `foundation/src/http/routes/shell.ts:45-53`.
 */
export const FOUNDATION_SHELL_PATH = "/v1/shell" as const;

/**
 * El algoritmo con que Foundation firma TODOS sus tokens, tal como va en el
 * header del JWT y en el `alg` de cada JWK. Es el nombre jose v6 (`"Ed25519"`),
 * no `"EdDSA"`. `foundation/src/auth/keys.ts:50`, `auth/jwt.ts:111`.
 */
export const PLATFORM_JWT_ALG = "Ed25519" as const;

// ── JWKS ─────────────────────────────────────────────────────────────────────

/**
 * Una clave pública publicada por Foundation. Es el export jose de una clave
 * Ed25519 más `kid`, `alg` y `use` (`keys.ts:91-93`). Sirve igual para las
 * dos audiencias.
 */
export interface PlatformJwk {
  kty: "OKP";
  crv: "Ed25519";
  /** La clave pública, base64url. */
  x: string;
  /** Thumbprint JWK de la clave (`keys.ts:91`). Con esto se elige la clave. */
  kid: string;
  alg: typeof PLATFORM_JWT_ALG;
  use: "sig";
}

/** El documento JWKS entero: `{ keys: [...] }` (`keys.ts:75`). */
export interface PlatformJwks {
  keys: PlatformJwk[];
}

// ── JWT ──────────────────────────────────────────────────────────────────────

/**
 * El header protegido, EXACTAMENTE lo que Foundation pone (`jwt.ts:111`):
 * `alg` y `kid`. Sin `typ`: Foundation no lo emite, y un consumidor no puede
 * exigirlo.
 */
export interface PlatformTokenHeader {
  alg: typeof PLATFORM_JWT_ALG;
  kid: string;
}

/**
 * Las claims de un token de Foundation —persona o servicio— con los nombres
 * TAL CUAL viajan (D13): `tenant_id` en snake, `mandateId` y `tutelaId` en
 * camel. No hay alias. Una normalización futura es una migración de protocolo
 * y se hace en una corrida BREAKING deliberada.
 * `foundation/src/auth/jwt.ts:3-4, 106-118`; `auth/session.ts:193, 291`.
 */
export interface PlatformTokenClaims {
  /** Id de la persona, o `service_key` del servicio. */
  sub: string;
  iss: string;
  /** Foundation emite un string, nunca un arreglo (`jwt.ts:114`). */
  aud: string;
  /** Segundos. */
  iat: number;
  nbf: number;
  exp: number;
  jti: string;
  initiator: TokenInitiator;
  /** Ausente = sesión sin espacio activo (`jwt.ts:107`). */
  tenant_id?: string;
  /**
   * Sólo en tokens de SERVICIO (`jwt.ts:108`). Es `string` porque así lo firma
   * Foundation (D27): quien necesite saber si pertenece al catálogo lo valida
   * explícitamente contra `CAPABILITIES`.
   */
  capability?: string;
  /** Sesión prestada por mandato (`session.ts:193`). */
  mandateId?: string;
  /** Sesión prestada por tutela (`session.ts:291`). Nunca convive con `mandateId`. */
  tutelaId?: string;
}

// ── Entitlements ─────────────────────────────────────────────────────────────

/** La query de `/v1/entitlements/check`. */
export interface EntitlementsCheckQuery {
  module: ModuleKey;
}

/**
 * Una función efectiva con su alcance, tal como viaja en `functions[]`
 * (`foundation/src/member-grants/service.ts:485-489`).
 *
 * `scope_type` es OPACO (D18): la dimensión que el módulo declaró en su
 * manifiesto, que Foundation guarda y devuelve sin interpretar. No hay enum
 * global de alcances a propósito. Lo que un consumidor derive de estos cuatro
 * campos —por ejemplo un `scoped` booleano— es suyo y no viaja.
 */
export interface ResolvedFunctionAccess {
  function_key: string;
  scope_type: string | null;
  scope_refs: string[];
  all_scopes: boolean;
}

/**
 * La respuesta de `GET /v1/entitlements/check`, campo por campo
 * (`foundation/src/http/routes/entitlements.ts:167-179`).
 *
 * `grants` y `functions` son `null` para un token de SERVICIO: sin persona en
 * el token no hay efectivo que resolver (`:130-136`). `cache_max_seconds` es lo
 * que Foundation permite cachear; la GRACIA que un módulo aplique cuando
 * Foundation no responde es implementación del módulo, no de este contrato.
 */
export interface EntitlementsCheckResponse {
  /** El tenant contra el que se respondió — el cliente lo confirma. */
  tenant_id: string;
  module: ModuleKey;
  activo: boolean;
  status: EntitlementStatus;
  valid_to: IsoDateTime | null;
  politica: CapabilityAvailability;
  cache_max_seconds: number;
  verificado_at: IsoDateTime;
  grants: string[] | null;
  functions: ResolvedFunctionAccess[] | null;
}

// ── Shell ────────────────────────────────────────────────────────────────────

export interface ShellUser {
  id: string;
  nombre: string;
}

/**
 * El espacio activo. `nombre_negocio` es el rótulo PARA MOSTRAR y nunca es
 * null; `razon_social` es la identidad legal del grupo y PUEDE ser null (un
 * grupo singleton no tiene identidad fiscal). `shell-service.ts:47-53`.
 */
export interface ShellTenant {
  id: string;
  razon_social: string | null;
  nombre_negocio: string;
}

/**
 * Un ítem del launcher (`shell-service.ts:16-42, 181-194`). Sólo módulos de
 * `clase: comercial`. En sesión prestada, `entitled` significa «el espacio lo
 * tiene Y esta sesión lo opera». `url` es `null` cuando el módulo no tiene
 * destino desplegado («Pronto»); compuesta por Foundation, jamás por quien
 * pinta.
 */
export interface ShellLauncherItem {
  key: ModuleKey;
  nombre: string;
  descripcion: string;
  /** `ModuleLevel` ya incluye `null` (data/enums.json): 1 o 2 para comercial. */
  nivel: ModuleLevel;
  entitled: boolean;
  action: LauncherAction;
  kind: ModuleKind | null;
  url: string | null;
}

/**
 * El saldo, en CRÉDITOS, no dinero (`credits-service.ts:68-74`).
 * `gracia_restante` es la gracia de sobregiro (§7.6): `null` cuando no aplica.
 */
export interface ShellBalance {
  saldo: number;
  en_sobregiro: boolean;
  bajo: boolean;
  gracia_restante: { operaciones: number; dias: number } | null;
}

/** White-label del espacio (`shell-service.ts:44-48`). Todo nullable. */
export interface ShellBranding {
  logo_url: string | null;
  color_primario: string | null;
  color_acento: string | null;
}

/** La URL del hub, UNA vez, arriba (`shell-service.ts:212`). */
export interface ShellPlatform {
  hub_url: string;
}

/**
 * La respuesta de `GET /v1/shell` (`shell-service.ts:50-87, 195-213`).
 * `tenant` es `null` si ni hay membresía ni sesión prestada; `balance` es
 * `null` cuando el espacio no tiene bolsillo (hoy: una tutelada).
 */
export interface ShellResponse {
  user: ShellUser;
  tenant: ShellTenant | null;
  launcher: ShellLauncherItem[];
  balance: ShellBalance | null;
  branding: ShellBranding;
  platform: ShellPlatform;
}
