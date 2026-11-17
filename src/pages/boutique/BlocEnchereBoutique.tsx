// CHEMIN : src/pages/boutique/BlocEnchereBoutique.tsx
// e-Vend Studio — Add-on « Enchères » (templates boutique solo) : bloc de la fiche produit (thème sombre). Adapté de BlocEnchere.tsx (MV).
// Montre : la mise actuelle, le compte à rebours, le champ de mise avec 3 montants rapides, et l'état de l'acheteur (en tête / surpassé).
// Le prix de réserve n'est jamais envoyé par le serveur : on sait seulement s'il est atteint. Toutes les règles (mise minimale, fin, prolongation) sont appliquées par le serveur.
// L'heure du serveur sert au compte à rebours (pas l'horloge de l'appareil). Rafraîchi toutes les 10 s.
// Partagé par tous les templates boutique solo. API : GET /api/boutique/encheres/:gid/produit/:id (public) · GET …/encheres/:gid/:id/mises · POST /api/boutique/acheteur/:gid/encheres/:id/miser

import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { ba, messageAcheteur } from './boutiqueAcheteurApi';
import { formaterPrix } from '../../templates/shared/devise';

interface Enchere {
  id: number; titre: string; prix_depart: number; mise_actuelle: number | null; prochaine_mise: number | null; increment: number;
  nb_mises: number; date_fin: string; reserve: { atteinte: boolean } | null; en_tete?: boolean;
}
interface Mise { montant: number; date: string; encherisseur: string }

interface Props {
  gestionnaireId: number;
  produitId: number;
  couleurAccent: string;
  isDemo?: boolean;
  allerConnexion: () => void;
}

// Mémoire entre deux affichages du composant (la fiche produit se remonte quand la page se redessine) : évite le clignotement
const MEMO: Record<string, { enchere: Enchere | null; decalage: number }> = {};

const typeCompte = (gId: number): string | null => { try { return JSON.parse(localStorage.getItem(`mv_compte_${gId}`) || 'null')?.type || null; } catch { return null; } };
const reste = (ms: number) => {
  if (ms <= 0) return 'Terminée';
  const s = Math.floor(ms / 1000), j = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (j > 0) return `${j} j ${h} h ${m} min`;
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min ${String(sec).padStart(2, '0')} s`;
  return `${m} min ${String(sec).padStart(2, '0')} s`;
};
const quand = (iso: string) => { try { return new Date(iso).toLocaleString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

export default function BlocEnchereBoutique({ gestionnaireId, produitId, couleurAccent, isDemo, allerConnexion }: Props) {
  const cle = `${gestionnaireId}:${produitId}`;
  const [enchere, setEnchere] = useState<Enchere | null>(() => (MEMO[cle] ? MEMO[cle].enchere : null));
  const [decalage, setDecalage] = useState<number>(() => (MEMO[cle] ? MEMO[cle].decalage : 0));   // heure du serveur − heure de l'appareil
  const [pret, setPret] = useState<boolean>(!!MEMO[cle]);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const [montant, setMontant] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');
  const [histo, setHisto] = useState<Mise[] | null>(null);
  const [histoOuvert, setHistoOuvert] = useState(false);
  const fini = useRef(false);

  const charger = useCallback(() => {
    if (isDemo) { setPret(true); return; }
    const headers: Record<string, string> = {};
    try { const t = localStorage.getItem(`mv_token_${gestionnaireId}`); if (t) headers.Authorization = `Bearer ${t}`; } catch { /* stockage indisponible */ }
    fetch(`/api/boutique/encheres/${gestionnaireId}/produit/${produitId}`, { credentials: 'include', headers })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d) { setPret(true); return; }
        const dec = d.maintenant ? new Date(d.maintenant).getTime() - Date.now() : 0;
        MEMO[cle] = { enchere: d.enchere || null, decalage: dec };
        setEnchere(d.enchere || null); setDecalage(dec); setPret(true);
      }).catch(() => setPret(true));
  }, [gestionnaireId, produitId, isDemo, cle]);

  useEffect(() => { charger(); const t = setInterval(charger, 10000); return () => clearInterval(t); }, [charger]);
  useEffect(() => { const t = setInterval(() => setMaintenant(Date.now()), 1000); return () => clearInterval(t); }, []);

  const msRestant = enchere ? new Date(enchere.date_fin).getTime() - (maintenant + decalage) : 0;
  // À la fin du compte à rebours, on redemande une fois au serveur (il termine l'enchère et la page se met à jour)
  useEffect(() => {
    if (enchere && msRestant <= 0 && !fini.current) { fini.current = true; setTimeout(charger, 1500); }
    if (enchere && msRestant > 0) fini.current = false;
  }, [enchere, msRestant, charger]);

  const chargerHisto = async () => {
    if (!enchere) return;
    try {
      const r = await fetch(`/api/boutique/encheres/${gestionnaireId}/${enchere.id}/mises`);
      const d = r.ok ? await r.json() : null; setHisto(d && Array.isArray(d.mises) ? d.mises : []);
    } catch { setHisto([]); }
  };

  if (!pret || !enchere) return null;

  const minimum = enchere.prochaine_mise ?? enchere.prix_depart;
  const rapides = [minimum, minimum + enchere.increment, minimum + enchere.increment * 2].map(v => Math.round(v * 100) / 100);
  const carte: CSSProperties = { width: '100%', marginBottom: 12, padding: '16px', borderRadius: 12, border: `1px solid ${couleurAccent}88`, background: 'rgba(255,255,255,0.05)', boxSizing: 'border-box' };
  const termine = msRestant <= 0;
  const urgent = !termine && msRestant < 5 * 60 * 1000;

  const miser = async (valeur?: number) => {
    if (isDemo) { setErreur('Produit de démonstration : aucune enchère réelle.'); return; }
    const t = typeCompte(gestionnaireId);
    if (!t) { allerConnexion(); return; }
    if (t !== 'acheteur') { setErreur('Un compte acheteur est requis pour miser.'); return; }
    const v = valeur !== undefined ? valeur : Number(String(montant).replace(',', '.'));
    if (!Number.isFinite(v) || v <= 0) { setErreur('Entrez un montant valide.'); return; }
    setOccupe(true); setErreur('');
    const r = await ba(gestionnaireId, `/encheres/${enchere.id}/miser`, { method: 'POST', body: { montant: v } });
    setOccupe(false);
    if (r.status === 401) { try { localStorage.removeItem(`mv_compte_${gestionnaireId}`); } catch { /* ignore */ } setErreur('Session expirée — reconnectez-vous.'); return; }
    if (!r.ok) { setErreur(messageAcheteur(r)); charger(); return; }
    setMontant(''); setInfo(`Mise de ${formaterPrix(v)} enregistrée : vous êtes en tête.`); setTimeout(() => setInfo(''), 5000);
    charger(); if (histoOuvert) chargerHisto();
  };

  return (
    <div style={carte}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>🔨 Vente aux enchères</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: urgent ? '#f87171' : couleurAccent }}>⏱ {reste(msRestant)}</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{formaterPrix(enchere.mise_actuelle !== null ? enchere.mise_actuelle : enchere.prix_depart)}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '4px 0 10px' }}>
        {enchere.mise_actuelle === null ? 'Prix de départ · aucune mise' : `${enchere.nb_mises} mise${enchere.nb_mises > 1 ? 's' : ''}`} · se termine le {quand(enchere.date_fin)}
        {enchere.reserve && <span style={{ marginLeft: 8, fontWeight: 700, color: enchere.reserve.atteinte ? '#6ee7b7' : '#fbbf24' }}>{enchere.reserve.atteinte ? '✓ Prix de réserve atteint' : 'Prix de réserve non atteint'}</span>}
      </div>

      {enchere.en_tete === true && !info && <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>✓ Vous avez la meilleure mise.</div>}
      {info && <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>✓ {info}</div>}

      {!termine && enchere.en_tete !== true && (
        <>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>Mise minimale : <b style={{ color: '#fff' }}>{formaterPrix(minimum)}</b> (incrément {formaterPrix(enchere.increment)})</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input inputMode="decimal" value={montant} onChange={e => setMontant(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && montant && !occupe) miser(); }} placeholder={`${minimum.toFixed(2)} $ ou plus`}
              style={{ flex: 1, minWidth: 0, padding: '11px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: 'inherit' }} />
            <button disabled={occupe || !montant} onClick={() => miser()} style={{ padding: '11px 18px', borderRadius: 10, border: 'none', background: couleurAccent, color: '#000', fontWeight: 800, fontSize: 14, cursor: occupe ? 'wait' : 'pointer', opacity: !montant ? 0.5 : 1, fontFamily: 'inherit' }}>{occupe ? '⏳' : 'Miser'}</button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {rapides.map(v => (
              <button key={v} disabled={occupe} onClick={() => miser(v)} style={{ padding: '7px 12px', borderRadius: 20, border: `1px solid ${couleurAccent}88`, background: 'transparent', color: couleurAccent, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{formaterPrix(v)}</button>
            ))}
          </div>
          {!typeCompte(gestionnaireId) && !isDemo && <div style={{ fontSize: 12, color: couleurAccent, fontWeight: 700, marginTop: 4 }}>Connectez-vous pour miser (une touche ci-dessus vous y amène).</div>}
        </>
      )}
      {erreur && <div style={{ marginTop: 6, color: '#fca5a5', fontSize: 13, fontWeight: 600 }}>{erreur}</div>}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 10, lineHeight: 1.5 }}>
        Une mise est un engagement d'achat. Une mise dans les 2 dernières minutes repousse la fin de 2 minutes. Le gagnant retrouve l'article dans son panier et dispose d'un délai limité pour payer. Suivez vos enchères dans « Mes enchères » de votre espace client.
      </div>
      <button onClick={() => { const o = !histoOuvert; setHistoOuvert(o); if (o) chargerHisto(); }} style={{ marginTop: 8, background: 'none', border: 'none', color: couleurAccent, fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>{histoOuvert ? '▾ Masquer les mises' : '▸ Voir les mises'}</button>
      {histoOuvert && (
        <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
          {histo === null ? 'Chargement…' : histo.length === 0 ? 'Aucune mise pour le moment.' : histo.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span>{m.encherisseur}</span><span><b>{formaterPrix(m.montant)}</b> <span style={{ color: 'rgba(255,255,255,0.45)' }}>· {quand(m.date)}</span></span>
            </div>))}
        </div>
      )}
    </div>
  );
}