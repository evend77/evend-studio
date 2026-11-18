// CHEMIN : src/pages/gestionnaire/BoutiqueBlog.tsx
// e-Vend Studio — « Mes blogs » (templates boutique solo) : le gestionnaire écrit les articles du blog de son site.
// Inspiré de BlogPlateforme.tsx (blog d'e-Vend) : liste filtrable + éditeur dans une fenêtre. Adapté : un seul blog par boutique, pas de catégories ni de SEO,
// aucun popup du navigateur (BoutiqueModale), images envoyées par /api/boutique/gestionnaire/upload (comme les photos de produits).
// Un article n'est visible sur le site que s'il est « Publié » et que sa date de publication est arrivée (date future = publication programmée).
// API : /api/boutique/gestionnaire/blog/(mes | :id) — voir routes/boutique_blog_gestionnaire.js

import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { bq, messageErreur, BQ } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

interface Art {
  id: number; titre: string; slug: string; extrait: string | null; image_couverture: string | null; auteur: string | null; tags: string[];
  statut: 'brouillon' | 'publie' | 'archive'; date_publication: string | null; vues: number; created_at: string; updated_at: string; contenu?: string;
}
interface Reponse {
  total: number; page: number; pages: number;
  stats: { total: number; publies: number; programmes: number; brouillons: number; archives: number }; articles: Art[];
}
interface Form { titre: string; extrait: string; contenu: string; image_couverture: string; auteur: string; tags: string; statut: string; date_publication: string }
interface Props { gestionnaireId: number; accent?: string; isMobile?: boolean }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', green: '#10b981', red: '#ef4444', orange: '#d97706' };
const FORM_VIDE: Form = { titre: '', extrait: '', contenu: '', image_couverture: '', auteur: '', tags: '', statut: 'brouillon', date_publication: '' };

const dateCourte = (d: string | null) => { if (!d) return '—'; try { return new Date(d).toLocaleString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return '—'; } };
const versChampDate = (d: string | null) => {
  if (!d) return '';
  const x = new Date(d); if (isNaN(x.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
};
const estProgramme = (a: Art) => a.statut === 'publie' && !!a.date_publication && new Date(a.date_publication).getTime() > Date.now();

// Aperçu : on retire tout ce qui pourrait s'exécuter (le serveur nettoie aussi, à l'enregistrement)
function apercuSur(html: string): string {
  try {
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
    doc.querySelectorAll('script,style,iframe,object,embed,form,link,meta').forEach(n => n.remove());
    doc.querySelectorAll('*').forEach(n => {
      Array.from(n.attributes).forEach(at => {
        const nom = at.name.toLowerCase();
        if (nom.startsWith('on') || ((nom === 'href' || nom === 'src') && /^\s*(javascript|data):/i.test(at.value))) n.removeAttribute(at.name);
      });
    });
    return doc.body.innerHTML;
  } catch (e) { return ''; }
}

export default function BoutiqueBlog({ accent, isMobile: mobileProp }: Props) {
  const couleur = accent || '#4f46e5';
  const isMobile = !!mobileProp;
  const [data, setData] = useState<Reponse | null>(null);
  const [statut, setStatut] = useState('');
  const [recherche, setRecherche] = useState('');
  const [terme, setTerme] = useState('');
  const [page, setPage] = useState(1);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [editeur, setEditeur] = useState<{ id: number | null } | null>(null);
  const [form, setForm] = useState<Form>(FORM_VIDE);
  const [ongletEdit, setOngletEdit] = useState<'contenu' | 'options'>('contenu');
  const [envoi, setEnvoi] = useState(false);
  const [erreurEdit, setErreurEdit] = useState('');
  const [aSupprimer, setASupprimer] = useState<Art | null>(null);
  const [erreurModale, setErreurModale] = useState('');
  const texteRef = useRef<HTMLTextAreaElement>(null);
  const fichierCouv = useRef<HTMLInputElement>(null);
  const fichierTexte = useRef<HTMLInputElement>(null);

  const charger = useCallback(async () => {
    const r = await bq(`/blog/mes?page=${page}${statut ? `&statut=${statut}` : ''}${terme ? `&q=${encodeURIComponent(terme)}` : ''}`);
    if (r.ok) { setData(r.data); setErreur(''); } else setErreur(messageErreur(r));
    setChargement(false);
  }, [page, statut, terme]);
  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { if (!message) return; const t = setTimeout(() => setMessage(''), 4000); return () => clearTimeout(t); }, [message]);
  useEffect(() => { const t = setTimeout(() => { setTerme(recherche.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [recherche]);

  const ouvrirNouveau = () => { setForm(FORM_VIDE); setOngletEdit('contenu'); setErreurEdit(''); setEditeur({ id: null }); };
  const ouvrirModifier = async (a: Art) => {
    setOccupe(true);
    const r = await bq(`/blog/${a.id}`);
    setOccupe(false);
    if (!r.ok) { setErreurModale(messageErreur(r)); return; }
    const x: Art = r.data.article;
    setForm({ titre: x.titre, extrait: x.extrait || '', contenu: x.contenu || '', image_couverture: x.image_couverture || '', auteur: x.auteur || '', tags: (x.tags || []).join(', '), statut: x.statut, date_publication: versChampDate(x.date_publication) });
    setOngletEdit('contenu'); setErreurEdit(''); setEditeur({ id: x.id });
  };

  const enregistrer = async () => {
    if (!editeur) return;
    if (!form.titre.trim()) { setErreurEdit('Le titre est obligatoire.'); return; }
    setOccupe(true); setErreurEdit('');
    const corps = {
      titre: form.titre, extrait: form.extrait, contenu: form.contenu, image_couverture: form.image_couverture || null, auteur: form.auteur,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), statut: form.statut,
      date_publication: form.date_publication ? new Date(form.date_publication).toISOString() : null,
    };
    const r = editeur.id ? await bq(`/blog/${editeur.id}`, { method: 'PUT', body: corps }) : await bq('/blog', { method: 'POST', body: corps });
    setOccupe(false);
    if (!r.ok) { setErreurEdit(messageErreur(r)); return; }
    setEditeur(null);
    setMessage(editeur.id ? '✅ Article enregistré' : '✅ Article créé');
    charger();
  };

  const changerStatut = async (a: Art, nouveau: string) => {
    setOccupe(true);
    const r = await bq(`/blog/${a.id}`, { method: 'PUT', body: { statut: nouveau } });
    setOccupe(false);
    if (!r.ok) { setErreurModale(messageErreur(r)); return; }
    setMessage(nouveau === 'publie' ? '✅ Article publié' : nouveau === 'archive' ? '✅ Article archivé' : '✅ Article remis en brouillon');
    charger();
  };
  const supprimer = async () => {
    if (!aSupprimer) return;
    setOccupe(true);
    const r = await bq(`/blog/${aSupprimer.id}`, { method: 'DELETE' });
    setOccupe(false); setASupprimer(null);
    if (!r.ok) { setErreurModale(messageErreur(r)); return; }
    setMessage('✅ Article supprimé');
    charger();
  };

  // Images : envoi vers le même service que les photos de produits
  const envoyerImage = async (f: File): Promise<string | null> => {
    const fd = new FormData(); fd.append('file', f);
    let token: string | null = null; try { token = localStorage.getItem('token'); } catch (e) { token = null; }
    try {
      const res = await fetch(`${BQ}/upload`, { method: 'POST', credentials: 'include', headers: token ? { Authorization: `Bearer ${token}` } : undefined, body: fd });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.url) return j.url as string;
      setErreurEdit(j.error || 'Envoi impossible');
    } catch (e) { setErreurEdit('Erreur réseau'); }
    return null;
  };
  const choisirCouverture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    setEnvoi(true); setErreurEdit('');
    const url = await envoyerImage(f);
    if (url) setForm(x => ({ ...x, image_couverture: url }));
    setEnvoi(false); if (fichierCouv.current) fichierCouv.current.value = '';
  };
  const inserer = (avant: string, apres = '') => {
    const ta = texteRef.current; if (!ta) return;
    const d = ta.selectionStart, fin = ta.selectionEnd;
    const sel = form.contenu.slice(d, fin);
    const nouveau = form.contenu.slice(0, d) + avant + sel + apres + form.contenu.slice(fin);
    setForm(x => ({ ...x, contenu: nouveau }));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(d + avant.length, d + avant.length + sel.length); }, 10);
  };
  const choisirImageTexte = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    setEnvoi(true); setErreurEdit('');
    const url = await envoyerImage(f);
    if (url) inserer(`\n<img src="${url}" alt="" />\n`);
    setEnvoi(false); if (fichierTexte.current) fichierTexte.current.value = '';
  };

  const st = data?.stats;
  const filtres: [string, string][] = [['', 'Tous'], ['publie', '✅ Publiés'], ['brouillon', '📝 Brouillons'], ['archive', '📦 Archivés']];
  const badge = (a: Art) => {
    if (estProgramme(a)) return { t: '🕒 Programmé', bg: '#fef3c7', c: '#92400e' };
    if (a.statut === 'publie') return { t: '✅ Publié', bg: '#dcfce7', c: '#166534' };
    if (a.statut === 'archive') return { t: '📦 Archivé', bg: '#f3f4f6', c: '#4b5563' };
    return { t: '📝 Brouillon', bg: '#fffbeb', c: '#92400e' };
  };

  return (
    <div style={{ padding: isMobile ? 14 : 24, maxWidth: 1100, margin: '0 auto', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: T.text, margin: '0 0 4px' }}>📝 Mes blogs</h1>
          <p style={{ fontSize: 13, color: T.light, margin: 0 }}>Les articles publiés s'affichent dans le menu « Blog » de votre site.{st ? ` ${st.total} article${st.total > 1 ? 's' : ''} · ${st.publies} publié${st.publies > 1 ? 's' : ''}${st.programmes ? ` · ${st.programmes} programmé${st.programmes > 1 ? 's' : ''}` : ''} · ${st.brouillons} brouillon${st.brouillons > 1 ? 's' : ''}` : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {message && <span style={{ fontSize: 13, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 14px', borderRadius: 8 }}>{message}</span>}
          <button onClick={ouvrirNouveau} style={{ padding: '10px 20px', background: couleur, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ Nouvel article</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 4, background: '#fff', padding: 4, borderRadius: 10, border: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
          {filtres.map(([id, lib]) => (
            <button key={id || 'tous'} onClick={() => { setStatut(id); setPage(1); }}
              style={{ padding: '6px 14px', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer', background: statut === id ? couleur : 'transparent', color: statut === id ? '#fff' : T.light, fontWeight: statut === id ? 700 : 500 }}>{lib}</button>
          ))}
        </div>
        <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher un article…" style={{ padding: '8px 14px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, outline: 'none', width: isMobile ? '100%' : 260 }} />
      </div>

      {erreur && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 14 }}>{erreur}</div>}

      <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        {chargement ? <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>
          : !data || data.articles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📝</div>
              <p style={{ color: T.light, margin: '0 0 12px' }}>{terme || statut ? 'Aucun article ne correspond.' : "Vous n'avez pas encore d'article."}</p>
              {!terme && !statut && <button onClick={ouvrirNouveau} style={{ padding: '10px 20px', background: couleur, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>+ Écrire le premier article</button>}
            </div>
          ) : data.articles.map(a => {
            const b = badge(a);
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 14, padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, width: '100%' }}>
                  <div style={{ width: 64, height: 44, flexShrink: 0, borderRadius: 6, background: '#f0f2f5', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {a.image_couverture ? <img src={a.image_couverture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📄'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.titre}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 4, fontSize: 12, color: T.light }}>
                      <span style={{ background: b.bg, color: b.c, padding: '2px 8px', borderRadius: 20, fontWeight: 700, fontSize: 11 }}>{b.t}</span>
                      <span>{a.statut === 'publie' ? dateCourte(a.date_publication) : `Modifié ${dateCourte(a.updated_at)}`}</span>
                      <span>👁 {a.vues}</span>
                      {(a.tags || []).slice(0, 3).map(t => <span key={t} style={{ background: '#f3f4f6', color: T.light, padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{t}</span>)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                  <button disabled={occupe} onClick={() => ouvrirModifier(a)} style={btn('#eef0f3', T.text)}>✏️ Modifier</button>
                  {a.statut === 'publie'
                    ? <button disabled={occupe} onClick={() => changerStatut(a, 'brouillon')} style={btn('#f3f4f6', T.light)}>⏸ Dépublier</button>
                    : <button disabled={occupe} onClick={() => changerStatut(a, 'publie')} style={btn('#dcfce7', '#166534')}>🚀 Publier</button>}
                  {a.statut !== 'archive' && <button disabled={occupe} onClick={() => changerStatut(a, 'archive')} style={btn('#f3f4f6', T.light)} title="Archiver">📦</button>}
                  <button disabled={occupe} onClick={() => setASupprimer(a)} style={btn('#fef2f2', T.red)} title="Supprimer">🗑</button>
                </div>
              </div>
            );
          })}
        {data && data.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: 14 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ ...btn('#fff', T.text), border: `1px solid ${T.border}`, opacity: page <= 1 ? 0.4 : 1 }}>← Précédent</button>
            <span style={{ fontSize: 13, color: T.light }}>Page {data.page} / {data.pages}</span>
            <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} style={{ ...btn('#fff', T.text), border: `1px solid ${T.border}`, opacity: page >= data.pages ? 0.4 : 1 }}>Suivant →</button>
          </div>
        )}
      </div>

      {editeur && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 0 : 20 }}>
          <div role="dialog" aria-modal="true" style={{ background: '#fff', borderRadius: isMobile ? 0 : 18, width: '100%', maxWidth: 1050, height: isMobile ? '100%' : 'auto', maxHeight: isMobile ? '100%' : '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderBottom: `1px solid ${T.border}` }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>{editeur.id ? "✏️ Modifier l'article" : '➕ Nouvel article'}</h2>
              <button onClick={() => setEditeur(null)} aria-label="Fermer" style={{ width: 30, height: 30, border: 'none', borderRadius: 7, background: '#f0f2f5', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}` }}>
              {([['contenu', '✏️ Contenu'], ['options', '⚙️ Publication']] as const).map(([id, lib]) => (
                <button key={id} onClick={() => setOngletEdit(id)} style={{ padding: '12px 20px', border: 'none', background: 'transparent', fontSize: 13, cursor: 'pointer', color: ongletEdit === id ? couleur : T.light, fontWeight: ongletEdit === id ? 700 : 500, borderBottom: `2px solid ${ongletEdit === id ? couleur : 'transparent'}` }}>{lib}</button>
              ))}
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: isMobile ? 14 : '18px 22px' }}>
              {ongletEdit === 'contenu' && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 290px', gap: 20, alignItems: 'start' }}>
                  <div>
                    <label style={lbl}>Titre *</label>
                    <input value={form.titre} onChange={e => setForm(x => ({ ...x, titre: e.target.value }))} maxLength={200} placeholder="Titre de l'article…" autoFocus style={{ ...champ, fontSize: 18, fontWeight: 600, padding: '12px 14px' }} />
                    <label style={lbl}>Extrait (résumé affiché sur la page blog)</label>
                    <textarea value={form.extrait} onChange={e => setForm(x => ({ ...x, extrait: e.target.value }))} maxLength={400} rows={3} placeholder="Laissez vide : il sera créé à partir du début de l'article." style={{ ...champ, resize: 'vertical' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 6px', flexWrap: 'wrap', gap: 6 }}>
                      <label style={{ ...lbl, margin: 0 }}>Contenu</label>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {([['G', '<strong>', '</strong>', 'Gras'], ['I', '<em>', '</em>', 'Italique'], ['H2', '<h2>', '</h2>', 'Titre'], ['H3', '<h3>', '</h3>', 'Sous-titre'], ['🔗', '<a href="https://">', '</a>', 'Lien'], ['📋', '<ul>\n  <li>', '</li>\n</ul>', 'Liste'], ['💬', '<blockquote>', '</blockquote>', 'Citation']] as const).map(([l, a, z, t]) => (
                          <button key={l} type="button" title={t} onClick={() => inserer(a, z)} style={{ padding: '4px 9px', border: `1px solid ${T.border}`, borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: T.text }}>{l}</button>
                        ))}
                        <input ref={fichierTexte} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={choisirImageTexte} />
                        <button type="button" title="Insérer une image" disabled={envoi} onClick={() => fichierTexte.current?.click()} style={{ padding: '4px 9px', border: `1px solid ${T.border}`, borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12 }}>{envoi ? '⏳' : '🖼'}</button>
                      </div>
                    </div>
                    <textarea ref={texteRef} value={form.contenu} onChange={e => setForm(x => ({ ...x, contenu: e.target.value }))} rows={isMobile ? 12 : 16} placeholder={'Écrivez votre article en texte simple (une ligne vide = nouveau paragraphe) ou en HTML avec les boutons ci-dessus.'} style={{ ...champ, resize: 'vertical', fontFamily: 'ui-monospace, monospace', fontSize: 13, lineHeight: 1.6 }} />
                    <p style={{ fontSize: 11, color: T.light, margin: '4px 0 0' }}>{form.contenu.length} caractères · le contenu est nettoyé à l'enregistrement (les scripts et styles sont retirés).</p>
                    {form.contenu.trim() && (
                      <>
                        <label style={lbl}>Aperçu</label>
                        <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, maxHeight: 280, overflowY: 'auto', fontSize: 15, lineHeight: 1.7, color: T.text }}
                          dangerouslySetInnerHTML={{ __html: apercuSur(/^\s*</.test(form.contenu) ? form.contenu : form.contenu.split(/\n{2,}/).map(p => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`).join('')) }} />
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={carte}>
                      <div style={carteTitre}>🖼 Image de couverture</div>
                      <input ref={fichierCouv} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={choisirCouverture} />
                      {form.image_couverture ? (
                        <div style={{ position: 'relative' }}>
                          <img src={form.image_couverture} alt="Couverture" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8, border: `1px solid ${T.border}` }} />
                          <button onClick={() => setForm(x => ({ ...x, image_couverture: '' }))} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>✕ Retirer</button>
                        </div>
                      ) : (
                        <div onClick={() => !envoi && fichierCouv.current?.click()} style={{ width: '100%', aspectRatio: '16/9', background: '#f0f2f5', border: `2px dashed ${T.border}`, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 6 }}>
                          <span style={{ fontSize: 28 }}>{envoi ? '⏳' : '🖼'}</span>
                          <span style={{ fontSize: 12, color: T.light }}>{envoi ? 'Envoi…' : 'Cliquer pour ajouter'}</span>
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>JPG, PNG, WebP, GIF · 5 Mo max</span>
                        </div>
                      )}
                    </div>
                    <div style={carte}>
                      <div style={carteTitre}>👤 Détails</div>
                      <label style={lbl}>Auteur (affiché si activé dans Configurer mes pages)</label>
                      <input value={form.auteur} onChange={e => setForm(x => ({ ...x, auteur: e.target.value }))} maxLength={100} style={champ} />
                      <label style={lbl}>Balises (séparées par des virgules)</label>
                      <input value={form.tags} onChange={e => setForm(x => ({ ...x, tags: e.target.value }))} placeholder="conseils, nouveautés" style={champ} />
                    </div>
                  </div>
                </div>
              )}
              {ongletEdit === 'options' && (
                <div style={{ maxWidth: 560 }}>
                  <label style={lbl}>Statut</label>
                  <select value={form.statut} onChange={e => setForm(x => ({ ...x, statut: e.target.value }))} style={champ}>
                    <option value="brouillon">📝 Brouillon — non visible sur le site</option>
                    <option value="publie">✅ Publié — visible sur le site</option>
                    <option value="archive">📦 Archivé — retiré du site</option>
                  </select>
                  <label style={lbl}>Date de publication</label>
                  <input type="datetime-local" value={form.date_publication} onChange={e => setForm(x => ({ ...x, date_publication: e.target.value }))} style={champ} />
                  <p style={{ fontSize: 12, color: T.light, margin: '6px 0 0' }}>Laissez vide pour publier tout de suite. Une date à venir programme la publication : l'article apparaît seul à ce moment-là.</p>
                </div>
              )}
              {erreurEdit && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: 12, borderRadius: 10, marginTop: 14, fontSize: 14 }}>{erreurEdit}</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', borderTop: `1px solid ${T.border}`, gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: T.light }}>{form.statut === 'publie' ? (form.date_publication && new Date(form.date_publication).getTime() > Date.now() ? '🕒 Sera publié à la date choisie' : '✅ Sera visible sur le site') : form.statut === 'archive' ? '📦 Sera archivé' : '📝 Sera enregistré comme brouillon'}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditeur(null)} style={{ padding: '9px 18px', background: '#f0f2f5', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: T.light }}>Annuler</button>
                <button onClick={enregistrer} disabled={occupe || envoi || !form.titre.trim()} style={{ padding: '10px 22px', background: couleur, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#fff', opacity: occupe || envoi || !form.titre.trim() ? 0.55 : 1 }}>{occupe ? '⏳ Enregistrement…' : '💾 Enregistrer'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {aSupprimer && <BoutiqueModale type="confirmer" accent={couleur} enCours={occupe} titre="Supprimer cet article ?" message={`« ${aSupprimer.titre} » sera supprimé définitivement.`} texteConfirmer="Supprimer" onConfirmer={supprimer} onFermer={() => setASupprimer(null)} />}
      {erreurModale && <BoutiqueModale type="erreur" accent={couleur} message={erreurModale} onFermer={() => setErreurModale('')} />}
    </div>
  );
}

const btn = (bg: string, c: string): CSSProperties => ({ padding: '7px 12px', border: 'none', borderRadius: 8, background: bg, color: c, fontSize: 12, fontWeight: 700, cursor: 'pointer' });
const lbl: CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: T.text, margin: '14px 0 5px', textTransform: 'uppercase', letterSpacing: '0.4px' };
const champ: CSSProperties = { width: '100%', padding: '9px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, color: T.text, background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const carte: CSSProperties = { background: '#f8fafc', border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 };
const carteTitre: CSSProperties = { fontSize: 12, fontWeight: 800, color: T.text, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 };