// src/components/PopupAnnonce.tsx
// e-Vend Studio — Add-On Popup Annonce
// S'injecte dans SitePreview — s'affiche sur tous les templates

import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

interface ConfigPopupAnnonce {
  actif: boolean;
  type_affichage: 'popup' | 'banniere_haut' | 'banniere_bas';
  titre: string;
  message: string;
  bouton_label: string;
  bouton_url: string;
  bouton_actif: boolean;
  couleur_fond: string;
  couleur_texte: string;
  couleur_bouton: string;
  delai_secondes: number;
  fermeture_auto: boolean;
  fermeture_auto_secondes: number;
  se_souvenir_heures: number;
  icone: string;
  date_debut?: string;
  date_fin?: string;
}

const CFG_DEF: ConfigPopupAnnonce = {
  actif: true,
  type_affichage: 'popup',
  titre: 'Annonce importante',
  message: 'Profitez de notre offre spéciale limitée dans le temps !',
  bouton_label: 'En savoir plus',
  bouton_url: '',
  bouton_actif: true,
  couleur_fond: '#1a1a2e',
  couleur_texte: '#ffffff',
  couleur_bouton: '#e63946',
  delai_secondes: 2,
  fermeture_auto: false,
  fermeture_auto_secondes: 10,
  se_souvenir_heures: 24,
  icone: '📢',
};

const CLE = (id: number) => `evend_annonce_vu_${id}`;

interface Props { vendeurId: number; configOverride?: Partial<ConfigPopupAnnonce>; }

export default function PopupAnnonce({ vendeurId, configOverride }: Props) {
  const [cfg, setCfg] = useState<ConfigPopupAnnonce | null>(null);
  const [visible, setVisible] = useState(false);
  const [compte, setCompte] = useState(0);

  useEffect(() => {
    const charger = async () => {
      try {
        // Vérifier d'abord si l'add-on est activé dans les options
        const resOpts = await fetch(`${API_BASE}/gestionnaires/${vendeurId}/options`);
        if (resOpts.ok) {
          const opts = await resOpts.json();
          if (!opts.popup_annonce) return; // Add-on désactivé
        }

        const res = await fetch(`${API_BASE}/gestionnaires/${vendeurId}/popup-annonce`);
        const data = res.ok ? await res.json() : {};
        const config: ConfigPopupAnnonce = { ...CFG_DEF, ...data, ...configOverride };
        setCfg(config);
        if (!config.actif) return;

        // Vérifier dates
        const now = new Date();
        if (config.date_debut && new Date(config.date_debut) > now) return;
        if (config.date_fin   && new Date(config.date_fin)   < now) return;

        // Vérifier si déjà vu
        const cle = CLE(vendeurId);
        const sauvegarde = localStorage.getItem(cle);
        if (sauvegarde) {
          const { expiry } = JSON.parse(sauvegarde);
          if (Date.now() < expiry) return;
          localStorage.removeItem(cle);
        }

        // Afficher après délai
        setTimeout(() => setVisible(true), (config.delai_secondes || 0) * 1000);
      } catch { }
    };
    charger();
  }, [vendeurId]);

  // Compte à rebours fermeture auto
  useEffect(() => {
    if (!visible || !cfg?.fermeture_auto) return;
    setCompte(cfg.fermeture_auto_secondes);
    const iv = setInterval(() => setCompte(c => {
      if (c <= 1) { fermer(); clearInterval(iv); return 0; }
      return c - 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [visible]);

  const fermer = () => {
    setVisible(false);
    if (!cfg) return;
    const expiry = Date.now() + cfg.se_souvenir_heures * 3600 * 1000;
    localStorage.setItem(CLE(vendeurId), JSON.stringify({ vu: true, expiry }));
  };

  if (!visible || !cfg) return null;

  const { couleur_fond, couleur_texte, couleur_bouton } = cfg;

  // ── Bannière haut ──────────────────────────────────────────────────────────
  if (cfg.type_affichage === 'banniere_haut' || cfg.type_affichage === 'banniere_bas') {
    const pos = cfg.type_affichage === 'banniere_haut' ? { top: 0 } : { bottom: 44 };
    return (
      <div style={{ position: 'fixed', ...pos, left: 0, right: 0, zIndex: 8000, background: couleur_fond, color: couleur_texte, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap', boxShadow: '0 2px 12px rgba(0,0,0,0.2)', fontFamily: "'Inter',sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');`}</style>
        {cfg.icone && <span style={{ fontSize: 18 }}>{cfg.icone}</span>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {cfg.titre && <strong style={{ fontSize: 14, fontWeight: 800 }}>{cfg.titre}</strong>}
          <span style={{ fontSize: 13, opacity: 0.9 }}>{cfg.message}</span>
          {cfg.bouton_actif && cfg.bouton_label && (
            <a href={cfg.bouton_url || '#'} target={cfg.bouton_url ? '_blank' : undefined} rel="noopener noreferrer"
              style={{ background: couleur_bouton, color: '#fff', padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {cfg.bouton_label}
            </a>
          )}
        </div>
        <button onClick={fermer} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: couleur_texte, cursor: 'pointer', fontSize: 16, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 8 }}>✕</button>
      </div>
    );
  }

  // ── Popup centré ───────────────────────────────────────────────────────────
  return (
    <div onClick={fermer} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)', fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');`}</style>
      <div onClick={e => e.stopPropagation()}
        style={{ background: couleur_fond, borderRadius: 20, maxWidth: 480, width: '100%', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.5)', position: 'relative', animation: 'popIn 0.3s ease' }}>
        <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.9) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>

        {/* Bouton fermer */}
        <button onClick={fermer} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.15)', border: 'none', color: couleur_texte, cursor: 'pointer', width: 32, height: 32, borderRadius: '50%', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>✕</button>

        {/* Contenu */}
        <div style={{ padding: '40px 36px 32px', textAlign: 'center' }}>
          {cfg.icone && <div style={{ fontSize: 52, marginBottom: 16 }}>{cfg.icone}</div>}
          {cfg.titre && <h2 style={{ fontSize: 24, fontWeight: 900, color: couleur_texte, margin: '0 0 12px', lineHeight: 1.2 }}>{cfg.titre}</h2>}
          <p style={{ fontSize: 15, color: couleur_texte, opacity: 0.85, lineHeight: 1.7, margin: '0 0 24px' }}>{cfg.message}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cfg.bouton_actif && cfg.bouton_label && (
              <a href={cfg.bouton_url || '#'} target={cfg.bouton_url ? '_blank' : undefined} rel="noopener noreferrer"
                style={{ display: 'block', background: couleur_bouton, color: '#fff', padding: '14px 24px', borderRadius: 12, fontSize: 15, fontWeight: 800, textDecoration: 'none', transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                {cfg.bouton_label}
              </a>
            )}
            <button onClick={fermer} style={{ background: 'transparent', border: 'none', color: couleur_texte, opacity: 0.5, fontSize: 13, cursor: 'pointer', padding: '6px', fontFamily: 'inherit' }}>
              {cfg.fermeture_auto && compte > 0 ? `Fermer (${compte}s)` : 'Non merci, fermer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}