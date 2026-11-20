// CHEMIN : src/components/BoutiqueVerificateurAge.tsx
// e-Vend Studio — Add-on « Vérificateur d'âge » (templates boutique) : fenêtre bloquante affichée à l'arrivée sur la boutique.
// Réglages : GET /api/boutique/verificateur-age/:gid/config (404 = add-on inactif, pas configuré ou en pause → rien n'est affiché).
// 3 modes : boutons · date de naissance · année de naissance. Déclaratif (côté navigateur) : il ne remplace pas une vérification légale.
// Mémoire : acceptation N jours (se_souvenir_jours) ; refus 1 jour. Si le gestionnaire relève l'âge minimum, l'acceptation n'est plus valide.

import React, { useState, useEffect, useRef } from 'react';

export interface ConfigAgeBoutique {
  age_minimum: number;
  mode: 'boutons' | 'date_naissance' | 'annee_naissance';
  titre: string; message: string; texte_accepter: string; texte_refuser: string;
  couleur_fond: string; couleur_accent: string; logo_url?: string; url_redirection_refus?: string; se_souvenir_jours: number;
}

const JOUR_MS = 24 * 60 * 60 * 1000;
const cleOk = (gid: number) => `bq_age_ok_${gid}`;
const cleRefus = (gid: number) => `bq_age_refus_${gid}`;

function lire(cle: string): any { try { const s = localStorage.getItem(cle); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function ecrire(cle: string, v: any) { try { localStorage.setItem(cle, JSON.stringify(v)); } catch (e) { /* stockage indisponible : on redemandera */ } }
function effacer(cle: string) { try { localStorage.removeItem(cle); } catch (e) { /* rien */ } }

/** Âge en années complètes à partir d'une vraie date du calendrier ; null si la date n'existe pas ou est dans le futur. */
export function ageDepuisDate(j: number, m: number, a: number, auj: Date = new Date()): number | null {
  if (!Number.isInteger(j) || !Number.isInteger(m) || !Number.isInteger(a) || a < 1900) return null;
  const d = new Date(a, m - 1, j);
  if (d.getFullYear() !== a || d.getMonth() !== m - 1 || d.getDate() !== j) return null;   // 31/02 etc.
  if (d.getTime() > auj.getTime()) return null;
  let age = auj.getFullYear() - a;
  if (auj.getMonth() < m - 1 || (auj.getMonth() === m - 1 && auj.getDate() < j)) age--;
  return age;
}

function lienSur(u?: string): string {
  try { const x = new URL(String(u || '')); if (x.protocol === 'https:') return x.toString(); } catch (e) { /* défaut */ }
  return 'https://www.google.com';
}

const chiffres = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);

export function PopupAge({ cfg, etape, onAccepter, onRefuser, apercu }: { cfg: ConfigAgeBoutique; etape: 'popup' | 'refus'; onAccepter: () => void; onRefuser: () => void; apercu?: boolean }) {
  const [jour, setJour] = useState(''); const [mois, setMois] = useState(''); const [annee, setAnnee] = useState(''); const [erreur, setErreur] = useState('');
  const premier = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (!apercu && premier.current) premier.current.focus(); }, [etape, apercu]);

  const accent = cfg.couleur_accent || '#ef4444', fond = cfg.couleur_fond || '#0f0f0f';
  const overlay: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto', fontFamily: "'Inter',system-ui,sans-serif" };

  const validerDate = () => {
    setErreur('');
    const a = ageDepuisDate(parseInt(jour, 10), parseInt(mois, 10), parseInt(annee, 10));
    if (a === null) { setErreur('Veuillez entrer une date de naissance valide.'); return; }
    if (a >= cfg.age_minimum) onAccepter(); else onRefuser();
  };
  const validerAnnee = () => {
    setErreur('');
    const y = parseInt(annee, 10), cette = new Date().getFullYear();
    if (!Number.isInteger(y) || y < 1900 || y > cette) { setErreur('Veuillez entrer une année valide.'); return; }
    if (cette - y >= cfg.age_minimum) onAccepter(); else onRefuser();
  };
  const entree = (f: () => void) => (e: React.KeyboardEvent) => { if (e.key === 'Enter') f(); };

  if (etape === 'refus') {
    return (
      <div role="dialog" aria-modal="true" aria-label="Accès refusé" style={{ ...overlay, background: '#0a0a0a', flexDirection: 'column', textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 20 }}>🚫</div>
        <div style={{ background: '#1a0000', border: '2px solid #ef4444', borderRadius: 20, padding: '32px 28px', maxWidth: 480, width: '100%' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#ef4444', margin: '0 0 14px' }}>Accès refusé</h1>
          <p style={{ fontSize: 16, color: '#ccc', lineHeight: 1.7, margin: '0 0 24px' }}>
            Vous devez avoir au moins <strong style={{ color: '#fff' }}>{cfg.age_minimum} ans</strong> pour accéder à cette boutique.
          </p>
          <p style={{ fontSize: 13, color: '#888', margin: '0 0 20px' }}>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter la boutique.</p>
          <button ref={premier} onClick={() => { if (!apercu) window.location.href = lienSur(cfg.url_redirection_refus); }}
            style={{ padding: '14px 28px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', width: '100%' }}>
            ← Quitter cette page
          </button>
        </div>
      </div>
    );
  }

  const champ: React.CSSProperties = { padding: '12px 6px', background: 'rgba(255,255,255,0.08)', border: `1px solid ${erreur ? '#ef4444' : 'rgba(255,255,255,0.15)'}`, borderRadius: 10, fontSize: 16, color: '#fff', textAlign: 'center', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };
  const etiquette: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' };
  const bouton: React.CSSProperties = { width: '100%', padding: 14, background: accent, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' };

  return (
    <div role="dialog" aria-modal="true" aria-label={cfg.titre} style={{ ...overlay, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: fond, borderRadius: 24, maxWidth: 460, width: '100%', overflow: 'hidden', boxShadow: `0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px ${accent}30`, margin: 'auto' }}>
        <div style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}08)`, borderBottom: `1px solid ${accent}30`, padding: '28px 24px 22px', textAlign: 'center' }}>
          {cfg.logo_url ? <img src={cfg.logo_url} alt="" style={{ height: 56, maxWidth: '80%', objectFit: 'contain', marginBottom: 14 }} /> : <div style={{ fontSize: 52, marginBottom: 10 }}>🔞</div>}
          <div style={{ display: 'inline-block', background: accent, color: '#fff', fontSize: 12, fontWeight: 800, padding: '4px 16px', borderRadius: 20, letterSpacing: '0.08em', marginBottom: 14 }}>{cfg.age_minimum}+</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 8px', lineHeight: 1.2 }}>{cfg.titre}</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.6 }}>{cfg.message}</p>
        </div>
        <div style={{ padding: '24px 24px 26px' }}>
          {cfg.mode === 'boutons' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button ref={premier} onClick={onAccepter} style={bouton}>{cfg.texte_accepter}</button>
              <button onClick={onRefuser} style={{ width: '100%', padding: 14, background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{cfg.texte_refuser}</button>
            </div>
          )}
          {cfg.mode === 'date_naissance' && (
            <div>
              <label style={etiquette}>Entrez votre date de naissance</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: 10, marginBottom: 14 }}>
                <input aria-label="Jour" inputMode="numeric" autoComplete="off" value={jour} onChange={e => setJour(chiffres(e.target.value, 2))} onKeyDown={entree(validerDate)} placeholder="Jour" style={champ} />
                <input aria-label="Mois" inputMode="numeric" autoComplete="off" value={mois} onChange={e => setMois(chiffres(e.target.value, 2))} onKeyDown={entree(validerDate)} placeholder="Mois" style={champ} />
                <input aria-label="Année" inputMode="numeric" autoComplete="off" value={annee} onChange={e => setAnnee(chiffres(e.target.value, 4))} onKeyDown={entree(validerDate)} placeholder="Année" style={champ} />
              </div>
              {erreur && <p role="alert" style={{ fontSize: 12, color: '#ef4444', margin: '0 0 12px', fontWeight: 600 }}>{erreur}</p>}
              <button onClick={validerDate} style={bouton}>Confirmer mon âge</button>
            </div>
          )}
          {cfg.mode === 'annee_naissance' && (
            <div>
              <label style={etiquette}>Entrez votre année de naissance</label>
              <input aria-label="Année de naissance" inputMode="numeric" autoComplete="off" value={annee} onChange={e => setAnnee(chiffres(e.target.value, 4))} onKeyDown={entree(validerAnnee)} placeholder="Ex : 1990" style={{ ...champ, fontSize: 18, padding: 14, marginBottom: 12 }} />
              {erreur && <p role="alert" style={{ fontSize: 12, color: '#ef4444', margin: '0 0 12px', fontWeight: 600 }}>{erreur}</p>}
              <button onClick={validerAnnee} style={bouton}>Confirmer mon âge</button>
            </div>
          )}
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', margin: '16px 0 0', lineHeight: 1.5 }}>
            En continuant, vous confirmez avoir {cfg.age_minimum} ans ou plus.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BoutiqueVerificateurAge({ gid }: { gid: number }) {
  const [cfg, setCfg] = useState<ConfigAgeBoutique | null>(null);
  const [etape, setEtape] = useState<'ok' | 'popup' | 'refus'>('ok');

  useEffect(() => {
    let annule = false;
    if (!gid) return;
    fetch(`/api/boutique/verificateur-age/${gid}/config`).then(r => r.ok ? r.json() : null).then(d => {
      if (annule || !d || !d.config) return;
      const c: ConfigAgeBoutique = d.config;
      const ok = lire(cleOk(gid));
      if (ok && typeof ok.expiry === 'number' && Date.now() < ok.expiry && Number(ok.age) >= c.age_minimum) { setCfg(c); setEtape('ok'); return; }
      if (ok) effacer(cleOk(gid));
      const ref = lire(cleRefus(gid));
      setCfg(c);
      if (ref && typeof ref.expiry === 'number' && Date.now() < ref.expiry && Number(ref.age) <= c.age_minimum) { setEtape('refus'); return; }
      if (ref) effacer(cleRefus(gid));
      setEtape('popup');
    }).catch(() => { /* config indisponible : rien n'est affiché */ });
    return () => { annule = true; };
  }, [gid]);

  // Pas de défilement de la page derrière la fenêtre
  useEffect(() => {
    if (etape === 'ok') return;
    const avant = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = avant; };
  }, [etape]);

  if (!cfg || etape === 'ok') return null;
  const accepter = () => { ecrire(cleOk(gid), { age: cfg.age_minimum, expiry: Date.now() + cfg.se_souvenir_jours * JOUR_MS }); effacer(cleRefus(gid)); setEtape('ok'); };
  const refuser = () => { ecrire(cleRefus(gid), { age: cfg.age_minimum, expiry: Date.now() + JOUR_MS }); setEtape('refus'); };
  return <PopupAge cfg={cfg} etape={etape} onAccepter={accepter} onRefuser={refuser} />;
}