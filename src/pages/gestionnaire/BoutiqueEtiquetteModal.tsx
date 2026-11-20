// CHEMIN : src/pages/gestionnaire/BoutiqueEtiquetteModal.tsx
// e-Vend Studio — Add-ons d'étiquettes Shippo / EasyPost / Postes Canada (boutique solo) : fenêtre de création d'étiquette depuis le détail d'une commande.
// Étapes : dimensions/poids → tarifs du transporteur actif → CONFIRMATION avec le prix (l'étiquette est facturée sur le compte du gestionnaire chez ce transporteur) → achat.
// API : /api/boutique/gestionnaire/etiquettes/commandes/:id/{apercu,tarifs,etiquette}. Aucun popup du navigateur (BoutiqueModale).

import React, { useEffect, useState } from 'react';
import { bq, messageErreur, formaterArgent } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

interface Tarif { rateId: string; transporteur: string; service: string; montant: number; devise: string; delaiEstimeJours: number | null; shipmentId?: string }
interface Props {
  commandeId: number; numeroCommande: string; accent: string; isMobile?: boolean;
  onFermer: () => void;
  /** Appelé après l'achat : la page recharge la commande (suivi, étiquette) */
  onAchetee: (r: { numero_suivi: string | null; url_etiquette: string | null }) => void;
}

export const urlHttpSure = (u: string | null | undefined) => (u && /^https?:\/\/\S+$/i.test(u) ? u : null);
// Étiquette : lien https (Shippo, EasyPost) ou PDF en base64 (Postes Canada)
export const urlEtiquetteSure = (u: string | null | undefined) => urlHttpSure(u) || (u && /^data:application\/pdf;base64,[A-Za-z0-9+/=]+$/.test(u) ? u : null);
// Les navigateurs bloquent l'ouverture directe d'un PDF « data: » : on le convertit en Blob avant de l'ouvrir
export function ouvrirPdf(u: string) {
  try {
    if (u.startsWith('data:')) {
      const bin = atob(u.slice(u.indexOf(',') + 1));
      const octets = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) octets[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([octets], { type: 'application/pdf' }));
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 120000);
    } else window.open(u, '_blank');
  } catch (e) { /* PDF illisible : rien à ouvrir */ }
}
const NOMS_FOURNISSEURS: Record<string, string> = { shippo: 'Shippo', easypost: 'EasyPost', postescanada: 'Postes Canada' };

export default function BoutiqueEtiquetteModal({ commandeId, numeroCommande, accent, isMobile, onFermer, onAchetee }: Props) {
  const [chargement, setChargement] = useState(true);
  const [adresseManque, setAdresseManque] = useState<string[]>([]);
  const [poidsConnu, setPoidsConnu] = useState(0);
  const [f, setF] = useState({ poids: '', l: '20', la: '15', h: '10' });
  const [tarifs, setTarifs] = useState<Tarif[] | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [aConfirmer, setAConfirmer] = useState<Tarif | null>(null);
  const [erreur, setErreur] = useState('');
  const [fournisseur, setFournisseur] = useState('');
  const [diag, setDiag] = useState<any>(null);

  useEffect(() => {
    let vivant = true;
    (async () => {
      const r = await bq(`/etiquettes/commandes/${commandeId}/apercu`);
      if (!vivant) return;
      if (r.ok) {
        setPoidsConnu(Number(r.data.poids_kg) || 0); setAdresseManque(r.data.adresse_manque || []);
        if (Number(r.data.poids_kg) > 0) setF(x => ({ ...x, poids: String(r.data.poids_kg) }));
      } else setErreur(messageErreur(r));
      setChargement(false);
    })();
    return () => { vivant = false; };
  }, [commandeId]);

  const num = (v: string) => { const n = parseFloat(v.replace(',', '.')); return Number.isFinite(n) && n > 0 ? n : undefined; };

  const obtenirTarifs = async () => {
    setErreur(''); setDiag(null);
    if (!num(f.poids)) { setErreur('Entrez le poids du colis (en kg).'); return; }
    setOccupe(true);
    const r = await bq(`/etiquettes/commandes/${commandeId}/tarifs`, { method: 'POST', body: { poids_kg: num(f.poids), longueur_cm: num(f.l), largeur_cm: num(f.la), hauteur_cm: num(f.h) } });
    setOccupe(false);
    if (!r.ok) { setErreur(messageErreur(r)); setDiag(r.data && r.data.diagnostic ? r.data.diagnostic : null); setTarifs(null); return; }
    setTarifs(r.data.tarifs || []); setFournisseur(typeof r.data.provider === 'string' ? r.data.provider : '');
  };

  const acheter = async () => {
    if (!aConfirmer) return;
    setOccupe(true);
    const r = await bq(`/etiquettes/commandes/${commandeId}/etiquette`, { method: 'POST', body: { rate_id: aConfirmer.rateId, shipment_id: aConfirmer.shipmentId, transporteur: aConfirmer.transporteur, poids_kg: num(f.poids), longueur_cm: num(f.l), largeur_cm: num(f.la), hauteur_cm: num(f.h) } });
    setOccupe(false); setAConfirmer(null);
    if (!r.ok) { setErreur(messageErreur(r)); return; }
    onAchetee({ numero_suivi: r.data.numero_suivi || null, url_etiquette: urlEtiquetteSure(r.data.url_etiquette) });
  };

  const champ: React.CSSProperties = { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', width: '100%' };
  const btn = (fort?: boolean): React.CSSProperties => ({ border: fort ? 'none' : '1px solid #e1e4e8', background: fort ? accent : '#fff', color: fort ? '#fff' : '#374151', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: occupe ? 'wait' : 'pointer' });

  return (
    <div onClick={() => { if (!occupe) onFermer(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, padding: isMobile ? 10 : 20 }}>
      <div role="dialog" aria-modal="true" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, maxWidth: 560, width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: isMobile ? 18 : 24, fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>🏷️ Créer une étiquette</h3>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#6b7280' }}>Commande {numeroCommande}</p>

        {chargement ? <div style={{ padding: 30, textAlign: 'center', color: '#888' }}>⏳ Chargement…</div> : (<>
          {adresseManque.length > 0 && (
            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>
              ⚠️ L'adresse de votre boutique est incomplète ({adresseManque.join(', ')}). Elle sert d'adresse d'expédition : complétez-la dans votre profil.
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10, marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, gridColumn: isMobile ? '1 / -1' : undefined }}>Poids (kg)
              <input style={{ ...champ, marginTop: 4 }} inputMode="decimal" value={f.poids} onChange={e => setF({ ...f, poids: e.target.value })} placeholder="ex. 1.2" />
            </label>
            <label style={{ fontSize: 12, fontWeight: 700 }}>Long. (cm)<input style={{ ...champ, marginTop: 4 }} inputMode="decimal" value={f.l} onChange={e => setF({ ...f, l: e.target.value })} /></label>
            <label style={{ fontSize: 12, fontWeight: 700 }}>Larg. (cm)<input style={{ ...champ, marginTop: 4 }} inputMode="decimal" value={f.la} onChange={e => setF({ ...f, la: e.target.value })} /></label>
            <label style={{ fontSize: 12, fontWeight: 700 }}>Haut. (cm)<input style={{ ...champ, marginTop: 4 }} inputMode="decimal" value={f.h} onChange={e => setF({ ...f, h: e.target.value })} /></label>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6b7280' }}>
            {poidsConnu > 0 ? `Poids calculé d'après vos produits : ${poidsConnu} kg (modifiable).` : "Le poids des produits n'est pas renseigné : entrez-le manuellement."} Dimensions par défaut : 20 × 15 × 10 cm.
          </p>
          <button disabled={occupe || adresseManque.length > 0} onClick={obtenirTarifs} style={{ ...btn(true), width: '100%', opacity: adresseManque.length > 0 ? 0.5 : 1 }}>{occupe && !aConfirmer ? '⏳ Recherche des tarifs…' : '🔍 Obtenir les tarifs'}</button>

          {erreur && <div style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 8, padding: '10px 12px', fontSize: 13, overflowWrap: 'anywhere' }}>⚠️ {erreur}</div>}
          {diag && Array.isArray(diag.raisons_par_transporteur) && diag.raisons_par_transporteur.length > 0 && (
            <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, color: '#6b7280' }}>{diag.raisons_par_transporteur.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul>
          )}

          {tarifs && (
            <div style={{ marginTop: 14 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Tarifs disponibles ({tarifs.length})</h4>
              {tarifs.map(t => (
                <div key={t.rateId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 140, fontSize: 13 }}>
                    <strong>{t.transporteur}</strong> — {t.service}
                    <div style={{ color: '#6b7280', fontSize: 12 }}>{t.delaiEstimeJours ? `≈ ${t.delaiEstimeJours} jour${t.delaiEstimeJours > 1 ? 's' : ''}` : 'Délai non précisé'}</div>
                  </div>
                  <strong style={{ fontSize: 15 }}>{formaterArgent(t.montant, t.devise)}</strong>
                  <button disabled={occupe} onClick={() => setAConfirmer(t)} style={{ ...btn(true), background: '#27AE60', padding: '8px 14px', fontSize: 12 }}>Acheter</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}><button disabled={occupe} onClick={onFermer} style={btn()}>Fermer</button></div>
        </>)}
      </div>
      {aConfirmer && (
        <BoutiqueModale type="confirmer" accent={accent} titre="Confirmer l'achat de l'étiquette" enCours={occupe}
          message={`${aConfirmer.transporteur} — ${aConfirmer.service}\nPrix : ${formaterArgent(aConfirmer.montant, aConfirmer.devise)}\n\nCe montant sera facturé sur votre compte ${NOMS_FOURNISSEURS[fournisseur] || 'transporteur'}${fournisseur === 'postescanada' ? ' (carte de crédit enregistrée chez Postes Canada)' : ''}. Pour annuler ou faire rembourser une étiquette achetée par erreur, passez par votre tableau de bord ${NOMS_FOURNISSEURS[fournisseur] || 'transporteur'}.`}
          texteConfirmer={`Acheter · ${formaterArgent(aConfirmer.montant, aConfirmer.devise)}`} texteFermer="Retour" onFermer={() => { if (!occupe) setAConfirmer(null); }} onConfirmer={acheter} />
      )}
    </div>
  );
}