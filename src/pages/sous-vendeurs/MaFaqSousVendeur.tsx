/**
 * MaFaqSousVendeur.tsx — e-Vend Studio
 * Chemin : src/pages/sous-vendeurs/MaFaqSousVendeur.tsx
 *
 * Page FAQ pour le sous-vendeur — inspiré de MaFaq.tsx d'e-Vend
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = (window as any).API_BASE || 'http://localhost:5000/api';

const T = {
  accent: '#c9a96e', accentLight: 'rgba(201,169,110,0.12)',
  bg: '#f4f6f8', card: '#fff', border: '#e2e8f0',
  text: '#1e293b', textLight: '#64748b',
  success: '#10b981', warning: '#f59e0b', danger: '#ef4444',
};

interface FaqItem {
  id: number; question: string; reponse: string;
  statut: 'actif' | 'inactif' | 'brouillon' | 'en_attente' | 'refuse';
  ordre: number; created_at: string;
}

interface Props { vendeurId: number; sousVendeurId: number; }

function Toast({ msg, type }: { msg: string; type: 'success'|'danger' }) {
  return (
    <div style={{ position: 'fixed', top: '80px', right: '24px', backgroundColor: type === 'success' ? T.success : T.danger, color: 'white', padding: '12px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
      {msg}
    </div>
  );
}

export default function MaFaqSousVendeur({ vendeurId, sousVendeurId }: Props) {
  const token  = localStorage.getItem('token');
  const hdrs   = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const apiUrl = `${API_BASE}/studio/faqs-sv/${vendeurId}/mes-faqs/${sousVendeurId}`;

  const [items, setItems]                   = useState<FaqItem[]>([]);
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [recherche, setRecherche]           = useState('');
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [itemEdite, setItemEdite]           = useState<FaqItem | null>(null);
  const [questionDraft, setQuestionDraft]   = useState('');
  const [reponseDraft, setReponseDraft]     = useState('');
  const [statutDraft, setStatutDraft]       = useState<'actif'|'brouillon'>('actif');
  const [toast, setToast]                   = useState<{ msg: string; type: 'success'|'danger' } | null>(null);
  const [confirmerSuppr, setConfirmerSuppr] = useState<number | null>(null);

  const showToast = (msg: string, type: 'success'|'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(apiUrl, { headers: hdrs as any });
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch { showToast('❌ Erreur de chargement', 'danger'); }
    finally { setLoading(false); }
  }, [sousVendeurId, vendeurId]);

  useEffect(() => { charger(); }, [charger]);

  const ouvrirNouveauFormulaire = () => {
    setItemEdite(null);
    setQuestionDraft(''); setReponseDraft(''); setStatutDraft('actif');
    setFormulaireOuvert(true);
  };

  const ouvrirEdition = (item: FaqItem) => {
    setItemEdite(item);
    setQuestionDraft(item.question);
    setReponseDraft(item.reponse);
    setStatutDraft(item.statut === 'actif' ? 'actif' : 'brouillon');
    setFormulaireOuvert(true);
  };

  const fermerFormulaire = () => {
    setFormulaireOuvert(false);
    setItemEdite(null);
    setQuestionDraft(''); setReponseDraft('');
  };

  const sauvegarder = async () => {
    if (!questionDraft.trim() || !reponseDraft.trim()) {
      showToast('⚠️ La question et la réponse sont obligatoires.', 'danger');
      return;
    }
    setSaving(true);
    const body = { question: questionDraft.trim(), reponse: reponseDraft.trim(), statut: statutDraft };
    try {
      const res = itemEdite
        ? await fetch(`${apiUrl}/${itemEdite.id}`, { method: 'PUT',  headers: hdrs as any, body: JSON.stringify(body) })
        : await fetch(apiUrl,                       { method: 'POST', headers: hdrs as any, body: JSON.stringify(body) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erreur'); }
      const data = await res.json();
      if (data.en_attente) {
        showToast('⏳ Question soumise — en attente d\'approbation.', 'success');
      } else {
        showToast(itemEdite ? '✅ Question mise à jour !' : '✅ Question ajoutée à votre FAQ !', 'success');
      }
      await charger();
      fermerFormulaire();
    } catch (e: any) { showToast('❌ ' + e.message, 'danger'); }
    finally { setSaving(false); }
  };

  const supprimer = async (id: number) => {
    try {
      await fetch(`${apiUrl}/${id}`, { method: 'DELETE', headers: hdrs as any });
      setConfirmerSuppr(null);
      showToast('🗑️ Question supprimée.', 'danger');
      await charger();
    } catch { showToast('❌ Erreur', 'danger'); }
  };

  const toggleStatut = async (item: FaqItem) => {
    const nouveau = item.statut === 'actif' ? 'brouillon' : 'actif';
    try {
      await fetch(`${apiUrl}/${item.id}`, {
        method: 'PUT', headers: hdrs as any, body: JSON.stringify({ statut: nouveau }),
      });
      showToast('✅ Visibilité mise à jour.', 'success');
      await charger();
    } catch { showToast('❌ Erreur', 'danger'); }
  };

  const deplacer = async (id: number, direction: 'haut'|'bas') => {
    const idx = items.findIndex(it => it.id === id);
    if (direction === 'haut' && idx === 0) return;
    if (direction === 'bas' && idx === items.length - 1) return;
    const newItems = [...items];
    const swapIdx = direction === 'haut' ? idx - 1 : idx + 1;
    [newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]];
    setItems(newItems);
    try {
      await fetch(`${API_BASE}/studio/faqs-sv/${vendeurId}/mes-faqs/${sousVendeurId}/reordonner`, {
        method: 'PUT', headers: hdrs as any,
        body: JSON.stringify({ ordre: newItems.map((it, i) => ({ id: it.id, ordre: i + 1 })) }),
      });
    } catch { /* silencieux */ }
  };

  const estActif = (item: FaqItem) => item.statut === 'actif';
  const itemsFiltres = items.filter(it => {
    const s = recherche.toLowerCase();
    return !s || it.question.toLowerCase().includes(s) || it.reponse.toLowerCase().includes(s);
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px', fontFamily: 'system-ui, sans-serif', background: T.bg, minHeight: '100vh' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Modal suppression */}
      {confirmerSuppr !== null && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', maxWidth: '380px', width: '100%', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '16px 20px', backgroundColor: '#fff5f5', borderBottom: `2px solid ${T.danger}` }}>
              <p style={{ fontSize: '14px', fontWeight: '800', color: T.danger, margin: 0 }}>🗑️ Supprimer cette question ?</p>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: T.text, margin: '0 0 20px' }}>Cette action est irréversible.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setConfirmerSuppr(null)} style={{ flex: 1, padding: '10px', border: `1px solid ${T.border}`, borderRadius: '8px', backgroundColor: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Annuler</button>
                <button onClick={() => supprimer(confirmerSuppr!)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: T.danger, color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal formulaire */}
      {formulaireOuvert && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }} onClick={e => e.target === e.currentTarget && fermerFormulaire()}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '580px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '18px 24px', background: 'linear-gradient(135deg, #1a2436, #c9a96e)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>{itemEdite ? '✏️ Modifier la question' : '❓ Nouvelle question'}</p>
              <button onClick={fermerFormulaire} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              {/* Question */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>Question *</label>
                <textarea value={questionDraft} onChange={e => setQuestionDraft(e.target.value)}
                  placeholder="Ex: Quels sont vos délais de livraison?"
                  rows={2}
                  style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '14px', outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
              </div>
              {/* Réponse */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>Réponse *</label>
                <textarea value={reponseDraft} onChange={e => setReponseDraft(e.target.value)}
                  placeholder="Ex: Nous expédions dans un délai de 2-3 jours ouvrables..."
                  rows={4}
                  style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '14px', outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
              </div>
              {/* Statut */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>Visibilité</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {(['actif', 'brouillon'] as const).map(s => (
                    <button key={s} type="button" onClick={() => setStatutDraft(s)}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${statutDraft === s ? T.accent : T.border}`, background: statutDraft === s ? T.accentLight : 'white', color: statutDraft === s ? T.accent : T.textLight, fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                      {s === 'brouillon' ? '📝 Brouillon' : '✅ Publier'}
                    </button>
                  ))}
                </div>
              </div>
              {/* Aperçu */}
              {(questionDraft || reponseDraft) && (
                <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', border: `1px solid ${T.border}`, padding: '14px 16px', marginBottom: '18px' }}>
                  <p style={{ fontSize: '10px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' as const, margin: '0 0 10px' }}>Aperçu sur votre boutique :</p>
                  {questionDraft && <p style={{ fontSize: '13px', fontWeight: '800', color: T.text, margin: '0 0 6px' }}>❓ {questionDraft}</p>}
                  {reponseDraft && <p style={{ fontSize: '13px', color: T.textLight, margin: 0, lineHeight: '1.6' }}>💬 {reponseDraft}</p>}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={fermerFormulaire} style={{ padding: '10px 20px', border: `1px solid ${T.border}`, borderRadius: '8px', backgroundColor: 'white', color: T.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Annuler</button>
                <button onClick={sauvegarder} disabled={saving || !questionDraft.trim() || !reponseDraft.trim()}
                  style={{ padding: '10px 22px', border: 'none', borderRadius: '8px', backgroundColor: !saving && questionDraft.trim() && reponseDraft.trim() ? T.accent : '#aaa', color: 'white', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                  {saving ? '⏳...' : itemEdite ? '✅ Mettre à jour' : '✅ Ajouter à ma FAQ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: T.text, margin: '0 0 4px' }}>❓ Ma FAQ</h1>
          <p style={{ fontSize: '13px', color: T.textLight, margin: 0 }}>Gérez les questions fréquentes de votre boutique</p>
        </div>
        <button onClick={ouvrirNouveauFormulaire}
          style={{ padding: '11px 22px', background: `linear-gradient(135deg, ${T.accent}, #a07840)`, border: 'none', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(201,169,110,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>+</span> Ajouter une question
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Questions totales',    val: items.length,                          icon: '❓', color: T.accent },
          { label: 'Visibles sur boutique', val: items.filter(i => estActif(i)).length, icon: '👁', color: T.success },
          { label: 'Masquées / Attente',   val: items.filter(i => !estActif(i)).length, icon: '🙈', color: T.textLight },
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

      {/* Recherche */}
      <div style={{ backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '12px 16px', marginBottom: '12px' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
          <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher dans vos questions..."
            style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '9px 12px 9px 32px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }} />
        </div>
      </div>

      <div style={{ backgroundColor: T.accentLight, border: `1px solid rgba(201,169,110,0.3)`, borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '16px' }}>💡</span>
        <p style={{ fontSize: '12px', color: T.accent, margin: 0, fontWeight: '600' }}>
          Votre FAQ est visible sur votre boutique publique. Utilisez les flèches ↑↓ pour réordonner les questions.
        </p>
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: T.textLight }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
          <p>Chargement de la FAQ...</p>
        </div>
      ) : itemsFiltres.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', backgroundColor: T.card, borderRadius: '14px', border: `1px solid ${T.border}`, color: T.textLight }}>
          <div style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.3 }}>❓</div>
          <p style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>Aucune question trouvée</p>
          <p style={{ fontSize: '12px', margin: '0 0 16px' }}>Ajoutez votre première question pour aider vos acheteurs !</p>
          <button onClick={ouvrirNouveauFormulaire} style={{ backgroundColor: T.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            + Ajouter une question
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '60px' }}>
          {itemsFiltres.map((item, idx) => (
            <div key={item.id} style={{ backgroundColor: T.card, borderRadius: '14px', border: `1px solid ${estActif(item) ? T.border : '#f0f0f0'}`, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', opacity: estActif(item) ? 1 : 0.7 }}>
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
                  <p style={{ fontSize: '14px', fontWeight: '800', color: T.text, margin: '0 0 8px', lineHeight: '1.4' }}>
                    <span style={{ color: T.accent }}>Q : </span>{item.question}
                  </p>
                  <p style={{ fontSize: '13px', color: T.textLight, margin: 0, lineHeight: '1.6' }}>
                    <span style={{ color: T.success, fontWeight: '700' }}>R : </span>{item.reponse}
                  </p>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, alignItems: 'flex-end' }}>
                  <span style={{
                    backgroundColor: item.statut === 'actif' ? '#dcfce7' : item.statut === 'en_attente' ? '#fef9c3' : item.statut === 'refuse' ? '#fee2e2' : '#f3f4f6',
                    color: item.statut === 'actif' ? T.success : item.statut === 'en_attente' ? T.warning : item.statut === 'refuse' ? T.danger : T.textLight,
                    padding: '2px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', marginBottom: '4px'
                  }}>
                    {item.statut === 'actif' ? '👁 Visible' : item.statut === 'en_attente' ? '⏳ En attente' : item.statut === 'refuse' ? '❌ Refusé' : '🙈 Masqué'}
                  </span>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {item.statut !== 'en_attente' && item.statut !== 'refuse' && (
                      <button onClick={() => toggleStatut(item)}
                        style={{ backgroundColor: estActif(item) ? '#fef9c3' : '#dcfce7', color: estActif(item) ? '#92400e' : T.success, border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                        {estActif(item) ? '🙈 Masquer' : '👁 Afficher'}
                      </button>
                    )}
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
  );
}