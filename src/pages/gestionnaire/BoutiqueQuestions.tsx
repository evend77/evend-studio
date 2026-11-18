// CHEMIN : src/pages/gestionnaire/BoutiqueQuestions.tsx
// e-Vend Studio — Add-on « Questions sur le produit » (templates boutique solo), côté gestionnaire. Adapté de CollaborateurQuestions.tsx + StudioMVQuestions.tsx (MV) : ici le gestionnaire est le vendeur,
// il répond ET modère sur une seule page. Une question n'est publique qu'une fois répondue. L'acheteur est notifié à la première réponse.
// L'interrupteur du haut permet d'accepter ou non les questions (désactivé : bloc caché sur la fiche produit, réponses conservées).
// API : /api/boutique/gestionnaire/questions/(mes | compte | reglage | :id/repondre | :id/masquer | :id/retablir | :id/ignorer-signalements | :id)

import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { bq, messageErreur } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

interface Q {
  id: number; produit_id: number; produit_titre: string; question: string; reponse: string | null; reponse_le: string | null; statut: string;
  masque_raison: string | null; masque_par: string | null; signalements: number; created_at: string; acheteur: string;
}
interface Reponse {
  addon_actif: boolean; questions_actif: boolean; total: number; page: number; pages: number;
  stats: { total: number; attente: number; publiees: number; masquees: number; signalees: number }; questions: Q[];
}
interface Props { gestionnaireId: number; accent?: string; isMobile?: boolean; pagePlan?: string; naviguerVers?: (page: string) => void }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', green: '#10b981', red: '#ef4444' };
const quand = (d: string | null) => { if (!d) return ''; try { return new Date(d).toLocaleString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

export default function BoutiqueQuestions({ accent, isMobile: mobileProp, pagePlan, naviguerVers }: Props) {
  const couleur = accent || '#4f46e5';
  const isMobile = !!mobileProp;
  const [data, setData] = useState<Reponse | null>(null);
  const [statut, setStatut] = useState('attente');
  const [recherche, setRecherche] = useState('');
  const [terme, setTerme] = useState('');
  const [page, setPage] = useState(1);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [brouillons, setBrouillons] = useState<Record<number, string>>({});
  const [edition, setEdition] = useState<number | null>(null);
  const [aMasquer, setAMasquer] = useState<Q | null>(null);
  const [raison, setRaison] = useState('');
  const [aSupprimer, setASupprimer] = useState<Q | null>(null);
  const [confirmerInterrupteur, setConfirmerInterrupteur] = useState(false);
  const [erreurModale, setErreurModale] = useState('');

  const charger = useCallback(async () => {
    const r = await bq(`/questions/mes?statut=${statut}&page=${page}${terme ? `&q=${encodeURIComponent(terme)}` : ''}`);
    if (r.ok) { setData(r.data); setErreur(''); } else setErreur(messageErreur(r));
    setChargement(false);
  }, [statut, page, terme]);
  useEffect(() => { charger(); const t = setInterval(charger, 60000); return () => clearInterval(t); }, [charger]);
  useEffect(() => { const t = setTimeout(() => { setTerme(recherche.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [recherche]);

  const flash = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 4000); };
  const majPastille = () => { try { window.dispatchEvent(new Event('questions-boutique-maj')); } catch { /* ignore */ } };
  const apres = (m: string) => { flash(m); majPastille(); charger(); };
  const addonActif = !!(data && data.addon_actif);
  const accepte = !!(data && data.questions_actif);

  const action = async (chemin: string, methode: string, corps: any, ok: string, fin?: () => void) => {
    setOccupe(true);
    const r = await bq(chemin, { method: methode, body: corps });
    setOccupe(false);
    if (!r.ok) { setErreurModale(messageErreur(r)); return false; }
    if (fin) fin();
    apres(ok); return true;
  };
  const repondre = async (q: Q) => {
    const t = (brouillons[q.id] ?? '').trim();
    await action(`/questions/${q.id}/repondre`, 'POST', { reponse: t }, q.statut === 'attente' ? 'Réponse publiée. L\'acheteur est averti.' : 'Réponse modifiée.', () => { setEdition(null); setBrouillons(b => { const n = { ...b }; delete n[q.id]; return n; }); });
  };
  const basculer = async () => {
    setConfirmerInterrupteur(false);
    await action('/questions/reglage', 'PUT', { actif: !accepte }, accepte ? 'Questions désactivées.' : 'Questions réactivées.');
  };

  const carte: CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 };
  const btn = (fond: string, texte: string, bordure?: string): CSSProperties => ({ padding: '7px 13px', borderRadius: 8, border: bordure ? `1px solid ${bordure}` : 'none', background: fond, color: texte, fontWeight: 800, fontSize: 13, cursor: occupe ? 'wait' : 'pointer', fontFamily: 'inherit' });
  const champ: CSSProperties = { padding: '9px 11px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, color: T.text, background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box', width: '100%' };

  if (chargement && !data) return <div style={{ padding: 30, textAlign: 'center', color: T.light }}>Chargement…</div>;
  const st = data ? data.stats : { total: 0, attente: 0, publiees: 0, masquees: 0, signalees: 0 };
  const FILTRES: [string, string, number][] = [['attente', 'À répondre', st.attente], ['signalees', 'Signalées', st.signalees], ['publiee', 'Publiées', st.publiees], ['masquee', 'Masquées', st.masquees], ['', 'Toutes', st.total]];

  return (
    <div style={{ padding: isMobile ? 12 : 20, maxWidth: 1000 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 24, color: T.text }}>❓ Questions des acheteurs</h2>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: T.light }}>Les acheteurs connectés vous posent des questions sur vos produits. Une question n'apparaît sur la fiche produit qu'<b>une fois que vous y avez répondu</b>. L'acheteur est averti à votre première réponse.</p>

      {data && !addonActif && (
        <div style={{ ...carte, marginBottom: 14, background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e', fontSize: 13 }}>
          L'add-on « Questions sur le produit » n'est pas activé : le bloc n'est pas affiché sur vos fiches et vous ne pouvez pas répondre. Vous pouvez encore modérer l'existant.
          {naviguerVers && pagePlan && <> <button onClick={() => naviguerVers(pagePlan)} style={{ ...btn('#fff', '#92400e', '#fcd34d'), marginLeft: 8 }}>Voir « Mon plan & limites »</button></>}
        </div>
      )}
      {erreur && <div style={{ ...carte, marginBottom: 14, background: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c', fontSize: 13 }}>{erreur}</div>}
      {message && <div role="status" style={{ ...carte, marginBottom: 14, background: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857', fontSize: 13, fontWeight: 700 }}>{message}</div>}

      {addonActif && (
        <div style={{ ...carte, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: accepte ? '#ecfdf5' : '#f3f4f6', borderColor: accepte ? '#a7f3d0' : T.border }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: T.text }}>{accepte ? '✅ Les acheteurs peuvent vous poser des questions' : '⏸️ Les questions sont désactivées'}</div>
            <div style={{ fontSize: 12, color: T.light, marginTop: 2 }}>{accepte ? 'Le bloc « Questions et réponses » est affiché sur vos fiches produit.' : 'Le bloc est caché sur vos fiches, y compris les réponses déjà publiées (elles sont conservées).'}</div>
          </div>
          <button disabled={occupe} onClick={() => accepte ? setConfirmerInterrupteur(true) : basculer()} style={accepte ? btn('#fff', T.red, '#fecaca') : btn(T.green, '#fff')}>{accepte ? 'Désactiver' : 'Réactiver'}</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {FILTRES.map(([k, l, n]) => (
          <button key={k || 'toutes'} onClick={() => { setStatut(k); setPage(1); }} style={{ ...btn(statut === k ? couleur : '#fff', statut === k ? '#fff' : T.text, statut === k ? couleur : T.border), fontWeight: 700 }}>
            {l} <span style={{ opacity: 0.8 }}>({n})</span>
          </button>
        ))}
      </div>
      <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher dans les questions…" aria-label="Rechercher" style={{ ...champ, marginBottom: 14 }} />

      {data && data.questions.length === 0 ? (
        <div style={{ ...carte, textAlign: 'center', color: T.light, padding: 30, fontSize: 14 }}>{statut === 'attente' ? 'Aucune question en attente. 🎉' : 'Aucune question dans cette catégorie.'}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(data ? data.questions : []).map(q => {
            const enEdition = q.statut === 'attente' || edition === q.id;
            const brouillon = brouillons[q.id] ?? (q.reponse || '');
            return (
              <div key={q.id} style={{ ...carte, borderColor: q.signalements > 0 && q.statut === 'publiee' ? '#fca5a5' : T.border }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', fontSize: 12, color: T.light, marginBottom: 6 }}>
                  <span>📦 <b style={{ color: T.text }}>{q.produit_titre}</b></span>
                  <span>
                    {q.statut === 'attente' && <b style={{ color: '#b45309' }}>⏳ À répondre</b>}
                    {q.statut === 'publiee' && <b style={{ color: '#047857' }}>✓ Publiée</b>}
                    {q.statut === 'masquee' && <b style={{ color: '#b91c1c' }}>🚫 Masquée</b>}
                    {q.signalements > 0 && q.statut === 'publiee' && <b style={{ color: T.red, marginLeft: 8 }}>🚩 {q.signalements} signalement{q.signalements > 1 ? 's' : ''}</b>}
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>« {q.question} »</div>
                <div style={{ fontSize: 12, color: T.light, margin: '2px 0 10px' }}>{q.acheteur} · {quand(q.created_at)}</div>

                {q.statut === 'masquee' && (
                  <div style={{ fontSize: 13, color: '#b91c1c', background: '#fef2f2', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
                    Retirée{q.masque_raison ? ` — ${q.masque_raison}` : ''}. {q.reponse ? <span style={{ color: T.light }}>Réponse conservée : {q.reponse}</span> : null}
                  </div>
                )}
                {q.statut !== 'masquee' && !enEdition && q.reponse && (
                  <div style={{ fontSize: 14, color: T.text, background: '#f9fafb', borderRadius: 8, padding: '8px 10px', marginBottom: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    <b style={{ color: '#047857' }}>R :</b> {q.reponse}
                    <div style={{ fontSize: 11, color: T.light, marginTop: 4 }}>Répondu le {quand(q.reponse_le)}</div>
                  </div>
                )}
                {q.statut !== 'masquee' && enEdition && addonActif && (
                  <div style={{ marginBottom: 8 }}>
                    <textarea value={brouillon} onChange={e => setBrouillons(b => ({ ...b, [q.id]: e.target.value.slice(0, 1000) }))} rows={3} placeholder="Votre réponse (visible par tous sur la fiche produit)…" aria-label="Votre réponse" style={{ ...champ, resize: 'vertical' }} />
                    <div style={{ fontSize: 11, color: T.light, margin: '3px 0 6px' }}>{brouillon.length}/1000 · Pas de courriel, de téléphone ni de lien.</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button disabled={occupe || brouillon.trim().length < 2} onClick={() => repondre(q)} style={{ ...btn(couleur, '#fff'), opacity: brouillon.trim().length < 2 ? 0.55 : 1 }}>{q.statut === 'attente' ? 'Publier la réponse' : 'Enregistrer'}</button>
                      {q.statut !== 'attente' && <button onClick={() => setEdition(null)} style={btn('#fff', T.text, T.border)}>Annuler</button>}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {q.statut === 'publiee' && !enEdition && addonActif && <button onClick={() => { setEdition(q.id); setBrouillons(b => ({ ...b, [q.id]: q.reponse || '' })); }} style={btn('#fff', T.text, T.border)}>✏️ Modifier la réponse</button>}
                  {q.statut === 'publiee' && q.signalements > 0 && <button disabled={occupe} onClick={() => action(`/questions/${q.id}/ignorer-signalements`, 'POST', {}, 'Signalements ignorés.')} style={btn('#fff', T.text, T.border)}>Ignorer les signalements</button>}
                  {q.statut !== 'masquee' && <button onClick={() => { setAMasquer(q); setRaison(''); }} style={btn('#fff', '#b45309', '#fcd34d')}>{q.statut === 'publiee' ? 'Retirer' : 'Masquer'}</button>}
                  {q.statut === 'masquee' && <button disabled={occupe} onClick={() => action(`/questions/${q.id}/retablir`, 'POST', {}, 'Question rétablie.')} style={btn('#fff', '#047857', '#a7f3d0')}>Rétablir</button>}
                  <button onClick={() => setASupprimer(q)} style={btn('#fff', T.red, '#fecaca')}>🗑️ Supprimer</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data && data.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, alignItems: 'center', marginTop: 16, fontSize: 13, color: T.light }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ ...btn('#fff', T.text, T.border), opacity: page <= 1 ? 0.5 : 1 }}>← Précédent</button>
          <span>Page {data.page} / {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} style={{ ...btn('#fff', T.text, T.border), opacity: page >= data.pages ? 0.5 : 1 }}>Suivant →</button>
        </div>
      )}

      {confirmerInterrupteur && <BoutiqueModale type="confirmer" accent={couleur} enCours={occupe} titre="Désactiver les questions ?"
        message="Le bloc « Questions et réponses » sera caché sur toutes vos fiches produit, y compris les réponses déjà publiées (elles sont conservées). Les acheteurs ne pourront plus poser de question."
        texteConfirmer="Désactiver" onConfirmer={basculer} onFermer={() => setConfirmerInterrupteur(false)} />}
      {aMasquer && (
        <div role="dialog" aria-modal="true" onClick={() => !occupe && setAMasquer(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 22, width: '100%', maxWidth: 420, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, color: T.text }}>{aMasquer.statut === 'publiee' ? 'Retirer cette question ?' : 'Masquer cette question ?'}</h3>
            <p style={{ margin: '0 0 10px', fontSize: 14, color: '#374151', lineHeight: 1.5 }}>Elle ne sera plus visible sur la fiche produit. Indiquez la raison (obligatoire, 3 caractères minimum) :</p>
            <input autoFocus value={raison} onChange={e => setRaison(e.target.value.slice(0, 200))} placeholder="Ex. : hors sujet" aria-label="Raison" style={champ} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button disabled={occupe} onClick={() => setAMasquer(null)} style={btn('#fff', T.text, T.border)}>Annuler</button>
              <button disabled={occupe || raison.trim().length < 3} style={{ ...btn(couleur, '#fff'), opacity: raison.trim().length < 3 ? 0.55 : 1 }}
                onClick={async () => { const q = aMasquer; if (await action(`/questions/${q.id}/masquer`, 'POST', { raison: raison.trim() }, 'Question masquée.')) setAMasquer(null); }}>{occupe ? '…' : 'Confirmer'}</button>
            </div>
          </div>
        </div>
      )}
      {aSupprimer && <BoutiqueModale type="confirmer" accent={couleur} enCours={occupe} titre="Supprimer cette question ?" message="La question et sa réponse seront supprimées définitivement."
        texteConfirmer="Supprimer" onConfirmer={async () => { const q = aSupprimer; if (await action(`/questions/${q.id}`, 'DELETE', undefined, 'Question supprimée.')) setASupprimer(null); }} onFermer={() => setASupprimer(null)} />}
      {erreurModale && <BoutiqueModale type="erreur" accent={couleur} message={erreurModale} onFermer={() => setErreurModale('')} />}
    </div>
  );
}