import React, { useState, useMemo, useEffect, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface NoteInterne {
  id: number;
  date: string;
  auteur: string;
  contenu: string;
}

export interface Gestionnaire {
  id: number;
  nom: string;
  email: string;
  nom_boutique: string;
  plan: string;
  statut: 'actif' | 'suspendu' | 'banni' | 'en_maintenance';
  aboStatut: 'essai' | 'actif' | 'annule' | 'impaye' | 'expire' | 'a_supprimer' | null;
  essaiFin: string | null;
  periodeFin: string | null;
  forfaitNom: string | null;
  templateActif: string | null;
  dateInscription: string;
  telephone?: string;
  notes?: NoteInterne[];
  nbNotes?: number;
  twoFactorEnabled?: boolean;
}

interface ListeGestionnairesProps {
  onImpersonate: (gestionnaire: Gestionnaire, token: string) => void;
  onNaviguerVers?: (page: string, data?: any) => void;
}

type TriOption = 'id-desc' | 'nom-asc' | 'date-desc' | 'essai-asc';

// ── Thème cohérent avec l'administration ────────────────────────────────────────
const THEME = {
  sidebar:      '#1a2436',
  sidebarHover: '#243044',
  sidebarActive:'#2d6a9f',
  accent:       '#2d6a9f',
  accentLight:  '#e8f2fb',
  topbar:       '#ffffff',
  bg:           '#f0f2f5',
  card:         '#ffffff',
  border:       '#e1e4e8',
  text:         '#1a2332',
  textLight:    '#6b7280',
  danger:       '#dc2626',
  success:      '#16a34a',
  warning:      '#d97706',
  orange:       '#ea580c',
  purple:       '#7c3aed',
};

const API = ''; // e-Vend Studio : appels relatifs (même origine)

const printStyles = `
  @media print {
    @page { size: landscape; margin: 1.5cm; }
    body * { visibility: hidden; }
    .print-table, .print-table * { visibility: visible; }
    .print-table { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; }
    .no-print { display: none !important; }
    th { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; text-align: center !important; font-weight: bold; border-bottom: 2px solid #2d6a9f; }
    td { text-align: center !important; padding: 8px 4px !important; border-bottom: 1px solid #e1e4e8; }
    .statut-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; display: inline-block; padding: 4px 8px; border-radius: 20px; font-size: 10px; font-weight: bold; }
  }
`;

type ActionType = 'suspendre' | 'supprimer' | 'reactiver' | null;

interface ModaleConfirmationProps {
  isOpen: boolean;
  type: ActionType;
  gestionnaire: Gestionnaire | null;
  onConfirm: (raison?: string) => void;
  onCancel: () => void;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function joursRestants(iso: string | null): number | null {
  if (!iso) return null;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

// ── Modale de notes internes ────────────────────────────────────────────────────
function ModalNotes({
  gestionnaire,
  onAjouterNote,
  onSupprimerNote,
  onFermer,
}: {
  gestionnaire: Gestionnaire;
  onAjouterNote: (contenu: string) => void;
  onSupprimerNote: (noteId: number) => void;
  onFermer: () => void;
}) {
  const [nouvelleNote, setNouvelleNote] = useState('');
  const [noteASupprimer, setNoteASupprimer] = useState<number | null>(null);

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onFermer()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📋</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>{gestionnaire.nom}</p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>🏪 {gestionnaire.nom_boutique} · {gestionnaire.email}</p>
              </div>
            </div>
            <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>

          <div style={{ marginTop: '14px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>{gestionnaire.statut === 'actif' ? '✅' : gestionnaire.statut === 'suspendu' ? '🔒' : gestionnaire.statut === 'en_maintenance' ? '🚧' : '⛔'}</span>
            <div>
              <p style={{ fontSize: '11px', opacity: 0.6, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Statut compte</p>
              <p style={{ fontSize: '13px', fontWeight: '700', margin: 0 }}>{gestionnaire.statut === 'actif' ? 'Actif' : gestionnaire.statut === 'suspendu' ? 'Suspendu' : gestionnaire.statut === 'en_maintenance' ? 'En maintenance' : 'Banni'}</p>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>Abonnement</p>
              <p style={{ fontSize: '12px', fontWeight: '700', margin: 0 }}>{gestionnaire.forfaitNom || gestionnaire.aboStatut || '—'}</p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: 'Abonnement', val: gestionnaire.aboStatut || '—', icon: '💳' },
              { label: 'Template',   val: gestionnaire.templateActif || '—', icon: '🎨' },
              { label: 'Fin essai/période', val: formatDate(gestionnaire.essaiFin || gestionnaire.periodeFin), icon: '📅' },
            ].map((k, i) => (
              <div key={i} style={{ backgroundColor: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
                <p style={{ fontSize: '16px', margin: '0 0 2px 0' }}>{k.icon}</p>
                <p style={{ fontSize: '13px', fontWeight: '800', color: THEME.text, margin: '0 0 2px 0' }}>{k.val}</p>
                <p style={{ fontSize: '10px', color: THEME.textLight, margin: 0 }}>{k.label}</p>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>
              📋 Historique des notes ({gestionnaire.notes?.length || 0})
            </h4>

            {!gestionnaire.notes || gestionnaire.notes.length === 0 ? (
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '20px', textAlign: 'center', color: THEME.textLight, fontSize: '13px' }}>
                Aucune note pour ce gestionnaire.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...(gestionnaire.notes || [])].reverse().map(note => (
                  <div key={note.id} style={{ backgroundColor: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '12px 14px', position: 'relative' }}>
                    {noteASupprimer === note.id ? (
                      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', zIndex: 10, padding: '12px' }}>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: THEME.danger, margin: 0, textAlign: 'center' }}>🗑️ Supprimer cette note ?</p>
                        <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0, textAlign: 'center', maxWidth: '280px' }}>"{note.contenu.substring(0, 60)}{note.contenu.length > 60 ? '...' : ''}"</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setNoteASupprimer(null)}
                            style={{ padding: '6px 14px', border: `1px solid ${THEME.border}`, borderRadius: '6px', backgroundColor: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                            Annuler
                          </button>
                          <button onClick={() => { onSupprimerNote(note.id); setNoteASupprimer(null); }}
                            style={{ padding: '6px 14px', border: 'none', borderRadius: '6px', backgroundColor: THEME.danger, color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: THEME.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: 'white' }}>
                          {note.auteur.charAt(0)}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: THEME.text }}>{note.auteur}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: THEME.textLight }}>{note.date}</span>
                        <button
                          onClick={() => setNoteASupprimer(note.id)}
                          title="Supprimer cette note"
                          style={{ width: '20px', height: '20px', border: 'none', borderRadius: '50%', backgroundColor: '#fee2e2', color: THEME.danger, fontSize: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          ✕
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: THEME.text, margin: 0, lineHeight: '1.6' }}>{note.contenu}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#f0f7ff', border: `1px solid #bfdbfe`, borderRadius: '10px', padding: '14px 16px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>
              ✏️ Ajouter une note interne
            </h4>
            <textarea
              value={nouvelleNote}
              onChange={e => setNouvelleNote(e.target.value)}
              rows={3}
              placeholder="Note administrative (visible uniquement par l'équipe)"
              style={{ width: '100%', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px', fontFamily: 'inherit' }}
            />
            <button
              onClick={() => { if (nouvelleNote.trim()) { onAjouterNote(nouvelleNote.trim()); setNouvelleNote(''); } }}
              disabled={!nouvelleNote.trim()}
              style={{ backgroundColor: nouvelleNote.trim() ? THEME.accent : '#93c5fd', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '12px', fontWeight: '700', cursor: nouvelleNote.trim() ? 'pointer' : 'not-allowed' }}>
              💾 Enregistrer la note
            </button>
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onFermer}
            style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modale pour changer le mot de passe ─────────────────────────────────────────
function ModaleChangerMotDePasse({ isOpen, gestionnaire, onCancel, onConfirm }: {
  isOpen: boolean;
  gestionnaire: Gestionnaire | null;
  onCancel: () => void;
  onConfirm: (nouveauMotDePasse: string) => void;
}) {
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');

  if (!isOpen || !gestionnaire) return null;

  const valideMotDePasse = nouveauMotDePasse.length >= 8;
  const confirmationValide = nouveauMotDePasse === confirmation && nouveauMotDePasse.length > 0;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🔑</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>Changer le mot de passe</p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>{gestionnaire.nom} · {gestionnaire.email}</p>
              </div>
            </div>
            <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ backgroundColor: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>Gestionnaire</p>
                <p style={{ fontSize: '13px', fontWeight: '700', margin: '2px 0 0 0' }}>{gestionnaire.nom}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>Boutique</p>
                <p style={{ fontSize: '13px', fontWeight: '700', margin: '2px 0 0 0' }}>{gestionnaire.nom_boutique}</p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>
              Nouveau mot de passe <span style={{ color: THEME.danger }}>*</span>
            </label>
            <input
              type="password"
              value={nouveauMotDePasse}
              onChange={(e) => setNouveauMotDePasse(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: `2px solid ${nouveauMotDePasse && !valideMotDePasse ? THEME.danger : THEME.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none', marginBottom: '8px', boxSizing: 'border-box' }}
              placeholder="Entrez le nouveau mot de passe"
            />
            <p style={{ fontSize: '12px', color: nouveauMotDePasse && !valideMotDePasse ? THEME.danger : THEME.textLight, margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {nouveauMotDePasse && !valideMotDePasse ? '⚠️' : 'ℹ️'} Le mot de passe doit contenir au moins 8 caractères
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>
              Confirmer le nouveau mot de passe <span style={{ color: THEME.danger }}>*</span>
            </label>
            <input
              type="password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: `2px solid ${confirmation && !confirmationValide ? THEME.danger : THEME.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Confirmez le nouveau mot de passe"
            />
            {confirmation && !confirmationValide && (
              <p style={{ fontSize: '12px', color: THEME.danger, margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ⚠️ Les mots de passe ne correspondent pas
              </p>
            )}
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={() => confirmationValide && onConfirm(nouveauMotDePasse)}
            disabled={!confirmationValide}
            style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: confirmationValide ? 'pointer' : 'not-allowed', backgroundColor: confirmationValide ? THEME.accent : '#cccccc', color: 'white' }}>
            {confirmationValide ? '✅ Changer le mot de passe' : 'Changer le mot de passe'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modale pour envoyer un message ──────────────────────────────────────────────
function ModaleMessage({ isOpen, gestionnaire, onCancel, onConfirm }: {
  isOpen: boolean;
  gestionnaire: Gestionnaire | null;
  onCancel: () => void;
  onConfirm: (titre: string, message: string) => void;
}) {
  const [titre, setTitre] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('Information');

  if (!isOpen || !gestionnaire) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>💬</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>Envoyer un message</p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>À : {gestionnaire.nom} · {gestionnaire.email}</p>
              </div>
            </div>
            <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ backgroundColor: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>Destinataire</p>
            <p style={{ fontSize: '13px', fontWeight: '700', margin: '2px 0 0 0' }}>{gestionnaire.nom} — {gestionnaire.nom_boutique}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>Type de notification</label>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {['Information', 'Succès', 'Avertissement', 'Urgent'].map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="radio" name="type" value={t} checked={type === t} onChange={(e) => setType(e.target.value)} style={{ cursor: 'pointer' }} />
                  <span style={{ fontSize: '13px' }}>{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>
              Titre <span style={{ color: THEME.danger }}>*</span>
            </label>
            <input
              type="text" value={titre} onChange={(e) => setTitre(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Ex: Information importante concernant votre abonnement..."
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>
              Message <span style={{ color: THEME.danger }}>*</span>
            </label>
            <textarea
              value={message} onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: `2px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none', minHeight: '120px', resize: 'vertical' as const, fontFamily: 'inherit', boxSizing: 'border-box' }}
              placeholder="Rédigez votre message ici..."
            />
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={() => titre && message && onConfirm(titre, message)}
            disabled={!titre || !message}
            style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: titre && message ? 'pointer' : 'not-allowed', backgroundColor: titre && message ? THEME.accent : '#cccccc', color: 'white' }}>
            {titre && message ? '✅ Envoyer le message' : 'Envoyer le message'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modale de confirmation (suspendre / réactiver / supprimer) ──────────────────
function ModaleConfirmation({ isOpen, type, gestionnaire, onConfirm, onCancel }: ModaleConfirmationProps) {
  const [confirmation, setConfirmation] = useState('');
  const [raison, setRaison] = useState('');

  if (!isOpen || !type) return null;

  const isSupprimer = type === 'supprimer';
  const isSuspendre = type === 'suspendre';
  const isReactiver = type === 'reactiver';

  const MOT_CONFIRMATION = 'CONFIRMER';
  const confirmationValide = confirmation === MOT_CONFIRMATION;
  const raisonValide = raison.trim().length > 0;

  const getTitle = () => {
    if (isSupprimer) return 'SUPPRIMER CE GESTIONNAIRE';
    if (isSuspendre) return 'SUSPENDRE CE GESTIONNAIRE';
    if (isReactiver) return 'RÉACTIVER CE GESTIONNAIRE';
    return '';
  };
  const getWarningMessage = () => {
    if (isSupprimer) return 'Cette action est irréversible';
    if (isSuspendre) return 'Le gestionnaire sera temporairement désactivé';
    if (isReactiver) return 'Le gestionnaire sera de nouveau actif';
    return '';
  };
  const getIcon = () => (isSupprimer ? '🗑️' : isSuspendre ? '⚠️' : '✅');
  const getButtonColor = () => (isSupprimer ? THEME.danger : isSuspendre ? THEME.warning : THEME.success);

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{getIcon()}</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>{getTitle()}</p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>{getWarningMessage()}</p>
              </div>
            </div>
            <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ backgroundColor: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
            {gestionnaire && (
              <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: `1px solid ${THEME.border}` }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: THEME.accent, margin: 0 }}>{gestionnaire.nom}</p>
                <p style={{ fontSize: '12px', color: THEME.textLight, margin: '2px 0 0 0' }}>{gestionnaire.nom_boutique} · {gestionnaire.email}</p>
              </div>
            )}
            <p style={{ fontSize: '13px', color: THEME.text, margin: 0, lineHeight: '1.6' }}>
              {isSupprimer ? (
                <>
                  <strong>⚠️ Assurez-vous</strong> qu'aucun abonnement actif n'est en cours avant de supprimer ce gestionnaire.
                  <br /><br />
                  <strong>Cette action supprimera définitivement :</strong>
                  <br />• Son site et sa configuration
                  <br />• Son historique d'abonnement et de facturation
                  <br />• Toutes les données associées
                </>
              ) : isSuspendre ? (
                <>
                  <strong>⚠️ En suspendant ce gestionnaire :</strong>
                  <br />• Son site restera en ligne mais il ne pourra plus se connecter
                  <br />• Son abonnement continue de se facturer sauf annulation manuelle
                  <br />• Vous pourrez le réactiver ultérieurement
                </>
              ) : (
                <>
                  <strong>✅ En réactivant ce gestionnaire :</strong>
                  <br />• Il pourra se connecter normalement
                  <br />• Il retrouvera l'accès à son tableau de bord
                </>
              )}
            </p>
          </div>

          {isSupprimer && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>
                Raison de la suppression <span style={{ color: THEME.danger }}>*</span>
              </label>
              <p style={{ fontSize: '11px', color: THEME.textLight, margin: '0 0 8px' }}>
                Sera incluse dans le courriel envoyé au gestionnaire et conservée dans nos dossiers.
              </p>
              <textarea
                value={raison} onChange={(e) => setRaison(e.target.value)}
                placeholder="Ex : Fraude constatée sur les paiements, violation des conditions d'utilisation…"
                rows={3}
                style={{ width: '100%', padding: '12px 14px', border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
          )}

          {isSupprimer && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>
                Tapez <strong style={{ color: THEME.danger }}>{MOT_CONFIRMATION}</strong> pour confirmer :
              </label>
              <input
                type="text" value={confirmation} onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
                placeholder={MOT_CONFIRMATION}
                style={{ width: '100%', padding: '12px 14px', border: `2px solid ${confirmationValide ? THEME.success : THEME.border}`, borderRadius: '8px', fontSize: '14px', fontWeight: '600', outline: 'none', boxSizing: 'border-box', letterSpacing: '1px', fontFamily: 'monospace' }}
              />
              {confirmation && !confirmationValide && (
                <p style={{ fontSize: '12px', color: THEME.danger, margin: '8px 0 0 0' }}>⚠️ Le texte de confirmation ne correspond pas</p>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={() => onConfirm(isSupprimer ? raison.trim() : undefined)}
            disabled={isSupprimer && (!confirmationValide || !raisonValide)}
            style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: (isSupprimer && (!confirmationValide || !raisonValide)) ? 'not-allowed' : 'pointer', backgroundColor: (isSupprimer && (!confirmationValide || !raisonValide)) ? '#cccccc' : getButtonColor(), color: 'white' }}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modale changer statut ────────────────────────────────────────────────────────
function ModaleChangerStatut({ gestionnaire, onCancel, onConfirm }: {
  gestionnaire: Gestionnaire;
  onCancel: () => void;
  onConfirm: (nouveauStatut: string) => void;
}) {
  const [statutChoisi, setStatutChoisi] = useState('');

  const statuts = [
    { value: 'actif',        label: '✅ Actif',         desc: 'Accès complet au tableau de bord', bg: '#dcfce7', color: '#16a34a' },
    { value: 'suspendu',     label: '🔒 Suspendu',      desc: 'Accès bloqué, site non visible publiquement', bg: '#ffedd5', color: '#ea580c' },
    { value: 'en_maintenance', label: '🚧 En maintenance', desc: 'Dashboard accessible, site public en maintenance', bg: '#fef3c7', color: '#b45309' },
    { value: 'banni',        label: '🚫 Banni',         desc: 'Banni définitivement de la plateforme', bg: '#f3e8ff', color: '#7c3aed' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🔄</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>Changer le statut</p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>{gestionnaire.nom} · {gestionnaire.nom_boutique}</p>
              </div>
            </div>
            <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sélectionner le nouveau statut</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {statuts.map(s => {
              const isActuel = gestionnaire.statut === s.value;
              const isSelected = statutChoisi === s.value;
              return (
                <button key={s.value} onClick={() => !isActuel && setStatutChoisi(s.value)} disabled={isActuel}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                    borderRadius: '10px', cursor: isActuel ? 'not-allowed' : 'pointer',
                    border: `2px solid ${isSelected ? s.color : '#e5e7eb'}`,
                    backgroundColor: isSelected ? s.bg : isActuel ? '#f9fafb' : 'white',
                    opacity: isActuel ? 0.6 : 1, textAlign: 'left', width: '100%',
                  }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: s.color }}>{s.label}</span>
                      {isActuel && <span style={{ fontSize: '10px', backgroundColor: '#e5e7eb', color: '#6b7280', padding: '2px 6px', borderRadius: '10px', fontWeight: '700' }}>ACTUEL</span>}
                    </div>
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0 0' }}>{s.desc}</p>
                  </div>
                  {isSelected && <span style={{ color: s.color, fontWeight: '800', fontSize: '16px' }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #e1e4e8', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', border: '1px solid #e1e4e8', borderRadius: '8px', backgroundColor: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Annuler</button>
          <button
            onClick={() => statutChoisi && onConfirm(statutChoisi)}
            disabled={!statutChoisi}
            style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: statutChoisi ? 'pointer' : 'not-allowed', backgroundColor: statutChoisi ? '#2d6a9f' : '#cccccc', color: 'white' }}>
            {statutChoisi ? '✅ Confirmer le changement' : 'Confirmer le changement'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Menu de tri ──────────────────────────────────────────────────────────────────
function MenuTri({ triOption, onTriChange }: { triOption: TriOption; onTriChange: (option: TriOption) => void }) {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const options: { value: TriOption; label: string }[] = [
    { value: 'id-desc',   label: 'Plus récents' },
    { value: 'nom-asc',   label: 'Nom (A-Z)' },
    { value: 'date-desc', label: "Date d'inscription" },
    { value: 'essai-asc', label: "Fin d'essai (plus proche)" },
  ];

  const getLabel = () => options.find(o => o.value === triOption)?.label || 'Trier par';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOuvert(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button onClick={() => setMenuOuvert(!menuOuvert)} style={{ backgroundColor: 'white', color: THEME.accent, border: `2px solid ${THEME.accent}`, borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
        🔽 {getLabel()}
      </button>
      {menuOuvert && (
        <div style={{ position: 'absolute', left: 0, top: '45px', backgroundColor: 'white', border: `1px solid ${THEME.border}`, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', zIndex: 100, minWidth: '220px' }}>
          <div style={{ padding: '4px 0' }}>
            {options.map(option => (
              <button key={option.value} onClick={() => { onTriChange(option.value); setMenuOuvert(false); }}
                style={{ width: '100%', textAlign: 'left', padding: '8px 16px', border: 'none', background: triOption === option.value ? THEME.accentLight : 'none', cursor: 'pointer', fontSize: '12px', color: THEME.text, fontWeight: triOption === option.value ? '700' : '400' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = triOption === option.value ? THEME.accentLight : 'transparent'}>
                {option.label} {triOption === option.value && ' ✓'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────────
function ListeGestionnaires({ onImpersonate, onNaviguerVers }: ListeGestionnairesProps) {
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [triOption, setTriOption] = useState<TriOption>('id-desc');
  const [menuOuvert, setMenuOuvert] = useState<number | null>(null);
  const [gestionnaires, setGestionnaires] = useState<Gestionnaire[]>([]);
  const [chargement, setChargement] = useState(true);
  const [gestionnaireNotes, setGestionnaireNotes] = useState<Gestionnaire | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [modaleChangerStatut, setModaleChangerStatut] = useState<{ isOpen: boolean; gestionnaire: Gestionnaire | null }>({ isOpen: false, gestionnaire: null });
  const [modaleChangementMdp, setModaleChangementMdp] = useState<{ isOpen: boolean; gestionnaire: Gestionnaire | null }>({ isOpen: false, gestionnaire: null });
  const [modaleMessage, setModaleMessage] = useState<{ isOpen: boolean; gestionnaire: Gestionnaire | null }>({ isOpen: false, gestionnaire: null });
  const [modaleConfirmation, setModaleConfirmation] = useState<{ isOpen: boolean; type: ActionType; gestionnaire: Gestionnaire | null }>({ isOpen: false, type: null, gestionnaire: null });

  const menuTroisPointsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const token = () => localStorage.getItem('token');

  const charger = async () => {
    setChargement(true);
    try {
      const res = await fetch(`${API}/api/admin/gestionnaires`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const liste = Array.isArray(data) ? data : Array.isArray(data?.gestionnaires) ? data.gestionnaires : null;
      if (!liste) throw new Error('Format de réponse inattendu (tableau attendu).');
      setGestionnaires(liste.map((g: any) => ({
        id: g.id,
        nom: g.nom,
        email: g.email,
        nom_boutique: g.nom_boutique,
        plan: g.plan,
        statut: g.statut,
        aboStatut: g.abo_statut,
        essaiFin: g.essai_fin,
        periodeFin: g.periode_fin,
        forfaitNom: g.forfait_nom,
        templateActif: g.template_actif,
        dateInscription: g.created_at,
        telephone: g.telephone,
        nbNotes: parseInt(g.nb_notes) || 0,
        twoFactorEnabled: !!g.two_factor_enabled,
      })));
    } catch (e) {
      console.error('Erreur chargement gestionnaires:', e);
      showToast('❌ Erreur lors du chargement des gestionnaires', 'error');
    }
    setChargement(false);
  };

  useEffect(() => { charger(); }, []);

  const filtresEtTries = useMemo(() => {
    let result = gestionnaires.filter(g => {
      const matchRecherche = g.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        g.email.toLowerCase().includes(recherche.toLowerCase()) ||
        g.nom_boutique.toLowerCase().includes(recherche.toLowerCase());
      const matchStatut = filtreStatut === 'tous' ? true
        : filtreStatut === 'essai' ? g.aboStatut === 'essai'
        : filtreStatut === 'impaye' ? g.aboStatut === 'impaye'
        : filtreStatut === 'expire' ? (g.aboStatut === 'expire' || g.aboStatut === 'a_supprimer')
        : g.statut === filtreStatut;
      return matchRecherche && matchStatut;
    });

    result = [...result].sort((a, b) => {
      switch (triOption) {
        case 'id-desc':   return b.id - a.id;
        case 'nom-asc':   return a.nom.localeCompare(b.nom);
        case 'date-desc': return new Date(b.dateInscription).getTime() - new Date(a.dateInscription).getTime();
        case 'essai-asc': {
          const ae = a.essaiFin ? new Date(a.essaiFin).getTime() : Infinity;
          const be = b.essaiFin ? new Date(b.essaiFin).getTime() : Infinity;
          return ae - be;
        }
        default: return 0;
      }
    });

    return result;
  }, [recherche, filtreStatut, triOption, gestionnaires]);

  const getStatutStyle = (statut: string) => {
    switch (statut) {
      case 'actif':          return { bg: '#dcfce7', color: THEME.success, text: '✅ Actif' };
      case 'suspendu':       return { bg: '#ffedd5', color: THEME.orange,  text: '🔒 Suspendu' };
      case 'en_maintenance': return { bg: '#fef3c7', color: '#b45309',     text: '🚧 En maintenance' };
      case 'banni':          return { bg: '#f3e8ff', color: THEME.purple,  text: '🚫 Banni' };
      default:               return { bg: '#f3f4f6', color: THEME.textLight, text: statut };
    }
  };

  const getAboStyle = (g: Gestionnaire) => {
    switch (g.aboStatut) {
      case 'essai': {
        const jr = joursRestants(g.essaiFin);
        return { bg: '#fef9c3', color: THEME.warning, text: `⏳ Essai (${jr ?? '?'}j)` };
      }
      case 'actif':        return { bg: '#dcfce7', color: THEME.success, text: '✅ Abonné' };
      case 'annule':        return { bg: '#f3f4f6', color: THEME.textLight, text: '🔕 Annulé' };
      case 'impaye':       return { bg: '#fee2e2', color: THEME.danger, text: '❌ Impayé' };
      case 'expire':        return { bg: '#fee2e2', color: THEME.danger, text: '⛔ Essai expiré' };
      case 'a_supprimer':  return { bg: '#fee2e2', color: THEME.danger, text: '🗑️ À supprimer' };
      default:              return { bg: '#f3f4f6', color: THEME.textLight, text: '—' };
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleOuvrirNotes = async (gestionnaire: Gestionnaire) => {
    try {
      const res = await fetch(`${API}/api/admin/gestionnaires/${gestionnaire.id}/notes`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error('Erreur chargement notes');
      const data = await res.json();
      const notes: NoteInterne[] = data.map((n: any) => ({
        id: n.id,
        date: new Date(n.date_creation).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }),
        auteur: n.auteur || 'Admin',
        contenu: n.contenu,
      }));
      setGestionnaireNotes({ ...gestionnaire, notes });
      setGestionnaires(prev => prev.map(g => g.id === gestionnaire.id ? { ...g, notes, nbNotes: notes.length } : g));
    } catch {
      setGestionnaireNotes({ ...gestionnaire, notes: [] });
    }
  };

  const handleAjouterNote = async (gestionnaire: Gestionnaire, contenu: string) => {
    try {
      const res = await fetch(`${API}/api/admin/gestionnaires/${gestionnaire.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ contenu }),
      });
      if (!res.ok) throw new Error('Erreur ajout note');
      const saved = await res.json();
      const nouvelleNote: NoteInterne = {
        id: saved.id,
        date: new Date(saved.date_creation).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }),
        auteur: saved.auteur,
        contenu: saved.contenu,
      };
      setGestionnaires(prev => prev.map(g => g.id === gestionnaire.id ? { ...g, notes: [...(g.notes || []), nouvelleNote], nbNotes: (g.nbNotes || 0) + 1 } : g));
      setGestionnaireNotes(prev => prev ? { ...prev, notes: [...(prev.notes || []), nouvelleNote] } : prev);
      showToast('📋 Note enregistrée', 'success');
    } catch {
      showToast("❌ Erreur lors de l'enregistrement de la note", 'error');
    }
  };

  const handleSupprimerNote = async (gestionnaire: Gestionnaire, noteId: number) => {
    try {
      const res = await fetch(`${API}/api/admin/gestionnaires/notes/${noteId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error('Erreur suppression');
      setGestionnaires(prev => prev.map(g => g.id === gestionnaire.id ? { ...g, notes: (g.notes || []).filter(n => n.id !== noteId), nbNotes: Math.max(0, (g.nbNotes || 1) - 1) } : g));
      setGestionnaireNotes(prev => prev ? { ...prev, notes: (prev.notes || []).filter(n => n.id !== noteId) } : prev);
      showToast('🗑️ Note supprimée', 'success');
    } catch {
      showToast('❌ Erreur lors de la suppression de la note', 'error');
    }
  };

  const handleChangementMotDePasse = async (nouveauMotDePasse: string) => {
    const gestionnaire = modaleChangementMdp.gestionnaire;
    if (!gestionnaire) return;
    try {
      const res = await fetch(`${API}/api/admin/gestionnaires/${gestionnaire.id}/mot-de-passe`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ nouveau_mot_de_passe: nouveauMotDePasse }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur serveur');
      setModaleChangementMdp({ isOpen: false, gestionnaire: null });
      showToast(`✅ Mot de passe de ${gestionnaire.nom} modifié avec succès`, 'success');
    } catch (err: any) {
      setModaleChangementMdp({ isOpen: false, gestionnaire: null });
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  const handleEnvoyerMessage = (titre: string, message: string) => {
    console.log('Message envoyé à', modaleMessage.gestionnaire?.email, ':', titre, message);
    setModaleMessage({ isOpen: false, gestionnaire: null });
    showToast('✅ Message enregistré (envoi à implémenter)', 'success');
  };

  const handleToggleF2A = async (gestionnaire: Gestionnaire) => {
    const nouvelEtat = !gestionnaire.twoFactorEnabled;
    try {
      const res = await fetch(`${API}/api/admin/gestionnaires/${gestionnaire.id}/2fa`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ enabled: nouvelEtat }),
      });
      if (!res.ok) throw new Error('Erreur serveur');
      setGestionnaires(prev => prev.map(g => g.id === gestionnaire.id ? { ...g, twoFactorEnabled: nouvelEtat } : g));
      showToast(nouvelEtat ? `🔐 F2A activée pour ${gestionnaire.nom}` : `🔓 F2A désactivée pour ${gestionnaire.nom}`, 'success');
    } catch {
      showToast('❌ Erreur lors de la modification de la F2A', 'error');
    }
  };

  const handleChangerStatut = async (gestionnaire: Gestionnaire, nouveauStatut: string) => {
    try {
      const res = await fetch(`${API}/api/admin/gestionnaires/${gestionnaire.id}/statut`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ statut: nouveauStatut }),
      });
      if (!res.ok) throw new Error('Erreur serveur');
      setGestionnaires(prev => prev.map(g => g.id === gestionnaire.id ? { ...g, statut: nouveauStatut as any } : g));
      showToast(`✅ Statut changé → ${nouveauStatut}`, 'success');
    } catch {
      showToast('❌ Erreur lors du changement de statut', 'error');
    }
  };

  const handleConfirmation = async (raison?: string) => {
    const { type, gestionnaire } = modaleConfirmation;
    if (!type || !gestionnaire) { setModaleConfirmation({ isOpen: false, type: null, gestionnaire: null }); return; }

    if (type === 'supprimer') {
      try {
        const res = await fetch(`${API}/api/admin/gestionnaires/${gestionnaire.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
          body: JSON.stringify({ raison: raison || '' }),
        });
        if (!res.ok) throw new Error();
        setGestionnaires(prev => prev.filter(g => g.id !== gestionnaire.id));
        showToast('✅ Gestionnaire supprimé avec succès', 'success');
      } catch {
        showToast('❌ Erreur lors de la suppression', 'error');
      }
    } else {
      const nouveauStatut = type === 'suspendre' ? 'suspendu' : 'actif';
      await handleChangerStatut(gestionnaire, nouveauStatut);
    }
    setModaleConfirmation({ isOpen: false, type: null, gestionnaire: null });
  };

  const handleImpersonate = async (gestionnaire: Gestionnaire) => {
    try {
      const res = await fetch(`${API}/api/admin/gestionnaires/${gestionnaire.id}/impersonate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      onImpersonate(gestionnaire, data.token);
    } catch {
      showToast("❌ Erreur lors de l'accès au dashboard du gestionnaire", 'error');
    }
  };

  const handleAction = (action: string, gestionnaire: Gestionnaire) => {
    setMenuOuvert(null);
    switch (action) {
      case 'notes': handleOuvrirNotes(gestionnaire); break;
      case 'voir': onNaviguerVers?.('site-gestionnaire', { gestionnaireId: gestionnaire.id }); break;
      case 'message': setModaleMessage({ isOpen: true, gestionnaire }); break;
      case 'changer-mot-de-passe': setModaleChangementMdp({ isOpen: true, gestionnaire }); break;
      case 'suspendre': setModaleConfirmation({ isOpen: true, type: 'suspendre', gestionnaire }); break;
      case 'supprimer': setModaleConfirmation({ isOpen: true, type: 'supprimer', gestionnaire }); break;
      case 'toggle-f2a': handleToggleF2A(gestionnaire); break;
      default: break;
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Nom', 'Email', 'Boutique', 'Plan', 'Statut compte', 'Statut abonnement', 'Fin essai/période'];
    const csvData = filtresEtTries.map(g => [
      g.id, g.nom, g.email, g.nom_boutique, g.plan, g.statut, g.aboStatut || '', formatDate(g.essaiFin || g.periodeFin),
    ]);
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'gestionnaires.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImprimer = () => {
    const style = document.createElement('style');
    style.innerHTML = printStyles;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 100);
  };

  const setMenuRef = (id: number) => (element: HTMLDivElement | null) => {
    if (element) menuTroisPointsRef.current.set(id, element);
    else menuTroisPointsRef.current.delete(id);
  };

  const getMenuPosition = (id: number) => {
    const element = menuTroisPointsRef.current.get(id);
    if (!element) return { left: 0, top: 0 };
    const rect = element.getBoundingClientRect();
    const menuWidth = 200;
    const left = rect.left - menuWidth - 10;
    return { left: left < 10 ? 10 : left, top: rect.top + 35 };
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuOuvert !== null) {
        const menuElement = menuTroisPointsRef.current.get(menuOuvert);
        if (menuElement && !menuElement.contains(event.target as Node)) setMenuOuvert(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOuvert]);

  if (chargement) {
    return <div style={{ padding: 60, textAlign: 'center', color: THEME.textLight }}>⏳ Chargement des gestionnaires...</div>;
  }

  return (
    <>
      <div style={{ padding: '28px 32px', width: '100%', boxSizing: 'border-box' as const }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase' }}>
              Gestion des gestionnaires
            </h1>
            <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>{gestionnaires.length} gestionnaires inscrits</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ backgroundColor: THEME.accentLight, padding: '8px 16px', borderRadius: '20px', border: `1px solid ${THEME.accent}` }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: THEME.accent }}>📊 Total: {gestionnaires.length}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }} className="no-print">
              <button onClick={handleExportCSV} style={{ backgroundColor: 'white', color: THEME.accent, border: `2px solid ${THEME.accent}`, borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📊 Exporter CSV
              </button>
              <button onClick={handleImprimer} style={{ backgroundColor: 'white', color: THEME.accent, border: `2px solid ${THEME.accent}`, borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🖨️ Imprimer
              </button>
            </div>
          </div>
        </div>

        <div className="no-print" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' as const, alignItems: 'center', width: '100%' }}>
          <input
            type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="🔍 Rechercher un gestionnaire..." autoComplete="off" name="recherche-gestionnaire"
            style={{ border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '9px 14px', fontSize: '13px', outline: 'none', width: '260px' }}
          />

          {[
            { val: 'tous',      label: 'Tous' },
            { val: 'actif',     label: '✅ Comptes actifs' },
            { val: 'essai',     label: '⏳ En essai' },
            { val: 'impaye',    label: '❌ Impayés' },
            { val: 'expire',    label: '⛔ Essai expiré' },
            { val: 'suspendu',  label: '🔒 Suspendus' },
            { val: 'en_maintenance', label: '🚧 En maintenance' },
            { val: 'banni',     label: '🚫 Bannis' },
          ].map(({ val, label }) => (
            <button key={val} onClick={() => setFiltreStatut(val)}
              style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', border: `2px solid ${filtreStatut === val ? THEME.accent : THEME.border}`, backgroundColor: filtreStatut === val ? THEME.accentLight : 'white', color: filtreStatut === val ? THEME.accent : THEME.textLight }}>
              {label}
            </button>
          ))}

          <MenuTri triOption={triOption} onTriChange={setTriOption} />
        </div>

        <div className="print-table" style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'auto', maxHeight: 'calc(100vh - 250px)', width: '100%', boxSizing: 'border-box' as const }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 5 }}>
              <tr style={{ borderBottom: `2px solid ${THEME.accent}` }}>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>ID</th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>Gestionnaire</th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>E-mail</th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>Forfait</th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>Abonnement</th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>Fin essai/période</th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>Statut compte</th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }} className="no-print">F2A</th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }} className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtresEtTries.map((g, i) => {
                const statutStyle = getStatutStyle(g.statut);
                const aboStyle = getAboStyle(g);
                const menuPosition = getMenuPosition(g.id);
                const nbNotes = g.nbNotes || 0;

                return (
                  <tr key={g.id} style={{ borderBottom: '1px solid #f5f5f5', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '14px 8px', textAlign: 'center', fontFamily: 'monospace', fontSize: '12px', fontWeight: '600' }}>#{g.id}</td>
                    <td style={{ padding: '14px 8px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: THEME.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: THEME.accent, flexShrink: 0 }} className="no-print">
                          {g.nom.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: 0 }}>{g.nom}</p>
                          <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }} className="no-print">{g.nom_boutique}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}><span style={{ fontSize: '12px' }}>{g.email}</span></td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}><span style={{ fontSize: '12px', fontWeight: '600' }}>{g.forfaitNom || '—'}</span></td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <span className="statut-badge" style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '20px', backgroundColor: aboStyle.bg, color: aboStyle.color, whiteSpace: 'nowrap' as const }}>
                        {aboStyle.text}
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}><span style={{ fontSize: '12px' }}>{formatDate(g.essaiFin || g.periodeFin)}</span></td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <span className="statut-badge" style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '20px', backgroundColor: statutStyle.bg, color: statutStyle.color, whiteSpace: 'nowrap' as const }}>
                        {statutStyle.text}
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }} className="no-print">
                      {g.twoFactorEnabled ? (
                        <span title="F2A activée" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '15px', fontWeight: '900' }}>✓</span>
                      ) : (
                        <span title="F2A non activée" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#fff3e0', color: '#ea580c', fontSize: '15px', fontWeight: '900' }}>✕</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }} className="no-print">
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                        <button onClick={() => handleAction('notes', g)} style={{ backgroundColor: THEME.accentLight, color: THEME.accent, border: `1px solid #bfdbfe`, borderRadius: '6px', padding: '5px 8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', position: 'relative' as const, minWidth: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Notes internes">
                          📋
                          {nbNotes > 0 && (
                            <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: THEME.accent, color: 'white', fontSize: '9px', fontWeight: '800', padding: '1px 4px', borderRadius: '8px', minWidth: '14px', textAlign: 'center' }}>{nbNotes}</span>
                          )}
                        </button>

                        <button onClick={() => handleImpersonate(g)} style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '6px', padding: '5px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' as const, minWidth: '60px' }}>
                          👤 Accéder
                        </button>

                        <div ref={setMenuRef(g.id)} style={{ position: 'relative' }}>
                          <button onClick={(e) => { e.stopPropagation(); setMenuOuvert(menuOuvert === g.id ? null : g.id); }}
                            style={{ background: '#f0f0f0', border: `1px solid ${THEME.border}`, cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.text, fontSize: '16px', fontWeight: '800', lineHeight: 1, minWidth: '36px' }}>
                            ⋮
                          </button>

                          {menuOuvert === g.id && (
                            <div style={{ position: 'fixed', left: menuPosition.left, top: menuPosition.top, backgroundColor: 'white', border: `1px solid ${THEME.border}`, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', zIndex: 1000, width: '220px' }}>
                              <div style={{ padding: '4px 0' }}>
                                <MenuItem onClick={() => handleAction('voir', g)}>🌐 Voir le site</MenuItem>
                                <MenuItem onClick={() => handleAction('message', g)}>💬 Message</MenuItem>
                                <MenuItem onClick={() => handleAction('changer-mot-de-passe', g)}>🔑 Changer le mot de passe</MenuItem>
                                <MenuItem onClick={() => handleAction('toggle-f2a', g)} style={{ color: g.twoFactorEnabled ? THEME.warning : THEME.success }}>
                                  {g.twoFactorEnabled ? '🔓 Désactiver la F2A' : '🔐 Activer la F2A'}
                                </MenuItem>

                                <div style={{ height: '1px', backgroundColor: THEME.border, margin: '4px 0' }} />

                                <div style={{ padding: '4px 14px 6px' }}>
                                  <p style={{ fontSize: '10px', color: THEME.textLight, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Statut actuel</p>
                                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', backgroundColor: getStatutStyle(g.statut).bg, color: getStatutStyle(g.statut).color }}>
                                    {getStatutStyle(g.statut).text}
                                  </span>
                                </div>

                                <MenuItem onClick={() => { setMenuOuvert(null); setModaleChangerStatut({ isOpen: true, gestionnaire: g }); }} style={{ color: THEME.accent }}>
                                  🔄 Changer le statut
                                </MenuItem>

                                <div style={{ height: '1px', backgroundColor: THEME.border, margin: '4px 0' }} />

                                <MenuItem onClick={() => handleAction('supprimer', g)} style={{ color: THEME.danger }}>🗑️ Supprimer</MenuItem>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtresEtTries.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: THEME.textLight }}>Aucun gestionnaire trouvé</div>
          )}
        </div>
      </div>

      {gestionnaireNotes && (
        <ModalNotes
          gestionnaire={gestionnaireNotes}
          onAjouterNote={(contenu) => handleAjouterNote(gestionnaireNotes, contenu)}
          onSupprimerNote={(noteId) => handleSupprimerNote(gestionnaireNotes, noteId)}
          onFermer={() => setGestionnaireNotes(null)}
        />
      )}

      <ModaleMessage
        isOpen={modaleMessage.isOpen}
        gestionnaire={modaleMessage.gestionnaire}
        onCancel={() => setModaleMessage({ isOpen: false, gestionnaire: null })}
        onConfirm={handleEnvoyerMessage}
      />

      <ModaleChangerMotDePasse
        isOpen={modaleChangementMdp.isOpen}
        gestionnaire={modaleChangementMdp.gestionnaire}
        onCancel={() => setModaleChangementMdp({ isOpen: false, gestionnaire: null })}
        onConfirm={handleChangementMotDePasse}
      />

      <ModaleConfirmation
        isOpen={modaleConfirmation.isOpen}
        type={modaleConfirmation.type}
        gestionnaire={modaleConfirmation.gestionnaire}
        onConfirm={handleConfirmation}
        onCancel={() => setModaleConfirmation({ isOpen: false, type: null, gestionnaire: null })}
      />

      {modaleChangerStatut.isOpen && modaleChangerStatut.gestionnaire && (
        <ModaleChangerStatut
          gestionnaire={modaleChangerStatut.gestionnaire}
          onCancel={() => setModaleChangerStatut({ isOpen: false, gestionnaire: null })}
          onConfirm={(nouveauStatut) => {
            const cible = modaleChangerStatut.gestionnaire!;
            setModaleChangerStatut({ isOpen: false, gestionnaire: null });
            handleChangerStatut(cible, nouveauStatut);
          }}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999, backgroundColor: toast.type === 'success' ? '#16a34a' : '#dc2626', color: 'white', padding: '14px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {toast.message}
        </div>
      )}
    </>
  );
}

function MenuItem({ children, onClick, style = {} }: { children: React.ReactNode; onClick: () => void; style?: React.CSSProperties; }) {
  return (
    <button onClick={onClick} style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: THEME.text, transition: 'background-color 0.2s', whiteSpace: 'nowrap' as const, ...style }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
      {children}
    </button>
  );
}

export default ListeGestionnaires;