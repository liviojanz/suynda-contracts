/**
 * Capability registry — shape LOCKED; rows PROPUESTO (security pass will firm).
 * Canonical: data/capabilities.json.
 */

import capabilitiesData from "../data/capabilities.json" with { type: "json" };

// RC-wire v0.13.0 (D28): la fuente material es data/enums.json; acá sólo se
// re-exporta para que el path público de siempre no cambie.
export type { CapabilityAvailability } from "./enums.js";
import type { CapabilityAvailability } from "./enums.js";

export type CapabilityInitiator = "user" | "system" | "both";

export interface Capability {
  key: string;
  availability: CapabilityAvailability;
  initiator: CapabilityInitiator;
}

export const CAPABILITIES = capabilitiesData.capabilities as readonly Capability[];

export type CapabilityKey = (typeof CAPABILITIES)[number]["key"];
