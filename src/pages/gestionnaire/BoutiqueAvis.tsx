// CHEMIN : src/pages/gestionnaire/BoutiqueAvis.tsx
// e-Vend Studio — Add-on « Avis clients » (templates boutique solo), côté gestionnaire. Inspiré de StudioMVAvis.tsx + CollaborateurAvis.tsx (MV) : ici le gestionnaire est le vendeur,
// il modère (approuver, retirer, rétablir, supprimer) ET répond, sur une seule page. Onglet « Réglages » : approbation automatique, photos, titre obligatoire, moyenne affichée,
// délai « expédiée depuis N jours » (1 à 30) et délai pour déposer un avis (30 à 365) — les bornes sont aussi imposées par le serveur.
// API : /api/boutique/gestionnaire/avis/(mes | compte | reglages | :id/approuver | :id/masquer | :id/retablir | :id/repondre | :id/reponse | :id)

import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { bq, messageErreur } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

interface Avis {
  id: number; produit_id: number; produit_titre: string | null; produit_photo: string | null; numero_commande: string | null; note: number; titre: string | null; commentaire: string;
  photos: string[]; statut: 'attente' | 'publie' | 'masque'; masque_raison: string | null; reponse: string | null; reponse_le: string | null; created_at: string; ancien: boolean; acheteur: string;
}
interface Config { approbation_auto: boolean; photos_actif: boolean; titre_obligatoire: boolean; afficher_moyenne: boolean; delai_depot_jours: number; delai_expedie_jours: number }
interface Reponse {
  addon_actif: boolean; config: Config; total: number; page: number; pages: number;
  stats: { total: number; attente: number; publies: number; masques: number; moyenne: number }; avis: Avis[];
}
interface Props { gestionnaireId: number; accent?: string; isMobile?: boolean; pagePlan?: string; naviguerVers?: (page: string) => void }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', green: '#10b981', red: '#ef4444' };
const quand = (d: string | null) => { if (!d) return ''; try { return new Date(d).toLocaleString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };
const Etoiles = ({ note }: { note: number }) => <span style={{ color: '#f59e0b', letterSpacing: 1 }}>{'★'.repeat(note)}<span style={{ color: '#d1d5db' }}>{'★'.repeat(5 - note)}</span></span>;

export default function BoutiqueAvis({ accent, isMobile: mobileProp, pagePlan, naviguerVers }: Props) {
  const couleur = accent || '#4f46e5';
  const isMobile = !!mobileProp;
  const [onglet, setOnglet] = useState<'avis' | 'reglages'>('avis');
  const [data, setData] = useState<Reponse | null>(null);
  const [statut, setStatut] = useState('attente');
  const [noteFiltre, setNoteFiltre] = useState('');
  const [recherche, setRecherche] = useState('');
  const [terme, setTerme] = useState('');
  const [page, setPage] = useState(1);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [brouillons, setBrouillons] = useState<Record<number, string>>({});
  const [edition, setEdition] = useState<number | null>(null);
  const [aMasquer, setAMasquer] = useState<Avis | null>(null);
  const [raison, setRaison] = useState('');
  const [aSupprimer, setASupprimer] = useState<Avis | null>(null);
  const [erreurModale, setErreurModale] = useState('');
  const [guide, setGuide] = useState('');
  const [reglages, setReglages] = useState<Config | null>(null);
  const [confirmerReinit, setConfirmerReinit] = useState(false);
  const [photoGrande, setPhotoGrande] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const r = await bq(`/avis/mes?statut=${statut}&page=${page}${noteFiltre ? `&note=${noteFiltre}` : ''}${terme ? `&q=${encodeURIComponent(terme)}` : ''}`);
    if (r.ok) { setData(r.data); setErreur(''); setReglages(prev => prev || r.data.config); } else setErreur(messageErreur(r));
    setChargement(false);
  }, [statut, page, noteFiltre, terme]);
  useEffect(() => { charger(); const t = setInterval(charger, 60000); return () => clearInterval(t); }, [charger]);
  useEffect(() => { const t = setTimeout(() => { setTerme(recherche.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [recherche]);
  useEffect(() => { bq('/addons').then(a => { if (a.ok && Array.isArray(a.data.addons)) { const g = a.data.addons.find((y: any) => y.code === 'avis_clients'); if (g && g.guide_url) setGuide(g.guide_url); } }); }, []);

  const flash = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 4000); };
  const majPastille = () => { try { window.dispatchEvent(new Event('avis-boutique-maj')); } catch { /* ignore */ } };
  const addonActif = !!(data && data.addon_actif);

  const action = async (chemin: string, methode: string, corps: any, ok: string, fin?: () => void) => {
    setOccupe(true);
    const r = await bq(chemin, { method: methode, body: corps });
    setOccupe(false);
    if (!r.ok) { setErreurModale(messageErreur(r)); return false; }
    if (fin) fin();
    flash(ok); majPastille(); charger(); return true;
  };
  const repondre = async (a: Avis) => {
    const t = (brouillons[a.id] ?? '').trim();
    await action(`/avis/${a.id}/repondre`, 'POST', { reponse: t }, a.reponse ? 'Réponse modifiée.' : 'Réponse publiée. L\'acheteur est averti.', () => { setEdition(null); setBrouillons(b => { const n = { ...b }; delete n[a.id]; return n; }); });
  };
  const enregistrer = async () => {
    if (!reglages) return;
    setOccupe(true);
    const r = await bq('/avis/reglages', { method: 'PUT', body: reglages });
    setOccupe(false);
    if (!r.ok) { setErreurModale(messageErreur(r)); return; }
    setReglages(r.data.config); flash('Réglages enregistrés.'); charger();
  };
  const reinitialiser = async () => {
    setConfirmerReinit(false); setOccupe(true);
    const r = await bq('/avis/reglages', { method: 'DELETE' });
    setOccupe(false);
    if (!r.ok) { setErreurModale(messageErreur(r)); return; }
    setReglages(r.data.config); flash('Réglages réinitialisés.'); charger();
  };

  const carte: CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 };
  const btn = (fond: string, texte: string, bordure?: string): CSSProperties => ({ padding: '7px 13px', borderRadius: 8, border: bordure ? `1px solid ${bordure}` : 'none', background: fond, color: texte, fontWeight: 800, fontSize: 13, cursor: occupe ? 'wait' : 'pointer', fontFamily: 'inherit' });
  const champ: CSSProperties = { padding: '9px 11px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, color: T.text, background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box', width: '100%' };

  if (chargement && !data) return <div style={{ padding: 30, textAlign: 'center', color: T.light }}>Chargement…</div>;
  const st = data ? data.stats : { total: 0, attente: 0, publies: 0, masques: 0, moyenne: 0 };
  const FILTRES: [string, string, number][] = [['attente', 'À traiter', st.attente], ['publie', 'Publiés', st.publies], ['masque', 'Retirés', st.masques], ['', 'Tous', st.total]];
  const interrupteur = (cle: 'approbation_auto' | 'photos_actif' | 'titre_obligatoire' | 'afficher_moyenne', titre: string, aide: string) => reglages && (
    <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}>
      <input type="checkbox" checked={reglages[cle]} onChange={e => setReglages({ ...reglages, [cle]: e.target.checked })} style={{ width: 18, height: 18, marginTop: 2, accentColor: couleur }} />
      <span><span style={{ display: 'block', fontWeight: 700, fontSize: 14, color: T.text }}>{titre}</span><span style={{ display: 'block', fontSize: 12, color: T.light, marginTop: 2 }}>{aide}</span></span>
    </label>
  );

  return (
    <div style={{ padding: isMobile ? 12 : 20, maxWidth: 1000 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 24, color: T.text }}>⭐ Avis clients
        {guide && <a href={guide} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: couleur, textDecoration: 'none', border: `1px solid ${couleur}`, borderRadius: 12, padding: '2px 10px', marginLeft: 10, verticalAlign: 'middle' }}>📖 Guide</a>}
      </h2>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: T.light }}>Les acheteurs évaluent les produits qu'ils ont reçus. Vous approuvez, retirez ou répondez aux avis. Les avis publiés apparaissent sur la fiche du produit.</p>

      {data && !addonActif && (
        <div style={{ ...carte, marginBottom: 14, background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e', fontSize: 13 }}>
          L'add-on « Avis clients » n'est pas activé : les avis ne sont pas affichés sur vos fiches et vous ne pouvez ni approuver, ni répondre, ni changer les réglages. Vous pouvez encore retirer ou supprimer un avis.
          {naviguerVers && pagePlan && <> <button onClick={() => naviguerVers(pagePlan)} style={{ ...btn('#fff', '#92400e', '#fcd34d'), marginLeft: 8 }}>Voir « Mon plan & limites »</button></>}
        </div>
      )}
      {erreur && <div style={{ ...carte, marginBottom: 14, background: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c', fontSize: 13 }}>{erreur}</div>}
      {message && <div role="status" style={{ ...carte, marginBottom: 14, background: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857', fontSize: 13, fontWeight: 700 }}>{message}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {([['avis', `Avis${st.attente > 0 ? ` (${st.attente} à traiter)` : ''}`], ['reglages', 'Réglages']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setOnglet(k)} style={{ ...btn(onglet === k ? couleur : '#fff', onglet === k ? '#fff' : T.text, onglet === k ? couleur : T.border), fontWeight: 700 }}>{l}</button>
        ))}
      </div>

      {onglet === 'reglages' && reglages && (
        <div style={carte}>
          {interrupteur('approbation_auto', 'Publier les avis automatiquement', "Activé : un avis est visible tout de suite. Désactivé : chaque avis attend votre approbation (il n'est jamais publié à votre place).")}
          {interrupteur('photos_actif', 'Accepter les photos', "Les acheteurs peuvent joindre jusqu'à 5 photos (JPEG, PNG, WebP, 5 Mo chacune).")}
          {interrupteur('titre_obligatoire', 'Titre obligatoire', "Sinon le titre de l'avis est facultatif.")}
          {interrupteur('afficher_moyenne', 'Afficher la note moyenne et la répartition', 'Sur la fiche produit, au-dessus de la liste des avis.')}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, padding: '14px 0' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 4 }}>Commande expédiée depuis (jours)</label>
              <input type="number" min={1} max={30} value={reglages.delai_expedie_jours} onChange={e => setReglages({ ...reglages, delai_expedie_jours: Number(e.target.value) })} style={champ} aria-label="Délai expédiée depuis" />
              <div style={{ fontSize: 12, color: T.light, marginTop: 4 }}>Entre 1 et 30 jours. Un acheteur peut évaluer une commande livrée, ou expédiée depuis ce nombre de jours même si vous ne l'avez pas marquée « livrée ». Cette règle est toujours active.</div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 4 }}>Délai pour déposer un avis (jours)</label>
              <input type="number" min={30} max={365} value={reglages.delai_depot_jours} onChange={e => setReglages({ ...reglages, delai_depot_jours: Number(e.target.value) })} style={champ} aria-label="Délai pour déposer un avis" />
              <div style={{ fontSize: 12, color: T.light, marginTop: 4 }}>Entre 30 et 365 jours après la livraison (ou après le délai ci-contre).</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button disabled={occupe || !addonActif} onClick={enregistrer} style={{ ...btn(couleur, '#fff'), opacity: addonActif ? 1 : 0.55 }}>Enregistrer</button>
            <button disabled={occupe} onClick={() => setConfirmerReinit(true)} style={btn('#fff', T.text, T.border)}>Réinitialiser</button>
          </div>
        </div>
      )}

      {onglet === 'avis' && (
        <>
          {st.total > 0 && <div style={{ fontSize: 13, color: T.light, marginBottom: 10 }}>Note moyenne des avis publiés : <b style={{ color: T.text }}>{st.moyenne.toFixed(1)} / 5</b></div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {FILTRES.map(([k, l, n]) => (
              <button key={k || 'tous'} onClick={() => { setStatut(k); setPage(1); }} style={{ ...btn(statut === k ? couleur : '#fff', statut === k ? '#fff' : T.text, statut === k ? couleur : T.border), fontWeight: 700 }}>{l} <span style={{ opacity: 0.8 }}>({n})</span></button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 160px', gap: 8, marginBottom: 14 }}>
            <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher (produit, titre, commentaire)…" aria-label="Rechercher" style={champ} />
            <select value={noteFiltre} onChange={e => { setNoteFiltre(e.target.value); setPage(1); }} aria-label="Filtrer par note" style={champ}>
              <option value="">Toutes les notes</option>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} étoile{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>

          {data && data.avis.length === 0 ? (
            <div style={{ ...carte, textAlign: 'center', color: T.light, padding: 30, fontSize: 14 }}>{statut === 'attente' ? 'Aucun avis à traiter. 🎉' : 'Aucun avis dans cette catégorie.'}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(data ? data.avis : []).map(a => {
                const enEdition = edition === a.id;
                const brouillon = brouillons[a.id] ?? (a.reponse || '');
                return (
                  <div key={a.id} style={{ ...carte, borderColor: a.ancien ? '#fcd34d' : T.border, background: a.ancien ? '#fffdf5' : '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', fontSize: 12, color: T.light, marginBottom: 6 }}>
                      <span>📦 <b style={{ color: T.text }}>{a.produit_titre || 'Produit retiré'}</b>{a.numero_commande ? ` · commande ${a.numero_commande}` : ''}</span>
                      <span>
                        {a.statut === 'attente' && <b style={{ color: '#b45309' }}>⏳ À traiter{a.ancien ? ' · en attente depuis plus de 3 jours' : ''}</b>}
                        {a.statut === 'publie' && <b style={{ color: '#047857' }}>✓ Publié</b>}
                        {a.statut === 'masque' && <b style={{ color: '#b91c1c' }}>🚫 Retiré</b>}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}><Etoiles note={a.note} /><span style={{ fontSize: 12, color: T.light }}>{a.acheteur} · {quand(a.created_at)}</span></div>
                    {a.titre && <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginTop: 6, wordBreak: 'break-word' }}>{a.titre}</div>}
                    <div style={{ fontSize: 14, color: '#374151', marginTop: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{a.commentaire}</div>
                    {a.photos.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>{a.photos.map(u => <button key={u} onClick={() => setPhotoGrande(u)} aria-label="Agrandir la photo" style={{ padding: 0, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', width: 60, height: 60, cursor: 'zoom-in', background: 'none' }}><img src={u} alt="Photo de l'avis" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></button>)}</div>}
                    {a.statut === 'masque' && <div style={{ fontSize: 13, color: '#b91c1c', background: '#fef2f2', borderRadius: 8, padding: '8px 10px', marginTop: 8 }}>Retiré{a.masque_raison ? ` — ${a.masque_raison}` : ''}.</div>}
                    {a.statut === 'publie' && !enEdition && a.reponse && (
                      <div style={{ fontSize: 14, color: T.text, background: '#f9fafb', borderRadius: 8, padding: '8px 10px', marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        <b style={{ color: '#047857' }}>Votre réponse :</b> {a.reponse}<div style={{ fontSize: 11, color: T.light, marginTop: 4 }}>Le {quand(a.reponse_le)}</div>
                      </div>
                    )}
                    {a.statut === 'publie' && enEdition && addonActif && (
                      <div style={{ marginTop: 8 }}>
                        <textarea value={brouillon} onChange={e => setBrouillons(b => ({ ...b, [a.id]: e.target.value.slice(0, 1000) }))} rows={3} placeholder="Votre réponse (visible par tous sur la fiche produit)…" aria-label="Votre réponse" style={{ ...champ, resize: 'vertical' }} />
                        <div style={{ fontSize: 11, color: T.light, margin: '3px 0 6px' }}>{brouillon.length}/1000 · Pas de courriel, de téléphone ni de lien.</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button disabled={occupe || brouillon.trim().length < 2} onClick={() => repondre(a)} style={{ ...btn(couleur, '#fff'), opacity: brouillon.trim().length < 2 ? 0.55 : 1 }}>{a.reponse ? 'Enregistrer' : 'Publier la réponse'}</button>
                          <button onClick={() => setEdition(null)} style={btn('#fff', T.text, T.border)}>Annuler</button>
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                      {a.statut === 'attente' && addonActif && <button disabled={occupe} onClick={() => action(`/avis/${a.id}/approuver`, 'POST', {}, 'Avis publié. L\'acheteur est averti.')} style={btn(T.green, '#fff')}>✓ Approuver</button>}
                      {a.statut === 'publie' && !enEdition && addonActif && <button onClick={() => { setEdition(a.id); setBrouillons(b => ({ ...b, [a.id]: a.reponse || '' })); }} style={btn('#fff', T.text, T.border)}>{a.reponse ? '✏️ Modifier la réponse' : '💬 Répondre'}</button>}
                      {a.statut === 'publie' && a.reponse && addonActif && <button disabled={occupe} onClick={() => action(`/avis/${a.id}/reponse`, 'DELETE', undefined, 'Réponse retirée.')} style={btn('#fff', T.text, T.border)}>Retirer ma réponse</button>}
                      {a.statut !== 'masque' && <button onClick={() => { setAMasquer(a); setRaison(''); }} style={btn('#fff', '#b45309', '#fcd34d')}>{a.statut === 'publie' ? 'Retirer' : 'Refuser'}</button>}
                      {a.statut === 'masque' && <button disabled={occupe} onClick={() => action(`/avis/${a.id}/retablir`, 'POST', {}, 'Avis rétabli.')} style={btn('#fff', '#047857', '#a7f3d0')}>Rétablir</button>}
                      <button onClick={() => setASupprimer(a)} style={btn('#fff', T.red, '#fecaca')}>🗑️ Supprimer</button>
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
        </>
      )}

      {confirmerReinit && <BoutiqueModale type="confirmer" accent={couleur} enCours={occupe} titre="Réinitialiser les réglages ?" message="Les réglages des avis reviennent aux valeurs par défaut (publication automatique, photos acceptées, 14 jours, 60 jours). Les avis existants ne changent pas."
        texteConfirmer="Réinitialiser" onConfirmer={reinitialiser} onFermer={() => setConfirmerReinit(false)} />}
      {aMasquer && (
        <div role="dialog" aria-modal="true" onClick={() => !occupe && setAMasquer(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 22, width: '100%', maxWidth: 420, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, color: T.text }}>{aMasquer.statut === 'publie' ? 'Retirer cet avis ?' : 'Refuser cet avis ?'}</h3>
            <p style={{ margin: '0 0 10px', fontSize: 14, color: '#374151', lineHeight: 1.5 }}>Il ne sera plus visible sur la fiche produit et son auteur ne pourra plus le modifier. Indiquez la raison (obligatoire, 3 caractères minimum) :</p>
            <input autoFocus value={raison} onChange={e => setRaison(e.target.value.slice(0, 200))} placeholder="Ex. : propos non conformes" aria-label="Raison" style={champ} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button disabled={occupe} onClick={() => setAMasquer(null)} style={btn('#fff', T.text, T.border)}>Annuler</button>
              <button disabled={occupe || raison.trim().length < 3} style={{ ...btn(couleur, '#fff'), opacity: raison.trim().length < 3 ? 0.55 : 1 }}
                onClick={async () => { const a = aMasquer; if (await action(`/avis/${a.id}/masquer`, 'POST', { raison: raison.trim() }, 'Avis retiré.')) setAMasquer(null); }}>{occupe ? '…' : 'Confirmer'}</button>
            </div>
          </div>
        </div>
      )}
      {aSupprimer && <BoutiqueModale type="confirmer" accent={couleur} enCours={occupe} titre="Supprimer cet avis ?" message="L'avis, sa réponse et ses photos seront supprimés définitivement. Pour seulement le cacher, utilisez « Retirer »."
        texteConfirmer="Supprimer" onConfirmer={async () => { const a = aSupprimer; if (await action(`/avis/${a.id}`, 'DELETE', undefined, 'Avis supprimé.')) setASupprimer(null); }} onFermer={() => setASupprimer(null)} />}
      {photoGrande && (
        <div onClick={() => setPhotoGrande(null)} role="dialog" aria-label="Photo agrandie" style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' }}>
          <img src={photoGrande} alt="Photo de l'avis agrandie" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
        </div>
      )}
      {erreurModale && <BoutiqueModale type="erreur" accent={couleur} message={erreurModale} onFermer={() => setErreurModale('')} />}
    </div>
  );
}