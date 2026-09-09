# RC-wire — RECON: el wire real entre procesos, antes de E1

**Fecha:** 9 de septiembre de 2026 · **Estado:** RECON **confirmado en su dirección** por el
fundador el 9-sep; D14, D15 y D20 firmadas; D13, D16–D19 y D21 esperando firma con texto a la vista ·
**Clase de evidencia:** DOC-A — todo lo afirmado se leyó en código, con `file:line`; lo marcado
*(propuesta)* es DOC-B. **Write-scope de este documento:** este archivo, untracked. No se tocó código
en ningún repo.

> **Resoluciones firmadas (9-sep):**
> **D14 APROBADA** — el codec del identificador `TIPO:PAIS:VALOR` pertenece a contracts, con
> operaciones **puras** solamente: parse, format, validate y los tipos/enums necesarios. Sin HTTP,
> fetch, diagnóstico, autorización, reglas de dominio de Padrón ni conducta del SDK. Un codec
> canónico, no un SDK adentro de contracts.
> **D15 APROBADA** — se promueven `INTERNAL`, `BAD_REQUEST` y `ENTITLEMENT_MODULE_INVALID`; **no**
> se promueven `TENANT_MISSING`, `NOT_FOUND` ni `PADRON_UNAVAILABLE` mientras sean módulo → su propio
> navegador. La prueba de pertenencia es **observabilidad entre repos/procesos**, no conveniencia.
> **D20 APROBADA CON CORRECCIÓN DE CRITERIO** — no rige «todo campo que el productor serializa entra».
> Rige: **contracts declara la superficie pública completa que el productor se compromete a
> garantizar**, la lean o no los consumidores de hoy. En el diseño, cada campo servido se clasifica
> como (1) público/garantizado → contracts, (2) incidental/no contractual → no entra, (3) ambiguo →
> decisión explícita antes de implementar. Ni contrato reducido por consumidor, ni congelación
> accidental de detalles internos.
> **Fuera de RC-wire, con dueño propio:** el endpoint de búsqueda de Padrón documentado e inexistente
> (C.1) no se implementa acá; Lab usando `razon_social` donde corresponde `nombre_negocio` (C.2) es
> deuda de Lab/E1 y Lab no se toca en esta corrida.
> **Tag `v0.13.0`** confirmado si la corrida queda puramente aditiva y compatible.

**Base leída:** `suynda-foundation` working copy sobre `e99b6a1` · `suynda-padron` `810c29a` ·
`lab` `adc6872` · `suynda-contracts` `v0.12.0` (`6bb273d`) · `facturas-py` `7a25310` ·
`suynda-landing` `b3a95eb`.

**La regla de ownership que se aplica, literal:**

> Si productor y consumidor viven en procesos/repos distintos y tienen que coincidir exactamente en
> un path, query param, request shape, response shape, enum, envelope o error code para comunicarse,
> ese dato es candidato a `@suynda/contracts`.
>
> Si describe cómo se consume esa comunicación —fetch, cache, retry, timeout, diagnóstico,
> fail-closed, adaptación— NO es Contracts.

---

## 0. Lo que el recon encontró, en seis líneas

1. **Contracts declara hoy CERO del wire HTTP.** Tiene enums, capabilities, códigos, el sobre de
   eventos y el manifiesto; **ningún path, ningún shape de request o response, ningún claim de JWT,
   ningún sobre de error.** Todo eso vive como literales y tipos locales en Foundation, Padrón, Lab,
   compra y el hub — y ya está duplicado con diferencias.
2. **Seis superficies son wire real entre repos distintos** y entran a RC-wire: el JWKS y el JWT de
   Foundation, `GET /v1/entitlements/check`, `GET /v1/shell`, la API de parties de Padrón, el sobre
   de error, y cuatro códigos que hoy viajan sin estar declarados.
3. **El sobre `{ error: { code, message } }` es contrato real**: lo producen Foundation, Padrón y Lab
   con la misma forma, y lo leen el hub (por `error.code`) y Lab (del lado de Padrón). Compra es el
   único que no lo usa para lo suyo: responde `{ detail }` de FastAPI.
4. **De los cuatro códigos preguntados, uno se promueve y tres no.** `INTERNAL` sí viaja entre
   repos, y los dos productores lo declaran «sin lugar en el contrato» mientras lo emiten.
   `TENANT_MISSING`, `NOT_FOUND` y `PADRON_UNAVAILABLE` son del módulo hacia su propio navegador.
   Aparecen **dos códigos que nadie preguntó y sí son wire**: `BAD_REQUEST` y
   `ENTITLEMENT_MODULE_INVALID`.
5. **Dos divergencias que valen solas:** el contrato de arquitectura lista un endpoint de Padrón que
   no existe (`GET /padron/v1/parties?role=&q=`), y Lab pinta el espacio con `razon_social`, que el
   productor declara nullable, cuando el campo hecho para mostrar es `nombre_negocio`.
6. **Lo que NO es wire y hay que dejar donde está:** la gracia y la caché de entitlements, el
   `scoped` derivado, los parsers del identificador, el diagnóstico de red, el cuerpo de
   `/api/shell` que cada módulo le sirve a su propio navegador, y el `Cache-Control` del JWKS.

---

## 1. La tabla principal

| superficie | productor | consumidor(es) | archivo/líneas productor | archivo/líneas consumidor | wire observado | divergencias | ownership propuesto |
|---|---|---|---|---|---|---|---|
| **1 · JWKS de usuarios** | Foundation | Lab · compra · Padrón | `src/http/routes/jwks.ts:14-17` · `src/auth/keys.ts:49-50, 75, 91-93` | lab `src/platform/user-session.ts:47-64`, `jwt-ed25519.ts:4-11, 43-60` · compra `backend/core/auth.py:82-85, 122-132` · padrón `src/http/token-verifier.ts:1-8, 47-58` | `GET /.well-known/jwks-users.json` → `{ keys: JWK[] }`; JWK = export jose de Ed25519 + `kid` (thumbprint) + `alg: "Ed25519"` + `use: "sig"` ⇒ `kty:"OKP"`, `crv:"Ed25519"`, `x`, `kid`, `alg`, `use`. Header `cache-control: public, max-age=300` | ninguna de forma. Lab exige `kty`/`crv`/`x` y trata `kid`/`alg`/`use` como opcionales — más laxo que el productor, correcto | **Contracts**: path, shape del JWK y `alg`. La caché y el refresco → SDK |
| **2 · JWKS de servicios** | Foundation | compra · Padrón | `jwks.ts:19-22` | compra `auth.py:90-92, 100-110` · padrón `token-verifier.ts:57-58` | `GET /.well-known/jwks-services.json`, misma forma | Lab no lo consume: no llama con token de servicio | **Contracts**: path (misma forma que 1) |
| **3 · JWT de persona y de servicio** | Foundation | Lab · compra · Padrón · hub (vía Foundation) | `src/auth/jwt.ts:3-4, 106-118` · `src/auth/session.ts:193, 291` | lab `jwt-ed25519.ts:13-23, 43-46` · compra `auth.py:340-356` · padrón `token-verifier.ts:14-24, 71-88` | header `{ alg: "Ed25519", kid }`; claims `sub`, `iss`, `aud`, `iat`, `nbf`, `exp`, `jti`, `initiator: "user"\|"system"`, `tenant_id?`, `capability?` (servicio), `mandateId?` y `tutelaId?` (sesión prestada) | **nombres mezclados**: `tenant_id` en snake, `mandateId`/`tutelaId` en camel. Lab no lee `mandateId`/`tutelaId`; compra sí | **Contracts**: nombres de claims, valores de `initiator`, `alg`. La verificación → SDK |
| **4 · Entitlement check** | Foundation | Lab · compra | `src/http/routes/entitlements.ts:81-179` · `src/entitlements/service.ts:23-38, 90-126` · `src/member-grants/service.ts:43, 485-489` | lab `src/platform/entitlement.ts:26-36, 84-104, 133-152, 187-229` · compra `auth.py:402-410, 450, 636-637, 656-657` | `GET /v1/entitlements/check?module=<ModuleKey>`; auth: token de persona **o** de servicio con `capability: "entitlements.check"`; tenant del token, sin tenant → 403 `TENANT_MISMATCH`; `module` inválido → 400 `ENTITLEMENT_MODULE_INVALID`. Response en §2.3 | `ENTITLEMENT_MODULE_INVALID` **no está en contracts**. Lab ignora `status` y `valid_to`; compra ignora `functions` y `politica`. Ninguna divergencia entre la Guía v2 §4 y el runtime | **Contracts**: path, query, response, enum `EntitlementStatus`, shape de `functions[]`. Gracia, caché y `scoped` derivado → SDK |
| **5 · Shell** | Foundation | Lab · hub | `src/shell/shell-service.ts:15-87, 172-212` · `src/http/routes/shell.ts:45-53` · `src/credits/credits-service.ts:68-74` | lab `src/platform/shell-client.ts:32-66, 110, 138-220` · hub `src/scripts/shell.ts:61-79, 158, 188, 400, 465` · hub `src/pages/api/shell.ts:13-24` (proxy puro) · hub `src/lib/activacion.ts` (`url`, `entitled`) · hub `src/pages/api/modulos/[modulo]/alcances.ts:49-57` (`launcher[].url`) | `GET /v1/shell`, **sólo token de persona**, tenant del token. Response en §2.5 | Lab pinta el espacio con `tenant.razon_social` (nullable por diseño, `shell-service.ts:47-53`); el hub con `nombre_negocio`, que es el campo hecho para mostrar. `branding`, `nivel`, `gracia_restante`, `user.id` **servidos y no consumidos por nadie**. El hub tipa `balance` como no-nulo cuando el productor lo declara `\| null` | **Contracts**: path, response entera, enum `LauncherAction`. El cuerpo de `/api/shell` del módulo → SDK |
| **6 · Padrón — parties** | Padrón | Lab · Foundation | `src/http/routes/parties.ts:33-58, 88-126, 281-358` · `src/http/authn.ts:63-96` · `src/party-service.ts:43-48, 57-72` · `src/db/types.ts:14-73` | lab `src/padron/contract.ts` (entero) · `src/padron/client.ts:44-97, 118-127` · foundation `src/padron/client.ts:13-19, 118-149` | paths, params, formato `TIPO:PAIS:VALOR`, bodies, `PartyDetails`, `{ party, created }`, headers `idempotency-key` / `idempotency-replayed`. Detalle en §2.6 | Lab tipa `roles/contacts/branches` como `unknown[]` y `PartyRow` con 5 de 13 campos; Foundation declara `identifier?` opcional donde el schema lo exige; `ARCHITECTURE.md:308` lista `?role=&q=` **que no está implementado**; `?identifier` ausente responde 404 y no 400 | **Contracts**: paths, params, formato del identificador, request y response shapes, headers. Los parsers y `assertNoLabOwnedPartyRole` → SDK / dominio |
| **7 · Sobre de error** | Foundation · Padrón · Lab | hub · Lab · (compra no) | foundation `src/http/server.ts:614-634`, `src/http/errors.ts:1-16` · padrón `src/http/server.ts:78-96`, `src/http/errors.ts:22-24` · lab `src/platform/errors.ts:148-152` | hub `src/scripts/equipo.ts:161, 496`, `src/scripts/activar.ts:233`, `src/lib/activacion.ts:127` · lab `src/padron/client.ts:118-127` | `{ error: { code: string, message: string, detail?: unknown } }` con el status HTTP del código | compra responde `{ detail: … }` de FastAPI para lo suyo (`auth.py:61, 112, 134, 462-467`) y lee la respuesta de Foundation sólo por status (`raise_for_status`, `:409`) | **Contracts**: el sobre, como schema. `detail` opcional, declarado |
| **8 · Códigos observables sin declarar** | Foundation · Padrón | todos | foundation `server.ts:624-633` (`INTERNAL`, `BAD_REQUEST`), `entitlements.ts:105-111` (`ENTITLEMENT_MODULE_INVALID`) · padrón `server.ts:87-96` | cualquier caller | tres códigos que **viajan** y no están en `data/error-codes.json` | los dos productores anotan que `INTERNAL` «no tiene lugar en el contrato entre módulos» (`errors.ts` de ambos) **y lo emiten al wire** | **Contracts**, con firma — ver D15 |
| **9 · Headers de idempotencia** | Padrón | Lab · Foundation | `authn.ts:89-96` (`idempotency-key`) · `parties.ts:76-84` (`idempotency-replayed: true`) | lab `client.ts:81-82` · foundation `client.ts:129` | nombre del header de request y del de replay | — | **Contracts**: dos constantes |

---

## 2. Los shapes, campo por campo

### 2.1 · JWK dentro de `{ keys: [...] }`

| campo | tipo observado | required/optional | nullable | productor lo emite | consumidor lo usa | observaciones |
|---|---|---|---|---|---|---|
| `kty` | `"OKP"` | required | no | jose export (`keys.ts:92`) | Lab exige `"OKP"` (`jwt-ed25519.ts:53`); compra y Padrón lo delegan a jose | — |
| `crv` | `"Ed25519"` | required | no | ídem | Lab exige (`:53`) | — |
| `x` | string base64url | required | no | ídem | Lab (`:58`) | la clave pública |
| `kid` | string (thumbprint JWK) | required | no | `keys.ts:91-92` | los tres, para elegir la clave (`jwt-ed25519.ts:49`, `auth.py:128`, jose) | Lab lo tipa opcional; el productor siempre lo pone |
| `alg` | `"Ed25519"` | required | no | `keys.ts:49-50, 92` | Lab lo valida si está (`:56`) | es el nombre jose v6, no `"EdDSA"` |
| `use` | `"sig"` | required | no | `keys.ts:92` | nadie | — |

### 2.2 · Claims del JWT

| campo | tipo observado | required/optional | nullable | productor lo emite | consumidor lo usa | observaciones |
|---|---|---|---|---|---|---|
| header `alg` | `"Ed25519"` | required | no | `jwt.ts:111` | Lab exige (`jwt-ed25519.ts:45`); Padrón y compra vía jose | — |
| header `kid` | string | required | no | `jwt.ts:111` | los tres | — |
| `sub` | string (user id o service key) | required | no | `:112` | los tres | — |
| `iss`, `aud` | string; `aud` string | required | no | `:113-114` | los tres | valores de config, no de contrato |
| `iat`, `nbf`, `exp` | number (segundos) | required | no | `:115-117` | los tres | — |
| `jti` | uuid | required | no | `:118` | Lab lo copia a la sesión | replay guard de Foundation |
| `initiator` | `"user"` o `"system"` | required | no | `:106` | Padrón (`token-verifier.ts:71-73`), Lab tipa `"user"` | mismo vocabulario que `initiator` de capabilities |
| `tenant_id` | uuid | optional | no | `:107` | los tres | ausente ⇒ sesión sin espacio activo |
| `capability` | CapabilityKey | optional (sólo servicio) | no | `:108` | Padrón (`:79`), Foundation (`requireCapability`) | — |
| `mandateId` | uuid | optional | no | `session.ts:193` | compra (`auth.py:352`); Foundation lo relee (`entitlements.ts:135`) | **camelCase**, a diferencia de `tenant_id` |
| `tutelaId` | uuid | optional | no | `session.ts:291` | compra (`:356`) | ídem |

### 2.3 · Response de `GET /v1/entitlements/check`

| campo | tipo observado | required/optional | nullable | productor lo emite | consumidor lo usa | observaciones |
|---|---|---|---|---|---|---|
| `tenant_id` | uuid | required | no | `entitlements.ts:168` | Lab compara con el token (`entitlement.ts:89`) | «el cliente confirma contra qué se respondió» |
| `module` | ModuleKey | required | no | `:169` | Lab compara con el suyo (`:93`) | — |
| `activo` | boolean | required | no | `:170` | Lab (`:97`), compra (`auth.py:636`) | — |
| `status` | `"active"`, `"suspended"`, `"vencido"`, `"ausente"`, `"plataforma"` | required | no | `:171`; enum en `service.ts:23-28` | compra (`:637`, mensajes por status); **Lab no** | **enum local de Foundation, no está en contracts** |
| `valid_to` | ISO string | required | **sí** | `:172` | nadie | — |
| `politica` | CapabilityAvailability (`"FAIL_AFTER_GRACE"` hoy) | required | no | `:175`; `service.ts:47-56` | Lab lo compara con el catálogo (`entitlement.ts:161-163`) | el tipo ya es de contracts |
| `cache_max_seconds` | number > 0 | required | no | `:176`; ≤ 300 en sesión prestada (`:155-160`) | Lab (`:99-102`), compra como gracia (`auth.py:450`) | — |
| `verificado_at` | ISO string | required | no | `:177` | Lab exige presencia (`:171-176`) | — |
| `grants` | `string[]` | required | **sí** (servicio) | `:178`; `null` si `initiator !== "user"` (`:130-136`) | compra (`auth.py:656`); **Lab no** | congelado por `entitlements-functions.pgtest.ts` |
| `functions` | `ResolvedFunctionAccess[]` | required | **sí** (servicio) | `:179` | Lab (`entitlement.ts:104, 187-229`); **compra no** | ver 2.4 |

### 2.4 · Ítem de `functions[]`

| campo | tipo observado | required/optional | nullable | productor lo emite | consumidor lo usa | observaciones |
|---|---|---|---|---|---|---|
| `function_key` | string | required | no | `member-grants/service.ts:488` | Lab | — |
| `scope_type` | string | required | **sí** | `:470-471` (el real del catálogo, jamás inventado) | Lab | opaco por diseño |
| `scope_refs` | `string[]` | required | no | `:485-489` | Lab | vacío + `all_scopes:false` ⇒ niega |
| `all_scopes` | boolean | required | no | ídem | Lab | — |
| `scoped` | — | — | — | **no viaja** | Lab lo deriva (`entitlement.ts:14-16, 221`) | implementación del consumidor |

### 2.5 · Response de `GET /v1/shell`

| campo | tipo observado | required/optional | nullable | productor lo emite | consumidor lo usa | observaciones |
|---|---|---|---|---|---|---|
| `user.id` | uuid | required | no | `shell-service.ts:196` | nadie | — |
| `user.nombre` | string | required | no | `:196` | Lab (`shell-client.ts:203-207`), hub (`shell.ts:400`) | — |
| `tenant` | objeto | required | **sí** | `:197-210` | Lab y hub lo tratan como opcional | `null` si ni membresía ni sesión prestada |
| `tenant.id` | uuid | required | no | `:199` | hub tipa, no usa | — |
| `tenant.razon_social` | string | required | **sí** | `:200`; nullable por diseño (`:47-53`) | **Lab** (`shell-client.ts:209-215`) | **divergencia**: el campo para mostrar es `nombre_negocio` |
| `tenant.nombre_negocio` | string | required | no | `:201` | hub (`shell.ts:465, 584`) | «nunca es null» |
| `launcher[]` | array | required | no | `:181-194` | Lab, hub | sólo `clase: comercial` (`:182`) |
| `launcher[].key` | ModuleKey | required | no | `:185` | Lab, hub | — |
| `launcher[].nombre`, `.descripcion` | string | required | no | `:186-187` | Lab; hub `descripcion` (activación) | — |
| `launcher[].nivel` | ModuleLevel | required | **sí** | `:188` | nadie | — |
| `launcher[].entitled` | boolean | required | no | `:189` | Lab, hub | en sesión prestada = «lo tiene y esta sesión lo opera» (`:163-169`) |
| `launcher[].action` | `"open"` o `"expand"` | required | no | `:190` | Lab | enum local `LauncherAction` (`:15`), no en contracts |
| `launcher[].kind` | ModuleKind | required | **sí** | `:191` | Lab (agrupa el riel) | tipo ya de contracts |
| `launcher[].url` | `https://<subdomain>.<PLATFORM_BASE_DOMAIN>` | required | **sí** | `:192` | Lab, hub (activación, alcances) | `null` = «Pronto» |
| `balance` | objeto | required | **sí** | `:216-231`; `null` para tutelada | Lab (`:180-188`), hub (`:188`) | hub lo tipa **no-nulo** |
| `balance.saldo` | number | required | no | `credits-service.ts:69` | Lab, hub | créditos, no dinero |
| `balance.en_sobregiro`, `.bajo` | boolean | required | no | `:70-72` | Lab, hub | — |
| `balance.gracia_restante` | `{ operaciones, dias }` | required | **sí** | `:73` | nadie | — |
| `branding` | `{ logo_url, color_primario, color_acento }` (los tres nullable) | required | no | `:211`, `:41-45` | nadie | — |
| `platform.hub_url` | `https://<dominio>/panel` | required | no | `:212` | Lab (`shell-client.ts:145-152`) | una sola vez, arriba |

### 2.6 · Padrón — parties

**Rutas y auth** (`parties.ts`; capability por ruta; tenant del token, `authn.ts:82-87`):

| ruta | capability | idempotencia | respuesta |
|---|---|---|---|
| `POST /padron/v1/parties` | `padron.party.create` | `idempotency-key` obligatorio (`authn.ts:89-96`) | `201` creado / `200` existente, `{ party: PartyRow, created: boolean }` (`:113-116`); replay lleva `idempotency-replayed: true` (`:76-84`) |
| `GET /padron/v1/parties?identifier=TIPO:PAIS:VALOR` | `padron.party.read` | — | `PartyDetails` (`:316-336`); sin `identifier` → **404** `PADRON_PARTY_NOT_FOUND` con detalle «identifier query required» (`:325`) |
| `GET /padron/v1/parties/:id` | `padron.party.read` | — | `PartyDetails` (`:338-346`) |
| `GET /padron/v1/parties/:id/roles` | `padron.party.read` | — | `{ roles: PartyRoleRow[] }` (`:348-358`) |
| `POST …/:id/roles`, `…/:id/identifiers`, `…/:id/contacts`, `…/:id/roles/:rol/deactivate`, `…/:id/deactivate`, `…/consumidor-final` | `padron.party.create` | sí | varias (`:128-314`) |

**Formato del identificador** — el mismo parser, escrito dos veces: Padrón `parties.ts:326-329` y Lab
`contract.ts:20-32`. `TIPO:PAIS:VALOR`; `PAIS` vacío ⇒ `null` ⇒ **normalizado a `PY`**
(`party-service.ts:57-72`); `VALOR` en mayúsculas sin espacios. `TIPO` ∈ `IdentifierType` de contracts
(`RUC`, `CI`, `PASSPORT`, `FOREIGN_TAX_ID`) — **Lab lo valida contra el enum** (`contract.ts:17-19`);
**Padrón acepta cualquier string ≤ 20 y castea** (`parties.ts:44-47, 327`).

**Body de upsert** (`parties.ts:33-58`, `additionalProperties: false`):

| campo | tipo | required | nullable | Lab lo manda | Foundation lo manda |
|---|---|---|---|---|---|
| `identifier.tipo` | string ≤ 20 | required | no | sí (`client.ts:88`) | sí, **pero su tipo lo declara opcional** (`foundation/src/padron/client.ts:15`) |
| `identifier.countryCode` | string ≤ 4 | optional | **sí** | sí | sí |
| `identifier.valor` | string ≤ 64 | required | no | sí | sí |
| `razonSocial` | string ≤ 250 | required | no | sí | sí |
| `fields` | object | optional | no | no | no |
| `roles` | `string[]` ≤ 8, casteado a `PartyRole[]` | optional | no | no (Lab lo prohíbe: `contract.ts:88-97`) | sí |

**`PartyRow` en el wire** (`db/types.ts:14-28`; las fechas salen como ISO string por JSON):

| campo | tipo | nullable | Lab lo tipa | Lab lo usa |
|---|---|---|---|---|
| `id`, `tenant_id`, `razon_social` | string | no | sí | sí |
| `tipo` | `"fisica"` o `"juridica"` | **sí** | no | no |
| `nombre_fantasia`, `tipo_contribuyente`, `tipo_regimen` | string | **sí** | no | no |
| `actividades_economicas` | unknown | **sí** | no | no |
| `es_consumidor_final` | boolean | no | no | no |
| `entity_version` | number | no | sí | sí |
| `deleted_at` | ISO string | **sí** | sí (como string — correcto en el wire) | sí |
| `created_at`, `updated_at` | ISO string | no | no | no |

**`PartyDetails`** (`party-service.ts:43-48`) = `{ party: PartyRow, roles: PartyRoleRow[], contacts:
PartyContactRow[], branches: PartyBranchRow[] }`. Lab tipa las tres listas como `unknown[]`
(`contract.ts:64-68`). Los shapes reales: `PartyRoleRow { id, tenant_id, party_id, rol: PartyRole,
activo, activated_at, deactivated_at | null }` (`types.ts:41-49`); `PartyContactRow { id, tenant_id,
party_id, tipo | null, valor | null, principal, created_at }` (`:51-59`); `PartyBranchRow { id,
tenant_id, party_id, codigo | null, nombre | null, direccion | null, ciudad_id | null, tipo | null,
entity_version, created_at, updated_at }` (`:61-73`).

**Códigos que Padrón emite** (conteo en `src/`): `PADRON_PARTY_NOT_FOUND` ×11, `PADRON_ITEM_NOT_FOUND`
×6, `AUTH_TOKEN_INVALID` ×4, `PADRON_IDENTIFIER_CONFLICT` ×3, `CAPABILITY_DENIED` ×2,
`TENANT_MISMATCH`, `PADRON_CONSUMIDOR_FINAL_PROTECTED`, `PADRON_BRANCH_NOT_FOUND`,
`IDEMPOTENCY_KEY_REQUIRED`, `IDEMPOTENCY_IN_PROGRESS`, `AUTH_UNAUTHENTICATED` — **todos en contracts**,
más `INTERNAL` y `BAD_REQUEST` del manejador (`server.ts:87-96`), que no.

### 2.7 · El sobre de error

| campo | tipo | required | nullable | lo emiten | lo leen |
|---|---|---|---|---|---|
| `error.code` | string (ErrorCodeKey, `INTERNAL`, `BAD_REQUEST`, o local del módulo) | required | no | Foundation, Padrón, Lab | hub, Lab |
| `error.message` | string es-PY | required | no | los tres | hub (a veces), Lab (para no-found de Padrón) |
| `error.detail` | unknown | optional | — | Padrón (`errors.ts:22-24`); Foundation en `AppError(code, detail)` | nadie leído |

---

## 3. Clasificación final — cada hallazgo en una sola categoría

| # | hallazgo | categoría |
|---|---|---|
| 1 | Path y shape del JWKS (usuarios y servicios), `alg: "Ed25519"` | **1 · Contracts** |
| 2 | Nombres de claims del JWT, valores de `initiator`, header `alg`/`kid` | **1 · Contracts** |
| 3 | `GET /v1/entitlements/check`: path, query, auth, response, enum `EntitlementStatus`, ítem de `functions[]` | **1 · Contracts** |
| 4 | `GET /v1/shell`: path, response entera, enum `LauncherAction` | **1 · Contracts** |
| 5 | Padrón parties: paths, params, formato `TIPO:PAIS:VALOR`, body de upsert, `PartyRow`, `PartyDetails` con sus tres filas, `{ party, created }`, headers de idempotencia | **1 · Contracts** |
| 6 | El sobre `{ error: { code, message, detail? } }` | **1 · Contracts** |
| 7 | `INTERNAL`, `BAD_REQUEST`, `ENTITLEMENT_MODULE_INVALID` — viajan sin estar declarados | **1 · Contracts**, con firma (D15) |
| 8 | Caché de JWKS con TTL y refresco por `kid` desconocido (Lab, compra, jose) | **4 · `@suynda/modulo`** |
| 9 | Gracia contractual y caché de entitlements; `scoped` derivado; validación del `politica` contra el catálogo | **4 · `@suynda/modulo`** |
| 10 | `traerMarco`: parseo desconfiado, descarte por ítem, mordaza del token en el log | **4 · `@suynda/modulo`** |
| 11 | El cuerpo de `/api/shell` que el módulo sirve a su navegador (`disponible`, `propio`, …) | **4 · `@suynda/modulo`** — es módulo→navegador del mismo módulo |
| 12 | Parser y formateador del identificador, cliente de Padrón, diagnóstico de red | **4 · `@suynda/modulo`** (o codec en contracts — D14) |
| 13 | `TENANT_MISSING`, `NOT_FOUND`, `PADRON_UNAVAILABLE`, `MODULE_ENTITLEMENT_UNAVAILABLE` (compra) | **4 · `@suynda/modulo`** / módulo — códigos hacia el propio navegador; ver D15 |
| 14 | `assertNoLabOwnedPartyRole` (Lab no crea `medico`/`centro`) | **6 · Dominio del módulo** |
| 15 | `Cache-Control: max-age=300` del JWKS; tope de 300 s en sesión prestada; `null` de `grants` para servicios | **2 · Implementación de Foundation** (conducta, no forma) |
| 16 | Normalización del identificador a `PY` y mayúsculas; `?identifier` ausente ⇒ 404 | **3 · Implementación de Padrón** (la segunda es además deuda — C.6) |
| 17 | Compra responde `{ detail }` en vez del sobre | **7 · Deuda**, dueño compra, fuera de RC-wire |
| 18 | `ARCHITECTURE.md:308` lista `GET /padron/v1/parties?role=&q=` que no existe | **7 · Divergencia** contrato/runtime — se reporta, no se edita (§0.1) |
| 19 | Lab pinta el espacio con `razon_social` nullable en vez de `nombre_negocio` | **7 · Deuda**, dueño Lab (coordinado con su gemelo); el SDK en E1 elige `nombre_negocio` |
| 20 | Foundation declara `identifier?` opcional donde el schema de Padrón lo exige | **7 · Deuda**, dueño Foundation |
| 21 | Nombres mezclados en el JWT (`tenant_id` vs `mandateId`/`tutelaId`) | **7 · Deuda** — se declara como está (D13), no se renombra |
| 22 | `integracion-de-un-modulo.md` §3.5 escribe el error como `{ code }` y el sobre real es `{ error: { code, message } }` | **7 · Divergencia** de doc, dueño contracts; se corrige en el diseño de RC-wire |
| 23 | Campos servidos que nadie consume: `branding`, `launcher[].nivel`, `balance.gracia_restante`, `user.id`, `valid_to` | **1 · Contracts** los declara igual — son wire aunque hoy nadie los lea; no se inventan ni se recortan |

---

## 4. Lo que se pidió detectar, con su evidencia

| qué | hallazgo |
|---|---|
| **Contratos documentados que no coinciden con runtime** | `ARCHITECTURE.md:308` (`?role=&q=`) no implementado (`parties.ts:316-336` sólo acepta `identifier`). `integracion-de-un-modulo.md` §3.5 (`{ code }` vs sobre real). La Guía v2 §4 Paso 3 **sí coincide** con `entitlements.ts:167-179` |
| **Shapes duplicados con diferencias** | `PartyRow`: Padrón 13 campos, Lab 5 (`contract.ts:57-63`). `LauncherItem`: Foundation 8 campos, hub 5 (`shell.ts:61-71`), Lab 7 (`shell-client.ts:33-41`). `ShellView.balance`: nullable en Foundation, no-nulo en el hub |
| **Literales de paths repetidos** | `/.well-known/jwks-users.json` ×3 (Foundation, Lab, compra); `/v1/entitlements/check` ×3; `/v1/shell` ×3 (Foundation, Lab, hub); `/padron/v1/parties` ×3 (Padrón, Lab, Foundation) |
| **Enums locales que ya deberían ser compartidos** | `EntitlementStatus` (`service.ts:23-28`, lo lee compra por texto); `LauncherAction` (`shell-service.ts:15`); `Initiator` está definido dos veces (`jwt.ts:16`, `token-verifier.ts:13`) además del de capabilities |
| **Campos servidos pero nunca consumidos** | `branding` entero, `launcher[].nivel`, `balance.gracia_restante`, `user.id`, `tenant.id`, `valid_to`; `PartyRow.tipo/nombre_fantasia/tipo_contribuyente/tipo_regimen/actividades_economicas/es_consumidor_final/created_at/updated_at` por Lab; `PartyDetails.roles/contacts/branches` por Lab |
| **Campos consumidos que el productor no garantiza** | `tenant.razon_social` (Lab lo usa; el productor lo declara nullable). `balance` (el hub lo tipa no-nulo; el productor lo sirve `null` para tuteladas — hoy lo salva un `if (!balance) return`, `shell.ts:187`) |
| **Códigos de error locales disfrazados de plataforma** | `TENANT_MISSING` (Lab, 403, para lo que la plataforma llama `TENANT_MISMATCH`, `authn.ts:273-278` y `padron/authn.ts:83-85`); `NOT_FOUND` genérico (Lab); `PADRON_UNAVAILABLE` (Lab, Padrón jamás lo emite); `MODULE_ENTITLEMENT_UNAVAILABLE` (compra) |
| **Helpers de cliente que no deben ir a Contracts** | `parsePartyIdentifierQuery`/`formatPartyIdentifierQuery` (salvo D14), `padronPartyNotFoundBody`, `assertNoLabOwnedPartyRole`, `causaDeError`/`registrarFalloPadron`, `EntitlementGate`, `interpretar()` del shell, `amordazar()` |

---

## A. Superficie mínima propuesta para RC-wire

Sólo lo que `@suynda/modulo` consume desde E1 y que hoy está duplicado. Todo **aditivo**.

| entra | forma |
|---|---|
| **`foundation` — rutas** | `JWKS_USERS_PATH`, `JWKS_SERVICES_PATH`, `ENTITLEMENTS_CHECK_PATH`, `SHELL_PATH` |
| **`foundation` — JWKS** | tipo `JwkEd25519 { kty:"OKP", crv:"Ed25519", x, kid, alg:"Ed25519", use:"sig" }` y `JwksDocument { keys: JwkEd25519[] }`; constante `JWT_ALG = "Ed25519"` |
| **`foundation` — JWT** | tipo `PlatformTokenClaims` con los nombres **tal cual viajan** (`sub`, `iss`, `aud`, `iat`, `nbf`, `exp`, `jti`, `initiator`, `tenant_id?`, `capability?`, `mandateId?`, `tutelaId?`); enum `TokenInitiator = "user" \| "system"` |
| **`foundation` — entitlements** | query `{ module: ModuleKey }`; enum `EntitlementStatus`; tipo `ResolvedFunctionAccess { function_key, scope_type: string \| null, scope_refs: string[], all_scopes }`; tipo `EntitlementCheckResponse` (§2.3, todos required, `valid_to`/`grants`/`functions` nullable) |
| **`foundation` — shell** | enum `LauncherAction`; tipos `LauncherItem`, `ShellBalance`, `ShellBranding`, `ShellTenant`, `ShellUser`, `ShellPlatform`, `ShellResponse` (§2.5, nullabilidad tal cual el productor) |
| **`padron` — parties** | `PARTIES_PATH`; formato del identificador (`PARTY_IDENTIFIER_FORMAT` como doc + regex; codec según D14); tipos `PartyIdentifierInput`, `PartyUpsertRequest`, `PartyRow` (13 campos, fechas como ISO string), `PartyRoleRow`, `PartyContactRow`, `PartyBranchRow`, `PartyDetailsResponse`, `PartyUpsertResponse`; headers `IDEMPOTENCY_KEY_HEADER = "idempotency-key"`, `IDEMPOTENCY_REPLAYED_HEADER = "idempotency-replayed"` |
| **común — sobre de error** | `schema/error-envelope.schema.json` + tipo `ErrorEnvelope { error: { code, message, detail? } }` + `isErrorEnvelope()` |
| **común — códigos** | `ENTITLEMENT_MODULE_INVALID` (400), `BAD_REQUEST` (400) y `INTERNAL` (500) a `data/error-codes.json` — sujeto a D15 |
| **verificación** | todos los tipos y constantes nuevos entran a `scripts/verify-superficie.mts`; el schema del sobre se prueba contra cuerpos reales copiados de los tres productores |

**Tag propuesto:** `v0.13.0`, aditivo. **Archivos que se tocarían** en el diseño: `src/wire/foundation.ts`,
`src/wire/padron.ts`, `src/wire/error-envelope.ts` *(propuesta de nombres)*, `schema/error-envelope.schema.json`,
`data/error-codes.json`, `data/enums.json` (`EntitlementStatus`, `LauncherAction`, `TokenInitiator`),
`src/index.ts`, `scripts/verify-superficie.mts`, `scripts/verify-v0.mjs` (cuenta de códigos y enums),
`docs/integracion-de-un-modulo.md` §3.5 (la forma del error). **Archivos que NO se tocan:** manifiestos,
`modules.json`, `capabilities.json`, `events.json`, `metered-operations.json`, `src/deposito.ts`, el
sobre de eventos, `ARCHITECTURE.md` (§0.1: se reporta, no se edita).

**Compatibilidad:** ningún consumidor cambia; los tres códigos promovidos ya se emiten con ese
`http`; los enums se agregan; nada se renombra. Foundation y Padrón no adoptan en esta corrida.

## B. Lo que explícitamente NO entra

- `/v1/me`, `/v1/members`, `/v1/members/catalog`, `/v1/members/:id/grants`, `/v1/cartera`,
  `POST/DELETE /v1/entitlements`, `/v1/branding` — los consume el hub, no un módulo; corrida propia
  cuando el hub adopte contracts.
- `/padron/v1/branches`, `/padron/v1/parties/consumidor-final`, items, catálogos, fiscal-profile —
  wire real Foundation↔Padrón o sin consumidor de módulo hoy; no los necesita E1.
- El puente `POST /internal/v1/bridge/tenant` de compra, `/v1/credits/*`, `/v1/events/*` — sin
  consumidor en `@suynda/modulo` para E1.
- Toda conducta: caché, gracia, TTL, timeouts, reintentos, diagnóstico, `scoped`, la mordaza del token.
- El cuerpo de `/api/shell` y de `/api/alcances` que un módulo sirve a su propio navegador.
- Renombrar claims, campos o códigos existentes.
- El sobre `{ detail }` de compra.
- `TENANT_MISSING`, `NOT_FOUND`, `PADRON_UNAVAILABLE`, `MODULE_ENTITLEMENT_UNAVAILABLE`.

## C. Divergencias encontradas

| # | divergencia | severidad | dueño | qué se hace en RC-wire |
|---|---|---|---|---|
| C.1 | `ARCHITECTURE.md:308` lista `GET /padron/v1/parties?role=&q=`; Padrón sólo implementa `?identifier` | **media** — un módulo que lea el contrato buscará por nombre y no existe | fundador (§0.1: un agente reporta, no edita) | se reporta acá; RC-wire declara **sólo lo implementado** |
| C.2 | Lab pinta el espacio con `razon_social` (nullable) en vez de `nombre_negocio` | **media** — la píldora queda vacía en un grupo sin identidad fiscal | Lab, coordinado con su gemelo; el SDK elige `nombre_negocio` en E1 | nada; queda anotado para E1 y para el gemelo |
| C.3 | Foundation `UpsertPartyCmd.identifier?` opcional; Padrón lo exige (`required`) | **media** — latente: un comando sin identificador daría 400 `BAD_REQUEST` en producción | Foundation | el tipo de contracts lo declara required; Foundation lo adopta después |
| C.4 | `INTERNAL` y `BAD_REQUEST` viajan desde Foundation y Padrón y sus `errors.ts` los declaran «sin lugar en el contrato» | **baja** — observable, no roto | contracts + fundador | D15 |
| C.5 | Misma condición, dos códigos: Lab `TENANT_MISSING` vs plataforma `TENANT_MISMATCH` («no active tenant on session») | **baja** — sólo lo ve el navegador de Lab | SDK (E1) | el SDK usa el de la plataforma; ver D15 |
| C.6 | Padrón responde **404** `PADRON_PARTY_NOT_FOUND` cuando falta el query `identifier` — un pedido mal hecho reportado como recurso ausente | **baja** | Padrón | se documenta tal cual; corregirlo es corrida de Padrón |
| C.7 | Nombres mezclados en el JWT: `tenant_id` / `mandateId` / `tutelaId` | **baja** — funciona; es deuda de forma | plataforma | D13: se declara como está |
| C.8 | Padrón acepta cualquier `tipo` de identificador ≤ 20 chars; Lab lo valida contra `IdentifierType` | **baja** — Padrón normaliza y no falla; un tipo inventado crea un identificador huérfano | Padrón | contracts tipa `tipo: IdentifierType`; Padrón adopta después |
| C.9 | El hub tipa `balance` como no-nulo y `tenant` sin `razon_social`; ignora `kind`/`url` salvo en activación | **baja** — lo salva un guard | hub, en UI-4 | nada |
| C.10 | `integracion-de-un-modulo.md` §3.5 escribe `400 { code: "SCOPE_TYPE_UNKNOWN" }`; el sobre real es `{ error: { code, message } }` | **baja** — doc | contracts | se corrige en el diseño de RC-wire, en el mismo tag |
| C.11 | Lab tipa `roles/contacts/branches` como `unknown[]` y `PartyRow` con 5 de 13 campos | **baja** — subconsumo declarado | Lab → SDK en E1 | contracts declara los shapes completos |
| C.12 | Compra responde `{ detail }` de FastAPI para sus errores | **baja** — fuera del alcance; el hub no lo consume | compra | nada |

## D. Decisiones para tu firma

| # | decisión | recomendación |
|---|---|---|
| **D13** | **Claims del JWT: declarar los nombres tal cual viajan** (`tenant_id`, `mandateId`, `tutelaId`) o normalizar | **Tal cual.** RC-wire es aditivo y hay tres verificadores en producción. La deuda de forma queda anotada (C.7) para una corrida futura con versión BREAKING |
| **D14** | **El formato del identificador `TIPO:PAIS:VALOR`**: sólo la especificación (constante + regex + doc) o además un **codec** `parse`/`format` en contracts | **Codec en contracts.** Hoy hay dos parsers byte-similares (`parties.ts:326-329`, `lab/contract.ts:20-32`) y el tercero sería el SDK. Es lógica de **forma**, como `validateEnvelope()`, que es el precedente exacto que el `CLAUDE.md` de contracts admite. Sin codec, el SDK escribe el cuarto parser |
| **D15** | **Códigos**: promover `ENTITLEMENT_MODULE_INVALID` y `BAD_REQUEST`; y `INTERNAL`, contra la intención escrita en los dos `errors.ts` | **Promover los tres.** La intención de «sin lugar en el contrato» chocó con los hechos: los dos productores lo emiten y el hub y Lab lo pueden recibir. Un código que viaja y no está declarado es exactamente la deriva que contracts existe para frenar. `TENANT_MISSING`, `NOT_FOUND` y `PADRON_UNAVAILABLE` **no** se promueven: son módulo→navegador; el SDK los registra como locales y usa `TENANT_MISMATCH` para la condición de plataforma |
| **D16** | **Fechas en el wire**: contracts las tipa como `string` ISO 8601, no `Date` | **String.** Es lo que JSON transporta y lo que Lab ya tipa (`deleted_at: string \| null`); `Date` en un tipo de contrato mentiría en el consumidor |
| **D17** | **C.1**: ¿el contrato de arquitectura está adelantado o el código atrasado? | **Se reporta, no se decide acá.** RC-wire declara lo implementado. Si el `?role=&q=` es producto, es corrida de Padrón y el wire se amplía con tag |
| **D18** | **`scope_type` en `ResolvedFunctionAccess`**: `string \| null` opaco, como viaja | **Opaco.** Un enum global de scope types es lo que el Plan v1.1 §4 prohibió a propósito |
| **D19** | **Nombre y ubicación en contracts.** La primera versión de esta fila proponía una carpeta `src/wire/` con `data/wire/*.json`. **Corregida al molde real** (`src/deposito.ts:1-17`, `scripts/generate-schema.mjs`): `src/` es **plano** —un archivo por frontera—, los tipos son TS puros, los enums nuevos entran a `data/enums.json` y se **inyectan** en los schemas por `generate-schema.mjs`, y los schemas JSON se escriben a mano como «forma documentada» | **Plano, como Depósito:** `src/foundation.ts` (paths, JWKS, claims, entitlements, shell), `src/padron.ts` (paths, headers, codec, parties), `src/error-envelope.ts` (sobre + `isErrorEnvelope`); enums `EntitlementStatus`, `LauncherAction`, `TokenInitiator` en `data/enums.json`; schemas en `schema/` con los enums inyectados; todo exportado desde `src/index.ts` y cubierto por `verify-superficie.mts`. Sin subcarpetas ni `data/wire/` |
| **D21** | **Paths en contracts, contra la nota de Depósito.** `src/deposito.ts:9-12` fija que «Contracts gobierna el SIGNIFICADO de estas formas; el transporte (paths, auth, paginación, status codes) vive en el OpenAPI del repo de Depósito». La regla de RC-wire que firmaste incluye **paths y query params**. Son dos criterios y hay que elegir | **Los dos conviven, por clase de servicio:** Foundation y Padrón son **plataforma** — los consume todo módulo, no tienen OpenAPI propio consumible por tag, y sus paths ya están cableados en tres repos; su transporte es contrato de plataforma y va a contracts. Un **módulo** (Depósito, Lab) conserva su transporte en su propio repo, como dice la nota. Se escribe esa distinción en el encabezado de `src/foundation.ts` y `src/padron.ts`, y **no** se edita `src/deposito.ts` |
| **D20** | **Los campos que nadie consume** (`branding`, `nivel`, `gracia_restante`, `user.id`, `valid_to`): declararlos o recortarlos | **Declararlos.** Son wire aunque no tengan lector hoy; recortar en el contrato lo que el productor sirve es inventar un contrato distinto del real |

## E. Orden propuesto

```
RECON (este documento)  →  firma D13–D20  →  diseño RC-wire (data + src + schema + tests, a firma)
→  implementación en contracts  →  npm run verify (v0 + superficie)  →  tag v0.13.0
→  STOP · E1 arranca recién con el tag verificado por lock en @suynda/modulo
```

Foundation y Padrón **no** adoptan los exports en esta corrida; su adopción es corrida propia
posterior, y ahí se cierran C.3 y C.8 por construcción.

**STOP — recon entregado, sin código. Esperando tu firma sobre D13–D20.**
