// CHEMIN : src/components/BoutiquePersonnalisation.tsx
// e-Vend Studio — Add-on « Produits personnalisés » : bloc de la PAGE PRODUIT (templates boutique). Les champs viennent du serveur
// (GET /api/boutique/perso/:gid/produit/:pid, 404 = produit non personnalisable → rien ne s'affiche), avec l'aperçu recto/verso en direct.
// Le bouton « Ajouter au panier » du template appelle `reference.current.preparer()` : vérifie les champs requis, envoie les images, puis retourne les réponses
// à joindre à l'article. Le serveur revalide TOUT (champs, choix, fichiers, supplément) : ce bloc n'est qu'une aide à la saisie.

import React, { useEffect, useRef, useState } from 'react';
import ApercuPerso, { FacePerso, ValeurApercu } from './ApercuPerso';
import { envoyerFichierPerso } from '../pages/boutique/boutiqueAcheteurApi';

interface Option { id: string; libelle: string; supplement: number; hex?: string; photos?: Record<string, string> }
interface Champ { id: string; type: 'texte' | 'texte_long' | 'liste' | 'case' | 'image' | 'date' | 'nombre' | 'couleur'; libelle: string; aide?: string; obligatoire?: boolean; zone?: string | null; supplement?: number; options?: Option[]; polices?: string[]; couleurs?: string[]; min?: string | number; max?: string | number; entier?: boolean; si?: { champ: string; valeur: string } }
interface ConfigPerso { champs: Champ[]; faces: FacePerso[]; polices: Record<string, string> }
interface Val { valeur?: string | boolean; police?: string; couleur?: string; fichier?: File; apercu?: string; dx?: number; dy?: number; zoom?: number }
export interface PersoPrepare { ok: boolean; personnalisation?: Record<string, any>; erreur?: string }
export interface PersoRef { preparer: () => Promise<PersoPrepare> }
export interface ThemePerso { fond: string; texte: string; doux: string; bord: string }

const THEME_SOMBRE: ThemePerso = { fond: '#111', texte: '#fff', doux: '#888', bord: '#333' };
const TEXTUEL = ['texte', 'texte_long', 'date', 'nombre'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const dateLongue = (v: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v); return m ? `${Number(m[3]) === 1 ? '1er' : Number(m[3])} ${MOIS[Number(m[2]) - 1]} ${m[1]}` : ''; };
// Affichage conditionnel : un champ n'existe que si son champ de référence (placé avant lui) a la valeur demandée
const estVisible = (c: Champ, vs: Record<string, Val>, champs: Champ[]): boolean => {
  if (!c.si) return true;
  const ref = champs.find(x => x.id === c.si!.champ); if (!ref || !estVisible(ref, vs, champs)) return false;
  const v = vs[ref.id] || {};
  if (c.si.valeur === 'oui') return v.valeur === true;
  if (c.si.valeur === '*') return ref.type === 'image' ? !!v.fichier : (typeof v.valeur === 'string' && v.valeur.trim() !== '');
  return v.valeur === c.si.valeur;
};
const fmt = (n: number) => `${n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;

export default function BoutiquePersonnalisation({ gestionnaireId, produitId, couleur = '#c9a96e', theme = THEME_SOMBRE, reference, onChangement }: {
  gestionnaireId: number; produitId: number; couleur?: string; theme?: ThemePerso; reference: React.MutableRefObject<PersoRef | null>; onChangement?: (info: { actif: boolean; supplement: number }) => void;
}) {
  const [cfg, setCfg] = useState<ConfigPerso | null>(null);
  const [vals, setVals] = useState<Record<string, Val>>({});
  const [erreur, setErreur] = useState('');
  const valsRef = useRef(vals); valsRef.current = vals;
  const cfgRef = useRef(cfg); cfgRef.current = cfg;

  useEffect(() => {
    let vivant = true; setCfg(null); setVals({});
    fetch(`/api/boutique/perso/${gestionnaireId}/produit/${produitId}`).then(r => (r.ok ? r.json() : null)).then((c: ConfigPerso | null) => {
      if (!vivant) return;
      if (c && Array.isArray(c.champs) && c.champs.length) {
        setCfg(c);
        const init: Record<string, Val> = {};
        c.champs.forEach(ch => { if (TEXTUEL.includes(ch.type)) init[ch.id] = { valeur: '', police: (ch.polices || ['sans'])[0], couleur: (ch.couleurs || ['#000000'])[0] }; else if (ch.type === 'image') init[ch.id] = { dx: 0, dy: 0, zoom: 1 }; else if (ch.type === 'case') init[ch.id] = { valeur: false }; else init[ch.id] = { valeur: '' }; });
        setVals(init);
      } else if (onChangement) onChangement({ actif: false, supplement: 0 });
    }).catch(() => {});
    return () => { vivant = false; };
  }, [gestionnaireId, produitId]);

  // Libère les aperçus locaux d'images
  useEffect(() => () => { Object.values(valsRef.current).forEach(v => { if (v.apercu) URL.revokeObjectURL(v.apercu); }); }, []);

  const supplement = (() => {
    if (!cfg) return 0; let s = 0;
    for (const c of cfg.champs) {
      if (!estVisible(c, vals, cfg.champs)) continue;
      const v = vals[c.id] || {};
      if (TEXTUEL.includes(c.type) && typeof v.valeur === 'string' && v.valeur.trim()) s += c.supplement || 0;
      else if (c.type === 'case' && v.valeur === true) s += c.supplement || 0;
      else if (c.type === 'image' && v.fichier) s += c.supplement || 0;
      else if ((c.type === 'liste' || c.type === 'couleur') && v.valeur) { const o = (c.options || []).find(x => x.id === v.valeur); if (o) s += o.supplement || 0; }
    }
    return Math.round(s * 100) / 100;
  })();
  useEffect(() => { if (cfg && onChangement) onChangement({ actif: true, supplement }); }, [cfg, supplement]);

  const maj = (id: string, p: Partial<Val>) => setVals(prev => ({ ...prev, [id]: { ...prev[id], ...p } }));
  const choisirImage = (c: Champ, f: File | null) => {
    setErreur('');
    const ancien = valsRef.current[c.id]; if (ancien && ancien.apercu) URL.revokeObjectURL(ancien.apercu);
    if (!f) { maj(c.id, { fichier: undefined, apercu: undefined, dx: 0, dy: 0, zoom: 1 }); return; }
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { setErreur('Image JPEG, PNG ou WebP seulement.'); return; }
    if (f.size > 5 * 1024 * 1024) { setErreur('Image trop lourde (max 5 Mo).'); return; }
    maj(c.id, { fichier: f, apercu: URL.createObjectURL(f), dx: 0, dy: 0, zoom: 1 });
  };

  useEffect(() => {
    reference.current = {
      preparer: async () => {
        const c = cfgRef.current; if (!c) return { ok: true };
        const v = valsRef.current; const rep: Record<string, any> = {};
        for (const ch of c.champs) {
          if (!estVisible(ch, v, c.champs)) continue;
          const x = v[ch.id] || {};
          if (TEXTUEL.includes(ch.type)) {
            const t = typeof x.valeur === 'string' ? x.valeur.trim() : '';
            if (!t) { if (ch.obligatoire) return { ok: false, erreur: `Le champ « ${ch.libelle} » est requis.` }; continue; }
            rep[ch.id] = { valeur: t, police: x.police, couleur: x.couleur };
          } else if (ch.type === 'liste' || ch.type === 'couleur') {
            if (!x.valeur) { if (ch.obligatoire) return { ok: false, erreur: `Choisissez une option pour « ${ch.libelle} ».` }; continue; }
            rep[ch.id] = { valeur: x.valeur };
          } else if (ch.type === 'case') {
            if (x.valeur !== true) { if (ch.obligatoire) return { ok: false, erreur: `Veuillez cocher « ${ch.libelle} ».` }; continue; }
            rep[ch.id] = { valeur: true };
          } else if (ch.type === 'image') {
            if (!x.fichier) { if (ch.obligatoire) return { ok: false, erreur: `Ajoutez une image pour « ${ch.libelle} ».` }; continue; }
            const r = await envoyerFichierPerso(gestionnaireId, x.fichier);
            if (!r.ok) return { ok: false, erreur: (r.data && r.data.message) || "L'envoi de l'image a échoué." };
            rep[ch.id] = { fichier: r.data.id, dx: x.dx || 0, dy: x.dy || 0, zoom: x.zoom || 1 };
          }
        }
        return { ok: true, personnalisation: rep };
      },
    };
    return () => { reference.current = null; };
  }, [gestionnaireId, reference]);

  if (!cfg) return null;
  const visibles = cfg.champs.filter(c => estVisible(c, vals, cfg.champs));
  const valeursApercu: ValeurApercu[] = visibles.filter(c => c.zone).map(c => {
    const v = vals[c.id] || {};
    if (c.type === 'image') return { id: c.id, type: 'image', zone: c.zone, url: v.apercu, dx: v.dx, dy: v.dy, zoom: v.zoom };
    const brut = typeof v.valeur === 'string' ? v.valeur : '';
    return { id: c.id, type: c.type === 'date' || c.type === 'nombre' ? 'texte' : c.type, zone: c.zone, affichage: c.type === 'date' ? dateLongue(brut) : brut, police: v.police, couleur: v.couleur };
  });
  // Couleur du produit choisie → l'aperçu affiche la photo de cette couleur (face par face), sinon la photo de base
  const champCouleur = visibles.find(c => c.type === 'couleur'); const optCouleur = champCouleur ? (champCouleur.options || []).find(o => o.id === (vals[champCouleur.id] || {}).valeur) : null;
  const facesAffichees: FacePerso[] = optCouleur && optCouleur.photos ? cfg.faces.map(f => (optCouleur.photos![f.id] ? { ...f, photo_url: optCouleur.photos![f.id] } : f)) : cfg.faces;
  const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: `1px solid ${theme.bord}`, background: theme.fond, color: theme.texte, fontSize: 14, fontFamily: 'inherit' };
  const etiq: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: theme.doux, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 };
  const avecSup = (s?: number) => (s && s > 0 ? <span style={{ color: couleur, fontWeight: 700, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>+ {fmt(s)}</span> : null);

  return (
    <div style={{ border: `1px solid ${theme.bord}`, borderRadius: 12, padding: 16, marginBottom: 20, background: 'rgba(255,255,255,0.02)' }} data-perso="bloc">
      <div style={{ fontSize: 15, fontWeight: 800, color: theme.texte, marginBottom: 12 }}>🎨 Personnalisez votre produit</div>
      {cfg.faces.length > 0 && (
        <div style={{ marginBottom: 16, maxWidth: 420 }}>
          <ApercuPerso faces={facesAffichees} valeurs={valeursApercu} polices={cfg.polices} accent={couleur} texteOnglet={theme.texte} fondOnglet="transparent" />
          <div style={{ fontSize: 11, color: theme.doux, marginTop: 6 }}>Aperçu approximatif : le rendu final peut légèrement différer.</div>
        </div>
      )}
      {visibles.map(c => {
        const v = vals[c.id] || {};
        return (
          <div key={c.id} style={{ marginBottom: 16 }}>
            {c.type !== 'case' && <label style={etiq} htmlFor={`perso-${c.id}`}>{c.libelle}{c.obligatoire ? ' *' : ''}{c.type !== 'liste' && c.type !== 'couleur' && avecSup(c.supplement)}</label>}
            {c.type === 'date' && <input id={`perso-${c.id}`} type="date" value={(v.valeur as string) || ''} min={c.min ? String(c.min) : undefined} max={c.max ? String(c.max) : undefined} onChange={e => maj(c.id, { valeur: e.target.value })} style={{ ...champ, colorScheme: theme.fond === '#111' ? 'dark' : 'light' }} />}
            {c.type === 'nombre' && <input id={`perso-${c.id}`} type="number" inputMode="decimal" value={(v.valeur as string) || ''} min={Number(c.min)} max={Number(c.max)} step={c.entier === false ? 'any' : 1} onChange={e => maj(c.id, { valeur: e.target.value })} style={champ} />}
            {c.type === 'texte' && <input id={`perso-${c.id}`} value={(v.valeur as string) || ''} maxLength={Number(c.max) || 40} onChange={e => maj(c.id, { valeur: e.target.value })} style={champ} />}
            {c.type === 'texte_long' && <textarea id={`perso-${c.id}`} value={(v.valeur as string) || ''} maxLength={Number(c.max) || 300} rows={3} onChange={e => maj(c.id, { valeur: e.target.value })} style={{ ...champ, resize: 'vertical' }} />}
            {TEXTUEL.includes(c.type) && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                {(c.polices || []).length > 1 && (
                  <select aria-label="Police" value={v.police} onChange={e => maj(c.id, { police: e.target.value })} style={{ ...champ, width: 'auto', padding: '6px 10px', fontSize: 13 }}>
                    {(c.polices || []).map(k => <option key={k} value={k} style={{ fontFamily: cfg.polices[k] }}>{({ sans: 'Moderne', serif: 'Classique', mono: 'Machine à écrire', impact: 'Gras', script: 'Manuscrite', trebuchet: 'Arrondie', verdana: 'Large' } as Record<string, string>)[k] || k}</option>)}
                  </select>
                )}
                {(c.couleurs || []).length > 1 && (c.couleurs || []).map(h => (
                  <button key={h} type="button" aria-label={`Couleur ${h}`} onClick={() => maj(c.id, { couleur: h })}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: h, border: v.couleur === h ? `3px solid ${couleur}` : `2px solid ${theme.bord}`, cursor: 'pointer', padding: 0, outline: 'none' }} />
                ))}
                {(c.type === 'texte' || c.type === 'texte_long') && <span style={{ fontSize: 11, color: theme.doux, marginLeft: 'auto' }}>{((v.valeur as string) || '').length}/{c.max}</span>}
              </div>
            )}
            {c.type === 'liste' && (
              <select id={`perso-${c.id}`} value={(v.valeur as string) || ''} onChange={e => maj(c.id, { valeur: e.target.value })} style={champ}>
                <option value="">— Choisir —</option>
                {(c.options || []).map(o => <option key={o.id} value={o.id}>{o.libelle}{o.supplement > 0 ? ` (+ ${fmt(o.supplement)})` : ''}</option>)}
              </select>
            )}
            {c.type === 'couleur' && (
              <div role="radiogroup" aria-label={c.libelle} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {(c.options || []).map(o => (
                  <button key={o.id} type="button" role="radio" aria-checked={v.valeur === o.id} aria-label={o.libelle} title={`${o.libelle}${o.supplement > 0 ? ` (+ ${fmt(o.supplement)})` : ''}`} onClick={() => maj(c.id, { valeur: v.valeur === o.id && !c.obligatoire ? '' : o.id })}
                    style={{ width: 34, height: 34, borderRadius: '50%', background: o.hex || '#ccc', border: v.valeur === o.id ? `3px solid ${couleur}` : `2px solid ${theme.bord}`, boxShadow: v.valeur === o.id ? `0 0 0 2px ${theme.fond}` : 'none', cursor: 'pointer', padding: 0, outline: 'none' }} />
                ))}
                <span style={{ fontSize: 13, color: theme.texte }}>{(() => { const o = (c.options || []).find(x => x.id === v.valeur); return o ? <>{o.libelle}{avecSup(o.supplement)}</> : <span style={{ color: theme.doux }}>Choisissez une couleur</span>; })()}</span>
              </div>
            )}
            {c.type === 'case' && (
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, color: theme.texte, cursor: 'pointer' }}>
                <input type="checkbox" checked={v.valeur === true} onChange={e => maj(c.id, { valeur: e.target.checked })} style={{ accentColor: couleur }} />
                <span>{c.libelle}{c.obligatoire ? ' *' : ''}{avecSup(c.supplement)}</span>
              </label>
            )}
            {c.type === 'image' && (
              <div>
                <input id={`perso-${c.id}`} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => choisirImage(c, e.target.files && e.target.files[0] ? e.target.files[0] : null)} style={{ ...champ, padding: 8 }} />
                {v.fichier && c.zone && (
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8, fontSize: 12, color: theme.doux }}>
                    <label>Zoom <input type="range" min={0.5} max={3} step={0.05} value={v.zoom || 1} onChange={e => maj(c.id, { zoom: Number(e.target.value) })} /></label>
                    <label>← → <input type="range" min={-50} max={50} step={1} value={v.dx || 0} onChange={e => maj(c.id, { dx: Number(e.target.value) })} /></label>
                    <label>↑ ↓ <input type="range" min={-50} max={50} step={1} value={v.dy || 0} onChange={e => maj(c.id, { dy: Number(e.target.value) })} /></label>
                  </div>
                )}
                <div style={{ fontSize: 11, color: theme.doux, marginTop: 4 }}>JPEG, PNG ou WebP, 5 Mo maximum.</div>
              </div>
            )}
            {c.aide && <div style={{ fontSize: 12, color: theme.doux, marginTop: 6 }}>{c.aide}</div>}
          </div>
        );
      })}
      {supplement > 0 && <div style={{ fontSize: 14, fontWeight: 700, color: theme.texte, borderTop: `1px solid ${theme.bord}`, paddingTop: 10 }}>Supplément de personnalisation : <span style={{ color: couleur }}>+ {fmt(supplement)}</span> par article</div>}
      {erreur && <div role="alert" style={{ marginTop: 8, fontSize: 13, color: '#f87171' }}>{erreur}</div>}
    </div>
  );
}