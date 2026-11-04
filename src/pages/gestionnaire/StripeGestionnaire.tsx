// CHEMIN : src/pages/gestionnaire/StripeGestionnaire.tsx
import React, { useState, useEffect } from 'react';

const THEME = {
  accent: '#2d6a9f', border: '#e1e4e8', text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706', card: '#ffffff',
};

// ── Petits composants (inline, pas de fichier helper) ────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ width: 48, height: 26, borderRadius: 13, cursor: 'pointer', background: value ? '#0d9488' : '#d1d5db', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: value ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 13, fontWeight: 700, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '32px 0 20px', paddingBottom: 10, borderBottom: `2px solid ${THEME.accent}` }}>
      {children}
    </h3>
  );
}

function NoteBox({ children, type = 'info' }: { children: React.ReactNode; type?: 'warning' | 'info' | 'success' }) {
  const c = {
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
  }[type];
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 24 }}>
      <p style={{ fontSize: 13, color: c.text, margin: 0, lineHeight: 1.7 }}>{children}</p>
    </div>
  );
}

function Champ({ label, note, value, onChange, placeholder, type = 'text', width = '440px', secret = false, suffix }: {
  label: string; note?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; width?: string; secret?: boolean; suffix?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginBottom: 28 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <input type={secret && !show ? 'password' : type} value={value} placeholder={placeholder}
            onChange={e => onChange(e.target.value)} autoComplete="off"
            style={{ width, padding: secret ? '10px 42px 10px 14px' : '10px 14px', border: `2px solid ${THEME.border}`, borderRadius: 8, fontSize: 14, color: THEME.text, background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: secret ? 'monospace' : 'inherit' }} />
          {secret && (
            <button type="button" onClick={() => setShow(!show)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: 0 }}>
              {show ? '🙈' : '👁️'}
            </button>
          )}
        </div>
        {suffix && <span style={{ fontSize: 13, color: THEME.textLight, fontWeight: 600 }}>{suffix}</span>}
      </div>
      {note && <p style={{ fontSize: 12, color: THEME.textLight, margin: '6px 0 0', lineHeight: 1.5 }}>{note}</p>}
    </div>
  );
}

function Badge({ ok, okLabel, koLabel }: { ok: boolean; okLabel: string; koLabel: string }) {
  const color = ok ? THEME.success : THEME.warning;
  return (
    <span style={{ background: color + '18', color, border: `1px solid ${color}40`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
      {ok ? '✅ ' + okLabel : '⚠️ ' + koLabel}
    </span>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function StripeGestionnaire(_props: { gestionnaireId?: number }) {
  // Même authentification que les autres pages gestionnaire (token + cookie)
  const token = localStorage.getItem('token');
  const auth: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState<'principal' | 'connect' | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'danger' } | null>(null);

  // Config reçue du serveur (JAMAIS de clé secrète en clair — seulement masquée)
  const [cfg, setCfg] = useState<any>({});
  // Valeurs saisies (les clés secrètes restent vides = inchangées)
  const [form, setForm] = useState<any>({});
  const [collaborateurs, setCollaborateurs] = useState<any[]>([]);

  const showToast = (msg: string, type: 'success' | 'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const val = (k: string, def: any = '') => (form[k] !== undefined ? form[k] : (cfg[k] ?? def));

  const charger = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/gestionnaire/stripe', { credentials: 'include', headers: auth });
      if (r.ok) { setCfg(await r.json()); setForm({}); }
      const r2 = await fetch('/api/gestionnaire/stripe/collaborateurs', { credentials: 'include', headers: auth });
      if (r2.ok) setCollaborateurs(await r2.json());
    } catch (e) {
      showToast('Erreur de chargement de la configuration Stripe', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const sandbox: boolean = val('sandbox', true);
  const env = sandbox ? 'dev' : 'prod';
  const cleSecreteEnregistree = !!cfg[`${env}_secret_key_masque`];
  const aDesModifs = Object.keys(form).length > 0;

  const sauvegarder = async (silencieux = false): Promise<boolean> => {
    setSaving(true);
    try {
      const r = await fetch('/api/gestionnaire/stripe', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify(form),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Erreur de sauvegarde');
      if (!silencieux) showToast('Configuration Stripe sauvegardée', 'success');
      await charger();
      return true;
    } catch (e: any) {
      showToast(e.message, 'danger');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const tester = async () => {
    setTesting(true);
    try {
      if (aDesModifs && !(await sauvegarder(true))) return;
      const r = await fetch('/api/gestionnaire/stripe/tester', { method: 'POST', credentials: 'include', headers: auth });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Connexion Stripe impossible');
      showToast(`Connexion OK — compte ${data.account_id || ''}${data.connect_actif ? ' (Connect actif)' : ' (Connect non activé)'}`, data.connect_actif ? 'success' : 'danger');
      await charger();
    } catch (e: any) {
      showToast(e.message, 'danger');
    } finally {
      setTesting(false);
    }
  };

  const enregistrerWebhook = async (type: 'principal' | 'connect') => {
    setWebhookLoading(type);
    try {
      if (aDesModifs && !(await sauvegarder(true))) return;
      const r = await fetch('/api/gestionnaire/stripe/webhook/register', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify({ type }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Erreur enregistrement webhook');
      showToast(type === 'principal' ? 'Webhook principal enregistré' : 'Webhook Connect enregistré', 'success');
      await charger();
    } catch (e: any) {
      showToast(e.message, 'danger');
    } finally {
      setWebhookLoading(null);
    }
  };

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: THEME.textLight }}>⏳ Chargement de la configuration Stripe...</div>;
  }

  const wh = (cfg.webhooks && cfg.webhooks[env]) || {};
  const btn = (bg: string, disabled: boolean): React.CSSProperties => ({
    backgroundColor: disabled ? '#999' : bg, color: 'white', border: 'none', borderRadius: 8,
    padding: '11px 22px', fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
  });

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, backgroundColor: toast.type === 'success' ? THEME.success : THEME.danger, color: 'white', padding: '14px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>💳 Mon compte Stripe</h1>
          <p style={{ fontSize: 13, color: THEME.textLight, margin: 0 }}>Connecte ton propre compte Stripe pour que tes collaborateurs (vendeurs) y lient le leur et que les paiements de ta boutique passent par toi.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={tester} disabled={testing || !cleSecreteEnregistree && !val(`${env}_secret_key`)} style={btn(THEME.accent, testing || (!cleSecreteEnregistree && !val(`${env}_secret_key`)))}>
            {testing ? '⏳ Test...' : '🔍 Tester la connexion'}
          </button>
          <button onClick={() => sauvegarder()} disabled={saving || !aDesModifs} style={btn(THEME.success, saving || !aDesModifs)}>
            {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: THEME.card, borderRadius: 12, border: `1px solid ${THEME.border}`, padding: '8px 32px 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

        {/* Statut */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
          <Badge ok={cleSecreteEnregistree} okLabel="Clés enregistrées" koLabel="Clés manquantes" />
          <Badge ok={!!cfg.connect_actif} okLabel="Connect actif" koLabel="Connect non vérifié" />
          <Badge ok={!!wh.principal} okLabel="Webhook principal" koLabel="Webhook principal absent" />
          <Badge ok={!!wh.connect} okLabel="Webhook Connect" koLabel="Webhook Connect absent" />
        </div>

        {/* Identifiants */}
        <SectionTitle>🔑 Identifiants Stripe</SectionTitle>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 18px', borderBottom: `1px solid ${THEME.border}`, marginBottom: 20 }}>
          <div style={{ paddingRight: 40 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: THEME.text, margin: '0 0 2px' }}>Mode test (Sandbox)</p>
            <p style={{ fontSize: 12, color: THEME.textLight, margin: 0 }}>Activé : aucun vrai paiement. Désactive-le seulement quand tes clés de production sont enregistrées.</p>
          </div>
          <Toggle value={sandbox} onChange={v => set('sandbox', v)} />
        </div>

        {sandbox
          ? <NoteBox type="warning">⚠️ Mode test — utilise tes clés de test (pk_test_ / sk_test_).</NoteBox>
          : <NoteBox type="success">✅ Mode production — les vrais paiements seront traités. Vérifie tes clés live.</NoteBox>}

        <Champ label={sandbox ? 'Clé publique de test (Publishable key)' : 'Clé publique de production (Publishable key)'}
          note="Dashboard Stripe → Développeurs → Clés API → Clé publiable"
          value={val(`${env}_publish_key`)} onChange={v => set(`${env}_publish_key`, v.trim())}
          placeholder={sandbox ? 'pk_test_...' : 'pk_live_...'} />

        <Champ label={sandbox ? 'Clé secrète de test (Secret key)' : 'Clé secrète de production (Secret key)'}
          note={cleSecreteEnregistree
            ? `🔒 Clé enregistrée et chiffrée : ${cfg[`${env}_secret_key_masque`]}. Laisse vide pour la conserver, ou colle une nouvelle clé pour la remplacer.`
            : 'Dashboard Stripe → Développeurs → Clés API → Clé secrète. Elle sera chiffrée avant d\'être enregistrée.'}
          value={form[`${env}_secret_key`] || ''} onChange={v => set(`${env}_secret_key`, v.trim())}
          placeholder={cleSecreteEnregistree ? '•••••••• (inchangée)' : (sandbox ? 'sk_test_...' : 'sk_live_...')} secret />

        <Champ label={sandbox ? 'Client ID de test (optionnel)' : 'Client ID de production (optionnel)'}
          note="Dashboard Stripe → Connect → Paramètres. Nécessaire seulement pour le mode OAuth (comptes Standard)."
          value={val(`${env}_client_id`)} onChange={v => set(`${env}_client_id`, v.trim())} placeholder="ca_..." />

        {/* Webhooks */}
        <SectionTitle>⚡ Webhooks (automatiques)</SectionTitle>

        <NoteBox type="info">
          📡 Pas besoin d'aller dans le dashboard Stripe : enregistre tes clés, puis clique sur les deux boutons. Studio crée les webhooks sur <strong>ton</strong> compte Stripe et garde leurs secrets de signature, chiffrés. Si tu cliques de nouveau, un nouveau webhook est créé — supprime l'ancien dans Stripe.
        </NoteBox>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 380px' }}>
            <button onClick={() => enregistrerWebhook('principal')}
              disabled={webhookLoading !== null || (!cleSecreteEnregistree && !form[`${env}_secret_key`])}
              style={btn(THEME.accent, webhookLoading !== null || (!cleSecreteEnregistree && !form[`${env}_secret_key`]))}>
              {webhookLoading === 'principal' ? '⏳ Enregistrement...' : '🔗 Enregistrer le webhook principal'}
            </button>
            <p style={{ fontSize: 11, color: '#999', margin: '8px 0 0' }}>Votre compte : paiements, remboursements, litiges.</p>
            {cfg.webhook_urls?.principal && <p style={{ fontSize: 11, color: THEME.textLight, margin: '4px 0 0', wordBreak: 'break-all' }}>URL : <code>{cfg.webhook_urls.principal}</code></p>}
          </div>
          <div style={{ flex: '1 1 380px' }}>
            <button onClick={() => enregistrerWebhook('connect')}
              disabled={webhookLoading !== null || (!cleSecreteEnregistree && !form[`${env}_secret_key`])}
              style={btn('#635bff', webhookLoading !== null || (!cleSecreteEnregistree && !form[`${env}_secret_key`]))}>
              {webhookLoading === 'connect' ? '⏳ Enregistrement...' : '🔗 Enregistrer le webhook Connect (collaborateurs)'}
            </button>
            <p style={{ fontSize: 11, color: '#999', margin: '8px 0 0' }}>Comptes connectés : activation des comptes, versements, litiges.</p>
            {cfg.webhook_urls?.connect && <p style={{ fontSize: 11, color: THEME.textLight, margin: '4px 0 0', wordBreak: 'break-all' }}>URL : <code>{cfg.webhook_urls.connect}</code></p>}
          </div>
        </div>

        {/* Collaborateurs */}
        <SectionTitle>👥 Options pour mes collaborateurs</SectionTitle>

        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Type de compte Stripe des collaborateurs</label>
          {[
            { v: 'express', l: 'Express (recommandé) — onboarding simplifié géré par Stripe' },
            { v: 'standard', l: 'Standard — le collaborateur gère son propre compte Stripe complet' },
          ].map(o => (
            <label key={o.v} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 10, fontSize: 14, color: THEME.text }}>
              <input type="radio" name="typeCompte" checked={val('account_type', 'express') === o.v}
                onChange={() => set('account_type', o.v)} style={{ accentColor: THEME.accent, width: 16, height: 16 }} />
              {o.l}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <Champ label="Commission sur chaque vente" note="Pourcentage que tu gardes sur la vente d'un collaborateur (0 = aucune)."
            value={String(val('commission_taux', '0'))} onChange={v => set('commission_taux', v)} type="number" width="120px" suffix="%" />
          <Champ label="Frais fixe par vente" note="Montant fixe ajouté à ta commission (0 = aucun)."
            value={String(val('commission_fixe', '0'))} onChange={v => set('commission_fixe', v)} type="number" width="120px" suffix="$" />
        </div>

        {/* Liste des collaborateurs connectés */}
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: THEME.text, margin: '0 0 12px' }}>
            Collaborateurs connectés à ton Stripe ({collaborateurs.length})
          </p>
          {collaborateurs.length === 0 ? (
            <p style={{ fontSize: 13, color: THEME.textLight, margin: 0 }}>Aucun collaborateur n'a encore lié son compte Stripe.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f0f4f8' }}>
                  {['Collaborateur', 'Courriel', 'Statut', 'Connecté le'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: THEME.textLight, textTransform: 'uppercase', borderBottom: `2px solid ${THEME.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {collaborateurs.map((c: any, i: number) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: `1px solid ${THEME.border}` }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: THEME.text }}>{c.nom}</td>
                    <td style={{ padding: '10px 12px', color: THEME.textLight }}>{c.email}</td>
                    <td style={{ padding: '10px 12px' }}><Badge ok={c.statut === 'active'} okLabel="Actif" koLabel={c.statut === 'pending' ? 'En attente' : (c.statut || 'Inconnu')} /></td>
                    <td style={{ padding: '10px 12px', color: THEME.textLight }}>{c.connected_at ? new Date(c.connected_at).toLocaleDateString('fr-CA') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <NoteBox type="warning">
          ⚠️ <strong>Important :</strong> ton compte Stripe doit avoir <strong>Connect activé</strong> et ton profil de plateforme approuvé par Stripe pour que tes collaborateurs puissent se lier. Le bouton « Tester la connexion » te dit si c'est le cas.
        </NoteBox>
      </div>
    </div>
  );
}