# RC-wire — DISEÑO: `@suynda/contracts` v0.13.0, el wire de plataforma

**Fecha:** 9 de septiembre de 2026 · **Estado:** DISEÑO, para firma del fundador antes de escribir
código · **Insumo:** `rc-wire-recon.md` con D13–D21 firmadas · **Write-scope cuando se ejecute:**
`C:\Suynda\suynda-contracts` únicamente. Foundation, Padrón, Lab y `@suynda/modulo` no se tocan.
**Tag:** `v0.13.0`, **aditivo y compatible** con `v0.12.0`.

**La regla que gobierna cada línea de este diseño (D21):** contracts declara el **protocolo** de los
servicios compartidos de plataforma —método, path, query, headers, request, response, sobre y
códigos— y jamás su implementación: ni fetch, ni caché, ni retry, ni timeout, ni diagnóstico. El
transporte de un módulo autónomo no entra.

> **Resoluciones firmadas (9-sep, segunda ronda):**
> **D22 APROBADA** — contracts gana **CI hospedada**; «CI verde» no es el `verify` local. Workflow
> mínimo con `permissions: contents: read`: `npm ci` → generación (`generate-schema`) → **árbol
> generado idéntico al commiteado** → typecheck → `verify-v0` + superficie → `verify-wire`. La misma
> compuerta sigue siendo reproducible localmente con `npm run verify`.
> **D24 APROBADA CON CORRECCIÓN** — el sobre queda **extensible**: `code: string`, `message: string`;
> `code` no se restringe al catálogo porque el mismo sobre transporta códigos locales de módulos;
> se promueven los tres códigos de D15 sin cerrar el tipo. Para `BAD_REQUEST`, el **código** es
> contractual y `message` es texto humano opaco: el `message_es` de `data/error-codes.json` es copy
> canónico del código, **no** obligación byte a byte para los productores, y ninguna frase actual
> del framework se congela como protocolo.
> **D25 APROBADA CON DISTINCIÓN** — se tipan las **cinco** claves de `fields` que Padrón honra; se
> separa «claves soportadas por contrato» de «rechazo runtime de claves desconocidas». **Evidencia
> leída para esta distinción:** el schema de Padrón declara `additionalProperties: false` en el
> cuerpo raíz (`parties.ts:52`) pero **Fastify corre ajv con `removeAdditional: true` por defecto**
> (`server.ts:34-38` sólo agrega `allowUnionTypes`), así que una clave de más en la raíz **se
> descarta en silencio, no se rechaza**; dentro de `fields` no hay `additionalProperties` y el
> servicio lee sólo `PARTY_FIELD_KEYS` (`party-service.ts:74-95`): las desconocidas **se ignoran**.
> Ningún test lo cubre. Por tanto el schema `partyFields` **no** lleva `additionalProperties: false`
> y su descripción dice «claves desconocidas: ignoradas por el productor hoy»; el `additionalProperties:
> false` del cuerpo raíz **se refleja porque el productor lo declara**, con la nota «aplicado hoy
> como descarte silencioso; el rechazo explícito es corrida de adopción de Padrón». RC-wire describe
> la frontera real; no inventa validaciones.
> **Criterios firmados:** `v0.13.0` aditivo · cero renombres o eliminaciones · schemas de Depósito
> idénticos byte a byte · `verify-wire.mts` con fixtures **semánticos** del productor y ajv, no
> snapshots frágiles · Foundation, Padrón, Lab y `@suynda/modulo` no se modifican.
> **D23, D26, D27 firmadas tal cual (9-sep).** D26 lleva C.8 explícita: Padrón acepta hoy cualquier
> string ≤ 20 como `tipo`; contracts declara `IdentifierType` y el cierre es adopción de Padrón.
> **D28 NO APROBADA en su forma propuesta** y reemplazada por esta regla, congelada: *cuando Contracts
> publica un tipo TypeScript y un JSON Schema para la misma superficie, ambos deben representar el mismo
> dominio contractual*. Un `string` con descripción para `politica` y `kind` mientras el tipo TS es una
> unión cerrada era una asimetría. Resolución ejecutada: **`CapabilityAvailability` y `ModuleKind` se
> promovieron a `data/enums.json`** (costo chico, verificado: dos uniones TS sin fuente material en
> `src/capabilities.ts:8-11` y `src/modules.ts:23`, más el literal `KINDS` de `verify-v0.mjs:393`; ningún
> productor los valida a mano). `src/capabilities.ts` y `src/modules.ts` los re-exportan por su path de
> siempre —**cero cambio de superficie**— y los schemas los reciben inyectados como cualquier otro enum.
> **Diseño aprobado para implementación** con estos criterios: aditivo sobre v0.12.0 · schemas de
> Depósito byte a byte · CI hospedada verde · `npm run verify` verde · `verify-wire` verde con sus rojos
> demostrados · superficie verificada · ningún wire inventado · ningún cambio de runtime en productores.

---

## 0. El diseño en una tabla

| pieza | archivo | qué declara |
|---|---|---|
| Foundation | `src/foundation.ts` *(nuevo)* | 4 paths, 1 query, `alg` del JWT, JWKS, claims, entitlements, shell |
| Padrón | `src/padron.ts` *(nuevo)* | 1 path base + 2 compositores, 1 query, 2 headers, el codec del identificador (D14), parties |
| Sobre de error | `src/error-envelope.ts` *(nuevo)* | `ErrorEnvelope` + `isErrorEnvelope()` |
| Enums | `data/enums.json` + `src/enums.ts` | `EntitlementStatus`, `LauncherAction`, `TokenInitiator` — los tres verificados cerrados (§3) |
| Códigos | `data/error-codes.json` | `INTERNAL`, `BAD_REQUEST`, `ENTITLEMENT_MODULE_INVALID` (D15) |
| Schemas | `schema/foundation-wire.schema.json`, `schema/padron-parties.schema.json`, `schema/error-envelope.schema.json` *(nuevos)* | forma documentada, enums inyectados por `generate-schema.mjs` |
| Verificación | `scripts/verify-wire.mts` *(nuevo)*, `verify-superficie.mts`, `verify-v0.mjs`, `generate-schema.mjs` | codec, sobre, schemas contra fixtures, conteos, superficie |
| Doc | `docs/integracion-de-un-modulo.md` §3.5 | la forma real del error (C.10) |

---

## 1. `src/foundation.ts` — exports públicos

**Encabezado obligatorio** (D21): *«El wire de los servicios compartidos de plataforma vive acá
porque Foundation es infraestructura consumida transversalmente por todo módulo y no tiene OpenAPI
propio consumible por tag. Esto NO es precedente para las APIs de un módulo: Lab, Depósito, Ventas y
los que vengan conservan su transporte en su propio repo (ver `src/deposito.ts`). Contracts declara
el protocolo; jamás fetch, caché, retry, timeout ni diagnóstico.»*

### 1.1 · Constantes de transporte

| export | valor | evidencia |
|---|---|---|
| `FOUNDATION_JWKS_USERS_PATH` | `"/.well-known/jwks-users.json"` | `foundation/src/http/routes/jwks.ts:14` |
| `FOUNDATION_JWKS_SERVICES_PATH` | `"/.well-known/jwks-services.json"` | `jwks.ts:19` |
| `FOUNDATION_ENTITLEMENTS_CHECK_PATH` | `"/v1/entitlements/check"` | `routes/entitlements.ts:82` |
| `FOUNDATION_ENTITLEMENTS_CHECK_MODULE_QUERY` | `"module"` | `entitlements.ts:105` |
| `FOUNDATION_SHELL_PATH` | `"/v1/shell"` | `routes/shell.ts:45` |
| `PLATFORM_JWT_ALG` | `"Ed25519"` | `auth/keys.ts:50`, `auth/jwt.ts:111` |

Método de las cuatro rutas: **GET**. Se documenta en el JSDoc de cada constante; no hay constante de
método porque no hay ruta con más de uno.

### 1.2 · JWKS

```ts
export interface PlatformJwk {
  kty: "OKP";
  crv: "Ed25519";
  x: string;          // clave pública, base64url
  kid: string;        // thumbprint JWK (keys.ts:91)
  alg: "Ed25519";
  use: "sig";
}
export interface PlatformJwks { keys: PlatformJwk[] }
```

Sirve para las dos audiencias. El `cache-control: public, max-age=300` que Foundation emite es
implementación del productor (`jwks.ts:15`) y **no** se declara.

### 1.3 · JWT (D13: tal cual viaja)

```ts
export interface PlatformTokenHeader { alg: "Ed25519"; kid: string }   // jwt.ts:111 — sin `typ`
export interface PlatformTokenClaims {
  sub: string;                 // user id o service key
  iss: string;
  aud: string;                 // Foundation emite string, no array (jwt.ts:114)
  iat: number; nbf: number; exp: number;   // segundos
  jti: string;
  initiator: TokenInitiator;   // "user" | "system" — enums.json (§3)
  tenant_id?: string;          // ausente = sin espacio activo (jwt.ts:107)
  capability?: string;         // sólo token de servicio (jwt.ts:108); ver D27
  mandateId?: string;          // sesión prestada por mandato (session.ts:193)
  tutelaId?: string;           // sesión prestada por tutela (session.ts:291)
}
```

**No hay alias ni normalización.** `typ` no se declara porque Foundation no lo emite; el helper de
tests de Lab lo agrega, el productor no.

### 1.4 · Entitlements

```ts
export interface EntitlementsCheckQuery { module: ModuleKey }
export interface ResolvedFunctionAccess {          // D18: opaco
  function_key: string;
  scope_type: string | null;
  scope_refs: string[];
  all_scopes: boolean;
}
export interface EntitlementsCheckResponse {       // entitlements.ts:167-179
  tenant_id: string;
  module: ModuleKey;
  activo: boolean;
  status: EntitlementStatus;                       // enums.json (§3)
  valid_to: IsoDateTime | null;                    // D16
  politica: CapabilityAvailability;                // ya de contracts
  cache_max_seconds: number;
  verificado_at: IsoDateTime;
  grants: string[] | null;                         // null para token de servicio
  functions: ResolvedFunctionAccess[] | null;      // ídem
}
```

Auth documentada en JSDoc: token de persona, o de servicio con `capability: "entitlements.check"`
(`entitlements.ts:87-99`); tenant del token; sin tenant → 403 `TENANT_MISMATCH`; `module` inválido →
400 `ENTITLEMENT_MODULE_INVALID`. Todo lo demás —gracia, caché, `scoped`— queda fuera por D21.

### 1.5 · Shell

```ts
export interface ShellUser { id: string; nombre: string }
export interface ShellTenant { id: string; razon_social: string | null; nombre_negocio: string }
export interface ShellLauncherItem {
  key: ModuleKey; nombre: string; descripcion: string;
  nivel: ModuleLevel | null;
  entitled: boolean;
  action: LauncherAction;                          // enums.json (§3)
  kind: ModuleKind | null;                         // ya de contracts (modules.ts:23)
  url: string | null;                              // null = «Pronto»
}
export interface ShellBalance {
  saldo: number; en_sobregiro: boolean; bajo: boolean;
  gracia_restante: { operaciones: number; dias: number } | null;
}
export interface ShellBranding { logo_url: string | null; color_primario: string | null; color_acento: string | null }
export interface ShellPlatform { hub_url: string }
export interface ShellResponse {
  user: ShellUser;
  tenant: ShellTenant | null;
  launcher: ShellLauncherItem[];
  balance: ShellBalance | null;                    // null = espacio sin bolsillo (tutelada)
  branding: ShellBranding;
  platform: ShellPlatform;
}
```

Auth documentada: **sólo token de persona** (`shell.ts:46`). JSDoc de `tenant`: *«`nombre_negocio` es
el rótulo para mostrar y nunca es null; `razon_social` es la identidad legal y puede serlo»* — es
la línea que evita repetir C.2.

### 1.6 · Clasificación D20 de cada campo servido

| campo | clase | razón |
|---|---|---|
| todos los de 1.2–1.5 salvo los de abajo | **1 · público** | los sirve el productor como parte de su interfaz documentada (Guía v2 §3–§4, §7.5 del contrato de arquitectura) |
| `ShellBranding` entero | **1 · público** | «el branding viaja dentro de `/v1/shell`» (Guía v2 §0); white-label es producto, no detalle |
| `ShellBalance.gracia_restante` | **1 · público** | la gracia de sobregiro es §7.6 del contrato; que hoy nadie la pinte no la hace incidental |
| `ShellLauncherItem.nivel` | **1 · público** | es `ModuleLevel` del manifiesto, ya canónico |
| `EntitlementsCheckResponse.valid_to` | **1 · público** | vigencia del entitlement, §4 Paso 3 de la Guía |
| `PlatformTokenClaims.capability` | **3 · ambiguo** | tipo `string` observado; valores siempre `CapabilityKey` — **D27** |
| header `cache-control` del JWKS | **2 · incidental** | política de caché del productor, no forma |
| `ErrorEnvelope.error.detail` | **3 · ambiguo** | lo emiten los dos productores; su contenido es libre — **D23** |

---

## 2. `src/padron.ts` — exports públicos

Mismo encabezado D21, con la frase: *«Padrón es el registro maestro compartido; sus rutas de parties
las consumen Lab y Foundation. Las APIs de items, branches, catálogos y fiscal-profile no se declaran
en esta versión: sin consumidor en `@suynda/modulo`.»*

### 2.1 · Constantes de transporte

| export | valor / firma | evidencia |
|---|---|---|
| `PADRON_PARTIES_PATH` | `"/padron/v1/parties"` | `padron/src/http/routes/parties.ts:89, 317` |
| `PADRON_PARTIES_IDENTIFIER_QUERY` | `"identifier"` | `parties.ts:316-323` |
| `padronPartyPath(id: string): string` | `` `${PADRON_PARTIES_PATH}/${encodeURIComponent(id)}` `` | `parties.ts:339` |
| `padronPartyRolesPath(id: string): string` | `…/${id}/roles` | `parties.ts:349` |
| `IDEMPOTENCY_KEY_HEADER` | `"idempotency-key"` | `authn.ts:90` |
| `IDEMPOTENCY_REPLAYED_HEADER` | `"idempotency-replayed"` | `parties.ts:80` |

Métodos y auth, en JSDoc: `POST` upsert con `padron.party.create` e `Idempotency-Key` obligatorio →
`201` creado / `200` existente; `GET` por `identifier` y por `id` con `padron.party.read`; tenant del
token. Los demás POST de parties (`roles`, `identifiers`, `contacts`, `deactivate`,
`consumidor-final`) **no se declaran** en v0.13.0 (§B).

### 2.2 · El codec del identificador (D14) — puro, sin dominio

```ts
export const PARTY_IDENTIFIER_SEPARATOR = ":" as const;
export interface PartyIdentifier { tipo: IdentifierType; countryCode: string | null; valor: string }
export type ParsePartyIdentifierResult =
  | { ok: true; value: PartyIdentifier }
  | { ok: false; reason: "forma" | "tipo" | "valor" };
export function parsePartyIdentifier(raw: string): ParsePartyIdentifierResult;
export function formatPartyIdentifier(id: PartyIdentifier): string;
export function isPartyIdentifierString(raw: string): boolean;
```

Semántica, la observada en `parties.ts:326-329` y `lab/src/padron/contract.ts:20-42`:
`TIPO:PAIS:VALOR`; se parte por el primer y el segundo `:`; `PAIS` vacío ⇒ `null`; `VALOR` es el
resto **incluidos** los `:` que contenga, y no puede ser vacío; `TIPO` ∈ `IDENTIFIER_TYPES`. El
formato devuelve `` `${tipo}:${countryCode ?? ""}:${valor}` ``. **Lo que el codec NO hace:** recortar,
poner en mayúsculas, ni resolver `null` a `PY` — eso es la normalización de Padrón
(`party-service.ts:57-72`), implementación, y queda documentada en el JSDoc como conducta del
productor. El estilo de resultado `{ ok, … }` es el de `validateEnvelope()`.

### 2.3 · Parties

```ts
export interface PartyFields {                     // las cinco que Padrón honra (party-service.ts:74-80) — D25
  tipo?: string | null; nombre_fantasia?: string | null; tipo_contribuyente?: string | null;
  tipo_regimen?: string | null; actividades_economicas?: unknown | null;
}
export interface PartyUpsertRequest {              // parties.ts:33-58
  identifier: { tipo: IdentifierType; countryCode?: string | null; valor: string };   // D26
  razonSocial: string;
  fields?: PartyFields;
  roles?: PartyRole[];
}
export interface PartyRow {                        // db/types.ts:14-28, fechas ISO por JSON (D16)
  id: string; tenant_id: string;
  tipo: string | null; razon_social: string; nombre_fantasia: string | null;
  tipo_contribuyente: string | null; tipo_regimen: string | null;
  actividades_economicas: unknown | null;
  es_consumidor_final: boolean; entity_version: number;
  deleted_at: IsoDateTime | null; created_at: IsoDateTime; updated_at: IsoDateTime;
}
export interface PartyRoleRow { id; tenant_id; party_id; rol: PartyRole; activo: boolean; activated_at: IsoDateTime; deactivated_at: IsoDateTime | null }
export interface PartyContactRow { id; tenant_id; party_id; tipo: string | null; valor: string | null; principal: boolean; created_at: IsoDateTime }
export interface PartyBranchRow { id; tenant_id; party_id; codigo: string | null; nombre: string | null; direccion: string | null; ciudad_id: string | null; tipo: string | null; entity_version: number; created_at: IsoDateTime; updated_at: IsoDateTime }
export interface PartyDetailsResponse { party: PartyRow; roles: PartyRoleRow[]; contacts: PartyContactRow[]; branches: PartyBranchRow[] }
export interface PartyUpsertResponse { party: PartyRow; created: boolean }
export interface PartyRolesResponse { roles: PartyRoleRow[] }
```

(`id`, `tenant_id`, `party_id` son `string` en las tres filas; se abrevian arriba por legibilidad.)

**Clasificación D20 de `PartyRow`:** los 13 campos son **públicos**: es la fila del registro maestro
(§3.8 del contrato de arquitectura), y Padrón la sirve entera en las tres rutas. `tipo` queda
`string | null` y no enum: el comentario dice «fisica | juridica» (`types.ts:17`) pero nada lo valida
(D19: sin evidencia de conjunto cerrado, string). `actividades_economicas: unknown | null` es lo
observado; no se inventa su forma.

---

## 3. Enums — los tres, verificados uno por uno (D19)

| enum | valores | cerrado, con evidencia | validado, con evidencia | veredicto |
|---|---|---|---|---|
| `EntitlementStatus` | `active`, `suspended`, `vencido`, `ausente`, `plataforma` | unión TS (`entitlements/service.ts:23-28`); **todas** las emisiones son literales (`:101, :111-113, :119, :125-126`); tres valores no existen en la base a propósito (`:18-22`) | no se parsea de ninguna entrada: lo produce el código, el tipo lo cierra | **enum en `data/enums.json`** |
| `LauncherAction` | `open`, `expand` | unión TS (`shell-service.ts:15`); única emisión `isEntitled ? "open" : "expand"` (`:190`) | ídem | **enum** |
| `TokenInitiator` | `user`, `system` | unión TS (`jwt.ts:16`) | **validado en las dos puntas**: Foundation rechaza otro valor al leer (`jwt.ts:138-141`), Padrón también (`token-verifier.ts:71-73`) | **enum** |

Forma en `data/enums.json`, con nota, como `LedgerTipo`:

```json
"EntitlementStatus": { "_status": "PROPUESTO", "_note": "Source: foundation entitlements/service.ts:23-28 …", "values": ["active","suspended","vencido","ausente","plataforma"] },
"LauncherAction":    { "_status": "PROPUESTO", "_note": "Source: foundation shell/shell-service.ts:15 …", "values": ["open","expand"] },
"TokenInitiator":    { "_status": "PROPUESTO", "_note": "Source: foundation auth/jwt.ts:16, validado en jwt.ts:138-141 y padron token-verifier.ts:71-73. Subconjunto de CapabilityInitiator sin 'both' …", "values": ["user","system"] }
```

`src/enums.ts` gana `ENTITLEMENT_STATUSES`/`EntitlementStatus`, `LAUNCHER_ACTIONS`/`LauncherAction`,
`TOKEN_INITIATORS`/`TokenInitiator` con el molde `enumsData.X.values`, y las tres entradas en `ENUMS`.
`CapabilityInitiator` no se toca.

**No entran como enum:** `PartyRow.tipo` (sin validación), `politica` (ya es `CapabilityAvailability`,
tipo TS), `kind` (ya es `ModuleKind`, tipo TS).

---

## 4. Códigos — `data/error-codes.json` (D15)

| código | http | `message_es` | evidencia |
|---|---|---|---|
| `INTERNAL` | 500 | `Ocurrió un error interno` | literal en los dos manejadores: `foundation/src/http/server.ts:628`, `padron/src/http/server.ts:91` |
| `ENTITLEMENT_MODULE_INVALID` | 400 | `El módulo consultado no está declarado en @suynda/contracts` | `foundation/src/http/errors.ts:410-413`, literal |
| `BAD_REQUEST` | 400 | **`La solicitud no es válida`** *(propuesto — D24)* | los productores emiten el `message` del framework (`server.ts:633`), que varía; contracts necesita un texto fijo |

Nota en `_notes` del JSON: *«INTERNAL y BAD_REQUEST son los dos fallbacks de los manejadores de
Foundation y Padrón; se declaran porque VIAJAN. Sus `errors.ts` locales pueden seguir definiéndolos
hasta su corrida de adopción.»*

---

## 5. `src/error-envelope.ts`

```ts
export interface ErrorEnvelope {
  error: { code: string; message: string; detail?: unknown };   // code: string — D24; detail — D23
}
export function isErrorEnvelope(value: unknown): value is ErrorEnvelope;
```

`isErrorEnvelope` es un guard estructural puro: objeto, `error` objeto, `code` y `message` strings.
Sin ajv en runtime; el schema es documentación y prueba. `code` es `string` y no `ErrorCodeKey`
porque el sobre también transporta códigos locales de un módulo hacia su navegador (Lab) — el tipo
del wire no puede excluir lo que el wire lleva.

---

## 6. Schemas — `schema/*.schema.json`

Tres archivos nuevos, escritos a mano como «forma documentada», con `$defs` y **enums inyectados**
por `generate-schema.mjs` (nunca copiados):

| archivo | `$defs` | inyecciones |
|---|---|---|
| `error-envelope.schema.json` | `errorEnvelope` | — |
| `foundation-wire.schema.json` | `platformJwk`, `platformJwks`, `platformTokenClaims`, `resolvedFunctionAccess`, `entitlementsCheckResponse`, `shellLauncherItem`, `shellBalance`, `shellBranding`, `shellTenant`, `shellUser`, `shellPlatform`, `shellResponse` | `platformTokenClaims.initiator` ← `TokenInitiator` · `entitlementsCheckResponse.status` ← `EntitlementStatus` · `entitlementsCheckResponse.module` ← `ModuleKey` (modules.json) · `entitlementsCheckResponse.politica` ← `CapabilityAvailability` · `shellLauncherItem.action` ← `LauncherAction` · `shellLauncherItem.key` ← `ModuleKey` · `shellLauncherItem.nivel` ← `ModuleLevel` · `shellLauncherItem.kind` ← `ModuleKind \| null` |
| `padron-parties.schema.json` | `partyIdentifier`, `partyFields`, `partyUpsertRequest`, `partyRow`, `partyRoleRow`, `partyContactRow`, `partyBranchRow`, `partyDetailsResponse`, `partyUpsertResponse`, `partyRolesResponse` | `partyIdentifier.tipo` ← `IdentifierType` · `partyUpsertRequest.roles.items` ← `PartyRole` · `partyRoleRow.rol` ← `PartyRole` |

`politica`, `kind` y `nivel` **también se inyectan** (D28 resuelta por promoción): `politica` ←
`CapabilityAvailability`, `kind` ← `ModuleKind | null`, `nivel` ← `ModuleLevel` (que ya trae `null`
en su propia lista). Para eso `generate-schema.mjs` **deriva el tipo de los valores** —`integer` cuando
son números, `[…, null]` cuando la lista incluye `null`— en vez de asumir `string`; para los enums de
Depósito (strings sin `null`) la salida es idéntica byte a byte, y la compuerta lo demuestra.
Fechas: `{ "type": "string", "format": "date-time" }`, con `ajv-formats` ya en dependencias.

`generate-schema.mjs` gana **una entrada por archivo** en `INJECTIONS`, en el molde existente
(`scripts/generate-schema.mjs:55-72`), y `valuesOf` acepta los enums «planos» de `data/enums.json`
(`IdentifierType`, `PartyRole`, `ModuleLevel` son arreglos sin `values`). Nada cambia en los tres
schemas de Depósito.

---

## 7. Verificación

### 7.1 · `scripts/verify-wire.mts` *(nuevo)* — se typechequea y corre como `verify-superficie`

| bloque | qué prueba | el rojo plantado |
|---|---|---|
| codec | `RUC:PY:80012345-6` ↔ objeto; `CI::1234567` ⇒ `countryCode: null`; `PASSPORT:AR:AB:12` ⇒ `valor: "AB:12"`; `XXX:PY:1` ⇒ `{ ok:false, reason:"tipo" }`; `RUC:PY:` ⇒ `reason:"valor"`; `RUC` ⇒ `reason:"forma"`; `format(parse(x)) === x` para los válidos | un separador equivocado tiene que dar `forma` |
| sobre | `isErrorEnvelope` verdadero con `{error:{code,message}}` y con `detail`; falso con `{detail:"…"}` (compra), `{error:"x"}`, `null` | — |
| schemas contra fixtures | cada fixture de `fixtures/wire/*.json` valida contra su `$def` con ajv 2020 + formats | un fixture **plantado** con `status: "activa"` y otro con `initiator: "bot"` tienen que fallar |
| constantes | los paths y headers son exactamente los strings de §1.1 y §2.1 | — |

**Fixtures** (`fixtures/wire/`, nuevo directorio): un cuerpo por shape, **construido desde el código
del productor con la cita en un campo `_source`** —no capturado de producción, porque desde esta
máquina no hay credenciales—. **Implementados (18):** trece válidos —`jwks-users.json`,
`token-claims-user.json`, `token-claims-service.json`, `entitlements-check-user.json`,
`entitlements-check-service.json` (`grants`/`functions` en `null`), `shell.json`, `shell-tutelada.json`
(`balance: null`), `party-details.json`, `party-upsert-response.json`, `party-upsert-request.json`,
`party-roles-response.json`, `error-envelope.json`, `error-envelope-detail.json`— y **cinco rojos
plantados** con `_expect: "invalid"`, cada uno atado a una divergencia o a un modo de falla real:
`rojo-entitlements-status-activa.json`, `rojo-token-initiator-bot.json`,
`rojo-error-envelope-compra.json` (el `{ detail }` de FastAPI), `rojo-party-upsert-razon-social.json`
(C.2: Lab manda `razon_social` en la raíz), `rojo-party-identifier-dni.json` (C.8). Sólo `body` se
valida; `_schema`/`_def` eligen el `$def` y `_source` es la cita. La compuerta exige ≥ 12 fixtures y
≥ 4 rojos, y además recorre los tres schemas buscando `"enum": []` sin inyectar.

### 7.2 · `scripts/verify-superficie.mts`

Importa **todos** los exports nuevos desde `../dist/index.js` — valores y tipos — en un bloque
`// ── RC-wire (v0.13.0)` con la misma lección de `ModuleKind`: un tipo que deje de exportarse no
compila.

### 7.3 · `scripts/verify-v0.mjs`

Tres guards nuevos, al lado de los de manifiesto: los tres códigos existen con su `http` exacto; los
tres enums existen con **exactamente** esos conjuntos (igualdad de conjunto, no de arreglo); y ningún
schema nuevo tiene un `enum` escrito a mano donde `generate-schema` inyecta — se detecta porque la
`description` generada lleva la marca `GENERATED from`.

### 7.4 · `npm run verify`

```
build → verify-v0 → verify:superficie → verify:wire
```

`package.json` gana `verify:wire` y lo encadena en `verify`. `version` pasa a `0.13.0`.

---

## 8. Compatibilidad con v0.12.0

| qué cambia | efecto en un consumidor pineado a v0.12.0 | efecto al re-pinear |
|---|---|---|
| tres archivos y tres grupos de export nuevos | ninguno | tipos y constantes nuevos disponibles |
| `ERROR_CODES` +3 ⇒ `ErrorCodeKey` se ensancha | ninguno | `errorByCode("INTERNAL")` deja de ser `undefined`; Foundation y Padrón pueden retirar su `LOCAL_ERROR_CODES.INTERNAL` en su corrida de adopción |
| `data/enums.json` +3 ⇒ `ENUMS` +3 claves | ninguno | — |
| `generate-schema.mjs` +2 entradas de inyección | ninguno; los schemas de Depósito no cambian byte | — |
| `docs/integracion-de-un-modulo.md` §3.5 | doc | — |

**Nada se renombra, nada se quita, ningún manifiesto ni capability ni evento se toca.** Foundation
(`v0.12.0`), Padrón (`v0.3.0`) y Lab (`v0.11.0`) siguen compilando sin cambios. La adopción de los
exports por Foundation y Padrón es corrida propia posterior (D21).

---

## 9. Lo que explícitamente queda fuera de v0.13.0

- Rutas del hub: `/v1/me`, `/v1/members*`, `/v1/cartera`, `POST/DELETE /v1/entitlements`, `/v1/branding`.
- Padrón: `POST …/roles`, `…/identifiers`, `…/contacts`, `…/deactivate`, `…/consumidor-final`,
  `/padron/v1/branches`, items, catálogos, fiscal-profile, y el header `x-read-consistency`.
- La búsqueda `?role=&q=` (D17).
- `/internal/v1/bridge/*`, `/v1/credits/*`, `/v1/events/*`.
- Normalización del identificador (mayúsculas, `PY` por defecto) — implementación de Padrón.
- `TENANT_MISSING`, `NOT_FOUND`, `PADRON_UNAVAILABLE`, `MODULE_ENTITLEMENT_UNAVAILABLE`.
- Caché, gracia, TTL, timeouts, reintentos, diagnóstico, mordaza del token, `scoped`.
- Los cuerpos de `/api/shell` y `/api/alcances` de un módulo hacia su navegador.
- El sobre `{ detail }` de compra.
- `ARCHITECTURE.md` (§0.1), `src/deposito.ts` (D21), cualquier archivo de Foundation, Padrón, Lab o
  `@suynda/modulo`.
- Una CI hospedada para contracts — salvo D22.

---

## 10. Diff esperado

| archivo | acción | previsto | **real (9-sep)** |
|---|---|---|---|
| `src/foundation.ts` | nuevo | 150 | 259 |
| `src/padron.ts` | nuevo | 200 | 244 |
| `src/error-envelope.ts` | nuevo | 40 | 35 |
| `src/enums.ts` | +5 wrappers, +5 en `ENUMS` (3 previstos + 2 por D28) | +15 | +27 |
| `src/index.ts` | +3 grupos de export, +5 enums | +60 | +61 |
| `src/capabilities.ts` | **D28**: `CapabilityAvailability` pasa a re-export de `./enums.js` | — | +4 −4 |
| `src/modules.ts` | **D28**: `ModuleKind` pasa a re-export de `./enums.js` | — | +4 −1 |
| `data/enums.json` | +5 enums con nota (3 previstos + `ModuleKind`, `CapabilityAvailability`) | +20 | +25 |
| `data/error-codes.json` | +3 códigos, +1 nota | +18 | +17 −1 |
| `schema/foundation-wire.schema.json` | nuevo | 260 | 520 |
| `schema/padron-parties.schema.json` | nuevo | 230 | 427 |
| `schema/error-envelope.schema.json` | nuevo | 30 | 33 |
| `scripts/generate-schema.mjs` | +2 entradas en `INJECTIONS`; `valuesOf` para enums planos; tipo derivado de los valores (D28) | +12 | +36 −5 |
| `scripts/verify-wire.mts` | nuevo | 160 | 151 |
| `scripts/verify-superficie.mts` | +1 bloque de imports, +literales por forma, +valores | +45 | +141 |
| `scripts/verify-v0.mjs` | +3 guards; `KINDS` bebe de `MODULE_KINDS` | +40 | +73 −3 |
| `fixtures/wire/*.json` | 18 nuevos (13 válidos + 5 rojos) | 300 | 319 |
| `.github/workflows/ci.yml` | **D22**: nuevo; dispara en push a `master` (la rama canónica del repo), tags `v*`, PR y manual | 35 | 46 |
| `package.json` | `version`, `verify:wire`, `verify` | +3 | +4 −3 |
| `package-lock.json` | versión raíz `0.8.1` → `0.13.0` (`npm install --package-lock-only`; sólo esas dos líneas; los bumps v0.9–v0.12 no lo habían tocado) | — | +2 −2 |
| `docs/integracion-de-un-modulo.md` | §3.5, la forma del error. El §6-bis de rollout de la sesión anterior fue a su propio commit (`ef44ae3`, *docs: clarify module rollout tenant gate*) | ±6 | +2 −1 |
| `docs/design/rc-wire-recon.md`, `rc-wire-diseno.md` | los dos documentos de la corrida | — | 359 · 502 |
| `dist/` | regenerado por `build`: 13 modificados, 12 nuevos | — | — |

Ningún archivo fuera de esta lista (`git status --porcelain` contra `v0.12.0`). Los schemas de
Depósito y `reference.schema.json`: **0 bytes de diff**. Total real: **≈ 2.900 líneas nuevas**, casi
todas declarativas (los dos schemas de wire son el 33 %).

---

## 11. Criterio de PASS

1. `npm run verify` verde, con `verify:wire` mostrando **los rojos plantados** de §7.1 antes del verde.
2. `git diff v0.12.0..HEAD --stat` coincide con §10; cualquier archivo de más es un STOP.
3. Los tres schemas de Depósito **idénticos byte a byte** a v0.12.0 después de `generate-schema`.
4. Cada export nuevo aparece en `verify-superficie.mts`; se demuestra quitando uno y viendo fallar el
   typecheck.
5. Ningún literal de path en `src/` fuera de `foundation.ts` y `padron.ts` (grep en el PASS).
6. Tag anotado `v0.13.0` con mensaje de arqueología: *«RC-wire: el wire de plataforma —Foundation y
   Padrón— entra a contracts; aditivo sobre v0.12.0; D13–D21 firmadas el 9-sep»*.
7. Después del tag, `@suynda/modulo` puede pinear `#v0.13.0` y G4 sigue siendo alcanzable: los paths
   se importan, no se escriben. Eso es E1, no esta corrida.

Diff nombrado contra este documento; STOP; tu firma; **el push y el tag son tuyos**.

**Estado (9-sep, implementación):** criterios 1, 3, 4 y 5 verificados en local —`npm run verify`
verde; rojos demostrados uno por uno: un rojo plantado desactivado, un enum inyectado vacío, un código
con `http` cambiado, un valor de más en `ModuleKind`, un export quitado del entry (los cinco fallan y
el estado restaurado vuelve a verde)—. Criterio 2 se lee en la tabla de §10 actualizada. Criterio 6
(tag) y la CI hospedada quedan para después del commit: **son del fundador**. Criterio 7 es E1.

---

## 12. Decisiones para tu firma

| # | decisión | recomendación |
|---|---|---|
| **D22** | CI hospedada para contracts | **FIRMADA.** Workflow mínimo `.github/workflows/ci.yml`, `contents: read`: `npm ci` → `generate:schema` → árbol generado = commiteado → typecheck → `verify-v0` + `verify:superficie` → `verify:wire`. Entra al diff esperado (§10, +1 archivo, ~35 líneas) y al PASS (§11) |
| **D23** | `ErrorEnvelope.error.detail`: declararlo como `unknown` opcional, o dejarlo fuera | **FIRMADA (9-sep).** Opcional y `unknown`: los dos productores lo emiten (`foundation/src/http/errors.ts:809`, `padron/src/http/errors.ts:22-24`); su contenido no se garantiza y el JSDoc lo dice |
| **D24** | `BAD_REQUEST` y el tipo del sobre | **FIRMADA CON CORRECCIÓN.** `code: string`, `message: string`, sobre extensible; el `message_es` del catálogo es copy canónico, no obligación wire; la frase del framework no se congela |
| **D25** | `PartyUpsertRequest.fields` | **FIRMADA CON DISTINCIÓN.** Cinco claves tipadas; `partyFields` sin `additionalProperties: false` porque Padrón ignora las desconocidas (evidencia en el bloque de resoluciones); el `false` del cuerpo raíz se refleja como declarado por el productor, con la nota de que hoy es descarte silencioso |
| **D26** | `identifier.tipo` en el request: `IdentifierType` (contracts) aunque Padrón hoy acepte cualquier string ≤ 20 | **FIRMADA (9-sep), con C.8 explícita.** `IdentifierType`: el enum existe para esto; Padrón hoy acepta cualquier string ≤ 20 (`parties.ts:44-47, 327`) y C.8 se cierra cuando Padrón adopte. El codec ya lo valida por D14; el fixture rojo `rojo-party-identifier-dni.json` lo demuestra |
| **D27** | `PlatformTokenClaims.capability`: `string` (observado) o `CapabilityKey` | **FIRMADA (9-sep).** `string`: D13 manda reflejar el wire; Foundation lo firma como string (`jwt.ts:108`) aunque sus valores salgan del catálogo. El JSDoc lo dice |
| **D28** | `politica` y `kind` en los schemas JSON: `string` con descripción, o duplicar a mano `CapabilityAvailability` y `ModuleKind` | **NO APROBADA en su forma propuesta (9-sep).** Regla congelada: *tipo TS y JSON Schema de la misma superficie representan el mismo dominio*. Resolución: **promover `CapabilityAvailability` y `ModuleKind` a `data/enums.json`** y que TS y schema beban de ahí (costo chico; sin cambio de superficie: `src/capabilities.ts` y `src/modules.ts` re-exportan). Ejecutada en esta corrida; el diseño quedó aprobado con ella |

**STOP — diseño entregado, sin código. Esperando tu firma sobre D22–D28 y sobre el diseño entero
antes de implementar.**
