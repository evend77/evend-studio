// src/pages/studio/ConfigTemplateAvocat.tsx
// e-Vend Studio — Configuration du template Bureau d'Avocat

import { useState, useEffect } from 'react';
import TemplateAvocat, { CONFIG_AVOCAT_DEFAUT } from '../../templates/TemplateAvocat';
import type { ConfigAvocat, SectionConfig, DomaineJuridique, MembreEquipe, AvisClient, FaqItem } from '../../templates/TemplateAvocat';

type Onglet = 'identite' | 'apparence' | 'sections' | 'stats' | 'domaines' | 'equipe' | 'avis' | 'faq' | 'consultation' | 'contact';

const CO = '#c9a84c'; // or

// ── Composants UI ──────────────────────────────────────────────────────────────
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
  <div style={{ marginBottom: 16 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>{label}</label>
    {desc && <p style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>{desc}</p>}
    {children}
  </div>
);
const Sec = ({ titre, children }: any) => (
  <div style={{ marginBottom: 24 }}>
    <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as any, letterSpacing: '0.12em', color: '#aaa', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>{titre}</h3>
    {children}
  </div>
);

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
    hero: '🏛️', stats: '📊', apropos: '📖', domaines: '⚖️',
    equipe: '👥', avis: '⭐', consultation: '📅', faq: '❓', contact: '📍',
  };

  return (
    <div>
      <div style={{ background: '#fef9ec', border: '1px solid #f5d87a', borderRadius: 8, padding: 10, fontSize: 12, color: '#7a5a00', marginBottom: 16 }}>
        <strong>📐 Sections du site</strong><br />
        Activez/désactivez chaque section avec le toggle. Réordonnez avec les flèches ▲▼.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map((sec, i) => (
          <div key={sec.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: sec.actif ? '#fffbf0' : '#fafafa',
            border: `2px solid ${sec.actif ? '#f5d87a' : '#e5e7eb'}`,
            borderRadius: 10, padding: '10px 12px', transition: 'all .2s',
            opacity: sec.actif ? 1 : 0.55,
          }}>
            <span style={{ fontSize: 18, width: 26, textAlign: 'center', flexShrink: 0 }}>{icones[sec.id] || '📄'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#aaa', minWidth: 18 }}>#{i + 1}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: sec.actif ? '#1a1a1a' : '#999' }}>{sec.label}</span>
              </div>
              <span style={{ fontSize: 10, color: '#aaa' }}>{sec.id}</span>
            </div>
            {/* Toggle */}
            <button onClick={() => toggle(sec.id)} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: sec.actif ? CO : '#ddd', position: 'relative', flexShrink: 0, transition: 'background .25s' }}>
              <div style={{ position: 'absolute', top: 3, left: sec.actif ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </button>
            {/* Flèches */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
              <button onClick={() => deplacer(i, -1)} disabled={i === 0} style={{ width: 24, height: 20, border: '1px solid #ddd', borderRadius: 4, background: i === 0 ? '#f5f5f5' : '#fff', cursor: i === 0 ? 'default' : 'pointer', fontSize: 10, color: i === 0 ? '#ccc' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
              <button onClick={() => deplacer(i, 1)} disabled={i === sorted.length - 1} style={{ width: 24, height: 20, border: '1px solid #ddd', borderRadius: 4, background: i === sorted.length - 1 ? '#f5f5f5' : '#fff', cursor: i === sorted.length - 1 ? 'default' : 'pointer', fontSize: 10, color: i === sorted.length - 1 ? '#ccc' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: '8px 12px', background: '#f5f5f5', borderRadius: 8, fontSize: 12, color: '#666' }}>
        <strong>{sorted.filter(s => s.actif).length}</strong> section{sorted.filter(s => s.actif).length > 1 ? 's' : ''} active{sorted.filter(s => s.actif).length > 1 ? 's' : ''} sur {sorted.length}
      </div>
    </div>
  );
}

// ── Palettes ───────────────────────────────────────────────────────────────────
const PALETTES = [
  { nom: 'Marine & Or (défaut)', cf: '#0d1b2e', cfc: '#162035', cfl: '#f9f6f0', co: '#c9a84c', ct: '#0d1b2e' },
  { nom: 'Charbon & Bordeaux',   cf: '#1a0e0e', cfc: '#2a1818', cfl: '#fdf5f5', co: '#b04040', ct: '#1a0e0e' },
  { nom: 'Ardoise & Émeraude',   cf: '#0d1f1f', cfc: '#163030', cfl: '#f0faf8', co: '#2e9b7e', ct: '#0d1f1f' },
  { nom: 'Nuit & Argent',        cf: '#0f0f1a', cfc: '#18182a', cfl: '#f5f5ff', co: '#a0a0c8', ct: '#0f0f1a' },
  { nom: 'Bois & Bronze',        cf: '#1a1208', cfc: '#2a1e10', cfl: '#fdf8f0', co: '#b87c3a', ct: '#1a1208' },
  { nom: 'Ardoise & Or rose',    cf: '#1a1520', cfc: '#251e30', cfl: '#fdf5f8', co: '#c9806a', ct: '#1a1520' },
];

// ── Composant principal ────────────────────────────────────────────────────────
interface Props {
  vendeurId: string;
  configInitiale?: Partial<ConfigAvocat>;
  onSauvegarde?: (config: ConfigAvocat) => Promise<void>;
}

export default function ConfigTemplateAvocat({ vendeurId, configInitiale, onSauvegarde }: Props) {
  const [config, setConfig] = useState<ConfigAvocat>({ ...CONFIG_AVOCAT_DEFAUT, ...configInitiale });
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

  const set = (k: keyof ConfigAvocat, v: any) => setConfig(prev => ({ ...prev, [k]: v }));

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
          body: JSON.stringify({ config, template_id: 'vitrine-avocat' }),
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

  // Helpers tableaux
  const ea = <T,>(val: any, def: T[]): T[] => Array.isArray(val) && val.length > 0 ? val : def;
  const updDomaine = (i: number, k: keyof DomaineJuridique, v: string) => { const d = [...ea(config.domaines, CONFIG_AVOCAT_DEFAUT.domaines)]; d[i] = { ...d[i], [k]: v }; set('domaines', d); };
  const addDomaine = () => set('domaines', [...ea(config.domaines, CONFIG_AVOCAT_DEFAUT.domaines), { nom: 'Nouveau domaine', description: '', icone: '⚖️' }]);
  const delDomaine = (i: number) => { const d = [...ea(config.domaines, CONFIG_AVOCAT_DEFAUT.domaines)]; d.splice(i, 1); set('domaines', d); };

  const updMembre = (i: number, k: keyof MembreEquipe, v: string) => { const m = [...ea(config.equipe, CONFIG_AVOCAT_DEFAUT.equipe)]; m[i] = { ...m[i], [k]: v }; set('equipe', m); };
  const addMembre = () => set('equipe', [...ea(config.equipe, CONFIG_AVOCAT_DEFAUT.equipe), { nom: 'Me Prénom Nom', titre: 'Avocat(e)', description: '', photo: '' }]);
  const delMembre = (i: number) => { const m = [...ea(config.equipe, CONFIG_AVOCAT_DEFAUT.equipe)]; m.splice(i, 1); set('equipe', m); };

  const updAvis = (i: number, k: keyof AvisClient, v: any) => { const a = [...ea(config.avis, CONFIG_AVOCAT_DEFAUT.avis)]; a[i] = { ...a[i], [k]: v }; set('avis', a); };
  const addAvis = () => set('avis', [...ea(config.avis, CONFIG_AVOCAT_DEFAUT.avis), { titre: '', texte: '', auteur: '', role: '', note: 5 }]);
  const delAvis = (i: number) => { const a = [...ea(config.avis, CONFIG_AVOCAT_DEFAUT.avis)]; a.splice(i, 1); set('avis', a); };

  const updFaq = (i: number, k: keyof FaqItem, v: string) => { const f = [...ea(config.faq, CONFIG_AVOCAT_DEFAUT.faq)]; f[i] = { ...f[i], [k]: v }; set('faq', f); };
  const addFaq = () => set('faq', [...ea(config.faq, CONFIG_AVOCAT_DEFAUT.faq), { question: 'Nouvelle question ?', reponse: '' }]);
  const delFaq = (i: number) => { const f = [...ea(config.faq, CONFIG_AVOCAT_DEFAUT.faq)]; f.splice(i, 1); set('faq', f); };

  const updStat = (i: number, k: 'valeur' | 'label', v: string) => { const s = [...ea(config.stats, CONFIG_AVOCAT_DEFAUT.stats)]; s[i] = { ...s[i], [k]: v }; set('stats', s); };
  const updHoraire = (i: number, v: string) => { const h = [...ea(config.horaires, CONFIG_AVOCAT_DEFAUT.horaires)]; h[i] = v; set('horaires', h); };

  const ONGLETS: { id: Onglet; label: string; emoji: string }[] = [
    { id: 'identite',     label: 'Identité',     emoji: '🏷️' },
    { id: 'apparence',    label: 'Apparence',    emoji: '🎨' },
    { id: 'sections',     label: 'Sections',     emoji: '📐' },
    { id: 'stats',        label: 'Chiffres',     emoji: '📊' },
    { id: 'domaines',     label: 'Domaines',     emoji: '⚖️' },
    { id: 'equipe',       label: 'Équipe',       emoji: '👥' },
    { id: 'avis',         label: 'Avis',         emoji: '⭐' },
    { id: 'faq',          label: 'FAQ',          emoji: '❓' },
    { id: 'consultation', label: 'Consultation', emoji: '📅' },
    { id: 'contact',      label: 'Contact',      emoji: '📍' },
  ];

  const domaines = ea(config.domaines, CONFIG_AVOCAT_DEFAUT.domaines);
  const equipe = ea(config.equipe, CONFIG_AVOCAT_DEFAUT.equipe);
  const avis = ea(config.avis, CONFIG_AVOCAT_DEFAUT.avis);
  const faq = ea(config.faq, CONFIG_AVOCAT_DEFAUT.faq);
  const stats = ea(config.stats, CONFIG_AVOCAT_DEFAUT.stats);
  const horaires = ea(config.horaires, CONFIG_AVOCAT_DEFAUT.horaires);
  const sections = ea(config.sections, CONFIG_AVOCAT_DEFAUT.sections);

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: "'Inter', sans-serif", background: '#f8f9fb' }}>
      {/* ── Panneau gauche ── */}
      <div style={{ width: 380, minWidth: 340, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 18px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, #0d1b2e, ${CO})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚖️</div>
            <div>
              <p style={{ fontSize: 11, color: '#888', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Template Gratuit</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Bureau d'Avocat</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingBottom: 12 }}>
            {ONGLETS.map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)} style={{
                padding: '4px 9px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500,
                background: onglet === o.id ? '#0d1b2e' : '#f3f4f6',
                color: onglet === o.id ? CO : '#555',
                transition: 'all 0.15s',
              }}>
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>

          {/* IDENTITÉ */}
          {onglet === 'identite' && (
            <>
              <Sec titre="Nom & Accroche">
                <Champ label="Nom du cabinet" desc="Ex: Dubois & Associés"><Input value={config.nomCabinet} onChange={(v: string) => set('nomCabinet', v)} placeholder="Dubois & Associés" /></Champ>
                <Champ label="Slogan (1re partie)"><Input value={config.slogan} onChange={(v: string) => set('slogan', v)} placeholder="La justice servie avec" /></Champ>
                <Champ label="Slogan (2e partie — en or)" desc="Affiché en italique couleur or"><Input value={config.sloganAccent} onChange={(v: string) => set('sloganAccent', v)} placeholder="intégrité." /></Champ>
                <Champ label="Description"><Textarea value={config.description} onChange={(v: string) => set('description', v)} rows={3} /></Champ>
              </Sec>
              <Sec titre="Photos">
                <Champ label="Photo Hero (avocat/cabinet)" desc="Grande photo côté droit du hero"><Input value={config.photoHero} onChange={(v: string) => set('photoHero', v)} placeholder="https://..." /></Champ>
                <Champ label="Photo À propos"><Input value={config.photoAPropos} onChange={(v: string) => set('photoAPropos', v)} placeholder="https://..." /></Champ>
                <Champ label="Photo Consultation"><Input value={config.photoConsultation} onChange={(v: string) => set('photoConsultation', v)} placeholder="https://..." /></Champ>
              </Sec>
              <Sec titre="CTA">
                <Champ label="Texte bouton principal"><Input value={config.boutonsContact} onChange={(v: string) => set('boutonsContact', v)} placeholder="Consultation gratuite →" /></Champ>
                <Champ label="Titre CTA"><Input value={config.titreCTA} onChange={(v: string) => set('titreCTA', v)} /></Champ>
              </Sec>
            </>
          )}

          {/* APPARENCE */}
          {onglet === 'apparence' && (
            <>
              <Sec titre="Palettes prédéfinies">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  {PALETTES.map(p => (
                    <button key={p.nom} onClick={() => setConfig(prev => ({ ...prev, couleurFond: p.cf, couleurFondCarte: p.cfc, couleurFondClair: p.cfl, couleurOr: p.co, couleurTexteSombre: p.ct }))}
                      style={{ padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 10, fontWeight: 600, border: `2px solid ${config.couleurOr === p.co && config.couleurFond === p.cf ? p.co : '#e5e7eb'}`, background: p.cf, color: p.co, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 3 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cf, border: '1px solid rgba(255,255,255,0.2)' }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cfc }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.co }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cfl, border: '1px solid #ddd' }} />
                      </div>
                      <span style={{ color: '#fff', fontSize: 9 }}>{p.nom}</span>
                    </button>
                  ))}
                </div>
              </Sec>
              <Sec titre="Couleurs personnalisées">
                {([
                  ['couleurFond', 'Fond principal (marine)'],
                  ['couleurFondCarte', 'Fond cartes'],
                  ['couleurFondClair', 'Fond sections claires'],
                  ['couleurOr', 'Couleur accent (or)'],
                ] as [keyof ConfigAvocat, string][]).map(([key, label]) => (
                  <Champ key={key} label={label}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="color" value={(config[key] as string) || '#000000'} onChange={e => set(key, e.target.value)} style={{ width: 40, height: 34, padding: 2, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }} />
                      <Input value={config[key] as string} onChange={(v: string) => set(key, v)} placeholder="#000000" />
                    </div>
                  </Champ>
                ))}
              </Sec>
              {/* Aperçu */}
              <div style={{ borderRadius: 10, overflow: 'hidden', height: 50, display: 'flex' }}>
                <div style={{ flex: 2, background: config.couleurFond, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: config.couleurOr, fontSize: 10, fontWeight: 700 }}>FOND</span></div>
                <div style={{ flex: 1, background: config.couleurFondCarte, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: config.couleurOr, fontSize: 10, fontWeight: 700 }}>CARTE</span></div>
                <div style={{ flex: 1, background: config.couleurOr, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: config.couleurTexteSombre || '#000', fontSize: 10, fontWeight: 700 }}>OR</span></div>
                <div style={{ flex: 1, background: config.couleurFondClair, border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#555', fontSize: 10, fontWeight: 700 }}>CLAIR</span></div>
              </div>
            </>
          )}

          {/* SECTIONS */}
          {onglet === 'sections' && (
            <SectionsManager sections={sections} onChange={(s) => set('sections', s)} />
          )}

          {/* STATS */}
          {onglet === 'stats' && (
            <>
              <div style={{ background: '#fef9ec', border: '1px solid #f5d87a', borderRadius: 8, padding: 10, fontSize: 12, color: '#7a5a00', marginBottom: 16 }}>
                📊 Les chiffres s'animent au scroll avec un compteur progressif. Format: "20+" ou "95%"
              </div>
              {stats.map((s, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                  <Champ label={`Stat ${i + 1} — Valeur`}><Input value={s.valeur} onChange={(v: string) => updStat(i, 'valeur', v)} placeholder="20+" /></Champ>
                  <Champ label="Libellé"><Input value={s.label} onChange={(v: string) => updStat(i, 'label', v)} placeholder="Années d'expérience" /></Champ>
                </div>
              ))}
            </>
          )}

          {/* DOMAINES */}
          {onglet === 'domaines' && (
            <>
              {domaines.map((d, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Domaine {i + 1}</span>
                    <button onClick={() => delDomaine(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Nom"><Input value={d.nom} onChange={(v: string) => updDomaine(i, 'nom', v)} placeholder="Droit de la famille" /></Champ>
                  <Champ label="Description"><Textarea value={d.description} onChange={(v: string) => updDomaine(i, 'description', v)} rows={2} /></Champ>
                  <Champ label="Icône (emoji)"><Input value={d.icone} onChange={(v: string) => updDomaine(i, 'icone', v)} placeholder="⚖️" /></Champ>
                </div>
              ))}
              <button onClick={addDomaine} style={{ width: '100%', padding: 10, border: '2px dashed #0d1b2e', borderRadius: 10, background: 'transparent', color: '#0d1b2e', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                + Ajouter un domaine
              </button>
            </>
          )}

          {/* ÉQUIPE */}
          {onglet === 'equipe' && (
            <>
              {equipe.map((m, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Membre {i + 1}</span>
                    <button onClick={() => delMembre(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Nom complet"><Input value={m.nom} onChange={(v: string) => updMembre(i, 'nom', v)} placeholder="Me Anna Dubois" /></Champ>
                  <Champ label="Titre"><Input value={m.titre} onChange={(v: string) => updMembre(i, 'titre', v)} placeholder="Associée fondatrice" /></Champ>
                  <Champ label="Barreau (optionnel)"><Input value={m.barreaux || ''} onChange={(v: string) => updMembre(i, 'barreaux', v)} placeholder="Barreau du Québec, 2004" /></Champ>
                  <Champ label="Description"><Textarea value={m.description} onChange={(v: string) => updMembre(i, 'description', v)} rows={2} /></Champ>
                  <Champ label="Photo (URL)"><Input value={m.photo} onChange={(v: string) => updMembre(i, 'photo', v)} placeholder="https://..." /></Champ>
                </div>
              ))}
              <button onClick={addMembre} style={{ width: '100%', padding: 10, border: '2px dashed #0d1b2e', borderRadius: 10, background: 'transparent', color: '#0d1b2e', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                + Ajouter un membre
              </button>
            </>
          )}

          {/* AVIS */}
          {onglet === 'avis' && (
            <>
              {avis.map((a, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Avis {i + 1}</span>
                    <button onClick={() => delAvis(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Titre de l'avis"><Input value={a.titre} onChange={(v: string) => updAvis(i, 'titre', v)} placeholder="Service exceptionnel" /></Champ>
                  <Champ label="Texte"><Textarea value={a.texte} onChange={(v: string) => updAvis(i, 'texte', v)} rows={2} /></Champ>
                  <Champ label="Auteur"><Input value={a.auteur} onChange={(v: string) => updAvis(i, 'auteur', v)} placeholder="Marie L." /></Champ>
                  <Champ label="Rôle / contexte"><Input value={a.role} onChange={(v: string) => updAvis(i, 'role', v)} placeholder="Cliente, droit familial" /></Champ>
                  <Champ label="Note (1-5)">
                    <select value={a.note} onChange={e => updAvis(i, 'note', parseInt(e.target.value))} style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, background: '#fff' }}>
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ★</option>)}
                    </select>
                  </Champ>
                </div>
              ))}
              <button onClick={addAvis} style={{ width: '100%', padding: 10, border: '2px dashed #0d1b2e', borderRadius: 10, background: 'transparent', color: '#0d1b2e', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                + Ajouter un avis
              </button>
            </>
          )}

          {/* FAQ */}
          {onglet === 'faq' && (
            <>
              {faq.map((f, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Question {i + 1}</span>
                    <button onClick={() => delFaq(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Question"><Input value={f.question} onChange={(v: string) => updFaq(i, 'question', v)} /></Champ>
                  <Champ label="Réponse"><Textarea value={f.reponse} onChange={(v: string) => updFaq(i, 'reponse', v)} rows={3} /></Champ>
                </div>
              ))}
              <button onClick={addFaq} style={{ width: '100%', padding: 10, border: '2px dashed #0d1b2e', borderRadius: 10, background: 'transparent', color: '#0d1b2e', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                + Ajouter une question
              </button>
            </>
          )}

          {/* CONSULTATION */}
          {onglet === 'consultation' && (
            <Sec titre="Section consultation gratuite">
              <Champ label="Titre"><Input value={config.titreConsultation} onChange={(v: string) => set('titreConsultation', v)} /></Champ>
              <Champ label="Description"><Textarea value={config.descConsultation} onChange={(v: string) => set('descConsultation', v)} rows={3} /></Champ>
              <Champ label="Durée"><Input value={config.dureeConsultation} onChange={(v: string) => set('dureeConsultation', v)} placeholder="30 min" /></Champ>
              <Champ label="Type de consultation"><Input value={config.typeConsultation} onChange={(v: string) => set('typeConsultation', v)} placeholder="Virtuelle ou en personne" /></Champ>
              <Champ label="Photo consultation (URL)"><Input value={config.photoConsultation} onChange={(v: string) => set('photoConsultation', v)} /></Champ>
            </Sec>
          )}

          {/* CONTACT */}
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
                  <div key={i} style={{ marginBottom: 8 }}>
                    <Input value={h} onChange={(v: string) => updHoraire(i, v)} placeholder="Lun – Ven : 8h30 – 17h30" />
                  </div>
                ))}
              </Sec>
              <Sec titre="Google Maps">
                <Champ label="URL iFrame Google Maps" desc="Copiez l'URL depuis Google Maps > Partager > Intégrer une carte"><Textarea value={config.coordGoogleMaps} onChange={(v: string) => set('coordGoogleMaps', v)} rows={3} /></Champ>
              </Sec>
            </>
          )}
        </div>

        {/* Footer boutons */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 10 }}>
          {resetConfirm ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 7, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#991b1b', fontWeight: 600, flex: 1 }}>⚠️ Effacer toute la config?</span>
              <button onClick={() => { setConfig({...CONFIG_AVOCAT_DEFAUT}); setResetConfirm(false); }} style={{ padding: '4px 10px', borderRadius: 5, background: '#dc2626', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✓ Confirmer</button>
              <button onClick={() => setResetConfirm(false)} style={{ padding: '4px 8px', borderRadius: 5, background: '#f3f4f6', border: 'none', color: '#555', fontSize: 11, cursor: 'pointer' }}>Annuler</button>
            </div>
          ) : (
            <button onClick={() => setResetConfirm(true)} style={{ width: '100%', padding: '6px 0', borderRadius: 7, background: 'transparent', border: '1.5px solid #fca5a5', color: '#dc2626', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              🗑️ Réinitialiser la config
            </button>
          )}
          <button onClick={() => setApercu(!apercu)} style={{
            flex: 1, padding: '10px 0', borderRadius: 8,
            border: '1.5px solid #0d1b2e',
            background: apercu ? '#0d1b2e' : 'transparent',
            color: apercu ? CO : '#0d1b2e',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
          }}>
            {apercu ? '✕ Fermer' : '👁 Aperçu'}
          </button>
          <button onClick={handleSave} disabled={sauvegarde === 'loading'} style={{
            flex: 2, padding: '10px 0', borderRadius: 8, border: 'none',
            background: sauvegarde === 'ok' ? '#10b981' : sauvegarde === 'err' ? '#dc2626' : '#0d1b2e',
            color: sauvegarde === 'ok' || sauvegarde === 'err' ? '#fff' : CO,
            fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background .3s',
          }}>
            {sauvegarde === 'loading' ? '⏳ Sauvegarde...' : sauvegarde === 'ok' ? '✅ Sauvegardé!' : sauvegarde === 'err' ? '❌ Erreur' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>

            {/* Aperçu 3 modes */}
      <div style={{ flex: 1, display: apercu ? 'flex' : 'none', flexDirection: 'column', background: '#0d1b2e', overflow: 'hidden' }}>
        <div style={{ background: '#1a1200', borderBottom: '1px solid #f59e0b44', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 13 }}>⚠️</span>
          <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>Sauvegardez vos changements pour les voir dans l'aperçu</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', borderBottom: '1px solid #333', flexShrink: 0 }}>
          {([['desktop', '🖥️', 'Bureau'], ['tablette', '📲', 'Tablette'], ['mobile', '📱', 'Mobile']] as const).map(([m, ico, label]) => (
            <button key={m} onClick={() => setModeApercu(m)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, border: 'none', background: modeApercu === m ? `#c9a84c33` : 'transparent', color: modeApercu === m ? '#c9a84c' : '#555', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all .2s' }}>
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
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1b2e', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 52 }}>⚖️</div>
          <p style={{ fontSize: 15, color: '#c9a84c', fontWeight: 600, fontFamily: 'sans-serif' }}>Cliquez sur "Aperçu" pour voir votre site</p>
          <p style={{ fontSize: 12, color: `#c9a84c60`, fontFamily: 'sans-serif' }}>Template Bureau d'Avocat</p>
        </div>
      )}
    </div>
  );
}