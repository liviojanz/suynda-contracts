/**
 * Event catalog — noun.verb_past, English, reference-only.
 * Canonical rows: data/events.json.
 */
import eventsData from "../data/events.json" with { type: "json" };
export const EVENTS = eventsData;
export const EVENT_TYPES = EVENTS.map((e) => e.type);
//# sourceMappingURL=events.js.map