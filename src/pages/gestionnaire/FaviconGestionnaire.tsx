// CHEMIN : src/pages/gestionnaire/FaviconGestionnaire.tsx
// e-Vend Studio — Add-on « Favicon personnalisé » : le gestionnaire téléverse la petite icône d'onglet de SA boutique.
// + animation d'onglet (titre + favicon qui attirent le client qui a changé d'onglet) et compteur de retours.
// API : /api/favicon-boutique/gestionnaire  (GET, POST, DELETE) et /gestionnaire/animation (POST)

import React, { useState, useEffect, useCallback, useRef } from 'react';

const URL_GUIDE = 'https://e-vendstudio.ca/documents/mv-favicon-perso-add-on';
const T = { accent: '#2d6a9f', border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626', success: '#16a34a' };
interface Anim { actif: boolean; declencheur: 'inactif' | 'panier' | 'toujours'; style: 'clignotant' | 'machine'; emoji: string; messages: string[] }
interface Retours { jour: number; semaine: number; mois: number; total: number; total_avec_panier: number }
const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14 };
const etiquette: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 };
const EMOJIS = ['✨', '🛒', '🔥', '🎁', '⏰', '💛', '👋', '🛍️'];
const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 16 };

export default function FaviconGestionnaire(_props: { gestionnaireId?: number }) {
  const token = localStorage.getItem('token');
  const auth: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const [url, setUrl] = useState<string | null>(null);
  const [min, setMin] = useState(192);
  const [max, setMax] = useState(1024);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [anim, setAnim] = useState<Anim>({ actif: false, declencheur: 'inactif', style: 'clignotant', emoji: '✨', messages: ['Revenez, on vous attend ! 🛍️'] });
  const [retours, setRetours] = useState<Retours | null>(null);
  const [saveAnim, setSaveAnim] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null);
  const fichier = useRef<HTMLInputElement>(null);

  const charger = useCallback(async () => {
    try {
      const r = await fetch('/api/favicon-boutique/gestionnaire', { credentials: 'include', headers: auth });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg({ type: 'err', texte: d.error || 'Chargement impossible' }); }
      else {
        setUrl(d.favicon_url || null); if (d.min) setMin(d.min); if (d.max) setMax(d.max);
        if (d.animation) setAnim({ ...d.animation, emoji: d.animation.emoji || '✨', messages: d.animation.messages?.length ? d.animation.messages : [''] });
        if (d.retours) setRetours(d.retours);
      }
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

  const enregistrerAnim = async () => {
    setMsg(null);
    setSaveAnim(true);
    try {
      const r = await fetch('/api/favicon-boutique/gestionnaire/animation', {
        method: 'POST', credentials: 'include', headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: anim.actif, declencheur: anim.declencheur, style: anim.style, emoji: anim.emoji, messages: anim.messages.filter(m => m.trim()) }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setMsg({ type: 'err', texte: d.error || 'Enregistrement impossible' });
      else { setMsg({ type: 'ok', texte: anim.actif ? "Animation enregistrée et active. Pour la voir, ouvrez votre boutique puis changez d'onglet." : 'Animation enregistrée (désactivée).' }); await charger(); }
    } catch { setMsg({ type: 'err', texte: 'Erreur réseau' }); }
    setSaveAnim(false);
  };
  const majMessage = (i: number, v: string) => setAnim(a => ({ ...a, messages: a.messages.map((m, k) => (k === i ? v : m)) }));

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

      <div style={carte}>
        <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>✨ Animation d'onglet</h3>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: T.light, lineHeight: 1.5 }}>
          Quand un client quitte votre boutique pour un autre onglet, le titre de votre onglet et son icône s'animent pour le faire revenir. Rien ne s'affiche sur la page elle-même.
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 14 }}>
          <input type="checkbox" checked={anim.actif} onChange={e => setAnim(a => ({ ...a, actif: e.target.checked }))} style={{ width: 18, height: 18 }} />
          Activer l'animation d'onglet
        </label>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={etiquette}>Quand l'animation démarre</label>
            <select style={champ} value={anim.declencheur} onChange={e => setAnim(a => ({ ...a, declencheur: e.target.value as Anim['declencheur'] }))}>
              <option value="inactif">Quand le client change d'onglet</option>
              <option value="panier">Seulement s'il a des articles dans son panier</option>
              <option value="toujours">En permanence</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={etiquette}>Style du texte</label>
            <select style={champ} value={anim.style} onChange={e => setAnim(a => ({ ...a, style: e.target.value as Anim['style'] }))}>
              <option value="clignotant">Clignotant (le message alterne avec le titre normal)</option>
              <option value="machine">Machine à écrire (le message s'écrit lettre par lettre)</option>
            </select>
          </div>
        </div>

        <label style={etiquette}>Émoji du favicon (alterne avec votre favicon)</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          <input style={{ ...champ, width: 90, textAlign: 'center', fontSize: 20 }} value={anim.emoji} maxLength={8} onChange={e => setAnim(a => ({ ...a, emoji: e.target.value }))} />
          {EMOJIS.map(em => (
            <button key={em} type="button" onClick={() => setAnim(a => ({ ...a, emoji: em }))}
              style={{ border: `1px solid ${anim.emoji === em ? T.accent : T.border}`, background: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 18, cursor: 'pointer' }}>{em}</button>
          ))}
        </div>

        <label style={etiquette}>Messages affichés dans l'onglet (jusqu'à 5, 60 lettres max)</label>
        {anim.messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input style={champ} value={m} maxLength={60} placeholder="Ex. Votre panier vous attend 🛒" onChange={e => majMessage(i, e.target.value)} />
            {anim.messages.length > 1 && (
              <button type="button" onClick={() => setAnim(a => ({ ...a, messages: a.messages.filter((_, k) => k !== i) }))}
                style={{ border: `1px solid ${T.border}`, background: '#fff', color: T.danger, borderRadius: 8, padding: '0 12px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
            )}
          </div>
        ))}
        {anim.messages.length < 5 && (
          <button type="button" onClick={() => setAnim(a => ({ ...a, messages: [...a.messages, ''] }))}
            style={{ border: `1px dashed ${T.border}`, background: '#fff', color: T.accent, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ Ajouter un message</button>
        )}
        <p style={{ margin: '10px 0 0', fontSize: 12, color: T.light, lineHeight: 1.5 }}>
          Astuce : écrivez <code style={{ background: '#f3f4f6', padding: '1px 6px', borderRadius: 4 }}>{'{n}'}</code> pour afficher le nombre d'articles du panier du client. Ex. : « {'{n}'} article(s) vous attendent 🛒 ».
        </p>

        {anim.messages.some(m => m.trim()) && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: T.light, marginBottom: 4 }}>Aperçu (onglet en animation)</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#e5e7eb', borderRadius: '10px 10px 0 0', padding: '8px 14px', fontSize: 12, color: T.text, maxWidth: '100%' }}>
              <span style={{ fontSize: 14 }}>{anim.emoji || '✨'}</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(anim.messages.find(m => m.trim()) || '').replace(/\{n\}/g, '2')}</span>
            </div>
          </div>
        )}

        <button type="button" disabled={saveAnim} onClick={enregistrerAnim}
          style={{ display: 'block', marginTop: 16, background: T.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>
          {saveAnim ? 'Enregistrement…' : "Enregistrer l'animation"}
        </button>
        <p style={{ margin: '10px 0 0', fontSize: 12, color: T.light }}>Si le client a demandé moins d'animations sur son appareil, l'animation ne s'affiche pas chez lui.</p>
      </div>

      {retours && (
        <div style={carte}>
          <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Clients revenus grâce à l'animation</h3>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: T.light }}>Chaque fois qu'un client revient sur votre onglet après avoir vu l'animation pendant plus de 2 secondes.</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[['Aujourd\'hui', retours.jour], ['Semaine', retours.semaine], ['Mois', retours.mois], ['Total', retours.total], ['Dont avec un panier', retours.total_avec_panier]].map(([t, n]) => (
              <div key={String(t)} style={{ flex: '1 1 120px', background: '#f3f4f6', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{n as number}</div>
                <div style={{ fontSize: 12, color: T.light }}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}