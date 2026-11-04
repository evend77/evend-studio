// routes/adminMarketing.js
// Envoi de campagnes courriel en lot (infolettre / marketing), indépendant
// de la route de réponse manuelle 1-à-1 (/api/admin/repondre-client).
//
// Monté dans server.js :  app.use('/api/admin', require('./routes/adminMarketing'));
//
// Envoi via Amazon SES (SDK @aws-sdk/client-ses déjà utilisé par Studio) :
// aucune nouvelle dépendance — voir utils/courrielMime.js.

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { genererToken } = require('../utils/tokenDesabonnement');
const { verifierTypeFichier } = require('../utils/verifierTypeFichier');
const { envoyerCourriel, separerAdresse } = require('../utils/courrielMime');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { attendreTables } = require('../utils/tablesInfolettre');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// 🔒 SÉCURITÉ : ces routes envoient des courriels en lot et exposent l'historique
// des campagnes — réservées aux admins connectés. Limité au chemin /marketing :
// ce routeur est monté sur /api/admin, qui contient aussi d'autres routes.
router.use('/marketing', authenticateToken, isAdmin, attendreTables);

// ── Client R2 — aperçus d'images/PDF de l'historique ──
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.R2_BUCKET_ADMIN; // admin-media.e-vend.ca
const urlR2 = cle => `https://admin-media.e-vend.ca/${cle}`;

// ── Expéditeur : même ADRESSE d'envoi que le reste de Studio (FROM_EMAIL),
// avec un nom d'affichage propre aux campagnes marketing.
const ADRESSE_ENVOI = separerAdresse(process.env.FROM_EMAIL || 'contact@e-vend.ca').adresse;
const EXPEDITEUR = process.env.MARKETING_FROM || `"e-Vend Studio / Marketing" <${ADRESSE_ENVOI}>`;

// Délai entre chaque envoi individuel (ms) — protège ton "Max Send Rate" SES.
// Ex: 250ms ≈ 4 emails/seconde. Ajuste selon ton quota réel (console SES).
const DELAI_ENTRE_ENVOIS_MS = parseInt(process.env.MARKETING_DELAI_MS || '250', 10);

function attendre(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
const echapper = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Remplace {{img:nom}} par des <img cid:...> et retourne les pièces jointes
// "inline" correspondantes (même convention que la page Marketing).
function preparerContenu(messageBrut, images) {
  const attachementsInline = [];
  const html = String(messageBrut)
    .split('\n').join('<br>')
    .replace(/\{\{img:([^}]+)\}\}/g, (_m, nom) => {
      const img = images.find(i => i.originalname === nom);
      if (!img) return '';
      const cid = `img-${attachementsInline.length}-${Date.now()}@e-vend-studio`;
      attachementsInline.push({ filename: img.originalname, content: img.buffer, contentType: img.mimetype, cid });
      return `<br><img src="cid:${cid}" style="max-width:100%;border-radius:8px;margin:8px 0;"><br>`;
    });
  return { html, attachementsInline };
}

// ─── POST /api/admin/marketing/envoyer ──────────────────────────────────────
router.post('/marketing/envoyer', upload.fields([{ name: 'images' }, { name: 'documents' }]), async (req, res) => {
  const { sujet, message, mode, destinatairesManuel } = req.body;

  if (!sujet || !message) {
    return res.status(400).json({ error: 'Sujet et message sont requis' });
  }

  try {
    let destinataires;
    let ignores = 0; // adresses tapées à la main mais désabonnées/désactivées
    if (mode === 'manuel') {
      destinataires = String(destinatairesManuel || '')
        .split(/[\n,;]/).map(e => e.trim().toLowerCase()).filter(Boolean);
      // 🔒 LCAP : une adresse désabonnée (ou désactivée après un rebond) ne reçoit
      // JAMAIS de marketing, même si on la tape à la main dans « Liste précise ».
      if (destinataires.length > 0) {
        const { rows: inactifs } = await pool.query(
          `SELECT lower(email) AS email FROM infolettre_abonnes
            WHERE actif = false AND lower(email) = ANY($1::text[])`,
          [destinataires]
        );
        if (inactifs.length > 0) {
          const interdits = new Set(inactifs.map(r => r.email));
          destinataires = destinataires.filter(e => !interdits.has(e));
          ignores = interdits.size;
        }
      }
    } else {
      const { rows } = await pool.query(`SELECT email FROM infolettre_abonnes WHERE actif = true`);
      destinataires = rows.map(r => r.email);
    }

    if (destinataires.length === 0) {
      return res.status(400).json({
        error: ignores > 0
          ? `Toutes les adresses saisies sont désabonnées ou désactivées (${ignores}) : aucun envoi.`
          : 'Aucun destinataire trouvé pour cet envoi',
      });
    }

    // multer lit les noms de fichiers en latin1 : « été.png » arrive « Ã©tÃ©.png ».
    // On remet le nom en UTF-8 pour que {{img:été.png}} corresponde et que les
    // pièces jointes gardent leurs accents.
    const corrigerNom = f => {
      try {
        const nom = Buffer.from(f.originalname, 'latin1').toString('utf8');
        if (!nom.includes('\ufffd')) f.originalname = nom;
      } catch {}
      return f;
    };
    const images = (req.files?.images || []).map(corrigerNom);
    const documents = (req.files?.documents || []).map(corrigerNom);
    const { html, attachementsInline } = preparerContenu(message, images);
    const piecesJointes = documents.map(d => ({ filename: d.originalname, content: d.buffer, contentType: d.mimetype }));

    // Snapshot des images — uploadées sur R2 (comme le reste du site) pour
    // pouvoir réafficher visuellement l'aperçu du courriel plus tard dans
    // l'historique, sans stocker de gros blobs base64 en BD. Le courriel
    // ENVOYÉ, lui, continue d'utiliser les images en pièce jointe "inline"
    // (cid:) ci-dessus — ça ne dépend pas de R2 et le destinataire n'a pas à
    // recharger une image externe.
    const imagesApercu = [];
    for (const img of images) {
      try {
        const verif = await verifierTypeFichier(img.buffer, ['jpg', 'jpeg', 'png', 'gif', 'webp']);
        if (!verif.ok) {
          console.warn(`⚠️ Image marketing rejetée pour l'aperçu (type non conforme) : ${img.originalname}`);
          continue;
        }
        const s3Key = `studio/marketing/${uuidv4()}.${verif.extensionDetectee}`;
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: s3Key,
          Body: img.buffer,
          ContentType: verif.mimeDetecte,
        }));
        imagesApercu.push({ nom: img.originalname, url: urlR2(s3Key) });
      } catch (err) {
        // Un échec d'upload R2 ne doit jamais empêcher l'envoi de la
        // campagne elle-même (qui n'en dépend pas) — juste l'aperçu de
        // cette image précise sera manquant dans l'historique.
        console.error(`[marketing] Échec upload R2 pour l'aperçu de "${img.originalname}":`, err.message);
      }
    }
    // Documents : les PDF sont aussi copiés sur R2 pour pouvoir être rouverts
    // depuis l'historique (lien cliquable). Un autre format, ou un échec
    // d'upload, ne bloque jamais l'envoi : on garde alors juste le nom.
    const documentsApercu = [];
    for (const d of documents) {
      let url = null;
      try {
        const verif = await verifierTypeFichier(d.buffer, ['pdf']);
        if (verif.ok) {
          const s3Key = `studio/marketing/${uuidv4()}.pdf`;
          await s3.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: s3Key,
            Body: d.buffer,
            ContentType: 'application/pdf',
          }));
          url = urlR2(s3Key);
        }
      } catch (err) {
        console.error(`[marketing] Échec upload R2 pour le document "${d.originalname}":`, err.message);
      }
      documentsApercu.push({ nom: d.originalname, url });
    }

    // ── Journal de campagne — une ligne créée MAINTENANT (avant l'envoi),
    // mise à jour en direct après chaque courriel envoyé, pour que l'onglet
    // "Historique" de la page Marketing puisse suivre la progression, voir
    // les échecs, et revoir visuellement ce qui a été envoyé.
    const { rows: campagneRows } = await pool.query(
      `INSERT INTO campagnes_marketing (sujet, message, images_apercu, documents_noms, mode, total, statut)
       VALUES ($1, $2, $3, $4, $5, $6, 'en_cours') RETURNING id`,
      [sujet, message, JSON.stringify(imagesApercu), JSON.stringify(documentsApercu), mode, destinataires.length]
    );
    const campagneId = campagneRows[0].id;

    // ── On répond tout de suite (l'envoi de 1000 courriels peut prendre
    // plusieurs minutes avec le throttling — trop long pour laisser la
    // requête HTTP ouverte, elle timeout côté navigateur/proxy) et on
    // continue l'envoi en arrière-plan ; la progression est visible via
    // GET /api/admin/marketing/campagnes/:id pendant que ça tourne.
    res.json({ succes: true, demarre: true, total: destinataires.length, ignores, campagneId });

    (async () => {
      let envoyes = 0;
      const echecs = [];
      for (const email of destinataires) {
        // Lien signé propre à cet email — impossible à fabriquer pour un
        // autre destinataire sans connaître UNSUB_SECRET, et pointe vers une
        // page de CONFIRMATION (pas une suppression immédiate au chargement)
        // pour ne pas se faire piéger par les scanners de liens des courriels.
        const jeton = genererToken(email);
        const lienDesabonnement = `https://e-vendstudio.ca/desabonnement?email=${encodeURIComponent(email)}&token=${jeton}`;
        // 🔧 Préheader caché — sans ça, les boîtes de réception (Outlook,
        // Gmail...) affichent un aperçu du courriel juste à côté de l'objet,
        // en piochant le premier texte visible du corps. Pour un message
        // court (ex: un test), il n'y a pas assez de texte AVANT le pied de
        // page, donc l'adresse et le texte de désabonnement se retrouvaient
        // affichés en plein dans l'aperçu. Ce bloc est invisible à l'oeil
        // (display:none) mais lu en premier par les clients courriel pour
        // l'aperçu — le remplissage en espaces insécables empêche de
        // continuer à lire dans le reste du corps ensuite.
        const preheader = `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;">${echapper(sujet)}${'&nbsp;&zwnj;'.repeat(60)}</div>`;
        const htmlFinal = `${preheader}${html}
          <div style="background:#f8fafc;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;margin-top:24px;">
            <p style="font-size:10px;color:#9ca3af;line-height:1.7;margin-bottom:10px;">
              <strong>e-Vend Studio</strong> · La solution de boutique en ligne 100% canadienne<br>
              Saint-Arsène (Qc), G0L 2K0<br>
              Vous recevez ce courriel car vous êtes inscrit(e) à l'infolettre e-Vend Studio.
            </p>
            <a href="${lienDesabonnement}" style="display:inline-block;border:1px solid #d1d5db;color:#6b7280;padding:8px 18px;border-radius:20px;font-weight:700;font-size:11px;text-decoration:none;">
              Se désabonner de l'infolettre
            </a>
          </div>`;
        try {
          await envoyerCourriel({
            from: EXPEDITEUR,
            to: email,
            subject: sujet,
            html: htmlFinal,
            inline: attachementsInline,
            pieces: piecesJointes,
          });
          envoyes++;
        } catch (err) {
          console.error(`[marketing] Échec envoi à ${email}:`, err.message);
          echecs.push({ email, erreur: err.message });
        }

        // Mise à jour en direct — l'admin voit la progression sans attendre
        // la fin complète de la campagne.
        try {
          await pool.query(
            `UPDATE campagnes_marketing SET envoyes = $2, echecs = $3, echecs_emails = $4 WHERE id = $1`,
            [campagneId, envoyes, echecs.length, JSON.stringify(echecs)]
          );
        } catch (err) {
          console.error('[marketing] Échec mise à jour du journal:', err.message);
        }

        await attendre(DELAI_ENTRE_ENVOIS_MS);
      }

      await pool.query(
        `UPDATE campagnes_marketing SET statut = 'termine', date_fin = NOW() WHERE id = $1`,
        [campagneId]
      );

      console.log(`[marketing] Campagne "${sujet}" terminée : ${envoyes}/${destinataires.length} envoyés, ${echecs.length} échecs.`);
      if (echecs.length > 0) console.log('[marketing] Échecs:', echecs);
    })().catch(async err => {
      console.error('[marketing] Erreur pendant l\'envoi en lot:', err);
      await pool.query(`UPDATE campagnes_marketing SET statut = 'erreur', date_fin = NOW() WHERE id = $1`, [campagneId]).catch(() => {});
    });

  } catch (err) {
    console.error('POST /admin/marketing/envoyer:', err);
    res.status(500).json({ error: 'Erreur lors du démarrage de la campagne' });
  }
});

// ─── GET /api/admin/marketing/campagnes — historique des envois ────────────
router.get('/marketing/campagnes', async (req, res) => {
  try {
    // Volontairement SANS message/images_apercu ici — ces champs peuvent
    // être lourds (images en base64) et cette route charge JUSQU'À 50
    // campagnes d'un coup. Le contenu complet est chargé à la demande via
    // GET /marketing/campagnes/:id, seulement quand l'admin ouvre l'aperçu
    // d'une campagne précise.
    const { rows } = await pool.query(
      `SELECT id, sujet, mode, total, envoyes, echecs, statut, date_debut, date_fin
       FROM campagnes_marketing ORDER BY date_debut DESC LIMIT 50`
    );
    res.json({ campagnes: rows });
  } catch (err) {
    console.error('GET /admin/marketing/campagnes:', err);
    res.status(500).json({ error: 'Erreur lors du chargement de l\'historique' });
  }
});

// ─── GET /api/admin/marketing/campagnes/:id — détail (liste des échecs) ────
router.get('/marketing/campagnes/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, sujet, message, images_apercu, documents_noms, mode, total, envoyes, echecs, echecs_emails, statut, date_debut, date_fin
       FROM campagnes_marketing WHERE id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Campagne introuvable' });
    res.json({ campagne: rows[0] });
  } catch (err) {
    console.error('GET /admin/marketing/campagnes/:id:', err);
    res.status(500).json({ error: 'Erreur lors du chargement de la campagne' });
  }
});

module.exports = router;