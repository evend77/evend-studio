import React from 'react';
import { useParams, Link } from 'react-router-dom';

// Fonction pour obtenir le nom de l'add-on à partir de l'ID
function getAddonName(guideId: string): string {
  const names: Record<string, string> = {
    'shipping-free-guide': 'Expédition gratuite',
    'ecom-express-guide': 'Ecom Express',
    'canada-post-guide': 'Postes Canada',
    'store-pickup-guide': 'Retrait en magasin',
    'fedex-guide': 'FedEx',
    'air-speed-guide': 'Air Speed',
    'australia-post-guide': 'Australia Post',
    'ups-guide': 'UPS',
    'vamaship-guide': 'Vamaship',
    'shipstation-guide': 'ShipStation',
    'dhl-express-guide': 'DHL Express',
    'bring-guide': 'Bring',
    'postnl-guide': 'PostNL',
    'jtexpress-guide': 'J&T Express',
    'shipmodo-guide': 'Shipmodo',
    'sendle-guide': 'Sendle',
    'swisspost-guide': 'La Poste Suisse',
    'delhivery-guide': 'Delhivery',
    'japanese-shipping-guide': 'Expédition Japon',
    'shippocket-guide': 'Shippocket',
    'sbeedy-shipping-guide': 'Sbeedy',
    'ask-question-guide': 'Poser une question',
    'seller-tags-categories-guide': 'Tags et catégories vendeur',
    'seller-time-slot-guide': 'Gestion des créneaux horaires',
    'seller-customer-badge-guide': 'Badges vendeurs et clients',
    'affiliate-referral-guide': 'Affiliation / Parrainage',
    'seller-blog-guide': 'Blog vendeur',
    'seller-buyer-chat-guide': 'Chat vendeur-acheteur',
    'social-media-login-guide': 'Connexion réseaux sociaux',
    'admin-staff-guide': 'Personnel administrateur',
    'global-product-guide': 'Produit global',
    'product-feed-guide': 'Flux de produits',
    'product-expiry-guide': 'Expiration des produits',
    'hyperlocal-guide': 'Marché hyperlocal',
    'route-insurance-guide': 'Assurance transport',
    'favorite-product-guide': 'Favoris produits/vendeurs',
    'product-auction-guide': 'Enchères de produits',
    'zoho-integration-guide': 'Intégration Zoho',
    'stock-management-guide': 'Gestion de stock',
    'indian-gst-guide': 'GST Inde',
    'bookings-product-guide': 'Produits avec réservation',
    'daily-deals-guide': 'Offres du jour',
    'split-cart-guide': 'Panier divisé',
    'zoom-meeting-guide': 'Zoom Meeting',
    'slot-pricing-guide': 'Tarification par créneau',
    'artist-product-design-guide': "Design d'artiste",
    'custom-options-guide': 'Options personnalisées',
    'pay-what-you-want-guide': 'Payez ce que vous voulez',
    'delivery-slot-guide': 'Créneaux de livraison',
    'package-product-guide': 'Produits en lot',
    'print-on-demand-guide': 'Impression à la demande',
    'shopify-store-connector-guide': 'Connecteur boutique Shopify',
    'woocommerce-connector-guide': 'Connecteur WooCommerce',
    'etsy-connector-guide': 'Connecteur Etsy',
    'magento-connector-guide': 'Connecteur Magento',
    'squareup-connector-guide': 'Connecteur Square',
    'squarespace-connector-guide': 'Connecteur Squarespace',
    'linnworks-connector-guide': 'Connecteur Linnworks',
    'soopos-connector-guide': 'Connecteur SooPOS',
    'bigcommerce-connector-guide': 'Connecteur BigCommerce',
    'amazon-connector-guide': 'Connecteur Amazon',
    'ebay-connector-guide': 'Connecteur eBay',
    'dytel-connector-guide': 'Connecteur Dytel POS',
    'stripe-connect-guide': 'Stripe Connect',
    'locate-pickup-store-guide': 'Localisateur de magasin',
    'subscription-product-guide': 'Abonnements Stripe',
    'chat-gpt-guide': 'Chat GPT',
    'database-backup-guide': 'Sauvegarde base de données',
    'watermark-guide': 'Filigrane',
    'easy-group-buy-guide': 'Achats groupés',
    'pwa-guide': 'PWA',
    'sms-alert-guide': 'Alertes SMS',
    'multi-location-inventory-guide': 'Inventaire multi-emplacements',
    'customer-order-management-guide': 'Gestion commandes client',
    'email-marketing-guide': 'Marketing par email',
    'whatsapp-integration-guide': 'Intégration WhatsApp'
  };
  
  return names[guideId] || 'cet add-on';
}

export default function GuidePage() {
  const { guideId } = useParams<{ guideId: string }>();
  const addonName = guideId ? getAddonName(guideId) : 'cet add-on';
  
  // Style cohérent avec ton application
  const styles = {
    accent: '#2d6a9f',
    bg: '#f0f2f5',
    text: '#1a2332',
    textLight: '#6b7280',
    border: '#e1e4e8'
  };
  
  return (
    <div style={{
      padding: '40px',
      minHeight: '100vh',
      backgroundColor: styles.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        padding: '48px',
        textAlign: 'center',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 20px 35px -10px rgba(0,0,0,0.15)'
      }}>
        <div style={{ fontSize: '72px', marginBottom: '20px' }}>📚</div>
        <div style={{
          display: 'inline-block',
          background: '#fef3c7',
          color: '#d97706',
          padding: '4px 12px',
          borderRadius: '30px',
          fontSize: '12px',
          fontWeight: '600',
          marginBottom: '20px'
        }}>
          🚧 En construction
        </div>
        <h1 style={{ fontSize: '28px', marginBottom: '16px', color: styles.text }}>
          Page en construction
        </h1>
        <div style={{
          background: '#f0f2f5',
          padding: '12px 20px',
          borderRadius: '12px',
          display: 'inline-block',
          marginBottom: '24px'
        }}>
          <strong style={{ color: styles.accent }}>{addonName}</strong>
        </div>
        <p style={{ fontSize: '16px', color: styles.textLight, marginBottom: '30px', lineHeight: '1.6' }}>
          Le guide détaillé pour <strong>{addonName}</strong> est actuellement en cours de création.<br />
          Notre équipe travaille pour vous fournir une documentation complète et des instructions pas à pas.
        </p>
        <div style={{
          width: '100%',
          height: '6px',
          background: styles.border,
          borderRadius: '3px',
          marginBottom: '30px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '30%',
            height: '100%',
            background: `linear-gradient(90deg, ${styles.accent}, #8b5cf6)`,
            borderRadius: '3px',
            animation: 'progress 2s ease infinite'
          }} />
        </div>
        <Link 
          to="/addons" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            background: '#f0f2f5',
            color: styles.text,
            textDecoration: 'none',
            padding: '12px 28px',
            borderRadius: '40px',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.2s ease',
            border: `1px solid ${styles.border}`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e6e9ef';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f0f2f5';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ← Retour aux add-ons
        </Link>
      </div>
      <style>{`
        @keyframes progress {
          0% { width: 20%; }
          50% { width: 40%; }
          100% { width: 20%; }
        }
      `}</style>
    </div>
  );
}
