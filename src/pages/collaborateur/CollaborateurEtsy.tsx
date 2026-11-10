// CHEMIN : src/pages/collaborateur/CollaborateurEtsy.tsx
// e-Vend Studio — Dashboard collaborateur : connexion de SA boutique Etsy (add-on « Connecteur Etsy »).
// Le collaborateur clique « Connecter mon Etsy », autorise l'accès sur Etsy, puis revient ici (?etsy=ok|refuse|erreur).
// API : GET /api/collab/:gid/etsy · POST /etsy/connecter · DELETE /etsy · POST /etsy/importer · GET /etsy/import

import React, { useState, useEffect, useCallback } from 'react';

interface Props { gestionnaireId: number; accent: string; isMobile: boolean }
interface Travail { id: number; statut: 'en_attente' | 'en_cours' | 'pause' | 'termine' | 'erreur' | 'annule'; total: number; traites: number; importes: number; ignores: number; erreurs: number; message: string | null; reprise_a: string | null }
interface Etat {
  gestionnaire_configure: boolean;
  connexion: { statut: 'connecte' | 'reconnexion'; boutique: string | null; message: string | null; connecte_le: string } | null;
}

const URL_GUIDE = 'https://e-vendstudio.ca/documents/mv-connecteur-etsy-add-on';
const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626', ok: '#1E8449' };

export default function CollaborateurEtsy({ gestionnaireId, accent, isMobile }: Props) {
  const base = `/api/collab/${gestionnaireId}/etsy`;
  const [etat, setEtat] = useState<Etat | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');
  const [travail, setTravail] = useState<Travail | null>(null);
  const [confirmer, setConfirmer] = useState(false);

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

  const enCours = !!travail && ['en_attente', 'en_cours', 'pause'].includes(travail.statut);
  useEffect(() => { if (etat?.connexion) chargerImport(); }, [etat?.connexion?.statut, chargerImport]);
  useEffect(() => {
    if (!enCours) return;
    const t = setInterval(chargerImport, 4000);
    return () => clearInterval(t);
  }, [enCours, chargerImport]);

  useEffect(() => {
    charger();
    try {
      const p = new URLSearchParams(window.location.search);
      const r = p.get('etsy');
      if (r) {
        if (r === 'ok') setInfo('Votre boutique Etsy est connectée.');
        else if (r === 'refuse') setErreur("Vous avez refusé l'accès sur Etsy : rien n'a été connecté.");
        else setErreur('La connexion à Etsy a échoué. Réessayez.');
        p.delete('etsy');
        const q = p.toString();
        window.history.replaceState({}, '', window.location.pathname + (q ? `?${q}` : ''));
      }
    } catch { /* sans importance */ }
  }, [charger]);

  const importer = async () => {
    setOccupe(true); setErreur(''); setInfo('');
    try {
      const res = await fetch(`${base}/importer`, { method: 'POST', credentials: 'include' });
      const j = await res.json().catch(() => ({}));
      if (res.ok) await chargerImport(); else setErreur(j.error || 'Import impossible');
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };
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
    setConfirmer(false); setOccupe(true); setErreur(''); setInfo('');
    try {
      const res = await fetch(base, { method: 'DELETE', credentials: 'include' });
      if (res.ok) { setInfo('Boutique Etsy déconnectée.'); setTravail(null); await charger(); } else { const j = await res.json().catch(() => ({})); setErreur(j.error || 'Action impossible'); }
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };

  const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 16 : 24, marginBottom: 16 };
  const bouton = (couleur: string): React.CSSProperties => ({ background: couleur, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 22px', fontSize: 15, fontWeight: 600, cursor: occupe ? 'wait' : 'pointer', opacity: occupe ? 0.7 : 1 });

  const c = etat?.connexion;
  return (
    <div style={{ maxWidth: 720, color: T.text }}>
      <h2 style={{ margin: '0 0 6px', fontSize: isMobile ? 20 : 24 }}>🧶 Connecteur Etsy <a href={URL_GUIDE} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: accent, textDecoration: 'none', border: `1px solid ${accent}`, borderRadius: 12, padding: '2px 10px', marginLeft: 10, verticalAlign: 'middle' }}>📖 Guide</a></h2>
      <p style={{ margin: '0 0 20px', color: T.light, fontSize: 14 }}>Reliez votre boutique Etsy à votre boutique ici. Vous autorisez l'accès directement sur Etsy (lecture seule) : nous ne voyons jamais votre mot de passe et rien n'est modifié sur Etsy.</p>

      {erreur && <div style={{ ...carte, borderColor: T.danger, color: T.danger, padding: 14 }}>{erreur}</div>}
      {info && <div style={{ ...carte, borderColor: T.ok, color: T.ok, padding: 14 }}>{info}</div>}

      {!etat ? (
        !erreur && <div style={{ color: T.light }}>Chargement…</div>
      ) : !etat.gestionnaire_configure ? (
        <div style={carte}>
          <strong>Pas encore disponible</strong>
          <p style={{ color: T.light, fontSize: 14, margin: '8px 0 0' }}>Le gestionnaire de la marketplace n'a pas encore terminé la configuration Etsy. Revenez un peu plus tard ou contactez-le.</p>
        </div>
      ) : c && c.statut === 'connecte' ? (
        <div style={carte}>
          <div style={{ color: T.ok, fontWeight: 700, marginBottom: 6 }}>✅ Boutique Etsy connectée</div>
          <div style={{ fontSize: 14, color: T.light, marginBottom: 16 }}>
            {c.boutique ? <>Boutique : <strong style={{ color: T.text }}>{c.boutique}</strong><br /></> : null}
            Connectée le {new Date(c.connecte_le).toLocaleDateString('fr-CA')}
          </div>
          <button style={bouton('#6b7280')} disabled={occupe} onClick={() => setConfirmer(true)}>Déconnecter</button>
        </div>
      ) : c ? (
        <div style={carte}>
          <div style={{ color: T.danger, fontWeight: 700, marginBottom: 6 }}>⚠️ Reconnexion nécessaire</div>
          <p style={{ fontSize: 14, color: T.light, margin: '0 0 16px' }}>{c.message || "L'autorisation Etsy n'est plus valide."}</p>
          <button style={bouton(accent)} disabled={occupe} onClick={connecter}>Reconnecter mon Etsy</button>{' '}
          <button style={bouton('#6b7280')} disabled={occupe} onClick={() => setConfirmer(true)}>Retirer</button>
        </div>
      ) : (
        <div style={carte}>
          <p style={{ fontSize: 14, color: T.light, margin: '0 0 16px' }}>Vous serez redirigé vers Etsy pour autoriser l'accès, puis ramené ici automatiquement. Il faut une boutique Etsy active.</p>
          <button style={bouton(accent)} disabled={occupe} onClick={connecter}>Connecter mon Etsy</button>
        </div>
      )}

      {c && c.statut === 'connecte' && (
        <div style={carte}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>📥 Importer mes annonces Etsy</div>
          <p style={{ fontSize: 14, color: T.light, margin: '0 0 14px' }}>Vos annonces actives sont copiées dans votre boutique (titre, description, prix, stock, photos). Elles arrivent dans la catégorie « Autre / Divers / Général » : à vous de les ranger ensuite. Rien n'est modifié sur Etsy. Les annonces déjà importées sont sautées.</p>
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
          {!enCours && travail && travail.statut === 'erreur' && <div style={{ fontSize: 14, color: T.danger, marginBottom: 14 }}>{travail.message || "L'import a échoué."}</div>}
          <button style={bouton(accent)} disabled={occupe || enCours} onClick={importer}>{enCours ? 'Import en cours…' : travail ? 'Importer de nouveau' : 'Importer mes annonces'}</button>
        </div>
      )}

      {confirmer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 26, maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 38 }}>🔌</div>
            <h3 style={{ margin: '8px 0', color: T.text }}>Déconnecter Etsy ?</h3>
            <p style={{ color: T.light, fontSize: 13, margin: '0 0 18px' }}>Vos annonces déjà importées restent dans votre boutique.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmer(false)} style={{ flex: 1, padding: 10, border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              <button onClick={deconnecter} style={{ flex: 1, padding: 10, border: 'none', background: T.danger, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Déconnecter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}