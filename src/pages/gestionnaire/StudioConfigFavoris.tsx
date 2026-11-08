// CHEMIN : src/pages/gestionnaire/StudioConfigFavoris.tsx
// e-Vend Studio — Add-on « Favoris » : ❤️ Configuration — Liste de souhaits (côté gestionnaire).
// Personnalise, pour SA marketplace : boutons ♥ (page produit, cartes), icône d'en-tête, bouton flottant, apparence de l'icône,
// notifications et liste des visiteurs non connectés.
// API : GET/PUT/DELETE /api/studio-forfaits/mv/favoris-config  (l'enregistrement exige l'add-on actif)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ConfigFavoris, DEFAUT_FAVORIS, MVSouhaitBouton, ToastSouhaits, IconeSouhait } from '../../templates/multivendeur/MVFavoris';

const API_BASE = '/api';
const URL_GUIDE = 'https://e-vendstudio.ca/documents/mv-guide-favoris-add-on';

const THEME = {
  accent: '#2d6a9f', bg: '#f0f2f5', card: '#ffffff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280', danger: '#dc2626', success: '#16a34a',
};

function ChampCouleur({ label, valeur, onChange }: { label: string; valeur: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [local, setLocal] = useState(valeur);
  useEffect(() => { setLocal(valeur); }, [valeur]);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: THEME.textLight, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 8, border: `2px solid ${THEME.border}`, cursor: 'pointer', backgroundColor: local, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} onClick={() => inputRef.current?.click()} />
        <input ref={inputRef} type="color" defaultValue={local.length === 7 ? local : '#000000'}
          onInput={e => { const v = (e.target as HTMLInputElement).value; setLocal(v); onChange(v); }}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }} />
        <input type="text" value={local} onChange={e => { setLocal(e.target.value); onChange(e.target.value); }}
          style={{ flex: 1, padding: '10px 12px', border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 13, fontFamily: 'monospace' }} />
      </div>
    </div>
  );
}

function Slider({ label, valeur, onChange, min, max, unite = '' }: { label: string; valeur: number; onChange: (v: number) => void; min: number; max: number; unite?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: THEME.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
        <span style={{ fontSize: 12, fontWeight: 700, color: THEME.accent }}>{valeur}{unite}</span>
      </div>
      <input type="range" min={min} max={max} value={valeur} onChange={e => onChange(parseInt(e.target.value, 10))} style={{ width: '100%', accentColor: THEME.accent }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: '#aaa' }}>{min}{unite}</span><span style={{ fontSize: 10, color: '#aaa' }}>{max}{unite}</span>
      </div>
    </div>
  );
}

function Toggle({ label, description, valeur, onChange }: { label: string; description: string; valeur: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: '#f8fafc', borderRadius: 10, border: `1px solid ${THEME.border}`, marginBottom: 10 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: THEME.text, margin: '0 0 2px 0' }}>{label}</p>
        <p style={{ fontSize: 11, color: THEME.textLight, margin: 0 }}>{description}</p>
      </div>
      <div onClick={() => onChange(!valeur)} style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: valeur ? THEME.success : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, marginLeft: 16 }}>
        <div style={{ position: 'absolute', top: 2, left: valeur ? 22 : 2, width: 20, height: 20, borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  );
}

function Choix<T extends string>({ label, valeur, options, onChange }: { label: string; valeur: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: THEME.textLight, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <select value={valeur} onChange={e => onChange(e.target.value as T)}
        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 13, background: '#fff', boxSizing: 'border-box' }}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

function Texte({ label, valeur, onChange, ph }: { label: string; valeur: string; onChange: (v: string) => void; ph?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: THEME.textLight, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <input type="text" value={valeur} placeholder={ph} maxLength={160} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
    </div>
  );
}

function SectionTitre({ titre }: { titre: string }) {
  return <p style={{ fontSize: 13, fontWeight: 700, color: THEME.text, margin: '20px 0 16px 0', paddingBottom: 12, borderBottom: `1px solid ${THEME.border}` }}>{titre}</p>;
}

export default function StudioConfigFavoris({ gestionnaireId }: { gestionnaireId: number }) {
  const [config, setConfig] = useState<ConfigFavoris>(DEFAUT_FAVORIS);
  const [addonActif, setAddonActif] = useState(true);
  const [personnalisee, setPersonnalisee] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [message, setMessage] = useState('');
  const [sauvegarde, setSauvegarde] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [onglet, setOnglet] = useState<'general' | 'apparence' | 'notifications' | 'invites' | 'apercu'>('general');
  const [dedansProduit, setDedansProduit] = useState(false);
  const [dedansCarte, setDedansCarte] = useState(true);
  const [toastTest, setToastTest] = useState<{ msg: string; ok: boolean } | null>(null);

  const entetes = (json = false): Record<string, string> => {
    const h: Record<string, string> = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  };

  const charger = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/studio-forfaits/mv/favoris-config`, { headers: entetes(), credentials: 'include' });
      const d = await r.json().catch(() => null);
      if (r.ok && d && d.config) { setConfig({ ...DEFAUT_FAVORIS, ...d.config }); setAddonActif(d.addon_actif !== false); setPersonnalisee(d.personnalisee === true); }
    } catch { /* garde les valeurs par défaut */ }
    setChargement(false);
  }, [gestionnaireId]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { charger(); }, [charger]);

  const set = <K extends keyof ConfigFavoris>(cle: K, valeur: ConfigFavoris[K]) => setConfig(prev => ({ ...prev, [cle]: valeur }));

  const sauvegarder = async () => {
    setSauvegarde('saving'); setMessage('');
    try {
      const res = await fetch(`${API_BASE}/studio-forfaits/mv/favoris-config`, { method: 'PUT', headers: entetes(true), credentials: 'include', body: JSON.stringify(config) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { setSauvegarde('success'); setPersonnalisee(true); }
      else { setSauvegarde('error'); setMessage(d.error || 'Enregistrement impossible'); }
    } catch { setSauvegarde('error'); setMessage('Erreur réseau'); }
    setTimeout(() => setSauvegarde('idle'), 3000);
  };

  const reinitialiser = async () => {
    if (!window.confirm('Revenir aux réglages par défaut ? Vos personnalisations seront supprimées.')) return;
    try { await fetch(`${API_BASE}/studio-forfaits/mv/favoris-config`, { method: 'DELETE', headers: entetes(), credentials: 'include' }); } catch { /* ignore */ }
    setChargement(true); await charger();
  };

  const montrerToast = (ok: boolean, msg: string) => { setToastTest({ ok, msg }); setTimeout(() => setToastTest(null), Math.max(1, config.notif_duree) * 1000); };

  const onglets = [
    { id: 'general', label: '📦 Général' }, { id: 'apparence', label: '🎨 Apparence' }, { id: 'notifications', label: '🔔 Notifications' },
    { id: 'invites', label: '👤 Invités' }, { id: 'apercu', label: '👁️ Aperçu' },
  ] as const;

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: THEME.textLight }}>Chargement…</div>;
  const grille2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 32px' };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 980 }}>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>❤️ Configuration — Favoris</h1>
          <p style={{ fontSize: 13, color: THEME.textLight, margin: 0 }}>Réglez la liste de souhaits de votre marketplace : boutons, icône, notifications et visiteurs non connectés.</p>
        </div>
        <a href={URL_GUIDE} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, textDecoration: 'none', padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #1e0533, #0d0a2e)', color: 'white', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 16px rgba(30,5,51,0.4)' }}>
          <span style={{ fontSize: 16 }}>📖</span><span>Guide</span>
        </a>
      </div>

      {!addonActif && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: 10, padding: '12px 16px', fontSize: 13, marginBottom: 18 }}>
          🔒 L'add-on <strong>Favoris</strong> n'est pas activé : vous pouvez regarder les réglages, mais l'enregistrement est désactivé. Activez-le dans <strong>Mon plan &amp; limites</strong>.
        </div>
      )}
      {message && <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{message}</div>}

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, backgroundColor: '#f0f2f5', padding: 4, borderRadius: 10, width: 'fit-content', flexWrap: 'wrap' }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, backgroundColor: onglet === o.id ? 'white' : 'transparent', color: onglet === o.id ? THEME.accent : THEME.textLight, boxShadow: onglet === o.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>{o.label}</button>
        ))}
      </div>

      <div style={{ backgroundColor: THEME.card, borderRadius: 12, border: `1px solid ${THEME.border}`, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

        {onglet === 'general' && (
          <div>
            <SectionTitre titre="📄 Page du produit" />
            <Toggle label="Bouton sur la page produit" description="Affiche le bouton « Liste de souhaits » sur la fiche d'une annonce" valeur={config.bouton_produit_actif} onChange={v => set('bouton_produit_actif', v)} />
            {config.bouton_produit_actif && <Choix label="Position" valeur={config.bouton_produit_position} onChange={v => set('bouton_produit_position', v)} options={[{ v: 'avant_panier', l: 'Avant le bouton « Ajouter au panier »' }, { v: 'apres_panier', l: 'Après le bouton « Ajouter au panier »' }]} />}

            <SectionTitre titre="🖼️ Cartes du catalogue et des boutiques" />
            <Toggle label="Bouton sur les cartes" description="Ajoute un ♥ sur chaque carte produit (catalogue et page d'une boutique)" valeur={config.bouton_catalogue_actif} onChange={v => set('bouton_catalogue_actif', v)} />
            {config.bouton_catalogue_actif && (
              <div style={grille2}>
                <Choix label="Position" valeur={config.bouton_catalogue_position} onChange={v => set('bouton_catalogue_position', v)} options={[{ v: 'superposition', l: "Superposition (sur l'image)" }, { v: 'haut', l: 'Haut du texte de la carte' }, { v: 'bas', l: 'Bas de la carte' }]} />
                <Choix label="Style du bouton" valeur={config.bouton_catalogue_style} onChange={v => set('bouton_catalogue_style', v)} options={[{ v: 'moderne', l: 'Moderne (rond)' }, { v: 'classique', l: 'Classique (carré)' }, { v: 'minimaliste', l: 'Minimaliste (icône seule)' }]} />
              </div>
            )}

            <SectionTitre titre="🔝 Accès à la liste" />
            <Toggle label="Icône dans la barre de navigation" description="Un cœur dans le menu du site (ordinateur) qui ouvre la liste de l'acheteur" valeur={config.entete_actif} onChange={v => set('entete_actif', v)} />
            {config.entete_actif && <Toggle label="Afficher le compteur" description="Nombre d'articles dans la liste, sur l'icône" valeur={config.entete_compteur} onChange={v => set('entete_compteur', v)} />}
            <Toggle label="Bouton flottant" description="Un bouton rond fixe dans un coin de l'écran, pour accéder à la liste" valeur={config.flottant_actif} onChange={v => set('flottant_actif', v)} />
            {config.flottant_actif && <Choix label="Position du bouton flottant" valeur={config.flottant_position} onChange={v => set('flottant_position', v)} options={[{ v: 'bas_droite', l: 'Bas droite' }, { v: 'bas_gauche', l: 'Bas gauche' }, { v: 'haut_droite', l: 'Haut droite' }, { v: 'haut_gauche', l: 'Haut gauche' }]} />}

            <SectionTitre titre="📋 Page « Liste de souhaits » de l'acheteur" />
            <Slider label="Articles affichés avant « Afficher plus »" valeur={config.elements_par_page} onChange={v => set('elements_par_page', v)} min={5} max={100} />
          </div>
        )}

        {onglet === 'apparence' && (
          <div>
            <SectionTitre titre="🎨 Icône" />
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              {([['coeur', 'Cœur'], ['etoile', 'Étoile'], ['signet', 'Signet']] as const).map(([v, l]) => (
                <button key={v} onClick={() => set('icone_style', v)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, background: config.icone_style === v ? '#e8f2fb' : '#fff', border: `2px solid ${config.icone_style === v ? THEME.accent : THEME.border}`, color: THEME.text }}>
                  <IconeSouhait config={{ ...config, icone_style: v }} rempli taille={22} />{l}
                </button>
              ))}
            </div>
            <div style={grille2}>
              <Choix label="Animation à l'ajout" valeur={config.icone_animation} onChange={v => set('icone_animation', v)} options={[{ v: 'aucune', l: 'Aucune' }, { v: 'rebond', l: 'Rebond' }, { v: 'echelle', l: 'Zoom' }, { v: 'fondu', l: 'Fondu' }]} />
              <Slider label="Taille" valeur={config.icone_taille} onChange={v => set('icone_taille', v)} min={16} max={48} unite=" px" />
              <ChampCouleur label="Couleur par défaut" valeur={config.icone_couleur} onChange={v => set('icone_couleur', v)} />
              <ChampCouleur label="Couleur quand le produit est dans la liste" valeur={config.icone_couleur_active} onChange={v => set('icone_couleur_active', v)} />
            </div>
          </div>
        )}

        {onglet === 'notifications' && (
          <div>
            <Toggle label="Notifications" description="Petit message quand un produit est ajouté ou retiré de la liste" valeur={config.notif_actif} onChange={v => set('notif_actif', v)} />
            {config.notif_actif && (
              <>
                <SectionTitre titre="⚙️ Affichage" />
                <div style={grille2}>
                  <Choix label="Emplacement" valeur={config.notif_placement} onChange={v => set('notif_placement', v)} options={[{ v: 'bas_centre', l: 'Bas centre' }, { v: 'bas_droite', l: 'Bas droite' }, { v: 'bas_gauche', l: 'Bas gauche' }, { v: 'haut_centre', l: 'Haut centre' }]} />
                  <Slider label="Durée d'affichage" valeur={config.notif_duree} onChange={v => set('notif_duree', v)} min={1} max={15} unite=" s" />
                </div>
                <Toggle label="Animation d'apparition" description="Le message glisse doucement à l'écran" valeur={config.notif_animer} onChange={v => set('notif_animer', v)} />
                <SectionTitre titre="🎨 Couleurs" />
                <div style={grille2}>
                  <ChampCouleur label="Fond (succès)" valeur={config.notif_couleur_fond} onChange={v => set('notif_couleur_fond', v)} />
                  <ChampCouleur label="Texte (succès)" valeur={config.notif_couleur_texte} onChange={v => set('notif_couleur_texte', v)} />
                  <ChampCouleur label="Fond (erreur)" valeur={config.notif_couleur_erreur_fond} onChange={v => set('notif_couleur_erreur_fond', v)} />
                  <ChampCouleur label="Texte (erreur)" valeur={config.notif_couleur_erreur_texte} onChange={v => set('notif_couleur_erreur_texte', v)} />
                </div>
                <SectionTitre titre="✉️ Messages" />
                <Texte label="Produit ajouté" valeur={config.notif_msg_ajout} onChange={v => set('notif_msg_ajout', v)} />
                <Texte label="Produit retiré" valeur={config.notif_msg_retrait} onChange={v => set('notif_msg_retrait', v)} />
                <Texte label="Produit ajouté par un visiteur non connecté" valeur={config.notif_msg_invite} onChange={v => set('notif_msg_invite', v)} />
              </>
            )}
          </div>
        )}

        {onglet === 'invites' && (
          <div>
            <Toggle label="Liste pour les visiteurs non connectés" description="Un visiteur peut ajouter des produits sans compte. La liste est gardée dans son navigateur, puis enregistrée dans son compte dès qu'il se connecte." valeur={config.invites_actif} onChange={v => set('invites_actif', v)} />
            {config.invites_actif ? (
              <div style={grille2}>
                <Slider label="Durée de conservation" valeur={config.invites_duree_jours} onChange={v => set('invites_duree_jours', v)} min={1} max={365} unite=" j" />
                <Slider label="Nombre maximum d'articles" valeur={config.invites_max} onChange={v => set('invites_max', v)} min={1} max={200} />
              </div>
            ) : (
              <p style={{ fontSize: 12, color: THEME.textLight }}>Désactivé : un visiteur qui clique sur le bouton voit un message l'invitant à se connecter.</p>
            )}
          </div>
        )}

        {onglet === 'apercu' && (
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <p style={{ fontSize: 12, color: THEME.textLight, textAlign: 'center', marginBottom: 16 }}>Aperçu de ce que verront vos acheteurs (les changements non sauvegardés y sont déjà). Cliquez sur les boutons pour essayer.</p>
            <div style={{ background: '#0a0a0a', borderRadius: 14, padding: 18 }}>
              <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, margin: '0 0 8px', textTransform: 'uppercase' }}>Page produit</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320 }}>
                {config.bouton_produit_position === 'avant_panier' && config.bouton_produit_actif && <MVSouhaitBouton variante="produit" apercu={{ config, actif: dedansProduit, onClick: () => { montrerToast(true, dedansProduit ? config.notif_msg_retrait : config.notif_msg_ajout); setDedansProduit(v => !v); } }} />}
                <div style={{ padding: 13, borderRadius: 12, background: '#fbbf24', color: '#000', fontWeight: 800, fontSize: 14, textAlign: 'center' }}>🛒 Ajouter au panier</div>
                {config.bouton_produit_position === 'apres_panier' && config.bouton_produit_actif && <MVSouhaitBouton variante="produit" apercu={{ config, actif: dedansProduit, onClick: () => { montrerToast(true, dedansProduit ? config.notif_msg_retrait : config.notif_msg_ajout); setDedansProduit(v => !v); } }} />}
              </div>
              <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, margin: '18px 0 8px', textTransform: 'uppercase' }}>Carte produit</p>
              <div style={{ width: 190, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
                <div style={{ position: 'relative', height: 120, background: 'linear-gradient(135deg,#3b3b52,#22222f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                  👟
                  {config.bouton_catalogue_actif && config.bouton_catalogue_position === 'superposition' && (
                    <div style={{ position: 'absolute', top: 8, right: 8 }}><MVSouhaitBouton variante="carte" apercu={{ config, actif: dedansCarte, onClick: () => setDedansCarte(v => !v) }} /></div>
                  )}
                </div>
                <div style={{ padding: 10 }}>
                  {config.bouton_catalogue_actif && config.bouton_catalogue_position === 'haut' && <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 6 }}><MVSouhaitBouton variante="carte" apercu={{ config, actif: dedansCarte, onClick: () => setDedansCarte(v => !v) }} /></div>}
                  <p style={{ color: '#fff', fontSize: 13, margin: '0 0 4px' }}>Baskets édition limitée</p>
                  <p style={{ color: '#fbbf24', fontSize: 14, fontWeight: 800, margin: 0 }}>129,00 $</p>
                  {config.bouton_catalogue_actif && config.bouton_catalogue_position === 'bas' && <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}><MVSouhaitBouton variante="carte" apercu={{ config, actif: dedansCarte, onClick: () => setDedansCarte(v => !v) }} /></div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
                <button onClick={() => montrerToast(true, config.notif_msg_ajout)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🔔 Tester la notification</button>
                <button onClick={() => montrerToast(true, config.notif_msg_invite)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>👤 Message visiteur</button>
                <button onClick={() => montrerToast(false, 'Connectez-vous avec un compte acheteur pour utiliser votre liste de souhaits')} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>⚠️ Message d'erreur</button>
              </div>
            </div>
            <ToastSouhaits config={config} toast={toastTest} />
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={sauvegarder} disabled={sauvegarde === 'saving' || !addonActif} style={{ backgroundColor: sauvegarde === 'success' ? THEME.success : sauvegarde === 'error' ? THEME.danger : THEME.accent, color: 'white', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: sauvegarde === 'saving' || !addonActif ? 'not-allowed' : 'pointer', opacity: sauvegarde === 'saving' || !addonActif ? 0.6 : 1 }}>
          {sauvegarde === 'saving' ? '⏳ Sauvegarde...' : sauvegarde === 'success' ? '✅ Sauvegardé !' : sauvegarde === 'error' ? '❌ Erreur' : '💾 Sauvegarder'}
        </button>
        <button onClick={reinitialiser} disabled={!personnalisee} style={{ backgroundColor: 'white', color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 600, cursor: personnalisee ? 'pointer' : 'not-allowed', opacity: personnalisee ? 1 : 0.5 }}>🔄 Revenir aux réglages par défaut</button>
        <button onClick={() => setOnglet('apercu')} style={{ backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>👁️ Aperçu</button>
      </div>
    </div>
  );
}