// src/components/WishlistButton.tsx
import React, { useState, useEffect } from 'react';
import { useWishlist } from '../hooks/useWishlist';

interface WishlistButtonProps {
  productId: string;
  variantId?: string;
  productData?: {
    title: string;
    handle?: string;
    imageUrl?: string;
    variantTitle?: string;
    price: number;
    compareAtPrice?: number;
  };
  size?: number;
  className?: string;
  showTooltip?: boolean;
  onToggle?: (isInWishlist: boolean) => void;
  onNeedLogin?: () => void;
}

// Configuration des styles selon la préférence
interface IconStyle {
  icon: string;
  colorInactive: string;
  colorActive: string;
}

const ICON_STYLES: Record<string, IconStyle> = {
  coeur: { icon: '❤️', colorInactive: '#9ca3af', colorActive: '#ef4444' },
  etoile: { icon: '⭐', colorInactive: '#9ca3af', colorActive: '#fbbf24' },
  signet: { icon: '🔖', colorInactive: '#9ca3af', colorActive: '#2d6a9f' },
};

// Configuration des animations
const ANIMATIONS = {
  rebond: 'bounce 0.3s ease',
  echelle: 'scale 0.2s ease',
  fondu: 'fade 0.2s ease',
  aucune: 'none',
};

export default function WishlistButton({
  productId,
  variantId,
  productData,
  size = 24,
  className = '',
  showTooltip = true,
  onToggle,
  onNeedLogin,
}: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist, isLoading } = useWishlist();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Charger la config depuis l'API (style d'icône, animation)
  const [iconStyle, setIconStyle] = useState<string>('coeur');
  const [animation, setAnimation] = useState<string>('echelle');
  const [configLoaded, setConfigLoaded] = useState(false);

  // Récupérer la configuration de la wishlist (style d'icône, animation)
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/wishlist/config');
        const config = await response.json();
        if (config.wishlistIcon) {
          setIconStyle(config.wishlistIcon.styleIcone || 'coeur');
          setAnimation(config.wishlistIcon.animation || 'echelle');
        }
      } catch (error) {
        console.error('Erreur chargement config wishlist:', error);
      } finally {
        setConfigLoaded(true);
      }
    };
    loadConfig();
  }, []);

  const inWishlist = isInWishlist(productId, variantId);
  const currentStyle = ICON_STYLES[iconStyle] || ICON_STYLES.coeur;
  const animationStyle = ANIMATIONS[animation] || ANIMATIONS.echelle;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('token');
    
    // Vérifier si l'utilisateur est connecté
    if (!token) {
      setShowLoginPopup(true);
      if (onNeedLogin) onNeedLogin();
      return;
    }

    // Déclencher l'animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    const result = await toggleWishlist(productId, variantId, productData);
    
    if (onToggle) {
      onToggle(!inWishlist);
    }
  };

  const closeLoginPopup = () => {
    setShowLoginPopup(false);
  };

  // CSS pour les animations
  const animationCss = `
    @keyframes bounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.3); }
    }
    @keyframes scale {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
    @keyframes fade {
      0% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  `;

  // Si la config n'est pas encore chargée, ne pas afficher le bouton
  if (!configLoaded) {
    return null;
  }

  return (
    <>
      <style>{animationCss}</style>
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={isLoading}
        className={`wishlist-button ${className}`}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: isLoading ? 'wait' : 'pointer',
          padding: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          fontSize: `${size}px`,
          transition: 'all 0.2s ease',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          animation: isAnimating ? animationStyle : 'none',
        }}
        aria-label={inWishlist ? 'Retirer de la wishlist' : 'Ajouter à la wishlist'}
      >
        <span
          style={{
            fontSize: `${size}px`,
            filter: inWishlist ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none',
            opacity: isLoading ? 0.5 : 1,
            color: inWishlist ? currentStyle.colorActive : currentStyle.colorInactive,
          }}
        >
          {currentStyle.icon}
        </span>
        
        {/* Tooltip au survol */}
        {showTooltip && isHovered && !isLoading && (
          <span
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: '8px',
              padding: '4px 8px',
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(4px)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 500,
              borderRadius: '6px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            {inWishlist ? 'Retirer de ma liste' : 'Ajouter à ma liste d\'envies'}
          </span>
        )}
      </button>

      {/* Popup connexion requise */}
      {showLoginPopup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(5px)',
          }}
          onClick={(e) => e.target === e.currentTarget && closeLoginPopup()}
        >
          <div
            style={{
              maxWidth: '400px',
              width: '100%',
              background: '#1a1f2e',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                padding: '24px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>❤️</span> Connexion requise
              </h2>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#fff', lineHeight: 1.5 }}>
                Vous devez être connecté pour ajouter des articles à votre liste d'envies.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={closeLoginPopup}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Plus tard
                </button>
                <button
                  onClick={() => {
                    closeLoginPopup();
                    // Rediriger vers la page de connexion
                    window.location.href = '/connexion';
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Se connecter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}