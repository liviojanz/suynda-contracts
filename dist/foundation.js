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
// ── Transporte ───────────────────────────────────────────────────────────────
/** GET. JWKS de los tokens de PERSONA. `foundation/src/http/routes/jwks.ts:14`. */
export const FOUNDATION_JWKS_USERS_PATH = "/.well-known/jwks-users.json";
/** GET. JWKS de los tokens de SERVICIO. `jwks.ts:19`. */
export const FOUNDATION_JWKS_SERVICES_PATH = "/.well-known/jwks-services.json";
/**
 * GET. ¿Este tenant tiene este módulo, y con qué funciones? Query
 * `module=<ModuleKey>`. Auth: token de persona, o de servicio con la claim
 * `capability: "entitlements.check"`. El tenant sale del TOKEN, jamás de la
 * query. Sin tenant → 403 `TENANT_MISMATCH`; `module` que no esté en
 * `MODULE_KEYS` → 400 `ENTITLEMENT_MODULE_INVALID`.
 * `foundation/src/http/routes/entitlements.ts:81-111`.
 */
export const FOUNDATION_ENTITLEMENTS_CHECK_PATH = "/v1/entitlements/check";
/** El único query param de `/v1/entitlements/check`. `entitlements.ts:105`. */
export const FOUNDATION_ENTITLEMENTS_CHECK_MODULE_QUERY = "module";
/**
 * GET. El marco: launcher, espacio, saldo, branding y la URL del hub. Auth:
 * SÓLO token de persona; el tenant sale del token.
 * `foundation/src/http/routes/shell.ts:45-53`.
 */
export const FOUNDATION_SHELL_PATH = "/v1/shell";
/**
 * El algoritmo con que Foundation firma TODOS sus tokens, tal como va en el
 * header del JWT y en el `alg` de cada JWK. Es el nombre jose v6 (`"Ed25519"`),
 * no `"EdDSA"`. `foundation/src/auth/keys.ts:50`, `auth/jwt.ts:111`.
 */
export const PLATFORM_JWT_ALG = "Ed25519";
//# sourceMappingURL=foundation.js.map