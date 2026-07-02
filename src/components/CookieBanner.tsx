/**
 * CookieBanner.tsx — e-Vend Studio
 * Chemin : src/components/CookieBanner.tsx
 *
 * Bannière de consentement aux cookies automatique.
 * S'affiche sur TOUS les sites vendeurs sans configuration manuelle.
 * Conforme Loi 25 (Québec) + LPRPDE (Canada).
 *
 * Usage (dans SitePreview.tsx) :
 *   <CookieBanner vendeurId={Number(vendeurId)} />
 *
 * Stockage visiteur : localStorage 'evend_cookie_consent'
 * Format : { accepted: boolean, analytique: boolean, marketing: boolean, fonctionnalite: boolean, date: string }
 */

import { useState, useEffect } from 'react';

const API_BASE = '/api';
const STORAGE_KEY = 'evend_cookie_consent';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CookieConfig {
  actif:                       boolean;
  position:                    string;
  titre:                       string;
  description:                 string;
  bouton_accepter:             string;
  bouton_refuser:              string;
  bouton_preferences:          string;
  lien_politique:              string;
  lien_conditions:             string;
  texte_politique:             string;
  texte_conditions:            string;
  couleur_fond:                string;
  couleur_titre:               string;
  couleur_texte:               string;
  couleur_bouton_accept:       string;
  couleur_texte_bouton_accept: string;
  afficher_bouton_preferences: boolean;
  categories_actives:          { fonctionnalite: boolean; analytique: boolean; marketing: boolean };
}

interface ConsentData {
  accepted:       boolean;
  analytique:     boolean;
  marketing:      boolean;
  fonctionnalite: boolean;
  date:           string;
}

// ─── Helper : lire le consentement stocké ────────────────────────────────────
function lireConsentement(): ConsentData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ─── Helper : sauvegarder le consentement ────────────────────────────────────
function sauvegarderConsentement(data: ConsentData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

// ─── Helper : position CSS ───────────────────────────────────────────────────
function positionStyle(position: string): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'fixed', zIndex: 99999,
    maxWidth: '360px', width: 'calc(100% - 32px)',
  };
  switch (position) {
    case 'bas-droite':  return { ...base, bottom: '20px', right: '16px' };
    case 'bas-centre':  return { ...base, bottom: '20px', left: '50%', transform: 'translateX(-50%)', maxWidth: '480px' };
    case 'centre':      return { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: '440px' };
    case 'bas-gauche':
    default:            return { ...base, bottom: '20px', left: '16px' };
  }
}

// ─── Composant ───────────────────────────────────────────────────────────────
interface Props { vendeurId: number; }

export default function CookieBanner({ vendeurId }: Props) {
  const [config, setConfig]             = useState<CookieConfig | null>(null);
  const [visible, setVisible]           = useState(false);
  const [modePreferences, setModePrefs] = useState(false);
  const [prefs, setPrefs]               = useState({ fonctionnalite: true, analytique: true, marketing: true });

  // ── Charger la config et vérifier si déjà consenti ───────────────────────
  useEffect(() => {
    if (!vendeurId) return;

    // Déjà consenti → ne pas afficher
    const existant = lireConsentement();
    if (existant) return;

    fetch(`${API_BASE}/studio/cookies-site/${vendeurId}/public`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !data.actif) return; // bannière désactivée par le vendeur
        setConfig(data);
        // Initialiser les prefs selon les catégories actives du vendeur
        setPrefs({
          fonctionnalite: data.categories_actives?.fonctionnalite ?? true,
          analytique:     data.categories_actives?.analytique     ?? true,
          marketing:      data.categories_actives?.marketing      ?? true,
        });
        // Délai léger pour éviter le flash au chargement
        setTimeout(() => setVisible(true), 800);
      })
      .catch(() => {}); // silencieux — pas de bannière si erreur
  }, [vendeurId]);

  if (!visible || !config) return null;

  // ── Accepter tout ─────────────────────────────────────────────────────────
  function accepterTout() {
    sauvegarderConsentement({
      accepted:       true,
      analytique:     true,
      marketing:      true,
      fonctionnalite: true,
      date:           new Date().toISOString(),
    });
    setVisible(false);
  }

  // ── Refuser (seulement obligatoires) ─────────────────────────────────────
  function refuser() {
    sauvegarderConsentement({
      accepted:       true,
      analytique:     false,
      marketing:      false,
      fonctionnalite: false,
      date:           new Date().toISOString(),
    });
    setVisible(false);
  }

  // ── Sauvegarder les préférences personnalisées ────────────────────────────
  function sauvegarderPrefs() {
    sauvegarderConsentement({
      accepted:       true,
      analytique:     prefs.analytique,
      marketing:      prefs.marketing,
      fonctionnalite: prefs.fonctionnalite,
      date:           new Date().toISOString(),
    });
    setVisible(false);
  }

  const pos = positionStyle(config.position);

  // ── Overlay si mode centre ────────────────────────────────────────────────
  const overlay = config.position === 'centre';

  return (
    <>
      {/* Overlay sombre si position centre */}
      {overlay && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 99998, backdropFilter: 'blur(3px)',
        }} />
      )}

      <div style={{
        ...pos,
        background:   config.couleur_fond,
        borderRadius: '16px',
        boxShadow:    '0 12px 40px rgba(0,0,0,0.35)',
        overflow:     'hidden',
        animation:    'cookieSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <style>{`
          @keyframes cookieSlideIn {
            from { opacity: 0; transform: translateY(20px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {!modePreferences ? (
          /* ── Vue principale ── */
          <>
            <div style={{ padding: '18px 18px 0', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>🔒</div>
              <h4 style={{ color: config.couleur_titre, fontSize: '14px', fontWeight: 800, margin: '0 0 8px' }}>
                {config.titre}
              </h4>
              <p style={{ color: config.couleur_texte, fontSize: '11px', lineHeight: 1.6, margin: 0 }}>
                {config.description}
              </p>
            </div>

            <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {/* Accepter tout */}
              <button
                onClick={accepterTout}
                style={{
                  padding: '10px', borderRadius: '8px', border: 'none',
                  background: config.couleur_bouton_accept,
                  color: config.couleur_texte_bouton_accept,
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                🔑 {config.bouton_accepter}
              </button>

              {/* Refuser */}
              <button
                onClick={refuser}
                style={{
                  padding: '9px', borderRadius: '8px',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  fontSize: '12px', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {config.bouton_refuser}
              </button>

              {/* Préférences */}
              {config.afficher_bouton_preferences && (
                <button
                  onClick={() => setModePrefs(true)}
                  style={{
                    padding: '8px', borderRadius: '8px',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.45)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    fontSize: '11px', cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  ⚙️ {config.bouton_preferences}
                </button>
              )}
            </div>

            {/* Liens légaux */}
            <div style={{
              padding: '8px 16px 12px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', gap: '16px', justifyContent: 'center',
            }}>
              <a href={config.lien_politique} target="_blank" rel="noreferrer"
                style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', textDecoration: 'underline' }}>
                {config.texte_politique}
              </a>
              <a href={config.lien_conditions} target="_blank" rel="noreferrer"
                style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', textDecoration: 'underline' }}>
                {config.texte_conditions}
              </a>
            </div>
          </>
        ) : (
          /* ── Vue préférences ── */
          <>
            <div style={{ padding: '16px 18px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <button
                  onClick={() => setModePrefs(false)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>
                  ← Retour
                </button>
                <h4 style={{ color: config.couleur_titre, fontSize: '13px', fontWeight: 800, margin: 0 }}>
                  Mes préférences
                </h4>
              </div>

              {/* Toujours actifs */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <span style={{ color: config.couleur_titre, fontSize: '12px', fontWeight: 700 }}>🔒 Cookies obligatoires</span>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Toujours actifs</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', margin: 0, lineHeight: 1.5 }}>
                  Nécessaires au fonctionnement du site. Ne peuvent pas être désactivés.
                </p>
              </div>

              {/* Fonctionnalité */}
              {config.categories_actives?.fonctionnalite && (
                <PrefToggle
                  label="Fonctionnalité"
                  desc="Mémorisent vos préférences (langue, région, etc.)"
                  value={prefs.fonctionnalite}
                  onChange={v => setPrefs(p => ({ ...p, fonctionnalite: v }))}
                  couleurTitre={config.couleur_titre}
                />
              )}

              {/* Analytique */}
              {config.categories_actives?.analytique && (
                <PrefToggle
                  label="Analytique"
                  desc="Nous aident à comprendre comment vous utilisez le site."
                  value={prefs.analytique}
                  onChange={v => setPrefs(p => ({ ...p, analytique: v }))}
                  couleurTitre={config.couleur_titre}
                />
              )}

              {/* Marketing */}
              {config.categories_actives?.marketing && (
                <PrefToggle
                  label="Marketing"
                  desc="Utilisés pour vous montrer des publicités pertinentes."
                  value={prefs.marketing}
                  onChange={v => setPrefs(p => ({ ...p, marketing: v }))}
                  couleurTitre={config.couleur_titre}
                />
              )}
            </div>

            <div style={{ padding: '12px 16px 16px', display: 'flex', gap: '8px' }}>
              <button
                onClick={refuser}
                style={{ flex: 1, padding: '9px', borderRadius: '8px', background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '11px', cursor: 'pointer' }}>
                Tout refuser
              </button>
              <button
                onClick={sauvegarderPrefs}
                style={{ flex: 2, padding: '9px', borderRadius: '8px', background: config.couleur_bouton_accept, color: config.couleur_texte_bouton_accept, border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                ✓ Confirmer mes choix
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Sous-composant toggle préférence ─────────────────────────────────────────
function PrefToggle({ label, desc, value, onChange, couleurTitre }: {
  label: string; desc: string; value: boolean;
  onChange: (v: boolean) => void; couleurTitre: string;
}) {
  return (
    <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
      <div style={{ flex: 1 }}>
        <p style={{ color: couleurTitre, fontSize: '12px', fontWeight: 700, margin: '0 0 2px' }}>{label}</p>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', margin: 0, lineHeight: 1.5 }}>{desc}</p>
      </div>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: '36px', height: '20px', borderRadius: '10px', flexShrink: 0,
          background: value ? '#c9a96e' : 'rgba(255,255,255,0.2)',
          position: 'relative', cursor: 'pointer', transition: 'background 0.2s', marginTop: '2px',
        }}
      >
        <div style={{
          position: 'absolute', top: '2px', left: value ? '18px' : '2px',
          width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
    </div>
  );
}