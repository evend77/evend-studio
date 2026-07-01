// src/pages/gestionnaire/MonDomaine.tsx
// e-Vend Studio — Page "Mon domaine" avec achat de domaine intégré

import React, { useState, useEffect } from 'react';

interface Props { gestionnaireId: number; }

interface DomaineAchete {
  id: number;
  domaine: string;
  dynadot_order_id: string | null;
  expiration_date: string | null;
  statut: 'actif' | 'expire' | 'en_attente';
  created_at: string;
}

export default function MonDomaine({ gestionnaireId }: Props) {
  const [sousDomaine, setSousDomaine] = useState('');
  const [domainePerso, setDomainePerso] = useState('');
  const [sauvegarde, setSauvegarde] = useState<'idle' | 'ok' | 'err'>('idle');

  // ── État pour l'achat de domaine ──────────────────────────────────────────
  const [domaineRecherche, setDomaineRecherche] = useState('');
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [domaineDisponible, setDomaineDisponible] = useState<boolean | null>(null);
  const [prixDomaine, setPrixDomaine] = useState<number | null>(null);
  const [messageAchat, setMessageAchat] = useState<{ type: 'success' | 'error' | 'info'; texte: string } | null>(null);
  const [achatEnCours, setAchatEnCours] = useState(false);

  // ── État pour les domaines achetés ─────────────────────────────────────────
  const [domainesAchetes, setDomainesAchetes] = useState<DomaineAchete[]>([]);
  const [chargementDomaines, setChargementDomaines] = useState(true);

  const PRIX_DOMAINE = 19.99;
  const TAUX_TPS = 0.05;
  const TAUX_TVQ = 0.09975;
  const PRIX_TOTAL = PRIX_DOMAINE * (1 + TAUX_TPS + TAUX_TVQ);

  // ── Charger les domaines achetés ───────────────────────────────────────────
  useEffect(() => {
    const chargerDomaines = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/dynadot/domaines/${gestionnaireId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setDomainesAchetes(data.domaines || []);
        }
      } catch (error) {
        console.error('Erreur chargement domaines:', error);
      } finally {
        setChargementDomaines(false);
      }
    };

    chargerDomaines();
  }, [gestionnaireId]);

  // ── Vérifier la disponibilité du domaine via Dynadot ──────────────────────
  const verifierDisponibilite = async () => {
    if (!domaineRecherche) {
      setMessageAchat({ type: 'info', texte: 'Veuillez entrer un nom de domaine.' });
      return;
    }

    setRechercheEnCours(true);
    setDomaineDisponible(null);
    setMessageAchat(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/dynadot/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ domain: domaineRecherche })
      });

      const data = await res.json();

      if (data.disponible === true) {
        setDomaineDisponible(true);
        setPrixDomaine(PRIX_TOTAL);
        setMessageAchat({ 
          type: 'success', 
          texte: `✅ ${domaineRecherche} est disponible ! Prix : ${PRIX_TOTAL.toFixed(2)}$ CAD taxes incluses.` 
        });
      } else if (data.disponible === false) {
        setDomaineDisponible(false);
        setMessageAchat({ 
          type: 'error', 
          texte: `❌ ${domaineRecherche} n'est pas disponible. Essayez une autre extension ou un autre nom.` 
        });
      } else {
        setMessageAchat({ 
          type: 'error', 
          texte: 'Erreur lors de la vérification. Veuillez réessayer.' 
        });
      }
    } catch (error) {
      setMessageAchat({ 
        type: 'error', 
        texte: 'Erreur de connexion au service de vérification.' 
      });
    }

    setRechercheEnCours(false);
  };

  // ── Acheter le domaine via Stripe ──────────────────────────────────────────
  const acheterDomaine = async () => {
    if (!domaineRecherche || !domaineDisponible) return;

    setAchatEnCours(true);
    setMessageAchat(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/dynadot/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          domain: domaineRecherche, 
          years: 1,
          gestionnaireId: gestionnaireId
        })
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessageAchat({ 
          type: 'error', 
          texte: data.error || 'Erreur lors de la création du paiement.' 
        });
        setAchatEnCours(false);
      }
    } catch (error) {
      setMessageAchat({ 
        type: 'error', 
        texte: 'Erreur de connexion. Veuillez réessayer.' 
      });
      setAchatEnCours(false);
    }
  };

  // ── Sauvegarder les domaines existants ─────────────────────────────────────
  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/studio/sites/${gestionnaireId}/domaine`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ sous_domaine: sousDomaine, domaine_perso: domainePerso }),
      });
      setSauvegarde(res.ok ? 'ok' : 'err');
      setTimeout(() => setSauvegarde('idle'), 3000);
    } catch {
      setSauvegarde('err');
      setTimeout(() => setSauvegarde('idle'), 3000);
    }
  };

  // ── Formater la date ───────────────────────────────────────────────────────
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-CA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // ── Obtenir le statut en français ─────────────────────────────────────────
  const getStatutFr = (statut: string) => {
    const statuts: Record<string, { label: string; couleur: string; emoji: string }> = {
      'actif': { label: 'Actif', couleur: '#10b981', emoji: '✅' },
      'expire': { label: 'Expiré', couleur: '#ef4444', emoji: '❌' },
      'en_attente': { label: 'En attente', couleur: '#f59e0b', emoji: '⏳' },
    };
    return statuts[statut] || { label: statut, couleur: '#888', emoji: '❓' };
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', fontFamily: "'Inter', sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>Mon domaine</h1>
      <p style={{ fontSize: 15, color: '#666', marginBottom: 32 }}>
        Configurez le domaine de votre site ou achetez-en un directement via e-Vend Studio.
      </p>

      {/* ── SECTION 1 : ACHETER UN DOMAINE ── */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f0f4ff 0%, #fff 100%)', 
        borderRadius: 16, 
        border: '2px solid #4F46E5', 
        padding: 28, 
        marginBottom: 32 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>🎯</span>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>Acheter un domaine via e-Vend Studio</h2>
            <p style={{ fontSize: 13, color: '#666' }}>
              Trouvez le domaine parfait pour votre site. Paiement sécurisé par Stripe.
            </p>
          </div>
        </div>

        <div style={{ 
          background: '#f8fafc', 
          borderRadius: 10, 
          padding: '14px 18px', 
          marginBottom: 20,
          borderLeft: '4px solid #4F46E5'
        }}>
          <p style={{ fontSize: 13, color: '#334155', margin: 0, lineHeight: 1.6 }}>
            <strong>📋 Comment ça fonctionne :</strong><br />
            1️⃣ Entrez le nom de domaine que vous souhaitez (ex: monentreprise)<br />
            2️⃣ Cliquez sur "Vérifier" pour voir s'il est disponible<br />
            3️⃣ Si disponible, cliquez sur "Acheter maintenant"<br />
            4️⃣ Vous serez redirigé vers Stripe pour le paiement sécurisé<br />
            5️⃣ Une fois payé, le domaine est enregistré et configuré automatiquement
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              type="text"
              placeholder="monentreprise.com"
              value={domaineRecherche}
              onChange={e => {
                setDomaineRecherche(e.target.value);
                setDomaineDisponible(null);
                setMessageAchat(null);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `2px solid ${domaineDisponible === true ? '#10b981' : domaineDisponible === false ? '#ef4444' : '#e5e7eb'}`,
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                background: '#fff'
              }}
            />
          </div>
          <button
            onClick={verifierDisponibilite}
            disabled={rechercheEnCours}
            style={{
              padding: '12px 28px',
              background: '#4F46E5',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              cursor: rechercheEnCours ? 'not-allowed' : 'pointer',
              opacity: rechercheEnCours ? 0.7 : 1
            }}
          >
            {rechercheEnCours ? '⏳ Vérification...' : '🔍 Vérifier'}
          </button>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#888' }}>Extensions populaires :</span>
          {['.com', '.ca', '.org', '.net', '.shop'].map(ext => (
            <button
              key={ext}
              onClick={() => {
                const base = domaineRecherche.replace(/\.[a-z]+$/, '');
                setDomaineRecherche(base + ext);
                setDomaineDisponible(null);
                setMessageAchat(null);
              }}
              style={{
                padding: '2px 10px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: 4,
                fontSize: 12,
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              {ext}
            </button>
          ))}
        </div>

        {messageAchat && (
          <div style={{
            marginTop: 16,
            padding: '14px 18px',
            borderRadius: 10,
            background: messageAchat.type === 'success' ? '#ecfdf5' : 
                       messageAchat.type === 'error' ? '#fef2f2' : '#eff6ff',
            border: `1px solid ${messageAchat.type === 'success' ? '#10b981' : messageAchat.type === 'error' ? '#ef4444' : '#3b82f6'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <p style={{ 
                fontSize: 14, 
                color: messageAchat.type === 'success' ? '#065f46' : 
                       messageAchat.type === 'error' ? '#991b1b' : '#1e40af',
                margin: 0
              }}>
                {messageAchat.texte}
              </p>
              {domaineDisponible && (
                <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  💳 Paiement sécurisé par Stripe. Aucune carte enregistrée.
                </p>
              )}
            </div>
            
            {domaineDisponible && (
              <button
                onClick={acheterDomaine}
                disabled={achatEnCours}
                style={{
                  padding: '10px 24px',
                  background: '#10b981',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: achatEnCours ? 'not-allowed' : 'pointer',
                  opacity: achatEnCours ? 0.7 : 1,
                  whiteSpace: 'nowrap'
                }}
              >
                {achatEnCours ? '⏳...' : '🛒 Acheter maintenant'}
              </button>
            )}
          </div>
        )}

        {domaineDisponible && (
          <div style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
            <strong>Prix :</strong> {PRIX_TOTAL.toFixed(2)}$ CAD (incluant TPS/TVQ)
            <span style={{ fontSize: 11, color: '#999', marginLeft: 12 }}>
              (Renouvellement annuel au même prix)
            </span>
          </div>
        )}
      </div>

      {/* ── SECTION 2 : SOUS-DOMAINE GRATUIT ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>🆓</span>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>Sous-domaine gratuit</h2>
            <p style={{ fontSize: 13, color: '#666' }}>Inclus avec votre compte e-Vend Studio.</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <input
            value={sousDomaine}
            onChange={e => setSousDomaine(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="mon-nom"
            style={{ flex: 1, padding: '10px 14px', border: 'none', outline: 'none', fontSize: 14 }}
          />
          <span style={{ padding: '10px 14px', background: '#f5f5f5', fontSize: 14, color: '#888', borderLeft: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>
            .e-vendstudio.ca
          </span>
        </div>
        {sousDomaine && (
          <p style={{ fontSize: 12, color: '#10b981', marginTop: 6 }}>
            ✓ Votre site sera accessible à : <strong>{sousDomaine}.e-vendstudio.ca</strong>
          </p>
        )}
      </div>

      {/* ── SECTION 3 : DOMAINE PERSONNALISÉ EXISTANT ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>🔗</span>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>J'ai déjà un domaine</h2>
            <p style={{ fontSize: 13, color: '#666' }}>Connectez un domaine que vous possédez déjà.</p>
          </div>
        </div>

        <input
          value={domainePerso}
          onChange={e => setDomainePerso(e.target.value)}
          placeholder="www.mondomaine.com"
          style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        />
        
        <div style={{ marginTop: 12, background: '#f8f8f8', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#555', fontFamily: 'monospace' }}>
          CNAME → sites.e-vendstudio.ca
        </div>
        <p style={{ fontSize: 11, color: '#999', marginTop: 8 }}>
          ⏱️ La propagation DNS peut prendre jusqu'à 48h.
        </p>
      </div>

      {/* ── SECTION 4 : MES DOMAINES ACHETÉS ── */}
      <div style={{ 
        background: '#fff', 
        borderRadius: 16, 
        border: '1px solid #e5e7eb', 
        padding: 28, 
        marginTop: 32,
        marginBottom: 32
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>📋</span>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>Mes domaines achetés</h2>
              <p style={{ fontSize: 13, color: '#666' }}>
                {domainesAchetes.length === 0 
                  ? 'Vous n\'avez pas encore acheté de domaine.' 
                  : `${domainesAchetes.length} domaine${domainesAchetes.length > 1 ? 's' : ''} acheté${domainesAchetes.length > 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
          {domainesAchetes.length > 0 && (
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '6px 14px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                color: '#666',
                cursor: 'pointer'
              }}
            >
              🔄 Actualiser
            </button>
          )}
        </div>

        {chargementDomaines ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: '50%', 
              border: '3px solid #e5e7eb', 
              borderTopColor: '#4F46E5',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
            <p style={{ fontSize: 13, color: '#999', marginTop: 12 }}>Chargement de vos domaines...</p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : domainesAchetes.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '32px 0',
            background: '#f8fafc',
            borderRadius: 12,
            border: '1px dashed #d1d5db'
          }}>
            <p style={{ fontSize: 40, marginBottom: 8 }}>🌐</p>
            <p style={{ fontSize: 14, color: '#888' }}>
              Vous n'avez pas encore acheté de domaine.
            </p>
            <p style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
              Utilisez la section "Acheter un domaine" ci-dessus pour commencer.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#888', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Domaine
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#888', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Statut
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#888', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Expiration
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: '#888', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Acheté le
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', color: '#888', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {domainesAchetes.map((d) => {
                  const statut = getStatutFr(d.statut);
                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 600, color: '#1a1a1a' }}>
                        {d.domaine}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          background: statut.couleur + '15',
                          color: statut.couleur
                        }}>
                          {statut.emoji} {statut.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', color: '#666', fontSize: 13 }}>
                        {formatDate(d.expiration_date)}
                      </td>
                      <td style={{ padding: '12px 8px', color: '#666', fontSize: 13 }}>
                        {formatDate(d.created_at)}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <button
                          onClick={() => window.open(`https://www.dynadot.com/account/domain/${d.domaine}`, '_blank')}
                          style={{
                            padding: '4px 12px',
                            background: 'transparent',
                            border: '1px solid #d1d5db',
                            borderRadius: 4,
                            fontSize: 12,
                            color: '#666',
                            cursor: 'pointer'
                          }}
                        >
                          Gérer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── BOUTON SAUVEGARDER ── TOUT EN BAS */}
      <button 
        onClick={handleSave} 
        style={{ 
          padding: '12px 32px', 
          background: sauvegarde === 'ok' ? '#10b981' : sauvegarde === 'err' ? '#dc2626' : '#c9a96e', 
          border: 'none', 
          borderRadius: 8, 
          color: '#fff', 
          fontWeight: 600, 
          fontSize: 15, 
          cursor: 'pointer', 
          transition: 'background .3s',
          width: '100%',
          maxWidth: 300,
          display: 'block',
          margin: '0 auto 24px'
        }}
      >
        {sauvegarde === 'ok' ? '✅ Sauvegardé!' : sauvegarde === 'err' ? '❌ Erreur' : '💾 Sauvegarder les modifications'}
      </button>

      {/* ── FOOTER ── */}
      <div style={{ paddingTop: 16, borderTop: '1px solid #f0f0f0', fontSize: 12, color: '#999', textAlign: 'center' }}>
        💡 Les domaines sont gérés via Dynadot. Paiement sécurisé par Stripe.
      </div>
    </div>
  );
}