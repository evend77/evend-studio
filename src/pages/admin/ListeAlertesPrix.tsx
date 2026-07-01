// src/pages/admin/ListeAlertesPrix.tsx
import React, { useState, useEffect } from 'react';

interface PriceAlert {
  id: number;
  product_id: string;
  product_title: string;
  product_image_url: string;
  product_url: string;
  email: string;
  acheteur_nom: string;
  current_price: number;
  target_price: number;
  status: 'active' | 'triggered' | 'cancelled';
  notification_email: boolean;
  notification_push: boolean;
  notification_sent_email: boolean;
  notification_sent_push: boolean;
  notification_email_sent_at: string;
  notification_push_sent_at: string;
  created_at: string;
  triggered_at: string;
  price_when_triggered: number;
  message: string;
}

interface Statistiques {
  total: number;
  actives: number;
  declenchees: number;
  emails_envoyes: number;
  push_envoyes: number;
}

const API_BASE = 'https://evend-multivendeur-api.onrender.com/api';

const ListeAlertesPrix: React.FC = () => {
  const [alertes, setAlertes] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<'tous' | 'actif' | 'declenche'>('tous');
  const [recherche, setRecherche] = useState('');
  const [statistiques, setStatistiques] = useState<Statistiques>({
    total: 0,
    actives: 0,
    declenchees: 0,
    emails_envoyes: 0,
    push_envoyes: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [showConfirm, setShowConfirm] = useState<{ show: boolean; id: number | null }>({ show: false, id: null });

  useEffect(() => {
    fetchAlertes();
  }, []);

  const fetchAlertes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/admin/price-alerts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAlertes(data);
        calculerStatistiques(data);
      }
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
    } finally {
      setLoading(false);
    }
  };

  const supprimerAlerte = async (id: number) => {
    setShowConfirm({ show: false, id: null });
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/admin/price-alerts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setAlertes(alertes.filter(a => a.id !== id));
        calculerStatistiques(alertes.filter(a => a.id !== id));
        alert('Alerte supprimée');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const calculerStatistiques = (data: PriceAlert[]) => {
    setStatistiques({
      total: data.length,
      actives: data.filter(a => a.status === 'active').length,
      declenchees: data.filter(a => a.status === 'triggered').length,
      emails_envoyes: data.filter(a => a.notification_sent_email).length,
      push_envoyes: data.filter(a => a.notification_sent_push).length,
    });
  };

  const alertesFiltrees = alertes.filter(alerte => {
    if (filtre === 'actif' && alerte.status !== 'active') return false;
    if (filtre === 'declenche' && alerte.status !== 'triggered') return false;
    if (recherche) {
      const search = recherche.toLowerCase();
      return (
        alerte.product_title?.toLowerCase().includes(search) ||
        alerte.email?.toLowerCase().includes(search) ||
        alerte.acheteur_nom?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedAlertes = alertesFiltrees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(alertesFiltrees.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filtre, recherche]);

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>⏳ En attente</span>;
    }
    if (status === 'triggered') {
      return <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>✅ Déclenchée</span>;
    }
    return <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>❌ Annulée</span>;
  };

  const getNotificationIcon = (email: boolean, push: boolean, sentEmail: boolean, sentPush: boolean) => {
    return (
      <div style={{ display: 'flex', gap: '8px' }}>
        <span style={{ opacity: email ? 1 : 0.3 }} title={sentEmail ? 'Email envoyé' : 'Email activé'}>
          {sentEmail ? '📧✅' : '📧'}
        </span>
        <span style={{ opacity: push ? 1 : 0.3 }} title={sentPush ? 'Push envoyé' : 'Push activé'}>
          {sentPush ? '🔔✅' : '🔔'}
        </span>
      </div>
    );
  };

  const formatDate = (date: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-CA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: any) => {
    const num = Number(price);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // CORRIGÉ: Typage explicite pour le tableau de numéros de page
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: '#6b7280' }}>Chargement des alertes prix...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Modal de confirmation */}
      {showConfirm.show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 12px 0' }}>Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir supprimer cette alerte ?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowConfirm({ show: false, id: null })} style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => showConfirm.id && supprimerAlerte(showConfirm.id)} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>💰</span>
          <span>Alertes prix - Gestion avancée</span>
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>Suivez toutes les alertes de baisse de prix créées par vos acheteurs</p>
      </div>

      {/* Statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', padding: '20px', color: 'white' }}>
          <div style={{ fontSize: '32px', fontWeight: '800' }}>{statistiques.total}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Total alertes</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', borderRadius: '16px', padding: '20px', color: 'white' }}>
          <div style={{ fontSize: '32px', fontWeight: '800' }}>{statistiques.actives}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>En surveillance</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '16px', padding: '20px', color: 'white' }}>
          <div style={{ fontSize: '32px', fontWeight: '800' }}>{statistiques.declenchees}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Déclenchées</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', borderRadius: '16px', padding: '20px', color: 'white' }}>
          <div style={{ fontSize: '32px', fontWeight: '800' }}>{statistiques.emails_envoyes}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Emails envoyés</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', borderRadius: '16px', padding: '20px', color: 'white' }}>
          <div style={{ fontSize: '32px', fontWeight: '800' }}>{statistiques.push_envoyes}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Notifications push</div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setFiltre('tous')}
            style={{
              padding: '8px 20px',
              borderRadius: '30px',
              border: 'none',
              background: filtre === 'tous' ? '#2d6a9f' : '#f3f4f6',
              color: filtre === 'tous' ? 'white' : '#374151',
              fontWeight: filtre === 'tous' ? '700' : '500',
              cursor: 'pointer',
            }}
          >
            Tous
          </button>
          <button
            onClick={() => setFiltre('actif')}
            style={{
              padding: '8px 20px',
              borderRadius: '30px',
              border: 'none',
              background: filtre === 'actif' ? '#f59e0b' : '#f3f4f6',
              color: filtre === 'actif' ? 'white' : '#374151',
              fontWeight: filtre === 'actif' ? '700' : '500',
              cursor: 'pointer',
            }}
          >
            ⏳ En attente
          </button>
          <button
            onClick={() => setFiltre('declenche')}
            style={{
              padding: '8px 20px',
              borderRadius: '30px',
              border: 'none',
              background: filtre === 'declenche' ? '#10b981' : '#f3f4f6',
              color: filtre === 'declenche' ? 'white' : '#374151',
              fontWeight: filtre === 'declenche' ? '700' : '500',
              cursor: 'pointer',
            }}
          >
            ✅ Déclenchées
          </button>
        </div>

        <div>
          <input
            type="text"
            placeholder="🔍 Rechercher par produit, email..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{
              padding: '10px 16px',
              width: '300px',
              borderRadius: '30px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Tableau des alertes */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Image</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Produit</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Acheteur</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Prix</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Cible</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Statut</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Notifications</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Date création</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAlertes.map((alerte, index) => (
                <tr key={alerte.id} style={{ borderBottom: index < paginatedAlertes.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <td style={{ padding: '16px' }}>
                    {alerte.product_image_url ? (
                      <img 
                        src={alerte.product_image_url} 
                        alt={alerte.product_title || 'Produit'} 
                        style={{ 
                          width: '50px', 
                          height: '50px', 
                          borderRadius: '8px', 
                          objectFit: 'cover', 
                          background: '#f3f4f6',
                          display: 'block'
                        }} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50x50?text=📦';
                        }}
                      />
                    ) : (
                      <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📦</div>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{alerte.product_title?.substring(0, 60)}</div>
                      <a href={alerte.product_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#2d6a9f', textDecoration: 'none' }}>🔗 Voir produit →</a>
                    </div>
                    </td>
                  <td style={{ padding: '16px' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{alerte.acheteur_nom || '—'}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{alerte.email}</div>
                    </div>
                    </td>
                  <td style={{ padding: '16px', fontWeight: '600', color: alerte.status === 'triggered' ? '#10b981' : '#374151' }}>
                    {alerte.price_when_triggered ? (
                      <div>
                        <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '12px' }}>{formatPrice(alerte.current_price)} $</span>
                        <span style={{ fontWeight: '800', color: '#10b981' }}> {formatPrice(alerte.price_when_triggered)} $</span>
                      </div>
                    ) : (
                      `${formatPrice(alerte.current_price)} $`
                    )}
                    </td>
                  <td style={{ padding: '16px', fontWeight: '700', color: '#f59e0b' }}>{formatPrice(alerte.target_price)} $</td>
                  <td style={{ padding: '16px' }}>{getStatusBadge(alerte.status)}</td>
                  <td style={{ padding: '16px' }}>{getNotificationIcon(alerte.notification_email, alerte.notification_push, alerte.notification_sent_email, alerte.notification_sent_push)}</td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#6b7280' }}>{formatDate(alerte.created_at)}</td>
                  <td style={{ padding: '16px' }}>
                    <button
                      onClick={() => setShowConfirm({ show: true, id: alerte.id })}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '18px',
                      }}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                    </td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>

        {alertesFiltrees.length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📭</div>
            <p style={{ color: '#6b7280' }}>Aucune alerte prix trouvée</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ 
            padding: '16px 20px', 
            borderTop: '1px solid #e5e7eb', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                background: 'white',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              ← Précédent
            </button>
            
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              {currentPage > 3 && totalPages > 5 && (
                <>
                  <button
                    onClick={() => setCurrentPage(1)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    1
                  </button>
                  <span style={{ color: '#9ca3af' }}>...</span>
                </>
              )}
              
              {getPageNumbers().map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    background: currentPage === pageNum ? '#2d6a9f' : 'white',
                    color: currentPage === pageNum ? 'white' : '#374151',
                    fontWeight: currentPage === pageNum ? '600' : 'normal',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  {pageNum}
                </button>
              ))}
              
              {currentPage < totalPages - 2 && totalPages > 5 && (
                <>
                  <span style={{ color: '#9ca3af' }}>...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                background: 'white',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
              }}
            >
              Suivant →
            </button>
          </div>
        )}
        
        <div style={{ 
          padding: '12px 20px', 
          borderTop: '1px solid #f3f4f6', 
          fontSize: '12px', 
          color: '#6b7280',
          textAlign: 'right',
          background: '#fafafa'
        }}>
          {alertesFiltrees.length > 0 && (
            <>Affichage {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, alertesFiltrees.length)} sur {alertesFiltrees.length} alertes</>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListeAlertesPrix;