/**
 * VendeursFavoris.tsx
 * src/pages/acheteur/VendeursFavoris.tsx
 * Page des vendeurs favoris de l'acheteur - Connectée à l'API
 */

import React, { useState, useEffect } from 'react';

// Types
interface Vendeur {
  id: number;
  nom_boutique: string;
  email?: string;
  logo_url?: string;
  banniere_url?: string;
  categorie?: string;
  note_moyenne: number;
  nombre_avis: number;
  total_produits: number;
  date_inscription: string;
  region?: string;
  zone_expedition?: string;
  estFavori: boolean;
  badge?: 'top_vendeur' | 'nouveau' | 'certifie' | 'local';
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
  border: 'rgba(0,0,0,0.08)',
  textLight: 'rgba(0,0,0,0.5)',
  cardBg: '#DCD7C9',
};

// Calcul du temps de réponse moyen basé sur la note
const getReponseMoyenne = (note: number): string => {
  if (note >= 4.9) return '< 30 min';
  if (note >= 4.8) return '< 1 heure';
  if (note >= 4.7) return '< 2 heures';
  if (note >= 4.6) return '< 3 heures';
  if (note >= 4.5) return '< 4 heures';
  return '< 24 heures';
};

// Formatage de la date d'adhésion
const getMembreDepuis = (date: string): string => {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long' });
};

// Déterminer le badge en fonction des stats du vendeur
const getBadge = (vendeur: Vendeur): 'top_vendeur' | 'nouveau' | 'certifie' | 'local' | undefined => {
  if (vendeur.note_moyenne >= 4.8 && vendeur.nombre_avis >= 100) {
    return 'top_vendeur';
  }
  const dateInscription = new Date(vendeur.date_inscription);
  const now = new Date();
  const moisDiff = (now.getFullYear() - dateInscription.getFullYear()) * 12 + now.getMonth() - dateInscription.getMonth();
  if (moisDiff <= 3) {
    return 'nouveau';
  }
  if (vendeur.note_moyenne >= 4.5 && vendeur.nombre_avis >= 50) {
    return 'certifie';
  }
  if (vendeur.region && vendeur.region.includes('QC')) {
    return 'local';
  }
  return undefined;
};

// ============================================================================
// BADGES SPÉCIAUX
// ============================================================================
const BadgeVendeur = ({ badge }: { badge?: 'top_vendeur' | 'nouveau' | 'certifie' | 'local' }) => {
  if (!badge) return null;

  const config = {
    top_vendeur: { bg: C.amberLight, color: C.amber, icon: '🏆', label: 'Top vendeur' },
    nouveau: { bg: C.greenLight, color: C.green, icon: '🆕', label: 'Nouveau' },
    certifie: { bg: C.blueLight, color: C.blue, icon: '✅', label: 'Certifié' },
    local: { bg: C.purpleLight, color: C.purple, icon: '📍', label: 'Local' },
  };

  const { bg, color, icon, label } = config[badge];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '10px',
      fontWeight: 700,
      padding: '3px 8px',
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
// COMPOSANT DE CARTE VENDEUR
// ============================================================================
const CarteVendeurFavori = ({ vendeur, onToggleFavori, onVisiter }: { vendeur: Vendeur; onToggleFavori: () => void; onVisiter: () => void }) => {
  const [logoError, setLogoError] = useState(false);
  const [banniereError, setBanniereError] = useState(false);

  return (
    <div
      style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: '24px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        position: 'relative',
        cursor: 'pointer',
        boxShadow: '0 10px 30px -15px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 20px 40px -15px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 10px 30px -15px rgba(0,0,0,0.1)';
      }}
      onClick={onVisiter}
    >
      {/* Bannière de couverture */}
      <div
        style={{
          height: '100px',
          background: banniereError || !vendeur.banniere_url 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
            : `url(${vendeur.banniere_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        {!banniereError && vendeur.banniere_url && (
          <img 
            src={vendeur.banniere_url} 
            alt="Bannière"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setBanniereError(true)}
          />
        )}
        
        {/* Bouton favori (coeur) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavori();
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
            color: '#ef4444',
            fontSize: '18px',
            transition: 'all 0.2s',
            zIndex: 10,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.7)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.5)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ❤️
        </button>
      </div>

      {/* Logo */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: '#fff',
          border: `3px solid #537373`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '-40px auto 0',
          position: 'relative',
          zIndex: 2,
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}
      >
        {!logoError && vendeur.logo_url ? (
          <img 
            src={vendeur.logo_url} 
            alt={vendeur.nom_boutique}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setLogoError(true)}
          />
        ) : (
          <span style={{ fontSize: '32px' }}>🏪</span>
        )}
      </div>

      {/* Contenu */}
      <div style={{ padding: '16px 20px 20px' }}>
        {/* Nom et badge */}
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#2c3e50', fontFamily: "'Sora', sans-serif" }}>
            {vendeur.nom_boutique}
          </h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
            <BadgeVendeur badge={getBadge(vendeur)} />
          </div>
        </div>

        {/* Catégorie - affichage en texte simple sans HTML */}
        {vendeur.categorie && (
          <div style={{
            background: '#FF6D37',
            borderRadius: '20px',
            padding: '6px 12px',
            marginBottom: '25px',
            textAlign: 'center',
            fontSize: '11px',
            color: '#FFFFFF',
            maxHeight: '60px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
             lineHeight: '1.5',
          }}>
            {vendeur.categorie}
          </div>
        )}

        {/* Statistiques */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '16px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#2c3e50' }}>{vendeur.note_moyenne.toFixed(1)}</div>
            <div style={{ fontSize: '10px', color: '#666', display: 'flex', justifyContent: 'center', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <span key={s} style={{ color: s <= Math.round(vendeur.note_moyenne) ? '#fbbf24' : '#ddd' }}>★</span>
              ))}
            </div>
            <div style={{ fontSize: '9px', color: '#999', marginTop: '2px' }}>({vendeur.nombre_avis} avis)</div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#2c3e50' }}>{vendeur.total_produits || 0}</div>
            <div style={{ fontSize: '10px', color: '#666' }}>Produits</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#2c3e50' }}>{getReponseMoyenne(vendeur.note_moyenne)}</div>
            <div style={{ fontSize: '10px', color: '#666' }}>Réponse</div>
          </div>
        </div>

        {/* Infos supplémentaires */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: '#666',
          marginBottom: '16px',
          padding: '8px 0',
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
        }}>
          <span>📅 Membre depuis {getMembreDepuis(vendeur.date_inscription)}</span>
          <span>📍 {vendeur.region || vendeur.zone_expedition || 'Canada'}</span>
        </div>

        {/* Bouton visiter la boutique */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVisiter();
          }}
          style={{
            width: '100%',
            padding: '12px',
            background: `linear-gradient(135deg, #537373, #70a9a1)`,
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = `0 10px 20px -5px #53737380`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          🏪 Visiter la boutique
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// COMPOSANT DE CARTE SUGGESTION
// ============================================================================
const CarteSuggestion = ({ vendeur, onAjouterFavori, onVisiter }: { vendeur: Vendeur; onAjouterFavori: () => void; onVisiter: () => void }) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <div
      style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#f5f0e8';
        e.currentTarget.style.transform = 'translateX(5px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = C.cardBg;
        e.currentTarget.style.transform = 'translateX(0)';
      }}
      onClick={onVisiter}
    >
      {/* Logo */}
      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '16px',
        background: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {!logoError && vendeur.logo_url ? (
          <img 
            src={vendeur.logo_url} 
            alt={vendeur.nom_boutique}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setLogoError(true)}
          />
        ) : (
          <span style={{ fontSize: '30px' }}>🏪</span>
        )}
      </div>

      {/* Infos */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#2c3e50' }}>{vendeur.nom_boutique}</h4>
          <BadgeVendeur badge={getBadge(vendeur)} />
        </div>
        {vendeur.categorie && (
          <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#666', maxHeight: '40px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {vendeur.categorie}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(s => (
              <span key={s} style={{ fontSize: '12px', color: s <= Math.round(vendeur.note_moyenne) ? '#fbbf24' : '#ddd' }}>★</span>
            ))}
            <span style={{ fontSize: '11px', color: '#666', marginLeft: '4px' }}>{vendeur.note_moyenne.toFixed(1)} ({vendeur.nombre_avis})</span>
          </div>
          <span style={{ fontSize: '11px', color: '#666' }}>📍 {vendeur.region || vendeur.zone_expedition || 'Canada'}</span>
          <span style={{ fontSize: '11px', color: '#666' }}>📦 {vendeur.total_produits || 0} produits</span>
        </div>
      </div>

      {/* Bouton ajouter */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAjouterFavori();
        }}
        style={{
          padding: '8px 12px',
          background: '#e8f5e9',
          border: `1px solid #4caf5040`,
          borderRadius: '8px',
          color: '#2e7d32',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        + Ajouter aux favoris
      </button>
    </div>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export default function VendeursFavoris({ naviguer }: { naviguer: (page: string, props?: any) => void }) {
  const [vendeurs, setVendeurs] = useState<Vendeur[]>([]);
  const [suggestions, setSuggestions] = useState<Vendeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');

  console.log('🔵🔵🔵 VENDEURS FAVORIS - COMPOSANT MONTÉ 🔵🔵🔵');

  // Récupérer l'ID de l'acheteur connecté
  const getAcheteurId = async (): Promise<number | null> => {
    console.log('🔵 getAcheteurId - Début');
    const token = localStorage.getItem('token');
    console.log('🔵 Token présent?', token ? 'OUI' : 'NON');
    if (!token) return null;
    
    try {
      console.log('🔵 Appel à /api/auth/verify');
      const response = await fetch('https://evend-multivendeur-api.onrender.com/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('🔵 Réponse auth/verify:', data);
      if (data.user && data.user.role === 'acheteur') {
        console.log('🔵 ID acheteur trouvé:', data.user.id);
        return data.user.id;
      }
      console.log('🔵 Pas d\'acheteur valide');
      return null;
    } catch (error) {
      console.error('Erreur récupération acheteur:', error);
      return null;
    }
  };

  // Récupérer la liste des vendeurs favoris
  const chargerFavoris = async () => {
    console.log('🔵🔵🔵 chargerFavoris - DÉBUT 🔵🔵🔵');
    const acheteurId = await getAcheteurId();
    console.log('🔵 acheteurId récupéré:', acheteurId);
    if (!acheteurId) {
      console.log('🔵 Pas d\'acheteurId, arrêt');
      setLoading(false);
      return;
    }

    try {
      const url = `https://evend-multivendeur-api.onrender.com/api/favoris/acheteur/${acheteurId}/vendeurs`;
      console.log('🔵 Appel API:', url);
      const response = await fetch(url, {
        headers: {
          'x-acheteur-id': acheteurId.toString()
        }
      });
      console.log('🔵 Statut réponse:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        // Convertir note_moyenne en nombre et nettoyer la catégorie (enlever les balises HTML)
        const dataConverted = data.map((v: any) => ({
          ...v,
          note_moyenne: parseFloat(v.note_moyenne),
          // Enlever les balises HTML et limiter à 150 caractères
          categorie: v.categorie ? v.categorie.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : ''
        }));
        console.log('🔵 Données reçues (', dataConverted.length, 'vendeurs):', dataConverted);
        setVendeurs(dataConverted);
      } else {
        const errorText = await response.text();
        console.log('🔵 Erreur réponse:', response.status, errorText);
        setError(`Erreur ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erreur chargement favoris:', error);
      setError('Impossible de charger vos favoris');
    } finally {
      console.log('🔵 Fin chargement favoris');
      setLoading(false);
    }
  };

  // Récupérer les suggestions (vendeurs populaires non favoris)
  const chargerSuggestions = async () => {
    console.log('🔵 chargerSuggestions - DÉBUT');
    try {
      const response = await fetch('https://evend-multivendeur-api.onrender.com/api/vendeurs/populaires?limit=10');
      console.log('🔵 Suggestions statut:', response.status);
      if (response.ok) {
        const data = await response.json();
        // Convertir note_moyenne en nombre et nettoyer la catégorie
        const dataConverted = data.map((v: any) => ({
          ...v,
          note_moyenne: parseFloat(v.note_moyenne),
          categorie: v.categorie ? v.categorie.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : ''
        }));
        console.log('🔵 Suggestions reçues:', dataConverted.length);
        // Filtrer pour enlever ceux déjà dans les favoris
        const idsFavoris = vendeurs.map(v => v.id);
        const suggestionsFiltrees = dataConverted.filter((v: Vendeur) => !idsFavoris.includes(v.id));
        setSuggestions(suggestionsFiltrees);
        console.log('🔵 Suggestions après filtre:', suggestionsFiltrees.length);
      }
    } catch (error) {
      console.error('Erreur chargement suggestions:', error);
    }
  };

  useEffect(() => {
    console.log('🔵 useEffect - Chargement initial des favoris');
    chargerFavoris();
  }, []);

  useEffect(() => {
    console.log('🔵 useEffect - vendeurs changés, nb:', vendeurs.length);
    if (vendeurs.length > 0) {
      chargerSuggestions();
    }
  }, [vendeurs]);

  // Retirer des favoris
  const retirerFavori = async (vendeurId: number) => {
    console.log('🔵 retirerFavori - vendeurId:', vendeurId);
    const acheteurId = await getAcheteurId();
    if (!acheteurId) return;

    try {
      const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/favoris/vendeur/${vendeurId}/favori`, {
        method: 'DELETE',
        headers: {
          'x-acheteur-id': acheteurId.toString()
        }
      });
      
      if (response.ok) {
        setVendeurs(prev => prev.filter(v => v.id !== vendeurId));
        console.log('🔵 Vendeur retiré des favoris');
      }
    } catch (error) {
      console.error('Erreur retrait favori:', error);
    }
  };

  // Ajouter aux favoris
  const ajouterFavori = async (vendeur: Vendeur) => {
    console.log('🔵 ajouterFavori - vendeur:', vendeur.id, vendeur.nom_boutique);
    const acheteurId = await getAcheteurId();
    if (!acheteurId) return;

    try {
      const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/favoris/vendeur/${vendeur.id}/favori`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-acheteur-id': acheteurId.toString()
        }
      });
      
      if (response.ok) {
        setVendeurs(prev => [...prev, { ...vendeur, estFavori: true }]);
        setSuggestions(prev => prev.filter(v => v.id !== vendeur.id));
        console.log('🔵 Vendeur ajouté aux favoris');
      }
    } catch (error) {
      console.error('Erreur ajout favori:', error);
    }
  };

  const visiterBoutique = (vendeur: Vendeur) => {
    console.log('🔵 Visiter boutique:', vendeur.id, vendeur.nom_boutique);
    window.open(`/boutique/${vendeur.id}`, '_blank');
  };

  // Filtrer les vendeurs favoris par recherche
  const vendeursFiltres = vendeurs.filter(v => {
    const matchRecherche = 
      v.nom_boutique?.toLowerCase().includes(recherche.toLowerCase()) ||
      v.categorie?.toLowerCase().includes(recherche.toLowerCase());
    return matchRecherche;
  });

  // Filtrer les suggestions par recherche
  const suggestionsFiltrees = suggestions.filter(v => {
    const matchRecherche = 
      v.nom_boutique?.toLowerCase().includes(recherche.toLowerCase()) ||
      v.categorie?.toLowerCase().includes(recherche.toLowerCase());
    return matchRecherche;
  });

  // Statistiques
  const totalProduits = vendeurs.reduce((acc, v) => acc + (v.total_produits || 0), 0);
  const totalAvis = vendeurs.reduce((acc, v) => acc + (v.nombre_avis || 0), 0);
  const noteMoyenneGlobale = vendeurs.length > 0 
    ? (vendeurs.reduce((acc, v) => acc + v.note_moyenne, 0) / vendeurs.length).toFixed(1)
    : '0';

  console.log('🔵 Rendu final - vendeurs:', vendeurs.length, 'loading:', loading);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: `3px solid #e0e0e0`,
          borderTop: `3px solid #537373`,
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ color: '#666' }}>Chargement de vos favoris...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#e74c3c' }}>
        <p>Erreur: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeUp 0.5s ease' }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* En-tête avec statistiques */}
      <div style={{
        background: 'linear-gradient(135deg, #537373 0%, #70a9a1 100%)',
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
          <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: 800, color: '#fff' }}>
            🏪 Mes vendeurs préférés
          </h1>
          <p style={{ margin: 0, fontSize: '16px', color: 'rgba(255,255,255,0.8)', maxWidth: '500px' }}>
            Retrouvez tous vos vendeurs favoris au même endroit.
          </p>
          
          <div style={{ display: 'flex', gap: '32px', marginTop: '24px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{vendeurs.length}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Vendeurs favoris</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{totalProduits.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Produits disponibles</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{totalAvis.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Avis cumulés</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{noteMoyenneGlobale}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Note moyenne</div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        marginBottom: '24px'
      }}>
        <input
          type="text"
          placeholder="🔍 Rechercher un vendeur..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '30px',
            border: `1px solid #e0e0e0`,
            background: '#fff',
            color: '#333',
            fontSize: '13px',
            outline: 'none',
            width: '250px',
          }}
        />
      </div>

      {/* Section Vendeurs favoris */}
      {vendeursFiltres.length > 0 ? (
        <>
          <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⭐ Mes favoris</span>
            <span style={{ fontSize: '13px', color: '#666' }}>({vendeursFiltres.length} vendeurs)</span>
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '20px',
            marginBottom: '40px'
          }}>
            {vendeursFiltres.map(vendeur => (
              <CarteVendeurFavori
                key={vendeur.id}
                vendeur={vendeur}
                onToggleFavori={() => retirerFavori(vendeur.id)}
                onVisiter={() => visiterBoutique(vendeur)}
              />
            ))}
          </div>
        </>
      ) : (
        <div style={{ 
          padding: '60px', 
          textAlign: 'center', 
          background: '#f8f9fa',
          borderRadius: '20px',
          border: `1px dashed #ddd`,
          marginBottom: '40px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🏪</div>
          <p style={{ color: '#333', fontSize: '16px', marginBottom: '8px' }}>Aucun vendeur favori pour le moment</p>
          <p style={{ color: '#666', fontSize: '13px' }}>Ajoutez des vendeurs depuis leur boutique publique en cliquant sur "Vendeur Favori"</p>
        </div>
      )}

      {/* Section Suggestions */}
      {suggestionsFiltrees.length > 0 && (
        <>
          <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✨ Suggestions pour vous</span>
            <span style={{ fontSize: '13px', color: '#666' }}>Découvrez ces boutiques</span>
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {suggestionsFiltrees.map(vendeur => (
              <CarteSuggestion
                key={vendeur.id}
                vendeur={vendeur}
                onAjouterFavori={() => ajouterFavori(vendeur)}
                onVisiter={() => visiterBoutique(vendeur)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
