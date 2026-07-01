/**
 * Notifications.tsx — src/pages/admin/Notifications.tsx
 * Page d'envoi de notifications administratives
 * Envoi à des vendeurs/acheteurs spécifiques, groupes, ou tous
 * Support des images jointes
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

const API = 'https://evend-multivendeur-api.onrender.com';

type Cible = 'vendeurs' | 'acheteurs' | 'tous';
type Mode = 'individuel' | 'broadcast' | 'selection';
type TypeNotif = 'info' | 'succes' | 'avertissement' | 'urgent';

interface Vendeur {
  id: number;
  nom: string;
  boutique: string;
  email: string;
}

interface Acheteur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
}

// Interface pour les destinataires d'une notification
interface DestinataireInfo {
  id: number;
  nom: string;
  email: string;
  type: 'vendeur' | 'acheteur';
  lu: boolean;
  lu_le?: string;
}

interface NotifEnvoyee {
  id: number;
  titre: string;
  message: string;
  cible: Cible;
  mode: Mode;
  type: TypeNotif;
  date: string;
  nbDestinataires: number;
  lu: number;
  image_url?: string;
  destinataires?: DestinataireInfo[]; // Liste des destinataires
}

interface NotifPayload {
  titre: string;
  message: string;
  type: TypeNotif;
  cible: Cible;
  mode: Mode;
  destinataires?: number[];
  image_url?: string;
  image_nom?: string;
}

interface UploadResult {
  url: string;
  nom: string;
  type: string;
}

const T = {
  accent: '#2d6a9f', accentLight: '#e8f2fb',
  bg: '#f0f2f5', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  success: '#16a34a', warning: '#d97706', danger: '#dc2626',
};

const TYPE_CONFIG: Record<TypeNotif, { label: string; icon: string; bg: string; color: string; border: string }> = {
  info:          { label: 'Information',   icon: 'ℹ️', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  succes:        { label: 'Succès',        icon: '✅', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  avertissement: { label: 'Avertissement', icon: '⚠️', bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  urgent:        { label: 'Urgent',        icon: '🚨', bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
};

function Toast({ msg, type }: { msg: string; type: 'success' | 'info' | 'danger' }) {
  const bg = { success: T.success, info: T.accent, danger: T.danger }[type];
  return (
    <div style={{ position: 'fixed', top: '24px', right: '24px', backgroundColor: bg, color: 'white', padding: '14px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', maxWidth: '420px' }}>
      {msg}
    </div>
  );
}

interface NotificationsProps { naviguerVers: (p: string, d?: any) => void; }

export default function Notifications({ naviguerVers }: NotificationsProps) {
  const [cible, setCible] = useState<Cible>('tous');
  const [mode, setMode] = useState<Mode>('broadcast');
  const [typeNotif, setTypeNotif] = useState<TypeNotif>('info');
  const [titre, setTitre] = useState('');
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [historique, setHistorique] = useState<NotifEnvoyee[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' | 'danger' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notificationDetaillee, setNotificationDetaillee] = useState<NotifEnvoyee | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState<number | null>(null);
  
  // 🔍 ÉTAT POUR LA RECHERCHE DANS L'HISTORIQUE
  const [rechercheHistorique, setRechercheHistorique] = useState('');
  
  // États pour les listes de destinataires
  const [vendeurs, setVendeurs] = useState<Vendeur[]>([]);
  const [acheteurs, setAcheteurs] = useState<Acheteur[]>([]);
  const [destinatairesSelectionnes, setDestinatairesSelectionnes] = useState<number[]>([]);
  const [rechercheDestinataire, setRechercheDestinataire] = useState('');
  const [erreurChargement, setErreurChargement] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = localStorage.getItem('token');

  const showToast = (msg: string, type: 'success' | 'info' | 'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Charger les vendeurs
  useEffect(() => {
    const fetchVendeurs = async () => {
      try {
        const r = await fetch(`${API}/api/vendeurs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!r.ok) {
          const text = await r.text();
          console.error('Erreur chargement vendeurs:', r.status, text.substring(0, 200));
          return;
        }
        
        const data = await r.json();
        setVendeurs(data);
      } catch (error) {
        console.error('Erreur chargement vendeurs:', error);
      }
    };

    fetchVendeurs();
  }, [token]);

  // Charger les acheteurs
  useEffect(() => {
    const fetchAcheteurs = async () => {
      try {
        const r = await fetch(`${API}/api/acheteurs/liste-simple`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!r.ok) {
          const text = await r.text();
          console.error('Erreur chargement acheteurs:', r.status, text.substring(0, 200));
          setErreurChargement(`Erreur ${r.status} lors du chargement des acheteurs`);
          return;
        }
        
        const data = await r.json();
        setAcheteurs(data);
        setErreurChargement(null);
      } catch (error) {
        console.error('Erreur chargement acheteurs:', error);
        setErreurChargement('Erreur de connexion pour le chargement des acheteurs');
      }
    };

    fetchAcheteurs();
  }, [token]);

  // Charger l'historique des notifications
  const chargerHistorique = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/notifications/historique`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!r.ok) {
        const text = await r.text();
        console.error('Erreur chargement historique:', r.status, text.substring(0, 200));
        return;
      }
      
      const data = await r.json();
      setHistorique(data);
      
      // Pour chaque notification, charger ses destinataires
      data.forEach((notif: NotifEnvoyee) => {
        chargerDestinatairesNotification(notif.id);
      });
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  }, [token]);

  // Charger les destinataires d'une notification
  const chargerDestinatairesNotification = async (notificationId: number) => {
    try {
      const r = await fetch(`${API}/api/notifications/${notificationId}/destinataires`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!r.ok) {
        console.error('Erreur chargement destinataires:', r.status);
        return;
      }
      
      const data = await r.json();
      
      // Mettre à jour l'historique avec les destinataires
      setHistorique(prev => prev.map(n => 
        n.id === notificationId ? { ...n, destinataires: data } : n
      ));
    } catch (error) {
      console.error('Erreur chargement destinataires:', error);
    }
  };

  useEffect(() => {
    chargerHistorique();
  }, [chargerHistorique]);

  // SUPPRIMER UNE NOTIFICATION
  const supprimerNotification = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Empêcher l'ouverture des détails
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette notification ? Elle sera supprimée pour tous les destinataires.')) {
      return;
    }
    
    setSuppressionEnCours(id);
    
    try {
      console.log('🗑️ Suppression notification ID:', id);
      
      const response = await fetch(`${API}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Réponse suppression:', response.status);
      
      if (response.ok) {
        showToast('✅ Notification supprimée avec succès', 'success');
        chargerHistorique();
        if (notificationDetaillee?.id === id) {
          setNotificationDetaillee(null);
        }
      } else {
        const text = await response.text();
        console.error('❌ Erreur suppression:', response.status, text.substring(0, 200));
        showToast(`❌ Erreur ${response.status} lors de la suppression`, 'danger');
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      showToast('❌ Erreur lors de la suppression', 'danger');
    } finally {
      setSuppressionEnCours(null);
    }
  };

  // Upload de fichier vers S3
  const uploadFichier = async (file: File): Promise<UploadResult | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          url: data.url,
          nom: file.name,
          type: file.type,
        };
      } else {
        const text = await response.text();
        console.error('Erreur upload:', response.status, text.substring(0, 200));
        throw new Error('Erreur upload');
      }
    } catch (error) {
      showToast('❌ Erreur lors de l\'upload', 'danger');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Gestion de la sélection d'image
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Supprimer l'image sélectionnée
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filtrer les destinataires selon la recherche
  const getListeFiltree = () => {
    const search = rechercheDestinataire.toLowerCase();
    
    if (cible === 'vendeurs') {
      return vendeurs.filter(v => 
        v.nom.toLowerCase().includes(search) || 
        v.boutique.toLowerCase().includes(search) || 
        v.email.toLowerCase().includes(search)
      );
    } else if (cible === 'acheteurs') {
      return acheteurs.filter(a => {
        const nomComplet = `${a.prenom} ${a.nom}`.toLowerCase();
        return nomComplet.includes(search) || a.email.toLowerCase().includes(search);
      });
    } else {
      return [];
    }
  };

  const listeFiltree = getListeFiltree();
  
  const getNbTotal = () => {
    if (cible === 'vendeurs') return vendeurs.length;
    if (cible === 'acheteurs') return acheteurs.length;
    return vendeurs.length + acheteurs.length;
  };

  const nbTotal = getNbTotal();

  const peutEnvoyer = () => {
    if (!titre.trim() || !message.trim()) return false;
    if (cible === 'tous') return true;
    if (mode === 'broadcast') return true;
    if (mode === 'individuel') return destinatairesSelectionnes.length === 1;
    if (mode === 'selection') return destinatairesSelectionnes.length > 0;
    return false;
  };

  const handleSelectionDestinataire = (id: number) => {
    if (mode === 'individuel') {
      setDestinatairesSelectionnes([id]);
    } else {
      setDestinatairesSelectionnes(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    }
  };

  const handleSelectAll = () => {
    if (destinatairesSelectionnes.length === listeFiltree.length) {
      setDestinatairesSelectionnes([]);
    } else {
      setDestinatairesSelectionnes(listeFiltree.map(item => item.id));
    }
  };

  // ENVOYER LA NOTIFICATION
  const handleEnvoyer = async () => {
    if (!peutEnvoyer() || sending) return;

    setSending(true);
    try {
      let imageResult: UploadResult | null = null;
      if (imageFile) {
        imageResult = await uploadFichier(imageFile);
      }

      const payload: NotifPayload = {
        titre: titre.trim(),
        message: message.trim(),
        type: typeNotif,
        cible,
        mode: cible === 'tous' ? 'broadcast' : mode,
      };

      if (imageResult) {
        payload.image_url = imageResult.url;
        payload.image_nom = imageResult.nom;
      }

      if (cible !== 'tous' && mode !== 'broadcast') {
        payload.destinataires = destinatairesSelectionnes;
      }

      const response = await fetch(`${API}/api/notifications/envoyer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        showToast(`📢 Notification envoyée avec succès à ${result.nbEnvoyes} personne(s)`, 'success');
        setTitre('');
        setMessage('');
        setDestinatairesSelectionnes([]);
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        chargerHistorique();
      } else {
        const text = await response.text();
        console.error('Erreur envoi:', response.status, text.substring(0, 200));
        showToast(`❌ Erreur ${response.status} lors de l'envoi`, 'danger');
      }
    } catch (error) {
      showToast('❌ Erreur lors de l\'envoi', 'danger');
    } finally {
      setSending(false);
    }
  };

  // Ouvrir les détails d'une notification
  const ouvrirDetailsNotification = (n: NotifEnvoyee) => {
    setNotificationDetaillee(n);
    if (!n.destinataires) {
      chargerDestinatairesNotification(n.id);
    }
  };

  // 🔍 FILTRE DE RECHERCHE POUR L'HISTORIQUE
  const historiqueFiltre = historique.filter(notif => {
    const recherche = rechercheHistorique.toLowerCase();
    return (
      notif.titre.toLowerCase().includes(recherche) ||
      notif.message.toLowerCase().includes(recherche) ||
      notif.type.toLowerCase().includes(recherche) ||
      notif.cible.toLowerCase().includes(recherche)
    );
  });

  const tc = TYPE_CONFIG[typeNotif];

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      
      {/* MODALE DES DÉTAILS DE NOTIFICATION */}
      {notificationDetaillee && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px',
        }}
        onClick={e => e.target === e.currentTarget && setNotificationDetaillee(null)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}>
            <div style={{ padding: '20px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: T.text, margin: 0 }}>📋 Détails de la notification</h3>
                <button
                  onClick={() => setNotificationDetaillee(null)}
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: T.textLight }}
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{
                    backgroundColor: TYPE_CONFIG[notificationDetaillee.type].bg,
                    color: TYPE_CONFIG[notificationDetaillee.type].color,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    {TYPE_CONFIG[notificationDetaillee.type].icon} {TYPE_CONFIG[notificationDetaillee.type].label}
                  </span>
                  <span style={{
                    backgroundColor: notificationDetaillee.cible === 'vendeurs' ? '#e0f2fe' : notificationDetaillee.cible === 'acheteurs' ? '#fce7f3' : '#e0e7ff',
                    color: notificationDetaillee.cible === 'vendeurs' ? '#0369a1' : notificationDetaillee.cible === 'acheteurs' ? '#be185d' : '#3730a3',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    {notificationDetaillee.cible === 'vendeurs' ? '🏪' : notificationDetaillee.cible === 'acheteurs' ? '🛒' : '👥'} {notificationDetaillee.cible}
                  </span>
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: '800', color: T.text, margin: '0 0 10px 0' }}>{notificationDetaillee.titre}</h4>
                <p style={{ fontSize: '13px', color: T.text, lineHeight: '1.6', margin: '0 0 15px 0' }}>{notificationDetaillee.message}</p>
                {notificationDetaillee.image_url && (
                  <img src={notificationDetaillee.image_url} alt="" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', marginBottom: '15px' }} />
                )}
                <p style={{ fontSize: '11px', color: T.textLight, margin: '0 0 5px 0' }}>📅 {new Date(notificationDetaillee.date).toLocaleString('fr-CA')}</p>
              </div>
              
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '15px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: '700', color: T.text, margin: '0 0 10px 0' }}>
                  📨 Destinataires ({notificationDetaillee.nbDestinataires})
                </h5>
                
                {!notificationDetaillee.destinataires ? (
                  <p style={{ fontSize: '12px', color: T.textLight }}>Chargement des destinataires...</p>
                ) : notificationDetaillee.destinataires.length === 0 ? (
                  <p style={{ fontSize: '12px', color: T.textLight }}>Aucun destinataire trouvé</p>
                ) : (
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: '8px' }}>
                    {notificationDetaillee.destinataires.map(d => (
                      <div key={`${d.type}-${d.id}`} style={{
                        padding: '10px',
                        borderBottom: `1px solid ${T.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: '700', color: T.text, margin: 0 }}>
                            {d.nom} {d.type === 'vendeur' ? '🏪' : '🛒'}
                          </p>
                          <p style={{ fontSize: '10px', color: T.textLight, margin: '2px 0 0 0' }}>{d.email}</p>
                        </div>
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: d.lu ? '#dcfce7' : '#fee2e2',
                          color: d.lu ? T.success : T.danger
                        }}>
                          {d.lu ? '✓ Lu' : '● Non lu'}
                          {d.lu_le && ` ${new Date(d.lu_le).toLocaleDateString('fr-CA')}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '24px 28px', backgroundColor: T.bg, minHeight: '100vh' }}>

        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: T.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📢 Notifications</h1>
          <p style={{ fontSize: '13px', color: T.textLight, margin: 0 }}>Messagerie administrative · Envoi de notifications (lecture seule)</p>
        </div>

        {erreurChargement && (
          <div style={{ backgroundColor: '#fee2e2', border: `1px solid ${T.danger}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: T.danger }}>
            ⚠️ {erreurChargement}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

          {/* ── Formulaire d'envoi ── */}
          <div style={{ backgroundColor: T.card, borderRadius: '14px', border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '16px 20px', borderBottom: `2px solid ${T.accent}`, backgroundColor: '#f8fafc' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '800', color: T.accent, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>✏️ Composer une notification</h3>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Cible */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Destinataires</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    ['tous', '👥 Tous (vendeurs + acheteurs)'],
                    ['vendeurs', '🏪 Vendeurs seulement'],
                    ['acheteurs', '🛒 Acheteurs seulement']
                  ].map(([c, label]) => (
                    <button key={c} onClick={() => { setCible(c as Cible); setDestinatairesSelectionnes([]); setRechercheDestinataire(''); }}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${cible === c ? T.accent : T.border}`, backgroundColor: cible === c ? T.accentLight : 'white', color: cible === c ? T.accent : T.textLight, fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode (seulement si cible spécifique) */}
              {cible !== 'tous' && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Mode d'envoi</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      ['broadcast', `📡 Tous les ${cible} (${nbTotal})`],
                      ['individuel', '👤 Individuel'],
                      ['selection', '🔢 Sélection multiple']
                    ].map(([m, label]) => (
                      <button key={m} onClick={() => { setMode(m as Mode); setDestinatairesSelectionnes([]); }}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${mode === m ? T.accent : T.border}`, backgroundColor: mode === m ? T.accentLight : 'white', color: mode === m ? T.accent : T.textLight, fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sélecteur de destinataires (seulement si cible spécifique et mode non-broadcast) */}
              {cible !== 'tous' && mode !== 'broadcast' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase' }}>
                      {mode === 'individuel' ? 'Choisir un destinataire' : `Sélectionner des destinataires (${destinatairesSelectionnes.length} choisi(s))`}
                    </label>
                    {mode === 'selection' && listeFiltree.length > 0 && (
                      <button
                        onClick={handleSelectAll}
                        style={{ fontSize: '10px', color: T.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}
                      >
                        {destinatairesSelectionnes.length === listeFiltree.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                      </button>
                    )}
                  </div>

                  {/* Barre de recherche */}
                  <input
                    type="text"
                    placeholder="🔍 Rechercher..."
                    value={rechercheDestinataire}
                    onChange={(e) => setRechercheDestinataire(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      marginBottom: '8px',
                      border: `1px solid ${T.border}`,
                      borderRadius: '8px',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />

                  {/* Liste des destinataires */}
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '4px' }}>
                    {listeFiltree.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: T.textLight, fontSize: '12px' }}>
                        Aucun {cible} trouvé
                      </div>
                    ) : (
                      listeFiltree.map((item: any) => (
                        <div key={item.id} onClick={() => handleSelectionDestinataire(item.id)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${destinatairesSelectionnes.includes(item.id) ? T.accent : 'transparent'}`,
                            backgroundColor: destinatairesSelectionnes.includes(item.id) ? T.accentLight : 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            margin: '2px 0'
                          }}>
                          <input
                            type={mode === 'individuel' ? 'radio' : 'checkbox'}
                            checked={destinatairesSelectionnes.includes(item.id)}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '12px', fontWeight: '700', color: T.text, margin: 0 }}>
                              {cible === 'vendeurs' ? item.boutique : `${item.prenom} ${item.nom}`}
                            </p>
                            <p style={{ fontSize: '10px', color: T.textLight, margin: 0 }}>
                              {item.email}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Type */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Type de notification</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {(Object.entries(TYPE_CONFIG) as [TypeNotif, typeof TYPE_CONFIG[TypeNotif]][]).map(([k, v]) => (
                    <button key={k} onClick={() => setTypeNotif(k)}
                      style={{ padding: '8px 10px', borderRadius: '8px', border: `2px solid ${typeNotif === k ? v.color : T.border}`, backgroundColor: typeNotif === k ? v.bg : 'white', color: typeNotif === k ? v.color : T.textLight, fontSize: '12px', fontWeight: '700', cursor: 'pointer', textAlign: 'left' }}>
                      {v.icon} {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Titre */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Titre *</label>
                <input type="text" value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex : Maintenance planifiée ce soir..."
                  style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Message */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Message *</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                  placeholder="Rédigez votre notification ici..."
                  style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                <p style={{ fontSize: '11px', color: T.textLight, margin: '4px 0 0 0', textAlign: 'right' }}>{message.length} caractères</p>
              </div>

              {/* Upload d'image */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Image (optionnelle)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      padding: '8px 12px',
                      background: T.accentLight,
                      border: `1px solid ${T.accent}`,
                      borderRadius: '6px',
                      color: T.accent,
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {uploading ? '⏳' : '📷'} {imageFile ? 'Changer d\'image' : 'Ajouter une image'}
                  </button>
                  {imagePreview && (
                    <button
                      onClick={handleRemoveImage}
                      style={{
                        padding: '8px 12px',
                        background: '#fee2e2',
                        border: `1px solid ${T.danger}`,
                        borderRadius: '6px',
                        color: T.danger,
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Retirer
                    </button>
                  )}
                </div>
                {imagePreview && (
                  <div style={{ marginTop: '8px' }}>
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '150px',
                        borderRadius: '8px',
                        border: `1px solid ${T.border}`
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Preview */}
              {(titre || message || imagePreview) && (
                <div style={{ backgroundColor: tc.bg, border: `1px solid ${tc.border}`, borderRadius: '10px', padding: '14px 16px' }}>
                  <p style={{ fontSize: '10px', fontWeight: '700', color: tc.color, textTransform: 'uppercase', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>📱 Aperçu</p>
                  <p style={{ fontSize: '13px', fontWeight: '800', color: T.text, margin: '0 0 4px 0' }}>{tc.icon} {titre || 'Titre'}</p>
                  <p style={{ fontSize: '12px', color: T.textLight, margin: '0 0 8px 0', lineHeight: '1.5' }}>{message || 'Message'}</p>
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt=""
                      style={{
                        maxWidth: '150px',
                        maxHeight: '100px',
                        borderRadius: '6px',
                        marginTop: '4px'
                      }}
                    />
                  )}
                  <p style={{ fontSize: '10px', color: '#aaa', margin: '8px 0 0 0' }}>
                    → {cible === 'tous' ? 'Tous les utilisateurs' : 
                       mode === 'broadcast' ? `Tous les ${cible} (${nbTotal} personne(s))` : 
                       `${destinatairesSelectionnes.length} destinataire(s) sélectionné(s)`}
                  </p>
                </div>
              )}

              {/* Bouton envoi */}
              <button onClick={handleEnvoyer} disabled={!peutEnvoyer() || sending || uploading}
                style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: (peutEnvoyer() && !sending && !uploading) ? T.accent : '#93c5fd', color: 'white', fontSize: '14px', fontWeight: '800', cursor: (peutEnvoyer() && !sending && !uploading) ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}>
                {sending || uploading ? '⏳ Envoi en cours...' : '📢 Envoyer la notification'}
              </button>
            </div>
          </div>

          {/* ── HISTORIQUE AMÉLIORÉ AVEC RECHERCHE ── */}
          <div style={{ backgroundColor: T.card, borderRadius: '14px', border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '16px 20px', borderBottom: `2px solid ${T.accent}`, backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '800', color: T.accent, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🕐 Historique ({historique.length})</h3>
                <button
                  onClick={chargerHistorique}
                  style={{ background: 'none', border: 'none', color: T.accent, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  ↻ Rafraîchir
                </button>
              </div>
              
              {/* 🔍 BARRE DE RECHERCHE */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Rechercher par titre, message, type..."
                  value={rechercheHistorique}
                  onChange={(e) => setRechercheHistorique(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    border: `1px solid ${T.border}`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ position: 'absolute', left: '12px', top: '10px', fontSize: '14px', color: T.textLight }}>🔍</span>
                {rechercheHistorique && (
                  <button
                    onClick={() => setRechercheHistorique('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '10px',
                      background: 'none',
                      border: 'none',
                      color: T.textLight,
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {/* Résultat de recherche */}
              {rechercheHistorique && (
                <p style={{ fontSize: '11px', color: T.textLight, margin: '8px 0 0 0' }}>
                  {historiqueFiltre.length} résultat(s) trouvé(s)
                </p>
              )}
            </div>
            
            {/* Liste des notifications avec meilleur visuel */}
            <div style={{ maxHeight: '700px', overflowY: 'auto', padding: '10px' }}>
              {historiqueFiltre.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: T.textLight, fontSize: '12px' }}>
                  {rechercheHistorique ? 'Aucune notification correspond à votre recherche' : 'Aucune notification envoyée'}
                </div>
              ) : (
                historiqueFiltre.map((n, i) => {
                  const tc2 = TYPE_CONFIG[n.type];
                  return (
                    <div 
                      key={n.id} 
                      onClick={() => ouvrirDetailsNotification(n)}
                      style={{ 
                        marginBottom: '12px',
                        borderRadius: '10px',
                        border: `1px solid ${T.border}`,
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'}
                    >
                      {/* En-tête avec type et date */}
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: tc2.bg,
                        borderBottom: `1px solid ${tc2.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            backgroundColor: 'white',
                            color: tc2.color,
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '700',
                            border: `1px solid ${tc2.border}`
                          }}>
                            {tc2.icon} {tc2.label}
                          </span>
                          <span style={{
                            backgroundColor: n.cible === 'vendeurs' ? '#e0f2fe' : n.cible === 'acheteurs' ? '#fce7f3' : '#e0e7ff',
                            color: n.cible === 'vendeurs' ? '#0369a1' : n.cible === 'acheteurs' ? '#be185d' : '#3730a3',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}>
                            {n.cible === 'vendeurs' ? '🏪' : n.cible === 'acheteurs' ? '🛒' : '👥'}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: T.textLight }}>
                          {new Date(n.date).toLocaleDateString('fr-CA')}
                        </span>
                      </div>
                      
                      {/* Corps de la notification */}
                      <div style={{ padding: '16px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '700', color: T.text, margin: '0 0 8px 0' }}>
                          {n.titre}
                        </h4>
                        <p style={{ fontSize: '12px', color: T.textLight, margin: '0 0 12px 0', lineHeight: '1.5' }}>
                          {n.message.length > 100 ? n.message.substring(0, 100) + '...' : n.message}
                        </p>
                        
                        {/* Image miniature si présente */}
                        {n.image_url && (
                          <div style={{ marginBottom: '12px' }}>
                            <img
                              src={n.image_url}
                              alt=""
                              style={{
                                maxWidth: '80px',
                                maxHeight: '60px',
                                borderRadius: '6px',
                                border: `1px solid ${T.border}`
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(n.image_url, '_blank');
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Destinataires (mini vue) */}
                        {n.destinataires && n.destinataires.length > 0 && (
                          <div style={{ 
                            marginBottom: '12px',
                            padding: '8px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '6px',
                            border: `1px solid ${T.border}`
                          }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {n.destinataires.slice(0, 2).map(d => (
                                <span key={`${d.type}-${d.id}`} style={{
                                  fontSize: '10px',
                                  padding: '2px 8px',
                                  backgroundColor: d.type === 'vendeur' ? '#e0f2fe' : '#fce7f3',
                                  color: d.type === 'vendeur' ? '#0369a1' : '#be185d',
                                  borderRadius: '12px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  {d.type === 'vendeur' ? '🏪' : '🛒'} {d.nom.split(' ')[0]}
                                  <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: d.lu ? T.success : T.danger,
                                    display: 'inline-block'
                                  }} />
                                </span>
                              ))}
                              {n.destinataires.length > 2 && (
                                <span style={{ fontSize: '10px', color: T.textLight }}>
                                  + {n.destinataires.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Stats et bouton suppression */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          borderTop: `1px solid ${T.border}`,
                          paddingTop: '10px',
                          marginTop: '4px'
                        }}>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <span style={{ fontSize: '11px', color: T.textLight }}>
                              📨 {n.nbDestinataires}
                            </span>
                            <span style={{ 
                              fontSize: '11px', 
                              color: n.lu === n.nbDestinataires ? T.success : T.warning 
                            }}>
                              👁 {n.lu}/{n.nbDestinataires}
                            </span>
                          </div>
                          
                          <button
                            onClick={(e) => supprimerNotification(n.id, e)}
                            disabled={suppressionEnCours === n.id}
                            style={{
                              background: '#fee2e2',
                              border: `1px solid ${T.danger}`,
                              borderRadius: '6px',
                              color: T.danger,
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '4px 10px',
                              cursor: suppressionEnCours === n.id ? 'wait' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              opacity: suppressionEnCours === n.id ? 0.5 : 1
                            }}
                          >
                            {suppressionEnCours === n.id ? '⏳' : '🗑️'} Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
