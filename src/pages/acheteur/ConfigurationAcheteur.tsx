import React, { useState, useEffect } from 'react';

interface ConfigAcheteur {
  deux_facteurs_actif: boolean;
  notifications_actif: boolean;
  alertes_email_actif: boolean;
  langue: string;
}

export default function ConfigurationAcheteur() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Configuration
  const [deuxFacteurs, setDeuxFacteurs] = useState(false);
  const [notificationsActif, setNotificationsActif] = useState(true);
  const [alertesEmailActif, setAlertesEmailActif] = useState(true);
  const [langue, setLangue] = useState('fr');
  
  // Récupérer l'ID de l'acheteur depuis le token JWT
  const getAcheteurId = (): number => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return 0;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || 0;
    } catch { return 0; }
  };
  
  const acheteurId = getAcheteurId();

  // Charger la configuration
  useEffect(() => {
    chargerConfiguration();
  }, []);

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
      
      setDeuxFacteurs(data.deux_facteurs_actif || false);
      setNotificationsActif(data.notifications_actif !== undefined ? data.notifications_actif : true);
      setAlertesEmailActif(data.alertes_email_actif !== undefined ? data.alertes_email_actif : true);
      setLangue(data.langue || 'fr');
      
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
    setSuccess(null);
    
    const configData = {
      deux_facteurs_actif: deuxFacteurs,
      notifications_actif: notificationsActif,
      alertes_email_actif: alertesEmailActif,
      langue: langue
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
      
      setSuccess('Configuration sauvegardée avec succès !');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Erreur sauvegarde config:', err);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <p>Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#1a2332' }}>
        ⚙️ Configuration de mon compte
      </h1>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px' }}>
        Gérez les paramètres de sécurité et les préférences de votre compte acheteur.
      </p>

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#dc2626',
          fontSize: '13px'
        }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: '#dcfce7',
          border: '1px solid #22c55e',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#16a34a',
          fontSize: '13px'
        }}>
          ✅ {success}
        </div>
      )}

      {/* Carte Sécurité */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        marginBottom: '24px',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#1a2332' }}>
            🔐 Sécurité
          </h2>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
            Renforcez la sécurité de votre compte
          </p>
        </div>
        
        <div style={{ padding: '20px' }}>
          {/* Toggle 2FA */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0', color: '#374151' }}>
                🔐 Authentification à deux facteurs (2FA)
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                Sécurisez votre compte en exigeant une vérification supplémentaire lors de chaque connexion.
              </p>
            </div>
            <button
              onClick={() => setDeuxFacteurs(!deuxFacteurs)}
              style={{
                width: '48px',
                height: '26px',
                borderRadius: '13px',
                backgroundColor: deuxFacteurs ? '#10b981' : '#ccc',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.2s',
                flexShrink: 0
              }}
            >
              <div style={{
                position: 'absolute',
                top: '3px',
                left: deuxFacteurs ? '25px' : '3px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                transition: 'left 0.2s'
              }} />
            </button>
          </div>
          
          {deuxFacteurs && (
            <div style={{
              marginTop: '16px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '12px 16px'
            }}>
              <p style={{ fontSize: '12px', color: '#166534', margin: 0 }}>
                ✅ Authentification à deux facteurs activée. Un code de vérification vous sera envoyé par email à chaque connexion.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Carte Notifications */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        marginBottom: '24px',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#1a2332' }}>
            🔔 Notifications
          </h2>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
            Gérez vos préférences de notifications
          </p>
        </div>
        
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Notifications actives */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0', color: '#374151' }}>
                🔔 Notifications push
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                Recevez des notifications sur votre navigateur
              </p>
            </div>
            <button
              onClick={() => setNotificationsActif(!notificationsActif)}
              style={{
                width: '48px',
                height: '26px',
                borderRadius: '13px',
                backgroundColor: notificationsActif ? '#10b981' : '#ccc',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.2s',
                flexShrink: 0
              }}
            >
              <div style={{
                position: 'absolute',
                top: '3px',
                left: notificationsActif ? '25px' : '3px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                transition: 'left 0.2s'
              }} />
            </button>
          </div>

          {/* Alertes email */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0', color: '#374151' }}>
                📧 Alertes par email
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                Recevez des emails pour les baisses de prix et offres spéciales
              </p>
            </div>
            <button
              onClick={() => setAlertesEmailActif(!alertesEmailActif)}
              style={{
                width: '48px',
                height: '26px',
                borderRadius: '13px',
                backgroundColor: alertesEmailActif ? '#10b981' : '#ccc',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.2s',
                flexShrink: 0
              }}
            >
              <div style={{
                position: 'absolute',
                top: '3px',
                left: alertesEmailActif ? '25px' : '3px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                transition: 'left 0.2s'
              }} />
            </button>
          </div>
        </div>
      </div>

      {/* Carte Préférences */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        marginBottom: '24px',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#1a2332' }}>
            🌐 Langue
          </h2>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
            Choisissez votre langue préférée
          </p>
        </div>
        
        <div style={{ padding: '20px' }}>
          <select
            value={langue}
            onChange={(e) => setLangue(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '300px',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="fr">🇫🇷 Français</option>
            <option value="en">🇬🇧 English</option>
            <option value="es">🇪🇸 Español</option>
          </select>
        </div>
      </div>

      {/* Bouton sauvegarder */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <button
          onClick={sauvegarderConfiguration}
          disabled={saving}
          style={{
            backgroundColor: '#537373',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 28px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: saving ? 'wait' : 'pointer',
            transition: 'background 0.2s'
          }}
        >
          {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder les modifications'}
        </button>
      </div>
    </div>
  );
}