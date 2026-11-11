// CHEMIN : src/pages/collaborateur/CollaborateurEvend.tsx
// e-Vend Studio — Dashboard collaborateur : importer SES annonces e-Vend dans sa boutique Studio (lecture seule, rien n'est modifié sur e-Vend).
// Le collaborateur clique « Connecter mon e-Vend », s'identifie sur e-Vend (avec la F2A d'e-Vend), clique « Autoriser », puis revient ici (?evend=ok|refuse|erreur).
// API : GET /api/collab/:gid/evend · POST /evend/connecter · POST /evend/importer · GET /evend/import · DELETE /evend · GET /categories

import React, { useState, useEffect, useCallback } from 'react';

interface Props { gestionnaireId: number; accent: string; isMobile: boolean }
interface Travail { id: number; statut: 'en_attente' | 'en_cours' | 'pause' | 'termine' | 'erreur' | 'annule'; total: number; traites: number; importes: number; ignores: number; erreurs: number; message: string | null; reprise_a: string | null }
interface Etat {
  configure: boolean;
  connexion: { vendeur: string | null; importables: number; numeriques: number; autres: number; expire_le: string; connecte_le: string } | null;
}
interface Categorie { id: number; nom: string }
interface Methode { transporteur_id: number; nom: string; logo: string; libelle_prix: string; nb_annonces: number; deja: boolean }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626', ok: '#1E8449' };

export default function CollaborateurEvend({ gestionnaireId, accent, isMobile }: Props) {
  const base = `/api/collab/${gestionnaireId}/evend`;
  const [etat, setEtat] = useState<Etat | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');
  const [travail, setTravail] = useState<Travail | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [categorieId, setCategorieId] = useState('');
  const [methodes, setMethodes] = useState<Methode[]>([]);
  const [cochees, setCochees] = useState<number[]>([]);

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
  useEffect(() => { chargerImport(); }, [chargerImport]);
  useEffect(() => {
    if (!enCours) return;
    const t = setInterval(chargerImport, 4000);
    return () => clearInterval(t);
  }, [enCours, chargerImport]);
  // À la fin d'un import, la connexion est fermée : on recharge l'état
  useEffect(() => { if (travail && !enCours) charger(); }, [travail?.statut]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch(`/api/collab/${gestionnaireId}/categories`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((l) => { if (Array.isArray(l)) setCategories(l); })
      .catch(() => { /* le choix reste « automatique » */ });
  }, [gestionnaireId]);

  // Méthodes d'expédition du compte e-Vend (une fois connecté) : toutes cochées au départ
  const connecte = !!etat?.connexion;
  useEffect(() => {
    if (!connecte) { setMethodes([]); return; }
    fetch(`${base}/expedition`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { methodes: [] }))
      .then((j) => { const l: Methode[] = Array.isArray(j.methodes) ? j.methodes : []; setMethodes(l); setCochees(l.map((m) => m.transporteur_id)); })
      .catch(() => { /* l'import se fait sans méthodes */ });
  }, [connecte, base]);

  useEffect(() => {
    charger();
    try {
      const p = new URLSearchParams(window.location.search);
      const r = p.get('evend');
      if (r) {
        if (r === 'ok') setInfo('Votre compte e-Vend est connecté.');
        else if (r === 'refuse') setErreur("Vous avez refusé l'accès sur e-Vend : rien n'a été connecté.");
        else setErreur('La connexion à e-Vend a échoué. Réessayez.');
        p.delete('evend');
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
  const importer = async () => {
    setOccupe(true); setErreur(''); setInfo('');
    try {
      const res = await fetch(`${base}/importer`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categorie_defaut_id: categorieId ? Number(categorieId) : null, methodes: cochees }) });
      const j = await res.json().catch(() => ({}));
      if (res.ok) await chargerImport(); else setErreur(j.error || 'Import impossible');
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };
  const deconnecter = async () => {
    setConfirmer(false); setOccupe(true); setErreur(''); setInfo('');
    try {
      const res = await fetch(base, { method: 'DELETE', credentials: 'include' });
      if (res.ok) { setInfo('Accès à e-Vend fermé.'); await charger(); } else { const j = await res.json().catch(() => ({})); setErreur(j.error || 'Action impossible'); }
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };

  const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 16 : 24, marginBottom: 16 };
  const bouton = (couleur: string): React.CSSProperties => ({ background: couleur, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 22px', fontSize: 15, fontWeight: 600, cursor: occupe ? 'wait' : 'pointer', opacity: occupe ? 0.7 : 1 });

  const c = etat?.connexion;
  return (
    <div style={{ maxWidth: 720, color: T.text }}>
      <h2 style={{ margin: '0 0 6px', fontSize: isMobile ? 20 : 24 }}>🛒 Importer mes annonces e-Vend</h2>
      <p style={{ margin: '0 0 20px', color: T.light, fontSize: 14 }}>Copiez vos annonces e-Vend dans votre boutique Studio. Vous vous identifiez directement sur e-Vend : nous ne voyons jamais votre mot de passe, l'accès est en lecture seule et rien n'est modifié sur e-Vend.</p>

      {erreur && <div style={{ ...carte, borderColor: T.danger, color: T.danger, padding: 14 }}>{erreur}</div>}
      {info && <div style={{ ...carte, borderColor: T.ok, color: T.ok, padding: 14 }}>{info}</div>}

      {!etat ? (
        !erreur && <div style={{ color: T.light }}>Chargement…</div>
      ) : !etat.configure ? (
        <div style={carte}>
          <strong>Pas encore disponible</strong>
          <p style={{ color: T.light, fontSize: 14, margin: '8px 0 0' }}>L'import depuis e-Vend n'est pas encore activé. Revenez un peu plus tard.</p>
        </div>
      ) : !c ? (
        <div style={carte}>
          {!enCours && <p style={{ fontSize: 14, color: T.light, margin: '0 0 16px' }}>Vous serez redirigé vers e-Vend pour vous identifier et autoriser l'accès, puis ramené ici automatiquement. Le nombre d'annonces trouvées s'affichera avant l'import.</p>}
          {!enCours && <button style={bouton(accent)} disabled={occupe} onClick={connecter}>Connecter mon e-Vend</button>}
        </div>
      ) : (
        <div style={carte}>
          <div style={{ color: T.ok, fontWeight: 700, marginBottom: 6 }}>✅ Compte e-Vend connecté{c.vendeur ? ` : ${c.vendeur}` : ''}</div>
          <div style={{ fontSize: 22, fontWeight: 800, margin: '6px 0' }}>{c.importables} annonce{c.importables > 1 ? 's' : ''} trouvée{c.importables > 1 ? 's' : ''}</div>
          {(c.numeriques > 0 || c.autres > 0) && (
            <div style={{ fontSize: 13, color: T.light, marginBottom: 10 }}>
              {c.numeriques > 0 ? `${c.numeriques} annonce(s) numérique(s) ne seront pas reprises. ` : ''}
              {c.autres > 0 ? `${c.autres} annonce(s) autre(s) qu'à prix fixe ne seront pas reprises.` : ''}
            </div>
          )}
          {categories.length > 0 && (
            <div style={{ margin: '12px 0 14px' }}>
              <label style={{ display: 'block', fontSize: 13, color: T.light, marginBottom: 4 }}>Catégorie quand le nom ne correspond à aucune des vôtres</label>
              <select value={categorieId} onChange={(e) => setCategorieId(e.target.value)} disabled={enCours}
                style={{ width: '100%', maxWidth: 360, padding: '9px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, background: '#fff' }}>
                <option value="">Autre / Divers / Général (automatique)</option>
                {categories.map((k) => <option key={k.id} value={k.id}>{k.nom}</option>)}
              </select>
              <div style={{ fontSize: 12, color: T.light, marginTop: 4 }}>Si le nom d'une catégorie e-Vend est identique à l'une des vôtres, l'annonce y est rangée automatiquement.</div>
            </div>
          )}

          {methodes.length > 0 && (
            <div style={{ margin: '12px 0 14px' }}>
              <div style={{ fontSize: 13, color: T.light, marginBottom: 6 }}>Méthodes d'expédition à importer</div>
              {methodes.map((m) => (
                <label key={m.transporteur_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 14, cursor: enCours ? 'default' : 'pointer' }}>
                  <input type="checkbox" disabled={enCours} checked={cochees.indexOf(m.transporteur_id) >= 0}
                    onChange={(e) => setCochees(e.target.checked ? cochees.concat(m.transporteur_id) : cochees.filter((x) => x !== m.transporteur_id))} />
                  <span>{m.logo} <strong>{m.nom}</strong> — {m.libelle_prix}{m.nb_annonces ? ` · ${m.nb_annonces} annonce${m.nb_annonces > 1 ? 's' : ''}` : ''}{m.deja ? ' · déjà configurée (vos réglages sont gardés)' : ''}</span>
                </label>
              ))}
              <div style={{ fontSize: 12, color: T.light, marginTop: 4 }}>Les annonces qui n'utilisent aucune méthode cochée auront la livraison gratuite.</div>
            </div>
          )}

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
          {!enCours && travail && travail.statut === 'erreur' && <div style={{ fontSize: 14, color: T.danger, marginBottom: 14 }}>{travail.message || "L'import a échoué."}</div>}
          <button style={bouton(accent)} disabled={occupe || enCours || c.importables === 0} onClick={importer}>{enCours ? 'Import en cours…' : `Importer ${c.importables} annonce${c.importables > 1 ? 's' : ''}`}</button>{' '}
          <button style={bouton('#6b7280')} disabled={occupe || enCours} onClick={() => setConfirmer(true)}>Fermer l'accès</button>
        </div>
      )}

      {!enCours && travail && travail.statut === 'termine' && (
        <div style={carte}>
          <div style={{ fontSize: 14, color: T.ok }}>
            ✅ Terminé : {travail.importes} annonce(s) importée(s){travail.ignores ? `, ${travail.ignores} déjà présente(s)` : ''}{travail.erreurs ? `, ${travail.erreurs} en erreur` : ''}.
            {travail.message && <div style={{ color: T.light, marginTop: 4 }}>{travail.message}</div>}
          </div>
          <div style={{ fontSize: 12, color: T.light, marginTop: 8 }}>L'accès à e-Vend a été fermé automatiquement. Pour réimporter, reconnectez-vous.</div>
        </div>
      )}

      {confirmer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 26, maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 38 }}>🔌</div>
            <h3 style={{ margin: '8px 0', color: T.text }}>Fermer l'accès à e-Vend ?</h3>
            <p style={{ color: T.light, fontSize: 13, margin: '0 0 18px' }}>Vos annonces déjà importées restent dans votre boutique.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmer(false)} style={{ flex: 1, padding: 10, border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              <button onClick={deconnecter} style={{ flex: 1, padding: 10, border: 'none', background: T.danger, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}