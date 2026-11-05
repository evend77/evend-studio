// CHEMIN : src/pages/collaborateur/CollaborateurBlogs.tsx
// e-Vend Studio — Dashboard collaborateur : mes blogs (articles affichés dans l'onglet « Blog » de ma boutique)
// Adapté de MesBlogs.tsx (e-Vend). API : /api/collab/:gestionnaireId/blogs · POST /api/collab/:gestionnaireId/upload (images)

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Blog {
  id: number; titre: string; contenu: string; statut: 'publie' | 'brouillon';
  date_creation: string; date_publication?: string | null; vues: number; tags: string[];
}
interface Props { gestionnaireId: number; accent: string; isMobile: boolean; }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', success: '#008060', warning: '#d97706', danger: '#dc2626', card: '#fff' };

// Texte brut d'un article (aperçu de la liste) — analysé sans jamais exécuter de code
function texteBrut(html: string): string {
  try { return (new DOMParser().parseFromString(html || '', 'text/html').body.textContent || '').replace(/\s+/g, ' ').trim(); }
  catch { return ''; }
}

// ── Éditeur de texte enrichi (gras, listes, alignement, images envoyées sur notre stockage) ──
function EditeurRiche({ valeur, onChange, gestionnaireId, accent, onErreur }: {
  valeur: string; onChange: (v: string) => void; gestionnaireId: number; accent: string; onErreur: (m: string) => void;
}) {
  const zone = useRef<HTMLDivElement>(null);
  const fichier = useRef<HTMLInputElement>(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    if (zone.current && !pret) { zone.current.innerHTML = valeur || ''; setPret(true); }
  }, [pret, valeur]);

  const exec = (cmd: string, val = '') => {
    document.execCommand(cmd, false, val);
    if (zone.current) onChange(zone.current.innerHTML);
  };

  const envoyerImage = async (f: File) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(f.type)) { onErreur('Format non accepté (JPEG, PNG, WebP ou GIF).'); return; }
    if (f.size > 5 * 1024 * 1024) { onErreur('Image trop lourde (max 5 Mo).'); return; }
    const fd = new FormData();
    fd.append('file', f);
    try {
      const res = await fetch(`/api/collab/${gestionnaireId}/upload`, { method: 'POST', credentials: 'include', body: fd });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.url) { zone.current?.focus(); exec('insertImage', d.url); }
      else onErreur(d.error || 'Envoi de l\'image impossible.');
    } catch { onErreur('Erreur réseau pendant l\'envoi de l\'image.'); }
  };

  const coller = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) { e.preventDefault(); const f = items[i].getAsFile(); if (f) envoyerImage(f); return; }
      }
    }
    // Texte collé : toujours en texte simple (pas de mise en forme venue d'ailleurs)
    e.preventDefault();
    const texte = e.clipboardData.getData('text/plain').slice(0, 20000);
    document.execCommand('insertText', false, texte);
  };

  const btn: React.CSSProperties = { padding: '5px 9px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 5, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: T.text, minWidth: 32 };
  const sep = <div style={{ width: 1, height: 24, background: T.border, margin: '0 4px' }} />;

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <style>{`.cb-editeur img { max-width:100% !important; height:auto !important; max-height:300px !important; object-fit:contain !important; border-radius:8px !important; margin:10px 0 !important; }`}</style>
      <div style={{ background: '#f8f9fa', borderBottom: `1px solid ${T.border}`, padding: '8px 10px', display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" style={btn} title="Gras" onMouseDown={e => { e.preventDefault(); exec('bold'); }}><strong>G</strong></button>
        <button type="button" style={btn} title="Italique" onMouseDown={e => { e.preventDefault(); exec('italic'); }}><em>I</em></button>
        <button type="button" style={btn} title="Souligné" onMouseDown={e => { e.preventDefault(); exec('underline'); }}><u>S</u></button>
        {sep}
        <button type="button" style={btn} title="Aligner à gauche" onMouseDown={e => { e.preventDefault(); exec('justifyLeft'); }}>⬅</button>
        <button type="button" style={btn} title="Centrer" onMouseDown={e => { e.preventDefault(); exec('justifyCenter'); }}>≡</button>
        <button type="button" style={btn} title="Aligner à droite" onMouseDown={e => { e.preventDefault(); exec('justifyRight'); }}>⮕</button>
        {sep}
        <button type="button" style={btn} onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }}>• Liste</button>
        <button type="button" style={btn} onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }}>1. Liste</button>
        {sep}
        <button type="button" style={{ ...btn, color: accent }} title="Insérer une image dans le texte" onMouseDown={e => { e.preventDefault(); fichier.current?.click(); }}>🖼 Image</button>
        <input ref={fichier} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) envoyerImage(f); e.target.value = ''; }} />
        {sep}
        <select defaultValue="3" onChange={e => exec('fontSize', e.target.value)} style={{ fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 5, padding: '4px 6px', background: '#fff' }}>
          {[['1', '8 pt'], ['2', '10 pt'], ['3', '12 pt'], ['4', '14 pt'], ['5', '18 pt'], ['6', '24 pt'], ['7', '36 pt']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div ref={zone} contentEditable suppressContentEditableWarning className="cb-editeur"
        onInput={() => { if (zone.current) onChange(zone.current.innerHTML); }} onPaste={coller}
        style={{ minHeight: 280, padding: 16, outline: 'none', fontSize: 14, lineHeight: 1.7, color: T.text, overflowY: 'auto' }} />
      <div style={{ padding: '6px 12px', background: '#f8f9fa', borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.light }}>
        💡 Collez une image ou cliquez sur « 🖼 Image » (JPEG, PNG, WebP ou GIF, 5 Mo max).
      </div>
    </div>
  );
}

export default function CollaborateurBlogs({ gestionnaireId, accent, isMobile }: Props) {
  const base = `/api/collab/${gestionnaireId}/blogs`;
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [vue, setVue] = useState<'liste' | 'editeur'>('liste');
  const [edite, setEdite] = useState<Blog | null>(null);
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState<'tous' | 'publie' | 'brouillon'>('tous');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [suppr, setSuppr] = useState<number | null>(null);
  const [titre, setTitre] = useState('');
  const [contenu, setContenu] = useState('');
  const [tags, setTags] = useState('');
  const [statut, setStatut] = useState<'publie' | 'brouillon'>('brouillon');

  const annoncer = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };
  const json = { 'Content-Type': 'application/json' };
  const erreurServeur = async (res: Response) => (await res.json().catch(() => ({}))).error || 'Erreur serveur';

  const charger = useCallback(async () => {
    try {
      const res = await fetch(base, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setBlogs(Array.isArray(d) ? d.map((b: any) => ({ ...b, tags: Array.isArray(b.tags) ? b.tags : [] })) : []);
      } else annoncer('❌ ' + await erreurServeur(res), false);
    } catch { annoncer('❌ Erreur de chargement', false); }
    setChargement(false);
  }, [base]);
  useEffect(() => { charger(); }, [charger]);

  const nouveau = () => { setEdite(null); setTitre(''); setContenu(''); setTags(''); setStatut('brouillon'); setVue('editeur'); };
  const modifier = (b: Blog) => { setEdite(b); setTitre(b.titre); setContenu(b.contenu); setTags(b.tags.join(', ')); setStatut(b.statut); setVue('editeur'); };

  const sauvegarder = async () => {
    if (!titre.trim() || !texteBrut(contenu) && !/<img /.test(contenu)) { annoncer('⚠️ Le titre et le contenu sont obligatoires.', false); return; }
    setOccupe(true);
    const corps = { titre: titre.trim(), contenu, tags: tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 10), statut };
    try {
      const res = await fetch(edite ? `${base}/${edite.id}` : base, { method: edite ? 'PUT' : 'POST', credentials: 'include', headers: json, body: JSON.stringify(corps) });
      if (!res.ok) throw new Error(await erreurServeur(res));
      annoncer(edite ? '✅ Article mis à jour !' : statut === 'publie' ? '🌐 Article publié !' : '💾 Brouillon sauvegardé.', true);
      await charger(); setVue('liste');
    } catch (e: any) { annoncer('❌ ' + (e.message || 'Erreur'), false); }
    setOccupe(false);
  };

  const supprimer = async (id: number) => {
    try {
      const res = await fetch(`${base}/${id}`, { method: 'DELETE', credentials: 'include' });
      setSuppr(null);
      if (res.ok) { annoncer('🗑️ Article supprimé.', true); await charger(); } else annoncer('❌ ' + await erreurServeur(res), false);
    } catch { annoncer('❌ Erreur lors de la suppression', false); }
  };

  const basculer = async (b: Blog) => {
    try {
      const res = await fetch(`${base}/${b.id}`, { method: 'PUT', credentials: 'include', headers: json, body: JSON.stringify({ statut: b.statut === 'publie' ? 'brouillon' : 'publie' }) });
      if (res.ok) { annoncer('✅ Statut mis à jour.', true); await charger(); } else annoncer('❌ ' + await erreurServeur(res), false);
    } catch { annoncer('❌ Erreur', false); }
  };

  const filtres = blogs.filter(b => {
    const q = recherche.toLowerCase();
    return (!q || b.titre.toLowerCase().includes(q) || b.tags.some(t => t.toLowerCase().includes(q))) && (filtre === 'tous' || b.statut === filtre);
  });
  const nbPub = blogs.filter(b => b.statut === 'publie').length;
  const nbVues = blogs.reduce((s, b) => s + (b.vues || 0), 0);

  const carte: React.CSSProperties = { background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
  const lib: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase', display: 'block', marginBottom: 8, letterSpacing: 0.5 };
  const champ: React.CSSProperties = { width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const Toast = toast && <div role="status" style={{ position: 'fixed', top: 80, right: 24, background: toast.ok ? T.success : T.danger, color: '#fff', padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>{toast.msg}</div>;

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>;

  // ── ÉDITEUR ──
  if (vue === 'editeur') {
    const pret = !occupe && titre.trim() && (texteBrut(contenu) || /<img /.test(contenu));
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? 14 : 20 }}>
        {Toast}
        <div style={{ marginBottom: 20, borderBottom: `2px solid ${T.border}`, paddingBottom: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => setVue('liste')} style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: accent, padding: 8 }}>← Retour</button>
          <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, color: T.text }}>{edite ? "Modifier l'article" : 'Nouvel article de blog'}</h2>
        </div>
        <div style={carte}>
          <label style={lib}>Titre de l'article *</label>
          <input value={titre} maxLength={200} autoComplete="off" onChange={e => setTitre(e.target.value)} placeholder="Ex : Nouveautés de l'automne…" style={{ ...champ, fontSize: 15, fontWeight: 600 }} />
        </div>
        <div style={carte}>
          <label style={lib}>Contenu de l'article *</label>
          <EditeurRiche valeur={contenu} onChange={setContenu} gestionnaireId={gestionnaireId} accent={accent} onErreur={m => annoncer('⚠️ ' + m, false)} />
        </div>
        <div style={{ ...carte, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          <div>
            <label style={lib}>Tags (séparés par des virgules)</label>
            <input value={tags} maxLength={200} autoComplete="off" onChange={e => setTags(e.target.value)} placeholder="ex : conseil, nouveauté, promo" style={champ} />
          </div>
          <div>
            <label style={lib}>Statut de publication</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['brouillon', 'publie'] as const).map(s => (
                <button key={s} type="button" onClick={() => setStatut(s)}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: `2px solid ${statut === s ? accent : T.border}`, background: statut === s ? `${accent}18` : '#fff', color: statut === s ? accent : T.light, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                  {s === 'brouillon' ? '💾 Brouillon' : '🌐 Publier'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: isMobile ? 'stretch' : 'flex-end', flexDirection: isMobile ? 'column' : 'row', paddingBottom: 40 }}>
          <button onClick={() => setVue('liste')} style={{ padding: '11px 22px', border: `1px solid ${T.border}`, borderRadius: 9, background: '#fff', color: T.text, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
          <button onClick={sauvegarder} disabled={!pret}
            style={{ padding: '11px 24px', border: 'none', borderRadius: 9, background: pret ? (statut === 'publie' ? T.success : accent) : '#aaa', color: '#fff', fontSize: 13, fontWeight: 800, cursor: pret ? 'pointer' : 'not-allowed', minWidth: isMobile ? 'auto' : 160 }}>
            {occupe ? '⏳ Sauvegarde…' : statut === 'publie' ? "🌐 Publier l'article" : '💾 Sauvegarder le brouillon'}
          </button>
        </div>
      </div>
    );
  }

  // ── LISTE ──
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? 14 : 20 }}>
      {Toast}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 12, marginBottom: 20, borderBottom: `2px solid ${T.border}`, paddingBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 24, color: T.text }}>📝 Mes blogs</h2>
        <button onClick={nouveau} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ Nouvel article</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
        {[{ l: 'Articles publiés', v: nbPub, i: '🌐', c: T.success }, { l: 'Brouillons', v: blogs.length - nbPub, i: '💾', c: accent }, { l: 'Vues totales', v: nbVues, i: '👁', c: T.warning }].map(k => (
          <div key={k.l} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 20 }}>{k.i}</span><span style={{ fontSize: 22, fontWeight: 900, color: k.c }}>{k.v}</span></div>
            <div style={{ fontSize: 11, color: T.light, fontWeight: 600 }}>{k.l}</div>
          </div>
        ))}
      </div>

      <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
          <input value={recherche} maxLength={100} autoComplete="off" onChange={e => setRecherche(e.target.value.replace(/[<>\u0000-\u001F]/g, ''))} placeholder="Rechercher par titre ou tag…"
            style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px 8px 30px', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        {(['tous', 'publie', 'brouillon'] as const).map(f => (
          <button key={f} onClick={() => setFiltre(f)} style={{ padding: '7px 14px', borderRadius: 7, border: `1px solid ${filtre === f ? accent : T.border}`, background: filtre === f ? `${accent}18` : '#fff', color: filtre === f ? accent : T.light, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {f === 'tous' ? 'Tous' : f === 'publie' ? '🌐 Publiés' : '💾 Brouillons'}
          </button>
        ))}
      </div>

      {filtres.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 50, background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, color: T.light }}>
          <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 10 }}>📝</div>
          <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>Aucun article trouvé</p>
          <p style={{ fontSize: 12, margin: '0 0 16px' }}>Créez votre premier article : il apparaîtra dans l'onglet « Blog » de votre boutique une fois publié.</p>
          <button onClick={nouveau} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Créer un article</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtres.map(b => {
            const apercu = texteBrut(b.contenu);
            return (
              <div key={b.id} style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, padding: isMobile ? 16 : '18px 20px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-start', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ background: b.statut === 'publie' ? '#dcfce7' : '#f3f4f6', color: b.statut === 'publie' ? T.success : T.light, padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{b.statut === 'publie' ? '🌐 Publié' : '💾 Brouillon'}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: T.text, overflowWrap: 'anywhere' }}>{b.titre}</span>
                  </div>
                  <p style={{ fontSize: 12, color: T.light, margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apercu.slice(0, 140)}{apercu.length > 140 ? '…' : ''}</p>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', fontSize: 11, color: T.light }}>
                    <span>📅 Créé le {new Date(b.date_creation).toLocaleDateString('fr-CA')}</span>
                    {b.date_publication && <span style={{ color: T.success }}>🌐 Publié le {new Date(b.date_publication).toLocaleDateString('fr-CA')}</span>}
                    {b.vues > 0 && <span>👁 {b.vues} vue{b.vues > 1 ? 's' : ''}</span>}
                    {b.tags.map(t => <span key={t} style={{ background: `${accent}18`, color: accent, padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>#{t}</span>)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  <button onClick={() => basculer(b)} style={{ background: b.statut === 'publie' ? '#fef9c3' : '#dcfce7', color: b.statut === 'publie' ? '#92400e' : T.success, border: 'none', borderRadius: 7, padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', flex: isMobile ? 1 : 'none' }}>{b.statut === 'publie' ? '⏸ Dépublier' : '🌐 Publier'}</button>
                  <button onClick={() => modifier(b)} style={{ background: `${accent}18`, color: accent, border: 'none', borderRadius: 7, padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', flex: isMobile ? 1 : 'none' }}>✏️ Modifier</button>
                  <button onClick={() => setSuppr(b.id)} aria-label="Supprimer" style={{ background: '#fee2e2', color: T.danger, border: 'none', borderRadius: 7, padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {suppr !== null && (
        <div onClick={() => setSuppr(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, maxWidth: 380, width: '100%', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: '#fff5f5', borderBottom: `2px solid ${T.danger}` }}><p style={{ fontSize: 14, fontWeight: 800, color: T.danger, margin: 0 }}>🗑️ Supprimer cet article ?</p></div>
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13, color: T.text, margin: '0 0 20px' }}>Cette action est irréversible. L'article sera définitivement supprimé.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setSuppr(null)} style={{ flex: 1, padding: 10, border: `1px solid ${T.border}`, borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                <button onClick={() => supprimer(suppr)} style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: T.danger, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}