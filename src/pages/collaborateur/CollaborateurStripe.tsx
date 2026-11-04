// CHEMIN : src/pages/collaborateur/CollaborateurStripe.tsx
// e-Vend Studio — Espace collaborateur : lier SON compte Stripe à la boutique.
// Les paiements sont reçus sur le compte Stripe du collaborateur ; la configuration
// (type de compte, clés) est celle du gestionnaire de ce site.
// Session : cookie httpOnly (credentials: 'include'), aucun jeton lu dans le navigateur.

import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

interface Props {
  gestionnaireId: number;
  collaborateurId: number;
  accent?: string;
  isMobile?: boolean;
}

interface StatutStripe {
  paiements_actives: boolean;
  connecte: boolean;
  verifie: boolean;
  stripe_account_id?: string;
  account_type?: string;
  statut?: string;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  docs_manquants?: string[];
  details_requis?: string[];
  disabled_reason?: string | null;
}

const LIBELLE_TYPE: Record<string, string> = { express: 'Express', standard: 'Standard', custom: 'Personnalisé' };

export default function CollaborateurStripe({ gestionnaireId, collaborateurId, accent = '#635bff', isMobile = false }: Props) {
  const base = `${API_BASE}/marketplace/${gestionnaireId}/collaborateurs/${collaborateurId}/stripe`;

  // Retour de Stripe : ?stripe=success | refresh (posé par le serveur dans l'URL de retour)
  const [retour, setRetour] = useState<'success' | 'refresh' | null>(() => {
    try {
      const v = new URLSearchParams(window.location.search).get('stripe');
      return v === 'success' || v === 'refresh' ? v : null;
    } catch { return null; }
  });

  const [statut, setStatut] = useState<StatutStripe | null>(null);
  const [chargement, setChargement] = useState(true);
  const [action, setAction] = useState<'connect' | 'deconnecter' | null>(null);
  const [erreur, setErreur] = useState('');
  const [confirmerDeconnexion, setConfirmerDeconnexion] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur('');
    try {
      const res = await fetch(`${base}/statut`, { credentials: 'include' });
      if (res.status === 401) { setErreur('Session expirée — reconnectez-vous.'); setStatut(null); }
      else if (!res.ok) { setErreur('Impossible de lire le statut Stripe pour le moment.'); setStatut(null); }
      else setStatut(await res.json());
    } catch {
      setErreur('Impossible de joindre le serveur.');
      setStatut(null);
    }
    setChargement(false);
  }, [base]);

  useEffect(() => { charger(); }, [charger]);

  // Nettoie l'URL (?stripe=…&page=…) une fois le retour de Stripe pris en compte.
  const fermerBandeau = () => {
    setRetour(null);
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete('stripe');
      u.searchParams.delete('page');
      window.history.replaceState({}, '', u.pathname + (u.search || '') + u.hash);
    } catch { /* URL non modifiable : sans importance */ }
  };

  // URL de la page du site, sans les paramètres de retour (le serveur n'accepte que le même hôte).
  const urlRetour = () => {
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete('stripe');
      u.searchParams.delete('page');
      u.hash = '';
      return u.toString();
    } catch { return ''; }
  };

  const connecter = async () => {
    setAction('connect');
    setErreur('');
    try {
      const res = await fetch(`${base}/connect`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retour: urlRetour() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.onboarding_url) {
        window.location.assign(data.onboarding_url);
        return;
      }
      setErreur(data.message || 'Erreur lors de la connexion à Stripe.');
    } catch {
      setErreur('Impossible de joindre le serveur.');
    }
    setAction(null);
  };

  const deconnecter = async () => {
    setAction('deconnecter');
    setErreur('');
    try {
      const res = await fetch(`${base}/deconnecter`, { method: 'POST', credentials: 'include' });
      if (res.ok) { setConfirmerDeconnexion(false); await charger(); }
      else {
        const data = await res.json().catch(() => ({}));
        setErreur(data.message || 'Erreur lors de la déconnexion.');
      }
    } catch {
      setErreur('Impossible de joindre le serveur.');
    }
    setAction(null);
  };

  // ─── Styles ────────────────────────────────────────────────────────────────
  const carte: React.CSSProperties = { background: '#fff', border: '1px solid #e1e4e8', borderRadius: 12, overflow: 'hidden', marginBottom: 16 };
  const enTete: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f0f0' };
  const corps: React.CSSProperties = { padding: 20, display: 'flex', flexDirection: 'column', gap: 14 };
  const bouton = (couleur: string, desactive = false): React.CSSProperties => ({
    background: desactive ? '#c9c9c9' : couleur, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 22px',
    fontSize: 14, fontWeight: 700, cursor: desactive ? 'not-allowed' : 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start',
  });
  const boite = (fond: string, bordure: string): React.CSSProperties => ({ background: fond, border: `1px solid ${bordure}`, borderRadius: 8, padding: '14px 18px' });

  const badge = (() => {
    if (!statut || !statut.paiements_actives) return { texte: 'Indisponible', fond: '#f3f4f6', couleur: '#6b7280' };
    if (!statut.connecte) return { texte: 'Non connecté', fond: '#fdecea', couleur: '#c0392b' };
    if (!statut.verifie) return { texte: 'Vérification incomplète', fond: '#fef9e7', couleur: '#b7950b' };
    return { texte: 'Actif', fond: '#e9f7ef', couleur: '#1e8449' };
  })();

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? 16 : 24, color: '#333' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, margin: 0 }}>💳 Paiements Stripe</h1>
        <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>
          Liez votre compte Stripe pour recevoir vos paiements directement dans votre compte bancaire.
        </p>
      </div>

      {/* Retour depuis Stripe */}
      {retour === 'success' && (
        <div style={{ ...boite('#e9f7ef', '#27ae60'), marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e8449' }}>Retour de Stripe reçu</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#555' }}>Nous vérifions l'état de votre compte ci-dessous.</p>
          </div>
          <button onClick={fermerBandeau} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#777' }} aria-label="Fermer">✕</button>
        </div>
      )}
      {retour === 'refresh' && (
        <div style={{ ...boite('#fef9e7', '#f39c12'), marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#b7950b' }}>Session Stripe interrompue</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#666' }}>Le lien a expiré ou vous avez quitté avant la fin. Vous pouvez reprendre là où vous étiez.</p>
          </div>
          <button onClick={() => { fermerBandeau(); connecter(); }} disabled={action !== null} style={{ ...bouton('#f39c12', action !== null), padding: '9px 16px', fontSize: 13 }}>
            Reprendre
          </button>
        </div>
      )}

      {erreur && (
        <div style={{ ...boite('#fdecea', '#e74c3c'), marginBottom: 16, fontSize: 13, color: '#c0392b' }}>⚠️ {erreur}</div>
      )}

      <div style={carte}>
        <div style={enTete}>
          <span style={{ fontSize: 24 }}>💳</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Compte Stripe</h2>
            <p style={{ margin: 0, fontSize: 12, color: '#999' }}>
              {statut?.connecte && statut.stripe_account_id ? `${statut.stripe_account_id}${statut.account_type ? ` — ${LIBELLE_TYPE[statut.account_type] || statut.account_type}` : ''}` : 'Aucun compte lié'}
            </p>
          </div>
          <span style={{ background: badge.fond, color: badge.couleur, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 12, whiteSpace: 'nowrap' }}>{badge.texte}</span>
        </div>

        <div style={corps}>
          {chargement && (
            <div style={{ textAlign: 'center', padding: 30 }}>
              <div style={{ width: 30, height: 30, border: `3px solid ${accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ color: '#999', fontSize: 13, margin: 0 }}>Vérification auprès de Stripe...</p>
            </div>
          )}

          {/* Le gestionnaire n'a pas encore activé les paiements */}
          {!chargement && statut && !statut.paiements_actives && (
            <div style={boite('#f3f4f6', '#d1d5db')}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#4b5563' }}>Paiements pas encore activés</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
                La boutique n'a pas encore terminé la configuration des paiements. Vous pourrez lier votre compte Stripe dès que ce sera fait.
              </p>
            </div>
          )}

          {/* Non connecté */}
          {!chargement && statut && statut.paiements_actives && !statut.connecte && (
            <>
              <div style={boite('#fdecea', '#e74c3c')}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#c0392b' }}>⚠️ Compte Stripe non connecté</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>
                  Connectez votre compte Stripe pour recevoir vos paiements. Vous serez redirigé vers Stripe, puis ramené ici.
                </p>
              </div>
              <button onClick={connecter} disabled={action !== null} style={bouton('#635bff', action !== null)}>
                {action === 'connect' ? '⏳ Connexion en cours...' : '💳 Connecter mon compte Stripe'}
              </button>
            </>
          )}

          {/* Connecté, vérification incomplète */}
          {!chargement && statut && statut.connecte && !statut.verifie && (
            <>
              <div style={boite('#fef9e7', '#f39c12')}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#b7950b' }}>⚠️ Vérification incomplète</p>
                {statut.disabled_reason && (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>Raison indiquée par Stripe : {statut.disabled_reason}</p>
                )}
                {(statut.docs_manquants || []).length > 0 && (
                  <>
                    <p style={{ margin: '8px 0 4px', fontSize: 12, color: '#666' }}>Informations manquantes :</p>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {(statut.docs_manquants || []).map((d, i) => <li key={i} style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>{d}</li>)}
                    </ul>
                  </>
                )}
              </div>
              <button onClick={connecter} disabled={action !== null} style={bouton('#f39c12', action !== null)}>
                {action === 'connect' ? '⏳ Chargement...' : '📋 Compléter ma vérification Stripe'}
              </button>
            </>
          )}

          {/* Connecté et vérifié */}
          {!chargement && statut && statut.connecte && statut.verifie && (
            <div style={boite('#e9f7ef', '#27ae60')}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e8449' }}>✅ Compte Stripe actif et vérifié</p>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#555' }}><strong>Compte :</strong> {statut.stripe_account_id}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#555' }}><strong>Type :</strong> {LIBELLE_TYPE[statut.account_type || ''] || statut.account_type || '—'}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#555' }}>
                <strong>Paiements :</strong> {statut.charges_enabled ? 'activés' : 'désactivés'} — <strong>Virements :</strong> {statut.payouts_enabled ? 'activés' : 'désactivés'}
              </p>
            </div>
          )}

          {/* Actions secondaires */}
          {!chargement && statut && statut.connecte && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={charger} disabled={action !== null} style={{ background: '#fff', color: '#555', border: '1px solid #e1e4e8', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                🔄 Rafraîchir le statut
              </button>
              {!confirmerDeconnexion ? (
                <button onClick={() => setConfirmerDeconnexion(true)} style={{ background: '#fff', color: '#c0392b', border: '1px solid #f5c6cb', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Déconnecter
                </button>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12, color: '#555' }}>
                  Déconnecter ce compte de la boutique ? (votre compte Stripe reste intact)
                  <button onClick={deconnecter} disabled={action !== null} style={{ background: '#c0392b', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {action === 'deconnecter' ? '⏳...' : 'Oui, déconnecter'}
                  </button>
                  <button onClick={() => setConfirmerDeconnexion(false)} style={{ background: 'none', border: 'none', color: '#777', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                </span>
              )}
            </div>
          )}

          {/* Erreur de lecture : permettre de réessayer */}
          {!chargement && !statut && (
            <button onClick={charger} style={{ background: '#fff', color: '#555', border: '1px solid #e1e4e8', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start' }}>
              🔄 Réessayer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}