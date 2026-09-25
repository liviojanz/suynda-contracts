/**
 * Module manifests — canonical rows live in data/manifests/*.json.
 * Foundation (and commercial modules) consume these for function grants.
 */
import compraManifestData from "../data/manifests/compra.json" with { type: "json" };
import labManifestData from "../data/manifests/lab.json" with { type: "json" };
import depositoManifestData from "../data/manifests/deposito.json" with { type: "json" };
import visibilidadManifestData from "../data/manifests/visibilidad.json" with { type: "json" };
export const COMPRA_MANIFEST = compraManifestData;
export const LAB_MANIFEST = labManifestData;
/**
 * Depósito (RC v0.11.0) — patrón Lab: roles [], acceso 100 % por tildes,
 * scope_type "almacen" en operar/contar (sin enum global de scope, a
 * propósito). Source: SUYNDA-DEPOSITO-DOMAIN-v1.0-FROZEN. Sus firmas las
 * sostiene verifyDepositoManifest en scripts/verify-v0.mjs.
 */
export const DEPOSITO_MANIFEST = depositoManifestData;
/**
 * Visibilidad (PE-VIS-1, cierra GAP-1 del census VIS-A0) — patrón Lab:
 * roles [], acceso 100 % por tildes, sin scope (el canal NO es dimensión
 * autorizativa). aprobar_contenido separado de gestionar_contenido: la
 * aprobación humana explícita es regla del producto (VIS-001 §2.4, §5.7).
 * Sus firmas las sostiene verifyVisibilidadManifest en scripts/verify-v0.mjs.
 *
 * Decisiones del fundador para el gate de funciones futuro (PE-VIS-1):
 * - gestionar_contenido cubre generación inicial, regeneración y revisión de
 *   versiones, incluido POST /v1/variants/:id/revisions.
 * - POST /v1/brand/lessons queda bajo gestionar_marca. Una lección creada
 *   como efecto interno de aprobar, editar y aprobar o rechazar NO pide un
 *   segundo check de gestionar_marca: el acto es aprobar_contenido.
 * - `ver` es delegable, pero una sesión prestada (nexo/tutela) sólo ve
 *   Visibilidad con tildes explícitas del módulo. Sin backfill: least privilege.
 */
export const VISIBILIDAD_MANIFEST = visibilidadManifestData;
export const MANIFESTS = [
    COMPRA_MANIFEST,
    LAB_MANIFEST,
    DEPOSITO_MANIFEST,
    VISIBILIDAD_MANIFEST,
];
export function manifestByModuleKey(moduleKey) {
    return MANIFESTS.find((m) => m.module_key === moduleKey);
}
//# sourceMappingURL=manifests.js.map