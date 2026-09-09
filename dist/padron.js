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
import { IDENTIFIER_TYPES } from "./enums.js";
// ── Transporte ───────────────────────────────────────────────────────────────
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
export const PADRON_PARTIES_PATH = "/padron/v1/parties";
/** El único query param del GET de búsqueda (`parties.ts:316-323`). */
export const PADRON_PARTIES_IDENTIFIER_QUERY = "identifier";
/** `GET /padron/v1/parties/:id` (`parties.ts:339`). */
export function padronPartyPath(partyId) {
    return `${PADRON_PARTIES_PATH}/${encodeURIComponent(partyId)}`;
}
/** `GET /padron/v1/parties/:id/roles` (`parties.ts:349`). */
export function padronPartyRolesPath(partyId) {
    return `${padronPartyPath(partyId)}/roles`;
}
/**
 * Header de request, obligatorio en todo comando de Padrón
 * (`padron/src/http/authn.ts:89-96`). Sin él: 400 `IDEMPOTENCY_KEY_REQUIRED`.
 */
export const IDEMPOTENCY_KEY_HEADER = "idempotency-key";
/**
 * Header de response: `true` cuando la respuesta es la repetición de un
 * comando ya ejecutado con la misma clave (`parties.ts:76-84`).
 */
export const IDEMPOTENCY_REPLAYED_HEADER = "idempotency-replayed";
// ── El identificador canónico: TIPO:PAIS:VALOR ───────────────────────────────
export const PARTY_IDENTIFIER_SEPARATOR = ":";
/** ¿Es uno de los `IDENTIFIER_TYPES` canónicos? Validación pura (D14). */
export function isIdentifierType(value) {
    return IDENTIFIER_TYPES.includes(value);
}
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
export function parsePartyIdentifier(raw) {
    if (typeof raw !== "string")
        return { ok: false, reason: "forma" };
    const first = raw.indexOf(PARTY_IDENTIFIER_SEPARATOR);
    if (first === -1)
        return { ok: false, reason: "forma" };
    const second = raw.indexOf(PARTY_IDENTIFIER_SEPARATOR, first + 1);
    if (second === -1)
        return { ok: false, reason: "forma" };
    const tipo = raw.slice(0, first);
    const pais = raw.slice(first + 1, second);
    const valor = raw.slice(second + 1);
    if (!isIdentifierType(tipo))
        return { ok: false, reason: "tipo" };
    if (valor.length === 0)
        return { ok: false, reason: "valor" };
    return { ok: true, value: { tipo, countryCode: pais === "" ? null : pais, valor } };
}
/** El inverso exacto: `` `${tipo}:${countryCode ?? ""}:${valor}` ``. */
export function formatPartyIdentifier(id) {
    return `${id.tipo}${PARTY_IDENTIFIER_SEPARATOR}${id.countryCode ?? ""}${PARTY_IDENTIFIER_SEPARATOR}${id.valor}`;
}
export function isPartyIdentifierString(raw) {
    return parsePartyIdentifier(raw).ok;
}
//# sourceMappingURL=padron.js.map