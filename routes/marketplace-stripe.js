// CHEMIN : routes/marketplace-stripe.js
// e-Vend Studio — Stripe Connect côté COLLABORATEUR (template multi-vendeur)
// Le collaborateur lie SON compte Stripe à la plateforme Stripe de SON gestionnaire
// (clés et réglages lus dans gestionnaire_stripe_config, jamais une clé globale).
// À monter dans server.js : app.use('/api/marketplace', require('./routes/marketplace-stripe'));
//   GET  /:gid/collaborateurs/:collabId/stripe/statut      → état du compte (rafraîchi depuis Stripe)
//   POST /:gid/collaborateurs/:collabId/stripe/connect     → crée le compte si besoin + lien d'inscription Stripe
//   POST /:gid/collaborateurs/:collabId/stripe/deconnecter → coupe le lien chez nous (le compte Stripe reste intact)

const express = require('express');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
const pool = require('../db');
const { dechiffrer } = require('../src/utils/chiffrement');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const TYPES_COMPTE = ['express', 'standard', 'custom'];

// ─── Auth : cookie httpOnly mv_token_<gid> (repli : en-tête Authorization) ───
// Le jeton doit appartenir à CETTE boutique, être de type collaborateur et
// correspondre au :collabId de l'URL — un collaborateur ne touche qu'à son compte.
function authCollaborateur(req, res, next) {
  const { gid, collabId } = req.params;
  const cookieToken = req.cookies && req.cookies[`mv_token_${gid}`];
  const auth = req.headers.authorization;
  const headerToken = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const token = cookieToken || headerToken;
  if (!token) return res.status(401).json({ message: 'Non authentifie' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.gestionnaireId !== Number(gid)) {
      return res.status(403).json({ message: "Ce compte n'appartient pas a cette boutique." });
    }
    if (payload.type !== 'collaborateur' || payload.id !== Number(collabId)) {
      return res.status(403).json({ message: 'Acces refuse.' });
    }
    req.mvUser = payload;
    next();
  } catch { res.status(401).json({ message: 'Token invalide ou expire' }); }
}

// ─── Utilitaires (inline) ────────────────────────────────────────────────────
function lireCle(valeurChiffree) {
  if (!valeurChiffree) return null;
  try { return dechiffrer(valeurChiffree) || null; } catch (e) { return null; }
}

// Config Stripe du gestionnaire de CE site : environnement actif, client Stripe, réglages.
async function chargerContexte(gid) {
  const r = await pool.query('SELECT * FROM gestionnaire_stripe_config WHERE gestionnaire_id = $1', [gid]);
  const cfg = r.rows[0];
  if (!cfg) return null;
  const env = cfg.sandbox ? 'dev' : 'prod';
  const cle = lireCle(env === 'dev' ? cfg.dev_secret_key : cfg.prod_secret_key);
  const connectActif = env === 'dev' ? cfg.connect_actif_dev : cfg.connect_actif_prod;
  return {
    cfg,
    env,
    p: cfg.parametres && typeof cfg.parametres === 'object' ? cfg.parametres : {},
    actif: !!cle && !!connectActif,
    stripe: cle ? Stripe(cle) : null,
  };
}

function statutDepuisCompte(compte) {
  const chargesOk = !!compte.charges_enabled;
  const payoutsOk = !!compte.payouts_enabled;
  const exigences = compte.requirements || {};
  const statut = chargesOk && payoutsOk ? 'active' : (exigences.disabled_reason ? 'restricted' : 'pending');
  return { chargesOk, payoutsOk, exigences, statut };
}

function compteIntrouvable(e) {
  return !!e && (e.code === 'account_invalid' || /No such account|does not have access to account/i.test(e.message || ''));
}

// URL de retour après l'inscription Stripe : même site que la requête (jamais un
// domaine étranger), page dashboard-collaborateur, + ?stripe=success|refresh.
function urlRetour(req, retour, etat) {
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol).split(',')[0].trim();
  const hote = String(req.headers['x-forwarded-host'] || req.get('host')).split(',')[0].trim();
  let u = null;
  try { u = new URL(String(retour || '')); } catch (e) { u = null; }
  if (!u || u.host !== hote) u = new URL(`${proto}://${hote}/`);
  u.searchParams.set('page', 'dashboard-collaborateur');
  u.searchParams.set('stripe', etat);
  u.hash = '';
  return u.toString();
}

// ─── GET statut ──────────────────────────────────────────────────────────────
router.get('/:gid/collaborateurs/:collabId/stripe/statut', authCollaborateur, async (req, res) => {
  const { gid } = req.params;
  const collabId = Number(req.params.collabId);
  try {
    const ctx = await chargerContexte(gid);
    const base = { paiements_actives: !!(ctx && ctx.actif) };
    if (!ctx || !ctx.actif) return res.json({ ...base, connecte: false, verifie: false });

    const r = await pool.query(
      'SELECT * FROM collaborateurs_stripe WHERE collaborateur_id = $1 AND gestionnaire_id = $2 AND env = $3',
      [collabId, gid, ctx.env]
    );
    const ligne = r.rows[0];
    if (!ligne) return res.json({ ...base, connecte: false, verifie: false });

    let compte;
    try {
      compte = await ctx.stripe.accounts.retrieve(ligne.stripe_account_id);
    } catch (e) {
      if (compteIntrouvable(e)) {
        await pool.query('DELETE FROM collaborateurs_stripe WHERE id = $1', [ligne.id]);
        return res.json({ ...base, connecte: false, verifie: false });
      }
      throw e;
    }

    const { chargesOk, payoutsOk, exigences, statut } = statutDepuisCompte(compte);
    const docsManquants = exigences.currently_due || [];
    await pool.query(
      `UPDATE collaborateurs_stripe
          SET charges_enabled = $1, payouts_enabled = $2, requirements = $3::jsonb, statut = $4, updated_at = NOW()
        WHERE id = $5`,
      [chargesOk, payoutsOk, JSON.stringify(exigences), statut, ligne.id]
    );

    res.json({
      ...base,
      connecte: true,
      verifie: chargesOk && payoutsOk && docsManquants.length === 0,
      stripe_account_id: ligne.stripe_account_id,
      account_type: ligne.account_type,
      statut,
      charges_enabled: chargesOk,
      payouts_enabled: payoutsOk,
      docs_manquants: docsManquants,
      details_requis: exigences.eventually_due || [],
      disabled_reason: exigences.disabled_reason || null,
    });
  } catch (e) {
    console.error('❌ GET collaborateur stripe/statut :', e.message);
    res.status(500).json({ message: 'Erreur lors de la lecture du statut Stripe' });
  }
});

// ─── POST connect ────────────────────────────────────────────────────────────
// Body : { retour } — URL de la page du site (le serveur ne garde que l'hôte identique).
router.post('/:gid/collaborateurs/:collabId/stripe/connect', authCollaborateur, async (req, res) => {
  const { gid } = req.params;
  const collabId = Number(req.params.collabId);
  try {
    const ctx = await chargerContexte(gid);
    if (!ctx || !ctx.actif) {
      return res.status(409).json({ message: "Les paiements ne sont pas encore activés par la boutique. Contactez le gestionnaire." });
    }
    const { cfg, env, p, stripe } = ctx;

    const collabRes = await pool.query(
      `SELECT id, email, nom_responsable, nom_boutique, statut
         FROM marketplace_collaborateurs WHERE id = $1 AND gestionnaire_id = $2`,
      [collabId, gid]
    );
    const collab = collabRes.rows[0];
    if (!collab) return res.status(404).json({ message: 'Collaborateur introuvable' });
    if (collab.statut !== 'actif') return res.status(403).json({ message: "Votre compte collaborateur n'est pas actif." });

    const typeCompte = TYPES_COMPTE.includes(cfg.account_type) ? cfg.account_type : 'express';
    if (typeCompte === 'standard' && String(p.connect_flow || '').includes('OAuth')) {
      return res.status(501).json({ message: "Le flux « Connect via OAuth » n'est pas encore disponible. Demandez au gestionnaire de choisir « Connect via API »." });
    }

    // Compte déjà lié ? On vérifie qu'il existe encore chez Stripe.
    const existant = await pool.query(
      'SELECT id, stripe_account_id FROM collaborateurs_stripe WHERE collaborateur_id = $1 AND gestionnaire_id = $2 AND env = $3',
      [collabId, gid, env]
    );
    let compteId = existant.rows[0] ? existant.rows[0].stripe_account_id : null;
    if (compteId) {
      try {
        await stripe.accounts.retrieve(compteId);
      } catch (e) {
        if (!compteIntrouvable(e)) throw e;
        await pool.query('DELETE FROM collaborateurs_stripe WHERE id = $1', [existant.rows[0].id]);
        compteId = null;
      }
    }

    // Création du compte selon la config du gestionnaire (même logique que e-Vend, clés du gestionnaire).
    if (!compteId) {
      const direct = String(p.processing_method || 'DIRECT CHARGES').toUpperCase().includes('DIRECT');
      const capabilities = direct
        ? { card_payments: { requested: true }, transfers: { requested: true } }
        : { transfers: { requested: true } };

      const delaiActif = p.delai_actif === true;
      const delaiJours = parseInt(p.delai_jours, 10) || 3;
      const payoutSettings = {
        debit_negative_balances: p.debit_negative !== false,
        schedule: { interval: delaiActif ? 'daily' : 'manual', ...(delaiActif && { delay_days: delaiJours }) },
      };

      const profil = {};
      if (collab.nom_boutique) profil.name = collab.nom_boutique;

      const params = {
        country: p.country_code || 'CA',
        email: collab.email,
        metadata: { gestionnaire_id: String(gid), collaborateur_id: String(collabId), plateforme: 'e-vend-studio' },
        ...(Object.keys(profil).length > 0 && { business_profile: profil }),
      };

      if (typeCompte === 'standard') {
        params.controller = {
          losses: { payments: 'stripe' },
          fees: { payer: 'account' },
          stripe_dashboard: { type: 'full' },
          requirement_collection: 'stripe',
        };
      } else if (typeCompte === 'express') {
        params.controller = {
          losses: { payments: 'application' },
          fees: { payer: 'application' },
          stripe_dashboard: { type: 'express' },
          requirement_collection: 'stripe',
        };
        params.capabilities = capabilities;
        params.settings = { payouts: payoutSettings };
        if (p.cross_border === true) params.tos_acceptance = { service_agreement: 'full' };
      } else {
        const payeurFrais = (!p.controller_fees_payer || p.controller_fees_payer === 'application_custom')
          ? 'application' : p.controller_fees_payer;
        params.controller = {
          losses: { payments: p.controller_losses || 'application' },
          fees: { payer: payeurFrais },
          stripe_dashboard: { type: p.controller_dashboard || 'none' },
          requirement_collection: p.controller_requirements || 'application',
        };
        params.business_type = 'individual';
        params.capabilities = capabilities;
        params.settings = { payouts: payoutSettings };
        params.tos_acceptance = {
          date: Math.floor(Date.now() / 1000),
          ip: req.ip || '127.0.0.1',
          service_agreement: p.full_service === false ? 'recipient' : 'full',
        };
      }

      // Clé d'idempotence : un double-clic (même minute) ne crée pas deux comptes Stripe.
      // Elle change chaque minute, pour qu'un compte supprimé chez Stripe puisse être recréé
      // (sinon Stripe renverrait pendant 24 h le même compte supprimé).
      const compte = await stripe.accounts.create(params, {
        idempotencyKey: `studio-${gid}-${collabId}-${env}-${Math.floor(Date.now() / 60000)}`,
      });
      compteId = compte.id;

      await pool.query(
        `INSERT INTO collaborateurs_stripe (collaborateur_id, gestionnaire_id, env, stripe_account_id, account_type, statut)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         ON CONFLICT (collaborateur_id, env)
         DO UPDATE SET stripe_account_id = EXCLUDED.stripe_account_id, account_type = EXCLUDED.account_type,
                       statut = 'pending', charges_enabled = FALSE, payouts_enabled = FALSE, updated_at = NOW()`,
        [collabId, gid, env, compteId, typeCompte]
      );
    }

    // Lien d'inscription Stripe (à ouvrir par le collaborateur)
    const retour = (req.body && req.body.retour) || '';
    const lien = await stripe.accountLinks.create({
      account: compteId,
      refresh_url: urlRetour(req, retour, 'refresh'),
      return_url: urlRetour(req, retour, 'success'),
      type: 'account_onboarding',
      collection_options: { fields: 'eventually_due' },
    });

    res.json({ success: true, onboarding_url: lien.url, account_type: typeCompte });
  } catch (e) {
    console.error('❌ POST collaborateur stripe/connect :', e.message);
    res.status(500).json({ message: 'Erreur lors de la connexion à Stripe. Réessayez ou contactez la boutique.' });
  }
});

// ─── POST deconnecter ────────────────────────────────────────────────────────
router.post('/:gid/collaborateurs/:collabId/stripe/deconnecter', authCollaborateur, async (req, res) => {
  const { gid } = req.params;
  const collabId = Number(req.params.collabId);
  try {
    const ctx = await chargerContexte(gid);
    const env = ctx ? ctx.env : null;
    if (env) {
      await pool.query(
        'DELETE FROM collaborateurs_stripe WHERE collaborateur_id = $1 AND gestionnaire_id = $2 AND env = $3',
        [collabId, gid, env]
      );
    }
    res.json({ success: true, message: 'Compte Stripe déconnecté de la boutique. Votre compte Stripe reste intact.' });
  } catch (e) {
    console.error('❌ POST collaborateur stripe/deconnecter :', e.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;