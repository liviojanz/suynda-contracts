# Integración de un módulo

**Fecha:** 6 de septiembre de 2026 · **Estado:** BORRADOR para firma del fundador · **Write-scope:** este archivo.

`nacimiento-de-un-modulo.md` dice qué hay que decidir para que un módulo **exista** en el
contrato. Este documento dice todo lo que un módulo **integra** para operar dentro de Suynda,
de punta a punta, con **quién lo hace cumplir** en cada fila. Si no hay guard, no es una regla:
es una intención, y queda marcada como tal.

La Guía de Integración v2 de Foundation (`suynda-foundation/docs/guia-integracion-v2.md`) sigue
siendo el contrato del lado de la plataforma. Este documento **la referencia, no la repite**: su
trabajo es la lista completa vista desde el módulo, y el contrato de la tarjeta de `/equipo`
(§3), que hasta hoy no estaba escrito en ningún lado.

> **Por qué existe.** Integrar Lab costó unas cinco veces lo que costó fabricarlo: la Factory
> corrió 29 stages entre el 24 y el 26 de agosto (`2cad399` → `aaeeacb`), y la integración
> arrancó el 26 y al 6 de septiembre sigue abierta. Cinco causas, todas previsibles: el módulo
> se fabricó contra un fork de la plataforma; la plataforma tuvo que crecer durante la
> integración; unas 2.400 líneas de plomería se escribieron a mano y se reescribieron dos
> veces; el shell se definió después del módulo; y el despliegue no tenía molde. Cada sección
> de abajo cierra una de esas puertas.

---

## 0. El principio — cuatro capas, una regla

| Capa | Hace | No hace |
|---|---|---|
| **Contracts** | declara la identidad, las funciones, la dimensión de alcance y los presets | no conoce tenants ni personas |
| **Foundation** | guarda las tildes y los alcances, resuelve el acceso efectivo, sirve el marco | no interpreta qué es un Departamento ni un Almacén |
| **Hub** | administra permisos y presets en `/equipo`, y es la puerta de entrada | no lee la base, no renderiza el shell de nadie |
| **Módulo** | hace cumplir lo que la plataforma declara, contra su propio catálogo | no define ni edita permisos, no tiene login propio |

Es la tabla del Plan de Integración Canónica v1.1 §3, promovida a regla general. Y la que gobierna
cualquier duda sobre UI: **el paquete manda cómo se ve; Foundation manda qué se muestra**
(`suynda-ui/docs/design/shell-canonico.md` §1).

---

## 1. Contracts — lo que se declara ANTES del código

Nada de esta sección se escribe después de la primera migración. El tag se publica primero; el
módulo lo pinea; recién entonces hay código.

| Qué | Dónde | Quién lo hace cumplir |
|---|---|---|
| `key`, `nombre_es`, `clase`, `kind`, `subdomain`, `orden` | `data/modules.json` | `nacimiento-de-un-modulo.md` — el tipo, y los guards de `scripts/verify-v0.mjs:374-389` |
| **Manifiesto** — funciones con `scope_type`, presets, `roles: []` | `data/manifests/<key>.json` | `verify-v0.mjs:113-192` (§3.2) más un bloque por módulo (`:216-259` lab, `:271-331` deposito) |
| Capabilities que el módulo **llama** — `entitlements.check`, `padron.*`, `credits.consume` | `data/capabilities.json` | Foundation niega toda capability desconocida (`auth/capability.ts`) y rechaza sembrar un servicio con permisos no declarados (`seed/run.ts:248-256`) |
| Capabilities que el módulo **expone** a otros servicios | ídem | el mismo guard, del otro lado |
| Eventos que emite y consume, con `version` | `data/events.json` | el sobre cerrado (`schema/event-envelope.schema.json`) |
| Operaciones medidas — sólo las **claves**, jamás costos | `data/metered-operations.json` | `metered-operations.ts` |
| Códigos de error, en castellano llano | `data/error-codes.json` | `errorByCode()` |
| Enums de dominio que otro módulo deba interpretar | `data/enums.json` | el tipo |
| Referencias cruzadas (`{stem}_id` + caché) | `schema/reference.schema.json` | `reference.ts` |
| **La métrica de plan** — la unidad en que el módulo se vende (Lab: pacientes o análisis por mes; Compra: facturas por mes) | `data/manifests/<key>.json` | **hoy nada** — entra con ACT-1b (ver §10); el módulo que la declare sin contador no compila el guard cuando exista |

**La métrica de plan es parte de nacer.** Decisión del fundador (6-sep-2026, el modelo de
créditos, `suynda-foundation/docs/design/corrida-act-1-diseno.md` §6): cada módulo, al
construirse, **declara su métrica de plan en el manifiesto e integra su contador de uso** —
como Lab ya cuenta análisis y Compra cuenta facturas. **Un módulo sin contador no puede tener
planes.** Los planes se eligen por volumen en esa métrica, el excedente consume créditos del
pool del grupo y jamás bloquea, y los precios viven en Foundation como dato editable — nunca
en el módulo ni acá.

**El patrón vigente de manifiesto es el de Lab, no el de compra:** `roles: []`,
`role_grant_matrix: {}`, `mandate_types: []`, acceso 100 % por tildes con `permission_presets`, y
`scope_type` opaco en las funciones que lo necesiten (`data/manifests/lab.json`). Compra es el
patrón legado, sostenido por FKs que ya existen.

**La trampa del `manifest_version`, ya pagada.** Foundation siembra por versión y hace `noop` si la
versión ya está sembrada (`seed/manifest-seed.ts:298-309`). Un manifiesto que cambia de contenido
sin subir de versión **no llega** a una base que ya conoció la anterior. La Factory de Lab declaró
8 funciones bajo `manifest_version: 1` y el canónico 9 bajo la misma: `configurar` faltó en silencio.

---

## 2. Foundation — lo que se siembra y lo que se opera

| Qué | Cómo llega | Quién lo hace cumplir | Estado |
|---|---|---|---|
| Fila en `modules` | siembra desde `MODULES` (`seed/run.ts`) | `anti-resurreccion.pgtest` | CODE |
| Funciones y presets del manifiesto | `seed/manifest-seed.ts:24-53` y `:126-182`; un preset se **deprecra**, jamás se borra | FK compuesta a `module_functions` | CODE |
| Fila en `service_registry` — `<key>-service`, kid, permisos | siembra en `seed/run.ts:216-280` | `assertKnownPermisos` | **HUECO:** hoy sólo `compra-service`, `padron-service` y `foundation`. No hay `lab-service` en el canon; la constante de Lab (`src/platform/service-identity.ts:5`) vino del fork |
| URL del módulo | se **compone**: `subdomain` + `PLATFORM_BASE_DOMAIN` (`shell/shell-service.ts:184-185`, `config/env.ts:718`) | el manifiesto | CODE |
| URL del hub | `platform.hub_url`, una vez, arriba (`shell-service.ts:212`) | — | CODE |
| Cookie válida en el subdominio | `COOKIE_DOMAIN=.suynda.com` a propósito (`config/env.ts:565-571`) | verificado por el smoke §9 de Lab en producción | CODE |
| Catálogo comercial — plan, costos | `module_plans`, `operation_costs`, `commercial_config` con vigencia | Guía v2 §4 Paso 2 | CODE |
| **Entitlement del módulo en un tenant EXISTENTE** | no existe camino: los únicos escritores son la saga del alta y las tuteladas | — | **HUECO** — Lab entró por un `INSERT` a mano en Railway (`lab/docs/design/pendientes-plataforma.md`) |
| El alta ofreciendo el módulo | el catálogo de intenciones sólo conoce `compra` | — | **HUECO** (mismo documento) |

---

## 3. El contrato de la tarjeta — qué declara un módulo para que `/equipo` lo pinte solo

`/equipo` es la única administración humana de permisos de miembro (Guía v2 §4, frontera Rev 1
§1.4). Desde la pasada 3 del hub apila **una tarjeta por módulo** sin conocer ninguno: todo lo
que pinta sale de tres fuentes de datos y una convención. Esta sección las nombra, porque hasta
hoy un módulo nuevo tenía que leer el código del hub para saber qué le pedía.

### 3.1 · La tarjeta aparece

La lista de tarjetas sale del **launcher de `/v1/shell`**, filtrado a `entitled: true`
(`suynda-landing/src/lib/equipo-modulos.ts`, `modulosAdministrables`; consumido en
`src/scripts/equipo.ts:433-440`). No hay lista propia en el hub: la misma fuente que pinta el riel
pinta las tarjetas.

**Lo que el módulo declara:** su fila en `modules.json` con `clase: comercial` — el shell excluye
`plataforma` — y, para cada tenant, un entitlement vigente. **Sin entitlement no hay tarjeta**, y hoy
eso depende del hueco de §2.

### 3.2 · El vocabulario

`GET /v1/members/catalog?module=<key>` (`foundation/src/http/routes/members-catalog.ts:44`),
admin del tenant. Devuelve (`:99-116`):

```
{ module,
  actions: [{ functionKey, nombre, descripcion, orden, scopeType }],   ← TODAS las vivas
  presets: [{ presetKey, nombre, orden, functionKeys[] }] }            ← sólo los vivos
```

**Lo que el módulo declara:** exactamente su manifiesto. `nombre` y `descripcion` son lo que la
persona lee al lado de cada tilde; `orden` es el orden de las filas; `scopeType` no-nulo es lo que
le dice al hub que esa tilde necesita selector de alcance (`equipo.ts:806`).

### 3.3 · Los presets

Chips que preseleccionan tildes (`equipo.ts:825-848`). Tres reglas, las tres vigentes en código:

- **Jamás autoridad.** Foundation no lo lee para decidir nada; sólo lo sirve como vocabulario
  (`suynda-landing/src/lib/presets.ts`, encabezado).
- **No se persiste cuál se eligió.** Ningún `preset_key` viaja en el guardado. El rótulo se
  **deriva** comparando conjuntos: coincidencia exacta → el nombre del preset; si no →
  "Personalizado" (`rotuloDePreset`).
- **No llevan alcance.** Aplicar "Carga" concede `cargar` fail-closed hasta que alguien elija
  departamentos. La pantalla lo muestra, no lo esconde (Guía v2 §4).

**Lo que el módulo declara:** `permission_presets` con `preset_key` estable, `nombre`, `orden` y
`functions[]`. Los guards: cada función referenciada existe en el mismo manifiesto; no hay dos
presets con el mismo conjunto (`verify-v0.mjs:146-192`). Y una regla de producto ya firmada en
Lab: un preset que sólo concede `ver` colisiona con el rótulo derivado y **no se declara**
(Plan v1.1, Enmienda 5).

### 3.4 · Los alcances

Para cada tilde con `scopeType`, el hub ofrece **"Todos"** (`all_scopes: true`, dinámico, vale
para los scopes presentes y futuros) o **"Elegir"** (refs enumerados) (`equipo.ts:938-1031`). El
guardado escribe `PUT /v1/members/:userId/grants/scopes` con `{ moduleKey, functionKey, allScopes,
scopeRefs }` (`equipo.ts:1058-1067`), en un plan ordenado quitar → dar → alcances.

Las invariantes, del lado de Foundation y del módulo (Guía v2 §4 Paso 3):

| Lo que llega al módulo | Lo que el módulo hace |
|---|---|
| `scope_type: null` | la función vale entera |
| `all_scopes: true` | vale sobre todos los scopes que el módulo conozca, sin enumerar |
| `scope_refs: [...]` | vale sólo sobre esos refs, interpretados contra **su** catálogo |
| `all_scopes: false` y `scope_refs: []` | **niega** todo acto dirigido a un scope: es el estado normal tras aplicar un preset |
| un ref que el módulo no reconoce | **se niega, nunca se ignora** |
| sesión prestada | llega con la dimensión real y fail-closed |

**Lo que el módulo declara:** `scope_type` en las funciones que lo necesiten, como string opaco
(`"departamento"`, `"almacen"`). Con dos guards: una función con `scope_type` no puede ser
`delegable` y no puede aparecer en `roles[].functions` (`verify-v0.mjs:126-144`).

### 3.5 · Las opciones de alcance — lo único que el módulo SIRVE

Foundation guarda refs opacos. **Los nombres son datos por tenant que sólo el módulo conoce**, así
que el hub le pide la lista al módulo cuando pinta el selector (Guía v2 §4). Lab ya la sirve:

```
GET /api/departments  →  { departments: [{ id, label }] }
```

(`lab/src/http/app.ts:157-171`). Gateada por `authorize()` — sesión, tenant, allowlist y
entitlement — **sin exigir ninguna función**: quien llama es un admin del tenant que puede no tener
ninguna tilde del módulo.

**Convención propuesta para el módulo #3 en adelante** — a firmar:

```
GET /api/alcances?scope_type=<el string del manifiesto>
  → 200 { scope_type, opciones: [{ id: string, label: string }] }
  → 400 si el scope_type no es uno que el módulo declaró
```

Una sola ruta por módulo, cualquiera sea su cantidad de dimensiones, y el hub la compone con la
`url` que `/v1/shell` ya sirve. `GET /api/departments` de Lab queda como alias hasta que el hub
consuma la nueva.

> **Hoy el hub NO llama a ninguna de las dos.** Sólo mira si `MODULE_URLS[moduleKey]` existe para
> decidir si avisa «No pudimos cargar los nombres; se muestran los identificadores»
> (`equipo.ts:1028-1031`). El picker por nombre es un pendiente de plataforma con dueño
> `suynda-landing`, registrado en `lab/docs/design/pendientes-plataforma.md`. Ver §10.

### 3.6 · Lo que la tarjeta NO usa

Ni `roles[]` ni `role_grant_matrix` ni `mandate_types` — el hub apila tildes sobre la fila del rol
C7, que es de otra autoridad (`presets.ts`, "las FIJAS"). Un módulo nuevo no llena esos tres
campos.

### El resumen de la tarjeta, para copiar

| Para que… | El módulo declara… | Quién lo hace cumplir |
|---|---|---|
| la tarjeta aparezca | `clase: comercial` + entitlement vigente en el tenant | `ShellService` filtra por clase; el hub filtra por `entitled` |
| las tildes tengan nombre y orden | `functions[].nombre`, `descripcion`, `orden` | `verify-v0.mjs` + siembra |
| una tilde pida alcance | `functions[].scope_type` | guard scoped ⇒ no delegable |
| los chips existan | `permission_presets` | guard de referencia y de conjunto único |
| el selector muestre nombres | `GET /api/alcances` (propuesto) o `/api/departments` (Lab) | **nadie todavía** — hueco del hub |

---

## 4. Entorno del módulo — los nombres canónicos

Los nombres son los de `lab/.env.example`, que son los que ya andan en producción. **La fuente de
verdad de una URL interna es la variable del servicio que YA anda contra ese destino** — jamás un
ejemplo, jamás un README. Es la lección del incidente de Padrón del 31-ago.

| Variable | Para qué | Obligatoria | Origen del valor |
|---|---|---|---|
| `MODULE_KEY` | la key canónica; el arranque rechaza una que no esté en `MODULE_KEYS` | sí | `modules.json` |
| `FOUNDATION_BASE_URL` | JWKS de usuarios, `entitlements/check`, `/v1/shell` — **una sola variable para las tres** | sí | la de Foundation en el servicio que ya funciona |
| `FOUNDATION_USER_ISSUER`, `FOUNDATION_USER_AUDIENCE` | verificación del JWT de persona | sí | `AUTH_ISSUER` / `AUTH_AUDIENCE_USERS` de Foundation |
| `SESSION_COOKIE_NAME` | cookie primero, Bearer después | default `suynda_session` | `COOKIE_NAME` de Foundation |
| `PADRON_BASE_URL` | red privada de Railway, resuelve a IPv6 | sí, **sin fallback** | la de Foundation, no la de un ejemplo |
| `DATABASE_URL` | base propia del módulo | sí | Railway |
| `PORT`, `HOST` | `HOST=0.0.0.0` en contenedor | `HOST` default `127.0.0.1` | Railway |
| `PILOT_TENANT_IDS` | allowlist; ausente o vacía = todo denegado | sí durante piloto | el operador |
| guard de resets destructivos (`LAB_TEST_ENV`) | sólo en test/CI, jamás en runtime | — | CI |
| material de clave de servicio | sólo si el módulo llama con token de servicio | según §10 | operador de plataforma |

**Lo hace cumplir:** `loadModuleRuntimeConfig` falla al arrancar por cada faltante
(`lab/src/platform/module-config.ts`). Es el molde.

---

## 5. Plomería en el módulo — lo que hoy se escribe a mano

Lo que Lab tiene hoy y **ningún módulo debería volver a escribir**. El destino propuesto es un
paquete por tag, `@suynda/modulo`, con Lab como primer consumidor. El marco del navegador **ya se
mudó** a `@suynda/ui` v0.3.0 (`montarMarco`, `suynda-ui/src/marco.ts`); lo que queda es el lado
servidor.

| Pieza | Hoy en Lab | Líneas | Destino |
|---|---|---|---|
| Verificación de sesión con JWKS cacheado | `src/platform/user-session.ts`, `jwt-ed25519.ts` | 243 | paquete |
| Tenant confiable desde el token, nunca del body | `src/platform/tenant.ts` | 26 | paquete |
| Gate de entitlement con `functions[]`, gracia contractual y fail-closed | `src/platform/entitlement.ts` | 229 | paquete |
| Cookie primero, Bearer después | `tokenFromRequest` en `src/http/app.ts` | — | paquete |
| Allowlist piloto fail-closed | `assertPilotTenantAllowed`, `src/platform/lab-context.ts` | — | paquete |
| Errores de plataforma con su código HTTP | `src/platform/errors.ts` | 152 | paquete |
| Cliente de Padrón con diagnóstico (causa al log, jamás `Authorization`) | `src/padron/client.ts`, `diagnostico.ts` | 314 | paquete |
| Doble de Padrón para tests, imposible en runtime | `src/padron/fake.ts` | 179 | paquete, test-only |
| Ruta de estáticos por mapa en memoria, sin escape posible | `src/http/estaticos.ts` | 206 | paquete |
| BFF del marco `/api/shell` — `disponible` distinto de `launcher: []` | `src/http/app.ts:123-152`, `src/platform/shell-client.ts` | 258 | paquete |
| Montaje del marco en la página | `src/http/montaje.ts` | 92 | paquete |
| `/health`, fail-fast por env, `start` sobre `dist` | `app.ts:98`, `listen.ts`, `package.json` | — | starter |
| Enforcement de alcance contra el catálogo propio | `src/lab/department-scope.ts` | — | **del módulo** — es dominio |
| Auditoría propia | `src/audit/store.ts` | — | **del módulo** |

**Lo que hace cumplir hoy:** nada compartido. Cada módulo tiene su copia: Lab la de arriba,
`facturas-py` una en Python (`backend/core/auth.py`), Visibilidad la suya
(`src/platform/foundation/shell.ts`). Tres copias que ya divergen.

---

## 6. UI — el módulo no escribe marco ni CSS

| Qué | Cómo | Quién lo hace cumplir |
|---|---|---|
| Pin `@suynda/ui` por tag | `package.json` — y el `package-lock` tiene que acompañar (`lab` `63950bf`: «el pin solo no alcanza») | `npm ci` |
| El marco se **monta**, no se escribe | `montarMarco({ raiz, traerShell, propio, tabs, pie, contenido })` | `scripts/compuerta-marco.mjs` mide propiedad |
| Riel = módulos de la plataforma; tabs = secciones del módulo; Configuración del módulo al pie | `shell-canonico.md` §1 y D1 (enmienda del 5-sep) | el montador |
| Tokens, piezas, íconos y fuentes por la ruta de estáticos | `consumo.md`, forma 3 | fail-fast al arrancar si el paquete no está |
| Cero color crudo, cero clase de Tailwind por defecto | `scripts/compuerta.mjs src` | **en CI, con línea de base en cero desde el primer stage** — Lab arrancó con 49 y hoy los baja con un trinquete |
| Plantilla de Inicio del canon, sin métricas fabricadas | `plan-vestido-canonico.md` F7 | revisión humana |
| Favicon e íconos por ruta, jamás `data:` | `img-src 'self'` de Foundation | CSP |
| Móvil ≤ 860 px con `@media screen and` | trampa pagada en UI-1: el riel se volvía barra inferior dentro del PDF | — |
| Cuando falta una pieza, **la corrida se detiene y la pieza entra al paquete primero** | doctrina firmada el 5-sep (`corrida-v0.3.0-el-marco.md` §0) | revisión humana |

---

## 7. Hub — nada por módulo, con dos excepciones nombradas

Desde UI-0a-bis el hub no cablea nada por módulo: ícono por `key`, `url` compuesta y `kind` los
sirve `/v1/shell`. Quedan dos cosas, y las dos tienen fecha:

- `MODULE_URLS` en `suynda-landing/src/config.ts:128` — legado que muere en UI-4, cuando el hub
  adopte el montador del paquete (hoy no consume `@suynda/ui`; `corrida-v0.3.0-el-marco.md` §1.1).
- El picker de alcances por nombre — §3.5.

---

## 8. Despliegue y conexión — la ficha

Cada módulo lleva una **ficha de despliegue** con estas filas, en este orden. Es el §9 del Plan
v1.1 convertido en checklist reusable.

1. Servicio propio en Railway y base propia. `HOST=0.0.0.0`, `start` sobre `dist`.
2. Variables de §4, copiadas del servicio que ya anda. Nunca del `.env.example`.
3. DNS del subdominio cuando `/health` y TLS respondan; recién entonces `subdomain` deja de ser
   `null` en `modules.json`, con tag nuevo.
4. Fila en `service_registry` por siembra, si el módulo llama con token de servicio.
5. Entitlement del tenant piloto — hoy por el hueco de §2.
6. Tildes desde `/equipo`, alcances para las funciones con `scope_type`.
7. **Smoke de conexión real**, y las tres verificaciones son distintas: el ciclo completo del
   módulo desde el hub; los nombres de Padrón en pantalla; y **la allowlist vista RECHAZAR** — con
   otro tenant, rechazo; con el propio, acceso. Un fail-closed que sólo se prueba dejando pasar no
   está probado.

---

## 9. Verificación — lo que la CI del módulo corre

`typecheck` · `build` (obligatorio: `tsx` no chequea tipos, Railway sí) · unit · pgtests con
`--test-concurrency=1` · migración desde cero sin fixtures · aislamiento de tenant en las dos
direcciones · un camino real de navegador por slice user-facing · `compuerta.mjs` y
`compuerta-marco.mjs` en cero. Molde: `lab/.github/workflows/ci.yml`.

Y antes de graduar, la **integración local completa** contra Foundation, Padrón y hub reales
(Plan v1.1 §8.1). El ítem de más fricción es armarle el entorno a Foundation — unos diez secretos
con valores de desarrollo. Se presupuesta, no se descubre.

---

## 10. Huecos vigentes, con dueño

Los que van a morder al próximo módulo aunque haga todo lo de arriba bien.

| Hueco | Dueño | Momento |
|---|---|---|
| Activar un módulo en un tenant existente — **ACT-1a, firmada el 6-sep-2026** (`suynda-foundation/docs/design/corrida-act-1-diseno.md`): `POST/DELETE /v1/entitlements`, la tarjeta dinámica en `/panel#descubri`, plan único por módulo | `suynda-foundation` + `suynda-landing` | en construcción |
| La métrica de plan en el manifiesto + el contador de uso en el módulo + el guard que los exija — **ACT-1b** | `suynda-contracts` (el campo y el guard) + cada módulo (el contador) | cuando ACT-1a esté desplegada |
| El picker de alcances consumiendo `GET /api/alcances` del módulo | `suynda-landing` | antes de que un piloto necesite alcances por nombre |
| Siembra de `<key>-service` en `service_registry` | `suynda-foundation` | antes de que un módulo llame con token de servicio |
| Cómo se autentica el módulo contra Padrón — hoy Lab reenvía el token de la persona (`src/padron/http.ts:25`); el Plan v1.1 Enmienda 8 pedía declararlo o firmar el riesgo | fundador | verificar que la firma exista |
| El alta ofreciendo módulos distintos de `compra` | `suynda-foundation` | con el primer vertical comercial |
| `@suynda/modulo` y el starter v2 — §5 | `liviojanz` | **antes de Run #4** (ver handbook, Fase 2) |

---

## 11. El resumen, para copiar

| Capa | Lo que el módulo hace | Quién lo hace cumplir |
|---|---|---|
| Contracts | declara todo §1 y publica tag **antes** del código | `npm run verify` + el tipo |
| Foundation | consume por siembra: módulo, manifiesto, servicio | pgtests de siembra |
| Tarjeta | manifiesto + entitlement + `GET /api/alcances` | guards de manifiesto; el hub filtra por `entitled` |
| Entorno | los nombres de §4, del servicio que ya anda | fail-fast al arrancar |
| Plomería | consume `@suynda/modulo`; escribe sólo enforcement y auditoría | **hoy nada** — ver §10 |
| UI | pinea `@suynda/ui`, monta el marco, cero CSS | dos compuertas en CI, en cero |
| Hub | nada | — |
| Despliegue | la ficha de §8, con el smoke que ve negar | revisión humana |
| Verificación | §9 y la integración local | CI |
