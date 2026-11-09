// CHEMIN : src/pages/collaborateur/CollaborateurEbay.tsx
// e-Vend Studio — Dashboard collaborateur : connexion de SON compte eBay (add-on « Connecteur eBay »).
// Le collaborateur clique « Connecter mon eBay », autorise l'accès sur eBay, puis revient ici (?ebay=ok|refuse|erreur).
// API : GET /api/collab/:gid/ebay · POST /ebay/connecter · DELETE /ebay

import React, { useState, useEffect, useCallback } from 'react';

interface Props { gestionnaireId: number; accent: string; isMobile: boolean }
interface Travail { id: number; statut: 'en_attente' | 'en_cours' | 'pause' | 'termine' | 'erreur' | 'annule'; total: number; traites: number; importes: number; ignores: number; erreurs: number; message: string | null; reprise_a: string | null }
interface Suivi { dernier_suivi: string | null; prochain_suivi: string | null; dernier_resume: string | null; dernier_changement_le: string | null; suivi_erreur: string | null; nouvelles: number }
interface Etat {
  gestionnaire_configure: boolean;
  connexion: { statut: 'connecte' | 'reconnexion'; username: string | null; env: string; message: string | null; connecte_le: string } | null;
}

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626', ok: '#1E8449' };

export default function CollaborateurEbay({ gestionnaireId, accent, isMobile }: Props) {
  const base = `/api/collab/${gestionnaireId}/ebay`;
  const [etat, setEtat] = useState<Etat | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');
  const [travail, setTravail] = useState<Travail | null>(null);
  const [suivi, setSuivi] = useState<Suivi | null>(null);

  const charger = useCallback(async () => {
    try {
      const res = await fetch(base, { credentials: 'include' });
      const j = await res.json().catch(() => ({}));
      if (res.ok) { setEtat(j); setErreur(''); } else setErreur(j.error || 'Chargement impossible');
    } catch { setErreur('Erreur réseau'); }
  }, [base]);

  const chargerImport = useCallback(async () => {
    try {
      const res = await fetch(`${base}/import`, { credentials: 'include' });
      const j = await res.json().catch(() => ({}));
      if (res.ok) setTravail(j.import || null);
    } catch { /* on réessaie au prochain tour */ }
  }, [base]);

  const chargerSuivi = useCallback(async () => {
    try {
      const res = await fetch(`${base}/suivi`, { credentials: 'include' });
      const j = await res.json().catch(() => ({}));
      if (res.ok) setSuivi(j.suivi || null);
    } catch { /* sans importance */ }
  }, [base]);

  const verifier = async () => {
    setOccupe(true); setErreur(''); setInfo('');
    try {
      const res = await fetch(`${base}/verifier`, { method: 'POST', credentials: 'include' });
      const j = await res.json().catch(() => ({}));
      if (res.ok) { setInfo('Vérification demandée : le résultat apparaît dans quelques minutes.'); setTimeout(chargerSuivi, 30000); } else setErreur(j.error || 'Action impossible');
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };

  // Suivi de l'import : on relit toutes les 4 secondes tant qu'il n'est pas fini
  const enCours = !!travail && ['en_attente', 'en_cours', 'pause'].includes(travail.statut);
  useEffect(() => {
    if (!etat?.connexion) return;
    chargerImport(); chargerSuivi();
  }, [etat?.connexion?.statut, chargerImport, chargerSuivi]);
  useEffect(() => {
    if (!enCours) return;
    const t = setInterval(chargerImport, 4000);
    return () => clearInterval(t);
  }, [enCours, chargerImport]);

  const importer = async () => {
    setOccupe(true); setErreur(''); setInfo('');
    try {
      const res = await fetch(`${base}/importer`, { method: 'POST', credentials: 'include' });
      const j = await res.json().catch(() => ({}));
      if (res.ok) await chargerImport(); else setErreur(j.error || 'Import impossible');
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };

  useEffect(() => {
    charger();
    // Retour d'eBay : message selon le résultat, puis on nettoie l'adresse
    try {
      const p = new URLSearchParams(window.location.search);
      const r = p.get('ebay');
      if (r) {
        if (r === 'ok') setInfo('Votre compte eBay est connecté.');
        else if (r === 'refuse') setErreur("Vous avez refusé l'accès sur eBay : rien n'a été connecté.");
        else setErreur('La connexion à eBay a échoué. Réessayez.');
        p.delete('ebay');
        const q = p.toString();
        window.history.replaceState({}, '', window.location.pathname + (q ? `?${q}` : ''));
      }
    } catch { /* sans importance */ }
  }, [charger]);

  const connecter = async () => {
    setOccupe(true); setErreur(''); setInfo('');
    try {
      const res = await fetch(`${base}/connecter`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ retour: window.location.href }) });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.url) { window.location.href = j.url; return; }
      setErreur(j.error || j.message || 'Connexion impossible');
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };

  const deconnecter = async () => {
    if (!window.confirm('Déconnecter votre compte eBay ? Vos annonces déjà importées restent dans votre boutique.')) return;
    setOccupe(true); setErreur(''); setInfo('');
    try {
      const res = await fetch(base, { method: 'DELETE', credentials: 'include' });
      if (res.ok) { setInfo('Compte eBay déconnecté.'); await charger(); } else { const j = await res.json().catch(() => ({})); setErreur(j.error || 'Action impossible'); }
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };

  const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 16 : 24, marginBottom: 16 };
  const bouton = (couleur: string): React.CSSProperties => ({ background: couleur, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 22px', fontSize: 15, fontWeight: 600, cursor: occupe ? 'wait' : 'pointer', opacity: occupe ? 0.7 : 1 });

  const c = etat?.connexion;
  return (
    <div style={{ maxWidth: 720, color: T.text }}>
      <h2 style={{ margin: '0 0 6px', fontSize: isMobile ? 20 : 24 }}>🏷️ Connecteur eBay</h2>
      <p style={{ margin: '0 0 20px', color: T.light, fontSize: 14 }}>Reliez votre compte vendeur eBay à votre boutique. Vous autorisez l'accès directement sur eBay : nous ne voyons jamais votre mot de passe.</p>

      {erreur && <div style={{ ...carte, borderColor: T.danger, color: T.danger, padding: 14 }}>{erreur}</div>}
      {info && <div style={{ ...carte, borderColor: T.ok, color: T.ok, padding: 14 }}>{info}</div>}

      {!etat ? (
        !erreur && <div style={{ color: T.light }}>Chargement…</div>
      ) : !etat.gestionnaire_configure ? (
        <div style={carte}>
          <strong>Pas encore disponible</strong>
          <p style={{ color: T.light, fontSize: 14, margin: '8px 0 0' }}>Le gestionnaire de la marketplace n'a pas encore terminé la configuration eBay. Revenez un peu plus tard ou contactez-le.</p>
        </div>
      ) : c && c.statut === 'connecte' ? (
        <div style={carte}>
          <div style={{ color: T.ok, fontWeight: 700, marginBottom: 6 }}>✅ Compte eBay connecté</div>
          <div style={{ fontSize: 14, color: T.light, marginBottom: 16 }}>
            {c.username ? <>Compte : <strong style={{ color: T.text }}>{c.username}</strong><br /></> : null}
            {c.env === 'sandbox' ? 'Environnement de test eBay' : 'Connecté depuis le ' + new Date(c.connecte_le).toLocaleDateString('fr-CA')}
          </div>
          <button style={bouton('#6b7280')} disabled={occupe} onClick={deconnecter}>Déconnecter</button>
        </div>
      ) : c ? (
        <div style={carte}>
          <div style={{ color: T.danger, fontWeight: 700, marginBottom: 6 }}>⚠️ Reconnexion nécessaire</div>
          <p style={{ fontSize: 14, color: T.light, margin: '0 0 16px' }}>{c.message || "L'autorisation eBay n'est plus valide."}</p>
          <button style={bouton(accent)} disabled={occupe} onClick={connecter}>Reconnecter mon eBay</button>{' '}
          <button style={bouton('#6b7280')} disabled={occupe} onClick={deconnecter}>Retirer</button>
        </div>
      ) : (
        <div style={carte}>
          <p style={{ fontSize: 14, color: T.light, margin: '0 0 16px' }}>Vous serez redirigé vers eBay pour autoriser l'accès, puis ramené ici automatiquement.</p>
          <button style={bouton(accent)} disabled={occupe} onClick={connecter}>Connecter mon eBay</button>
        </div>
      )}

      {etat?.connexion?.statut === 'connecte' && (
        <div style={carte}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>📥 Importer mes annonces eBay</div>
          <p style={{ fontSize: 14, color: T.light, margin: '0 0 14px' }}>Vos annonces actives sont copiées dans votre boutique (titre, description, prix, stock, photos, catégorie). Rien n'est modifié sur eBay. Les annonces déjà importées sont sautées.</p>
          {enCours && travail && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ height: 10, background: '#eef0f3', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${travail.total ? Math.min(100, Math.round((travail.traites / travail.total) * 100)) : 4}%`, height: '100%', background: accent, transition: 'width .4s' }} />
              </div>
              <div style={{ fontSize: 13, color: T.light, marginTop: 6 }}>
                {travail.statut === 'pause' ? (travail.message || 'En pause') : `${travail.traites} / ${travail.total || '…'} annonces traitées`}
                {travail.statut === 'pause' && travail.reprise_a ? ` — reprise vers ${new Date(travail.reprise_a).toLocaleString('fr-CA')}` : ''}
              </div>
              <div style={{ fontSize: 12, color: T.light, marginTop: 4 }}>Vous pouvez quitter cette page : l'import continue seul.</div>
            </div>
          )}
          {!enCours && travail && travail.statut === 'termine' && (
            <div style={{ fontSize: 14, color: T.ok, marginBottom: 14 }}>
              ✅ Terminé : {travail.importes} annonce(s) importée(s){travail.ignores ? `, ${travail.ignores} déjà présente(s)` : ''}{travail.erreurs ? `, ${travail.erreurs} en erreur` : ''}.
              {travail.message && <div style={{ color: T.light, marginTop: 4 }}>{travail.message}</div>}
            </div>
          )}
          {!enCours && travail && travail.statut === 'erreur' && (
            <div style={{ fontSize: 14, color: T.danger, marginBottom: 14 }}>{travail.message || "L'import a échoué."}</div>
          )}
          <button style={bouton(accent)} disabled={occupe || enCours} onClick={importer}>{enCours ? 'Import en cours…' : travail ? 'Importer de nouveau' : 'Importer mes annonces'}</button>
        </div>
      )}

      {etat?.connexion?.statut === 'connecte' && suivi && suivi.dernier_suivi && (
        <div style={carte}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>🔄 Synchronisation avec eBay</div>
          <p style={{ fontSize: 14, color: T.light, margin: '0 0 10px' }}>Le stock de vos annonces importées est mis à jour automatiquement (environ toutes les heures). Les prix et les descriptions ne sont jamais modifiés.</p>
          <div style={{ fontSize: 13, color: T.light, marginBottom: 12 }}>
            Dernière vérification : {new Date(suivi.dernier_suivi).toLocaleString('fr-CA')}
            {suivi.dernier_resume && suivi.dernier_changement_le ? <><br />Dernier changement ({new Date(suivi.dernier_changement_le).toLocaleString('fr-CA')}) : {suivi.dernier_resume}</> : null}
            {suivi.suivi_erreur ? <><br /><span style={{ color: T.danger }}>Problème : {suivi.suivi_erreur}</span></> : null}
          </div>
          {suivi.nouvelles > 0 && (
            <div style={{ fontSize: 14, marginBottom: 12 }}>🆕 <strong>{suivi.nouvelles}</strong> nouvelle{suivi.nouvelles > 1 ? 's' : ''} annonce{suivi.nouvelles > 1 ? 's' : ''} sur eBay pas encore dans votre boutique. Cliquez sur « Importer de nouveau » ci-dessus pour les ajouter.</div>
          )}
          <button style={bouton('#6b7280')} disabled={occupe || enCours} onClick={verifier}>Vérifier maintenant</button>
        </div>
      )}
    </div>
  );
}