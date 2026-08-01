/**
 * Module manifests — canonical rows live in data/manifests/*.json.
 * Foundation (and commercial modules) consume these for function grants.
 */
export interface ManifestFunction {
    function_key: string;
    nombre: string;
    descripcion: string;
    autorizada_por_canal: boolean;
    orden: number;
}
export interface ManifestRole {
    role_key: string;
    nombre: string;
    orden: number;
    functions: string[];
}
export interface ModuleManifest {
    module_key: string;
    manifest_version: number;
    functions: ManifestFunction[];
    roles: ManifestRole[];
    role_grant_matrix: Record<string, string[]>;
    /** Vacío hasta 6.2; ver inventario-cosecha.md §4. */
    mandate_types: Array<Record<string, unknown>>;
}
export declare const COMPRA_MANIFEST: ModuleManifest;
export declare const MANIFESTS: readonly ModuleManifest[];
export declare function manifestByModuleKey(moduleKey: string): ModuleManifest | undefined;
//# sourceMappingURL=manifests.d.ts.map