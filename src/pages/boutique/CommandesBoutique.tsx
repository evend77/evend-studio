// CHEMIN : src/pages/boutique/CommandesBoutique.tsx
// e-Vend Studio — « Mes commandes » de l'acheteur, templates boutique (solo). Lit /api/boutique/acheteur/<gestionnaire>/commandes
// (les commandes BQ-… ; la page du multivendeur ne les voit pas).

import React, { useCallback, useEffect, useState } from 'react';
import { ba, messageAcheteur, argent } from './boutiqueAcheteurApi';

interface Props { gestionnaireId: number; couleurAccent?: string; isMobile?: boolean; naviguer?: (p: string) => void; }

export function statutCommande(c: { statut: string; statut_paiement: string }): { texte: string; couleur: string } {
  if (c.statut === 'annulee') return { texte: 'Annulée', couleur: '#ef4444' };
  if (c.statut_paiement !== 'paye') return { texte: 'En attente de paiement', couleur: '#f59e0b' };
  if (c.statut === 'expediee') return { texte: 'Expédiée', couleur: '#06b6d4' };
  if (c.statut === 'livree') return { texte: 'Livrée', couleur: '#10b981' };
  return { texte: 'Confirmée', couleur: '#3b82f6' };
}

export default function CommandesBoutique({ gestionnaireId: gid, couleurAccent, naviguer }: Props) {
  const accent = couleurAccent || '#fbbf24';
  const [liste, setListe] = useState<any[] | null>(null);
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(async () => {
    const r = await ba(gid, '/commandes');
    if (r.ok) setListe(r.data.commandes); else { setMsg(messageAcheteur(r)); setListe([]); }
  }, [gid]);
  useEffect(() => { charger(); }, [charger]);

  const annuler = async (numero: string) => {
    setOccupe(true); setMsg('');
    const r = await ba(gid, `/commandes/${encodeURIComponent(numero)}/annuler`, { method: 'POST' });
    setMsg(r.ok ? r.data.message : messageAcheteur(r));
    await charger(); setOccupe(false);
  };

  if (!liste) return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>⏳ Chargement…</div>;
  const carte: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, marginBottom: 12, overflow: 'hidden' };

  return (
    <div>
      <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 800, margin: '0 0 16px' }}>📦 Mes commandes</h1>
      {msg && <div style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.35)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{msg}</div>}
      {liste.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.5)' }}>Aucune commande pour le moment.<br /><br />
          {naviguer && <button onClick={() => naviguer('boutique')} style={{ background: accent, color: '#000', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>Découvrir la boutique</button>}</div>
      )}
      {liste.map(c => {
        const s = statutCommande(c);
        const ouvert = ouverte === c.numero_commande;
        return (
          <div key={c.id} style={carte}>
            <div onClick={() => setOuverte(ouvert ? null : c.numero_commande)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{c.numero_commande}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{new Date(c.created_at).toLocaleDateString('fr-CA')}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${s.couleur}22`, border: `1px solid ${s.couleur}66`, color: s.couleur }}>{s.texte}</span>
              <strong>{argent(c.total, c.devise)}</strong>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>{ouvert ? '▲' : '▼'}</span>
            </div>
            {ouvert && (
              <div style={{ padding: '4px 18px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 13 }}>
                {(c.articles || []).map((a: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span>{a.titre}{a.variante ? ` — ${a.variante}` : ''} × {a.quantite}</span><span>{argent(a.prix * a.quantite, c.devise)}</span></div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)', padding: '4px 0' }}><span>Sous-total</span><span>{argent(c.sous_total, c.devise)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)', padding: '4px 0' }}><span>Expédition{c.methode_expedition && c.methode_expedition.nom ? ` (${c.methode_expedition.nom})` : ''}</span><span>{Number(c.frais_expedition) === 0 ? 'Gratuit' : argent(c.frais_expedition, c.devise)}</span></div>
                {c.taxes && Number(c.taxes.total_taxes) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)', padding: '4px 0' }}><span>Taxes</span><span>{argent(c.taxes.total_taxes, c.devise)}</span></div>}
                {c.adresse_livraison && c.adresse_livraison.adresse1 && (
                  <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>📍 {c.adresse_livraison.nom} — {c.adresse_livraison.adresse1}{c.adresse_livraison.adresse2 ? `, ${c.adresse_livraison.adresse2}` : ''}, {c.adresse_livraison.ville} {c.adresse_livraison.province} {c.adresse_livraison.code_postal}</div>
                )}
                {c.statut !== 'annulee' && c.statut_paiement !== 'paye' && (
                  <button disabled={occupe} onClick={() => annuler(c.numero_commande)} style={{ marginTop: 12, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}>Annuler cette commande</button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}