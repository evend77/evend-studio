// CHEMIN : src/pages/boutique/PanierBoutique.tsx
// e-Vend Studio — Panier de l'acheteur, commun à tous les templates boutique (solo). Les prix et le stock viennent toujours du serveur.
// API : /api/boutique/acheteur/<gestionnaire>/panier…

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ba, messageAcheteur, argent, paramUrl } from './boutiqueAcheteurApi';

interface Ligne { id: number; produit_id: number; titre: string; variante: string; quantite: number; prix: number; stock: number; total_ligne: number; image_url: string | null; erreur: string | null; }
interface PlusTard { id: number; titre: string; variante: string; quantite: number; prix: number; image_url: string | null; }
interface Props { gestionnaireId: number; accent?: string; naviguerVers: (page: string) => void; }

export default function PanierBoutique({ gestionnaireId: gid, accent, naviguerVers }: Props) {
  const couleur = accent || '#111827';
  const [lignes, setLignes] = useState<Ligne[] | null>(null);
  const [sousTotal, setSousTotal] = useState(0);
  const [plusTard, setPlusTard] = useState<PlusTard[]>([]);
  const [msg, setMsg] = useState<{ type: 'erreur' | 'info'; texte: string } | null>(null);
  const [occupe, setOccupe] = useState(false);
  const annulationFaite = useRef(false);

  const charger = useCallback(async () => {
    const [p, t] = await Promise.all([ba(gid, '/panier'), ba(gid, '/panier/plus-tard')]);
    if (p.status === 401) { setMsg({ type: 'info', texte: 'Connectez-vous pour voir votre panier.' }); setLignes([]); return; }
    if (!p.ok) { setMsg({ type: 'erreur', texte: messageAcheteur(p) }); setLignes([]); return; }
    setLignes(p.data.articles); setSousTotal(p.data.sous_total);
    setPlusTard(t.ok ? t.data.articles : []);
  }, [gid]);

  useEffect(() => {
    // Retour d'un paiement annulé (bouton « retour » de Stripe / PayPal) : la commande est annulée, les articles reviennent au panier
    const numero = paramUrl('commande');
    if (paramUrl('paiement') === 'annule' && numero && !annulationFaite.current) {
      annulationFaite.current = true;
      ba(gid, `/commandes/${encodeURIComponent(numero)}/annuler`, { method: 'POST' }).then(r => {
        setMsg(r.ok ? { type: 'info', texte: 'Paiement annulé. Vos articles sont de retour dans votre panier.' } : { type: 'erreur', texte: messageAcheteur(r) });
        charger();
      });
    } else charger();
  }, [gid, charger]);

  const agir = async (fn: () => Promise<{ ok: boolean; data: any; status: number }>) => {
    setOccupe(true); setMsg(null);
    const r = await fn();
    if (!r.ok) setMsg({ type: 'erreur', texte: messageAcheteur(r as any) });
    await charger(); setOccupe(false);
  };

  if (!lignes) return <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>⏳ Chargement…</div>;
  const problemes = lignes.filter(l => l.erreur);

  const bouton = (texte: string, onClick: () => void, fort?: boolean) => (
    <button onClick={onClick} disabled={occupe} style={{ border: fort ? 'none' : '1px solid #d1d5db', background: fort ? couleur : '#fff', color: fort ? '#fff' : '#374151', borderRadius: 8, padding: fort ? '12px 22px' : '6px 10px', fontSize: fort ? 15 : 13, fontWeight: fort ? 700 : 500, cursor: occupe ? 'default' : 'pointer', opacity: occupe ? 0.6 : 1 }}>{texte}</button>
  );

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 16px' }}>
      <h1 style={{ fontSize: 26, margin: '0 0 18px' }}>Mon panier</h1>
      {msg && <div style={{ background: msg.type === 'erreur' ? '#fef2f2' : '#eff6ff', color: msg.type === 'erreur' ? '#b91c1c' : '#1e40af', border: `1px solid ${msg.type === 'erreur' ? '#fecaca' : '#bfdbfe'}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 14 }}>{msg.texte}</div>}

      {lignes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 10px', color: '#6b7280' }}>
          <div style={{ fontSize: 42 }}>🛒</div>
          <p style={{ margin: '10px 0 18px' }}>Votre panier est vide.</p>
          {bouton('Continuer mes achats', () => naviguerVers('accueil'), true)}
        </div>
      ) : (
        <>
          {problemes.length > 0 && <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 14 }}>{problemes.map((p, i) => <div key={i}>⚠️ {p.erreur}</div>)}</div>}
          {lignes.map(l => (
            <div key={l.id} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid #eee', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: 72, height: 72, borderRadius: 8, background: '#f3f4f6', overflow: 'hidden', flexShrink: 0 }}>{l.image_url && <img src={l.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 600 }}>{l.titre}</div>
                {l.variante && <div style={{ fontSize: 13, color: '#6b7280' }}>{l.variante}</div>}
                <div style={{ fontSize: 13, color: '#6b7280' }}>{argent(l.prix)} l'unité</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                  {bouton('Retirer', () => agir(() => ba(gid, `/panier/${l.id}`, { method: 'DELETE' })))}
                  {bouton('Garder pour plus tard', () => agir(() => ba(gid, `/panier/${l.id}/plus-tard`, { method: 'POST' })))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button aria-label="Moins" disabled={occupe || l.quantite <= 1} onClick={() => agir(() => ba(gid, `/panier/${l.id}`, { method: 'PATCH', body: { quantite: l.quantite - 1 } }))} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>−</button>
                <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 600 }}>{l.quantite}</span>
                <button aria-label="Plus" disabled={occupe || l.quantite >= l.stock} onClick={() => agir(() => ba(gid, `/panier/${l.id}`, { method: 'PATCH', body: { quantite: l.quantite + 1 } }))} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>+</button>
              </div>
              <div style={{ width: 90, textAlign: 'right', fontWeight: 700 }}>{argent(l.total_ligne)}</div>
            </div>
          ))}
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 15 }}>Sous-total : <strong style={{ fontSize: 20 }}>{argent(sousTotal)}</strong></div>
            {bouton('Passer à la caisse', () => { if (!problemes.length) naviguerVers('caisse'); }, true)}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'right', marginTop: 6 }}>Expédition et taxes calculées à la caisse.</div>
        </>
      )}

      {plusTard.length > 0 && (
        <div style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Gardés pour plus tard</h2>
          {plusTard.map(a => (
            <div key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee', flexWrap: 'wrap' }}>
              <div style={{ width: 48, height: 48, borderRadius: 6, background: '#f3f4f6', overflow: 'hidden' }}>{a.image_url && <img src={a.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
              <div style={{ flex: 1, minWidth: 140 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{a.titre}{a.variante ? ` — ${a.variante}` : ''}</div><div style={{ fontSize: 13, color: '#6b7280' }}>{argent(a.prix)}</div></div>
              {bouton('Remettre au panier', () => agir(() => ba(gid, `/panier/plus-tard/${a.id}/remettre`, { method: 'POST' })))}
              {bouton('Supprimer', () => agir(() => ba(gid, `/panier/plus-tard/${a.id}`, { method: 'DELETE' })))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}