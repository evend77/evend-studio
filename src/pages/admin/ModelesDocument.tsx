import React, { useState, useCallback, useEffect } from 'react';

const API = 'https://evend-multivendeur-api.onrender.com';

// ── Thème ──────────────────────────────────────────────────────────────────
const T = {
  accent: '#2d6a9f', accentLight: '#e8f2fb', accentDark: '#1e4d75',
  bg: '#f0f2f5', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  success: '#16a34a', warning: '#d97706', danger: '#dc2626',
};

// ── Types ───────────────────────────────────────────────────────────────────
type DocType = 'facture_acheteur' | 'commission_vendeur' | 'abonnement_vendeur' | 'packing_slip' | 'sommaire_vendeur' | 'sommaire_acheteur';

interface Document {
  id: DocType;
  nom: string;
  icon: string;
  description: string;
  couleurAccent: string;
  html: string;
}

// ── Variables disponibles par type ──────────────────────────────────────────
const VARIABLES: Record<DocType, { cle: string; description: string; exemple: string }[]> = {
  facture_acheteur: [
    { cle: '{$nom_boutique}', description: 'Nom de la boutique e-Vend', exemple: 'e-Vend.ca' },
    { cle: '{$logo_boutique}', description: 'URL du logo', exemple: 'https://.../logo.png' },
    { cle: '{$nom_acheteur}', description: 'Nom complet de l\'acheteur', exemple: 'Jean Tremblay' },
    { cle: '{$email_acheteur}', description: 'Courriel de l\'acheteur', exemple: 'jean@email.com' },
    { cle: '{$adresse_livraison}', description: 'Adresse de livraison complète', exemple: '123 rue Principale, Québec, QC G1V 2M2' },
    { cle: '{$adresse_facturation}', description: 'Adresse de facturation', exemple: '123 rue Principale, Québec, QC G1V 2M2' },
    { cle: '{$numero_commande}', description: 'Numéro de commande', exemple: 'CMD-2026-00123' },
    { cle: '{$numero_facture}', description: 'Numéro de facture', exemple: 'FAC-2026-00123' },
    { cle: '{$date_commande}', description: 'Date de la commande', exemple: '15/03/2026' },
    { cle: '{$date_facture}', description: 'Date de la facture', exemple: '16/03/2026' },
    { cle: '{$nom_vendeur}', description: 'Nom de la boutique vendeur', exemple: 'Artisanat Marie' },
    { cle: '{$liste_produits}', description: 'Tableau HTML des produits', exemple: '<tr><td>Produit</td><td>1</td><td>25,00 $</td></tr>' },
    { cle: '{$sous_total}', description: 'Sous-total avant taxes', exemple: '100,00 $' },
    { cle: '{$tps}', description: 'Montant TPS (5%)', exemple: '5,00 $' },
    { cle: '{$tvq}', description: 'Montant TVQ (9.975%)', exemple: '9,98 $' },
    { cle: '{$total}', description: 'Total avec taxes', exemple: '114,98 $' },
    { cle: '{$methode_paiement}', description: 'Méthode de paiement', exemple: 'Carte de crédit (Visa)' },
    { cle: '{$methode_livraison}', description: 'Méthode de livraison', exemple: 'Poste Canada - Livraison standard' },
    { cle: '{$note_commande}', description: 'Note du client', exemple: 'Laisser devant la porte SVP' },
  ],
  commission_vendeur: [
    { cle: '{$nom_boutique}', description: 'Nom de la boutique e-Vend', exemple: 'e-Vend.ca' },
    { cle: '{$logo_boutique}', description: 'URL du logo', exemple: 'https://.../logo.png' },
    { cle: '{$nom_vendeur}', description: 'Nom complet du vendeur', exemple: 'Marie Tremblay' },
    { cle: '{$email_vendeur}', description: 'Courriel du vendeur', exemple: 'marie@artisanat.com' },
    { cle: '{$nom_boutique_vendeur}', description: 'Nom de la boutique vendeur', exemple: 'Artisanat Marie' },
    { cle: '{$adresse_vendeur}', description: 'Adresse complète du vendeur', exemple: '456 rue des Artisans, Montréal, QC H3C 1A1' },
    { cle: '{$numero_facture}', description: 'Numéro de facture', exemple: 'COM-2026-00456' },
    { cle: '{$date_facture}', description: 'Date de la facture', exemple: '16/03/2026' },
    { cle: '{$periode_debut}', description: 'Début de la période', exemple: '01/03/2026' },
    { cle: '{$periode_fin}', description: 'Fin de la période', exemple: '31/03/2026' },
    { cle: '{$liste_commissions}', description: 'Tableau HTML des commissions par commande', exemple: '<tr><td>CMD-123</td><td>100,00 $</td><td>5,00 $</td></tr>' },
    { cle: '{$total_ventes}', description: 'Total des ventes brutes', exemple: '1 234,56 $' },
    { cle: '{$taux_commission}', description: 'Taux de commission (%)', exemple: '5,0 %' },
    { cle: '{$montant_commission}', description: 'Montant total de commission', exemple: '61,73 $' },
    { cle: '{$montant_net}', description: 'Montant net à recevoir', exemple: '1 172,83 $' },
    { cle: '{$note_taxe}', description: 'Note fiscale applicable', exemple: 'Les commissions sont sans taxes (particulier non inscrit).' },
  ],
  abonnement_vendeur: [
    { cle: '{$nom_boutique}', description: 'Nom de la boutique e-Vend', exemple: 'e-Vend.ca' },
    { cle: '{$logo_boutique}', description: 'URL du logo', exemple: 'https://.../logo.png' },
    { cle: '{$nom_vendeur}', description: 'Nom complet du vendeur', exemple: 'Marie Tremblay' },
    { cle: '{$email_vendeur}', description: 'Courriel du vendeur', exemple: 'marie@artisanat.com' },
    { cle: '{$adresse_vendeur}', description: 'Adresse du vendeur', exemple: '456 rue des Artisans, Montréal, QC H3C 1A1' },
    { cle: '{$numero_facture}', description: 'Numéro de facture', exemple: 'ABO-2026-00321' },
    { cle: '{$date_facture}', description: 'Date de la facture', exemple: '16/03/2026' },
    { cle: '{$nom_plan}', description: 'Nom du plan souscrit', exemple: 'Plan Or - Vendeur professionnel' },
    { cle: '{$description_plan}', description: 'Description du plan', exemple: 'Jusqu\'à 100 produits, support prioritaire' },
    { cle: '{$date_debut}', description: 'Date de début du plan', exemple: '01/03/2026' },
    { cle: '{$date_fin}', description: 'Date de fin / renouvellement', exemple: '31/03/2026' },
    { cle: '{$prix_plan}', description: 'Prix du plan (HT)', exemple: '29,99 $' },
    { cle: '{$tps}', description: 'Montant TPS (5%)', exemple: '1,50 $' },
    { cle: '{$tvq}', description: 'Montant TVQ (9.975%)', exemple: '2,99 $' },
    { cle: '{$total}', description: 'Total avec taxes', exemple: '34,48 $' },
    { cle: '{$methode_paiement}', description: 'Méthode de paiement', exemple: 'Carte de crédit (Visa)' },
  ],
  packing_slip: [
    { cle: '{$nom_boutique}', description: 'Nom de la boutique e-Vend', exemple: 'e-Vend.ca' },
    { cle: '{$logo_boutique}', description: 'URL du logo', exemple: 'https://.../logo.png' },
    { cle: '{$nom_vendeur_boutique}', description: 'Boutique du vendeur', exemple: 'Artisanat Marie' },
    { cle: '{$adresse_retour}', description: 'Adresse de retour du vendeur', exemple: '456 rue des Artisans, Montréal, QC H3C 1A1' },
    { cle: '{$nom_acheteur}', description: 'Nom de l\'acheteur', exemple: 'Jean Tremblay' },
    { cle: '{$adresse_livraison}', description: 'Adresse de livraison', exemple: '123 rue Principale, Québec, QC G1V 2M2' },
    { cle: '{$telephone_acheteur}', description: 'Téléphone de l\'acheteur', exemple: '418-555-1234' },
    { cle: '{$numero_commande}', description: 'Numéro de commande', exemple: 'CMD-2026-00123' },
    { cle: '{$date_commande}', description: 'Date de la commande', exemple: '15/03/2026' },
    { cle: '{$methode_livraison}', description: 'Méthode de livraison', exemple: 'Poste Canada - Livraison standard' },
    { cle: '{$numero_suivi}', description: 'Numéro de suivi', exemple: '1Z999AA10123456784' },
    { cle: '{$liste_produits}', description: 'Tableau des produits à expédier', exemple: '<tr><td>Porte-clés</td><td>2</td></tr>' },
    { cle: '{$total_articles}', description: 'Nombre total d\'articles', exemple: '5' },
    { cle: '{$note_commande}', description: 'Note du client', exemple: 'Laisser devant la porte SVP' },
    { cle: '{$poids_total}', description: 'Poids total du colis', exemple: '1,5 kg' },
  ],
  sommaire_vendeur: [
    { cle: '{$nom_boutique}', description: 'Nom de la boutique e-Vend', exemple: 'e-Vend.ca' },
    { cle: '{$logo_boutique}', description: 'URL du logo', exemple: 'https://.../logo.png' },
    { cle: '{$nom_vendeur}', description: 'Nom complet du vendeur', exemple: 'Marie Tremblay' },
    { cle: '{$nom_boutique_vendeur}', description: 'Nom de la boutique vendeur', exemple: 'Artisanat Marie' },
    { cle: '{$adresse_vendeur}', description: 'Adresse complète du vendeur', exemple: '456 rue des Artisans, Montréal, QC H3C 1A1' },
    { cle: '{$no_tps_vendeur}', description: 'Numéro de TPS du vendeur (si inscrit)', exemple: '123456789 RT0001' },
    { cle: '{$no_tvq_vendeur}', description: 'Numéro de TVQ du vendeur (si inscrit)', exemple: '1234567890 TQ0001' },
    { cle: '{$province_vendeur}', description: 'Province du vendeur', exemple: 'Québec' },
    { cle: '{$periode_mois}', description: 'Mois du sommaire', exemple: 'Mars 2026' },
    { cle: '{$date_emission}', description: "Date d'émission du sommaire", exemple: '16/03/2026' },
    { cle: '{$nb_commandes}', description: 'Nombre total de commandes', exemple: '24' },
    { cle: '{$total_ventes_brut}', description: 'Total des ventes brutes (avant taxes)', exemple: '1 234,56 $' },
    { cle: '{$total_tps_percue}', description: 'Total TPS perçue sur les ventes', exemple: '61,73 $' },
    { cle: '{$total_tvq_percue}', description: 'Total TVQ perçue sur les ventes', exemple: '123,15 $' },
    { cle: '{$total_tvh_percue}', description: 'Total TVH perçue', exemple: '0,00 $' },
    { cle: '{$total_taxes_percues}', description: 'Total toutes taxes perçues', exemple: '184,88 $' },
    { cle: '{$total_ventes_ttc}', description: 'Total des ventes TTC', exemple: '1 419,44 $' },
    { cle: '{$total_commissions}', description: 'Total des commissions payées', exemple: '61,73 $' },
    { cle: '{$tps_commission}', description: 'TPS sur commissions', exemple: '3,09 $' },
    { cle: '{$tvq_commission}', description: 'TVQ sur commissions', exemple: '6,16 $' },
    { cle: '{$total_abonnement}', description: "Frais d'abonnement du mois (HT)", exemple: '29,99 $' },
    { cle: '{$tps_abonnement}', description: "TPS sur l'abonnement", exemple: '1,50 $' },
    { cle: '{$tvq_abonnement}', description: "TVQ sur l'abonnement", exemple: '2,99 $' },
    { cle: '{$total_abonnement_ttc}', description: "Frais d'abonnement TTC", exemple: '34,48 $' },
    { cle: '{$total_remboursements}', description: 'Total des remboursements émis', exemple: '0,00 $' },
    { cle: '{$total_net}', description: 'Gain net total du mois', exemple: '1 323,23 $' },
    { cle: '{$regime_taxes_vendeur}', description: 'Régime fiscal du vendeur', exemple: 'Inscrit TPS/TVQ' },
    { cle: '{$note_fiscale}', description: 'Note fiscale personnalisée', exemple: 'Vous devez remettre les taxes perçues aux autorités fiscales.' },
    { cle: '{$tableau_commandes}', description: 'Tableau détaillé de toutes les commandes', exemple: '<tr><td>CMD-123</td><td>100,00 $</td><td>...</td></tr>' },
    { cle: '{$tableau_taxes}', description: 'Tableau récapitulatif des taxes', exemple: '<tr><td>TPS</td><td>61,73 $</td></tr>' },
    { cle: '{$tableau_commissions}', description: 'Détail de toutes les commissions', exemple: '<tr><td>Commission</td><td>5,00 $</td></tr>' },
    { cle: '{$tableau_paiements}', description: 'Virements reçus dans le mois', exemple: '<tr><td>10/03</td><td>500,00 $</td></tr>' },
    { cle: '{$produit_top_vente}', description: 'Produit le plus vendu du mois', exemple: 'Porte-clés artisanal (24 vendus)' },
    { cle: '{$taux_commission}', description: 'Taux de commission appliqué (%)', exemple: '5,0 %' },
  ],
  sommaire_acheteur: [
    { cle: '{$nom_boutique}', description: 'Nom de la boutique e-Vend', exemple: 'e-Vend.ca' },
    { cle: '{$logo_boutique}', description: 'URL du logo', exemple: 'https://.../logo.png' },
    { cle: '{$nom_acheteur}', description: 'Nom complet de l\'acheteur', exemple: 'Jean Tremblay' },
    { cle: '{$email_acheteur}', description: 'Courriel de l\'acheteur', exemple: 'jean@email.com' },
    { cle: '{$adresse_facturation}', description: 'Adresse de facturation', exemple: '123 rue Principale, Québec, QC G1V 2M2' },
    { cle: '{$province_acheteur}', description: 'Province de l\'acheteur', exemple: 'Québec' },
    { cle: '{$periode_mois}', description: 'Mois du sommaire', exemple: 'Mars 2026' },
    { cle: '{$date_emission}', description: "Date d'émission du sommaire", exemple: '16/03/2026' },
    { cle: '{$nb_commandes}', description: 'Nombre de commandes passées', exemple: '8' },
    { cle: '{$total_achats_ht}', description: 'Total dépensé avant taxes', exemple: '456,78 $' },
    { cle: '{$total_tps_payee}', description: 'Total TPS payée', exemple: '22,84 $' },
    { cle: '{$total_tvq_payee}', description: 'Total TVQ payée', exemple: '45,56 $' },
    { cle: '{$total_tvh_payee}', description: 'Total TVH payée', exemple: '0,00 $' },
    { cle: '{$total_taxes_payees}', description: 'Total toutes taxes payées', exemple: '68,40 $' },
    { cle: '{$total_achats}', description: 'Total dépensé TTC', exemple: '525,18 $' },
    { cle: '{$total_remboursements}', description: 'Total des remboursements reçus', exemple: '0,00 $' },
    { cle: '{$taxes_remboursees}', description: 'Taxes remboursées', exemple: '0,00 $' },
    { cle: '{$net_depense}', description: 'Net dépensé après remboursements', exemple: '525,18 $' },
    { cle: '{$tableau_commandes}', description: 'Tableau de toutes les commandes', exemple: '<tr><td>CMD-123</td><td>...</td></tr>' },
    { cle: '{$tableau_taxes}', description: 'Récapitulatif des taxes payées', exemple: '<tr><td>TPS</td><td>22,84 $</td></tr>' },
    { cle: '{$note_fiscale}', description: 'Note sur les taxes applicables', exemple: 'Les taxes varient selon la province du vendeur.' },
  ],
};

// ── Templates HTML par défaut (je garde seulement la facture pour la brièveté, mais garde TOUS tes templates originaux ici) ──
const HTML_DEFAUT: Record<DocType, string> = {
  facture_acheteur: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a2332; background: white; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #2d6a9f; }
  .logo { font-size: 24px; font-weight: 900; color: #2d6a9f; letter-spacing: -0.5px; }
  .logo span { color: #e67e22; }
  .doc-title { text-align: right; }
  .doc-title h1 { font-size: 28px; font-weight: 900; color: #2d6a9f; text-transform: uppercase; letter-spacing: 1px; }
  .doc-title .num { font-size: 14px; color: #6b7280; margin-top: 4px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .partie { background: #f8fafc; border-radius: 10px; padding: 16px 20px; border-left: 4px solid #2d6a9f; }
  .partie h3 { font-size: 10px; font-weight: 800; color: #2d6a9f; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
  .partie p { font-size: 13px; color: #374151; line-height: 1.7; }
  .partie .nom { font-weight: 800; font-size: 15px; color: #1a2332; }
  .infos-doc { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
  .info-box { background: #eff6ff; border-radius: 8px; padding: 12px 14px; text-align: center; }
  .info-box .label { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .info-box .val { font-size: 13px; font-weight: 800; color: #1a2332; margin-top: 3px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead tr { background: #2d6a9f; color: white; }
  thead th { padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  thead th:last-child { text-align: right; }
  tbody tr { border-bottom: 1px solid #e1e4e8; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody td { padding: 11px 14px; font-size: 13px; }
  tbody td:last-child { text-align: right; font-weight: 700; }
  .totaux { width: 300px; margin-left: auto; margin-bottom: 28px; }
  .totaux .ligne { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e1e4e8; font-size: 13px; }
  .totaux .ligne.total { background: #2d6a9f; color: white; padding: 12px 14px; border-radius: 8px; font-size: 15px; font-weight: 900; border: none; margin-top: 8px; }
  .footer { margin-top: 32px; padding-top: 20px; border-top: 2px solid #e1e4e8; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer .merci { font-size: 14px; font-weight: 700; color: #2d6a9f; }
  .footer .note-taxe { font-size: 11px; color: #6b7280; max-width: 400px; line-height: 1.5; }
  .badge { display: inline-block; background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
</style>
</head>
<body>

<div class="header">
  <div class="logo">e<span>-</span>Vend<span style="color:#2d6a9f; font-size:14px;">.ca</span></div>
  <div class="doc-title">
    <h1>Facture</h1>
    <div class="num">N° {$numero_facture}</div>
  </div>
</div>

<div class="parties">
  <div class="partie">
    <h3>Vendu par</h3>
    <p class="nom">{$nom_vendeur}</p>
    <p>Via e-Vend.ca</p>
  </div>
  <div class="partie" style="border-left-color:#e67e22;">
    <h3>Facturé à</h3>
    <p class="nom">{$nom_acheteur}</p>
    <p>{$email_acheteur}</p>
    <p style="margin-top:6px;">{$adresse_facturation}</p>
  </div>
</div>

<div class="infos-doc">
  <div class="info-box">
    <div class="label">N° Commande</div>
    <div class="val">#{$numero_commande}</div>
  </div>
  <div class="info-box">
    <div class="label">Date commande</div>
    <div class="val">{$date_commande}</div>
  </div>
  <div class="info-box">
    <div class="label">Date facture</div>
    <div class="val">{$date_facture}</div>
  </div>
  <div class="info-box">
    <div class="label">Livraison</div>
    <div class="val">{$methode_livraison}</div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Produit</th>
      <th>SKU</th>
      <th style="text-align:center;">Qté</th>
      <th style="text-align:right;">Prix unit.</th>
      <th>Total</th>
    </tr>
  </thead>
  <tbody>
    {$liste_produits}
  </tbody>
</table>

<div class="totaux">
  <div class="ligne"><span>Sous-total</span><span>{$sous_total}</span></div>
  <div class="ligne"><span>TPS (5%)</span><span>{$tps}</span></div>
  <div class="ligne"><span>TVQ (9.975%)</span><span>{$tvq}</span></div>
  <div class="ligne total"><span>TOTAL</span><span>{$total}</span></div>
</div>

<div style="margin-bottom:20px; font-size:12px; color:#374151;">
  <strong>Adresse de livraison :</strong> {$adresse_livraison}<br>
  <strong>Paiement :</strong> {$methode_paiement}
  <span class="badge" style="margin-left:8px;">PAYÉ</span>
</div>

<div class="footer">
  <div class="merci">Merci pour votre achat sur e-Vend.ca ! 🎉</div>
  <div class="note-taxe">
    Note fiscale : Les taxes (TPS/TVQ) sont applicables selon le statut fiscal du vendeur. 
    Un vendeur particulier non inscrit aux fichiers de taxes peut être exempté de la perception des taxes.
  </div>
</div>

</body>
</html>`,

  // === TOUS TES AUTRES TEMPLATES ICI (commission_vendeur, abonnement_vendeur, packing_slip, sommaire_vendeur, sommaire_acheteur) ===
  commission_vendeur: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a2332; background: white; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #2d6a9f; }
  .logo { font-size: 24px; font-weight: 900; color: #2d6a9f; }
  .logo span { color: #e67e22; }
  .doc-title h1 { font-size: 26px; font-weight: 900; color: #2d6a9f; text-align: right; text-transform: uppercase; }
  .doc-title .sub { font-size: 13px; color: #6b7280; text-align: right; margin-top: 4px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .partie { background: #f8fafc; border-radius: 10px; padding: 16px 20px; border-left: 4px solid #2d6a9f; }
  .partie h3 { font-size: 10px; font-weight: 800; color: #2d6a9f; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
  .partie p { font-size: 13px; color: #374151; line-height: 1.7; }
  .partie .nom { font-weight: 800; font-size: 15px; }
  .periode-banner { background: linear-gradient(135deg, #2d6a9f, #1e4d75); color: white; border-radius: 10px; padding: 16px 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
  .periode-banner .label { font-size: 11px; font-weight: 700; opacity: 0.8; text-transform: uppercase; }
  .periode-banner .val { font-size: 16px; font-weight: 900; margin-top: 3px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead tr { background: #2d6a9f; color: white; }
  thead th { padding: 10px 13px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  thead th:last-child, thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
  tbody tr { border-bottom: 1px solid #e1e4e8; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody td { padding: 10px 13px; font-size: 12px; }
  tbody td:last-child, tbody td:nth-child(3), tbody td:nth-child(4) { text-align: right; }
  .totaux { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .kpi { background: #f8fafc; border-radius: 10px; padding: 16px 20px; border-top: 3px solid #e1e4e8; }
  .kpi.accent { border-top-color: #2d6a9f; background: #eff6ff; }
  .kpi.success { border-top-color: #16a34a; background: #f0fdf4; }
  .kpi.danger { border-top-color: #dc2626; background: #fef2f2; }
  .kpi .label { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 6px; }
  .kpi .val { font-size: 22px; font-weight: 900; color: #1a2332; }
  .note-exempte { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; font-size: 11px; color: #92400e; line-height: 1.6; margin-bottom: 20px; }
  .footer { margin-top: 28px; padding-top: 18px; border-top: 2px solid #e1e4e8; font-size: 11px; color: #6b7280; text-align: center; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">e<span>-</span>Vend.ca</div>
    <div style="font-size:11px; color:#6b7280; margin-top:4px;">Facture N° {$numero_facture}</div>
  </div>
  <div class="doc-title">
    <h1>Frais de commission</h1>
    <div class="sub">Émise le {$date_facture}</div>
  </div>
</div>

<div class="parties">
  <div class="partie">
    <h3>De — e-Vend.ca</h3>
    <p class="nom">{$nom_boutique}</p>
    <p>Plateforme de commerce en ligne<br>Québec, Canada</p>
  </div>
  <div class="partie" style="border-left-color:#e67e22;">
    <h3>À — Vendeur</h3>
    <p class="nom">{$nom_boutique_vendeur}</p>
    <p>{$nom_vendeur}<br>{$email_vendeur}</p>
    <p style="margin-top:6px;">{$adresse_vendeur}</p>
  </div>
</div>

<div class="periode-banner">
  <div><div class="label">Période couverte</div><div class="val">{$periode_debut} → {$periode_fin}</div></div>
  <div style="text-align:right;"><div class="label">Taux de commission</div><div class="val">{$taux_commission}%</div></div>
</div>

<table>
  <thead>
    <tr>
      <th>N° Commande</th>
      <th>Date</th>
      <th>Vente brute</th>
      <th>Commission</th>
      <th>Net vendeur</th>
    </tr>
  </thead>
  <tbody>
    {$liste_commissions}
  </tbody>
</table>

<div class="totaux">
  <div class="kpi accent"><div class="label">Total ventes brutes</div><div class="val">{$total_ventes}</div></div>
  <div class="kpi danger"><div class="label">Commission totale ({$taux_commission}%)</div><div class="val">{$montant_commission}</div></div>
  <div class="kpi" style="grid-column: span 2; border-top-color:#16a34a; background:#f0fdf4;"><div class="label">Net à recevoir</div><div class="val" style="color:#16a34a; font-size:28px;">{$montant_net}</div></div>
</div>

<div class="note-exempte">
  ⚠️ <strong>Note fiscale importante :</strong> {$note_taxe}<br>
  Conformément à la Loi sur la taxe d'accise (TPS) et la Loi sur la taxe de vente du Québec (TVQ), les frais de commission prélevés par une marketplace sur les ventes entre particuliers non inscrits aux fichiers de taxes ne sont pas assujettis aux taxes de vente.
</div>

<div class="footer">
  e-Vend.ca — Votre partenaire de vente en ligne | Questions ? Contactez-nous via la messagerie interne.
</div>

</body>
</html>`,

  abonnement_vendeur: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a2332; background: white; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #2d6a9f; }
  .logo { font-size: 24px; font-weight: 900; color: #2d6a9f; }
  .logo span { color: #e67e22; }
  .doc-title h1 { font-size: 26px; font-weight: 900; color: #2d6a9f; text-align: right; text-transform: uppercase; }
  .doc-title .sub { font-size: 13px; color: #6b7280; text-align: right; margin-top: 4px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .partie { background: #f8fafc; border-radius: 10px; padding: 16px 20px; border-left: 4px solid #2d6a9f; }
  .partie h3 { font-size: 10px; font-weight: 800; color: #2d6a9f; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
  .partie p { font-size: 13px; color: #374151; line-height: 1.7; }
  .partie .nom { font-weight: 800; font-size: 15px; }
  .plan-card { background: linear-gradient(135deg, #2d6a9f 0%, #1e4d75 100%); color: white; border-radius: 14px; padding: 28px 32px; margin-bottom: 28px; position: relative; overflow: hidden; }
  .plan-card::before { content: ''; position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.07); border-radius: 50%; }
  .plan-card .plan-nom { font-size: 28px; font-weight: 900; margin-bottom: 6px; }
  .plan-card .plan-desc { font-size: 13px; opacity: 0.85; margin-bottom: 20px; }
  .plan-card .dates { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .plan-card .date-box .label { font-size: 10px; opacity: 0.7; text-transform: uppercase; font-weight: 700; }
  .plan-card .date-box .val { font-size: 15px; font-weight: 800; margin-top: 3px; }
  .totaux { width: 320px; margin-left: auto; margin-bottom: 24px; }
  .totaux .ligne { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #e1e4e8; font-size: 13px; }
  .totaux .ligne.total { background: #2d6a9f; color: white; padding: 12px 16px; border-radius: 8px; font-size: 16px; font-weight: 900; border: none; margin-top: 8px; }
  .note-taxe { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; font-size: 11px; color: #1e40af; line-height: 1.6; margin-bottom: 20px; }
  .footer { margin-top: 28px; padding-top: 18px; border-top: 2px solid #e1e4e8; font-size: 11px; color: #6b7280; text-align: center; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">e<span>-</span>Vend.ca</div>
    <div style="font-size:11px; color:#6b7280; margin-top:4px;">Facture N° {$numero_facture}</div>
  </div>
  <div class="doc-title">
    <h1>Facture d'abonnement</h1>
    <div class="sub">Émise le {$date_facture}</div>
  </div>
</div>

<div class="parties">
  <div class="partie">
    <h3>Fournisseur</h3>
    <p class="nom">{$nom_boutique}</p>
    <p>Plateforme de commerce en ligne<br>Québec, Canada</p>
  </div>
  <div class="partie" style="border-left-color:#e67e22;">
    <h3>Client</h3>
    <p class="nom">{$nom_vendeur}</p>
    <p>{$email_vendeur}</p>
    <p style="margin-top:6px;">{$adresse_vendeur}</p>
  </div>
</div>

<div class="plan-card">
  <div class="plan-nom">{$nom_plan}</div>
  <div class="plan-desc">{$description_plan}</div>
  <div class="dates">
    <div class="date-box"><div class="label">Début</div><div class="val">{$date_debut}</div></div>
    <div class="date-box"><div class="label">Renouvellement</div><div class="val">{$date_fin}</div></div>
  </div>
</div>

<table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
  <thead>
    <tr style="background:#2d6a9f; color:white;">
      <th style="padding:11px 14px; text-align:left; font-size:11px; font-weight:700; text-transform:uppercase;">Description</th>
      <th style="padding:11px 14px; text-align:right; font-size:11px; font-weight:700; text-transform:uppercase;">Montant</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom:1px solid #e1e4e8;">
      <td style="padding:13px 14px;">Abonnement {$nom_plan} — {$date_debut} au {$date_fin}</td>
      <td style="padding:13px 14px; text-align:right; font-weight:700;">{$prix_plan}</td>
    </tr>
  </tbody>
</table>

<div class="totaux">
  <div class="ligne"><span>Sous-total</span><span>{$prix_plan}</span></div>
  <div class="ligne"><span>TPS (5%)</span><span>{$tps}</span></div>
  <div class="ligne"><span>TVQ (9.975%)</span><span>{$tvq}</span></div>
  <div class="ligne total"><span>TOTAL</span><span>{$total}</span></div>
</div>

<div class="note-taxe">
  ℹ️ <strong>Note fiscale :</strong> Les frais d'abonnement à une plateforme de commerce électronique sont assujettis aux taxes (TPS 5% + TVQ 9.975%) conformément à la législation fiscale canadienne et québécoise en vigueur.
</div>

<div style="font-size:12px; color:#374151; margin-bottom:16px;">
  <strong>Paiement :</strong> {$methode_paiement} — <span style="background:#dcfce7; color:#16a34a; padding:2px 10px; border-radius:20px; font-weight:700; font-size:11px;">PAYÉ</span>
</div>

<div class="footer">
  e-Vend.ca — Merci de votre confiance | Questions ? Contactez-nous via la messagerie interne.
</div>

</body>
</html>`,

  packing_slip: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a2332; background: white; padding: 32px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #1a2332; }
  .logo { font-size: 20px; font-weight: 900; color: #2d6a9f; }
  .doc-title { text-align: right; }
  .doc-title h1 { font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
  .doc-title .sub { font-size: 12px; color: #6b7280; margin-top: 3px; }
  .adresses { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .adresse-box { border: 2px solid #1a2332; border-radius: 6px; padding: 14px 16px; }
  .adresse-box h3 { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; background: #1a2332; color: white; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 10px; }
  .adresse-box p { font-size: 13px; line-height: 1.7; }
  .adresse-box .nom { font-weight: 800; font-size: 15px; }
  .infos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; background: #f8fafc; border-radius: 8px; padding: 14px; }
  .info-item .label { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; }
  .info-item .val { font-size: 13px; font-weight: 700; color: #1a2332; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; border: 2px solid #1a2332; }
  thead tr { background: #1a2332; color: white; }
  thead th { padding: 10px 13px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  thead th:last-child { text-align: center; }
  tbody tr { border-bottom: 1px solid #c0c0c0; }
  tbody td { padding: 10px 13px; font-size: 13px; }
  tbody td:last-child { text-align: center; font-weight: 700; font-size: 16px; }
  .footer-slip { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
  .note-box { border: 2px dashed #c0c0c0; border-radius: 6px; padding: 12px 16px; }
  .note-box h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; }
  .signature-box { border: 2px solid #1a2332; border-radius: 6px; padding: 12px 16px; }
  .signature-box h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; }
  .sig-line { border-bottom: 1px solid #1a2332; margin-top: 40px; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">e-Vend.ca</div>
    <div style="font-size:12px; font-weight:700; margin-top:3px;">{$nom_vendeur_boutique}</div>
  </div>
  <div class="doc-title">
    <h1>Bon de livraison</h1>
    <div class="sub">Commande #{$numero_commande} · {$date_commande}</div>
  </div>
</div>

<div class="adresses">
  <div class="adresse-box">
    <h3>📦 Expédié par</h3>
    <p class="nom">{$nom_vendeur_boutique}</p>
    <p>{$adresse_retour}</p>
  </div>
  <div class="adresse-box" style="border-color:#2d6a9f;">
    <h3 style="background:#2d6a9f;">📍 Livrer à</h3>
    <p class="nom">{$nom_acheteur}</p>
    <p>{$adresse_livraison}</p>
    <p style="margin-top:4px; font-weight:700;">{$telephone_acheteur}</p>
  </div>
</div>

<div class="infos">
  <div class="info-item"><div class="label">N° Commande</div><div class="val">#{$numero_commande}</div></div>
  <div class="info-item"><div class="label">Transporteur</div><div class="val">{$methode_livraison}</div></div>
  <div class="info-item"><div class="label">N° Suivi</div><div class="val">{$numero_suivi}</div></div>
  <div class="info-item"><div class="label">Poids total</div><div class="val">{$poids_total}</div></div>
</div>

<table>
  <thead>
    <tr>
      <th>Produit</th>
      <th>SKU</th>
      <th>Description</th>
      <th style="text-align:center;">Qté</th>
    </tr>
  </thead>
  <tbody>
    {$liste_produits}
  </tbody>
  <tfoot>
    <tr style="background:#f8fafc; border-top:2px solid #1a2332;">
      <td colspan="3" style="padding:10px 13px; font-weight:800; text-align:right;">Total articles :</td>
      <td style="padding:10px 13px; text-align:center; font-weight:900; font-size:18px;">{$total_articles}</td>
    </tr>
  </tfoot>
</table>

<div class="footer-slip">
  <div class="note-box">
    <h4>📝 Note du client</h4>
    <p style="font-size:12px; color:#374151; line-height:1.6;">{$note_commande}</p>
  </div>
  <div class="signature-box">
    <h4>✅ Signature autorisée par</h4>
    <div class="sig-line"></div>
    <p style="font-size:10px; color:#6b7280; margin-top:4px;">Nom et signature</p>
  </div>
</div>

</body>
</html>`,

  sommaire_vendeur: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a2332; background: white; padding: 36px; }
  .header { background: linear-gradient(135deg, #1a2332 0%, #2d6a9f 100%); color: white; border-radius: 14px; padding: 24px 30px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
  .header .logo { font-size: 20px; font-weight: 900; }
  .header .logo span { color: #e67e22; }
  .header .titre h1 { font-size: 22px; font-weight: 900; text-align: right; }
  .header .titre .sub { font-size: 12px; opacity: 0.8; margin-top: 3px; text-align: right; }
  .vendeur-bloc { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .bloc { background: #f8fafc; border-radius: 10px; padding: 14px 18px; border-left: 4px solid #2d6a9f; }
  .bloc h3 { font-size: 9px; font-weight: 800; color: #2d6a9f; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .bloc p { font-size: 12px; color: #374151; line-height: 1.6; }
  .bloc .nom { font-weight: 900; font-size: 14px; color: #1a2332; }
  .periode-banner { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
  .periode-banner .per { font-size: 15px; font-weight: 900; color: #2d6a9f; }
  .periode-banner .regime { font-size: 11px; color: #374151; background: white; border: 1px solid #e1e4e8; padding: 4px 12px; border-radius: 20px; font-weight: 700; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .kpi { border-radius: 10px; padding: 14px 16px; }
  .kpi.ventes { background: #eff6ff; border-top: 3px solid #2d6a9f; }
  .kpi.comm { background: #fff7ed; border-top: 3px solid #d97706; }
  .kpi.abo { background: #fdf4ff; border-top: 3px solid #9333ea; }
  .kpi.net { background: #f0fdf4; border-top: 3px solid #16a34a; }
  .kpi .label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 6px; }
  .kpi .val { font-size: 20px; font-weight: 900; }
  .kpi.ventes .val { color: #2d6a9f; }
  .kpi.comm .val { color: #d97706; }
  .kpi.abo .val { color: #9333ea; }
  .kpi.net .val { color: #16a34a; }
  .kpi .sub { font-size: 10px; color: #6b7280; margin-top: 3px; }
  .section-title { font-size: 12px; font-weight: 800; color: #1a2332; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #2d6a9f; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 11px; }
  thead tr { background: #2d6a9f; color: white; }
  thead th { padding: 9px 11px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; }
  thead th.r { text-align: right; }
  tbody tr { border-bottom: 1px solid #e1e4e8; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody td { padding: 8px 11px; }
  tbody td.r { text-align: right; }
  tfoot tr { background: #1a2332; color: white; }
  tfoot td { padding: 9px 11px; font-weight: 800; font-size: 11px; }
  tfoot td.r { text-align: right; }
  .taxes-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; }
  .taxes-box h3 { font-size: 11px; font-weight: 800; color: #92400e; text-transform: uppercase; margin-bottom: 12px; }
  .taxes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px; }
  .tax-item { background: white; border-radius: 8px; padding: 10px 14px; border-top: 2px solid #fde68a; }
  .tax-item .t-label { font-size: 9px; font-weight: 700; color: #92400e; text-transform: uppercase; margin-bottom: 5px; }
  .tax-item .t-val { font-size: 16px; font-weight: 900; color: #1a2332; }
  .tax-item .t-taux { font-size: 10px; color: #6b7280; margin-top: 2px; }
  .taxes-total { background: #92400e; color: white; border-radius: 8px; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; }
  .taxes-total .label { font-size: 11px; font-weight: 700; }
  .taxes-total .val { font-size: 18px; font-weight: 900; }
  .deductions-box { background: #f8fafc; border: 1px solid #e1e4e8; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; }
  .deductions-box h3 { font-size: 11px; font-weight: 800; color: #374151; text-transform: uppercase; margin-bottom: 12px; }
  .ded-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .ded-item { background: white; border-radius: 8px; padding: 10px 14px; border-left: 3px solid #e1e4e8; }
  .ded-item.comm { border-left-color: #d97706; }
  .ded-item.abo { border-left-color: #9333ea; }
  .ded-item .d-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #6b7280; margin-bottom: 6px; }
  .ded-item .d-ht { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px; }
  .ded-item .d-tax { display: flex; justify-content: space-between; font-size: 10px; color: #6b7280; margin-bottom: 3px; }
  .ded-item .d-total { display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; margin-top: 4px; padding-top: 4px; border-top: 1px solid #e1e4e8; }
  .bilan { background: linear-gradient(135deg, #16a34a, #15803d); color: white; border-radius: 12px; padding: 20px 26px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; }
  .bilan .label { font-size: 12px; font-weight: 700; opacity: 0.9; }
  .bilan .detail { font-size: 10px; opacity: 0.8; margin-top: 4px; }
  .bilan .montant { font-size: 32px; font-weight: 900; }
  .note-fiscale { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-top: 16px; font-size: 10px; color: #14532d; line-height: 1.6; }
  .footer { margin-top: 24px; padding-top: 14px; border-top: 1px solid #e1e4e8; font-size: 10px; color: #6b7280; text-align: center; }
</style>
</head>
<body>

<div class="header">
  <div class="logo">e<span>-</span>Vend.ca</div>
  <div class="titre">
    <h1>Sommaire mensuel vendeur</h1>
    <div class="sub">Émis le {$date_emission}</div>
  </div>
</div>

<div class="vendeur-bloc">
  <div class="bloc">
    <h3>Vendeur</h3>
    <p class="nom">{$nom_vendeur}</p>
    <p>🏪 {$nom_boutique_vendeur}</p>
    <p style="margin-top:6px;">{$adresse_vendeur}</p>
    <p style="margin-top:4px; font-size:10px; color:#6b7280;">TPS : {$no_tps_vendeur} · TVQ : {$no_tvq_vendeur}</p>
  </div>
  <div class="bloc" style="border-left-color:#16a34a;">
    <h3>e-Vend.ca — Émetteur</h3>
    <p class="nom">{$nom_boutique}</p>
    <p>Plateforme de commerce en ligne<br>Québec, Canada</p>
  </div>
</div>

<div class="periode-banner">
  <div>
    <div style="font-size:10px; font-weight:700; color:#6b7280; text-transform:uppercase; margin-bottom:3px;">Période</div>
    <div class="per">{$periode_mois}</div>
  </div>
  <div>
    <div style="font-size:10px; font-weight:700; color:#6b7280; text-transform:uppercase; margin-bottom:3px;">Province</div>
    <div style="font-size:13px; font-weight:800; color:#1a2332;">{$province_vendeur}</div>
  </div>
  <div class="regime">Régime fiscal : {$regime_taxes_vendeur}</div>
</div>

<div class="kpis">
  <div class="kpi ventes">
    <div class="label">Ventes brutes (HT)</div>
    <div class="val">{$total_ventes_brut}</div>
    <div class="sub">{$nb_commandes} commandes</div>
  </div>
  <div class="kpi comm">
    <div class="label">Commissions ({$taux_commission}%)</div>
    <div class="val">{$total_commissions}</div>
    <div class="sub">Frais de vente e-Vend</div>
  </div>
  <div class="kpi abo">
    <div class="label">Abonnement</div>
    <div class="val">{$total_abonnement}</div>
    <div class="sub">Plan mensuel (HT)</div>
  </div>
  <div class="kpi net">
    <div class="label">Gain net</div>
    <div class="val">{$total_net}</div>
    <div class="sub">Après toutes déductions</div>
  </div>
</div>

<!-- ═══ SECTION TAXES ═══ -->
<div class="section-title">🧾 Récapitulatif des taxes perçues sur vos ventes</div>
<div class="taxes-box">
  <h3>Taxes collectées auprès de vos acheteurs</h3>
  <div class="taxes-grid">
    <div class="tax-item" style="border-top-color:#2d6a9f;">
      <div class="t-label">TPS + TVH — Fédéral & Harmonisée</div>
      <div class="t-val">{$total_tps_percue}</div>
      <div style="margin-top:6px; padding-top:6px; border-top:1px dashed #e1e4e8;">
        <div class="t-label" style="margin-top:0;">TPS seule (5%)</div>
        <div style="font-size:13px; font-weight:800; color:#1a2332; margin-bottom:3px;">{$total_tps_percue}</div>
        <div class="t-taux">Fédéral · Applicable partout au Canada</div>
      </div>
      <div style="margin-top:6px; padding-top:6px; border-top:1px dashed #e1e4e8;">
        <div class="t-label" style="margin-top:0;">TVH (13–15%)</div>
        <div style="font-size:13px; font-weight:800; color:#1a2332; margin-bottom:3px;">{$total_tvh_percue}</div>
        <div class="t-taux">ON, NB, NS, NL, PE · Remplace TPS+taxe prov.</div>
      </div>
    </div>
    <div class="tax-item" style="border-top-color:#c2410c;">
      <div class="t-label">TVQ — Taxe de vente du Québec</div>
      <div class="t-val">{$total_tvq_percue}</div>
      <div class="t-taux" style="margin-top:6px;">Taux : 9.975%</div>
      <div class="t-taux">Applicable au Québec seulement</div>
      <div class="t-taux" style="margin-top:6px; color:#c2410c; font-weight:700;">⚠️ S'ajoute à la TPS pour le Québec</div>
    </div>
  </div>
  <div class="taxes-total">
    <div class="label">Total toutes taxes perçues</div>
    <div class="val">{$total_taxes_percues}</div>
  </div>
</div>

<div class="section-title">📋 Détail des commandes</div>
<table>
  <thead>
    <tr>
      <th>N° Commande</th>
      <th>Date</th>
      <th>Produit(s)</th>
      <th>Statut</th>
      <th class="r">Vente HT</th>
      <th class="r">TPS</th>
      <th class="r">TVQ/TVH</th>
      <th class="r">Total TTC</th>
      <th class="r">Commission</th>
      <th class="r">Net</th>
    </tr>
  </thead>
  <tbody>{$tableau_commandes}</tbody>
  <tfoot>
    <tr>
      <td colspan="4">TOTAL</td>
      <td class="r">{$total_ventes_brut}</td>
      <td class="r">{$total_tps_percue}</td>
      <td class="r">{$total_tvq_percue}</td>
      <td class="r">{$total_ventes_ttc}</td>
      <td class="r">- {$total_commissions}</td>
      <td class="r">{$total_net}</td>
    </tr>
  </tfoot>
</table>

<!-- ═══ DÉDUCTIONS ═══ -->
<div class="section-title">💸 Détail des déductions e-Vend</div>
<div class="deductions-box">
  <h3>Frais facturés par e-Vend ce mois</h3>
  <div class="ded-grid">
    <div class="ded-item comm">
      <div class="d-label">Commissions sur ventes ({$taux_commission}%)</div>
      <div class="d-ht"><span>Commissions HT</span><span>{$total_commissions}</span></div>
      <div class="d-tax"><span>TPS sur commissions</span><span>{$tps_commission}</span></div>
      <div class="d-tax"><span>TVQ sur commissions</span><span>{$tvq_commission}</span></div>
      <div class="d-total"><span>Total commissions TTC</span><span>{$total_commissions}</span></div>
    </div>
    <div class="ded-item abo">
      <div class="d-label">Abonnement / Plan mensuel</div>
      <div class="d-ht"><span>Abonnement HT</span><span>{$total_abonnement}</span></div>
      <div class="d-tax"><span>TPS (5%)</span><span>{$tps_abonnement}</span></div>
      <div class="d-tax"><span>TVQ (9.975%)</span><span>{$tvq_abonnement}</span></div>
      <div class="d-total"><span>Total abonnement TTC</span><span>{$total_abonnement_ttc}</span></div>
    </div>
  </div>
</div>

<div class="section-title">💳 Virements reçus</div>
<table>
  <thead>
    <tr><th>Date</th><th>Référence</th><th>Description</th><th class="r">Montant</th></tr>
  </thead>
  <tbody>{$tableau_paiements}</tbody>
</table>

<div class="section-title">⭐ Produit top vente du mois</div>
<div style="background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:10px 14px; font-size:12px; color:#92400e; margin-bottom:4px;">{$produit_top_vente}</div>

<div class="bilan">
  <div>
    <div class="label">🏆 Gain net total — {$periode_mois}</div>
    <div class="detail">Ventes {$total_ventes_brut} − Commissions {$total_commissions} − Abonnement {$total_abonnement_ttc} − Remboursements {$total_remboursements}</div>
  </div>
  <div class="montant">{$total_net}</div>
</div>

<div class="note-fiscale">
  📌 <strong>Note fiscale :</strong> {$note_fiscale}<br>
  Si vous êtes inscrit aux fichiers de taxes (TPS/TVQ), vous devez remettre les taxes perçues aux autorités fiscales (CRA/Revenu Québec). Ce document peut servir de base à votre comptabilité. Consultez votre comptable pour votre situation spécifique.
</div>

<div class="footer">
  e-Vend.ca — Sommaire mensuel généré automatiquement le {$date_emission} | Ce document est fourni à titre informatif et non comme avis fiscal officiel.
</div>

</body>
</html>`,

  sommaire_acheteur: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a2332; background: white; padding: 36px; }
  .header { background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); color: white; border-radius: 14px; padding: 24px 30px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
  .header .logo { font-size: 20px; font-weight: 900; }
  .header .titre h1 { font-size: 22px; font-weight: 900; text-align: right; }
  .header .titre .sub { font-size: 12px; opacity: 0.8; margin-top: 3px; text-align: right; }
  .acheteur-bloc { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .bloc { background: #f8fafc; border-radius: 10px; padding: 14px 18px; border-left: 4px solid #0891b2; }
  .bloc h3 { font-size: 9px; font-weight: 800; color: #0891b2; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .bloc p { font-size: 12px; color: #374151; line-height: 1.6; }
  .bloc .nom { font-weight: 900; font-size: 14px; color: #1a2332; }
  .periode-banner { background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 8px; padding: 12px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
  .periode-banner .per { font-size: 15px; font-weight: 900; color: #0891b2; }
  .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .kpi { border-radius: 10px; padding: 14px 16px; }
  .kpi.achats { background: #ecfeff; border-top: 3px solid #0891b2; }
  .kpi.rembours { background: #f0fdf4; border-top: 3px solid #16a34a; }
  .kpi.net { background: #eff6ff; border-top: 3px solid #2d6a9f; }
  .kpi .label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #6b7280; margin-bottom: 6px; }
  .kpi .val { font-size: 20px; font-weight: 900; }
  .kpi.achats .val { color: #0891b2; }
  .kpi.rembours .val { color: #16a34a; }
  .kpi.net .val { color: #2d6a9f; }
  .kpi .sub { font-size: 10px; color: #6b7280; margin-top: 3px; }
  .section-title { font-size: 12px; font-weight: 800; color: #1a2332; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #0891b2; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 11px; }
  thead tr { background: #0891b2; color: white; }
  thead th { padding: 9px 11px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; }
  thead th.r { text-align: right; }
  tbody tr { border-bottom: 1px solid #e1e4e8; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody td { padding: 8px 11px; }
  tbody td.r { text-align: right; }
  tfoot tr { background: #1a2332; color: white; }
  tfoot td { padding: 9px 11px; font-weight: 800; }
  tfoot td.r { text-align: right; }
  .taxes-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; }
  .taxes-box h3 { font-size: 11px; font-weight: 800; color: #92400e; text-transform: uppercase; margin-bottom: 12px; }
  .taxes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px; }
  .tax-item { background: white; border-radius: 8px; padding: 10px 14px; border-top: 2px solid #fde68a; }
  .tax-item .t-label { font-size: 9px; font-weight: 700; color: #92400e; text-transform: uppercase; margin-bottom: 5px; }
  .tax-item .t-val { font-size: 16px; font-weight: 900; color: #1a2332; }
  .tax-item .t-taux { font-size: 10px; color: #6b7280; margin-top: 2px; }
  .taxes-total { background: #92400e; color: white; border-radius: 8px; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; }
  .taxes-total .label { font-size: 11px; font-weight: 700; }
  .taxes-total .val { font-size: 18px; font-weight: 900; }
  .bilan { background: linear-gradient(135deg, #0891b2, #0e7490); color: white; border-radius: 12px; padding: 20px 26px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; }
  .bilan .label { font-size: 12px; font-weight: 700; opacity: 0.9; }
  .bilan .detail { font-size: 10px; opacity: 0.8; margin-top: 4px; }
  .bilan .montant { font-size: 32px; font-weight: 900; }
  .note-fiscale { background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 8px; padding: 12px 16px; margin-top: 16px; font-size: 10px; color: #164e63; line-height: 1.6; }
  .footer { margin-top: 24px; padding-top: 14px; border-top: 1px solid #e1e4e8; font-size: 10px; color: #6b7280; text-align: center; }
</style>
</head>
<body>

<div class="header">
  <div class="logo">e-Vend.ca</div>
  <div class="titre">
    <h1>Sommaire mensuel acheteur</h1>
    <div class="sub">Émis le {$date_emission}</div>
  </div>
</div>

<div class="acheteur-bloc">
  <div class="bloc">
    <h3>Acheteur</h3>
    <p class="nom">{$nom_acheteur}</p>
    <p>{$email_acheteur}</p>
    <p style="margin-top:6px;">{$adresse_facturation}</p>
    <p style="font-size:10px; color:#6b7280; margin-top:4px;">Province : {$province_acheteur}</p>
  </div>
  <div class="bloc" style="border-left-color:#0891b2;">
    <h3>e-Vend.ca</h3>
    <p class="nom">{$nom_boutique}</p>
    <p>Plateforme de commerce en ligne<br>Québec, Canada</p>
  </div>
</div>

<div class="periode-banner">
  <div>
    <div style="font-size:10px; font-weight:700; color:#6b7280; text-transform:uppercase; margin-bottom:3px;">Période</div>
    <div class="per">{$periode_mois}</div>
  </div>
  <div>
    <div style="font-size:10px; font-weight:700; color:#6b7280; text-transform:uppercase; margin-bottom:3px;">Province</div>
    <div style="font-size:13px; font-weight:800; color:#1a2332;">{$province_acheteur}</div>
  </div>
</div>

<div class="kpis">
  <div class="kpi achats">
    <div class="label">Total achats TTC</div>
    <div class="val">{$total_achats}</div>
    <div class="sub">{$nb_commandes} commandes · {$total_achats_ht} avant taxes</div>
  </div>
  <div class="kpi rembours">
    <div class="label">Remboursements reçus</div>
    <div class="val">{$total_remboursements}</div>
    <div class="sub">Taxes remboursées : {$taxes_remboursees}</div>
  </div>
  <div class="kpi net">
    <div class="label">Net dépensé</div>
    <div class="val">{$net_depense}</div>
    <div class="sub">Après remboursements</div>
  </div>
</div>

<!-- ═══ SECTION TAXES ═══ -->
<div class="section-title">🧾 Récapitulatif des taxes payées</div>
<div class="taxes-box">
  <h3>Taxes payées sur vos achats ce mois</h3>
  <div class="taxes-grid">
    <div class="tax-item" style="border-top-color:#0891b2;">
      <div class="t-label">TPS + TVH — Fédéral & Harmonisée</div>
      <div class="t-val">{$total_tps_payee}</div>
      <div style="margin-top:6px; padding-top:6px; border-top:1px dashed #e1e4e8;">
        <div class="t-label" style="margin-top:0;">TPS seule (5%)</div>
        <div style="font-size:13px; font-weight:800; color:#1a2332; margin-bottom:3px;">{$total_tps_payee}</div>
        <div class="t-taux">Fédéral · Applicable partout au Canada</div>
      </div>
      <div style="margin-top:6px; padding-top:6px; border-top:1px dashed #e1e4e8;">
        <div class="t-label" style="margin-top:0;">TVH (13–15%)</div>
        <div style="font-size:13px; font-weight:800; color:#1a2332; margin-bottom:3px;">{$total_tvh_payee}</div>
        <div class="t-taux">ON, NB, NS, NL, PE · Remplace TPS+taxe prov.</div>
      </div>
    </div>
    <div class="tax-item" style="border-top-color:#c2410c;">
      <div class="t-label">TVQ — Taxe de vente du Québec</div>
      <div class="t-val">{$total_tvq_payee}</div>
      <div class="t-taux" style="margin-top:6px;">Taux : 9.975%</div>
      <div class="t-taux">Applicable au Québec seulement</div>
      <div class="t-taux" style="margin-top:6px; color:#c2410c; font-weight:700;">⚠️ S'ajoute à la TPS pour le Québec</div>
    </div>
  </div>
  <div class="taxes-total">
    <div class="label">Total toutes taxes payées</div>
    <div class="val">{$total_taxes_payees}</div>
  </div>
</div>

<div class="section-title">📋 Détail de vos commandes</div>
<table>
  <thead>
    <tr>
      <th>N° Commande</th>
      <th>Date</th>
      <th>Boutique</th>
      <th>Statut</th>
      <th class="r">Montant HT</th>
      <th class="r">TPS</th>
      <th class="r">TVQ/TVH</th>
      <th class="r">Total TTC</th>
    </tr>
  </thead>
  <tbody>{$tableau_commandes}</tbody>
  <tfoot>
    <tr>
      <td colspan="4">TOTAL</td>
      <td class="r">{$total_achats_ht}</td>
      <td class="r">{$total_tps_payee}</td>
      <td class="r">{$total_tvq_payee}</td>
      <td class="r">{$total_achats}</td>
    </tr>
  </tfoot>
</table>

<div class="bilan">
  <div>
    <div class="label">💳 Net dépensé — {$periode_mois}</div>
    <div class="detail">Achats TTC {$total_achats} − Remboursements {$total_remboursements}</div>
    <div class="detail" style="margin-top:3px;">Dont taxes payées : {$total_taxes_payees} · Taxes remboursées : {$taxes_remboursees}</div>
  </div>
  <div class="montant">{$net_depense}</div>
</div>

<div class="note-fiscale">
  📌 <strong>Note :</strong> {$note_fiscale}<br>
  Les taxes indiquées correspondent aux taxes perçues par les vendeurs. Les vendeurs non inscrits aux fichiers de taxes (TPS/TVQ) ne perçoivent pas de taxes — dans ce cas, les montants ci-dessus seront à 0,00 $. Ce document peut servir à votre comptabilité personnelle ou d'entreprise.
</div>

<div class="footer">
  e-Vend.ca — Sommaire mensuel généré automatiquement le {$date_emission} | Ce document est fourni à titre informatif uniquement.
</div>

</body>
</html>`,
};

// ── Documents config ────────────────────────────────────────────────────────
const DOCS_CONFIG: Document[] = [
  {
    id: 'facture_acheteur',
    nom: 'Facture acheteur',
    icon: '🛒',
    description: 'Facture envoyée à l\'acheteur lors d\'une commande',
    couleurAccent: '#2d6a9f',
    html: HTML_DEFAUT.facture_acheteur,
  },
  {
    id: 'commission_vendeur',
    nom: 'Frais de commission',
    icon: '💼',
    description: 'Facture de commission mensuelle envoyée au vendeur',
    couleurAccent: '#d97706',
    html: HTML_DEFAUT.commission_vendeur,
  },
  {
    id: 'abonnement_vendeur',
    nom: 'Facture abonnement',
    icon: '📋',
    description: 'Facture de plan/abonnement pour le vendeur',
    couleurAccent: '#7c3aed',
    html: HTML_DEFAUT.abonnement_vendeur,
  },
  {
    id: 'packing_slip',
    nom: 'Bon de livraison',
    icon: '📦',
    description: 'Bon de livraison (packing slip) inclus dans le colis',
    couleurAccent: '#1a2332',
    html: HTML_DEFAUT.packing_slip,
  },
  {
    id: 'sommaire_vendeur',
    nom: 'Sommaire vendeur',
    icon: '📊',
    description: 'Sommaire mensuel complet pour le vendeur',
    couleurAccent: '#16a34a',
    html: HTML_DEFAUT.sommaire_vendeur,
  },
  {
    id: 'sommaire_acheteur',
    nom: 'Sommaire acheteur',
    icon: '🧾',
    description: 'Sommaire mensuel des achats pour l\'acheteur',
    couleurAccent: '#0891b2',
    html: HTML_DEFAUT.sommaire_acheteur,
  },
];

// ── Toast ───────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'danger' | 'info' }) {
  const bg = { success: T.success, danger: T.danger, info: T.accent }[type];
  return (
    <div style={{ position: 'fixed', top: '24px', right: '24px', backgroundColor: bg, color: 'white', padding: '14px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
      {msg}
    </div>
  );
}

// ── Composant principal ─────────────────────────────────────────────────────
export default function ModelesDocument({ naviguerVers }: { naviguerVers: (p: string, d?: any) => void }) {
  const [docs, setDocs] = useState<Document[]>(DOCS_CONFIG);
  const [docActif, setDocActif] = useState<DocType>('facture_acheteur');
  const [onglet, setOnglet] = useState<'editeur' | 'apercu' | 'variables'>('apercu');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'danger' | 'info' } | null>(null);
  const [modifie, setModifie] = useState(false);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [chargement, setChargement] = useState(true);
  const token = localStorage.getItem('token');

  const doc = docs.find(d => d.id === docActif)!;
  const vars = VARIABLES[docActif];

  // Charger les modèles depuis la BD au démarrage
  useEffect(() => {
    const chargerModeles = async () => {
      try {
        const response = await fetch(`${API}/api/admin/modeles-documents`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Mettre à jour les docs avec les templates de la BD
          setDocs(prev => prev.map(doc => ({
            ...doc,
            html: data[doc.id] || doc.html
          })));
        }
      } catch (error) {
        console.error('Erreur chargement modèles:', error);
        showToast('❌ Erreur chargement des modèles', 'danger');
      } finally {
        setChargement(false);
      }
    };

    chargerModeles();
  }, [token]);

  const showToast = (msg: string, type: 'success' | 'danger' | 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const updateHtml = useCallback((html: string) => {
    setDocs(prev => prev.map(d => d.id === docActif ? { ...d, html } : d));
    setModifie(true);
  }, [docActif]);

  // Sauvegarder dans la BD
  const sauvegarder = async () => {
    setSauvegardeEnCours(true);
    try {
      const response = await fetch(`${API}/api/admin/modeles-documents/${docActif}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ html: doc.html })
      });

      if (response.ok) {
        setModifie(false);
        showToast(`✅ Modèle "${doc.nom}" sauvegardé avec succès !`, 'success');
      } else {
        throw new Error('Erreur sauvegarde');
      }
    } catch (error) {
      showToast(`❌ Erreur lors de la sauvegarde`, 'danger');
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const reinitialiser = () => {
    setDocs(prev => prev.map(d => d.id === docActif ? { ...d, html: HTML_DEFAUT[docActif] } : d));
    setModifie(false);
    showToast('🔄 Modèle réinitialisé au contenu original.', 'info');
  };

  // Exporter en PDF
  const exporterPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(doc.html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  // Générer un aperçu avec des données de test
  const genererApercuAvecDonnees = () => {
    let htmlAvecDonnees = doc.html;
    vars.forEach(v => {
      const valeurTest = v.cle.includes('montant') || v.cle.includes('total') || v.cle.includes('prix') ? '123,45 $' : 
                         v.cle.includes('date') ? '16/03/2026' : 
                         v.cle.includes('nom') || v.cle.includes('boutique') ? 'Jean Test' : 
                         v.cle.includes('email') ? 'test@email.com' : 
                         v.cle.includes('adresse') ? '123 rue Principale, Québec, QC G1V 2M2' : 
                         v.cle.includes('tps') || v.cle.includes('tvq') ? '5,00 $' :
                         v.cle.includes('numero') ? 'ABC-123' :
                         v.exemple;
      htmlAvecDonnees = htmlAvecDonnees.replace(new RegExp(v.cle.replace(/\$/g, '\\$'), 'g'), valeurTest);
    });
    return htmlAvecDonnees;
  };

  const insererVariable = (cle: string) => {
    const ta = document.getElementById('html-editor') as HTMLTextAreaElement;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newHtml = doc.html.substring(0, start) + cle + doc.html.substring(end);
    updateHtml(newHtml);
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + cle.length; ta.focus(); }, 0);
  };

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${T.border}`, borderRadius: '8px', padding: '8px 12px',
    fontSize: '12px', outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  if (chargement) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: T.bg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(45,106,159,0.3)', borderTop: `3px solid ${T.accent}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: T.textLight }}>Chargement des modèles...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ display: 'flex', height: '100vh', backgroundColor: T.bg, overflow: 'hidden' }}>

        {/* ── Sidebar documents ── */}
        <div style={{ width: '220px', backgroundColor: T.card, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '16px 14px 10px', borderBottom: `1px solid ${T.border}` }}>
            <h2 style={{ fontSize: '12px', fontWeight: '900', color: T.accent, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Modèles documents</h2>
            <p style={{ fontSize: '10px', color: T.textLight, margin: '3px 0 0 0' }}>6 types de documents</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' as const, padding: '8px' }}>
            {docs.map(d => (
              <div key={d.id} onClick={() => { setDocActif(d.id); setOnglet('apercu'); }}
                style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '3px', backgroundColor: docActif === d.id ? d.couleurAccent : 'transparent', color: docActif === d.id ? 'white' : T.text, transition: 'all 0.15s' }}
                onMouseEnter={e => { if (docActif !== d.id) (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6'; }}
                onMouseLeave={e => { if (docActif !== d.id) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{d.icon}</span>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '800', margin: 0 }}>{d.nom}</p>
                    <p style={{ fontSize: '10px', margin: 0, opacity: docActif === d.id ? 0.8 : 0.6 }}>{d.description.substring(0, 35)}...</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px', borderTop: `1px solid ${T.border}`, backgroundColor: '#f8fafc' }}>
            <p style={{ fontSize: '10px', color: T.textLight, lineHeight: '1.5', margin: 0 }}>
              💡 Les modifications deviennent le modèle par défaut pour tous les utilisateurs.
            </p>
          </div>
        </div>

        {/* ── Zone principale ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* En-tête */}
          <div style={{ backgroundColor: T.card, borderBottom: `1px solid ${T.border}`, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '22px' }}>{doc.icon}</span>
              <div>
                <h1 style={{ fontSize: '16px', fontWeight: '900', margin: 0, color: T.text }}>{doc.nom}</h1>
                <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>{doc.description}</p>
              </div>
              {modifie && (
                <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                  ● Non sauvegardé
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Onglets */}
              <div style={{ display: 'flex', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '3px' }}>
                {([['apercu', '👁 Aperçu'], ['editeur', '✏️ Éditeur HTML'], ['variables', '📋 Variables']] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setOnglet(id)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: onglet === id ? 'white' : 'transparent', color: onglet === id ? T.text : T.textLight, fontSize: '11px', fontWeight: '700', cursor: 'pointer', boxShadow: onglet === id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                    {label}
                  </button>
                ))}
              </div>
              <button onClick={exporterPDF}
                style={{ backgroundColor: 'white', color: T.textLight, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                🖨️ PDF
              </button>
              <button onClick={reinitialiser}
                style={{ backgroundColor: 'white', color: T.textLight, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                🔄 Réinitialiser
              </button>
              <button onClick={sauvegarder} disabled={sauvegardeEnCours || !modifie}
                style={{ backgroundColor: T.success, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '12px', fontWeight: '800', cursor: (sauvegardeEnCours || !modifie) ? 'not-allowed' : 'pointer', opacity: (sauvegardeEnCours || !modifie) ? 0.5 : 1 }}>
                {sauvegardeEnCours ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
              </button>
            </div>
          </div>

          {/* Contenu */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

            {/* ── ÉDITEUR HTML ── */}
            {onglet === 'editeur' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '10px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#1e1e1e', borderRadius: '10px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f57' }} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#febc2e' }} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#28c840' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: '#888', fontFamily: 'monospace' }}>{doc.nom.toLowerCase().replace(/ /g, '_')}.html</span>
                  <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#666' }}>{doc.html.length} caractères</span>
                </div>
                <textarea
                  id="html-editor"
                  value={doc.html}
                  onChange={e => updateHtml(e.target.value)}
                  spellCheck={false}
                  style={{ flex: 1, backgroundColor: '#1e1e1e', color: '#d4d4d4', border: 'none', borderRadius: '10px', padding: '16px', fontFamily: "'Courier New', monospace", fontSize: '12px', lineHeight: '1.6', resize: 'none', outline: 'none', tabSize: 2 }}
                />
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', fontSize: '11px', color: '#92400e', flexShrink: 0 }}>
                  💡 <strong>Astuce :</strong> Les variables entre <code style={{ backgroundColor: '#fef3c7', padding: '1px 5px', borderRadius: '4px' }}>{'{$variable}'}</code> seront remplacées automatiquement par les vraies données. Cliquez sur "Variables" pour voir la liste et les insérer.
                </div>
              </div>
            )}

            {/* ── APERÇU ── */}
            {onglet === 'apercu' && (
              <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
                <div style={{ backgroundColor: '#525659', borderRadius: '10px', padding: '16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f57' }} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#febc2e' }} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#28c840' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: '#aaa' }}>Aperçu avec données de test</span>
                  <span style={{ fontSize: '10px', color: '#888', marginLeft: 'auto' }}>Variables remplacées par des exemples</span>
                </div>
                <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', overflow: 'hidden', maxWidth: '900px', margin: '0 auto' }}>
                  <iframe
                    srcDoc={genererApercuAvecDonnees()}
                    title="apercu"
                    style={{ width: '100%', height: '700px', border: 'none', display: 'block' }}
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )}

            {/* ── VARIABLES ── */}
            {onglet === 'variables' && (
              <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                  <div style={{ backgroundColor: T.accentLight, border: `1px solid #bfdbfe`, borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
                    <p style={{ fontSize: '13px', color: T.accent, fontWeight: '700', margin: '0 0 4px 0' }}>📋 Variables disponibles pour : {doc.nom}</p>
                    <p style={{ fontSize: '12px', color: T.textLight, margin: 0 }}>Cliquez sur une variable pour l'insérer à la position du curseur dans l'éditeur. Ces variables seront remplacées par les vraies données au moment de la génération du document.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {vars.map((v, i) => (
                      <div key={i}
                        onClick={() => { insererVariable(v.cle); setOnglet('editeur'); showToast(`Variable ${v.cle} insérée !`, 'success'); }}
                        style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '12px 16px', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.accent; (e.currentTarget as HTMLElement).style.backgroundColor = T.accentLight; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.backgroundColor = T.card; }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <code style={{ fontSize: '12px', fontWeight: '800', color: T.accent, backgroundColor: T.accentLight, padding: '2px 8px', borderRadius: '6px' }}>{v.cle}</code>
                            <p style={{ fontSize: '11px', color: T.textLight, margin: '6px 0 2px 0' }}>{v.description}</p>
                            <p style={{ fontSize: '10px', color: '#aaa', margin: 0 }}>Ex: {v.exemple}</p>
                          </div>
                          <span style={{ fontSize: '16px', marginLeft: '8px', flexShrink: 0 }}>+</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
