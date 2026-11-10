// CHEMIN : src/pages/collaborateur/CollaborateurProduits.tsx
// e-Vend Studio — Dashboard collaborateur : liste de mes annonces (produits)
// Adapté de ListeProduits.tsx (e-Vend). API : /api/collab/:gestionnaireId/produits

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { formaterPrix } from '../../templates/shared/devise';

interface Produit {
  id: number; titre: string; prix: string; prix_promo: string | null; stock: number | null;
  sku: string | null; categorie: string | null; photo_principale: string | null;
  statut: 'actif' | 'brouillon' | 'en_attente'; created_at: string;
  source?: 'studio' | 'ebay' | 'etsy';
  expire?: boolean; date_expiration?: string | null;   // date d'expiration (arrêt de publication)
}
interface Reponse {
  produits: Produit[]; total: number; page: number; pages: number;
  stats: { total: number; actifs: number; brouillons: number; en_attente?: number; ruptures: number };
}
interface EnchereCollab {
  id: number; produit_id: number; statut: string; prix_depart: number; mise_actuelle: number | null; nb_mises: number; date_fin: string;
}
interface Props {
  gestionnaireId: number; accent: string; isMobile: boolean;
  onCreer: () => void; onModifier: (id: number) => void;
  onOffre?: (id: number) => void;   // « 🔥 Offre du jour » : ouvre la page des offres sur ce produit
}

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626', success: '#16a34a', bg: '#f4f6f8' };
const SOURCES: Record<string, { nom: string; color: string; bg: string }> = {
  studio: { nom: 'Studio', color: '#0f766e', bg: '#e6f6f4' },
  ebay: { nom: 'eBay', color: '#0064d2', bg: '#e5f0ff' },
  etsy: { nom: 'Etsy', color: '#d5641c', bg: '#fef0e5' },
};
const pastilleSource = (src?: string) => {
  const c = SOURCES[src || 'studio'] || SOURCES.studio;
  return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, color: c.color, background: c.bg, whiteSpace: 'nowrap' }}>{c.nom}</span>;
};
const argent = (v: string | number | null) => (v === null || v === undefined ? '—' : formaterPrix(v));

export default function CollaborateurProduits({ gestionnaireId, accent, isMobile, onCreer, onModifier, onOffre }: Props) {
  const base = `/api/collab/${gestionnaireId}`;
  const [data, setData] = useState<Reponse | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [qEff, setQEff] = useState('');
  const [statut, setStatut] = useState('');
  const [rupture, setRupture] = useState(false);
  const [source, setSource] = useState('');
  const [choisis, setChoisis] = useState<number[]>([]);
  const [aSupprimer, setASupprimer] = useState<number[] | null>(null);
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [chargement, setChargement] = useState(true);
  // ── Enchères ──
  const [encheres, setEncheres] = useState<Record<number, EnchereCollab>>({});
  const [modalEnchere, setModalEnchere] = useState<Produit | null>(null);
  const [addonEncheres, setAddonEncheres] = useState(false);
  const [addonOffres, setAddonOffres] = useState(false);   // add-on « Offres du jour »
  const [menu, setMenu] = useState<{ p: Produit; x: number; y: number; haut: number } | null>(null);   // menu ⋮ d'une ligne
  useEffect(() => {
    fetch(`/api/studio-forfaits/public/${gestionnaireId}/addons`).then(r => r.json()).then(d => { setAddonEncheres(!!d.encheres); setAddonOffres(!!d.offres_du_jour); }).catch(() => { setAddonEncheres(false); setAddonOffres(false); });
  }, [gestionnaireId]);
  useEffect(() => {
    if (!menu) return;
    const fermer = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); };
    const defiler = () => { if (!isMobile) setMenu(null); };
    window.addEventListener('keydown', fermer); window.addEventListener('scroll', defiler, true); window.addEventListener('resize', defiler);
    return () => { window.removeEventListener('keydown', fermer); window.removeEventListener('scroll', defiler, true); window.removeEventListener('resize', defiler); };
  }, [menu, isMobile]);
  const [fDepart, setFDepart] = useState('');
  const [fReserve, setFReserve] = useState('');
  const [fDuree, setFDuree] = useState('24');
  const [errEnchere, setErrEnchere] = useState('');
  const [infoEnchere, setInfoEnchere] = useState('');
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  const charger = useCallback(async () => {
    const p = new URLSearchParams({ page: String(page) });
    if (qEff) p.set('q', qEff);
    if (statut) p.set('statut', statut);
    if (rupture) p.set('stock', 'rupture');
    if (source) p.set('source', source);
    try {
      const res = await fetch(`${base}/produits?${p}`, { credentials: 'include' });
      if (res.ok) { setData(await res.json()); setErreur(''); }
      else setErreur((await res.json().catch(() => ({}))).error || 'Chargement impossible');
    } catch { setErreur('Erreur réseau'); }
    setChargement(false);
  }, [base, page, qEff, statut, rupture, source]);

  useEffect(() => { charger(); }, [charger]);

  // L'API des enchères utilise le jeton de connexion de la boutique (cookie, avec repli sur le stockage local)
  const baseEnc = `/api/marketplace/${gestionnaireId}/encheres`;
  const enteteEnc = (json: boolean): Record<string, string> => {
    const h: Record<string, string> = {};
    if (json) h['Content-Type'] = 'application/json';
    try { const t = localStorage.getItem(`mv_token_${gestionnaireId}`); if (t) h.Authorization = `Bearer ${t}`; } catch { /* stockage indisponible */ }
    return h;
  };
  const chargerEncheres = useCallback(async () => {
    try {
      const res = await fetch(`${baseEnc}/collaborateur/mes`, { credentials: 'include', headers: enteteEnc(false) });
      if (!res.ok) return;
      const d = await res.json();
      const m: Record<number, EnchereCollab> = {};
      for (const e of (d.encheres || []) as EnchereCollab[]) if (e.statut === 'active' || e.statut === 'attente_paiement') m[e.produit_id] = e;
      setEncheres(m);
    } catch { /* l'affichage des enchères est secondaire */ }
  }, [baseEnc]);
  useEffect(() => { chargerEncheres(); }, [chargerEncheres]);

  const ouvrirEnchere = (p: Produit) => {
    setModalEnchere(p); setFDepart(String(Number(p.prix_promo || p.prix) || '')); setFReserve(''); setFDuree('24'); setErrEnchere('');
  };
  const lancerEnchere = async () => {
    if (!modalEnchere) return;
    const depart = parseFloat(fDepart.replace(',', '.'));
    const duree = parseFloat(fDuree.replace(',', '.'));
    const reserve = fReserve.trim() ? parseFloat(fReserve.replace(',', '.')) : undefined;
    if (!(depart > 0)) { setErrEnchere('Entrez un prix de départ valide.'); return; }
    if (!(duree > 0)) { setErrEnchere('Entrez une durée valide (en heures).'); return; }
    if (reserve !== undefined && !(reserve >= depart)) { setErrEnchere('Le prix de réserve doit être égal ou supérieur au prix de départ.'); return; }
    setOccupe(true); setErrEnchere('');
    try {
      const res = await fetch(baseEnc, {
        method: 'POST', credentials: 'include', headers: enteteEnc(true),
        body: JSON.stringify({ produit_id: modalEnchere.id, prix_depart: depart, prix_reserve: reserve, duree_heures: duree }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErrEnchere(d.error || 'Impossible de créer l\'enchère.'); }
      else { setModalEnchere(null); setInfoEnchere('🔨 Enchère lancée ! Une unité est réservée pour l\'enchère.'); setTimeout(() => setInfoEnchere(''), 6000); await Promise.all([charger(), chargerEncheres()]); }
    } catch { setErrEnchere('Erreur réseau'); }
    setOccupe(false);
  };
  const annulerEnchere = async (e: EnchereCollab) => {
    setOccupe(true);
    try {
      const res = await fetch(`${baseEnc}/${e.id}/annuler`, { method: 'POST', credentials: 'include', headers: enteteEnc(false) });
      if (!res.ok) setErreur((await res.json().catch(() => ({}))).error || 'Annulation impossible');
      else setErreur('');
      await Promise.all([charger(), chargerEncheres()]);
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };

  const changerRecherche = (v: string) => {
    setQ(v);
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(() => { setPage(1); setQEff(v.trim()); }, 350);
  };

  const action = async (url: string, methode: string, corps?: unknown) => {
    setOccupe(true);
    try {
      const res = await fetch(`${base}${url}`, {
        method: methode, credentials: 'include',
        headers: corps ? { 'Content-Type': 'application/json' } : undefined,
        body: corps ? JSON.stringify(corps) : undefined,
      });
      if (!res.ok) setErreur((await res.json().catch(() => ({}))).error || 'Action impossible');
      else setErreur('');
      await charger();
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };

  const confirmerSuppression = async () => {
    if (!aSupprimer) return;
    if (aSupprimer.length === 1) await action(`/produits/${aSupprimer[0]}`, 'DELETE');
    else await action('/produits/bulk/supprimer', 'POST', { ids: aSupprimer });
    setChoisis(c => c.filter(id => !aSupprimer.includes(id)));
    setASupprimer(null);
  };

  const basculer = (id: number) => setChoisis(c => (c.includes(id) ? c.filter(x => x !== id) : [...c, id]));
  const lignes0 = data?.produits.length || 0;
  const tous = !!data && data.produits.length > 0 && data.produits.every(p => choisis.includes(p.id));
  const bouton = (couleur: string): React.CSSProperties => ({ background: 'none', border: `1px solid ${couleur}`, color: couleur, borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer' });
  const badge = (s: string): React.CSSProperties => ({ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: s === 'actif' ? '#E9F7EF' : '#FEF9E7', color: s === 'actif' ? '#1E8449' : '#B7950B' });

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>;

  const lignes = data?.produits || [];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: T.text }}>📦 Mes annonces</h2>
        <button onClick={onCreer} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          ➕ Nouvelle annonce
        </button>
      </div>

      {/* Compteurs */}
      <div style={isMobile
        ? { display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }
        : { display: 'grid', gridTemplateColumns: `repeat(${(data?.stats.en_attente ?? 0) > 0 ? 5 : 4}, 1fr)`, gap: 10, marginBottom: 16 }}>
        {[
          { l: 'Total', v: data?.stats.total ?? 0, f: () => { setStatut(''); setRupture(false); setPage(1); } },
          { l: 'Actives', v: data?.stats.actifs ?? 0, f: () => { setStatut('actif'); setRupture(false); setPage(1); } },
          { l: 'Brouillons', v: data?.stats.brouillons ?? 0, f: () => { setStatut('brouillon'); setRupture(false); setPage(1); } },
          ...((data?.stats.en_attente ?? 0) > 0 ? [{ l: 'En attente', v: data?.stats.en_attente ?? 0, f: () => { setStatut('en_attente'); setRupture(false); setPage(1); } }] : []),
          { l: 'En rupture', v: data?.stats.ruptures ?? 0, f: () => { setStatut(''); setRupture(true); setPage(1); } },
        ].map(c => (
          isMobile ? (
            <button key={c.l} onClick={c.f} style={{ flexShrink: 0, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 20, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: T.text, whiteSpace: 'nowrap' }}>
              {c.l} <span style={{ color: accent }}>{c.v}</span>
            </button>
          ) : (
          <button key={c.l} onClick={c.f} style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px', textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{c.v}</div>
            <div style={{ fontSize: 11, color: T.light, textTransform: 'uppercase', fontWeight: 700 }}>{c.l}</div>
          </button>
          )
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ flex: isMobile ? '1 1 100%' : 1, minWidth: isMobile ? 0 : 180, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: '0 12px' }}>
          <span style={{ fontSize: 14, opacity: 0.6 }}>🔍</span>
          <input value={q} onChange={e => changerRecherche(e.target.value)} placeholder="Rechercher par titre ou SKU…" maxLength={80}
            style={{ flex: 1, minWidth: 0, border: 'none', padding: '10px 0', fontSize: 16, outline: 'none', background: 'transparent' }} />
        </div>
        {isMobile && lignes0 > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.light, fontWeight: 600 }}>
            <input type="checkbox" checked={tous} onChange={() => setChoisis(tous ? [] : (data?.produits || []).map(p => p.id))} style={{ width: 18, height: 18 }} /> Tout
          </label>
        )}
        <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1); }}
          style={{ flex: isMobile ? 1 : undefined, minWidth: 0, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', fontSize: isMobile ? 14 : 13 }}>
          <option value="">Tous les statuts</option>
          <option value="actif">Actives</option>
          <option value="brouillon">Brouillons</option>
          <option value="en_attente">En attente d'approbation</option>
        </select>
        <select value={source} onChange={e => { setSource(e.target.value); setPage(1); }}
          style={{ flex: isMobile ? 1 : undefined, minWidth: 0, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', fontSize: isMobile ? 14 : 13 }}>
          <option value="">Toutes les sources</option>
          <option value="studio">Studio</option>
          <option value="ebay">eBay</option>
          <option value="etsy">Etsy</option>
        </select>
        {rupture && <button onClick={() => { setRupture(false); setPage(1); }} style={bouton(accent)}>En rupture ✕</button>}
        {choisis.length > 0 && (
          <button onClick={() => setASupprimer(choisis)} style={{ ...bouton(T.danger), padding: '9px 14px', fontSize: 12 }}>🗑️ Supprimer ({choisis.length})</button>
        )}
      </div>

      {erreur && <div style={{ background: '#FDECEA', color: '#C0392B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erreur}</div>}

      {lignes.length === 0 ? (
        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 50, textAlign: 'center', color: T.light }}>
          <div style={{ fontSize: 42 }}>📦</div>
          <p style={{ fontWeight: 700, color: T.text }}>{data?.stats.total ? 'Aucune annonce ne correspond à vos filtres' : 'Vous n\'avez pas encore d\'annonce'}</p>
          {!data?.stats.total && <button onClick={onCreer} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>Créer ma première annonce</button>}
        </div>
      ) : (
        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {!isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: '36px 56px 1fr 90px 110px 80px 100px 250px', gap: 10, padding: '10px 14px', background: '#f8fafc', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase', alignItems: 'center' }}>
              <input type="checkbox" checked={tous} onChange={() => setChoisis(tous ? [] : lignes.map(p => p.id))} />
              <span></span><span>Annonce</span><span>Source</span><span>Prix</span><span>Stock</span><span>Statut</span><span>Actions</span>
            </div>
          )}
          {isMobile && lignes.map(p => {
            const enc = encheres[p.id];
            const bs = p.statut === 'en_attente' ? { ...badge('x'), background: '#FFF3E0', color: '#C2570C' } : p.statut === 'actif' && p.expire ? { ...badge('x'), background: '#FEE2E2', color: '#B91C1C' } : badge(p.statut);
            return (
              <div key={p.id} style={{ padding: '12px 12px', borderBottom: `1px solid ${T.border}`, background: choisis.includes(p.id) ? '#f8fafc' : '#fff' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <input type="checkbox" checked={choisis.includes(p.id)} onChange={() => basculer(p.id)} style={{ width: 18, height: 18, marginTop: 4, flexShrink: 0 }} />
                  <div onClick={() => onModifier(p.id)} style={{ width: 56, height: 56, borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    {p.photo_principale ? <img src={p.photo_principale} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20 }}>📦</span>}
                  </div>
                  <div onClick={() => onModifier(p.id)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.titre}</div>
                    <div style={{ fontSize: 11, color: T.light, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[p.sku && `SKU ${p.sku}`, p.categorie].filter(Boolean).join(' · ') || '—'}</div>
                  </div>
                  <button disabled={occupe} aria-label="Actions"
                    onClick={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenu({ p, x: r.right, y: r.bottom, haut: r.top }); }}
                    style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, width: 38, height: 36, fontSize: 20, fontWeight: 800, lineHeight: 1, color: T.text, cursor: 'pointer', flexShrink: 0 }}>⋮</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 8, paddingLeft: 28 }}>
                  <span style={{ fontSize: 14 }}>
                    {p.prix_promo ? (<><strong style={{ color: T.danger }}>{argent(p.prix_promo)}</strong> <s style={{ color: T.light, fontSize: 11 }}>{argent(p.prix)}</s></>) : <strong>{argent(p.prix)}</strong>}
                  </span>
                  <span style={{ fontSize: 12, color: p.stock === 0 ? T.danger : T.light, fontWeight: p.stock === 0 ? 700 : 500 }}>
                    · {p.stock === null ? 'Stock ∞' : p.stock === 0 ? 'Rupture' : `Stock ${p.stock}`}
                  </span>
                  {pastilleSource(p.source)}
                  <span style={{ ...bs, marginLeft: 'auto' }}>{p.statut === 'actif' ? (p.expire ? '⏹️ Expirée' : 'Active') : p.statut === 'en_attente' ? '⏳ En attente' : 'Brouillon'}</span>
                </div>
                {(enc && !(enc.statut === 'active' && enc.nb_mises === 0)) && (
                  <div style={{ marginTop: 6, paddingLeft: 28 }}><span style={{ ...badge('actif'), background: '#FEF3C7', color: '#92400E' }}>🔨 {enc.statut === 'active' ? `${enc.nb_mises} mise${enc.nb_mises > 1 ? 's' : ''}` : 'À payer'}</span></div>
                )}
                {p.statut === 'actif' && p.date_expiration && !p.expire && <div style={{ fontSize: 11, color: '#92400E', marginTop: 4, paddingLeft: 28 }}>⏹️ expire le {new Date(p.date_expiration).toLocaleString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>}
              </div>
            );
          })}
          {!isMobile && lignes.map(p => (
            <div key={p.id} style={isMobile
              ? { padding: 14, borderBottom: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 8 }
              : { display: 'grid', gridTemplateColumns: '36px 56px 1fr 90px 110px 80px 100px 250px', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${T.border}`, alignItems: 'center' }}>
              {!isMobile && <input type="checkbox" checked={choisis.includes(p.id)} onChange={() => basculer(p.id)} />}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                <div onClick={() => onModifier(p.id)} title="Modifier cette annonce" style={{ cursor: 'pointer', width: 48, height: 48, borderRadius: 8, background: T.bg, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.photo_principale ? <img src={p.photo_principale} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20 }}>🖼️</span>}
                </div>
                {isMobile && <strong style={{ fontSize: 14, color: T.text }}>{p.titre}</strong>}
              </div>
              {!isMobile && (
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titre}</div>
                  <div style={{ fontSize: 11, color: T.light }}>{[p.sku && `SKU ${p.sku}`, p.categorie].filter(Boolean).join(' · ') || '—'}</div>
                </div>
              )}
              <div>{pastilleSource(p.source)}</div>
              <div style={{ fontSize: 13 }}>
                {p.prix_promo ? (<><strong style={{ color: T.danger }}>{argent(p.prix_promo)}</strong> <s style={{ color: T.light, fontSize: 11 }}>{argent(p.prix)}</s></>) : <strong>{argent(p.prix)}</strong>}
              </div>
              <div style={{ fontSize: 13, color: p.stock === 0 ? T.danger : T.text, fontWeight: p.stock === 0 ? 700 : 400 }}>
                {p.stock === null ? '∞' : p.stock === 0 ? 'Rupture' : p.stock}
              </div>
              <div><span style={p.statut === 'en_attente' ? { ...badge('x'), background: '#FFF3E0', color: '#C2570C' } : p.statut === 'actif' && p.expire ? { ...badge('x'), background: '#FEE2E2', color: '#B91C1C' } : badge(p.statut)} title={p.statut === 'en_attente' ? 'Le gestionnaire doit approuver cette annonce avant sa publication' : undefined}>{p.statut === 'actif' ? (p.expire ? '⏹️ Expirée' : 'Active') : p.statut === 'en_attente' ? '⏳ En attente' : 'Brouillon'}</span>
                {p.statut === 'actif' && p.date_expiration && !p.expire && <div style={{ fontSize: 11, color: '#92400E', marginTop: 3 }}>⏹️ expire le {new Date(p.date_expiration).toLocaleString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                {encheres[p.id] && !(encheres[p.id].statut === 'active' && encheres[p.id].nb_mises === 0) && (
                  <span style={{ ...badge('actif'), background: '#FEF3C7', color: '#92400E' }}>
                    🔨 {encheres[p.id].statut === 'active' ? `${encheres[p.id].nb_mises} mise${encheres[p.id].nb_mises > 1 ? 's' : ''}` : 'À payer'}
                  </span>
                )}
                <button disabled={occupe} aria-label="Actions" title="Actions"
                  onClick={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenu({ p, x: r.right, y: r.bottom, haut: r.top }); }}
                  style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, width: 36, height: 32, fontSize: 18, fontWeight: 800, lineHeight: 1, color: T.text, cursor: 'pointer' }}>⋮</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Menu ⋮ d'une ligne : toutes les actions du produit */}
      {menu && (() => {
        const p = menu.p, e = encheres[p.id];
        const item = (label: string, onClick: () => void, couleur?: string) => (
          <button key={label} className="cp-mi" disabled={occupe} onClick={() => { setMenu(null); onClick(); }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: isMobile ? '13px 18px' : '10px 16px', background: 'none', border: 'none', fontSize: isMobile ? 15 : 13, fontWeight: 600, color: couleur || T.text, cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>
        );
        const sep = (k: string) => <div key={k} style={{ height: 1, background: T.border, margin: '4px 0' }} />;
        const entrees: React.ReactNode[] = [
          item('✏️ Modifier', () => onModifier(p.id)),
          item(p.statut === 'actif' ? '⏸ Retirer de la vente' : p.statut === 'en_attente' ? '↩ Annuler la demande' : '▶ Publier', () => action(`/produits/${p.id}/statut`, 'PATCH', { statut: p.statut === 'brouillon' ? 'actif' : 'brouillon' })),
        ];
        const extras: React.ReactNode[] = [];
        if (e) { if (e.statut === 'active' && e.nb_mises === 0) extras.push(item("🔨 Annuler l'enchère", () => annulerEnchere(e), '#b45309')); }
        else if (addonEncheres && p.statut === 'actif' && (p.stock === null || p.stock > 0)) extras.push(item('🔨 Mettre aux enchères', () => ouvrirEnchere(p), '#b45309'));
        if (addonOffres && onOffre && p.statut === 'actif' && !e) extras.push(item('🔥 Offre du jour', () => onOffre(p.id), '#c2410c'));
        const hauteur = 44 * (entrees.length + extras.length + 2) + 20;
        const enHaut = menu.y + hauteur > window.innerHeight && menu.haut > hauteur;   // pas la place en bas : on ouvre vers le haut
        return (
          <>
            <style>{`.cp-mi:hover:not(:disabled){background:#f3f4f6}`}</style>
            {!isMobile && <div onClick={() => setMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 2999 }} />}
            {isMobile && <div onClick={() => setMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 2999, background: 'rgba(0,0,0,0.35)' }} />}
            <div role="menu" style={isMobile
              ? { position: 'fixed', zIndex: 3000, left: 0, right: 0, bottom: 0, maxHeight: '80vh', overflowY: 'auto', background: '#fff', borderRadius: '16px 16px 0 0', boxShadow: '0 -8px 30px rgba(0,0,0,0.2)', padding: '8px 0 18px' }
              : { position: 'fixed', zIndex: 3000, right: Math.max(8, window.innerWidth - menu.x), top: enHaut ? undefined : menu.y + 4, bottom: enHaut ? window.innerHeight - menu.haut + 4 : undefined,
              minWidth: 220, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.16)', padding: '6px 0' }}>
              {isMobile && <div style={{ padding: '6px 16px 8px', fontSize: 12, fontWeight: 700, color: T.light, borderBottom: `1px solid ${T.border}`, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titre}</div>}
              {entrees}{extras}{sep('s1')}
              {item('⧉ Dupliquer', () => action(`/produits/${p.id}/dupliquer`, 'POST'))}
              {item('🗑️ Supprimer', () => setASupprimer([p.id]), T.danger)}
            </div>
          </>
        );
      })()}

      {/* Pagination */}
      {data && data.total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 13, color: T.light, flexWrap: 'wrap', gap: 8 }}>
          <span>{data.total} annonce{data.total > 1 ? 's' : ''} · page {data.page} / {data.pages}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ ...bouton(T.light), padding: '7px 14px', opacity: page <= 1 ? 0.4 : 1 }}>← Précédent</button>
            <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} style={{ ...bouton(T.light), padding: '7px 14px', opacity: page >= data.pages ? 0.4 : 1 }}>Suivant →</button>
          </div>
        </div>
      )}

      {infoEnchere && <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#1a2332', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, zIndex: 1100 }}>{infoEnchere}</div>}

      {/* Mise aux enchères */}
      {modalEnchere && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 420, width: '100%' }}>
            <h3 style={{ margin: '0 0 4px', color: T.text }}>🔨 Mettre aux enchères</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: T.light }}>{modalEnchere.titre}</p>
            {[
              { l: 'Prix de départ ($)', v: fDepart, f: setFDepart, ph: '' },
              { l: 'Prix de réserve ($) — facultatif', v: fReserve, f: setFReserve, ph: 'Sous ce prix, vous n\'êtes pas obligé de vendre' },
              { l: 'Durée (heures)', v: fDuree, f: setFDuree, ph: '24' },
            ].map(c => (
              <div key={c.l} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>{c.l}</label>
                <input value={c.v} onChange={e => c.f(e.target.value)} placeholder={c.ph} inputMode="decimal"
                  style={{ width: '100%', padding: '9px 11px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            ))}
            <p style={{ fontSize: 12, color: T.light, margin: '0 0 12px', lineHeight: 1.5 }}>
              Une unité est mise de côté pendant l'enchère. Le prix de réserve n'est jamais affiché aux acheteurs. Une mise dans les 2 dernières minutes prolonge l'enchère.
              Vous pourrez annuler tant qu'il n'y a aucune mise.
            </p>
            {errEnchere && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{errEnchere}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalEnchere(null)} style={{ flex: 1, padding: 10, border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              <button disabled={occupe} onClick={lancerEnchere} style={{ flex: 1, padding: 10, border: 'none', background: accent, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Lancer l'enchère</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation de suppression */}
      {aSupprimer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 26, maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 38 }}>🗑️</div>
            <h3 style={{ margin: '8px 0', color: T.text }}>Supprimer {aSupprimer.length > 1 ? `${aSupprimer.length} annonces` : 'cette annonce'} ?</h3>
            <p style={{ color: T.light, fontSize: 13, margin: '0 0 18px' }}>Cette action est définitive.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setASupprimer(null)} style={{ flex: 1, padding: 10, border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              <button disabled={occupe} onClick={confirmerSuppression} style={{ flex: 1, padding: 10, border: 'none', background: T.danger, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}