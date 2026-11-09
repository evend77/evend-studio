// CHEMIN : src/pages/gestionnaire/PwaGestionnaire.tsx
// e-Vend Studio — Add-on « App installable (PWA) » : le gestionnaire choisit le nom, les couleurs et l'icône de l'app de sa boutique,
// et voit combien de clients l'ont installée.
// API : /api/pwa-boutique/gestionnaire  (GET, POST, POST /icone, DELETE /icone)

import React, { useState, useEffect, useCallback, useRef } from 'react';

const T = { accent: '#2d6a9f', border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626', success: '#16a34a' };
const COULEUR_RE = /^#[0-9a-fA-F]{6}$/;

interface Periodes { jour: number; semaine: number; mois: number; annee: number; total: number }
interface Config {
  nom_boutique: string; nom_app: string; nom_court: string; couleur_theme: string; couleur_fond: string;
  icone_url: string | null; active: boolean;
  stats: { appareils: Periodes; installations: Periodes; plateformes: { plateforme: string; n: number }[] };
}

const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 16 };
const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14 };
const etiquette: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 };

export default function PwaGestionnaire(_props: { gestionnaireId?: number }) {
  const token = localStorage.getItem('token');
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

  const charger = useCallback(async () => {
    try {
      const r = await fetch('/api/pwa-boutique/gestionnaire', { credentials: 'include', headers: auth });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg({ type: 'err', texte: d.error || 'Chargement impossible' }); setChargement(false); return; }
      setCfg(d); setNomApp(d.nom_app || ''); setNomCourt(d.nom_court || ''); setTheme(d.couleur_theme); setFond(d.couleur_fond);
    } catch { setMsg({ type: 'err', texte: 'Erreur réseau' }); }
    setChargement(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { charger(); }, [charger]);

  const enregistrer = async () => {
    setMsg(null);
    if (!COULEUR_RE.test(theme) || !COULEUR_RE.test(fond)) { setMsg({ type: 'err', texte: 'Les couleurs doivent être au format #rrggbb (ex. #2d6a9f).' }); return; }
    setEnCours('save');
    try {
      const r = await fetch('/api/pwa-boutique/gestionnaire', {
        method: 'POST', credentials: 'include', headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom_app: nomApp, nom_court: nomCourt, couleur_theme: theme, couleur_fond: fond }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setMsg({ type: 'err', texte: d.error || 'Enregistrement impossible' });
      else { setMsg({ type: 'ok', texte: 'Enregistré.' }); await charger(); }
    } catch { setMsg({ type: 'err', texte: 'Erreur réseau' }); }
    setEnCours('');
  };

  const envoyerIcone = async (f: File | undefined) => {
    if (!f) return;
    setMsg(null); setEnCours('icone');
    try {
      const fd = new FormData(); fd.append('file', f);
      const r = await fetch('/api/pwa-boutique/gestionnaire/icone', { method: 'POST', credentials: 'include', headers: auth, body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setMsg({ type: 'err', texte: d.error || 'Envoi impossible' });
      else { setMsg({ type: 'ok', texte: 'Icône enregistrée. Votre boutique est maintenant installable.' }); await charger(); }
    } catch { setMsg({ type: 'err', texte: 'Erreur réseau' }); }
    if (fichier.current) fichier.current.value = '';
    setEnCours('');
  };

  const retirerIcone = async () => {
    if (!window.confirm("Retirer l'icône ? Votre boutique ne sera plus installable tant qu'il n'y en a pas une nouvelle.")) return;
    setMsg(null);
    try {
      const r = await fetch('/api/pwa-boutique/gestionnaire/icone', { method: 'DELETE', credentials: 'include', headers: auth });
      if (r.ok) { setMsg({ type: 'ok', texte: 'Icône retirée.' }); await charger(); } else setMsg({ type: 'err', texte: 'Impossible de retirer l\'icône' });
    } catch { setMsg({ type: 'err', texte: 'Erreur réseau' }); }
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
      <h2 style={{ margin: '0 0 6px' }}>📲 App installable (PWA)</h2>
      <p style={{ margin: '0 0 18px', color: T.light, fontSize: 14, lineHeight: 1.5 }}>
        Vos clients peuvent installer votre boutique sur leur téléphone, comme une vraie app. Choisissez le nom, les couleurs et l'icône.
        Le bouton « Installer l'app » apparaît automatiquement en bas de votre boutique, sur mobile.
      </p>

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
            <button type="button" disabled={enCours === 'icone'} onClick={() => fichier.current?.click()}
              style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>
              {enCours === 'icone' ? 'Envoi…' : cfg.icone_url ? "Changer l'icône" : "Téléverser l'icône"}
            </button>
            {cfg.icone_url && (
              <button type="button" onClick={retirerIcone}
                style={{ marginLeft: 8, background: '#fff', color: T.danger, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}>Retirer</button>
            )}
            <p style={{ margin: '10px 0 0', fontSize: 12, color: T.light, lineHeight: 1.5 }}>
              Image <b>PNG carrée</b>, au minimum <b>512 x 512</b> pixels (max 2 Mo). Sans icône, votre boutique n'est pas installable.
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
        <button type="button" disabled={enCours === 'save'} onClick={enregistrer}
          style={{ marginTop: 16, background: T.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>
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
    </div>
  );
}