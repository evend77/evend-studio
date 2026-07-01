import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Page } from '@shopify/polaris';


// ✅ Helper token — niveau module
const getToken = () => localStorage.getItem('token');

const T = {
  accent: '#537373', accentLight: '#eef3f3',
  bg: '#f4f6f8', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  success: '#008060', warning: '#d97706', danger: '#dc2626',
};

const API = 'https://evend-multivendeur-api.onrender.com/api';

interface Blog {
  id: number;
  titre: string;
  contenu: string;
  statut: 'publie' | 'brouillon';
  date_creation: string;
  date_publication?: string;
  vues: number;
  tags: string[];
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'danger' }) {
  return (
    <div style={{ position: 'fixed', top: '80px', right: '24px', backgroundColor: type === 'success' ? T.success : T.danger, color: 'white', padding: '12px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
      {msg}
    </div>
  );
}

// ── Éditeur de texte enrichi avec support d'images ──────────────────────────
function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorRef.current && !initialized) {
      editorRef.current.innerHTML = value || '';
      setInitialized(true);
    }
  }, [initialized]);

  useEffect(() => {
    if (editorRef.current && initialized) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, initialized]);

  const exec = (cmd: string, val = '') => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const insertImage = async (file: File) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${API}/upload/blog-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const url = data.url || data.path;
        exec('insertImage', url);
      } else {
        // Fallback: base64
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) exec('insertImage', e.target.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch {
      // Fallback base64
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) exec('insertImage', e.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImagePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) insertImage(file);
      }
    }
  };

  const btnStyle = (active = false) => ({
    padding: '5px 9px', background: active ? T.accentLight : '#fff',
    border: `1px solid ${T.border}`, borderRadius: '5px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '700' as const, color: active ? T.accent : T.text,
    minWidth: '32px',
  });

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: '8px', overflow: 'hidden' }}>
      {/* Styles pour les images dans l'éditeur */}
      <style>{`
        .rich-editor-content img {
          max-width: 100% !important;
          height: auto !important;
          max-height: 300px !important;
          object-fit: contain !important;
          border-radius: 8px !important;
          margin: 10px 0 !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        }
      `}</style>

      {/* Toolbar */}
      <div style={{ background: '#f8f9fa', borderBottom: `1px solid ${T.border}`, padding: '8px 10px', display: 'flex', gap: '4px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
        <button type="button" style={btnStyle()} onMouseDown={e => { e.preventDefault(); exec('bold'); }}><strong>G</strong></button>
        <button type="button" style={btnStyle()} onMouseDown={e => { e.preventDefault(); exec('italic'); }}><em>I</em></button>
        <button type="button" style={btnStyle()} onMouseDown={e => { e.preventDefault(); exec('underline'); }}><u>S</u></button>
        <div style={{ width: 1, height: 24, background: T.border, margin: '0 4px' }} />
        <button type="button" style={btnStyle()} onMouseDown={e => { e.preventDefault(); exec('justifyLeft'); }}>⬅</button>
        <button type="button" style={btnStyle()} onMouseDown={e => { e.preventDefault(); exec('justifyCenter'); }}>≡</button>
        <button type="button" style={btnStyle()} onMouseDown={e => { e.preventDefault(); exec('justifyRight'); }}>⮕</button>
        <div style={{ width: 1, height: 24, background: T.border, margin: '0 4px' }} />
        <button type="button" style={btnStyle()} onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }}>• Liste</button>
        <button type="button" style={btnStyle()} onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }}>1. Liste</button>
        <div style={{ width: 1, height: 24, background: T.border, margin: '0 4px' }} />
        <button type="button"
          style={{ ...btnStyle(), background: '#eef3f3', color: T.accent, display: 'flex', alignItems: 'center', gap: '4px' }}
          onMouseDown={e => { e.preventDefault(); fileInputRef.current?.click(); }}
          title="Insérer une image dans le texte"
        >
          🖼 Image
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) insertImage(f); e.target.value = ''; }}
        />
        <div style={{ width: 1, height: 24, background: T.border, margin: '0 4px' }} />
        <select style={{ fontSize: '12px', border: `1px solid ${T.border}`, borderRadius: '5px', padding: '4px 6px', background: '#fff' }}
          onChange={e => { exec('fontSize', e.target.value); }}
          defaultValue="3"
        >
          {[['1','8pt'],['2','10pt'],['3','12pt'],['4','14pt'],['5','18pt'],['6','24pt'],['7','36pt']].map(([v,l]) =>
            <option key={v} value={v}>{l}</option>
          )}
        </select>
      </div>

      {/* Zone d'édition */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }}
        onPaste={handleImagePaste}
        className="rich-editor-content"
        style={{
          minHeight: '280px', padding: '16px', outline: 'none',
          fontSize: '14px', lineHeight: '1.7', color: T.text,
          overflowY: 'auto' as const,
        }}
      />
      <div style={{ padding: '6px 12px', background: '#f8f9fa', borderTop: `1px solid ${T.border}`, fontSize: '11px', color: T.textLight }}>
        💡 Vous pouvez coller des images directement ou cliquer sur "🖼 Image" pour insérer une photo dans le texte
      </div>
    </div>
  );
}

type Vue = 'liste' | 'editeur';

export default function MesBlogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vue, setVue] = useState<Vue>('liste');
  const [blogEdite, setBlogEdite] = useState<Blog | null>(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'publie' | 'brouillon'>('tous');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'danger' } | null>(null);
  const [confirmerSuppr, setConfirmerSuppr] = useState<number | null>(null);

  const [titreDraft, setTitreDraft] = useState('');
  const [contenuDraft, setContenuDraft] = useState('');
  const [tagsDraft, setTagsDraft] = useState('');
  const [statutDraft, setStatutDraft] = useState<'publie' | 'brouillon'>('brouillon');

  const showToast = (msg: string, type: 'success' | 'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const token = () => localStorage.getItem('token') || '';
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

  // ── Charger les blogs ───────────────────────────────────────────────────
  const chargerBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/blogs/mes-blogs`, { headers: headers() });
      const data = await res.json();
      if (Array.isArray(data)) {
        setBlogs(data.map((b: any) => ({
          ...b,
          tags: Array.isArray(b.tags) ? b.tags
            : typeof b.tags === 'string' ? (b.tags ? b.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [])
            : [],
        })));
      }
    } catch (e) {
      showToast('❌ Erreur de chargement', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { chargerBlogs(); }, [chargerBlogs]);

  // ── Ouvrir éditeur ──────────────────────────────────────────────────────
  const ouvrirNouveauBlog = () => {
    setBlogEdite(null);
    setTitreDraft(''); setContenuDraft(''); setTagsDraft(''); setStatutDraft('brouillon');
    setVue('editeur');
  };

  const ouvrirEdition = (b: Blog) => {
    setBlogEdite(b);
    setTitreDraft(b.titre);
    setContenuDraft(b.contenu);
    setTagsDraft(b.tags.join(', '));
    setStatutDraft(b.statut);
    setVue('editeur');
  };

  // ── Sauvegarder (créer ou modifier) ────────────────────────────────────
  const sauvegarder = async () => {
    if (!titreDraft.trim() || !contenuDraft.trim()) {
      showToast('⚠️ Le titre et le contenu sont obligatoires.', 'danger');
      return;
    }
    setSaving(true);
    const tags = tagsDraft.split(',').map(t => t.trim()).filter(Boolean);
    const body = { titre: titreDraft, contenu: contenuDraft, tags, statut: statutDraft };

    try {
      let res;
      if (blogEdite) {
        res = await fetch(`${API}/blogs/${blogEdite.id}`, {
          method: 'PUT', headers: headers(), body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API}/blogs`, {
          method: 'POST', headers: headers(), body: JSON.stringify(body),
        });
      }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur serveur');
      }
      showToast(blogEdite ? '✅ Article mis à jour !' : statutDraft === 'publie' ? '🌐 Article publié !' : '💾 Brouillon sauvegardé.', 'success');
      await chargerBlogs();
      setVue('liste');
    } catch (e: any) {
      showToast('❌ ' + e.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  // ── Supprimer ───────────────────────────────────────────────────────────
  const supprimer = async (id: number) => {
    try {
      await fetch(`${API}/blogs/${id}`, { method: 'DELETE', headers: headers() });
      setConfirmerSuppr(null);
      showToast('🗑️ Article supprimé.', 'danger');
      await chargerBlogs();
    } catch {
      showToast('❌ Erreur lors de la suppression', 'danger');
    }
  };

  // ── Changer statut ──────────────────────────────────────────────────────
  const toggleStatut = async (b: Blog) => {
    const nouveauStatut = b.statut === 'publie' ? 'brouillon' : 'publie';
    try {
      await fetch(`${API}/blogs/${b.id}`, {
        method: 'PUT', headers: headers(),
        body: JSON.stringify({ statut: nouveauStatut }),
      });
      showToast('✅ Statut mis à jour.', 'success');
      await chargerBlogs();
    } catch {
      showToast('❌ Erreur', 'danger');
    }
  };

  const blogsFiltres = blogs.filter(b => {
    const s = recherche.toLowerCase();
    const inSearch = !s || b.titre.toLowerCase().includes(s) || b.tags.some(t => t.toLowerCase().includes(s));
    const inStatut = filtreStatut === 'tous' || b.statut === filtreStatut;
    return inSearch && inStatut;
  });

  // ── ÉDITEUR ─────────────────────────────────────────────────────────────
  if (vue === 'editeur') {
    return (
      <Page
        title={blogEdite ? "Modifier l'article" : 'Nouvel article de blog'}
        backAction={{ content: 'Retour', onAction: () => setVue('liste') }}
      >
        {toast && <Toast msg={toast.msg} type={toast.type} />}
        <div style={{ maxWidth: '820px', paddingBottom: '60px' }}>

          {/* Titre */}
          <div style={{ backgroundColor: T.card, borderRadius: '14px', border: `1px solid ${T.border}`, padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>Titre de l'article *</label>
            <input
              value={titreDraft} onChange={e => setTitreDraft(e.target.value)}
              placeholder="Ex: Nouveaux produits disponibles ce printemps..."
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '12px 14px', fontSize: '15px', fontWeight: '600', outline: 'none', boxSizing: 'border-box' as const, color: T.text }}
            />
          </div>

          {/* Contenu avec éditeur riche + images */}
          <div style={{ backgroundColor: T.card, borderRadius: '14px', border: `1px solid ${T.border}`, padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>Contenu de l'article *</label>
            <RichEditor value={contenuDraft} onChange={setContenuDraft} />
          </div>

          {/* Tags + statut */}
          <div style={{ backgroundColor: T.card, borderRadius: '14px', border: `1px solid ${T.border}`, padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>Tags (séparés par des virgules)</label>
              <input
                value={tagsDraft} onChange={e => setTagsDraft(e.target.value)}
                placeholder="ex: conseil, nouveauté, promo"
                style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>Statut de publication</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {(['brouillon', 'publie'] as const).map(s => (
                  <button key={s} type="button" onClick={() => setStatutDraft(s)}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${statutDraft === s ? T.accent : T.border}`, backgroundColor: statutDraft === s ? T.accentLight : 'white', color: statutDraft === s ? T.accent : T.textLight, fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                    {s === 'brouillon' ? '💾 Brouillon' : '🌐 Publier'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setVue('liste')}
              style={{ padding: '11px 22px', border: `1px solid ${T.border}`, borderRadius: '9px', backgroundColor: 'white', color: T.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              Annuler
            </button>
            <button type="button" onClick={sauvegarder} disabled={saving || !titreDraft.trim() || !contenuDraft.trim()}
              style={{ padding: '11px 24px', border: 'none', borderRadius: '9px', backgroundColor: !saving && titreDraft.trim() && contenuDraft.trim() ? (statutDraft === 'publie' ? T.success : T.accent) : '#aaa', color: 'white', fontSize: '13px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', minWidth: '160px' }}>
              {saving ? '⏳ Sauvegarde...' : statutDraft === 'publie' ? '🌐 Publier l\'article' : '💾 Sauvegarder le brouillon'}
            </button>
          </div>
        </div>
      </Page>
    );
  }

  // ── LISTE ────────────────────────────────────────────────────────────────
  return (
    <Page title="Mes blogs" primaryAction={{ content: '+ Nouvel article', onAction: ouvrirNouveauBlog }}>
      {/* Styles pour les images dans la liste (aperçu) */}
      <style>{`
        .blog-preview-content img {
          max-width: 100px !important;
          max-height: 60px !important;
          object-fit: cover !important;
          border-radius: 4px !important;
          margin-right: 8px !important;
          vertical-align: middle !important;
        }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Modal suppression */}
      {confirmerSuppr !== null && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', maxWidth: '380px', width: '100%', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '16px 20px', backgroundColor: '#fff5f5', borderBottom: `2px solid ${T.danger}` }}>
              <p style={{ fontSize: '14px', fontWeight: '800', color: T.danger, margin: 0 }}>🗑️ Supprimer cet article ?</p>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: T.text, margin: '0 0 20px 0' }}>Cette action est irréversible. L'article sera définitivement supprimé.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setConfirmerSuppr(null)} style={{ flex: 1, padding: '10px', border: `1px solid ${T.border}`, borderRadius: '8px', backgroundColor: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Annuler</button>
                <button onClick={() => supprimer(confirmerSuppr!)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: T.danger, color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ paddingBottom: '60px' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Articles publiés', val: String(blogs.filter(b => b.statut === 'publie').length), icon: '🌐', color: T.success },
            { label: 'Brouillons', val: String(blogs.filter(b => b.statut === 'brouillon').length), icon: '💾', color: T.accent },
            { label: 'Vues totales', val: String(blogs.reduce((s, b) => s + (b.vues || 0), 0)), icon: '👁', color: T.warning },
          ].map((k, i) => (
            <div key={i} style={{ backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '20px' }}>{k.icon}</span>
                <p style={{ fontSize: '22px', fontWeight: '900', color: k.color, margin: 0 }}>{k.val}</p>
              </div>
              <p style={{ fontSize: '11px', color: T.textLight, margin: 0, fontWeight: '600' }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' as const }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
            <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher par titre ou tag..."
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '8px 10px 8px 28px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' as const }} />
          </div>
          {(['tous', 'publie', 'brouillon'] as const).map(f => (
            <button key={f} onClick={() => setFiltreStatut(f)}
              style={{ padding: '7px 14px', borderRadius: '7px', border: `1px solid ${filtreStatut === f ? T.accent : T.border}`, backgroundColor: filtreStatut === f ? T.accentLight : 'white', color: filtreStatut === f ? T.accent : T.textLight, fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
              {f === 'tous' ? 'Tous' : f === 'publie' ? '🌐 Publiés' : '💾 Brouillons'}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: T.textLight }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
            <p style={{ fontSize: '14px' }}>Chargement des articles...</p>
          </div>
        ) : blogsFiltres.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', backgroundColor: T.card, borderRadius: '14px', border: `1px solid ${T.border}`, color: T.textLight }}>
            <div style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.3 }}>📝</div>
            <p style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>Aucun article trouvé</p>
            <p style={{ fontSize: '12px', margin: '0 0 16px 0' }}>Créez votre premier article de blog !</p>
            <button onClick={ouvrirNouveauBlog} style={{ backgroundColor: T.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>+ Créer un article</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {blogsFiltres.map(b => (
              <div key={b.id} style={{ backgroundColor: T.card, borderRadius: '14px', border: `1px solid ${T.border}`, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' as const }}>
                    <span style={{ backgroundColor: b.statut === 'publie' ? '#dcfce7' : '#f3f4f6', color: b.statut === 'publie' ? T.success : T.textLight, padding: '2px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>
                      {b.statut === 'publie' ? '🌐 Publié' : '💾 Brouillon'}
                    </span>
                    <p style={{ fontSize: '15px', fontWeight: '800', color: T.text, margin: 0 }}>{b.titre}</p>
                  </div>
                  <p style={{ fontSize: '12px', color: T.textLight, margin: '0 0 8px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    <span className="blog-preview-content" dangerouslySetInnerHTML={{ __html: b.contenu.replace(/<[^>]*>/g, '').slice(0, 120) + '...' }} />
                  </p>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' as const }}>
                    <span style={{ fontSize: '11px', color: T.textLight }}>📅 Créé le {new Date(b.date_creation).toLocaleDateString('fr-CA')}</span>
                    {b.date_publication && <span style={{ fontSize: '11px', color: T.success }}>🌐 Publié le {new Date(b.date_publication).toLocaleDateString('fr-CA')}</span>}
                    {b.vues > 0 && <span style={{ fontSize: '11px', color: T.textLight }}>👁 {b.vues} vue{b.vues > 1 ? 's' : ''}</span>}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
                      {b.tags.map(tag => (
                        <span key={tag} style={{ backgroundColor: T.accentLight, color: T.accent, padding: '1px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '600' }}>#{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => toggleStatut(b)}
                    style={{ backgroundColor: b.statut === 'publie' ? '#fef9c3' : '#dcfce7', color: b.statut === 'publie' ? '#92400e' : T.success, border: 'none', borderRadius: '7px', padding: '7px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                    {b.statut === 'publie' ? '⏸ Dépublier' : '🌐 Publier'}
                  </button>
                  <button onClick={() => ouvrirEdition(b)}
                    style={{ backgroundColor: T.accentLight, color: T.accent, border: 'none', borderRadius: '7px', padding: '7px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                    ✏️ Modifier
                  </button>
                  <button onClick={() => setConfirmerSuppr(b.id)}
                    style={{ backgroundColor: '#fee2e2', color: T.danger, border: 'none', borderRadius: '7px', padding: '7px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
