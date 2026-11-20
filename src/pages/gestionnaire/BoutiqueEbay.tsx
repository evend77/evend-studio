// CHEMIN : src/pages/gestionnaire/BoutiqueEbay.tsx
// e-Vend Studio — Add-on « Connecteur eBay » (boutique solo). Une seule page : clés eBay « développeur », connexion de SON compte eBay,
// import des annonces, association des catégories eBay à SES catégories, suivi du stock. Rien n'est modifié sur eBay (lecture seule).
// API : /api/boutique/gestionnaire/ebay  (etat, config, tester, connecter, connexion, importer, import, suivi, verifier, categories)

import React, { useState, useEffect, useCallback } from 'react';
import { bq, messageErreur } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', ok: '#16a34a', warn: '#b45309', danger: '#dc2626' };
interface Config { addon_actif: boolean; env: 'production' | 'sandbox'; client_id_masque: string | null; dev_id_masque: string | null; client_secret_masque: string | null; runame: string; configure: boolean; verifie_le: string | null; url_acceptee: string; url_refusee: string }
interface Connexion { statut: 'connecte' | 'reconnexion'; username: string | null; env: string; message: string | null; connecte_le: string }
interface Travail { id: number; statut: 'en_attente' | 'en_cours' | 'pause' | 'termine' | 'erreur' | 'annule'; total: number; traites: number; importes: number; ignores: number; erreurs: number; message: string | null; reprise_a: string | null }
interface Suivi { dernier_suivi: string | null; prochain_suivi: string | null; dernier_resume: string | null; dernier_changement_le: string | null; suivi_erreur: string | null; nouvelles: number }
interface CatEbay { cle: string; ebay_nom: string; nb: number; categorie_id: number | null; suggestion_id: number | null }
interface MaCat { id: number; nom: string }

const URL_GUIDE_DEFAUT = 'https://e-vendstudio.ca/documents/mv-connecteur-ebay-add-on';
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

export default function BoutiqueEbay({ accent, isMobile, pagePlan, naviguerVers }: { gestionnaireId?: number; accent?: string; isMobile?: boolean; pagePlan?: string; naviguerVers?: (page: string) => void }) {
  const couleur = accent || '#2d6a9f';
  const [cfg, setCfg] = useState<Config | null>(null);
  const [cx, setCx] = useState<Connexion | null>(null);
  const [travail, setTravail] = useState<Travail | null>(null);
  const [suivi, setSuivi] = useState<Suivi | null>(null);
  const [cats, setCats] = useState<CatEbay[]>([]);
  const [mesCats, setMesCats] = useState<MaCat[]>([]);
  const [choix, setChoix] = useState<Record<string, string>>({});
  const [guide, setGuide] = useState(URL_GUIDE_DEFAUT);
  const [env, setEnv] = useState<'production' | 'sandbox'>('production');
  const [clientId, setClientId] = useState(''); const [devId, setDevId] = useState(''); const [secret, setSecret] = useState(''); const [runame, setRuname] = useState('');
  const [occupe, setOccupe] = useState('');
  const [modale, setModale] = useState<{ type: 'erreur' | 'succes' | 'confirmer'; message: string; titre?: string; action?: () => void; texte?: string } | null>(null);

  const chargerCats = useCallback(async () => {
    const r = await bq('/ebay/categories');
    if (r.ok) {
      setCats(r.data.categories_ebay || []); setMesCats(r.data.mes_categories || []);
      const c: Record<string, string> = {};
      (r.data.categories_ebay || []).forEach((x: CatEbay) => { c[x.cle] = x.categorie_id ? String(x.categorie_id) : ''; });
      setChoix(c);
    }
  }, []);

  const charger = useCallback(async () => {
    const r = await bq('/ebay/etat');
    if (!r.ok) { setModale({ type: 'erreur', message: messageErreur(r) }); return; }
    setCfg(r.data.config); setEnv(r.data.config.env); setRuname(r.data.config.runame || '');
    setCx(r.data.connexion); setTravail(r.data.import); setSuivi(r.data.suivi);
    if (r.data.config.addon_actif) chargerCats();
  }, [chargerCats]);

  useEffect(() => {
    charger();
    bq('/addons').then(a => { if (a.ok && a.data && Array.isArray(a.data.addons)) { const g = a.data.addons.find((y: any) => y.code === 'connecteur_ebay'); if (g && g.guide_url) setGuide(g.guide_url); } });
    // Retour d'eBay (?ebay=ok|refuse|erreur) : message, puis on nettoie l'adresse
    try {
      const p = new URLSearchParams(window.location.search); const e = p.get('ebay');
      if (e) {
        if (e === 'ok') setModale({ type: 'succes', message: 'Votre compte eBay est connecté. Vous pouvez maintenant importer vos annonces.' });
        else if (e === 'refuse') setModale({ type: 'erreur', message: "Vous avez refusé l'accès sur eBay : rien n'a été connecté." });
        else setModale({ type: 'erreur', message: 'La connexion à eBay a échoué. Réessayez.' });
        p.delete('ebay'); const q = p.toString();
        window.history.replaceState({}, '', window.location.pathname + (q ? `?${q}` : ''));
      }
    } catch (e) { /* sans importance */ }
  }, [charger]);

  const enCours = !!travail && ['en_attente', 'en_cours', 'pause'].includes(travail.statut);
  useEffect(() => {
    if (!enCours) return;
    const t = setInterval(async () => {
      const r = await bq('/ebay/import');
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
    if (!clientId.trim() && !devId.trim() && !secret.trim() && env === (cfg ? cfg.env : 'production') && runame.trim() === (cfg ? cfg.runame : '')) { setModale({ type: 'erreur', message: 'Rien à enregistrer : collez au moins une clé dans les champs.' }); return; }
    const r = await appel('save', '/ebay/config', { method: 'POST', body: { env, client_id: clientId, dev_id: devId, client_secret: secret, runame } }, 'Clés enregistrées. Cliquez sur « Tester » pour les vérifier.');
    if (r) { setClientId(''); setDevId(''); setSecret(''); await charger(); }
  };
  const tester = async () => { const r = await appel('test', '/ebay/tester', { method: 'POST' }); if (r) { setModale({ type: 'succes', message: r.data.message || 'Clés valides.' }); await charger(); } };
  const effacer = async () => { const r = await appel('del', '/ebay/config', { method: 'DELETE' }, 'Clés effacées.'); if (r) await charger(); };
  const connecter = async () => {
    const r = await appel('connect', '/ebay/connecter', { method: 'POST', body: { retour: window.location.href } });
    if (r && r.data.url) window.location.href = r.data.url;
  };
  const deconnecter = async () => { const r = await appel('deco', '/ebay/connexion', { method: 'DELETE' }, 'Compte eBay déconnecté. Vos annonces déjà importées restent dans votre boutique.'); if (r) await charger(); };
  const importer = async () => { const r = await appel('import', '/ebay/importer', { method: 'POST' }); if (r) { const i = await bq('/ebay/import'); if (i.ok) setTravail(i.data.import); } };
  const verifier = async () => { const r = await appel('verif', '/ebay/verifier', { method: 'POST' }, 'Vérification demandée : le résultat apparaît dans quelques minutes.'); if (r) setTimeout(charger, 30000); };
  const suggerer = () => { const c = { ...choix }; cats.forEach(x => { if (x.suggestion_id && !c[x.cle]) c[x.cle] = String(x.suggestion_id); }); setChoix(c); };
  const aChange = cats.some(x => (choix[x.cle] || '') !== (x.categorie_id ? String(x.categorie_id) : ''));
  const appliquer = async () => {
    const associations = cats.filter(x => (choix[x.cle] || '') !== (x.categorie_id ? String(x.categorie_id) : '')).map(x => ({ cle: x.cle, categorie_id: choix[x.cle] ? Number(choix[x.cle]) : null }));
    const r = await appel('cats', '/ebay/categories', { method: 'PUT', body: { associations } });
    if (r) { setModale({ type: 'succes', message: `Associations enregistrées. ${r.data.produits_mis_a_jour} annonce${r.data.produits_mis_a_jour > 1 ? 's' : ''} mise${r.data.produits_mis_a_jour > 1 ? 's' : ''} à jour.` }); await chargerCats(); }
  };

  if (!cfg) return <div style={{ padding: 24, color: T.light }}>Chargement…</div>;
  const btn = (fort?: boolean, rouge?: boolean): React.CSSProperties => ({ border: fort ? 'none' : `1px solid ${rouge ? '#fca5a5' : T.border}`, background: fort ? couleur : '#fff', color: fort ? '#fff' : rouge ? '#b91c1c' : '#374151', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: occupe ? 'wait' : 'pointer', opacity: occupe ? 0.7 : 1 });
  const pastille = (texte: string, bg: string, fg: string) => <span style={{ background: bg, color: fg, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{texte}</span>;
  const etiquette = (m: string | null) => (m ? `Enregistré : ${m}` : 'Non enregistré');

  const entete = (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ margin: '0 0 6px', fontSize: isMobile ? 20 : 24 }}>🏷️ Connecteur eBay <a href={guide} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: couleur, textDecoration: 'none', border: `1px solid ${couleur}`, borderRadius: 12, padding: '2px 10px', marginLeft: 10, verticalAlign: 'middle' }}>📖 Guide</a></h2>
      <p style={{ margin: 0, fontSize: 14, color: T.light, lineHeight: 1.6 }}>Importez vos annonces eBay dans votre boutique et gardez leur stock à jour. Vous utilisez vos <strong>propres clés eBay</strong> : la limite d'appels eBay est donc à vous. <strong>Rien n'est jamais modifié sur eBay</strong> (lecture seule), et vos prix ne sont jamais changés automatiquement.</p>
    </div>
  );

  if (!cfg.addon_actif) {
    return (
      <div style={{ maxWidth: 820, color: T.text }}>
        {entete}
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: 10, padding: '12px 14px', fontSize: 13 }}>
          🔒 L'add-on <strong>Connecteur eBay</strong> n'est pas activé : activez-le dans <strong>Mon plan &amp; limites</strong>.
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
          <strong style={{ fontSize: 15 }}>1. Vos clés eBay</strong>
          {cfg.verifie_le ? pastille(`✓ Vérifiées le ${new Date(cfg.verifie_le).toLocaleDateString('fr-CA')}`, '#dcfce7', '#166534')
            : cfg.configure ? pastille('À tester', '#fef3c7', '#92400e') : pastille('Non configurées', '#f3f4f6', T.light)}
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Environnement</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {([['production', 'Production'], ['sandbox', 'Test (sandbox)']] as const).map(([v, nom]) => (
              <button key={v} type="button" onClick={() => setEnv(v)} style={{ padding: '9px 16px', borderRadius: 8, border: `2px solid ${env === v ? couleur : T.border}`, background: env === v ? '#f0f5fb' : '#fff', color: env === v ? couleur : T.text, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{nom}</button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: T.light, margin: '6px 0 0' }}>Les clés de test et de production sont différentes chez eBay : ne les mélangez pas.</p>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div><label style={lbl}>ID client de l'application (App ID)</label><input value={clientId} onChange={e => setClientId(e.target.value)} placeholder={etiquette(cfg.client_id_masque)} autoComplete="off" style={champ} /></div>
          <div><label style={lbl}>ID développeur (Dev ID)</label><input value={devId} onChange={e => setDevId(e.target.value)} placeholder={etiquette(cfg.dev_id_masque)} autoComplete="off" style={champ} /></div>
          <div><label style={lbl}>Secret du client (Cert ID)</label><input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder={etiquette(cfg.client_secret_masque)} autoComplete="new-password" style={champ} /></div>
          <div><label style={lbl}>Nom de l'URL de redirection eBay (RuName)</label><input value={runame} onChange={e => setRuname(e.target.value)} autoComplete="off" style={champ} /></div>
        </div>
        <p style={{ fontSize: 11, color: T.light, margin: '10px 0 0' }}>Laissez un champ vide pour garder la valeur déjà enregistrée. Vos clés sont chiffrées et ne sont jamais réaffichées en entier. Changer une clé oblige à reconnecter le compte eBay.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <button type="button" disabled={!!occupe} onClick={enregistrer} style={btn(true)}>{occupe === 'save' ? '⏳ Enregistrement…' : '💾 Enregistrer'}</button>
          <button type="button" disabled={!!occupe || !cfg.client_id_masque || !cfg.client_secret_masque} onClick={tester} style={{ ...btn(), opacity: (!cfg.client_id_masque || !cfg.client_secret_masque) ? 0.5 : 1 }}>{occupe === 'test' ? '⏳ Test…' : '🔌 Tester'}</button>
          {(cfg.configure || cfg.client_id_masque) && <button type="button" disabled={!!occupe} onClick={() => setModale({ type: 'confirmer', titre: 'Effacer vos clés eBay ?', message: "Vos clés seront supprimées et votre compte eBay devra être reconnecté avec de nouvelles clés. Vos annonces déjà importées restent dans votre boutique.", texte: 'Effacer', action: effacer })} style={{ ...btn(false, true), marginLeft: isMobile ? 0 : 'auto' }}>🗑️ Effacer mes clés</button>}
        </div>
        <p style={{ fontSize: 11, color: T.light, margin: '10px 0 0' }}>Le test vérifie l'ID client et le secret auprès d'eBay. L'ID développeur et le RuName ne servent qu'à la connexion du compte : ils sont validés à la première connexion.</p>

        <details style={{ marginTop: 16 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Où trouver ces clés ?</summary>
          <ol style={{ margin: '10px 0 0', paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
            <li>Connectez-vous à <a href="https://developer.ebay.com" target="_blank" rel="noopener noreferrer" style={{ color: couleur }}>developer.ebay.com</a> avec votre compte eBay (créez un compte développeur si nécessaire).</li>
            <li>Dans « Application Keys », créez un jeu de clés pour l'environnement voulu : vous obtenez l'<strong>App ID</strong>, le <strong>Dev ID</strong> et le <strong>Cert ID</strong>.</li>
            <li>Pour la production, eBay demande de configurer la « suppression de compte Marketplace » (onglet « Alerts &amp; Notifications », choix « Marketplace Account Deletion »). N'activez <strong>pas</strong> « Exempted » : entrez votre courriel, l'adresse <strong>https://e-vendstudio.ca/api/ebay-connexion/suppression-compte</strong> et le jeton de vérification <strong>evend-studio-ebay-verification-2026-jeton-v1</strong>, puis cliquez « Save ».</li>
            <li>Dans « User Tokens », activez OAuth sur votre jeu de clés (« enable OAuth »), puis créez le RuName avec les deux adresses ci-dessous.</li>
            <li>Copiez ici l'App ID, le Dev ID, le Cert ID et le RuName, puis cliquez sur « Enregistrer » et « Tester ».</li>
          </ol>
          <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
            <div><label style={lbl}>URL d'authentification acceptée</label><Copiable valeur={cfg.url_acceptee} accent={couleur} /></div>
            <div><label style={lbl}>URL d'authentification refusée</label><Copiable valeur={cfg.url_refusee} accent={couleur} /></div>
          </div>
        </details>
      </div>

      {/* 2. Compte */}
      <div style={carte}>
        <strong style={{ fontSize: 15 }}>2. Votre compte eBay</strong>
        {!cfg.configure ? (
          <p style={{ fontSize: 14, color: T.light, margin: '10px 0 0' }}>Terminez d'abord l'étape 1 (ID client, ID développeur, secret et RuName).</p>
        ) : cx && cx.statut === 'connecte' ? (
          <div style={{ marginTop: 10 }}>
            <div style={{ color: T.ok, fontWeight: 700, marginBottom: 6 }}>✅ Compte eBay connecté</div>
            <div style={{ fontSize: 14, color: T.light, marginBottom: 14 }}>
              {cx.username ? <>Compte : <strong style={{ color: T.text }}>{cx.username}</strong><br /></> : null}
              {cx.env === 'sandbox' ? 'Environnement de test eBay' : `Connecté depuis le ${new Date(cx.connecte_le).toLocaleDateString('fr-CA')}`}
            </div>
            <button type="button" disabled={!!occupe} style={btn()} onClick={() => setModale({ type: 'confirmer', titre: 'Déconnecter votre compte eBay ?', message: 'Vos annonces déjà importées restent dans votre boutique, mais leur stock ne sera plus mis à jour.', texte: 'Déconnecter', action: deconnecter })}>Déconnecter</button>
          </div>
        ) : cx ? (
          <div style={{ marginTop: 10 }}>
            <div style={{ color: T.danger, fontWeight: 700, marginBottom: 6 }}>⚠️ Reconnexion nécessaire</div>
            <p style={{ fontSize: 14, color: T.light, margin: '0 0 14px' }}>{cx.message || "L'autorisation eBay n'est plus valide."}</p>
            <button type="button" disabled={!!occupe} style={btn(true)} onClick={connecter}>Reconnecter mon eBay</button>
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            <p style={{ fontSize: 14, color: T.light, margin: '0 0 14px' }}>Vous serez redirigé vers eBay pour autoriser l'accès, puis ramené ici automatiquement. Nous ne voyons jamais votre mot de passe.</p>
            <button type="button" disabled={!!occupe} style={btn(true)} onClick={connecter}>{occupe === 'connect' ? '⏳ Redirection…' : 'Connecter mon eBay'}</button>
          </div>
        )}
      </div>

      {/* 3. Import */}
      {cx && cx.statut === 'connecte' && (
        <div style={carte}>
          <strong style={{ fontSize: 15 }}>3. Importer mes annonces eBay</strong>
          <p style={{ fontSize: 14, color: T.light, margin: '8px 0 14px', lineHeight: 1.6 }}>Vos annonces actives sont copiées dans votre boutique (titre, description, prix, stock, photos). Les annonces déjà importées sont sautées. Si votre palier ne permet pas de tout importer, <strong>rien n'est importé</strong> et un message vous l'explique.</p>
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

      {/* 4. Catégories */}
      {cats.length > 0 && (
        <div style={carte}>
          <strong style={{ fontSize: 15 }}>4. Associer les catégories eBay à vos catégories</strong>
          <p style={{ fontSize: 14, color: T.light, margin: '8px 0 14px', lineHeight: 1.6 }}>Aucune catégorie n'est créée automatiquement. Choisissez, pour chaque catégorie eBay, l'une de <strong>vos</strong> catégories : vos annonces importées la reçoivent, et les prochains imports aussi. Une annonce dont vous avez changé vous-même la catégorie n'est jamais modifiée.</p>
          {mesCats.length === 0 && <div style={{ fontSize: 13, color: T.warn, marginBottom: 12 }}>Vous n'avez encore aucune catégorie : créez-en dans la section Catégories de votre boutique, puis revenez ici.</div>}
          <div style={{ display: 'grid', gap: 10 }}>
            {cats.map(x => (
              <div key={x.cle} style={{ display: 'flex', gap: 10, alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', padding: '10px 0', borderTop: `1px solid ${T.border}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, wordBreak: 'break-word' }}>{x.ebay_nom}</div>
                  <div style={{ fontSize: 12, color: T.light }}>{x.nb} annonce{x.nb > 1 ? 's' : ''}</div>
                </div>
                <select aria-label={`Catégorie pour ${x.ebay_nom}`} value={choix[x.cle] || ''} onChange={e => setChoix({ ...choix, [x.cle]: e.target.value })} style={{ ...champ, width: isMobile ? '100%' : 260 }}>
                  <option value="">Aucune catégorie</option>
                  {mesCats.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
            <button type="button" disabled={!!occupe || !aChange} style={{ ...btn(true), opacity: aChange && !occupe ? 1 : 0.5 }} onClick={appliquer}>{occupe === 'cats' ? '⏳ Application…' : 'Appliquer'}</button>
            {cats.some(x => x.suggestion_id) && <button type="button" disabled={!!occupe} style={btn()} onClick={suggerer}>✨ Suggérer d'après les noms eBay</button>}
          </div>
          <p style={{ fontSize: 11, color: T.light, margin: '8px 0 0' }}>Les suggestions ne s'appliquent que si vous avez déjà une catégorie du même nom ; vérifiez-les puis cliquez « Appliquer ».</p>
        </div>
      )}

      {/* 5. Synchronisation */}
      {cx && cx.statut === 'connecte' && suivi && suivi.dernier_suivi && (
        <div style={carte}>
          <strong style={{ fontSize: 15 }}>🔄 Synchronisation avec eBay</strong>
          <p style={{ fontSize: 14, color: T.light, margin: '8px 0 10px', lineHeight: 1.6 }}>Le stock de vos annonces importées est mis à jour automatiquement (environ toutes les heures). Une annonce terminée sur eBay passe à un stock de 0. Les prix et les descriptions ne sont jamais modifiés.</p>
          <div style={{ fontSize: 13, color: T.light, marginBottom: 12 }}>
            Dernière vérification : {new Date(suivi.dernier_suivi).toLocaleString('fr-CA')}
            {suivi.dernier_resume && suivi.dernier_changement_le ? <><br />Dernier changement ({new Date(suivi.dernier_changement_le).toLocaleString('fr-CA')}) : {suivi.dernier_resume}</> : null}
            {suivi.suivi_erreur ? <><br /><span style={{ color: T.danger }}>Problème : {suivi.suivi_erreur}</span></> : null}
          </div>
          {suivi.nouvelles > 0 && <div style={{ fontSize: 14, marginBottom: 12 }}>🆕 <strong>{suivi.nouvelles}</strong> nouvelle{suivi.nouvelles > 1 ? 's' : ''} annonce{suivi.nouvelles > 1 ? 's' : ''} sur eBay pas encore dans votre boutique. Cliquez sur « Importer de nouveau » pour les ajouter.</div>}
          <button type="button" style={btn()} disabled={!!occupe || enCours} onClick={verifier}>Vérifier maintenant</button>
        </div>
      )}

      {modale && (modale.type === 'confirmer'
        ? <BoutiqueModale type="confirmer" accent={couleur} titre={modale.titre} message={modale.message} texteConfirmer={modale.texte || 'Confirmer'} texteFermer="Annuler" enCours={!!occupe} onFermer={() => setModale(null)} onConfirmer={() => { const a = modale.action; setModale(null); if (a) a(); }} />
        : <BoutiqueModale type={modale.type} accent={couleur} message={modale.message} onFermer={() => setModale(null)} />)}
    </div>
  );
}