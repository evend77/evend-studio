// CHEMIN : src/pages/gestionnaire/BoutiquePopupAnnonce.tsx
// e-Vend Studio — Configuration de l'add-on « Popup Annonce » (templates boutique solo). Adapté de ConfigPopupAnnonce.tsx (MV), sans y toucher.
// Mêmes 3 onglets (Contenu, Apparence, Comportement) + aperçu en direct. Adapté : API /api/boutique/gestionnaire/popup, aucun popup du navigateur (BoutiqueModale),
// pas de prix codé en dur, lien « Guide » pris dans le catalogue des add-ons, dates converties en heure locale du gestionnaire.

import { useState, useEffect, type CSSProperties } from 'react';
import { bq, messageErreur } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

interface Cfg {
  actif: boolean; type_affichage: string; titre: string; message: string; bouton_label: string; bouton_url: string; bouton_actif: boolean;
  couleur_fond: string; couleur_texte: string; couleur_bouton: string; delai_secondes: number; fermeture_auto: boolean; fermeture_auto_secondes: number;
  se_souvenir_heures: number; icone: string; date_debut: string; date_fin: string;
}
const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', green: '#10b981', red: '#ef4444' };
const TYPES = [
  { id: 'popup', label: 'Popup centré', desc: "Fenêtre au centre de l'écran avec fond flouté", icone: '🪟' },
  { id: 'banniere_haut', label: 'Bannière en haut', desc: 'Barre au-dessus du menu du site (elle défile avec la page)', icone: '⬆️' },
  { id: 'banniere_bas', label: 'Bannière en bas', desc: "Barre fixe en bas de l'écran", icone: '⬇️' },
];
const ICONES = ['📢', '🎉', '⚠️', '🔥', '💥', '🎁', '✨', '📅', '🚨', '💡', '🛍️', '❄️', '🌟', '🏷️', '⏰'];
const THEMES = [
  { label: 'Nuit', fond: '#1a1a2e', texte: '#ffffff', bouton: '#e63946' }, { label: 'Urgence', fond: '#dc2626', texte: '#ffffff', bouton: '#111111' },
  { label: 'Succès', fond: '#166534', texte: '#ffffff', bouton: '#22c55e' }, { label: 'Info', fond: '#1e40af', texte: '#ffffff', bouton: '#3b82f6' },
  { label: 'Doré', fond: '#1a1a1a', texte: '#c9a96e', bouton: '#c9a96e' }, { label: 'Clair', fond: '#ffffff', texte: '#1a1a2e', bouton: '#2563eb' },
];
const VIDE: Cfg = { actif: true, type_affichage: 'popup', titre: 'Annonce importante', message: 'Profitez de notre offre spéciale limitée dans le temps !', bouton_label: 'En savoir plus', bouton_url: '',
  bouton_actif: true, couleur_fond: '#1a1a2e', couleur_texte: '#ffffff', couleur_bouton: '#e63946', delai_secondes: 2, fermeture_auto: false, fermeture_auto_secondes: 10, se_souvenir_heures: 24, icone: '📢', date_debut: '', date_fin: '' };

const p2 = (n: number) => String(n).padStart(2, '0');
// ISO du serveur → valeur d'un champ « datetime-local » (heure locale) ; et l'inverse
const versChamp = (iso: any) => { if (!iso) return ''; const d = new Date(iso); return isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`; };
const versIso = (v: string) => { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d.toISOString(); };

export default function BoutiquePopupAnnonce({ accent, isMobile: mobileProp }: { gestionnaireId: number; accent?: string; isMobile?: boolean }) {
  const couleur = accent || '#4f46e5';
  const isMobile = !!mobileProp;
  const [cfg, setCfg] = useState<Cfg>(VIDE);
  const [onglet, setOnglet] = useState<'contenu' | 'apparence' | 'comportement'>('contenu');
  const [existe, setExiste] = useState(true);
  const [chargement, setChargement] = useState(true);
  const [inactif, setInactif] = useState(false);
  const [erreurCharg, setErreurCharg] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [guide, setGuide] = useState('');
  const [modale, setModale] = useState<null | { type: 'erreur' | 'succes'; message: string }>(null);

  useEffect(() => {
    (async () => {
      const [c, a] = await Promise.all([bq('/popup'), bq('/addons')]);
      if (c.status === 403 && c.data && c.data.addon_inactif) { setInactif(true); setChargement(false); return; }
      if (!c.ok) { setErreurCharg(messageErreur(c)); setChargement(false); return; }
      const x = c.data.config || {};
      setCfg({ ...VIDE, ...x, bouton_url: x.bouton_url || '', date_debut: versChamp(x.date_debut), date_fin: versChamp(x.date_fin) });
      setExiste(!!c.data.existe);
      if (a.ok && Array.isArray(a.data.addons)) { const g = a.data.addons.find((y: any) => y.code === 'popup_annonce'); if (g && g.guide_url) setGuide(g.guide_url); }
      setChargement(false);
    })();
  }, []);

  const set = (k: keyof Cfg, v: any) => setCfg(p => ({ ...p, [k]: v }));

  const sauvegarder = async () => {
    setEnCours(true);
    const corps = { ...cfg, bouton_url: cfg.bouton_url.trim(), date_debut: versIso(cfg.date_debut), date_fin: versIso(cfg.date_fin) };
    const r = await bq('/popup', { method: 'PUT', body: corps });
    setEnCours(false);
    if (!r.ok) { setModale({ type: 'erreur', message: messageErreur(r) }); return; }
    setExiste(true);
    setModale({ type: 'succes', message: cfg.actif ? 'Annonce enregistrée. Elle est visible sur votre site selon les réglages choisis.' : "Annonce enregistrée, mais elle est éteinte : elle n'est pas affichée sur votre site." });
  };

  const carte: CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 14, padding: isMobile ? 14 : '20px 24px' };
  const champ: CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: T.text, background: '#fff' };
  const lib: CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: T.light, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' };
  const btn = (on?: boolean): CSSProperties => ({ padding: '8px 16px', border: `2px solid ${on ? couleur : T.border}`, background: on ? couleur : '#fff', color: on ? '#fff' : T.text, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' });
  const h3: CSSProperties = { fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 12px' };
  const Choix = ({ k, valeurs, fmt }: { k: keyof Cfg; valeurs: number[]; fmt: (n: number) => string }) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>{valeurs.map(v => <button key={v} style={btn(cfg[k] === v)} onClick={() => set(k, v)}>{fmt(v)}</button>)}</div>
  );
  const Interrupteur = ({ k, nom, aide }: { k: keyof Cfg; nom: string; aide?: string }) => (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', padding: '8px 0' }}>
      <input type="checkbox" checked={!!cfg[k]} onChange={e => set(k, e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, accentColor: couleur }} />
      <span><span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{nom}</span>{aide && <span style={{ display: 'block', fontSize: 12, color: T.light }}>{aide}</span>}</span>
    </label>
  );

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>;
  if (inactif) return <div style={{ ...carte, margin: 20 }}><h2 style={{ marginTop: 0 }}>📢 Popup Annonce</h2><p style={{ color: T.light }}>Cet add-on n'est pas activé. Activez-le dans « 📊 Mon plan & limites » pour configurer votre annonce.</p></div>;
  if (erreurCharg) return <div style={{ ...carte, margin: 20 }}><p style={{ color: T.red }}>{erreurCharg}</p></div>;

  const { couleur_fond: cf, couleur_texte: ct, couleur_bouton: cb } = cfg;
  const apercu = cfg.type_affichage !== 'popup' ? (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}`, background: '#f3f4f6', height: 120, display: 'flex', alignItems: cfg.type_affichage === 'banniere_haut' ? 'flex-start' : 'flex-end' }}>
      <div style={{ width: '100%', background: cf, color: ct, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14 }}>{cfg.icone}</span><strong style={{ fontSize: 11 }}>{cfg.titre || 'Titre'}</strong>
        <span style={{ fontSize: 10, opacity: 0.85 }}>{(cfg.message || '').slice(0, 40)}{cfg.message.length > 40 ? '…' : ''}</span>
        {cfg.bouton_actif && <span style={{ background: cb, color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{cfg.bouton_label || 'Bouton'}</span>}
        <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✕</span>
      </div>
    </div>
  ) : (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}`, background: 'rgba(0,0,0,0.5)', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div style={{ background: cf, borderRadius: 12, padding: '16px 20px', width: '100%', maxWidth: 240, textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 6, right: 8, fontSize: 12, color: ct, opacity: 0.6 }}>✕</div>
        <div style={{ fontSize: 28, marginBottom: 6 }}>{cfg.icone}</div>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: ct, margin: '0 0 6px' }}>{cfg.titre || 'Titre'}</h3>
        <p style={{ fontSize: 10, color: ct, opacity: 0.8, margin: '0 0 10px', lineHeight: 1.5 }}>{(cfg.message || '').slice(0, 60)}{cfg.message.length > 60 ? '…' : ''}</p>
        {cfg.bouton_actif && <div style={{ background: cb, color: '#fff', padding: '7px 14px', borderRadius: 8, fontSize: 10, fontWeight: 800 }}>{cfg.bouton_label || 'Bouton'}</div>}
        <div style={{ fontSize: 10, color: ct, opacity: 0.4, marginTop: 6 }}>Non merci, fermer</div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 980, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#e63946,#c1121f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📢</div>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 22, color: T.text }}>Popup Annonce
            {guide && <a href={guide} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: couleur, textDecoration: 'none', border: `1px solid ${couleur}`, borderRadius: 12, padding: '2px 10px', marginLeft: 10, verticalAlign: 'middle' }}>📖 Guide</a>}
          </h2>
          <p style={{ fontSize: 13, color: T.light, margin: 0 }}>Affichez une annonce, une promo ou un événement sur votre boutique</p>
        </div>
      </div>

      {!existe && <div style={{ ...carte, marginBottom: 14, background: '#fffbeb', borderColor: '#fde68a', fontSize: 13, color: '#92400e' }}>Aucune annonce enregistrée pour l'instant : rien ne s'affiche sur votre site tant que vous n'avez pas cliqué sur « Enregistrer ».</div>}
      <div style={{ ...carte, marginBottom: 14, padding: isMobile ? 12 : 16, borderColor: cfg.actif ? T.green : T.border }}>
        <Interrupteur k="actif" nom={cfg.actif ? 'Annonce allumée' : 'Annonce éteinte (invisible pour les visiteurs)'} aide="Cliquez sur « Enregistrer » pour appliquer." />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 24, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', gap: 4, background: '#f9fafb', borderRadius: 12, padding: 4, marginBottom: 16, border: `1px solid ${T.border}` }}>
            {([['contenu', '✏️ Contenu'], ['apparence', '🎨 Apparence'], ['comportement', '⚙️ Comportement']] as ['contenu' | 'apparence' | 'comportement', string][]).map(([id, nom]) => (
              <button key={id} onClick={() => setOnglet(id)} style={{ flex: 1, padding: '10px 6px', border: 'none', borderRadius: 9, background: onglet === id ? '#fff' : 'transparent', color: onglet === id ? T.text : T.light, fontSize: 13, fontWeight: onglet === id ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', boxShadow: onglet === id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>{nom}</button>
            ))}
          </div>

          {onglet === 'contenu' && (
            <div style={carte}>
              <h3 style={h3}>Type d'affichage</h3>
              <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
                {TYPES.map(t => (
                  <div key={t.id} role="button" tabIndex={0} onClick={() => set('type_affichage', t.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') set('type_affichage', t.id); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `2px solid ${cfg.type_affichage === t.id ? couleur : T.border}`, borderRadius: 10, cursor: 'pointer', background: cfg.type_affichage === t.id ? '#f5f5ff' : '#fafafa' }}>
                    <span style={{ fontSize: 20 }}>{t.icone}</span>
                    <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>{t.label}</p><p style={{ margin: 0, fontSize: 11, color: T.light }}>{t.desc}</p></div>
                    <span style={{ color: couleur, fontWeight: 800 }}>{cfg.type_affichage === t.id ? '✓' : ''}</span>
                  </div>
                ))}
              </div>
              <h3 style={h3}>Icône</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {ICONES.map(ic => <button key={ic} aria-label={`Icône ${ic}`} onClick={() => set('icone', ic)} style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${cfg.icone === ic ? couleur : T.border}`, background: cfg.icone === ic ? '#f5f5ff' : '#fafafa', fontSize: 20, cursor: 'pointer' }}>{ic}</button>)}
              </div>
              <div style={{ marginBottom: 16 }}><label style={lib}>Titre</label><input style={champ} maxLength={200} value={cfg.titre} onChange={e => set('titre', e.target.value)} placeholder="Annonce importante" /></div>
              <div style={{ marginBottom: 16 }}><label style={lib}>Message</label><textarea style={{ ...champ, minHeight: 80, resize: 'vertical' }} maxLength={1000} value={cfg.message} onChange={e => set('message', e.target.value)} placeholder="Profitez de notre offre spéciale…" /></div>
              <div style={{ background: '#f9fafb', border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px' }}>
                <Interrupteur k="bouton_actif" nom="Afficher un bouton" />
                {cfg.bouton_actif && (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginTop: 6 }}>
                    <div><label style={lib}>Texte du bouton</label><input style={champ} maxLength={100} value={cfg.bouton_label} onChange={e => set('bouton_label', e.target.value)} placeholder="En savoir plus" /></div>
                    <div><label style={lib}>Adresse du bouton</label><input style={champ} value={cfg.bouton_url} onChange={e => set('bouton_url', e.target.value)} placeholder="https://…" />
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>Doit commencer par https://. Laissez vide : le bouton ferme simplement l'annonce.</p></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {onglet === 'apparence' && (
            <div style={carte}>
              <h3 style={h3}>Couleurs</h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
                {([['Fond', 'couleur_fond'], ['Texte', 'couleur_texte'], ['Bouton', 'couleur_bouton']] as [string, keyof Cfg][]).map(([nom, k]) => (
                  <div key={k}><label style={lib}>{nom}</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input type="color" aria-label={nom} value={/^#[0-9a-fA-F]{6}$/.test(String(cfg[k])) ? String(cfg[k]) : '#000000'} onChange={e => set(k, e.target.value)} style={{ width: 44, height: 36, border: `1px solid ${T.border}`, borderRadius: 8, padding: 2, background: '#fff' }} />
                      <span style={{ fontSize: 12, color: T.text, fontFamily: 'monospace' }}>{String(cfg[k])}</span>
                    </div>
                  </div>
                ))}
              </div>
              <h3 style={h3}>Thèmes rapides</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: 8 }}>
                {THEMES.map(t => (
                  <button key={t.label} onClick={() => setCfg(p => ({ ...p, couleur_fond: t.fond, couleur_texte: t.texte, couleur_bouton: t.bouton }))} style={{ borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${T.border}`, padding: 0, background: '#fafafa', fontFamily: 'inherit' }}>
                    <div style={{ height: 32, background: t.fond, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 20, height: 8, borderRadius: 4, background: t.bouton }} /></div>
                    <div style={{ padding: 4, fontSize: 11, fontWeight: 700, color: T.text }}>{t.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {onglet === 'comportement' && (
            <div style={carte}>
              <h3 style={h3}>Délai d'apparition</h3>
              <Choix k="delai_secondes" valeurs={[0, 2, 5, 10, 30]} fmt={d => (d === 0 ? 'Immédiat' : `${d}s`)} />
              <Interrupteur k="fermeture_auto" nom="Fermeture automatique" aide="L'annonce se ferme toute seule après quelques secondes" />
              {cfg.fermeture_auto && <div style={{ marginTop: 8 }}><Choix k="fermeture_auto_secondes" valeurs={[5, 10, 15, 30]} fmt={d => `${d}s`} /></div>}
              <h3 style={{ ...h3, marginTop: 8 }}>Ne pas réafficher pendant</h3>
              <Choix k="se_souvenir_heures" valeurs={[1, 6, 24, 72, 168]} fmt={h => (h === 1 ? '1h' : h === 6 ? '6h' : h === 24 ? '1 jour' : h === 72 ? '3 jours' : '1 sem.')} />
              <p style={{ fontSize: 12, color: T.light, margin: '-8px 0 20px' }}>Si vous modifiez l'annonce, elle se réaffiche même aux visiteurs qui avaient fermé l'ancienne.</p>
              <h3 style={h3}>Période d'affichage (facultatif)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                <div><label style={lib}>Date de début</label><input type="datetime-local" style={champ} value={cfg.date_debut} onChange={e => set('date_debut', e.target.value)} /><p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>Vide = tout de suite</p></div>
                <div><label style={lib}>Date de fin</label><input type="datetime-local" style={champ} value={cfg.date_fin} onChange={e => set('date_fin', e.target.value)} /><p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>Vide = sans limite</p></div>
              </div>
            </div>
          )}

          <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 20, paddingTop: 20 }}>
            <button onClick={sauvegarder} disabled={enCours} style={{ padding: '12px 28px', background: couleur, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: enCours ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: enCours ? 0.6 : 1 }}>{enCours ? '⏳ Enregistrement…' : '💾 Enregistrer'}</button>
          </div>
        </div>

        <div style={{ position: isMobile ? 'static' : 'sticky', top: 24 }}>
          <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 16, border: '1px solid #333', marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px', textAlign: 'center' }}>Aperçu</p>
            {apercu}
            <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', margin: '10px 0 0' }}>Mis à jour en direct</p>
          </div>
          <div style={{ background: '#f9fafb', border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: T.text, margin: '0 0 8px' }}>ℹ️ À propos</p>
            {["✅ S'affiche sur votre boutique", '✅ 3 formats : popup, bannière haut/bas', '✅ Délai et fermeture automatique', '✅ Ne se réaffiche pas après fermeture', '✅ Dates de début / fin'].map((i, k) => <p key={k} style={{ fontSize: 12, color: '#4b5563', margin: '0 0 4px' }}>{i}</p>)}
          </div>
        </div>
      </div>

      {modale && <BoutiqueModale type={modale.type} message={modale.message} accent={couleur} onFermer={() => setModale(null)} />}
    </div>
  );
}