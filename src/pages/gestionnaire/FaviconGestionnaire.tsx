// CHEMIN : src/pages/gestionnaire/FaviconGestionnaire.tsx
// e-Vend Studio — Add-on « Favicon personnalisé » : le gestionnaire téléverse la petite icône d'onglet de SA boutique.
// API : /api/favicon-boutique/gestionnaire  (GET, POST, DELETE)

import React, { useState, useEffect, useCallback, useRef } from 'react';

const URL_GUIDE = 'https://e-vendstudio.ca/documents/mv-favicon-perso-add-on';
const T = { accent: '#2d6a9f', border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626', success: '#16a34a' };
const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 16 };

export default function FaviconGestionnaire(_props: { gestionnaireId?: number }) {
  const token = localStorage.getItem('token');
  const auth: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const [url, setUrl] = useState<string | null>(null);
  const [min, setMin] = useState(192);
  const [max, setMax] = useState(1024);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null);
  const fichier = useRef<HTMLInputElement>(null);

  const charger = useCallback(async () => {
    try {
      const r = await fetch('/api/favicon-boutique/gestionnaire', { credentials: 'include', headers: auth });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg({ type: 'err', texte: d.error || 'Chargement impossible' }); }
      else { setUrl(d.favicon_url || null); if (d.min) setMin(d.min); if (d.max) setMax(d.max); }
    } catch { setMsg({ type: 'err', texte: 'Erreur réseau' }); }
    setChargement(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { charger(); }, [charger]);

  const envoyer = async (f: File | undefined) => {
    if (!f) return;
    setMsg(null); setEnCours(true);
    try {
      const fd = new FormData(); fd.append('file', f);
      const r = await fetch('/api/favicon-boutique/gestionnaire', { method: 'POST', credentials: 'include', headers: auth, body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setMsg({ type: 'err', texte: d.error || 'Envoi impossible' });
      else { setMsg({ type: 'ok', texte: 'Favicon enregistré. Il peut prendre quelques minutes à apparaître (videz le cache du navigateur si besoin).' }); await charger(); }
    } catch { setMsg({ type: 'err', texte: 'Erreur réseau' }); }
    if (fichier.current) fichier.current.value = '';
    setEnCours(false);
  };

  const retirer = async () => {
    if (!window.confirm('Retirer votre favicon ? Votre boutique reprendra celui de la plateforme.')) return;
    setMsg(null);
    try {
      const r = await fetch('/api/favicon-boutique/gestionnaire', { method: 'DELETE', credentials: 'include', headers: auth });
      if (r.ok) { setMsg({ type: 'ok', texte: 'Favicon retiré.' }); await charger(); } else setMsg({ type: 'err', texte: 'Impossible de le retirer' });
    } catch { setMsg({ type: 'err', texte: 'Erreur réseau' }); }
  };

  if (chargement) return <div style={{ padding: 24, color: T.light }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 20, color: T.text }}>
      <h2 style={{ margin: '0 0 6px' }}>🖼️ Favicon personnalisé <a href={URL_GUIDE} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: T.accent, textDecoration: 'none', border: `1px solid ${T.accent}`, borderRadius: 12, padding: '2px 10px', marginLeft: 10, verticalAlign: 'middle' }}>📖 Guide</a></h2>
      <p style={{ margin: '0 0 18px', color: T.light, fontSize: 14, lineHeight: 1.5 }}>
        Le favicon est la petite icône qu'on voit dans l'onglet du navigateur et dans les favoris. Mettez la vôtre sur votre boutique, au lieu de celle de la plateforme.
      </p>

      {msg && <div style={{ ...carte, padding: 12, borderColor: msg.type === 'ok' ? T.success : T.danger, color: msg.type === 'ok' ? T.success : T.danger, fontSize: 14 }}>{msg.texte}</div>}

      <div style={carte}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 96, height: 96, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.light, fontSize: 12, background: '#f9fafb' }}>
              {url ? <img src={url} alt="Favicon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : 'Aucun'}
            </div>
          </div>
          {url && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#e5e7eb', borderRadius: '10px 10px 0 0', padding: '8px 14px', fontSize: 12, color: T.text }}>
                <img src={url} alt="" style={{ width: 16, height: 16 }} /> Ma boutique
              </div>
              <div style={{ fontSize: 11, color: T.light, marginTop: 4 }}>Aperçu dans un onglet</div>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 220 }}>
            <input ref={fichier} type="file" accept="image/png" style={{ display: 'none' }} onChange={e => envoyer(e.target.files?.[0])} />
            <button type="button" disabled={enCours} onClick={() => fichier.current?.click()}
              style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>
              {enCours ? 'Envoi…' : url ? 'Changer le favicon' : 'Téléverser le favicon'}
            </button>
            {url && (
              <button type="button" onClick={retirer}
                style={{ marginLeft: 8, background: '#fff', color: T.danger, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}>Retirer</button>
            )}
            <p style={{ margin: '10px 0 0', fontSize: 12, color: T.light, lineHeight: 1.5 }}>
              Image <b>PNG carrée</b> entre <b>{min} x {min}</b> et <b>{max} x {max}</b> pixels (max 2 Mo). Choisissez un dessin simple : il sera affiché très petit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}