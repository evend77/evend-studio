import React, { useState } from 'react';

const THEME = {
  accent: '#2d6a9f', accentLight: '#e8f2fb', accentHover: '#245a8a',
  bg: '#f0f2f5', card: '#ffffff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706', purple: '#7c3aed',
};

// ── Types ─────────────────────────────────────────────────────────────────────
type StatutPayout = 'verse' | 'en_attente' | 'rembourse';
type Periode = 'ce_mois' | 'mois_dernier' | 'tout';

interface LigneCommission {
  id: number;
  orderId: string;
  storeOrderId: string;
  date: string;
  mois: string; // 'YYYY-MM'
  vendeur: string;
  boutique: string;
  produit: string;
  quantite: number;
  prixUnitaire: number;
  commissionUnitaire: number;
  commissionTotale: number;
  taxCommission: number;
  shippingCommission: number;
  statutPayout: StatutPayout;
  datePayout?: string;
}

// ── Données mock ──────────────────────────────────────────────────────────────
const COMMISSIONS_MOCK: LigneCommission[] = [
  { id: 1,  orderId: '13882042', storeOrderId: '#1016', date: '20/02/2026 06:21 PM', mois: '2026-02', vendeur: 'idée-cadeau', boutique: 'Idée Cadeau QC', produit: 'Porte-clés pour papa sur la route', quantite: 1,  prixUnitaire: 14.99, commissionUnitaire: 1.50, commissionTotale: 1.50,  taxCommission: 0, shippingCommission: 0, statutPayout: 'en_attente' },
  { id: 2,  orderId: '13882020', storeOrderId: '#1015', date: '20/02/2026 06:14 PM', mois: '2026-02', vendeur: 'idée-cadeau', boutique: 'Idée Cadeau QC', produit: "Porte clés 'À ma marraine'", quantite: 1,  prixUnitaire: 14.99, commissionUnitaire: 1.50, commissionTotale: 1.50,  taxCommission: 0, shippingCommission: 0, statutPayout: 'en_attente' },
  { id: 3,  orderId: '13882020', storeOrderId: '#1015', date: '20/02/2026 06:14 PM', mois: '2026-02', vendeur: 'idée-cadeau', boutique: 'Idée Cadeau QC', produit: 'Montre à quartz pour enfant — Motif dinosaure', quantite: 2,  prixUnitaire: 16.99, commissionUnitaire: 1.70, commissionTotale: 3.40,  taxCommission: 0, shippingCommission: 0, statutPayout: 'en_attente' },
  { id: 4,  orderId: '13879676', storeOrderId: '#1014', date: '20/02/2026 10:11 AM', mois: '2026-02', vendeur: 'Vic',          boutique: "Mom's World",    produit: 'Angelis The Debut Album CD',                       quantite: 1,  prixUnitaire: 16.00, commissionUnitaire: 1.60, commissionTotale: 1.60,  taxCommission: 0, shippingCommission: 0, statutPayout: 'en_attente' },
  { id: 5,  orderId: '13850204', storeOrderId: '#1013', date: '15/02/2026 05:35 PM', mois: '2026-02', vendeur: 'idée-cadeau', boutique: 'Idée Cadeau QC', produit: 'Collier pendentif en forme de cœur / cheval',         quantite: 1,  prixUnitaire: 10.00, commissionUnitaire: 0.50, commissionTotale: 0.50,  taxCommission: 0, shippingCommission: 0, statutPayout: 'en_attente' },
  { id: 6,  orderId: '13812366', storeOrderId: '#1012', date: '10/02/2026 08:57 AM', mois: '2026-02', vendeur: 'Vic',          boutique: "Mom's World",    produit: '101 70s Hits CD',                                  quantite: 7,  prixUnitaire: 10.00, commissionUnitaire: 1.50, commissionTotale: 10.50, taxCommission: 0, shippingCommission: 0, statutPayout: 'verse',      datePayout: '20/02/2026' },
  { id: 7,  orderId: '13629869', storeOrderId: '#1011', date: '15/01/2026 01:12 PM', mois: '2026-01', vendeur: 'idée-cadeau', boutique: 'Idée Cadeau QC', produit: 'Écusson brodé "Back to the Future" modèle 2',      quantite: 37, prixUnitaire: 10.00, commissionUnitaire: 1.50, commissionTotale: 55.50, taxCommission: 0, shippingCommission: 0, statutPayout: 'verse',      datePayout: '01/02/2026' },
  { id: 8,  orderId: '13629778', storeOrderId: '#1010', date: '15/01/2026 12:56 PM', mois: '2026-01', vendeur: 'idée-cadeau', boutique: 'Idée Cadeau QC', produit: 'Écusson brodé "Back to the Future" modèle 2',      quantite: 41, prixUnitaire: 10.00, commissionUnitaire: 1.50, commissionTotale: 61.50, taxCommission: 0, shippingCommission: 0, statutPayout: 'verse',      datePayout: '01/02/2026' },
  { id: 9,  orderId: '13629371', storeOrderId: '#1009', date: '15/01/2026 12:02 PM', mois: '2026-01', vendeur: 'idée-cadeau', boutique: 'Idée Cadeau QC', produit: 'Écusson brodé "Back to the Future" modèle 2',      quantite: 7,  prixUnitaire: 10.00, commissionUnitaire: 1.50, commissionTotale: 10.50, taxCommission: 0, shippingCommission: 0, statutPayout: 'verse',      datePayout: '01/02/2026' },
  { id: 10, orderId: '13209015', storeOrderId: '#1008', date: '17/11/2025 10:02 PM', mois: '2025-11', vendeur: 'Vic',          boutique: "Mom's World",    produit: "Everybody's Grotty Skinner and Twitch CD",         quantite: 84, prixUnitaire: 10.00, commissionUnitaire: 1.00, commissionTotale: 84.00, taxCommission: 0, shippingCommission: 0, statutPayout: 'verse',      datePayout: '01/12/2025' },
  { id: 11, orderId: '13141005', storeOrderId: '#1007', date: '08/11/2025 01:32 AM', mois: '2025-11', vendeur: 'Vic',          boutique: "Mom's World",    produit: 'CD Glass Piano Bruce',                             quantite: 84, prixUnitaire: 5.00,  commissionUnitaire: 0.50, commissionTotale: 42.00, taxCommission: 0, shippingCommission: 0, statutPayout: 'verse',      datePayout: '01/12/2025' },
  { id: 12, orderId: '13090947', storeOrderId: '#1006', date: '31/10/2025 09:58 AM', mois: '2025-10', vendeur: 'Vic',          boutique: "Mom's World",    produit: '101 70s Hits CD',                                  quantite: 84, prixUnitaire: 5.00,  commissionUnitaire: 0.50, commissionTotale: 42.00, taxCommission: 0, shippingCommission: 0, statutPayout: 'verse',      datePayout: '01/11/2025' },
  { id: 13, orderId: '13084573', storeOrderId: '#1005', date: '30/10/2025 08:44 AM', mois: '2025-10', vendeur: 'idée-cadeau', boutique: 'Idée Cadeau QC', produit: 'Collier pendentif en forme de cœur',               quantite: 1,  prixUnitaire: 5.00,  commissionUnitaire: 0.25, commissionTotale: 0.25,  taxCommission: 0, shippingCommission: 0, statutPayout: 'rembourse' },
  { id: 14, orderId: '13069516', storeOrderId: '#1004', date: '27/10/2025 10:40 PM', mois: '2025-10', vendeur: 'Vic',          boutique: "Mom's World",    produit: '101 70s Hits CD',                                  quantite: 1,  prixUnitaire: 5.00,  commissionUnitaire: 0.50, commissionTotale: 0.50,  taxCommission: 0, shippingCommission: 0, statutPayout: 'verse',      datePayout: '01/11/2025' },
];

const STATUT_PAYOUT_CONFIG: Record<StatutPayout, { label: string; bg: string; color: string; icon: string }> = {
  verse:      { label: 'Versé',       bg: '#dcfce7', color: THEME.success,  icon: '✅' },
  en_attente: { label: 'En attente',  bg: '#fef9c3', color: THEME.warning,  icon: '⏳' },
  rembourse:  { label: 'Remboursé',   bg: '#fee2e2', color: THEME.danger,   icon: '↩️' },
};

interface FinancesCommissionsProps {
  naviguerVers: (page: string, data?: any) => void;
}

export default function FinancesCommissions({ naviguerVers }: FinancesCommissionsProps) {
  const [periode, setPeriode] = useState<Periode>('ce_mois');
  const [filtreVendeur, setFiltreVendeur] = useState('tous');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [recherche, setRecherche] = useState('');
  const [selectionnes, setSelectionnes] = useState<number[]>([]);
  const [triColonne, setTriColonne] = useState<string>('date');
  const [triSens, setTriSens] = useState<'asc' | 'desc'>('desc');

  // ── Filtrage ──────────────────────────────────────────────────────────────
  const moisActuel = '2026-02';
  const moisDernier = '2026-01';

  const lignesFiltrees = COMMISSIONS_MOCK.filter(l => {
    const matchPeriode =
      periode === 'tout' ? true :
      periode === 'ce_mois' ? l.mois === moisActuel :
      l.mois === moisDernier;
    const matchVendeur = filtreVendeur === 'tous' || l.vendeur === filtreVendeur;
    const matchStatut = filtreStatut === 'tous' || l.statutPayout === filtreStatut;
    const matchRecherche =
      l.produit.toLowerCase().includes(recherche.toLowerCase()) ||
      l.vendeur.toLowerCase().includes(recherche.toLowerCase()) ||
      l.orderId.includes(recherche) ||
      l.storeOrderId.toLowerCase().includes(recherche.toLowerCase());
    return matchPeriode && matchVendeur && matchStatut && matchRecherche;
  }).sort((a, b) => {
    let cmp = 0;
    if (triColonne === 'date') cmp = a.orderId.localeCompare(b.orderId);
    if (triColonne === 'commission') cmp = a.commissionTotale - b.commissionTotale;
    if (triColonne === 'vendeur') cmp = a.vendeur.localeCompare(b.vendeur);
    if (triColonne === 'montant') cmp = a.prixUnitaire * a.quantite - b.prixUnitaire * b.quantite;
    return triSens === 'desc' ? -cmp : cmp;
  });

  const trier = (col: string) => {
    if (triColonne === col) setTriSens(s => s === 'asc' ? 'desc' : 'asc');
    else { setTriColonne(col); setTriSens('desc'); }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalCommissions = lignesFiltrees.reduce((s, l) => s + l.commissionTotale, 0);
  const commissionsEnAttente = lignesFiltrees.filter(l => l.statutPayout === 'en_attente').reduce((s, l) => s + l.commissionTotale, 0);
  const commissionsVersees = lignesFiltrees.filter(l => l.statutPayout === 'verse').reduce((s, l) => s + l.commissionTotale, 0);
  const vendeurs = COMMISSIONS_MOCK.map(l => l.vendeur).filter((v, i, a) => a.indexOf(v) === i);

  // Stats par vendeur (toutes périodes)
  const statsParVendeur = vendeurs.map(v => ({
    vendeur: v,
    total: COMMISSIONS_MOCK.filter(l => l.vendeur === v).reduce((s, l) => s + l.commissionTotale, 0),
    commandes: COMMISSIONS_MOCK.filter(l => l.vendeur === v).map(l => l.orderId).filter((o, i, a) => a.indexOf(o) === i).length,
  })).sort((a, b) => b.total - a.total);

  const maxVendeur = statsParVendeur[0]?.total || 1;
  const meilleurVendeur = statsParVendeur[0];

  // Sélection
  const toggleSelection = (id: number) =>
    setSelectionnes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toutSelectionner = () =>
    setSelectionnes(selectionnes.length === lignesFiltrees.length ? [] : lignesFiltrees.map(l => l.id));

  const commissionsSelectionnees = COMMISSIONS_MOCK
    .filter(l => selectionnes.includes(l.id))
    .reduce((s, l) => s + l.commissionTotale, 0);

  // Export CSV
  const exportCSV = () => {
    const data = selectionnes.length > 0
      ? COMMISSIONS_MOCK.filter(l => selectionnes.includes(l.id))
      : lignesFiltrees;
    const headers = ['Order ID', 'Store Order', 'Date', 'Vendeur', 'Produit', 'Qté', 'Prix unitaire', 'Commission unitaire', 'Commission totale', 'Statut payout'];
    const rows = data.map(l => [l.orderId, l.storeOrderId, l.date, l.vendeur, `"${l.produit}"`, l.quantite, l.prixUnitaire.toFixed(2), l.commissionUnitaire.toFixed(2), l.commissionTotale.toFixed(2), l.statutPayout]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `commissions-evend-${periode}.csv`; a.click();
  };

  const ThTri = ({ col, label }: { col: string; label: string }) => (
    <th onClick={() => trier(col)} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' as const }}>
      {label} {triColonne === col ? (triSens === 'desc' ? '↓' : '↑') : <span style={{ opacity: 0.3 }}>↕</span>}
    </th>
  );

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1300px', backgroundColor: THEME.bg, minHeight: '100vh' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Commissions
          </h1>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
            Liste des commissions perçues par produit vendu
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {selectionnes.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: THEME.accentLight, border: `1px solid ${THEME.accent}`, borderRadius: '8px', padding: '8px 14px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: THEME.accent }}>{selectionnes.length} sélectionnée{selectionnes.length > 1 ? 's' : ''} · {commissionsSelectionnees.toFixed(2)} $</span>
              <button onClick={() => setSelectionnes([])} style={{ background: 'none', border: 'none', fontSize: '12px', color: THEME.accent, cursor: 'pointer', fontWeight: '700' }}>✕</button>
            </div>
          )}
          <button onClick={exportCSV} style={{ backgroundColor: 'white', color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '9px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📤 {selectionnes.length > 0 ? `Exporter sélection (${selectionnes.length})` : 'Export CSV'}
          </button>
          <button style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(45,106,159,0.3)' }}>
            💸 Lancer payout
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Total commissions', val: `${totalCommissions.toFixed(2)} $`, icon: '💰', c: THEME.accent, sous: `${lignesFiltrees.length} lignes` },
          { label: 'En attente payout', val: `${commissionsEnAttente.toFixed(2)} $`, icon: '⏳', c: THEME.warning, sous: `${lignesFiltrees.filter(l => l.statutPayout === 'en_attente').length} transactions` },
          { label: 'Déjà versées', val: `${commissionsVersees.toFixed(2)} $`, icon: '✅', c: THEME.success, sous: `${lignesFiltrees.filter(l => l.statutPayout === 'verse').length} transactions` },
          { label: 'Meilleur vendeur', val: meilleurVendeur?.vendeur ?? '—', icon: '🏆', c: THEME.purple, sous: `${meilleurVendeur?.total.toFixed(2) ?? '0'} $ total` },
        ].map((k, i) => (
          <div key={i} style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontSize: '22px', width: '44px', height: '44px', borderRadius: '10px', backgroundColor: k.c + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{k.icon}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: i === 3 ? '16px' : '22px', fontWeight: '900', color: THEME.text, margin: 0, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.val}</p>
              <p style={{ fontSize: '11px', fontWeight: '700', color: THEME.textLight, margin: '3px 0 1px 0' }}>{k.label}</p>
              <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>{k.sous}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', marginBottom: '20px' }}>

        {/* Filtres période */}
        <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>📅 Période & filtres</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Toggle période */}
            <div style={{ display: 'flex', backgroundColor: '#f0f2f5', borderRadius: '8px', padding: '3px', gap: '2px' }}>
              {[
                { val: 'ce_mois', label: 'Ce mois' },
                { val: 'mois_dernier', label: 'Mois dernier' },
                { val: 'tout', label: 'Tout' },
              ].map(p => (
                <button key={p.val} onClick={() => setPeriode(p.val as Periode)}
                  style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', backgroundColor: periode === p.val ? THEME.accent : 'transparent', color: periode === p.val ? 'white' : THEME.textLight, transition: 'all 0.15s' }}>
                  {p.label}
                </button>
              ))}
            </div>

            <select value={filtreVendeur} onChange={e => setFiltreVendeur(e.target.value)}
              style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', outline: 'none', backgroundColor: 'white', fontWeight: '600', cursor: 'pointer' }}>
              <option value="tous">Tous les vendeurs</option>
              {vendeurs.map(v => <option key={v} value={v}>{v}</option>)}
            </select>

            <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
              style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', outline: 'none', backgroundColor: 'white', fontWeight: '600', cursor: 'pointer' }}>
              <option value="tous">Tous les statuts</option>
              <option value="en_attente">⏳ En attente</option>
              <option value="verse">✅ Versé</option>
              <option value="rembourse">↩️ Remboursé</option>
            </select>

            <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="🔍 Produit, vendeur, order ID..."
              style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', outline: 'none', width: '200px', backgroundColor: 'white' }} />

            {(filtreVendeur !== 'tous' || filtreStatut !== 'tous' || recherche) && (
              <button onClick={() => { setFiltreVendeur('tous'); setFiltreStatut('tous'); setRecherche(''); }}
                style={{ background: 'none', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: THEME.textLight, cursor: 'pointer', fontWeight: '600' }}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Répartition par vendeur */}
        <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>📊 Répartition vendeurs</p>
          {statsParVendeur.map(sv => (
            <div key={sv.vendeur} style={{ marginBottom: '12px', cursor: 'pointer' }} onClick={() => setFiltreVendeur(filtreVendeur === sv.vendeur ? 'tous' : sv.vendeur)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: THEME.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: THEME.accent }}>
                    {sv.vendeur.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: filtreVendeur === sv.vendeur ? '800' : '600', color: filtreVendeur === sv.vendeur ? THEME.accent : THEME.text }}>{sv.vendeur}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: THEME.success }}>{sv.total.toFixed(2)} $</span>
              </div>
              <div style={{ backgroundColor: '#f0f0f0', borderRadius: '4px', height: '7px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: filtreVendeur === sv.vendeur ? THEME.accent : THEME.accent + '80', height: '100%', width: `${(sv.total / maxVendeur) * 100}%`, borderRadius: '4px', transition: 'width 0.4s ease' }} />
              </div>
              <p style={{ fontSize: '10px', color: '#aaa', margin: '2px 0 0 0' }}>{sv.commandes} commande{sv.commandes > 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tableau principal */}
      <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

        {/* Info sélection */}
        {selectionnes.length > 0 && (
          <div style={{ padding: '10px 20px', backgroundColor: THEME.accentLight, borderBottom: `1px solid ${THEME.accent}40`, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: THEME.accent }}>
              {selectionnes.length} ligne{selectionnes.length > 1 ? 's' : ''} sélectionnée{selectionnes.length > 1 ? 's' : ''} · Total : {commissionsSelectionnees.toFixed(2)} $
            </span>
            <button onClick={() => setSelectionnes([])} style={{ background: 'none', border: `1px solid ${THEME.accent}`, borderRadius: '6px', padding: '3px 10px', fontSize: '11px', color: THEME.accent, cursor: 'pointer', fontWeight: '700' }}>Désélectionner tout</button>
            <button onClick={exportCSV} style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}>📤 Exporter sélection</button>
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}` }}>
              <th style={{ padding: '12px 14px', width: '36px' }}>
                <input type="checkbox"
                  checked={selectionnes.length === lignesFiltrees.length && lignesFiltrees.length > 0}
                  onChange={toutSelectionner}
                  style={{ cursor: 'pointer', accentColor: THEME.accent }} />
              </th>
              <ThTri col="date" label="Order ID" />
              <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>Date</th>
              <ThTri col="vendeur" label="Vendeur" />
              <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>Produit</th>
              <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Qté</th>
              <ThTri col="montant" label="Prix unit." />
              <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Commission / unit.</th>
              <ThTri col="commission" label="Commission totale" />
              <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>Payout</th>
            </tr>
          </thead>
          <tbody>
            {lignesFiltrees.map((l, i) => {
              const statutCfg = STATUT_PAYOUT_CONFIG[l.statutPayout];
              const estSelectionne = selectionnes.includes(l.id);
              return (
                <tr key={l.id}
                  style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: estSelectionne ? THEME.accentLight : i % 2 === 0 ? 'white' : '#fafafa', transition: 'background-color 0.1s' }}
                  onMouseEnter={e => { if (!estSelectionne) (e.currentTarget as HTMLElement).style.backgroundColor = '#f5f9ff'; }}
                  onMouseLeave={e => { if (!estSelectionne) (e.currentTarget as HTMLElement).style.backgroundColor = i % 2 === 0 ? 'white' : '#fafafa'; }}
                >
                  <td style={{ padding: '14px 14px' }} onClick={() => toggleSelection(l.id)}>
                    <input type="checkbox" checked={estSelectionne} onChange={() => toggleSelection(l.id)} style={{ cursor: 'pointer', accentColor: THEME.accent }} />
                  </td>

                  {/* Order ID cliquable */}
                  <td style={{ padding: '14px 14px' }}>
                    <div>
                      <button
                        onClick={() => naviguerVers('commande-detail', { id: parseInt(l.orderId), storeOrderId: l.storeOrderId })}
                        style={{ background: 'none', border: 'none', fontSize: '12px', fontWeight: '700', color: THEME.accent, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                        {l.orderId}
                      </button>
                      <p style={{ fontSize: '10px', color: '#aaa', margin: '2px 0 0 0' }}>{l.storeOrderId}</p>
                    </div>
                  </td>

                  <td style={{ padding: '14px 14px' }}>
                    <span style={{ fontSize: '12px', color: THEME.textLight, whiteSpace: 'nowrap' }}>{l.date.split(' ')[0]}</span>
                  </td>

                  {/* Vendeur cliquable */}
                  <td style={{ padding: '14px 14px' }}>
                    <button
                      onClick={() => setFiltreVendeur(filtreVendeur === l.vendeur ? 'tous' : l.vendeur)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: THEME.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: THEME.accent, flexShrink: 0 }}>
                          {l.vendeur.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: '700', color: THEME.text, margin: 0 }}>{l.vendeur}</p>
                          <p style={{ fontSize: '10px', color: '#aaa', margin: 0 }}>{l.boutique}</p>
                        </div>
                      </div>
                    </button>
                  </td>

                  {/* Produit */}
                  <td style={{ padding: '14px 14px', maxWidth: '220px' }}>
                    <p style={{ fontSize: '12px', color: THEME.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.produit}>
                      {l.produit}
                    </p>
                  </td>

                  {/* Quantité */}
                  <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: l.quantite > 10 ? THEME.accent : THEME.text, backgroundColor: l.quantite > 10 ? THEME.accentLight : 'transparent', padding: l.quantite > 10 ? '2px 8px' : '0', borderRadius: '20px' }}>
                      {l.quantite}
                    </span>
                  </td>

                  {/* Prix unitaire */}
                  <td style={{ padding: '14px 14px' }}>
                    <span style={{ fontSize: '13px', color: THEME.textLight }}>{l.prixUnitaire.toFixed(2)} $</span>
                  </td>

                  {/* Commission unitaire */}
                  <td style={{ padding: '14px 14px', textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', color: THEME.textLight }}>{l.commissionUnitaire.toFixed(2)} $</span>
                  </td>

                  {/* Commission totale — mise en valeur */}
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '900', color: l.commissionTotale >= 10 ? THEME.success : THEME.text }}>
                        {l.commissionTotale.toFixed(2)} $
                      </span>
                      {l.commissionTotale >= 10 && (
                        <span style={{ fontSize: '10px', backgroundColor: '#dcfce7', color: THEME.success, borderRadius: '10px', padding: '1px 6px', fontWeight: '700' }}>
                          ★
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Statut payout */}
                  <td style={{ padding: '14px 14px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', backgroundColor: statutCfg.bg, color: statutCfg.color, whiteSpace: 'nowrap' as const }}>
                        {statutCfg.icon} {statutCfg.label}
                      </span>
                      {l.datePayout && (
                        <p style={{ fontSize: '10px', color: '#aaa', margin: '3px 0 0 0' }}>le {l.datePayout}</p>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Ligne totaux */}
          {lignesFiltrees.length > 0 && (
            <tfoot>
              <tr style={{ backgroundColor: '#f0f7ff', borderTop: `2px solid ${THEME.accent}` }}>
                <td colSpan={5} style={{ padding: '14px 14px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: THEME.accent, textTransform: 'uppercase' }}>
                    TOTAL — {lignesFiltrees.length} ligne{lignesFiltrees.length > 1 ? 's' : ''}
                  </span>
                </td>
                <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: THEME.accent }}>
                    {lignesFiltrees.reduce((s, l) => s + l.quantite, 0)}
                  </span>
                </td>
                <td style={{ padding: '14px 14px' }} />
                <td style={{ padding: '14px 14px' }} />
                <td style={{ padding: '14px 14px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: THEME.success }}>
                    {totalCommissions.toFixed(2)} $
                  </span>
                </td>
                <td style={{ padding: '14px 14px' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: THEME.warning, fontWeight: '700', margin: '0 0 2px 0' }}>⏳ {commissionsEnAttente.toFixed(2)} $ en attente</p>
                    <p style={{ fontSize: '11px', color: THEME.success, fontWeight: '700', margin: 0 }}>✅ {commissionsVersees.toFixed(2)} $ versées</p>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>

        {lignesFiltrees.length === 0 && (
          <div style={{ padding: '50px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.25 }}>💰</div>
            <p style={{ fontSize: '14px', color: THEME.textLight, fontWeight: '600', margin: 0 }}>Aucune commission trouvée</p>
            <p style={{ fontSize: '12px', color: '#aaa', margin: '6px 0 0 0' }}>Ajustez vos filtres ou changez de période.</p>
          </div>
        )}
      </div>

      {/* Note bas */}
      <div style={{ marginTop: '16px', backgroundColor: THEME.accentLight, borderRadius: '8px', padding: '12px 16px', border: `1px solid ${THEME.accent}40`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>ℹ️</span>
        <p style={{ fontSize: '12px', color: THEME.accent, margin: 0, fontWeight: '600' }}>
          Les commissions sont calculées automatiquement selon le taux défini dans le plan d'adhésion du vendeur. Cliquez sur un Order ID pour voir le détail de la commande. Cliquez sur un vendeur pour filtrer ses commissions.
        </p>
      </div>
    </div>
  );
}
