/**
 * MessagerieAdmin.tsx — src/pages/acheteur/MessagerieAdmin.tsx
 * Messagerie acheteur ↔ administration avec pièces jointes S3, chiffrement, polling
 * Ajout : envoi de photos, suppression de messages par admin, création de tickets
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

const API = 'https://evend-multivendeur-api.onrender.com';

// Types
type TicketStatus = 'ouvert' | 'resolu' | 'ferme';
type TicketPriority = 'basse' | 'normale' | 'haute' | 'urgente';

interface Ticket {
  id: number;
  sujet: string;
  description: string;
  dateCreation: string;
  statut: TicketStatus;
  priorite: TicketPriority;
  categorie: string;
  dernierMessage: string | null;
  dateDernierMessage: string | null;
  nonLus: number;
  commandeId?: string;
}

interface Message {
  id: number;
  ticketId: number;
  expediteur_id: number;
  expediteur_role: 'acheteur' | 'admin';
  expediteur_nom: string;
  contenu: string;
  contenu_original?: string;
  supprime_par_admin?: boolean;
  piece_jointe_url: string | null;
  piece_jointe_nom: string | null;
  piece_jointe_type: string | null;
  lu: boolean;
  cree_le: string;
}

interface UploadResult {
  url: string;
  nom: string;
  type: string;
}

// Couleurs
const C = {
  blue: '#3b82f6',
  blueLight: 'rgba(59,130,246,0.15)',
  indigo: '#6366f1',
  indigoLight: 'rgba(99,102,241,0.15)',
  purple: '#8b5cf6',
  purpleLight: 'rgba(139,92,246,0.15)',
  pink: '#ec4899',
  pinkLight: 'rgba(236,72,153,0.15)',
  green: '#10b981',
  greenLight: 'rgba(16,185,129,0.15)',
  amber: '#f59e0b',
  amberLight: 'rgba(245,158,11,0.15)',
  orange: '#f97316',
  orangeLight: 'rgba(249,115,22,0.15)',
  red: '#ef4444',
  redLight: 'rgba(239,68,68,0.15)',
  rose: '#f43f5e',
  roseLight: 'rgba(244,63,94,0.15)',
  yellow: '#fbbf24',
  yellowLight: 'rgba(251,191,36,0.15)',
  border: 'rgba(255,255,255,0.08)',
  textLight: 'rgba(255,255,255,0.5)',
  cardBg: 'rgba(255,255,255,0.03)',
  
  // Couleurs de statut
  ouvert: '#10b981',
  ouvertLight: 'rgba(16,185,129,0.15)',
  resolu: '#3b82f6',
  resoluLight: 'rgba(59,130,246,0.15)',
  ferme: '#6b7280',
  fermeLight: 'rgba(107,114,128,0.15)',
  
  // Couleurs de priorité
  basse: '#6b7280',
  normale: '#3b82f6',
  haute: '#f59e0b',
  urgente: '#ef4444',
};

// Fonctions utilitaires
const fmtHeure = (d: string) => {
  try {
    const dt = new Date(d), now = new Date();
    const diff = now.getTime() - dt.getTime();
    if (diff < 86400000 && dt.getDate() === now.getDate())
      return dt.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
    return dt.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

const fmtDate = (d: string) => {
  try { 
    const dt = new Date(d);
    const now = new Date();
    const diff = now.getTime() - dt.getTime();
    if (diff < 86400000 && dt.getDate() === now.getDate()) return "Aujourd'hui";
    if (diff < 172800000) return 'Hier';
    return dt.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }); 
  } catch { return ''; }
};

// ============================================================================
// MODAL DE NOUVEAU TICKET
// ============================================================================
const NouveauTicketModal = ({ 
  isOpen, 
  onClose, 
  onCreate 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onCreate: (sujet: string, description: string, categorie: string, commandeId?: string) => Promise<void>;
}) => {
  const [sujet, setSujet] = useState('');
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState('Général');
  const [commandeId, setCommandeId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!sujet.trim() || !description.trim()) return;
    
    setLoading(true);
    await onCreate(sujet, description, categorie, commandeId || undefined);
    setLoading(false);
    setSujet('');
    setDescription('');
    setCategorie('Général');
    setCommandeId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(5px)',
    }}>
      <div style={{
        background: '#1a1a1a',
        borderRadius: '24px',
        width: '500px',
        maxWidth: '90%',
        padding: '32px',
        border: `1px solid ${C.border}`,
      }}>
        <h2 style={{ margin: '0 0 24px', fontSize: '24px', fontWeight: 700, color: '#fff' }}>
          Nouveau ticket
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: C.textLight }}>
            Sujet *
          </label>
          <input
            type="text"
            value={sujet}
            onChange={(e) => setSujet(e.target.value)}
            placeholder="Ex: Problème de paiement"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1px solid ${C.border}`,
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: C.textLight }}>
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez votre problème en détail..."
            rows={4}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1px solid ${C.border}`,
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: C.textLight }}>
            Catégorie
          </label>
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1px solid ${C.border}`,
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
            }}
          >
            <option value="Général">Général</option>
            <option value="Paiement">Paiement</option>
            <option value="Commande">Commande</option>
            <option value="Produit">Produit</option>
            <option value="Technique">Technique</option>
            <option value="Compte">Compte</option>
          </select>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: C.textLight }}>
            Numéro de commande (optionnel)
          </label>
          <input
            type="text"
            value={commandeId}
            onChange={(e) => setCommandeId(e.target.value)}
            placeholder="Ex: #13629869"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1px solid ${C.border}`,
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!sujet.trim() || !description.trim() || loading}
            style={{
              padding: '12px 24px',
              background: (!sujet.trim() || !description.trim()) ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: (!sujet.trim() || !description.trim()) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Création...' : 'Créer le ticket'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// BADGE DE STATUT
// ============================================================================
const StatutBadge = ({ statut }: { statut: TicketStatus }) => {
  const config = {
    ouvert: { bg: C.ouvertLight, color: C.ouvert, label: 'Ouvert' },
    resolu: { bg: C.resoluLight, color: C.resolu, label: 'Résolu' },
    ferme: { bg: C.fermeLight, color: C.ferme, label: 'Fermé' },
  };
  const { bg, color, label } = config[statut];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '10px',
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: '12px',
      background: bg,
      color: color,
    }}>
      {statut === 'ouvert' && '⚡'}
      {statut === 'resolu' && '✓'}
      {statut === 'ferme' && '🔒'}
      {label}
    </span>
  );
};

// ============================================================================
// BADGE DE PRIORITÉ
// ============================================================================
const PrioriteBadge = ({ priorite }: { priorite: TicketPriority }) => {
  const config = {
    basse: { bg: C.fermeLight, color: C.basse, icon: '↓', label: 'Basse' },
    normale: { bg: C.resoluLight, color: C.normale, icon: '•', label: 'Normale' },
    haute: { bg: C.haute + '20', color: C.haute, icon: '↑', label: 'Haute' },
    urgente: { bg: C.urgente + '20', color: C.urgente, icon: '⚠️', label: 'Urgente' },
  };
  const { bg, color, icon, label } = config[priorite];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '2px',
      fontSize: '10px',
      fontWeight: 700,
      padding: '2px 6px',
      borderRadius: '10px',
      background: bg,
      color: color,
    }}>
      {icon} {label}
    </span>
  );
};

// ============================================================================
// COMPOSANT DE LA LISTE DES TICKETS (GAUCHE)
// ============================================================================
const TicketList = ({ 
  tickets, 
  ticketActif, 
  onSelectTicket,
  recherche,
  setRecherche,
  onNouveauTicket,
}: { 
  tickets: Ticket[];
  ticketActif: number | null;
  onSelectTicket: (id: number) => void;
  recherche: string;
  setRecherche: (value: string) => void;
  onNouveauTicket: () => void;
}) => {
  // Filtrer les tickets
  const ticketsFiltres = tickets.filter(ticket =>
    ticket.sujet.toLowerCase().includes(recherche.toLowerCase()) ||
    ticket.description.toLowerCase().includes(recherche.toLowerCase()) ||
    ticket.categorie.toLowerCase().includes(recherche.toLowerCase()) ||
    (ticket.commandeId && ticket.commandeId.includes(recherche))
  );

  const totalNonLus = tickets.reduce((acc, ticket) => acc + ticket.nonLus, 0);

  return (
    <div style={{
      width: '380px',
      background: 'rgba(255,255,255,0.02)',
      borderRight: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderRadius: '20px 0 0 20px',
      overflow: 'hidden',
    }}>
      {/* En-tête de la liste */}
      <div style={{
        padding: '20px',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
            Support technique
          </h3>
          {totalNonLus > 0 && (
            <span style={{
              background: C.red,
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px',
            }}>
              {totalNonLus} non lu{totalNonLus > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Barre de recherche */}
        <input
          type="text"
          placeholder="🔍 Rechercher un sujet..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '30px',
            border: `1px solid ${C.border}`,
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '13px',
            outline: 'none',
          }}
        />
      </div>

      {/* Liste des tickets */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
      }}>
        {ticketsFiltres.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.textLight }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎫</div>
            <p>Aucun ticket trouvé</p>
            <button
              onClick={onNouveauTicket}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Créer un ticket
            </button>
          </div>
        ) : (
          ticketsFiltres.map(ticket => (
            <div
              key={ticket.id}
              onClick={() => onSelectTicket(ticket.id)}
              style={{
                padding: '16px',
                marginBottom: '8px',
                borderRadius: '16px',
                background: ticketActif === ticket.id 
                  ? `linear-gradient(135deg, ${C.purple}20, ${C.blue}10)`
                  : 'transparent',
                border: `1px solid ${ticketActif === ticket.id ? `${C.purple}40` : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (ticketActif !== ticket.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={e => {
                if (ticketActif !== ticket.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {/* Indicateur de priorité (bandeau à gauche) */}
              <div style={{
                position: 'absolute',
                left: '0',
                top: '16px',
                bottom: '16px',
                width: '3px',
                borderRadius: '3px',
                background: 
                  ticket.priorite === 'urgente' ? C.urgente :
                  ticket.priorite === 'haute' ? C.haute :
                  ticket.priorite === 'normale' ? C.normale :
                  C.basse,
              }} />

              <div style={{ marginLeft: '8px' }}>
                {/* En-tête */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{ticket.sujet}</span>
                  <span style={{ fontSize: '10px', color: C.textLight }}>
                    {ticket.dateDernierMessage ? fmtHeure(ticket.dateDernierMessage) : ''}
                  </span>
                </div>

                {/* Description courte */}
                <p style={{
                  margin: '0 0 8px',
                  fontSize: '11px',
                  color: C.textLight,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {ticket.description}
                </p>

                {/* Métadonnées */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <StatutBadge statut={ticket.statut} />
                  <PrioriteBadge priorite={ticket.priorite} />
                  <span style={{ fontSize: '10px', color: C.textLight }}>{ticket.categorie}</span>
                </div>

                {/* Dernier message et compteur */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p style={{
                    margin: 0,
                    fontSize: '11px',
                    color: C.textLight,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1,
                  }}>
                    {ticket.dernierMessage}
                  </p>
                  {ticket.nonLus > 0 && (
                    <span style={{
                      background: C.purple,
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '10px',
                      minWidth: '20px',
                      textAlign: 'center',
                    }}>
                      {ticket.nonLus}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bouton nouveau ticket */}
      <div style={{
        padding: '16px',
        borderTop: `1px solid ${C.border}`,
      }}>
        <button
          onClick={onNouveauTicket}
          style={{
            width: '100%',
            padding: '12px',
            background: `linear-gradient(135deg, ${C.purple}, ${C.blue})`,
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          + Nouveau ticket
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// COMPOSANT DE LA ZONE DE CHAT (DROITE)
// ============================================================================
const ChatZone = ({ 
  ticket, 
  messages, 
  onEnvoyerMessage,
  uploading,
  onFileUpload,
}: { 
  ticket: Ticket | null;
  messages: Message[];
  onEnvoyerMessage: (contenu: string, pieceJointe?: UploadResult) => void;
  uploading: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const [nouveauMessage, setNouveauMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleEnvoyer = () => {
    if (nouveauMessage.trim()) {
      onEnvoyerMessage(nouveauMessage);
      setNouveauMessage('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnvoyer();
    }
  };

  // Fonction pour vérifier si une URL est une image
  const estUneImage = (url: string | null): boolean => {
    if (!url) return false;
    return url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) !== null;
  };

  // Grouper messages par date
  const groupesMessages = () => {
    const groupes: { date: string; msgs: Message[] }[] = [];
    messages.forEach(m => {
      const d = fmtDate(m.cree_le);
      const last = groupes[groupes.length - 1];
      if (!last || last.date !== d) groupes.push({ date: d, msgs: [m] });
      else last.msgs.push(m);
    });
    return groupes;
  };

  if (!ticket) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        color: C.textLight,
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px', opacity: 0.5 }}>🎫</div>
        <h3 style={{ margin: '0 0 10px', fontSize: '18px', color: '#fff' }}>Sélectionnez un ticket</h3>
        <p style={{ margin: 0, fontSize: '14px', textAlign: 'center' }}>
          Choisissez un sujet dans la liste pour voir la conversation avec l'administration
        </p>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'rgba(255,255,255,0.01)',
      borderRadius: '0 20px 20px 0',
      overflow: 'hidden',
    }}>
      {/* En-tête du chat */}
      <div style={{
        padding: '20px 24px',
        borderBottom: `1px solid ${C.border}`,
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: 
              ticket.statut === 'ouvert' ? C.ouvert :
              ticket.statut === 'resolu' ? C.resolu :
              C.ferme,
          }} />
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
            {ticket.sujet}
          </h3>
          <StatutBadge statut={ticket.statut} />
          <PrioriteBadge priorite={ticket.priorite} />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: C.textLight }}>
          <span>Créé le {fmtDate(ticket.dateCreation)}</span>
          <span>•</span>
          <span>Catégorie: {ticket.categorie}</span>
          {ticket.commandeId && (
            <>
              <span>•</span>
              <span>Commande: {ticket.commandeId}</span>
            </>
          )}
        </div>
      </div>

      {/* Zone des messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {groupesMessages().map(groupe => (
          <React.Fragment key={groupe.date}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              margin: '8px 0',
            }}>
              <span style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                color: C.textLight,
              }}>
                {groupe.date}
              </span>
            </div>
            
            {groupe.msgs.map(msg => {
              const estMoi = msg.expediteur_role === 'acheteur';
              const estSupprime = msg.supprime_par_admin || msg.contenu.includes('Message supprimé par l\'administration');
              
              return (
                <div key={msg.id} style={{
                  display: 'flex',
                  justifyContent: estMoi ? 'flex-end' : 'flex-start',
                  gap: '8px',
                }}>
                  {!estMoi && (
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${C.purple}30, ${C.blue}30)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0,
                    }}>
                      🛡️
                    </div>
                  )}
                  
                  <div style={{
                    maxWidth: '70%',
                  }}>
                    <div style={{
                      background: estMoi 
                        ? `linear-gradient(135deg, ${C.blue}, #1e40af)`
                        : 'rgba(255,255,255,0.05)',
                      padding: '12px 16px',
                      borderRadius: estMoi
                        ? '20px 20px 4px 20px'
                        : '20px 20px 20px 4px',
                      border: `1px solid ${estMoi ? 'transparent' : C.border}`,
                      opacity: estSupprime ? 0.7 : 1,
                    }}>
                      {!estMoi && !estSupprime && (
                        <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 600, color: C.purple }}>
                          {msg.expediteur_nom}
                        </p>
                      )}
                      <p style={{ margin: 0, fontSize: '13px', color: estSupprime ? '#999' : '#fff', lineHeight: '1.5', fontStyle: estSupprime ? 'italic' : 'normal' }}>
                        {msg.contenu}
                      </p>
                      
                      {/* Affichage des images */}
                      {msg.piece_jointe_url && !estSupprime && (
                        <div style={{ marginTop: '8px' }}>
                          {estUneImage(msg.piece_jointe_url) ? (
                            <img 
                              src={msg.piece_jointe_url} 
                              alt={msg.piece_jointe_nom || 'Image'} 
                              style={{ 
                                maxWidth: '200px', 
                                maxHeight: '200px', 
                                borderRadius: '8px', 
                                cursor: 'pointer',
                                border: '1px solid rgba(255,255,255,0.2)'
                              }} 
                              onClick={() => window.open(msg.piece_jointe_url!, '_blank')}
                              onError={(e) => {
                                console.error('Erreur chargement image:', msg.piece_jointe_url);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <a 
                              href={msg.piece_jointe_url} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                fontSize: '11px', 
                                color: estMoi ? '#fff' : C.purple, 
                                textDecoration: 'underline',
                                padding: '4px 8px',
                                background: estMoi ? 'rgba(255,255,255,0.2)' : 'rgba(139,92,246,0.1)',
                                borderRadius: '4px'
                              }}>
                              📎 {msg.piece_jointe_nom || 'Fichier joint'}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: estMoi ? 'flex-end' : 'flex-start',
                      marginTop: '4px',
                      padding: '0 4px',
                    }}>
                      <span style={{ fontSize: '10px', color: C.textLight }}>
                        {fmtHeure(msg.cree_le)}
                        {msg.supprime_par_admin && (
                          <span style={{ marginLeft: '6px', color: C.red }}>🗑️ Supprimé</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {estMoi && (
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${C.blue}30, ${C.indigo}30)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0,
                    }}>
                      👤
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie avec upload d'image */}
      <div style={{
        padding: '20px 24px',
        borderTop: `1px solid ${C.border}`,
        background: 'rgba(255,255,255,0.02)',
      }}>
        {ticket.statut === 'ferme' ? (
          <p style={{ textAlign: 'center', color: C.textLight, fontSize: '12px', margin: 0 }}>
            🔒 Cette conversation est fermée par l'administration
          </p>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,.pdf"
              style={{ display: 'none' }}
              onChange={onFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                padding: '14px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${C.border}`,
                borderRadius: '30px',
                color: '#fff',
                fontSize: '16px',
                cursor: 'pointer',
                width: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Ajouter une image"
            >
              {uploading ? '⏳' : '📷'}
            </button>
            <textarea
              ref={inputRef}
              value={nouveauMessage}
              onChange={(e) => setNouveauMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Écrire à l'administration... (Entrée pour envoyer)"
              rows={2}
              style={{
                flex: 1,
                padding: '14px 18px',
                borderRadius: '30px',
                border: `1px solid ${C.border}`,
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleEnvoyer}
              disabled={!nouveauMessage.trim() || uploading}
              style={{
                padding: '14px 24px',
                background: nouveauMessage.trim() && !uploading
                  ? `linear-gradient(135deg, ${C.purple}, ${C.blue})`
                  : 'rgba(255,255,255,0.05)',
                border: 'none',
                borderRadius: '30px',
                color: nouveauMessage.trim() && !uploading ? '#fff' : C.textLight,
                fontSize: '14px',
                fontWeight: 700,
                cursor: nouveauMessage.trim() && !uploading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Envoyer →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export default function MessagerieAdmin({ naviguer }: { naviguer: (page: string, props?: any) => void }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const [ticketActif, setTicketActif] = useState<number | null>(null);
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' | 'danger' } | null>(null);
  const [modalNouveauTicket, setModalNouveauTicket] = useState(false);
  
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const token = localStorage.getItem('token');

  const showToast = (msg: string, type: 'success' | 'info' | 'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ✅ CHARGER LES TICKETS (acheteur ↔ admin)
  const chargerTickets = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/messagerie/acheteur/admin/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      
      if (Array.isArray(data)) {
        setTickets(data);
      }
    } catch (error) {
      console.error('Erreur chargement tickets:', error);
    }
    setLoading(false);
  }, [token]);

  // ✅ CHARGER LES MESSAGES D'UN TICKET
  const chargerMessages = useCallback(async (ticketId: number) => {
    try {
      const r = await fetch(`${API}/api/messagerie/acheteur/admin/conversations/${ticketId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      
      if (Array.isArray(data)) {
        setMessages(prev => ({
          ...prev,
          [ticketId]: data,
        }));
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  }, [token]);

  // ✅ CRÉER UN NOUVEAU TICKET
  const creerTicket = async (sujet: string, description: string, categorie: string, commandeId?: string) => {
    try {
      const response = await fetch(`${API}/api/messagerie/acheteur/admin/conversations`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          sujet,
          description,
          categorie,
          commande_id: commandeId,
        }),
      });

      if (response.ok) {
        const newTicket = await response.json();
        setTickets(prev => [newTicket, ...prev]);
        setTicketActif(newTicket.id);
        setMessages(prev => ({ ...prev, [newTicket.id]: [] }));
        showToast('✅ Ticket créé avec succès', 'success');
      } else {
        const error = await response.json();
        showToast(`❌ Erreur: ${error.error || 'Création échouée'}`, 'danger');
      }
    } catch (error) {
      showToast('❌ Erreur lors de la création', 'danger');
    }
  };

  // Polling 15 secondes
  useEffect(() => {
    chargerTickets();
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => {
      chargerTickets();
      if (ticketActif) chargerMessages(ticketActif);
    }, 15000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [ticketActif, chargerTickets, chargerMessages]);

  const handleSelectTicket = async (ticketId: number) => {
    setTicketActif(ticketId);
    await chargerMessages(ticketId);
    
    // Marquer comme lus côté serveur
    try {
      await fetch(`${API}/api/messagerie/acheteur/admin/conversations/${ticketId}/lire`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
    
    // Mettre à jour le compteur local
    setTickets(prev =>
      prev.map(t => t.id === ticketId ? { ...t, nonLus: 0 } : t)
    );
  };

  // Upload de fichier vers S3
  const uploadFichier = async (file: File): Promise<UploadResult | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          url: data.url,
          nom: file.name,
          type: file.type,
        };
      } else {
        throw new Error('Erreur upload');
      }
    } catch (error) {
      showToast('❌ Erreur lors de l\'upload', 'danger');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // ✅ ENVOYER UN MESSAGE (acheteur)
  const handleEnvoyerMessage = async (contenu: string, pieceJointe?: UploadResult) => {
    if (!ticketActif || sending) return;
    
    setSending(true);
    try {
      const response = await fetch(`${API}/api/messagerie/acheteur/admin/conversations/${ticketActif}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          contenu: contenu,
          piece_jointe_url: pieceJointe?.url || null,
          piece_jointe_nom: pieceJointe?.nom || null,
          piece_jointe_type: pieceJointe?.type || null,
        }),
      });
      
      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => ({
          ...prev,
          [ticketActif]: [...(prev[ticketActif] || []), newMsg],
        }));
        
        // Mettre à jour le dernier message dans le ticket
        setTickets(prev =>
          prev.map(t => 
            t.id === ticketActif 
              ? { 
                  ...t, 
                  dernierMessage: contenu,
                  dateDernierMessage: newMsg.cree_le,
                } 
              : t
          )
        );
      } else {
        const error = await response.json();
        showToast(`❌ Erreur: ${error.error || 'Envoi échoué'}`, 'danger');
      }
    } catch (error) {
      showToast('❌ Erreur lors de l\'envoi', 'danger');
    } finally {
      setSending(false);
    }
  };

  // ✅ GESTION UPLOAD FICHIER
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !ticketActif) return;
    
    const uploadResult = await uploadFichier(file);
    if (uploadResult) {
      await handleEnvoyerMessage(`📷 ${file.name}`, uploadResult);
    }
    
    if (e.target) e.target.value = '';
  };

  // Statistiques
  const totalTickets = tickets.length;
  const totalNonLus = tickets.reduce((acc, t) => acc + t.nonLus, 0);
  const ticketsOuverts = tickets.filter(t => t.statut === 'ouvert').length;

  return (
    <div style={{ animation: 'fadeUp 0.5s ease', height: 'calc(100vh - 200px)' }}>
      {/* Modal Nouveau Ticket */}
      <NouveauTicketModal
        isOpen={modalNouveauTicket}
        onClose={() => setModalNouveauTicket(false)}
        onCreate={creerTicket}
      />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          backgroundColor: toast.type === 'success' ? '#10b981' : toast.type === 'danger' ? '#ef4444' : '#3b82f6',
          color: 'white',
          padding: '14px 20px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 700,
          zIndex: 3000,
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          maxWidth: '420px',
        }}>
          {toast.msg}
        </div>
      )}

      {/* En-tête avec statistiques */}
      <div style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
        borderRadius: '24px',
        padding: '32px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          left: '-50px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <span style={{ fontSize: '40px' }}>🛡️</span>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
              Support e-Vend
            </h1>
          </div>
          <p style={{ margin: '0 0 20px', fontSize: '16px', color: 'rgba(255,255,255,0.8)', maxWidth: '600px' }}>
            Contactez l'administration pour toutes questions sur votre compte, vos ventes, ou tout autre sujet.
          </p>
          
          {/* Statistiques */}
          {!loading && (
            <div style={{ display: 'flex', gap: '32px' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{totalTickets}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Tickets</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{totalNonLus}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Non lus</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{ticketsOuverts}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Ouverts</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zone principale */}
      <div style={{
        display: 'flex',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '24px',
        border: `1px solid ${C.border}`,
        height: 'calc(100vh - 320px)',
        minHeight: '500px',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTop: `3px solid ${C.purple}`, animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Liste des tickets (gauche) */}
            <TicketList
              tickets={tickets}
              ticketActif={ticketActif}
              onSelectTicket={handleSelectTicket}
              recherche={recherche}
              setRecherche={setRecherche}
              onNouveauTicket={() => setModalNouveauTicket(true)}
            />

            {/* Zone de chat (droite) */}
            <ChatZone
              ticket={tickets.find(t => t.id === ticketActif) || null}
              messages={messages[ticketActif || 0] || []}
              onEnvoyerMessage={handleEnvoyerMessage}
              uploading={uploading}
              onFileUpload={handleFileUpload}
            />
          </>
        )}
      </div>
    </div>
  );
}
