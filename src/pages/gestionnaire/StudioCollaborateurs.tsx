/**
 * StudioCollaborateurs.tsx — e-Vend Studio
 * Chemin : src/pages/gestionnaire/StudioCollaborateurs.tsx
 *
 * Gestion des collaborateurs du site marketplace du vendeur.
 * Inspiré de ListeVendeurs.tsx d'e-Vend — adapté pour Studio.
 *
 * Routes API :
 *   GET    /api/studio/collaborateurs/:gestionnaireId
 *   POST   /api/studio/collaborateurs/:gestionnaireId
 *   PUT    /api/studio/collaborateurs/:gestionnaireId/:id/statut
 *   PUT    /api/studio/collaborateurs/:gestionnaireId/:id/mot-de-passe
 *   DELETE /api/studio/collaborateurs/:gestionnaireId/:id
 *   PUT    /api/studio/collaborateurs/:gestionnaireId/bulk/statut
 *   DELETE /api/studio/collaborateurs/:gestionnaireId/bulk
 *   GET/POST/DELETE /api/studio/collaborateurs/:gestionnaireId/:id/notes/...
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const API_BASE = (window as any).API_BASE || '/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Note { id: number; contenu: string; auteur: string; date: string; }

interface Collaborateur {
  id:           number;
  email:        string;
  nom:          string;
  nom_boutique: string;
  telephone:    string;
  statut:       'actif' | 'suspendu' | 'pending' | 'rejected' | 'banni' | 'vacances';
  plan:         string;
  logo_url:     string;
  description:  string;
  nb_notes:     number;
  created_at:   string;
  notes?:       Note[];
}

type ActionType = 'desactiver' | 'reactiver' | 'supprimer' | 'desactiver_bulk' | 'reactiver_bulk' | 'supprimer_bulk' | null;

// ─── Thème ────────────────────────────────────────────────────────────────────
const T = {
  bg:        '#f0f2f5',
  card:      '#ffffff',
  border:    '#e1e4e8',
  accent:    '#c9a96e',
  accentL:   'rgba(201,169,110,0.12)',
  text:      '#1a2332',
  textLight: '#6b7280',
  success:   '#16a34a',
  warning:   '#d97706',
  danger:    '#dc2626',
  orange:    '#ea580c',
  purple:    '#7c3aed',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function dureeDepuis(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return "aujourd'hui";
  if (diff === 1) return 'hier';
  if (diff < 7)  return `${diff}j`;
  if (diff < 30) return `${Math.floor(diff/7)} sem.`;
  return `${Math.floor(diff/30)} mois`;
}

function statutStyle(statut: string) {
  switch(statut) {
    case 'actif':    return { bg: '#dcfce7', color: T.success,  label: '✅ Actif' };
    case 'suspendu': return { bg: '#ffedd5', color: T.orange,   label: '🔒 Suspendu' };
    case 'pending':  return { bg: '#fef9c3', color: T.warning,  label: '⏳ En attente' };
    case 'rejected': return { bg: '#fee2e2', color: T.danger,   label: '❌ Refusé' };
    case 'banni':    return { bg: '#f3e8ff', color: T.purple,   label: '🚫 Banni' };
    case 'vacances': return { bg: '#e0f2fe', color: '#0369a1',  label: '🌴 Vacances' };
    default:         return { bg: '#f3f4f6', color: T.textLight, label: statut };
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div style={{ position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)', background: type === 'success' ? T.success : T.danger, color: '#fff', padding: '11px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, zIndex: 9999, boxShadow: '0 6px 24px rgba(0,0,0,0.18)', animation: 'fadeInUp 0.25s ease', whiteSpace: 'nowrap' }}>
      {msg}
    </div>
  );
}

// ─── Modal Création ───────────────────────────────────────────────────────────
function ModalCreation({ onCreer, onFermer, creating }: { onCreer: (d: any) => void; onFermer: () => void; creating: boolean }) {
  const [email, setEmail]       = useState('');
  const [mdp, setMdp]           = useState('');
  const [nom, setNom]           = useState('');
  const [boutique, setBoutique] = useState('');

  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box' as const, padding: '9px 12px', border: `1px solid #cbd5e1`, borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#f8fafc' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => e.target === e.currentTarget && onFermer()}>
      <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #c9a96e 100%)', color: '#fff' }}>
          <p style={{ fontSize: '17px', fontWeight: 900, margin: 0 }}>➕ Ajouter un collaborateur</p>
          <p style={{ fontSize: '12px', opacity: 0.75, margin: '4px 0 0' }}>Il pourra se connecter à votre marketplace.</p>
        </div>
        <div style={{ padding: '24px' }}>
          {[
            { label: 'Nom complet', val: nom, set: setNom, placeholder: 'Jean Tremblay' },
            { label: 'Nom de boutique', val: boutique, set: setBoutique, placeholder: 'Ma Super Boutique' },
            { label: 'Courriel *', val: email, set: setEmail, placeholder: 'vendeur@exemple.ca', type: 'email' },
            { label: 'Mot de passe *', val: mdp, set: setMdp, placeholder: '••••••••', type: 'password' },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.textLight, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{f.label}</label>
              <input type={(f as any).type || 'text'} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={inp} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button onClick={onFermer} style={{ padding: '9px 18px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: T.textLight }}>Annuler</button>
            <button onClick={() => email && mdp && onCreer({ email, mot_de_passe: mdp, nom, nom_boutique: boutique })} disabled={!email || !mdp || creating}
              style={{ padding: '9px 22px', background: email && mdp ? 'linear-gradient(135deg, #c9a96e, #a07840)' : '#cbd5e1', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: email && mdp ? '#fff' : '#94a3b8', cursor: email && mdp ? 'pointer' : 'not-allowed' }}>
              {creating ? '⏳…' : '✅ Créer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Notes ──────────────────────────────────────────────────────────────
function ModalNotes({ sv, notes, onAjouter, onSupprimer, onFermer }: {
  sv: Collaborateur; notes: Note[]; onAjouter: (c: string) => void; onSupprimer: (id: number) => void; onFermer: () => void;
}) {
  const [texte, setTexte]         = useState('');
  const [aSupprimer, setASupprimer] = useState<number | null>(null);
  const st = statutStyle(sv.statut);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => e.target === e.currentTarget && onFermer()}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d4a6e 100%)', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📋</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: 900, margin: 0 }}>{sv.nom || sv.email}</p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0' }}>🏪 {sv.nom_boutique || '—'} · {sv.email}</p>
              </div>
            </div>
            <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
          <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '10px', background: st.bg, color: st.color }}>{st.label}</span>
            <span style={{ fontSize: '12px', opacity: 0.7 }}>Plan : {sv.plan}</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>📋 Notes ({notes.length})</h4>

          {notes.length === 0 ? (
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '20px', textAlign: 'center', color: T.textLight, fontSize: '13px' }}>Aucune note pour ce collaborateur.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {[...notes].reverse().map(note => (
                <div key={note.id} style={{ background: '#f8fafc', border: `1px solid ${T.border}`, borderRadius: '10px', padding: '12px 14px', position: 'relative' }}>
                  {aSupprimer === note.id ? (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.97)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', zIndex: 10 }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: T.danger, margin: 0 }}>🗑️ Supprimer cette note ?</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setASupprimer(null)} style={{ padding: '5px 12px', border: `1px solid ${T.border}`, borderRadius: '6px', background: '#fff', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                        <button onClick={() => { onSupprimer(note.id); setASupprimer(null); }} style={{ padding: '5px 12px', border: 'none', borderRadius: '6px', background: T.danger, color: '#fff', fontSize: '12px', cursor: 'pointer' }}>Supprimer</button>
                      </div>
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#fff' }}>{note.auteur.charAt(0)}</div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: T.text }}>{note.auteur}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: T.textLight }}>{note.date}</span>
                      <button onClick={() => setASupprimer(note.id)} style={{ width: '20px', height: '20px', border: 'none', borderRadius: '50%', background: '#fee2e2', color: T.danger, fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: T.text, margin: 0, lineHeight: 1.6 }}>{note.contenu}</p>
                </div>
              ))}
            </div>
          )}

          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>✍️ Nouvelle note</h4>
            <textarea value={texte} onChange={e => setTexte(e.target.value)} rows={3} placeholder="Ajouter une note interne..." style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} />
            <button onClick={() => { if (texte.trim()) { onAjouter(texte.trim()); setTexte(''); } }} disabled={!texte.trim()} style={{ marginTop: '8px', padding: '9px 20px', background: texte.trim() ? 'linear-gradient(135deg, #c9a96e, #a07840)' : '#cbd5e1', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: texte.trim() ? '#fff' : '#94a3b8', cursor: texte.trim() ? 'pointer' : 'not-allowed' }}>
              📋 Ajouter la note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Confirmation ───────────────────────────────────────────────────────
function ModalConfirmation({ type, vendeur, count, onConfirm, onCancel }: {
  type: ActionType; vendeur: Collaborateur | null; count?: number; onConfirm: () => void; onCancel: () => void;
}) {
  const [texteConfirm, setTexteConfirm] = useState('');
  if (!type) return null;

  const isBulk    = type.includes('_bulk');
  const isSuppr   = type.includes('supprimer');
  const isDesact  = type.includes('desactiver');
  const isReact   = type.includes('reactiver');
  const MOT       = 'CONFIRMER';
  const ok        = !isSuppr || texteConfirm === MOT;

  const titre = isBulk
    ? `${isSuppr ? 'Supprimer' : isDesact ? 'Désactiver' : 'Réactiver'} ${count} collaborateur${(count||0) > 1 ? 's' : ''}`
    : `${isSuppr ? 'Supprimer' : isDesact ? 'Désactiver' : 'Réactiver'} ce collaborateur`;

  const couleur = isSuppr ? T.danger : isDesact ? T.warning : T.success;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg, #1a2436, #2d4a6e)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>{isSuppr ? '🗑️' : isDesact ? '⚠️' : '✅'} {titre}</p>
          <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '20px 22px' }}>
          {!isBulk && vendeur && (
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', border: `1px solid ${T.border}` }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: T.accent, margin: '0 0 2px' }}>{vendeur.nom || vendeur.email}</p>
              <p style={{ fontSize: '12px', color: T.textLight, margin: 0 }}>{vendeur.nom_boutique} · {vendeur.email}</p>
            </div>
          )}
          {isSuppr && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: T.text, margin: '0 0 12px', lineHeight: 1.6 }}>
                <strong>⚠️ Cette action est irréversible.</strong> Toutes les données de {isBulk ? 'ces collaborateurs' : 'ce collaborateur'} seront supprimées définitivement.
              </p>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Tapez <strong style={{ color: T.danger }}>{MOT}</strong> pour confirmer :
              </label>
              <input value={texteConfirm} onChange={e => setTexteConfirm(e.target.value.toUpperCase())} placeholder={MOT} style={{ width: '100%', boxSizing: 'border-box' as const, padding: '10px 12px', border: `2px solid ${texteConfirm === MOT ? T.success : T.border}`, borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', outline: 'none' }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={onCancel} style={{ padding: '10px 20px', border: `1px solid ${T.border}`, borderRadius: '8px', background: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
            <button onClick={onConfirm} disabled={!ok} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', background: ok ? couleur : '#ccc', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: ok ? 'pointer' : 'not-allowed' }}>
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Reset MDP ──────────────────────────────────────────────────────────
function ModalResetMdp({ sv, onConfirm, onCancel }: { sv: Collaborateur; onConfirm: (mdp: string) => void; onCancel: () => void }) {
  const [mdp, setMdp] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg, #1a2436, #2d4a6e)', color: '#fff' }}>
          <p style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>🔑 Réinitialiser le mot de passe</p>
          <p style={{ fontSize: '12px', opacity: 0.7, margin: '4px 0 0' }}>{sv.nom || sv.email}</p>
        </div>
        <div style={{ padding: '20px 22px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.textLight, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Nouveau mot de passe</label>
          <input type="password" value={mdp} onChange={e => setMdp(e.target.value)} placeholder="Min. 8 caractères" style={{ width: '100%', boxSizing: 'border-box' as const, padding: '10px 12px', border: `1px solid #cbd5e1`, borderRadius: '8px', fontSize: '13px', outline: 'none', marginBottom: '16px' }} />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={onCancel} style={{ padding: '9px 18px', border: `1px solid ${T.border}`, borderRadius: '8px', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
            <button onClick={() => mdp.length >= 8 && onConfirm(mdp)} disabled={mdp.length < 8} style={{ padding: '9px 20px', border: 'none', borderRadius: '8px', background: mdp.length >= 8 ? 'linear-gradient(135deg, #c9a96e, #a07840)' : '#cbd5e1', color: mdp.length >= 8 ? '#fff' : '#94a3b8', fontSize: '13px', fontWeight: 700, cursor: mdp.length >= 8 ? 'pointer' : 'not-allowed' }}>
              Modifier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Changer Statut ────────────────────────────────────────────────────
function ModalStatut({ sv, onConfirm, onCancel }: { sv: Collaborateur; onConfirm: (s: string) => void; onCancel: () => void }) {
  const [choix, setChoix] = useState('');
  const statuts = [
    { value: 'actif',    label: '✅ Actif',      desc: 'Accès complet',                   bg: '#dcfce7', color: T.success },
    { value: 'pending',  label: '⏳ En attente',  desc: "En attente d'approbation",         bg: '#fef9c3', color: T.warning },
    { value: 'suspendu', label: '🔒 Suspendu',    desc: 'Accès temporairement bloqué',      bg: '#ffedd5', color: T.orange },
    { value: 'rejected', label: '❌ Refusé',      desc: "Inscription refusée",              bg: '#fee2e2', color: T.danger },
    { value: 'banni',    label: '🚫 Banni',       desc: 'Banni définitivement',             bg: '#f3e8ff', color: T.purple },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg, #1a2436, #2d4a6e)', color: '#fff', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>🔄 Changer le statut</p>
            <p style={{ fontSize: '12px', opacity: 0.7, margin: '4px 0 0' }}>{sv.nom || sv.email}</p>
          </div>
          <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {statuts.map(s => {
              const estActuel = sv.statut === s.value;
              const isSelected = choix === s.value;
              return (
                <button key={s.value} onClick={() => !estActuel && setChoix(s.value)} disabled={estActuel}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', border: `2px solid ${isSelected ? s.color : T.border}`, background: isSelected ? s.bg : estActuel ? '#f9fafb' : '#fff', cursor: estActuel ? 'not-allowed' : 'pointer', opacity: estActuel ? 0.6 : 1, textAlign: 'left', width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: s.color }}>{s.label}</span>
                      {estActuel && <span style={{ fontSize: '10px', background: '#e5e7eb', color: T.textLight, padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}>ACTUEL</span>}
                    </div>
                    <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>{s.desc}</p>
                  </div>
                  {isSelected && <span style={{ color: s.color, fontWeight: 800, fontSize: '16px' }}>✓</span>}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={onCancel} style={{ padding: '9px 18px', border: `1px solid ${T.border}`, borderRadius: '8px', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
            <button onClick={() => choix && onConfirm(choix)} disabled={!choix} style={{ padding: '9px 20px', border: 'none', borderRadius: '8px', background: choix ? 'linear-gradient(135deg, #c9a96e, #a07840)' : '#cbd5e1', color: choix ? '#fff' : '#94a3b8', fontSize: '13px', fontWeight: 700, cursor: choix ? 'pointer' : 'not-allowed' }}>
              Appliquer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface Props { gestionnaireId: number; }

export default function StudioCollaborateurs({ gestionnaireId }: Props) {
  const token = localStorage.getItem('token');

  const [liste, setListe]           = useState<Collaborateur[]>([]);
  const [loading, setLoading]       = useState(true);
  const [recherche, setRecherche]   = useState('');
  const [filtre, setFiltre]         = useState('tous');
  const [selectionnes, setSelectionnes] = useState<number[]>([]);
  const [toast, setToast]           = useState<{ msg: string; type: 'success'|'error' } | null>(null);
  const [menuOuvert, setMenuOuvert] = useState<number | null>(null);
  const [creating, setCreating]     = useState(false);

  // Modales
  const [modalCreation, setModalCreation]     = useState(false);
  const [modalNotes, setModalNotes]           = useState<Collaborateur | null>(null);
  const [notesCache, setNotesCache]           = useState<Record<number, Note[]>>({});
  const [modalConfirm, setModalConfirm]       = useState<{ type: ActionType; sv: Collaborateur | null }>({ type: null, sv: null });
  const [modalResetMdp, setModalResetMdp]     = useState<Collaborateur | null>(null);
  const [modalStatut, setModalStatut]         = useState<Collaborateur | null>(null);
  const [menuActionsOuvert, setMenuActionsOuvert] = useState(false);

  // ── Charger ──────────────────────────────────────────────────────────────
  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/studio/collaborateurs/${gestionnaireId}`, { credentials: 'include', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setListe(data.collaborateurs || []);
    } catch { showToast('❌ Erreur lors du chargement', 'error'); }
    finally { setLoading(false); }
  }, [gestionnaireId, token]);

  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }, [toast]);

  function showToast(msg: string, type: 'success'|'error') { setToast({ msg, type }); }

  // ── Filtrer ───────────────────────────────────────────────────────────────
  const filtres = useMemo(() => liste.filter(sv => {
    const m = [sv.nom, sv.email, sv.nom_boutique].join(' ').toLowerCase().includes(recherche.toLowerCase());
    const f = filtre === 'tous' ? true : sv.statut === filtre;
    return m && f;
  }), [liste, recherche, filtre]);

  // ── Créer ─────────────────────────────────────────────────────────────────
  async function creer(data: any) {
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/studio/collaborateurs/${gestionnaireId}`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const resp = await res.json();
      if (!res.ok) { showToast(`❌ ${resp.error}`, 'error'); return; }
      setModalCreation(false);
      await charger();
      showToast('✅ Collaborateur créé avec succès', 'success');
    } catch { showToast('❌ Erreur lors de la création', 'error'); }
    finally { setCreating(false); }
  }

  // ── Changer statut ────────────────────────────────────────────────────────
  async function changerStatut(sv: Collaborateur, statut: string) {
    try {
      const res = await fetch(`${API_BASE}/studio/collaborateurs/${gestionnaireId}/${sv.id}/statut`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statut }),
      });
      if (!res.ok) throw new Error();
      setListe(prev => prev.map(v => v.id === sv.id ? { ...v, statut: statut as any } : v));
      showToast(`✅ Statut changé : ${statut}`, 'success');
    } catch { showToast('❌ Erreur lors du changement de statut', 'error'); }
  }

  // ── Supprimer ─────────────────────────────────────────────────────────────
  async function supprimer(sv: Collaborateur) {
    try {
      await fetch(`${API_BASE}/studio/collaborateurs/${gestionnaireId}/${sv.id}`, {
        method: 'DELETE', credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      setListe(prev => prev.filter(v => v.id !== sv.id));
      showToast('✅ Collaborateur supprimé', 'success');
    } catch { showToast('❌ Erreur lors de la suppression', 'error'); }
  }

  // ── Actions groupées ──────────────────────────────────────────────────────
  async function actionBulk(type: string) {
    try {
      if (type === 'supprimer_bulk') {
        await fetch(`${API_BASE}/studio/collaborateurs/${gestionnaireId}/bulk`, {
          method: 'DELETE', credentials: 'include',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ids: selectionnes }),
        });
        setListe(prev => prev.filter(v => !selectionnes.includes(v.id)));
      } else {
        const statut = type === 'desactiver_bulk' ? 'suspendu' : 'actif';
        await fetch(`${API_BASE}/studio/collaborateurs/${gestionnaireId}/bulk/statut`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ids: selectionnes, statut }),
        });
        setListe(prev => prev.map(v => selectionnes.includes(v.id) ? { ...v, statut: statut as any } : v));
      }
      setSelectionnes([]);
      showToast('✅ Action groupée effectuée', 'success');
    } catch { showToast('❌ Erreur lors de l\'action groupée', 'error'); }
  }

  // ── Reset MDP ─────────────────────────────────────────────────────────────
  async function resetMdp(sv: Collaborateur, mdp: string) {
    try {
      const res = await fetch(`${API_BASE}/studio/collaborateurs/${gestionnaireId}/${sv.id}/mot-de-passe`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nouveau_mot_de_passe: mdp }),
      });
      if (!res.ok) throw new Error();
      setModalResetMdp(null);
      showToast(`✅ Mot de passe de ${sv.nom || sv.email} modifié`, 'success');
    } catch { showToast('❌ Erreur lors du changement de mot de passe', 'error'); }
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  async function ouvrirNotes(sv: Collaborateur) {
    try {
      const res  = await fetch(`${API_BASE}/studio/collaborateurs/${gestionnaireId}/${sv.id}/notes`, { credentials: 'include', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setNotesCache(prev => ({ ...prev, [sv.id]: data }));
      setModalNotes(sv);
    } catch { setModalNotes(sv); }
  }

  async function ajouterNote(sv: Collaborateur, contenu: string) {
    try {
      const res  = await fetch(`${API_BASE}/studio/collaborateurs/${gestionnaireId}/${sv.id}/notes`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contenu }),
      });
      const note = await res.json();
      setNotesCache(prev => ({ ...prev, [sv.id]: [...(prev[sv.id] || []), note] }));
      setListe(prev => prev.map(v => v.id === sv.id ? { ...v, nb_notes: (v.nb_notes || 0) + 1 } : v));
      showToast('📋 Note enregistrée', 'success');
    } catch { showToast('❌ Erreur lors de l\'enregistrement', 'error'); }
  }

  async function supprimerNote(sv: Collaborateur, noteId: number) {
    try {
      await fetch(`${API_BASE}/studio/collaborateurs/${gestionnaireId}/${sv.id}/notes/${noteId}`, {
        method: 'DELETE', credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      setNotesCache(prev => ({ ...prev, [sv.id]: (prev[sv.id] || []).filter(n => n.id !== noteId) }));
      setListe(prev => prev.map(v => v.id === sv.id ? { ...v, nb_notes: Math.max(0, (v.nb_notes || 1) - 1) } : v));
      showToast('🗑️ Note supprimée', 'success');
    } catch { showToast('❌ Erreur lors de la suppression', 'error'); }
  }

  // ── Confirmation actions ──────────────────────────────────────────────────
  function confirmerAction() {
    const { type, sv } = modalConfirm;
    if (!type) return;
    setModalConfirm({ type: null, sv: null });
    if (type.includes('_bulk')) {
      actionBulk(type);
    } else if (sv) {
      if (type === 'supprimer') supprimer(sv);
      else if (type === 'desactiver') changerStatut(sv, 'suspendu');
      else if (type === 'reactiver') changerStatut(sv, 'actif');
    }
  }

  // ── Export CSV ────────────────────────────────────────────────────────────
  function exportCSV() {
    const headers = ['ID', 'Nom', 'Email', 'Boutique', 'Statut', 'Plan', 'Date inscription'];
    const rows    = filtres.map(v => [v.id, v.nom, v.email, v.nom_boutique, v.statut, v.plan, new Date(v.created_at).toLocaleDateString('fr-CA')]);
    const csv     = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a       = document.createElement('a');
    a.href        = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download    = 'collaborateurs.csv';
    a.click();
  }

  const tousSelectionnes = selectionnes.length === filtres.length && filtres.length > 0;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: T.textLight, fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '36px', marginBottom: '12px' }}>👥</div><p style={{ margin: 0 }}>Chargement des collaborateurs…</p></div>
    </div>
  );

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '28px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {modalCreation && <ModalCreation onCreer={creer} onFermer={() => setModalCreation(false)} creating={creating} />}
      {modalNotes && <ModalNotes sv={modalNotes} notes={notesCache[modalNotes.id] || []} onAjouter={c => ajouterNote(modalNotes, c)} onSupprimer={id => supprimerNote(modalNotes, id)} onFermer={() => setModalNotes(null)} />}
      {modalConfirm.type && <ModalConfirmation type={modalConfirm.type} vendeur={modalConfirm.sv} count={selectionnes.length} onConfirm={confirmerAction} onCancel={() => setModalConfirm({ type: null, sv: null })} />}
      {modalResetMdp && <ModalResetMdp sv={modalResetMdp} onConfirm={mdp => resetMdp(modalResetMdp, mdp)} onCancel={() => setModalResetMdp(null)} />}
      {modalStatut && <ModalStatut sv={modalStatut} onConfirm={s => { changerStatut(modalStatut, s); setModalStatut(null); }} onCancel={() => setModalStatut(null)} />}

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(201,169,110,0.3)' }}>👥</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: T.text }}>Mes collaborateurs</h1>
            <p style={{ margin: 0, fontSize: '13px', color: T.textLight }}>{liste.length} collaborateur{liste.length > 1 ? 's' : ''} sur votre marketplace</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={exportCSV} style={{ padding: '9px 18px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: T.textLight }}>📥 Exporter CSV</button>
          <button onClick={() => setModalCreation(true)} style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(201,169,110,0.3)' }}>➕ Ajouter</button>
        </div>
      </div>

      {/* ── Filtres ── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher par nom, email, boutique…" style={{ flex: 1, minWidth: '200px', padding: '9px 14px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
        <select value={filtre} onChange={e => setFiltre(e.target.value)} style={{ padding: '9px 14px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer', outline: 'none' }}>
          <option value="tous">Tous les statuts</option>
          <option value="actif">✅ Actif</option>
          <option value="pending">⏳ En attente</option>
          <option value="suspendu">🔒 Suspendu</option>
          <option value="rejected">❌ Refusé</option>
          <option value="banni">🚫 Banni</option>
          <option value="vacances">🌴 Vacances</option>
        </select>

        {/* Stats rapides */}
        {(['actif','pending','suspendu'] as const).map(s => {
          const n = liste.filter(v => v.statut === s).length;
          const st = statutStyle(s);
          return n > 0 ? (
            <span key={s} onClick={() => setFiltre(filtre === s ? 'tous' : s)} style={{ fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', background: st.bg, color: st.color, cursor: 'pointer', border: filtre === s ? `2px solid ${st.color}` : '2px solid transparent' }}>
              {st.label} ({n})
            </span>
          ) : null;
        })}
      </div>

      {/* ── Actions groupées ── */}
      {selectionnes.length > 0 && (
        <div style={{ background: '#1a2436', borderRadius: '12px', padding: '12px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{selectionnes.length} sélectionné{selectionnes.length > 1 ? 's' : ''}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { label: '✅ Réactiver', action: 'reactiver_bulk', bg: '#dcfce7', color: T.success },
              { label: '🔒 Suspendre', action: 'desactiver_bulk', bg: '#ffedd5', color: T.orange },
              { label: '🗑️ Supprimer', action: 'supprimer_bulk', bg: '#fee2e2', color: T.danger },
            ].map(a => (
              <button key={a.action} onClick={() => setModalConfirm({ type: a.action as ActionType, sv: null })} style={{ padding: '6px 14px', border: 'none', borderRadius: '8px', background: a.bg, color: a.color, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{a.label}</button>
            ))}
          </div>
          <button onClick={() => setSelectionnes([])} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px' }}>✕ Désélectionner</button>
        </div>
      )}

      {/* ── Tableau ── */}
      {filtres.length === 0 ? (
        <div style={{ background: T.card, border: `2px dashed ${T.border}`, borderRadius: '16px', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: T.text }}>{liste.length === 0 ? 'Aucun collaborateur' : 'Aucun résultat'}</h2>
          <p style={{ margin: '0 0 20px', fontSize: '14px', color: T.textLight }}>{liste.length === 0 ? 'Commencez par ajouter des vendeurs sur votre marketplace.' : 'Modifiez vos filtres de recherche.'}</p>
          {liste.length === 0 && <button onClick={() => setModalCreation(true)} style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>➕ Ajouter le premier</button>}
        </div>
      ) : (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: `2px solid ${T.border}` }}>
                <th style={{ padding: '12px 16px', textAlign: 'center', width: '40px' }}>
                  <input type="checkbox" checked={tousSelectionnes} onChange={() => setSelectionnes(tousSelectionnes ? [] : filtres.map(v => v.id))} style={{ cursor: 'pointer' }} />
                </th>
                {['Collaborateur', 'Statut', 'Plan', 'Notes', 'Inscrit', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtres.map((sv, idx) => {
                const st        = statutStyle(sv.statut);
                const estSelect = selectionnes.includes(sv.id);
                return (
                  <tr key={sv.id} style={{ borderBottom: idx < filtres.length - 1 ? `1px solid ${T.border}` : 'none', background: estSelect ? 'rgba(201,169,110,0.05)' : 'transparent', transition: 'background 0.15s' }}
                    onMouseEnter={e => { if (!estSelect) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = estSelect ? 'rgba(201,169,110,0.05)' : 'transparent'; }}>

                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <input type="checkbox" checked={estSelect} onChange={() => setSelectionnes(prev => estSelect ? prev.filter(id => id !== sv.id) : [...prev, sv.id])} style={{ cursor: 'pointer' }} />
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {sv.logo_url ? (
                          <img src={sv.logo_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${T.border}` }} />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #c9a96e, #a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                            {(sv.nom || sv.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: T.text }}>{sv.nom || '—'}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: T.textLight }}>{sv.email}</p>
                          {sv.nom_boutique && <p style={{ margin: 0, fontSize: '11px', color: T.textLight }}>🏪 {sv.nom_boutique}</p>}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: st.bg, color: st.color }}>{st.label}</span>
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: '13px', color: T.textLight }}>{sv.plan || 'gratuit'}</td>

                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => ouvrirNotes(sv)} style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', border: `1px solid ${T.border}`, background: sv.nb_notes > 0 ? 'rgba(201,169,110,0.1)' : '#fff', color: sv.nb_notes > 0 ? T.accent : T.textLight, cursor: 'pointer' }}>
                        📋 {sv.nb_notes || 0}
                      </button>
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: '12px', color: T.textLight }}>{dureeDepuis(sv.created_at)}</td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button onClick={() => setModalStatut(sv)} style={{ padding: '5px 10px', border: `1px solid ${T.border}`, borderRadius: '6px', background: '#fff', fontSize: '11px', cursor: 'pointer', color: T.textLight }}>🔄 Statut</button>
                        <button onClick={() => setModalResetMdp(sv)} style={{ padding: '5px 10px', border: `1px solid ${T.border}`, borderRadius: '6px', background: '#fff', fontSize: '11px', cursor: 'pointer', color: T.textLight }}>🔑</button>
                        <button onClick={() => setModalConfirm({ type: 'supprimer', sv })} style={{ padding: '5px 10px', border: `1px solid #fecaca`, borderRadius: '6px', background: '#fff5f5', fontSize: '11px', cursor: 'pointer', color: T.danger }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer tableau */}
          <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: T.textLight }}>{filtres.length} résultat{filtres.length > 1 ? 's' : ''}{recherche || filtre !== 'tous' ? ` (filtré${filtres.length > 1 ? 's' : ''})` : ''}</span>
            <span style={{ fontSize: '12px', color: T.textLight }}>Total : {liste.length} collaborateur{liste.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
}