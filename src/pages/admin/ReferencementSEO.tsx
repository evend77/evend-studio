// CHEMIN : src/pages/admin/ReferencementSEO.tsx
import React, { useState, useEffect, useRef } from 'react';

const THEME = {
  accent:      '#2d6a9f',
  accentLight: '#e8f2fb',
  bg:          '#f0f2f5',
  card:        '#ffffff',
  border:      '#e1e4e8',
  text:        '#1a2332',
  textLight:   '#6b7280',
  danger:      '#dc2626',
  success:     '#16a34a',
  warning:     '#d97706',
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface SeoConfig {
  titre_accueil:    string;
  meta_description: string;
  og_image_url:     string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant compteur de caractères
// ─────────────────────────────────────────────────────────────────────────────
function CharCount({ current, max, warnAt }: { current: number; max: number; warnAt: number }) {
  const color = current > warnAt ? THEME.warning : THEME.textLight;
  return (
    <span style={{ fontSize: '11px', color, fontWeight: '600' }}>
      {current} / {max}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Aperçu Google
// ─────────────────────────────────────────────────────────────────────────────
function ApercuGoogle({ titre, description }: { titre: string; description: string }) {
  return (
    <div style={{ border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '16px 20px', background: '#fff' }}>
      <p style={{ fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 10px' }}>
        🔍 Aperçu Google
      </p>
      <p style={{ fontSize: '12px', color: '#5f6368', margin: '0 0 2px' }}>e-vendstudio.ca</p>
      <p style={{ fontSize: '18px', color: '#1a0dab', margin: '0 0 4px', fontWeight: '400', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
        {titre || <span style={{ color: THEME.textLight, fontStyle: 'italic' }}>Titre de la page...</span>}
      </p>
      <p style={{ fontSize: '13px', color: '#4d5156', margin: 0, lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
        {description || <span style={{ color: THEME.textLight, fontStyle: 'italic' }}>Méta-description...</span>}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Aperçu réseaux sociaux (Open Graph)
// ─────────────────────────────────────────────────────────────────────────────
function ApercuSocial({ titre, description, imageUrl }: { titre: string; description: string; imageUrl: string | null }) {
  return (
    <div style={{ border: `1px solid ${THEME.border}`, borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
      <p style={{ fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0', padding: '12px 16px', borderBottom: `1px solid ${THEME.border}` }}>
        📱 Aperçu réseaux sociaux
      </p>
      {imageUrl ? (
        <img src={imageUrl} alt="Aperçu OG" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ width: '100%', height: '160px', background: 'linear-gradient(135deg, #2d6a9f 0%, #1a4a7a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '28px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>e-Vend Studio</span>
        </div>
      )}
      <div style={{ padding: '10px 14px' }}>
        <p style={{ fontSize: '11px', color: THEME.textLight, margin: '0 0 3px', textTransform: 'uppercase' as const }}>E-VENDSTUDIO.CA</p>
        <p style={{ fontSize: '14px', fontWeight: '700', color: THEME.text, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
          {titre || 'Titre de la page...'}
        </p>
        <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0, lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
          {description || 'Méta-description...'}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale — ReferencementSEO
// ─────────────────────────────────────────────────────────────────────────────
export default function ReferencementSEO({ naviguerVers }: { naviguerVers?: (p: string) => void }) {
  const [config, setConfig]           = useState<SeoConfig>({ titre_accueil: '', meta_description: '', og_image_url: null });
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [erreur, setErreur]           = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  // ── Chargement initial ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/seoPlateforme', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!res.ok) throw new Error('Erreur chargement');
        const data = await res.json();
        setConfig({
          titre_accueil:    data.titre_accueil    || '',
          meta_description: data.meta_description || '',
          og_image_url:     data.og_image_url     || null,
        });
        if (data.og_image_url) setImagePreview(data.og_image_url);
      } catch (err) {
        setErreur('Impossible de charger la configuration SEO.');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // ── Gestion image ───────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const supprimerImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setConfig(c => ({ ...c, og_image_url: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Sauvegarde ──────────────────────────────────────────────────────────────
  const sauvegarder = async () => {
    setSaving(true);
    setErreur(null);
    try {
      const formData = new FormData();
      formData.append('titre_accueil',    config.titre_accueil);
      formData.append('meta_description', config.meta_description);
      if (imageFile) {
        formData.append('og_image', imageFile);
      }
      if (!imageFile && !imagePreview) {
        formData.append('supprimer_image', 'true');
      }

      const res = await fetch('/api/seoPlateforme', {
        method:  'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body:    formData,
      });
      if (!res.ok) throw new Error('Erreur sauvegarde');
      const data = await res.json();
      if (data.og_image_url) setImagePreview(data.og_image_url);
      setImageFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setErreur('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  // ── Rendu ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' as const, color: THEME.textLight }}>
        Chargement...
      </div>
    );
  }

  const titreDisplay = config.titre_accueil   || 'e-Vend Studio | Crée ton site web et ta boutique en ligne';
  const descDisplay  = config.meta_description || "Crée ton site web, ta boutique en ligne ou ton site vitrine sans programmer. e-Vend Studio, la plateforme québécoise pour entrepreneurs d'ici.";

  return (
    <div style={{ padding: '16px 20px 40px', maxWidth: '100%' }}>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
            🔍 Référencement naturel (SEO)
          </h1>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
            Configurez comment e-Vend Studio apparaît dans les moteurs de recherche et sur les réseaux sociaux.
          </p>
        </div>
      </div>

      {/* ── Message d'erreur ── */}
      {erreur && (
        <div style={{ background: '#fef2f2', border: `1px solid ${THEME.danger}30`, borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: THEME.danger, fontSize: '13px' }}>
          ⚠️ {erreur}
        </div>
      )}

      {/* ── Confirmation sauvegarde ── */}
      {saved && (
        <div style={{ background: '#f0fdf4', border: `1px solid ${THEME.success}30`, borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: THEME.success, fontSize: '13px', fontWeight: '600' }}>
          ✅ Configuration SEO sauvegardée avec succès.
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — Titre & méta-description
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' }}>

        {/* En-tête section */}
        <div style={{ padding: '16px 20px', borderBottom: `2px solid ${THEME.border}`, background: '#f8fafc' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: THEME.text, margin: '0 0 2px' }}>
            📄 Page d'accueil
          </h2>
          <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0 }}>
            Titre et description affichés par Google et les réseaux sociaux.
          </p>
        </div>

        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

          {/* ─ Formulaire ─ */}
          <div>
            {/* Titre */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.4px' }}>
                  Titre de la page d'accueil
                </label>
                <CharCount current={config.titre_accueil.length} max={70} warnAt={60} />
              </div>
              <input
                type="text"
                value={config.titre_accueil}
                maxLength={70}
                placeholder="e-Vend Studio | Crée ton site web et ta boutique en ligne"
                onChange={e => setConfig(c => ({ ...c, titre_accueil: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none', color: THEME.text, boxSizing: 'border-box' as const }}
                onFocus={e  => (e.target.style.borderColor = THEME.accent)}
                onBlur={e   => (e.target.style.borderColor = THEME.border)}
              />
              <p style={{ fontSize: '11px', color: THEME.textLight, margin: '4px 0 0' }}>
                Recommandé : 50–70 caractères.
              </p>
            </div>

            {/* Méta-description */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.4px' }}>
                  Méta-description
                </label>
                <CharCount current={config.meta_description.length} max={320} warnAt={280} />
              </div>
              <textarea
                value={config.meta_description}
                maxLength={320}
                rows={5}
                placeholder="Crée ton site web, ta boutique en ligne ou ton site vitrine sans programmer. e-Vend Studio, la plateforme québécoise pour entrepreneurs d'ici."
                onChange={e => setConfig(c => ({ ...c, meta_description: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical', color: THEME.text, fontFamily: 'inherit', lineHeight: '1.6', boxSizing: 'border-box' as const }}
                onFocus={e  => (e.target.style.borderColor = THEME.accent)}
                onBlur={e   => (e.target.style.borderColor = THEME.border)}
              />
              <p style={{ fontSize: '11px', color: THEME.textLight, margin: '4px 0 0' }}>
                Recommandé : 120–160 caractères pour un résultat optimal.
              </p>
            </div>
          </div>

          {/* ─ Aperçu Google ─ */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
            <ApercuGoogle titre={titreDisplay} description={descDisplay} />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — Image Open Graph
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' }}>

        <div style={{ padding: '16px 20px', borderBottom: `2px solid ${THEME.border}`, background: '#f8fafc' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: THEME.text, margin: '0 0 2px' }}>
            🖼️ Image de partage social (Open Graph)
          </h2>
          <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0 }}>
            Affichée quand quelqu'un partage votre site sur Facebook, LinkedIn, iMessage, etc. Taille recommandée : <strong>1200 × 630 px</strong>.
          </p>
        </div>

        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

          {/* ─ Zone d'import ─ */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.4px', display: 'block', marginBottom: '10px' }}>
              Image de partage
            </label>

            {imagePreview ? (
              /* Image chargée */
              <div>
                <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${THEME.border}` }}>
                  <img src={imagePreview} alt="Aperçu OG" style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                  >
                    <button style={{ background: 'rgba(255,255,255,0.92)', color: THEME.text, border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                      Changer l'image
                    </button>
                  </div>
                </div>
                <button
                  onClick={supprimerImage}
                  style={{ marginTop: '8px', background: 'none', border: 'none', color: THEME.danger, fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                >
                  🗑️ Supprimer l'image
                </button>
              </div>
            ) : (
              /* Zone vide — cliquer pour importer */
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ border: `2px dashed ${THEME.border}`, borderRadius: '10px', padding: '32px 20px', textAlign: 'center' as const, cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = THEME.accent; e.currentTarget.style.background = THEME.accentLight; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = THEME.border;  e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📁</div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: '0 0 4px' }}>Cliquer pour importer</p>
                <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>PNG, JPG, WEBP — max 5 Mo</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {imageFile && (
              <p style={{ fontSize: '11px', color: THEME.success, margin: '8px 0 0', fontWeight: '600' }}>
                ✅ Nouvelle image prête à sauvegarder : {imageFile.name}
              </p>
            )}
          </div>

          {/* ─ Aperçu social ─ */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.4px', display: 'block', marginBottom: '10px' }}>
              Aperçu réseaux sociaux
            </label>
            <ApercuSocial titre={titreDisplay} description={descDisplay} imageUrl={imagePreview} />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BOUTON SAUVEGARDER
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          onClick={sauvegarder}
          disabled={saving}
          style={{ background: saving ? THEME.textLight : THEME.accent, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 28px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
        >
          {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
        </button>
      </div>

    </div>
  );
}