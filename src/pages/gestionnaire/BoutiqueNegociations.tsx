// CHEMIN : src/pages/gestionnaire/BoutiqueNegociations.tsx
// e-Vend Studio — Add-on « Faire une offre » (templates boutique solo), côté gestionnaire. Adapté de CollaborateurNegociations.tsx (MV) :
// le gestionnaire est le vendeur. Il accepte, refuse ou répond par une contre-offre, et règle l'add-on (offre minimale, validité, délai de réponse, limite par jour).
// Aucune réservation de stock : si le produit se vend entre-temps, l'offre tombe.
// API : /api/boutique/gestionnaire/negociations/(mes | :id/accepter | :id/refuser | :id/contre | reglages)

import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { bq, messageErreur, formaterArgent } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

interface Offre {
  id: number; produit_id: number; titre: string; variante: string; photo: string | null; sku: string | null; stock: number | null; acheteur: string | null;
  prix_produit: number; prix_offert: number; prix_contre: number | null; prix_final: number | null; message: string | null; message_vendeur: string | null; etat: string; cree: string; expire: string;
}
interface Reglages { actif: boolean; min_pct: number; validite_h: number; reponse_jours: number; max_par_jour: number }
interface Reponse {
  reglages: Reglages; total: number; page: number; pages: number;
  stats: { a_repondre: number; contre: number; acceptees: number; payees: number }; offres: Offre[];
}
interface Props { gestionnaireId: number; accent?: string; isMobile?: boolean; pagePlan?: string; naviguerVers?: (page: string) => void; }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', green: '#10b981', red: '#ef4444' };
const quand = (d: string) => { try { return new Date(d).toLocaleString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };
const ETATS: Record<string, { label: string; couleur: string; fond: string }> = {
  attente: { label: '⏳ À répondre', couleur: '#b45309', fond: '#fffbeb' },
  contre: { label: '💬 Contre-offre envoyée', couleur: '#1d4ed8', fond: '#eff6ff' },
  acceptee: { label: '✅ Acceptée — attend le paiement', couleur: '#047857', fond: '#ecfdf5' },
  payee: { label: '🛍️ Vendue', couleur: '#047857', fond: '#ecfdf5' },
  refusee: { label: 'Refusée', couleur: '#6b7280', fond: '#f3f4f6' },
  annulee: { label: "Retirée par l'acheteur", couleur: '#6b7280', fond: '#f3f4f6' },
  expiree: { label: '⌛ Expirée', couleur: '#6b7280', fond: '#f3f4f6' },
};
const FILTRES: [string, string][] = [['', 'Toutes'], ['attente', 'À répondre'], ['contre', 'Contre-offres'], ['acceptee', 'Acceptées'], ['payee', 'Vendues'], ['refusee', 'Refusées'], ['expiree', 'Expirées']];

export default function BoutiqueNegociations({ accent, isMobile: mobileProp, pagePlan, naviguerVers }: Props) {
  const couleur = accent || '#4f46e5';
  const isMobile = !!mobileProp;
  const [data, setData] = useState<Reponse | null>(null);
  const [etat, setEtat] = useState('');
  const [recherche, setRecherche] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [inactif, setInactif] = useState(false);
  const [message, setMessage] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [contre, setContre] = useState<Offre | null>(null);
  const [prixContre, setPrixContre] = useState('');
  const [mot, setMot] = useState('');
  const [erreurContre, setErreurContre] = useState('');
  const [aRefuser, setARefuser] = useState<Offre | null>(null);
  const [erreurModale, setErreurModale] = useState('');
  const [reglOuvert, setReglOuvert] = useState(false);
  const [actif, setActif] = useState(true);
  const [minPct, setMinPct] = useState('50');
  const [validite, setValidite] = useState('48');
  const [reponse, setReponse] = useState('7');
  const [maxJour, setMaxJour] = useState('10');

  useEffect(() => { const t = setTimeout(() => { setQ(recherche.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [recherche]);

  const charger = useCallback(async () => {
    const p = [`page=${page}`];
    if (etat) p.push(`etat=${etat}`);
    if (q) p.push(`q=${encodeURIComponent(q)}`);
    const r = await bq(`/negociations/mes?${p.join('&')}`);
    if (r.ok) {
      setData(r.data); setErreur(''); setInactif(false);
    } else if (r.status === 403) setInactif(true);
    else setErreur(messageErreur(r));
    setChargement(false);
  }, [page, etat, q]);
  useEffect(() => { charger(); }, [charger]);

  // Les champs de réglages suivent le serveur seulement quand le panneau est fermé (on ne réécrit pas ce que le gestionnaire tape)
  useEffect(() => {
    if (!data || reglOuvert) return;
    const g = data.reglages;
    setActif(g.actif); setMinPct(String(g.min_pct)); setValidite(String(g.validite_h)); setReponse(String(g.reponse_jours)); setMaxJour(String(g.max_par_jour));
  }, [data, reglOuvert]);

  const flash = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 4000); };
  const prevenirMenu = () => window.dispatchEvent(new Event('negociations-boutique-maj'));

  const repondre = async (o: Offre, action: 'accepter' | 'refuser' | 'contre', corps: object, ok: string): Promise<boolean> => {
    setOccupe(true);
    const r = await bq(`/negociations/${o.id}/${action}`, { method: 'POST', body: corps });
    setOccupe(false);
    if (!r.ok) { if (action === 'contre') setErreurContre(messageErreur(r)); else setErreurModale(messageErreur(r)); return false; }
    flash(ok); prevenirMenu(); charger();
    return true;
  };

  const enregistrerReglages = async () => {
    setOccupe(true); setErreur('');
    const r = await bq('/negociations/reglages', { method: 'PUT', body: { actif, min_pct: Number(minPct), validite_h: Number(validite), reponse_jours: Number(reponse), max_par_jour: Number(maxJour) } });
    setOccupe(false);
    if (!r.ok) { setErreurModale(messageErreur(r)); return; }
    setReglOuvert(false); flash('Réglages enregistrés.'); charger();
  };

  const carte: CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 };
  const champ: CSSProperties = { padding: '9px 11px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, color: T.text, background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' };
  const btn = (fond: string, texte: string, bordure?: string): CSSProperties => ({ padding: '8px 14px', borderRadius: 8, border: bordure ? `1px solid ${bordure}` : 'none', background: fond, color: texte, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' });

  if (inactif) return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ ...carte, textAlign: 'center', color: T.light, padding: 30 }}>
        L'add-on « Faire une offre » n'est pas activé.
        {pagePlan && naviguerVers && <div style={{ marginTop: 10 }}><button onClick={() => naviguerVers(pagePlan)} style={btn(couleur, '#fff')}>Voir « Mon plan & limites »</button></div>}
      </div>
    </div>
  );

  const g = data ? data.reglages : null;
  const champReglage = (libelle: string, aide: string, valeur: string, set: (v: string) => void, min: number, max: number) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: T.text, fontWeight: 700, minWidth: 150, flex: 1 }}>
      {libelle}
      <input type="number" min={min} max={max} value={valeur} onChange={e => set(e.target.value)} style={{ ...champ, width: '100%' }} />
      <span style={{ fontWeight: 500, fontSize: 11, color: T.light }}>{aide}</span>
    </label>
  );

  return (
    <div style={{ padding: isMobile ? 12 : 20, maxWidth: 1000 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 24, color: T.text }}>🤝 Offres des acheteurs</h2>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: T.light }}>Vos acheteurs vous proposent un prix. Acceptez, refusez ou contre-proposez. Une offre acceptée ou une contre-offre reste valide {g ? g.validite_h : 48} h. <b>Le produit n'est pas réservé</b> : s'il se vend entre-temps, l'offre tombe.</p>

      {message && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#ecfdf5', color: '#047857', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{message}</div>}
      {erreur && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', color: '#b91c1c', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{erreur}</div>}

      <div style={{ ...carte, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>⚙️ Réglages <span style={{ fontWeight: 600, color: T.light, fontSize: 12 }}>— {g ? (g.actif ? `offres acceptées dès ${g.min_pct} % du prix` : 'offres désactivées sur mes produits') : ''}</span></div>
          <button onClick={() => setReglOuvert(!reglOuvert)} style={btn('#fff', T.text, T.border)}>{reglOuvert ? 'Fermer' : 'Modifier'}</button>
        </div>
        {reglOuvert && (
          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, color: T.text, cursor: 'pointer', marginBottom: 14 }}>
              <input type="checkbox" checked={actif} onChange={e => setActif(e.target.checked)} /> Accepter les offres sur mes produits
            </label>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
              {champReglage('Offre minimale (% du prix)', 'Entre 10 et 99 %. Défaut : 50 %.', minPct, setMinPct, 10, 99)}
              {champReglage('Validité (heures)', "Temps donné à l'acheteur pour payer une offre acceptée ou répondre à une contre-offre. 1 à 336 h. Défaut : 48 h.", validite, setValidite, 1, 336)}
              {champReglage('Délai de réponse (jours)', "Temps dont vous disposez pour répondre à une offre. 1 à 30 jours. Défaut : 7.", reponse, setReponse, 1, 30)}
              {champReglage('Offres par acheteur / jour', 'Limite par période de 24 h. 1 à 50. Défaut : 10.', maxJour, setMaxJour, 1, 50)}
            </div>
            <button disabled={occupe} onClick={enregistrerReglages} style={btn(couleur, '#fff')}>Enregistrer</button>
          </div>
        )}
      </div>

      {data && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        {([['À répondre', data.stats.a_repondre], ['Contre-offres', data.stats.contre], ['Acceptées (à payer)', data.stats.acceptees], ['Vendues', data.stats.payees]] as [string, number][]).map(([l, n]) => (
          <div key={l} style={{ ...carte, padding: '10px 16px', minWidth: 110 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{n}</div><div style={{ fontSize: 12, color: T.light }}>{l}</div>
          </div>))}
      </div>}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {FILTRES.map(([id, label]) => (
          <button key={id || 'tous'} onClick={() => { setEtat(id); setPage(1); }} style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${etat === id ? couleur : T.border}`, background: etat === id ? `${couleur}22` : '#fff', color: T.text, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {label}{id === 'attente' && data ? ` (${data.stats.a_repondre})` : ''}
          </button>
        ))}
      </div>
      <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher un produit ou un SKU…" style={{ ...champ, width: '100%', maxWidth: 420, marginBottom: 14 }} />

      {chargement && !data ? <div style={{ padding: 30, textAlign: 'center', color: T.light }}>Chargement…</div>
        : !data || data.offres.length === 0 ? <div style={{ ...carte, padding: 30, textAlign: 'center', color: T.light }}>Aucune offre pour le moment.</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.offres.map(o => {
              const st = ETATS[o.etat] || ETATS.refusee;
              const pct = o.prix_produit > 0 ? Math.round(((o.prix_produit - o.prix_offert) / o.prix_produit) * 100) : 0;
              return (
                <div key={o.id} style={{ ...carte, borderLeft: `4px solid ${st.couleur}` }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {o.photo ? <img src={o.photo} alt="" loading="lazy" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: `1px solid ${T.border}`, flexShrink: 0 }} />
                      : <div style={{ width: 56, height: 56, borderRadius: 8, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>📦</div>}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{o.titre}{o.variante ? ` — ${o.variante}` : ''}{o.sku ? <span style={{ fontWeight: 600, color: T.light }}> · SKU {o.sku}</span> : null}</div>
                      <div style={{ fontSize: 12, color: T.light, marginTop: 2 }}>{o.acheteur || 'Acheteur'} · reçue le {quand(o.cree)}{o.stock !== null && o.stock !== undefined ? ` · stock : ${o.stock}` : ''}</div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14, color: T.text }}>
                        <span>Prix : <b>{formaterArgent(o.prix_produit)}</b></span>
                        <span>Offre : <b style={{ color: couleur }}>{formaterArgent(o.prix_offert)}</b>{pct > 0 ? ` (−${pct} %)` : ''}</span>
                        {o.prix_contre !== null && <span>Ma contre-offre : <b>{formaterArgent(o.prix_contre)}</b></span>}
                        {o.prix_final !== null && ['acceptee', 'payee'].includes(o.etat) && <span>Prix convenu : <b style={{ color: T.green }}>{formaterArgent(o.prix_final)}</b></span>}
                      </div>
                      {o.message && <div style={{ marginTop: 8, padding: '8px 10px', background: '#f8fafc', borderRadius: 8, fontSize: 13, color: T.text, fontStyle: 'italic' }}>« {o.message} »</div>}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 20, color: st.couleur, background: st.fond, whiteSpace: 'nowrap' }}>{st.label}</span>
                  </div>
                  {['attente', 'contre', 'acceptee'].includes(o.etat) && <div style={{ fontSize: 12, color: T.light, marginTop: 8 }}>{o.etat === 'attente' ? 'Répondre avant le ' : "Valide jusqu'au "}{quand(o.expire)}</div>}
                  {o.etat === 'attente' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      <button disabled={occupe} onClick={() => repondre(o, 'accepter', {}, "Offre acceptée. L'acheteur la verra dans « Mes offres ».")} style={btn(T.green, '#fff')}>✓ Accepter {formaterArgent(o.prix_offert)}</button>
                      <button disabled={occupe} onClick={() => { setContre(o); setPrixContre(''); setMot(''); setErreurContre(''); }} style={btn('#fff', T.text, T.border)}>↔ Contre-offre</button>
                      <button disabled={occupe} onClick={() => setARefuser(o)} style={btn('#fff', T.red, T.red)}>Refuser</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {data && data.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center', marginTop: 16 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ ...champ, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>← Précédent</button>
          <span style={{ fontSize: 12, color: T.light }}>Page {data.page} / {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} style={{ ...champ, cursor: page >= data.pages ? 'not-allowed' : 'pointer' }}>Suivant →</button>
        </div>
      )}

      {contre && (
        <div onClick={() => !occupe && setContre(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 14, padding: 20, boxSizing: 'border-box' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 4 }}>↔ Contre-offre</div>
            <div style={{ fontSize: 13, color: T.light, marginBottom: 12 }}>« {contre.titre} » — prix {formaterArgent(contre.prix_produit)}, offre de l'acheteur {formaterArgent(contre.prix_offert)}. Votre prix doit être entre les deux.</div>
            <input autoFocus inputMode="decimal" value={prixContre} onChange={e => setPrixContre(e.target.value)} placeholder="Votre prix ($)" style={{ ...champ, width: '100%', marginBottom: 10, fontSize: 16 }} />
            <textarea value={mot} onChange={e => setMot(e.target.value.slice(0, 300))} rows={2} placeholder="Message (facultatif)" style={{ ...champ, width: '100%', marginBottom: 12, resize: 'vertical' }} />
            {erreurContre && <div style={{ marginBottom: 10, color: '#b91c1c', fontSize: 13, fontWeight: 600 }}>{erreurContre}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={occupe || !prixContre} onClick={async () => { if (await repondre(contre, 'contre', { prix: Number(prixContre.replace(',', '.')), message: mot }, 'Contre-offre envoyée.')) setContre(null); }} style={{ ...btn(couleur, '#fff'), flex: 1, opacity: !prixContre ? 0.5 : 1 }}>Envoyer</button>
              <button disabled={occupe} onClick={() => setContre(null)} style={btn('#fff', T.text, T.border)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {aRefuser && <BoutiqueModale type="confirmer" accent={couleur} enCours={occupe} titre="Refuser cette offre ?" message={`Refuser l'offre de ${formaterArgent(aRefuser.prix_offert)} sur « ${aRefuser.titre} » ?`} texteConfirmer="Refuser" texteFermer="Annuler"
        onConfirmer={async () => { if (await repondre(aRefuser, 'refuser', {}, 'Offre refusée.')) setARefuser(null); }} onFermer={() => !occupe && setARefuser(null)} />}
      {erreurModale && <BoutiqueModale type="erreur" accent={couleur} message={erreurModale} onFermer={() => { setErreurModale(''); setARefuser(null); }} />}
    </div>
  );
}