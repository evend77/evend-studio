// CHEMIN : src/pages/boutique/MesEncheresBoutique.tsx
// e-Vend Studio — Espace acheteur des templates boutique solo : « Mes enchères » (add-on « Enchères »). Adapté de MesEncheres.tsx (MV).
// Onglets : En cours · Gagnées (à payer / payées) · Terminées. Le bouton « Payer » remet l'article gagné au panier (s'il en a été retiré) puis ouvre le panier.
// Session : cookie httpOnly ou jeton gardé dans le navigateur, via boutiqueAcheteurApi. Rafraîchi toutes les 15 s.
// API : GET /api/boutique/acheteur/:gid/encheres/mes · POST …/encheres/:id/remettre-panier

import { useState, useEffect, useCallback } from 'react';
import { ba, messageAcheteur } from './boutiqueAcheteurApi';
import { formaterPrix } from '../../templates/shared/devise';

interface Ligne {
  id: number; produit_id: number; titre: string; image_url: string | null; statut: string; etat: string; ma_mise: number;
  mise_actuelle: number | null; prix_final: number | null; date_fin: string; paiement_expire_le: string | null; dans_panier: boolean;
}
interface Props {
  gestionnaireId: number; isMobile?: boolean; couleurAccent?: string;
  naviguer?: (page: string) => void;
  onChange?: () => void;                 // prévient l'espace client (pastille du menu)
}

const C = { green: '#10b981', amber: '#f59e0b', red: '#ef4444', blue: '#3b82f6', grey: '#9ca3af', border: 'rgba(255,255,255,0.08)', textLight: 'rgba(255,255,255,0.5)', cardBg: 'rgba(255,255,255,0.03)' };
const ETATS: Record<string, { texte: string; couleur: string }> = {
  en_tete:      { texte: '🏆 Vous êtes en tête', couleur: C.green },
  surpasse:     { texte: '⚠️ Surpassé', couleur: C.amber },
  a_payer:      { texte: '🎉 Gagnée — à payer', couleur: C.green },
  payee:        { texte: '🛍️ Gagnée et payée', couleur: C.blue },
  expiree:      { texte: '⌛ Gagnée, délai de paiement dépassé', couleur: C.red },
  perdue:       { texte: 'Perdue', couleur: C.grey },
  annulee:      { texte: 'Annulée par le vendeur', couleur: C.grey },
  sans_gagnant: { texte: 'Terminée sans gagnant', couleur: C.grey },
};
const quand = (iso: string) => { try { return new Date(iso).toLocaleString('fr-CA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

export default function MesEncheresBoutique({ gestionnaireId, isMobile, couleurAccent = '#fbbf24', naviguer, onChange }: Props) {
  const [liste, setListe] = useState<Ligne[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState<number | null>(null);
  const [onglet, setOnglet] = useState<'cours' | 'gagnees' | 'terminees'>('cours');

  const charger = useCallback(async () => {
    const r = await ba(gestionnaireId, '/encheres/mes');
    if (r.ok) { setListe(r.data.encheres || []); setErreur(''); if (onChange) onChange(); }
    else if (r.status !== 401) setErreur(messageAcheteur(r));
    setChargement(false);
  }, [gestionnaireId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { charger(); const t = setInterval(charger, 15000); return () => clearInterval(t); }, [charger]);

  const payer = async (l: Ligne) => {
    setOccupe(l.id); setErreur('');
    const r = await ba(gestionnaireId, `/encheres/${l.id}/remettre-panier`, { method: 'POST', body: {} });
    setOccupe(null);
    if (!r.ok) { setErreur(messageAcheteur(r)); charger(); return; }
    if (onChange) onChange();
    if (naviguer) naviguer('panier');
  };

  const enCours = liste.filter(l => l.etat === 'en_tete' || l.etat === 'surpasse');
  const gagnees = liste.filter(l => l.etat === 'a_payer' || l.etat === 'payee');
  const terminees = liste.filter(l => !['en_tete', 'surpasse', 'a_payer', 'payee'].includes(l.etat));
  const vue = onglet === 'cours' ? enCours : onglet === 'gagnees' ? gagnees : terminees;
  const aPayer = liste.filter(l => l.etat === 'a_payer').length;

  const tab = (id: typeof onglet, label: string, n: number) => (
    <button key={id} onClick={() => setOnglet(id)} style={{ padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      border: `1px solid ${onglet === id ? couleurAccent : C.border}`, background: onglet === id ? `${couleurAccent}22` : 'transparent', color: onglet === id ? couleurAccent : 'rgba(255,255,255,0.7)' }}>{label} ({n})</button>
  );
  const bouton = (fond: string, texte: string, bordure?: string) => ({ padding: '9px 16px', borderRadius: 10, border: bordure ? `1px solid ${bordure}` : 'none', background: fond, color: texte, fontWeight: 800 as const, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' });

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: C.textLight }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>🔨 Mes enchères</h2>
      <p style={{ fontSize: 13, color: C.textLight, margin: '0 0 16px' }}>Les enchères sur lesquelles vous avez misé. Une enchère gagnée doit être payée avant la date limite, sinon elle est annulée.</p>

      {aPayer > 0 && <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, color: '#fcd34d', fontSize: 14, fontWeight: 700 }}>
        🔔 {aPayer} enchère{aPayer > 1 ? 's gagnées attendent' : ' gagnée attend'} votre paiement.</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>{tab('cours', 'En cours', enCours.length)}{tab('gagnees', 'Gagnées', gagnees.length)}{tab('terminees', 'Terminées', terminees.length)}</div>
      {erreur && <div style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{erreur}</div>}

      {vue.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 14 }}>
          <div style={{ fontSize: 42, marginBottom: 8 }}>🔨</div>
          <p style={{ color: C.textLight, margin: 0 }}>Aucune enchère ici.</p>
          <button onClick={() => naviguer && naviguer('boutique')} style={{ ...bouton(couleurAccent, '#000'), marginTop: 14 }}>Voir la boutique</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {vue.map(l => {
            const et = ETATS[l.etat] || { texte: l.etat, couleur: C.grey };
            return (
              <div key={l.id} style={{ display: 'flex', gap: 14, background: C.cardBg, border: `1px solid ${et.couleur}44`, borderRadius: 14, padding: 14, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ width: isMobile ? '100%' : 96, height: isMobile ? 160 : 96, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {l.image_url ? <img src={l.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 30, opacity: 0.3 }}>🔨</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{l.titre}</div>
                  <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 20, color: et.couleur, background: `${et.couleur}22`, marginBottom: 8 }}>{et.texte}</span>
                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                    <span>Ma mise : <strong style={{ color: '#fff' }}>{formaterPrix(l.ma_mise)}</strong></span>
                    {l.statut === 'active' && l.mise_actuelle !== null && <span>Mise actuelle : <strong style={{ color: '#fff' }}>{formaterPrix(l.mise_actuelle)}</strong></span>}
                    {l.prix_final !== null && <span>Prix final : <strong style={{ color: '#6ee7b7' }}>{formaterPrix(l.prix_final)}</strong></span>}
                    {l.statut === 'active' ? <span style={{ color: C.amber }}>⏳ se termine le {quand(l.date_fin)}</span> : <span>Terminée le {quand(l.date_fin)}</span>}
                    {l.etat === 'a_payer' && l.paiement_expire_le && <span style={{ color: C.amber }}>À payer avant le {quand(l.paiement_expire_le)}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    {l.etat === 'a_payer' && <button disabled={occupe === l.id} onClick={() => payer(l)} style={bouton(C.green, '#000')}>{occupe === l.id ? '⏳…' : `🛒 Payer ${formaterPrix(Number(l.prix_final))}`}</button>}
                    {l.statut === 'active' && <button onClick={() => naviguer && naviguer(`produit:${l.produit_id}`)} style={bouton(l.etat === 'surpasse' ? couleurAccent : 'transparent', l.etat === 'surpasse' ? '#000' : couleurAccent, couleurAccent)}>{l.etat === 'surpasse' ? 'Surenchérir' : "Voir l'enchère"}</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}