import React, { useState, useEffect, useCallback } from 'react';
import { Page } from '@shopify/polaris';

const T = {
  accent: '#537373', accentLight: '#eef3f3',
  bg: '#f4f6f8', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  success: '#008060', warning: '#d97706', danger: '#dc2626',
};

const API = 'https://evend-multivendeur-api.onrender.com/api';

interface FaqItem {
  id: number;
  question: string;
  reponse: string;
  ordre: number;
  active: boolean;
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'danger' }) {
  return (
    <div style={{ position: 'fixed', top: '80px', right: '24px', backgroundColor: type === 'success' ? T.success : T.danger, color: 'white', padding: '12px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', zIndex: 2000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
      {msg}
    </div>
  );
}

export default function MaFaq() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [itemEdite, setItemEdite] = useState<FaqItem | null>(null);
  const [questionDraft, setQuestionDraft] = useState('');
  const [reponseDraft, setReponseDraft] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'danger' } | null>(null);
  const [confirmerSuppr, setConfirmerSuppr] = useState<number | null>(null);

  const showToast = (msg: string, type: 'success' | 'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const token = () => localStorage.getItem('token') || '';
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

  // ── Charger la FAQ ──────────────────────────────────────────────────────
  const chargerFaq = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/faq/ma-faq`, { headers: headers() });
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch {
      showToast('❌ Erreur de chargement', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { chargerFaq(); }, [chargerFaq]);

  // ── Ouvrir formulaire ───────────────────────────────────────────────────
  const ouvrirNouveauFormulaire = () => {
    setItemEdite(null);
    setQuestionDraft('');
    setReponseDraft('');
    setFormulaireOuvert(true);
  };

  const ouvrirEdition = (item: FaqItem) => {
    setItemEdite(item);
    setQuestionDraft(item.question);
    setReponseDraft(item.reponse);
    setFormulaireOuvert(true);
  };

  const fermerFormulaire = () => {
    setFormulaireOuvert(false);
    setItemEdite(null);
    setQuestionDraft('');
    setReponseDraft('');
  };

  // ── Sauvegarder ─────────────────────────────────────────────────────────
  const sauvegarder = async () => {
    if (!questionDraft.trim() || !reponseDraft.trim()) {
      showToast('⚠️ La question et la réponse sont obligatoires.', 'danger');
      return;
    }
    setSaving(true);
    const body = {
      question: questionDraft.trim(),
      reponse: reponseDraft.trim(),
      ordre: itemEdite ? itemEdite.ordre : items.length + 1,
      active: true,
    };
    try {
      let res;
      if (itemEdite) {
        res = await fetch(`${API}/faq/${itemEdite.id}`, {
          method: 'PUT', headers: headers(), body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API}/faq`, {
          method: 'POST', headers: headers(), body: JSON.stringify(body),
        });
      }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur serveur');
      }
      showToast(itemEdite ? '✅ Question mise à jour !' : '✅ Question ajoutée à votre FAQ !', 'success');
      await chargerFaq();
      fermerFormulaire();
    } catch (e: any) {
      showToast('❌ ' + e.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  // ── Supprimer ───────────────────────────────────────────────────────────
  const supprimer = async (id: number) => {
    try {
      await fetch(`${API}/faq/${id}`, { method: 'DELETE', headers: headers() });
      setConfirmerSuppr(null);
      showToast('🗑️ Question supprimée.', 'danger');
      await chargerFaq();
    } catch {
      showToast('❌ Erreur', 'danger');
    }
  };

  // ── Activer/Désactiver ──────────────────────────────────────────────────
  const toggleActive = async (item: FaqItem) => {
    try {
      await fetch(`${API}/faq/${item.id}`, {
        method: 'PUT', headers: headers(),
        body: JSON.stringify({ active: !item.active }),
      });
      showToast('✅ Visibilité mise à jour.', 'success');
      await chargerFaq();
    } catch {
      showToast('❌ Erreur', 'danger');
    }
  };

  // ── Déplacer haut/bas (réordonner) ──────────────────────────────────────
  const deplacer = async (id: number, direction: 'haut' | 'bas') => {
    const idx = items.findIndex(it => it.id === id);
    if (direction === 'haut' && idx === 0) return;
    if (direction === 'bas' && idx === items.length - 1) return;

    const newItems = [...items];
    const swapIdx = direction === 'haut' ? idx - 1 : idx + 1;
    [newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]];
    setItems(newItems);

    // Mettre à jour les ordres en BD
    try {
      await fetch(`${API}/faq/reordonner`, {
        method: 'PUT', headers: headers(),
        body: JSON.stringify({ ordre: newItems.map((it, i) => ({ id: it.id, ordre: i + 1 })) }),
      });
    } catch { /* silencieux */ }
  };

  const itemsFiltres = items.filter(it => {
    const s = recherche.toLowerCase();
    return !s || it.question.toLowerCase().includes(s) || it.reponse.toLowerCase().includes(s);
  });

  const nbActives = items.filter(it => it.active).length;
  const nbInactives = items.filter(it => !it.active).length;

  return (
    <Page title="Ma FAQ" primaryAction={{ content: '+ Ajouter une question', onAction: ouvrirNouveauFormulaire }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Modal suppression */}
      {confirmerSuppr !== null && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', maxWidth: '380px', width: '100%', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '16px 20px', backgroundColor: '#fff5f5', borderBottom: `2px solid ${T.danger}` }}>
              <p style={{ fontSize: '14px', fontWeight: '800', color: T.danger, margin: 0 }}>🗑️ Supprimer cette question ?</p>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: T.text, margin: '0 0 20px 0' }}>Cette action est irréversible.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setConfirmerSuppr(null)} style={{ flex: 1, padding: '10px', border: `1px solid ${T.border}`, borderRadius: '8px', backgroundColor: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Annuler</button>
                <button onClick={() => supprimer(confirmerSuppr!)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: T.danger, color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire ajout/modification */}
      {formulaireOuvert && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '580px', width: '100%', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '18px 22px', backgroundColor: T.accentLight, borderBottom: `2px solid ${T.accent}` }}>
              <p style={{ fontSize: '15px', fontWeight: '800', color: T.accent, margin: 0 }}>
                {itemEdite ? '✏️ Modifier la question' : '➕ Ajouter une question'}
              </p>
            </div>
            <div style={{ padding: '22px' }}>
              {/* Question */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>Question *</label>
                <textarea
                  value={questionDraft}
                  onChange={e => setQuestionDraft(e.target.value)}
                  placeholder="Ex: Quels sont vos délais de livraison?"
                  rows={2}
                  style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '14px', outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', boxSizing: 'border-box' as const }}
                />
              </div>
              {/* Réponse */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>Réponse *</label>
                <textarea
                  value={reponseDraft}
                  onChange={e => setReponseDraft(e.target.value)}
                  placeholder="Ex: Nous expédions dans un délai de 2-3 jours ouvrables..."
                  rows={4}
                  style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '14px', outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', boxSizing: 'border-box' as const }}
                />
              </div>

              {/* Aperçu */}
              {(questionDraft || reponseDraft) && (
                <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', border: `1px solid ${T.border}`, padding: '14px 16px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '10px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, margin: '0 0 10px 0' }}>Aperçu sur votre boutique :</p>
                  {questionDraft && <p style={{ fontSize: '13px', fontWeight: '800', color: T.text, margin: '0 0 6px 0' }}>❓ {questionDraft}</p>}
                  {reponseDraft && <p style={{ fontSize: '13px', color: T.textLight, margin: 0, lineHeight: '1.6' }}>💬 {reponseDraft}</p>}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={fermerFormulaire} style={{ padding: '10px 20px', border: `1px solid ${T.border}`, borderRadius: '8px', backgroundColor: 'white', color: T.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Annuler</button>
                <button onClick={sauvegarder} disabled={saving || !questionDraft.trim() || !reponseDraft.trim()}
                  style={{ padding: '10px 22px', border: 'none', borderRadius: '8px', backgroundColor: !saving && questionDraft.trim() && reponseDraft.trim() ? T.accent : '#aaa', color: 'white', fontSize: '13px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                  {saving ? '⏳...' : itemEdite ? '✅ Mettre à jour' : '✅ Ajouter à ma FAQ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ paddingBottom: '60px' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Questions totales', val: String(items.length), icon: '❓', color: T.accent },
            { label: 'Visibles sur boutique', val: String(nbActives), icon: '👁', color: T.success },
            { label: 'Masquées', val: String(nbInactives), icon: '🙈', color: T.textLight },
          ].map((k, i) => (
            <div key={i} style={{ backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '20px' }}>{k.icon}</span>
                <p style={{ fontSize: '22px', fontWeight: '900', color: k.color, margin: 0 }}>{k.val}</p>
              </div>
              <p style={{ fontSize: '11px', color: T.textLight, margin: 0, fontWeight: '600' }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Barre de recherche */}
        <div style={{ backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '12px 16px', marginBottom: '16px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>🔍</span>
            <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher dans vos questions..."
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '9px 12px 9px 32px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }} />
          </div>
        </div>

        <div style={{ backgroundColor: T.accentLight, border: `1px solid ${T.accent}30`, borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px' }}>💡</span>
          <p style={{ fontSize: '12px', color: T.accent, margin: 0, fontWeight: '600' }}>
            Votre FAQ est visible sur votre boutique publique. Utilisez les flèches pour réordonner les questions.
          </p>
        </div>

        {/* Liste */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: T.textLight }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
            <p style={{ fontSize: '14px' }}>Chargement de la FAQ...</p>
          </div>
        ) : itemsFiltres.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', backgroundColor: T.card, borderRadius: '14px', border: `1px solid ${T.border}`, color: T.textLight }}>
            <div style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.3 }}>❓</div>
            <p style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>Aucune question trouvée</p>
            <p style={{ fontSize: '12px', margin: '0 0 16px 0' }}>Ajoutez votre première question pour aider vos acheteurs !</p>
            <button onClick={ouvrirNouveauFormulaire} style={{ backgroundColor: T.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>+ Ajouter une question</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {itemsFiltres.map((item, idx) => (
              <div key={item.id}
                style={{ backgroundColor: T.card, borderRadius: '14px', border: `1px solid ${item.active ? T.border : '#f0f0f0'}`, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', opacity: item.active ? 1 : 0.65 }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  {/* Numéro + flèches */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <button onClick={() => deplacer(item.id, 'haut')} disabled={idx === 0}
                      style={{ width: '26px', height: '26px', border: `1px solid ${T.border}`, borderRadius: '6px', backgroundColor: idx === 0 ? '#f9f9f9' : 'white', cursor: idx === 0 ? 'not-allowed' : 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: idx === 0 ? '#ccc' : T.textLight }}>↑</button>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: T.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: T.accent }}>{idx + 1}</div>
                    <button onClick={() => deplacer(item.id, 'bas')} disabled={idx === itemsFiltres.length - 1}
                      style={{ width: '26px', height: '26px', border: `1px solid ${T.border}`, borderRadius: '6px', backgroundColor: idx === itemsFiltres.length - 1 ? '#f9f9f9' : 'white', cursor: idx === itemsFiltres.length - 1 ? 'not-allowed' : 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: idx === itemsFiltres.length - 1 ? '#ccc' : T.textLight }}>↓</button>
                  </div>
                  {/* Contenu */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: '800', color: T.text, margin: '0 0 8px 0', lineHeight: '1.4' }}>
                      <span style={{ color: T.accent }}>Q: </span>{item.question}
                    </p>
                    <p style={{ fontSize: '13px', color: T.textLight, margin: 0, lineHeight: '1.6' }}>
                      <span style={{ color: T.success, fontWeight: '700' }}>R: </span>{item.reponse}
                    </p>
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, alignItems: 'flex-end' }}>
                    <span style={{ backgroundColor: item.active ? '#dcfce7' : '#f3f4f6', color: item.active ? T.success : T.textLight, padding: '2px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', marginBottom: '4px' }}>
                      {item.active ? '👁 Visible' : '🙈 Masqué'}
                    </span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => toggleActive(item)}
                        style={{ backgroundColor: item.active ? '#fef9c3' : '#dcfce7', color: item.active ? '#92400e' : T.success, border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                        {item.active ? '🙈 Masquer' : '👁 Afficher'}
                      </button>
                      <button onClick={() => ouvrirEdition(item)}
                        style={{ backgroundColor: T.accentLight, color: T.accent, border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                        ✏️ Modifier
                      </button>
                      <button onClick={() => setConfirmerSuppr(item.id)}
                        style={{ backgroundColor: '#fee2e2', color: T.danger, border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
