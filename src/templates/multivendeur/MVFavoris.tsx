// CHEMIN : src/templates/multivendeur/MVFavoris.tsx
// e-Vend Studio — Template Multi-Vendeur Premium — Add-on « Favoris » (liste de souhaits).
// Contient : l'état partagé (réglages du gestionnaire, liste de l'acheteur ou des invités), le bouton ♥ (page produit et cartes),
// l'icône d'accès (en-tête / bouton flottant) et les notifications. Les réglages viennent de
// GET /api/studio-forfaits/public/:gid/favoris-config ; l'add-on est lu dans GET /api/studio-forfaits/public/:gid/addons.

import React, { useEffect, useState } from 'react';

const API_BASE = '/api';

export interface ConfigFavoris {
  bouton_catalogue_actif: boolean; bouton_catalogue_position: 'haut' | 'bas' | 'superposition'; bouton_catalogue_style: 'moderne' | 'classique' | 'minimaliste';
  bouton_produit_actif: boolean; bouton_produit_position: 'avant_panier' | 'apres_panier';
  elements_par_page: number;
  entete_actif: boolean; entete_compteur: boolean;
  flottant_actif: boolean; flottant_position: 'bas_droite' | 'bas_gauche' | 'haut_droite' | 'haut_gauche';
  icone_style: 'coeur' | 'etoile' | 'signet'; icone_animation: 'aucune' | 'rebond' | 'echelle' | 'fondu';
  icone_taille: number; icone_couleur: string; icone_couleur_active: string;
  notif_actif: boolean; notif_duree: number; notif_placement: 'bas_centre' | 'bas_droite' | 'bas_gauche' | 'haut_centre'; notif_animer: boolean;
  notif_couleur_texte: string; notif_couleur_fond: string; notif_couleur_erreur_texte: string; notif_couleur_erreur_fond: string;
  notif_msg_ajout: string; notif_msg_retrait: string; notif_msg_invite: string;
  invites_actif: boolean; invites_duree_jours: number; invites_max: number;
}

export const DEFAUT_FAVORIS: ConfigFavoris = {
  bouton_catalogue_actif: true, bouton_catalogue_position: 'superposition', bouton_catalogue_style: 'moderne',
  bouton_produit_actif: true, bouton_produit_position: 'avant_panier',
  elements_par_page: 20,
  entete_actif: true, entete_compteur: true,
  flottant_actif: false, flottant_position: 'bas_droite',
  icone_style: 'coeur', icone_animation: 'echelle', icone_taille: 24, icone_couleur: '#9ca3af', icone_couleur_active: '#ef4444',
  notif_actif: true, notif_duree: 3, notif_placement: 'bas_centre', notif_animer: true,
  notif_couleur_texte: '#ffffff', notif_couleur_fond: '#19af66', notif_couleur_erreur_texte: '#ffffff', notif_couleur_erreur_fond: '#f84e40',
  notif_msg_ajout: 'Article ajouté à votre liste de souhaits', notif_msg_retrait: 'Article retiré de votre liste de souhaits',
  notif_msg_invite: "Article ajouté temporairement — connectez-vous pour l'enregistrer",
  invites_actif: true, invites_duree_jours: 30, invites_max: 50,
};

// ─── État partagé par marketplace ────────────────────────────────────────────

interface Etat {
  actif: boolean; config: ConfigFavoris; ids: Set<string>; t: number; typeCharge: string | null;
  toast: { msg: string; ok: boolean; id: number } | null; ecoutes: Set<() => void>; compteurToast: number;
}
const etats = new Map<string, Etat>();
function etatDe(cle: string): Etat {
  let e = etats.get(cle);
  if (!e) { e = { actif: false, config: DEFAUT_FAVORIS, ids: new Set(), t: 0, typeCharge: null, toast: null, ecoutes: new Set(), compteurToast: 0 }; etats.set(cle, e); }
  return e;
}
const notifier = (e: Etat) => e.ecoutes.forEach(f => { try { f(); } catch { /* ignore */ } });

function typeCompte(gid: string): string | null {
  try { return JSON.parse(localStorage.getItem(`mv_compte_${gid}`) || 'null')?.type || null; } catch { return null; }
}

// Liste temporaire d'un visiteur non connecté (navigateur seulement)
const cleInvite = (gid: string) => `mv_souhaits_invite_${gid}`;
function lireInvite(gid: string, c: ConfigFavoris): { id: string; t: number }[] {
  try {
    const l = JSON.parse(localStorage.getItem(cleInvite(gid)) || '[]');
    const limite = Date.now() - c.invites_duree_jours * 86400000;
    return Array.isArray(l) ? l.filter((x: any) => x && x.id !== undefined && Number(x.t) > limite).map((x: any) => ({ id: String(x.id), t: Number(x.t) })) : [];
  } catch { return []; }
}
function ecrireInvite(gid: string, l: { id: string; t: number }[]) {
  try { if (l.length) localStorage.setItem(cleInvite(gid), JSON.stringify(l)); else localStorage.removeItem(cleInvite(gid)); } catch { /* stockage indisponible */ }
}

/** Après connexion : enregistre dans le compte les produits ajoutés en tant qu'invité, puis vide la liste temporaire. */
export async function synchroniserInvite(gestionnaireId: number | string): Promise<void> {
  const gid = String(gestionnaireId);
  if (typeCompte(gid) !== 'acheteur') return;
  let brut: any[] = [];
  try { brut = JSON.parse(localStorage.getItem(cleInvite(gid)) || '[]'); } catch { brut = []; }
  if (!Array.isArray(brut) || !brut.length) return;
  try { localStorage.removeItem(cleInvite(gid)); } catch { /* ignore */ }
  for (const x of brut.slice(0, 200)) {
    const id = parseInt(String(x && x.id), 10);
    if (!Number.isInteger(id) || id <= 0) continue;
    try { await fetch(`${API_BASE}/acheteur/${gid}/wishlist`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ produit_id: id }) }); } catch { /* ignore */ }
  }
}

async function charger(gid: string) {
  const e = etatDe(gid);
  e.t = Date.now();
  const type = typeCompte(gid);
  e.typeCharge = type;
  try {
    const a = await fetch(`${API_BASE}/studio-forfaits/public/${gid}/addons?t=${Date.now()}`, { cache: 'no-cache' }).then(r => (r.ok ? r.json() : {} as any)).catch(() => ({} as any));
    e.actif = !!a.favoris;
    if (!e.actif) { e.ids = new Set(); notifier(e); return; }
    const c = await fetch(`${API_BASE}/studio-forfaits/public/${gid}/favoris-config?t=${Date.now()}`, { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
    e.config = { ...DEFAUT_FAVORIS, ...((c && c.config) || {}) };
    if (type === 'acheteur') {
      await synchroniserInvite(gid);
      const w = await fetch(`${API_BASE}/acheteur/${gid}/wishlist`, { credentials: 'include' }).then(r => (r.ok ? r.json() : { items: [] })).catch(() => ({ items: [] }));
      e.ids = new Set((w.items || []).map((i: any) => String(i.produit_id)));
    } else {
      e.ids = new Set(lireInvite(gid, e.config).map(x => x.id));
    }
  } catch { /* garde l'état précédent */ }
  notifier(e);
}

function afficherToast(e: Etat, msg: string, ok: boolean) {
  if (!e.config.notif_actif) return;
  const id = ++e.compteurToast;
  e.toast = { msg, ok, id };
  notifier(e);
  setTimeout(() => { if (e.toast && e.toast.id === id) { e.toast = null; notifier(e); } }, Math.max(1, e.config.notif_duree) * 1000);
}

async function basculerProduit(gid: string, produitId: number | string, demo: boolean) {
  const e = etatDe(gid);
  const id = String(produitId);
  const dedans = e.ids.has(id);
  const c = e.config;
  const type = demo ? 'acheteur' : typeCompte(gid);
  if (type && type !== 'acheteur') { afficherToast(e, 'Un compte acheteur est requis pour la liste de souhaits', false); return; }
  if (!type) {   // visiteur non connecté
    if (!c.invites_actif) { afficherToast(e, 'Connectez-vous avec un compte acheteur pour utiliser votre liste de souhaits', false); return; }
    let l = lireInvite(gid, c);
    if (dedans) { l = l.filter(x => x.id !== id); e.ids.delete(id); ecrireInvite(gid, l); afficherToast(e, c.notif_msg_retrait, true); }
    else {
      if (l.length >= c.invites_max) { afficherToast(e, `Votre liste temporaire est pleine (${c.invites_max} articles) — connectez-vous pour continuer`, false); return; }
      l.push({ id, t: Date.now() }); e.ids.add(id); ecrireInvite(gid, l); afficherToast(e, c.notif_msg_invite, true);
    }
    notifier(e);
    return;
  }
  if (demo) {
    if (dedans) e.ids.delete(id); else e.ids.add(id);
    afficherToast(e, dedans ? c.notif_msg_retrait : c.notif_msg_ajout, true);
    return;
  }
  try {
    const res = dedans
      ? await fetch(`${API_BASE}/acheteur/${gid}/wishlist/${id}`, { method: 'DELETE', credentials: 'include' })
      : await fetch(`${API_BASE}/acheteur/${gid}/wishlist`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ produit_id: parseInt(id, 10) }) });
    if (res.status === 401) { try { localStorage.removeItem(`mv_compte_${gid}`); } catch { /* ignore */ } afficherToast(e, 'Session expirée — reconnectez-vous', false); }
    else if (res.ok) { if (dedans) e.ids.delete(id); else e.ids.add(id); afficherToast(e, dedans ? c.notif_msg_retrait : c.notif_msg_ajout, true); }
    else afficherToast(e, '❌ Opération impossible', false);
  } catch { afficherToast(e, '❌ Erreur réseau', false); }
  notifier(e);
}

/** Accès à l'état des favoris d'une marketplace. En démo : tout est local, rien n'est envoyé au serveur. */
export function useFavoris(gestionnaireId?: number | string, isDemo?: boolean) {
  const gid = gestionnaireId === undefined || gestionnaireId === null ? '' : String(gestionnaireId);
  const cle = isDemo ? `demo-${gid}` : gid;
  const [, tick] = useState(0);
  useEffect(() => {
    if (!gid) return;
    const e = etatDe(cle);
    const f = () => tick(n => n + 1);
    e.ecoutes.add(f);
    if (isDemo) { if (!e.actif) { e.actif = true; notifier(e); } }
    else if (Date.now() - e.t > 20000 || e.typeCharge !== typeCompte(gid)) charger(cle);
    return () => { e.ecoutes.delete(f); };
  }, [cle, gid, isDemo]);   // eslint-disable-line react-hooks/exhaustive-deps
  const e = etatDe(cle);
  return {
    actif: !!gid && (isDemo ? true : e.actif), config: e.config, nombre: e.ids.size,
    estDans: (produitId: number | string) => e.ids.has(String(produitId)),
    basculer: (produitId: number | string) => basculerProduit(cle, produitId, !!isDemo),
    toast: e.toast,
  };
}

// ─── Icône ───────────────────────────────────────────────────────────────────

const CHEMINS: Record<ConfigFavoris['icone_style'], string> = {
  coeur: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  etoile: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  signet: 'M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z',
};
let cssInjecte = false;
function injecterCss() {
  if (cssInjecte || typeof document === 'undefined') return;
  cssInjecte = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes mvfEchelle { 0%{transform:scale(.6)} 55%{transform:scale(1.35)} 100%{transform:scale(1)} }
    @keyframes mvfRebond { 0%,100%{transform:translateY(0)} 30%{transform:translateY(-8px)} 60%{transform:translateY(0)} 80%{transform:translateY(-3px)} }
    @keyframes mvfFondu { 0%{opacity:0} 100%{opacity:1} }
    @keyframes mvfToastIn { 0%{opacity:0;transform:translateY(10px)} 100%{opacity:1;transform:translateY(0)} }
    .mvf-a-echelle{animation:mvfEchelle .4s ease} .mvf-a-rebond{animation:mvfRebond .5s ease} .mvf-a-fondu{animation:mvfFondu .5s ease}
  `;
  document.head.appendChild(s);
}

export function IconeSouhait({ config, rempli, taille }: { config: ConfigFavoris; rempli: boolean; taille?: number }) {
  injecterCss();
  const t = taille || config.icone_taille;
  const couleur = rempli ? config.icone_couleur_active : config.icone_couleur;
  return (
    <svg key={rempli ? 'on' : 'off'} className={rempli && config.icone_animation !== 'aucune' ? `mvf-a-${config.icone_animation}` : undefined}
      width={t} height={t} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <path d={CHEMINS[config.icone_style] || CHEMINS.coeur} fill={rempli ? couleur : 'none'} stroke={couleur} strokeWidth={rempli ? 1.5 : 2} strokeLinejoin="round" />
    </svg>
  );
}

// ─── Bouton ♥ ────────────────────────────────────────────────────────────────

interface PropsBouton {
  gestionnaireId?: number | string; produitId?: number | string; isDemo?: boolean;
  variante: 'produit' | 'carte';
  /** Aperçu (page de config) : réglages et état imposés, aucun appel serveur. */
  apercu?: { config: ConfigFavoris; actif: boolean; onClick: () => void };
}

export function MVSouhaitBouton({ gestionnaireId, produitId, isDemo, variante, apercu }: PropsBouton) {
  const f = useFavoris(apercu ? undefined : gestionnaireId, isDemo);
  const config = apercu ? apercu.config : f.config;
  const actifAddon = apercu ? true : f.actif;
  if (!actifAddon) return null;
  if (variante === 'produit' && !config.bouton_produit_actif) return null;
  if (variante === 'carte' && !config.bouton_catalogue_actif) return null;
  const dedans = apercu ? apercu.actif : (produitId !== undefined && f.estDans(produitId));
  const clic = (ev: React.MouseEvent) => { ev.stopPropagation(); ev.preventDefault(); if (apercu) apercu.onClick(); else if (produitId !== undefined) f.basculer(produitId); };
  const titre = dedans ? 'Retirer de ma liste de souhaits' : 'Ajouter à ma liste de souhaits';

  if (variante === 'produit') {
    return (
      <button type="button" onClick={clic} title={titre} aria-label={titre} aria-pressed={dedans}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
          color: '#fff', border: `1px solid ${dedans ? config.icone_couleur_active : 'rgba(255,255,255,0.25)'}`, background: dedans ? `${config.icone_couleur_active}22` : 'rgba(255,255,255,0.06)' }}>
        <IconeSouhait config={config} rempli={dedans} />
        <span>{dedans ? 'Dans ma liste' : 'Liste de souhaits'}</span>
      </button>
    );
  }
  const taille = Math.min(config.icone_taille, 28);
  const style = config.bouton_catalogue_style;
  const base: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 };
  const dim = taille + 14;
  const parStyle: React.CSSProperties =
    style === 'minimaliste' ? { ...base, width: dim, height: dim, background: 'transparent', border: 'none', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.6))' }
    : style === 'classique' ? { ...base, width: dim, height: dim, borderRadius: 6, background: 'rgba(0,0,0,.55)', border: '1px solid rgba(255,255,255,.25)' }
    : { ...base, width: dim, height: dim, borderRadius: '50%', background: 'rgba(0,0,0,.5)', border: 'none', backdropFilter: 'blur(4px)' };
  return (
    <button type="button" onClick={clic} title={titre} aria-label={titre} aria-pressed={dedans} style={parStyle}>
      <IconeSouhait config={config} rempli={dedans} taille={taille} />
    </button>
  );
}

/** Bouton de la page produit : avant ou après « Ajouter au panier » selon le réglage du gestionnaire. */
export function MVSouhaitProduit({ zone, gestionnaireId, produitId, isDemo, masque }: { zone: 'avant_panier' | 'apres_panier'; gestionnaireId?: number | string; produitId: number | string; isDemo?: boolean; masque?: boolean }) {
  const f = useFavoris(gestionnaireId, isDemo);
  if (masque || !f.actif || !f.config.bouton_produit_actif || f.config.bouton_produit_position !== zone) return null;
  return <div style={{ marginBottom: 12 }}><MVSouhaitBouton gestionnaireId={gestionnaireId} produitId={produitId} isDemo={isDemo} variante="produit" /></div>;
}

/** Bouton d'une carte produit : s'affiche seulement dans la zone choisie par le gestionnaire (superposition sur l'image, haut ou bas de la carte). */
export function MVSouhaitCarte({ zone, gestionnaireId, produitId, isDemo }: { zone: 'superposition' | 'haut' | 'bas'; gestionnaireId?: number | string; produitId: number | string; isDemo?: boolean }) {
  const f = useFavoris(gestionnaireId, isDemo);
  if (!f.actif || !f.config.bouton_catalogue_actif || f.config.bouton_catalogue_position !== zone) return null;
  const bouton = <MVSouhaitBouton gestionnaireId={gestionnaireId} produitId={produitId} isDemo={isDemo} variante="carte" />;
  if (zone === 'superposition') return <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 3 }}>{bouton}</div>;
  return <div style={{ display: 'flex', justifyContent: 'flex-end', padding: zone === 'haut' ? '0 0 6px' : '8px 0 0' }}>{bouton}</div>;
}

// ─── Accès à la liste : icône d'en-tête et bouton flottant ───────────────────

export function MVSouhaitsAcces({ gestionnaireId, naviguer, variante, isDemo }: { gestionnaireId?: number | string; naviguer: (d: any) => void; variante: 'entete' | 'flottant'; isDemo?: boolean }) {
  const f = useFavoris(gestionnaireId, isDemo);
  const c = f.config;
  if (!f.actif || (variante === 'entete' ? !c.entete_actif : !c.flottant_actif)) return null;
  const ouvrir = () => {
    try { localStorage.setItem(`mv_page_prefill_${gestionnaireId}`, 'wishlist'); } catch { /* ignore */ }
    naviguer({ page: 'login' });   // ouvre le tableau de bord si une session existe, sinon la connexion
  };
  const compteur = (variante === 'flottant' || c.entete_compteur) && f.nombre > 0
    ? <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: c.icone_couleur_active, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.nombre}</span>
    : null;
  if (variante === 'entete') {
    return (
      <button type="button" onClick={ouvrir} title="Ma liste de souhaits" aria-label="Ma liste de souhaits"
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <IconeSouhait config={{ ...c, icone_couleur: '#ffffffcc' }} rempli={false} taille={Math.min(c.icone_taille, 28)} />
        {compteur}
      </button>
    );
  }
  const pos = c.flottant_position;
  return (
    <button type="button" onClick={ouvrir} title="Ma liste de souhaits" aria-label="Ma liste de souhaits"
      style={{ position: 'fixed', zIndex: 900, [pos.startsWith('bas') ? 'bottom' : 'top']: pos.startsWith('bas') ? 20 : 80, [pos.endsWith('droite') ? 'right' : 'left']: 20,
        width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(15,23,42,.92)', boxShadow: '0 6px 20px rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <IconeSouhait config={{ ...c, icone_couleur: c.icone_couleur_active }} rempli={f.nombre > 0} taille={Math.min(c.icone_taille + 2, 30)} />
      {compteur}
    </button>
  );
}

// ─── Notification ────────────────────────────────────────────────────────────

export function ToastSouhaits({ config, toast }: { config: ConfigFavoris; toast: { msg: string; ok: boolean } | null }) {
  injecterCss();
  if (!toast) return null;
  const p = config.notif_placement;
  const pos: React.CSSProperties = p === 'haut_centre' ? { top: 80, left: '50%', transform: 'translateX(-50%)' } : p === 'bas_droite' ? { bottom: 24, right: 20 } : p === 'bas_gauche' ? { bottom: 24, left: 20 } : { bottom: 24, left: '50%', transform: 'translateX(-50%)' };
  return (
    <div role="status" style={{ position: 'fixed', zIndex: 3000, maxWidth: 'calc(100vw - 32px)', padding: '12px 18px', borderRadius: 10, fontSize: 14, fontWeight: 700, boxShadow: '0 6px 22px rgba(0,0,0,.4)',
      background: toast.ok ? config.notif_couleur_fond : config.notif_couleur_erreur_fond, color: toast.ok ? config.notif_couleur_texte : config.notif_couleur_erreur_texte,
      animation: config.notif_animer ? 'mvfToastIn .25s ease' : undefined, ...pos }}>
      {toast.msg}
    </div>
  );
}

/** À placer une fois dans le template : affiche les notifications de la liste de souhaits. */
export function MVFavorisToast({ gestionnaireId, isDemo }: { gestionnaireId?: number | string; isDemo?: boolean }) {
  const f = useFavoris(gestionnaireId, isDemo);
  return f.actif ? <ToastSouhaits config={f.config} toast={f.toast} /> : null;
}