import React, { useState, useEffect } from 'react';
import { log } from '../../services/logger';

// ── Types ─────────────────────────────────────────────────────────────────────
type RaisonSuspension =
  | 'activite_suspecte'
  | 'violation_politique'
  | 'paiement_echec'
  | 'signalement_client'
  | 'fraude'
  | 'inactif'
  | 'autre';

interface NoteSuspension {
  id: number;
  date: string;
  auteur: string;
  contenu: string;
  compte_id: number;
}

interface CompteSuspendu {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  boutique: string;
  categorie: string;
  province: string;
  plan: string;
  dateSuspension: string;
  dateSuspensionISO: string | null;
  dateFin?: string | null;
  raisonSuspension: RaisonSuspension;
  suspendePar: string;
  totalVentes: number;
  nbCommandes: number;
  nbSignalements: number;
  notes: NoteSuspension[];
  statut: string;
  gravite: 'faible' | 'moyenne' | 'grave';
}

// ── Thème ─────────────────────────────────────────────────────────────────────
const T = {
  accent: '#2d6a9f', accentLight: '#e8f2fb',
  bg: '#f0f2f5', card: '#ffffff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  success: '#16a34a', warning: '#d97706', danger: '#dc2626',
  orange: '#ea580c', purple: '#7c3aed',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const RAISONS: Record<RaisonSuspension, { label: string; icon: string; color: string }> = {
  activite_suspecte:   { label: 'Activité suspecte',      icon: '🚨', color: '#dc2626' },
  violation_politique: { label: 'Violation de politique', icon: '⚠️', color: '#d97706' },
  paiement_echec:      { label: 'Paiement échoué',        icon: '💳', color: '#ea580c' },
  signalement_client:  { label: 'Signalement client',     icon: '🚩', color: '#be185d' },
  fraude:              { label: 'Fraude détectée',        icon: '🔒', color: '#7c3aed' },
  inactif:             { label: 'Compte inactif',         icon: '💤', color: '#6b7280' },
  autre:               { label: 'Autre raison',           icon: '📋', color: '#6b7280' },
};

const getRaison = (raison: string) =>
  RAISONS[raison as RaisonSuspension] ?? RAISONS.autre;

function GraviteBadge({ niveau }: { niveau: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    faible:  { bg: '#f3f4f6', color: '#6b7280', label: '⬜ Faible'  },
    moyenne: { bg: '#fef9c3', color: '#92400e', label: '🟡 Moyenne' },
    grave:   { bg: '#fee2e2', color: '#dc2626', label: '🔴 Grave'   },
  };
  const s = map[niveau] ?? map.faible;
  return (
    <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
      {s.label}
    </span>
  );
}

function dureeDepuis(iso: string | null) {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "aujourd'hui";
  if (diff === 1) return 'hier';
  if (diff < 7)  return `${diff} jours`;
  if (diff < 30) return `${Math.floor(diff / 7)} sem.`;
  return `${Math.floor(diff / 30)} mois`;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'danger' | 'info' | 'orange' }) {
  const colors: Record<string, string> = {
    success: T.success, danger: T.danger, info: T.accent, orange: T.orange,
  };
  return (
    <div style={{
      position: 'fixed', top: '24px', right: '24px',
      backgroundColor: colors[type], color: 'white',
      padding: '14px 20px', borderRadius: '10px',
      fontSize: '13px', fontWeight: '700', zIndex: 2000,
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)', maxWidth: '400px', lineHeight: '1.5',
    }}>
      {msg}
    </div>
  );
}

// ── Modal Notes ───────────────────────────────────────────────────────────────
function ModalNotes({
  compte,
  onAjouterNote,
  onSupprimerNote,
  onFermer,
}: {
  compte: CompteSuspendu;
  onAjouterNote: (contenu: string) => void;
  onSupprimerNote: (noteId: number) => void;
  onFermer: () => void;
}) {
  const [nouvelleNote, setNouvelleNote] = useState('');
  const [noteASupprimer, setNoteASupprimer] = useState<number | null>(null);
  const r = getRaison(compte.raisonSuspension);

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onFermer()}
    >
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📋</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>{compte.prenom} {compte.nom}</p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>
                  🏪 {compte.boutique} · suspendu depuis {dureeDepuis(compte.dateSuspensionISO)}
                </p>
              </div>
            </div>
            <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>

          <div style={{ marginTop: '14px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>{r.icon}</span>
            <div>
              <p style={{ fontSize: '11px', opacity: 0.6, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Raison de suspension</p>
              <p style={{ fontSize: '13px', fontWeight: '700', margin: 0 }}>{r.label}</p>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>Suspendu par</p>
              <p style={{ fontSize: '12px', fontWeight: '700', margin: 0 }}>{compte.suspendePar}</p>
            </div>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Infos rapides */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: 'Ventes totales', val: `${compte.totalVentes.toFixed(2)} $`, icon: '💰', alert: false },
              { label: 'Commandes',      val: String(compte.nbCommandes),           icon: '📦', alert: false },
              { label: 'Signalements',   val: String(compte.nbSignalements),        icon: '🚩', alert: compte.nbSignalements > 2 },
            ].map((k, i) => (
              <div key={i} style={{ backgroundColor: k.alert ? '#fff5f5' : '#f8fafc', border: `1px solid ${k.alert ? '#fecaca' : T.border}`, borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
                <p style={{ fontSize: '16px', margin: '0 0 2px 0' }}>{k.icon}</p>
                <p style={{ fontSize: '16px', fontWeight: '800', color: k.alert ? T.danger : T.text, margin: '0 0 2px 0' }}>{k.val}</p>
                <p style={{ fontSize: '10px', color: T.textLight, margin: 0 }}>{k.label}</p>
              </div>
            ))}
          </div>

          {/* Historique des notes */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>
              📋 Historique des notes ({compte.notes.length})
            </h4>
            {compte.notes.length === 0 ? (
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '20px', textAlign: 'center', color: T.textLight, fontSize: '13px' }}>
                Aucune note pour ce compte.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...compte.notes].reverse().map(note => (
                  <div key={note.id} style={{ backgroundColor: '#f8fafc', border: `1px solid ${T.border}`, borderRadius: '10px', padding: '12px 14px', position: 'relative' }}>

                    {/* Confirmation suppression inline */}
                    {noteASupprimer === note.id && (
                      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', zIndex: 10, padding: '12px' }}>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: T.danger, margin: 0, textAlign: 'center' }}>🗑️ Supprimer cette note ?</p>
                        <p style={{ fontSize: '11px', color: T.textLight, margin: 0, textAlign: 'center', maxWidth: '280px' }}>"{note.contenu.substring(0, 60)}{note.contenu.length > 60 ? '...' : ''}"</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setNoteASupprimer(null)}
                            style={{ padding: '6px 14px', border: `1px solid ${T.border}`, borderRadius: '6px', backgroundColor: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                            Annuler
                          </button>
                          <button onClick={() => { onSupprimerNote(note.id); setNoteASupprimer(null); }}
                            style={{ padding: '6px 14px', border: 'none', borderRadius: '6px', backgroundColor: T.danger, color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: 'white' }}>
                          {note.auteur.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: T.text }}>{note.auteur}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: T.textLight }}>{note.date}</span>
                        <button
                          onClick={() => setNoteASupprimer(note.id)}
                          title="Supprimer cette note"
                          style={{ width: '20px', height: '20px', border: 'none', borderRadius: '50%', backgroundColor: '#fee2e2', color: T.danger, fontSize: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          ✕
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: T.text, margin: 0, lineHeight: '1.6' }}>{note.contenu}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ajouter une note */}
          <div style={{ backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 16px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: T.accent, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>
              ✏️ Ajouter une note
            </h4>
            <textarea
              value={nouvelleNote}
              onChange={e => setNouvelleNote(e.target.value)}
              rows={3}
              placeholder="Décrivez l'évolution de la situation, vos actions, observations..."
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px', fontFamily: 'inherit' }}
            />
            <button
              onClick={() => { if (nouvelleNote.trim()) { onAjouterNote(nouvelleNote.trim()); setNouvelleNote(''); } }}
              disabled={!nouvelleNote.trim()}
              style={{ backgroundColor: nouvelleNote.trim() ? T.accent : '#93c5fd', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '12px', fontWeight: '700', cursor: nouvelleNote.trim() ? 'pointer' : 'not-allowed' }}>
              💾 Enregistrer la note
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onFermer} style={{ padding: '10px 20px', border: `1px solid ${T.border}`, borderRadius: '8px', backgroundColor: 'white', color: T.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Confirmation Réactivation ──────────────────────────────────────────
function ModalReactiver({
  compte,
  onConfirmer,
  onAnnuler,
}: {
  compte: CompteSuspendu;
  onConfirmer: () => void;
  onAnnuler: () => void;
}) {
  const [confirmation, setConfirmation] = useState('');
  const MOT = 'RÉACTIVER';

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '460px', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        <div style={{ padding: '20px 24px', backgroundColor: '#f0fdf4', borderBottom: `2px solid ${T.success}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>✅</div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '900', margin: 0, color: T.success }}>Réactiver ce compte</h3>
              <p style={{ fontSize: '12px', color: T.textLight, margin: '2px 0 0 0' }}>{compte.prenom} {compte.nom} · {compte.boutique}</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: '600', margin: 0 }}>
              📧 Un courriel de réactivation sera automatiquement envoyé à <strong>{compte.email}</strong>.
            </p>
          </div>

          <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', border: `1px solid ${T.border}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
              <span style={{ color: T.textLight }}>Suspendu depuis :</span>
              <span style={{ fontWeight: '700', color: T.text }}>{compte.dateSuspension} ({dureeDepuis(compte.dateSuspensionISO)})</span>
              <span style={{ color: T.textLight }}>Raison :</span>
              <span style={{ fontWeight: '700', color: T.text }}>{getRaison(compte.raisonSuspension).icon} {getRaison(compte.raisonSuspension).label}</span>
              <span style={{ color: T.textLight }}>Signalements :</span>
              <span style={{ fontWeight: '700', color: compte.nbSignalements > 0 ? T.danger : T.success }}>
                {compte.nbSignalements} signalement{compte.nbSignalements > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {compte.nbSignalements > 2 && (
            <div style={{ backgroundColor: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: T.danger, fontWeight: '700', margin: 0 }}>
                ⚠️ Attention — {compte.nbSignalements} signalements clients sur ce compte. Assurez-vous que le problème est résolu avant de réactiver.
              </p>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', color: T.textLight, margin: '0 0 6px 0' }}>
              Tapez <strong style={{ color: T.success }}>{MOT}</strong> pour confirmer :
            </p>
            <input
              type="text"
              value={confirmation}
              onChange={e => setConfirmation(e.target.value.toUpperCase())}
              placeholder={MOT}
              style={{ width: '100%', border: `2px solid ${confirmation === MOT ? T.success : T.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '14px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', letterSpacing: '1px', transition: 'border 0.2s', fontFamily: 'monospace' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onAnnuler} style={{ flex: 1, padding: '11px', border: `1px solid ${T.border}`, borderRadius: '8px', backgroundColor: 'white', color: T.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              Annuler
            </button>
            <button
              onClick={onConfirmer}
              disabled={confirmation !== MOT}
              style={{ flex: 1, padding: '11px', border: 'none', borderRadius: '8px', backgroundColor: confirmation === MOT ? T.success : '#86efac', color: 'white', fontSize: '13px', fontWeight: '700', cursor: confirmation === MOT ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}>
              ✅ Confirmer la réactivation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
interface ComptesSuspendusProps {
  naviguerVers: (page: string, data?: any) => void;
}

export default function ComptesSuspendus({ naviguerVers }: ComptesSuspendusProps) {
  const [comptes, setComptes]                 = useState<CompteSuspendu[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [erreurChargement, setErreurChargement] = useState<string | null>(null);
  const [recherche, setRecherche]             = useState('');
  const [filtreGravite, setFiltreGravite]     = useState('tous');
  const [filtreRaison, setFiltreRaison]       = useState('tous');
  const [compteNotes, setCompteNotes]         = useState<CompteSuspendu | null>(null);
  const [compteReactiver, setCompteReactiver] = useState<CompteSuspendu | null>(null);
  const [toast, setToast]                     = useState<{ msg: string; type: 'success' | 'danger' | 'info' | 'orange' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'danger' | 'info' | 'orange') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getToken = () => localStorage.getItem('token');

  // ── Charger les comptes suspendus ────────────────────────────────────────
  // CORRECTION : utilise /api/vendeurs/suspendus qui filtre strictement statut = 'suspendu'
  const chargerComptes = async () => {
    try {
      setLoading(true);
      setErreurChargement(null);

      const token = getToken();
      const response = await fetch('https://evend-multivendeur-api.onrender.com/api/vendeurs/suspendus', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 403) {
          const detail = errData.detail || errData.message || 'Token invalide ou rôle insuffisant';
          // Token corrompu — on le supprime pour forcer une nouvelle connexion
          console.error('🔒 403 isAdmin refusé:', errData);
          throw new Error(`Accès refusé (403) — ${detail}`);
        }
        if (response.status === 401) {
          localStorage.removeItem('token');
          throw new Error('Session expirée — veuillez vous reconnecter');
        }
        throw new Error(errData.error || errData.message || `HTTP ${response.status}`);
      }

      const data: CompteSuspendu[] = await response.json();

      // Le serveur renvoie déjà des objets transformés avec les bons champs
      // On s'assure juste que le tableau ne contient que des suspendus (double sécurité)
      const uniquementSuspendus = data.filter((c: any) => c.statut === 'suspendu');

      console.log(`✅ ${data.length} comptes reçus du serveur, ${uniquementSuspendus.length} avec statut=suspendu`);

      setComptes(uniquementSuspendus);
      log.admin('Page comptes suspendus', `${uniquementSuspendus.length} comptes suspendus chargés`);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ Erreur chargement comptes suspendus:', msg);
      setErreurChargement(msg);
      log.erreur('Erreur chargement comptes suspendus', msg);
      showToast(`❌ Erreur lors du chargement : ${msg}`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ── Charger les notes d'un compte ────────────────────────────────────────
  const chargerNotes = async (compteId: number): Promise<NoteSuspension[]> => {
    try {
      const token = getToken();
      const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/vendeurs/${compteId}/notes`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Erreur chargement notes');

      const data = await response.json();
      return data.map((n: any) => ({
        id: n.id,
        date: n.date || new Date(n.date_creation).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }),
        auteur: n.auteur || 'Admin',
        contenu: n.contenu,
        compte_id: compteId,
      }));
    } catch (err) {
      console.error('Erreur chargement notes:', err);
      return [];
    }
  };

  useEffect(() => {
    chargerComptes();
    log.admin('Page visitée', 'Comptes suspendus');
  }, []);

  // ── Ouvrir modal notes ────────────────────────────────────────────────────
  const handleOuvrirNotes = async (compte: CompteSuspendu) => {
    if (compte.notes.length === 0) {
      const notes = await chargerNotes(compte.id);
      setCompteNotes({ ...compte, notes });
    } else {
      setCompteNotes(compte);
    }
  };

  //
  const handleSupprimerNote = async (compte: CompteSuspendu, noteId: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://evend-multivendeur-api.onrender.com/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur suppression');
      setComptes(prev => prev.map(c =>
        c.id === compte.id ? { ...c, notes: c.notes.filter(n => n.id !== noteId) } : c
      ));
      setCompteNotes(prev => prev ? { ...prev, notes: prev.notes.filter(n => n.id !== noteId) } : prev);
      showToast('🗑️ Note supprimée', 'success');
    } catch {
      showToast('❌ Erreur lors de la suppression de la note', 'danger');
    }
  };

  const handleAjouterNote = async (compte: CompteSuspendu, contenu: string) => {
    try {
      const token = getToken();
      const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/vendeurs/${compte.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ contenu, auteur: 'Admin', type: 'suspension' }),
      });
      if (!response.ok) throw new Error('Erreur ajout note');

      const nouvelleNote = await response.json();
      const noteFormatee: NoteSuspension = {
        id: nouvelleNote.id,
        date: new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }),
        auteur: 'Admin',
        contenu,
        compte_id: compte.id,
      };

      setComptes(prev => prev.map(c => c.id === compte.id ? { ...c, notes: [...c.notes, noteFormatee] } : c));
      setCompteNotes(prev => prev ? { ...prev, notes: [...prev.notes, noteFormatee] } : prev);
      log.admin('Note ajoutée', `Note ajoutée au compte suspendu ${compte.id}`, { compte_id: String(compte.id) });
      showToast('📋 Note enregistrée avec succès.', 'info');

    } catch (err) {
      console.error('Erreur ajout note:', err);
      showToast("❌ Erreur lors de l'ajout de la note", 'danger');
    }
  };

  // ── Réactiver un compte ───────────────────────────────────────────────────
  const handleReactiver = async (compte: CompteSuspendu) => {
    try {
      const token = getToken();
      const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/vendeurs/${compte.id}/reactiver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur réactivation');
      }

      setComptes(prev => prev.filter(c => c.id !== compte.id));
      log.admin('Compte réactivé', `Compte ${compte.id} (${compte.email}) réactivé`, { compte_id: String(compte.id) });
      showToast(`✅ Compte de ${compte.prenom} ${compte.nom} réactivé ! Courriel envoyé.`, 'success');

    } catch (err) {
      console.error('Erreur réactivation:', err);
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      showToast(`❌ Erreur lors de la réactivation : ${msg}`, 'danger');
    } finally {
      setCompteReactiver(null);
    }
  };

  // ── Filtres ───────────────────────────────────────────────────────────────
  const filtres = comptes.filter(c => {
    const s = recherche.toLowerCase();
    const inSearch = !s ||
      c.boutique.toLowerCase().includes(s) ||
      `${c.prenom} ${c.nom}`.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s);
    const inGravite = filtreGravite === 'tous' || c.gravite === filtreGravite;
    const inRaison  = filtreRaison  === 'tous' || c.raisonSuspension === filtreRaison;
    return inSearch && inGravite && inRaison;
  });

  const nbSuspendus = comptes.length;
  const nbGraves    = comptes.filter(c => c.gravite === 'grave').length;
  const nbSignaux   = comptes.reduce((s, c) => s + c.nbSignalements, 0);

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${T.border}`, borderRadius: '8px', padding: '8px 12px',
    fontSize: '12px', outline: 'none', backgroundColor: 'white', cursor: 'pointer',
  };

  // ── État chargement ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: T.textLight }}>Chargement des comptes suspendus...</p>
        </div>
      </div>
    );
  }

  // ── État erreur ───────────────────────────────────────────────────────────
  if (erreurChargement) {
    const is403 = erreurChargement.includes('403') || erreurChargement.includes('Accès refusé');
    const is401 = erreurChargement.includes('401') || erreurChargement.includes('expirée');
    return (
      <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>{is403 ? '🔒' : is401 ? '⏰' : '❌'}</div>
          <p style={{ color: T.danger, fontWeight: '800', marginBottom: '8px', fontSize: '16px' }}>
            {is403 ? 'Accès refusé (403)' : is401 ? 'Session expirée (401)' : 'Erreur de chargement'}
          </p>
          <p style={{ color: T.textLight, fontSize: '13px', marginBottom: '16px' }}>{erreurChargement}</p>

          {(is403 || is401) && (
            <div style={{ backgroundColor: '#fff9db', border: '1px solid #f59e0b', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', textAlign: 'left' }}>
              <p style={{ fontSize: '12px', color: '#92400e', fontWeight: '700', margin: '0 0 6px 0' }}>
                💡 Comment régler ça :
              </p>
              <ol style={{ fontSize: '12px', color: '#92400e', margin: 0, paddingLeft: '18px', lineHeight: '1.8' }}>
                <li>Ouvre la console du navigateur (F12 → Console)</li>
                <li>Tape : <code style={{ backgroundColor: '#fef3c7', padding: '1px 5px', borderRadius: '4px' }}>localStorage.removeItem('token')</code></li>
                <li>Recharge la page et reconnecte-toi en tant qu'<strong>admin</strong></li>
              </ol>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={chargerComptes}
              style={{ backgroundColor: T.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              🔄 Réessayer
            </button>
            {(is403 || is401) && (
              <button
                onClick={() => { localStorage.removeItem('token'); window.location.reload(); }}
                style={{ backgroundColor: T.danger, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                🔑 Vider token & recharger
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {compteNotes && (
        <ModalNotes
          compte={compteNotes}
          onAjouterNote={contenu => handleAjouterNote(compteNotes, contenu)}
          onSupprimerNote={noteId => handleSupprimerNote(compteNotes, noteId)}
          onFermer={() => setCompteNotes(null)}
        />
      )}

      {compteReactiver && (
        <ModalReactiver
          compte={compteReactiver}
          onConfirmer={() => handleReactiver(compteReactiver)}
          onAnnuler={() => setCompteReactiver(null)}
        />
      )}

      <div style={{ padding: '24px 28px', backgroundColor: T.bg, minHeight: '100vh' }}>

        {/* En-tête */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: T.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Comptes suspendus
          </h1>
          <p style={{ fontSize: '13px', color: T.textLight, margin: 0 }}>
            Vendeurs · Gestion et suivi des suspensions
          </p>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Suspendus',        val: nbSuspendus, icon: '🚫', c: T.danger,  sous: 'Comptes en suspension'            },
            { label: 'Gravité grave',    val: nbGraves,    icon: '🔴', c: T.purple,  sous: 'Nécessitent attention immédiate'  },
            { label: 'Signalements',     val: nbSignaux,   icon: '🚩', c: T.orange,  sous: 'Total signalements'               },
            { label: 'Taux résolution',  val: '87%',       icon: '📊', c: T.success, sous: 'Réactivés ce mois'                },
          ].map((k, i) => (
            <div key={i} style={{ backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ fontSize: '18px', width: '36px', height: '36px', borderRadius: '8px', backgroundColor: k.c + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{k.icon}</div>
                <p style={{ fontSize: '24px', fontWeight: '900', color: T.text, margin: 0 }}>{k.val}</p>
              </div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, margin: '0 0 1px 0' }}>{k.label}</p>
              <p style={{ fontSize: '10px', color: '#aaa', margin: 0 }}>{k.sous}</p>
            </div>
          ))}
        </div>

        {/* Barre filtres */}
        <div style={{ backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' as const }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>🔍</span>
            <input
              type="text" value={recherche}
              onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher par nom, boutique ou courriel..."
              style={{ ...inputStyle, width: '100%', paddingLeft: '32px', boxSizing: 'border-box', cursor: 'text' }}
            />
          </div>

          <select value={filtreGravite} onChange={e => setFiltreGravite(e.target.value)} style={inputStyle}>
            <option value="tous">Toutes gravités</option>
            <option value="grave">🔴 Grave</option>
            <option value="moyenne">🟡 Moyenne</option>
            <option value="faible">⬜ Faible</option>
          </select>

          <select value={filtreRaison} onChange={e => setFiltreRaison(e.target.value)} style={inputStyle}>
            <option value="tous">Toutes les raisons</option>
            {Object.entries(RAISONS).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>

          {(recherche || filtreGravite !== 'tous' || filtreRaison !== 'tous') && (
            <button
              onClick={() => { setRecherche(''); setFiltreGravite('tous'); setFiltreRaison('tous'); }}
              style={{ ...inputStyle, cursor: 'pointer', fontWeight: '600', color: T.textLight }}>
              ✕ Réinitialiser
            </button>
          )}

          <button
            onClick={chargerComptes}
            style={{ ...inputStyle, cursor: 'pointer', fontWeight: '600', color: T.accent, borderColor: T.accent }}>
            🔄 Actualiser
          </button>

          <p style={{ fontSize: '12px', color: T.textLight, margin: 0, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            <strong>{filtres.length}</strong> / {comptes.length} comptes
          </p>
        </div>

        {/* Tableau */}
        <div style={{ backgroundColor: T.card, borderRadius: '12px', border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}`, backgroundColor: '#f8fafc' }}>
                  {['Vendeur', 'Boutique', 'Raison', 'Gravité', 'Suspendu depuis', 'Signalements', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: T.accent, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtres.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '60px', textAlign: 'center', color: T.textLight, fontSize: '14px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>
                        {comptes.length === 0 ? '✅' : '🔍'}
                      </div>
                      {comptes.length === 0
                        ? 'Aucun compte suspendu en ce moment.'
                        : 'Aucun résultat pour ces filtres.'}
                    </td>
                  </tr>
                ) : filtres.map((c, i) => {
                  const r = getRaison(c.raisonSuspension);
                  return (
                    <tr
                      key={c.id}
                      style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f0f7ff'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = i % 2 === 0 ? 'white' : '#fafafa'}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: T.danger, flexShrink: 0 }}>
                            {(c.prenom || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: '700', color: T.text, margin: 0 }}>{c.prenom} {c.nom}</p>
                            <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>{c.email}</p>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: T.text, margin: 0 }}>{c.boutique || '—'}</p>
                        <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>{c.province}</p>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ backgroundColor: r.color + '15', color: r.color, padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                          {r.icon} {r.label}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <GraviteBadge niveau={c.gravite} />
                      </td>

                      <td style={{ padding: '12px 16px', fontSize: '12px', color: T.textLight }}>
                        <p style={{ margin: 0, fontWeight: '600' }}>{c.dateSuspension || '—'}</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: c.gravite === 'grave' ? T.danger : '#aaa' }}>
                          {dureeDepuis(c.dateSuspensionISO)}
                        </p>
                        {c.dateFin && (
                          <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: T.orange, fontWeight: '700' }}>
                            Fin: {c.dateFin}
                          </p>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: c.nbSignalements > 2 ? T.danger : c.nbSignalements > 0 ? T.warning : T.textLight }}>
                          {c.nbSignalements > 0 ? `🚩 ${c.nbSignalements}` : '—'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ backgroundColor: '#fee2e2', color: T.danger, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                          🚫 Suspendu
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleOuvrirNotes(c)}
                            style={{ position: 'relative', backgroundColor: T.accentLight, color: T.accent, border: `1px solid #bfdbfe`, borderRadius: '7px', padding: '7px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                            title="Voir les notes">
                            📋
                            {c.notes.length > 0 && (
                              <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: T.accent, color: 'white', fontSize: '9px', fontWeight: '800', padding: '1px 4px', borderRadius: '8px', minWidth: '14px', textAlign: 'center' }}>
                                {c.notes.length}
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => setCompteReactiver(c)}
                            style={{ backgroundColor: '#dcfce7', color: T.success, border: `1px solid ${T.success}`, borderRadius: '7px', padding: '7px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            ↩ Réactiver
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Note bas de page */}
        <div style={{ marginTop: '20px', padding: '12px 16px', backgroundColor: '#f8fafc', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '11px', color: T.textLight }}>
          📋 Toutes les actions (réactivation, ajout de notes) sont automatiquement enregistrées dans les journaux d'audit (menu "Journaux &amp; Audits").
        </div>

      </div>
    </>
  );
}
