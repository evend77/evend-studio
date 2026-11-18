// CHEMIN : src/pages/boutique/MesAvisBoutique.tsx
// e-Vend Studio — Espace acheteur des templates BOUTIQUE (solo) : page « Mes avis » (add-on « Avis clients »). Inspiré de pages/acheteur/MesAvis.tsx (MV), sans y toucher ;
// aucune fenêtre du navigateur (alert/confirm) : les messages et la confirmation de suppression s'affichent dans la page.
// Session : cookie httpOnly (via ba()). API : GET/POST /api/boutique/acheteur/:gid/avis · PUT/DELETE …/avis/:id · POST …/avis/photo (multipart)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ba, messageAcheteur } from './boutiqueAcheteurApi';

interface AEvaluer { commande_id: number; numero_commande: string; produit_id: number; titre: string; photo: string | null; variante: string | null; limite_le: string }
interface MonAvis {
  id: number; produit_id: number; commande_id: number; note: number; titre: string | null; commentaire: string; photos: string[]; statut: 'attente' | 'publie' | 'masque';
  masque_raison: string | null; reponse: string | null; reponse_le: string | null; created_at: string; produit_titre: string | null; photo_principale: string | null; numero_commande: string | null;
}
interface Config { photos_actif: boolean; titre_obligatoire: boolean; max_photos: number; approbation_auto: boolean; commentaire_min: number; commentaire_max: number; titre_max: number }
interface Etat { actif: boolean; a_evaluer: AEvaluer[]; avis: MonAvis[]; config: Config | null }
interface Props { gestionnaireId: number; isMobile?: boolean; couleurAccent?: string; naviguer?: (dest: string) => void }   // naviguer : fourni par l'espace client, non utilisé ici

const C = { border: 'rgba(255,255,255,0.08)', textLight: 'rgba(255,255,255,0.5)', card: 'rgba(255,255,255,0.03)', green: '#10b981', red: '#ef4444', orange: '#f59e0b' };
const date = (d: string) => { try { return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };
const jeton = (gid: number) => { try { return localStorage.getItem(`mv_token_${gid}`); } catch { return null; } };

function Etoiles({ note, taille = 14 }: { note: number; taille?: number }) {
  return <span aria-label={`${note} sur 5`} style={{ fontSize: taille, letterSpacing: 1 }}>{[1, 2, 3, 4, 5].map(i => <span key={i} style={{ color: i <= note ? '#fbbf24' : 'rgba(255,255,255,0.18)' }}>★</span>)}</span>;
}

interface Brouillon { avisId: number | null; produit_id: number; commande_id: number; titre_produit: string; note: number; titre: string; commentaire: string; photos: string[] }

export default function MesAvisBoutique({ gestionnaireId, isMobile = false, couleurAccent = '#fbbf24' }: Props) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<Brouillon | null>(null);
  const [erreurForm, setErreurForm] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [envoiPhoto, setEnvoiPhoto] = useState(false);
  const [aSupprimer, setASupprimer] = useState<MonAvis | null>(null);
  const fichier = useRef<HTMLInputElement>(null);

  const charger = useCallback(async () => {
    const r = await ba(gestionnaireId, '/avis');
    if (r.ok) { setEtat(r.data); setErreur(''); } else setErreur(messageAcheteur(r));
    setChargement(false);
  }, [gestionnaireId]);
  useEffect(() => { charger(); }, [charger]);

  const flash = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 5000); };
  const cfg = etat?.config;

  const ouvrirNouveau = (x: AEvaluer) => { setErreurForm(''); setForm({ avisId: null, produit_id: x.produit_id, commande_id: x.commande_id, titre_produit: x.titre, note: 0, titre: '', commentaire: '', photos: [] }); };
  const ouvrirEdition = (a: MonAvis) => { setErreurForm(''); setForm({ avisId: a.id, produit_id: a.produit_id, commande_id: a.commande_id, titre_produit: a.produit_titre || 'Produit', note: a.note, titre: a.titre || '', commentaire: a.commentaire, photos: a.photos || [] }); };

  const ajouterPhotos = async (liste: FileList | null) => {
    if (!form || !cfg || !liste) return;
    setErreurForm('');
    const places = cfg.max_photos - form.photos.length;
    const choisies = Array.from(liste).slice(0, Math.max(0, places));
    if (liste.length > places) setErreurForm(`Maximum ${cfg.max_photos} photos par avis.`);
    setEnvoiPhoto(true);
    const urls: string[] = [];
    for (const f of choisies) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { setErreurForm(`« ${f.name} » : format non accepté (JPEG, PNG ou WebP).`); continue; }
      if (f.size > 5 * 1024 * 1024) { setErreurForm(`« ${f.name} » dépasse 5 Mo.`); continue; }
      const fd = new FormData(); fd.append('photo', f);
      const h: Record<string, string> = {}; const t = jeton(gestionnaireId); if (t) h.Authorization = `Bearer ${t}`;
      try {
        const r = await fetch(`/api/boutique/acheteur/${gestionnaireId}/avis/photo`, { method: 'POST', credentials: 'include', headers: h, body: fd });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j.url) urls.push(j.url); else setErreurForm(j.message || j.error || "L'envoi de la photo a échoué.");
      } catch { setErreurForm('Erreur réseau pendant l\'envoi de la photo.'); }
    }
    setForm(f => (f ? { ...f, photos: [...f.photos, ...urls] } : f));
    setEnvoiPhoto(false);
    if (fichier.current) fichier.current.value = '';
  };

  const envoyer = async () => {
    if (!form || !cfg) return;
    setErreurForm('');
    if (form.note < 1) { setErreurForm('Choisissez une note de 1 à 5 étoiles.'); return; }
    if (form.commentaire.trim().length < cfg.commentaire_min) { setErreurForm(`Votre commentaire est trop court (au moins ${cfg.commentaire_min} caractères).`); return; }
    if (cfg.titre_obligatoire && !form.titre.trim()) { setErreurForm('Le titre est obligatoire.'); return; }
    setOccupe(true);
    const corps = { produit_id: form.produit_id, commande_id: form.commande_id, note: form.note, titre: form.titre, commentaire: form.commentaire, photos: form.photos };
    const r = form.avisId ? await ba(gestionnaireId, `/avis/${form.avisId}`, { method: 'PUT', body: corps }) : await ba(gestionnaireId, '/avis', { method: 'POST', body: corps });
    setOccupe(false);
    if (!r.ok) { setErreurForm(r.status === 401 ? 'Votre session a expiré. Reconnectez-vous.' : messageAcheteur(r)); return; }
    setForm(null); flash(r.data.message || 'Avis enregistré.'); charger();
  };

  const supprimer = async () => {
    if (!aSupprimer) return;
    setOccupe(true);
    const r = await ba(gestionnaireId, `/avis/${aSupprimer.id}`, { method: 'DELETE' });
    setOccupe(false);
    if (!r.ok) { setErreur(messageAcheteur(r)); setASupprimer(null); return; }
    setASupprimer(null); flash(r.data.message || 'Avis supprimé.'); charger();
  };

  const carte: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: isMobile ? 14 : 18 };
  const bouton = (plein: boolean, danger?: boolean): React.CSSProperties => ({ padding: '9px 16px', borderRadius: 10, border: plein ? 'none' : `1px solid ${danger ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.2)'}`, background: plein ? couleurAccent : 'transparent', color: plein ? '#000' : danger ? '#fca5a5' : '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' });
  const badge = (s: MonAvis['statut']) => s === 'publie' ? { t: '✓ Publié', c: C.green } : s === 'attente' ? { t: '⏳ En attente de vérification', c: C.orange } : { t: '⛔ Retiré par la boutique', c: C.red };

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: C.textLight }}>Chargement…</div>;

  return (
    <div>
      <h2 style={{ margin: '0 0 4px', fontSize: isMobile ? 20 : 24, fontWeight: 800 }}>⭐ Mes avis</h2>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: C.textLight }}>Partagez votre expérience sur les produits que vous avez reçus. Votre avis aide les autres acheteurs.</p>

      {message && <div role="status" style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', fontSize: 13, fontWeight: 600 }}>{message}</div>}
      {erreur && <div role="alert" style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: 13, fontWeight: 600 }}>{erreur}</div>}

      {etat && !etat.actif && <div style={{ ...carte, color: C.textLight, fontSize: 14 }}>Les avis ne sont pas disponibles pour cette boutique.</div>}

      {etat && etat.actif && (
        <>
          <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 800 }}>À évaluer {etat.a_evaluer.length > 0 && <span style={{ color: couleurAccent }}>({etat.a_evaluer.length})</span>}</h3>
          {etat.a_evaluer.length === 0 ? (
            <div style={{ ...carte, color: C.textLight, fontSize: 13, marginBottom: 24 }}>Aucun produit à évaluer pour le moment. Vous pourrez donner votre avis une fois votre commande livrée.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginBottom: 28 }}>
              {etat.a_evaluer.map(x => (
                <div key={`${x.commande_id}-${x.produit_id}`} style={{ ...carte, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 10, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', flexShrink: 0 }}>{x.photo && <img src={x.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.titre}</div>
                    <div style={{ fontSize: 11, color: C.textLight }}>Commande {x.numero_commande} · avant le {date(x.limite_le)}</div>
                  </div>
                  <button onClick={() => ouvrirNouveau(x)} style={bouton(true)}>Évaluer</button>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 800 }}>Mes avis {etat.avis.length > 0 && <span style={{ color: C.textLight }}>({etat.avis.length})</span>}</h3>
          {etat.avis.length === 0 ? (
            <div style={{ ...carte, color: C.textLight, fontSize: 13 }}>Vous n'avez pas encore écrit d'avis.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {etat.avis.map(a => {
                const b = badge(a.statut);
                return (
                  <div key={a.id} style={carte}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', flexShrink: 0 }}>{a.photo_principale && <img src={a.photo_principale} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, wordBreak: 'break-word' }}>{a.produit_titre || 'Produit retiré'}</div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: b.c }}>{b.t}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}><Etoiles note={a.note} /><span style={{ fontSize: 11, color: C.textLight }}>{date(a.created_at)}</span></div>
                        {a.titre && <div style={{ fontSize: 14, fontWeight: 700, marginTop: 8, wordBreak: 'break-word' }}>{a.titre}</div>}
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{a.commentaire}</div>
                        {a.photos.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>{a.photos.map(u => <img key={u} src={u} alt="Photo de l'avis" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.border}` }} />)}</div>}
                        {a.statut === 'masque' && a.masque_raison && <div style={{ marginTop: 10, fontSize: 12, color: '#fca5a5' }}>Raison : {a.masque_raison}</div>}
                        {a.reponse && (
                          <div style={{ marginTop: 12, padding: '10px 12px', borderLeft: `3px solid ${couleurAccent}`, background: 'rgba(255,255,255,0.04)', borderRadius: '0 8px 8px 0' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: couleurAccent, marginBottom: 3 }}>Réponse du vendeur{a.reponse_le ? ` · ${date(a.reponse_le)}` : ''}</div>
                            <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{a.reponse}</div>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                          {a.statut !== 'masque' && <button onClick={() => ouvrirEdition(a)} style={bouton(false)}>Modifier</button>}
                          <button onClick={() => setASupprimer(a)} style={bouton(false, true)}>Supprimer</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {form && cfg && (
        <div onClick={() => !occupe && setForm(null)} role="dialog" aria-modal="true" aria-label="Écrire un avis" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', background: '#17171c', border: `1px solid ${C.border}`, borderRadius: isMobile ? '18px 18px 0 0' : 18, padding: 22, color: '#fff', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 800 }}>{form.avisId ? 'Modifier mon avis' : 'Écrire un avis'}</h3>
            <div style={{ fontSize: 13, color: C.textLight, marginBottom: 16, wordBreak: 'break-word' }}>{form.titre_produit}</div>

            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Votre note *</div>
            <div role="radiogroup" aria-label="Note" style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <button key={i} role="radio" aria-checked={form.note === i} aria-label={`${i} étoile${i > 1 ? 's' : ''}`} onClick={() => setForm({ ...form, note: i })}
                  style={{ background: 'none', border: 'none', padding: 2, fontSize: 34, lineHeight: 1, cursor: 'pointer', color: i <= form.note ? '#fbbf24' : 'rgba(255,255,255,0.2)' }}>★</button>
              ))}
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Titre {cfg.titre_obligatoire ? '*' : '(facultatif)'}</div>
            <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value.slice(0, cfg.titre_max) })} placeholder="Résumez votre avis" aria-label="Titre"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 14, fontFamily: 'inherit', marginBottom: 14 }} />

            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Votre commentaire *</div>
            <textarea value={form.commentaire} onChange={e => setForm({ ...form, commentaire: e.target.value.slice(0, cfg.commentaire_max) })} rows={5} placeholder="Qu'avez-vous pensé de ce produit ?" aria-label="Commentaire"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
            <div style={{ fontSize: 11, color: C.textLight, margin: '4px 0 14px' }}>Pas de courriel, de téléphone ni de lien. {form.commentaire.length}/{cfg.commentaire_max}</div>

            {cfg.photos_actif && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Photos (facultatif, {cfg.max_photos} maximum)</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {form.photos.map(u => (
                    <div key={u} style={{ position: 'relative', width: 64, height: 64 }}>
                      <img src={u} alt="Photo jointe" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.border}` }} />
                      <button onClick={() => setForm({ ...form, photos: form.photos.filter(p => p !== u) })} aria-label="Retirer la photo" style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', border: 'none', background: C.red, color: '#fff', fontSize: 12, cursor: 'pointer', lineHeight: 1 }}>✕</button>
                    </div>
                  ))}
                  {form.photos.length < cfg.max_photos && (
                    <button onClick={() => fichier.current?.click()} disabled={envoiPhoto} style={{ width: 64, height: 64, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.3)', background: 'transparent', color: C.textLight, fontSize: envoiPhoto ? 11 : 24, cursor: envoiPhoto ? 'wait' : 'pointer' }}>{envoiPhoto ? '⏳' : '＋'}</button>
                  )}
                  <input ref={fichier} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => ajouterPhotos(e.target.files)} style={{ display: 'none' }} />
                </div>
              </div>
            )}

            {!cfg.approbation_auto && <div style={{ marginBottom: 12, fontSize: 12, color: '#fcd34d' }}>Votre avis sera publié après vérification par la boutique.</div>}
            {erreurForm && <div role="alert" style={{ marginBottom: 12, padding: '9px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: 13, fontWeight: 600 }}>{erreurForm}</div>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setForm(null)} disabled={occupe} style={bouton(false)}>Annuler</button>
              <button onClick={envoyer} disabled={occupe || envoiPhoto} style={{ ...bouton(true), opacity: occupe || envoiPhoto ? 0.6 : 1 }}>{occupe ? '⏳ Envoi…' : form.avisId ? 'Enregistrer' : 'Publier mon avis'}</button>
            </div>
          </div>
        </div>
      )}

      {aSupprimer && (
        <div onClick={() => !occupe && setASupprimer(null)} role="alertdialog" aria-modal="true" aria-label="Supprimer l'avis" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, background: '#17171c', border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, color: '#fff' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800 }}>Supprimer cet avis ?</h3>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: C.textLight }}>Votre avis sur « {aSupprimer.produit_titre || 'ce produit'} » sera supprimé définitivement, photos comprises.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setASupprimer(null)} disabled={occupe} style={bouton(false)}>Annuler</button>
              <button onClick={supprimer} disabled={occupe} style={{ ...bouton(true), background: C.red, color: '#fff' }}>{occupe ? '⏳…' : 'Supprimer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}