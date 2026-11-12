// CHEMIN : src/pages/gestionnaire/BoutiqueRetours.tsx
// e-Vend Studio — Retours & remboursements du gestionnaire (templates boutique, solo). Remboursement fait sur SON Stripe / SON PayPal.
// API : /api/boutique/gestionnaire/retours

import React, { useCallback, useEffect, useState } from 'react';
import { bq, messageErreur, formaterArgent } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

interface Props { gestionnaireId: number; accent?: string; isMobile?: boolean; }
const FILTRES: { id: string; label: string; cle: string }[] = [
  { id: 'a_traiter', label: 'À traiter', cle: 'a_traiter' }, { id: 'en_cours', label: 'En cours', cle: 'en_cours' },
  { id: 'termines', label: 'Terminés', cle: 'termines' }, { id: 'tous', label: 'Tous', cle: 'tous' },
];
export const STATUTS_RETOUR: Record<string, { texte: string; couleur: string }> = {
  demande: { texte: 'Demandé', couleur: '#f59e0b' }, accepte: { texte: 'Accepté', couleur: '#3b82f6' }, recu: { texte: 'Reçu', couleur: '#06b6d4' },
  rembourse: { texte: 'Remboursé', couleur: '#10b981' }, refuse: { texte: 'Refusé', couleur: '#ef4444' }, annule: { texte: 'Annulé', couleur: '#6b7280' },
};

export default function BoutiqueRetours({ accent }: Props) {
  const couleur = accent || '#4f46e5';
  const [filtre, setFiltre] = useState('a_traiter');
  const [donnees, setDonnees] = useState<any | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [message, setMessage] = useState('');
  const [montant, setMontant] = useState('');
  const [remettre, setRemettre] = useState(true);
  const [reglages, setReglages] = useState<{ retours_actifs: boolean; delai_retour_jours: string } | null>(null);
  const [modale, setModale] = useState<{ type: 'erreur' | 'succes'; message: string } | null>(null);
  const [confirmer, setConfirmer] = useState<null | 'rembourser'>(null);
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(async () => {
    const r = await bq(`/retours?filtre=${filtre}`);
    if (r.ok) {
      setDonnees(r.data);
      setReglages((p) => p || { retours_actifs: r.data.reglages.retours_actifs, delai_retour_jours: String(r.data.reglages.delai_retour_jours) });
    } else { setDonnees({ retours: [], compteurs: {}, reglages: {} }); setModale({ type: 'erreur', message: messageErreur(r) }); }
  }, [filtre]);
  useEffect(() => { charger(); }, [charger]);

  const ouvrir = async (id: number) => {
    const r = await bq(`/retours/${id}`);
    if (!r.ok) { setModale({ type: 'erreur', message: messageErreur(r) }); return; }
    setDetail(r.data.retour); setMessage(''); setMontant(String(r.data.retour.montant_conseille)); setRemettre(true);
  };
  const action = async (chemin: string, corps: any, ok: string) => {
    if (!detail) return;
    setOccupe(true);
    const r = await bq(`/retours/${detail.id}/${chemin}`, { method: 'POST', body: corps });
    setOccupe(false); setConfirmer(null);
    if (!r.ok) { setModale({ type: 'erreur', message: messageErreur(r) }); return; }
    setDetail(r.data.retour); setMontant(String(r.data.retour.montant_conseille)); setModale({ type: 'succes', message: ok }); charger();
  };
  const sauverReglages = async () => {
    if (!reglages) return;
    const r = await bq('/retours/reglages', { method: 'PUT', body: { retours_actifs: reglages.retours_actifs, delai_retour_jours: reglages.delai_retour_jours } });
    setModale(r.ok ? { type: 'succes', message: 'Réglages des retours enregistrés.' } : { type: 'erreur', message: messageErreur(r) });
  };

  const carte: React.CSSProperties = { background: '#fff', border: '1px solid #e1e4e8', borderRadius: 12 };
  const champ: React.CSSProperties = { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', width: '100%' };
  const btn = (fort?: boolean, danger?: boolean): React.CSSProperties => ({ border: fort || danger ? 'none' : '1px solid #e1e4e8', background: danger ? '#dc2626' : fort ? couleur : '#fff', color: fort || danger ? '#fff' : '#374151', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' });
  const pastille = (s: string) => { const x = STATUTS_RETOUR[s] || { texte: s, couleur: '#6b7280' }; return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${x.couleur}18`, border: `1px solid ${x.couleur}55`, color: x.couleur }}>{x.texte}</span>; };

  if (detail) {
    const d = detail;
    const devise = d.devise;
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
        <button style={btn()} onClick={() => setDetail(null)}>← Retour à la liste</button>
        <div style={{ ...carte, padding: 20, marginTop: 14 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>{d.numero_retour}</h2>{pastille(d.statut)}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>{new Date(d.created_at).toLocaleDateString('fr-CA')}</span>
          </div>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '8px 0 14px' }}>Commande {d.numero_commande} · {[d.acheteur_prenom, d.acheteur_nom].filter(Boolean).join(' ')} {d.acheteur_email ? `(${d.acheteur_email})` : ''}</p>
          <div style={{ fontSize: 13, marginBottom: 6 }}><strong>Motif :</strong> {d.motif_texte}</div>
          {d.details && <div style={{ fontSize: 13, background: '#f9fafb', borderRadius: 8, padding: 10, marginBottom: 10 }}>{d.details}</div>}
          <div style={{ fontWeight: 700, fontSize: 13, margin: '12px 0 4px' }}>Articles à retourner</div>
          {(d.articles || []).map((a: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid #f1f3f5' }}><span>{a.titre}{a.variante ? ` — ${a.variante}` : ''} × {a.quantite}</span><span>{formaterArgent(a.prix * a.quantite, devise)}</span></div>
          ))}
          {d.reponse && <div style={{ fontSize: 13, marginTop: 12, color: '#374151' }}><strong>Votre réponse :</strong> {d.reponse}</div>}
          {d.statut === 'rembourse' && <div style={{ fontSize: 14, marginTop: 12, color: '#047857', fontWeight: 700 }}>Remboursé : {formaterArgent(d.montant_rembourse, devise)}</div>}
        </div>

        {d.statut === 'demande' && (
          <div style={{ ...carte, padding: 20, marginTop: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Message au client (obligatoire pour un refus)</label>
            <textarea style={{ ...champ, minHeight: 70 }} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ex. : adresse de retour, ou raison du refus" />
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button disabled={occupe} style={btn(true)} onClick={() => action('accepter', { message }, 'Retour accepté.')}>Accepter le retour</button>
              <button disabled={occupe} style={btn(false, true)} onClick={() => action('refuser', { message }, 'Retour refusé.')}>Refuser</button>
            </div>
          </div>
        )}
        {d.statut === 'accepte' && (
          <div style={{ ...carte, padding: 20, marginTop: 14 }}>
            <p style={{ margin: '0 0 10px', fontSize: 13 }}>Quand vous avez reçu les articles, marquez-les comme reçus.</p>
            <label style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}><input type="checkbox" checked={remettre} onChange={(e) => setRemettre(e.target.checked)} /> Remettre les articles en stock</label>
            <button disabled={occupe} style={btn(true)} onClick={() => action('recu', { remettre_stock: remettre }, 'Articles marqués reçus.')}>Articles reçus</button>
          </div>
        )}
        {(d.statut === 'accepte' || d.statut === 'recu') && (
          <div style={{ ...carte, padding: 20, marginTop: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Rembourser ({d.mode_paiement === 'paypal' ? 'PayPal' : 'Stripe'})</div>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: '#6b7280' }}>Montant conseillé : articles retournés (après rabais) + leur part des taxes. L'expédition n'est pas incluse. Restant remboursable sur la commande : {formaterArgent(d.restant_remboursable, devise)}.</p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input style={{ ...champ, width: 140 }} value={montant} onChange={(e) => setMontant(e.target.value)} inputMode="decimal" />
              <button disabled={occupe} style={btn(true)} onClick={() => setConfirmer('rembourser')}>Rembourser</button>
            </div>
          </div>
        )}
        {confirmer === 'rembourser' && (
          <BoutiqueModale type="confirmer" titre="Confirmer le remboursement" message={`Rembourser ${formaterArgent(montant.replace(',', '.'), devise)} au client ? Cette action est définitive.`} accent={couleur} enCours={occupe} texteConfirmer="Rembourser"
            onConfirmer={() => action('rembourser', { montant: montant.replace(',', '.') }, 'Remboursement effectué.')} onFermer={() => setConfirmer(null)} />
        )}
        {modale && <BoutiqueModale type={modale.type} titre={modale.type === 'erreur' ? 'Erreur' : 'Succès'} message={modale.message} accent={couleur} onFermer={() => setModale(null)} />}
      </div>
    );
  }

  const cp = (donnees && donnees.compteurs) || {};
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      <h2 style={{ margin: '0 0 14px', fontSize: 22 }}>🔄 Retours & remboursements</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {FILTRES.map((f) => (
          <button key={f.id} onClick={() => setFiltre(f.id)} style={{ ...btn(filtre === f.id) }}>{f.label}{cp[f.cle] ? ` (${cp[f.cle]})` : ''}</button>
        ))}
      </div>
      <div style={{ ...carte, overflow: 'hidden' }}>
        {!donnees ? <div style={{ padding: 30, textAlign: 'center', color: '#6b7280' }}>⏳ Chargement…</div>
          : donnees.retours.length === 0 ? <div style={{ padding: 30, textAlign: 'center', color: '#6b7280' }}>Aucun retour dans cette catégorie.</div>
          : donnees.retours.map((x: any) => (
            <div key={x.id} onClick={() => ouvrir(x.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #f1f3f5', cursor: 'pointer', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{x.numero_retour}</div><div style={{ fontSize: 12, color: '#6b7280' }}>Commande {x.numero_commande} · {x.acheteur_email || ''}</div></div>
              <span style={{ fontSize: 12, color: '#374151' }}>{x.motif_texte}</span>{pastille(x.statut)}
              <span style={{ fontSize: 12, color: '#6b7280' }}>{new Date(x.created_at).toLocaleDateString('fr-CA')}</span>
            </div>
          ))}
      </div>
      {reglages && (
        <div style={{ ...carte, padding: 18, marginTop: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Politique de retour</div>
          <label style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}><input type="checkbox" checked={reglages.retours_actifs} onChange={(e) => setReglages({ ...reglages, retours_actifs: e.target.checked })} /> Accepter les demandes de retour en ligne</label>
          <label style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>Délai (jours après l'expédition / la livraison) :
            <input style={{ ...champ, width: 80 }} value={reglages.delai_retour_jours} onChange={(e) => setReglages({ ...reglages, delai_retour_jours: e.target.value })} inputMode="numeric" /></label>
          <button style={btn(true)} onClick={sauverReglages}>Enregistrer</button>
        </div>
      )}
      {modale && <BoutiqueModale type={modale.type} titre={modale.type === 'erreur' ? 'Erreur' : 'Succès'} message={modale.message} accent={couleur} onFermer={() => setModale(null)} />}
    </div>
  );
}