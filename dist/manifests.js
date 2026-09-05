/**
 * Module manifests — canonical rows live in data/manifests/*.json.
 * Foundation (and commercial modules) consume these for function grants.
 */
import compraManifestData from "../data/manifests/compra.json" with { type: "json" };
import labManifestData from "../data/manifests/lab.json" with { type: "json" };
import depositoManifestData from "../data/manifests/deposito.json" with { type: "json" };
export const COMPRA_MANIFEST = compraManifestData;
export const LAB_MANIFEST = labManifestData;
/**
 * Depósito (RC v0.11.0) — patrón Lab: roles [], acceso 100 % por tildes,
 * scope_type "almacen" en operar/contar (sin enum global de scope, a
 * propósito). Source: SUYNDA-DEPOSITO-DOMAIN-v1.0-FROZEN. Sus firmas las
 * sostiene verifyDepositoManifest en scripts/verify-v0.mjs.
 */
export const DEPOSITO_MANIFEST = depositoManifestData;
export const MANIFESTS = [
    COMPRA_MANIFEST,
    LAB_MANIFEST,
    DEPOSITO_MANIFEST,
];
export function manifestByModuleKey(moduleKey) {
    return MANIFESTS.find((m) => m.module_key === moduleKey);
}
//# sourceMappingURL=manifests.js.map