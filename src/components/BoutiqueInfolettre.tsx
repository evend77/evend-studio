// CHEMIN : src/components/BoutiqueInfolettre.tsx
// e-Vend Studio — Add-on « Infolettre » (boutique solo) : rangée d'inscription dans le pied de page, sous les colonnes du menu.
// Les textes viennent du serveur (GET /api/boutique/infolettre/:gid/config) ; rien ne s'affiche si l'add-on est inactif, en pause ou pas configuré (404).
// Anti-robot : champ piège invisible + délai minimum depuis l'affichage (vérifiés aussi par le serveur). Case de consentement non cochée au départ.

import React, { useEffect, useRef, useState } from 'react';

const API_BASE = '/api';
interface Cfg { afficher_footer: boolean; titre: string; texte: string; placeholder: string; texte_bouton: string; texte_succes: string; consentement_texte: string; consentement_obligatoire: boolean }

export default function BoutiqueInfolettre({ gestionnaireId, couleur = '#c9a96e' }: { gestionnaireId: number; couleur?: string }) {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [piege, setPiege] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [fait, setFait] = useState(false);
  const debut = useRef(Date.now());

  useEffect(() => {
    let vivant = true;
    fetch(`${API_BASE}/boutique/infolettre/${gestionnaireId}/config`).then(r => (r.ok ? r.json() : null)).then(c => { if (vivant && c && c.afficher_footer) { setCfg(c); debut.current = Date.now(); } }).catch(() => {});
    return () => { vivant = false; };
  }, [gestionnaireId]);

  if (!cfg) return null;

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (envoi) return;
    setErreur('');
    if (!email.trim()) { setErreur('Entrez votre adresse courriel.'); return; }
    if (cfg.consentement_obligatoire && !consent) { setErreur('Veuillez cocher la case de consentement.'); return; }
    setEnvoi(true);
    try {
      const r = await fetch(`${API_BASE}/boutique/infolettre/${gestionnaireId}/inscription`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), consentement: consent, source: 'footer', site_web: piege, t: Date.now() - debut.current }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { setFait(true); setEmail(''); } else setErreur(j.error || "L'inscription a échoué. Réessayez.");
    } catch (x) { setErreur('Connexion impossible. Réessayez.'); }
    setEnvoi(false);
  };

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '28px 0 8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{cfg.titre}</div>
          {cfg.texte && <div style={{ fontSize: 13, color: '#777', lineHeight: 1.5 }}>{cfg.texte}</div>}
        </div>
        {fait ? (
          <div role="status" style={{ flex: '1 1 320px', maxWidth: 460, fontSize: 14, color: couleur, fontWeight: 600, lineHeight: 1.5 }}>✓ {cfg.texte_succes}</div>
        ) : (
          <form onSubmit={envoyer} noValidate style={{ flex: '1 1 320px', maxWidth: 460, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
              <input type="email" value={email} onChange={ev => setEmail(ev.target.value)} placeholder={cfg.placeholder} aria-label={cfg.placeholder} autoComplete="email" maxLength={254}
                style={{ flex: 1, minWidth: 0, padding: '11px 18px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              <button type="submit" disabled={envoi}
                style={{ padding: '11px 22px', borderRadius: 999, border: 'none', background: couleur, color: '#000', fontWeight: 700, fontSize: 14, cursor: envoi ? 'wait' : 'pointer', whiteSpace: 'nowrap', opacity: envoi ? 0.7 : 1, fontFamily: 'inherit' }}>{envoi ? '…' : cfg.texte_bouton}</button>
            </div>
            {/* Piège anti-robot : invisible pour une vraie personne */}
            <div aria-hidden="true" style={{ position: 'absolute', left: -9999, top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
              <label>Site web <input type="text" tabIndex={-1} autoComplete="off" value={piege} onChange={ev => setPiege(ev.target.value)} /></label>
            </div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 10, fontSize: 12, color: '#777', lineHeight: 1.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={consent} onChange={ev => setConsent(ev.target.checked)} style={{ marginTop: 2, accentColor: couleur, flexShrink: 0 }} />
              <span>{cfg.consentement_texte}</span>
            </label>
            {erreur && <div role="alert" style={{ marginTop: 8, fontSize: 12, color: '#f87171' }}>{erreur}</div>}
          </form>
        )}
      </div>
    </div>
  );
}