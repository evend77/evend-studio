import React, { useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type MethodePaiement = 'stripe' | 'paypal' | 'manuel';
type StatutTransaction = 'success' | 'pending' | 'failed' | 'refunded';

interface Transaction {
  id: number;
  orderId: number;
  type: string;
  montant: number;
  methode: MethodePaiement;
  chargeId: string;
  statut: StatutTransaction;
  info: string;
  date: string;
}

interface PaiementVendeur {
  sellerId: number;
  nom: string;
  boutique: string;
  email: string;
  methodePaiement: MethodePaiement;
  compteStripe?: string;
  comptePaypal?: string;
  totalGagne: number;
  totalCashable: number;
  totalPaye: number;
  totalDu: number;
  transactions: Transaction[];
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const PAIEMENTS_MOCK: PaiementVendeur[] = [
  {
    sellerId: 2740640, nom: 'Alex Bosse', boutique: 'Idée-cadeau',
    email: 'alex.bosse@hotmail.com', methodePaiement: 'stripe',
    compteStripe: 'acct_1ABC123DEF',
    totalGagne: 28.70, totalCashable: 0.00, totalPaye: 29.90, totalDu: -1.20,
    transactions: [
      { id: 1273679, orderId: 13629869, type: 'Admin to Seller', montant: 8.50,  methode: 'stripe', chargeId: 'ch_3ABC', statut: 'success', info: 'Paiement commande #13629869 via Stripe SCA', date: '2026-01-15 01:12' },
      { id: 1273590, orderId: 13629778, type: 'Admin to Seller', montant: 8.50,  methode: 'stripe', chargeId: 'ch_3DEF', statut: 'success', info: 'Paiement commande #13629778 via Stripe SCA', date: '2026-01-15 12:58' },
      { id: 1273166, orderId: 13629371, type: 'Admin to Seller', montant: 8.50,  methode: 'stripe', chargeId: 'ch_3GHI', statut: 'success', info: 'Paiement commande #13629371 via Stripe SCA', date: '2026-01-15 12:05' },
      { id: 693845,  orderId: 13084573, type: 'Admin to Seller', montant: 4.40,  methode: 'stripe', chargeId: 'ch_3JKL', statut: 'success', info: 'Paiement commande #13084573 via Stripe SCA', date: '2025-10-30 08:45' },
    ],
  },
  {
    sellerId: 2741436, nom: 'Vic Sparky', boutique: "Mom's World",
    email: 'sparky_lee15@hotmail.com', methodePaiement: 'paypal',
    comptePaypal: 'sparky_lee15@hotmail.com',
    totalGagne: 20.90, totalCashable: 0.00, totalPaye: 22.40, totalDu: -1.50,
    transactions: [
      { id: 1280001, orderId: 13700001, type: 'Admin to Seller', montant: 12.40, methode: 'paypal', chargeId: 'N/A', statut: 'success', info: 'Paiement commande #13700001 via PayPal Platform', date: '2026-02-01 09:30' },
      { id: 1280002, orderId: 13700002, type: 'Admin to Seller', montant: 10.00, methode: 'paypal', chargeId: 'N/A', statut: 'pending', info: 'Paiement en attente — vérification PayPal', date: '2026-02-10 14:20' },
    ],
  },
  {
    sellerId: 2775188, nom: 'Roland Grondin', boutique: 'Grondin',
    email: 'rolandgavaliagrondin6799@gmail.com', methodePaiement: 'stripe',
    compteStripe: 'acct_2XYZ789GHI',
    totalGagne: 145.00, totalCashable: 45.00, totalPaye: 100.00, totalDu: 45.00,
    transactions: [
      { id: 1290001, orderId: 13800001, type: 'Admin to Seller', montant: 50.00, methode: 'stripe', chargeId: 'ch_4MNO', statut: 'success', info: 'Paiement commande #13800001 via Stripe SCA', date: '2026-01-20 10:00' },
      { id: 1290002, orderId: 13800002, type: 'Admin to Seller', montant: 50.00, methode: 'stripe', chargeId: 'ch_4PQR', statut: 'success', info: 'Paiement commande #13800002 via Stripe SCA', date: '2026-02-05 11:30' },
      { id: 1290003, orderId: 13800003, type: 'Admin to Seller', montant: 45.00, methode: 'stripe', chargeId: 'N/A',    statut: 'pending', info: 'Paiement en attente — traitement automatique', date: '2026-02-15 08:00' },
    ],
  },
  {
    sellerId: 2742743, nom: 'Edgard Rivadeneira', boutique: 'Edgard Store',
    email: 'banlita@hotmail.com', methodePaiement: 'manuel',
    totalGagne: 89.50, totalCashable: 0.00, totalPaye: 89.50, totalDu: 0.00,
    transactions: [
      { id: 1300001, orderId: 13900001, type: 'Admin to Seller', montant: 45.00, methode: 'manuel', chargeId: 'N/A', statut: 'success', info: 'Virement e-transfert manuel approuvé', date: '2026-01-25 14:00' },
      { id: 1300002, orderId: 13900002, type: 'Admin to Seller', montant: 44.50, methode: 'manuel', chargeId: 'N/A', statut: 'success', info: 'Virement e-transfert manuel approuvé', date: '2026-02-08 09:15' },
    ],
  },
  {
    sellerId: 2742751, nom: 'Gary Brennan', boutique: 'Gary Store',
    email: 'gbrennan16@hotmail.com', methodePaiement: 'stripe',
    compteStripe: 'acct_3LMN456OPQ',
    totalGagne: 210.00, totalCashable: 60.00, totalPaye: 150.00, totalDu: 60.00,
    transactions: [
      { id: 1310001, orderId: 14000001, type: 'Admin to Seller', montant: 75.00,  methode: 'stripe', chargeId: 'ch_5STU', statut: 'success', info: 'Paiement commande #14000001 via Stripe SCA', date: '2026-01-10 10:00' },
      { id: 1310002, orderId: 14000002, type: 'Admin to Seller', montant: 75.00,  methode: 'stripe', chargeId: 'ch_5VWX', statut: 'success', info: 'Paiement commande #14000002 via Stripe SCA', date: '2026-01-28 15:30' },
      { id: 1310003, orderId: 14000003, type: 'Admin to Seller', montant: 60.00,  methode: 'stripe', chargeId: 'N/A',    statut: 'pending', info: 'Paiement automatique en cours...', date: '2026-02-18 07:00' },
      { id: 1310004, orderId: 14000004, type: 'Admin to Seller', montant: 20.00,  methode: 'stripe', chargeId: 'ch_5YZA', statut: 'failed',  info: 'Échec — compte Stripe non vérifié', date: '2026-02-20 09:00' },
    ],
  },
];

// ── Thème ─────────────────────────────────────────────────────────────────────
const T = {
  accent: '#2d6a9f', accentLight: '#e8f2fb',
  bg: '#f0f2f5', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  success: '#16a34a', warning: '#d97706', danger: '#dc2626',
  orange: '#ea580c', stripe: '#635bff', paypal: '#003087',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return (n < 0 ? '-' : '') + Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' $';
}

function MethodeBadge({ m }: { m: MethodePaiement }) {
  const map = {
    stripe: { bg: '#ede9fe', color: T.stripe,  label: '⚡ Stripe Connect'   },
    paypal: { bg: '#dbeafe', color: T.paypal,  label: '🅿 PayPal Platform'  },
    manuel: { bg: '#f3f4f6', color: '#374151', label: '🏦 Manuel'           },
  };
  const s = map[m];
  return <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' as const }}>{s.label}</span>;
}

function StatutBadge({ s }: { s: StatutTransaction }) {
  const map = {
    success:  { bg: '#dcfce7', color: T.success,  label: '✅ Complété'    },
    pending:  { bg: '#fef9c3', color: '#92400e',  label: '⏳ En attente'  },
    failed:   { bg: '#fee2e2', color: T.danger,   label: '❌ Échoué'      },
    refunded: { bg: '#f3f4f6', color: '#6b7280',  label: '↩ Remboursé'   },
  };
  const v = map[s];
  return <span style={{ backgroundColor: v.bg, color: v.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' as const }}>{v.label}</span>;
}

function DuBadge({ montant }: { montant: number }) {
  if (montant > 0)  return <span style={{ color: T.danger,  fontWeight: '800', fontSize: '13px' }}>↑ {fmt(montant)}</span>;
  if (montant < 0)  return <span style={{ color: T.success, fontWeight: '800', fontSize: '13px' }}>✓ {fmt(montant)}</span>;
  return <span style={{ color: T.textLight, fontWeight: '700', fontSize: '13px' }}>— 0.00 $</span>;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success'|'info'|'danger' }) {
  const bg = { success: T.success, info: T.accent, danger: T.danger }[type];
  return (
    <div style={{ position: 'fixed', top: '24px', right: '24px', backgroundColor: bg, color: 'white', padding: '14px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', maxWidth: '400px', lineHeight: '1.5' }}>
      {msg}
    </div>
  );
}

// ── Modal Détail Vendeur ──────────────────────────────────────────────────────
function ModalDetailVendeur({
  vendeur,
  onPayer,
  onEnvoyerRecu,
  onFermer,
}: {
  vendeur: PaiementVendeur;
  onPayer: () => void;
  onEnvoyerRecu: () => void;
  onFermer: () => void;
}) {
  const [onglet, setOnglet]           = useState<'payouts' | 'all'>('payouts');
  const [rechercheTx, setRechercheTx] = useState('');
  const [txDetail, setTxDetail]       = useState<Transaction | null>(null);

  const txFiltrees = vendeur.transactions.filter(tx => {
    const s = rechercheTx.toLowerCase();
    return !s || String(tx.id).includes(s) || String(tx.orderId).includes(s) || tx.info.toLowerCase().includes(s);
  });

  const payouts = txFiltrees.filter(tx => tx.statut === 'success');
  const all     = txFiltrees;

  const liste = onglet === 'payouts' ? payouts : all;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onFermer()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🏪</div>
              <div>
                <p style={{ fontSize: '17px', fontWeight: '900', margin: 0 }}>Seller Payment Details</p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>{vendeur.boutique} · {vendeur.email}</p>
              </div>
            </div>
            <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>

          {/* Seller Details */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px' }}>
            {[
              { label: 'Seller Name',     val: vendeur.nom      },
              { label: 'Seller Store',    val: vendeur.boutique },
              { label: 'Seller Email',    val: vendeur.email    },
              { label: 'Payment Method', val: <MethodeBadge m={vendeur.methodePaiement} /> },
              ...(vendeur.compteStripe  ? [{ label: 'Stripe Account', val: <span style={{ fontFamily: 'monospace', fontSize: '11px', opacity: 0.85 }}>{vendeur.compteStripe}</span> }] : []),
              ...(vendeur.comptePaypal  ? [{ label: 'PayPal Account', val: <span style={{ opacity: 0.85 }}>{vendeur.comptePaypal}</span> }] : []),
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ opacity: 0.6, minWidth: '110px' }}>{r.label} :</span>
                <span style={{ fontWeight: '600' }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* All Payment Details */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>All Payment Details</h4>
            <div style={{ border: `1px solid ${T.border}`, borderRadius: '10px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: `1px solid ${T.border}` }}>
                    {['Total Earned', 'Total Cashable', 'Total Paid', 'Total Due', 'Action'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: T.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '14px', fontSize: '14px', fontWeight: '700', color: T.text }}>{fmt(vendeur.totalGagne)}</td>
                    <td style={{ padding: '14px', fontSize: '14px', fontWeight: '700', color: vendeur.totalCashable > 0 ? T.success : T.textLight }}>{fmt(vendeur.totalCashable)}</td>
                    <td style={{ padding: '14px', fontSize: '14px', fontWeight: '700', color: T.text }}>{fmt(vendeur.totalPaye)}</td>
                    <td style={{ padding: '14px' }}><DuBadge montant={vendeur.totalDu} /></td>
                    <td style={{ padding: '14px' }}>
                      {vendeur.totalDu > 0 ? (
                        <button onClick={onPayer}
                          style={{ backgroundColor: T.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          💸 Pay {fmt(vendeur.totalDu)}
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: T.textLight, fontStyle: 'italic' }}>Aucun montant dû</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Note auto payout */}
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', color: '#1d4ed8', margin: 0 }}>
              ℹ️ <strong>Auto Payout :</strong> Les paiements pour commandes "Fulfilled" ou "Delivered" sont traités automatiquement toutes les 4 heures via Stripe Connect / PayPal Platform.
            </p>
          </div>

          {/* Transaction Details */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Transaction Details</h4>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px' }}>🔍</span>
                <input type="text" value={rechercheTx} onChange={e => setRechercheTx(e.target.value)}
                  placeholder="ID, commande..."
                  style={{ border: `1px solid ${T.border}`, borderRadius: '7px', padding: '6px 10px 6px 24px', fontSize: '12px', outline: 'none', width: '180px' }} />
              </div>
            </div>

            {/* Onglets */}
            <div style={{ display: 'flex', gap: '2px', marginBottom: '12px', borderBottom: `2px solid ${T.border}` }}>
              {[{ id: 'payouts', label: `Payouts (${payouts.length})` }, { id: 'all', label: `All transactions (${all.length})` }].map(o => (
                <button key={o.id} onClick={() => setOnglet(o.id as any)}
                  style={{ padding: '8px 16px', border: 'none', borderBottom: onglet === o.id ? `2px solid ${T.accent}` : '2px solid transparent', marginBottom: '-2px', backgroundColor: 'transparent', color: onglet === o.id ? T.accent : T.textLight, fontSize: '12px', fontWeight: onglet === o.id ? '700' : '400', cursor: 'pointer' }}>
                  {o.label}
                </button>
              ))}
            </div>

            {/* Tableau transactions */}
            <div style={{ border: `1px solid ${T.border}`, borderRadius: '10px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: `1px solid ${T.border}` }}>
                    {['ID', 'Order ID', 'Type', 'Montant', 'Via', 'Statut', 'Date', 'Action'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: T.accent, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {liste.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: T.textLight, fontSize: '13px' }}>Aucune transaction</td></tr>
                  ) : liste.map((tx, i) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '10px 12px', fontSize: '11px', fontFamily: 'monospace', fontWeight: '700', color: T.accent }}>#{tx.id}</td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', color: T.accent, fontWeight: '600' }}>#{tx.orderId}</td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', color: T.textLight }}>{tx.type}</td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '800', color: T.success }}>{fmt(tx.montant)}</td>
                      <td style={{ padding: '10px 12px' }}><MethodeBadge m={tx.methode} /></td>
                      <td style={{ padding: '10px 12px' }}><StatutBadge s={tx.statut} /></td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', color: T.textLight, whiteSpace: 'nowrap' as const }}>{tx.date}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => setTxDetail(tx)}
                          style={{ backgroundColor: T.accentLight, color: T.accent, border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                          👁 Détail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <button onClick={onEnvoyerRecu}
            style={{ backgroundColor: 'white', color: T.accent, border: `1px solid ${T.accent}`, borderRadius: '8px', padding: '9px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            📧 Envoyer reçu au vendeur
          </button>
          <button onClick={onFermer}
            style={{ backgroundColor: 'white', color: T.text, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '9px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            Fermer
          </button>
        </div>
      </div>

      {/* Sous-modale détail transaction */}
      {txDetail && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}
          onClick={e => e.target === e.currentTarget && setTxDetail(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', width: '100%', maxWidth: '440px', boxShadow: '0 16px 48px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: `2px solid ${T.accent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '900', color: T.text, margin: 0 }}>Payout Transaction ID: #{txDetail.id}</p>
                <p style={{ fontSize: '11px', color: T.textLight, margin: '2px 0 0 0' }}>Order #{txDetail.orderId}</p>
              </div>
              <button onClick={() => setTxDetail(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: T.textLight }}>✕</button>
            </div>
            <div style={{ padding: '20px' }}>
              {[
                { label: 'Transaction ID',  val: `#${txDetail.id}` },
                { label: 'Order ID',        val: `#${txDetail.orderId}` },
                { label: 'Type',            val: txDetail.type },
                { label: 'Montant',         val: <span style={{ fontWeight: '800', color: T.success }}>{fmt(txDetail.montant)}</span> },
                { label: 'Méthode',         val: <MethodeBadge m={txDetail.methode} /> },
                { label: 'Charge ID',       val: <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{txDetail.chargeId}</span> },
                { label: 'Statut',          val: <StatutBadge s={txDetail.statut} /> },
                { label: 'Date',            val: txDetail.date },
                { label: 'Info',            val: <span style={{ fontSize: '11px', lineHeight: '1.5', display: 'block' }}>{txDetail.info}</span> },
              ].map((r, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <span style={{ fontSize: '12px', color: T.textLight, fontWeight: '600' }}>{r.label}</span>
                  <span style={{ fontSize: '12px', color: T.text }}>{r.val}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setTxDetail(null)}
                style={{ backgroundColor: T.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
interface PaiementsVendeursProps {
  naviguerVers: (page: string, data?: any) => void;
}

export default function PaiementsVendeurs({ naviguerVers }: PaiementsVendeursProps) {
  const [recherche,      setRecherche]      = useState('');
  const [filtreMethode,  setFiltreMethode]  = useState('tous');
  const [filtreStatut,   setFiltreStatut]   = useState('tous');
  const [vendeurOuvert,  setVendeurOuvert]  = useState<PaiementVendeur | null>(null);
  const [toast,          setToast]          = useState<{ msg: string; type: 'success'|'info'|'danger' } | null>(null);

  const showToast = (msg: string, type: 'success'|'info'|'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handlePayer = (v: PaiementVendeur) => {
    setVendeurOuvert(null);
    showToast(`💸 Paiement de ${fmt(v.totalDu)} initié pour ${v.boutique} via ${v.methodePaiement === 'stripe' ? 'Stripe Connect' : 'PayPal Platform'}.`, 'success');
  };

  const handleRecu = (v: PaiementVendeur) => {
    showToast(`📧 Reçu de paiement envoyé à ${v.email}.`, 'info');
  };

  // Statut global d'un vendeur basé sur ses transactions
  const statutVendeur = (v: PaiementVendeur) => {
    const hasFailed  = v.transactions.some(tx => tx.statut === 'failed');
    const hasPending = v.transactions.some(tx => tx.statut === 'pending');
    if (hasFailed)  return 'failed';
    if (hasPending) return 'pending';
    return 'success';
  };

  const filtres = PAIEMENTS_MOCK.filter(v => {
    const s = recherche.toLowerCase();
    const inSearch = !s || v.boutique.toLowerCase().includes(s) || v.nom.toLowerCase().includes(s) || String(v.sellerId).includes(s);
    const inMethode = filtreMethode === 'tous' || v.methodePaiement === filtreMethode;
    const sv = statutVendeur(v);
    const inStatut  = filtreStatut  === 'tous' || sv === filtreStatut;
    return inSearch && inMethode && inStatut;
  });

  // Totaux globaux
  const totalGagne  = PAIEMENTS_MOCK.reduce((s, v) => s + v.totalGagne, 0);
  const totalPaye   = PAIEMENTS_MOCK.reduce((s, v) => s + v.totalPaye, 0);
  const totalDu     = PAIEMENTS_MOCK.reduce((s, v) => s + (v.totalDu > 0 ? v.totalDu : 0), 0);
  const nbEnAttente = PAIEMENTS_MOCK.filter(v => v.transactions.some(tx => tx.statut === 'pending')).length;

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${T.border}`, borderRadius: '8px', padding: '8px 12px',
    fontSize: '12px', outline: 'none', backgroundColor: 'white', cursor: 'pointer',
  };

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {vendeurOuvert && (
        <ModalDetailVendeur
          vendeur={vendeurOuvert}
          onPayer={() => handlePayer(vendeurOuvert)}
          onEnvoyerRecu={() => handleRecu(vendeurOuvert)}
          onFermer={() => setVendeurOuvert(null)}
        />
      )}

      <div style={{ padding: '24px 28px', backgroundColor: T.bg, minHeight: '100vh' }}>

        {/* En-tête */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: T.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Paiements vendeurs
          </h1>
          <p style={{ fontSize: '13px', color: T.textLight, margin: 0 }}>
            Finances · Suivi des versements Stripe Connect & PayPal Platform
          </p>
        </div>

        {/* Notice */}
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', color: '#92400e', margin: '0 0 4px 0', fontWeight: '700' }}>📌 Notice :</p>
          <p style={{ fontSize: '12px', color: '#78350f', margin: 0, lineHeight: '1.6' }}>
            <strong>Total Earned</strong> — revenus du vendeur (hors commission). &nbsp;
            <strong>Commission</strong> — montant revenant à e-Vend. &nbsp;
            <strong>Total Paid</strong> — montant déjà versé au vendeur. &nbsp;
            <strong>Total Due</strong> — montant encore à verser (positif = on doit, négatif = trop payé).
          </p>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Total gagné vendeurs', val: fmt(totalGagne),  icon: '💰', c: T.success, sous: 'Toutes boutiques'       },
            { label: 'Total versé',          val: fmt(totalPaye),   icon: '💸', c: T.accent,  sous: 'Stripe + PayPal + manuel' },
            { label: 'Montant restant dû',   val: fmt(totalDu),     icon: '⏳', c: T.warning, sous: 'À verser aux vendeurs'  },
            { label: 'En attente traitement',val: nbEnAttente,       icon: '🔄', c: T.orange,  sous: 'Transactions en cours' },
          ].map((k, i) => (
            <div key={i} style={{ backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ fontSize: '18px', width: '36px', height: '36px', borderRadius: '8px', backgroundColor: k.c + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{k.icon}</div>
                <p style={{ fontSize: '20px', fontWeight: '900', color: T.text, margin: 0 }}>{k.val}</p>
              </div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, margin: '0 0 1px 0' }}>{k.label}</p>
              <p style={{ fontSize: '10px', color: '#aaa', margin: 0 }}>{k.sous}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' as const }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px' }}>🔍</span>
            <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher par boutique, nom ou ID vendeur..."
              style={{ ...inputStyle, width: '100%', paddingLeft: '30px', boxSizing: 'border-box' as const, cursor: 'text' }} />
          </div>

          <select value={filtreMethode} onChange={e => setFiltreMethode(e.target.value)} style={inputStyle}>
            <option value="tous">Toutes méthodes</option>
            <option value="stripe">⚡ Stripe Connect</option>
            <option value="paypal">🅿 PayPal Platform</option>
            <option value="manuel">🏦 Manuel</option>
          </select>

          <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} style={inputStyle}>
            <option value="tous">Tous statuts</option>
            <option value="success">✅ Complété</option>
            <option value="pending">⏳ En attente</option>
            <option value="failed">❌ Échec</option>
          </select>

          {(recherche || filtreMethode !== 'tous' || filtreStatut !== 'tous') && (
            <button onClick={() => { setRecherche(''); setFiltreMethode('tous'); setFiltreStatut('tous'); }}
              style={{ ...inputStyle, fontWeight: '600', color: T.textLight }}>
              ✕ Reset
            </button>
          )}

          <p style={{ fontSize: '12px', color: T.textLight, margin: 0, marginLeft: 'auto', whiteSpace: 'nowrap' as const }}>
            <strong>{filtres.length}</strong> / {PAIEMENTS_MOCK.length} vendeurs
          </p>
        </div>

        {/* Tableau principal */}
        <div style={{ backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '860px' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}`, backgroundColor: '#f8fafc' }}>
                  {['Seller ID', 'Vendeur / Boutique', 'Méthode', 'Total Earned', 'Commission', 'Total Paid', 'Total Due', 'Statut', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: T.accent, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' as const }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtres.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: T.textLight }}>🔍 Aucun résultat</td></tr>
                ) : filtres.map((v, i) => {
                  const sv = statutVendeur(v);
                  const commission = v.totalPaye - v.totalGagne;
                  return (
                    <tr key={v.sellerId}
                      style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f0f7ff'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = i % 2 === 0 ? 'white' : '#fafafa'}>

                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '12px', fontWeight: '700', color: T.accent }}>
                        {v.sellerId}
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: T.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🏪</div>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: '700', color: T.text, margin: 0 }}>{v.boutique}</p>
                            <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>{v.nom}</p>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px' }}><MethodeBadge m={v.methodePaiement} /></td>

                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700', color: T.success }}>{fmt(v.totalGagne)}</td>

                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: T.accent }}>{fmt(Math.abs(commission))}</td>

                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700', color: T.text }}>{fmt(v.totalPaye)}</td>

                      <td style={{ padding: '12px 14px' }}><DuBadge montant={v.totalDu} /></td>

                      <td style={{ padding: '12px 14px' }}>
                        {sv === 'failed'  && <span style={{ backgroundColor: '#fee2e2', color: T.danger,  padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>❌ Échec</span>}
                        {sv === 'pending' && <span style={{ backgroundColor: '#fef9c3', color: '#92400e', padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>⏳ En cours</span>}
                        {sv === 'success' && <span style={{ backgroundColor: '#dcfce7', color: T.success, padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>✅ OK</span>}
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <button onClick={() => setVendeurOuvert(v)}
                          style={{ backgroundColor: T.accent, color: 'white', border: 'none', borderRadius: '7px', padding: '7px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                          👁 Voir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Pied de tableau — sum of total due */}
              <tfoot>
                <tr style={{ borderTop: `2px solid ${T.border}`, backgroundColor: '#fafafa' }}>
                  <td colSpan={6} style={{ padding: '12px 14px', textAlign: 'right', fontSize: '12px', fontWeight: '700', color: T.textLight }}>
                    SUM OF TOTAL DUE :
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '900', color: totalDu > 0 ? T.danger : T.success }}>
                      {fmt(PAIEMENTS_MOCK.reduce((s, v) => s + v.totalDu, 0))}
                    </span>
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}
