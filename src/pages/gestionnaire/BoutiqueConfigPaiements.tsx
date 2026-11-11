// CHEMIN : src/pages/gestionnaire/BoutiqueConfigPaiements.tsx
// e-Vend Studio — « Config paiement » des templates boutique (solo) : Stripe et PayPal PROPRES au gestionnaire.
// L'argent va directement sur son compte. Studio ne prend aucune commission sur les ventes.
// API : /api/boutique/gestionnaire/paiement (GET, PUT, /stripe/tester, /stripe/webhook, /paypal/tester, /paypal/webhook, /deconnecter)

import React, { useEffect, useState } from 'react';
import { bq, messageErreur } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

interface EnvStripe { publish_key: string; secret_masque: string | null; webhook: boolean; pret: boolean; }
interface EnvPaypal { client_id: string; secret_masque: string | null; webhook: boolean; pret: boolean; }
interface Config {
  sandbox: boolean;
  devise: string;
  stripe: { actif: boolean; dev: EnvStripe; prod: EnvStripe; webhook_url: string };
  paypal: { actif: boolean; dev: EnvPaypal; prod: EnvPaypal; webhook_url: string };
}

interface Props {
  gestionnaireId: number;
  accent?: string;
}

type Fournisseur = 'stripe' | 'paypal';
type Msg = { type: 'erreur' | 'succes'; texte: string } | null;

const carte: React.CSSProperties = { background: '#fff', border: '1px solid #e1e4e8', borderRadius: 14, padding: 22, marginBottom: 18 };
const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid #e1e4e8', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'monospace', outline: 'none' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 5 };

function Pastille({ ok, texte }: { ok: boolean; texte: string }) {
  return <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: ok ? '#dcfce7' : '#f3f4f6', color: ok ? '#15803d' : '#6b7280' }}>{ok ? '✓' : '○'} {texte}</span>;
}

export default function BoutiqueConfigPaiements({ accent }: Props) {
  const couleur = accent || '#4f46e5';
  const [cfg, setCfg] = useState<Config | null>(null);
  const [chargement, setChargement] = useState(true);
  const [stripePub, setStripePub] = useState('');
  const [stripeSecret, setStripeSecret] = useState('');
  const [ppClient, setPpClient] = useState('');
  const [ppSecret, setPpSecret] = useState('');
  const [occupe, setOccupe] = useState('');
  const [msg, setMsg] = useState<Msg>(null);
  const [confirmerProd, setConfirmerProd] = useState(false);
  const [deconnecter, setDeconnecter] = useState<Fournisseur | null>(null);

  const appliquer = (c: Config) => {
    setCfg(c);
    const e = c.sandbox ? 'dev' : 'prod';
    setStripePub(c.stripe[e].publish_key || '');
    setPpClient(c.paypal[e].client_id || '');
    setStripeSecret(''); setPpSecret('');
  };

  useEffect(() => {
    bq('/paiement').then(r => {
      if (r.ok) appliquer(r.data as Config); else setMsg({ type: 'erreur', texte: messageErreur(r) });
      setChargement(false);
    });
  }, []);

  if (chargement) return <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>⏳ Chargement…</div>;
  if (!cfg) return <div style={{ padding: 40, textAlign: 'center', color: '#b91c1c' }}>{msg ? msg.texte : 'Configuration introuvable'}</div>;

  const env: 'dev' | 'prod' = cfg.sandbox ? 'dev' : 'prod';
  const modeTxt = cfg.sandbox ? 'test' : 'production';
  const s = cfg.stripe[env];
  const p = cfg.paypal[env];

  // Envoie un changement et applique la réponse du serveur (qui refuse toute activation incomplète)
  const sauver = async (corps: any, cle: string, succes?: string): Promise<boolean> => {
    setOccupe(cle);
    const r = await bq('/paiement', { method: 'PUT', body: corps });
    setOccupe('');
    if (r.ok) { appliquer(r.data as Config); if (succes) setMsg({ type: 'succes', texte: succes }); return true; }
    setMsg({ type: 'erreur', texte: messageErreur(r) });
    return false;
  };

  const action = async (chemin: string, cle: string, succes: (d: any) => string) => {
    setOccupe(cle);
    const r = await bq(chemin, { method: 'POST', body: {} });
    if (r.ok) {
      const maj = await bq('/paiement');
      if (maj.ok) appliquer(maj.data as Config);
      setMsg({ type: 'succes', texte: succes(r.data) });
    } else setMsg({ type: 'erreur', texte: messageErreur(r) });
    setOccupe('');
  };

  const enregistrerStripe = () => {
    const corps: any = { [`stripe_${env}_publish_key`]: stripePub };
    if (stripeSecret.trim()) corps[`stripe_${env}_secret_key`] = stripeSecret;
    sauver(corps, 'stripe-save', 'Clés Stripe enregistrées. Étape suivante : créez le webhook.');
  };
  const enregistrerPaypal = () => {
    const corps: any = { [`paypal_${env}_client_id`]: ppClient };
    if (ppSecret.trim()) corps[`paypal_${env}_secret`] = ppSecret;
    sauver(corps, 'paypal-save', 'Clés PayPal enregistrées. Étape suivante : créez le webhook.');
  };

  const changerMode = (sandbox: boolean) => {
    if (sandbox === cfg.sandbox) return;
    if (!sandbox) { setConfirmerProd(true); return; }
    sauver({ sandbox: true }, 'mode');
  };

  const etape = (n: number, ok: boolean): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: ok ? '#22c55e' : couleur, color: '#fff', fontSize: 12, fontWeight: 800, marginRight: 8, flexShrink: 0 });
  const btn = (principal: boolean, desactive?: boolean): React.CSSProperties => ({ padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: desactive ? 'not-allowed' : 'pointer', opacity: desactive ? 0.5 : 1, border: principal ? 'none' : '1px solid #e1e4e8', background: principal ? couleur : '#fff', color: principal ? '#fff' : '#1a2332' });
  const copier = (t: string) => { try { navigator.clipboard.writeText(t); setMsg({ type: 'succes', texte: 'Adresse copiée.' }); } catch (e) { /* tant pis */ } };

  const blocActivation = (f: Fournisseur, actif: boolean, pret: boolean) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 18, paddingTop: 16, borderTop: '1px solid #f0f1f3' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2332' }}><span style={etape(3, actif)}>{actif ? '✓' : '3'}</span>Accepter les paiements {f === 'stripe' ? 'par carte (Stripe)' : 'PayPal'}</div>
        {!pret && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Disponible une fois les clés enregistrées et le webhook créé (mode {modeTxt}).</div>}
      </div>
      <button disabled={(!pret && !actif) || occupe === `${f}-actif`} onClick={() => sauver({ [`${f}_actif`]: !actif }, `${f}-actif`)}
        style={{ position: 'relative', width: 54, height: 28, borderRadius: 20, border: 'none', cursor: (!pret && !actif) ? 'not-allowed' : 'pointer', background: actif ? '#22c55e' : '#d1d5db', opacity: (!pret && !actif) ? 0.5 : 1, transition: 'background .2s' }}
        aria-label={actif ? 'Désactiver' : 'Activer'}>
        <span style={{ position: 'absolute', top: 3, left: actif ? 29 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '8px 0 40px', fontFamily: "'Inter', sans-serif" }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#1a2332' }}>💳 Config paiement</h2>
      <p style={{ margin: '0 0 18px', fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
        Les paiements de vos clients vont <strong>directement dans votre propre compte</strong> Stripe ou PayPal. Studio ne prend aucune commission sur vos ventes.
      </p>

      <div style={carte}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1a2332' }}>Mode</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{cfg.sandbox ? 'Mode test : aucun vrai argent. Idéal pour essayer.' : 'Production : les vrais paiements sont acceptés.'}</div>
          </div>
          <div style={{ display: 'flex', gap: 0, border: '1px solid #e1e4e8', borderRadius: 10, overflow: 'hidden' }}>
            {([[true, '🧪 Test'], [false, '🟢 Production']] as [boolean, string][]).map(([v, nom]) => (
              <button key={nom} onClick={() => changerMode(v)} disabled={occupe === 'mode'}
                style={{ padding: '9px 18px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: cfg.sandbox === v ? couleur : '#fff', color: cfg.sandbox === v ? '#fff' : '#1a2332' }}>{nom}</button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 16, maxWidth: 240 }}>
          <label style={lbl}>Devise des paiements</label>
          <select value={cfg.devise} onChange={e => sauver({ devise: e.target.value }, 'devise')} style={{ ...champ, fontFamily: 'inherit' }}>
            <option value="CAD">Dollar canadien (CAD)</option>
            <option value="USD">Dollar américain (USD)</option>
          </select>
        </div>
      </div>

      {/* ───────── Stripe ───────── */}
      <div style={carte}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: '#1a2332' }}>💳 Stripe <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>(cartes de crédit)</span></h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Pastille ok={!!s.secret_masque && !!s.publish_key} texte="Clés" />
            <Pastille ok={s.webhook} texte="Webhook" />
            <Pastille ok={cfg.stripe.actif} texte={cfg.stripe.actif ? 'Actif' : 'Inactif'} />
          </div>
        </div>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 14px', lineHeight: 1.5 }}>
          Dans votre tableau de bord Stripe → Développeurs → Clés API ({cfg.sandbox ? 'activez le mode test' : 'mode production'}). Utilisez une clé secrète ou une clé restreinte.
        </p>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}><span style={etape(1, !!s.secret_masque && !!s.publish_key)}>{s.secret_masque && s.publish_key ? '✓' : '1'}</span>Vos clés ({modeTxt})</div>
        <label style={lbl}>Clé publique ({cfg.sandbox ? 'pk_test_…' : 'pk_live_…'})</label>
        <input value={stripePub} onChange={e => setStripePub(e.target.value)} placeholder={cfg.sandbox ? 'pk_test_…' : 'pk_live_…'} autoComplete="off" style={{ ...champ, marginBottom: 10 }} />
        <label style={lbl}>Clé secrète ({cfg.sandbox ? 'sk_test_…' : 'sk_live_…'})</label>
        <input type="password" value={stripeSecret} onChange={e => setStripeSecret(e.target.value)} placeholder={s.secret_masque ? `Enregistrée : ${s.secret_masque} — laissez vide pour la garder` : (cfg.sandbox ? 'sk_test_…' : 'sk_live_…')} autoComplete="new-password" style={champ} />
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={enregistrerStripe} disabled={occupe === 'stripe-save'} style={btn(true, occupe === 'stripe-save')}>{occupe === 'stripe-save' ? '⏳…' : '💾 Enregistrer les clés'}</button>
          <button onClick={() => action('/paiement/stripe/tester', 'stripe-test', d => `Connexion réussie${d.nom ? ` — ${d.nom}` : ''} (${d.account_id}).${d.paiements_actifs ? '' : ' Attention : Stripe n’a pas encore activé les paiements sur ce compte.'}`)} disabled={!s.secret_masque || occupe === 'stripe-test'} style={btn(false, !s.secret_masque)}>{occupe === 'stripe-test' ? '⏳…' : '🔌 Tester la connexion'}</button>
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, margin: '20px 0 6px' }}><span style={etape(2, s.webhook)}>{s.webhook ? '✓' : '2'}</span>Webhook (confirme les paiements automatiquement)</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => action('/paiement/stripe/webhook', 'stripe-wh', () => 'Webhook Stripe créé.')} disabled={!s.secret_masque || occupe === 'stripe-wh'} style={btn(true, !s.secret_masque)}>{occupe === 'stripe-wh' ? '⏳…' : s.webhook ? '🔄 Recréer le webhook' : '⚡ Créer le webhook'}</button>
          <button onClick={() => copier(cfg.stripe.webhook_url)} style={btn(false)}>📋 Copier l’adresse</button>
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6, wordBreak: 'break-all' }}>{cfg.stripe.webhook_url}</div>

        {blocActivation('stripe', cfg.stripe.actif, s.pret)}
        {(s.secret_masque || cfg.stripe.dev.secret_masque || cfg.stripe.prod.secret_masque) && (
          <div style={{ marginTop: 12 }}><button onClick={() => setDeconnecter('stripe')} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Déconnecter Stripe</button></div>
        )}
      </div>

      {/* ───────── PayPal ───────── */}
      <div style={carte}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: '#1a2332' }}>🅿️ PayPal</h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Pastille ok={!!p.secret_masque && !!p.client_id} texte="Clés" />
            <Pastille ok={p.webhook} texte="Webhook" />
            <Pastille ok={cfg.paypal.actif} texte={cfg.paypal.actif ? 'Actif' : 'Inactif'} />
          </div>
        </div>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 14px', lineHeight: 1.5 }}>
          Sur developer.paypal.com → Apps & Credentials ({cfg.sandbox ? 'onglet Sandbox' : 'onglet Live'}) : créez une application et copiez son Client ID et sa clé secrète.
        </p>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}><span style={etape(1, !!p.secret_masque && !!p.client_id)}>{p.secret_masque && p.client_id ? '✓' : '1'}</span>Vos clés ({modeTxt})</div>
        <label style={lbl}>Client ID</label>
        <input value={ppClient} onChange={e => setPpClient(e.target.value)} autoComplete="off" style={{ ...champ, marginBottom: 10 }} />
        <label style={lbl}>Clé secrète</label>
        <input type="password" value={ppSecret} onChange={e => setPpSecret(e.target.value)} placeholder={p.secret_masque ? `Enregistrée : ${p.secret_masque} — laissez vide pour la garder` : ''} autoComplete="new-password" style={champ} />
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={enregistrerPaypal} disabled={occupe === 'paypal-save'} style={btn(true, occupe === 'paypal-save')}>{occupe === 'paypal-save' ? '⏳…' : '💾 Enregistrer les clés'}</button>
          <button onClick={() => action('/paiement/paypal/tester', 'paypal-test', () => 'Connexion PayPal réussie.')} disabled={!p.secret_masque || occupe === 'paypal-test'} style={btn(false, !p.secret_masque)}>{occupe === 'paypal-test' ? '⏳…' : '🔌 Tester la connexion'}</button>
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, margin: '20px 0 6px' }}><span style={etape(2, p.webhook)}>{p.webhook ? '✓' : '2'}</span>Webhook (confirme les paiements automatiquement)</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => action('/paiement/paypal/webhook', 'paypal-wh', () => 'Webhook PayPal créé.')} disabled={!p.secret_masque || occupe === 'paypal-wh'} style={btn(true, !p.secret_masque)}>{occupe === 'paypal-wh' ? '⏳…' : p.webhook ? '🔄 Recréer le webhook' : '⚡ Créer le webhook'}</button>
          <button onClick={() => copier(cfg.paypal.webhook_url)} style={btn(false)}>📋 Copier l’adresse</button>
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6, wordBreak: 'break-all' }}>{cfg.paypal.webhook_url}</div>

        {blocActivation('paypal', cfg.paypal.actif, p.pret)}
        {(p.secret_masque || cfg.paypal.dev.secret_masque || cfg.paypal.prod.secret_masque) && (
          <div style={{ marginTop: 12 }}><button onClick={() => setDeconnecter('paypal')} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Déconnecter PayPal</button></div>
        )}
      </div>

      <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
        💡 Les taxes et les frais d’expédition se règlent dans leurs propres pages de configuration. Vos clés secrètes sont chiffrées et ne sont jamais réaffichées.
      </p>

      {msg && <BoutiqueModale type={msg.type} accent={couleur} message={msg.texte} onFermer={() => setMsg(null)} />}
      {confirmerProd && (
        <BoutiqueModale type="confirmer" accent={couleur} titre="Passer en production ?" enCours={occupe === 'mode'} texteConfirmer="Passer en production"
          message="Vos clients pourront payer pour de vrai. Vous devrez avoir enregistré vos clés de production et créé les webhooks pour ce mode avant d’activer Stripe ou PayPal."
          onConfirmer={async () => { await sauver({ sandbox: false }, 'mode'); setConfirmerProd(false); }}
          onFermer={() => { if (occupe !== 'mode') setConfirmerProd(false); }} />
      )}
      {deconnecter && (
        <BoutiqueModale type="confirmer" accent="#dc2626" titre={`Déconnecter ${deconnecter === 'stripe' ? 'Stripe' : 'PayPal'} ?`} texteConfirmer="Déconnecter" enCours={occupe === 'deco'}
          message="Les clés (test et production) et les webhooks seront retirés, et ce moyen de paiement sera désactivé dans votre boutique."
          onConfirmer={async () => {
            setOccupe('deco');
            const r = await bq('/paiement/deconnecter', { method: 'POST', body: { fournisseur: deconnecter } });
            setOccupe(''); setDeconnecter(null);
            if (r.ok) appliquer(r.data as Config); else setMsg({ type: 'erreur', texte: messageErreur(r) });
          }}
          onFermer={() => { if (occupe !== 'deco') setDeconnecter(null); }} />
      )}
    </div>
  );
}