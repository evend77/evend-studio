// CHEMIN : src/pages/boutique/CaisseBoutique.tsx
// e-Vend Studio — Caisse de l'acheteur, commune à tous les templates boutique (solo).
// Le navigateur n'envoie que l'adresse, le mode d'expédition et le mode de paiement : le serveur recalcule prix, expédition, taxes et total.
// Le paiement se fait sur la page Stripe / PayPal DU GESTIONNAIRE (son propre compte).

import React, { useCallback, useEffect, useState } from 'react';
import { ba, messageAcheteur, argent, PROVINCES } from './boutiqueAcheteurApi';

interface Infos {
  lignes: { id: number; titre: string; variante: string; quantite: number; total_ligne: number }[];
  sous_total: number; devise: string;
  methodes_expedition: { id: number; nom?: string; transporteur_nom?: string; logo?: string; frais_calcule?: number; delais_estime?: string; detail_calcul?: string }[];
  expedition_indisponible: boolean; modes_paiement: { stripe: boolean; paypal: boolean }; problemes: string[];
  totaux?: { sous_total: number; frais_expedition: number; taxes: { total_taxes: number; tps: number; tvq: number; tvh: number; tvp: number; label: string }; total: number };
  totaux_erreur?: string;
}
interface Props { gestionnaireId: number; accent?: string; naviguerVers: (page: string) => void; }

const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 };
const etiquette: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#4b5563', marginBottom: 4 };

export default function CaisseBoutique({ gestionnaireId: gid, accent, naviguerVers }: Props) {
  const couleur = accent || '#111827';
  const [adr, setAdr] = useState({ nom: '', adresse1: '', adresse2: '', ville: '', province: 'QC', code_postal: '', telephone: '' });
  const [methodeId, setMethodeId] = useState<string>('');
  const [mode, setMode] = useState<'stripe' | 'paypal' | ''>('');
  const [note, setNote] = useState('');
  const [infos, setInfos] = useState<Infos | null>(null);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(async (province: string, methode: string) => {
    const r = await ba(gid, '/caisse/infos', { method: 'POST', body: { province, methode_id: methode || undefined } });
    if (r.status === 401) { setErreur('Connectez-vous pour passer à la caisse.'); return; }
    if (!r.ok) { setErreur(messageAcheteur(r)); return; }
    const d = r.data as Infos;
    setInfos(d);
    setMode(m => (m && (d.modes_paiement as any)[m]) ? m : (d.modes_paiement.stripe ? 'stripe' : d.modes_paiement.paypal ? 'paypal' : ''));
    // Si le mode choisi n'est plus offert pour cette province, on le décoche
    setMethodeId(cur => (cur && d.methodes_expedition.some(x => String(x.id) === cur)) ? cur : (d.methodes_expedition.length === 1 ? String(d.methodes_expedition[0].id) : ''));
  }, [gid]);

  useEffect(() => { charger(adr.province, methodeId); }, [adr.province, methodeId, charger]);

  const maj = (k: string, v: string) => { setErreur(''); setAdr(a => ({ ...a, [k]: v })); };

  const payer = async () => {
    setErreur('');
    if (!mode) { setErreur('Choisissez un mode de paiement.'); return; }
    setEnvoi(true);
    const r = await ba(gid, '/caisse/commande', { method: 'POST', body: { adresse: adr, methode_id: methodeId || undefined, mode, note } });
    if (!r.ok) { setErreur(messageAcheteur(r)); setEnvoi(false); charger(adr.province, methodeId); return; }
    window.location.href = r.data.checkout_url;   // page de paiement du gestionnaire (Stripe ou PayPal)
  };

  if (!infos) return <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>{erreur || '⏳ Chargement…'}</div>;
  if (infos.lignes.length === 0) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>Votre panier est vide.<br /><br />
      <button onClick={() => naviguerVers('accueil')} style={{ background: couleur, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer' }}>Continuer mes achats</button></div>);

  const t = infos.totaux;
  const aucunPaiement = !infos.modes_paiement.stripe && !infos.modes_paiement.paypal;
  const pret = !envoi && !infos.problemes.length && !infos.expedition_indisponible && !aucunPaiement && !!mode && (infos.methodes_expedition.length <= 1 || !!methodeId);

  return (
    <div style={{ maxWidth: 940, margin: '0 auto', padding: '28px 16px', display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ flex: '1 1 440px', minWidth: 0 }}>
        <h1 style={{ fontSize: 26, margin: '0 0 18px' }}>Caisse</h1>
        {erreur && <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 14 }}>{erreur}</div>}
        {infos.problemes.length > 0 && <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 14 }}>{infos.problemes.map((p, i) => <div key={i}>⚠️ {p}</div>)}<button onClick={() => naviguerVers('panier')} style={{ marginTop: 8, background: 'none', border: 'none', color: '#92400e', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>Retourner au panier</button></div>}

        <h2 style={{ fontSize: 17, margin: '0 0 10px' }}>Adresse de livraison</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ gridColumn: '1 / -1' }}><label style={etiquette}>Nom complet</label><input style={champ} value={adr.nom} onChange={e => maj('nom', e.target.value)} autoComplete="name" /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={etiquette}>Adresse</label><input style={champ} value={adr.adresse1} onChange={e => maj('adresse1', e.target.value)} autoComplete="address-line1" /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={etiquette}>Appartement, suite (facultatif)</label><input style={champ} value={adr.adresse2} onChange={e => maj('adresse2', e.target.value)} autoComplete="address-line2" /></div>
          <div><label style={etiquette}>Ville</label><input style={champ} value={adr.ville} onChange={e => maj('ville', e.target.value)} autoComplete="address-level2" /></div>
          <div><label style={etiquette}>Province</label>
            <select style={champ} value={adr.province} onChange={e => maj('province', e.target.value)}>{PROVINCES.map(p => <option key={p.code} value={p.code}>{p.nom}</option>)}</select></div>
          <div><label style={etiquette}>Code postal</label><input style={champ} value={adr.code_postal} onChange={e => maj('code_postal', e.target.value)} autoComplete="postal-code" /></div>
          <div><label style={etiquette}>Téléphone (facultatif)</label><input style={champ} value={adr.telephone} onChange={e => maj('telephone', e.target.value)} autoComplete="tel" /></div>
        </div>

        <h2 style={{ fontSize: 17, margin: '24px 0 10px' }}>Expédition</h2>
        {infos.expedition_indisponible ? <div style={{ color: '#b91c1c', fontSize: 14 }}>Cette boutique ne livre pas dans cette province.</div> : (
          infos.methodes_expedition.map(m => {
            const nom = m.nom || m.transporteur_nom || 'Livraison';
            const frais = Number(m.frais_calcule || 0);
            return (
              <label key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', border: `1px solid ${String(m.id) === methodeId ? couleur : '#e5e7eb'}`, borderRadius: 8, marginBottom: 8, cursor: 'pointer' }}>
                <input type="radio" name="exp" checked={String(m.id) === methodeId} onChange={() => setMethodeId(String(m.id))} />
                <span style={{ flex: 1 }}>{m.logo ? `${m.logo} ` : ''}{nom}{m.delais_estime ? <span style={{ color: '#6b7280', fontSize: 13 }}> · {m.delais_estime}</span> : null}</span>
                <strong>{frais === 0 ? 'Gratuit' : argent(frais, infos.devise)}</strong>
              </label>
            );
          })
        )}

        <h2 style={{ fontSize: 17, margin: '24px 0 10px' }}>Paiement</h2>
        {aucunPaiement ? <div style={{ color: '#b91c1c', fontSize: 14 }}>Cette boutique n'accepte pas encore les paiements en ligne.</div> : (
          <>
            {infos.modes_paiement.stripe && <label style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', border: `1px solid ${mode === 'stripe' ? couleur : '#e5e7eb'}`, borderRadius: 8, marginBottom: 8, cursor: 'pointer' }}><input type="radio" name="mode" checked={mode === 'stripe'} onChange={() => setMode('stripe')} /> 💳 Carte de crédit ou de débit</label>}
            {infos.modes_paiement.paypal && <label style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', border: `1px solid ${mode === 'paypal' ? couleur : '#e5e7eb'}`, borderRadius: 8, marginBottom: 8, cursor: 'pointer' }}><input type="radio" name="mode" checked={mode === 'paypal'} onChange={() => setMode('paypal')} /> 🅿️ PayPal</label>}
          </>
        )}
        <div style={{ marginTop: 18 }}><label style={etiquette}>Note pour la boutique (facultatif)</label><textarea style={{ ...champ, minHeight: 60 }} maxLength={500} value={note} onChange={e => setNote(e.target.value)} /></div>
      </div>

      <div style={{ flex: '0 0 320px', maxWidth: '100%', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
        <h2 style={{ fontSize: 17, margin: '0 0 12px' }}>Résumé</h2>
        {infos.lignes.map(l => <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14, marginBottom: 6 }}><span>{l.titre}{l.variante ? ` — ${l.variante}` : ''} × {l.quantite}</span><span>{argent(l.total_ligne, infos.devise)}</span></div>)}
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '12px 0' }} />
        <Ligne n="Sous-total" v={argent(infos.sous_total, infos.devise)} />
        {t ? (
          <>
            <Ligne n="Expédition" v={t.frais_expedition === 0 ? 'Gratuit' : argent(t.frais_expedition, infos.devise)} />
            {t.taxes.total_taxes > 0 && <Ligne n={`Taxes (${t.taxes.label})`} v={argent(t.taxes.total_taxes, infos.devise)} />}
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800 }}><span>Total</span><span>{argent(t.total, infos.devise)}</span></div>
          </>
        ) : <div style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>{infos.totaux_erreur || "Choisissez un mode d'expédition pour voir le total."}</div>}
        <button onClick={payer} disabled={!pret} style={{ marginTop: 18, width: '100%', background: pret ? couleur : '#9ca3af', color: '#fff', border: 'none', borderRadius: 8, padding: '13px 0', fontSize: 15, fontWeight: 700, cursor: pret ? 'pointer' : 'default' }}>{envoi ? 'Redirection…' : 'Payer'}</button>
        <button onClick={() => naviguerVers('panier')} style={{ marginTop: 10, width: '100%', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 13 }}>← Retour au panier</button>
      </div>
    </div>
  );
}

function Ligne({ n, v }: { n: string; v: string }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}><span style={{ color: '#4b5563' }}>{n}</span><span>{v}</span></div>;
}