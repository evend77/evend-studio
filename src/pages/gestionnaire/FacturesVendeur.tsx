import React, { useState, useMemo } from 'react';

const T = {
  accent: '#2d6a9f', accentLight: '#e8f2fb',
  bg: '#f0f2f5', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  success: '#16a34a', warning: '#d97706', danger: '#dc2626',
};

type StatutFacture = 'payée' | 'remboursée' | 'annulée' | 'en attente';

interface LigneFacture {
  description: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
}

interface FactureAcheteur {
  id: number;
  noFacture: string;
  noCommande: string;
  dateFacture: string;
  // Émetteur (vendeur)
  nomVendeur: string;
  adresseVendeur: string;
  villeVendeur: string;
  provinceVendeur: string;
  codePostalVendeur: string;
  noTPS: string;
  noTVQ: string;
  // Receveur (acheteur)
  nomAcheteur: string;
  adresseAcheteur: string;
  villeAcheteur: string;
  provinceAcheteur: string;
  codePostalAcheteur: string;
  // Lignes
  lignes: LigneFacture[];
  // Totaux
  sousTotal: number;
  tps: number;
  tvq: number;
  tvh: number;
  total: number;
  methodePaiement: 'Stripe' | 'PayPal';
  statut: StatutFacture;
}

interface FactureVendeur {
  id: number;
  noFacture: string;
  dateFacture: string;
  dateEcheance: string;
  type: 'Commission' | 'Abonnement';
  // Émetteur (e-Vend)
  noTPSEvend: string;
  noTVQEvend: string;
  // Receveur (vendeur)
  nomVendeur: string;
  adresseVendeur: string;
  villeVendeur: string;
  provinceVendeur: string;
  codePostalVendeur: string;
  noTPSVendeur: string;
  noTVQVendeur: string;
  // Lignes
  lignes: LigneFacture[];
  // Totaux
  sousTotal: number;
  tps: number;
  tvq: number;
  tvh: number;
  total: number;
  statut: StatutFacture;
  periodeDebut?: string;
  periodeFin?: string;
  noCommandes?: string[];
}

// ── Données fictives réalistes ────────────────────────────────────────────
const FACTURES_ACHETEUR: FactureAcheteur[] = [
  {
    id:1, noFacture:'FAC-2026-0412', noCommande:'CMD-8841', dateFacture:'2026-02-18',
    nomVendeur:'Créations Artisanales Dubois', adresseVendeur:'845, rue des Érables', villeVendeur:'Québec', provinceVendeur:'QC', codePostalVendeur:'G1R 2K7',
    noTPS:'RT123456789', noTVQ:'1234567890TQ0001',
    nomAcheteur:'Marie-Ève Tremblay', adresseAcheteur:'230, avenue Cartier', villeAcheteur:'Montréal', provinceAcheteur:'QC', codePostalAcheteur:'H2K 1H5',
    lignes:[
      { description:'Couronne de Noël artisanale — pin naturel, baies rouges, ruban bordeaux', quantite:1, prixUnitaire:42.99, total:42.99 },
      { description:'Bougie parfumée — Sapin & Cannelle, 200g, pot en verre', quantite:2, prixUnitaire:8.00,  total:16.00 },
    ],
    sousTotal:58.99, tps:2.95, tvq:5.88, tvh:0, total:67.82, methodePaiement:'Stripe', statut:'payée',
  },
  {
    id:2, noFacture:'FAC-2026-0408', noCommande:'CMD-8829', dateFacture:'2026-02-15',
    nomVendeur:'Créations Artisanales Dubois', adresseVendeur:'845, rue des Érables', villeVendeur:'Québec', provinceVendeur:'QC', codePostalVendeur:'G1R 2K7',
    noTPS:'RT123456789', noTVQ:'1234567890TQ0001',
    nomAcheteur:'Jean-François Bouchard', adresseAcheteur:'1420, boul. Saint-Laurent', villeAcheteur:'Laval', provinceAcheteur:'QC', codePostalAcheteur:'H7S 1Z8',
    lignes:[
      { description:'Table de chevet en bois de pin massif — finition naturelle, 1 tiroir', quantite:1, prixUnitaire:89.50, total:89.50 },
      { description:'Set de 2 lampes de table — abat-jour tissu beige, base céramique', quantite:1, prixUnitaire:35.00, total:35.00 },
    ],
    sousTotal:124.50, tps:6.23, tvq:12.41, tvh:0, total:143.14, methodePaiement:'PayPal', statut:'payée',
  },
  {
    id:3, noFacture:'FAC-2026-0401', noCommande:'CMD-8810', dateFacture:'2026-02-10',
    nomVendeur:'Créations Artisanales Dubois', adresseVendeur:'845, rue des Érables', villeVendeur:'Québec', provinceVendeur:'QC', codePostalVendeur:'G1R 2K7',
    noTPS:'RT123456789', noTVQ:'1234567890TQ0001',
    nomAcheteur:'Sophie Lapointe', adresseAcheteur:'88 King Street West', villeAcheteur:'Toronto', provinceAcheteur:'ON', codePostalAcheteur:'M5H 1A1',
    lignes:[
      { description:'Écharpe tricotée main — laine mérinos 100%, coloris gris charbon', quantite:1, prixUnitaire:34.00, total:34.00 },
    ],
    sousTotal:34.00, tps:1.70, tvq:0, tvh:4.42, total:40.12, methodePaiement:'Stripe', statut:'payée',
  },
  {
    id:4, noFacture:'FAC-2026-0395', noCommande:'CMD-8795', dateFacture:'2026-02-06',
    nomVendeur:'Créations Artisanales Dubois', adresseVendeur:'845, rue des Érables', villeVendeur:'Québec', provinceVendeur:'QC', codePostalVendeur:'G1R 2K7',
    noTPS:'RT123456789', noTVQ:'1234567890TQ0001',
    nomAcheteur:'Patrick Gagnon', adresseAcheteur:'57, rue Principale', villeAcheteur:'Sherbrooke', provinceAcheteur:'QC', codePostalAcheteur:'J1H 1A3',
    lignes:[
      { description:'Tableau peint à la main — aquarelle paysage hivernal québécois, 30x40cm', quantite:1, prixUnitaire:75.00, total:75.00 },
      { description:'Cadre en bois flotté naturel — 30x40cm', quantite:1, prixUnitaire:14.75, total:14.75 },
    ],
    sousTotal:89.75, tps:4.49, tvq:8.95, tvh:0, total:103.19, methodePaiement:'Stripe', statut:'remboursée',
  },
  {
    id:5, noFacture:'FAC-2026-0388', noCommande:'CMD-8780', dateFacture:'2026-02-02',
    nomVendeur:'Créations Artisanales Dubois', adresseVendeur:'845, rue des Érables', villeVendeur:'Québec', provinceVendeur:'QC', codePostalVendeur:'G1R 2K7',
    noTPS:'RT123456789', noTVQ:'1234567890TQ0001',
    nomAcheteur:'Isabelle Côté', adresseAcheteur:'320, rue Saint-Jean', villeAcheteur:'Trois-Rivières', provinceAcheteur:'QC', codePostalAcheteur:'G9A 1W8',
    lignes:[
      { description:'Coffret cadeau bien-être — savons artisanaux x4, huile essentielle lavande, baume lèvres', quantite:1, prixUnitaire:65.00, total:65.00 },
      { description:'Diffuseur en céramique artisanale — coloris blanc marbré', quantite:1, prixUnitaire:45.00, total:45.00 },
      { description:'Pochette cadeau en tissu réutilisable — motif floral', quantite:2, prixUnitaire:25.00, total:50.00 },
      { description:'Huile de massage relaxante 100ml — lavande & camomille', quantite:1, prixUnitaire:50.00, total:50.00 },
    ],
    sousTotal:210.00, tps:10.50, tvq:20.95, tvh:0, total:241.45, methodePaiement:'PayPal', statut:'payée',
  },
  {
    id:6, noFacture:'FAC-2026-0374', noCommande:'CMD-8762', dateFacture:'2026-01-28',
    nomVendeur:'Créations Artisanales Dubois', adresseVendeur:'845, rue des Érables', villeVendeur:'Québec', provinceVendeur:'QC', codePostalVendeur:'G1R 2K7',
    noTPS:'RT123456789', noTVQ:'1234567890TQ0001',
    nomAcheteur:'Marc Lévesque', adresseAcheteur:'4512 - 101 Street NW', villeAcheteur:'Edmonton', provinceAcheteur:'AB', codePostalAcheteur:'T6E 5A6',
    lignes:[
      { description:'Set de 3 bols en céramique tournée — émaillage bleu pétrole, 12-16-20cm', quantite:1, prixUnitaire:45.00, total:45.00 },
    ],
    sousTotal:45.00, tps:2.25, tvq:0, tvh:0, total:47.25, methodePaiement:'Stripe', statut:'payée',
  },
  {
    id:7, noFacture:'FAC-2026-0361', noCommande:'CMD-8748', dateFacture:'2026-01-22',
    nomVendeur:'Créations Artisanales Dubois', adresseVendeur:'845, rue des Érables', villeVendeur:'Québec', provinceVendeur:'QC', codePostalVendeur:'G1R 2K7',
    noTPS:'RT123456789', noTVQ:'1234567890TQ0001',
    nomAcheteur:'Nathalie Fortin', adresseAcheteur:'1260, rue Notre-Dame Est', villeAcheteur:'Montréal', provinceAcheteur:'QC', codePostalAcheteur:'H2L 2R7',
    lignes:[
      { description:'Bijoux — collier en argent sterling avec pendentif quartz rose', quantite:1, prixUnitaire:52.00, total:52.00 },
      { description:'Boucles d\'oreilles en argent sterling — quartz rose dépareillé', quantite:1, prixUnitaire:15.25, total:15.25 },
    ],
    sousTotal:67.25, tps:3.36, tvq:6.71, tvh:0, total:77.32, methodePaiement:'Stripe', statut:'payée',
  },
  {
    id:8, noFacture:'FAC-2026-0352', noCommande:'CMD-8735', dateFacture:'2026-01-18',
    nomVendeur:'Créations Artisanales Dubois', adresseVendeur:'845, rue des Érables', villeVendeur:'Québec', provinceVendeur:'QC', codePostalVendeur:'G1R 2K7',
    noTPS:'RT123456789', noTVQ:'1234567890TQ0001',
    nomAcheteur:'David Pelletier', adresseAcheteur:'72, rue des Forges', villeAcheteur:'Joliette', provinceAcheteur:'QC', codePostalAcheteur:'J6E 2V2',
    lignes:[
      { description:'Meuble TV en bois massif de chêne — 120cm, 2 portes coulissantes', quantite:1, prixUnitaire:155.00, total:155.00 },
    ],
    sousTotal:155.00, tps:7.75, tvq:15.46, tvh:0, total:178.21, methodePaiement:'PayPal', statut:'annulée',
  },
];

const FACTURES_VENDEUR: FactureVendeur[] = [
  {
    id:1, noFacture:'COM-2026-0089', dateFacture:'2026-02-18', dateEcheance:'2026-02-18',
    type:'Commission',
    noTPSEvend:'RT987654321', noTVQEvend:'9876543210TQ0001',
    nomVendeur:'Créations Artisanales Dubois', adresseVendeur:'845, rue des Érables', villeVendeur:'Québec', provinceVendeur:'QC', codePostalVendeur:'G1R 2K7',
    noTPSVendeur:'RT123456789', noTVQVendeur:'1234567890TQ0001',
    lignes:[
      { description:'Commission de vente — Commande CMD-8841 · Marie-Ève Tremblay · Taux 8%', quantite:1, prixUnitaire:4.72, total:4.72 },
    ],
    sousTotal:4.72, tps:0.24, tvq:0.47, tvh:0, total:5.43, statut:'payée', noCommandes:['CMD-8841'],
  },
  {
    id:2, noFacture:'COM-2026-0085', dateFacture:'2026-02-15', dateEcheance:'2026-02-15',
    type:'Commission',
    noTPSEvend:'RT987654321', noTVQEvend:'9876543210TQ0001',
    nomVendeur:'Créations Artisanales Dubois', adresseVendeur:'845, rue des Érables', villeVendeur:'Québec', provinceVendeur:'QC', codePostalVendeur:'G1R 2K7',
    noTPSVendeur:'RT123456789', noTVQVendeur:'1234567890TQ0001',
    lignes:[
      { description:'Commission de vente — Commande CMD-8829 · Jean-François Bouchard · Taux 8%', quantite:1, prixUnitaire:9.96, total:9.96 },
    ],
    sousTotal:9.96, tps:0.50, tvq:0.99, tvh:0, total:11.45, statut:'payée', noCommandes:['CMD-8829'],
  },
  {
    id:3, noFacture:'ABN-2026-0012', dateFacture:'2026-02-01', dateEcheance:'2026-02-28',
    type:'Abonnement',
    noTPSEvend:'RT987654321', noTVQEvend:'9876543210TQ0001',
    nomVendeur:'Créations Artisanales Dubois', adresseVendeur:'845, rue des Érables', villeVendeur:'Québec', provinceVendeur:'QC', codePostalVendeur:'G1R 2K7',
    noTPSVendeur:'RT123456789', noTVQVendeur:'1234567890TQ0001',
    lignes:[
      { description:'Abonnement mensuel — Plan Croissance · Accès complet plateforme e-Vend.ca', quantite:1, prixUnitaire:49.00, total:49.00 },
      { description:'Fonctionnalités incluses : boutique illimitée, 500 produits, rapports avancés, support prioritaire', quantite:1, prixUnitaire:0.00, total:0.00 },
    ],
    sousTotal:49.00, tps:2.45, tvq:4.89, tvh:0, total:56.34, statut:'payée',
    periodeDebut:'2026-02-01', periodeFin:'2026-02-28',
  },
  {
    id:4, noFacture:'COM-2026-0068', dateFacture:'2026-02-02', dateEcheance:'2026-02-02',
    type:'Commission',
    noTPSEvend:'RT987654321', noTVQEvend:'9876543210TQ0001',
    nomVendeur:'Créations Artisanales Dubois', adresseVendeur:'845, rue des Érables', villeVendeur:'Québec', provinceVendeur:'QC', codePostalVendeur:'G1R 2K7',
    noTPSVendeur:'RT123456789', noTVQVendeur:'1234567890TQ0001',
    lignes:[
      { description:'Commission de vente — Commande CMD-8780 · Isabelle Côté · Taux 8%', quantite:1, prixUnitaire:16.80, total:16.80 },
    ],
    sousTotal:16.80, tps:0.84, tvq:1.68, tvh:0, total:19.32, statut:'payée', noCommandes:['CMD-8780'],
  },
  {
    id:5, noFacture:'ABN-2026-0005', dateFacture:'2026-01-01', dateEcheance:'2026-01-31',
    type:'Abonnement',
    noTPSEvend:'RT987654321', noTVQEvend:'9876543210TQ0001',
    nomVendeur:'Créations Artisanales Dubois', adresseVendeur:'845, rue des Érables', villeVendeur:'Québec', provinceVendeur:'QC', codePostalVendeur:'G1R 2K7',
    noTPSVendeur:'RT123456789', noTVQVendeur:'1234567890TQ0001',
    lignes:[
      { description:'Abonnement mensuel — Plan Croissance · Accès complet plateforme e-Vend.ca', quantite:1, prixUnitaire:49.00, total:49.00 },
      { description:'Fonctionnalités incluses : boutique illimitée, 500 produits, rapports avancés, support prioritaire', quantite:1, prixUnitaire:0.00, total:0.00 },
    ],
    sousTotal:49.00, tps:2.45, tvq:4.89, tvh:0, total:56.34, statut:'payée',
    periodeDebut:'2026-01-01', periodeFin:'2026-01-31',
  },
  {
    id:6, noFacture:'COM-2026-0041', dateFacture:'2026-01-22', dateEcheance:'2026-01-22',
    type:'Commission',
    noTPSEvend:'RT987654321', noTVQEvend:'9876543210TQ0001',
    nomVendeur:'Créations Artisanales Dubois', adresseVendeur:'845, rue des Érables', villeVendeur:'Québec', provinceVendeur:'QC', codePostalVendeur:'G1R 2K7',
    noTPSVendeur:'RT123456789', noTVQVendeur:'1234567890TQ0001',
    lignes:[
      { description:'Commission de vente — Commande CMD-8748 · Nathalie Fortin · Taux 8%', quantite:1, prixUnitaire:5.38, total:5.38 },
    ],
    sousTotal:5.38, tps:0.27, tvq:0.54, tvh:0, total:6.19, statut:'payée', noCommandes:['CMD-8748'],
  },
  {
    id:7, noFacture:'ABN-2025-0048', dateFacture:'2025-12-01', dateEcheance:'2025-12-31',
    type:'Abonnement',
    noTPSEvend:'RT987654321', noTVQEvend:'9876543210TQ0001',
    nomVendeur:'Créations Artisanales Dubois', adresseVendeur:'845, rue des Érables', villeVendeur:'Québec', provinceVendeur:'QC', codePostalVendeur:'G1R 2K7',
    noTPSVendeur:'RT123456789', noTVQVendeur:'1234567890TQ0001',
    lignes:[
      { description:'Abonnement mensuel — Plan Croissance · Accès complet plateforme e-Vend.ca', quantite:1, prixUnitaire:49.00, total:49.00 },
      { description:'Fonctionnalités incluses : boutique illimitée, 500 produits, rapports avancés, support prioritaire', quantite:1, prixUnitaire:0.00, total:0.00 },
    ],
    sousTotal:49.00, tps:2.45, tvq:4.89, tvh:0, total:56.34, statut:'payée',
    periodeDebut:'2025-12-01', periodeFin:'2025-12-31',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toFixed(2).replace('.', ',') + ' $';
const formatDate = (d: string) => {
  const [y, m, j] = d.split('-');
  const mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  return `${parseInt(j)} ${mois[parseInt(m)-1]} ${y}`;
};

const badgeStatut = (statut: StatutFacture) => {
  const cfg: Record<StatutFacture, {bg:string;color:string;label:string}> = {
    'payée':      {bg:'#dcfce7', color:'#16a34a', label:'✓ Payée'},
    'remboursée': {bg:'#dbeafe', color:'#1d4ed8', label:'↩ Remboursée'},
    'annulée':    {bg:'#fee2e2', color:'#dc2626', label:'✕ Annulée'},
    'en attente': {bg:'#fef3c7', color:'#d97706', label:'⏳ En attente'},
  };
  const c = cfg[statut];
  return <span style={{backgroundColor:c.bg,color:c.color,padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'700',whiteSpace:'nowrap' as const}}>{c.label}</span>;
};

// ── Génération HTML Facture Acheteur (8.5x11) ─────────────────────────────
const genHtmlFactureAcheteur = (f: FactureAcheteur): string => {
  const lignesHTML = f.lignes.map(l => `
    <tr>
      <td style="padding:8px 10px;font-size:11px;color:#374151;border-bottom:1px solid #f3f4f6;vertical-align:top">${l.description}</td>
      <td style="padding:8px 10px;font-size:11px;color:#374151;border-bottom:1px solid #f3f4f6;text-align:center">${l.quantite}</td>
      <td style="padding:8px 10px;font-size:11px;color:#374151;border-bottom:1px solid #f3f4f6;text-align:right;white-space:nowrap">${fmt(l.prixUnitaire)}</td>
      <td style="padding:8px 10px;font-size:11px;font-weight:700;color:#1a2332;border-bottom:1px solid #f3f4f6;text-align:right;white-space:nowrap">${fmt(l.total)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  @page { size: letter; margin: 0; }
  @media print { html,body { width:215.9mm; height:279.4mm; } .no-print{display:none!important} }
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;background:white;padding:0;width:215.9mm;min-height:279.4mm;position:relative}
  .page{width:215.9mm;min-height:279.4mm;background:white;display:flex;flex-direction:column;padding:0}
  .hdr{background:#2d6a9f;padding:20px 28px;display:flex;justify-content:space-between;align-items:flex-start}
  .logo{font-size:22px;font-weight:900;color:white}.logo em{color:#fbbf24;font-style:normal}
  .logo-sub{font-size:10px;color:rgba(255,255,255,0.7);margin-top:3px}
  .hdr-right{text-align:right}
  .facture-title{font-size:20px;font-weight:900;color:white;letter-spacing:1px}
  .facture-no{font-size:11px;color:rgba(255,255,255,0.85);margin-top:4px;line-height:1.6}
  .body{padding:20px 28px;flex:1}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px}
  .partie-box{background:#f8fafc;border-radius:8px;padding:12px 14px;border:1px solid #e8ecf0}
  .partie-title{font-size:9px;font-weight:900;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #e1e4e8}
  .partie-nom{font-size:13px;font-weight:800;color:#1a2332;margin-bottom:3px}
  .partie-detail{font-size:10px;color:#6b7280;line-height:1.7}
  .partie-tax{font-size:9px;color:#9ca3af;margin-top:4px;padding-top:4px;border-top:1px dashed #e1e4e8}
  .commande-ref{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:9px 14px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center}
  .commande-ref span{font-size:10px;color:#6b7280}.commande-ref strong{font-size:12px;color:#1d4ed8;font-weight:800}
  table.items{width:100%;border-collapse:collapse;margin-bottom:14px}
  table.items thead tr{background:#1a2332}
  table.items th{padding:8px 10px;font-size:10px;font-weight:700;color:white;text-align:left}
  table.items th:nth-child(2),table.items th:nth-child(3),table.items th:nth-child(4){text-align:center}
  table.items th:nth-child(3),table.items th:nth-child(4){text-align:right}
  .totals-wrap{display:flex;justify-content:flex-end;margin-bottom:14px}
  .totals-box{width:220px;border:1px solid #e1e4e8;border-radius:8px;overflow:hidden}
  .tot-row{display:flex;justify-content:space-between;padding:6px 12px;font-size:11px;border-bottom:1px solid #f3f4f6}
  .tot-row:last-child{border-bottom:none;background:#1a2332;padding:8px 12px}
  .tot-row:last-child span{font-size:13px;font-weight:900;color:white}
  .tot-label{color:#6b7280}.tot-val{font-weight:600;color:#1a2332}
  .payment-info{background:#f0fdf4;border:1px solid #a7f3d0;border-radius:8px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:10px}
  .payment-info span{font-size:11px;color:#16a34a;font-weight:700}
  .note-box{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:9px 14px;font-size:10px;color:#92400e;line-height:1.6}
  .ftr{background:#f8fafc;border-top:2px solid #e1e4e8;padding:12px 28px;display:flex;justify-content:space-between;align-items:center;margin-top:auto}
  .ftr-left{font-size:9px;color:#9ca3af;line-height:1.6}
  .ftr-right{font-size:9px;color:#9ca3af;text-align:right}
  .status-${f.statut.replace(' ','-')}{display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700}
</style>
</head>
<body>
<div class="page">
  <div class="hdr">
    <div>
      <div class="logo">e<em>-</em>Vend<span style="color:rgba(255,255,255,0.4);font-size:13px">.ca</span></div>
      <div class="logo-sub">La marketplace québécoise</div>
    </div>
    <div class="hdr-right">
      <div class="facture-title">FACTURE</div>
      <div class="facture-no">
        N° ${f.noFacture}<br>
        Date : ${formatDate(f.dateFacture)}<br>
        Commande : ${f.noCommande}
      </div>
    </div>
  </div>

  <div class="body">
    <!-- Parties -->
    <div class="parties">
      <div class="partie-box">
        <div class="partie-title">📤 Vendeur (émetteur)</div>
        <div class="partie-nom">${f.nomVendeur}</div>
        <div class="partie-detail">
          ${f.adresseVendeur}<br>
          ${f.villeVendeur} (${f.provinceVendeur})  ${f.codePostalVendeur}<br>
          Canada
        </div>
        <div class="partie-tax">
          N° TPS : ${f.noTPS}<br>
          N° TVQ : ${f.noTVQ}
        </div>
      </div>
      <div class="partie-box">
        <div class="partie-title">📥 Acheteur (destinataire)</div>
        <div class="partie-nom">${f.nomAcheteur}</div>
        <div class="partie-detail">
          ${f.adresseAcheteur}<br>
          ${f.villeAcheteur} (${f.provinceAcheteur})  ${f.codePostalAcheteur}<br>
          Canada
        </div>
      </div>
    </div>

    <!-- Réf commande -->
    <div class="commande-ref">
      <span>Référence commande e-Vend</span>
      <strong>${f.noCommande}</strong>
      <span>Mode de paiement</span>
      <strong>${f.methodePaiement}</strong>
      <span>Date de facturation</span>
      <strong>${formatDate(f.dateFacture)}</strong>
    </div>

    <!-- Tableau items -->
    <table class="items">
      <thead>
        <tr>
          <th style="width:55%">Description</th>
          <th style="width:10%;text-align:center">Qté</th>
          <th style="width:17%;text-align:right">Prix unitaire</th>
          <th style="width:18%;text-align:right">Montant</th>
        </tr>
      </thead>
      <tbody>
        ${lignesHTML}
      </tbody>
    </table>

    <!-- Totaux -->
    <div class="totals-wrap">
      <div class="totals-box">
        <div class="tot-row"><span class="tot-label">Sous-total</span><span class="tot-val" style="white-space:nowrap">${fmt(f.sousTotal)}</span></div>
        ${f.tps > 0 ? `<div class="tot-row"><span class="tot-label">TPS (5 %)</span><span class="tot-val" style="white-space:nowrap">${fmt(f.tps)}</span></div>` : ''}
        ${f.tvq > 0 ? `<div class="tot-row"><span class="tot-label">TVQ (9,975 %)</span><span class="tot-val" style="white-space:nowrap">${fmt(f.tvq)}</span></div>` : ''}
        ${f.tvh > 0 ? `<div class="tot-row"><span class="tot-label">TVH (${f.provinceAcheteur === 'ON' ? '13' : '15'} %)</span><span class="tot-val" style="white-space:nowrap">${fmt(f.tvh)}</span></div>` : ''}
        <div class="tot-row"><span>Total</span><span style="white-space:nowrap">${fmt(f.total)}</span></div>
      </div>
    </div>

    <!-- Paiement -->
    <div class="payment-info">
      <span>✓ Paiement reçu via ${f.methodePaiement} — ${formatDate(f.dateFacture)}</span>
      <span style="margin-left:auto;font-size:11px;font-weight:700;color:${f.statut==='payée'?'#16a34a':f.statut==='remboursée'?'#1d4ed8':'#dc2626'}">${f.statut.toUpperCase()}</span>
    </div>

    <div class="note-box">
      ⚠️ Cette facture a été générée automatiquement par la plateforme e-Vend.ca pour la transaction effectuée sur notre marketplace.
      Pour toute question, contactez le vendeur directement via la messagerie e-Vend ou visitez evend.ca/aide
    </div>
  </div>

  <div class="ftr">
    <div class="ftr-left">
      <strong>e-Vend.ca</strong> · 1000, rue de la Marketplace, Québec (QC) G1V 1A1<br>
      N° TPS e-Vend : RT987654321 · N° TVQ : 9876543210TQ0001
    </div>
    <div class="ftr-right">
      Facture générée le ${formatDate(f.dateFacture)}<br>
      © 2026 e-Vend.ca — Tous droits réservés
    </div>
  </div>
</div>
</body>
</html>`;
};

// ── Génération HTML Facture Vendeur (8.5x11) ─────────────────────────────
const genHtmlFactureVendeur = (f: FactureVendeur): string => {
  const isAbn = f.type === 'Abonnement';
  const couleurAccent = isAbn ? '#1f2937' : '#2d6a9f';
  const lignesHTML = f.lignes.map(l => `
    <tr>
      <td style="padding:8px 10px;font-size:11px;color:#374151;border-bottom:1px solid #f3f4f6;vertical-align:top">${l.description}</td>
      <td style="padding:8px 10px;font-size:11px;color:#374151;border-bottom:1px solid #f3f4f6;text-align:center">${l.quantite}</td>
      <td style="padding:8px 10px;font-size:11px;color:#374151;border-bottom:1px solid #f3f4f6;text-align:right;white-space:nowrap">${l.prixUnitaire > 0 ? fmt(l.prixUnitaire) : '—'}</td>
      <td style="padding:8px 10px;font-size:11px;font-weight:700;color:#1a2332;border-bottom:1px solid #f3f4f6;text-align:right;white-space:nowrap">${l.total > 0 ? fmt(l.total) : 'Inclus'}</td>
    </tr>`).join('');

  const periodeHTML = f.periodeDebut ? `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:9px 14px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:10px;color:#6b7280">Période de facturation</span>
      <strong style="font-size:12px;color:#1d4ed8">${formatDate(f.periodeDebut)} → ${formatDate(f.periodeFin!)}</strong>
    </div>` : '';

  const commandesHTML = f.noCommandes && f.noCommandes.length > 0 ? `
    <div style="background:#f0fdf4;border:1px solid #a7f3d0;border-radius:8px;padding:9px 14px;margin-bottom:14px">
      <span style="font-size:10px;color:#6b7280">Commande(s) référencée(s) : </span>
      ${f.noCommandes.map(n => `<strong style="font-size:12px;color:#16a34a;margin-left:8px">${n}</strong>`).join('')}
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  @page { size: letter; margin: 0; }
  @media print { html,body { width:215.9mm; height:279.4mm; } }
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;background:white;width:215.9mm;min-height:279.4mm}
  .page{width:215.9mm;min-height:279.4mm;background:white;display:flex;flex-direction:column;padding:0}
  .hdr{background:${couleurAccent};padding:20px 28px;display:flex;justify-content:space-between;align-items:flex-start}
  .logo{font-size:22px;font-weight:900;color:white}.logo em{color:#fbbf24;font-style:normal}
  .logo-sub{font-size:10px;color:rgba(255,255,255,0.7);margin-top:3px}
  .hdr-right{text-align:right}
  .facture-title{font-size:20px;font-weight:900;color:white;letter-spacing:1px}
  .facture-badge{display:inline-block;background:rgba(255,255,255,0.2);color:white;padding:3px 12px;border-radius:20px;font-size:10px;font-weight:700;margin-top:6px}
  .facture-no{font-size:11px;color:rgba(255,255,255,0.85);margin-top:4px;line-height:1.6}
  .body{padding:20px 28px;flex:1}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
  .partie-box{background:#f8fafc;border-radius:8px;padding:12px 14px;border:1px solid #e8ecf0}
  .partie-title{font-size:9px;font-weight:900;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #e1e4e8}
  .partie-nom{font-size:13px;font-weight:800;color:#1a2332;margin-bottom:3px}
  .partie-detail{font-size:10px;color:#6b7280;line-height:1.7}
  .partie-tax{font-size:9px;color:#9ca3af;margin-top:4px;padding-top:4px;border-top:1px dashed #e1e4e8}
  .echeance-bar{background:${couleurAccent}22;border:1px solid ${couleurAccent}44;border-radius:8px;padding:9px 14px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center}
  table.items{width:100%;border-collapse:collapse;margin-bottom:14px}
  table.items thead tr{background:${couleurAccent}}
  table.items th{padding:8px 10px;font-size:10px;font-weight:700;color:white;text-align:left}
  table.items th:nth-child(3),table.items th:nth-child(4){text-align:right}
  .totals-wrap{display:flex;justify-content:flex-end;margin-bottom:14px}
  .totals-box{width:240px;border:1px solid #e1e4e8;border-radius:8px;overflow:hidden}
  .tot-row{display:flex;justify-content:space-between;padding:6px 12px;font-size:11px;border-bottom:1px solid #f3f4f6}
  .tot-row:last-child{border-bottom:none;background:${couleurAccent};padding:9px 12px}
  .tot-row:last-child span{font-size:13px;font-weight:900;color:white}
  .tot-label{color:#6b7280}.tot-val{font-weight:600;color:#1a2332}
  .conditions{background:#f8f9fb;border:1px solid #e1e4e8;border-radius:8px;padding:10px 14px;margin-bottom:12px}
  .conditions-title{font-size:9px;font-weight:900;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px}
  .conditions-text{font-size:10px;color:#6b7280;line-height:1.7}
  .ftr{background:#f8fafc;border-top:2px solid #e1e4e8;padding:12px 28px;display:flex;justify-content:space-between;align-items:center;margin-top:auto}
  .ftr-left{font-size:9px;color:#9ca3af;line-height:1.6}
  .ftr-right{font-size:9px;color:#9ca3af;text-align:right}
</style>
</head>
<body>
<div class="page">
  <div class="hdr">
    <div>
      <div class="logo">e<em>-</em>Vend<span style="color:rgba(255,255,255,0.4);font-size:13px">.ca</span></div>
      <div class="logo-sub">La marketplace québécoise</div>
    </div>
    <div class="hdr-right">
      <div class="facture-title">FACTURE</div>
      <div class="facture-badge">${isAbn ? '📦 Abonnement' : '💼 Commission'}</div>
      <div class="facture-no">
        N° ${f.noFacture}<br>
        Date : ${formatDate(f.dateFacture)}<br>
        Échéance : ${formatDate(f.dateEcheance)}
      </div>
    </div>
  </div>

  <div class="body">
    <!-- Parties -->
    <div class="parties">
      <div class="partie-box">
        <div class="partie-title">📤 e-Vend.ca (émetteur)</div>
        <div class="partie-nom">e-Vend.ca Inc.</div>
        <div class="partie-detail">
          1000, rue de la Marketplace<br>
          Québec (QC)  G1V 1A1<br>
          Canada · info@evend.ca
        </div>
        <div class="partie-tax">
          N° TPS : ${f.noTPSEvend}<br>
          N° TVQ : ${f.noTVQEvend}
        </div>
      </div>
      <div class="partie-box">
        <div class="partie-title">📥 Vendeur (destinataire)</div>
        <div class="partie-nom">${f.nomVendeur}</div>
        <div class="partie-detail">
          ${f.adresseVendeur}<br>
          ${f.villeVendeur} (${f.provinceVendeur})  ${f.codePostalVendeur}<br>
          Canada
        </div>
        <div class="partie-tax">
          N° TPS vendeur : ${f.noTPSVendeur}<br>
          N° TVQ vendeur : ${f.noTVQVendeur}
        </div>
      </div>
    </div>

    <!-- Période ou commandes -->
    ${periodeHTML}
    ${commandesHTML}

    <!-- Info échéance -->
    <div class="echeance-bar">
      <span style="font-size:10px;color:#6b7280">Type de facturation</span>
      <strong style="font-size:12px;color:${couleurAccent}">${isAbn ? 'Abonnement mensuel récurrent' : 'Commission sur vente'}</strong>
      <span style="font-size:10px;color:#6b7280">Date d'échéance</span>
      <strong style="font-size:12px;color:${couleurAccent}">${formatDate(f.dateEcheance)}</strong>
    </div>

    <!-- Tableau -->
    <table class="items">
      <thead>
        <tr>
          <th style="width:57%">Description du service</th>
          <th style="width:8%;text-align:center">Qté</th>
          <th style="width:17%;text-align:right">Prix unitaire HT</th>
          <th style="width:18%;text-align:right">Montant HT</th>
        </tr>
      </thead>
      <tbody>
        ${lignesHTML}
      </tbody>
    </table>

    <!-- Totaux -->
    <div class="totals-wrap">
      <div class="totals-box">
        <div class="tot-row"><span class="tot-label">Sous-total HT</span><span class="tot-val" style="white-space:nowrap">${fmt(f.sousTotal)}</span></div>
        <div class="tot-row"><span class="tot-label">TPS (5 %)</span><span class="tot-val" style="white-space:nowrap">${fmt(f.tps)}</span></div>
        <div class="tot-row"><span class="tot-label">TVQ (9,975 %)</span><span class="tot-val" style="white-space:nowrap">${fmt(f.tvq)}</span></div>
        ${f.tvh > 0 ? `<div class="tot-row"><span class="tot-label">TVH (${f.provinceVendeur === 'ON' ? '13' : '15'} %)</span><span class="tot-val" style="white-space:nowrap">${fmt(f.tvh)}</span></div>` : ''}
        <div class="tot-row"><span>Total TTC</span><span style="white-space:nowrap">${fmt(f.total)}</span></div>
      </div>
    </div>

    <!-- Conditions -->
    <div class="conditions">
      <div class="conditions-title">Conditions et notes</div>
      <div class="conditions-text">
        ${isAbn
          ? `• Cet abonnement se renouvelle automatiquement chaque mois. Pour annuler, accédez à votre tableau de bord avant la date de renouvellement.<br>
             • Le montant sera prélevé automatiquement via votre mode de paiement enregistré.<br>
             • Aucun remboursement n'est accordé pour les mois partiellement utilisés.`
          : `• Cette facture de commission correspond aux ventes réalisées sur la plateforme e-Vend.ca.<br>
             • La commission est calculée sur le montant hors taxes de la vente au taux convenu dans votre contrat vendeur.<br>
             • Ce montant sera déduit automatiquement de votre prochain virement.`
        }
        <br>• Pour toute question : support@evend.ca · evend.ca/aide
      </div>
    </div>
  </div>

  <div class="ftr">
    <div class="ftr-left">
      <strong>e-Vend.ca Inc.</strong> · 1000, rue de la Marketplace, Québec (QC) G1V 1A1<br>
      N° TPS : ${f.noTPSEvend} · N° TVQ : ${f.noTVQEvend} · info@evend.ca
    </div>
    <div class="ftr-right">
      Facture N° ${f.noFacture} — ${formatDate(f.dateFacture)}<br>
      © 2026 e-Vend.ca — Tous droits réservés
    </div>
  </div>
</div>
</body>
</html>`;
};

// ── Export CSV ─────────────────────────────────────────────────────────────
const exportCSVAcheteur = (data: FactureAcheteur[]) => {
  const header = ['N° Facture','N° Commande','Date','Acheteur','Adresse','Ville','Province','Sous-total','TPS','TVQ','TVH','Total','Paiement','Statut'];
  const rows = data.map(f => [
    f.noFacture, f.noCommande, f.dateFacture, f.nomAcheteur,
    f.adresseAcheteur, f.villeAcheteur, f.provinceAcheteur,
    f.sousTotal.toFixed(2), f.tps.toFixed(2), f.tvq.toFixed(2), f.tvh.toFixed(2), f.total.toFixed(2),
    f.methodePaiement, f.statut
  ]);
  const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'factures-acheteurs.csv'; a.click();
  URL.revokeObjectURL(url);
};

const exportCSVVendeur = (data: FactureVendeur[]) => {
  const header = ['N° Facture','Date','Échéance','Type','Description','Montant HT','TPS','TVQ','Total TTC','Statut'];
  const rows = data.map(f => [
    f.noFacture, f.dateFacture, f.dateEcheance, f.type,
    f.lignes.map(l => l.description).join(' | '),
    f.sousTotal.toFixed(2), f.tps.toFixed(2), f.tvq.toFixed(2), f.total.toFixed(2), f.statut
  ]);
  const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'factures-vendeur.csv'; a.click();
  URL.revokeObjectURL(url);
};

const imprimerFacture = (html: string) => {
  const win = window.open('', '_blank', 'width=820,height:1060');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
};

// ── Menu 3 points ──────────────────────────────────────────────────────────
function Menu3Points({ onEmail, onTelecharger, onImprimer }: { onEmail:()=>void; onTelecharger:()=>void; onImprimer:()=>void }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div style={{ position:'relative' }}>
      <button onClick={e => { e.stopPropagation(); setOuvert(!ouvert); }}
        style={{ width:'32px', height:'32px', border:`1px solid ${T.border}`, borderRadius:'8px', backgroundColor:'white', cursor:'pointer', fontSize:'18px', display:'flex', alignItems:'center', justifyContent:'center', color:T.textLight, fontWeight:'900' }}>
        ⋯
      </button>
      {ouvert && (
        <>
          <div style={{ position:'fixed', inset:0, zIndex:100 }} onClick={() => setOuvert(false)} />
          <div style={{ position:'absolute', right:0, top:'36px', backgroundColor:'white', border:`1px solid ${T.border}`, borderRadius:'10px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:200, minWidth:'230px', overflow:'hidden' }}>
            {[
              { icon:'📧', label:"Envoyer à l'acheteur par email", action: () => { onEmail(); setOuvert(false); } },
              { icon:'⬇️', label:'Télécharger la facture (PDF)', action: () => { onTelecharger(); setOuvert(false); } },
              { icon:'🖨️', label:'Imprimer la facture', action: () => { onImprimer(); setOuvert(false); } },
            ].map((item, i) => (
              <button key={i} onClick={item.action}
                style={{ width:'100%', padding:'11px 16px', border:'none', backgroundColor:'white', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', fontSize:'12px', color:T.text, textAlign:'left' as const, borderBottom: i < 2 ? `1px solid ${T.border}` : 'none' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = T.accentLight}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'white'}>
                <span style={{ fontSize:'15px' }}>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Toast({ msg }: { msg: string }) {
  return <div style={{ position:'fixed', top:'20px', right:'20px', backgroundColor:T.success, color:'white', padding:'12px 18px', borderRadius:'10px', fontSize:'13px', fontWeight:'700', zIndex:5000, boxShadow:'0 4px 16px rgba(0,0,0,0.2)' }}>{msg}</div>;
}

// ── Composant principal ────────────────────────────────────────────────────
export default function FacturesVendeur({ naviguerVers }: { naviguerVers: (p: string) => void }) {
  const [onglet, setOnglet]       = useState<'acheteur'|'vendeur'>('acheteur');
  const [rechercheA, setRechercheA] = useState('');
  const [rechercheV, setRechercheV] = useState('');
  const [popupFacture, setPopupFacture] = useState<{html:string;titre:string}|null>(null);
  const [toast, setToast]         = useState<string|null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtresA = useMemo(() =>
    FACTURES_ACHETEUR.filter(f => rechercheA === '' ||
      [f.noFacture, f.noCommande, f.nomAcheteur, f.statut].some(v => v.toLowerCase().includes(rechercheA.toLowerCase()))
    ), [rechercheA]);

  const filtresV = useMemo(() =>
    FACTURES_VENDEUR.filter(f => rechercheV === '' ||
      [f.noFacture, f.type, f.statut, ...f.lignes.map(l => l.description)].some(v => v.toLowerCase().includes(rechercheV.toLowerCase()))
    ), [rechercheV]);

  const thStyle: React.CSSProperties = { padding:'10px 12px', fontSize:'11px', fontWeight:'800', color:T.textLight, textAlign:'left', backgroundColor:'#f8f9fb', borderBottom:`2px solid ${T.border}`, whiteSpace:'nowrap' };
  const tdStyle: React.CSSProperties = { padding:'11px 12px', fontSize:'12px', color:T.text, borderBottom:`1px solid ${T.border}`, verticalAlign:'middle' };

  return (
    <>
      {toast && <Toast msg={toast} />}

      {/* ── POPUP FACTURE ── */}
      {popupFacture && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.65)', zIndex:4000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
          onClick={() => setPopupFacture(null)}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor:'white', borderRadius:'14px', width:'700px', maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.35)' }}>
            <div style={{ padding:'14px 18px', borderBottom:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
              <h3 style={{ fontSize:'14px', fontWeight:'900', margin:0, color:T.text }}>📄 {popupFacture.titre}</h3>
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => imprimerFacture(popupFacture.html)}
                  style={{ padding:'6px 14px', border:`1px solid ${T.border}`, borderRadius:'7px', backgroundColor:'white', cursor:'pointer', fontSize:'12px', fontWeight:'700', color:T.text }}>
                  🖨️ Imprimer
                </button>
                <button onClick={() => showToast('⬇️ Téléchargement PDF...')}
                  style={{ padding:'6px 14px', border:'none', borderRadius:'7px', backgroundColor:T.accent, cursor:'pointer', fontSize:'12px', fontWeight:'700', color:'white' }}>
                  ⬇️ PDF
                </button>
                <button onClick={() => setPopupFacture(null)}
                  style={{ width:'32px', height:'32px', border:`1px solid ${T.border}`, borderRadius:'8px', backgroundColor:'white', cursor:'pointer', fontSize:'16px', color:T.textLight }}>
                  ✕
                </button>
              </div>
            </div>
            <div style={{ flex:1, overflow:'auto', backgroundColor:'#525659', padding:'16px' }}>
              <iframe srcDoc={popupFacture.html} title="facture"
                style={{ width:'100%', height:'700px', border:'none', display:'block', backgroundColor:'white', borderRadius:'8px', boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}
                sandbox="allow-same-origin" />
            </div>
          </div>
        </div>
      )}

      {/* ── PAGE ── */}
      <div style={{ padding:'24px', backgroundColor:T.bg, minHeight:'100vh' }}>
        <div style={{ marginBottom:'20px' }}>
          <h1 style={{ fontSize:'22px', fontWeight:'900', color:T.text, margin:'0 0 4px' }}>🧾 Mes Factures</h1>
          <p style={{ fontSize:'13px', color:T.textLight, margin:0 }}>Toutes les factures générées automatiquement par e-Vend.ca</p>
        </div>

        <div style={{ backgroundColor:T.card, borderRadius:'12px', border:`1px solid ${T.border}`, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>

          {/* Onglets */}
          <div style={{ display:'flex', borderBottom:`1px solid ${T.border}`, backgroundColor:'#f8f9fb' }}>
            {([
              ['acheteur','🛒 Factures acheteurs', FACTURES_ACHETEUR.length] as const,
              ['vendeur', '💼 Mes factures (commissions & abonnements)', FACTURES_VENDEUR.length] as const,
            ]).map(([id, label, count]) => (
              <button key={id} onClick={() => setOnglet(id)}
                style={{ padding:'14px 22px', border:'none', backgroundColor:'transparent', cursor:'pointer', fontSize:'13px',
                  fontWeight: onglet === id ? '800' : '600',
                  color: onglet === id ? T.accent : T.textLight,
                  borderBottom: `3px solid ${onglet === id ? T.accent : 'transparent'}`,
                  display:'flex', alignItems:'center', gap:'8px' }}>
                {label}
                <span style={{ fontSize:'11px', backgroundColor: onglet === id ? T.accentLight : '#e5e7eb', color: onglet === id ? T.accent : T.textLight, padding:'2px 8px', borderRadius:'10px', fontWeight:'700' }}>{count}</span>
              </button>
            ))}
          </div>

          {/* ── ONGLET ACHETEUR ── */}
          {onglet === 'acheteur' && (
            <div style={{ padding:'16px' }}>
              {/* KPI taxes */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'14px' }}>
                {[
                  { label:'Total ventes HT', val: filtresA.reduce((s,f)=>s+f.sousTotal,0), icon:'💰', color:T.accent },
                  { label:'Total TPS perçue', val: filtresA.reduce((s,f)=>s+f.tps,0), icon:'🏛️', color:'#7c3aed' },
                  { label:'Total TVQ perçue', val: filtresA.reduce((s,f)=>s+f.tvq,0), icon:'🏛️', color:'#7c3aed' },
                  { label:'Total TVH perçue', val: filtresA.reduce((s,f)=>s+f.tvh,0), icon:'🏛️', color:'#7c3aed' },
                ].map((k,i) => (
                  <div key={i} style={{ background:'#f8f9fb', border:`1px solid ${T.border}`, borderRadius:'10px', padding:'11px 14px' }}>
                    <p style={{ fontSize:'10px', color:T.textLight, margin:'0 0 3px' }}>{k.icon} {k.label}</p>
                    <p style={{ fontSize:'15px', fontWeight:'900', color:k.color, margin:0 }}>{fmt(k.val)}</p>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px', gap:'12px' }}>
                <div style={{ position:'relative', flex:1, maxWidth:'360px' }}>
                  <span style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', fontSize:'13px', color:T.textLight }}>🔍</span>
                  <input value={rechercheA} onChange={e => setRechercheA(e.target.value)} placeholder="Rechercher par facture, commande, acheteur..."
                    style={{ width:'100%', border:`1px solid ${T.border}`, borderRadius:'8px', padding:'8px 12px 8px 32px', fontSize:'12px', outline:'none', boxSizing:'border-box' as const }} />
                </div>
                <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                  <span style={{ fontSize:'12px', color:T.textLight }}>{filtresA.length} facture{filtresA.length>1?'s':''} · <strong style={{color:T.text}}>{fmt(filtresA.reduce((s,f)=>s+f.total,0))}</strong></span>
                  <button onClick={() => exportCSVAcheteur(filtresA)}
                    style={{ padding:'8px 16px', border:`1px solid ${T.border}`, borderRadius:'8px', backgroundColor:'white', cursor:'pointer', fontSize:'12px', fontWeight:'700', color:T.text }}>
                    📊 Exporter CSV
                  </button>
                </div>
              </div>

              <div style={{ overflowX:'auto' as const }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>N° Facture</th>
                      <th style={thStyle}>N° Commande</th>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Acheteur</th>
                      <th style={thStyle}>Prov.</th>
                      <th style={{...thStyle,textAlign:'right' as const}}>Sous-total</th>
                      <th style={{...thStyle,textAlign:'right' as const}}>TPS</th>
                      <th style={{...thStyle,textAlign:'right' as const}}>TVQ</th>
                      <th style={{...thStyle,textAlign:'right' as const}}>TVH</th>
                      <th style={{...thStyle,textAlign:'right' as const}}>Total</th>
                      <th style={thStyle}>Statut</th>
                      <th style={thStyle}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtresA.map((f, idx) => (
                      <tr key={f.id} style={{ backgroundColor: idx%2===0?'white':'#fafafa' }}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.backgroundColor=T.accentLight}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.backgroundColor=idx%2===0?'white':'#fafafa'}>
                        <td style={tdStyle}><span style={{fontFamily:'monospace',fontWeight:'700',color:T.accent,fontSize:'11px'}}>{f.noFacture}</span></td>
                        <td style={tdStyle}><span style={{fontFamily:'monospace',fontSize:'11px',color:T.textLight}}>{f.noCommande}</span></td>
                        <td style={tdStyle}><span style={{whiteSpace:'nowrap' as const,fontSize:'11px'}}>{formatDate(f.dateFacture)}</span></td>
                        <td style={tdStyle}><span style={{fontWeight:'600'}}>{f.nomAcheteur}</span></td>
                        <td style={tdStyle}><span style={{backgroundColor:'#f3f4f6',padding:'2px 8px',borderRadius:'5px',fontSize:'11px',fontWeight:'700'}}>{f.provinceAcheteur}</span></td>
                        <td style={{...tdStyle,textAlign:'right' as const,fontFamily:'monospace',fontSize:'11px'}}>{fmt(f.sousTotal)}</td>
                        <td style={{...tdStyle,textAlign:'right' as const,fontFamily:'monospace',fontSize:'11px',color:'#7c3aed'}}>{fmt(f.tps)}</td>
                        <td style={{...tdStyle,textAlign:'right' as const,fontFamily:'monospace',fontSize:'11px',color:'#7c3aed'}}>{f.tvq>0?fmt(f.tvq):<span style={{color:'#d1d5db'}}>—</span>}</td>
                        <td style={{...tdStyle,textAlign:'right' as const,fontFamily:'monospace',fontSize:'11px',color:'#7c3aed'}}>{f.tvh>0?fmt(f.tvh):<span style={{color:'#d1d5db'}}>—</span>}</td>
                        <td style={{...tdStyle,textAlign:'right' as const}}><span style={{fontWeight:'900',color:T.text}}>{fmt(f.total)}</span></td>
                        <td style={tdStyle}>{badgeStatut(f.statut)}</td>
                        <td style={{...tdStyle,whiteSpace:'nowrap' as const}}>
                          <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                            <button onClick={()=>setPopupFacture({html:genHtmlFactureAcheteur(f),titre:`Facture ${f.noFacture}`})}
                              style={{padding:'5px 12px',border:`1px solid ${T.accent}`,borderRadius:'6px',backgroundColor:T.accentLight,color:T.accent,cursor:'pointer',fontSize:'11px',fontWeight:'700'}}>
                              👁 Voir
                            </button>
                            <Menu3Points
                              onEmail={()=>showToast(`📧 Facture ${f.noFacture} envoyée à ${f.nomAcheteur}`)}
                              onTelecharger={()=>showToast(`⬇️ Téléchargement de ${f.noFacture}...`)}
                              onImprimer={()=>imprimerFacture(genHtmlFactureAcheteur(f))}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtresA.length===0&&<tr><td colSpan={12} style={{padding:'40px',textAlign:'center' as const,color:T.textLight}}>Aucune facture trouvée</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ONGLET VENDEUR ── */}
          {onglet === 'vendeur' && (
            <div style={{ padding:'16px' }}>
              {/* KPI */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'10px', marginBottom:'14px' }}>
                {[
                  { label:'Total commissions HT', val: filtresV.filter(f=>f.type==='Commission').reduce((s,f)=>s+f.sousTotal,0), icon:'💼', color:T.accent },
                  { label:'Total abonnements HT', val: filtresV.filter(f=>f.type==='Abonnement').reduce((s,f)=>s+f.sousTotal,0), icon:'📦', color:'#1f2937' },
                  { label:'Total TPS payée', val: filtresV.reduce((s,f)=>s+f.tps,0), icon:'🏛️', color:'#7c3aed' },
                  { label:'Total TVQ payée', val: filtresV.reduce((s,f)=>s+f.tvq,0), icon:'🏛️', color:'#7c3aed' },
                  { label:'Total TVH payée', val: filtresV.reduce((s,f)=>s+(f.tvh||0),0), icon:'🏛️', color:'#7c3aed' },
                ].map((k,i)=>(
                  <div key={i} style={{background:'#f8f9fb',border:`1px solid ${T.border}`,borderRadius:'10px',padding:'11px 14px'}}>
                    <p style={{fontSize:'10px',color:T.textLight,margin:'0 0 3px'}}>{k.icon} {k.label}</p>
                    <p style={{fontSize:'15px',fontWeight:'900',color:k.color,margin:0}}>{fmt(k.val)}</p>
                  </div>
                ))}
              </div>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px',gap:'12px'}}>
                <div style={{position:'relative',flex:1,maxWidth:'360px'}}>
                  <span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:T.textLight}}>🔍</span>
                  <input value={rechercheV} onChange={e=>setRechercheV(e.target.value)} placeholder="Rechercher par facture, type, description..."
                    style={{width:'100%',border:`1px solid ${T.border}`,borderRadius:'8px',padding:'8px 12px 8px 32px',fontSize:'12px',outline:'none',boxSizing:'border-box' as const}}/>
                </div>
                <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                  <span style={{fontSize:'12px',color:T.textLight}}>{filtresV.length} facture{filtresV.length>1?'s':''} · <strong style={{color:T.text}}>{fmt(filtresV.reduce((s,f)=>s+f.total,0))}</strong></span>
                  <button onClick={()=>exportCSVVendeur(filtresV)}
                    style={{padding:'8px 16px',border:`1px solid ${T.border}`,borderRadius:'8px',backgroundColor:'white',cursor:'pointer',fontSize:'12px',fontWeight:'700',color:T.text}}>
                    📊 Exporter CSV
                  </button>
                </div>
              </div>

              <div style={{overflowX:'auto' as const}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr>
                      <th style={thStyle}>N° Facture</th>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Échéance</th>
                      <th style={thStyle}>Type</th>
                      <th style={{...thStyle,minWidth:'180px'}}>Description</th>
                      <th style={{...thStyle,textAlign:'right' as const}}>HT</th>
                      <th style={{...thStyle,textAlign:'right' as const}}>TPS</th>
                      <th style={{...thStyle,textAlign:'right' as const}}>TVQ</th>
                      <th style={{...thStyle,textAlign:'right' as const}}>TVH</th>
                      <th style={{...thStyle,textAlign:'right' as const}}>Total TTC</th>
                      <th style={thStyle}>Statut</th>
                      <th style={thStyle}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtresV.map((f,idx)=>(
                      <tr key={f.id} style={{backgroundColor:idx%2===0?'white':'#fafafa'}}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.backgroundColor=T.accentLight}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.backgroundColor=idx%2===0?'white':'#fafafa'}>
                        <td style={tdStyle}><span style={{fontFamily:'monospace',fontWeight:'700',color:f.type==='Abonnement'?'#1f2937':T.accent,fontSize:'11px'}}>{f.noFacture}</span></td>
                        <td style={tdStyle}><span style={{whiteSpace:'nowrap' as const,fontSize:'11px'}}>{formatDate(f.dateFacture)}</span></td>
                        <td style={tdStyle}><span style={{whiteSpace:'nowrap' as const,fontSize:'11px'}}>{formatDate(f.dateEcheance)}</span></td>
                        <td style={tdStyle}>
                          <span style={{fontSize:'11px',backgroundColor:f.type==='Commission'?T.accentLight:'#f3f4f6',color:f.type==='Commission'?T.accent:'#374151',padding:'3px 10px',borderRadius:'20px',fontWeight:'700'}}>
                            {f.type==='Commission'?'💼 Commission':'📦 Abonnement'}
                          </span>
                        </td>
                        <td style={{...tdStyle,fontSize:'11px',color:T.textLight,maxWidth:'200px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}
                          title={f.lignes[0]?.description}>{f.lignes[0]?.description}</td>
                        <td style={{...tdStyle,textAlign:'right' as const,fontFamily:'monospace',fontSize:'11px'}}>{fmt(f.sousTotal)}</td>
                        <td style={{...tdStyle,textAlign:'right' as const,fontFamily:'monospace',fontSize:'11px',color:'#7c3aed'}}>{fmt(f.tps)}</td>
                        <td style={{...tdStyle,textAlign:'right' as const,fontFamily:'monospace',fontSize:'11px',color:'#7c3aed'}}>{fmt(f.tvq)}</td>
                        <td style={{...tdStyle,textAlign:'right' as const,fontFamily:'monospace',fontSize:'11px',color:'#7c3aed'}}>{(f.tvh||0)>0?fmt(f.tvh||0):<span style={{color:'#d1d5db'}}>—</span>}</td>
                        <td style={{...tdStyle,textAlign:'right' as const}}><span style={{fontWeight:'900',color:T.text}}>{fmt(f.total)}</span></td>
                        <td style={tdStyle}>{badgeStatut(f.statut)}</td>
                        <td style={{...tdStyle,whiteSpace:'nowrap' as const}}>
                          <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                            <button onClick={()=>setPopupFacture({html:genHtmlFactureVendeur(f),titre:`Facture ${f.noFacture}`})}
                              style={{padding:'5px 12px',border:`1px solid ${T.accent}`,borderRadius:'6px',backgroundColor:T.accentLight,color:T.accent,cursor:'pointer',fontSize:'11px',fontWeight:'700'}}>
                              👁 Voir
                            </button>
                            <Menu3Points
                              onEmail={()=>showToast(`📧 Facture ${f.noFacture} envoyée par email`)}
                              onTelecharger={()=>showToast(`⬇️ Téléchargement de ${f.noFacture}...`)}
                              onImprimer={()=>imprimerFacture(genHtmlFactureVendeur(f))}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtresV.length===0&&<tr><td colSpan={12} style={{padding:'40px',textAlign:'center' as const,color:T.textLight}}>Aucune facture trouvée</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
