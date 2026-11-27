// src/templates/annoncesSite/contactSite.tsx
// e-Vend Studio — Formulaire de contact du SITE (petites annonces). Même fonctionnement que les templates boutique :
// POST /api/studio/contact (anti-spam, quota et enregistrement dans Messagerie), champ piège + délai minimum de 3 s.
// Le message arrive au courriel du gestionnaire (ReplyTo = visiteur). Distinct du formulaire de chaque annonce.

import { useState, useRef } from 'react';

const limiter = (v: any, max: number): string => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max);
const nettoyer = (v: any, max: number): string => limiter(v, max * 2).replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim().slice(0, max);

export function FormulaireSite({ gid, couleur, police }: { gid: number; couleur: string; police?: string }) {
  const [f, setF] = useState({ nom: '', courriel: '', message: '' });
  const [piege, setPiege] = useState('');
  const [etat, setEtat] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [err, setErr] = useState('');
  const debut = useRef(Date.now());
  const actif = gid > 0;

  const champ: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '1.5px solid #d6d3cc', borderRadius: 8, fontSize: 15, fontFamily: police || 'inherit', boxSizing: 'border-box', background: '#fff', color: '#1f2937', outline: 'none' };
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: 6, textAlign: 'left' };
  const fin = (e: 'ok' | 'err') => { setEtat(e); setTimeout(() => setEtat('idle'), 4000); };

  const envoyer = async () => {
    const nom = nettoyer(f.nom, 100), courriel = nettoyer(f.courriel, 254), message = nettoyer(f.message, 5000);
    setErr('');
    if (!actif) { setErr("Aperçu : l'envoi est désactivé."); fin('err'); return; }
    if (message.length < 10) { setErr('Message trop court (minimum 10 caractères).'); fin('err'); return; }
    if (piege) { setF({ nom: '', courriel: '', message: '' }); fin('ok'); return; }   // champ piège rempli = robot : on fait semblant
    if (Date.now() - debut.current < 3000) { setErr("Veuillez patienter quelques secondes avant d'envoyer."); fin('err'); return; }
    setEtat('loading');
    try {
      const r = await fetch('/api/studio/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom_expediteur: nom, email_expediteur: courriel, message, vendeur_id: gid, template_id: 'annonces', honeypot: '', form_start_time: debut.current }),
      });
      if (!r.ok) { try { const j = await r.json(); if (j && typeof j.message === 'string') setErr(j.message.slice(0, 200)); } catch { /* réponse non JSON */ } throw new Error(); }
      setF({ nom: '', courriel: '', message: '' });
      fin('ok');
    } catch { fin('err'); }
  };

  if (etat === 'ok') {
    return (
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
        <h3 style={{ color: '#16a34a', margin: '0 0 8px' }}>Message envoyé !</h3>
        <p style={{ color: '#4b5563', margin: 0 }}>Nous vous répondrons dans les meilleurs délais.</p>
      </div>
    );
  }
  const pret = !!(f.nom && f.courriel && f.message);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
      <div><label style={lbl}>Votre nom</label><input value={f.nom} onChange={(e) => setF({ ...f, nom: limiter(e.target.value, 100) })} maxLength={100} placeholder="Jean Tremblay" style={champ} /></div>
      <div><label style={lbl}>Votre courriel</label><input type="email" value={f.courriel} onChange={(e) => setF({ ...f, courriel: limiter(e.target.value, 254) })} maxLength={254} placeholder="jean@exemple.ca" style={champ} /></div>
      <div><label style={lbl}>Votre message</label><textarea value={f.message} onChange={(e) => setF({ ...f, message: limiter(e.target.value, 5000) })} maxLength={5000} rows={5} placeholder="Décrivez votre question..." style={{ ...champ, resize: 'vertical' }} /></div>
      <div style={{ position: 'absolute', left: -9999, top: -9999, opacity: 0, pointerEvents: 'none' }} aria-hidden="true"><input type="text" name="website" maxLength={100} value={piege} onChange={(e) => setPiege(e.target.value)} tabIndex={-1} autoComplete="off" /></div>
      {etat === 'err' && <p style={{ color: '#ef4444', fontSize: 14, margin: 0, textAlign: 'left' }}>❌ {err || 'Erreur — vérifiez les champs et réessayez.'}</p>}
      <button onClick={envoyer} disabled={etat === 'loading' || !pret} style={{ background: couleur, color: '#fff', border: 'none', borderRadius: 10, padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: etat === 'loading' ? 'wait' : 'pointer', width: '100%', opacity: pret ? 1 : 0.5 }}>
        {etat === 'loading' ? '⏳ Envoi...' : 'Envoyer le message →'}
      </button>
    </div>
  );
}