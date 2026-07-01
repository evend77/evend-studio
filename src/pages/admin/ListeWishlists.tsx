// src/pages/admin/ListeWishlists.tsx
import React, { useState, useEffect } from 'react';

interface WishlistItem {
  id: number;
  wishlist_id: number;
  product_id: string;
  product_title: string;
  product_handle: string;
  product_image_url: string;
  variant_id: string;
  variant_title: string;
  price: number;
  compare_at_price: number;
  quantity: number;
  notes: string;
  added_at: string;
}

interface Wishlist {
  id: number;
  user_id: string;
  user_email: string;
  user_type: string;
  session_id: string;
  nom: string;
  is_default: boolean;
  partage_token: string;
  est_partagee: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string;
  items: WishlistItem[];
  total_items: number;
  total_value: number;
}

interface Statistiques {
  total_wishlists: number;
  total_items: number;
  total_valeurs: number;
  acheteurs_uniques: number;
  wishlists_partagees: number;
}

const API_BASE = 'https://evend-multivendeur-api.onrender.com/api';

const ListeWishlists: React.FC = () => {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState<'tous' | 'acheteur' | 'invite'>('tous');
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedWishlist, setSelectedWishlist] = useState<Wishlist | null>(null);
  const [showConfirm, setShowConfirm] = useState<{ show: boolean; id: number | null }>({ show: false, id: null });
  const [statistiques, setStatistiques] = useState<Statistiques>({
    total_wishlists: 0,
    total_items: 0,
    total_valeurs: 0,
    acheteurs_uniques: 0,
    wishlists_partagees: 0,
  });

  useEffect(() => {
    fetchWishlists();
    fetchStats();
  }, []);

  const fetchWishlists = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/admin/wishlists`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWishlists(data);
      }
    } catch (error) {
      console.error('Erreur chargement wishlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/admin/wishlists/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStatistiques(data);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const supprimerWishlist = async (id: number) => {
    setShowConfirm({ show: false, id: null });
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/admin/wishlists/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setWishlists(wishlists.filter(w => w.id !== id));
        alert('Wishlist supprimée');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const wishlistsFiltrees = wishlists.filter(wishlist => {
    if (filtreType !== 'tous' && wishlist.user_type !== filtreType) return false;
    if (recherche) {
      const search = recherche.toLowerCase();
      return (
        wishlist.user_email?.toLowerCase().includes(search) ||
        wishlist.nom?.toLowerCase().includes(search) ||
        wishlist.items?.some(item => item.product_title?.toLowerCase().includes(search))
      );
    }
    return true;
  });

  const paginatedWishlists = wishlistsFiltrees.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(wishlistsFiltrees.length / itemsPerPage);

  const getTypeBadge = (type: string) => {
    if (type === 'acheteur') {
      return <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>👤 Acheteur</span>;
    }
    return <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>👥 Invité</span>;
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

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: '#6b7280' }}>Chargement des wishlists...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1400px' }}>
      {/* Modal de confirmation */}
      {showConfirm.show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 12px 0' }}>Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir supprimer cette wishlist ?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowConfirm({ show: false, id: null })} style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => showConfirm.id && supprimerWishlist(showConfirm.id)} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>❤️</span>
          <span>Wishlists - Liste d'envies des clients</span>
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>Consultez toutes les listes d'envies créées par vos acheteurs et invités</p>
      </div>

      {/* Statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', borderRadius: '16px', padding: '20px', color: 'white' }}>
          <div style={{ fontSize: '32px', fontWeight: '800' }}>{statistiques.total_wishlists}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Wishlists créées</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderRadius: '16px', padding: '20px', color: 'white' }}>
          <div style={{ fontSize: '32px', fontWeight: '800' }}>{statistiques.total_items}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Articles sauvegardés</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '16px', padding: '20px', color: 'white' }}>
          <div style={{ fontSize: '32px', fontWeight: '800' }}>{statistiques.total_valeurs.toFixed(0)} $</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Valeur totale</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', borderRadius: '16px', padding: '20px', color: 'white' }}>
          <div style={{ fontSize: '32px', fontWeight: '800' }}>{statistiques.acheteurs_uniques}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Acheteurs uniques</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', borderRadius: '16px', padding: '20px', color: 'white' }}>
          <div style={{ fontSize: '32px', fontWeight: '800' }}>{statistiques.wishlists_partagees}</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Partagées</div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setFiltreType('tous')}
            style={{
              padding: '8px 20px',
              borderRadius: '30px',
              border: 'none',
              background: filtreType === 'tous' ? '#2d6a9f' : '#f3f4f6',
              color: filtreType === 'tous' ? 'white' : '#374151',
              fontWeight: filtreType === 'tous' ? '700' : '500',
              cursor: 'pointer',
            }}
          >
            Tous
          </button>
          <button
            onClick={() => setFiltreType('acheteur')}
            style={{
              padding: '8px 20px',
              borderRadius: '30px',
              border: 'none',
              background: filtreType === 'acheteur' ? '#3b82f6' : '#f3f4f6',
              color: filtreType === 'acheteur' ? 'white' : '#374151',
              fontWeight: filtreType === 'acheteur' ? '700' : '500',
              cursor: 'pointer',
            }}
          >
            👤 Acheteurs
          </button>
          <button
            onClick={() => setFiltreType('invite')}
            style={{
              padding: '8px 20px',
              borderRadius: '30px',
              border: 'none',
              background: filtreType === 'invite' ? '#f59e0b' : '#f3f4f6',
              color: filtreType === 'invite' ? 'white' : '#374151',
              fontWeight: filtreType === 'invite' ? '700' : '500',
              cursor: 'pointer',
            }}
          >
            👥 Invités
          </button>
        </div>

        <div>
          <input
            type="text"
            placeholder="🔍 Rechercher par email, nom de liste, produit..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{
              padding: '10px 16px',
              width: '350px',
              borderRadius: '30px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Cartes des wishlists */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {paginatedWishlists.map((wishlist) => (
          <div
            key={wishlist.id}
            style={{
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            {/* En-tête de la wishlist */}
            <div
              style={{
                padding: '20px 24px',
                background: '#fafafa',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedWishlist(selectedWishlist?.id === wishlist.id ? null : wishlist)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div style={{ fontSize: '28px' }}>❤️</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{wishlist.nom || 'Ma liste'}</h3>
                    {getTypeBadge(wishlist.user_type)}
                    {wishlist.est_partagee && <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>🔗 Partagée</span>}
                    {wishlist.is_default && <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>⭐ Par défaut</span>}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px' }}>
                    {wishlist.user_email || 'Invité'} • Créée le {formatDate(wishlist.created_at)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', color: '#2d6a9f' }}>{wishlist.total_items || 0} article(s)</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#10b981' }}>{wishlist.total_value?.toFixed(2) || 0} $</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowConfirm({ show: true, id: wishlist.id }); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    padding: '4px 8px',
                  }}
                  title="Supprimer"
                >
                  🗑️
                </button>
                <div style={{ fontSize: '20px', color: '#9ca3af' }}>
                  {selectedWishlist?.id === wishlist.id ? '▲' : '▼'}
                </div>
              </div>
            </div>

            {/* Détails de la wishlist (expandable) */}
            {selectedWishlist?.id === wishlist.id && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid #e5e7eb' }}>
                {/* Infos supplémentaires */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>ID Wishlist</div>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>#{wishlist.id}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Dernière mise à jour</div>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>{formatDate(wishlist.updated_at)}</div>
                  </div>
                  {wishlist.partage_token && (
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Lien de partage</div>
                      <div style={{ fontSize: '12px', fontWeight: '500', color: '#2d6a9f', wordBreak: 'break-all' }}>{wishlist.partage_token}</div>
                    </div>
                  )}
                </div>

                {/* Liste des articles */}
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 16px 0' }}>🛍️ Articles dans cette liste</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(wishlist.items || []).map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '12px',
                          background: '#f9fafb',
                          borderRadius: '12px',
                          transition: 'all 0.2s',
                        }}
                      >
                        {item.product_image_url ? (
                          <img src={item.product_image_url} alt="" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>📦</div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>{item.product_title}</div>
                          {item.variant_title && <div style={{ fontSize: '12px', color: '#6b7280' }}>Variante: {item.variant_title}</div>}
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Ajouté le {formatDate(item.added_at)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '700', color: '#2d6a9f' }}>{item.price?.toFixed(2)} $</div>
                          {item.compare_at_price > item.price && (
                            <div style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through' }}>{item.compare_at_price?.toFixed(2)} $</div>
                          )}
                          {item.quantity > 1 && <div style={{ fontSize: '11px', color: '#6b7280' }}>Qté: {item.quantity}</div>}
                        </div>
                        {item.notes && (
                          <div style={{ maxWidth: '200px', fontSize: '12px', color: '#6b7280', fontStyle: 'italic', padding: '8px', background: '#fef3c7', borderRadius: '8px' }}>
                            📝 {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                    {(wishlist.items || []).length === 0 && (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                        📭 Cette wishlist est vide
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {wishlistsFiltrees.length === 0 && (
        <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📭</div>
          <p style={{ color: '#6b7280' }}>Aucune wishlist trouvée</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: 'white',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            ← Précédent
          </button>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>
            Page {page} sur {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: 'white',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
};

export default ListeWishlists;