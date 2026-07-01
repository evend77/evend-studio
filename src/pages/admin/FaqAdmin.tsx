// src/pages/admin/FaqAdmin.tsx
// FAQ Plateforme admin e-Vend — separee de la FAQ vendeurs

import { useState, useEffect } from 'react';
import { API_BASE } from '../../config/api';

interface Question {
  id: number;
  question: string;
  reponse: string;
  categorie: string;
  ordre: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: string;
  visibles: string;
  masquees: string;
  nb_categories: string;
}

interface Categorie {
  categorie: string;
  nb: string;
}

interface FormQ {
  question: string;
  reponse: string;
  categorie: string;
}

const FORM_VIDE: FormQ = { question: '', reponse: '', categorie: 'General' };

const CATEGORIES_DEFAUT = ['General', 'Commandes', 'Paiements', 'Livraison', 'Retours', 'Comptes', 'Vendeurs', 'Securite'];

const T = {
  bg: '#f0f2f5', card: '#fff', border: '#e1e4e8',
  accent: '#2d6a9f', text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706',
};

export default function FaqAdmin({ naviguerVers }: { naviguerVers?: (p: string) => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading]     = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('');
  const [filtreActif, setFiltreActif] = useState('');
  const [modal, setModal]         = useState<'ajouter' | 'modifier' | null>(null);
  const [questionEnEdition, setQuestionEnEdition] = useState<Question | null>(null);
  const [form, setForm]           = useState<FormQ>(FORM_VIDE);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [enCours, setEnCours]     = useState<number | null>(null);
  const token = localStorage.getItem('token');

  useEffect(() => { fetchFaq(); }, [recherche, filtreCategorie, filtreActif]);

  async function fetchFaq() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (recherche) params.set('q', recherche);
      if (filtreCategorie) params.set('categorie', filtreCategorie);
      if (filtreActif) params.set('active', filtreActif);
      const res = await fetch(`${API_BASE}/faq-admin?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setQuestions(data.questions || []);
      setStats(data.stats || null);
      setCategories(data.categories || []);
    } finally {
      setLoading(false);
    }
  }

  function ouvrirAjouter() {
    setForm(FORM_VIDE);
    setQuestionEnEdition(null);
    setModal('ajouter');
  }

  function ouvrirModifier(q: Question) {
    setForm({ question: q.question, reponse: q.reponse, categorie: q.categorie });
    setQuestionEnEdition(q);
    setModal('modifier');
  }

  async function sauvegarder() {
    if (!form.question.trim() || !form.reponse.trim()) return;
    setSauvegarde(true);
    try {
      if (modal === 'ajouter') {
        await fetch(`${API_BASE}/faq-admin`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else if (questionEnEdition) {
        await fetch(`${API_BASE}/faq-admin/${questionEnEdition.id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      setModal(null);
      await fetchFaq();
    } finally {
      setSauvegarde(false);
    }
  }

  async function toggleActive(q: Question) {
    setEnCours(q.id);
    await fetch(`${API_BASE}/faq-admin/${q.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !q.active }),
    });
    await fetchFaq();
    setEnCours(null);
  }

  async function supprimer(q: Question) {
    if (!window.confirm(`Supprimer cette question ?\n\n"${q.question}"`)) return;
    await fetch(`${API_BASE}/faq-admin/${q.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchFaq();
  }

  async function monter(q: Question, idx: number) {
    if (idx <= 0) return;
    const ordres = questions.map((item, i) => {
      if (i === idx - 1) return { id: item.id, ordre: idx + 1 };
      if (i === idx)     return { id: item.id, ordre: idx };
      return { id: item.id, ordre: i + 1 };
    });
    await fetch(`${API_BASE}/faq-admin/reordonner`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ordres }),
    });
    await fetchFaq();
  }

  async function descendre(q: Question, idx: number) {
    if (idx >= questions.length - 1) return;
    const ordres = questions.map((item, i) => {
      if (i === idx + 1) return { id: item.id, ordre: idx + 1 };
      if (i === idx)     return { id: item.id, ordre: idx + 2 };
      return { id: item.id, ordre: i + 1 };
    });
    await fetch(`${API_BASE}/faq-admin/reordonner`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ordres }),
    });
    await fetchFaq();
  }

  const toutesCategories = Array.from(
    new Set([...CATEGORIES_DEFAUT, ...categories.map(c => c.categorie)])
  );

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0;transform:translateY(8px); } to { opacity:1;transform:translateY(0); } }
        .q-row { animation: fadeIn 0.25s ease; transition: box-shadow 0.2s; }
        .q-row:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important; }
        .btn-act:hover { opacity: 0.8; transform: scale(1.05); }
      `}</style>

      {/* ── EN-TETE ── */}
      <div style={s.topBar}>
        <div>
          <h1 style={s.titre}>❓ FAQ Plateforme</h1>
          <p style={s.sousTitre}>Questions frequentes affichees sur le site public — separees de la FAQ vendeurs</p>
        </div>
        <button style={s.btnCreer} onClick={ouvrirAjouter}>
          + Ajouter une question
        </button>
      </div>

      {/* ── STATS ── */}
      {stats && (
        <div style={s.statsGrille}>
          {[
            { icone: '❓', val: stats.total,         label: 'Questions totales',   couleur: T.accent },
            { icone: '👁',  val: stats.visibles,      label: 'Visibles sur le site', couleur: T.success },
            { icone: '🚫', val: stats.masquees,      label: 'Masquees',             couleur: T.warning },
            { icone: '🗂️', val: stats.nb_categories, label: 'Categories',           couleur: '#7c3aed' },
          ].map(st => (
            <div key={st.label} style={s.statCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ ...s.statIcone, background: st.couleur + '18', color: st.couleur }}>
                  {st.icone}
                </div>
                <div>
                  <p style={{ ...s.statVal, color: st.couleur }}>{st.val}</p>
                  <p style={s.statLabel}>{st.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── FILTRES ── */}
      <div style={s.filtresBar}>
        <input
          style={s.recherche}
          placeholder="🔍 Rechercher une question..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
        />
        <select style={s.select} value={filtreCategorie} onChange={e => setFiltreCategorie(e.target.value)}>
          <option value="">Toutes les categories</option>
          {categories.map(c => (
            <option key={c.categorie} value={c.categorie}>{c.categorie} ({c.nb})</option>
          ))}
        </select>
        <select style={s.select} value={filtreActif} onChange={e => setFiltreActif(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="true">Visibles</option>
          <option value="false">Masquees</option>
        </select>
        <button style={s.btnReset} onClick={() => { setRecherche(''); setFiltreCategorie(''); setFiltreActif(''); }}>
          Reinitialiser
        </button>
      </div>

      {/* ── LISTE ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div style={s.spinner} />
        </div>
      ) : questions.length === 0 ? (
        <div style={s.vide}>
          <p style={{ fontSize: '52px', marginBottom: '12px' }}>❓</p>
          <p style={{ fontSize: '17px', fontWeight: 600, color: T.text, margin: '0 0 6px' }}>Aucune question trouvee</p>
          <p style={{ color: T.textLight, margin: '0 0 20px' }}>Commencez par ajouter votre premiere question</p>
          <button style={s.btnCreer} onClick={ouvrirAjouter}>+ Ajouter une question</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {questions.map((q, idx) => (
            <div key={q.id} className="q-row" style={{ ...s.qCard, opacity: q.active ? 1 : 0.65 }}>
              {/* Numero + fleches */}
              <div style={s.qOrdre}>
                <button style={s.btnFleche} onClick={() => monter(q, idx)} disabled={idx === 0} title="Monter">▲</button>
                <div style={s.qNumero}>{idx + 1}</div>
                <button style={s.btnFleche} onClick={() => descendre(q, idx)} disabled={idx === questions.length - 1} title="Descendre">▼</button>
              </div>

              {/* Contenu */}
              <div style={s.qContenu}>
                <div style={s.qHeader}>
                  <span style={{ ...s.qCategorieBadge, background: q.active ? '#e8f2fb' : '#f3f4f6', color: q.active ? T.accent : T.textLight }}>
                    {q.categorie}
                  </span>
                  <span style={{ ...s.qStatutBadge, background: q.active ? '#f0fdf4' : '#fef3f2', color: q.active ? T.success : T.danger }}>
                    {q.active ? '✅ Visible' : '🚫 Masquee'}
                  </span>
                  <span style={s.qDate}>
                    Modifie : {new Date(q.updated_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <p style={s.qQuestion}>Q : {q.question}</p>
                <p style={s.qReponse}>R : {q.reponse}</p>
              </div>

              {/* Actions */}
              <div style={s.qActions}>
                <button
                  className="btn-act"
                  style={{ ...s.btnAct, background: q.active ? '#fef3f2' : '#f0fdf4', color: q.active ? T.danger : T.success }}
                  onClick={() => toggleActive(q)}
                  disabled={enCours === q.id}
                  title={q.active ? 'Masquer' : 'Afficher'}
                >
                  {enCours === q.id ? '⏳' : q.active ? '🚫 Masquer' : '👁 Afficher'}
                </button>
                <button
                  className="btn-act"
                  style={{ ...s.btnAct, background: '#e8f2fb', color: T.accent }}
                  onClick={() => ouvrirModifier(q)}
                  title="Modifier"
                >
                  ✏️ Modifier
                </button>
                <button
                  className="btn-act"
                  style={{ ...s.btnAct, background: '#fef2f2', color: T.danger }}
                  onClick={() => supprimer(q)}
                  title="Supprimer"
                >
                  🗑 Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ MODAL AJOUTER / MODIFIER ═══════════════════════════════════ */}
      {modal && (
        <>
          <div style={s.overlay} onClick={() => setModal(null)} />
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitre}>
                {modal === 'ajouter' ? '+ Ajouter une question' : '✏️ Modifier la question'}
              </h3>
              <button style={s.btnFermer} onClick={() => setModal(null)}>✕</button>
            </div>

            <div style={s.modalBody}>
              {/* Categorie */}
              <div style={s.champWrap}>
                <label style={s.label}>Categorie</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {toutesCategories.map(cat => (
                    <button
                      key={cat}
                      style={{
                        ...s.btnCat,
                        background: form.categorie === cat ? T.accent : '#f0f2f5',
                        color: form.categorie === cat ? '#fff' : T.textLight,
                        border: `1px solid ${form.categorie === cat ? T.accent : T.border}`,
                      }}
                      onClick={() => setForm(f => ({ ...f, categorie: cat }))}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <input
                  style={s.input}
                  placeholder="Ou tapez une nouvelle categorie..."
                  value={form.categorie}
                  onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}
                />
              </div>

              {/* Question */}
              <div style={s.champWrap}>
                <label style={s.label}>Question *</label>
                <input
                  style={{ ...s.input, fontSize: '15px' }}
                  placeholder="Ex: Quels sont vos delais de livraison?"
                  value={form.question}
                  onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                  autoFocus
                />
              </div>

              {/* Reponse */}
              <div style={s.champWrap}>
                <label style={s.label}>Reponse *</label>
                <textarea
                  style={{ ...s.input, height: '140px', resize: 'vertical' }}
                  placeholder="Ex: Nous expedions dans un delai de 2-3 jours ouvrables..."
                  value={form.reponse}
                  onChange={e => setForm(f => ({ ...f, reponse: e.target.value }))}
                />
                <p style={{ fontSize: '11px', color: T.textLight, margin: '4px 0 0' }}>
                  {form.reponse.length} caracteres
                </p>
              </div>

              {/* Apercu */}
              {(form.question || form.reponse) && (
                <div style={s.apercuWrap}>
                  <p style={s.apercuTitre}>Apercu</p>
                  <div style={s.apercuCard}>
                    <p style={s.apercuQ}>Q : {form.question || '...'}</p>
                    <p style={s.apercuR}>R : {form.reponse || '...'}</p>
                  </div>
                </div>
              )}
            </div>

            <div style={s.modalFooter}>
              <button style={s.btnAnnuler} onClick={() => setModal(null)}>Annuler</button>
              <button
                style={{ ...s.btnSauvegarder, opacity: sauvegarde || !form.question.trim() || !form.reponse.trim() ? 0.5 : 1 }}
                onClick={sauvegarder}
                disabled={sauvegarde || !form.question.trim() || !form.reponse.trim()}
              >
                {sauvegarde ? '⏳ Sauvegarde...' : modal === 'ajouter' ? '✅ Ajouter a ma FAQ' : '💾 Enregistrer'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '24px', background: '#f0f2f5', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  titre: { fontSize: '22px', fontWeight: 800, color: T.text, margin: '0 0 4px' },
  sousTitre: { fontSize: '13px', color: T.textLight, margin: 0 },
  btnCreer: { padding: '10px 20px', background: T.accent, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' },

  statsGrille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' },
  statCard: { background: '#fff', border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  statIcone: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 },
  statVal: { fontSize: '24px', fontWeight: 800, margin: '0 0 2px', fontFamily: 'monospace' },
  statLabel: { fontSize: '12px', color: T.textLight, margin: 0 },

  filtresBar: { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' },
  recherche: { padding: '8px 14px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none', flex: 1, minWidth: '200px' },
  select: { padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff', cursor: 'pointer' },
  btnReset: { padding: '8px 14px', border: `1px solid ${T.border}`, borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', color: T.textLight },

  spinner: { width: '32px', height: '32px', border: `3px solid ${T.border}`, borderTop: `3px solid ${T.accent}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  vide: { textAlign: 'center', padding: '64px 20px', background: '#fff', borderRadius: '14px', border: `1px solid ${T.border}` },

  qCard: { background: '#fff', border: `1px solid ${T.border}`, borderRadius: '14px', padding: '18px 20px', display: 'flex', gap: '16px', alignItems: 'flex-start', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s' },
  qOrdre: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 },
  qNumero: { width: '28px', height: '28px', borderRadius: '50%', background: T.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 },
  btnFleche: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: T.textLight, padding: '2px', lineHeight: 1 },
  qContenu: { flex: 1, minWidth: 0 },
  qHeader: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' },
  qCategorieBadge: { fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' },
  qStatutBadge: { fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' },
  qDate: { fontSize: '11px', color: T.textLight, marginLeft: 'auto' },
  qQuestion: { fontSize: '15px', fontWeight: 700, color: T.text, margin: '0 0 8px', lineHeight: 1.4 },
  qReponse: { fontSize: '14px', color: T.textLight, margin: 0, lineHeight: 1.6 },
  qActions: { display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 },
  btnAct: { padding: '7px 12px', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000 },
  modal: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, background: '#fff', borderRadius: '18px', width: '90%', maxWidth: '560px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: `1px solid ${T.border}` },
  modalTitre: { fontSize: '17px', fontWeight: 800, color: T.text, margin: 0 },
  btnFermer: { width: '30px', height: '30px', border: 'none', borderRadius: '7px', background: '#f0f2f5', cursor: 'pointer', fontSize: '14px' },
  modalBody: { padding: '20px 24px', overflowY: 'auto', flex: 1 },
  modalFooter: { display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '14px 24px', borderTop: `1px solid ${T.border}` },

  champWrap: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '11px', fontWeight: 700, color: T.text, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '14px', color: T.text, background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'system-ui', resize: 'vertical' } as React.CSSProperties,
  btnCat: { padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },

  apercuWrap: { marginTop: '16px' },
  apercuTitre: { fontSize: '11px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' },
  apercuCard: { background: '#f8fafc', border: `1px solid ${T.border}`, borderRadius: '10px', padding: '14px 16px' },
  apercuQ: { fontSize: '14px', fontWeight: 700, color: T.text, margin: '0 0 6px' },
  apercuR: { fontSize: '13px', color: T.textLight, margin: 0, lineHeight: 1.6 },

  btnAnnuler: { padding: '9px 18px', background: '#f0f2f5', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: T.textLight },
  btnSauvegarder: { padding: '10px 22px', background: T.accent, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: '#fff' },
};