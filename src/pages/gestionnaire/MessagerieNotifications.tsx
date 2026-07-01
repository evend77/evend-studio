/**
 * MessagerieNotifications.tsx — src/pages/vendeur/MessagerieNotifications.tsx
 * Page des notifications de l'administration pour le vendeur
 * Affichage des notifications avec images, marquage lu/non lu
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Page } from '@shopify/polaris';

const API = 'https://evend-multivendeur-api.onrender.com';

// ── Types ─────────────────────────────────────────────────────────────────────
type TypeNotif = 'info' | 'succes' | 'avertissement' | 'urgent' | 'maintenance';

interface Notification {
  id: number;
  titre: string;
  message: string;  // ✅ CORRIGÉ : 'message' au lieu de 'contenu'
  date: string;
  type: TypeNotif;
  lu: boolean;
  important?: boolean;
  image_url?: string;
  lien?: {
    texte: string;
    url: string;
  };
}

// ── Config types ──────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<TypeNotif, { label: string; icon: string; bg: string; color: string; border: string }> = {
  info:          { label: 'Information',   icon: 'ℹ️', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  succes:        { label: 'Succès',        icon: '✅', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  avertissement: { label: 'Avertissement', icon: '⚠️', bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  urgent:        { label: 'Urgent',        icon: '🚨', bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
  maintenance:   { label: 'Maintenance',   icon: '🔧', bg: '#f3e8ff', color: '#9333ea', border: '#d8b4fe' },
};

// ── Thème ─────────────────────────────────────────────────────────────────────
const T = {
  accent: '#2d6a9f', accentLight: '#e8f2fb',
  bg: '#f4f6f8', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', warning: '#d97706', success: '#16a34a',
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
interface MessagerieNotificationsProps {
  onRetour?: () => void;
}

export default function MessagerieNotifications({ onRetour }: MessagerieNotificationsProps) {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [notifOuverte, setNotifOuverte] = useState<Notification | null>(null);
  const [filtreType, setFiltreType] = useState<'tous' | TypeNotif>('tous');
  const [filtreLu, setFiltreLu] = useState<'tous' | 'non_lu' | 'lu'>('tous');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' | 'danger' } | null>(null);
  
  const getToken = () => localStorage.getItem('token');
  
  // ✅ Extraire l'ID depuis l'objet 'user' stocké dans localStorage
  const getVendeurId = (): number | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.log('❌ Aucun utilisateur trouvé dans localStorage');
      return null;
    }
    
    try {
      const user = JSON.parse(userStr);
      console.log('✅ Utilisateur parsé:', user);
      
      if (!user.id) {
        console.log('❌ Pas d\'ID dans l\'objet user');
        return null;
      }
      
      return user.id;
    } catch (e) {
      console.error('❌ Erreur parsing user:', e);
      return null;
    }
  };

  const vendeurId = getVendeurId();
  
  console.log('🔍 [VENDEUR] ID extrait:', vendeurId);
  console.log('🔍 [VENDEUR] Token présent:', !!getToken());

  const showToast = (msg: string, type: 'success' | 'info' | 'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ============================================
  // CHARGER LES NOTIFICATIONS
  // ============================================
  const chargerNotifications = useCallback(async () => {
    if (!vendeurId) {
      console.log('❌ Pas de vendeurId');
      setLoading(false);
      return;
    }

    console.log('📡 [VENDEUR] Chargement notifications pour ID:', vendeurId);
    
    try {
      const response = await fetch(`${API}/api/notifications/vendeurs/${vendeurId}/notifications`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      console.log('📡 [VENDEUR] Status réponse:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Notifications reçues:', data);
        console.log('✅ Nombre de notifications:', data.length);
        setNotifs(data);
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur chargement notifications:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Erreur catch:', error);
    } finally {
      setLoading(false);
    }
  }, [vendeurId]);

  useEffect(() => {
    chargerNotifications();
    
    // Polling toutes les 30 secondes
    const interval = setInterval(chargerNotifications, 30000);
    return () => clearInterval(interval);
  }, [chargerNotifications]);

  // ============================================
  // MARQUER UNE NOTIFICATION COMME LUE
  // ============================================
  const marquerCommeLu = async (id: number) => {
    try {
      const response = await fetch(`${API}/api/notifications/notifications/${id}/lire`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      if (response.ok) {
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
        console.log('✅ Notification marquée comme lue:', id);
      }
    } catch (error) {
      console.error('❌ Erreur marquage:', error);
    }
  };

  // ============================================
  // MARQUER TOUT COMME LU
  // ============================================
  const toutMarquerLu = async () => {
    if (!vendeurId) return;

    try {
      const response = await fetch(`${API}/api/notifications/vendeurs/${vendeurId}/notifications/lire-tout`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      if (response.ok) {
        setNotifs(prev => prev.map(n => ({ ...n, lu: true })));
        showToast('✅ Toutes les notifications marquées comme lues', 'success');
        console.log('✅ Toutes les notifications marquées comme lues');
      }
    } catch (error) {
      console.error('❌ Erreur marquage tout:', error);
    }
  };

  // ============================================
  // OUVRIR UNE NOTIFICATION
  // ============================================
  const ouvrirNotif = (n: Notification) => {
    if (!n.lu) {
      marquerCommeLu(n.id);
    }
    setNotifOuverte({ ...n, lu: true });
  };

  // ============================================
  // FILTRES
  // ============================================
  const notifsFiltrees = notifs.filter(n => {
    const inType = filtreType === 'tous' || n.type === filtreType;
    const inLu = filtreLu === 'tous' || (filtreLu === 'lu' ? n.lu : !n.lu);
    return inType && inLu;
  });

  const nbNonLus = notifs.filter(n => !n.lu).length;

  // ============================================
  // RENDU
  // ============================================
  return (
    <Page title="">
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

      {/* Modal notification ouverte */}
      {notifOuverte && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          backdropFilter: 'blur(5px)',
        }}
          onClick={e => e.target === e.currentTarget && setNotifOuverte(null)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 22px',
              backgroundColor: TYPE_CONFIG[notifOuverte.type].bg,
              borderBottom: `2px solid ${TYPE_CONFIG[notifOuverte.type].border}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '28px' }}>{TYPE_CONFIG[notifOuverte.type].icon}</span>
                  <div>
                    <span style={{
                      backgroundColor: TYPE_CONFIG[notifOuverte.type].border,
                      color: TYPE_CONFIG[notifOuverte.type].color,
                      padding: '2px 8px',
                      borderRadius: '20px',
                      fontSize: '10px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'inline-block',
                      marginBottom: '4px',
                    }}>
                      {TYPE_CONFIG[notifOuverte.type].label}
                    </span>
                    <p style={{ fontSize: '16px', fontWeight: '800', color: T.text, margin: 0 }}>{notifOuverte.titre}</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotifOuverte(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: T.textLight,
                    padding: '4px',
                  }}>
                  ✕
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div style={{ padding: '22px' }}>
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '16px',
                border: `1px solid ${T.border}`,
              }}>
                {/* ✅ CORRIGÉ : message au lieu de contenu */}
                <p style={{ fontSize: '13px', color: T.text, margin: '0 0 12px 0', lineHeight: '1.7' }}>{notifOuverte.message}</p>

                {/* Image (si présente) */}
                {notifOuverte.image_url && (
                  <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <img
                      src={notifOuverte.image_url}
                      alt=""
                      style={{
                        maxWidth: '100%',
                        maxHeight: '250px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: `1px solid ${T.border}`,
                      }}
                      onClick={() => window.open(notifOuverte.image_url, '_blank')}
                    />
                  </div>
                )}

                {/* Lien (si présent) */}
                {notifOuverte.lien && (
                  <div style={{ marginTop: '12px' }}>
                    <a
                      href={notifOuverte.lien.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: T.accent,
                        fontSize: '13px',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}>
                      {notifOuverte.lien.texte} →
                    </a>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: T.textLight }}>📅 {new Date(notifOuverte.date).toLocaleDateString('fr-CA')}</span>
                  <span style={{ fontSize: '12px', color: T.textLight }}>· 🛡️ Administration e-Vend</span>
                </div>
                <span style={{
                  backgroundColor: '#dcfce7',
                  color: T.success,
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '700',
                }}>
                  ✓ Lu
                </span>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 22px',
              borderTop: `1px solid ${T.border}`,
              backgroundColor: '#fafafa',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <div style={{
                backgroundColor: '#f8fafc',
                border: `1px solid ${T.border}`,
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                color: T.textLight,
                fontStyle: 'italic',
              }}>
                ℹ️ Les notifications sont en lecture seule — vous ne pouvez pas y répondre.
              </div>
              <button
                onClick={() => setNotifOuverte(null)}
                style={{
                  marginLeft: '10px',
                  backgroundColor: T.accent,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: T.bg,
        minHeight: 'calc(100vh - 112px)',
        marginTop: '-20px',
        padding: '20px',
        borderRadius: '8px',
      }}>

        {/* En-tête */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '10px',
        }}>
          <div>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '800',
              color: T.text,
              margin: '0 0 2px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              📢 Notifications e-Vend
            </h2>
            <p style={{ fontSize: '12px', color: T.textLight, margin: 0 }}>
              Messages officiels de l'administration · Lecture seule
              {nbNonLus > 0 && (
                <span style={{
                  marginLeft: '10px',
                  backgroundColor: T.danger,
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '700',
                }}>
                  {nbNonLus} non lu{nbNonLus > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          {nbNonLus > 0 && (
            <button
              onClick={toutMarquerLu}
              style={{
                backgroundColor: 'white',
                color: T.accent,
                border: `1px solid ${T.accent}`,
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
              }}>
              ✓ Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            color: T.textLight,
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              border: '3px solid rgba(45,106,159,0.2)',
              borderTop: `3px solid ${T.accent}`,
              animation: 'spin 0.8s linear infinite',
            }} />
            <p>Chargement des notifications...</p>
          </div>
        )}

        {/* Filtres */}
        <div style={{
          backgroundColor: T.card,
          borderRadius: '10px',
          border: `1px solid ${T.border}`,
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['tous', 'non_lu', 'lu'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFiltreLu(f)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: `1px solid ${filtreLu === f ? T.accent : T.border}`,
                  backgroundColor: filtreLu === f ? T.accent : 'white',
                  color: filtreLu === f ? 'white' : T.textLight,
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}>
                {f === 'tous' ? 'Tous' : f === 'non_lu' ? '🔴 Non lus' : '✓ Lus'}
              </button>
            ))}
          </div>
          <div style={{ width: '1px', height: '20px', backgroundColor: T.border }} />
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFiltreType('tous')}
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                border: `1px solid ${filtreType === 'tous' ? T.accent : T.border}`,
                backgroundColor: filtreType === 'tous' ? T.accent : 'white',
                color: filtreType === 'tous' ? 'white' : T.textLight,
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
              }}>
              Tous types
            </button>
            {(Object.entries(TYPE_CONFIG) as [TypeNotif, typeof TYPE_CONFIG[TypeNotif]][]).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setFiltreType(k)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: `1px solid ${filtreType === k ? v.color : T.border}`,
                  backgroundColor: filtreType === k ? v.bg : 'white',
                  color: filtreType === k ? v.color : T.textLight,
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: T.textLight, margin: '0 0 0 auto' }}>
            <strong>{notifsFiltrees.length}</strong> / {notifs.length}
          </p>
        </div>

        {/* Liste notifications */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifsFiltrees.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: T.textLight,
                backgroundColor: T.card,
                borderRadius: '12px',
                border: `1px solid ${T.border}`,
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.3 }}>📭</div>
                <p style={{ fontSize: '13px', fontWeight: '600' }}>Aucune notification</p>
              </div>
            ) : (
              notifsFiltrees.map(n => {
                const tc = TYPE_CONFIG[n.type];
                return (
                  <div
                    key={n.id}
                    onClick={() => ouvrirNotif(n)}
                    style={{
                      backgroundColor: n.lu ? T.card : '#fafeff',
                      border: `1px solid ${n.lu ? T.border : T.accent + '40'}`,
                      borderRadius: '12px',
                      padding: '16px 18px',
                      cursor: 'pointer',
                      borderLeft: `4px solid ${tc.color}`,
                      boxShadow: n.lu ? 'none' : '0 1px 6px rgba(45,106,159,0.1)',
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 3px 12px rgba(0,0,0,0.1)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = n.lu ? 'none' : '0 1px 6px rgba(45,106,159,0.1)'}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      {/* Gauche */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: tc.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          flexShrink: 0,
                        }}>
                          {tc.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '4px',
                            flexWrap: 'wrap',
                          }}>
                            {!n.lu && (
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: T.danger,
                                flexShrink: 0,
                              }} />
                            )}
                            <p style={{
                              fontSize: '14px',
                              fontWeight: n.lu ? '600' : '800',
                              color: T.text,
                              margin: 0,
                            }}>
                              {n.titre}
                            </p>
                            <span style={{
                              backgroundColor: tc.bg,
                              color: tc.color,
                              padding: '2px 8px',
                              borderRadius: '20px',
                              fontSize: '10px',
                              fontWeight: '700',
                              border: `1px solid ${tc.border}`,
                              flexShrink: 0,
                            }}>
                              {tc.label}
                            </span>
                          </div>
                          {/* ✅ CORRIGÉ : message au lieu de contenu */}
                          <p style={{
                            fontSize: '12px',
                            color: T.textLight,
                            margin: 0,
                            lineHeight: '1.5',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}>
                            {n.message}
                          </p>
                          
                          {/* Miniature si image présente */}
                          {n.image_url && (
                            <div style={{ marginTop: '8px' }}>
                              <img
                                src={n.image_url}
                                alt=""
                                style={{
                                  maxWidth: '60px',
                                  maxHeight: '60px',
                                  borderRadius: '6px',
                                  border: `1px solid ${T.border}`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Droite */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '6px',
                        flexShrink: 0,
                      }}>
                        <p style={{
                          fontSize: '11px',
                          color: T.textLight,
                          margin: 0,
                          whiteSpace: 'nowrap',
                        }}>
                          {new Date(n.date).toLocaleDateString('fr-CA')}
                        </p>
                        <span style={{
                          backgroundColor: n.lu ? '#dcfce7' : '#fee2e2',
                          color: n.lu ? T.success : T.danger,
                          padding: '2px 8px',
                          borderRadius: '20px',
                          fontSize: '10px',
                          fontWeight: '700',
                        }}>
                          {n.lu ? '✓ Lu' : '● Non lu'}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          color: T.accent,
                          fontWeight: '600',
                        }}>
                          Voir →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Note bas de page */}
        <div style={{
          marginTop: '20px',
          backgroundColor: '#f8fafc',
          border: `1px solid ${T.border}`,
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ fontSize: '16px' }}>🔒</span>
          <p style={{ fontSize: '12px', color: T.textLight, margin: 0 }}>
            Ces notifications sont envoyées par l'administration e-Vend uniquement. <strong>Vous ne pouvez pas y répondre.</strong> Pour contacter l'administration, utilisez la section <em>Messagerie → Administration</em>.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Page>
  );
}
