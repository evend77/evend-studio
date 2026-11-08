// CHEMIN : src/pages/collaborateur/CollaborateurCommandeDetail.tsx
// e-Vend Studio — Dashboard collaborateur : page de gestion d'UNE commande
// (accepter / refuser = remboursement avec raison, expédition + suivi, annulation, remboursement partiel ou total)
// API : /api/collab/:gestionnaireId/commandes/:id[/statut|/refuser|/rembourser|/remboursement-en-attente]

import React, { useState, useEffect, useCallback } from 'react';
import { formaterPrix } from '../../templates/shared/devise';
import SuiviCommande from '../../templates/shared/SuiviCommande';

interface Article { titre?: string; prix?: number | string; quantite?: number; image_url?: string; variante?: string; poids?: number | string }
interface Remb { id: number; origine: string; montant: string; raison: string; statut: string; demande_par: string | null; motif_refus: string | null; erreur: string | null; created_at: string; traite_le: string | null }
interface Histo { evenement: string; detail: string | null; auteur: string | null; created_at: string }
interface Detail {
  id: number; numero_commande: string; statut: string; statut_paiement: string; total: string; commission: string | null; montant_net: string | null;
  articles: Article[] | null; adresse_livraison: Record<string, unknown> | null; note: string | null; date_commande: string;
  numero_suivi: string | null; transporteur: string | null; url_suivi: string | null; paye_le: string | null;
  etiquette_provider: string | null; url_etiquette: string | null; etape_livraison: string | null; historique_suivi: unknown;
  frais_expedition: string | null; taxes: Record<string, unknown> | null; code_promo: string | null; rabais: string | null;
  montant_rembourse: string | null; raison_annulation: string | null; date_livraison_prevue: string | null;
  regles?: { suivi_obligatoire: boolean; date_active: boolean; date_obligatoire: boolean; accepter: boolean; accepter_expedier: boolean };
  acheteur_prenom: string | null; acheteur_nom: string | null; acheteur_email: string | null; acheteur_telephone: string | null;
  retours: { id: number; motif: string; statut: string }[]; remboursements: Remb[]; historique: Histo[]; transitions: string[];
  remboursement_autonome: boolean; montant_restant: number; peut_rembourser: boolean; peut_refuser: boolean;
  gains?: Gains;
}
interface Gains {
  sous_total: number; commission_ht: number; commission_taxes: { tps: number; tvq: number; tvh: number; tvp: number }; commission_taxes_total: number;
  pourboire_total: number; pourboire_plateforme: number; pourboire_collab: number; total_retenu: number; frais_stripe_estime: number; frais_stripe_reel: boolean;
  ratio_rembourse: number; retenu_rendu: number; net_final: number; taxes_incluses: boolean;
}
interface Props { gestionnaireId: number; accent: string; isMobile: boolean; commandeId: number; onRetour: () => void; naviguer?: (page: string) => void; etiquettes?: boolean }

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
  etiquette_creee: 'Étiquette créée', commande_refusee: 'Commande refusée', remboursement_demande: 'Remboursement demandé', remboursement_effectue: 'Remboursement effectué',
  remboursement_refuse: 'Remboursement refusé', remboursement_echoue: 'Remboursement échoué', remboursement_retire: 'Demande retirée', etape_livraison: 'Statut de livraison modifié',
};
// Statuts de livraison modifiables à la main (mêmes choix que sur e-Vend) : libellé → clé d'étape
const STATUTS_LIVRAISON: { cle: string; l: string }[] = [
  { cle: 'payee', l: '⏳ En attente' }, { cle: 'etiquette_creer', l: '🏷️ Étiquette créée' }, { cle: 'expediee', l: '🚚 Expédiée' },
  { cle: 'transit', l: '🚛 En transit' }, { cle: 'tri', l: '🏢 Centre de tri' }, { cle: 'livraison', l: '📍 En cours de livraison' },
  { cle: 'prete_ramassage', l: '🏪 Prêt à récupérer sur place' }, { cle: 'livree', l: '✅ Livré' },
  { cle: 'livraison_echouee', l: '⚠️ Échec de livraison' }, { cle: 'retournee_expediteur', l: "↩️ Retourné à l'expéditeur" },
];
const NOMS_TRANSPORTEUR: Record<string, string> = { shippo: 'Shippo', easypost: 'EasyPost', postescanada: 'Postes Canada' };
const TAXES_LIB: Record<string, string> = { tps: 'TPS', tvq: 'TVQ', tvh: 'TVH', tvp: 'TVP' };
const argent = (v: string | number | null | undefined) => (v === null || v === undefined || v === '' ? '—' : formaterPrix(v));
const dateLongue = (d: string | null) => { if (!d) return ''; try { return new Date(d).toLocaleString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };
const urlSure = (u: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);
// L'étiquette est un lien http(s) (ou, pour Postes Canada, un PDF intégré)
const urlEtiquetteSure = (u: string | null | undefined) => (u && (/^https?:\/\//i.test(u) || /^data:application\/pdf;base64,[A-Za-z0-9+/=]+$/.test(u)) ? u : null);

function Rangee({ l, v, badge }: { l: string; v?: string; badge?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
      <span style={{ color: T.light, fontSize: 12 }}>{l}</span>{badge ?? <span style={{ fontWeight: 600, textAlign: 'right' }}>{v || '—'}</span>}
    </div>
  );
}
function SousTitre({ t }: { t: string }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: T.light, textTransform: 'uppercase', letterSpacing: 0.5, margin: '12px 0 2px' }}>{t}</div>;
}

function Pastille({ info }: { info?: { l: string; bg: string; c: string } }) {
  if (!info) return null;
  return <span style={{ background: info.bg, color: info.c, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{info.l}</span>;
}

export default function CollaborateurCommandeDetail({ gestionnaireId, accent, isMobile, commandeId, onRetour, naviguer, etiquettes }: Props) {
  const base = `/api/collab/${gestionnaireId}/commandes/${commandeId}`;
  const [d, setD] = useState<Detail | null>(null);
  const [erreurPage, setErreurPage] = useState('');
  const [erreur, setErreur] = useState(''); const [info, setInfo] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [mode, setMode] = useState<'' | 'expedier' | 'refuser' | 'rembourser' | 'annuler'>('');
  const [exp, setExp] = useState({ transporteur: '', suivi: '', url: '', date: '' });
  const [raison, setRaison] = useState('');
  const [partiel, setPartiel] = useState(false); const [montant, setMontant] = useState('');

  // ── Statut de livraison manuel ──
  const [modalStatut, setModalStatut] = useState(false);
  const [etapeChoisie, setEtapeChoisie] = useState('payee');
  const [ramassage, setRamassage] = useState({ adresse: '', heures: '', date: '' });
  const [statutErreur, setStatutErreur] = useState('');

  // ── Étiquette d'expédition (add-on Shippo…) ──
  interface Tarif { rateId: string; shipmentId?: string; transporteur: string; service: string; montant: number | string; devise: string; delaiEstimeJours: number | null }
  const [modalEtiquette, setModalEtiquette] = useState(false);
  const [dim, setDim] = useState({ l: '30', w: '20', h: '10' });
  const [poids, setPoids] = useState('');
  const [tarifs, setTarifs] = useState<Tarif[] | null>(null);
  const [chargementTarifs, setChargementTarifs] = useState(false);
  const [erreurEtiq, setErreurEtiq] = useState('');
  const [diagnostic, setDiagnostic] = useState<unknown>(null);
  const [diagOuvert, setDiagOuvert] = useState(false);
  const [achatEnCours, setAchatEnCours] = useState<string | null>(null);

  const ouvrirEtiquette = () => {
    const kg = (d?.articles || []).reduce((s, a) => s + (parseFloat(String(a.poids ?? '')) || 0) * Number(a.quantite ?? 1), 0);
    setPoids(kg > 0 ? String(Math.round(kg * 100) / 100) : '');
    setTarifs(null); setErreurEtiq(''); setDiagnostic(null); setDiagOuvert(false);
    setModalEtiquette(true);
  };
  const corpsColis = () => ({
    longueur_cm: parseFloat(dim.l) || undefined, largeur_cm: parseFloat(dim.w) || undefined, hauteur_cm: parseFloat(dim.h) || undefined,
    poids_kg: poids ? parseFloat(poids) : undefined,
  });
  const chercherTarifs = async () => {
    setChargementTarifs(true); setErreurEtiq(''); setDiagnostic(null); setDiagOuvert(false); setTarifs(null);
    try {
      const res = await fetch(`${base}/tarifs-expedition`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpsColis()) });
      const j = await res.json().catch(() => ({}));
      if (j.diagnostic) setDiagnostic(j.diagnostic);
      if (res.ok) setTarifs(j.tarifs || []); else setErreurEtiq(j.error || 'Erreur lors de la récupération des tarifs');
    } catch { setErreurEtiq('Erreur de connexion au serveur'); }
    setChargementTarifs(false);
  };
  // Le clic sur « Acheter » pour un tarif précis EST la confirmation (le prix et le service sont déjà affichés).
  const acheterEtiquette = async (t: Tarif) => {
    setAchatEnCours(t.rateId); setErreurEtiq('');
    try {
      const res = await fetch(`${base}/etiquette`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate_id: t.rateId, shipment_id: t.shipmentId, transporteur: t.transporteur, service: t.service, ...corpsColis() }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setErreurEtiq(j.error || "Erreur lors de l'achat de l'étiquette"); setAchatEnCours(null); return; }
      setModalEtiquette(false); setAchatEnCours(null);
      await charger();
      setInfo(`Étiquette créée${j.numero_suivi ? ` · suivi ${j.numero_suivi}` : ''} : la commande est expédiée et le client est avisé.`);
      const lien = urlEtiquetteSure(j.url_etiquette);
      if (lien) window.open(lien, '_blank');
    } catch { setErreurEtiq('Erreur de connexion au serveur'); setAchatEnCours(null); }
  };

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
  const ouvrirStatut = () => {
    if (!d) return;
    const e = d.etape_livraison || '';
    setEtapeChoisie(STATUTS_LIVRAISON.some(x => x.cle === e) ? e : d.statut === 'livree' ? 'livree' : d.statut === 'expediee' ? 'expediee' : 'payee');
    setRamassage({ adresse: '', heures: '', date: '' }); setStatutErreur(''); setModalStatut(true);
  };
  const sauvegarderStatut = async () => {
    setOccupe(true); setStatutErreur('');
    try {
      const corps: Record<string, string | undefined> = { etape: etapeChoisie };
      if (etapeChoisie === 'prete_ramassage') { corps.adresse_ramassage = ramassage.adresse; corps.heures_ramassage = ramassage.heures; corps.date_limite_ramassage = ramassage.date || undefined; }
      const res = await fetch(`${base}/etape-livraison`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
      const j = await res.json().catch(() => ({}));
      if (res.ok) { setModalStatut(false); await charger(); setInfo('Statut de livraison mis à jour.'); setErreur(''); }
      else setStatutErreur(j.error || 'Mise à jour impossible');
    } catch { setStatutErreur('Erreur de connexion au serveur'); }
    setOccupe(false);
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
  // Étiquette : commande payée, acceptée (ou « accepter et expédier » permis) ou déjà expédiée à la main, sans étiquette déjà achetée
  const peutEtiquette = !!etiquettes && payee && !d.etiquette_provider && d.statut !== 'livree' && d.statut !== 'annulee' && (d.statut === 'expediee' || d.transitions.includes('expediee'));
  const lienEtiquette = urlEtiquetteSure(d.url_etiquette);
  // Statut de livraison manuel : commande payée, non annulée, et (déjà acceptée ou acceptation non exigée avant l'expédition)
  const peutStatutLivraison = payee && d.statut !== 'annulee' && (d.statut !== 'en_attente' || !d.regles?.accepter || !!d.regles?.accepter_expedier);
  const rgl = d.regles;
  const manqueSuivi = !!rgl?.suivi_obligatoire && (!exp.transporteur.trim() || !exp.suivi.trim());
  const manqueDate = !!rgl?.date_active && !!rgl?.date_obligatoire && !exp.date;
  const expOk = !manqueSuivi && !manqueDate;
  const accepterEtExpedier = d.statut === 'en_attente' && peutExpedier;
  const montantNum = Number(montant.replace(',', '.'));
  const montantOk = !partiel || (montantNum > 0 && montantNum <= d.montant_restant + 0.001);

  const adr = (d.adresse_livraison || {}) as Record<string, unknown>;
  const adrTxt = (k: string) => (adr[k] === undefined || adr[k] === null ? '' : String(adr[k]));
  const nomLiv = [adrTxt('prenom'), adrTxt('nom')].filter(Boolean).join(' ') || nomClient;
  const g = d.gains;
  const retourLibelle = d.statut_paiement === 'rembourse' ? 'Remboursé' : Number(d.montant_rembourse) > 0 ? 'Remboursement partiel' : (PAIEMENTS[d.statut_paiement]?.l || d.statut_paiement);
  const taxesCom: [string, number][] = g ? [['TPS', g.commission_taxes.tps], ['TVQ', g.commission_taxes.tvq], ['TVH', g.commission_taxes.tvh], ['TVP', g.commission_taxes.tvp]] : [];
  const moins = (n: number) => '− ' + argent(n);

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
        <p style={titre}>Facturation &amp; expédition</p>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
          <div>
            <p style={{ ...titre, fontSize: 11, color: accent, borderBottom: '2px solid #f0f5f5', paddingBottom: 5 }}>Détails de facturation</p>
            <Rangee l="Mode de paiement" v="Carte (Stripe)" />
            <Rangee l="Nom" v={nomLiv} />
            <Rangee l="Adresse" v={adrTxt('adresse')} />
            <Rangee l="Ville" v={adrTxt('ville')} />
            <Rangee l="Province" v={adrTxt('province')} />
            <Rangee l="Pays" v={adrTxt('pays') || 'Canada'} />
            <Rangee l="Code postal" v={adrTxt('code_postal')} />
          </div>
          <div>
            <p style={{ ...titre, fontSize: 11, color: accent, borderBottom: '2px solid #f0f5f5', paddingBottom: 5 }}>Détails d'expédition</p>
            <Rangee l="Statut" badge={<Pastille info={STATUTS[d.statut]} />} />
            <Rangee l="Nom" v={nomLiv} />
            <Rangee l="Adresse de livraison" v={adrTxt('adresse')} />
            <Rangee l="Ville" v={adrTxt('ville')} />
            <Rangee l="Province" v={adrTxt('province')} />
            <Rangee l="Pays" v={adrTxt('pays') || 'Canada'} />
            <Rangee l="Code postal" v={adrTxt('code_postal')} />
          </div>
        </div>
      </div>

      <div style={carte}>
        <p style={titre}>Détails du client</p>
        <Rangee l="Nom" v={nomClient} />
        <Rangee l="E-mail" v={d.acheteur_email || ''} />
        {(d.acheteur_telephone || adrTxt('telephone')) && <Rangee l="Téléphone" v={d.acheteur_telephone || adrTxt('telephone')} />}
        {d.note && <p style={{ background: '#FEF9E7', borderRadius: 8, padding: '8px 12px', fontSize: 13, margin: '10px 0 0' }}>📝 {d.note}</p>}
      </div>

      {(
        <div style={carte}>
          <p style={titre}>Liste des demandes de retour (RMA)</p>
          {d.retours.length === 0 && <p style={{ margin: 0, fontSize: 12, color: T.light, fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>Aucune demande de retour pour cette commande.</p>}
          {d.retours.map(r => <p key={r.id} style={{ margin: '0 0 4px', fontSize: 13 }}>↩️ {r.motif} <span style={{ color: T.light }}>({r.statut})</span></p>)}
          {d.retours.length > 0 && <a onClick={() => naviguer?.('commandes-retours')} style={{ color: accent, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Gérer les retours →</a>}
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
            {peutEtiquette && <button disabled={occupe} onClick={ouvrirEtiquette} style={btn(true)}>{d.numero_suivi ? '🏷️ Acheter une étiquette (remplace le suivi manuel)' : '🏷️ Créer une étiquette'}</button>}
            {peutLivrer && <button disabled={occupe} onClick={livrer} style={btn(true)}>✅ Marquer livrée</button>}
            {d.peut_refuser && <button disabled={occupe} onClick={() => setMode('refuser')} style={btn(false, true)}>✕ Refuser la commande</button>}
            {peutAnnulerSimple && <button disabled={occupe} onClick={() => setMode('annuler')} style={btn(false, true)}>✕ Annuler</button>}
            {peutStatutLivraison && <button disabled={occupe} onClick={ouvrirStatut} style={btn(false)}>🚚 Statut de livraison</button>}
            {d.peut_rembourser && <button disabled={occupe} onClick={() => setMode('rembourser')} style={btn(false)}>↩️ Rembourser</button>}
            {!peutAccepter && !peutExpedier && !peutLivrer && !d.peut_refuser && !d.peut_rembourser && !peutAnnulerSimple && !ouverte && !peutStatutLivraison && (
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

      {(d.numero_suivi || d.transporteur || lienSuivi || lienEtiquette || d.date_livraison_prevue) && (
        <div style={carte}>
          <p style={titre}>Expédition</p>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7 }}>
            🚚 {d.transporteur || 'Transporteur non précisé'}{d.numero_suivi ? <> · suivi <strong>{d.numero_suivi}</strong></> : null}
            {d.date_livraison_prevue && <><br />📅 Livraison prévue : <strong>{new Date(String(d.date_livraison_prevue).slice(0, 10) + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></>}
            {lienSuivi && <><br /><a href={lienSuivi} target="_blank" rel="noopener noreferrer" style={{ color: accent, fontWeight: 700 }}>Ouvrir le suivi ↗</a></>}
            {lienEtiquette && <><br /><a href={lienEtiquette} target="_blank" rel="noopener noreferrer" style={{ color: accent, fontWeight: 700 }}>📄 Télécharger / imprimer l'étiquette ↗</a></>}
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

      <div style={carte}>
        <p style={titre}>État actuel de la commande</p>
        <Rangee l="Commandé le →" v={dateLongue(d.date_commande)} />
        <Rangee l="Mode de livraison →" v={d.transporteur || (Number(d.frais_expedition) > 0 ? 'Expédition' : 'Expédition gratuite')} />
        <Rangee l="Statut commande →" badge={<Pastille info={STATUTS[d.statut]} />} />
        <Rangee l="Statut paiement →" badge={<Pastille info={Number(d.montant_rembourse) > 0 && d.statut_paiement === 'paye' ? { l: retourLibelle, bg: '#f3f4f6', c: '#6b7280' } : PAIEMENTS[d.statut_paiement]} />} />
        <Rangee l="Sous-total →" v={argent(sousTotal)} />
        {Number(d.rabais) > 0 && <Rangee l={`Rabais${d.code_promo ? ' (' + d.code_promo + ')' : ''} →`} v={'− ' + argent(d.rabais)} />}
        <Rangee l="Expédition →" v={argent(d.frais_expedition ?? 0)} />
        {taxes.filter(([k]) => TAXES_LIB[k.toLowerCase()]).map(([k, v]) => <Rangee key={k} l={`${TAXES_LIB[k.toLowerCase()]} →`} v={argent(v as string)} />)}
        {g && g.pourboire_total > 0 && <Rangee l="💝 Pourboire →" v={argent(g.pourboire_total)} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 4, borderTop: `2px solid ${accent}` }}>
          <strong style={{ fontSize: 13, color: accent }}>Total payé par l'acheteur →</strong>
          <strong style={{ fontSize: 16, color: accent }}>{argent(d.total)}</strong>
        </div>
      </div>

      {payee || d.statut_paiement === 'rembourse' ? g && (
        <div style={carte}>
          <p style={titre}>💰 Gains du vendeur</p>
          <SousTitre t="Payé par l'acheteur" />
          <Rangee l="Produits" v={argent(g.sous_total)} />
          {Number(d.rabais) > 0 && <Rangee l="Rabais" v={moins(Number(d.rabais))} />}
          {Number(d.frais_expedition) > 0 && <Rangee l="Expédition" v={argent(d.frais_expedition)} />}
          {g.pourboire_total > 0 && <Rangee l="Pourboire" v={argent(g.pourboire_total)} />}
          {taxes.filter(([k]) => TAXES_LIB[k.toLowerCase()]).map(([k, v]) => <Rangee key={k} l={`${TAXES_LIB[k.toLowerCase()]} perçue`} v={argent(v as string)} />)}
          <Rangee l="Total payé" badge={<strong style={{ color: '#1E8449' }}>{argent(d.total)}</strong>} />

          <SousTitre t="Retenu par la plateforme" />
          <Rangee l="Commission" badge={<span style={{ fontWeight: 600, color: '#C0392B' }}>{moins(g.commission_ht)}</span>} />
          {taxesCom.filter(([, n]) => n > 0).map(([lib, n]) => <Rangee key={lib} l={`   ${lib} sur la commission`} badge={<span style={{ fontWeight: 600, color: '#C0392B' }}>{moins(n)}</span>} />)}
          {g.pourboire_plateforme > 0 && <Rangee l="Part du pourboire gardée" badge={<span style={{ fontWeight: 600, color: '#C0392B' }}>{moins(g.pourboire_plateforme)}</span>} />}
          <Rangee l="Total retenu" badge={<strong style={{ color: '#C0392B' }}>{moins(g.total_retenu)}</strong>} />

          <SousTitre t="Frais de paiement" />
          <Rangee l={g.frais_stripe_reel ? 'Frais Stripe' : 'Frais Stripe (estimé)'} badge={<span style={{ fontWeight: 600, color: '#C0392B' }}>{moins(g.frais_stripe_estime)}</span>} />

          {Number(d.montant_rembourse) > 0 && (
            <>
              <SousTitre t={g.ratio_rembourse >= 0.999 ? 'Remboursement total' : 'Remboursement partiel'} />
              <Rangee l="Remboursé à l'acheteur" badge={<span style={{ fontWeight: 600, color: '#C0392B' }}>{moins(Number(d.montant_rembourse))}</span>} />
              <Rangee l="Retenue rendue par la plateforme" badge={<span style={{ fontWeight: 600, color: '#1E8449' }}>+ {argent(g.retenu_rendu)}</span>} />
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 8, borderTop: `2px solid ${accent}` }}>
            <strong style={{ fontSize: 13, color: accent }}>Net pour vous →</strong>
            <strong style={{ fontSize: 15, color: g.net_final < 0 ? '#C0392B' : accent }}>{g.net_final < 0 ? '− ' + argent(Math.abs(g.net_final)) : argent(g.net_final)}</strong>
          </div>
          <p style={{ fontSize: 10, color: '#999', margin: '8px 0 0', lineHeight: 1.4 }}>
            Les taxes perçues sont celles de la vente ; vous êtes responsable de les remettre au fisc si vous êtes inscrit aux taxes.
            {g.frais_stripe_reel ? ' Frais Stripe réels, tels que facturés par Stripe.' : ' Frais Stripe estimés (2,9 % + 0,30 $) en attendant le montant réel de Stripe.'}
            {Number(d.montant_rembourse) > 0 ? ' Lors d\'un remboursement, la plateforme vous rend sa commission au prorata ; Stripe conserve toutefois ses frais.' : ''}
          </p>
        </div>
      ) : null}
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
      <SuiviCommande commande={d} theme="clair" accent={accent} isMobile={isMobile} titre="Suivi de la commande" />
      <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, alignItems: 'start' }}>
        {isMobile ? <>{droite}{gauche}</> : <><div>{gauche}</div><div>{droite}</div></>}
      </div>

      {modalStatut && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: isMobile ? 18 : 26, width: 440, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,.2)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, textTransform: 'uppercase', color: T.text }}>Changer le statut</h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: T.light }}>Sélectionnez le nouveau statut de livraison.</p>
            {d.etiquette_provider && (
              <div style={{ background: '#fff3cd', borderLeft: '4px solid #ffc107', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 12, color: '#856404' }}>
                ⚠️ Suivi automatique actif ({NOMS_TRANSPORTEUR[d.etiquette_provider] || d.etiquette_provider}) : dès que le transporteur envoie une mise à jour, le vrai statut du colis est rétabli.
              </div>
            )}
            {statutErreur && <div style={{ background: '#FDECEA', color: '#C0392B', padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{statutErreur}</div>}
            <select value={etapeChoisie} onChange={e => setEtapeChoisie(e.target.value)} style={{ ...champ, border: `2px solid ${accent}`, padding: '10px 14px', marginBottom: 16, background: '#fff', cursor: 'pointer' }}>
              {STATUTS_LIVRAISON.map(x => <option key={x.cle} value={x.cle}>{x.l}</option>)}
            </select>
            {etapeChoisie === 'prete_ramassage' && (
              <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.text }}>📍 Adresse de cueillette <span style={{ color: T.light, fontWeight: 400 }}>(incluse dans l'avis envoyé au client)</span>
                  <textarea rows={2} value={ramassage.adresse} onChange={e => setRamassage({ ...ramassage, adresse: e.target.value })} maxLength={200} style={{ ...champ, marginTop: 6, resize: 'vertical' }} /></label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.text }}>🕐 Heures d'ouverture<input value={ramassage.heures} onChange={e => setRamassage({ ...ramassage, heures: e.target.value })} maxLength={100} placeholder="ex : Lun-Ven 9h-17h" style={{ ...champ, marginTop: 6 }} /></label>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.text }}>📅 Date limite<input type="date" value={ramassage.date} onChange={e => setRamassage({ ...ramassage, date: e.target.value })} style={{ ...champ, marginTop: 6 }} /></label>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalStatut(false)} disabled={occupe} style={btn(false)}>Annuler</button>
              <button onClick={sauvegarderStatut} disabled={occupe} style={btn(true)}>{occupe ? '…' : 'Sauvegarder'}</button>
            </div>
          </div>
        </div>
      )}

      {modalEtiquette && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: isMobile ? 18 : 26, width: 540, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,.2)' }}>
            <div style={{ textAlign: 'center', fontSize: 44, marginBottom: 6 }}>🏷️</div>
            <h3 style={{ margin: '0 0 4px', fontSize: 19, textAlign: 'center', color: T.text }}>Créer une étiquette d'expédition</h3>
            <p style={{ margin: '0 0 18px', fontSize: 12, color: T.light, textAlign: 'center' }}>Commande {d.numero_commande}</p>

            <label style={{ display: 'block', margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: T.text }}>Dimensions du colis (cm)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              {([['Longueur', dim.l, 'l'], ['Largeur', dim.w, 'w'], ['Hauteur', dim.h, 'h']] as const).map(([lib, val, k]) => (
                <div key={k}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: T.light }}>{lib}</p>
                  <input type="number" min="1" value={val} onChange={e => setDim({ ...dim, [k]: e.target.value })} style={champ} />
                </div>
              ))}
            </div>

            <label style={{ display: 'block', margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: T.text }}>Poids total (kg)</label>
            <input type="number" min="0.01" step="0.01" value={poids} onChange={e => setPoids(e.target.value)} placeholder="Ex : 1.20" style={champ} />
            <p style={{ margin: '5px 0 16px', fontSize: 11, color: T.light }}>Préempli depuis le poids des articles s'il est connu — ajustez au besoin.</p>

            {erreurEtiq && <div style={{ background: '#FDECEA', borderLeft: '4px solid #E74C3C', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 12, color: '#C0392B' }}>⚠️ {erreurEtiq}</div>}

            {diagnostic != null && (
              <div style={{ background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 8, marginBottom: 14, overflow: 'hidden' }}>
                <button type="button" onClick={() => setDiagOuvert(o => !o)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', padding: '10px 14px', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#666' }}>🔍 Diagnostic (à copier-coller si besoin d'aide)</span>
                  <span style={{ fontSize: 12, color: '#666', transform: diagOuvert ? 'rotate(90deg)' : 'none' }}>▶</span>
                </button>
                {diagOuvert && <pre style={{ fontSize: 10, color: '#333', margin: 0, padding: '0 14px 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 200, overflowY: 'auto' }}>{JSON.stringify(diagnostic, null, 2)}</pre>}
              </div>
            )}

            {!tarifs && (
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => setModalEtiquette(false)} style={btn(false)}>Annuler</button>
                <button onClick={chercherTarifs} disabled={chargementTarifs || !poids || parseFloat(poids) <= 0} style={{ ...btn(true), opacity: chargementTarifs || !poids || parseFloat(poids) <= 0 ? 0.5 : 1 }}>
                  {chargementTarifs ? '⏳ Recherche des tarifs…' : '🔍 Obtenir les tarifs'}
                </button>
              </div>
            )}

            {tarifs && (
              <div>
                {tarifs.length === 0 ? (
                  <p style={{ fontSize: 13, color: T.light, textAlign: 'center', padding: '16px 0' }}>Aucun tarif disponible pour cette adresse et ces dimensions.</p>
                ) : (
                  <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                    {tarifs.map(t => (
                      <div key={t.rateId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '12px 14px', border: `1px solid ${T.border}`, borderRadius: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>{t.transporteur} — {t.service}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: T.light }}>{t.delaiEstimeJours ? `Livraison estimée : ${t.delaiEstimeJours} jour${t.delaiEstimeJours > 1 ? 's' : ''}` : 'Délai non précisé'}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: accent }}>{Number(t.montant).toFixed(2)} {t.devise}</span>
                          <button onClick={() => acheterEtiquette(t)} disabled={achatEnCours !== null} style={{ ...btn(true), background: '#27AE60', padding: '8px 14px', fontSize: 12, opacity: achatEnCours !== null ? 0.6 : 1 }}>
                            {achatEnCours === t.rateId ? '⏳ Achat…' : '✓ Acheter'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button onClick={() => setModalEtiquette(false)} disabled={achatEnCours !== null} style={btn(false)}>Annuler</button>
                  <button onClick={() => setTarifs(null)} disabled={achatEnCours !== null} style={btn(false)}>← Modifier dimensions/poids</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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