// CHEMIN : src/pages/gestionnaire/StudioSignalements.tsx
// e-Vend Studio — Dashboard gestionnaire : signalements de boutiques de ses collaborateurs
// API : /api/studio/collaborateurs/:gestionnaireId/signalements[/count|/:id]

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

type Statut = 'nouveau' | 'vu' | 'traite' | 'rejete';

interface Signalement {
  id: number; collaborateur_id: number; collaborateur_nom: string;
  signaleur_nom: string; signaleur_email: string;
  raison_type: string; raison_autre: string | null; description: string;
  statut: Statut; note_admin: string | null; traite_par: string | null;
  date_traitement: string | null; created_at: string;
}

const C = {
  accent: '#c9a96e', accentLight: 'rgba(201,169,110,0.12)',
  green: '#10b981', red: '#ef4444', blue: '#3b82f6', orange: '#f59e0b',
  bg: '#f4f6f8', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#64748b', textMuted: '#94a3b8',
};

const RAISONS: Record<string, string> = {
  produit_fake: '🎭 Produit faux / contrefait', arnaque: '💸 Arnaque / fraude',
  comportement: '😡 Comportement inapproprié', livraison: '📦 Problème de livraison',
  qualite: '👎 Mauvaise qualité', autre: '❓ Autre',
};
const STATUTS: Record<Statut, { label: string; color: string }> = {
  nouveau: { label: 'Nouveau', color: C.red },
  vu: { label: 'Vu', color: C.blue },
  traite: { label: 'Traité', color: C.green },
  rejete: { label: 'Rejeté', color: C.textLight },
};

const fmtDate = (d: string | null) => {
  if (!d) return '';
  try { return new Date(d).toLocaleString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
};
const raisonTexte = (s: Signalement) =>
  (RAISONS[s.raison_type] || RAISONS.autre) + (s.raison_type === 'autre' && s.raison_autre ? ` — ${s.raison_autre}` : '');

const entetes = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const Pastille: React.FC<{ statut: Statut }> = ({ statut }) => (
  <span style={{ background: STATUTS[statut].color + '1a', color: STATUTS[statut].color, border: `1px solid ${STATUTS[statut].color}55`, padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
    {STATUTS[statut].label}
  </span>
);

const StudioSignalements: React.FC<{ gestionnaireId: number }> = ({ gestionnaireId }) => {
  const base = `${API_BASE}/studio/collaborateurs/${gestionnaireId}/signalements`;
  const [liste, setListe] = useState<Signalement[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filtre, setFiltre] = useState('');
  const [recherche, setRecherche] = useState('');
  const [rechercheInput, setRechercheInput] = useState('');
  const [nouveaux, setNouveaux] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [detail, setDetail] = useState<Signalement | null>(null);
  const [note, setNote] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [confirmSuppr, setConfirmSuppr] = useState<Signalement | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; texte: string } | null>(null);

  const notifier = (ok: boolean, texte: string) => { setToast({ ok, texte }); setTimeout(() => setToast(null), 3500); };
  const rafraichirBadge = () => window.dispatchEvent(new Event('signalements-maj'));

  const charger = useCallback(async () => {
    setChargement(true); setErreur('');
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (filtre) p.set('statut', filtre);
      if (recherche) p.set('recherche', recherche);
      const [r, c] = await Promise.all([
        fetch(`${base}?${p}`, { credentials: 'include', headers: entetes() }),
        fetch(`${base}/count`, { credentials: 'include', headers: entetes() }),
      ]);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setListe(d.signalements || []); setTotal(d.total || 0); setPages(d.totalPages || 1);
      if (c.ok) setNouveaux((await c.json()).nouveaux || 0);
    } catch { setErreur('Impossible de charger les signalements.'); }
    setChargement(false);
  }, [base, page, filtre, recherche]);

  useEffect(() => { charger(); }, [charger]);

  const changerStatut = async (s: Signalement, statut: Statut, noteAdmin = '') => {
    setEnCours(true);
    try {
      const r = await fetch(`${base}/${s.id}`, {
        method: 'PUT', credentials: 'include', headers: entetes(),
        body: JSON.stringify({ statut, note_admin: noteAdmin }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { notifier(false, d.error || 'Erreur lors de la mise à jour.'); setEnCours(false); return false; }
      setListe((l) => l.map((x) => (x.id === s.id ? { ...x, ...d.signalement } : x)));
      setDetail((cur) => (cur && cur.id === s.id ? { ...cur, ...d.signalement } : cur));
      rafraichirBadge();
      setEnCours(false);
      return true;
    } catch { notifier(false, 'Erreur réseau.'); setEnCours(false); return false; }
  };

  const ouvrir = async (s: Signalement) => {
    setDetail(s); setNote('');
    if (s.statut === 'nouveau') {
      if (await changerStatut(s, 'vu')) setNouveaux((n) => Math.max(0, n - 1));
    }
  };

  const decider = async (statut: Statut) => {
    if (!detail) return;
    const ok = await changerStatut(detail, statut, note.trim());
    if (ok) { setNote(''); notifier(true, statut === 'traite' ? 'Signalement marqué comme traité.' : statut === 'rejete' ? 'Signalement rejeté.' : 'Signalement mis à jour.'); }
  };

  const supprimer = async () => {
    if (!confirmSuppr) return;
    setEnCours(true);
    try {
      const r = await fetch(`${base}/${confirmSuppr.id}`, { method: 'DELETE', credentials: 'include', headers: entetes() });
      if (!r.ok) throw new Error();
      setConfirmSuppr(null); setDetail(null); notifier(true, 'Signalement supprimé.');
      rafraichirBadge(); charger();
    } catch { notifier(false, 'Suppression impossible.'); }
    setEnCours(false);
  };

  const btn = (couleur: string, plein = true): React.CSSProperties => ({
    padding: '9px 16px', borderRadius: 8, border: `1px solid ${couleur}`, cursor: enCours ? 'wait' : 'pointer',
    background: plein ? couleur : '#fff', color: plein ? '#fff' : couleur, fontWeight: 600, fontSize: 14,
  });

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 22 }}>🚩 Signalements</h2>
        {nouveaux > 0 && (
          <span style={{ background: C.red, color: '#fff', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 12 }}>
            {nouveaux} nouveau{nouveaux > 1 ? 'x' : ''}
          </span>
        )}
      </div>
      <p style={{ margin: '0 0 16px', color: C.textLight, fontSize: 14 }}>
        Signalements faits par des visiteurs sur les boutiques de vos collaborateurs · {total} résultat{total > 1 ? 's' : ''}
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); setRecherche(rechercheInput.trim()); }} style={{ display: 'flex', gap: 8, flex: '1 1 260px' }}>
          <input value={rechercheInput} maxLength={100} placeholder="Rechercher (boutique, nom, courriel, texte)…"
            onChange={(e) => setRechercheInput(e.target.value.replace(/[\u0000-\u001F<>`\\]/g, ''))}
            style={{ flex: 1, padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, minWidth: 0 }} />
          <button type="submit" style={btn(C.accent)}>🔍</button>
        </form>
        <select value={filtre} onChange={(e) => { setPage(1); setFiltre(e.target.value); }}
          style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, background: '#fff' }}>
          <option value="">Tous les statuts</option>
          <option value="nouveau">Nouveaux</option>
          <option value="vu">Vus</option>
          <option value="traite">Traités</option>
          <option value="rejete">Rejetés</option>
        </select>
      </div>

      {erreur && <div style={{ background: '#fef2f2', color: C.red, border: '1px solid #fecaca', padding: 12, borderRadius: 8, marginBottom: 12 }}>{erreur}</div>}

      {chargement ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>Chargement…</div>
      ) : liste.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, color: C.textLight }}>
          <div style={{ fontSize: 40 }}>✅</div>
          <div style={{ marginTop: 8 }}>Aucun signalement{filtre || recherche ? ' pour ces critères' : ''}.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {liste.map((s) => (
            <div key={s.id} onClick={() => ouvrir(s)} style={{
              background: C.card, border: `1px solid ${s.statut === 'nouveau' ? C.red : C.border}`,
              borderLeft: `4px solid ${STATUTS[s.statut].color}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: C.text, fontSize: 15, overflowWrap: 'anywhere' }}>🏪 {s.collaborateur_nom}</div>
                  <div style={{ color: C.textLight, fontSize: 13, marginTop: 2 }}>{raisonTexte(s)}</div>
                </div>
                <Pastille statut={s.statut} />
              </div>
              <div style={{ color: C.text, fontSize: 14, marginTop: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere' }}>{s.description}</div>
              <div style={{ color: C.textMuted, fontSize: 12, marginTop: 8 }}>Par {s.signaleur_nom} · {fmtDate(s.created_at)}</div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 18 }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ ...btn(C.accent, false), opacity: page <= 1 ? 0.4 : 1 }}>← Précédent</button>
          <span style={{ color: C.textLight, fontSize: 14 }}>Page {page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} style={{ ...btn(C.accent, false), opacity: page >= pages ? 0.4 : 1 }}>Suivant →</button>
        </div>
      )}

      {/* Détail */}
      {detail && (
        <div onClick={() => setDetail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <h3 style={{ margin: 0, color: C.text, overflowWrap: 'anywhere' }}>🏪 {detail.collaborateur_nom}</h3>
              <Pastille statut={detail.statut} />
            </div>
            <div style={{ marginTop: 14, fontSize: 14, color: C.text, lineHeight: 1.6 }}>
              <div><b>Raison :</b> {raisonTexte(detail)}</div>
              <div><b>Signalé par :</b> {detail.signaleur_nom} (<a href={`mailto:${encodeURIComponent(detail.signaleur_email).replace('%40', '@')}`} style={{ color: C.blue }}>{detail.signaleur_email}</a>)</div>
              <div><b>Date :</b> {fmtDate(detail.created_at)}</div>
            </div>
            <div style={{ marginTop: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 14, color: C.text }}>
              {detail.description}
            </div>
            {detail.note_admin && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.textLight, marginBottom: 4 }}>Notes</div>
                <div style={{ background: C.accentLight, borderRadius: 8, padding: 10, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 13, color: C.text }}>{detail.note_admin}</div>
              </div>
            )}
            {detail.date_traitement && (
              <div style={{ marginTop: 8, fontSize: 12, color: C.textMuted }}>Clôturé le {fmtDate(detail.date_traitement)}{detail.traite_par ? ` par ${detail.traite_par}` : ''}</div>
            )}
            <textarea value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} placeholder="Ajouter une note (optionnel)…" rows={3}
              style={{ width: '100%', boxSizing: 'border-box', marginTop: 14, padding: 10, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              <button disabled={enCours} onClick={() => decider('traite')} style={btn(C.green)}>✅ Traité</button>
              <button disabled={enCours} onClick={() => decider('rejete')} style={btn(C.textLight)}>🚫 Rejeter</button>
              {detail.statut !== 'vu' && <button disabled={enCours} onClick={() => decider('vu')} style={btn(C.blue, false)}>👁 Marquer vu</button>}
              <button disabled={enCours} onClick={() => setConfirmSuppr(detail)} style={{ ...btn(C.red, false), marginLeft: 'auto' }}>🗑 Supprimer</button>
              <button onClick={() => setDetail(null)} style={btn(C.textLight, false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation de suppression */}
      {confirmSuppr && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div role="alertdialog" aria-modal="true" style={{ background: '#fff', borderRadius: 14, maxWidth: 400, width: '100%', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 40 }}>🗑</div>
            <h3 style={{ margin: '8px 0', color: C.text }}>Supprimer ce signalement ?</h3>
            <p style={{ color: C.textLight, fontSize: 14, margin: '0 0 18px' }}>Cette action est définitive.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmSuppr(null)} style={btn(C.textLight, false)}>Annuler</button>
              <button disabled={enCours} onClick={supprimer} style={btn(C.red)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 2200, background: toast.ok ? C.green : C.red, color: '#fff', padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }}>
          {toast.ok ? '✅ ' : '⚠️ '}{toast.texte}
        </div>
      )}
    </div>
  );
};

export default StudioSignalements;