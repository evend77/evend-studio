// src/pages/admin/ConfigurationMakeOffer.tsx
import React, { useState, useEffect } from 'react';
import { MakeOfferInstructionsModal } from '../../components/MakeOfferInstructionsModal';
import { API_BASE } from '../../config/api';

const THEME = {
  accent:     '#2d6a9f',
  accentLight:'#e8f2fb',
  bg:         '#f0f2f5',
  card:       '#ffffff',
  border:     '#e1e4e8',
  text:       '#1a2332',
  textLight:  '#6b7280',
  danger:     '#dc2626',
  success:    '#16a34a',
  warning:    '#d97706',
};

// ── Types ──────────────────────────────────────────────────────────────────
interface Config {
  // Activation globale
  make_offer_actif:              boolean;
  // Comportement offres
  auto_accept_global:            boolean;  // admin peut forcer auto-accept pour tous
  permettre_vendeur_auto_accept: boolean;  // vendeur peut choisir son propre auto-accept
  permettre_vendeur_configurer:  boolean;  // vendeur peut activer/désactiver par annonce
  // Limites
  duree_expiration_heures:       number;   // combien d'heures avant expiration d'une offre
  max_offres_par_produit:        number;   // max offres actives simultanées par produit
  offre_min_pourcentage:         number;   // % min du prix (ex: 50 = offre doit être >= 50% du prix)
  // Emails
  email_vendeur_nouvelle_offre:  boolean;
  email_acheteur_confirmation:   boolean;
  email_acheteur_accepte:        boolean;
  email_acheteur_refuse:         boolean;
  // Apparence du widget
  couleur_fond:                  string;
  couleur_texte:                 string;
  couleur_bouton:                string;
  couleur_bouton_texte:          string;
  couleur_bordure:               string;
  border_radius:                 number;
  // Textes du widget
  texte_bouton:                  string;
  texte_titre_modal:             string;
  texte_placeholder_montant:     string;
  texte_placeholder_message:     string;
  texte_offre_envoyee:           string;
  texte_offre_acceptee:          string;
  texte_offre_refusee:           string;
  texte_label_montant:           string;
  texte_label_message:           string;
  texte_label_email:             string;
  texte_label_nom:               string;
  texte_bouton_envoyer:          string;
  texte_bouton_annuler:          string;
}

const DEFAULT_CONFIG: Config = {
  make_offer_actif:              true,
  auto_accept_global:            false,
  permettre_vendeur_auto_accept: true,
  permettre_vendeur_configurer:  true,
  duree_expiration_heures:       48,
  max_offres_par_produit:        10,
  offre_min_pourcentage:         30,
  email_vendeur_nouvelle_offre:  true,
  email_acheteur_confirmation:   true,
  email_acheteur_accepte:        true,
  email_acheteur_refuse:         true,
  couleur_fond:                  '#ffffff',
  couleur_texte:                 '#1a2332',
  couleur_bouton:                '#2d6a9f',
  couleur_bouton_texte:          '#ffffff',
  couleur_bordure:               '#e1e4e8',
  border_radius:                 10,
  texte_bouton:                  '💬 Faire une offre',
  texte_titre_modal:             '💬 Faire une offre au vendeur',
  texte_placeholder_montant:     'Ex : 45.00',
  texte_placeholder_message:     'Ex : Je suis très intéressé, voici mon offre...',
  texte_offre_envoyee:           '✅ Votre offre a été envoyée au vendeur !',
  texte_offre_acceptee:          '🎉 Offre acceptée ! Le vendeur a accepté votre prix.',
  texte_offre_refusee:           '❌ Le vendeur a refusé votre offre.',
  texte_label_montant:           'Votre offre ($)',
  texte_label_message:           'Message au vendeur (optionnel)',
  texte_label_email:             'Votre courriel',
  texte_label_nom:               'Votre nom',
  texte_bouton_envoyer:          'Envoyer mon offre',
  texte_bouton_annuler:          'Annuler',
};

// ── Sous-composants réutilisables (même style que ConfigurationParutionFutur) ──

function ChampCouleur({ label, valeur, onChange }: { label: string; valeur: string; onChange: (v: string) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [local, setLocal] = useState(valeur);
  useEffect(() => { setLocal(valeur); }, [valeur]);
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: THEME.textLight, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{ width: '44px', height: '44px', borderRadius: '8px', border: `2px solid ${THEME.border}`, cursor: 'pointer', backgroundColor: local, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}
          onClick={() => inputRef.current?.click()}
        />
        <input ref={inputRef} type="color" defaultValue={local}
          onInput={e => { const v = (e.target as HTMLInputElement).value; setLocal(v); onChange(v); }}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
        />
        <input type="text" value={local}
          onChange={e => { setLocal(e.target.value); onChange(e.target.value); }}
          style={{ flex: 1, padding: '10px 12px', border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace' }}
        />
      </div>
    </div>
  );
}

function Slider({ label, valeur, onChange, min, max, unite = '' }: { label: string; valeur: number; onChange: (v: number) => void; min: number; max: number; unite?: string }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <label style={{ fontSize: '12px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
        <span style={{ fontSize: '12px', fontWeight: '700', color: THEME.accent }}>{valeur}{unite}</span>
      </div>
      <input type="range" min={min} max={max} value={valeur} onChange={e => onChange(parseInt(e.target.value))}
        style={{ width: '100%', accentColor: THEME.accent }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '10px', color: '#aaa' }}>{min}{unite}</span>
        <span style={{ fontSize: '10px', color: '#aaa' }}>{max}{unite}</span>
      </div>
    </div>
  );
}

function Toggle({ label, description, valeur, onChange, couleurActif }: { label: string; description: string; valeur: boolean; onChange: (v: boolean) => void; couleurActif?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: `1px solid ${THEME.border}`, marginBottom: '10px' }}>
      <div>
        <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: '0 0 2px 0' }}>{label}</p>
        <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>{description}</p>
      </div>
      <div onClick={() => onChange(!valeur)}
        style={{ width: '44px', height: '24px', borderRadius: '12px', backgroundColor: valeur ? (couleurActif || THEME.success) : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, marginLeft: '16px' }}>
        <div style={{ position: 'absolute', top: '2px', left: valeur ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  );
}

function SectionTitre({ titre }: { titre: string }) {
  return <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: '20px 0 16px 0', paddingBottom: '12px', borderBottom: `1px solid ${THEME.border}` }}>{titre}</p>;
}

function ChampTexte({ label, valeur, onChange, placeholder, multiline }: { label: string; valeur: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  const style: React.CSSProperties = { width: '100%', padding: '10px 12px', border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' };
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: THEME.textLight, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      {multiline
        ? <textarea value={valeur} rows={3} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={{ ...style, resize: 'vertical' }} />
        : <input type="text" value={valeur} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={style} />
      }
    </div>
  );
}

// ── Aperçu du widget ────────────────────────────────────────────────────────
function ApercuWidget({ config }: { config: Config }) {
  const [modalOuvert, setModalOuvert] = useState(false);
  const [etape, setEtape] = useState<'form' | 'envoye' | 'accepte' | 'refuse'>('form');

  return (
    <div>
      <p style={{ fontSize: '12px', color: THEME.textLight, textAlign: 'center', marginBottom: '16px' }}>
        Aperçu interactif — cliquez sur le bouton pour voir le modal
      </p>

      {/* Simulation d'une page produit */}
      <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: `1px solid ${THEME.border}`, padding: '24px', maxWidth: '460px', margin: '0 auto' }}>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ height: '10px', backgroundColor: '#e2e8f0', borderRadius: '4px', width: '70%', marginBottom: '6px' }} />
          <div style={{ height: '24px', backgroundColor: '#cbd5e1', borderRadius: '4px', width: '55%', marginBottom: '6px' }} />
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#1a2332', marginBottom: '4px' }}>89,99 $</div>
          <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', width: '40%', marginBottom: '16px' }} />
        </div>

        {/* Bouton principal simulé (Shopify ATC) */}
        <div style={{ backgroundColor: '#1a2332', color: 'white', borderRadius: '8px', padding: '13px', textAlign: 'center', fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>
          Ajouter au panier
        </div>

        {/* Encadré Make Offer injecté */}
        <div style={{
          backgroundColor: config.couleur_fond,
          border: `1px solid ${config.couleur_bordure}`,
          borderRadius: `${config.border_radius}px`,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: '700', color: config.couleur_texte, margin: '0 0 2px 0' }}>Prix trop élevé?</p>
            <p style={{ fontSize: '11px', color: config.couleur_texte, opacity: 0.7, margin: 0 }}>Proposez votre prix au vendeur</p>
          </div>
          <button
            onClick={() => { setModalOuvert(true); setEtape('form'); }}
            style={{
              backgroundColor: config.couleur_bouton,
              color: config.couleur_bouton_texte,
              border: 'none',
              borderRadius: `${Math.max(config.border_radius - 2, 4)}px`,
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {config.texte_bouton}
          </button>
        </div>
      </div>

      {/* Modal Make Offer */}
      {modalOuvert && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', width: '100%', maxWidth: '440px', boxShadow: '0 12px 48px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            {/* Header modal */}
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${THEME.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: THEME.text }}>{config.texte_titre_modal}</h3>
              <button onClick={() => setModalOuvert(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: THEME.textLight }}>✕</button>
            </div>

            <div style={{ padding: '24px' }}>
              {etape === 'form' && (
                <>
                  {/* Montant */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: THEME.textLight, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{config.texte_label_montant}</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', fontWeight: '700', color: THEME.textLight }}>$</span>
                      <input type="number" placeholder={config.texte_placeholder_montant} style={{ width: '100%', padding: '10px 12px 10px 28px', border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: '#aaa', margin: '4px 0 0 0' }}>Prix actuel : 89,99 $</p>
                  </div>

                  {/* Email */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: THEME.textLight, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{config.texte_label_email}</label>
                    <input type="email" placeholder="votre@courriel.com" style={{ width: '100%', padding: '10px 12px', border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>

                  {/* Message */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: THEME.textLight, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{config.texte_label_message}</label>
                    <textarea rows={3} placeholder={config.texte_placeholder_message} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setModalOuvert(false)} style={{ flex: 1, padding: '11px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.textLight, fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                      {config.texte_bouton_annuler}
                    </button>
                    <button onClick={() => setEtape('envoye')} style={{ flex: 2, padding: '11px', border: 'none', borderRadius: '8px', backgroundColor: config.couleur_bouton, color: config.couleur_bouton_texte, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                      {config.texte_bouton_envoyer}
                    </button>
                  </div>

                  {/* Aperçu des 3 états */}
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                    <p style={{ fontSize: '11px', color: '#0369a1', margin: '0 0 8px 0', fontWeight: '700' }}>🎭 Prévisualiser les états :</p>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setEtape('envoye')} style={{ flex: 1, padding: '6px', border: '1px solid #bae6fd', borderRadius: '6px', backgroundColor: 'white', fontSize: '11px', cursor: 'pointer', color: '#0369a1' }}>📤 Envoyé</button>
                      <button onClick={() => setEtape('accepte')} style={{ flex: 1, padding: '6px', border: '1px solid #bbf7d0', borderRadius: '6px', backgroundColor: 'white', fontSize: '11px', cursor: 'pointer', color: '#16a34a' }}>✅ Accepté</button>
                      <button onClick={() => setEtape('refuse')} style={{ flex: 1, padding: '6px', border: '1px solid #fecaca', borderRadius: '6px', backgroundColor: 'white', fontSize: '11px', cursor: 'pointer', color: '#dc2626' }}>❌ Refusé</button>
                    </div>
                  </div>
                </>
              )}

              {etape === 'envoye' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📤</div>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: THEME.success, margin: '0 0 8px 0' }}>{config.texte_offre_envoyee}</p>
                  <p style={{ fontSize: '12px', color: THEME.textLight, margin: '0 0 20px 0' }}>Le vendeur recevra un courriel et pourra accepter ou refuser votre offre.</p>
                  <button onClick={() => setEtape('form')} style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.textLight, fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>← Retour</button>
                </div>
              )}

              {etape === 'accepte' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: THEME.success, margin: '0 0 8px 0' }}>{config.texte_offre_acceptee}</p>
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#16a34a', margin: 0 }}>Offre acceptée : 75,00 $</p>
                  </div>
                  <button onClick={() => setEtape('form')} style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.textLight, fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>← Retour</button>
                </div>
              )}

              {etape === 'refuse' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>😔</div>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: THEME.danger, margin: '0 0 8px 0' }}>{config.texte_offre_refusee}</p>
                  <p style={{ fontSize: '12px', color: THEME.textLight, margin: '0 0 20px 0' }}>Vous pouvez faire une nouvelle offre ou acheter au prix affiché.</p>
                  <button onClick={() => setEtape('form')} style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.textLight, fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>← Retour</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────
export default function ConfigurationMakeOffer({ naviguerVers }: { naviguerVers?: (p: string) => void }) {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [sauvegarde, setSauvegarde] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [onglet, setOnglet] = useState<'global' | 'apparence' | 'textes' | 'emails' | 'apercu'>('global');
  const [instructionsOuvertes, setInstructionsOuvertes] = useState(false);

  // Charger la config depuis l'API
  useEffect(() => {
    fetch(`${API_BASE}/admin/configuration/make-offer`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const cfg = data?.config || data;
        if (cfg && typeof cfg === 'object' && !cfg.success) {
          setConfig({ ...DEFAULT_CONFIG, ...cfg });
        }
      })
      .catch(() => {});
  }, []);

  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig(prev => ({ ...prev, [key]: value }));

  const sauvegarder = async () => {
    setSauvegarde('saving');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/admin/configuration/make-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setSauvegarde(data.success ? 'success' : 'error');
    } catch {
      setSauvegarde('error');
    }
    setTimeout(() => setSauvegarde('idle'), 3000);
  };

  const onglets = [
    { id: 'global',    label: '⚙️ Règles globales' },
    { id: 'apparence', label: '🎨 Apparence' },
    { id: 'textes',    label: '✏️ Textes' },
    { id: 'emails',    label: '📧 Emails' },
    { id: 'apercu',    label: '👁️ Aperçu' },
  ] as const;

  return (
    <div style={{ padding: '28px 32px', maxWidth: '980px' }}>

      {/* ── En-tête ── */}
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            💬 Configuration — Make Offer
          </h1>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
            Configurez le widget "Faire une offre" affiché sur les pages produit Shopify. Contrôlez les règles, l'apparence et les textes.
          </p>
        </div>
        <button
          onClick={() => setInstructionsOuvertes(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
            padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #0f4c2a, #166534)',
            color: 'white', fontSize: '13px', fontWeight: '700',
            boxShadow: '0 4px 16px rgba(15,76,42,0.4)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
        >
          <span style={{ fontSize: '16px' }}>📋</span>
          <span>Guide d'installation</span>
        </button>
      </div>

      <MakeOfferInstructionsModal ouvert={instructionsOuvertes} onFermer={() => setInstructionsOuvertes(false)} />

      {/* ── Bandeau statut global ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderRadius: '10px', marginBottom: '24px',
        backgroundColor: config.make_offer_actif ? '#f0fdf4' : '#fff7ed',
        border: `1px solid ${config.make_offer_actif ? '#bbf7d0' : '#fed7aa'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px' }}>{config.make_offer_actif ? '✅' : '⏸️'}</span>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '800', color: config.make_offer_actif ? '#15803d' : '#c2410c', margin: 0 }}>
              Make Offer est {config.make_offer_actif ? 'ACTIVÉ' : 'DÉSACTIVÉ'} sur la plateforme
            </p>
            <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>
              {config.make_offer_actif ? 'Les vendeurs peuvent activer le widget par annonce.' : 'Aucun widget ne s\'affichera sur les pages produit.'}
            </p>
          </div>
        </div>
        <div
          onClick={() => set('make_offer_actif', !config.make_offer_actif)}
          style={{ width: '52px', height: '28px', borderRadius: '14px', backgroundColor: config.make_offer_actif ? THEME.success : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: '3px', left: config.make_offer_actif ? '27px' : '3px', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
        </div>
      </div>

      {/* ── Onglets ── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', backgroundColor: '#f0f2f5', padding: '4px', borderRadius: '10px', width: 'fit-content', flexWrap: 'wrap' }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)} style={{
            padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700',
            backgroundColor: onglet === o.id ? 'white' : 'transparent',
            color: onglet === o.id ? THEME.accent : THEME.textLight,
            boxShadow: onglet === o.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s',
          }}>{o.label}</button>
        ))}
      </div>

      {/* ── Contenu onglets ── */}
      <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

        {/* RÈGLES GLOBALES */}
        {onglet === 'global' && (
          <div>
            <SectionTitre titre="🔐 Permissions vendeurs" />
            <Toggle
              label="Permettre aux vendeurs de configurer par annonce"
              description="Si désactivé, c'est l'admin qui contrôle tout — les vendeurs ne voient pas l'option dans leur dashboard."
              valeur={config.permettre_vendeur_configurer}
              onChange={v => set('permettre_vendeur_configurer', v)}
            />
            <Toggle
              label="Permettre aux vendeurs de choisir l'auto-acceptation"
              description="Le vendeur peut activer 'Accepter automatiquement si le prix minimum est atteint' pour chaque annonce."
              valeur={config.permettre_vendeur_auto_accept}
              onChange={v => set('permettre_vendeur_auto_accept', v)}
            />

            <SectionTitre titre="🤖 Auto-acceptation globale (admin)" />
            <Toggle
              label="Forcer l'auto-acceptation pour toute la plateforme"
              description="Si activé, TOUTES les offres atteignant le prix minimum sont acceptées automatiquement, peu importe le réglage du vendeur."
              valeur={config.auto_accept_global}
              onChange={v => set('auto_accept_global', v)}
              couleurActif={THEME.warning}
            />
            {config.auto_accept_global && (
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>
                  ⚠️ Ce réglage remplace la configuration individuelle de chaque vendeur. Utilisez avec précaution.
                </p>
              </div>
            )}

            <SectionTitre titre="⏱️ Limites et délais" />
            <Slider
              label="Expiration des offres"
              valeur={config.duree_expiration_heures}
              onChange={v => set('duree_expiration_heures', v)}
              min={6} max={168} unite="h"
            />
            <p style={{ fontSize: '11px', color: THEME.textLight, marginTop: '-10px', marginBottom: '16px' }}>
              Après ce délai, une offre non répondue passe au statut "expirée". (168h = 7 jours)
            </p>

            <Slider
              label="Offres simultanées max par produit"
              valeur={config.max_offres_par_produit}
              onChange={v => set('max_offres_par_produit', v)}
              min={1} max={50} unite=""
            />
            <p style={{ fontSize: '11px', color: THEME.textLight, marginTop: '-10px', marginBottom: '16px' }}>
              Nombre maximum d'offres en attente pour un même produit à la fois.
            </p>

            <Slider
              label="Offre minimum (% du prix affiché)"
              valeur={config.offre_min_pourcentage}
              onChange={v => set('offre_min_pourcentage', v)}
              min={1} max={99} unite="%"
            />
            <p style={{ fontSize: '11px', color: THEME.textLight, marginTop: '-10px', marginBottom: '16px' }}>
              Ex : 30% → pour un produit à 100$, le minimum accepté est 30$. En dessous, le formulaire affiche une erreur.
            </p>

            {/* Résumé configuration */}
            <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '16px 18px', marginTop: '8px' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#0369a1', margin: '0 0 10px 0' }}>📊 Résumé de vos règles :</p>
              <ul style={{ fontSize: '12px', color: '#0369a1', margin: 0, paddingLeft: '18px', lineHeight: 2 }}>
                <li>Widget Make Offer : <strong>{config.make_offer_actif ? '✅ Activé' : '❌ Désactivé'}</strong></li>
                <li>Vendeurs peuvent configurer par annonce : <strong>{config.permettre_vendeur_configurer ? '✅ Oui' : '❌ Non'}</strong></li>
                <li>Auto-accept global (admin) : <strong>{config.auto_accept_global ? '⚠️ Forcé' : '➖ Non forcé'}</strong></li>
                <li>Vendeur peut choisir auto-accept : <strong>{config.permettre_vendeur_auto_accept ? '✅ Oui' : '❌ Non'}</strong></li>
                <li>Expiration offre : <strong>{config.duree_expiration_heures}h</strong></li>
                <li>Offre minimum : <strong>{config.offre_min_pourcentage}% du prix</strong></li>
              </ul>
            </div>
          </div>
        )}

        {/* APPARENCE */}
        {onglet === 'apparence' && (
          <div>
            <SectionTitre titre="🎨 Couleurs de l'encadré Make Offer" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              <ChampCouleur label="Fond de l'encadré"    valeur={config.couleur_fond}         onChange={v => set('couleur_fond', v)} />
              <ChampCouleur label="Texte de l'encadré"   valeur={config.couleur_texte}        onChange={v => set('couleur_texte', v)} />
              <ChampCouleur label="Couleur du bouton"     valeur={config.couleur_bouton}       onChange={v => set('couleur_bouton', v)} />
              <ChampCouleur label="Texte du bouton"       valeur={config.couleur_bouton_texte} onChange={v => set('couleur_bouton_texte', v)} />
              <ChampCouleur label="Bordure de l'encadré"  valeur={config.couleur_bordure}      onChange={v => set('couleur_bordure', v)} />
            </div>

            <SectionTitre titre="📐 Forme" />
            <Slider label="Rayon des coins" valeur={config.border_radius} onChange={v => set('border_radius', v)} min={0} max={24} unite="px" />

            <div style={{ marginTop: '20px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '12px 16px' }}>
              <p style={{ fontSize: '12px', color: '#0369a1', margin: 0 }}>
                💡 Allez dans l'onglet <strong>Aperçu</strong> pour voir le rendu en temps réel avec vos couleurs choisies.
              </p>
            </div>
          </div>
        )}

        {/* TEXTES */}
        {onglet === 'textes' && (
          <div>
            <SectionTitre titre="🔘 Bouton et encadré" />
            <ChampTexte label="Texte du bouton Make Offer"  valeur={config.texte_bouton}        onChange={v => set('texte_bouton', v)}        placeholder="💬 Faire une offre" />
            <ChampTexte label="Titre du modal"              valeur={config.texte_titre_modal}   onChange={v => set('texte_titre_modal', v)}   placeholder="💬 Faire une offre au vendeur" />

            <SectionTitre titre="📋 Formulaire (labels et placeholders)" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <ChampTexte label="Label — Montant"   valeur={config.texte_label_montant}   onChange={v => set('texte_label_montant', v)}   placeholder="Votre offre ($)" />
              <ChampTexte label="Label — Courriel"  valeur={config.texte_label_email}     onChange={v => set('texte_label_email', v)}     placeholder="Votre courriel" />
              <ChampTexte label="Label — Nom"       valeur={config.texte_label_nom}       onChange={v => set('texte_label_nom', v)}       placeholder="Votre nom" />
              <ChampTexte label="Label — Message"   valeur={config.texte_label_message}   onChange={v => set('texte_label_message', v)}   placeholder="Message au vendeur (optionnel)" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <ChampTexte label="Placeholder montant" valeur={config.texte_placeholder_montant} onChange={v => set('texte_placeholder_montant', v)} placeholder="Ex : 45.00" />
              <ChampTexte label="Placeholder message" valeur={config.texte_placeholder_message} onChange={v => set('texte_placeholder_message', v)} placeholder="Ex : Je suis très intéressé..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <ChampTexte label="Bouton Envoyer"  valeur={config.texte_bouton_envoyer}  onChange={v => set('texte_bouton_envoyer', v)}  placeholder="Envoyer mon offre" />
              <ChampTexte label="Bouton Annuler"  valeur={config.texte_bouton_annuler}  onChange={v => set('texte_bouton_annuler', v)}  placeholder="Annuler" />
            </div>

            <SectionTitre titre="💬 Messages de confirmation (après envoi)" />
            <ChampTexte label="Offre envoyée (confirmation)"  valeur={config.texte_offre_envoyee}   onChange={v => set('texte_offre_envoyee', v)}   placeholder="✅ Votre offre a été envoyée !" multiline />
            <ChampTexte label="Offre acceptée par le vendeur" valeur={config.texte_offre_acceptee}  onChange={v => set('texte_offre_acceptee', v)}  placeholder="🎉 Offre acceptée !" multiline />
            <ChampTexte label="Offre refusée par le vendeur"  valeur={config.texte_offre_refusee}   onChange={v => set('texte_offre_refusee', v)}   placeholder="❌ Le vendeur a refusé votre offre." multiline />
          </div>
        )}

        {/* EMAILS */}
        {onglet === 'emails' && (
          <div>
            <SectionTitre titre="📧 Emails automatiques" />
            <Toggle
              label="Email au vendeur — Nouvelle offre reçue"
              description="Le vendeur reçoit un courriel dès qu'un acheteur soumet une offre sur l'un de ses produits."
              valeur={config.email_vendeur_nouvelle_offre}
              onChange={v => set('email_vendeur_nouvelle_offre', v)}
            />
            <Toggle
              label="Email à l'acheteur — Confirmation d'envoi"
              description="L'acheteur reçoit un courriel confirmant que son offre a bien été transmise au vendeur."
              valeur={config.email_acheteur_confirmation}
              onChange={v => set('email_acheteur_confirmation', v)}
            />
            <Toggle
              label="Email à l'acheteur — Offre acceptée"
              description="L'acheteur reçoit un courriel quand le vendeur (ou le système) accepte son offre."
              valeur={config.email_acheteur_accepte}
              onChange={v => set('email_acheteur_accepte', v)}
            />
            <Toggle
              label="Email à l'acheteur — Offre refusée"
              description="L'acheteur reçoit un courriel quand le vendeur refuse son offre."
              valeur={config.email_acheteur_refuse}
              onChange={v => set('email_acheteur_refuse', v)}
            />

            <div style={{ marginTop: '20px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px 18px' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#15803d', margin: '0 0 8px 0' }}>📬 Les emails sont envoyés via AWS SES</p>
              <p style={{ fontSize: '12px', color: '#166534', margin: 0, lineHeight: 1.6 }}>
                Les modèles d'emails Make Offer sont configurés dans votre route Express <code>make_offer.js</code>.
                Vous pouvez personnaliser le contenu HTML dans la section <strong>Modèles de courriels</strong> de l'admin.
              </p>
            </div>

            <div style={{ marginTop: '14px', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '14px 18px' }}>
              <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>
                💡 <strong>Prochain développement :</strong> Les modèles HTML des emails Make Offer seront personnalisables directement depuis l'onglet <strong>Modèles de courriels</strong>.
              </p>
            </div>
          </div>
        )}

        {/* APERÇU */}
        {onglet === 'apercu' && <ApercuWidget config={config} />}
      </div>

      {/* ── Boutons action ── */}
      <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={sauvegarder} disabled={sauvegarde === 'saving'} style={{
          backgroundColor: sauvegarde === 'success' ? THEME.success : sauvegarde === 'error' ? THEME.danger : THEME.accent,
          color: 'white', border: 'none', borderRadius: '10px', padding: '12px 28px',
          fontSize: '14px', fontWeight: '700', cursor: sauvegarde === 'saving' ? 'not-allowed' : 'pointer',
          opacity: sauvegarde === 'saving' ? 0.7 : 1, transition: 'all 0.2s',
        }}>
          {sauvegarde === 'saving' ? '⏳ Sauvegarde...' : sauvegarde === 'success' ? '✅ Sauvegardé !' : sauvegarde === 'error' ? '❌ Erreur' : '💾 Sauvegarder'}
        </button>
        <button onClick={() => setConfig(DEFAULT_CONFIG)} style={{ backgroundColor: 'white', color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '12px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          🔄 Réinitialiser
        </button>
        <button onClick={() => setOnglet('apercu')} style={{ backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '10px', padding: '12px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          👁️ Aperçu interactif
        </button>
      </div>

      <div style={{ marginTop: '20px', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '14px 18px' }}>
        <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>
          <strong>📌 Prochaine étape :</strong> Créer les routes Express <code>routes/make_offer.js</code> et <code>routes/config_make_offer.js</code>, puis déployer le widget <code>evend-make-offer-widget.js</code> dans votre dossier <code>/public</code>.
        </p>
      </div>
    </div>
  );
}