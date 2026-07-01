import React, { useState } from 'react';

interface Signalement {
  id: number;
  vendeur_id: number;
  vendeur_nom: string;
  vendeur_boutique: string;
  signaleur_nom: string;
  signaleur_email: string;
  categorie: string;
  raison: string;
  preuve_url: string | null;
  statut: 'nouveau' | 'vu' | 'traite' | 'rejete';
  note_admin: string | null;
  traite_par: string | null;
  date_traitement: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  signalement: Signalement;
  onClose: () => void;
  onUpdateStatut: (id: number, nouveauStatut: string, noteAdmin?: string) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  categorieLabels: { [key: string]: string };
  statutLabels: { [key: string]: string };
}

const THEME = {
  accent: '#2d6a9f',
  accentLight: '#e8f2fb',
  border: '#e1e4e8',
  text: '#1a2332',
  textLight: '#6b7280',
  danger: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',
  card: '#ffffff',
};

export default function SignalementDetails({ 
  signalement, 
  onClose, 
  onUpdateStatut, 
  onDelete,
  categorieLabels,
  statutLabels 
}: Props) {
  
  const [nouveauStatut, setNouveauStatut] = useState(signalement.statut);
  const [noteAdmin, setNoteAdmin] = useState(signalement.note_admin || '');
  const [loading, setLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const getCategorieIcon = (categorie: string) => {
    switch(categorie) {
      case 'produit_fake': return '🕵️';
      case 'arnaque': return '💰';
      case 'comportement': return '😤';
      case 'livraison': return '📦';
      case 'qualite': return '⭐';
      default: return '🚩';
    }
  };

  const getPrioriteFromCategorie = (categorie: string): 'basse' | 'moyenne' | 'haute' | 'critique' => {
    switch(categorie) {
      case 'arnaque': return 'critique';
      case 'produit_fake': return 'haute';
      case 'comportement': return 'moyenne';
      default: return 'basse';
    }
  };

  const priorite = getPrioriteFromCategorie(signalement.categorie);
  
  const prioriteColors = {
    basse: '#6b7280',
    moyenne: '#3b82f6',
    haute: '#f97316',
    critique: '#ef4444'
  };

  const statutColors = {
    nouveau: '#3b82f6',
    vu: '#f59e0b',
    traite: '#10b981',
    rejete: '#6b7280'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nouveauStatut === signalement.statut && !noteAdmin) {
      onClose();
      return;
    }
    
    setLoading(true);
    try {
      await onUpdateStatut(signalement.id, nouveauStatut, noteAdmin);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setLoading(true);
    try {
      await onDelete(signalement.id);
      setShowConfirmDelete(false);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${THEME.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: prioriteColors[priorite] + '20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              {getCategorieIcon(signalement.categorie)}
            </div>
            <div>
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                margin: '0 0 4px 0',
                color: THEME.text
              }}>
                {categorieLabels[signalement.categorie] || 'Signalement'} #{signalement.id}
              </h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{
                  backgroundColor: statutColors[signalement.statut] + '20',
                  color: statutColors[signalement.statut],
                  padding: '2px 8px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {statutLabels[signalement.statut]}
                </span>
                <span style={{
                  backgroundColor: prioriteColors[priorite] + '20',
                  color: prioriteColors[priorite],
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '700',
                  textTransform: 'uppercase'
                }}>
                  {priorite}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#666',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ×
          </button>
        </div>

        {/* Contenu */}
        <div style={{ padding: '24px' }}>
          
          {/* Infos du signalement */}
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: '700', 
              margin: '0 0 16px 0',
              color: THEME.text,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              📋 Détails du signalement
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '12px', color: THEME.textLight, margin: '0 0 4px 0' }}>Signaleur</p>
                <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>
                  {signalement.signaleur_nom || 'Anonyme'}
                </p>
                {signalement.signaleur_email && (
                  <p style={{ fontSize: '12px', color: THEME.textLight, margin: '4px 0 0 0' }}>
                    {signalement.signaleur_email}
                  </p>
                )}
              </div>

              <div>
                <p style={{ fontSize: '12px', color: THEME.textLight, margin: '0 0 4px 0' }}>Vendeur concerné</p>
                <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>
                  {signalement.vendeur_nom}
                </p>
                <p style={{ fontSize: '12px', color: THEME.textLight, margin: '4px 0 0 0' }}>
                  🏪 {signalement.vendeur_boutique}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '12px', color: THEME.textLight, margin: '0 0 4px 0' }}>Date du signalement</p>
                <p style={{ fontSize: '14px', margin: 0 }}>
                  {formatDate(signalement.created_at)}
                </p>
              </div>

              {signalement.date_traitement && (
                <div>
                  <p style={{ fontSize: '12px', color: THEME.textLight, margin: '0 0 4px 0' }}>Date de traitement</p>
                  <p style={{ fontSize: '14px', margin: 0 }}>
                    {formatDate(signalement.date_traitement)}
                  </p>
                </div>
              )}

              {signalement.traite_par && (
                <div>
                  <p style={{ fontSize: '12px', color: THEME.textLight, margin: '0 0 4px 0' }}>Traité par</p>
                  <p style={{ fontSize: '14px', margin: 0 }}>
                    {signalement.traite_par}
                  </p>
                </div>
              )}

              {signalement.preuve_url && (
                <div>
                  <p style={{ fontSize: '12px', color: THEME.textLight, margin: '0 0 4px 0' }}>Pièce jointe</p>
                  <a 
                    href={signalement.preuve_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      color: THEME.accent,
                      fontSize: '14px',
                      textDecoration: 'none'
                    }}
                  >
                    📎 Voir la pièce jointe
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Description détaillée */}
          <div style={{
            backgroundColor: 'white',
            border: `1px solid ${THEME.border}`,
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: '700', 
              margin: '0 0 12px 0',
              color: THEME.text
            }}>
              📝 Description
            </h3>
            <p style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: THEME.text,
              margin: 0,
              whiteSpace: 'pre-wrap',
              backgroundColor: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              border: `1px solid ${THEME.border}`
            }}>
              {signalement.raison || 'Aucune description fournie'}
            </p>
          </div>

          {/* Formulaire de traitement */}
          <form onSubmit={handleSubmit} style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: '700', 
              margin: '0 0 16px 0',
              color: THEME.text,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ⚙️ Traitement du signalement
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: '600',
                color: THEME.text
              }}>
                Modifier le statut
              </label>
              <select
                value={nouveauStatut}
                onChange={(e) => setNouveauStatut(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="nouveau">🆕 Nouveau</option>
                <option value="vu">👁️ Vu / En cours</option>
                <option value="traite">✅ Traité / Résolu</option>
                <option value="rejete">❌ Rejeté</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: '600',
                color: THEME.text
              }}>
                Note administrative
              </label>
              <textarea
                value={noteAdmin}
                onChange={(e) => setNoteAdmin(e.target.value)}
                placeholder="Ajoutez une note interne sur le traitement de ce signalement..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  backgroundColor: 'white',
                  color: THEME.text,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: THEME.accent,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>

          {/* Bouton suppression (admin seulement) */}
          {onDelete && (
            <div style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: '20px' }}>
              {!showConfirmDelete ? (
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  style={{
                    backgroundColor: 'white',
                    color: THEME.danger,
                    border: `1px solid ${THEME.danger}`,
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>🗑️</span>
                  Supprimer ce signalement
                </button>
              ) : (
                <div style={{
                  backgroundColor: '#fee2e2',
                  border: `1px solid ${THEME.danger}`,
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <p style={{ fontSize: '14px', color: THEME.danger, margin: '0 0 12px 0', fontWeight: '600' }}>
                    ⚠️ Êtes-vous sûr de vouloir supprimer ce signalement ?
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setShowConfirmDelete(false)}
                      style={{
                        backgroundColor: 'white',
                        color: THEME.text,
                        border: `1px solid ${THEME.border}`,
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      style={{
                        backgroundColor: THEME.danger,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: loading ? 'wait' : 'pointer',
                        opacity: loading ? 0.7 : 1
                      }}
                    >
                      {loading ? 'Suppression...' : 'Oui, supprimer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
