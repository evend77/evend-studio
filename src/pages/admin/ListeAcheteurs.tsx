/**
 * ListeAcheteurs.tsx — src/pages/admin/ListeAcheteurs.tsx
 * Page admin : gestion complète des acheteurs
 * Connectée BD via API — notes, statut, mot de passe, commandes détaillées
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';

const API = 'https://evend-multivendeur-api.onrender.com';

// ── Types ──────────────────────────────────────────────────────────────────
interface NoteInterne {
  id: number;
  date: string;
  auteur: string;
  contenu: string;
}

interface Acheteur {
  id: number;
  prenom?: string;      // ← AJOUTÉ
  nom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  province?: string;
  code_postal?: string;
  statut: 'actif' | 'suspendu' | 'banni';
  date_inscription: string;
  nb_commandes: number;
  total_achats: number;
  notes?: NoteInterne[];
  derniere_connexion?: string;
  twoFactorEnabled?: boolean;
}

interface ItemCommande {
  id: number;
  nom_produit: string;
  quantite: number;
  prix_unitaire: number;
  sous_total: number;
}

interface Commande {
  id: number;
  numero_commande: string;
  date_commande: string;
  statut: string;
  vendeur_id: number;
  vendeur_nom: string;
  vendeur_boutique: string;
  seller_id: string;
  mode_expedition: string;
  sous_total: number;
  tps: number;
  tvq: number;
  total: number;
  items: ItemCommande[];
  adresse_livraison?: string;
}

const THEME = {
  sidebar:       '#1a2436',
  accent:        '#2d6a9f',
  accentLight:   '#e8f2fb',
  bg:            '#f0f2f5',
  card:          '#ffffff',
  border:        '#e1e4e8',
  text:          '#1a2332',
  textLight:     '#6b7280',
  danger:        '#dc2626',
  success:       '#16a34a',
  warning:       '#d97706',
};

function dureeDepuis(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "aujourd'hui";
  if (diff === 1) return 'hier';
  if (diff < 7)   return `${diff} jours`;
  if (diff < 30)  return `${Math.floor(diff / 7)} sem.`;
  return `${Math.floor(diff / 30)} mois`;
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

function fmtMontant(n: number) {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' $';
}

function getStatutStyle(statut: string) {
  switch (statut) {
    case 'actif':     return { bg: '#dcfce7', color: '#16a34a', text: '✅ Actif' };
    case 'suspendu':  return { bg: '#fef9c3', color: '#b45309', text: '⏸ Suspendu' };
    case 'banni':     return { bg: '#fee2e2', color: '#dc2626', text: '🚫 Banni' };
    default:          return { bg: '#f3f4f6', color: '#6b7280', text: statut };
  }
}

// ── Composant MenuItem ─────────────────────────────────────────────────────
function MenuItem({ children, onClick, style = {}, disabled = false }: {
  children: React.ReactNode; onClick: () => void;
  style?: React.CSSProperties; disabled?: boolean;
}) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '12px', color: THEME.text,
        transition: 'background-color 0.2s', whiteSpace: 'nowrap' as const, ...style }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.backgroundColor = '#f3f4f6')}
      onMouseLeave={e => !disabled && (e.currentTarget.style.backgroundColor = 'transparent')}>
      {children}
    </button>
  );
}

// ── Modal Notes ────────────────────────────────────────────────────────────
function ModalNotes({ acheteur, onAjouterNote, onSupprimerNote, onFermer }: {
  acheteur: Acheteur;
  onAjouterNote: (contenu: string) => void;
  onSupprimerNote: (noteId: number) => void;
  onFermer: () => void;
}) {
  const [nouvelleNote, setNouvelleNote] = useState('');
  const [noteASupprimer, setNoteASupprimer] = useState<number | null>(null);
  const cfg = getStatutStyle(acheteur.statut);
  const nomComplet = acheteur.prenom ? `${acheteur.prenom} ${acheteur.nom}` : acheteur.nom;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onFermer()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📋</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>{nomComplet}</p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>🛒 {acheteur.email}</p>
              </div>
            </div>
            <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
          <div style={{ marginTop: '14px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>{acheteur.statut === 'actif' ? '✅' : acheteur.statut === 'suspendu' ? '⏸' : '🚫'}</span>
            <div>
              <p style={{ fontSize: '11px', opacity: 0.6, margin: 0, textTransform: 'uppercase' }}>Statut</p>
              <p style={{ fontSize: '13px', fontWeight: '700', margin: 0 }}>{cfg.text}</p>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>Commandes</p>
              <p style={{ fontSize: '12px', fontWeight: '700', margin: 0 }}>{acheteur.nb_commandes}</p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: 'Total achats', val: fmtMontant(acheteur.total_achats), icon: '💰' },
              { label: 'Commandes',    val: acheteur.nb_commandes,             icon: '🛒' },
              { label: 'Inscrit',      val: dureeDepuis(acheteur.date_inscription), icon: '📅' },
            ].map((k, i) => (
              <div key={i} style={{ backgroundColor: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
                <p style={{ fontSize: '16px', margin: '0 0 2px 0' }}>{k.icon}</p>
                <p style={{ fontSize: '14px', fontWeight: '800', color: THEME.text, margin: '0 0 2px 0' }}>{k.val}</p>
                <p style={{ fontSize: '10px', color: THEME.textLight, margin: 0 }}>{k.label}</p>
              </div>
            ))}
          </div>

          <h4 style={{ fontSize: '12px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>
            📋 Notes internes ({acheteur.notes?.length || 0})
          </h4>

          {(!acheteur.notes || acheteur.notes.length === 0) ? (
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '20px', textAlign: 'center', color: THEME.textLight, fontSize: '13px', marginBottom: '20px' }}>
              Aucune note pour cet acheteur.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {[...(acheteur.notes || [])].reverse().map(note => (
                <div key={note.id} style={{ backgroundColor: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '12px 14px', position: 'relative' }}>
                  {noteASupprimer === note.id && (
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', zIndex: 10, padding: '12px' }}>
                      <p style={{ fontSize: '12px', fontWeight: '700', color: THEME.danger, margin: 0 }}>🗑️ Supprimer cette note ?</p>
                      <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0, textAlign: 'center', maxWidth: '280px' }}>"{note.contenu.substring(0, 60)}{note.contenu.length > 60 ? '...' : ''}"</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setNoteASupprimer(null)} style={{ padding: '6px 14px', border: `1px solid ${THEME.border}`, borderRadius: '6px', backgroundColor: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Annuler</button>
                        <button onClick={() => { onSupprimerNote(note.id); setNoteASupprimer(null); }} style={{ padding: '6px 14px', border: 'none', borderRadius: '6px', backgroundColor: THEME.danger, color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Supprimer</button>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: THEME.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: 'white' }}>
                        {note.auteur.charAt(0)}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: THEME.text }}>{note.auteur}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: THEME.textLight }}>{note.date}</span>
                      <button onClick={() => setNoteASupprimer(note.id)} style={{ width: '20px', height: '20px', border: 'none', borderRadius: '50%', backgroundColor: '#fee2e2', color: THEME.danger, fontSize: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: THEME.text, margin: 0, lineHeight: '1.6' }}>{note.contenu}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 16px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>✏️ Ajouter une note</h4>
            <textarea value={nouvelleNote} onChange={e => setNouvelleNote(e.target.value)} rows={3}
              placeholder="Note administrative (visible uniquement par l'équipe)"
              style={{ width: '100%', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px', fontFamily: 'inherit' }} />
            <button onClick={() => { if (nouvelleNote.trim()) { onAjouterNote(nouvelleNote.trim()); setNouvelleNote(''); } }}
              disabled={!nouvelleNote.trim()}
              style={{ backgroundColor: nouvelleNote.trim() ? THEME.accent : '#93c5fd', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '12px', fontWeight: '700', cursor: nouvelleNote.trim() ? 'pointer' : 'not-allowed' }}>
              💾 Enregistrer la note
            </button>
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onFermer} style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Changer Mot de Passe ─────────────────────────────────────────────
function ModalChangerMdp({ acheteur, onFermer, onConfirm }: {
  acheteur: Acheteur; onFermer: () => void;
  onConfirm: (mdp: string) => void;
}) {
  const [mdp, setMdp] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const valide = mdp.length >= 8 && mdp === confirm;
  const nomComplet = acheteur.prenom ? `${acheteur.prenom} ${acheteur.nom}` : acheteur.nom;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onFermer()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🔑</div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>Changer le mot de passe</p>
              <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>{nomComplet} — {acheteur.email}</p>
            </div>
          </div>
          <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>Nouveau mot de passe <span style={{ color: THEME.danger }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input type={visible ? 'text' : 'password'} value={mdp} onChange={e => setMdp(e.target.value)}
                style={{ width: '100%', padding: '11px 40px 11px 14px', border: `2px solid ${mdp.length > 0 && mdp.length < 8 ? THEME.danger : THEME.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              <button onClick={() => setVisible(v => !v)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                {visible ? '🙈' : '👁'}
              </button>
            </div>
            {mdp.length > 0 && mdp.length < 8 && <p style={{ fontSize: '11px', color: THEME.danger, margin: '6px 0 0' }}>⚠️ Minimum 8 caractères</p>}
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>Confirmer <span style={{ color: THEME.danger }}>*</span></label>
            <input type={visible ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', border: `2px solid ${confirm.length > 0 ? (valide ? THEME.success : THEME.danger) : THEME.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            {confirm.length > 0 && !valide && mdp.length >= 8 && <p style={{ fontSize: '11px', color: THEME.danger, margin: '6px 0 0' }}>⚠️ Les mots de passe ne correspondent pas</p>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button onClick={onFermer} style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Annuler</button>
            <button onClick={() => valide && onConfirm(mdp)} disabled={!valide}
              style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: valide ? 'pointer' : 'not-allowed', backgroundColor: valide ? THEME.accent : '#cccccc', color: 'white' }}>
              {valide ? '✅ Changer' : 'Changer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal Changer Statut ───────────────────────────────────────────────────
function ModalChangerStatut({ acheteur, onFermer, onConfirm }: {
  acheteur: Acheteur; onFermer: () => void;
  onConfirm: (statut: string, raison: string) => void;
}) {
  const [statut, setStatut] = useState(acheteur.statut);
  const [raison, setRaison] = useState('');
  const [etapeConfirm, setEtapeConfirm] = useState(false);
  const nomComplet = acheteur.prenom ? `${acheteur.prenom} ${acheteur.nom}` : acheteur.nom;

  const options = [
    { val: 'actif',    icon: '✅', label: 'Actif',    desc: "L'acheteur peut passer des commandes normalement.",     bg: '#dcfce7', color: '#16a34a' },
    { val: 'suspendu', icon: '⏸', label: 'Suspendu', desc: "L'acheteur est temporairement bloqué.",                 bg: '#fef9c3', color: '#b45309' },
    { val: 'banni',    icon: '🚫', label: 'Banni',    desc: "L'acheteur est définitivement banni de la plateforme.", bg: '#fee2e2', color: '#dc2626' },
  ];

  const selectionne = options.find(o => o.val === statut)!;
  const danger = statut === 'banni';

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onFermer()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '520px', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🔄</div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>Changer le statut</p>
              <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>{nomComplet} — statut actuel : {getStatutStyle(acheteur.statut).text}</p>
            </div>
          </div>
          <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>

        <div style={{ padding: '24px' }}>
          {!etapeConfirm ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {options.map(opt => (
                  <div key={opt.val} onClick={() => setStatut(opt.val as any)}
                    style={{ padding: '14px 16px', borderRadius: '10px', border: `2px solid ${statut === opt.val ? opt.color : THEME.border}`, backgroundColor: statut === opt.val ? opt.bg : 'white', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: statut === opt.val ? opt.color : THEME.text, margin: 0 }}>{opt.label}</p>
                      <p style={{ fontSize: '11px', color: THEME.textLight, margin: '2px 0 0 0' }}>{opt.desc}</p>
                    </div>
                    {statut === opt.val && <span style={{ color: opt.color, fontSize: '18px', fontWeight: '900' }}>✓</span>}
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>
                  Raison / notes {(statut === 'suspendu' || statut === 'banni') && <span style={{ color: THEME.danger }}>*</span>}
                </label>
                <textarea value={raison} onChange={e => setRaison(e.target.value)} rows={3}
                  placeholder={statut === 'banni' ? 'Motif de bannissement (obligatoire)...' : statut === 'suspendu' ? 'Raison de la suspension...' : 'Raison de la réactivation (optionnel)...'}
                  style={{ width: '100%', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={onFermer} style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Annuler</button>
                <button
                  onClick={() => {
                    if ((statut === 'suspendu' || statut === 'banni') && !raison.trim()) return;
                    if (danger) { setEtapeConfirm(true); return; }
                    onConfirm(statut, raison);
                  }}
                  disabled={(statut === 'suspendu' || statut === 'banni') && !raison.trim()}
                  style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', backgroundColor: danger ? THEME.danger : THEME.accent, color: 'white', opacity: (statut === 'suspendu' || statut === 'banni') && !raison.trim() ? 0.5 : 1 }}>
                  {danger ? '⚠️ Continuer vers bannissement' : '✅ Appliquer'}
                </button>
              </div>
            </>
          ) : (
            // Étape confirmation bannissement
            <div>
              <div style={{ backgroundColor: '#fff1f2', border: '2px solid #fecaca', borderRadius: '12px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '32px', margin: '0 0 8px' }}>🚫</p>
                <p style={{ fontSize: '16px', fontWeight: '900', color: THEME.danger, margin: '0 0 8px' }}>BANNIR CET ACHETEUR ?</p>
                <p style={{ fontSize: '13px', color: THEME.text, margin: '0 0 12px', lineHeight: '1.6' }}>
                  Vous allez bannir <strong>{nomComplet}</strong>.<br />
                  Cette action bloquera définitivement son accès à la plateforme.
                </p>
                <div style={{ backgroundColor: 'white', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '10px 14px', textAlign: 'left' }}>
                  <p style={{ fontSize: '11px', color: THEME.textLight, margin: '0 0 4px', textTransform: 'uppercase' }}>Motif enregistré</p>
                  <p style={{ fontSize: '13px', color: THEME.text, margin: 0 }}>{raison}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setEtapeConfirm(false)} style={{ flex: 1, padding: '12px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  Retour
                </button>
                <button onClick={() => onConfirm(statut, raison)}
                  style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', backgroundColor: THEME.danger, color: 'white', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                  🚫 Confirmer le bannissement
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal Commandes ────────────────────────────────────────────────────────
function ModalCommandes({ acheteur, onFermer }: { acheteur: Acheteur; onFermer: () => void }) {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Commande | null>(null);
  const token = localStorage.getItem('token');
  const nomComplet = acheteur.prenom ? `${acheteur.prenom} ${acheteur.nom}` : acheteur.nom;

  useEffect(() => {
    fetch(`${API}/api/admin/acheteurs/${acheteur.id}/commandes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCommandes(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [acheteur.id, token]);

  const statutCommande: Record<string, { bg: string; color: string }> = {
    'pending':    { bg: '#fef9c3', color: '#b45309' },
    'confirmed':  { bg: '#dbeafe', color: '#1d4ed8' },
    'shipped':    { bg: '#ede9fe', color: '#7c3aed' },
    'delivered':  { bg: '#dcfce7', color: '#16a34a' },
    'cancelled':  { bg: '#fee2e2', color: '#dc2626' },
    'refunded':   { bg: '#f3f4f6', color: '#6b7280' },
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onFermer()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '820px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🛒</div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>Achats de {nomComplet}</p>
              <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>{acheteur.email} — {commandes.length} commande{commandes.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: THEME.textLight }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid #e1e4e8', borderTop: `3px solid ${THEME.accent}`, animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              Chargement des commandes...
            </div>
          ) : commandes.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: THEME.textLight }}>
              <p style={{ fontSize: '36px', marginBottom: '8px' }}>🛒</p>
              <p style={{ fontSize: '14px', fontWeight: '600' }}>Aucune commande trouvée</p>
            </div>
          ) : selected ? (
            // Détail d'une commande
            <div>
              <button onClick={() => setSelected(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: THEME.accent, fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginBottom: '20px', padding: 0 }}>
                ← Retour à la liste
              </button>

              {/* En-tête commande */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'No. commande', val: selected.numero_commande, icon: '📋' },
                  { label: 'Date',         val: fmtDate(selected.date_commande), icon: '📅' },
                  { label: 'Vendeur',      val: `${selected.vendeur_boutique} (${selected.seller_id})`, icon: '🏪' },
                  { label: 'Expédition',   val: selected.mode_expedition, icon: '🚚' },
                ].map((k, i) => (
                  <div key={i} style={{ backgroundColor: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '12px 14px' }}>
                    <p style={{ fontSize: '10px', color: THEME.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>{k.icon} {k.label}</p>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: 0 }}>{k.val}</p>
                  </div>
                ))}
              </div>

              {/* Statut */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', color: THEME.textLight }}>Statut :</span>
                <span style={{ ...(statutCommande[selected.statut] || { bg: '#f3f4f6', color: '#6b7280' }), padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', backgroundColor: (statutCommande[selected.statut] || { bg: '#f3f4f6' }).bg, color: (statutCommande[selected.statut] || { color: '#6b7280' }).color }}>
                  {selected.statut}
                </span>
              </div>

              {/* Articles */}
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Articles commandés</h4>
              <div style={{ border: `1px solid ${THEME.border}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      {['Produit', 'Qté', 'Prix unitaire', 'Sous-total'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase', textAlign: h === 'Produit' ? 'left' : 'right', borderBottom: `1px solid ${THEME.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map((item, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                        <td style={{ padding: '11px 14px', fontSize: '13px', color: THEME.text, fontWeight: '600' }}>{item.nom_produit}</td>
                        <td style={{ padding: '11px 14px', fontSize: '13px', color: THEME.textLight, textAlign: 'right' }}>{item.quantite}</td>
                        <td style={{ padding: '11px 14px', fontSize: '13px', color: THEME.textLight, textAlign: 'right' }}>{fmtMontant(item.prix_unitaire)}</td>
                        <td style={{ padding: '11px 14px', fontSize: '13px', color: THEME.text, fontWeight: '700', textAlign: 'right' }}>{fmtMontant(item.sous_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Taxes & total */}
              <div style={{ backgroundColor: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '16px 20px' }}>
                {[
                  { label: 'Sous-total',  val: selected.sous_total },
                  { label: 'TPS (5%)',    val: selected.tps },
                  { label: 'TVQ (9.975%)', val: selected.tvq },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: THEME.textLight }}>{r.label}</span>
                    <span style={{ fontSize: '13px', color: THEME.text, fontWeight: '600' }}>{fmtMontant(r.val)}</span>
                  </div>
                ))}
                <div style={{ borderTop: `2px solid ${THEME.border}`, marginTop: '8px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: THEME.text }}>TOTAL</span>
                  <span style={{ fontSize: '17px', fontWeight: '900', color: THEME.accent }}>{fmtMontant(selected.total)}</span>
                </div>
              </div>

              {selected.adresse_livraison && (
                <div style={{ marginTop: '16px', backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase', margin: '0 0 6px' }}>📍 Adresse de livraison</p>
                  <p style={{ fontSize: '13px', color: THEME.text, margin: 0 }}>{selected.adresse_livraison}</p>
                </div>
              )}
            </div>
          ) : (
            // Liste des commandes
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Résumé total */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '8px' }}>
                {[
                  { label: 'Total commandes', val: commandes.length, icon: '🛒' },
                  { label: 'Total dépensé',   val: fmtMontant(commandes.reduce((s, c) => s + c.total, 0)), icon: '💰' },
                  { label: 'Vendeurs distincts', val: new Set(commandes.map(c => c.vendeur_id)).size, icon: '🏪' },
                ].map((k, i) => (
                  <div key={i} style={{ backgroundColor: THEME.accentLight, border: `1px solid #bfdbfe`, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: '18px', margin: '0 0 2px' }}>{k.icon}</p>
                    <p style={{ fontSize: '18px', fontWeight: '900', color: THEME.accent, margin: '0 0 2px' }}>{k.val}</p>
                    <p style={{ fontSize: '10px', color: THEME.textLight, margin: 0 }}>{k.label}</p>
                  </div>
                ))}
              </div>

              {commandes.map(cmd => {
                const sc = statutCommande[cmd.statut] || { bg: '#f3f4f6', color: '#6b7280' };
                return (
                  <div key={cmd.id} onClick={() => setSelected(cmd)}
                    style={{ backgroundColor: 'white', border: `1px solid ${THEME.border}`, borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = THEME.accent}
                    onMouseLeave={e => e.currentTarget.style.borderColor = THEME.border}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '800', color: THEME.text, margin: 0 }}>#{cmd.numero_commande}</p>
                        <p style={{ fontSize: '11px', color: THEME.textLight, margin: '2px 0 0' }}>🏪 {cmd.vendeur_boutique} · {cmd.seller_id}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '16px', fontWeight: '900', color: THEME.accent, margin: 0 }}>{fmtMontant(cmd.total)}</p>
                        <p style={{ fontSize: '10px', color: THEME.textLight, margin: '2px 0 0' }}>{fmtDate(cmd.date_commande)}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ backgroundColor: sc.bg, color: sc.color, padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>{cmd.statut}</span>
                      <span style={{ fontSize: '11px', color: THEME.textLight }}>🚚 {cmd.mode_expedition}</span>
                      <span style={{ fontSize: '11px', color: THEME.textLight }}>📦 {cmd.items?.length || 0} article{(cmd.items?.length || 0) > 1 ? 's' : ''}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: THEME.accent, fontWeight: '700' }}>Voir détails →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onFermer} style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
interface ListeAcheteursProps {
  onNaviguerVers?: (page: string, data?: any) => void;
  onImpersonate?: (acheteur: Acheteur) => void;
}

export default function ListeAcheteurs({ onNaviguerVers, onImpersonate }: ListeAcheteursProps) {
  const [acheteurs,    setAcheteurs]    = useState<Acheteur[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [recherche,    setRecherche]    = useState('');
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');
  const [syncing,      setSyncing]      = useState(false);
  const [syncMsg,      setSyncMsg]      = useState<{type: 'success'|'error', text: string} | null>(null);
  const [toast,        setToast]        = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [menuOuvert,   setMenuOuvert]   = useState<number | null>(null);
  const [menuPos,      setMenuPos]      = useState({ top: 0, left: 0 });
  const [modalNotes,   setModalNotes]   = useState<Acheteur | null>(null);
  const [modalMdp,     setModalMdp]     = useState<Acheteur | null>(null);
  const [modalStatut,  setModalStatut]  = useState<Acheteur | null>(null);
  const [modalCmds,    setModalCmds]    = useState<Acheteur | null>(null);
  const token = localStorage.getItem('token');

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Charger acheteurs ────────────────────────────────────────────────
  const charger = async () => {
    try {
      const r = await fetch(`${API}/api/admin/acheteurs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      console.log('📥 Données reçues:', data); // POUR DEBUG
      if (Array.isArray(data)) setAcheteurs(data.map((a: any) => ({
        ...a,
        twoFactorEnabled: a.two_factor_enabled ?? false,
      })));
    } catch { showToast('Erreur chargement acheteurs', 'error'); }
    setLoading(false);
  };

  useEffect(() => { charger(); }, []);

  // ── Synchronisation Shopify ──────────────────────────────────────────
  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const r = await fetch(`${API}/api/admin/sync-acheteurs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (data.success) {
        const s = data.stats;
        setSyncMsg({
          type: 'success',
          text: `✅ Sync terminée — ${s.acheteurs_crees} créés, ${s.acheteurs_maj} mis à jour, ${s.commandes_creees} commandes importées`
        });
        charger(); // Recharger la liste
      } else {
        setSyncMsg({ type: 'error', text: `❌ Erreur: ${data.error}` });
      }
    } catch (err: any) {
      setSyncMsg({ type: 'error', text: `❌ Erreur réseau: ${err.message}` });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 8000);
    }
  };

  // ── Fermer menu au clic extérieur ────────────────────────────────────
  useEffect(() => {
    const fn = () => setMenuOuvert(null);
    document.addEventListener('click', fn);
    return () => document.removeEventListener('click', fn);
  }, []);

  // ── Notes ────────────────────────────────────────────────────────────
  const ajouterNote = async (acheteur: Acheteur, contenu: string) => {
    try {
      const r = await fetch(`${API}/api/admin/acheteurs/${acheteur.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contenu }),
      });
      const data = await r.json();
      setAcheteurs(prev => prev.map(a => a.id === acheteur.id ? { ...a, notes: [...(a.notes || []), data] } : a));
      setModalNotes(prev => prev?.id === acheteur.id ? { ...prev, notes: [...(prev.notes || []), data] } : prev);
      showToast('Note enregistrée', 'success');
    } catch { showToast('Erreur lors de l\'enregistrement', 'error'); }
  };

  const supprimerNote = async (acheteur: Acheteur, noteId: number) => {
    try {
      await fetch(`${API}/api/admin/acheteurs/${acheteur.id}/notes/${noteId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      setAcheteurs(prev => prev.map(a => a.id === acheteur.id ? { ...a, notes: (a.notes || []).filter(n => n.id !== noteId) } : a));
      setModalNotes(prev => prev?.id === acheteur.id ? { ...prev, notes: (prev.notes || []).filter(n => n.id !== noteId) } : prev);
      showToast('Note supprimée', 'success');
    } catch { showToast('Erreur suppression', 'error'); }
  };

  // ── Changer mot de passe ─────────────────────────────────────────────
  const changerMdp = async (acheteur: Acheteur, mdp: string) => {
    try {
      const r = await fetch(`${API}/api/admin/acheteurs/${acheteur.id}/mot-de-passe`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mot_de_passe: mdp }),
      });
      if (r.ok) { setModalMdp(null); showToast('Mot de passe modifié', 'success'); }
      else showToast('Erreur lors du changement', 'error');
    } catch { showToast('Erreur serveur', 'error'); }
  };

  // ── Changer statut ───────────────────────────────────────────────────
  const changerStatut = async (acheteur: Acheteur, statut: string, raison: string) => {
    try {
      const r = await fetch(`${API}/api/admin/acheteurs/${acheteur.id}/statut`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statut, raison }),
      });
      if (r.ok) {
        setAcheteurs(prev => prev.map(a => a.id === acheteur.id ? { ...a, statut: statut as any } : a));
        setModalStatut(null);
        showToast(`Statut changé : ${statut}`, 'success');
      } else showToast('Erreur changement statut', 'error');
    } catch { showToast('Erreur serveur', 'error'); }
  };

  // ── Toggle F2A acheteur ─────────────────────────────────────────────
  const handleToggleF2A = async (acheteur: Acheteur) => {
    const nouvelEtat = !acheteur.twoFactorEnabled;
    try {
      const r = await fetch(`${API}/api/admin/acheteurs/${acheteur.id}/2fa`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: nouvelEtat }),
      });
      if (!r.ok) throw new Error();
      setAcheteurs(prev => prev.map(a => a.id === acheteur.id ? { ...a, twoFactorEnabled: nouvelEtat } : a));
      showToast(nouvelEtat ? `🔐 F2A activée pour ${acheteur.prenom || acheteur.nom}` : `🔓 F2A désactivée pour ${acheteur.prenom || acheteur.nom}`, 'success');
    } catch { showToast('❌ Erreur lors de la modification de la F2A', 'error'); }
  };

  // ── Filtre + recherche ───────────────────────────────────────────────
  const liste = useMemo(() => {
    return acheteurs.filter(a => {
      const ok = filtreStatut === 'tous' || a.statut === filtreStatut;
      const s  = recherche.toLowerCase();
      const nomComplet = a.prenom ? `${a.prenom} ${a.nom}`.toLowerCase() : a.nom.toLowerCase();
      const match = !s || nomComplet.includes(s) || a.email.toLowerCase().includes(s) || String(a.id).includes(s);
      return ok && match;
    });
  }, [acheteurs, filtreStatut, recherche]);

  const nbParStatut = {
    tous:     acheteurs.length,
    actif:    acheteurs.filter(a => a.statut === 'actif').length,
    suspendu: acheteurs.filter(a => a.statut === 'suspendu').length,
    banni:    acheteurs.filter(a => a.statut === 'banni').length,
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: THEME.textLight }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: `3px solid ${THEME.accentLight}`, borderTop: `3px solid ${THEME.accent}`, animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        Chargement des acheteurs...
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
        @keyframes spin { to { transform:rotate(360deg) } }
        .row-hover:hover { background-color: #f8fafc !important; }
      `}</style>

      <div style={{ backgroundColor: THEME.bg, minHeight: '100%' }}>

        {/* Header */}
        <div style={{ backgroundColor: THEME.card, borderBottom: `1px solid ${THEME.border}`, padding: '20px 28px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '900', color: THEME.text, margin: 0 }}>🛒 Liste des acheteurs</h1>
              <p style={{ fontSize: '13px', color: THEME.textLight, margin: '4px 0 0' }}>{acheteurs.length} acheteur{acheteurs.length > 1 ? 's' : ''} enregistré{acheteurs.length > 1 ? 's' : ''}</p>
            </div>
            <button onClick={charger} style={{ backgroundColor: THEME.accentLight, color: THEME.accent, border: `1px solid ${THEME.accent}`, borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              🔄 Rafraîchir
            </button>
          </div>
        </div>

        <div style={{ padding: '0 28px 28px' }}>

          {/* Filtres statut + bouton Sync */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { val: 'tous',     label: 'Tous',      n: nbParStatut.tous,     bg: THEME.accent },
              { val: 'actif',    label: '✅ Actifs',  n: nbParStatut.actif,    bg: THEME.success },
              { val: 'suspendu', label: '⏸ Suspendus', n: nbParStatut.suspendu, bg: THEME.warning },
              { val: 'banni',    label: '🚫 Bannis',  n: nbParStatut.banni,    bg: THEME.danger },
            ].map(f => (
              <button key={f.val} onClick={() => setFiltreStatut(f.val)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: `2px solid ${filtreStatut === f.val ? f.bg : THEME.border}`, backgroundColor: filtreStatut === f.val ? f.bg : 'white', color: filtreStatut === f.val ? 'white' : THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}>
                {f.label} <span style={{ opacity: 0.75, marginLeft: '4px', fontSize: '11px' }}>({f.n})</span>
              </button>
            ))}

            {/* Bouton Sync Shopify */}
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{
                marginLeft: 'auto',
                padding: '8px 18px',
                borderRadius: '8px',
                border: '2px solid #7c3aed',
                backgroundColor: syncing ? '#ede9fe' : '#7c3aed',
                color: syncing ? '#7c3aed' : 'white',
                fontSize: '13px',
                fontWeight: '700',
                cursor: syncing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {syncing ? '⏳ Synchronisation...' : '🔄 SYNC ACHETEURS'}
            </button>
          </div>

          {/* Message sync */}
          {syncMsg && (
            <div style={{
              padding: '10px 16px',
              borderRadius: '8px',
              marginBottom: '12px',
              backgroundColor: syncMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: syncMsg.type === 'success' ? '#15803d' : '#dc2626',
              fontSize: '13px',
              fontWeight: '600',
              border: `1px solid ${syncMsg.type === 'success' ? '#86efac' : '#fca5a5'}`,
            }}>
              {syncMsg.text}
            </div>
          )}

          {/* Barre de recherche */}
          <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>🔍</span>
            <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher par nom, email ou ID..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', backgroundColor: 'transparent', color: THEME.text }} />
            {recherche && (
              <button onClick={() => setRecherche('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: THEME.textLight, fontSize: '16px' }}>✕</button>
            )}
          </div>

          {/* Table */}
          <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.border}` }}>
                    {['ID', 'Acheteur', 'Téléphone', 'Inscrit', 'Commandes', 'Total achats', 'Statut', 'F2A', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: h === 'Actions' ? 'center' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {liste.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: THEME.textLight }}>
                        Aucun acheteur trouvé
                      </td>
                    </tr>
                  ) : liste.map(a => {
                    const cfg = getStatutStyle(a.statut);
                    const nomComplet = a.prenom ? `${a.prenom} ${a.nom}` : a.nom;
                    const initiale = a.prenom ? a.prenom.charAt(0).toUpperCase() : (a.nom ? a.nom.charAt(0).toUpperCase() : '?');
                    
                    return (
                      <tr key={a.id} className="row-hover" style={{ borderBottom: `1px solid ${THEME.border}`, transition: 'background-color 0.1s' }}>

                        {/* ID */}
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: THEME.textLight, fontWeight: '600' }}>#{a.id}</td>

                        {/* Acheteur - CORRIGÉ pour afficher prénom + nom */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: THEME.accentLight, color: THEME.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', flexShrink: 0 }}>
                              {initiale}
                            </div>
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: 0 }}>{nomComplet}</p>
                              <p style={{ fontSize: '11px', color: THEME.textLight, margin: '1px 0 0' }}>{a.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Téléphone */}
                        <td style={{ padding: '12px 14px', fontSize: '12px', color: THEME.textLight }}>{a.telephone || '—'}</td>

                        {/* Date inscription */}
                        <td style={{ padding: '12px 14px' }}>
                          <p style={{ fontSize: '12px', color: THEME.text, margin: 0 }}>{fmtDate(a.date_inscription)}</p>
                          <p style={{ fontSize: '10px', color: THEME.textLight, margin: '2px 0 0' }}>il y a {dureeDepuis(a.date_inscription)}</p>
                        </td>

                        {/* Commandes */}
                        <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700', color: THEME.text }}>{a.nb_commandes}</td>

                        {/* Total achats */}
                        <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700', color: THEME.accent }}>{fmtMontant(a.total_achats)}</td>

                        {/* Statut */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ backgroundColor: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{cfg.text}</span>
                        </td>

                        {/* F2A */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {a.twoFactorEnabled ? (
                            <span title="F2A activée" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '15px', fontWeight: '900' }}>✓</span>
                          ) : (
                            <span title="F2A non activée" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#fff3e0', color: '#ea580c', fontSize: '15px', fontWeight: '900' }}>✕</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>

                            {/* Bouton Notes */}
                            <button onClick={() => setModalNotes(a)} title="Notes internes"
                              style={{ width: '30px', height: '30px', borderRadius: '7px', border: `1px solid ${THEME.border}`, backgroundColor: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              📋
                            </button>

                            {/* Bouton Accéder — impersonation acheteur */}
                            <button
                              onClick={() => onImpersonate ? onImpersonate(a) : window.open(`/acheteur?id=${a.id}&admin=true`, '_blank')}
                              title="Accéder au dashboard acheteur"
                              style={{ padding: '5px 10px', borderRadius: '7px', border: `1px solid ${THEME.accent}`, backgroundColor: THEME.accentLight, color: THEME.accent, cursor: 'pointer', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                              👤 Accéder
                            </button>

                            {/* Menu 3 points */}
                            <div style={{ position: 'relative' }}>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                                  setMenuPos({ top: rect.bottom + 4, left: rect.right - 200 });
                                  setMenuOuvert(menuOuvert === a.id ? null : a.id);
                                }}
                                style={{ width: '30px', height: '30px', borderRadius: '7px', border: `1px solid ${THEME.border}`, backgroundColor: 'white', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: THEME.textLight }}>
                                ⋮
                              </button>

                              {menuOuvert === a.id && (
                                <div style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, backgroundColor: 'white', border: `1px solid ${THEME.border}`, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 1000, width: '210px', overflow: 'hidden' }}
                                  onClick={e => e.stopPropagation()}>
                                  <div style={{ padding: '4px 0' }}>
                                    <MenuItem onClick={() => { setMenuOuvert(null); onNaviguerVers?.('messagerie'); }}>
                                      💬 Message
                                    </MenuItem>
                                    <MenuItem onClick={() => { setMenuOuvert(null); setModalMdp(a); }}>
                                      🔑 Changer le mot de passe
                                    </MenuItem>
                                    <MenuItem
                                      onClick={() => { setMenuOuvert(null); handleToggleF2A(a); }}
                                      style={{ color: a.twoFactorEnabled ? THEME.warning : THEME.success }}
                                    >
                                      {a.twoFactorEnabled ? '🔓 Désactiver la F2A de cet acheteur' : '🔐 Activer la F2A de cet acheteur'}
                                    </MenuItem>
                                    <div style={{ height: '1px', backgroundColor: THEME.border, margin: '4px 0' }} />
                                    <div style={{ padding: '4px 14px 6px' }}>
                                      <p style={{ fontSize: '10px', color: THEME.textLight, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Statut actuel</p>
                                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', backgroundColor: getStatutStyle(a.statut).bg, color: getStatutStyle(a.statut).color }}>{getStatutStyle(a.statut).text}</span>
                                    </div>
                                    <MenuItem onClick={() => { setMenuOuvert(null); setModalStatut(a); }} style={{ color: THEME.accent }}>
                                      🔄 Changer le statut
                                    </MenuItem>
                                    <div style={{ height: '1px', backgroundColor: THEME.border, margin: '4px 0' }} />
                                    <MenuItem onClick={() => { setMenuOuvert(null); setModalCmds(a); }}>
                                      🛒 Achats de l'acheteur
                                    </MenuItem>
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
            </div>
          </div>

          {/* Pagination info */}
          {liste.length > 0 && (
            <p style={{ fontSize: '12px', color: THEME.textLight, textAlign: 'right', marginTop: '10px' }}>
              {liste.length} acheteur{liste.length > 1 ? 's' : ''} affiché{liste.length > 1 ? 's' : ''}
              {recherche || filtreStatut !== 'tous' ? ` sur ${acheteurs.length} total` : ''}
            </p>
          )}
        </div>
      </div>

      {/* Modales */}
      {modalNotes && (
        <ModalNotes acheteur={modalNotes}
          onAjouterNote={c => ajouterNote(modalNotes, c)}
          onSupprimerNote={id => supprimerNote(modalNotes, id)}
          onFermer={() => setModalNotes(null)} />
      )}
      {modalMdp && (
        <ModalChangerMdp acheteur={modalMdp}
          onConfirm={mdp => changerMdp(modalMdp, mdp)}
          onFermer={() => setModalMdp(null)} />
      )}
      {modalStatut && (
        <ModalChangerStatut acheteur={modalStatut}
          onConfirm={(s, r) => changerStatut(modalStatut, s, r)}
          onFermer={() => setModalStatut(null)} />
      )}
      {modalCmds && (
        <ModalCommandes acheteur={modalCmds} onFermer={() => setModalCmds(null)} />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999, backgroundColor: toast.type === 'success' ? '#16a34a' : '#dc2626', color: 'white', padding: '14px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'slideIn 0.3s ease' }}>
          {toast.msg}
        </div>
      )}
    </>
  );
}
