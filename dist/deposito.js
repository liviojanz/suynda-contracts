/**
 * Formas que cruzan la frontera de Depósito. Source: SUYNDA-DEPOSITO-DOMAIN-v1.0-FROZEN.
 *
 *  · Hacia Núcleo (A-4, DEP-38): EconomicConsequence — lo que Núcleo PULLEA.
 *  · Desde verticales (C-7, E-bis (b)): InventoryProvocation — lo que un módulo
 *    PIDE. Se diseña ahora, se activa con el primer consumidor real.
 *
 * Contracts gobierna el SIGNIFICADO de estas formas; el transporte (paths, auth,
 * paginación, status codes) vive en el OpenAPI del repo de Depósito, versionado
 * con el tag del módulo. Sin estas formas acá, Núcleo y Depósito compilarían dos
 * EconomicConsequence distintas, y Lab y Depósito dos provocaciones distintas —
 * y el sobre reference-only (A-3) impide que ninguna viaje por evento.
 *
 * Molde: src/reference.ts (tipos puros) + schema/*.schema.json (forma documentada,
 * «not a table»). Los enums de los schemas se GENERAN desde data/enums.json
 * (scripts/generate-schema.mjs); no se copian a mano.
 */
export {};
//# sourceMappingURL=deposito.js.map