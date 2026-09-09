/**
 * El sobre de error de la plataforma — RC-wire (v0.13.0).
 *
 * Lo producen Foundation (`src/http/server.ts:614-634`), Padrón
 * (`src/http/server.ts:78-96`) y Lab hacia su navegador; lo leen el hub por
 * `error.code` y Lab del lado de Padrón. Es contrato real entre repos.
 *
 * `code` es `string` y NO `ErrorCodeKey` (D24): el mismo sobre transporta
 * códigos locales de un módulo hacia su propio navegador, y un tipo que los
 * excluyera mentiría. Los códigos GLOBALES viven en `data/error-codes.json`.
 * `message` es texto humano, opaco: el `message_es` del catálogo es copy
 * canónico del código, no obligación byte a byte para los productores.
 * `detail` es opcional y `unknown` (D23): los productores pueden no emitirlo
 * y contracts no garantiza su estructura. El sobre es EXTENSIBLE.
 */
export interface ErrorEnvelope {
    error: {
        code: string;
        message: string;
        detail?: unknown;
    };
}
/**
 * Guard estructural, puro, sin ajv: objeto con `error` objeto cuyos `code` y
 * `message` son strings. No mira `detail` ni rechaza claves de más.
 */
export declare function isErrorEnvelope(value: unknown): value is ErrorEnvelope;
//# sourceMappingURL=error-envelope.d.ts.map