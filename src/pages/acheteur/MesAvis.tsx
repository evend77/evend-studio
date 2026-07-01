/**
 * MesAvis.tsx
 * src/pages/acheteur/MesAvis.tsx
 * Page des avis pour l'acheteur - Design WOW!
 */

import React, { useState, useEffect } from 'react';

// Types
interface Avis {
  id: string;
  produitId: string;
  produitNom: string;
  produitImage: string;
  produitPrix: string;
  commandeId: string;
  dateAchat: string;
  vendeur: string;
  vendeurId: string;
  note: number;
  commentaire: string;
  dateAvis: string;
  dateModification?: string;
  reponseVendeur?: {
    date: string;
    message: string;
  };
  medias?: string[];
}

interface ProduitAAvis {
  id: string;
  nom: string;
  image: string;
  prix: string;
  commandeId: string;
  dateAchat: string;
  vendeur: string;
  vendeurId: string;
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
};

// Helper pour récupérer le token
const getAuthToken = () => {
  return localStorage.getItem('token') || '';
};

// ============================================================================
// POPUP POUR ÉCRIRE/MODIFIER UN AVIS (AVEC UPLOAD PHOTOS RÉEL)
// ============================================================================
const AvisPopup = ({ 
  produit, 
  avisExistant, 
  onClose, 
  onSave 
}: { 
  produit?: ProduitAAvis; 
  avisExistant?: Avis; 
  onClose: () => void; 
  onSave: (note: number, commentaire: string, medias?: string[]) => void;
}) => {
  const [note, setNote] = useState(avisExistant?.note || 0);
  const [commentaire, setCommentaire] = useState(avisExistant?.commentaire || '');
  const [hoverNote, setHoverNote] = useState(0);
  const [medias, setMedias] = useState<string[]>(avisExistant?.medias || []);
  const [uploading, setUploading] = useState(false);

  const titre = avisExistant ? 'Modifier mon avis' : 'Écrire un avis';
  const nomProduit = avisExistant?.produitNom || produit?.nom || '';

  // Upload d'une photo vers S3
  const uploadPhoto = async (file: File): Promise<string | null> => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await fetch('/api/avis-produits/upload-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        return data.url;
      } else {
        alert(data.message || 'Erreur upload');
        return null;
      }
    } catch (error) {
      console.error('Upload erreur:', error);
      alert('Erreur réseau lors de l\'upload');
      return null;
    }
  };

  // Gestion sélection de fichiers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (medias.length + files.length > 5) {
      alert('Maximum 5 photos par avis');
      return;
    }

    setUploading(true);
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert(`"${file.name}" n'est pas une image`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`"${file.name}" dépasse 5 MB`);
        continue;
      }
      const url = await uploadPhoto(file);
      if (url) {
        setMedias(prev => [...prev, url]);
      }
    }
    setUploading(false);
    e.target.value = '';
  };

  // Supprimer une photo
  const removePhoto = (index: number) => {
    setMedias(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (note === 0) {
      alert('Veuillez sélectionner une note');
      return;
    }
    if (commentaire.trim().length < 5) {
      alert('Veuillez écrire un commentaire plus long (minimum 5 caractères)');
      return;
    }
    onSave(note, commentaire, medias);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(5px)',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      
      <div style={{
        width: '100%',
        maxWidth: '550px',
        background: '#1a1f2e',
        borderRadius: '24px',
        border: `1px solid ${C.border}`,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      }}>
        {/* En-tête avec dégradé */}
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${C.border}`,
          background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
                {titre}
              </h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', opacity: 0.8 }}>✕</button>
            </div>
          </div>
        </div>

        {/* Corps */}
        <div style={{ padding: '24px' }}>
          
          {/* Produit */}
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: `1px solid ${C.border}`, 
            borderRadius: '16px', 
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${C.amber}30, ${C.amber}10)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {(() => {
                const imageUrl = avisExistant?.produitImage || produit?.image;
                if (imageUrl && imageUrl.startsWith('http')) {
                  return (
                    <img 
                      src={imageUrl} 
                      alt={nomProduit}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.parentElement) {
                          e.currentTarget.parentElement.innerHTML = '<span style="font-size:36px">📦</span>';
                        }
                      }}
                    />
                  );
                }
                return <span style={{ fontSize: '36px' }}>{imageUrl || '📦'}</span>;
              })()}
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: '#fff' }}>{nomProduit}</p>
              <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>
                {avisExistant ? `Avis publié le ${avisExistant.dateAvis}` : `Commande ${produit?.commandeId} · ${produit?.dateAchat}`}
              </p>
            </div>
          </div>

          {/* Étoiles de notation */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 600, color: '#fff' }}>
              Votre note <span style={{ color: C.amber }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setNote(star)}
                  onMouseEnter={() => setHoverNote(star)}
                  onMouseLeave={() => setHoverNote(0)}
                  style={{
                    fontSize: '42px',
                    cursor: 'pointer',
                    color: (hoverNote || note) >= star ? C.yellow : 'rgba(255,255,255,0.2)',
                    transition: 'color 0.2s',
                    textShadow: (hoverNote || note) >= star ? `0 0 10px ${C.yellow}80` : 'none',
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            {note > 0 && (
              <p style={{ margin: '12px 0 0', fontSize: '14px', color: C.yellow, textAlign: 'center', fontWeight: 600 }}>
                {note === 5 && 'Excellent! 😍 Vous avez adoré'}
                {note === 4 && 'Très bien! 😊 Vous êtes satisfait'}
                {note === 3 && 'Correct 👍 Produit acceptable'}
                {note === 2 && 'Décevant ☹️ Vous êtes déçu'}
                {note === 1 && 'Mauvais 😠 Très insatisfait'}
              </p>
            )}
          </div>

          {/* Commentaire */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#fff' }}>
              Votre commentaire <span style={{ color: C.amber }}>*</span>
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Partagez votre expérience avec ce produit... (qualité, service, délais, etc.)"
              rows={5}
              style={{
                width: '100%',
                padding: '14px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${C.border}`,
                borderRadius: '14px',
                color: '#fff',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none',
              }}
            />
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: C.textLight }}>
              {commentaire.length} caractères (minimum 5)
            </p>
          </div>

          {/* Upload de photos */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#fff' }}>
              Ajouter des photos (max 5) {uploading && <span style={{ color: C.amber }}>⏳ Upload en cours...</span>}
            </label>
            <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
            }}>
              {medias.map((media, index) => (
                <div key={index} style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '12px',
                  background: '#1a1f2e',
                  border: `1px solid ${C.border}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <img 
                    src={media} 
                    alt={`Photo ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <button 
                    onClick={() => removePhoto(index)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: C.red,
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >✕</button>
                </div>
              ))}
              
              {medias.length < 5 && (
                <label style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px dashed ${C.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: C.textLight,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.borderColor = C.amber;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = C.border;
                }}>
                  +
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileSelect}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '11px', color: C.textLight }}>
              Formats: JPG, PNG, WEBP (max 5 MB par photo)
            </p>
          </div>

          {/* Note sur l'utilisation des données */}
          <div style={{
            background: 'rgba(59,130,246,0.1)',
            border: `1px solid ${C.blue}40`,
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '24px',
            fontSize: '12px',
            color: C.textLight,
            lineHeight: '1.6',
          }}>
            📋 Comment nous utilisons vos données : Nous vous contacterons uniquement au sujet de l'avis que vous avez laissé, 
            et seulement si nécessaire. En soumettant votre avis, vous acceptez les Termes et conditions.
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${C.border}`,
                borderRadius: '14px',
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
              disabled={uploading}
              style={{
                flex: 1,
                padding: '14px',
                background: uploading ? 'linear-gradient(135deg, #6b7280, #4b5563)' : `linear-gradient(135deg, ${C.amber}, ${C.orange})`,
                border: 'none',
                borderRadius: '14px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: uploading ? 'not-allowed' : 'pointer',
                boxShadow: uploading ? 'none' : `0 10px 20px -10px ${C.orange}80`,
                opacity: uploading ? 0.6 : 1,
              }}
            >
              {uploading ? 'Upload en cours...' : (avisExistant ? 'Mettre à jour' : 'Publier mon avis')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CARTE D'AVIS EXISTANT
// ============================================================================
const AvisCard = ({ avis, onModifier, onSupprimer, onVoirProduit, onVoirVendeur }: { 
  avis: Avis; 
  onModifier: () => void;
  onSupprimer: () => void;
  onVoirProduit: () => void;
  onVoirVendeur: () => void;
}) => {
  return (
    <div
      style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: '20px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        boxShadow: '0 10px 30px -15px rgba(0,0,0,0.5)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 20px 40px -15px rgba(0,0,0,0.7)';
        e.currentTarget.style.borderColor = `${C.amber}80`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 10px 30px -15px rgba(0,0,0,0.5)';
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      {/* En-tête avec image */}
      <div style={{
        background: `linear-gradient(135deg, ${C.amber}30, ${C.orange}10)`,
        padding: '20px 20px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: 'pointer',
      }} onClick={onVoirProduit}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {avis.produitImage && avis.produitImage.startsWith('http') ? (
            <img 
              src={avis.produitImage} 
              alt={avis.produitNom}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.innerHTML = '<span style="font-size:40px">📦</span>';
                }
              }}
            />
          ) : (
            <span style={{ fontSize: '40px' }}>{avis.produitImage || '📦'}</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
            {avis.produitNom}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '13px', color: C.textLight }}>🏪 {avis.vendeur}</span>
            <span style={{ fontSize: '11px', color: C.textLight }}>•</span>
            <span style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>{avis.produitPrix}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <span key={s} style={{ fontSize: '14px', color: s <= avis.note ? C.yellow : 'rgba(255,255,255,0.2)' }}>★</span>
              ))}
            </div>
            <span style={{ fontSize: '11px', color: C.textLight }}>Publié le {avis.dateAvis}</span>
            {avis.dateModification && (
              <span style={{ fontSize: '10px', color: C.textLight }}>(modifié)</span>
            )}
          </div>
        </div>
      </div>

      {/* Commentaire */}
      <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#fff', lineHeight: '1.6', fontStyle: 'italic' }}>
          "{avis.commentaire}"
        </p>

        {/* Médias - VRAIES IMAGES */}
        {avis.medias && avis.medias.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            {avis.medias.map((media, index) => (
              <div key={index} style={{
                width: '60px',
                height: '60px',
                borderRadius: '10px',
                background: C.amberLight,
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={() => window.open(media, '_blank')}>
                <img 
                  src={media} 
                  alt={`Photo ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Réponse du vendeur */}
        {avis.reponseVendeur && (
          <div style={{
            marginTop: '16px',
            padding: '14px',
            background: 'rgba(59,130,246,0.1)',
            borderRadius: '12px',
            borderLeft: `3px solid ${C.blue}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ color: C.blue, fontSize: '12px', fontWeight: 700 }}>🏪 Réponse du vendeur</span>
              <span style={{ fontSize: '10px', color: C.textLight }}>{avis.reponseVendeur.date}</span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>{avis.reponseVendeur.message}</p>
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      <div style={{
        padding: '12px 20px 16px',
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        gap: '10px',
      }}>
        <button
          onClick={onModifier}
          style={{
            flex: 1,
            padding: '10px',
            background: C.amberLight,
            border: `1px solid ${C.amber}40`,
            borderRadius: '10px',
            color: C.amber,
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = `${C.amber}30`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = C.amberLight;
          }}
        >
          ✏️ Modifier
        </button>
        <button
          onClick={onSupprimer}
          style={{
            flex: 1,
            padding: '10px',
            background: C.roseLight,
            border: `1px solid ${C.rose}40`,
            borderRadius: '10px',
            color: C.rose,
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = C.redLight;
            e.currentTarget.style.color = C.red;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = C.roseLight;
            e.currentTarget.style.color = C.rose;
          }}
        >
          🗑️ Supprimer
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// CARTE DE PRODUIT À ÉVALUER
// ============================================================================
const ProduitAEvaluerCard = ({ produit, onEcrireAvis }: { 
  produit: ProduitAAvis; 
  onEcrireAvis: () => void;
}) => {
  return (
    <div
      style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: '18px',
        padding: '18px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        e.currentTarget.style.transform = 'translateX(5px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = C.cardBg;
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      <div style={{
        width: '70px',
        height: '70px',
        borderRadius: '16px',
        background: `linear-gradient(135deg, ${C.green}30, ${C.green}10)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {produit.image && produit.image.startsWith('http') ? (
          <img 
            src={produit.image} 
            alt={produit.nom}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.parentElement) {
                e.currentTarget.parentElement.innerHTML = '<span style="font-size:32px">📦</span>';
              }
            }}
          />
        ) : (
          <span style={{ fontSize: '32px' }}>{produit.image || '📦'}</span>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: '#fff' }}>{produit.nom}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <span style={{ fontSize: '12px', color: C.textLight }}>Commande {produit.commandeId}</span>
          <span style={{ fontSize: '11px', color: C.textLight }}>•</span>
          <span style={{ fontSize: '12px', color: C.textLight }}>{produit.dateAchat}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{produit.prix}</span>
          <span style={{ fontSize: '11px', color: C.textLight }}>🏪 {produit.vendeur}</span>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onEcrireAvis();
        }}
        style={{
          padding: '10px 16px',
          background: C.greenLight,
          border: `1px solid ${C.green}40`,
          borderRadius: '12px',
          color: C.green,
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        ✍️ Écrire un avis
      </button>
    </div>
  );
};

// ============================================================================
// POPUP DE CONFIRMATION SUPPRESSION
// ============================================================================
const ConfirmationPopup = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(5px)',
    }} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#1a1f2e',
        borderRadius: '24px',
        border: `1px solid ${C.border}`,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${C.border}`,
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>Supprimer l'avis</h2>
        </div>
        <div style={{ padding: '24px' }}>
          <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#fff' }}>
            Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est irréversible.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${C.border}`,
                borderRadius: '12px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: '12px',
                background: C.redLight,
                border: `1px solid ${C.red}40`,
                borderRadius: '12px',
                color: C.red,
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export default function MesAvis({ naviguer }: { naviguer: (page: string, props?: any) => void }) {
  const [avis, setAvis] = useState<Avis[]>([]);
  const [produitsAEvaluer, setProduitsAEvaluer] = useState<ProduitAAvis[]>([]);
  const [onglet, setOnglet] = useState<'mes_avis' | 'a_evaluer'>('mes_avis');
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(true);
  const [avisPopup, setAvisPopup] = useState<{ produit?: ProduitAAvis; avis?: Avis } | null>(null);
  const [avisASupprimer, setAvisASupprimer] = useState<Avis | null>(null);

  // Chargement des données
  useEffect(() => {
    fetchDonnees();
  }, []);

  const fetchDonnees = async () => {
    setLoading(true);
    const token = getAuthToken();
    
    try {
      // Récupérer les avis existants
      const avisRes = await fetch('/api/avis-produits/mes-avis', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const avisData = await avisRes.json();
      
      if (avisData.success) {
        const avisFormatted: Avis[] = avisData.avis.map((a: any) => ({
          id: String(a.id),
          produitId: String(a.produit_id),
          produitNom: a.produit_nom,
          produitImage: a.produit_image || '📦',
          produitPrix: `${Number(a.produit_prix).toFixed(2)} $`,
          commandeId: `#${a.commande_id}`,
          dateAchat: new Date(a.date_achat).toLocaleDateString('fr-CA'),
          vendeur: a.vendeur_nom,
          vendeurId: String(a.vendeur_id),
          note: a.note,
          commentaire: a.commentaire,
          dateAvis: new Date(a.date_avis).toLocaleDateString('fr-CA'),
          dateModification: a.date_modification ? new Date(a.date_modification).toLocaleDateString('fr-CA') : undefined,
          reponseVendeur: a.reponse_vendeur ? {
            date: new Date(a.date_reponse_vendeur).toLocaleDateString('fr-CA'),
            message: a.reponse_vendeur
          } : undefined,
          medias: a.photos || []
        }));
        setAvis(avisFormatted);
      }

      // Récupérer les produits à évaluer
      const aEvaluerRes = await fetch('/api/avis-produits/a-evaluer', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const aEvaluerData = await aEvaluerRes.json();
      
      if (aEvaluerData.success) {
        const produitsFormatted: ProduitAAvis[] = aEvaluerData.produits.map((p: any) => ({
          id: String(p.produit_id),
          nom: p.produit_nom,
          image: p.image || '📦',
          prix: `${Number(p.prix).toFixed(2)} $`,
          commandeId: `#${p.commande_id}`,
          dateAchat: new Date(p.date_achat).toLocaleDateString('fr-CA'),
          vendeur: p.vendeur_nom,
          vendeurId: String(p.vendeur_id)
        }));
        setProduitsAEvaluer(produitsFormatted);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  // Statistiques
  const totalAvis = avis.length;
  const noteMoyenne = avis.length > 0 ? (avis.reduce((acc, a) => acc + a.note, 0) / avis.length).toFixed(1) : '0';
  const reponsesVendeur = avis.filter(a => a.reponseVendeur).length;
  const aEvaluerCount = produitsAEvaluer.length;

  const avisFiltres = avis.filter(a => 
    a.produitNom.toLowerCase().includes(recherche.toLowerCase()) ||
    a.vendeur.toLowerCase().includes(recherche.toLowerCase()) ||
    a.commentaire.toLowerCase().includes(recherche.toLowerCase())
  );

  const produitsFiltres = produitsAEvaluer.filter(p =>
    p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    p.vendeur.toLowerCase().includes(recherche.toLowerCase())
  );

  const handleSaveAvis = async (note: number, commentaire: string, medias?: string[]) => {
    const token = getAuthToken();
    
    try {
      if (avisPopup?.avis) {
        const res = await fetch(`/api/avis-produits/${avisPopup.avis.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ note, commentaire, photos: medias || [] })
        });
        const data = await res.json();
        if (data.success) {
          await fetchDonnees();
        } else {
          alert(data.message || 'Erreur lors de la modification');
        }
      } else if (avisPopup?.produit) {
        const res = await fetch('/api/avis-produits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            produit_id: parseInt(avisPopup.produit.id),
            commande_id: parseInt(avisPopup.produit.commandeId.replace('#', '')),
            note,
            commentaire,
            photos: medias || []
          })
        });
        const data = await res.json();
        if (data.success) {
          await fetchDonnees();
        } else {
          alert(data.message || 'Erreur lors de la publication');
        }
      }
    } catch (error) {
      console.error('Erreur sauvegarde avis:', error);
      alert('Erreur réseau');
    }
    setAvisPopup(null);
  };

  const supprimerAvis = async () => {
    if (!avisASupprimer) return;
    
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/avis-produits/${avisASupprimer.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        await fetchDonnees();
      } else {
        alert(data.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur réseau');
    }
    setAvisASupprimer(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: C.amber, fontSize: '20px' }}>Chargement de vos avis...</div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeUp 0.5s ease' }}>
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
        borderRadius: '24px',
        padding: '32px',
        marginBottom: '32px',
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
          <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
            ⭐ Mes avis
          </h1>
          <p style={{ margin: 0, fontSize: '16px', color: 'rgba(255,255,255,0.8)', maxWidth: '500px' }}>
            Partagez votre expérience et aidez d'autres acheteurs à faire leur choix.
          </p>
          
          <div style={{ display: 'flex', gap: '32px', marginTop: '24px' }}>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{totalAvis}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Avis publiés</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{noteMoyenne}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Note moyenne</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{reponsesVendeur}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Réponses reçues</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{aEvaluerCount}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>À évaluer</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        borderBottom: `1px solid ${C.border}`,
        paddingBottom: '12px',
      }}>
        <button
          onClick={() => setOnglet('mes_avis')}
          style={{
            padding: '10px 20px',
            borderRadius: '30px',
            border: 'none',
            background: onglet === 'mes_avis' ? C.amber : 'rgba(255,255,255,0.05)',
            color: onglet === 'mes_avis' ? '#fff' : C.textLight,
            fontSize: '14px',
            fontWeight: onglet === 'mes_avis' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>⭐ Mes avis</span>
          <span style={{
            background: onglet === 'mes_avis' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
            padding: '2px 8px',
            borderRadius: '20px',
            fontSize: '12px',
          }}>{totalAvis}</span>
        </button>
        <button
          onClick={() => setOnglet('a_evaluer')}
          style={{
            padding: '10px 20px',
            borderRadius: '30px',
            border: 'none',
            background: onglet === 'a_evaluer' ? C.green : 'rgba(255,255,255,0.05)',
            color: onglet === 'a_evaluer' ? '#fff' : C.textLight,
            fontSize: '14px',
            fontWeight: onglet === 'a_evaluer' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✍️ À évaluer</span>
          <span style={{
            background: onglet === 'a_evaluer' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
            padding: '2px 8px',
            borderRadius: '20px',
            fontSize: '12px',
          }}>{aEvaluerCount}</span>
        </button>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        marginBottom: '24px',
      }}>
        <input
          type="text"
          placeholder={`🔍 Rechercher dans ${onglet === 'mes_avis' ? 'mes avis' : 'produits à évaluer'}...`}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{
            padding: '12px 18px',
            borderRadius: '30px',
            border: `1px solid ${C.border}`,
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '14px',
            outline: 'none',
            width: '300px',
          }}
        />
      </div>

      {onglet === 'mes_avis' ? (
        avisFiltres.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', 
            gap: '20px',
            marginBottom: '40px'
          }}>
            {avisFiltres.map(avisItem => (
              <AvisCard
                key={avisItem.id}
                avis={avisItem}
                onModifier={() => setAvisPopup({ avis: avisItem })}
                onSupprimer={() => setAvisASupprimer(avisItem)}
                onVoirProduit={() => alert(`🔍 Détail du produit: ${avisItem.produitNom} (à configurer plus tard)`)}
                onVoirVendeur={() => alert(`🏪 Boutique: ${avisItem.vendeur} (à configurer plus tard)`)}
              />
            ))}
          </div>
        ) : (
          <div style={{ 
            padding: '60px', 
            textAlign: 'center', 
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '20px',
            border: `1px dashed ${C.border}`,
            marginBottom: '40px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📭</div>
            <p style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Aucun avis trouvé</p>
            <p style={{ color: C.textLight, fontSize: '13px' }}>Essayez de modifier votre recherche ou évaluez de nouveaux produits!</p>
          </div>
        )
      ) : (
        produitsFiltres.length > 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            marginBottom: '40px'
          }}>
            {produitsFiltres.map(produit => (
              <ProduitAEvaluerCard
                key={produit.id}
                produit={produit}
                onEcrireAvis={() => setAvisPopup({ produit })}
              />
            ))}
          </div>
        ) : (
          <div style={{ 
            padding: '60px', 
            textAlign: 'center', 
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '20px',
            border: `1px dashed ${C.border}`,
            marginBottom: '40px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🎉</div>
            <p style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Bravo! Vous avez évalué tous vos produits!</p>
            <p style={{ color: C.textLight, fontSize: '13px' }}>Revenez après vos prochains achats.</p>
          </div>
        )
      )}

      {avisPopup && (
        <AvisPopup
          produit={avisPopup.produit}
          avisExistant={avisPopup.avis}
          onClose={() => setAvisPopup(null)}
          onSave={handleSaveAvis}
        />
      )}

      {avisASupprimer && (
        <ConfirmationPopup
          onConfirm={supprimerAvis}
          onCancel={() => setAvisASupprimer(null)}
        />
      )}
    </div>
  );
}