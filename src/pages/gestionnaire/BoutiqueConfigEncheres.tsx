// CHEMIN : src/pages/gestionnaire/BoutiqueConfigEncheres.tsx
// e-Vend Studio — Add-on « Enchères » (templates boutique solo) : page « Config enchère » du gestionnaire (menu CONFIG MES PAGES, visible seulement si l'add-on est activé).
// Adapté de ConfigurationEnchere.tsx (ancien e-Vend : onglets Configuration générale / Configuration widget), version par boutique. Trois onglets :
//   📏 Règles     — durée min/max, incrément minimal, réserve permise, délai de paiement (auparavant dans la page « Enchères »)
//   🎛️ Widget     — choix du modèle d'affichage parmi 6 (aperçu en direct)
//   👁️ Affichage  — secondes du minuteur, format de date, nombre de mises, meneur, mise en évidence, confirmation avant de miser, mise minimale préremplie, réserve
// API : GET /api/boutique/gestionnaire/encheres/config · PUT …/encheres/reglages · PUT …/encheres/apparence

import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { bq, messageErreur } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';
import VueEnchereBoutique, { MODELES, APPARENCE_DEFAUT, formaterDateEnchere, type ApparenceEnchere, type EnchereVue } from '../boutique/VueEnchereBoutique';

interface Reglages { actif: boolean; duree_min_h: number; duree_max_jours: number; increment_min: number; reserve_permise: boolean; delai_paiement_h: number }
interface Config { addon_actif: boolean; reglages: Reglages; apparence: ApparenceEnchere }
interface Props { gestionnaireId: number; accent?: string; isMobile?: boolean; pagePlan?: string; naviguerVers?: (page: string) => void }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', green: '#10b981' };
type Onglet = 'regles' | 'widget' | 'affichage';
const CODES: [string, string][] = [['%H', 'Heure 24 h (14)'], ['%I', 'Heure 12 h (02)'], ['%l', 'Heure 12 h sans zéro (2)'], ['%M', 'Minutes (05)'], ['%S', 'Secondes (09)'], ['%p', 'AM ou PM'], ['%e', 'Jour (1)'], ['%d', 'Jour avec zéro (01)'], ['%m', 'Mois (numérique, 01)'], ['%b', 'Mois court (nov.)'], ['%B', 'Mois complet (novembre)'], ['%y', 'Année 2 chiffres (26)'], ['%Y', 'Année 4 chiffres (2026)']];

export default function BoutiqueConfigEncheres({ accent, isMobile: mobileProp, pagePlan, naviguerVers }: Props) {
  const couleur = accent || '#4f46e5';
  const isMobile = !!mobileProp;
  const [onglet, setOnglet] = useState<Onglet>('regles');
  const [cfg, setCfg] = useState<Config | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreurModale, setErreurModale] = useState('');
  // Règles
  const [actif, setActif] = useState(true);
  const [reserve, setReserve] = useState(true);
  const [dMin, setDMin] = useState('1');
  const [dMax, setDMax] = useState('14');
  const [incr, setIncr] = useState('1');
  const [delai, setDelai] = useState('24');
  // Apparence
  const [app, setApp] = useState<ApparenceEnchere>(APPARENCE_DEFAUT);
  const [apparenceSauvee, setApparenceSauvee] = useState<ApparenceEnchere>(APPARENCE_DEFAUT);
  // Aperçu
  const [fin] = useState(() => Date.now() + (1 * 86400 + 8 * 3600 + 33 * 60 + 7) * 1000);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const [montantApercu, setMontantApercu] = useState('');
  const [histoApercu, setHistoApercu] = useState(false);

  const charger = useCallback(async () => {
    const r = await bq('/encheres/config');
    if (r.ok) {
      const c: Config = r.data; setCfg(c); setErreur('');
      const g = c.reglages;
      setActif(g.actif); setReserve(g.reserve_permise); setDMin(String(g.duree_min_h)); setDMax(String(g.duree_max_jours)); setIncr(String(g.increment_min)); setDelai(String(g.delai_paiement_h));
      const a = { ...APPARENCE_DEFAUT, ...c.apparence }; setApp(a); setApparenceSauvee(a);
    } else setErreur(messageErreur(r));
    setChargement(false);
  }, []);
  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { const t = setInterval(() => setMaintenant(Date.now()), 1000); return () => clearInterval(t); }, []);

  const flash = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 4000); };
  const addonActif = !!(cfg && cfg.addon_actif);
  const modif = JSON.stringify(app) !== JSON.stringify(apparenceSauvee);
  const maj = <K extends keyof ApparenceEnchere>(k: K, v: ApparenceEnchere[K]) => setApp(a => ({ ...a, [k]: v }));

  const enregistrerRegles = async () => {
    setOccupe(true);
    const r = await bq('/encheres/reglages', { method: 'PUT', body: { actif, duree_min_h: Number(dMin), duree_max_jours: Number(dMax), increment_min: Number(String(incr).replace(',', '.')), reserve_permise: reserve, delai_paiement_h: Number(delai) } });
    setOccupe(false);
    if (!r.ok) { setErreurModale(messageErreur(r)); return; }
    flash('Règles enregistrées.'); charger();
  };
  const enregistrerApparence = async () => {
    setOccupe(true);
    const r = await bq('/encheres/apparence', { method: 'PUT', body: { modele: app.modele, secondes: app.secondes, format_date: app.format_date || '', nb_mises: app.nb_mises, meneur: app.meneur, evidence: app.evidence, confirmer: app.confirmer, libelle_confirmer: app.libelle_confirmer || '', prefill: app.prefill, reserve: app.reserve } });
    setOccupe(false);
    if (!r.ok) { setErreurModale(messageErreur(r)); return; }
    const a = { ...APPARENCE_DEFAUT, ...r.data.apparence }; setApp(a); setApparenceSauvee(a);
    flash('Apparence enregistrée. Elle est visible tout de suite sur vos fiches produit.');
  };

  const carte: CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 };
  const champ: CSSProperties = { padding: '9px 11px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, color: T.text, background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box', width: '100%' };
  const btn = (fond: string, texte: string, bordure?: string): CSSProperties => ({ padding: '9px 16px', borderRadius: 8, border: bordure ? `1px solid ${bordure}` : 'none', background: fond, color: texte, fontWeight: 800, fontSize: 13, cursor: occupe ? 'wait' : 'pointer', fontFamily: 'inherit' });
  const interrupteur = (libelle: string, aide: string, v: boolean, set: (b: boolean) => void) => (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}>
      <input type="checkbox" checked={v} onChange={e => set(e.target.checked)} style={{ marginTop: 3 }} />
      <span><span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{libelle}</span><br /><span style={{ fontSize: 12, color: T.light }}>{aide}</span></span>
    </label>
  );
  const champNombre = (libelle: string, aide: string, valeur: string, set: (v: string) => void, min: number, max: number) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: T.text, fontWeight: 700, minWidth: 170, flex: 1 }}>
      {libelle}
      <input type="number" min={min} max={max} step="any" value={valeur} onChange={e => set(e.target.value)} style={champ} />
      <span style={{ fontWeight: 500, fontSize: 11, color: T.light }}>{aide}</span>
    </label>
  );

  if (chargement && !cfg) return <div style={{ padding: 30, textAlign: 'center', color: T.light }}>Chargement…</div>;

  // Aperçu en direct (données fictives)
  const enchereApercu: EnchereVue = { prix_depart: 50, mise_actuelle: 124, prochaine_mise: 129, increment: 5, nb_mises: 8, date_fin: new Date(fin).toISOString(), reserve: { atteinte: false }, en_tete: false, meneur: 'M***' };
  const apercu = (
    <div style={{ background: '#0a0a0a', borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Aperçu en direct (données fictives)</div>
      <VueEnchereBoutique enchere={enchereApercu} apparence={app} accent={couleur} msRestant={fin - maintenant} apercu
        montant={montantApercu} setMontant={setMontantApercu} occupe={false} erreur="" info="" connecte
        aConfirmer={null} onMiser={() => { /* aperçu : aucune mise réelle */ }} onConfirmer={() => {}} onAnnulerConf={() => {}}
        histoOuvert={histoApercu} histo={histoApercu ? [{ montant: 124, date: new Date(maintenant - 3600000).toISOString(), encherisseur: 'M***' }, { montant: 119, date: new Date(maintenant - 7200000).toISOString(), encherisseur: 'J***' }] : null} onToggleHisto={() => setHistoApercu(o => !o)} />
    </div>
  );
  const barreEnregistrer = (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 14 }}>
      <button disabled={occupe || !addonActif || !modif} onClick={enregistrerApparence} style={{ ...btn(couleur, '#fff'), opacity: occupe || !addonActif || !modif ? 0.55 : 1 }}>{occupe ? '⏳ Enregistrement…' : 'Enregistrer'}</button>
      {modif && <button disabled={occupe} onClick={() => setApp(apparenceSauvee)} style={btn('#fff', T.text, T.border)}>Annuler les changements</button>}
      <span style={{ fontSize: 12, color: modif ? '#b45309' : T.light }}>{modif ? 'Modifications non enregistrées.' : 'Tout est enregistré.'}</span>
    </div>
  );
  const dispose = (gauche: React.ReactNode) => (
    <div style={{ display: 'flex', gap: 18, flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0, width: '100%' }}>{gauche}</div>
      <div style={{ width: isMobile ? '100%' : 380, flexShrink: 0, position: isMobile ? 'static' : 'sticky', top: 12 }}>{apercu}</div>
    </div>
  );

  const onglets: [Onglet, string][] = [['regles', '📏 Règles'], ['widget', '🎛️ Widget'], ['affichage', '👁️ Affichage']];

  return (
    <div style={{ padding: isMobile ? 12 : 20, maxWidth: 1100 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 24, color: T.text }}>⚙️ Config enchère</h2>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: T.light }}>Réglez les règles de vos enchères et l'apparence du widget d'enchère sur vos fiches produit. Rien ne change pour vos acheteurs tant que vous n'enregistrez pas.</p>

      {cfg && !addonActif && (
        <div style={{ ...carte, marginBottom: 14, background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e', fontSize: 13 }}>
          L'add-on « Enchères » n'est pas activé : vous pouvez consulter la configuration, mais pas l'enregistrer.
          {pagePlan && naviguerVers && <> <button onClick={() => naviguerVers(pagePlan)} style={{ ...btn('#fff', '#92400e', '#fcd34d'), marginLeft: 8 }}>Voir « Mon plan & limites »</button></>}
        </div>
      )}
      {erreur && <div style={{ ...carte, marginBottom: 14, background: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c', fontSize: 13 }}>{erreur}</div>}
      {message && <div role="status" style={{ ...carte, marginBottom: 14, background: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857', fontSize: 13, fontWeight: 700 }}>{message}</div>}

      <div style={{ display: 'flex', gap: 4, borderBottom: `2px solid ${T.border}`, marginBottom: 16, overflowX: 'auto' }}>
        {onglets.map(([id, l]) => (
          <button key={id} onClick={() => setOnglet(id)} style={{ padding: '11px 18px', border: 'none', background: 'transparent', fontSize: 14, fontWeight: onglet === id ? 800 : 600, color: onglet === id ? couleur : T.light, borderBottom: `3px solid ${onglet === id ? couleur : 'transparent'}`, marginBottom: -2, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{l}</button>
        ))}
      </div>

      {onglet === 'regles' && (
        <div style={carte}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, color: T.text, cursor: 'pointer', marginBottom: 10 }}>
            <input type="checkbox" checked={actif} onChange={e => setActif(e.target.checked)} /> Autoriser le lancement de nouvelles enchères
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, color: T.text, cursor: 'pointer', marginBottom: 14 }}>
            <input type="checkbox" checked={reserve} onChange={e => setReserve(e.target.checked)} /> Permettre un prix de réserve (jamais montré aux acheteurs)
          </label>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
            {champNombre('Durée minimale (heures)', '1 à 720 h. Défaut : 1 h.', dMin, setDMin, 1, 720)}
            {champNombre('Durée maximale (jours)', '1 à 60 jours. Défaut : 14.', dMax, setDMax, 1, 60)}
            {champNombre('Incrément minimal ($)', 'Hausse minimale entre deux mises. Défaut : 1 $.', incr, setIncr, 0.01, 100000)}
            {champNombre('Délai de paiement (heures)', 'Temps donné au gagnant pour payer. 1 à 24 h. Défaut : 24 h.', delai, setDelai, 1, 24)}
          </div>
          <button disabled={occupe || !addonActif} onClick={enregistrerRegles} style={{ ...btn(couleur, '#fff'), opacity: occupe || !addonActif ? 0.55 : 1 }}>{occupe ? '⏳ Enregistrement…' : 'Enregistrer'}</button>
          <div style={{ fontSize: 12, color: T.light, marginTop: 10 }}>Ces règles s'appliquent aux enchères que vous lancez à partir de maintenant. Les enchères déjà en cours gardent leurs règles.</div>
        </div>
      )}

      {onglet === 'widget' && dispose(
        <div>
          <p style={{ fontSize: 13, color: T.light, margin: '0 0 12px' }}>Choisissez le modèle du widget d'enchère affiché sur la fiche produit. L'aperçu se met à jour tout de suite.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MODELES.map(m => {
              const choisi = app.modele === m.id;
              return (
                <button key={m.id} onClick={() => maj('modele', m.id)} aria-pressed={choisi}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: '12px 14px', borderRadius: 12, border: choisi ? `2.5px solid ${m.id === 'actuel' ? couleur : m.couleur}` : `1.5px solid ${T.border}`, background: choisi ? `${m.id === 'actuel' ? couleur : m.couleur}12` : '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: m.id === 'actuel' ? couleur : m.couleur, flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: T.text }}>{m.id === 'actuel' ? 'Modèle 1' : `Modèle ${MODELES.findIndex(x => x.id === m.id) + 1}`} — {m.nom}</span>
                    <span style={{ display: 'block', fontSize: 12, color: T.light }}>{m.desc}</span>
                  </span>
                  {choisi && <span style={{ background: m.id === 'actuel' ? couleur : m.couleur, color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>✓ Actif</span>}
                </button>
              );
            })}
          </div>
          {barreEnregistrer}
        </div>
      )}

      {onglet === 'affichage' && dispose(
        <div>
          <div style={carte}>
            <div style={{ fontSize: 13, fontWeight: 800, color: couleur, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>⏱️ Minuteur</div>
            {interrupteur('Afficher les secondes', 'Désactivé : le minuteur montre seulement les heures et les minutes.', app.secondes, v => maj('secondes', v))}
            <div style={{ padding: '12px 0 4px' }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Format de la date de fin
                <input value={app.format_date || ''} onChange={e => maj('format_date', e.target.value.slice(0, 60))} placeholder="Laisser vide : 18 nov., 19 h 12" style={{ ...champ, marginTop: 4, maxWidth: 360 }} />
              </label>
              <div style={{ fontSize: 12, color: T.light, margin: '6px 0' }}>Résultat : <b style={{ color: T.text }}>{formaterDateEnchere(new Date(fin).toISOString(), app.format_date || null)}</b></div>
              <details style={{ fontSize: 12, color: T.light }}>
                <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Codes disponibles</summary>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '4px 14px', marginTop: 8 }}>
                  {CODES.map(([c, d]) => <div key={c}><code style={{ background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>{c}</code> {d}</div>)}
                </div>
                <div style={{ marginTop: 8 }}>Séparateurs permis : espace, « / », « - », « , », « : ». Exemple : <code>%e %B %Y, %H:%M</code></div>
              </details>
            </div>
          </div>
          <div style={{ ...carte, marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: couleur, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>👁️ Informations affichées</div>
            {interrupteur('Nombre de mises', 'Affiche « 8 mises » sous le prix.', app.nb_mises, v => maj('nb_mises', v))}
            {interrupteur('Meilleure mise (nom masqué)', 'Affiche l\'initiale du plus haut enchérisseur (ex. « M*** »).', app.meneur, v => maj('meneur', v))}
            {interrupteur('Prix de réserve atteint / non atteint', 'Le montant de la réserve n\'est jamais montré, seulement si elle est atteinte.', app.reserve, v => maj('reserve', v))}
            {interrupteur('Mettre la mise courante en évidence', 'Prix plus grand, encadré à la couleur du modèle.', app.evidence, v => maj('evidence', v))}
          </div>
          <div style={{ ...carte, marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: couleur, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>🖱️ Pour miser</div>
            {interrupteur('Préremplir la mise minimale', 'Le champ de mise contient déjà le montant minimum.', app.prefill, v => maj('prefill', v))}
            {interrupteur('Demander une confirmation avant de miser', 'L\'acheteur doit confirmer sa mise avant qu\'elle soit enregistrée.', app.confirmer, v => maj('confirmer', v))}
            {app.confirmer && (
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.text, padding: '10px 0 2px' }}>Texte du bouton de confirmation
                <input value={app.libelle_confirmer || ''} onChange={e => maj('libelle_confirmer', e.target.value.slice(0, 40))} placeholder="Confirmer ma mise" style={{ ...champ, marginTop: 4, maxWidth: 320 }} />
              </label>
            )}
          </div>
          {barreEnregistrer}
        </div>
      )}

      {erreurModale && <BoutiqueModale type="erreur" accent={couleur} message={erreurModale} onFermer={() => setErreurModale('')} />}
    </div>
  );
}