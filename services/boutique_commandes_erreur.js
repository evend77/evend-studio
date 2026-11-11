// CHEMIN : services/boutique_commandes_erreur.js
// e-Vend Studio — Erreur « métier » partagée par les services de commandes et de codes promo (templates boutique, solo).
'use strict';
class ErreurCommande extends Error {
  constructor(message, status = 400, code) { super(message); this.status = status; this.code = code; }
}
module.exports = { ErreurCommande };