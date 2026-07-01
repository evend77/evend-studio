import React, { useState, useEffect } from 'react';

// ── CSS Print injecté dynamiquement ──────────────────────────────────────────
const PRINT_STYLE = `
@media print {
  body > * { display: none !important; }
  #evend-rapport-print { display: block !important; position: fixed; top: 0; left: 0; right: 0; background: white; padding: 20px; font-family: Arial, sans-serif; }
  @page { size: landscape; margin: 12mm 10mm; }
  table { width: 100% !important; border-collapse: collapse !important; font-size: 10px !important; }
  tr { page-break-inside: avoid; }
  th { background-color: #e8f2fb !important; color: #2d6a9f !important; font-weight: bold !important; padding: 7px 8px !important; border: 1px solid #ccc !important; text-align: left !important; font-size: 9px !important; text-transform: uppercase; }
  td { padding: 6px 8px !important; border: 1px solid #ddd !important; font-size: 10px !important; }
  tfoot td { background-color: #e8f2fb !important; font-weight: bold !important; border-top: 2px solid #2d6a9f !important; }
  tr:nth-child(even) td { background-color: #f8f8f8 !important; }
  .print-section-title { font-size: 13px !important; font-weight: bold !important; color: #2d6a9f !important; margin: 16px 0 8px 0 !important; border-left: 4px solid #2d6a9f; padding-left: 8px; display: block !important; }
  .no-print { display: none !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
`;



const THEME = {
  accent: '#2d6a9f', accentLight: '#e8f2fb',
  bg: '#f0f2f5', card: '#ffffff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706', purple: '#7c3aed',
};

// ── Règles fiscales par province ──────────────────────────────────────────────
const TAXES_PROVINCE: Record<string, { tps: number; tvq: number; tvh: number; type: 'TPS+TVQ' | 'TPS+TVH' | 'TPS' }> = {
  QC: { tps: 0.05,    tvq: 0.09975, tvh: 0,     type: 'TPS+TVQ' },
  ON: { tps: 0,       tvq: 0,       tvh: 0.13,   type: 'TPS+TVH' },
  NB: { tps: 0,       tvq: 0,       tvh: 0.15,   type: 'TPS+TVH' },
  NS: { tps: 0,       tvq: 0,       tvh: 0.15,   type: 'TPS+TVH' },
  NL: { tps: 0,       tvq: 0,       tvh: 0.15,   type: 'TPS+TVH' },
  PE: { tps: 0,       tvq: 0,       tvh: 0.15,   type: 'TPS+TVH' },
  BC: { tps: 0,       tvq: 0,       tvh: 0.12,   type: 'TPS+TVH' },
  AB: { tps: 0.05,    tvq: 0,       tvh: 0,      type: 'TPS' },
  SK: { tps: 0.05,    tvq: 0,       tvh: 0,      type: 'TPS' },
  MB: { tps: 0.05,    tvq: 0,       tvh: 0,      type: 'TPS' },
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface LigneCommission {
  id: number;
  date: string;        // DD/MM/YYYY
  dateISO: string;     // YYYY-MM-DD pour tri
  orderId: string;
  storeOrderId: string;
  vendeur: string;
  province: string;
  produit: string;
  montantBrut: number; // Commission reçue taxes INCLUSES
}

interface LignePlan {
  id: number;
  date: string;
  dateISO: string;
  vendeur: string;
  province: string;
  plan: string;
  montantHT: number;   // Prix HT du plan, taxes EN SUS
}

// ── Données mock ──────────────────────────────────────────────────────────────
const COMMISSIONS_DATA: LigneCommission[] = [
  { id: 1,  date: '20/02/2026', dateISO: '2026-02-20', orderId: '13882042', storeOrderId: '#1016', vendeur: 'idée-cadeau', province: 'QC', produit: 'Porte-clés pour papa sur la route',             montantBrut: 1.50  },
  { id: 2,  date: '20/02/2026', dateISO: '2026-02-20', orderId: '13882020', storeOrderId: '#1015', vendeur: 'idée-cadeau', province: 'QC', produit: "Porte clés 'À ma marraine'",                    montantBrut: 1.50  },
  { id: 3,  date: '20/02/2026', dateISO: '2026-02-20', orderId: '13882020', storeOrderId: '#1015', vendeur: 'idée-cadeau', province: 'QC', produit: 'Montre à quartz enfant',                         montantBrut: 3.40  },
  { id: 4,  date: '20/02/2026', dateISO: '2026-02-20', orderId: '13879676', storeOrderId: '#1014', vendeur: 'Vic',          province: 'QC', produit: 'Angelis The Debut Album CD',                    montantBrut: 1.60  },
  { id: 5,  date: '15/02/2026', dateISO: '2026-02-15', orderId: '13850204', storeOrderId: '#1013', vendeur: 'idée-cadeau', province: 'QC', produit: 'Collier pendentif cœur / cheval',                montantBrut: 0.50  },
  { id: 6,  date: '10/02/2026', dateISO: '2026-02-10', orderId: '13812366', storeOrderId: '#1012', vendeur: 'Vic',          province: 'QC', produit: '101 70s Hits CD',                               montantBrut: 10.50 },
  { id: 7,  date: '15/01/2026', dateISO: '2026-01-15', orderId: '13629869', storeOrderId: '#1011', vendeur: 'idée-cadeau', province: 'QC', produit: 'Écusson brodé Back to the Future',              montantBrut: 55.50 },
  { id: 8,  date: '15/01/2026', dateISO: '2026-01-15', orderId: '13629778', storeOrderId: '#1010', vendeur: 'idée-cadeau', province: 'QC', produit: 'Écusson brodé Back to the Future',              montantBrut: 61.50 },
  { id: 9,  date: '15/01/2026', dateISO: '2026-01-15', orderId: '13629371', storeOrderId: '#1009', vendeur: 'idée-cadeau', province: 'QC', produit: 'Écusson brodé Back to the Future',              montantBrut: 10.50 },
  { id: 10, date: '17/11/2025', dateISO: '2025-11-17', orderId: '13209015', storeOrderId: '#1008', vendeur: 'Vic',          province: 'QC', produit: "Everybody's Grotty Skinner CD",                 montantBrut: 84.00 },
  { id: 11, date: '08/11/2025', dateISO: '2025-11-08', orderId: '13141005', storeOrderId: '#1007', vendeur: 'Vic',          province: 'QC', produit: 'CD Glass Piano Bruce',                          montantBrut: 42.00 },
  { id: 12, date: '31/10/2025', dateISO: '2025-10-31', orderId: '13090947', storeOrderId: '#1006', vendeur: 'Vic',          province: 'ON', produit: '101 70s Hits CD',                               montantBrut: 42.00 },
  { id: 13, date: '30/10/2025', dateISO: '2025-10-30', orderId: '13084573', storeOrderId: '#1005', vendeur: 'idée-cadeau', province: 'QC', produit: 'Collier pendentif cœur',                         montantBrut: 0.25  },
  { id: 14, date: '27/10/2025', dateISO: '2025-10-27', orderId: '13069516', storeOrderId: '#1004', vendeur: 'Vic',          province: 'AB', produit: '101 70s Hits CD',                               montantBrut: 0.50  },
];

const PLANS_DATA: LignePlan[] = [
  { id: 1, date: '01/02/2026', dateISO: '2026-02-01', vendeur: 'idée-cadeau', province: 'QC', plan: 'Plan Or',       montantHT: 20.00 },
  { id: 2, date: '01/02/2026', dateISO: '2026-02-01', vendeur: 'Vic',          province: 'QC', plan: 'Plan Extrême', montantHT: 30.00 },
  { id: 3, date: '01/02/2026', dateISO: '2026-02-01', vendeur: 'Sophie Lavoie',province: 'QC', plan: 'Plan Bronze',  montantHT: 5.00  },
  { id: 4, date: '01/01/2026', dateISO: '2026-01-01', vendeur: 'idée-cadeau', province: 'QC', plan: 'Plan Or',       montantHT: 20.00 },
  { id: 5, date: '01/01/2026', dateISO: '2026-01-01', vendeur: 'Vic',          province: 'ON', plan: 'Plan Extrême', montantHT: 30.00 },
  { id: 6, date: '01/12/2025', dateISO: '2025-12-01', vendeur: 'idée-cadeau', province: 'QC', plan: 'Plan Or',       montantHT: 20.00 },
  { id: 7, date: '01/12/2025', dateISO: '2025-12-01', vendeur: 'Vic',          province: 'AB', plan: 'Plan Extrême', montantHT: 30.00 },
  { id: 8, date: '01/11/2025', dateISO: '2025-11-01', vendeur: 'idée-cadeau', province: 'QC', plan: 'Plan Or',       montantHT: 20.00 },
  { id: 9, date: '01/11/2025', dateISO: '2025-11-01', vendeur: 'Vic',          province: 'QC', plan: 'Plan Extrême', montantHT: 30.00 },
];

// ── Calculs fiscaux ───────────────────────────────────────────────────────────
function extraireCommissionTaxes(montantBrut: number, province: string) {
  const tx = TAXES_PROVINCE[province] ?? TAXES_PROVINCE['QC'];
  const tauxTotal = tx.type === 'TPS+TVQ' ? 1 + tx.tps + tx.tvq
    : tx.type === 'TPS+TVH' ? 1 + tx.tvh
    : 1 + tx.tps;
  const sansTexte = montantBrut / tauxTotal;
  const tps = tx.type === 'TPS+TVQ' ? sansTexte * tx.tps : tx.type === 'TPS' ? sansTexte * tx.tps : 0;
  const tvq = tx.type === 'TPS+TVQ' ? sansTexte * tx.tvq : 0;
  const tvh = tx.type === 'TPS+TVH' ? montantBrut - sansTexte : 0;
  return { sansTexte, tps, tvq, tvh, typeTaxe: tx.type };
}

function calculerPlanTaxes(montantHT: number, province: string) {
  const tx = TAXES_PROVINCE[province] ?? TAXES_PROVINCE['QC'];
  const tps = tx.type === 'TPS+TVQ' ? montantHT * tx.tps : tx.type === 'TPS' ? montantHT * tx.tps : 0;
  const tvq = tx.type === 'TPS+TVQ' ? montantHT * tx.tvq : 0;
  const tvh = tx.type === 'TPS+TVH' ? montantHT * tx.tvh : 0;
  const total = montantHT + tps + tvq + tvh;
  return { montantHT, tps, tvq, tvh, total, typeTaxe: tx.type };
}

function fmtMoney(n: number) {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' $';
}
function fmtTaxType(type: string, tps: number, tvq: number, tvh: number) {
  if (type === 'TPS+TVQ') return `TPS ${fmtMoney(tps)} · TVQ ${fmtMoney(tvq)}`;
  if (type === 'TPS+TVH') return `TVH ${fmtMoney(tvh)}`;
  return `TPS ${fmtMoney(tps)}`;
}

interface RapportsFinanciersProps {
  naviguerVers: (page: string, data?: any) => void;
}

const PROVINCE_LABELS: Record<string, string> = {
  QC: 'Québec', ON: 'Ontario', AB: 'Alberta', BC: 'Colombie-Britannique',
  SK: 'Saskatchewan', MB: 'Manitoba', NB: 'Nouveau-Brunswick',
  NS: 'Nouvelle-Écosse', NL: 'Terre-Neuve', PE: 'Î.-P.-É.',
};

export default function RapportsFinanciers({ naviguerVers }: RapportsFinanciersProps) {
  // Injecter CSS print
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'evend-print-style';
    style.innerHTML = PRINT_STYLE;
    document.head.appendChild(style);
    return () => { const el = document.getElementById('evend-print-style'); if (el) el.remove(); };
  }, []);

  const handlePrint = () => {
    const printDiv = document.getElementById('evend-rapport-print');
    if (!printDiv) return;

    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Rapport fiscal — e-Vend.ca</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 20px; margin: 0; }
          @page { size: landscape; margin: 12mm 10mm; }
          h1 { font-size: 16px; color: #2d6a9f; margin: 0 0 2px 0; }
          p { margin: 0 0 4px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px; page-break-inside: auto; }
          tr { page-break-inside: avoid; }
          th { background-color: #e8f2fb; color: #2d6a9f; font-weight: bold; padding: 7px 8px; border: 1px solid #ccc; text-align: left; font-size: 9px; text-transform: uppercase; }
          td { padding: 6px 8px; border: 1px solid #ddd; font-size: 10px; }
          tfoot td { background-color: #e8f2fb; font-weight: bold; border-top: 2px solid #2d6a9f; }
          tr:nth-child(even) td { background-color: #f8f8f8; }
          .section-title { font-size: 13px; font-weight: bold; color: #2d6a9f; text-transform: uppercase; margin: 20px 0 8px 0; border-left: 4px solid #2d6a9f; padding-left: 8px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2d6a9f; padding-bottom: 10px; margin-bottom: 16px; }
          .note { font-size: 9px; color: #999; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 8px; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        </style>
      </head>
      <body>
        ${printDiv.innerHTML}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };
  const [dateDebut, setDateDebut] = useState('2025-10-01');
  const [dateFin, setDateFin] = useState('2026-02-28');
  const [filtreVendeur, setFiltreVendeur] = useState('tous');
  const [filtreProvince, setFiltreProvince] = useState('tous');
  const [recherche, setRecherche] = useState('');
  const [onglet, setOnglet] = useState<'commissions' | 'plans' | 'resume'>('resume');

  const vendeurs = [...COMMISSIONS_DATA, ...PLANS_DATA]
    .map(l => l.vendeur)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();

  const provinces = [...COMMISSIONS_DATA, ...PLANS_DATA]
    .map(l => l.province)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();

  // ── Filtrage commissions ───────────────────────────────────────────────────
  const commFiltrees = COMMISSIONS_DATA.filter(l => {
    const inPeriode = l.dateISO >= dateDebut && l.dateISO <= dateFin;
    const inVendeur = filtreVendeur === 'tous' || l.vendeur === filtreVendeur;
    const inProvince = filtreProvince === 'tous' || l.province === filtreProvince;
    const inSearch = recherche === '' ||
      l.vendeur.toLowerCase().includes(recherche.toLowerCase()) ||
      l.produit.toLowerCase().includes(recherche.toLowerCase()) ||
      l.orderId.includes(recherche);
    return inPeriode && inVendeur && inProvince && inSearch;
  }).sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  // ── Filtrage plans ─────────────────────────────────────────────────────────
  const plansFiltres = PLANS_DATA.filter(l => {
    const inPeriode = l.dateISO >= dateDebut && l.dateISO <= dateFin;
    const inVendeur = filtreVendeur === 'tous' || l.vendeur === filtreVendeur;
    const inProvince = filtreProvince === 'tous' || l.province === filtreProvince;
    const inSearch = recherche === '' ||
      l.vendeur.toLowerCase().includes(recherche.toLowerCase()) ||
      l.plan.toLowerCase().includes(recherche.toLowerCase());
    return inPeriode && inVendeur && inProvince && inSearch;
  }).sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  // ── Totaux commissions ─────────────────────────────────────────────────────
  const totComm = commFiltrees.reduce((acc, l) => {
    const t = extraireCommissionTaxes(l.montantBrut, l.province);
    return {
      brut: acc.brut + l.montantBrut,
      ht: acc.ht + t.sansTexte,
      tps: acc.tps + t.tps,
      tvq: acc.tvq + t.tvq,
      tvh: acc.tvh + t.tvh,
    };
  }, { brut: 0, ht: 0, tps: 0, tvq: 0, tvh: 0 });

  // ── Totaux plans ───────────────────────────────────────────────────────────
  const totPlans = plansFiltres.reduce((acc, l) => {
    const t = calculerPlanTaxes(l.montantHT, l.province);
    return {
      ht: acc.ht + t.montantHT,
      tps: acc.tps + t.tps,
      tvq: acc.tvq + t.tvq,
      tvh: acc.tvh + t.tvh,
      total: acc.total + t.total,
    };
  }, { ht: 0, tps: 0, tvq: 0, tvh: 0, total: 0 });

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const exportCommCSV = () => {
    const headers = ['Date', 'Order ID', 'Store Order', 'Vendeur', 'Province', 'Produit', 'Montant brut', 'Sans taxe', 'TPS', 'TVQ', 'TVH', 'Type taxe'];
    const rows = commFiltrees.map(l => {
      const t = extraireCommissionTaxes(l.montantBrut, l.province);
      return [l.date, l.orderId, l.storeOrderId, l.vendeur, l.province, `"${l.produit}"`, l.montantBrut.toFixed(2), t.sansTexte.toFixed(2), t.tps.toFixed(2), t.tvq.toFixed(2), t.tvh.toFixed(2), t.typeTaxe];
    });
    const totalRow = ['TOTAL', '', '', '', '', '', totComm.brut.toFixed(2), totComm.ht.toFixed(2), totComm.tps.toFixed(2), totComm.tvq.toFixed(2), totComm.tvh.toFixed(2), ''];
    const csv = [headers, ...rows, [], totalRow].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `rapport-commissions-${dateDebut}-${dateFin}.csv`; a.click();
  };

  const exportPlansCSV = () => {
    const headers = ['Date', 'Vendeur', 'Province', 'Plan', 'Montant HT', 'TPS', 'TVQ', 'TVH', 'Total TTC', 'Type taxe'];
    const rows = plansFiltres.map(l => {
      const t = calculerPlanTaxes(l.montantHT, l.province);
      return [l.date, l.vendeur, l.province, l.plan, t.montantHT.toFixed(2), t.tps.toFixed(2), t.tvq.toFixed(2), t.tvh.toFixed(2), t.total.toFixed(2), t.typeTaxe];
    });
    const totalRow = ['TOTAL', '', '', '', totPlans.ht.toFixed(2), totPlans.tps.toFixed(2), totPlans.tvq.toFixed(2), totPlans.tvh.toFixed(2), totPlans.total.toFixed(2), ''];
    const csv = [headers, ...rows, [], totalRow].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `rapport-plans-${dateDebut}-${dateFin}.csv`; a.click();
  };

  const totalTPS = totComm.tps + totPlans.tps;
  const totalTVQ = totComm.tvq + totPlans.tvq;
  const totalTVH = totComm.tvh + totPlans.tvh;
  const totalRevenus = totComm.ht + totPlans.ht;
  const totalBrut = totComm.brut + totPlans.total;

  // ── Styles réutilisables ───────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    backgroundColor: THEME.card, borderRadius: '12px',
    border: `1px solid ${THEME.border}`, overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  };
  const theadThStyle: React.CSSProperties = {
    padding: '11px 14px', textAlign: 'left', fontSize: '11px',
    fontWeight: '700', color: THEME.accent, textTransform: 'uppercase',
    letterSpacing: '0.5px', whiteSpace: 'nowrap', backgroundColor: '#f8fafc',
  };
  const tdStyle: React.CSSProperties = { padding: '12px 14px', fontSize: '12px', color: THEME.text };
  const tfootTdStyle: React.CSSProperties = { padding: '13px 14px', fontSize: '13px', fontWeight: '800', color: THEME.accent, backgroundColor: '#f0f7ff', borderTop: `2px solid ${THEME.accent}` };

  const BadgeProv = ({ prov }: { prov: string }) => {
    const tx = TAXES_PROVINCE[prov];
    const bg = tx?.type === 'TPS+TVQ' ? '#e8f2fb' : tx?.type === 'TPS+TVH' ? '#f3e8ff' : '#f0fdf4';
    const color = tx?.type === 'TPS+TVQ' ? THEME.accent : tx?.type === 'TPS+TVH' ? THEME.purple : THEME.success;
    return (
      <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '10px', backgroundColor: bg, color, whiteSpace: 'nowrap' as const }}>
        {prov} · {tx?.type}
      </span>
    );
  };

  return (
    <>
    {/* Zone d'impression cachée — visible seulement @media print */}
    <div id="evend-rapport-print" style={{ display: 'none', visibility: 'hidden', position: 'absolute', top: '-9999px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2d6a9f', paddingBottom: '10px', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '900', color: '#2d6a9f', margin: '0 0 2px 0' }}>e-Vend.ca — Rapport financier & fiscal</h1>
          <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Période : {dateDebut} au {dateFin}{filtreVendeur !== 'tous' ? ` · Vendeur : ${filtreVendeur}` : ''}{filtreProvince !== 'tous' ? ` · Province : ${filtreProvince}` : ''}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Généré le {new Date().toLocaleDateString('fr-CA')}</p>
          <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>N° TPS : [votre numéro] · N° TVQ : [votre numéro]</p>
        </div>
      </div>

      {/* Résumé */}
      <div className="print-section-title">Résumé fiscal</div>
      <table>
        <thead><tr><th>Source</th><th>Nb transactions</th><th>Revenus HT</th><th>TPS collectée</th><th>TVQ collectée</th><th>TVH collectée</th><th>Total taxes</th></tr></thead>
        <tbody>
          <tr><td>Commissions de ventes (taxe incluse — extraite)</td><td>{commFiltrees.length}</td><td>{fmtMoney(totComm.ht)}</td><td>{fmtMoney(totComm.tps)}</td><td>{fmtMoney(totComm.tvq)}</td><td>{fmtMoney(totComm.tvh)}</td><td>{fmtMoney(totComm.tps+totComm.tvq+totComm.tvh)}</td></tr>
          <tr><td>Abonnements plans vendeurs (taxe en sus)</td><td>{plansFiltres.length}</td><td>{fmtMoney(totPlans.ht)}</td><td>{fmtMoney(totPlans.tps)}</td><td>{fmtMoney(totPlans.tvq)}</td><td>{fmtMoney(totPlans.tvh)}</td><td>{fmtMoney(totPlans.tps+totPlans.tvq+totPlans.tvh)}</td></tr>
        </tbody>
        <tfoot><tr><td><strong>TOTAL</strong></td><td><strong>{commFiltrees.length + plansFiltres.length}</strong></td><td><strong>{fmtMoney(totComm.ht + totPlans.ht)}</strong></td><td><strong>{fmtMoney(totalTPS)}</strong></td><td><strong>{fmtMoney(totalTVQ)}</strong></td><td><strong>{fmtMoney(totalTVH)}</strong></td><td><strong>{fmtMoney(totalTPS+totalTVQ+totalTVH)}</strong></td></tr></tfoot>
      </table>

      {/* Tableau commissions */}
      <div className="print-section-title" style={{ marginTop: '20px' }}>Commissions de ventes — détail</div>
      <table>
        <thead><tr><th>Date</th><th>Order ID</th><th>Vendeur</th><th>Province</th><th>Produit</th><th>Montant brut reçu</th><th>Sans taxe</th><th>TPS extraite</th><th>TVQ extraite</th><th>TVH extraite</th></tr></thead>
        <tbody>
          {commFiltrees.map(l => { const t = extraireCommissionTaxes(l.montantBrut, l.province); return (
            <tr key={l.id}><td>{l.date}</td><td>{l.orderId} {l.storeOrderId}</td><td>{l.vendeur}</td><td>{l.province} ({TAXES_PROVINCE[l.province]?.type})</td><td>{l.produit}</td><td>{fmtMoney(l.montantBrut)}</td><td>{fmtMoney(t.sansTexte)}</td><td>{t.tps > 0 ? fmtMoney(t.tps) : '—'}</td><td>{t.tvq > 0 ? fmtMoney(t.tvq) : '—'}</td><td>{t.tvh > 0 ? fmtMoney(t.tvh) : '—'}</td></tr>
          );})}
        </tbody>
        <tfoot><tr><td colSpan={5}><strong>TOTAL — {commFiltrees.length} lignes</strong></td><td><strong>{fmtMoney(totComm.brut)}</strong></td><td><strong>{fmtMoney(totComm.ht)}</strong></td><td><strong>{fmtMoney(totComm.tps)}</strong></td><td><strong>{fmtMoney(totComm.tvq)}</strong></td><td><strong>{fmtMoney(totComm.tvh)}</strong></td></tr></tfoot>
      </table>

      {/* Tableau plans */}
      <div className="print-section-title" style={{ marginTop: '20px' }}>Abonnements plans vendeurs — détail</div>
      <table>
        <thead><tr><th>Date</th><th>Vendeur</th><th>Province</th><th>Plan</th><th>Prix HT</th><th>TPS</th><th>TVQ</th><th>TVH</th><th>Total TTC</th></tr></thead>
        <tbody>
          {plansFiltres.map(l => { const t = calculerPlanTaxes(l.montantHT, l.province); return (
            <tr key={l.id}><td>{l.date}</td><td>{l.vendeur}</td><td>{l.province} ({TAXES_PROVINCE[l.province]?.type})</td><td>{l.plan}</td><td>{fmtMoney(t.montantHT)}</td><td>{t.tps > 0 ? fmtMoney(t.tps) : '—'}</td><td>{t.tvq > 0 ? fmtMoney(t.tvq) : '—'}</td><td>{t.tvh > 0 ? fmtMoney(t.tvh) : '—'}</td><td>{fmtMoney(t.total)}</td></tr>
          );})}
        </tbody>
        <tfoot><tr><td colSpan={4}><strong>TOTAL — {plansFiltres.length} lignes</strong></td><td><strong>{fmtMoney(totPlans.ht)}</strong></td><td><strong>{fmtMoney(totPlans.tps)}</strong></td><td><strong>{fmtMoney(totPlans.tvq)}</strong></td><td><strong>{fmtMoney(totPlans.tvh)}</strong></td><td><strong>{fmtMoney(totPlans.total)}</strong></td></tr></tfoot>
      </table>

      <p style={{ fontSize: '9px', color: '#999', marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '8px' }}>
        Ce rapport est généré automatiquement par e-Vend.ca. Consultez votre comptable pour la préparation officielle de vos déclarations TPS/TVQ (Revenu Québec) et TPS/TVH (ARC).
      </p>
    </div>

    <div style={{ padding: '28px 32px', maxWidth: '1300px', backgroundColor: THEME.bg, minHeight: '100vh' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Rapports financiers & fiscaux
          </h1>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
            Revenus imposables, TPS · TVQ · TVH à déclarer — e-Vend.ca
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={exportCommCSV} style={{ backgroundColor: 'white', color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            📤 CSV Commissions
          </button>
          <button onClick={exportPlansCSV} style={{ backgroundColor: 'white', color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            📤 CSV Plans
          </button>
          <button onClick={handlePrint} style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            🖨️ Imprimer
          </button>
        </div>
      </div>

      {/* Filtres principaux */}
      <div style={{ ...cardStyle, padding: '16px 20px', marginBottom: '20px' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>🗓️ Période & filtres</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: THEME.textLight }}>Du</label>
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
              style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 12px', fontSize: '12px', outline: 'none', backgroundColor: 'white' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: THEME.textLight }}>Au</label>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
              style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 12px', fontSize: '12px', outline: 'none', backgroundColor: 'white' }} />
          </div>

          {/* Raccourcis période */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { label: 'Ce mois', d: '2026-02-01', f: '2026-02-28' },
              { label: 'T4 2025', d: '2025-10-01', f: '2025-12-31' },
              { label: '2025', d: '2025-01-01', f: '2025-12-31' },
              { label: 'Tout', d: '2025-01-01', f: '2026-12-31' },
            ].map(r => (
              <button key={r.label} onClick={() => { setDateDebut(r.d); setDateFin(r.f); }}
                style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${THEME.border}`, backgroundColor: dateDebut === r.d && dateFin === r.f ? THEME.accent : 'white', color: dateDebut === r.d && dateFin === r.f ? 'white' : THEME.textLight, fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                {r.label}
              </button>
            ))}
          </div>

          <select value={filtreVendeur} onChange={e => setFiltreVendeur(e.target.value)}
            style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 12px', fontSize: '12px', outline: 'none', backgroundColor: 'white', fontWeight: '600' }}>
            <option value="tous">Tous les vendeurs</option>
            {vendeurs.map(v => <option key={v} value={v}>{v}</option>)}
          </select>

          <select value={filtreProvince} onChange={e => setFiltreProvince(e.target.value)}
            style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 12px', fontSize: '12px', outline: 'none', backgroundColor: 'white', fontWeight: '600' }}>
            <option value="tous">Toutes provinces</option>
            {provinces.map(p => <option key={p} value={p}>{p} — {PROVINCE_LABELS[p] ?? p} ({TAXES_PROVINCE[p]?.type})</option>)}
          </select>

          <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="🔍 Vendeur, produit, order ID..."
            style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 12px', fontSize: '12px', outline: 'none', width: '200px', backgroundColor: 'white' }} />

          {(filtreVendeur !== 'tous' || filtreProvince !== 'tous' || recherche) && (
            <button onClick={() => { setFiltreVendeur('tous'); setFiltreProvince('tous'); setRecherche(''); }}
              style={{ background: 'none', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: THEME.textLight, cursor: 'pointer', fontWeight: '600' }}>
              ✕ Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', backgroundColor: 'white', borderRadius: '10px', border: `1px solid ${THEME.border}`, padding: '4px', width: 'fit-content' }}>
        {[
          { val: 'resume',      label: '📋 Résumé fiscal',       },
          { val: 'commissions', label: '💰 Commissions de ventes' },
          { val: 'plans',       label: '⭐ Abonnements plans'    },
        ].map(o => (
          <button key={o.val} onClick={() => setOnglet(o.val as any)}
            style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700', backgroundColor: onglet === o.val ? THEME.accent : 'transparent', color: onglet === o.val ? 'white' : THEME.textLight, transition: 'all 0.15s' }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* ── ONGLET RÉSUMÉ FISCAL ── */}
      {onglet === 'resume' && (
        <div>
          {/* Bloc déclaration */}
          <div style={{ backgroundColor: '#1a2332', borderRadius: '14px', padding: '24px 28px', marginBottom: '20px', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <p style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>Rapport fiscal — e-Vend.ca</p>
                <h2 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 4px 0' }}>Résumé pour déclaration</h2>
                <p style={{ fontSize: '12px', opacity: 0.6, margin: 0 }}>
                  Période : {dateDebut} au {dateFin}
                  {filtreVendeur !== 'tous' ? ` · Vendeur: ${filtreVendeur}` : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '11px', opacity: 0.5, margin: '0 0 4px 0' }}>REVENUS TOTAUX IMPOSABLES</p>
                <p style={{ fontSize: '36px', fontWeight: '900', margin: 0, color: '#4ade80' }}>{fmtMoney(totalRevenus)}</p>
                <p style={{ fontSize: '11px', opacity: 0.5, margin: '4px 0 0 0' }}>avant taxes</p>
              </div>
            </div>

            {/* Grille résumé */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'Commissions HT', val: fmtMoney(totComm.ht), sous: `${commFiltrees.length} transactions`, icon: '💰', c: '#60a5fa' },
                { label: 'Abonnements HT', val: fmtMoney(totPlans.ht), sous: `${plansFiltres.length} transactions`, icon: '⭐', c: '#a78bfa' },
                { label: 'Total brut reçu', val: fmtMoney(totalBrut), sous: 'Commissions + plans TTC', icon: '🏦', c: '#34d399' },
                { label: 'Taxes à reverser', val: fmtMoney(totalTPS + totalTVQ + totalTVH), sous: 'TPS + TVQ + TVH', icon: '🏛️', c: '#fb923c' },
              ].map((k, i) => (
                <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{k.icon}</div>
                  <p style={{ fontSize: '18px', fontWeight: '900', color: k.c, margin: '0 0 2px 0' }}>{k.val}</p>
                  <p style={{ fontSize: '11px', opacity: 0.7, margin: '0 0 2px 0', fontWeight: '700' }}>{k.label}</p>
                  <p style={{ fontSize: '10px', opacity: 0.4, margin: 0 }}>{k.sous}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tableau taxes à déclarer */}
          <div style={{ ...cardStyle, marginBottom: '16px' }}>
            <div style={{ padding: '14px 20px', backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏛️</span>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Taxes à déclarer et reverser</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  {['Source', 'Type de taxe', 'TPS collectée', 'TVQ collectée', 'TVH collectée', 'Total taxes'].map(h => (
                    <th key={h} style={{ ...theadThStyle, borderBottom: `1px solid ${THEME.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: `1px solid #f5f5f5`, backgroundColor: 'white' }}>
                  <td style={tdStyle}><strong>💰 Commissions de ventes</strong><p style={{ fontSize: '11px', color: '#aaa', margin: '2px 0 0 0' }}>Taxe incluse dans le montant — extraite</p></td>
                  <td style={tdStyle}><span style={{ fontSize: '11px', backgroundColor: THEME.accentLight, color: THEME.accent, padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>Incluse (extraction)</span></td>
                  <td style={{ ...tdStyle, fontWeight: '700', color: THEME.success }}>{fmtMoney(totComm.tps)}</td>
                  <td style={{ ...tdStyle, fontWeight: '700', color: THEME.success }}>{fmtMoney(totComm.tvq)}</td>
                  <td style={{ ...tdStyle, fontWeight: '700', color: THEME.purple }}>{fmtMoney(totComm.tvh)}</td>
                  <td style={{ ...tdStyle, fontWeight: '900', color: THEME.accent, fontSize: '14px' }}>{fmtMoney(totComm.tps + totComm.tvq + totComm.tvh)}</td>
                </tr>
                <tr style={{ borderBottom: `1px solid #f5f5f5`, backgroundColor: '#fafafa' }}>
                  <td style={tdStyle}><strong>⭐ Abonnements plans vendeurs</strong><p style={{ fontSize: '11px', color: '#aaa', margin: '2px 0 0 0' }}>Taxe en sus du prix HT</p></td>
                  <td style={tdStyle}><span style={{ fontSize: '11px', backgroundColor: '#f3e8ff', color: THEME.purple, padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>En sus (ajoutée)</span></td>
                  <td style={{ ...tdStyle, fontWeight: '700', color: THEME.success }}>{fmtMoney(totPlans.tps)}</td>
                  <td style={{ ...tdStyle, fontWeight: '700', color: THEME.success }}>{fmtMoney(totPlans.tvq)}</td>
                  <td style={{ ...tdStyle, fontWeight: '700', color: THEME.purple }}>{fmtMoney(totPlans.tvh)}</td>
                  <td style={{ ...tdStyle, fontWeight: '900', color: THEME.accent, fontSize: '14px' }}>{fmtMoney(totPlans.tps + totPlans.tvq + totPlans.tvh)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ ...tfootTdStyle, fontSize: '12px' }}>TOTAL À DÉCLARER</td>
                  <td style={tfootTdStyle}></td>
                  <td style={{ ...tfootTdStyle, color: THEME.success, fontSize: '15px' }}>{fmtMoney(totalTPS)}</td>
                  <td style={{ ...tfootTdStyle, color: THEME.success, fontSize: '15px' }}>{fmtMoney(totalTVQ)}</td>
                  <td style={{ ...tfootTdStyle, color: THEME.purple, fontSize: '15px' }}>{fmtMoney(totalTVH)}</td>
                  <td style={{ ...tfootTdStyle, color: THEME.danger, fontSize: '18px' }}>{fmtMoney(totalTPS + totalTVQ + totalTVH)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Avertissement TVH */}
          {(totComm.tvh > 0 || totPlans.tvh > 0) && (
            <div style={{ backgroundColor: '#f3e8ff', border: `1px solid ${THEME.purple}`, borderRadius: '10px', padding: '14px 18px', marginBottom: '16px', display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '800', color: THEME.purple, margin: '0 0 4px 0' }}>TVH détectée — vendeurs hors-Québec</p>
                <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>
                  Vous avez des transactions avec des vendeurs de provinces à TVH. Assurez-vous d'être inscrit au compte TVH fédéral et de déclarer ces montants séparément auprès de l'ARC.
                </p>
              </div>
            </div>
          )}

          {/* Répartition par province */}
          <div style={cardStyle}>
            <div style={{ padding: '14px 20px', backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🗺️</span>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Répartition par province</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Province', 'Régime fiscal', 'Nb transactions', 'Revenus HT', 'TPS', 'TVQ', 'TVH', 'Total taxes'].map(h => (
                    <th key={h} style={{ ...theadThStyle, borderBottom: `1px solid ${THEME.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {provinces.filter(p => {
                  const hasComm = commFiltrees.some(l => l.province === p);
                  const hasPlan = plansFiltres.some(l => l.province === p);
                  return hasComm || hasPlan;
                }).map((prov, i) => {
                  const commProv = commFiltrees.filter(l => l.province === prov);
                  const plansProv = plansFiltres.filter(l => l.province === prov);
                  const tComm = commProv.reduce((a, l) => { const t = extraireCommissionTaxes(l.montantBrut, prov); return { ht: a.ht + t.sansTexte, tps: a.tps + t.tps, tvq: a.tvq + t.tvq, tvh: a.tvh + t.tvh }; }, { ht: 0, tps: 0, tvq: 0, tvh: 0 });
                  const tPlan = plansProv.reduce((a, l) => { const t = calculerPlanTaxes(l.montantHT, prov); return { ht: a.ht + t.montantHT, tps: a.tps + t.tps, tvq: a.tvq + t.tvq, tvh: a.tvh + t.tvh }; }, { ht: 0, tps: 0, tvq: 0, tvh: 0 });
                  const ht = tComm.ht + tPlan.ht;
                  const tps = tComm.tps + tPlan.tps;
                  const tvq = tComm.tvq + tPlan.tvq;
                  const tvh = tComm.tvh + tPlan.tvh;
                  return (
                    <tr key={prov} style={{ borderBottom: '1px solid #f5f5f5', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={tdStyle}><strong>{PROVINCE_LABELS[prov] ?? prov}</strong></td>
                      <td style={tdStyle}><BadgeProv prov={prov} /></td>
                      <td style={tdStyle}>{commProv.length + plansProv.length}</td>
                      <td style={{ ...tdStyle, fontWeight: '700' }}>{fmtMoney(ht)}</td>
                      <td style={{ ...tdStyle, color: THEME.success }}>{tps > 0 ? fmtMoney(tps) : '—'}</td>
                      <td style={{ ...tdStyle, color: THEME.success }}>{tvq > 0 ? fmtMoney(tvq) : '—'}</td>
                      <td style={{ ...tdStyle, color: THEME.purple }}>{tvh > 0 ? fmtMoney(tvh) : '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: '800', color: THEME.accent }}>{fmtMoney(tps + tvq + tvh)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ONGLET COMMISSIONS ── */}
      {onglet === 'commissions' && (
        <div style={cardStyle}>
          <div style={{ padding: '14px 20px', backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💰</span>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Commissions de ventes — {commFiltrees.length} transactions
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: THEME.textLight, fontWeight: '600' }}>⚠️ Taxe incluse dans le montant — extraction automatique</span>
              <button onClick={exportCommCSV} style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>📤 CSV</button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${THEME.border}` }}>
                  {['Date', 'Order ID', 'Vendeur', 'Province', 'Produit', 'Montant brut reçu', 'Montant sans taxe', 'TPS extraite', 'TVQ extraite', 'TVH extraite'].map(h => (
                    <th key={h} style={theadThStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commFiltrees.map((l, i) => {
                  const t = extraireCommissionTaxes(l.montantBrut, l.province);
                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={tdStyle}>{l.date}</td>
                      <td style={tdStyle}>
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: THEME.accent }}>{l.orderId}</span>
                          <p style={{ fontSize: '10px', color: '#aaa', margin: 0 }}>{l.storeOrderId}</p>
                        </div>
                      </td>
                      <td style={tdStyle}><span style={{ fontWeight: '600' }}>{l.vendeur}</span></td>
                      <td style={tdStyle}><BadgeProv prov={l.province} /></td>
                      <td style={{ ...tdStyle, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.produit}>{l.produit}</td>
                      <td style={{ ...tdStyle, fontWeight: '700' }}>{fmtMoney(l.montantBrut)}</td>
                      <td style={{ ...tdStyle, fontWeight: '800', color: THEME.success }}>{fmtMoney(t.sansTexte)}</td>
                      <td style={{ ...tdStyle, color: THEME.success }}>{t.tps > 0 ? fmtMoney(t.tps) : '—'}</td>
                      <td style={{ ...tdStyle, color: THEME.success }}>{t.tvq > 0 ? fmtMoney(t.tvq) : '—'}</td>
                      <td style={{ ...tdStyle, color: THEME.purple }}>{t.tvh > 0 ? fmtMoney(t.tvh) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} style={tfootTdStyle}>TOTAL — {commFiltrees.length} lignes</td>
                  <td style={tfootTdStyle}>{fmtMoney(totComm.brut)}</td>
                  <td style={{ ...tfootTdStyle, color: THEME.success, fontSize: '15px' }}>{fmtMoney(totComm.ht)}</td>
                  <td style={{ ...tfootTdStyle, color: THEME.success }}>{fmtMoney(totComm.tps)}</td>
                  <td style={{ ...tfootTdStyle, color: THEME.success }}>{fmtMoney(totComm.tvq)}</td>
                  <td style={{ ...tfootTdStyle, color: THEME.purple }}>{fmtMoney(totComm.tvh)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {commFiltrees.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ fontSize: '32px', margin: '0 0 8px 0', opacity: 0.2 }}>💰</p>
              <p style={{ fontSize: '14px', color: THEME.textLight, fontWeight: '600', margin: 0 }}>Aucune commission pour cette période</p>
            </div>
          )}
        </div>
      )}

      {/* ── ONGLET PLANS ── */}
      {onglet === 'plans' && (
        <div style={cardStyle}>
          <div style={{ padding: '14px 20px', backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⭐</span>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Abonnements plans vendeurs — {plansFiltres.length} transactions
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: THEME.textLight, fontWeight: '600' }}>✅ Prix HT — taxe calculée en sus</span>
              <button onClick={exportPlansCSV} style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>📤 CSV</button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${THEME.border}` }}>
                  {['Date', 'Vendeur', 'Province', 'Plan', 'Prix HT', 'TPS', 'TVQ', 'TVH', 'Total TTC'].map(h => (
                    <th key={h} style={theadThStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plansFiltres.map((l, i) => {
                  const t = calculerPlanTaxes(l.montantHT, l.province);
                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={tdStyle}>{l.date}</td>
                      <td style={tdStyle}><span style={{ fontWeight: '600' }}>{l.vendeur}</span></td>
                      <td style={tdStyle}><BadgeProv prov={l.province} /></td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '12px', backgroundColor: THEME.accentLight, color: THEME.accent, padding: '3px 10px', borderRadius: '20px', fontWeight: '700' }}>
                          {l.plan}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: '800', color: THEME.success }}>{fmtMoney(t.montantHT)}</td>
                      <td style={{ ...tdStyle, color: THEME.success }}>{t.tps > 0 ? fmtMoney(t.tps) : '—'}</td>
                      <td style={{ ...tdStyle, color: THEME.success }}>{t.tvq > 0 ? fmtMoney(t.tvq) : '—'}</td>
                      <td style={{ ...tdStyle, color: THEME.purple }}>{t.tvh > 0 ? fmtMoney(t.tvh) : '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: '800', color: THEME.accent }}>{fmtMoney(t.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={tfootTdStyle}>TOTAL — {plansFiltres.length} lignes</td>
                  <td style={{ ...tfootTdStyle, color: THEME.success, fontSize: '15px' }}>{fmtMoney(totPlans.ht)}</td>
                  <td style={{ ...tfootTdStyle, color: THEME.success }}>{fmtMoney(totPlans.tps)}</td>
                  <td style={{ ...tfootTdStyle, color: THEME.success }}>{fmtMoney(totPlans.tvq)}</td>
                  <td style={{ ...tfootTdStyle, color: THEME.purple }}>{fmtMoney(totPlans.tvh)}</td>
                  <td style={{ ...tfootTdStyle, color: THEME.accent, fontSize: '15px' }}>{fmtMoney(totPlans.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {plansFiltres.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ fontSize: '32px', margin: '0 0 8px 0', opacity: 0.2 }}>⭐</p>
              <p style={{ fontSize: '14px', color: THEME.textLight, fontWeight: '600', margin: 0 }}>Aucun abonnement pour cette période</p>
            </div>
          )}
        </div>
      )}

      {/* Note légale */}
      <div style={{ marginTop: '16px', backgroundColor: '#fef9c3', borderRadius: '8px', padding: '12px 18px', border: '1px solid #d97706', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
        <p style={{ fontSize: '11px', color: '#92400e', margin: 0, lineHeight: '1.6' }}>
          <strong>Note fiscale :</strong> Les montants présentés sont générés automatiquement à partir des données de la plateforme. Pour les commissions, la taxe est extraite du montant brut reçu (÷ par le taux composite). Pour les plans, la taxe est calculée en sus du prix HT. Ce rapport est fourni à titre indicatif — consultez votre comptable pour la préparation officielle de vos déclarations TPS/TVQ (Revenu Québec) et TPS/TVH (ARC).
        </p>
      </div>
    </div>
    </>
  );
}
