// src/pages/vendeur/ConfigTemplate.tsx
// e-Vend Studio — Page "Modifier mon site" (router de config templates)
// Extrait de AppVendeurStudio.tsx pour alléger le fichier principal

import React from 'react';
import ConfigTemplateVitrine            from '../studio/ConfigTemplateVitrine';
import ConfigTemplateReservation        from '../studio/ConfigTemplateReservation';
import ConfigTemplateSpectacle          from '../studio/ConfigTemplateSpectacle';
import ConfigTemplateCagnottePro        from '../studio/ConfigTemplateCagnottePro';
import ConfigTemplateBoutiqueSimple     from '../studio/ConfigTemplateBoutiqueSimple';
import ConfigTemplateAgricole           from '../studio/ConfigTemplateAgricole';
import ConfigTemplateVitrineProSante    from '../studio/ConfigTemplateVitrineProSante';
import ConfigTemplateVitrineProMariage  from '../studio/ConfigTemplateVitrineProMariage';
import ConfigTemplateVitrineProBeaute   from '../studio/ConfigTemplateVitrineProBeaute';
import ConfigTemplateVitrineProTech     from '../studio/ConfigTemplateVitrineProTech';
import ConfigTemplateVitrineProEntrepreneur from '../studio/ConfigTemplateVitrineProEntrepreneur';
import ConfigTemplateEnchereFlash       from '../studio/ConfigTemplateEnchereFlash';
import ConfigTemplateEnchereGalerie     from '../studio/ConfigTemplateEnchereGalerie';
import ConfigTemplateEnchereLive        from '../studio/ConfigTemplateEnchereLive';
import ConfigTemplateSalon              from '../studio/ConfigTemplateSalon';
import ConfigTemplatePaysager           from '../studio/ConfigTemplatePaysager';
import ConfigTemplateAvocat             from '../studio/ConfigTemplateAvocat';
import ConfigTemplateResto              from '../studio/ConfigTemplateResto';
import ConfigTemplateBistro             from '../studio/ConfigTemplateBistro';
import ConfigTemplatePiano              from '../studio/ConfigTemplatePiano';
import ConfigTemplateLangues            from '../studio/ConfigTemplateLangues';
import ConfigTemplateFormationWeb       from '../studio/ConfigTemplateFormationWeb';
import ConfigTemplateEcoleCuisine       from '../studio/ConfigTemplateEcoleCuisine';
import ConfigTemplateStudioYoga         from '../studio/ConfigTemplateStudioYoga';
import ConfigTemplateEquitation         from '../studio/ConfigTemplateEquitation';
import ConfigTemplateEcolePeinture      from '../studio/ConfigTemplateEcolePeinture';
import ConfigTemplateEcoleDanse         from '../studio/ConfigTemplateEcoleDanse';
import ConfigTemplateFoodTruck          from '../studio/ConfigTemplateFoodTruck';
import ConfigTemplateBoulangerie        from '../studio/ConfigTemplateBoulangerie';
import ConfigTemplateCoachVie          from '../studio/ConfigTemplateCoachVie';

const API_BASE = '/api';

interface Props {
  vendeurId: number;
  templateId: string;
  resetConfirm: boolean;
  resetLoading: boolean;
  resetDone: boolean;
  setResetConfirm: (v: boolean) => void;
  onResetConfig: () => void;
}

function BoutonResetConfig({ resetDone, resetConfirm, resetLoading, setResetConfirm, onResetConfig }: Omit<Props, 'vendeurId' | 'templateId'>) {
  if (resetDone) return (
    <div style={{ background: '#ecfdf5', border: '1px solid #10b981', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#065f46' }}>
      ✅ Config réinitialisée! Rechargement...
    </div>
  );
  if (resetConfirm) return (
    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: '#991b1b', fontWeight: 600 }}>⚠️ Effacer toute la config? Cette action est irréversible.</span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onResetConfig} disabled={resetLoading}
          style={{ padding: '6px 14px', borderRadius: 6, background: '#dc2626', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          {resetLoading ? '⏳...' : '✓ Confirmer'}
        </button>
        <button onClick={() => setResetConfirm(false)}
          style={{ padding: '6px 12px', borderRadius: 6, background: '#f3f4f6', border: 'none', color: '#555', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          Annuler
        </button>
      </div>
    </div>
  );
  return (
    <button onClick={() => setResetConfirm(true)}
      style={{ padding: '7px 14px', borderRadius: 8, background: 'transparent', border: '1.5px solid #fca5a5', color: '#dc2626', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'}
      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}>
      🗑️ Réinitialiser la config
    </button>
  );
}

function BarreTemplate({ nom, couleur, resetProps }: { nom: string; couleur: string; resetProps: Omit<Props, 'vendeurId' | 'templateId'> }) {
  return (
    <div style={{ padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#888', fontWeight: 500 }}>
        Template : <strong style={{ color: couleur }}>{nom}</strong>
      </span>
      <BoutonResetConfig {...resetProps} />
    </div>
  );
}

export default function ConfigTemplate({ vendeurId, templateId, ...resetProps }: Props) {
  const apiBase = API_BASE;

  const onSauvegarde = async (cfg: any) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${apiBase}/studio/sites/${vendeurId}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      credentials: 'include',
      body: JSON.stringify({ config: cfg, template_id: templateId }),
    });
    if (!res.ok) throw new Error('Erreur sauvegarde');
  };

  const wrapper = (nom: string, couleur: string, enfant: React.ReactNode) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <BarreTemplate nom={nom} couleur={couleur} resetProps={resetProps} />
      <div style={{ flex: 1, overflow: 'hidden' }}>{enfant}</div>
    </div>
  );

  // ── Groupes ──
  const groupeVitrinePro  = ['vitrine-pro-entrepreneur','vitrine-pro-tech','vitrine-pro-beaute','vitrine-pro-mariage','vitrine-pro-sante','salon-coiffure','vitrine-paysager','vitrine-avocat','vitrine-resto','vitrine-bistro','cours-piano','cours-langues','cours-web','cours-cuisine','cours-yoga','cours-equitation','cours-peinture','cours-danse','vitrine-foodtruck','vitrine-boulangerie','cours-coach'];
  const groupeCagnotte    = ['cagnotte-personnel','cagnotte-projet','cagnotte-communaute','cagnotte-environnement','cagnotte-urgence'];
  const groupeReservation = ['reservation-restaurant','reservation-location','reservation-service','reservation-spectacle'];
  const groupeBoutique    = ['boutique-simple','boutique-complete','agricole'];
  const groupeEnchere     = ['enchere-flash','enchere-galerie','enchere-live'];

  // ── Agricole ──
  if (templateId === 'agricole') {
    return <ConfigTemplateAgricole key="agricole" vendeurId={vendeurId.toString()} templateId="agricole" onSauvegarde={onSauvegarde} />;
  }

  // ── Boutique ──
  if (groupeBoutique.includes(templateId)) {
    return <ConfigTemplateBoutiqueSimple key={templateId} vendeurId={vendeurId.toString()} templateId={templateId} onSauvegarde={onSauvegarde} />;
  }

  // ── Vitrine Pro & Cours ──
  if (groupeVitrinePro.includes(templateId)) {
    if (templateId === 'vitrine-pro-sante')
      return <ConfigTemplateVitrineProSante key={templateId} vendeurId={vendeurId.toString()} templateId={templateId} onSauvegarde={onSauvegarde} />;
    if (templateId === 'vitrine-pro-mariage')
      return <ConfigTemplateVitrineProMariage key={templateId} vendeurId={vendeurId.toString()} templateId={templateId} onSauvegarde={onSauvegarde} />;
    if (templateId === 'vitrine-pro-beaute')
      return <ConfigTemplateVitrineProBeaute key={templateId} vendeurId={vendeurId.toString()} templateId={templateId} onSauvegarde={onSauvegarde} />;
    if (templateId === 'vitrine-pro-tech')
      return <ConfigTemplateVitrineProTech key={templateId} vendeurId={vendeurId.toString()} templateId={templateId} onSauvegarde={onSauvegarde} />;
    if (templateId === 'salon-coiffure')
      return wrapper('Salon de Coiffure', '#e8820a', <ConfigTemplateSalon key={templateId} vendeurId={vendeurId.toString()} onSauvegarde={onSauvegarde} />);
    if (templateId === 'vitrine-paysager')
      return wrapper('Entretien Paysager', '#b5e24a', <ConfigTemplatePaysager key={templateId} vendeurId={vendeurId.toString()} onSauvegarde={onSauvegarde} />);
    if (templateId === 'vitrine-avocat')
      return wrapper("Bureau d'Avocat", '#c9a84c', <ConfigTemplateAvocat key={templateId} vendeurId={vendeurId.toString()} onSauvegarde={onSauvegarde} />);
    if (templateId === 'vitrine-resto')
      return wrapper('Restaurant & Fast Food', '#e8820a', <ConfigTemplateResto key={templateId} vendeurId={vendeurId.toString()} onSauvegarde={onSauvegarde} />);
    if (templateId === 'vitrine-bistro')
      return wrapper('Bistro & Café', '#8b6914', <ConfigTemplateBistro key={templateId} vendeurId={vendeurId.toString()} onSauvegarde={onSauvegarde} />);
    if (templateId === 'cours-piano')
      return wrapper('Cours de Piano', '#e8a87c', <ConfigTemplatePiano key={templateId} vendeurId={vendeurId.toString()} onSauvegarde={onSauvegarde} />);
    if (templateId === 'cours-langues')
      return wrapper('École de Langues', '#4F46E5', <ConfigTemplateLangues key={templateId} vendeurId={vendeurId.toString()} onSauvegarde={onSauvegarde} />);
    if (templateId === 'cours-web')
      return wrapper('Formation Web', '#00d4ff', <ConfigTemplateFormationWeb key={templateId} vendeurId={vendeurId.toString()} onSauvegarde={onSauvegarde} />);
    if (templateId === 'cours-cuisine')
      return wrapper('École de Cuisine', '#c0392b', <ConfigTemplateEcoleCuisine key={templateId} vendeurId={vendeurId.toString()} onSauvegarde={onSauvegarde} />);
    if (templateId === 'cours-yoga')
      return wrapper('Studio Yoga & Pilates', '#c17f5a', <ConfigTemplateStudioYoga key={templateId} vendeurId={vendeurId.toString()} onSauvegarde={onSauvegarde} />);
    if (templateId === 'cours-equitation')
      return wrapper("Centre d'Équitation", '#8b2635', <ConfigTemplateEquitation key={templateId} vendeurId={vendeurId.toString()} onSauvegarde={onSauvegarde} />);
    if (templateId === 'cours-peinture')
      return wrapper('École de Peinture', '#e63946', <ConfigTemplateEcolePeinture key={templateId} vendeurId={vendeurId.toString()} onSauvegarde={onSauvegarde} />);
    if (templateId === 'cours-danse')
      return <ConfigTemplateEcoleDanse key={templateId} vendeurId={vendeurId.toString()} onSauvegarde={onSauvegarde} />;
    if (templateId === 'vitrine-foodtruck')
      return wrapper('Food Truck', '#ff6b00', <ConfigTemplateFoodTruck key={templateId} vendeurId={vendeurId.toString()} onSauvegarde={onSauvegarde} />);
    if (templateId === 'vitrine-boulangerie')
      return wrapper('Boulangerie & Pâtisserie', '#8b4513', <ConfigTemplateBoulangerie key={templateId} vendeurId={vendeurId.toString()} onSauvegarde={onSauvegarde} />);
    if (templateId === 'cours-coach')
      return <ConfigTemplateCoachVie key={templateId} vendeurId={vendeurId.toString()} onSauvegarde={onSauvegarde} />;
    return <ConfigTemplateVitrineProEntrepreneur key={templateId} vendeurId={vendeurId.toString()} templateId={templateId} onSauvegarde={onSauvegarde} />;
  }

  // ── Enchères ──
  if (groupeEnchere.includes(templateId)) {
    if (templateId === 'enchere-flash')
      return <ConfigTemplateEnchereFlash key={templateId} vendeurId={vendeurId.toString()} templateId={templateId} onSauvegarde={onSauvegarde} />;
    if (templateId === 'enchere-galerie')
      return <ConfigTemplateEnchereGalerie key={templateId} vendeurId={vendeurId.toString()} templateId={templateId} onSauvegarde={onSauvegarde} />;
    if (templateId === 'enchere-live')
      return <ConfigTemplateEnchereLive key={templateId} vendeurId={vendeurId.toString()} templateId={templateId} onSauvegarde={onSauvegarde} />;
  }

  // ── Cagnotte ──
  if (groupeCagnotte.includes(templateId)) {
    return <ConfigTemplateCagnottePro key={templateId} vendeurId={vendeurId.toString()} onSauvegarde={onSauvegarde} />;
  }

  // ── Réservation ──
  if (groupeReservation.includes(templateId)) {
    if (templateId === 'reservation-spectacle')
      return <ConfigTemplateSpectacle key={templateId} vendeurId={vendeurId.toString()} onSauvegarde={onSauvegarde} />;
    return <ConfigTemplateReservation key={templateId} vendeurId={vendeurId.toString()} templateId={templateId} onSauvegarde={onSauvegarde} />;
  }

  // ── Défaut → Vitrine Simple ──
  return (
    <ConfigTemplateVitrine
      vendeurId={vendeurId.toString()}
      onSauvegarde={async (config) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiBase}/studio/sites/${vendeurId}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          credentials: 'include',
          body: JSON.stringify(config),
        });
        if (!res.ok) throw new Error('Erreur sauvegarde');
      }}
    />
  );
}