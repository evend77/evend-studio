/**
 * factureAbonnementGenerator.ts
 * src/utils/factureAbonnementGenerator.ts
 *
 * Génère le HTML imprimable d'une facture d'abonnement e-Vend Studio,
 * à partir des données retournées par GET /api/abonnements-studio/factures/:id.
 *
 * Reprend fidèlement le design du template "abonnement_gestionnaire"
 * défini dans ModelesDocument.tsx (mêmes classes CSS, même structure).
 */

interface LigneAbonnement {
  nom: string;
  code: string;
  prix_ht: number | string;
}

interface FactureAbonnementData {
  numero_facture: string;
  date_emission_fr: string;
  periode_debut_fr: string;
  periode_fin_fr: string;
  gestionnaire_nom: string;
  gestionnaire_email: string;
  gestionnaire_adresse?: string;
  montant_ht: number | string;
  tps: number | string;
  tvq: number | string;
  montant_total: number | string;
  lignes: LigneAbonnement[];
}

function formatMontant(valeur: number | string | undefined | null): string {
  const n = parseFloat(String(valeur ?? 0));
  return n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
}

export function genererHTMLFactureAbonnement(facture: FactureAbonnementData): string {
  const lignesHTML = (facture.lignes || []).length
    ? facture.lignes.map(l => `
    <tr style="border-bottom:1px solid #e1e4e8;">
      <td style="padding:10px 14px; font-size:13px; color:#1a2332;">${l.nom}</td>
      <td style="padding:10px 14px; font-size:13px; color:#6b7280;">${l.code}</td>
      <td style="padding:10px 14px; font-size:13px; color:#1a2332; text-align:right;">${formatMontant(l.prix_ht)}</td>
    </tr>`).join('')
    : `<tr><td colspan="3" style="padding:10px 14px; font-size:13px; color:#6b7280;">Aucun détail disponible</td></tr>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a2332; background: white; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #4F46E5; }
  .logo { font-size: 24px; font-weight: 900; color: #4F46E5; }
  .logo span { color: #10b981; }
  .doc-title h1 { font-size: 26px; font-weight: 900; color: #4F46E5; text-align: right; text-transform: uppercase; }
  .doc-title .sub { font-size: 13px; color: #6b7280; text-align: right; margin-top: 4px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .partie { background: #f8fafc; border-radius: 10px; padding: 16px 20px; border-left: 4px solid #4F46E5; }
  .partie h3 { font-size: 10px; font-weight: 800; color: #4F46E5; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
  .partie p { font-size: 13px; color: #374151; line-height: 1.7; }
  .partie .nom { font-weight: 800; font-size: 15px; }
  .periode-card { background: linear-gradient(135deg, #4F46E5 0%, #3730a3 100%); color: white; border-radius: 14px; padding: 20px 28px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; }
  .periode-card .label { font-size: 10px; opacity: 0.7; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
  .periode-card .val { font-size: 15px; font-weight: 800; }
  .totaux { width: 320px; margin-left: auto; margin-bottom: 24px; }
  .totaux .ligne { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #e1e4e8; font-size: 13px; }
  .totaux .ligne.total { background: #4F46E5; color: white; padding: 12px 16px; border-radius: 8px; font-size: 16px; font-weight: 900; border: none; margin-top: 8px; }
  .note-taxe { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; font-size: 11px; color: #1e40af; line-height: 1.6; margin-bottom: 20px; }
  .footer { margin-top: 28px; padding-top: 18px; border-top: 2px solid #e1e4e8; font-size: 11px; color: #6b7280; text-align: center; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">e<span>-</span>Vend Studio</div>
    <div style="font-size:11px; color:#6b7280; margin-top:4px;">Facture N° ${facture.numero_facture}</div>
  </div>
  <div class="doc-title">
    <h1>Facture d'abonnement</h1>
    <div class="sub">Émise le ${facture.date_emission_fr}</div>
  </div>
</div>

<div class="parties">
  <div class="partie">
    <h3>Fournisseur</h3>
    <p class="nom">e-Vend Studio</p>
    <p>Création de sites et boutiques en ligne<br>Québec, Canada</p>
  </div>
  <div class="partie" style="border-left-color:#10b981;">
    <h3>Client</h3>
    <p class="nom">${facture.gestionnaire_nom || ''}</p>
    <p>${facture.gestionnaire_email || ''}</p>
    <p style="margin-top:6px;">${facture.gestionnaire_adresse || ''}</p>
  </div>
</div>

<div class="periode-card">
  <div>
    <div class="label">Période facturée</div>
    <div class="val">${facture.periode_debut_fr} — ${facture.periode_fin_fr}</div>
  </div>
  <div style="text-align:right;">
    <div class="label">Renouvellement automatique</div>
    <div class="val">${facture.periode_fin_fr}</div>
  </div>
</div>

<table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
  <thead>
    <tr style="background:#4F46E5; color:white;">
      <th style="padding:11px 14px; text-align:left; font-size:11px; font-weight:700; text-transform:uppercase;">Service</th>
      <th style="padding:11px 14px; text-align:left; font-size:11px; font-weight:700; text-transform:uppercase;">Type</th>
      <th style="padding:11px 14px; text-align:right; font-size:11px; font-weight:700; text-transform:uppercase;">Montant HT</th>
    </tr>
  </thead>
  <tbody>
    ${lignesHTML}
  </tbody>
</table>

<div class="totaux">
  <div class="ligne"><span>Sous-total</span><span>${formatMontant(facture.montant_ht)}</span></div>
  <div class="ligne"><span>TPS (5%)</span><span>${formatMontant(facture.tps)}</span></div>
  <div class="ligne"><span>TVQ (9.975%)</span><span>${formatMontant(facture.tvq)}</span></div>
  <div class="ligne total"><span>TOTAL</span><span>${formatMontant(facture.montant_total)}</span></div>
</div>

<div class="note-taxe">
  ℹ️ <strong>Note fiscale :</strong> Les frais d'abonnement à une plateforme de commerce électronique sont assujettis aux taxes (TPS 5% + TVQ 9.975%) conformément à la législation fiscale canadienne et québécoise en vigueur. e-Vend Studio est inscrit aux fichiers de la taxe au Québec.
</div>

<div style="font-size:12px; color:#374151; margin-bottom:16px;">
  <strong>Paiement :</strong> Carte de crédit — <span style="background:#dcfce7; color:#16a34a; padding:2px 10px; border-radius:20px; font-weight:700; font-size:11px;">PAYÉ</span>
</div>

<div class="footer">
  e-Vend Studio — Merci de votre confiance | Questions ? Contactez-nous via la messagerie interne.
</div>

</body>
</html>`;
}