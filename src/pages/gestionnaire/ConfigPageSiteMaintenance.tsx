/**
 * ConfigPageSiteMaintenance.tsx — Dashboard Admin
 * Chemin : evend-dashboard/src/pages/admin/ConfigPageSiteMaintenance.tsx
 *
 * Permet à l'admin de configurer la page publique de maintenance générale
 * (usage manuel — l'admin l'active quand bon lui semble, contrairement à la
 * page "site suspendu" qui se déclenche automatiquement via le cron de
 * vérification de courriel).
 *
 * Même patron que ConfigPage404.tsx.
 *
 * Routes API attendues :
 *   GET  /api/admin/config/page-maintenance        → { titre, sous_titre, texte_bouton, url_bouton, image_url }
 *   PUT  /api/admin/config/page-maintenance        ← même body → { success: true }
 *   POST /api/admin/config/page-maintenance/image  ← FormData { file } → { image_url: "..." }
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

import { API_BASE } from '../../config/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ConfigMaintenance {
  titre:         string;
  sous_titre:    string;
  texte_bouton:  string;
  url_bouton:    string;
  image_url:     string;
}

const DEFAUTS: ConfigMaintenance = {
  titre:        'Site en maintenance',
  sous_titre:   "Nous effectuons présentement des travaux de maintenance. Merci de revenir un peu plus tard.",
  texte_bouton: '',
  url_bouton:   '',
  image_url:    '',
};

// ─── Couleurs (panneau admin — clair) ─────────────────────────────────────────
const C = {
  bg:           '#f8fafc',
  card:         '#ffffff',
  border:       '#e2e8f0',
  accent:       '#dc2626',
  accentLight:  'rgba(220,38,38,0.10)',
  green:        '#10b981',
  greenLight:   'rgba(16,185,129,0.10)',
  orange:       '#f59e0b',
  orangeLight:  'rgba(245,158,11,0.10)',
  red:          '#ef4444',
  text:         '#1e293b',
  textLight:    '#64748b',
  textXLight:   '#94a3b8',
  inputBorder:  '#cbd5e1',
  inputFocus:   '#dc2626',
};

// ─── Petit toast ──────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  return (
    <div style={{
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      background: type === 'ok' ? C.green : C.red,
      color: '#fff', padding: '10px 22px', borderRadius: '10px',
      fontSize: '14px', fontWeight: 600, zIndex: 9999,
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      animation: 'fadeInUp 0.25s ease',
    }}>
      {type === 'ok' ? '✅ ' : '❌ '}{msg}
    </div>
  );
}

// ─── Prévisualisation — reproduit le style réel de SiteMaintenance.tsx ──────────
function Preview({ config }: { config: ConfigMaintenance }) {
  return (
    <div style={{
      background: '#0a0f1e',
      borderRadius: '14px',
      overflow: 'hidden',
      border: `1px solid ${C.border}`,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: '6px', padding: '4px 12px', marginLeft: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
          boutique-cliente.e-vendstudio.ca
        </div>
      </div>

      <div style={{ padding: '48px 32px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          background: '#1a1a1a', borderRadius: '20px', padding: '48px 36px',
          maxWidth: '420px', width: '100%', textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {config.image_url ? (
            <img
              src={config.image_url}
              alt="Illustration"
              style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain', marginBottom: 20 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div style={{ fontSize: 48, marginBottom: 20 }}>🚧</div>
          )}

          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 12px' }}>
            {config.titre || <span style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Titre…</span>}
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.6, margin: '0 0 28px' }}>
            {config.sous_titre || <span style={{ fontStyle: 'italic' }}>Sous-titre…</span>}
          </p>

          {config.texte_bouton && (
            <a
              href={config.url_bouton || '#'}
              onClick={e => e.preventDefault()}
              style={{
                display: 'inline-block', padding: '12px 28px',
                background: 'linear-gradient(135deg,#c9a96e,#a07840)', borderRadius: '10px',
                color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', marginBottom: 16,
              }}
            >
              {config.texte_bouton}
            </a>
          )}

          <div style={{
            fontSize: 12, fontWeight: 700, color: '#c9a96e',
            background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.25)',
            borderRadius: '10px', padding: '10px 16px', display: 'inline-block', marginTop: 8,
          }}>
            e-Vend Studio
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Champ de formulaire ──────────────────────────────────────────────────────
function Champ({
  label, hint, value, onChange, placeholder, multiline = false, type = 'text',
}: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  multiline?: boolean; type?: string;
}) {
  const style: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '9px 12px',
    background: '#f8fafc',
    border: `1px solid ${C.inputBorder}`,
    borderRadius: '8px',
    fontSize: '14px', color: C.text,
    outline: 'none',
    fontFamily: 'system-ui, sans-serif',
    resize: multiline ? 'vertical' : undefined,
    minHeight: multiline ? '80px' : undefined,
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{ marginBottom: '18px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
        {label}
      </label>
      {hint && <p style={{ margin: '0 0 6px', fontSize: '12px', color: C.textXLight }}>{hint}</p>}
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={style} onFocus={e => (e.target.style.borderColor = C.inputFocus)} onBlur={e => (e.target.style.borderColor = C.inputBorder)} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style} onFocus={e => (e.target.style.borderColor = C.inputFocus)} onBlur={e => (e.target.style.borderColor = C.inputBorder)} />
      }
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function ConfigPageSiteMaintenance({ naviguerVers }: { naviguerVers?: (p: string) => void }) {
  const [config, setConfig]       = useState<ConfigMaintenance>(DEFAUTS);
  const [original, setOriginal]   = useState<ConfigMaintenance>(DEFAUTS);
  const [loading, setLoading]     = useState(true);
  const token = localStorage.getItem('token');
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast]         = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [onglet, setOnglet]       = useState<'config' | 'preview'>('config');
  const fileRef                   = useRef<HTMLInputElement>(null);

  const modifie = JSON.stringify(config) !== JSON.stringify(original);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/config/page-maintenance`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const cfg: ConfigMaintenance = {
        titre:        data.titre        ?? DEFAUTS.titre,
        sous_titre:   data.sous_titre   ?? DEFAUTS.sous_titre,
        texte_bouton: data.texte_bouton ?? DEFAUTS.texte_bouton,
        url_bouton:   data.url_bouton   ?? DEFAUTS.url_bouton,
        image_url:    data.image_url    ?? DEFAUTS.image_url,
      };
      setConfig(cfg);
      setOriginal(cfg);
    } catch {
      // Pas encore de config en BD — on garde les défauts
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function sauvegarder() {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/config/page-maintenance`, {
        method: 'PUT',
        credentials: 'include', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      setOriginal({ ...config });
      setToast({ msg: 'Configuration sauvegardée !', type: 'ok' });
    } catch (e: any) {
      setToast({ msg: e.message || 'Erreur lors de la sauvegarde.', type: 'err' });
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/admin/config/page-maintenance/image`, {
        method: 'POST',
        credentials: 'include', headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConfig(c => ({ ...c, image_url: data.image_url }));
      setToast({ msg: 'Image uploadée !', type: 'ok' });
    } catch (e: any) {
      setToast({ msg: e.message || 'Erreur upload.', type: 'err' });
    } finally {
      setUploading(false);
    }
  }

  function set(key: keyof ConfigMaintenance) {
    return (v: string) => setConfig(c => ({ ...c, [key]: v }));
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: C.textLight, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚧</div>
          Chargement de la configuration…
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: C.text }}>🚧 Site en maintenance — Configuration</h1>
          <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>Page affichée à la place d'un site quand l'admin l'active manuellement pour des travaux de maintenance.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {modifie && (
            <button
              onClick={() => { setConfig({ ...original }); }}
              style={{ padding: '9px 18px', background: 'transparent', color: C.textLight, border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Annuler
            </button>
          )}
          <button
            onClick={sauvegarder}
            disabled={saving || !modifie}
            style={{
              padding: '9px 22px',
              background: modifie ? C.accent : '#cbd5e1',
              color: '#fff', border: 'none',
              borderRadius: '10px', fontSize: '13px',
              fontWeight: 700, cursor: modifie ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            {saving ? '⏳ Sauvegarde…' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '10px', padding: '4px', marginBottom: '24px', width: 'fit-content' }}>
        {([
          { id: 'config',  label: '⚙️ Configuration' },
          { id: 'preview', label: '👁 Aperçu' },
        ] as const).map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)}
            style={{ padding: '8px 20px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: onglet === o.id ? '#fff' : 'transparent', color: onglet === o.id ? C.accent : C.textLight, boxShadow: onglet === o.id ? '0 1px 3px rgba(0,0,0,0.10)' : 'none', transition: 'all 0.15s' }}>
            {o.label}
          </button>
        ))}
      </div>

      {onglet === 'config' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', alignItems: 'start' }}>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700, color: C.text }}>
              <span style={{ background: C.accentLight, color: C.accent, borderRadius: '8px', padding: '3px 10px', marginRight: '8px', fontSize: '13px' }}>Aa</span>
              Texte de la page
            </h2>

            <Champ
              label="Titre principal"
              hint="Ex : Site en maintenance, Travaux en cours…"
              value={config.titre}
              onChange={set('titre')}
              placeholder={DEFAUTS.titre}
            />
            <Champ
              label="Sous-titre / message"
              hint="Message expliquant les travaux en cours et, si possible, une idée du délai."
              value={config.sous_titre}
              onChange={set('sous_titre')}
              placeholder={DEFAUTS.sous_titre}
              multiline
            />
            <Champ
              label="Texte du bouton (optionnel)"
              hint="Laissez vide pour ne pas afficher de bouton — souvent, il n'y a rien d'utile à proposer sur cette page."
              value={config.texte_bouton}
              onChange={set('texte_bouton')}
              placeholder="Ex : Nous contacter"
            />
            <Champ
              label="URL du bouton (optionnel)"
              value={config.url_bouton}
              onChange={set('url_bouton')}
              placeholder="https://e-vend.ca/contact"
              type="url"
            />
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700, color: C.text }}>
              <span style={{ background: 'rgba(245,158,11,0.12)', color: C.orange, borderRadius: '8px', padding: '3px 10px', marginRight: '8px', fontSize: '13px' }}>🖼</span>
              Illustration
            </h2>

            {config.image_url ? (
              <div style={{ position: 'relative', marginBottom: '16px', border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden', background: '#f8fafc' }}>
                <img
                  src={config.image_url}
                  alt="Illustration"
                  style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', display: 'block', padding: '12px', boxSizing: 'border-box' }}
                  onError={e => { (e.target as HTMLImageElement).src = ''; }}
                />
                <button
                  onClick={() => setConfig(c => ({ ...c, image_url: '' }))}
                  title="Supprimer l'image"
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', border: `2px dashed ${C.border}`, borderRadius: '10px', padding: '32px', textAlign: 'center', marginBottom: '16px', color: C.textXLight }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🚧</div>
                <p style={{ margin: 0, fontSize: '13px' }}>Aucune image configurée — l'emoji 🚧 sera utilisé</p>
              </div>
            )}

            <Champ
              label="URL de l'image"
              hint="Collez un lien direct vers une image (PNG, JPEG, SVG, WebP)."
              value={config.image_url}
              onChange={set('image_url')}
              placeholder="https://cdn.e-vend.ca/images/maintenance.png"
              type="url"
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0 16px' }}>
              <div style={{ flex: 1, height: '1px', background: C.border }} />
              <span style={{ fontSize: '12px', color: C.textXLight }}>ou</span>
              <div style={{ flex: 1, height: '1px', background: C.border }} />
            </div>

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
                width: '100%', padding: '10px',
                background: uploading ? '#f1f5f9' : C.accentLight,
                color: C.accent, border: `1px solid ${C.accent}`,
                borderRadius: '8px', fontSize: '13px',
                fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer',
              }}
            >
              {uploading ? '⏳ Upload en cours…' : '📁 Choisir un fichier image'}
            </button>

            <p style={{ margin: '8px 0 0', fontSize: '11px', color: C.textXLight, textAlign: 'center' }}>
              Formats acceptés : PNG, JPEG, SVG, WebP — Max 2 Mo
            </p>
          </div>

          <div style={{ background: C.accentLight, border: `1px solid rgba(220,38,38,0.2)`, borderRadius: '14px', padding: '20px', gridColumn: '1 / -1' }}>
            <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: C.accent }}>💡 Comment ça fonctionne</p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: C.accent, lineHeight: 1.8 }}>
              <li>Cette page peut être affichée à la place du site d'un gestionnaire lorsque l'admin l'active manuellement (ex : travaux, incident technique).</li>
              <li>Contrairement à la page "site suspendu", celle-ci ne se déclenche pas automatiquement — c'est un outil manuel.</li>
              <li>Laissez l'image vide pour afficher l'emoji 🚧 par défaut.</li>
              <li>Les changements sont effectifs immédiatement après la sauvegarde.</li>
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: C.textLight }}>
              Aperçu tel qu'il sera vu par un visiteur arrivant sur un site en maintenance.
            </span>
            {modifie && (
              <span style={{ fontSize: '11px', fontWeight: 700, color: C.orange, background: C.orangeLight, padding: '3px 10px', borderRadius: '20px' }}>
                ⚠ Modifications non sauvegardées
              </span>
            )}
          </div>
          <Preview config={config} />
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              onClick={sauvegarder}
              disabled={saving || !modifie}
              style={{
                padding: '10px 28px', background: modifie ? C.accent : '#cbd5e1',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: 700,
                cursor: modifie ? 'pointer' : 'not-allowed',
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