// CHEMIN : src/pages/gestionnaire/BoutiqueFavorisConfig.tsx
// e-Vend Studio — Configuration de l'add-on « Favoris » (liste de souhaits) des templates boutique solo. Adapté de StudioConfigFavoris.tsx (MV), sans y toucher.
// Mêmes 5 onglets (Général, Apparence, Notifications, Invités, Aperçu). Adapté : API /api/boutique/gestionnaire/favoris, aucun popup du navigateur (BoutiqueModale),
// lien « Guide » pris dans le catalogue des add-ons, aucune mention de « marketplace ».

import { useState, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { bq, messageErreur } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';
import { type ConfigFavoris, DEFAUT_FAVORIS, BoutiqueSouhaitBouton, ToastSouhaits, IconeSouhait } from '../../components/BoutiqueFavoris';

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', green: '#10b981', red: '#ef4444' };
const COULEURS: (keyof ConfigFavoris)[] = ['icone_couleur', 'icone_couleur_active', 'notif_couleur_fond', 'notif_couleur_texte', 'notif_couleur_erreur_fond', 'notif_couleur_erreur_texte'];
const HEX = /^#[0-9a-fA-F]{3,8}$/;
const lib: CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: T.light, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' };
const champ: CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: T.text, background: '#fff' };

function Couleur({ label, valeur, onChange }: { label: string; valeur: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const ok = HEX.test(valeur.trim());
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={lib}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div onClick={() => ref.current && ref.current.click()} style={{ width: 44, height: 44, borderRadius: 8, border: `2px solid ${T.border}`, cursor: 'pointer', backgroundColor: ok ? valeur : '#fff', flexShrink: 0 }} />
        <input ref={ref} type="color" value={ok && valeur.length === 7 ? valeur : '#000000'} onChange={e => onChange(e.target.value)} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }} />
        <input type="text" value={valeur} onChange={e => onChange(e.target.value)} maxLength={9} style={{ ...champ, fontFamily: 'monospace', borderColor: ok ? T.border : T.red }} />
      </div>
    </div>
  );
}

function Curseur({ label, valeur, onChange, min, max, unite = '', accent }: { label: string; valeur: number; onChange: (v: number) => void; min: number; max: number; unite?: string; accent: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ ...lib, marginBottom: 0 }}>{label}</label>
        <span style={{ fontSize: 12, fontWeight: 700, color: accent }}>{valeur}{unite}</span>
      </div>
      <input type="range" min={min} max={max} value={valeur} onChange={e => onChange(parseInt(e.target.value, 10))} style={{ width: '100%', accentColor: accent }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#aaa' }}><span>{min}{unite}</span><span>{max}{unite}</span></div>
    </div>
  );
}

function Interrupteur({ nom, aide, valeur, onChange, accent }: { nom: string; aide: string; valeur: boolean; onChange: (v: boolean) => void; accent: string }) {
  return (
    <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', padding: '12px 14px', background: '#f8fafc', border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: 10 }}>
      <input type="checkbox" checked={valeur} onChange={e => onChange(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, accentColor: accent, flexShrink: 0 }} />
      <span><span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{nom}</span><span style={{ display: 'block', fontSize: 12, color: T.light }}>{aide}</span></span>
    </label>
  );
}

function Liste<V extends string>({ label, valeur, options, onChange }: { label: string; valeur: V; options: { v: V; l: string }[]; onChange: (v: V) => void }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={lib}>{label}</label>
      <select value={valeur} onChange={e => onChange(e.target.value as V)} style={champ}>{options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
    </div>
  );
}

function Texte({ label, valeur, onChange }: { label: string; valeur: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={lib}>{label}</label>
      <input type="text" value={valeur} maxLength={160} onChange={e => onChange(e.target.value)} style={champ} />
    </div>
  );
}

function Titre({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: 13, fontWeight: 800, color: T.text, margin: '20px 0 14px', paddingBottom: 10, borderBottom: `1px solid ${T.border}` }}>{children}</p>;
}

type Onglet = 'general' | 'apparence' | 'notifications' | 'invites' | 'apercu';

export default function BoutiqueFavorisConfig({ accent, isMobile: mobileProp }: { gestionnaireId: number; accent?: string; isMobile?: boolean }) {
  const couleur = accent || '#4f46e5';
  const isMobile = !!mobileProp;
  const [cfg, setCfg] = useState<ConfigFavoris>(DEFAUT_FAVORIS);
  const [onglet, setOnglet] = useState<Onglet>('general');
  const [personnalisee, setPersonnalisee] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [inactif, setInactif] = useState(false);
  const [erreurCharg, setErreurCharg] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [guide, setGuide] = useState('');
  const [modale, setModale] = useState<null | { type: 'erreur' | 'succes' | 'confirmer'; message: string }>(null);
  const [dedansProduit, setDedansProduit] = useState(false);
  const [dedansCarte, setDedansCarte] = useState(true);
  const [toastTest, setToastTest] = useState<{ msg: string; ok: boolean } | null>(null);
  const minuterie = useRef<any>(null);
  useEffect(() => () => { if (minuterie.current) clearTimeout(minuterie.current); }, []);

  useEffect(() => {
    (async () => {
      const [c, a] = await Promise.all([bq('/favoris'), bq('/addons')]);
      if (c.status === 403 && c.data && c.data.addon_inactif) { setInactif(true); setChargement(false); return; }
      if (!c.ok) { setErreurCharg(messageErreur(c)); setChargement(false); return; }
      setCfg({ ...DEFAUT_FAVORIS, ...(c.data.config || {}) });
      setPersonnalisee(!!c.data.personnalisee);
      if (a.ok && Array.isArray(a.data.addons)) { const g = a.data.addons.find((y: any) => y.code === 'favoris'); if (g && g.guide_url) setGuide(g.guide_url); }
      setChargement(false);
    })();
  }, []);

  const set = <K extends keyof ConfigFavoris>(k: K, v: ConfigFavoris[K]) => setCfg(p => ({ ...p, [k]: v }));

  const sauvegarder = async () => {
    const mauvaise = COULEURS.find(k => !HEX.test(String(cfg[k]).trim()));
    if (mauvaise) { setModale({ type: 'erreur', message: 'Une couleur est invalide. Utilisez le format #rrggbb (ex. #ef4444).' }); return; }
    setEnCours(true);
    const r = await bq('/favoris', { method: 'PUT', body: cfg });
    setEnCours(false);
    if (!r.ok) { setModale({ type: 'erreur', message: messageErreur(r) }); return; }
    setCfg({ ...DEFAUT_FAVORIS, ...(r.data.config || {}) });
    setPersonnalisee(true);
    setModale({ type: 'succes', message: 'Réglages enregistrés. Ils s’appliquent à votre boutique (les visiteurs verront les changements au prochain chargement de la page).' });
  };

  const reinitialiser = async () => {
    setEnCours(true);
    const r = await bq('/favoris', { method: 'DELETE' });
    setEnCours(false);
    if (!r.ok) { setModale({ type: 'erreur', message: messageErreur(r) }); return; }
    setCfg({ ...DEFAUT_FAVORIS, ...(r.data.config || {}) });
    setPersonnalisee(false);
    setModale({ type: 'succes', message: 'Les réglages par défaut sont rétablis.' });
  };

  const montrerToast = (ok: boolean, msg: string) => {
    setToastTest({ ok, msg });
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(() => setToastTest(null), Math.max(1, cfg.notif_duree) * 1000);
  };

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>;
  const carte: CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 14, padding: isMobile ? 14 : '20px 24px' };
  if (inactif) return <div style={{ ...carte, margin: 20 }}><h2 style={{ marginTop: 0 }}>❤️ Favoris</h2><p style={{ color: T.light }}>Cet add-on n'est pas activé. Activez-le dans « 📊 Mon plan & limites » pour régler la liste de souhaits de vos clients.</p></div>;
  if (erreurCharg) return <div style={{ ...carte, margin: 20 }}><p style={{ color: T.red }}>{erreurCharg}</p></div>;

  const grille: CSSProperties = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '0 28px' };
  const onglets: [Onglet, string][] = [['general', '📦 Général'], ['apparence', '🎨 Apparence'], ['notifications', '🔔 Notifications'], ['invites', '👤 Visiteurs'], ['apercu', '👁️ Aperçu']];
  const bouton = (kind: 'prod' | 'carte', dedans: boolean, clic: () => void) => <BoutiqueSouhaitBouton variante={kind === 'prod' ? 'produit' : 'carte'} apercu={{ config: cfg, actif: dedans, onClick: clic }} />;
  const clicProduit = () => { montrerToast(true, dedansProduit ? cfg.notif_msg_retrait : cfg.notif_msg_ajout); setDedansProduit(v => !v); };
  const clicCarte = () => setDedansCarte(v => !v);
  const pos = cfg.bouton_catalogue_position;

  return (
    <div style={{ maxWidth: 980, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#f43f5e,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>❤️</div>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 22, color: T.text }}>Favoris
            {guide && <a href={guide} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: couleur, textDecoration: 'none', border: `1px solid ${couleur}`, borderRadius: 12, padding: '2px 10px', marginLeft: 10, verticalAlign: 'middle' }}>📖 Guide</a>}
          </h2>
          <p style={{ fontSize: 13, color: T.light, margin: 0 }}>Liste de souhaits de vos clients : boutons, icône, notifications et visiteurs non connectés</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, background: '#f9fafb', borderRadius: 12, padding: 4, marginBottom: 16, border: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        {onglets.map(([id, nom]) => (
          <button key={id} onClick={() => setOnglet(id)} style={{ flex: isMobile ? '1 1 45%' : 1, padding: '9px 12px', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: onglet === id ? '#fff' : 'transparent', color: onglet === id ? couleur : T.light, boxShadow: onglet === id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>{nom}</button>
        ))}
      </div>

      <div style={carte}>
        {onglet === 'general' && (
          <div>
            <Titre>📄 Fiche du produit</Titre>
            <Interrupteur accent={couleur} nom="Bouton sur la fiche produit" aide="Affiche le bouton « Liste de souhaits » sur la fiche d'une annonce" valeur={cfg.bouton_produit_actif} onChange={v => set('bouton_produit_actif', v)} />
            {cfg.bouton_produit_actif && <Liste label="Position" valeur={cfg.bouton_produit_position} onChange={v => set('bouton_produit_position', v)} options={[{ v: 'avant_panier', l: 'Avant le bouton « Ajouter au panier »' }, { v: 'apres_panier', l: 'Après le bouton « Ajouter au panier »' }]} />}

            <Titre>🖼️ Cartes du catalogue</Titre>
            <Interrupteur accent={couleur} nom="Bouton sur les cartes" aide="Ajoute un cœur sur chaque carte produit (accueil, catalogue, produits similaires)" valeur={cfg.bouton_catalogue_actif} onChange={v => set('bouton_catalogue_actif', v)} />
            {cfg.bouton_catalogue_actif && (
              <div style={grille}>
                <Liste label="Position" valeur={cfg.bouton_catalogue_position} onChange={v => set('bouton_catalogue_position', v)} options={[{ v: 'superposition', l: "Superposition (sur l'image)" }, { v: 'haut', l: 'Haut du texte de la carte' }, { v: 'bas', l: 'Bas de la carte' }]} />
                <Liste label="Style du bouton" valeur={cfg.bouton_catalogue_style} onChange={v => set('bouton_catalogue_style', v)} options={[{ v: 'moderne', l: 'Moderne (rond)' }, { v: 'classique', l: 'Classique (carré)' }, { v: 'minimaliste', l: 'Minimaliste (icône seule)' }]} />
              </div>
            )}

            <Titre>🔝 Accès à la liste</Titre>
            <Interrupteur accent={couleur} nom="Icône dans la barre de navigation" aide="Un cœur dans l'en-tête du site qui ouvre la liste du client (ou la connexion s'il n'est pas connecté)" valeur={cfg.entete_actif} onChange={v => set('entete_actif', v)} />
            {cfg.entete_actif && <Interrupteur accent={couleur} nom="Afficher le compteur" aide="Nombre d'articles dans la liste, sur l'icône" valeur={cfg.entete_compteur} onChange={v => set('entete_compteur', v)} />}
            <Interrupteur accent={couleur} nom="Bouton flottant" aide="Un bouton rond fixe dans un coin de l'écran, pour accéder à la liste" valeur={cfg.flottant_actif} onChange={v => set('flottant_actif', v)} />
            {cfg.flottant_actif && <Liste label="Position du bouton flottant" valeur={cfg.flottant_position} onChange={v => set('flottant_position', v)} options={[{ v: 'bas_droite', l: 'Bas droite' }, { v: 'bas_gauche', l: 'Bas gauche' }, { v: 'haut_droite', l: 'Haut droite' }, { v: 'haut_gauche', l: 'Haut gauche' }]} />}

            <Titre>📋 Page « Liste de souhaits » du client</Titre>
            <Curseur accent={couleur} label="Articles affichés avant « Afficher plus »" valeur={cfg.elements_par_page} onChange={v => set('elements_par_page', v)} min={5} max={100} />
          </div>
        )}

        {onglet === 'apparence' && (
          <div>
            <Titre>🎨 Icône</Titre>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              {([['coeur', 'Cœur'], ['etoile', 'Étoile'], ['signet', 'Signet']] as const).map(([v, l]) => (
                <button key={v} onClick={() => set('icone_style', v)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: cfg.icone_style === v ? '#eef2ff' : '#fff', border: `2px solid ${cfg.icone_style === v ? couleur : T.border}`, color: T.text }}>
                  <IconeSouhait config={{ ...cfg, icone_style: v }} rempli taille={22} />{l}
                </button>
              ))}
            </div>
            <div style={grille}>
              <Liste label="Animation à l'ajout" valeur={cfg.icone_animation} onChange={v => set('icone_animation', v)} options={[{ v: 'aucune', l: 'Aucune' }, { v: 'rebond', l: 'Rebond' }, { v: 'echelle', l: 'Zoom' }, { v: 'fondu', l: 'Fondu' }]} />
              <Curseur accent={couleur} label="Taille" valeur={cfg.icone_taille} onChange={v => set('icone_taille', v)} min={16} max={48} unite=" px" />
              <Couleur label="Couleur par défaut" valeur={cfg.icone_couleur} onChange={v => set('icone_couleur', v)} />
              <Couleur label="Couleur quand le produit est dans la liste" valeur={cfg.icone_couleur_active} onChange={v => set('icone_couleur_active', v)} />
            </div>
          </div>
        )}

        {onglet === 'notifications' && (
          <div>
            <Interrupteur accent={couleur} nom="Notifications" aide="Petit message quand un produit est ajouté ou retiré de la liste" valeur={cfg.notif_actif} onChange={v => set('notif_actif', v)} />
            {cfg.notif_actif && (
              <>
                <Titre>⚙️ Affichage</Titre>
                <div style={grille}>
                  <Liste label="Emplacement" valeur={cfg.notif_placement} onChange={v => set('notif_placement', v)} options={[{ v: 'bas_centre', l: 'Bas centre' }, { v: 'bas_droite', l: 'Bas droite' }, { v: 'bas_gauche', l: 'Bas gauche' }, { v: 'haut_centre', l: 'Haut centre' }]} />
                  <Curseur accent={couleur} label="Durée d'affichage" valeur={cfg.notif_duree} onChange={v => set('notif_duree', v)} min={1} max={15} unite=" s" />
                </div>
                <Interrupteur accent={couleur} nom="Animation d'apparition" aide="Le message glisse doucement à l'écran" valeur={cfg.notif_animer} onChange={v => set('notif_animer', v)} />
                <Titre>🎨 Couleurs</Titre>
                <div style={grille}>
                  <Couleur label="Fond (succès)" valeur={cfg.notif_couleur_fond} onChange={v => set('notif_couleur_fond', v)} />
                  <Couleur label="Texte (succès)" valeur={cfg.notif_couleur_texte} onChange={v => set('notif_couleur_texte', v)} />
                  <Couleur label="Fond (erreur)" valeur={cfg.notif_couleur_erreur_fond} onChange={v => set('notif_couleur_erreur_fond', v)} />
                  <Couleur label="Texte (erreur)" valeur={cfg.notif_couleur_erreur_texte} onChange={v => set('notif_couleur_erreur_texte', v)} />
                </div>
                <Titre>✉️ Messages</Titre>
                <Texte label="Produit ajouté" valeur={cfg.notif_msg_ajout} onChange={v => set('notif_msg_ajout', v)} />
                <Texte label="Produit retiré" valeur={cfg.notif_msg_retrait} onChange={v => set('notif_msg_retrait', v)} />
                <Texte label="Produit ajouté par un visiteur non connecté" valeur={cfg.notif_msg_invite} onChange={v => set('notif_msg_invite', v)} />
              </>
            )}
          </div>
        )}

        {onglet === 'invites' && (
          <div>
            <Interrupteur accent={couleur} nom="Liste pour les visiteurs non connectés" aide="Un visiteur peut ajouter des produits sans compte. La liste est gardée dans son navigateur, puis enregistrée dans son compte dès qu'il se connecte." valeur={cfg.invites_actif} onChange={v => set('invites_actif', v)} />
            {cfg.invites_actif ? (
              <div style={grille}>
                <Curseur accent={couleur} label="Durée de conservation" valeur={cfg.invites_duree_jours} onChange={v => set('invites_duree_jours', v)} min={1} max={365} unite=" j" />
                <Curseur accent={couleur} label="Nombre maximum d'articles" valeur={cfg.invites_max} onChange={v => set('invites_max', v)} min={1} max={200} />
              </div>
            ) : (
              <p style={{ fontSize: 12, color: T.light }}>Désactivé : un visiteur qui clique sur le cœur voit un message l'invitant à se connecter.</p>
            )}
          </div>
        )}

        {onglet === 'apercu' && (
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <p style={{ fontSize: 12, color: T.light, textAlign: 'center', marginBottom: 16 }}>Aperçu de ce que verront vos clients (les changements non enregistrés y sont déjà). Cliquez sur les boutons pour essayer.</p>
            <div style={{ background: '#0a0a0a', borderRadius: 14, padding: 18 }}>
              <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, margin: '0 0 8px', textTransform: 'uppercase' }}>Fiche produit</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320 }}>
                {cfg.bouton_produit_actif && cfg.bouton_produit_position === 'avant_panier' && bouton('prod', dedansProduit, clicProduit)}
                <div style={{ padding: 13, borderRadius: 10, background: '#c9a96e', color: '#000', fontWeight: 800, fontSize: 14, textAlign: 'center' }}>🛒 AJOUTER AU PANIER</div>
                {cfg.bouton_produit_actif && cfg.bouton_produit_position === 'apres_panier' && bouton('prod', dedansProduit, clicProduit)}
              </div>
              <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, margin: '18px 0 8px', textTransform: 'uppercase' }}>Carte produit</p>
              <div style={{ width: 190, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
                <div style={{ position: 'relative', height: 120, background: 'linear-gradient(135deg,#3b3b52,#22222f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                  🛋️
                  {cfg.bouton_catalogue_actif && pos === 'superposition' && <div style={{ position: 'absolute', top: 8, right: 8 }}>{bouton('carte', dedansCarte, clicCarte)}</div>}
                </div>
                <div style={{ padding: 10 }}>
                  {cfg.bouton_catalogue_actif && pos === 'haut' && <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 6 }}>{bouton('carte', dedansCarte, clicCarte)}</div>}
                  <p style={{ color: '#fff', fontSize: 13, margin: '0 0 4px' }}>Fauteuil en lin</p>
                  <p style={{ color: '#c9a96e', fontSize: 14, fontWeight: 800, margin: 0 }}>129,00 $</p>
                  {cfg.bouton_catalogue_actif && pos === 'bas' && <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>{bouton('carte', dedansCarte, clicCarte)}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
                {([['🔔 Tester la notification', true, cfg.notif_msg_ajout], ['👤 Message visiteur', true, cfg.notif_msg_invite], ["⚠️ Message d'erreur", false, 'Connectez-vous pour utiliser votre liste de souhaits']] as [string, boolean, string][]).map(([t, ok, m]) => (
                  <button key={t} onClick={() => montrerToast(ok, m)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{t}</button>
                ))}
              </div>
            </div>
            <ToastSouhaits config={cfg} toast={cfg.notif_actif ? toastTest : null} />
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={sauvegarder} disabled={enCours} style={{ background: couleur, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: enCours ? 'wait' : 'pointer', opacity: enCours ? 0.6 : 1, fontFamily: 'inherit' }}>{enCours ? '⏳ Enregistrement…' : '💾 Enregistrer'}</button>
        <button onClick={() => setModale({ type: 'confirmer', message: 'Revenir aux réglages par défaut ? Vos personnalisations seront supprimées.' })} disabled={!personnalisee || enCours} style={{ background: '#fff', color: T.light, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 600, cursor: personnalisee ? 'pointer' : 'not-allowed', opacity: personnalisee ? 1 : 0.5, fontFamily: 'inherit' }}>🔄 Réglages par défaut</button>
      </div>

      {modale && (modale.type === 'confirmer'
        ? <BoutiqueModale type="confirmer" message={modale.message} accent={couleur} enCours={enCours} texteConfirmer="Rétablir" onConfirmer={async () => { await reinitialiser(); }} onFermer={() => setModale(null)} />
        : <BoutiqueModale type={modale.type} message={modale.message} accent={couleur} onFermer={() => setModale(null)} />)}
    </div>
  );
}