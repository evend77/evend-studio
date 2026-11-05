// CHEMIN : src/pages/collaborateur/CollaborateurFaq.tsx
// e-Vend Studio — Dashboard collaborateur : ma FAQ (questions affichées dans l'onglet « FAQ » de ma boutique)
// Adapté de MaFaq.tsx (e-Vend). API : /api/collab/:gestionnaireId/faq (+ /reordonner)

import React, { useState, useEffect, useCallback } from 'react';

interface FaqItem { id: number; question: string; reponse: string; ordre: number; active: boolean; }
interface Props { gestionnaireId: number; accent: string; isMobile: boolean; }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', success: '#008060', danger: '#dc2626', card: '#fff' };

export default function CollaborateurFaq({ gestionnaireId, accent, isMobile }: Props) {
  const base = `/api/collab/${gestionnaireId}/faq`;
  const [items, setItems] = useState<FaqItem[]>([]);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [formOuvert, setFormOuvert] = useState(false);
  const [edite, setEdite] = useState<FaqItem | null>(null);
  const [question, setQuestion] = useState('');
  const [reponse, setReponse] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [suppr, setSuppr] = useState<number | null>(null);

  const annoncer = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };
  const json = { 'Content-Type': 'application/json' };
  const erreurServeur = async (res: Response) => (await res.json().catch(() => ({}))).error || 'Erreur serveur';

  const charger = useCallback(async () => {
    try {
      const res = await fetch(base, { credentials: 'include' });
      if (res.ok) { const d = await res.json(); setItems(Array.isArray(d) ? d : []); }
      else annoncer('❌ ' + await erreurServeur(res), false);
    } catch { annoncer('❌ Erreur de chargement', false); }
    setChargement(false);
  }, [base]);
  useEffect(() => { charger(); }, [charger]);

  const ouvrirNouveau = () => { setEdite(null); setQuestion(''); setReponse(''); setFormOuvert(true); };
  const ouvrirEdition = (it: FaqItem) => { setEdite(it); setQuestion(it.question); setReponse(it.reponse); setFormOuvert(true); };
  const fermer = () => { setFormOuvert(false); setEdite(null); setQuestion(''); setReponse(''); };

  const sauvegarder = async () => {
    if (!question.trim() || !reponse.trim()) { annoncer('⚠️ La question et la réponse sont obligatoires.', false); return; }
    setOccupe(true);
    try {
      const res = await fetch(edite ? `${base}/${edite.id}` : base, { method: edite ? 'PUT' : 'POST', credentials: 'include', headers: json, body: JSON.stringify({ question: question.trim(), reponse: reponse.trim() }) });
      if (!res.ok) throw new Error(await erreurServeur(res));
      annoncer(edite ? '✅ Question mise à jour !' : '✅ Question ajoutée à votre FAQ !', true);
      await charger(); fermer();
    } catch (e: any) { annoncer('❌ ' + (e.message || 'Erreur'), false); }
    setOccupe(false);
  };

  const supprimer = async (id: number) => {
    try {
      const res = await fetch(`${base}/${id}`, { method: 'DELETE', credentials: 'include' });
      setSuppr(null);
      if (res.ok) { annoncer('🗑️ Question supprimée.', true); await charger(); } else annoncer('❌ ' + await erreurServeur(res), false);
    } catch { annoncer('❌ Erreur', false); }
  };

  const basculer = async (it: FaqItem) => {
    try {
      const res = await fetch(`${base}/${it.id}`, { method: 'PUT', credentials: 'include', headers: json, body: JSON.stringify({ active: !it.active }) });
      if (res.ok) { annoncer('✅ Visibilité mise à jour.', true); await charger(); } else annoncer('❌ ' + await erreurServeur(res), false);
    } catch { annoncer('❌ Erreur', false); }
  };

  const deplacer = async (id: number, sens: 'haut' | 'bas') => {
    const i = items.findIndex(x => x.id === id), j = sens === 'haut' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= items.length) return;
    const nouveau = [...items];
    [nouveau[i], nouveau[j]] = [nouveau[j], nouveau[i]];
    setItems(nouveau);
    try {
      const res = await fetch(`${base}/reordonner`, { method: 'PUT', credentials: 'include', headers: json, body: JSON.stringify({ ordre: nouveau.map(x => ({ id: x.id })) }) });
      if (!res.ok) { annoncer('❌ ' + await erreurServeur(res), false); await charger(); }
    } catch { annoncer('❌ Erreur réseau', false); await charger(); }
  };

  const filtres = items.filter(it => { const q = recherche.toLowerCase(); return !q || it.question.toLowerCase().includes(q) || it.reponse.toLowerCase().includes(q); });
  const nbActives = items.filter(it => it.active).length;
  const champ: React.CSSProperties = { width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' };
  const lib: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase', display: 'block', marginBottom: 8, letterSpacing: 0.5 };

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? 14 : 20 }}>
      {toast && <div role="status" style={{ position: 'fixed', top: 80, right: 24, background: toast.ok ? T.success : T.danger, color: '#fff', padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>{toast.msg}</div>}

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 12, marginBottom: 20, borderBottom: `2px solid ${T.border}`, paddingBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 24, color: T.text }}>❓ Ma FAQ</h2>
        <button onClick={ouvrirNouveau} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ Ajouter une question</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
        {[{ l: 'Questions totales', v: items.length, i: '❓', c: accent }, { l: 'Visibles sur ma boutique', v: nbActives, i: '👁', c: T.success }, { l: 'Masquées', v: items.length - nbActives, i: '🙈', c: T.light }].map(k => (
          <div key={k.l} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 20 }}>{k.i}</span><span style={{ fontSize: 22, fontWeight: 900, color: k.c }}>{k.v}</span></div>
            <div style={{ fontSize: 11, color: T.light, fontWeight: 600 }}>{k.l}</div>
          </div>
        ))}
      </div>

      <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔍</span>
          <input value={recherche} maxLength={100} autoComplete="off" onChange={e => setRecherche(e.target.value.replace(/[<>\u0000-\u001F]/g, ''))} placeholder="Rechercher dans vos questions…"
            style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px 9px 32px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={{ background: `${accent}14`, border: `1px solid ${accent}40`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>💡</span>
        <p style={{ fontSize: 12, color: T.text, margin: 0, fontWeight: 600 }}>Votre FAQ apparaît dans l'onglet « FAQ » de votre boutique publique (au moins une question visible). Utilisez les flèches pour changer l'ordre.</p>
      </div>

      {filtres.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 50, background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, color: T.light }}>
          <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 10 }}>❓</div>
          <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>Aucune question trouvée</p>
          <p style={{ fontSize: 12, margin: '0 0 16px' }}>Ajoutez votre première question pour aider vos acheteurs !</p>
          <button onClick={ouvrirNouveau} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Ajouter une question</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtres.map((it, idx) => (
            <div key={it.id} style={{ background: T.card, borderRadius: 14, border: `1px solid ${it.active ? T.border : '#f0f0f0'}`, padding: isMobile ? 16 : '18px 20px', opacity: it.active ? 1 : 0.65 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                {!recherche && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => deplacer(it.id, 'haut')} disabled={idx === 0} aria-label="Monter" style={{ width: 26, height: 26, border: `1px solid ${T.border}`, borderRadius: 6, background: '#fff', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: idx === 0 ? '#ccc' : T.light }}>↑</button>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: accent }}>{idx + 1}</div>
                    <button onClick={() => deplacer(it.id, 'bas')} disabled={idx === filtres.length - 1} aria-label="Descendre" style={{ width: 26, height: 26, border: `1px solid ${T.border}`, borderRadius: 6, background: '#fff', cursor: idx === filtres.length - 1 ? 'not-allowed' : 'pointer', color: idx === filtres.length - 1 ? '#ccc' : T.light }}>↓</button>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: isMobile ? 200 : 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 8px', lineHeight: 1.4, overflowWrap: 'anywhere' }}><span style={{ color: accent }}>Q : </span>{it.question}</p>
                  <p style={{ fontSize: 13, color: T.light, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}><span style={{ color: T.success, fontWeight: 700 }}>R : </span>{it.reponse}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, alignItems: 'flex-end' }}>
                  <span style={{ background: it.active ? '#dcfce7' : '#f3f4f6', color: it.active ? T.success : T.light, padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{it.active ? '👁 Visible' : '🙈 Masqué'}</span>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button onClick={() => basculer(it)} style={{ background: it.active ? '#fef9c3' : '#dcfce7', color: it.active ? '#92400e' : T.success, border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{it.active ? '🙈 Masquer' : '👁 Afficher'}</button>
                    <button onClick={() => ouvrirEdition(it)} style={{ background: `${accent}18`, color: accent, border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✏️ Modifier</button>
                    <button onClick={() => setSuppr(it.id)} aria-label="Supprimer" style={{ background: '#fee2e2', color: T.danger, border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {suppr !== null && (
        <div onClick={() => setSuppr(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, maxWidth: 380, width: '100%', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: '#fff5f5', borderBottom: `2px solid ${T.danger}` }}><p style={{ fontSize: 14, fontWeight: 800, color: T.danger, margin: 0 }}>🗑️ Supprimer cette question ?</p></div>
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13, color: T.text, margin: '0 0 20px' }}>Cette action est irréversible.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setSuppr(null)} style={{ flex: 1, padding: 10, border: `1px solid ${T.border}`, borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                <button onClick={() => supprimer(suppr)} style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: T.danger, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {formOuvert && (
        <div onClick={fermer} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, maxWidth: 580, width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ padding: '18px 22px', background: `${accent}14`, borderBottom: `2px solid ${accent}` }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: accent, margin: 0 }}>{edite ? '✏️ Modifier la question' : '➕ Ajouter une question'}</p>
            </div>
            <div style={{ padding: 22 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={lib}>Question *</label>
                <textarea value={question} maxLength={300} rows={2} onChange={e => setQuestion(e.target.value)} placeholder="Ex : Quels sont vos délais de livraison ?" style={champ} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={lib}>Réponse *</label>
                <textarea value={reponse} maxLength={2000} rows={4} onChange={e => setReponse(e.target.value)} placeholder="Ex : Nous expédions dans un délai de 2 à 3 jours ouvrables…" style={champ} />
              </div>
              {(question || reponse) && (
                <div style={{ background: '#f8fafc', borderRadius: 10, border: `1px solid ${T.border}`, padding: '14px 16px', marginBottom: 20 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: T.light, textTransform: 'uppercase', margin: '0 0 10px' }}>Aperçu sur votre boutique :</p>
                  {question && <p style={{ fontSize: 13, fontWeight: 800, color: T.text, margin: '0 0 6px', overflowWrap: 'anywhere' }}>❓ {question}</p>}
                  {reponse && <p style={{ fontSize: 13, color: T.light, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>💬 {reponse}</p>}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={fermer} style={{ padding: '10px 20px', border: `1px solid ${T.border}`, borderRadius: 8, background: '#fff', color: T.text, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                <button onClick={sauvegarder} disabled={occupe || !question.trim() || !reponse.trim()}
                  style={{ padding: '10px 22px', border: 'none', borderRadius: 8, background: !occupe && question.trim() && reponse.trim() ? accent : '#aaa', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                  {occupe ? '⏳…' : edite ? '✅ Mettre à jour' : '✅ Ajouter à ma FAQ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}