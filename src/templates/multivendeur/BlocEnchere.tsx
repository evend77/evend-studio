// CHEMIN : src/templates/multivendeur/BlocEnchere.tsx
// e-Vend Studio — Bloc d'enchère (thème sombre) : mise actuelle, compte à rebours, formulaire de mise.
// Utilisé sur la fiche produit. Toutes les règles (incrément, prolongation, réserve) sont appliquées par le serveur ;
// ce composant ne fait qu'afficher et envoyer le montant.

import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = '/api';

export interface EnchereVue {
  id: number;
  produit_id: number;
  titre: string;
  prix_depart: number;
  mise_actuelle: number | null;
  prochaine_mise: number | null;
  increment: number;
  nb_mises: number;
  date_fin: string;
  reserve: { atteinte: boolean } | null;
  en_tete?: boolean;
}

interface Props {
  gId: number | string;
  produitId: number;
  couleurAccent: string;
  naviguer: (p: any) => void;
  /** appelé quand l'enchère se termine, pour que la page recharge le produit */
  onTerminee?: () => void;
  /** appelé quand on sait si une enchère est en cours (la page cache alors « Ajouter au panier ») */
  onEtat?: (active: boolean) => void;
}

export function formaterDuree(ms: number): string {
  if (ms <= 0) return 'Terminée';
  const t = Math.floor(ms / 1000);
  const j = Math.floor(t / 86400), h = Math.floor((t % 86400) / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
  if (j > 0) return `${j} j ${h} h ${m} min`;
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min ${String(sec).padStart(2, '0')} s`;
  return `${m} min ${String(sec).padStart(2, '0')} s`;
}

function typeCompte(gId: number | string): string | null {
  try { return JSON.parse(localStorage.getItem(`mv_compte_${gId}`) || 'null')?.type || null; } catch { return null; }
}

export default function BlocEnchere({ gId, produitId, couleurAccent, naviguer, onTerminee, onEtat }: Props) {
  const [e, setE] = useState<EnchereVue | null>(null);
  const [chargee, setChargee] = useState(false);
  const [maintenant, setMaintenant] = useState(Date.now());
  const [montant, setMontant] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texte: string } | null>(null);
  const saisieModifiee = useRef(false);
  const terminee = useRef(false);

  const charger = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/marketplace/${gId}/encheres/produit/${produitId}`, { credentials: 'include' });
      if (!r.ok) return;
      const d = await r.json();
      setE(d.enchere || null);
      onEtat?.(!!d.enchere);
      if (d.enchere && d.enchere.prochaine_mise != null && !saisieModifiee.current) setMontant(Number(d.enchere.prochaine_mise).toFixed(2));
      if (!d.enchere && terminee.current) onTerminee?.();
    } catch { /* réseau : on réessaie au prochain tour */ }
    finally { setChargee(true); }
  }, [gId, produitId]);

  useEffect(() => { charger(); const t = setInterval(charger, 10000); return () => clearInterval(t); }, [charger]);
  useEffect(() => { const t = setInterval(() => setMaintenant(Date.now()), 1000); return () => clearInterval(t); }, []);

  const reste = e ? new Date(e.date_fin).getTime() - maintenant : 0;
  useEffect(() => {
    if (e && reste <= 0 && !terminee.current) { terminee.current = true; setTimeout(charger, 1500); }
    if (e && reste > 0) terminee.current = false;
  }, [e, reste, charger]);

  if (!chargee || !e) return null;

  const fini = reste <= 0;
  const compte = typeCompte(gId);

  const miser = async () => {
    setMsg(null);
    if (!compte) { setMsg({ ok: false, texte: 'Connectez-vous pour miser.' }); return; }
    if (compte !== 'acheteur') { setMsg({ ok: false, texte: 'Un compte acheteur est requis pour miser.' }); return; }
    const m = parseFloat(montant.replace(',', '.'));
    if (!(m > 0)) { setMsg({ ok: false, texte: 'Entrez un montant valide.' }); return; }
    setEnvoi(true);
    try {
      const r = await fetch(`${API_BASE}/marketplace/${gId}/encheres/${e.id}/miser`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ montant: m }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.status === 401) { try { localStorage.removeItem(`mv_compte_${gId}`); } catch { /* ignore */ } setMsg({ ok: false, texte: 'Session expirée — reconnectez-vous.' }); }
      else if (r.ok) {
        saisieModifiee.current = false;
        setMsg({ ok: true, texte: '✓ Mise acceptée — vous êtes en tête !' });
        await charger();
      } else {
        setMsg({ ok: false, texte: d.error || 'Mise refusée.' });
        saisieModifiee.current = false;
        await charger();
      }
    } catch { setMsg({ ok: false, texte: 'Erreur réseau.' }); }
    setEnvoi(false);
  };

  const dernieresMinutes = !fini && reste < 120000;
  const prochaine = e.prochaine_mise != null ? Number(e.prochaine_mise) : null;

  return (
    <div className="mvb-box" style={{ border: `1px solid ${couleurAccent}55`, background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 18, marginBottom: 18, minWidth: 0, maxWidth: '100%' }}>
      <style>{`@media (max-width:768px){ .mvb-box{ padding:14px !important; } .mvb-box button{ flex-shrink:0; } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: couleurAccent, textTransform: 'uppercase' }}>🔨 Vente aux enchères</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: dernieresMinutes ? '#f87171' : 'rgba(255,255,255,0.75)' }}>
          ⏱ {formaterDuree(reste)}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 30, fontWeight: 800, color: '#fff' }}>
          {(e.mise_actuelle ?? e.prix_depart).toFixed(2)} $
        </span>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          {e.mise_actuelle == null ? 'mise de départ' : `mise actuelle · ${e.nb_mises} mise${e.nb_mises > 1 ? 's' : ''}`}
        </span>
      </div>

      {e.reserve && (
        <p style={{ fontSize: 12, margin: '6px 0 0', fontWeight: 600, color: e.reserve.atteinte ? '#6ee7b7' : '#fbbf24' }}>
          {e.reserve.atteinte ? '✓ Prix de réserve atteint' : 'Prix de réserve non atteint'}
        </p>
      )}

      {e.en_tete && !fini && (
        <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', fontSize: 13, fontWeight: 700 }}>
          ✓ Vous avez la mise la plus haute
        </div>
      )}

      {!fini && prochaine != null && !e.en_tete && (
        <div style={{ marginTop: 14 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
            Votre mise (minimum {prochaine.toFixed(2)} $)
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number" inputMode="decimal" min={prochaine} step="0.01" value={montant}
              onChange={(ev) => { saisieModifiee.current = true; setMontant(ev.target.value); }}
              onKeyDown={(ev) => ev.key === 'Enter' && !envoi && miser()}
              style={{ flex: 1, minWidth: 0, padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 16, outline: 'none', fontFamily: 'inherit' }}
            />
            <button onClick={miser} disabled={envoi}
              style={{ padding: '12px 20px', borderRadius: 10, border: 'none', background: couleurAccent, color: '#000', fontWeight: 800, fontSize: 15, cursor: envoi ? 'wait' : 'pointer', opacity: envoi ? 0.6 : 1, whiteSpace: 'nowrap' }}>
              {envoi ? '...' : 'Miser'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {[0, 1, 2].map((k) => {
              const v = prochaine + k * (e.increment || 1);
              return (
                <button key={k} onClick={() => { saisieModifiee.current = true; setMontant(v.toFixed(2)); }}
                  style={{ padding: '5px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer' }}>
                  {v.toFixed(2)} $
                </button>
              );
            })}
          </div>
        </div>
      )}

      {msg && (
        <div style={{ marginTop: 10, padding: '9px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: msg.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.ok ? '#6ee7b7' : '#fca5a5' }}>
          {msg.texte}
        </div>
      )}

      {!compte && !fini && (
        <button onClick={() => naviguer({ page: 'login' })}
          style={{ marginTop: 10, background: 'none', border: 'none', color: couleurAccent, fontSize: 13, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
          Se connecter pour miser
        </button>
      )}

      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '12px 0 0', lineHeight: 1.5 }}>
        Une mise est un engagement d'achat. Une mise dans les 2 dernières minutes prolonge l'enchère de 2 minutes.
        Taxes et livraison en sus. Le gagnant a un délai limité pour payer.
      </p>
    </div>
  );
}