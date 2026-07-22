// =====================================================================
// e-Vend Studio API — server.js
// Port: 5000
// =====================================================================

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const pool    = require('./db');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const studioContactRoutes = require('./routes/studio_contact');
const studioPage404       = require('./routes/studio_page404');
const studioPolitiques    = require('./routes/studio_politiques');
const studioPages         = require('./routes/studio_pages');
const studioSeoSite       = require('./routes/studio_seo_site');
const studioCookiesSite   = require('./routes/studio_cookies_site');
const studioPhotosVendeur = require('./routes/studio_photos_gestionnaire');
const studioMonCompte     = require('./routes/studio_mon_compte');
const studioCollaborateurs  = require('./routes/studio_collaborateurs');
const studioBadges        = require('./routes/studio_badges');
const guidesAddons        = require('./routes/guides_addons');
const blogsCollaborateur    = require('./routes/blogs_collaborateur');
const faqsCollaborateur     = require('./routes/faqs_collaborateur');
const studioSites = require('./routes/studio_sites');
const templatesPrix       = require('./routes/templates_prix');
const templatesPrixPublic = require('./routes/templates_prix_public');
const unsplashRoutes = require('./routes/unsplash');

// ── IMPORTS e-Vend Studio (nouveaux modules) ─────────────────────────
const webhooksStudioStripe    = require('./routes/webhooks_studio_stripe');
const adminDomainesRoutes     = require('./routes/admin_domaines');
const cronDomaineModule       = require('./routes/cron_domaine');
const abonnementsStudioRoutes = require('./routes/abonnements_studio');
const cronAbonnementsModule   = require('./routes/cron_abonnements_studio');
const cronVerificationEmailModule = require('./routes/cron_verification_email');
const modelesModule           = require('./routes/modelescouriels');
const configPage404Module         = require('./routes/admin_config_404');
const adminGestionnairesStatutModule = require('./routes/admin_gestionnaires_statut');
const admin2faModule = require('./routes/admin_2fa');
const configSiteSuspenduModule    = require('./routes/admin_config_site_suspendu');
const configSiteMaintenanceModule = require('./routes/admin_config_site_maintenance');
const cronReservationsModule  = require('./routes/cron_reservations');
const cronPaiementsModule     = require('./routes/cron_paiements_en_attente');
const sponsorsPhotosRoutes = require('./routes/sponsorsphotos');
const sponsorPubsRoutes = require('./routes/sponsor_pubs');

const sponsorsRoutes = require('./routes/sponsors');

const app  = express();
const port = process.env.PORT || 5000;

// ── MIDDLEWARE ────────────────────────────────────────────────────────

// ✅ IMPORTANT : Webhook Stripe DOIT être avant express.json()
// Sinon, Stripe ne peut pas lire le body raw
app.post('/api/dynadot/stripe-webhook', express.raw({ type: 'application/json' }));

// ✅ Webhook Studio Stripe — abonnements e-Vend Studio
app.use('/api/webhooks-studio', webhooksStudioStripe);

// ✅ Webhook Sponsors Stripe — recharges du portefeuille publicitaire
app.use('/api/webhooks-sponsors', require('./routes/webhooks_sponsors_stripe'));

// ✅ Webhook paiements École/Cours — comptes Connect des gestionnaires (réservations/abonnements)
app.post('/api/webhooks/paiements-connect', express.raw({ type: 'application/json' }));
app.use('/api/webhooks/paiements-connect', require('./routes/webhooks_paiements_stripe'));

// ✅ Webhook Dynadot (NOUVEAU)
app.post('/api/webhooks/dynadot', express.raw({ type: 'application/json' }));

// 🔒 Protection par mot de passe (temporaire, le temps du développement)
// Les webhooks Stripe/Dynadot ci-dessus restent exclus (Stripe n'envoie pas d'auth)
const AUTH_USER = process.env.SITE_AUTH_USER;
const AUTH_PASS = process.env.SITE_AUTH_PASS;

app.use((req, res, next) => {
  // Pas de protection configurée → on laisse passer (utile en dev local)
  if (!AUTH_USER || !AUTH_PASS) return next();

  // Ne jamais bloquer les webhooks externes
  if (
    req.path === '/api/dynadot/stripe-webhook' ||
    req.path === '/api/webhooks/dynadot' ||
    req.path === '/api/webhooks/paiements-connect'
  ) {
    return next();
  }

  // ✅ Ne pas confondre les tokens JWT (Bearer) avec du Basic Auth.
  // Les appels API authentifiés portent "Authorization: Bearer <jwt>" —
  // ce n'est pas la même chose que les identifiants Basic Auth du site.
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.set('WWW-Authenticate', 'Basic realm="Acces restreint"');
    return res.status(401).send('Authentification requise');
  }
  const [, credentials] = authHeader.split(' ');
  const [user, pass] = Buffer.from(credentials, 'base64').toString().split(':');
  if (user === AUTH_USER && pass === AUTH_PASS) {
    return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Acces restreint"');
  return res.status(401).send('Identifiants invalides');
});

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5001',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ BLOG PLATEFORME
app.use('/api/blogPlateforme', require('./routes/blogPlateforme'));
app.use('/api/faqPlateforme',  require('./routes/faqPlateforme'));
app.use('/api/contactPlateforme', require('./routes/contactPlateforme'));

// ✅ ADMIN CONFIGURATION
app.use('/api/admin/configuration', require('./routes/configuration_admin'));
app.use('/api/admin/templates-prix', templatesPrix);
app.use('/api/templates', templatesPrixPublic);

// ✅ WEBHOOK DYNADOT (route)
app.use('/api/webhooks/dynadot', require('./routes/webhooks-dynadot'));

// ✅ ADD-ONS (NOUVEAU) 
app.use('/api/addons', require('./routes/addons'));

// ── MIDDLEWARE AUTH ───────────────────────────────────────────────────
const { authenticateToken } = require('./middleware/auth');

// =====================================================================
// 🔐 AUTHENTIFICATION
// =====================================================================

// =====================================================================
// 🔐 AUTHENTIFICATION
// =====================================================================
// ℹ️ La route legacy POST /api/auth/inscription-studio a été retirée le
// 20 juillet 2026 : aucune référence trouvée dans le frontend (grep sur
// tout le repo fourni), le flow réellement utilisé étant POST /api/gestionnaires
// (routes/gestionnaires.js, appelé par InscriptionGestionnaire.tsx). Si un appel
// externe la visait encore, restaurer depuis l'historique git.

app.use('/api/auth', require('./routes/authStudio'));

// =====================================================================
// 🛒 BOUTIQUE STUDIO (mono-produit)
// =====================================================================
app.use('/api/boutique-studio', require('./routes/boutique-studio'));

// =====================================================================
// 👥 ACHETEURS STUDIO
// =====================================================================
app.use('/api/acheteurs-studio', require('./routes/acheteurs-studio'));

// =====================================================================
// 💝 DONS — CAGNOTTEPRO
// =====================================================================
app.use('/api/dons', require('./routes/dons'));

// =====================================================================
// 🎭 SIÈGES SPECTACLE
// =====================================================================
app.use('/api/sieges', require('./routes/sieges'));

// =====================================================================
// 📅 RÉSERVATIONS STUDIO
// =====================================================================
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/abonnements', require('./routes/abonnements'));

// =====================================================================
// 🌐 DYNADOT (ACHAT DE DOMAINES)
// =====================================================================
app.use('/api/dynadot', require('./routes/dynadot'));

// =====================================================================
// 🌐 ADMIN DOMAINES & ABONNEMENTS STUDIO
// =====================================================================
app.use('/api/admin/domaines',     adminDomainesRoutes);
app.use('/api/cron-domaine',       cronDomaineModule);
app.use('/api/abonnements-studio', abonnementsStudioRoutes);
app.use('/api/cron-abonnements',   cronAbonnementsModule);
app.use('/api/cron-verification-email', cronVerificationEmailModule);
app.use('/api', modelesModule);
app.use('/api/admin/config/page-404', configPage404Module);
app.use('/api/admin/gestionnaires', adminGestionnairesStatutModule);
app.use('/api/admin/config/2fa', admin2faModule);
app.use('/api/admin/config/page-suspendu', configSiteSuspenduModule);
app.use('/api/admin/config/page-maintenance', configSiteMaintenanceModule);
app.use('/api', configPagesPubliquesModule);
app.use('/api/cron-reservations',  cronReservationsModule);
app.use('/api/cron-paiements',     cronPaiementsModule);
app.use('/api/admin/stripe', require('./routes/admin_stripe'));
app.use('/api/paiements', require('./routes/paiements'));

app.use('/api/branding-public', require('./routes/branding_public'));
app.use('/api/blacklist-contact', require('./routes/blacklist_contact'));
app.use('/api/sponsors/photos', sponsorsPhotosRoutes);
app.use('/api/sponsors', sponsorsRoutes);
app.use('/api/sponsors', sponsorPubsRoutes);
app.use('/api/sponsors/portefeuille', require('./routes/sponsors_portefeuille'));

// Add-on Analytique — tracking + stats isolées par gestionnaire
app.use('/api/analytique', require('./routes/analytique'));

// Add-on Chatbot (sans IA) — public (widget) + gestionnaire (config)
app.use('/api/chatbot-public', require('./routes/chatbot_public'));
app.use('/api/chatbot', require('./routes/chatbot_gestionnaire'));

// =====================================================================
// 🎨 SITES STUDIO (config du site du vendeur)
// =====================================================================

// GET — Config du site par vendeur ID (dashboard ET preview public)
app.get('/api/studio/sites/:gestionnaireId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM sites WHERE gestionnaire_id = $1`,
      [req.params.gestionnaireId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Site non trouvé.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /api/studio/sites/:vendeurId', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET — Preview HTML du site
app.get('/api/studio/public/preview/:gestionnaireId', async (req, res) => {
  try {
    res.redirect(`/site-preview?vendeurId=${req.params.gestionnaireId}`);
  } catch (err) {
    res.status(500).send('<h1>Erreur serveur</h1>');
  }
});

// GET — Config du site par SLUG (rendu public — pas d'auth)
app.get('/api/studio/public/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, v.nom as vendeur_nom, v.email as vendeur_email
       FROM sites s
       JOIN gestionnaires v ON v.id = s.gestionnaire_id
       WHERE s.slug = $1 AND s.publie = true`,
      [req.params.slug]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Site non trouvé ou non publié.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /api/studio/public/:slug', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT — Sauvegarder la config du site
app.put('/api/studio/sites/:gestionnaireId/config', authenticateToken, async (req, res) => {
  const { config, sous_type, template_id, slug, domaine_custom, publie } = req.body;

  if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.gestionnaireId)) {
    return res.status(403).json({ message: 'Accès non autorisé.' });
  }

  // 🔒 Blocage réservé aux comptes JAMAIS vérifiés (première inscription) —
  // un changement d'email sur un compte déjà actif ne bloque PAS la publication
  // ici; l'application se fait plutôt via la suspension automatique après 48h
  // (voir routes/cron_verification_email.js).
  if (publie === true && req.user.role !== 'admin') {
    const check = await pool.query(
      `SELECT premiere_verification_faite FROM gestionnaires WHERE id = $1`,
      [req.params.gestionnaireId]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Gestionnaire non trouvé.' });
    }
    if (!check.rows[0].premiere_verification_faite) {
      return res.status(403).json({
        message: 'Vérifiez votre adresse courriel avant de mettre votre site en ligne.',
        code: 'EMAIL_NON_VERIFIE',
      });
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO sites (gestionnaire_id, config, sous_type, template_id, slug, domaine_custom, publie, updated_at)
       VALUES (
         $7,
         COALESCE($1::jsonb, '{}'),
         $2, $3, $4, $5,
         COALESCE($6, false),
         NOW()
       )
       ON CONFLICT (gestionnaire_id) DO UPDATE SET
         config         = CASE WHEN $1::jsonb IS NOT NULL THEN COALESCE(sites.config, '{}'::jsonb) || $1::jsonb ELSE sites.config END,
         sous_type      = COALESCE($2, sites.sous_type),
         template_id    = COALESCE($3, sites.template_id),
         slug           = COALESCE($4, sites.slug),
         domaine_custom = COALESCE($5, sites.domaine_custom),
         publie         = COALESCE($6, sites.publie),
         updated_at     = NOW()
       RETURNING *`,
      [
        config ? JSON.stringify(config) : null,
        sous_type || null,
        template_id || null,
        slug || null,
        domaine_custom || null,
        publie !== undefined ? publie : null,
        req.params.gestionnaireId,
      ]
    );

    res.json({ success: true, site: result.rows[0] });
  } catch (err) {
    console.error('PUT /api/studio/sites/:vendeurId/config', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});


// DELETE — Réinitialiser la config du site (repart de zéro pour ce vendeur)
app.delete('/api/studio/sites/:gestionnaireId/reset', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.gestionnaireId)) {
    return res.status(403).json({ message: 'Accès non autorisé.' });
  }
  try {
    const result = await pool.query(
      `UPDATE sites SET
        config      = '{}',
        template_id = NULL,
        sous_type   = NULL,
        publie      = false,
        updated_at  = NOW()
       WHERE gestionnaire_id = $1
       RETURNING id, gestionnaire_id, template_id, publie`,
      [req.params.gestionnaireId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Site non trouvé.' });
    }
    res.json({ success: true, message: 'Config réinitialisée avec succès.', site: result.rows[0] });
  } catch (err) {
    console.error('DELETE /api/studio/sites/:vendeurId/reset', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT — Publier / dépublier le site
app.put('/api/studio/sites/:gestionnaireId/publier', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.gestionnaireId)) {
    return res.status(403).json({ message: 'Accès non autorisé.' });
  }
  try {
    const { publie } = req.body;

    // 🔒 Bloquer la première mise en ligne tant que le compte n'a JAMAIS été vérifié.
    // Un changement d'email sur un compte déjà actif ne bloque pas ici — la suspension
    // automatique après 48h (cron_verification_email.js) s'en charge si besoin.
    if (publie === true && req.user.role !== 'admin') {
      const check = await pool.query(
        `SELECT premiere_verification_faite FROM gestionnaires WHERE id = $1`,
        [req.params.gestionnaireId]
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ message: 'Gestionnaire non trouvé.' });
      }
      if (!check.rows[0].premiere_verification_faite) {
        return res.status(403).json({
          message: 'Vérifiez votre adresse courriel avant de mettre votre site en ligne.',
          code: 'EMAIL_NON_VERIFIE',
        });
      }
    }

    const result = await pool.query(
      `UPDATE sites SET publie = $1, updated_at = NOW()
       WHERE gestionnaire_id = $2 RETURNING publie`,
      [publie, req.params.gestionnaireId]
    );
    res.json({ success: true, publie: result.rows[0]?.publie });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// =====================================================================
// 📬 CONTACT TEMPLATES STUDIO
// =====================================================================
// POST /api/studio/contact — visiteur envoie un message au propriétaire du site
app.use('/api/studio', studioContactRoutes);

// =====================================================================
// 📧 MODÈLES COURRIEL VENDEUR (studio)
// =====================================================================

// GET — charger les modèles courriel
app.get('/api/studio/modeles-courriel/:gestionnaireId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT config FROM sites WHERE gestionnaire_id = $1`,
      [req.params.gestionnaireId]
    );
    const config = result.rows[0]?.config || {};
    res.json({ modeles: config.modeles_courriel || {} });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT — sauvegarder les modèles courriel
app.put('/api/studio/modeles-courriel/:gestionnaireId', authenticateToken, async (req, res) => {
  if (req.user.id !== parseInt(req.params.gestionnaireId) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès non autorisé.' });
  }
  try {
    await pool.query(
      `UPDATE sites SET config = jsonb_set(
        COALESCE(config, '{}'),
        '{modeles_courriel}',
        $1::jsonb
      ), updated_at = NOW()
      WHERE gestionnaire_id = $2`,
      [JSON.stringify(req.body), req.params.gestionnaireId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// =====================================================================
// 🔍 PAGE 404 VENDEUR STUDIO
// =====================================================================
// GET  /api/studio/page-404/:vendeurId/public  — lecture publique (site du vendeur)
// GET  /api/studio/page-404/:vendeurId         — lecture dashboard (auth)
// PUT  /api/studio/page-404/:vendeurId         — sauvegarder (auth)
// POST /api/studio/page-404/:vendeurId/image   — upload image S3 (auth)
app.use('/api/studio/pages/:gestionnaireId', studioPages);
app.use('/api/studio/politiques/:gestionnaireId', studioPolitiques);
app.use('/api/studio/page-404/:gestionnaireId', studioPage404);

// =====================================================================
// 🔍 SEO SITE VENDEUR STUDIO
// =====================================================================
// GET  /api/studio/seo-site/:vendeurId/public  — lecture publique
// GET  /api/studio/seo-site/:vendeurId         — lecture dashboard (auth)
// POST /api/studio/seo-site/:vendeurId         — sauvegarder + upload S3 (auth)
app.use('/api/studio/seo-site/:gestionnaireId', studioSeoSite);

// =====================================================================
// 🍪 COOKIES SITE VENDEUR STUDIO
// =====================================================================
// GET /api/studio/cookies-site/:vendeurId/public  — config publique
// GET /api/studio/cookies-site/:vendeurId         — lecture dashboard (auth)
// PUT /api/studio/cookies-site/:vendeurId         — sauvegarder (auth)
app.use('/api/studio/cookies-site/:gestionnaireId', studioCookiesSite);

// =====================================================================
// 🖼️ PHOTOS SITE VENDEUR STUDIO (max 25 par site, AWS S3)
// =====================================================================
// GET    /api/studio/photos-vendeur/:vendeurId          — liste
// POST   /api/studio/photos-vendeur/:vendeurId/upload   — uploader
// DELETE /api/studio/photos-vendeur/:vendeurId/:id      — supprimer
app.use('/api/studio/photos/:gestionnaireId', studioPhotosVendeur);

// =====================================================================
// 👤 MON COMPTE VENDEUR STUDIO
// =====================================================================
// GET    /api/studio/mon-compte/:vendeurId              — profil complet
// PUT    /api/studio/mon-compte/:vendeurId              — sauvegarder
// PUT    /api/studio/mon-compte/:vendeurId/mot-de-passe — changer mdp
// POST   /api/studio/mon-compte/:vendeurId/logo         — upload logo S3
// POST   /api/studio/mon-compte/:vendeurId/banniere     — upload bannière S3
// DELETE /api/studio/mon-compte/:vendeurId/logo         — supprimer logo
// DELETE /api/studio/mon-compte/:vendeurId/banniere     — supprimer bannière
app.use('/api/studio/mon-compte/:gestionnaireId', studioMonCompte);

// =====================================================================
// 👥 COLLABORATEURS STUDIO (marketplace multivendeur)
// =====================================================================
app.use('/api/studio/collaborateurs/:gestionnaireId', studioCollaborateurs);

// =====================================================================
// 🏅 BADGES VENDEUR STUDIO
// =====================================================================
app.use('/api/studio/badges/:gestionnaireId', studioBadges);

// =====================================================================
// 📖 GUIDES ADD-ONS
// =====================================================================
app.use('/api/guides-addons', guidesAddons);

// =====================================================================
// 📝 BLOGS SOUS-VENDEURS
// =====================================================================
app.use('/api/studio/blogs-collab/:gestionnaireId', blogsCollaborateur);
app.use('/api/studio/faqs-collab/:gestionnaireId', faqsCollaborateur);
app.use('/api/chat-collab/:gestionnaireId',          require('./routes/chat_collab'));
app.use('/api/chat-admin-collab/:gestionnaireId',    require('./routes/chat_admin_collab'));

app.use('/api/politiquesPlateforme', require('./routes/politiquesPlateforme'));
app.use('/api/pagesPlateforme',      require('./routes/pagesPlateforme'));
app.use('/api/studio/sites', studioSites);
app.use('/api/produits/gestionnaire', require('./routes/produits_gestionnaire'));
app.use('/api/marketplace', require('./routes/marketplace-auth'));
app.use('/api/marketplace', require('./routes/marketplace-panier'));
app.use('/api/admin/domaines', require('./routes/admin_domaines'));
app.use('/api/unsplash', unsplashRoutes);
app.use('/api/sponsors/photos', sponsorsPhotosRoutes);


// =====================================================================
// 📦 CRÉER / MODIFIER ANNONCE
// =====================================================================
app.use('/api/creer-annonce', require('./routes/creer_annonce'));


// =====================================================================
// 📜 POLITIQUES VENDEUR STUDIO
// =====================================================================
// GET  /api/studio/politiques/:vendeurId/public        — lecture publique
// GET  /api/studio/politiques/:vendeurId/public/:slug  — une politique publique
// GET  /api/studio/politiques/:vendeurId               — lecture dashboard (auth)
// PUT  /api/studio/politiques/:vendeurId/:slug         — sauvegarder (auth)


// =====================================================================
// 📄 PAGES VENDEUR STUDIO (guides, FAQ, documents)
// =====================================================================
// GET    /api/studio/pages/:vendeurId/public        — lecture publique
// GET    /api/studio/pages/:vendeurId               — lecture dashboard (auth)
// POST   /api/studio/pages/:vendeurId               — créer (auth)
// PATCH  /api/studio/pages/:vendeurId/:slug         — modifier (auth)
// DELETE /api/studio/pages/:vendeurId/:slug         — supprimer (auth)


// POST — envoyer un email de test (studio)
app.post('/api/studio/test-email', authenticateToken, async (req, res) => {
  const { type, destinataire, template } = req.body;
  if (!destinataire || !template?.html) {
    return res.status(400).json({ message: 'Destinataire et template requis.' });
  }
  try {
    const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
    const ses = new SESClient({
      region: process.env.AWS_REGION || 'us-east-2',
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });

    let html  = template.html;
    let sujet = template.sujet || 'Test e-Vend Studio';

    const vars = {
      '{$nomClient}':            'Marie Dupont (TEST)',
      '{$emailClient}':          destinataire,
      '{$objetReserve}':         'Cours Salsa débutant (TEST)',
      '{$detailsReservation}':   `<p><strong>📅 Date :</strong> Vendredi 14 juin 2026 à 19h30</p>
      <p style="margin-top:8px"><strong>📍 Salle :</strong> Salle A</p>
      <p style="margin-top:8px"><strong>👤 Professeur :</strong> Isabelle Morin</p>
      <p style="margin-top:8px"><strong>🎯 Niveau :</strong> Débutant</p>`,
      '{$dateReservation}':      'Vendredi 14 juin 2026 à 19h30',
      '{$nbPersonnes}':          '1',
      '{$salle}':                'Salle A',
      '{$professeur}':           'Isabelle Morin',
      '{$niveau}':               'Débutant',
      '{$idReservation}':        '9999',
      '{$lienAnnulation}':       '#test-lien-annulation',
      '{$nomSite}':              'Mon Site Studio',
      '{$couleur}':              '#c9a96e',
      '{$notesSupplementaires}': 'Ceci est un envoi de test.',
    };
    for (const [cle, val] of Object.entries(vars)) {
      html  = html.split(cle).join(val);
      sujet = sujet.split(cle).join(val);
    }

    await ses.send(new SendEmailCommand({
      Destination: { ToAddresses: [destinataire] },
      Message: {
        Subject: { Data: `[TEST] ${sujet}`, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' } }
      },
      Source: process.env.FROM_EMAIL || 'contact@e-vend.ca',
    }));

    res.json({ success: true, message: `Email test envoyé à ${destinataire}` });
  } catch (err) {
    console.error('test-email:', err.message);
    res.status(500).json({ message: 'Erreur envoi email: ' + err.message });
  }
});

// =====================================================================
// 👤 GESTIONNAIRES
// =====================================================================

// GET — Stats du gestionnaire
app.get('/api/gestionnaires/:id/stats', authenticateToken, async (req, res) => {
  try {
    const gestionnaireId = req.params.id;
    const [sites, reservations, dons] = await Promise.all([
      pool.query('SELECT id, publie, template_id FROM sites WHERE gestionnaire_id = $1', [gestionnaireId]),
      pool.query(`SELECT COUNT(*) as total,
        COUNT(*) FILTER (WHERE statut = 'confirmee') as confirmees,
        COUNT(*) FILTER (WHERE statut = 'en_attente') as en_attente
        FROM reservations WHERE gestionnaire_id = $1`, [gestionnaireId]),
      pool.query(`SELECT COALESCE(SUM(montant),0) as total_dons,
        COUNT(*) as nb_dons
        FROM dons WHERE gestionnaire_id = $1 AND statut = 'complete'`, [gestionnaireId]),
    ]);
    res.json({
      revenus:    { mois: 0, total: parseFloat(dons.rows[0]?.total_dons || 0), croissance: 0 },
      commandes:  { total: parseInt(reservations.rows[0]?.total || 0), enAttente: parseInt(reservations.rows[0]?.en_attente || 0), croissance: 0 },
      sites:      { total: sites.rows.length, publies: sites.rows.filter(s => s.publie).length },
      dons:       { total: parseFloat(dons.rows[0]?.total_dons || 0), nb: parseInt(dons.rows[0]?.nb_dons || 0) },
      graphiques: { ventes30j: [] },
    });
  } catch (err) {
    console.error('GET stats vendeur:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET — Profil du gestionnaire connecté
app.get('/api/gestionnaires/moi', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.id, v.email, v.nom, v.plan, v.statut, v.created_at, v.email_verifie, v.premiere_verification_faite, v.email_verification_expire, v.two_factor_enabled,
              s.id as site_id, s.slug, s.sous_type, s.publie, s.template_id
       FROM gestionnaires v
       LEFT JOIN sites s ON s.gestionnaire_id = v.id
       WHERE v.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Gestionnaire non trouvé.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// =====================================================================
// 👑 ADMIN — Gestion des gestionnaires (liste enrichie, notes, statut,
// mot de passe, F2A, impersonation) — voir routes/admin_gestionnaires.js
// =====================================================================
app.use('/api/admin/gestionnaires', require('./routes/admin_gestionnaires'));

// =====================================================================
// 👤 GESTIONNAIRES — GET /:id, options, plan, branding, vérificateur
// (monté APRÈS /moi et /stats pour éviter les conflits de routing)
// =====================================================================
app.use('/api/gestionnaires', require('./routes/gestionnaires'));
app.use('/api/gestionnaires', require('./routes/stripe_gestionnaire'));
app.use('/api/gestionnaires/addon-pub-sponsor', require('./routes/gestionnaire_pubs'));
app.use('/api/admin/sponsors', require('./routes/admin_plans_sponsors'));
app.use('/api/admin/monetisation-pub', require('./routes/admin_monetisation_sponsors'));
app.use('/api/admin/categories-pub', require('./routes/admin_categories_pub'));
app.use('/api/admin/moderation-config', require('./routes/admin_moderation_config'));

// =====================================================================
// 📦 CRÉER / MODIFIER ANNONCE
// =====================================================================
app.use('/api/creer-annonce', require('./routes/creer_annonce'));

// =====================================================================
// 📊 STATS ADMINISTRATEUR
// =====================================================================

app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Accès admin requis.' });
  try {
    const [totalVendeurs, sitesPublies, vendeursActifs, vendeursAttente] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM gestionnaires'),
      pool.query('SELECT COUNT(*) FROM sites WHERE publie = true'),
      pool.query("SELECT COUNT(*) FROM gestionnaires WHERE statut = 'actif'"),
      pool.query("SELECT COUNT(*) FROM gestionnaires WHERE statut = 'en_attente'"),
    ]);
    res.json({
      total_gestionnaires:   parseInt(totalVendeurs.rows[0].count),
      sites_publies:    parseInt(sitesPublies.rows[0].count),
      gestionnaires_actifs:  parseInt(vendeursActifs.rows[0].count),
      gestionnaires_attente: parseInt(vendeursAttente.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// =====================================================================
// 🧪 TEST BD
// =====================================================================

app.get('/api/test', async (req, res) => {
  try {
    const r = await pool.query('SELECT NOW() as time, current_database() as db');
    res.json({ status: 'OK', db: r.rows[0].db, time: r.rows[0].time, version: 'e-Vend Studio 1.0' });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', error: err.message });
  }
});

// =====================================================================
// 🌐 FRONTEND (PRODUCTION)
// =====================================================================

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.send('🚀 e-Vend Studio API — Port ' + port));
}

// =====================================================================
// ⏰ CRONS e-Vend Studio
// =====================================================================
cronDomaineModule.demarrer();
cronAbonnementsModule.demarrer();
cronVerificationEmailModule.demarrer();
cronReservationsModule.demarrer();
cronPaiementsModule.demarrer();

// =====================================================================
// 🚀 DÉMARRAGE
// =====================================================================

app.listen(port, () => {
  console.log('\n🚀 ' + '='.repeat(50));
  console.log('🚀   e-Vend Studio API — Port ' + port + ' (proxy depuis React)');
  console.log('🚀 ' + '='.repeat(50));
  console.log(`🔐 Auth:         POST /api/auth/login-studio`);
  console.log(`🎨 Config site:  PUT  /api/studio/sites/:id/config`);
  console.log(`🌐 Site public:  GET  /api/studio/public/:slug`);
  console.log(`👤 Mon profil:   GET  /api/gestionnaires/moi`);
  console.log(`📊 Stats:        GET  /api/gestionnaires/:id/stats`);
  console.log(`⚙️  Options:      GET  /api/gestionnaires/:id/options`);
  console.log(`⚙️  Options:      PUT  /api/gestionnaires/:id/options`);
  console.log(`📋 Plan:         PUT  /api/gestionnaires/:id/plan`);
  console.log(`🔞 Vér. âge:     GET  /api/gestionnaires/:id/verificateur-age`);
  console.log(`🔞 Vér. âge:     PUT  /api/gestionnaires/:id/verificateur-age`);
  console.log(`📦 Annonces:     POST /api/creer-annonce`);
  console.log(`📅 Réservations: GET  /api/reservations/vendeur`);
  console.log(`🎭 Sièges:       GET  /api/sieges/public/:siteId`);
  console.log(`💝 Dons:         GET  /api/dons/vendeur`);
  console.log(`👑 Admin:        GET  /api/admin/gestionnaires`);
  console.log(`🧪 Test BD:      GET  /api/test`);
  console.log(`🔗 Dynadot:      POST /api/dynadot/check-availability`);
  console.log(`💳 Dynadot:      POST /api/dynadot/create-checkout`);
  console.log(`✅ Dynadot:      GET  /api/dynadot/verify-payment`);
  console.log(`🔗 Webhook:      POST /api/webhooks/dynadot`);
  console.log(`💳 Webhook Stripe: POST /api/dynadot/stripe-webhook`);
  console.log(`💳 Webhook Studio: POST /api/webhooks-studio`);
  console.log(`🌐 Admin domaines: GET  /api/admin/domaines`);
  console.log(`📦 Abonnements:    GET  /api/abonnements-studio/mon-abonnement`);
  console.log(`🧩 Add-ons:      GET  /api/addons/admin/addons`);
  console.log(`🧩 Add-ons:      GET  /api/addons/gestionnaire/addons`);
  console.log(`🧩 Add-ons:      POST /api/addons/admin/addons`);
  console.log(`🧩 Add-ons:      PUT  /api/addons/admin/addons/:id`);
  console.log(`🧩 Add-ons:      POST /api/addons/admin/addons/:id/toggle`);
  console.log(`📬 Contact:      POST /api/studio/contact  (formulaires templates)`);
  console.log(`🔍 Page 404:     GET  /api/studio/page-404/:vendeurId/public`);
  console.log(`🔍 Page 404:     PUT  /api/studio/page-404/:vendeurId`);
  console.log(`📜 Politiques:   GET  /api/studio/politiques/:vendeurId`);
  console.log(`📜 Politiques:   PUT  /api/studio/politiques/:vendeurId/:slug`);
  console.log(`📄 Pages:        GET  /api/studio/pages/:vendeurId`);
  console.log(`📄 Pages:        POST /api/studio/pages/:vendeurId`);
  console.log(`🔍 SEO Site:     GET  /api/studio/seo-site/:vendeurId`);
  console.log(`🔍 SEO Site:     POST /api/studio/seo-site/:vendeurId`);
  console.log(`🍪 Cookies Site: GET  /api/studio/cookies-site/:vendeurId`);
  console.log(`🍪 Cookies Site: PUT  /api/studio/cookies-site/:vendeurId`);
  console.log(`🖼️  Photos Site:  GET  /api/studio/photos-vendeur/:vendeurId`);
  console.log(`🖼️  Photos Site:  POST /api/studio/photos-vendeur/:vendeurId/upload`);
  console.log(`👤 Mon Compte:   GET  /api/studio/mon-compte/:vendeurId`);
  console.log(`👤 Mon Compte:   PUT  /api/studio/mon-compte/:vendeurId`);
  console.log(`👥 Collaborateurs:GET  /api/studio/collaborateurs/:gestionnaireId`);
  console.log(`👥 Collaborateurs:POST /api/studio/collaborateurs/:gestionnaireId`);
  console.log('🚀 ' + '='.repeat(50) + '\n');
});