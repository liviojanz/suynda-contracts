/**
 * El wire de PADRÓN, visto desde un consumidor — RC-wire (v0.13.0).
 *
 * ── OWNERSHIP (D21, 9-sep-2026) ─────────────────────────────────────────────
 *
 * Padrón es el registro maestro COMPARTIDO de plataforma: sus rutas de parties
 * las consumen Lab y Foundation, y su formato de identificador lo parseaban dos
 * repos con el mismo código. Por eso su transporte vive acá.
 *
 * ESTO NO ES PRECEDENTE PARA LAS APIs DE UN MÓDULO: Lab, Depósito y los que
 * vengan conservan su transporte en su propio repo (ver `src/deposito.ts`).
 *
 * Se declara SÓLO lo implementado (D17): las tres rutas de parties que un
 * módulo consume. Items, branches, catálogos, fiscal-profile, consumidor-final
 * y los POST de roles/identifiers/contacts/deactivate no entran en esta
 * versión: sin consumidor en el SDK de módulo. La búsqueda `?role=&q=` que
 * `ARCHITECTURE.md:308` documenta NO EXISTE en Padrón y no se declara.
 *
 * ── EL CODEC (D14) ───────────────────────────────────────────────────────────
 *
 * `TIPO:PAIS:VALOR` es sintaxis wire que productor y consumidores tienen que
 * interpretar exactamente igual: por eso el parse y el format viven acá, y son
 * PUROS. Lo que NO hacen: recortar, poner en mayúsculas ni resolver el país
 * vacío a `PY`. Eso es la normalización de Padrón (`party-service.ts:57-72`),
 * implementación del productor, y queda documentada, no implementada.
 */
import type { IdentifierType, PartyRole } from "./enums.js";
import type { IsoDateTime } from "./deposito.js";
/**
 * La ruta base de parties (`padron/src/http/routes/parties.ts:89, 317`).
 *
 *   POST  PADRON_PARTIES_PATH                      upsert por identificador
 *         capability `padron.party.create`; header `Idempotency-Key` obligatorio;
 *         201 si creó, 200 si ya existía; body `PartyUpsertResponse`.
 *   GET   PADRON_PARTIES_PATH?identifier=TIPO:PAIS:VALOR
 *         capability `padron.party.read`; body `PartyDetailsResponse`;
 *         404 `PADRON_PARTY_NOT_FOUND` si no existe — Y TAMBIÉN si el query
 *         falta (`parties.ts:324-326`): conducta observada, no diseñada.
 *   GET   padronPartyPath(id)                      body `PartyDetailsResponse`
 *   GET   padronPartyRolesPath(id)                 body `PartyRolesResponse`
 *
 * El tenant sale del TOKEN en todas (`authn.ts:82-87`).
 */
export declare const PADRON_PARTIES_PATH: "/padron/v1/parties";
/** El único query param del GET de búsqueda (`parties.ts:316-323`). */
export declare const PADRON_PARTIES_IDENTIFIER_QUERY: "identifier";
/** `GET /padron/v1/parties/:id` (`parties.ts:339`). */
export declare function padronPartyPath(partyId: string): string;
/** `GET /padron/v1/parties/:id/roles` (`parties.ts:349`). */
export declare function padronPartyRolesPath(partyId: string): string;
/**
 * Header de request, obligatorio en todo comando de Padrón
 * (`padron/src/http/authn.ts:89-96`). Sin él: 400 `IDEMPOTENCY_KEY_REQUIRED`.
 */
export declare const IDEMPOTENCY_KEY_HEADER: "idempotency-key";
/**
 * Header de response: `true` cuando la respuesta es la repetición de un
 * comando ya ejecutado con la misma clave (`parties.ts:76-84`).
 */
export declare const IDEMPOTENCY_REPLAYED_HEADER: "idempotency-replayed";
export declare const PARTY_IDENTIFIER_SEPARATOR: ":";
/** Un identificador de Party, parseado. `countryCode` `null` = no se indicó. */
export interface PartyIdentifier {
    tipo: IdentifierType;
    countryCode: string | null;
    valor: string;
}
export type ParsePartyIdentifierResult = {
    ok: true;
    value: PartyIdentifier;
} | {
    ok: false;
    /** `forma`: no hay dos separadores · `tipo`: no es un IdentifierType · `valor`: vacío. */
    reason: "forma" | "tipo" | "valor";
};
/** ¿Es uno de los `IDENTIFIER_TYPES` canónicos? Validación pura (D14). */
export declare function isIdentifierType(value: string): value is IdentifierType;
/**
 * Parsea `TIPO:PAIS:VALOR` exactamente como lo hace Padrón
 * (`parties.ts:326-329`): se parte por el primer y el segundo separador; el
 * PAÍS vacío es `null`; el VALOR es TODO el resto, incluidos los separadores
 * que contenga, y no puede ser vacío. Además valida que TIPO sea un
 * `IdentifierType` — Padrón hoy tolera otros strings (C.8); ese es un margen
 * de implementación del productor, no superficie soportada (D26).
 *
 * No normaliza: ni recorta, ni pone en mayúsculas, ni resuelve `null` a `PY`.
 */
export declare function parsePartyIdentifier(raw: string): ParsePartyIdentifierResult;
/** El inverso exacto: `` `${tipo}:${countryCode ?? ""}:${valor}` ``. */
export declare function formatPartyIdentifier(id: PartyIdentifier): string;
export declare function isPartyIdentifierString(raw: string): boolean;
/**
 * Las CINCO claves de `fields` que Padrón honra al escribir
 * (`padron/src/party-service.ts:74-80`). Claves desconocidas: Padrón las
 * IGNORA hoy —no las rechaza— (D25); no se afirma acá una validación que no
 * existe.
 */
export interface PartyFields {
    tipo?: string | null;
    nombre_fantasia?: string | null;
    tipo_contribuyente?: string | null;
    tipo_regimen?: string | null;
    actividades_economicas?: unknown | null;
}
/**
 * Body de `POST /padron/v1/parties` (`parties.ts:33-58`). Padrón declara
 * `additionalProperties: false` en la raíz; en runtime Fastify DESCARTA las
 * claves de más en silencio (ajv `removeAdditional`), no las rechaza. El
 * rechazo explícito es corrida de adopción de Padrón.
 */
export interface PartyUpsertRequest {
    identifier: {
        tipo: IdentifierType;
        countryCode?: string | null;
        valor: string;
    };
    razonSocial: string;
    fields?: PartyFields;
    roles?: PartyRole[];
}
/**
 * La fila de Party tal como Padrón la sirve en las tres rutas
 * (`padron/src/db/types.ts:14-28`). Las fechas viajan como ISO 8601 (D16).
 * `tipo` es `string | null` y no enum: el comentario del productor dice
 * «fisica | juridica» pero nada lo valida (D19).
 */
export interface PartyRow {
    id: string;
    tenant_id: string;
    tipo: string | null;
    razon_social: string;
    nombre_fantasia: string | null;
    tipo_contribuyente: string | null;
    tipo_regimen: string | null;
    actividades_economicas: unknown | null;
    es_consumidor_final: boolean;
    entity_version: number;
    deleted_at: IsoDateTime | null;
    created_at: IsoDateTime;
    updated_at: IsoDateTime;
}
/** `padron/src/db/types.ts:41-49`. */
export interface PartyRoleRow {
    id: string;
    tenant_id: string;
    party_id: string;
    rol: PartyRole;
    activo: boolean;
    activated_at: IsoDateTime;
    deactivated_at: IsoDateTime | null;
}
/** `padron/src/db/types.ts:51-59`. */
export interface PartyContactRow {
    id: string;
    tenant_id: string;
    party_id: string;
    tipo: string | null;
    valor: string | null;
    principal: boolean;
    created_at: IsoDateTime;
}
/** `padron/src/db/types.ts:61-73`. */
export interface PartyBranchRow {
    id: string;
    tenant_id: string;
    party_id: string;
    codigo: string | null;
    nombre: string | null;
    direccion: string | null;
    ciudad_id: string | null;
    tipo: string | null;
    entity_version: number;
    created_at: IsoDateTime;
    updated_at: IsoDateTime;
}
/** Body de los dos GET de detalle (`party-service.ts:43-48`). */
export interface PartyDetailsResponse {
    party: PartyRow;
    roles: PartyRoleRow[];
    contacts: PartyContactRow[];
    branches: PartyBranchRow[];
}
/** Body del upsert: 201 con `created: true`, 200 con `false` (`parties.ts:113-116`). */
export interface PartyUpsertResponse {
    party: PartyRow;
    created: boolean;
}
/** Body de `GET …/:id/roles` (`parties.ts:348-358`). */
export interface PartyRolesResponse {
    roles: PartyRoleRow[];
}
//# sourceMappingURL=padron.d.ts.map