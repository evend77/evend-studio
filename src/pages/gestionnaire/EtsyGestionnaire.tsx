// CHEMIN : src/pages/gestionnaire/EtsyGestionnaire.tsx
// e-Vend Studio — Add-on « Connecteur Etsy » : le gestionnaire colle SES clés Etsy « développeur » (chiffrées côté serveur).
// API : /api/gestionnaire/ebay/etsy  (GET, POST, POST /tester, DELETE)

import React, { useState, useEffect, useCallback } from 'react';

const URL_GUIDE = 'https://e-vendstudio.ca/documents/mv-connecteur-etsy-add-on';
const T = { accent: '#d5641c', border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626' };
const BASE = '/api/gestionnaire/ebay/etsy';

interface Config { keystring_masque: string | null; secret_masque: string | null; configure: boolean; verifie_le: string | null; url_retour: string }

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

export default function EtsyGestionnaire(_props: { gestionnaireId?: number }) {
  const token = localStorage.getItem('token');
  const auth: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const [cfg, setCfg] = useState<Config | null>(null);
  const [chargement, setChargement] = useState(true);
  const [keystring, setKeystring] = useState('');
  const [secret, setSecret] = useState('');
  const [enCours, setEnCours] = useState<'' | 'save' | 'test' | 'del'>('');
  const [confirmerEffacer, setConfirmerEffacer] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null);

  const charger = useCallback(async () => {
    try {
      const r = await fetch(BASE, { credentials: 'include', headers: auth });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg({ type: 'err', texte: d.error || 'Chargement impossible' }); setChargement(false); return; }
      setCfg(d);
    } catch { setMsg({ type: 'err', texte: 'Erreur réseau' }); }
    setChargement(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { charger(); }, [charger]);

  const appel = async (methode: string, chemin: string, corps?: unknown) => {
    const r = await fetch(`${BASE}${chemin}`, { method: methode, credentials: 'include', headers: { ...auth, ...(corps ? { 'Content-Type': 'application/json' } : {}) }, body: corps ? JSON.stringify(corps) : undefined });
    return { ok: r.ok, d: await r.json().catch(() => ({})) };
  };

  const enregistrer = async () => {
    setMsg(null);
    if (!keystring.trim() && !secret.trim()) { setMsg({ type: 'err', texte: 'Rien à enregistrer : collez le Keystring et/ou le Shared secret.' }); return; }
    setEnCours('save');
    try {
      const { ok, d } = await appel('POST', '', { keystring, secret });
      if (!ok) setMsg({ type: 'err', texte: d.error || 'Enregistrement impossible' });
      else { setKeystring(''); setSecret(''); setMsg({ type: 'ok', texte: 'Clés enregistrées. Cliquez sur « Tester » pour vérifier.' }); await charger(); }
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
    setConfirmerEffacer(false); setMsg(null); setEnCours('del');
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
      <h2 style={{ margin: '0 0 6px', fontSize: 22, color: T.text }}>🧶 Connecteur Etsy <a href={URL_GUIDE} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: T.accent, textDecoration: 'none', border: `1px solid ${T.accent}`, borderRadius: 12, padding: '2px 10px', marginLeft: 10, verticalAlign: 'middle' }}>📖 Guide</a></h2>
      <p style={{ margin: '0 0 18px', fontSize: 14, color: T.light, lineHeight: 1.6 }}>
        Vous utilisez votre <strong>propre app Etsy</strong> : la limite d'appels Etsy est donc à vous, elle n'est partagée avec aucune autre marketplace. Vous la configurez une seule fois ; vos collaborateurs n'auront ensuite qu'à connecter leur boutique Etsy.
      </p>

      {msg && (
        <div style={{ background: msg.type === 'ok' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${msg.type === 'ok' ? '#bbf7d0' : '#fecaca'}`, color: msg.type === 'ok' ? '#166534' : '#991b1b', borderRadius: 10, padding: '12px 14px', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
          {msg.type === 'ok' ? '✅ ' : '⚠️ '}{msg.texte}
        </div>
      )}

      <div style={carte}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 15, color: T.text }}>Vos clés Etsy</strong>
          {cfg.verifie_le
            ? <span style={{ background: '#dcfce7', color: '#166534', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>✓ Vérifiées le {new Date(cfg.verifie_le).toLocaleDateString('fr-CA')}</span>
            : cfg.configure
              ? <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>À tester</span>
              : <span style={{ background: '#f3f4f6', color: T.light, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>Non configurées</span>}
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div><label style={lbl}>Keystring (ID de l'app)</label><input value={keystring} onChange={e => setKeystring(e.target.value)} placeholder={etiquette(cfg.keystring_masque)} autoComplete="off" style={champ} /></div>
          <div><label style={lbl}>Shared secret</label><input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder={etiquette(cfg.secret_masque)} autoComplete="new-password" style={champ} /></div>
        </div>
        <p style={{ fontSize: 11, color: T.light, margin: '10px 0 0' }}>Laissez un champ vide pour garder la valeur déjà enregistrée. Vos clés sont chiffrées et ne sont jamais réaffichées en entier.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <button disabled={!!enCours} onClick={enregistrer} style={{ padding: '11px 20px', border: 'none', background: T.accent, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>{enCours === 'save' ? '⏳ Enregistrement…' : '💾 Enregistrer'}</button>
          <button disabled={!!enCours || !cfg.configure} onClick={tester} style={{ padding: '11px 20px', border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer', opacity: cfg.configure ? 1 : 0.5 }}>{enCours === 'test' ? '⏳ Test…' : '🔌 Tester'}</button>
          {cfg.configure && <button disabled={!!enCours} onClick={() => setConfirmerEffacer(true)} style={{ padding: '11px 20px', border: `1px solid ${T.danger}`, background: '#fff', color: T.danger, borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' }}>🗑️ Effacer mes clés</button>}
        </div>
      </div>

      <div style={carte}>
        <strong style={{ fontSize: 15, color: T.text }}>Où trouver ces clés ?</strong>
        <ol style={{ margin: '10px 0 0', paddingLeft: 20, fontSize: 13, color: T.text, lineHeight: 1.8 }}>
          <li>Connectez-vous à <a href="https://www.etsy.com/developers/your-apps" target="_blank" rel="noopener noreferrer" style={{ color: T.accent }}>etsy.com/developers/your-apps</a> avec votre compte Etsy.</li>
          <li>Cliquez « Create a New App » et remplissez le formulaire. Pour l'adresse de redirection (« Callback URL »), collez l'adresse ci-dessous.</li>
          <li>Etsy doit <strong>approuver</strong> votre app (accès « commercial ») avant qu'elle fonctionne pour d'autres comptes que le vôtre : cela peut prendre quelques jours.</li>
          <li>Copiez ici le <strong>Keystring</strong> et le <strong>Shared secret</strong> de l'app, puis cliquez « Enregistrer » et « Tester ».</li>
        </ol>
        <div style={{ marginTop: 16 }}><label style={lbl}>Adresse de redirection (Callback URL) à donner à Etsy</label><Copiable valeur={cfg.url_retour} /></div>
      </div>

      {confirmerEffacer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 26, maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 38 }}>🗑️</div>
            <h3 style={{ margin: '8px 0', color: T.text }}>Effacer vos clés Etsy ?</h3>
            <p style={{ color: T.light, fontSize: 13, margin: '0 0 18px' }}>Les collaborateurs ne pourront plus connecter leur boutique Etsy tant que vous n'aurez pas enregistré de nouvelles clés.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmerEffacer(false)} style={{ flex: 1, padding: 10, border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              <button onClick={effacer} style={{ flex: 1, padding: 10, border: 'none', background: T.danger, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Effacer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}