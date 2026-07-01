import React, { useState, useEffect } from 'react';
import { log } from '../../services/logger';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AbonnementVendeur {
  sellerId: number;
  nomBoutique: string;
  email: string;
  plan: string;
  planType: 'free' | 'silver' | 'gold' | 'custom';
  statut: 'actif' | 'pending' | 'inactif' | 'suspendu';
  paiementStatut: 'paid' | 'pending' | 'failed' | 'none';
  dateDebut: string;
  dateFin: string;
  prixMensuel: number;
  fraisInstallation: number;
  province: string;
}

interface AbonnementsActifsProps {
  naviguerVers: (page: string, data?: any) => void;
}

const THEME = {
  accent: '#2d6a9f', accentLight: '#e8f2fb',
  bg: '#f0f2f5', card: '#ffffff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  success: '#16a34a', warning: '#d97706', danger: '#dc2626', purple: '#7c3aed',
};

function fmtMoney(n: number) {
  return n === 0 ? 'Gratuit' : n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' $';
}

function PlanBadge({ type, nom }: { type: string; nom: string }) {
  const styles: Record<string, React.CSSProperties> = {
    free:   { backgroundColor: '#f3f4f6', color: '#6b7280' },
    silver: { backgroundColor: '#f1f5f9', color: '#475569' },
    gold:   { backgroundColor: '#fef9c3', color: '#92400e' },
    custom: { backgroundColor: '#f3e8ff', color: '#7c3aed' },
  };
  const icons: Record<string, string> = { free: '🆓', silver: '🥈', gold: '🥇', custom: '⭐' };
  return (
    <span style={{ ...styles[type] || styles.free, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' as const }}>
      {icons[type] || '📦'} {nom}
    </span>
  );
}

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    actif:    { bg: '#dcfce7', color: '#16a34a', label: '✅ Actif'    },
    pending:  { bg: '#fef9c3', color: '#92400e', label: '⏳ Pending'  },
    inactif:  { bg: '#f3f4f6', color: '#6b7280', label: '⬜ Inactif'  },
    suspendu: { bg: '#fee2e2', color: '#dc2626', label: '🚫 Suspendu' },
  };
  const s = map[statut] || map.inactif;
  return (
    <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
      {s.label}
    </span>
  );
}

function PaiementBadge({ statut }: { statut: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    paid:    { bg: '#dcfce7', color: '#16a34a', label: '💳 Payé'       },
    pending: { bg: '#fef9c3', color: '#92400e', label: '⏳ En attente' },
    failed:  { bg: '#fee2e2', color: '#dc2626', label: '❌ Échoué'     },
    none:    { bg: '#f3f4f6', color: '#9ca3af', label: '—'             },
  };
  const s = map[statut] || map.none;
  return (
    <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
      {s.label}
    </span>
  );
}

export default function AbonnementsActifs({ naviguerVers }: AbonnementsActifsProps) {
  const [abonnements, setAbonnements] = useState<AbonnementVendeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [filtrePlan, setFiltrePlan] = useState('tous');

  // Charger les données depuis l'API
  useEffect(() => {
    const chargerAbonnements = async () => {
      try {
        setLoading(true);
        setError(null);
        
        log.admin('Page visitée', 'Abonnements actifs', {});
        
        const response = await fetch('https://evend-multivendeur-api.onrender.com/api/abonnements');
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        setAbonnements(data);
        log.succes('Abonnements chargés', `${data.length} abonnements trouvés`, 'admin');
        
      } catch (err) {
        console.error('Erreur chargement abonnements:', err);
        setError('Impossible de charger les abonnements. Veuillez réessayer plus tard.');
        log.erreur('Erreur chargement abonnements', err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    chargerAbonnements();
  }, []);

  // Filtrer les abonnements
  const filtres = abonnements.filter(a => {
    const s = recherche.toLowerCase();
    const inSearch = !s || 
      a.nomBoutique?.toLowerCase().includes(s) || 
      a.email?.toLowerCase().includes(s) || 
      String(a.sellerId).includes(s);
    const inStatut = filtreStatut === 'tous' || a.statut === filtreStatut;
    const inPlan   = filtrePlan   === 'tous' || a.planType === filtrePlan;
    return inSearch && inStatut && inPlan;
  });

  // Calculer les KPIs à partir des vraies données (en convertissant en nombres)
  const nbActif    = abonnements.filter(a => a.statut === 'actif').length;
  const nbPending  = abonnements.filter(a => a.statut === 'pending').length;
  const nbSuspendu = abonnements.filter(a => a.statut === 'suspendu').length;
  
  // Calculer le revenu mensuel en s'assurant que les valeurs sont des nombres
  const revMensuel = abonnements
    .filter(a => a.statut === 'actif')
    .reduce((s, a) => {
      const prix = Number(a.prixMensuel) || 0;
      return s + prix;
    }, 0);

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '8px 12px',
    fontSize: '12px', outline: 'none', backgroundColor: 'white', color: THEME.text,
  };
  
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

  // Formater la date pour l'affichage
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-CA');
    } catch {
      return dateStr;
    }
  };

  // Affichage du chargement
  if (loading) {
    return (
      <div style={{ padding: '24px 28px', backgroundColor: THEME.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: THEME.textLight }}>Chargement des abonnements...</p>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div style={{ padding: '24px 28px', backgroundColor: THEME.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', backgroundColor: 'white', padding: '32px', borderRadius: '12px', border: `1px solid ${THEME.border}` }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>❌</div>
          <h3 style={{ color: THEME.danger, marginBottom: '8px' }}>Erreur de chargement</h3>
          <p style={{ color: THEME.textLight, marginBottom: '16px' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: THEME.accent,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', backgroundColor: THEME.bg, minHeight: '100vh' }}>

      {/* En-tête */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Abonnements actifs
        </h1>
        <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
          Forfaits & Plans — Gestion des memberships vendeurs
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Abonnements actifs',    val: nbActif,                    icon: '✅', c: THEME.success, sous: 'Plans en cours'         },
          { label: 'En attente',            val: nbPending,                  icon: '⏳', c: THEME.warning, sous: 'Approbation requise'     },
          { label: 'Suspendus',             val: nbSuspendu,                 icon: '🚫', c: THEME.danger,  sous: 'Paiement échoué ou gel'  },
          { 
            label: 'Revenu mensuel actif',  
            val: (revMensuel || 0).toFixed(2).replace('.', ',') + ' $', 
            icon: '💰', 
            c: THEME.accent,  
            sous: 'Plans payants seulement' 
          },
        ].map((k, i) => (
          <div key={i} style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ fontSize: '18px', width: '36px', height: '36px', borderRadius: '8px', backgroundColor: k.c + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{k.icon}</div>
              <p style={{ fontSize: '22px', fontWeight: '900', color: THEME.text, margin: 0 }}>{k.val}</p>
            </div>
            <p style={{ fontSize: '11px', fontWeight: '700', color: THEME.textLight, margin: '0 0 1px 0' }}>{k.label}</p>
            <p style={{ fontSize: '10px', color: '#aaa', margin: 0 }}>{k.sous}</p>
          </div>
        ))}
      </div>

      {/* Barre de recherche + filtres */}
      <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, padding: '14px 18px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' as const }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>🔍</span>
          <input
            type="text"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher par boutique, email ou ID vendeur..."
            style={{ ...inputStyle, width: '100%', paddingLeft: '32px', boxSizing: 'border-box' as const }}
          />
        </div>

        {/* Filtre statut */}
        <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} style={selectStyle}>
          <option value="tous">Tous les statuts</option>
          <option value="actif">✅ Actif</option>
          <option value="pending">⏳ Pending</option>
          <option value="suspendu">🚫 Suspendu</option>
          <option value="inactif">⬜ Inactif</option>
        </select>

        {/* Filtre plan */}
        <select value={filtrePlan} onChange={e => setFiltrePlan(e.target.value)} style={selectStyle}>
          <option value="tous">Tous les plans</option>
          <option value="free">🆓 Plan Fondateur</option>
          <option value="silver">🥈 Plan Argent</option>
          <option value="gold">🥇 Plan Or</option>
          <option value="custom">⭐ Plan sur mesure</option>
        </select>

        {/* Reset */}
        {(recherche || filtreStatut !== 'tous' || filtrePlan !== 'tous') && (
          <button onClick={() => { setRecherche(''); setFiltreStatut('tous'); setFiltrePlan('tous'); }}
            style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${THEME.border}`, backgroundColor: 'white', color: THEME.textLight, fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
            ✕ Réinitialiser
          </button>
        )}

        <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0, marginLeft: 'auto', whiteSpace: 'nowrap' as const }}>
          <strong>{filtres.length}</strong> / {abonnements.length} vendeurs
        </p>
      </div>

      {/* Tableau */}
      <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${THEME.border}`, backgroundColor: '#f8fafc' }}>
                {['ID vendeur', 'Boutique', 'Email', 'Plan actuel', 'Statut', 'Paiement', 'Période', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' as const }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtres.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: THEME.textLight, fontSize: '14px' }}>
                    🔍 Aucun résultat pour cette recherche
                  </td>
                </tr>
              ) : filtres.map((a, i) => (
                <tr key={a.sellerId}
                  style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f0f7ff')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? 'white' : '#fafafa')}>

                  <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: '700', color: THEME.accent }}>{a.sellerId}</span>
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: THEME.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                        🏪
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: 0 }}>{a.nomBoutique}</p>
                        <p style={{ fontSize: '10px', color: '#aaa', margin: 0 }}>{a.province}</p>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '12px 16px', fontSize: '12px', color: THEME.textLight }}>
                    {a.email}
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <PlanBadge type={a.planType} nom={a.plan} />
                    {Number(a.prixMensuel) > 0 && (
                      <p style={{ fontSize: '10px', color: '#aaa', margin: '3px 0 0 0' }}>{Number(a.prixMensuel).toFixed(2)} $/mois</p>
                    )}
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <StatutBadge statut={a.statut} />
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <PaiementBadge statut={a.paiementStatut} />
                  </td>

                  <td style={{ padding: '12px 16px', fontSize: '11px', color: THEME.textLight }}>
                    <p style={{ margin: 0 }}>Du {formatDate(a.dateDebut)}</p>
                    <p style={{ margin: 0 }}>Au {formatDate(a.dateFin)}</p>
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => naviguerVers('abonnement-detail', a)}
                      style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '7px', padding: '7px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                      👁 Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
