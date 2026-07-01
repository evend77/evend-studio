/**
 * Notifications.tsx — src/pages/acheteur/Notifications.tsx
 * Page des notifications de l'administration pour l'acheteur
 * Affichage des notifications avec images, marquage lu/non lu
 */

import React, { useState, useEffect, useCallback } from 'react';

const API = 'https://evend-multivendeur-api.onrender.com';

// Types
type NotificationType = 'information' | 'succes' | 'avertissement' | 'urgent' | 'maintenance';

interface Notification {
  id: number;
  titre: string;
  message: string;
  date: string;
  type: NotificationType;
  lu: boolean;
  important?: boolean;
  image_url?: string;
  lien?: {
    texte: string;
    url: string;
  };
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
  emerald: '#059669',
  emeraldLight: 'rgba(5,150,105,0.15)',
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
  
  // Couleurs par type
  information: '#3b82f6',
  informationLight: 'rgba(59,130,246,0.15)',
  succes: '#10b981',
  succesLight: 'rgba(16,185,129,0.15)',
  avertissement: '#f59e0b',
  avertissementLight: 'rgba(245,158,11,0.15)',
  urgent: '#ef4444',
  urgentLight: 'rgba(239,68,68,0.15)',
  maintenance: '#8b5cf6',
  maintenanceLight: 'rgba(139,92,246,0.15)',
};

// ============================================================================
// BADGE DE TYPE DE NOTIFICATION
// ============================================================================
const TypeBadge = ({ type }: { type: NotificationType }) => {
  const config = {
    information: { bg: C.informationLight, color: C.information, icon: 'ℹ️', label: 'Information' },
    succes: { bg: C.succesLight, color: C.succes, icon: '✅', label: 'Succès' },
    avertissement: { bg: C.avertissementLight, color: C.avertissement, icon: '⚠️', label: 'Avertissement' },
    urgent: { bg: C.urgentLight, color: C.urgent, icon: '🚨', label: 'Urgent' },
    maintenance: { bg: C.maintenanceLight, color: C.maintenance, icon: '🔧', label: 'Maintenance' },
  };
  const { bg, color, icon, label } = config[type];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '11px',
      fontWeight: 700,
      padding: '4px 10px',
      borderRadius: '20px',
      background: bg,
      color: color,
      border: `1px solid ${color}40`,
    }}>
      {icon} {label}
    </span>
  );
};

// ============================================================================
// COMPOSANT DE CARTE NOTIFICATION
// ============================================================================
const NotificationCard = ({ 
  notification, 
  onMarquerLu, 
}: { 
  notification: Notification; 
  onMarquerLu: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  
  // Couleur de l'accent selon le type
  const getAccentColor = () => {
    switch (notification.type) {
      case 'information': return C.information;
      case 'succes': return C.succes;
      case 'avertissement': return C.avertissement;
      case 'urgent': return C.urgent;
      case 'maintenance': return C.maintenance;
      default: return C.blue;
    }
  };

  const accentColor = getAccentColor();
  const accentLight = `${accentColor}15`;

  return (
    <div
      style={{
        background: notification.lu ? C.cardBg : `linear-gradient(135deg, ${accentLight} 0%, ${C.cardBg} 100%)`,
        border: `1px solid ${notification.lu ? C.border : `${accentColor}40`}`,
        borderRadius: '20px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        position: 'relative',
        cursor: 'pointer',
        boxShadow: notification.lu 
          ? '0 10px 30px -15px rgba(0,0,0,0.5)' 
          : `0 10px 30px -10px ${accentColor}30`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 20px 40px -15px ${accentColor}50`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = notification.lu 
          ? '0 10px 30px -15px rgba(0,0,0,0.5)' 
          : `0 10px 30px -10px ${accentColor}30`;
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Indicateur de non-lu */}
      {!notification.lu && (
        <div style={{
          position: 'absolute',
          left: '0',
          top: '0',
          bottom: '0',
          width: '4px',
          background: accentColor,
        }} />
      )}

      <div style={{ padding: '20px 24px' }}>
        {/* En-tête */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: expanded ? '16px' : '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            {/* Icône de type */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: `${accentColor}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: accentColor,
            }}>
              {notification.type === 'information' && 'ℹ️'}
              {notification.type === 'succes' && '✅'}
              {notification.type === 'avertissement' && '⚠️'}
              {notification.type === 'urgent' && '🚨'}
              {notification.type === 'maintenance' && '🔧'}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '18px', 
                  fontWeight: notification.lu ? 600 : 800, 
                  color: '#fff', 
                  fontFamily: "'Sora', sans-serif" 
                }}>
                  {notification.titre}
                </h3>
                {notification.important && (
                  <span style={{
                    background: C.urgentLight,
                    color: C.urgent,
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}>
                    IMPORTANT
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: C.textLight }}>{new Date(notification.date).toLocaleDateString('fr-CA')}</span>
                <TypeBadge type={notification.type} />
              </div>
            </div>
          </div>

          {/* Bouton marquer comme lu (seulement si non lu) */}
          {!notification.lu && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarquerLu();
              }}
              style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${C.border}`,
                borderRadius: '8px',
                color: C.textLight,
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✓ Marquer comme lu
            </button>
          )}
        </div>

        {/* Image (si présente) */}
        {notification.image_url && expanded && (
          <div style={{ marginBottom: '16px', textAlign: 'center' }}>
            <img
              src={notification.image_url}
              alt=""
              style={{
                maxWidth: '100%',
                maxHeight: '200px',
                borderRadius: '12px',
                cursor: 'pointer',
              }}
              onClick={(e) => {
                e.stopPropagation();
                window.open(notification.image_url, '_blank');
              }}
            />
          </div>
        )}

        {/* Message */}
        <p style={{ 
          margin: 0, 
          fontSize: '14px', 
          color: notification.lu ? C.textLight : '#fff',
          lineHeight: '1.6',
          maxHeight: expanded ? 'none' : '3.2em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: expanded ? 'none' : 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {notification.message}
        </p>

        {/* Lien (si présent) */}
        {notification.lien && expanded && (
          <div style={{ marginTop: '16px' }}>
            <a
              href={notification.lien.url}
              style={{
                color: accentColor,
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {notification.lien.texte} →
            </a>
          </div>
        )}

        {/* Indicateur d'expansion */}
        <div style={{ 
          marginTop: '12px', 
          display: 'flex', 
          justifyContent: 'center',
          color: C.textLight,
          fontSize: '12px',
        }}>
          {expanded ? '▲ Réduire' : '▼ Voir plus'}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
interface NotificationsProps {
  naviguer: (page: string, props?: any) => void;
  userId?: number;
}

export default function Notifications({ naviguer, userId }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filtre, setFiltre] = useState<'tous' | 'non_lus' | 'lus'>('tous');
  const [filtreType, setFiltreType] = useState<'tous' | NotificationType>('tous');
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' | 'danger' } | null>(null);
  
  // Valeurs stables — lues une seule fois au montage via useRef
  const acheteurIdRef = React.useRef(userId || localStorage.getItem('userId'));
  const tokenRef = React.useRef(localStorage.getItem('token'));
  const acheteurId = acheteurIdRef.current;

  const showToast = (msg: string, type: 'success' | 'info' | 'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Charger les notifications — dépendances stables, pas de boucle infinie
  const chargerNotifications = useCallback(async () => {
    const id = acheteurIdRef.current;
    const token = tokenRef.current;

    if (!id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const url = `${API}/api/notifications/acheteurs/${id}/notifications`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        const text = await response.text();
        console.error('❌ Erreur chargement notifications:', response.status, text);
      }
    } catch (error) {
      console.error('❌ Erreur catch:', error);
    } finally {
      setLoading(false);
    }
  }, []); // ✅ Aucune dépendance — stable au montage

  useEffect(() => {
    chargerNotifications();
    
    // Polling toutes les 30 secondes
    const interval = setInterval(() => {
      console.log('🔄 Polling - Rechargement des notifications');
      chargerNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [chargerNotifications]);

  // Marquer une notification comme lue
  const marquerCommeLu = async (id: number) => {
    const token = tokenRef.current;
    try {
      const url = `${API}/api/notifications/notifications/${id}/lire`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, lu: true } : n)
        );
      }
    } catch (error) {
      console.error('❌ Erreur marquage notification:', error);
    }
  };

  // Marquer tout comme lu
  const marquerToutLu = async () => {
    const id = acheteurIdRef.current;
    const token = tokenRef.current;
    if (!id) return;
    
    try {
      const url = `${API}/api/notifications/acheteurs/${id}/notifications/lire-tout`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, lu: true }))
        );
        showToast('✅ Toutes les notifications marquées comme lues', 'success');
      }
    } catch (error) {
      console.error('❌ Erreur marquage tout:', error);
    }
  };

  // Statistiques
  const nonLus = notifications.filter(n => !n.lu).length;
  const total = notifications.length;

  // Filtrer les notifications
  const notificationsFiltrees = notifications.filter(notif => {
    // Filtre par statut de lecture
    if (filtre === 'non_lus' && notif.lu) return false;
    if (filtre === 'lus' && !notif.lu) return false;

    // Filtre par type
    if (filtreType !== 'tous' && notif.type !== filtreType) return false;

    // Recherche
    if (recherche) {
      const searchLower = recherche.toLowerCase();
      return (
        notif.titre.toLowerCase().includes(searchLower) ||
        notif.message.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  return (
    <div style={{ animation: 'fadeUp 0.5s ease' }}>
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

      {/* En-tête avec statistiques - Style WOW! */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
                🔔 Notifications
              </h1>
              <p style={{ margin: 0, fontSize: '16px', color: 'rgba(255,255,255,0.8)', maxWidth: '500px' }}>
                Messages officiels de l'administration e-Vend
              </p>
            </div>
            
            {/* Bouton tout marquer comme lu */}
            {nonLus > 0 && (
              <button
                onClick={marquerToutLu}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '30px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backdropFilter: 'blur(5px)',
                }}
              >
                ✓ Marquer tout comme lu
              </button>
            )}
          </div>
          
          {/* Statistiques rapides */}
          <div style={{ display: 'flex', gap: '32px', marginTop: '24px' }}>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{total}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Total</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{nonLus}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Non lus</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{total - nonLus}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Lus</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* Filtres par statut */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'tous', label: 'Tous' },
            { id: 'non_lus', label: 'Non lus' },
            { id: 'lus', label: 'Lus' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltre(f.id as any)}
              style={{
                padding: '8px 16px',
                borderRadius: '30px',
                border: 'none',
                background: filtre === f.id ? C.blue : 'rgba(255,255,255,0.05)',
                color: filtre === f.id ? '#fff' : C.textLight,
                fontSize: '13px',
                fontWeight: filtre === f.id ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Filtres par type */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'tous', label: 'Tous types' },
            { id: 'information', label: 'ℹ️ Information' },
            { id: 'succes', label: '✅ Succès' },
            { id: 'avertissement', label: '⚠️ Avertissement' },
            { id: 'urgent', label: '🚨 Urgent' },
            { id: 'maintenance', label: '🔧 Maintenance' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltreType(f.id as any)}
              style={{
                padding: '8px 16px',
                borderRadius: '30px',
                border: 'none',
                background: filtreType === f.id ? C.blue : 'rgba(255,255,255,0.05)',
                color: filtreType === f.id ? '#fff' : C.textLight,
                fontSize: '13px',
                fontWeight: filtreType === f.id ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Barre de recherche */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '8px',
        }}>
          <input
            type="text"
            placeholder="🔍 Rechercher dans les notifications..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{
              flex: 1,
              maxWidth: '400px',
              padding: '12px 18px',
              borderRadius: '30px',
              border: `1px solid ${C.border}`,
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          
          {/* Résultats de recherche */}
          <span style={{ fontSize: '13px', color: C.textLight }}>
            {notificationsFiltrees.length} notification{notificationsFiltrees.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ 
          padding: '60px', 
          textAlign: 'center', 
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '20px',
          border: `1px dashed ${C.border}`,
          marginBottom: '40px',
        }}>
          <div style={{ width: '40px', height: '40px', margin: '0 auto 16px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTop: `3px solid ${C.blue}`, animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#fff', fontSize: '16px' }}>Chargement des notifications...</p>
        </div>
      )}

      {/* Liste des notifications */}
      {!loading && notificationsFiltrees.length > 0 ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          marginBottom: '40px'
        }}>
          {notificationsFiltrees.map(notification => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarquerLu={() => marquerCommeLu(notification.id)}
            />
          ))}
        </div>
      ) : !loading && (
        <div style={{ 
          padding: '60px', 
          textAlign: 'center', 
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '20px',
          border: `1px dashed ${C.border}`,
          marginBottom: '40px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📭</div>
          <p style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Aucune notification trouvée</p>
          <p style={{ color: C.textLight, fontSize: '13px' }}>Essayez de modifier vos filtres ou revenez plus tard!</p>
        </div>
      )}

      {/* Note en bas */}
      <div style={{
        marginTop: '24px',
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        border: `1px solid ${C.border}`,
        fontSize: '13px',
        color: C.textLight,
        lineHeight: '1.6',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <span style={{ fontSize: '20px' }}>ℹ️</span>
        <span>
          Ces notifications sont envoyées par l'administration e-Vend uniquement. Vous ne pouvez pas y répondre. 
          Pour contacter l'administration, utilisez la section <strong>Messagerie → Support e-Vend</strong>.
        </span>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
