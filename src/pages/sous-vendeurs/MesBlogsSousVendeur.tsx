/**
 * MesBlogsSousVendeur.tsx — e-Vend Studio
 * Chemin : src/pages/sous-vendeurs/MesBlogsSousVendeur.tsx
 *
 * Page blog pour le sous-vendeur — inspiré de MesBlogs.tsx d'e-Vend
 * Le sous-vendeur peut créer, modifier, publier et supprimer ses articles.
 *
 * Routes API :
 *   GET    /api/studio/blogs-sv/:vendeurId/mes-articles/:sousVendeurId
 *   POST   /api/studio/blogs-sv/:vendeurId/mes-articles/:sousVendeurId
 *   PUT    /api/studio/blogs-sv/:vendeurId/mes-articles/:sousVendeurId/:blogId
 *   DELETE /api/studio/blogs-sv/:vendeurId/mes-articles/:sousVendeurId/:blogId
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = (window as any).API_BASE || '/api';

const T = {
  accent: '#c9a96e', accentLight: 'rgba(201,169,110,0.12)',
  bg: '#f4f6f8', card: '#fff', border: '#e2e8f0',
  text: '#1e293b', textLight: '#64748b',
  success: '#10b981', warning: '#f59e0b', danger: '#ef4444',
};

interface Blog {
  id: number; titre: string; contenu: string;
  statut: 'publie' | 'brouillon' | 'actif' | 'inactif' | 'en_attente' | 'refuse';
  vues: number; tags: string[];
  date_creation: string; date_publication?: string;
}

interface Props { vendeurId: number; sousVendeurId: number; }

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success'|'danger' }) {
  const bg = type === 'success' ? T.success : T.danger;
  return (
    <div style={{ position: 'fixed', top: '80px', right: '24px', backgroundColor: bg, color: 'white', padding: '12px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
      {msg}
    </div>
  );
}

// ─── Éditeur riche ────────────────────────────────────────────────────────────
function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editorRef   = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (editorRef.current && !initialized) {
      editorRef.current.innerHTML = value || '';
      setInitialized(true);
    }
  }, [initialized]);

  useEffect(() => {
    if (editorRef.current && initialized && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, initialized]);

  const exec = (cmd: string, val = '') => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const insertImage = async (file: File) => {
    // Fallback base64 si pas d'upload disponible
    const reader = new FileReader();
    reader.onload = (e) => { if (e.target?.result) exec('insertImage', e.target.result as string); };
    reader.readAsDataURL(file);
  };

  const handleImagePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) { e.preventDefault(); const f = items[i].getAsFile(); if (f) insertImage(f); }
    }
  };

  const btn = (active = false): React.CSSProperties => ({
    padding: '5px 9px', background: active ? T.accentLight : '#fff',
    border: `1px solid ${T.border}`, borderRadius: '5px', cursor: 'pointer',
    fontSize: '13px', fontWeight: 700, color: active ? T.accent : T.text, minWidth: '32px',
  });

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: '8px', overflow: 'hidden' }}>
      <style>{`.rich-editor img { max-width:100% !important; height:auto !important; max-height:300px !important; object-fit:contain !important; border-radius:8px !important; margin:10px 0 !important; }`}</style>
      <div style={{ background: '#f8f9fa', borderBottom: `1px solid ${T.border}`, padding: '8px 10px', display: 'flex', gap: '4px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
        <button type="button" style={btn()} onMouseDown={e => { e.preventDefault(); exec('bold'); }}><strong>G</strong></button>
        <button type="button" style={btn()} onMouseDown={e => { e.preventDefault(); exec('italic'); }}><em>I</em></button>
        <button type="button" style={btn()} onMouseDown={e => { e.preventDefault(); exec('underline'); }}><u>S</u></button>
        <div style={{ width: 1, height: 24, background: T.border, margin: '0 4px' }} />
        <button type="button" style={btn()} onMouseDown={e => { e.preventDefault(); exec('justifyLeft'); }}>⬅</button>
        <button type="button" style={btn()} onMouseDown={e => { e.preventDefault(); exec('justifyCenter'); }}>≡</button>
        <button type="button" style={btn()} onMouseDown={e => { e.preventDefault(); exec('justifyRight'); }}>⮕</button>
        <div style={{ width: 1, height: 24, background: T.border, margin: '0 4px' }} />
        <button type="button" style={btn()} onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }}>• Liste</button>
        <button type="button" style={btn()} onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }}>1. Liste</button>
        <div style={{ width: 1, height: 24, background: T.border, margin: '0 4px' }} />
        <button type="button" style={{ ...btn(), background: T.accentLight, color: T.accent, display: 'flex', alignItems: 'center', gap: '4px' }}
          onMouseDown={e => { e.preventDefault(); fileInputRef.current?.click(); }}>
          🖼 Image
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) insertImage(f); e.target.value = ''; }} />
        <div style={{ width: 1, height: 24, background: T.border, margin: '0 4px' }} />
        <select style={{ fontSize: '12px', border: `1px solid ${T.border}`, borderRadius: '5px', padding: '4px 6px', background: '#fff' }}
          onChange={e => exec('fontSize', e.target.value)} defaultValue="3">
          {[['1','8pt'],['2','10pt'],['3','12pt'],['4','14pt'],['5','18pt'],['6','24pt'],['7','36pt']].map(([v,l]) =>
            <option key={v} value={v}>{l}</option>
          )}
        </select>
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning
        onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }}
        onPaste={handleImagePaste}
        className="rich-editor"
        style={{ minHeight: '280px', padding: '16px', outline: 'none', fontSize: '14px', lineHeight: '1.7', color: T.text, overflowY: 'auto' as const }} />
      <div style={{ padding: '6px 12px', background: '#f8f9fa', borderTop: `1px solid ${T.border}`, fontSize: '11px', color: T.textLight }}>
        💡 Collez des images directement ou cliquez sur "🖼 Image"
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function MesBlogsSousVendeur({ vendeurId, sousVendeurId }: Props) {
  const token  = localStorage.getItem('token');
  const hdrs   = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const apiUrl = `${API_BASE}/studio/blogs-sv/${vendeurId}/mes-articles/${sousVendeurId}`;

  const [blogs, setBlogs]                 = useState<Blog[]>([]);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [vue, setVue]                     = useState<'liste'|'editeur'>('liste');
  const [blogEdite, setBlogEdite]         = useState<Blog | null>(null);
  const [recherche, setRecherche]         = useState('');
  const [filtreStatut, setFiltreStatut]   = useState<'tous'|'publie'|'brouillon'>('tous');
  const [toast, setToast]                 = useState<{ msg: string; type: 'success'|'danger' } | null>(null);
  const [confirmerSuppr, setConfirmerSuppr] = useState<number | null>(null);

  const [titreDraft, setTitreDraft]   = useState('');
  const [contenuDraft, setContenuDraft] = useState('');
  const [tagsDraft, setTagsDraft]     = useState('');
  const [statutDraft, setStatutDraft] = useState<'publie'|'brouillon'>('brouillon');

  const showToast = (msg: string, type: 'success'|'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(apiUrl, { headers: hdrs as any });
      const data = await res.json();
      if (Array.isArray(data)) setBlogs(data.map((b: any) => ({
        ...b,
        tags: Array.isArray(b.tags) ? b.tags : (b.tags ? b.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
      })));
    } catch { showToast('❌ Erreur de chargement', 'danger'); }
    finally { setLoading(false); }
  }, [sousVendeurId, vendeurId]);

  useEffect(() => { charger(); }, [charger]);

  const ouvrirNouveauBlog = () => {
    setBlogEdite(null);
    setTitreDraft(''); setContenuDraft(''); setTagsDraft(''); setStatutDraft('brouillon');
    setVue('editeur');
  };

  const ouvrirEdition = (b: Blog) => {
    setBlogEdite(b);
    setTitreDraft(b.titre); setContenuDraft(b.contenu);
    setTagsDraft(b.tags.join(', ')); setStatutDraft(b.statut === 'publie' ? 'publie' : 'brouillon');
    setVue('editeur');
  };

  const sauvegarder = async () => {
    if (!titreDraft.trim() || !contenuDraft.trim()) {
      showToast('⚠️ Titre et contenu obligatoires.', 'danger'); return;
    }
    setSaving(true);
    const body = { titre: titreDraft, contenu: contenuDraft, tags: tagsDraft.split(',').map(t => t.trim()).filter(Boolean), statut: statutDraft };
    try {
      const res = blogEdite
        ? await fetch(`${apiUrl}/${blogEdite.id}`, { method: 'PUT',  headers: hdrs as any, body: JSON.stringify(body) })
        : await fetch(apiUrl,                       { method: 'POST', headers: hdrs as any, body: JSON.stringify(body) });

      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erreur'); }
      const data = await res.json();

      // Informer si mis en attente d'approbation
      if (data.en_attente) {
        showToast('⏳ Article soumis — en attente d\'approbation par le propriétaire.', 'success');
      } else {
        showToast(blogEdite ? '✅ Article mis à jour !' : statutDraft === 'publie' ? '🌐 Article publié !' : '💾 Brouillon sauvegardé.', 'success');
      }
      await charger(); setVue('liste');
    } catch (e: any) { showToast('❌ ' + e.message, 'danger'); }
    finally { setSaving(false); }
  };

  const supprimer = async (id: number) => {
    try {
      await fetch(`${apiUrl}/${id}`, { method: 'DELETE', headers: hdrs as any });
      setConfirmerSuppr(null);
      showToast('🗑️ Article supprimé.', 'danger');
      await charger();
    } catch { showToast('❌ Erreur suppression', 'danger'); }
  };

  const toggleStatut = async (b: Blog) => {
    const nouveau = b.statut === 'publie' || b.statut === 'actif' ? 'brouillon' : 'publie';
    try {
      await fetch(`${apiUrl}/${b.id}`, { method: 'PUT', headers: hdrs as any, body: JSON.stringify({ statut: nouveau }) });
      showToast('✅ Statut mis à jour.', 'success');
      await charger();
    } catch { showToast('❌ Erreur', 'danger'); }
  };

  const blogsFiltres = blogs.filter(b => {
    const s = recherche.toLowerCase();
    const inSearch = !s || b.titre.toLowerCase().includes(s) || b.tags.some(t => t.toLowerCase().includes(s));
    const inStatut = filtreStatut === 'tous' || b.statut === filtreStatut || (filtreStatut === 'publie' && b.statut === 'actif');
    return inSearch && inStatut;
  });

  const estPublie = (b: Blog) => b.statut === 'publie' || b.statut === 'actif';

  // ── VUE ÉDITEUR ──────────────────────────────────────────────────────────
  if (vue === 'editeur') return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '24px', borderBottom: `2px solid ${T.border}`, paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setVue('liste')}
            style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: T.accent, padding: '8px', borderRadius: '8px' }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: T.text, margin: 0 }}>
            {blogEdite ? "Modifier l'article" : 'Nouvel article de blog'}
          </h1>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ maxWidth: '820px', paddingBottom: '60px' }}>
        {/* Titre */}
        <div style={{ background: T.card, borderRadius: '14px', border: `1px solid ${T.border}`, padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase' as const, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>Titre *</label>
          <input value={titreDraft} onChange={e => setTitreDraft(e.target.value)}
            placeholder="Ex: Nouveaux produits disponibles ce printemps..."
            style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '12px 14px', fontSize: '15px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' as const, color: T.text }} />
        </div>

        {/* Contenu */}
        <div style={{ background: T.card, borderRadius: '14px', border: `1px solid ${T.border}`, padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase' as const, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>Contenu *</label>
          <RichEditor value={contenuDraft} onChange={setContenuDraft} />
        </div>

        {/* Tags + Statut */}
        <div style={{ background: T.card, borderRadius: '14px', border: `1px solid ${T.border}`, padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase' as const, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>Tags (séparés par virgules)</label>
            <input value={tagsDraft} onChange={e => setTagsDraft(e.target.value)}
              placeholder="ex: conseil, nouveauté, promo"
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase' as const, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>Statut de publication</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['brouillon', 'publie'] as const).map(s => (
                <button key={s} type="button" onClick={() => setStatutDraft(s)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${statutDraft === s ? T.accent : T.border}`, background: statutDraft === s ? T.accentLight : 'white', color: statutDraft === s ? T.accent : T.textLight, fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
                  {s === 'brouillon' ? '💾 Brouillon' : '🌐 Publier'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => setVue('liste')}
            style={{ padding: '11px 22px', border: `1px solid ${T.border}`, borderRadius: '9px', background: 'white', color: T.text, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            Annuler
          </button>
          <button type="button" onClick={sauvegarder} disabled={saving || !titreDraft.trim() || !contenuDraft.trim()}
            style={{ padding: '11px 24px', border: 'none', borderRadius: '9px', background: !saving && titreDraft.trim() && contenuDraft.trim() ? (statutDraft === 'publie' ? T.success : T.accent) : '#aaa', color: 'white', fontSize: '13px', fontWeight: 800, cursor: 'pointer', minWidth: '160px' }}>
            {saving ? '⏳ Sauvegarde...' : statutDraft === 'publie' ? '🌐 Publier l\'article' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );

  // ── VUE LISTE ─────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px', fontFamily: 'system-ui, sans-serif', background: T.bg, minHeight: '100vh' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Modal suppression */}
      {confirmerSuppr !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '14px', maxWidth: '380px', width: '100%', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '16px 20px', background: '#fff5f5', borderBottom: `2px solid ${T.danger}` }}>
              <p style={{ fontSize: '14px', fontWeight: 800, color: T.danger, margin: 0 }}>🗑️ Supprimer cet article ?</p>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: T.text, margin: '0 0 20px' }}>Cette action est irréversible.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setConfirmerSuppr(null)} style={{ flex: 1, padding: '10px', border: `1px solid ${T.border}`, borderRadius: '8px', background: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                <button onClick={() => supprimer(confirmerSuppr!)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: T.danger, color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: T.text, margin: '0 0 4px' }}>📝 Mon blog</h1>
          <p style={{ fontSize: '13px', color: T.textLight, margin: 0 }}>Rédigez et publiez vos articles sur votre boutique</p>
        </div>
        <button onClick={ouvrirNouveauBlog}
          style={{ padding: '11px 22px', background: `linear-gradient(135deg, ${T.accent}, #a07840)`, border: 'none', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(201,169,110,0.3)' }}>
          ✏️ Nouvel article
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Articles publiés', val: blogs.filter(b => estPublie(b)).length, icon: '🌐', color: T.success },
          { label: 'Brouillons',       val: blogs.filter(b => b.statut === 'brouillon').length, icon: '💾', color: T.accent },
          { label: 'Vues totales',     val: blogs.reduce((s, b) => s + (b.vues || 0), 0), icon: '👁', color: T.warning },
        ].map((k, i) => (
          <div key={i} style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px' }}>{k.icon}</span>
              <p style={{ fontSize: '22px', fontWeight: 900, color: k.color, margin: 0 }}>{k.val}</p>
            </div>
            <p style={{ fontSize: '11px', color: T.textLight, margin: 0, fontWeight: 600 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ background: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' as const }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
          <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher par titre ou tag..."
            style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '8px 10px 8px 30px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' as const }} />
        </div>
        {(['tous', 'publie', 'brouillon'] as const).map(f => (
          <button key={f} onClick={() => setFiltreStatut(f)}
            style={{ padding: '7px 14px', borderRadius: '7px', border: `1px solid ${filtreStatut === f ? T.accent : T.border}`, background: filtreStatut === f ? T.accentLight : 'white', color: filtreStatut === f ? T.accent : T.textLight, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            {f === 'tous' ? 'Tous' : f === 'publie' ? '🌐 Publiés' : '💾 Brouillons'}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: T.textLight }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
          <p>Chargement des articles...</p>
        </div>
      ) : blogsFiltres.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', background: T.card, borderRadius: '14px', border: `1px solid ${T.border}`, color: T.textLight }}>
          <div style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.3 }}>📝</div>
          <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Aucun article trouvé</p>
          <p style={{ fontSize: '12px', margin: '0 0 16px' }}>Créez votre premier article !</p>
          <button onClick={ouvrirNouveauBlog} style={{ background: T.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            ✏️ Créer un article
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {blogsFiltres.map(b => (
            <div key={b.id} style={{ background: T.card, borderRadius: '14px', border: `1px solid ${T.border}`, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' as const }}>
                  <span style={{
                    background: estPublie(b) ? '#dcfce7' : b.statut === 'en_attente' ? '#fef9c3' : b.statut === 'refuse' || b.statut === 'inactif' ? '#fee2e2' : '#f3f4f6',
                    color: estPublie(b) ? T.success : b.statut === 'en_attente' ? T.warning : b.statut === 'refuse' || b.statut === 'inactif' ? T.danger : T.textLight,
                    padding: '2px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                  }}>
                    {estPublie(b) ? '🌐 Publié' : b.statut === 'en_attente' ? '⏳ En attente d\'approbation' : b.statut === 'refuse' ? '❌ Refusé' : b.statut === 'inactif' ? '🔴 Désactivé' : '💾 Brouillon'}
                  </span>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: T.text, margin: 0 }}>{b.titre}</p>
                </div>
                <p style={{ fontSize: '12px', color: T.textLight, margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {b.contenu.replace(/<[^>]*>/g, '').slice(0, 120)}...
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' as const }}>
                  <span style={{ fontSize: '11px', color: T.textLight }}>📅 {new Date(b.date_creation).toLocaleDateString('fr-CA')}</span>
                  {b.date_publication && <span style={{ fontSize: '11px', color: T.success }}>🌐 {new Date(b.date_publication).toLocaleDateString('fr-CA')}</span>}
                  {b.vues > 0 && <span style={{ fontSize: '11px', color: T.textLight }}>👁 {b.vues} vue{b.vues > 1 ? 's' : ''}</span>}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
                    {b.tags.map(tag => <span key={tag} style={{ background: T.accentLight, color: T.accent, padding: '1px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: 600 }}>#{tag}</span>)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {/* Bouton toggle uniquement si pas en attente ou refusé */}
                {b.statut !== 'en_attente' && b.statut !== 'refuse' && b.statut !== 'inactif' && (
                  <button onClick={() => toggleStatut(b)}
                    style={{ background: estPublie(b) ? '#fef9c3' : '#dcfce7', color: estPublie(b) ? '#92400e' : T.success, border: 'none', borderRadius: '7px', padding: '7px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                    {estPublie(b) ? '⏸ Dépublier' : '🌐 Publier'}
                  </button>
                )}
                <button onClick={() => ouvrirEdition(b)}
                  style={{ background: T.accentLight, color: T.accent, border: 'none', borderRadius: '7px', padding: '7px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                  ✏️ Modifier
                </button>
                <button onClick={() => setConfirmerSuppr(b.id)}
                  style={{ background: '#fee2e2', color: T.danger, border: 'none', borderRadius: '7px', padding: '7px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}