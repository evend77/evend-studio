// CHEMIN : src/pages/boutique/PanierBoutique.tsx
// e-Vend Studio — Panier de l'acheteur, commun à tous les templates boutique (solo). Les prix et le stock viennent toujours du serveur.
// Présentation reprise du panier Studio (beige/crème), adaptée à UN seul vendeur : pas de sélection de vendeur ni de minimum par vendeur.
// API : /api/boutique/acheteur/<gestionnaire>/panier…

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ba, messageAcheteur, argent, paramUrl } from './boutiqueAcheteurApi';

interface Ligne { id: number; produit_id: number; titre: string; variante: string; quantite: number; prix: number; stock: number; total_ligne: number; image_url: string | null; erreur: string | null; }
interface PlusTard { id: number; produit_id: number; titre: string; variante: string; quantite: number; prix: number; image_url: string | null; }
interface Props { gestionnaireId: number; accent?: string; naviguerVers: (page: string) => void; }

const CSS = `
  @keyframes pbqSpin { to { transform: rotate(360deg); } }
  @keyframes pbqFade { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  .pbq-row { animation: pbqFade 0.3s ease; transition: background 0.2s; }
  .pbq-row:hover { background: #fef9ee !important; }
  .pbq-qte:hover:not(:disabled) { background: var(--pbq-c) !important; color: #fff !important; border-color: var(--pbq-c) !important; }
  .pbq-suppr { transition: all 0.2s !important; }
  .pbq-suppr:hover:not(:disabled) { background: #dc2626 !important; color: #fff !important; border-color: #dc2626 !important; transform: scale(1.05); }
  .pbq-tard:hover:not(:disabled) { background: #fef3c7 !important; border-color: var(--pbq-c) !important; transform: scale(1.05); }
  .pbq-carte:hover { background: #fef9ee !important; }
  .pbq-vider:hover { background: #fef3c7 !important; border-color: var(--pbq-c) !important; }
  .pbq-caisse:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.25) !important; }
  .pbq-lien:hover { text-decoration: underline; }
`;

const IcoPanier = (p: { s?: number }) => <svg width={p.s || 14} height={p.s || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>;
const IcoCorbeille = (p: { s?: number }) => <svg width={p.s || 16} height={p.s || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
const IcoMarque = (p: { s?: number }) => <svg width={p.s || 16} height={p.s || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>;
const IcoMoins = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const IcoPlus = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;

export default function PanierBoutique({ gestionnaireId: gid, accent, naviguerVers }: Props) {
  const c = accent || '#b47828';
  const degrade = `linear-gradient(135deg, ${c}, ${c}cc)`;
  const [lignes, setLignes] = useState<Ligne[] | null>(null);
  const [sousTotal, setSousTotal] = useState(0);
  const [plusTard, setPlusTard] = useState<PlusTard[]>([]);
  const [msg, setMsg] = useState<{ type: 'erreur' | 'info'; texte: string } | null>(null);
  const [erreurChargement, setErreurChargement] = useState('');
  const [enCours, setEnCours] = useState<string | null>(null);   // « qte-12 », « sup-12 », « tard-12 », « rem-5 », « vider »
  const [viderConfirm, setViderConfirm] = useState(false);
  // La largeur utile est celle de la zone du panier (à côté du menu du compte), pas celle de la fenêtre
  const [larg, setLarg] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [zone, setZone] = useState<HTMLDivElement | null>(null);
  const annulationFaite = useRef(false);
  const mobile = larg < 760;         // ligne d'article compacte
  const deuxColonnes = larg >= 1000; // récapitulatif à droite

  useEffect(() => {
    const f = () => setLarg(zone ? zone.clientWidth : window.innerWidth);
    f();
    window.addEventListener('resize', f);
    let ro: any = null;
    if (zone && typeof (window as any).ResizeObserver !== 'undefined') { ro = new (window as any).ResizeObserver(f); ro.observe(zone); }
    return () => { window.removeEventListener('resize', f); if (ro) ro.disconnect(); };
  }, [zone]);

  const charger = useCallback(async () => {
    const [p, t] = await Promise.all([ba(gid, '/panier'), ba(gid, '/panier/plus-tard')]);
    if (p.status === 401) { setMsg({ type: 'info', texte: 'Connectez-vous pour voir votre panier.' }); setLignes([]); return; }
    if (!p.ok) { setErreurChargement(messageAcheteur(p)); setLignes([]); return; }
    setErreurChargement('');
    setLignes(p.data.articles); setSousTotal(p.data.sous_total);
    setPlusTard(t.ok ? t.data.articles : []);
  }, [gid]);

  useEffect(() => {
    // Retour d'un paiement annulé (bouton « retour » de Stripe / PayPal) : la commande est annulée, les articles reviennent au panier
    const numero = paramUrl('commande');
    if (paramUrl('paiement') === 'annule' && numero && !annulationFaite.current) {
      annulationFaite.current = true;
      ba(gid, `/commandes/${encodeURIComponent(numero)}/annuler`, { method: 'POST' }).then(r => {
        setMsg(r.ok ? { type: 'info', texte: 'Paiement annulé. Vos articles sont de retour dans votre panier.' } : { type: 'erreur', texte: messageAcheteur(r) });
        charger();
      });
    } else charger();
  }, [gid, charger]);

  const agir = async (cle: string, fn: () => Promise<{ ok: boolean; data: any; status: number }>) => {
    setEnCours(cle); setMsg(null);
    const r = await fn();
    if (!r.ok) setMsg({ type: 'erreur', texte: messageAcheteur(r as any) });
    await charger(); setEnCours(null);
  };
  const viderPanier = async () => { setViderConfirm(false); await agir('vider', () => ba(gid, '/panier', { method: 'DELETE' })); };

  // ── Styles ───────────────────────────────────────────────────────────────
  const racine: React.CSSProperties = { ['--pbq-c' as any]: c, maxWidth: 1280, margin: '0 auto', padding: '16px 12px 60px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1c1917', minHeight: '60vh' };
  const carte: React.CSSProperties = { background: '#fffdf7', border: '1px solid #e7d5b8', borderRadius: 18, boxShadow: '0 2px 12px rgba(212,168,83,0.08)' };
  const btnQte = (off: boolean): React.CSSProperties => ({ width: 28, height: 28, border: '1px solid #e7d5b8', borderRadius: 7, background: '#fff', color: '#92400e', cursor: off ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0, opacity: off ? 0.4 : 1 });
  const spinPetit: React.CSSProperties = { width: 14, height: 14, border: '2px solid #e7d5b8', borderTop: `2px solid ${c}`, borderRadius: '50%', animation: 'pbqSpin 0.6s linear infinite' };

  if (!lignes) return (
    <div ref={setZone} style={racine}><style>{CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #fef9ee, #fef3c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(212,168,83,0.2)' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #f0e6d3', borderTop: `3px solid ${c}`, borderRadius: '50%', animation: 'pbqSpin 0.8s linear infinite' }} />
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Chargement de votre panier...</p>
        <p style={{ fontSize: 13, color: '#a8926a', margin: 0 }}>Récupération de vos articles en cours</p>
      </div>
    </div>
  );

  if (erreurChargement) return (
    <div ref={setZone} style={racine}><style>{CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Impossible de charger le panier</h2>
        <p style={{ fontSize: 14, color: '#78716c', margin: 0 }}>{erreurChargement}</p>
        <button onClick={() => { setLignes(null); charger(); }} style={{ padding: '10px 24px', background: degrade, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>Réessayer</button>
      </div>
    </div>
  );

  const problemes = lignes.filter(l => l.erreur);
  const peutPayer = lignes.length > 0 && problemes.length === 0;

  const bandeau = msg && (
    <div style={{ background: msg.type === 'erreur' ? '#fef2f2' : '#eff6ff', color: msg.type === 'erreur' ? '#b91c1c' : '#1e40af', border: `1px solid ${msg.type === 'erreur' ? '#fecaca' : '#bfdbfe'}`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 14 }}>{msg.texte}</div>
  );

  // ── Panier vide ──────────────────────────────────────────────────────────
  if (lignes.length === 0) return (
    <div ref={setZone} style={racine}><style>{CSS}</style>
      {bandeau}
      {plusTard.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 16, textAlign: 'center' }}>
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="56" fill="#fef9ee" stroke="#e7d5b8" strokeWidth="1.5" />
            <path d="M35 42h8l6 28h26l6-21H45" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="55" cy="76" r="3.5" fill={c} /><circle cx="73" cy="76" r="3.5" fill={c} />
            <path d="M60 30v8M54 33l6 5 6-5" stroke="#e7d5b8" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Votre panier est vide</h2>
          <p style={{ fontSize: 15, color: '#78716c', lineHeight: 1.7, margin: 0 }}>Vous n'avez aucun article dans votre panier pour le moment.<br />Découvrez nos produits et commencez vos achats !</p>
          <button onClick={() => naviguerVers('boutique')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: degrade, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>Découvrir les produits
          </button>
          <button onClick={() => naviguerVers('dashboard')} style={{ padding: '10px 24px', background: 'transparent', color: '#a8926a', border: '1px solid #e7d5b8', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>Retour au tableau de bord</button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '30px 10px', color: '#78716c' }}>
          <div style={{ fontSize: 42 }}>🛒</div>
          <p style={{ margin: '10px 0 18px' }}>Votre panier est vide, mais vous avez des articles mis de côté.</p>
          <button onClick={() => naviguerVers('boutique')} style={{ padding: '10px 24px', background: 'transparent', color: '#92400e', border: '1px solid #e7d5b8', borderRadius: 12, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>Continuer les achats</button>
        </div>
      )}
      {plusTard.length > 0 && SectionPlusTard()}
    </div>
  );

  function SectionPlusTard() {
    return (
      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', background: 'linear-gradient(135deg, #fef9ee, #fef3c7)', border: '1px solid #e7d5b8', borderRadius: '16px 16px 0 0', borderBottom: 'none' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(180,120,40,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: c }}><IcoMarque s={22} /></div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.3px' }}>Mis de côté pour plus tard</h2>
            <p style={{ fontSize: 13, color: '#a8926a', margin: 0 }}>{plusTard.length} article{plusTard.length > 1 ? 's' : ''} sauvegardé{plusTard.length > 1 ? 's' : ''} — cliquez sur « Ajouter au panier » pour les récupérer</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(260px, 1fr))', border: '1px solid #e7d5b8', borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>
          {plusTard.map(a => (
            <div key={a.id} className="pbq-carte" style={{ background: '#fffdf7', padding: mobile ? '12px 10px' : 20, borderRight: '1px solid #f0e6d3', borderBottom: '1px solid #f0e6d3', display: 'flex', flexDirection: 'column', gap: mobile ? 8 : 12, transition: 'background 0.2s' }}>
              <button onClick={() => naviguerVers(`produit:${a.produit_id}`)} aria-label={a.titre} style={{ width: '100%', aspectRatio: mobile ? '1/1' : '4/3', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}>
                {a.image_url
                  ? <img src={a.image_url} alt={a.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10, border: '1px solid #f0e6d3' }} />
                  : <div style={{ width: '100%', height: '100%', background: '#fef9ee', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>}
              </button>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: mobile ? 11 : 14, fontWeight: 600, margin: mobile ? '0 0 3px' : '0 0 6px', lineHeight: 1.4 }}>{a.titre}</p>
                {a.variante && <p style={{ fontSize: 11, color: '#a8926a', margin: '0 0 4px' }}>{a.variante}</p>}
                <p style={{ fontSize: mobile ? 13 : 16, fontWeight: 800, color: c, margin: '0 0 4px' }}>{argent(a.prix)}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => agir('rem-' + a.id, () => ba(gid, `/panier/plus-tard/${a.id}/remettre`, { method: 'POST' }))} disabled={enCours === 'rem-' + a.id}
                  style={{ width: '100%', padding: mobile ? '8px 6px' : '10px 14px', background: degrade, color: '#fff', border: 'none', borderRadius: 10, fontSize: mobile ? 11 : 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: enCours === 'rem-' + a.id ? 0.6 : 1 }}>
                  {enCours === 'rem-' + a.id ? '⏳ Ajout...' : <><IcoPanier />Ajouter au panier</>}
                </button>
                <button onClick={() => agir('sp-' + a.id, () => ba(gid, `/panier/plus-tard/${a.id}`, { method: 'DELETE' }))} disabled={enCours === 'sp-' + a.id}
                  style={{ width: '100%', padding: '8px 14px', background: 'transparent', color: '#a8926a', border: '1px solid #e7d5b8', borderRadius: 10, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <IcoCorbeille s={14} />Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Panier principal ─────────────────────────────────────────────────────
  const Vignette = (l: Ligne, taille: number) => (
    <button onClick={() => naviguerVers(`produit:${l.produit_id}`)} aria-label={l.titre} style={{ display: 'block', width: taille, height: taille, flexShrink: 0, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}>
      {l.image_url
        ? <img src={l.image_url} alt={l.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12, border: '1px solid #f0e6d3', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} />
        : <div style={{ width: '100%', height: '100%', background: '#fef9ee', borderRadius: 12, border: '1px solid #f0e6d3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>📦</div>}
    </button>
  );
  const Quantite = (l: Ligne) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef9ee', border: '1px solid #e7d5b8', borderRadius: 10, padding: '6px 10px', width: 'fit-content' }}>
      <button className="pbq-qte" aria-label="Moins" style={btnQte(enCours === 'qte-' + l.id || l.quantite <= 1)} disabled={enCours === 'qte-' + l.id || l.quantite <= 1}
        onClick={() => agir('qte-' + l.id, () => ba(gid, `/panier/${l.id}`, { method: 'PATCH', body: { quantite: l.quantite - 1 } }))}><IcoMoins /></button>
      <div style={{ width: 32, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{enCours === 'qte-' + l.id ? <div style={spinPetit} /> : <span style={{ fontSize: 15, fontWeight: 700 }}>{l.quantite}</span>}</div>
      <button className="pbq-qte" aria-label="Plus" style={btnQte(enCours === 'qte-' + l.id || l.quantite >= l.stock)} disabled={enCours === 'qte-' + l.id || l.quantite >= l.stock}
        onClick={() => agir('qte-' + l.id, () => ba(gid, `/panier/${l.id}`, { method: 'PATCH', body: { quantite: l.quantite + 1 } }))}><IcoPlus /></button>
    </div>
  );
  const BoutonsAction = (l: Ligne, enColonne: boolean) => (
    <div style={{ display: 'flex', flexDirection: enColonne ? 'column' : 'row', gap: 6, alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <button className="pbq-tard" onClick={() => agir('tard-' + l.id, () => ba(gid, `/panier/${l.id}/plus-tard`, { method: 'POST' }))} disabled={enCours === 'tard-' + l.id} title="Mettre de côté pour plus tard"
          style={{ width: 38, height: 38, borderRadius: 10, background: '#fef9ee', border: '1px solid #e7d5b8', color: c, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: enCours === 'tard-' + l.id ? 0.5 : 1 }}>
          {enCours === 'tard-' + l.id ? <div style={spinPetit} /> : <IcoMarque />}</button>
        {!mobile && <span style={{ fontSize: 10, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>+ Tard</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <button className="pbq-suppr" onClick={() => agir('sup-' + l.id, () => ba(gid, `/panier/${l.id}`, { method: 'DELETE' }))} disabled={enCours === 'sup-' + l.id} title="Retirer cet article"
          style={{ width: 38, height: 38, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: enCours === 'sup-' + l.id ? 0.5 : 1 }}>
          {enCours === 'sup-' + l.id ? <div style={spinPetit} /> : <IcoCorbeille s={17} />}</button>
        {!mobile && <span style={{ fontSize: 10, color: '#a8926a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Retirer</span>}
      </div>
    </div>
  );

  return (
    <div ref={setZone} style={racine}>
      <style>{CSS}</style>

      {viderConfirm && (
        <>
          <div onClick={() => setViderConfirm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9998 }} />
          <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 9999, background: '#fffdf7', border: '1px solid #e7d5b8', borderRadius: 20, padding: '36px 32px', maxWidth: 400, width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Vider le panier ?</h3>
            <p style={{ fontSize: 14, color: '#78716c', margin: '0 0 24px', lineHeight: 1.6 }}>Tous vos articles seront supprimés. Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setViderConfirm(false)} style={{ padding: '10px 24px', background: 'transparent', color: '#78716c', border: '1px solid #e7d5b8', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>Annuler</button>
              <button onClick={viderPanier} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontWeight: 700 }}>Oui, vider</button>
            </div>
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: mobile ? 'column' : 'row', alignItems: mobile ? 'flex-start' : 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 36 }}>🛒</div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.5px' }}>Mon panier</h1>
            <p style={{ fontSize: 14, color: '#a8926a', margin: 0 }}>{lignes.length} article{lignes.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => naviguerVers('boutique')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#fff', border: '1px solid #e7d5b8', borderRadius: 10, fontSize: 13, color: '#78716c', cursor: 'pointer', fontWeight: 500 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>Continuer les achats
          </button>
          <button className="pbq-vider" onClick={() => setViderConfirm(true)} disabled={enCours === 'vider'} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#fff', border: '1px solid #fecaca', borderRadius: 10, fontSize: 13, color: '#dc2626', cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s' }}>
            <IcoCorbeille s={14} />Vider le panier
          </button>
        </div>
      </div>

      {bandeau}
      {problemes.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', borderRadius: 14, border: '1px solid #fde68a', background: '#fffbeb', marginBottom: 20 }}>
          <div style={{ fontSize: 22 }}>⚠️</div>
          <div><p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>Votre panier demande une correction</p>
            {problemes.map((p, i) => <p key={i} style={{ fontSize: 13, color: '#78716c', margin: '0 0 2px', lineHeight: 1.6 }}>{p.erreur}</p>)}</div>
        </div>
      )}

      <div style={{ display: deuxColonnes ? 'grid' : 'flex', flexDirection: deuxColonnes ? undefined : 'column', gridTemplateColumns: deuxColonnes ? '1fr 380px' : undefined, gap: 28, alignItems: deuxColonnes ? 'start' : 'stretch' }}>
        <div style={{ ...carte, overflow: 'hidden', border: '2px solid #e7d5b8' }}>
          {lignes.map((l, i) => {
            const bord = i < lignes.length - 1 ? '1px solid #f0e6d3' : 'none';
            const total = argent(l.total_ligne);
            const titre = <button className="pbq-lien" onClick={() => naviguerVers(`produit:${l.produit_id}`)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: mobile ? 13 : 14, fontWeight: 600, color: '#1c1917', lineHeight: 1.4 }}>{l.titre}</button>;
            if (mobile) return (
              <div key={l.id} className="pbq-row" style={{ background: '#fff', borderBottom: bord }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px' }}>
                  {Vignette(l, 76)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {titre}
                    {l.variante && <div style={{ fontSize: 12, color: '#a8926a', marginTop: 2 }}>{l.variante}</div>}
                    <p style={{ fontSize: 15, fontWeight: 700, color: c, margin: '6px 0 2px' }}>{argent(l.prix)} / unité</p>
                    <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Total : {total}{l.quantite > 1 && <span style={{ fontSize: 11, color: '#a8926a', fontWeight: 400, marginLeft: 4 }}>{l.quantite}×</span>}</p>
                    {l.erreur && <p style={{ fontSize: 12, color: '#b45309', margin: '6px 0 0' }}>⚠️ {l.erreur}</p>}
                  </div>
                  {BoutonsAction(l, true)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fef9ee', padding: '10px 16px', borderTop: '1px solid #f0e6d3' }}>
                  <span style={{ fontSize: 13, color: '#a8926a', fontWeight: 600 }}>Quantité</span>{Quantite(l)}
                </div>
              </div>
            );
            return (
              <div key={l.id} className="pbq-row" style={{ display: 'grid', gridTemplateColumns: '88px 1fr 140px 110px 90px', alignItems: 'center', gap: 20, padding: '20px 24px', background: '#fff', borderBottom: bord }}>
                {Vignette(l, 88)}
                <div style={{ minWidth: 0 }}>
                  {titre}
                  {l.variante && <div style={{ fontSize: 12, color: '#a8926a', marginTop: 4 }}>{l.variante}</div>}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}><span style={{ fontSize: 16, fontWeight: 700, color: c }}>{argent(l.prix)}</span><span style={{ fontSize: 12, color: '#a8926a' }}>/ unité</span></div>
                  {l.erreur && <p style={{ fontSize: 12, color: '#b45309', margin: '6px 0 0' }}>⚠️ {l.erreur}</p>}
                </div>
                <div><p style={{ fontSize: 11, color: '#a8926a', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>Quantité</p>{Quantite(l)}</div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, color: '#a8926a', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Total</p>
                  <p style={{ fontSize: 18, fontWeight: 800, margin: '0 0 2px' }}>{total}</p>
                  {l.quantite > 1 && <p style={{ fontSize: 11, color: '#a8926a', margin: 0 }}>{l.quantite} x {argent(l.prix)}</p>}
                </div>
                {BoutonsAction(l, true)}
              </div>
            );
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', background: 'linear-gradient(to right, #fef9ee, #fef3c7)', borderTop: '1px solid #f0e6d3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a8926a' }}><IcoPanier /><span style={{ fontSize: 14, color: '#78716c', fontWeight: 500 }}>Sous-total</span></div>
            <span style={{ fontSize: 18, fontWeight: 800, color: c }}>{argent(sousTotal)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: deuxColonnes ? 'sticky' : 'relative', top: deuxColonnes ? 20 : 'auto' }}>
          <div style={{ ...carte, padding: mobile ? 14 : 24, boxShadow: '0 4px 20px rgba(212,168,83,0.1)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700, margin: '0 0 20px', paddingBottom: 14, borderBottom: '1px solid #f0e6d3' }}>Récapitulatif de commande</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ fontSize: 13, color: '#78716c' }}>Sous-total ({lignes.length} article{lignes.length > 1 ? 's' : ''})</span><span style={{ fontSize: 13, fontWeight: 500 }}>{argent(sousTotal)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ fontSize: 13, color: '#78716c' }}>Frais de livraison</span><span style={{ fontSize: 13, color: '#16a34a' }}>Calculés à l'étape suivante</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ fontSize: 13, color: '#78716c' }}>Taxes</span><span style={{ fontSize: 13, color: '#78716c' }}>Calculées à l'étape suivante</span></div>
            <div style={{ background: 'linear-gradient(135deg, #fef9ee, #fef3c7)', border: '1px solid #e7d5b8', borderRadius: 12, padding: 16, margin: '16px 0 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}><span style={{ fontSize: 16, fontWeight: 700 }}>Total estimé</span><span style={{ fontSize: 24, fontWeight: 900, color: c }}>{argent(sousTotal)}</span></div>
              <p style={{ fontSize: 11, color: '#a8926a', margin: 0 }}>Avant taxes et livraison</p>
            </div>

            {!peutPayer && problemes.length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#92400e', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Caisse bloquée :</p>
                {problemes.map((p, i) => <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#92400e', marginBottom: 4 }}><span>⚠️</span><span>{p.erreur}</span></div>)}
              </div>
            )}

            <button className="pbq-caisse" disabled={!peutPayer} onClick={() => { if (peutPayer) naviguerVers('caisse'); }}
              style={{ width: '100%', padding: 16, background: degrade, color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s', marginBottom: 10, boxShadow: '0 6px 20px rgba(0,0,0,0.18)', opacity: peutPayer ? 1 : 0.45, cursor: peutPayer ? 'pointer' : 'not-allowed' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              {peutPayer ? 'Passer à la caisse' : 'Caisse indisponible'}
            </button>
            <button onClick={() => naviguerVers('boutique')} style={{ width: '100%', padding: 12, background: 'transparent', color: '#92400e', border: '1px solid #e7d5b8', borderRadius: 12, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>Continuer les achats</button>
          </div>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>Paiement 100 % sécurisé</span>
            </div>
            <p style={{ fontSize: 12, color: '#4b7c59', lineHeight: 1.6, margin: '0 0 12px' }}>Vos informations de paiement sont protégées par un chiffrement SSL et traitées par un service de paiement sécurisé.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', background: '#dcfce7', padding: '3px 10px', borderRadius: 20 }}>🔒 SSL</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', background: '#dcfce7', padding: '3px 10px', borderRadius: 20 }}>💳 Paiement sécurisé</span>
            </div>
          </div>

          <div style={{ background: '#fffdf7', border: '1px solid #e7d5b8', borderRadius: 14, padding: '14px 18px' }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#92400e', margin: '0 0 6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.5" /></svg>Politique de retour
            </p>
            <p style={{ fontSize: 12, color: '#a8926a', margin: '0 0 8px', lineHeight: 1.6 }}>Consultez la politique de retour et de remboursement de la boutique avant de commander.</p>
            <button className="pbq-lien" onClick={() => naviguerVers('retour-remboursement')} style={{ background: 'none', border: 'none', padding: 0, color: c, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Lire la politique →</button>
          </div>
        </div>
      </div>

      {plusTard.length > 0 && SectionPlusTard()}
    </div>
  );
}