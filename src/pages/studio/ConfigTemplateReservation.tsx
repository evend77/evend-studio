// src/pages/studio/ConfigTemplateReservation.tsx
// e-Vend Studio — Configuration du template "Formulaires & Réservations"
// Même structure que ConfigTemplateVitrine

import { useState, useCallback, useEffect } from 'react';
import TemplateReservation from '../../templates/TemplateReservation';
import type { ConfigReservation, SousTypeReservation } from '../../templates/TemplateReservation';
import { CONFIG_RESA_DEFAUT } from '../../templates/TemplateReservation';

type Onglet = 'type' | 'identite' | 'style' | 'contenu' | 'reservation' | 'contact';

// ─── UI HELPERS ───────────────────────────────────────────────────────────────
const Input = ({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, color: '#1a1a1a', outline: 'none', background: '#fff', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = '#c9a96e'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) => (
  <textarea value={value} placeholder={placeholder} rows={rows} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, color: '#1a1a1a', outline: 'none', resize: 'vertical' as any, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' as any }}
    onFocus={e => e.target.style.borderColor = '#c9a96e'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
);

const Champ = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ marginBottom: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', display: 'block' }}>{label}</label>
      {desc && <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{desc}</p>}
    </div>
    {children}
  </div>
);

const Sec = ({ titre, children }: { titre: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 28 }}>
    <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as any, letterSpacing: '0.12em', color: '#aaa', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>{titre}</h3>
    {children}
  </div>
);

// ─── PROPS ────────────────────────────────────────────────────────────────────
interface Props {
  vendeurId: string;
  templateId?: string; // reservation-restaurant | reservation-location | ...
  configInitiale?: Partial<ConfigReservation>;
  onSauvegarde?: (config: ConfigReservation) => Promise<void>;
}

const TYPES: Record<string, SousTypeReservation> = {
  'reservation-restaurant': 'restaurant',
  'reservation-location':   'location',
  'reservation-service':    'service',
  'reservation-spectacle':  'spectacle',
};

const PALETTES = [
  { nom: 'Doré',    cp: '#c9a96e', cs: '#1a1a1a', cf: '#fafaf8', ct: '#1a1a1a' },
  { nom: 'Bordeaux',cp: '#9b2335', cs: '#1a1a1a', cf: '#fff8f8', ct: '#1a1a1a' },
  { nom: 'Marine',  cp: '#1e40af', cs: '#0f172a', cf: '#f8fafc', ct: '#0f172a' },
  { nom: 'Forêt',   cp: '#16a34a', cs: '#14532d', cf: '#f0fdf4', ct: '#14532d' },
  { nom: 'Ardoise', cp: '#6366f1', cs: '#1e1b4b', cf: '#f5f3ff', ct: '#1e1b4b' },
  { nom: 'Brique',  cp: '#ea580c', cs: '#1c1917', cf: '#fff7ed', ct: '#1c1917' },
];

const DEFAUTS_PAR_TYPE: Partial<Record<SousTypeReservation, Partial<ConfigReservation>>> = {
  restaurant: {
    nomEntreprise: 'Mon Restaurant',
    slogan: 'Une expérience culinaire unique',
    description: 'Cuisine du marché, produits locaux et atmosphère chaleureuse.',
    photoHeroUrl: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1600',
    titreSection: 'Réserver une table',
    descriptionResa: 'Réservez votre table en quelques secondes. Confirmation immédiate.',
  },
  location: {
    nomEntreprise: 'Ma Boutique Location',
    slogan: 'La location facile et abordable',
    description: 'Louez nos équipements de qualité pour vos événements et activités.',
    photoHeroUrl: 'https://images.pexels.com/photos/1170882/pexels-photo-1170882.jpeg?auto=compress&cs=tinysrgb&w=1600',
    titreSection: 'Réserver un équipement',
    descriptionResa: 'Choisissez votre équipement et votre date. Confirmation immédiate.',
    restaurant_horaires: [],
  },
  service: {
    nomEntreprise: 'Mon Studio / Salon',
    slogan: 'Des services professionnels à votre portée',
    description: 'Prenez rendez-vous en ligne facilement. Notre équipe vous accueille avec plaisir.',
    photoHeroUrl: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1600',
    titreSection: 'Prendre un rendez-vous',
    descriptionResa: 'Choisissez votre service et votre horaire. Confirmation par courriel.',
    restaurant_horaires: [],
  },
  spectacle: {
    nomEntreprise: 'Mon Événement',
    slogan: 'Une soirée inoubliable vous attend',
    description: 'Réservez vos places dès maintenant pour ne pas manquer cet événement exceptionnel.',
    photoHeroUrl: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1600',
    titreSection: 'Réserver vos places',
    descriptionResa: 'Choisissez vos places et confirmez votre réservation.',
    restaurant_horaires: [],
  },
};

export default function ConfigTemplateReservation({ vendeurId, templateId, configInitiale, onSauvegarde }: Props) {
  const sousTypeInitial: SousTypeReservation = TYPES[templateId || ''] || 'restaurant';
  console.log('CONFIG RESA — templateId reçu:', templateId, '→ sousType:', sousTypeInitial);

  const defautsType = DEFAUTS_PAR_TYPE[sousTypeInitial] || {};

  const [config, setConfig] = useState<ConfigReservation>({
    ...CONFIG_RESA_DEFAUT,
    ...defautsType,
    ...configInitiale,
    sousType: sousTypeInitial,
  });
  const [onglet, setOnglet]           = useState<Onglet>('identite');
  const [modePreview, setModePreview] = useState(false);
  const [device, setDevice]           = useState<'desktop' | 'mobile'>('desktop');
  const [sauvegarde, setSauvegarde]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Persist onglet au refresh
  useEffect(() => {
    const s = sessionStorage.getItem('studio_resa_onglet') as Onglet | null;
    if (s) setOnglet(s);
  }, []);

  const setOngletPersist = (o: Onglet) => {
    setOnglet(o);
    sessionStorage.setItem('studio_resa_onglet', o);
  };

  const maj = useCallback(<K extends keyof ConfigReservation>(champ: K, valeur: ConfigReservation[K]) => {
    setConfig(prev => ({ ...prev, [champ]: valeur }));
    setSauvegarde('idle');
  }, []);

  const handleSauvegarder = async () => {
    setSauvegarde('saving');
    try {
      if (onSauvegarde) {
        await onSauvegarde(config);
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ config, sous_type: config.sousType, template_id: templateId }),
        });
        if (!res.ok) throw new Error();
      }
      setSauvegarde('saved');
      setTimeout(() => setSauvegarde('idle'), 3000);
    } catch {
      setSauvegarde('error');
    }
  };

  const onglets: { id: Onglet; label: string; icone: string }[] = [
    { id: 'identite',    label: 'Identité',    icone: '🏠' },
    { id: 'style',       label: 'Style',       icone: '🎨' },
    { id: 'contenu',     label: 'Contenu',     icone: '✏️' },
    { id: 'reservation', label: 'Réservation', icone: '📅' },
    { id: 'contact',     label: 'Contact',     icone: '📲' },
  ];

  const TYPE_INFO: Record<SousTypeReservation, { label: string; icone: string; couleur: string }> = {
    restaurant: { label: 'Restaurant & Café',  icone: '🍽️', couleur: '#f97316' },
    location:   { label: 'Location d\'objet',  icone: '📦', couleur: '#6366f1' },
    service:    { label: 'Service & RDV',      icone: '💈', couleur: '#0ea5e9' },
    spectacle:  { label: 'Spectacle & Billet', icone: '🎭', couleur: '#ec4899' },
  };

  const ti = TYPE_INFO[config.sousType];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f7f7f5', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        input[type=color] { width: 44px; height: 36px; padding: 2px; border: 1.5px solid #e5e7eb; border-radius: 6px; cursor: pointer; background: #fff; }
        @media (max-width: 900px) {
          .studio-layout { flex-direction: column !important; }
          .panneau-preview { display: none !important; }
        }
      `}</style>

      {/* BARRE TOP */}
      <div style={{ background: '#1a1a1a', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#c9a96e' }}>e-Vend Studio</span>
          <span style={{ color: '#444' }}>›</span>
          <span style={{ fontSize: 14, color: '#aaa' }}>{ti.icone} {ti.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#333', borderRadius: 6, overflow: 'hidden' }}>
            {(['desktop', 'mobile'] as const).map(d => (
              <button key={d} onClick={() => setDevice(d)} style={{ padding: '6px 14px', background: device === d ? '#c9a96e' : 'transparent', border: 'none', color: device === d ? '#000' : '#aaa', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                {d === 'desktop' ? '🖥 Bureau' : '📱 Mobile'}
              </button>
            ))}
          </div>
          <button onClick={() => setModePreview(!modePreview)} style={{ padding: '7px 16px', background: modePreview ? '#c9a96e' : '#333', border: 'none', borderRadius: 6, color: modePreview ? '#000' : '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            {modePreview ? '✏️ Éditer' : '👁 Aperçu'}
          </button>
          <button onClick={handleSauvegarder} disabled={sauvegarde === 'saving'} style={{ padding: '7px 20px', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600, background: sauvegarde === 'saved' ? '#22c55e' : sauvegarde === 'error' ? '#ef4444' : '#c9a96e', color: '#fff' }}>
            {sauvegarde === 'saving' ? '...' : sauvegarde === 'saved' ? '✓ Sauvegardé' : sauvegarde === 'error' ? '✕ Erreur' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* LAYOUT */}
      <div className="studio-layout" style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>

        {/* ══ PANNEAU CONFIG ══ */}
        {!modePreview && (
          <div style={{ width: 380, background: '#fff', borderRight: '1px solid #ebebeb', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>

            {/* Badge type actif */}
            <div style={{ padding: '12px 18px', background: `${ti.couleur}12`, borderBottom: `2px solid ${ti.couleur}30`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{ti.icone}</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: ti.couleur, margin: 0 }}>{ti.label}</p>
                <p style={{ fontSize: 10, color: '#aaa', margin: 0 }}>Pour changer de type → Choisir un template</p>
              </div>
            </div>

            {/* Onglets */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ebebeb', flexShrink: 0 }}>
              {onglets.map(o => (
                <button key={o.id} onClick={() => setOngletPersist(o.id)} style={{ flex: 1, padding: '10px 4px', border: 'none', background: 'transparent', borderBottom: onglet === o.id ? '2px solid #c9a96e' : '2px solid transparent', color: onglet === o.id ? '#c9a96e' : '#888', fontSize: 10, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{o.icone}</div>
                  {o.label}
                </button>
              ))}
            </div>

            {/* Contenu onglet */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px' }}>

              {/* ── IDENTITÉ ── */}
              {onglet === 'identite' && (
                <div>
                  <Sec titre="Informations de base">
                    <Champ label="Nom / Titre principal">
                      <Input value={config.nomEntreprise} onChange={v => maj('nomEntreprise', v)} placeholder="Le Petit Bistro" />
                    </Champ>
                    <Champ label="Slogan / Sous-titre">
                      <Input value={config.slogan} onChange={v => maj('slogan', v)} placeholder="Une expérience unique" />
                    </Champ>
                    <Champ label="Description">
                      <Textarea value={config.description} onChange={v => maj('description', v)} placeholder="Décrivez votre activité..." rows={4} />
                    </Champ>
                  </Sec>
                  <Sec titre="Photo de couverture (Hero)">
                    <Champ label="URL de la photo principale" desc="1600×900px recommandé">
                      <Input value={config.photoHeroUrl} onChange={v => maj('photoHeroUrl', v)} placeholder="https://..." />
                    </Champ>
                    {config.photoHeroUrl && (
                      <img src={config.photoHeroUrl} alt="preview" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} onError={e => (e.currentTarget.style.display = 'none')} />
                    )}
                  </Sec>
                  <Sec titre="Logo (optionnel)">
                    <Champ label="URL du logo">
                      <Input value={config.logoUrl} onChange={v => maj('logoUrl', v)} placeholder="https://..." />
                    </Champ>
                  </Sec>
                </div>
              )}

              {/* ── STYLE ── */}
              {onglet === 'style' && (
                <div>
                  <Sec titre="Palette de couleurs">
                    {[
                      { champ: 'couleurPrincipale' as const, label: 'Couleur principale', desc: 'Boutons, accents' },
                      { champ: 'couleurSecondaire' as const, label: 'Couleur secondaire', desc: 'Fonds foncés, titres' },
                      { champ: 'couleurFond'       as const, label: 'Couleur de fond',    desc: 'Arrière-plan général' },
                      { champ: 'couleurTexte'      as const, label: 'Couleur du texte',   desc: 'Texte principal' },
                    ].map(({ champ, label, desc }) => (
                      <div key={champ} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{label}</p>
                          <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{desc}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="color" value={config[champ] as string} onChange={e => maj(champ, e.target.value)} />
                          <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>{config[champ] as string}</span>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 16 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Palettes prédéfinies</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {PALETTES.map(p => (
                          <button key={p.nom} onClick={() => { maj('couleurPrincipale', p.cp); maj('couleurSecondaire', p.cs); maj('couleurFond', p.cf); maj('couleurTexte', p.ct); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', border: '1.5px solid #e5e7eb', borderRadius: 20, background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.cp }} />
                            {p.nom}
                          </button>
                        ))}
                      </div>
                    </div>
                  </Sec>
                  <Sec titre="Typographie">
                    {([
                      { id: 'classique',  label: 'Classique',  apercu: 'Playfair — élégante et raffinée',     font: "'Playfair Display', serif" },
                      { id: 'moderne',    label: 'Moderne',    apercu: 'Inter — claire et contemporaine',      font: "'Inter', sans-serif" },
                      { id: 'manuscrite', label: 'Manuscrite', apercu: 'Dancing Script — chaleureuse',         font: "'Dancing Script', cursive" },
                    ] as const).map(p => (
                      <div key={p.id} onClick={() => maj('police', p.id)}
                        style={{ padding: '12px 14px', border: `2px solid ${config.police === p.id ? config.couleurPrincipale : '#e5e7eb'}`, borderRadius: 8, cursor: 'pointer', background: config.police === p.id ? `${config.couleurPrincipale}0d` : '#fff', marginBottom: 8 }}>
                        <p style={{ fontFamily: p.font, fontSize: 16, fontWeight: 600, color: '#1a1a1a', margin: '0 0 2px' }}>{p.label}</p>
                        <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{p.apercu}</p>
                      </div>
                    ))}
                  </Sec>
                </div>
              )}

              {/* ── CONTENU ── */}
              {onglet === 'contenu' && (
                <div>
                  {/* RESTAURANT — Horaires */}
                  {config.sousType === 'restaurant' && (
                    <Sec titre="Heures d'ouverture">
                      {config.restaurant_horaires.map((h, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                          <Input value={h.jour}  onChange={v => { const a=[...config.restaurant_horaires]; a[i]={...a[i],jour:v};  maj('restaurant_horaires',a); }} placeholder="Lun – Ven" />
                          <Input value={h.heure} onChange={v => { const a=[...config.restaurant_horaires]; a[i]={...a[i],heure:v}; maj('restaurant_horaires',a); }} placeholder="17h – 22h" />
                          <button onClick={() => maj('restaurant_horaires', config.restaurant_horaires.filter((_,idx)=>idx!==i))} style={{ background:'#fee2e2',border:'none',borderRadius:4,width:32,height:36,cursor:'pointer',color:'#ef4444',flexShrink:0 }}>✕</button>
                        </div>
                      ))}
                      <button onClick={() => maj('restaurant_horaires', [...config.restaurant_horaires, { jour:'', heure:'' }])} style={{ width:'100%',padding:'8px',border:'1.5px dashed #d0c9bb',borderRadius:6,background:'transparent',color:'#888',cursor:'pointer',fontSize:13 }}>+ Ajouter une plage</button>
                    </Sec>
                  )}

                  {/* LOCATION — Objets */}
                  {config.sousType === 'location' && (
                    <>
                      <Sec titre="Catalogue d'objets">
                        {config.location_objets.map((o, i) => (
                          <div key={o.id} style={{ background: '#f7f7f5', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                              <Input value={o.nom}  onChange={v => { const a=[...config.location_objets]; a[i]={...a[i],nom:v};  maj('location_objets',a); }} placeholder="Nom de l'objet" />
                              <Input value={o.prix} onChange={v => { const a=[...config.location_objets]; a[i]={...a[i],prix:v}; maj('location_objets',a); }} placeholder="150$/jour" />
                            </div>
                            <Textarea value={o.description} onChange={v => { const a=[...config.location_objets]; a[i]={...a[i],description:v}; maj('location_objets',a); }} placeholder="Description..." rows={2} />
                            <Input value={o.imageUrl} onChange={v => { const a=[...config.location_objets]; a[i]={...a[i],imageUrl:v}; maj('location_objets',a); }} placeholder="URL image (https://...)" />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                              <label style={{ fontSize: 12, color: '#666' }}>Disponible</label>
                              <div onClick={() => { const a=[...config.location_objets]; a[i]={...a[i],disponible:!a[i].disponible}; maj('location_objets',a); }}
                                style={{ width: 40, height: 22, borderRadius: 11, background: o.disponible ? '#c9a96e' : '#ddd', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                                <div style={{ position: 'absolute', top: 2, left: o.disponible ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                              </div>
                              <button onClick={() => maj('location_objets', config.location_objets.filter((_,idx)=>idx!==i))} style={{ marginLeft: 'auto', background:'#fee2e2',border:'none',borderRadius:4,padding:'3px 10px',cursor:'pointer',color:'#ef4444',fontSize:12 }}>Retirer</button>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => maj('location_objets', [...config.location_objets, { id: Date.now().toString(), nom:'', description:'', prix:'', imageUrl:'', disponible: true }])} style={{ width:'100%',padding:'8px',border:'1.5px dashed #d0c9bb',borderRadius:6,background:'transparent',color:'#888',cursor:'pointer',fontSize:13 }}>+ Ajouter un objet</button>
                      </Sec>
                      <Sec titre="Conditions de location">
                        <Champ label="Dépôt requis"><Input value={config.location_depot} onChange={v => maj('location_depot', v)} placeholder="200$" /></Champ>
                        <Champ label="Conditions & politiques"><Textarea value={config.location_conditions} onChange={v => maj('location_conditions', v)} placeholder="Livraison incluse dans 30km..." rows={3} /></Champ>
                      </Sec>
                    </>
                  )}

                  {/* SERVICE — Services + Équipe */}
                  {config.sousType === 'service' && (
                    <Sec titre="Services offerts">
                      {config.service_services.map((s, i) => (
                        <div key={i} style={{ background: '#f7f7f5', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <Input value={s.nom}   onChange={v => { const a=[...config.service_services]; a[i]={...a[i],nom:v};   maj('service_services',a); }} placeholder="Coupe & Coiffure" />
                            <div style={{ width: 90 }}><Input value={s.prix} onChange={v => { const a=[...config.service_services]; a[i]={...a[i],prix:v}; maj('service_services',a); }} placeholder="55$" /></div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <Input value={s.duree} onChange={v => { const a=[...config.service_services]; a[i]={...a[i],duree:v}; maj('service_services',a); }} placeholder="45 min" />
                            <Input value={s.desc}  onChange={v => { const a=[...config.service_services]; a[i]={...a[i],desc:v};  maj('service_services',a); }} placeholder="Description..." />
                          </div>
                          <button onClick={() => maj('service_services', config.service_services.filter((_,idx)=>idx!==i))} style={{ background:'#fee2e2',border:'none',borderRadius:4,padding:'3px 10px',cursor:'pointer',color:'#ef4444',fontSize:12 }}>Retirer</button>
                        </div>
                      ))}
                      <button onClick={() => maj('service_services', [...config.service_services, { nom:'', duree:'', prix:'', desc:'' }])} style={{ width:'100%',padding:'8px',border:'1.5px dashed #d0c9bb',borderRadius:6,background:'transparent',color:'#888',cursor:'pointer',fontSize:13 }}>+ Ajouter un service</button>
                    </Sec>
                  )}

                  {/* GALERIE — tous les types */}
                  <Sec titre="Galerie photos">
                    <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Photos d'ambiance affichées sur votre site.</p>
                    {config.galerie.map((g, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                        {g.url && <img src={g.url} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />}
                        <Input value={g.url}   onChange={v => { const a=[...config.galerie]; a[i]={...a[i],url:v};   maj('galerie',a); }} placeholder="URL de la photo" />
                        <Input value={g.titre} onChange={v => { const a=[...config.galerie]; a[i]={...a[i],titre:v}; maj('galerie',a); }} placeholder="Titre" />
                        <button onClick={() => maj('galerie', config.galerie.filter((_,idx)=>idx!==i))} style={{ background:'#fee2e2',border:'none',borderRadius:4,width:28,height:28,cursor:'pointer',color:'#ef4444',flexShrink:0 }}>✕</button>
                      </div>
                    ))}
                    {config.galerie.length < 9 && (
                      <button onClick={() => maj('galerie', [...config.galerie, { url:'', titre:'' }])} style={{ width:'100%',padding:'8px',border:'1.5px dashed #d0c9bb',borderRadius:6,background:'transparent',color:'#888',cursor:'pointer',fontSize:13 }}>+ Ajouter une photo</button>
                    )}
                  </Sec>
                </div>
              )}

              {/* ── RÉSERVATION ── */}
              {onglet === 'reservation' && (
                <div>
                  <Sec titre="Section réservation">
                    <Champ label="Titre de la section réservation">
                      <Input value={config.titreSection} onChange={v => maj('titreSection', v)} placeholder="Réserver une table" />
                    </Champ>
                    <Champ label="Texte descriptif">
                      <Textarea value={config.descriptionResa} onChange={v => maj('descriptionResa', v)} placeholder="Réservez en quelques secondes..." rows={3} />
                    </Champ>
                    <Champ label="Message de confirmation" desc="Affiché après une réservation réussie">
                      <Textarea value={config.messageConfirmation} onChange={v => maj('messageConfirmation', v)} placeholder="Merci! Votre réservation est confirmée..." rows={3} />
                    </Champ>
                  </Sec>
                  <Sec titre="Paramètres">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Champ label="Personnes min">
                        <input type="number" min={1} max={99} value={config.nbPersonnesMin} onChange={e => maj('nbPersonnesMin', parseInt(e.target.value))}
                          style={{ width:'100%',padding:'9px 12px',border:'1.5px solid #e5e7eb',borderRadius:6,fontSize:14,outline:'none',background:'#fff' }} />
                      </Champ>
                      <Champ label="Personnes max">
                        <input type="number" min={1} max={999} value={config.nbPersonnesMax} onChange={e => maj('nbPersonnesMax', parseInt(e.target.value))}
                          style={{ width:'100%',padding:'9px 12px',border:'1.5px solid #e5e7eb',borderRadius:6,fontSize:14,outline:'none',background:'#fff' }} />
                      </Champ>
                    </div>
                    <Champ label="Durée d'un créneau (minutes)" desc="Ex: 90 min pour un repas">
                      <input type="number" min={15} step={15} value={config.dureeSlotMinutes} onChange={e => maj('dureeSlotMinutes', parseInt(e.target.value))}
                        style={{ width:'100%',padding:'9px 12px',border:'1.5px solid #e5e7eb',borderRadius:6,fontSize:14,outline:'none',background:'#fff' }} />
                    </Champ>
                    {config.sousType === 'restaurant' && (
                      <>
                        <Champ label="Capacité max (personnes)">
                          <input type="number" min={1} value={config.restaurant_capaciteMax} onChange={e => maj('restaurant_capaciteMax', parseInt(e.target.value))}
                            style={{ width:'100%',padding:'9px 12px',border:'1.5px solid #e5e7eb',borderRadius:6,fontSize:14,outline:'none',background:'#fff' }} />
                        </Champ>
                        <Champ label="Délai minimum (heures à l'avance)">
                          <input type="number" min={0} value={config.restaurant_reservationMin} onChange={e => maj('restaurant_reservationMin', parseInt(e.target.value))}
                            style={{ width:'100%',padding:'9px 12px',border:'1.5px solid #e5e7eb',borderRadius:6,fontSize:14,outline:'none',background:'#fff' }} />
                        </Champ>
                      </>
                    )}
                    {config.sousType === 'service' && (
                      <Champ label="Lien de réservation externe (optionnel)" desc="Si vous utilisez Calendly ou autre, entrez le lien ici">
                        <Input value={config.service_rdvUrl} onChange={v => maj('service_rdvUrl', v)} placeholder="https://calendly.com/votrenom" />
                      </Champ>
                    )}
                  </Sec>
                </div>
              )}

              {/* ── CONTACT ── */}
              {onglet === 'contact' && (
                <div>
                  <Sec titre="Coordonnées">
                    <Champ label="Adresse"><Input value={config.adresse}   onChange={v => maj('adresse', v)}   placeholder="1234 rue Saint-Denis" /></Champ>
                    <Champ label="Ville / Code postal"><Input value={config.ville} onChange={v => maj('ville', v)} placeholder="Montréal, QC  H2X 3K6" /></Champ>
                    <Champ label="Téléphone"><Input value={config.telephone} onChange={v => maj('telephone', v)} placeholder="(514) 555-0123" /></Champ>
                    <Champ label="Courriel"><Input value={config.email}     onChange={v => maj('email', v)}     placeholder="bonjour@exemple.ca" /></Champ>
                  </Sec>
                  <Sec titre="Réseaux sociaux">
                    <Champ label="📷 Instagram (pseudo seulement)"><Input value={config.instagram} onChange={v => maj('instagram', v)} placeholder="monpseudo" /></Champ>
                    <Champ label="👥 Facebook (pseudo seulement)"><Input value={config.facebook}  onChange={v => maj('facebook', v)}  placeholder="ma-page" /></Champ>
                    <Champ label="🌐 Site web externe (optionnel)"><Input value={config.siteExterne} onChange={v => maj('siteExterne', v)} placeholder="https://monsite.com" /></Champ>
                  </Sec>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ PANNEAU PREVIEW ══ */}
        <div className="panneau-preview" style={{ flex: 1, background: '#e8e8e8', overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24 }}>
          <div style={{
            width: device === 'mobile' ? 390 : '100%',
            maxWidth: device === 'mobile' ? 390 : 1200,
            background: '#fff',
            borderRadius: device === 'mobile' ? 28 : 8,
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            border: device === 'mobile' ? '8px solid #1a1a1a' : 'none',
            minHeight: device === 'mobile' ? 700 : 'auto',
            transition: 'all 0.3s ease',
          }}>
            <TemplateReservation
              key={config.sousType}
              config={config}
              isPreviewMobile={device === 'mobile'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}