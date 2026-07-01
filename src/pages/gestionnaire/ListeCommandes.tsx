import React, { useState, useEffect } from 'react';

const API = 'https://evend-multivendeur-api.onrender.com';

interface Commande {
  id: number;
  store_order_id: string;
  date_commande: string;
  client_nom: string;
  mode_paiement: string;
  statut_paiement: string;
  statut_commande: string;
  statut_acceptation: string;
  montant: number;
  etape_livraison?: string;
  produits?: any[];
}

function getBadgeStyle(valeur: string): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '2px 8px', borderRadius: '12px',
    fontSize: '11px', fontWeight: '600', display: 'inline-block', whiteSpace: 'nowrap',
  };
  const v = valeur?.toLowerCase() || '';
  if (v.includes('annul') || v.includes('rejet') || v.includes('void') || v.includes('refund'))
    return { ...base, backgroundColor: '#FDECEA', color: '#C0392B', border: '1px solid #E74C3C' };
  if (v.includes('pay') || v.includes('accept') || v.includes('livr') || v.includes('trait') || v.includes('fulfill'))
    return { ...base, backgroundColor: '#E9F7EF', color: '#1E8449', border: '1px solid #27AE60' };
  if (v.includes('pending') || v.includes('attente'))
    return { ...base, backgroundColor: '#FEF9E7', color: '#B7950B', border: '1px solid #F1C40F' };
  return { ...base, backgroundColor: '#f4f6f8', color: '#333', border: '1px solid #ddd' };
}

function formatStatutPaiement(s: string) {
  const map: Record<string, string> = {
    'Paid': 'Payé', 'paid': 'Payé',
    'voided': 'Annulé', 'refunded': 'Remboursé',
    'pending': 'En attente',
  };
  return map[s] || s;
}

function formatStatutCommande(s: string) {
  const map: Record<string, string> = {
    'Fulfilled': 'Livré', 'Unfulfilled': 'Non traité',
    'Partially Fulfilled': 'Partiel',
  };
  return map[s] || s;
}

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-CA', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ListeCommandes({ naviguerVers, gestionnaireId, onVoirCommande }: { naviguerVers: (page: string) => void; gestionnaireId?: number; onVoirCommande?: (id: number) => void }) {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectionnes, setSelectionnes] = useState<number[]>([]);
  const [tousSelectionnes, setTousSelectionnes] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tout');
  // ✅ Token lu à chaque fetch — jamais figé au montage
  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    charger();
  }, [gestionnaireId]);

  const charger = async () => {
    setLoading(true);
    try {
      const id = gestionnaireId || JSON.parse(localStorage.getItem('user') || '{}')?.id;
      const res = await fetch(`${API}/api/gestionnaires/gestionnaire-commandes/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCommandes(data);
      }
    } catch (e) {
      console.error('Erreur chargement commandes:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleTous = () => {
    if (tousSelectionnes) { setSelectionnes([]); }
    else { setSelectionnes(commandesFiltrees.map(c => c.id)); }
    setTousSelectionnes(!tousSelectionnes);
  };

  const commandesFiltrees = commandes.filter(c => {
    const matchRecherche = recherche === '' ||
      String(c.id).includes(recherche) ||
      c.store_order_id?.includes(recherche) ||
      c.client_nom?.toLowerCase().includes(recherche.toLowerCase());
    const matchFiltre = filtreStatut === 'tout' ||
      (filtreStatut === 'paid' && c.statut_paiement === 'Paid') ||
      (filtreStatut === 'annule' && (c.statut_paiement === 'voided' || c.statut_paiement === 'refunded')) ||
      (filtreStatut === 'attente' && c.statut_paiement === 'pending');
    return matchRecherche && matchFiltre;
  });

  const thStyle: React.CSSProperties = {
    padding: '8px 6px', textAlign: 'left',
    fontSize: '10px', fontWeight: '700', color: '#555',
    backgroundColor: '#f9fafb', borderBottom: '1px solid #e1e3e5',
  };
  const tdStyle: React.CSSProperties = {
    padding: '8px 6px', fontSize: '12px',
    overflow: 'hidden', textOverflow: 'ellipsis',
  };

  const filtres = [
    { key: 'tout', label: 'Tout' },
    { key: 'paid', label: '✅ Payées' },
    { key: 'attente', label: '⏳ En attente' },
    { key: 'annule', label: '❌ Annulées' },
  ];

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', paddingBottom: '80px' }}>
      <div style={{ padding: '20px' }}>

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0' }}>Commandes</h1>
            <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
              {loading ? 'Chargement...' : `${commandes.length} commande${commandes.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={charger}
              style={{ backgroundColor: '#537373', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
            >
              🔄 Actualiser
            </button>
          </div>
        </div>

        {/* Tableau */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e1e3e5', overflow: 'hidden' }}>

          {/* Filtres */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #e1e3e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {filtres.map(f => (
                <button key={f.key} onClick={() => setFiltreStatut(f.key)} style={{
                  padding: '4px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer',
                  border: filtreStatut === f.key ? '2px solid #537373' : '1px solid #ddd',
                  backgroundColor: filtreStatut === f.key ? '#f0f5f5' : 'white',
                  color: filtreStatut === f.key ? '#537373' : '#333',
                  fontWeight: filtreStatut === f.key ? '600' : '400',
                }}>
                  {f.label}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Rechercher..."
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '5px 28px 5px 10px', fontSize: '12px', outline: 'none', width: '180px' }}
              />
              <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}>🔍</span>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Chargement des commandes...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '32px' }} />
                <col style={{ width: '95px' }} />
                <col style={{ width: '65px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '90px' }} />
                <col style={{ width: '75px' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: '65px' }} />
                <col style={{ width: '58px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: 'center' }}>
                    <input type="checkbox" checked={tousSelectionnes} onChange={toggleTous} style={{ cursor: 'pointer' }} />
                  </th>
                  <th style={thStyle}>N° COMMANDE</th>
                  <th style={thStyle}>ID MAGASIN</th>
                  <th style={thStyle}>DATE</th>
                  <th style={thStyle}>CLIENT</th>
                  <th style={thStyle}>MODE PAIEMENT</th>
                  <th style={thStyle}>STATUT PAIEM.</th>
                  <th style={thStyle}>EXÉCUTION</th>
                  <th style={thStyle}>ACCEPTATION</th>
                  <th style={thStyle}>MONTANT</th>
                  <th style={thStyle}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {commandesFiltrees.map((commande, index) => (
                  <tr key={commande.id} style={{
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: selectionnes.includes(commande.id) ? '#f0f5f5' : index % 2 === 0 ? 'white' : '#fafafa',
                  }}>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <input type="checkbox" checked={selectionnes.includes(commande.id)}
                        onChange={() => setSelectionnes(prev => prev.includes(commande.id) ? prev.filter(x => x !== commande.id) : [...prev, commande.id])}
                        style={{ cursor: 'pointer' }} />
                    </td>
                    <td style={{ ...tdStyle, fontWeight: '600', color: '#537373' }}>{commande.id}</td>
                    <td style={{ ...tdStyle, color: '#537373' }}>{commande.store_order_id || '—'}</td>
                    <td style={{ ...tdStyle, color: '#666', fontSize: '11px' }}>{formatDate(commande.date_commande)}</td>
                    <td style={{ ...tdStyle, fontSize: '11px' }}>{commande.client_nom}</td>
                    <td style={{ ...tdStyle, fontSize: '11px' }}>{commande.mode_paiement || 'e-Vend Stripe'}</td>
                    <td style={tdStyle}>
                      <span style={getBadgeStyle(commande.statut_paiement)}>
                        {formatStatutPaiement(commande.statut_paiement)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={getBadgeStyle(commande.statut_commande)}>
                        {formatStatutCommande(commande.statut_commande)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={getBadgeStyle(commande.statut_acceptation || 'Pending')}>
                        {commande.statut_acceptation || 'En attente'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: '600' }}>{parseFloat(commande.montant as any || 0).toFixed(2)} $</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => onVoirCommande ? onVoirCommande(commande.id) : naviguerVers('commande-detail')}
                        style={{ backgroundColor: 'transparent', border: '1px solid #537373', color: '#537373', borderRadius: '4px', padding: '3px 6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        👁️ VOIR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && commandesFiltrees.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              Aucune commande trouvée.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListeCommandes;