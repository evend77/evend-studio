// CHEMIN : routes/collab_etiquettes.js
// e-Vend Studio — Étiquettes d'expédition du collaborateur (add-ons « Étiquettes Shippo / EasyPost / Postes Canada »).
// Adapté de routes/vendeurs_etiquettes.js (e-Vend). Monté dans collab_dashboard.js, APRÈS le middleware d'authentification
// (req.gid = gestionnaire, req.cid = collaborateur connecté), sur /api/collab/:gestionnaireId :
//   GET  /etiquettes/config                     état des transporteurs (jamais de clé en clair)
//   PUT  /etiquettes/shippo                     { token?, actif?, effacer? }
//   PUT  /etiquettes/easypost                   { cle?, secret?, effacer_secret?, actif?, effacer? }
//   POST /commandes/:id/tarifs-expedition       { longueur_cm, largeur_cm, hauteur_cm, poids_kg }
//   POST /commandes/:id/etiquette               { rate_id, shipment_id, transporteur, longueur_cm… }  → achète + passe la commande à « expédiée »
//   GET  /commandes/:id/historique-suivi        événements détaillés du transporteur
// Reçoit de collab_dashboard.js ses utilitaires (h, bad, entier, transitionsPour, notifierAcheteur, courrielExpedition).

const express = require('express');
const pool = require('../db');
const svc = require('../services/studio_etiquettes');
const rembMV = require('../services/studio_remboursement');
const regCmd = require('../services/studio_regles_commande');

const httpSure = (u) => (typeof u === 'string' && /^https?:\/\/\S+$/i.test(u) && u.length <= 2000 ? u : null);
const pdfOuHttp = (u) => (httpSure(u) || (typeof u === 'string' && /^data:application\/pdf;base64,[A-Za-z0-9+/=]+$/.test(u) ? u : null));

module.exports = function creerRouteur({ h, bad, entier, transitionsPour, notifierAcheteur, courrielExpedition }) {
  const router = express.Router();

  // Les erreurs « métier » du service deviennent une réponse lisible (avec le diagnostic du transporteur s'il y en a un)
  const metier = (fn) => h(async (req, res) => {
    try { await fn(req, res); }
    catch (e) {
      if (e instanceof svc.ErreurEtiquette) return res.status(e.status).json({ error: e.message, diagnostic: e.diagnostic || undefined });
      throw e;
    }
  });

  router.get('/etiquettes/config', metier(async (req, res) => {
    res.json(await svc.etatConfig(req.cid, req.gid));
  }));

  router.put('/etiquettes/shippo', metier(async (req, res) => {
    const b = req.body || {};
    await svc.enregistrerShippo(req.cid, req.gid, {
      token: typeof b.token === 'string' ? b.token : undefined,
      actif: typeof b.actif === 'boolean' ? b.actif : undefined,
      effacer: b.effacer === true,
    });
    res.json({ success: true, ...(await svc.etatConfig(req.cid, req.gid)) });
  }));

  router.put('/etiquettes/easypost', metier(async (req, res) => {
    const b = req.body || {};
    await svc.enregistrerEasyPost(req.cid, req.gid, {
      cle: typeof b.cle === 'string' ? b.cle : undefined,
      secret: typeof b.secret === 'string' ? b.secret : undefined,
      effacerSecret: b.effacer_secret === true,
      actif: typeof b.actif === 'boolean' ? b.actif : undefined,
      effacer: b.effacer === true,
    });
    res.json({ success: true, ...(await svc.etatConfig(req.cid, req.gid)) });
  }));

  router.post('/commandes/:id/tarifs-expedition', metier(async (req, res) => {
    const id = entier(req.params.id);
    if (!id) bad('Commande invalide');
    res.json(await svc.tarifs(req.cid, req.gid, id, req.body || {}));
  }));

  router.post('/commandes/:id/etiquette', metier(async (req, res) => {
    const id = entier(req.params.id);
    if (!id) bad('Commande invalide');
    const b = req.body || {};
    const cmd = await svc.chargerCommande(req.cid, req.gid, id);
    if (!cmd) bad('Commande introuvable', 404);

    // « Accepter et expédier » en une étape est permis seulement si le gestionnaire l'autorise ; une commande déjà expédiée peut être rééquipée
    const rg = await regCmd.lire(req.gid, pool);
    const payee = cmd.statut_paiement === 'paye';
    const dejaExpediee = cmd.statut === 'expediee';
    if (!dejaExpediee && !transitionsPour(cmd.statut, payee, rg).includes('expediee')) bad("Cette commande doit d'abord être acceptée avant de créer une étiquette.", 409);

    const { provider, achat } = await svc.acheter(req.cid, req.gid, cmd, b);

    const nomTransporteur = String(typeof b.transporteur === 'string' && b.transporteur.trim() ? b.transporteur : provider).slice(0, 60);
    const suivi = achat.numeroSuivi ? String(achat.numeroSuivi).slice(0, 80) : null;
    const urlSuivi = httpSure(achat.urlSuivi);
    const urlEtiquette = pdfOuHttp(achat.urlEtiquette);

    const upd = await pool.query(
      `UPDATE marketplace_commandes
          SET statut = 'expediee', numero_suivi = $1, transporteur = $2, url_suivi = $3, url_etiquette = $4,
              etiquette_provider = $5, etape_livraison = 'etiquette_creer', updated_at = NOW()
        WHERE id = $6 AND collaborateur_id = $7 AND gestionnaire_id = $8 AND statut IN ('en_attente','confirmee','expediee')
        RETURNING id`,
      [suivi, nomTransporteur, urlSuivi, urlEtiquette, provider, id, req.cid, req.gid]);
    if (!upd.rowCount) {
      console.error(`[collab_etiquettes] ÉTIQUETTE ACHETÉE mais commande ${id} non mise à jour (statut changé entre-temps). Suivi : ${suivi}`);
      bad("L'étiquette a été achetée, mais la commande a changé d'état entre-temps. Actualisez la page ; le numéro de suivi est : " + (suivi || 'inconnu'), 409);
    }

    if (!dejaExpediee && cmd.statut === 'en_attente') await rembMV.noter(pool, id, 'statut_confirmee', 'Acceptée et expédiée en une étape', 'collaborateur');
    await rembMV.noter(pool, id, 'etiquette_creee', [svc.TRANSPORTEURS[provider].nom, nomTransporteur, suivi].filter(Boolean).join(' · '), 'collaborateur');
    if (!dejaExpediee) await rembMV.noter(pool, id, 'statut_expediee', [nomTransporteur, suivi].filter(Boolean).join(' · ') || null, 'collaborateur');

    if (cmd.acheteur_id) {
      await notifierAcheteur(req.gid, cmd.acheteur_id, dejaExpediee ? 'Suivi mis à jour' : 'Commande expédiée',
        `${dejaExpediee ? 'Nouveau suivi' : `Votre commande ${cmd.numero_commande} est maintenant expédiée. Suivi`} : ${suivi || 'à venir'}.${urlSuivi ? ' Lien : ' + urlSuivi : ''}`, 'commande');
    }
    if (!dejaExpediee && rg.mailExpedition) await courrielExpedition(req.gid, cmd, { transp: nomTransporteur, suivi: suivi || '', url: urlSuivi || '', datePrevue: null });

    res.json({ success: true, numero_suivi: suivi, url_suivi: urlSuivi, url_etiquette: urlEtiquette });
  }));

  router.get('/commandes/:id/historique-suivi', h(async (req, res) => {
    const id = entier(req.params.id);
    if (!id) bad('Commande invalide');
    const r = await pool.query('SELECT historique_suivi FROM marketplace_commandes WHERE id = $1 AND collaborateur_id = $2 AND gestionnaire_id = $3', [id, req.cid, req.gid]);
    if (!r.rows.length) bad('Commande introuvable', 404);
    res.json({ evenements: svc.lireHistorique(r.rows[0].historique_suivi) });
  }));

  return router;
};