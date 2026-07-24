# Suynda — Architecture & Foundation Build Specification
### v4.4 · Julio 2026 · Documento maestro de arquitectura

> **Estado:** reemplaza a v4.3 y anteriores. Es el contrato contra el cual se construye todo.
> Claude Code, Grok Build y Cursor consumen **este archivo**, nunca una explicación de memoria.
>
> **Cambios v4.3 → v4.4 — todos nacidos de defectos encontrados construyendo, no de teoría:**
> **(a)** estándar de ledger: secuencia monótona por tenant asignada dentro de la sección
> serializada, con unique (§7.6.2) — el replay no cerraba bajo concurrencia · **(b)** regla de
> operación sin precio: `unpriced` nunca frena el sistema, con tres candados (§7.6.4) ·
> **(c)** `country_code not null default 'PY'` + normalización en el borde (§3.3) — el unique no
> protegía con NULL · **(d)** regla explícita de convergencia vs. 409 en upsert concurrente (§3.3)
> · **(e)** orden determinístico de locks para upsert multi-identificador (§3.3) · **(f)**
> gobernanza del propio contrato: vive en git, los agentes no lo editan (§0.1).
>
> *(v4.3 introdujo: estructura en código / valores en datos.)* **la estructura vive en el código; los valores viven en datos.** Los
> costos en créditos de cada operación y los precios de los planes salen de `@suynda/contracts`
> (donde v4.2 los había puesto por error) y pasan a **tablas de configuración de la Foundation**,
> editables desde el `/admin`, con **vigencia temporal**. Cambiar un precio = una fila nueva de
> configuración, efectiva hacia adelante, **sin deploy**. Con esto, la construcción completa queda
> desbloqueada: la conversación comercial define valores, no estructura.
>
> *(v4.2 introdujo: tiers eliminados, entitlement binario, planes por módulo + créditos universales
> en pool compartido, 1.000 créditos en el plan mínimo, bonus por combo en créditos, USD, sobregiro
> acotado, ledger append-only.)*

---

## 0. Cómo leer este documento

| Marca | Significado |
|---|---|
| **[LOCKED]** | Decidido. No se cambia sin revisar este documento primero. |
| **[PROPUESTO]** | Recomendación fundamentada. Necesita confirmación explícita antes de generar código. |
| **[ABIERTO]** | Sin decidir. **Bloquea** el trabajo que depende de ello. |
| **[SIN VERIFICAR]** | Proviene de un documento no disponible al redactar. Contrastar con el original. |

No se escribe código contra un `[ABIERTO]`.

### 0.1 Gobernanza de este documento **[LOCKED — nuevo v4.4]**

El contrato es el artefacto más importante del sistema y durante v4.3 fue el único que **no** estaba
bajo control de versiones — vivía en almacenamiento sincronizado y un agente lo editó en su lugar,
creando dos v4.3 distintas. Reglas, de acá en adelante:

1. **El contrato vive en git**, junto a `@suynda/contracts`. Cambios por commit, con diff revisable.
2. **Ningún agente edita el contrato.** Si el código y el contrato discrepan, el agente **reporta la
   discrepancia**; no edita el contrato para que coincida con el código. La discrepancia se resuelve
   arriba, decidiendo cuál de los dos está mal.
3. **Todo cambio bumpea versión.** Un cambio incompatible es una versión nueva, no una edición — la
   misma regla que §11 impone a APIs y eventos, aplicada al documento que la enuncia.
4. Un agente que encuentra una discrepancia contrato↔código está haciendo su trabajo bien. Ese
   hallazgo vale más que el parche.

**Documentos fuente:** `modulo_facturacion_electronica_spec_v3.md`, `Suynda_ERP_Master_Handbook_v1.1`,
`Suynda_Talent_Master_Handbook_v1.0`, `Suynda-Lab-Product-Positioning.md`,
`Suynda_Manual_Maestro_Estudio_v6`, `mos-phase1-build-spec.md`.
**Faltantes:** `Suynda Foundation Spec v1` y `Suynda-Web-Spec-2026-07-17.pdf` → derivados `[SIN VERIFICAR]`.

---

## 1. El modelo

### 1.1 Topología **[LOCKED]**

```
   ┌──────────────────────────────────────────────────────────────┐
   │  FOUNDATION            — clase: plataforma, no vendible       │
   │  identidad · tenants · entitlements · créditos y planes ·     │
   │  el frame · branding · oficina de correo · sagas plataforma   │
   │  Consume y hace cumplir los contratos. NO datos de negocio.   │
   └──────────────────────────────────────────────────────────────┘
   ┌──────────────────────────────────────────────────────────────┐
   │  PADRON                — clase: plataforma, no vendible       │
   │  Party · Catálogo · sucursales · catálogos oficiales          │
   │  Sólo entidades maestras. NINGÚN proceso de negocio.          │
   └──────────────────────────────────────────────────────────────┘
        ▲ ambos obligatorios para todo tenant
        │
   ── NIVEL 2 — módulos de negocio (comerciales, vendibles) ───────
   ┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐
   │ factura ││deposito ││ nucleo  ││ compra  ││ talento ││visibilid│
   └─────────┘└─────────┘└─────────┘└─────────┘└─────────┘└─────────┘
                                                          ┌─────────┐
                                                          │ conecta │
                                                          └─────────┘
   ── NIVEL 1 — verticales (independientes entre sí) ──────────────
   ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌────────┐
   │ lab  ││ vet  ││taller││ milk ││ farm ││comercio│
   └──────┘└──────┘└──────┘└──────┘└──────┘└────────┘
```

### 1.2 La regla de ruteo **[LOCKED]**

> **Los eventos pasan por la Foundation. Los datos nunca.**

### 1.3 Las dos clases de módulo **[LOCKED — actualizado v4.2]**

| Clase | Módulos | Activación | En `/armar` |
|---|---|---|---|
| **plataforma** | `foundation`, `padron` | Siempre activo | No |
| **comercial** | todo lo demás | **Entitlement binario** — activo = todo el módulo desbloqueado, sin restricciones de funcionalidad | Sí |

**No existen tiers de funcionalidad.** Lo que escala no es qué features tenés, sino cuántos créditos
tenés (§7.6).

### 1.4 Dependencias duras **[LOCKED]**

Dos: Foundation y `padron`. Degradación por política de capability en §8. El snapshot fiscal (§5.4)
hace auto-contenido todo documento ya emitido.

### 1.5 Superado en versiones anteriores

| Idea | Estado |
|---|---|
| Foundation posee el core canónico | Revertido (v2) |
| `factura` dueña de Cliente · `deposito` dueño de Producto | Revertido (v3) |
| "Todo pasa por la Foundation" · referencias JSONB | Corregido (v3) |
| `phone unique` como identidad · API key interna por (tenant, módulo) | Corregido (v4) |
| Servicio afirma su `tenant_id` · `provisionTenant()` "transaccional" · "nunca denegar en duro" | Corregido (v4.1) |
| **Tiers como gate de funcionalidad** (`iniciar/moderado/pleno/corporativo`) | **Eliminado (v4.2)** — entitlement binario + créditos |
| `monto_pyg` en suscripciones | **Corregido (v4.2)** — `currency + amount`, precios en USD |
| Costos y precios dentro de `@suynda/contracts` (código) | **Corregido (v4.3)** — valores en configuración con vigencia (§7.6.4) |
| Ledger sin clave de orden monótona (`created_at, id`) | **Corregido (v4.4)** — `ledger_seq` por tenant (§7.6.2). El replay no cerraba bajo concurrencia |
| Operación sin precio → error 500 que frena la operación | **Corregido (v4.4)** — `unpriced` (§7.6.4) |
| `country_code` nullable en `party_identifier` | **Corregido (v4.4)** — `not null default 'PY'` + normalización (§3.3) |
| Upsert concurrente devolvía 409 al perdedor | **Corregido (v4.4)** — converge (§3.3), como ya mandaba la DoD #10 |

---

## 2. Identidad y acceso **[LOCKED]**

### 2.1 El principio

> **`users.id` es la identidad. Teléfono, usuario, email y passkey son credenciales verificadas
> que apuntan a ella.**

### 2.2 Esquema

```sql
users
  id uuid pk, nombre text, status text, created_at timestamptz

user_identities
  id uuid pk, user_id uuid,
  tipo text,                       -- IdentityType (contracts): phone|email|username
  valor_normalizado text,          -- username: "slug-del-tenant/ana.lopez"
  verified_at timestamptz, revoked_at timestamptz null,
  is_primary boolean,
  unique (tipo, valor_normalizado) where revoked_at is null   -- índice PARCIAL

user_credentials
  id uuid pk, user_id uuid,
  tipo text,                       -- CredentialType (contracts): password|pin|passkey
  hash text,                       -- argon2id
  must_change boolean, failed_attempts int, locked_until timestamptz,
  updated_at timestamptz, revoked_at timestamptz null

tenant_auth_policy
  tenant_id uuid pk,
  metodos_permitidos text[],
  password_min_length int,
  requiere_segundo_factor_para text[]
```

### 2.3 Dos caminos de entrada

| Camino | Quién | Cómo nace | Credencial |
|---|---|---|---|
| **Self-service** | Dueño del tenant | WhatsApp, como hoy | Teléfono + OTP |
| **Provisión por admin** | Empleados | El admin lo crea desde el panel | `username` + contraseña inicial, cambio obligatorio |

### 2.4 Reglas duras

1. Todo tenant tiene siempre al menos una identidad con canal externo en rol de administración.
2. Reasignación: nunca se verifica un valor activo en otro usuario; primero revocación auditada.
3. Reset por admin: log inmutable + notificación a los demás admins.
4. Roles privilegiados requieren identidad personal.
5. Contraseñas: argon2id, throttling, cambio al provisionar, sin rotación periódica forzada.
6. Privilegiado sólo-contraseña: decisión explícita del tenant, registrada y auditada.

### 2.5 Ahora vs. después

Esquema completo en la primera migración. Producto v1: OTP + contraseña. PIN/passkey: en el enum,
se construyen cuando haga falta. Sin migración.

---

## 3. PADRON — el módulo de datos duros

### 3.1 Test de admisión **[LOCKED]**

Entra sólo lo que cumple las tres: (1) lo necesita más de un módulo, (2) existe independientemente
de cualquier proceso, (3) se referencia, no se transacciona.

### 3.2 Atributos universales **[LOCKED]**

> **`padron` contiene únicamente atributos universales. Los específicos de un módulo viven en una
> tabla de extensión dentro del módulo consumidor** (`lab_party_profile`, `taller_party_profile`, …).

Costo aceptado: las consultas cruzadas sobre atributos de extensión no son un join. Baja lógica:
las extensiones conservan histórico como cualquier consumidor.

### 3.3 Party **[LOCKED]**

> **Cliente y Proveedor no son entidades distintas. Son roles de la misma Party.**

```sql
party
  id uuid pk, tenant_id uuid not null,
  tipo text,                       -- fisica | juridica
  razon_social text not null, nombre_fantasia text,
  tipo_contribuyente text, tipo_regimen text,
  actividades_economicas jsonb,
  es_consumidor_final boolean default false,
  deleted_at timestamptz null

party_identifier
  id uuid pk, tenant_id uuid, party_id uuid,
  tipo text,                       -- IdentifierType: RUC|CI|PASSPORT|FOREIGN_TAX_ID
  country_code text NOT NULL DEFAULT 'PY',   -- [v4.4] nunca NULL: ver normalización abajo
  valor_normalizado text, verified_at timestamptz null,
  unique (tenant_id, tipo, country_code, valor_normalizado)
                                   -- + índice NULLS NOT DISTINCT como red de seguridad

party_role
  id uuid pk, tenant_id uuid, party_id uuid,
  rol text,                        -- PartyRole: cliente|proveedor|cliente_contable|emisor
  activo boolean, activated_at timestamptz, deactivated_at timestamptz null,
  unique (tenant_id, party_id, rol)

party_contact    id, tenant_id, party_id, tipo, valor, principal
party_branch     id, tenant_id, party_id, codigo, nombre, direccion, ciudad_id, tipo
```

- El propio tenant es una Party con rol `emisor`.
- **Deduplicación por identificador [reforzada v4.4].** RUC privilegiado para Paraguay; sin
  identificador → dedup asistida. Tres reglas que la hacen funcionar de verdad:
  - **Normalización en el borde.** `padron` normaliza **todo** identificador entrante antes de
    buscar o insertar: `country_code` ausente / vacío / `'py'` → `'PY'`, en mayúsculas; valor sin
    espacios ni separadores. Lectura y escritura pasan por el mismo punto. Permitir `NULL` era
    admitir dos representaciones del mismo hecho — `(RUC, NULL, X)` y `(RUC, 'PY', X)` son el mismo
    RUC del mundo real y el unique no los unía.
  - **Convergencia, no conflicto.** Ante upsert concurrente del mismo identificador, el perdedor de
    la carrera **se une al ganador y agrega su rol** — no recibe 409. Se implementa con advisory
    lock por `(tenant, identificador)` tomado al inicio de la transacción de upsert. Esto es lo que
    la DoD #10 siempre pidió ("una sola Party, ambos roles"). El código que devolvía 409 estaba
    fuera de contrato, no al revés.
    `PADRON_IDENTIFIER_CONFLICT` (409) queda reservado para el conflicto genuino: `addIdentifier`
    de un identificador que ya pertenece a **otra** Party.
  - **Orden determinístico de locks.** Un upsert puede traer varios identificadores. Los locks se
    toman **siempre en el mismo orden** (`tipo`, `country_code`, `valor_normalizado`); si no, dos
    transacciones con el mismo par en orden inverso se deadlockean. Test obligatorio: dos requests
    con el mismo par de identificadores invertido.
  - **Migración:** el `SET NOT NULL` falla si quedan filas con `country_code` NULL. La cosecha de
    `facturas-py` (§9.3) **va a traerlas** — años de clientes con RUC sin país. El backfill a `'PY'`
    resuelve el dedupe de la migración y el caso mixto de una sola vez.
- **Consumidor Final:** una sola Party especial por tenant, creada en el provisioning. Sin
  identificadores, sin otros roles, excluida de dedup, no puede darse de baja.
- **Roles se desactivan, nunca se borran** — conservan historia. Evento: `party.role_deactivated`.
- `firm` = tenant · `entity` = rol `cliente_contable` · `customer` = rol `cliente`.

### 3.4 Catálogo **[LOCKED]**

```sql
item
  id uuid pk, tenant_id uuid, codigo text, descripcion text,
  tipo text, unidad_medida_id uuid, categoria_id uuid,
  iva_tipo text, iva_proporcion numeric,
  deleted_at timestamptz null, unique (tenant_id, codigo)
```

El precio NO vive acá — `item_price` vive en el módulo vendedor.

### 3.5 Catálogos oficiales — no motor tributario **[LOCKED]**

Códigos y vigencias: alícuotas versionadas por fecha, monedas, unidades SIFEN, tipos de documento,
actividades económicas, geografía. Normativa compleja y validaciones → `factura` o librería fiscal.

### 3.6 Qué NO entra **[LOCKED]**

Plan de cuentas/centros de costo → `nucleo` · precios → módulo vendedor · empleados → `talento` ·
pacientes → `lab` · facturas → `factura` · gastos → `compra` · stock → `deposito` · asientos →
`nucleo` · actividades comerciales → `visibilidad` · usuarios/tenants/entitlements/créditos →
`foundation`.

### 3.7 Sucursal sí, numerador no **[LOCKED]**

> **`padron` dice qué sucursales existen. `factura` dice qué número sigue.**

### 3.8 API de PADRON **[LOCKED]**

```
── Commands (capability + Idempotency-Key obligatorios) ──
POST   /padron/v1/parties                     upsert por identificador
POST   /padron/v1/parties/{id}/roles          agregar / reactivar
POST   /padron/v1/parties/{id}/roles/{rol}/deactivate
POST   /padron/v1/parties/{id}/identifiers
POST   /padron/v1/parties/{id}/contacts
POST   /padron/v1/parties/{id}/deactivate     baja lógica
POST   /padron/v1/branches · PATCH /padron/v1/branches/{id}
POST   /padron/v1/items · PATCH /padron/v1/items/{id}
POST   /padron/v1/items/{id}/deactivate

── Queries (X-Read-Consistency: cached | strong) ──
GET    /padron/v1/parties/{id}
GET    /padron/v1/parties?identifier=RUC:PY:80012345-6
GET    /padron/v1/parties?role=proveedor&q=…
GET    /padron/v1/parties/{id}/roles
GET    /padron/v1/branches?party_id=…
GET    /padron/v1/items/{id} · GET /padron/v1/items?codigo=…|?q=…
GET    /padron/v1/catalogs/{tipo}?vigente_en=fecha

── Fiscal Profile (lectura fuerte consistente, §5.4) ──
GET    /padron/v1/parties/{id}/fiscal-profile
GET    /padron/v1/items/fiscal-profile?ids=…
```

Toda escritura devuelve la entidad con su `entity_version` nuevo y emite su evento vía outbox.
Errores con código estable de contracts. Paginación por cursor.

---

## 4. Mapa de propiedad **[LOCKED]**

| Entidad | Dueño único | Consumidores |
|---|---|---|
| Party + identificadores + roles + contactos | **padron** | todos |
| Sucursales | **padron** | factura, deposito, talento, lab, nucleo |
| Ítem / catálogo | **padron** | todos |
| Catálogos oficiales | **padron** | factura, nucleo, compra |
| Reglas y cálculos fiscales | `factura` (o librería fiscal) | — |
| Precios | el módulo que vende | — |
| Documento fiscal + snapshot | `factura` | nucleo, compra |
| Numerador / timbrado | `factura` | nadie |
| Stock, movimientos, costo | `deposito` | factura, nucleo, verticales |
| Plan de cuentas, asientos, centros de costo | `nucleo` | compra, reportes |
| Documento de gasto | `compra` | nucleo |
| Empleado, Workforce Status | `talento` | nucleo |
| Oportunidad, actividad | `visibilidad` | — |
| Paciente, muestra, resultado | `lab` | nadie |
| Orden de trabajo | `taller` | factura |
| Usuario, tenant, entitlement, **créditos**, branding, sagas | **foundation** | todos |

**`nucleo`:** el módulo financiero y contable. Recibe eventos y los convierte en cuentas por pagar
y cobrar, asientos, conciliaciones, costos y reportes.

---

## 5. Command · Event · Query · Saga

| Canal | Qué es | Transporte |
|---|---|---|
| **Command** | Pedir al dueño que cambie algo | REST síncrono, directo |
| **Query** | Pedir al dueño un dato | REST síncrono, directo |
| **Event** | Avisar que algo pasó | Asíncrono, vía Foundation |
| **Saga** | Modificar más de un dueño | Orquestada con estado persistido |

### 5.1 Escritura cruzada simple **[LOCKED]**

`compra` detecta proveedor inexistente → COMMAND a `padron` con Idempotency-Key → upsert por
identificador → evento → `compra` guarda `party_id`. **Ningún módulo crea Parties ni ítems en su
propia base. Nunca.**

### 5.2 Referencias: columnas, no JSONB **[LOCKED]**

`party_id` indexado + `party_nombre_cache` + `party_cache_at` + `party_entity_version`.

### 5.3 Consistencia **[LOCKED]**

Listas/pantallas → cache+TTL · validar referencia al crear → query directa · **emitir fiscal →
lectura fuerte + snapshot** · reportes contables → lectura fuerte. Header `X-Read-Consistency`.

### 5.4 El snapshot fiscal **[LOCKED]**

> **Leer fuerte antes de emitir y copiar el snapshot fiscal completo dentro del documento emitido.**

El documento histórico nunca se reconstruye contra el estado actual. Candado: el snapshot no es un
cache — sólo reproduce su documento.

### 5.5 Cache: cinco reglas **[LOCKED]**

Sólo display · nunca editable · nunca datos fiscales · siempre `cache_at`+`entity_version` ·
tombstones conservan historia.

### 5.6 Sagas **[LOCKED]**

> **Toda operación que modifica más de un dueño es una Saga: estado persistido, reintentos,
> compensación o roll-forward explícitos. Nunca transacción distribuida simulada.**

Orquesta el dueño del resultado de negocio · estado en `saga_runs`/`saga_steps` con
`idempotency_key` por paso · crash → retoma, no reinicia · roll-forward por defecto · trabada N
intentos → dead-letter + alerta.

**`ProvisionTenantSaga`** (orquesta: foundation) **[actualizado v4.2]**:

```
  1. crear tenant                          (local)
  2. crear usuario admin + identidad       (local)
  3. crear membership + entitlements       (local — binarios, por módulo contratado)
  4. otorgar créditos iniciales            (local — ledger: grant por cada plan + bonus combo §7.6)
  5. COMMAND padron: Party emisor          (remoto, idempotente)
  6. COMMAND padron: sucursal casa matriz  (remoto)
  7. COMMAND padron: Party consumidor-final(remoto)
  8. activar tenant                        (local — no antes de que 5–7 estén done)
  9. bienvenida WhatsApp                   (efecto externo, al final)
```

---

## 6. Eventos

### 6.1 El sobre **[LOCKED]**

`event · version · event_id · tenant_id · origen_module · ref · entity_version · change_mask ·
occurred_at`. Dos versiones distintas: `version` = esquema del mensaje; `entity_version` = estado
de la entidad.

### 6.2 `change_mask` **[LOCKED]**

Nombres de campo y contadores sí; valores, nunca. Esquema cerrado validado en el ingest.

### 6.3 Versionado del contrato **[LOCKED]**

Aditivo → misma versión · incompatible → versión nueva · transición con ambas vivas ·
`versiones_aceptadas` por suscriptor · sin suscriptor → dead-letter · deprecación mínima un release.

### 6.4 Orden **[LOCKED]**

> **Aplicar sólo cuando `incoming.entity_version > cached.entity_version`.**

### 6.5 Catálogo v1 **[PROPUESTO]**

```
party.created · party.updated · party.role_added · party.role_deactivated · party.deleted   ← padron
item.created · item.updated · item.deleted · branch.created · branch.updated                ← padron
tax_rate.published                                                                          ← padron
stock.adjusted · stock.transferred                                                          ← deposito
sale.completed · sale.voided · document.approved · document.rejected                        ← factura
purchase.registered · purchase.approved                                                     ← compra
employee.status_changed                                                                     ← talento
tenant.module_activated · tenant.module_deactivated · tenant.provisioned                    ← foundation
credits.granted · credits.low_balance · credits.exhausted · credits.overdraft_started       ← foundation
```

### 6.6 Outbox transaccional **[LOCKED]**

`UPDATE entidad + entity_version++ + INSERT outbox` en **la misma transacción local**; el worker
publica después. Nunca se publica fuera de la transacción que cambió el estado.

### 6.7 El paquete de contratos **[LOCKED — actualizado v4.2]**

> **Toda lista enumerada vive en `@suynda/contracts`. Nada de strings libres.**

Contiene **sólo estructura**: `ModuleKey` + clases + niveles · `PlanKey` (las claves, no los
precios) · **`MeteredOperation` (§7.6.4 — las claves y descripciones, no los costos)** · `PartyRole`
· `IdentityType` · `CredentialType` · `IdentifierType` · `EventType` + versiones · `Capability` con
política de disponibilidad e initiator permitido · esquema del sobre · esquema de referencias ·
códigos de error. ~~`Tier`~~ **eliminado**.

> **Los valores comerciales (costos en créditos, precios de planes, curvas de bonus, ventanas de
> sobregiro) NUNCA viven en este paquete ni en ninguna constante de código.** Viven en las tablas
> de configuración de §7.2, editables sin deploy. Contracts define que `document.emit` existe;
> la configuración define cuánto cuesta hoy.

---

## 7. La Foundation

### 7.1 Responsabilidades **[LOCKED]**

Identidad y SSO · tenants/usuarios/membresías · **entitlements binarios** · **planes, créditos y
cobro (§7.6)** · alta/provisioning (saga) · el frame · white-label · oficina de eventos · auditoría
de plataforma · sagas de plataforma. **NO:** datos de negocio, lógica de módulos, emisión SIFEN,
proxy de datos, registro canónico de contratos, auditoría de negocio.

### 7.2 Modelo de datos **[actualizado v4.2]**

```sql
tenants / users / user_identities / user_credentials / tenant_auth_policy / memberships /
otp_challenges                                   → §2.2

modules          key pk, clase, nivel, nombre_es, descripcion_es, activo   -- seed desde contracts

entitlements     id, tenant_id, module_key,
                 status,                          -- active | suspended  (BINARIO, sin tier)
                 valid_from, valid_to, unique(tenant_id, module_key)

module_plans     -- CONFIGURACIÓN comercial con vigencia. Estructura (claves) de contracts;
                 -- valores editables desde /admin, sin deploy. Cambio = fila nueva, nunca edición.
  id, module_key, plan_key,                       -- PlanKey (contracts): p.ej. base|plus|max
  precio_usd numeric,                             -- CADA MÓDULO TIENE SU PRECIO
  creditos_mensuales int,                         -- plan mínimo: 1000 (uniforme entre módulos)
  precio_credito_extra_usd numeric,               -- decreciente en planes superiores
  vigente_desde timestamptz, vigente_hasta timestamptz null,
  created_by uuid                                 -- quién lo cambió (auditado)

operation_costs  -- CONFIGURACIÓN: cuánto cuesta cada operación medida, con vigencia
  id, operation_key text,                         -- MeteredOperation (contracts): sólo la clave
  creditos int,
  vigente_desde timestamptz, vigente_hasta timestamptz null,
  created_by uuid

commercial_config -- CONFIGURACIÓN: curva de bonus por combo, ventana de sobregiro, expiración
  id, clave text, valor jsonb,
  vigente_desde timestamptz, vigente_hasta timestamptz null,
  created_by uuid

tenant_subscriptions
  id, tenant_id, module_key, plan_key, ciclo,     -- mensual | anual
  currency text default 'USD', amount numeric,    -- reemplaza monto_pyg
  status, next_charge_at

credit_ledger    -- APPEND-ONLY. El saldo NUNCA es una columna editable.
  id uuid pk, tenant_id uuid,
  ledger_seq bigint NOT NULL,   -- [v4.4] secuencia monótona POR TENANT, sin huecos,
                                --        asignada DENTRO de la sección serializada (§7.6.2)
  tipo text,               -- granted | consumed | purchased | bonus_combo |
                           -- overdraft | unpriced | expired | adjustment
  cantidad int,            -- positivo o negativo (unpriced: 0)
  saldo_resultante int,    -- calculado en la misma transacción, verificable por replay
  module_key text null,    -- qué módulo consumió (si consumo)
  operation_key text null, -- MeteredOperation (si consumo)
  ref text null,           -- Idempotency-Key de la operación de negocio
  created_at timestamptz,
  unique (tenant_id, ledger_seq),                      -- [v4.4] NO OMITIR
  unique (tenant_id, ref) where ref is not null
        and tipo in ('consumed','overdraft','unpriced') -- idempotencia del consumo

exchange_rates   -- para el cobro en PYG de precios USD (§7.6.6)
  id, currency_from, currency_to, rate numeric, fixed_at timestamptz, source text

service_registry / saga_runs / saga_steps / signups / tenant_branding /
events / event_subscriptions / event_deliveries / audit_log        → v4.1, sin cambios
```

### 7.3 Autenticación entre servicios **[LOCKED]**

Identidad del servicio (par de claves, capabilities en `service_registry`) + token firmado
localmente con claims completos (`iss·aud·kid·iat·nbf·exp·jti·tenant_id·capability·initiator`).

**Autoridad de tenant:** un servicio no puede afirmar un tenant; lo demuestra (initiator `user`,
JWT del usuario propagado por toda la cadena) o se declara sistema (initiator `system`, explícito y
habilitado por capability). Capabilities sensibles pueden ser sólo-usuario. **JWKS separados** para
usuarios y servicios. Sin round-trip a la Foundation por request. API keys por tenant: sólo
integradores externos.

### 7.4 API **[actualizado v4.2]**

```
── Auth ─────────────────────────────────────────────────────────
POST /auth/otp/request · /auth/otp/verify · /auth/password/login ·
/auth/password/change · /auth/tenant/select · /auth/logout
GET  /.well-known/jwks-users.json · /.well-known/jwks-services.json

── Identidades (admin) ──────────────────────────────────────────
POST /v1/tenants/{id}/users · /v1/identities/{id}/revoke · /v1/users/{id}/reset-password

── Tenants / entitlements ───────────────────────────────────────
GET  /v1/me · /v1/entitlements?tenant_id=… · /v1/entitlements/check?…&module=…

── Créditos [nuevo v4.2] ────────────────────────────────────────
GET  /v1/credits/balance                        → { saldo, en_sobregiro, gracia_restante }
GET  /v1/credits/ledger?since=…                 → movimientos paginados
POST /v1/credits/consume                        → { module, operation_key, cantidad, ref }
                                                  (idempotente; lo llama cada módulo al ejecutar
                                                   una operación medida; responde saldo o
                                                   sobregiro según política §7.6.5)
POST /v1/credits/purchase                       → compra de paquete extra

── Configuración comercial (admin plataforma) [nuevo v4.3] ──────
GET  /v1/admin/pricing                          → planes + costos + config vigentes
POST /v1/admin/pricing/plans                    → fila nueva de module_plans con vigencia
POST /v1/admin/pricing/operation-costs          → fila nueva de operation_costs con vigencia
POST /v1/admin/pricing/config                   → fila nueva de commercial_config
                                                  (todo cambio: auditado, efectivo hacia
                                                   adelante, jamás retroactivo, sin deploy)

── Alta / branding / eventos ────────────────────────────────────
POST /v1/signups · POST /v1/signups/{id}/provision → { saga_id } · GET /v1/sagas/{id}
GET|PUT /v1/branding
POST /v1/events · GET /v1/events?… · POST /v1/subscriptions
```

### 7.5 El frame y el white-label **[LOCKED]**

Launcher desde entitlements binarios; "ampliá tu sistema" para lo no contratado; **el saldo de
créditos visible en el shell** (con aviso de saldo bajo). White-label premium; KUDE con identidad
fiscal del emisor obligatoria; reportes internos white-label completo; documentos a terceros
configurables sin ocultar información legal.

### 7.6 El modelo comercial: planes y créditos **[LOCKED — nuevo v4.2]**

#### 7.6.1 Los principios

1. **El entitlement es binario.** Contratar un módulo desbloquea el módulo entero. No hay features
   gateadas por plan.
2. **Cada módulo tiene su precio de entrada** (en USD; los precios difieren entre módulos).
3. **Los créditos son universales y fungibles.** Un crédito es un crédito, venga del plan de
   `factura` o de `lab`. Todos los grants caen en **un solo pool compartido del tenant**.
4. **El plan mínimo de cada módulo otorga 1.000 créditos mensuales.** Planes superiores otorgan más
   créditos a menor precio unitario — el precio del *módulo* no baja; lo que mejora es el costo por
   crédito.
5. **Los descuentos son en créditos, nunca en precio.** Contratar varios módulos otorga **créditos
   bonus** (`bonus_combo` en el ledger), no precios rebajados.
6. **El crédito es una unidad abstracta sin moneda.** Lo denominado en USD es el paquete; el
   metering queda desacoplado del tipo de cambio.

#### 7.6.2 El ledger es sagrado **[reforzado v4.4]**

El saldo **nunca** es una columna que se actualiza. Es la suma de un ledger append-only, con
`saldo_resultante` calculado en la misma transacción de cada movimiento y verificable por replay.
Los créditos son cuasi-dinero: cada movimiento debe poder explicarse a un cliente, con la misma
disciplina de inmutabilidad que rige todo lo financiero del sistema.

**Append-only no alcanza. Falta el orden — y eso costó un defecto real.** La v4.3 no decía cómo se
garantiza el orden de append, y el sistema ordenaba por `(created_at, id)`. Eso falla: `created_at`
es el `transaction_timestamp`, fijado en el `BEGIN` — *antes* de que la transacción espere el lock —
y el desempate era un UUID aleatorio. Resultado: saldos correctos (sin doble gasto) pero
**desordenados**, con lo cual el replay no cerraba en ~6–14% de las corridas concurrentes. La única
propiedad por la que se elige un ledger se perdía en silencio.

> **Estándar de ledger [LOCKED]. Todo saldo del sistema — créditos hoy, cualquier otro mañana —
> lleva una secuencia monótona por tenant (`ledger_seq`), sin huecos, asignada DENTRO de la sección
> serializada (advisory lock por tenant, `FOR UPDATE`, o transacción serializable), con
> `unique (tenant_id, ledger_seq)`. Todo orden — replay, extracto al cliente, conteo de racha de
> sobregiro — usa esa secuencia, nunca timestamps.**

Tres razones por las que el `unique` no es opcional:
1. Sin él, la correctitud depende de que **nadie** inserte olvidando el lock. Con él, ese olvido es
   un error duro y retriable, no corrupción silenciosa.
2. Vuelve inofensiva cualquier colisión del hash del advisory lock (sobre-bloqueo = lento; jamás
   sub-bloqueo).
3. `ledger_seq` sirve además de `entity_version` del evento — un contador aparte tendría la misma
   ambigüedad de orden que se acaba de eliminar.

**No sirven:** `clock_timestamp()` (puede empatar, no es monótono entre backends) ni un `IDENTITY`
global (ordena entre tenants, no dentro de uno, y deja huecos).

**Y no se declara PASS sin probarlo bajo concurrencia real.** Este defecto sobrevivió a un DoD
marcado PASS porque la prueba era secuencial y estructuralmente no podía verlo. Todo invariante de
concurrencia necesita un test contra Postgres real, con control negativo que demuestre que el test
tiene dientes.

#### 7.6.3 Cómo consume un módulo

Cada módulo, al ejecutar una operación medida, llama `POST /v1/credits/consume` con su
`operation_key` e `Idempotency-Key` (la referencia de la operación de negocio — un retry no cobra
dos veces). **El módulo nunca envía la cantidad de créditos: la Foundation la resuelve contra
`operation_costs` vigente al momento del consumo.** Así, un cambio de precio no toca ni un módulo.
La respuesta indica saldo, o sobregiro activo, o denegación según §7.6.5. La llamada es parte de la
operación, no un evento posterior: si el consumo falla con denegación, la operación no se ejecuta.

#### 7.6.4 El catálogo de operaciones medidas **[estructura ABIERTA — valores NO bloquean]**

**La estructura vive en el código; los valores viven en datos.** `MeteredOperation` en
`@suynda/contracts` define sólo `{ module, operation_key, descripcion }` — qué operaciones existen.
Los costos viven en `operation_costs` (configuración con vigencia), y los precios de planes en
`module_plans`. Consecuencia directa: **la construcción completa no espera a la conversación
comercial.** Se construye todo con valores placeholder sembrados como configuración; la conversación
comercial los ajusta después desde el `/admin`, sin tocar código. Lo único que la fase 4 necesita
congelado es la **lista de claves** (qué operaciones se miden), que es barata de definir.

Cambio de precio: fila nueva con `vigente_desde`, efectiva **hacia adelante, jamás retroactiva**.
El consumo de marzo se explica para siempre con el costo vigente en marzo — mismo patrón que las
alícuotas versionadas de `padron` (§3.5).

> **Regla de diseño: lo que no se mide es ilimitado al precio de entrada.** Cada módulo debe
> recorrerse y decidir conscientemente qué se mide. Lo no medido es un regalo deliberado, no un
> olvido.

**Operación sin precio configurado — `unpriced` [LOCKED — nuevo v4.4]**

> **La falta de configuración NUNCA frena una operación.**

El escenario que lo motiva es concreto y propio: una fila de `operation_costs` vence su
`vigente_hasta`, nadie cargó la siguiente, y de golpe nadie puede facturar en toda la plataforma por
un hueco de configuración interno. Una fuga de ingreso acotada y reconciliable es preferible a una
caída de servicio autoinfligida.

Comportamiento: si no hay fila vigente para esa `operation_key` → **permitir la operación**,
registrar en el ledger con `tipo='unpriced'`, `cantidad=0`, y emitir `credits.operation_unpriced`.
Las operaciones `unpriced` **no** consumen saldo ni cuentan para la ventana de sobregiro. Siguen
siendo idempotentes por `(tenant_id, ref)`. `CREDITS_OPERATION_UNPRICED` deja de existir como error
de API.

Tres candados, sin los cuales `unpriced` se vuelve el estado por defecto sin que nadie lo note:

1. **Gratis deliberado ≠ sin configurar.** Una operación que se decidió no cobrar lleva fila
   explícita con `creditos = 0` y se registra como `consumed`. **Sólo la ausencia de fila es
   `unpriced`.** Sin esta distinción, dentro de seis meses mirás el ledger, ves operaciones a costo
   cero, y no podés saber cuáles regalaste a propósito y cuáles son plata que se fue por un hueco.
2. **Chequeo de cobertura, no alerta reactiva.** Un endpoint/comando compara `MeteredOperation` de
   contracts contra `operation_costs` vigentes y lista las que hoy no tienen precio. Corre en el
   seed y se expone en `/admin/pricing/coverage`. Sin esto, `unpriced` se detecta recién cuando
   alguien mira los logs.
3. **Aviso de vencimiento próximo.** El caso real no es "nunca se cargó", es "**venció**". El
   chequeo debe avisar de costos que vencen en los próximos N días, no sólo de los ya vencidos.

Criterio propuesto para calibrar: se mide lo que tiene **costo marginal real** (emisión SIFEN,
procesamiento con IA, mensajes de WhatsApp, almacenamiento pesado) y lo que **escala con el valor
entregado**. No se mide CRUD básico, navegación ni consultas.

Borrador inicial **[PROPUESTO — punto de partida para calibrar, no cifras finales]**:

| Módulo | Operación medida | Créditos (borrador) |
|---|---|---|
| factura | `document.emit` (factura/NC/ND emitida) | 1 |
| factura | `document.cancel` / `inutilizar` | 1 |
| compra | `document.process_ai` (OCR + extracción de un documento) | 3 |
| compra | `reconciliation.run` (conciliación Hechauka) | 5 |
| lab | `result.report_ai` (resumen no-diagnóstico) | 2 |
| talento | `payroll.employee_run` (por empleado por corrida) | 1 |
| visibilidad | `enrichment.run` | 2 |
| conecta | `whatsapp.message_out` | 1 |
| nucleo | `closing.month_run` | 20 |
| deposito | — (sin operaciones medidas en v1: regalo deliberado) | — |

#### 7.6.5 Saldo cero y sobregiro **[LOCKED]**

Bloquear una emisión fiscal en el punto de venta porque el saldo llegó a cero es inaceptable. La
política, mapeada a §8.1:

- **Operaciones fiscales y de negocio crítico:** sobregiro acotado — se permite continuar **N
  operaciones o M días** en negativo (ventana exacta: decisión comercial, configurada en contracts),
  con notificación agresiva (`credits.overdraft_started`, banner en el shell, WhatsApp al admin).
  Vencida la ventana → denegación.
- **Operaciones no críticas** (enriquecimiento, reportes IA): denegación directa a saldo cero.
- El sobregiro queda en el ledger (`tipo: overdraft`) y se salda automáticamente con la próxima
  recarga.

#### 7.6.6 USD y el cobro **[LOCKED]**

- Precios de planes y paquetes en **USD** (`currency + amount`; `monto_pyg` muere).
- El cobro real a clientes paraguayos liquida en guaraníes: la cotización aplicada se registra en
  `exchange_rates` con `fixed_at` y fuente — qué cotización y cuándo se fija es parte del billing
  de la plataforma y se construye desde el día uno (excepción puntual al "monedas: diseñado, no
  construido" de §3.5, que sigue vigente para los módulos de negocio).
- **[ABIERTO — verificar con contador]** La práctica de emisión de la propia factura de Suynda:
  facturar en USD con tipo de cambio vs. facturar en PYG al cambio del día (efecto en IVA e
  ingresos).

#### 7.6.7 Lo que esto cambia en el `/armar`

El payload deja de llevar tiers: ahora lleva `{ modules: [{ key, plan_key }], ciclo }`. La lógica
de combos del landing se rehace: ya no descuenta precio — muestra los **créditos bonus** que se
ganan al agregar módulos. **[ABIERTO]** El destino de "Corporativo": ¿sobrevive como plan
enterprise a medida fuera del self-service, o muere con los tiers? **[ABIERTO]** ¿El ciclo anual
otorga créditos bonus (consistente con "descuentos en créditos, no en precio") o baja el precio?

---

## 8. Disponibilidad y degradación **[LOCKED]**

### 8.1 Tres políticas, por capability

| Política | Comportamiento | Ejemplos |
|---|---|---|
| **FAIL OPEN** | Continuar con último valor conocido | Lecturas, listados, dashboards |
| **FAIL AFTER GRACE** | Continuar con cache dentro de una ventana; vencida, denegar | Escrituras no fiscales · **sobregiro de créditos (§7.6.5)** · entitlements ≤ 24 h |
| **FAIL CLOSED** | Denegar si no se verifica fresco | Emitir fiscal (vs. `padron`), cerrar caja, pagar nómina, cambiar roles |

Nota fina: la emisión fiscal es FAIL CLOSED **respecto de los datos** (`padron` caído → no se
emite) y FAIL AFTER GRACE **respecto de los créditos** (saldo cero → sobregiro acotado). Son dos
verificaciones distintas de la misma operación.

### 8.2 Foundation caída

Login nuevo no disponible · sesiones siguen (JWKS cacheado) · servicios se hablan (tokens locales)
· FAIL OPEN sigue · GRACE hasta vencer · CLOSED deniega · **consumo de créditos: los módulos
encolan consumos en su outbox y la Foundation los aplica al volver — la ventana de gracia absorbe
la caída** · eventos en outbox · sagas retoman.

### 8.3 Padron caído

Lecturas con cache funcionan · altas fallan claro (nunca local) · emisión fiscal FAIL CLOSED ·
documentos emitidos funcionan siempre (snapshot).

Deploy de `padron`: lógicamente separado desde el inicio, compartiendo infraestructura al principio.

---

## 9. Plan de construcción

### 9.1 Papel antes que código

1. **Congelar las CLAVES del catálogo de operaciones medidas** (§7.6.4) — qué se mide. Los
   valores van como placeholder de configuración y se ajustan después sin deploy.
2. Publicar `@suynda/contracts` v0: todos los enums (incl. claves de `MeteredOperation`, `PlanKey`),
   sobre de eventos, capabilities con política e initiator, códigos de error. **Sin valores
   comerciales.**
3. Sembrar `module_plans`, `operation_costs` y `commercial_config` con placeholders (el borrador de
   §7.6.4 sirve de semilla).
4. `CLAUDE.md` de cada repo apuntando a este documento.
5. Conversación comercial (decisiones #1–#5 de §14) — ajusta configuración, **no bloquea el build**.

### 9.2 Fases

| # | Fase | Contenido | Gate |
|---|---|---|---|
| **1** | Esqueleto | Migraciones completas (§2.2, §7.2 incl. `credit_ledger`, `module_plans`), tipado, seed desde contracts, `MessageSender` consola. | — |
| **2** | Auth | OTP + contraseña, provisión por admin, JWT, JWKS dobles, cookie, throttling, `/login`. | **STOP** — entrás por ambos caminos |
| **3** | **Padron v1** | API completa §3.8, consumidor final, outbox transaccional, `fiscal-profile`. | **STOP** — sin duplicados; outbox en la misma transacción |
| **4** | Alta + créditos | `POST /v1/signups` payload nuevo (§7.6.7), `/admin` (incl. edición de configuración comercial), `ProvisionTenantSaga` con grant de créditos, `POST /v1/credits/consume` resolviendo costo desde configuración, sobregiro. | **STOP** — postulación real → tenant activo con créditos sembrados · saga matada a mitad se retoma · consumo idempotente no cobra dos veces · **cambiar un costo desde /admin surte efecto sin deploy y no altera consumos pasados** |
| **5** | El frame | Shell, launcher binario, saldo visible, "ampliá tu sistema", white-label. | **STOP** — dos tenants ven launchers y saldos distintos |
| **6** | Eventos | Sobre validado en ingest, versiones, worker, dead-letter, eventos de créditos. | **STOP** — fuera de orden no pisa; sobre inválido se rechaza |
| **7** | Endurecimiento | `audit_log`, rotación JWKS, replay por `jti`, purga PII, rate limits, checklist. | — |

### 9.3 Cosecha desde facturas-py

Auth → foundation · helpers → paquete · shell → foundation · `entity` → padron (Party+rol) ·
productos → padron · SIFEN → factura · plan de cuentas → nucleo · gastos → compra.
**Regla de corte:** nunca dos identidades vivas ni dos dueños simultáneos; paridad probada antes de
voltear `LOGIN_URL`.

### 9.4 Onboarding de un módulo

Registro en `service_registry` · doble validación JWT + entitlement **binario** con política por
capability · cliente de `padron` (cache + `strong` + `fiscal-profile`) · **cliente de créditos con
consumo idempotente por operación medida** · outbox transaccional · suscripciones idempotentes ·
extensiones propias · sagas propias · launcher.

**Excepción:** `lab` no onboardea hasta su pasada de seguridad. No waivable.

---

## 10. Contratos compartidos

Listado **[SIN VERIFICAR contra el web spec]**:
- **plataforma:** `foundation` · `padron`
- **nivel 2:** `factura` · `deposito` · `nucleo` · `compra` · `talento` · `visibilidad` · `conecta`
- **nivel 1:** `lab` · `vet` · `taller` · `milk` · `farm` · `comercio`

`padron` y `deposito` hay que agregarlos al landing. **Los tiers se eliminan del landing**; el
armador pasa a `{ modules: [{key, plan_key}], ciclo }` y muestra créditos bonus por combo (§7.6.7).

---

## 11. Estándares transversales **[LOCKED]**

- `tenant_id` en todo. Cero joins entre tenants.
- Idempotencia en toda escritura cruzada — **incluido el consumo de créditos**.
- Sin acceso directo a la base de otro módulo. REST versionado, evento, o saga.
- Toda operación multi-dueño es saga con estado persistido.
- Todo enum viene de `@suynda/contracts`. Strings libres → PR rechazado.
- **La estructura vive en el código; los valores comerciales viven en configuración con vigencia.**
  Un precio o costo hardcodeado en cualquier repo → PR rechazado.
- **Todo saldo es un ledger append-only, nunca una columna editable, con secuencia monótona por
  tenant asignada dentro de la sección serializada y `unique (tenant_id, ledger_seq)` (§7.6.2).**
- Todo orden de un ledger usa su secuencia, jamás timestamps.
- Todo identificador externo se normaliza en el borde del módulo dueño; ninguna columna que
  participe de un unique de deduplicación admite NULL.
- Locks múltiples en una misma transacción se toman siempre en orden determinístico.
- Todo invariante de concurrencia necesita test contra DB real con control negativo. Un test
  secuencial no prueba una garantía concurrente.
- El contrato se versiona en git y ningún agente lo edita (§0.1).
- Secretos con envelope encryption; claves privadas por servicio; JWKS dobles; tokens con claims
  completos y vida corta.
- Auditoría inmutable donde haya dinero, identidad, créditos o cumplimiento.
- Sin siglas en la interfaz. Español llano.
- APIs y eventos versionados. Borrado lógico; roles se desactivan.
- Contraseñas: argon2id, throttling, sin rotación forzada.

---

## 12. Flujo con IA

Este documento es el contrato · Grok Build = scaffolding sin lógica · Claude Code = implementación
por batch con tests · cambio de contrato: primero este archivo.

**Advertencias para agentes:**
1. Party se aplana solo — PRs con tabla `proveedores` se rechazan.
2. `padron` acumula columnas solo — extensiones.
3. El sobre de eventos engorda solo — esquema cerrado.
4. El snapshot fiscal se convierte en cache solo.
5. Los enums se re-tipean solos — contracts.
6. Las sagas pierden su estado solas — sin `saga_runs` se rechaza.
7. **El saldo de créditos se convierte en columna solo** — un `UPDATE balance` se rechaza; sólo
   filas nuevas en el ledger.
8. **Los valores comerciales se hardcodean solos** — un `CREDITOS_EMISION = 1` en el código de un
   módulo se rechaza; el costo se resuelve siempre contra `operation_costs` vía la Foundation.
9. **Los ledgers pierden su orden solos** — un `ORDER BY created_at` sobre un ledger se rechaza;
   siempre por `ledger_seq`.
10. **Las listas enumeradas se copian a mano solas** — apareció una tercera copia del catálogo de
    eventos dentro del propio script de verificación. Toda lista se **deriva** de `data/`, nunca se
    re-tipea, ni siquiera en herramientas.
11. **El contrato se edita solo** — si el código y este documento discrepan, se **reporta**; no se
    edita el documento para que coincida (§0.1).

---

## 13. Riesgos

| Riesgo | Sev. | Mitigación |
|---|---|---|
| Saldo como columna editable → créditos inexplicables | **Alta** | §7.6.2 — ledger append-only, replay verificable |
| Ledger append-only pero desordenado → replay no cierra | **Alta** | §7.6.2 — `ledger_seq` dentro del lock + unique + test concurrente con control negativo |
| Identificador duplicado por NULL o por país mixto | **Alta** | §3.3 — `not null default 'PY'` + normalización en el borde |
| Deadlock en upsert multi-identificador | Media | §3.3 — orden determinístico de locks + test de orden invertido |
| Config vencida frena la plataforma entera | **Alta** | §7.6.4 — `unpriced` + chequeo de cobertura + aviso de vencimiento |
| `unpriced` se vuelve el default silencioso | **Alta** | §7.6.4 — candado 1: gratis deliberado lleva fila explícita |
| Contrato editado por un agente → dos versiones vivas | **Alta** | §0.1 — git + bump de versión + los agentes reportan, no editan |
| DoD declarado PASS con prueba que no puede fallar | **Alta** | §7.6.2 — todo invariante concurrente con test real y control negativo |
| Precio hardcodeado → cambio de precio exige redeploy | **Alta** | §7.6.4 — valores sólo en configuración con vigencia; PR con constante comercial se rechaza |
| Cambio de precio aplicado retroactivamente | **Alta** | §7.6.4 — vigencia hacia adelante; consumos pasados conservan su costo |
| Operación cara sin medir → uso ilimitado al precio mínimo | **Alta** | §7.6.4 — recorrido consciente módulo por módulo |
| Consumo no idempotente → doble cobro en retries | **Alta** | §7.6.3 — Idempotency-Key por operación de negocio |
| Emisión bloqueada por saldo cero en punto de venta | **Alta** | §7.6.5 — sobregiro acotado con aviso |
| Cotización USD/PYG sin registro → disputas de cobro | Media | §7.6.6 — `exchange_rates` con `fixed_at` y fuente |
| Servicio comprometido opera sobre cualquier tenant | Alta | §7.3 — autoridad de tenant |
| Saga a medio camino | Alta | §5.6 — estado persistido, retoma |
| Party se aplana · padron engorda · Parties locales | Alta | §12 |
| Emisión contra cache · snapshot como cache | Alta | §5.3–5.4 |
| Sobre con valores · evento viejo pisa · evento perdido | Media | §6.2/6.4/6.6 |
| Tenant sin canal externo · reasignación sin revocar | Alta | §2.4 |
| Dos identidades vivas | Alta | §9.3 |
| Certificado SIFEN en storage sincronizado | Alta | Secret store (pendiente) |
| Licencia LIMS | Alta | Revisión legal |
| `lab` antes de seguridad | Alta | Gate duro |

---

## 14. Decisiones abiertas

| # | Decisión | Bloquea | Estado |
|---|---|---|---|
| 1 | **Claves del catálogo de operaciones medidas** (qué se mide, no cuánto) | Fase 4 + `/armar` | **[ABIERTO — único bloqueante de build, barato de cerrar]** |
| 2 | Valores: costos, precios, ventana de sobregiro, curva de bonus, expiración de créditos | Nada — configuración ajustable sin deploy | **[ABIERTO — conversación comercial]** |
| 3 | Destino de "Corporativo" (enterprise a medida vs. muere) | Landing | **[ABIERTO — comercial]** |
| 4 | Destino del ciclo anual (¿bonus en créditos?) | Landing | **[ABIERTO — comercial]** |
| 5 | Práctica de facturación propia en USD (verificar con contador) | Billing plataforma | **[ABIERTO]** |
| 6 | Checklist de paridad para retirar auth de facturas-py | Corte de identidad | **[ABIERTO]** |
| 7 | Default para privilegiado-sólo-contraseña | Fase 2 (config) | **[ABIERTO — menor]** |
| 8 | Librería fiscal compartida vs. sólo `factura` | Diseño posterior | **[ABIERTO — no bloquea]** |

La #2, #3 y #4 son la misma conversación comercial. **Ninguna de ellas frena la construcción.**

---

## 15. Definición de terminado — Foundation + Padron v1

Sin tocar código:

1. Un usuario nuevo entra por OTP; un empleado provisionado entra por username+contraseña.
2. Un número se revoca y se verifica en otro usuario; el histórico queda auditado.
3. Un usuario en dos tenants cambia de tenant activo y el launcher cambia.
4. Una postulación real dispara `ProvisionTenantSaga` → tenant activo con Party emisor, sucursal,
   consumidor-final **y créditos iniciales sembrados en el ledger** (grants + bonus combo).
5. La saga matada a mitad se retoma y completa, o queda en `provisioning_failed` con alerta.
6. Activar un módulo = una fila de entitlement **binaria**; el launcher lo refleja.
7. **Una operación medida descuenta créditos exactamente una vez, aunque se reintente tres veces.**
8. **El saldo se reconstruye por replay del ledger y coincide con `saldo_resultante`.**
9. **A saldo cero, una emisión fiscal entra en sobregiro con aviso; una operación no crítica se
   deniega; vencida la ventana, la emisión también se deniega.**
9b. **Cambiar el costo de una operación o el precio de un plan desde `/admin` = una fila de
   configuración nueva, efectiva hacia adelante, sin deploy — y el consumo del mes pasado se sigue
   explicando con el costo vigente entonces.**
9c. **Bajo K consumos concurrentes del mismo tenant, el replay por `ledger_seq` cierra el 100% de
   las corridas — y el mismo test sin el lock rompe el ledger** (control negativo obligatorio).
9d. **Una operación sin costo vigente se ejecuta igual, queda como `unpriced` con cantidad 0, no
   toca el saldo ni la ventana de sobregiro, y aparece en el chequeo de cobertura.**
9e. **Una operación con fila explícita `creditos = 0` se registra como `consumed`, no como
   `unpriced`** — gratis deliberado se distingue de sin configurar.
10. Dos módulos crean el mismo proveedor a la vez → **una sola Party, ambos roles activos, cero
    rechazos** (el "cero rechazos" es lo que prueba que el lock trabaja).
10b. El mismo RUC escrito de cuatro formas (sin país / NULL / `'PY'` / `'py'`) converge en **una
    sola Party**, almacenada como `'PY'`.
10c. Dos upserts con el mismo par de identificadores en orden invertido **no se deadlockean**.
11. Una venta a consumidor final no crea Party nueva.
12. Un rol se desactiva y reactiva; la historia queda consultable.
13. Una emisión falla (FAIL CLOSED) con `padron` caído; un documento emitido se reproduce íntegro
    con `padron` apagado.
14. Un token `system` contra capability sólo-usuario se rechaza; un `aud` equivocado se rechaza.
15. Un evento con `entity_version` viejo no pisa el cache; un sobre inválido se rechaza en ingest.
16. Con la Foundation apagada: sesiones siguen, servicios se hablan, consumos se encolan y se
    aplican al volver, sagas retoman.
17. **Ninguna tabla de la Foundation contiene una Party, un ítem, una factura ni un asiento.**
18. **Ninguna tabla de `padron` contiene un proceso de negocio.**
19. **Ningún saldo del sistema existe como columna editable.**

Los puntos 17, 18 y 19 se verifican con más disciplina. Son los que se rompen primero.
