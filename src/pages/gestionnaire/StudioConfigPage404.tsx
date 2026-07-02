/**
 * StudioConfigPage404.tsx — e-Vend Studio
 * Chemin : src/pages/gestionnaire/StudioConfigPage404.tsx
 *
 * Permet à chaque vendeur de personnaliser la page 404 de SON site :
 *  - Titre, sous-titre, texte et URL du bouton
 *  - Couleur de fond, couleur du texte, couleur du bouton
 *  - Image / illustration (URL externe ou upload S3)
 *  - Prévisualisation live
 *
 * Routes API :
 *   GET  /api/studio/page-404/:gestionnaireId         → config actuelle
 *   PUT  /api/studio/page-404/:gestionnaireId         → sauvegarder
 *   POST /api/studio/page-404/:gestionnaireId/image   → upload image S3
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = (window as any).API_BASE || '/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Config404 {
  titre:          string;
  sous_titre:     string;
  texte_bouton:   string;
  url_bouton:     string;
  couleur_fond:   string;
  couleur_texte:  string;
  couleur_bouton: string;
  image_url:      string;
}

const DEFAUTS: Config404 = {
  titre:          'Page introuvable',
  sous_titre:     "Oups\u00a0! La page que vous cherchez n'existe pas ou a \u00e9t\u00e9 d\u00e9plac\u00e9e.",
  texte_bouton:   "Retour \u00e0 l'accueil",
  url_bouton:     '/',
  couleur_fond:   '#0a0f1e',
  couleur_texte:  '#ffffff',
  couleur_bouton: '#f59e0b',
  image_url:      '',
};

// ─── Palette Studio ───────────────────────────────────────────────────────────
const C = {
  bg:           '#f4f6f8',
  card:         '#ffffff',
  border:       '#e2e8f0',
  gold:         '#c9a96e',
  goldLight:    'rgba(201,169,110,0.12)',
  goldHover:    '#a07840',
  dark:         '#111111',
  accent:       '#c9a96e',
  green:        '#10b981',
  greenLight:   'rgba(16,185,129,0.10)',
  red:          '#ef4444',
  redLight:     'rgba(239,68,68,0.10)',
  orange:       '#f59e0b',
  orangeLight:  'rgba(245,158,11,0.10)',
  text:         '#1e293b',
  textLight:    '#64748b',
  textXLight:   '#94a3b8',
  inputBorder:  '#cbd5e1',
  inputFocus:   '#c9a96e',
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  return (
    <div style={{
      position: 'fixed', bottom: '28px', left: '50%',
      transform: 'translateX(-50%)',
      background: type === 'ok' ? C.green : C.red,
      color: '#fff', padding: '11px 24px',
      borderRadius: '12px', fontSize: '14px',
      fontWeight: 700, zIndex: 9999,
      boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
      animation: 'fadeInUp 0.25s ease',
      whiteSpace: 'nowrap',
    }}>
      {type === 'ok' ? '✅ ' : '❌ '}{msg}
    </div>
  );
}

// ─── Sélecteur de couleur ─────────────────────────────────────────────────────
function CouleurChamp({
  label, value, onChange, hint,
}: {
  label: string; value: string;
  onChange: (v: string) => void; hint?: string;
}) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <label style={{
        display: 'block', fontSize: '12px', fontWeight: 700,
        color: C.textLight, textTransform: 'uppercase',
        letterSpacing: '0.5px', marginBottom: '6px',
      }}>
        {label}
      </label>
      {hint && <p style={{ margin: '0 0 6px', fontSize: '12px', color: C.textXLight }}>{hint}</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Aperçu couleur cliquable */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
              position: 'absolute', inset: 0, opacity: 0,
              width: '100%', height: '100%', cursor: 'pointer', border: 'none',
            }}
          />
          <div style={{
            width: '40px', height: '40px', borderRadius: '8px',
            background: value,
            border: `2px solid ${C.border}`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            cursor: 'pointer',
          }} />
        </div>
        {/* Champ hex */}
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="#000000"
          maxLength={7}
          style={{
            flex: 1, padding: '9px 12px',
            background: '#f8fafc',
            border: `1px solid ${C.inputBorder}`,
            borderRadius: '8px', fontSize: '14px',
            color: C.text, outline: 'none',
            fontFamily: 'monospace',
          }}
          onFocus={e => (e.target.style.borderColor = C.inputFocus)}
          onBlur={e => (e.target.style.borderColor = C.inputBorder)}
        />
      </div>
    </div>
  );
}

// ─── Champ texte / textarea ───────────────────────────────────────────────────
function Champ({
  label, hint, value, onChange, placeholder,
  multiline = false, type = 'text',
}: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  multiline?: boolean; type?: string;
}) {
  const style: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '9px 12px', background: '#f8fafc',
    border: `1px solid ${C.inputBorder}`,
    borderRadius: '8px', fontSize: '14px',
    color: C.text, outline: 'none',
    fontFamily: 'system-ui, sans-serif',
    resize: multiline ? 'vertical' : undefined,
    minHeight: multiline ? '80px' : undefined,
    transition: 'border-color 0.15s',
  };
  return (
    <div style={{ marginBottom: '18px' }}>
      <label style={{
        display: 'block', fontSize: '12px', fontWeight: 700,
        color: C.textLight, textTransform: 'uppercase',
        letterSpacing: '0.5px', marginBottom: '6px',
      }}>
        {label}
      </label>
      {hint && <p style={{ margin: '0 0 6px', fontSize: '12px', color: C.textXLight }}>{hint}</p>}
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)}
            placeholder={placeholder} rows={3} style={style}
            onFocus={e => (e.target.style.borderColor = C.inputFocus)}
            onBlur={e  => (e.target.style.borderColor = C.inputBorder)} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)}
            placeholder={placeholder} style={style}
            onFocus={e => (e.target.style.borderColor = C.inputFocus)}
            onBlur={e  => (e.target.style.borderColor = C.inputBorder)} />
      }
    </div>
  );
}

// ─── Prévisualisation live ────────────────────────────────────────────────────
function Preview({ config }: { config: Config404 }) {
  return (
    <div style={{
      background: config.couleur_fond,
      borderRadius: '16px',
      overflow: 'hidden',
      border: `1px solid ${C.border}`,
      fontFamily: 'system-ui, sans-serif',
      transition: 'background 0.3s',
    }}>
      {/* Barre navigateur simulée */}
      <div style={{
        background: 'rgba(255,255,255,0.06)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: '8px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
        <div style={{
          flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: '6px',
          padding: '4px 12px', marginLeft: '8px',
          fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace',
        }}>
          votresite.com/page-qui-nexiste-pas
        </div>
      </div>

      {/* Corps */}
      <div style={{
        padding: '52px 32px',
        textAlign: 'center',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '20px',
      }}>
        {/* Image ou emoji */}
        {config.image_url ? (
          <img
            src={config.image_url}
            alt="Illustration 404"
            style={{ maxWidth: '200px', maxHeight: '160px', objectFit: 'contain', borderRadius: '12px' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div style={{ fontSize: '68px', lineHeight: 1 }}>🔍</div>
        )}

        {/* Code 404 en filigrane */}
        <div style={{
          fontSize: '90px', fontWeight: 900,
          color: 'rgba(255,255,255,0.06)',
          lineHeight: 1, letterSpacing: '-4px',
          marginTop: '-20px', userSelect: 'none',
        }}>
          404
        </div>

        {/* Titre */}
        <h1 style={{
          margin: '-12px 0 0', fontSize: '28px', fontWeight: 800,
          color: config.couleur_texte, lineHeight: 1.2,
          transition: 'color 0.3s',
        }}>
          {config.titre || <span style={{ opacity: 0.3, fontStyle: 'italic' }}>Titre…</span>}
        </h1>

        {/* Sous-titre */}
        <p style={{
          margin: 0, fontSize: '15px',
          color: config.couleur_texte,
          opacity: 0.6,
          maxWidth: '380px', lineHeight: 1.7,
          transition: 'color 0.3s',
        }}>
          {config.sous_titre || <span style={{ fontStyle: 'italic' }}>Sous-titre…</span>}
        </p>

        {/* Bouton */}
        <div
          style={{
            marginTop: '8px',
            padding: '12px 30px',
            background: config.couleur_bouton,
            color: '#000',
            fontWeight: 700, fontSize: '14px',
            borderRadius: '10px',
            cursor: 'default',
            transition: 'background 0.3s',
            boxShadow: `0 4px 16px ${config.couleur_bouton}55`,
          }}
        >
          {config.texte_bouton || 'Bouton…'}
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface Props {
  gestionnaireId: number;
}

export default function StudioConfigPage404({ gestionnaireId }: Props) {
  const token = localStorage.getItem('token');

  const [config, setConfig]       = useState<Config404>(DEFAUTS);
  const [original, setOriginal]   = useState<Config404>(DEFAUTS);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast]         = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [onglet, setOnglet]       = useState<'config' | 'couleurs' | 'apercu'>('config');
  const fileRef                   = useRef<HTMLInputElement>(null);

  const modifie = JSON.stringify(config) !== JSON.stringify(original);

  // ── Charger ──────────────────────────────────────────────────────────────
  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/studio/page-404/${gestionnaireId}`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const cfg: Config404 = {
        titre:          data.titre          ?? DEFAUTS.titre,
        sous_titre:     data.sous_titre     ?? DEFAUTS.sous_titre,
        texte_bouton:   data.texte_bouton   ?? DEFAUTS.texte_bouton,
        url_bouton:     data.url_bouton     ?? DEFAUTS.url_bouton,
        couleur_fond:   data.couleur_fond   ?? DEFAUTS.couleur_fond,
        couleur_texte:  data.couleur_texte  ?? DEFAUTS.couleur_texte,
        couleur_bouton: data.couleur_bouton ?? DEFAUTS.couleur_bouton,
        image_url:      data.image_url      ?? DEFAUTS.image_url,
      };
      setConfig(cfg);
      setOriginal(cfg);
    } catch {
      // Pas encore de config → garder les défauts
    } finally {
      setLoading(false);
    }
  }, [gestionnaireId, token]);

  useEffect(() => { charger(); }, [charger]);

  // ── Toast auto-dismiss ───────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Sauvegarder ──────────────────────────────────────────────────────────
  async function sauvegarder() {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/studio/page-404/${gestionnaireId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      setOriginal({ ...config });
      setToast({ msg: 'Page 404 sauvegardée !', type: 'ok' });
    } catch (e: any) {
      setToast({ msg: e.message || 'Erreur lors de la sauvegarde.', type: 'err' });
    } finally {
      setSaving(false);
    }
  }

  // ── Upload image ──────────────────────────────────────────────────────────
  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/studio/page-404/${gestionnaireId}/image`, {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConfig(c => ({ ...c, image_url: data.image_url }));
      setToast({ msg: 'Image uploadée avec succès !', type: 'ok' });
    } catch (e: any) {
      setToast({ msg: e.message || "Erreur lors de l'upload.", type: 'err' });
    } finally {
      setUploading(false);
    }
  }

  // ── Réinitialiser aux défauts ─────────────────────────────────────────────
  function reinitialiser() {
    setConfig({ ...DEFAUTS });
    setToast({ msg: 'Valeurs par défaut restaurées. Sauvegardez pour appliquer.', type: 'ok' });
  }

  function set(key: keyof Config404) {
    return (v: string) => setConfig(c => ({ ...c, [key]: v }));
  }

  // ── Chargement ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '300px', color: C.textLight, fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', animation: 'spin 1s linear infinite' }}>⚙️</div>
          <p style={{ margin: 0, fontSize: '14px' }}>Chargement de votre page 404…</p>
        </div>
      </div>
    );
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: C.bg, minHeight: '100vh',
      padding: '28px 24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .tab-btn:hover { background: rgba(201,169,110,0.08) !important; }
        .btn-annuler:hover { background: #f1f5f9 !important; }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ══ En-tête ══ */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '28px',
        flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #c9a96e, #a07840)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', boxShadow: '0 4px 12px rgba(201,169,110,0.3)',
            }}>
              🔍
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: C.text }}>
                Page 404 — Personnalisation
              </h1>
              <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>
                Configuration de votre page d'erreur
              </p>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {modifie && (
            <button
              className="btn-annuler"
              onClick={() => setConfig({ ...original })}
              style={{
                padding: '9px 18px', background: '#fff',
                color: C.textLight, border: `1px solid ${C.border}`,
                borderRadius: '10px', fontSize: '13px',
                fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              Annuler
            </button>
          )}
          <button
            onClick={sauvegarder}
            disabled={saving || !modifie}
            style={{
              padding: '9px 22px',
              background: modifie
                ? 'linear-gradient(135deg, #c9a96e, #a07840)'
                : '#cbd5e1',
              color: modifie ? '#fff' : '#94a3b8',
              border: 'none', borderRadius: '10px',
              fontSize: '13px', fontWeight: 700,
              cursor: modifie ? 'pointer' : 'not-allowed',
              boxShadow: modifie ? '0 4px 12px rgba(201,169,110,0.35)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {saving ? '⏳ Sauvegarde…' : modifie ? '💾 Sauvegarder' : '✅ À jour'}
          </button>
        </div>
      </div>

      {/* ══ Bandeau explicatif ══ */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0f1e 100%)',
        border: `1px solid rgba(201,169,110,0.25)`,
        borderRadius: '16px', padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex', alignItems: 'flex-start', gap: '16px',
      }}>
        <div style={{ fontSize: '32px', flexShrink: 0, marginTop: '2px' }}>💡</div>
        <div>
          <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 700, color: C.gold }}>
            Qu'est-ce que la page 404 ?
          </p>
          <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
            Quand un visiteur tape une adresse qui n'existe pas sur votre site (ex.: <code style={{ background: 'rgba(201,169,110,0.15)', color: C.gold, padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>votresite.com/une-page-inexistante</code>),
            votre page 404 s'affiche automatiquement. Profitez-en pour garder vos visiteurs
            avec un message chaleureux et un bouton de retour vers votre contenu.
          </p>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {[
              { icon: '🎨', label: 'Couleurs personnalisées' },
              { icon: '🖼️', label: 'Votre image ou illustration' },
              { icon: '✍️', label: 'Vos propres textes' },
              { icon: '🔗', label: 'Bouton vers votre accueil' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>{item.icon}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ Onglets ══ */}
      <div style={{
        display: 'flex', gap: '4px',
        background: '#e9ecef', borderRadius: '12px',
        padding: '4px', marginBottom: '24px',
        width: 'fit-content',
      }}>
        {([
          { id: 'config',   label: '✍️ Textes & image' },
          { id: 'couleurs', label: '🎨 Couleurs' },
          { id: 'apercu',   label: '👁 Aperçu live' },
        ] as const).map(o => (
          <button
            key={o.id}
            className="tab-btn"
            onClick={() => setOnglet(o.id)}
            style={{
              padding: '8px 20px', border: 'none',
              borderRadius: '9px', fontSize: '13px',
              fontWeight: 600, cursor: 'pointer',
              background: onglet === o.id ? '#fff' : 'transparent',
              color: onglet === o.id ? C.gold : C.textLight,
              boxShadow: onglet === o.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* ══ Onglet Textes & image ══ */}
      {onglet === 'config' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px', alignItems: 'start',
        }}>

          {/* Bloc Textes */}
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: '16px', padding: '24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: C.goldLight, color: C.gold, borderRadius: '8px', padding: '4px 10px', fontSize: '13px' }}>Aa</span>
              Textes de la page
            </h2>

            <Champ
              label="Titre principal"
              hint="Ex : Oups\u00a0! Page introuvable, Cette page n'existe pas…"
              value={config.titre}
              onChange={set('titre')}
              placeholder={DEFAUTS.titre}
            />
            <Champ
              label="Sous-titre / message"
              hint="Un message rassurant pour guider votre visiteur."
              value={config.sous_titre}
              onChange={set('sous_titre')}
              placeholder={DEFAUTS.sous_titre}
              multiline
            />
            <Champ
              label="Texte du bouton"
              hint="Ce que votre visiteur verra sur le bouton de retour."
              value={config.texte_bouton}
              onChange={set('texte_bouton')}
              placeholder={DEFAUTS.texte_bouton}
            />
            <Champ
              label="URL du bouton"
              hint="Vers où rediriger le visiteur. Utilisez / pour la page d'accueil de votre site."
              value={config.url_bouton}
              onChange={set('url_bouton')}
              placeholder="/"
              type="url"
            />
          </div>

          {/* Bloc Image */}
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: '16px', padding: '24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: C.orangeLight, color: C.orange, borderRadius: '8px', padding: '4px 10px', fontSize: '13px' }}>🖼</span>
              Illustration
            </h2>

            {/* Aperçu image */}
            {config.image_url ? (
              <div style={{
                position: 'relative', marginBottom: '16px',
                border: `1px solid ${C.border}`,
                borderRadius: '12px', overflow: 'hidden',
                background: '#f8fafc',
              }}>
                <img
                  src={config.image_url}
                  alt="Illustration 404"
                  style={{
                    width: '100%', maxHeight: '180px',
                    objectFit: 'contain', display: 'block',
                    padding: '16px', boxSizing: 'border-box',
                  }}
                  onError={e => { (e.target as HTMLImageElement).src = ''; }}
                />
                <button
                  onClick={() => setConfig(c => ({ ...c, image_url: '' }))}
                  title="Supprimer l'image"
                  style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'rgba(239,68,68,0.9)', color: '#fff',
                    border: 'none', borderRadius: '8px',
                    width: '30px', height: '30px',
                    cursor: 'pointer', fontSize: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div style={{
                background: '#f8fafc',
                border: `2px dashed ${C.border}`,
                borderRadius: '12px', padding: '36px',
                textAlign: 'center', marginBottom: '16px',
                color: C.textXLight,
              }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>🖼️</div>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  Aucune image — l'emoji 🔍 sera affiché par défaut
                </p>
              </div>
            )}

            {/* URL manuelle */}
            <Champ
              label="URL de l'image"
              hint="Collez un lien direct vers une image (PNG, JPEG, SVG, WebP, GIF)."
              value={config.image_url}
              onChange={set('image_url')}
              placeholder="https://cdn.exemple.com/mon-image.png"
              type="url"
            />

            {/* Séparateur */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0 16px' }}>
              <div style={{ flex: 1, height: '1px', background: C.border }} />
              <span style={{ fontSize: '12px', color: C.textXLight }}>ou</span>
              <div style={{ flex: 1, height: '1px', background: C.border }} />
            </div>

            {/* Bouton upload */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) uploadImage(f);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                width: '100%', padding: '11px',
                background: uploading ? '#f1f5f9' : C.goldLight,
                color: C.gold,
                border: `1px solid ${C.gold}`,
                borderRadius: '10px', fontSize: '13px',
                fontWeight: 700,
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {uploading ? '⏳ Upload en cours…' : '📁 Choisir un fichier image'}
            </button>
            <p style={{ margin: '8px 0 0', fontSize: '11px', color: C.textXLight, textAlign: 'center' }}>
              PNG, JPEG, SVG, WebP, GIF — Max 2 Mo
            </p>
          </div>
        </div>
      )}

      {/* ══ Onglet Couleurs ══ */}
      {onglet === 'couleurs' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px', alignItems: 'start',
        }}>
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: '16px', padding: '24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: C.goldLight, color: C.gold, borderRadius: '8px', padding: '4px 10px', fontSize: '13px' }}>🎨</span>
              Palette de couleurs
            </h2>

            <CouleurChamp
              label="Couleur de fond"
              hint="L'arrière-plan de toute la page 404."
              value={config.couleur_fond}
              onChange={set('couleur_fond')}
            />
            <CouleurChamp
              label="Couleur du texte"
              hint="Titre et sous-titre. Assurez-vous d'un bon contraste avec le fond."
              value={config.couleur_texte}
              onChange={set('couleur_texte')}
            />
            <CouleurChamp
              label="Couleur du bouton"
              hint="La couleur principale de votre bouton de retour."
              value={config.couleur_bouton}
              onChange={set('couleur_bouton')}
            />

            {/* Bouton réinitialiser */}
            <div style={{ marginTop: '8px', paddingTop: '20px', borderTop: `1px solid ${C.border}` }}>
              <button
                onClick={reinitialiser}
                style={{
                  width: '100%', padding: '10px',
                  background: 'transparent',
                  color: C.textLight,
                  border: `1px solid ${C.border}`,
                  borderRadius: '10px', fontSize: '13px',
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                🔄 Réinitialiser les couleurs par défaut
              </button>
            </div>
          </div>

          {/* Aperçu compact en temps réel */}
          <div>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: C.textLight }}>
              Aperçu en temps réel
            </p>
            <Preview config={config} />
          </div>
        </div>
      )}

      {/* ══ Onglet Aperçu ══ */}
      {onglet === 'apercu' && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px', flexWrap: 'wrap', gap: '10px',
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>
              Voici exactement ce que verront vos visiteurs sur une page inexistante.
            </p>
            {modifie && (
              <span style={{
                fontSize: '12px', fontWeight: 700,
                color: C.orange, background: C.orangeLight,
                padding: '4px 12px', borderRadius: '20px',
              }}>
                ⚠ Modifications non sauvegardées
              </span>
            )}
          </div>

          <Preview config={config} />

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={sauvegarder}
              disabled={saving || !modifie}
              style={{
                padding: '12px 32px',
                background: modifie
                  ? 'linear-gradient(135deg, #c9a96e, #a07840)'
                  : '#cbd5e1',
                color: modifie ? '#fff' : '#94a3b8',
                border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: 700,
                cursor: modifie ? 'pointer' : 'not-allowed',
                boxShadow: modifie ? '0 4px 16px rgba(201,169,110,0.4)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {saving ? '⏳ Sauvegarde…' : modifie ? '💾 Sauvegarder ces modifications' : '✅ Config à jour'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}