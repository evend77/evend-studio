import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import ModalGuideAddon from '../../components/ModalGuideAddon';

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
  categorie_nom?: string;
  categorie_icon?: string;
  categorie_couleur?: string;
  vendeur_actif?: boolean;
  vendeur_date_activation?: string;
}

interface Categorie {
  categorie_id: string;
  nom: string;
  icon: string;
  couleur: string;
  ordre_affichage: number;
}

interface ToastState {
  msg: string;
  type: 'success' | 'info' | 'danger';
}

// ── API URL ────────────────────────────────────────────────────────────
const API_URL = '';

// ── EMOJI MAPPING EN DUR ──────────────────────────────────────────────
const EMOJI_MAP: Record<string, string> = {
  'postes-canada': '🇨🇦',
  'purolator': '🚚',
  'canpar': '📦',
  'expedition-gratuite': '🎁',
  'fedex-canada': '✈️',
  'ups-canada': '📫',
  'dhl-canada': '🌍',
  'intelcom': '🚗',
  'retrait-en-magasin': '🏬',
  'shipstation': '🚢',
  'sendle-canada': '🌱',
  'poser-une-question': '❓',
  'tags-categories-vendeur': '🏷️',
  'gestion-creneaux-horaires': '⏰',
  'badges-vendeurs-clients': '🏅',
  'affiliation-parrainage': '🤝',
  'blog-vendeur': '📝',
  'chat-vendeur-acheteur': '💬',
  'connexion-reseaux-sociaux': '🔑',
  'personnel-administrateur': '👥',
  'produit-global': '🌐',
  'flux-de-produits': '📊',
  'expiration-produits': '⏳',
  'marche-hyperlocal': '📍',
  'assurance-transport': '🛡️',
  'favoris-produits-vendeurs': '❤️',
  'encheres-produits': '🔨',
  'integration-zoho': '📈',
  'gestion-de-stock': '📦',
  'tps-tvq-tvh': '🧾',
  'produits-avec-reservation': '📅',
  'offres-du-jour': '🔥',
  'panier-divise': '🛒',
  'zoom-meeting': '📹',
  'tarification-par-creneau': '⏱️',
  'design-artiste': '🎨',
  'options-personnalisees': '⚙️',
  'payez-ce-que-vous-voulez': '💰',
  'creneaux-de-livraison': '📅',
  'produits-en-lot': '📦',
  'impression-a-la-demande': '🖨️',
  'connecteur-shopify': '🛒',
  'connecteur-woocommerce': '🐘',
  'connecteur-etsy': '🧶',
  'connecteur-magento': '📈',
  'connecteur-square': '💳',
  'connecteur-lightspeed': '💡',
  'connecteur-squarespace': '📐',
  'connecteur-bigcommerce': '🏪',
  'connecteur-amazon': '🛍️',
  'connecteur-ebay': '🏷️',
  'stripe-connect': '💳',
  'interac-online': '🏦',
  'paybright': '💰',
  'square-payments': '💳',
  'klaviyo-canada': '📧',
  'whatsapp-canada': '💬',
  'facebook-ads': '📣',
  'google-ads': '🔍',
  'avis-clients': '⭐',
  'localisateur-magasin': '📍',
  'abonnements-stripe': '🔄',
  'chat-gpt': '🤖',
  'sauvegarde-base-donnees': '💾',
  'filigrane': '💧',
  'achats-groupes': '👥',
  'pwa': '📱',
  'alertes-sms': '📱',
  'inventaire-multi-emplacements': '📍',
  'gestion-commandes-client': '📋',
  'compliance-canada': '⚖️',
};

const CATEGORY_EMOJI_MAP: Record<string, string> = {
  'shipping': '📦',
  'gestionnaire': '👤',
  'seller': '👤',
  'product': '🛍️',
  'connector': '🔌',
  'payment': '💳',
  'marketing': '📣',
  'other': '⚙️',
};

const getEmoji = (addonId: string): string => {
  return EMOJI_MAP[addonId] || '🧩';
};


const CATEGORIE_NOM_MAP: Record<string, string> = {
  'gestionnaire': 'Gestionnaire',
  'seller': 'Gestionnaire',
  'product': 'Produit',
  'shipping': 'Expédition',
  'payment': 'Paiement',
  'marketing': 'Marketing',
  'connector': 'Connecteur',
  'other': 'Autre',
};

const getCategoryEmoji = (categorieId: string): string => {
  return CATEGORY_EMOJI_MAP[categorieId] || '📦';
};

// ── Toast ──────────────────────────────────────────────────────────────
const Toast: React.FC<{ msg: string; type: 'success' | 'info' | 'danger' }> = ({ msg, type }) => {
  const bg = { success: T.success, danger: T.danger, info: T.accent }[type];
  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        backgroundColor: bg,
        color: 'white',
        padding: '14px 20px',
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
const ModalDetails: React.FC<{
  addon: AddOn | null;
  onClose: () => void;
  onActiver: (a: AddOn) => void;
  onDesactiver: (a: AddOn) => void;
}> = ({ addon, onClose, onActiver, onDesactiver }) => {
  const [showGuide, setShowGuide] = useState(false);
  if (!addon) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
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
          borderRadius: '20px',
          width: '100%',
          maxWidth: '560px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '24px 28px',
            background: addon.badges?.includes('canada')
              ? `linear-gradient(135deg, ${T.canadaRed} 0%, ${T.accent} 100%)`
              : `linear-gradient(135deg, ${T.accent} 0%, ${T.purple} 100%)`,
            color: 'white',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '4px 12px',
                  borderRadius: '30px',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'inline-block',
                  marginBottom: '12px',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {addon.categorie_nom || addon.categorie}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '32px' }}>{getEmoji(addon.addon_id)}</span>
                <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '0' }}>{addon.nom}</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '24px', fontWeight: '800' }}>
                  {addon.prix === '0' ? 'Gratuit' : `${addon.prix} $CAD`}
                  {addon.periode === 'mois' && <span style={{ fontSize: '16px', fontWeight: '400', opacity: 0.8 }}>/mois</span>}
                  {addon.periode === 'an' && <span style={{ fontSize: '16px', fontWeight: '400', opacity: 0.8 }}>/an</span>}
                </span>
                {addon.badges?.includes('populaire') && <span style={{ backgroundColor: 'rgba(255,255,255,0.3)', padding: '4px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '700' }}>⭐ Populaire</span>}
                {addon.badges?.includes('canada') && <span style={{ backgroundColor: 'rgba(255,255,255,0.3)', padding: '4px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '700' }}>🇨🇦 Canada</span>}
                {addon.badges?.includes('gratuit') && <span style={{ backgroundColor: 'rgba(255,255,255,0.3)', padding: '4px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '700' }}>🎁 Gratuit</span>}
              </div>
              {addon.companie && <div style={{ fontSize: '13px', marginTop: '8px', opacity: 0.9 }}>Par {addon.companie}</div>}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ padding: '28px' }}>
          <p style={{ fontSize: '15px', color: T.text, lineHeight: '1.6', margin: '0 0 24px 0' }}>{addon.description}</p>

          <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: T.text, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✨ Caractéristiques principales</h4>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              <li style={{ display: 'flex', gap: '10px', marginBottom: '12px', fontSize: '13px', color: T.textLight }}><span style={{ color: T.success }}>✓</span> Installation en un clic</li>
              <li style={{ display: 'flex', gap: '10px', marginBottom: '12px', fontSize: '13px', color: T.textLight }}><span style={{ color: T.success }}>✓</span> Compatible avec tous les gestionnaires canadiens</li>
              <li style={{ display: 'flex', gap: '10px', marginBottom: '12px', fontSize: '13px', color: T.textLight }}><span style={{ color: T.success }}>✓</span> Mise à jour automatique incluse</li>
              <li style={{ display: 'flex', gap: '10px', marginBottom: '12px', fontSize: '13px', color: T.textLight }}><span style={{ color: T.success }}>✓</span> Support prioritaire 24/7</li>
              <li style={{ display: 'flex', gap: '10px', fontSize: '13px', color: T.textLight }}><span style={{ color: T.success }}>✓</span> Documentation complète</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => {
                if (addon.vendeur_actif) { onDesactiver(addon); onClose(); }
                else { onActiver(addon); onClose(); }
              }}
              style={{
                flex: 1,
                backgroundColor: addon.vendeur_actif ? T.success : T.accent,
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '14px 20px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {addon.vendeur_actif ? '✓ Add-on actif' : addon.prix === '0' ? 'Activer gratuit' : 'Activer maintenant'}
            </button>
            <button onClick={() => setShowGuide(true)} style={{ padding: '14px 20px', backgroundColor: 'white', border: `1px solid ${T.border}`, borderRadius: '10px', color: T.text, fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              📖 Guide
            </button>
            {addon.lien_documentation && (
              <a
                href={addon.lien_documentation}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '14px 20px',
                  backgroundColor: 'white',
                  border: `1px solid ${T.border}`,
                  borderRadius: '10px',
                  color: T.text,
                  fontSize: '15px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                📚 Doc
              </a>
            )}
          </div>
          {showGuide && <ModalGuideAddon addonId={addon.addon_id} addonNom={addon.nom} onClose={() => setShowGuide(false)} />}

          <p style={{ fontSize: '11px', color: T.textLight, margin: '20px 0 0 0', textAlign: 'center' }}>
            Les frais sont facturés mensuellement en CAD et peuvent être résiliés à tout moment.
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Carte Add-on ──────────────────────────────────────────────────────
interface AddOnCardProps {
  addon: AddOn;
  onVoirDetails: (a: AddOn) => void;
  onActiver: (a: AddOn) => void;
  onDesactiver: (a: AddOn) => void;
}

const AddOnCard: React.FC<AddOnCardProps> = ({ addon, onVoirDetails, onActiver, onDesactiver }) => {
  const [hover, setHover] = useState<boolean>(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        border: `1px solid ${hover ? T.accentLight : T.border}`,
        overflow: 'hidden',
        boxShadow: hover ? '0 8px 20px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Badges */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          gap: '6px',
          zIndex: 2,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
      >
        {addon.badges?.includes('canada') && <span style={{ backgroundColor: T.canadaRed, color: 'white', fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '30px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🇨🇦 Canada</span>}
        {addon.badges?.includes('exclusif') && <span style={{ backgroundColor: T.purple, color: 'white', fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '30px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✨ Exclusif</span>}
        {addon.badges?.includes('populaire') && <span style={{ backgroundColor: T.warning, color: 'white', fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '30px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⭐ Populaire</span>}
        {addon.badges?.includes('gratuit') && <span style={{ backgroundColor: T.purple, color: 'white', fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '30px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎁 Gratuit</span>}
        {addon.badges?.includes('nouveau') && <span style={{ backgroundColor: T.success, color: 'white', fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '30px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🆕 Nouveau</span>}
      </div>

      <div style={{ padding: '20px 20px 12px 20px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span style={{ backgroundColor: '#f3f4f6', color: T.textLight, fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '30px' }}>
            {addon.categorie_nom || addon.categorie}
          </span>
          {addon.companie && <span style={{ fontSize: '10px', color: T.textLight, marginLeft: 'auto' }}>{addon.companie}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '28px' }}>{addon.emoji || getEmoji(addon.addon_id)}</span>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: T.text, margin: 0 }}>{addon.nom}</h3>
        </div>
        <p style={{ fontSize: '12px', color: T.textLight, margin: 0, lineHeight: '1.5', minHeight: '50px' }}>
          {addon.description.length > 80 ? `${addon.description.substring(0, 80)}...` : addon.description}
        </p>
      </div>

      <div style={{ padding: '16px 20px 20px 20px', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '22px', fontWeight: '800', color: T.text }}>
              {addon.prix === '0' ? 'Gratuit' : `${addon.prix} $CAD`}
            </span>
            {addon.periode === 'mois' && <span style={{ fontSize: '13px', color: T.textLight, marginLeft: '4px' }}>/mois</span>}
            {addon.periode === 'an' && <span style={{ fontSize: '13px', color: T.textLight, marginLeft: '4px' }}>/an</span>}
          </div>
          {addon.popularite > 0 && <span style={{ fontSize: '12px', color: T.warning }}>⭐ {addon.popularite}</span>}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => addon.vendeur_actif ? onDesactiver(addon) : onActiver(addon)}
            style={{
              flex: 1,
              backgroundColor: addon.vendeur_actif ? T.success : T.accent,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {addon.vendeur_actif ? '✓ Actif' : addon.prix === '0' ? 'Activer gratuit' : 'Activer'}
          </button>
          <button
            onClick={() => onVoirDetails(addon)}
            style={{
              backgroundColor: 'white',
              border: `1px solid ${T.border}`,
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '600',
              color: T.text,
              cursor: 'pointer',
            }}
          >
            Voir détail
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Section Catégorie ──────────────────────────────────────────────────
interface CategorieSectionProps {
  categorie: { categorie_id: string; nom: string; icon: string; couleur: string; };
  addons: AddOn[];
  onVoirDetails: (a: AddOn) => void;
  onActiver: (a: AddOn) => void;
  onDesactiver: (a: AddOn) => void;
}

const CategorieSection: React.FC<CategorieSectionProps> = ({
  categorie, addons, onVoirDetails, onActiver, onDesactiver,
}) => {
  if (addons.length === 0) return null;
  return (
    <div style={{ marginBottom: '48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: categorie.couleur + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
          {getCategoryEmoji(categorie.categorie_id)}
        </div>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: T.text, margin: '0 0 4px 0' }}>{categorie.nom}</h2>
          <p style={{ fontSize: '13px', color: T.textLight, margin: 0 }}>{addons.length} add-on{addons.length > 1 ? 's' : ''} disponible{addons.length > 1 ? 's' : ''}</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {addons.map((addon) => (
          <AddOnCard key={addon.addon_id} addon={addon} onVoirDetails={onVoirDetails} onActiver={onActiver} onDesactiver={onDesactiver} />
        ))}
      </div>
    </div>
  );
};

// ── Barre de recherche ──────────────────────────────────────────────────
interface BarreRechercheProps {
  recherche: string;
  setRecherche: (v: string) => void;
  filtreCategorie: string;
  setFiltreCategorie: (v: string) => void;
  categories: Categorie[];
}

const BarreRecherche: React.FC<BarreRechercheProps> = ({
  recherche,
  setRecherche,
  filtreCategorie,
  setFiltreCategorie,
  categories,
}) => {
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        border: `1px solid ${T.border}`,
        padding: '20px',
        marginBottom: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '12px', fontSize: '16px', color: T.textLight }}>🔍</span>
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un add-on..."
            style={{
              width: '100%',
              padding: '12px 12px 12px 44px',
              border: `1px solid ${T.border}`,
              borderRadius: '10px',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
        <select
          value={filtreCategorie}
          onChange={(e) => setFiltreCategorie(e.target.value)}
          style={{
            padding: '12px 16px',
            border: `1px solid ${T.border}`,
            borderRadius: '10px',
            fontSize: '14px',
            backgroundColor: 'white',
            cursor: 'pointer',
            minWidth: '180px',
          }}
        >
          <option value="toutes">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat.categorie_id} value={cat.categorie_id}>
              {getCategoryEmoji(cat.categorie_id)} {cat.nom}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: T.textLight, flexWrap: 'wrap' }}>
        <span>💰 À partir de 5 $CAD/mois</span>
        <span>🎁 Add-ons gratuits disponibles</span>
        <span>⭐ Add-ons populaires</span>
        <span>🇨🇦 Conçus pour le Canada</span>
      </div>
    </div>
  );
};

// ── PAGE PRINCIPALE ─────────────────────────────────────────────────────
const AddonsGestionnaire: React.FC = () => {
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [recherche, setRecherche] = useState<string>('');
  const [filtreCategorie, setFiltreCategorie] = useState<string>('toutes');
  const [addonSelectionne, setAddonSelectionne] = useState<AddOn | null>(null);
  const [addonADesactiver, setAddonADesactiver] = useState<AddOn | null>(null);
  const [addonAActiver, setAddonAActiver] = useState<AddOn | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAddons = async (): Promise<void> => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/addons/gestionnaire/addons`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setAddons(res.data.data);
        const cats: Categorie[] = res.data.data.reduce((acc: Categorie[], a: AddOn) => {
          if (!acc.find((c) => c.categorie_id === a.categorie)) {
            acc.push({
              categorie_id: a.categorie,
              nom: a.categorie_nom || CATEGORIE_NOM_MAP[a.categorie] || a.categorie,
              icon: a.categorie_icon || '📦',
              couleur: a.categorie_couleur || T.textLight,
              ordre_affichage: 0,
            });
          }
          return acc;
        }, []);
        setCategories(cats);
      }
    } catch (err) {
      console.error('Erreur chargement addons:', err);
      showToast('❌ Erreur chargement des add-ons', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddons();
  }, []);

  const showToast = (msg: string, type: 'success' | 'info' | 'danger'): void => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleActiver = async (addon: AddOn): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/api/addons/gestionnaire/${addon.addon_id}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setAddons((prev) =>
          prev.map((a) =>
            a.addon_id === addon.addon_id ? { ...a, vendeur_actif: !a.vendeur_actif } : a
          )
        );
        showToast(
          addon.vendeur_actif ? `⏸ ${addon.nom} désactivé` : `✅ ${addon.nom} activé`,
          'success'
        );
      }
    } catch (err) {
      console.error('Erreur toggle:', err);
      showToast('❌ Erreur lors de l\'activation', 'danger');
    }
  };

  const addonsFiltres = useMemo(() => {
    let result = addons;
    if (recherche.trim()) {
      result = result.filter(
        (a) =>
          a.nom.toLowerCase().includes(recherche.toLowerCase()) ||
          a.description.toLowerCase().includes(recherche.toLowerCase())
      );
    }
    if (filtreCategorie !== 'toutes') {
      result = result.filter((a) => a.categorie === filtreCategorie);
    }
    return result;
  }, [addons, recherche, filtreCategorie]);

  const addonsParCategorie = useMemo(() => {
    const grouped: Record<string, AddOn[]> = {};
    addonsFiltres.forEach((a) => {
      const key = a.categorie;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(a);
    });
    return grouped;
  }, [addonsFiltres]);

  const stats = useMemo(() => {
    const total = addons.length;
    const actifs = addons.filter((a) => a.vendeur_actif).length;
    const gratuits = addons.filter((a) => a.prix === '0').length;
    return { total, actifs, gratuits };
  }, [addons]);

  return (
    <div style={{ padding: '28px 32px', backgroundColor: T.bg, minHeight: '100vh' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <ModalDetails addon={addonSelectionne} onClose={() => setAddonSelectionne(null)} onActiver={(a) => { setAddonSelectionne(null); setAddonAActiver(a); }} onDesactiver={(a) => { setAddonSelectionne(null); setAddonADesactiver(a); }} />

      {/* ── Modal confirmation désactivation (carte principale) ── */}
      {addonADesactiver && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', padding: '24px 28px', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
              <p style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 6px', color: 'white' }}>Désactiver cet add-on ?</p>
              <p style={{ fontSize: '13px', opacity: 0.85, margin: 0, color: 'white' }}>{addonADesactiver.nom}</p>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ fontSize: '14px', color: '#1a2332', fontWeight: '700', marginBottom: '12px' }}>Vous êtes sur le point de désactiver cet add-on.</p>
              <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.7', marginBottom: '12px' }}>
                En procédant, <strong>vous et vos collaborateurs n'aurez plus accès aux fonctionnalités</strong> de cet add-on. Les données associées à ces fonctionnalités pour vos collaborateurs seront <strong>supprimées définitivement</strong>.
              </p>
              <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.7' }}>Voulez-vous vraiment procéder ?</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setAddonADesactiver(null)}
                  style={{ flex: 1, padding: '13px', border: '1px solid #e1e4e8', borderRadius: '10px', background: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', color: '#4b5563' }}>
                  Annuler
                </button>
                <button onClick={() => { handleActiver(addonADesactiver); setAddonADesactiver(null); }}
                  style={{ flex: 1, padding: '13px', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #dc2626, #991b1b)', color: 'white', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}>
                  🔴 Désactiver cet add-on
                </button>
              </div>
              <div style={{ marginTop: '16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px' }}>
                <p style={{ fontSize: '12px', color: '#92400e', margin: 0, lineHeight: '1.6' }}>
                  <strong>📋 Note de facturation :</strong> En désactivant cet add-on, il ne sera plus facturé lors du prochain cycle de facturation. Cependant, <strong>le solde du mois en cours n'est pas remboursable.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmation ACTIVATION ── */}
      {addonAActiver && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ background: 'linear-gradient(135deg, #1a2436, #c9a96e)', padding: '28px', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '52px', marginBottom: '10px' }}>{getEmoji(addonAActiver.addon_id)}</div>
              <p style={{ fontSize: '11px', fontWeight: '700', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px', color: 'white' }}>Activer l'add-on</p>
              <p style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 14px', color: 'white' }}>{addonAActiver.nom}</p>
              {addonAActiver.prix !== '0' ? (
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '14px', padding: '14px 20px', display: 'inline-block' }}>
                  <div style={{ fontSize: '40px', fontWeight: '900', color: '#c9a96e', lineHeight: 1 }}>{addonAActiver.prix} $CAD</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>/{addonAActiver.periode === 'mois' ? 'mois' : 'an'} + taxes applicables (TPS/TVQ)</div>
                </div>
              ) : (
                <div style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '14px', padding: '10px 24px', display: 'inline-block' }}>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#4ade80' }}>Gratuit</div>
                </div>
              )}
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ fontSize: '14px', color: '#1a2332', fontWeight: '700', marginBottom: '10px' }}>Vous êtes sur le point d'activer cet add-on.</p>
              <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.7', marginBottom: '14px' }}>
                En activant cet add-on, ses fonctionnalités seront <strong>immédiatement disponibles</strong> pour vous et vos collaborateurs.
              </p>
              {addonAActiver.prix !== '0' && (
                <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '12px', padding: '14px 18px', marginBottom: '14px' }}>
                  <p style={{ fontSize: '13px', color: '#92400e', margin: 0, lineHeight: '1.7' }}>
                    <strong>💳 Facturation :</strong> Un montant de <strong>{addonAActiver.prix} $CAD/{addonAActiver.periode === 'mois' ? 'mois' : 'an'}</strong> + <strong>taxes (TPS 5% + TVQ 9,975%)</strong> s'ajoutera à vos frais d'abonnement template multivendeur à chaque cycle de facturation.
                  </p>
                </div>
              )}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', color: '#15803d', margin: 0, lineHeight: '1.6' }}>
                  <strong>✅ Activation instantanée.</strong> Vous pouvez désactiver cet add-on à tout moment depuis cette page.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setAddonAActiver(null)}
                  style={{ flex: 1, padding: '13px', border: '1px solid #e1e4e8', borderRadius: '10px', background: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', color: '#4b5563' }}>
                  Annuler
                </button>
                <button onClick={() => { handleActiver(addonAActiver); setAddonAActiver(null); }}
                  style={{ flex: 1, padding: '13px', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', color: 'white', fontSize: '14px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(201,169,110,0.4)' }}>
                  ✅ {addonAActiver.prix === '0' ? 'Activer gratuitement' : `Activer — ${addonAActiver.prix} $`}
                </button>
              </div>
              {addonAActiver.prix !== '0' && (
                <p style={{ fontSize: '11px', color: '#9ca3af', margin: '12px 0 0', textAlign: 'center' as const, lineHeight: '1.5' }}>
                  Montants en dollars canadiens (CAD). Taxes selon votre province de résidence.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0', color: T.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🍁 Modules complémentaires</h1>
          <span style={{ backgroundColor: T.canadaRed, color: 'white', padding: '4px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: '700' }}>Canada</span>
        </div>
        <p style={{ fontSize: '13px', color: T.textLight, margin: '4px 0 0 0' }}>Extension des fonctionnalités de votre boutique avec des modules spécialement conçus pour le marché canadien</p>
      </div>

      <BarreRecherche
        recherche={recherche}
        setRecherche={setRecherche}
        filtreCategorie={filtreCategorie}
        setFiltreCategorie={setFiltreCategorie}
        categories={categories}
      />

      <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: `1px solid ${T.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: T.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🧩</div>
          <div><p style={{ fontSize: '24px', fontWeight: '800', color: T.text, margin: 0 }}>{stats.total}</p><p style={{ fontSize: '13px', color: T.textLight, margin: 0 }}>Add-ons disponibles</p></div>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: `1px solid ${T.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: T.success + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>✅</div>
          <div><p style={{ fontSize: '24px', fontWeight: '800', color: T.text, margin: 0 }}>{stats.actifs}</p><p style={{ fontSize: '13px', color: T.textLight, margin: 0 }}>Add-ons actifs</p></div>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: `1px solid ${T.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: T.purpleLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🎁</div>
          <div><p style={{ fontSize: '24px', fontWeight: '800', color: T.text, margin: 0 }}>{stats.gratuits}</p><p style={{ fontSize: '13px', color: T.textLight, margin: 0 }}>Add-ons gratuits</p></div>
        </div>
      </div>

      {loading ? (
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: `1px solid ${T.border}`, padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>⏳</div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: T.text, margin: '0 0 8px 0' }}>Chargement...</h3>
        </div>
      ) : addonsFiltres.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: `1px solid ${T.border}`, padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🔍</div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: T.text, margin: '0 0 8px 0' }}>Aucun add-on disponible</h3>
          <p style={{ fontSize: '14px', color: T.textLight, margin: 0 }}>Aucun add-on ne correspond à votre recherche ou aucun add-on n'a été activé par l'administrateur.</p>
        </div>
      ) : (
        Object.entries(addonsParCategorie).map(([categorieId, items]) => {
          const cat = categories.find((c) => c.categorie_id === categorieId);
          return (
            <CategorieSection
              key={categorieId}
              categorie={{
                categorie_id: categorieId,
                nom: cat?.nom || CATEGORIE_NOM_MAP[categorieId] || categorieId,
                icon: cat?.icon || '📦',
                couleur: cat?.couleur || T.textLight,
              }}
              addons={items}
              onVoirDetails={setAddonSelectionne}
              onActiver={(a) => setAddonAActiver(a)}
              onDesactiver={(a) => setAddonADesactiver(a)}
            />
          );
        })
      )}

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: `1px solid ${T.border}`, fontSize: '12px', color: T.textLight, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <span>🇨🇦 Spécifiquement conçu pour le Canada</span>
          <span>💳 Paiement sécurisé en CAD</span>
          <span>🔄 Mises à jour automatiques</span>
          <span>📦 Installation instantanée</span>
          <span>🛡️ Support prioritaire</span>
        </div>
        <div>
          <span style={{ fontWeight: '700', color: T.text }}>Total mensuel estimé: </span>
          <span style={{ fontWeight: '800', color: T.canadaRed }}>
            {addons
              .filter((a) => a.vendeur_actif && a.prix !== '0')
              .reduce((sum, a) => {
                const prix = parseFloat(a.prix) || 0;
                return sum + (a.periode === 'mois' ? prix : prix / 12);
              }, 0)
              .toFixed(2)} $CAD/mois
          </span>
        </div>
      </div>
    </div>
  );
};

export default AddonsGestionnaire;