// CHEMIN : src/pages/collaborateur/CollaborateurCompte.tsx
// e-Vend Studio — Dashboard collaborateur : mon compte (coordonnées + mot de passe)
// Adapté de MonCompte.tsx (e-Vend). API : /api/collab/:gestionnaireId/profil

import React, { useState, useEffect } from 'react';

interface Props { gestionnaireId: number; accent: string; isMobile: boolean; }
const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626', ok: '#1E8449' };

export default function CollaborateurCompte({ gestionnaireId, accent, isMobile }: Props) {
  const base = `/api/collab/${gestionnaireId}/profil`;
  const [f, setF] = useState({ nom_responsable: '', telephone: '', type_entreprise: '' });
  const [courriel, setCourriel] = useState('');
  const [depuis, setDepuis] = useState('');
  const [mdp, setMdp] = useState({ actuel: '', nouveau: '', confirmation: '' });
  const [chargement, setChargement] = useState(true);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);
  const [msgMdp, setMsgMdp] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(base, { credentials: 'include' });
        if (res.ok) {
          const p = await res.json();
          setF({ nom_responsable: p.nom_responsable || '', telephone: p.telephone || '', type_entreprise: p.type_entreprise || '' });
          setCourriel(p.email || '');
          setDepuis(p.created_at ? new Date(p.created_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : '');
        } else setMsg({ t: 'err', m: (await res.json().catch(() => ({}))).error || 'Chargement impossible' });
      } catch { setMsg({ t: 'err', m: 'Erreur réseau' }); }
      setChargement(false);
    })();
  }, [base]);

  const enregistrer = async () => {
    setOccupe(true); setMsg(null);
    try {
      const res = await fetch(base, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      setMsg(res.ok ? { t: 'ok', m: '✅ Coordonnées enregistrées' } : { t: 'err', m: (await res.json().catch(() => ({}))).error || 'Enregistrement impossible' });
    } catch { setMsg({ t: 'err', m: 'Erreur réseau' }); }
    setOccupe(false);
  };

  const changerMdp = async () => {
    setMsgMdp(null);
    if (mdp.nouveau !== mdp.confirmation) { setMsgMdp({ t: 'err', m: 'Les deux nouveaux mots de passe ne correspondent pas' }); return; }
    setOccupe(true);
    try {
      const res = await fetch(`${base}/mot-de-passe`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actuel: mdp.actuel, nouveau: mdp.nouveau }) });
      if (res.ok) { setMsgMdp({ t: 'ok', m: '✅ Mot de passe modifié' }); setMdp({ actuel: '', nouveau: '', confirmation: '' }); }
      else setMsgMdp({ t: 'err', m: (await res.json().catch(() => ({}))).error || 'Changement impossible' });
    } catch { setMsgMdp({ t: 'err', m: 'Erreur réseau' }); }
    setOccupe(false);
  };

  const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase', marginBottom: 6 };
  const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 16 : 22, marginBottom: 16 };
  const alerte = (m: { t: 'ok' | 'err'; m: string } | null) => m && (
    <div style={{ background: m.t === 'ok' ? '#E9F7EF' : '#FDECEA', color: m.t === 'ok' ? T.ok : '#C0392B', padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{m.m}</div>
  );

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 14px', fontSize: 20, color: T.text }}>👤 Mon compte</h2>

      <div style={carte}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, color: T.text }}>Coordonnées</h3>
        {alerte(msg)}
        <label style={lbl}>Courriel de connexion</label>
        <input value={courriel} disabled style={{ ...champ, background: '#f3f4f6', color: T.light, marginBottom: 4 }} />
        <p style={{ fontSize: 11, color: T.light, margin: '0 0 14px' }}>Pour changer votre courriel, contactez votre gestionnaire.{depuis && ` Membre depuis le ${depuis}.`}</p>
        <label style={lbl}>Nom du responsable *</label>
        <input value={f.nom_responsable} onChange={e => setF({ ...f, nom_responsable: e.target.value })} maxLength={80} style={{ ...champ, marginBottom: 14 }} />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div><label style={lbl}>Téléphone</label><input value={f.telephone} onChange={e => setF({ ...f, telephone: e.target.value })} maxLength={30} placeholder="514-555-1234" style={champ} /></div>
          <div><label style={lbl}>Type d'entreprise</label><input value={f.type_entreprise} onChange={e => setF({ ...f, type_entreprise: e.target.value })} maxLength={40} style={champ} /></div>
        </div>
        <button disabled={occupe || !f.nom_responsable.trim()} onClick={enregistrer} style={{ padding: '10px 20px', border: 'none', background: accent, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          💾 Enregistrer
        </button>
      </div>

      <div style={carte}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, color: T.text }}>Mot de passe</h3>
        {alerte(msgMdp)}
        <label style={lbl}>Mot de passe actuel</label>
        <input type="password" autoComplete="current-password" value={mdp.actuel} onChange={e => setMdp({ ...mdp, actuel: e.target.value })} style={{ ...champ, marginBottom: 14 }} />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 6 }}>
          <div><label style={lbl}>Nouveau mot de passe</label><input type="password" autoComplete="new-password" value={mdp.nouveau} onChange={e => setMdp({ ...mdp, nouveau: e.target.value })} style={champ} /></div>
          <div><label style={lbl}>Confirmer</label><input type="password" autoComplete="new-password" value={mdp.confirmation} onChange={e => setMdp({ ...mdp, confirmation: e.target.value })} style={champ} /></div>
        </div>
        <p style={{ fontSize: 11, color: T.light, margin: '0 0 16px' }}>8 caractères minimum, avec au moins une lettre et un chiffre.</p>
        <button disabled={occupe || !mdp.actuel || !mdp.nouveau} onClick={changerMdp} style={{ padding: '10px 20px', border: 'none', background: accent, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          🔑 Changer le mot de passe
        </button>
      </div>
    </div>
  );
}