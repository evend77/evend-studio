// src/templates/annoncesSite/moteur.tsx
// e-Vend Studio — Moteur partagé des sites de petites annonces (affichage seulement, aucune transaction).

import { useState, useEffect, useRef } from 'react';

const API = '/api/annonces-studio';

export interface AnnoncePub {
  id: number;
  titre: string;
  description: string;
  prix: number | null;
  prixTexte: string;
  categorie: string;
  lieu: string;
  photos: string[];
  details: Record<string, string>;
  vedette: boolean;
  statut: string;
  datePublication: string;
  dateExpiration: string | null;
}
export interface Filtres {
  q: string; categorie: string; lieu: string; prixMin: string; prixMax: string; tri: 'recent' | 'prix_asc' | 'prix_desc'; page: number;
  d?: Record<string, string>;      // égalité sur un détail (ex. Marque = Toyota)
  dmin?: Record<string, string>;   // minimum numérique sur un détail (ex. Année ≥ 2018)
  dmax?: Record<string, string>;   // maximum numérique sur un détail (ex. Kilométrage ≤ 100000)
}
export const FILTRES_VIDES: Filtres = { q: '', categorie: '', lieu: '', prixMin: '', prixMax: '', tri: 'recent', page: 1, d: {}, dmin: {}, dmax: {} };
export type Facettes = Record<string, { nom: string; n: number }[]>;

// Nombre contenu dans un détail (« 85 000 km » → 85000)
export const nbDe = (v: string | undefined) => { const n = String(v || '').replace(/[^0-9]/g, ''); return n ? Number(n) : NaN; };
export const sansVide = (o?: Record<string, string>) => Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v !== '' && v != null));
export const filtresActifs = (f: Filtres) => !!(f.q || f.lieu || f.categorie || f.prixMin || f.prixMax || Object.keys(sansVide(f.d)).length || Object.keys(sansVide(f.dmin)).length || Object.keys(sansVide(f.dmax)).length);

export const fmtPrix = (a: Pick<AnnoncePub, 'prix' | 'prixTexte'>) =>
  a.prix != null ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: a.prix % 1 === 0 ? 0 : 2 }).format(a.prix) : (a.prixTexte || 'Prix à discuter');

export function ilYa(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `il y a ${Math.max(1, Math.floor(s / 60))} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  const j = Math.floor(s / 86400);
  if (j < 30) return `il y a ${j} j`;
  return new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function filtrerDemo(tous: AnnoncePub[], f: Filtres) {
  let r = tous.filter((a) => (!f.categorie || a.categorie === f.categorie)
    && (!f.q || (a.titre + ' ' + a.description).toLowerCase().includes(f.q.toLowerCase()))
    && (!f.lieu || a.lieu.toLowerCase().includes(f.lieu.toLowerCase()))
    && (!f.prixMin || (a.prix != null && a.prix >= Number(f.prixMin)))
    && (!f.prixMax || (a.prix != null && a.prix <= Number(f.prixMax)))
    && Object.entries(sansVide(f.d)).every(([k, v]) => (a.details[k] || '').toLowerCase() === v.toLowerCase())
    && Object.entries(sansVide(f.dmin)).every(([k, v]) => nbDe(a.details[k]) >= Number(v))
    && Object.entries(sansVide(f.dmax)).every(([k, v]) => nbDe(a.details[k]) <= Number(v)));
  if (f.tri === 'prix_asc') r = [...r].sort((a, b) => (a.prix ?? 1e12) - (b.prix ?? 1e12));
  else if (f.tri === 'prix_desc') r = [...r].sort((a, b) => (b.prix ?? -1) - (a.prix ?? -1));
  else r = [...r].sort((a, b) => Number(b.vedette) - Number(a.vedette) || new Date(b.datePublication).getTime() - new Date(a.datePublication).getTime());
  return r;
}

export function useAnnonces(gid: number, demoListe: AnnoncePub[], f: Filtres, facettesCles: string[] = []) {
  const reel = gid > 0;
  const [annonces, setAnnonces] = useState<AnnoncePub[]>([]);
  const [categories, setCategories] = useState<{ nom: string; n: number }[]>([]);
  const [facettes, setFacettes] = useState<Facettes>({});
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(!reel);
  const [erreur, setErreur] = useState(false);
  const numReq = useRef(0);

  const cle = JSON.stringify(f);
  useEffect(() => {
    const n = ++numReq.current;
    const t = setTimeout(async () => {
      if (!reel) {
        const r = filtrerDemo(demoListe, f);
        const cats: Record<string, number> = {}; demoListe.forEach((a) => { if (a.categorie) cats[a.categorie] = (cats[a.categorie] || 0) + 1; });
        setAnnonces(r); setTotal(r.length); setPages(1); setCategories(Object.entries(cats).map(([nom, n]) => ({ nom, n })));
        const fa: Facettes = {}; facettesCles.forEach((k) => { const m: Record<string, number> = {}; demoListe.forEach((a) => { const v = a.details[k]; if (v) m[v] = (m[v] || 0) + 1; }); fa[k] = Object.entries(m).sort((x, y) => y[1] - x[1]).map(([nom, n]) => ({ nom, n })); }); setFacettes(fa);
        setDemo(true); setLoading(false); return;
      }
      try {
        const p = new URLSearchParams();
        (['q', 'categorie', 'lieu', 'prixMin', 'prixMax'] as const).forEach((k) => { if (f[k]) p.set(k, f[k]); });
        p.set('tri', f.tri); p.set('page', String(f.page));
        (['d', 'dmin', 'dmax'] as const).forEach((g) => Object.entries(sansVide(f[g])).forEach(([k, v]) => p.set(`${g}[${k}]`, v)));
        if (facettesCles.length) p.set('facettes', facettesCles.join(','));
        const r = await fetch(`${API}/${gid}/annonces?${p.toString()}`);
        if (n !== numReq.current) return;
        if (!r.ok) throw new Error('x');
        const d = await r.json();
        setAnnonces(d.annonces || []); setTotal(d.total || 0); setPages(d.pages || 1); setCategories(d.categories || []); setFacettes(d.facettes || {}); setDemo(false); setErreur(false);
      } catch { if (n === numReq.current) { setErreur(true); setAnnonces(demoListe); setDemo(true); setTotal(demoListe.length); } }
      finally { if (n === numReq.current) setLoading(false); }
    }, f.q ? 250 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle, gid]);

  return { annonces, categories, facettes, total, pages, loading, demo, erreur };
}

// ─── Formulaire de contact (message transmis par courriel au gestionnaire) ────
export function FormulaireContact({ gid, annonceId, couleur, demo }: { gid: number; annonceId: number; couleur: string; demo: boolean }) {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [tel, setTel] = useState('');
  const [message, setMessage] = useState('');
  const [piege, setPiege] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');

  const champ: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #d6d3cc', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', color: '#1f2937' };

  const envoyer = async () => {
    setErr('');
    if (nom.trim().length < 2) { setErr('Indiquez votre nom.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setErr('Courriel invalide.'); return; }
    if (message.trim().length < 5) { setErr('Écrivez votre message.'); return; }
    if (demo) { setErr("Aperçu : l'envoi est désactivé."); return; }
    setEnvoi(true);
    try {
      const r = await fetch(`${API}/${gid}/annonces/${annonceId}/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nom, email, telephone: tel, message, site_web: piege }) });
      let d: any = {}; try { d = await r.json(); } catch { /* ignore */ }
      if (!r.ok) { setErr(d.message || 'Erreur.'); return; }
      setOk(true);
    } catch { setErr('Erreur réseau.'); } finally { setEnvoi(false); }
  };

  if (ok) return <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: 10, padding: 16, fontSize: 14 }}>✅ Message envoyé ! L'annonceur vous répondra par courriel.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input style={champ} placeholder="Votre nom" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={80} />
      <input style={champ} type="email" placeholder="Votre courriel" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input style={champ} placeholder="Téléphone (facultatif)" value={tel} onChange={(e) => setTel(e.target.value)} maxLength={30} />
      <textarea style={{ ...champ, minHeight: 100, resize: 'vertical' }} placeholder="Votre message : questions, disponibilité…" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={3000} />
      {/* champ piège pour les robots : invisible pour les humains */}
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={piege} onChange={(e) => setPiege(e.target.value)} style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
      {err && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>{err}</div>}
      <button onClick={envoyer} disabled={envoi} style={{ padding: '12px 18px', background: couleur, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: envoi ? 'wait' : 'pointer', opacity: envoi ? 0.7 : 1 }}>{envoi ? '⏳ Envoi…' : '✉️ Envoyer le message'}</button>
      <p style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>Votre message est transmis par courriel à l'annonceur, qui vous répondra directement. Soyez prudent : ne payez jamais à l'avance sans avoir vu l'article ou le bien.</p>
    </div>
  );
}