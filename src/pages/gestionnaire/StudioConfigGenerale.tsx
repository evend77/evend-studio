/**
 * StudioConfigGenerale.tsx — e-Vend Studio
 * Chemin : src/pages/gestionnaire/StudioConfigGenerale.tsx
 *
 * Configuration générale du site du vendeur :
 * nom, logo, bannière, email, devise, langue, réseaux sociaux, footer, etc.
 * Stocké dans sites.config JSONB (clé "generale")
 *
 * Routes API :
 *   GET /api/studio/sites/:gestionnaireId      → config actuelle
 *   PUT /api/studio/sites/:id/config      → sauvegarder
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = (window as any).API_BASE || '/api';

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
  accent:      '#c9a96e',
};

const inputStyle: React.CSSProperties = {
  padding: '9px 12px', border: `1px solid ${C.border2}`, borderRadius: '8px',
  fontSize: '13px', color: C.text, background: '#f8fafc', outline: 'none',
  width: '100%', boxSizing: 'border-box' as const,
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface ConfigGenerale {
  nom_site:             string;
  email_contact:        string;
  telephone:            string;
  domaine:              string;
  langue:               string;
  devise:               string;
  fuseau_horaire:       string;
  footer_texte:         string;
  logo_url:             string;
  banniere_url:         string;
  banniere_active:      boolean;
  banniere_message:     string;
  banniere_type:        'info' | 'warning' | 'danger';
  social_facebook:      string;
  social_instagram:     string;
  social_x:             string;
  social_linkedin:      string;
  social_youtube:       string;
  social_tiktok:        string;
  social_pinterest:     string;
  mode_maintenance:     boolean;
  message_maintenance:  string;
  avis_actifs:          boolean;
  notifs_auto:          boolean;
}

const DEFAUTS: ConfigGenerale = {
  nom_site:             '',
  email_contact:        '',
  telephone:            '',
  domaine:              '',
  langue:               'fr',
  devise:               'CAD',
  fuseau_horaire:       'America/Toronto',
  footer_texte:         'Copyright ($annee) Tous droits réservés',
  logo_url:             '',
  banniere_url:         '',
  banniere_active:      false,
  banniere_message:     '',
  banniere_type:        'info',
  social_facebook:      '',
  social_instagram:     '',
  social_x:             '',
  social_linkedin:      '',
  social_youtube:       '',
  social_tiktok:        '',
  social_pinterest:     '',
  mode_maintenance:     false,
  message_maintenance:  '',
  avis_actifs:          true,
  notifs_auto:          true,
};

// ─── Composants UI ────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  return (
    <div style={{ position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)', background: type === 'ok' ? C.green : C.red, color: '#fff', padding: '11px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, zIndex: 9999, boxShadow: '0 6px 24px rgba(0,0,0,0.18)', animation: 'fadeInUp 0.25s ease', whiteSpace: 'nowrap' }}>
      {type === 'ok' ? '✅ ' : '❌ '}{msg}
    </div>
  );
}

function Section({ titre, icon, children }: { titre: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ padding: '14px 20px', borderBottom: `2px solid ${C.gold}`, background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <h3 style={{ fontSize: '13px', fontWeight: 800, color: C.gold, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{titre}</h3>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

function ParamLigne({ label, desc, children, last }: { label: string; desc?: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', paddingBottom: last ? 0 : '16px', marginBottom: last ? 0 : '16px', borderBottom: last ? 'none' : '1px solid #f0f0f0' }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: '0 0 2px' }}>{label}</p>
        {desc && <p style={{ fontSize: '11px', color: C.textLight, margin: 0, lineHeight: 1.5 }}>{desc}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: '48px', height: '26px', borderRadius: '13px', background: value ? C.green : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: value ? '25px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </div>
  );
}

function CouleurInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: '40px', height: '36px', border: `1px solid ${C.border}`, borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
      <input type="text" value={value} onChange={e => onChange(e.target.value)} maxLength={7} style={{ ...inputStyle, width: '100px', fontFamily: 'monospace' }} />
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface Props { gestionnaireId: number; }

export default function StudioConfigGenerale({ gestionnaireId }: Props) {
  const token   = localStorage.getItem('token');
  const [siteId, setSiteId]     = useState<number | null>(null);
  const [config, setConfig]     = useState<ConfigGenerale>(DEFAUTS);
  const [original, setOriginal] = useState<ConfigGenerale>(DEFAUTS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [onglet, setOnglet]     = useState<'general' | 'banniere' | 'social' | 'avance'>('general');
  const [toast, setToast]       = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const logoRef                 = useRef<HTMLInputElement>(null);
  const banRef                  = useRef<HTMLInputElement>(null);

  const modifie = JSON.stringify(config) !== JSON.stringify(original);

  // ── F2A (compte, séparé du config du site) ──────────────────────────────
  const [f2aActif, setF2aActif] = useState(false);
  const [f2aSaving, setF2aSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/gestionnaires/moi`, {
      credentials: 'include', headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && typeof data.two_factor_enabled === 'boolean') setF2aActif(data.two_factor_enabled); })
      .catch(() => {});
  }, [gestionnaireId]);

  async function toggleF2a() {
    const nouvelEtat = !f2aActif;
    setF2aSaving(true);
    try {
      const res = await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/2fa`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: nouvelEtat }),
      });
      if (!res.ok) throw new Error();
      setF2aActif(nouvelEtat);
      setToast({ msg: nouvelEtat ? 'Vérification en 2 étapes activée !' : 'Vérification en 2 étapes désactivée.', type: 'ok' });
    } catch {
      setToast({ msg: 'Erreur lors de la modification.', type: 'err' });
    } finally {
      setF2aSaving(false);
    }
  }

  // ── Charger ──────────────────────────────────────────────────────────────
  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/studio/sites/${gestionnaireId}`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSiteId(data.id);
      const g = data.config?.generale ?? {};
      const cfg = { ...DEFAUTS, ...g };
      setConfig(cfg);
      setOriginal({ ...cfg });
    } catch { /* garder défauts */ }
    finally { setLoading(false); }
  }, [gestionnaireId, token]);

  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }, [toast]);

  // ── Sauvegarder ──────────────────────────────────────────────────────────
  async function sauvegarder() {
    if (!siteId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/studio/sites/${siteId}/config`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ config: { generale: config } }),
      });
      if (!res.ok) throw new Error();
      setOriginal({ ...config });
      setToast({ msg: 'Configuration sauvegardée !', type: 'ok' });
    } catch { setToast({ msg: 'Erreur lors de la sauvegarde.', type: 'err' }); }
    finally { setSaving(false); }
  }

  // ── Upload image ──────────────────────────────────────────────────────────
  async function uploadImage(file: File, champ: 'logo_url' | 'banniere_url') {
    const form = new FormData();
    form.append('photo', file);
    try {
      const res = await fetch(`${API_BASE}/studio/photos-vendeur/${gestionnaireId}/upload`, {
        method: 'POST', credentials: 'include', headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      set(champ)(data.photo.url);
      setToast({ msg: 'Image uploadée !', type: 'ok' });
    } catch { setToast({ msg: "Erreur lors de l'upload.", type: 'err' }); }
  }

  function set<K extends keyof ConfigGenerale>(key: K) {
    return (v: ConfigGenerale[K]) => setConfig(c => ({ ...c, [key]: v }));
  }

  const BANNIERE_COULEURS = {
    info:    { bg: '#eff6ff', color: '#1d4ed8', label: 'ℹ️ Information' },
    warning: { bg: '#fffbeb', color: '#92400e', label: '⚠️ Avertissement' },
    danger:  { bg: '#fff1f2', color: '#be123c', label: '🚨 Urgent' },
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: C.textLight, fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚙️</div>
        <p style={{ margin: 0 }}>Chargement de la configuration…</p>
      </div>
    </div>
  );

  const ONGLETS = [
    { id: 'general',  label: '🌍 Général' },
    { id: 'banniere', label: '📢 Bannière' },
    { id: 'social',   label: '📱 Réseaux sociaux' },
    { id: 'avance',   label: '⚙️ Avancé' },
  ] as const;

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '28px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(201,169,110,0.3)' }}>⚙️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: C.text }}>Configuration générale</h1>
            <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>Paramètres de base de votre site</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {modifie && <button onClick={() => setConfig({ ...original })} style={{ padding: '9px 18px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: C.textLight }}>Annuler</button>}
          <button onClick={sauvegarder} disabled={saving || !modifie} style={{ padding: '9px 22px', background: modifie ? 'linear-gradient(135deg, #c9a96e, #a07840)' : '#cbd5e1', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: modifie ? '#fff' : '#94a3b8', cursor: modifie ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
            {saving ? '⏳ Sauvegarde…' : modifie ? '💾 Sauvegarder' : '✅ À jour'}
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: `2px solid ${C.border}`, marginBottom: '24px', flexWrap: 'wrap' }}>
        {ONGLETS.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)} style={{ padding: '10px 18px', border: 'none', cursor: 'pointer', borderRadius: '8px 8px 0 0', fontSize: '13px', fontWeight: onglet === o.id ? 700 : 500, background: onglet === o.id ? C.card : 'transparent', color: onglet === o.id ? C.gold : C.textLight, borderBottom: onglet === o.id ? `2px solid ${C.gold}` : '2px solid transparent', marginBottom: '-2px', transition: 'all 0.15s' }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* ── Onglet Général ── */}
      {onglet === 'general' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          <div>
            <Section titre="Informations du site" icon="🌍">
              <ParamLigne label="Nom de votre site" desc="Affiché dans le titre des pages et les emails.">
                <input style={{ ...inputStyle, width: '220px' }} value={config.nom_site} onChange={e => set('nom_site')(e.target.value)} placeholder="Ma Boutique" />
              </ParamLigne>
              <ParamLigne label="Email de contact" desc="Email affiché aux visiteurs de votre site.">
                <input style={{ ...inputStyle, width: '220px' }} type="email" value={config.email_contact} onChange={e => set('email_contact')(e.target.value)} placeholder="contact@monsite.ca" />
              </ParamLigne>
              <ParamLigne label="Téléphone" desc="Numéro affiché dans votre site (optionnel).">
                <input style={{ ...inputStyle, width: '180px' }} value={config.telephone} onChange={e => set('telephone')(e.target.value)} placeholder="514 555-1234" />
              </ParamLigne>
              <ParamLigne label="Domaine personnalisé" desc="Votre domaine si vous en avez un (ex: monsite.ca)." last>
                <input style={{ ...inputStyle, width: '220px' }} value={config.domaine} onChange={e => set('domaine')(e.target.value)} placeholder="monsite.ca" />
              </ParamLigne>
            </Section>

            <Section titre="Langue & région" icon="🌐">
              <ParamLigne label="Langue du site">
                <select style={{ ...inputStyle, width: '180px' }} value={config.langue} onChange={e => set('langue')(e.target.value)}>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="es">🇪🇸 Español</option>
                </select>
              </ParamLigne>
              <ParamLigne label="Devise">
                <select style={{ ...inputStyle, width: '160px' }} value={config.devise} onChange={e => set('devise')(e.target.value)}>
                  <option value="CAD">🇨🇦 CAD ($)</option>
                  <option value="USD">🇺🇸 USD ($)</option>
                  <option value="EUR">🇪🇺 EUR (€)</option>
                  <option value="GBP">🇬🇧 GBP (£)</option>
                </select>
              </ParamLigne>
              <ParamLigne label="Fuseau horaire" last>
                <select style={{ ...inputStyle, width: '220px' }} value={config.fuseau_horaire} onChange={e => set('fuseau_horaire')(e.target.value)}>
                  <option value="America/Toronto">EST — Toronto / Montréal</option>
                  <option value="America/Vancouver">PST — Vancouver</option>
                  <option value="America/Winnipeg">CST — Winnipeg</option>
                  <option value="America/Halifax">AST — Halifax</option>
                  <option value="America/New_York">EST — New York</option>
                  <option value="Europe/Paris">CET — Paris</option>
                </select>
              </ParamLigne>
            </Section>
          </div>

          <div>
            <Section titre="Logo & bannière par défaut" icon="🖼️">
              {/* Logo */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: '0 0 6px' }}>Logo du site</p>
                {config.logo_url ? (
                  <div style={{ marginBottom: '8px', border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden', background: '#f8fafc', padding: '12px', textAlign: 'center' }}>
                    <img src={config.logo_url} alt="Logo" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{ border: `2px dashed ${C.border}`, borderRadius: '10px', padding: '24px', textAlign: 'center', background: '#f8fafc', marginBottom: '8px' }}>
                    <p style={{ margin: 0, color: C.textXLight, fontSize: '13px' }}>🖼️ Aucun logo</p>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0], 'logo_url'); }} />
                  <button onClick={() => logoRef.current?.click()} style={{ padding: '7px 14px', background: C.goldLight, border: `1px solid ${C.gold}`, borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: C.gold, cursor: 'pointer' }}>
                    {config.logo_url ? 'Changer' : 'Télécharger'}
                  </button>
                  {config.logo_url && <button onClick={() => set('logo_url')('')} style={{ padding: '7px 14px', background: '#fff', border: `1px solid ${C.red}`, borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: C.red, cursor: 'pointer' }}>Supprimer</button>}
                </div>
              </div>

              {/* Bannière image */}
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: '0 0 6px' }}>Image bannière par défaut</p>
                {config.banniere_url ? (
                  <div style={{ marginBottom: '8px', border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden' }}>
                    <img src={config.banniere_url} alt="Bannière" style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} />
                  </div>
                ) : (
                  <div style={{ border: `2px dashed ${C.border}`, borderRadius: '10px', padding: '24px', textAlign: 'center', background: '#f8fafc', marginBottom: '8px' }}>
                    <p style={{ margin: 0, color: C.textXLight, fontSize: '13px' }}>🖼️ Aucune bannière</p>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input ref={banRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0], 'banniere_url'); }} />
                  <button onClick={() => banRef.current?.click()} style={{ padding: '7px 14px', background: C.goldLight, border: `1px solid ${C.gold}`, borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: C.gold, cursor: 'pointer' }}>
                    {config.banniere_url ? 'Changer' : 'Télécharger'}
                  </button>
                  {config.banniere_url && <button onClick={() => set('banniere_url')('')} style={{ padding: '7px 14px', background: '#fff', border: `1px solid ${C.red}`, borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: C.red, cursor: 'pointer' }}>Supprimer</button>}
                </div>
              </div>
            </Section>

            <Section titre="Pied de page" icon="📄">
              <ParamLigne label="Texte du footer" desc="Utilisez $annee pour l'année courante." last>
                <input style={{ ...inputStyle, width: '280px' }} value={config.footer_texte} onChange={e => set('footer_texte')(e.target.value)} placeholder="Copyright ($annee) Tous droits réservés" />
              </ParamLigne>
              {config.footer_texte && (
                <p style={{ margin: '8px 0 0', fontSize: '11px', color: C.textXLight }}>
                  Aperçu : {config.footer_texte.replace('$annee', new Date().getFullYear().toString())}
                </p>
              )}
            </Section>
          </div>
        </div>
      )}

      {/* ── Onglet Bannière ── */}
      {onglet === 'banniere' && (
        <div style={{ maxWidth: '700px' }}>
          <Section titre="Bannière d'annonce" icon="📢">
            <p style={{ fontSize: '13px', color: C.textLight, margin: '0 0 16px', lineHeight: 1.6 }}>
              Affiche un message important en haut de votre site (promotion, fermeture temporaire, etc.)
            </p>
            <ParamLigne label="Activer la bannière">
              <Toggle value={config.banniere_active} onChange={set('banniere_active')} />
            </ParamLigne>
            {config.banniere_active && (
              <>
                <ParamLigne label="Message" desc="Texte affiché dans la bannière.">
                  <input style={{ ...inputStyle, width: '300px' }} value={config.banniere_message} onChange={e => set('banniere_message')(e.target.value)} placeholder="🎉 Promotion — Livraison gratuite ce weekend !" />
                </ParamLigne>
                <ParamLigne label="Type de bannière" last>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['info', 'warning', 'danger'] as const).map(type => (
                      <button key={type} onClick={() => set('banniere_type')(type)} style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: `2px solid ${config.banniere_type === type ? BANNIERE_COULEURS[type].color : C.border}`, background: config.banniere_type === type ? BANNIERE_COULEURS[type].bg : '#fff', color: config.banniere_type === type ? BANNIERE_COULEURS[type].color : C.textLight }}>
                        {BANNIERE_COULEURS[type].label}
                      </button>
                    ))}
                  </div>
                </ParamLigne>
                {/* Aperçu */}
                <div style={{ marginTop: '16px', borderRadius: '8px', padding: '12px 20px', background: BANNIERE_COULEURS[config.banniere_type].bg, color: BANNIERE_COULEURS[config.banniere_type].color, fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
                  {config.banniere_message || 'Aperçu de votre bannière…'}
                </div>
              </>
            )}
          </Section>
        </div>
      )}

      {/* ── Onglet Réseaux sociaux ── */}
      {onglet === 'social' && (
        <div style={{ maxWidth: '600px' }}>
          <Section titre="Réseaux sociaux" icon="📱">
            <p style={{ fontSize: '13px', color: C.textLight, margin: '0 0 16px', lineHeight: 1.6 }}>
              Ces liens apparaîtront dans le pied de page et les sections réseaux sociaux de votre site.
            </p>
            {([
              { key: 'social_facebook',  label: 'Facebook',  icon: '📘', placeholder: 'https://facebook.com/mapage' },
              { key: 'social_instagram', label: 'Instagram', icon: '📸', placeholder: 'https://instagram.com/moncompte' },
              { key: 'social_x',        label: 'X (Twitter)', icon: '🐦', placeholder: 'https://x.com/moncompte' },
              { key: 'social_linkedin', label: 'LinkedIn',  icon: '💼', placeholder: 'https://linkedin.com/in/monprofil' },
              { key: 'social_youtube',  label: 'YouTube',   icon: '▶️', placeholder: 'https://youtube.com/@machaîne' },
              { key: 'social_tiktok',   label: 'TikTok',    icon: '🎵', placeholder: 'https://tiktok.com/@moncompte' },
              { key: 'social_pinterest',label: 'Pinterest', icon: '📌', placeholder: 'https://pinterest.ca/moncompte' },
            ] as const).map(s => (
              <ParamLigne key={s.key} label={`${s.icon} ${s.label}`} last={s.key === 'social_pinterest'}>
                <input style={{ ...inputStyle, width: '280px' }} type="url" value={config[s.key]} onChange={e => set(s.key)(e.target.value)} placeholder={s.placeholder} />
              </ParamLigne>
            ))}
          </Section>
        </div>
      )}

      {/* ── Onglet Avancé ── */}
      {onglet === 'avance' && (
        <div style={{ maxWidth: '700px' }}>
          <Section titre="Fonctionnalités" icon="⭐">
            <ParamLigne label="Avis clients" desc="Permet aux acheteurs de laisser des avis sur votre site.">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: config.avis_actifs ? C.green : C.textLight }}>{config.avis_actifs ? '✓ Actif' : '— Inactif'}</span>
                <Toggle value={config.avis_actifs} onChange={set('avis_actifs')} />
              </div>
            </ParamLigne>
            <ParamLigne label="Notifications automatiques" desc="Envoie des emails pour les nouvelles commandes et événements." last>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: config.notifs_auto ? C.green : C.textLight }}>{config.notifs_auto ? '🔔 Actif' : '— Inactif'}</span>
                <Toggle value={config.notifs_auto} onChange={set('notifs_auto')} />
              </div>
            </ParamLigne>
          </Section>

          <Section titre="Mode maintenance" icon="🛠️">
            <ParamLigne label="Activer le mode maintenance" desc="Rend votre site inaccessible aux visiteurs pendant que vous faites des modifications.">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: config.mode_maintenance ? C.red : C.textLight }}>{config.mode_maintenance ? '🛑 Actif' : '— Inactif'}</span>
                <Toggle value={config.mode_maintenance} onChange={set('mode_maintenance')} />
              </div>
            </ParamLigne>
            {config.mode_maintenance && (
              <>
                <ParamLigne label="Message de maintenance" desc="Affiché aux visiteurs qui tentent d'accéder à votre site." last>
                  <input style={{ ...inputStyle, width: '280px' }} value={config.message_maintenance} onChange={e => set('message_maintenance')(e.target.value)} placeholder="Site en maintenance. Retour prévu bientôt…" />
                </ParamLigne>
                <div style={{ marginTop: '14px', background: C.redLight, border: `1px solid ${C.red}`, borderRadius: '8px', padding: '10px 14px' }}>
                  <p style={{ fontSize: '12px', color: C.red, fontWeight: 700, margin: '0 0 2px' }}>🛑 Mode maintenance ACTIF</p>
                  <p style={{ fontSize: '11px', color: C.text, margin: 0 }}>Votre site est actuellement inaccessible aux visiteurs.</p>
                </div>
              </>
            )}
          </Section>

          <Section titre="Vérification en 2 étapes" icon="🔐">
            <ParamLigne label="Activer la vérification en 2 étapes" desc="À chaque connexion, un code vous sera envoyé par courriel en plus de votre mot de passe." last>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: f2aActif ? C.green : C.textLight }}>{f2aActif ? '🔐 Actif' : '— Inactif'}</span>
                <Toggle value={f2aActif} onChange={toggleF2a} />
              </div>
            </ParamLigne>
            {f2aSaving && <p style={{ fontSize: '11px', color: C.textLight, margin: '8px 0 0' }}>⏳ Mise à jour…</p>}
          </Section>
        </div>
      )}
    </div>
  );
}