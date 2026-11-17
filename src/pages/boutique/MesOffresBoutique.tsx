// CHEMIN : src/pages/boutique/MesOffresBoutique.tsx
// e-Vend Studio — Espace acheteur des templates boutique solo : « Mes offres » (add-on « Faire une offre »). Adapté de MesOffres.tsx (MV).
// Session : cookie httpOnly (credentials: 'include') ou jeton gardé dans le navigateur, via boutiqueAcheteurApi.
// API : GET /api/boutique/acheteur/:gid/negociations/mes · POST …/negociations/:id/(accepter|panier|retirer)

import { useState, useEffect, useCallback } from 'react';
import { ba, messageAcheteur } from './boutiqueAcheteurApi';
import { formaterPrix } from '../../templates/shared/devise';

interface Offre {
  id: number; produit_id: number; titre: string; variante: string; photo: string | null;
  prix_produit: number; prix_offert: number; prix_contre: number | null; prix_final: number | null;
  message_vendeur: string | null; etat: string; expire: string;
}
interface Props {
  gestionnaireId: number; isMobile?: boolean; couleurAccent?: string;
  naviguer?: (page: string) => void;
  onChange?: () => void;                 // prévient l'espace client (pastille du menu)
}

const C = { green: '#10b981', amber: '#f59e0b', red: '#ef4444', blue: '#3b82f6', grey: '#9ca3af', border: 'rgba(255,255,255,0.08)', textLight: 'rgba(255,255,255,0.5)', cardBg: 'rgba(255,255,255,0.03)' };
const ETATS: Record<string, { texte: string; couleur: string }> = {
  attente:  { texte: '⏳ En attente du vendeur', couleur: C.amber },
  contre:   { texte: '💬 Contre-offre à répondre', couleur: C.amber },
  acceptee: { texte: '✅ Prix accepté — à payer', couleur: C.green },
  payee:    { texte: '🛍️ Achetée', couleur: C.blue },
  refusee:  { texte: 'Refusée', couleur: C.red },
  annulee:  { texte: 'Retirée', couleur: C.grey },
  expiree:  { texte: '⌛ Expirée', couleur: C.grey },
};
const VIVANTES = ['attente', 'contre', 'acceptee'];
const quand = (iso: string) => { try { return new Date(iso).toLocaleString('fr-CA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

export default function MesOffresBoutique({ gestionnaireId, isMobile, couleurAccent = '#fbbf24', naviguer, onChange }: Props) {
  const [liste, setListe] = useState<Offre[]>([]);
  const [chargement, setChargement] = useState(true);
  const [actif, setActif] = useState(true);
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState<number | null>(null);
  const [onglet, setOnglet] = useState<'cours' | 'terminees'>('cours');
  const [aRetirer, setARetirer] = useState<Offre | null>(null);

  const charger = useCallback(async () => {
    const r = await ba(gestionnaireId, '/negociations/mes');
    if (r.ok) { setListe(r.data.offres || []); setActif(r.data.addon_actif !== false); setErreur(''); }
    else setErreur(messageAcheteur(r));
    setChargement(false);
  }, [gestionnaireId]);
  useEffect(() => { charger(); }, [charger]);

  const agir = async (o: Offre, action: 'accepter' | 'panier' | 'retirer') => {
    setOccupe(o.id); setErreur('');
    const r = await ba(gestionnaireId, `/negociations/${o.id}/${action}`, { method: 'POST', body: {} });
    setOccupe(null);
    if (!r.ok) { setErreur(messageAcheteur(r)); return; }
    if (onChange) onChange();
    if (action === 'panier') { if (naviguer) naviguer('panier'); return; }
    await charger();
  };

  const enCours = liste.filter(o => VIVANTES.includes(o.etat));
  const terminees = liste.filter(o => !VIVANTES.includes(o.etat));
  const vue = onglet === 'cours' ? enCours : terminees;
  const aRepondre = liste.filter(o => o.etat === 'contre' || o.etat === 'acceptee').length;

  const tab = (id: typeof onglet, label: string, n: number) => (
    <button key={id} onClick={() => setOnglet(id)} style={{ padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      border: `1px solid ${onglet === id ? couleurAccent : C.border}`, background: onglet === id ? `${couleurAccent}22` : 'transparent', color: onglet === id ? couleurAccent : 'rgba(255,255,255,0.7)' }}>{label} ({n})</button>
  );
  const bouton = (fond: string, texte: string, bordure?: string) => ({ padding: '9px 16px', borderRadius: 10, border: bordure ? `1px solid ${bordure}` : 'none', background: fond, color: texte, fontWeight: 800 as const, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' });

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: C.textLight }}>Chargement…</div>;
  if (!actif && liste.length === 0) return <div style={{ padding: 40, textAlign: 'center', color: C.textLight }}>Les offres de prix ne sont pas offertes par cette boutique.</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>🤝 Mes offres</h2>
      <p style={{ fontSize: 13, color: C.textLight, margin: '0 0 16px' }}>Vos propositions de prix. Un prix accepté doit être payé avant la date limite — le produit n'est pas réservé entre-temps.</p>

      {aRepondre > 0 && <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, color: '#fcd34d', fontSize: 14, fontWeight: 700 }}>
        🔔 {aRepondre} offre{aRepondre > 1 ? 's attendent' : ' attend'} une action de votre part.</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>{tab('cours', 'En cours', enCours.length)}{tab('terminees', 'Terminées', terminees.length)}</div>
      {erreur && <div style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{erreur}</div>}

      {vue.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 14 }}>
          <div style={{ fontSize: 42, marginBottom: 8 }}>🤝</div>
          <p style={{ color: C.textLight, margin: 0 }}>Aucune offre ici. Sur une fiche produit, touchez « Faire une offre ».</p>
          <button onClick={() => naviguer && naviguer('boutique')} style={{ ...bouton(couleurAccent, '#000'), marginTop: 14 }}>Voir le catalogue</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {vue.map(o => {
            const et = ETATS[o.etat] || { texte: o.etat, couleur: C.grey };
            const vivante = VIVANTES.includes(o.etat);
            return (
              <div key={o.id} style={{ display: 'flex', gap: 14, background: C.cardBg, border: `1px solid ${et.couleur}44`, borderRadius: 14, padding: 14, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ width: isMobile ? '100%' : 96, height: isMobile ? 160 : 96, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {o.photo ? <img src={o.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 30, opacity: 0.3 }}>🤝</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{o.titre}{o.variante ? ` — ${o.variante}` : ''}</div>
                  <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 20, color: et.couleur, background: `${et.couleur}22`, marginBottom: 8 }}>{et.texte}</span>
                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                    <span>Prix affiché : <strong style={{ color: '#fff' }}>{formaterPrix(o.prix_produit)}</strong></span>
                    <span>Mon offre : <strong style={{ color: '#fff' }}>{formaterPrix(o.prix_offert)}</strong></span>
                    {o.prix_contre !== null && <span>Contre-offre : <strong style={{ color: '#fff' }}>{formaterPrix(o.prix_contre)}</strong></span>}
                    {o.etat === 'acceptee' && o.prix_final !== null && <span>Prix à payer : <strong style={{ color: '#6ee7b7' }}>{formaterPrix(o.prix_final)}</strong></span>}
                    {vivante && <span style={{ color: C.amber }}>⏳ jusqu'au {quand(o.expire)}</span>}
                  </div>
                  {o.message_vendeur && <div style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>Vendeur : « {o.message_vendeur} »</div>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    {o.etat === 'contre' && <button disabled={occupe === o.id} onClick={() => agir(o, 'accepter')} style={bouton(couleurAccent, '#000')}>Accepter {formaterPrix(Number(o.prix_contre))}</button>}
                    {o.etat === 'acceptee' && <button disabled={occupe === o.id} onClick={() => agir(o, 'panier')} style={bouton(C.green, '#000')}>🛒 Payer {formaterPrix(Number(o.prix_final))}</button>}
                    {vivante && <button disabled={occupe === o.id} onClick={() => setARetirer(o)} style={bouton('transparent', '#fca5a5', 'rgba(239,68,68,0.5)')}>{o.etat === 'contre' ? 'Décliner' : o.etat === 'acceptee' ? 'Renoncer' : 'Retirer'}</button>}
                    {!vivante && <button onClick={() => naviguer && naviguer(`produit:${o.produit_id}`)} style={bouton('transparent', couleurAccent, couleurAccent)}>Voir le produit</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {aRetirer && (
        <div onClick={() => setARetirer(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: '#1a1a24', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: 22, color: '#fff', textAlign: 'center', boxSizing: 'border-box' }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{aRetirer.etat === 'attente' ? 'Retirer cette offre ?' : aRetirer.etat === 'contre' ? 'Décliner la contre-offre ?' : 'Renoncer à cette offre ?'}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 16 }}>« {aRetirer.titre} » — vous pourrez refaire une offre plus tard.</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => setARetirer(null)} style={bouton('rgba(255,255,255,0.12)', '#fff')}>Garder</button>
              <button onClick={async () => { const o = aRetirer; setARetirer(null); await agir(o, 'retirer'); }} style={bouton(C.red, '#fff')}>Oui, confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}