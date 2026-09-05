# CONTRACTS — RECON DE APERTURA PARA EL RC DE DEPÓSITO (F-5)

**Fecha:** 4 de septiembre de 2026 · **Repo:** `suynda-contracts` · **Clase de evidencia:** DOC-A
(recon verificado contra código y ejecución) para §1–§5; **DOC-B** (propuesta) para §6 en adelante.

**Mandato:** Charter Factory Run #4 Rev 2.2 FROZEN, paso F-5 — «Contrato RC, incluyendo la superficie
pullable hacia Núcleo (A-4) y los contratos de provocación para verticales (C-7)». **Insumo
congelado:** `SUYNDA-DEPOSITO-DOMAIN-v1.0` (46 invariantes DEP-01…DEP-46, a la espera de firma).

**Este documento no diseña el RC.** Es el recon `file:line` que lo precede — qué molde existe, qué
guards hay que pasar, qué trampas ya mordieron a otro módulo, y qué del FROZEN no tiene dónde vivir
todavía. El diseño del RC es el paso siguiente y se aprueba antes de tocar un JSON.

**Baseline real de este recon** — corrido en fresco hoy:

| Hecho | Valor |
|---|---|
| `suynda-contracts` HEAD | `d7c133dfff42c87f6674ba5014e37b1c58bbd139` · tag **`v0.10.0`** · limpio, en `origin` |
| `npm run verify` | **DoD CHECK: PASS** + superficie OK |
| Inventario | 15 módulos · 40 eventos · 15 capabilities · 38 error codes · 13 metered ops · **2 manifiestos** (compra, lab) |
| Quién consume qué | `suynda-foundation` → **v0.10.0** · `lab` → v0.8.1 · `suynda-padron` → **v0.3.0** · `facturas-py` / `suynda-landing` → no consumen |

---

## 1. El molde — cómo se declara cada clase de cosa hoy

Todo lo que el RC agregue tiene que entrar por uno de estos moldes. No hay otros.

| Clase | Fuente canónica | Wrapper TS | Forma de fila | Cita |
|---|---|---|---|---|
| **Enum plano** | `data/enums.json` | `src/enums.ts` — `export const X = enumsData.X; export type X = (typeof X)[number]` | array de strings | `enums.ts:8-28` (`ModuleKey`, `PartyRole`, `IdentifierType`…) |
| **Enum con nota** | `data/enums.json` | `enumsData.X.values` | `{ "_status"?, "_note"?, "values": [...] }` | `LedgerTipo` — `enums.json:23-36`, `enums.ts:35-36`. **Es el precedente de un enum de dominio migrado desde un módulo**, con su justificación adentro del JSON |
| **Enum declarado y vacío** | `data/enums.json` | — | `{ "_status": "PROPUESTO", "values": [] }` | `CategoriaGasto` — `enums.json:53-57`. Precedente de «declarado, a cosechar» |
| **Evento** | `data/events.json` | `src/events.ts` | `{ type: "noun.verb_past", origen_module, version }` | `events.ts:9-13` |
| **Sobre de evento** | `schema/event-envelope.schema.json` | `src/envelope.ts` — `validateEnvelope()` | **cerrado** (`additionalProperties: false`), `ref: { id }` únicamente | `envelope.ts:29-45`; schema `required` en líneas 8-18 |
| **Capability** | `data/capabilities.json` | `src/capabilities.ts` | `{ key, availability: FAIL_OPEN\|FAIL_AFTER_GRACE\|FAIL_CLOSED, initiator: user\|system\|both }` | `capabilities.ts:8-19` |
| **Error code** | `data/error-codes.json` | `src/errors.ts` — `errorByCode()` | `{ code, http, message_es }` — es-PY llano, sin siglas | `errors.ts:8-12`; nota en `error-codes.json:3-5` |
| **Manifiesto** | `data/manifests/<key>.json` | `src/manifests.ts` — import estático + `MANIFESTS[]` | `{ module_key, manifest_version, functions[], roles[], role_grant_matrix, mandate_types[], permission_presets?[] }` | `manifests.ts:74-84` |
| **Función de manifiesto** | ídem | `ManifestFunction` | `{ function_key, nombre, descripcion, autorizada_por_canal, orden, delegable, scope_type? }` | `manifests.ts:9-35` |
| **Referencia cruzada** | `schema/reference.schema.json` | `src/reference.ts` | columnas `{stem}_id`, `{stem}_nombre_cache`, `{stem}_cache_at`, `{stem}_entity_version` | `reference.ts:18-41`; `ItemReference` en `:36-41` |
| **Operación medida** | `data/metered-operations.json` | `src/metered-operations.ts` | `{ module, operation_key, descripcion }` — **jamás `creditos`** | `metered-operations.ts:14-18` |
| **Semilla de módulo** | `data/modules.json` | `src/modules.ts` | `{ key, clase, nivel, nombre_es, descripcion_es, activo, subdomain, kind, orden }` | `modules.ts:25-76` |

**Dos patrones de manifiesto conviven**, y no son equivalentes:

- **`compra`** (`manifests/compra.json`): roles C7 declarados con `functions: []` (derivación apagada
  en producción el 24-ago, EQ-3), `role_grant_matrix` viva, `mandate_types` con perfiles. Es el patrón
  **legado**, sostenido por FKs existentes.
- **`lab`** (`manifests/lab.json`): `roles: []`, `role_grant_matrix: {}`, `mandate_types: []`, acceso
  **100 % por tildes** vía `permission_presets`, y **`scope_type: "departamento"`** en dos funciones.
  Es el patrón **vigente para un módulo nuevo** (Plan de Integración Canónica v1.1 §4).

**Depósito nace con el patrón de Lab.** Y tiene un `scope_type` natural que Lab ya legitimó: el
**almacén**.

---

## 2. Lo que YA existe para `deposito` — y en qué estado

| Qué | Dónde | Estado | Lectura |
|---|---|---|---|
| `deposito` es `ModuleKey` | `enums.json:5` | **CODE** | La key es permanente (`nacimiento-de-un-modulo.md:12-15`) |
| Semilla completa | `modules.json` → `{clase: comercial, nivel: 2, nombre_es: "Depósito", kind: horizontal, orden: 20, subdomain: null}` | **CODE** | `subdomain: null` es correcto hasta el deploy («Pronto» en el armador, `modules.ts:39-41`). `orden: 20` = segundo del ciclo compra→deposito→factura→nucleo (`nacimiento:102-106`) |
| **Dos eventos previos al dominio** | `events.json:12-13` → `stock.adjusted`, `stock.transferred` | **CODE — HUÉRFANOS** | Vienen del contrato v4.3, **anteriores al FROZEN**. Verificado: **nadie los emite ni los consume** (`grep` en foundation/padron/lab/facturas-py: cero). Su vocabulario («stock») **no es el del dominio** (C-6: la unidad canónica es la `InventoryOperation`). El RC tiene que **reconciliarlos con nombre**: reemplazar, o conservar como alias declarado. No pueden quedar como si fueran del dominio |
| Operaciones medidas | `metered-operations.json:6` — nota: *«deposito no tiene operación medida en v1 — regalo deliberado (§7.6.4)»* | **DECIDIDO** | No hay nada que agregar. La decisión ya está tomada y escrita |
| Capabilities `deposito.*` | `capabilities.json` | **NO EXISTEN** | Ver §4 — es la trampa de Lab |
| Error codes `DEPOSITO_*` | `error-codes.json` | **NO EXISTEN** | — |
| Manifiesto | `data/manifests/` | **NO EXISTE** | Ver §4 — sin manifiesto, nadie puede recibir una tilde de Depósito |
| Referencia a ítem | `reference.ts:36-41` `ItemReference` | **CODE, tenant-scoped** | Sirve para el ítem del tenant. **No hay stem para la identidad de ítem en el grupo** (DEP-41). Ver §7 |

---

## 3. Los guards que el RC tiene que pasar — y los que tiene que TOCAR

`npm run verify` = `build` + `scripts/verify-v0.mjs` + `scripts/verify-superficie.mts`. Los tres
corren hoy en verde. El RC los tiene que dejar en verde, y **dos de ellos están escritos para
romperse cuando nace un módulo** — a propósito.

| Guard | Cita | Qué hace | Qué le pasa con el RC |
|---|---|---|---|
| Conteo de manifiestos | `verify-v0.mjs:425-429` → `MANIFESTS.length === 2` | Fija que hay exactamente dos | **ROMPE al agregar `deposito.json`.** Hay que subirlo a 3 **y** agregar `manifestByModuleKey("deposito")` al lookup. Es el diseño: el guard obliga a mirar |
| Guards compartidos de manifiesto | `verify-v0.mjs:107-196` | `scope_type` no vacío ni mágico (`*`, `all`) · **scoped ⇒ `delegable: false`** · scoped no compone roles · presets con funciones existentes, no vacíos, **conjuntos distintos entre sí** | Corren solos sobre todo `MANIFESTS`. El manifiesto de Depósito los tiene que pasar sin un guard propio |
| Guard de Lab | `verify-v0.mjs:199-264` | Firmas congeladas del manifiesto lab (26-ago) | No se toca. **Si el RC quiere firmar el manifiesto de Depósito igual que Lab, agrega un `verifyDepositoManifest`** con el mismo molde |
| Tripwire `ScopeType` | `verify-v0.mjs:431-436` | **No existe enum global de scope types**, a propósito: una dimensión nueva no exige release | Depósito declara `scope_type: "almacen"` **sin agregar nada a `enums.json`**. Si el RC crea `ScopeType`, el DoD grita |
| Eventos derivados de la fuente | `verify-v0.mjs:382-395` | `EVENTS` en `dist` = filas de `events.json` | Agregar eventos es mecánico |
| Sobre cerrado | `verify-v0.mjs:397-404` | `additionalProperties === false` | No se toca |
| Sin valores comerciales | `verify-v0.mjs:378-380, 461` | ningún `"creditos":` ni `"precio` en `data/` | Depósito no tiene metered ops; trivial |
| Generación del schema | `scripts/generate-schema.mjs` (`prebuild`) | Regenera `event.enum` y `origen_module.enum` del schema **desde** `events.json` y `modules.json` | Los eventos nuevos entran al enum del sobre solos. **No se edita el schema a mano** (`schema:24`) |
| Superficie | `scripts/verify-superficie.mts:24-53` | Todo tipo prometido es importable desde `dist/index.js`, y `ModuleSeed` coincide campo a campo con el JSON | **Todo tipo nuevo que el RC declare tiene que exportarse desde `src/index.ts`.** La lección de `v0.9.0`: `ModuleKind` existía y no se exportaba; Foundation no podía importarlo (`verify-superficie.mts:4-8`) |

---

## 4. Las trampas confirmadas en Foundation — las que ya mordieron

Estas no son hipótesis. Están en el código de Foundation en `v0.10.0` y una de ellas ya costó 134
tests rojos en Lab.

### T-1 · Capability desconocida = denegada siempre

`suynda-foundation/src/auth/capability.ts:18-24`:

```ts
const cap = BY_KEY.get(key);
if (!cap) return false; // unknown capability → deny by default
```

Y en la siembra de servicios, `suynda-foundation/src/seed/run.ts:249-253`: un permiso que no esté en
`CAPABILITIES` de contracts **hace fallar la siembra** con `service seed: permiso "…" is not in
@suynda/contracts CAPABILITIES`.

**Consecuencia dura:** **ninguna capability `deposito.*` puede existir sólo en el código de Depósito.**
Tiene que estar en `capabilities.json` **antes** de que Foundation pueda acuñar un token de servicio o
autorizar un llamado. Lab lo aprendió con `module_access.resolve`: la usaba, contracts no la
declaraba, y **cualquier respuesta se rechazaba siempre** (`lab/docs/design/pasada-4-cierre.md:22`).

### T-2 · Sin manifiesto no hay tildes

`suynda-foundation/src/seed/manifest-seed.ts:346-350` — `seedAllManifests()` itera **sólo**
`MANIFESTS`. Un módulo que no está ahí **no siembra funciones ni presets**, y por lo tanto **nadie
puede recibir una tilde suya en `/equipo`**. Depósito sin manifiesto es un módulo que existe en el
armador y no se puede operar.

### T-3 · Cambiar el contenido de un manifiesto sin bumpear `manifest_version` no hace nada

`manifest-seed.ts:303-308` — si `seededVersion === manifest.manifest_version` → `noop`. Y `:309-314`
— si la sembrada es mayor, `skip_downgrade`. **La lección de `v0.6.1`** (git log): el 0.6.0 cambió
`delegable`/`mandate_types` sin bump y todo entorno ya sembrado se quedó con el contenido viejo **en
silencio**. Cada iteración del manifiesto de Depósito durante el run **bumpea `manifest_version`**.

### T-4 · Un tipo de evento que no está en el enum del sobre se rechaza al ingerir

`scripts/generate-schema.mjs:5-9`: el enum del schema se genera desde `events.json` porque
`validateEnvelope()` lo compila para **ingesta**; si divergen, «a legitimately-typed event is rejected
at ingest». Depósito no puede emitir un evento que no esté en `events.json` de la versión que
Foundation tenga pineada. Hoy Foundation está en `v0.10.0`: **los eventos de Depósito existen para
Foundation recién cuando Foundation bumpee al RC.**

---

## 5. El sobre es reference-only — y eso decide dónde vive la superficie pullable

`schema/event-envelope.schema.json:97-108`: `ref` es `{ id }` y nada más; `additionalProperties:
false` en el sobre y en `ref`. `change_mask` son nombres de campos, «never values» (`envelope.ts:42`).
**A-3 no es una regla escrita: está compilada en el validador.**

**Consecuencia para A-4** («Núcleo obtiene estado mediante pull autenticado y versionado al módulo
owner»): **las consecuencias económicas de Depósito no pueden viajar en eventos.** El evento avisa
que algo pasó y da un `id`; Núcleo **hace pull por HTTP** al owner. Ésa es la arquitectura, no una
limitación.

**Y acá aparece el vacío más grande del recon:** **contracts no tiene ningún molde para una
superficie HTTP.** No hay OpenAPI, no hay registro de rutas, no hay schema de respuesta. Verificado:

- `suynda-foundation`, `suynda-padron`, `lab`: **cero** menciones a OpenAPI en `src/` y `docs/`.
- `facturas-py`: sólo el OpenAPI que FastAPI genera solo (`.venv/…/fastapi/openapi/`).
- Padrón documenta sus rutas **en comentarios de cabecera** (`suynda-padron/src/http/routes/items.ts:1-6`).

**El Charter pide que la superficie pullable sea parte del contrato RC (F-5) y A-4 la hace
obligación de nacimiento.** Hoy no hay dónde ponerla. Es la primera decisión de diseño del RC — ver
§8, D-1.

---

## 6. Lo que el FROZEN exige y contracts NO tiene — ledger de GAPs

Cada fila nombra el invariante que la exige. Nada acá es invento del recon.

### 6.1 Enums (→ `data/enums.json` + `src/enums.ts` + export en `index.ts`)

| Enum | Valores V1 | Exigido por | Nota |
|---|---|---|---|
| `ItemType` | `PRODUCT`, `SERVICE` | Charter B-1, Enablement E2 | **Es de Padrón, pero vive acá.** Padrón lo consume tras bumpear desde v0.3.0 (Enablement E5) |
| `ProvisionalBasis` | `PENDIENTE_FLETE`, `PENDIENTE_ARANCEL`, `PENDIENTE_FACTURA`, `VALOR_ADUANA`, `SIN_BASE` | **DEP-17** (enum, jamás texto libre), DEP-16, DEP-43 | Molde `LedgerTipo`: con `_note` que cite `[NORMA-V]` art. 26 para `VALOR_ADUANA` |
| `CostState` | `FINAL`, `PROVISIONAL`, `UNRESOLVED` | C-3, DEP-15 | `UNRESOLVED` sólo sobre salidas — la restricción es de dominio, no del enum |
| `CostFormula` | `WEIGHTED_AVERAGE` | DEP-12, **DEP-14 (DF-2)** | **Un solo valor a propósito.** El enum existe para que FIFO llegue como valor nuevo, no como cambio de significado |
| `TrackingClass` | `NONE`, `LOT`, `LOT_EXPIRY` | Charter A-1 (política de stock de Depósito), DEP-22, DEP-25 | — |
| `QuantityBranch` | `AVAILABLE`, `BLOCKED`, `SHORTFALL` | **DEP-01/02/03** | `UNALLOCATED` es marca sobre `SHORTFALL` bajo tracking, no cuarta rama (DEP-01). `RESERVED` **no** entra: recorte E |
| `TrueUpMode` | `RETRO`, `PROSPECTIVE` | **DEP-18** | — |
| `OperationState` | `POSTED`, `COMMITTED` | Charter **A-5** | «no `approved` como estado contable-operacional» |
| `InventoryOperationType` | a diseñar: `OPENING_INVENTORY`, `MANUAL_ENTRY`, `TRANSFER`, `COUNT_ADJUSTMENT`, `REVERSAL`, `WRITE_OFF`, `TRUE_UP`, `SHORTFALL_RECONCILIATION`, `LOCK_DATE_ADVANCE`?… | C-6, C-8, DEP-23, DEP-40, E-bis (b) | **Es la lista más sensible del RC**: define qué puede hacer Lucero. Se diseña contra los casos mínimos de graduación (opening por plantilla + entrada manual + transferencia + conteo/ajuste + reversa) |
| ~~`BlockReasonKind`~~ | ~~`DERIVED`, `POSTED`~~ | DEP-26, DEP-39 | **FUERA de contracts — D-4 decidido.** Vocabulario interno de Depósito; se promociona con nombre si otro módulo lo necesita |

**Lo que NO se declara:** `ScopeType` (tripwire, §3). Y **ningún enum vacío «a cosechar»** — el
precedente `CategoriaGasto` existe pero es lo contrario de un dominio congelado.

### 6.2 Eventos (→ `data/events.json`; el schema se regenera solo)

Reference-only por construcción (§5). Candidatos, `noun.verb_past`, `origen_module: "deposito"`:

| Evento | Exigido por | Reconcilia con |
|---|---|---|
| `inventory_operation.posted` | C-6, DEP-05 (nace al aprobarse) | **Sustituye** a `stock.adjusted`/`stock.transferred` (§2) — la unidad es la operación, no el «stock» |
| `cost_effect.recorded` | C-6, DEP-15/18 | Avisa a Núcleo que hay consecuencia económica **pullable** (A-4) |
| `lock_date.advanced` | DEP-20/21 | Auditable; Núcleo lo necesita para saber que un tramo cerró |

**Tres eventos, no cuatro** (decisión del orquestador, 4-sep): `shortfall.reconciled` **no** entra.
`inventory_operation.posted` con `InventoryOperationType = SHORTFALL_RECONCILIATION` ya expresa el
hecho, y si genera consecuencia económica, `cost_effect.recorded` despierta a Núcleo. Un tercer evento
sería duplicación semántica sin consumidor demostrado.

**Los huérfanos se retiran — D-2 decidido (a), sin alias.** Quitar `stock.adjusted` /
`stock.transferred` del enum cerrado del sobre es **BREAKING** y se declara así (§8). La superficie a
limpiar es **triple**, verificada:

| Dónde están inscritos | Quién lo limpia |
|---|---|
| `data/events.json:12-13` | El RC |
| `schema/event-envelope.schema.json` (enum `event`) | **Solo**, vía `prebuild` → `generate-schema.mjs`. No se edita a mano |
| **`docs/ARCHITECTURE.md:438`** — catálogo de eventos, fila `← deposito` | **NO el agente.** §0.1 (`CLAUDE.md` de este repo): «ningún agente edita el contrato; reporta la discrepancia». **Se reporta acá como discrepancia contrato↔código a resolver arriba**, con bump de versión del documento (v4.4 → v4.5) por acto del fundador. El RC no queda bloqueado por esto: el catálogo del documento describe al paquete, no al revés |

### 6.3 Capabilities (→ `data/capabilities.json`) — **precondición de T-1**

| Key | `availability` | `initiator` | Exigido por |
|---|---|---|---|
| `deposito.operation.post` | `FAIL_AFTER_GRACE` | `both` | C-6, C-7 (verticales provocan operaciones) |
| `deposito.operation.read` | `FAIL_OPEN` | `both` | — |
| `deposito.position.read` | `FAIL_OPEN` | `both` | DEP-01/02 (`NET_AVAILABLE_POSITION`) |
| `deposito.lock_date.advance` | `FAIL_CLOSED` | **`user`** | DEP-21 — acto humano, autorizado, auditado. Un servicio no cierra períodos |
| `deposito.economic_consequence.pull` | `FAIL_OPEN` | `system` | **A-4**, DEP-38 — es la capability de Núcleo |

Las políticas `availability` son propuesta; la convención de la casa es `_status: PROPUESTO` hasta el
security pass (`capabilities.json:2-5`).

### 6.4 Error codes (→ `data/error-codes.json`) — `message_es` en es-PY llano

| Code | http | Exigido por |
|---|---|---|
| `DEPOSITO_OPERATION_NOT_FOUND` | 404 | — |
| `DEPOSITO_LOCKED_PERIOD` | 409 | **DEP-21** — «hecho nuevo retrofechado a tramo cerrado» |
| `DEPOSITO_INSUFFICIENT_STOCK` | 409 | **DEP-06** — rechazo por política (cuando la organización elige rechazar) |
| `DEPOSITO_CROSS_GROUP_TRANSFER` | 422 | **DEP-28** |
| `DEPOSITO_ITEM_NOT_INVENTORIABLE` | 422 | Charter criterio 4 — `SERVICE` rechazado por Depósito |
| `DEPOSITO_LOT_BLOCKED` | 409 | DEP-25/26 — vencido sin waiver |
| `DEPOSITO_COST_NOT_ALLOWED` | 422 | **C-3** — el caller mandó costo en una salida |
| `DEPOSITO_LOCK_DATE_NOT_MONOTONIC` | 422 | **DEP-20** |
| `DEPOSITO_ANTECEDENT_REQUIRED` | 422 | DEP-21/46 — resolución sin antecedente registrado |

### 6.5 Manifiesto (→ `data/manifests/deposito.json` + `manifests.ts` + `index.ts` + `verify-v0.mjs`)

Patrón Lab: `roles: []`, `role_grant_matrix: {}`, `mandate_types: []`, `permission_presets`.
Funciones candidatas, con **`scope_type: "almacen"`** donde la operación es de un lugar:

| function_key | scope | delegable | Exigido por |
|---|---|---|---|
| `ver` | — | true | — |
| `operar` (entradas, salidas, transferencias) | `almacen` | **false** (guard: scoped ⇒ no delegable) | C-6, E-bis (b) |
| `contar` | `almacen` | false | DEP-33/34 |
| `aprobar_ajustes` | — | false | **DEP-05** — maker/checker |
| `dar_de_baja` | — | false | DEP-40 |
| `cerrar_periodo` (mover `lock_date`) | — | false | DEP-21 |
| `configurar` (políticas de stock, tracking) | — | false | A-1 |

Presets con **conjuntos distintos** (guard `verify-v0.mjs:178-193`). `manifest_version: 1` y **se
bumpea en cada iteración** (T-3).

### 6.6 Referencia cruzada — **E6 NO bloquea el RC** (corrección del orquestador, 4-sep)

El primer pase de este recon concluyó que, como `ItemReference` (`reference.ts:36-41`) es
tenant-scoped y **DEP-41** exige identidad de ítem en el grupo, el RC no podía declarar el stem del
pool hasta que E6 decidiera. **Esa conclusión filtraba una decisión interna de Padrón al contrato**, y
el FROZEN fue deliberado en lo contrario: DEP-41 bloquea el esquema persistente y F-6, **no F-5**.

**La salida, decidida:**

- `InventoryMovement` referencia el **`ItemReference` tenant-scoped** que **realmente movió
  físicamente** — es el molde que ya existe, sin cambios.
- La consecuencia de costo, si necesita referenciar el pool, usa una **referencia opaca propiedad de
  Depósito** (`pool_ref`), **no `group_item_id`**. Contracts no dice cómo se construye.
- **E6 determina después** cómo Depósito construye y resuelve internamente ese pool a partir de
  Padrón — `group_item_id` o equivalencias, lo que la mini-corrida elija.

Así el RC **se cierra completo sin esperar E6**, y **jamás se publica un tag con un campo
`[ABIERTO]`**. E6 sigue bloqueando correctamente el esquema y el Build Plan.

### 6.8 Tipos compartidos que cruzan la frontera — **D-1 reforzada** (nuevo)

`src/reference.ts` es el precedente: **tipos TS puros + schema JSON de forma**, «not a table — a
documented shape others compose» (`schema/reference.schema.json:5`). Es exactamente lo que A-4
necesita y lo que el primer pase de este recon subestimó: si contracts declara sólo una capability y
enums, **Núcleo y Depósito pueden compilar dos formas distintas de `EconomicConsequence`**.

**Regla decidida: contracts gobierna el significado; el OpenAPI de Depósito gobierna el transporte.**

| Tipo | Vive en | Exigido por |
|---|---|---|
| `EconomicConsequence` — la unidad pullable: identidad económica (`operation_id` + versión + rol), causa (`módulo_origen`, `documento_causante`), ejes (`tenant_id`, `grupo_id`), fechas (`effective_at`, `recorded_at`, `target_effective_as_of?`), efectos de costo | `src/deposito.ts` (nuevo) + `schema/economic-consequence.schema.json` | **A-4**, C-6, C-10, DEP-07/09, DEP-18/21, DEP-30/31, DEP-38 |
| `CostEffectDto` — `cost_state`, `provisional_basis?`, `true_up_mode?`, montos **como string decimal**, `pool_ref` opaco | ídem | C-3, DEP-15/16/17/18, DEP-36 |
| `PoolRef` — opaco, propiedad de Depósito | ídem | DEP-10, §6.6 |
| `InventoryMovementDto` — `ItemReference` + rama (`QuantityBranch`) + cantidad en unidad base como string decimal | ídem | DEP-01/02, C-2 |

**No entra:** paths, parámetros, status codes, auth — eso es transporte y vive en el OpenAPI del repo
de Depósito, versionado con el tag del módulo. **Tampoco** una familia `schema/pull-surfaces/*`.

### 6.7 Módulos y metered — **sin cambios**

`modules.json` no se toca (`subdomain` sigue `null` hasta el deploy; `orden: 20` correcto).
`metered-operations.json` no se toca (regalo deliberado).

---

## 7. Dependencias que el RC no controla

| Dependencia | De quién | Bloquea |
|---|---|---|
| **E6 / DEP-41** — identidad de ítem en el grupo | Mini-corrida F-2 (Padrón) | **Nada del RC** (§6.6, corregido): el movimiento referencia `ItemReference` tenant-scoped y el costo un `pool_ref` opaco de Depósito. E6 bloquea el esquema persistente y F-6. **Jamás se publica un tag con `[ABIERTO]`** |
| **Padrón en `v0.3.0`** | Enablement E5 | Padrón no ve `ItemType` hasta bumpear 7 versiones, cruzando el BREAKING de `v0.4.0`. Mitigante verificado en el Enablement: padrón no importa `ROLE_KEYS` |
| **Foundation en `v0.10.0`** | Foundation | Los eventos y capabilities de Depósito existen para Foundation **recién cuando Foundation bumpee al RC** (T-1, T-4). Es un push a Foundation, con su `npm run build` (memoria: tsx no chequea tipos, Railway sí) |
| **Firma del FROZEN** | Fundador | El RC deriva de él. Diseñar el RC antes de la firma es válido; **publicarlo por tag no** |

---

## 8. Decisiones — CERRADAS por el orquestador el 4-sep-2026

Las cinco preguntas del primer pase quedaron decididas en la misma revisión que aprobó el recon. Dos
cambiaron respecto de lo recomendado (D-1 reforzada, D-3 sin `_source`); se registran con su
redacción decidida.

**D-1 · Superficie pullable (A-4) = (a) REFORZADA.** El transporte HTTP —paths, parámetros, status
codes, auth— vive versionado **en el repo de Depósito** (OpenAPI). **No** nace una familia
`schema/pull-surfaces/*`. **Pero `@suynda/contracts` sí posee los DTO/tipos canónicos que cruzan la
frontera** —la consecuencia económica pullable, sus enums y referencias— porque con sólo una
capability y enums, A-4 queda implícito y Núcleo y Depósito pueden compilar dos
`EconomicConsequence` distintas. El sobre reference-only confirma que el payload no viaja por evento.
**Regla: contracts gobierna el significado; el OpenAPI de Depósito gobierna el transporte.** → §6.8.

**D-2 · Huérfanos = (a), SIN alias.** `stock.adjusted` y `stock.transferred` se retiran. Son
vocabulario anterior al dominio; la unidad congelada es `InventoryOperation`. **BREAKING declarado.**
La limpieza abarca `events.json`, el schema generado y —**por acto del fundador, no del agente,
§0.1**— la fila de `ARCHITECTURE.md:438`. → §6.2.

**D-3 · `_status: PROPUESTO` SÍ · `_source` NO.** `_status` es convención real del repo (enums,
capabilities, metered, errors). `_source` no tiene precedente y **no se introduce una dimensión de
metadata sólo para Depósito**. La provenance entra por la convención existente **`_note` /
`_notes`**, con la forma `Source: SUYNDA-DEPOSITO-DOMAIN-v1.0-FROZEN · DEP-17/18/…`. Trazabilidad sin
ampliar el metamodelo. Donde el artefacto no tiene ranura de nota (`events.json` es un array plano;
el manifiesto no tiene campo libre), la provenance vive en el mensaje de commit y en el diseño.

**D-4 · `BlockReasonKind` FUERA de contracts.** DEP-26 gobierna la semántica dentro de Depósito;
ningún consumidor externo necesita distinguir `DERIVED` de `POSTED` para cumplir su contrato. Si
mañana otro módulo lo necesita, **se promociona con nombre**. V1 no globaliza vocabulario interno por
anticipación.

**D-5 · Una sola `v0.11.0 — BREAKING`.** Enums + capabilities + errors + events + manifiesto + tipos
compartidos en **un** tag. La ruptura viene explícitamente de retirar valores de un enum cerrado. El
repo ya usa esta disciplina pre-1.0 (`v0.4.0`); no se fragmenta el RC en tags parciales.

**Dos precisiones más del orquestador, incorporadas:** `shortfall.reconciled` no es evento (§6.2) ·
el manifiesto sigue el patrón Lab con `scope_type: "almacen"` **sin** `ScopeType` global (§6.5) — el
tripwire de `verify-v0.mjs:431-436` existe precisamente para impedir esa generalización.

**Separación formal, registrada:** el orquestador aprueba F-4/F-5 como etapas de proceso; **la firma
que congela el dominio es acto del fundador.** El diseño del RC avanza antes de esa firma; **el tag
`v0.11.0` no se publica hasta que F-4 esté formalmente firmado.**

---

## 9. Forma del diff del RC — para que la aprobación tenga qué mirar

Orden de trabajo, cada paso deja `npm run verify` en verde:

1. `data/enums.json` + `src/enums.ts` + `src/index.ts` — los enums de §6.1, con `_status` y
   `_note` de provenance (D-3). **Superficie primero** (`verify-superficie` los tiene que ver).
2. **`src/deposito.ts` + `schema/economic-consequence.schema.json` + `src/index.ts`** — los tipos
   compartidos de §6.8 (D-1 reforzada). Molde `reference.ts`.
3. `data/capabilities.json` — §6.3, con línea de provenance en `_notes`. **Antes que cualquier
   código de Depósito** (T-1).
4. `data/error-codes.json` — §6.4, ídem.
5. `data/events.json` — quitar dos, agregar tres (§6.2, D-2). `prebuild` regenera el schema solo.
6. `data/manifests/deposito.json` + `src/manifests.ts` (import + `MANIFESTS`) + `src/index.ts`
   (`DEPOSITO_MANIFEST`) + `verify-v0.mjs:425-429` (3 manifiestos, lookup) + `verifyDepositoManifest`
   con las firmas del manifiesto.
7. `README.md` — la tabla de «What lives here» gana la fila de tipos compartidos; el inventario
   cambia.
8. **Reporte de discrepancia** (§0.1): `ARCHITECTURE.md:438` sigue listando los huérfanos. Lo
   resuelve el fundador con bump a v4.5. No bloquea el tag.
9. Tag **`v0.11.0 — BREAKING`**, mensaje en el formato de la casa. **Sólo después de la firma de
   F-4.**
10. **Después**, y como corridas separadas con su propia compuerta: bump en Foundation (T-1/T-4),
    bump en Padrón (E5).

**Lo que este recon no hizo:** no escribió un JSON, no diseñó `InventoryOperation` como tipo, no
eligió nombres definitivos. Todo lo de §6 es candidato hasta el diseño aprobado.

---

## Apéndice · Comandos de verificación de este recon

```
cd C:\Suynda\suynda-contracts && git rev-parse HEAD && git describe --tags && git status -sb
cd C:\Suynda\suynda-contracts && npm run verify
grep -rn "stock\.adjusted\|stock\.transferred" C:\Suynda\suynda-foundation\src C:\Suynda\suynda-padron\src C:\Suynda\lab\src   # cero
```
