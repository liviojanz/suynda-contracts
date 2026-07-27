/**
 * Event catalog — noun.verb_past, English, reference-only.
 * Canonical rows: data/events.json.
 */
import type { ModuleKey } from "./enums.js";
export interface EventCatalogEntry {
    type: string;
    origen_module: ModuleKey;
    version: number;
}
export declare const EVENTS: readonly EventCatalogEntry[];
export type EventType = (typeof EVENTS)[number]["type"];
export declare const EVENT_TYPES: readonly EventType[];
//# sourceMappingURL=events.d.ts.map