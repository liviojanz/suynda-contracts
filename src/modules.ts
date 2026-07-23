/**
 * Modules seed — Foundation seeds its `modules` table from data/modules.json.
 * Platform modules (clase = plataforma) never appear in the armador; gate is clase, not a flag.
 */

import modulesData from "../data/modules.json" with { type: "json" };
import type { ModuleClass, ModuleKey, ModuleLevel } from "./enums.js";

export interface ModuleSeed {
  key: ModuleKey;
  clase: ModuleClass;
  /** null for plataforma; 1 or 2 for comercial. */
  nivel: ModuleLevel;
  nombre_es: string;
  descripcion_es: string;
  activo: boolean;
}

export const MODULES = modulesData as readonly ModuleSeed[];

export function moduleByKey(key: ModuleKey): ModuleSeed | undefined {
  return MODULES.find((m) => m.key === key);
}
