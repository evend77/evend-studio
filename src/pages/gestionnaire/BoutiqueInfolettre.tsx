// CHEMIN : src/pages/gestionnaire/BoutiqueInfolettre.tsx
// e-Vend Studio — Add-on « Infolettre » (boutique solo). Le gestionnaire branche SON service de courriels (Mailchimp, Brevo, MailerLite, Amazon SES ou webhook) :
// Studio n'envoie jamais de courriels de masse. Chaque inscription (pied de page ou case de la caisse) est gardée ici avec sa preuve de consentement
// et transmise à son service. Les campagnes se rédigent et s'envoient chez son fournisseur.
// API : /api/boutique/gestionnaire/infolettre  (etat, config, cles, tester, abonnes, renvoyer, export.csv)

import React, { useState, useEffect, useCallback } from 'react';
import { bq, BQ, messageErreur } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', ok: '#16a34a', warn: '#b45309', danger: '#dc2626' };
type Fournisseur = 'aucun' | 'mailchimp' | 'brevo' | 'mailerlite' | 'ses' | 'webhook';
interface Config {
  fournisseur: Fournisseur; cle_masquee: string | null; secret_masque: string | null; liste_id: string; region: string; webhook_url: string; double_optin: boolean; actif: boolean;
  titre: string; texte: string; placeholder: string; texte_bouton: string; texte_succes: string; consentement_texte: string; consentement_obligatoire: boolean;
  afficher_footer: boolean; afficher_caisse: boolean; texte_caisse: string; verifie_le: string | null; configuree: boolean; existe: boolean;
}
interface Stats { total: number; ok: number; erreur: number; local: number; en_attente: number }
interface Abonne { id: number; email: string; source: 'footer' | 'caisse'; consentement_le: string; statut_envoi: 'ok' | 'erreur' | 'local' | 'en_attente'; erreur_envoi: string | null; created_at: string }

const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 16 };
const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase', marginBottom: 6 };
const aide: React.CSSProperties = { fontSize: 12, color: T.light, lineHeight: 1.5, marginTop: 5 };

const FOURNISSEURS: { id: Fournisseur; nom: string; aide: string }[] = [
  { id: 'aucun', nom: 'Aucun (garder les courriels seulement)', aide: "Les inscriptions restent dans votre boutique. Vous pouvez les exporter en CSV et les importer où vous voulez." },
  { id: 'mailchimp', nom: 'Mailchimp', aide: "Clé API : dans Mailchimp, section « Extras → API keys » (elle se termine par -us21 ou similaire). ID d'audience : « Audience → Settings → Audience name and defaults »." },
  { id: 'brevo', nom: 'Brevo', aide: "Clé API : « SMTP & API → API Keys » dans Brevo. ID de liste : le numéro de la liste dans « Contacts → Lists »." },
  { id: 'mailerlite', nom: 'MailerLite', aide: "Clé API : « Integrations → MailerLite API ». ID du groupe : le numéro du groupe qui recevra les abonnés." },
  { id: 'ses', nom: 'Amazon SES', aide: "Créez une liste de contacts dans SES, puis un utilisateur IAM avec une clé d'accès autorisé à créer des contacts et à lire cette liste. Indiquez la région où se trouve la liste." },
  { id: 'webhook', nom: 'Webhook (avancé)', aide: "Chaque inscription est envoyée en JSON (POST) à votre adresse https. Un secret facultatif signe la requête (en-tête X-Studio-Signature : sha256=…, HMAC du corps)." },
];

const fmtDate = (d: string) => { try { return new Date(d).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' }); } catch (e) { return d; } };

export default function BoutiqueInfolettre({ accent, isMobile, pagePlan, naviguerVers }: { gestionnaireId?: number; accent?: string; isMobile?: boolean; pagePlan?: string; naviguerVers?: (page: string) => void }) {
  const couleur = accent || '#2d6a9f';
  const [actif, setActif] = useState<boolean | null>(null);
  const [cfg, setCfg] = useState<Config | null>(null);
  const [defauts, setDefauts] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [guide, setGuide] = useState('');
  const [f, setF] = useState<Fournisseur>('aucun');
  const [cle, setCle] = useState(''); const [secret, setSecret] = useState(''); const [liste, setListe] = useState(''); const [region, setRegion] = useState(''); const [hook, setHook] = useState('');
  const [dbl, setDbl] = useState(false); const [enPause, setEnPause] = useState(false);
  const [aff, setAff] = useState({ titre: '', texte: '', placeholder: '', texte_bouton: '', texte_succes: '', consentement_texte: '', texte_caisse: '', consentement_obligatoire: true, afficher_footer: true, afficher_caisse: true });
  const [occupe, setOccupe] = useState('');
  const [modale, setModale] = useState<{ type: 'erreur' | 'succes' | 'confirmer'; message: string; titre?: string; action?: () => void; texte?: string } | null>(null);
  const [abonnes, setAbonnes] = useState<Abonne[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [pages, setPages] = useState(1);
  const [q, setQ] = useState(''); const [qAppl, setQAppl] = useState(''); const [statut, setStatut] = useState('');

  const appliquer = (c: Config) => {
    setCfg(c); setF(c.fournisseur); setListe(c.liste_id); setRegion(c.region); setHook(c.webhook_url); setDbl(c.double_optin); setEnPause(!c.actif);
    setAff({ titre: c.titre, texte: c.texte, placeholder: c.placeholder, texte_bouton: c.texte_bouton, texte_succes: c.texte_succes, consentement_texte: c.consentement_texte, texte_caisse: c.texte_caisse, consentement_obligatoire: c.consentement_obligatoire, afficher_footer: c.afficher_footer, afficher_caisse: c.afficher_caisse });
    setCle(''); setSecret('');
  };
  const charger = useCallback(async () => {
    const r = await bq('/infolettre/etat');
    if (!r.ok) { setModale({ type: 'erreur', message: messageErreur(r) }); return; }
    setActif(r.data.addon_actif); setDefauts(r.data.defauts || {}); setStats(r.data.stats);
    if (r.data.config) appliquer(r.data.config);
  }, []);
  const chargerAbonnes = useCallback(async (p: number, rech: string, st: string) => {
    const r = await bq(`/infolettre/abonnes?page=${p}&q=${encodeURIComponent(rech)}&statut=${st}`);
    if (r.ok) { setAbonnes(r.data.abonnes); setTotal(r.data.total); setPages(r.data.pages); }
  }, []);

  useEffect(() => {
    charger();
    bq('/addons').then(a => { if (a.ok && a.data && Array.isArray(a.data.addons)) { const g = a.data.addons.find((y: any) => y.code === 'infolettre'); if (g && g.guide_url) setGuide(g.guide_url); } });
  }, [charger]);
  useEffect(() => { if (actif) chargerAbonnes(page, qAppl, statut); }, [actif, page, qAppl, statut, chargerAbonnes]);

  const appel = async (cleOcc: string, chemin: string, options: { method?: string; body?: any } = {}, succes?: string) => {
    setOccupe(cleOcc);
    const r = await bq(chemin, options);
    setOccupe('');
    if (!r.ok) { setModale({ type: 'erreur', message: messageErreur(r) }); return null; }
    if (succes) setModale({ type: 'succes', message: succes });
    return r;
  };
  const recharger = async (r: any) => { if (r && r.data && r.data.config) { appliquer(r.data.config); setStats(r.data.stats); } await chargerAbonnes(page, qAppl, statut); };

  const enregistrerService = async () => {
    const body: any = { fournisseur: f, actif: !enPause };
    if (cle.trim()) body.cle = cle.trim(); if (secret.trim()) body.secret = secret.trim();
    if (f === 'mailchimp' || f === 'brevo' || f === 'mailerlite' || f === 'ses') body.liste_id = liste.trim();
    if (f === 'ses') body.region = region.trim();
    if (f === 'webhook') body.webhook_url = hook.trim();
    if (f === 'mailchimp') body.double_optin = dbl;
    const r = await appel('save', '/infolettre/config', { method: 'POST', body }, f === 'aucun' ? 'Enregistré.' : 'Enregistré. Cliquez sur « Tester la connexion » pour vérifier.');
    await recharger(r);
  };
  const enregistrerAffichage = async () => {
    const r = await appel('aff', '/infolettre/config', { method: 'POST', body: aff }, 'Textes et affichage enregistrés.');
    await recharger(r);
  };
  const tester = async () => { const r = await appel('test', '/infolettre/tester', { method: 'POST' }); if (r) { setModale({ type: 'succes', message: r.data.message || 'Connexion réussie.' }); await charger(); } };
  const effacerCles = () => setModale({ type: 'confirmer', titre: 'Effacer les clés ?', message: "Les clés enregistrées seront supprimées. Le formulaire du site se cachera jusqu'à ce que vous les entriez de nouveau.", texte: 'Effacer', action: async () => { const r = await appel('del', '/infolettre/cles', { method: 'DELETE' }, 'Clés effacées.'); await recharger(r); } });
  const supprimer = (a: Abonne) => setModale({ type: 'confirmer', titre: 'Supprimer cet abonné ?', message: `${a.email} sera retiré de la liste de votre boutique. Si l'adresse est déjà dans votre service de courriels, elle y reste : retirez-la aussi là-bas.`, texte: 'Supprimer', action: async () => { const r = await appel('sup', `/infolettre/abonnes/${a.id}`, { method: 'DELETE' }); if (r) { await charger(); await chargerAbonnes(page, qAppl, statut); } } });
  const renvoyer = async () => { const r = await appel('renvoi', '/infolettre/renvoyer', { method: 'POST' }); if (r) { setModale({ type: r.data.erreurs ? 'erreur' : 'succes', message: `${r.data.traites} inscription(s) renvoyée(s) : ${r.data.ok} réussie(s), ${r.data.erreurs} en échec.` }); await charger(); await chargerAbonnes(page, qAppl, statut); } };
  const exporter = async () => {
    setOccupe('csv');
    try {
      let t: string | null = null; try { t = localStorage.getItem('token'); } catch (e) { t = null; }
      const r = await fetch(`${BQ}/infolettre/export.csv`, { credentials: 'include', headers: t ? { Authorization: `Bearer ${t}` } : {} });
      if (!r.ok) throw new Error('export');
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement('a'); a.href = url; a.download = 'abonnes-infolettre.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) { setModale({ type: 'erreur', message: "L'exportation a échoué. Réessayez." }); }
    setOccupe('');
  };

  if (actif === null) return <div style={{ padding: 24, color: T.light }}>Chargement…</div>;
  const btn = (fort?: boolean, rouge?: boolean): React.CSSProperties => ({ border: fort ? 'none' : `1px solid ${rouge ? '#fca5a5' : T.border}`, background: fort ? couleur : '#fff', color: fort ? '#fff' : rouge ? '#b91c1c' : '#374151', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: occupe ? 'wait' : 'pointer', opacity: occupe ? 0.7 : 1 });
  const pastille = (texte: string, bg: string, fg: string) => <span style={{ background: bg, color: fg, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{texte}</span>;
  const statutAb = (s: Abonne['statut_envoi']) => s === 'ok' ? pastille('Envoyé', '#dcfce7', '#166534') : s === 'erreur' ? pastille('Échec', '#fee2e2', '#991b1b') : s === 'en_attente' ? pastille('En cours', '#fef3c7', '#92400e') : pastille('Gardé ici', '#e5e7eb', '#374151');

  const entete = (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ margin: '0 0 6px', fontSize: isMobile ? 20 : 24 }}>📧 Infolettre {guide && <a href={guide} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: couleur, textDecoration: 'none', border: `1px solid ${couleur}`, borderRadius: 12, padding: '2px 10px', marginLeft: 10, verticalAlign: 'middle' }}>📖 Guide</a>}</h2>
      <p style={{ margin: 0, fontSize: 14, color: T.light, lineHeight: 1.6 }}>Ajoutez un formulaire d'inscription dans le pied de page de votre site et une case à la caisse. Les courriels sont envoyés à <strong>votre propre service d'emailing</strong> : vous y rédigez et envoyez vos campagnes, et c'est votre réputation d'expéditeur qui est en jeu, pas celle de Studio.</p>
    </div>
  );

  if (!actif) {
    return (
      <div style={{ maxWidth: 860, color: T.text }}>
        {entete}
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: 10, padding: '12px 14px', fontSize: 13 }}>
          🔒 L'add-on <strong>Infolettre</strong> n'est pas activé : activez-le dans <strong>Mon plan &amp; limites</strong>.
          {pagePlan && naviguerVers && <button type="button" onClick={() => naviguerVers(pagePlan)} style={{ marginLeft: 10, border: '1px solid #fdba74', background: '#fff', color: '#9a3412', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Voir « Mon plan &amp; limites »</button>}
        </div>
      </div>
    );
  }

  const fo = FOURNISSEURS.find(x => x.id === f)!;
  const visible = !!cfg && cfg.existe && cfg.configuree && cfg.actif && (cfg.afficher_footer || cfg.afficher_caisse);
  const phold = (k: string) => defauts[k] || '';
  const ligneAff = (cleAff: 'titre' | 'texte' | 'placeholder' | 'texte_bouton' | 'texte_succes' | 'consentement_texte' | 'texte_caisse', etiquette: string, long?: boolean) => (
    <div style={{ marginBottom: 12 }}>
      <label style={lbl}>{etiquette}</label>
      {long
        ? <textarea value={aff[cleAff]} placeholder={phold(cleAff)} maxLength={400} onChange={e => setAff({ ...aff, [cleAff]: e.target.value })} style={{ ...champ, minHeight: 64, resize: 'vertical' }} />
        : <input value={aff[cleAff]} placeholder={phold(cleAff)} maxLength={300} onChange={e => setAff({ ...aff, [cleAff]: e.target.value })} style={champ} />}
    </div>
  );

  return (
    <div style={{ maxWidth: 860, color: T.text }}>
      {entete}

      {/* État */}
      <div style={{ ...carte, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {visible ? pastille('● Visible sur votre site', '#dcfce7', '#166534') : pastille('○ Caché sur votre site', '#fef3c7', '#92400e')}
        <span style={{ fontSize: 13, color: T.light, flex: 1, minWidth: 200 }}>
          {!cfg || !cfg.existe ? "Enregistrez les réglages de votre service ci-dessous pour afficher le formulaire." : !cfg.configuree ? "Réglages incomplets : le formulaire reste caché tant qu'ils ne sont pas complets." : !cfg.actif ? 'En pause : le formulaire est caché.' : !(cfg.afficher_footer || cfg.afficher_caisse) ? "Aucun emplacement n'est activé (pied de page ou caisse)." : 'Le formulaire est affiché dans le pied de page et/ou à la caisse.'}
        </span>
        {stats && <span style={{ fontSize: 13, color: T.light }}><strong style={{ color: T.text }}>{stats.total}</strong> inscription{stats.total > 1 ? 's' : ''}{stats.erreur > 0 && <> · <strong style={{ color: T.danger }}>{stats.erreur} en échec</strong></>}</span>}
      </div>

      {/* 1. Service */}
      <div style={carte}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>1. Votre service de courriels</div>
        <label style={lbl}>Service</label>
        <select value={f} onChange={e => setF(e.target.value as Fournisseur)} style={{ ...champ, maxWidth: 380, background: '#fff' }}>
          {FOURNISSEURS.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}
        </select>
        <div style={aide}>{fo.aide}</div>
        {cfg && f !== cfg.fournisseur && cfg.existe && <div style={{ ...aide, color: T.warn }}>⚠ En enregistrant, les réglages de l'ancien service (clés, liste) seront effacés.</div>}

        {(f === 'mailchimp' || f === 'brevo' || f === 'mailerlite' || f === 'ses') && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginTop: 14 }}>
            <div>
              <label style={lbl}>{f === 'ses' ? "ID de clé d'accès AWS" : 'Clé API'}</label>
              <input type="password" autoComplete="off" value={cle} onChange={e => setCle(e.target.value)} placeholder={cfg && cfg.fournisseur === f && cfg.cle_masquee ? `Enregistré : ${cfg.cle_masquee}` : 'Collez la clé'} style={champ} />
              <div style={aide}>{cfg && cfg.fournisseur === f && cfg.cle_masquee ? 'Laissez vide pour la garder.' : 'Elle est chiffrée et ne s\'affiche plus jamais en entier.'}</div>
            </div>
            {f === 'ses' && (
              <div>
                <label style={lbl}>Clé secrète AWS</label>
                <input type="password" autoComplete="off" value={secret} onChange={e => setSecret(e.target.value)} placeholder={cfg && cfg.fournisseur === f && cfg.secret_masque ? `Enregistré : ${cfg.secret_masque}` : 'Collez le secret'} style={champ} />
              </div>
            )}
            <div>
              <label style={lbl}>{f === 'ses' ? 'Nom de la liste de contacts' : f === 'mailchimp' ? "ID d'audience" : f === 'brevo' ? 'ID de liste' : 'ID du groupe'}</label>
              <input value={liste} onChange={e => setListe(e.target.value)} style={champ} />
            </div>
            {f === 'ses' && (
              <div>
                <label style={lbl}>Région AWS</label>
                <input value={region} onChange={e => setRegion(e.target.value)} placeholder="ca-central-1" style={champ} />
              </div>
            )}
          </div>
        )}
        {f === 'mailchimp' && (
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 14, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={dbl} onChange={e => setDbl(e.target.checked)} style={{ marginTop: 3 }} />
            <span><strong>Confirmation par courriel</strong> (double opt-in) : Mailchimp envoie un courriel de confirmation avant d'abonner la personne.</span>
          </label>
        )}
        {f === 'webhook' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 12, marginTop: 14 }}>
            <div><label style={lbl}>Adresse du webhook (https)</label><input value={hook} onChange={e => setHook(e.target.value)} placeholder="https://…" style={champ} /></div>
            <div>
              <label style={lbl}>Secret de signature (facultatif)</label>
              <input type="password" autoComplete="off" value={secret} onChange={e => setSecret(e.target.value)} placeholder={cfg && cfg.fournisseur === f && cfg.secret_masque ? `Enregistré : ${cfg.secret_masque}` : ''} style={champ} />
            </div>
          </div>
        )}
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 14, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={enPause} onChange={e => setEnPause(e.target.checked)} /> Mettre en pause (cache le formulaire sans effacer vos réglages)
        </label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16, alignItems: 'center' }}>
          <button type="button" onClick={enregistrerService} disabled={!!occupe} style={btn(true)}>{occupe === 'save' ? 'Enregistrement…' : 'Enregistrer'}</button>
          {f !== 'aucun' && <button type="button" onClick={tester} disabled={!!occupe || !cfg || !cfg.configuree} style={btn()}>{occupe === 'test' ? 'Test…' : 'Tester la connexion'}</button>}
          {cfg && (cfg.cle_masquee || cfg.secret_masque) && <button type="button" onClick={effacerCles} disabled={!!occupe} style={btn(false, true)}>Effacer les clés</button>}
          {cfg && cfg.verifie_le && f !== 'aucun' && <span style={{ fontSize: 12, color: T.ok }}>✓ Vérifié le {fmtDate(cfg.verifie_le)}</span>}
        </div>
      </div>

      {/* 2. Affichage */}
      <div style={carte}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>2. Textes et affichage</div>
        <div style={{ ...aide, marginTop: 0, marginBottom: 12 }}>Laissez un champ vide pour garder le texte par défaut (affiché en gris).</div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 14 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}><input type="checkbox" checked={aff.afficher_footer} onChange={e => setAff({ ...aff, afficher_footer: e.target.checked })} /> Dans le pied de page du site</label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}><input type="checkbox" checked={aff.afficher_caisse} onChange={e => setAff({ ...aff, afficher_caisse: e.target.checked })} /> Case à cocher à la caisse</label>
        </div>
        {ligneAff('titre', 'Titre')}
        {ligneAff('texte', 'Sous-titre', true)}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
          {ligneAff('placeholder', 'Texte dans le champ courriel')}
          {ligneAff('texte_bouton', 'Texte du bouton')}
        </div>
        {ligneAff('texte_succes', 'Message après inscription')}
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '4px 0 12px', fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={aff.consentement_obligatoire} onChange={e => setAff({ ...aff, consentement_obligatoire: e.target.checked })} style={{ marginTop: 3 }} />
          <span><strong>Case de consentement obligatoire</strong> (recommandé — la case n'est jamais cochée d'avance et la preuve est gardée avec chaque inscription)</span>
        </label>
        {ligneAff('consentement_texte', 'Texte du consentement', true)}
        {ligneAff('texte_caisse', 'Texte de la case à la caisse')}
        <button type="button" onClick={enregistrerAffichage} disabled={!!occupe} style={btn(true)}>{occupe === 'aff' ? 'Enregistrement…' : 'Enregistrer les textes'}</button>
      </div>

      {/* 3. Abonnés */}
      <div style={carte}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>3. Inscriptions reçues ({total})</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {stats && stats.erreur > 0 && <button type="button" onClick={renvoyer} disabled={!!occupe} style={btn()}>{occupe === 'renvoi' ? 'Renvoi…' : `↻ Renvoyer les échecs (${stats.erreur})`}</button>}
            <button type="button" onClick={exporter} disabled={!!occupe || !stats || stats.total === 0} style={btn()}>⬇ Exporter en CSV</button>
          </div>
        </div>
        <div style={{ ...aide, marginTop: 0, marginBottom: 12 }}>Cette liste est la copie des inscriptions reçues sur votre site. Les désabonnements se font chez votre service de courriels (lien dans vos courriels) : ils n'apparaissent pas ici.</div>
        <form onSubmit={e => { e.preventDefault(); setPage(1); setQAppl(q.trim()); }} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un courriel…" style={{ ...champ, flex: 1, minWidth: 180, width: 'auto' }} />
          <select value={statut} onChange={e => { setPage(1); setStatut(e.target.value); }} style={{ ...champ, width: 'auto', background: '#fff' }}>
            <option value="">Tous les statuts</option><option value="ok">Envoyés</option><option value="erreur">En échec</option><option value="local">Gardés ici</option><option value="en_attente">En cours</option>
          </select>
          <button type="submit" style={btn()}>Chercher</button>
        </form>
        {abonnes.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: T.light, fontSize: 14 }}>Aucune inscription pour l'instant.</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ textAlign: 'left', color: T.light, fontSize: 11, textTransform: 'uppercase' }}><th style={{ padding: '6px 8px' }}>Courriel</th><th style={{ padding: '6px 8px' }}>Source</th><th style={{ padding: '6px 8px' }}>Inscrit le</th><th style={{ padding: '6px 8px' }}>Statut</th><th /></tr></thead>
              <tbody>
                {abonnes.map(a => (
                  <tr key={a.id} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px', wordBreak: 'break-all' }}>{a.email}</td>
                    <td style={{ padding: '8px' }}>{a.source === 'caisse' ? 'Caisse' : 'Pied de page'}</td>
                    <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{fmtDate(a.created_at)}</td>
                    <td style={{ padding: '8px' }} title={a.erreur_envoi || undefined}>{statutAb(a.statut_envoi)}{a.statut_envoi === 'erreur' && a.erreur_envoi && <div style={{ fontSize: 11, color: T.danger, marginTop: 3 }}>{a.erreur_envoi}</div>}{a.statut_envoi === 'ok' && a.erreur_envoi && <div style={{ fontSize: 11, color: T.light, marginTop: 3 }}>{a.erreur_envoi}</div>}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}><button type="button" onClick={() => supprimer(a)} disabled={!!occupe} aria-label={`Supprimer ${a.email}`} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 15 }}>🗑</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center', marginTop: 14 }}>
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} style={btn()}>← Précédent</button>
            <span style={{ fontSize: 13, color: T.light }}>Page {page} / {pages}</span>
            <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)} style={btn()}>Suivant →</button>
          </div>
        )}
      </div>

      {modale && (modale.type === 'confirmer'
        ? <BoutiqueModale type="confirmer" accent={couleur} titre={modale.titre} message={modale.message} texteConfirmer={modale.texte || 'Confirmer'} texteFermer="Annuler" enCours={!!occupe} onFermer={() => setModale(null)} onConfirmer={() => { const a = modale.action; setModale(null); if (a) a(); }} />
        : <BoutiqueModale type={modale.type} accent={couleur} message={modale.message} onFermer={() => setModale(null)} />)}
    </div>
  );
}