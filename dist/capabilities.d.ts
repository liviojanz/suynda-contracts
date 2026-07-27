/**
 * Capability registry — shape LOCKED; rows PROPUESTO (security pass will firm).
 * Canonical: data/capabilities.json.
 */
export type CapabilityAvailability = "FAIL_OPEN" | "FAIL_AFTER_GRACE" | "FAIL_CLOSED";
export type CapabilityInitiator = "user" | "system" | "both";
export interface Capability {
    key: string;
    availability: CapabilityAvailability;
    initiator: CapabilityInitiator;
}
export declare const CAPABILITIES: readonly Capability[];
export type CapabilityKey = (typeof CAPABILITIES)[number]["key"];
//# sourceMappingURL=capabilities.d.ts.map