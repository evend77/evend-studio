import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../config/api';

// ── Thème identique à AppAdmin ────────────────────────────────────────────
const THEME = {
  sidebar:      '#1a2436',
  accent:       '#2d6a9f',
  accentLight:  '#e8f2fb',
  bg:           '#f0f2f5',
  card:         '#ffffff',
  border:       '#e1e4e8',
  text:         '#1a2332',
  textLight:    '#6b7280',
  danger:       '#dc2626',
  success:      '#16a34a',
  warning:      '#d97706',
};

// ── Types ─────────────────────────────────────────────────────────────────
interface CookieConfig {
  actif: boolean;
  position: string;
  titre: string;
  description: string;
  bouton_accepter: string;
  bouton_refuser: string;
  bouton_preferences: string;
  lien_politique: string;
  lien_conditions: string;
  texte_politique: string;
  texte_conditions: string;
  couleur_fond: string;
  couleur_titre: string;
  couleur_texte: string;
  couleur_bouton_accept: string;
  couleur_texte_bouton_accept: string;
  afficher_bouton_preferences: boolean;
  categories_actives: { fonctionnalite: boolean; analytique: boolean; marketing: boolean };
  supprimer_non_essentiels: boolean;
}

interface CookieEntry {
  id: number;
  nom: string;
  fournisseur: string;
  categorie: string;
  domaine: string;
  duree: string;
  description: string;
}

const DEFAULT_CONFIG: CookieConfig = {
  actif: true,
  position: 'bas-gauche',
  titre: 'Nous respectons votre vie privée!',
  description: "Conformément à la Loi 25 (Québec) et à la LPRPDE (Canada), certains témoins de connexion (« cookies ») sont nécessaires au fonctionnement sécurisé du site.",
  bouton_accepter: 'Acceptez tout',
  bouton_refuser: 'Accepter obligatoire uniquement',
  bouton_preferences: 'Gérer les préférences',
  lien_politique: '/privacy-policy',
  lien_conditions: '/terms-of-service',
  texte_politique: 'Politique de confidentialité',
  texte_conditions: 'Conditions générales',
  couleur_fond: '#1a2436',
  couleur_titre: '#ffffff',
  couleur_texte: '#cccccc',
  couleur_bouton_accept: '#f5a623',
  couleur_texte_bouton_accept: '#1a1a1a',
  afficher_bouton_preferences: true,
  categories_actives: { fonctionnalite: true, analytique: true, marketing: true },
  supprimer_non_essentiels: true,
};

const COOKIES_PAR_DEFAUT: CookieEntry[] = [
  { id: 1, nom: '_ab', fournisseur: 'Système', categorie: 'Requis', domaine: 'e-vend.ca', duree: 'session', description: 'Test A/B' },
  { id: 2, nom: 'session_id', fournisseur: 'Système', categorie: 'Requis', domaine: 'e-vend.ca', duree: 'session', description: 'Session utilisateur' },
  { id: 3, nom: 'cart', fournisseur: 'Système', categorie: 'Requis', domaine: 'e-vend.ca', duree: '2 semaines', description: 'Panier d\'achat' },
  { id: 4, nom: 'auth_token', fournisseur: 'Système', categorie: 'Requis', domaine: 'e-vend.ca', duree: '30 jours', description: 'Authentification' },
  { id: 5, nom: '_ga', fournisseur: 'Google Analytics', categorie: 'Analytique', domaine: '.e-vend.ca', duree: '2 ans', description: 'Google Analytics' },
  { id: 6, nom: '_fbp', fournisseur: 'Facebook', categorie: 'Marketing', domaine: '.e-vend.ca', duree: '3 mois', description: 'Facebook Pixel' },
  { id: 7, nom: 'lang_pref', fournisseur: 'Système', categorie: 'Fonctionnalité', domaine: 'e-vend.ca', duree: '1 an', description: 'Préférence de langue' },
];

// ── Sous-composants ──────────────────────────────────────────────────────

// Aperçu du widget
function BannerPreview({ config }: { config: CookieConfig }) {
  return (
    <div style={{ border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '24px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: '320px',
        backgroundColor: config.couleur_fond,
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 18px 0', textAlign: 'center' }}>
          <div style={{ fontSize: '26px', marginBottom: '6px' }}>🔒</div>
          <h4 style={{ color: config.couleur_titre, fontSize: '14px', fontWeight: '800', margin: '0 0 8px 0' }}>{config.titre}</h4>
          <p style={{ color: config.couleur_texte, fontSize: '11px', lineHeight: '1.5', margin: 0 }}>
            {config.description.length > 200 ? config.description.slice(0, 200) + '...' : config.description}
          </p>
        </div>
        <div style={{ padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button style={{ padding: '9px', borderRadius: '7px', border: 'none', backgroundColor: config.couleur_bouton_accept, color: config.couleur_texte_bouton_accept, fontSize: '12px', fontWeight: '700', cursor: 'default' }}>
            🔑 {config.bouton_accepter}
          </button>
          <button style={{ padding: '8px', borderRadius: '7px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '11px', cursor: 'default' }}>
            {config.bouton_refuser}
          </button>
          {config.afficher_bouton_preferences && (
            <button style={{ padding: '8px', borderRadius: '7px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', cursor: 'default' }}>
              ⚙️ {config.bouton_preferences}
            </button>
          )}
        </div>
        <div style={{ padding: '8px 18px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', textDecoration: 'underline' }}>{config.texte_politique}</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', textDecoration: 'underline' }}>{config.texte_conditions}</span>
        </div>
      </div>
    </div>
  );
}

// Ligne formulaire
function FormRow({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: THEME.text, marginBottom: '5px' }}>{label}</label>
      {hint && <p style={{ fontSize: '11px', color: THEME.textLight, margin: '0 0 6px 0' }}>{hint}</p>}
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: '7px',
  border: `1px solid ${THEME.border}`, fontSize: '13px',
  color: THEME.text, backgroundColor: 'white', boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle, minHeight: '90px', resize: 'vertical', lineHeight: '1.5',
};

// ── Onglet Paramètres généraux ─────────────────────────────────────────────
function OngletParametres({ config, onChange, onSave, saving }: {
  config: CookieConfig;
  onChange: (c: Partial<CookieConfig>) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
      <div style={{ backgroundColor: THEME.card, borderRadius: '10px', border: `1px solid ${THEME.border}`, padding: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: THEME.text, margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚙️ Configuration générale</h3>

        {/* Actif / Inactif */}
        <FormRow label="Activer la bannière de cookies">
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div
              onClick={() => onChange({ actif: !config.actif })}
              style={{
                width: '44px', height: '24px', borderRadius: '12px', position: 'relative', cursor: 'pointer',
                backgroundColor: config.actif ? THEME.accent : '#d1d5db', transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute', top: '2px', left: config.actif ? '22px' : '2px',
                width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white',
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
            <span style={{ fontSize: '13px', color: config.actif ? THEME.success : THEME.textLight, fontWeight: '600' }}>
              {config.actif ? '✓ Bannière active' : '✗ Bannière désactivée'}
            </span>
          </label>
        </FormRow>

        {/* Position */}
        <FormRow label="Position de la bannière">
          <select value={config.position} onChange={e => onChange({ position: e.target.value })} style={inputStyle}>
            <option value="bas-gauche">En bas à gauche</option>
            <option value="bas-droite">En bas à droite</option>
            <option value="bas-centre">En bas au centre</option>
            <option value="centre">Centre (avec overlay)</option>
          </select>
        </FormRow>

        {/* Supprimer non essentiels */}
        <FormRow label="Supprimer les cookies non essentiels avant le consentement"
          hint="Bloque les cookies analytiques/marketing tant que l'utilisateur n'a pas consenti">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={config.supprimer_non_essentiels}
              onChange={e => onChange({ supprimer_non_essentiels: e.target.checked })} />
            <span style={{ fontSize: '13px', color: THEME.text }}>Activé</span>
          </label>
        </FormRow>

        <h3 style={{ fontSize: '14px', fontWeight: '700', color: THEME.text, margin: '24px 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔘 Boutons</h3>

        <FormRow label="Afficher le bouton de préférences">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={config.afficher_bouton_preferences}
              onChange={e => onChange({ afficher_bouton_preferences: e.target.checked })} />
            <span style={{ fontSize: '13px', color: THEME.text }}>Afficher</span>
          </label>
        </FormRow>

        <h3 style={{ fontSize: '14px', fontWeight: '700', color: THEME.text, margin: '24px 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🍪 Catégories de cookies</h3>
        {(['fonctionnalite', 'analytique', 'marketing'] as const).map(cat => (
          <FormRow key={cat} label={cat === 'fonctionnalite' ? 'Fonctionnalité' : cat === 'analytique' ? 'Analytique' : 'Marketing'}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox"
                checked={config.categories_actives[cat]}
                onChange={e => onChange({ categories_actives: { ...config.categories_actives, [cat]: e.target.checked } })}
              />
              <span style={{ fontSize: '13px', color: THEME.text }}>Activé</span>
            </label>
          </FormRow>
        ))}

        <h3 style={{ fontSize: '14px', fontWeight: '700', color: THEME.text, margin: '24px 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔗 Liens légaux</h3>
        <FormRow label="URL Politique de confidentialité">
          <input style={inputStyle} value={config.lien_politique} onChange={e => onChange({ lien_politique: e.target.value })} placeholder="https://e-vend.ca/privacy-policy" />
        </FormRow>
        <FormRow label="URL Conditions générales">
          <input style={inputStyle} value={config.lien_conditions} onChange={e => onChange({ lien_conditions: e.target.value })} placeholder="https://e-vend.ca/terms-of-service" />
        </FormRow>

        <button onClick={onSave} disabled={saving} style={{
          marginTop: '12px', padding: '11px 28px', backgroundColor: THEME.accent, color: 'white',
          border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'wait' : 'pointer',
          opacity: saving ? 0.7 : 1,
        }}>
          {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder les paramètres'}
        </button>
      </div>

      {/* Aperçu */}
      <div>
        <div style={{ backgroundColor: THEME.card, borderRadius: '10px', border: `1px solid ${THEME.border}`, padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', color: THEME.textLight, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>👁️ Aperçu</h3>
          <BannerPreview config={config} />
        </div>
      </div>
    </div>
  );
}

// ── Onglet Design ─────────────────────────────────────────────────────────
function OngletDesign({ config, onChange, onSave, saving }: {
  config: CookieConfig; onChange: (c: Partial<CookieConfig>) => void; onSave: () => void; saving: boolean;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
      <div style={{ backgroundColor: THEME.card, borderRadius: '10px', border: `1px solid ${THEME.border}`, padding: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: THEME.text, margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎨 Design de la bannière</h3>

        <FormRow label="Couleur de fond de la bannière">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input type="color" value={config.couleur_fond} onChange={e => onChange({ couleur_fond: e.target.value })}
              style={{ width: '44px', height: '36px', border: `1px solid ${THEME.border}`, borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
            <input style={{ ...inputStyle, flex: 1 }} value={config.couleur_fond} onChange={e => onChange({ couleur_fond: e.target.value })} />
          </div>
        </FormRow>

        <FormRow label="Couleur du titre">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input type="color" value={config.couleur_titre} onChange={e => onChange({ couleur_titre: e.target.value })}
              style={{ width: '44px', height: '36px', border: `1px solid ${THEME.border}`, borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
            <input style={{ ...inputStyle, flex: 1 }} value={config.couleur_titre} onChange={e => onChange({ couleur_titre: e.target.value })} />
          </div>
        </FormRow>

        <FormRow label="Couleur du texte de la bannière">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input type="color" value={config.couleur_texte} onChange={e => onChange({ couleur_texte: e.target.value })}
              style={{ width: '44px', height: '36px', border: `1px solid ${THEME.border}`, borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
            <input style={{ ...inputStyle, flex: 1 }} value={config.couleur_texte} onChange={e => onChange({ couleur_texte: e.target.value })} />
          </div>
        </FormRow>

        <h3 style={{ fontSize: '14px', fontWeight: '700', color: THEME.text, margin: '24px 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔘 Bouton d'acceptation</h3>

        <FormRow label="Couleur fond du bouton Accepter">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input type="color" value={config.couleur_bouton_accept} onChange={e => onChange({ couleur_bouton_accept: e.target.value })}
              style={{ width: '44px', height: '36px', border: `1px solid ${THEME.border}`, borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
            <input style={{ ...inputStyle, flex: 1 }} value={config.couleur_bouton_accept} onChange={e => onChange({ couleur_bouton_accept: e.target.value })} />
          </div>
        </FormRow>

        <FormRow label="Couleur texte du bouton Accepter">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input type="color" value={config.couleur_texte_bouton_accept} onChange={e => onChange({ couleur_texte_bouton_accept: e.target.value })}
              style={{ width: '44px', height: '36px', border: `1px solid ${THEME.border}`, borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
            <input style={{ ...inputStyle, flex: 1 }} value={config.couleur_texte_bouton_accept} onChange={e => onChange({ couleur_texte_bouton_accept: e.target.value })} />
          </div>
        </FormRow>

        <button onClick={onSave} disabled={saving} style={{
          marginTop: '16px', padding: '11px 28px', backgroundColor: THEME.accent, color: 'white',
          border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'wait' : 'pointer',
        }}>
          {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
        </button>
      </div>

      <div>
        <div style={{ backgroundColor: THEME.card, borderRadius: '10px', border: `1px solid ${THEME.border}`, padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', color: THEME.textLight, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>👁️ Aperçu en temps réel</h3>
          <BannerPreview config={config} />
        </div>
      </div>
    </div>
  );
}

// ── Onglet Contenu ────────────────────────────────────────────────────────
function OngletContenu({ config, onChange, onSave, saving }: {
  config: CookieConfig; onChange: (c: Partial<CookieConfig>) => void; onSave: () => void; saving: boolean;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
      <div style={{ backgroundColor: THEME.card, borderRadius: '10px', border: `1px solid ${THEME.border}`, padding: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: THEME.text, margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📝 Contenu de la bannière</h3>

        <FormRow label="Titre">
          <input style={inputStyle} value={config.titre} onChange={e => onChange({ titre: e.target.value })} />
        </FormRow>
        <FormRow label="Description" hint="Texte principal de la bannière de cookies">
          <textarea style={textareaStyle} value={config.description} onChange={e => onChange({ description: e.target.value })} />
        </FormRow>

        <h3 style={{ fontSize: '14px', fontWeight: '700', color: THEME.text, margin: '24px 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔘 Libellés des boutons</h3>
        <FormRow label="Bouton Accepter">
          <input style={inputStyle} value={config.bouton_accepter} onChange={e => onChange({ bouton_accepter: e.target.value })} placeholder="Acceptez tout" />
        </FormRow>
        <FormRow label="Bouton Refuser">
          <input style={inputStyle} value={config.bouton_refuser} onChange={e => onChange({ bouton_refuser: e.target.value })} placeholder="Accepter obligatoire uniquement" />
        </FormRow>
        <FormRow label="Bouton Préférences">
          <input style={inputStyle} value={config.bouton_preferences} onChange={e => onChange({ bouton_preferences: e.target.value })} placeholder="Gérer les préférences" />
        </FormRow>

        <h3 style={{ fontSize: '14px', fontWeight: '700', color: THEME.text, margin: '24px 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔗 Liens légaux</h3>
        <FormRow label="Texte du lien Politique de confidentialité">
          <input style={inputStyle} value={config.texte_politique} onChange={e => onChange({ texte_politique: e.target.value })} />
        </FormRow>
        <FormRow label="Texte du lien Conditions générales">
          <input style={inputStyle} value={config.texte_conditions} onChange={e => onChange({ texte_conditions: e.target.value })} />
        </FormRow>

        <button onClick={onSave} disabled={saving} style={{
          marginTop: '12px', padding: '11px 28px', backgroundColor: THEME.accent, color: 'white',
          border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'wait' : 'pointer',
        }}>
          {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder le contenu'}
        </button>
      </div>

      <div>
        <div style={{ backgroundColor: THEME.card, borderRadius: '10px', border: `1px solid ${THEME.border}`, padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', color: THEME.textLight, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>👁️ Aperçu</h3>
          <BannerPreview config={config} />
        </div>
      </div>
    </div>
  );
}

// ── Onglet Scanner de cookies ──────────────────────────────────────────────
function OngletScanner({ cookies, setCookies }: { cookies: CookieEntry[]; setCookies: (c: CookieEntry[]) => void }) {
  const [filtreCategorie, setFiltreCategorie] = useState('Tout');
  const [filtreFournisseur, setFiltreFournisseur] = useState('Tout');
  const [modalOuvert, setModalOuvert] = useState(false);
  const [cookieEnEdition, setCookieEnEdition] = useState<Partial<CookieEntry>>({});
  const [modeEdition, setModeEdition] = useState(false);

  const categories = ['Tout', 'Requis', 'Fonctionnalité', 'Analytique', 'Marketing'];
  const fournisseurs = ['Tout', ...Array.from(new Set(cookies.map(c => c.fournisseur)))];

  const cookiesFiltres = cookies.filter(c => {
    const catOk = filtreCategorie === 'Tout' || c.categorie === filtreCategorie;
    const fourOk = filtreFournisseur === 'Tout' || c.fournisseur === filtreFournisseur;
    return catOk && fourOk;
  });

  const couleurCategorie = (cat: string) => {
    switch (cat) {
      case 'Requis': return { bg: '#dcfce7', color: '#15803d' };
      case 'Analytique': return { bg: '#dbeafe', color: '#1d4ed8' };
      case 'Marketing': return { bg: '#fce7f3', color: '#be185d' };
      case 'Fonctionnalité': return { bg: '#fef9c3', color: '#854d0e' };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  const handleSaveCookie = () => {
    if (!cookieEnEdition.nom) return;
    if (modeEdition && cookieEnEdition.id) {
      setCookies(cookies.map(c => c.id === cookieEnEdition.id ? { ...c, ...cookieEnEdition } as CookieEntry : c));
    } else {
      const newId = Math.max(0, ...cookies.map(c => c.id)) + 1;
      setCookies([...cookies, { id: newId, nom: '', fournisseur: 'Système', categorie: 'Requis', domaine: 'e-vend.ca', duree: 'session', description: '', ...cookieEnEdition }]);
    }
    setModalOuvert(false);
    setCookieEnEdition({});
  };

  return (
    <div style={{ backgroundColor: THEME.card, borderRadius: '10px', border: `1px solid ${THEME.border}`, padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: THEME.text, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔍 Scanner de cookies</h3>
        <button onClick={() => { setCookieEnEdition({}); setModeEdition(false); setModalOuvert(true); }}
          style={{ padding: '8px 16px', backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          + Ajouter un cookie
        </button>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: THEME.textLight }}>Fournisseur :</span>
          <select value={filtreFournisseur} onChange={e => setFiltreFournisseur(e.target.value)}
            style={{ padding: '5px 10px', border: `1px solid ${THEME.border}`, borderRadius: '6px', fontSize: '12px' }}>
            {fournisseurs.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: THEME.textLight }}>Catégorie :</span>
          <select value={filtreCategorie} onChange={e => setFiltreCategorie(e.target.value)}
            style={{ padding: '5px 10px', border: `1px solid ${THEME.border}`, borderRadius: '6px', fontSize: '12px' }}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              {['Nom du cookie', 'Fournisseur', 'Catégorie', 'Domaine', 'Durée', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: THEME.textLight, borderBottom: `1px solid ${THEME.border}`, fontSize: '12px', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cookiesFiltres.map((c, i) => {
              const { bg, color } = couleurCategorie(c.categorie);
              return (
                <tr key={c.id} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid #f3f4f6`, fontWeight: '600', color: THEME.text }}>{c.nom}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid #f3f4f6`, color: THEME.textLight }}>{c.fournisseur}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid #f3f4f6` }}>
                    <span style={{ backgroundColor: bg, color, fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px' }}>{c.categorie}</span>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid #f3f4f6`, color: THEME.textLight, fontSize: '12px' }}>{c.domaine}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid #f3f4f6`, color: THEME.textLight, fontSize: '12px' }}>{c.duree}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid #f3f4f6` }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => { setCookieEnEdition(c); setModeEdition(true); setModalOuvert(true); }}
                        style={{ padding: '4px 8px', backgroundColor: '#f0f2f5', border: `1px solid ${THEME.border}`, borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>✏️</button>
                      <button onClick={() => setCookies(cookies.filter(x => x.id !== c.id))}
                        style={{ padding: '4px 8px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal ajout/édition */}
      {modalOuvert && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '480px', maxWidth: 'calc(100vw - 32px)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: THEME.text }}>{modeEdition ? 'Modifier le cookie' : 'Ajouter un cookie'}</h3>
              <button onClick={() => setModalOuvert(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#666' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'nom', label: 'Nom du cookie', placeholder: '_ga' },
                { key: 'fournisseur', label: 'Fournisseur', placeholder: 'Google Analytics' },
                { key: 'domaine', label: 'Domaine', placeholder: '.e-vend.ca' },
                { key: 'duree', label: 'Durée de conservation', placeholder: '2 ans' },
                { key: 'description', label: 'Description', placeholder: 'Suivi analytique...' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: THEME.text, marginBottom: '4px' }}>{f.label}</label>
                  <input
                    style={inputStyle}
                    value={(cookieEnEdition as any)[f.key] || ''}
                    placeholder={f.placeholder}
                    onChange={e => setCookieEnEdition(p => ({ ...p, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: THEME.text, marginBottom: '4px' }}>Catégorie</label>
                <select style={inputStyle} value={cookieEnEdition.categorie || 'Requis'}
                  onChange={e => setCookieEnEdition(p => ({ ...p, categorie: e.target.value }))}>
                  <option>Requis</option>
                  <option>Fonctionnalité</option>
                  <option>Analytique</option>
                  <option>Marketing</option>
                </select>
              </div>
            </div>
            <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, display: 'flex', gap: '10px', justifyContent: 'flex-end', backgroundColor: '#f9fafb' }}>
              <button onClick={() => setModalOuvert(false)} style={{ padding: '9px 18px', backgroundColor: 'white', border: `1px solid ${THEME.border}`, borderRadius: '7px', cursor: 'pointer', fontSize: '13px' }}>Annuler</button>
              <button onClick={handleSaveCookie} style={{ padding: '9px 18px', backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                {modeEdition ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Onglet Intégration ────────────────────────────────────────────────────
function OngletIntegration() {
  return (
    <div style={{ backgroundColor: THEME.card, borderRadius: '10px', border: `1px solid ${THEME.border}`, padding: '24px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: '700', color: THEME.text, margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔌 Intégration sur votre site</h3>

      <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#0369a1', fontWeight: '600' }}>
          ✅ Le composant CookieBanner est déjà intégré ! Ajoutez-le simplement dans votre App.tsx ou layout principal.
        </p>
      </div>

      {[
        {
          titre: 'Étape 1 — Importer le composant',
          code: `import CookieBanner from './components/CookieBanner';`,
        },
        {
          titre: 'Étape 2 — Ajouter dans votre App/Layout',
          code: `function App() {\n  return (\n    <div>\n      <CookieBanner />\n      {/* le reste de votre app */}\n    </div>\n  );\n}`,
        },
        {
          titre: 'Étape 3 — Lire les préférences utilisateur dans votre code',
          code: `import { useCookieConsent } from './components/CookieBanner';\n\nfunction MonComposant() {\n  const { hasConsented, prefs } = useCookieConsent();\n\n  if (prefs?.analytique) {\n    // activer Google Analytics\n  }\n  if (prefs?.marketing) {\n    // activer Facebook Pixel\n  }\n}`,
        },
        {
          titre: 'Ouvrir la bannière manuellement (ex: lien dans footer)',
          code: `// Vider le consentement pour réafficher la bannière\nlocalStorage.removeItem('evend_cookie_consent');\nwindow.location.reload();`,
        },
      ].map((bloc, i) => (
        <div key={i} style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, marginBottom: '8px' }}>{bloc.titre}</h4>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '14px 18px', position: 'relative' }}>
            <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '12px', lineHeight: '1.6', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {bloc.code}
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(bloc.code)}
              style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 10px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '5px', cursor: 'pointer', fontSize: '11px' }}>
              📋 Copier
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────
export default function GestionCookies({ naviguerVers }: { naviguerVers?: (p: string) => void }) {
  const [onglet, setOnglet] = useState<'parametres' | 'design' | 'contenu' | 'scanner' | 'integration'>('parametres');
  const [config, setConfig] = useState<CookieConfig>(DEFAULT_CONFIG);
  const [cookies, setCookies] = useState<CookieEntry[]>(COOKIES_PAR_DEFAUT);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/cookies/config`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setConfig({ ...DEFAULT_CONFIG, ...data }); })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch(`${API_BASE}/cookies/liste`, { headers: { 'Authorization': `Bearer ${token ? token : ''}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.length) setCookies(data); })
      .catch(() => {});
  }, []);

  const handleChange = (partial: Partial<CookieConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/cookies/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        showToast('Configuration sauvegardée avec succès !', 'success');
      } else {
        showToast('Erreur lors de la sauvegarde', 'error');
      }
    } catch {
      showToast('Erreur de connexion au serveur', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const onglets = [
    { id: 'parametres', label: '⚙️ Paramètres généraux' },
    { id: 'design',     label: '🎨 Design' },
    { id: 'contenu',    label: '📝 Contenu' },
    { id: 'scanner',    label: '🔍 Scanner de cookies' },
    { id: 'integration', label: '🔌 Intégration' },
  ] as const;

  if (loading) {
    return (
      <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
          <p style={{ color: THEME.textLight }}>Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1300px' }}>
      {/* En-tête */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          🍪 Gestion des cookies
        </h1>
        <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
          Configurez la bannière de consentement aux cookies conforme à la Loi 25 (Québec) et LPRPDE (Canada)
        </p>
      </div>

      {/* Badge statut */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          padding: '6px 14px', borderRadius: '20px',
          backgroundColor: config.actif ? '#dcfce7' : '#fee2e2',
          border: `1px solid ${config.actif ? '#86efac' : '#fca5a5'}`,
        }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: config.actif ? THEME.success : THEME.danger }} />
          <span style={{ fontSize: '12px', fontWeight: '700', color: config.actif ? '#15803d' : '#dc2626' }}>
            {config.actif ? 'Bannière active' : 'Bannière désactivée'}
          </span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '6px 14px', borderRadius: '20px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#0369a1' }}>Loi 25 (QC) + LPRPDE (CA)</span>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: `2px solid ${THEME.border}`, marginBottom: '24px', flexWrap: 'wrap' }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)}
            style={{
              padding: '10px 16px', border: 'none', cursor: 'pointer', borderRadius: '8px 8px 0 0',
              fontSize: '13px', fontWeight: onglet === o.id ? '700' : '500',
              backgroundColor: onglet === o.id ? THEME.card : 'transparent',
              color: onglet === o.id ? THEME.accent : THEME.textLight,
              borderBottom: onglet === o.id ? `2px solid ${THEME.accent}` : '2px solid transparent',
              marginBottom: '-2px', transition: 'all 0.15s',
            }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* Contenu onglets */}
      {onglet === 'parametres' && <OngletParametres config={config} onChange={handleChange} onSave={handleSave} saving={saving} />}
      {onglet === 'design'     && <OngletDesign config={config} onChange={handleChange} onSave={handleSave} saving={saving} />}
      {onglet === 'contenu'    && <OngletContenu config={config} onChange={handleChange} onSave={handleSave} saving={saving} />}
      {onglet === 'scanner'    && <OngletScanner cookies={cookies} setCookies={setCookies} />}
      {onglet === 'integration' && <OngletIntegration />}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '80px', right: '24px', zIndex: 2000,
          padding: '12px 20px', borderRadius: '10px',
          backgroundColor: toast.type === 'success' ? '#dcfce7' : '#fee2e2',
          border: `1px solid ${toast.type === 'success' ? '#86efac' : '#fca5a5'}`,
          color: toast.type === 'success' ? '#15803d' : '#dc2626',
          fontSize: '13px', fontWeight: '700',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          animation: 'cookieFadeIn 0.3s ease-out',
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}
    </div>
  );
}