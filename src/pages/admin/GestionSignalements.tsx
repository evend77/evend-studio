import React, { useState, useEffect, useCallback } from 'react';
import SignalementCard from '../../components/SignalementCard';
import SignalementDetails from '../../components/SignalementDetails';

interface Props {
  filtre: 'tous' | 'en_cours' | 'resolus';
  naviguerVers: (page: string, data?: any) => void;
}

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
  bg: '#f0f2f5',
};

const CATEGORIE_LABELS: { [key: string]: string } = {
  produit_fake: 'Produit contrefait / faux',
  arnaque: 'Tentative d\'arnaque',
  comportement: 'Comportement inapproprié',
  livraison: 'Problème de livraison',
  qualite: 'Qualité non conforme',
  autre: 'Autre'
};

const STATUT_LABELS: { [key: string]: string } = {
  nouveau: 'Nouveau',
  vu: 'Vu',
  traite: 'Traité',
  rejete: 'Rejeté'
};

const STATUT_COLORS: { [key: string]: string } = {
  nouveau: '#3b82f6',
  vu: '#f59e0b',
  traite: '#10b981',
  rejete: '#6b7280'
};

export default function GestionSignalements({ filtre, naviguerVers }: Props) {
  console.log('🔥🔥🔥 GestionSignalements RENDU!', { filtre });

  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState<string>('tous');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSignalements, setTotalSignalements] = useState(0);
  const [selectedSignalement, setSelectedSignalement] = useState<Signalement | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [nouveauxCount, setNouveauxCount] = useState(0);
  const [itemsPerPage] = useState(20);

  // ✅ Fonction fetchSignalements avec useCallback
  const fetchSignalements = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      // Construire l'URL avec les paramètres
      const baseUrl = `https://evend-multivendeur-api.onrender.com/api/signalements`;
      const params = new URLSearchParams();
      
      console.log('🔍 DÉBUT FETCH:');
      console.log('🔍 - filtre (prop):', filtre);
      console.log('🔍 - selectedStatut (state):', selectedStatut);
      console.log('🔍 - currentPage:', currentPage);
      console.log('🔍 - searchTerm:', searchTerm);
      
      // Déterminer le statut à filtrer
      if (filtre === 'en_cours') {
        params.append('statut', 'vu');
        console.log('🔍 - Application filtre en_cours → statut=vu');
      } else if (filtre === 'resolus') {
        params.append('statut', 'traite,rejete');
        console.log('🔍 - Application filtre resolus → statut=traite,rejete');
      } else if (selectedStatut !== 'tous') {
        params.append('statut', selectedStatut);
        console.log(`🔍 - Application selectedStatut → statut=${selectedStatut}`);
      }
      
      // Pagination
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      // Recherche
      if (searchTerm) {
        params.append('recherche', searchTerm);
        console.log('🔍 - Ajout recherche:', searchTerm);
      }
      
      const url = `${baseUrl}?${params.toString()}`;
      console.log('🔍 URL FINALE:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('❌ Réponse pas OK:', response.status, response.statusText);
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 DONNÉES REÇUES:', data);
      
      // La nouvelle API retourne { signalements, total, page, limit, totalPages }
      setSignalements(data.signalements || []);
      setTotalSignalements(data.total || 0);
      setTotalPages(data.totalPages || 1);
      
    } catch (err) {
      console.error('❌ Erreur fetchSignalements:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedStatut, filtre, searchTerm, itemsPerPage]);

  // ✅ Fonction fetchNouveauxCount
  const fetchNouveauxCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://evend-multivendeur-api.onrender.com/api/signalements/count', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('🔴 NOUVEAUX COUNT:', data.nouveaux);
        setNouveauxCount(data.nouveaux || 0);
      }
    } catch (error) {
      console.error('❌ Erreur chargement count:', error);
    }
  }, []);

  // ✅ useEffect CORRIGÉ - dépend des VARIABLES, pas des fonctions
  useEffect(() => {
    console.log('🔄 useEffect déclenché avec:', { filtre, selectedStatut, currentPage, searchTerm });
    
    const loadData = async () => {
      await fetchSignalements();
      await fetchNouveauxCount();
    };
    
    loadData();
  }, [filtre, selectedStatut, currentPage, searchTerm]); // ← Dépendances correctes !

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 Recherche lancée:', searchTerm);
    setCurrentPage(1);
  };

  const handleViewDetails = (signalement: Signalement) => {
    console.log('👁️ Détails signalement:', signalement.id);
    setSelectedSignalement(signalement);
    setDetailsModalOpen(true);
  };

  const handleUpdateStatut = async (id: number, nouveauStatut: string, noteAdmin?: string) => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('✏️ Mise à jour statut:', { id, nouveauStatut, noteAdmin });
      
      const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/signalements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          statut: nouveauStatut,
          note_admin: noteAdmin
        })
      });
      
      if (!response.ok) throw new Error('Erreur mise à jour');
      
      // Rafraîchir la liste
      fetchSignalements();
      fetchNouveauxCount();
      
      // Fermer le modal si ouvert
      if (selectedSignalement?.id === id) {
        setSelectedSignalement(null);
        setDetailsModalOpen(false);
      }
    } catch (error) {
      console.error('❌ Erreur update:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      console.log('🗑️ Suppression signalement:', id);
      
      const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/signalements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Erreur suppression');
      
      // Rafraîchir la liste
      fetchSignalements();
      fetchNouveauxCount();
      
      // Fermer le modal si ouvert
      if (selectedSignalement?.id === id) {
        setSelectedSignalement(null);
        setDetailsModalOpen(false);
      }
    } catch (error) {
      console.error('❌ Erreur delete:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const getStatutBadge = (statut: string) => {
    return (
      <span style={{
        backgroundColor: STATUT_COLORS[statut] + '20',
        color: STATUT_COLORS[statut],
        padding: '4px 8px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '600'
      }}>
        {STATUT_LABELS[statut]}
      </span>
    );
  };

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header avec badge du nombre de nouveaux */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '800', 
            margin: '0 0 4px 0',
            color: THEME.text,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>🚩 Gestion des signalements</span>
            {totalSignalements > 0 && (
              <span style={{
                backgroundColor: THEME.accent,
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {totalSignalements} total
              </span>
            )}
            {nouveauxCount > 0 && (
              <span style={{
                backgroundColor: THEME.danger,
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                animation: 'pulse 2s infinite'
              }}>
                🔴 {nouveauxCount} nouveau(x)
              </span>
            )}
          </h1>
          <p style={{ fontSize: '14px', color: THEME.textLight, margin: 0 }}>
            Gérez les signalements des utilisateurs contre les vendeurs
          </p>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: `1px solid ${THEME.border}`,
        padding: '20px',
        marginBottom: '20px'
      }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, display: 'flex', gap: '12px', minWidth: '300px' }}>
            <input
              type="text"
              placeholder="Rechercher par visiteur, vendeur, raison..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: `1px solid ${THEME.border}`,
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: THEME.accent,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🔍 Rechercher
            </button>
          </div>
          
          <select
            value={selectedStatut}
            onChange={(e) => {
              console.log('🔽 Changement statut filter:', e.target.value);
              setSelectedStatut(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '10px 14px',
              border: `1px solid ${THEME.border}`,
              borderRadius: '8px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="tous">Tous les statuts</option>
            <option value="nouveau">Nouveaux</option>
            <option value="vu">En cours (Vu)</option>
            <option value="traite">Traités</option>
            <option value="rejete">Rejetés</option>
          </select>
        </form>
      </div>

      {/* Liste des signalements */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: THEME.textLight }}>Chargement des signalements...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>❌</div>
          <p style={{ color: THEME.danger }}>{error}</p>
        </div>
      ) : signalements.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '80px 20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: `1px solid ${THEME.border}`
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>🚩</div>
          <h3 style={{ fontSize: '18px', color: THEME.text, margin: '0 0 8px 0' }}>
            Aucun signalement trouvé
          </h3>
          <p style={{ fontSize: '14px', color: THEME.textLight }}>
            {searchTerm ? 'Essayez d\'autres termes de recherche' : 'Aucun signalement pour le moment'}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {signalements.map(signalement => (
              <SignalementCard
                key={signalement.id}
                signalement={signalement}
                onClick={() => handleViewDetails(signalement)}
                getStatutBadge={getStatutBadge}
                categorieLabels={CATEGORIE_LABELS}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginTop: '24px'
            }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  border: `1px solid ${THEME.border}`,
                  backgroundColor: 'white',
                  color: THEME.text,
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                ←
              </button>
              
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                if (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 2
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        border: `1px solid ${THEME.border}`,
                        backgroundColor: page === currentPage ? THEME.accent : 'white',
                        color: page === currentPage ? 'white' : THEME.text,
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: page === currentPage ? '700' : '400'
                      }}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 3 ||
                  page === currentPage + 3
                ) {
                  return <span key={page} style={{ color: THEME.textLight }}>...</span>;
                }
                return null;
              })}
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  border: `1px solid ${THEME.border}`,
                  backgroundColor: 'white',
                  color: THEME.text,
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                →
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de détails */}
      {detailsModalOpen && selectedSignalement && (
        <SignalementDetails
          signalement={selectedSignalement}
          onClose={() => setDetailsModalOpen(false)}
          onUpdateStatut={handleUpdateStatut}
          onDelete={handleDelete}
          categorieLabels={CATEGORIE_LABELS}
          statutLabels={STATUT_LABELS}
        />
      )}

      {/* Style pour l'animation */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
