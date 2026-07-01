import React, { useState, useEffect } from 'react';
import { Spinner, Banner } from '@shopify/polaris';

// Types pour les commissions
interface Commission {
  id: number;
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
  commission_admin_rembourse: number | null;
  taxes_commission: number;
  commission_taxes: number;
  commission_expedition: number;
  taux_commission: number;
  statut: string;
  rembourse: boolean;
  raison_remboursement: string | null;
}

interface StatsCommissions {
  total_commissions: number;
  total_commissions_remboursees: number;
  total_net: number;
  nb_commandes: number;
  nb_produits: number;
}

const API = 'https://evend-multivendeur-api.onrender.com';

function ListeCommissions() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<StatsCommissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');
  const [vendeurId, setVendeurId] = useState<number | null>(null);

  // ✅ Token lu à chaque fetch — jamais figé au montage
  const getToken = () => localStorage.getItem('token');

  // Récupérer l'ID du vendeur depuis localStorage
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setVendeurId(user.id);
      }
    } catch (err) {
      console.error('Erreur lecture vendeur:', err);
    }
  }, []);

  // Charger les commissions
  useEffect(() => {
    if (!vendeurId) return;

    const chargerCommissions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API}/api/vendeurs/${vendeurId}/commissions`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📊 Données commissions reçues:', data);
          setCommissions(data.commissions || []);
          setStats(data.stats);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Erreur chargement des commissions');
        }
      } catch (err) {
        console.error('Erreur chargement commissions:', err);
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    chargerCommissions();
  }, [vendeurId]);

  // Filtrer les commissions
  const commissionsFiltrees = commissions.filter(c =>
    recherche === '' ||
    c.no_commande?.includes(recherche) ||
    c.produit_nom?.toLowerCase().includes(recherche.toLowerCase()) ||
    c.no_commande_evend?.includes(recherche)
  );

  // Formater la date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('fr-CA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatter le prix - Version robuste qui gère les strings et les nombres
  const formatPrix = (prix: any): string => {
    // Si null ou undefined
    if (prix === null || prix === undefined) {
      return '$0.00';
    }
    
    // Si c'est une string, nettoyer et convertir
    let valeur = prix;
    if (typeof prix === 'string') {
      // Enlever les caractères non numériques (sauf point et virgule)
      const nettoye = prix.replace(/[^0-9.,-]/g, '').replace(',', '.');
      valeur = parseFloat(nettoye);
    }
    
    // Si c'est déjà un nombre
    if (typeof valeur === 'number' && !isNaN(valeur)) {
      return `${valeur.toFixed(2)} $`;
    }
    
    // Si ce n'est pas un nombre valide
    return '$0.00';
  };

  const thStyle: React.CSSProperties = {
    padding: '12px 10px',
    textAlign: 'center',
    fontSize: '11px',
    fontWeight: '700',
    color: 'white',
    backgroundColor: '#1a472a',
    borderRight: '1px solid #2d6a4f',
    borderBottom: '2px solid #0f3b2a',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 8px',
    fontSize: '12px',
    textAlign: 'center',
    borderBottom: '1px solid #e9ecef',
    borderRight: '1px solid #e9ecef',
    verticalAlign: 'middle',
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', paddingTop: '60px' }}>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Spinner accessibilityLabel="Chargement" size="large" />
          <p style={{ marginTop: '20px', color: '#666' }}>Chargement de vos commissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', padding: '20px' }}>
        <Banner tone="critical">
          <p>❌ {error}</p>
        </Banner>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', paddingBottom: '80px' }}>
      <div style={{ padding: '20px 24px' }}>

        {/* Fil d'Ariane */}
        <p style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
          Commandes / <span style={{ color: '#1a472a', fontWeight: '600' }}>Commissions</span>
        </p>

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0', color: '#1a472a' }}>
              💰 Commissions
            </h1>
            <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
              Voici la liste de toutes les commissions facturées par produit à partir de vos commandes.
            </p>
          </div>
          <button style={{
            backgroundColor: '#1a472a', color: 'white', border: 'none',
            borderRadius: '8px', padding: '10px 20px', fontSize: '13px',
            fontWeight: '600', cursor: 'pointer',
          }}>
            📥 Exporter CSV
          </button>
        </div>

        {/* Cartes de statistiques */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1a472a, #2d6a4f)',
              padding: '16px',
              borderRadius: '12px',
              color: 'white'
            }}>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Total des commissions</p>
              <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 'bold' }}>
                {formatPrix(stats.total_commissions)}
              </p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #2c3e50, #34495e)',
              padding: '16px',
              borderRadius: '12px',
              color: 'white'
            }}>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Commissions remboursées</p>
              <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 'bold' }}>
                {formatPrix(stats.total_commissions_remboursees)}
              </p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #0f3b2a, #1a472a)',
              padding: '16px',
              borderRadius: '12px',
              color: 'white'
            }}>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Total net (après remboursements)</p>
              <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 'bold' }}>
                {formatPrix(stats.total_net)}
              </p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #537373, #6a8f8f)',
              padding: '16px',
              borderRadius: '12px',
              color: 'white'
            }}>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Commandes / Produits</p>
              <p style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 'bold' }}>
                {stats.nb_commandes} / {stats.nb_produits}
              </p>
            </div>
          </div>
        )}

        {/* Tableau des commissions */}
        <div style={{
          backgroundColor: 'white', borderRadius: '12px',
          border: '1px solid #e9ecef', overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>

          {/* Filtres + recherche */}
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #e9ecef',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', gap: '8px', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{
                padding: '6px 16px', borderRadius: '6px', fontSize: '12px',
                border: '1px solid #1a472a', backgroundColor: '#1a472a',
                color: 'white', fontWeight: '500', cursor: 'pointer',
              }}>
                Toutes
              </button>
              <button style={{
                padding: '6px 16px', borderRadius: '6px', fontSize: '12px',
                border: '1px solid #ddd', backgroundColor: 'white',
                color: '#666', fontWeight: '500', cursor: 'pointer',
              }}>
                Non remboursées
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Rechercher commande ou produit..."
                  value={recherche}
                  onChange={e => setRecherche(e.target.value)}
                  style={{
                    border: '1px solid #ddd', borderRadius: '8px',
                    padding: '8px 32px 8px 12px', fontSize: '13px',
                    outline: 'none', width: '250px',
                  }}
                />
                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}>🔍</span>
              </div>
            </div>
          </div>

          {/* Table scrollable */}
          <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 380px)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1300px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                <tr>
                  <th style={{ ...thStyle, width: '90px' }}>No. commande</th>
                  <th style={{ ...thStyle, width: '130px' }}>Date</th>
                  <th style={{ ...thStyle, width: '200px' }}>Produit</th>
                  <th style={{ ...thStyle, width: '70px' }}>Qté</th>
                  <th style={{ ...thStyle, width: '80px' }}>Prix unit.</th>
                  <th style={{ ...thStyle, width: '100px' }}>Comm. unitaire</th>
                  <th style={{ ...thStyle, width: '100px' }}>Comm. totale produit</th>
                  <th style={{ ...thStyle, width: '100px' }}>Comm. admin</th>
                  <th style={{ ...thStyle, width: '100px' }}>Comm. admin remb.</th>
                  <th style={{ ...thStyle, width: '90px' }}>Taxes comm.</th>
                  <th style={{ ...thStyle, width: '90px' }}>Comm. taxes</th>
                  <th style={{ ...thStyle, width: '90px' }}>Comm. expédition</th>
                  <th style={{ ...thStyle, width: '100px' }}>No. commande e-Vend</th>
                  <th style={{ ...thStyle, width: '80px' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {commissionsFiltrees.length === 0 ? (
                  <tr>
                    <td colSpan={14} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                      Aucune commission trouvée
                    </td>
                  </tr>
                ) : (
                  commissionsFiltrees.map((c, index) => (
                    <tr
                      key={c.id}
                      style={{
                        backgroundColor: index % 2 === 0 ? 'white' : '#fafbfc',
                        opacity: c.rembourse ? 0.7 : 1,
                      }}
                    >
                      <td style={{ ...tdStyle, color: '#1a472a', fontWeight: '600', cursor: 'pointer' }}>
                        {c.no_commande || 'N/A'}
                      </td>
                      <td style={{ ...tdStyle, fontSize: '11px', color: '#666' }}>
                        {formatDate(c.date_commande)}
                      </td>
                      <td style={{ ...tdStyle, color: '#1a472a', textAlign: 'left', fontSize: '12px', fontWeight: 500 }}>
                        {c.produit_nom || 'Produit inconnu'}
                      </td>
                      <td style={tdStyle}>{c.quantite || 0}</td>
                      <td style={{ ...tdStyle, fontWeight: '600' }}>{formatPrix(c.prix_unitaire)}</td>
                      <td style={tdStyle}>{formatPrix(c.commission_unitaire)}</td>
                      <td style={tdStyle}>{formatPrix(c.commission_totale_produit)}</td>
                      <td style={tdStyle}>{formatPrix(c.commission_totale_admin)}</td>
                      <td style={{ ...tdStyle, color: c.commission_admin_rembourse ? '#dc2626' : '#666' }}>
                        {formatPrix(c.commission_admin_rembourse)}
                      </td>
                      <td style={tdStyle}>{formatPrix(c.taxes_commission)}</td>
                      <td style={tdStyle}>{formatPrix(c.commission_taxes)}</td>
                      <td style={tdStyle}>{formatPrix(c.commission_expedition)}</td>
                      <td style={{ ...tdStyle, color: '#1a472a', fontWeight: '600' }}>
                        {c.no_commande_evend || 'N/A'}
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '20px',
                          fontSize: '10px',
                          fontWeight: '600',
                          backgroundColor: c.rembourse ? '#fee2e2' : '#d1fae5',
                          color: c.rembourse ? '#dc2626' : '#059669',
                        }}>
                          {c.rembourse ? 'Remboursé' : c.statut || 'Payé'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListeCommissions;
