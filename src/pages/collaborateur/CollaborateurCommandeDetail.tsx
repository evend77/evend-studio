// CHEMIN : src/pages/collaborateur/CollaborateurCommandeDetail.tsx
// e-Vend Studio — Dashboard collaborateur : page de gestion d'UNE commande
// (accepter / refuser = remboursement avec raison, expédition + suivi, annulation, remboursement partiel ou total)
// API : /api/collab/:gestionnaireId/commandes/:id[/statut|/refuser|/rembourser|/remboursement-en-attente]

import React, { useState, useEffect, useCallback } from 'react';
import { formaterPrix } from '../../templates/shared/devise';

interface Article { titre?: string; prix?: number | string; quantite?: number; image_url?: string; variante?: string }
interface Remb { id: number; origine: string; montant: string; raison: string; statut: string; demande_par: string | null; motif_refus: string | null; erreur: string | null; created_at: string; traite_le: string | null }
interface Histo { evenement: string; detail: string | null; auteur: string | null; created_at: string }
interface Detail {
  id: number; numero_commande: string; statut: string; statut_paiement: string; total: string; commission: string | null; montant_net: string | null;
  articles: Article[] | null; adresse_livraison: Record<string, unknown> | null; note: string | null; date_commande: string;
  numero_suivi: string | null; transporteur: string | null; url_suivi: string | null; paye_le: string | null;
  frais_expedition: string | null; taxes: Record<string, unknown> | null; code_promo: string | null; rabais: string | null;
  montant_rembourse: string | null; raison_annulation: string | null; date_livraison_prevue: string | null;
  regles?: { suivi_obligatoire: boolean; date_active: boolean; date_obligatoire: boolean; accepter: boolean; accepter_expedier: boolean };
  acheteur_prenom: string | null; acheteur_nom: string | null; acheteur_email: string | null; acheteur_telephone: string | null;
  retours: { id: number; motif: string; statut: string }[]; remboursements: Remb[]; historique: Histo[]; transitions: string[];
  remboursement_autonome: boolean; montant_restant: number; peut_rembourser: boolean; peut_refuser: boolean;
}
interface Props { gestionnaireId: number; accent: string; isMobile: boolean; commandeId: number; onRetour: () => void; naviguer?: (page: string) => void }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626' };
const STATUTS: Record<string, { l: string; bg: string; c: string }> = {
  en_attente: { l: 'En attente', bg: '#FEF9E7', c: '#B7950B' }, confirmee: { l: 'Confirmée', bg: '#EAF2F8', c: '#2874A6' },
  expediee: { l: '📦 Expédiée', bg: '#F4ECF7', c: '#7D3C98' }, livree: { l: '✅ Livrée', bg: '#E9F7EF', c: '#1E8449' },
  annulee: { l: 'Annulée', bg: '#FDECEA', c: '#C0392B' },
};
const PAIEMENTS: Record<string, { l: string; bg: string; c: string }> = {
  en_attente: { l: 'À payer', bg: '#FEF9E7', c: '#B7950B' }, paye: { l: 'Payé', bg: '#E9F7EF', c: '#1E8449' },
  rembourse: { l: 'Remboursé', bg: '#f3f4f6', c: '#6b7280' }, echoue: { l: 'Échoué', bg: '#FDECEA', c: '#C0392B' },
};
const STATUT_REMB: Record<string, string> = { en_attente: '⏳ En attente d\'approbation', en_cours: '⏳ En cours', effectue: '✅ Effectué', refuse: '✕ Refusé', echoue: '⚠️ Échoué' };
const EVENEMENTS: Record<string, string> = {
  statut_confirmee: 'Commande confirmée', statut_expediee: 'Commande expédiée', statut_livree: 'Commande livrée', statut_annulee: 'Commande annulée',
  commande_refusee: 'Commande refusée', remboursement_demande: 'Remboursement demandé', remboursement_effectue: 'Remboursement effectué',
  remboursement_refuse: 'Remboursement refusé', remboursement_echoue: 'Remboursement échoué', remboursement_retire: 'Demande retirée',
};
const TAXES_LIB: Record<string, string> = { tps: 'TPS', tvq: 'TVQ', tvh: 'TVH', tvp: 'TVP' };
const argent = (v: string | number | null | undefined) => (v === null || v === undefined || v === '' ? '—' : formaterPrix(v));
const dateLongue = (d: string | null) => { if (!d) return ''; try { return new Date(d).toLocaleString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };
const urlSure = (u: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);

function Pastille({ info }: { info?: { l: string; bg: string; c: string } }) {
  if (!info) return null;
  return <span style={{ background: info.bg, color: info.c, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{info.l}</span>;
}

export default function CollaborateurCommandeDetail({ gestionnaireId, accent, isMobile, commandeId, onRetour, naviguer }: Props) {
  const base = `/api/collab/${gestionnaireId}/commandes/${commandeId}`;
  const [d, setD] = useState<Detail | null>(null);
  const [erreurPage, setErreurPage] = useState('');
  const [erreur, setErreur] = useState(''); const [info, setInfo] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [mode, setMode] = useState<'' | 'expedier' | 'refuser' | 'rembourser' | 'annuler'>('');
  const [exp, setExp] = useState({ transporteur: '', suivi: '', url: '', date: '' });
  const [raison, setRaison] = useState('');
  const [partiel, setPartiel] = useState(false); const [montant, setMontant] = useState('');

  const charger = useCallback(async () => {
    try {
      const res = await fetch(base, { credentials: 'include' });
      if (res.ok) { setD(await res.json()); setErreurPage(''); } else setErreurPage((await res.json().catch(() => ({}))).error || 'Commande introuvable');
    } catch { setErreurPage('Erreur réseau'); }
  }, [base]);
  useEffect(() => { charger(); }, [charger]);

  const fermer = () => { setMode(''); setRaison(''); setMontant(''); setPartiel(false); };
  const envoyer = async (url: string, methode: string, corps?: object, message?: string) => {
    setOccupe(true); setErreur(''); setInfo('');
    try {
      const res = await fetch(url, { method: methode, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: corps ? JSON.stringify(corps) : undefined });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        fermer(); await charger();
        setInfo(j.statut === 'en_attente' ? 'Demande envoyée au gestionnaire : le remboursement sera effectué à son approbation.' : (message || 'Fait.'));
      } else setErreur(j.error || 'Action impossible');
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };

  const confirmer = () => envoyer(`${base}/statut`, 'PUT', { statut: 'confirmee' }, 'Commande acceptée.');
  const livrer = () => envoyer(`${base}/statut`, 'PUT', { statut: 'livree' }, 'Commande marquée livrée.');
  const expedier = () => envoyer(`${base}/statut`, 'PUT', { statut: 'expediee', transporteur: exp.transporteur, numero_suivi: exp.suivi, url_suivi: exp.url, date_livraison_prevue: exp.date || undefined }, 'Commande marquée expédiée : le client est avisé.');
  const annulerSimple = () => envoyer(`${base}/statut`, 'PUT', { statut: 'annulee', raison }, 'Commande annulée.');
  const refuser = () => envoyer(`${base}/refuser`, 'POST', { raison }, 'Commande refusée et remboursée.');
  const rembourser = () => {
    const corps: { raison: string; total?: boolean; montant?: number } = { raison };
    if (partiel) corps.montant = Number(montant.replace(',', '.')); else corps.total = true;
    envoyer(`${base}/rembourser`, 'POST', corps, 'Remboursement effectué.');
  };
  const retirer = () => envoyer(`${base}/remboursement-en-attente`, 'DELETE', undefined, 'Demande retirée.');

  const champ: React.CSSProperties = { border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' };
  const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 14 };
  const titre: React.CSSProperties = { margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: T.light, textTransform: 'uppercase', letterSpacing: 0.3 };
  const btn = (plein: boolean, danger = false): React.CSSProperties => ({
    padding: '10px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: occupe ? 'default' : 'pointer', opacity: occupe ? 0.6 : 1,
    border: plein ? 'none' : `1px solid ${danger ? T.danger : T.border}`, background: plein ? (danger ? T.danger : accent) : '#fff', color: plein ? '#fff' : (danger ? T.danger : T.text),
  });

  if (erreurPage) return (
    <div style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
      <p style={{ color: T.danger }}>{erreurPage}</p><button onClick={onRetour} style={btn(true)}>← Retour aux commandes</button>
    </div>
  );
  if (!d) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>;

  const payee = d.statut_paiement === 'paye';
  const nomClient = [d.acheteur_prenom, d.acheteur_nom].filter(Boolean).join(' ') || d.acheteur_email || '—';
  const ouverte = d.remboursements.find(r => r.statut === 'en_attente' || r.statut === 'en_cours');
  const dernier = d.remboursements[0];
  const lignes = d.articles || [];
  const sousTotal = lignes.reduce((s, a) => s + Number(a.prix || 0) * Number(a.quantite ?? 1), 0);
  const taxes = d.taxes ? Object.entries(d.taxes).filter(([, v]) => Number(v) > 0) : [];
  const lienSuivi = urlSure(d.url_suivi);
  const peutAccepter = d.transitions.includes('confirmee');
  const peutExpedier = d.transitions.includes('expediee') && payee;
  const peutLivrer = d.transitions.includes('livree');
  const peutAnnulerSimple = d.transitions.includes('annulee') && !payee;
  const rgl = d.regles;
  const manqueSuivi = !!rgl?.suivi_obligatoire && (!exp.transporteur.trim() || !exp.suivi.trim());
  const manqueDate = !!rgl?.date_active && !!rgl?.date_obligatoire && !exp.date;
  const expOk = !manqueSuivi && !manqueDate;
  const accepterEtExpedier = d.statut === 'en_attente' && peutExpedier;
  const montantNum = Number(montant.replace(',', '.'));
  const montantOk = !partiel || (montantNum > 0 && montantNum <= d.montant_restant + 0.001);

  const gauche = (
    <>
      <div style={carte}>
        <p style={titre}>Articles</p>
        {lignes.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
            {a.image_url && <img src={a.image_url} alt="" style={{ width: 42, height: 42, borderRadius: 6, objectFit: 'cover' }} />}
            <span style={{ flex: 1, minWidth: 0 }}>{a.titre || 'Article'} × {a.quantite ?? 1}{a.variante ? <span style={{ color: T.light }}> · {a.variante}</span> : null}</span>
            <strong>{argent(Number(a.prix || 0) * Number(a.quantite ?? 1))}</strong>
          </div>
        ))}
        <div style={{ fontSize: 13, paddingTop: 10, display: 'grid', gap: 5 }}>
          <Ligne l="Sous-total" v={argent(sousTotal)} />
          {Number(d.rabais) > 0 && <Ligne l={`Rabais${d.code_promo ? ' (' + d.code_promo + ')' : ''}`} v={'− ' + argent(d.rabais)} />}
          {Number(d.frais_expedition) > 0 && <Ligne l="Livraison" v={argent(d.frais_expedition)} />}
          {taxes.map(([k, v]) => <Ligne key={k} l={TAXES_LIB[k.toLowerCase()] || k} v={argent(v as string)} />)}
          <Ligne l="Total" v={argent(d.total)} fort />
          {Number(d.montant_rembourse) > 0 && <Ligne l="Déjà remboursé" v={'− ' + argent(d.montant_rembourse)} rouge />}
          {payee && Number(d.montant_rembourse) > 0 && <Ligne l="Reste remboursable" v={argent(d.montant_restant)} />}
        </div>
      </div>

      <div style={carte}>
        <p style={titre}>Client</p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
          <strong>{nomClient}</strong><br />
          <span style={{ color: T.light }}>{[d.acheteur_email, d.acheteur_telephone].filter(Boolean).join(' · ')}</span>
        </p>
        {d.adresse_livraison && Object.keys(d.adresse_livraison).length > 0 && (
          <p style={{ margin: '10px 0 0', fontSize: 13 }}>📍 {Object.values(d.adresse_livraison).filter(v => typeof v === 'string' || typeof v === 'number').join(', ')}</p>
        )}
        {d.note && <p style={{ background: '#FEF9E7', borderRadius: 8, padding: '8px 12px', fontSize: 13, margin: '10px 0 0' }}>📝 {d.note}</p>}
      </div>

      {d.retours.length > 0 && (
        <div style={carte}>
          <p style={titre}>Demandes de retour</p>
          {d.retours.map(r => <p key={r.id} style={{ margin: '0 0 4px', fontSize: 13 }}>↩️ {r.motif} <span style={{ color: T.light }}>({r.statut})</span></p>)}
          <a onClick={() => naviguer?.('commandes-retours')} style={{ color: accent, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Gérer les retours →</a>
        </div>
      )}

      <div style={carte}>
        <p style={titre}>Historique</p>
        {d.historique.length === 0 ? <p style={{ margin: 0, fontSize: 13, color: T.light }}>Aucun événement.</p> : d.historique.map((h, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12, padding: '6px 0', borderBottom: i < d.historique.length - 1 ? `1px solid ${T.border}` : 'none' }}>
            <span style={{ color: T.light, minWidth: 110 }}>{dateLongue(h.created_at)}</span>
            <span style={{ flex: 1 }}><strong>{EVENEMENTS[h.evenement] || h.evenement}</strong>{h.detail ? <span style={{ color: T.light }}> — {h.detail}</span> : null}</span>
          </div>
        ))}
      </div>
    </>
  );

  const droite = (
    <>
      <div style={carte}>
        <p style={titre}>Gérer la commande</p>

        {ouverte && (
          <div style={{ background: '#FEF9E7', border: '1px solid #F1C40F', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 13 }}>
            <strong>⏳ Remboursement de {argent(ouverte.montant)} en attente d'approbation</strong>
            <p style={{ margin: '6px 0 8px', color: T.light }}>Raison : {ouverte.raison}<br />Le gestionnaire doit l'approuver. Rien n'est remboursé ni annulé d'ici là.</p>
            {ouverte.statut === 'en_attente' && <button disabled={occupe} onClick={retirer} style={btn(false)}>Retirer ma demande</button>}
          </div>
        )}
        {!ouverte && dernier && dernier.statut === 'refuse' && (
          <div style={{ background: '#FDECEA', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 13, color: '#C0392B' }}>
            Demande de remboursement refusée par le gestionnaire{dernier.motif_refus ? ` : « ${dernier.motif_refus} »` : '.'}
          </div>
        )}
        {!ouverte && dernier && dernier.statut === 'echoue' && (
          <div style={{ background: '#FDECEA', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 13, color: '#C0392B' }}>
            Le remboursement a échoué (Stripe) : {dernier.erreur || 'erreur inconnue'}. Vous pouvez réessayer.
          </div>
        )}
        {d.statut === 'annulee' && d.raison_annulation && <p style={{ fontSize: 13, margin: '0 0 12px' }}>Raison de l'annulation : <strong>{d.raison_annulation}</strong></p>}
        {!payee && d.statut !== 'annulee' && <p style={{ fontSize: 13, color: '#B7950B', margin: '0 0 12px' }}>⏳ En attente du paiement du client : la commande ne peut pas être expédiée avant.</p>}

        {erreur && <div style={{ background: '#FDECEA', color: '#C0392B', padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erreur}</div>}
        {info && <div style={{ background: '#E9F7EF', color: '#1E8449', padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{info}</div>}

        {mode === '' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {peutAccepter && payee && <button disabled={occupe} onClick={confirmer} style={btn(true)}>✔ Accepter la commande</button>}
            {peutExpedier && <button disabled={occupe} onClick={() => setMode('expedier')} style={btn(true)}>{accepterEtExpedier ? '📦 Accepter et expédier' : '📦 Marquer expédiée'}</button>}
            {peutLivrer && <button disabled={occupe} onClick={livrer} style={btn(true)}>✅ Marquer livrée</button>}
            {d.peut_refuser && <button disabled={occupe} onClick={() => setMode('refuser')} style={btn(false, true)}>✕ Refuser la commande</button>}
            {peutAnnulerSimple && <button disabled={occupe} onClick={() => setMode('annuler')} style={btn(false, true)}>✕ Annuler</button>}
            {d.peut_rembourser && <button disabled={occupe} onClick={() => setMode('rembourser')} style={btn(false)}>↩️ Rembourser</button>}
            {!peutAccepter && !peutExpedier && !peutLivrer && !d.peut_refuser && !d.peut_rembourser && !peutAnnulerSimple && !ouverte && (
              <span style={{ fontSize: 12, color: T.light }}>Aucune action possible pour cette commande.</span>
            )}
          </div>
        )}

        {mode === 'expedier' && (
          <div style={{ display: 'grid', gap: 8 }}>
            <input value={exp.transporteur} onChange={e => setExp({ ...exp, transporteur: e.target.value })} maxLength={60} placeholder={rgl?.suivi_obligatoire ? 'Transporteur (obligatoire) — Postes Canada…' : 'Transporteur (Postes Canada…)'} style={champ} />
            <input value={exp.suivi} onChange={e => setExp({ ...exp, suivi: e.target.value })} maxLength={80} placeholder={rgl?.suivi_obligatoire ? 'Numéro de suivi (obligatoire)' : 'Numéro de suivi (facultatif)'} style={champ} />
            <input value={exp.url} onChange={e => setExp({ ...exp, url: e.target.value })} maxLength={300} placeholder="Lien de suivi (facultatif) https://…" style={champ} />
            {rgl?.date_active && (
              <label style={{ fontSize: 12, color: T.light, display: 'grid', gap: 4 }}>
                Date de livraison prévue{rgl.date_obligatoire ? ' (obligatoire)' : ' (facultatif)'}
                <input type="date" value={exp.date} onChange={e => setExp({ ...exp, date: e.target.value })} style={champ} />
              </label>
            )}
            {!expOk && (
              <div style={{ background: '#FEF5E7', color: '#B9770E', padding: '8px 12px', borderRadius: 8, fontSize: 12 }}>
                ⚠️ {manqueSuivi && 'Le transporteur et le numéro de suivi sont obligatoires'}{manqueSuivi && manqueDate && ' · '}{manqueDate && 'La date de livraison prévue est obligatoire'} pour expédier cette commande.
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}><button disabled={occupe || !expOk} onClick={expedier} style={{ ...btn(true), opacity: occupe || !expOk ? 0.5 : 1 }}>{accepterEtExpedier ? "✔ Accepter et confirmer l'expédition" : "✔ Confirmer l'expédition"}</button><button onClick={fermer} style={btn(false)}>Annuler</button></div>
          </div>
        )}

        {(mode === 'refuser' || mode === 'annuler') && (
          <div style={{ display: 'grid', gap: 8 }}>
            <p style={{ margin: 0, fontSize: 13 }}>
              {mode === 'refuser'
                ? (d.remboursement_autonome ? `Le client sera remboursé de ${argent(d.montant_restant)} et sera avisé avec votre raison.` : `Une demande de remboursement de ${argent(d.montant_restant)} sera envoyée au gestionnaire. La commande sera annulée à son approbation.`)
                : 'Le client sera avisé de l\'annulation avec votre raison.'}
            </p>
            <textarea value={raison} onChange={e => setRaison(e.target.value)} maxLength={500} rows={3} placeholder="Raison (obligatoire) — ex. : article brisé, rupture de stock…" style={{ ...champ, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={occupe || !raison.trim()} onClick={mode === 'refuser' ? refuser : annulerSimple} style={{ ...btn(true, true), opacity: occupe || !raison.trim() ? 0.5 : 1 }}>
                {mode === 'refuser' ? (d.remboursement_autonome ? '✕ Refuser et rembourser' : '✕ Envoyer la demande') : '✕ Annuler la commande'}
              </button>
              <button onClick={fermer} style={btn(false)}>Retour</button>
            </div>
          </div>
        )}

        {mode === 'rembourser' && (
          <div style={{ display: 'grid', gap: 8 }}>
            <p style={{ margin: 0, fontSize: 13 }}>
              Reste remboursable : <strong>{argent(d.montant_restant)}</strong>.{' '}
              {d.remboursement_autonome ? 'Le remboursement est effectué tout de suite sur la carte du client.' : 'Votre demande sera envoyée au gestionnaire pour approbation.'}
            </p>
            <label style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}><input type="radio" checked={!partiel} onChange={() => setPartiel(false)} /> Remboursement total ({argent(d.montant_restant)})</label>
            <label style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}><input type="radio" checked={partiel} onChange={() => setPartiel(true)} /> Remboursement partiel</label>
            {partiel && <input value={montant} onChange={e => setMontant(e.target.value)} inputMode="decimal" placeholder={`Montant (max ${formaterPrix(d.montant_restant)})`} style={champ} />}
            <textarea value={raison} onChange={e => setRaison(e.target.value)} maxLength={500} rows={3} placeholder="Raison (obligatoire)" style={{ ...champ, resize: 'vertical' }} />
            <p style={{ margin: 0, fontSize: 11, color: T.light }}>Remarque : un remboursement partiel n'annule pas la commande ni ne remet le stock en vente.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={occupe || !raison.trim() || !montantOk || (partiel && !montant)} onClick={rembourser} style={{ ...btn(true), opacity: occupe || !raison.trim() || !montantOk || (partiel && !montant) ? 0.5 : 1 }}>
                {d.remboursement_autonome ? '↩️ Rembourser' : '↩️ Envoyer la demande'}
              </button>
              <button onClick={fermer} style={btn(false)}>Retour</button>
            </div>
          </div>
        )}
      </div>

      {(d.numero_suivi || d.transporteur || lienSuivi || d.date_livraison_prevue) && (
        <div style={carte}>
          <p style={titre}>Expédition</p>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7 }}>
            🚚 {d.transporteur || 'Transporteur non précisé'}{d.numero_suivi ? <> · suivi <strong>{d.numero_suivi}</strong></> : null}
            {d.date_livraison_prevue && <><br />📅 Livraison prévue : <strong>{new Date(String(d.date_livraison_prevue).slice(0, 10) + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></>}
            {lienSuivi && <><br /><a href={lienSuivi} target="_blank" rel="noopener noreferrer" style={{ color: accent, fontWeight: 700 }}>Ouvrir le suivi ↗</a></>}
          </p>
        </div>
      )}

      {d.remboursements.length > 0 && (
        <div style={carte}>
          <p style={titre}>Remboursements</p>
          {d.remboursements.map(r => (
            <div key={r.id} style={{ fontSize: 13, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>{argent(r.montant)}</strong><span>{STATUT_REMB[r.statut] || r.statut}</span></div>
              <div style={{ color: T.light }}>{r.origine === 'refus' ? 'Refus de commande' : 'Remboursement'} · {dateLongue(r.created_at)}<br />Raison : {r.raison}{r.motif_refus ? <><br />Refusé : {r.motif_refus}</> : null}</div>
            </div>
          ))}
        </div>
      )}

      {payee && d.montant_net !== null && (
        <div style={carte}>
          <p style={titre}>Vos revenus</p>
          <div style={{ fontSize: 13, display: 'grid', gap: 5 }}>
            <Ligne l="Commission du marché" v={'− ' + argent(d.commission)} />
            <Ligne l="Montant net (avant remboursements)" v={argent(d.montant_net)} fort />
          </div>
        </div>
      )}
    </>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <button onClick={onRetour} style={{ background: 'none', border: 'none', color: accent, fontWeight: 700, cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 10 }}>← Retour aux commandes</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: T.text }}>Commande {d.numero_commande}</h2>
        <Pastille info={d.statut === 'en_attente' && payee && d.regles?.accepter ? { l: '🔔 À accepter', bg: '#FEF5E7', c: '#B9770E' } : STATUTS[d.statut]} /><Pastille info={PAIEMENTS[d.statut_paiement]} />
        <span style={{ fontSize: 12, color: T.light }}>{dateLongue(d.date_commande)}</span>
      </div>
      <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, alignItems: 'start' }}>
        {isMobile ? <>{droite}{gauche}</> : <><div>{gauche}</div><div>{droite}</div></>}
      </div>
    </div>
  );
}

function Ligne({ l, v, fort, rouge }: { l: string; v: string; fort?: boolean; rouge?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontWeight: fort ? 700 : 400, color: rouge ? '#C0392B' : undefined, ...(fort ? { borderTop: `1px solid ${T.border}`, paddingTop: 6, marginTop: 2 } : {}) }}>
      <span>{l}</span><span>{v}</span>
    </div>
  );
}