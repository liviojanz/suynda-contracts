/**
 * Capability registry — shape LOCKED; rows PROPUESTO (security pass will firm).
 * Canonical: data/capabilities.json.
 */

import capabilitiesData from "../data/capabilities.json" with { type: "json" };

export type CapabilityAvailability =
  | "FAIL_OPEN"
  | "FAIL_AFTER_GRACE"
  | "FAIL_CLOSED";

export type CapabilityInitiator = "user" | "system" | "both";

export interface Capability {
  key: string;
  availability: CapabilityAvailability;
  initiator: CapabilityInitiator;
}

export const CAPABILITIES = capabilitiesData.capabilities as readonly Capability[];

export type CapabilityKey = (typeof CAPABILITIES)[number]["key"];
