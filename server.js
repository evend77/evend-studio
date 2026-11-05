// CHEMIN : server.js  (à la racine du projet)
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
const cookieParser = require('cookie-parser');
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

// ✨ STORE EFFECTS - Effets visuels (neige, confettis, curseurs, etc.)
const storeEffectsRoutes = require('./routes/store-effects');

const app  = express();
const port = process.env.PORT || 5000;

// 🔍 SEO : Google doit pouvoir LIRE l'API pour afficher les pages React,
// mais ne doit jamais INDEXER les réponses JSON.
app.use('/api', (req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});

// 🔍 SEO : toujours servir le site sur e-vendstudio.ca (sans www) pour éviter les doublons.
// (trust proxy : nécessaire derrière nginx pour que req.hostname soit le vrai domaine)
app.set('trust proxy', 1);
app.use((req, res, next) => {
  if (req.method === 'GET' && req.hostname.startsWith('www.')) {
    return res.redirect(301, 'https://e-vendstudio.ca' + req.originalUrl);
  }
  next();
});

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

// ✅ Webhook Stripe des gestionnaires (template multivendeur) — body brut obligatoire (avant express.json)
app.post('/api/webhooks/gestionnaire-stripe/:gestionnaireId/:type', express.raw({ type: 'application/json' }));
app.use('/api/webhooks/gestionnaire-stripe', require('./routes/webhooks_gestionnaire_stripe'));

// ✅ Webhook Dynadot (NOUVEAU)
app.post('/api/webhooks/dynadot', express.raw({ type: 'application/json' }));

// ✅ Webhook Amazon SES (via SNS) — rebonds permanents et plaintes : désactive
// automatiquement l'abonné de l'infolettre. Protégé par un code secret dans l'URL
// (Amazon ne peut pas envoyer de jeton de connexion).
app.use('/api/webhooks/ses', require('./routes/webhooksSes'));

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
app.use(cookieParser());
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

// ✨ STORE EFFECTS - Effets visuels (neige, confettis, curseurs, etc.)
app.use('/api/store-effects', storeEffectsRoutes);

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
// ✅ Config Stripe Connect du gestionnaire (template multivendeur)
app.use('/api/gestionnaire/stripe', require('./routes/gestionnaire_stripe'));
app.use('/api', modelesModule);
app.use('/api/admin/config/page-404', configPage404Module);
app.use('/api/admin/gestionnaires', adminGestionnairesStatutModule);
app.use('/api/admin/config/2fa', admin2faModule);
app.use('/api/admin/config/page-suspendu', configSiteSuspenduModule);
app.use('/api/admin/config/page-maintenance', configSiteMaintenanceModule);
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
app.use('/api/chat-acheteur-collab/:gestionnaireId', require('./routes/chat_acheteur_collab'));
app.use('/api/collab/:gestionnaireId',               require('./routes/collab_dashboard'));
app.use('/api/acheteur/:gestionnaireId',             require('./routes/acheteur_dashboard'));

app.use('/api/politiquesPlateforme', require('./routes/politiquesPlateforme'));
app.use('/api/pagesPlateforme',      require('./routes/pagesPlateforme'));
app.use('/api/seoPlateforme',        require('./routes/seoPlateforme'));
app.use('/sitemap.xml',              require('./routes/sitemap'));
// 🖼️ Gestionnaire de photos admin (Logos / Divers / Audio) — Cloudflare R2
app.use('/api/images',               require('./routes/images'));
// 📋 Menus du site (principal, pied de page) — public + gestion admin
app.use('/api/menus',                require('./routes/menus'));
// 🆕 Infolettre : inscription publique + désabonnement (/api/infolettre), gestion des abonnés
// et campagnes marketing (/api/admin/infolettre, /api/admin/marketing) + réponse manuelle (/api/admin/repondre-client)
// — Messagerie > E-mail marketing / E-mail manuel
app.use('/api/infolettre',           require('./routes/infolettre'));
app.use('/api/admin',                require('./routes/adminInfolettre'));
app.use('/api/admin',                require('./routes/adminMarketing'));
app.use('/api/admin',                require('./routes/adminRepondreClient'));
app.use('/api/studio/sites', studioSites);
app.use('/api/produits/gestionnaire', require('./routes/catalogue_public')); // public : produits actifs des collaborateurs (avant l'ancien routeur)
app.use('/api/produits/gestionnaire', require('./routes/produits_gestionnaire'));
app.use('/api/marketplace', require('./routes/marketplace-auth'));
app.use('/api/marketplace', require('./routes/marketplace-panier'));
app.use('/api/marketplace', require('./routes/marketplace-stripe'));
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
// 🔒 CADDY — Point de vérification pour le certificat SSL "on-demand"
// Caddy appelle cette route avant d'émettre un certificat pour un domaine.
// On autorise seulement : e-vendstudio.ca, ses sous-domaines de vendeurs,
// et les domaines personnalisés déjà enregistrés dans la table `domaines`.
// Sans ça, n'importe qui pourrait pointer un domaine random vers le VPS
// et forcer l'émission de certificats à répétition (abus / rate limit).
// =====================================================================
app.get('/caddy/ask', async (req, res) => {
  const domain = (req.query.domain || '').toLowerCase();

  if (domain === 'e-vendstudio.ca' || domain === 'www.e-vendstudio.ca') {
    return res.sendStatus(200);
  }
  if (/^[a-z0-9-]+\.e-vendstudio\.ca$/.test(domain)) {
    return res.sendStatus(200);
  }

  try {
    const result = await pool.query(
      `SELECT 1 FROM domaines WHERE domaine = $1 OR domaine = $2 LIMIT 1`,
      [domain, domain.replace(/^www\./, '')]
    );
    if (result.rows.length > 0) return res.sendStatus(200);
  } catch (err) {
    console.error('Erreur vérification caddy/ask:', err.message);
  }

  res.sendStatus(403);
});

// =====================================================================
// 🌐 FRONTEND (PRODUCTION)
// =====================================================================

if (process.env.NODE_ENV === 'production') {
  // index:false → '/' passe par notre route ci-dessous (SEO + contenu pour les robots)
  app.use(express.static(path.join(__dirname, 'build'), {
    index: false,
    setHeaders: (res, filePath) => {
      // Les fichiers de /static/ ont un nom unique à chaque build → cache 1 an sans risque
      if (/[\\/]build[\\/]static[\\/]/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));

  // ── 🔍 SEO / SSR LÉGER ─────────────────────────────────────────────────
  // Le site est une app React : le HTML de départ est vide. Pour Google et les
  // autres robots, on injecte le vrai contenu dans <div id="root"> (BOT_REGEX).
  // Les humains reçoivent le site normal, seules les balises <title>/<meta> sont à jour.
  const fsSeo = require('fs');
  const SITE_URL = 'https://e-vendstudio.ca';
  const BOT_REGEX = /google-inspectiontool|storebot-google|googlebot|googleother|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|gptbot|ccbot|claudebot|applebot|semrushbot|ahrefsbot|perplexitybot|oai-searchbot|chatgpt-user|google-extended|bytespider|deepseekbot/i;

  const escapeHtml = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Texte brut à partir d'un contenu HTML
  const nettoyerTexteBrut = (html) => String(html || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();

  // Contenu visible pour les robots uniquement
  const injecterDansRoot = (html, contenu, estRobot) =>
    estRobot ? html.replace('<div id="root"></div>', '<div id="root">' + contenu + '</div>') : html;

  const poserMeta = (html, attr, nom, valeur) => {
    const tag = `<meta ${attr}="${nom}" content="${escapeHtml(valeur)}">`;
    const re = new RegExp(`<meta[^>]*${attr}=["']${nom}["'][^>]*>`, 'i');
    return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `  ${tag}\n</head>`);
  };
  const poserCanonical = (html, url) => {
    const tag = `<link rel="canonical" href="${escapeHtml(url)}">`;
    const re = /<link[^>]*rel=["']canonical["'][^>]*>/i;
    return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `  ${tag}\n</head>`);
  };
  const poserTitre = (html, titre) => {
    const tag = `<title>${escapeHtml(titre)}</title>`;
    return /<title>[\s\S]*?<\/title>/i.test(html)
      ? html.replace(/<title>[\s\S]*?<\/title>/i, tag)
      : html.replace('</head>', `  ${tag}\n</head>`);
  };

  // Applique titre / description / url / image à toutes les balises concernées
  function appliquerSeo(html, { titre, desc, url, image }) {
    if (titre) {
      html = poserTitre(html, titre);
      html = poserMeta(html, 'property', 'og:title', titre);
      html = poserMeta(html, 'name', 'twitter:title', titre);
    }
    if (desc) {
      html = poserMeta(html, 'name', 'description', desc);
      html = poserMeta(html, 'property', 'og:description', desc);
      html = poserMeta(html, 'name', 'twitter:description', desc);
    }
    if (url) {
      html = poserCanonical(html, url);
      html = poserMeta(html, 'property', 'og:url', url);
    }
    if (image) {
      html = poserMeta(html, 'property', 'og:image', image);
      html = poserMeta(html, 'name', 'twitter:image', image);
    }
    return html;
  }

  const coupe = (s, n) => {
    const t = String(s || '').trim();
    return t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
  };

  // SEO de l'accueil (réglages de l'admin), cache 60 s
  let seoCache = { at: 0, data: null };
  async function lireSeoAccueil() {
    if (Date.now() - seoCache.at < 60000) return seoCache.data;
    try {
      const r = await pool.query(`SELECT titre_accueil, meta_description, og_image_url FROM seo_plateforme WHERE id = 1`);
      seoCache = { at: Date.now(), data: r.rows[0] || null };
    } catch (e) {
      seoCache = { at: Date.now(), data: null };
    }
    return seoCache.data;
  }

  const TITRE_ACCUEIL_DEFAUT = 'e-Vend Studio | Crée ton site web et ta boutique en ligne';
  const DESC_ACCUEIL_DEFAUT  = "Crée ton site web, ta boutique en ligne ou ton site vitrine sans programmer. e-Vend Studio, la plateforme québécoise pour entrepreneurs d'ici.";

  app.get('*', async (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/') || req.path.startsWith('/uploads/')) {
      return next();
    }

    try {
      let html = fsSeo.readFileSync(path.join(__dirname, 'build', 'index.html'), 'utf8');
      const estRobot = BOT_REGEX.test(req.headers['user-agent'] || '');
      // Code HTTP : 404 quand la page demandée n'existe pas (évite les "soft 404")
      let statutHttp = 200;
      const chemin = req.path.length > 1 ? req.path.replace(/\/+$/, '') : req.path;

      // ── Accueil ─────────────────────────────────────────────────────────
      if (chemin === '/' || chemin === '/index.html') {
        try {
          const seo = (await lireSeoAccueil()) || {};
          const titre = seo.titre_accueil || TITRE_ACCUEIL_DEFAUT;
          const desc  = seo.meta_description || DESC_ACCUEIL_DEFAUT;
          html = appliquerSeo(html, { titre, desc, url: SITE_URL, image: seo.og_image_url });

          if (estRobot) {
            // Les liens du menu sont dessinés par React → on les donne aussi aux robots
            const docs = await pool.query(`SELECT slug, titre FROM pages_plateforme WHERE actif = true ORDER BY titre ASC`);
            let pols = { rows: [] };
            try { pols = await pool.query(`SELECT slug, titre FROM politiques_plateforme WHERE actif = true ORDER BY id`); } catch (e) {}
            html = injecterDansRoot(html, `
              <h1>${escapeHtml(titre)}</h1>
              <p>${escapeHtml(desc)}</p>
              <nav>
                <ul>
                  <li><a href="/blog">Blog</a></li>
                  <li><a href="/faq">FAQ</a></li>
                  <li><a href="/documents">Documents</a></li>
                </ul>
                <ul>${docs.rows.map((d) => `<li><a href="/documents/${escapeHtml(d.slug)}">${escapeHtml(d.titre)}</a></li>`).join('')}</ul>
                <ul>${pols.rows.map((p) => `<li><a href="/politiques/${escapeHtml(p.slug)}">${escapeHtml(p.titre)}</a></li>`).join('')}</ul>
              </nav>`, true);
          }
        } catch (e) {
          console.warn('⚠️ SSR accueil :', e.message);
        }
      }

      // ── Liste des documents : /documents ────────────────────────────────
      else if (chemin === '/documents') {
        try {
          const r = await pool.query(`SELECT slug, titre, meta_description FROM pages_plateforme WHERE actif = true ORDER BY titre ASC`);
          html = appliquerSeo(html, {
            titre: 'Documents et guides | e-Vend Studio',
            desc: 'Guides et documentation d\'e-Vend Studio : à propos, fonctionnement de la plateforme et informations utiles.',
            url: SITE_URL + '/documents',
          });
          html = injecterDansRoot(html, `
            <h1>Documents et guides</h1>
            <ul>${r.rows.map((d) => `<li><a href="/documents/${escapeHtml(d.slug)}">${escapeHtml(d.titre)}</a>${d.meta_description ? ' — ' + escapeHtml(d.meta_description) : ''}</li>`).join('')}</ul>`, estRobot);
        } catch (e) { console.warn('⚠️ SSR documents :', e.message); }
      }

      // ── Un document : /documents/:slug ──────────────────────────────────
      else if (/^\/documents\/[^/]+$/.test(chemin)) {
        try {
          const slug = decodeURIComponent(chemin.split('/')[2]);
          const r = await pool.query(`SELECT slug, titre, contenu, meta_description FROM pages_plateforme WHERE slug = $1 AND actif = true`, [slug]);
          if (r.rows.length === 0) {
            statutHttp = 404;
          } else {
            const d = r.rows[0];
            const texte = nettoyerTexteBrut(d.contenu);
            html = appliquerSeo(html, {
              titre: `${d.titre} | e-Vend Studio`,
              desc: coupe(d.meta_description || texte, 160),
              url: `${SITE_URL}/documents/${d.slug}`,
            });
            html = injecterDansRoot(html, `<h1>${escapeHtml(d.titre)}</h1><div>${escapeHtml(texte)}</div>`, estRobot);
          }
        } catch (e) { console.warn('⚠️ SSR document :', e.message); }
      }

      // ── Une politique : /politiques/:slug ───────────────────────────────
      else if (/^\/politiques\/[^/]+$/.test(chemin)) {
        try {
          const slug = decodeURIComponent(chemin.split('/')[2]);
          const r = await pool.query(`SELECT slug, titre, contenu FROM politiques_plateforme WHERE slug = $1 AND actif = true`, [slug]);
          if (r.rows.length === 0) {
            statutHttp = 404;
          } else {
            const p = r.rows[0];
            const texte = nettoyerTexteBrut(p.contenu);
            // La description Google ne doit pas commencer par l'encadré « Avis important »
            // (identique sur toutes les politiques) : on le retire avant de couper.
            const texteSansAvis = texte.replace(/Avis important\s*:[\s\S]*?professionnel qualifié\.?/i, '').trim();
            html = appliquerSeo(html, {
              titre: `${p.titre} | e-Vend Studio`,
              desc: coupe(texteSansAvis || texte, 160),
              url: `${SITE_URL}/politiques/${p.slug}`,
            });
            html = injecterDansRoot(html, `<h1>${escapeHtml(p.titre)}</h1><div>${escapeHtml(texte)}</div>`, estRobot);
          }
        } catch (e) { console.warn('⚠️ SSR politique :', e.message); }
      }

      // ── FAQ : /faq (questions/réponses lisibles par les robots + schéma FAQPage) ──
      else if (chemin === '/faq') {
        try {
          const r = await pool.query(`SELECT question, reponse, categorie FROM faq_plateforme WHERE active = true ORDER BY ordre ASC, id ASC`);
          html = appliquerSeo(html, {
            titre: 'Foire aux questions (FAQ) | e-Vend Studio',
            desc: 'Réponses aux questions fréquentes sur e-Vend Studio : création de site, abonnements, paiements, domaines et support.',
            url: SITE_URL + '/faq',
          });
          const qr = r.rows.map((q) => ({ question: q.question, reponse: nettoyerTexteBrut(q.reponse), categorie: q.categorie }));
          if (qr.length > 0) {
            const schema = {
              '@context': 'https://schema.org', '@type': 'FAQPage',
              mainEntity: qr.map((q) => ({ '@type': 'Question', name: q.question, acceptedAnswer: { '@type': 'Answer', text: q.reponse } })),
            };
            html = html.replace('</head>', `  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>\n</head>`);
          }
          html = injecterDansRoot(html, `
            <h1>Foire aux questions</h1>
            ${qr.map((q) => `<h2>${escapeHtml(q.question)}</h2><p>${escapeHtml(q.reponse)}</p>`).join('')}`, estRobot);
        } catch (e) { console.warn('⚠️ SSR FAQ :', e.message); }
      }

      // ── Liste du blog : /blog ───────────────────────────────────────────
      else if (chemin === '/blog') {
        try {
          const r = await pool.query(
            `SELECT titre, slug, extrait FROM blog_admin WHERE statut = 'publie' AND visible = true
              ORDER BY date_publication DESC NULLS LAST, created_at DESC LIMIT 100`
          );
          html = appliquerSeo(html, {
            titre: 'Blog | e-Vend Studio',
            desc: 'Conseils et actualités pour créer et faire croître ton site web et ta boutique en ligne avec e-Vend Studio.',
            url: SITE_URL + '/blog',
          });
          html = injecterDansRoot(html, `
            <h1>Blog e-Vend Studio</h1>
            <ul>${r.rows.map((a) => `<li><a href="/blog/${escapeHtml(a.slug)}">${escapeHtml(a.titre)}</a>${a.extrait ? ' — ' + escapeHtml(a.extrait) : ''}</li>`).join('')}</ul>`, estRobot);
        } catch (e) { console.warn('⚠️ SSR blog :', e.message); }
      }

      // ── Un article : /blog/:slug ────────────────────────────────────────
      else if (/^\/blog\/[^/]+$/.test(chemin)) {
        try {
          const slug = decodeURIComponent(chemin.split('/')[2]);
          const r = await pool.query(
            `SELECT a.titre, a.slug, a.extrait, a.contenu, a.image_couverture, a.auteur,
                    a.date_publication, a.updated_at, c.nom AS categorie_nom
               FROM blog_admin a LEFT JOIN blog_categories c ON c.id = a.categorie_id
              WHERE a.slug = $1 AND a.statut = 'publie' AND a.visible = true`, [slug]);
          if (r.rows.length === 0) {
            statutHttp = 404;
          } else {
            const a = r.rows[0];
            const texte = nettoyerTexteBrut(a.contenu);
            const desc = coupe(a.extrait || texte, 160);
            const url = `${SITE_URL}/blog/${a.slug}`;
            const image = a.image_couverture ? encodeURI(a.image_couverture) : '';
            html = appliquerSeo(html, { titre: `${a.titre} | Blog e-Vend Studio`, desc, url, image });

            const schema = {
              '@context': 'https://schema.org', '@type': 'BlogPosting',
              headline: a.titre, description: desc, image: image ? [image] : [],
              author: { '@type': 'Organization', name: a.auteur || 'e-Vend Studio' },
              datePublished: a.date_publication, dateModified: a.updated_at || a.date_publication,
              mainEntityOfPage: url,
            };
            html = html.replace('</head>', `  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>\n</head>`);
            html = injecterDansRoot(html, `
              <h1>${escapeHtml(a.titre)}</h1>
              ${a.categorie_nom ? `<p>Catégorie : ${escapeHtml(a.categorie_nom)}</p>` : ''}
              ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(a.titre)}">` : ''}
              <div>${escapeHtml(texte)}</div>`, estRobot);
          }
        } catch (e) { console.warn('⚠️ SSR article :', e.message); }
      }

      // Style minimal (robots seulement) pour que le rendu de Google soit lisible
      if (estRobot) {
        html = html.replace('</head>', '  <style>body{background:#060d1f;color:#fff;font-family:system-ui,sans-serif;margin:0;padding:24px;line-height:1.6}a{color:#fbbf24;text-decoration:none}h1{font-size:24px;margin:0 0 12px}img{max-width:280px;border-radius:8px;display:block;margin:12px 0}</style>\n</head>');
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(statutHttp).send(html);
    } catch (err) {
      console.error('⚠️ SSR error :', err.message);
      res.sendFile(path.join(__dirname, 'build', 'index.html'));
    }
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
  console.log(`🔒 Caddy ask:    GET  /caddy/ask?domain=...`);
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
  console.log(`✨ Store Effects: GET  /api/store-effects/config/:gestionnaireId`);
  console.log(`✨ Store Effects: PUT  /api/store-effects/config/:gestionnaireId`);
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