/**
 * Module manifests — canonical rows live in data/manifests/*.json.
 * Foundation (and commercial modules) consume these for function grants.
 */
import compraManifestData from "../data/manifests/compra.json" with { type: "json" };
export const COMPRA_MANIFEST = compraManifestData;
export const MANIFESTS = [COMPRA_MANIFEST];
export function manifestByModuleKey(moduleKey) {
    return MANIFESTS.find((m) => m.module_key === moduleKey);
}
//# sourceMappingURL=manifests.js.map