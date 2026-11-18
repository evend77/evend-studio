// CHEMIN : src/pages/boutique/BlocEnchereBoutique.tsx
// e-Vend Studio — Add-on « Enchères » (templates boutique solo) : bloc de la fiche produit. Adapté de BlocEnchere.tsx (MV).
// Montre : la mise actuelle, le compte à rebours, le champ de mise avec 3 montants rapides, et l'état de l'acheteur (en tête / surpassé).
// Le prix de réserve n'est jamais envoyé par le serveur : on sait seulement s'il est atteint. Toutes les règles (mise minimale, fin, prolongation) sont appliquées par le serveur.
// L'heure du serveur sert au compte à rebours (pas l'horloge de l'appareil). Rafraîchi toutes les 10 s.
// L'AFFICHAGE est dans VueEnchereBoutique (6 modèles + réglages d'apparence du gestionnaire, page « Config enchère »). Ce fichier garde la logique : chargement, compte à rebours, mises.
// Partagé par tous les templates boutique solo. API : GET /api/boutique/encheres/:gid/produit/:id (public) · GET …/encheres/:gid/:id/mises · POST /api/boutique/acheteur/:gid/encheres/:id/miser

import { useState, useEffect, useCallback, useRef } from 'react';
import { ba, messageAcheteur } from './boutiqueAcheteurApi';
import { formaterPrix } from '../../templates/shared/devise';
import VueEnchereBoutique, { APPARENCE_DEFAUT, type EnchereVue, type ApparenceEnchere, type Mise } from './VueEnchereBoutique';

interface Enchere extends EnchereVue { id: number; titre: string }

interface Props {
  gestionnaireId: number;
  produitId: number;
  couleurAccent: string;
  isDemo?: boolean;
  allerConnexion: () => void;
  onEtat?: (enchereEnCours: boolean) => void;   // la fiche produit s'en sert (cacher la vente directe, lignes de stock)
}

// Mémoire entre deux affichages du composant (la fiche produit se remonte quand la page se redessine) : évite le clignotement
const MEMO: Record<string, { enchere: Enchere | null; decalage: number; apparence: ApparenceEnchere }> = {};

const typeCompte = (gId: number): string | null => { try { return JSON.parse(localStorage.getItem(`mv_compte_${gId}`) || 'null')?.type || null; } catch { return null; } };

export default function BlocEnchereBoutique({ gestionnaireId, produitId, couleurAccent, isDemo, allerConnexion, onEtat }: Props) {
  const cle = `${gestionnaireId}:${produitId}`;
  const [enchere, setEnchere] = useState<Enchere | null>(() => (MEMO[cle] ? MEMO[cle].enchere : null));
  const [apparence, setApparence] = useState<ApparenceEnchere>(() => (MEMO[cle] ? MEMO[cle].apparence : APPARENCE_DEFAUT));
  const [aConfirmer, setAConfirmer] = useState<number | null>(null);
  const [decalage, setDecalage] = useState<number>(() => (MEMO[cle] ? MEMO[cle].decalage : 0));   // heure du serveur − heure de l'appareil
  const [pret, setPret] = useState<boolean>(!!MEMO[cle]);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const [montant, setMontant] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');
  const [histo, setHisto] = useState<Mise[] | null>(null);
  const [histoOuvert, setHistoOuvert] = useState(false);
  const fini = useRef(false);

  const charger = useCallback(() => {
    if (isDemo) { setPret(true); return; }
    const headers: Record<string, string> = {};
    try { const t = localStorage.getItem(`mv_token_${gestionnaireId}`); if (t) headers.Authorization = `Bearer ${t}`; } catch { /* stockage indisponible */ }
    fetch(`/api/boutique/encheres/${gestionnaireId}/produit/${produitId}`, { credentials: 'include', headers })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d) { setPret(true); return; }
        const dec = d.maintenant ? new Date(d.maintenant).getTime() - Date.now() : 0;
        const app: ApparenceEnchere = { ...APPARENCE_DEFAUT, ...(d.apparence || {}) };
        MEMO[cle] = { enchere: d.enchere || null, decalage: dec, apparence: app };
        setEnchere(d.enchere || null); setDecalage(dec); setApparence(app); setPret(true);
      }).catch(() => setPret(true));
  }, [gestionnaireId, produitId, isDemo, cle]);

  useEffect(() => { charger(); const t = setInterval(charger, 10000); return () => clearInterval(t); }, [charger]);
  useEffect(() => { const t = setInterval(() => setMaintenant(Date.now()), 1000); return () => clearInterval(t); }, []);

  const msRestant = enchere ? new Date(enchere.date_fin).getTime() - (maintenant + decalage) : 0;
  // À la fin du compte à rebours, on redemande une fois au serveur (il termine l'enchère et la page se met à jour)
  useEffect(() => {
    if (enchere && msRestant <= 0 && !fini.current) { fini.current = true; setTimeout(charger, 1500); }
    if (enchere && msRestant > 0) fini.current = false;
  }, [enchere, msRestant, charger]);

  useEffect(() => { if (pret && onEtat) onEtat(!!enchere && new Date(enchere.date_fin).getTime() > maintenant + decalage); }, [pret, enchere, onEtat]);   // eslint-disable-line react-hooks/exhaustive-deps

  const chargerHisto = async () => {
    if (!enchere) return;
    try {
      const r = await fetch(`/api/boutique/encheres/${gestionnaireId}/${enchere.id}/mises`);
      const d = r.ok ? await r.json() : null; setHisto(d && Array.isArray(d.mises) ? d.mises : []);
    } catch { setHisto([]); }
  };

  if (!pret || !enchere) return null;

  const termine = msRestant <= 0;
  const miser = async (valeur?: number, confirme = false) => {
    if (isDemo) { setErreur('Produit de démonstration : aucune enchère réelle.'); return; }
    const t = typeCompte(gestionnaireId);
    if (!t) { allerConnexion(); return; }
    if (t !== 'acheteur') { setErreur('Un compte acheteur est requis pour miser.'); return; }
    const v = valeur !== undefined ? valeur : Number(String(montant).replace(',', '.'));
    if (!Number.isFinite(v) || v <= 0) { setErreur('Entrez un montant valide.'); return; }
    if (apparence.confirmer && !confirme) { setErreur(''); setAConfirmer(v); return; }
    setAConfirmer(null);
    setOccupe(true); setErreur('');
    const r = await ba(gestionnaireId, `/encheres/${enchere.id}/miser`, { method: 'POST', body: { montant: v } });
    setOccupe(false);
    if (r.status === 401) { try { localStorage.removeItem(`mv_compte_${gestionnaireId}`); } catch { /* ignore */ } setErreur('Session expirée — reconnectez-vous.'); return; }
    if (!r.ok) { setErreur(messageAcheteur(r)); charger(); return; }
    setMontant(''); setInfo(`Mise de ${formaterPrix(v)} enregistrée : vous êtes en tête.`); setTimeout(() => setInfo(''), 5000);
    charger(); if (histoOuvert) chargerHisto();
  };

  return (
    <VueEnchereBoutique enchere={enchere} apparence={apparence} accent={couleurAccent} msRestant={msRestant}
      montant={montant} setMontant={v => { setMontant(v); setAConfirmer(null); }} occupe={occupe} erreur={erreur} info={info} connecte={!!typeCompte(gestionnaireId)}
      aConfirmer={aConfirmer} onMiser={v => miser(v)} onConfirmer={() => { if (aConfirmer !== null) miser(aConfirmer, true); }} onAnnulerConf={() => setAConfirmer(null)}
      histoOuvert={histoOuvert} histo={histo} onToggleHisto={() => { const o = !histoOuvert; setHistoOuvert(o); if (o) chargerHisto(); }} />
  );
}