// CHEMIN : src/pages/collaborateur/CollaborateurQuestions.tsx
// e-Vend Studio — Dashboard collaborateur : questions des acheteurs sur mes annonces (add-on « Questions sur le produit »).
// Répondre publie la question avec sa réponse sur la page de l'annonce. Un interrupteur permet de refuser les questions.
// API : /api/marketplace/:gid/questions/collaborateur/(mes|compte|reglage|:id/repondre|:id/refuser)

import React, { useState, useEffect, useCallback } from 'react';

interface Question {
  id: number; produit_id: number; produit_titre: string | null; question: string; reponse: string | null; reponse_le: string | null;
  statut: 'attente' | 'publiee' | 'masquee'; masque_raison: string | null; masque_par: string | null; created_at: string; acheteur: string;
}
interface Reponse { addon_actif: boolean; questions_actif: boolean; questions: Question[]; total: number; page: number; pages: number; stats: { attente: number; publiee: number; masquee: number } }
interface Props { gestionnaireId: number; accent: string; isMobile: boolean; }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', green: '#10b981', red: '#ef4444', orange: '#f59e0b' };
const dateCourte = (d: string | null) => { try { return d ? new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : ''; } catch { return ''; } };
const MAX = 1000;

export default function CollaborateurQuestions({ gestionnaireId, accent, isMobile }: Props) {
  const base = `/api/marketplace/${gestionnaireId}/questions/collaborateur`;
  const [data, setData] = useState<Reponse | null>(null);
  const [statut, setStatut] = useState<'attente' | 'publiee' | 'masquee' | ''>('attente');
  const [page, setPage] = useState(1);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [brouillons, setBrouillons] = useState<Record<number, string>>({});
  const [edition, setEdition] = useState<number | null>(null);
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true); setErreur('');
    try {
      const p = new URLSearchParams({ page: String(page) });
      if (statut) p.set('statut', statut);
      const r = await fetch(`${base}/mes?${p}`, { credentials: 'include' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erreur de chargement');
      setData(j);
    } catch (e: any) { setErreur(e.message || 'Erreur de chargement'); }
    finally { setChargement(false); }
  }, [base, page, statut]);
  useEffect(() => { charger(); }, [charger]);

  const flash = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 4000); };
  const maj = () => { charger(); window.dispatchEvent(new Event('questions-collab-maj')); };

  const envoyer = async (path: string, methode: string, corps?: object) => {
    setOccupe(true); setErreur('');
    try {
      const r = await fetch(`${base}${path}`, { method: methode, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: corps ? JSON.stringify(corps) : undefined });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Erreur');
      return j;
    } catch (e: any) { setErreur(e.message || 'Erreur'); return null; }
    finally { setOccupe(false); }
  };

  const repondre = async (q: Question) => {
    const t = (brouillons[q.id] ?? (edition === q.id ? q.reponse || '' : '')).trim();
    if (t.length < 2) { setErreur('Écrivez votre réponse.'); return; }
    const j = await envoyer(`/${q.id}/repondre`, 'POST', { reponse: t });
    if (j) { flash(j.message || 'Réponse publiée.'); setBrouillons(b => { const n = { ...b }; delete n[q.id]; return n; }); setEdition(null); maj(); }
  };
  const refuser = async (q: Question) => {
    if (!window.confirm('Retirer cette question ? Elle ne sera pas affichée sur l\'annonce.')) return;
    const j = await envoyer(`/${q.id}/refuser`, 'POST', { raison: 'Question hors sujet' });
    if (j) { flash('Question retirée.'); maj(); }
  };
  const basculer = async (actif: boolean) => {
    const j = await envoyer('/reglage', 'PUT', { actif });
    if (j) { flash(j.message || 'Réglage enregistré.'); charger(); }
  };

  const chip = (id: typeof statut, label: string, n?: number) => (
    <button key={id || 'tous'} onClick={() => { setStatut(id); setPage(1); }}
      style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${statut === id ? accent : T.border}`, background: statut === id ? `${accent}18` : '#fff', color: statut === id ? accent : T.text, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
      {label}{n !== undefined ? ` (${n})` : ''}
    </button>
  );

  const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 14 : 18 };

  if (data && !data.addon_actif) {
    return <div style={{ ...carte, textAlign: 'center', color: T.light }}>L'option « Questions sur le produit » n'est pas activée pour cette marketplace.</div>;
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 4px', fontSize: isMobile ? 20 : 24, color: T.text }}>💬 Questions des acheteurs</h2>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: T.light }}>Quand vous répondez, la question et votre réponse s'affichent sur la page de l'annonce pour tous les acheteurs.</p>

      {message && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#ecfdf5', color: '#047857', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{message}</div>}
      {erreur && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', color: '#b91c1c', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{erreur}</div>}

      {/* Interrupteur : le vendeur peut refuser les questions */}
      {data && (
        <div style={{ ...carte, display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{data.questions_actif ? '✅ Les acheteurs peuvent vous poser des questions' : '⏸️ Les questions sont désactivées sur vos annonces'}</div>
            <div style={{ fontSize: 12, color: T.light, marginTop: 2 }}>{data.questions_actif ? 'Vous pouvez les désactiver à tout moment. Les réponses déjà publiées sont alors masquées (et conservées).' : 'Aucun bloc « Questions et réponses » n\'apparaît sur vos annonces.'}</div>
          </div>
          <button disabled={occupe} onClick={() => basculer(!data.questions_actif)}
            style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${data.questions_actif ? T.red : T.green}`, background: '#fff', color: data.questions_actif ? T.red : T.green, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            {data.questions_actif ? 'Désactiver' : 'Réactiver'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {chip('attente', 'À répondre', data?.stats.attente)}
        {chip('publiee', 'Publiées', data?.stats.publiee)}
        {chip('masquee', 'Retirées', data?.stats.masquee)}
        {chip('', 'Toutes')}
      </div>

      {chargement && !data ? <div style={{ ...carte, textAlign: 'center', color: T.light }}>Chargement…</div>
        : !data || data.questions.length === 0 ? <div style={{ ...carte, textAlign: 'center', color: T.light }}>{statut === 'attente' ? 'Aucune question à répondre. 🎉' : 'Aucune question.'}</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.questions.map(q => {
              const enEdition = edition === q.id;
              const valeur = brouillons[q.id] ?? (enEdition ? q.reponse || '' : '');
              return (
                <div key={q.id} style={{ ...carte, borderLeft: `4px solid ${q.statut === 'attente' ? T.orange : q.statut === 'publiee' ? T.green : T.red}` }}>
                  <div style={{ fontSize: 12, color: T.light, marginBottom: 6 }}>
                    Sur « <b style={{ color: T.text }}>{q.produit_titre || 'annonce supprimée'}</b> » · {q.acheteur} · {dateCourte(q.created_at)}
                    {q.statut === 'masquee' && <span style={{ color: T.red, fontWeight: 700 }}> · Retirée{q.masque_par === 'gestionnaire' ? ' par le gestionnaire' : ''}{q.masque_raison ? ` (${q.masque_raison})` : ''}</span>}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>« {q.question} »</div>

                  {q.statut === 'publiee' && !enEdition && (
                    <div style={{ marginTop: 10, padding: '10px 12px', background: '#f0fdf4', borderRadius: 8, fontSize: 14, color: T.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      <div style={{ fontSize: 11, color: T.light, marginBottom: 2 }}>Votre réponse · {dateCourte(q.reponse_le)}</div>
                      {q.reponse}
                      <div style={{ marginTop: 8 }}>
                        <button onClick={() => { setEdition(q.id); setBrouillons(b => ({ ...b, [q.id]: q.reponse || '' })); }} style={{ background: 'none', border: 'none', color: accent, fontWeight: 700, fontSize: 12, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>✏️ Modifier la réponse</button>
                      </div>
                    </div>
                  )}

                  {(q.statut === 'attente' || enEdition) && (
                    <div style={{ marginTop: 10 }}>
                      <textarea value={valeur} onChange={e => setBrouillons(b => ({ ...b, [q.id]: e.target.value.slice(0, MAX) }))} rows={3} placeholder="Votre réponse (visible par tous sur l'annonce)…"
                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
                        <button disabled={occupe} onClick={() => repondre(q)} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: accent, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{enEdition ? 'Enregistrer' : 'Publier la réponse'}</button>
                        {enEdition && <button onClick={() => { setEdition(null); setBrouillons(b => { const n = { ...b }; delete n[q.id]; return n; }); }} style={{ padding: '9px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: '#fff', color: T.text, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>}
                        {q.statut === 'attente' && <button disabled={occupe} onClick={() => refuser(q)} style={{ padding: '9px 14px', borderRadius: 8, border: `1px solid ${T.red}`, background: '#fff', color: T.red, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Retirer la question</button>}
                        <span style={{ fontSize: 11, color: T.light }}>Sans courriel, téléphone ni lien · {valeur.length}/{MAX}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {data && data.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center', marginTop: 16 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>← Précédent</button>
          <span style={{ fontSize: 12, color: T.light }}>Page {data.page} / {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: '#fff', cursor: page >= data.pages ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>Suivant →</button>
        </div>
      )}
    </div>
  );
}