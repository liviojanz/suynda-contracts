/**
 * Module manifests — canonical rows live in data/manifests/*.json.
 * Foundation (and commercial modules) consume these for function grants.
 */

import compraManifestData from "../data/manifests/compra.json" with { type: "json" };

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

export const COMPRA_MANIFEST = compraManifestData as ModuleManifest;

export const MANIFESTS: readonly ModuleManifest[] = [COMPRA_MANIFEST];

export function manifestByModuleKey(
  moduleKey: string,
): ModuleManifest | undefined {
  return MANIFESTS.find((m) => m.module_key === moduleKey);
}
