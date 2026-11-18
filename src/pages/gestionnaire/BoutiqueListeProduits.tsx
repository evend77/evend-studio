// CHEMIN : src/pages/gestionnaire/BoutiqueListeProduits.tsx
// e-Vend Studio — Liste des produits des templates boutique (solo). Le gestionnaire est son propre vendeur.
// Reprise de la liste « Mes annonces » du collaborateur MV (CollaborateurProduits) : compteurs, filtres, sources, menu ⋮, pagination numérotée.
// API : /api/boutique/gestionnaire/produits (seulement SES annonces ; jamais celles des collaborateurs du MV).

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { bq, messageErreur, formaterArgent } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

interface Produit {
  id: number; titre: string; prix: string; prix_promo: string | null; stock: number | null;
  sku: string | null; categorie: string | null; photo_principale: string | null;
  statut: 'actif' | 'brouillon'; source?: 'studio' | 'ebay' | 'etsy' | 'evend';
}
interface EnchereVivante { id: number; produit_id: number; statut: string; nb_mises: number; mise_actuelle: number | null; }
interface ReglEnch { duree_min_h: number; duree_max_jours: number; reserve_permise: boolean; increment_min: number; }
interface Stats { total: number; actifs: number; brouillons: number; ruptures: number; }

interface Props {
  gestionnaireId: number;
  accent?: string;
  isMobile?: boolean;
  pagePlan?: string;
  offresActif?: boolean;   // add-on « Offres du jour » activé : le menu ⋮ propose « 🔥 Offre du jour »
  encheresActif?: boolean; // add-on « Enchères » activé : le menu ⋮ propose « 🔨 Mettre aux enchères »
  naviguerVers: (page: string) => void;
}

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626', success: '#16a34a', bg: '#f4f6f8' };
const SOURCES: Record<string, { nom: string; color: string; bg: string }> = {
  studio: { nom: 'Studio', color: '#0f766e', bg: '#e6f6f4' },
  ebay: { nom: 'eBay', color: '#0064d2', bg: '#e5f0ff' },
  etsy: { nom: 'Etsy', color: '#d5641c', bg: '#fef0e5' },
  evend: { nom: 'e-Vend', color: '#6d28d9', bg: '#efe8fd' },
};
const pastilleSource = (src?: string) => {
  const c = SOURCES[src || 'studio'] || SOURCES.studio;
  return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, color: c.color, background: c.bg, whiteSpace: 'nowrap' }}>{c.nom}</span>;
};
function useLarge(max: number) {
  const [petit, setPetit] = useState(typeof window !== 'undefined' && window.innerWidth <= max);
  useEffect(() => { const f = () => setPetit(window.innerWidth <= max); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, [max]);
  return petit;
}
// Pagination numérotée (version compacte ≤ 480 px)
function Pagination({ page, totalPages, onPageChange, accent, marginTop = 16 }: { page: number; totalPages: number; onPageChange: (p: number) => void; accent: string; marginTop?: number }) {
  const compact = useLarge(480);
  if (totalPages <= 1) return null;
  const pages: (number | '...')[] = [];
  if (compact) {
    if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (page > 2) pages.push('...');
      if (page > 1 && page < totalPages) pages.push(page);
      if (page < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
  } else if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }
  const btn = (active: boolean, disabled = false): React.CSSProperties => ({
    padding: compact ? '6px 8px' : '6px 12px', borderRadius: 6, border: `1px solid ${active ? accent : T.border}`,
    background: active ? accent : '#fff', color: active ? '#fff' : disabled ? T.light : T.text, fontWeight: active ? 700 : 500, fontSize: 13,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, minWidth: compact ? 34 : 36, textAlign: 'center',
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: compact ? 4 : 6, marginTop, flexWrap: 'wrap' }}>
      <button style={btn(false, page === 1)} onClick={() => page > 1 && onPageChange(page - 1)} disabled={page === 1} aria-label="Page précédente">{compact ? '←' : '← Préc.'}</button>
      {pages.map((n, i) => n === '...'
        ? <span key={`e${i}`} style={{ padding: '0 4px', color: T.light }}>…</span>
        : <button key={n} style={btn(n === page)} onClick={() => onPageChange(n)}>{n}</button>)}
      <button style={btn(false, page === totalPages)} onClick={() => page < totalPages && onPageChange(page + 1)} disabled={page === totalPages} aria-label="Page suivante">{compact ? '→' : 'Suiv. →'}</button>
    </div>
  );
}

export default function BoutiqueListeProduits({ accent, isMobile: mobileProp, pagePlan, offresActif, encheresActif, naviguerVers }: Props) {
  const couleur = accent || '#4f46e5';
  const isMobile = !!mobileProp;
  const [produits, setProduits] = useState<Produit[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, actifs: 0, brouillons: 0, ruptures: 0 });
  const [total, setTotal] = useState(0);
  const [limite, setLimite] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState('');
  const [qEff, setQEff] = useState('');
  const [statut, setStatut] = useState('');
  const [rupture, setRupture] = useState(false);
  const [source, setSource] = useState('');
  const [choisis, setChoisis] = useState<number[]>([]);
  const [toutesIds, setToutesIds] = useState<number[] | null>(null);
  const [chargeIds, setChargeIds] = useState(false);
  const [aSupprimer, setASupprimer] = useState<number[] | null>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState('');
  const [erreurLimite, setErreurLimite] = useState('');
  const [menu, setMenu] = useState<{ p: Produit; x: number; y: number; haut: number } | null>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  // ── Enchères (add-on) : même démarche que le MV — « 🔨 Mettre aux enchères » dans le menu ⋮ de la ligne ──
  const [encheres, setEncheres] = useState<Record<number, EnchereVivante>>({});
  const [reglEnch, setReglEnch] = useState<ReglEnch | null>(null);
  const [modalEnch, setModalEnch] = useState<Produit | null>(null);
  const [fDepart, setFDepart] = useState('');
  const [fReserve, setFReserve] = useState('');
  const [fDuree, setFDuree] = useState('24');
  const [errEnch, setErrEnch] = useState('');
  const [infoEnch, setInfoEnch] = useState('');
  const [aAnnulerEnch, setAAnnulerEnch] = useState<{ p: Produit; e: EnchereVivante } | null>(null);
  const chargerEncheres = useCallback(async () => {
    const [a, b] = await Promise.all([bq('/encheres/mes?statut=active'), bq('/encheres/mes?statut=attente_paiement')]);
    const m: Record<number, EnchereVivante> = {};
    for (const r of [b, a]) if (r.ok) for (const e of (r.data.encheres || []) as EnchereVivante[]) m[e.produit_id] = e;
    if (a.ok || b.ok) setEncheres(m);
    const g = a.ok ? a.data.reglages : b.ok ? b.data.reglages : null;
    if (g) setReglEnch({ duree_min_h: g.duree_min_h, duree_max_jours: g.duree_max_jours, reserve_permise: g.reserve_permise, increment_min: g.increment_min });
  }, []);
  useEffect(() => { chargerEncheres(); }, [chargerEncheres]);
  const ouvrirEnchere = (p: Produit) => { setModalEnch(p); setFDepart(String(Number(p.prix_promo || p.prix) || '')); setFReserve(''); setFDuree('24'); setErrEnch(''); };
  const lancerEnchere = async () => {
    if (!modalEnch) return;
    const depart = parseFloat(fDepart.replace(',', '.'));
    const duree = parseFloat(fDuree.replace(',', '.'));
    const reserve = fReserve.trim() ? parseFloat(fReserve.replace(',', '.')) : undefined;
    if (!(depart > 0)) { setErrEnch('Entrez un prix de départ valide.'); return; }
    if (!(duree > 0)) { setErrEnch('Entrez une durée valide (en heures).'); return; }
    if (reserve !== undefined && !(reserve >= depart)) { setErrEnch('Le prix de réserve doit être égal ou supérieur au prix de départ.'); return; }
    setOccupe(true); setErrEnch('');
    const body: any = { produit_id: modalEnch.id, prix_depart: depart, duree_heures: duree };
    if (reserve !== undefined) body.prix_reserve = reserve;
    const r = await bq('/encheres', { method: 'POST', body });
    setOccupe(false);
    if (!r.ok) { setErrEnch(messageErreur(r)); return; }
    setModalEnch(null); setInfoEnch("🔨 Enchère lancée ! Une unité est réservée pour l'enchère."); setTimeout(() => setInfoEnch(''), 6000);
    charger(); chargerEncheres();
  };
  const annulerEnchere = async () => {
    if (!aAnnulerEnch) return;
    setOccupe(true);
    const r = await bq(`/encheres/${aAnnulerEnch.e.id}/annuler`, { method: 'POST', body: {} });
    setOccupe(false);
    setAAnnulerEnch(null);
    if (!r.ok) { setErreur(messageErreur(r)); return; }
    setInfoEnch("Enchère annulée. L'unité est remise en stock."); setTimeout(() => setInfoEnch(''), 6000);
    charger(); chargerEncheres();
  };
  const pastilleEnchere = (p: Produit) => {
    const e = encheres[p.id];
    if (!e || (e.statut === 'active' && e.nb_mises === 0)) return null;
    return <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: '#FEF3C7', color: '#92400E', marginLeft: 6, whiteSpace: 'nowrap' }}>🔨 {e.statut === 'active' ? `${e.nb_mises} mise${e.nb_mises > 1 ? 's' : ''}` : 'À payer'}</span>;
  };

  const filtres = useCallback(() => {
    const p: string[] = [];
    if (qEff) p.push(`q=${encodeURIComponent(qEff)}`);
    if (statut) p.push(`statut=${statut}`);
    if (rupture) p.push('stock=rupture');
    if (source) p.push(`source=${source}`);
    return p;
  }, [qEff, statut, rupture, source]);

  const charger = useCallback(async () => {
    const r = await bq(`/produits?${['page=' + page, ...filtres()].join('&')}`);
    if (r.ok) {
      setProduits(r.data.produits || []);
      setStats(r.data.stats || { total: 0, actifs: 0, brouillons: 0, ruptures: 0 });
      setTotal(r.data.total || 0);
      setLimite(r.data.limite === undefined ? null : r.data.limite);
      setPages(r.data.pages || 1);
      setErreur('');
    } else setErreur(messageErreur(r));
    setChargement(false);
  }, [page, filtres]);

  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { setChoisis([]); setToutesIds(null); }, [page, qEff, statut, rupture, source]);

  useEffect(() => {
    if (!menu) return;
    const fermer = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); };
    const defiler = () => { if (!isMobile) setMenu(null); };
    window.addEventListener('keydown', fermer); window.addEventListener('scroll', defiler, true); window.addEventListener('resize', defiler);
    return () => { window.removeEventListener('keydown', fermer); window.removeEventListener('scroll', defiler, true); window.removeEventListener('resize', defiler); };
  }, [menu, isMobile]);

  const changerRecherche = (v: string) => {
    setQ(v);
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(() => { setPage(1); setQEff(v.trim()); }, 350);
  };

  const changerStatut = async (p: Produit) => {
    setOccupe(true);
    const r = await bq(`/produits/${p.id}/statut`, { method: 'PATCH', body: { statut: p.statut === 'actif' ? 'brouillon' : 'actif' } });
    setOccupe(false);
    if (r.ok) { charger(); return; }
    if (r.data && r.data.code === 'LIMITE_ANNONCES') setErreurLimite(messageErreur(r)); else setErreur(messageErreur(r));
  };

  const dupliquer = async (p: Produit) => {
    setOccupe(true);
    const r = await bq(`/produits/${p.id}/dupliquer`, { method: 'POST' });
    setOccupe(false);
    if (r.ok && r.data.id) naviguerVers(`modifier-annonce?id=${r.data.id}`); else setErreur(messageErreur(r));
  };

  const supprimer = async () => {
    if (!aSupprimer) return;
    setOccupe(true);
    let ok = true; let derniere: any = null;
    if (aSupprimer.length === 1) { const r = await bq(`/produits/${aSupprimer[0]}`, { method: 'DELETE' }); ok = r.ok; derniere = r; }
    else for (let i = 0; i < aSupprimer.length && ok; i += 100) { const r = await bq('/produits/bulk/supprimer', { method: 'POST', body: { ids: aSupprimer.slice(i, i + 100) } }); ok = r.ok; derniere = r; }
    setOccupe(false);
    setASupprimer(null); setChoisis([]); setToutesIds(null);
    if (!ok && derniere) setErreur(messageErreur(derniere));
    charger();
  };

  const basculer = (id: number) => { setToutesIds(null); setChoisis(c => (c.includes(id) ? c.filter(x => x !== id) : [...c, id])); };
  const toutesLesIds = async () => {
    setChargeIds(true);
    const r = await bq(`/produits-ids?${filtres().join('&')}`);
    if (r.ok) { const l: number[] = r.data.ids || []; setToutesIds(l); setChoisis(l); } else setErreur(messageErreur(r));
    setChargeIds(false);
  };

  const tous = produits.length > 0 && produits.every(p => choisis.includes(p.id));
  const bouton = (c: string): React.CSSProperties => ({ background: 'none', border: `1px solid ${c}`, color: c, borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer' });
  const badge = (s: string): React.CSSProperties => ({ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: s === 'actif' ? '#E9F7EF' : '#FEF9E7', color: s === 'actif' ? '#1E8449' : '#B7950B' });
  const prixCellule = (p: Produit) => (p.prix_promo
    ? <><strong style={{ color: T.danger }}>{formaterArgent(p.prix_promo)}</strong> <s style={{ color: T.light, fontSize: 11 }}>{formaterArgent(p.prix)}</s></>
    : <strong>{formaterArgent(p.prix)}</strong>);
  const colonnes = '36px 56px 1fr 90px 110px 80px 100px 60px';
  const pct = limite ? Math.min(100, Math.round((stats.actifs / limite) * 100)) : 0;
  const champSelect: React.CSSProperties = { flex: isMobile ? 1 : undefined, minWidth: 0, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', fontSize: isMobile ? 14 : 13 };

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: T.text }}>📦 Mes produits</h2>
        <button onClick={() => naviguerVers('annonces-creer')} style={{ background: couleur, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>➕ Ajouter un produit</button>
      </div>

      {limite !== null && (
        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontWeight: 700, color: T.text }}>{stats.actifs} / {limite} annonces actives</span>
            {pagePlan && <button onClick={() => naviguerVers(pagePlan)} style={{ background: 'none', border: 'none', color: couleur, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Mon plan & limites →</button>}
          </div>
          <div style={{ background: '#f3f4f6', borderRadius: 6, height: 8, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e' }} />
          </div>
        </div>
      )}

      {/* Compteurs */}
      <div style={isMobile
        ? { display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }
        : { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { l: 'Total', v: stats.total, f: () => { setStatut(''); setRupture(false); setPage(1); } },
          { l: 'Actifs', v: stats.actifs, f: () => { setStatut('actif'); setRupture(false); setPage(1); } },
          { l: 'Brouillons', v: stats.brouillons, f: () => { setStatut('brouillon'); setRupture(false); setPage(1); } },
          { l: 'En rupture', v: stats.ruptures, f: () => { setStatut(''); setRupture(true); setPage(1); } },
        ].map(c => (isMobile ? (
          <button key={c.l} onClick={c.f} style={{ flexShrink: 0, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 20, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: T.text, whiteSpace: 'nowrap' }}>
            {c.l} <span style={{ color: couleur }}>{c.v}</span>
          </button>
        ) : (
          <button key={c.l} onClick={c.f} style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px', textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{c.v}</div>
            <div style={{ fontSize: 11, color: T.light, textTransform: 'uppercase', fontWeight: 700 }}>{c.l}</div>
          </button>
        )))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ flex: isMobile ? '1 1 100%' : 1, minWidth: isMobile ? 0 : 180, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: '0 12px' }}>
          <span style={{ fontSize: 14, opacity: 0.6 }}>🔍</span>
          <input value={q} onChange={e => changerRecherche(e.target.value)} placeholder="Rechercher par titre ou SKU…" maxLength={80}
            style={{ flex: 1, minWidth: 0, border: 'none', padding: '10px 0', fontSize: 16, outline: 'none', background: 'transparent' }} />
        </div>
        {isMobile && produits.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.light, fontWeight: 600 }}>
            <input type="checkbox" checked={tous} onChange={() => { setToutesIds(null); setChoisis(tous ? [] : produits.map(p => p.id)); }} style={{ width: 18, height: 18 }} /> Tout
          </label>
        )}
        <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1); }} style={champSelect}>
          <option value="">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="brouillon">Brouillons</option>
        </select>
        <select value={source} onChange={e => { setSource(e.target.value); setPage(1); }} style={champSelect}>
          <option value="">Toutes les sources</option>
          <option value="studio">Studio</option>
          <option value="ebay">eBay</option>
          <option value="etsy">Etsy</option>
          <option value="evend">e-Vend</option>
        </select>
        {rupture && <button onClick={() => { setRupture(false); setPage(1); }} style={bouton(couleur)}>En rupture ✕</button>}
        {choisis.length > 0 && (
          <button onClick={() => setASupprimer(choisis)} style={{ ...bouton(T.danger), padding: '9px 14px', fontSize: 12 }}>🗑️ Supprimer ({choisis.length})</button>
        )}
      </div>

      {total > 0 && (
        <>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', minHeight: 34, marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            {choisis.length > 0 && (
              <div style={{ ...(isMobile ? { position: 'static', alignSelf: 'flex-start' } : { position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }), display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, background: '#f5f6ff', border: `1px solid ${couleur}`, color: couleur, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                ✓ {choisis.length} {choisis.length > 1 ? 'produits sélectionnés' : 'produit sélectionné'}
              </div>
            )}
            <Pagination page={page} totalPages={pages} onPageChange={setPage} accent={couleur} marginTop={0} />
          </div>
          {tous && total > produits.length && (
            <div style={{ background: '#f5f6ff', border: `1px solid ${couleur}`, borderRadius: 8, padding: '8px 14px', marginBottom: 10, fontSize: 13, color: T.text, textAlign: 'center' }}>
              {toutesIds && toutesIds.length >= total
                ? <>Les <strong>{toutesIds.length}</strong> produits sont sélectionnés. <button onClick={() => { setToutesIds(null); setChoisis([]); }} style={{ background: 'none', border: 'none', color: couleur, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Tout désélectionner</button></>
                : <>Les {produits.length} produits de cette page sont sélectionnés. <button disabled={chargeIds} onClick={toutesLesIds} style={{ background: 'none', border: 'none', color: couleur, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>{chargeIds ? 'Chargement…' : `Sélectionner les ${total} produits`}</button></>}
            </div>
          )}
        </>
      )}

      {produits.length === 0 ? (
        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 50, textAlign: 'center', color: T.light }}>
          <div style={{ fontSize: 42 }}>📦</div>
          <p style={{ fontWeight: 700, color: T.text }}>{stats.total ? 'Aucun produit ne correspond à vos filtres' : 'Vous n’avez pas encore de produit'}</p>
          {!stats.total && <button onClick={() => naviguerVers('annonces-creer')} style={{ background: couleur, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>Ajouter mon premier produit</button>}
        </div>
      ) : (
        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {!isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: colonnes, gap: 10, padding: '10px 14px', background: '#f8fafc', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase', alignItems: 'center' }}>
              <input type="checkbox" checked={tous} onChange={() => { setToutesIds(null); setChoisis(tous ? [] : produits.map(p => p.id)); }} />
              <span></span><span>Produit</span><span>Source</span><span>Prix</span><span>Stock</span><span>Statut</span><span>Actions</span>
            </div>
          )}
          {isMobile && produits.map(p => (
            <div key={p.id} style={{ padding: '12px 12px', borderBottom: `1px solid ${T.border}`, background: choisis.includes(p.id) ? '#f8fafc' : '#fff' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <input type="checkbox" checked={choisis.includes(p.id)} onChange={() => basculer(p.id)} style={{ width: 18, height: 18, marginTop: 4, flexShrink: 0 }} />
                <div onClick={() => naviguerVers(`modifier-annonce?id=${p.id}`)} style={{ width: 56, height: 56, borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  {p.photo_principale ? <img src={p.photo_principale} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20 }}>📦</span>}
                </div>
                <div onClick={() => naviguerVers(`modifier-annonce?id=${p.id}`)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.titre}</div>
                  <div style={{ fontSize: 11, color: T.light, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[p.sku && `SKU ${p.sku}`, p.categorie].filter(Boolean).join(' · ') || '—'}</div>
                </div>
                <button disabled={occupe} aria-label="Actions"
                  onClick={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenu({ p, x: r.right, y: r.bottom, haut: r.top }); }}
                  style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, width: 38, height: 36, fontSize: 20, fontWeight: 800, lineHeight: 1, color: T.text, cursor: 'pointer', flexShrink: 0 }}>⋮</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 8, paddingLeft: 28 }}>
                <span style={{ fontSize: 14 }}>{prixCellule(p)}</span>
                <span style={{ fontSize: 12, color: p.stock === 0 ? T.danger : T.light, fontWeight: p.stock === 0 ? 700 : 500 }}>
                  · {p.stock === null ? 'Stock ∞' : p.stock === 0 ? 'Rupture' : `Stock ${p.stock}`}
                </span>
                {pastilleSource(p.source)}
                <span style={{ ...badge(p.statut), marginLeft: 'auto' }}>{p.statut === 'actif' ? 'Actif' : 'Brouillon'}</span>{pastilleEnchere(p)}
              </div>
            </div>
          ))}
          {!isMobile && produits.map(p => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: colonnes, gap: 10, padding: '10px 14px', borderBottom: `1px solid ${T.border}`, alignItems: 'center' }}>
              <input type="checkbox" checked={choisis.includes(p.id)} onChange={() => basculer(p.id)} />
              <div onClick={() => naviguerVers(`modifier-annonce?id=${p.id}`)} title="Modifier ce produit" style={{ cursor: 'pointer', width: 48, height: 48, borderRadius: 8, background: T.bg, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {p.photo_principale ? <img src={p.photo_principale} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20 }}>🖼️</span>}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titre}</div>
                <div style={{ fontSize: 11, color: T.light }}>{[p.sku && `SKU ${p.sku}`, p.categorie].filter(Boolean).join(' · ') || '—'}</div>
              </div>
              <div>{pastilleSource(p.source)}</div>
              <div style={{ fontSize: 13 }}>{prixCellule(p)}</div>
              <div style={{ fontSize: 13, color: p.stock === 0 ? T.danger : T.text, fontWeight: p.stock === 0 ? 700 : 400 }}>{p.stock === null ? '∞' : p.stock === 0 ? 'Rupture' : p.stock}</div>
              <div><span style={badge(p.statut)}>{p.statut === 'actif' ? 'Actif' : 'Brouillon'}</span>{pastilleEnchere(p)}</div>
              <div>
                <button disabled={occupe} aria-label="Actions" title="Actions"
                  onClick={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenu({ p, x: r.right, y: r.bottom, haut: r.top }); }}
                  style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, width: 36, height: 32, fontSize: 18, fontWeight: 800, lineHeight: 1, color: T.text, cursor: 'pointer' }}>⋮</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Menu ⋮ d'une ligne */}
      {menu && (() => {
        const p = menu.p;
        const enc = encheres[p.id];
        const item = (label: string, onClick: () => void, c?: string) => (
          <button key={label} className="bq-mi" disabled={occupe} onClick={() => { setMenu(null); onClick(); }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: isMobile ? '13px 18px' : '10px 16px', background: 'none', border: 'none', fontSize: isMobile ? 15 : 13, fontWeight: 600, color: c || T.text, cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>
        );
        const hauteur = 44 * 7 + 20;
        const enHaut = menu.y + hauteur > window.innerHeight && menu.haut > hauteur;
        return (
          <>
            <style>{`.bq-mi:hover:not(:disabled){background:#f3f4f6}`}</style>
            <div onClick={() => setMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 2999, background: isMobile ? 'rgba(0,0,0,0.35)' : 'transparent' }} />
            <div role="menu" style={isMobile
              ? { position: 'fixed', zIndex: 3000, left: 0, right: 0, bottom: 0, maxHeight: '80vh', overflowY: 'auto', background: '#fff', borderRadius: '16px 16px 0 0', boxShadow: '0 -8px 30px rgba(0,0,0,0.2)', padding: '8px 0 18px' }
              : { position: 'fixed', zIndex: 3000, right: Math.max(8, window.innerWidth - menu.x), top: enHaut ? undefined : menu.y + 4, bottom: enHaut ? window.innerHeight - menu.haut + 4 : undefined,
                  minWidth: 220, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.16)', padding: '6px 0' }}>
              {isMobile && <div style={{ padding: '6px 16px 8px', fontSize: 12, fontWeight: 700, color: T.light, borderBottom: `1px solid ${T.border}`, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titre}</div>}
              {item('✏️ Modifier', () => naviguerVers(`modifier-annonce?id=${p.id}`))}
              {item(p.statut === 'actif' ? '⏸ Retirer de la vente' : '▶ Publier', () => changerStatut(p))}
              {enc && enc.statut === 'active' && item("🔨 Annuler l'enchère", () => setAAnnulerEnch({ p, e: enc }), '#b45309')}
              {!enc && encheresActif && p.statut === 'actif' && (p.stock === null || p.stock > 0) && item('🔨 Mettre aux enchères', () => ouvrirEnchere(p), '#b45309')}
              {offresActif && !enc && p.statut === 'actif' && item('🔥 Offre du jour', () => naviguerVers(`annonces-offres?id=${p.id}`), '#c2410c')}
              <div style={{ height: 1, background: T.border, margin: '4px 0' }} />
              {item('⧉ Dupliquer', () => dupliquer(p))}
              {item('🗑️ Supprimer', () => setASupprimer([p.id]), T.danger)}
            </div>
          </>
        );
      })()}

      {total > 0 && (
        <>
          <Pagination page={page} totalPages={pages} onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} accent={couleur} />
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: T.light }}>{total} produit{total > 1 ? 's' : ''} · page {page} / {pages}</div>
        </>
      )}

      {infoEnch && <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#1a2332', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, zIndex: 3100 }}>{infoEnch}</div>}

      {modalEnch && (
        <div onClick={() => !occupe && setModalEnch(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={ev => ev.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 420, width: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 4px', color: T.text }}>🔨 Mettre aux enchères</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: T.light }}>{modalEnch.titre}</p>
            {[
              { l: 'Prix de départ ($)', v: fDepart, f: setFDepart, ph: '', ok: true },
              { l: 'Prix de réserve ($) — facultatif', v: fReserve, f: setFReserve, ph: "Sous ce prix, vous n'êtes pas obligé de vendre", ok: !reglEnch || reglEnch.reserve_permise },
              { l: 'Durée (heures)', v: fDuree, f: setFDuree, ph: '24', ok: true },
            ].filter(c => c.ok).map(c => (
              <div key={c.l} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>{c.l}</label>
                <input value={c.v} onChange={ev => c.f(ev.target.value)} placeholder={c.ph} inputMode="decimal" style={{ width: '100%', padding: '9px 11px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            ))}
            <p style={{ fontSize: 12, color: T.light, margin: '0 0 12px', lineHeight: 1.5 }}>
              Une unité est mise de côté pendant l'enchère. Le prix de réserve n'est jamais affiché aux acheteurs. Une mise dans les 2 dernières minutes prolonge l'enchère.
              {reglEnch ? ` Durée permise : de ${reglEnch.duree_min_h} h à ${reglEnch.duree_max_jours} jour${reglEnch.duree_max_jours > 1 ? 's' : ''}.` : ''} Vous pouvez annuler l'enchère en tout temps.
            </p>
            {errEnch && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{errEnch}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalEnch(null)} disabled={occupe} style={{ flex: 1, padding: 10, border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              <button disabled={occupe} onClick={lancerEnchere} style={{ flex: 1, padding: 10, border: 'none', background: couleur, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>{occupe ? '⏳…' : "Lancer l'enchère"}</button>
            </div>
          </div>
        </div>
      )}
      {aAnnulerEnch && (
        <BoutiqueModale type="confirmer" accent="#b45309" titre="Annuler cette enchère ?" enCours={occupe} texteConfirmer="Annuler l'enchère" texteFermer="Garder"
          message={`« ${aAnnulerEnch.p.titre} » — ${aAnnulerEnch.e.nb_mises > 0 ? `${aAnnulerEnch.e.nb_mises} mise${aAnnulerEnch.e.nb_mises > 1 ? 's seront annulées' : ' sera annulée'}. ` : ''}L'unité est remise en stock. Cette action est définitive.`}
          onConfirmer={annulerEnchere} onFermer={() => { if (!occupe) setAAnnulerEnch(null); }} />
      )}
      {aSupprimer && (
        <BoutiqueModale type="confirmer" accent="#dc2626" titre="Supprimer ?" enCours={occupe} texteConfirmer="Supprimer"
          message={aSupprimer.length === 1 ? 'Ce produit sera supprimé définitivement.' : `Ces ${aSupprimer.length} produits seront supprimés définitivement.`}
          onConfirmer={supprimer} onFermer={() => { if (!occupe) setASupprimer(null); }} />
      )}
      {erreur && <BoutiqueModale type="erreur" message={erreur} onFermer={() => setErreur('')} />}
      {erreurLimite && (
        <BoutiqueModale type="erreur" titre="Limite d'annonces atteinte" message={erreurLimite} accent={couleur} onFermer={() => setErreurLimite('')}
          actionSecondaire={pagePlan ? { texte: 'Voir mon plan', onClick: () => naviguerVers(pagePlan) } : undefined} />
      )}
    </div>
  );
}