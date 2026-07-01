import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

// ── Thème ──────────────────────────────────────────────────────────────
const T = {
  accent: '#2d6a9f',
  accentLight: '#e8f2fb',
  bg: '#f0f2f5',
  card: '#fff',
  border: '#e1e4e8',
  text: '#1a2332',
  textLight: '#6b7280',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  purple: '#8b5cf6',
  purpleLight: '#ede9fe',
  green: '#059669',
  greenLight: '#d1fae5',
  orange: '#ea580c',
  orangeLight: '#ffedd5',
  blue: '#2563eb',
  blueLight: '#dbeafe',
  pink: '#db2777',
  pinkLight: '#fce7f3',
  canadaRed: '#d7141a',
  canadaRedLight: '#fce8e8',
};

// ── Types ──────────────────────────────────────────────────────────────
interface AddOn {
  id: number;
  addon_id: string;
  nom: string;
  description: string;
  prix: string;
  periode: 'mois' | 'an' | 'gratuit' | 'variable';
  categorie: string;
  popularite: number;
  actif: boolean;
  emoji: string;
  companie: string | null;
  lien_documentation: string | null;
  badges: string[];
  date_creation: string;
  date_modification: string;
  categorie_nom?: string;
  categorie_icon?: string;
  categorie_couleur?: string;
  nb_vendeurs_actifs?: number;
}

interface Categorie {
  id: number;
  categorie_id: string;
  nom: string;
  icon: string;
  couleur: string;
  ordre_affichage: number;
  actif: boolean;
}

type Periode = 'mois' | 'an' | 'gratuit' | 'variable';

interface ToastState {
  msg: string;
  type: 'success' | 'danger' | 'info';
}

interface AdminAddonsProps {
  naviguerVers?: (page: string, data?: any) => void;
}

// ── API URL ────────────────────────────────────────────────────────────
const API_URL = 'http://localhost:5000';

// ── EMOJI MAPPING EN DUR ──────────────────────────────────────────────
const EMOJI_LIST: string[] = [
  '🇨🇦', '🇺🇸', '🇬🇧', '🇫🇷', '🇩🇪', '🇪🇸', '🇮🇹', '🇯🇵', '🇨🇳', '🇧🇷',
  '🚚', '📦', '✈️', '🚢', '🚗', '🚁', '🚀', '🚲', '🚛', '🏎️',
  '🌍', '🌎', '🌏', '🌱', '🌿', '🍃', '🌲', '🌳', '🌴', '🌵',
  '📫', '📬', '📭', '📮', '🏬', '🏦', '🏪', '🏫', '🏥', '🏨',
  '🛒', '🛍️', '🛎️', '🛏️', '🛋️', '🧩', '🧾', '🧳', '🧭', '🧰',
  '⭐', '🌟', '✨', '🎯', '🎁', '🎨', '🎭', '🎪', '🎢', '🎠',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💯', '💎', '💍',
  '📊', '📈', '📉', '📋', '📝', '📚', '📖', '📕', '📗', '📘',
  '💳', '💰', '💵', '💶', '💷', '💸', '🏷️', '🔖', '📌', '📍',
  '👤', '👥', '🤝', '💬', '💭', '🗣️', '👋', '🤚', '✋', '🖐️',
  '🔑', '🔒', '🔓', '🔐', '🛡️', '⚔️', '🛠️', '⚙️', '🔧', '🔨',
  '⏰', '⏳', '⌛', '📅', '📆', '🕐', '🕑', '🕒', '🕓', '🕔',
  '🐘', '🐪', '🐫', '🦒', '🦘', '🐨', '🐼', '🐻', '🐨', '🦊',
  '🍕', '🍔', '🌮', '🌯', '🍣', '🍱', '🍜', '🍲', '🍛', '🍝',
  '📱', '💻', '🖥️', '⌨️', '🖱️', '📷', '📹', '🎥', '📀', '💿',
  '🏆', '🏅', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🎾',
  '🔥', '⚡', '💡', '🔦', '🎵', '🎶', '🔔', '🔕', '📢', '📣',
  '❓', '❗', '❕', '‼️', '⁉️', '➕', '➖', '✖️', '➗', '🔄',
];

const EMOJI_MAP: Record<string, string> = {
  'postes-canada': '🇨🇦', 'purolator': '🚚', 'canpar': '📦', 'expedition-gratuite': '🎁',
  'fedex-canada': '✈️', 'ups-canada': '📫', 'dhl-canada': '🌍', 'intelcom': '🚗',
  'retrait-en-magasin': '🏬', 'shipstation': '🚢', 'sendle-canada': '🌱',
  'poser-une-question': '❓', 'tags-categories-vendeur': '🏷️', 'gestion-creneaux-horaires': '⏰',
  'badges-vendeurs-clients': '🏅', 'affiliation-parrainage': '🤝', 'blog-vendeur': '📝',
  'chat-vendeur-acheteur': '💬', 'connexion-reseaux-sociaux': '🔑', 'personnel-administrateur': '👥',
  'produit-global': '🌐', 'flux-de-produits': '📊', 'expiration-produits': '⏳',
  'marche-hyperlocal': '📍', 'assurance-transport': '🛡️', 'favoris-produits-vendeurs': '❤️',
  'encheres-produits': '🔨', 'integration-zoho': '📈', 'gestion-de-stock': '📦',
  'tps-tvq-tvh': '🧾', 'produits-avec-reservation': '📅', 'offres-du-jour': '🔥',
  'panier-divise': '🛒', 'zoom-meeting': '📹', 'tarification-par-creneau': '⏱️',
  'design-artiste': '🎨', 'options-personnalisees': '⚙️', 'payez-ce-que-vous-voulez': '💰',
  'creneaux-de-livraison': '📅', 'produits-en-lot': '📦', 'impression-a-la-demande': '🖨️',
  'connecteur-shopify': '🛒', 'connecteur-woocommerce': '🐘', 'connecteur-etsy': '🧶',
  'connecteur-magento': '📈', 'connecteur-square': '💳', 'connecteur-lightspeed': '💡',
  'connecteur-squarespace': '📐', 'connecteur-bigcommerce': '🏪', 'connecteur-amazon': '🛍️',
  'connecteur-ebay': '🏷️', 'stripe-connect': '💳', 'interac-online': '🏦', 'paybright': '💰',
  'square-payments': '💳', 'klaviyo-canada': '📧', 'whatsapp-canada': '💬', 'facebook-ads': '📣',
  'google-ads': '🔍', 'avis-clients': '⭐', 'localisateur-magasin': '📍', 'abonnements-stripe': '🔄',
  'chat-gpt': '🤖', 'sauvegarde-base-donnees': '💾', 'filigrane': '💧', 'achats-groupes': '👥',
  'pwa': '📱', 'alertes-sms': '📱', 'inventaire-multi-emplacements': '📍', 'gestion-commandes-client': '📋',
  'compliance-canada': '⚖️'
};

const CATEGORY_EMOJI_MAP: Record<string, string> = {
  'shipping': '📦', 'seller': '👤', 'product': '🛍️', 'connector': '🔌', 'payment': '💳', 'marketing': '📣', 'other': '⚙️'
};

const getEmoji = (addonId: string): string => EMOJI_MAP[addonId] || '🧩';
const getCategoryEmoji = (categorieId: string): string => CATEGORY_EMOJI_MAP[categorieId] || '📦';

// ── Toast ──────────────────────────────────────────────────────────────
const Toast: React.FC<{ msg: string; type: 'success' | 'danger' | 'info' }> = ({ msg, type }) => {
  const bg = { success: T.success, danger: T.danger, info: T.accent }[type];
  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: bg,
        color: 'white',
        padding: '12px 18px',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: '700',
        zIndex: 3000,
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      }}
    >
      {msg}
    </div>
  );
};

// ── Modal Détails ──────────────────────────────────────────────────────
const ModalDetails: React.FC<{ addon: AddOn | null; onClose: () => void }> = ({ addon, onClose }) => {
  if (!addon) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          maxWidth: '500px',
          width: '100%',
          padding: '28px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>{getEmoji(addon.addon_id)}</span>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: T.text }}>{addon.nom}</h2>
              <p style={{ fontSize: '12px', color: T.textLight, margin: 0 }}>#{addon.addon_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: T.textLight,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: T.text, margin: 0, lineHeight: '1.6' }}>{addon.description}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          <div>
            <p style={{ fontSize: '10px', color: T.textLight, margin: 0, textTransform: 'uppercase' }}>Prix</p>
            <p style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>
              {addon.prix === '0' ? 'Gratuit' : `${addon.prix} $CAD`}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '10px', color: T.textLight, margin: 0, textTransform: 'uppercase' }}>Période</p>
            <p style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>{addon.periode}</p>
          </div>
          <div>
            <p style={{ fontSize: '10px', color: T.textLight, margin: 0, textTransform: 'uppercase' }}>Catégorie</p>
            <p style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>{addon.categorie_nom || addon.categorie}</p>
          </div>
          <div>
            <p style={{ fontSize: '10px', color: T.textLight, margin: 0, textTransform: 'uppercase' }}>Statut</p>
            <p style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: addon.actif ? T.success : T.danger }}>
              {addon.actif ? '✅ Actif' : '❌ Inactif'}
            </p>
          </div>
        </div>

        {addon.badges && addon.badges.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {addon.badges.map((badge, i) => (
              <span
                key={i}
                style={{
                  backgroundColor: '#f3f4f6',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: T.text,
                }}
              >
                {badge === 'populaire' && '⭐ '}
                {badge === 'canada' && '🇨🇦 '}
                {badge === 'exclusif' && '✨ '}
                {badge === 'gratuit' && '🎁 '}
                {badge === 'nouveau' && '🆕 '}
                {badge}
              </span>
            ))}
          </div>
        )}

        {addon.companie && (
          <p style={{ fontSize: '12px', color: T.textLight, margin: '0 0 16px 0' }}>
            <strong>Compagnie :</strong> {addon.companie}
          </p>
        )}

        {addon.nb_vendeurs_actifs !== undefined && (
          <p style={{ fontSize: '12px', color: T.textLight, margin: 0 }}>
            <strong>Vendeurs actifs :</strong> {addon.nb_vendeurs_actifs}
          </p>
        )}
      </div>
    </div>
  );
};

// ── POPUP CRÉER/MODIFIER ADD-ON ──────────────────────────────────────
interface PopupAddonProps {
  addon: Partial<AddOn> | null;
  onClose: () => void;
  onSave: (data: any) => void;
  categories: Categorie[];
}

interface PopupFormData {
  addon_id: string;
  nom: string;
  description: string;
  prix: string;
  periode: Periode;
  categorie: string;
  popularite: number;
  emoji: string;
  companie: string;
  lien_documentation: string;
  badges: string[];
  actif: boolean;
}

const PopupAddon: React.FC<PopupAddonProps> = ({ addon, onClose, onSave, categories }) => {
  const defaultCategorie = categories.length > 0 ? categories[0].categorie_id : '';

  const [form, setForm] = useState<PopupFormData>({
    addon_id: '',
    nom: '',
    description: '',
    prix: '0',
    periode: 'mois',
    categorie: defaultCategorie,
    popularite: 0,
    emoji: '🧩',
    companie: '',
    lien_documentation: '',
    badges: [],
    actif: false,
  });

  const [showCustomEmoji, setShowCustomEmoji] = useState<boolean>(false);
  const [customEmoji, setCustomEmoji] = useState<string>('');

  useEffect(() => {
    if (addon) {
      const existingEmoji = addon.emoji || EMOJI_MAP[addon.addon_id || ''] || '🧩';
      setForm({
        addon_id: addon.addon_id || '',
        nom: addon.nom || '',
        description: addon.description || '',
        prix: addon.prix || '0',
        periode: (addon.periode as Periode) || 'mois',
        categorie: addon.categorie || defaultCategorie,
        popularite: addon.popularite || 0,
        emoji: existingEmoji,
        companie: addon.companie || '',
        lien_documentation: addon.lien_documentation || '',
        badges: addon.badges || [],
        actif: addon.actif || false,
      });
      if (!EMOJI_LIST.includes(existingEmoji) && existingEmoji !== '🧩') {
        setShowCustomEmoji(true);
        setCustomEmoji(existingEmoji);
      }
    }
  }, [addon, defaultCategorie]);

  useEffect(() => {
    if (categories.length > 0 && !form.categorie) {
      setForm((prev) => ({ ...prev, categorie: categories[0].categorie_id }));
    }
  }, [categories, form.categorie]);

  const badgeOptions = [
    { value: 'populaire', label: '⭐ Populaire' },
    { value: 'canada', label: '🇨🇦 Canada' },
    { value: 'exclusif', label: '✨ Exclusif' },
    { value: 'gratuit', label: '🎁 Gratuit' },
    { value: 'nouveau', label: '🆕 Nouveau' },
    { value: 'beta', label: '🧪 Beta' },
  ];

  const handleBadgeToggle = (badge: string) => {
    setForm((prev) => ({
      ...prev,
      badges: prev.badges.includes(badge) ? prev.badges.filter((b) => b !== badge) : [...prev.badges, badge],
    }));
  };

  const handleEmojiSelect = (emoji: string) => {
    setForm((prev) => ({ ...prev, emoji }));
    setShowCustomEmoji(false);
    setCustomEmoji('');
  };

  const handleCustomEmoji = () => {
    if (customEmoji.trim()) {
      setForm((prev) => ({ ...prev, emoji: customEmoji.trim() }));
      if (!EMOJI_LIST.includes(customEmoji.trim())) {
        EMOJI_LIST.push(customEmoji.trim());
      }
      setShowCustomEmoji(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showCustomEmoji && customEmoji.trim()) {
      setForm((prev) => ({ ...prev, emoji: customEmoji.trim() }));
      if (!EMOJI_LIST.includes(customEmoji.trim())) {
        EMOJI_LIST.push(customEmoji.trim());
      }
    }
    onSave(form);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 4000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          maxWidth: '600px',
          width: '100%',
          padding: '28px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: T.text }}>
            {addon?.addon_id ? "✏️ Modifier l'add-on" : '➕ Créer un nouvel add-on'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: T.textLight,
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: T.text, display: 'block', marginBottom: '4px' }}>
                ID unique *
              </label>
              <input
                value={form.addon_id}
                onChange={(e) => setForm({ ...form, addon_id: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                placeholder="ex: mon-addon"
                required
                disabled={!!addon?.addon_id}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${T.border}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  backgroundColor: addon?.addon_id ? '#f3f4f6' : 'white',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: T.text, display: 'block', marginBottom: '4px' }}>
                Nom *
              </label>
              <input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Nom de l'add-on"
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${T.border}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: T.text, display: 'block', marginBottom: '4px' }}>
                Description *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description détaillée de l'add-on"
                required
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${T.border}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: T.text, display: 'block', marginBottom: '4px' }}>
                Prix ($CAD)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.prix}
                onChange={(e) => setForm({ ...form, prix: e.target.value })}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${T.border}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: T.text, display: 'block', marginBottom: '4px' }}>
                Période
              </label>
              <select
                value={form.periode}
                onChange={(e) => setForm({ ...form, periode: e.target.value as Periode })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${T.border}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="mois">Mois</option>
                <option value="an">An</option>
                <option value="gratuit">Gratuit</option>
                <option value="variable">Variable</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: T.text, display: 'block', marginBottom: '4px' }}>
                Catégorie *
              </label>
              <select
                value={form.categorie}
                onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${T.border}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                {categories.map((cat) => (
                  <option key={cat.categorie_id} value={cat.categorie_id}>
                    {getCategoryEmoji(cat.categorie_id)} {cat.nom}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: T.text, display: 'block', marginBottom: '4px' }}>
                Emoji *
              </label>

              {!showCustomEmoji ? (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(10, 1fr)',
                      gap: '4px',
                      maxHeight: '120px',
                      overflowY: 'auto',
                      padding: '4px',
                      border: `1px solid ${T.border}`,
                      borderRadius: '8px',
                      backgroundColor: '#fafafa',
                      marginBottom: '8px',
                    }}
                  >
                    {EMOJI_LIST.map((emoji) => (
                      <div
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        style={{
                          backgroundColor: form.emoji === emoji ? T.accentLight : 'transparent',
                          border: `2px solid ${form.emoji === emoji ? T.accent : 'transparent'}`,
                          borderRadius: '6px',
                          padding: '6px 4px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          fontSize: '20px',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (form.emoji !== emoji) {
                            e.currentTarget.style.backgroundColor = '#f0f0f0';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (form.emoji !== emoji) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {emoji}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: T.text }}>
                      Emoji sélectionné : {form.emoji}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomEmoji(true)}
                      style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        border: `1px solid ${T.border}`,
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      ✨ Ajouter un emoji personnalisé
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={customEmoji}
                    onChange={(e) => setCustomEmoji(e.target.value)}
                    placeholder="Collez votre emoji ici..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: `1px solid ${T.border}`,
                      borderRadius: '8px',
                      fontSize: '24px',
                      outline: 'none',
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCustomEmoji}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: T.accent,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    ✅ Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomEmoji(false);
                      setCustomEmoji('');
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'white',
                      border: `1px solid ${T.border}`,
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    ✕ Annuler
                  </button>
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: T.text, display: 'block', marginBottom: '4px' }}>
                Compagnie
              </label>
              <input
                value={form.companie}
                onChange={(e) => setForm({ ...form, companie: e.target.value })}
                placeholder="Nom de la compagnie"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${T.border}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: T.text, display: 'block', marginBottom: '4px' }}>
                Lien documentation
              </label>
              <input
                value={form.lien_documentation}
                onChange={(e) => setForm({ ...form, lien_documentation: e.target.value })}
                placeholder="https://..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${T.border}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: T.text, display: 'block', marginBottom: '8px' }}>
                Badges
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {badgeOptions.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => handleBadgeToggle(b.value)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      border: `2px solid ${form.badges.includes(b.value) ? T.accent : T.border}`,
                      backgroundColor: form.badges.includes(b.value) ? T.accentLight : 'white',
                      color: form.badges.includes(b.value) ? T.accent : T.text,
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: T.text, display: 'block', marginBottom: '4px' }}>
                Actif
              </label>
              <div
                onClick={() => setForm({ ...form, actif: !form.actif })}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  backgroundColor: form.actif ? T.success : '#d1d5db',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: form.actif ? '24px' : '3px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                />
              </div>
              <span style={{ fontSize: '12px', color: T.textLight }}>
                {form.actif ? '✅ Visible par les vendeurs' : '❌ Caché'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: `1px solid ${T.border}`,
                backgroundColor: 'white',
                color: T.text,
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: T.accent,
                color: 'white',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
              }}
            >
              {addon?.addon_id ? '💾 Sauvegarder' : '➕ Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── CARTE ADD-ON (sidebar) ────────────────────────────────────────────
interface AddonSidebarItemProps {
  addon: AddOn;
  isSelected: boolean;
  onClick: () => void;
  onToggle: (id: string) => void;
}

const AddonSidebarItem: React.FC<AddonSidebarItemProps> = ({ addon, isSelected, onClick, onToggle }) => {
  const categorieCouleur = addon.categorie_couleur || T.accent;
  const displayEmoji = getEmoji(addon.addon_id);
  const categoryEmoji = getCategoryEmoji(addon.categorie);

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        cursor: 'pointer',
        borderLeft: `3px solid ${isSelected ? categorieCouleur : 'transparent'}`,
        backgroundColor: isSelected ? 'white' : 'rgba(255,255,255,0.6)',
        boxShadow: isSelected ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: '18px', marginRight: '8px' }}>{displayEmoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: '12px',
            fontWeight: isSelected ? '800' : '600',
            color: addon.actif ? (isSelected ? categorieCouleur : T.text) : '#9ca3af',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textDecoration: addon.actif ? 'none' : 'line-through',
          }}
        >
          {addon.nom}
        </p>
        <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
          <span
            style={{
              fontSize: '8px',
              backgroundColor: addon.categorie_couleur ? addon.categorie_couleur + '20' : '#f3f4f6',
              color: addon.categorie_couleur || T.textLight,
              padding: '1px 6px',
              borderRadius: '4px',
              fontWeight: '700',
            }}
          >
            {categoryEmoji} {addon.categorie_nom || addon.categorie}
          </span>
          <span
            style={{
              fontSize: '8px',
              backgroundColor: addon.actif ? '#dcfce7' : '#fee2e2',
              color: addon.actif ? '#16a34a' : '#dc2626',
              padding: '1px 6px',
              borderRadius: '4px',
              fontWeight: '700',
            }}
          >
            {addon.actif ? '✅' : '❌'}
          </span>
        </div>
      </div>
      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggle(addon.addon_id);
        }}
        style={{
          width: '32px',
          height: '18px',
          borderRadius: '9px',
          backgroundColor: addon.actif ? T.success : '#d1d5db',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background 0.2s',
          flexShrink: 0,
          marginLeft: '8px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: addon.actif ? '16px' : '2px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: 'white',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    </div>
  );
};


// ── POPUP CRÉER/MODIFIER CATÉGORIE ───────────────────────────────────
interface PopupCategorieProps {
  categorie: Partial<Categorie> | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

const COULEURS_PRESET = [
  '#2d6a9f', '#16a34a', '#dc2626', '#d97706', '#8b5cf6',
  '#db2777', '#059669', '#ea580c', '#2563eb', '#0891b2',
  '#65a30d', '#9333ea', '#c2410c', '#0f766e', '#1d4ed8',
];

const ICONES_PRESET = [
  '📦', '👤', '🛍️', '🔌', '💳', '📣', '⚙️', '🚚', '🌍', '📊',
  '🔧', '💡', '🎯', '🏷️', '📱', '🔑', '💬', '⭐', '🏆', '🔥',
  '📝', '🧩', '🏪', '🏦', '🛒', '🌐', '📅', '⏰', '🧾', '🔄',
];

const PopupCategorie: React.FC<PopupCategorieProps> = ({ categorie, onClose, onSave }) => {
  const [form, setForm] = useState({
    categorie_id: '',
    nom: '',
    icon: '📦',
    couleur: '#2d6a9f',
    ordre_affichage: 0,
  });

  useEffect(() => {
    if (categorie) {
      setForm({
        categorie_id: categorie.categorie_id || '',
        nom: categorie.nom || '',
        icon: categorie.icon || '📦',
        couleur: categorie.couleur || '#2d6a9f',
        ordre_affichage: categorie.ordre_affichage || 0,
      });
    }
  }, [categorie]);

  const isEdit = !!categorie?.categorie_id;

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000, padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: T.text }}>
            {isEdit ? '✏️ Modifier la catégorie' : '➕ Nouvelle catégorie'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: T.textLight }}>✕</button>
        </div>

        {/* Aperçu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: form.couleur + '15', borderRadius: '10px', border: `2px solid ${form.couleur}`, marginBottom: '20px' }}>
          <span style={{ fontSize: '24px' }}>{form.icon}</span>
          <span style={{ fontSize: '15px', fontWeight: '800', color: form.couleur }}>{form.nom || 'Aperçu de la catégorie'}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {!isEdit && (
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: T.text, display: 'block', marginBottom: '4px' }}>ID unique *</label>
              <input
                value={form.categorie_id}
                onChange={(e) => setForm({ ...form, categorie_id: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                placeholder="ex: livraison"
                required
                style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
              <p style={{ fontSize: '10px', color: T.textLight, margin: '4px 0 0' }}>Identifiant interne, ne peut pas être modifié après création.</p>
            </div>
          )}

          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', color: T.text, display: 'block', marginBottom: '4px' }}>Nom *</label>
            <input
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="Ex: Livraison & Transport"
              required
              style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', color: T.text, display: 'block', marginBottom: '6px' }}>Icône</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px', padding: '8px', border: `1px solid ${T.border}`, borderRadius: '8px', backgroundColor: '#fafafa', marginBottom: '6px' }}>
              {ICONES_PRESET.map((ic) => (
                <div
                  key={ic}
                  onClick={() => setForm({ ...form, icon: ic })}
                  style={{
                    fontSize: '20px', textAlign: 'center', padding: '4px', borderRadius: '6px', cursor: 'pointer',
                    backgroundColor: form.icon === ic ? T.accentLight : 'transparent',
                    border: `2px solid ${form.icon === ic ? T.accent : 'transparent'}`,
                  }}
                >
                  {ic}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: T.textLight, margin: '2px 0 0' }}>Icône sélectionnée : {form.icon}</p>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', color: T.text, display: 'block', marginBottom: '6px' }}>Couleur</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
              {COULEURS_PRESET.map((c) => (
                <div
                  key={c}
                  onClick={() => setForm({ ...form, couleur: c })}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%', backgroundColor: c, cursor: 'pointer',
                    border: `3px solid ${form.couleur === c ? T.text : 'transparent'}`,
                    boxShadow: form.couleur === c ? '0 0 0 2px white inset' : 'none',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={form.couleur}
                onChange={(e) => setForm({ ...form, couleur: e.target.value })}
                style={{ width: '36px', height: '36px', border: 'none', padding: 0, cursor: 'pointer', borderRadius: '6px' }}
              />
              <input
                value={form.couleur}
                onChange={(e) => setForm({ ...form, couleur: e.target.value })}
                placeholder="#2d6a9f"
                style={{ flex: 1, padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: '6px', fontSize: '12px', outline: 'none', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', color: T.text, display: 'block', marginBottom: '4px' }}>Ordre d'affichage</label>
            <input
              type="number"
              value={form.ordre_affichage}
              onChange={(e) => setForm({ ...form, ordre_affichage: parseInt(e.target.value) || 0 })}
              style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
            <p style={{ fontSize: '10px', color: T.textLight, margin: '4px 0 0' }}>Plus le chiffre est petit, plus la catégorie apparaît en haut.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 20px', borderRadius: '8px', border: `1px solid ${T.border}`, backgroundColor: 'white', color: T.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
          >
            Annuler
          </button>
          <button
            onClick={() => { if (form.nom && (isEdit || form.categorie_id)) onSave(form); }}
            style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', backgroundColor: form.couleur, color: 'white', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
          >
            {isEdit ? '💾 Sauvegarder' : '➕ Créer'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── PAGE PRINCIPALE ─────────────────────────────────────────────────────
const AdminAddons: React.FC<AdminAddonsProps> = ({ naviguerVers }) => {
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [recherche, setRecherche] = useState<string>('');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [popupAddon, setPopupAddon] = useState<{ open: boolean; addon: Partial<AddOn> | null }>({
    open: false,
    addon: null,
  });
  const [modalDetails, setModalDetails] = useState<AddOn | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [popupCategorie, setPopupCategorie] = useState<{ open: boolean; categorie: Partial<Categorie> | null }>({ open: false, categorie: null });

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const addonsRes = await axios.get(`${API_URL}/api/addons/admin/addons`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (addonsRes.data.success) {
        setAddons(addonsRes.data.data);
        if (addonsRes.data.data.length > 0 && !selectedId) {
          setSelectedId(addonsRes.data.data[0].addon_id);
        }
      }

      const catRes = await axios.get(`${API_URL}/api/addons/admin/addons-categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (catRes.data.success) {
        setCategories(catRes.data.data);
      }
    } catch (err) {
      console.error('Erreur chargement:', err);
      showToast('❌ Erreur chargement des données', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string, type: 'success' | 'danger' | 'info'): void => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggle = async (addonId: string): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/api/addons/admin/addons/${addonId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setAddons((prev) => prev.map((a) => (a.addon_id === addonId ? { ...a, actif: !a.actif } : a)));
        showToast(res.data.message, 'success');
      }
    } catch (err) {
      console.error('Erreur toggle:', err);
      showToast('❌ Erreur lors du changement de statut', 'danger');
    }
  };

  const handleSave = async (formData: any): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const isEdit = !!formData.addon_id && addons.some((a) => a.addon_id === formData.addon_id);

      const url = isEdit
        ? `${API_URL}/api/addons/admin/addons/${formData.addon_id}`
        : `${API_URL}/api/addons/admin/addons`;

      const method = isEdit ? 'put' : 'post';

      // Mémoriser l'emoji côté frontend seulement (pas de colonne emoji en BD)
      if (formData.emoji && formData.addon_id) {
        EMOJI_MAP[formData.addon_id] = formData.emoji;
      }

      // Retirer le champ emoji avant l'envoi — la BD n'a pas cette colonne
      const { emoji, ...dataToSend } = formData;

      const res = await axios({
        method,
        url,
        data: dataToSend,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        showToast(res.data.message || '✅ Add-on sauvegardé !', 'success');
        setPopupAddon({ open: false, addon: null });
        loadData();
      }
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err);
      showToast(err.response?.data?.error || '❌ Erreur lors de la sauvegarde', 'danger');
    }
  };


  const handleSaveCategorie = async (formData: any): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const isEdit = !!formData.categorie_id && categories.some((c) => c.categorie_id === formData.categorie_id);
      const url = isEdit
        ? `${API_URL}/api/addons/admin/addons-categories/${formData.categorie_id}`
        : `${API_URL}/api/addons/admin/addons-categories`;
      const method = isEdit ? 'put' : 'post';
      const res = await axios({ method, url, data: formData, headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        showToast(res.data.message || '✅ Catégorie sauvegardée !', 'success');
        setPopupCategorie({ open: false, categorie: null });
        loadData();
      }
    } catch (err: any) {
      console.error('Erreur sauvegarde catégorie:', err);
      showToast(err.response?.data?.error || '❌ Erreur lors de la sauvegarde', 'danger');
    }
  };

  const addonsFiltres = useMemo(() => {
    if (!recherche.trim()) return addons;
    return addons.filter(
      (a) =>
        a.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        a.description.toLowerCase().includes(recherche.toLowerCase()) ||
        a.addon_id.toLowerCase().includes(recherche.toLowerCase())
    );
  }, [addons, recherche]);

  const addonsParCategorie = useMemo(() => {
    const grouped: Record<string, AddOn[]> = {};
    addonsFiltres.forEach((a) => {
      const key = a.categorie;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(a);
    });
    return grouped;
  }, [addonsFiltres]);

  const selectedAddon = addons.find((a) => a.addon_id === selectedId);

  const getCategorieStyle = (categorieId: string) => {
    const cat = categories.find((c) => c.categorie_id === categorieId);
    return {
      bg: cat?.couleur ? cat.couleur + '15' : '#f3f4f6',
      color: cat?.couleur || T.textLight,
      label: cat?.nom || categorieId,
      icon: getCategoryEmoji(categorieId),
    };
  };

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <ModalDetails addon={modalDetails} onClose={() => setModalDetails(null)} />
      {popupAddon.open && (
        <PopupAddon
          addon={popupAddon.addon}
          onClose={() => setPopupAddon({ open: false, addon: null })}
          onSave={handleSave}
          categories={categories}
        />
      )}
      {popupCategorie.open && (
        <PopupCategorie
          categorie={popupCategorie.categorie}
          onClose={() => setPopupCategorie({ open: false, categorie: null })}
          onSave={handleSaveCategorie}
        />
      )}

      <div style={{ display: 'flex', height: '100vh', backgroundColor: T.bg, overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <div
          style={{
            width: '280px',
            backgroundColor: '#f8f9fb',
            borderRight: `1px solid ${T.border}`,
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${T.border}`, backgroundColor: T.card }}>
            <h2
              style={{
                fontSize: '13px',
                fontWeight: '900',
                color: T.accent,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: '0 0 8px',
              }}
            >
              🧩 Add-ons
            </h2>
            <button
              onClick={() => setPopupAddon({ open: true, addon: null })}
              style={{
                width: '100%',
                backgroundColor: T.accent,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              ✨ + Créer un add-on
            </button>
            <button
              onClick={() => setPopupCategorie({ open: true, categorie: null })}
              style={{
                width: '100%',
                backgroundColor: 'white',
                color: T.accent,
                border: `1px solid ${T.accent}`,
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              🗂️ + Nouvelle catégorie
            </button>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '12px',
                  color: T.textLight,
                }}
              >
                🔍
              </span>
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher un add-on..."
                style={{
                  width: '100%',
                  border: `1px solid ${T.border}`,
                  borderRadius: '7px',
                  padding: '7px 8px 7px 28px',
                  fontSize: '11px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#f8f9fb',
                }}
              />
            </div>
            <p style={{ fontSize: '10px', color: T.textLight, margin: '6px 0 0', textAlign: 'center' }}>
              {addons.filter((a) => a.actif).length}/{addons.length} actifs
            </p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: T.textLight }}>⏳ Chargement...</div>
            ) : (
              Object.entries(addonsParCategorie).map(([categorieId, items]) => {
                const style = getCategorieStyle(categorieId);
                const actifCount = items.filter((a) => a.actif).length;

                return (
                  <div key={categorieId} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <div
                      onClick={() => {
                        const cat = categories.find((c) => c.categorie_id === categorieId);
                        if (cat) setPopupCategorie({ open: true, categorie: cat });
                      }}
                      title="Cliquer pour modifier la catégorie"
                      style={{
                        backgroundColor: style.bg,
                        borderLeft: `3px solid ${style.color}`,
                        padding: '6px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px' }}>{style.icon}</span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '900',
                            color: style.color,
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px',
                          }}
                        >
                          {style.label}
                        </span>
                        <span style={{ fontSize: '9px', color: style.color, opacity: 0.6 }}>✏️</span>
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          backgroundColor: 'white',
                          color: style.color,
                          padding: '2px 7px',
                          borderRadius: '10px',
                          fontWeight: '800',
                          border: `1px solid ${style.color}30`,
                        }}
                      >
                        {actifCount}/{items.length}
                      </span>
                    </div>
                    {items.map((addon) => (
                      <AddonSidebarItem
                        key={addon.addon_id}
                        addon={addon}
                        isSelected={selectedId === addon.addon_id}
                        onClick={() => setSelectedId(addon.addon_id)}
                        onToggle={handleToggle}
                      />
                    ))}
                  </div>
                );
              })
            )}
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderTop: `1px solid ${T.border}`,
              backgroundColor: T.card,
              fontSize: '10px',
              color: T.textLight,
              textAlign: 'center',
            }}
          >
            {addons.length} add-ons · {categories.length} catégories
          </div>
        </div>

        {/* ZONE PRINCIPALE */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedAddon ? (
            <>
              <div
                style={{
                  backgroundColor: T.card,
                  borderBottom: `1px solid ${T.border}`,
                  padding: '12px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>{getEmoji(selectedAddon.addon_id)}</span>
                  <div>
                    <h1 style={{ fontSize: '16px', fontWeight: '900', margin: 0, color: T.text }}>
                      {selectedAddon.nom}
                    </h1>
                    <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>
                      #{selectedAddon.addon_id} · {selectedAddon.categorie_nom || selectedAddon.categorie}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: selectedAddon.actif ? T.success : T.textLight,
                      }}
                    >
                      {selectedAddon.actif ? '● Actif' : '○ Inactif'}
                    </span>
                    <div
                      onClick={() => handleToggle(selectedAddon.addon_id)}
                      style={{
                        width: '36px',
                        height: '20px',
                        borderRadius: '10px',
                        backgroundColor: selectedAddon.actif ? T.success : '#d1d5db',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: '3px',
                          left: selectedAddon.actif ? '18px' : '3px',
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: 'white',
                          transition: 'left 0.2s',
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setPopupAddon({ open: true, addon: selectedAddon })}
                    style={{
                      backgroundColor: 'white',
                      border: `1px solid ${T.border}`,
                      borderRadius: '7px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    ✏️ Modifier
                  </button>

                  <button
                    onClick={() => setModalDetails(selectedAddon)}
                    style={{
                      backgroundColor: T.accent,
                      color: 'white',
                      border: 'none',
                      borderRadius: '7px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                    }}
                  >
                    👁️ Détails
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                  <div
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      border: `1px solid ${T.border}`,
                      padding: '20px',
                      marginBottom: '20px',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '13px',
                        fontWeight: '800',
                        color: T.text,
                        margin: '0 0 8px 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      📝 Description
                    </h3>
                    <p style={{ fontSize: '14px', color: T.text, lineHeight: '1.6', margin: 0 }}>
                      {selectedAddon.description}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '12px',
                      marginBottom: '20px',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        border: `1px solid ${T.border}`,
                        padding: '14px 16px',
                      }}
                    >
                      <p style={{ fontSize: '10px', color: T.textLight, margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                        💰 Prix
                      </p>
                      <p style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                        {selectedAddon.prix === '0' ? 'Gratuit' : `${selectedAddon.prix} $CAD`}
                      </p>
                      <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>{selectedAddon.periode}</p>
                    </div>

                    <div
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        border: `1px solid ${T.border}`,
                        padding: '14px 16px',
                      }}
                    >
                      <p style={{ fontSize: '10px', color: T.textLight, margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                        📊 Popularité
                      </p>
                      <p style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>⭐ {selectedAddon.popularite || 0}</p>
                      <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>
                        Vendeurs actifs: {selectedAddon.nb_vendeurs_actifs || 0}
                      </p>
                    </div>

                    <div
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        border: `1px solid ${T.border}`,
                        padding: '14px 16px',
                      }}
                    >
                      <p style={{ fontSize: '10px', color: T.textLight, margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                        🏷️ Badges
                      </p>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {selectedAddon.badges && selectedAddon.badges.length > 0 ? (
                          selectedAddon.badges.map((b, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: '11px',
                                backgroundColor: '#f3f4f6',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontWeight: '700',
                              }}
                            >
                              {b === 'populaire' && '⭐ '}
                              {b === 'canada' && '🇨🇦 '}
                              {b === 'exclusif' && '✨ '}
                              {b === 'gratuit' && '🎁 '}
                              {b === 'nouveau' && '🆕 '}
                              {b}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '11px', color: T.textLight }}>Aucun badge</span>
                        )}
                      </div>
                    </div>

                    {selectedAddon.companie && (
                      <div
                        style={{
                          backgroundColor: 'white',
                          borderRadius: '12px',
                          border: `1px solid ${T.border}`,
                          padding: '14px 16px',
                        }}
                      >
                        <p
                          style={{ fontSize: '10px', color: T.textLight, margin: '0 0 4px 0', textTransform: 'uppercase' }}
                        >
                          🏢 Compagnie
                        </p>
                        <p style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>{selectedAddon.companie}</p>
                      </div>
                    )}
                  </div>

                  {selectedAddon.lien_documentation && (
                    <div
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        border: `1px solid ${T.border}`,
                        padding: '14px 20px',
                      }}
                    >
                      <p style={{ fontSize: '12px', color: T.textLight, margin: 0 }}>
                        📚{' '}
                        <a
                          href={selectedAddon.lien_documentation}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: T.accent, fontWeight: '700', textDecoration: 'none' }}
                        >
                          Documentation →
                        </a>
                      </p>
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: '20px',
                      padding: '14px 20px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: `1px solid ${T.border}`,
                      fontSize: '11px',
                      color: T.textLight,
                    }}
                  >
                    <p style={{ margin: 0 }}>
                      Créé le {new Date(selectedAddon.date_creation).toLocaleDateString('fr-CA')}
                      {selectedAddon.date_modification &&
                        ` · Modifié le ${new Date(selectedAddon.date_modification).toLocaleDateString('fr-CA')}`}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: T.textLight,
              }}
            >
              {loading ? (
                '⏳ Chargement...'
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧩</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: T.text, margin: '0 0 8px 0' }}>
                    Aucun add-on sélectionné
                  </h3>
                  <p style={{ fontSize: '13px', margin: 0 }}>
                    Cliquez sur un add-on dans la barre latérale pour le consulter.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminAddons;