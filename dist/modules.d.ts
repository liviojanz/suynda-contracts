/**
 * Modules seed — Foundation seeds its `modules` table from data/modules.json.
 * Platform modules (clase = plataforma) never appear in the armador; gate is clase, not a flag.
 */
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
export declare const MODULES: readonly ModuleSeed[];
export declare function moduleByKey(key: ModuleKey): ModuleSeed | undefined;
//# sourceMappingURL=modules.d.ts.map