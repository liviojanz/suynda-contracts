/**
 * Stable error codes across module boundaries.
 * Canonical: data/error-codes.json. Rows PROPUESTO — starter set, expect growth.
 */

import errorCodesData from "../data/error-codes.json" with { type: "json" };

export interface ErrorCode {
  code: string;
  http: number;
  message_es: string;
}

export const ERROR_CODES = errorCodesData.errors as readonly ErrorCode[];

export type ErrorCodeKey = (typeof ERROR_CODES)[number]["code"];

export function errorByCode(code: ErrorCodeKey): ErrorCode | undefined {
  return ERROR_CODES.find((e) => e.code === code);
}
