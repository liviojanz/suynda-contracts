/**
 * Metered-operation keys + descriptions. NO credit costs.
 * Costs live in Foundation operation_costs config table (§7.6.4).
 * Canonical: data/metered-operations.json. Key list still PROPUESTO (v4.3 §14 #1).
 */
import meteredData from "../data/metered-operations.json" with { type: "json" };
export const METERED_OPERATIONS = meteredData.operations;
//# sourceMappingURL=metered-operations.js.map