// CHEMIN : src/pages/gestionnaire/BoutiquePerso.tsx
// e-Vend Studio — Add-on « Produits personnalisés » (boutique solo). Le gestionnaire choisit un produit, ajoute les champs que l'acheteur remplit (texte, liste, case, image),
// un supplément de prix facultatif, et trace sur la photo vierge les zones où l'aperçu placera le texte et les images (recto, verso…).
// API : /api/boutique/gestionnaire/perso (etat, produit/:id GET PUT DELETE) ; photos de faces : /api/boutique/gestionnaire/upload.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { bq, BQ, messageErreur } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';
import ApercuPerso, { FacePerso, ZonePerso, ValeurApercu, PILES_POLICES } from '../../components/ApercuPerso';

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', ok: '#16a34a', warn: '#b45309', danger: '#dc2626' };
type TypeChamp = 'texte' | 'texte_long' | 'liste' | 'case' | 'image' | 'date' | 'nombre' | 'couleur';
const TEXTUEL: TypeChamp[] = ['texte', 'texte_long', 'date', 'nombre'];
interface Option { id: string; libelle: string; supplement: number; hex?: string; photos?: Record<string, string> }
interface Champ { id: string; type: TypeChamp; libelle: string; aide: string; obligatoire: boolean; max?: number | string; min?: number | string; entier?: boolean; si?: { champ: string; valeur: string } | null; zone?: string | null; supplement?: number; options?: Option[]; polices?: string[]; couleurs?: string[] }
interface Config { actif: boolean; champs: Champ[]; faces: FacePerso[] }
interface ProduitLigne { id: number; titre: string; photo_principale: string | null; statut: string; perso_actif: boolean | null; nb_champs: number }
interface Police { cle: string; nom: string; pile: string }

const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 16 };
const champCss: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase', marginBottom: 5 };
const uid = () => Math.random().toString(36).slice(2, 8);
const LIBELLE_TYPE: Record<TypeChamp, string> = { texte: 'Texte court', texte_long: 'Texte long', liste: 'Liste de choix', case: 'Case à cocher', image: 'Image (logo, photo)', date: 'Date', nombre: 'Nombre', couleur: 'Couleur du produit' };
// Une condition ne peut viser qu'un champ placé AVANT (et un choix qui existe encore) : sinon elle est retirée
const nettoyerSi = (champs: Champ[]): Champ[] => champs.map((c, i) => {
  if (!c.si) return c;
  const j = champs.findIndex(x => x.id === c.si!.champ); const ref = champs[j];
  if (!ref || j >= i) return { ...c, si: null };
  if ((ref.type === 'liste' || ref.type === 'couleur') && !(ref.options || []).some(o => o.id === c.si!.valeur)) return { ...c, si: null };
  return c;
});
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

export default function BoutiquePerso({ accent, isMobile, pagePlan, naviguerVers }: { gestionnaireId?: number; accent?: string; isMobile?: boolean; pagePlan?: string; naviguerVers?: (page: string) => void }) {
  const couleur = accent || '#2d6a9f';
  const [actif, setActif] = useState<boolean | null>(null);
  const [produits, setProduits] = useState<ProduitLigne[]>([]);
  const [polices, setPolices] = useState<Police[]>([]);
  const [guide, setGuide] = useState('');
  const [recherche, setRecherche] = useState('');
  const [prod, setProd] = useState<ProduitLigne | null>(null);
  const [cfg, setCfg] = useState<Config | null>(null);
  const [existe, setExiste] = useState(false);
  const [faceId, setFaceId] = useState('');
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [occupe, setOccupe] = useState('');
  const [modifie, setModifie] = useState(false);
  const [modale, setModale] = useState<{ type: 'erreur' | 'succes' | 'confirmer'; message: string; titre?: string; action?: () => void; texte?: string } | null>(null);
  const cfgRef = useRef<Config | null>(null); cfgRef.current = cfg;
  const faceRef = useRef(''); faceRef.current = faceId;

  const charger = useCallback(async () => {
    const r = await bq('/perso/etat');
    if (!r.ok) { setModale({ type: 'erreur', message: messageErreur(r) }); return; }
    setActif(r.data.addon_actif); setProduits(r.data.produits || []); setPolices(r.data.polices || []);
  }, []);
  useEffect(() => {
    charger();
    bq('/addons').then(a => { if (a.ok && a.data && Array.isArray(a.data.addons)) { const g = a.data.addons.find((y: any) => y.code === 'personnalisation'); if (g && g.guide_url) setGuide(g.guide_url); } });
  }, [charger]);

  const ouvrir = async (p: ProduitLigne) => {
    const r = await bq(`/perso/produit/${p.id}`);
    if (!r.ok) { setModale({ type: 'erreur', message: messageErreur(r) }); return; }
    setProd(p); setCfg(r.data.config); setExiste(!!r.data.existe); setFaceId(r.data.config.faces[0] ? r.data.config.faces[0].id : ''); setZoneId(null); setModifie(false);
  };
  const fermerEditeur = () => { if (modifie) { setModale({ type: 'confirmer', titre: 'Quitter sans enregistrer ?', message: 'Vos changements non enregistrés seront perdus.', texte: 'Quitter', action: () => { setProd(null); setCfg(null); } }); } else { setProd(null); setCfg(null); } };
  const maj = (f: (c: Config) => Config) => { setCfg(prev => { if (!prev) return prev; const n = f(prev); return { ...n, champs: nettoyerSi(n.champs) }; }); setModifie(true); };

  const enregistrer = async () => {
    if (!prod || !cfg) return;
    setOccupe('save');
    const r = await bq(`/perso/produit/${prod.id}`, { method: 'PUT', body: cfg });
    setOccupe('');
    if (!r.ok) { setModale({ type: 'erreur', message: messageErreur(r) }); return; }
    setCfg(r.data.config); setExiste(true); setModifie(false); setModale({ type: 'succes', message: 'Personnalisation enregistrée.' }); await charger();
  };
  const supprimerConfig = () => {
    if (!prod) return;
    setModale({ type: 'confirmer', titre: 'Retirer la personnalisation ?', message: 'Les champs et les zones de ce produit seront supprimés. Les commandes déjà passées ne changent pas.', texte: 'Retirer', action: async () => {
      setOccupe('del'); const r = await bq(`/perso/produit/${prod.id}`, { method: 'DELETE' }); setOccupe('');
      if (!r.ok) { setModale({ type: 'erreur', message: messageErreur(r) }); return; }
      setProd(null); setCfg(null); await charger();
    } });
  };

  // ── Faces et zones ──
  const televerser = async (f: File): Promise<string | null> => {
    const fd = new FormData(); fd.append('file', f);
    let t: string | null = null; try { t = localStorage.getItem('token'); } catch (e) { t = null; }
    try {
      const r = await fetch(`${BQ}/upload`, { method: 'POST', body: fd, credentials: 'include', headers: t ? { Authorization: `Bearer ${t}` } : {} });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.url) { setModale({ type: 'erreur', message: j.error || "L'envoi de la photo a échoué." }); return null; }
      return j.url as string;
    } catch (e) { setModale({ type: 'erreur', message: 'Erreur réseau. Vérifiez votre connexion.' }); return null; }
  };
  const ajouterFace = () => {
    if (!cfg || cfg.faces.length >= 4) return;
    const f: FacePerso = { id: uid(), nom: cfg.faces.length === 0 ? 'Recto' : cfg.faces.length === 1 ? 'Verso' : `Face ${cfg.faces.length + 1}`, photo_url: '', zones: [] };
    maj(c => ({ ...c, faces: [...c.faces, f] })); setFaceId(f.id); setZoneId(null);
  };
  const majFace = (id: string, p: Partial<FacePerso>) => maj(c => ({ ...c, faces: c.faces.map(f => (f.id === id ? { ...f, ...p } : f)) }));
  const retirerFace = (id: string) => {
    maj(c => { const f = c.faces.find(x => x.id === id); const zs = new Set(f ? f.zones.map(z => z.id) : []); return { ...c, faces: c.faces.filter(x => x.id !== id), champs: c.champs.map(ch => (ch.zone && zs.has(ch.zone) ? { ...ch, zone: null } : ch)) }; });
    setFaceId(prev => (prev === id ? (cfg && cfg.faces.find(f => f.id !== id) ? cfg.faces.find(f => f.id !== id)!.id : '') : prev)); setZoneId(null);
  };
  const majZone = (fid: string, zid: string, p: Partial<ZonePerso>) => maj(c => ({ ...c, faces: c.faces.map(f => (f.id === fid ? { ...f, zones: f.zones.map(z => (z.id === zid ? { ...z, ...p } : z)) } : f)) }));
  const retirerZone = (fid: string, zid: string) => { maj(c => ({ ...c, faces: c.faces.map(f => (f.id === fid ? { ...f, zones: f.zones.filter(z => z.id !== zid) } : f)), champs: c.champs.map(ch => (ch.zone === zid ? { ...ch, zone: null } : ch)) })); setZoneId(null); };

  // Dessiner (glisser sur une zone vide) ou déplacer (glisser sur une zone existante) — tout en pourcentages de la photo
  const surPhoto = (e: React.PointerEvent<HTMLDivElement>, face: FacePerso) => {
    const r = e.currentTarget.getBoundingClientRect(); if (!r.width || !r.height) return;
    const pos = (ev: { clientX: number; clientY: number }) => ({ x: clamp(((ev.clientX - r.left) / r.width) * 100, 0, 100), y: clamp(((ev.clientY - r.top) / r.height) * 100, 0, 100) });
    const p0 = pos(e);
    const touche = [...face.zones].reverse().find(z => p0.x >= z.x && p0.x <= z.x + z.w && p0.y >= z.y && p0.y <= z.y + z.h);
    e.preventDefault();
    if (touche) {
      setZoneId(touche.id); const dx = p0.x - touche.x, dy = p0.y - touche.y;
      const mv = (ev: PointerEvent) => { const p = pos(ev); majZone(face.id, touche.id, { x: Math.round(clamp(p.x - dx, 0, 100 - touche.w) * 10) / 10, y: Math.round(clamp(p.y - dy, 0, 100 - touche.h) * 10) / 10 }); };
      const fin = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', fin); };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', fin); return;
    }
    if (face.zones.length >= 6) { setModale({ type: 'erreur', message: 'Maximum 6 zones par face.' }); return; }
    let p1 = p0;
    const mv = (ev: PointerEvent) => { p1 = pos(ev); };
    const fin = () => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', fin);
      const x = Math.min(p0.x, p1.x), y = Math.min(p0.y, p1.y), w = Math.abs(p1.x - p0.x), h = Math.abs(p1.y - p0.y);
      if (w < 3 || h < 3) { setZoneId(null); return; }
      const z: ZonePerso = { id: uid(), nom: `Zone ${face.zones.length + 1}`, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10, forme: 'rect' };
      setCfg(prev => (prev ? { ...prev, faces: prev.faces.map(f => (f.id === face.id ? { ...f, zones: [...f.zones, z] } : f)) } : prev)); setModifie(true); setZoneId(z.id);
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', fin);
  };

  // Photo du produit dans une couleur donnée, pour une face
  const photoCouleur = (champId: string, optId: string, faceId: string, url: string | null) => maj(c => ({ ...c, champs: c.champs.map(ch => ch.id !== champId ? ch : { ...ch, options: (ch.options || []).map(o => { if (o.id !== optId) return o; const ph = { ...(o.photos || {}) }; if (url) ph[faceId] = url; else delete ph[faceId]; return { ...o, photos: ph }; }) }) }));
  // ── Champs ──
  const ajouterChamp = (type: TypeChamp) => {
    if (!cfg || cfg.champs.length >= 12) return;
    const base: Champ = { id: uid(), type, libelle: LIBELLE_TYPE[type], aide: '', obligatoire: false, zone: null, supplement: 0 };
    if (type === 'texte') Object.assign(base, { max: 40, polices: ['sans'], couleurs: ['#000000', '#ffffff'], libelle: 'Texte à imprimer' });
    if (type === 'texte_long') Object.assign(base, { max: 200, polices: ['sans'], couleurs: ['#000000', '#ffffff'], libelle: 'Message' });
    if (type === 'liste') Object.assign(base, { libelle: 'Taille', options: [{ id: uid(), libelle: 'Petit', supplement: 0 }, { id: uid(), libelle: 'Grand', supplement: 0 }] });
    if (type === 'date') Object.assign(base, { libelle: 'Date', min: '', max: '', polices: ['sans'], couleurs: ['#000000', '#ffffff'] });
    if (type === 'nombre') Object.assign(base, { libelle: 'Numéro', min: 0, max: 99, entier: true, polices: ['sans'], couleurs: ['#000000', '#ffffff'] });
    if (type === 'couleur') Object.assign(base, { libelle: 'Couleur du produit', options: [{ id: uid(), libelle: 'Noir', hex: '#000000', supplement: 0, photos: {} }, { id: uid(), libelle: 'Blanc', hex: '#ffffff', supplement: 0, photos: {} }] });
    if (type === 'case') base.libelle = 'Emballage cadeau';
    if (type === 'image') base.libelle = 'Votre logo';
    maj(c => ({ ...c, champs: [...c.champs, base] }));
  };
  const majChamp = (id: string, p: Partial<Champ>) => maj(c => ({ ...c, champs: c.champs.map(x => (x.id === id ? { ...x, ...p } : x)) }));
  const deplacer = (id: string, d: number) => maj(c => { const i = c.champs.findIndex(x => x.id === id), j = i + d; if (i < 0 || j < 0 || j >= c.champs.length) return c; const a = [...c.champs]; [a[i], a[j]] = [a[j], a[i]]; return { ...c, champs: a }; });
  const retirerChamp = (id: string) => maj(c => ({ ...c, champs: c.champs.filter(x => x.id !== id) }));

  if (actif === null) return <div style={{ padding: 24, color: T.light }}>Chargement…</div>;
  const btn = (fort?: boolean, rouge?: boolean): React.CSSProperties => ({ border: fort ? 'none' : `1px solid ${rouge ? '#fca5a5' : T.border}`, background: fort ? couleur : '#fff', color: fort ? '#fff' : rouge ? '#b91c1c' : '#374151', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: occupe ? 'wait' : 'pointer', opacity: occupe ? 0.7 : 1 });
  const entete = (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 24 }}>🎨 Produits personnalisés</h2>
        {guide && <a href={guide} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: couleur, color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700 }}>📖 Voir le guide</a>}
      </div>
      <p style={{ margin: 0, fontSize: 14, color: T.light, lineHeight: 1.6 }}>Laissez l'acheteur personnaliser un produit avant de l'ajouter au panier : chandail imprimé, porte-clés, gravure… Ses réponses apparaissent dans la commande, avec l'image originale à télécharger.</p>
    </div>
  );
  if (!actif) {
    return (
      <div style={{ maxWidth: 940, color: T.text }}>{entete}
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: 10, padding: '12px 14px', fontSize: 13 }}>
          🔒 L'add-on <strong>Produits personnalisés</strong> n'est pas activé : activez-le dans <strong>Mon plan &amp; limites</strong>.
          {pagePlan && naviguerVers && <button type="button" onClick={() => naviguerVers(pagePlan)} style={{ marginLeft: 10, border: '1px solid #fdba74', background: '#fff', color: '#9a3412', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Voir « Mon plan &amp; limites »</button>}
        </div>
      </div>
    );
  }
  const modaleJsx = modale && (modale.type === 'confirmer'
    ? <BoutiqueModale type="confirmer" accent={couleur} titre={modale.titre} message={modale.message} texteConfirmer={modale.texte || 'Confirmer'} texteFermer="Annuler" enCours={!!occupe} onFermer={() => setModale(null)} onConfirmer={() => { const a = modale.action; setModale(null); if (a) a(); }} />
    : <BoutiqueModale type={modale.type} accent={couleur} message={modale.message} onFermer={() => setModale(null)} />);

  // ── Liste des produits ──
  if (!prod || !cfg) {
    const q = recherche.trim().toLowerCase();
    const liste = produits.filter(p => !q || p.titre.toLowerCase().includes(q));
    return (
      <div style={{ maxWidth: 940, color: T.text }}>{entete}
        <div style={carte}>
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher un produit…" style={{ ...champCss, marginBottom: 12 }} />
          {liste.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: T.light, fontSize: 14 }}>{produits.length === 0 ? "Vous n'avez pas encore de produit." : 'Aucun produit trouvé.'}</div>}
          {liste.map(p => (
            <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderTop: `1px solid ${T.border}` }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f3f4f6', overflow: 'hidden', flexShrink: 0 }}>{p.photo_principale && <img src={p.photo_principale} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titre}</div>
                <div style={{ fontSize: 12, color: p.perso_actif === null ? T.light : p.perso_actif ? T.ok : T.warn }}>{p.perso_actif === null ? 'Non personnalisable' : p.perso_actif ? `✓ Personnalisable · ${p.nb_champs} champ${p.nb_champs > 1 ? 's' : ''}` : 'Personnalisation en pause'}</div>
              </div>
              <button type="button" onClick={() => ouvrir(p)} style={btn(p.perso_actif === null)}>{p.perso_actif === null ? 'Rendre personnalisable' : 'Modifier'}</button>
            </div>
          ))}
        </div>
        {modaleJsx}
      </div>
    );
  }

  // ── Éditeur d'un produit ──
  const face = cfg.faces.find(f => f.id === faceId) || cfg.faces[0];
  const toutesZones = cfg.faces.flatMap(f => f.zones.map(z => ({ id: z.id, etiquette: `${f.nom} — ${z.nom || 'Zone'}` })));
  const exemple: ValeurApercu[] = cfg.champs.filter(c => c.zone && TEXTUEL.includes(c.type)).map(c => ({ id: c.id, type: c.type === 'texte_long' ? 'texte_long' : 'texte', zone: c.zone, affichage: c.type === 'texte' ? 'Votre texte' : c.type === 'date' ? '12 mars 2026' : c.type === 'nombre' ? '23' : 'Votre message ici', police: (c.polices || ['sans'])[0], couleur: (c.couleurs || ['#000000'])[0] }));
  const zoneSel = face && zoneId ? face.zones.find(z => z.id === zoneId) : null;
  const grille = (n: number): React.CSSProperties => ({ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : `repeat(${n}, 1fr)`, gap: 10 });

  return (
    <div style={{ maxWidth: 940, color: T.text }}>
      {entete}
      <div style={{ ...carte, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" onClick={fermerEditeur} style={btn()}>← Produits</button>
        <div style={{ flex: 1, minWidth: 180, fontSize: 16, fontWeight: 800 }}>{prod.titre}</div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}><input type="checkbox" checked={cfg.actif} onChange={e => maj(c => ({ ...c, actif: e.target.checked }))} /> Personnalisation active</label>
      </div>

      {/* Faces et zones */}
      <div style={carte}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>1. Aperçu : faces et zones (facultatif)</div>
        <div style={{ fontSize: 12, color: T.light, lineHeight: 1.5, marginBottom: 12 }}>Envoyez une photo du produit <strong>vierge</strong> (sans impression), puis tracez à la souris, sur la photo, la zone où ira le texte ou l'image. Ajoutez une 2e face pour le verso. Sans photo, l'acheteur remplit simplement les champs, sans aperçu.</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {cfg.faces.map(f => <button key={f.id} type="button" onClick={() => { setFaceId(f.id); setZoneId(null); }} style={{ ...btn(f.id === (face && face.id)), padding: '7px 14px' }}>{f.nom}</button>)}
          {cfg.faces.length < 4 && <button type="button" onClick={ajouterFace} style={btn()}>+ Ajouter une face</button>}
        </div>
        {face && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: 16, alignItems: 'start' }}>
            <div>
              {face.photo_url
                ? <ApercuPerso faces={[face]} faceActive={face.id} valeurs={exemple} montrerZones zoneActive={zoneId} accent={couleur} onZoneDebut={surPhoto} />
                : <div style={{ border: `2px dashed ${T.border}`, borderRadius: 10, padding: 30, textAlign: 'center', color: T.light, fontSize: 13 }}>Aucune photo pour cette face.</div>}
              {face.photo_url && <div style={{ fontSize: 11, color: T.light, marginTop: 6 }}>Glissez sur la photo pour tracer une zone ; glissez dans une zone pour la déplacer.</div>}
            </div>
            <div>
              <label style={lbl}>Nom de la face</label>
              <input value={face.nom} maxLength={30} onChange={e => majFace(face.id, { nom: e.target.value })} style={champCss} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0' }}>
                <label style={{ ...btn(), display: 'inline-block' }}>{occupe === 'photo' ? 'Envoi…' : face.photo_url ? 'Changer la photo' : 'Envoyer la photo'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={async e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return; setOccupe('photo'); const u = await televerser(f); setOccupe(''); if (u) majFace(face.id, { photo_url: u }); }} />
                </label>
                {prod.photo_principale && /^https:\/\/media\.e-vend\.ca\//.test(prod.photo_principale) && <button type="button" onClick={() => majFace(face.id, { photo_url: prod.photo_principale! })} style={btn()}>Utiliser la photo du produit</button>}
                <button type="button" onClick={() => retirerFace(face.id)} style={btn(false, true)}>Retirer la face</button>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, margin: '10px 0 6px' }}>Zones de cette face ({face.zones.length}/6)</div>
              {face.zones.length === 0 && <div style={{ fontSize: 12, color: T.light }}>Aucune zone pour l'instant.</div>}
              {face.zones.map(z => (
                <div key={z.id} onClick={() => setZoneId(z.id)} style={{ border: `1px solid ${zoneId === z.id ? couleur : T.border}`, borderRadius: 8, padding: 8, marginBottom: 6, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input value={z.nom || ''} maxLength={30} onChange={e => majZone(face.id, z.id, { nom: e.target.value })} style={{ ...champCss, padding: '6px 8px', fontSize: 13 }} aria-label="Nom de la zone" />
                    <select value={z.forme} onChange={e => majZone(face.id, z.id, { forme: e.target.value as ZonePerso['forme'] })} style={{ ...champCss, width: 'auto', padding: '6px 8px', fontSize: 13, background: '#fff' }} aria-label="Forme">
                      <option value="rect">Rectangle</option><option value="arrondi">Arrondi</option><option value="rond">Rond</option>
                    </select>
                    <button type="button" onClick={e => { e.stopPropagation(); retirerZone(face.id, z.id); }} aria-label="Supprimer la zone" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 15 }}>🗑</button>
                  </div>
                  {zoneSel && zoneSel.id === z.id && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 6 }}>
                      {(['x', 'y', 'w', 'h'] as const).map(k => (
                        <label key={k} style={{ fontSize: 10, color: T.light }}>{({ x: 'Gauche %', y: 'Haut %', w: 'Largeur %', h: 'Hauteur %' })[k]}
                          <input type="number" min={0} max={100} step={0.5} value={z[k]} onChange={e => { const v = clamp(Number(e.target.value) || 0, k === 'w' || k === 'h' ? 3 : 0, 100); majZone(face.id, z.id, { [k]: k === 'x' ? Math.min(v, 100 - z.w) : k === 'y' ? Math.min(v, 100 - z.h) : k === 'w' ? Math.min(v, 100 - z.x) : Math.min(v, 100 - z.y) } as Partial<ZonePerso>); }} style={{ ...champCss, padding: '4px 6px', fontSize: 12 }} />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {cfg.faces.length === 0 && <button type="button" onClick={ajouterFace} style={btn(true)}>+ Ajouter une face avec aperçu</button>}
      </div>

      {/* Champs */}
      <div style={carte}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>2. Champs à remplir par l'acheteur ({cfg.champs.length}/12)</div>
        <div style={{ fontSize: 12, color: T.light, lineHeight: 1.5, marginBottom: 12 }}>Le supplément s'ajoute au prix de chaque article quand le champ est rempli (ou le choix sélectionné). Taxes et codes promo s'appliquent automatiquement sur le prix total.</div>
        {cfg.champs.map((c, i) => (
          <div key={c.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ background: '#eef2ff', color: '#3730a3', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{LIBELLE_TYPE[c.type]}</span>
              <span style={{ flex: 1 }} />
              <button type="button" onClick={() => deplacer(c.id, -1)} disabled={i === 0} aria-label="Monter" style={{ ...btn(), padding: '4px 10px' }}>↑</button>
              <button type="button" onClick={() => deplacer(c.id, 1)} disabled={i === cfg.champs.length - 1} aria-label="Descendre" style={{ ...btn(), padding: '4px 10px' }}>↓</button>
              <button type="button" onClick={() => retirerChamp(c.id)} aria-label="Supprimer le champ" style={{ ...btn(false, true), padding: '4px 10px' }}>🗑</button>
            </div>
            <div style={grille(2)}>
              <div><label style={lbl}>Libellé</label><input value={c.libelle} maxLength={80} onChange={e => majChamp(c.id, { libelle: e.target.value })} style={champCss} /></div>
              <div><label style={lbl}>Aide (facultatif)</label><input value={c.aide} maxLength={200} onChange={e => majChamp(c.id, { aide: e.target.value })} style={champCss} placeholder="Ex. : 10 lettres maximum" /></div>
            </div>
            <div style={{ ...grille(3), marginTop: 10, alignItems: 'end' }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer', paddingBottom: 8 }}><input type="checkbox" checked={c.obligatoire} onChange={e => majChamp(c.id, { obligatoire: e.target.checked })} /> Obligatoire</label>
              {c.type !== 'liste' && c.type !== 'couleur' && <div><label style={lbl}>Supplément ($ / article)</label><input type="number" min={0} max={1000} step={0.5} value={c.supplement || 0} onChange={e => majChamp(c.id, { supplement: clamp(Number(e.target.value) || 0, 0, 1000) })} style={champCss} /></div>}
              {(c.type === 'texte' || c.type === 'texte_long') && <div><label style={lbl}>Longueur maximale</label><input type="number" min={1} max={500} value={Number(c.max) || 40} onChange={e => majChamp(c.id, { max: clamp(Math.round(Number(e.target.value) || 1), 1, 500) })} style={champCss} /></div>}
            </div>
            {(TEXTUEL.includes(c.type) || c.type === 'image') && (
              <div style={{ marginTop: 10 }}>
                <label style={lbl}>Zone de l'aperçu</label>
                <select value={c.zone || ''} onChange={e => majChamp(c.id, { zone: e.target.value || null })} style={{ ...champCss, background: '#fff', maxWidth: 360 }}>
                  <option value="">— Aucune (pas d'aperçu pour ce champ) —</option>
                  {toutesZones.map(z => <option key={z.id} value={z.id}>{z.etiquette}</option>)}
                </select>
              </div>
            )}
            {c.type === 'date' && (
              <div style={{ ...grille(2), marginTop: 10 }}>
                <div><label style={lbl}>Date minimale (facultatif)</label><input type="date" value={(c.min as string) || ''} onChange={e => majChamp(c.id, { min: e.target.value })} style={champCss} /></div>
                <div><label style={lbl}>Date maximale (facultatif)</label><input type="date" value={(c.max as string) || ''} onChange={e => majChamp(c.id, { max: e.target.value })} style={champCss} /></div>
              </div>
            )}
            {c.type === 'nombre' && (
              <div style={{ ...grille(3), marginTop: 10, alignItems: 'end' }}>
                <div><label style={lbl}>Minimum</label><input type="number" value={c.min as number} onChange={e => majChamp(c.id, { min: Number(e.target.value) || 0 })} style={champCss} /></div>
                <div><label style={lbl}>Maximum</label><input type="number" value={c.max as number} onChange={e => majChamp(c.id, { max: Number(e.target.value) || 0 })} style={champCss} /></div>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer', paddingBottom: 8 }}><input type="checkbox" checked={c.entier !== false} onChange={e => majChamp(c.id, { entier: e.target.checked })} /> Nombre entier seulement</label>
              </div>
            )}
            {TEXTUEL.includes(c.type) && (
              <div style={{ marginTop: 10 }}>
                <label style={lbl}>Polices proposées</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {polices.map(p => {
                    const on = (c.polices || []).includes(p.cle);
                    return <button key={p.cle} type="button" onClick={() => { const cur = c.polices || []; const nv = on ? cur.filter(k => k !== p.cle) : [...cur, p.cle]; majChamp(c.id, { polices: nv.length ? nv : ['sans'] }); }}
                      style={{ border: `2px solid ${on ? couleur : T.border}`, background: on ? '#f0f9ff' : '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 14, cursor: 'pointer', fontFamily: PILES_POLICES[p.cle] || p.pile }}>{p.nom}</button>;
                  })}
                </div>
                <label style={{ ...lbl, marginTop: 10 }}>Couleurs de texte proposées ({(c.couleurs || []).length}/12)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {(c.couleurs || []).map(h => (
                    <span key={h} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: `1px solid ${T.border}`, borderRadius: 20, padding: '3px 8px 3px 4px', fontSize: 12 }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: h, border: '1px solid #999' }} />{h}
                      <button type="button" aria-label={`Retirer ${h}`} onClick={() => { const nv = (c.couleurs || []).filter(x => x !== h); majChamp(c.id, { couleurs: nv.length ? nv : ['#000000'] }); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.light }}>×</button>
                    </span>
                  ))}
                  {(c.couleurs || []).length < 12 && <input type="color" aria-label="Ajouter une couleur" value="#ff0000" onChange={e => { const h = e.target.value.toLowerCase(); if (!(c.couleurs || []).includes(h)) majChamp(c.id, { couleurs: [...(c.couleurs || []), h] }); }} style={{ width: 36, height: 30, border: 'none', background: 'none', cursor: 'pointer' }} />}
                </div>
              </div>
            )}
            {c.type === 'liste' && (
              <div style={{ marginTop: 10 }}>
                <label style={lbl}>Choix ({(c.options || []).length}/20) — supplément en $ par choix</label>
                {(c.options || []).map(o => (
                  <div key={o.id} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <input value={o.libelle} maxLength={60} onChange={e => majChamp(c.id, { options: (c.options || []).map(x => (x.id === o.id ? { ...x, libelle: e.target.value } : x)) })} style={champCss} aria-label="Choix" />
                    <input type="number" min={0} max={1000} step={0.5} value={o.supplement} onChange={e => majChamp(c.id, { options: (c.options || []).map(x => (x.id === o.id ? { ...x, supplement: clamp(Number(e.target.value) || 0, 0, 1000) } : x)) })} style={{ ...champCss, width: 110 }} aria-label="Supplément" />
                    <button type="button" aria-label="Retirer le choix" onClick={() => majChamp(c.id, { options: (c.options || []).filter(x => x.id !== o.id) })} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 15 }}>🗑</button>
                  </div>
                ))}
                {(c.options || []).length < 20 && <button type="button" onClick={() => majChamp(c.id, { options: [...(c.options || []), { id: uid(), libelle: '', supplement: 0 }] })} style={btn()}>+ Ajouter un choix</button>}
              </div>
            )}
            {c.type === 'couleur' && (
              <div style={{ marginTop: 10 }}>
                <label style={lbl}>Couleurs du produit ({(c.options || []).length}/12) — pastille, supplément et photo par face</label>
                {(c.options || []).map(o => (
                  <div key={o.id} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input type="color" aria-label="Couleur de la pastille" value={o.hex || '#cccccc'} onChange={e => majChamp(c.id, { options: (c.options || []).map(x => (x.id === o.id ? { ...x, hex: e.target.value.toLowerCase() } : x)) })} style={{ width: 36, height: 32, border: 'none', background: 'none', cursor: 'pointer' }} />
                      <input value={o.libelle} maxLength={40} aria-label="Nom de la couleur" onChange={e => majChamp(c.id, { options: (c.options || []).map(x => (x.id === o.id ? { ...x, libelle: e.target.value } : x)) })} style={{ ...champCss, flex: 1, minWidth: 120 }} />
                      <input type="number" min={0} max={1000} step={0.5} aria-label="Supplément" value={o.supplement} onChange={e => majChamp(c.id, { options: (c.options || []).map(x => (x.id === o.id ? { ...x, supplement: clamp(Number(e.target.value) || 0, 0, 1000) } : x)) })} style={{ ...champCss, width: 100 }} />
                      <button type="button" aria-label="Retirer la couleur" onClick={() => majChamp(c.id, { options: (c.options || []).filter(x => x.id !== o.id) })} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 15 }}>🗑</button>
                    </div>
                    {cfg.faces.length === 0 && <div style={{ fontSize: 11, color: T.light, marginTop: 6 }}>Ajoutez d'abord une face (section 1) pour envoyer une photo par couleur.</div>}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                      {cfg.faces.map(f => {
                        const u = (o.photos || {})[f.id];
                        return (
                          <div key={f.id} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f3f4f6', overflow: 'hidden' }}>{u && <img src={u} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
                            <label style={{ ...btn(), padding: '5px 10px', fontSize: 12, display: 'inline-block' }}>{u ? `Changer ${f.nom}` : `Photo ${f.nom}`}
                              <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={async e => { const fi = e.target.files && e.target.files[0]; e.target.value = ''; if (!fi) return; setOccupe('photo'); const url = await televerser(fi); setOccupe(''); if (url) photoCouleur(c.id, o.id, f.id, url); }} />
                            </label>
                            {u && <button type="button" aria-label={`Retirer la photo ${f.nom}`} onClick={() => photoCouleur(c.id, o.id, f.id, null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>×</button>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {(c.options || []).length < 12 && <button type="button" onClick={() => majChamp(c.id, { options: [...(c.options || []), { id: uid(), libelle: '', hex: '#cccccc', supplement: 0, photos: {} }] })} style={btn()}>+ Ajouter une couleur</button>}
                <div style={{ fontSize: 11, color: T.light, marginTop: 6 }}>Sans photo pour une face, l'aperçu garde la photo de base. Le stock reste celui du produit (pour un stock par couleur, utilisez les variantes du produit).</div>
              </div>
            )}
            {i > 0 && (() => {
              const avant = cfg.champs.slice(0, i); const ref = c.si ? avant.find(x => x.id === c.si!.champ) : null;
              return (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${T.border}` }}>
                  <label style={lbl}>Afficher ce champ seulement si… (facultatif)</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <select aria-label="Condition : champ" value={c.si ? c.si.champ : ''} onChange={e => { const r = avant.find(x => x.id === e.target.value); majChamp(c.id, { si: r ? { champ: r.id, valeur: r.type === 'case' ? 'oui' : (r.type === 'liste' || r.type === 'couleur') ? ((r.options || [])[0] ? (r.options || [])[0].id : '') : '*' } : null }); }} style={{ ...champCss, background: '#fff', width: 'auto', minWidth: 220 }}>
                      <option value="">— Toujours affiché —</option>
                      {avant.map(x => <option key={x.id} value={x.id}>{x.libelle || LIBELLE_TYPE[x.type]}</option>)}
                    </select>
                    {ref && (ref.type === 'liste' || ref.type === 'couleur') && (
                      <select aria-label="Condition : choix" value={c.si ? c.si.valeur : ''} onChange={e => majChamp(c.id, { si: { champ: ref.id, valeur: e.target.value } })} style={{ ...champCss, background: '#fff', width: 'auto', minWidth: 160 }}>
                        {(ref.options || []).map(o => <option key={o.id} value={o.id}>est « {o.libelle} »</option>)}
                      </select>
                    )}
                    {ref && ref.type === 'case' && <span style={{ alignSelf: 'center', fontSize: 13 }}>est cochée</span>}
                    {ref && ref.type !== 'case' && ref.type !== 'liste' && ref.type !== 'couleur' && <span style={{ alignSelf: 'center', fontSize: 13 }}>est rempli</span>}
                  </div>
                </div>
              );
            })()}
          </div>
        ))}
        {cfg.champs.length < 12 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(Object.keys(LIBELLE_TYPE) as TypeChamp[]).filter(t => t !== 'couleur' || !cfg.champs.some(x => x.type === 'couleur')).map(t => <button key={t} type="button" onClick={() => ajouterChamp(t)} style={btn()}>+ {LIBELLE_TYPE[t]}</button>)}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={enregistrer} disabled={!!occupe} style={btn(true)}>{occupe === 'save' ? 'Enregistrement…' : 'Enregistrer'}</button>
        {existe && <button type="button" onClick={supprimerConfig} disabled={!!occupe} style={btn(false, true)}>Retirer la personnalisation</button>}
        {modifie && <span style={{ fontSize: 12, color: T.warn }}>● Modifications non enregistrées</span>}
      </div>
      {modaleJsx}
    </div>
  );
}