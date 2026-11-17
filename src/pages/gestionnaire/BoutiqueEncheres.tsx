// CHEMIN : src/pages/gestionnaire/BoutiqueEncheres.tsx
// e-Vend Studio — Add-on « Enchères » (templates boutique solo), côté gestionnaire. Adapté de StudioEncheres.tsx + StudioConfigMultivendeur.tsx (onglet Enchères) du MV :
// le gestionnaire est le vendeur. Il lance une enchère sur un produit, suit les mises, peut annuler une enchère en cours, et règle l'add-on (durées, incrément, réserve, délai de paiement).
// Une unité du produit est retirée du stock pendant l'enchère (remise en stock si l'enchère se termine sans vente).
// API : /api/boutique/gestionnaire/encheres/(mes | produits | :id/annuler | reglages)

import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { bq, messageErreur, formaterArgent } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

interface Enchere {
  id: number; produit_id: number; titre: string; image_url: string | null; statut: string; prix_depart: number; prix_reserve: number | null;
  mise_actuelle: number | null; prix_final: number | null; nb_mises: number; nb_encherisseurs: number; date_fin: string; paiement_expire_le: string | null; created_at: string;
}
interface Reglages { actif: boolean; duree_min_h: number; duree_max_jours: number; increment_min: number; reserve_permise: boolean; delai_paiement_h: number }
interface Reponse { addon_actif: boolean; reglages: Reglages; compte: Record<string, number>; encheres: Enchere[]; page: number }
interface ProduitChoix { id: number; titre: string; sku: string | null; photo: string | null; prix: number; stock: number | null; raison: string | null }
interface Props { gestionnaireId: number; accent?: string; isMobile?: boolean; pagePlan?: string; naviguerVers?: (page: string) => void; }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', green: '#10b981', red: '#ef4444' };
const quand = (d: string) => { try { return new Date(d).toLocaleString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };
const ETATS: Record<string, { label: string; couleur: string; fond: string }> = {
  active: { label: '🔨 En cours', couleur: '#b45309', fond: '#fffbeb' },
  attente_paiement: { label: '⏳ Gagnée — attend le paiement', couleur: '#1d4ed8', fond: '#eff6ff' },
  payee: { label: '🛍️ Vendue', couleur: '#047857', fond: '#ecfdf5' },
  expiree: { label: '⌛ Non payée (expirée)', couleur: '#b91c1c', fond: '#fef2f2' },
  sans_gagnant: { label: 'Terminée sans gagnant', couleur: '#6b7280', fond: '#f3f4f6' },
  annulee: { label: 'Annulée', couleur: '#6b7280', fond: '#f3f4f6' },
};
const FILTRES: [string, string][] = [['', 'Toutes'], ['active', 'En cours'], ['attente_paiement', 'À payer'], ['payee', 'Vendues'], ['expiree', 'Non payées'], ['sans_gagnant', 'Sans gagnant'], ['annulee', 'Annulées']];

export default function BoutiqueEncheres({ accent, isMobile: mobileProp, pagePlan, naviguerVers }: Props) {
  const couleur = accent || '#4f46e5';
  const isMobile = !!mobileProp;
  const [data, setData] = useState<Reponse | null>(null);
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [aAnnuler, setAAnnuler] = useState<Enchere | null>(null);
  const [erreurModale, setErreurModale] = useState('');
  // Réglages
  const [reglOuvert, setReglOuvert] = useState(false);
  const [actif, setActif] = useState(true);
  const [dMin, setDMin] = useState('1');
  const [dMax, setDMax] = useState('14');
  const [incr, setIncr] = useState('1');
  const [reserve, setReserve] = useState(true);
  const [delai, setDelai] = useState('24');
  // Nouvelle enchère
  const [nouvelle, setNouvelle] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [produits, setProduits] = useState<ProduitChoix[] | null>(null);
  const [choisi, setChoisi] = useState<ProduitChoix | null>(null);
  const [prixDepart, setPrixDepart] = useState('');
  const [prixReserve, setPrixReserve] = useState('');
  const [duree, setDuree] = useState('24');
  const [erreurNouvelle, setErreurNouvelle] = useState('');

  const charger = useCallback(async () => {
    const r = await bq(`/encheres/mes?page=${page}${statut ? `&statut=${statut}` : ''}`);
    if (r.ok) { setData(r.data); setErreur(''); } else setErreur(messageErreur(r));
    setChargement(false);
  }, [page, statut]);
  useEffect(() => { charger(); const t = setInterval(charger, 30000); return () => clearInterval(t); }, [charger]);

  useEffect(() => {
    if (!data || reglOuvert) return;
    const g = data.reglages;
    setActif(g.actif); setDMin(String(g.duree_min_h)); setDMax(String(g.duree_max_jours)); setIncr(String(g.increment_min)); setReserve(g.reserve_permise); setDelai(String(g.delai_paiement_h));
  }, [data, reglOuvert]);

  // Sélecteur de produits (recherche avec délai)
  useEffect(() => {
    if (!nouvelle || choisi) return;
    let annule = false;
    const t = setTimeout(async () => {
      const r = await bq(`/encheres/produits${recherche.trim() ? `?q=${encodeURIComponent(recherche.trim())}` : ''}`);
      if (annule) return;
      if (r.ok) setProduits(r.data.produits || []); else { setProduits([]); setErreurNouvelle(messageErreur(r)); }
    }, 250);
    return () => { annule = true; clearTimeout(t); };
  }, [nouvelle, recherche, choisi]);

  const flash = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 4000); };
  const addonActif = !!(data && data.addon_actif);
  const g = data ? data.reglages : null;

  const enregistrerReglages = async () => {
    setOccupe(true); setErreur('');
    const r = await bq('/encheres/reglages', { method: 'PUT', body: { actif, duree_min_h: Number(dMin), duree_max_jours: Number(dMax), increment_min: Number(String(incr).replace(',', '.')), reserve_permise: reserve, delai_paiement_h: Number(delai) } });
    setOccupe(false);
    if (!r.ok) { setErreurModale(messageErreur(r)); return; }
    setReglOuvert(false); flash('Réglages enregistrés.'); charger();
  };

  const ouvrirNouvelle = () => { setNouvelle(true); setChoisi(null); setRecherche(''); setProduits(null); setPrixDepart(''); setPrixReserve(''); setDuree('24'); setErreurNouvelle(''); };
  const lancer = async () => {
    if (!choisi) return;
    setOccupe(true); setErreurNouvelle('');
    const corps: any = { produit_id: choisi.id, prix_depart: Number(String(prixDepart).replace(',', '.')), duree_heures: Number(String(duree).replace(',', '.')) };
    if (prixReserve.trim()) corps.prix_reserve = Number(prixReserve.replace(',', '.'));
    const r = await bq('/encheres', { method: 'POST', body: corps });
    setOccupe(false);
    if (!r.ok) { setErreurNouvelle(messageErreur(r)); return; }
    setNouvelle(false); flash('Enchère lancée. Une unité du produit est réservée jusqu\'à la fin.'); setStatut(''); setPage(1); charger();
  };
  const annuler = async (e: Enchere) => {
    setOccupe(true);
    const r = await bq(`/encheres/${e.id}/annuler`, { method: 'POST', body: {} });
    setOccupe(false);
    if (!r.ok) { setErreurModale(messageErreur(r)); return; }
    setAAnnuler(null); flash('Enchère annulée. L\'unité est remise en stock.'); charger();
  };

  const carte: CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 };
  const champ: CSSProperties = { padding: '9px 11px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, color: T.text, background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' };
  const btn = (fond: string, texte: string, bordure?: string): CSSProperties => ({ padding: '8px 14px', borderRadius: 8, border: bordure ? `1px solid ${bordure}` : 'none', background: fond, color: texte, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' });
  const champReglage = (libelle: string, aide: string, valeur: string, set: (v: string) => void, min: number, max: number) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: T.text, fontWeight: 700, minWidth: 150, flex: 1 }}>
      {libelle}
      <input type="number" min={min} max={max} step="any" value={valeur} onChange={e => set(e.target.value)} style={{ ...champ, width: '100%' }} />
      <span style={{ fontWeight: 500, fontSize: 11, color: T.light }}>{aide}</span>
    </label>
  );

  if (chargement && !data) return <div style={{ padding: 30, textAlign: 'center', color: T.light }}>Chargement…</div>;
  const compte = data ? data.compte : {};
  const nbTotal = Object.values(compte).reduce((s, n) => s + n, 0);

  return (
    <div style={{ padding: isMobile ? 12 : 20, maxWidth: 1000 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 24, color: T.text }}>🔨 Enchères</h2>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: T.light }}>Lancez une enchère sur un produit : les acheteurs misent, le plus offrant gagne et paie son prix final. <b>Une unité du produit est retirée du stock pendant l'enchère</b> (remise en stock si elle ne se vend pas). Les gagnants retrouvent l'article dans leur panier. Les codes promo ne s'appliquent pas aux articles d'enchère.</p>

      {data && !addonActif && (
        <div style={{ ...carte, marginBottom: 14, background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e', fontSize: 13 }}>
          L'add-on « Enchères » n'est pas activé : vous ne pouvez pas lancer de nouvelle enchère. Les enchères déjà lancées vont jusqu'au bout.
          {pagePlan && naviguerVers && <div style={{ marginTop: 8 }}><button onClick={() => naviguerVers(pagePlan)} style={btn(couleur, '#fff')}>Voir « Mon plan & limites »</button></div>}
        </div>
      )}
      {message && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#ecfdf5', color: '#047857', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{message}</div>}
      {erreur && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', color: '#b91c1c', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{erreur}</div>}

      {addonActif && (
        <>
          <div style={{ ...carte, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>⚙️ Réglages <span style={{ fontWeight: 600, color: T.light, fontSize: 12 }}>— {g ? (g.actif ? `durée ${g.duree_min_h} h à ${g.duree_max_jours} j · incrément min. ${formaterArgent(g.increment_min)} · paiement sous ${g.delai_paiement_h} h` : 'enchères désactivées') : ''}</span></div>
              <button onClick={() => setReglOuvert(!reglOuvert)} style={btn('#fff', T.text, T.border)}>{reglOuvert ? 'Fermer' : 'Modifier'}</button>
            </div>
            {reglOuvert && (
              <div style={{ marginTop: 14 }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, color: T.text, cursor: 'pointer', marginBottom: 10 }}>
                  <input type="checkbox" checked={actif} onChange={e => setActif(e.target.checked)} /> Autoriser le lancement de nouvelles enchères
                </label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, color: T.text, cursor: 'pointer', marginBottom: 14 }}>
                  <input type="checkbox" checked={reserve} onChange={e => setReserve(e.target.checked)} /> Permettre un prix de réserve (jamais montré aux acheteurs)
                </label>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
                  {champReglage('Durée minimale (heures)', '1 à 720 h. Défaut : 1 h.', dMin, setDMin, 1, 720)}
                  {champReglage('Durée maximale (jours)', '1 à 60 jours. Défaut : 14.', dMax, setDMax, 1, 60)}
                  {champReglage('Incrément minimal ($)', 'Hausse minimale entre deux mises. Défaut : 1 $.', incr, setIncr, 0.01, 100000)}
                  {champReglage('Délai de paiement (heures)', "Temps donné au gagnant pour payer. 1 à 24 h. Défaut : 24 h.", delai, setDelai, 1, 24)}
                </div>
                <button disabled={occupe} onClick={enregistrerReglages} style={btn(couleur, '#fff')}>Enregistrer</button>
              </div>
            )}
          </div>
          <div style={{ marginBottom: 14 }}><button onClick={ouvrirNouvelle} disabled={!!g && !g.actif} style={{ ...btn(couleur, '#fff'), opacity: g && !g.actif ? 0.5 : 1 }}>＋ Nouvelle enchère</button>{g && !g.actif && <span style={{ fontSize: 12, color: T.light, marginLeft: 10 }}>Lancement désactivé dans les réglages.</span>}</div>
        </>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {FILTRES.map(([id, label]) => {
          const n = id ? (compte[id] || 0) : nbTotal;
          return (
            <button key={id || 'tous'} onClick={() => { setStatut(id); setPage(1); }} style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${statut === id ? couleur : T.border}`, background: statut === id ? `${couleur}22` : '#fff', color: T.text, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{label} ({n})</button>
          );
        })}
      </div>

      {!data || data.encheres.length === 0 ? <div style={{ ...carte, padding: 30, textAlign: 'center', color: T.light }}>Aucune enchère pour le moment.</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.encheres.map(e => {
            const st = ETATS[e.statut] || ETATS.annulee;
            return (
              <div key={e.id} style={{ ...carte, borderLeft: `4px solid ${st.couleur}` }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {e.image_url ? <img src={e.image_url} alt="" loading="lazy" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: `1px solid ${T.border}`, flexShrink: 0 }} />
                    : <div style={{ width: 56, height: 56, borderRadius: 8, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🔨</div>}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{e.titre}</div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: T.text }}>
                      <span>Départ : <b>{formaterArgent(e.prix_depart)}</b></span>
                      {e.prix_reserve !== null && <span>Réserve : <b>{formaterArgent(e.prix_reserve)}</b>{e.mise_actuelle !== null && e.mise_actuelle >= e.prix_reserve ? <span style={{ color: T.green, fontWeight: 700 }}> ✓ atteinte</span> : ''}</span>}
                      <span>Mise actuelle : <b style={{ color: couleur }}>{e.mise_actuelle !== null ? formaterArgent(e.mise_actuelle) : '—'}</b></span>
                      {e.prix_final !== null && ['attente_paiement', 'payee', 'expiree'].includes(e.statut) && <span>Prix final : <b style={{ color: T.green }}>{formaterArgent(e.prix_final)}</b></span>}
                      <span>{e.nb_mises} mise{e.nb_mises > 1 ? 's' : ''} · {e.nb_encherisseurs} enchérisseur{e.nb_encherisseurs > 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ fontSize: 12, color: T.light, marginTop: 6 }}>
                      {e.statut === 'active' ? `Se termine le ${quand(e.date_fin)}` : `Terminée le ${quand(e.date_fin)}`}
                      {e.statut === 'attente_paiement' && e.paiement_expire_le ? ` · paiement attendu avant le ${quand(e.paiement_expire_le)}` : ''}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 20, color: st.couleur, background: st.fond, whiteSpace: 'nowrap' }}>{st.label}</span>
                </div>
                {e.statut === 'active' && <div style={{ marginTop: 10 }}><button disabled={occupe} onClick={() => setAAnnuler(e)} style={btn('#fff', T.red, T.red)}>Annuler l'enchère</button></div>}
              </div>
            );
          })}
        </div>
      )}

      {data && (page > 1 || data.encheres.length >= 30) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center', marginTop: 16 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ ...champ, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>← Précédent</button>
          <span style={{ fontSize: 12, color: T.light }}>Page {page}</span>
          <button disabled={data.encheres.length < 30} onClick={() => setPage(p => p + 1)} style={{ ...champ, cursor: data.encheres.length < 30 ? 'not-allowed' : 'pointer' }}>Suivant →</button>
        </div>
      )}

      {nouvelle && (
        <div onClick={() => !occupe && setNouvelle(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={ev => ev.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 14, padding: 20, boxSizing: 'border-box' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 10 }}>🔨 Nouvelle enchère</div>
            {!choisi ? (
              <>
                <input autoFocus value={recherche} onChange={ev => setRecherche(ev.target.value)} placeholder="Rechercher un produit ou un SKU…" style={{ ...champ, width: '100%', marginBottom: 10 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
                  {produits === null ? <div style={{ color: T.light, fontSize: 13, padding: 10 }}>Chargement…</div>
                    : produits.length === 0 ? <div style={{ color: T.light, fontSize: 13, padding: 10 }}>Aucun produit actif trouvé.</div>
                    : produits.map(p => (
                      <button key={p.id} disabled={!!p.raison} onClick={() => { setChoisi(p); setPrixDepart(String(Math.max(1, Math.round(p.prix * 0.5)))); setErreurNouvelle(''); }}
                        style={{ display: 'flex', gap: 10, alignItems: 'center', textAlign: 'left', padding: 8, borderRadius: 10, border: `1px solid ${T.border}`, background: p.raison ? '#f9fafb' : '#fff', cursor: p.raison ? 'not-allowed' : 'pointer', opacity: p.raison ? 0.6 : 1, fontFamily: 'inherit' }}>
                        {p.photo ? <img src={p.photo} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} /> : <div style={{ width: 40, height: 40, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titre}</div>
                          <div style={{ fontSize: 12, color: T.light }}>{formaterArgent(p.prix)} · stock {p.stock === null || p.stock === undefined ? 'illimité' : p.stock}{p.raison ? ` · ⛔ ${p.raison}` : ''}</div>
                        </div>
                      </button>
                    ))}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: T.text, marginBottom: 12 }}><b>{choisi.titre}</b> — prix actuel {formaterArgent(choisi.prix)} <button onClick={() => setChoisi(null)} style={{ background: 'none', border: 'none', color: couleur, fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Changer</button></div>
                <label style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Prix de départ ($)</label>
                <input inputMode="decimal" value={prixDepart} onChange={ev => setPrixDepart(ev.target.value)} style={{ ...champ, width: '100%', margin: '4px 0 10px', fontSize: 16 }} />
                {(!g || g.reserve_permise) && (<>
                  <label style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Prix de réserve ($) <span style={{ fontWeight: 500, color: T.light }}>— facultatif, jamais montré. Sous ce prix, pas de vente.</span></label>
                  <input inputMode="decimal" value={prixReserve} onChange={ev => setPrixReserve(ev.target.value)} style={{ ...champ, width: '100%', margin: '4px 0 10px', fontSize: 16 }} />
                </>)}
                <label style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Durée (heures)</label>
                <input inputMode="decimal" value={duree} onChange={ev => setDuree(ev.target.value)} style={{ ...champ, width: '100%', margin: '4px 0 4px', fontSize: 16 }} />
                <div style={{ fontSize: 11, color: T.light, marginBottom: 10 }}>Entre {g ? g.duree_min_h : 1} h et {g ? g.duree_max_jours : 14} jours ({g ? g.duree_max_jours * 24 : 336} h). Incrément : {g ? formaterArgent(g.increment_min) : '1 $'}. Une mise dans les 2 dernières minutes repousse la fin de 2 minutes.</div>
                <div style={{ fontSize: 12, color: '#92400e', background: '#fffbeb', borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>Une unité sera retirée du stock jusqu'à la fin. Pendant l'enchère, vous ne pouvez ni modifier le stock, ni supprimer le produit, ni ajouter une offre du jour.</div>
              </>
            )}
            {erreurNouvelle && <div style={{ marginBottom: 10, color: '#b91c1c', fontSize: 13, fontWeight: 600 }}>{erreurNouvelle}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              {choisi && <button disabled={occupe || !prixDepart || !duree} onClick={lancer} style={{ ...btn(couleur, '#fff'), flex: 1, opacity: !prixDepart || !duree ? 0.5 : 1 }}>{occupe ? '⏳…' : "Lancer l'enchère"}</button>}
              <button disabled={occupe} onClick={() => setNouvelle(false)} style={btn('#fff', T.text, T.border)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {aAnnuler && <BoutiqueModale type="confirmer" accent={couleur} enCours={occupe} titre="Annuler cette enchère ?"
        message={`« ${aAnnuler.titre} » — ${aAnnuler.nb_mises > 0 ? `${aAnnuler.nb_mises} mise${aAnnuler.nb_mises > 1 ? 's' : ''} sera${aAnnuler.nb_mises > 1 ? 'ont' : ''} annulée${aAnnuler.nb_mises > 1 ? 's' : ''}. ` : ''}L'unité est remise en stock. Cette action est définitive.`}
        texteConfirmer="Annuler l'enchère" texteFermer="Garder" onConfirmer={() => annuler(aAnnuler)} onFermer={() => !occupe && setAAnnuler(null)} />}
      {erreurModale && <BoutiqueModale type="erreur" accent={couleur} message={erreurModale} onFermer={() => { setErreurModale(''); }} />}
    </div>
  );
}