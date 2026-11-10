// CHEMIN : src/templates/multivendeur/MVQuestionsProduit.tsx
// e-Vend Studio — Add-on « Questions sur le produit » : bloc « Questions et réponses » sur la page produit.
// Seules les questions déjà répondues par le vendeur sont publiques. L'acheteur connecté peut poser une question.
// API : /api/marketplace/:gid/questions/produit/:produitId  (GET public, POST acheteur) · /:id/signaler
// Le bloc n'apparaît pas si l'add-on est inactif ou si le vendeur a désactivé les questions (le serveur répond actif:false).

import { useState, useEffect, useCallback } from 'react';

interface Q { id: number; question: string; reponse: string; reponse_le: string; created_at: string; auteur: string; }
interface Etat { actif: boolean; boutique?: string | null; total: number; page: number; pages: number; questions: Q[]; peut_poser: boolean; mes_en_attente: { id: number; question: string; created_at: string }[]; }
interface Props {
  gestionnaireId: number | string | undefined;
  produitId: number;
  couleurAccent: string;
  allerConnexion: () => void;
  isDemo?: boolean;
}

const MAX = 500;
const date = (d: string) => { try { return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };

export default function MVQuestionsProduit({ gestionnaireId, produitId, couleurAccent, allerConnexion, isDemo }: Props) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texte: string } | null>(null);
  const [signalees, setSignalees] = useState<Set<number>>(new Set());
  const base = `/api/marketplace/${gestionnaireId}/questions`;

  const charger = useCallback(async (page = 1) => {
    if (isDemo || !gestionnaireId || !produitId) return;
    try {
      const r = await fetch(`${base}/produit/${produitId}?page=${page}`, { credentials: 'include' });
      if (!r.ok) return;
      const j: Etat = await r.json();
      setEtat(j);
      setQuestions(prev => (page === 1 ? j.questions || [] : [...prev, ...(j.questions || [])]));
    } catch { /* le bloc reste caché */ }
  }, [base, produitId, gestionnaireId, isDemo]);

  useEffect(() => { setEtat(null); setQuestions([]); setTexte(''); setMsg(null); charger(1); }, [charger]);

  if (!etat || !etat.actif) return null;

  const poser = async () => {
    setMsg(null);
    if (texte.trim().length < 10) { setMsg({ ok: false, texte: 'Votre question est trop courte (au moins 10 caractères).' }); return; }
    setEnvoi(true);
    try {
      const r = await fetch(`${base}/produit/${produitId}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: texte }) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) { setMsg({ ok: false, texte: 'Votre session a expiré. Reconnectez-vous pour poser une question.' }); }
      else if (!r.ok) setMsg({ ok: false, texte: j.error || 'Impossible d\'envoyer la question.' });
      else { setMsg({ ok: true, texte: j.message || 'Question envoyée.' }); setTexte(''); charger(1); }
    } catch { setMsg({ ok: false, texte: 'Erreur réseau. Réessayez.' }); }
    setEnvoi(false);
  };

  const signaler = async (id: number) => {
    try {
      const r = await fetch(`${base}/${id}/signaler`, { method: 'POST', credentials: 'include' });
      if (r.ok) setSignalees(prev => new Set(prev).add(id));
    } catch { /* ignore */ }
  };

  const carte: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 16px' };

  return (
    <section aria-label="Questions et réponses" style={{ margin: '40px 0' }}>
      <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
        💬 Questions et réponses{etat.total > 0 ? ` (${etat.total})` : ''}
      </h3>
      <p style={{ margin: '0 0 18px', fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Une question sur cette annonce ? Posez-la au vendeur : la réponse sera visible par tous.</p>

      {/* Formulaire */}
      <div style={{ ...carte, marginBottom: 18 }}>
        {etat.peut_poser ? (
          <>
            <textarea value={texte} onChange={e => setTexte(e.target.value.slice(0, MAX))} rows={3} placeholder="Écrivez votre question…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(0,0,0,0.25)', color: '#fff', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Pas de courriel, de téléphone ni de lien. {texte.length}/{MAX}</span>
              <button onClick={poser} disabled={envoi || texte.trim().length === 0}
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: couleurAccent, color: '#000', fontWeight: 800, fontSize: 14, cursor: envoi || !texte.trim() ? 'not-allowed' : 'pointer', opacity: envoi || !texte.trim() ? 0.6 : 1, fontFamily: 'inherit' }}>
                {envoi ? '⏳ Envoi…' : 'Poser ma question'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>Connectez-vous avec un compte acheteur pour poser une question.</span>
            <button onClick={allerConnexion} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: couleurAccent, color: '#000', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Mon compte</button>
          </div>
        )}
        {msg && <div role="status" style={{ marginTop: 10, padding: '9px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: msg.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.ok ? '#6ee7b7' : '#fca5a5' }}>{msg.texte}</div>}
      </div>

      {/* Mes questions en attente */}
      {etat.mes_en_attente.length > 0 && (
        <div style={{ ...carte, marginBottom: 18, borderColor: 'rgba(251,191,36,0.35)', background: 'rgba(251,191,36,0.06)' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#fcd34d', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>⏳ Vos questions en attente de réponse</div>
          {etat.mes_en_attente.map(m => (
            <div key={m.id} style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', padding: '4px 0' }}>« {m.question} »</div>
          ))}
        </div>
      )}

      {/* Questions publiées */}
      {questions.length === 0 ? (
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Aucune question pour le moment. Soyez le premier à en poser une.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {questions.map(q => (
            <div key={q.id} style={carte}>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontWeight: 800, color: couleurAccent, flexShrink: 0 }}>Q</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{q.question}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{q.auteur} · {date(q.created_at)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontWeight: 800, color: '#34d399', flexShrink: 0 }}>R</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{q.reponse}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span>Réponse de {etat.boutique || 'le vendeur'} · {date(q.reponse_le)}</span>
                    {etat.peut_poser && (signalees.has(q.id)
                      ? <span>✓ Signalée</span>
                      : <button onClick={() => signaler(q.id)} style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.45)', fontSize: 12, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>Signaler</button>)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {etat.page < etat.pages && (
            <button onClick={() => charger(etat.page + 1)} style={{ alignSelf: 'center', padding: '9px 22px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Voir plus de questions
            </button>
          )}
        </div>
      )}
    </section>
  );
}