// src/pages/admin/BlogPlateforme.tsx
// Gestion du blog de la plateforme e-Vend — Liste + éditeur popup

import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../../config/api';

// ─── TYPES ────────────────────────────────────────────────────────────────

interface Article {
  id: number;
  titre: string;
  slug: string;
  extrait: string | null;
  contenu: string | null;
  image_couverture: string | null;
  auteur: string;
  categorie_id: number | null;
  categorie_nom: string | null;
  tags: string[];
  statut: 'publie' | 'brouillon' | 'archive';
  visible: boolean;
  date_publication: string | null;
  seo_titre: string | null;
  seo_description: string | null;
  nb_vues: number;
  created_at: string;
  updated_at: string;
}

interface Categorie {
  id: number;
  nom: string;
  slug: string;
}

interface FormArticle {
  titre: string;
  contenu: string;
  extrait: string;
  image_couverture: string;
  auteur: string;
  categorie_id: string;
  tags: string;
  statut: string;
  visible: boolean;
  date_publication: string;
  seo_titre: string;
  seo_description: string;
}

const FORM_VIDE: FormArticle = {
  titre: '', contenu: '', extrait: '', image_couverture: '',
  auteur: 'Alex', categorie_id: '',
  tags: '', statut: 'brouillon', visible: false,
  date_publication: '', seo_titre: '', seo_description: '',
};

const THEME = {
  bg: '#f0f2f5', card: '#fff', border: '#e1e4e8',
  accent: '#2d6a9f', text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706',
};

const STATUT_COULEURS: Record<string, { bg: string; color: string; label: string }> = {
  publie:    { bg: '#f0fdf4', color: '#16a34a', label: '✅ Publié' },
  brouillon: { bg: '#fffbeb', color: '#d97706', label: '📝 Brouillon' },
  archive:   { bg: '#f3f4f6', color: '#6b7280', label: '📦 Archivé' },
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────

export default function BlogPlateforme({ naviguerVers }: { naviguerVers?: (p: string) => void }) {
  const [articles, setArticles]     = useState<Article[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [recherche, setRecherche]   = useState('');
  const [modalOuvert, setModalOuvert] = useState(false);
  const [articleEnEdition, setArticleEnEdition] = useState<Article | null>(null);
  const [form, setForm]             = useState<FormArticle>(FORM_VIDE);
  const [ongletEdit, setOngletEdit] = useState<'contenu' | 'seo' | 'options'>('contenu');
  const [sauvegarde, setSauvegarde] = useState(false);
  const [uploadImage, setUploadImage] = useState(false);
  const [uploadContenu, setUploadContenu] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const inputCouverture = useRef<HTMLInputElement>(null);
  const inputContenu    = useRef<HTMLInputElement>(null);
  const contenuRef      = useRef<HTMLTextAreaElement>(null);
  const token = localStorage.getItem('token');

  useEffect(() => { fetchArticles(); fetchCategories(); }, [filtreStatut, recherche, pagination.page]);

  async function fetchArticles() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '15',
        ...(filtreStatut !== 'tous' ? { statut: filtreStatut } : {}),
        ...(recherche ? { q: recherche } : {}),
      });
      // ✅ CORRIGÉ : enlever /blog
      const res = await fetch(`${API_BASE}/admin/articles?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setArticles(data.articles || []);
      if (data.pagination) setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      console.error('Erreur fetchArticles:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      // ✅ CORRIGÉ : enlever /blog
      const res = await fetch(`${API_BASE}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Erreur fetchCategories:', err);
    }
  }

  function ouvrirCreer() {
    setForm(FORM_VIDE);
    setArticleEnEdition(null);
    setOngletEdit('contenu');
    setModalOuvert(true);
  }

  async function ouvrirModifier(article: Article) {
    setOngletEdit('contenu');
    setModalOuvert(true);
    try {
      // ✅ CORRIGÉ : enlever /blog
      const res = await fetch(`${API_BASE}/admin/articles/${article.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const a = data.article;
      setArticleEnEdition(a);
      setForm({
        titre:            a.titre || '',
        contenu:          a.contenu || '',
        extrait:          a.extrait || '',
        image_couverture: a.image_couverture || '',
        auteur:           a.auteur || '',
        categorie_id:     a.categorie_id?.toString() || '',
        tags:             (a.tags || []).join(', '),
        statut:           a.statut || 'brouillon',
        visible:          a.visible || false,
        date_publication: a.date_publication ? a.date_publication.slice(0, 16) : '',
        seo_titre:        a.seo_titre || '',
        seo_description:  a.seo_description || '',
      });
    } catch (err) {
      console.error('Erreur ouvrirModifier:', err);
    }
  }

  async function sauvegarder() {
    if (!form.titre.trim()) return;
    setSauvegarde(true);
    try {
      const body = {
        ...form,
        contenu: texteVersHtml(form.contenu),
        categorie_id: form.categorie_id ? parseInt(form.categorie_id) : null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        date_publication: form.date_publication || null,
      };

      // ✅ CORRIGÉ : enlever /blog
      const url = articleEnEdition
        ? `${API_BASE}/admin/articles/${articleEnEdition.id}`
        : `${API_BASE}/admin/articles`;

      await fetch(url, {
        method: articleEnEdition ? 'PATCH' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setModalOuvert(false);
      await fetchArticles();
    } catch (err) {
      console.error('Erreur sauvegarder:', err);
    } finally {
      setSauvegarde(false);
    }
  }

  async function supprimerArticle(id: number, titre: string) {
    if (!window.confirm(`Supprimer "${titre}" ?`)) return;
    try {
      // ✅ CORRIGÉ : enlever /blog
      await fetch(`${API_BASE}/admin/articles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchArticles();
    } catch (err) {
      console.error('Erreur supprimerArticle:', err);
    }
  }

  async function toggleVisible(article: Article) {
    try {
      // ✅ CORRIGÉ : enlever /blog
      await fetch(`${API_BASE}/admin/articles/${article.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: !article.visible, statut: !article.visible ? 'publie' : 'brouillon' }),
      });
      await fetchArticles();
    } catch (err) {
      console.error('Erreur toggleVisible:', err);
    }
  }

  // Convertir texte brut en HTML propre
  function texteVersHtml(texte: string): string {
    if (!texte) return '';
    const trimmed = texte.trim();
    if (/^<[a-zA-Z]/.test(trimmed)) return trimmed;
    const lignes = texte.split('\n');
    let resultat = '';
    let dansListePuces = false;
    let dansListeNum = false;
    for (let i = 0; i < lignes.length; i++) {
      let ligne = lignes[i].trim();
      if (ligne === '') {
        if (dansListePuces) { resultat += '</ul>\n'; dansListePuces = false; }
        if (dansListeNum)   { resultat += '</ol>\n'; dansListeNum = false; }
        continue;
      }
      if (/^<[a-zA-Z!\/]/.test(ligne)) {
        if (dansListePuces) { resultat += '</ul>\n'; dansListePuces = false; }
        if (dansListeNum)   { resultat += '</ol>\n'; dansListeNum = false; }
        resultat += ligne + '\n';
        continue;
      }
      const estTitre = ligne.length < 60 && !ligne.match(/[.!?]$/) && (i === 0 || lignes[i-1].trim() === '');
      if (estTitre && !ligne.startsWith('-') && !ligne.match(/^\d+\./)) {
        if (dansListePuces) { resultat += '</ul>\n'; dansListePuces = false; }
        if (dansListeNum)   { resultat += '</ol>\n'; dansListeNum = false; }
        resultat += `<h2>${ligne}</h2>\n`;
        continue;
      }
      if (ligne.startsWith('- ') || ligne.startsWith('• ') || ligne.startsWith('* ')) {
        const item = ligne.replace(/^[-•*]\s+/, '');
        if (!dansListePuces && dansListeNum) { resultat += '</ol>\n'; dansListeNum = false; }
        if (!dansListePuces) { resultat += '<ul>\n'; dansListePuces = true; }
        resultat += `  <li>${item}</li>\n`;
        continue;
      }
      if (ligne.match(/^\d+\.\s/)) {
        const item = ligne.replace(/^\d+\.\s/, '');
        if (!dansListeNum && dansListePuces) { resultat += '</ul>\n'; dansListePuces = false; }
        if (!dansListeNum) { resultat += '<ol>\n'; dansListeNum = true; }
        resultat += `  <li>${item}</li>\n`;
        continue;
      }
      if (dansListePuces) { resultat += '</ul>\n'; dansListePuces = false; }
      if (dansListeNum)   { resultat += '</ol>\n'; dansListeNum = false; }
      resultat += `<p>${ligne}</p>\n`;
    }
    if (dansListePuces) resultat += '</ul>\n';
    if (dansListeNum)   resultat += '</ol>\n';
    return resultat;
  }

  // Upload image couverture
  async function uploadImageCouverture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadImage(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      // ✅ CORRIGÉ : enlever /blog
      const res = await fetch(`${API_BASE}/admin/upload-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.url) setForm(f => ({ ...f, image_couverture: data.url }));
    } catch (err) {
      console.error('Erreur uploadImageCouverture:', err);
    } finally {
      setUploadImage(false);
      if (inputCouverture.current) inputCouverture.current.value = '';
    }
  }

  // Upload image dans le contenu
  async function uploadImageContenu(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadContenu(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      // ✅ CORRIGÉ : enlever /blog
      const res = await fetch(`${API_BASE}/admin/upload-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.url && contenuRef.current) {
        const ta = contenuRef.current;
        const pos = ta.selectionStart;
        const imgTag = `\n<img src="${data.url}" alt="" style="max-width:100%;border-radius:8px;margin:12px 0;" />\n`;
        const nouveau = form.contenu.slice(0, pos) + imgTag + form.contenu.slice(pos);
        setForm(f => ({ ...f, contenu: nouveau }));
        setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + imgTag.length, pos + imgTag.length); }, 50);
      }
    } catch (err) {
      console.error('Erreur uploadImageContenu:', err);
    } finally {
      setUploadContenu(false);
      if (inputContenu.current) inputContenu.current.value = '';
    }
  }

  // Insérer balise HTML dans le contenu
  function insererBalise(avant: string, apres: string = '') {
    const ta = contenuRef.current;
    if (!ta) return;
    const debut = ta.selectionStart;
    const fin   = ta.selectionEnd;
    const selection = form.contenu.slice(debut, fin);
    const nouveau = form.contenu.slice(0, debut) + avant + selection + apres + form.contenu.slice(fin);
    setForm(f => ({ ...f, contenu: nouveau }));
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(debut + avant.length, debut + avant.length + selection.length);
    }, 10);
  }

  const stats = {
    total: pagination.total,
    publies: articles.filter(a => a.statut === 'publie').length,
    brouillons: articles.filter(a => a.statut === 'brouillon').length,
  };

  // ─── RENDU ──────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .art-row:hover { background: #f8fafc !important; }
        .btn-toolbar:hover { background: ${THEME.accent} !important; color: #fff !important; }
        .btn-action:hover { opacity: 0.8; }
        .tag-chip { background: #e8f2fb; color: ${THEME.accent}; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
      `}</style>

      {/* EN-TÊTE */}
      <div style={s.topBar}>
        <div>
          <h1 style={s.titre}>✏️ Blog plateforme</h1>
          <p style={s.sousTitre}>
            {stats.total} article{stats.total > 1 ? 's' : ''} ·
            {stats.publies} publié{stats.publies > 1 ? 's' : ''} ·
            {stats.brouillons} brouillon{stats.brouillons > 1 ? 's' : ''}
          </p>
        </div>
        <button style={s.btnCreer} onClick={ouvrirCreer}>
          + Ajouter un article de blog
        </button>
      </div>

      {/* FILTRES */}
      <div style={s.filtresBar}>
        <div style={s.onglets}>
          {[
            { id: 'tous', label: 'Tous' },
            { id: 'publie', label: '✅ Publiés' },
            { id: 'brouillon', label: '📝 Brouillons' },
            { id: 'archive', label: '📦 Archivés' },
          ].map(f => (
            <button
              key={f.id}
              style={{ ...s.ongletBtn, ...(filtreStatut === f.id ? s.ongletActif : {}) }}
              onClick={() => { setFiltreStatut(f.id); setPagination(p => ({ ...p, page: 1 })); }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          style={s.recherche}
          placeholder="🔍 Rechercher un article..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div style={s.card}>
        <div style={s.tableHeader}>
          <span style={{ flex: 3 }}>Titre</span>
          <span style={{ flex: 1 }}>Auteur</span>
          <span style={{ flex: 1 }}>Blog</span>
          <span style={{ flex: 1 }}>Mis à jour</span>
          <span style={{ flex: 1 }}>Publié</span>
          <span style={{ width: '120px', textAlign: 'right' }}>Actions</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div style={s.spinner} />
          </div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <p style={{ fontSize: '40px', marginBottom: '8px' }}>📝</p>
            <p style={{ color: THEME.textLight }}>Aucun article trouvé</p>
            <button style={{ ...s.btnCreer, marginTop: '12px' }} onClick={ouvrirCreer}>
              + Créer le premier article
            </button>
          </div>
        ) : (
          articles.map(article => {
            const sc = STATUT_COULEURS[article.statut] || STATUT_COULEURS.brouillon;
            const dateMAJ = new Date(article.updated_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            const datePubli = article.date_publication
              ? new Date(article.date_publication).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—';

            return (
              <div key={article.id} className="art-row" style={s.tableRow}>
                <div style={{ flex: 3, display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={s.miniImage}>
                    {article.image_couverture ? (
                      <img src={article.image_couverture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#f0f2f5', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📄</div>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: THEME.text, margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {article.titre}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ ...sc, fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>
                        {sc.label}
                      </span>
                      {!article.visible && (
                        <span style={{ fontSize: '11px', color: THEME.textLight, background: '#f3f4f6', padding: '2px 8px', borderRadius: '20px' }}>Masqué</span>
                      )}
                      {(article.tags || []).slice(0, 2).map(tag => (
                        <span key={tag} className="tag-chip">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <span style={{ flex: 1, fontSize: '13px', color: THEME.textLight }}>{article.auteur}</span>
                <span style={{ flex: 1, fontSize: '13px', color: THEME.textLight }}>{article.categorie_nom || '—'}</span>

                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0 }}>{dateMAJ}</p>
                  <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>👁 {article.nb_vues} vues</p>
                </div>

                <span style={{ flex: 1, fontSize: '13px', color: article.visible ? THEME.success : THEME.textLight }}>
                  {datePubli}
                </span>

                <div style={{ width: '120px', display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                  <button
                    className="btn-action"
                    style={{ ...s.btnAction, background: article.visible ? '#f0fdf4' : '#f3f4f6', color: article.visible ? THEME.success : THEME.textLight }}
                    onClick={() => toggleVisible(article)}
                    title={article.visible ? 'Masquer' : 'Publier'}
                  >
                    {article.visible ? '👁' : '🚫'}
                  </button>
                  <button
                    className="btn-action"
                    style={{ ...s.btnAction, background: '#e8f2fb', color: THEME.accent }}
                    onClick={() => ouvrirModifier(article)}
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-action"
                    style={{ ...s.btnAction, background: '#fef2f2', color: THEME.danger }}
                    onClick={() => supprimerArticle(article.id, article.titre)}
                    title="Supprimer"
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })
        )}

        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px' }}>
            <button style={s.btnPage} disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>← Précédent</button>
            <span style={{ fontSize: '13px', color: THEME.textLight, display: 'flex', alignItems: 'center' }}>
              Page {pagination.page} / {pagination.pages}
            </span>
            <button style={s.btnPage} disabled={pagination.page >= pagination.pages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Suivant →</button>
          </div>
        )}
      </div>

      {/* MODAL ÉDITEUR */}
      {modalOuvert && (
        <>
          <div style={s.overlay} onClick={() => setModalOuvert(false)} />
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div>
                <h2 style={s.modalTitre}>
                  {articleEnEdition ? '✏️ Modifier l\'article' : '➕ Ajouter un article de blog'}
                </h2>
                {articleEnEdition && (
                  <p style={{ fontSize: '12px', color: THEME.textLight, margin: '2px 0 0' }}>
                    Slug : /{articleEnEdition.slug}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: THEME.text }}>
                  <div
                    style={{
                      width: '40px', height: '22px', borderRadius: '11px',
                      background: form.visible ? THEME.accent : '#d1d5db',
                      position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                    }}
                    onClick={() => setForm(f => ({ ...f, visible: !f.visible, statut: !f.visible ? 'publie' : 'brouillon' }))}
                  >
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: '2px',
                      left: form.visible ? '20px' : '2px',
                      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                  {form.visible ? '✅ Visible' : '⏸ Brouillon'}
                </label>
                <button style={s.btnFermer} onClick={() => setModalOuvert(false)}>✕</button>
              </div>
            </div>

            <div style={s.editeurOnglets}>
              {[
                { id: 'contenu', label: '✏️ Contenu' },
                { id: 'options', label: '⚙️ Options' },
                { id: 'seo',     label: '🔍 SEO' },
              ].map(o => (
                <button
                  key={o.id}
                  style={{ ...s.editeurOngletBtn, ...(ongletEdit === o.id ? s.editeurOngletActif : {}) }}
                  onClick={() => setOngletEdit(o.id as any)}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <div style={s.modalBody}>
              {ongletEdit === 'contenu' && (
                <div style={s.editeurLayout}>
                  <div style={s.editeurColPrincipale}>
                    <div style={s.champWrap}>
                      <label style={s.label}>Titre *</label>
                      <input
                        style={{ ...s.input, fontSize: '18px', fontWeight: 600, padding: '12px 14px' }}
                        placeholder="Titre de l'article..."
                        value={form.titre}
                        onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                        autoFocus
                      />
                    </div>

                    <div style={s.champWrap}>
                      <label style={s.label}>Extrait (résumé)</label>
                      <textarea
                        style={{ ...s.input, height: '72px', resize: 'vertical' }}
                        placeholder="Résumé court affiché sur la page blog..."
                        value={form.extrait}
                        onChange={e => setForm(f => ({ ...f, extrait: e.target.value }))}
                      />
                    </div>

                    <div style={s.champWrap}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={s.label}>Contenu</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {[
                            { label: 'G', action: () => insererBalise('<strong>', '</strong>'), title: 'Gras' },
                            { label: 'I', action: () => insererBalise('<em>', '</em>'), title: 'Italique' },
                            { label: 'H2', action: () => insererBalise('<h2>', '</h2>'), title: 'Titre H2' },
                            { label: 'H3', action: () => insererBalise('<h3>', '</h3>'), title: 'Titre H3' },
                            { label: '🔗', action: () => insererBalise('<a href="">', '</a>'), title: 'Lien' },
                            { label: '📋', action: () => insererBalise('<ul>\n  <li>', '</li>\n</ul>'), title: 'Liste' },
                            { label: '💬', action: () => insererBalise('<blockquote>', '</blockquote>'), title: 'Citation' },
                            { label: '—', action: () => insererBalise('\n<hr />\n'), title: 'Séparateur' },
                          ].map(btn => (
                            <button
                              key={btn.label}
                              className="btn-toolbar"
                              style={s.btnToolbar}
                              onClick={btn.action}
                              title={btn.title}
                            >
                              {btn.label}
                            </button>
                          ))}
                          <input ref={inputContenu} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadImageContenu} />
                          <button
                            className="btn-toolbar"
                            style={{ ...s.btnToolbar, background: uploadContenu ? '#e8f2fb' : undefined }}
                            onClick={() => inputContenu.current?.click()}
                            title="Insérer une image"
                            disabled={uploadContenu}
                          >
                            {uploadContenu ? '⏳' : '🖼'}
                          </button>
                        </div>
                      </div>
                      <textarea
                        ref={contenuRef}
                        style={{ ...s.input, height: '320px', resize: 'vertical', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6' }}
                        placeholder="Écrivez votre article en HTML ou texte brut..."
                        value={form.contenu}
                        onChange={e => setForm(f => ({ ...f, contenu: e.target.value }))}
                      />
                      <p style={{ fontSize: '11px', color: THEME.textLight, margin: '4px 0 0' }}>
                        HTML supporté · {form.contenu.length} caractères
                      </p>
                    </div>

                    {form.contenu && (
                      <div style={s.champWrap}>
                        <label style={s.label}>Aperçu du contenu</label>
                        <div
                          style={{ ...s.apercuContenu }}
                          dangerouslySetInnerHTML={{ __html: form.contenu }}
                        />
                      </div>
                    )}
                  </div>

                  <div style={s.editeurColDroite}>
                    <div style={s.carteOption}>
                      <p style={s.carteOptionTitre}>🖼 Image de couverture</p>
                      <input ref={inputCouverture} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadImageCouverture} />
                      {form.image_couverture ? (
                        <div style={{ position: 'relative' }}>
                          <img
                            src={form.image_couverture}
                            alt="Couverture"
                            style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '8px', border: `1px solid ${THEME.border}` }}
                          />
                          <button
                            style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                            onClick={() => setForm(f => ({ ...f, image_couverture: '' }))}
                          >
                            ✕ Retirer
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{ width: '100%', aspectRatio: '16/9', background: '#f0f2f5', border: `2px dashed ${THEME.border}`, borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '8px' }}
                          onClick={() => inputCouverture.current?.click()}
                        >
                          {uploadImage ? (
                            <div style={s.spinner} />
                          ) : (
                            <>
                              <span style={{ fontSize: '32px' }}>🖼</span>
                              <span style={{ fontSize: '13px', color: THEME.textLight }}>Cliquer pour ajouter une image</span>
                              <span style={{ fontSize: '11px', color: '#aaa' }}>JPG, PNG, WebP · max 10MB</span>
                            </>
                          )}
                        </div>
                      )}
                      <input
                        style={{ ...s.input, marginTop: '8px', fontSize: '12px' }}
                        placeholder="Ou coller une URL d'image..."
                        value={form.image_couverture}
                        onChange={e => setForm(f => ({ ...f, image_couverture: e.target.value }))}
                      />
                    </div>

                    <div style={s.carteOption}>
                      <p style={s.carteOptionTitre}>👤 Organisation</p>
                      <div style={s.champWrap}>
                        <label style={s.label}>Auteur</label>
                        <input
                          style={s.input}
                          value={form.auteur}
                          onChange={e => setForm(f => ({ ...f, auteur: e.target.value }))}
                        />
                      </div>
                      <div style={s.champWrap}>
                        <label style={s.label}>Blog / Catégorie</label>
                        <select style={s.input} value={form.categorie_id} onChange={e => setForm(f => ({ ...f, categorie_id: e.target.value }))}>
                          <option value="">— Sélectionner —</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                        </select>
                      </div>
                      <div style={s.champWrap}>
                        <label style={s.label}>Balises (tags)</label>
                        <input
                          style={s.input}
                          placeholder="conseil, vendeur, astuce"
                          value={form.tags}
                          onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                        />
                        <p style={{ fontSize: '11px', color: THEME.textLight, margin: '4px 0 0' }}>Séparer par des virgules</p>
                      </div>
                    </div>

                    <div style={s.carteOption}>
                      <p style={s.carteOptionTitre}>📢 Visibilité</p>
                      <div style={s.champWrap}>
                        <label style={s.label}>Statut</label>
                        <select style={s.input} value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
                          <option value="brouillon">📝 Brouillon</option>
                          <option value="publie">✅ Publié</option>
                          <option value="archive">📦 Archivé</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {ongletEdit === 'options' && (
                <div style={{ maxWidth: '600px' }}>
                  <div style={s.champWrap}>
                    <label style={s.label}>Date de publication</label>
                    <input
                      type="datetime-local"
                      style={s.input}
                      value={form.date_publication}
                      onChange={e => setForm(f => ({ ...f, date_publication: e.target.value }))}
                    />
                    <p style={{ fontSize: '11px', color: THEME.textLight, margin: '4px 0 0' }}>Laisser vide pour publier immédiatement</p>
                  </div>
                  <div style={s.champWrap}>
                    <label style={s.label}>Statut</label>
                    <select style={s.input} value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
                      <option value="brouillon">📝 Brouillon — non visible</option>
                      <option value="publie">✅ Publié — visible sur le site</option>
                      <option value="archive">📦 Archivé — retiré du site</option>
                    </select>
                  </div>
                  <div style={{ ...s.champWrap, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{ width: '44px', height: '24px', borderRadius: '12px', background: form.visible ? THEME.accent : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
                      onClick={() => setForm(f => ({ ...f, visible: !f.visible }))}
                    >
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: form.visible ? '22px' : '2px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Visible sur le site</p>
                      <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0 }}>
                        {form.visible ? 'L\'article est visible pour tous' : 'L\'article est masqué du site public'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {ongletEdit === 'seo' && (
                <div style={{ maxWidth: '680px' }}>
                  <div style={s.apercuGoogle}>
                    <p style={s.apercuGoogleTitre}>Aperçu sur les moteurs de recherche</p>
                    <div style={s.apercuGoogleCard}>
                      <p style={s.apercuGoogleUrl}>evend-studio.com › blog › {form.titre.slice(0, 30).toLowerCase().replace(/\s+/g, '-') || 'votre-article'}</p>
                      <p style={s.apercuGoogleH1}>{form.seo_titre || form.titre || 'Titre SEO de l\'article'}</p>
                      <p style={s.apercuGoogleDesc}>{form.seo_description || form.extrait || 'Description SEO de l\'article...'}</p>
                    </div>
                  </div>
                  <div style={s.champWrap}>
                    <label style={s.label}>Titre SEO</label>
                    <input
                      style={s.input}
                      placeholder={form.titre || 'Titre pour les moteurs de recherche'}
                      value={form.seo_titre}
                      onChange={e => setForm(f => ({ ...f, seo_titre: e.target.value }))}
                    />
                    <p style={{ fontSize: '11px', color: form.seo_titre.length > 60 ? THEME.danger : THEME.textLight, margin: '4px 0 0' }}>
                      {form.seo_titre.length}/60 caractères recommandés
                    </p>
                  </div>
                  <div style={s.champWrap}>
                    <label style={s.label}>Description SEO</label>
                    <textarea
                      style={{ ...s.input, height: '80px', resize: 'vertical' }}
                      placeholder="Description pour Google (150-160 caractères)"
                      value={form.seo_description}
                      onChange={e => setForm(f => ({ ...f, seo_description: e.target.value }))}
                    />
                    <p style={{ fontSize: '11px', color: form.seo_description.length > 160 ? THEME.danger : THEME.textLight, margin: '4px 0 0' }}>
                      {form.seo_description.length}/160 caractères recommandés
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div style={s.modalFooter}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: THEME.textLight }}>
                  {form.statut === 'publie' && form.visible ? '✅ Sera publié et visible' : '📝 Sera sauvegardé comme brouillon'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={s.btnAnnuler} onClick={() => setModalOuvert(false)}>Annuler</button>
                <button
                  style={{ ...s.btnSauvegarder, opacity: sauvegarde || !form.titre.trim() ? 0.6 : 1 }}
                  onClick={sauvegarder}
                  disabled={sauvegarde || !form.titre.trim()}
                >
                  {sauvegarde ? '⏳ Sauvegarde...' : articleEnEdition ? '💾 Enregistrer les modifications' : '✅ Créer l\'article'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: { padding: '24px', background: THEME.bg, minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  titre: { fontSize: '22px', fontWeight: 800, color: THEME.text, margin: '0 0 4px' },
  sousTitre: { fontSize: '14px', color: THEME.textLight, margin: 0 },
  btnCreer: { padding: '10px 20px', background: THEME.accent, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' },
  filtresBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' },
  onglets: { display: 'flex', gap: '4px', background: '#fff', padding: '4px', borderRadius: '10px', border: `1px solid ${THEME.border}` },
  ongletBtn: { padding: '6px 14px', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'transparent', color: THEME.textLight, transition: 'all 0.15s' },
  ongletActif: { background: THEME.accent, color: '#fff', fontWeight: 700 },
  recherche: { padding: '8px 14px', border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none', width: '240px' },
  card: { background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  tableHeader: { display: 'flex', alignItems: 'center', padding: '12px 20px', background: '#f8fafc', borderBottom: `1px solid ${THEME.border}`, fontSize: '12px', fontWeight: 700, color: THEME.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', gap: '16px' },
  tableRow: { display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${THEME.border}`, gap: '16px', transition: 'background 0.15s', cursor: 'pointer' },
  miniImage: { width: '52px', height: '36px', flexShrink: 0 },
  btnAction: { width: '32px', height: '32px', border: 'none', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', transition: 'opacity 0.15s', flexShrink: 0 },
  btnPage: { padding: '6px 16px', border: `1px solid ${THEME.border}`, borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '13px', color: THEME.text },
  spinner: { width: '28px', height: '28px', border: `3px solid ${THEME.border}`, borderTop: `3px solid ${THEME.accent}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000 },
  modal: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, background: '#fff', borderRadius: '18px', width: '95%', maxWidth: '1100px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: `1px solid ${THEME.border}`, flexShrink: 0 },
  modalTitre: { fontSize: '18px', fontWeight: 800, color: THEME.text, margin: 0 },
  btnFermer: { width: '30px', height: '30px', border: 'none', borderRadius: '7px', background: '#f0f2f5', cursor: 'pointer', fontSize: '14px' },
  editeurOnglets: { display: 'flex', gap: '0', borderBottom: `1px solid ${THEME.border}`, flexShrink: 0 },
  editeurOngletBtn: { padding: '12px 20px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: THEME.textLight, borderBottom: '2px solid transparent', transition: 'all 0.15s' },
  editeurOngletActif: { color: THEME.accent, borderBottomColor: THEME.accent, fontWeight: 700 },
  modalBody: { overflowY: 'auto', flex: 1, padding: '20px 24px' },
  modalFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, flexShrink: 0 },
  editeurLayout: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' },
  editeurColPrincipale: {},
  editeurColDroite: { display: 'flex', flexDirection: 'column', gap: '14px' },
  carteOption: { background: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '12px', padding: '16px' },
  carteOptionTitre: { fontSize: '13px', fontWeight: 700, color: THEME.text, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  btnToolbar: { padding: '4px 8px', border: `1px solid ${THEME.border}`, borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: THEME.text, transition: 'all 0.15s' },
  apercuContenu: { padding: '20px', border: `1px solid ${THEME.border}`, borderRadius: '10px', background: '#fff', maxHeight: '300px', overflowY: 'auto', fontSize: '15px', lineHeight: '1.7', color: THEME.text },
  apercuGoogle: { marginBottom: '20px' },
  apercuGoogleTitre: { fontSize: '12px', fontWeight: 600, color: THEME.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' },
  apercuGoogleCard: { padding: '16px', border: `1px solid ${THEME.border}`, borderRadius: '10px', background: '#fff' },
  apercuGoogleUrl: { fontSize: '12px', color: '#006621', margin: '0 0 4px' },
  apercuGoogleH1: { fontSize: '18px', color: '#1a0dab', margin: '0 0 4px', textDecoration: 'underline' },
  apercuGoogleDesc: { fontSize: '13px', color: '#545454', margin: 0, lineHeight: 1.5 },
  champWrap: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '11px', fontWeight: 700, color: THEME.text, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '9px 12px', border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', color: THEME.text, background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' } as React.CSSProperties,
  btnAnnuler: { padding: '9px 18px', background: '#f0f2f5', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: THEME.textLight },
  btnSauvegarder: { padding: '10px 22px', background: THEME.accent, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: '#fff', transition: 'opacity 0.15s' },
};
