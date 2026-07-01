// src/components/VerificateurAge.tsx
// e-Vend Studio — Composant vérificateur d'âge universel
// S'injecte dans tous les templates. Lit la config depuis l'API.

import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

interface ConfigAge {
  actif: boolean;
  age_minimum: number;
  mode: 'boutons' | 'date_naissance' | 'annee_naissance';
  titre: string;
  message: string;
  texte_accepter: string;
  texte_refuser: string;
  couleur_fond: string;
  couleur_accent: string;
  logo_url?: string;
  url_redirection_refus?: string;
  se_souvenir_jours: number;
}

const CFG_DEF: ConfigAge = {
  actif: true,
  age_minimum: 18,
  mode: 'boutons',
  titre: 'Vérification d\'âge requise',
  message: 'Ce site est réservé aux personnes majeures. Veuillez confirmer votre âge pour continuer.',
  texte_accepter: 'Oui, j\'ai 18 ans ou plus',
  texte_refuser: 'Non, j\'ai moins de 18 ans',
  couleur_fond: '#0f0f0f',
  couleur_accent: '#ef4444',
  se_souvenir_jours: 30,
};

interface Props {
  vendeurId: number;
  configOverride?: Partial<ConfigAge>; // pour la démo
}

const CLE_STORAGE = (id: number) => `evend_age_ok_${id}`;

export default function VerificateurAge({ vendeurId, configOverride }: Props) {
  const [cfg, setCfg] = useState<ConfigAge | null>(null);
  const [etape, setEtape] = useState<'popup' | 'refus' | 'ok'>('ok');
  const [jour, setJour]   = useState('');
  const [mois, setMois]   = useState('');
  const [annee, setAnnee] = useState('');
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    // 1. Charger la config
    const charger = async () => {
      try {
        // Vérifier d'abord si l'add-on est activé dans les options
        const resOpts = await fetch(`${API_BASE}/gestionnaires/${vendeurId}/options`);
        if (resOpts.ok) {
          const opts = await resOpts.json();
          if (!opts.verificateur_age) {
            setEtape('ok'); // Add-on désactivé — ne rien afficher
            return;
          }
        }

        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/gestionnaires/${vendeurId}/verificateur-age`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        });
        const data = res.ok ? await res.json() : {};
        // Ne pas utiliser CFG_DEF.actif comme fallback — si pas de config, ne pas afficher
        const config: ConfigAge = { ...CFG_DEF, ...data, ...configOverride };
        setCfg(config);

        if (!config.actif) { setEtape('ok'); return; }

        // 2. Vérifier si déjà validé (cookie localStorage)
        const cle = CLE_STORAGE(vendeurId);
        const sauvegarde = localStorage.getItem(cle);
        if (sauvegarde) {
          const { expiry } = JSON.parse(sauvegarde);
          if (Date.now() < expiry) { setEtape('ok'); return; }
          localStorage.removeItem(cle);
        }

        setEtape('popup');
      } catch {
        const config: ConfigAge = { ...CFG_DEF, ...configOverride };
        setCfg(config);
        if (config.actif) setEtape('popup');
      }
    };
    charger();
  }, [vendeurId]);

  const accepter = () => {
    if (!cfg) return;
    // Sauvegarder la validation
    const expiry = Date.now() + cfg.se_souvenir_jours * 24 * 60 * 60 * 1000;
    localStorage.setItem(CLE_STORAGE(vendeurId), JSON.stringify({ ok: true, expiry }));
    setEtape('ok');
  };

  const refuser = () => setEtape('refus');

  const validerDate = () => {
    if (!cfg) return;
    setErreur('');
    const j = parseInt(jour), m = parseInt(mois), a = parseInt(annee);
    if (!j || !m || !a || a < 1900 || a > new Date().getFullYear()) {
      setErreur('Veuillez entrer une date valide.');
      return;
    }
    const dateNaissance = new Date(a, m - 1, j);
    const auj = new Date();
    let age = auj.getFullYear() - dateNaissance.getFullYear();
    if (auj.getMonth() < dateNaissance.getMonth() ||
       (auj.getMonth() === dateNaissance.getMonth() && auj.getDate() < dateNaissance.getDate())) {
      age--;
    }
    if (age >= cfg.age_minimum) accepter();
    else refuser();
  };

  const validerAnnee = () => {
    if (!cfg) return;
    setErreur('');
    const a = parseInt(annee);
    const auj = new Date();
    if (!a || a < 1900 || a > auj.getFullYear()) {
      setErreur('Veuillez entrer une année valide.');
      return;
    }
    const age = auj.getFullYear() - a;
    if (age >= cfg.age_minimum) accepter();
    else refuser();
  };

  // Rien à afficher si validé ou config non chargée
  if (etape === 'ok' || !cfg) return null;

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20, fontFamily: "'Inter',system-ui,sans-serif",
  };

  // ─── Écran de REFUS — plein écran bloquant ──────────────────────────────────
  if (etape === 'refus') {
    return (
      <div style={{ ...overlay, background: '#0a0a0a', flexDirection: 'column', textAlign: 'center' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');`}</style>
        <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
          <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}`}</style>
          <div style={{ fontSize: 96, marginBottom: 24 }}>🚫</div>
        </div>
        <div style={{ background: '#1a0000', border: '2px solid #ef4444', borderRadius: 20, padding: '40px 48px', maxWidth: 480, width: '100%' }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#ef4444', margin: '0 0 16px', letterSpacing: '-0.5px' }}>
            Accès Refusé
          </h1>
          <p style={{ fontSize: 16, color: '#ccc', lineHeight: 1.7, margin: '0 0 28px' }}>
            Vous devez avoir au moins <strong style={{ color: '#fff' }}>{cfg.age_minimum} ans</strong> pour accéder à ce site.
            <br />L'accès est strictement réservé aux personnes majeures.
          </p>
          <div style={{ width: '100%', height: 2, background: '#ef444430', marginBottom: 28 }} />
          <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter l'administrateur du site.
          </p>
          <button
            onClick={() => { window.location.href = cfg.url_redirection_refus || 'https://www.google.com'; }}
            style={{ padding: '14px 32px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer', width: '100%' }}>
            ← Retour à la page précédente
          </button>
        </div>
      </div>
    );
  }

  // ─── Popup de vérification ──────────────────────────────────────────────────
  const fondPopup = cfg.couleur_fond || '#0f0f0f';
  const accent    = cfg.couleur_accent || '#ef4444';

  return (
    <div style={{ ...overlay, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');`}</style>
      <div style={{ background: fondPopup, borderRadius: 24, maxWidth: 460, width: '100%', overflow: 'hidden', boxShadow: `0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px ${accent}30` }}>

        {/* En-tête */}
        <div style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}08)`, borderBottom: `1px solid ${accent}30`, padding: '32px 32px 24px', textAlign: 'center' }}>
          {cfg.logo_url
            ? <img src={cfg.logo_url} alt="Logo" style={{ height: 56, objectFit: 'contain', marginBottom: 16 }} />
            : <div style={{ fontSize: 56, marginBottom: 12 }}>🔞</div>
          }
          <div style={{ display: 'inline-block', background: accent, color: '#fff', fontSize: 12, fontWeight: 800, padding: '4px 16px', borderRadius: 20, letterSpacing: '0.08em', marginBottom: 16 }}>
            {cfg.age_minimum}+
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 8px', lineHeight: 1.2 }}>{cfg.titre}</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.6 }}>{cfg.message}</p>
        </div>

        {/* Contenu selon le mode */}
        <div style={{ padding: '28px 32px 32px' }}>

          {cfg.mode === 'boutons' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={accepter}
                style={{ width: '100%', padding: '15px', background: accent, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={e=>(e.currentTarget.style.opacity='0.9')}
                onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
                {cfg.texte_accepter}
              </button>
              <button onClick={refuser}
                style={{ width: '100%', padding: '15px', background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {cfg.texte_refuser}
              </button>
            </div>
          )}

          {cfg.mode === 'date_naissance' && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Entrez votre date de naissance
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: 10, marginBottom: 16 }}>
                {[
                  { val: jour, set: setJour, ph: 'Jour', max: 2 },
                  { val: mois, set: setMois, ph: 'Mois', max: 2 },
                  { val: annee, set: setAnnee, ph: 'Année', max: 4 },
                ].map((f, i) => (
                  <input key={i} type="number" value={f.val} onChange={e => f.set(e.target.value)}
                    placeholder={f.ph} maxLength={f.max}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.08)', border: `1px solid ${erreur ? '#ef4444' : 'rgba(255,255,255,0.15)'}`, borderRadius: 10, fontSize: 15, color: '#fff', textAlign: 'center', outline: 'none', fontFamily: 'inherit' }} />
                ))}
              </div>
              {erreur && <p style={{ fontSize: 12, color: '#ef4444', margin: '0 0 12px', fontWeight: 600 }}>{erreur}</p>}
              <button onClick={validerDate}
                style={{ width: '100%', padding: '14px', background: accent, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
                Confirmer mon âge
              </button>
            </div>
          )}

          {cfg.mode === 'annee_naissance' && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Entrez votre année de naissance
              </label>
              <input type="number" value={annee} onChange={e => setAnnee(e.target.value)}
                placeholder="Ex : 1990" maxLength={4}
                style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.08)', border: `1px solid ${erreur ? '#ef4444' : 'rgba(255,255,255,0.15)'}`, borderRadius: 10, fontSize: 18, color: '#fff', textAlign: 'center', outline: 'none', fontFamily: 'inherit', marginBottom: 12, boxSizing: 'border-box' as const }} />
              {erreur && <p style={{ fontSize: 12, color: '#ef4444', margin: '0 0 12px', fontWeight: 600 }}>{erreur}</p>}
              <button onClick={validerAnnee}
                style={{ width: '100%', padding: '14px', background: accent, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
                Confirmer mon âge
              </button>
            </div>
          )}

          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', margin: '16px 0 0', lineHeight: 1.5 }}>
            En continuant, vous confirmez avoir {cfg.age_minimum} ans ou plus et acceptez nos conditions d'utilisation.
          </p>
        </div>
      </div>
    </div>
  );
}