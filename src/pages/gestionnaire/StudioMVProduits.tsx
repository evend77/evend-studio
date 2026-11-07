// CHEMIN : src/pages/gestionnaire/StudioMVProduits.tsx
// e-Vend Studio — Multi-vendeur : le gestionnaire voit et modifie les produits de TOUS ses collaborateurs.
// API : /api/studio/mv/:gid/(collaborateurs|categories|produits)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { formaterPrix, useDevise } from '../../templates/shared/devise';

const API_BASE = '/api';
const C = { accent: '#c9a96e', green: '#10b981', red: '#ef4444', orange: '#f59e0b', bg: '#f4f6f8', card: '#fff', border: '#e1e4e8', text: '#1a2332', textLight: '#64748b' };

interface Produit {
  id: number; titre: string; prix: string; prix_promo: string | null; stock: number | null; sku: string | null; categorie: string | null;
  photo_principale: string | null; statut: 'actif' | 'brouillon' | 'en_attente'; collaborateur_id: number; boutique: string | null; en_enchere: boolean;
}
interface Fiche extends Produit { description: string | null; categorie_id: number | null; }
interface Reponse { produits: Produit[]; total: number; page: number; pages: number; stats: { total: number; actifs: number; brouillons: number; en_attente?: number; ruptures: number } }

function entetes(): Record<string, string> {
  let token: string | null = null;
  try { token = localStorage.getItem('token'); } catch { /* ignore */ }
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
const argent = (v: string | number | null) => (v === null || v === undefined ? '—' : formaterPrix(v));
const champ: React.CSSProperties = { width: '100%', padding: '9px 11px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' };
const bouton = (couleur: string): React.CSSProperties => ({ background: 'none', border: `1px solid ${couleur}`, color: couleur, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' });

const StudioMVProduits: React.FC<{ gestionnaireId: number }> = ({ gestionnaireId }) => {
  useDevise(gestionnaireId);   // devise réglée dans Config marketplace
  const base = `${API_BASE}/studio/mv/${gestionnaireId}`;
  const [data, setData] = useState<Reponse | null>(null);
  const [collabs, setCollabs] = useState<{ id: number; nom_boutique: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; nom: string }[]>([]);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(''); const [qEff, setQEff] = useState('');
  const [collab, setCollab] = useState(''); const [statut, setStatut] = useState('');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [edition, setEdition] = useState<Fiche | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [errForm, setErrForm] = useState('');
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  const charger = useCallback(async () => {
    const p = new URLSearchParams({ page: String(page) });
    if (qEff) p.set('q', qEff); if (collab) p.set('collaborateur_id', collab); if (statut) p.set('statut', statut);
    try {
      const r = await fetch(`${base}/produits?${p}`, { credentials: 'include', headers: entetes() });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { setData(d); setErreur(''); } else setErreur(d.error || 'Chargement impossible');
    } catch { setErreur('Erreur réseau'); }
    setChargement(false);
  }, [base, page, qEff, collab, statut]);
  useEffect(() => { charger(); }, [charger]);

  useEffect(() => {
    fetch(`${base}/collaborateurs`, { credentials: 'include', headers: entetes() }).then(r => r.ok ? r.json() : []).then(setCollabs).catch(() => {});
    fetch(`${base}/categories`, { credentials: 'include', headers: entetes() }).then(r => r.ok ? r.json() : []).then(setCategories).catch(() => {});
  }, [base]);

  const recherche = (v: string) => { setQ(v); if (minuterie.current) clearTimeout(minuterie.current); minuterie.current = setTimeout(() => { setPage(1); setQEff(v.trim()); }, 350); };

  const changer = async (p: Produit, nouveau: 'actif' | 'brouillon') => {
    setOccupe(true);
    try {
      const r = await fetch(`${base}/produits/${p.id}/statut`, { method: 'PATCH', credentials: 'include', headers: entetes(), body: JSON.stringify({ statut: nouveau }) });
      if (!r.ok) setErreur((await r.json().catch(() => ({}))).error || 'Action impossible'); else setErreur('');
      await charger();
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };

  const basculer = async (p: Produit) => {
    setOccupe(true);
    try {
      const r = await fetch(`${base}/produits/${p.id}/statut`, { method: 'PATCH', credentials: 'include', headers: entetes(), body: JSON.stringify({ statut: p.statut === 'actif' ? 'brouillon' : 'actif' }) });
      if (!r.ok) setErreur((await r.json().catch(() => ({}))).error || 'Action impossible'); else setErreur('');
      await charger();
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };

  const ouvrir = async (p: Produit) => {
    setErrForm('');
    try {
      const r = await fetch(`${base}/produits/${p.id}`, { credentials: 'include', headers: entetes() });
      const f: Fiche = await r.json();
      if (!r.ok) { setErreur((f as any).error || 'Produit introuvable'); return; }
      setEdition(f);
      setForm({
        titre: f.titre || '', description: f.description || '', prix: String(f.prix ?? ''), prix_promo: f.prix_promo === null ? '' : String(f.prix_promo),
        stock: f.stock === null ? '' : String(f.stock), sku: f.sku || '', categorie_id: f.categorie_id ? String(f.categorie_id) : '', statut: f.statut,
      });
    } catch { setErreur('Erreur réseau'); }
  };

  const sauver = async () => {
    if (!edition) return;
    setOccupe(true); setErrForm('');
    try {
      const r = await fetch(`${base}/produits/${edition.id}`, { method: 'PUT', credentials: 'include', headers: entetes(), body: JSON.stringify(form.statut === 'en_attente' ? { ...form, statut: undefined } : form) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setErrForm(d.error || 'Enregistrement impossible');
      else { setEdition(null); await charger(); }
    } catch { setErrForm('Erreur réseau'); }
    setOccupe(false);
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: C.textLight }}>Chargement…</div>;
  const lignes = data?.produits || [];
  const st = data?.stats;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', color: C.text }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 22 }}>📦 Produits des collaborateurs</h2>
      <p style={{ margin: '0 0 16px', color: C.textLight, fontSize: 13 }}>Vous pouvez corriger le titre, la description, le prix, le stock ou retirer un produit. Les photos et les variantes restent gérées par le collaborateur.</p>

      {(st?.en_attente ?? 0) > 0 && statut !== 'en_attente' && (
        <button onClick={() => { setStatut('en_attente'); setPage(1); }} style={{ display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412', borderRadius: 10, padding: '12px 16px', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
          ⏳ {st?.en_attente} annonce{(st?.en_attente ?? 0) > 1 ? 's' : ''} en attente de ton approbation — cliquer pour les voir
        </button>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, marginBottom: 14 }}>
        {[['Total', st?.total, C.text], ['Actifs', st?.actifs, C.green], ['À approuver', st?.en_attente, '#C2570C'], ['Brouillons', st?.brouillons, C.orange], ['En rupture', st?.ruptures, C.red]].map(([l, v, c]) => (
          <div key={String(l)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: String(c) }}>{v ?? 0}</div><div style={{ fontSize: 11, color: C.textLight, textTransform: 'uppercase' }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input value={q} onChange={e => recherche(e.target.value)} placeholder="Titre ou SKU…" style={{ ...champ, flex: '1 1 220px', width: 'auto' }} />
        <select value={collab} onChange={e => { setCollab(e.target.value); setPage(1); }} style={{ ...champ, width: 'auto' }}>
          <option value="">Tous les collaborateurs</option>{collabs.map(c => <option key={c.id} value={c.id}>{c.nom_boutique || `Collaborateur ${c.id}`}</option>)}
        </select>
        <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1); }} style={{ ...champ, width: 'auto' }}>
          <option value="">Tous les statuts</option><option value="actif">Actifs</option><option value="en_attente">À approuver</option><option value="brouillon">Brouillons</option>
        </select>
      </div>

      {erreur && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erreur}</div>}

      {lignes.length === 0 ? (
        <div style={{ padding: 50, textAlign: 'center', background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, color: C.textLight }}>Aucun produit.</div>
      ) : (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {lignes.map(p => (
            <div key={p.id} style={{ display: 'flex', gap: 12, padding: 12, borderBottom: `1px solid ${C.border}`, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: 52, height: 52, borderRadius: 8, background: C.bg, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {p.photo_principale ? <img src={p.photo_principale} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22 }}>🖼️</span>}
              </div>
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titre}{p.en_enchere && <span title="En enchère"> 🔨</span>}</div>
                <div style={{ fontSize: 12, color: C.textLight }}>🏪 {p.boutique || '—'}{p.categorie ? ` · ${p.categorie}` : ''}{p.sku ? ` · SKU ${p.sku}` : ''}</div>
              </div>
              <div style={{ fontSize: 13, minWidth: 100 }}>
                {p.prix_promo ? (<><strong style={{ color: C.red }}>{argent(p.prix_promo)}</strong> <s style={{ color: C.textLight, fontSize: 11 }}>{argent(p.prix)}</s></>) : <strong>{argent(p.prix)}</strong>}
              </div>
              <div style={{ fontSize: 13, minWidth: 60, color: p.stock === 0 ? C.red : C.text, fontWeight: p.stock === 0 ? 700 : 400 }}>{p.stock === null ? '∞' : p.stock === 0 ? 'Rupture' : p.stock}</div>
              <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: p.statut === 'actif' ? '#E9F7EF' : p.statut === 'en_attente' ? '#FFF3E0' : '#FEF9E7', color: p.statut === 'actif' ? '#1E8449' : p.statut === 'en_attente' ? '#C2570C' : '#B7950B' }}>{p.statut === 'actif' ? 'Actif' : p.statut === 'en_attente' ? '⏳ À approuver' : 'Brouillon'}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button disabled={occupe} onClick={() => ouvrir(p)} style={bouton(C.accent)}>✏️ Modifier</button>
                {p.statut === 'en_attente' ? (<>
                  <button disabled={occupe} onClick={() => basculer(p)} style={bouton(C.green)}>✅ Approuver</button>
                  <button disabled={occupe} onClick={() => changer(p, 'brouillon')} style={bouton(C.red)} title="Renvoie l'annonce en brouillon chez le collaborateur">✖ Refuser</button>
                </>) : (
                  <button disabled={occupe} onClick={() => basculer(p)} style={bouton(C.textLight)}>{p.statut === 'actif' ? '⏸ Retirer' : '▶ Publier'}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 13, color: C.textLight, flexWrap: 'wrap', gap: 8 }}>
          <span>{data.total} produit{data.total > 1 ? 's' : ''} · page {data.page} / {data.pages}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ ...bouton(C.textLight), opacity: page <= 1 ? 0.4 : 1 }}>← Précédent</button>
            <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} style={{ ...bouton(C.textLight), opacity: page >= data.pages ? 0.4 : 1 }}>Suivant →</button>
          </div>
        </div>
      )}

      {edition && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 560, width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 2px' }}>✏️ Modifier le produit</h3>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: C.textLight }}>Boutique : {edition.boutique || '—'}</p>
            {edition.en_enchere && <div style={{ background: '#FEF3C7', color: '#92400E', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12 }}>🔨 Ce produit est en enchère : le stock est verrouillé jusqu'à la fin.</div>}
            <label style={{ fontSize: 12, fontWeight: 700 }}>Titre</label>
            <input value={form.titre} onChange={set('titre')} style={{ ...champ, marginBottom: 10 }} />
            <label style={{ fontSize: 12, fontWeight: 700 }}>Description</label>
            <textarea value={form.description} onChange={set('description')} rows={5} style={{ ...champ, marginBottom: 10, resize: 'vertical' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div><label style={{ fontSize: 12, fontWeight: 700 }}>Prix ($)</label><input value={form.prix} onChange={set('prix')} inputMode="decimal" style={champ} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 700 }}>Prix promo ($)</label><input value={form.prix_promo} onChange={set('prix_promo')} inputMode="decimal" placeholder="Aucun" style={champ} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 700 }}>Stock (vide = illimité)</label><input value={form.stock} onChange={set('stock')} inputMode="numeric" disabled={edition.en_enchere} style={champ} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 700 }}>SKU</label><input value={form.sku} onChange={set('sku')} style={champ} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div><label style={{ fontSize: 12, fontWeight: 700 }}>Catégorie</label>
                <select value={form.categorie_id} onChange={set('categorie_id')} style={champ}><option value="">—</option>{categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
              <div><label style={{ fontSize: 12, fontWeight: 700 }}>Statut</label>
                <select value={form.statut} onChange={set('statut')} style={champ}>{form.statut === 'en_attente' && <option value="en_attente">À approuver</option>}<option value="actif">Actif (approuvé)</option><option value="brouillon">Brouillon</option></select></div>
            </div>
            {errForm && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{errForm}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEdition(null)} style={{ flex: 1, padding: 10, border: `1px solid ${C.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              <button disabled={occupe} onClick={sauver} style={{ flex: 1, padding: 10, border: 'none', background: C.accent, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioMVProduits;