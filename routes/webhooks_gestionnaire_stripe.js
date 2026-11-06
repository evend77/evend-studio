// CHEMIN : routes/webhooks_gestionnaire_stripe.js
// Réception des webhooks Stripe du GESTIONNAIRE (template multivendeur).
// Monté sur : /api/webhooks/gestionnaire-stripe
//   POST /:gestionnaireId/principal   → événements de "Votre compte"
//   POST /:gestionnaireId/connect     → événements des "Comptes connectés" (collaborateurs)
//
// ⚠️ Le body doit arriver BRUT (Buffer) : server.js doit mettre express.raw()
//    sur ce chemin AVANT express.json().

const express = require('express');
const Stripe = require('stripe');
const pool = require('../db');
const { dechiffrer } = require('../src/utils/chiffrement');
const paiement = require('../services/studio_paiement');

const router = express.Router();

function lire(valeurChiffree) {
  if (!valeurChiffree) return null;
  try { return dechiffrer(valeurChiffree) || null; } catch (e) { return null; }
}

// ─── Traitement d'un événement déjà vérifié ───────────────────────────────────
async function traiter(event, gid, env, type) {
  const obj = event.data && event.data.object;

  switch (event.type) {
    // Un collaborateur a avancé (ou reculé) dans l'activation de son compte Stripe
    case 'account.updated': {
      if (type !== 'connect' || !obj || !obj.id) return;
      const chargesOk = !!obj.charges_enabled;
      const payoutsOk = !!obj.payouts_enabled;
      const exigences = obj.requirements || {};
      const statut = chargesOk && payoutsOk ? 'active' : (exigences.disabled_reason ? 'restricted' : 'pending');
      await pool.query(
        `UPDATE collaborateurs_stripe
            SET charges_enabled = $1, payouts_enabled = $2, requirements = $3::jsonb,
                statut = $4, updated_at = NOW()
          WHERE stripe_account_id = $5 AND gestionnaire_id = $6 AND env = $7`,
        [chargesOk, payoutsOk, JSON.stringify(exigences), statut, obj.id, gid, env]
      );
      return;
    }

    // Le collaborateur a révoqué l'accès à ta plateforme depuis son Stripe
    case 'account.application.deauthorized': {
      if (type !== 'connect' || !event.account) return;
      await pool.query(
        `UPDATE collaborateurs_stripe
            SET statut = 'deconnecte', charges_enabled = FALSE, payouts_enabled = FALSE, updated_at = NOW()
          WHERE stripe_account_id = $1 AND gestionnaire_id = $2 AND env = $3`,
        [event.account, gid, env]
      );
      return;
    }

    // Commande payée (Direct charges → webhook "connect" ; Destination charges → webhook "principal")
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const r = await paiement.confirmerPaiement(gid, obj);
      if (r.paye) console.log(`✅ [gestionnaire-stripe] commande ${r.commande.numero_commande} payée`);
      return;
    }
    // Session expirée ou paiement différé échoué : le stock réservé est remis en vente
    case 'checkout.session.expired':
    case 'checkout.session.async_payment_failed': {
      const r = await paiement.sessionExpiree(gid, obj);
      if (r.libere) console.log(`↩︎ [gestionnaire-stripe] commande libérée (session ${obj.id})`);
      return;
    }

    // Autres paiements, remboursements, litiges, versements : reçus et enregistrés (idempotence).
    default:
      console.log(`ℹ️ [gestionnaire-stripe] gestionnaire=${gid} env=${env} ${type} ← ${event.type} (${event.id})`);
  }
}

// ─── POST /:gestionnaireId/:type ──────────────────────────────────────────────
router.post('/:gestionnaireId/:type', async (req, res) => {
  const gid = parseInt(req.params.gestionnaireId, 10);
  const type = req.params.type;

  if (!Number.isInteger(gid) || !['principal', 'connect'].includes(type)) {
    return res.status(404).json({ error: 'Webhook inconnu' });
  }
  if (!Buffer.isBuffer(req.body)) {
    console.error('❌ [gestionnaire-stripe] body non brut — express.raw() manquant sur ce chemin dans server.js');
    return res.status(400).json({ error: 'Corps de requête invalide' });
  }
  const signature = req.headers['stripe-signature'];
  if (!signature) return res.status(400).json({ error: 'Signature manquante' });

  try {
    const cfgR = await pool.query('SELECT * FROM gestionnaire_stripe_config WHERE gestionnaire_id = $1', [gid]);
    const cfg = cfgR.rows[0];
    const whR = await pool.query(
      'SELECT env, signing_secret FROM gestionnaire_stripe_webhooks WHERE gestionnaire_id = $1 AND type = $2',
      [gid, type]
    );
    if (!cfg || !whR.rows.length) return res.status(404).json({ error: 'Webhook inconnu' });

    // Test ou production ? On ne le sait qu'après avoir vérifié la signature : on essaie chaque secret enregistré.
    let event = null;
    let env = null;
    for (const w of whR.rows) {
      const secret = lire(w.signing_secret);
      const cle = lire(w.env === 'dev' ? cfg.dev_secret_key : cfg.prod_secret_key);
      if (!secret || !cle) continue;
      try {
        event = Stripe(cle).webhooks.constructEvent(req.body, signature, secret);
        env = w.env;
        break;
      } catch (e) { /* mauvais secret, on essaie le suivant */ }
    }
    if (!event) return res.status(400).json({ error: 'Signature invalide' });

    // Cohérence : un événement "live" ne peut venir que du secret de production, et inversement
    if ((env === 'prod') !== !!event.livemode) {
      return res.status(400).json({ error: 'Environnement incohérent' });
    }

    // Idempotence : déjà traité → on répond 200 sans rien refaire
    const nouveau = await pool.query(
      `INSERT INTO gestionnaire_stripe_evenements (event_id, gestionnaire_id, type)
       VALUES ($1, $2, $3) ON CONFLICT (event_id) DO NOTHING RETURNING event_id`,
      [event.id, gid, event.type]
    );
    if (!nouveau.rows.length) return res.json({ received: true, duplicate: true });

    try {
      await traiter(event, gid, env, type);
    } catch (e) {
      // Échec : on libère l'événement pour que Stripe puisse le renvoyer
      await pool.query('DELETE FROM gestionnaire_stripe_evenements WHERE event_id = $1', [event.id]).catch(() => {});
      console.error(`❌ [gestionnaire-stripe] traitement ${event.type} (${event.id}) :`, e.message);
      return res.status(500).json({ error: 'Erreur de traitement' });
    }

    res.json({ received: true });
  } catch (e) {
    console.error('❌ [gestionnaire-stripe] erreur :', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;