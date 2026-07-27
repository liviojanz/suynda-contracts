/**
 * Stable error codes across module boundaries.
 * Canonical: data/error-codes.json. Rows PROPUESTO — starter set, expect growth.
 */
import errorCodesData from "../data/error-codes.json" with { type: "json" };
export const ERROR_CODES = errorCodesData.errors;
export function errorByCode(code) {
    return ERROR_CODES.find((e) => e.code === code);
}
//# sourceMappingURL=errors.js.map