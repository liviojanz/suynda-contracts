/**
 * Modules seed — Foundation seeds its `modules` table from data/modules.json.
 * Platform modules (clase = plataforma) never appear in the armador; gate is clase, not a flag.
 */
import modulesData from "../data/modules.json" with { type: "json" };
export const MODULES = modulesData;
export function moduleByKey(key) {
    return MODULES.find((m) => m.key === key);
}
//# sourceMappingURL=modules.js.map