// CHEMIN : src/pages/gestionnaire/EffetsBoutiqueGestionnaire.tsx
// e-Vend Studio — Add-on « Effets de boutique » : le gestionnaire choisit une saison (neige, traîneau, Halloween…),
// des effets de vente (Vendredi noir, rubans, drapeaux…) et une musique de fond pour SA boutique MV.
// API : /api/effets-boutique/gestionnaire  (GET, POST) — tout s'enregistre automatiquement.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { THEMES_SAISONNIERS, EFFETS_VENTE, EffetsConfigMap, EffetSaisonnier } from '../../templates/multivendeur/effetsCatalogue';
import { DecorationOverlayPublique } from '../../templates/multivendeur/EffetsBoutique';

const URL_GUIDE = 'https://e-vendstudio.ca/documents/mv-effets-de-boutique-add-on';
const T = { accent: '#2d6a9f', vert: '#537373', orange: '#e77817', border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626' };
const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 16 };
const titreCarte: React.CSSProperties = { fontSize: 15, fontWeight: 800, color: T.text, margin: '0 0 4px' };
const aide: React.CSSProperties = { fontSize: 12, color: T.light, margin: '0 0 14px' };

type Musique = { id: string; nom: string; categorie: string; emoji: string; url: string };
const LABELS_STYLE: Record<string, string> = {
  fixe: 'Fixe (allumée en continu)', scintillement: 'Scintillement', chenillard: 'Chenillard', vague: 'Vague',
};

function Bascule({ actif, onChange }: { actif: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} role="switch" aria-checked={actif}
      style={{ width: 48, height: 26, borderRadius: 13, background: actif ? T.vert : '#ccc', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
      <div style={{ position: 'absolute', top: 3, left: actif ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.3)', transition: 'left .2s' }} />
    </div>
  );
}

function Curseur({ label, valeur, unite, min, max, pas = 1, onChange, aideBas }:
  { label: string; valeur: number; unite?: string; min: number; max: number; pas?: number; onChange: (v: number) => void; aideBas?: [string, string] }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.light, marginBottom: 2 }}>
        <span>{label}</span><span>{valeur}{unite || ''}</span>
      </div>
      <input type="range" min={min} max={max} step={pas} value={valeur} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: T.vert }} />
      {aideBas && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af' }}><span>{aideBas[0]}</span><span>{aideBas[1]}</span></div>}
    </div>
  );
}

export default function EffetsBoutiqueGestionnaire(_props: { gestionnaireId?: number }) {
  const token = localStorage.getItem('token');
  const auth: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [statut, setStatut] = useState<'' | 'envoi' | 'ok' | 'err'>('');
  const [apercu, setApercu] = useState(true);

  const [saison, setSaison] = useState<string | null>(null);
  const [effets, setEffets] = useState<string[]>([]);
  const [effetsConfig, setEffetsConfig] = useState<EffetsConfigMap>({});
  const [venteEffets, setVenteEffets] = useState<string[]>([]);
  const [venteConfig, setVenteConfig] = useState<EffetsConfigMap>({});
  const [musique, setMusique] = useState<string | null>(null);
  const [volume, setVolume] = useState(45);
  const [boucle, setBoucle] = useState(true);
  const [musiques, setMusiques] = useState<Musique[]>([]);
  const [ongletMusique, setOngletMusique] = useState<string | null>(null);

  const pret = useRef(false);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Chargement ──
  useEffect(() => {
    let actif = true;
    fetch('/api/effets-boutique/gestionnaire', { credentials: 'include', headers: auth })
      .then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'Chargement impossible'); return d; })
      .then((d) => {
        if (!actif) return;
        const c = d.config || {};
        setSaison(c.saison && THEMES_SAISONNIERS[c.saison] ? c.saison : null);
        setEffets(Array.isArray(c.effets) ? c.effets : []);
        setEffetsConfig(c.effetsConfig || {});
        setVenteEffets(Array.isArray(c.venteEffets) ? c.venteEffets : []);
        setVenteConfig(c.venteEffetsConfig || {});
        setMusique(c.musique || null);
        setVolume(typeof c.musiqueConfig?.volume === 'number' ? c.musiqueConfig.volume : 45);
        setBoucle(c.musiqueConfig?.boucle !== false);
        setMusiques(Array.isArray(d.musiques) ? d.musiques : []);
      })
      .catch((e) => actif && setErreur(e.message))
      .finally(() => { if (actif) setChargement(false); });
    return () => { actif = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Enregistrement automatique (0,7 s après le dernier changement) ──
  const enregistrer = useCallback(() => {
    setStatut('envoi');
    fetch('/api/effets-boutique/gestionnaire', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ saison, effets, effetsConfig, venteEffets, venteEffetsConfig: venteConfig, musique, musiqueConfig: { volume, boucle } }),
    })
      .then(async (r) => { if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'Erreur'); } setStatut('ok'); setTimeout(() => setStatut(''), 1800); })
      .catch((e) => { setStatut('err'); setErreur(e.message); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saison, effets, effetsConfig, venteEffets, venteConfig, musique, volume, boucle]);

  useEffect(() => {
    if (!pret.current) return;
    setErreur(null);
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(enregistrer, 700);
    return () => { if (minuterie.current) clearTimeout(minuterie.current); };
  }, [enregistrer]);

  // Les changements ne sont enregistrés qu'APRÈS le chargement initial (déclaré après l'effet ci-dessus : il passe en premier).
  useEffect(() => { if (!chargement) pret.current = true; }, [chargement]);

  // ── Actions ──
  const choisirSaison = (id: string | null) => { if (id === saison) return; setSaison(id); setEffets([]); };
  const basculer = (liste: string[], set: (l: string[]) => void, id: string) => set(liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id]);
  const regler = (cfg: EffetsConfigMap, set: (c: EffetsConfigMap) => void, id: string, champ: string, valeur: any) =>
    set({ ...cfg, [id]: { ...cfg[id], [champ]: valeur } });

  // ── Carte d'un effet (saison ou vente) ──
  const carteEffet = (e: EffetSaisonnier, actif: boolean, onToggle: () => void, cfg: EffetsConfigMap, set: (c: EffetsConfigMap) => void) => {
    const c: any = cfg[e.id] || {};
    const reglages = actif && (e.tailleDefaut != null || e.nombreDefaut != null || e.vitesseDefaut != null || e.couleursDefaut != null ||
      e.stylesAnimationDisponibles != null || e.texteDefaut != null || e.couleurTexteDefaut != null || e.drapeauxDisponibles != null);
    return (
      <div key={e.id} style={{ padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: 8, background: '#fafbfb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span style={{ fontSize: 20 }}>{e.emoji}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{e.nom}</div>
              <div style={{ fontSize: 11, color: T.light }}>{e.description}</div>
            </div>
          </div>
          <Bascule actif={actif} onChange={onToggle} />
        </div>
        {reglages && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${T.border}` }}>
            {e.texteDefaut != null && (
              <div>
                <div style={{ fontSize: 11, color: T.light, marginBottom: 2 }}>Texte affiché (français, anglais, ce que vous voulez)</div>
                <input type="text" maxLength={40} value={c.texte ?? e.texteDefaut} onChange={(ev) => regler(cfg, set, e.id, 'texte', ev.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13 }} />
              </div>
            )}
            {e.couleurTexteDefaut != null && (
              <div>
                <div style={{ fontSize: 11, color: T.light, marginBottom: 2 }}>Couleur</div>
                <input type="color" value={c.couleur ?? e.couleurTexteDefaut} onChange={(ev) => regler(cfg, set, e.id, 'couleur', ev.target.value)}
                  style={{ width: 36, height: 28, padding: 0, border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer' }} />
              </div>
            )}
            {e.drapeauxDisponibles != null && (
              <div>
                <div style={{ fontSize: 11, color: T.light, marginBottom: 4 }}>Drapeaux à faire tomber</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {e.drapeauxDisponibles.map((d) => {
                    const sel: string[] = c.drapeaux ?? [e.drapeauxDisponibles![0].id];
                    const on = sel.includes(d.id);
                    return (
                      <button key={d.id} type="button"
                        onClick={() => { const n = on ? sel.filter((x) => x !== d.id) : [...sel, d.id]; regler(cfg, set, e.id, 'drapeaux', n.length ? n : sel); }}
                        style={{ padding: '4px 10px', borderRadius: 14, fontSize: 12, cursor: 'pointer', border: `1px solid ${on ? T.vert : T.border}`, background: on ? '#f0f5f5' : '#fff', color: T.text }}>
                        {on ? '✓ ' : ''}{d.nom}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {e.tailleDefaut != null && <Curseur label="Taille" unite="px" min={e.tailleMin!} max={e.tailleMax!} valeur={c.taille ?? e.tailleDefaut} onChange={(v) => regler(cfg, set, e.id, 'taille', v)} />}
            {e.nombreDefaut != null && <Curseur label="Nombre" min={e.nombreMin!} max={e.nombreMax!} valeur={c.nombre ?? e.nombreDefaut} onChange={(v) => regler(cfg, set, e.id, 'nombre', v)} />}
            {e.vitesseDefaut != null && <Curseur label="Vitesse (secondes — plus petit = plus rapide)" unite="s" min={e.vitesseMin!} max={e.vitesseMax!} valeur={c.vitesse ?? e.vitesseDefaut} onChange={(v) => regler(cfg, set, e.id, 'vitesse', v)} aideBas={['Rapide', 'Lent']} />}
            {e.vitesseRotationDefaut != null && <Curseur label="Vitesse de rotation" unite="s" pas={0.5} min={e.vitesseRotationMin!} max={e.vitesseRotationMax!} valeur={c.vitesseRotation ?? e.vitesseRotationDefaut} onChange={(v) => regler(cfg, set, e.id, 'vitesseRotation', v)} />}
            {e.couleursDefaut != null && (
              <div>
                <div style={{ fontSize: 11, color: T.light, marginBottom: 4 }}>Couleurs des ampoules</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(c.couleurs ?? e.couleursDefaut).map((col: string, i: number) => (
                    <input key={i} type="color" value={col}
                      onChange={(ev) => { const n = [...(c.couleurs ?? e.couleursDefaut!)]; n[i] = ev.target.value; regler(cfg, set, e.id, 'couleurs', n); }}
                      style={{ width: 28, height: 28, padding: 0, border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
            )}
            {e.stylesAnimationDisponibles != null && (
              <div>
                <div style={{ fontSize: 11, color: T.light, marginBottom: 2 }}>Style d'animation</div>
                <select value={c.styleAnimation ?? e.stylesAnimationDisponibles[0]} onChange={(ev) => regler(cfg, set, e.id, 'styleAnimation', ev.target.value)}
                  style={{ width: '100%', padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
                  {e.stylesAnimationDisponibles.map((s) => <option key={s} value={s}>{LABELS_STYLE[s] ?? s}</option>)}
                </select>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (chargement) return <div style={{ padding: 24, color: T.light }}>Chargement…</div>;

  const categories = Array.from(new Set(musiques.map((m) => m.categorie)));
  const onglet = ongletMusique && categories.includes(ongletMusique) ? ongletMusique : (categories[0] || null);
  const pistes = musiques.filter((m) => m.categorie === onglet);
  const th = saison ? THEMES_SAISONNIERS[saison] : null;

  return (
    <div style={{ padding: 24, maxWidth: 820 }}>
      {/* Aperçu en direct : calque décoratif sur cette page (sans clic), même rendu que la boutique */}
      {apercu && (
        <DecorationOverlayPublique saison={saison} effets={effets} effetsConfig={effetsConfig}
          venteEffets={venteEffets} venteEffetsConfig={venteConfig} topOffset={60} />
      )}

      <h2 style={{ margin: '0 0 6px' }}>🎃 Effets de boutique <a href={URL_GUIDE} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: T.accent, textDecoration: 'none', border: `1px solid ${T.accent}`, borderRadius: 12, padding: '2px 10px', marginLeft: 10, verticalAlign: 'middle' }}>📖 Guide</a></h2>
      <p style={{ ...aide, marginBottom: 12 }}>
        Faites vivre toute votre boutique selon la saison ou une vente. Vos changements s'enregistrent tout seuls et s'appliquent à l'ensemble de la boutique (collaborateurs inclus).
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
        <label style={{ fontSize: 13, color: T.text, cursor: 'pointer' }}>
          <input type="checkbox" checked={apercu} onChange={(e) => setApercu(e.target.checked)} style={{ marginRight: 6 }} />
          Voir l'aperçu sur cette page
        </label>
        <span style={{ fontSize: 12, fontWeight: 700, color: statut === 'err' ? T.danger : T.vert }}>
          {statut === 'envoi' ? 'Enregistrement…' : statut === 'ok' ? '✓ Enregistré' : ''}
        </span>
      </div>
      {erreur && <div style={{ background: '#fdecea', border: '1px solid #f5c6cb', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 13, color: '#c0392b' }}>⚠️ {erreur}</div>}

      {/* ── Saison ── */}
      <div style={carte}>
        <p style={titreCarte}>🎃 Thèmes saisonniers</p>
        <p style={aide}>Un seul thème à la fois. Cochez ensuite les effets que vous voulez (2 ou 3 suffisent pour un beau résultat).</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: th ? 16 : 0 }}>
          <div onClick={() => choisirSaison(null)} style={{ borderRadius: 10, border: `2px solid ${saison === null ? T.vert : T.border}`, padding: '14px 12px', textAlign: 'center', cursor: 'pointer', background: saison === null ? '#f0f5f5' : '#fff' }}>
            <div style={{ fontSize: 24 }}>🚫</div><div style={{ fontSize: 12, fontWeight: 700 }}>Aucun</div>
          </div>
          {Object.values(THEMES_SAISONNIERS).map((s) => (
            <div key={s.id} onClick={() => choisirSaison(s.id)} style={{ borderRadius: 10, border: `2px solid ${saison === s.id ? T.orange : T.border}`, padding: '14px 12px', textAlign: 'center', cursor: 'pointer', background: saison === s.id ? '#fff3e8' : '#fff' }}>
              <div style={{ fontSize: 24 }}>{s.emoji}</div><div style={{ fontSize: 12, fontWeight: 700 }}>{s.nom}</div>
              {saison === s.id && <div style={{ fontSize: 11, color: T.orange }}>✓ Actif</div>}
            </div>
          ))}
        </div>
        {th && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase', letterSpacing: .5, margin: '0 0 10px' }}>Effets — {th.nom}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {th.effets.map((e) => carteEffet(e, effets.includes(e.id), () => basculer(effets, setEffets, e.id), effetsConfig, setEffetsConfig))}
            </div>
          </div>
        )}
      </div>

      {/* ── Vente ── */}
      <div style={carte}>
        <p style={titreCarte}>🏷️ Effets de vente</p>
        <p style={aide}>Indépendants de la saison : vous pouvez avoir de la neige et un « Vendredi noir » en même temps.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {EFFETS_VENTE.map((e) => carteEffet(e, venteEffets.includes(e.id), () => basculer(venteEffets, setVenteEffets, e.id), venteConfig, setVenteConfig))}
        </div>
      </div>

      {/* ── Musique ── */}
      <div style={carte}>
        <p style={titreCarte}>🎵 Musique de fond</p>
        <p style={aide}>
          Les navigateurs interdisent de lancer du son tout seul : la musique démarre en sourdine, et le son s'active au premier clic du visiteur ou avec le bouton 🔇 en bas à gauche.
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: `2px solid ${musique === null ? T.vert : T.border}`, borderRadius: 8, cursor: 'pointer', marginBottom: 10, background: musique === null ? '#f0f5f5' : '#fff' }}>
          <input type="radio" name="musique" checked={musique === null} onChange={() => setMusique(null)} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Aucune musique</span>
        </label>
        {musiques.length === 0 ? (
          <p style={{ fontSize: 12, color: T.light, fontStyle: 'italic' }}>Aucune musique disponible pour l'instant.</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {categories.map((cat) => (
                <button key={cat} type="button" onClick={() => setOngletMusique(cat)}
                  style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 999, cursor: 'pointer', border: `1px solid ${onglet === cat ? T.accent : T.border}`, background: onglet === cat ? T.accent : '#fff', color: onglet === cat ? '#fff' : T.text }}>
                  {cat}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pistes.map((p) => (
                <div key={p.id} style={{ padding: '8px 10px', border: `2px solid ${musique === p.id ? T.vert : T.border}`, borderRadius: 8, background: musique === p.id ? '#f0f5f5' : '#fff' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 6 }}>
                    <input type="radio" name="musique" checked={musique === p.id} onChange={() => setMusique(p.id)} />
                    <span style={{ fontSize: 18 }}>{p.emoji}</span><span style={{ fontSize: 13, fontWeight: 700 }}>{p.nom}</span>
                  </label>
                  <audio controls preload="none" src={p.url} style={{ width: '100%', height: 32 }} />
                </div>
              ))}
            </div>
          </>
        )}
        {musique && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Curseur label="Volume" unite="%" min={0} max={100} valeur={volume} onChange={setVolume} />
            <label style={{ fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={boucle} onChange={(e) => setBoucle(e.target.checked)} style={{ marginRight: 6 }} />
              Rejouer en boucle
            </label>
          </div>
        )}
      </div>
    </div>
  );
}