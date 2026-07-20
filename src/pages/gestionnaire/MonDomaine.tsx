// src/pages/gestionnaire/MonDomaine.tsx
// e-Vend Studio — Page "Mon domaine" avec achat de domaine intégré

import React, { useState, useEffect } from 'react';
import GuideDomaine from './GuideDomaine';

interface Props { gestionnaireId: number; emailVerifie?: boolean; }

interface DomaineAchete {
  id: number;
  domaine: string;
  dynadot_order_id: string | null;
  expiration_date: string | number | null;
  statut: 'actif' | 'expire' | 'en_attente';
  created_at: string;
  renouvellement_auto: boolean;
  prix_client: number | null;
  montant_total: number | null;
}

interface ResultatExtension {
  domaine: string;
  disponible: boolean;
  prix_avant_taxes: number | null;
  tps: number | null;
  tvq: number | null;
  prix_total: number | null;
}

export default function MonDomaine({ gestionnaireId, emailVerifie = true }: Props) {
  const [guideOuvert, setGuideOuvert] = useState(false);
  const [sousDomaine, setSousDomaine] = useState('');
  const [domainePerso, setDomainePerso] = useState('');
  const [sauvegarde, setSauvegarde] = useState<'idle' | 'ok' | 'err'>('idle');
  const [messageErreur, setMessageErreur] = useState<string | null>(null);

  // ── Vérification en temps réel du sous-domaine ─────────────────────────────
  const [verifSousDomaine, setVerifSousDomaine] = useState<'idle' | 'checking' | 'dispo' | 'pris' | 'invalide'>('idle');
  const [messageVerifSousDomaine, setMessageVerifSousDomaine] = useState('');

  // ── Statut Cloudflare du domaine perso (après sauvegarde) ──────────────────
  const [statutDomainePerso, setStatutDomainePerso] = useState<{ statut: string; message: string } | null>(null);

  // ── État pour l'achat de domaine (recherche multi-extensions) ─────────────
  const [nomBaseRecherche, setNomBaseRecherche] = useState('');
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [resultatsMulti, setResultatsMulti] = useState<ResultatExtension[]>([]);
  const [messageAchat, setMessageAchat] = useState<{ type: 'success' | 'error' | 'info'; texte: string } | null>(null);
  const [domaineEnAchat, setDomaineEnAchat] = useState<string | null>(null); // pour désactiver le bon bouton pendant l'achat

  // ── État pour les actions de renouvellement ────────────────────────────────
  const [actionEnCours, setActionEnCours] = useState<number | null>(null); // id du domaine en cours d'action

  // ── État pour les domaines achetés ─────────────────────────────────────────
  const [domainesAchetes, setDomainesAchetes] = useState<DomaineAchete[]>([]);
  const [chargementDomaines, setChargementDomaines] = useState(true);

  // ── Extensions offertes (doit correspondre à EXTENSIONS_AUTORISEES du backend) ──
  const EXTENSIONS = ['com', 'ca', 'net', 'org'];

  // ── Charger les données existantes du site (sous-domaine, domaine perso) ───
  useEffect(() => {
    const chargerSite = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${gestionnaireId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setSousDomaine(data.sous_domaine || '');
          setDomainePerso(data.domaine_perso || '');
        }
      } catch (error) {
        console.error('Erreur chargement site:', error);
      }
    };

    chargerSite();
  }, [gestionnaireId]);

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

  // ── Vérification en temps réel du sous-domaine (debounced 500ms) ───────────
  useEffect(() => {
    const slug = sousDomaine.trim();
    if (!slug) {
      setVerifSousDomaine('idle');
      setMessageVerifSousDomaine('');
      return;
    }

    setVerifSousDomaine('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/studio/sites/sousdomaine/verifier/${encodeURIComponent(slug)}?exclude=${gestionnaireId}`
        );
        const data = await res.json();
        if (data.disponible) {
          setVerifSousDomaine('dispo');
          setMessageVerifSousDomaine(`✓ ${slug}.e-vendstudio.ca est disponible !`);
        } else {
          setVerifSousDomaine(data.raison?.includes('réservé') || data.raison?.includes('déjà') ? 'pris' : 'invalide');
          setMessageVerifSousDomaine(data.raison || 'Sous-domaine indisponible.');
        }
      } catch {
        setVerifSousDomaine('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [sousDomaine, gestionnaireId]);

  // ── Polling du statut Cloudflare pour le domaine perso ──────────────────────
  useEffect(() => {
    if (!domainePerso || statutDomainePerso?.statut === 'actif') return;

    const verifierStatut = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${gestionnaireId}/domaine/statut`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStatutDomainePerso({ statut: data.statut, message: data.message });
        }
      } catch {
        // silencieux — on réessaiera au prochain intervalle
      }
    };

    verifierStatut();
    const interval = setInterval(verifierStatut, 15000); // toutes les 15s
    return () => clearInterval(interval);
  }, [domainePerso, gestionnaireId, statutDomainePerso?.statut]);

  // ── Vérifier la disponibilité sur toutes les extensions sûres à la fois ────
  const verifierDisponibilite = async () => {
    const nom = nomBaseRecherche.trim().toLowerCase().replace(/\.[a-z]+$/, ''); // au cas où l'utilisateur tape avec une extension
    if (!nom) {
      setMessageAchat({ type: 'info', texte: 'Veuillez entrer un nom de domaine.' });
      return;
    }

    setRechercheEnCours(true);
    setResultatsMulti([]);
    setMessageAchat(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/dynadot/check-availability-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nomBase: nom })
      });

      const data = await res.json();

      if (data.resultats && data.resultats.length) {
        setResultatsMulti(data.resultats);
        const auMoinsUnDisponible = data.resultats.some((r: ResultatExtension) => r.disponible);
        if (!auMoinsUnDisponible) {
          setMessageAchat({ type: 'error', texte: `❌ "${nom}" n'est disponible sur aucune extension. Essayez un autre nom.` });
        }
      } else {
        setMessageAchat({ type: 'error', texte: data.error || 'Erreur lors de la vérification.' });
      }
    } catch (error) {
      setMessageAchat({ type: 'error', texte: 'Erreur de connexion au service de vérification.' });
    }

    setRechercheEnCours(false);
  };

  // ── Acheter un domaine précis (choisi parmi les résultats multi-extensions) ──
  const acheterDomaine = async (domainComplet: string) => {
    if (!emailVerifie) {
      setMessageAchat({ type: 'error', texte: '🔒 Vérifiez votre adresse courriel avant d\'acheter un domaine. Consultez la bannière en haut de votre tableau de bord.' });
      return;
    }
    setDomaineEnAchat(domainComplet);
    setMessageAchat(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/dynadot/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          domain: domainComplet, 
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
        setDomaineEnAchat(null);
      }
    } catch (error) {
      setMessageAchat({ 
        type: 'error', 
        texte: 'Erreur de connexion. Veuillez réessayer.' 
      });
      setDomaineEnAchat(null);
    }
  };

  // ── Sauvegarder les domaines existants ─────────────────────────────────────
  const handleSave = async () => {
    setMessageErreur(null);

    // Bloquer si l'adresse courriel n'est pas encore vérifiée
    if (!emailVerifie) {
      setMessageErreur('🔒 Vérifiez votre adresse courriel avant de mettre votre site en ligne. Consultez la bannière en haut de votre tableau de bord pour renvoyer le lien de vérification.');
      setSauvegarde('err');
      setTimeout(() => setSauvegarde('idle'), 4000);
      return;
    }

    // Bloquer localement si on sait déjà que le sous-domaine est pris/invalide
    if (sousDomaine && verifSousDomaine !== 'dispo' && verifSousDomaine !== 'idle') {
      setMessageErreur(messageVerifSousDomaine || 'Corrigez le sous-domaine avant de sauvegarder.');
      setSauvegarde('err');
      setTimeout(() => setSauvegarde('idle'), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/studio/sites/${gestionnaireId}/domaine`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ sous_domaine: sousDomaine, domaine_perso: domainePerso }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessageErreur(data.message || 'Erreur lors de la sauvegarde.');
        setSauvegarde('err');
      } else {
        setSauvegarde('ok');
        setStatutDomainePerso(null); // relance le polling avec le nouveau statut
        if (data.avertissement) setMessageErreur(data.avertissement);
      }
      setTimeout(() => setSauvegarde('idle'), 3000);
    } catch {
      setSauvegarde('err');
      setMessageErreur('Erreur de connexion. Veuillez réessayer.');
      setTimeout(() => setSauvegarde('idle'), 3000);
    }
  };

  // ── Formater la date (gère les timestamps Unix en millisecondes de Dynadot) ──
  const formatDate = (dateVal: string | number | null) => {
    if (!dateVal) return 'N/A';
    const timestamp = typeof dateVal === 'string' ? Number(dateVal) : dateVal;
    const date = isNaN(timestamp) ? new Date(dateVal as string) : new Date(timestamp);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('fr-CA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // ── Calculer l'urgence d'expiration (pour le code couleur) ─────────────────
  const getUrgenceExpiration = (dateVal: string | number | null) => {
    if (!dateVal) return { jours: null, couleur: '#888', label: '' };
    const timestamp = typeof dateVal === 'string' ? Number(dateVal) : dateVal;
    const dateExpiration = isNaN(timestamp) ? new Date(dateVal as string) : new Date(timestamp);
    if (isNaN(dateExpiration.getTime())) return { jours: null, couleur: '#888', label: '' };

    const maintenant = new Date();
    const joursRestants = Math.ceil((dateExpiration.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24));

    if (joursRestants < 0) return { jours: joursRestants, couleur: '#dc2626', label: 'Expiré' };
    if (joursRestants <= 7) return { jours: joursRestants, couleur: '#dc2626', label: `${joursRestants}j restants` };
    if (joursRestants <= 30) return { jours: joursRestants, couleur: '#f59e0b', label: `${joursRestants}j restants` };
    return { jours: joursRestants, couleur: '#10b981', label: `${joursRestants}j restants` };
  };

  // ── Renouveler maintenant (paiement manuel via Stripe Checkout) ────────────
  const renouvelerMaintenant = async (domaineId: number) => {
    setActionEnCours(domaineId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/dynadot/domaines/${domaineId}/renouveler-maintenant`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessageErreur(data.error || 'Erreur lors du renouvellement.');
        setActionEnCours(null);
      }
    } catch {
      setMessageErreur('Erreur de connexion.');
      setActionEnCours(null);
    }
  };

  // ── Activer le renouvellement automatique (redirige vers Stripe pour sauvegarder la carte) ──
  const activerRenouvellementAuto = async (domaineId: number) => {
    setActionEnCours(domaineId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/dynadot/domaines/${domaineId}/setup-renouvellement-auto`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessageErreur(data.error || 'Erreur lors de la configuration.');
        setActionEnCours(null);
      }
    } catch {
      setMessageErreur('Erreur de connexion.');
      setActionEnCours(null);
    }
  };

  // ── Désactiver le renouvellement automatique ───────────────────────────────
  const desactiverRenouvellementAuto = async (domaineId: number) => {
    setActionEnCours(domaineId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/dynadot/domaines/${domaineId}/renouvellement-auto`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ actif: false }),
      });
      if (res.ok) {
        setDomainesAchetes(prev => prev.map(d => d.id === domaineId ? { ...d, renouvellement_auto: false } : d));
      }
    } catch {
      // silencieux
    } finally {
      setActionEnCours(null);
    }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Mon domaine</h1>
        <button
          onClick={() => setGuideOuvert(true)}
          style={{
            padding: '10px 20px', background: '#4F46E5', border: 'none', borderRadius: 8,
            color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          📖 Guide
        </button>
      </div>
      <p style={{ fontSize: 15, color: '#666', marginBottom: 32 }}>
        Configurez le domaine de votre site ou achetez-en un directement via e-Vend Studio.
      </p>

      {guideOuvert && <GuideDomaine onFermer={() => setGuideOuvert(false)} />}

      {!emailVerifie && (
        <div style={{
          display: 'flex', gap: 12, alignItems: 'flex-start',
          background: '#fef2f2', border: '1.5px solid #ef4444', borderRadius: 12,
          padding: '16px 20px', marginBottom: 28,
        }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>🔒</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: '#991b1b', fontSize: 14 }}>
              Votre courriel n'est pas encore vérifié
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#991b1b', lineHeight: 1.5 }}>
              Vous pouvez explorer et configurer cette page, mais vous ne pourrez pas acheter un domaine
              ou activer votre sous-domaine tant que votre adresse courriel n'est pas confirmée.
              Consultez la bannière en haut du tableau de bord pour renvoyer le lien de vérification.
            </p>
          </div>
        </div>
      )}

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
            1️⃣ Entrez un nom (sans extension), ex: monentreprise<br />
            2️⃣ On vérifie la disponibilité sur {EXTENSIONS.map(e => '.' + e).join(', ')} en même temps<br />
            3️⃣ Choisissez l'extension qui vous convient et cliquez "Acheter"<br />
            4️⃣ Vous serez redirigé vers Stripe pour le paiement sécurisé<br />
            5️⃣ Une fois payé, le domaine est enregistré et connecté automatiquement à votre site
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              type="text"
              placeholder="monentreprise (sans extension)"
              value={nomBaseRecherche}
              onChange={e => {
                setNomBaseRecherche(e.target.value);
                setResultatsMulti([]);
                setMessageAchat(null);
              }}
              onKeyDown={e => { if (e.key === 'Enter') verifierDisponibilite(); }}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
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
            {rechercheEnCours ? '⏳ Vérification...' : '🔍 Vérifier les extensions'}
          </button>
        </div>

        <p style={{ fontSize: 11, color: '#999', marginTop: 8 }}>
          Extensions offertes : {EXTENSIONS.map(e => '.' + e).join(', ')} — choisies pour des prix stables et prévisibles à long terme.
        </p>

        {messageAchat && (
          <div style={{
            marginTop: 16,
            padding: '14px 18px',
            borderRadius: 10,
            background: messageAchat.type === 'success' ? '#ecfdf5' : 
                       messageAchat.type === 'error' ? '#fef2f2' : '#eff6ff',
            border: `1px solid ${messageAchat.type === 'success' ? '#10b981' : messageAchat.type === 'error' ? '#ef4444' : '#3b82f6'}`,
          }}>
            <p style={{ 
              fontSize: 14, 
              color: messageAchat.type === 'success' ? '#065f46' : 
                     messageAchat.type === 'error' ? '#991b1b' : '#1e40af',
              margin: 0
            }}>
              {messageAchat.texte}
            </p>
          </div>
        )}

        {/* ── Résultats multi-extensions ── */}
        {resultatsMulti.length > 0 && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {resultatsMulti.map(r => (
              <div
                key={r.domaine}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: '#fff',
                  borderRadius: 10,
                  border: `1.5px solid ${r.disponible ? '#10b981' : '#e5e7eb'}`,
                  opacity: r.disponible ? 1 : 0.6,
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                    {r.domaine}
                  </p>
                  <p style={{ fontSize: 12, color: r.disponible ? '#10b981' : '#999', margin: '2px 0 0' }}>
                    {r.disponible
                      ? `✓ Disponible — ${r.prix_total != null ? r.prix_total.toFixed(2) : '?'}$ CAD/an (taxes incluses)`
                      : '✗ Non disponible'}
                  </p>
                  {r.disponible && r.prix_avant_taxes != null && (
                    <p style={{ fontSize: 10, color: '#aaa', margin: '2px 0 0' }}>
                      Sous-total {r.prix_avant_taxes.toFixed(2)}$ + TPS {r.tps?.toFixed(2)}$ + TVQ {r.tvq?.toFixed(2)}$
                    </p>
                  )}
                </div>

                {r.disponible && (
                  <button
                    onClick={() => acheterDomaine(r.domaine)}
                    disabled={domaineEnAchat !== null || !emailVerifie}
                    title={!emailVerifie ? 'Vérifiez votre adresse courriel avant d\'acheter un domaine.' : undefined}
                    style={{
                      padding: '10px 22px',
                      background: !emailVerifie ? '#9ca3af' : '#10b981',
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: (domaineEnAchat !== null || !emailVerifie) ? 'not-allowed' : 'pointer',
                      opacity: (domaineEnAchat !== null && domaineEnAchat !== r.domaine) ? 0.5 : 1,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {!emailVerifie ? '🔒 Courriel non vérifié' : domaineEnAchat === r.domaine ? '⏳...' : '🛒 Acheter'}
                  </button>
                )}
              </div>
            ))}
            <p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
              💳 Paiement sécurisé par Stripe. Renouvellement annuel au prix courant de Dynadot + 10$ CAD de service.
            </p>
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

        <div style={{
          display: 'flex', alignItems: 'center', borderRadius: 8, overflow: 'hidden',
          border: `1.5px solid ${
            verifSousDomaine === 'dispo' ? '#10b981' :
            (verifSousDomaine === 'pris' || verifSousDomaine === 'invalide') ? '#ef4444' :
            '#e5e7eb'
          }`,
        }}>
          <input
            value={sousDomaine}
            onChange={e => setSousDomaine(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="mon-nom"
            maxLength={30}
            style={{ flex: 1, padding: '10px 14px', border: 'none', outline: 'none', fontSize: 14 }}
          />
          <span style={{ padding: '10px 14px', background: '#f5f5f5', fontSize: 14, color: '#888', borderLeft: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>
            .e-vendstudio.ca
          </span>
        </div>

        {verifSousDomaine === 'checking' && (
          <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>⏳ Vérification...</p>
        )}
        {verifSousDomaine === 'dispo' && (
          <p style={{ fontSize: 12, color: '#10b981', marginTop: 6 }}>{messageVerifSousDomaine}</p>
        )}
        {(verifSousDomaine === 'pris' || verifSousDomaine === 'invalide') && (
          <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>✗ {messageVerifSousDomaine}</p>
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

        {/* ── Avertissement : le www est obligatoire ── */}
        <div style={{
          marginTop: 10,
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 12.5,
          color: '#92400e',
          lineHeight: 1.5,
        }}>
          ⚠️ <strong>Important :</strong> entrez votre domaine avec le <strong>www</strong> devant
          (ex. : <code>www.mondomaine.com</code>). Un domaine sans www (ex. : <code>mondomaine.com</code>)
          ne peut pas être connecté directement pour des raisons techniques (limitation standard du DNS).
          Si vous voulez que <code>mondomaine.com</code> (sans www) fonctionne aussi, configurez une
          redirection vers <code>www.mondomaine.com</code> chez votre fournisseur de domaine — la plupart
          l'offrent gratuitement.
        </div>

        {/* ── Avertissement dynamique si le www est manquant ── */}
        {domainePerso.trim() && !domainePerso.trim().toLowerCase().startsWith('www.') && (
          <p style={{ fontSize: 12, color: '#dc2626', marginTop: 8, fontWeight: 600 }}>
            ✗ Il manque le "www." au début. Essayez : www.{domainePerso.trim().replace(/^https?:\/\//, '')}
          </p>
        )}

        <div style={{ marginTop: 12, background: '#f8f8f8', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#555', fontFamily: 'monospace' }}>
          CNAME → evend-studio.onrender.com
        </div>
        <p style={{ fontSize: 11, color: '#999', marginTop: 8 }}>
          ⏱️ La propagation DNS peut prendre jusqu'à 48h.
        </p>

        {statutDomainePerso && (
          <div style={{
            marginTop: 12,
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            background: statutDomainePerso.statut === 'actif' ? '#ecfdf5' :
                        statutDomainePerso.statut === 'erreur' || statutDomainePerso.statut === 'bloque' ? '#fef2f2' : '#fffbeb',
            color: statutDomainePerso.statut === 'actif' ? '#065f46' :
                   statutDomainePerso.statut === 'erreur' || statutDomainePerso.statut === 'bloque' ? '#991b1b' : '#92400e',
          }}>
            {statutDomainePerso.message}
          </div>
        )}
      </div>

      {messageErreur && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
          padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#991b1b',
        }}>
          ⚠️ {messageErreur}
        </div>
      )}

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
                    Renouvellement auto
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', color: '#888', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {domainesAchetes.map((d) => {
                  const statut = getStatutFr(d.statut);
                  const urgence = getUrgenceExpiration(d.expiration_date);
                  const enCours = actionEnCours === d.id;
                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 600, color: '#1a1a1a' }}>
                        {d.domaine}
                        {d.montant_total != null && (
                          <div style={{ fontSize: 11, color: '#999', fontWeight: 400 }}>
                            {d.montant_total.toFixed(2)}$ CAD/an (taxes incl.)
                          </div>
                        )}
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
                      <td style={{ padding: '12px 8px', fontSize: 13 }}>
                        <div style={{ color: '#666' }}>{formatDate(d.expiration_date)}</div>
                        {urgence.label && (
                          <div style={{ fontSize: 11, fontWeight: 700, color: urgence.couleur, marginTop: 2 }}>
                            {urgence.label}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {d.renouvellement_auto ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>✅ Activé</span>
                            <button
                              onClick={() => desactiverRenouvellementAuto(d.id)}
                              disabled={enCours}
                              style={{
                                padding: '3px 10px', background: 'transparent', border: '1px solid #d1d5db',
                                borderRadius: 4, fontSize: 11, color: '#888', cursor: enCours ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {enCours ? '...' : 'Désactiver'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => activerRenouvellementAuto(d.id)}
                            disabled={enCours}
                            style={{
                              padding: '4px 12px', background: '#eff6ff', border: '1px solid #93c5fd',
                              borderRadius: 4, fontSize: 12, color: '#1e40af', cursor: enCours ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {enCours ? '⏳...' : '🔁 Activer'}
                          </button>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => renouvelerMaintenant(d.id)}
                            disabled={enCours}
                            style={{
                              padding: '4px 12px',
                              background: '#4F46E5',
                              border: 'none',
                              borderRadius: 4,
                              fontSize: 12,
                              color: '#fff',
                              cursor: enCours ? 'not-allowed' : 'pointer',
                              opacity: enCours ? 0.6 : 1,
                            }}
                          >
                            {enCours ? '⏳' : 'Renouveler'}
                          </button>
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
                        </div>
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
        disabled={!emailVerifie}
        title={!emailVerifie ? 'Vérifiez votre adresse courriel avant de mettre votre site en ligne.' : undefined}
        style={{ 
          padding: '12px 32px', 
          background: !emailVerifie ? '#9ca3af' : sauvegarde === 'ok' ? '#10b981' : sauvegarde === 'err' ? '#dc2626' : '#c9a96e', 
          border: 'none', 
          borderRadius: 8, 
          color: '#fff', 
          fontWeight: 600, 
          fontSize: 15, 
          cursor: !emailVerifie ? 'not-allowed' : 'pointer', 
          transition: 'background .3s',
          width: '100%',
          maxWidth: 300,
          display: 'block',
          margin: '0 auto 24px'
        }}
      >
        {!emailVerifie ? '🔒 Courriel non vérifié' : sauvegarde === 'ok' ? '✅ Sauvegardé!' : sauvegarde === 'err' ? '❌ Erreur' : '💾 Sauvegarder les modifications'}
      </button>

      {/* ── FOOTER ── */}
      <div style={{ paddingTop: 16, borderTop: '1px solid #f0f0f0', fontSize: 12, color: '#999', textAlign: 'center' }}>
        💡 Les domaines sont gérés via Dynadot. Paiement sécurisé par Stripe.
      </div>
    </div>
  );
}