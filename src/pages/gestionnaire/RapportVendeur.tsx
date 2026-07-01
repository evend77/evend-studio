import React, { useState, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
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
  commissionBrute: number; // commission payée à e-Vend, taxes incluses
}

interface AbonnementPlan {
  id: number;
  date: string;
  dateISO: string;
  plan: string;
  type: 'mensuel' | 'installation'; // installation = frais unique à vie
  montantHT: number;
  description: string;
}

// ── Taux taxes QC (configurable selon province vendeur) ───────────────────────
const TPS_TAUX = 0.05;
const TVQ_TAUX = 0.09975;
const TAUX_TOTAL = 1 + TPS_TAUX + TVQ_TAUX; // 1.14975

// ── Données mock vendeur ──────────────────────────────────────────────────────
const VENTES_MOCK: VenteVendeur[] = [
  { id: 1,  date: '20/02/2026', dateISO: '2026-02-20', orderId: '13882042', storeOrderId: '#1016', produit: 'Porte-clés pour papa sur la route',        quantite: 1,  prixUnitaire: 14.99, expedition: 0,    pourboire: 0    },
  { id: 2,  date: '20/02/2026', dateISO: '2026-02-20', orderId: '13882020', storeOrderId: '#1015', produit: "Porte clés 'À ma marraine'",               quantite: 1,  prixUnitaire: 14.99, expedition: 5.99, pourboire: 0    },
  { id: 3,  date: '20/02/2026', dateISO: '2026-02-20', orderId: '13882020', storeOrderId: '#1015', produit: 'Montre à quartz enfant — Motif dinosaure',  quantite: 2,  prixUnitaire: 16.99, expedition: 0,    pourboire: 2.00 },
  { id: 4,  date: '15/02/2026', dateISO: '2026-02-15', orderId: '13850204', storeOrderId: '#1013', produit: 'Collier pendentif cœur / cheval',           quantite: 1,  prixUnitaire: 10.00, expedition: 4.99, pourboire: 1.50 },
  { id: 5,  date: '10/02/2026', dateISO: '2026-02-10', orderId: '13812366', storeOrderId: '#1012', produit: 'Écusson brodé Back to the Future',          quantite: 5,  prixUnitaire: 10.00, expedition: 0,    pourboire: 0    },
  { id: 6,  date: '15/01/2026', dateISO: '2026-01-15', orderId: '13629869', storeOrderId: '#1011', produit: 'Écusson brodé Back to the Future',          quantite: 37, prixUnitaire: 10.00, expedition: 12.00,pourboire: 5.00 },
  { id: 7,  date: '15/01/2026', dateISO: '2026-01-15', orderId: '13629778', storeOrderId: '#1010', produit: 'Écusson brodé Back to the Future',          quantite: 41, prixUnitaire: 10.00, expedition: 12.00,pourboire: 0    },
  { id: 8,  date: '15/01/2026', dateISO: '2026-01-15', orderId: '13629371', storeOrderId: '#1009', produit: 'Écusson brodé Back to the Future',          quantite: 7,  prixUnitaire: 10.00, expedition: 6.00, pourboire: 0    },
  { id: 9,  date: '17/11/2025', dateISO: '2025-11-17', orderId: '13209015', storeOrderId: '#1008', produit: 'Coffret thés du monde',                     quantite: 4,  prixUnitaire: 12.00, expedition: 0,    pourboire: 3.00 },
  { id: 10, date: '08/11/2025', dateISO: '2025-11-08', orderId: '13141005', storeOrderId: '#1007', produit: 'Carnet de voyage cuir',                     quantite: 2,  prixUnitaire: 18.00, expedition: 8.50, pourboire: 0    },
  { id: 11, date: '31/10/2025', dateISO: '2025-10-31', orderId: '13090947', storeOrderId: '#1006', produit: 'Bougie artisanale lavande',                 quantite: 3,  prixUnitaire: 9.99,  expedition: 5.00, pourboire: 1.00 },
  { id: 12, date: '27/10/2025', dateISO: '2025-10-27', orderId: '13069516', storeOrderId: '#1004', produit: 'Ensemble cadeau spa',                       quantite: 1,  prixUnitaire: 48.99, expedition: 0,    pourboire: 5.00 },
];

const COMMISSIONS_MOCK: CommissionPayee[] = [
  { id: 1, date: '20/02/2026', dateISO: '2026-02-20', orderId: '13882042', storeOrderId: '#1016', produit: 'Porte-clés pour papa sur la route',       montantVenteHT: 14.99, commissionBrute: 1.50  },
  { id: 2, date: '20/02/2026', dateISO: '2026-02-20', orderId: '13882020', storeOrderId: '#1015', produit: "Porte clés 'À ma marraine'",              montantVenteHT: 14.99, commissionBrute: 1.50  },
  { id: 3, date: '20/02/2026', dateISO: '2026-02-20', orderId: '13882020', storeOrderId: '#1015', produit: 'Montre à quartz enfant',                   montantVenteHT: 33.98, commissionBrute: 3.40  },
  { id: 4, date: '15/02/2026', dateISO: '2026-02-15', orderId: '13850204', storeOrderId: '#1013', produit: 'Collier pendentif cœur / cheval',          montantVenteHT: 10.00, commissionBrute: 0.50  },
  { id: 5, date: '10/02/2026', dateISO: '2026-02-10', orderId: '13812366', storeOrderId: '#1012', produit: 'Écusson brodé Back to the Future',         montantVenteHT: 50.00, commissionBrute: 5.00  },
  { id: 6, date: '15/01/2026', dateISO: '2026-01-15', orderId: '13629869', storeOrderId: '#1011', produit: 'Écusson brodé Back to the Future',         montantVenteHT: 370.00,commissionBrute: 55.50 },
  { id: 7, date: '15/01/2026', dateISO: '2026-01-15', orderId: '13629778', storeOrderId: '#1010', produit: 'Écusson brodé Back to the Future',         montantVenteHT: 410.00,commissionBrute: 61.50 },
  { id: 8, date: '15/01/2026', dateISO: '2026-01-15', orderId: '13629371', storeOrderId: '#1009', produit: 'Écusson brodé Back to the Future',         montantVenteHT: 70.00, commissionBrute: 10.50 },
  { id: 9, date: '17/11/2025', dateISO: '2025-11-17', orderId: '13209015', storeOrderId: '#1008', produit: 'Coffret thés du monde',                    montantVenteHT: 48.00, commissionBrute: 4.80  },
];

// ── Données abonnements — mensuels + frais unique installation ────────────────
const ABONNEMENTS_MOCK: AbonnementPlan[] = [
  // Frais unique d'installation (une seule fois à vie)
  { id: 1, date: '01/10/2025', dateISO: '2025-10-01', plan: 'Plan Or', type: 'installation', montantHT: 49.99, description: "Frais d'installation unique — Plan Or (facturé une seule fois)" },
  // Abonnements mensuels récurrents
  { id: 2, date: '01/10/2025', dateISO: '2025-10-01', plan: 'Plan Or', type: 'mensuel', montantHT: 20.00, description: 'Abonnement mensuel — Plan Or — Octobre 2025'  },
  { id: 3, date: '01/11/2025', dateISO: '2025-11-01', plan: 'Plan Or', type: 'mensuel', montantHT: 20.00, description: 'Abonnement mensuel — Plan Or — Novembre 2025' },
  { id: 4, date: '01/12/2025', dateISO: '2025-12-01', plan: 'Plan Or', type: 'mensuel', montantHT: 20.00, description: 'Abonnement mensuel — Plan Or — Décembre 2025' },
  { id: 5, date: '01/01/2026', dateISO: '2026-01-01', plan: 'Plan Or', type: 'mensuel', montantHT: 20.00, description: 'Abonnement mensuel — Plan Or — Janvier 2026'  },
  { id: 6, date: '01/02/2026', dateISO: '2026-02-01', plan: 'Plan Or', type: 'mensuel', montantHT: 20.00, description: 'Abonnement mensuel — Plan Or — Février 2026'  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtMoney(n: number) {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' $';
}

function calcVente(v: VenteVendeur, inscritTaxes: boolean) {
  const venteHT = v.prixUnitaire * v.quantite;
  const tps = inscritTaxes ? venteHT * TPS_TAUX : 0;
  const tvq = inscritTaxes ? venteHT * TVQ_TAUX : 0;
  const totalArticles = venteHT + tps + tvq;
  const totalAvecExtras = totalArticles + v.expedition + v.pourboire;
  return { venteHT, tps, tvq, totalArticles, totalAvecExtras };
}

function calcAbonnement(a: AbonnementPlan) {
  const tps   = a.montantHT * TPS_TAUX;
  const tvq   = a.montantHT * TVQ_TAUX;
  const total = a.montantHT + tps + tvq;
  return { ht: a.montantHT, tps, tvq, total };
}

interface RapportVendeurProps {
  naviguerVers?: (page: string, data?: any) => void;
  nomVendeur?: string;
  inscritTaxesDefaut?: boolean;
}

export default function RapportVendeur({
  naviguerVers,
  nomVendeur = 'idée-cadeau',
  inscritTaxesDefaut = false,
}: RapportVendeurProps) {

  const [dateDebut, setDateDebut] = useState('2025-10-01');
  const [dateFin, setDateFin]     = useState('2026-02-28');
  const [recherche, setRecherche] = useState('');
  const [onglet, setOnglet]       = useState<'resume' | 'ventes' | 'commissions' | 'abonnements'>('resume');
  const [inscritTaxes, setInscritTaxes] = useState(inscritTaxesDefaut);

  // ── Filtrage ───────────────────────────────────────────────────────────────
  const abonnementsFiltres = ABONNEMENTS_MOCK.filter(a => {
    const inP = a.dateISO >= dateDebut && a.dateISO <= dateFin;
    const inS = recherche === '' || a.plan.toLowerCase().includes(recherche.toLowerCase()) || a.description.toLowerCase().includes(recherche.toLowerCase());
    return inP && inS;
  }).sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  const ventesFiltrees = VENTES_MOCK.filter(v => {
    const inP = v.dateISO >= dateDebut && v.dateISO <= dateFin;
    const inS = recherche === '' || v.produit.toLowerCase().includes(recherche.toLowerCase()) || v.orderId.includes(recherche) || v.storeOrderId.includes(recherche);
    return inP && inS;
  }).sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  const commFiltrees = COMMISSIONS_MOCK.filter(c => {
    const inP = c.dateISO >= dateDebut && c.dateISO <= dateFin;
    const inS = recherche === '' || c.produit.toLowerCase().includes(recherche.toLowerCase()) || c.orderId.includes(recherche);
    return inP && inS;
  }).sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  // ── Totaux ventes ──────────────────────────────────────────────────────────
  const totVentes = ventesFiltrees.reduce((acc, v) => {
    const c = calcVente(v, inscritTaxes);
    return {
      venteHT:       acc.venteHT       + c.venteHT,
      tps:           acc.tps           + c.tps,
      tvq:           acc.tvq           + c.tvq,
      totalArticles: acc.totalArticles + c.totalArticles,
      expedition:    acc.expedition    + v.expedition,
      pourboire:     acc.pourboire     + v.pourboire,
      totalGeneral:  acc.totalGeneral  + c.totalAvecExtras,
      qte:           acc.qte           + v.quantite,
    };
  }, { venteHT: 0, tps: 0, tvq: 0, totalArticles: 0, expedition: 0, pourboire: 0, totalGeneral: 0, qte: 0 });

  // ── Totaux commissions ─────────────────────────────────────────────────────
  const totComm = commFiltrees.reduce((acc, c) => {
    const commHT  = c.commissionBrute / TAUX_TOTAL;
    const commTPS = commHT * TPS_TAUX;
    const commTVQ = commHT * TVQ_TAUX;
    return {
      venteHT:      acc.venteHT      + c.montantVenteHT,
      commBrute:    acc.commBrute    + c.commissionBrute,
      commHT:       acc.commHT       + commHT,
      commTPS:      acc.commTPS      + commTPS,
      commTVQ:      acc.commTVQ      + commTVQ,
    };
  }, { venteHT: 0, commBrute: 0, commHT: 0, commTPS: 0, commTVQ: 0 });

  // ── Totaux abonnements ─────────────────────────────────────────────────────
  const totAbonnements = abonnementsFiltres.reduce((acc, a) => {
    const t = calcAbonnement(a);
    const isMensuel = a.type === 'mensuel';
    return {
      htMensuel:    acc.htMensuel    + (isMensuel ? t.ht    : 0),
      tpsMensuel:   acc.tpsMensuel   + (isMensuel ? t.tps   : 0),
      tvqMensuel:   acc.tvqMensuel   + (isMensuel ? t.tvq   : 0),
      totalMensuel: acc.totalMensuel + (isMensuel ? t.total : 0),
      htInstall:    acc.htInstall    + (!isMensuel ? t.ht    : 0),
      tpsInstall:   acc.tpsInstall   + (!isMensuel ? t.tps   : 0),
      tvqInstall:   acc.tvqInstall   + (!isMensuel ? t.tvq   : 0),
      totalInstall: acc.totalInstall + (!isMensuel ? t.total : 0),
      htTotal:      acc.htTotal      + t.ht,
      tpsTotal:     acc.tpsTotal     + t.tps,
      tvqTotal:     acc.tvqTotal     + t.tvq,
      grandTotal:   acc.grandTotal   + t.total,
    };
  }, { htMensuel:0, tpsMensuel:0, tvqMensuel:0, totalMensuel:0, htInstall:0, tpsInstall:0, tvqInstall:0, totalInstall:0, htTotal:0, tpsTotal:0, tvqTotal:0, grandTotal:0 });

  const nbInstall = abonnementsFiltres.filter(a => a.type === 'installation').length;
  const nbMensuel = abonnementsFiltres.filter(a => a.type === 'mensuel').length;

  // ── Impression ─────────────────────────────────────────────────────────────
  const ONGLET_LABELS: Record<string, string> = {
    resume:       '📋 Résumé financier',
    ventes:       '💰 Détail des ventes',
    abonnements:  '⭐ Abonnements & frais',
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
          <h1>e-Vend.ca — ${titreOnglet}</h1>
          <p>Vendeur : <strong>${nomVendeur}</strong> &nbsp;·&nbsp; Période : ${periode}</p>
          <p>Statut fiscal : ${inscritTaxes ? '✅ Inscrit aux taxes (TPS 5% + TVQ 9,975%)' : '⬜ Non inscrit aux taxes'}</p>
        </div>
        <div style="text-align:right">
          <p>Généré le ${new Date().toLocaleDateString('fr-CA')}</p>
          <p>e-Vend.ca</p>
        </div>
      </div>
      ${printDiv.innerHTML}
      <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
      </body></html>
    `);
    win.document.close();
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const THEME = {
    accent: '#2d6a9f', accentLight: '#e8f2fb',
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
          <h1>e-Vend.ca — Rapport financier vendeur</h1>
          <p>Vendeur : <strong>{nomVendeur}</strong></p>
          <p>Période : {dateDebut} au {dateFin}</p>
          <p>Statut fiscal : <span className="badge">{inscritTaxes ? '✅ Inscrit aux taxes (TPS+TVQ)' : '⬜ Non inscrit aux taxes'}</span></p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p>Généré le {new Date().toLocaleDateString('fr-CA')}</p>
          <p>e-Vend.ca</p>
        </div>
      </div>

      {/* Résumé */}
      <div className="section-title">Résumé financier</div>
      <table>
        <thead><tr>
          <th>Élément</th><th>Montant HT</th>
          {inscritTaxes && <><th>TPS collectée</th><th>TVQ collectée</th></>}
          <th>Total</th>
        </tr></thead>
        <tbody>
          <tr>
            <td>Ventes produits</td>
            <td>{fmtMoney(totVentes.venteHT)}</td>
            {inscritTaxes && <><td>{fmtMoney(totVentes.tps)}</td><td>{fmtMoney(totVentes.tvq)}</td></>}
            <td>{fmtMoney(totVentes.totalArticles)}</td>
          </tr>
          <tr>
            <td>Expédition</td>
            <td>{fmtMoney(totVentes.expedition)}</td>
            {inscritTaxes && <><td>—</td><td>—</td></>}
            <td>{fmtMoney(totVentes.expedition)}</td>
          </tr>
          <tr>
            <td>Pourboires</td>
            <td>{fmtMoney(totVentes.pourboire)}</td>
            {inscritTaxes && <><td>—</td><td>—</td></>}
            <td>{fmtMoney(totVentes.pourboire)}</td>
          </tr>
          <tr>
            <td>Commissions payées à e-Vend (déductibles)</td>
            <td>-{fmtMoney(totComm.commHT)}</td>
            {inscritTaxes && <><td>-{fmtMoney(totComm.commTPS)}</td><td>-{fmtMoney(totComm.commTVQ)}</td></>}
            <td>-{fmtMoney(totComm.commBrute)}</td>
          </tr>
        </tbody>
        <tfoot><tr>
          <td>REVENUS NETS</td>
          <td>{fmtMoney(totVentes.venteHT + totVentes.expedition + totVentes.pourboire - totComm.commHT)}</td>
          {inscritTaxes && <><td>{fmtMoney(totVentes.tps - totComm.commTPS)}</td><td>{fmtMoney(totVentes.tvq - totComm.commTVQ)}</td></>}
          <td>{fmtMoney(totVentes.totalGeneral - totComm.commBrute)}</td>
        </tr></tfoot>
      </table>

      {/* Tableau ventes */}
      <div className="section-title">Détail des ventes</div>
      <table>
        <thead><tr>
          <th>Date</th><th>Order ID</th><th>Produit</th><th>Qté</th>
          <th>Prix unit.</th><th>Vente HT</th><th>Expédition</th><th>Pourboire</th>
          {inscritTaxes && <><th>TPS (5%)</th><th>TVQ (9,975%)</th></>}
          <th>Total</th>
        </tr></thead>
        <tbody>
          {ventesFiltrees.map(v => {
            const c = calcVente(v, inscritTaxes);
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
                {inscritTaxes && <><td>{fmtMoney(c.tps)}</td><td>{fmtMoney(c.tvq)}</td></>}
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
          {inscritTaxes && <><td><strong>{fmtMoney(totVentes.tps)}</strong></td><td><strong>{fmtMoney(totVentes.tvq)}</strong></td></>}
          <td><strong>{fmtMoney(totVentes.totalGeneral)}</strong></td>
        </tr></tfoot>
      </table>

      {/* Tableau commissions */}
      <div className="section-title">Commissions payées à e-Vend (charges déductibles)</div>
      <table>
        <thead><tr>
          <th>Date</th><th>Order ID</th><th>Produit</th>
          <th>Vente HT (base calcul)</th><th>Commission HT</th>
          <th>TPS comm.</th><th>TVQ comm.</th><th>Total comm. payée</th>
        </tr></thead>
        <tbody>
          {commFiltrees.map(c => {
            const ht  = c.commissionBrute / TAUX_TOTAL;
            const tps = ht * TPS_TAUX;
            const tvq = ht * TVQ_TAUX;
            return (
              <tr key={c.id}>
                <td>{c.date}</td>
                <td>{c.orderId}<br/><span style={{fontSize:'9px',color:'#aaa'}}>{c.storeOrderId}</span></td>
                <td>{c.produit}</td>
                <td>{fmtMoney(c.montantVenteHT)}</td>
                <td>{fmtMoney(ht)}</td>
                <td>{fmtMoney(tps)}</td>
                <td>{fmtMoney(tvq)}</td>
                <td><strong>{fmtMoney(c.commissionBrute)}</strong></td>
              </tr>
            );
          })}
        </tbody>
        <tfoot><tr>
          <td colSpan={3}><strong>TOTAL — {commFiltrees.length} lignes</strong></td>
          <td><strong>{fmtMoney(totComm.venteHT)}</strong></td>
          <td><strong>{fmtMoney(totComm.commHT)}</strong></td>
          <td><strong>{fmtMoney(totComm.commTPS)}</strong></td>
          <td><strong>{fmtMoney(totComm.commTVQ)}</strong></td>
          <td><strong>{fmtMoney(totComm.commBrute)}</strong></td>
        </tr></tfoot>
      </table>

      <p className="note">
        ⚠️ Note : Les commissions payées à e-Vend sont calculées sur le montant HT des ventes (excluant taxes, expédition et pourboires).
        Ce rapport est fourni à titre indicatif. Consultez votre comptable pour la préparation officielle de vos déclarations fiscales.
        {inscritTaxes ? ' TPS : 5% · TVQ : 9,975% · Taux composite : 14,975%' : ' Vous n\'êtes pas inscrit aux taxes — aucune taxe à collecter ni à déclarer sur vos ventes.'}
      </p>
    </div>
  );

  return (
    <>
      <div style={{ padding: '24px 28px', maxWidth: '1200px', backgroundColor: THEME.bg, minHeight: '100vh' }}>

        {/* En-tête */}
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

            {/* Toggle inscrit taxes */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: inscritTaxes ? '#dcfce7' : '#f3f4f6', border: `1px solid ${inscritTaxes ? '#86efac' : THEME.border}`, borderRadius: '10px', padding: '8px 14px' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: '800', color: inscritTaxes ? THEME.success : THEME.textLight, margin: '0 0 1px 0' }}>
                  {inscritTaxes ? '✅ Inscrit aux taxes' : '⬜ Non inscrit aux taxes'}
                </p>
                <p style={{ fontSize: '10px', color: '#aaa', margin: 0 }}>
                  {inscritTaxes ? 'TPS 5% + TVQ 9,975% calculées' : 'Aucune taxe sur vos ventes'}
                </p>
              </div>
              <div
                onClick={() => setInscritTaxes(!inscritTaxes)}
                style={{ width: '40px', height: '22px', borderRadius: '11px', backgroundColor: inscritTaxes ? THEME.success : '#ddd', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: '3px', left: inscritTaxes ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'left 0.2s' }} />
              </div>
            </div>

            <button onClick={handlePrint} style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🖨️ Imprimer / PDF
            </button>
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
              {[
                { label: 'Ce mois', d: '2026-02-01', f: '2026-02-28' },
                { label: 'Jan 2026', d: '2026-01-01', f: '2026-01-31' },
                { label: 'T4 2025', d: '2025-10-01', f: '2025-12-31' },
                { label: 'Tout', d: '2025-01-01', f: '2026-12-31' },
              ].map(r => (
                <button key={r.label} onClick={() => { setDateDebut(r.d); setDateFin(r.f); }}
                  style={{ padding: '6px 11px', borderRadius: '6px', border: `1px solid ${THEME.border}`, backgroundColor: dateDebut === r.d && dateFin === r.f ? THEME.accent : 'white', color: dateDebut === r.d && dateFin === r.f ? 'white' : THEME.textLight, fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                  {r.label}
                </button>
              ))}
            </div>
            <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="🔍 Produit, order ID..."
              style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '7px 12px', fontSize: '12px', outline: 'none', width: '180px', backgroundColor: 'white' }} />
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '18px' }}>
          {[
            { label: 'Ventes HT', val: fmtMoney(totVentes.venteHT), icon: '💰', c: THEME.success, sous: `${ventesFiltrees.length} commandes · ${totVentes.qte} articles` },
            { label: inscritTaxes ? 'Taxes collectées' : 'Taxes (non applicable)', val: inscritTaxes ? fmtMoney(totVentes.tps + totVentes.tvq) : '—', icon: '🏛️', c: inscritTaxes ? THEME.warning : '#aaa', sous: inscritTaxes ? `TPS ${fmtMoney(totVentes.tps)} · TVQ ${fmtMoney(totVentes.tvq)}` : 'Non inscrit aux taxes' },
            { label: 'Expédition + pourboires', val: fmtMoney(totVentes.expedition + totVentes.pourboire), icon: '🚚', c: THEME.accent, sous: `Expéd. ${fmtMoney(totVentes.expedition)} · Pourb. ${fmtMoney(totVentes.pourboire)}` },
            { label: 'Abonnements payés', val: fmtMoney(totAbonnements.grandTotal), icon: '⭐', c: THEME.purple, sous: `${nbMensuel} mois${nbInstall > 0 ? ` · ${nbInstall} install.` : ''}` },
            { label: 'Commissions à e-Vend', val: fmtMoney(totComm.commBrute), icon: '📊', c: THEME.danger, sous: `HT : ${fmtMoney(totComm.commHT)} (déductible)` },
          ].map((k, i) => (
            <div key={i} style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ fontSize: '18px', width: '36px', height: '36px', borderRadius: '8px', backgroundColor: k.c + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{k.icon}</div>
                <p style={{ fontSize: '18px', fontWeight: '900', color: THEME.text, margin: 0, lineHeight: 1 }}>{k.val}</p>
              </div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: THEME.textLight, margin: '0 0 2px 0' }}>{k.label}</p>
              <p style={{ fontSize: '10px', color: '#aaa', margin: 0 }}>{k.sous}</p>
            </div>
          ))}
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', backgroundColor: 'white', borderRadius: '10px', border: `1px solid ${THEME.border}`, padding: '4px', width: 'fit-content' }}>
          {[
            { val: 'resume',      label: '📋 Résumé'         },
            { val: 'ventes',      label: '💰 Détail ventes'  },
            { val: 'abonnements',  label: '⭐ Abonnements'     },
          { val: 'commissions', label: '📊 Commissions'    },
          ].map(o => (
            <button key={o.val} onClick={() => setOnglet(o.val as any)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700', backgroundColor: onglet === o.val ? THEME.accent : 'transparent', color: onglet === o.val ? 'white' : THEME.textLight, transition: 'all 0.15s' }}>
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
                Revenus nets estimés : <span style={{ color: '#4ade80' }}>{fmtMoney(totVentes.totalGeneral - totAbonnements.grandTotal - totComm.commBrute)}</span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { label: 'Ventes articles HT', val: fmtMoney(totVentes.venteHT), icon: '💰', c: '#60a5fa' },
                  { label: 'Expédition', val: fmtMoney(totVentes.expedition), icon: '🚚', c: '#a78bfa' },
                  { label: 'Pourboires', val: fmtMoney(totVentes.pourboire), icon: '🎁', c: '#34d399' },
                  { label: inscritTaxes ? 'TPS à reverser' : 'TPS (non inscrit)', val: inscritTaxes ? fmtMoney(totVentes.tps) : '—', icon: '🏛️', c: '#fb923c' },
                  { label: inscritTaxes ? 'TVQ à reverser' : 'TVQ (non inscrit)', val: inscritTaxes ? fmtMoney(totVentes.tvq) : '—', icon: '🏛️', c: '#fb923c' },
                  { label: 'Abonnements payés à e-Vend', val: `-${fmtMoney(totAbonnements.grandTotal)}`, icon: '⭐', c: '#c084fc' },
                  { label: 'Commissions payées à e-Vend', val: `-${fmtMoney(totComm.commBrute)}`, icon: '📊', c: '#f87171' },
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
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                    {['Élément', 'Montant HT', ...(inscritTaxes ? ['TPS (5%)', 'TVQ (9,975%)'] : []), 'Total'].map(h => (
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
                      {inscritTaxes && <>
                        <td style={{ ...tdStyle, color: THEME.success }}>{row.noTax ? '—' : fmtMoney(row.tps)}</td>
                        <td style={{ ...tdStyle, color: THEME.success }}>{row.noTax ? '—' : fmtMoney(row.tvq)}</td>
                      </>}
                      <td style={{ ...tdStyle, fontWeight: '800' }}>{fmtMoney(row.total)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderBottom: '1px solid #f5f5f5', backgroundColor: '#f5f0ff' }}>
                    <td style={{ ...tdStyle, color: THEME.purple }}>
                      ⭐ Abonnements e-Vend ({nbMensuel} mois{nbInstall > 0 ? ` + ${nbInstall} install.` : ''})
                      {nbInstall > 0 && <span style={{ marginLeft: '8px', fontSize: '10px', backgroundColor: '#f3e8ff', color: THEME.purple, padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>Dont frais installation unique</span>}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: '700', color: THEME.purple }}>-{fmtMoney(totAbonnements.htTotal)}</td>
                    {inscritTaxes && <>
                      <td style={{ ...tdStyle, color: THEME.purple }}>-{fmtMoney(totAbonnements.tpsTotal)}</td>
                      <td style={{ ...tdStyle, color: THEME.purple }}>-{fmtMoney(totAbonnements.tvqTotal)}</td>
                    </>}
                    <td style={{ ...tdStyle, fontWeight: '800', color: THEME.purple }}>-{fmtMoney(totAbonnements.grandTotal)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f5f5f5', backgroundColor: '#fff8f8' }}>
                    <td style={{ ...tdStyle, color: THEME.danger }}>📊 Commissions e-Vend (déductibles)</td>
                    <td style={{ ...tdStyle, fontWeight: '700', color: THEME.danger }}>-{fmtMoney(totComm.commHT)}</td>
                    {inscritTaxes && <>
                      <td style={{ ...tdStyle, color: THEME.danger }}>-{fmtMoney(totComm.commTPS)}</td>
                      <td style={{ ...tdStyle, color: THEME.danger }}>-{fmtMoney(totComm.commTVQ)}</td>
                    </>}
                    <td style={{ ...tdStyle, fontWeight: '800', color: THEME.danger }}>-{fmtMoney(totComm.commBrute)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{ ...tfStyle }}>REVENUS NETS</td>
                    <td style={{ ...tfStyle }}>{fmtMoney(totVentes.venteHT + totVentes.expedition + totVentes.pourboire - totComm.commHT)}</td>
                    {inscritTaxes && <>
                      <td style={{ ...tfStyle, color: THEME.warning }}>{fmtMoney(totVentes.tps - totComm.commTPS)}</td>
                      <td style={{ ...tfStyle, color: THEME.warning }}>{fmtMoney(totVentes.tvq - totComm.commTVQ)}</td>
                    </>}
                    <td style={{ ...tfStyle, fontSize: '16px', color: THEME.success }}>{fmtMoney(totVentes.totalGeneral - totAbonnements.grandTotal - totComm.commBrute)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {inscritTaxes && (
              <div style={{ marginTop: '12px', backgroundColor: '#fef9c3', borderRadius: '8px', padding: '12px 16px', border: '1px solid #d97706' }}>
                <p style={{ fontSize: '12px', fontWeight: '800', color: '#92400e', margin: '0 0 4px 0' }}>🏛️ Rappel déclaration taxes</p>
                <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>
                  TPS à reverser à l'ARC : <strong>{fmtMoney(totVentes.tps - totComm.commTPS)}</strong> ·
                  TVQ à reverser à Revenu Québec : <strong>{fmtMoney(totVentes.tvq - totComm.commTVQ)}</strong>
                  <br/>Vous pouvez déduire la TPS/TVQ payée sur vos commissions e-Vend (crédits de taxe sur intrants).
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── ABONNEMENTS ── */}
        {onglet === 'abonnements' && (
          <div id="evend-print-abonnements">
            {nbInstall > 0 && (
              <div style={{ backgroundColor: '#f3e8ff', border: `1px solid ${THEME.purple}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>⭐</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '800', color: THEME.purple, margin: '0 0 3px 0' }}>Frais d'installation unique détectés dans cette période</p>
                  <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>
                    Ces frais sont facturés <strong>une seule fois à vie</strong> lors de l'activation de votre plan. Montant total : <strong>{fmtMoney(totAbonnements.totalInstall)}</strong> TTC.
                  </p>
                </div>
              </div>
            )}
            <div style={cardStyle}>
              <div style={{ padding: '13px 18px', backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase' }}>
                  ⭐ Abonnements & frais de plateforme — {abonnementsFiltres.length} lignes
                </h3>
                <span style={{ fontSize: '11px', color: THEME.textLight, fontWeight: '600' }}>
                  💡 Taxes en sus du HT · Charges déductibles
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '750px' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${THEME.border}` }}>
                      {['Date', 'Plan', 'Type', 'Description', 'Montant HT', 'TPS (5%)', 'TVQ (9,975%)', 'Total TTC'].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {abonnementsFiltres.map((a, i) => {
                      const t = calcAbonnement(a);
                      const isInstall = a.type === 'installation';
                      return (
                        <tr key={a.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: isInstall ? '#fdf4ff' : i % 2 === 0 ? 'white' : '#fafafa' }}>
                          <td style={tdStyle}>{a.date}</td>
                          <td style={tdStyle}>
                            <span style={{ fontSize: '12px', fontWeight: '700', backgroundColor: THEME.accentLight, color: THEME.accent, padding: '3px 10px', borderRadius: '20px' }}>
                              {a.plan}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            {isInstall ? (
                              <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#f3e8ff', color: THEME.purple, padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' as const }}>
                                ⭐ Installation unique
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#e8f2fb', color: THEME.accent, padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' as const }}>
                                🔄 Mensuel
                              </span>
                            )}
                          </td>
                          <td style={{ ...tdStyle, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }} title={a.description}>
                            {a.description}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: '700', color: THEME.purple }}>{fmtMoney(t.ht)}</td>
                          <td style={{ ...tdStyle, color: THEME.success }}>{fmtMoney(t.tps)}</td>
                          <td style={{ ...tdStyle, color: THEME.success }}>{fmtMoney(t.tvq)}</td>
                          <td style={{ ...tdStyle, fontWeight: '900', color: THEME.purple }}>{fmtMoney(t.total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    {nbInstall > 0 && (
                      <tr>
                        <td colSpan={4} style={{ ...tfStyle, backgroundColor: '#f3e8ff', color: THEME.purple, fontSize: '12px' }}>
                          Sous-total — Frais installation ({nbInstall})
                        </td>
                        <td style={{ ...tfStyle, backgroundColor: '#f3e8ff', color: THEME.purple }}>{fmtMoney(totAbonnements.htInstall)}</td>
                        <td style={{ ...tfStyle, backgroundColor: '#f3e8ff', color: THEME.purple }}>{fmtMoney(totAbonnements.tpsInstall)}</td>
                        <td style={{ ...tfStyle, backgroundColor: '#f3e8ff', color: THEME.purple }}>{fmtMoney(totAbonnements.tvqInstall)}</td>
                        <td style={{ ...tfStyle, backgroundColor: '#f3e8ff', color: THEME.purple }}>{fmtMoney(totAbonnements.totalInstall)}</td>
                      </tr>
                    )}
                    {nbMensuel > 0 && (
                      <tr>
                        <td colSpan={4} style={{ ...tfStyle, fontSize: '12px' }}>Sous-total — Abonnements mensuels ({nbMensuel} mois)</td>
                        <td style={tfStyle}>{fmtMoney(totAbonnements.htMensuel)}</td>
                        <td style={{ ...tfStyle, color: THEME.success }}>{fmtMoney(totAbonnements.tpsMensuel)}</td>
                        <td style={{ ...tfStyle, color: THEME.success }}>{fmtMoney(totAbonnements.tvqMensuel)}</td>
                        <td style={tfStyle}>{fmtMoney(totAbonnements.totalMensuel)}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={4} style={{ ...tfStyle, fontSize: '14px' }}>TOTAL — {abonnementsFiltres.length} lignes</td>
                      <td style={{ ...tfStyle, color: THEME.purple }}>{fmtMoney(totAbonnements.htTotal)}</td>
                      <td style={{ ...tfStyle, color: THEME.success }}>{fmtMoney(totAbonnements.tpsTotal)}</td>
                      <td style={{ ...tfStyle, color: THEME.success }}>{fmtMoney(totAbonnements.tvqTotal)}</td>
                      <td style={{ ...tfStyle, fontSize: '15px', color: THEME.purple }}>{fmtMoney(totAbonnements.grandTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div style={{ padding: '12px 18px', backgroundColor: '#f5f0ff', borderTop: `1px solid ${THEME.border}` }}>
                <p style={{ fontSize: '12px', color: '#6b21a8', margin: 0, fontWeight: '600' }}>
                  💡 <strong>CTI récupérable :</strong> Si vous êtes inscrit aux taxes, la TPS ({fmtMoney(totAbonnements.tpsTotal)}) et TVQ ({fmtMoney(totAbonnements.tvqTotal)}) payées sur vos abonnements e-Vend sont récupérables comme crédits de taxe sur intrants.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── VENTES ── */}
        {onglet === 'ventes' && (
          <div id="evend-print-ventes" style={cardStyle}>
            <div style={{ padding: '13px 18px', backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase' }}>
                💰 Détail ventes — {ventesFiltrees.length} commandes · {totVentes.qte} articles
              </h3>
              {!inscritTaxes && (
                <span style={{ fontSize: '11px', backgroundColor: '#f3f4f6', color: THEME.textLight, padding: '4px 10px', borderRadius: '20px', fontWeight: '700' }}>
                  ⬜ Colonnes taxes masquées — non inscrit
                </span>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${THEME.border}` }}>
                    {['Date', 'Order ID', 'Produit', 'Qté', 'Prix unit.', 'Vente HT', 'Expédition', 'Pourboire', ...(inscritTaxes ? ['TPS (5%)', 'TVQ (9,975%)'] : []), 'Total'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ventesFiltrees.map((v, i) => {
                    const c = calcVente(v, inscritTaxes);
                    return (
                      <tr key={v.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={tdStyle}>{v.date}</td>
                        <td style={tdStyle}>
                          <p style={{ fontSize: '12px', fontWeight: '700', color: THEME.accent, margin: 0 }}>{v.orderId}</p>
                          <p style={{ fontSize: '10px', color: '#aaa', margin: 0 }}>{v.storeOrderId}</p>
                        </td>
                        <td style={{ ...tdStyle, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.produit}>{v.produit}</td>
                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '700' }}>{v.quantite}</td>
                        <td style={tdStyle}>{fmtMoney(v.prixUnitaire)}</td>
                        <td style={{ ...tdStyle, fontWeight: '800', color: THEME.success }}>{fmtMoney(c.venteHT)}</td>
                        <td style={{ ...tdStyle, color: THEME.accent }}>{v.expedition > 0 ? fmtMoney(v.expedition) : <span style={{ color: '#ccc' }}>—</span>}</td>
                        <td style={{ ...tdStyle, color: '#d97706' }}>{v.pourboire > 0 ? fmtMoney(v.pourboire) : <span style={{ color: '#ccc' }}>—</span>}</td>
                        {inscritTaxes && <>
                          <td style={{ ...tdStyle, color: THEME.success }}>{fmtMoney(c.tps)}</td>
                          <td style={{ ...tdStyle, color: THEME.success }}>{fmtMoney(c.tvq)}</td>
                        </>}
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
                    {inscritTaxes && <>
                      <td style={{ ...tfStyle, color: THEME.success }}>{fmtMoney(totVentes.tps)}</td>
                      <td style={{ ...tfStyle, color: THEME.success }}>{fmtMoney(totVentes.tvq)}</td>
                    </>}
                    <td style={{ ...tfStyle, fontSize: '15px' }}>{fmtMoney(totVentes.totalGeneral)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ── COMMISSIONS ── */}
        {onglet === 'commissions' && (
          <div id="evend-print-commissions" style={cardStyle}>
            <div style={{ padding: '13px 18px', backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase' }}>
                📊 Commissions payées à e-Vend — {commFiltrees.length} transactions
              </h3>
              <span style={{ fontSize: '11px', color: THEME.textLight, fontWeight: '600' }}>
                💡 Charges déductibles · Base de calcul = vente HT seulement
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${THEME.border}` }}>
                    {['Date', 'Order ID', 'Produit', 'Vente HT (base)', 'Commission HT', 'TPS comm.', 'TVQ comm.', 'Total payé'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {commFiltrees.map((c, i) => {
                    const ht  = c.commissionBrute / TAUX_TOTAL;
                    const tps = ht * TPS_TAUX;
                    const tvq = ht * TVQ_TAUX;
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={tdStyle}>{c.date}</td>
                        <td style={tdStyle}>
                          <p style={{ fontSize: '12px', fontWeight: '700', color: THEME.accent, margin: 0 }}>{c.orderId}</p>
                          <p style={{ fontSize: '10px', color: '#aaa', margin: 0 }}>{c.storeOrderId}</p>
                        </td>
                        <td style={{ ...tdStyle, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.produit}</td>
                        <td style={{ ...tdStyle, fontWeight: '700' }}>{fmtMoney(c.montantVenteHT)}</td>
                        <td style={{ ...tdStyle, color: THEME.danger }}>{fmtMoney(ht)}</td>
                        <td style={{ ...tdStyle, color: THEME.danger, fontSize: '11px' }}>{fmtMoney(tps)}</td>
                        <td style={{ ...tdStyle, color: THEME.danger, fontSize: '11px' }}>{fmtMoney(tvq)}</td>
                        <td style={{ ...tdStyle, fontWeight: '900', color: THEME.danger }}>{fmtMoney(c.commissionBrute)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={tfStyle}>TOTAL — {commFiltrees.length} lignes</td>
                    <td style={tfStyle}>{fmtMoney(totComm.venteHT)}</td>
                    <td style={{ ...tfStyle, color: THEME.danger }}>{fmtMoney(totComm.commHT)}</td>
                    <td style={{ ...tfStyle, color: THEME.danger }}>{fmtMoney(totComm.commTPS)}</td>
                    <td style={{ ...tfStyle, color: THEME.danger }}>{fmtMoney(totComm.commTVQ)}</td>
                    <td style={{ ...tfStyle, color: THEME.danger, fontSize: '15px' }}>{fmtMoney(totComm.commBrute)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div style={{ padding: '12px 18px', backgroundColor: '#fff8f8', borderTop: `1px solid ${THEME.border}` }}>
              <p style={{ fontSize: '12px', color: '#92400e', margin: 0, fontWeight: '600' }}>
                💡 <strong>Crédit de taxe sur intrants (CTI) :</strong> Si vous êtes inscrit aux taxes, la TPS ({fmtMoney(totComm.commTPS)}) et TVQ ({fmtMoney(totComm.commTVQ)}) payées sur les commissions e-Vend sont récupérables dans votre déclaration de taxes.
              </p>
            </div>
          </div>
        )}

        {/* Note légale */}
        <div style={{ marginTop: '14px', backgroundColor: '#fef9c3', borderRadius: '8px', padding: '11px 16px', border: '1px solid #d97706', display: 'flex', gap: '8px' }}>
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <p style={{ fontSize: '11px', color: '#92400e', margin: 0, lineHeight: '1.6' }}>
            <strong>Note fiscale :</strong> Les taxes sont calculées sur le montant HT des articles seulement (excluant expédition et pourboires). Les commissions payées à e-Vend sont déductibles comme charges d'entreprise. Ce rapport est fourni à titre indicatif — consultez votre comptable.
          </p>
        </div>
      </div>
    </>
  );
}
