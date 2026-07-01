import React, { useState, useEffect } from 'react';
import { log } from '../../services/logger';

const THEME = {
  accent: '#2d6a9f', accentLight: '#e8f2fb', accentHover: '#245a8a',
  bg: '#f0f2f5', card: '#ffffff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706',
};

// ✅ FIX: id est string (BDG001, BDG002...) et non number
interface Badge {
  id: string;
  nom: string;
  description?: string;
  statut: 'actif' | 'inactif';
  datecreation: string;
  icone?: string;
  couleur?: string;
  niveau?: number;
  critere?: string;
}

// Liste des icônes disponibles
const ICONES_DISPONIBLES = [
  '🥇', '🥈', '🥉', '🏆', '👑', '🌟', '⭐', '✨', '🎯', '🚀',
  '💎', '🔰', '🎖️', '🏅', '📿', '💍', '⚡', '🔥', '💯', '✅',
  '🌱', '🌿', '🍃', '♻️', '🌍', '🤝', '🎨', '🪡', '🧵', '📦',
  '📍', '🗺️', '⌛', '⏰', '📊', '📈', '💹', '🛡️', '🔒', '🎁',
];

// Liste des couleurs disponibles
const COULEURS_DISPONIBLES = [
  { nom: 'Or', code: '#FFD700' },
  { nom: 'Argent', code: '#C0C0C0' },
  { nom: 'Bronze', code: '#CD7F32' },
  { nom: 'Rouge', code: '#E74C3C' },
  { nom: 'Bleu', code: '#3498DB' },
  { nom: 'Vert', code: '#27AE60' },
  { nom: 'Violet', code: '#9B59B6' },
  { nom: 'Orange', code: '#F39C12' },
];

// Liste des critères disponibles
const CRITERES_DISPONIBLES = [
  'Nombre de ventes',
  'Note moyenne',
  'Ancienneté',
  'Nombre de produits',
  'Temps de réponse',
  'Délai d\'expédition',
  'Plan d\'abonnement',
  'Chiffre d\'affaires',
  'Produits éco-responsables',
  'Recommandations',
];

// Fonction pour récupérer le token
const getToken = () => {
  return localStorage.getItem('token');
};

// Fonction helper pour convertir un badge en format PostgreSQL (snake_case)
const buildBadgeData = (badge: Badge, updates: any = {}) => ({
  id: badge.id,
  nom: badge.nom,
  description: badge.description,
  statut: badge.statut,
  icone: badge.icone,
  couleur: badge.couleur,
  niveau: badge.niveau,
  critere: badge.critere,
  ...updates
});

// ─────────────────────────────────────────────────────────────────────────────
// MODAL CRÉATION/MODIFICATION BADGE (RÉUTILISABLE)
// ─────────────────────────────────────────────────────────────────────────────
function ModalBadge({ isOpen, badge, onClose, onSave }: {
  isOpen: boolean;
  badge: Badge | null;
  onClose: () => void;
  // ✅ FIX: id est string | null
  onSave: (id: string | null, badge: any) => void;
}) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [icone, setIcone] = useState(ICONES_DISPONIBLES[0]);
  const [couleur, setCouleur] = useState(COULEURS_DISPONIBLES[0].code);
  const [niveau, setNiveau] = useState(1);
  const [critere, setCritere] = useState(CRITERES_DISPONIBLES[0]);
  const [statut, setStatut] = useState<'actif' | 'inactif'>('actif');
  const [erreurs, setErreurs] = useState<{ nom?: string }>({});

  // Charger les données du badge quand on est en mode modification
  useEffect(() => {
    if (badge) {
      setNom(badge.nom);
      setDescription(badge.description || '');
      setStatut(badge.statut);
      setIcone(badge.icone || ICONES_DISPONIBLES[0]);
      setCouleur(badge.couleur || COULEURS_DISPONIBLES[0].code);
      setNiveau(badge.niveau || 1);
      setCritere(badge.critere || CRITERES_DISPONIBLES[0]);
    } else {
      // Reset du formulaire pour la création
      setNom('');
      setDescription('');
      setStatut('actif');
      setIcone(ICONES_DISPONIBLES[0]);
      setCouleur(COULEURS_DISPONIBLES[0].code);
      setNiveau(1);
      setCritere(CRITERES_DISPONIBLES[0]);
    }
    setErreurs({});
  }, [badge, isOpen]);

  if (!isOpen) return null;

  const valider = () => {
    const err: { nom?: string } = {};
    if (!nom.trim()) err.nom = 'Le nom du badge est requis';
    setErreurs(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = () => {
    if (!valider()) return;
    
    const badgeData = {
      nom,
      description: description || undefined,
      statut,
      icone,
      couleur,
      niveau,
      critere,
    };
    
    console.log('📤 Données du formulaire:', badgeData);
    // ✅ FIX: badge?.id est string, pas number
    onSave(badge?.id || null, badgeData);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${THEME.accent} 0%, #245a8a 100%)`,
          padding: '20px 24px',
          color: 'white'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0' }}>
            {badge ? '✏️ Modifier le badge' : '➕ Créer un badge'}
          </h3>
          <p style={{ fontSize: '13px', opacity: 0.8, margin: 0 }}>
            {badge ? `ID: ${badge.id}` : 'Ajoutez un nouveau badge pour récompenser vos vendeurs'}
          </p>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Nom */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
              Nom du badge <span style={{ color: THEME.danger }}>*</span>
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Vendeur Or, Expert, Fidèle..."
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du badge..."
              rows={2}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${THEME.border}`,
                borderRadius: '8px',
                fontSize: '13px',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Icône */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>
              Icône
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '8px',
              maxHeight: '150px',
              overflowY: 'auto',
              padding: '4px'
            }}>
              {ICONES_DISPONIBLES.map(ic => (
                <div
                  key={ic}
                  onClick={() => setIcone(ic)}
                  style={{
                    backgroundColor: icone === ic ? THEME.accentLight : '#f8fafc',
                    border: `2px solid ${icone === ic ? THEME.accent : THEME.border}`,
                    borderRadius: '8px',
                    padding: '8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontSize: '24px'
                  }}
                >
                  {ic}
                </div>
              ))}
            </div>
          </div>

          {/* Couleur */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>
              Couleur
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px'
            }}>
              {COULEURS_DISPONIBLES.map(c => (
                <div
                  key={c.code}
                  onClick={() => setCouleur(c.code)}
                  style={{
                    backgroundColor: c.code,
                    border: `3px solid ${couleur === c.code ? THEME.accent : 'transparent'}`,
                    borderRadius: '8px',
                    padding: '10px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '700',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}
                >
                  {c.nom}
                </div>
              ))}
            </div>
          </div>

          {/* Niveau */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Niveau
            </label>
            <select
              value={niveau}
              onChange={(e) => setNiveau(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${THEME.border}`,
                borderRadius: '8px',
                fontSize: '13px'
              }}
            >
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>Niveau {n}</option>
              ))}
            </select>
          </div>

          {/* Critère */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Critère d'attribution
            </label>
            <select
              value={critere}
              onChange={(e) => setCritere(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${THEME.border}`,
                borderRadius: '8px',
                fontSize: '13px'
              }}
            >
              {CRITERES_DISPONIBLES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Statut */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
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
        </div>

        {/* Boutons */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${THEME.border}`,
          backgroundColor: '#fafafa',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              border: `1px solid ${THEME.border}`,
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '10px 24px',
              backgroundColor: THEME.accent,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {badge ? '✅ Enregistrer' : '✅ Créer le badge'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL SUPPRESSION
// ─────────────────────────────────────────────────────────────────────────────
function ModalSuppression({ badge, onConfirm, onCancel }: { 
  badge: Badge; 
  onConfirm: () => void; 
  onCancel: () => void;
}) {
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.6)', 
      zIndex: 10000, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px' 
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '16px', 
        width: '100%', 
        maxWidth: '420px', 
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', 
        overflow: 'hidden' 
      }}>
        <div style={{ 
          padding: '20px 24px', 
          backgroundColor: '#fee2e2', 
          borderBottom: `2px solid ${THEME.danger}` 
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 2px 0', color: '#991b1b' }}>
            🗑️ Supprimer ce badge
          </h3>
          <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
            Cette action est irréversible
          </p>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ 
            backgroundColor: '#f8fafc', 
            borderRadius: '10px', 
            padding: '14px 18px', 
            marginBottom: '16px', 
            border: `1px solid ${THEME.border}` 
          }}>
            <p style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text }}>
              {badge.icone} {badge.nom}
            </p>
            <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0 }}>
              ID: {badge.id}
            </p>
          </div>
          <p style={{ fontSize: '13px', color: THEME.text, margin: '0 0 20px 0' }}>
            Voulez-vous vraiment supprimer <strong>{badge.nom}</strong> ?
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button 
              onClick={onCancel} 
              style={{ 
                padding: '10px 20px', 
                border: `1px solid ${THEME.border}`, 
                borderRadius: '8px', 
                backgroundColor: 'white', 
                color: THEME.text, 
                fontSize: '13px', 
                fontWeight: '600', 
                cursor: 'pointer' 
              }}
            >
              Annuler
            </button>
            <button 
              onClick={onConfirm} 
              style={{ 
                padding: '10px 20px', 
                border: 'none', 
                borderRadius: '8px', 
                backgroundColor: THEME.danger, 
                color: 'white', 
                fontSize: '13px', 
                fontWeight: '700', 
                cursor: 'pointer' 
              }}
            >
              🗑️ Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function GestionBadges() {
  const [badges, setBadges] = useState<Badge[]>([]);
  // ✅ FIX: menuOuvert est string | null (pas number)
  const [menuOuvert, setMenuOuvert] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const [modalBadgeOuvert, setModalBadgeOuvert] = useState(false);
  const [badgeEnCours, setBadgeEnCours] = useState<Badge | null>(null);
  const [modalSuppressionOuvert, setModalSuppressionOuvert] = useState(false);
  const [badgeASupprimer, setBadgeASupprimer] = useState<Badge | null>(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'actif' | 'inactif'>('tous');
  const [loading, setLoading] = useState(true);

  // Charger les badges depuis PostgreSQL
  const chargerBadges = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      const response = await fetch('https://evend-multivendeur-api.onrender.com/api/badges', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error('Session expirée');
        if (response.status === 403) throw new Error('Accès non autorisé');
        throw new Error('Erreur chargement');
      }
      
      const data = await response.json();
      
      const badgesTransformes = data.map((p: any) => ({
        // ✅ FIX: id reste string (String(p.id) conserve BDG001, BDG002...)
        id: String(p.id),
        nom: p.nom || '',
        description: p.description || '',
        statut: p.statut || 'actif',
        datecreation: p.datecreation || p.date_creation || new Date().toISOString().split('T')[0],
        icone: p.icone || '🏆',
        couleur: p.couleur || '#FFD700',
        niveau: p.niveau || 1,
        critere: p.critere || '',
      }));
      
      setBadges(badgesTransformes);
      log.succes('Badges chargés', `${badgesTransformes.length} badges récupérés`);
    } catch (err) {
      console.error('❌ Erreur chargement badges:', err);
      log.erreur('Erreur chargement badges', err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerBadges();
    log.admin('Page visitée', 'Gestion des badges');
  }, []);

  // ✅ FIX: badgeId est string
  const handleMenuClick = (e: React.MouseEvent, badgeId: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
    const menuWidth = 220;
    let left = rect.left;
    
    if (left + menuWidth > window.innerWidth) {
      left = rect.right - menuWidth;
    }
    
    setMenuPosition({ left, top: rect.bottom + 5 });
    setMenuOuvert(badgeId);
  };

  // ✅ FIX: id est string
  const toggleStatut = async (id: string) => {
    const badge = badges.find(b => b.id === id);
    if (!badge) return;
    
    const nouveauStatut = badge.statut === 'actif' ? 'inactif' : 'actif';
    
    try {
      const token = getToken();
      
      const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/badges/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ statut: nouveauStatut })
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || errorData.error || `Erreur ${response.status}`);
        } catch {
          throw new Error(`Erreur ${response.status}: ${responseText.substring(0, 100)}`);
        }
      }

      const badgeMisAJour = JSON.parse(responseText);
      
      setBadges(prevBadges => 
        prevBadges.map(b => b.id === id ? { ...b, statut: nouveauStatut } : b)
      );
      
      setMenuOuvert(null);
      setMenuPosition(null);
      
      log.admin(
        'Statut badge modifié', 
        `Badge ${badge.nom} ${nouveauStatut === 'actif' ? 'activé' : 'désactivé'} (ID: ${badge.id})`
      );
      
    } catch (err) {
      console.error('❌ Erreur:', err);
      log.erreur('Erreur changement statut', err instanceof Error ? err.message : 'Erreur inconnue');
      alert(`Erreur lors du changement de statut: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

  // Ouvrir modal de création
  const handleCreerClick = () => {
    setBadgeEnCours(null);
    setModalBadgeOuvert(true);
  };

  // Ouvrir modal de modification
  const handleModifierClick = (badge: Badge) => {
    setBadgeEnCours(badge);
    setModalBadgeOuvert(true);
    setMenuOuvert(null);
    setMenuPosition(null);
  };

  // ✅ FIX: id est string | null
  const handleSaveBadge = async (id: string | null, badgeData: any) => {
    try {
      const token = getToken();
      const url = id 
        ? `https://evend-multivendeur-api.onrender.com/api/badges/${id}`
        : 'https://evend-multivendeur-api.onrender.com/api/badges';
      
      const method = id ? 'PUT' : 'POST';
      
      console.log(`📤 ${method} badge (ID: ${id}):`, badgeData);
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(badgeData)
      });

      const responseText = await response.text();
      console.log('📥 Réponse brute:', responseText);

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || errorData.error || `Erreur ${response.status}`);
        } catch {
          throw new Error(`Erreur ${response.status}: ${responseText.substring(0, 100)}`);
        }
      }

      const badgeSauvegarde = JSON.parse(responseText);
      // ✅ FIX: s'assurer que l'id retourné est aussi string
      badgeSauvegarde.id = String(badgeSauvegarde.id);
      
      if (id) {
        // Modification
        setBadges(prev => prev.map(b => b.id === id ? badgeSauvegarde : b));
        log.admin('Badge modifié', `Badge ${badgeSauvegarde.nom} modifié (ID: ${id})`);
        alert('✅ Badge modifié avec succès !');
      } else {
        // Création
        setBadges(prev => [badgeSauvegarde, ...prev]);
        log.succes('Badge créé', `Badge ${badgeSauvegarde.nom} créé (ID: ${badgeSauvegarde.id})`);
        alert('✅ Badge créé avec succès !');
      }
      
      setModalBadgeOuvert(false);
      setBadgeEnCours(null);
      
    } catch (err) {
      console.error('❌ Erreur:', err);
      log.erreur('Erreur sauvegarde badge', err instanceof Error ? err.message : 'Erreur inconnue');
      alert(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

  // Demander confirmation suppression
  const demanderSuppression = (badge: Badge) => {
    setBadgeASupprimer(badge);
    setModalSuppressionOuvert(true);
    setMenuOuvert(null);
    setMenuPosition(null);
  };

  // Confirmer suppression
  const confirmerSuppression = async () => {
    if (!badgeASupprimer) return;
    
    try {
      const token = getToken();
      const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/badges/${badgeASupprimer.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || errorData.error || `Erreur ${response.status}`);
        } catch {
          throw new Error(`Erreur ${response.status}: ${responseText.substring(0, 100)}`);
        }
      }

      setBadges(prevBadges => prevBadges.filter(b => b.id !== badgeASupprimer.id));
      setModalSuppressionOuvert(false);
      setBadgeASupprimer(null);
      
      log.admin('Badge supprimé', `Badge ${badgeASupprimer.nom} supprimé (ID: ${badgeASupprimer.id})`);
      alert('✅ Badge supprimé avec succès');
      
    } catch (err) {
      console.error('❌ Erreur:', err);
      log.erreur('Erreur suppression badge', err instanceof Error ? err.message : 'Erreur inconnue');
      alert(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

  // Filtrage des badges
  const badgesFiltres = badges.filter(b => {
    const matchRecherche = b.nom.toLowerCase().includes(recherche.toLowerCase());
    const matchStatut = filtreStatut === 'tous' || b.statut === filtreStatut;
    return matchRecherche && matchStatut;
  }).sort((a, b) => (a.niveau || 99) - (b.niveau || 99));

  const totalActifs = badges.filter(b => b.statut === 'actif').length;
  const totalInactifs = badges.filter(b => b.statut === 'inactif').length;

  if (loading) {
    return (
      <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: THEME.textLight }}>Chargement des badges...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px 28px',
      backgroundColor: THEME.bg,
      minHeight: '100vh'
    }} onClick={() => {
      setMenuOuvert(null);
      setMenuPosition(null);
    }}>

      {/* Modals */}
      <ModalBadge
        isOpen={modalBadgeOuvert}
        badge={badgeEnCours}
        onClose={() => {
          setModalBadgeOuvert(false);
          setBadgeEnCours(null);
        }}
        onSave={handleSaveBadge}
      />

      {modalSuppressionOuvert && badgeASupprimer && (
        <ModalSuppression
          badge={badgeASupprimer}
          onConfirm={confirmerSuppression}
          onCancel={() => {
            setModalSuppressionOuvert(false);
            setBadgeASupprimer(null);
          }}
        />
      )}

      {/* En-tête */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '22px', 
            fontWeight: '800', 
            margin: 0, 
            color: THEME.text, 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px' 
          }}>
            Gestion des badges
          </h1>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: '4px 0 0 0' }}>
            {badges.length} badge{badges.length > 1 ? 's' : ''} configuré{badges.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleCreerClick}
          style={{ 
            backgroundColor: THEME.accent, 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            padding: '10px 20px', 
            fontSize: '13px', 
            fontWeight: '700', 
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(45,106,159,0.3)'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#245a8a'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = THEME.accent}
        >
          ＋ Créer un badge
        </button>
      </div>

      {/* KPIs */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '14px', 
        marginBottom: '20px' 
      }}>
        {[
          { label: 'Badges actifs', val: String(totalActifs), icon: '✅', color: THEME.success },
          { label: 'Badges inactifs', val: String(totalInactifs), icon: '⏸️', color: THEME.textLight },
          { label: 'Niveaux', val: '5', icon: '📊', color: THEME.accent },
          { label: 'Attribués', val: '0', icon: '👥', color: THEME.warning },
        ].map((k, i) => (
          <div key={i} style={{ 
            backgroundColor: THEME.card, 
            borderRadius: '10px', 
            border: `1px solid ${THEME.border}`, 
            padding: '16px 18px',
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px' 
          }}>
            <div style={{ 
              fontSize: '24px', 
              width: '40px', 
              height: '40px', 
              borderRadius: '8px', 
              backgroundColor: k.color + '15', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>{k.icon}</div>
            <div>
              <p style={{ fontSize: '20px', fontWeight: '800', color: THEME.text, margin: 0 }}>{k.val}</p>
              <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '20px', 
        alignItems: 'center' 
      }}>
        <input
          type="text" 
          value={recherche} 
          onChange={e => setRecherche(e.target.value)}
          placeholder="🔍 Rechercher un badge..."
          style={{ 
            border: `1px solid ${THEME.border}`, 
            borderRadius: '8px', 
            padding: '8px 14px', 
            fontSize: '13px', 
            outline: 'none', 
            width: '250px', 
            backgroundColor: 'white' 
          }}
        />
        {[
          { val: 'tous', label: 'Tous' }, 
          { val: 'actif', label: '✅ Actifs' }, 
          { val: 'inactif', label: '⏸️ Inactifs' }
        ].map(f => (
          <button 
            key={f.val} 
            onClick={() => setFiltreStatut(f.val as any)} 
            style={{ 
              padding: '8px 16px', 
              borderRadius: '8px', 
              fontSize: '12px', 
              fontWeight: '700', 
              cursor: 'pointer', 
              border: `2px solid ${filtreStatut === f.val ? THEME.accent : THEME.border}`, 
              backgroundColor: filtreStatut === f.val ? THEME.accentLight : 'white', 
              color: filtreStatut === f.val ? THEME.accent : THEME.textLight 
            }}
          >
            {f.label}
          </button>
        ))}
        <span style={{ fontSize: '12px', color: THEME.textLight }}>
          {badgesFiltres.length} résultat{badgesFiltres.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Tableau */}
      <div style={{ 
        backgroundColor: THEME.card,
        borderRadius: '12px',
        border: `1px solid ${THEME.border}`,
        overflow: 'auto',
        position: 'relative'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          minWidth: '1000px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}` }}>
              <th style={{ padding: '14px 8px', width: '80px', textAlign: 'center' }}>ID</th>
              <th style={{ padding: '14px 8px', textAlign: 'left', width: '200px' }}>Badge</th>
              <th style={{ padding: '14px 8px', textAlign: 'left', width: '250px' }}>Description</th>
              <th style={{ padding: '14px 8px', textAlign: 'center', width: '80px' }}>Icône</th>
              <th style={{ padding: '14px 8px', textAlign: 'center', width: '80px' }}>Couleur</th>
              <th style={{ padding: '14px 8px', textAlign: 'center', width: '80px' }}>Niveau</th>
              <th style={{ padding: '14px 8px', textAlign: 'left', width: '200px' }}>Critère</th>
              <th style={{ padding: '14px 8px', textAlign: 'center', width: '100px' }}>Statut</th>
              <th style={{ padding: '14px 8px', textAlign: 'center', width: '100px' }}>Date</th>
              <th style={{ padding: '14px 8px', textAlign: 'center', width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {badgesFiltres.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: THEME.textLight }}>
                  Aucun badge trouvé
                </td>
              </tr>
            ) : (
              badgesFiltres.map((badge, i) => (
                <tr key={badge.id} style={{ 
                  borderBottom: '1px solid #f5f5f5', 
                  backgroundColor: i % 2 === 0 ? 'white' : '#fafafa',
                  opacity: badge.statut === 'inactif' ? 0.6 : 1
                }}>
                  <td style={{ padding: '14px 8px', textAlign: 'center', fontWeight: '600', color: THEME.textLight }}>
                    #{badge.id}
                  </td>
                  <td style={{ padding: '14px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{badge.icone}</span>
                      <div>
                        <span style={{ fontWeight: '800', color: THEME.text }}>{badge.nom}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 8px', fontSize: '12px', color: THEME.textLight }}>
                    {badge.description || '—'}
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'center', fontSize: '20px' }}>
                    {badge.icone}
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      backgroundColor: badge.couleur || '#cccccc',
                      margin: '0 auto',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }} />
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: badge.niveau === 1 ? '#FFD700' : badge.niveau === 2 ? '#C0C0C0' : badge.niveau === 3 ? '#CD7F32' : '#f1f5f9',
                      color: badge.niveau && badge.niveau <= 3 ? 'black' : THEME.text,
                      lineHeight: '24px',
                      fontSize: '12px',
                      fontWeight: '700',
                    }}>
                      {badge.niveau}
                    </span>
                  </td>
                  <td style={{ padding: '14px 8px', fontSize: '12px', color: THEME.textLight }}>
                    {badge.critere || '—'}
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      backgroundColor: badge.statut === 'actif' ? '#dcfce7' : '#f3f4f6', 
                      color: badge.statut === 'actif' ? THEME.success : THEME.textLight,
                      border: `1px solid ${badge.statut === 'actif' ? '#86efac' : '#d1d5db'}`
                    }}>
                      {badge.statut === 'actif' ? '✓ Actif' : '⏸ Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 8px', fontSize: '11px', color: THEME.textLight, textAlign: 'center' }}>
                    {new Date(badge.datecreation).toLocaleDateString('fr-CA')}
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                    <button
                      onClick={(e) => handleMenuClick(e, badge.id)}
                      style={{ 
                        background: 'none', 
                        border: `1px solid ${THEME.border}`, 
                        borderRadius: '4px', 
                        padding: '4px 8px', 
                        cursor: 'pointer', 
                        fontSize: '16px', 
                        color: THEME.textLight, 
                        fontWeight: '700',
                        lineHeight: 1
                      }}
                    >
                      ⋯
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Menu contextuel flottant */}
      {menuOuvert !== null && menuPosition && (
        <div style={{ 
          position: 'fixed',
          left: menuPosition.left,
          top: menuPosition.top,
          zIndex: 9999,
          backgroundColor: 'white',
          borderRadius: '10px',
          border: `1px solid ${THEME.border}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          minWidth: '220px',
          overflow: 'hidden'
        }}>
          {(() => {
            const badge = badges.find(b => b.id === menuOuvert);
            if (!badge) return null;
            
            return (
              <div style={{ padding: '4px 0' }}>
                <MenuItem 
                  onClick={() => handleModifierClick(badge)}
                  icon="✏️"
                  label="Modifier le badge"
                />
                <MenuItem 
                  onClick={() => toggleStatut(badge.id)}
                  icon={badge.statut === 'actif' ? '⏸️' : '▶️'}
                  label={badge.statut === 'actif' ? 'Désactiver' : 'Activer'}
                  color={badge.statut === 'actif' ? THEME.warning : THEME.success}
                />
                <div style={{ height: '1px', backgroundColor: THEME.border, margin: '4px 0' }} />
                <MenuItem 
                  onClick={() => demanderSuppression(badge)}
                  icon="🗑️"
                  label="Supprimer ce badge"
                  color={THEME.danger}
                  danger
                />
              </div>
            );
          })()}
        </div>
      )}

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
          {badgesFiltres.length} badge{badgesFiltres.length > 1 ? 's' : ''} affiché{badgesFiltres.length > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

// Composant helper pour les items du menu
function MenuItem({ onClick, icon, label, color = '#1a2332', danger = false }: { 
  onClick: () => void; 
  icon: string; 
  label: string; 
  color?: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        width: '100%', 
        padding: '11px 16px', 
        border: 'none', 
        background: 'none', 
        cursor: 'pointer', 
        fontSize: '13px', 
        color: color, 
        fontWeight: '600', 
        textAlign: 'left',
        transition: 'background-color 0.2s'
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = danger ? '#fee2e2' : '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <span style={{ fontSize: '16px' }}>{icon}</span> {label}
    </button>
  );
}
