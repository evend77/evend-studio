/**
 * StudioMesPages.tsx — e-Vend Studio
 * Chemin : src/pages/gestionnaire/StudioMesPages.tsx
 *
 * Permet à chaque vendeur de créer et gérer ses propres pages (guides, FAQ, etc.)
 *
 * Routes API :
 *   GET    /api/studio/pages/:gestionnaireId          → toutes les pages
 *   POST   /api/studio/pages/:gestionnaireId          → créer
 *   PATCH  /api/studio/pages/:gestionnaireId/:slug    → modifier
 *   DELETE /api/studio/pages/:gestionnaireId/:slug    → supprimer
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = (window as any).API_BASE || '/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Page {
  id:                 number;
  slug:               string;
  titre:              string;
  contenu:            string;
  meta_description:   string;
  actif:              boolean;
  afficher_dans_menu: boolean;
  ordre:              number;
  created_at:         string;
  updated_at:         string;
}

// ─── Palette Studio ───────────────────────────────────────────────────────────
const C = {
  bg:          '#f4f6f8',
  card:        '#ffffff',
  border:      '#e2e8f0',
  gold:        '#c9a96e',
  goldLight:   'rgba(201,169,110,0.12)',
  green:       '#10b981',
  greenLight:  'rgba(16,185,129,0.10)',
  red:         '#ef4444',
  redLight:    'rgba(239,68,68,0.10)',
  orange:      '#f59e0b',
  orangeLight: 'rgba(245,158,11,0.10)',
  text:        '#1e293b',
  textLight:   '#64748b',
  textXLight:  '#94a3b8',
  border2:     '#cbd5e1',
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  return (
    <div style={{
      position: 'fixed', bottom: '28px', left: '50%',
      transform: 'translateX(-50%)',
      background: type === 'ok' ? C.green : C.red,
      color: '#fff', padding: '11px 24px', borderRadius: '12px',
      fontSize: '14px', fontWeight: 700, zIndex: 9999,
      boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
      animation: 'fadeInUp 0.25s ease', whiteSpace: 'nowrap',
    }}>
      {type === 'ok' ? '✅ ' : '❌ '}{msg}
    </div>
  );
}

// ─── Modal création ───────────────────────────────────────────────────────────
function ModalCreation({
  onCreer, onFermer, creating,
}: {
  onCreer: (titre: string, description: string) => void;
  onFermer: () => void;
  creating: boolean;
}) {
  const [titre, setTitre]       = useState('');
  const [desc, setDesc]         = useState('');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: C.card, borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 800, color: C.text }}>📄 Nouvelle page</h2>
        <p style={{ margin: '0 0 24px', fontSize: '13px', color: C.textLight }}>Créez une page guide, FAQ, ou tout autre document pour votre site.</p>

        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
          Titre de la page *
        </label>
        <input
          autoFocus
          type="text"
          value={titre}
          onChange={e => setTitre(e.target.value)}
          placeholder="Ex : Guide d'utilisation, FAQ, À propos…"
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: `1px solid ${C.border2}`, borderRadius: '10px', fontSize: '14px', color: C.text, outline: 'none', marginBottom: '16px', background: '#f8fafc' }}
          onKeyDown={e => { if (e.key === 'Enter' && titre.trim()) onCreer(titre, desc); }}
        />

        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
          Description (optionnel)
        </label>
        <input
          type="text"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Brève description pour les moteurs de recherche"
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: `1px solid ${C.border2}`, borderRadius: '10px', fontSize: '14px', color: C.text, outline: 'none', marginBottom: '24px', background: '#f8fafc' }}
        />

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onFermer} style={{ padding: '10px 20px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: C.textLight }}>
            Annuler
          </button>
          <button
            onClick={() => { if (titre.trim()) onCreer(titre, desc); }}
            disabled={!titre.trim() || creating}
            style={{ padding: '10px 22px', background: titre.trim() ? 'linear-gradient(135deg, #c9a96e, #a07840)' : '#cbd5e1', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: titre.trim() ? 'pointer' : 'not-allowed', color: titre.trim() ? '#fff' : '#94a3b8', boxShadow: titre.trim() ? '0 4px 12px rgba(201,169,110,0.3)' : 'none' }}
          >
            {creating ? '⏳ Création…' : '✅ Créer la page'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal confirmation suppression ──────────────────────────────────────────
function ModalSuppression({
  page, onConfirmer, onAnnuler, deleting,
}: {
  page: Page; onConfirmer: () => void; onAnnuler: () => void; deleting: boolean;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: C.card, borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px', textAlign: 'center' }}>🗑️</div>
        <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: C.text, textAlign: 'center' }}>Supprimer cette page ?</h2>
        <p style={{ margin: '0 0 8px', fontSize: '14px', color: C.textLight, textAlign: 'center' }}>
          La page <strong>«{page.titre}»</strong> sera définitivement supprimée.
        </p>
        <p style={{ margin: '0 0 24px', fontSize: '12px', color: C.red, textAlign: 'center', fontWeight: 600 }}>
          Cette action est irréversible.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={onAnnuler} style={{ padding: '10px 22px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: C.textLight }}>
            Annuler
          </button>
          <button onClick={onConfirmer} disabled={deleting} style={{ padding: '10px 22px', background: C.red, border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#fff' }}>
            {deleting ? '⏳ Suppression…' : '🗑️ Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface Props { gestionnaireId: number; }

export default function StudioMesPages({ gestionnaireId }: Props) {
  const token = localStorage.getItem('token');

  const [pages, setPages]               = useState<Page[]>([]);
  const [pageActive, setPageActive]     = useState<Page | null>(null);
  const [contenuEdite, setContenuEdite] = useState<Record<string, string>>({});
  const [original, setOriginal]         = useState<Record<string, string>>({});
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [creating, setCreating]         = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [modeEdition, setModeEdition]   = useState<'html' | 'apercu'>('html');
  const [showCreation, setShowCreation] = useState(false);
  const [pageASupprimer, setPageASupprimer] = useState<Page | null>(null);
  const [toast, setToast]               = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const textareaRef                     = useRef<HTMLTextAreaElement>(null);

  const contenuActuel = pageActive ? (contenuEdite[pageActive.slug] ?? '') : '';
  const modifie       = pageActive ? contenuActuel !== (original[pageActive.slug] ?? '') : false;

  // ── Charger ──────────────────────────────────────────────────────────────
  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/studio/pages/${gestionnaireId}`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const liste: Page[] = data.pages || [];
      setPages(liste);
      const map: Record<string, string> = {};
      liste.forEach(p => { map[p.slug] = p.contenu ?? ''; });
      setContenuEdite(map);
      setOriginal({ ...map });
      if (liste.length > 0 && !pageActive) setPageActive(liste[0]);
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  }, [gestionnaireId, token]);

  useEffect(() => { charger(); }, [charger]);

  // ── Toast auto-dismiss ────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Créer une page ────────────────────────────────────────────────────────
  async function creerPage(titre: string, description: string) {
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/studio/pages/${gestionnaireId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ titre, meta_description: description }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setShowCreation(false);
      await charger();
      setPageActive(data.page);
      setToast({ msg: 'Page créée !', type: 'ok' });
    } catch (e: any) {
      setToast({ msg: e.message || 'Erreur lors de la création.', type: 'err' });
    } finally { setCreating(false); }
  }

  // ── Sauvegarder ──────────────────────────────────────────────────────────
  async function sauvegarder() {
    if (!pageActive) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/studio/pages/${gestionnaireId}/${pageActive.slug}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contenu: contenuActuel }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setOriginal(prev => ({ ...prev, [pageActive.slug]: contenuActuel }));
      await charger();
      setToast({ msg: 'Page sauvegardée !', type: 'ok' });
    } catch (e: any) {
      setToast({ msg: e.message || 'Erreur lors de la sauvegarde.', type: 'err' });
    } finally { setSaving(false); }
  }

  // ── Toggle actif ──────────────────────────────────────────────────────────
  async function toggleActif() {
    if (!pageActive) return;
    try {
      await fetch(`${API_BASE}/studio/pages/${gestionnaireId}/${pageActive.slug}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ actif: !pageActive.actif }),
      });
      await charger();
      setToast({ msg: `Page ${pageActive.actif ? 'désactivée' : 'activée'}.`, type: 'ok' });
    } catch { setToast({ msg: 'Erreur.', type: 'err' }); }
  }

  // ── Toggle menu ───────────────────────────────────────────────────────────
  async function toggleMenu() {
    if (!pageActive) return;
    try {
      await fetch(`${API_BASE}/studio/pages/${gestionnaireId}/${pageActive.slug}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ afficher_dans_menu: !pageActive.afficher_dans_menu }),
      });
      await charger();
      setToast({ msg: 'Menu mis à jour.', type: 'ok' });
    } catch { setToast({ msg: 'Erreur.', type: 'err' }); }
  }

  // ── Supprimer ─────────────────────────────────────────────────────────────
  async function supprimerPage() {
    if (!pageASupprimer) return;
    setDeleting(true);
    try {
      await fetch(`${API_BASE}/studio/pages/${gestionnaireId}/${pageASupprimer.slug}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      setPageASupprimer(null);
      setPageActive(null);
      await charger();
      setToast({ msg: 'Page supprimée.', type: 'ok' });
    } catch { setToast({ msg: 'Erreur lors de la suppression.', type: 'err' }); }
    finally { setDeleting(false); }
  }

  // ── Insérer balise HTML ───────────────────────────────────────────────────
  function insererBalise(avant: string, apres: string = '') {
    const ta = textareaRef.current;
    if (!ta || !pageActive) return;
    const slug    = pageActive.slug;
    const contenu = contenuEdite[slug] || '';
    const debut   = ta.selectionStart;
    const fin     = ta.selectionEnd;
    const sel     = contenu.slice(debut, fin);
    const nouveau = contenu.slice(0, debut) + avant + sel + apres + contenu.slice(fin);
    setContenuEdite(prev => ({ ...prev, [slug]: nouveau }));
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(debut + avant.length, debut + avant.length + sel.length);
    }, 10);
  }

  const estHTML       = /<[a-z][\s\S]*>/i.test(contenuActuel);
  const contenuApercu = estHTML ? contenuActuel : contenuActuel.split('\n').map(l => l.trim() ? `<p>${l}</p>` : '<br/>').join('');

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });

  // ── Chargement ────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: C.textLight, fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>📄</div>
        <p style={{ margin: 0, fontSize: '14px' }}>Chargement de vos pages…</p>
      </div>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '28px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes slideIn  { from { opacity:0; transform:translateX(-6px); } to { opacity:1; transform:translateX(0); } }
        .toolbar-btn:hover  { background: #c9a96e !important; color: #fff !important; }
        .page-item:hover    { background: rgba(201,169,110,0.06) !important; }
        .politique-apercu h1 { font-size:22px; font-weight:800; margin:0 0 16px; color:${C.text}; border-bottom:2px solid ${C.gold}; padding-bottom:8px; }
        .politique-apercu h2 { font-size:16px; font-weight:700; margin:20px 0 8px; color:${C.text}; border-bottom:1px solid ${C.border}; padding-bottom:4px; }
        .politique-apercu h3 { font-size:14px; font-weight:700; margin:14px 0 6px; color:${C.text}; }
        .politique-apercu p  { margin:0 0 10px; line-height:1.7; color:${C.textLight}; font-size:14px; }
        .politique-apercu ul,.politique-apercu ol { margin:0 0 10px; padding-left:22px; }
        .politique-apercu li { margin-bottom:4px; color:${C.textLight}; line-height:1.6; font-size:14px; }
        .politique-apercu a  { color:${C.gold}; text-decoration:underline; }
        .politique-apercu strong { color:${C.text}; }
        .politique-apercu blockquote { border-left:3px solid ${C.gold}; padding:8px 16px; margin:12px 0; background:${C.goldLight}; border-radius:0 8px 8px 0; }
        .politique-apercu img { max-width:100%; border-radius:10px; }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {showCreation && <ModalCreation onCreer={creerPage} onFermer={() => setShowCreation(false)} creating={creating} />}
      {pageASupprimer && <ModalSuppression page={pageASupprimer} onConfirmer={supprimerPage} onAnnuler={() => setPageASupprimer(null)} deleting={deleting} />}

      {/* ══ En-tête ══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(201,169,110,0.3)' }}>📄</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: C.text }}>Mes pages</h1>
            <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>Guides, FAQ, documents — créez autant de pages que vous voulez</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreation(true)}
          style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(201,169,110,0.3)' }}
        >
          ＋ Nouvelle page
        </button>
      </div>

      {/* ══ Bandeau explicatif ══ */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0f1e 100%)', border: `1px solid rgba(201,169,110,0.25)`, borderRadius: '16px', padding: '18px 22px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div style={{ fontSize: '28px', flexShrink: 0 }}>💡</div>
        <div>
          <p style={{ margin: '0 0 5px', fontSize: '14px', fontWeight: 700, color: C.gold }}>À quoi servent ces pages ?</p>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.60)', lineHeight: 1.7 }}>
            Créez des pages informatives pour vos visiteurs : guide d'utilisation, FAQ, page À propos, instructions de soins, etc. Chaque page a son propre URL sur votre site et peut apparaître dans votre menu de navigation.
          </p>
        </div>
      </div>

      {/* ══ Layout liste + éditeur ══ */}
      {pages.length === 0 ? (
        /* État vide */
        <div style={{ background: C.card, border: `2px dashed ${C.border}`, borderRadius: '20px', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📄</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: C.text }}>Aucune page pour l'instant</h2>
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: C.textLight }}>Créez votre première page — guide, FAQ, À propos…</p>
          <button onClick={() => setShowCreation(true)} style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 16px rgba(201,169,110,0.35)' }}>
            ＋ Créer ma première page
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'start' }}>

          {/* ── Liste des pages ── */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', position: 'sticky', top: '20px' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '1px', padding: '14px 16px 10px', borderBottom: `1px solid ${C.border}` }}>
              Vos pages ({pages.length})
            </p>

            {pages.map(page => {
              const estActif = pageActive?.slug === page.slug;
              return (
                <button
                  key={page.slug}
                  className="page-item"
                  onClick={() => { setPageActive(page); setModeEdition('html'); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', border: 'none', cursor: 'pointer', borderBottom: `1px solid ${C.border}`, background: estActif ? C.goldLight : 'transparent', borderLeft: estActif ? `3px solid ${C.gold}` : '3px solid transparent', transition: 'all 0.15s', textAlign: 'left' }}
                >
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>{page.actif ? '📄' : '🔒'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: estActif ? 700 : 500, color: estActif ? C.gold : C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {page.titre}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: C.textXLight }}>
                      /{page.slug}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', background: page.actif ? C.greenLight : C.redLight, color: page.actif ? C.green : C.red }}>
                      {page.actif ? '● Actif' : '○ Inactif'}
                    </span>
                    {page.afficher_dans_menu && (
                      <span style={{ fontSize: '10px', color: C.textXLight }}>📋 Menu</span>
                    )}
                  </div>
                </button>
              );
            })}

            <div style={{ padding: '12px 16px' }}>
              <button onClick={() => setShowCreation(true)} style={{ width: '100%', padding: '9px', background: C.goldLight, border: `1px dashed ${C.gold}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: C.gold, cursor: 'pointer' }}>
                ＋ Nouvelle page
              </button>
            </div>
          </div>

          {/* ── Éditeur ── */}
          {pageActive && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', animation: 'slideIn 0.2s ease' }} key={pageActive.slug}>

              {/* Header */}
              <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <h2 style={{ margin: '0 0 2px', fontSize: '17px', fontWeight: 800, color: C.text }}>{pageActive.titre}</h2>
                    <p style={{ margin: 0, fontSize: '12px', color: C.textXLight, fontFamily: 'monospace' }}>/{pageActive.slug}</p>
                    {pageActive.updated_at && (
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: C.textXLight }}>Mis à jour : {formatDate(pageActive.updated_at)}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {modifie && (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: C.orange, background: C.orangeLight, padding: '3px 10px', borderRadius: '20px' }}>
                        ● Non sauvegardé
                      </span>
                    )}
                    {/* Toggle actif */}
                    <button onClick={toggleActif} style={{ padding: '6px 14px', background: pageActive.actif ? C.greenLight : C.redLight, border: `1px solid ${pageActive.actif ? C.green : C.red}`, borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: pageActive.actif ? C.green : C.red, cursor: 'pointer' }}>
                      {pageActive.actif ? '● Actif' : '○ Inactif'}
                    </button>
                    {/* Toggle menu */}
                    <button onClick={toggleMenu} style={{ padding: '6px 14px', background: pageActive.afficher_dans_menu ? C.goldLight : '#f3f4f6', border: `1px solid ${pageActive.afficher_dans_menu ? C.gold : C.border}`, borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: pageActive.afficher_dans_menu ? C.gold : C.textLight, cursor: 'pointer' }}>
                      {pageActive.afficher_dans_menu ? '📋 Dans le menu' : '📋 Hors menu'}
                    </button>
                    {/* Aperçu */}
                    <button onClick={() => setModeEdition(m => m === 'apercu' ? 'html' : 'apercu')} style={{ padding: '6px 14px', background: modeEdition === 'apercu' ? C.gold : '#f0f2f5', border: `1px solid ${modeEdition === 'apercu' ? C.gold : C.border}`, borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: modeEdition === 'apercu' ? '#fff' : C.text, cursor: 'pointer' }}>
                      {modeEdition === 'apercu' ? '✏️ Éditer' : '👁 Aperçu'}
                    </button>
                    {/* Supprimer */}
                    <button onClick={() => setPageASupprimer(pageActive)} style={{ padding: '6px 12px', background: C.redLight, border: `1px solid ${C.red}`, borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: C.red, cursor: 'pointer' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              {/* Mode aperçu */}
              {modeEdition === 'apercu' ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                    <span style={{ fontSize: '13px', color: C.textLight }}>Aperçu — tel qu'il apparaîtra sur votre site</span>
                    <button onClick={() => setModeEdition('html')} style={{ padding: '5px 12px', background: '#f0f2f5', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: C.text, fontWeight: 600 }}>
                      ✏️ Retour à l'édition
                    </button>
                  </div>
                  {contenuActuel.trim() ? (
                    <div className="politique-apercu" style={{ padding: '36px 48px', maxHeight: '600px', overflowY: 'auto' }} dangerouslySetInnerHTML={{ __html: contenuApercu }} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px', color: C.textLight }}>
                      <p style={{ fontSize: '40px', marginBottom: '10px' }}>📝</p>
                      <p>Aucun contenu à afficher. Commencez à rédiger.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* Barre d'outils */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap', background: '#f8fafc' }}>
                    <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 600, marginRight: '4px', whiteSpace: 'nowrap' }}>Mise en forme :</span>
                    {[
                      { label: 'G',   avant: '<strong>', apres: '</strong>', title: 'Gras' },
                      { label: 'I',   avant: '<em>',     apres: '</em>',     title: 'Italique' },
                      { label: 'H1',  avant: '<h1>',     apres: '</h1>',     title: 'Titre principal' },
                      { label: 'H2',  avant: '<h2>',     apres: '</h2>',     title: 'Titre section' },
                      { label: 'H3',  avant: '<h3>',     apres: '</h3>',     title: 'Sous-titre' },
                      { label: '🔗',  avant: '<a href="">', apres: '</a>',   title: 'Lien' },
                      { label: '🖼',  avant: '<img src="" alt="" style="max-width:100%;border-radius:10px;" />', apres: '', title: 'Image' },
                      { label: '📋',  avant: '<ul>\n  <li>', apres: '</li>\n</ul>', title: 'Liste à puces' },
                      { label: '1.',  avant: '<ol>\n  <li>', apres: '</li>\n</ol>', title: 'Liste numérotée' },
                      { label: '💬',  avant: '<blockquote>', apres: '</blockquote>', title: 'Citation' },
                      { label: '—',   avant: '\n<hr />\n', apres: '',        title: 'Séparateur' },
                      { label: '§',   avant: '<p>',      apres: '</p>',      title: 'Paragraphe' },
                    ].map(btn => (
                      <button key={btn.label} className="toolbar-btn" title={btn.title} onClick={() => insererBalise(btn.avant, btn.apres)}
                        style={{ padding: '4px 8px', border: `1px solid ${C.border}`, borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: C.text, transition: 'all 0.15s', minWidth: '28px' }}>
                        {btn.label}
                      </button>
                    ))}
                    <div style={{ width: '1px', height: '20px', background: C.border, margin: '0 4px' }} />
                    <span style={{ fontSize: '11px', color: C.textXLight }}>HTML supporté</span>
                  </div>

                  {/* Zone de texte */}
                  <textarea
                    ref={textareaRef}
                    value={contenuActuel}
                    onChange={e => setContenuEdite(prev => ({ ...prev, [pageActive.slug]: e.target.value }))}
                    placeholder={`Rédigez le contenu de "${pageActive.titre}" ici…\n\nUtilisez les boutons ci-dessus pour formater en HTML.\nExemple : <h2>Introduction</h2><p>Votre texte ici…</p>`}
                    spellCheck={false}
                    style={{ width: '100%', minHeight: '460px', padding: '20px', border: 'none', outline: 'none', fontSize: '13px', fontFamily: 'monospace', lineHeight: '1.7', color: C.text, resize: 'vertical', boxSizing: 'border-box', background: '#fff' }}
                  />

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: `1px solid ${C.border}`, background: '#f8fafc' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: C.textLight }}>{contenuActuel.length} caractères</span>
                      {modifie && <span style={{ fontSize: '12px', color: C.orange, fontWeight: 600 }}>● Non sauvegardé</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {modifie && (
                        <button onClick={() => setContenuEdite(prev => ({ ...prev, [pageActive.slug]: original[pageActive.slug] ?? '' }))}
                          style={{ padding: '8px 16px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: C.textLight, fontWeight: 600 }}>
                          Annuler
                        </button>
                      )}
                      <button onClick={sauvegarder} disabled={saving || !modifie}
                        style={{ padding: '9px 22px', background: modifie ? 'linear-gradient(135deg, #c9a96e, #a07840)' : '#cbd5e1', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, color: modifie ? '#fff' : '#94a3b8', cursor: modifie ? 'pointer' : 'not-allowed', boxShadow: modifie ? '0 4px 12px rgba(201,169,110,0.35)' : 'none', transition: 'all 0.15s' }}>
                        {saving ? '⏳ Sauvegarde…' : '💾 Enregistrer'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}