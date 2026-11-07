// CHEMIN : src/pages/collaborateur/CollaborateurConfiguration.tsx
// e-Vend Studio — Dashboard collaborateur : configuration générale (vacances, délai, notifications, message)
// Adapté de ConfigurationGenerale.tsx (e-Vend). API : /api/collab/:gestionnaireId/configuration

import React, { useState, useEffect } from 'react';

interface Config {
  vacances: boolean; vacances_message: string; vacances_retour: string; vacances_debut: string; vacances_mode: 'visible' | 'masque'; delai_traitement_jours: number;
  notif_commande: boolean; notif_message: boolean; notif_avis: boolean; message_remerciement: string; avis_auto_approbation: boolean;
}
interface Props { gestionnaireId: number; accent: string; isMobile: boolean; naviguer?: (page: string) => void; }
interface VacInfo { permises: boolean; actif: boolean; messageDefaut: string; }
interface AvisInfo { permis: boolean; global: boolean; }
const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', ok: '#1E8449' };

export default function CollaborateurConfiguration({ gestionnaireId, accent, isMobile, naviguer }: Props) {
  const base = `/api/collab/${gestionnaireId}/configuration`;
  const [c, setC] = useState<Config | null>(null);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [vac, setVac] = useState<VacInfo>({ permises: true, actif: false, messageDefaut: '' });
  const [avisInfo, setAvisInfo] = useState<AvisInfo>({ permis: false, global: true });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(base, { credentials: 'include' });
        if (res.ok) {
          const d = await res.json();
          setVac({ permises: d.vacances_permises !== false, actif: !!d.vacances_actif_maintenant, messageDefaut: d.vacances_message_defaut || '' });
          setAvisInfo({ permis: !!d.avis_auto_permis, global: d.avis_auto_global !== false });
          setC({
            vacances: !!d.vacances, vacances_message: d.vacances_message || d.vacances_message_defaut || '', vacances_retour: d.vacances_retour ? String(d.vacances_retour).slice(0, 10) : '',
            vacances_debut: d.vacances_debut ? String(d.vacances_debut).slice(0, 10) : '', vacances_mode: d.vacances_mode === 'masque' ? 'masque' : 'visible',
            delai_traitement_jours: Number(d.delai_traitement_jours ?? 2), notif_commande: d.notif_commande !== false,
            notif_message: d.notif_message !== false, notif_avis: d.notif_avis !== false, message_remerciement: d.message_remerciement || '', avis_auto_approbation: !!d.avis_auto_approbation,
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

      {vac.permises && (() => {
        const aujourdhui = new Date().toISOString().slice(0, 10);
        const programme = c.vacances && !vac.actif && !!c.vacances_debut && c.vacances_debut > aujourdhui;
        const option = (valeur: 'visible' | 'masque', titre: string, aide: string) => (
          <label key={valeur} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', border: `1px solid ${c.vacances_mode === valeur ? accent : T.border}`, borderRadius: 10, marginBottom: 8, cursor: 'pointer', background: c.vacances_mode === valeur ? 'rgba(0,0,0,0.02)' : '#fff' }}>
            <input type="radio" name="vac_mode" checked={c.vacances_mode === valeur} onChange={() => setC({ ...c, vacances_mode: valeur })} style={{ marginTop: 3, accentColor: accent }} />
            <span><strong style={{ fontSize: 14, color: T.text }}>{titre}</strong><br /><span style={{ fontSize: 12, color: T.light }}>{aide}</span></span>
          </label>
        );
        return (
          <div style={{ ...carte, borderLeft: c.vacances ? `4px solid ${accent}` : `1px solid ${T.border}` }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
              <span><strong style={{ fontSize: 15, color: T.text }}>🌴 Mode vacances</strong><br /><span style={{ fontSize: 12, color: T.light }}>Prévient vos clients que vous êtes temporairement absent.</span></span>
              <input type="checkbox" checked={c.vacances} onChange={e => setC({ ...c, vacances: e.target.checked })} style={{ width: 22, height: 22, accentColor: accent, flexShrink: 0 }} />
            </label>
            {c.vacances && (
              <div style={{ marginTop: 14 }}>
                {(vac.actif || programme) && (
                  <div style={{ background: vac.actif ? '#FEF5E7' : '#EAF2F8', color: '#555', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
                    {vac.actif ? '🌴 Actif maintenant : vos clients voient le mode vacances.' : `🗓️ Programmé : s'activera le ${c.vacances_debut}.`}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0,1fr)' : 'minmax(0,1fr) minmax(0,1fr)', gap: 12, marginBottom: 14 }}>
                  <div><label style={lbl}>Début des vacances</label><input type="date" value={c.vacances_debut} onChange={e => setC({ ...c, vacances_debut: e.target.value })} style={champ} /><div style={{ fontSize: 11, color: T.light, marginTop: 4 }}>Vide = dès maintenant</div></div>
                  <div><label style={lbl}>Date de retour</label><input type="date" value={c.vacances_retour} onChange={e => setC({ ...c, vacances_retour: e.target.value })} style={champ} /><div style={{ fontSize: 11, color: T.light, marginTop: 4 }}>Le mode s'arrête seul à cette date</div></div>
                </div>
                <label style={lbl}>Pendant mes vacances</label>
                {option('visible', 'Garder mes annonces visibles', 'Un bandeau avertit les clients (page boutique, pages produit, paiement). Ils peuvent commander : vous traitez les commandes à votre retour.')}
                {option('masque', 'Masquer mes annonces', "Vos annonces et votre boutique disparaissent du catalogue, de la recherche et de la liste des boutiques. Un lien direct affiche « en vacances » et les achats sont fermés.")}
                <div style={{ fontSize: 12, color: T.light, margin: '4px 0 14px' }}>⏱️ Vos enchères en cours se terminent normalement (et se paient normalement). Vous ne pouvez pas en créer de nouvelles en mode « masquer ».</div>
                <label style={lbl}>Message affiché aux clients</label>
                <textarea value={c.vacances_message} onChange={e => setC({ ...c, vacances_message: e.target.value })} maxLength={300} rows={3} placeholder={vac.messageDefaut} style={{ ...champ, resize: 'vertical' }} />
                {vac.messageDefaut && c.vacances_message !== vac.messageDefaut && (
                  <button type="button" onClick={() => setC({ ...c, vacances_message: vac.messageDefaut })} style={{ marginTop: 6, background: 'none', border: 'none', color: accent, fontSize: 12, cursor: 'pointer', padding: 0 }}>↺ Remettre le message par défaut</button>
                )}
              </div>
            )}
          </div>
        );
      })()}
      {!vac.permises && (
        <div style={{ ...carte, color: T.light, fontSize: 13 }}>🌴 <strong>Mode vacances</strong> : cette fonction n'est pas activée par votre gestionnaire.</div>
      )}

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
        <h3 style={{ margin: '0 0 8px', fontSize: 15, color: T.text }}>⭐ Avis clients</h3>
        {avisInfo.global ? (
          <p style={{ fontSize: 13, color: T.light, margin: 0 }}>Les avis de vos clients sont publiés dès qu'ils sont envoyés.</p>
        ) : avisInfo.permis ? (
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
            <span><strong style={{ fontSize: 14, color: T.text }}>Publier automatiquement les avis de ma boutique</strong><br /><span style={{ fontSize: 12, color: T.light }}>Activé : chaque avis est publié tout de suite. Désactivé : votre gestionnaire l'approuve avant publication.</span></span>
            <input type="checkbox" checked={c.avis_auto_approbation} onChange={e => setC({ ...c, avis_auto_approbation: e.target.checked })} style={{ width: 20, height: 20, accentColor: accent }} />
          </label>
        ) : (
          <p style={{ fontSize: 13, color: T.light, margin: 0 }}>Les avis de vos clients sont approuvés par votre gestionnaire avant d'être publiés.</p>
        )}
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