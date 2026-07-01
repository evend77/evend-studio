// src/pages/studio/ConfigTemplateResto.tsx
// e-Vend Studio — Configuration du template Restaurant & Fast Food

import { useState, useEffect } from 'react';
import TemplateResto, { CONFIG_RESTO_DEFAUT } from '../../templates/TemplateResto';
import type { ConfigResto, SectionConfig, PlatMenu, AvisResto } from '../../templates/TemplateResto';

type Onglet = 'identite' | 'apparence' | 'sections' | 'photos' | 'menu' | 'accompagnements' | 'avis' | 'reservation' | 'contact';

const CO = '#e8820a';

const Input = ({ value, onChange, placeholder, type = 'text' }: any) => (
  <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = CO} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
);
const Textarea = ({ value, onChange, placeholder, rows = 3 }: any) => (
  <textarea value={value} placeholder={placeholder} rows={rows} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none', resize: 'vertical' as any, fontFamily: 'inherit', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = CO} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
);
const Champ = ({ label, desc, children }: any) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>{label}</label>
    {desc && <p style={{ fontSize: 11, color: '#aaa', marginBottom: 5 }}>{desc}</p>}
    {children}
  </div>
);
const Sec = ({ titre, children }: any) => (
  <div style={{ marginBottom: 22 }}>
    <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as any, letterSpacing: '0.12em', color: '#aaa', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>{titre}</h3>
    {children}
  </div>
);

function ea<T>(val: any, def: T[]): T[] {
  return Array.isArray(val) && val.length > 0 ? val : def;
}

// ── SectionsManager ────────────────────────────────────────────────────────────
function SectionsManager({ sections, onChange }: { sections: SectionConfig[]; onChange: (s: SectionConfig[]) => void }) {
  const deplacer = (index: number, dir: -1 | 1) => {
    const arr = [...sections].sort((a, b) => a.ordre - b.ordre);
    const ni = index + dir;
    if (ni < 0 || ni >= arr.length) return;
    const tmp = arr[index].ordre;
    arr[index] = { ...arr[index], ordre: arr[ni].ordre };
    arr[ni] = { ...arr[ni], ordre: tmp };
    onChange(arr);
  };
  const toggle = (id: string) => onChange(sections.map(s => s.id === id ? { ...s, actif: !s.actif } : s));
  const sorted = [...sections].sort((a, b) => a.ordre - b.ordre);

  const icones: Record<string, string> = {
    hero: '🏠', special: '⭐', menu: '🍔', accompagnements: '🍟',
    qualite: '🎯', apropos: '📖', avis: '💬', reservation: '📅', contact: '📍',
  };

  return (
    <div>
      <div style={{ background: '#fff5ea', border: '1px solid #f5c87a', borderRadius: 8, padding: 10, fontSize: 12, color: '#7a4500', marginBottom: 14 }}>
        <strong>📐 Sections du site</strong><br />
        Toggle ON/OFF + flèches ▲▼ pour réordonner. Visible immédiatement dans l'aperçu.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {sorted.map((sec, i) => (
          <div key={sec.id} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            background: sec.actif ? '#fff8f0' : '#fafafa',
            border: `2px solid ${sec.actif ? '#f5c87a' : '#e5e7eb'}`,
            borderRadius: 10, padding: '9px 11px', transition: 'all .2s',
            opacity: sec.actif ? 1 : 0.55,
          }}>
            <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{icones[sec.id] || '📄'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#aaa', minWidth: 16 }}>#{i + 1}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: sec.actif ? '#1a1a1a' : '#999' }}>{sec.label}</span>
              </div>
            </div>
            <button onClick={() => toggle(sec.id)} style={{ width: 42, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: sec.actif ? CO : '#ddd', position: 'relative', flexShrink: 0, transition: 'background .25s' }}>
              <div style={{ position: 'absolute', top: 2, left: sec.actif ? 21 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .25s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
              <button onClick={() => deplacer(i, -1)} disabled={i === 0} style={{ width: 22, height: 18, border: '1px solid #ddd', borderRadius: 3, background: i === 0 ? '#f5f5f5' : '#fff', cursor: i === 0 ? 'default' : 'pointer', fontSize: 9, color: i === 0 ? '#ccc' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
              <button onClick={() => deplacer(i, 1)} disabled={i === sorted.length - 1} style={{ width: 22, height: 18, border: '1px solid #ddd', borderRadius: 3, background: i === sorted.length - 1 ? '#f5f5f5' : '#fff', cursor: i === sorted.length - 1 ? 'default' : 'pointer', fontSize: 9, color: i === sorted.length - 1 ? '#ccc' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, padding: '7px 11px', background: '#f5f5f5', borderRadius: 7, fontSize: 12, color: '#666' }}>
        <strong>{sorted.filter(s => s.actif).length}</strong> section{sorted.filter(s => s.actif).length > 1 ? 's' : ''} active{sorted.filter(s => s.actif).length > 1 ? 's' : ''} sur {sorted.length}
      </div>
    </div>
  );
}

const PALETTES = [
  { nom: 'Noir & Orange (défaut)', cf: '#0a0a0a', cfc: '#141414', ca: '#e8820a' },
  { nom: 'Noir & Rouge Piment',    cf: '#0a0505', cfc: '#140808', ca: '#dc2626' },
  { nom: 'Sombre & Vert Lime',     cf: '#050a05', cfc: '#0a140a', ca: '#65a30d' },
  { nom: 'Marine & Jaune Moutarde',cf: '#0a0d14', cfc: '#141820', ca: '#ca8a04' },
  { nom: 'Nuit & Rose Néon',       cf: '#0a0510', cfc: '#14081a', ca: '#db2777' },
  { nom: 'Charbon & Turquoise',    cf: '#050f0f', cfc: '#0a1a1a', ca: '#0d9488' },
];

interface Props {
  vendeurId: string;
  configInitiale?: Partial<ConfigResto>;
  onSauvegarde?: (config: ConfigResto) => Promise<void>;
}

export default function ConfigTemplateResto({ vendeurId, configInitiale, onSauvegarde }: Props) {
  const [config, setConfig] = useState<ConfigResto>({ ...CONFIG_RESTO_DEFAUT, ...configInitiale });
  const [onglet, setOnglet] = useState<Onglet>('identite');
  const [sauvegarde, setSauvegarde] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [apercu, setApercu] = useState(false);
  const [modeApercu, setModeApercu] = useState<'desktop' | 'tablette' | 'mobile'>('desktop');
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/studio/sites/${vendeurId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.config) setConfig(prev => ({ ...prev, ...data.config })); })
      .catch(() => {});
  }, [vendeurId]);

  const set = (k: keyof ConfigResto, v: any) => setConfig(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSauvegarde('loading');
    try {
      if (onSauvegarde) {
        await onSauvegarde(config);
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          credentials: 'include',
          body: JSON.stringify({ config, template_id: 'vitrine-resto' }),
        });
        if (!res.ok) throw new Error();
      }
      setSauvegarde('ok');
      setTimeout(() => setSauvegarde('idle'), 2500);
    } catch {
      setSauvegarde('err');
      setTimeout(() => setSauvegarde('idle'), 3000);
    }
  };

  // Helpers plats
  const plats = ea(config.plats, CONFIG_RESTO_DEFAUT.plats);
  const burgers = plats.filter(p => p.categorie === 'burgers');
  const accomps = plats.filter(p => p.categorie === 'accompagnements');

  const updPlat = (i: number, k: keyof PlatMenu, v: any) => {
    const arr = [...plats]; arr[i] = { ...arr[i], [k]: v }; set('plats', arr);
  };
  const addBurger = () => set('plats', [...plats, { nom: 'Nouveau burger', description: '', ingredients: '', prix: '14.99$', photo: '', categorie: 'burgers', vedette: false }]);
  const addAccomp = () => set('plats', [...plats, { nom: 'Nouvel accompagnement', description: '', ingredients: '', prix: '6.99$', photo: '', categorie: 'accompagnements', vedette: false }]);
  const delPlat = (i: number) => { const arr = [...plats]; arr.splice(i, 1); set('plats', arr); };

  // Helpers avis
  const avis = ea(config.avis, CONFIG_RESTO_DEFAUT.avis);
  const updAvis = (i: number, k: keyof AvisResto, v: any) => {
    const arr = [...avis]; arr[i] = { ...arr[i], [k]: v }; set('avis', arr);
  };
  const addAvis = () => set('avis', [...avis, { texte: '', auteur: '', role: '', photo: '', note: 5 }]);
  const delAvis = (i: number) => { const arr = [...avis]; arr.splice(i, 1); set('avis', arr); };

  // Helpers horaires / photos hero
  const horaires = ea(config.horaires, CONFIG_RESTO_DEFAUT.horaires);
  const updHoraire = (i: number, v: string) => { const h = [...horaires]; h[i] = v; set('horaires', h); };
  const photosHero = ea(config.photosHero, CONFIG_RESTO_DEFAUT.photosHero);
  const updPhotoHero = (i: number, v: string) => { const p = [...photosHero]; p[i] = v; set('photosHero', p); };
  const sections = ea(config.sections, CONFIG_RESTO_DEFAUT.sections);

  const ONGLETS: { id: Onglet; label: string; emoji: string }[] = [
    { id: 'identite',       label: 'Identité',      emoji: '🏷️' },
    { id: 'apparence',      label: 'Apparence',     emoji: '🎨' },
    { id: 'sections',       label: 'Sections',      emoji: '📐' },
    { id: 'photos',         label: 'Photos',        emoji: '📸' },
    { id: 'menu',           label: 'Burgers',       emoji: '🍔' },
    { id: 'accompagnements',label: 'Accomp.',       emoji: '🍟' },
    { id: 'avis',           label: 'Avis',          emoji: '⭐' },
    { id: 'reservation',    label: 'Réservation',   emoji: '📅' },
    { id: 'contact',        label: 'Contact',       emoji: '📍' },
  ];

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: "'Inter', sans-serif", background: '#f8f9fb' }}>
      {/* ── Panneau gauche ── */}
      <div style={{ width: 370, minWidth: 330, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, #0a0a0a, ${CO})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🍔</div>
            <div>
              <p style={{ fontSize: 11, color: '#888', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Template Gratuit</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Restaurant & Fast Food</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingBottom: 12 }}>
            {ONGLETS.map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)} style={{
                padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500,
                background: onglet === o.id ? '#0a0a0a' : '#f3f4f6',
                color: onglet === o.id ? CO : '#555',
                transition: 'all 0.15s',
              }}>
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

          {/* ── IDENTITÉ ── */}
          {onglet === 'identite' && (
            <>
              <Sec titre="Nom & Accroche">
                <Champ label="Nom du restaurant"><Input value={config.nomResto} onChange={(v: string) => set('nomResto', v)} placeholder="BurgerLab" /></Champ>
                <Champ label="Emoji logo"><Input value={config.logoEmoji} onChange={(v: string) => set('logoEmoji', v)} placeholder="🍔" /></Champ>
                <Champ label="Slogan (1re partie)" desc="Ex: Le paradis ultime"><Input value={config.slogan} onChange={(v: string) => set('slogan', v)} /></Champ>
                <Champ label="Slogan (2e partie — en orange)" desc="Ex: du burger."><Input value={config.sloganAccent} onChange={(v: string) => set('sloganAccent', v)} /></Champ>
                <Champ label="Description"><Textarea value={config.description} onChange={(v: string) => set('description', v)} rows={3} /></Champ>
              </Sec>
              <Sec titre="Texte À propos">
                <Champ label="Titre À propos"><Input value={config.aPropsTitre} onChange={(v: string) => set('aPropsTitre', v)} /></Champ>
                <Champ label="Paragraphe 1"><Textarea value={config.aPropsTexte1} onChange={(v: string) => set('aPropsTexte1', v)} rows={3} /></Champ>
                <Champ label="Paragraphe 2"><Textarea value={config.aPropsTexte2} onChange={(v: string) => set('aPropsTexte2', v)} rows={3} /></Champ>
              </Sec>
              <Sec titre="Boutons CTA">
                <Champ label="Bouton commander"><Input value={config.boutonsCommande} onChange={(v: string) => set('boutonsCommande', v)} placeholder="Commander maintenant" /></Champ>
                <Champ label="Bouton menu"><Input value={config.boutonsMenu} onChange={(v: string) => set('boutonsMenu', v)} placeholder="Voir le menu" /></Champ>
              </Sec>
            </>
          )}

          {/* ── APPARENCE ── */}
          {onglet === 'apparence' && (
            <>
              <Sec titre="Palettes prédéfinies">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {PALETTES.map(p => (
                    <button key={p.nom} onClick={() => setConfig(prev => ({ ...prev, couleurFond: p.cf, couleurFondCarte: p.cfc, couleurAccent: p.ca }))}
                      style={{ padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 10, fontWeight: 600, border: `2px solid ${config.couleurAccent === p.ca && config.couleurFond === p.cf ? p.ca : '#e5e7eb'}`, background: p.cf, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 3 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cf, border: '1px solid rgba(255,255,255,0.15)' }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cfc }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.ca }} />
                      </div>
                      <span style={{ color: p.ca, fontSize: 9 }}>{p.nom}</span>
                    </button>
                  ))}
                </div>
              </Sec>
              <Sec titre="Couleurs personnalisées">
                {([['couleurFond', 'Fond principal'], ['couleurFondCarte', 'Fond cartes'], ['couleurAccent', 'Couleur accent (orange)']] as [keyof ConfigResto, string][]).map(([k, label]) => (
                  <Champ key={k} label={label}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="color" value={(config[k] as string) || '#000'} onChange={e => set(k, e.target.value)} style={{ width: 40, height: 34, padding: 2, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }} />
                      <Input value={config[k] as string} onChange={(v: string) => set(k, v)} />
                    </div>
                  </Champ>
                ))}
              </Sec>
              <div style={{ borderRadius: 10, overflow: 'hidden', height: 44, display: 'flex' }}>
                <div style={{ flex: 2, background: config.couleurFond, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: config.couleurAccent, fontSize: 10, fontWeight: 700 }}>FOND</span></div>
                <div style={{ flex: 1.5, background: config.couleurFondCarte, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: config.couleurAccent, fontSize: 10, fontWeight: 700 }}>CARTE</span></div>
                <div style={{ flex: 1, background: config.couleurAccent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>ACCENT</span></div>
              </div>
            </>
          )}

          {/* ── SECTIONS ── */}
          {onglet === 'sections' && (
            <SectionsManager sections={sections} onChange={(s) => set('sections', s)} />
          )}

          {/* ── PHOTOS ── */}
          {onglet === 'photos' && (
            <>
              <Sec titre="Photos principales">
                <Champ label="Photo Hero principale (droite)"><Input value={config.photoHero} onChange={(v: string) => set('photoHero', v)} /></Champ>
                <Champ label="Photo Qualité (section CTA)"><Input value={config.photoQualite} onChange={(v: string) => set('photoQualite', v)} /></Champ>
                <Champ label="Photo À propos — gauche"><Input value={config.photoAPropos1} onChange={(v: string) => set('photoAPropos1', v)} /></Champ>
                <Champ label="Photo À propos — droite"><Input value={config.photoAPropos2} onChange={(v: string) => set('photoAPropos2', v)} /></Champ>
                <Champ label="Photo Réservation (fond)"><Input value={config.photoReservation} onChange={(v: string) => set('photoReservation', v)} /></Champ>
              </Sec>
              <Sec titre="Galerie miniatures Hero" desc="5 photos qui défilent et s'animent dans le hero">
                {photosHero.map((url, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    {url && <img src={url} alt="" onError={e => (e.currentTarget.style.display = 'none')} style={{ width: 44, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: `1px solid ${CO}40` }} />}
                    <Input value={url} onChange={(v: string) => updPhotoHero(i, v)} placeholder={`Photo miniature ${i + 1}`} />
                  </div>
                ))}
              </Sec>
            </>
          )}

          {/* ── MENU BURGERS ── */}
          {onglet === 'menu' && (
            <>
              {burgers.map((p, i) => {
                const idx = plats.indexOf(p);
                return (
                  <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 13, marginBottom: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Burger {i + 1}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#888', cursor: 'pointer' }}>
                          <input type="checkbox" checked={!!p.vedette} onChange={e => updPlat(idx, 'vedette', e.target.checked)} />
                          Vedette
                        </label>
                        <button onClick={() => delPlat(idx)} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '3px 7px', fontSize: 11, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                    <Champ label="Nom"><Input value={p.nom} onChange={(v: string) => updPlat(idx, 'nom', v)} /></Champ>
                    <Champ label="Description courte"><Input value={p.description} onChange={(v: string) => updPlat(idx, 'description', v)} /></Champ>
                    <Champ label="Ingrédients"><Input value={p.ingredients} onChange={(v: string) => updPlat(idx, 'ingredients', v)} /></Champ>
                    <Champ label="Prix"><Input value={p.prix} onChange={(v: string) => updPlat(idx, 'prix', v)} placeholder="16.99$" /></Champ>
                    <Champ label="Photo (URL)"><Input value={p.photo} onChange={(v: string) => updPlat(idx, 'photo', v)} /></Champ>
                  </div>
                );
              })}
              <button onClick={addBurger} style={{ width: '100%', padding: 9, border: `2px dashed ${CO}`, borderRadius: 9, background: 'transparent', color: CO, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                + Ajouter un burger
              </button>
            </>
          )}

          {/* ── ACCOMPAGNEMENTS ── */}
          {onglet === 'accompagnements' && (
            <>
              {accomps.map((p, i) => {
                const idx = plats.indexOf(p);
                return (
                  <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 13, marginBottom: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Accompagnement {i + 1}</span>
                      <button onClick={() => delPlat(idx)} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '3px 7px', fontSize: 11, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                    </div>
                    <Champ label="Nom"><Input value={p.nom} onChange={(v: string) => updPlat(idx, 'nom', v)} /></Champ>
                    <Champ label="Description"><Input value={p.description} onChange={(v: string) => updPlat(idx, 'description', v)} /></Champ>
                    <Champ label="Prix"><Input value={p.prix} onChange={(v: string) => updPlat(idx, 'prix', v)} placeholder="7.99$" /></Champ>
                    <Champ label="Photo (URL)"><Input value={p.photo} onChange={(v: string) => updPlat(idx, 'photo', v)} /></Champ>
                  </div>
                );
              })}
              <button onClick={addAccomp} style={{ width: '100%', padding: 9, border: `2px dashed ${CO}`, borderRadius: 9, background: 'transparent', color: CO, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                + Ajouter un accompagnement
              </button>
            </>
          )}

          {/* ── AVIS ── */}
          {onglet === 'avis' && (
            <>
              <div style={{ background: '#fff5ea', border: '1px solid #f5c87a', borderRadius: 8, padding: 9, fontSize: 12, color: '#7a4500', marginBottom: 12 }}>
                💬 Les avis s'affichent dans un carrousel avec navigation par points.
              </div>
              {avis.map((a, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 13, marginBottom: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Avis {i + 1}</span>
                    <button onClick={() => delAvis(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '3px 7px', fontSize: 11, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Texte"><Textarea value={a.texte} onChange={(v: string) => updAvis(i, 'texte', v)} rows={2} /></Champ>
                  <Champ label="Auteur"><Input value={a.auteur} onChange={(v: string) => updAvis(i, 'auteur', v)} placeholder="Justin S." /></Champ>
                  <Champ label="Rôle"><Input value={a.role} onChange={(v: string) => updAvis(i, 'role', v)} placeholder="Client fidèle" /></Champ>
                  <Champ label="Photo (URL)"><Input value={a.photo} onChange={(v: string) => updAvis(i, 'photo', v)} /></Champ>
                  <Champ label="Note">
                    <select value={a.note} onChange={e => updAvis(i, 'note', parseInt(e.target.value))} style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, background: '#fff' }}>
                      {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ★</option>)}
                    </select>
                  </Champ>
                </div>
              ))}
              <button onClick={addAvis} style={{ width: '100%', padding: 9, border: `2px dashed ${CO}`, borderRadius: 9, background: 'transparent', color: CO, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                + Ajouter un avis
              </button>
            </>
          )}

          {/* ── RÉSERVATION ── */}
          {onglet === 'reservation' && (
            <Sec titre="Section réservation de table">
              <Champ label="Description" desc="Texte affiché à droite du formulaire"><Textarea value={config.descReservation} onChange={(v: string) => set('descReservation', v)} rows={4} /></Champ>
              <Champ label="Stat clients" desc="Ex: 300+"><Input value={config.statsClients} onChange={(v: string) => set('statsClients', v)} placeholder="300+" /></Champ>
              <Champ label="Stat moments" desc="Ex: 180+"><Input value={config.statsMoments} onChange={(v: string) => set('statsMoments', v)} placeholder="180+" /></Champ>
              <Champ label="Photo de fond (URL)"><Input value={config.photoReservation} onChange={(v: string) => set('photoReservation', v)} /></Champ>
            </Sec>
          )}

          {/* ── CONTACT ── */}
          {onglet === 'contact' && (
            <>
              <Sec titre="Coordonnées">
                <Champ label="Adresse"><Input value={config.adresse} onChange={(v: string) => set('adresse', v)} /></Champ>
                <Champ label="Ville / Code postal"><Input value={config.ville} onChange={(v: string) => set('ville', v)} /></Champ>
                <Champ label="Téléphone"><Input value={config.telephone} onChange={(v: string) => set('telephone', v)} /></Champ>
                <Champ label="Courriel"><Input value={config.email} onChange={(v: string) => set('email', v)} /></Champ>
              </Sec>
              <Sec titre="Horaires">
                {horaires.map((h, i) => (
                  <div key={i} style={{ marginBottom: 7 }}>
                    <Input value={h} onChange={(v: string) => updHoraire(i, v)} placeholder="Lun – Jeu : 11h – 22h" />
                  </div>
                ))}
              </Sec>
              <Sec titre="Réseaux sociaux">
                <Champ label="Facebook (URL)"><Input value={config.reseaux?.facebook || ''} onChange={(v: string) => set('reseaux', { ...config.reseaux, facebook: v })} placeholder="https://facebook.com/..." /></Champ>
                <Champ label="Instagram (URL)"><Input value={config.reseaux?.instagram || ''} onChange={(v: string) => set('reseaux', { ...config.reseaux, instagram: v })} placeholder="https://instagram.com/..." /></Champ>
                <Champ label="Twitter/X (URL)"><Input value={config.reseaux?.twitter || ''} onChange={(v: string) => set('reseaux', { ...config.reseaux, twitter: v })} placeholder="https://twitter.com/..." /></Champ>
              </Sec>
              <Sec titre="Google Maps">
                <Champ label="URL iFrame" desc="Google Maps > Partager > Intégrer une carte"><Textarea value={config.coordGoogleMaps} onChange={(v: string) => set('coordGoogleMaps', v)} rows={3} /></Champ>
              </Sec>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'11px 13px', borderTop:'1px solid #f0f0f0', display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
          {resetConfirm ? (
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:7, padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, color:'#991b1b', fontWeight:600, flex:1 }}>⚠️ Effacer toute la config?</span>
              <button onClick={()=>{ setConfig({...CONFIG_RESTO_DEFAUT}); setResetConfirm(false); }} style={{ padding:'4px 10px', borderRadius:5, background:'#dc2626', border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>✓ Confirmer</button>
              <button onClick={()=>setResetConfirm(false)} style={{ padding:'4px 8px', borderRadius:5, background:'#f3f4f6', border:'none', color:'#555', fontSize:11, cursor:'pointer' }}>Annuler</button>
            </div>
          ) : (
            <button onClick={()=>setResetConfirm(true)} style={{ width:'100%', padding:'6px 0', borderRadius:7, background:'transparent', border:'1.5px solid #fca5a5', color:'#dc2626', fontSize:11, fontWeight:600, cursor:'pointer' }}>
              🗑️ Réinitialiser la config
            </button>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setApercu(!apercu)} style={{ flex:1, padding:'9px 0', borderRadius:7, border:'1.5px solid #0a0a0a', background:apercu?'#0a0a0a':'transparent', color:apercu?CO:'#0a0a0a', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .2s' }}>
              {apercu?'✕ Fermer':'👁 Aperçu'}
            </button>
            <button onClick={handleSave} disabled={sauvegarde==='loading'} style={{ flex:2, padding:'9px 0', borderRadius:7, border:'none', background:sauvegarde==='ok'?'#10b981':sauvegarde==='err'?'#dc2626':'#0a0a0a', color:sauvegarde==='ok'||sauvegarde==='err'?'#fff':CO, fontSize:12, fontWeight:700, cursor:'pointer', transition:'background .3s' }}>
              {sauvegarde==='loading'?'⏳...':sauvegarde==='ok'?'✅ Sauvegardé!':sauvegarde==='err'?'❌ Erreur':'💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      {/* Aperçu iframe 3 modes */}
      <div style={{ flex:1, display:apercu?'flex':'none', flexDirection:'column', background:'#0a0a0a', overflow:'hidden' }}>
        <div style={{ background:'#141414', borderBottom:`1px solid ${CO}44`, padding:'6px 12px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <span style={{ fontSize:13 }}>⚠️</span>
          <span style={{ fontSize:11, color:CO, fontWeight:600 }}>Sauvegardez vos changements pour les voir dans l'aperçu</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 0', borderBottom:'1px solid #222', flexShrink:0 }}>
          {([['desktop','🖥️','Bureau'],['tablette','📲','Tablette'],['mobile','📱','Mobile']] as const).map(([m,ico,label])=>(
            <button key={m} onClick={()=>setModeApercu(m)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:7, border:'none', background:modeApercu===m?`${CO}33`:'transparent', color:modeApercu===m?CO:'#666', cursor:'pointer', fontSize:12, fontWeight:700, transition:'all .2s' }}>
              <span style={{ fontSize:16 }}>{ico}</span><span>{label}</span>
            </button>
          ))}
        </div>
        <div style={{ flex:1, overflow:'hidden', display:'flex', justifyContent:'center', alignItems:'flex-start', padding:'12px 8px' }}>
          <div style={{ width:modeApercu==='mobile'?375:modeApercu==='tablette'?768:'100%', height:'100%', overflow:'hidden', borderRadius:modeApercu==='mobile'?20:modeApercu==='tablette'?8:4, border:`${modeApercu==='mobile'?4:2}px solid #333`, flexShrink:0, background:'#fff' }}>
            <iframe key={modeApercu} src={`/site-preview?vendeurId=${vendeurId}`}
              style={{ width:modeApercu==='mobile'?375:modeApercu==='tablette'?768:'100%', height:'100%', border:'none', display:'block' }} title="Aperçu" />
          </div>
        </div>
      </div>
      {!apercu && (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#0a0a0a', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:52 }}>🍔</div>
          <p style={{ fontSize:15, color:CO, fontWeight:600 }}>Cliquez sur "Aperçu" pour voir votre site</p>
          <p style={{ fontSize:12, color:`${CO}80` }}>Template Restaurant & Fast Food — Gratuit</p>
        </div>
      )}
    </div>
  );
}