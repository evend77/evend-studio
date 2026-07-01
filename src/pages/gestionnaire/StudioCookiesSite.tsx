/**
 * StudioCookiesSite.tsx — e-Vend Studio
 * Chemin : src/pages/gestionnaire/StudioCookiesSite.tsx
 *
 * Permet à chaque vendeur de configurer la bannière cookies de SON site,
 * conforme à la Loi 25 (Québec) + LPRPDE (Canada).
 *
 * Routes API :
 *   GET /api/studio/cookies-site/:gestionnaireId  → config actuelle
 *   PUT /api/studio/cookies-site/:gestionnaireId  → sauvegarder
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = (window as any).API_BASE || 'http://localhost:5000/api';

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
  supprimer_non_essentiels:    boolean;
}

const DEFAUTS: CookieConfig = {
  actif:                       true,
  position:                    'bas-gauche',
  titre:                       'Nous respectons votre vie privée !',
  description:                 "Conformément à la Loi 25 (Québec) et à la LPRPDE (Canada), certains témoins de connexion sont nécessaires au fonctionnement sécurisé de ce site.",
  bouton_accepter:             'Accepter tout',
  bouton_refuser:              'Accepter obligatoire uniquement',
  bouton_preferences:          'Gérer les préférences',
  lien_politique:              '/politique-confidentialite',
  lien_conditions:             '/conditions-service',
  texte_politique:             'Politique de confidentialité',
  texte_conditions:            'Conditions générales',
  couleur_fond:                '#1a2436',
  couleur_titre:               '#ffffff',
  couleur_texte:               '#cccccc',
  couleur_bouton_accept:       '#c9a96e',
  couleur_texte_bouton_accept: '#1a1a1a',
  afficher_bouton_preferences: true,
  categories_actives:          { fonctionnalite: true, analytique: true, marketing: true },
  supprimer_non_essentiels:    true,
};

// ─── Palette Studio ───────────────────────────────────────────────────────────
const C = {
  bg:          '#f4f6f8',
  card:        '#ffffff',
  border:      '#e2e8f0',
  gold:        '#c9a96e',
  goldLight:   'rgba(201,169,110,0.12)',
  green:       '#10b981',
  greenLight:  'rgba(16,185,129,0.10)',
  red:         '#ef4444',
  redLight:    'rgba(239,68,68,0.10)',
  orange:      '#f59e0b',
  orangeLight: 'rgba(245,158,11,0.10)',
  text:        '#1e293b',
  textLight:   '#64748b',
  textXLight:  '#94a3b8',
  border2:     '#cbd5e1',
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  return (
    <div style={{
      position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
      background: type === 'ok' ? C.green : C.red, color: '#fff',
      padding: '11px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
      zIndex: 9999, boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
      animation: 'fadeInUp 0.25s ease', whiteSpace: 'nowrap',
    }}>
      {type === 'ok' ? '✅ ' : '❌ '}{msg}
    </div>
  );
}

// ─── Aperçu de la bannière ────────────────────────────────────────────────────
function BannerPreview({ config }: { config: CookieConfig }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: `1px solid ${C.border}` }}>
      <div style={{ width: '300px', background: config.couleur_fond, borderRadius: '14px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 18px 0', textAlign: 'center' }}>
          <div style={{ fontSize: '26px', marginBottom: '6px' }}>🔒</div>
          <h4 style={{ color: config.couleur_titre, fontSize: '13px', fontWeight: 800, margin: '0 0 8px' }}>{config.titre || 'Titre…'}</h4>
          <p style={{ color: config.couleur_texte, fontSize: '11px', lineHeight: 1.5, margin: 0 }}>
            {(config.description || '').slice(0, 180)}{config.description?.length > 180 ? '…' : ''}
          </p>
        </div>
        <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button style={{ padding: '9px', borderRadius: '7px', border: 'none', background: config.couleur_bouton_accept, color: config.couleur_texte_bouton_accept, fontSize: '12px', fontWeight: 700, cursor: 'default' }}>
            🔑 {config.bouton_accepter || 'Accepter tout'}
          </button>
          <button style={{ padding: '8px', borderRadius: '7px', background: 'transparent', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '11px', cursor: 'default' }}>
            {config.bouton_refuser || 'Refuser'}
          </button>
          {config.afficher_bouton_preferences && (
            <button style={{ padding: '8px', borderRadius: '7px', background: 'transparent', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', cursor: 'default' }}>
              ⚙️ {config.bouton_preferences || 'Préférences'}
            </button>
          )}
        </div>
        <div style={{ padding: '8px 16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', textDecoration: 'underline' }}>{config.texte_politique}</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', textDecoration: 'underline' }}>{config.texte_conditions}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Champ couleur ────────────────────────────────────────────────────────────
function CouleurChamp({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>{label}</label>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <input type="color" value={value} onChange={e => onChange(e.target.value)}
            style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: value, border: `2px solid ${C.border}`, cursor: 'pointer' }} />
        </div>
        <input type="text" value={value} onChange={e => onChange(e.target.value)} maxLength={7}
          style={{ flex: 1, padding: '8px 12px', border: `1px solid ${C.border2}`, borderRadius: '8px', fontSize: '13px', color: C.text, fontFamily: 'monospace', background: '#f8fafc', outline: 'none' }} />
      </div>
    </div>
  );
}

// ─── Champ texte ──────────────────────────────────────────────────────────────
function Champ({ label, value, onChange, placeholder, hint, multiline }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; multiline?: boolean;
}) {
  const style: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '9px 12px',
    border: `1px solid ${C.border2}`, borderRadius: '8px', fontSize: '13px',
    color: C.text, background: '#f8fafc', outline: 'none',
    fontFamily: 'system-ui, sans-serif', resize: multiline ? 'vertical' : undefined,
    minHeight: multiline ? '80px' : undefined,
  };
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>{label}</label>
      {hint && <p style={{ margin: '0 0 5px', fontSize: '11px', color: C.textXLight }}>{hint}</p>}
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={style} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style} />
      }
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ value, onChange, label, hint }: { value: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => onChange(!value)}>
        <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: value ? C.gold : '#d1d5db', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: '2px', left: value ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: C.text }}>{label}</p>
          {hint && <p style={{ margin: 0, fontSize: '11px', color: C.textXLight }}>{hint}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface Props { gestionnaireId: number; }

export default function StudioCookiesSite({ gestionnaireId }: Props) {
  const token = localStorage.getItem('token');

  const [config, setConfig]     = useState<CookieConfig>(DEFAUTS);
  const [original, setOriginal] = useState<CookieConfig>(DEFAUTS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [onglet, setOnglet]     = useState<'parametres' | 'design' | 'contenu'>('parametres');
  const [toast, setToast]       = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const modifie = JSON.stringify(config) !== JSON.stringify(original);

  // ── Charger ──────────────────────────────────────────────────────────────
  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/studio/cookies-site/${gestionnaireId}`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const cfg = { ...DEFAUTS, ...data };
      setConfig(cfg);
      setOriginal({ ...cfg });
    } catch { /* garder les défauts */ }
    finally { setLoading(false); }
  }, [gestionnaireId, token]);

  useEffect(() => { charger(); }, [charger]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Sauvegarder ──────────────────────────────────────────────────────────
  async function sauvegarder() {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/studio/cookies-site/${gestionnaireId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setOriginal({ ...config });
      setToast({ msg: 'Configuration sauvegardée !', type: 'ok' });
    } catch (e: any) {
      setToast({ msg: e.message || 'Erreur lors de la sauvegarde.', type: 'err' });
    } finally { setSaving(false); }
  }

  function set<K extends keyof CookieConfig>(key: K) {
    return (v: CookieConfig[K]) => setConfig(c => ({ ...c, [key]: v }));
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: C.textLight, fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🍪</div>
        <p style={{ margin: 0, fontSize: '14px' }}>Chargement de la configuration…</p>
      </div>
    </div>
  );

  const ONGLETS = [
    { id: 'parametres',  label: '⚙️ Paramètres' },
    { id: 'design',      label: '🎨 Design' },
    { id: 'contenu',     label: '📝 Textes' },
  ] as const;

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '28px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ══ En-tête ══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(201,169,110,0.3)' }}>
            🍪
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: C.text }}>Gestion des cookies</h1>
            <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>Bannière de consentement conforme Loi 25 (QC) + LPRPDE (CA)</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Badge statut */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: config.actif ? C.greenLight : C.redLight, border: `1px solid ${config.actif ? C.green : C.red}` }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: config.actif ? C.green : C.red }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: config.actif ? C.green : C.red }}>
              {config.actif ? 'Bannière active' : 'Bannière désactivée'}
            </span>
          </div>
          {modifie && (
            <button onClick={() => setConfig({ ...original })} style={{ padding: '9px 18px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: C.textLight }}>
              Annuler
            </button>
          )}
          <button onClick={sauvegarder} disabled={saving || !modifie}
            style={{ padding: '9px 22px', background: modifie ? 'linear-gradient(135deg, #c9a96e, #a07840)' : '#cbd5e1', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: modifie ? '#fff' : '#94a3b8', cursor: modifie ? 'pointer' : 'not-allowed', boxShadow: modifie ? '0 4px 12px rgba(201,169,110,0.35)' : 'none', transition: 'all 0.15s' }}>
            {saving ? '⏳ Sauvegarde…' : modifie ? '💾 Sauvegarder' : '✅ À jour'}
          </button>
        </div>
      </div>

      {/* ══ Bandeau légal ══ */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0f1e 100%)', border: `1px solid rgba(201,169,110,0.25)`, borderRadius: '16px', padding: '16px 22px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ fontSize: '24px', flexShrink: 0 }}>⚖️</div>
        <div>
          <p style={{ margin: '0 0 3px', fontSize: '13px', fontWeight: 700, color: C.gold }}>Conformité légale obligatoire</p>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
            La <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Loi 25 (Québec)</strong> et la <strong style={{ color: 'rgba(255,255,255,0.8)' }}>LPRPDE (Canada)</strong> exigent d'informer vos visiteurs sur l'utilisation des cookies et d'obtenir leur consentement avant d'activer les cookies non essentiels.
          </p>
        </div>
      </div>

      {/* ══ Onglets ══ */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: `2px solid ${C.border}`, marginBottom: '24px', flexWrap: 'wrap' }}>
        {ONGLETS.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)}
            style={{ padding: '10px 18px', border: 'none', cursor: 'pointer', borderRadius: '8px 8px 0 0', fontSize: '13px', fontWeight: onglet === o.id ? 700 : 500, background: onglet === o.id ? C.card : 'transparent', color: onglet === o.id ? C.gold : C.textLight, borderBottom: onglet === o.id ? `2px solid ${C.gold}` : '2px solid transparent', marginBottom: '-2px', transition: 'all 0.15s' }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* ══ Onglet Paramètres ══ */}
      {onglet === 'parametres' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '14px', fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚙️ Configuration générale</h3>

            <Toggle value={config.actif} onChange={set('actif')} label="Activer la bannière de cookies" hint="Désactivez si votre site n'utilise aucun cookie non essentiel." />

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>Position de la bannière</label>
              <select value={config.position} onChange={e => set('position')(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border2}`, borderRadius: '8px', fontSize: '13px', color: C.text, background: '#f8fafc', outline: 'none' }}>
                <option value="bas-gauche">En bas à gauche</option>
                <option value="bas-droite">En bas à droite</option>
                <option value="bas-centre">En bas au centre</option>
                <option value="centre">Centre (avec overlay)</option>
              </select>
            </div>

            <Toggle value={config.afficher_bouton_preferences} onChange={set('afficher_bouton_preferences')} label="Afficher le bouton de préférences" hint="Permet au visiteur de choisir catégorie par catégorie." />
            <Toggle value={config.supprimer_non_essentiels} onChange={set('supprimer_non_essentiels')} label="Bloquer les cookies non essentiels avant consentement" hint="Recommandé pour la conformité Loi 25." />

            <h3 style={{ margin: '24px 0 16px', fontSize: '13px', fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🍪 Catégories de cookies</h3>
            {(['fonctionnalite', 'analytique', 'marketing'] as const).map(cat => (
              <Toggle
                key={cat}
                value={config.categories_actives[cat]}
                onChange={v => setConfig(c => ({ ...c, categories_actives: { ...c.categories_actives, [cat]: v } }))}
                label={cat === 'fonctionnalite' ? 'Fonctionnalité' : cat === 'analytique' ? 'Analytique' : 'Marketing'}
              />
            ))}

            <h3 style={{ margin: '24px 0 16px', fontSize: '13px', fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔗 Liens légaux</h3>
            <Champ label="URL — Politique de confidentialité" value={config.lien_politique} onChange={set('lien_politique')} placeholder="/politique-confidentialite" />
            <Champ label="URL — Conditions générales" value={config.lien_conditions} onChange={set('lien_conditions')} placeholder="/conditions-service" />
          </div>
          <div>
            <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>👁️ Aperçu</p>
            <BannerPreview config={config} />
          </div>
        </div>
      )}

      {/* ══ Onglet Design ══ */}
      {onglet === 'design' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '14px', fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎨 Couleurs de la bannière</h3>
            <CouleurChamp label="Couleur de fond" value={config.couleur_fond} onChange={set('couleur_fond')} />
            <CouleurChamp label="Couleur du titre" value={config.couleur_titre} onChange={set('couleur_titre')} />
            <CouleurChamp label="Couleur du texte" value={config.couleur_texte} onChange={set('couleur_texte')} />
            <h3 style={{ margin: '20px 0 16px', fontSize: '13px', fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔘 Bouton d'acceptation</h3>
            <CouleurChamp label="Couleur du bouton Accepter" value={config.couleur_bouton_accept} onChange={set('couleur_bouton_accept')} />
            <CouleurChamp label="Couleur du texte du bouton" value={config.couleur_texte_bouton_accept} onChange={set('couleur_texte_bouton_accept')} />
          </div>
          <div>
            <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>👁️ Aperçu en temps réel</p>
            <BannerPreview config={config} />
          </div>
        </div>
      )}

      {/* ══ Onglet Textes ══ */}
      {onglet === 'contenu' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '14px', fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📝 Textes de la bannière</h3>
            <Champ label="Titre" value={config.titre} onChange={set('titre')} placeholder="Nous respectons votre vie privée !" />
            <Champ label="Description" value={config.description} onChange={set('description')} multiline hint="Expliquez brièvement pourquoi vous utilisez des cookies." />
            <h3 style={{ margin: '20px 0 16px', fontSize: '13px', fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔘 Textes des boutons</h3>
            <Champ label="Bouton — Accepter tout" value={config.bouton_accepter} onChange={set('bouton_accepter')} placeholder="Accepter tout" />
            <Champ label="Bouton — Refuser" value={config.bouton_refuser} onChange={set('bouton_refuser')} placeholder="Accepter obligatoire uniquement" />
            <Champ label="Bouton — Préférences" value={config.bouton_preferences} onChange={set('bouton_preferences')} placeholder="Gérer les préférences" />
            <h3 style={{ margin: '20px 0 16px', fontSize: '13px', fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔗 Textes des liens légaux</h3>
            <Champ label="Texte lien — Politique de confidentialité" value={config.texte_politique} onChange={set('texte_politique')} placeholder="Politique de confidentialité" />
            <Champ label="Texte lien — Conditions générales" value={config.texte_conditions} onChange={set('texte_conditions')} placeholder="Conditions générales" />
          </div>
          <div>
            <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>👁️ Aperçu en temps réel</p>
            <BannerPreview config={config} />
          </div>
        </div>
      )}

    </div>
  );
}