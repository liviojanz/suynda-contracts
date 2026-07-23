/**
 * Event catalog — noun.verb_past, English, reference-only.
 * Canonical rows: data/events.json.
 */

import eventsData from "../data/events.json" with { type: "json" };
import type { ModuleKey } from "./enums.js";

export interface EventCatalogEntry {
  type: string;
  origen_module: ModuleKey;
  version: number;
}

export const EVENTS = eventsData as readonly EventCatalogEntry[];

export type EventType = (typeof EVENTS)[number]["type"];

export const EVENT_TYPES = EVENTS.map((e) => e.type) as readonly EventType[];
