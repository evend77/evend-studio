// src/pages/gestionnaire/ConfigMesPagesCagnotte.tsx
// e-Vend Studio — Gestionnaire : configuration de la campagne de cagnotte (template « Cagnotte Classique »).
// Sauvegarde dans sites.config.cagnotte (même mécanisme que les autres templates). Le prix de publication se règle et se paie dans « Ma Cagnotte ».

import { useState, useEffect, useRef } from 'react';
import TemplateCagnotteClassique, { CONFIG_CAGNOTTE_DEFAUT, MODELES_CAGNOTTE, type ConfigCagnotte, type SousTypeCagnotte } from '../../templates/TemplateCagnotteClassique';
import TemplateCagnotteCause, { CONFIG_CAUSE_DEFAUT, PALETTES_CAUSE, SECTIONS_CAUSE, type ConfigCause } from '../../templates/TemplateCagnotteCause';
import TemplateCagnotteHorizon, { CONFIG_HORIZON_DEFAUT, PALETTES_HORIZON, SECTIONS_HORIZON, type ConfigHorizon } from '../../templates/TemplateCagnotteHorizon';

interface Props {
  gestionnaireId: number;
  naviguer?: (page: string) => void;   // pour le bouton « Aller publier »
  templateId?: string;                 // 'cagnotte-classique' (défaut), 'cagnotte-cause' ou 'cagnotte-horizon'
}

interface EtatCampagne {
  duree_max_jours: number;
  campagne: { statut: string; palier_nom: string | null; fin_le: string | null } | null;
  apercu: { palier: { nom: string; objectif_max: number | null }; prix: number } | null;
  problemes: string[];
}

const POLICES: { v: ConfigCagnotte['police']; label: string }[] = [{ v: 'moderne', label: 'Moderne' }, { v: 'classique', label: 'Classique' }, { v: 'manuscrite', label: 'Manuscrite' }];
const ONGLETS = [{ id: 'campagne', label: '🎯 Campagne' }, { id: 'organisateur', label: '👤 Organisateur' }, { id: 'dons', label: '💝 Dons' }, { id: 'apparence', label: '🎨 Apparence' }, { id: 'nouvelles', label: '📰 Mises à jour' }, { id: 'contact', label: '🔗 Liens' }] as const;
const ONGLETS_CAUSE = [{ id: 'campagne', label: '🎯 Campagne' }, { id: 'thermo', label: '🌡️ Thermomètre' }, { id: 'histoire', label: '📖 Histoire & photos' }, { id: 'impact', label: '💥 Impact & raisons' }, { id: 'chrono', label: '⏱ Chronologie' }, { id: 'galerie', label: '🖼 Galerie & vidéo' }, { id: 'preuves', label: '💬 Témoignages, équipe, FAQ' }, { id: 'organisateur', label: '👤 Organisateur' }, { id: 'dons', label: '💝 Dons' }, { id: 'apparence', label: '🎨 Apparence' }, { id: 'sections', label: '👁 Sections affichées' }, { id: 'nouvelles', label: '📰 Mises à jour' }, { id: 'contact', label: '🔗 Liens' }];
const ONGLETS_HORIZON = [{ id: 'campagne', label: '🎯 Campagne' }, { id: 'thermo', label: '🌡️ Thermomètre' }, { id: 'histoire', label: '📖 Histoire & photos' }, { id: 'impact', label: '💥 Impact & raisons' }, { id: 'chrono', label: '⏱ Chronologie' }, { id: 'fonds', label: '📊 Fonds, points clés, partenaires' }, { id: 'galerie', label: '🖼 Galerie & vidéo' }, { id: 'preuves', label: '💬 Témoignages, équipe, FAQ' }, { id: 'organisateur', label: '👤 Organisateur' }, { id: 'dons', label: '💝 Dons' }, { id: 'apparence', label: '🎨 Apparence' }, { id: 'sections', label: '👁 Sections affichées' }, { id: 'nouvelles', label: '📰 Mises à jour' }, { id: 'contact', label: '🔗 Liens' }];
type Onglet = string;

const jourISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const argent = (n: number) => `${n.toLocaleString('fr-CA')} $`;

function entetes(): HeadersInit {
  const token = localStorage.getItem('token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export default function ConfigMesPagesCagnotte({ gestionnaireId, naviguer, templateId }: Props) {
  const estHorizon = templateId === 'cagnotte-horizon';
  const estCause = templateId === 'cagnotte-cause' || estHorizon;   // « Cause » et « Horizon » partagent les réglages avancés
  const ONGLETS_ACTIFS = estHorizon ? ONGLETS_HORIZON : estCause ? ONGLETS_CAUSE : ONGLETS;
  const [cfg, setCfg] = useState<ConfigHorizon>((estHorizon ? CONFIG_HORIZON_DEFAUT : estCause ? CONFIG_CAUSE_DEFAUT : CONFIG_CAGNOTTE_DEFAUT) as ConfigHorizon);
  const [onglet, setOnglet] = useState<Onglet>('campagne');
  const [etat, setEtat] = useState<EtatCampagne | null>(null);
  const [sauv, setSauv] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');
  const [modifie, setModifie] = useState(false);
  const [modeleEnAttente, setModeleEnAttente] = useState<SousTypeCagnotte | null>(null);
  const [largeur, setLargeur] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [apercuOuvert, setApercuOuvert] = useState(false);
  const charge = useRef(false);

  useEffect(() => {
    const f = () => setLargeur(window.innerWidth);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);

  const chargerEtat = () => {
    fetch('/api/cagnotte/campagne/etat', { headers: entetes(), credentials: 'include' })
      .then(r => (r.ok ? r.json() : null)).then(d => { if (d) setEtat(d); }).catch(() => {});
  };

  useEffect(() => {
    fetch(`/api/studio/sites/${gestionnaireId}`, { headers: entetes(), credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const brut = data && data.config && typeof data.config === 'object' ? data.config.cagnotte : null;
        if (brut && typeof brut === 'object') setCfg(prev => ({ ...prev, ...(estCause && (brut.kicker === undefined || (estHorizon ? brut.themeId !== 'horizon' : (!!brut.themeId && brut.themeId !== 'cause'))) ? { ...brut, couleurPrincipale: prev.couleurPrincipale, couleurSecondaire: prev.couleurSecondaire, couleurFond: prev.couleurFond, couleurTexte: prev.couleurTexte, couleurAccent2: prev.couleurAccent2, couleurAccent3: prev.couleurAccent3, police: prev.police } : brut), montantsSuggeres: Array.isArray(brut.montantsSuggeres) && brut.montantsSuggeres.length ? brut.montantsSuggeres : prev.montantsSuggeres, misesAJour: Array.isArray(brut.misesAJour) ? brut.misesAJour : prev.misesAJour }));
      })
      .catch(() => {})
      .finally(() => { charge.current = true; });
    chargerEtat();
  }, [gestionnaireId]);

  const maj = (p: Partial<ConfigHorizon>) => { setCfg(c => ({ ...c, ...p })); setModifie(true); };
  const dureeMax = etat ? etat.duree_max_jours : 90;
  const maxDate = jourISO(new Date(Date.now() + dureeMax * 86400000));
  const minDate = jourISO(new Date(Date.now() + 2 * 86400000));
  const dateFinJour = cfg.dateFinCampagne ? jourISO(new Date(cfg.dateFinCampagne)) : '';
  const objectif = Number(cfg.objectifMontant) || 0;
  const palierAtteint = etat && etat.apercu && objectif > 0;
  const dejaOuverte = !!(etat && etat.campagne && etat.campagne.statut === 'publiee');

  function appliquerModele(t: SousTypeCagnotte) {
    const m = MODELES_CAGNOTTE[t];
    maj({ sousType: t, slogan: m.slogan, nomCampagne: m.nomCampagne, descriptionCampagne: m.description, messageRemerciement: m.remerciement });
    setModeleEnAttente(null);
  }

  async function enregistrer() {
    setMsg('');
    if (!cfg.nomCampagne.trim()) { setMsg('Donnez un titre à votre campagne.'); setOnglet('campagne'); setSauv('err'); return; }
    if (!(objectif > 0) || objectif > 1000000) { setMsg("L'objectif doit être un montant entre 1 $ et 1 000 000 $."); setOnglet('campagne'); setSauv('err'); return; }
    if (cfg.dateFinCampagne && dateFinJour > maxDate) { setMsg(`La date de fin ne peut pas dépasser ${dureeMax} jours.`); setOnglet('campagne'); setSauv('err'); return; }
    if (cfg.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfg.email)) { setMsg('Adresse courriel invalide (onglet Liens).'); setOnglet('contact'); setSauv('err'); return; }
    const montants = cfg.montantsSuggeres.map(Number).filter(n => Number.isFinite(n) && n > 0).slice(0, 4);
    if (!montants.length) { setMsg('Ajoutez au moins un montant suggéré.'); setOnglet('dons'); setSauv('err'); return; }
    setSauv('loading');
    try {
      const donnees: ConfigHorizon = { ...cfg, ...(estCause ? { themeId: (estHorizon ? 'horizon' : 'cause') as 'horizon' | 'cause' } : {}), objectifMontant: objectif, montantsSuggeres: Array.from(new Set<number>(montants)).sort((a: number, b: number) => a - b) };
      const res = await fetch(`/api/studio/sites/${gestionnaireId}/config`, { method: 'PUT', headers: entetes(), credentials: 'include', body: JSON.stringify({ config: { cagnotte: donnees }, template_id: estHorizon ? 'cagnotte-horizon' : estCause ? 'cagnotte-cause' : 'cagnotte-classique' }) });
      if (!res.ok) throw new Error();
      setCfg(donnees); setModifie(false); setSauv('ok'); chargerEtat();
      setTimeout(() => setSauv('idle'), 2500);
    } catch { setMsg("Enregistrement impossible. Réessayez."); setSauv('err'); setTimeout(() => setSauv('idle'), 3500); }
  }

  const apercuDesktop = largeur >= 1180;

  return (
    <div style={{ background: '#f7f7f5', minHeight: '100vh', padding: largeur < 700 ? '16px 12px 90px' : '28px 28px 90px', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', maxWidth: 1500 }}>
        <div style={{ flex: 1, minWidth: 0, maxWidth: 820 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#c9a96e22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>💝</div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Ma campagne</h1>
              <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Texte, objectif, photos et couleurs de votre page de dons.</p>
            </div>
            <a href="https://e-vendstudio.ca/documents/template-ma-cagnotte" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: '#1a1a1a', color: '#fff', fontSize: 13.5, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              📖 Guide de la cagnotte ↗
            </a>
          </div>

          {/* Prix de publication */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              {dejaOuverte
                ? <p style={{ margin: 0, fontSize: 13.5, color: '#166534' }}>✅ Votre campagne est <b>ouverte aux dons</b>{etat && etat.campagne && etat.campagne.fin_le ? ` jusqu'au ${new Date(etat.campagne.fin_le).toLocaleDateString('fr-CA')}` : ''}.</p>
                : palierAtteint
                  ? <p style={{ margin: 0, fontSize: 13.5, color: '#444' }}>Pour un objectif de <b>{argent(objectif)}</b> : palier « <b>{etat!.apercu!.palier.nom}</b> », prix fixe de publication <b>{argent(etat!.apercu!.prix)}</b> + taxes. Aucune commission sur les dons, durée maximale {dureeMax} jours.</p>
                  : <p style={{ margin: 0, fontSize: 13.5, color: '#444' }}>Indiquez votre objectif pour voir le prix fixe de publication (aucune commission sur les dons).</p>}
            </div>
            {naviguer && !dejaOuverte && <button onClick={() => naviguer('commandes-cagnotte')} style={btnSec}>Aller publier →</button>}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {ONGLETS_ACTIFS.map(o => <button key={o.id} onClick={() => setOnglet(o.id)} style={{ ...btnOnglet, ...(onglet === o.id ? btnOngletActif : {}) }}>{o.label}</button>)}
          </div>

          <div style={carte}>
            {onglet === 'campagne' && (
              <>
                <Champ label="Modèle de départ (facultatif)" aide="Un clic remplit le titre, le slogan et le texte avec un exemple que vous pouvez modifier à votre guise.">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(Object.keys(MODELES_CAGNOTTE) as SousTypeCagnotte[]).map(t => (
                      <button key={t} onClick={() => setModeleEnAttente(t)} style={{ ...btnOnglet, ...(cfg.sousType === t ? { borderColor: '#c9a96e', background: '#c9a96e18' } : {}) }}>{MODELES_CAGNOTTE[t].emoji} {MODELES_CAGNOTTE[t].label}</button>
                    ))}
                  </div>
                  {modeleEnAttente && (
                    <div style={{ marginTop: 10, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
                      Remplacer votre titre, slogan, description et message de remerciement par le modèle « {(MODELES_CAGNOTTE as any)[modeleEnAttente].label} » ?
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button onClick={() => appliquerModele(modeleEnAttente)} style={btnPrim}>Oui, remplacer</button>
                        <button onClick={() => setModeleEnAttente(null)} style={btnSec}>Annuler</button>
                      </div>
                    </div>
                  )}
                </Champ>
                <Champ label="Titre de la campagne"><Texte v={cfg.nomCampagne} on={v => maj({ nomCampagne: v })} max={120} /></Champ>
                <Champ label="Slogan" aide="Une phrase sous le titre."><Texte v={cfg.slogan} on={v => maj({ slogan: v })} max={160} /></Champ>
                <Champ label="Histoire de la campagne" aide="Expliquez le besoin et à quoi serviront les dons. Les sauts de ligne sont conservés."><Zone v={cfg.descriptionCampagne} on={v => maj({ descriptionCampagne: v })} max={6000} rows={9} /></Champ>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <Champ label="Objectif ($)" aide="Détermine votre palier de prix." flex>
                    <input style={champ} inputMode="numeric" value={objectif ? String(objectif) : ''} onChange={e => maj({ objectifMontant: Number(e.target.value.replace(/\D/g, '')) })} /></Champ>
                  <Champ label={`Date de fin (max. ${dureeMax} jours)`} aide="Vide = ouverte pendant la durée maximale." flex>
                    <input style={champ} type="date" min={minDate} max={maxDate} value={dateFinJour} onChange={e => maj({ dateFinCampagne: e.target.value ? new Date(`${e.target.value}T23:59:59`).toISOString() : '' })} /></Champ>
                </div>
                {cfg.dateFinCampagne && dateFinJour > maxDate && <p style={alerte}>⚠️ Cette date dépasse {dureeMax} jours : choisissez une date plus rapprochée.</p>}
                <Champ label="Photo de la campagne (adresse https://…)"><Texte v={cfg.photoCampagne} on={v => maj({ photoCampagne: v })} max={1000} placeholder="https://…" /></Champ>
                <Champ label="Grande photo du haut de page (adresse https://…)"><Texte v={cfg.photoHeroUrl} on={v => maj({ photoHeroUrl: v })} max={1000} placeholder="https://…" /></Champ>
              </>
            )}
            {estCause && onglet === 'thermo' && (
              <>
                <p style={aide}>Le grand thermomètre du haut de page monte à mesure que les dons arrivent. Les paliers s'affichent à côté et se cochent quand ils sont atteints.</p>
                <Champ label="Texte au-dessus du titre"><Texte v={cfg.kicker} on={v => maj({ kicker: v })} max={60} /></Champ>
                <Champ label="Texte du bouton de don"><Texte v={cfg.texteBoutonDon} on={v => maj({ texteBoutonDon: v })} max={30} /></Champ>
                {estHorizon && <Champ label="Barre du haut — texte de gauche"><Texte v={cfg.barreGauche} on={v => maj({ barreGauche: v })} max={100} /></Champ>}
                {estHorizon && <Champ label="Barre du haut — texte de droite (ou courriel)"><Texte v={cfg.barreDroite} on={v => maj({ barreDroite: v })} max={100} /></Champ>}
                <Champ label="Paliers du thermomètre (jusqu'à 5)" aide="Chaque palier est un montant atteint sur le chemin de l'objectif (ex. 12 500 $ = « Terrain préparé »).">
                  <ListeEditable items={cfg.jalonsThermo} on={v => maj({ jalonsThermo: v })} max={5} vide={{ montant: 0, libelle: '' }} titre={(x: any) => x.libelle || 'Palier'}
                    champs={[{ k: 'montant', label: 'Montant ($)', type: 'nombre' }, { k: 'libelle', label: 'Libellé', max: 40 }]} />
                </Champ>
                <Champ label="Chiffres du bandeau (jusqu'à 2)" aide="Le bandeau affiche déjà le % atteint et les jours restants. Ajoutez vos propres chiffres : « 10 ans — d'expérience ».">
                  <ListeEditable items={cfg.chiffres} on={v => maj({ chiffres: v })} max={2} vide={{ valeur: '', libelle: '' }} titre={(x: any) => x.valeur || 'Chiffre'}
                    champs={[{ k: 'valeur', label: 'Valeur', max: 14 }, { k: 'libelle', label: 'Libellé', max: 40 }]} />
                </Champ>
                <Champ label="Compte à rebours — titre"><Texte v={cfg.titreCompteRebours} on={v => maj({ titreCompteRebours: v })} max={60} /></Champ>
                <Champ label="Compte à rebours — texte" aide="S'affiche seulement quand la campagne est ouverte et a une date de fin."><Zone v={cfg.texteCompteRebours} on={v => maj({ texteCompteRebours: v })} max={300} rows={2} /></Champ>
              </>
            )}
            {estCause && onglet === 'histoire' && (
              <>
                <p style={aide}>Le texte principal et la photo de campagne se règlent dans l'onglet « Campagne ». Ici, ajoutez des sections avec photo à côté du texte, en alternance gauche/droite.</p>
                <Champ label="Titre de la section"><Texte v={cfg.titreHistoire} on={v => maj({ titreHistoire: v })} max={80} /></Champ>
                <Champ label="Sections avec photo (jusqu'à 8)">
                  <ListeEditable items={cfg.blocsHistoire} on={v => maj({ blocsHistoire: v })} max={8} vide={{ titre: '', texte: '', photoUrl: '', position: 'droite' }} titre={(x: any) => x.titre || 'Section'}
                    champs={[{ k: 'titre', label: 'Titre', max: 100 }, { k: 'texte', label: 'Texte', type: 'zone', max: 2000 }, { k: 'photoUrl', label: 'Photo (adresse https://…)', max: 1000, ph: 'https://…' }, { k: 'position', label: 'Photo à', type: 'choix', choix: [{ v: 'droite', label: 'Droite' }, { v: 'gauche', label: 'Gauche' }] }]} />
                </Champ>
              </>
            )}
            {estCause && onglet === 'impact' && (
              <>
                <Champ label="Titre « Pourquoi »"><Texte v={cfg.titreRaisons} on={v => maj({ titreRaisons: v })} max={80} /></Champ>
                <Champ label="Raisons / points forts (jusqu'à 9)" aide="Affichées en cartes numérotées (01, 02, 03…).">
                  <ListeEditable items={cfg.raisons} on={v => maj({ raisons: v })} max={9} vide={{ titre: '', texte: '' }} titre={(x: any) => x.titre || 'Raison'}
                    champs={[{ k: 'titre', label: 'Titre', max: 80 }, { k: 'texte', label: 'Texte', type: 'zone', max: 400 }]} />
                </Champ>
                <Champ label="Titre « Votre don en action »"><Texte v={cfg.titreImpacts} on={v => maj({ titreImpacts: v })} max={80} /></Champ>
                <Champ label="Ce que permet chaque montant (jusqu'à 8)" aide="Cliquer sur une carte ouvre la fenêtre de don avec ce montant déjà choisi.">
                  <ListeEditable items={cfg.impacts} on={v => maj({ impacts: v })} max={8} vide={{ montant: 0, texte: '' }} titre={(x: any) => (x.montant ? `${x.montant} $` : 'Montant')}
                    champs={[{ k: 'montant', label: 'Montant ($)', type: 'nombre' }, { k: 'texte', label: 'Ce que ça permet', type: 'zone', max: 200 }]} />
                </Champ>
              </>
            )}
            {estCause && onglet === 'chrono' && (
              <>
                <Champ label="Titre de la section"><Texte v={cfg.titreChronologie} on={v => maj({ titreChronologie: v })} max={80} /></Champ>
                <Champ label="Étapes (jusqu'à 12)" aide="Dans l'ordre d'affichage. Le « repère » est libre : une date, une saison, « Phase 1 »…">
                  <ListeEditable items={cfg.chronologie} on={v => maj({ chronologie: v })} max={12} vide={{ date: '', titre: '', texte: '', photoUrl: '' }} titre={(x: any) => x.titre || 'Étape'}
                    champs={[{ k: 'date', label: 'Repère (date, saison…)', max: 40 }, { k: 'titre', label: 'Titre', max: 100 }, { k: 'texte', label: 'Description', type: 'zone', max: 500 }, { k: 'photoUrl', label: 'Photo (facultatif)', max: 1000, ph: 'https://…' }]} />
                </Champ>
              </>
            )}
            {estHorizon && onglet === 'fonds' && (
              <>
                <Champ label="Titre « Points clés »" aide="Liste à flèches affichée sous la présentation (ex. « Plus de 8 000 livres »)."><Texte v={cfg.titrePointsCles} on={v => maj({ titrePointsCles: v })} max={80} /></Champ>
                <Champ label="Points clés (jusqu'à 12)">
                  <ListeEditable items={cfg.pointsCles} on={v => maj({ pointsCles: v })} max={12} vide={{ texte: '' }} titre={(x: any) => x.texte || 'Point clé'} champs={[{ k: 'texte', label: 'Texte', max: 60 }]} />
                </Champ>
                <Champ label="Titre « Utilisation des fonds »"><Texte v={cfg.titreRepartition} on={v => maj({ titreRepartition: v })} max={80} /></Champ>
                <Champ label="Texte d'introduction"><Zone v={cfg.texteRepartition} on={v => maj({ texteRepartition: v })} max={500} rows={3} /></Champ>
                <Champ label="Répartition des fonds (jusqu'à 8)" aide="Chaque ligne est une part en %. Le camembert et le tableau (avec les montants calculés sur votre objectif) se mettent à jour tout seuls.">
                  <ListeEditable items={cfg.repartition} on={v => maj({ repartition: v })} max={8} vide={{ libelle: '', pct: 0 }} titre={(x: any) => x.libelle || 'Poste'}
                    champs={[{ k: 'libelle', label: 'Poste de dépense', max: 60 }, { k: 'pct', label: 'Part (%)', type: 'nombre' }]} />
                </Champ>
                <Champ label="Titre « Partenaires »"><Texte v={cfg.titrePartenaires} on={v => maj({ titrePartenaires: v })} max={80} /></Champ>
                <Champ label="Partenaires (jusqu'à 10)" aide="Un logo (adresse https://…) ou simplement le nom. Le lien est facultatif.">
                  <ListeEditable items={cfg.partenaires} on={v => maj({ partenaires: v })} max={10} vide={{ nom: '', logoUrl: '', lien: '' }} titre={(x: any) => x.nom || 'Partenaire'}
                    champs={[{ k: 'nom', label: 'Nom', max: 60 }, { k: 'logoUrl', label: 'Logo (adresse https://…)', max: 1000, ph: 'https://…' }, { k: 'lien', label: 'Lien (https://…)', max: 500, ph: 'https://…' }]} />
                </Champ>
              </>
            )}
            {estCause && onglet === 'galerie' && (
              <>
                <Champ label="Titre de la galerie"><Texte v={cfg.titreGalerie} on={v => maj({ titreGalerie: v })} max={80} /></Champ>
                <Champ label="Photos (jusqu'à 18)" aide="Un clic sur une photo l'agrandit. La première photo est affichée en grand.">
                  <ListeEditable items={cfg.galerie} on={v => maj({ galerie: v })} max={18} vide={{ url: '', legende: '' }} titre={(x: any) => x.legende || 'Photo'}
                    champs={[{ k: 'url', label: 'Photo (adresse https://…)', max: 1000, ph: 'https://…' }, { k: 'legende', label: 'Légende', max: 100 }]} />
                </Champ>
                <Champ label="Vidéo YouTube (adresse https://…, facultatif)" aide="Collez le lien de votre vidéo YouTube (youtube.com ou youtu.be)."><Texte v={cfg.videoUrl} on={v => maj({ videoUrl: v })} max={300} placeholder="https://www.youtube.com/watch?v=…" /></Champ>
                <Champ label="Titre de la vidéo"><Texte v={cfg.titreVideo} on={v => maj({ titreVideo: v })} max={80} /></Champ>
              </>
            )}
            {estCause && onglet === 'preuves' && (
              <>
                <Champ label="Titre « Témoignages »"><Texte v={cfg.titreTemoignages} on={v => maj({ titreTemoignages: v })} max={80} /></Champ>
                <Champ label="Témoignages (jusqu'à 12)">
                  <ListeEditable items={cfg.temoignages} on={v => maj({ temoignages: v })} max={12} vide={{ nom: '', role: '', texte: '', date: '' }} titre={(x: any) => x.nom || 'Témoignage'}
                    champs={[{ k: 'nom', label: 'Nom', max: 60 }, { k: 'role', label: 'Rôle (ex. Bénévole)', max: 60 }, ...(estHorizon ? [{ k: 'photoUrl', label: 'Photo (facultatif)', max: 1000, ph: 'https://…' }] : []), { k: 'texte', label: 'Témoignage', type: 'zone', max: 600 }]} />
                </Champ>
                <Champ label="Titre « Équipe »"><Texte v={cfg.titreEquipe} on={v => maj({ titreEquipe: v })} max={80} /></Champ>
                <Champ label="Membres de l'équipe (jusqu'à 12)">
                  <ListeEditable items={cfg.equipe} on={v => maj({ equipe: v })} max={12} vide={{ nom: '', role: '', photoUrl: '' }} titre={(x: any) => x.nom || 'Membre'}
                    champs={[{ k: 'nom', label: 'Nom', max: 60 }, { k: 'role', label: 'Rôle', max: 80 }, { k: 'photoUrl', label: 'Photo (facultatif)', max: 1000, ph: 'https://…' }]} />
                </Champ>
                <Champ label="Titre « Questions fréquentes »"><Texte v={cfg.titreFaq} on={v => maj({ titreFaq: v })} max={80} /></Champ>
                <Champ label="Questions fréquentes (jusqu'à 15)">
                  <ListeEditable items={cfg.faq} on={v => maj({ faq: v })} max={15} vide={{ q: '', r: '' }} titre={(x: any) => x.q || 'Question'}
                    champs={[{ k: 'q', label: 'Question', max: 160 }, { k: 'r', label: 'Réponse', type: 'zone', max: 800 }]} />
                </Champ>
                <Champ label="Appel final — titre"><Texte v={cfg.titreFinal} on={v => maj({ titreFinal: v })} max={80} /></Champ>
                <Champ label="Appel final — texte"><Zone v={cfg.texteFinal} on={v => maj({ texteFinal: v })} max={300} rows={2} /></Champ>
              </>
            )}
            {estCause && onglet === 'sections' && (
              <>
                <p style={aide}>Décochez une section pour la cacher de votre page. Une section sans contenu est de toute façon masquée automatiquement.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginBottom: 14 }}>
                  {(estHorizon ? SECTIONS_HORIZON : SECTIONS_CAUSE).map(sc => (
                    <label key={sc.id} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: '#333', cursor: 'pointer', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10 }}>
                      <input type="checkbox" checked={!(cfg.sectionsVisibles && cfg.sectionsVisibles[sc.id] === false)} onChange={e => maj({ sectionsVisibles: { ...(cfg.sectionsVisibles || {}), [sc.id]: e.target.checked } })} /> {sc.label}
                    </label>
                  ))}
                </div>
              </>
            )}
            {onglet === 'organisateur' && (
              <>
                <Champ label="Nom affiché dans le menu du haut"><Texte v={cfg.nomEntreprise} on={v => maj({ nomEntreprise: v })} max={80} /></Champ>
                <Champ label="Logo (adresse https://…, facultatif)"><Texte v={cfg.logoUrl} on={v => maj({ logoUrl: v })} max={1000} placeholder="https://…" /></Champ>
                <Champ label="Organisé par"><Texte v={cfg.nomOrganisateur} on={v => maj({ nomOrganisateur: v })} max={100} /></Champ>
                <Champ label="Présentation de l'organisateur"><Zone v={cfg.bioOrganisateur} on={v => maj({ bioOrganisateur: v })} max={500} rows={3} /></Champ>
                <Champ label="Photo de l'organisateur (adresse https://…, facultatif)"><Texte v={cfg.photoOrganisateur} on={v => maj({ photoOrganisateur: v })} max={1000} placeholder="https://…" /></Champ>
                <p style={{ ...aide, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>ℹ️ Vous êtes responsable de votre collecte et de l'utilisation des fonds. Un avis à ce sujet est affiché automatiquement sur votre page. Selon votre province et le type de collecte, des règles peuvent s'appliquer : renseignez-vous auprès des autorités compétentes.</p>
              </>
            )}
            {onglet === 'dons' && (
              <>
                <Champ label="Montants suggérés ($, jusqu'à 4)">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[0, 1, 2, 3].map(i => (
                      <input key={i} style={{ ...champ, width: 90 }} inputMode="numeric" placeholder="—" value={cfg.montantsSuggeres[i] ? String(cfg.montantsSuggeres[i]) : ''}
                        onChange={e => { const a = [...cfg.montantsSuggeres]; a[i] = Number(e.target.value.replace(/\D/g, '')); maj({ montantsSuggeres: a }); }} />
                    ))}
                  </div>
                </Champ>
                <Champ label="Don minimum ($)" aide="Le minimum de la plateforme s'applique aussi."><input style={{ ...champ, width: 120 }} inputMode="numeric" value={cfg.montantMinimum ? String(cfg.montantMinimum) : ''} onChange={e => maj({ montantMinimum: Number(e.target.value.replace(/\D/g, '')) })} /></Champ>
                <Champ label="Message de remerciement" aide="Affiché au donateur juste après son paiement."><Zone v={cfg.messageRemerciement} on={v => maj({ messageRemerciement: v })} max={500} rows={3} /></Champ>
                <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: '#333', cursor: 'pointer' }}>
                  <input type="checkbox" checked={cfg.afficherDonateurs !== false} onChange={e => maj({ afficherDonateurs: e.target.checked })} /> Afficher la liste des derniers donateurs (les dons anonymes restent anonymes)
                </label>
                <p style={{ ...aide, marginTop: 14 }}>💳 Pour recevoir les dons, branchez votre Stripe et/ou PayPal dans « Ma Cagnotte » → Paiements.</p>
              </>
            )}
            {onglet === 'apparence' && estCause && (
              <>
                <Champ label="Palettes toutes prêtes" aide="Un clic applique les couleurs. Vous pouvez ensuite les ajuster une par une.">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(estHorizon ? PALETTES_HORIZON : PALETTES_CAUSE).map((pl: any) => (
                      <button key={pl.id} onClick={() => maj({ couleurPrincipale: pl.principale, couleurFond: pl.fond, couleurSecondaire: pl.cartes, couleurTexte: pl.texte, ...(pl.a2 ? { couleurAccent2: pl.a2, couleurAccent3: pl.a3 } : {}) })}
                        style={{ ...btnOnglet, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ display: 'inline-flex', width: 34, height: 18, borderRadius: 9, overflow: 'hidden', border: '1px solid #d1d5db' }}>
                          <span style={{ flex: 1, background: pl.fond }} /><span style={{ flex: 1, background: pl.cartes }} /><span style={{ flex: 1, background: pl.principale }} />
                        </span>{pl.label}
                      </button>
                    ))}
                  </div>
                </Champ>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
                  <Couleur label="Couleur d'accent" v={cfg.couleurPrincipale} on={v => maj({ couleurPrincipale: v })} />
                  <Couleur label="Fond de page" v={cfg.couleurFond} on={v => maj({ couleurFond: v })} />
                  <Couleur label="Fond des cartes" v={cfg.couleurSecondaire} on={v => maj({ couleurSecondaire: v })} />
                  <Couleur label="Texte" v={cfg.couleurTexte} on={v => maj({ couleurTexte: v })} />
                  {estHorizon && <Couleur label="Accent 2 (violet)" v={cfg.couleurAccent2} on={v => maj({ couleurAccent2: v })} />}
                  {estHorizon && <Couleur label="Accent 3 (bandeaux)" v={cfg.couleurAccent3} on={v => maj({ couleurAccent3: v })} />}
                </div>
                <Champ label="Police des titres">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[{ v: 'moderne', label: estHorizon ? 'Moderne (Ubuntu)' : 'Arrondie moderne' }, { v: 'classique', label: 'Élégante (serif)' }].map(pl => <button key={pl.v} onClick={() => maj({ police: pl.v as ConfigCagnotte['police'] })} style={{ ...btnOnglet, ...(cfg.police === pl.v || (pl.v === 'moderne' && cfg.police === 'manuscrite') ? { borderColor: '#c9a96e', background: '#c9a96e18' } : {}) }}>{pl.label}</button>)}
                  </div>
                </Champ>
              </>
            )}
            {onglet === 'apparence' && !estCause && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
                  <Couleur label="Couleur principale" v={cfg.couleurPrincipale} on={v => maj({ couleurPrincipale: v })} />
                  <Couleur label="Couleur du titre / pied de page" v={cfg.couleurSecondaire} on={v => maj({ couleurSecondaire: v })} />
                  <Couleur label="Fond de page" v={cfg.couleurFond} on={v => maj({ couleurFond: v })} />
                  <Couleur label="Texte" v={cfg.couleurTexte} on={v => maj({ couleurTexte: v })} />
                </div>
                <Champ label="Police">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {POLICES.map(p => <button key={p.v} onClick={() => maj({ police: p.v })} style={{ ...btnOnglet, ...(cfg.police === p.v ? { borderColor: '#c9a96e', background: '#c9a96e18' } : {}) }}>{p.label}</button>)}
                  </div>
                </Champ>
              </>
            )}
            {onglet === 'nouvelles' && (
              <>
                <p style={aide}>Donnez des nouvelles à vos donateurs : elles s'affichent sous l'histoire de la campagne.</p>
                {cfg.misesAJour.map((m, i) => (
                  <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input style={{ ...champ, flex: 1 }} placeholder="Titre" maxLength={100} value={m.titre} onChange={e => maj({ misesAJour: cfg.misesAJour.map((x, j) => (j === i ? { ...x, titre: e.target.value } : x)) })} />
                      <button onClick={() => maj({ misesAJour: cfg.misesAJour.filter((_, j) => j !== i) })} style={btnX} aria-label="Supprimer">✕</button>
                    </div>
                    <Zone v={m.texte} on={v => maj({ misesAJour: cfg.misesAJour.map((x, j) => (j === i ? { ...x, texte: v } : x)) })} max={1000} rows={3} />
                  </div>
                ))}
                <button disabled={cfg.misesAJour.length >= 20} onClick={() => maj({ misesAJour: [{ date: new Date().toISOString(), titre: '', texte: '' }, ...cfg.misesAJour] })} style={btnSec}>+ Ajouter une nouvelle</button>
              </>
            )}
            {onglet === 'contact' && (
              <>
                <Champ label="Courriel de contact (facultatif)"><Texte v={cfg.email} on={v => maj({ email: v })} max={120} placeholder="nom@exemple.com" /></Champ>
                <Champ label="Facebook (nom de la page ou adresse https://…)"><Texte v={cfg.facebook} on={v => maj({ facebook: v })} max={200} /></Champ>
                <Champ label="Instagram (nom d'utilisateur ou adresse https://…)"><Texte v={cfg.instagram} on={v => maj({ instagram: v })} max={200} /></Champ>
                <Champ label="Site web (adresse https://…)"><Texte v={cfg.siteExterne} on={v => maj({ siteExterne: v })} max={300} placeholder="https://…" /></Champ>
              </>
            )}
          </div>

          {apercuDesktop === false && (
            <div style={{ marginTop: 14 }}>
              <button onClick={() => setApercuOuvert(o => !o)} style={btnSec}>{apercuOuvert ? 'Masquer l\'aperçu' : '👁 Voir l\'aperçu'}</button>
              {apercuOuvert && <Apercu cfg={cfg} cause={estCause} horizon={estHorizon} largeurBoite={Math.min(largeur - 24, 420)} />}
            </div>
          )}
        </div>

        {apercuDesktop && (
          <div style={{ position: 'sticky', top: 16, width: 380, flexShrink: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Aperçu (chiffres de démonstration)</p>
            <Apercu cfg={cfg} cause={estCause} horizon={estHorizon} largeurBoite={380} />
          </div>
        )}
      </div>

      {/* Barre d'enregistrement */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: '#ffffffee', backdropFilter: 'blur(8px)', borderTop: '1px solid #e5e7eb', padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end', zIndex: 50 }}>
        {msg && <span style={{ fontSize: 13, color: '#b91c1c', marginRight: 'auto' }}>⚠️ {msg}</span>}
        {sauv === 'ok' && <span style={{ fontSize: 13, color: '#166534', marginRight: 'auto' }}>✓ Enregistré</span>}
        {modifie && sauv === 'idle' && !msg && <span style={{ fontSize: 12, color: '#888', marginRight: 'auto' }}>Modifications non enregistrées</span>}
        <button onClick={enregistrer} disabled={sauv === 'loading'} style={{ ...btnPrim, padding: '11px 22px', fontSize: 14 }}>{sauv === 'loading' ? 'Enregistrement…' : '💾 Enregistrer'}</button>
      </div>
    </div>
  );
}

// ─── Aperçu réduit du template (sans siteId : chiffres de démonstration, aucun vrai don possible) ───
function Apercu({ cfg, cause, horizon, largeurBoite }: { cfg: ConfigHorizon; cause: boolean; horizon: boolean; largeurBoite: number }) {
  const echelle = largeurBoite / 420;
  return (
    <div style={{ width: largeurBoite, height: 640 * echelle * 1.0, overflow: 'hidden', border: '1px solid #e5e7eb', borderRadius: 14, background: '#fff', marginTop: 8, position: 'relative' }}>
      <div style={{ width: 420, height: 640 / echelle * 1, transform: `scale(${echelle})`, transformOrigin: 'top left', overflowY: 'auto', overflowX: 'hidden' }}>
        {horizon ? <TemplateCagnotteHorizon config={cfg} isPreviewMobile /> : cause ? <TemplateCagnotteCause config={cfg} isPreviewMobile /> : <TemplateCagnotteClassique config={cfg} isPreviewMobile />}
      </div>
    </div>
  );
}

// ─── Éditeur de liste (sections, étapes, photos, témoignages…) ───
interface ChampSpec { k: string; label: string; type?: 'texte' | 'zone' | 'nombre' | 'choix'; max?: number; ph?: string; choix?: { v: string; label: string }[] }
function ListeEditable({ items, on, champs, vide, max, titre }: { items: any; on: (v: any[]) => void; champs: ChampSpec[]; vide: Record<string, any>; max: number; titre: (x: any) => string }) {
  const liste: any[] = Array.isArray(items) ? items.filter(x => x && typeof x === 'object') : [];
  const set = (i: number, k: string, v: any) => on(liste.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const deplacer = (i: number, d: number) => { const n = i + d; if (n < 0 || n >= liste.length) return; const a = [...liste]; const t = a[i]; a[i] = a[n]; a[n] = t; on(a); };
  return (
    <div>
      {liste.map((it, i) => (
        <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, marginBottom: 10, background: '#fafafa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i + 1}. {titre(it)}</span>
            <button type="button" onClick={() => deplacer(i, -1)} disabled={i === 0} style={{ ...btnSec, padding: '4px 10px' }} aria-label="Monter">↑</button>
            <button type="button" onClick={() => deplacer(i, 1)} disabled={i === liste.length - 1} style={{ ...btnSec, padding: '4px 10px' }} aria-label="Descendre">↓</button>
            <button type="button" onClick={() => on(liste.filter((_, j) => j !== i))} style={{ ...btnX, width: 34, height: 28 }} aria-label="Supprimer">✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
            {champs.map(c => (
              <div key={c.k} style={c.type === 'zone' ? { gridColumn: '1 / -1' } : undefined}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#666', marginBottom: 4 }}>{c.label}</label>
                {c.type === 'zone'
                  ? <textarea style={{ ...champ, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} rows={3} maxLength={c.max} value={it[c.k] || ''} onChange={e => set(i, c.k, e.target.value)} />
                  : c.type === 'choix'
                    ? <select style={champ} value={it[c.k] || (c.choix && c.choix[0].v)} onChange={e => set(i, c.k, e.target.value)}>{(c.choix || []).map(o => <option key={o.v} value={o.v}>{o.label}</option>)}</select>
                    : c.type === 'nombre'
                      ? <input style={champ} inputMode="numeric" value={it[c.k] ? String(it[c.k]) : ''} onChange={e => set(i, c.k, Number(e.target.value.replace(/\D/g, '')))} />
                      : <input style={champ} value={it[c.k] || ''} maxLength={c.max} placeholder={c.ph} onChange={e => set(i, c.k, e.target.value)} />}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button type="button" disabled={liste.length >= max} onClick={() => on([...liste, { ...vide }])} style={btnSec}>+ Ajouter{liste.length >= max ? ` (maximum ${max})` : ''}</button>
    </div>
  );
}

// ─── Petits composants de formulaire ───
function Champ({ label, aide: texteAide, children, flex }: { label: string; aide?: string; children: React.ReactNode; flex?: boolean }) {
  return (
    <div style={{ marginBottom: 16, ...(flex ? { flex: 1, minWidth: 180 } : {}) }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</label>
      {children}
      {texteAide && <p style={{ ...aide, marginTop: 5 }}>{texteAide}</p>}
    </div>
  );
}
const Texte = ({ v, on, max, placeholder }: { v: string; on: (v: string) => void; max: number; placeholder?: string }) => <input style={champ} value={v || ''} maxLength={max} placeholder={placeholder} onChange={e => on(e.target.value)} />;
const Zone = ({ v, on, max, rows }: { v: string; on: (v: string) => void; max: number; rows: number }) => <textarea style={{ ...champ, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} rows={rows} value={v || ''} maxLength={max} onChange={e => on(e.target.value)} />;
function Couleur({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(v) ? v : '#000000'} onChange={e => on(e.target.value)} style={{ width: 44, height: 36, border: '1px solid #d1d5db', borderRadius: 8, padding: 2, background: '#fff' }} />
        <input style={{ ...champ, flex: 1 }} value={v} maxLength={7} onChange={e => on(e.target.value)} />
      </div>
    </div>
  );
}

const carte: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 20px 8px' };
const champ: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#1a1a1a' };
const aide: React.CSSProperties = { fontSize: 12, color: '#888', margin: '0 0 10px', lineHeight: 1.5 };
const alerte: React.CSSProperties = { fontSize: 12.5, color: '#b45309', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '8px 10px', margin: '-6px 0 14px' };
const btnPrim: React.CSSProperties = { background: '#c9a96e', border: 'none', color: '#fff', borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
const btnSec: React.CSSProperties = { background: '#fff', border: '1px solid #d1d5db', color: '#374151', borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };
const btnX: React.CSSProperties = { background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 8, width: 38, cursor: 'pointer' };
const btnOnglet: React.CSSProperties = { background: '#fff', border: '1.5px solid #e5e7eb', color: '#374151', borderRadius: 20, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };
const btnOngletActif: React.CSSProperties = { background: '#1a1a1a', borderColor: '#1a1a1a', color: '#fff' };