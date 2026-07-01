// src/pages/studio/ConfigTemplateCagnottePro.tsx
// e-Vend Studio — CagnottePro — Configurateur dashboard

import { useState, useCallback, useEffect } from 'react';
import TemplateCagnottePro from '../../templates/TemplateCagnottePro';
import type { ConfigCagnotte, SousTypeCagnotte } from '../../templates/TemplateCagnottePro';
import { CONFIG_CAGNOTTE_DEFAUT } from '../../templates/TemplateCagnottePro';

type Onglet = 'type' | 'identite' | 'campagne' | 'dons' | 'style' | 'contact';

const CP = '#c9a96e';

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
  { nom: 'Doré',    cp: '#c9a96e', cs: '#1a1a1a', cf: '#fafaf8', ct: '#1a1a1a' },
  { nom: 'Rose',    cp: '#ec4899', cs: '#1a1a1a', cf: '#fff0f5', ct: '#1a1a1a' },
  { nom: 'Vert',    cp: '#16a34a', cs: '#14532d', cf: '#f0fdf4', ct: '#14532d' },
  { nom: 'Bleu',    cp: '#3b82f6', cs: '#0f172a', cf: '#f8fafc', ct: '#0f172a' },
  { nom: 'Violet',  cp: '#8b5cf6', cs: '#1e1b4b', cf: '#f5f3ff', ct: '#1e1b4b' },
  { nom: 'Orange',  cp: '#f97316', cs: '#1c1917', cf: '#fff7ed', ct: '#1c1917' },
];

const TYPES_INFO: Record<SousTypeCagnotte, { label: string; icone: string; desc: string; couleur: string }> = {
  personnel:     { label: 'Personnel',     icone: '❤️', desc: 'Besoin d\'aide financière, frais médicaux, accident',   couleur: '#ec4899' },
  projet:        { label: 'Projet',        icone: '🚀', desc: 'Lancer un projet créatif, business, artistique',        couleur: '#6366f1' },
  communaute:    { label: 'Communauté',    icone: '🤝', desc: 'Cause collective, association, équipe sportive',        couleur: '#0ea5e9' },
  environnement: { label: 'Environnement', icone: '🌿', desc: 'Cause verte, animale, protection de la nature',         couleur: '#16a34a' },
  urgence:       { label: 'Urgence',       icone: '🆘', desc: 'Catastrophe, sinistre, crise humanitaire',              couleur: '#dc2626' },
};

interface Props {
  vendeurId: string;
  configInitiale?: Partial<ConfigCagnotte>;
  onSauvegarde?: (config: ConfigCagnotte) => Promise<void>;
}

const DEFAUTS_PAR_TYPE: Partial<Record<SousTypeCagnotte, Partial<ConfigCagnotte>>> = {
  personnel: {
    nomCampagne: 'Aidez-moi à surmonter cette épreuve',
    descriptionCampagne: 'Bonjour à tous,\n\nJe traverse une période difficile et j\'ai besoin de votre soutien. Chaque contribution, aussi petite soit-elle, fait une énorme différence.\n\nMerci du fond du cœur pour votre générosité.',
    photoHeroUrl: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=1600',
    couleurPrincipale: '#ec4899',
    slogan: 'Votre soutien change tout',
  },
  projet: {
    nomCampagne: 'Aidez-moi à lancer mon projet',
    descriptionCampagne: 'Bonjour!\n\nJ\'ai un projet ambitieux qui pourrait changer les choses. Avec votre aide, je peux le concrétiser. Chaque don me rapproche de mon objectif.\n\nMerci pour votre confiance!',
    photoHeroUrl: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1600',
    couleurPrincipale: '#6366f1',
    slogan: 'Ensemble, rendons ce projet possible',
  },
  communaute: {
    nomCampagne: 'Soutenez notre communauté',
    descriptionCampagne: 'Notre communauté a besoin de votre aide. Ensemble, nous pouvons accomplir de grandes choses. Chaque don contribue directement à améliorer la vie de tous.\n\nMerci pour votre soutien!',
    photoHeroUrl: 'https://images.pexels.com/photos/1595385/pexels-photo-1595385.jpeg?auto=compress&cs=tinysrgb&w=1600',
    couleurPrincipale: '#0ea5e9',
    slogan: 'Ensemble, nous sommes plus forts',
  },
  environnement: {
    nomCampagne: 'Protégeons notre environnement',
    descriptionCampagne: 'Notre planète a besoin de nous. Cette collecte de fonds nous permettra de mener des actions concrètes pour protéger notre environnement et préserver la nature pour les générations futures.\n\nChaque geste compte!',
    photoHeroUrl: 'https://images.pexels.com/photos/1072824/pexels-photo-1072824.jpeg?auto=compress&cs=tinysrgb&w=1600',
    couleurPrincipale: '#16a34a',
    slogan: 'Agissons ensemble pour la planète',
  },
  urgence: {
    nomCampagne: 'Aide d\'urgence — Votre soutien est crucial',
    descriptionCampagne: 'Une situation d\'urgence nécessite votre aide immédiate. Chaque minute compte et chaque don peut sauver des vies. Merci d\'agir maintenant.\n\nVotre générosité est notre espoir.',
    photoHeroUrl: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=1600',
    couleurPrincipale: '#dc2626',
    slogan: 'Agissez maintenant — chaque don compte',
  },
};

export default function ConfigTemplateCagnottePro({ vendeurId, configInitiale, onSauvegarde }: Props) {
  const sousTypeInitial: SousTypeCagnotte = (configInitiale?.sousType) || 'personnel';
  const defautsType = DEFAUTS_PAR_TYPE[sousTypeInitial] || {};

  const [config, setConfig] = useState<ConfigCagnotte>({
    ...CONFIG_CAGNOTTE_DEFAUT,
    ...defautsType,
    ...configInitiale,
    sousType: sousTypeInitial,
  });
  const [onglet, setOnglet]           = useState<Onglet>('campagne');
  const [device, setDevice]           = useState<'desktop' | 'mobile'>('desktop');
  const [modePreview, setModePreview] = useState(false);
  const [sauvegarde, setSauvegarde]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const s = sessionStorage.getItem('studio_cagnotte_onglet') as Onglet | null;
    if (s) setOnglet(s);
  }, []);

  const setOngletPersist = (o: Onglet) => {
    setOnglet(o);
    sessionStorage.setItem('studio_cagnotte_onglet', o);
  };

  const maj = useCallback(<K extends keyof ConfigCagnotte>(champ: K, val: ConfigCagnotte[K]) => {
    setConfig(prev => ({ ...prev, [champ]: val }));
    setSauvegarde('idle');
  }, []);

  const sauvegarder = async () => {
    setSauvegarde('saving');
    try {
      if (onSauvegarde) {
        await onSauvegarde(config);
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ config, template_id: `cagnotte-${config.sousType}` }),
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
    { id: 'type',     label: 'Type',      icone: '🏷️' },
    { id: 'identite', label: 'Identité',  icone: '🏠' },
    { id: 'campagne', label: 'Campagne',  icone: '🎯' },
    { id: 'dons',     label: 'Dons',      icone: '💝' },
    { id: 'style',    label: 'Style',     icone: '🎨' },
    { id: 'contact',  label: 'Contact',   icone: '📲' },
  ];

  const ti = TYPES_INFO[config.sousType];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f7f7f5', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); *, *::before, *::after { box-sizing: border-box; } input[type=color] { width: 40px; height: 32px; padding: 2px; border: 1.5px solid #e5e7eb; border-radius: 6px; cursor: pointer; }`}</style>

      {/* TOP BAR */}
      <div style={{ background: '#1a1a1a', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: CP }}>e-Vend Studio</span>
          <span style={{ color: '#444' }}>›</span>
          <span style={{ fontSize: 14, color: '#aaa' }}>{ti.icone} CagnottePro — {ti.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#333', borderRadius: 6, overflow: 'hidden' }}>
            {(['desktop', 'mobile'] as const).map(d => (
              <button key={d} onClick={() => setDevice(d)} style={{ padding: '6px 14px', background: device === d ? CP : 'transparent', border: 'none', color: device === d ? '#000' : '#aaa', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                {d === 'desktop' ? '🖥 Bureau' : '📱 Mobile'}
              </button>
            ))}
          </div>
          <button onClick={() => setModePreview(!modePreview)} style={{ padding: '7px 16px', background: modePreview ? CP : '#333', border: 'none', borderRadius: 6, color: modePreview ? '#000' : '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            {modePreview ? '✏️ Éditer' : '👁 Aperçu'}
          </button>
          <button onClick={sauvegarder} disabled={sauvegarde === 'saving'} style={{ padding: '7px 20px', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600, background: sauvegarde === 'saved' ? '#22c55e' : sauvegarde === 'error' ? '#ef4444' : CP, color: '#fff' }}>
            {sauvegarde === 'saving' ? '...' : sauvegarde === 'saved' ? '✓ Sauvegardé' : sauvegarde === 'error' ? '✕ Erreur' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>

        {/* PANNEAU CONFIG */}
        {!modePreview && (
          <div style={{ width: 380, background: '#fff', borderRight: '1px solid #ebebeb', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>

            {/* Badge type */}
            <div style={{ padding: '10px 18px', background: `${ti.couleur}12`, borderBottom: `2px solid ${ti.couleur}30`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{ti.icone}</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: ti.couleur, margin: 0 }}>CagnottePro — {ti.label}</p>
                <p style={{ fontSize: 10, color: '#aaa', margin: 0 }}>Objectif : {config.objectifMontant.toLocaleString()}$</p>
              </div>
            </div>

            {/* Onglets */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ebebeb', flexShrink: 0 }}>
              {onglets.map(o => (
                <button key={o.id} onClick={() => setOngletPersist(o.id)} style={{ flex: 1, padding: '10px 2px', border: 'none', background: 'transparent', borderBottom: onglet === o.id ? `2px solid ${CP}` : '2px solid transparent', color: onglet === o.id ? CP : '#888', fontSize: 9, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 15, marginBottom: 2 }}>{o.icone}</div>
                  {o.label}
                </button>
              ))}
            </div>

            {/* Contenu */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px' }}>

              {/* ── TYPE ── */}
              {onglet === 'type' && (
                <div>
                  <p style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.6 }}>Choisissez le type de collecte qui correspond à votre cause.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(Object.entries(TYPES_INFO) as [SousTypeCagnotte, typeof TYPES_INFO[SousTypeCagnotte]][]).map(([id, t]) => (
                      <div key={id} onClick={() => {
                        const defauts = DEFAUTS_PAR_TYPE[id] || {};
                        setConfig(prev => ({ ...prev, ...defauts, sousType: id }));
                        setSauvegarde('idle');
                      }}
                        style={{ padding: '14px 16px', borderRadius: 10, border: `2px solid ${config.sousType === id ? t.couleur : '#e5e7eb'}`, background: config.sousType === id ? `${t.couleur}10` : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s' }}>
                        <span style={{ fontSize: 24, flexShrink: 0 }}>{t.icone}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: config.sousType === id ? t.couleur : '#1a1a1a', margin: '0 0 3px' }}>{t.label}</p>
                          <p style={{ fontSize: 11, color: '#888', margin: 0, lineHeight: 1.5 }}>{t.desc}</p>
                        </div>
                        {config.sousType === id && (
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: t.couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── IDENTITÉ ── */}
              {onglet === 'identite' && (
                <div>
                  <Sec titre="Votre organisation / nom">
                    <Champ label="Nom affiché dans la barre de navigation">
                      <Input value={config.nomEntreprise} onChange={(v: string) => maj('nomEntreprise', v)} placeholder="Ma Cagnotte" />
                    </Champ>
                    <Champ label="Slogan / accroche">
                      <Input value={config.slogan} onChange={(v: string) => maj('slogan', v)} placeholder="Aidez-moi à atteindre mon objectif" />
                    </Champ>
                  </Sec>
                  <Sec titre="Photo de couverture (Hero)">
                    <Champ label="URL image principale" desc="1600×900px recommandé">
                      <Input value={config.photoHeroUrl} onChange={(v: string) => maj('photoHeroUrl', v)} placeholder="https://..." />
                    </Champ>
                    {config.photoHeroUrl && <img src={config.photoHeroUrl} alt="" style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} onError={e => (e.currentTarget.style.display = 'none')} />}
                  </Sec>
                  <Sec titre="Logo (optionnel)">
                    <Champ label="URL du logo">
                      <Input value={config.logoUrl} onChange={(v: string) => maj('logoUrl', v)} placeholder="https://..." />
                    </Champ>
                  </Sec>
                  <Sec titre="Organisateur">
                    <Champ label="Votre nom complet">
                      <Input value={config.nomOrganisateur} onChange={(v: string) => maj('nomOrganisateur', v)} placeholder="Marie Dupont" />
                    </Champ>
                    <Champ label="Courte biographie">
                      <Textarea value={config.bioOrganisateur} onChange={(v: string) => maj('bioOrganisateur', v)} placeholder="Je suis mère de famille de 3 enfants..." rows={2} />
                    </Champ>
                    <Champ label="Photo portrait (optionnel)">
                      <Input value={config.photoOrganisateur} onChange={(v: string) => maj('photoOrganisateur', v)} placeholder="https://..." />
                    </Champ>
                  </Sec>
                </div>
              )}

              {/* ── CAMPAGNE ── */}
              {onglet === 'campagne' && (
                <div>
                  <Sec titre="Votre campagne">
                    <Champ label="Titre de la campagne">
                      <Input value={config.nomCampagne} onChange={(v: string) => maj('nomCampagne', v)} placeholder="Aidez Marie à financer son traitement" />
                    </Champ>
                    <Champ label="Description complète" desc="Racontez votre histoire. Soyez authentique.">
                      <Textarea value={config.descriptionCampagne} onChange={(v: string) => maj('descriptionCampagne', v)} rows={8} placeholder="Bonjour à tous..." />
                    </Champ>
                    <Champ label="Photo de la campagne">
                      <Input value={config.photoCampagne} onChange={(v: string) => maj('photoCampagne', v)} placeholder="https://..." />
                    </Champ>
                  </Sec>
                  <Sec titre="Objectif et durée">
                    <Champ label="Objectif en dollars ($)">
                      <input type="number" min={1} value={config.objectifMontant} onChange={e => maj('objectifMontant', parseInt(e.target.value))}
                        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                    </Champ>
                    <Champ label="Date de fin de campagne">
                      <Input type="datetime-local" value={config.dateFinCampagne?.substring(0, 16)} onChange={(v: string) => maj('dateFinCampagne', new Date(v).toISOString())} />
                    </Champ>
                  </Sec>
                  <Sec titre="Mises à jour">
                    <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Publiez des nouvelles pour vos donateurs.</p>
                    {config.misesAJour.map((m, i) => (
                      <div key={i} style={{ background: '#f7f7f5', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Input value={m.titre} onChange={(v: string) => { const a = [...config.misesAJour]; a[i] = { ...a[i], titre: v }; maj('misesAJour', a); }} placeholder="Titre de la mise à jour" />
                          <button onClick={() => maj('misesAJour', config.misesAJour.filter((_, idx) => idx !== i))} style={{ marginLeft: 8, background: '#fee2e2', border: 'none', borderRadius: 4, padding: '0 8px', cursor: 'pointer', color: '#ef4444', flexShrink: 0 }}>✕</button>
                        </div>
                        <Textarea value={m.texte} onChange={(v: string) => { const a = [...config.misesAJour]; a[i] = { ...a[i], texte: v }; maj('misesAJour', a); }} placeholder="Contenu de la mise à jour..." rows={2} />
                      </div>
                    ))}
                    <button onClick={() => maj('misesAJour', [...config.misesAJour, { date: new Date().toISOString(), titre: '', texte: '' }])}
                      style={{ width: '100%', padding: '8px', border: '1.5px dashed #d0c9bb', borderRadius: 6, background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 13 }}>
                      + Ajouter une mise à jour
                    </button>
                  </Sec>
                </div>
              )}

              {/* ── DONS ── */}
              {onglet === 'dons' && (
                <div>
                  <Sec titre="Montants suggérés">
                    <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Entrez 4 montants séparés par des virgules.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                      {config.montantsSuggeres.map((m, i) => (
                        <input key={i} type="number" min={1} value={m}
                          onChange={e => { const a = [...config.montantsSuggeres]; a[i] = parseInt(e.target.value); maj('montantsSuggeres', a); }}
                          style={{ padding: '8px', border: `2px solid ${CP}40`, borderRadius: 8, fontSize: 15, fontWeight: 700, textAlign: 'center', outline: 'none', color: CP }} />
                      ))}
                    </div>
                  </Sec>
                  <Sec titre="Paramètres">
                    <Champ label="Montant minimum ($)">
                      <input type="number" min={1} value={config.montantMinimum}
                        onChange={e => maj('montantMinimum', parseInt(e.target.value))}
                        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 14, outline: 'none' }} />
                    </Champ>
                    <Champ label="Message de remerciement" desc="Affiché après un don réussi">
                      <Textarea value={config.messageRemerciement} onChange={(v: string) => maj('messageRemerciement', v)} rows={3} />
                    </Champ>
                  </Sec>
                  <div style={{ padding: '16px', background: '#fff3cd', borderRadius: 10, border: '1px solid #ffc10730' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#856404', margin: '0 0 6px' }}>⚠️ Stripe requis</p>
                    <p style={{ fontSize: 12, color: '#856404', margin: 0, lineHeight: 1.5 }}>
                      Pour recevoir des dons, vous devez connecter votre compte Stripe dans <strong>Configuration → Configuration générale</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* ── STYLE ── */}
              {onglet === 'style' && (
                <div>
                  <Sec titre="Palettes prédéfinies">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                      {PALETTES.map(p => (
                        <button key={p.nom} onClick={() => { maj('couleurPrincipale', p.cp); maj('couleurSecondaire', p.cs); maj('couleurFond', p.cf); maj('couleurTexte', p.ct); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', border: '1.5px solid #e5e7eb', borderRadius: 20, background: p.cf, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.cp }} />
                          <span style={{ color: p.ct }}>{p.nom}</span>
                        </button>
                      ))}
                    </div>
                  </Sec>
                  <Sec titre="Couleurs personnalisées">
                    {[
                      { champ: 'couleurPrincipale' as const, label: 'Couleur principale', desc: 'Boutons, barre de progression, accents' },
                      { champ: 'couleurSecondaire' as const, label: 'Couleur secondaire', desc: 'Titres, fonds sombres' },
                      { champ: 'couleurFond'       as const, label: 'Fond général',       desc: 'Arrière-plan de la page' },
                      { champ: 'couleurTexte'      as const, label: 'Texte principal',    desc: 'Corps du texte' },
                    ].map(({ champ, label, desc }) => (
                      <div key={champ} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{label}</p>
                          <p style={{ fontSize: 10, color: '#aaa', margin: 0 }}>{desc}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="color" value={config[champ] as string} onChange={e => maj(champ, e.target.value)} />
                          <span style={{ fontSize: 10, color: '#aaa', fontFamily: 'monospace' }}>{config[champ] as string}</span>
                        </div>
                      </div>
                    ))}
                  </Sec>
                  <Sec titre="Typographie">
                    {([
                      { id: 'moderne',    label: 'Moderne',   desc: 'Inter — claire et contemporaine',    font: "'Inter', sans-serif" },
                      { id: 'classique',  label: 'Classique', desc: 'Playfair — élégante et raffinée',   font: "'Playfair Display', serif" },
                      { id: 'manuscrite', label: 'Manuscrite',desc: 'Dancing Script — chaleureuse',      font: "'Dancing Script', cursive" },
                    ] as const).map(p => (
                      <div key={p.id} onClick={() => maj('police', p.id)}
                        style={{ padding: '12px 14px', border: `2px solid ${config.police === p.id ? CP : '#e5e7eb'}`, borderRadius: 8, cursor: 'pointer', background: config.police === p.id ? `${CP}0d` : '#fff', marginBottom: 8 }}>
                        <p style={{ fontFamily: p.font, fontSize: 16, fontWeight: 600, color: '#1a1a1a', margin: '0 0 2px' }}>{p.label}</p>
                        <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{p.desc}</p>
                      </div>
                    ))}
                  </Sec>
                </div>
              )}

              {/* ── CONTACT ── */}
              {onglet === 'contact' && (
                <div>
                  <Sec titre="Réseaux sociaux">
                    <Champ label="📷 Instagram (pseudo)"><Input value={config.instagram} onChange={(v: string) => maj('instagram', v)} placeholder="monpseudo" /></Champ>
                    <Champ label="👥 Facebook (pseudo)"><Input value={config.facebook}  onChange={(v: string) => maj('facebook', v)}  placeholder="ma-page" /></Champ>
                    <Champ label="🌐 Site web externe"><Input value={config.siteExterne} onChange={(v: string) => maj('siteExterne', v)} placeholder="https://monsite.com" /></Champ>
                    <Champ label="✉️ Courriel affiché"><Input value={config.email} onChange={(v: string) => maj('email', v)} placeholder="moi@exemple.com" /></Champ>
                  </Sec>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PREVIEW */}
        <div style={{ flex: 1, background: '#e8e8e8', overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24 }}>
          <div style={{
            width: device === 'mobile' ? 390 : '100%',
            maxWidth: device === 'mobile' ? 390 : 1200,
            background: '#fff',
            borderRadius: device === 'mobile' ? 28 : 8,
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            border: device === 'mobile' ? '8px solid #1a1a1a' : 'none',
            transition: 'all 0.3s ease',
          }}>
            <TemplateCagnottePro
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