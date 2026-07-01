// src/pages/studio/ConfigTemplateBistro.tsx
// e-Vend Studio — Configuration du template Bistro & Café

import { useState, useEffect } from 'react';
import TemplateBistro, { CONFIG_BISTRO_DEFAUT } from '../../templates/TemplateBistro';
import type { ConfigBistro, SectionConfig, ItemMenuBistro, CaracteristiqueBistro } from '../../templates/TemplateBistro';

type Onglet = 'identite' | 'apparence' | 'sections' | 'photos' | 'menu' | 'caracteristiques' | 'reservation' | 'contact';

const CA = '#8b6914';

const Input = ({ value, onChange, placeholder, type = 'text' }: any) => (
  <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = CA} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
);
const Textarea = ({ value, onChange, placeholder, rows = 3 }: any) => (
  <textarea value={value} placeholder={placeholder} rows={rows} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none', resize: 'vertical' as any, fontFamily: 'inherit', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = CA} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
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

function ea<T>(val: any, def: T[]): T[] { return Array.isArray(val) && val.length > 0 ? val : def; }

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
  const icones: Record<string, string> = { hero: '☕', galerie: '📸', apropos: '📖', special: '⭐', menu: '🍽️', pourquoi: '💡', reservation: '📅', contact: '📍' };

  return (
    <div>
      <div style={{ background: '#fdf5e0', border: '1px solid #d4a820', borderRadius: 8, padding: 10, fontSize: 12, color: '#5a3e00', marginBottom: 14 }}>
        <strong>📐 Sections du site</strong><br />Toggle ON/OFF + flèches ▲▼ pour réordonner.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {sorted.map((sec, i) => (
          <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 9, background: sec.actif ? '#fdf8ec' : '#fafafa', border: `2px solid ${sec.actif ? '#d4a820' : '#e5e7eb'}`, borderRadius: 10, padding: '9px 11px', transition: 'all .2s', opacity: sec.actif ? 1 : 0.55 }}>
            <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{icones[sec.id] || '📄'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#aaa', minWidth: 16 }}>#{i + 1}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: sec.actif ? '#1a1a1a' : '#999' }}>{sec.label}</span>
              </div>
            </div>
            <button onClick={() => toggle(sec.id)} style={{ width: 42, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: sec.actif ? CA : '#ddd', position: 'relative', flexShrink: 0, transition: 'background .25s' }}>
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
  { nom: 'Brun Café (défaut)', cf: '#0d0d0d', cn: '#1a1410', ca: '#8b6914' },
  { nom: 'Noir & Menthe',      cf: '#0a0f0a', cn: '#0f180f', ca: '#2d9e5f' },
  { nom: 'Noir & Bordeaux',    cf: '#0d0508', cn: '#180810', ca: '#9e2d3f' },
  { nom: 'Ardoise & Bleu',     cf: '#08080f', cn: '#100f1a', ca: '#3d5fa0' },
  { nom: 'Charbon & Rose',     cf: '#0f0a0a', cn: '#1a1010', ca: '#b06080' },
  { nom: 'Noir & Ambre',       cf: '#0d0b08', cn: '#1a1610', ca: '#c4830a' },
];

interface Props {
  vendeurId: string;
  configInitiale?: Partial<ConfigBistro>;
  onSauvegarde?: (config: ConfigBistro) => Promise<void>;
}

export default function ConfigTemplateBistro({ vendeurId, configInitiale, onSauvegarde }: Props) {
  const [config, setConfig] = useState<ConfigBistro>({ ...CONFIG_BISTRO_DEFAUT, ...configInitiale });
  const [onglet, setOnglet] = useState<Onglet>('identite');
  const [sauvegarde, setSauvegarde] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [resetConfirm, setResetConfirm] = useState(false);
  const [apercu, setApercu] = useState(false);
  const [modeApercu, setModeApercu] = useState<'desktop'|'tablette'|'mobile'>('desktop');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/studio/sites/${vendeurId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.config) setConfig(prev => ({ ...prev, ...data.config })); })
      .catch(() => {});
  }, [vendeurId]);

  const set = (k: keyof ConfigBistro, v: any) => setConfig(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSauvegarde('loading');
    try {
      if (onSauvegarde) {
        await onSauvegarde(config);
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}/config`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          credentials: 'include',
          body: JSON.stringify({ config, template_id: 'vitrine-bistro' }),
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

  const items = ea(config.items, CONFIG_BISTRO_DEFAUT.items);
  const updItem = (i: number, k: keyof ItemMenuBistro, v: any) => { const arr = [...items]; arr[i] = { ...arr[i], [k]: v }; set('items', arr); };
  const addItem = (cat: string) => set('items', [...items, { nom: 'Nouvel article', description: '', prix: '5.00$', photo: '', categorie: cat }]);
  const delItem = (i: number) => { const arr = [...items]; arr.splice(i, 1); set('items', arr); };

  const caract = ea(config.caracteristiques, CONFIG_BISTRO_DEFAUT.caracteristiques);
  const updCaract = (i: number, k: keyof CaracteristiqueBistro, v: string) => { const arr = [...caract]; arr[i] = { ...arr[i], [k]: v }; set('caracteristiques', arr); };
  const addCaract = () => set('caracteristiques', [...caract, { icone: '☕', texte: '' }]);
  const delCaract = (i: number) => { const arr = [...caract]; arr.splice(i, 1); set('caracteristiques', arr); };

  const horaires = ea(config.horaires, CONFIG_BISTRO_DEFAUT.horaires);
  const updHoraire = (i: number, v: string) => { const h = [...horaires]; h[i] = v; set('horaires', h); };

  const photosGalerie = ea(config.photosGalerie, CONFIG_BISTRO_DEFAUT.photosGalerie);
  const updGalerie = (i: number, v: string) => { const p = [...photosGalerie]; p[i] = v; set('photosGalerie', p); };
  const sections = ea(config.sections, CONFIG_BISTRO_DEFAUT.sections);

  const ONGLETS: { id: Onglet; label: string; emoji: string }[] = [
    { id: 'identite',        label: 'Identité',     emoji: '🏷️' },
    { id: 'apparence',       label: 'Apparence',    emoji: '🎨' },
    { id: 'sections',        label: 'Sections',     emoji: '📐' },
    { id: 'photos',          label: 'Photos',       emoji: '📸' },
    { id: 'menu',            label: 'Menu',         emoji: '☕' },
    { id: 'caracteristiques',label: 'Points forts', emoji: '💡' },
    { id: 'reservation',     label: 'Réservation',  emoji: '📅' },
    { id: 'contact',         label: 'Contact',      emoji: '📍' },
  ];

  const categoriesMenu = ['cafes', 'patisseries', 'lattes', 'boissons'];
  const labelsCategories: Record<string, string> = { cafes: '☕ Cafés', patisseries: '🥐 Pâtisseries', lattes: '🧋 Lattes', boissons: '🥤 Boissons' };

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: "'Inter', sans-serif", background: '#f8f9fb' }}>
      <div style={{ width: 370, minWidth: 330, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, #0d0d0d, ${CA})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>☕</div>
            <div>
              <p style={{ fontSize: 11, color: '#888', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Template Gratuit</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Bistro & Café</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingBottom: 12 }}>
            {ONGLETS.map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500, background: onglet === o.id ? '#1a1410' : '#f3f4f6', color: onglet === o.id ? CA : '#555', transition: 'all 0.15s' }}>
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

          {onglet === 'identite' && (
            <>
              <Sec titre="Nom & Textes">
                <Champ label="Nom du bistro"><Input value={config.nomBistro} onChange={(v: string) => set('nomBistro', v)} placeholder="Café Arôme" /></Champ>
                <Champ label="Slogan héro (géant)" desc="Affiché en très grand. Utilisez un saut de ligne \\n pour séparer"><Textarea value={config.sloganHero} onChange={(v: string) => set('sloganHero', v)} rows={2} /></Champ>
                <Champ label="Sous-slogan (lettrage)" desc="Petite phrase sous le nom, en majuscules et espacement"><Input value={config.sloganSub} onChange={(v: string) => set('sloganSub', v)} /></Champ>
                <Champ label="Description courte (hero)"><Textarea value={config.descriptionCourte} onChange={(v: string) => set('descriptionCourte', v)} rows={3} /></Champ>
                <Champ label="Description footer"><Textarea value={config.descFooter} onChange={(v: string) => set('descFooter', v)} rows={2} /></Champ>
              </Sec>
              <Sec titre="À propos">
                <Champ label="Titre À propos"><Input value={config.titreAPropos} onChange={(v: string) => set('titreAPropos', v)} /></Champ>
                <Champ label="Description"><Textarea value={config.descAPropos} onChange={(v: string) => set('descAPropos', v)} rows={3} /></Champ>
              </Sec>
              <Sec titre="Section spécialité">
                <Champ label="Titre"><Input value={config.titreSpecial} onChange={(v: string) => set('titreSpecial', v)} /></Champ>
                <Champ label="Description"><Textarea value={config.descSpecial} onChange={(v: string) => set('descSpecial', v)} rows={3} /></Champ>
              </Sec>
            </>
          )}

          {onglet === 'apparence' && (
            <>
              <Sec titre="Palettes prédéfinies">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {PALETTES.map(p => (
                    <button key={p.nom} onClick={() => setConfig(prev => ({ ...prev, couleurFond: p.cf, couleurNav: p.cn, couleurAccent: p.ca }))}
                      style={{ padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 10, fontWeight: 600, border: `2px solid ${config.couleurAccent === p.ca && config.couleurFond === p.cf ? p.ca : '#e5e7eb'}`, background: p.cf, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 3 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cf, border: '1px solid rgba(255,255,255,0.15)' }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cn }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.ca }} />
                      </div>
                      <span style={{ color: p.ca, fontSize: 9 }}>{p.nom}</span>
                    </button>
                  ))}
                </div>
              </Sec>
              <Sec titre="Couleurs personnalisées">
                {([['couleurFond', 'Fond principal'], ['couleurNav', 'Fond navigation'], ['couleurAccent', 'Accent (brun/couleur)']] as [keyof ConfigBistro, string][]).map(([k, label]) => (
                  <Champ key={k} label={label}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="color" value={(config[k] as string) || '#000'} onChange={e => set(k, e.target.value)} style={{ width: 40, height: 34, padding: 2, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }} />
                      <Input value={config[k] as string} onChange={(v: string) => set(k, v)} />
                    </div>
                  </Champ>
                ))}
              </Sec>
              <div style={{ borderRadius: 10, overflow: 'hidden', height: 40, display: 'flex' }}>
                <div style={{ flex: 2, background: config.couleurFond, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: config.couleurAccent, fontSize: 10, fontWeight: 700 }}>FOND</span></div>
                <div style={{ flex: 1.5, background: config.couleurNav, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: config.couleurAccent, fontSize: 10, fontWeight: 700 }}>NAV</span></div>
                <div style={{ flex: 1, background: config.couleurAccent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>ACCENT</span></div>
              </div>
            </>
          )}

          {onglet === 'sections' && <SectionsManager sections={sections} onChange={(s) => set('sections', s)} />}

          {onglet === 'photos' && (
            <>
              <Sec titre="Photos principales">
                <Champ label="Photo Hero (fond)"><Input value={config.photoHero} onChange={(v: string) => set('photoHero', v)} /></Champ>
                <Champ label="Photo À propos 1 (grande)"><Input value={config.photoAPropos1} onChange={(v: string) => set('photoAPropos1', v)} /></Champ>
                <Champ label="Photo À propos 2 (petite superposée)"><Input value={config.photoAPropos2} onChange={(v: string) => set('photoAPropos2', v)} /></Champ>
                <Champ label="Photo Spécialité gauche"><Input value={config.photoSpecial1} onChange={(v: string) => set('photoSpecial1', v)} /></Champ>
                <Champ label="Photo Spécialité droite"><Input value={config.photoSpecial2} onChange={(v: string) => set('photoSpecial2', v)} /></Champ>
                <Champ label="Photo Réservation (fond)"><Input value={config.photoReservation} onChange={(v: string) => set('photoReservation', v)} /></Champ>
              </Sec>
              <Sec titre="Galerie (4 photos — section accueil)">
                {photosGalerie.map((url, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    {url && <img src={url} alt="" onError={e => (e.currentTarget.style.display = 'none')} style={{ width: 44, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                    <Input value={url} onChange={(v: string) => updGalerie(i, v)} placeholder={`Photo galerie ${i + 1}`} />
                  </div>
                ))}
              </Sec>
            </>
          )}

          {onglet === 'menu' && (
            <>
              {categoriesMenu.map(cat => {
                const catItems = items.filter(it => it.categorie === cat);
                return (
                  <Sec key={cat} titre={labelsCategories[cat]}>
                    {catItems.map((item, ci) => {
                      const idx = items.indexOf(item);
                      return (
                        <div key={ci} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{item.nom || `Article ${ci + 1}`}</span>
                            <button onClick={() => delItem(idx)} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '3px 7px', fontSize: 11, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                          </div>
                          <Champ label="Nom"><Input value={item.nom} onChange={(v: string) => updItem(idx, 'nom', v)} /></Champ>
                          <Champ label="Description"><Input value={item.description} onChange={(v: string) => updItem(idx, 'description', v)} /></Champ>
                          <Champ label="Prix"><Input value={item.prix} onChange={(v: string) => updItem(idx, 'prix', v)} placeholder="5.00$" /></Champ>
                          <Champ label="Photo (URL)"><Input value={item.photo} onChange={(v: string) => updItem(idx, 'photo', v)} /></Champ>
                        </div>
                      );
                    })}
                    <button onClick={() => addItem(cat)} style={{ width: '100%', padding: 8, border: `2px dashed ${CA}`, borderRadius: 8, background: 'transparent', color: CA, cursor: 'pointer', fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
                      + Ajouter
                    </button>
                  </Sec>
                );
              })}
            </>
          )}

          {onglet === 'caracteristiques' && (
            <>
              <div style={{ background: '#fdf5e0', border: '1px solid #d4a820', borderRadius: 8, padding: 9, fontSize: 12, color: '#5a3e00', marginBottom: 12 }}>
                💡 Ces points s'affichent dans la section "Pourquoi nous choisir" avec une icône emoji et un texte.
              </div>
              {caract.map((c, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Point fort {i + 1}</span>
                    <button onClick={() => delCaract(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 5, padding: '3px 7px', fontSize: 11, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Icône (emoji)"><Input value={c.icone} onChange={(v: string) => updCaract(i, 'icone', v)} placeholder="☕" /></Champ>
                  <Champ label="Texte descriptif"><Textarea value={c.texte} onChange={(v: string) => updCaract(i, 'texte', v)} rows={2} /></Champ>
                </div>
              ))}
              <button onClick={addCaract} style={{ width: '100%', padding: 9, border: `2px dashed ${CA}`, borderRadius: 9, background: 'transparent', color: CA, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                + Ajouter un point fort
              </button>
            </>
          )}

          {onglet === 'reservation' && (
            <Sec titre="Section réservation">
              <Champ label="Titre spécialité"><Input value={config.titreSpecial} onChange={(v: string) => set('titreSpecial', v)} /></Champ>
              <Champ label="Description spécialité"><Textarea value={config.descSpecial} onChange={(v: string) => set('descSpecial', v)} rows={3} /></Champ>
              <Champ label="Photo de fond réservation"><Input value={config.photoReservation} onChange={(v: string) => set('photoReservation', v)} /></Champ>
            </Sec>
          )}

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
                    <Input value={h} onChange={(v: string) => updHoraire(i, v)} placeholder="Lun – Ven : 10h – 21h" />
                  </div>
                ))}
              </Sec>
              <Sec titre="Réseaux sociaux">
                {(['facebook', 'twitter', 'youtube', 'instagram'] as const).map(res => (
                  <Champ key={res} label={res.charAt(0).toUpperCase() + res.slice(1) + ' (URL)'}>
                    <Input value={config.reseaux?.[res] || ''} onChange={(v: string) => set('reseaux', { ...config.reseaux, [res]: v })} placeholder={`https://${res}.com/...`} />
                  </Champ>
                ))}
              </Sec>
              <Sec titre="Google Maps">
                <Champ label="URL iFrame" desc="Google Maps > Partager > Intégrer une carte"><Textarea value={config.coordGoogleMaps} onChange={(v: string) => set('coordGoogleMaps', v)} rows={3} /></Champ>
              </Sec>
            </>
          )}
        </div>

        <div style={{ padding: '13px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 10 }}>
          {resetConfirm ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 7, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#991b1b', fontWeight: 600, flex: 1 }}>⚠️ Effacer toute la config?</span>
              <button onClick={() => { setConfig({...CONFIG_BISTRO_DEFAUT}); setResetConfirm(false); }} style={{ padding: '4px 10px', borderRadius: 5, background: '#dc2626', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✓ Confirmer</button>
              <button onClick={() => setResetConfirm(false)} style={{ padding: '4px 8px', borderRadius: 5, background: '#f3f4f6', border: 'none', color: '#555', fontSize: 11, cursor: 'pointer' }}>Annuler</button>
            </div>
          ) : (
            <button onClick={() => setResetConfirm(true)} style={{ width: '100%', padding: '6px 0', borderRadius: 7, background: 'transparent', border: '1.5px solid #fca5a5', color: '#dc2626', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              🗑️ Réinitialiser la config
            </button>
          )}
          <button onClick={() => setApercu(!apercu)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: `1.5px solid #1a1410`, background: apercu ? '#1a1410' : 'transparent', color: apercu ? CA : '#1a1410', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}>
            {apercu ? '✕ Fermer' : '👁 Aperçu'}
          </button>
          <button onClick={handleSave} disabled={sauvegarde === 'loading'} style={{ flex: 2, padding: '9px 0', borderRadius: 8, border: 'none', background: sauvegarde === 'ok' ? '#10b981' : sauvegarde === 'err' ? '#dc2626' : '#1a1410', color: sauvegarde === 'ok' || sauvegarde === 'err' ? '#fff' : CA, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'background .3s' }}>
            {sauvegarde === 'loading' ? '⏳ Sauvegarde...' : sauvegarde === 'ok' ? '✅ Sauvegardé!' : sauvegarde === 'err' ? '❌ Erreur' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Aperçu 3 modes */}
      <div style={{ flex: 1, display: apercu ? 'flex' : 'none', flexDirection: 'column', background: '#0d0d0d', overflow: 'hidden' }}>
        <div style={{ background: '#1a1200', borderBottom: '1px solid #f59e0b44', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 13 }}>⚠️</span>
          <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>Sauvegardez vos changements pour les voir dans l'aperçu</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', borderBottom: '1px solid #333', flexShrink: 0 }}>
          {([['desktop', '🖥️', 'Bureau'], ['tablette', '📲', 'Tablette'], ['mobile', '📱', 'Mobile']] as const).map(([m, ico, label]) => (
            <button key={m} onClick={() => setModeApercu(m)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, border: 'none', background: modeApercu === m ? `#8b691433` : 'transparent', color: modeApercu === m ? '#8b6914' : '#555', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all .2s' }}>
              <span style={{ fontSize: 16 }}>{ico}</span><span>{label}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '12px 8px' }}>
          <div style={{ width: modeApercu === 'mobile' ? 375 : modeApercu === 'tablette' ? 768 : '100%', height: '100%', overflow: 'hidden', borderRadius: modeApercu === 'mobile' ? 20 : modeApercu === 'tablette' ? 8 : 4, border: `${modeApercu === 'mobile' ? 4 : 2}px solid #333`, flexShrink: 0, background: '#fff' }}>
            <iframe key={modeApercu} src={`/site-preview?vendeurId=${vendeurId}`}
              style={{ width: modeApercu === 'mobile' ? 375 : modeApercu === 'tablette' ? 768 : '100%', height: '100%', border: 'none', display: 'block' }} title="Aperçu" />
          </div>
        </div>
      </div>
      {!apercu && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d0d', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 52 }}>☕</div>
          <p style={{ fontSize: 15, color: '#8b6914', fontWeight: 600, fontFamily: 'sans-serif' }}>Cliquez sur "Aperçu" pour voir votre site</p>
          <p style={{ fontSize: 12, color: `#8b691460`, fontFamily: 'sans-serif' }}>Template Bistro & Café</p>
        </div>
      )}
    </div>
  );
}