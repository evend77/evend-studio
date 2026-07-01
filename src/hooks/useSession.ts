// src/hooks/useSession.ts
// Gestion session JWT — expiration 30 min, renouvellement auto si actif

import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = 'https://evend-multivendeur-api.onrender.com/api';
const INACTIVITE_MS = 30 * 60 * 1000; // 30 minutes
const VERIF_INTERVAL_MS = 60 * 1000;   // Vérifier toutes les 60 secondes
const RENOUVELLEMENT_MS = 5 * 60 * 1000; // Renouveler si < 5 min restantes

export interface SessionUser {
  id: number;
  email: string;
  nom?: string;
  prenom?: string;
  role: 'acheteur' | 'vendeur' | 'admin';
  statut?: string;
}

export interface SessionState {
  user: SessionUser | null;
  connecte: boolean;
  expire: boolean;
  loading: boolean;
}

export function useSession() {
  const [state, setState] = useState<SessionState>({
    user: null,
    connecte: false,
    expire: false,
    loading: true,
  });

  const dernierActivite = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Enregistrer toute activité utilisateur
  const enregistrerActivite = useCallback(() => {
    dernierActivite.current = Date.now();
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, enregistrerActivite, { passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, enregistrerActivite));
  }, [enregistrerActivite]);

  // Vérifier et renouveler le token
  const verifierSession = useCallback(async () => {
    const token = localStorage.getItem('token');
    const expireAt = localStorage.getItem('token_expire_at');

    if (!token || !expireAt) {
      setState(s => ({ ...s, connecte: false, user: null, loading: false }));
      return;
    }

    const maintenant = Date.now();
    const expiration = parseInt(expireAt);
    const inactivite = maintenant - dernierActivite.current;

    // Inactif depuis trop longtemps → expirer
    if (inactivite >= INACTIVITE_MS) {
      expirer();
      return;
    }

    // Token expiré côté temps → expirer
    if (maintenant >= expiration) {
      expirer();
      return;
    }

    // Token proche de l'expiration ET utilisateur actif → renouveler
    if (expiration - maintenant < RENOUVELLEMENT_MS && inactivite < INACTIVITE_MS) {
      await renouvelerToken(token);
      return;
    }

    // Token valide — charger user si pas encore chargé
    if (!state.connecte) {
      await chargerUser(token);
    }
  }, [state.connecte]);

  const chargerUser = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Token invalide');
      const data = await res.json();
      setState({ user: data.user, connecte: true, expire: false, loading: false });
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('token_expire_at');
      setState({ user: null, connecte: false, expire: false, loading: false });
    }
  };

  const renouvelerToken = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Refresh échoué');
      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('token_expire_at', String(Date.now() + INACTIVITE_MS));
      setState(s => ({ ...s, user: data.user, connecte: true, expire: false, loading: false }));
    } catch {
      expirer();
    }
  };

  const expirer = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('token_expire_at');
    setState({ user: null, connecte: false, expire: true, loading: false });
  };

  // Initialisation
  useEffect(() => {
    verifierSession();
  }, []);

  // Vérification périodique
  useEffect(() => {
    intervalRef.current = setInterval(verifierSession, VERIF_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [verifierSession]);

  // Login
  const login = useCallback((token: string, user: SessionUser) => {
    localStorage.setItem('token', token);
    localStorage.setItem('token_expire_at', String(Date.now() + INACTIVITE_MS));
    localStorage.setItem('user', JSON.stringify(user));
    dernierActivite.current = Date.now();
    setState({ user, connecte: true, expire: false, loading: false });
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('token_expire_at');
    localStorage.removeItem('user');
    setState({ user: null, connecte: false, expire: false, loading: false });
  }, []);

  // Rejeter le popup expiration (fermer sans login)
  const dismissExpire = useCallback(() => {
    setState(s => ({ ...s, expire: false }));
  }, []);

  return { ...state, login, logout, dismissExpire };
}