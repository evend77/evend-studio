// CHEMIN : src/pages/boutique/RetoursBoutique.tsx
// e-Vend Studio — « Mes retours » de l'acheteur, templates boutique (solo). API : /api/boutique/acheteur/<gestionnaire>/retours

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ba, messageAcheteur, argent } from './boutiqueAcheteurApi';

interface Props { gestionnaireId: number; couleurAccent?: string; isMobile?: boolean; commandeInitiale?: string | null; }
const STATUTS: Record<string, { texte: string; couleur: string }> = {
  demande: { texte: 'En attente de réponse', couleur: '#f59e0b' }, accepte: { texte: 'Accepté — retournez les articles', couleur: '#3b82f6' }, recu: { texte: 'Articles reçus', couleur: '#06b6d4' },
  rembourse: { texte: 'Remboursé', couleur: '#10b981' }, refuse: { texte: 'Refusé', couleur: '#ef4444' }, annule: { texte: 'Annulé', couleur: '#6b7280' },
};
const MOTIFS: { id: string; label: string }[] = [
  { id: 'defectueux', label: 'Article défectueux' }, { id: 'mauvais_article', label: 'Mauvais article reçu' }, { id: 'ne_convient_pas', label: 'Ne convient pas' },
  { id: 'endommage_transport', label: 'Endommagé pendant le transport' }, { id: 'autre', label: 'Autre raison' },
];

export default function RetoursBoutique({ gestionnaireId: gid, couleurAccent, commandeInitiale }: Props) {
  const accent = couleurAccent || '#fbbf24';
  const [retours, setRetours] = useState<any[] | null>(null);
  const [elig, setElig] = useState<any | null>(null);
  const [formulaire, setFormulaire] = useState(false);
  const [numero, setNumero] = useState('');
  const [qte, setQte] = useState<Record<string, number>>({});
  const [motif, setMotif] = useState('');
  const [details, setDetails] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; texte: string } | null>(null);
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(async () => {
    const [a, b] = await Promise.all([ba(gid, '/retours'), ba(gid, '/retours/eligibles')]);
    setRetours(a.ok ? a.data.retours : []);
    setElig(b.ok ? b.data : { reglages: { retours_actifs: false }, commandes: [] });
  }, [gid]);
  useEffect(() => { charger(); }, [charger]);
  const initialeUtilisee = useRef(false);
  useEffect(() => { if (commandeInitiale && elig && !initialeUtilisee.current) { initialeUtilisee.current = true; setNumero(commandeInitiale); setFormulaire(true); } }, [commandeInitiale, elig]);

  const commande = elig && elig.commandes.find((c: any) => c.numero_commande === numero);
  const cleL = (l: any) => `${l.produit_id}|${l.variante || ''}`;

  const envoyer = async () => {
    if (!commande) { setMsg({ ok: false, texte: 'Choisissez une commande.' }); return; }
    const articles = commande.lignes.filter((l: any) => (qte[cleL(l)] || 0) > 0).map((l: any) => ({ produit_id: l.produit_id, variante: l.variante, quantite: qte[cleL(l)] }));
    if (!articles.length) { setMsg({ ok: false, texte: 'Choisissez au moins un article à retourner.' }); return; }
    if (!motif) { setMsg({ ok: false, texte: 'Choisissez le motif du retour.' }); return; }
    setOccupe(true); setMsg(null);
    const r = await ba(gid, '/retours', { method: 'POST', body: { numero_commande: numero, articles, motif, details } });
    setOccupe(false);
    if (!r.ok) { setMsg({ ok: false, texte: messageAcheteur(r) }); return; }
    setMsg({ ok: true, texte: 'Demande envoyée. Le vendeur vous répondra bientôt.' });
    setFormulaire(false); setQte({}); setMotif(''); setDetails(''); setNumero(''); charger();
  };
  const annuler = async (n: string) => {
    const r = await ba(gid, `/retours/${encodeURIComponent(n)}/annuler`, { method: 'POST' });
    setMsg({ ok: r.ok, texte: r.ok ? r.data.message : messageAcheteur(r) }); charger();
  };

  if (!retours || !elig) return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>⏳ Chargement…</div>;
  const carte: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, marginBottom: 12, padding: '14px 18px' };
  const champ: React.CSSProperties = { width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: 'inherit', fontSize: 13, boxSizing: 'border-box' };
  const peutDemander = elig.reglages.retours_actifs && elig.commandes.length > 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 800, margin: 0 }}>🔄 Mes retours</h1>
        {peutDemander && !formulaire && <button onClick={() => { setFormulaire(true); setMsg(null); }} style={{ marginLeft: 'auto', background: accent, color: '#000', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 700, cursor: 'pointer' }}>+ Demander un retour</button>}
      </div>
      {msg && <div style={{ background: msg.ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${msg.ok ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{msg.texte}</div>}
      {!elig.reglages.retours_actifs && <div style={{ ...carte, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Cette boutique n'accepte pas les retours en ligne.</div>}
      {elig.reglages.retours_actifs && elig.commandes.length === 0 && !formulaire && <div style={{ ...carte, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Aucune commande n'est actuellement admissible à un retour (la commande doit être expédiée, dans un délai de {elig.reglages.delai_retour_jours} jours).</div>}

      {formulaire && (
        <div style={carte}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Nouvelle demande de retour</div>
          <label style={{ fontSize: 12, fontWeight: 700 }}>Commande</label>
          <select style={{ ...champ, marginBottom: 12 }} value={numero} onChange={(e) => { setNumero(e.target.value); setQte({}); }}>
            <option value="" style={{ color: '#000' }}>— Choisir —</option>
            {elig.commandes.map((c: any) => <option key={c.id} value={c.numero_commande} style={{ color: '#000' }}>{c.numero_commande}</option>)}
          </select>
          {commande && commande.lignes.map((l: any) => (
            <div key={cleL(l)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13 }}>
              <span style={{ flex: 1 }}>{l.titre}{l.variante ? ` — ${l.variante}` : ''} <span style={{ color: 'rgba(255,255,255,0.45)' }}>({argent(l.prix, commande.devise)})</span></span>
              <select value={qte[cleL(l)] || 0} onChange={(e) => setQte({ ...qte, [cleL(l)]: parseInt(e.target.value, 10) })} style={{ ...champ, width: 70 }}>
                {Array.from({ length: l.disponible + 1 }, (_, i) => <option key={i} value={i} style={{ color: '#000' }}>{i}</option>)}
              </select>
            </div>
          ))}
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginTop: 10 }}>Motif</label>
          <select style={{ ...champ, marginBottom: 10 }} value={motif} onChange={(e) => setMotif(e.target.value)}>
            <option value="" style={{ color: '#000' }}>— Choisir —</option>
            {MOTIFS.map((m) => <option key={m.id} value={m.id} style={{ color: '#000' }}>{m.label}</option>)}
          </select>
          <label style={{ fontSize: 12, fontWeight: 700 }}>Détails (facultatif)</label>
          <textarea style={{ ...champ, minHeight: 70, marginBottom: 12 }} value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button disabled={occupe} onClick={envoyer} style={{ background: accent, color: '#000', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 700, cursor: 'pointer' }}>Envoyer la demande</button>
            <button onClick={() => setFormulaire(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.25)', color: 'inherit', borderRadius: 8, padding: '9px 16px', cursor: 'pointer' }}>Annuler</button>
          </div>
        </div>
      )}

      {retours.map((x) => {
        const s = STATUTS[x.statut] || { texte: x.statut, couleur: '#6b7280' };
        return (
          <div key={x.id} style={carte}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 150 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{x.numero_retour}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Commande {x.numero_commande} · {new Date(x.created_at).toLocaleDateString('fr-CA')}</div></div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${s.couleur}22`, border: `1px solid ${s.couleur}66`, color: s.couleur }}>{s.texte}</span>
            </div>
            <div style={{ fontSize: 13, marginTop: 8, color: 'rgba(255,255,255,0.75)' }}>{(x.articles || []).map((a: any) => `${a.titre} × ${a.quantite}`).join(', ')} — {x.motif_texte}</div>
            {x.reponse && <div style={{ fontSize: 13, marginTop: 6 }}><strong>Réponse du vendeur :</strong> {x.reponse}</div>}
            {x.statut === 'rembourse' && <div style={{ fontSize: 13, marginTop: 6, color: '#34d399', fontWeight: 700 }}>Remboursé : {argent(x.montant_rembourse, x.devise)}</div>}
            {x.statut === 'demande' && <button onClick={() => annuler(x.numero_retour)} style={{ marginTop: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12 }}>Annuler ma demande</button>}
          </div>
        );
      })}
      {retours.length === 0 && !formulaire && peutDemander && <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.5)' }}>Aucune demande de retour.</div>}
    </div>
  );
}