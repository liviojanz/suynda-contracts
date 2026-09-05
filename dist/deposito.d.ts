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
 *
 * Molde: src/reference.ts (tipos puros) + schema/*.schema.json (forma documentada,
 * «not a table»). Los enums de los schemas se GENERAN desde data/enums.json
 * (scripts/generate-schema.mjs); no se copian a mano.
 */
import type { ConsequenceRole, CostEffectKind, CostState, InventoryOperationType, ModuleKey, ProvisionalBasis, QuantityBranch, TrueUpMode } from "./enums.js";
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
     * la autorización se evalúa sobre origen Y destino (manifiesto, `operar`).
     * null en el resto.
     */
    almacen_destino_id: string | null;
    /**
     * Cuándo ocurrió (C-2). Depósito lo contrasta con la lock_date (DEP-21):
     * un hecho nuevo retrofechado a tramo cerrado se rechaza.
     */
    effective_at: IsoDateTime;
    lines: ProvocationLine[];
}
//# sourceMappingURL=deposito.d.ts.map