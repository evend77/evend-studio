// src/hooks/useWishlist.ts
import { useState, useEffect, useCallback } from 'react';

interface WishlistItem {
  product_id: string;
  variant_id?: string;
}

interface UseWishlistReturn {
  wishlistIds: Set<string>;
  isLoading: boolean;
  isInWishlist: (productId: string, variantId?: string) => boolean;
  addToWishlist: (productId: string, variantId?: string, productData?: any) => Promise<boolean>;
  removeFromWishlist: (productId: string, variantId?: string) => Promise<boolean>;
  toggleWishlist: (productId: string, variantId?: string, productData?: any) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
}

// Génère une clé unique pour un produit (avec variante)
const getWishlistKey = (productId: string, variantId?: string): string => {
  return variantId ? `${productId}-${variantId}` : productId;
};

export function useWishlist(): UseWishlistReturn {
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsConnected(!!token);
  }, []);

  // Récupérer la wishlist depuis l'API
  const refreshWishlist = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    // Si non connecté, wishlist vide
    if (!token) {
      setWishlistIds(new Set());
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/wishlist/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur chargement wishlist');
      }

      const data = await response.json();
      const ids = new Set<string>();
      
      if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item: any) => {
          ids.add(getWishlistKey(item.product_id, item.variant_id));
        });
      }
      
      setWishlistIds(ids);
    } catch (error) {
      console.error('Erreur refresh wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Vérifier si un produit est dans la wishlist
  const isInWishlist = useCallback((productId: string, variantId?: string): boolean => {
    return wishlistIds.has(getWishlistKey(productId, variantId));
  }, [wishlistIds]);

  // Ajouter à la wishlist
  const addToWishlist = useCallback(async (
    productId: string, 
    variantId?: string, 
    productData?: any
  ): Promise<boolean> => {
    const token = localStorage.getItem('token');
    
    // Vérifier connexion
    if (!token) {
      // Popup de connexion (sera géré par le composant)
      return false;
    }

    try {
      const response = await fetch('/api/wishlist/me/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          variant_id: variantId,
          product_title: productData?.title || '',
          product_handle: productData?.handle || '',
          product_image_url: productData?.imageUrl || '',
          variant_title: productData?.variantTitle || '',
          price: productData?.price || 0,
          compare_at_price: productData?.compareAtPrice || null,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur ajout wishlist');
      }

      // Mettre à jour l'état local
      setWishlistIds(prev => new Set(prev).add(getWishlistKey(productId, variantId)));
      return true;
    } catch (error) {
      console.error('Erreur addToWishlist:', error);
      return false;
    }
  }, []);

  // Retirer de la wishlist
  const removeFromWishlist = useCallback(async (
    productId: string, 
    variantId?: string
  ): Promise<boolean> => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return false;
    }

    try {
      let url = `/api/wishlist/me/items/${productId}`;
      if (variantId) {
        url += `?variant_id=${variantId}`;
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur suppression wishlist');
      }

      // Mettre à jour l'état local
      setWishlistIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(getWishlistKey(productId, variantId));
        return newSet;
      });
      return true;
    } catch (error) {
      console.error('Erreur removeFromWishlist:', error);
      return false;
    }
  }, []);

  // Ajouter/retirer (toggle)
  const toggleWishlist = useCallback(async (
    productId: string, 
    variantId?: string, 
    productData?: any
  ): Promise<boolean> => {
    const token = localStorage.getItem('token');
    
    // Si non connecté, retourner false (le composant gérera l'affichage du popup)
    if (!token) {
      return false;
    }

    const isCurrentlyIn = isInWishlist(productId, variantId);
    
    if (isCurrentlyIn) {
      return await removeFromWishlist(productId, variantId);
    } else {
      return await addToWishlist(productId, variantId, productData);
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist]);

  // Charger la wishlist au montage et quand le token change
  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  // Écouter les changements de token (login/logout)
  useEffect(() => {
    const handleStorageChange = () => {
      refreshWishlist();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshWishlist]);

  return {
    wishlistIds,
    isLoading,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    refreshWishlist,
  };
}