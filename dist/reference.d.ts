/**
 * Cross-module reference convention (§5.2, §5.5).
 * Expressed as types + schema/reference.schema.json for composition.
 * Consumers hold references + display cache — never own copies. No JSONB.
 */
/**
 * Cache columns a consumer holds for a foreign entity.
 * `{Entidad}` is the PascalCase stem used only in type names (Party, Item);
 * runtime columns use snake_case: party_id, party_nombre_cache, …
 *
 * - `{entidad}_id` — the reference, indexed
 * - `{entidad}_nombre_cache` — display-only; never editable by the consumer
 * - `{entidad}_cache_at` — timestamp of the cache
 * - `{entidad}_entity_version` — out-of-order event handling
 * - `{entidad}_owner` — only when the owner can vary; omit for padron (owner implicit)
 */
export interface ReferenceCacheColumns {
    id: string;
    nombre_cache: string;
    cache_at: string;
    entity_version: number;
    /** Present only when owner can vary; omit for padron entities. */
    owner?: string;
}
/** Concrete party reference (padron — no owner column). */
export interface PartyReference {
    party_id: string;
    party_nombre_cache: string;
    party_cache_at: string;
    party_entity_version: number;
}
/** Concrete item reference (padron — no owner column). */
export interface ItemReference {
    item_id: string;
    item_nombre_cache: string;
    item_cache_at: string;
    item_entity_version: number;
}
/**
 * Generic helper: maps an entity stem to the column name set.
 * e.g. ReferenceColumns<"party"> → party_id, party_nombre_cache, …
 */
export type ReferenceColumns<Stem extends string> = {
    [K in `${Stem}_id` | `${Stem}_nombre_cache` | `${Stem}_cache_at`]: K extends `${Stem}_id` ? string : K extends `${Stem}_nombre_cache` ? string : string;
} & {
    [K in `${Stem}_entity_version`]: number;
} & {
    [K in `${Stem}_owner`]?: string;
};
//# sourceMappingURL=reference.d.ts.map