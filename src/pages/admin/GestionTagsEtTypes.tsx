import React, { useState, useEffect, useRef, useMemo } from 'react';
import { log } from '../../services/logger';

// Types
interface Tag {
  id: string;
  nom: string;
  description?: string;
  statut: 'actif' | 'inactif';
  dateCreation: string;
}

interface TypeProduit {
  id: string;
  nom: string;
  description?: string;
  statut: 'actif' | 'inactif';
  dateCreation: string;
}

type ActionType = 'activer' | 'desactiver' | 'supprimer' | 'activer_bulk' | 'desactiver_bulk' | 'supprimer_bulk' | null;

// Thème
const THEME = {
  accent: '#2d6a9f',
  accentLight: '#e8f2fb',
  accentDark: '#1d4f7a',
  bg: '#f0f2f5',
  card: '#ffffff',
  border: '#e1e4e8',
  text: '#1a2332',
  textLight: '#6b7280',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  success: '#16a34a',
  successLight: '#dcfce7',
  warning: '#d97706',
  warningLight: '#fef3c7',
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL CRÉATION TAG
// ─────────────────────────────────────────────────────────────────────────────
function ModalCreerTag({ isOpen, onClose, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tag: Omit<Tag, 'id' | 'dateCreation'>) => void;
}) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [statut, setStatut] = useState<'actif' | 'inactif'>('actif');
  const [erreurs, setErreurs] = useState<{ nom?: string }>({});

  if (!isOpen) return null;

  const valider = () => {
    const err: { nom?: string } = {};
    if (!nom.trim()) err.nom = 'Le nom du tag est requis';
    setErreurs(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = () => {
    if (valider()) {
      onSave({
        nom,
        description,
        statut,
      });
      setNom('');
      setDescription('');
      setStatut('actif');
      setErreurs({});
    }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '500px',
        maxWidth: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>
        
        {/* En-tête */}
        <div style={{
          background: `linear-gradient(135deg, ${THEME.accent} 0%, ${THEME.accentDark} 100%)`,
          padding: '20px 24px',
          color: 'white',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0' }}>
            ➕ Ajouter un tag
          </h3>
          <p style={{ fontSize: '13px', opacity: 0.8, margin: 0 }}>
            Créez un nouveau tag pour vos produits
          </p>
        </div>

        {/* Corps */}
        <div style={{ padding: '24px' }}>
          
          {/* Nom du tag */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: THEME.text,
              marginBottom: '6px',
            }}>
              Nom du tag <span style={{ color: THEME.danger }}>*</span>
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Pièce unique, Fait main, Éco-responsable..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${erreurs.nom ? THEME.danger : THEME.border}`,
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            {erreurs.nom && (
              <p style={{ fontSize: '11px', color: THEME.danger, margin: '4px 0 0 0' }}>
                {erreurs.nom}
              </p>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: THEME.text,
              marginBottom: '6px',
            }}>
              Description (optionnelle)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du tag..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${THEME.border}`,
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Statut */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: THEME.text,
              marginBottom: '8px',
            }}>
              Statut
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={statut === 'actif'}
                  onChange={() => setStatut('actif')}
                />
                <span style={{ fontSize: '13px' }}>Actif</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={statut === 'inactif'}
                  onChange={() => setStatut('inactif')}
                />
                <span style={{ fontSize: '13px' }}>Inactif</span>
              </label>
            </div>
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                border: `1px solid ${THEME.border}`,
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '10px 24px',
                backgroundColor: THEME.accent,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              ✅ Créer le tag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL CRÉATION TYPE
// ─────────────────────────────────────────────────────────────────────────────
function ModalCreerType({ isOpen, onClose, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (type: Omit<TypeProduit, 'id' | 'dateCreation'>) => void;
}) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [statut, setStatut] = useState<'actif' | 'inactif'>('actif');
  const [erreurs, setErreurs] = useState<{ nom?: string }>({});

  if (!isOpen) return null;

  const valider = () => {
    const err: { nom?: string } = {};
    if (!nom.trim()) err.nom = 'Le nom du type est requis';
    setErreurs(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = () => {
    if (valider()) {
      onSave({
        nom,
        description,
        statut,
      });
      setNom('');
      setDescription('');
      setStatut('actif');
      setErreurs({});
    }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '500px',
        maxWidth: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>
        
        {/* En-tête */}
        <div style={{
          background: `linear-gradient(135deg, ${THEME.accent} 0%, ${THEME.accentDark} 100%)`,
          padding: '20px 24px',
          color: 'white',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0' }}>
            ➕ Ajouter un type
          </h3>
          <p style={{ fontSize: '13px', opacity: 0.8, margin: 0 }}>
            Créez un nouveau type de produit
          </p>
        </div>

        {/* Corps */}
        <div style={{ padding: '24px' }}>
          
          {/* Nom du type */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: THEME.text,
              marginBottom: '6px',
            }}>
              Nom du type <span style={{ color: THEME.danger }}>*</span>
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Vêtements, Électronique, Livres..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${erreurs.nom ? THEME.danger : THEME.border}`,
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            {erreurs.nom && (
              <p style={{ fontSize: '11px', color: THEME.danger, margin: '4px 0 0 0' }}>
                {erreurs.nom}
              </p>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: THEME.text,
              marginBottom: '6px',
            }}>
              Description (optionnelle)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du type..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${THEME.border}`,
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Statut */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: THEME.text,
              marginBottom: '8px',
            }}>
              Statut
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={statut === 'actif'}
                  onChange={() => setStatut('actif')}
                />
                <span style={{ fontSize: '13px' }}>Actif</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={statut === 'inactif'}
                  onChange={() => setStatut('inactif')}
                />
                <span style={{ fontSize: '13px' }}>Inactif</span>
              </label>
            </div>
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                border: `1px solid ${THEME.border}`,
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '10px 24px',
                backgroundColor: THEME.accent,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              ✅ Créer le type
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL MODIFIER TAG
// ─────────────────────────────────────────────────────────────────────────────
function ModalModifierTag({ isOpen, tag, onClose, onSave }: {
  isOpen: boolean;
  tag: Tag | null;
  onClose: () => void;
  onSave: (id: string, updatedTag: Partial<Tag>) => void;
}) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [statut, setStatut] = useState<'actif' | 'inactif'>('actif');
  const [erreurs, setErreurs] = useState<{ nom?: string }>({});

  useEffect(() => {
    if (tag) {
      setNom(tag.nom);
      setDescription(tag.description || '');
      setStatut(tag.statut);
    }
  }, [tag]);

  if (!isOpen || !tag) return null;

  const valider = () => {
    const err: { nom?: string } = {};
    if (!nom.trim()) err.nom = 'Le nom du tag est requis';
    setErreurs(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = () => {
    if (valider()) {
      onSave(tag.id, {
        nom,
        description: description || undefined,
        statut,
      });
    }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '500px',
        maxWidth: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>
        
        {/* En-tête */}
        <div style={{
          background: `linear-gradient(135deg, ${THEME.accent} 0%, ${THEME.accentDark} 100%)`,
          padding: '20px 24px',
          color: 'white',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0' }}>
            ✏️ Modifier le tag
          </h3>
          <p style={{ fontSize: '13px', opacity: 0.8, margin: 0 }}>
            ID: {tag.id}
          </p>
        </div>

        {/* Corps */}
        <div style={{ padding: '24px' }}>
          
          {/* Nom du tag */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: THEME.text,
              marginBottom: '6px',
            }}>
              Nom du tag <span style={{ color: THEME.danger }}>*</span>
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${erreurs.nom ? THEME.danger : THEME.border}`,
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            {erreurs.nom && (
              <p style={{ fontSize: '11px', color: THEME.danger, margin: '4px 0 0 0' }}>
                {erreurs.nom}
              </p>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: THEME.text,
              marginBottom: '6px',
            }}>
              Description (optionnelle)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${THEME.border}`,
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Statut */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: THEME.text,
              marginBottom: '8px',
            }}>
              Statut
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={statut === 'actif'}
                  onChange={() => setStatut('actif')}
                />
                <span style={{ fontSize: '13px' }}>Actif</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={statut === 'inactif'}
                  onChange={() => setStatut('inactif')}
                />
                <span style={{ fontSize: '13px' }}>Inactif</span>
              </label>
            </div>
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                border: `1px solid ${THEME.border}`,
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '10px 24px',
                backgroundColor: THEME.accent,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              ✅ Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL MODIFIER TYPE
// ─────────────────────────────────────────────────────────────────────────────
function ModalModifierType({ isOpen, type, onClose, onSave }: {
  isOpen: boolean;
  type: TypeProduit | null;
  onClose: () => void;
  onSave: (id: string, updatedType: Partial<TypeProduit>) => void;
}) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [statut, setStatut] = useState<'actif' | 'inactif'>('actif');
  const [erreurs, setErreurs] = useState<{ nom?: string }>({});

  useEffect(() => {
    if (type) {
      setNom(type.nom);
      setDescription(type.description || '');
      setStatut(type.statut);
    }
  }, [type]);

  if (!isOpen || !type) return null;

  const valider = () => {
    const err: { nom?: string } = {};
    if (!nom.trim()) err.nom = 'Le nom du type est requis';
    setErreurs(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = () => {
    if (valider()) {
      onSave(type.id, {
        nom,
        description: description || undefined,
        statut,
      });
    }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '500px',
        maxWidth: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>
        
        {/* En-tête */}
        <div style={{
          background: `linear-gradient(135deg, ${THEME.accent} 0%, ${THEME.accentDark} 100%)`,
          padding: '20px 24px',
          color: 'white',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0' }}>
            ✏️ Modifier le type
          </h3>
          <p style={{ fontSize: '13px', opacity: 0.8, margin: 0 }}>
            ID: {type.id}
          </p>
        </div>

        {/* Corps */}
        <div style={{ padding: '24px' }}>
          
          {/* Nom du type */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: THEME.text,
              marginBottom: '6px',
            }}>
              Nom du type <span style={{ color: THEME.danger }}>*</span>
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${erreurs.nom ? THEME.danger : THEME.border}`,
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            {erreurs.nom && (
              <p style={{ fontSize: '11px', color: THEME.danger, margin: '4px 0 0 0' }}>
                {erreurs.nom}
              </p>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: THEME.text,
              marginBottom: '6px',
            }}>
              Description (optionnelle)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${THEME.border}`,
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Statut */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: THEME.text,
              marginBottom: '8px',
            }}>
              Statut
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={statut === 'actif'}
                  onChange={() => setStatut('actif')}
                />
                <span style={{ fontSize: '13px' }}>Actif</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={statut === 'inactif'}
                  onChange={() => setStatut('inactif')}
                />
                <span style={{ fontSize: '13px' }}>Inactif</span>
              </label>
            </div>
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                border: `1px solid ${THEME.border}`,
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '10px 24px',
                backgroundColor: THEME.accent,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              ✅ Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL CONFIRMATION
// ─────────────────────────────────────────────────────────────────────────────
function ModalConfirmation({ isOpen, type, count, onConfirm, onCancel }: {
  isOpen: boolean;
  type: ActionType;
  count?: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [confirmation, setConfirmation] = useState('');
  
  if (!isOpen || !type) return null;

  const isBulk = type.includes('_bulk');
  const isSupprimer = type === 'supprimer' || type === 'supprimer_bulk';
  
  const MOT_CONFIRMATION = 'CONFIRMER';
  const confirmationValide = confirmation === MOT_CONFIRMATION;

  const getTitle = () => {
    if (isBulk) {
      if (isSupprimer) return `SUPPRIMER ${count} ÉLÉMENT${count && count > 1 ? 'S' : ''}`;
      if (type === 'activer_bulk') return `ACTIVER ${count} ÉLÉMENT${count && count > 1 ? 'S' : ''}`;
      if (type === 'desactiver_bulk') return `DÉSACTIVER ${count} ÉLÉMENT${count && count > 1 ? 'S' : ''}`;
    } else {
      if (isSupprimer) return 'SUPPRIMER CET ÉLÉMENT';
      if (type === 'activer') return 'ACTIVER CET ÉLÉMENT';
      if (type === 'desactiver') return 'DÉSACTIVER CET ÉLÉMENT';
    }
    return '';
  };

  const getIcon = () => {
    if (isSupprimer) return '🗑️';
    if (type === 'activer' || type === 'activer_bulk') return '✅';
    if (type === 'desactiver' || type === 'desactiver_bulk') return '⚠️';
    return '📋';
  };

  const getButtonColor = () => {
    if (isSupprimer) return THEME.danger;
    if (type === 'activer' || type === 'activer_bulk') return THEME.success;
    if (type === 'desactiver' || type === 'desactiver_bulk') return THEME.warning;
    return THEME.accent;
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onCancel()} style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '480px',
        maxWidth: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>
        
        {/* En-tête */}
        <div style={{
          background: `linear-gradient(135deg, ${THEME.accent} 0%, ${THEME.accentDark} 100%)`,
          padding: '20px 24px',
          color: 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}>
              {getIcon()}
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>
                {getTitle()}
              </h3>
              <p style={{ fontSize: '12px', opacity: 0.8, margin: '2px 0 0 0' }}>
                Cette action nécessite une confirmation
              </p>
            </div>
          </div>
        </div>

        {/* Corps */}
        <div style={{ padding: '24px' }}>
          
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            border: `1px solid ${THEME.border}`,
          }}>
            <p style={{ fontSize: '13px', color: THEME.text, margin: 0, lineHeight: '1.6' }}>
              {isSupprimer ? (
                <>
                  <strong>⚠️ Attention :</strong> Cette action est irréversible.
                  {isBulk ? (
                    ` Vous êtes sur le point de supprimer ${count} élément${count && count > 1 ? 's' : ''}.`
                  ) : (
                    ' Vous êtes sur le point de supprimer cet élément.'
                  )}
                  <br /><br />
                  Toutes les données associées seront perdues définitivement.
                </>
              ) : type?.includes('activer') ? (
                <>
                  <strong>✅ Activation :</strong> Les éléments seront visibles dans la boutique.
                </>
              ) : (
                <>
                  <strong>⚠️ Désactivation :</strong> Les éléments ne seront plus disponibles dans la boutique.
                </>
              )}
            </p>
          </div>

          {/* Champ de confirmation pour la suppression */}
          {isSupprimer && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '13px',
                fontWeight: '600',
                color: THEME.text,
                display: 'block',
                marginBottom: '8px',
              }}>
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
                  fontFamily: 'monospace',
                }}
              />
              {confirmation && !confirmationValide && (
                <p style={{ fontSize: '12px', color: THEME.danger, margin: '8px 0 0 0' }}>
                  ⚠️ Le texte de confirmation ne correspond pas
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${THEME.border}`,
          backgroundColor: '#fafafa',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              border: `1px solid ${THEME.border}`,
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isSupprimer && !confirmationValide}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: (isSupprimer && !confirmationValide) ? 'not-allowed' : 'pointer',
              backgroundColor: (isSupprimer && !confirmationValide) ? '#cccccc' : getButtonColor(),
              color: 'white',
            }}
          >
            {isSupprimer && confirmationValide ? '✅ Confirmer' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL IMPORT CSV
// ─────────────────────────────────────────────────────────────────────────────
function ModalImportCSV({ isOpen, type, onConfirm, onCancel }: {
  isOpen: boolean;
  type: 'tags' | 'types';
  onConfirm: (file: File) => void;
  onCancel: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onCancel()} style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '560px',
        maxWidth: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>
        
        {/* En-tête */}
        <div style={{
          background: `linear-gradient(135deg, ${THEME.accent} 0%, ${THEME.accentDark} 100%)`,
          padding: '20px 24px',
          color: 'white',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0' }}>
            📤 Importer des {type === 'tags' ? 'tags' : 'types'}
          </h3>
          <p style={{ fontSize: '13px', opacity: 0.8, margin: 0 }}>
            Fichier CSV
          </p>
        </div>

        {/* Corps */}
        <div style={{ padding: '24px' }}>
          
          {/* Zone de drop */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? THEME.accent : THEME.border}`,
              borderRadius: '12px',
              padding: '32px 20px',
              textAlign: 'center',
              backgroundColor: dragActive ? THEME.accentLight : '#f8fafc',
              transition: 'all 0.2s',
              marginBottom: '20px',
              cursor: 'pointer',
            }}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleChange}
              style={{ display: 'none' }}
            />
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📄</div>
            <p style={{ fontSize: '14px', fontWeight: '600', color: THEME.text, margin: '0 0 4px 0' }}>
              {file ? file.name : 'Cliquez ou glissez un fichier CSV'}
            </p>
            <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>
              {file ? `${(file.size / 1024).toFixed(2)} Ko` : 'Format accepté : .csv'}
            </p>
          </div>

          {/* Instructions */}
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            padding: '16px',
            border: `1px solid ${THEME.border}`,
          }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: THEME.text, margin: '0 0 8px 0' }}>
              Format attendu :
            </h4>
            {type === 'tags' ? (
              <>
                <p style={{ fontSize: '11px', color: THEME.textLight, margin: '0 0 4px 0' }}>
                  • nom, description, statut
                </p>
                <p style={{ fontSize: '11px', color: THEME.textLight, margin: '0 0 4px 0' }}>
                  • La première ligne doit contenir les en-têtes
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: '11px', color: THEME.textLight, margin: '0 0 4px 0' }}>
                  • nom, description, statut
                </p>
                <p style={{ fontSize: '11px', color: THEME.textLight, margin: '0 0 4px 0' }}>
                  • La première ligne doit contenir les en-têtes
                </p>
              </>
            )}
            <p style={{ fontSize: '11px', color: THEME.textLight, margin: '4px 0 0 0' }}>
              • Taille maximale : 5 Mo
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${THEME.border}`,
          backgroundColor: '#fafafa',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              border: `1px solid ${THEME.border}`,
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            onClick={() => file && onConfirm(file)}
            disabled={!file}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: file ? 'pointer' : 'not-allowed',
              backgroundColor: file ? THEME.accent : '#cccccc',
              color: 'white',
            }}
          >
            {file ? '✅ Importer' : 'Importer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function GestionTagsEtTypes() {
  const [onglet, setOnglet] = useState<'tags' | 'types'>('tags');
  const [tags, setTags] = useState<Tag[]>([]);
  const [types, setTypes] = useState<TypeProduit[]>([]);
  const [recherche, setRecherche] = useState('');
  const [selection, setSelection] = useState<string[]>([]);
  const [menuActionGroupesOuvert, setMenuActionGroupesOuvert] = useState(false);
  const [modalTagOuvert, setModalTagOuvert] = useState(false);
  const [modalTypeOuvert, setModalTypeOuvert] = useState(false);
  const [modalTagModifier, setModalTagModifier] = useState<{ isOpen: boolean; tag: Tag | null }>({
    isOpen: false,
    tag: null,
  });
  const [modalTypeModifier, setModalTypeModifier] = useState<{ isOpen: boolean; type: TypeProduit | null }>({
    isOpen: false,
    type: null,
  });
  const [modalImportOuvert, setModalImportOuvert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalConfirmation, setModalConfirmation] = useState<{
    isOpen: boolean;
    type: ActionType;
    count?: number;
  }>({
    isOpen: false,
    type: null,
  });

  const menuActionRef = useRef<HTMLDivElement>(null);

  // Charger les données depuis l'API
  useEffect(() => {
    const chargerDonnees = async () => {
      try {
        setLoading(true);
        log.admin('Page visitée', 'Gestion des tags et types', {});

        // Charger les tags
        const tagsResponse = await fetch('https://evend-multivendeur-api.onrender.com/api/tags');
        if (!tagsResponse.ok) throw new Error(`Erreur chargement tags (${tagsResponse.status})`);
        const tagsRaw = await tagsResponse.json();
        const tagsData = Array.isArray(tagsRaw) ? tagsRaw : (tagsRaw?.data ?? tagsRaw?.tags ?? []);
        setTags(tagsData);

        // Charger les types
        const typesResponse = await fetch('https://evend-multivendeur-api.onrender.com/api/types');
        if (!typesResponse.ok) {
          console.warn(`⚠️ API types a retourné ${typesResponse.status} — page affichée sans types`);
          setTypes([]);
        } else {
          const typesRaw = await typesResponse.json();
          const typesData = Array.isArray(typesRaw) ? typesRaw : (typesRaw?.data ?? typesRaw?.types ?? []);
          setTypes(typesData);
          log.admin('Données chargées', `${tagsData.length} tags, ${typesData.length} types`, {});
        }
      } catch (err) {
        console.error('Erreur chargement données:', err);
        log.erreur('Erreur chargement données', err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    chargerDonnees();
  }, []);

  // Filtrer les éléments selon l'onglet et la recherche
  const tagsFiltres = useMemo(() => {
    return tags.filter(item => 
      item.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      item.id.toLowerCase().includes(recherche.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(recherche.toLowerCase()))
    );
  }, [tags, recherche]);

  const typesFiltres = useMemo(() => {
    return types.filter(item => 
      item.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      item.id.toLowerCase().includes(recherche.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(recherche.toLowerCase()))
    );
  }, [types, recherche]);

  const elementsFiltres = onglet === 'tags' ? tagsFiltres : typesFiltres;

  // Gestion de la sélection
  const handleSelectionTous = () => {
    if (selection.length === elementsFiltres.length) {
      setSelection([]);
    } else {
      setSelection(elementsFiltres.map(item => item.id));
    }
  };

  const handleSelection = (id: string) => {
    setSelection(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Actions groupées
  const handleActionGroupe = async (action: string) => {
    setMenuActionGroupesOuvert(false);
    if (selection.length === 0) return;

    if (action === 'activer') {
      try {
        await Promise.all(selection.map(id => 
          fetch(`https://evend-multivendeur-api.onrender.com/api/${onglet}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statut: 'actif' })
          })
        ));
        
        if (onglet === 'tags') {
          setTags(prev => prev.map(t => selection.includes(t.id) ? { ...t, statut: 'actif' } : t));
        } else {
          setTypes(prev => prev.map(t => selection.includes(t.id) ? { ...t, statut: 'actif' } : t));
        }
        
        log.admin(`${onglet === 'tags' ? 'Tags' : 'Types'} activés`, `${selection.length} élément(s) activé(s)`, { count: String(selection.length) });
        setSelection([]);
      } catch (err) {
        console.error('Erreur activation:', err);
        log.erreur('Erreur activation', err instanceof Error ? err.message : 'Erreur inconnue');
      }
    } else if (action === 'desactiver') {
      try {
        await Promise.all(selection.map(id => 
          fetch(`https://evend-multivendeur-api.onrender.com/api/${onglet}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statut: 'inactif' })
          })
        ));
        
        if (onglet === 'tags') {
          setTags(prev => prev.map(t => selection.includes(t.id) ? { ...t, statut: 'inactif' } : t));
        } else {
          setTypes(prev => prev.map(t => selection.includes(t.id) ? { ...t, statut: 'inactif' } : t));
        }
        
        log.admin(`${onglet === 'tags' ? 'Tags' : 'Types'} désactivés`, `${selection.length} élément(s) désactivé(s)`, { count: String(selection.length) });
        setSelection([]);
      } catch (err) {
        console.error('Erreur désactivation:', err);
        log.erreur('Erreur désactivation', err instanceof Error ? err.message : 'Erreur inconnue');
      }
    } else if (action === 'supprimer') {
      setModalConfirmation({
        isOpen: true,
        type: 'supprimer_bulk',
        count: selection.length,
      });
    }
  };

  const handleConfirmation = async () => {
    if (modalConfirmation.type?.includes('supprimer')) {
      if (modalConfirmation.type === 'supprimer_bulk') {
        try {
          await Promise.all(selection.map(id => 
            fetch(`https://evend-multivendeur-api.onrender.com/api/${onglet}/${id}`, {
              method: 'DELETE'
            })
          ));
          
          if (onglet === 'tags') {
            setTags(prev => prev.filter(t => !selection.includes(t.id)));
          } else {
            setTypes(prev => prev.filter(t => !selection.includes(t.id)));
          }
          
          log.admin(`${onglet === 'tags' ? 'Tags' : 'Types'} supprimés`, `${selection.length} élément(s) supprimé(s)`, { count: String(selection.length) });
          setSelection([]);
        } catch (err) {
          console.error('Erreur suppression:', err);
          log.erreur('Erreur suppression', err instanceof Error ? err.message : 'Erreur inconnue');
        }
      }
    }
    setModalConfirmation({ isOpen: false, type: null });
  };

  // Création
  const handleCreerTag = async (nouveauTag: Omit<Tag, 'id' | 'dateCreation'>) => {
    try {
      const response = await fetch('https://evend-multivendeur-api.onrender.com/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nouveauTag)
      });
      if (!response.ok) throw new Error('Erreur création');
      const newTag = await response.json();
      setTags(prev => [newTag, ...prev]);
      setModalTagOuvert(false);
      log.admin('Tag créé', `Tag "${nouveauTag.nom}" créé`, {});
    } catch (err) {
      console.error('Erreur création tag:', err);
      log.erreur('Erreur création tag', err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const handleCreerType = async (nouveauType: Omit<TypeProduit, 'id' | 'dateCreation'>) => {
    try {
      const response = await fetch('https://evend-multivendeur-api.onrender.com/api/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nouveauType)
      });
      if (!response.ok) throw new Error('Erreur création');
      const newType = await response.json();
      setTypes(prev => [newType, ...prev]);
      setModalTypeOuvert(false);
      log.admin('Type créé', `Type "${nouveauType.nom}" créé`, {});
    } catch (err) {
      console.error('Erreur création type:', err);
      log.erreur('Erreur création type', err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  // Modification
  const handleModifierTag = async (id: string, updatedTag: Partial<Tag>) => {
    try {
      const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTag)
      });
      if (!response.ok) throw new Error('Erreur modification');
      const updated = await response.json();
      setTags(prev => prev.map(t => t.id === id ? updated : t));
      setModalTagModifier({ isOpen: false, tag: null });
      log.admin('Tag modifié', `Tag "${updatedTag.nom}" modifié`, { id: String(id) });
    } catch (err) {
      console.error('Erreur modification tag:', err);
      log.erreur('Erreur modification tag', err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const handleModifierType = async (id: string, updatedType: Partial<TypeProduit>) => {
    try {
      const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedType)
      });
      if (!response.ok) throw new Error('Erreur modification');
      const updated = await response.json();
      setTypes(prev => prev.map(t => t.id === id ? updated : t));
      setModalTypeModifier({ isOpen: false, type: null });
      log.admin('Type modifié', `Type "${updatedType.nom}" modifié`, { id: String(id) });
    } catch (err) {
      console.error('Erreur modification type:', err);
      log.erreur('Erreur modification type', err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  // Changer statut individuel
  const handleChangerStatut = async (item: Tag | TypeProduit, nouveauStatut: 'actif' | 'inactif') => {
    try {
      const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/${onglet}/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: nouveauStatut })
      });
      if (!response.ok) throw new Error('Erreur changement statut');

      if (onglet === 'tags') {
        setTags(prev => prev.map(t => t.id === item.id ? { ...t, statut: nouveauStatut } : t));
      } else {
        setTypes(prev => prev.map(t => t.id === item.id ? { ...t, statut: nouveauStatut } : t));
      }

      log.admin(
        nouveauStatut === 'actif' ? 'Élément activé' : 'Élément désactivé',
        `${onglet === 'tags' ? 'Tag' : 'Type'} "${item.nom}" ${nouveauStatut === 'actif' ? 'activé' : 'désactivé'}`,
        { id: String(item.id) }
      );
    } catch (err) {
      console.error('Erreur changement statut:', err);
      log.erreur('Erreur changement statut', err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  // Supprimer individuel
  const handleSupprimerUnitaire = async (item: Tag | TypeProduit) => {
    setSelection([item.id]);
    setModalConfirmation({
      isOpen: true,
      type: 'supprimer',
      count: 1,
    });
  };

  // Import/Export CSV
  const handleExportCSV = () => {
    const data = onglet === 'tags' ? tags : types;
    const headers = onglet === 'tags' 
      ? ['ID', 'Nom', 'Description', 'Statut']
      : ['ID', 'Nom', 'Description', 'Statut'];
    
    const csvData = data.map(item => {
      if (onglet === 'tags') {
        const t = item as Tag;
        return [t.id, t.nom, t.description || '', t.statut];
      } else {
        const t = item as TypeProduit;
        return [t.id, t.nom, t.description || '', t.statut];
      }
    });
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${onglet}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleImportCSV = async (file: File) => {
    console.log(`Import ${onglet}:`, file.name);
    setModalImportOuvert(false);
    log.admin('Import CSV', `${onglet === 'tags' ? 'Tags' : 'Types'} importés`, { fichier: file.name });
  };

  // Fermer le menu d'actions groupées
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuActionRef.current && !menuActionRef.current.contains(e.target as Node)) {
        setMenuActionGroupesOuvert(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: THEME.textLight }}>Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', backgroundColor: THEME.bg, minHeight: '100vh' }}>
      
      {/* Modals */}
      <ModalCreerTag
        isOpen={modalTagOuvert}
        onClose={() => setModalTagOuvert(false)}
        onSave={handleCreerTag}
      />

      <ModalCreerType
        isOpen={modalTypeOuvert}
        onClose={() => setModalTypeOuvert(false)}
        onSave={handleCreerType}
      />

      <ModalModifierTag
        isOpen={modalTagModifier.isOpen}
        tag={modalTagModifier.tag}
        onClose={() => setModalTagModifier({ isOpen: false, tag: null })}
        onSave={handleModifierTag}
      />

      <ModalModifierType
        isOpen={modalTypeModifier.isOpen}
        type={modalTypeModifier.type}
        onClose={() => setModalTypeModifier({ isOpen: false, type: null })}
        onSave={handleModifierType}
      />

      <ModalImportCSV
        isOpen={modalImportOuvert}
        type={onglet}
        onConfirm={handleImportCSV}
        onCancel={() => setModalImportOuvert(false)}
      />

      <ModalConfirmation
        isOpen={modalConfirmation.isOpen}
        type={modalConfirmation.type}
        count={modalConfirmation.count}
        onConfirm={handleConfirmation}
        onCancel={() => setModalConfirmation({ isOpen: false, type: null })}
      />

      {/* En-tête */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: '22px',
          fontWeight: '800',
          margin: '0 0 4px 0',
          color: THEME.text,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Gestion des tags et types
        </h1>
        <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
          {onglet === 'tags' ? `${tags.length} tags` : `${types.length} types`} configurés
        </p>
      </div>

      {/* Onglets */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '20px',
        backgroundColor: 'white',
        borderRadius: '10px',
        border: `1px solid ${THEME.border}`,
        padding: '4px',
        width: 'fit-content',
      }}>
        <button
          onClick={() => setOnglet('tags')}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '700',
            backgroundColor: onglet === 'tags' ? THEME.accent : 'transparent',
            color: onglet === 'tags' ? 'white' : THEME.textLight,
            transition: 'all 0.15s',
          }}
        >
          🏷️ Tags ({tags.length})
        </button>
        <button
          onClick={() => setOnglet('types')}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '700',
            backgroundColor: onglet === 'types' ? THEME.accent : 'transparent',
            color: onglet === 'types' ? 'white' : THEME.textLight,
            transition: 'all 0.15s',
          }}
        >
          📦 Types ({types.length})
        </button>
      </div>

      {/* Barre d'outils */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {/* Recherche */}
        <div style={{
          flex: 1,
          minWidth: '250px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'white',
          border: `1px solid ${THEME.border}`,
          borderRadius: '8px',
          padding: '0 12px',
        }}>
          <span style={{ color: THEME.textLight, marginRight: '8px' }}>🔍</span>
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder={`Rechercher un ${onglet === 'tags' ? 'tag' : 'type'}...`}
            style={{
              border: 'none',
              outline: 'none',
              padding: '10px 0',
              width: '100%',
              fontSize: '13px',
            }}
          />
        </div>

        {/* Menu d'actions groupées */}
        <div style={{ position: 'relative' }} ref={menuActionRef}>
          <button
            onClick={() => selection.length > 0 && setMenuActionGroupesOuvert(!menuActionGroupesOuvert)}
            style={{
              backgroundColor: selection.length > 0 ? THEME.accent : '#f0f0f0',
              color: selection.length > 0 ? 'white' : THEME.textLight,
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: selection.length > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            disabled={selection.length === 0}
          >
            Actions ({selection.length}) ▼
          </button>

          {menuActionGroupesOuvert && selection.length > 0 && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '45px',
              backgroundColor: 'white',
              border: `1px solid ${THEME.border}`,
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              zIndex: 100,
              minWidth: '200px',
            }}>
              <div style={{ padding: '4px 0' }}>
                <MenuItem onClick={() => handleActionGroupe('activer')} style={{ color: THEME.success }}>
                  ✅ Activer
                </MenuItem>
                <MenuItem onClick={() => handleActionGroupe('desactiver')} style={{ color: THEME.warning }}>
                  ⚠️ Désactiver
                </MenuItem>
                <div style={{ height: '1px', backgroundColor: THEME.border, margin: '4px 0' }} />
                <MenuItem onClick={() => handleActionGroupe('supprimer')} style={{ color: THEME.danger }}>
                  🗑️ Supprimer
                </MenuItem>
              </div>
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <button
          onClick={() => setModalImportOuvert(true)}
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
          📤 Importer CSV
        </button>

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
          onClick={() => onglet === 'tags' ? setModalTagOuvert(true) : setModalTypeOuvert(true)}
          style={{
            backgroundColor: THEME.accent,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          + Créer un {onglet === 'tags' ? 'tag' : 'type'}
        </button>
      </div>

      {/* Tableau */}
      <div style={{
        backgroundColor: THEME.card,
        borderRadius: '12px',
        border: `1px solid ${THEME.border}`,
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{
                borderBottom: `2px solid ${THEME.accent}`,
                backgroundColor: '#f8fafc',
              }}>
                <th style={{ padding: '13px 16px', width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selection.length === elementsFiltres.length && elementsFiltres.length > 0}
                    onChange={handleSelectionTous}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </th>
                <th style={{ padding: '13px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  ID
                </th>
                <th style={{ padding: '13px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  {onglet === 'tags' ? 'Tag' : 'Type'}
                </th>
                <th style={{ padding: '13px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  Description
                </th>
                <th style={{ padding: '13px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  Statut
                </th>
                <th style={{ padding: '13px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  Date création
                </th>
                <th style={{ padding: '13px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {elementsFiltres.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: THEME.textLight, fontSize: '14px' }}>
                    Aucun {onglet === 'tags' ? 'tag' : 'type'} trouvé
                  </td>
                </tr>
              ) : (
                elementsFiltres.map((item, index) => {
                  const isTag = onglet === 'tags';
                  const tag = item as Tag;
                  const type = item as TypeProduit;
                  
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: `1px solid #f5f5f5`,
                        backgroundColor: selection.includes(item.id) ? THEME.accentLight : (index % 2 === 0 ? 'white' : '#fafafa'),
                      }}
                    >
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selection.includes(item.id)}
                          onChange={() => handleSelection(item.id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <code style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: THEME.accent }}>
                          {item.id}
                        </code>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: THEME.text }}>
                        {item.nom}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: THEME.textLight }}>
                        {item.description || '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: item.statut === 'actif' ? THEME.successLight : '#f1f5f9',
                          color: item.statut === 'actif' ? THEME.success : THEME.textLight,
                        }}>
                          {item.statut === 'actif' ? '✓ Actif' : '✗ Inactif'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: THEME.textLight }}>
                        {item.dateCreation}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => {
                              if (isTag) {
                                setModalTagModifier({ isOpen: true, tag: tag });
                              } else {
                                setModalTypeModifier({ isOpen: true, type: type });
                              }
                            }}
                            style={{
                              backgroundColor: THEME.accentLight,
                              color: THEME.accent,
                              border: `1px solid ${THEME.accent}`,
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                            }}
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            onClick={() => handleChangerStatut(item, item.statut === 'actif' ? 'inactif' : 'actif')}
                            style={{
                              backgroundColor: item.statut === 'actif' ? THEME.warningLight : THEME.successLight,
                              color: item.statut === 'actif' ? THEME.warning : THEME.success,
                              border: `1px solid ${item.statut === 'actif' ? THEME.warning : THEME.success}`,
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                            }}
                          >
                            {item.statut === 'actif' ? '🚫 Désactiver' : '✅ Activer'}
                          </button>
                          <button
                            onClick={() => handleSupprimerUnitaire(item)}
                            style={{
                              backgroundColor: THEME.dangerLight,
                              color: THEME.danger,
                              border: `1px solid ${THEME.danger}`,
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                            }}
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pied de tableau */}
      <div style={{
        marginTop: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '13px',
        color: THEME.textLight,
      }}>
        <div>
          {elementsFiltres.length} {onglet === 'tags' ? 'tag' : 'type'}
          {elementsFiltres.length > 1 ? 's' : ''} affiché{elementsFiltres.length > 1 ? 's' : ''}
        </div>
        <div>
          {selection.length} sélectionné{selection.length > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

// Composant helper pour les items du menu
function MenuItem({ children, onClick, style = {} }: {
  children: React.ReactNode;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '8px 14px',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        fontSize: '12px',
        color: '#1a2332',
        transition: 'background-color 0.2s',
        whiteSpace: 'nowrap',
        ...style
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      {children}
    </button>
  );
}
