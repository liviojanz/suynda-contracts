/**
 * Stable error codes across module boundaries.
 * Canonical: data/error-codes.json. Rows PROPUESTO — starter set, expect growth.
 */
export interface ErrorCode {
    code: string;
    http: number;
    message_es: string;
}
export declare const ERROR_CODES: readonly ErrorCode[];
export type ErrorCodeKey = (typeof ERROR_CODES)[number]["code"];
export declare function errorByCode(code: ErrorCodeKey): ErrorCode | undefined;
//# sourceMappingURL=errors.d.ts.map