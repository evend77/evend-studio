// CHEMIN : src/pages/gestionnaire/BoutiquePwa.tsx
// e-Vend Studio — Add-on « App installable (PWA) » (boutique solo) : le gestionnaire choisit le nom, les couleurs et l'icône de l'app de sa boutique,
// et voit combien de clients l'ont installée.
// API : /api/boutique/gestionnaire/pwa  (GET, POST, POST /icone, DELETE /icone) — aucun lien avec le MV.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { bq, BQ, messageErreur } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

const T = { accent: '#2d6a9f', border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626', success: '#16a34a' };
const COULEUR_RE = /^#[0-9a-fA-F]{6}$/;

interface Periodes { jour: number; semaine: number; mois: number; annee: number; total: number }
interface Config {
  addon_actif?: boolean; min?: number; max?: number;
  nom_boutique: string; nom_app: string; nom_court: string; couleur_theme: string; couleur_fond: string;
  icone_url: string | null; active: boolean;
  stats: { appareils: Periodes; installations: Periodes; plateformes: { plateforme: string; n: number }[] };
}

const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 16 };
const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14 };
const etiquette: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 };

export default function BoutiquePwa({ accent, pagePlan, naviguerVers }: { gestionnaireId?: number; accent?: string; isMobile?: boolean; pagePlan?: string; naviguerVers?: (page: string) => void }) {
  let token: string | null = null; try { token = localStorage.getItem('token'); } catch (e) { token = null; }
  const auth: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const [cfg, setCfg] = useState<Config | null>(null);
  const [chargement, setChargement] = useState(true);
  const [nomApp, setNomApp] = useState('');
  const [nomCourt, setNomCourt] = useState('');
  const [theme, setTheme] = useState('#2d6a9f');
  const [fond, setFond] = useState('#ffffff');
  const [enCours, setEnCours] = useState<'' | 'save' | 'icone'>('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null);
  const fichier = useRef<HTMLInputElement>(null);
  const [guide, setGuide] = useState('');
  const [confirmerRetrait, setConfirmerRetrait] = useState(false);

  const charger = useCallback(async () => {
    const [r, a] = await Promise.all([bq('/pwa'), bq('/addons')]);
    if (!r.ok) { setMsg({ type: 'err', texte: messageErreur(r) }); }
    else { const d = r.data; setCfg(d); setNomApp(d.nom_app || ''); setNomCourt(d.nom_court || ''); setTheme(d.couleur_theme); setFond(d.couleur_fond); }
    if (a.ok && a.data && Array.isArray(a.data.addons)) { const g = a.data.addons.find((y: any) => y.code === 'pwa_boutique'); if (g && g.guide_url) setGuide(g.guide_url); }
    setChargement(false);
  }, []);
  useEffect(() => { charger(); }, [charger]);

  const enregistrer = async () => {
    setMsg(null);
    if (!COULEUR_RE.test(theme) || !COULEUR_RE.test(fond)) { setMsg({ type: 'err', texte: 'Les couleurs doivent être au format #rrggbb (ex. #2d6a9f).' }); return; }
    setEnCours('save');
    const r = await bq('/pwa', { method: 'POST', body: { nom_app: nomApp, nom_court: nomCourt, couleur_theme: theme, couleur_fond: fond } });
    if (!r.ok) setMsg({ type: 'err', texte: messageErreur(r) });
    else { setMsg({ type: 'ok', texte: 'Enregistré.' }); await charger(); }
    setEnCours('');
  };

  const envoyerIcone = async (f: File | undefined) => {
    if (!f) return;
    setMsg(null); setEnCours('icone');
    try {
      const fd = new FormData(); fd.append('file', f);
      const r = await fetch(`${BQ}/pwa/icone`, { method: 'POST', credentials: 'include', headers: auth, body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setMsg({ type: 'err', texte: d.error || 'Envoi impossible' });
      else { setMsg({ type: 'ok', texte: 'Icône enregistrée. Votre boutique est maintenant installable.' }); await charger(); }
    } catch { setMsg({ type: 'err', texte: 'Erreur réseau' }); }
    if (fichier.current) fichier.current.value = '';
    setEnCours('');
  };

  const retirerIcone = async () => {
    setConfirmerRetrait(false); setMsg(null);
    const r = await bq('/pwa/icone', { method: 'DELETE' });
    if (r.ok) { setMsg({ type: 'ok', texte: 'Icône retirée.' }); await charger(); } else setMsg({ type: 'err', texte: messageErreur(r) });
  };

  if (chargement) return <div style={{ padding: 24, color: T.light }}>Chargement…</div>;
  if (!cfg) return <div style={{ padding: 24, color: T.danger }}>{msg?.texte || 'Erreur'}</div>;

  const st = cfg.stats;
  const ligne = (nom: string, p: Periodes) => (
    <tr key={nom}>
      <td style={{ padding: '8px 10px', fontWeight: 700 }}>{nom}</td>
      {[p.jour, p.semaine, p.mois, p.annee, p.total].map((n, i) => <td key={i} style={{ padding: '8px 10px', textAlign: 'center' }}>{n}</td>)}
    </tr>
  );

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 20, color: T.text }}>
      <h2 style={{ margin: '0 0 6px' }}>📲 App installable (PWA) {guide && <a href={guide} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: T.accent, textDecoration: 'none', border: `1px solid ${T.accent}`, borderRadius: 12, padding: '2px 10px', marginLeft: 10, verticalAlign: 'middle' }}>📖 Guide</a>}</h2>
      <p style={{ margin: '0 0 18px', color: T.light, fontSize: 14, lineHeight: 1.5 }}>
        Vos clients peuvent installer votre boutique sur leur téléphone, comme une vraie app. Choisissez le nom, les couleurs et l'icône.
        Le bouton « Installer l'app » apparaît automatiquement en bas de votre boutique, sur mobile (boutique Premium).
      </p>

      {cfg.addon_actif === false && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: 10, padding: '12px 16px', fontSize: 13, marginBottom: 16 }}>
          🔒 L'add-on <strong>App installable (PWA)</strong> n'est pas activé : vous pouvez regarder les réglages, mais l'envoi et l'enregistrement sont désactivés. Activez-le dans <strong>Mon plan &amp; limites</strong>.
          {pagePlan && naviguerVers && <button type="button" onClick={() => naviguerVers(pagePlan)} style={{ marginLeft: 10, border: '1px solid #fdba74', background: '#fff', color: '#9a3412', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Voir « Mon plan &amp; limites »</button>}
        </div>
      )}
      {msg && (
        <div style={{ ...carte, padding: 12, borderColor: msg.type === 'ok' ? T.success : T.danger, color: msg.type === 'ok' ? T.success : T.danger, fontSize: 14 }}>{msg.texte}</div>
      )}

      <div style={carte}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Icône de l'app</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 96, height: 96, borderRadius: 22, background: fond, border: `1px solid ${T.border}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.light, fontSize: 12, textAlign: 'center' }}>
            {cfg.icone_url ? <img src={cfg.icone_url} alt="Icône" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'Aucune icône'}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <input ref={fichier} type="file" accept="image/png" style={{ display: 'none' }} onChange={e => envoyerIcone(e.target.files?.[0])} />
            <button type="button" disabled={enCours === 'icone' || cfg.addon_actif === false} onClick={() => fichier.current?.click()}
              style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 700, cursor: cfg.addon_actif === false ? 'not-allowed' : 'pointer', opacity: cfg.addon_actif === false ? 0.5 : 1 }}>
              {enCours === 'icone' ? 'Envoi…' : cfg.icone_url ? "Changer l'icône" : "Téléverser l'icône"}
            </button>
            {cfg.icone_url && (
              <button type="button" onClick={() => setConfirmerRetrait(true)}
                style={{ marginLeft: 8, background: '#fff', color: T.danger, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}>Retirer</button>
            )}
            <p style={{ margin: '10px 0 0', fontSize: 12, color: T.light, lineHeight: 1.5 }}>
              Image <b>PNG carrée</b>, entre <b>{cfg.min || 512} x {cfg.min || 512}</b> et <b>{cfg.max || 2048} x {cfg.max || 2048}</b> pixels (max 2 Mo). Sans icône, votre boutique n'est pas installable.
            </p>
          </div>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 13, fontWeight: 700, color: cfg.active ? T.success : T.light }}>
          {cfg.active ? '✓ Votre boutique est installable.' : "Pas encore active : téléversez une icône."}
        </p>
      </div>

      <div style={carte}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Nom et couleurs</h3>
        <label style={etiquette}>Nom de l'app</label>
        <input style={champ} value={nomApp} maxLength={45} placeholder={cfg.nom_boutique} onChange={e => setNomApp(e.target.value)} />
        <div style={{ height: 12 }} />
        <label style={etiquette}>Nom court (sous l'icône, 12 lettres max)</label>
        <input style={champ} value={nomCourt} maxLength={12} placeholder={(cfg.nom_boutique || '').slice(0, 12)} onChange={e => setNomCourt(e.target.value)} />
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={etiquette}>Couleur du haut de l'app</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="color" value={COULEUR_RE.test(theme) ? theme : '#2d6a9f'} onChange={e => setTheme(e.target.value)} style={{ width: 48, height: 40, border: 'none', background: 'none' }} />
              <input style={champ} value={theme} maxLength={7} onChange={e => setTheme(e.target.value)} />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={etiquette}>Couleur de l'écran de démarrage</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="color" value={COULEUR_RE.test(fond) ? fond : '#ffffff'} onChange={e => setFond(e.target.value)} style={{ width: 48, height: 40, border: 'none', background: 'none' }} />
              <input style={champ} value={fond} maxLength={7} onChange={e => setFond(e.target.value)} />
            </div>
          </div>
        </div>
        <button type="button" disabled={enCours === 'save' || cfg.addon_actif === false} onClick={enregistrer}
          style={{ marginTop: 16, background: T.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: cfg.addon_actif === false ? 'not-allowed' : 'pointer', opacity: cfg.addon_actif === false ? 0.5 : 1 }}>
          {enCours === 'save' ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <p style={{ margin: '10px 0 0', fontSize: 12, color: T.light }}>Les changements peuvent prendre quelques minutes à apparaître sur les téléphones.</p>
      </div>

      <div style={carte}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Installations</h3>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: T.light }}>« Appareils » = chaque téléphone compté une seule fois. « Installations » inclut les réinstallations.</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                {['', "Aujourd'hui", 'Semaine', 'Mois', 'Année', 'Total'].map((t, i) => <th key={i} style={{ padding: '8px 10px', textAlign: i ? 'center' : 'left', fontSize: 12, color: T.light }}>{t}</th>)}
              </tr>
            </thead>
            <tbody>{ligne('Appareils', st.appareils)}{ligne('Installations', st.installations)}</tbody>
          </table>
        </div>
        {st.plateformes.length > 0 && (
          <p style={{ margin: '12px 0 0', fontSize: 13, color: T.light }}>
            {st.plateformes.map(p => `${p.plateforme === 'ios' ? 'iPhone' : p.plateforme === 'android' ? 'Android' : p.plateforme === 'desktop' ? 'Ordinateur' : 'Autre'} : ${p.n}`).join('  ·  ')}
          </p>
        )}
      </div>
      {confirmerRetrait && <BoutiqueModale type="confirmer" accent={accent} titre="Retirer l'icône ?" message="Votre boutique ne sera plus installable tant qu'il n'y a pas une nouvelle icône." texteConfirmer="Retirer" onConfirmer={retirerIcone} onFermer={() => setConfirmerRetrait(false)} />}
    </div>
  );
}