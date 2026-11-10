// CHEMIN : src/templates/multivendeur/MVFaireOffre.tsx
// e-Vend Studio — Add-on « Faire une offre » : bloc de la fiche produit (thème sombre).
// Montre : le bouton « Faire une offre », OU l'état de l'offre en cours (en attente, contre-offre, prix accepté).
// Toutes les règles (prix minimum, délais, stock) sont appliquées par le serveur ; ce composant affiche et envoie.
// Le bloc n'apparaît pas si l'add-on est inactif, si le vendeur refuse les offres, ou si le produit ne s'y prête pas (enchère, épuisé…).

import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { formaterPrix } from '../shared/devise';

const API_BASE = '/api';

interface Offre {
  id: number; etat: 'attente' | 'contre' | 'acceptee'; prix_offert: number; prix_contre: number | null; prix_final: number | null;
  message_vendeur: string | null; expire: string; variante: string;
}
interface Etat { actif: boolean; min_pct?: number; validite_heures?: number; offre: Offre | null }

interface Props {
  gestionnaireId: number | string;
  produitId: number;
  prix: number;                         // prix actuellement affiché (variante choisie incluse)
  variante: string;
  varianteRequise: boolean;             // le produit a des variantes et aucune n'est choisie
  masque?: boolean;                     // enchère en cours, produit épuisé, pas encore en vente, vendeur en vacances…
  couleurAccent: string;
  isDemo?: boolean;
  allerConnexion: () => void;
  onPanier?: () => void;                // appelé quand l'offre acceptée est mise au panier
}

const typeCompte = (gId: number | string): string | null => { try { return JSON.parse(localStorage.getItem(`mv_compte_${gId}`) || 'null')?.type || null; } catch { return null; } };
const quand = (iso: string) => { try { return new Date(iso).toLocaleString('fr-CA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

export default function MVFaireOffre({ gestionnaireId, produitId, prix, variante, varianteRequise, masque, couleurAccent, isDemo, allerConnexion, onPanier }: Props) {
  const base = `${API_BASE}/marketplace/${gestionnaireId}/negociations`;
  const [etat, setEtat] = useState<Etat | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const [montant, setMontant] = useState('');
  const [mot, setMot] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');

  const charger = useCallback(() => {
    if (isDemo) { setEtat({ actif: true, min_pct: 50, offre: null }); return; }
    fetch(`${base}/produit/${produitId}`, { credentials: 'include' }).then(r => (r.ok ? r.json() : null)).then(d => setEtat(d && d.actif ? d : { actif: false, offre: null })).catch(() => setEtat({ actif: false, offre: null }));
  }, [base, produitId, isDemo]);
  useEffect(() => { charger(); }, [charger]);

  const post = async (chemin: string, corps?: object) => {
    setOccupe(true); setErreur('');
    try {
      const r = await fetch(`${base}${chemin}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps || {}) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) { try { localStorage.removeItem(`mv_compte_${gestionnaireId}`); } catch { /* ignore */ } throw new Error('Session expirée — reconnectez-vous.'); }
      if (!r.ok) throw new Error(j.error || 'Erreur');
      return j;
    } catch (e: any) { setErreur(e.message || 'Erreur'); return null; }
    finally { setOccupe(false); }
  };

  if (!etat || !etat.actif || masque) return null;
  const o = etat.offre;
  const carte: CSSProperties = { width: '100%', marginBottom: 12, padding: '14px 16px', borderRadius: 12, border: `1px solid ${couleurAccent}66`, background: 'rgba(255,255,255,0.05)', boxSizing: 'border-box' };
  const btn = (fond: string, texte: string): CSSProperties => ({ padding: '10px 16px', borderRadius: 10, border: 'none', background: fond, color: texte, fontWeight: 800, fontSize: 14, cursor: occupe ? 'wait' : 'pointer', fontFamily: 'inherit' });

  const ouvrirForm = () => {
    const t = typeCompte(gestionnaireId);
    if (!t) { allerConnexion(); return; }
    if (t !== 'acheteur') { setErreur('Un compte acheteur est requis pour faire une offre.'); return; }
    if (varianteRequise) { setErreur('Choisissez une variante avant de faire une offre.'); return; }
    setErreur(''); setMontant(''); setMot(''); setOuvert(true);
  };

  const envoyer = async () => {
    const j = await post('/offrir', { produit_id: produitId, ...(variante ? { variante } : {}), prix: Number(String(montant).replace(',', '.')), message: mot });
    if (j) { setOuvert(false); setInfo(j.message || 'Offre envoyée.'); charger(); setTimeout(() => setInfo(''), 5000); }
  };

  const minimum = etat.min_pct ? Math.ceil(prix * etat.min_pct) / 100 : null;

  return (
    <>
      {info && <div style={{ ...carte, borderColor: 'rgba(16,185,129,0.5)', background: 'rgba(16,185,129,0.12)', color: '#6ee7b7', fontSize: 14, fontWeight: 700 }}>✓ {info}</div>}

      {!o && (
        <>
          <button onClick={ouvrirForm} style={{ width: '100%', marginBottom: 12, padding: '14px 16px', borderRadius: 12, border: `2px solid ${couleurAccent}`, background: 'transparent', color: couleurAccent, fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
            🤝 Faire une offre
          </button>
          {erreur && !ouvert && <div style={{ marginBottom: 12, color: '#fca5a5', fontSize: 13, fontWeight: 600 }}>{erreur}</div>}
        </>
      )}

      {o && o.etat === 'attente' && (
        <div style={carte}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>🤝 Votre offre : {formaterPrix(o.prix_offert)}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: '4px 0 10px' }}>En attente de la réponse du vendeur (jusqu'au {quand(o.expire)}). Vous serez avisé ici et dans vos notifications.</div>
          <button disabled={occupe} onClick={async () => { if (await post(`/acheteur/${o.id}/retirer`)) charger(); }} style={btn('rgba(255,255,255,0.12)', '#fff')}>Retirer mon offre</button>
        </div>
      )}

      {o && o.etat === 'contre' && (
        <div style={{ ...carte, borderColor: '#f59e0b' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>💬 Contre-offre du vendeur : {formaterPrix(Number(o.prix_contre))}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: '4px 0 4px' }}>Votre offre : {formaterPrix(o.prix_offert)}. Répondez avant le {quand(o.expire)}.</div>
          {o.message_vendeur && <div style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(255,255,255,0.8)', margin: '0 0 10px' }}>« {o.message_vendeur} »</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button disabled={occupe} onClick={async () => { if (await post(`/acheteur/${o.id}/accepter`)) charger(); }} style={btn(couleurAccent, '#000')}>Accepter {formaterPrix(Number(o.prix_contre))}</button>
            <button disabled={occupe} onClick={async () => { if (await post(`/acheteur/${o.id}/retirer`)) charger(); }} style={btn('rgba(255,255,255,0.12)', '#fff')}>Décliner</button>
          </div>
        </div>
      )}

      {o && o.etat === 'acceptee' && (
        <div style={{ ...carte, borderColor: '#10b981', background: 'rgba(16,185,129,0.1)' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#6ee7b7' }}>✅ Prix accepté : {formaterPrix(Number(o.prix_final))}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: '4px 0 10px' }}>Payez avant le <b>{quand(o.expire)}</b>. Le produit n'est pas réservé : s'il se vend entre-temps, l'offre tombe.</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button disabled={occupe} onClick={async () => { if (await post(`/acheteur/${o.id}/panier`)) { setInfo('Ajouté au panier au prix négocié.'); onPanier && onPanier(); setTimeout(() => setInfo(''), 5000); } }} style={btn('#10b981', '#000')}>🛒 Ajouter au panier à {formaterPrix(Number(o.prix_final))}</button>
            <button disabled={occupe} onClick={async () => { if (await post(`/acheteur/${o.id}/retirer`)) charger(); }} style={btn('rgba(255,255,255,0.12)', '#fff')}>Renoncer</button>
          </div>
        </div>
      )}
      {o && erreur && <div style={{ marginBottom: 12, color: '#fca5a5', fontSize: 13, fontWeight: 600 }}>{erreur}</div>}

      {ouvert && (
        <div onClick={() => !occupe && setOuvert(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: '#1a1a24', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 22, color: '#fff', boxSizing: 'border-box' }}>
            <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>🤝 Faire une offre</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 14 }}>Prix actuel : <b style={{ color: '#fff' }}>{formaterPrix(prix)}</b>{variante ? ` (${variante})` : ''}{minimum ? ` · offre minimale ${formaterPrix(minimum)}` : ''}</div>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Votre prix ($)</label>
            <input autoFocus inputMode="decimal" value={montant} onChange={e => setMontant(e.target.value)} placeholder="Ex. : 75.00"
              style={{ width: '100%', boxSizing: 'border-box', margin: '6px 0 12px', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 18, fontWeight: 700, fontFamily: 'inherit' }} />
            <label style={{ fontSize: 13, fontWeight: 700 }}>Message au vendeur <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>(facultatif)</span></label>
            <textarea value={mot} onChange={e => setMot(e.target.value.slice(0, 300))} rows={3}
              style={{ width: '100%', boxSizing: 'border-box', margin: '6px 0 10px', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 12 }}>Le vendeur a 7 jours pour répondre. Si votre offre est acceptée, vous aurez {etat.validite_heures || 48} h pour payer. Le produit n'est pas réservé pendant ce temps.</div>
            {erreur && <div style={{ marginBottom: 10, color: '#fca5a5', fontSize: 13, fontWeight: 600 }}>{erreur}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={occupe || !montant} onClick={envoyer} style={{ ...btn(couleurAccent, '#000'), flex: 1, opacity: !montant ? 0.5 : 1 }}>{occupe ? '⏳ Envoi…' : 'Envoyer mon offre'}</button>
              <button disabled={occupe} onClick={() => setOuvert(false)} style={btn('rgba(255,255,255,0.12)', '#fff')}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}