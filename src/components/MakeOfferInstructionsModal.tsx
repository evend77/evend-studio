// src/components/MakeOfferInstructionsModal.tsx
import React, { useState } from 'react';

interface Props {
  ouvert: boolean;
  onFermer: () => void;
}

const ETAPES = [
  {
    numero: 1,
    titre: 'Exécuter le SQL dans votre base de données',
    icone: '🗄️',
    couleur: '#8b5cf6',
    description: 'Créez la table des offres et ajoutez les colonnes nécessaires.',
    instructions: [
      'Ouvrez votre client PostgreSQL (pgAdmin, DBeaver, ou psql en terminal)',
      'Connectez-vous à votre base de données e-Vend',
      'Exécutez le bloc SQL ci-dessous pour créer la table <code>make_offers</code>',
      'Vérifiez que la commande retourne <strong>ALTER TABLE</strong> sans erreur',
    ],
    tip: '💡 Si votre table <code>annonces</code> s\'appelle différemment, ajustez le nom en conséquence.',
    code: `-- 1. Table principale des offres
CREATE TABLE IF NOT EXISTS make_offers (
  id              SERIAL PRIMARY KEY,
  annonce_id      VARCHAR(255) NOT NULL,
  vendeur_id      INTEGER REFERENCES vendeurs(id),
  acheteur_email  VARCHAR(255) NOT NULL,
  acheteur_nom    VARCHAR(255),
  montant         DECIMAL(10,2) NOT NULL,
  statut          VARCHAR(20) DEFAULT 'en_attente',
  message         TEXT,
  expires_at      TIMESTAMP,
  accepted_at     TIMESTAMP,
  refused_at      TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- 2. Colonnes dans la table annonces
ALTER TABLE annonces
  ADD COLUMN IF NOT EXISTS make_offer_enabled     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS make_offer_prix_min    DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS make_offer_auto_accept BOOLEAN DEFAULT FALSE;`,
    codeLangue: 'SQL',
    codeInstructions: 'Exécutez ce SQL dans votre base de données PostgreSQL :',
  },
  {
    numero: 2,
    titre: 'Créer le fichier de routes config_make_offer.js',
    icone: '🔧',
    couleur: '#0ea5e9',
    description: 'Ce fichier gère la configuration admin du widget (GET public + POST protégé).',
    instructions: [
      'Dans votre projet Express, ouvrez le dossier <code>routes/</code>',
      'Créez un nouveau fichier nommé <strong>config_make_offer.js</strong>',
      'Collez le code ci-dessous dans ce fichier',
      'Sauvegardez le fichier',
    ],
    tip: '💡 Ce fichier suit exactement le même pattern que <code>config_parution_futur.js</code> — vous pouvez vous y référer.',
    code: `// routes/config_make_offer.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const jwt     = require('jsonwebtoken');

const DEFAULT_CONFIG = {
  make_offer_actif:              true,
  auto_accept_global:            false,
  permettre_vendeur_auto_accept: true,
  permettre_vendeur_configurer:  true,
  duree_expiration_heures:       48,
  max_offres_par_produit:        10,
  offre_min_pourcentage:         30,
  email_vendeur_nouvelle_offre:  true,
  email_acheteur_confirmation:   true,
  email_acheteur_accepte:        true,
  email_acheteur_refuse:         true,
  couleur_fond:                  '#ffffff',
  couleur_texte:                 '#1a2332',
  couleur_bouton:                '#2d6a9f',
  couleur_bouton_texte:          '#ffffff',
  couleur_bordure:               '#e1e4e8',
  border_radius:                 10,
  texte_bouton:                  '💬 Faire une offre',
  texte_titre_modal:             '💬 Faire une offre au vendeur',
  texte_placeholder_montant:     'Ex : 45.00',
  texte_offre_envoyee:           '✅ Votre offre a été envoyée !',
  texte_offre_acceptee:          '🎉 Offre acceptée !',
  texte_offre_refusee:           '❌ Le vendeur a refusé votre offre.',
  texte_bouton_envoyer:          'Envoyer mon offre',
  texte_bouton_annuler:          'Annuler',
};

// GET PUBLIC — appelé par le widget Shopify
router.get('/make-offer', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=60');
  try {
    const result = await db.query(
      'SELECT config_make_offer FROM configuration_generale_admin WHERE id = 1 LIMIT 1'
    );
    const config = { ...DEFAULT_CONFIG, ...(result.rows[0]?.config_make_offer || {}) };
    res.json({ success: true, config });
  } catch (err) {
    res.json({ success: true, config: DEFAULT_CONFIG });
  }
});

// POST PROTÉGÉ — admin seulement
router.post('/make-offer', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Token manquant' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ success: false });
    const configComplete = { ...DEFAULT_CONFIG, ...req.body };
    await db.query(
      \`INSERT INTO configuration_generale_admin (id, config_make_offer)
       VALUES (1, $1::jsonb)
       ON CONFLICT (id) DO UPDATE SET config_make_offer = $1::jsonb, updated_at = NOW()\`,
      [JSON.stringify(configComplete)]
    );
    res.json({ success: true, message: '✅ Configuration sauvegardée', config: configComplete });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;`,
    codeLangue: 'JavaScript',
    codeInstructions: 'Créez le fichier routes/config_make_offer.js avec ce contenu :',
  },
  {
    numero: 3,
    titre: 'Ajouter la colonne config_make_offer à la BD',
    icone: '🗃️',
    couleur: '#10b981',
    description: 'Ajoutez la colonne JSONB dans votre table de configuration admin.',
    instructions: [
      'Retournez dans votre client PostgreSQL',
      'Exécutez la commande SQL ci-dessous',
      'La colonne <code>config_make_offer</code> sera ajoutée à <code>configuration_generale_admin</code>',
    ],
    tip: '💡 Cette colonne stocke toute la configuration du widget en JSON, comme <code>config_parution_futur</code>.',
    code: `ALTER TABLE configuration_generale_admin
  ADD COLUMN IF NOT EXISTS config_make_offer JSONB;`,
    codeLangue: 'SQL',
    codeInstructions: 'Ajoutez cette colonne à votre table de config existante :',
  },
  {
    numero: 4,
    titre: 'Enregistrer les routes dans server.js',
    icone: '🚀',
    couleur: '#f59e0b',
    description: 'Connectez les deux nouveaux fichiers de routes à votre serveur Express.',
    instructions: [
      'Ouvrez votre fichier <strong>server.js</strong>',
      'Ajoutez les deux lignes d\'import en haut du fichier (avec les autres requires)',
      'Puis enregistrez les deux routes (avec les autres app.use)',
      'Redémarrez votre serveur Node.js',
    ],
    tip: '💡 Placez ces lignes exactement comme les autres routes de configuration pour garder une cohérence.',
    code: `// ── En haut de server.js (avec les autres imports) ──────────────
const configMakeOfferRoutes = require('./routes/config_make_offer');
const makeOfferRoutes       = require('./routes/make_offer');

// ── Dans server.js (avec les autres app.use) ─────────────────────
app.use('/api/admin/configuration', configMakeOfferRoutes);
app.use('/api/make-offer',          makeOfferRoutes);`,
    codeLangue: 'JavaScript',
    codeInstructions: 'Ajoutez ces lignes dans server.js :',
  },
  {
    numero: 5,
    titre: 'Ajouter le script dans le thème Shopify',
    icone: '🎨',
    couleur: '#ec4899',
    description: 'Injectez le widget Make Offer dans votre fichier theme.liquid Shopify.',
    instructions: [
      'Dans votre admin Shopify, allez dans <strong>Boutique en ligne → Thèmes</strong>',
      'Cliquez sur <strong>Actions → Modifier le code</strong>',
      'Ouvrez le fichier <strong>layout/theme.liquid</strong>',
      'Trouvez la section où sont déjà vos scripts e-Vend (widget enchères et parution)',
      'Ajoutez la ligne du script Make Offer juste après les scripts existants, avant <code></body></code>',
    ],
    tip: '💡 Le widget réutilise automatiquement <code>window.evendProductId</code> et <code>window.evendCustomer</code> déjà définis.',
    code: `<!-- Widget Make Offer e-Vend — à ajouter après vos scripts existants -->
<script src="https://evend-multivendeur-api.onrender.com/public/evend-make-offer-widget.js" defer></script>`,
    codeLangue: 'Liquid',
    codeInstructions: 'Ajoutez cette ligne dans theme.liquid, après vos scripts e-Vend existants :',
  },
  {
    numero: 6,
    titre: 'Vérifier que tout fonctionne',
    icone: '✅',
    couleur: '#16a34a',
    description: 'Testez l\'intégration complète avant de mettre en ligne.',
    instructions: [
      'Visitez : <code>https://evend-multivendeur-api.onrender.com/api/admin/configuration/make-offer</code> — doit retourner un JSON avec la config',
      'Dans votre admin e-Vend, allez dans <strong>Plateforme → Configuration Make Offer</strong> et sauvegardez',
      'Sur Shopify, activez Make Offer pour une annonce de test dans le dashboard vendeur',
      'Sur la page produit Shopify, vérifiez que l\'encadré "Faire une offre" apparaît',
      'Soumettez une offre de test — vérifiez que le vendeur reçoit un courriel',
    ],
    tip: '✅ Si le bouton n\'apparaît pas : vérifiez que le produit a Make Offer activé ET que l\'admin a activé la fonctionnalité globalement.',
    code: null,
    codeLangue: null,
    codeInstructions: null,
  },
];

// ── Composant principal ────────────────────────────────────────────────────
export function MakeOfferInstructionsModal({ ouvert, onFermer }: Props) {
  const [etapeActive, setEtapeActive] = useState(1);
  const [codesCopies, setCodesCopies] = useState<Record<number, boolean>>({});

  if (!ouvert) return null;

  const etape = ETAPES.find(e => e.numero === etapeActive)!;

  const copierCode = (code: string, numero: number) => {
    navigator.clipboard.writeText(code).then(() => {
      setCodesCopies(prev => ({ ...prev, [numero]: true }));
      setTimeout(() => setCodesCopies(prev => ({ ...prev, [numero]: false })), 2000);
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '760px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

        {/* ── Header ── */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #0f4c2a, #166534)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: '0 0 2px 0' }}>📋 Guide d'installation — Make Offer</h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Suivez ces étapes pour activer le widget "Faire une offre" sur Shopify</p>
          </div>
          <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* ── Navigation étapes ── */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e1e4e8', display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0, backgroundColor: '#f8fafc' }}>
          {ETAPES.map(e => (
            <button key={e.numero} onClick={() => setEtapeActive(e.numero)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700',
              backgroundColor: etapeActive === e.numero ? e.couleur : '#e2e8f0',
              color: etapeActive === e.numero ? 'white' : '#6b7280',
              transition: 'all 0.15s',
            }}>
              <span>{e.icone}</span>
              <span>{e.numero}. {e.titre.split(' ').slice(0, 3).join(' ')}…</span>
            </button>
          ))}
        </div>

        {/* ── Contenu étape ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: etape.couleur + '18', border: `2px solid ${etape.couleur}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
              {etape.icone}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: etape.couleur, backgroundColor: etape.couleur + '18', padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Étape {etape.numero} / {ETAPES.length}</span>
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1a2332', margin: '0 0 4px 0' }}>{etape.titre}</h3>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{etape.description}</p>
            </div>
          </div>

          {/* Instructions */}
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px 20px', marginBottom: '16px', border: '1px solid #e1e4e8' }}>
            <ol style={{ margin: 0, paddingLeft: '18px' }}>
              {etape.instructions.map((inst, i) => (
                <li key={i} style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, marginBottom: i < etape.instructions.length - 1 ? '6px' : 0 }}
                  dangerouslySetInnerHTML={{ __html: inst }} />
              ))}
            </ol>
          </div>

          {/* Tip */}
          {etape.tip && (
            <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#0369a1', margin: 0 }} dangerouslySetInnerHTML={{ __html: etape.tip }} />
            </div>
          )}

          {/* Code */}
          {etape.code && (
            <div style={{ marginBottom: '8px' }}>
              {etape.codeInstructions && (
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: '0 0 8px 0' }}>{etape.codeInstructions}</p>
              )}
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e293b', borderRadius: '8px 8px 0 0', padding: '8px 14px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{etape.codeLangue}</span>
                  <button
                    onClick={() => copierCode(etape.code!, etape.numero)}
                    style={{ backgroundColor: codesCopies[etape.numero] ? '#16a34a' : '#334155', border: 'none', color: codesCopies[etape.numero] ? '#86efac' : '#94a3b8', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: '4px 10px', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}
                  >
                    {codesCopies[etape.numero] ? '✅ Copié !' : '📋 Copier'}
                  </button>
                </div>
                <pre style={{ backgroundColor: '#0f172a', borderRadius: '0 0 8px 8px', padding: '16px', margin: 0, overflowX: 'auto', fontSize: '12px', color: '#e2e8f0', lineHeight: 1.6, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {etape.code}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer navigation ── */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e1e4e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, backgroundColor: '#f8fafc' }}>
          <button
            onClick={() => setEtapeActive(prev => Math.max(1, prev - 1))}
            disabled={etapeActive === 1}
            style={{ padding: '10px 20px', border: '1px solid #e1e4e8', borderRadius: '8px', backgroundColor: 'white', color: etapeActive === 1 ? '#d1d5db' : '#374151', fontSize: '13px', fontWeight: '600', cursor: etapeActive === 1 ? 'not-allowed' : 'pointer' }}
          >
            ← Précédent
          </button>

          <div style={{ display: 'flex', gap: '6px' }}>
            {ETAPES.map(e => (
              <div key={e.numero} onClick={() => setEtapeActive(e.numero)} style={{
                width: etapeActive === e.numero ? '24px' : '8px', height: '8px',
                borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s',
                backgroundColor: etapeActive === e.numero ? etape.couleur : '#d1d5db',
              }} />
            ))}
          </div>

          {etapeActive < ETAPES.length ? (
            <button
              onClick={() => setEtapeActive(prev => Math.min(ETAPES.length, prev + 1))}
              style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', backgroundColor: etape.couleur, color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              Suivant →
            </button>
          ) : (
            <button
              onClick={onFermer}
              style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', backgroundColor: '#16a34a', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              ✅ Terminé !
            </button>
          )}
        </div>
      </div>
    </div>
  );
}