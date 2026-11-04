// CHEMIN : src/pages/collaborateur/CollaborateurConfiguration.tsx
// e-Vend Studio — Dashboard collaborateur : configuration générale (vacances, délai, notifications, message)
// Adapté de ConfigurationGenerale.tsx (e-Vend). API : /api/collab/:gestionnaireId/configuration

import React, { useState, useEffect } from 'react';

interface Config {
  vacances: boolean; vacances_message: string; vacances_retour: string; delai_traitement_jours: number;
  notif_commande: boolean; notif_message: boolean; notif_avis: boolean; message_remerciement: string;
}
interface Props { gestionnaireId: number; accent: string; isMobile: boolean; naviguer?: (page: string) => void; }
const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', ok: '#1E8449' };

export default function CollaborateurConfiguration({ gestionnaireId, accent, isMobile, naviguer }: Props) {
  const base = `/api/collab/${gestionnaireId}/configuration`;
  const [c, setC] = useState<Config | null>(null);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(base, { credentials: 'include' });
        if (res.ok) {
          const d = await res.json();
          setC({
            vacances: !!d.vacances, vacances_message: d.vacances_message || '', vacances_retour: d.vacances_retour ? String(d.vacances_retour).slice(0, 10) : '',
            delai_traitement_jours: Number(d.delai_traitement_jours ?? 2), notif_commande: d.notif_commande !== false,
            notif_message: d.notif_message !== false, notif_avis: d.notif_avis !== false, message_remerciement: d.message_remerciement || '',
          });
        } else setMsg({ t: 'err', m: (await res.json().catch(() => ({}))).error || 'Chargement impossible' });
      } catch { setMsg({ t: 'err', m: 'Erreur réseau' }); }
    })();
  }, [base]);

  const enregistrer = async () => {
    if (!c) return;
    setOccupe(true); setMsg(null);
    try {
      const res = await fetch(base, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) });
      setMsg(res.ok ? { t: 'ok', m: '✅ Configuration enregistrée' } : { t: 'err', m: (await res.json().catch(() => ({}))).error || 'Enregistrement impossible' });
    } catch { setMsg({ t: 'err', m: 'Erreur réseau' }); }
    setOccupe(false);
  };

  const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase', marginBottom: 6 };
  const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 16 : 22, marginBottom: 16 };

  if (!c) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>{msg ? msg.m : 'Chargement…'}</div>;

  const interrupteur = (cle: 'notif_commande' | 'notif_message' | 'notif_avis', titre: string, aide: string) => (
    <label key={cle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}>
      <span><strong style={{ fontSize: 14, color: T.text }}>{titre}</strong><br /><span style={{ fontSize: 12, color: T.light }}>{aide}</span></span>
      <input type="checkbox" checked={c[cle]} onChange={e => setC({ ...c, [cle]: e.target.checked })} style={{ width: 20, height: 20, accentColor: accent }} />
    </label>
  );

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 14px', fontSize: 20, color: T.text }}>⚙️ Configuration générale</h2>
      {msg && <div style={{ background: msg.t === 'ok' ? '#E9F7EF' : '#FDECEA', color: msg.t === 'ok' ? T.ok : '#C0392B', padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{msg.m}</div>}

      <div style={{ ...carte, borderLeft: c.vacances ? `4px solid ${accent}` : `1px solid ${T.border}` }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
          <span><strong style={{ fontSize: 15, color: T.text }}>🌴 Mode vacances</strong><br /><span style={{ fontSize: 12, color: T.light }}>Prévient vos clients que vous êtes temporairement absent.</span></span>
          <input type="checkbox" checked={c.vacances} onChange={e => setC({ ...c, vacances: e.target.checked })} style={{ width: 22, height: 22, accentColor: accent }} />
        </label>
        {c.vacances && (
          <div style={{ marginTop: 14 }}>
            <label style={lbl}>Message affiché aux clients</label>
            <textarea value={c.vacances_message} onChange={e => setC({ ...c, vacances_message: e.target.value })} maxLength={300} rows={3} placeholder="Je suis en vacances, les commandes seront traitées à mon retour." style={{ ...champ, resize: 'vertical', marginBottom: 12 }} />
            <label style={lbl}>Date de retour</label>
            <input type="date" value={c.vacances_retour} onChange={e => setC({ ...c, vacances_retour: e.target.value })} style={{ ...champ, maxWidth: 220 }} />
          </div>
        )}
      </div>

      <div style={carte}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, color: T.text }}>📦 Traitement des commandes</h3>
        <label style={lbl}>Délai de traitement habituel (jours)</label>
        <input type="number" min={0} max={30} step={1} value={c.delai_traitement_jours} onChange={e => setC({ ...c, delai_traitement_jours: Number(e.target.value) })} style={{ ...champ, maxWidth: 140, marginBottom: 14 }} />
        <label style={lbl}>Message de remerciement après une commande</label>
        <textarea value={c.message_remerciement} onChange={e => setC({ ...c, message_remerciement: e.target.value })} maxLength={500} rows={3} placeholder="Merci pour votre achat !" style={{ ...champ, resize: 'vertical' }} />
      </div>

      <div style={carte}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, color: T.text }}>🔔 Notifications par courriel</h3>
        {interrupteur('notif_commande', 'Nouvelle commande', 'Un courriel à chaque commande reçue')}
        {interrupteur('notif_message', 'Nouveau message', 'Quand un acheteur ou votre gestionnaire vous écrit')}
        {interrupteur('notif_avis', 'Nouvel avis', 'Quand un client laisse un avis')}
      </div>

      <div style={carte}>
        <h3 style={{ margin: '0 0 8px', fontSize: 15, color: T.text }}>💳 Paiements</h3>
        <p style={{ fontSize: 13, color: T.light, margin: '0 0 12px' }}>Votre compte Stripe, qui reçoit directement vos ventes, se gère dans sa propre page.</p>
        <button onClick={() => naviguer?.('config-stripe')} style={{ border: `1px solid ${accent}`, color: accent, background: '#fff', borderRadius: 8, padding: '9px 16px', fontWeight: 700, cursor: 'pointer' }}>Ouvrir les paiements Stripe →</button>
      </div>

      <button disabled={occupe} onClick={enregistrer} style={{ padding: '11px 24px', border: 'none', background: accent, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
        {occupe ? '⏳ Enregistrement…' : '💾 Enregistrer'}
      </button>
    </div>
  );
}