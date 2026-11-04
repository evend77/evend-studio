// routes/adminRepondreClient.js
// « E-mail manuel » (Messagerie) : l'admin répond à un client par courriel
// habillé e-Vend Studio, avec images intégrées ({{img:nom}}) et pièces jointes.
//
// Monté dans server.js :  app.use('/api/admin', require('./routes/adminRepondreClient'));
//   → POST /api/admin/repondre-client  (voir ReponseClient.tsx)
//
// Envoi par le même SES que le reste de Studio (utils/courrielMime.js).
// Modèle de courriel : n° 103 « Réponse manuelle admin — client », modifiable dans
// l'admin (Paramètres > Modèles de courriel) avec les variables {$message_client}
// et {$message_reponse}. Tant qu'il n'a pas été sauvegardé (ou s'il est désactivé),
// un rendu équivalent intégré ci-dessous est utilisé.

const express = require('express');
const multer = require('multer');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { envoyerCourriel, separerAdresse } = require('../utils/courrielMime');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 12 }, // 10 Mo / fichier
});

const ADRESSE_ENVOI = separerAdresse(process.env.FROM_EMAIL || 'contact@e-vend.ca').adresse;
const EXPEDITEUR = process.env.REPONSE_FROM || `"e-Vend Studio" <${ADRESSE_ENVOI}>`;

const TEMPLATE_ID_REPONSE_CLIENT = 103;

const REGEX_EMAIL = /^[^\s@<>"']+@[^\s@<>"']+\.[a-zA-Z]{2,}$/;
const echapper = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Lit le modèle sauvegardé en base (table des modèles de courriel) ; null si absent/inactif.
async function chargerModele(id) {
  for (const table of ['modeles_email', 'email_templates']) {
    try {
      const { rows } = await pool.query(`SELECT sujet, html, actif FROM ${table} WHERE id = $1 LIMIT 1`, [id]);
      if (rows.length > 0) return rows[0].actif === false ? null : rows[0];
    } catch { /* table absente → on essaie la suivante */ }
  }
  return null;
}

// multer lit les noms de fichiers en latin1 : « été.png » arrive « Ã©tÃ©.png ».
function corrigerNom(f) {
  try {
    const nom = Buffer.from(f.originalname, 'latin1').toString('utf8');
    if (!nom.includes('�')) f.originalname = nom;
  } catch {}
  return f;
}

router.post(
  '/repondre-client',
  authenticateToken,
  isAdmin,
  upload.fields([
    { name: 'images', maxCount: 6 },     // intégrées dans le texte (cid)
    { name: 'documents', maxCount: 6 },  // pièces jointes classiques (PDF, etc.)
  ]),
  async (req, res) => {
    try {
      const { destinataire, sujet, messageClient, messageReponse } = req.body;
      if (!destinataire || !messageReponse) {
        return res.status(400).json({ erreur: 'destinataire et messageReponse sont requis' });
      }
      const to = String(destinataire).trim();
      if (!REGEX_EMAIL.test(to)) {
        return res.status(400).json({ erreur: 'Adresse courriel du client invalide' });
      }

      const images = (req.files?.images || []).map(corrigerNom);
      const documents = (req.files?.documents || []).map(corrigerNom);

      // {{img:nom}} → <img src="cid:..."> + pièce jointe « inline » correspondante
      const inline = [];
      const reponseHtml = String(messageReponse)
        .split('\n').join('<br>')
        .replace(/\{\{img:([^}]+)\}\}/g, (_m, nom) => {
          const img = images.find(i => i.originalname === nom);
          if (!img) return '';
          const cid = `img-${inline.length}-${Date.now()}@e-vend-studio`;
          inline.push({ filename: img.originalname, content: img.buffer, contentType: img.mimetype, cid });
          return `<br><img src="cid:${cid}" style="max-width:100%;border-radius:8px;margin:8px 0;"><br>`;
        });

      const clientHtml = messageClient && String(messageClient).trim()
        ? echapper(messageClient).split('\n').join('<br>')
        : '';
      const date = new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
      const modele = await chargerModele(TEMPLATE_ID_REPONSE_CLIENT);
      const remplacer = txt => String(txt)
        .replace(/\{\$message_client\}/g, clientHtml)
        .replace(/\{\$message_reponse\}/g, reponseHtml)
        .replace(/\{\$nom_boutique\}/g, process.env.SHOP_NAME || 'e-Vend Studio')
        .replace(/\{\$lien_dashboard\}/g, `${process.env.FRONTEND_URL || 'https://e-vendstudio.ca'}/dashboard`)
        .replace(/\{\$date\}/g, date);

      const objet = (sujet && String(sujet).trim()) || (modele && modele.sujet && remplacer(modele.sujet)) || "Réponse de l'équipe e-Vend Studio";
      let html;
      if (modele && modele.html) {
        html = remplacer(modele.html);
      } else {
        const citation = clientHtml
          ? `<div style="background:#f8fafc;border-left:4px solid #2d6a9f;border-radius:0 8px 8px 0;padding:10px 14px;margin:10px 0;font-size:13px;font-style:italic;color:#6b7280;"><strong>Votre message :</strong><br>${clientHtml}</div>`
          : '';
        html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#374151;">
  <div style="font-size:20px;font-weight:900;color:#1a2332;margin-bottom:16px;">e-Vend Studio</div>
  <p style="font-size:14px;font-weight:700;margin:0 0 10px;">Bonjour,</p>
  ${citation}
  <p style="font-size:13px;font-weight:700;margin:14px 0 4px;">Notre réponse :</p>
  <div style="font-size:14px;line-height:1.7;">${reponseHtml}</div>
  <p style="font-size:14px;margin:24px 0 0;">Cordialement,<br><strong>L'équipe e-Vend Studio</strong></p>
  <div style="border-top:1px solid #e5e7eb;margin-top:24px;padding-top:12px;font-size:10px;color:#9ca3af;line-height:1.7;">
    e-Vend Studio · La solution de boutique en ligne 100% canadienne
  </div>
</div>`;
      }

      await envoyerCourriel({
        from: EXPEDITEUR,
        to,
        subject: objet,
        html,
        inline,
        pieces: documents.map(d => ({ filename: d.originalname, content: d.buffer, contentType: d.mimetype })),
      });
      res.json({ succes: true });
    } catch (e) {
      console.error('❌ POST /admin/repondre-client:', e.message);
      res.status(500).json({ erreur: "Échec de l'envoi : " + e.message });
    }
  }
);

module.exports = router;