// src/pages/studio/ConfigTemplatePaysager.tsx
// e-Vend Studio — Configuration du template Entretien Paysager

import { useState, useEffect } from 'react';
import TemplatePaysager, { CONFIG_PAYSAGER_DEFAUT } from '../../templates/TemplatePaysager';
import type { ConfigPaysager, ServicePaysager, AvisPaysager, EtapeProcessus, SectionConfig } from '../../templates/TemplatePaysager';

type Onglet = 'identite' | 'apparence' | 'sections' | 'stats' | 'services' | 'processus' | 'avis' | 'galerie' | 'devis' | 'contact';

const CP = '#b5e24a';

const Input = ({ value, onChange, placeholder, type = 'text' }: any) => (
  <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = CP} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }: any) => (
  <textarea value={value} placeholder={placeholder} rows={rows} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none', resize: 'vertical' as any, fontFamily: 'inherit', background: '#fff', color: '#1a1a1a', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = CP} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
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

const PALETTES = [
  { nom: 'Vert Citron (défaut)', cf: '#0f1a0f', cfc: '#1a2e1a', ca: '#b5e24a', ct: '#0f1a0f' },
  { nom: 'Ardoise & Cyan',       cf: '#0d1a26', cfc: '#162035', ca: '#22d3ee', ct: '#0d1a26' },
  { nom: 'Charbon & Orange',     cf: '#1a1210', cfc: '#2a1f1a', ca: '#f97316', ct: '#1a1210' },
  { nom: 'Nuit & Violet',        cf: '#120a20', cfc: '#1e1030', ca: '#a78bfa', ct: '#120a20' },
  { nom: 'Forêt & Or',           cf: '#0d1a12', cfc: '#162418', ca: '#f59e0b', ct: '#0d1a12' },
  { nom: 'Noir & Blanc',         cf: '#0a0a0a', cfc: '#141414', ca: '#f5f5f5', ct: '#0a0a0a' },
];

// ─── COMPOSANT SECTIONS MANAGER ──────────────────────────────────────────────

function SectionsManager({ sections, onChange, couleurAccent }: {
  sections: SectionConfig[];
  onChange: (s: SectionConfig[]) => void;
  couleurAccent: string;
}) {
  const ca = couleurAccent;

  // Déplacer une section vers le haut ou le bas
  const deplacer = (index: number, direction: -1 | 1) => {
    const arr = [...sections].sort((a, b) => a.ordre - b.ordre);
    const nouvelIndex = index + direction;
    if (nouvelIndex < 0 || nouvelIndex >= arr.length) return;
    // Échanger les ordres
    const tmp = arr[index].ordre;
    arr[index] = { ...arr[index], ordre: arr[nouvelIndex].ordre };
    arr[nouvelIndex] = { ...arr[nouvelIndex], ordre: tmp };
    onChange(arr);
  };

  // Activer / désactiver une section
  const toggleActif = (id: string) => {
    onChange(sections.map(s => s.id === id ? { ...s, actif: !s.actif } : s));
  };

  const sorted = [...sections].sort((a, b) => a.ordre - b.ordre);

  return (
    <div>
      <div style={{ background: '#f0f7e6', border: '1px solid #c5e07a', borderRadius: 8, padding: 10, fontSize: 12, color: '#3a5a00', marginBottom: 16 }}>
        <strong>📐 Sections du site</strong><br />
        Activez/désactivez chaque section et réordonnez-les avec les flèches.
        Les changements sont visibles immédiatement dans l'aperçu.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map((sec, i) => (
          <div key={sec.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: sec.actif ? '#f8fff0' : '#fafafa',
            border: `2px solid ${sec.actif ? '#c5e07a' : '#e5e7eb'}`,
            borderRadius: 10, padding: '12px 14px',
            transition: 'all .2s',
            opacity: sec.actif ? 1 : 0.55,
          }}>
            {/* Icône section */}
            <div style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>
              {sec.id === 'hero'       ? '🌿' :
               sec.id === 'apropos'   ? '📖' :
               sec.id === 'services'  ? '🔧' :
               sec.id === 'processus' ? '⚙️' :
               sec.id === 'avis'      ? '⭐' :
               sec.id === 'galerie'   ? '📸' :
               sec.id === 'devis'     ? '📋' :
               sec.id === 'cta'       ? '🚀' : '📄'}
            </div>

            {/* Numéro d'ordre + label */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#aaa', minWidth: 18 }}>#{i + 1}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: sec.actif ? '#1a1a1a' : '#999' }}>{sec.label}</span>
              </div>
              <span style={{ fontSize: 11, color: '#aaa' }}>{sec.id}</span>
            </div>

            {/* Toggle ON/OFF */}
            <button
              onClick={() => toggleActif(sec.id)}
              title={sec.actif ? 'Désactiver cette section' : 'Activer cette section'}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: sec.actif ? ca : '#ddd',
                position: 'relative', flexShrink: 0,
                transition: 'background .25s',
              }}>
              <div style={{
                position: 'absolute', top: 3, left: sec.actif ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                transition: 'left .25s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </button>

            {/* Flèches haut/bas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
              <button
                onClick={() => deplacer(i, -1)}
                disabled={i === 0}
                title="Monter"
                style={{
                  width: 24, height: 20, border: '1px solid #ddd', borderRadius: 4,
                  background: i === 0 ? '#f5f5f5' : '#fff', cursor: i === 0 ? 'default' : 'pointer',
                  fontSize: 10, color: i === 0 ? '#ccc' : '#555', lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>▲</button>
              <button
                onClick={() => deplacer(i, 1)}
                disabled={i === sorted.length - 1}
                title="Descendre"
                style={{
                  width: 24, height: 20, border: '1px solid #ddd', borderRadius: 4,
                  background: i === sorted.length - 1 ? '#f5f5f5' : '#fff',
                  cursor: i === sorted.length - 1 ? 'default' : 'pointer',
                  fontSize: 10, color: i === sorted.length - 1 ? '#ccc' : '#555', lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>▼</button>
            </div>
          </div>
        ))}
      </div>

      {/* Résumé */}
      <div style={{ marginTop: 16, padding: '10px 14px', background: '#f5f5f5', borderRadius: 8, fontSize: 12, color: '#666' }}>
        <strong>{sorted.filter(s => s.actif).length}</strong> section{sorted.filter(s => s.actif).length > 1 ? 's' : ''} active{sorted.filter(s => s.actif).length > 1 ? 's' : ''} sur {sorted.length} au total
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  vendeurId: string;
  configInitiale?: Partial<ConfigPaysager>;
  onSauvegarde?: (config: ConfigPaysager) => Promise<void>;
}

export default function ConfigTemplatePaysager({ vendeurId, configInitiale, onSauvegarde }: Props) {
  const [config, setConfig] = useState<ConfigPaysager>({ ...CONFIG_PAYSAGER_DEFAUT, ...configInitiale });
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

  const set = (k: keyof ConfigPaysager, v: any) => setConfig(prev => ({ ...prev, [k]: v }));

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
          body: JSON.stringify({ config, template_id: 'vitrine-paysager' }),
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

  // SERVICES
  const updSrv = (i: number, k: keyof ServicePaysager, v: string) => {
    const s = [...config.services]; s[i] = { ...s[i], [k]: v }; set('services', s);
  };
  const addSrv = () => set('services', [...config.services, { nom: 'Nouveau service', description: '', photo: '', icone: '🌿' }]);
  const delSrv = (i: number) => { const s = [...config.services]; s.splice(i, 1); set('services', s); };

  // ÉTAPES
  const updEtape = (i: number, k: keyof EtapeProcessus, v: string) => {
    const e = [...config.etapes]; e[i] = { ...e[i], [k]: v }; set('etapes', e);
  };
  const addEtape = () => set('etapes', [...config.etapes, { numero: String(config.etapes.length + 1), titre: 'Nouvelle étape', description: '' }]);
  const delEtape = (i: number) => { const e = [...config.etapes]; e.splice(i, 1); set('etapes', e); };

  // AVIS
  const updAvis = (i: number, k: keyof AvisPaysager, v: any) => {
    const a = [...config.avis]; a[i] = { ...a[i], [k]: v }; set('avis', a);
  };
  const addAvis = () => set('avis', [...config.avis, { texte: '', auteur: '', ville: '', photo: '', note: 5 }]);
  const delAvis = (i: number) => { const a = [...config.avis]; a.splice(i, 1); set('avis', a); };

  // GALERIE
  const updGal = (i: number, v: string) => { const g = [...config.galerie]; g[i] = v; set('galerie', g); };
  const addGal = () => set('galerie', [...config.galerie, '']);
  const delGal = (i: number) => { const g = [...config.galerie]; g.splice(i, 1); set('galerie', g); };

  // STATS
  const updStat = (i: number, k: 'valeur' | 'label', v: string) => {
    const s = [...config.stats]; s[i] = { ...s[i], [k]: v }; set('stats', s);
  };

  // SERVICES DEVIS
  const updServicesDevis = (i: number, v: string) => {
    const s = [...config.servicesDevis]; s[i] = v; set('servicesDevis', s);
  };

  // HORAIRES
  const updHoraire = (i: number, v: string) => {
    const h = [...config.horaires]; h[i] = v; set('horaires', h);
  };

  const ONGLETS: { id: Onglet; label: string; emoji: string }[] = [
    { id: 'identite',   label: 'Identité',   emoji: '🏷️' },
    { id: 'apparence',  label: 'Apparence',  emoji: '🎨' },
    { id: 'sections',   label: 'Sections',   emoji: '📐' },
    { id: 'stats',      label: 'Stats',      emoji: '📊' },
    { id: 'services',   label: 'Services',   emoji: '🌿' },
    { id: 'processus',  label: 'Processus',  emoji: '⚙️' },
    { id: 'avis',       label: 'Avis',       emoji: '⭐' },
    { id: 'galerie',    label: 'Galerie',    emoji: '📸' },
    { id: 'devis',      label: 'Devis',      emoji: '📋' },
    { id: 'contact',    label: 'Contact',    emoji: '📍' },
  ];

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: "'Inter', sans-serif", background: '#f8f9fb' }}>
      {/* ── Panneau gauche ── */}
      <div style={{ width: 380, minWidth: 340, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 20px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, #0f1a0f, ${CP})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌿</div>
            <div>
              <p style={{ fontSize: 11, color: '#888', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Template Gratuit</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Entretien Paysager</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingBottom: 12 }}>
            {ONGLETS.map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)} style={{
                padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                background: onglet === o.id ? '#0f1a0f' : '#f3f4f6',
                color: onglet === o.id ? CP : '#555',
                transition: 'all 0.15s',
              }}>
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

          {/* ── SECTIONS ── */}
          {onglet === 'sections' && (
            <SectionsManager
              sections={Array.isArray(config.sections) ? config.sections : CONFIG_PAYSAGER_DEFAUT.sections}
              onChange={(s) => set('sections', s)}
              couleurAccent={config.couleurAccent || '#b5e24a'}
            />
          )}

          {/* ── IDENTITÉ ── */}
          {onglet === 'identite' && (
            <>
              <Sec titre="Nom & Accroche">
                <Champ label="Nom de l'entreprise"><Input value={config.nomEntreprise} onChange={(v: string) => set('nomEntreprise', v)} placeholder="VertPro Aménagement" /></Champ>
                <Champ label="Slogan (1ère partie)" desc="La fin du slogan est en couleur accent"><Input value={config.slogan} onChange={(v: string) => set('slogan', v)} placeholder="Des pelouses magnifiques," /></Champ>
                <Champ label="Slogan (2e partie — en couleur)"><Input value={config.sloganAccent} onChange={(v: string) => set('sloganAccent', v)} placeholder="sans effort." /></Champ>
                <Champ label="Description courte"><Textarea value={config.description} onChange={(v: string) => set('description', v)} rows={3} /></Champ>
              </Sec>
              <Sec titre="Photos">
                <Champ label="Photo Hero (URL)" desc="Grande photo de fond page accueil"><Input value={config.photoHero} onChange={(v: string) => set('photoHero', v)} /></Champ>
                <Champ label="Photo À propos / Processus (URL)"><Input value={config.photoAPropos} onChange={(v: string) => set('photoAPropos', v)} /></Champ>
                <Champ label="Photo CTA finale (URL)" desc="Photo de fond de la section CTA finale"><Input value={config.photoCTA} onChange={(v: string) => set('photoCTA', v)} /></Champ>
              </Sec>
              <Sec titre="CTA">
                <Champ label="Titre CTA finale"><Input value={config.titreCTA} onChange={(v: string) => set('titreCTA', v)} /></Champ>
                <Champ label="Texte bouton soumission"><Input value={config.boutonsDevis} onChange={(v: string) => set('boutonsDevis', v)} /></Champ>
              </Sec>
            </>
          )}

          {/* ── APPARENCE ── */}
          {onglet === 'apparence' && (
            <>
              <Sec titre="Palettes prédéfinies">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  {PALETTES.map(p => (
                    <button key={p.nom} onClick={() => setConfig(prev => ({ ...prev, couleurFond: p.cf, couleurFondCarte: p.cfc, couleurAccent: p.ca, couleurTexteSombre: p.ct }))}
                      style={{
                        padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                        border: `2px solid ${config.couleurAccent === p.ca && config.couleurFond === p.cf ? p.ca : '#e5e7eb'}`,
                        background: p.cf, color: p.ca, display: 'flex', alignItems: 'center', gap: 6, flexDirection: 'column',
                      }}>
                      <div style={{ display: 'flex', gap: 3 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cf, border: '1px solid rgba(255,255,255,0.2)' }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.cfc, border: '1px solid rgba(255,255,255,0.2)' }} />
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: p.ca }} />
                      </div>
                      <span style={{ color: '#1a1a1a', fontSize: 10 }}>{p.nom}</span>
                    </button>
                  ))}
                </div>
              </Sec>
              <Sec titre="Couleurs personnalisées">
                <Champ label="Fond principal">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="color" value={config.couleurFond} onChange={e => set('couleurFond', e.target.value)} style={{ width: 40, height: 34, padding: 2, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }} />
                    <Input value={config.couleurFond} onChange={(v: string) => set('couleurFond', v)} placeholder="#0f1a0f" />
                  </div>
                </Champ>
                <Champ label="Fond cartes / sections">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="color" value={config.couleurFondCarte} onChange={e => set('couleurFondCarte', e.target.value)} style={{ width: 40, height: 34, padding: 2, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }} />
                    <Input value={config.couleurFondCarte} onChange={(v: string) => set('couleurFondCarte', v)} placeholder="#1a2e1a" />
                  </div>
                </Champ>
                <Champ label="Couleur accent (boutons, highlights)">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="color" value={config.couleurAccent} onChange={e => set('couleurAccent', e.target.value)} style={{ width: 40, height: 34, padding: 2, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }} />
                    <Input value={config.couleurAccent} onChange={(v: string) => set('couleurAccent', v)} placeholder="#b5e24a" />
                  </div>
                </Champ>
              </Sec>
              {/* Aperçu */}
              <div style={{ borderRadius: 12, overflow: 'hidden', height: 60, display: 'flex' }}>
                <div style={{ flex: 2, background: config.couleurFond, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: config.couleurAccent, fontSize: 11, fontWeight: 700 }}>FOND</span></div>
                <div style={{ flex: 1.5, background: config.couleurFondCarte, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: config.couleurAccent, fontSize: 11, fontWeight: 700 }}>CARTE</span></div>
                <div style={{ flex: 1, background: config.couleurAccent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: config.couleurTexteSombre || '#000', fontSize: 11, fontWeight: 700 }}>ACCENT</span></div>
              </div>
            </>
          )}

          {/* ── STATS ── */}
          {onglet === 'stats' && (
            <>
              <div style={{ background: '#f0f7e6', border: '1px solid #c5e07a', borderRadius: 8, padding: 10, fontSize: 12, color: '#3a5a00', marginBottom: 16 }}>
                📊 Les stats sont animées avec un compteur qui monte lors du scroll. Utilisez le format "7+" ou "36+" pour inclure le signe plus.
              </div>
              {config.stats.map((s, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                  <Champ label={`Stat ${i + 1} — Valeur`}><Input value={s.valeur} onChange={(v: string) => updStat(i, 'valeur', v)} placeholder="7+" /></Champ>
                  <Champ label="Libellé"><Input value={s.label} onChange={(v: string) => updStat(i, 'label', v)} placeholder="Années d'expérience" /></Champ>
                </div>
              ))}
            </>
          )}

          {/* ── SERVICES ── */}
          {onglet === 'services' && (
            <>
              {config.services.map((s, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Service {i + 1}</span>
                    <button onClick={() => delSrv(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Nom"><Input value={s.nom} onChange={(v: string) => updSrv(i, 'nom', v)} placeholder="Entretien de pelouse" /></Champ>
                  <Champ label="Description"><Textarea value={s.description} onChange={(v: string) => updSrv(i, 'description', v)} rows={2} /></Champ>
                  <Champ label="Icône (emoji)"><Input value={s.icone} onChange={(v: string) => updSrv(i, 'icone', v)} placeholder="🌿" /></Champ>
                  <Champ label="Photo (URL)"><Input value={s.photo} onChange={(v: string) => updSrv(i, 'photo', v)} placeholder="https://..." /></Champ>
                </div>
              ))}
              <button onClick={addSrv} style={{ width: '100%', padding: 10, border: `2px dashed #0f1a0f`, borderRadius: 10, background: 'transparent', color: '#0f1a0f', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                + Ajouter un service
              </button>
            </>
          )}

          {/* ── PROCESSUS ── */}
          {onglet === 'processus' && (
            <>
              {config.etapes.map((e, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Étape {e.numero}</span>
                    <button onClick={() => delEtape(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Numéro"><Input value={e.numero} onChange={(v: string) => updEtape(i, 'numero', v)} placeholder="1" /></Champ>
                  <Champ label="Titre"><Input value={e.titre} onChange={(v: string) => updEtape(i, 'titre', v)} placeholder="Consultation initiale" /></Champ>
                  <Champ label="Description"><Textarea value={e.description} onChange={(v: string) => updEtape(i, 'description', v)} rows={2} /></Champ>
                </div>
              ))}
              <button onClick={addEtape} style={{ width: '100%', padding: 10, border: '2px dashed #0f1a0f', borderRadius: 10, background: 'transparent', color: '#0f1a0f', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                + Ajouter une étape
              </button>
            </>
          )}

          {/* ── AVIS ── */}
          {onglet === 'avis' && (
            <>
              <div style={{ background: '#fffbea', border: '1px solid #fcd34d', borderRadius: 8, padding: 10, fontSize: 12, color: '#92400e', marginBottom: 16 }}>
                ⭐ Les avis défilent automatiquement en boucle. Les avis sont dupliqués pour un défilement infini.
              </div>
              {config.avis.map((a, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Avis {i + 1}</span>
                    <button onClick={() => delAvis(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>
                  <Champ label="Texte de l'avis"><Textarea value={a.texte} onChange={(v: string) => updAvis(i, 'texte', v)} rows={2} /></Champ>
                  <Champ label="Auteur"><Input value={a.auteur} onChange={(v: string) => updAvis(i, 'auteur', v)} placeholder="Karin M." /></Champ>
                  <Champ label="Ville"><Input value={a.ville} onChange={(v: string) => updAvis(i, 'ville', v)} placeholder="Laval, QC" /></Champ>
                  <Champ label="Photo (URL)"><Input value={a.photo} onChange={(v: string) => updAvis(i, 'photo', v)} placeholder="https://..." /></Champ>
                  <Champ label="Note (1-5)">
                    <select value={a.note} onChange={e => updAvis(i, 'note', parseInt(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, background: '#fff' }}>
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} étoile{n > 1 ? 's' : ''}</option>)}
                    </select>
                  </Champ>
                </div>
              ))}
              <button onClick={addAvis} style={{ width: '100%', padding: 10, border: '2px dashed #0f1a0f', borderRadius: 10, background: 'transparent', color: '#0f1a0f', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                + Ajouter un avis
              </button>
            </>
          )}

          {/* ── GALERIE ── */}
          {onglet === 'galerie' && (
            <>
              <div style={{ background: '#f0f7e6', border: '1px solid #c5e07a', borderRadius: 8, padding: 10, fontSize: 12, color: '#3a5a00', marginBottom: 16 }}>
                📸 La galerie affiche vos 6 premières photos en grille masonry avec effet zoom au survol.
              </div>
              {config.galerie.map((url, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  {url && <img src={url} alt="" onError={e => (e.currentTarget.style.display = 'none')} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
                  <div style={{ flex: 1 }}><Input value={url} onChange={(v: string) => updGal(i, v)} placeholder={`URL photo ${i + 1}`} /></div>
                  <button onClick={() => delGal(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '6px 10px', color: '#dc2626', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>✕</button>
                </div>
              ))}
              <button onClick={addGal} style={{ width: '100%', padding: 10, border: '2px dashed #0f1a0f', borderRadius: 10, background: 'transparent', color: '#0f1a0f', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                + Ajouter une photo
              </button>
            </>
          )}

          {/* ── DEVIS ── */}
          {onglet === 'devis' && (
            <>
              <Sec titre="Textes formulaire devis">
                <Champ label="Titre"><Input value={config.titreDevis} onChange={(v: string) => set('titreDevis', v)} placeholder="Obtenez une soumission gratuite" /></Champ>
                <Champ label="Sous-titre / description"><Textarea value={config.sousTitreDevis} onChange={(v: string) => set('sousTitreDevis', v)} rows={3} /></Champ>
              </Sec>
              <Sec titre="Options du menu déroulant 'Service'">
                {config.servicesDevis.map((s, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <Input value={s} onChange={(v: string) => updServicesDevis(i, v)} placeholder="Nom du service" />
                  </div>
                ))}
              </Sec>
            </>
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
              <Sec titre="Horaires (une ligne par plage)">
                {config.horaires.map((h, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <Input value={h} onChange={(v: string) => updHoraire(i, v)} placeholder="Lun – Ven : 8h – 19h" />
                  </div>
                ))}
              </Sec>
            </>
          )}
        </div>

        {/* Footer boutons */}
        <div style={{ padding:'11px 13px', borderTop:'1px solid #f0f0f0', display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
          {resetConfirm ? (
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:7, padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, color:'#991b1b', fontWeight:600, flex:1 }}>⚠️ Effacer toute la config?</span>
              <button onClick={()=>{ setConfig({...CONFIG_PAYSAGER_DEFAUT}); setResetConfirm(false); }} style={{ padding:'4px 10px', borderRadius:5, background:'#dc2626', border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>✓ Confirmer</button>
              <button onClick={()=>setResetConfirm(false)} style={{ padding:'4px 8px', borderRadius:5, background:'#f3f4f6', border:'none', color:'#555', fontSize:11, cursor:'pointer' }}>Annuler</button>
            </div>
          ) : (
            <button onClick={()=>setResetConfirm(true)} style={{ width:'100%', padding:'6px 0', borderRadius:7, background:'transparent', border:'1.5px solid #fca5a5', color:'#dc2626', fontSize:11, fontWeight:600, cursor:'pointer' }}>
              🗑️ Réinitialiser la config
            </button>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setApercu(!apercu)} style={{ flex:1, padding:'9px 0', borderRadius:7, border:'1.5px solid #0f1a0f', background:apercu?'#0f1a0f':'transparent', color:apercu?CP:'#0f1a0f', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .2s' }}>
              {apercu?'✕ Fermer':'👁 Aperçu'}
            </button>
            <button onClick={handleSave} disabled={sauvegarde==='loading'} style={{ flex:2, padding:'9px 0', borderRadius:7, border:'none', background:sauvegarde==='ok'?'#10b981':sauvegarde==='err'?'#dc2626':'#0f1a0f', color:sauvegarde==='ok'||sauvegarde==='err'?'#fff':CP, fontSize:12, fontWeight:700, cursor:'pointer', transition:'background .3s' }}>
              {sauvegarde==='loading'?'⏳...':sauvegarde==='ok'?'✅ Sauvegardé!':sauvegarde==='err'?'❌ Erreur':'💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      {/* Aperçu iframe 3 modes */}
      <div style={{ flex:1, display:apercu?'flex':'none', flexDirection:'column', background:'#0f1a0f', overflow:'hidden' }}>
        <div style={{ background:'#1a2e1a', borderBottom:`1px solid ${CP}44`, padding:'6px 12px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <span style={{ fontSize:13 }}>⚠️</span>
          <span style={{ fontSize:11, color:CP, fontWeight:600 }}>Sauvegardez vos changements pour les voir dans l'aperçu</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 0', borderBottom:'1px solid #2a3a2a', flexShrink:0 }}>
          {([['desktop','🖥️','Bureau'],['tablette','📲','Tablette'],['mobile','📱','Mobile']] as const).map(([m,ico,label])=>(
            <button key={m} onClick={()=>setModeApercu(m)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:7, border:'none', background:modeApercu===m?`${CP}33`:'transparent', color:modeApercu===m?CP:'#666', cursor:'pointer', fontSize:12, fontWeight:700, transition:'all .2s' }}>
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
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#0f1a0f', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:52 }}>🌿</div>
          <p style={{ fontSize:15, color:CP, fontWeight:600 }}>Cliquez sur "Aperçu" pour voir votre site</p>
          <p style={{ fontSize:12, color:`${CP}80` }}>Template Entretien Paysager — Gratuit</p>
        </div>
      )}
    </div>
  );
}