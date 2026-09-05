# RC DEPÓSITO — `@suynda/contracts` v0.11.0 — DISEÑO DEL DIFF

**Fecha:** 4 de septiembre de 2026 · **Repo:** `suynda-contracts` · **Base:** `d7c133d` (`v0.10.0`) ·
**Clase de evidencia:** DOC-B — diseño **aprobado por el orquestador el 4-sep** tras una pasada de
contrato que encontró dos blockers y tres ajustes, todos incorporados acá (§13).

**Insumos:** `SUYNDA-DEPOSITO-DOMAIN-v1.0` (46 invariantes, a la espera de firma) ·
`CONTRACTS-RECON-FOR-DEPOSITO-RC.md` (`573e2b5`) con D-1…D-5 cerradas ·
`PADRON-ENABLEMENT-FOR-DEPOSITO-v1.md` (`810c29a`) para `ItemType`.

**Versión resultante:** **`v0.11.0 — BREAKING`** (D-5). La ruptura es una sola y está nombrada:
retirar `stock.adjusted` y `stock.transferred` del enum cerrado del sobre (D-2).

**Compuerta:** `npm run verify` verde después de cada etapa · commit permitido · **el tag no se
publica hasta la firma formal de F-4.**

---

## 0. Resumen del diff en una tabla

| Archivo | Acción | Qué |
|---|---|---|
| `data/enums.json` | **+10 enums** | §1 |
| `src/enums.ts` | +10 pares const/type, `ENUMS` ampliado | §1.2 |
| `src/deposito.ts` | **NUEVO** | formas que cruzan la frontera: **pull** hacia Núcleo (A-4) y **provocación** desde verticales (C-7) — §2 |
| `schema/economic-consequence.schema.json` | **NUEVO** | forma del pull, molde `reference.schema.json` — §2.4 |
| `schema/inventory-provocation.schema.json` | **NUEVO** | forma de la provocación — §2.4 |
| `scripts/generate-schema.mjs` | ampliar | inyecta los enums de Depósito en los dos schemas nuevos — §2.5 |
| `data/capabilities.json` | **+5 filas** + línea en `_notes` | §3 |
| `data/error-codes.json` | **+11 filas** + línea en `_notes` | §4 |
| `data/events.json` | **−2 / +3** | §5 |
| `data/manifests/deposito.json` | **NUEVO** | §6 |
| `src/manifests.ts` | import + `DEPOSITO_MANIFEST` + `MANIFESTS` | §6.2 |
| `scripts/verify-v0.mjs` | 3 manifiestos · lookup · `verifyDepositoManifest` · tripwire anti-`stock.*` | §7 |
| `scripts/verify-superficie.mts` | ampliar | los tipos nuevos importables desde `dist` — §7.4 |
| `src/index.ts` | exportar todo lo anterior | §8 |
| `README.md` | fila nueva en «What lives here» + inventario | §9 |
| `package.json` | `0.10.0 → 0.11.0` | §10 |
| `docs/ARCHITECTURE.md:438` | **NO SE TOCA** | reporte de discrepancia §0.1 — §11 |

---

## 1. Enums — `data/enums.json`

Convención aplicada (D-3): objeto `{ "_status", "_note", "values" }` como `LedgerTipo`. Provenance
**dentro de `_note`**, forma `Source: … · DEP-nn`. Nada de `_source`.

### 1.1 El JSON a agregar

```json
"ItemType": {
  "_status": "PROPUESTO",
  "_note": "Source: Charter Run #4 Rev 2.2 B-1 · PADRON-ENABLEMENT-FOR-DEPOSITO-v1 E2. Tipado canónico del ítem: lo provee Padrón, la regla de admisión (SERVICE no es inventariable) la aplica Depósito. Otros valores sólo con necesidad real demostrada.",
  "values": ["PRODUCT", "SERVICE"]
},
"InventoryOperationType": {
  "_status": "PROPUESTO",
  "_note": "Source: SUYNDA-DEPOSITO-DOMAIN-v1.0-FROZEN · C-6, C-7, C-8, DEP-05, DEP-23, DEP-40, E-bis (b). La InventoryOperation es la unidad canónica (C-6). El tipo nombra QUÉ OCURRIÓ físicamente, jamás quién o cómo lo provocó: eso vive en la causa (C-10, DEP-30) — RECEIPT es RECEIPT lo provoque la UI manual, Compra o quien sea; ISSUE es ISSUE lo provoque Lab, Ventas o la UI. Lista V1 = casos mínimos de graduación (opening por plantilla · entrada · transferencia · conteo/ajuste · reversa) + lo que el dominio exige (write-off DEP-40 · true-up DEP-18 · reconciliación de shortfall DEP-23). Avanzar la lock_date NO es una operación (DEP-20/21): es un acto auditado con evento propio. SHORTFALL_RECONCILIATION es tipo, no evento aparte.",
  "values": [
    "OPENING_INVENTORY",
    "RECEIPT",
    "ISSUE",
    "TRANSFER",
    "COUNT_ADJUSTMENT",
    "REVERSAL",
    "WRITE_OFF",
    "TRUE_UP",
    "SHORTFALL_RECONCILIATION"
  ]
},
"CostState": {
  "_status": "PROPUESTO",
  "_note": "Source: SUYNDA-DEPOSITO-DOMAIN-v1.0-FROZEN · C-3, DEP-15, DEP-16. Las entradas declaran FINAL | PROVISIONAL (C-3). UNRESOLVED es estado de un CostEffect sobre una SALIDA sin base de costo, jamás de una entrada (DEP-15) — la restricción es de dominio, el enum sólo nombra.",
  "values": ["FINAL", "PROVISIONAL", "UNRESOLVED"]
},
"ProvisionalBasis": {
  "_status": "PROPUESTO",
  "_note": "Source: SUYNDA-DEPOSITO-DOMAIN-v1.0-FROZEN · DEP-17 (enum, jamás texto libre), DEP-16 (SIN_BASE), DEP-43 (VALOR_ADUANA es base PRESCRIPTA por Dec. 3182 art. 26 [NORMA-V], no estimación). Se amplía con nombre, nunca con texto.",
  "values": ["PENDIENTE_FLETE", "PENDIENTE_ARANCEL", "PENDIENTE_FACTURA", "VALOR_ADUANA", "SIN_BASE"]
},
"CostFormula": {
  "_status": "PROPUESTO",
  "_note": "Source: SUYNDA-DEPOSITO-DOMAIN-v1.0-FROZEN · DEP-12, DEP-14 (DF-2). UN solo valor a propósito: V1 implementa WEIGHTED_AVERAGE únicamente. El enum existe para que otra fórmula llegue como valor nuevo, no como cambio de significado. LIFO jamás entra (Ley 6380 art. 9 [NORMA-V], A-6).",
  "values": ["WEIGHTED_AVERAGE"]
},
"TrackingClass": {
  "_status": "PROPUESTO",
  "_note": "Source: SUYNDA-DEPOSITO-DOMAIN-v1.0-FROZEN · Charter A-1 (política de stock de Depósito, NO atributo de Padrón), DEP-22, DEP-25. Tracking ≠ fórmula de costo (C-5): LOT jamás implica costo específico.",
  "values": ["NONE", "LOT", "LOT_EXPIRY"]
},
"QuantityBranch": {
  "_status": "PROPUESTO",
  "_note": "Source: SUYNDA-DEPOSITO-DOMAIN-v1.0-FROZEN · DEP-01/02/03. PHYSICAL_ON_HAND = AVAILABLE + BLOCKED. SHORTFALL no es mercadería. UNALLOCATED no es rama: es marca sobre un movimiento SHORTFALL bajo tracking LOT/LOT_EXPIRY (DEP-22). RESERVED NO entra: recorte E; cuando llegue, particiona AVAILABLE.",
  "values": ["AVAILABLE", "BLOCKED", "SHORTFALL"]
},
"TrueUpMode": {
  "_status": "PROPUESTO",
  "_note": "Source: SUYNDA-DEPOSITO-DOMAIN-v1.0-FROZEN · DEP-18. Lo determina la lock_date, no el caller: objetivo abierto → RETRO; objetivo cerrado → PROSPECTIVE con target_effective_as_of (DEP-21).",
  "values": ["RETRO", "PROSPECTIVE"]
},
"CostEffectKind": {
  "_status": "PROPUESTO",
  "_note": "Source: SUYNDA-DEPOSITO-DOMAIN-v1.0-FROZEN · C-6, DEP-13, DEP-15, DEP-23, DEP-36. La NATURALEZA económica del efecto — Núcleo la necesita para correlacionar (D-10: ISSUE_COST es el COGS). El eje que afecta se DERIVA del kind: IMPAIRMENT afecta VALOR (DEP-36: costo ≠ valor); todos los demás afectan COSTO. Por eso no hay campo aparte. REVERSAL NO es un kind: una reversa PRESERVA la naturaleza del efecto original (kind = IMPAIRMENT, role = REVERSAL, monto inverso) — si fuera kind, revertir un IMPAIRMENT perdería el eje y rompería DEP-36. La reversa y la re-exposición viven en ConsequenceRole.",
  "values": [
    "RECEIPT_COST",
    "ISSUE_COST",
    "TRUE_UP",
    "SHORTFALL_RESOLUTION",
    "FORMULA_CHANGE",
    "IMPAIRMENT"
  ]
},
"ConsequenceRole": {
  "_status": "PROPUESTO",
  "_note": "Source: SUYNDA-DEPOSITO-DOMAIN-v1.0-FROZEN · DEP-31, DEP-04, C-4. El rol de una consecuencia dentro de su identidad económica: ORIGINAL la primera exposición; REVERSAL la reversa (C-4, referencia a la original, mismo kind, monto inverso); REEXPOSURE la re-exposición versionada tras una revaluación en cascada (D-4) — mismo operation_id, version+1, mismo kind. El rol cambia versión y signo; JAMÁS la naturaleza (CostEffectKind) del efecto.",
  "values": ["ORIGINAL", "REVERSAL", "REEXPOSURE"]
}
```

### 1.2 `src/enums.ts` — el patrón, repetido diez veces

```ts
/** Source: SUYNDA-DEPOSITO-DOMAIN-v1.0-FROZEN — ver _note en data/enums.json. */
export const ITEM_TYPES = enumsData.ItemType.values;
export type ItemType = (typeof ITEM_TYPES)[number];

export const INVENTORY_OPERATION_TYPES = enumsData.InventoryOperationType.values;
export type InventoryOperationType = (typeof INVENTORY_OPERATION_TYPES)[number];

export const COST_STATES = enumsData.CostState.values;
export type CostState = (typeof COST_STATES)[number];

export const PROVISIONAL_BASES = enumsData.ProvisionalBasis.values;
export type ProvisionalBasis = (typeof PROVISIONAL_BASES)[number];

export const COST_FORMULAS = enumsData.CostFormula.values;
export type CostFormula = (typeof COST_FORMULAS)[number];

export const TRACKING_CLASSES = enumsData.TrackingClass.values;
export type TrackingClass = (typeof TRACKING_CLASSES)[number];

export const QUANTITY_BRANCHES = enumsData.QuantityBranch.values;
export type QuantityBranch = (typeof QUANTITY_BRANCHES)[number];

export const TRUE_UP_MODES = enumsData.TrueUpMode.values;
export type TrueUpMode = (typeof TRUE_UP_MODES)[number];

export const COST_EFFECT_KINDS = enumsData.CostEffectKind.values;
export type CostEffectKind = (typeof COST_EFFECT_KINDS)[number];

export const CONSEQUENCE_ROLES = enumsData.ConsequenceRole.values;
export type ConsequenceRole = (typeof CONSEQUENCE_ROLES)[number];
```

Y las diez entradas en `ENUMS` (`enums.ts:51-62`), con la misma clave que el JSON.

### 1.3 Lo que NO se declara, y por qué

- **`OperationState` (A-5) — NO. Aprobado (P-1).** A-5 dice «POSTED/COMMITTED; no `approved`»:
  nombra el vocabulario del único estado final, no dos estados. **DEP-05** —el libro no tiene
  borradores— hace el enum degenerado. Lo que A-5 exige es que jamás se confunda **aprobación
  previa** con **estado del libro**, y eso lo garantiza la forma, no un campo.
- **`BlockReasonKind` — NO** (D-4).
- **`ScopeType` — NO** (tripwire `verify-v0.mjs:431-436`).
- **`Currency` — NO como enum global. Aprobado (P-4), con corrección:** el DTO **no** lleva
  `currency: string` —eso haría que TypeScript acepte `"USD"` o `"ABC"` mientras el schema dice
  `enum: ["PYG"]`, dos contratos distintos—. Lleva un **tipo local** `DepositCurrency = "PYG"` (§2.1),
  idéntico en TS y en schema. El `currency` oficial sigue diferido (corrida 2E de padrón).
- **`MovementDirection` — NO.** El signo del `delta` es la dirección (§2.1).

---

## 2. Formas que cruzan la frontera — `src/deposito.ts` (NUEVO) — D-1 reforzada + C-7

**Regla:** contracts gobierna el **significado**; el OpenAPI de Depósito gobierna el **transporte**.
Acá no hay paths, verbos, status codes ni auth. Hay **formas** que los dos lados compilan idénticas.
Molde: `src/reference.ts` (tipos puros) + `schema/*.schema.json` (forma documentada, «not a table»).

**Son dos frentes, y F-5 exige los dos** (Charter, paso 5): la **superficie pullable** hacia Núcleo
(A-4) y los **contratos de provocación** para verticales (C-7). El primer pase de este diseño tenía
sólo el primero; la capability `deposito.operation.post` sola **no es contrato** — define que se
puede llamar, no qué se puede pedir.

### 2.1 El archivo

```ts
/**
 * Formas que cruzan la frontera de Depósito. Source: SUYNDA-DEPOSITO-DOMAIN-v1.0-FROZEN.
 *
 *  · Hacia Núcleo (A-4, DEP-38): EconomicConsequence — lo que Núcleo PULLEA.
 *  · Desde verticales (C-7, E-bis (b)): InventoryProvocation — lo que un módulo
 *    PIDE. Se diseña ahora, se activa con el primer consumidor real.
 *
 * Contracts gobierna el SIGNIFICADO de estas formas; el transporte (paths, auth,
 * paginación, status codes) vive en el OpenAPI del repo de Depósito, versionado
 * con el tag del módulo. Sin estas formas acá, Núcleo y Depósito compilarían dos
 * EconomicConsequence distintas, y Lab y Depósito dos provocaciones distintas —
 * y el sobre reference-only (A-3) impide que ninguna viaje por evento.
 */

import type { ModuleKey } from "./enums.js";
import type {
  ConsequenceRole,
  CostEffectKind,
  CostState,
  InventoryOperationType,
  ProvisionalBasis,
  QuantityBranch,
  TrueUpMode,
} from "./enums.js";
import type { ItemReference } from "./reference.js";

/**
 * Decimal serializado como string. JAMÁS number: un float redondea en silencio
 * y C-12 declara bug toda diferencia contra el libro. Precedente de la casa:
 * numeric → string (padron iva_proporcion; corrida MONEDA).
 */
export type DecimalString = string;

/**
 * Moneda de los efectos de costo en V1. Tipo LOCAL, no enum global: el
 * `currency` oficial está diferido (corrida 2E de padrón) y un enum global de
 * un valor inventado hoy es exactamente lo que esa corrida evitó. Literal para
 * que TS y schema digan lo mismo — `string` dejaría pasar "USD" en TS y no en
 * el schema.
 */
export type DepositCurrency = "PYG";

/**
 * Referencia OPACA al pool de costo, propiedad de Depósito (DEP-10).
 * Contracts NO define cómo se construye: E6 de Padrón decide después si
 * Depósito la resuelve por group_item_id o por equivalencia entre ítems
 * hermanos. Núcleo la usa para agrupar y comparar, nunca para interpretar.
 */
export type PoolRef = string;

/** ISO-8601 date-time. */
export type IsoDateTime = string;

/** C-10 / DEP-30 — nunca nula; sin documento externo, Depósito acuña el suyo. */
export interface CausalIdentity {
  origen_module: ModuleKey;
  documento_causante: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// A-4 · Lo que Núcleo pullea
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Un movimiento físico (DEP-01/02, C-2). Referencia el ItemReference
 * TENANT-SCOPED que realmente se movió: el tenant es el eje de custodia
 * (DEP-09). El almacén es ubicación, jamás pool (DEP-11).
 */
export interface InventoryMovementDto {
  movement_id: string;
  item: ItemReference;
  tenant_id: string;
  almacen_id: string;
  /** Presente bajo TrackingClass LOT / LOT_EXPIRY; null bajo NONE. */
  lot_id: string | null;
  branch: QuantityBranch;
  /**
   * DEP-22 — marca, no rama: true sólo cuando branch === "SHORTFALL" y el
   * ítem tiene tracking; significa "faltante sin lote asignable", distinto de
   * "ausencia de dato".
   */
  unallocated: boolean;
  /**
   * En UNIDAD BASE del ítem (Enablement D-E2). El signo es la dirección:
   * negativo sale de la rama, positivo entra. Una salida no cubierta produce
   * un delta positivo en SHORTFALL; su reconciliación, uno negativo (DEP-23).
   */
  delta: DecimalString;
  effective_at: IsoDateTime;
  recorded_at: IsoDateTime;
}

/**
 * Un efecto de costo (C-6). `kind` es la NATURALEZA económica y se preserva
 * bajo reversa y re-exposición; el eje que afecta se deriva de `kind`:
 * IMPAIRMENT → valor; el resto → costo del pool (DEP-36).
 */
export interface CostEffectDto {
  cost_effect_id: string;
  kind: CostEffectKind;
  /** Eje de valuación (DEP-07/09): el contribuyente, no el tenant. */
  grupo_id: string;
  pool_ref: PoolRef;
  cost_state: CostState;
  /** Obligatorio cuando cost_state !== "FINAL" (DEP-17); null si FINAL. */
  provisional_basis: ProvisionalBasis | null;
  /** Sólo en TRUE_UP y resoluciones (DEP-18); null en el resto. */
  true_up_mode: TrueUpMode | null;
  /** Signo = efecto sobre el costo/valor del pool. Una REVERSAL lleva el inverso. */
  amount: DecimalString;
  currency: DepositCurrency;
  effective_at: IsoDateTime;
  recorded_at: IsoDateTime;
  /**
   * DEP-18/21 — presente sólo en tratamiento PROSPECTIVE: el instante histórico
   * al que este efecto apunta sin reabrirlo. La lectura por effective_as_of de
   * ese tramo NO lo ve (DEP-04); se ve por este campo.
   */
  target_effective_as_of: IsoDateTime | null;
  /** DEP-23 — el CostEffect UNRESOLVED que este efecto resuelve, si alguno. */
  resolves_cost_effect_id: string | null;
}

/**
 * LA unidad pullable (A-4, DEP-38). Núcleo consume operaciones económicamente
 * relevantes, nunca renglones de Kardex (C-6).
 */
export interface EconomicConsequence {
  /** DEP-31 — identidad económica: operation_id + version + role. */
  operation_id: string;
  operation_type: InventoryOperationType;
  /** Monótona por operation_id; sube en cada re-exposición (D-4 / REEXPOSURE). */
  version: number;
  /** Cambia versión y signo; jamás el kind de los efectos. */
  role: ConsequenceRole;
  cause: CausalIdentity;
  /** Eje de custodia (DEP-09). */
  tenant_id: string;
  /** Eje de valuación (DEP-09). Un solo grupo por operación (DEP-28). */
  grupo_id: string;
  effective_at: IsoDateTime;
  recorded_at: IsoDateTime;
  movements: InventoryMovementDto[];
  cost_effects: CostEffectDto[];
  /** C-4 — sólo cuando role === "REVERSAL"; null en el resto. */
  reverses_operation_id: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// C-7 · Lo que una vertical PIDE — diseñado ahora, activado con el primer
//       consumidor real (E-bis (b))
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Una línea de provocación: qué ítem y cuánto, en UNIDAD BASE. Nada más.
 * El caller no elige lote ni rama: eso lo decide Depósito (FEFO/FIFO, DEP-25;
 * política de shortfall, DEP-06/22).
 */
export interface ProvocationLine {
  item_id: string;
  /** En unidad base del ítem, siempre positiva; la dirección la da el tipo de operación. */
  quantity: DecimalString;
}

/**
 * La provocación de una operación por un módulo externo (C-7). Es la FORMA
 * SEMÁNTICA de la petición — sin endpoint, sin auth, sin paginación: eso es el
 * OpenAPI de Depósito.
 *
 * Lo que el caller NO manda, por invariante: ningún costo (C-3, DEP-16 —
 * DEPOSITO_COST_NOT_ALLOWED), ningún CostEffect, ningún movimiento resultante,
 * ningún lote. Depósito decide picking, lotes, ramas y costo; el caller declara
 * qué pide, para qué almacén, cuándo ocurrió y por qué (causa obligatoria).
 *
 * Tipos admisibles por provocación externa en V1: RECEIPT, ISSUE, TRANSFER.
 * OPENING_INVENTORY, COUNT_ADJUSTMENT, WRITE_OFF, TRUE_UP, REVERSAL y
 * SHORTFALL_RECONCILIATION son actos de Depósito (Rev 2.2 nota de C-10) y no
 * se provocan desde afuera — el OpenAPI lo rechaza; la forma lo documenta.
 */
export interface InventoryProvocation {
  operation_type: InventoryOperationType;
  /** C-10 / DEP-30 — obligatoria. origen_module es el módulo que provoca. */
  cause: CausalIdentity;
  /** Eje de custodia (DEP-09). */
  tenant_id: string;
  /** Almacén de la operación. En TRANSFER es el ORIGEN. */
  almacen_id: string;
  /**
   * Sólo en TRANSFER: el destino. Ambos legs comparten effective_at (DEP-27) y
   * la autorización se evalúa sobre origen Y destino (§6.1). null en el resto.
   */
  almacen_destino_id: string | null;
  /**
   * Cuándo ocurrió (C-2). Depósito lo contrasta con la lock_date (DEP-21):
   * un hecho nuevo retrofechado a tramo cerrado se rechaza.
   */
  effective_at: IsoDateTime;
  lines: ProvocationLine[];
}
```

### 2.2 Decisiones de forma que conviene leer antes de aprobar

- **Todo campo opcional se declara `| null`, no `?`.** El schema es cerrado; ausente y nulo tienen que
  ser distinguibles (lección de `subdomain`, `modules.ts:39-41`).
- **`tenant_id` y `grupo_id` viajan los dos** en la consecuencia (DEP-09): Núcleo agrega por grupo y
  el sobre sólo trae `tenant_id`. Redundancia deliberada.
- **`delta` con signo** en el movimiento; **`quantity` positiva** en la provocación. La provocación
  es un pedido: la dirección la da el `operation_type`, no el signo. El movimiento es un hecho: el
  signo es lo que pasó por rama.
- **La provocación no lleva `grupo_id`**: el caller conoce su tenant; el grupo lo resuelve Depósito
  (es su eje de valuación, no del caller).
- **La provocación no lleva `Idempotency-Key`**: es transporte (DEP-29), va en el header del OpenAPI.
- **Sin campo de estado de operación** (§1.3).
- **Sin `almacen` como referencia con cache**: el almacén es entidad **de Depósito** (`reference.ts:3`).

### 2.3 Tipos admisibles por provocación — la tabla que el OpenAPI hace cumplir

| `operation_type` | ¿Provocable desde afuera? | Por qué |
|---|---|---|
| `RECEIPT` | **Sí** | Compra, o la UI manual (C-8) |
| `ISSUE` | **Sí** | El «consumo» de C-7: Lab, Tambo, Ventas |
| `TRANSFER` | **Sí** | Con `almacen_destino_id` |
| `OPENING_INVENTORY` | No | Acto de Depósito (C-8, plantilla) |
| `COUNT_ADJUSTMENT` | No | Nace de una hoja de conteo aprobada (DEP-05/33) |
| `REVERSAL` | No | Referencia una operación de Depósito (C-4) |
| `WRITE_OFF` | No | Autorización propia (DEP-40) |
| `TRUE_UP` · `SHORTFALL_RECONCILIATION` | No | Los produce el motor de costo |

### 2.4 Los dos schemas (NUEVOS)

Mismo molde que `reference.schema.json`: `$defs`, **`additionalProperties: false`** en todos,
`format: date-time` en fechas, `pattern: "^-?[0-9]+(\\.[0-9]+)?$"` en `DecimalString` (y sin `-?`
en `ProvocationLine.quantity`), `enum` en los campos tipados por §1 — **generados** (§2.5).
`currency`: `enum: ["PYG"]`.

- `schema/economic-consequence.schema.json` — `EconomicConsequence`, `InventoryMovementDto`,
  `CostEffectDto`, `CausalIdentity`.
- `schema/inventory-provocation.schema.json` — `InventoryProvocation`, `ProvocationLine`,
  `CausalIdentity` (repetido, no referenciado cruzado: cada schema se valida solo).

### 2.5 `scripts/generate-schema.mjs` — ampliación

Hoy inyecta `event.enum` y `origen_module.enum` en el sobre (`generate-schema.mjs:28-34`). Se amplía
para inyectar en los dos schemas nuevos los enums de §1 desde `enums.json`, con la misma marca
`GENERATED from … Do not edit by hand`. Misma razón que declara su cabecera: la generación hace
imposible la divergencia.

---

## 3. Capabilities — `data/capabilities.json`

Precondición de la trampa T-1: **estas filas existen antes de la primera línea de Depósito.**

### 3.1 Línea nueva en `_notes` (D-3)

```json
"deposito.*: Source: SUYNDA-DEPOSITO-DOMAIN-v1.0-FROZEN · C-6, C-7, A-4, DEP-01/02, DEP-21, DEP-38. lock_date.advance es initiator user: mover la fecha de cierre es un acto humano, autorizado y auditado (DEP-21); un servicio no cierra períodos en V1. economic_consequence.pull es initiator system: A-4 es una frontera service-to-service Núcleo→owner; un auditor humano entra por operation.read o una superficie de reporte, no por la capability de integración. Es la PRIMERA capability system-only del catálogo — no hay precedente anterior en v0.10.0."
```

### 3.2 Las filas

```json
{ "key": "deposito.operation.read",              "availability": "FAIL_OPEN",        "initiator": "both"   },
{ "key": "deposito.operation.post",              "availability": "FAIL_AFTER_GRACE", "initiator": "both"   },
{ "key": "deposito.position.read",               "availability": "FAIL_OPEN",        "initiator": "both"   },
{ "key": "deposito.lock_date.advance",           "availability": "FAIL_CLOSED",      "initiator": "user"   },
{ "key": "deposito.economic_consequence.pull",   "availability": "FAIL_OPEN",        "initiator": "system" }
```

**Nota de honestidad sobre P-5:** la revisión citó `contributor_context.read` como precedente de
`initiator: system`. **Verificado: no existe** en contracts `v0.10.0` ni en foundation; hoy el catálogo
sólo tiene `user` y `both` (`factura.emit`, `roles.change`, `compra.document.approve` son `user`; el
resto `both`). La decisión se sostiene por A-4 solo, y **`economic_consequence.pull` inaugura la
clase**. Se escribe así en la `_note` para que nadie busque un precedente que no está.

---

## 4. Error codes — `data/error-codes.json`

`message_es` en es-PY llano, voseo donde le habla a una persona, sin siglas (`error-codes.json:4`).

### 4.1 Línea nueva en `_notes`

```json
"DEPOSITO_*: Source: SUYNDA-DEPOSITO-DOMAIN-v1.0-FROZEN · C-3, C-4, DEP-06, DEP-20/21, DEP-25/26, DEP-28, DEP-46; Charter criterio 4 y Enablement criterio 3 para los de admisión de ítem. Starter set."
```

### 4.2 Las filas

```json
{ "code": "DEPOSITO_OPERATION_NOT_FOUND",      "http": 404, "message_es": "No se encontró la operación de inventario indicada" },
{ "code": "DEPOSITO_LOCKED_PERIOD",            "http": 409, "message_es": "La fecha del hecho cae en un período ya cerrado; ahí no se puede registrar un hecho nuevo" },
{ "code": "DEPOSITO_ANTECEDENT_REQUIRED",      "http": 422, "message_es": "Para ajustar o resolver algo de un período cerrado hace falta un antecedente registrado antes del cierre" },
{ "code": "DEPOSITO_LOCK_DATE_NOT_MONOTONIC",  "http": 422, "message_es": "La fecha de cierre sólo puede avanzar" },
{ "code": "DEPOSITO_INSUFFICIENT_STOCK",       "http": 409, "message_es": "No hay existencia disponible suficiente y la política de la organización no admite faltantes" },
{ "code": "DEPOSITO_CROSS_GROUP_TRANSFER",     "http": 422, "message_es": "Una transferencia sólo puede hacerse entre almacenes del mismo contribuyente" },
{ "code": "DEPOSITO_ITEM_NOT_INVENTORIABLE",   "http": 422, "message_es": "Ese ítem es un servicio y no puede tener existencia" },
{ "code": "DEPOSITO_ITEM_BASE_UNIT_MISSING",   "http": 422, "message_es": "Ese ítem no tiene unidad base definida en Padrón y no se puede mover" },
{ "code": "DEPOSITO_LOT_BLOCKED",              "http": 409, "message_es": "El lote está bloqueado y no puede entregarse sin una excepción autorizada" },
{ "code": "DEPOSITO_COST_NOT_ALLOWED",         "http": 422, "message_es": "El costo de una salida lo determina Depósito; no se puede indicar desde afuera" },
{ "code": "DEPOSITO_REVERSAL_TARGET_INVALID",  "http": 422, "message_es": "La reversa tiene que apuntar a una operación existente del mismo ítem y almacén" }
```

---

## 5. Eventos — `data/events.json` — **el BREAKING**

### 5.1 Quitar (líneas 12-13)

```json
{ "type": "stock.adjusted",    "origen_module": "deposito", "version": 1 },
{ "type": "stock.transferred", "origen_module": "deposito", "version": 1 }
```

### 5.2 Agregar, en el mismo lugar del array

```json
{ "type": "inventory_operation.posted", "origen_module": "deposito", "version": 1 },
{ "type": "cost_effect.recorded",       "origen_module": "deposito", "version": 1 },
{ "type": "lock_date.advanced",         "origen_module": "deposito", "version": 1 }
```

### 5.3 Semántica del sobre — y la convención de `change_mask` de nacimiento

**Convención de la casa, verificada:** en un evento de nacimiento, `change_mask` lleva **los nombres
de los campos poblados al nacer** — padrón `item.created` → `Object.keys(cmd.item)`
(`suynda-padron/src/item-service.ts:87`); `party.created` → `["razon_social", …"roles"]`
(`party-service.ts:176`). Nombres, nunca valores. **Depósito la aplica igual**: la máscara de
nacimiento es el conjunto de campos de primer nivel **no nulos** del DTO que nació. No hay listas
fijas «a mano» que queden arbitrariamente incompletas.

| Evento | `ref.id` | `entity_version` | `change_mask` | Cuándo |
|---|---|---|---|---|
| `inventory_operation.posted` | `operation_id` | `1` siempre — la operación es inmutable (C-1); una re-exposición **no** la re-emite | campos de primer nivel no nulos de `EconomicConsequence` (p. ej. sin `reverses_operation_id` cuando es null) | Al **nacer** (DEP-05: al aprobarse) |
| `cost_effect.recorded` | `cost_effect_id` | `1` | campos de primer nivel no nulos de `CostEffectDto` | Cada `CostEffect`, incluidos los sin movimiento. **Es el que despierta a Núcleo para el pull** (A-4) |
| `lock_date.advanced` | id del acto auditado | `1` | `["lock_date"]` — el acto tiene un solo campo de negocio | Cada avance (DEP-21) |

`tenant_id` del sobre = eje de custodia. `origen_module` = `"deposito"` siempre — el sobre dice **quién
emite**; la causa (C-10) va adentro de la consecuencia.

`prebuild` regenera el enum del sobre solo. **Ninguna edición manual del schema.**

---

## 6. Manifiesto — `data/manifests/deposito.json` (NUEVO)

Patrón **Lab**: `roles: []`, `role_grant_matrix: {}`, `mandate_types: []`, tildes por
`permission_presets`, **`scope_type: "almacen"`** en las dos funciones de un lugar — **sin**
`ScopeType` en `enums.json`. Guards compartidos (`verify-v0.mjs:107-196`): scoped ⇒ `delegable: false`;
presets con conjuntos distintos.

### 6.1 El JSON

```json
{
  "module_key": "deposito",
  "manifest_version": 1,
  "functions": [
    { "function_key": "ver",              "nombre": "Ver",              "descripcion": "Ver existencias, posiciones, movimientos y operaciones de todos los almacenes", "autorizada_por_canal": false, "orden": 1, "delegable": true },
    { "function_key": "operar",           "nombre": "Operar",           "descripcion": "Registrar entradas, salidas, reversas e inventario inicial en el almacén asignado. Una transferencia exige este alcance sobre el almacén de origen Y el de destino", "autorizada_por_canal": false, "orden": 2, "delegable": false, "scope_type": "almacen" },
    { "function_key": "contar",           "nombre": "Contar",           "descripcion": "Cargar hojas de conteo físico del almacén asignado; cada línea lleva su hora", "autorizada_por_canal": false, "orden": 3, "delegable": false, "scope_type": "almacen" },
    { "function_key": "aprobar_ajustes",  "nombre": "Aprobar ajustes",  "descripcion": "Aprobar los ajustes que nacen de un conteo y las operaciones sujetas a autorización", "autorizada_por_canal": false, "orden": 4, "delegable": false },
    { "function_key": "dar_de_baja",      "nombre": "Dar de baja",      "descripcion": "Registrar mermas, destrucciones y bajas, con su documentación", "autorizada_por_canal": false, "orden": 5, "delegable": false },
    { "function_key": "cerrar_periodo",   "nombre": "Cerrar período",   "descripcion": "Avanzar la fecha de cierre del contribuyente; sólo avanza y queda auditado", "autorizada_por_canal": false, "orden": 6, "delegable": false },
    { "function_key": "configurar",       "nombre": "Configurar",       "descripcion": "Almacenes, políticas de stock, clase de tracking por ítem y plantilla de inventario inicial", "autorizada_por_canal": false, "orden": 7, "delegable": false }
  ],
  "roles": [],
  "role_grant_matrix": {},
  "mandate_types": [],
  "permission_presets": [
    { "preset_key": "operacion",     "nombre": "Operación",     "orden": 1, "functions": ["ver", "operar"] },
    { "preset_key": "inventario",    "nombre": "Inventario",    "orden": 2, "functions": ["ver", "contar"] },
    { "preset_key": "supervision",   "nombre": "Supervisión",   "orden": 3, "functions": ["ver", "aprobar_ajustes", "dar_de_baja"] },
    { "preset_key": "cierre",        "nombre": "Cierre",        "orden": 4, "functions": ["ver", "cerrar_periodo"] },
    { "preset_key": "configuracion", "nombre": "Configuración", "orden": 5, "functions": ["ver", "configurar"] }
  ]
}
```

**La regla de la transferencia, escrita donde se lee:** `operar` está scoped por almacén y una
transferencia toca **dos**. Para preservar la atomicidad de C-9 —una sola operación, dos movimientos
inseparables—, **Depósito evalúa el alcance sobre origen y destino** antes de postear; si falta uno,
no se postea nada. El manifiesto no necesita una forma nueva: la regla la aplica Depósito al resolver
los dos scopes, y la `descripcion` de `operar` la declara para que `/equipo` la muestre.

**Lectura de las funciones contra el dominio:** `operar` y `contar` son de un almacén (DEP-11) →
scoped, no delegables, no componen roles. `aprobar_ajustes` es la compuerta maker/checker de
**DEP-05**, separada de quien cuenta. `cerrar_periodo` es **DEP-21** y va sola en su preset. `ver` es
delegable como en Lab.

**`manifest_version: 1`, y se bumpea en cada iteración** (T-3, lección `v0.6.1`).

### 6.2 `src/manifests.ts`

```ts
import depositoManifestData from "../data/manifests/deposito.json" with { type: "json" };
// …
export const DEPOSITO_MANIFEST = depositoManifestData as ModuleManifest;

export const MANIFESTS: readonly ModuleManifest[] = [
  COMPRA_MANIFEST,
  LAB_MANIFEST,
  DEPOSITO_MANIFEST,
];
```

---

## 7. Guards — `scripts/verify-v0.mjs`

### 7.1 Lo que rompe a propósito y se corrige

- `MANIFESTS.length === 2` → **`=== 3`** (`:428`); `manifestByModuleKey("deposito") === DEPOSITO_MANIFEST`
  (`:425-427`); import (`:13-16`).

### 7.2 `verifyDepositoManifest` — molde `verifyLabManifest`

Firmas: `module_key === "deposito"` · `roles: []` · `role_grant_matrix: {}` · `mandate_types: []` ·
scoped **exactamente** `operar` + `contar`, ambas `"almacen"` · `aprobar_ajustes`, `cerrar_periodo`,
`configurar` presentes y `delegable: false` · presets **exactamente** la matriz de §6.1, comparados
por conjunto. Y en el `pass`.

### 7.3 Tripwire anti-resurrección

```js
// D-2 (RC v0.11.0): stock.* fue vocabulario anterior al dominio. Si vuelve, el DoD grita.
const noLegacyStockEvents = !actualTypes.some((t) => t.startsWith("stock."));
```

Y en el `pass`. `EVENTS.length === expectedEvents.length` ya cubre el conteo (40 → **41**).

### 7.4 `scripts/verify-superficie.mts` — los tipos nuevos, importables

```ts
import type {
  EconomicConsequence, CostEffectDto, InventoryMovementDto,
  InventoryProvocation, ProvocationLine,
  PoolRef, DecimalString, DepositCurrency,
} from "../dist/index.js";
import { ITEM_TYPES, COST_EFFECT_KINDS, CONSEQUENCE_ROLES } from "../dist/index.js";
```

Con una `EconomicConsequence` y una `InventoryProvocation` literales que compilen, y tres
aserciones de valor: `ITEM_TYPES` = `["PRODUCT","SERVICE"]`; **`COST_EFFECT_KINDS` no contiene
`"REVERSAL"`** (Blocker 1 — que no vuelva); `CONSEQUENCE_ROLES` sí lo contiene.

---

## 8. `src/index.ts` — la superficie

```ts
// enums.js — diez pares nuevos
ITEM_TYPES, INVENTORY_OPERATION_TYPES, COST_STATES, PROVISIONAL_BASES, COST_FORMULAS,
TRACKING_CLASSES, QUANTITY_BRANCHES, TRUE_UP_MODES, COST_EFFECT_KINDS, CONSEQUENCE_ROLES,
type ItemType, type InventoryOperationType, type CostState, type ProvisionalBasis,
type CostFormula, type TrackingClass, type QuantityBranch, type TrueUpMode,
type CostEffectKind, type ConsequenceRole,

// manifests.js
DEPOSITO_MANIFEST,

// deposito.js — bloque nuevo
export {
  type DecimalString, type DepositCurrency, type PoolRef, type IsoDateTime, type CausalIdentity,
  type InventoryMovementDto, type CostEffectDto, type EconomicConsequence,
  type ProvocationLine, type InventoryProvocation,
} from "./deposito.js";
```

---

## 9. `README.md`

Fila nueva en «What lives here»:

| Artifact | Path | Notes |
|---|---|---|
| Depósito boundary types | `src/deposito.ts` + `schema/economic-consequence.schema.json` + `schema/inventory-provocation.schema.json` | Shapes crossing the Depósito boundary: what Núcleo **pulls** (A-4) and what a vertical **asks** (C-7). **Meaning lives here; transport lives in Depósito's OpenAPI.** |

Inventario: 3 manifiestos, 41 eventos.

---

## 10. Versión y mensaje

`package.json`: `"version": "0.11.0"`.

```
v0.11.0 — BREAKING: retira stock.adjusted/stock.transferred (vocabulario anterior al dominio, cero consumidores) · RC de Depósito: 10 enums, formas de la frontera (EconomicConsequence hacia Núcleo A-4 · InventoryProvocation desde verticales C-7), 5 capabilities (primera system-only), 11 error codes, 3 eventos, manifiesto patrón Lab con scope almacen. Source: SUYNDA-DEPOSITO-DOMAIN-v1.0-FROZEN.
```

**El tag se publica sólo después de la firma de F-4.** El commit puede existir antes.

---

## 11. Lo que este RC NO hace — y quién sí

| Qué | Quién | Cuándo |
|---|---|---|
| Editar `docs/ARCHITECTURE.md:438` | **El fundador**, §0.1 — bump v4.4 → v4.5 | Al resolver la discrepancia. No bloquea el tag |
| Bump de Foundation a `v0.11.0` (T-1/T-2/T-4) | Corrida propia en `suynda-foundation`, con `npm run build` | Después del tag |
| Bump de Padrón `v0.3.0 → v0.11.0` | Enablement E5 | Después del tag |
| OpenAPI (paths, auth, paginación, `since`/`version`, rechazo de tipos no provocables §2.3) | Repo de Depósito | Build Plan (F-6) |
| Resolver `pool_ref` contra Padrón | Mini-corrida F-2, E6 | Antes del esquema persistente |
| Activar la provocación con un consumidor real | Quien sea el primero (post V1) | Cuando exista |

---

## 12. Preguntas de diseño — todas cerradas el 4-sep

| # | Pregunta | Decisión |
|---|---|---|
| P-1 | `OperationState` | **Fuera.** Aprobado |
| P-2 | `MANUAL_RECEIPT`/`MANUAL_ISSUE` | **`RECEIPT`/`ISSUE`.** «Manual» describe quién provocó, no qué ocurrió; eso es la causa. Evita `AUTO_RECEIPT`, `LAB_ISSUE`, `SALES_ISSUE` mañana |
| P-3 | `IMPAIRMENT` | **Dentro**, con la corrección del Blocker 1 |
| P-4 | `currency` | **`DepositCurrency = "PYG"`** literal local, no `string`, sin enum global |
| P-5 | `economic_consequence.pull` | **`system`.** A-4 es service-to-service. **Sin precedente en v0.10.0 — inaugura la clase** |

---

## 13. Registro de la pasada de contrato — qué cambió y por qué

| Hallazgo | Corrección |
|---|---|
| **Blocker 1** · `REVERSAL` era a la vez `CostEffectKind` y `ConsequenceRole`; revertir un `IMPAIRMENT` perdía el eje costo/valor y rompía DEP-36 | `REVERSAL` **sale** de `CostEffectKind`. La reversa preserva el `kind` (naturaleza) y cambia `role` + signo. Ídem `REEXPOSURE`. Tripwire en `verify-superficie` |
| **Blocker 2** · F-5 exige el contrato de provocación (C-7); la capability `operation.post` sola no es contrato | `InventoryProvocation` + `ProvocationLine` en `src/deposito.ts` y su schema. Causa obligatoria; sin costo, sin movimientos, sin lotes. Tabla de tipos provocables |
| P-2 nombres | `RECEIPT` / `ISSUE`; el origen vive en `cause` |
| P-4 currency | literal `"PYG"` en TS y schema |
| P-5 initiator | `system`; **sin el precedente citado**, que no existe |
| Transferencia vs. scope por almacén | Regla escrita: alcance sobre **origen y destino**, atomicidad C-9; en la `descripcion` de `operar` y en §6.1 |
| `change_mask` arbitrario | Convención de nacimiento de la casa (padrón): campos poblados, nombres, nunca valores |

---

## Apéndice · Orden de escritura, cada paso con `npm run verify` verde

1. §1 enums + §8 exports → `verify-superficie` los ve.
2. §2 `deposito.ts` + dos schemas + `generate-schema.mjs` → `prebuild` los llena.
3. §3 capabilities · §4 errors.
4. §5 events → el sobre se regenera; `verify` cuenta 41.
5. §6 manifiesto + `manifests.ts` → `verify` **rompe** en el conteo (esperado) → §7 lo repara y
   agrega firmas y tripwires.
6. §9 README · §10 versión.
7. Commit. **Tag después de la firma de F-4.**
