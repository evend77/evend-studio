import React, { useState, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Commission {
  id: number;
  commande_id: number;
  no_commande: string;
  no_commande_evend: string;
  date_commande: string;
  produit_id: number;
  produit_nom: string;
  quantite: number;
  prix_unitaire: number;
  commission_unitaire: number;
  commission_totale_produit: number;
  commission_totale_admin: number;
  commission_fixe: number;
  montant_commission: number;
  montant_vendeur: number;
  statut: string;
  rembourse: boolean;
  raison_remboursement: string | null;
  taux_commission: number;
  devise: string;
  created_at: string;
  stripe_transfer_id: string | null;
}

interface StripeTransfer {
  stripe_transfer_id: string;
  vendeur_id: number;
  commande_id: string;
  montant: number;
  devise: string;
  destination_account: string;
  statut: string;
  created_at: string;
}

interface StripePayout {
  stripe_payout_id: string;
  vendeur_id: number;
  montant: number;
  devise: string;
  methode: string;
  date_arrivee: string;
  statut: string;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total_ventes: number;
  total_commission: number;
  total_paye: number;
  total_due: number;
  nb_commissions: number;
  nb_transferts: number;
  nb_payouts: number;
}

interface PaiementsData {
  stats: Stats;
  commissions: Commission[];
  stripe_transfers: StripeTransfer[];
  stripe_payouts: StripePayout[];
}

// ✅ CORRIGÉ : URL fixe ou variable d'env (selon ton build)
const API_BASE = 'https://evend-multivendeur-api.onrender.com';

const THEME = {
  accent:      '#1a472a',
  accentLight: '#e8f5e9',
  accentDark:  '#0f3b2a',
  bg:          '#f4f6f8',
  card:        '#ffffff',
  border:      '#e9ecef',
  text:        '#1a2332',
  textLight:   '#6b7280',
  danger:      '#dc2626',
  dangerBg:    '#fef2f2',
  success:     '#16a34a',
  successBg:   '#e9f7ef',
  warning:     '#d97706',
  warningBg:   '#fff8e1',
  purple:      '#7c3aed',
  orange:      '#ea580c',
  blue:        '#3b82f6',
  blueBg:      '#eff6ff',
};

function getToken(): string | null {
  return localStorage.getItem('token');
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('fr-CA', { hour12: false });
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-CA');
}

function formatMontant(montant: number, devise: string = 'CAD'): string {
  if (montant === undefined || montant === null) return '—';
  return `${montant.toFixed(2)} ${devise}`;
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
      fontWeight: '600', color, background: bg, whiteSpace: 'nowrap' as const,
    }}>{label}</span>
  );
}

function statutBadge(statut: string, rembourse?: boolean) {
  if (rembourse) return <Badge label="↩️ Remboursé" color="#6b7280" bg="#f3f4f6" />;
  switch (statut) {
    case 'paye':
    case 'paid':
    case 'succeeded':
      return <Badge label="✅ Payé" color="#16a34a" bg="#e9f7ef" />;
    case 'en_attente':
    case 'pending':
      return <Badge label="⏳ En attente" color="#d97706" bg="#fff8e1" />;
    case 'echoue':
    case 'failed':
      return <Badge label="❌ Échoué" color="#dc2626" bg="#fef2f2" />;
    default:
      return <Badge label={statut} color="#6b7280" bg="#f3f4f6" />;
  }
}

const spinnerStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  margin: '0 auto',
  border: `3px solid ${THEME.border}`,
  borderTop: `3px solid ${THEME.accent}`,
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

const spinnerCSS = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @media (max-width: 768px) {
    .mobile-menu-btn { display: block !important; }
    .mobile-menu-content { display: none; }
    .mobile-menu-content.open { display: flex !important; flex-direction: column; width: 100%; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────
export default function PaiementsCommissions() {
  const [onglet, setOnglet] = useState<'commissions' | 'transferts' | 'payouts'>('commissions');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [data, setData] = useState<PaiementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendeurId, setVendeurId] = useState<number | null>(null);

  // Récupérer l'ID du vendeur
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setVendeurId(user.id);
      }
    } catch (err) {
      console.error('Erreur lecture vendeur:', err);
      setError('Impossible de récupérer vos informations');
    }
  }, []);

  // Charger les données
  useEffect(() => {
    if (!vendeurId) return;

    const chargerDonnees = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/api/vendeurs/${vendeurId}/paiements`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Erreur chargement des données');
        }

        const result = await response.json();
        setData(result);
      } catch (err: any) {
        console.error('Erreur chargement:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    chargerDonnees();
  }, [vendeurId]);

  // Filtrer les données selon recherche
  const commissionsFiltrees = data?.commissions.filter(c =>
    recherche === '' ||
    c.no_commande?.includes(recherche) ||
    c.produit_nom?.toLowerCase().includes(recherche.toLowerCase()) ||
    c.no_commande_evend?.includes(recherche)
  ) || [];

  const transfertsFiltres = data?.stripe_transfers.filter(t =>
    recherche === '' ||
    t.stripe_transfer_id?.toLowerCase().includes(recherche.toLowerCase()) ||
    t.commande_id?.includes(recherche)
  ) || [];

  const payoutsFiltres = data?.stripe_payouts.filter(p =>
    recherche === '' ||
    p.stripe_payout_id?.toLowerCase().includes(recherche.toLowerCase())
  ) || [];

  // KPI cards
  const kpiCards = [
    { label: 'TOTAL VENTES', valeur: data?.stats.total_ventes || 0, icon: '💰', color: THEME.accent, bg: THEME.accentLight },
    { label: 'COMMISSIONS', valeur: data?.stats.total_commission || 0, icon: '💸', color: THEME.warning, bg: THEME.warningBg },
    { label: 'PAYÉ', valeur: data?.stats.total_paye || 0, icon: '💳', color: THEME.success, bg: THEME.successBg },
    { label: 'À RECEVOIR', valeur: data?.stats.total_due || 0, icon: '⏳', color: THEME.blue, bg: THEME.blueBg },
  ];

  const tabs = [
    { key: 'commissions' as const, label: '💰 Commissions', icon: '💰', count: data?.stats.nb_commissions },
    { key: 'transferts' as const, label: '💸 Transferts Stripe', icon: '💸', count: data?.stats.nb_transferts },
    { key: 'payouts' as const, label: '🏦 Payouts Stripe', icon: '🏦', count: data?.stats.nb_payouts },
  ];

  if (loading) {
    return (
      <div style={{ background: THEME.bg, minHeight: '100vh', paddingTop: '80px' }}>
        <style>{spinnerCSS}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={spinnerStyle} />
          <p style={{ marginTop: '20px', color: THEME.textLight }}>Chargement de vos paiements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: THEME.bg, minHeight: '100vh', padding: '20px' }}>
        <div style={{ background: THEME.dangerBg, border: `1px solid ${THEME.danger}`, borderRadius: '12px', padding: '16px', color: THEME.danger }}>
          <strong>❌ Erreur</strong>
          <p style={{ margin: '8px 0 0' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: THEME.bg, minHeight: '100vh', paddingBottom: '40px' }}>
      <style>{spinnerCSS}</style>

      {/* En-tête */}
      <div style={{ padding: '20px 24px 0', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px', color: THEME.text }}>
            💰 Paiements & Commissions
          </h1>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
            Gérez vos revenus et suivez vos transactions Stripe
          </p>
        </div>

        {/* KPI Cards - responsive grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {kpiCards.map(k => (
            <div key={k.label} style={{
              background: k.bg,
              borderRadius: '12px',
              padding: '14px 16px',
              border: `1px solid ${THEME.border}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: '700', color: THEME.textLight, letterSpacing: '0.5px', margin: '0 0 4px' }}>
                    {k.label}
                  </p>
                  <p style={{ fontSize: '22px', fontWeight: '900', color: k.color, margin: 0 }}>
                    {formatMontant(k.valeur)}
                  </p>
                </div>
                <span style={{ fontSize: '28px', opacity: 0.7 }}>{k.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Carte principale */}
        <div style={{
          background: THEME.card,
          borderRadius: '16px',
          border: `1px solid ${THEME.border}`,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          {/* Onglets avec burger menu mobile */}
          <div style={{
            borderBottom: `1px solid ${THEME.border}`,
            background: '#fafbfc',
            position: 'relative',
          }}>
            {/* Bouton burger mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'none',
                width: '100%',
                padding: '14px 16px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: THEME.accent,
                cursor: 'pointer',
                borderBottom: `1px solid ${THEME.border}`,
              }}
              className="mobile-menu-btn"
            >
              ☰ {tabs.find(t => t.key === onglet)?.label}
            </button>

            {/* Menu desktop + mobile (avec classe CSS pour toggle) */}
            <div style={{
              display: 'flex',
              gap: '0',
              flexWrap: 'wrap' as const,
            }} className={`mobile-menu-content ${mobileMenuOpen ? 'open' : ''}`}>
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => {
                    setOnglet(t.key);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    padding: '14px 24px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '13px',
                    fontWeight: onglet === t.key ? '700' : '500',
                    color: onglet === t.key ? THEME.accent : THEME.textLight,
                    borderBottom: onglet === t.key ? `3px solid ${THEME.accent}` : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap' as const,
                  }}
                >
                  {t.label} {t.count !== undefined && `(${t.count})`}
                </button>
              ))}
            </div>
          </div>

          {/* Recherche */}
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${THEME.border}`, background: '#fff' }}>
            <div style={{ position: 'relative', maxWidth: '350px' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: THEME.textLight }}>🔍</span>
              <input
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                placeholder={
                  onglet === 'commissions' ? 'Rechercher par commande ou produit...' :
                  onglet === 'transferts' ? 'Rechercher par ID transfert ou commande...' :
                  'Rechercher par ID payout...'
                }
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: THEME.text,
                  background: '#f8fafc',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Contenu selon onglet */}
          <div style={{ padding: '16px 20px', overflowX: 'auto' }}>
            {onglet === 'commissions' && (
              <TableauCommissions commissions={commissionsFiltrees} />
            )}
            {onglet === 'transferts' && (
              <TableauTransferts transferts={transfertsFiltres} />
            )}
            {onglet === 'payouts' && (
              <TableauPayouts payouts={payoutsFiltres} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tableau des Commissions
// ─────────────────────────────────────────────────────────────────────────────
function TableauCommissions({ commissions }: { commissions: Commission[] }) {
  if (commissions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: THEME.textLight }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
        <div style={{ fontSize: '14px', fontWeight: '500' }}>Aucune commission trouvée</div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
        <thead>
          <tr style={{ background: '#f0f4f8' }}>
            {['ID', 'Commande', 'Date', 'Produit', 'Qté', 'Prix unit.', 'Comm. unit.', 'Comm. totale', 'Montant vendeur', 'Statut'].map(h => (
              <th key={h} style={{ padding: '12px 10px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', borderBottom: `2px solid ${THEME.border}`, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
           </tr>
        </thead>
        <tbody>
          {commissions.map((c, i) => (
            <tr key={c.id} style={{ borderBottom: `1px solid ${THEME.border}`, background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
              <td style={{ padding: '10px', fontSize: '12px', color: THEME.accent, fontWeight: '600' }}>{c.id}</td>
              <td style={{ padding: '10px', fontSize: '12px', fontWeight: '600', color: THEME.text }}>
                #{c.no_commande || c.commande_id}
                {c.no_commande_evend && <span style={{ fontSize: '10px', color: THEME.textLight, display: 'block' }}>e-Vend: {c.no_commande_evend}</span>}
              </td>
              <td style={{ padding: '10px', fontSize: '11px', color: THEME.textLight }}>{formatDateShort(c.date_commande)}</td>
              <td style={{ padding: '10px', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.produit_nom}>
                {c.produit_nom || `Produit #${c.produit_id}`}
              </td>
              <td style={{ padding: '10px', fontSize: '12px', textAlign: 'center' }}>{c.quantite}</td>
              <td style={{ padding: '10px', fontSize: '12px' }}>{formatMontant(c.prix_unitaire)}</td>
              <td style={{ padding: '10px', fontSize: '12px' }}>{formatMontant(c.commission_unitaire)}</td>
              <td style={{ padding: '10px', fontSize: '12px', fontWeight: '600', color: THEME.warning }}>{formatMontant(c.montant_commission)}</td>
              <td style={{ padding: '10px', fontSize: '12px', fontWeight: '600', color: THEME.success }}>{formatMontant(c.montant_vendeur)}</td>
              <td style={{ padding: '10px', fontSize: '12px' }}>{statutBadge(c.statut, c.rembourse)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tableau des Transferts Stripe
// ─────────────────────────────────────────────────────────────────────────────
function TableauTransferts({ transferts }: { transferts: StripeTransfer[] }) {
  if (transferts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: THEME.textLight }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>💸</div>
        <div style={{ fontSize: '14px', fontWeight: '500' }}>Aucun transfert Stripe trouvé</div>
        <div style={{ fontSize: '12px', marginTop: '6px' }}>Les transferts apparaîtront après vos premières commandes payées</div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
        <thead>
          <tr style={{ background: '#f0f4f8' }}>
            {['ID Transfert', 'Commande', 'Montant', 'Compte destination', 'Statut', 'Date'].map(h => (
              <th key={h} style={{ padding: '12px 10px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', borderBottom: `2px solid ${THEME.border}`, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
           </tr>
        </thead>
        <tbody>
          {transferts.map((t, i) => (
            <tr key={t.stripe_transfer_id} style={{ borderBottom: `1px solid ${THEME.border}`, background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
              <td style={{ padding: '10px', fontSize: '11px', fontFamily: 'monospace', color: THEME.accent }}>
                {t.stripe_transfer_id?.slice(0, 20)}...
              </td>
              <td style={{ padding: '10px', fontSize: '12px', fontWeight: '600' }}>#{t.commande_id}</td>
              <td style={{ padding: '10px', fontSize: '13px', fontWeight: '700', color: THEME.success }}>{formatMontant(t.montant, t.devise)}</td>
              <td style={{ padding: '10px', fontSize: '11px', fontFamily: 'monospace', color: THEME.textLight }}>
                {t.destination_account?.slice(0, 15)}...
              </td>
              <td style={{ padding: '10px', fontSize: '12px' }}>{statutBadge(t.statut)}</td>
              <td style={{ padding: '10px', fontSize: '11px', color: THEME.textLight }}>{formatDate(t.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tableau des Payouts Stripe
// ─────────────────────────────────────────────────────────────────────────────
function TableauPayouts({ payouts }: { payouts: StripePayout[] }) {
  if (payouts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: THEME.textLight }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏦</div>
        <div style={{ fontSize: '14px', fontWeight: '500' }}>Aucun payout Stripe trouvé</div>
        <div style={{ fontSize: '12px', marginTop: '6px' }}>Les payouts apparaîtront après vos premiers transferts</div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
        <thead>
          <tr style={{ background: '#f0f4f8' }}>
            {['ID Payout', 'Montant', 'Méthode', 'Date d\'arrivée', 'Statut', 'Créé le'].map(h => (
              <th key={h} style={{ padding: '12px 10px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', borderBottom: `2px solid ${THEME.border}`, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
           </tr>
        </thead>
        <tbody>
          {payouts.map((p, i) => (
            <tr key={p.stripe_payout_id} style={{ borderBottom: `1px solid ${THEME.border}`, background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
              <td style={{ padding: '10px', fontSize: '11px', fontFamily: 'monospace', color: THEME.accent }}>
                {p.stripe_payout_id?.slice(0, 20)}...
              </td>
              <td style={{ padding: '10px', fontSize: '13px', fontWeight: '700', color: THEME.success }}>{formatMontant(p.montant, p.devise)}</td>
              <td style={{ padding: '10px', fontSize: '12px', textTransform: 'capitalize' }}>{p.methode || '—'}</td>
              <td style={{ padding: '10px', fontSize: '11px', color: THEME.textLight }}>{p.date_arrivee ? formatDateShort(p.date_arrivee) : '—'}</td>
              <td style={{ padding: '10px', fontSize: '12px' }}>{statutBadge(p.statut)}</td>
              <td style={{ padding: '10px', fontSize: '11px', color: THEME.textLight }}>{formatDate(p.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}