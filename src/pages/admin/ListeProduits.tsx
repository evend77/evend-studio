import React, { useState, useMemo, useEffect, useRef } from 'react';

// Types
interface Produit {
  id: number;
  productId: string;
  sku?: string;
  image?: string;
  nom: string;
  type: string;
  vendeurNom: string;
  vendeurId: number;
  categorie: string;
  prix: number;
  quantite: number;
  typeVente: 'standard' | 'enchere';
  statut: 'actif' | 'desactive' | 'en_attente' | 'vendu';
  dateAjout: string;
  totalVentes?: number;
  note?: number;
  description?: string;
  notes?: NoteInterne[];
  shopifyUrl?: string;
}

interface NoteInterne {
  id: number;
  date: string;
  auteur: string;
  contenu: string;
}

interface ListeProduitsProps {
  onVoirProduit?: (produit: Produit) => void;
  onModifierProduit?: (produit: Produit) => void;
  onNaviguerVers?: (page: string, data?: any) => void;
}

// Type pour le tri
type TriOption = 
  | 'productId-asc' 
  | 'nom-asc' 
  | 'prix-asc' 
  | 'prix-desc' 
  | 'quantite-asc' 
  | 'quantite-desc'
  | 'vendeur-asc'
  | 'date-desc'
  | 'typeVente-asc';

// CSS Print injecté dynamiquement
const PRINT_STYLE = `
@media print {
  body > * { display: none !important; }
  #evend-produits-print { display: block !important; position: fixed; top: 0; left: 0; right: 0; background: white; padding: 20px; font-family: Arial, sans-serif; }
  @page { size: landscape; margin: 12mm 10mm; }
  table { width: 100% !important; border-collapse: collapse !important; font-size: 10px !important; }
  tr { page-break-inside: avoid; }
  th { background-color: #e8f2fb !important; color: #2d6a9f !important; font-weight: bold !important; padding: 7px 8px !important; border: 1px solid #ccc !important; text-align: left !important; font-size: 9px !important; text-transform: uppercase; }
  td { padding: 6px 8px !important; border: 1px solid #ddd !important; font-size: 10px !important; }
  tfoot td { background-color: #e8f2fb !important; font-weight: bold !important; border-top: 2px solid #2d6a9f !important; }
  tr:nth-child(even) td { background-color: #f8f8f8 !important; }
  .print-section-title { font-size: 13px !important; font-weight: bold !important; color: #2d6a9f !important; margin: 16px 0 8px 0 !important; border-left: 4px solid #2d6a9f; padding-left: 8px; display: block !important; }
  .no-print { display: none !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .statut-badge { display: inline-block !important; padding: 2px 6px !important; border-radius: 20px !important; font-size: 8px !important; font-weight: bold !important; }
  .type-vente-badge { display: inline-block !important; padding: 2px 6px !important; border-radius: 12px !important; font-size: 8px !important; font-weight: bold !important; }
}
`;

// Thème cohérent avec l'administration
const THEME = {
  sidebar:      '#1a2436',
  sidebarHover: '#243044',
  sidebarActive:'#2d6a9f',
  accent:       '#2d6a9f',
  accentLight:  '#e8f2fb',
  bg:           '#f0f2f5',
  card:         '#ffffff',
  border:       '#e1e4e8',
  text:         '#1a2332',
  textLight:    '#6b7280',
  danger:       '#dc2626',
  success:      '#16a34a',
  warning:      '#d97706',
  purple:       '#7c3aed',
};

// Types pour la modale de confirmation
type ActionType = 'desactiver' | 'supprimer' | 'activer' | 'vendre' | 'reasigner' | 'desactiver_bulk' | 'activer_bulk' | 'supprimer_bulk' | 'vendre_bulk' | 'changer_statut' | 'voir_notes' | null;

interface ModaleConfirmationProps {
  isOpen: boolean;
  type: ActionType;
  produit: Produit | null;
  produitsCount?: number;
  onConfirm: (data?: any) => void;
  onCancel: () => void;
}

// Fonction pour générer l'URL Shopify à partir du nom
const generateShopifyUrl = (nom: string, id?: number): string => {
  const slug = nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `https://e-vend.ca/products/${slug}`;
};

// Modale de notes internes
function ModalNotes({
  produit,
  onAjouterNote,
  onFermer,
}: {
  produit: Produit;
  onAjouterNote: (contenu: string) => void;
  onFermer: () => void;
}) {
  const [nouvelleNote, setNouvelleNote] = useState('');
  const [notes, setNotes] = useState<NoteInterne[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteEnSuppression, setNoteEnSuppression] = useState<number | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/notes-admin/produit/${produit.id}`);
        if (response.ok) {
          const data = await response.json();
          setNotes(data);
        } else {
          setError('Erreur lors du chargement des notes');
        }
      } catch (err) {
        console.error('Erreur chargement notes:', err);
        setError('Impossible de charger les notes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotes();
  }, [produit.id]);

  const handleAjouterNote = async () => {
    if (!nouvelleNote.trim()) return;
    
    try {
      const response = await fetch('/api/notes-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produitId: produit.id,
          contenu: nouvelleNote.trim(),
          auteur: 'Admin'
        })
      });
      
      if (response.ok) {
        const nouvelleNoteData = await response.json();
        setNotes(prev => [nouvelleNoteData, ...prev]);
        setNouvelleNote('');
        onAjouterNote(nouvelleNote.trim());
      } else {
        setError('Erreur lors de l\'ajout de la note');
      }
    } catch (err) {
      console.error('Erreur ajout note:', err);
      setError('Impossible d\'ajouter la note');
    }
  };

  const handleSupprimerNote = async (noteId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) return;
    
    setNoteEnSuppression(noteId);
    try {
      const response = await fetch(`/api/notes-admin/${noteId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
      } else {
        setError('Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur suppression note:', err);
      setError('Impossible de supprimer la note');
    } finally {
      setNoteEnSuppression(null);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onFermer()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📋</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>{produit.nom}</p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>🏪 {produit.vendeurNom} · {produit.productId}</p>
              </div>
            </div>
            <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Infos rapides */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: 'Quantité', val: produit.quantite, icon: '📦' },
              { label: 'Ventes', val: produit.totalVentes || 0, icon: '💰' },
              { label: 'Note', val: produit.note ? produit.note.toFixed(1) + ' ★' : 'N/A', icon: '⭐', alert: produit.note && produit.note < 3 },
            ].map((k, i) => (
              <div key={i} style={{ backgroundColor: k.alert ? '#fff5f5' : '#f8fafc', border: `1px solid ${k.alert ? '#fecaca' : THEME.border}`, borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
                <p style={{ fontSize: '16px', margin: '0 0 2px 0' }}>{k.icon}</p>
                <p style={{ fontSize: '16px', fontWeight: '800', color: k.alert ? THEME.danger : THEME.text, margin: '0 0 2px 0' }}>{k.val}</p>
                <p style={{ fontSize: '10px', color: THEME.textLight, margin: 0 }}>{k.label}</p>
              </div>
            ))}
          </div>

          {/* Message d'erreur */}
          {error && (
            <div style={{ backgroundColor: '#fee2e2', border: `1px solid ${THEME.danger}`, borderRadius: '8px', padding: '12px', marginBottom: '20px', color: THEME.danger }}>
              ⚠️ {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '20px', color: THEME.textLight }}>
              Chargement des notes...
            </div>
          )}

          {/* Historique des notes */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0' }}>
              📋 Historique des notes ({notes.length})
            </h4>

            {!loading && notes.length === 0 ? (
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '20px', textAlign: 'center', color: THEME.textLight, fontSize: '13px' }}>
                Aucune note pour ce produit.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notes.map(note => (
                  <div key={note.id} style={{ backgroundColor: '#f8fafc', border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '12px 14px', position: 'relative' }}>
                    <button
                      onClick={() => handleSupprimerNote(note.id)}
                      disabled={noteEnSuppression === note.id}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: THEME.textLight,
                        fontSize: '16px',
                        padding: '4px'
                      }}
                      title="Supprimer la note"
                    >
                      {noteEnSuppression === note.id ? '...' : '✕'}
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: THEME.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: 'white' }}>
                          {note.auteur?.charAt(0) || 'A'}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: THEME.text }}>{note.auteur}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: THEME.textLight }}>{note.date}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: THEME.text, margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap', paddingRight: '24px' }}>{note.contenu}</p>
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
              onClick={handleAjouterNote}
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

// Modale pour marquer comme vendu
function ModalMarquerVendu({ isOpen, produit, onConfirm, onCancel }: { 
  isOpen: boolean; 
  produit: Produit | null; 
  onConfirm: (quantite: number, prixVente: number) => void;
  onCancel: () => void;
}) {
  const [quantite, setQuantite] = useState(1);
  const [prixVente, setPrixVente] = useState(produit?.prix || 0);

  if (!isOpen || !produit) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>💰</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>Marquer comme vendu</p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>{produit.nom}</p>
              </div>
            </div>
            <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ padding: '24px' }}>
          
          {/* Info produit */}
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', border: `1px solid ${THEME.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>Stock actuel</p>
                <p style={{ fontSize: '18px', fontWeight: '800', color: produit.quantite > 0 ? THEME.success : THEME.danger, margin: '4px 0 0 0' }}>
                  {produit.quantite} unité(s)
                </p>
              </div>
              <div>
                <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>Prix unitaire</p>
                <p style={{ fontSize: '18px', fontWeight: '800', color: THEME.accent, margin: '4px 0 0 0' }}>
                  {produit.prix.toFixed(2)} $
                </p>
              </div>
            </div>
          </div>

          {/* Quantité à vendre */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>
              Quantité vendue
            </label>
            <input
              type="number"
              min="1"
              max={produit.quantite}
              value={quantite}
              onChange={(e) => setQuantite(Math.min(parseInt(e.target.value) || 1, produit.quantite))}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: `2px solid ${THEME.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <p style={{ fontSize: '11px', color: THEME.textLight, margin: '4px 0 0 0' }}>
              Maximum: {produit.quantite} unité(s)
            </p>
          </div>

          {/* Prix de vente */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>
              Prix de vente (par unité)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={prixVente}
              onChange={(e) => setPrixVente(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: `2px solid ${THEME.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Total */}
          <div style={{ backgroundColor: THEME.accentLight, borderRadius: '8px', padding: '16px', marginBottom: '20px', border: `1px solid ${THEME.accent}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: THEME.accent }}>Total de la vente</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: THEME.accent }}>{(quantite * prixVente).toFixed(2)} $</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={() => onConfirm(quantite, prixVente)}
            disabled={quantite < 1 || quantite > produit.quantite}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: (quantite >= 1 && quantite <= produit.quantite) ? 'pointer' : 'not-allowed',
              backgroundColor: (quantite >= 1 && quantite <= produit.quantite) ? THEME.success : '#cccccc',
              color: 'white',
            }}>
            ✅ Confirmer la vente
          </button>
        </div>
      </div>
    </div>
  );
}

// Modale pour réassigner à un autre vendeur
function ModalReassigner({ isOpen, produit, onConfirm, onCancel }: { 
  isOpen: boolean; 
  produit: Produit | null; 
  onConfirm: (nouveauVendeurId: number, nouveauVendeurNom: string) => void;
  onCancel: () => void;
}) {
  const [vendeurId, setVendeurId] = useState(0);
  const [vendeurNom, setVendeurNom] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [vendeurs, setVendeurs] = useState<Array<{ id: number; nom: string; boutique: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVendeurs = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/vendeurs');
        if (response.ok) {
          const data = await response.json();
          setVendeurs(data);
        }
      } catch (error) {
        console.error('Erreur chargement vendeurs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      fetchVendeurs();
    }
  }, [isOpen]);

  const vendeursFiltres = vendeurs.filter(v => 
    v.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.boutique.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen || !produit) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🔄</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>Réassigner le produit</p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>{produit.nom}</p>
              </div>
            </div>
            <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {/* Vendeur actuel */}
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', border: `1px solid ${THEME.border}` }}>
            <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0 }}>Vendeur actuel</p>
            <p style={{ fontSize: '16px', fontWeight: '700', color: THEME.text, margin: '4px 0 0 0' }}>{produit.vendeurNom}</p>
          </div>

          {/* Recherche vendeur */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, display: 'block', marginBottom: '8px' }}>
              Rechercher un nouveau vendeur
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nom ou boutique..."
              style={{
                width: '100%',
                padding: '12px 14px',
                border: `2px solid ${THEME.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Liste des vendeurs */}
          <div style={{ maxHeight: '300px', overflowY: 'auto', border: `1px solid ${THEME.border}`, borderRadius: '8px', marginBottom: '20px' }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: THEME.textLight }}>
                Chargement...
              </div>
            ) : (
              vendeursFiltres.map(v => (
                <div
                  key={v.id}
                  onClick={() => {
                    setVendeurId(v.id);
                    setVendeurNom(v.nom);
                  }}
                  style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${THEME.border}`,
                    cursor: 'pointer',
                    backgroundColor: vendeurId === v.id ? THEME.accentLight : 'white',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: THEME.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: THEME.accent }}>
                      {v.nom.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: 0 }}>{v.nom}</p>
                      <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>{v.boutique}</p>
                    </div>
                    {vendeurId === v.id && (
                      <span style={{ marginLeft: 'auto', color: THEME.accent, fontSize: '16px' }}>✓</span>
                    )}
                  </div>
                </div>
              ))
            )}

            {!loading && vendeursFiltres.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: THEME.textLight }}>
                Aucun vendeur trouvé
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={() => vendeurId && onConfirm(vendeurId, vendeurNom)}
            disabled={!vendeurId}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: vendeurId ? 'pointer' : 'not-allowed',
              backgroundColor: vendeurId ? THEME.accent : '#cccccc',
              color: 'white',
            }}>
            {vendeurId ? '✅ Confirmer la réassignation' : 'Réassigner'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modale de confirmation avec champ de confirmation
function ModaleConfirmation({ isOpen, type, produit, produitsCount = 0, onConfirm, onCancel }: ModaleConfirmationProps) {
  const [confirmation, setConfirmation] = useState('');
  
  if (!isOpen || !type) return null;

  const isBulk = type.includes('_bulk');
  const isSupprimer = type === 'supprimer' || type === 'supprimer_bulk';
  const isDesactiver = type === 'desactiver' || type === 'desactiver_bulk';
  const isActiver = type === 'activer' || type === 'activer_bulk';
  const isVendre = type === 'vendre' || type === 'vendre_bulk';
  
  const MOT_CONFIRMATION = 'CONFIRMER';
  const confirmationValide = confirmation === MOT_CONFIRMATION;

  const getTitle = () => {
    if (isBulk) {
      if (isSupprimer) return `SUPPRIMER ${produitsCount} PRODUIT${produitsCount > 1 ? 'S' : ''}`;
      if (isDesactiver) return `DÉSACTIVER ${produitsCount} PRODUIT${produitsCount > 1 ? 'S' : ''}`;
      if (isActiver) return `ACTIVER ${produitsCount} PRODUIT${produitsCount > 1 ? 'S' : ''}`;
      if (isVendre) return `MARQUER ${produitsCount} PRODUIT${produitsCount > 1 ? 'S' : ''} COMME VENDU${produitsCount > 1 ? 'S' : ''}`;
    } else {
      if (isSupprimer) return 'SUPPRIMER CE PRODUIT';
      if (isDesactiver) return 'DÉSACTIVER CE PRODUIT';
      if (isActiver) return 'ACTIVER CE PRODUIT';
      if (isVendre) return 'MARQUER CE PRODUIT COMME VENDU';
      if (type === 'reasigner') return 'RÉASSIGNER CE PRODUIT';
    }
    return '';
  };

  const getWarningMessage = () => {
    if (isBulk) {
      if (isSupprimer) return 'Cette action est irréversible et supprimera le produit de Shopify';
      if (isDesactiver) return 'Le produit sera masqué sur Shopify (mode brouillon)';
      if (isActiver) return 'Le produit sera visible sur Shopify';
      if (isVendre) return 'Les produits seront marqués comme vendus';
    } else {
      if (isSupprimer) return 'Cette action est irréversible et supprimera le produit de Shopify';
      if (isDesactiver) return 'Le produit sera masqué sur Shopify (mode brouillon)';
      if (isActiver) return 'Le produit sera visible sur Shopify';
      if (isVendre) return 'Le produit sera marqué comme vendu';
      if (type === 'reasigner') return 'Le produit sera transféré à un autre vendeur';
    }
    return '';
  };

  const getIcon = () => {
    if (isSupprimer) return '🗑️';
    if (isDesactiver) return '⚠️';
    if (isActiver) return '✅';
    if (isVendre) return '💰';
    if (type === 'reasigner') return '🔄';
    return '📋';
  };

  const getButtonColor = () => {
    if (isSupprimer) return THEME.danger;
    if (isDesactiver) return THEME.warning;
    if (isActiver) return THEME.success;
    if (isVendre) return THEME.success;
    if (type === 'reasigner') return THEME.accent;
    return THEME.accent;
  };

  const getButtonText = () => {
    if (isBulk) {
      if (isSupprimer) return 'Confirmer la suppression';
      if (isDesactiver) return 'Confirmer la désactivation';
      if (isActiver) return 'Confirmer l\'activation';
      if (isVendre) return 'Confirmer la vente';
    } else {
      if (isSupprimer) return 'Confirmer la suppression';
      if (isDesactiver) return 'Confirmer la désactivation';
      if (isActiver) return 'Confirmer l\'activation';
      if (isVendre) return 'Confirmer la vente';
      if (type === 'reasigner') return 'Confirmer la réassignation';
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
            {!isBulk && produit && (
              <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: `1px solid ${THEME.border}` }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: THEME.accent, margin: 0 }}>{produit.nom}</p>
                <p style={{ fontSize: '12px', color: THEME.textLight, margin: '2px 0 0 0' }}>{produit.vendeurNom} · {produit.productId}</p>
              </div>
            )}
            
            <p style={{ fontSize: '13px', color: THEME.text, margin: 0, lineHeight: '1.6' }}>
              {isSupprimer ? (
                isBulk ? (
                  <>
                    <strong>⚠️ Attention :</strong> Cette action supprimera définitivement ces produits de la base de données ET de Shopify.
                    <br />• Cette action est irréversible
                    <br />• Les produits seront définitivement supprimés
                  </>
                ) : (
                  <>
                    <strong>⚠️ Attention :</strong> Vous êtes sur le point de supprimer ce produit de la base de données ET de Shopify.
                    <br /><br />
                    <strong>Cette action supprimera définitivement :</strong>
                    <br />• Le produit "{produit?.nom}"
                    <br />• Toutes les données associées
                    <br />• L'historique des ventes
                  </>
                )
              ) : isDesactiver ? (
                isBulk ? (
                  <>
                    <strong>⚠️ En désactivant ces produits :</strong>
                    <br />• Ils seront masqués sur Shopify (mode brouillon)
                    <br />• Ils ne seront plus visibles dans la boutique
                    <br />• Vous pourrez les réactiver ultérieurement
                  </>
                ) : (
                  <>
                    <strong>⚠️ En désactivant ce produit :</strong>
                    <br />• Il sera masqué sur Shopify (mode brouillon)
                    <br />• Il ne sera plus visible dans la boutique
                    <br />• Vous pourrez le réactiver ultérieurement
                  </>
                )
              ) : isActiver ? (
                isBulk ? (
                  <>
                    <strong>✅ En activant ces produits :</strong>
                    <br />• Ils seront visibles sur Shopify
                    <br />• Ils pourront être achetés
                  </>
                ) : (
                  <>
                    <strong>✅ En activant ce produit :</strong>
                    <br />• Il sera visible sur Shopify
                    <br />• Il pourra être acheté
                  </>
                )
              ) : isVendre ? (
                isBulk ? (
                  <>
                    <strong>💰 En marquant ces produits comme vendus :</strong>
                    <br />• Ils ne seront plus disponibles à la vente
                    <br />• Le stock sera mis à jour
                  </>
                ) : (
                  <>
                    <strong>💰 En marquant ce produit comme vendu :</strong>
                    <br />• Il ne sera plus disponible à la vente
                    <br />• Le stock sera mis à jour
                  </>
                )
              ) : type === 'reasigner' && (
                <>
                  <strong>🔄 En réassignant ce produit :</strong>
                  <br />• Il sera transféré à un nouveau vendeur
                  <br />• Toutes les données associées seront conservées
                </>
              )}
            </p>
          </div>

          {/* Champ de confirmation pour la suppression */}
          {(isSupprimer || isVendre) && (
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
            onClick={() => onConfirm()}
            disabled={(isSupprimer || isVendre) && !confirmationValide}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: ((isSupprimer || isVendre) && !confirmationValide) ? 'not-allowed' : 'pointer',
              backgroundColor: ((isSupprimer || isVendre) && !confirmationValide) ? '#cccccc' : getButtonColor(),
              color: 'white',
            }}>
            {((isSupprimer || isVendre) && confirmationValide) ? '✅ ' + getButtonText() : getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modale pour importer des produits par CSV
function ModalImportCSV({ isOpen, onConfirm, onCancel }: { 
  isOpen: boolean; 
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
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        {/* Header avec gradient */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📊</div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>Importer des produits</p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '2px 0 0 0' }}>Fichier CSV</p>
              </div>
            </div>
            <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
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
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '16px', border: `1px solid ${THEME.border}` }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: THEME.text, margin: '0 0 8px 0' }}>Format attendu :</h4>
            <p style={{ fontSize: '11px', color: THEME.textLight, margin: '0 0 4px 0' }}>• product_id, nom, description, prix, quantite, categorie, vendeur_id, type_vente</p>
            <p style={{ fontSize: '11px', color: THEME.textLight, margin: '0 0 4px 0' }}>• La première ligne doit contenir les en-têtes</p>
            <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>• Taille maximale : 5 Mo</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={() => file && onConfirm(file)}
            disabled={!file}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: file ? 'pointer' : 'not-allowed',
              backgroundColor: file ? THEME.accent : '#cccccc',
              color: 'white',
            }}>
            {file ? '✅ Importer' : 'Importer'}
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
    { value: 'productId-asc', label: 'ID Produit (croissant)' },
    { value: 'nom-asc', label: 'Nom produit (A-Z)' },
    { value: 'vendeur-asc', label: 'Vendeur (A-Z)' },
    { value: 'prix-asc', label: 'Prix (croissant)' },
    { value: 'prix-desc', label: 'Prix (décroissant)' },
    { value: 'quantite-asc', label: 'Quantité (croissant)' },
    { value: 'quantite-desc', label: 'Quantité (décroissant)' },
    { value: 'date-desc', label: 'Date + récentes' },
    { value: 'typeVente-asc', label: 'Type de vente' },
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

// Composant de pagination
function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  totalItems
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
  totalItems: number;
}) {
  const pages: number[] = [];
  const maxVisible = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '20px',
      padding: '16px 0',
      borderTop: `1px solid ${THEME.border}`,
    }}>
      <div style={{ fontSize: '13px', color: THEME.textLight }}>
        {totalItems} produits au total
      </div>
      
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '6px 12px',
            border: `1px solid ${THEME.border}`,
            borderRadius: '6px',
            backgroundColor: currentPage === 1 ? '#f5f5f5' : 'white',
            color: currentPage === 1 ? THEME.textLight : THEME.text,
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontSize: '12px',
          }}
        >
          ← Précédent
        </button>

        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: currentPage === page ? THEME.accent : 'white',
              color: currentPage === page ? 'white' : THEME.text,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: currentPage === page ? '700' : '400',
            }}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '6px 12px',
            border: `1px solid ${THEME.border}`,
            borderRadius: '6px',
            backgroundColor: currentPage === totalPages ? '#f5f5f5' : 'white',
            color: currentPage === totalPages ? THEME.textLight : THEME.text,
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontSize: '12px',
          }}
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}

function ListeProduits({ onVoirProduit, onModifierProduit, onNaviguerVers }: ListeProduitsProps) {
  // Injecter CSS print au montage
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'evend-produits-print-style';
    style.innerHTML = PRINT_STYLE;
    document.head.appendChild(style);
    return () => { 
      const el = document.getElementById('evend-produits-print-style'); 
      if (el) el.remove(); 
    };
  }, []);

  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [filtreTypeVente, setFiltreTypeVente] = useState('tous');
  const [triOption, setTriOption] = useState<TriOption>('productId-asc');
  const [menuOuvert, setMenuOuvert] = useState<number | null>(null);
  const [menuActionGroupesOuvert, setMenuActionGroupesOuvert] = useState(false);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [produitsSelectionnes, setProduitsSelectionnes] = useState<number[]>([]);
  const [produitNotes, setProduitNotes] = useState<Produit | null>(null);
  const [modalVendu, setModalVendu] = useState<Produit | null>(null);
  const [modalReassigner, setModalReassigner] = useState<Produit | null>(null);
  const [modalImportCSV, setModalImportCSV] = useState(false);
  const [notesParProduit, setNotesParProduit] = useState<Record<number, number>>({});
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProduits, setTotalProduits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [modaleConfirmation, setModaleConfirmation] = useState<{
    isOpen: boolean;
    type: ActionType;
    produit: Produit | null;
    produitsCount?: number;
  }>({
    isOpen: false,
    type: null,
    produit: null,
  });

  const menuActionRef = useRef<HTMLDivElement>(null);
  const menuTroisPointsRef = useRef<Map<number, HTMLDivElement>>(new Map());

  const PRODUITS_PAR_PAGE = 50;

  // Fonction pour ouvrir la page Shopify
  const openShopifyPage = (produit: Produit) => {
    const url = produit.shopifyUrl || generateShopifyUrl(produit.nom, produit.id);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Charger les produits depuis l'API
  const fetchProduits = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: PRODUITS_PAR_PAGE.toString(),
        recherche: recherche,
        statut: filtreStatut,
        typeVente: filtreTypeVente,
        tri: triOption
      });
      
      const response = await fetch(`/api/produits?${params}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des produits');
      }
      
      const data = await response.json();
      setProduits(data.produits);
      setTotalProduits(data.total);
      setError(null);

      // Charger le nombre de notes pour chaque produit
      const notesCount: Record<number, number> = {};
      await Promise.all(data.produits.map(async (p: Produit) => {
        try {
          const res = await fetch(`/api/notes-admin/produit/${p.id}`);
          if (res.ok) {
            const notes = await res.json();
            notesCount[p.id] = notes.length;
          }
        } catch (e) {
          notesCount[p.id] = 0;
        }
      }));
      setNotesParProduit(notesCount);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      console.error('Erreur fetch produits:', err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les produits quand les filtres ou la page changent
  useEffect(() => {
    fetchProduits();
  }, [currentPage, recherche, filtreStatut, filtreTypeVente, triOption]);

  const getStatutStyle = (statut: string) => {
    switch(statut) {
      case 'actif':
        return { bg: '#dcfce7', color: THEME.success, text: '✓ Actif' };
      case 'desactive':
        return { bg: '#fee2e2', color: THEME.danger, text: '✗ Désactivé' };
      case 'en_attente':
        return { bg: '#fef9c3', color: THEME.warning, text: '⏳ En attente' };
      case 'vendu':
        return { bg: '#e0f2fe', color: '#0369a1', text: '💰 Vendu' };
      default:
        return { bg: '#f3f4f6', color: THEME.textLight, text: statut };
    }
  };

  const getTypeVenteStyle = (typeVente: string) => {
    return typeVente === 'enchere' 
      ? { bg: '#f3e8ff', color: '#9333ea', text: '🔨 Enchère' }
      : { bg: '#e0f2fe', color: '#0369a1', text: '📦 Standard' };
  };

  const handleSelectionProduit = (produitId: number) => {
    setProduitsSelectionnes(prev => 
      prev.includes(produitId) 
        ? prev.filter(id => id !== produitId)
        : [...prev, produitId]
    );
  };

  const handleSelectionTous = () => {
    if (produitsSelectionnes.length === produits.length) {
      setProduitsSelectionnes([]);
    } else {
      setProduitsSelectionnes(produits.map(p => p.id));
    }
  };

  const handleAjouterNote = async (produit: Produit, contenu: string) => {
    try {
      const response = await fetch('/api/notes-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produitId: produit.id,
          contenu,
          auteur: 'Admin'
        })
      });
      
      if (response.ok) {
        setNotesParProduit(prev => ({
          ...prev,
          [produit.id]: (prev[produit.id] || 0) + 1
        }));
      }
    } catch (error) {
      console.error('Erreur ajout note:', error);
    }
  };

  const handleMarquerVendu = async (produit: Produit, quantite: number, prixVente: number) => {
    try {
      const response = await fetch('/api/produits/vendre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produitId: produit.id,
          quantite,
          prixVente
        })
      });
      
      if (response.ok) {
        fetchProduits();
        setModalVendu(null);
      }
    } catch (error) {
      console.error('Erreur vente:', error);
    }
  };

  const handleReassigner = async (produit: Produit, nouveauVendeurId: number, nouveauVendeurNom: string) => {
    try {
      const response = await fetch('/api/produits/reassigner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produitId: produit.id,
          vendeurId: nouveauVendeurId
        })
      });
      
      if (response.ok) {
        setProduits(prev => prev.map(p => 
          p.id === produit.id 
            ? { 
                ...p, 
                vendeurId: nouveauVendeurId,
                vendeurNom: nouveauVendeurNom
              } 
            : p
        ));
        setModalReassigner(null);
      }
    } catch (error) {
      console.error('Erreur réassignation:', error);
    }
  };

  const handleChangerStatut = async (produit: Produit, nouveauStatut: string) => {
    try {
      const response = await fetch(`/api/produits/${produit.id}/statut`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: nouveauStatut })
      });
      
      if (response.ok) {
        setProduits(prev => prev.map(p => 
          p.id === produit.id ? { ...p, statut: nouveauStatut as any } : p
        ));
      }
    } catch (error) {
      console.error('Erreur changement statut:', error);
    }
  };

  const handleSupprimerProduit = async (produit: Produit) => {
    try {
      const response = await fetch(`/api/produits/${produit.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setProduits(prev => prev.filter(p => p.id !== produit.id));
        setTotalProduits(prev => prev - 1);
      }
    } catch (error) {
      console.error('Erreur suppression produit:', error);
    }
  };

  const handleAction = (action: string, produit: Produit) => {
    setMenuOuvert(null);
    
    switch(action) {
      case 'notes':
        setProduitNotes(produit);
        break;
      case 'voir':
        openShopifyPage(produit);
        break;
     case 'modifier':
        console.log('🔍 MODIFIER CLIQUE - produit.id =', produit.id);
        console.log('🔍 onNaviguerVers existe ?', !!onNaviguerVers);
        onNaviguerVers?.(`modifier-annonce-${produit.id}`);
        break;
      case 'vendre':
        setModalVendu(produit);
        break;
      case 'reasigner':
        setModalReassigner(produit);
        break;
      case 'activer':
        setModaleConfirmation({
          isOpen: true,
          type: 'activer',
          produit: produit,
        });
        break;
      case 'desactiver':
        setModaleConfirmation({
          isOpen: true,
          type: 'desactiver',
          produit: produit,
        });
        break;
      case 'supprimer':
        setModaleConfirmation({
          isOpen: true,
          type: 'supprimer',
          produit: produit,
        });
        break;
      default:
        break;
    }
  };

  const handleActionGroupes = (action: string) => {
    setMenuActionGroupesOuvert(false);
    
    if (produitsSelectionnes.length === 0) return;
    
    switch(action) {
      case 'activer':
        setModaleConfirmation({
          isOpen: true,
          type: 'activer_bulk',
          produit: null,
          produitsCount: produitsSelectionnes.length,
        });
        break;
      case 'desactiver':
        setModaleConfirmation({
          isOpen: true,
          type: 'desactiver_bulk',
          produit: null,
          produitsCount: produitsSelectionnes.length,
        });
        break;
      case 'supprimer':
        setModaleConfirmation({
          isOpen: true,
          type: 'supprimer_bulk',
          produit: null,
          produitsCount: produitsSelectionnes.length,
        });
        break;
      case 'vendre':
        setModaleConfirmation({
          isOpen: true,
          type: 'vendre_bulk',
          produit: null,
          produitsCount: produitsSelectionnes.length,
        });
        break;
      default:
        break;
    }
  };

  const handleConfirmation = async (data?: any) => {
    if (modaleConfirmation.type) {
      const type = modaleConfirmation.type;
      const isBulk = type.includes('_bulk');
      
      if (isBulk && produitsSelectionnes.length > 0) {
        if (type === 'activer_bulk') {
          for (const id of produitsSelectionnes) {
            const p = produits.find(p => p.id === id);
            if (p) await handleChangerStatut(p, 'actif');
          }
        } else if (type === 'desactiver_bulk') {
          for (const id of produitsSelectionnes) {
            const p = produits.find(p => p.id === id);
            if (p) await handleChangerStatut(p, 'desactive');
          }
        } else if (type === 'supprimer_bulk') {
          for (const id of produitsSelectionnes) {
            const p = produits.find(p => p.id === id);
            if (p) await handleSupprimerProduit(p);
          }
        } else if (type === 'vendre_bulk') {
          // Logique pour vendre en bulk
          for (const id of produitsSelectionnes) {
            const p = produits.find(p => p.id === id);
            if (p) await handleMarquerVendu(p, p.quantite, p.prix);
          }
        }
        setProduitsSelectionnes([]);
      } else if (modaleConfirmation.produit) {
        if (type === 'activer') {
          await handleChangerStatut(modaleConfirmation.produit, 'actif');
        } else if (type === 'desactiver') {
          await handleChangerStatut(modaleConfirmation.produit, 'desactive');
        } else if (type === 'supprimer') {
          await handleSupprimerProduit(modaleConfirmation.produit);
        } else if (type === 'vendre') {
          setModalVendu(modaleConfirmation.produit);
        } else if (type === 'reasigner') {
          setModalReassigner(modaleConfirmation.produit);
        }
      }
    }
    
    setModaleConfirmation({ isOpen: false, type: null, produit: null });
  };

  const handleAnnulation = () => {
    setModaleConfirmation({ isOpen: false, type: null, produit: null });
  };

  const handleImportCSV = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/produits/import', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        fetchProduits();
        setModalImportCSV(false);
      }
    } catch (error) {
      console.error('Erreur import:', error);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/produits/export', '_blank');
  };

  const handlePrint = () => {
    const printDiv = document.getElementById('evend-produits-print');
    if (!printDiv) return;

    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Liste des produits — e-Vend.ca</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 20px; margin: 0; }
          @page { size: landscape; margin: 12mm 10mm; }
          h1 { font-size: 16px; color: #2d6a9f; margin: 0 0 2px 0; }
          p { margin: 0 0 4px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px; page-break-inside: auto; }
          tr { page-break-inside: avoid; }
          th { background-color: #e8f2fb; color: #2d6a9f; font-weight: bold; padding: 7px 8px; border: 1px solid #ccc; text-align: left; font-size: 9px; text-transform: uppercase; }
          td { padding: 6px 8px; border: 1px solid #ddd; font-size: 10px; }
          tfoot td { background-color: #e8f2fb; font-weight: bold; border-top: 2px solid #2d6a9f; }
          tr:nth-child(even) td { background-color: #f8f8f8; }
          .section-title { font-size: 13px; font-weight: bold; color: #2d6a9f; text-transform: uppercase; margin: 20px 0 8px 0; border-left: 4px solid #2d6a9f; padding-left: 8px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2d6a9f; padding-bottom: 10px; margin-bottom: 16px; }
          .note { font-size: 9px; color: #999; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 8px; }
          .statut-badge { display: inline-block; padding: 2px 6px; border-radius: 20px; font-size: 8px; font-weight: bold; }
          .type-vente-badge { display: inline-block; padding: 2px 6px; border-radius: 12px; font-size: 8px; font-weight: bold; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        </style>
      </head>
      <body>
        ${printDiv.innerHTML}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const setMenuRef = (id: number) => (element: HTMLDivElement | null) => {
    if (element) {
      menuTroisPointsRef.current.set(id, element);
    } else {
      menuTroisPointsRef.current.delete(id);
    }
  };

  const getMenuPosition = (produitId: number) => {
    const element = menuTroisPointsRef.current.get(produitId);
    if (!element) return { left: 0, top: 0 };
    
    const rect = element.getBoundingClientRect();
    const menuWidth = 220;
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

  const totalPages = Math.ceil(totalProduits / PRODUITS_PAR_PAGE);

  // Calcul des totaux pour le pied de tableau
  const totalPrix = produits.reduce((sum, p) => {
    const prix = typeof p.prix === 'number' ? p.prix : parseFloat(p.prix || '0');
    return sum + prix;
  }, 0);
  
  const totalQuantite = produits.reduce((sum, p) => sum + p.quantite, 0);

  if (loading) {
    return (
      <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: THEME.textLight }}>Chargement des produits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ textAlign: 'center', color: THEME.danger }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>❌</div>
          <p>Erreur: {error}</p>
          <button 
            onClick={fetchProduits}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: THEME.accent,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Zone d'impression cachée — visible seulement @media print */}
      <div id="evend-produits-print" style={{ display: 'none', visibility: 'hidden', position: 'absolute', top: '-9999px' }}>
        <div className="header">
          <div>
            <h1>e-Vend.ca — Liste des produits</h1>
            <p>Généré le {new Date().toLocaleDateString('fr-CA')} · {totalProduits} produits (page {currentPage}/{totalPages})</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Période de filtrage active</p>
            {filtreStatut !== 'tous' && <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Statut: {filtreStatut}</p>}
            {filtreTypeVente !== 'tous' && <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Type: {filtreTypeVente === 'enchere' ? 'Enchère' : 'Standard'}</p>}
            {recherche && <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Recherche: "{recherche}"</p>}
          </div>
        </div>

        {/* Tableau principal */}
        <table>
          <thead>
            <tr>
              <th>ID Produit</th>
              <th>SKU</th>
              <th>Nom</th>
              <th>Vendeur</th>
              <th>Catégorie</th>
              <th>Type vente</th>
              <th>Prix</th>
              <th>Qté</th>
              <th>Statut</th>
              <th>Ventes</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {produits.map(p => {
              const statutStyle = getStatutStyle(p.statut);
              const typeVenteStyle = getTypeVenteStyle(p.typeVente);
              const prix = typeof p.prix === 'number' ? p.prix : parseFloat(p.prix || '0');
              
              return (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace' }}>{p.productId}</td>
                  <td>{p.sku || '—'}</td>
                  <td>{p.nom}</td>
                  <td>{p.vendeurNom}</td>
                  <td>{p.categorie}</td>
                  <td>
                    <span className="type-vente-badge" style={{ backgroundColor: typeVenteStyle.bg, color: typeVenteStyle.color }}>
                      {typeVenteStyle.text}
                    </span>
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{prix.toFixed(2)} $</td>
                  <td style={{ textAlign: 'center' }}>{p.quantite}</td>
                  <td>
                    <span className="statut-badge" style={{ backgroundColor: statutStyle.bg, color: statutStyle.color }}>
                      {statutStyle.text}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>{p.totalVentes || 0}</td>
                  <td style={{ textAlign: 'center' }}>{p.note ? p.note.toFixed(1) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6}><strong>TOTAL — {produits.length} produits affichés (sur {totalProduits})</strong></td>
              <td><strong>{totalPrix.toFixed(2)} $</strong></td>
              <td><strong>{totalQuantite}</strong></td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>

        <p className="note">
          Ce rapport est généré automatiquement par e-Vend.ca. Pour toute question, contactez le support.
        </p>
      </div>

      <div style={{ padding: '28px 32px', width: '100%', boxSizing: 'border-box' as const, backgroundColor: THEME.bg, minHeight: '100vh', overflow: 'hidden' }}>
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
              Gestion des produits
            </h1>
            <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
              {totalProduits} produits au total (page {currentPage}/{totalPages})
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
                📦 Total: {totalProduits} produits
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }} className="no-print">
              <button
                onClick={() => setModalImportCSV(true)}
                style={{
                  backgroundColor: 'white',
                  color: THEME.success,
                  border: `2px solid ${THEME.success}`,
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
                onClick={handlePrint}
                style={{
                  backgroundColor: THEME.accent,
                  color: 'white',
                  border: 'none',
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
            onChange={e => {
              setRecherche(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="🔍 Rechercher par nom, ID, SKU..."
            style={{
              border: `1px solid ${THEME.border}`,
              borderRadius: '8px',
              padding: '9px 14px',
              fontSize: '13px',
              outline: 'none',
              width: '300px'
            }}
          />
          
          <select
            value={filtreStatut}
            onChange={(e) => {
              setFiltreStatut(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              border: `1px solid ${THEME.border}`,
              borderRadius: '8px',
              padding: '9px 14px',
              fontSize: '13px',
              outline: 'none',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            <option value="tous">Tous les statuts</option>
            <option value="actif">✓ Actifs</option>
            <option value="en_attente">⏳ En attente</option>
            <option value="desactive">✗ Désactivés</option>
            <option value="vendu">💰 Vendus</option>
          </select>

          <select
            value={filtreTypeVente}
            onChange={(e) => {
              setFiltreTypeVente(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              border: `1px solid ${THEME.border}`,
              borderRadius: '8px',
              padding: '9px 14px',
              fontSize: '13px',
              outline: 'none',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            <option value="tous">Tous les types</option>
            <option value="standard">📦 Standard</option>
            <option value="enchere">🔨 Enchère</option>
          </select>

          {/* Menu Tri */}
          <MenuTri triOption={triOption} onTriChange={(option) => {
            setTriOption(option);
            setCurrentPage(1);
          }} />

          {/* Menu d'actions groupées */}
          <div style={{ position: 'relative', marginLeft: 'auto' }} ref={menuActionRef}>
            <button
              onClick={() => produitsSelectionnes.length > 0 && setMenuActionGroupesOuvert(!menuActionGroupesOuvert)}
              style={{
                backgroundColor: produitsSelectionnes.length > 0 ? THEME.accent : '#f0f0f0',
                color: produitsSelectionnes.length > 0 ? 'white' : THEME.textLight,
                border: 'none',
                borderRadius: '8px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: produitsSelectionnes.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              disabled={produitsSelectionnes.length === 0}
            >
              Actions ({produitsSelectionnes.length}) ▼
            </button>
            
            {menuActionGroupesOuvert && produitsSelectionnes.length > 0 && (
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
                  <MenuItem 
                    onClick={() => handleActionGroupes('activer')}
                    style={{ color: THEME.success }}
                  >
                    ✅ Activer
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleActionGroupes('desactiver')}
                    style={{ color: THEME.warning }}
                  >
                    ⚠️ Désactiver
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleActionGroupes('vendre')}
                    style={{ color: '#0369a1' }}
                  >
                    💰 Marquer comme vendus
                  </MenuItem>
                  <div style={{ height: '1px', backgroundColor: THEME.border, margin: '4px 0' }} />
                  <MenuItem 
                    onClick={() => handleActionGroupes('supprimer')}
                    style={{ color: THEME.danger }}
                  >
                    🗑️ Supprimer
                  </MenuItem>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onNaviguerVers?.('produit-ajouter')}
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
            + Ajouter un produit
          </button>
        </div>

        {/* Tableau des produits */}
        <div className="print-table" style={{ 
          backgroundColor: THEME.card, 
          borderRadius: '12px', 
          border: `1px solid ${THEME.border}`, 
          overflow: 'auto', 
          maxHeight: 'calc(100vh - 250px)',
          width: '100%',
          boxSizing: 'border-box' as const,
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1400px' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 5 }}>
              <tr style={{ borderBottom: `2px solid ${THEME.accent}` }}>
                <th style={{ padding: '13px 8px', width: '40px', textAlign: 'center' }} className="no-print">
                  <input
                    type="checkbox"
                    checked={produitsSelectionnes.length === produits.length && produits.length > 0}
                    onChange={handleSelectionTous}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  Image
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  ID Produit
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  Nom / SKU
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  Vendeur
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  Catégorie
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  Type
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  Prix
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  Qté
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }}>
                  Statut
                </th>
                <th style={{ padding: '13px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' }} className="no-print">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {produits.map((p, i) => {
                const statutStyle = getStatutStyle(p.statut);
                const typeVenteStyle = getTypeVenteStyle(p.typeVente);
                const isSelected = produitsSelectionnes.includes(p.id);
                const menuPosition = getMenuPosition(p.id);
                const nbNotes = notesParProduit[p.id] || 0;
                const prix = typeof p.prix === 'number' ? p.prix : parseFloat(p.prix || '0');
                
                return (
                  <tr 
                    key={p.id} 
                    style={{ 
                      borderBottom: `1px solid #f5f5f5`, 
                      backgroundColor: isSelected ? THEME.accentLight : (i % 2 === 0 ? 'white' : '#fafafa'),
                    }}
                  >
                    <td style={{ padding: '14px 8px', textAlign: 'center' }} className="no-print">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectionProduit(p.id)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      {p.image && p.image.startsWith('http') ? (
                        <img 
                          src={p.image} 
                          alt={p.nom}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            backgroundColor: THEME.accentLight,
                          }}
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div style="width:40px;height:40px;border-radius:8px;background-color:#e8f2fb;display:flex;align-items:center;justify-content:center;font-size:24px;">📦</div>';
                            }
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          backgroundColor: THEME.accentLight,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                          margin: '0 auto',
                        }}>
                          📦
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center', fontFamily: 'monospace', fontSize: '12px', fontWeight: '600' }}>
                      {p.productId}
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'left' }}>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: 0 }}>{p.nom}</p>
                      {p.sku && <p style={{ fontSize: '10px', color: THEME.textLight, margin: '2px 0 0 0' }}>SKU: {p.sku}</p>}
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '12px' }}>{p.vendeurNom}</span>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', backgroundColor: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>
                        {p.categorie}
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '4px 6px',
                        borderRadius: '12px',
                        backgroundColor: typeVenteStyle.bg,
                        color: typeVenteStyle.color,
                        whiteSpace: 'nowrap' as const,
                      }}>
                        {typeVenteStyle.text}
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: THEME.success }}>
                        {prix.toFixed(2)} $
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: p.quantite < 5 && p.quantite > 0 ? '700' : '400', color: p.quantite < 5 && p.quantite > 0 ? THEME.warning : p.quantite === 0 ? THEME.textLight : THEME.text }}>
                        {p.quantite}
                      </span>
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
                    <td style={{ padding: '14px 8px', textAlign: 'center' }} className="no-print">
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Bouton Notes */}
                        <button
                          onClick={() => handleAction('notes', p)}
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

                        {/* Bouton Voir */}
                        <button
                          onClick={() => handleAction('voir', p)}
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
                            minWidth: '40px',
                          }}
                          title="Voir sur Shopify"
                        >
                          👁️ Voir
                        </button>

                        {/* Menu 3 points */}
                        <div
                          ref={setMenuRef(p.id)}
                          style={{ position: 'relative' }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOuvert(menuOuvert === p.id ? null : p.id);
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
                          
                          {menuOuvert === p.id && (
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
                                width: '220px',
                              }}
                            >
                              <div style={{ padding: '4px 0' }}>
                                <MenuItem onClick={() => handleAction('voir', p)}>
                                  👁️ Voir en boutique
                                </MenuItem>
                                <MenuItem onClick={() => handleAction('modifier', p)}>
                                  ✏️ Modifier
                                </MenuItem>
                                <MenuItem onClick={() => handleAction('vendre', p)}>
                                  💰 Marquer comme vendu
                                </MenuItem>
                                <MenuItem onClick={() => handleAction('reasigner', p)}>
                                  🔄 Réassigner à un vendeur
                                </MenuItem>
                                
                                <div style={{ height: '1px', backgroundColor: THEME.border, margin: '4px 0' }} />
                                
                                {p.statut === 'desactive' && (
                                  <MenuItem 
                                    onClick={() => handleAction('activer', p)}
                                    style={{ color: THEME.success }}
                                  >
                                    ✅ Activer
                                  </MenuItem>
                                )}
                                
                                {p.statut !== 'desactive' && p.statut !== 'vendu' && p.statut !== 'en_attente' && (
                                  <MenuItem 
                                    onClick={() => handleAction('desactiver', p)}
                                    style={{ color: THEME.warning }}
                                  >
                                    ⚠️ Désactiver
                                  </MenuItem>
                                )}
                                
                                <MenuItem 
                                  onClick={() => handleAction('supprimer', p)}
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

          {produits.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: THEME.textLight }}>
              Aucun produit trouvé
            </div>
          )}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalProduits}
        />
      </div>

      {/* Modale de notes internes */}
      {produitNotes && (
        <ModalNotes
          produit={produitNotes}
          onAjouterNote={(contenu) => handleAjouterNote(produitNotes, contenu)}
          onFermer={() => setProduitNotes(null)}
        />
      )}

      {/* Modale de marquer comme vendu */}
      {modalVendu && (
        <ModalMarquerVendu
          isOpen={true}
          produit={modalVendu}
          onConfirm={(quantite, prixVente) => handleMarquerVendu(modalVendu, quantite, prixVente)}
          onCancel={() => setModalVendu(null)}
        />
      )}

      {/* Modale de réassignation */}
      {modalReassigner && (
        <ModalReassigner
          isOpen={true}
          produit={modalReassigner}
          onConfirm={(vendeurId, vendeurNom) => handleReassigner(modalReassigner, vendeurId, vendeurNom)}
          onCancel={() => setModalReassigner(null)}
        />
      )}

      {/* Modale d'import CSV */}
      <ModalImportCSV
        isOpen={modalImportCSV}
        onConfirm={handleImportCSV}
        onCancel={() => setModalImportCSV(false)}
      />

      {/* Modale de confirmation */}
      <ModaleConfirmation
        isOpen={modaleConfirmation.isOpen}
        type={modaleConfirmation.type}
        produit={modaleConfirmation.produit}
        produitsCount={modaleConfirmation.produitsCount}
        onConfirm={handleConfirmation}
        onCancel={handleAnnulation}
      />
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

export default ListeProduits;
