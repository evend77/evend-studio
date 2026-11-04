// src/components/InscriptionInfolettre.tsx
// Section « Infolettre » affichée dans le bas de page des pages publiques de e-Vend Studio.
// Envoie l'adresse à POST /api/infolettre (validation du domaine + limite anti-spam côté serveur).

import { useState } from 'react';

const API_BASE = '/api';
const SOURCE = 'bas_de_page';
const REGEX_EMAIL = /^[^\s@<>"']+@[^\s@<>"']+\.[a-zA-Z]{2,}$/;

type Etat =
  | { type: 'repos' }
  | { type: 'envoi' }
  | { type: 'ok'; msg: string }
  | { type: 'erreur'; msg: string };

export default function InscriptionInfolettre() {
  const [email, setEmail] = useState('');
  const [etat, setEtat] = useState<Etat>({ type: 'repos' });

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (etat.type === 'envoi') return;
    const adresse = email.trim();
    if (!REGEX_EMAIL.test(adresse)) {
      setEtat({ type: 'erreur', msg: 'Entrez une adresse courriel valide.' });
      return;
    }
    setEtat({ type: 'envoi' });
    try {
      const r = await fetch(`${API_BASE}/infolettre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adresse, source: SOURCE }),
      });
      const data = await r.json().catch(() => ({} as any));
      if (r.ok) {
        setEtat({
          type: 'ok',
          msg: data.deja_inscrit
            ? 'Vous êtes déjà inscrit(e) à l’infolettre. Merci !'
            : 'Merci ! Vous êtes maintenant inscrit(e) à l’infolettre.',
        });
        setEmail('');
      } else {
        setEtat({ type: 'erreur', msg: data.error || data.message || 'Inscription impossible pour le moment. Réessayez plus tard.' });
      }
    } catch {
      setEtat({ type: 'erreur', msg: 'Erreur de connexion au serveur. Réessayez plus tard.' });
    }
  };

  const envoi = etat.type === 'envoi';

  return (
    <section className="sv-infolettre" aria-labelledby="sv-infolettre-titre" style={{
      maxWidth: '560px', margin: '0 auto 40px', padding: '28px 24px',
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px', textAlign: 'center',
    }}>
      <style>{`
        .sv-infolettre-form { display:flex; gap:8px; }
        .sv-infolettre-champ:focus { border-color:#fbbf24 !important; box-shadow:0 0 0 3px rgba(251,191,36,0.2); }
        .sv-infolettre-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 24px rgba(251,191,36,0.3); }
        @media (max-width: 520px) { .sv-infolettre-form { flex-direction:column; } .sv-infolettre-btn { width:100%; } }
      `}</style>

      <h3 id="sv-infolettre-titre" style={{ margin: '0 0 6px', fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 800, color: '#fff' }}>
        📬 Restez informé
      </h3>
      <p style={{ margin: '0 0 18px', fontSize: '14px', lineHeight: 1.6, color: 'rgba(255,255,255,0.6)' }}>
        Nouveautés, conseils et offres e-Vend Studio, directement dans votre boîte courriel.
      </p>

      <form className="sv-infolettre-form" onSubmit={envoyer} noValidate>
        <label htmlFor="sv-infolettre-email" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          Votre adresse courriel
        </label>
        <input
          id="sv-infolettre-email"
          className="sv-infolettre-champ"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="votre@courriel.com"
          value={email}
          maxLength={254}
          onChange={e => { setEmail(e.target.value); if (etat.type !== 'repos' && etat.type !== 'envoi') setEtat({ type: 'repos' }); }}
          disabled={envoi}
          style={{
            flex: 1, minWidth: 0, padding: '12px 14px', fontSize: '14px', color: '#fff',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px', outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          className="sv-infolettre-btn"
          disabled={envoi}
          style={{
            padding: '12px 22px', fontSize: '14px', fontWeight: 700, color: '#000', border: 'none',
            borderRadius: '10px', cursor: envoi ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            background: envoi ? 'rgba(251,191,36,0.5)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}
        >
          {envoi ? '⏳ Envoi…' : 'S’abonner'}
        </button>
      </form>

      <div role="status" aria-live="polite" style={{ minHeight: '20px', marginTop: '12px', fontSize: '13px', fontWeight: 600,
        color: etat.type === 'ok' ? '#4ade80' : etat.type === 'erreur' ? '#f87171' : 'transparent' }}>
        {etat.type === 'ok' && `✅ ${etat.msg}`}
        {etat.type === 'erreur' && `⚠️ ${etat.msg}`}
      </div>

      <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
        Pas de pourriel. Désabonnement possible en tout temps.
      </p>
    </section>
  );
}