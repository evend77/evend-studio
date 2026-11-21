// CHEMIN : src/pages/gestionnaire/BoutiqueEtsy.tsx
// e-Vend Studio — Add-on « Connecteur Etsy » (boutique solo). Une seule page : clés Etsy « développeur », connexion de SA boutique Etsy,
// import de ses annonces actives. Rien n'est modifié sur Etsy (lecture seule). Tous les produits importés vont dans la catégorie « Divers / Autre ».
// API : /api/boutique/gestionnaire/etsy  (etat, config, tester, connecter, connexion, importer, import)

import React, { useState, useEffect, useCallback } from 'react';
import { bq, messageErreur } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', ok: '#16a34a', warn: '#b45309', danger: '#dc2626' };
interface Config { addon_actif: boolean; keystring_masque: string | null; secret_masque: string | null; configure: boolean; verifie_le: string | null; url_retour: string }
interface Connexion { statut: 'connecte' | 'reconnexion'; boutique: string | null; message: string | null; connecte_le: string }
interface Travail { id: number; statut: 'en_attente' | 'en_cours' | 'pause' | 'termine' | 'erreur' | 'annule'; total: number; traites: number; importes: number; ignores: number; erreurs: number; message: string | null; reprise_a: string | null }

const URL_GUIDE_DEFAUT = 'https://e-vendstudio.ca/documents/mv-connecteur-etsy-add-on';
const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 16 };
const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase', marginBottom: 6 };

function Copiable({ valeur, accent }: { valeur: string; accent: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <code style={{ flex: 1, minWidth: 200, background: '#f3f4f6', border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 12, wordBreak: 'break-all' }}>{valeur}</code>
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(valeur); setOk(true); setTimeout(() => setOk(false), 1500); } catch (e) { /* presse-papier indisponible */ } }}
        style={{ border: `1px solid ${accent}`, background: '#fff', color: accent, borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{ok ? '✓ Copié' : '📋 Copier'}</button>
    </div>
  );
}

export default function BoutiqueEtsy({ accent, isMobile, pagePlan, naviguerVers }: { gestionnaireId?: number; accent?: string; isMobile?: boolean; pagePlan?: string; naviguerVers?: (page: string) => void }) {
  const couleur = accent || '#2d6a9f';
  const [cfg, setCfg] = useState<Config | null>(null);
  const [cx, setCx] = useState<Connexion | null>(null);
  const [travail, setTravail] = useState<Travail | null>(null);
  const [guide, setGuide] = useState(URL_GUIDE_DEFAUT);
  const [keystring, setKeystring] = useState(''); const [secret, setSecret] = useState('');
  const [occupe, setOccupe] = useState('');
  const [modale, setModale] = useState<{ type: 'erreur' | 'succes' | 'confirmer'; message: string; titre?: string; action?: () => void; texte?: string } | null>(null);

  const charger = useCallback(async () => {
    const r = await bq('/etsy/etat');
    if (!r.ok) { setModale({ type: 'erreur', message: messageErreur(r) }); return; }
    setCfg(r.data.config); setCx(r.data.connexion); setTravail(r.data.import);
  }, []);

  useEffect(() => {
    charger();
    bq('/addons').then(a => { if (a.ok && a.data && Array.isArray(a.data.addons)) { const g = a.data.addons.find((y: any) => y.code === 'connecteur_etsy'); if (g && g.guide_url) setGuide(g.guide_url); } });
    // Retour d'Etsy (?etsy=ok|refuse|erreur) : message, puis on nettoie l'adresse
    try {
      const p = new URLSearchParams(window.location.search); const e = p.get('etsy');
      if (e) {
        if (e === 'ok') setModale({ type: 'succes', message: 'Votre boutique Etsy est connectée. Vous pouvez maintenant importer vos annonces.' });
        else if (e === 'refuse') setModale({ type: 'erreur', message: "Vous avez refusé l'accès sur Etsy : rien n'a été connecté." });
        else setModale({ type: 'erreur', message: 'La connexion à Etsy a échoué. Réessayez.' });
        p.delete('etsy'); const q = p.toString();
        window.history.replaceState({}, '', window.location.pathname + (q ? `?${q}` : ''));
      }
    } catch (e) { /* sans importance */ }
  }, [charger]);

  const enCours = !!travail && ['en_attente', 'en_cours', 'pause'].includes(travail.statut);
  useEffect(() => {
    if (!enCours) return;
    const t = setInterval(async () => {
      const r = await bq('/etsy/import');
      if (r.ok) {
        setTravail(r.data.import);
        if (r.data.import && !['en_attente', 'en_cours', 'pause'].includes(r.data.import.statut)) { charger(); }
      }
    }, 4000);
    return () => clearInterval(t);
  }, [enCours, charger]);

  const appel = async (cle: string, chemin: string, options: { method?: string; body?: any } = {}, succes?: string) => {
    setOccupe(cle);
    const r = await bq(chemin, options);
    setOccupe('');
    if (!r.ok) { setModale({ type: 'erreur', message: messageErreur(r) }); return null; }
    if (succes) setModale({ type: 'succes', message: succes });
    return r;
  };

  const enregistrer = async () => {
    if (!keystring.trim() && !secret.trim()) { setModale({ type: 'erreur', message: 'Rien à enregistrer : collez le Keystring et/ou le Shared secret.' }); return; }
    const r = await appel('save', '/etsy/config', { method: 'POST', body: { keystring, secret } }, 'Clés enregistrées. Cliquez sur « Tester » pour les vérifier.');
    if (r) { setKeystring(''); setSecret(''); await charger(); }
  };
  const tester = async () => { const r = await appel('test', '/etsy/tester', { method: 'POST' }); if (r) { setModale({ type: 'succes', message: r.data.message || 'Clés valides.' }); await charger(); } };
  const effacer = async () => { const r = await appel('del', '/etsy/config', { method: 'DELETE' }, 'Clés effacées.'); if (r) await charger(); };
  const connecter = async () => {
    const r = await appel('connect', '/etsy/connecter', { method: 'POST', body: { retour: window.location.href } });
    if (r && r.data.url) window.location.href = r.data.url;
  };
  const deconnecter = async () => { const r = await appel('deco', '/etsy/connexion', { method: 'DELETE' }, 'Boutique Etsy déconnectée. Vos annonces déjà importées restent dans votre boutique.'); if (r) await charger(); };
  const importer = async () => { const r = await appel('import', '/etsy/importer', { method: 'POST' }); if (r) { const i = await bq('/etsy/import'); if (i.ok) setTravail(i.data.import); } };

  if (!cfg) return <div style={{ padding: 24, color: T.light }}>Chargement…</div>;
  const btn = (fort?: boolean, rouge?: boolean): React.CSSProperties => ({ border: fort ? 'none' : `1px solid ${rouge ? '#fca5a5' : T.border}`, background: fort ? couleur : '#fff', color: fort ? '#fff' : rouge ? '#b91c1c' : '#374151', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: occupe ? 'wait' : 'pointer', opacity: occupe ? 0.7 : 1 });
  const pastille = (texte: string, bg: string, fg: string) => <span style={{ background: bg, color: fg, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{texte}</span>;
  const etiquette = (m: string | null) => (m ? `Enregistré : ${m}` : 'Non enregistré');

  const entete = (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ margin: '0 0 6px', fontSize: isMobile ? 20 : 24 }}>🧶 Connecteur Etsy <a href={guide} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: couleur, textDecoration: 'none', border: `1px solid ${couleur}`, borderRadius: 12, padding: '2px 10px', marginLeft: 10, verticalAlign: 'middle' }}>📖 Guide</a></h2>
      <p style={{ margin: 0, fontSize: 14, color: T.light, lineHeight: 1.6 }}>Importez vos annonces Etsy dans votre boutique. Vous utilisez votre <strong>propre app Etsy</strong> : la limite d'appels Etsy est donc à vous. <strong>Rien n'est jamais modifié sur Etsy</strong> (lecture seule). L'import copie vos annonces une fois : le stock n'est pas synchronisé ensuite.</p>
    </div>
  );

  if (!cfg.addon_actif) {
    return (
      <div style={{ maxWidth: 820, color: T.text }}>
        {entete}
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: 10, padding: '12px 14px', fontSize: 13 }}>
          🔒 L'add-on <strong>Connecteur Etsy</strong> n'est pas activé : activez-le dans <strong>Mon plan &amp; limites</strong>.
          {pagePlan && naviguerVers && <button type="button" onClick={() => naviguerVers(pagePlan)} style={{ marginLeft: 10, border: '1px solid #fdba74', background: '#fff', color: '#9a3412', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Voir « Mon plan &amp; limites »</button>}
        </div>
      </div>
    );
  }

  const bloque = !!travail && travail.statut === 'erreur' && /Import bloqué/.test(travail.message || '');
  return (
    <div style={{ maxWidth: 820, color: T.text }}>
      {entete}

      {/* 1. Clés */}
      <div style={carte}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 15 }}>1. Vos clés Etsy</strong>
          {cfg.verifie_le ? pastille(`✓ Vérifiées le ${new Date(cfg.verifie_le).toLocaleDateString('fr-CA')}`, '#dcfce7', '#166534')
            : cfg.configure ? pastille('À tester', '#fef3c7', '#92400e') : pastille('Non configurées', '#f3f4f6', T.light)}
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div><label style={lbl}>Keystring (ID de l'app)</label><input value={keystring} onChange={e => setKeystring(e.target.value)} placeholder={etiquette(cfg.keystring_masque)} autoComplete="off" style={champ} /></div>
          <div><label style={lbl}>Shared secret</label><input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder={etiquette(cfg.secret_masque)} autoComplete="new-password" style={champ} /></div>
        </div>
        <p style={{ fontSize: 11, color: T.light, margin: '10px 0 0' }}>Laissez un champ vide pour garder la valeur déjà enregistrée. Vos clés sont chiffrées et ne sont jamais réaffichées en entier. Changer une clé oblige à reconnecter la boutique Etsy.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <button type="button" disabled={!!occupe} onClick={enregistrer} style={btn(true)}>{occupe === 'save' ? '⏳ Enregistrement…' : '💾 Enregistrer'}</button>
          <button type="button" disabled={!!occupe || !cfg.configure} onClick={tester} style={{ ...btn(), opacity: cfg.configure ? 1 : 0.5 }}>{occupe === 'test' ? '⏳ Test…' : '🔌 Tester'}</button>
          {(cfg.configure || cfg.keystring_masque || cfg.secret_masque) && <button type="button" disabled={!!occupe} onClick={() => setModale({ type: 'confirmer', titre: 'Effacer vos clés Etsy ?', message: "Vos clés seront supprimées et votre boutique Etsy devra être reconnectée avec de nouvelles clés. Vos annonces déjà importées restent dans votre boutique.", texte: 'Effacer', action: effacer })} style={{ ...btn(false, true), marginLeft: isMobile ? 0 : 'auto' }}>🗑️ Effacer mes clés</button>}
        </div>

        <details style={{ marginTop: 16 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Où trouver ces clés ?</summary>
          <ol style={{ margin: '10px 0 0', paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
            <li>Connectez-vous à <a href="https://www.etsy.com/developers/your-apps" target="_blank" rel="noopener noreferrer" style={{ color: couleur }}>etsy.com/developers/your-apps</a> avec votre compte Etsy.</li>
            <li>Cliquez « Create a New App » et remplissez le formulaire. Pour l'adresse de redirection (« Callback URL »), collez l'adresse ci-dessous.</li>
            <li>Etsy doit <strong>approuver</strong> votre app (accès « commercial ») avant qu'elle fonctionne : cela peut prendre quelques jours.</li>
            <li>Copiez ici le <strong>Keystring</strong> et le <strong>Shared secret</strong> de l'app, puis cliquez « Enregistrer » et « Tester ».</li>
          </ol>
          <div style={{ marginTop: 14 }}><label style={lbl}>Adresse de redirection (Callback URL) à donner à Etsy</label><Copiable valeur={cfg.url_retour} accent={couleur} /></div>
        </details>
      </div>

      {/* 2. Compte */}
      <div style={carte}>
        <strong style={{ fontSize: 15 }}>2. Votre boutique Etsy</strong>
        {!cfg.configure ? (
          <p style={{ fontSize: 14, color: T.light, margin: '10px 0 0' }}>Terminez d'abord l'étape 1 (Keystring et Shared secret).</p>
        ) : cx && cx.statut === 'connecte' ? (
          <div style={{ marginTop: 10 }}>
            <div style={{ color: T.ok, fontWeight: 700, marginBottom: 6 }}>✅ Boutique Etsy connectée</div>
            <div style={{ fontSize: 14, color: T.light, marginBottom: 14 }}>
              {cx.boutique ? <>Boutique : <strong style={{ color: T.text }}>{cx.boutique}</strong><br /></> : null}
              Connectée depuis le {new Date(cx.connecte_le).toLocaleDateString('fr-CA')}
            </div>
            <button type="button" disabled={!!occupe} style={btn()} onClick={() => setModale({ type: 'confirmer', titre: 'Déconnecter votre boutique Etsy ?', message: 'Vos annonces déjà importées restent dans votre boutique.', texte: 'Déconnecter', action: deconnecter })}>Déconnecter</button>
          </div>
        ) : cx ? (
          <div style={{ marginTop: 10 }}>
            <div style={{ color: T.danger, fontWeight: 700, marginBottom: 6 }}>⚠️ Reconnexion nécessaire</div>
            <p style={{ fontSize: 14, color: T.light, margin: '0 0 14px' }}>{cx.message || "L'autorisation Etsy n'est plus valide."}</p>
            <button type="button" disabled={!!occupe} style={btn(true)} onClick={connecter}>Reconnecter mon Etsy</button>
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            <p style={{ fontSize: 14, color: T.light, margin: '0 0 14px' }}>Vous serez redirigé vers Etsy pour autoriser l'accès (lecture seule), puis ramené ici automatiquement. Nous ne voyons jamais votre mot de passe.</p>
            <button type="button" disabled={!!occupe} style={btn(true)} onClick={connecter}>{occupe === 'connect' ? '⏳ Redirection…' : 'Connecter mon Etsy'}</button>
          </div>
        )}
      </div>

      {/* 3. Import */}
      {cx && cx.statut === 'connecte' && (
        <div style={carte}>
          <strong style={{ fontSize: 15 }}>3. Importer mes annonces Etsy</strong>
          <p style={{ fontSize: 14, color: T.light, margin: '8px 0 14px', lineHeight: 1.6 }}>Vos annonces actives sont copiées dans votre boutique (titre, description, prix, quantité, photos), toutes dans la catégorie <strong>« Divers / Autre »</strong> (créée si vous ne l'avez pas) : changez ensuite la catégorie de vos produits comme d'habitude. Les annonces déjà importées sont sautées. Les variations Etsy ne sont pas reprises (une annonce = un produit). Si votre palier ne permet pas de tout importer, <strong>rien n'est importé</strong> et un message vous l'explique.</p>
          {enCours && travail && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ height: 10, background: '#eef0f3', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${travail.total ? Math.min(100, Math.round((travail.traites / travail.total) * 100)) : 4}%`, height: '100%', background: couleur, transition: 'width .4s' }} />
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
            <div style={{ background: bloque ? '#fff7ed' : '#fef2f2', border: `1px solid ${bloque ? '#fed7aa' : '#fecaca'}`, color: bloque ? '#9a3412' : '#991b1b', borderRadius: 10, padding: '10px 14px', fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
              {bloque ? '⛔ ' : '⚠️ '}{travail.message || "L'import a échoué."}
              {bloque && pagePlan && naviguerVers && <div style={{ marginTop: 8 }}><button type="button" onClick={() => naviguerVers(pagePlan)} style={{ border: '1px solid #fdba74', background: '#fff', color: '#9a3412', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Voir « Mon plan &amp; limites »</button></div>}
            </div>
          )}
          <button type="button" style={btn(true)} disabled={!!occupe || enCours} onClick={importer}>{enCours ? 'Import en cours…' : travail ? 'Importer de nouveau' : 'Importer mes annonces'}</button>
        </div>
      )}

      {modale && (modale.type === 'confirmer'
        ? <BoutiqueModale type="confirmer" accent={couleur} titre={modale.titre} message={modale.message} texteConfirmer={modale.texte || 'Confirmer'} texteFermer="Annuler" enCours={!!occupe} onFermer={() => setModale(null)} onConfirmer={() => { const a = modale.action; setModale(null); if (a) a(); }} />
        : <BoutiqueModale type={modale.type} accent={couleur} message={modale.message} onFermer={() => setModale(null)} />)}
    </div>
  );
}