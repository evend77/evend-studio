import React, { useState, useMemo, useEffect, useRef } from 'react';

// Types
export interface NoteInterne {
  id: number;
  date: string;
  auteur: string;
  contenu: string;
}

export interface Vendeur {
  id: number;
  sellerId: string;
  nom: string;
  email: string;
  nom_boutique: string;
  plan: string;
  statut: 'actif' | 'suspendu' | 'en_attente' | 'pending' | 'banni' | 'rejected';
  dateInscription: string;
  totalVentes: number;
  commission: number;
  produits: number;
  avatar?: string;
  telephone?: string;
  adresse?: string;
  notes?: NoteInterne[];
  nbSignalements?: number;
  nbCommandes?: number;
  suspendePar?: string;
  gravite?: 'faible' | 'moyenne' | 'grave';
  twoFactorEnabled?: boolean;
}

interface Signalement {
  id: number;
  vendeur_id: number;
  signaleur_type: 'acheteur' | 'vendeur' | 'anonyme';
  signaleur_id?: number;
  signaleur_nom: string;
  signaleur_email?: string;
  categorie: string;
  raison: string;
  preuve_url?: string;
  statut: 'nouveau' | 'vu' | 'traite' | 'rejete';
  note_admin?: string;
  traite_par?: string;
  date_traitement?: string;
  created_at: string;
}

const CATEGORIES_SIGNALEMENT: Record<string, { label: string; icon: string; color: string }> = {
  produit_frauduleux:  { label: 'Produit frauduleux / contrefait', icon: '🚨', color: '#dc2626' },
  non_livraison:       { label: 'Non-livraison de commande',        icon: '📦', color: '#ea580c' },
  fausse_description:  { label: 'Fausse description produit',       icon: '📝', color: '#d97706' },
  comportement_abusif: { label: 'Comportement abusif',              icon: '😡', color: '#be185d' },
  spam:                { label: 'Spam / publicité trompeuse',       icon: '📢', color: '#7c3aed' },
  autre:               { label: 'Autre',                            icon: '📋', color: '#6b7280' },
};

const STATUTS_SIGNALEMENT: Record<string, { label: string; bg: string; color: string }> = {
  nouveau: { label: '🔴 Nouveau',  bg: '#fee2e2', color: '#dc2626' },
  vu:      { label: '👁️ Vu',       bg: '#fef9c3', color: '#d97706' },
  traite:  { label: '✅ Traité',   bg: '#dcfce7', color: '#16a34a' },
  rejete:  { label: '❌ Rejeté',   bg: '#f3f4f6', color: '#6b7280' },
};

interface ListeVendeursProps {
  onImpersonate: (vendeur: Vendeur) => void;
  onNaviguerVers?: (page: string, data?: any) => void;
  vendeurs: Vendeur[];
  onStatutChange?: (vendeurId: number, nouveauStatut: string) => void;
}

// Type pour le tri
type TriOption = 
  | 'sellerId-asc' 
  | 'nom-asc' 
  | 'date-desc' 
  | 'ventes-asc' 
  | 'ventes-desc' 
  | 'produits-asc' 
  | 'produits-desc';

// Thème cohérent avec l'administration
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

// Styles d'impression
const printStyles = `
  @media print {
    @page {
      size: landscape;
      margin: 1.5cm;
    }
    
    body * {
      visibility: hidden;
    }
    
    .print-table, .print-table * {
      visibility: visible;
    }
    
    .print-table {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      margin: 0;
      padding: 20px;
    }
    
    .no-print {
      display: none !important;
    }
    
    th {
      background-color: #f8fafc !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      text-align: center !important;
      font-weight: bold;
      border-bottom: 2px solid #2d6a9f;
    }
    
    td {
      text-align: center !important;
      padding: 8px 4px !important;
      border-bottom: 1px solid #e1e4e8;
    }
    
    .statut-badge {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      display: inline-block;
      padding: 4px 8px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: bold;
    }
  }
`;

// Types pour la modale de confirmation
type ActionType = 'desactiver' | 'supprimer' | 'reactiver' | 'desactiver_bulk' | 'reactiver_bulk' | 'supprimer_bulk' | 'changer_mot_de_passe' | null;

interface ModaleConfirmationProps {
  isOpen: boolean;
  type: ActionType;
  vendeur: Vendeur | null;
  vendeursCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

// Helper pour la durée
function dureeDepuis(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "aujourd'hui";
  if (diff === 1) return 'hier';
  if (diff < 7)  return `${diff} jours`;
  if (diff < 30) return `${Math.floor(diff / 7)} sem.`;
  return `${Math.floor(diff / 30)} mois`;
}

// Modale de notes internes
function ModalNotes({
  vendeur,
  onAjouterNote,
  onSupprimerNote,
  onFermer,
}: {
  vendeur: Vendeur;
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

        {/* Header avec gradient */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📋</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>{vendeur.nom}</p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>🏪 {vendeur.nom_boutique} · {vendeur.email}</p>
              </div>
            </div>
            <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>

          {/* Statut et infos rapides */}
          <div style={{ marginTop: '14px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>{vendeur.statut === 'actif' ? '✅' : vendeur.statut === 'suspendu' ? '🚫' : '⏳'}</span>
            <div>
              <p style={{ fontSize: '11px', opacity: 0.6, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Statut</p>
              <p style={{ fontSize: '13px', fontWeight: '700', margin: 0 }}>{vendeur.statut === 'actif' ? 'Actif' : vendeur.statut === 'suspendu' ? 'Suspendu' : 'En attente'}</p>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>Plan</p>
              <p style={{ fontSize: '12px', fontWeight: '700', margin: 0 }}>{vendeur.plan}</p>
            </div>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Infos rapides */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: 'Ventes totales', val: `${vendeur.totalVentes.toFixed(2)} $`, icon: '💰' },
              { label: 'Produits',      val: vendeur.produits,                   icon: '📦' },
              { label: 'Signalements',   val: vendeur.nbSignalements || 0,                icon: '🚩', alert: (vendeur.nbSignalements || 0) > 2 },
            ].map((k, i) => (
              <div key={i} style={{ backgroundColor: k.alert ? '#fff5f5' : '#f8fafc', border: `1px solid ${k.alert ? '#fecaca' : THEME.border}`, borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
                <p style={{ fontSize: '16px', margin: '0 0 2px 0' }}>{k.icon}</p>
                <p style={{ fontSize: '16px', fontWeight: '800', color: k.alert ? THEME.danger : THEME.text, margin: '0 0 2px 0' }}>{k.val}</p>
                <p style={{ fontSize: '10px', color: THEME.textLight, margin: 0 }}>{k.label}</p>
              </div>
            ))}
          </div>

          {/* Historique des notes */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>
              📋 Historique des notes ({vendeur.notes?.length || 0})
            </h4>

            {!vendeur.notes || vendeur.notes.length === 0 ? (
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '20px', textAlign: 'center', color: THEME.textLight, fontSize: '13px' }}>
                Aucune note pour ce vendeur.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...(vendeur.notes || [])].reverse().map(note => (
                  <div key={note.id} style={{ backgroundColor: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '12px 14px', position: 'relative' }}>
                    {/* Confirmation suppression inline */}
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

          {/* Ajouter une note */}
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

        {/* Footer */}
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

// Modale pour changer le mot de passe
function ModaleChangerMotDePasse({ isOpen, vendeur, onCancel, onConfirm }: { 
  isOpen: boolean; 
  vendeur: Vendeur | null; 
  onCancel: () => void;
  onConfirm: (nouveauMotDePasse: string) => void;
}) {
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');

  if (!isOpen || !vendeur) return null;

  const valideMotDePasse = nouveauMotDePasse.length >= 8;
  const confirmationValide = nouveauMotDePasse === confirmation && nouveauMotDePasse.length > 0;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        {/* Header avec gradient */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🔑</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>Changer le mot de passe</p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>{vendeur.nom} · {vendeur.email}</p>
              </div>
            </div>
            <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          
          {/* Infos vendeur */}
          <div style={{ backgroundColor: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>Vendeur</p>
                <p style={{ fontSize: '13px', fontWeight: '700', margin: '2px 0 0 0' }}>{vendeur.nom}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>Boutique</p>
                <p style={{ fontSize: '13px', fontWeight: '700', margin: '2px 0 0 0' }}>{vendeur.nom_boutique}</p>
              </div>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>
              Nouveau mot de passe <span style={{ color: THEME.danger }}>*</span>
            </label>
            <input
              type="password"
              value={nouveauMotDePasse}
              onChange={(e) => setNouveauMotDePasse(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: `2px solid ${nouveauMotDePasse && !valideMotDePasse ? THEME.danger : THEME.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '8px',
                transition: 'border-color 0.2s',
              }}
              placeholder="Entrez le nouveau mot de passe"
            />
            <p style={{
              fontSize: '12px',
              color: nouveauMotDePasse && !valideMotDePasse ? THEME.danger : THEME.textLight,
              margin: '4px 0 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              {nouveauMotDePasse && !valideMotDePasse ? '⚠️' : 'ℹ️'} 
              Le mot de passe doit contenir au moins 8 caractères
            </p>
          </div>

          {/* Confirmation */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>
              Confirmer le nouveau mot de passe <span style={{ color: THEME.danger }}>*</span>
            </label>
            <input
              type="password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: `2px solid ${confirmation && !confirmationValide ? THEME.danger : THEME.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
              placeholder="Confirmez le nouveau mot de passe"
            />
            {confirmation && !confirmationValide && (
              <p style={{ fontSize: '12px', color: THEME.danger, margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ⚠️ Les mots de passe ne correspondent pas
              </p>
            )}
          </div>
        </div>

        {/* Footer avec boutons */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={() => confirmationValide && onConfirm(nouveauMotDePasse)}
            disabled={!confirmationValide}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: confirmationValide ? 'pointer' : 'not-allowed',
              backgroundColor: confirmationValide ? THEME.accent : '#cccccc',
              color: 'white',
            }}>
            {confirmationValide ? '✅ Changer le mot de passe' : 'Changer le mot de passe'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modale pour envoyer un message
function ModaleMessage({ isOpen, vendeur, onCancel, onConfirm }: { 
  isOpen: boolean; 
  vendeur: Vendeur | null; 
  onCancel: () => void;
  onConfirm: (titre: string, message: string) => void;
}) {
  const [titre, setTitre] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('Information');

  if (!isOpen || !vendeur) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        {/* Header avec gradient */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>💬</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>Envoyer un message</p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>À : {vendeur.nom} · {vendeur.email}</p>
              </div>
            </div>
            <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Destinataire */}
          <div style={{ backgroundColor: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>Destinataire</p>
            <p style={{ fontSize: '13px', fontWeight: '700', margin: '2px 0 0 0' }}>{vendeur.nom} — {vendeur.nom_boutique}</p>
          </div>

          {/* Type de notification */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>
              Type de notification
            </label>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {['Information', 'Succès', 'Avertissement', 'Urgent'].map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={type === t}
                    onChange={(e) => setType(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '13px' }}>{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Titre */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>
              Titre <span style={{ color: THEME.danger }}>*</span>
            </label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: `2px solid ${THEME.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
              placeholder="Ex: Information importante concernant votre boutique..."
            />
          </div>

          {/* Message */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>
              Message <span style={{ color: THEME.danger }}>*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: `2px solid ${THEME.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                minHeight: '120px',
                resize: 'vertical' as const,
                fontFamily: 'inherit',
              }}
              placeholder="Rédigez votre message ici..."
            />
          </div>
        </div>

        {/* Footer avec boutons */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={() => titre && message && onConfirm(titre, message)}
            disabled={!titre || !message}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: titre && message ? 'pointer' : 'not-allowed',
              backgroundColor: titre && message ? THEME.accent : '#cccccc',
              color: 'white',
            }}>
            {titre && message ? '✅ Envoyer le message' : 'Envoyer le message'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modale de confirmation avec champ de confirmation
function ModaleConfirmation({ isOpen, type, vendeur, vendeursCount = 0, onConfirm, onCancel }: ModaleConfirmationProps) {
  const [confirmation, setConfirmation] = useState('');
  
  if (!isOpen || !type) return null;

  const isBulk = type.includes('_bulk');
  const isSupprimer = type === 'supprimer' || type === 'supprimer_bulk';
  const isDesactiver = type === 'desactiver' || type === 'desactiver_bulk';
  const isReactiver = type === 'reactiver' || type === 'reactiver_bulk';
  
  const MOT_CONFIRMATION = 'CONFIRMER';
  const confirmationValide = confirmation === MOT_CONFIRMATION;

  const getTitle = () => {
    if (isBulk) {
      if (isSupprimer) return `SUPPRIMER ${vendeursCount} VENDEUR${vendeursCount > 1 ? 'S' : ''}`;
      if (isDesactiver) return `DÉSACTIVER ${vendeursCount} VENDEUR${vendeursCount > 1 ? 'S' : ''}`;
      if (isReactiver) return `RÉACTIVER ${vendeursCount} VENDEUR${vendeursCount > 1 ? 'S' : ''}`;
    } else {
      if (isSupprimer) return 'SUPPRIMER CE VENDEUR';
      if (isDesactiver) return 'DÉSACTIVER CE VENDEUR';
      if (isReactiver) return 'RÉACTIVER CE VENDEUR';
    }
    return '';
  };

  const getWarningMessage = () => {
    if (isBulk) {
      if (isSupprimer) return 'Cette action est irréversible';
      if (isDesactiver) return 'Les vendeurs seront temporairement désactivés';
      if (isReactiver) return 'Les vendeurs seront de nouveau actifs';
    } else {
      if (isSupprimer) return 'Cette action est irréversible';
      if (isDesactiver) return 'Le vendeur sera temporairement désactivé';
      if (isReactiver) return 'Le vendeur sera de nouveau actif';
    }
    return '';
  };

  const getIcon = () => {
    if (isSupprimer) return '🗑️';
    if (isDesactiver) return '⚠️';
    if (isReactiver) return '✅';
    return '📋';
  };

  const getButtonColor = () => {
    if (isSupprimer) return THEME.danger;
    if (isDesactiver) return THEME.warning;
    if (isReactiver) return THEME.success;
    return THEME.accent;
  };

  const getButtonText = () => {
    if (isBulk) {
      if (isSupprimer) return 'Confirmer la suppression';
      if (isDesactiver) return 'Confirmer la désactivation';
      if (isReactiver) return 'Confirmer la réactivation';
    } else {
      if (isSupprimer) return 'Confirmer la suppression';
      if (isDesactiver) return 'Confirmer la désactivation';
      if (isReactiver) return 'Confirmer la réactivation';
    }
    return 'Confirmer';
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        {/* Header avec gradient */}
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

        {/* Contenu scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Informations */}
          <div style={{ backgroundColor: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
            {!isBulk && vendeur && (
              <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: `1px solid ${THEME.border}` }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: THEME.accent, margin: 0 }}>{vendeur.nom}</p>
                <p style={{ fontSize: '12px', color: THEME.textLight, margin: '2px 0 0 0' }}>{vendeur.nom_boutique} · {vendeur.email}</p>
              </div>
            )}
            
            <p style={{ fontSize: '13px', color: THEME.text, margin: 0, lineHeight: '1.6' }}>
              {isSupprimer ? (
                isBulk ? (
                  <>
                    <strong>⚠️ Attention :</strong> Cette action supprimera définitivement :
                    <br />• Tous les produits de ces vendeurs
                    <br />• Toutes les données associées
                    <br />• L'historique des ventes
                  </>
                ) : (
                  <>
                    <strong>⚠️ Assurez-vous</strong> qu'aucune transaction n'est en cours avant de supprimer ce vendeur.
                    <br /><br />
                    <strong>Cette action supprimera définitivement :</strong>
                    <br />• Les {vendeur?.produits} produits du vendeur
                    <br />• Toutes les données associées
                    <br />• L'historique des ventes
                  </>
                )
              ) : isDesactiver ? (
                isBulk ? (
                  <>
                    <strong>⚠️ En désactivant ces vendeurs :</strong>
                    <br />• Tous leurs produits seront mis en brouillon
                    <br />• Ils ne pourront plus se connecter
                    <br />• Vous pourrez les réactiver ultérieurement
                  </>
                ) : (
                  <>
                    <strong>⚠️ En désactivant ce vendeur :</strong>
                    <br />• Tous ses produits ({vendeur?.produits}) seront mis en brouillon
                    <br />• Il ne pourra plus se connecter
                    <br />• Vous pourrez le réactiver ultérieurement
                  </>
                )
              ) : (
                isBulk ? (
                  <>
                    <strong>✅ En réactivant ces vendeurs :</strong>
                    <br />• Tous leurs produits seront de nouveau publiés
                    <br />• Ils pourront se connecter normalement
                    <br />• Ils retrouveront l'accès à leur tableau de bord
                  </>
                ) : (
                  <>
                    <strong>✅ En réactivant ce vendeur :</strong>
                    <br />• Tous ses produits ({vendeur?.produits}) seront de nouveau publiés
                    <br />• Il pourra se connecter normalement
                    <br />• Il retrouvera l'accès à son tableau de bord
                  </>
                )
              )}
            </p>
          </div>

          {/* Champ de confirmation pour la suppression */}
          {isSupprimer && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>
                Tapez <strong style={{ color: THEME.danger }}>{MOT_CONFIRMATION}</strong> pour confirmer :
              </label>
              <input
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
                placeholder={MOT_CONFIRMATION}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: `2px solid ${confirmationValide ? THEME.success : THEME.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  outline: 'none',
                  boxSizing: 'border-box',
                  letterSpacing: '1px',
                  transition: 'border-color 0.2s',
                  fontFamily: 'monospace',
                }}
              />
              {confirmation && !confirmationValide && (
                <p style={{ fontSize: '12px', color: THEME.danger, margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ⚠️ Le texte de confirmation ne correspond pas
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer avec boutons */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isSupprimer && !confirmationValide}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: (isSupprimer && !confirmationValide) ? 'not-allowed' : 'pointer',
              backgroundColor: (isSupprimer && !confirmationValide) ? '#cccccc' : getButtonColor(),
              color: 'white',
            }}>
            {isSupprimer && confirmationValide ? '✅ ' + getButtonText() : getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}

// Composant pour le menu de tri
function MenuTri({ triOption, onTriChange }: { triOption: TriOption; onTriChange: (option: TriOption) => void }) {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const options: { value: TriOption; label: string }[] = [
    { value: 'sellerId-asc', label: 'Seller ID (croissant)' },
    { value: 'nom-asc', label: 'Nom vendeur (A-Z)' },
    { value: 'date-desc', label: 'Date + récentes' },
    { value: 'ventes-asc', label: 'Ventes (croissant)' },
    { value: 'ventes-desc', label: 'Ventes (décroissant)' },
    { value: 'produits-asc', label: 'Produits (croissant)' },
    { value: 'produits-desc', label: 'Produits (décroissant)' },
  ];

  const getLabel = () => {
    const option = options.find(o => o.value === triOption);
    return option ? option.label : 'Trier par';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOuvert(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setMenuOuvert(!menuOuvert)}
        style={{
          backgroundColor: 'white',
          color: THEME.accent,
          border: `2px solid ${THEME.accent}`,
          borderRadius: '8px',
          padding: '9px 18px',
          fontSize: '13px',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        🔽 {getLabel()}
      </button>
      
      {menuOuvert && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: '45px',
          backgroundColor: 'white',
          border: `1px solid ${THEME.border}`,
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          zIndex: 100,
          minWidth: '220px',
        }}>
          <div style={{ padding: '4px 0' }}>
            {options.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  onTriChange(option.value);
                  setMenuOuvert(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 16px',
                  border: 'none',
                  background: triOption === option.value ? THEME.accentLight : 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: THEME.text,
                  fontWeight: triOption === option.value ? '700' : '400',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = triOption === option.value ? THEME.accentLight : 'transparent'}
              >
                {option.label} {triOption === option.value && ' ✓'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modal Signalements ────────────────────────────────────────────────────────
function ModaleSignalements({
  vendeur,
  signalements,
  loading,
  onStatutChange,
  onFermer,
}: {
  vendeur: Vendeur;
  signalements: Signalement[];
  loading: boolean;
  onStatutChange: (id: number, statut: string, noteAdmin?: string) => void;
  onFermer: () => void;
}) {
  const [noteAdmin, setNoteAdmin] = useState<Record<number, string>>({});
  const [expanded, setExpanded] = useState<number | null>(null);

  const nbNouveau = signalements.filter(s => s.statut === 'nouveau').length;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onFermer()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.35)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #7c0000 0%, #dc2626 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🚩</div>
              <div>
                <p style={{ fontSize: '17px', fontWeight: '900', margin: 0 }}>Signalements — {vendeur.nom}</p>
                <p style={{ fontSize: '12px', opacity: 0.8, margin: '3px 0 0 0' }}>🏪 {vendeur.nom_boutique} · {signalements.length} signalement{signalements.length > 1 ? 's' : ''}{nbNouveau > 0 ? ` · ${nbNouveau} nouveau${nbNouveau > 1 ? 'x' : ''}` : ''}</p>
              </div>
            </div>
            <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontSize: '16px', fontWeight: '700' }}>✕</button>
          </div>
        </div>

        {/* Corps */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>⏳ Chargement...</div>
          ) : signalements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Aucun signalement pour ce vendeur.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {signalements.map(s => {
                const cat = CATEGORIES_SIGNALEMENT[s.categorie] ?? CATEGORIES_SIGNALEMENT.autre;
                const st = STATUTS_SIGNALEMENT[s.statut] ?? STATUTS_SIGNALEMENT.nouveau;
                const isExpanded = expanded === s.id;
                const dateStr = new Date(s.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={s.id} style={{ border: `1px solid ${s.statut === 'nouveau' ? '#fecaca' : '#e1e4e8'}`, borderRadius: '12px', overflow: 'hidden', backgroundColor: s.statut === 'nouveau' ? '#fff5f5' : 'white' }}>

                    {/* Ligne principale */}
                    <div style={{ padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

                      {/* Icône catégorie */}
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: cat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                        {cat.icon}
                      </div>

                      {/* Infos principales */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: cat.color }}>{cat.label}</span>
                          <span style={{ fontSize: '11px', backgroundColor: st.bg, color: st.color, padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>{st.label}</span>
                        </div>

                        {/* Signaleur */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', color: '#1a2332', fontWeight: '600' }}>
                            👤 {s.signaleur_nom || 'Anonyme'}
                          </span>
                          <span style={{ fontSize: '11px', backgroundColor: s.signaleur_type === 'acheteur' ? '#eff6ff' : s.signaleur_type === 'vendeur' ? '#f0fdf4' : '#f8fafc', color: s.signaleur_type === 'acheteur' ? '#1d4ed8' : s.signaleur_type === 'vendeur' ? '#15803d' : '#6b7280', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>
                            {s.signaleur_type === 'acheteur' ? '🛒 Acheteur' : s.signaleur_type === 'vendeur' ? '🏪 Vendeur' : '👤 Anonyme'}
                          </span>
                          {s.signaleur_id && (
                            <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>ID: {s.signaleur_id}</span>
                          )}
                          {s.signaleur_email && (
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>{s.signaleur_email}</span>
                          )}
                        </div>

                        {/* Raison */}
                        <p style={{ fontSize: '12px', color: '#374151', margin: '0 0 4px 0', lineHeight: '1.5', backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '8px', borderLeft: `3px solid ${cat.color}` }}>
                          {s.raison}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>🕐 {dateStr}</span>
                          {s.traite_par && (
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>Traité par {s.traite_par}</span>
                          )}
                        </div>
                      </div>

                      {/* Bouton expand actions */}
                      <button onClick={() => setExpanded(isExpanded ? null : s.id)}
                        style={{ padding: '6px 10px', border: `1px solid #e1e4e8`, borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: '#6b7280', flexShrink: 0 }}>
                        {isExpanded ? '▲ Fermer' : '▼ Actions'}
                      </button>
                    </div>

                    {/* Panel actions */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 16px', backgroundColor: '#fafafa' }}>
                        <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>Note admin</p>
                        <textarea
                          value={noteAdmin[s.id] ?? (s.note_admin || '')}
                          onChange={e => setNoteAdmin(prev => ({ ...prev, [s.id]: e.target.value }))}
                          rows={2}
                          placeholder="Ajouter une note interne sur ce signalement..."
                          style={{ width: '100%', border: '1px solid #e1e4e8', borderRadius: '8px', padding: '8px 10px', fontSize: '12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '10px' }}
                        />
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {s.statut !== 'vu' && s.statut !== 'traite' && (
                            <button onClick={() => onStatutChange(s.id, 'vu', noteAdmin[s.id])}
                              style={{ padding: '7px 14px', border: '1px solid #fef08a', borderRadius: '8px', backgroundColor: '#fef9c3', color: '#d97706', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                              👁️ Marquer vu
                            </button>
                          )}
                          {s.statut !== 'traite' && (
                            <button onClick={() => onStatutChange(s.id, 'traite', noteAdmin[s.id])}
                              style={{ padding: '7px 14px', border: '1px solid #86efac', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                              ✅ Marquer traité
                            </button>
                          )}
                          {s.statut !== 'rejete' && (
                            <button onClick={() => onStatutChange(s.id, 'rejete', noteAdmin[s.id])}
                              style={{ padding: '7px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                              ❌ Rejeter
                            </button>
                          )}
                          {noteAdmin[s.id] !== undefined && noteAdmin[s.id] !== (s.note_admin || '') && (
                            <button onClick={() => onStatutChange(s.id, s.statut, noteAdmin[s.id])}
                              style={{ padding: '7px 14px', border: '1px solid #bfdbfe', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                              💾 Sauvegarder note
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #e1e4e8', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onFermer}
            style={{ padding: '10px 20px', border: '1px solid #e1e4e8', borderRadius: '8px', backgroundColor: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// Modale pour changer le statut d'un vendeur
function ModaleChangerStatut({ vendeur, onCancel, onConfirm }: {
  vendeur: Vendeur;
  onCancel: () => void;
  onConfirm: (nouveauStatut: string, raison?: string, gravite?: string, note?: string) => void;
}) {
  const [statutChoisi, setStatutChoisi] = useState('');
  const [raisonSuspension, setRaisonSuspension] = useState('');
  const [gravite, setGravite] = useState<'faible' | 'moyenne' | 'grave'>('faible');
  const [noteStatut, setNoteStatut] = useState('');

  const statuts = [
    { value: 'actif',    label: '✅ Actif',       desc: 'Accès complet au tableau de bord',       bg: '#dcfce7', color: '#16a34a' },
    { value: 'pending',  label: '⏳ En attente',   desc: "En attente d'approbation admin",          bg: '#fef9c3', color: '#d97706' },
    { value: 'suspendu', label: '🔒 Suspendu',     desc: 'Accès temporairement bloqué',            bg: '#ffedd5', color: '#ea580c' },
    { value: 'rejected', label: '❌ Refusé',       desc: "Demande d'inscription refusée",           bg: '#fee2e2', color: '#dc2626' },
    { value: 'banni',    label: '🚫 Banni',        desc: 'Banni définitivement de la plateforme',  bg: '#f3e8ff', color: '#7c3aed' },
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
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>{vendeur.nom} · {vendeur.nom_boutique}</p>
              </div>
            </div>
            <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sélectionner le nouveau statut</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {statuts.map(s => {
              const isActuel = vendeur.statut === s.value || (vendeur.statut === 'en_attente' && s.value === 'pending');
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

        {/* Champs supplémentaires si suspendu ou banni */}
        {(statutChoisi === 'suspendu' || statutChoisi === 'banni') && (
          <div style={{ padding: '0 24px 20px' }}>
            <div style={{ backgroundColor: '#fff9db', border: '1px solid #f59e0b', borderRadius: '10px', padding: '16px' }}>
              <p style={{ fontSize: '12px', fontWeight: '800', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 14px 0' }}>
                ⚠️ Informations de {statutChoisi === 'suspendu' ? 'suspension' : 'bannissement'}
              </p>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Raison <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select value={raisonSuspension} onChange={e => setRaisonSuspension(e.target.value)}
                  style={{ width: '100%', border: '1px solid #e1e4e8', borderRadius: '8px', padding: '8px 10px', fontSize: '12px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box' as const }}>
                  <option value="">— Sélectionner une raison —</option>
                  <option value="activite_suspecte">🚨 Activité suspecte</option>
                  <option value="violation_politique">⚠️ Violation de politique</option>
                  <option value="paiement_echec">💳 Paiement échoué</option>
                  <option value="signalement_client">🚩 Signalements clients répétés</option>
                  <option value="fraude">🔒 Fraude détectée</option>
                  <option value="inactif">💤 Compte inactif prolongé</option>
                  <option value="autre">📋 Autre raison</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Gravité</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['faible', 'moyenne', 'grave'] as const).map(g => (
                    <button key={g} onClick={() => setGravite(g)}
                      style={{ flex: 1, padding: '8px', border: `2px solid ${gravite === g ? (g === 'grave' ? '#dc2626' : g === 'moyenne' ? '#d97706' : '#6b7280') : '#e1e4e8'}`, borderRadius: '8px', backgroundColor: gravite === g ? (g === 'grave' ? '#fee2e2' : g === 'moyenne' ? '#fef9c3' : '#f3f4f6') : 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: g === 'grave' ? '#dc2626' : g === 'moyenne' ? '#d97706' : '#6b7280' }}>
                      {g === 'faible' ? '⬜ Faible' : g === 'moyenne' ? '🟡 Moyenne' : '🔴 Grave'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Note (optionnel)</label>
                <textarea value={noteStatut} onChange={e => setNoteStatut(e.target.value)} rows={2}
                  placeholder="Détails supplémentaires sur la décision..."
                  style={{ width: '100%', border: '1px solid #e1e4e8', borderRadius: '8px', padding: '8px 10px', fontSize: '12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const, fontFamily: 'inherit' }} />
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: '14px 24px', borderTop: '1px solid #e1e4e8', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', border: '1px solid #e1e4e8', borderRadius: '8px', backgroundColor: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Annuler</button>
          <button
            onClick={() => {
              if (!statutChoisi) return;
              if ((statutChoisi === 'suspendu' || statutChoisi === 'banni') && !raisonSuspension) return;
              onConfirm(statutChoisi, raisonSuspension, gravite, noteStatut);
            }}
            disabled={!statutChoisi || ((statutChoisi === 'suspendu' || statutChoisi === 'banni') && !raisonSuspension)}
            style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: (statutChoisi && !((statutChoisi === 'suspendu' || statutChoisi === 'banni') && !raisonSuspension)) ? 'pointer' : 'not-allowed', backgroundColor: (statutChoisi && !((statutChoisi === 'suspendu' || statutChoisi === 'banni') && !raisonSuspension)) ? '#2d6a9f' : '#cccccc', color: 'white' }}>
            {statutChoisi ? '✅ Confirmer le changement' : 'Confirmer le changement'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ListeVendeurs({ onImpersonate, onNaviguerVers, vendeurs: vendeursFromProps, onStatutChange }: ListeVendeursProps) {
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [triOption, setTriOption] = useState<TriOption>('sellerId-asc');
  const [menuOuvert, setMenuOuvert] = useState<number | null>(null);
  const [menuActionGroupesOuvert, setMenuActionGroupesOuvert] = useState(false);
  const [vendeurs, setVendeurs] = useState<Vendeur[]>(() => {
    // Assurer que chaque vendeur a un sellerId correct basé sur son ID
    return vendeursFromProps.map(v => ({
      ...v,
      sellerId: v.sellerId || `VEN-2026-${String(v.id).padStart(3, '0')}`
    }));
  });
  const [vendeursSelectionnes, setVendeursSelectionnes] = useState<number[]>([]);
  const [vendeurNotes, setVendeurNotes] = useState<Vendeur | null>(null);
  const [vendeurSignalements, setVendeurSignalements] = useState<{ vendeur: Vendeur; signalements: Signalement[]; loading: boolean } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [modaleChangerStatut, setModaleChangerStatut] = useState<{ isOpen: boolean; vendeur: Vendeur | null }>({ isOpen: false, vendeur: null });
  const [modaleChangementMdp, setModaleChangementMdp] = useState<{
    isOpen: boolean;
    vendeur: Vendeur | null;
  }>({
    isOpen: false,
    vendeur: null,
  });
  const [modaleMessage, setModaleMessage] = useState<{
    isOpen: boolean;
    vendeur: Vendeur | null;
  }>({
    isOpen: false,
    vendeur: null,
  });
  const [modaleConfirmation, setModaleConfirmation] = useState<{
    isOpen: boolean;
    type: ActionType;
    vendeur: Vendeur | null;
    vendeursCount?: number;
  }>({
    isOpen: false,
    type: null,
    vendeur: null,
  });

  const menuActionRef = useRef<HTMLDivElement>(null);
  const menuTroisPointsRef = useRef<Map<number, HTMLDivElement>>(new Map());

  // Sync depuis les props (quand AppAdmin recharge) et assurer le sellerId
  useEffect(() => {
    setVendeurs(vendeursFromProps.map(v => ({
      ...v,
      sellerId: v.sellerId || `VEN-2026-${String(v.id).padStart(3, '0')}`
    })));
  }, [vendeursFromProps]);

  // Filtrer et trier les vendeurs
  const filtresEtTries = useMemo(() => {
    // D'abord filtrer
    let result = vendeurs.filter(v => {
      const matchRecherche = v.nom.toLowerCase().includes(recherche.toLowerCase()) || 
                            v.email.toLowerCase().includes(recherche.toLowerCase()) || 
                            v.nom_boutique.toLowerCase().includes(recherche.toLowerCase()) ||
                            v.sellerId.toLowerCase().includes(recherche.toLowerCase());
      const matchStatut = filtreStatut === 'tous'
        ? true
        : filtreStatut === 'signalement'
          ? (v.nbSignalements || 0) > 0
          : v.statut === filtreStatut;
      return matchRecherche && matchStatut;
    });

    // Ensuite trier
    result = [...result].sort((a, b) => {
      switch(triOption) {
        case 'sellerId-asc':
          return a.sellerId.localeCompare(b.sellerId);
        case 'nom-asc':
          return a.nom.localeCompare(b.nom);
        case 'date-desc':
          return new Date(b.dateInscription).getTime() - new Date(a.dateInscription).getTime();
        case 'ventes-asc':
          return a.totalVentes - b.totalVentes;
        case 'ventes-desc':
          return b.totalVentes - a.totalVentes;
        case 'produits-asc':
          return a.produits - b.produits;
        case 'produits-desc':
          return b.produits - a.produits;
        default:
          return 0;
      }
    });

    return result;
  }, [recherche, filtreStatut, triOption, vendeurs]);

  const getStatutStyle = (statut: string) => {
    switch(statut) {
      case 'actif':
        return { bg: '#dcfce7', color: THEME.success, text: '✅ Actif' };
      case 'suspendu':
        return { bg: '#ffedd5', color: THEME.orange, text: '🔒 Suspendu' };
      case 'en_attente':
      case 'pending':
        return { bg: '#fef9c3', color: THEME.warning, text: '⏳ En attente' };
      case 'rejected':
        return { bg: '#fee2e2', color: THEME.danger, text: '❌ Refusé' };
      case 'banni':
        return { bg: '#f3e8ff', color: THEME.purple, text: '🚫 Banni' };
      default:
        return { bg: '#f3f4f6', color: THEME.textLight, text: statut };
    }
  };

  const handleSelectionVendeur = (vendeurId: number) => {
    setVendeursSelectionnes(prev => 
      prev.includes(vendeurId) 
        ? prev.filter(id => id !== vendeurId)
        : [...prev, vendeurId]
    );
  };

  const handleSelectionTous = () => {
    if (vendeursSelectionnes.length === filtresEtTries.length) {
      setVendeursSelectionnes([]);
    } else {
      setVendeursSelectionnes(filtresEtTries.map(v => v.id));
    }
  };

  const handleOuvrirNotes = async (vendeur: Vendeur) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://evend-multivendeur-api.onrender.com/api/vendeurs/${vendeur.id}/notes`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur chargement notes');
      const data = await res.json();
      const notes: NoteInterne[] = data.map((n: any) => ({
        id: n.id,
        date: n.date || new Date(n.date_creation).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }),
        auteur: n.auteur || 'Admin',
        contenu: n.contenu,
      }));
      setVendeurNotes({ ...vendeur, notes });
      setVendeurs(prev => prev.map(v => v.id === vendeur.id ? { ...v, notes } : v));
    } catch {
      setVendeurNotes(vendeur);
    }
  };

  const handleAjouterNote = async (vendeur: Vendeur, contenu: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://evend-multivendeur-api.onrender.com/api/vendeurs/${vendeur.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ contenu, auteur: 'Admin', type: 'admin' }),
      });
      if (!res.ok) throw new Error('Erreur ajout note');
      const saved = await res.json();
      const nouvelleNote: NoteInterne = {
        id: saved.id,
        date: new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }),
        auteur: 'Admin',
        contenu,
      };
      setVendeurs(prev => prev.map(v =>
        v.id === vendeur.id ? { ...v, notes: [...(v.notes || []), nouvelleNote] } : v
      ));
      setVendeurNotes(prev => prev ? { ...prev, notes: [...(prev.notes || []), nouvelleNote] } : prev);
      showToast('📋 Note enregistrée', 'success');
    } catch {
      showToast("❌ Erreur lors de l'enregistrement de la note", 'error');
    }
  };

  const handleSupprimerNote = async (vendeur: Vendeur, noteId: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://evend-multivendeur-api.onrender.com/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur suppression');
      setVendeurs(prev => prev.map(v =>
        v.id === vendeur.id ? { ...v, notes: (v.notes || []).filter(n => n.id !== noteId) } : v
      ));
      setVendeurNotes(prev => prev ? { ...prev, notes: (prev.notes || []).filter(n => n.id !== noteId) } : prev);
      showToast('🗑️ Note supprimée', 'success');
    } catch {
      showToast('❌ Erreur lors de la suppression de la note', 'error');
    }
  };

  const handleOuvrirSignalements = async (vendeur: Vendeur) => {
    setVendeurSignalements({ vendeur, signalements: [], loading: true });
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://evend-multivendeur-api.onrender.com/api/vendeurs/${vendeur.id}/signalements`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur chargement signalements');
      const data: Signalement[] = await res.json();
      setVendeurSignalements({ vendeur, signalements: data, loading: false });
      // Marquer les "nouveaux" comme "vu" automatiquement
      data.filter(s => s.statut === 'nouveau').forEach(s => {
        fetch(`https://evend-multivendeur-api.onrender.com/api/signalements/${s.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ statut: 'vu' }),
        }).catch(() => {});
      });
      // Mettre à jour le compteur dans la liste
      setVendeurs(prev => prev.map(v => v.id === vendeur.id ? { ...v, nbSignalements: data.length } : v));
    } catch {
      setVendeurSignalements(prev => prev ? { ...prev, loading: false } : null);
      showToast('❌ Erreur chargement signalements', 'error');
    }
  };

  const handleStatutSignalement = async (signalementId: number, statut: string, noteAdmin?: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://evend-multivendeur-api.onrender.com/api/signalements/${signalementId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ statut, note_admin: noteAdmin }),
      });
      if (!res.ok) throw new Error('Erreur mise à jour');
      const data = await res.json();
      setVendeurSignalements(prev => prev ? {
        ...prev,
        signalements: prev.signalements.map(s => s.id === signalementId ? { ...s, ...data.signalement } : s),
      } : null);
      showToast('✅ Signalement mis à jour', 'success');
    } catch {
      showToast('❌ Erreur mise à jour signalement', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAction = (action: string, vendeur: Vendeur) => {
    setMenuOuvert(null);
    
    switch(action) {
      case 'notes':
        handleOuvrirNotes(vendeur);
        break;
      case 'voir':
        onNaviguerVers?.('boutique', { vendeurId: vendeur.id });
        break;
      case 'message':
        setModaleMessage({
          isOpen: true,
          vendeur: vendeur,
        });
        break;
      case 'changer-mot-de-passe':
        setModaleChangementMdp({
          isOpen: true,
          vendeur: vendeur,
        });
        break;
      case 'reactiver':
        setModaleConfirmation({
          isOpen: true,
          type: 'reactiver',
          vendeur: vendeur,
        });
        break;
      case 'desactiver':
        setModaleConfirmation({
          isOpen: true,
          type: 'desactiver',
          vendeur: vendeur,
        });
        break;
      case 'supprimer':
        setModaleConfirmation({
          isOpen: true,
          type: 'supprimer',
          vendeur: vendeur,
        });
        break;
      case 'toggle-f2a':
        handleToggleF2A(vendeur);
        break;
      default:
        break;
    }
  };

  const handleActionGroupes = (action: string) => {
    setMenuActionGroupesOuvert(false);
    
    if (vendeursSelectionnes.length === 0) return;
    
    switch(action) {
      case 'desactiver':
        setModaleConfirmation({
          isOpen: true,
          type: 'desactiver_bulk',
          vendeur: null,
          vendeursCount: vendeursSelectionnes.length,
        });
        break;
      case 'reactiver':
        setModaleConfirmation({
          isOpen: true,
          type: 'reactiver_bulk',
          vendeur: null,
          vendeursCount: vendeursSelectionnes.length,
        });
        break;
      case 'supprimer':
        setModaleConfirmation({
          isOpen: true,
          type: 'supprimer_bulk',
          vendeur: null,
          vendeursCount: vendeursSelectionnes.length,
        });
        break;
      default:
        break;
    }
  };

  const handleConfirmation = () => {
    if (modaleConfirmation.type) {
      const type = modaleConfirmation.type;
      const isBulk = type.includes('_bulk');
      
      if (isBulk) {
        // Traitement pour les actions groupées
        setVendeurs(prevVendeurs => 
          prevVendeurs.map(v => {
            if (vendeursSelectionnes.includes(v.id)) {
              if (type === 'supprimer_bulk') {
                return null as any;
              }
              if (type === 'desactiver_bulk') {
                return { ...v, statut: 'suspendu' as const };
              }
              if (type === 'reactiver_bulk') {
                return { ...v, statut: 'actif' as const };
              }
            }
            return v;
          }).filter(Boolean) as Vendeur[]
        );
        setVendeursSelectionnes([]);
        showToast('✅ Action groupée effectuée avec succès', 'success');
      } else {
        // Changement individuel - APPEL API
        if (modaleConfirmation.vendeur) {
          const vendeurId = modaleConfirmation.vendeur.id;
          const token = localStorage.getItem('token');
          let nouveauStatut = '';
          
          if (type === 'desactiver') {
            nouveauStatut = 'suspendu';
          } else if (type === 'reactiver') {
            nouveauStatut = 'actif';
          }
          
          if (type === 'supprimer') {
            // Suppression
            fetch(`https://evend-multivendeur-api.onrender.com/api/vendeurs/${vendeurId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            })
              .then(res => {
                if (res.ok) {
                  setVendeurs(prev => prev.filter(v => v.id !== vendeurId));
                  setToast({ message: '✅ Vendeur supprimé avec succès', type: 'success' });
                } else {
                  setToast({ message: '❌ Erreur lors de la suppression', type: 'error' });
                }
                setTimeout(() => setToast(null), 3500);
              })
              .catch(() => {
                showToast('❌ Erreur lors de la suppression', 'error');
              });
          } else {
            // Changement de statut (activer/désactiver)
            fetch(`https://evend-multivendeur-api.onrender.com/api/vendeurs/${vendeurId}/statut`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ statut: nouveauStatut }),
            })
              .then(res => {
                if (res.ok) {
                  setVendeurs(prev => prev.map(v => 
                    v.id === vendeurId ? { ...v, statut: nouveauStatut as any } : v
                  ));
                  onStatutChange?.(vendeurId, nouveauStatut);
                  setToast({ message: `✅ Statut changé avec succès`, type: 'success' });
                } else {
                  setToast({ message: `❌ Erreur — le statut n'a pas pu être modifié`, type: 'error' });
                }
                setTimeout(() => setToast(null), 3500);
              })
              .catch(() => {
                setToast({ message: `❌ Erreur — le statut n'a pas pu être modifié`, type: 'error' });
                setTimeout(() => setToast(null), 3500);
              });
          }
        }
      }
    }
    
    setModaleConfirmation({ isOpen: false, type: null, vendeur: null });
  };

  const handleChangementMotDePasse = async (nouveauMotDePasse: string) => {
    const vendeur = modaleChangementMdp.vendeur;
    if (!vendeur) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://evend-multivendeur-api.onrender.com/api/vendeurs/${vendeur.id}/mot-de-passe`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nouveau_mot_de_passe: nouveauMotDePasse }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur serveur');
      setModaleChangementMdp({ isOpen: false, vendeur: null });
      // Vider la recherche pour éviter l'autocomplete du navigateur qui filtre tout
      setRecherche('');
      showToast(`✅ Mot de passe de ${vendeur.nom} modifié avec succès`, 'success');
    } catch (err: any) {
      setModaleChangementMdp({ isOpen: false, vendeur: null });
      setRecherche('');
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  const handleEnvoyerMessage = (titre: string, message: string) => {
    console.log('Message envoyé à', modaleMessage.vendeur?.email, ':', titre, message);
    setModaleMessage({ isOpen: false, vendeur: null });
  };

  const handleToggleF2A = async (vendeur: Vendeur) => {
    const token = localStorage.getItem('token');
    const nouvelEtat = !vendeur.twoFactorEnabled;
    try {
      const res = await fetch(`https://evend-multivendeur-api.onrender.com/api/vendeurs/${vendeur.id}/2fa`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ enabled: nouvelEtat }),
      });
      if (!res.ok) throw new Error('Erreur serveur');
      setVendeurs(prev => prev.map(v =>
        v.id === vendeur.id ? { ...v, twoFactorEnabled: nouvelEtat } : v
      ));
      showToast(
        nouvelEtat
          ? `🔐 F2A activée pour ${vendeur.nom}`
          : `🔓 F2A désactivée pour ${vendeur.nom}`,
        'success'
      );
    } catch {
      showToast(`❌ Erreur lors de la modification de la F2A`, 'error');
    }
  };

  const handleAnnulation = () => {
    setModaleConfirmation({ isOpen: false, type: null, vendeur: null });
  };

  const handleExportCSV = () => {
    const headers = ['Seller ID', 'Nom', 'Email', 'Boutique', 'Plan', 'Ventes', 'Commission', 'Produits', 'Statut'];
    const csvData = filtresEtTries.map(v => [
      v.sellerId,
      v.nom,
      v.email,
      v.nom_boutique,
      v.plan,
      v.totalVentes.toFixed(2),
      v.commission.toFixed(2),
      v.produits.toString(),
      v.statut
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'vendeurs.csv');
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
    setTimeout(() => {
      document.head.removeChild(style);
    }, 100);
  };

  const handleCreerVendeur = () => {
    if (onNaviguerVers) {
      onNaviguerVers('vendeurs-creer');
    }
  };

  const setMenuRef = (id: number) => (element: HTMLDivElement | null) => {
    if (element) {
      menuTroisPointsRef.current.set(id, element);
    } else {
      menuTroisPointsRef.current.delete(id);
    }
  };

  const getMenuPosition = (vendeurId: number) => {
    const element = menuTroisPointsRef.current.get(vendeurId);
    if (!element) return { left: 0, top: 0 };
    
    const rect = element.getBoundingClientRect();
    const menuWidth = 200;
    const left = rect.left - menuWidth - 10;
    
    const finalLeft = left < 10 ? 10 : left;
    
    return {
      left: finalLeft,
      top: rect.top + 35,
    };
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuOuvert !== null) {
        const menuElement = menuTroisPointsRef.current.get(menuOuvert);
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setMenuOuvert(null);
        }
      }
      
      if (menuActionRef.current && !menuActionRef.current.contains(event.target as Node)) {
        setMenuActionGroupesOuvert(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOuvert]);

  const totalVendeurs = vendeurs.length;

  return (
    <>
      <div style={{ padding: '28px 32px', width: '100%', boxSizing: 'border-box' as const }}>
        {/* En-tête avec boutons et compteur */}
        <div style={{ 
          marginBottom: '24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          width: '100%'
        }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase' }}>
              Gestion des vendeurs
            </h1>
            <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
              {vendeurs.length} vendeurs inscrits
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Compteur total */}
            <div style={{
              backgroundColor: THEME.accentLight,
              padding: '8px 16px',
              borderRadius: '20px',
              border: `1px solid ${THEME.accent}`,
            }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: THEME.accent }}>
                📊 Total: {totalVendeurs} vendeurs
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }} className="no-print">
              <button
                onClick={handleExportCSV}
                style={{
                  backgroundColor: 'white',
                  color: THEME.accent,
                  border: `2px solid ${THEME.accent}`,
                  borderRadius: '8px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                📊 Exporter CSV
              </button>
              <button
                onClick={handleImprimer}
                style={{
                  backgroundColor: 'white',
                  color: THEME.accent,
                  border: `2px solid ${THEME.accent}`,
                  borderRadius: '8px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                🖨️ Imprimer
              </button>
            </div>
          </div>
        </div>

        {/* Barre d'outils */}
        <div className="no-print" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' as const, alignItems: 'center', width: '100%' }}>
          <input
            type="text"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="🔍 Rechercher un vendeur..."
            autoComplete="off"
            name="recherche-vendeur"
            style={{
              border: `1px solid ${THEME.border}`,
              borderRadius: '8px',
              padding: '9px 14px',
              fontSize: '13px',
              outline: 'none',
              width: '260px'
            }}
          />
          
          {[
            { val: 'tous',        label: 'Tous' },
            { val: 'actif',       label: '✅ Actifs' },
            { val: 'pending',     label: '⏳ En attente' },
            { val: 'suspendu',    label: '🔒 Suspendus' },
            { val: 'rejected',    label: '❌ Refusés' },
            { val: 'banni',       label: '🚫 Bannis' },
            { val: 'signalement', label: '🚩 Signalés' },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setFiltreStatut(val)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                border: `2px solid ${filtreStatut === val ? (val === 'signalement' ? '#dc2626' : THEME.accent) : THEME.border}`,
                backgroundColor: filtreStatut === val ? (val === 'signalement' ? '#fee2e2' : THEME.accentLight) : 'white',
                color: filtreStatut === val ? (val === 'signalement' ? '#dc2626' : THEME.accent) : THEME.textLight,
              }}
            >
              {label}
            </button>
          ))}

          {/* Menu Tri */}
          <MenuTri triOption={triOption} onTriChange={setTriOption} />

          {/* Menu d'actions groupées */}
          <div style={{ position: 'relative', marginLeft: 'auto' }} ref={menuActionRef}>
            <button
              onClick={() => vendeursSelectionnes.length > 0 && setMenuActionGroupesOuvert(!menuActionGroupesOuvert)}
              style={{
                backgroundColor: vendeursSelectionnes.length > 0 ? THEME.accent : '#f0f0f0',
                color: vendeursSelectionnes.length > 0 ? 'white' : THEME.textLight,
                border: 'none',
                borderRadius: '8px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: vendeursSelectionnes.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              disabled={vendeursSelectionnes.length === 0}
            >
              Actions ({vendeursSelectionnes.length}) ▼
            </button>
            
            {menuActionGroupesOuvert && vendeursSelectionnes.length > 0 && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '45px',
                backgroundColor: 'white',
                border: `1px solid ${THEME.border}`,
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                zIndex: 100,
                minWidth: '180px',
              }}>
                <div style={{ padding: '4px 0' }}>
                  <MenuItem 
                    onClick={() => handleActionGroupes('desactiver')}
                    style={{ color: THEME.warning }}
                  >
                    Désactiver
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleActionGroupes('reactiver')}
                    style={{ color: THEME.success }}
                  >
                    Réactiver
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleActionGroupes('supprimer')}
                    style={{ color: THEME.danger }}
                  >
                    Supprimer
                  </MenuItem>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleCreerVendeur}
            style={{
              backgroundColor: THEME.accent,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            + Créer un vendeur
          </button>
        </div>

        {/* Tableau des vendeurs */}
        <div className="print-table" style={{ 
          backgroundColor: THEME.card, 
          borderRadius: '12px', 
          border: `1px solid ${THEME.border}`, 
          overflow: 'auto', 
          maxHeight: 'calc(100vh - 250px)',
          width: '100%',
          boxSizing: 'border-box' as const,
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 5 }}>
              <tr style={{ borderBottom: `2px solid ${THEME.accent}` }}>
                <th style={{ padding: '13px 8px', width: '40px', textAlign: 'center' }} className="no-print">
                  <input
                    type="checkbox"
                    checked={vendeursSelectionnes.length === filtresEtTries.length && filtresEtTries.length > 0}
                    onChange={handleSelectionTous}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  Seller ID
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  Vendeur
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  E-mail
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  Plan
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  Ventes
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  Comm.
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  Prod.
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  Statut
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }} className="no-print">
                  F2A
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#dc2626', textTransform: 'uppercase' }} className="no-print">
                  🚩 Signalements
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }} className="no-print">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtresEtTries.map((v, i) => {
                const statutStyle = getStatutStyle(v.statut);
                const isSelected = vendeursSelectionnes.includes(v.id);
                const menuPosition = getMenuPosition(v.id);
                const nbNotes = v.notes?.length || 0;
                
                return (
                  <tr 
                    key={v.id} 
                    style={{ 
                      borderBottom: `1px solid #f5f5f5`, 
                      backgroundColor: isSelected ? THEME.accentLight : (i % 2 === 0 ? 'white' : '#fafafa'),
                    }}
                  >
                    <td style={{ padding: '14px 8px', textAlign: 'center' }} className="no-print">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectionVendeur(v.id)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', fontFamily: 'monospace', fontSize: '12px', fontWeight: '600' }}>
                      {v.sellerId}
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: THEME.accent + '20',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '800',
                          color: THEME.accent,
                          flexShrink: 0,
                        }} className="no-print">
                          {v.nom.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: 0 }}>{v.nom}</p>
                          <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }} className="no-print">{v.nom_boutique}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '12px' }}>{v.email}</span>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>{v.plan}</span>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: THEME.success }}>
                        {v.totalVentes.toFixed(2)} $
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: THEME.accent }}>
                        {v.commission.toFixed(2)} $
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '12px' }}>{v.produits}</span>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <span className="statut-badge" style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '4px 8px',
                        borderRadius: '20px',
                        backgroundColor: statutStyle.bg,
                        color: statutStyle.color,
                        whiteSpace: 'nowrap' as const,
                      }}>
                        {statutStyle.text}
                      </span>
                    </td>
                    {/* Cellule F2A */}
                    <td style={{ padding: '14px 8px', textAlign: 'center' }} className="no-print">
                      {v.twoFactorEnabled ? (
                        <span title="F2A activée" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '15px', fontWeight: '900' }}>✓</span>
                      ) : (
                        <span title="F2A non activée" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#fff3e0', color: '#ea580c', fontSize: '15px', fontWeight: '900' }}>✕</span>
                      )}
                    </td>
                    {/* Cellule signalements */}
                    <td style={{ padding: '14px 8px', textAlign: 'center' }} className="no-print">
                      {(v.nbSignalements || 0) > 0 ? (
                        <button
                          onClick={() => handleOuvrirSignalements(v)}
                          style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' as const }}
                          title="Voir les signalements">
                          🚩 {v.nbSignalements}
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#d1d5db' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 8px', textAlign: 'center' }} className="no-print">
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Bouton Notes */}
                        <button
                          onClick={() => handleAction('notes', v)}
                          style={{
                            backgroundColor: THEME.accentLight,
                            color: THEME.accent,
                            border: `1px solid #bfdbfe`,
                            borderRadius: '6px',
                            padding: '5px 8px',
                            fontSize: '14px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            position: 'relative' as const,
                            minWidth: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Notes internes"
                        >
                          📋
                          {nbNotes > 0 && (
                            <span style={{
                              position: 'absolute',
                              top: '-4px',
                              right: '-4px',
                              backgroundColor: THEME.accent,
                              color: 'white',
                              fontSize: '9px',
                              fontWeight: '800',
                              padding: '1px 4px',
                              borderRadius: '8px',
                              minWidth: '14px',
                              textAlign: 'center',
                            }}>
                              {nbNotes}
                            </span>
                          )}
                        </button>

                        {/* Bouton Accéder */}
                        <button
                          onClick={() => onImpersonate(v)}
                          style={{
                            backgroundColor: THEME.accent,
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap' as const,
                            minWidth: '60px',
                          }}
                        >
                          👤 Accéder
                        </button>

                        {/* Menu 3 points */}
                        <div
                          ref={setMenuRef(v.id)}
                          style={{ position: 'relative' }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOuvert(menuOuvert === v.id ? null : v.id);
                            }}
                            style={{
                              background: '#f0f0f0',
                              border: `1px solid ${THEME.border}`,
                              cursor: 'pointer',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: THEME.text,
                              fontSize: '16px',
                              fontWeight: '800',
                              lineHeight: 1,
                              minWidth: '36px',
                            }}
                          >
                            ⋮
                          </button>
                          
                          {menuOuvert === v.id && (
                            <div
                              style={{
                                position: 'fixed',
                                left: menuPosition.left,
                                top: menuPosition.top,
                                backgroundColor: 'white',
                                border: `1px solid ${THEME.border}`,
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                zIndex: 1000,
                                width: '200px',
                              }}
                            >
                              <div style={{ padding: '4px 0' }}>
                                <MenuItem onClick={() => handleAction('voir', v)}>
                                  👁️ Voir boutique
                                </MenuItem>
                                <MenuItem onClick={() => handleAction('message', v)}>
                                  💬 Message
                                </MenuItem>
                                <MenuItem onClick={() => handleAction('changer-mot-de-passe', v)}>
                                  🔑 Changer le mot de passe
                                </MenuItem>
                                <MenuItem
                                  onClick={() => handleAction('toggle-f2a', v)}
                                  style={{ color: v.twoFactorEnabled ? THEME.warning : THEME.success }}
                                >
                                  {v.twoFactorEnabled ? '🔓 Désactiver la F2A de ce vendeur' : '🔐 Activer la F2A de ce vendeur'}
                                </MenuItem>
                                
                                <div style={{ height: '1px', backgroundColor: THEME.border, margin: '4px 0' }} />

                                <div style={{ padding: '4px 14px 6px' }}>
                                  <p style={{ fontSize: '10px', color: THEME.textLight, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Statut actuel</p>
                                  <span style={{
                                    fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px',
                                    backgroundColor: getStatutStyle(v.statut).bg,
                                    color: getStatutStyle(v.statut).color,
                                  }}>{getStatutStyle(v.statut).text}</span>
                                </div>

                                <MenuItem
                                  onClick={() => { 
                                    setMenuOuvert(null); 
                                    setModaleChangerStatut({ isOpen: true, vendeur: v }); 
                                  }}
                                  style={{ color: THEME.accent }}
                                >
                                  🔄 Changer le statut
                                </MenuItem>
                                
                                <div style={{ height: '1px', backgroundColor: THEME.border, margin: '4px 0' }} />
                                
                                <MenuItem 
                                  onClick={() => handleAction('supprimer', v)}
                                  style={{ color: THEME.danger }}
                                >
                                  🗑️ Supprimer
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

          {filtresEtTries.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: THEME.textLight }}>
              Aucun vendeur trouvé
            </div>
          )}
        </div>
      </div>

      {/* Modale de notes internes */}
      {vendeurNotes && (
        <ModalNotes
          vendeur={vendeurNotes}
          onAjouterNote={(contenu) => handleAjouterNote(vendeurNotes, contenu)}
          onSupprimerNote={(noteId) => handleSupprimerNote(vendeurNotes, noteId)}
          onFermer={() => setVendeurNotes(null)}
        />
      )}

      {/* Modale de message */}
      <ModaleMessage
        isOpen={modaleMessage.isOpen}
        vendeur={modaleMessage.vendeur}
        onCancel={() => setModaleMessage({ isOpen: false, vendeur: null })}
        onConfirm={handleEnvoyerMessage}
      />

      {/* Modale de changement de mot de passe */}
      <ModaleChangerMotDePasse
        isOpen={modaleChangementMdp.isOpen}
        vendeur={modaleChangementMdp.vendeur}
        onCancel={() => setModaleChangementMdp({ isOpen: false, vendeur: null })}
        onConfirm={handleChangementMotDePasse}
      />

      {/* Modale de confirmation */}
      <ModaleConfirmation
        isOpen={modaleConfirmation.isOpen}
        type={modaleConfirmation.type}
        vendeur={modaleConfirmation.vendeur}
        vendeursCount={modaleConfirmation.vendeursCount}
        onConfirm={handleConfirmation}
        onCancel={handleAnnulation}
      />

      {/* Modale changer statut */}
      {modaleChangerStatut.isOpen && modaleChangerStatut.vendeur && (
        <ModaleChangerStatut
          vendeur={modaleChangerStatut.vendeur}
          onCancel={() => setModaleChangerStatut({ isOpen: false, vendeur: null })}
          onConfirm={(nouveauStatut, raison, gravite, note) => {
            const vendeurCible = modaleChangerStatut.vendeur!;
            setModaleChangerStatut({ isOpen: false, vendeur: null });
            const token = localStorage.getItem('token');

            // Appel API direct avec raison/gravité
            fetch(`https://evend-multivendeur-api.onrender.com/api/vendeurs/${vendeurCible.id}/statut`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ statut: nouveauStatut, raison_suspension: raison, gravite, note_admin: note }),
            })
              .then(res => res.ok ? res.json() : Promise.reject('Erreur'))
              .then(() => {
                setVendeurs(prev => prev.map(v =>
                  v.id === vendeurCible.id
                    ? { ...v, statut: nouveauStatut as any, gravite: gravite as any }
                    : v
                ));
                onStatutChange?.(vendeurCible.id, nouveauStatut);
                showToast(`✅ Statut changé → ${nouveauStatut}`, 'success');
              })
              .catch(() => showToast('❌ Erreur lors du changement de statut', 'error'));
          }}
        />
      )}

      {/* Modale Signalements */}
      {vendeurSignalements && (
        <ModaleSignalements
          vendeur={vendeurSignalements.vendeur}
          signalements={vendeurSignalements.signalements}
          loading={vendeurSignalements.loading}
          onStatutChange={handleStatutSignalement}
          onFermer={() => setVendeurSignalements(null)}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999,
          backgroundColor: toast.type === 'success' ? '#16a34a' : '#dc2626',
          color: 'white', padding: '14px 20px', borderRadius: '10px',
          fontSize: '13px', fontWeight: '700',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          animation: 'slideIn 0.3s ease',
        }}>
          {toast.message}
        </div>
      )}
    </>
  );
}

// Composant helper pour les items du menu
function MenuItem({ 
  children, 
  onClick, 
  style = {},
  disabled = false 
}: { 
  children: React.ReactNode; 
  onClick: () => void; 
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '8px 14px',
        border: 'none',
        background: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '12px',
        color: THEME.text,
        transition: 'background-color 0.2s',
        whiteSpace: 'nowrap' as const,
        ...style
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.backgroundColor = '#f3f4f6')}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {children}
    </button>
  );
}

export default ListeVendeurs;
