/**
 * ConfigurationEncheres.tsx
 * src/pages/acheteur/ConfigurationEncheres.tsx
 * Page de configuration des enchères pour l'acheteur - Design WOW!
 */

import React, { useState, useEffect } from 'react';

// Couleurs
const C = {
  blue: '#3b82f6',
  blueLight: 'rgba(59,130,246,0.15)',
  green: '#10b981',
  greenLight: 'rgba(16,185,129,0.15)',
  yellow: '#f59e0b',
  yellowLight: 'rgba(245,158,11,0.15)',
  red: '#ef4444',
  redLight: 'rgba(239,68,68,0.15)',
  purple: '#8b5cf6',
  purpleLight: 'rgba(139,92,246,0.15)',
  orange: '#f97316',
  orangeLight: 'rgba(249,115,22,0.15)',
  border: 'rgba(255,255,255,0.08)',
  textLight: 'rgba(255,255,255,0.5)',
  cardBg: 'rgba(255,255,255,0.03)',
  inputBg: 'rgba(255,255,255,0.05)',
};

interface Categorie {
  id: number;
  nom: string;
  description?: string;
  active: boolean;
}

export default function ConfigurationEncheres({ naviguer }: { naviguer: (page: string, props?: any) => void }) {
  // États pour la configuration
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageSucces, setMessageSucces] = useState(false);
  const [estModifie, setEstModifie] = useState(false);
  
  // États pour les catégories
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [categoriesChoisies, setCategoriesChoisies] = useState<number[]>([]);
  const [rechercheCategorie, setRechercheCategorie] = useState('');
  const [categoriesFiltrees, setCategoriesFiltrees] = useState<Categorie[]>([]);
  
  // Récupérer l'ID de l'acheteur connecté
  const acheteurId = 1; // À remplacer par l'ID dynamique

  // ── Configuration enchères ──
  const [nomUtilisateur, setNomUtilisateur] = useState('');
  const [notificationsActif, setNotificationsActif] = useState(true);
  const [alertesEmailActif, setAlertesEmailActif] = useState(true);
  const [miseMaximaleDefaut, setMiseMaximaleDefaut] = useState('');

  // Charger les catégories et la configuration
  useEffect(() => {
    chargerCategories();
    chargerConfiguration();
  }, []);

  // Filtrer les catégories en fonction de la recherche
  useEffect(() => {
    const filtered = categories.filter(cat =>
      cat.nom.toLowerCase().includes(rechercheCategorie.toLowerCase())
    );
    setCategoriesFiltrees(filtered);
  }, [rechercheCategorie, categories]);

  const chargerCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // La route retourne { categories: [...] }
        const categoriesData = data.categories || data;
        setCategories(categoriesData.filter((cat: Categorie) => cat.active !== false));
      }
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
    }
  };

  const chargerConfiguration = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/acheteurs/${acheteurId}/config`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de la configuration');
      }
      
      const data = await response.json();
      
      setNomUtilisateur(data.nom_utilisateur || '');
      setNotificationsActif(data.notifications_actif !== undefined ? data.notifications_actif : true);
      setAlertesEmailActif(data.alertes_email_actif !== undefined ? data.alertes_email_actif : true);
      setMiseMaximaleDefaut(data.mise_maximale_defaut?.toString() || '');
      setCategoriesChoisies(data.categories_preferees || []);
      
    } catch (err) {
      console.error('Erreur chargement config:', err);
      setError('Impossible de charger la configuration');
    } finally {
      setLoading(false);
    }
  };

  const sauvegarderConfiguration = async () => {
    setSaving(true);
    setError(null);
    
    const configData = {
      nom_utilisateur: nomUtilisateur,
      notifications_actif: notificationsActif,
      alertes_email_actif: alertesEmailActif,
      mise_maximale_defaut: miseMaximaleDefaut ? parseFloat(miseMaximaleDefaut) : null,
      categories_preferees: categoriesChoisies
    };
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/acheteurs/${acheteurId}/config`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configData)
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }
      
      setMessageSucces(true);
      setEstModifie(false);
      
      setTimeout(() => {
        setMessageSucces(false);
      }, 3000);
      
    } catch (err) {
      console.error('Erreur sauvegarde config:', err);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const ajouterCategorie = (categorieId: number) => {
    if (!categoriesChoisies.includes(categorieId) && categoriesChoisies.length < 10) {
      setCategoriesChoisies([...categoriesChoisies, categorieId]);
      setEstModifie(true);
    }
  };

  const supprimerCategorie = (categorieId: number) => {
    setCategoriesChoisies(categoriesChoisies.filter(id => id !== categorieId));
    setEstModifie(true);
  };

  const annulerModifications = () => {
    chargerConfiguration();
    setEstModifie(false);
    setError(null);
    setRechercheCategorie('');
  };

  // Obtenir le nom d'une catégorie par son ID
  const getCategorieNom = (id: number) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.nom : 'Catégorie';
  };

  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: C.textLight }}>Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeUp 0.5s ease' }}>
      {/* En-tête avec statistiques - Style WOW! */}
      <div style={{
        background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <span style={{ fontSize: '40px' }}>⚙️</span>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
              Configuration enchères
            </h1>
          </div>
          <p style={{ margin: '0 0 20px', fontSize: '16px', color: 'rgba(255,255,255,0.8)', maxWidth: '500px' }}>
            Personnalisez vos paramètres pour les enchères et votre profil public.
          </p>
          
          {/* Statistiques rapides */}
          <div style={{ display: 'flex', gap: '40px' }}>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{categoriesChoisies.length}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Catégories suivies</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{nomUtilisateur || '—'}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Nom d'enchère</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{miseMaximaleDefaut ? `${miseMaximaleDefaut}$` : '—'}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Mise max défaut</div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages d'erreur et succès */}
      {error && (
        <div style={{
          marginBottom: '24px',
          padding: '16px 20px',
          background: C.redLight,
          border: `1px solid ${C.red}40`,
          borderRadius: '12px',
          color: C.red,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '20px' }}>❌</span>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {messageSucces && (
        <div style={{
          marginBottom: '24px',
          padding: '16px 20px',
          background: C.greenLight,
          border: `1px solid ${C.green}40`,
          borderRadius: '12px',
          color: C.green,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeUp 0.3s ease',
        }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Vos modifications ont été enregistrées avec succès!</span>
        </div>
      )}

      {/* Carte de configuration - Nom d'utilisateur */}
      <div style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: '24px',
        padding: '28px',
        marginBottom: '24px',
      }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
          Mettre à jour le nom d'utilisateur
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: C.textLight }}>
          Ce nom sera affiché publiquement sur vos enchères pour protéger votre vie privée. Les autres enchérisseurs verront ce nom au lieu de votre nom réel.
        </p>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#fff' }}>
            Nom d'utilisateur (surnom)
          </label>
          <input
            type="text"
            value={nomUtilisateur}
            onChange={(e) => {
              setNomUtilisateur(e.target.value);
              setEstModifie(true);
            }}
            placeholder="Entrez votre surnom..."
            style={{
              width: '100%',
              padding: '14px 16px',
              background: C.inputBg,
              border: `1px solid ${estModifie ? C.orange : C.border}`,
              borderRadius: '12px',
              color: '#fff',
              fontSize: '16px',
              outline: 'none',
              transition: 'all 0.2s',
            }}
          />
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: C.textLight }}>
            💡 Exemple: "Enchérisseur123", "Collectionneur", "Fan_de_vinyls"
          </p>
        </div>

        {/* Aperçu */}
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '12px',
          border: `1px dashed ${C.border}`,
        }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Aperçu de votre profil public
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.purple}, ${C.blue})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 700,
              color: '#fff',
            }}>
              {nomUtilisateur.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>{nomUtilisateur || 'Non défini'}</p>
              <p style={{ margin: 0, fontSize: '12px', color: C.textLight }}>Membre depuis 2025</p>
            </div>
          </div>
        </div>
      </div>

      {/* Carte - Notifications */}
      <div style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: '24px',
        padding: '28px',
        marginBottom: '24px',
      }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
          🔔 Notifications
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: C.textLight }}>
          Gérez comment vous souhaitez être averti lors des enchères.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
            <div>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>Notifications push</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: C.textLight }}>Recevoir des notifications dans le navigateur</p>
            </div>
            <Toggle 
              actif={notificationsActif} 
              onChange={() => {
                setNotificationsActif(!notificationsActif);
                setEstModifie(true);
              }} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
            <div>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>📧 Alertes email</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: C.textLight }}>Recevoir un email lors des mises et des résultats</p>
            </div>
            <Toggle 
              actif={alertesEmailActif} 
              onChange={() => {
                setAlertesEmailActif(!alertesEmailActif);
                setEstModifie(true);
              }} 
            />
          </div>
        </div>
      </div>

      {/* Carte - Mise maximale par défaut */}
      <div style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: '24px',
        padding: '28px',
        marginBottom: '24px',
      }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
          💰 Mise maximale par défaut
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: C.textLight }}>
          Définissez un montant maximum par défaut pour les enchères automatiques. Vous pourrez le modifier par enchère.
        </p>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#fff' }}>
            Montant maximum (CAD)
          </label>
          <input
            type="number"
            value={miseMaximaleDefaut}
            onChange={(e) => {
              setMiseMaximaleDefaut(e.target.value);
              setEstModifie(true);
            }}
            placeholder="Ex: 500"
            min="0"
            step="10"
            style={{
              width: '100%',
              padding: '14px 16px',
              background: C.inputBg,
              border: `1px solid ${estModifie ? C.orange : C.border}`,
              borderRadius: '12px',
              color: '#fff',
              fontSize: '16px',
              outline: 'none',
              transition: 'all 0.2s',
            }}
          />
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: C.textLight }}>
            💡 Laissez vide pour ne pas définir de limite par défaut.
          </p>
        </div>
      </div>

      {/* Carte - Catégories de suivi */}
      <div style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: '24px',
        padding: '28px',
        marginBottom: '24px',
      }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
          🏷️ Catégories à suivre
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: C.textLight }}>
          Sélectionnez les catégories qui vous intéressent. Vous recevrez des notifications pour les enchères dans ces catégories.
        </p>

        {/* Barre de recherche */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
            <input
              type="text"
              value={rechercheCategorie}
              onChange={(e) => setRechercheCategorie(e.target.value)}
              placeholder="Rechercher une catégorie..."
              style={{
                width: '100%',
                padding: '14px 16px 14px 44px',
                background: C.inputBg,
                border: `1px solid ${C.border}`,
                borderRadius: '12px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Liste des catégories disponibles */}
        <div style={{ marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }}>
          <p style={{ fontSize: '12px', color: C.textLight, marginBottom: '12px' }}>
            {categoriesFiltrees.length} catégories disponibles
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {categoriesFiltrees.map((categorie) => {
              const estSelectionnee = categoriesChoisies.includes(categorie.id);
              return (
                <button
                  key={categorie.id}
                  onClick={() => estSelectionnee ? supprimerCategorie(categorie.id) : ajouterCategorie(categorie.id)}
                  disabled={!estSelectionnee && categoriesChoisies.length >= 10}
                  style={{
                    padding: '8px 16px',
                    background: estSelectionnee ? C.orangeLight : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${estSelectionnee ? C.orange : C.border}`,
                    borderRadius: '20px',
                    color: estSelectionnee ? C.orange : '#fff',
                    fontSize: '13px',
                    cursor: (!estSelectionnee && categoriesChoisies.length >= 10) ? 'not-allowed' : 'pointer',
                    opacity: (!estSelectionnee && categoriesChoisies.length >= 10) ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {estSelectionnee ? '✓ ' : '➕ '}{categorie.nom}
                </button>
              );
            })}
          </div>
          {categoriesFiltrees.length === 0 && rechercheCategorie && (
            <p style={{ textAlign: 'center', padding: '20px', color: C.textLight }}>
              Aucune catégorie trouvée pour "{rechercheCategorie}"
            </p>
          )}
        </div>

        {/* Catégories sélectionnées */}
        {categoriesChoisies.length > 0 && (
          <div style={{
            borderTop: `1px solid ${C.border}`,
            paddingTop: '16px',
            marginTop: '8px',
          }}>
            <p style={{ fontSize: '12px', color: C.textLight, marginBottom: '12px' }}>
              📌 Catégories suivies ({categoriesChoisies.length}/10) :
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {categoriesChoisies.map((id) => (
                <span
                  key={id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    background: C.orangeLight,
                    border: `1px solid ${C.orange}40`,
                    borderRadius: '20px',
                    fontSize: '13px',
                    color: C.orange,
                  }}
                >
                  🏷️ {getCategorieNom(id)}
                  <span
                    onClick={() => supprimerCategorie(id)}
                    style={{
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: C.red,
                    }}
                  >
                    ×
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
        
        {categoriesChoisies.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '12px',
            border: `1px dashed ${C.border}`,
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>
              Aucune catégorie sélectionnée. Utilisez la recherche ci-dessus pour ajouter des catégories à suivre.
            </p>
          </div>
        )}
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', gap: '12px', maxWidth: '600px', margin: '0 auto' }}>
        <button
          onClick={annulerModifications}
          disabled={!estModifie || saving}
          style={{
            flex: 1,
            padding: '14px',
            background: !estModifie ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${C.border}`,
            borderRadius: '12px',
            color: !estModifie ? C.textLight : '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: !estModifie ? 'not-allowed' : 'pointer',
            opacity: !estModifie ? 0.5 : 1,
          }}
        >
          Annuler
        </button>
        <button
          onClick={sauvegarderConfiguration}
          disabled={!estModifie || saving}
          style={{
            flex: 1,
            padding: '14px',
            background: !estModifie 
              ? 'rgba(249,115,22,0.3)' 
              : `linear-gradient(135deg, ${C.orange}, ${C.yellow})`,
            border: 'none',
            borderRadius: '12px',
            color: !estModifie ? C.textLight : '#fff',
            fontSize: '14px',
            fontWeight: 700,
            cursor: !estModifie ? 'not-allowed' : 'pointer',
            boxShadow: !estModifie ? 'none' : `0 10px 20px -10px ${C.orange}`,
          }}
        >
          {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder toutes les modifications'}
        </button>
      </div>
    </div>
  );
}

// Composant Toggle réutilisable
function Toggle({ actif, onChange }: { actif: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: '48px',
        height: '26px',
        borderRadius: '13px',
        backgroundColor: actif ? '#f97316' : '#ccc',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background-color 0.2s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '3px',
          left: actif ? '25px' : '3px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          transition: 'left 0.2s',
        }}
      />
    </div>
  );
}
