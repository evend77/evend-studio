// CHEMIN : src/pages/boutique/QuestionsProduitBoutique.tsx
// e-Vend Studio — Add-on « Questions sur le produit » (templates boutique solo) : bloc « Questions et réponses » de la fiche produit (thème sombre). Adapté de MVQuestionsProduit.tsx (MV).
// Seules les questions déjà répondues par le vendeur sont publiques. L'acheteur connecté peut poser une question (elle reste invisible jusqu'à la réponse) et signaler une réponse.
// Le bloc n'apparaît pas si l'add-on est inactif ou si le vendeur a coupé les questions (le serveur répond actif:false).
// API : GET /api/boutique/questions/:gid/produit/:id (public) · POST /api/boutique/acheteur/:gid/questions/produit/:id · POST …/questions/:id/signaler

import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { ba, messageAcheteur } from './boutiqueAcheteurApi';
import { tons } from '../../components/tonsBoutique';   // thème sombre (défaut) ou clair

interface Q { id: number; question: string; reponse: string; reponse_le: string; created_at: string; auteur: string }
interface Etat { actif: boolean; total: number; page: number; pages: number; questions: Q[]; peut_poser: boolean; mes_en_attente: { id: number; question: string; created_at: string }[] }
interface Props { gestionnaireId: number; produitId: number; couleurAccent: string; allerConnexion: () => void; isDemo?: boolean; clair?: boolean }

const MAX = 500;
// Mémoire entre deux affichages (la fiche produit se remonte quand la page se redessine) : évite le clignotement
const MEMO: Record<string, { etat: Etat; questions: Q[] }> = {};
const date = (d: string) => { try { return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };
const jeton = (gid: number) => { try { return localStorage.getItem(`mv_token_${gid}`); } catch { return null; } };

export default function QuestionsProduitBoutique({ gestionnaireId, produitId, couleurAccent, allerConnexion, isDemo, clair }: Props) {
  const T = tons(clair);
  const cle = `${gestionnaireId}:${produitId}`;
  const [etat, setEtat] = useState<Etat | null>(MEMO[cle]?.etat || null);
  const [questions, setQuestions] = useState<Q[]>(MEMO[cle]?.questions || []);
  const [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texte: string } | null>(null);
  const [signalees, setSignalees] = useState<Set<number>>(new Set());

  const charger = useCallback(async (page = 1) => {
    if (isDemo || !gestionnaireId || !produitId) return;
    try {
      const h: Record<string, string> = {}; const t = jeton(gestionnaireId); if (t) h.Authorization = `Bearer ${t}`;
      const r = await fetch(`/api/boutique/questions/${gestionnaireId}/produit/${produitId}?page=${page}`, { credentials: 'include', headers: h });
      if (!r.ok) return;
      const j: Etat = await r.json();
      setEtat(j);
      setQuestions(prev => { const q = page === 1 ? j.questions || [] : [...prev, ...(j.questions || [])]; MEMO[cle] = { etat: j, questions: q }; return q; });
    } catch { /* le bloc reste caché */ }
  }, [gestionnaireId, produitId, isDemo, cle]);

  useEffect(() => { setMsg(null); setTexte(''); charger(1); }, [charger]);

  if (!etat || !etat.actif) return null;

  const poser = async () => {
    setMsg(null);
    if (texte.trim().length < 10) { setMsg({ ok: false, texte: 'Votre question est trop courte (au moins 10 caractères).' }); return; }
    setEnvoi(true);
    const r = await ba(gestionnaireId, `/questions/produit/${produitId}`, { method: 'POST', body: { question: texte } });
    if (r.status === 401) setMsg({ ok: false, texte: 'Votre session a expiré. Reconnectez-vous pour poser une question.' });
    else if (!r.ok) setMsg({ ok: false, texte: messageAcheteur(r) });
    else { setMsg({ ok: true, texte: r.data.message || 'Question envoyée.' }); setTexte(''); charger(1); }
    setEnvoi(false);
  };
  const signaler = async (id: number) => {
    const r = await ba(gestionnaireId, `/questions/${id}/signaler`, { method: 'POST', body: {} });
    if (r.ok) setSignalees(prev => new Set(prev).add(id));
  };

  const carte: CSSProperties = { background: T.b(0.04), border: `1px solid ${T.b(0.1)}`, borderRadius: 14, padding: '14px 16px' };
  const vide = envoi || !texte.trim();

  return (
    <section aria-label="Questions et réponses" style={{ margin: '40px 0' }}>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: T.txt, margin: '0 0 6px' }}>💬 Questions et réponses{etat.total > 0 ? ` (${etat.total})` : ''}</h3>
      <p style={{ margin: '0 0 18px', fontSize: 13, color: T.b(0.55) }}>Une question sur ce produit ? Posez-la au vendeur : la réponse sera visible par tous.</p>

      <div style={{ ...carte, marginBottom: 18 }}>
        {etat.peut_poser ? (
          <>
            <textarea value={texte} onChange={e => setTexte(e.target.value.slice(0, MAX))} rows={3} placeholder="Écrivez votre question…" aria-label="Votre question"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: `1px solid ${T.b(0.18)}`, background: T.champ, color: T.txt, fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: T.b(0.45) }}>Pas de courriel, de téléphone ni de lien. {texte.length}/{MAX}</span>
              <button onClick={poser} disabled={vide} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: couleurAccent, color: T.sur, fontWeight: 800, fontSize: 14, cursor: vide ? 'not-allowed' : 'pointer', opacity: vide ? 0.6 : 1, fontFamily: 'inherit' }}>
                {envoi ? '⏳ Envoi…' : 'Poser ma question'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: T.b(0.75) }}>Connectez-vous avec un compte acheteur pour poser une question.</span>
            <button onClick={allerConnexion} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: couleurAccent, color: T.sur, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Mon compte</button>
          </div>
        )}
        {msg && <div role="status" style={{ marginTop: 10, padding: '9px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: msg.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.ok ? T.ok : T.err }}>{msg.texte}</div>}
      </div>

      {etat.mes_en_attente.length > 0 && (
        <div style={{ ...carte, marginBottom: 18, borderColor: 'rgba(251,191,36,0.35)', background: 'rgba(251,191,36,0.06)' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.avert, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>⏳ Vos questions en attente de réponse</div>
          {etat.mes_en_attente.map(m => <div key={m.id} style={{ fontSize: 14, color: T.b(0.85), padding: '4px 0', wordBreak: 'break-word' }}>« {m.question} »</div>)}
        </div>
      )}

      {questions.length === 0 ? (
        <p style={{ fontSize: 14, color: T.b(0.45), margin: 0 }}>Aucune question pour le moment. Soyez le premier à en poser une.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {questions.map(q => (
            <div key={q.id} style={carte}>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontWeight: 800, color: couleurAccent, flexShrink: 0 }}>Q</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.txt, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{q.question}</div>
                  <div style={{ fontSize: 12, color: T.b(0.45), marginTop: 2 }}>{q.auteur} · {date(q.created_at)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.b(0.08)}` }}>
                <span style={{ fontWeight: 800, color: T.okVif, flexShrink: 0 }}>R</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: T.b(0.88), whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{q.reponse}</div>
                  <div style={{ fontSize: 12, color: T.b(0.45), marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span>Réponse du vendeur · {date(q.reponse_le)}</span>
                    {etat.peut_poser && (signalees.has(q.id)
                      ? <span>✓ Signalée</span>
                      : <button onClick={() => signaler(q.id)} style={{ background: 'none', border: 'none', padding: 0, color: T.b(0.45), fontSize: 12, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>Signaler</button>)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {etat.page < etat.pages && (
            <button onClick={() => charger(etat.page + 1)} style={{ alignSelf: 'center', padding: '9px 22px', borderRadius: 10, background: T.b(0.08), border: `1px solid ${T.b(0.18)}`, color: T.txt, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Voir plus de questions</button>
          )}
        </div>
      )}
    </section>
  );
}