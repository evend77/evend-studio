// CHEMIN : src/pages/collaborateur/CollaborateurRapportFinancier.tsx
// e-Vend Studio — Dashboard collaborateur : rapport financier (ventes, taxes, commissions payées au gestionnaire).
// Copie de RapportVendeur.tsx (e-Vend), adaptée à Studio : API /api/collab/:gestionnaireId/rapport ; pas d'onglet Abonnements
// (à venir avec les addons) ; les commissions sont payées au GESTIONNAIRE ; les taxes sont toujours remises par le collaborateur.
import React, { useState, useEffect, useCallback } from 'react';

// ✅ Détection mobile (≤768px)
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);
  return isMobile;
}


// ── Types ─────────────────────────────────────────────────────────────────────
// ⚠️ MIS À JOUR (voir resume-fiscal.md) — les champs de taxe ne sont plus
// recalculés côté client à partir d'un taux générique par province. Ce sont
// désormais les VRAIES valeurs déjà calculées et figées par checkoutEvend.js
// au moment du paiement (commandes.tps/tvq/tvh/tvp) — une seule source de
// vérité, cohérente avec la facture et le montant réellement chargé à
// Stripe. `taxeRemisePar` indique qui doit remettre cette taxe au
// gouvernement : le vendeur lui-même (inscrit) ou le gestionnaire (non-inscrit, en
// tant qu'exploitant de plateforme de distribution).
interface VenteVendeur {
  id: number;
  date: string;
  dateISO: string;
  orderId: string;
  storeOrderId: string;
  produit: string;
  quantite: number;
  prixUnitaire: number;
  expedition: number;
  pourboire: number;
  province: string;                       // province de livraison — détermine le régime de taxe applicable
  taxeRemisePar: 'vendeur' | 'e-vend';     // qui remet cette taxe au gouvernement
  tps: number; tvq: number; tvh: number; tvp: number;                 // taxe réellement perçue sur cette vente
  tpsRembourse: number; tvqRembourse: number; tvhRembourse: number; tvpRembourse: number; // portion déjà remboursée
  statutPaiement: string;                 // 'Paid' | 'refunded' | 'refund_echoue' — le remboursement partiel se déduit des montants ci-dessus
  ratioRembourse?: number;                // 🆕 part remboursée de la commande (0 → 1)
  // montantHT = prixUnitaire * quantite (sans taxes, sans expédition, sans pourboire)
}

interface CommissionPayee {
  id: number;
  date: string;
  dateISO: string;
  orderId: string;
  storeOrderId: string;
  produit: string;
  montantVenteHT: number;
  commissionBrute: number; // commission payée au gestionnaire, taxes incluses
  estimee?: boolean;
  ventilationReelle?: { ht: number; tps: number; tvq: number; tvh: number; tvp: number } | null;
}

// ── Taux de taxes par province — 4 régimes réels (pas juste QC) ───────────────
// TPS+TVQ (QC) / TVH (ON,NB,NS,NL,PE) / TPS+TVP (BC,SK,MB — 2 taxes séparées,
// PAS harmonisées comme la TVH) / TPS seule (AB,NT,NU,YT).
const TAXES_PROVINCE: Record<string, { tps: number; tvq: number; tvh: number; tvp: number; type: 'TPS+TVQ' | 'TPS+TVH' | 'TPS+TVP' | 'TPS' }> = {
  QC: { tps: 0.05, tvq: 0.09975, tvh: 0,    tvp: 0,    type: 'TPS+TVQ' },
  ON: { tps: 0,    tvq: 0,       tvh: 0.13, tvp: 0,    type: 'TPS+TVH' },
  NB: { tps: 0,    tvq: 0,       tvh: 0.15, tvp: 0,    type: 'TPS+TVH' },
  NS: { tps: 0,    tvq: 0,       tvh: 0.15, tvp: 0,    type: 'TPS+TVH' },
  NL: { tps: 0,    tvq: 0,       tvh: 0.15, tvp: 0,    type: 'TPS+TVH' },
  PE: { tps: 0,    tvq: 0,       tvh: 0.15, tvp: 0,    type: 'TPS+TVH' },
  BC: { tps: 0.05, tvq: 0,       tvh: 0,    tvp: 0.07, type: 'TPS+TVP' },
  SK: { tps: 0.05, tvq: 0,       tvh: 0,    tvp: 0.06, type: 'TPS+TVP' },
  MB: { tps: 0.05, tvq: 0,       tvh: 0,    tvp: 0.07, type: 'TPS+TVP' },
  AB: { tps: 0.05, tvq: 0,       tvh: 0,    tvp: 0,    type: 'TPS' },
  NT: { tps: 0.05, tvq: 0,       tvh: 0,    tvp: 0,    type: 'TPS' },
  NU: { tps: 0.05, tvq: 0,       tvh: 0,    tvp: 0,    type: 'TPS' },
  YT: { tps: 0.05, tvq: 0,       tvh: 0,    tvp: 0,    type: 'TPS' },
};

// Données chargées depuis API

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtMoney(n: number) {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' $';
}

// Extraction taxe d'un montant TTC (commission du gestionnaire, taxes incluses) — repli
// utilisé seulement quand la vraie ventilation n'a pas encore été capturée.
function extraireTaxes(montantBrut: number, province: string) {
  const tx = TAXES_PROVINCE[province] || TAXES_PROVINCE['QC'];
  const tauxTotal = tx.type === 'TPS+TVQ' ? 1 + tx.tps + tx.tvq
    : tx.type === 'TPS+TVH' ? 1 + tx.tvh
    : tx.type === 'TPS+TVP' ? 1 + tx.tps + tx.tvp
    : 1 + tx.tps;
  const ht = montantBrut / tauxTotal;
  const tps = tx.type !== 'TPS+TVH' ? ht * tx.tps : 0;
  const tvq = tx.type === 'TPS+TVQ' ? ht * tx.tvq : 0;
  const tvh = tx.type === 'TPS+TVH' ? montantBrut - ht : 0;
  const tvp = tx.type === 'TPS+TVP' ? ht * tx.tvp : 0;
  return { ht, tps, tvq, tvh, tvp };
}

// Ventilation d'une commission — vraie valeur figée si disponible, sinon repli.
function ventilerCommission(c: CommissionPayee, province: string) {
  if (c.ventilationReelle) {
    return { ht: c.ventilationReelle.ht, tps: c.ventilationReelle.tps, tvq: c.ventilationReelle.tvq, tvh: c.ventilationReelle.tvh, tvp: c.ventilationReelle.tvp };
  }
  return extraireTaxes(c.commissionBrute, province);
}

// ⚠️ MIS À JOUR (voir resume-fiscal.md) — ne recalcule plus la taxe à partir
// d'un taux générique par province : utilise les vraies valeurs déjà
// capturées sur la commande. Calcule aussi le NET après un remboursement
// éventuel (total ou partiel) — c'est ce montant net qui compte pour la
// déclaration du vendeur, pas le montant brut originalement perçu.
function calcVente(v: VenteVendeur) {
  // 🔧 CORRIGÉ — seules les taxes étaient retirées après un remboursement :
  // une vente remboursée à 100 % gardait son prix (total affiché 10,99 $) et
  // restait comptée dans le chiffre de ventes. Le produit, l'expédition et le
  // pourboire sont maintenant réduits de la même part remboursée.
  const k = 1 - Math.min(1, Math.max(0, v.ratioRembourse || 0));
  const venteHTBrute = v.prixUnitaire * v.quantite;
  const venteHT = venteHTBrute * k;
  const expeditionNet = v.expedition * k;
  const pourboireNet = v.pourboire * k;
  const tpsNet = v.tps - v.tpsRembourse;
  const tvqNet = v.tvq - v.tvqRembourse;
  const tvhNet = v.tvh - v.tvhRembourse;
  const tvpNet = v.tvp - v.tvpRembourse;
  const taxeRembourseeTotal = v.tpsRembourse + v.tvqRembourse + v.tvhRembourse + v.tvpRembourse;
  const estRembourseTotal = v.statutPaiement === 'refunded';
  const estRembourseParti = !estRembourseTotal && taxeRembourseeTotal > 0;
  const totalArticles = venteHT + tpsNet + tvqNet + tvhNet + tvpNet;
  const totalAvecExtras = totalArticles + expeditionNet + pourboireNet;
  return {
    venteHT, venteHTBrute, expeditionNet, pourboireNet,
    tps: tpsNet, tvq: tvqNet, tvh: tvhNet, tvp: tvpNet,
    taxeRembourseeTotal, estRembourseTotal, estRembourseParti,
    totalArticles, totalAvecExtras,
  };
}

interface RapportCollabProps {
  gestionnaireId: number;
  accent: string;
  isMobile?: boolean;
  nomVendeur?: string;
}

export default function CollaborateurRapportFinancier({
  gestionnaireId,
  accent,
  nomVendeur = 'Ma boutique',
}: RapportCollabProps) {

  const isMobile = useIsMobile();
  const annee = new Date().getFullYear();
  const [dateDebut, setDateDebut] = useState(`${annee}-01-01`);
  const [dateFin, setDateFin]     = useState(new Date().toISOString().split('T')[0]);
  const [recherche, setRecherche] = useState('');
  const [onglet, setOnglet]       = useState<'resume' | 'ventes' | 'commissions'>('resume');
  // ✅ Statut fiscal réel du vendeur (vendeurs.est_entreprise_enregistree) — lecture
  // seule, reçu du backend. Ce n'est plus un interrupteur manuel : un vendeur ne
  // peut pas "activer" une taxe qui n'a jamais été réellement appliquée sur ses
  // vraies ventes (le checkout ne l'aurait pas fait s'il n'était pas inscrit).
  const [inscritTaxes, setInscritTaxes] = useState(false);

  // Données API
  const [ventesAPI, setVentesAPI]             = useState<VenteVendeur[]>([]);
  const [commissionsAPI, setCommissionsAPI]   = useState<CommissionPayee[]>([]);
  const [province, setProvince]               = useState('QC');
  const [loading, setLoading]                 = useState(true);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date_debut: dateDebut, date_fin: dateFin });
      const res = await fetch(`/api/collab/${gestionnaireId}/rapport?${params}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setVentesAPI(data.ventes || []);
        setCommissionsAPI(data.commissions || []);
        setProvince(data.province || 'QC');
        setInscritTaxes(data.inscritTaxes === true);
      }
    } catch (e) { console.error('Erreur rapport:', e); }
    finally { setLoading(false); }
  }, [dateDebut, dateFin, gestionnaireId]);

  useEffect(() => { charger(); }, [charger]);

  // ── Filtrage ───────────────────────────────────────────────────────────────
  const ventesFiltrees = ventesAPI.filter(v => {
    const inP = v.dateISO >= dateDebut && v.dateISO <= dateFin;
    const inS = recherche === '' || v.produit.toLowerCase().includes(recherche.toLowerCase()) || v.orderId.includes(recherche) || v.storeOrderId.includes(recherche);
    return inP && inS;
  }).sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  const commFiltrees = commissionsAPI.filter(c => {
    const inP = c.dateISO >= dateDebut && c.dateISO <= dateFin;
    const inS = recherche === '' || c.produit.toLowerCase().includes(recherche.toLowerCase()) || c.orderId.includes(recherche);
    return inP && inS;
  }).sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  // ── Totaux ventes ──────────────────────────────────────────────────────────
  // ⚠️ MIS À JOUR (voir resume-fiscal.md) — les totaux tps/tvq/tvh/tvp
  // n'incluent maintenant QUE les ventes où taxeRemisePar === 'vendeur' (net
  // de remboursement) : c'est le seul montant que LE VENDEUR doit déclarer
  // et remettre lui-même. Le montant perçu par le gestionnaire pour son compte
  // (vendeur non-inscrit) est calculé séparément (percuParEvend*), à titre
  // informatif seulement — le vendeur n'a rien à en faire dans sa propre
  // déclaration, c'est le gestionnaire qui le remet.
  const totVentes = ventesFiltrees.reduce((acc, v) => {
    const c = calcVente(v);
    const estVendeur = v.taxeRemisePar === 'vendeur';
    return {
      venteHT:       acc.venteHT       + c.venteHT,
      tps:           acc.tps           + (estVendeur ? c.tps : 0),
      tvq:           acc.tvq           + (estVendeur ? c.tvq : 0),
      tvh:           acc.tvh           + (estVendeur ? c.tvh : 0),
      tvp:           acc.tvp           + (estVendeur ? c.tvp : 0),
      // 🆕 Informatif seulement — perçu par le gestionnaire pour le compte du vendeur non-inscrit
      tpsPercuParEvend: acc.tpsPercuParEvend + (!estVendeur ? c.tps : 0),
      tvqPercuParEvend: acc.tvqPercuParEvend + (!estVendeur ? c.tvq : 0),
      tvhPercuParEvend: acc.tvhPercuParEvend + (!estVendeur ? c.tvh : 0),
      tvpPercuParEvend: acc.tvpPercuParEvend + (!estVendeur ? c.tvp : 0),
      totalArticles: acc.totalArticles + c.totalArticles,
      expedition:    acc.expedition    + c.expeditionNet,
      pourboire:     acc.pourboire     + c.pourboireNet,
      totalGeneral:  acc.totalGeneral  + c.totalAvecExtras,
      // 🆕 RV-TOTAL-CREDITS — montant BRUT facturé (avant notes de crédit),
      // pour afficher Ventes brutes − Remboursements = Net sous le tableau.
      totalBrut:     acc.totalBrut     + c.venteHTBrute + v.tps + v.tvq + v.tvh + v.tvp + v.expedition + v.pourboire,
      nbRembourses:  acc.nbRembourses  + ((v.ratioRembourse || 0) > 0 ? 1 : 0),
      qte:           acc.qte           + v.quantite,
    };
  }, { venteHT: 0, tps: 0, tvq: 0, tvh: 0, tvp: 0, tpsPercuParEvend: 0, tvqPercuParEvend: 0, tvhPercuParEvend: 0, tvpPercuParEvend: 0, totalArticles: 0, expedition: 0, pourboire: 0, totalGeneral: 0, totalBrut: 0, nbRembourses: 0, qte: 0 });
  const totRembourse = Math.max(0, totVentes.totalBrut - totVentes.totalGeneral);
  const totPercuParEvend = totVentes.tpsPercuParEvend + totVentes.tvqPercuParEvend + totVentes.tvhPercuParEvend + totVentes.tvpPercuParEvend;

  // ── Totaux commissions ─────────────────────────────────────────────────────
  const totComm = commFiltrees.reduce((acc, c) => {
    const { ht: commHT, tps: commTPS, tvq: commTVQ, tvh: commTVH, tvp: commTVP } = ventilerCommission(c, province);
    return {
      venteHT:      acc.venteHT      + c.montantVenteHT,
      commBrute:    acc.commBrute    + c.commissionBrute,
      commHT:       acc.commHT       + commHT,
      commTPS:      acc.commTPS      + commTPS,
      commTVQ:      acc.commTVQ      + commTVQ,
      commTVH:      acc.commTVH      + commTVH,
      commTVP:      acc.commTVP      + commTVP,
    };
  }, { venteHT: 0, commBrute: 0, commHT: 0, commTPS: 0, commTVQ: 0, commTVH: 0, commTVP: 0 });

  // Plages rapides (calculées à partir de la date du jour, pas écrites en dur)
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const auj = new Date();
  const plagesRapides = [
    { label: 'Ce mois', d: iso(new Date(auj.getFullYear(), auj.getMonth(), 1)), f: iso(new Date(auj.getFullYear(), auj.getMonth() + 1, 0)) },
    { label: 'Mois dernier', d: iso(new Date(auj.getFullYear(), auj.getMonth() - 1, 1)), f: iso(new Date(auj.getFullYear(), auj.getMonth(), 0)) },
    { label: String(auj.getFullYear()), d: `${auj.getFullYear()}-01-01`, f: `${auj.getFullYear()}-12-31` },
    { label: String(auj.getFullYear() - 1), d: `${auj.getFullYear() - 1}-01-01`, f: `${auj.getFullYear() - 1}-12-31` },
    { label: 'Tout', d: '2020-01-01', f: iso(auj) },
  ];

  // ── Impression ─────────────────────────────────────────────────────────────
  const ONGLET_LABELS: Record<string, string> = {
    resume:       '📋 Résumé financier',
    ventes:       '💰 Détail des ventes',
    commissions:  '📊 Commissions payées',
  };

  const handlePrint = () => {
    // On récupère uniquement le div de l'onglet actif
    const printDiv = document.getElementById(`evend-print-${onglet}`);
    if (!printDiv) return;

    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) return;

    const titreOnglet = ONGLET_LABELS[onglet] ?? onglet;
    const periode = `${dateDebut} au ${dateFin}`;

    win.document.write(`
      <!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>${titreOnglet} — ${nomVendeur}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 20px; margin: 0; }
        @page { size: landscape; margin: 12mm 10mm; }
        h1 { font-size: 15px; color: #2d6a9f; margin: 0 0 2px 0; }
        p { margin: 0 0 3px 0; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 16px; page-break-inside: auto; }
        tr { page-break-inside: avoid; }
        th { background-color: #e8f2fb; color: #2d6a9f; font-weight: bold; padding: 7px 8px; border: 1px solid #ccc; text-align: left; font-size: 9px; text-transform: uppercase; }
        td { padding: 6px 8px; border: 1px solid #ddd; }
        tfoot td { background-color: #e8f2fb; font-weight: bold; border-top: 2px solid #2d6a9f; }
        tr:nth-child(even) td { background-color: #f8f8f8; }
        .print-header { display: flex; justify-content: space-between; border-bottom: 2px solid #2d6a9f; padding-bottom: 8px; margin-bottom: 14px; }
        .print-title { font-size: 13px; font-weight: bold; color: #2d6a9f; text-transform: uppercase; margin: 14px 0 6px 0; border-left: 4px solid #2d6a9f; padding-left: 8px; }
        .install-bg td { background-color: #fdf4ff !important; }
        .note { font-size: 9px; color: #999; margin-top: 16px; border-top: 1px solid #ddd; padding-top: 6px; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      </style></head><body>
      <div class="print-header">
        <div>
          <h1>${titreOnglet}</h1>
          <p>Boutique : <strong>${nomVendeur}</strong> &nbsp;·&nbsp; Période : ${periode}</p>
          <p>Statut fiscal : ${inscritTaxes ? `✅ Inscrit aux taxes (${province})` : '⬜ Non inscrit aux taxes'}</p>
        </div>
        <div style="text-align:right">
          <p>Généré le ${new Date().toLocaleDateString('fr-CA')}</p>
        </div>
      </div>
      ${printDiv.innerHTML}
      <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
      </body></html>
    `);
    win.document.close();
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  // 🎨 accent/accentLight suivent le thème choisi dans Configuration (variables
  // CSS posées par AppVendeur.tsx : --e-accent / --e-accent-light) — les
  // valeurs de repli ci-dessous sont EXACTEMENT celles du thème "classique"
  // (voir THEMES_VENDEUR.classique dans AppVendeur.tsx), donc aucun changement
  // visuel pour ce thème. bg reste fixe : cette page utilise un fond
  // (#f0f2f5) différent de --e-page-bg côté classique (#f4f6f8) — le thémer
  // changerait le rendu classique, donc on n'y touche pas. Couleurs
  // sémantiques (success/warning/danger/purple) : fixes, jamais thémées.
  const THEME = {
    accent: 'var(--e-accent, #2d6a9f)', accentLight: 'var(--e-accent-light, #e8f2fb)',
    bg: '#f0f2f5', card: '#ffffff', border: '#e1e4e8',
    text: '#1a2332', textLight: '#6b7280',
    success: '#16a34a', warning: '#d97706', danger: '#dc2626', purple: '#7c3aed',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: THEME.card, borderRadius: '12px',
    border: `1px solid ${THEME.border}`, overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  };
  const thStyle: React.CSSProperties = {
    padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700',
    color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px',
    whiteSpace: 'nowrap', backgroundColor: '#f8fafc',
  };
  const tdStyle: React.CSSProperties = { padding: '11px 14px', fontSize: '12px', color: THEME.text };
  const tfStyle: React.CSSProperties = {
    padding: '12px 14px', fontSize: '13px', fontWeight: '800',
    color: THEME.accent, backgroundColor: '#f0f7ff', borderTop: `2px solid ${THEME.accent}`,
  };

  // ── Contenu d'impression ───────────────────────────────────────────────────
  const printContent = (
    <div>
      {/* En-tête impression */}
      <div className="header">
        <div>
          <h1>Rapport financier</h1>
          <p>Boutique : <strong>{nomVendeur}</strong></p>
          <p>Période : {dateDebut} au {dateFin}</p>
          <p>Statut fiscal : <span className="badge">{inscritTaxes ? `✅ Inscrit aux taxes (${province})` : '⬜ Non inscrit aux taxes'}</span></p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p>Généré le {new Date().toLocaleDateString('fr-CA')}</p>
        </div>
      </div>

      {/* Résumé */}
      <div className="section-title">Résumé financier</div>
      <table>
        <thead><tr>
          <th>Élément</th><th>Montant HT</th>
          <th>TPS collectée</th><th>TVQ collectée</th>
          <th>Total</th>
        </tr></thead>
        <tbody>
          <tr>
            <td>Ventes produits</td>
            <td>{fmtMoney(totVentes.venteHT)}</td>
            <td>{fmtMoney(totVentes.tps)}</td><td>{fmtMoney(totVentes.tvq)}</td>
            <td>{fmtMoney(totVentes.totalArticles)}</td>
          </tr>
          <tr>
            <td>Expédition</td>
            <td>{fmtMoney(totVentes.expedition)}</td>
            <td>—</td><td>—</td>
            <td>{fmtMoney(totVentes.expedition)}</td>
          </tr>
          <tr>
            <td>Pourboires</td>
            <td>{fmtMoney(totVentes.pourboire)}</td>
            <td>—</td><td>—</td>
            <td>{fmtMoney(totVentes.pourboire)}</td>
          </tr>
          <tr>
            <td>Commissions payées au gestionnaire (déductibles)</td>
            <td>-{fmtMoney(totComm.commHT)}</td>
            <td>-{fmtMoney(totComm.commTPS)}</td><td>-{fmtMoney(totComm.commTVQ)}</td>
            <td>-{fmtMoney(totComm.commBrute)}</td>
          </tr>
        </tbody>
        <tfoot><tr>
          <td>REVENUS NETS</td>
          <td>{fmtMoney(totVentes.venteHT + totVentes.expedition + totVentes.pourboire - totComm.commHT)}</td>
          <td>{fmtMoney(totVentes.tps - totComm.commTPS)}</td><td>{fmtMoney(totVentes.tvq - totComm.commTVQ)}</td>
          <td>{fmtMoney(totVentes.totalGeneral - totComm.commBrute)}</td>
        </tr></tfoot>
      </table>
      {(totVentes.tpsPercuParEvend + totVentes.tvqPercuParEvend) > 0 && (
        <p style={{ fontSize: '10px', color: '#666', margin: '4px 0 0 0' }}>
          🏢 Ne comprend pas la taxe perçue par le gestionnaire en votre nom sur vos ventes non-inscrites : TPS {fmtMoney(totVentes.tpsPercuParEvend)}, TVQ {fmtMoney(totVentes.tvqPercuParEvend)}.
        </p>
      )}

      {/* Tableau ventes */}
      <div className="section-title">Détail des ventes</div>
      <table>
        <thead><tr>
          <th>Date</th><th>Order ID</th><th>Produit</th><th>Qté</th>
          <th>Prix unit.</th><th>Vente HT</th><th>Expédition</th><th>Pourboire</th>
          <th>TPS</th><th>TVQ</th><th>TVH</th><th>TVP</th>
          <th>Total</th>
        </tr></thead>
        <tbody>
          {ventesFiltrees.map(v => {
            const c = calcVente(v);
            const estPercuParEvend = v.taxeRemisePar === 'e-vend';
            const cell = (m: number, remb: number) => estPercuParEvend
              ? 'Gestionnaire'
              : (remb > 0
                  ? <>{fmtMoney(m)}<br/><span style={{ color: '#dc2626', fontWeight: 700, fontSize: '9px' }}>− {fmtMoney(remb)}</span></>
                  : fmtMoney(m));
            return (
              <tr key={v.id}>
                <td>{v.date}</td>
                <td>{v.orderId}<br/><span style={{fontSize:'9px',color:'#aaa'}}>{v.storeOrderId}</span></td>
                <td>{v.produit}</td>
                <td style={{textAlign:'center'}}>{v.quantite}</td>
                <td>{fmtMoney(v.prixUnitaire)}</td>
                <td><strong>{fmtMoney(c.venteHT)}</strong></td>
                <td>{v.expedition > 0 ? fmtMoney(v.expedition) : '—'}</td>
                <td>{v.pourboire > 0 ? fmtMoney(v.pourboire) : '—'}</td>
                <td>{cell(c.tps, v.tpsRembourse)}</td><td>{cell(c.tvq, v.tvqRembourse)}</td><td>{cell(c.tvh, v.tvhRembourse)}</td><td>{cell(c.tvp, v.tvpRembourse)}</td>
                <td><strong>{fmtMoney(c.totalAvecExtras)}</strong></td>
              </tr>
            );
          })}
        </tbody>
        <tfoot><tr>
          <td colSpan={4}><strong>TOTAL — {ventesFiltrees.length} lignes · {totVentes.qte} articles</strong></td>
          <td></td>
          <td><strong>{fmtMoney(totVentes.venteHT)}</strong></td>
          <td><strong>{fmtMoney(totVentes.expedition)}</strong></td>
          <td><strong>{fmtMoney(totVentes.pourboire)}</strong></td>
          <td><strong>{fmtMoney(totVentes.tps)}</strong></td><td><strong>{fmtMoney(totVentes.tvq)}</strong></td><td><strong>{fmtMoney(totVentes.tvh)}</strong></td><td><strong>{fmtMoney(totVentes.tvp)}</strong></td>
          <td><strong>{fmtMoney(totVentes.totalGeneral)}</strong></td>
        </tr></tfoot>
      </table>

      {/* Tableau commissions */}
      <div className="section-title">Commissions payées au gestionnaire (charges déductibles)</div>
      <table>
        <thead><tr>
          <th>Date</th><th>Order ID</th>
          <th>Vente HT (base calcul)</th><th>Commission HT</th>
          <th>TPS comm.</th><th>TVQ comm.</th><th>TVH comm.</th><th>TVP comm.</th><th>Total comm. payée</th>
        </tr></thead>
        <tbody>
          {commFiltrees.map(c => {
            const { ht, tps, tvq, tvh, tvp } = ventilerCommission(c, province);
            return (
              <tr key={c.id}>
                <td>{c.date}</td>
                <td>{c.orderId}<br/><span style={{fontSize:'9px',color:'#aaa'}}>{c.storeOrderId}</span></td>
                <td>{fmtMoney(c.montantVenteHT)}</td>
                <td>{fmtMoney(ht)}</td>
                <td>{fmtMoney(tps)}</td>
                <td>{fmtMoney(tvq)}</td>
                <td>{fmtMoney(tvh)}</td>
                <td>{fmtMoney(tvp)}</td>
                <td><strong>{fmtMoney(c.commissionBrute)}</strong>{c.estimee ? ' *' : ''}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot><tr>
          <td colSpan={2}><strong>TOTAL — {commFiltrees.length} lignes</strong></td>
          <td><strong>{fmtMoney(totComm.venteHT)}</strong></td>
          <td><strong>{fmtMoney(totComm.commHT)}</strong></td>
          <td><strong>{fmtMoney(totComm.commTPS)}</strong></td>
          <td><strong>{fmtMoney(totComm.commTVQ)}</strong></td>
          <td><strong>{fmtMoney(totComm.commTVH)}</strong></td>
          <td><strong>{fmtMoney(totComm.commTVP)}</strong></td>
          <td><strong>{fmtMoney(totComm.commBrute)}</strong></td>
        </tr></tfoot>
      </table>

      <p className="note">
        ⚠️ Note : Les commissions payées au gestionnaire sont calculées selon la base de calcul définie par votre gestionnaire (jamais sur les pourboires).
        Ce rapport est fourni à titre indicatif. Consultez votre comptable pour la préparation officielle de vos déclarations fiscales.
        {inscritTaxes ? ` Vous êtes inscrit aux fichiers de taxe (${province}) : les taxes perçues sur vos ventes vous sont dues, voir l'onglet "Détail ventes" pour le détail par commande.` : ' Vous n\'êtes pas inscrit aux fichiers de taxe : aucune taxe n\'est perçue sur vos ventes.'}
        {commFiltrees.some(c => c.estimee) ? ' * Commission estimée (ventilation taxe pas encore capturée pour cette commande).' : ''}
      </p>
    </div>
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', backgroundColor: '#f0f2f5' }}>
      <div style={{ textAlign: 'center', color: '#537373' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
        <p style={{ fontSize: '14px', fontWeight: 600 }}>Chargement du rapport...</p>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .e-hero-classique { display: none; }
        .rf-racine table { font-variant-numeric: tabular-nums; }
      `}</style>
      <div className="rf-racine" style={{ padding: isMobile ? '16px' : '24px 28px', maxWidth: '1200px', backgroundColor: 'transparent', minHeight: '60vh',
        ['--e-accent' as any]: accent || '#2d6a9f', ['--e-accent-light' as any]: `${accent || '#2d6a9f'}1a`,
        ['--e-hero-start' as any]: accent || '#2563eb', ['--e-hero-end' as any]: `color-mix(in srgb, ${accent || '#2563eb'} 65%, #000)` }}>

        {/* En-tête — CLASSIQUE (inchangé) */}
        <div className="e-hero-classique">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Mon rapport financier
              </h1>
              <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
                Ventes, taxes et commissions — {nomVendeur}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

              {/* Statut fiscal — lecture seule, reflète le statut ACTUEL du vendeur.
                  Ne préjuge pas de comment chaque vente passée a été traitée —
                  voir la colonne "Statut" par ligne dans l'onglet Détail ventes. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: inscritTaxes ? '#dcfce7' : '#f3f4f6', border: `1px solid ${inscritTaxes ? '#86efac' : THEME.border}`, borderRadius: '10px', padding: '8px 14px' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: '800', color: inscritTaxes ? THEME.success : THEME.textLight, margin: '0 0 1px 0' }}>
                    {inscritTaxes ? '✅ Inscrit aux taxes' : '⬜ Non inscrit aux taxes'}
                  </p>
                  <p style={{ fontSize: '10px', color: '#aaa', margin: 0 }}>
                    {inscritTaxes ? `Statut actuel — province ${province}` : 'Aucune taxe perçue sur vos ventes'}
                  </p>
                </div>
              </div>

              <button onClick={handlePrint} style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🖨️ Imprimer / PDF
              </button>
            </div>
          </div>
        </div>

        {/* En-tête — VIBRANT (tous les autres thèmes) — même contenu, habillé en
            bannière dégradée, boutons/badge adaptés en overlay clair sur fond
            coloré. Le bouton Imprimer reste fonctionnel (même handlePrint). */}
        <div className="e-hero-vibrant">
          <div style={{
            background: 'linear-gradient(135deg, var(--e-hero-start, #2563eb) 0%, var(--e-hero-end, #1e40af) 100%)',
            borderRadius: 'var(--e-radius, 12px)', padding: '20px 24px', position: 'relative', overflow: 'hidden',
            marginBottom: '20px',
          }}>
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Mon rapport financier
                </h1>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                  Ventes, taxes et commissions — {nomVendeur}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' as const }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: '10px', padding: '8px 14px' }}>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: '800', color: '#fff', margin: '0 0 1px 0' }}>
                      {inscritTaxes ? '✅ Inscrit aux taxes' : '⬜ Non inscrit aux taxes'}
                    </p>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                      {inscritTaxes ? `Statut actuel — province ${province}` : 'Aucune taxe perçue sur vos ventes'}
                    </p>
                  </div>
                </div>

                <button onClick={handlePrint} style={{ backgroundColor: '#fff', color: THEME.accent, border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🖨️ Imprimer / PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div style={{ ...cardStyle, padding: '14px 18px', marginBottom: '18px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>🗓️ Période</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: THEME.textLight }}>Du</label>
              <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
                style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '7px 10px', fontSize: '12px', outline: 'none', backgroundColor: 'white' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: THEME.textLight }}>Au</label>
              <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
                style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '7px 10px', fontSize: '12px', outline: 'none', backgroundColor: 'white' }} />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {plagesRapides.map(r => (
                <button key={r.label} onClick={() => { setDateDebut(r.d); setDateFin(r.f); }}
                  style={{ padding: '6px 11px', borderRadius: '6px', border: `1px solid ${THEME.border}`, backgroundColor: dateDebut === r.d && dateFin === r.f ? THEME.accent : 'white', color: dateDebut === r.d && dateFin === r.f ? 'white' : THEME.textLight, fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                  {r.label}
                </button>
              ))}
            </div>
            <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="🔍 Produit, order ID..."
              style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '7px 12px', fontSize: '12px', outline: 'none', width: isMobile ? '100%' : '180px', boxSizing: 'border-box' as const, backgroundColor: 'white' }} />
          </div>
        </div>

        {/* KPIs — carte blanche (CLASSIQUE seulement) : voir bannière dégradée
            .e-hero-vibrant juste après pour les autres thèmes. */}
        {/* 🎨 kpiData extrait ici pour être réutilisé tel quel par la version
            vibrante ci-dessous (mêmes valeurs, juste un autre habillage). */}
        {(() => {
          const kpiData = [
            { label: 'Ventes HT', val: fmtMoney(totVentes.venteHT), icon: '💰', c: THEME.success, sous: `${ventesFiltrees.length} commandes · ${totVentes.qte} articles` },
            // 🆕 MIS À JOUR (voir resume-fiscal.md) — totVentes.tps/tvq/tvh/tvp
            // n'incluent déjà QUE ce que le vendeur doit lui-même déclarer (voir
            // le reduce plus haut) : plus besoin de les cacher derrière
            // inscritTaxes, qui reflète seulement le statut ACTUEL et masquerait
            // à tort de vraies taxes dues si le vendeur s'est inscrit en cours de
            // période (ventes antérieures encore "e-vend", ventes récentes déjà
            // "vendeur" — les deux doivent apparaître correctement ventilées).
            {
              label: 'Taxes à déclarer',
              val: fmtMoney(totVentes.tps + totVentes.tvq + totVentes.tvh + totVentes.tvp),
              icon: '🏛️', c: THEME.warning,
              sous: `TPS ${fmtMoney(totVentes.tps)} · TVQ ${fmtMoney(totVentes.tvq)}`,
            },
            { label: 'Expédition + pourboires', val: fmtMoney(totVentes.expedition + totVentes.pourboire), icon: '🚚', c: THEME.accent, bg: THEME.accentLight, sous: `Expéd. ${fmtMoney(totVentes.expedition)} · Pourb. ${fmtMoney(totVentes.pourboire)}` },
            { label: 'Commissions au gestionnaire', val: fmtMoney(totComm.commBrute), icon: '📊', c: THEME.danger, sous: `HT : ${fmtMoney(totComm.commHT)} (déductible)` },
          ];
          const percuParEvendTotal = totVentes.tpsPercuParEvend + totVentes.tvqPercuParEvend + totVentes.tvhPercuParEvend + totVentes.tvpPercuParEvend;
          return (
            <>
              <div className="e-hero-classique">
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '18px' }}>
                  {kpiData.map((k, i) => (
                    <div key={i} style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '18px', width: '36px', height: '36px', borderRadius: '8px', backgroundColor: k.bg || (k.c + '18'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{k.icon}</div>
                        <p style={{ fontSize: '18px', fontWeight: '900', color: THEME.text, margin: 0, lineHeight: 1 }}>{k.val}</p>
                      </div>
                      <p style={{ fontSize: '11px', fontWeight: '700', color: THEME.textLight, margin: '0 0 2px 0' }}>{k.label}</p>
                      <p style={{ fontSize: '10px', color: '#aaa', margin: 0 }}>{k.sous}</p>
                    </div>
                  ))}
                  {/* Carte informative — n'apparaît que s'il y a des ventes où le gestionnaire a
                      perçu la taxe pour le compte du vendeur (non-inscrit à ce moment). */}
                  {percuParEvendTotal > 0 && (
                    <div style={{ backgroundColor: THEME.accentLight, borderRadius: '12px', border: `1px solid ${THEME.accent}`, padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '18px', width: '36px', height: '36px', borderRadius: '8px', backgroundColor: THEME.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🏢</div>
                        <p style={{ fontSize: '18px', fontWeight: '900', color: THEME.text, margin: 0, lineHeight: 1 }}>
                          {fmtMoney(percuParEvendTotal)}
                        </p>
                      </div>
                      <p style={{ fontSize: '11px', fontWeight: '700', color: THEME.textLight, margin: '0 0 2px 0' }}>Perçu par le gestionnaire pour vous</p>
                      <p style={{ fontSize: '10px', color: '#aaa', margin: 0 }}>Ventes non-inscrites — rien à déclarer de votre côté sur ce montant</p>
                    </div>
                  )}
                </div>
              </div>

              {/* KPIs — bannière dégradée (tous les autres thèmes), statistiques
                  en texte blanc sans boîte, comme sur "Paiements & Commissions". */}
              <div className="e-hero-vibrant">
                <div style={{
                  background: 'linear-gradient(135deg, var(--e-hero-start, #2563eb) 0%, var(--e-hero-end, #1e40af) 100%)',
                  borderRadius: 'var(--e-radius, 12px)', padding: '20px 24px', position: 'relative', overflow: 'hidden',
                  marginBottom: '18px',
                }}>
                  <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '24px', flexWrap: 'wrap' as const }}>
                    {kpiData.map((k, i) => (
                      <div key={i}>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{k.icon} {k.val}</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', margin: '2px 0 0' }}>{k.label}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', margin: '1px 0 0' }}>{k.sous}</div>
                      </div>
                    ))}
                    {percuParEvendTotal > 0 && (
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>🏢 {fmtMoney(percuParEvendTotal)}</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', margin: '2px 0 0' }}>Perçu par le gestionnaire pour vous</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        {/* Onglets */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', backgroundColor: 'white', borderRadius: '10px', border: `1px solid ${THEME.border}`, padding: '4px', width: isMobile ? '100%' : 'fit-content', overflowX: isMobile ? 'auto' as const : 'visible' as const, WebkitOverflowScrolling: 'touch' as const }}>
          {[
            { val: 'resume',      label: '📋 Résumé'         },
            { val: 'ventes',      label: '💰 Détail ventes'  },
          { val: 'commissions', label: '📊 Commissions'    },
          ].map(o => (
            <button key={o.val} onClick={() => setOnglet(o.val as any)}
              style={{ padding: isMobile ? '8px 12px' : '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: isMobile ? '12px' : '13px', fontWeight: '700', backgroundColor: onglet === o.val ? THEME.accent : 'transparent', color: onglet === o.val ? 'white' : THEME.textLight, transition: 'all 0.15s', whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
              {o.label}
            </button>
          ))}
        </div>

        {/* ── RÉSUMÉ ── */}
        {onglet === 'resume' && (
          <div id="evend-print-resume">
            {/* Bloc résumé sombre */}
            <div style={{ backgroundColor: '#1a2332', borderRadius: '14px', padding: '22px 26px', marginBottom: '16px', color: 'white' }}>
              <p style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>Résumé financier — {nomVendeur}</p>
              <h2 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 16px 0' }}>
                Revenus nets estimés : <span style={{ color: '#4ade80' }}>{fmtMoney(totVentes.totalGeneral - totComm.commBrute)}</span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { label: 'Ventes articles HT', val: fmtMoney(totVentes.venteHT), icon: '💰', c: '#60a5fa' },
                  { label: 'Expédition', val: fmtMoney(totVentes.expedition), icon: '🚚', c: '#a78bfa' },
                  { label: 'Pourboires', val: fmtMoney(totVentes.pourboire), icon: '🎁', c: '#34d399' },
                  // 🆕 MIS À JOUR — toujours réel (déjà vendeur-only), plus jamais
                  // masqué derrière inscritTaxes (voir note plus haut).
                  { label: 'TPS à reverser', val: fmtMoney(totVentes.tps), icon: '🏛️', c: '#fb923c' },
                  { label: 'TVQ à reverser', val: fmtMoney(totVentes.tvq), icon: '🏛️', c: '#fb923c' },
                  ...(totVentes.tvh > 0 ? [{ label: 'TVH à reverser', val: fmtMoney(totVentes.tvh), icon: '🏛️', c: '#fb923c' }] : []),
                  ...(totVentes.tvp > 0 ? [{ label: 'TVP à reverser', val: fmtMoney(totVentes.tvp), icon: '🏛️', c: '#fb923c' }] : []),
                  { label: 'Commissions payées au gestionnaire', val: `-${fmtMoney(totComm.commBrute)}`, icon: '📊', c: '#f87171' },
                  ...((totVentes.tpsPercuParEvend + totVentes.tvqPercuParEvend + totVentes.tvhPercuParEvend + totVentes.tvpPercuParEvend) > 0 ? [{
                    label: 'Perçu par le gestionnaire (pour vous)',
                    val: fmtMoney(totVentes.tpsPercuParEvend + totVentes.tvqPercuParEvend + totVentes.tvhPercuParEvend + totVentes.tvpPercuParEvend),
                    icon: '🏢', c: '#7dd3fc',
                  }] : []),
                ].map((k, i) => (
                  <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 14px' }}>
                    <p style={{ fontSize: '16px', fontWeight: '900', color: k.c, margin: '0 0 2px 0' }}>{k.val}</p>
                    <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>{k.icon} {k.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tableau résumé */}
            <div style={cardStyle}>
              <div style={{ padding: '13px 18px', backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}` }}>
                <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase' }}>📋 Tableau récapitulatif</h3>
              </div>
              <div style={{ overflowX: 'auto' as const }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '650px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                    {/* 🆕 MIS À JOUR — toujours visibles, plus jamais masquées par
                        inscritTaxes (voir note plus haut : les totaux sont déjà
                        correctement filtrés vendeur-only, peu importe le statut
                        actuel du compte). */}
                    {['Élément', 'Montant HT', 'TPS', 'TVQ', 'Total'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: '💰 Ventes articles', ht: totVentes.venteHT, tps: totVentes.tps, tvq: totVentes.tvq, total: totVentes.totalArticles },
                    { label: '🚚 Expédition', ht: totVentes.expedition, tps: 0, tvq: 0, total: totVentes.expedition, noTax: true },
                    { label: '🎁 Pourboires', ht: totVentes.pourboire, tps: 0, tvq: 0, total: totVentes.pourboire, noTax: true },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f5f5f5', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={tdStyle}>{row.label}</td>
                      <td style={{ ...tdStyle, fontWeight: '700' }}>{fmtMoney(row.ht)}</td>
                      <td style={{ ...tdStyle, color: THEME.success }}>{row.noTax ? '—' : fmtMoney(row.tps)}</td>
                      <td style={{ ...tdStyle, color: THEME.success }}>{row.noTax ? '—' : fmtMoney(row.tvq)}</td>
                      <td style={{ ...tdStyle, fontWeight: '800' }}>{fmtMoney(row.total)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderBottom: '1px solid #f5f5f5', backgroundColor: '#fff8f8' }}>
                    <td style={{ ...tdStyle, color: THEME.danger }}>📊 Commissions du gestionnaire (déductibles)</td>
                    <td style={{ ...tdStyle, fontWeight: '700', color: THEME.danger }}>-{fmtMoney(totComm.commHT)}</td>
                    <td style={{ ...tdStyle, color: THEME.danger }}>-{fmtMoney(totComm.commTPS)}</td>
                    <td style={{ ...tdStyle, color: THEME.danger }}>-{fmtMoney(totComm.commTVQ)}</td>
                    <td style={{ ...tdStyle, fontWeight: '800', color: THEME.danger }}>-{fmtMoney(totComm.commBrute)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{ ...tfStyle }}>REVENUS NETS</td>
                    <td style={{ ...tfStyle }}>{fmtMoney(totVentes.venteHT + totVentes.expedition + totVentes.pourboire - totComm.commHT)}</td>
                    <td style={{ ...tfStyle, color: THEME.warning }}>{fmtMoney(totVentes.tps - totComm.commTPS)}</td>
                    <td style={{ ...tfStyle, color: THEME.warning }}>{fmtMoney(totVentes.tvq - totComm.commTVQ)}</td>
                    <td style={{ ...tfStyle, fontSize: '16px', color: THEME.success }}>{fmtMoney(totVentes.totalGeneral - totComm.commBrute)}</td>
                  </tr>
                </tfoot>
              </table>
              </div>
            </div>

            {(totVentes.tps - totComm.commTPS > 0 || totVentes.tvq - totComm.commTVQ > 0 || totVentes.tvh > 0 || totVentes.tvp > 0) && (
              <div style={{ marginTop: '12px', backgroundColor: '#fef9c3', borderRadius: '8px', padding: '12px 16px', border: '1px solid #d97706' }}>
                <p style={{ fontSize: '12px', fontWeight: '800', color: '#92400e', margin: '0 0 4px 0' }}>🏛️ Rappel déclaration taxes</p>
                <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>
                  TPS à reverser à l'ARC : <strong>{fmtMoney(totVentes.tps - totComm.commTPS)}</strong> ·
                  TVQ à reverser à Revenu Québec : <strong>{fmtMoney(totVentes.tvq - totComm.commTVQ)}</strong>
                  {(totVentes.tvh > 0) && <> · TVH : <strong>{fmtMoney(totVentes.tvh)}</strong></>}
                  {(totVentes.tvp > 0) && <> · TVP : <strong>{fmtMoney(totVentes.tvp)}</strong></>}
                  <br/>Vous pouvez déduire la TPS/TVQ payée sur vos commissions du gestionnaire (crédits de taxe sur intrants).
                  {(totVentes.tpsPercuParEvend + totVentes.tvqPercuParEvend) > 0 && <><br/>Ces montants n'incluent pas la taxe perçue par le gestionnaire en votre nom sur vos ventes non-inscrites — voir l'onglet "Détail ventes".</>}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── VENTES ── */}
        {onglet === 'ventes' && (
          <div id="evend-print-ventes" style={cardStyle}>
            <div style={{ padding: '13px 18px', backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase' }}>
                💰 Détail ventes — {ventesFiltrees.length} commandes · {totVentes.qte} articles
              </h3>
              {/* 🆕 MIS À JOUR (voir resume-fiscal.md) — les colonnes de taxe sont
                  maintenant TOUJOURS visibles (elles ne dépendent plus d'un
                  interrupteur global "inscrit aux taxes") : chaque commande a
                  son propre statut selon si le gestionnaire a perçu la taxe pour ce
                  vendeur non-inscrit au moment précis de cette vente. */}
              {(totVentes.tpsPercuParEvend + totVentes.tvqPercuParEvend + totVentes.tvhPercuParEvend + totVentes.tvpPercuParEvend) > 0 && (
                <span style={{ fontSize: '11px', backgroundColor: '#e8f2fb', color: THEME.accent, padding: '4px 10px', borderRadius: '20px', fontWeight: '700' }}>
                  🏢 Certaines taxes ont été perçues par le gestionnaire — voir légende
                </span>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1050px' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${THEME.border}` }}>
                    {['Date', 'Order ID', 'Produit', 'Qté', 'Prix unit.', 'Vente HT', 'Expédition', 'Pourboire', 'TPS', 'TVQ', 'TVH', 'TVP', 'Statut', 'Total'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ventesFiltrees.map((v, i) => {
                    const c = calcVente(v);
                    const estPercuParEvend = v.taxeRemisePar === 'e-vend';
                    // Cellule de taxe : montant net (après remboursement) si le
                    // vendeur est inscrit — avec la portion remboursée affichée
                    // en rouge/négatif juste en dessous quand applicable, pour
                    // que le vendeur sache exactement quoi retirer de sa propre
                    // déclaration. Sinon un badge informatif, jamais un chiffre
                    // que le vendeur pourrait confondre avec sa propre taxe à
                    // déclarer (c'est le gestionnaire qui la remet, pas lui).
                    const celluleTaxe = (montantNet: number, montantRembourse: number) => estPercuParEvend
                      ? <span style={{ fontSize: '10px', color: THEME.accent, fontStyle: 'italic' }}>Perçu par le gestionnaire</span>
                      : (
                        <div>
                          <span>{fmtMoney(montantNet)}</span>
                          {montantRembourse > 0 && (
                            <div style={{ fontSize: '10px', fontWeight: '700', color: THEME.danger }}>− {fmtMoney(montantRembourse)}</div>
                          )}
                        </div>
                      );
                    return (
                      <tr key={v.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={tdStyle}>{v.date}</td>
                        <td style={tdStyle}>
                          <p style={{ fontSize: '12px', fontWeight: '700', color: THEME.accent, margin: 0 }}>{v.orderId}</p>
                          <p style={{ fontSize: '10px', color: '#aaa', margin: 0 }}>{v.storeOrderId}</p>
                        </td>
                        <td style={{ ...tdStyle, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.produit}>{v.produit}</td>
                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '700' }}>{v.quantite}</td>
                        <td style={tdStyle}>{fmtMoney(v.prixUnitaire)}</td>
                        <td style={{ ...tdStyle, fontWeight: '800', color: THEME.success }}>
                          {fmtMoney(c.venteHT)}
                          {c.venteHT < c.venteHTBrute - 0.005 && (
                            <div style={{ fontSize: '10px', color: '#aaa', textDecoration: 'line-through', fontWeight: 400 }}>{fmtMoney(c.venteHTBrute)}</div>
                          )}
                        </td>
                        <td style={{ ...tdStyle, color: THEME.accent }}>{v.expedition > 0 ? fmtMoney(v.expedition) : <span style={{ color: '#ccc' }}>—</span>}</td>
                        <td style={{ ...tdStyle, color: '#d97706' }}>{v.pourboire > 0 ? fmtMoney(v.pourboire) : <span style={{ color: '#ccc' }}>—</span>}</td>
                        <td style={{ ...tdStyle, color: THEME.success }}>{celluleTaxe(c.tps, v.tpsRembourse)}</td>
                        <td style={{ ...tdStyle, color: THEME.success }}>{celluleTaxe(c.tvq, v.tvqRembourse)}</td>
                        <td style={{ ...tdStyle, color: THEME.success }}>{celluleTaxe(c.tvh, v.tvhRembourse)}</td>
                        <td style={{ ...tdStyle, color: THEME.success }}>{celluleTaxe(c.tvp, v.tvpRembourse)}</td>
                        <td style={tdStyle}>
                          {c.estRembourseTotal ? (
                            <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#fee2e2', color: THEME.danger }}>Remboursé</span>
                          ) : c.estRembourseParti ? (
                            <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#fef9c3', color: THEME.warning }} title={`Taxe remboursée : ${fmtMoney(c.taxeRembourseeTotal)}`}>Remb. partiel</span>
                          ) : v.statutPaiement === 'refund_echoue' ? (
                            <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#fee2e2', color: THEME.danger }}>Remb. échoué</span>
                          ) : (
                            <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#f0fdf4', color: THEME.success }}>Payé</span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: '900', fontSize: '13px' }}>{fmtMoney(c.totalAvecExtras)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={tfStyle}>TOTAL — {ventesFiltrees.length} lignes</td>
                    <td style={tfStyle}></td>
                    <td style={{ ...tfStyle, color: THEME.success }}>{fmtMoney(totVentes.venteHT)}</td>
                    <td style={{ ...tfStyle, color: THEME.accent }}>{fmtMoney(totVentes.expedition)}</td>
                    <td style={{ ...tfStyle, color: '#d97706' }}>{fmtMoney(totVentes.pourboire)}</td>
                    {([['tps', totVentes.tps, totVentes.tpsPercuParEvend], ['tvq', totVentes.tvq, totVentes.tvqPercuParEvend], ['tvh', totVentes.tvh, totVentes.tvhPercuParEvend], ['tvp', totVentes.tvp, totVentes.tvpPercuParEvend]] as [string, number, number][]).map(([k, vendeur, evend]) => (
                      <td key={k} style={{ ...tfStyle, color: THEME.success }}>
                        {fmtMoney(vendeur)}
                        {evend > 0.004 && (
                          <div style={{ fontSize: '10px', fontWeight: 600, fontStyle: 'italic', color: THEME.accent }} title="Taxe perçue et remise par le gestionnaire — incluse dans le Total, pas dans votre déclaration">+ {fmtMoney(evend)} gestionnaire</div>
                        )}
                      </td>
                    ))}
                    <td style={tfStyle}></td>
                    <td style={{ ...tfStyle, fontSize: '15px' }}>{fmtMoney(totVentes.totalGeneral)}</td>
                  </tr>
                  {totRembourse > 0.004 && (
                    <tr>
                      <td colSpan={14} style={{ ...tfStyle, fontWeight: 600, fontSize: '12px', textAlign: 'right' }}>
                        Ventes brutes facturées <strong>{fmtMoney(totVentes.totalBrut)}</strong>
                        <span style={{ color: THEME.danger }}> − Remboursements / notes de crédit ({totVentes.nbRembourses}) <strong>{fmtMoney(totRembourse)}</strong></span>
                        {' '}= Total net <strong>{fmtMoney(totVentes.totalGeneral)}</strong>
                        {totPercuParEvend > 0.004 && (
                          <span style={{ color: THEME.accent, fontStyle: 'italic' }}> · dont {fmtMoney(totPercuParEvend)} de taxes perçues et remises par le gestionnaire</span>
                        )}
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>

            {/* 🆕 Légende + montant perçu par le gestionnaire, informatif — le vendeur n'a
                rien à déclarer sur ce montant, c'est le gestionnaire qui le remet. */}
            <div style={{ padding: '14px 18px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafbfc' }}>
              <p style={{ fontSize: '11px', color: THEME.textLight, margin: '0 0 8px 0', lineHeight: 1.6 }}>
                <strong>TPS/TVQ/TVH/TVP</strong> affichent le montant réel perçu sur chaque vente, net de tout remboursement. Sur les ventes marquées <em style={{ color: THEME.accent }}>« Perçu par le gestionnaire »</em>, la taxe a été retenue et sera remise au gouvernement par le gestionnaire directement (vous n'étiez pas inscrit aux fichiers de taxe au moment de cette vente) — n'incluez pas ces montants dans votre propre déclaration.
              </p>
              {(totVentes.tpsPercuParEvend + totVentes.tvqPercuParEvend + totVentes.tvhPercuParEvend + totVentes.tvpPercuParEvend) > 0 && (
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
                  <span style={{ color: THEME.textLight }}>🏢 Perçu par le gestionnaire pour votre compte :</span>
                  <span><strong>TPS</strong> {fmtMoney(totVentes.tpsPercuParEvend)}</span>
                  <span><strong>TVQ</strong> {fmtMoney(totVentes.tvqPercuParEvend)}</span>
                  {totVentes.tvhPercuParEvend > 0 && <span><strong>TVH</strong> {fmtMoney(totVentes.tvhPercuParEvend)}</span>}
                  {totVentes.tvpPercuParEvend > 0 && <span><strong>TVP</strong> {fmtMoney(totVentes.tvpPercuParEvend)}</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── COMMISSIONS ── */}
        {onglet === 'commissions' && (
          <div id="evend-print-commissions" style={cardStyle}>
            <div style={{ padding: '13px 18px', backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase' }}>
                📊 Commissions payées au gestionnaire — {commFiltrees.length} transactions
              </h3>
              <span style={{ fontSize: '11px', color: THEME.textLight, fontWeight: '600' }}>
                💡 Charges déductibles · Base de calcul = vente HT seulement
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${THEME.border}` }}>
                    {['Date', 'Order ID', 'Vente HT (base)', 'Commission HT', 'TPS comm.', 'TVQ comm.', 'TVH comm.', 'TVP comm.', 'Total payé'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {commFiltrees.map((c, i) => {
                    const { ht, tps, tvq, tvh, tvp } = ventilerCommission(c, province);
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={tdStyle}>{c.date}</td>
                        <td style={tdStyle}>
                          <p style={{ fontSize: '12px', fontWeight: '700', color: THEME.accent, margin: 0 }}>{c.orderId}</p>
                          <p style={{ fontSize: '10px', color: '#aaa', margin: 0 }}>{c.storeOrderId}</p>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: '700' }}>{fmtMoney(c.montantVenteHT)}</td>
                        <td style={{ ...tdStyle, color: THEME.danger }}>{fmtMoney(ht)}</td>
                        <td style={{ ...tdStyle, color: THEME.danger, fontSize: '11px' }}>{fmtMoney(tps)}</td>
                        <td style={{ ...tdStyle, color: THEME.danger, fontSize: '11px' }}>{fmtMoney(tvq)}</td>
                        <td style={{ ...tdStyle, color: THEME.danger, fontSize: '11px' }}>{fmtMoney(tvh)}</td>
                        <td style={{ ...tdStyle, color: THEME.danger, fontSize: '11px' }}>{fmtMoney(tvp)}</td>
                        <td style={{ ...tdStyle, fontWeight: '900', color: THEME.danger }}>{fmtMoney(c.commissionBrute)}{c.estimee ? ' *' : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} style={tfStyle}>TOTAL — {commFiltrees.length} lignes</td>
                    <td style={tfStyle}>{fmtMoney(totComm.venteHT)}</td>
                    <td style={{ ...tfStyle, color: THEME.danger }}>{fmtMoney(totComm.commHT)}</td>
                    <td style={{ ...tfStyle, color: THEME.danger }}>{fmtMoney(totComm.commTPS)}</td>
                    <td style={{ ...tfStyle, color: THEME.danger }}>{fmtMoney(totComm.commTVQ)}</td>
                    <td style={{ ...tfStyle, color: THEME.danger }}>{fmtMoney(totComm.commTVH)}</td>
                    <td style={{ ...tfStyle, color: THEME.danger }}>{fmtMoney(totComm.commTVP)}</td>
                    <td style={{ ...tfStyle, color: THEME.danger, fontSize: '15px' }}>{fmtMoney(totComm.commBrute)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div style={{ padding: '12px 18px', backgroundColor: '#fff8f8', borderTop: `1px solid ${THEME.border}` }}>
              <p style={{ fontSize: '12px', color: '#92400e', margin: 0, fontWeight: '600' }}>
                💡 <strong>Crédit de taxe sur intrants (CTI) :</strong> Si vous êtes inscrit aux taxes, la TPS ({fmtMoney(totComm.commTPS)}) et TVQ ({fmtMoney(totComm.commTVQ)}) payées sur les commissions du gestionnaire sont récupérables dans votre déclaration de taxes.
              </p>
            </div>
          </div>
        )}

        {/* Note légale */}
        <div style={{ marginTop: '14px', backgroundColor: '#fef9c3', borderRadius: '8px', padding: '11px 16px', border: '1px solid #d97706', display: 'flex', gap: '8px' }}>
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <p style={{ fontSize: '11px', color: '#92400e', margin: 0, lineHeight: '1.6' }}>
            <strong>Note fiscale :</strong> Les taxes sont calculées sur le montant HT des articles seulement (excluant expédition et pourboires). Les commissions payées au gestionnaire sont déductibles comme charges d'entreprise. Ce rapport est fourni à titre indicatif — consultez votre comptable.
          </p>
        </div>
      </div>
    </>
  );
}

// ============================================================================