// CHEMIN : src/pages/acheteur/MesOffres.tsx
// e-Vend Studio — Dashboard acheteur : mes offres de prix (add-on « Faire une offre »).
// Session : cookie httpOnly (credentials: 'include').
// API : GET /api/marketplace/:gid/negociations/acheteur/mes · POST …/acheteur/:id/(accepter|panier|retirer)

import { useState, useEffect, useCallback } from 'react';
import { formaterPrix } from '../../templates/shared/devise';

const API = '/api';

interface Offre {
  id: number; produit_id: number; titre: string; variante: string; photo: string | null;
  prix_produit: number; prix_offert: number; prix_contre: number | null; prix_final: number | null;
  message_vendeur: string | null; etat: string; expire: string;
}
interface Props {
  gestionnaireId: number; isMobile?: boolean; couleurAccent?: string;
  naviguer?: (page: string) => void;
  onVoirProduit?: (produitId: number) => void;
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
const quand = (iso: string) => { try { return new Date(iso).toLocaleString('fr-CA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

export default function MesOffres({ gestionnaireId, isMobile, couleurAccent = '#fbbf24', naviguer, onVoirProduit }: Props) {
  const base = `${API}/marketplace/${gestionnaireId}/negociations`;
  const [liste, setListe] = useState<Offre[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState<number | null>(null);
  const [onglet, setOnglet] = useState<'cours' | 'terminees'>('cours');

  const charger = useCallback(async () => {
    try {
      const r = await fetch(`${base}/acheteur/mes`, { credentials: 'include' });
      if (r.ok) { setListe((await r.json()).offres || []); setErreur(''); }
      else setErreur((await r.json().catch(() => ({}))).error || 'Chargement impossible');
    } catch { setErreur('Erreur réseau'); }
    setChargement(false);
  }, [base]);
  useEffect(() => { charger(); }, [charger]);

  const agir = async (o: Offre, action: 'accepter' | 'panier' | 'retirer') => {
    setOccupe(o.id); setErreur('');
    try {
      const r = await fetch(`${base}/acheteur/${o.id}/${action}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setErreur(j.error || 'Erreur');
      else if (action === 'panier') naviguer?.('panier');
      else await charger();
    } catch { setErreur('Erreur réseau'); }
    setOccupe(null);
  };

  const enCours = liste.filter(o => ['attente', 'contre', 'acceptee'].includes(o.etat));
  const terminees = liste.filter(o => !['attente', 'contre', 'acceptee'].includes(o.etat));
  const vue = onglet === 'cours' ? enCours : terminees;
  const aRepondre = liste.filter(o => o.etat === 'contre' || o.etat === 'acceptee').length;

  const tab = (id: typeof onglet, label: string, n: number) => (
    <button key={id} onClick={() => setOnglet(id)} style={{ padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      border: `1px solid ${onglet === id ? couleurAccent : C.border}`, background: onglet === id ? `${couleurAccent}22` : 'transparent', color: onglet === id ? couleurAccent : 'rgba(255,255,255,0.7)' }}>{label} ({n})</button>
  );
  const bouton = (fond: string, texte: string, bordure?: string) => ({ padding: '9px 16px', borderRadius: 10, border: bordure ? `1px solid ${bordure}` : 'none', background: fond, color: texte, fontWeight: 800 as const, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' });

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: C.textLight }}>Chargement…</div>;

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
          <button onClick={() => naviguer?.('boutique')} style={{ ...bouton(couleurAccent, '#000'), marginTop: 14 }}>Voir le catalogue</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {vue.map(o => {
            const et = ETATS[o.etat] || { texte: o.etat, couleur: C.grey };
            const vivante = ['attente', 'contre', 'acceptee'].includes(o.etat);
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
                    {vivante && <button disabled={occupe === o.id} onClick={() => { if (window.confirm(o.etat === 'attente' ? 'Retirer cette offre ?' : 'Renoncer à cette offre ?')) agir(o, 'retirer'); }} style={bouton('transparent', '#fca5a5', 'rgba(239,68,68,0.5)')}>{o.etat === 'contre' ? 'Décliner' : o.etat === 'acceptee' ? 'Renoncer' : 'Retirer'}</button>}
                    {(o.etat === 'refusee' || o.etat === 'expiree' || o.etat === 'annulee') && <button onClick={() => onVoirProduit?.(o.produit_id)} style={bouton('transparent', couleurAccent, couleurAccent)}>Voir le produit</button>}
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