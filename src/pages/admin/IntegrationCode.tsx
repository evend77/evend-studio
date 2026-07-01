//
import React, { useState } from 'react';

// ── Page Integration de code ─────────────────────────────────────────────────
function IntegrationCode({ naviguerVers }: { naviguerVers: (p: string) => void }) {
  const [ongletActif, setOngletActif] = useState('produit');
  const [copieSucces, setCopieSucces] = useState<string | null>(null);

  const copierCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopieSucces(id);
    setTimeout(() => setCopieSucces(null), 2000);
  };

  const styles = {
    container: { padding: '28px 32px', maxWidth: '1200px' },
    header: { marginBottom: '28px' },
    title: { fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: '#1a2332', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
    subtitle: { fontSize: '13px', color: '#6b7280', margin: 0 },
    onglets: { display: 'flex', gap: '4px', borderBottom: '2px solid #e1e4e8', marginBottom: '24px', flexWrap: 'wrap' as const },
    onglet: (actif: boolean) => ({
      padding: '10px 18px',
      fontSize: '13px',
      fontWeight: '700' as const,
      color: actif ? '#2d6a9f' : '#6b7280',
      backgroundColor: actif ? '#e8f2fb' : 'transparent',
      border: 'none',
      borderBottom: actif ? '3px solid #2d6a9f' : '3px solid transparent',
      cursor: 'pointer',
      transition: 'all 0.2s',
      borderRadius: '8px 8px 0 0',
    }),
    section: { marginBottom: '32px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e1e4e8', overflow: 'hidden' },
    sectionHeader: { padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '2px solid #2d6a9f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: '15px', fontWeight: '700', margin: 0, color: '#2d6a9f' },
    codeBlock: { backgroundColor: '#1a2436', padding: '16px 20px', borderRadius: '8px', overflowX: 'auto' as const, margin: '16px 0', position: 'relative' as const },
    code: { color: '#e2e8f0', fontSize: '13px', fontFamily: 'monospace', margin: 0, whiteSpace: 'pre-wrap' as const },
    boutonCopie: { position: 'absolute' as const, top: '8px', right: '8px', backgroundColor: '#2d6a9f', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
    note: { backgroundColor: '#fef9c3', borderLeft: '4px solid #d97706', padding: '12px 16px', fontSize: '12px', color: '#92400e', margin: '16px 0', borderRadius: '4px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginTop: '16px' },
    carte: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' },
  };

  const renderCodesProduit = () => (
    <>
      {/* Lien vers profil vendeur */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>🔗 Lien vers le profil du vendeur</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>main-product.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Affiche le lien vers la boutique du vendeur sur la page produit.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'<div class="wk_seller_detail clearfix" data-productid="{{ product.id }}" style="display:none;"></div>'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('<div class="wk_seller_detail clearfix" data-productid="{{ product.id }}" style="display:none;"></div>', 'seller-link')}
            >
              {copieSucces === 'seller-link' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Marque du vendeur */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>🏷️ Marque du vendeur</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>product.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Affiche la marque du vendeur si elle est définie.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'{% if product.metaFields.wk_brand_name[\'mvm_brand_name\'] %}\n{{ product.metaFields.wk_brand_name[\'mvm_brand_name\'] }}\n{% endif %}'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('{% if product.metaFields.wk_brand_name[\'mvm_brand_name\'] %}\n{{ product.metaFields.wk_brand_name[\'mvm_brand_name\'] }}\n{% endif %}', 'brand')}
            >
              {copieSucces === 'brand' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Informations supplémentaires vendeur */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>ℹ️ Informations supplémentaires vendeur</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>main-product.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Affiche des informations supplémentaires sur le vendeur.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'<div class="wk_seller_custom_detail clearfix" data-productid="{{product.id}}" style="display:none;"> </div>'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('<div class="wk_seller_custom_detail clearfix" data-productid="{{product.id}}" style="display:none;"> </div>', 'seller-custom')}
            >
              {copieSucces === 'seller-custom' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Coordonnées du vendeur */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>📞 Coordonnées du vendeur</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>main-product.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Affiche les coordonnées du vendeur (adresse, téléphone, email).</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'<div class="wk_seller_info clearfix" data-productid="{{ product.id }}"></div>'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('<div class="wk_seller_info clearfix" data-productid="{{ product.id }}"></div>', 'seller-info')}
            >
              {copieSucces === 'seller-info' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Logo du vendeur */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>🖼️ Logo du vendeur</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>main-product.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Affiche le logo du vendeur.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'<div class="wk_seller_detail_logo" data-productid="{{product.id}}"></div>'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('<div class="wk_seller_detail_logo" data-productid="{{product.id}}"></div>', 'seller-logo')}
            >
              {copieSucces === 'seller-logo' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Champs personnalisés */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>📋 Champs personnalisés</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>main-product.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Affiche les champs personnalisés du produit (ex: type de fichier).</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'{% render \'wk-custom-meta-field\' %}'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('{% render \'wk-custom-meta-field\' %}', 'custom-fields')}
            >
              {copieSucces === 'custom-fields' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
          <div style={styles.note}>
            <strong>Type de fichier :</strong> Pour afficher le type de fichier d'un produit numérique
          </div>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'<div class="wk_product_custom_file_type clearfix" data-productid="{{product.id}}" style="display: none;"></div>'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('<div class="wk_product_custom_file_type clearfix" data-productid="{{product.id}}" style="display: none;"></div>', 'file-type')}
            >
              {copieSucces === 'file-type' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Politique produit */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>📜 Politique du produit</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>main-product.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Affiche la politique du produit (retour, échange, etc.).</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'<div id="seller-policy-tab" data-productid="{{product.id}}"></div>'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('<div id="seller-policy-tab" data-productid="{{product.id}}"></div>', 'policy')}
            >
              {copieSucces === 'policy' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Emplacement du vendeur */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>📍 Emplacement du vendeur</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>collection-template.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Affiche l'emplacement du vendeur sur la page de collection.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'<div class="wk_vendor_address" data-vendor="{{product.vendor}}" style="font-size: 15px; color: #23733a;"></div>'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('<div class="wk_vendor_address" data-vendor="{{product.vendor}}" style="font-size: 15px; color: #23733a;"></div>', 'vendor-location')}
            >
              {copieSucces === 'vendor-location' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Widget de réduction */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>🏷️ Widget de réduction</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>main-product.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Affiche les codes de réduction disponibles pour le produit.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'<div class="wk-discount-front-layout" data-product-id="{{ product.id }}" discount-label="Code de réduction" amountOff-label="Montant de réduction" style="display:none;"></div>'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('<div class="wk-discount-front-layout" data-product-id="{{ product.id }}" discount-label="Code de réduction" amountOff-label="Montant de réduction" style="display:none;"></div>', 'discount')}
            >
              {copieSucces === 'discount' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Quantité minimum d'achat */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>🔢 Quantité minimum d'achat</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>main-product.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Affiche la quantité minimum requise pour ce produit.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'<div id="min_purchase_quantity_div" data-product-id="{{ product.id }}" ></div>'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('<div id="min_purchase_quantity_div" data-product-id="{{ product.id }}" ></div>', 'min-qty')}
            >
              {copieSucces === 'min-qty' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
          <p style={{ fontSize: '13px', margin: '16px 0 8px 0' }}>Message de quantité minimum :</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'<div class="wk_qty_selector_value" style="display:none;">La quantité minimum d\'achat pour ce produit est de <span class="qty_value"></span></div>'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('<div class="wk_qty_selector_value" style="display:none;">La quantité minimum d\'achat pour ce produit est de <span class="qty_value"></span></div>', 'min-qty-msg')}
            >
              {copieSucces === 'min-qty-msg' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Bouton Contacter le vendeur */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>✉️ Bouton "Contacter le vendeur"</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>main-product.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Ajoute un bouton pour contacter le vendeur directement depuis la page produit.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'{% render \'wk-contact-us\' %}'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('{% render \'wk-contact-us\' %}', 'contact-btn')}
            >
              {copieSucces === 'contact-btn' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Date de mise en vente future */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>📅 Vente future programmée</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>main-product.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Affiche la date à laquelle le produit sera mis en vente.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'{% if product.metafields.wk_future_selling_product.future_selling.value != blank and product.metafields.wk_future_selling_product.future_selling.value != "NULL" %}\n<div id="future_selling_div" data-productid="{{ product.id }}">\n    <strong>Vente débutera le : {{ product.metafields.wk_future_selling_product.future_selling.value }}</strong>\n</div>\n{% else %}                              \n<!--\n{% endif %}'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('{% if product.metafields.wk_future_selling_product.future_selling.value != blank and product.metafields.wk_future_selling_product.future_selling.value != "NULL" %}\n<div id="future_selling_div" data-productid="{{ product.id }}">\n    <strong>Vente débutera le : {{ product.metafields.wk_future_selling_product.future_selling.value }}</strong>\n</div>\n{% else %}                              \n<!--\n{% endif %}', 'future-selling')}
            >
              {copieSucces === 'future-selling' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const renderCodesPanier = () => (
    <>
      {/* Sélecteur de quantité */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>🔢 Classe pour le sélecteur de quantité</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>main-product.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Ajoutez la classe <code>wk_qty_selector</code> à votre sélecteur de quantité.</p>
          <div style={styles.note}>
            <strong>Important :</strong> Activez d'abord le sélecteur de quantité dans la configuration du thème.
          </div>
        </div>
      </div>

      {/* Attribut de quantité minimum */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>⚖️ Attribut de poids et quantité minimum</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>main-product.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Ajoutez ces attributs à votre sélecteur de quantité.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'id="{{ variant.id }}" wk_weight="{{ variant.weight }}"'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('id="{{ variant.id }}" wk_weight="{{ variant.weight }}"', 'weight-attr')}
            >
              {copieSucces === 'weight-attr' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Champ quantité minimum dans le panier */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>📊 Données de quantité minimum dans le panier</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>cart-template.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Ajoutez cet attribut au champ de quantité dans le panier.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'data-wk_min_qty_{{item.variant_id}}'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('data-wk_min_qty_{{item.variant_id}}', 'cart-min-qty')}
            >
              {copieSucces === 'cart-min-qty' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Montant minimum de commande */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>💰 Montant minimum de commande</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>cart-template.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Affiche un message si le montant minimum de commande n'est pas atteint.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'<div class="id=wk_minimum_purchase_div" style="display:none;"></div>'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('<div class="id=wk_minimum_purchase_div" style="display:none;"></div>', 'min-purchase')}
            >
              {copieSucces === 'min-purchase' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Montant minimum sur page produit */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>📏 Montant minimum sur page produit</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>main-product.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Affiche le montant minimum de commande sur la page produit.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'<div id="wk_product_mpa" data-product_id="{{ product.id }}" data-selected_tag="{{ customer.tags[0] }}"></div>'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('<div id="wk_product_mpa" data-product_id="{{ product.id }}" data-selected_tag="{{ customer.tags[0] }}"></div>', 'product-min')}
            >
              {copieSucces === 'product-min' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Masquer le bouton de paiement */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>🚫 Masquer le bouton de paiement</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>cart-template.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Ajoutez cet attribut au bouton de paiement pour le masquer si nécessaire.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'style="display:none;"'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('style="display:none;"', 'hide-checkout')}
            >
              {copieSucces === 'hide-checkout' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Masquer les boutons supplémentaires */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>🚫 Masquer les boutons supplémentaires</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>cart-template.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Ajoutez cette classe au div contenant les boutons de paiement supplémentaires.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'wk-additional-checkout-btn'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('wk-additional-checkout-btn', 'hide-additional')}
            >
              {copieSucces === 'hide-additional' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const renderCodesClient = () => (
    <>
      {/* Lien de téléchargement pour produits numériques */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>⬇️ Lien de téléchargement (produits numériques)</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>customers/order.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Ajoutez la classe et l'attribut à la balise <code>&lt;tr&gt;</code> pour chaque article.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'<tr id="{{ line_item.id }}" class="wk_lineitem" data-wk_lineitemid="{{ line_item.id }}">'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('<tr id="{{ line_item.id }}" class="wk_lineitem" data-wk_lineitemid="{{ line_item.id }}">', 'download-link')}
            >
              {copieSucces === 'download-link' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Bouton Portail Vendeur (C2C) */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>🔄 Convertir client en vendeur (C2C)</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>customers/account.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Ajoute un bouton "Portail Vendeur" sur la page de compte client.</p>
          <div style={styles.note}>
            <strong>URL publique :</strong> https://vendeur.e-vend.ca
          </div>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'<a class="btn btn-sm wc2c_marletplace" target="_blank" href="https://vendeur.e-vend.ca/?p=c2c_marletplace_process&customer_id={{customer.id}}&shop=nonemain">Boutique</a>'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('<a class="btn btn-sm wc2c_marletplace" target="_blank" href="https://vendeur.e-vend.ca/?p=c2c_marletplace_process&customer_id={{customer.id}}&shop=nonemain">Boutique</a>', 'c2c-btn')}
            >
              {copieSucces === 'c2c-btn' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
          <p style={{ fontSize: '13px', margin: '16px 0 8px 0' }}>Version alternative :</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'<a class="btn btn--small wc_c2c_marketplace" target="_blank" href="https://vendeur.e-vend.ca/?p=c2c_marketplace_process&customer_id={{customer.id}}&shop={{shop.permalink}}" style="display: none;">Portail Vendeur</a>'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('<a class="btn btn--small wc_c2c_marketplace" target="_blank" href="https://vendeur.e-vend.ca/?p=c2c_marketplace_process&customer_id={{customer.id}}&shop={{shop.permalink}}" style="display: none;">Portail Vendeur</a>', 'c2c-btn2')}
            >
              {copieSucces === 'c2c-btn2' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Commandes brouillons */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>📝 Commandes brouillons</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>customers/account.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Affiche la liste des commandes brouillons sur la page de compte.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'<div id="wk_draft_order_div" data-customerEmail="{{customer.email}}"></div>'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('<div id="wk_draft_order_div" data-customerEmail="{{customer.email}}"></div>', 'draft-orders')}
            >
              {copieSucces === 'draft-orders' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Variables de traduction */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>🌐 Traductions de l'interface</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>theme.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Ajoutez ce code juste avant la balise <code>&lt;/body&gt;</code>.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'{% render \'wk-mvm-variables\' %}'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('{% render \'wk-mvm-variables\' %}', 'translations')}
            >
              {copieSucces === 'translations' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const renderCodesPaiement = () => (
    <>
      {/* URI de redirection Stripe */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>💳 Stripe Connect - URI de redirection</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>À ajouter dans les paramètres de votre application Stripe (Redirect URIs).</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>https://vendeur.e-vend.ca/index.php?p=stripe_connect_config&sid=67638&type=connect</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('https://vendeur.e-vend.ca/index.php?p=stripe_connect_config&sid=67638&type=connect', 'stripe-uri')}
            >
              {copieSucces === 'stripe-uri' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Script Stripe pour page de remerciement */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>💳 Script Stripe - Page de remerciement</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>cart.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Ajoutez ce script pour gérer les paiements Stripe.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'<script>var wk_stripe_thank_you_page = true; </script>'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('<script>var wk_stripe_thank_you_page = true; </script>', 'stripe-script')}
            >
              {copieSucces === 'stripe-script' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Statut de paiement */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>💰 Statut de paiement de la commande</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>customers/order.liquid</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Affiche le statut de paiement de la commande.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'<div style="display: none;">wk_order_payment_status="{{ order.financial_status }}" data-payment_status="{{ order.financial_status }}" data-wk_order_payment_status="{{ order.wk_order_payment_status }}">data-wk_order_payment_status="{{ order.wk_order_payment_status }}"</div>'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('<div style="display: none;">wk_order_payment_status="{{ order.financial_status }}" data-payment_status="{{ order.financial_status }}" data-wk_order_payment_status="{{ order.wk_order_payment_status }}">data-wk_order_payment_status="{{ order.wk_order_payment_status }}"</div>', 'payment-status')}
            >
              {copieSucces === 'payment-status' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Scripts additionnels dans le checkout */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>⚙️ Scripts additionnels - Checkout</h3>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>Paramètres Shopify → Checkout</span>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>À ajouter dans "Scripts additionnels" des paramètres de paiement.</p>
          <div style={styles.codeBlock}>
            <pre style={styles.code}>{'<script>var wk_load_message1 = "Veuillez patienter... Redirection vers la page de statut de commande"; var wk_load_message2 = "Ne pas appuyer sur Précédent ou Actualiser"; </script>'}</pre>
            <button 
              style={styles.boutonCopie}
              onClick={() => copierCode('<script>var wk_load_message1 = "Veuillez patienter... Redirection vers la page de statut de commande"; var wk_load_message2 = "Ne pas appuyer sur Précédent ou Actualiser"; </script>', 'checkout-scripts')}
            >
              {copieSucces === 'checkout-scripts' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🔌 Integration de code</h1>
        <p style={styles.subtitle}>Codes à intégrer dans votre thème Shopify pour activer les fonctionnalités du marketplace</p>
      </div>

      <div style={styles.note}>
        <strong>🔧 Important :</strong> Ces codes sont fournis à titre indicatif. Lorsque notre application publique sera disponible, 
        nous fournirons des codes spécifiques à remplacer. L'URL publique pour les vendeurs est : <strong>https://vendeur.e-vend.ca</strong>
      </div>

      {/* Onglets */}
      <div style={styles.onglets}>
        <button style={styles.onglet(ongletActif === 'produit')} onClick={() => setOngletActif('produit')}>📦 Page Produit</button>
        <button style={styles.onglet(ongletActif === 'panier')} onClick={() => setOngletActif('panier')}>🛒 Panier & Paiement</button>
        <button style={styles.onglet(ongletActif === 'client')} onClick={() => setOngletActif('client')}>👤 Compte Client</button>
        <button style={styles.onglet(ongletActif === 'paiement')} onClick={() => setOngletActif('paiement')}>💳 Paiements</button>
      </div>

      {/* Contenu selon onglet */}
      {ongletActif === 'produit' && renderCodesProduit()}
      {ongletActif === 'panier' && renderCodesPanier()}
      {ongletActif === 'client' && renderCodesClient()}
      {ongletActif === 'paiement' && renderCodesPaiement()}

      {/* Note de bas de page */}
      <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e1e4e8', fontSize: '12px', color: '#6b7280', textAlign: 'center' as const }}>
        <p style={{ margin: 0 }}>Ces codes sont basés sur l'application Webkul et seront adaptés lors du lancement de notre application publique.</p>
      </div>
    </div>
  );
}

export default IntegrationCode;
