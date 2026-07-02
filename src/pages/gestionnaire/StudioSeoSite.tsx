/**
 * StudioSeoSite.tsx — e-Vend Studio
 * Chemin : src/pages/gestionnaire/StudioSeoSite.tsx
 *
 * Permet à chaque vendeur de configurer le SEO de SON site :
 *   - Titre de la page d'accueil
 *   - Méta-description
 *   - Image Open Graph (partage réseaux sociaux)
 *
 * Routes API :
 *   GET  /api/studio/seo-site/:gestionnaireId  → config actuelle
 *   POST /api/studio/seo-site/:gestionnaireId  → sauvegarder (FormData)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = (window as any).API_BASE || '/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SeoConfig {
  titre_accueil:    string;
  meta_description: string;
  og_image_url:     string;
}

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
      position: 'fixed', bottom: '28px', left: '50%',
      transform: 'translateX(-50%)',
      background: type === 'ok' ? C.green : C.red,
      color: '#fff', padding: '11px 24px', borderRadius: '12px',
      fontSize: '14px', fontWeight: 700, zIndex: 9999,
      boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
      animation: 'fadeInUp 0.25s ease', whiteSpace: 'nowrap',
    }}>
      {type === 'ok' ? '✅ ' : '❌ '}{msg}
    </div>
  );
}

// ─── Compteur de caractères ───────────────────────────────────────────────────
function CharCount({ current, max, warnAt }: { current: number; max: number; warnAt: number }) {
  const color = current > max ? C.red : current > warnAt ? C.orange : C.textLight;
  return (
    <span style={{ fontSize: '11px', color, fontWeight: 700 }}>
      {current} / {max}
    </span>
  );
}

// ─── Aperçu Google ────────────────────────────────────────────────────────────
function ApercuGoogle({ titre, description, slug }: { titre: string; description: string; slug: string }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px 20px', background: '#fff' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
        🔍 Aperçu Google
      </p>
      <p style={{ fontSize: '12px', color: '#5f6368', margin: '0 0 2px' }}>{slug || 'votresite.evend.ca'}</p>
      <p style={{ fontSize: '18px', color: '#1a0dab', margin: '0 0 4px', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {titre || <span style={{ color: C.textXLight, fontStyle: 'italic' }}>Titre de votre site…</span>}
      </p>
      <p style={{ fontSize: '13px', color: '#4d5156', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
        {description || <span style={{ color: C.textXLight, fontStyle: 'italic' }}>Méta-description de votre site…</span>}
      </p>
    </div>
  );
}

// ─── Aperçu réseaux sociaux ───────────────────────────────────────────────────
function ApercuSocial({ titre, description, imageUrl, slug }: { titre: string; description: string; imageUrl: string | null; slug: string }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0, padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
        📱 Aperçu réseaux sociaux
      </p>
      {imageUrl ? (
        <img src={imageUrl} alt="Aperçu OG" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ width: '100%', height: '160px', background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0f1e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '24px', fontWeight: 800, color: C.gold, letterSpacing: '-0.5px' }}>e-Vend Studio</span>
        </div>
      )}
      <div style={{ padding: '10px 14px' }}>
        <p style={{ fontSize: '11px', color: C.textXLight, margin: '0 0 3px', textTransform: 'uppercase' }}>{slug || 'votresite.evend.ca'}</p>
        <p style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {titre || 'Titre de votre site…'}
        </p>
        <p style={{ fontSize: '12px', color: C.textLight, margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
          {description || 'Méta-description de votre site…'}
        </p>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface Props { gestionnaireId: number; }

export default function StudioSeoSite({ gestionnaireId }: Props) {
  const token = localStorage.getItem('token');

  const [config, setConfig]             = useState<SeoConfig>({ titre_accueil: '', meta_description: '', og_image_url: '' });
  const [original, setOriginal]         = useState<SeoConfig>({ titre_accueil: '', meta_description: '', og_image_url: '' });
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [supprimerImg, setSupprimerImg] = useState(false);
  const [toast, setToast]               = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const fileInputRef                    = useRef<HTMLInputElement>(null);

  const modifie = JSON.stringify(config) !== JSON.stringify(original) || !!imageFile || supprimerImg;

  // ── Charger ──────────────────────────────────────────────────────────────
  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/studio/seo-site/${gestionnaireId}`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const cfg: SeoConfig = {
        titre_accueil:    data.titre_accueil    ?? '',
        meta_description: data.meta_description ?? '',
        og_image_url:     data.og_image_url     ?? '',
      };
      setConfig(cfg);
      setOriginal({ ...cfg });
      if (cfg.og_image_url) setImagePreview(cfg.og_image_url);
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  }, [gestionnaireId, token]);

  useEffect(() => { charger(); }, [charger]);

  // ── Toast auto-dismiss ────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Gestion image ─────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setSupprimerImg(false);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function supprimerImage() {
    setImageFile(null);
    setImagePreview(null);
    setSupprimerImg(true);
    setConfig(c => ({ ...c, og_image_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ── Sauvegarder ──────────────────────────────────────────────────────────
  async function sauvegarder() {
    setSaving(true);
    try {
      const form = new FormData();
      form.append('titre_accueil',    config.titre_accueil);
      form.append('meta_description', config.meta_description);
      if (imageFile) form.append('og_image', imageFile);
      if (supprimerImg) form.append('supprimer_image', 'true');

      const res = await fetch(`${API_BASE}/studio/seo-site/${gestionnaireId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const cfg: SeoConfig = {
        titre_accueil:    data.config.titre_accueil    ?? '',
        meta_description: data.config.meta_description ?? '',
        og_image_url:     data.config.og_image_url     ?? '',
      };
      setConfig(cfg);
      setOriginal({ ...cfg });
      setImageFile(null);
      setSupprimerImg(false);
      if (cfg.og_image_url) setImagePreview(cfg.og_image_url);
      setToast({ msg: 'SEO sauvegardé !', type: 'ok' });
    } catch (e: any) {
      setToast({ msg: e.message || 'Erreur lors de la sauvegarde.', type: 'err' });
    } finally { setSaving(false); }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: C.textLight, fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
        <p style={{ margin: 0, fontSize: '14px' }}>Chargement de votre configuration SEO…</p>
      </div>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '28px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        input:focus, textarea:focus { border-color: #c9a96e !important; outline: none; }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ══ En-tête ══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(201,169,110,0.3)' }}>
            🔍
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: C.text }}>Référencement SEO</h1>
            <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>Optimisez la visibilité de votre site sur Google et les réseaux sociaux</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {modifie && (
            <button onClick={() => { setConfig({ ...original }); setImageFile(null); setSupprimerImg(false); if (original.og_image_url) setImagePreview(original.og_image_url); else setImagePreview(null); }}
              style={{ padding: '9px 18px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: C.textLight }}>
              Annuler
            </button>
          )}
          <button onClick={sauvegarder} disabled={saving || !modifie}
            style={{ padding: '9px 22px', background: modifie ? 'linear-gradient(135deg, #c9a96e, #a07840)' : '#cbd5e1', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: modifie ? '#fff' : '#94a3b8', cursor: modifie ? 'pointer' : 'not-allowed', boxShadow: modifie ? '0 4px 12px rgba(201,169,110,0.35)' : 'none', transition: 'all 0.15s' }}>
            {saving ? '⏳ Sauvegarde…' : modifie ? '💾 Sauvegarder' : '✅ À jour'}
          </button>
        </div>
      </div>

      {/* ══ Bandeau explicatif ══ */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0f1e 100%)', border: `1px solid rgba(201,169,110,0.25)`, borderRadius: '16px', padding: '18px 22px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div style={{ fontSize: '28px', flexShrink: 0 }}>💡</div>
        <div>
          <p style={{ margin: '0 0 5px', fontSize: '14px', fontWeight: 700, color: C.gold }}>Pourquoi le SEO est important ?</p>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.60)', lineHeight: 1.7 }}>
            Le SEO (référencement naturel) détermine comment votre site apparaît dans Google et sur les réseaux sociaux. Un bon titre et une bonne description attirent plus de visiteurs sans payer de publicité.
          </p>
        </div>
      </div>

      {/* ══ Section 1 — Titre & Description ══ */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.border}`, background: '#f8fafc' }}>
          <h2 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 700, color: C.text }}>🏷️ Titre & méta-description</h2>
          <p style={{ margin: 0, fontSize: '12px', color: C.textLight }}>Ce que Google affiche dans ses résultats de recherche.</p>
        </div>

        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
          {/* Champs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Titre */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Titre de la page d'accueil
                </label>
                <CharCount current={config.titre_accueil.length} max={70} warnAt={60} />
              </div>
              <input
                type="text"
                value={config.titre_accueil}
                maxLength={70}
                placeholder="Ex : Boutique Fleurs de Marie | Arrangements floraux Montréal"
                onChange={e => setConfig(c => ({ ...c, titre_accueil: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `1px solid ${C.border2}`, borderRadius: '8px', fontSize: '13px', color: C.text, background: '#f8fafc', transition: 'border-color 0.15s' }}
              />
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: C.textXLight }}>Recommandé : 50–70 caractères.</p>
            </div>

            {/* Méta-description */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Méta-description
                </label>
                <CharCount current={config.meta_description.length} max={320} warnAt={160} />
              </div>
              <textarea
                value={config.meta_description}
                maxLength={320}
                rows={5}
                placeholder="Décrivez votre site en 1-2 phrases. Ex : Découvrez nos arrangements floraux faits à la main à Montréal. Livraison rapide, qualité premium."
                onChange={e => setConfig(c => ({ ...c, meta_description: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `1px solid ${C.border2}`, borderRadius: '8px', fontSize: '13px', color: C.text, background: '#f8fafc', fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical', transition: 'border-color 0.15s' }}
              />
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: C.textXLight }}>Recommandé : 120–160 caractères pour un résultat optimal.</p>
            </div>
          </div>

          {/* Aperçu Google */}
          <div>
            <ApercuGoogle
              titre={config.titre_accueil}
              description={config.meta_description}
              slug={`votresite.evend.ca`}
            />
          </div>
        </div>
      </div>

      {/* ══ Section 2 — Image Open Graph ══ */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.border}`, background: '#f8fafc' }}>
          <h2 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 700, color: C.text }}>🖼️ Image de partage social (Open Graph)</h2>
          <p style={{ margin: 0, fontSize: '12px', color: C.textLight }}>
            Affichée quand quelqu'un partage votre site sur Facebook, LinkedIn, iMessage, etc. Taille recommandée : <strong>1200 × 630 px</strong>.
          </p>
        </div>

        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
          {/* Zone upload */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '10px' }}>
              Image de partage
            </label>

            {imagePreview ? (
              <div>
                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
                  <img src={imagePreview} alt="Aperçu OG" style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                  >
                    <button style={{ background: 'rgba(255,255,255,0.92)', color: C.text, border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                      Changer l'image
                    </button>
                  </div>
                </div>
                <button onClick={supprimerImage} style={{ marginTop: '8px', background: 'none', border: 'none', color: C.red, fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                  🗑️ Supprimer l'image
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ border: `2px dashed ${C.border}`, borderRadius: '12px', padding: '36px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s', background: '#f8fafc' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = C.goldLight; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = '#f8fafc'; }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Cliquer pour importer</p>
                <p style={{ fontSize: '11px', color: C.textXLight, margin: 0 }}>PNG, JPG, WEBP — max 5 Mo</p>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleFileChange} />

            {imageFile && (
              <p style={{ fontSize: '11px', color: C.green, margin: '8px 0 0', fontWeight: 600 }}>
                ✅ Nouvelle image prête : {imageFile.name}
              </p>
            )}
          </div>

          {/* Aperçu social */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '10px' }}>
              Aperçu réseaux sociaux
            </label>
            <ApercuSocial
              titre={config.titre_accueil}
              description={config.meta_description}
              imageUrl={imagePreview}
              slug="votresite.evend.ca"
            />
          </div>
        </div>
      </div>

      {/* ══ Conseils SEO ══ */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: C.text }}>💡 Conseils pour un bon référencement</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {[
            { icon: '🏷️', titre: 'Titre unique', desc: 'Incluez votre nom de boutique et votre spécialité. Ex : Fleurs Marie | Boutique florale Montréal' },
            { icon: '📝', titre: 'Description claire', desc: 'Décrivez ce que vous vendez et où vous êtes. Incluez des mots-clés naturellement.' },
            { icon: '🖼️', titre: 'Image percutante', desc: 'Une belle image de vos produits ou de votre marque augmente les clics sur les réseaux sociaux.' },
            { icon: '📍', titre: 'Mentionnez votre ville', desc: 'Si vous vendez localement, mentionner votre ville dans le titre aide le référencement local.' },
          ].map(c => (
            <div key={c.titre} style={{ padding: '14px', background: C.goldLight, borderRadius: '12px', border: `1px solid rgba(201,169,110,0.2)` }}>
              <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: C.text }}>{c.icon} {c.titre}</p>
              <p style={{ margin: 0, fontSize: '12px', color: C.textLight, lineHeight: 1.5 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}