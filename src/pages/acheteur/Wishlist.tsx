/**
 * Wishlist.tsx
 * src/pages/acheteur/Wishlist.tsx
 * Page de liste de souhaits (wishlist) pour l'acheteur - Connectée à la BD
 */

import React, { useState, useEffect } from 'react';

// Types mis à jour pour correspondre à l'API
interface WishlistItem {
  id: string;
  nom: string;
  prix: number;
  prixOriginal?: number;
  image: string;
  vendeur: string;
  vendeurId: string;
  note: number;
  nbAvis: number;
  enPromo: boolean;
  pourcentagePromo?: number;
  stock: 'disponible' | 'derniers' | 'rupture';
  dateAjout: string;
  categorie: string;
  couleur?: string;
  // Champs API
  product_id: string;
  variant_id?: string;
  quantity: number;
}

// API Types
interface ApiWishlistResponse {
  wishlist: {
    id: number;
    nom: string;
    partage_token: string;
    est_partagee: boolean;
    created_at: string;
  };
  items: ApiWishlistItem[];
  total_items: number;
}

interface ApiWishlistItem {
  id: number;
  product_id: string;
  product_title: string;
  product_handle?: string;
  product_image_url?: string;
  variant_id?: string;
  variant_title?: string;
  price: number;
  compare_at_price?: number;
  quantity: number;
  notes?: string;
  added_at: string;
}

// Couleurs
const C = {
  blue: '#3b82f6',
  blueLight: 'rgba(59,130,246,0.15)',
  indigo: '#6366f1',
  indigoLight: 'rgba(99,102,241,0.15)',
  purple: '#8b5cf6',
  purpleLight: 'rgba(139,92,246,0.15)',
  pink: '#ec4899',
  pinkLight: 'rgba(236,72,153,0.15)',
  green: '#10b981',
  greenLight: 'rgba(16,185,129,0.15)',
  emerald: '#059669',
  emeraldLight: 'rgba(5,150,105,0.15)',
  amber: '#f59e0b',
  amberLight: 'rgba(245,158,11,0.15)',
  orange: '#f97316',
  orangeLight: 'rgba(249,115,22,0.15)',
  red: '#ef4444',
  redLight: 'rgba(239,68,68,0.15)',
  rose: '#f43f5e',
  roseLight: 'rgba(244,63,94,0.15)',
  border: 'rgba(255,255,255,0.08)',
  textLight: 'rgba(255,255,255,0.5)',
  cardBg: 'rgba(255,255,255,0.03)',
};

// Fonction utilitaire pour convertir un prix en nombre
const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
};

// ============================================================================
// BADGE DE STOCK
// ============================================================================
const StockBadge = ({ stock }: { stock: 'disponible' | 'derniers' | 'rupture' }) => {
  const config = {
    disponible: { bg: C.greenLight, color: C.green, icon: '✅', label: 'En stock' },
    derniers: { bg: C.amberLight, color: C.amber, icon: '⚠️', label: 'Plus que quelques-uns' },
    rupture: { bg: C.redLight, color: C.red, icon: '❌', label: 'Rupture de stock' },
  };
  const { bg, color, icon, label } = config[stock];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '11px',
      fontWeight: 700,
      padding: '4px 10px',
      borderRadius: '20px',
      background: bg,
      color: color,
      border: `1px solid ${color}40`,
    }}>
      {icon} {label}
    </span>
  );
};

// ============================================================================
// MODAL DE CONFIRMATION SUPPRESSION
// ============================================================================
const ConfirmationPopup = ({ item, onConfirm, onCancel }: { item: WishlistItem; onConfirm: () => void; onCancel: () => void }) => {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(5px)',
    }} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#1a1f2e',
        borderRadius: '24px',
        border: `1px solid ${C.border}`,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${C.border}`,
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>Retirer de la liste</h2>
        </div>
        <div style={{ padding: '24px' }}>
          <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#fff' }}>
            Êtes-vous sûr de vouloir retirer <strong>{item.nom}</strong> de votre liste de souhaits ?
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${C.border}`,
                borderRadius: '10px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: '12px',
                background: C.redLight,
                border: `1px solid ${C.red}40`,
                borderRadius: '10px',
                color: C.red,
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Retirer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPOSANT DE CARTE WISHLIST
// ============================================================================
const WishlistCard = ({ 
  item, 
  onAjouterPanier, 
  onSupprimer,
  onVoirProduit,
  onVoirVendeur 
}: { 
  item: WishlistItem; 
  onAjouterPanier: () => void;
  onSupprimer: () => void;
  onVoirProduit: () => void;
  onVoirVendeur: () => void;
}) => {
  const [imageError, setImageError] = useState(false);

  const prixFinal = item.enPromo && item.pourcentagePromo 
    ? (item.prix * (1 - item.pourcentagePromo / 100)).toFixed(2)
    : item.prix.toFixed(2);

  return (
    <div
      style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: '20px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        position: 'relative',
        boxShadow: '0 10px 30px -15px rgba(0,0,0,0.5)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 20px 40px -15px rgba(0,0,0,0.7)';
        e.currentTarget.style.borderColor = `${item.couleur}80`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 10px 30px -15px rgba(0,0,0,0.5)';
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      {item.enPromo && item.pourcentagePromo && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: `linear-gradient(135deg, ${C.orange}, ${C.rose})`,
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '12px',
          fontWeight: 800,
          color: '#fff',
          zIndex: 2,
          boxShadow: '0 4px 10px rgba(249,115,22,0.3)',
        }}>
          -{item.pourcentagePromo}%
        </div>
      )}

      <div
        style={{
          height: '160px',
          background: `linear-gradient(135deg, ${item.couleur}30, ${item.couleur}10)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '64px',
          position: 'relative',
          cursor: 'pointer',
        }}
        onClick={onVoirProduit}
      >
        {!imageError && (item.image.startsWith('http') ? (
          <img 
            src={item.image} 
            alt={item.nom}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImageError(true)}
          />
        ) : (
          <span style={{ fontSize: '64px' }}>{item.image}</span>
        ))}
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSupprimer();
          }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            fontSize: '18px',
            opacity: 0,
            transition: 'opacity 0.2s',
            zIndex: 3,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = C.red;
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.5)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          🗑️
        </button>
      </div>

      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <h3 
              style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif", cursor: 'pointer' }}
              onClick={onVoirProduit}
            >
              {item.nom}
            </h3>
            <button
              onClick={onVoirVendeur}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '12px',
                color: C.textLight,
                cursor: 'pointer',
                textAlign: 'left',
                marginTop: '2px',
              }}
            >
              🏪 {item.vendeur}
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#fbbf24', fontSize: '12px' }}>★</span>
            <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>{item.note}</span>
            <span style={{ color: C.textLight, fontSize: '10px' }}>({item.nbAvis})</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', color: C.textLight }}>{item.categorie}</span>
          <StockBadge stock={item.stock} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          {item.enPromo ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{prixFinal} $</span>
              <span style={{ fontSize: '13px', color: C.textLight, textDecoration: 'line-through' }}>{item.prix.toFixed(2)} $</span>
            </div>
          ) : (
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{item.prix.toFixed(2)} $</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onAjouterPanier}
            disabled={item.stock === 'rupture'}
            style={{
              flex: 2,
              padding: '12px',
              background: item.stock === 'rupture' 
                ? 'rgba(255,255,255,0.05)' 
                : `linear-gradient(135deg, ${C.green}, #059669)`,
              border: 'none',
              borderRadius: '10px',
              color: item.stock === 'rupture' ? C.textLight : '#fff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: item.stock === 'rupture' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              if (item.stock !== 'rupture') {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = `0 10px 20px -5px ${C.green}80`;
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🛒 Ajouter au panier
          </button>
          
          <button
            onClick={onSupprimer}
            style={{
              flex: 1,
              padding: '12px',
              background: C.roseLight,
              border: `1px solid ${C.rose}40`,
              borderRadius: '10px',
              color: C.rose,
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = C.redLight;
              e.currentTarget.style.color = C.red;
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = C.roseLight;
              e.currentTarget.style.color = C.rose;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPOSANT DE CARTE SUGGESTION (compacte)
// ============================================================================
const SuggestionCard = ({ 
  item, 
  onAjouterWishlist, 
  onVoirProduit 
}: { 
  item: WishlistItem; 
  onAjouterWishlist: () => void;
  onVoirProduit: () => void;
}) => {
  return (
    <div
      style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: '16px',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        e.currentTarget.style.transform = 'translateX(5px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = C.cardBg;
        e.currentTarget.style.transform = 'translateX(0)';
      }}
      onClick={onVoirProduit}
    >
      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '12px',
        background: `linear-gradient(135deg, ${item.couleur}30, ${item.couleur}10)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '30px',
        flexShrink: 0,
      }}>
        {item.image.startsWith('http') ? (
          <img src={item.image} alt={item.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
        ) : (
          <span>{item.image}</span>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#fff' }}>{item.nom}</h4>
          {item.enPromo && item.pourcentagePromo && (
            <span style={{
              background: C.orangeLight,
              color: C.orange,
              fontSize: '9px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '10px',
            }}>
              -{item.pourcentagePromo}%
            </span>
          )}
        </div>
        <p style={{ margin: '0 0 4px', fontSize: '11px', color: C.textLight }}>🏪 {item.vendeur}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{item.prix.toFixed(2)} $</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <span style={{ color: '#fbbf24', fontSize: '10px' }}>★</span>
            <span style={{ color: '#fff', fontSize: '10px' }}>{item.note}</span>
          </div>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onAjouterWishlist();
        }}
        style={{
          padding: '8px 10px',
          background: C.pinkLight,
          border: `1px solid ${C.pink}40`,
          borderRadius: '8px',
          color: C.pink,
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        ❤️ Ajouter
      </button>
    </div>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL - Version connectée à la BD
// ============================================================================
export default function Wishlist({ naviguer }: { naviguer: (page: string, props?: any) => void }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [suggestions, setSuggestions] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreStock, setFiltreStock] = useState<string>('tous');
  const [itemASupprimer, setItemASupprimer] = useState<WishlistItem | null>(null);

  // Fonction utilitaire pour les emojis par défaut
  const getRandomEmoji = (): string => {
    const emojis = ['🎁', '📦', '✨', '⭐', '💝', '🎀', '🛍️', '💎'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  };

  // Charger la wishlist depuis l'API
  const chargerWishlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wishlist/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erreur chargement wishlist');
      }
      
      const data: ApiWishlistResponse = await response.json();
      
      // Convertir les items API au format du composant
      const itemsConvertis: WishlistItem[] = data.items.map((item: ApiWishlistItem) => {
        // Générer une couleur basée sur le nom du produit
        const hash = item.product_title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const couleurs = ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
        const couleur = couleurs[hash % couleurs.length];
        
        // Convertir les prix en nombres
        const prix = toNumber(item.price);
        const prixOriginal = item.compare_at_price ? toNumber(item.compare_at_price) : undefined;
        
        // Déterminer le stock
        const quantity = toNumber(item.quantity);
        const stock: 'disponible' | 'derniers' | 'rupture' = quantity > 10 ? 'disponible' : quantity > 0 ? 'derniers' : 'rupture';
        
        return {
          id: item.id.toString(),
          product_id: item.product_id,
          variant_id: item.variant_id,
          nom: item.product_title,
          prix: prix,
          prixOriginal: prixOriginal,
          image: item.product_image_url || getRandomEmoji(),
          vendeur: 'Boutique',
          vendeurId: '',
          note: 4.5,
          nbAvis: 0,
          enPromo: !!(prixOriginal && prixOriginal > prix),
          pourcentagePromo: (prixOriginal && prixOriginal > prix) 
            ? Math.round(((prixOriginal - prix) / prixOriginal) * 100)
            : undefined,
          stock,
          dateAjout: item.added_at.split('T')[0],
          categorie: 'Produit',
          couleur: couleur,
          quantity: quantity,
        };
      });
      
      setItems(itemsConvertis);
    } catch (error) {
      console.error('Erreur chargement wishlist:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les suggestions (recommandations similaires)
  const chargerSuggestions = async () => {
    try {
      // Tu peux remplacer par un vrai endpoint de recommandations
      // Pour l'instant, suggestions vides
      setSuggestions([]);
    } catch (error) {
      console.error('Erreur chargement suggestions:', error);
      setSuggestions([]);
    }
  };

  useEffect(() => {
    chargerWishlist();
    chargerSuggestions();
  }, []);

  // Statistiques - CORRIGÉES avec toNumber()
  const totalItems = items.length;
  const valeurTotale = items.reduce((acc, item) => acc + toNumber(item.prix), 0).toFixed(2);
  const itemsDisponibles = items.filter(i => i.stock === 'disponible' || i.stock === 'derniers').length;
  const economiesPotentielles = items
    .filter(i => i.enPromo && i.prixOriginal)
    .reduce((acc, i) => acc + (toNumber(i.prixOriginal) - toNumber(i.prix)), 0)
    .toFixed(2);

  // Filtrer les items
  const itemsFiltres = items.filter(item => {
    const matchRecherche = 
      item.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      item.vendeur.toLowerCase().includes(recherche.toLowerCase()) ||
      item.categorie.toLowerCase().includes(recherche.toLowerCase());
    
    const matchStock = filtreStock === 'tous' || item.stock === filtreStock;
    
    return matchRecherche && matchStock;
  });

  // Filtrer les suggestions
  const suggestionsFiltrees = suggestions.filter(item => {
    return item.nom.toLowerCase().includes(recherche.toLowerCase()) ||
           item.vendeur.toLowerCase().includes(recherche.toLowerCase());
  });

  // Ajouter au panier
  const ajouterAuPanier = async (item: WishlistItem) => {
    try {
      // Appel API pour ajouter au panier (à adapter selon ton système de panier)
      console.log('Ajout au panier:', item);
      alert(`🛒 ${item.nom} ajouté au panier!`);
    } catch (error) {
      console.error('Erreur ajout panier:', error);
    }
  };

  // Supprimer un item
  const supprimerItem = async (item: WishlistItem) => {
    try {
      const token = localStorage.getItem('token');
      let url = `/api/wishlist/me/items/${item.product_id}`;
      if (item.variant_id) {
        url += `?variant_id=${item.variant_id}`;
      }
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erreur suppression');
      }
      
      // Recharger la wishlist après suppression
      await chargerWishlist();
      setItemASupprimer(null);
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // Ajouter une suggestion à la wishlist
  const ajouterSuggestion = async (item: WishlistItem) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wishlist/me/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: item.product_id,
          product_title: item.nom,
          variant_id: item.variant_id,
          price: toNumber(item.prix),
          compare_at_price: item.prixOriginal ? toNumber(item.prixOriginal) : null,
          quantity: 1,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur ajout');
      }
      
      await chargerWishlist();
      alert(`✅ ${item.nom} ajouté à votre wishlist!`);
    } catch (error) {
      console.error('Erreur ajout suggestion:', error);
      alert('Erreur lors de l\'ajout');
    }
  };

  const voirProduit = (item: WishlistItem) => {
    naviguer('produit', { id: item.product_id, variantId: item.variant_id });
  };

  const voirVendeur = (item: WishlistItem) => {
    naviguer('vendeur', { id: item.vendeurId });
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: `3px solid ${C.border}`,
          borderTopColor: C.rose,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeUp 0.5s ease' }}>
      {/* En-tête avec statistiques */}
      <div style={{
        background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
        borderRadius: '24px',
        padding: '32px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          left: '-50px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
            ❤️ Ma liste de souhaits
          </h1>
          <p style={{ margin: 0, fontSize: '16px', color: 'rgba(255,255,255,0.8)', maxWidth: '500px' }}>
            Retrouvez tous vos coups de cœur et partagez-les avec vos proches.
          </p>
          
          {/* Statistiques rapides */}
          <div style={{ display: 'flex', gap: '32px', marginTop: '24px' }}>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{totalItems}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Articles</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{valeurTotale} $</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Valeur totale</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{itemsDisponibles}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Disponibles</div>
            </div>
            {Number(economiesPotentielles) > 0 && (
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{economiesPotentielles} $</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Économies potentielles</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'tous', label: 'Tous' },
            { id: 'disponible', label: '✅ Disponibles' },
            { id: 'derniers', label: '⚠️ Derniers' },
            { id: 'rupture', label: '❌ Rupture' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltreStock(f.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '30px',
                border: 'none',
                background: filtreStock === f.id ? C.rose : 'rgba(255,255,255,0.05)',
                color: filtreStock === f.id ? '#fff' : C.textLight,
                fontSize: '13px',
                fontWeight: filtreStock === f.id ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="🔍 Rechercher dans ma wishlist..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '30px',
            border: `1px solid ${C.border}`,
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '13px',
            outline: 'none',
            width: '280px',
          }}
        />
      </div>

      {/* Section Wishlist */}
      {itemsFiltres.length > 0 ? (
        <>
          <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif", display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📋 Mes articles</span>
            <span style={{ fontSize: '13px', color: C.textLight }}>({itemsFiltres.length} article{itemsFiltres.length > 1 ? 's' : ''})</span>
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '20px',
            marginBottom: '40px'
          }}>
            {itemsFiltres.map(item => (
              <WishlistCard
                key={item.id}
                item={item}
                onAjouterPanier={() => ajouterAuPanier(item)}
                onSupprimer={() => setItemASupprimer(item)}
                onVoirProduit={() => voirProduit(item)}
                onVoirVendeur={() => voirVendeur(item)}
              />
            ))}
          </div>
        </>
      ) : (
        !loading && (
          <div style={{ 
            padding: '60px', 
            textAlign: 'center', 
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '20px',
            border: `1px dashed ${C.border}`,
            marginBottom: '40px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>❤️</div>
            <p style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Votre liste de souhaits est vide</p>
            <p style={{ color: C.textLight, fontSize: '13px' }}>Explorez nos suggestions ci-dessous pour ajouter vos premiers articles!</p>
          </div>
        )
      )}

      {/* Section Suggestions */}
      {suggestionsFiltrees.length > 0 && (
        <>
          <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif", display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✨ Suggestions pour vous</span>
            <span style={{ fontSize: '13px', color: C.textLight }}>Basé sur vos goûts</span>
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {suggestionsFiltrees.map(item => (
              <SuggestionCard
                key={item.id}
                item={item}
                onAjouterWishlist={() => ajouterSuggestion(item)}
                onVoirProduit={() => voirProduit(item)}
              />
            ))}
          </div>
        </>
      )}

      {/* Popup de confirmation suppression */}
      {itemASupprimer && (
        <ConfirmationPopup
          item={itemASupprimer}
          onConfirm={() => supprimerItem(itemASupprimer)}
          onCancel={() => setItemASupprimer(null)}
        />
      )}
    </div>
  );
}
