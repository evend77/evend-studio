// CHEMIN : src/pages/gestionnaire/EbayGestionnaire.tsx
// e-Vend Studio — Add-on « Connecteur eBay » : le gestionnaire colle SES clés eBay « développeur » (chiffrées côté serveur).
// API : /api/gestionnaire/ebay  (GET, POST, POST /tester, DELETE)

import React, { useState, useEffect, useCallback } from 'react';

const URL_GUIDE = 'https://e-vendstudio.ca/documents/mv-connecteur-ebay-add-on';
const T = { accent: '#2d6a9f', border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626', success: '#16a34a' };

interface Config {
  env: 'production' | 'sandbox';
  client_id_masque: string | null; dev_id_masque: string | null; client_secret_masque: string | null;
  runame: string; configure: boolean; verifie_le: string | null; url_acceptee: string; url_refusee: string;
}

function Copiable({ valeur }: { valeur: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <code style={{ flex: 1, minWidth: 220, background: '#f3f4f6', border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 12, wordBreak: 'break-all' }}>{valeur}</code>
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(valeur); setOk(true); setTimeout(() => setOk(false), 1500); } catch { /* presse-papier indisponible */ } }}
        style={{ border: `1px solid ${T.border}`, background: '#fff', borderRadius: 6, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{ok ? '✓ Copié' : 'Copier'}</button>
    </div>
  );
}

export default function EbayGestionnaire(_props: { gestionnaireId?: number }) {
  const token = localStorage.getItem('token');
  const auth: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const [cfg, setCfg] = useState<Config | null>(null);
  const [chargement, setChargement] = useState(true);
  const [env, setEnv] = useState<'production' | 'sandbox'>('production');
  const [clientId, setClientId] = useState('');
  const [devId, setDevId] = useState('');
  const [secret, setSecret] = useState('');
  const [runame, setRuname] = useState('');
  const [enCours, setEnCours] = useState<'' | 'save' | 'test' | 'del'>('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null);

  const charger = useCallback(async () => {
    try {
      const r = await fetch('/api/gestionnaire/ebay', { credentials: 'include', headers: auth });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg({ type: 'err', texte: d.error || 'Chargement impossible' }); setChargement(false); return; }
      setCfg(d); setEnv(d.env); setRuname(d.runame || '');
    } catch { setMsg({ type: 'err', texte: 'Erreur réseau' }); }
    setChargement(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { charger(); }, [charger]);

  const appel = async (methode: string, chemin: string, corps?: unknown) => {
    const r = await fetch(`/api/gestionnaire/ebay${chemin}`, {
      method: methode, credentials: 'include',
      headers: { ...auth, ...(corps ? { 'Content-Type': 'application/json' } : {}) },
      body: corps ? JSON.stringify(corps) : undefined,
    });
    const d = await r.json().catch(() => ({}));
    return { ok: r.ok, d };
  };

  const enregistrer = async () => {
    setMsg(null);
    if (!clientId.trim() && !devId.trim() && !secret.trim() && env === (cfg?.env ?? 'production') && runame.trim() === (cfg?.runame || '')) { setMsg({ type: 'err', texte: 'Rien à enregistrer : collez au moins une clé dans les champs.' }); return; }
    setEnCours('save');
    try {
      const { ok, d } = await appel('POST', '', { env, client_id: clientId, dev_id: devId, client_secret: secret, runame });
      if (!ok) { setMsg({ type: 'err', texte: d.error || 'Enregistrement impossible' }); }
      else { setClientId(''); setDevId(''); setSecret(''); setMsg({ type: 'ok', texte: 'Clés enregistrées. Cliquez sur « Tester » pour vérifier.' }); await charger(); }
    } catch { setMsg({ type: 'err', texte: 'Erreur réseau' }); }
    setEnCours('');
  };

  const tester = async () => {
    setMsg(null); setEnCours('test');
    try {
      const { ok, d } = await appel('POST', '/tester');
      setMsg(ok ? { type: 'ok', texte: d.message || 'Clés valides.' } : { type: 'err', texte: d.error || 'Test impossible' });
      if (ok) await charger();
    } catch { setMsg({ type: 'err', texte: 'Erreur réseau' }); }
    setEnCours('');
  };

  const effacer = async () => {
    if (!window.confirm('Effacer vos clés eBay ? Les collaborateurs ne pourront plus connecter leur compte eBay tant que vous n\'en aurez pas enregistré de nouvelles.')) return;
    setMsg(null); setEnCours('del');
    try {
      const { ok, d } = await appel('DELETE', '');
      if (!ok) setMsg({ type: 'err', texte: d.error || 'Suppression impossible' });
      else { setMsg({ type: 'ok', texte: 'Clés effacées.' }); await charger(); }
    } catch { setMsg({ type: 'err', texte: 'Erreur réseau' }); }
    setEnCours('');
  };

  const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase', marginBottom: 6 };
  const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 16 };
  const etiquette = (m: string | null) => (m ? `Enregistré : ${m}` : 'Non enregistré');

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>;
  if (!cfg) return <div style={{ padding: 24, color: T.danger }}>{msg?.texte || 'Configuration indisponible'}</div>;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 22, color: T.text }}>🏷️ Connecteur eBay <a href={URL_GUIDE} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: T.accent, textDecoration: 'none', border: `1px solid ${T.accent}`, borderRadius: 12, padding: '2px 10px', marginLeft: 10, verticalAlign: 'middle' }}>📖 Guide</a></h2>
      <p style={{ margin: '0 0 18px', fontSize: 14, color: T.light, lineHeight: 1.6 }}>
        Vous utilisez vos <strong>propres clés eBay</strong> : la limite d'appels eBay est donc à vous, elle n'est partagée avec aucune autre marketplace. Vous les configurez une seule fois ; vos collaborateurs n'auront ensuite qu'à connecter leur compte eBay.
      </p>

      {msg && (
        <div style={{ background: msg.type === 'ok' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${msg.type === 'ok' ? '#bbf7d0' : '#fecaca'}`, color: msg.type === 'ok' ? '#166534' : '#991b1b', borderRadius: 10, padding: '12px 14px', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
          {msg.type === 'ok' ? '✅ ' : '⚠️ '}{msg.texte}
        </div>
      )}

      <div style={carte}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 15, color: T.text }}>Vos clés eBay</strong>
          {cfg.verifie_le
            ? <span style={{ background: '#dcfce7', color: '#166534', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>✓ Vérifiées le {new Date(cfg.verifie_le).toLocaleDateString('fr-CA')}</span>
            : cfg.configure
              ? <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>À tester</span>
              : <span style={{ background: '#f3f4f6', color: T.light, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>Non configurées</span>}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Environnement</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {([['production', 'Production'], ['sandbox', 'Test (sandbox)']] as const).map(([v, nom]) => (
              <button key={v} type="button" onClick={() => setEnv(v)}
                style={{ padding: '9px 16px', borderRadius: 8, border: `2px solid ${env === v ? T.accent : T.border}`, background: env === v ? '#eff6ff' : '#fff', color: env === v ? T.accent : T.text, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{nom}</button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: T.light, margin: '6px 0 0' }}>Les clés de test et de production sont différentes chez eBay : ne les mélangez pas.</p>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={lbl}>ID client de l'application (App ID)</label>
            <input value={clientId} onChange={e => setClientId(e.target.value)} placeholder={etiquette(cfg.client_id_masque)} autoComplete="off" style={champ} />
          </div>
          <div>
            <label style={lbl}>ID développeur (Dev ID)</label>
            <input value={devId} onChange={e => setDevId(e.target.value)} placeholder={etiquette(cfg.dev_id_masque)} autoComplete="off" style={champ} />
          </div>
          <div>
            <label style={lbl}>Secret du client (Cert ID)</label>
            <input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder={etiquette(cfg.client_secret_masque)} autoComplete="new-password" style={champ} />
          </div>
          <div>
            <label style={lbl}>Nom de l'URL de redirection eBay (RuName)</label>
            <input value={runame} onChange={e => setRuname(e.target.value)} autoComplete="off" style={champ} />
          </div>
        </div>
        <p style={{ fontSize: 11, color: T.light, margin: '10px 0 0' }}>Laissez un champ vide pour garder la valeur déjà enregistrée. Vos clés sont chiffrées et ne sont jamais réaffichées en entier.</p>

        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <button disabled={!!enCours} onClick={enregistrer} style={{ padding: '11px 20px', border: 'none', background: T.accent, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>{enCours === 'save' ? '⏳ Enregistrement…' : '💾 Enregistrer'}</button>
          <button disabled={!!enCours || !cfg.client_id_masque || !cfg.client_secret_masque} onClick={tester} style={{ padding: '11px 20px', border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer', opacity: (!cfg.client_id_masque || !cfg.client_secret_masque) ? 0.5 : 1 }}>{enCours === 'test' ? '⏳ Test…' : '🔌 Tester'}</button>
          {cfg.configure && <button disabled={!!enCours} onClick={effacer} style={{ padding: '11px 20px', border: `1px solid ${T.danger}`, background: '#fff', color: T.danger, borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' }}>🗑️ Effacer mes clés</button>}
        </div>
        <p style={{ fontSize: 11, color: T.light, margin: '10px 0 0' }}>Le test vérifie l'ID client et le secret auprès d'eBay. L'ID développeur et le RuName ne servent qu'à la connexion d'un compte eBay, ils seront validés à la première connexion.</p>
      </div>

      <div style={carte}>
        <strong style={{ fontSize: 15, color: T.text }}>Où trouver ces clés ?</strong>
        <ol style={{ margin: '10px 0 0', paddingLeft: 20, fontSize: 13, color: T.text, lineHeight: 1.8 }}>
          <li>Connectez-vous à <a href="https://developer.ebay.com" target="_blank" rel="noopener noreferrer" style={{ color: T.accent }}>developer.ebay.com</a> avec votre compte eBay (créez un compte développeur si nécessaire).</li>
          <li>Dans « Application Keys », créez un jeu de clés pour l'environnement voulu : vous obtenez l'<strong>App ID</strong>, le <strong>Dev ID</strong> et le <strong>Cert ID</strong>.</li>
          <li>Pour la production, eBay demande de configurer la « suppression de compte Marketplace » (onglet « Alerts &amp; Notifications », choix « Marketplace Account Deletion »). N'activez <strong>pas</strong> « Exempted » : entrez votre courriel, l'adresse <strong>https://e-vendstudio.ca/api/ebay-connexion/suppression-compte</strong> et le jeton de vérification <strong>evend-studio-ebay-verification-2026-jeton-v1</strong>, puis cliquez « Save ».</li>
          <li>Dans « User Tokens », activez OAuth sur votre jeu de clés (« enable OAuth »), puis créez le RuName avec les deux adresses ci-dessous.</li>
          <li>Copiez ici l'App ID, le Dev ID, le Cert ID et le RuName, puis cliquez sur « Enregistrer » et « Tester ».</li>
        </ol>
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <div><label style={lbl}>URL d'authentification acceptée</label><Copiable valeur={cfg.url_acceptee} /></div>
          <div><label style={lbl}>URL d'authentification refusée</label><Copiable valeur={cfg.url_refusee} /></div>
        </div>
      </div>
    </div>
  );
}