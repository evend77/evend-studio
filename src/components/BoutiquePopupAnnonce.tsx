// CHEMIN : src/components/BoutiquePopupAnnonce.tsx
// e-Vend Studio — Add-on « Popup Annonce » sur le site des templates boutique (solo). Adapté de PopupAnnonce.tsx (MV), sans y toucher.
// Monté par SitePreview seulement quand l'add-on est activé. Les données viennent de GET /api/boutique/popup/:gid (le serveur vérifie add-on, annonce allumée et dates).
// 3 formats : popup centré, bannière en haut (dans la page : elle défile avec le site, donc ne cache jamais le menu), bannière en bas (fixe).
// Fermée par le visiteur → mémorisée X heures dans son navigateur ; si le gestionnaire modifie l'annonce, elle se réaffiche (champ `version`).
// Aucun popup du navigateur ; l'adresse du bouton est https:// (vérifiée par le serveur et ici).

import { useState, useEffect, useRef } from 'react';

const API_BASE = '/api';

interface Cfg {
  type_affichage: 'popup' | 'banniere_haut' | 'banniere_bas';
  titre: string; message: string; bouton_label: string; bouton_url: string | null; bouton_actif: boolean;
  couleur_fond: string; couleur_texte: string; couleur_bouton: string;
  delai_secondes: number; fermeture_auto: boolean; fermeture_auto_secondes: number; se_souvenir_heures: number; icone: string; version: number;
}
interface Props { gestionnaireId: number; decalageBas?: number; reserveChat?: boolean }

const cle = (id: number) => `evend_boutique_annonce_${id}`;
const urlSure = (u: string | null) => { try { return !!u && new URL(u).protocol === 'https:'; } catch (e) { return false; } };

export default function BoutiquePopupAnnonce({ gestionnaireId, decalageBas = 0, reserveChat = false }: Props) {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [visible, setVisible] = useState(false);
  const [compte, setCompte] = useState(0);
  const cfgRef = useRef<Cfg | null>(null);

  const fermer = () => {
    setVisible(false);
    const c = cfgRef.current; if (!c) return;
    try { localStorage.setItem(cle(gestionnaireId), JSON.stringify({ version: c.version, expiry: Date.now() + (c.se_souvenir_heures || 0) * 3600 * 1000 })); } catch (e) { /* stockage indisponible : on ne mémorise pas */ }
  };

  useEffect(() => {
    let annule = false; let t: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/boutique/popup/${gestionnaireId}`);
        if (!r.ok || annule) return;
        const d = await r.json();
        const c: Cfg | undefined = d && d.config;
        if (!c) return;
        try {
          const vu = localStorage.getItem(cle(gestionnaireId));
          if (vu) { const o = JSON.parse(vu); if (o && o.version === c.version && Date.now() < o.expiry) return; }
        } catch (e) { /* ignoré */ }
        cfgRef.current = c; setCfg(c);
        t = setTimeout(() => { if (!annule) setVisible(true); }, Math.max(0, c.delai_secondes || 0) * 1000);
      } catch (e) { /* pas d'annonce */ }
    })();
    return () => { annule = true; if (t) clearTimeout(t); };
  }, [gestionnaireId]);

  useEffect(() => {
    if (!visible || !cfg || !cfg.fermeture_auto) return;
    setCompte(cfg.fermeture_auto_secondes);
    const iv = setInterval(() => setCompte(c => { if (c <= 1) { clearInterval(iv); fermer(); return 0; } return c - 1; }), 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!visible || !cfg || cfg.type_affichage !== 'popup') return;
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') fermer(); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, cfg]);

  if (!visible || !cfg) return null;
  const { couleur_fond, couleur_texte, couleur_bouton } = cfg;
  const lien = cfg.bouton_actif && cfg.bouton_label ? (
    urlSure(cfg.bouton_url) ? { href: cfg.bouton_url as string } : { href: '' }
  ) : null;

  if (cfg.type_affichage !== 'popup') {
    const haut = cfg.type_affichage === 'banniere_haut';
    const pos: React.CSSProperties = haut ? { position: 'relative', zIndex: 200 } : { position: 'fixed', bottom: decalageBas, left: 0, right: 0, zIndex: 8000 };
    return (
      <div role="region" aria-label="Annonce" style={{ ...pos, background: couleur_fond, color: couleur_texte, padding: `12px ${!haut && reserveChat ? 96 : 20}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap', boxShadow: '0 2px 12px rgba(0,0,0,0.2)', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }}>
        {cfg.icone && <span style={{ fontSize: 18 }}>{cfg.icone}</span>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {cfg.titre && <strong style={{ fontSize: 14, fontWeight: 800 }}>{cfg.titre}</strong>}
          {cfg.message && <span style={{ fontSize: 13, opacity: 0.9 }}>{cfg.message}</span>}
          {lien && (lien.href
            ? <a href={lien.href} target="_blank" rel="noopener noreferrer" style={{ background: couleur_bouton, color: '#fff', padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>{cfg.bouton_label}</a>
            : <button onClick={fermer} style={{ background: couleur_bouton, color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit' }}>{cfg.bouton_label}</button>)}
        </div>
        <button onClick={fermer} aria-label="Fermer l'annonce" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: couleur_texte, cursor: 'pointer', fontSize: 16, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 8 }}>✕</button>
      </div>
    );
  }

  return (
    <div onClick={fermer} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)', fontFamily: "'Inter',sans-serif" }}>
      <style>{`@keyframes bpaPopIn { from { opacity:0; transform:scale(0.9) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
      <div role="dialog" aria-label={cfg.titre || 'Annonce'} onClick={e => e.stopPropagation()}
        style={{ background: couleur_fond, borderRadius: 20, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.5)', position: 'relative', animation: 'bpaPopIn 0.3s ease' }}>
        <button onClick={fermer} aria-label="Fermer l'annonce" style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.15)', border: 'none', color: couleur_texte, cursor: 'pointer', width: 32, height: 32, borderRadius: '50%', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>✕</button>
        <div style={{ padding: '40px 36px 32px', textAlign: 'center' }}>
          {cfg.icone && <div style={{ fontSize: 52, marginBottom: 16 }}>{cfg.icone}</div>}
          {cfg.titre && <h2 style={{ fontSize: 24, fontWeight: 900, color: couleur_texte, margin: '0 0 12px', lineHeight: 1.2, overflowWrap: 'anywhere' }}>{cfg.titre}</h2>}
          {cfg.message && <p style={{ fontSize: 15, color: couleur_texte, opacity: 0.85, lineHeight: 1.7, margin: '0 0 24px', whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{cfg.message}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lien && (lien.href
              ? <a href={lien.href} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: couleur_bouton, color: '#fff', padding: '14px 24px', borderRadius: 12, fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>{cfg.bouton_label}</a>
              : <button onClick={fermer} style={{ display: 'block', width: '100%', background: couleur_bouton, color: '#fff', border: 'none', padding: '14px 24px', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{cfg.bouton_label}</button>)}
            <button onClick={fermer} style={{ background: 'transparent', border: 'none', color: couleur_texte, opacity: 0.6, fontSize: 13, cursor: 'pointer', padding: 6, fontFamily: 'inherit' }}>
              {cfg.fermeture_auto && compte > 0 ? `Fermer (${compte}s)` : 'Non merci, fermer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}