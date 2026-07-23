/**
 * Metered-operation keys + descriptions. NO credit costs.
 * Costs live in Foundation operation_costs config table (§7.6.4).
 * Canonical: data/metered-operations.json. Key list still PROPUESTO (v4.3 §14 #1).
 */

import meteredData from "../data/metered-operations.json" with { type: "json" };
import type { ModuleKey } from "./enums.js";

/**
 * Shape deliberately has no `creditos` field.
 * Adding a cost number here is a rejected change.
 */
export interface MeteredOperation {
  module: ModuleKey;
  operation_key: string;
  descripcion: string;
}

export const METERED_OPERATIONS =
  meteredData.operations as readonly MeteredOperation[];

export type MeteredOperationKey =
  (typeof METERED_OPERATIONS)[number]["operation_key"];
