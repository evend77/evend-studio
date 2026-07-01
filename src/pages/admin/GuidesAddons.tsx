// src/pages/admin/GuidesAddons.tsx
// Gestion des guides d'add-ons — Dashboard admin e-Vend Studio

import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = (window as any).API_BASE || 'http://localhost:5000/api';

interface Guide {
  id:          number;
  addon_id:    string;
  titre:       string;
  emoji:       string;
  description: string;
  contenu:     string;
  actif:       boolean;
  ordre:       number;
  updated_at:  string;
  updated_by:  string;
}

const T = {
  bg: '#f0f2f5', card: '#fff', border: '#e1e4e8',
  accent: '#2d6a9f', accentLight: '#e8f2fb',
  text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706',
};

const EMOJIS = ['📖','📚','🚀','⚙️','💡','🎯','🔧','🛠️','📊','💰','🛒','📦','🌟','⭐','🏅','🔒','🌍','🤝','💬','📱','🎨','🔗','📝','🏪','🎁','🔍'];

export default function GuidesAddons() {
  const token = localStorage.getItem('token');
  const [guides, setGuides]           = useState<Guide[]>([]);
  const [ongletActif, setOngletActif] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [msgSave, setMsgSave]         = useState<string | null>(null);
  const [contenuEdite, setContenuEdite] = useState<Record<string, string>>({});
  const [modeEdition, setModeEdition] = useState<'html' | 'apercu'>('html');
  const [search, setSearch]           = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGuide, setNewGuide]       = useState({ addon_id: '', titre: '', emoji: '📖', description: '' });
  const [creating, setCreating]       = useState(false);
  const [guideToDelete, setGuideToDelete] = useState<Guide | null>(null);
  const [deleting, setDeleting]           = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDraft, setEditDraft]         = useState({ addon_id: '', titre: '', emoji: '📖', description: '' });
  const [savingEdit, setSavingEdit]       = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const guideActif = guides[ongletActif] ?? null;
  const contenuActuel = guideActif ? (contenuEdite[guideActif.addon_id] ?? guideActif.contenu ?? '') : '';
  const modifie = guideActif ? contenuActuel !== (guideActif.contenu ?? '') : false;

  // ── Charger ──────────────────────────────────────────────────────────────
  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/guides-addons`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setGuides(data.guides || []);
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { charger(); }, [charger]);

  // ── Sauvegarder contenu ───────────────────────────────────────────────────
  async function sauvegarder() {
    if (!guideActif) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/guides-addons/${guideActif.addon_id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contenu: contenuActuel }),
      });
      const data = await res.json();
      setGuides(prev => prev.map(g => g.addon_id === guideActif.addon_id ? data.guide : g));
      setMsgSave('✅ Guide sauvegardé !');
      setTimeout(() => setMsgSave(null), 3000);
    } catch { setMsgSave('❌ Erreur lors de la sauvegarde'); setTimeout(() => setMsgSave(null), 3000); }
    finally { setSaving(false); }
  }

  // ── Toggle actif ──────────────────────────────────────────────────────────
  async function toggleActif(guide: Guide) {
    try {
      const res = await fetch(`${API_BASE}/guides-addons/${guide.addon_id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ actif: !guide.actif }),
      });
      const data = await res.json();
      setGuides(prev => prev.map(g => g.addon_id === guide.addon_id ? data.guide : g));
    } catch { /* silencieux */ }
  }

  // ── Créer ─────────────────────────────────────────────────────────────────
  async function creer() {
    if (!newGuide.addon_id.trim() || !newGuide.titre.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/guides-addons`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newGuide),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error); return;
      }
      const data = await res.json();
      setGuides(prev => [...prev, data.guide]);
      setOngletActif(guides.length);
      setShowCreateModal(false);
      setNewGuide({ addon_id: '', titre: '', emoji: '📖', description: '' });
    } catch { alert('Erreur lors de la création.'); }
    finally { setCreating(false); }
  }

  // ── Supprimer ─────────────────────────────────────────────────────────────
  async function supprimer() {
    if (!guideToDelete) return;
    setDeleting(true);
    try {
      await fetch(`${API_BASE}/guides-addons/${guideToDelete.addon_id}`, {
        method: 'DELETE', credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      const idx = guides.findIndex(g => g.addon_id === guideToDelete.addon_id);
      setGuides(prev => prev.filter(g => g.addon_id !== guideToDelete.addon_id));
      setOngletActif(Math.max(0, idx - 1));
      setGuideToDelete(null);
    } catch { alert('Erreur lors de la suppression.'); }
    finally { setDeleting(false); }
  }

  // ── Sauvegarder infos (titre, addon_id, emoji, description) ─────────────
  async function sauvegarderInfos() {
    if (!guideActif) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`${API_BASE}/guides-addons/${guideActif.addon_id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          titre:       editDraft.titre,
          emoji:       editDraft.emoji,
          description: editDraft.description,
          addon_id:    editDraft.addon_id,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setGuides(prev => prev.map(g => g.addon_id === guideActif.addon_id ? data.guide : g));
      setShowEditModal(false);
    } catch { alert('Erreur lors de la sauvegarde.'); }
    finally { setSavingEdit(false); }
  }
  function insererBalise(avant: string, apres = '') {
    const ta = textareaRef.current;
    if (!ta || !guideActif) return;
    const c     = contenuActuel;
    const debut = ta.selectionStart;
    const fin   = ta.selectionEnd;
    const sel   = c.slice(debut, fin);
    const nouveau = c.slice(0, debut) + avant + sel + apres + c.slice(fin);
    setContenuEdite(prev => ({ ...prev, [guideActif.addon_id]: nouveau }));
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(debut + avant.length, debut + avant.length + sel.length);
    }, 10);
  }

  const guidesFiltres = guides.filter(g =>
    [g.titre, g.addon_id, g.description].join(' ').toLowerCase().includes(search.toLowerCase())
  );

  const apercuHTML = contenuActuel;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>📖</div>
        <p style={{ color: T.textLight }}>Chargement des guides…</p>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', fontFamily: 'system-ui, sans-serif', background: T.bg }}>

      {/* ── Modal Création ── */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '20px 24px', background: `linear-gradient(135deg, ${T.accent}, #1a4a7a)`, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>📖 Nouveau guide d'add-on</p>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              {/* Titre en premier */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>Titre du guide *</label>
                <input
                  value={newGuide.titre}
                  onChange={e => {
                    const titre = e.target.value;
                    // Auto-générer l'ID depuis le titre si l'ID n'a pas été modifié manuellement
                    const autoId = titre.toLowerCase()
                      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9\s-]/g, '')
                      .trim().replace(/\s+/g, '-');
                    setNewGuide(prev => ({
                      ...prev,
                      titre,
                      addon_id: prev.addon_id === '' || prev.addon_id === prev.titre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-') ? autoId : prev.addon_id,
                    }));
                  }}
                  placeholder="ex: Guide badges vendeurs et clients"
                  style={{ width: '100%', boxSizing: 'border-box' as const, padding: '9px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                />
              </div>

              {/* ID auto-rempli en deuxième */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>
                  ID de l'add-on *
                  <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 500, color: T.accent, textTransform: 'none', letterSpacing: 0 }}>
                    ✨ Auto-généré depuis le titre — modifiable
                  </span>
                </label>
                <input
                  value={newGuide.addon_id}
                  onChange={e => setNewGuide(prev => ({ ...prev, addon_id: e.target.value }))}
                  placeholder="ex: badges-vendeurs-clients"
                  style={{ width: '100%', boxSizing: 'border-box' as const, padding: '9px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'monospace', background: '#f8fafc' }}
                />
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: T.textLight }}>
                  Doit correspondre au <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>addon_id</code> de la table evend_addons
                </p>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>Description courte</label>
                <input value={newGuide.description} onChange={e => setNewGuide(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Courte description du guide…" style={{ width: '100%', boxSizing: 'border-box' as const, padding: '9px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>Emoji</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setNewGuide(prev => ({ ...prev, emoji: e }))}
                      style={{ width: '36px', height: '36px', borderRadius: '8px', border: newGuide.emoji === e ? `2px solid ${T.accent}` : `1px solid ${T.border}`, background: newGuide.emoji === e ? T.accentLight : '#f8fafc', fontSize: '18px', cursor: 'pointer' }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCreateModal(false)} style={{ padding: '9px 18px', border: `1px solid ${T.border}`, borderRadius: '10px', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: T.textLight }}>Annuler</button>
                <button onClick={creer} disabled={!newGuide.addon_id.trim() || !newGuide.titre.trim() || creating}
                  style={{ padding: '9px 22px', background: newGuide.addon_id.trim() && newGuide.titre.trim() ? T.accent : '#cbd5e1', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                  {creating ? '⏳…' : '✅ Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Édition infos ── */}
      {showEditModal && guideActif && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => e.target === e.currentTarget && setShowEditModal(false)}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '18px 24px', background: `linear-gradient(135deg, ${T.accent}, #1a4a7a)`, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>✏️ Modifier les infos du guide</p>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              {/* Titre */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>Titre du guide *</label>
                <input value={editDraft.titre} onChange={e => setEditDraft(p => ({ ...p, titre: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box' as const, padding: '9px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
              </div>
              {/* ID */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>ID de l'add-on *</label>
                <input value={editDraft.addon_id} onChange={e => setEditDraft(p => ({ ...p, addon_id: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box' as const, padding: '9px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'monospace', background: '#f8fafc' }} />
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: T.textLight }}>⚠️ Doit correspondre à l'addon_id dans la table evend_addons</p>
              </div>
              {/* Description */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>Description courte</label>
                <input value={editDraft.description} onChange={e => setEditDraft(p => ({ ...p, description: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box' as const, padding: '9px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
              </div>
              {/* Emoji */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>Emoji</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setEditDraft(p => ({ ...p, emoji: e }))}
                      style={{ width: '36px', height: '36px', borderRadius: '8px', border: editDraft.emoji === e ? `2px solid ${T.accent}` : `1px solid ${T.border}`, background: editDraft.emoji === e ? T.accentLight : '#f8fafc', fontSize: '18px', cursor: 'pointer' }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowEditModal(false)} style={{ padding: '9px 18px', border: `1px solid ${T.border}`, borderRadius: '10px', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: T.textLight }}>Annuler</button>
                <button onClick={sauvegarderInfos} disabled={!editDraft.titre.trim() || !editDraft.addon_id.trim() || savingEdit}
                  style={{ padding: '9px 22px', background: T.accent, border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                  {savingEdit ? '⏳…' : '💾 Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Suppression ── */}
      {guideToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 800, color: T.text }}>Supprimer ce guide ?</h3>
            <p style={{ margin: '0 0 6px', fontSize: '14px', color: T.text }}>«{guideToDelete.titre}»</p>
            <p style={{ margin: '0 0 20px', fontSize: '12px', color: T.danger, fontWeight: 600 }}>Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setGuideToDelete(null)} style={{ padding: '9px 20px', border: `1px solid ${T.border}`, borderRadius: '10px', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={supprimer} disabled={deleting} style={{ padding: '9px 20px', border: 'none', borderRadius: '10px', background: T.danger, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                {deleting ? '⏳…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <div style={{ width: '280px', flexShrink: 0, background: T.card, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: `1px solid ${T.border}` }}>
          <button onClick={() => setShowCreateModal(true)} style={{ width: '100%', padding: '10px', background: T.accent, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            ＋ Nouveau guide
          </button>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher…" style={{ width: '100%', boxSizing: 'border-box' as const, marginTop: '10px', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {guides.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: T.textLight, fontSize: '13px' }}>
              <p style={{ fontSize: '32px', margin: '0 0 8px' }}>📖</p>
              Aucun guide créé
            </div>
          ) : guidesFiltres.map((guide, idx) => {
            const realIdx = guides.findIndex(g => g.addon_id === guide.addon_id);
            const estActif = realIdx === ongletActif;
            return (
              <div key={guide.addon_id} onClick={() => { setOngletActif(realIdx); setModeEdition('html'); }}
                style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: `1px solid ${T.border}`, background: estActif ? T.accentLight : 'transparent', borderLeft: estActif ? `3px solid ${T.accent}` : '3px solid transparent', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>{guide.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: estActif ? 700 : 500, color: estActif ? T.accent : T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guide.titre}</p>
                    <p style={{ margin: 0, fontSize: '10px', color: T.textLight, fontFamily: 'monospace' }}>{guide.addon_id}</p>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '8px', background: guide.actif ? '#dcfce7' : '#f3f4f6', color: guide.actif ? T.success : T.textLight, flexShrink: 0 }}>
                    {guide.actif ? '●' : '○'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.border}`, background: '#f8fafc', fontSize: '11px', color: T.textLight, textAlign: 'center' }}>
          {guides.length} guide{guides.length > 1 ? 's' : ''} · {guides.filter(g => g.actif).length} actif{guides.filter(g => g.actif).length > 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Éditeur principal ── */}
      {!guideActif ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textLight }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '48px', margin: '0 0 12px' }}>📖</p>
            <p style={{ fontSize: '14px' }}>Sélectionnez un guide ou créez-en un nouveau</p>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header éditeur */}
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, background: T.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>{guideActif.emoji}</span>
              <div>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: T.text }}>{guideActif.titre}</p>
                <p style={{ margin: 0, fontSize: '11px', color: T.textLight, fontFamily: 'monospace' }}>addon_id: {guideActif.addon_id}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {msgSave && <span style={{ fontSize: '12px', fontWeight: 700, color: msgSave.startsWith('✅') ? T.success : T.danger }}>{msgSave}</span>}
              <button onClick={() => { setEditDraft({ addon_id: guideActif.addon_id, titre: guideActif.titre, emoji: guideActif.emoji, description: guideActif.description }); setShowEditModal(true); }}
                style={{ padding: '6px 14px', border: `1px solid ${T.border}`, borderRadius: '8px', background: '#fff', color: T.text, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                ✏️ Modifier infos
              </button>
              <button onClick={() => toggleActif(guideActif)} style={{ padding: '6px 14px', border: `1px solid ${guideActif.actif ? T.success : T.border}`, borderRadius: '8px', background: guideActif.actif ? '#dcfce7' : '#f3f4f6', color: guideActif.actif ? T.success : T.textLight, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                {guideActif.actif ? '● Actif' : '○ Inactif'}
              </button>
              <button onClick={() => setGuideToDelete(guideActif)} style={{ padding: '6px 12px', border: `1px solid #fecaca`, borderRadius: '8px', background: '#fff5f5', color: T.danger, fontSize: '12px', cursor: 'pointer' }}>🗑️</button>
              {modifie && <button onClick={() => setContenuEdite(prev => ({ ...prev, [guideActif.addon_id]: guideActif.contenu ?? '' }))} style={{ padding: '6px 14px', border: `1px solid ${T.border}`, borderRadius: '8px', background: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: T.textLight }}>Annuler</button>}
              <button onClick={sauvegarder} disabled={saving || !modifie} style={{ padding: '8px 18px', background: modifie ? T.accent : '#cbd5e1', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: modifie ? 'pointer' : 'not-allowed' }}>
                {saving ? '⏳…' : '💾 Sauvegarder'}
              </button>
            </div>
          </div>

          {/* Mode HTML / Aperçu */}
          <div style={{ padding: '8px 16px', borderBottom: `1px solid ${T.border}`, background: '#f8fafc', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setModeEdition('html')} style={{ padding: '5px 14px', border: 'none', borderRadius: '6px', background: modeEdition === 'html' ? T.accent : 'transparent', color: modeEdition === 'html' ? '#fff' : T.textLight, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>✏️ HTML</button>
            <button onClick={() => setModeEdition('apercu')} style={{ padding: '5px 14px', border: 'none', borderRadius: '6px', background: modeEdition === 'apercu' ? T.accent : 'transparent', color: modeEdition === 'apercu' ? '#fff' : T.textLight, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>👁 Aperçu</button>
            {modeEdition === 'html' && (
              <>
                <div style={{ width: '1px', height: '20px', background: T.border, margin: '0 4px' }} />
                {[
                  { label: 'G',   avant: '<strong>', apres: '</strong>' },
                  { label: 'I',   avant: '<em>',     apres: '</em>' },
                  { label: 'H1',  avant: '<h1>',     apres: '</h1>' },
                  { label: 'H2',  avant: '<h2>',     apres: '</h2>' },
                  { label: 'H3',  avant: '<h3>',     apres: '</h3>' },
                  { label: '🔗',  avant: '<a href="">', apres: '</a>' },
                  { label: '📋',  avant: '<ul>\n  <li>', apres: '</li>\n</ul>' },
                  { label: '1.',  avant: '<ol>\n  <li>', apres: '</li>\n</ol>' },
                  { label: '💡',  avant: '<div class="tip">', apres: '</div>' },
                  { label: '⚠️',  avant: '<div class="warning">', apres: '</div>' },
                  { label: '§',   avant: '<p>',     apres: '</p>' },
                  { label: '—',   avant: '\n<hr />\n', apres: '' },
                ].map(btn => (
                  <button key={btn.label} onClick={() => insererBalise(btn.avant, btn.apres)}
                    style={{ padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: T.text, minWidth: '28px' }}>
                    {btn.label}
                  </button>
                ))}
              </>
            )}
            <div style={{ marginLeft: 'auto', fontSize: '11px', color: T.textLight }}>
              {contenuActuel.length} caractères
              {modifie && <span style={{ color: T.warning, fontWeight: 700, marginLeft: '8px' }}>● Non sauvegardé</span>}
            </div>
          </div>

          {/* Zone édition */}
          {modeEdition === 'html' ? (
            <textarea
              ref={textareaRef}
              value={contenuActuel}
              onChange={e => setContenuEdite(prev => ({ ...prev, [guideActif.addon_id]: e.target.value }))}
              placeholder={`Rédigez le guide "${guideActif.titre}" en HTML…\n\nExemple :\n<h2>Introduction</h2>\n<p>Ce guide explique comment utiliser…</p>`}
              spellCheck={false}
              style={{ flex: 1, padding: '20px', border: 'none', outline: 'none', fontSize: '13px', fontFamily: 'monospace', lineHeight: 1.7, color: T.text, resize: 'none', background: '#fff' }}
            />
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px', background: '#fff' }}>
              <style>{`
                .guide-apercu h1 { font-size:28px; font-weight:800; margin:0 0 20px; color:${T.text}; border-bottom:3px solid ${T.accent}; padding-bottom:10px; }
                .guide-apercu h2 { font-size:20px; font-weight:700; margin:28px 0 12px; color:${T.text}; border-bottom:1px solid ${T.border}; padding-bottom:6px; }
                .guide-apercu h3 { font-size:16px; font-weight:700; margin:20px 0 8px; color:${T.text}; }
                .guide-apercu p  { margin:0 0 12px; line-height:1.8; color:${T.textLight}; font-size:14px; }
                .guide-apercu ul,.guide-apercu ol { margin:0 0 12px; padding-left:24px; }
                .guide-apercu li { margin-bottom:6px; color:${T.textLight}; line-height:1.7; font-size:14px; }
                .guide-apercu a  { color:${T.accent}; text-decoration:underline; }
                .guide-apercu strong { color:${T.text}; }
                .guide-apercu hr { border:none; border-top:1px solid ${T.border}; margin:20px 0; }
                .guide-apercu .tip { background:#eff6ff; border-left:4px solid ${T.accent}; padding:12px 16px; border-radius:0 8px 8px 0; margin:14px 0; color:#1d4ed8; font-size:13px; }
                .guide-apercu .warning { background:#fffbeb; border-left:4px solid ${T.warning}; padding:12px 16px; border-radius:0 8px 8px 0; margin:14px 0; color:#92400e; font-size:13px; }
                .guide-apercu img { max-width:100%; border-radius:10px; margin:10px 0; }
              `}</style>
              {contenuActuel.trim() ? (
                <div className="guide-apercu" dangerouslySetInnerHTML={{ __html: apercuHTML }} />
              ) : (
                <div style={{ textAlign: 'center', color: T.textLight, padding: '60px 0' }}>
                  <p style={{ fontSize: '40px', margin: '0 0 10px' }}>📖</p>
                  <p>Aucun contenu à afficher. Commencez à rédiger en mode HTML.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}