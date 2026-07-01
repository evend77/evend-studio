// price-drop-modal.js - Version SANS bouton (seulement le modal)
(function() {
    'use strict';
    
    const API_BASE = 'https://evend-multivendeur-api.onrender.com/api';
    
    console.log('✅ price-drop-modal.js chargé');
    
    function createModal() {
        if (document.getElementById('price-alert-modal')) return;
        
        var modalHTML = `
            <div id="price-alert-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center;">
                <div style="background: white; border-radius: 16px; width: 94%; max-width: 560px;">
                    <div style="padding: 20px 24px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between;">
                        <h3 style="margin: 0; font-size: 18px; white-space: nowrap;">💰 Alerte de baisse de prix</h3>
                        <button id="close-modal-btn" style="background: #f3f4f6; border: none; border-radius: 50%; width: 36px; height: 36px; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #374151; flex-shrink: 0; margin-left: 12px;">&times;</button>
                    </div>
                    <div style="padding: 20px;">
                        <p>Prix actuel: <strong id="current-price"></strong></p>
                        <input type="number" id="target-price" placeholder="Prix cible (CAD)" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 6px;">
                        <input type="email" id="customer-email" placeholder="Votre email" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 6px;">
                        <div style="position: relative;">
                            <textarea id="alert-message" rows="3" placeholder="Message pour vous souvenir (optionnel, 150 car. max)" maxlength="150" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; resize: vertical;" oninput="document.getElementById('msg-counter').innerText = this.value.length + '/150'"></textarea>
                            <span id="msg-counter" style="position: absolute; bottom: 14px; right: 8px; font-size: 11px; color: #999;">0/150</span>
                        </div>
                        <button id="submit-alert" style="width: 100%; padding: 12px; background: #2d6a9f; color: white; border: none; border-radius: 6px; cursor: pointer;">Recevoir l'alerte</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        document.getElementById('close-modal-btn')?.addEventListener('click', function() {
            document.getElementById('price-alert-modal').style.display = 'none';
            document.body.style.overflow = '';
        });
        
        document.getElementById('price-alert-modal')?.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
        
        document.getElementById('submit-alert')?.addEventListener('click', async function() {
            var targetPrice = document.getElementById('target-price').value;
            var email = document.getElementById('customer-email').value;
            var message = document.getElementById('alert-message').value;
            
            if (!targetPrice || !email) {
                alert('Veuillez remplir tous les champs');
                return;
            }
            
            if (message && message.length > 150) {
                message = message.substring(0, 150);
            }
            
            var productTitle = document.querySelector('h1')?.innerText || document.title;
            var productUrl = window.location.href;
            var productId = window.location.pathname.split('/').pop();
            
            // Récupérer l'image via l'API JSON publique Shopify (sans auth)
            var productImageUrl = '';
            try {
                var handle = window.location.pathname.split('/products/')[1]?.split('?')[0]?.split('/')[0];
                if (handle) {
                    var productJson = await fetch('/products/' + handle + '.js').then(function(r) { return r.json(); });
                    productImageUrl = productJson?.images?.[0] || productJson?.featured_image || '';
                }
            } catch(e) {}
            
            // Fallback CSS si l'API échoue
            if (!productImageUrl) {
                var imgEl = 
                    document.querySelector('.product__media img:not([src*="icon"]):not([src*="logo"]):not([src*="cart"])') ||
                    document.querySelector('img[src*="cdn.shopify.com/s/files"][src*="products"]');
                productImageUrl = imgEl?.src || '';
            }
            
            // Toujours URL absolue https (requis pour les emails)
            if (productImageUrl && productImageUrl.startsWith('//')) {
                productImageUrl = 'https:' + productImageUrl;
            }
            if (productImageUrl && productImageUrl.includes('?')) {
                productImageUrl = productImageUrl.split('?')[0];
            }
            
            var currentPriceText = document.getElementById('current-price')?.innerText || '0';
            var currentPrice = parseFloat(currentPriceText.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
            
            // Utiliser l'URL complète de l'API
            fetch(API_BASE + '/price-alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: productId,
                    product_title: productTitle,
                    product_url: productUrl,
                    product_image_url: productImageUrl,
                    email: email,
                    target_price: parseFloat(targetPrice),
                    current_price: currentPrice,
                    message: message,
                    notification_push: true,
                    notification_email: true
                })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.success) {
                    alert('✅ Alerte enregistrée ! Vous serez averti quand le prix baissera.');
                    document.getElementById('price-alert-modal').style.display = 'none';
                    document.body.style.overflow = '';
                } else if (data.error && (data.error.includes('blacklist') || data.error.includes('ne supporte pas'))) {
                    alert('🚫 Les alertes prix ne sont pas disponibles pour ce produit.');
                } else if (data.error && data.error.includes('existe déjà')) {
                    alert('ℹ️ Vous avez déjà une alerte active pour ce produit.');
                } else {
                    alert('❌ Erreur: ' + (data.error || 'Réessayez plus tard'));
                }
            })
            .catch(function(err) {
                console.error('Erreur:', err);
                alert('❌ Erreur lors de l\'enregistrement. Veuillez réessayer.');
            });
        });
    }
    
    // Expose la fonction pour le widget
    window.showPriceAlertModal = function() {
        console.log('📢 showPriceAlertModal appelé');
        createModal();
        var modal = document.getElementById('price-alert-modal');
        if (modal) {
            var priceEl = document.querySelector('.price, [data-price], .product__price, .product-single__price');
            var price = priceEl?.innerText?.replace(/[^0-9.,]/g, '').replace(',', '.') || '0';
            var priceSpan = document.getElementById('current-price');
            if (priceSpan) priceSpan.innerText = parseFloat(price).toFixed(2) + ' CAD';
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            console.log('✅ Modal affiché');
        }
    };
    
    // Créer le modal au chargement
    createModal();
})();