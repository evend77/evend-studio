/**
 * e-Vend Checkout Button
 * Script injecté automatiquement dans toutes les boutiques via Shopify Script Tags API
 * Détecte la page de remerciement et affiche les boutons de paiement
 *
 * URL: https://evend-multivendeur-api.onrender.com/public/checkout-button.js
 * Version: 1.0.0
 */
(function () {
  'use strict';

  var EVEND_API = 'https://evend-multivendeur-api.onrender.com';

  // ── Détecter si on est sur la page de remerciement ─────────────────────
  function estPageRemerciement() {
    return window.location.href.indexOf('thank_you') !== -1 ||
           window.location.href.indexOf('thank-you') !== -1 ||
           window.location.pathname.indexOf('/thank_you') !== -1;
  }

  // ── Extraire l'ID de commande Shopify depuis l'URL ou le DOM ───────────
  function getOrderId() {
    // Méthode 1 — Shopify expose window.Shopify.checkout
    if (window.Shopify && window.Shopify.checkout && window.Shopify.checkout.order_id) {
      return window.Shopify.checkout.order_id.toString();
    }

    // Méthode 2 — depuis l'URL (ex: /orders/5678901234/thank_you)
    var match = window.location.pathname.match(/\/orders\/(\d+)/);
    if (match) return match[1];

    // Méthode 3 — depuis le meta tag Shopify
    var meta = document.querySelector('meta[property="og:url"]');
    if (meta) {
      var metaMatch = meta.content.match(/\/orders\/(\d+)/);
      if (metaMatch) return metaMatch[1];
    }

    // Méthode 4 — depuis le paramètre URL
    var params = new URLSearchParams(window.location.search);
    if (params.get('order_id')) return params.get('order_id');

    return null;
  }

  // ── Extraire le nom de commande (ex: X881JEVQC) ────────────────────────
  function getOrderName() {
    // Depuis window.Shopify
    if (window.Shopify && window.Shopify.checkout && window.Shopify.checkout.order_name) {
      return window.Shopify.checkout.order_name;
    }

    // Depuis le DOM — le numéro de confirmation affiché
    var confirmEl = document.querySelector('.os-order-number, [data-order-name], .order-number');
    if (confirmEl) return confirmEl.textContent.replace(/[^A-Z0-9]/gi, '');

    return null;
  }

  // ── Extraire le vendeur_id depuis les meta tags du produit ─────────────
  function getVendeurId() {
    // Shopify peut exposer le vendor dans les line items
    if (window.Shopify && window.Shopify.checkout && window.Shopify.checkout.line_items) {
      var items = window.Shopify.checkout.line_items;
      if (items.length > 0 && items[0].vendor) {
        // On utilise le vendor name pour trouver le vendeur dans notre BD
        return null; // Sera résolu côté backend via shop_domain
      }
    }
    return null;
  }

  // ── Vérifier si la commande est déjà payée ─────────────────────────────
  function verifierStatut(orderId, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', EVEND_API + '/api/checkout/statut/' + orderId, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            var data = JSON.parse(xhr.responseText);
            callback(null, data);
          } catch (e) {
            callback(e, null);
          }
        } else {
          callback(new Error('Erreur statut'), null);
        }
      }
    };
    xhr.send();
  }

  // ── Créer la Checkout Session et rediriger ─────────────────────────────
  function lancerPaiement(orderId, orderName, methode, bouton) {
    bouton.disabled = true;
    bouton.textContent = methode === 'stripe' ? '⏳ Chargement...' : '⏳ Chargement PayPal...';
    bouton.style.opacity = '0.7';

    var endpoint = methode === 'stripe'
      ? EVEND_API + '/api/checkout/create-session'
      : EVEND_API + '/api/checkout/create-paypal';

    var xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            var data = JSON.parse(xhr.responseText);
            if (data.session_url || data.paypal_url) {
              window.location.href = data.session_url || data.paypal_url;
            } else {
              afficherErreur('URL de paiement non reçue');
              resetBouton(bouton, methode);
            }
          } catch (e) {
            afficherErreur('Erreur de connexion');
            resetBouton(bouton, methode);
          }
        } else {
          try {
            var err = JSON.parse(xhr.responseText);
            afficherErreur(err.error || 'Erreur serveur');
          } catch (e) {
            afficherErreur('Erreur serveur (' + xhr.status + ')');
          }
          resetBouton(bouton, methode);
        }
      }
    };
    xhr.send(JSON.stringify({
      shopify_order_id:   orderId,
      shopify_order_name: orderName,
      methode:            methode,
    }));
  }

  function resetBouton(bouton, methode) {
    bouton.disabled = false;
    bouton.style.opacity = '1';
    bouton.textContent = methode === 'stripe'
      ? '💳 Payer par carte (Stripe)'
      : '🅿️ Payer avec PayPal';
  }

  function afficherErreur(message) {
    var errEl = document.getElementById('evend-checkout-error');
    if (errEl) {
      errEl.textContent = '❌ ' + message;
      errEl.style.display = 'block';
    }
  }

  // ── Styles CSS injectés ────────────────────────────────────────────────
  function injecterStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '#evend-checkout-widget {',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '  margin: 24px 0;',
      '  padding: 20px 24px;',
      '  background: #fff;',
      '  border: 2px solid #e0e0e0;',
      '  border-radius: 12px;',
      '  box-shadow: 0 2px 8px rgba(0,0,0,0.08);',
      '}',
      '#evend-checkout-widget h3 {',
      '  margin: 0 0 6px 0;',
      '  font-size: 16px;',
      '  font-weight: 700;',
      '  color: #1a1a1a;',
      '}',
      '#evend-checkout-widget p {',
      '  margin: 0 0 16px 0;',
      '  font-size: 13px;',
      '  color: #666;',
      '}',
      '.evend-btn {',
      '  display: block;',
      '  width: 100%;',
      '  padding: 14px 20px;',
      '  margin-bottom: 10px;',
      '  border: none;',
      '  border-radius: 8px;',
      '  font-size: 15px;',
      '  font-weight: 700;',
      '  cursor: pointer;',
      '  transition: opacity 0.2s, transform 0.1s;',
      '  text-align: center;',
      '}',
      '.evend-btn:hover:not(:disabled) {',
      '  opacity: 0.9;',
      '  transform: translateY(-1px);',
      '}',
      '.evend-btn:active:not(:disabled) {',
      '  transform: translateY(0);',
      '}',
      '.evend-btn-stripe {',
      '  background: #635bff;',
      '  color: white;',
      '}',
      '.evend-btn-paypal {',
      '  background: #ffc439;',
      '  color: #003087;',
      '}',
      '.evend-btn:disabled {',
      '  cursor: not-allowed;',
      '}',
      '#evend-checkout-error {',
      '  display: none;',
      '  margin-top: 10px;',
      '  padding: 10px 14px;',
      '  background: #fef2f2;',
      '  border: 1px solid #fca5a5;',
      '  border-radius: 6px;',
      '  font-size: 13px;',
      '  color: #dc2626;',
      '}',
      '#evend-checkout-paye {',
      '  padding: 14px 20px;',
      '  background: #f0fdf4;',
      '  border: 1px solid #86efac;',
      '  border-radius: 8px;',
      '  font-size: 14px;',
      '  font-weight: 600;',
      '  color: #16a34a;',
      '  text-align: center;',
      '}',
      '#evend-checkout-loading {',
      '  text-align: center;',
      '  padding: 16px;',
      '  font-size: 13px;',
      '  color: #888;',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── Construire et injecter le widget ───────────────────────────────────
  function afficherWidget(orderId, orderName, dejaPaye) {
    injecterStyles();

    var widget = document.createElement('div');
    widget.id  = 'evend-checkout-widget';

    if (dejaPaye) {
      widget.innerHTML = [
        '<div id="evend-checkout-paye">',
        '  ✅ Paiement confirmé — Merci pour votre achat !',
        '</div>',
      ].join('');
    } else {
      widget.innerHTML = [
        '<h3>💳 Compléter votre paiement</h3>',
        '<p>Votre commande est confirmée. Veuillez procéder au paiement pour finaliser votre achat.</p>',
        '<button class="evend-btn evend-btn-stripe" id="evend-btn-stripe">',
        '  💳 Payer par carte (Stripe)',
        '</button>',
        '<button class="evend-btn evend-btn-paypal" id="evend-btn-paypal">',
        '  🅿️ Payer avec PayPal',
        '</button>',
        '<div id="evend-checkout-error"></div>',
        '<p style="margin-top:12px;font-size:11px;color:#aaa;text-align:center;">',
        '  🔒 Paiement sécurisé — Powered by e-Vend',
        '</p>',
      ].join('');
    }

    // Trouver où insérer le widget — avant le bouton "Suivre la commande"
    var cibles = [
      '.step__footer',
      '.os-order-number',
      '.os-header',
      '.main__content',
      '.order-summary',
      '.step',
      'main',
      'body'
    ];

    var parent = null;
    for (var i = 0; i < cibles.length; i++) {
      parent = document.querySelector(cibles[i]);
      if (parent) break;
    }

    if (parent && parent !== document.body) {
      parent.insertBefore(widget, parent.firstChild);
    } else {
      document.body.insertBefore(widget, document.body.firstChild);
    }

    // Attacher les événements si pas encore payé
    if (!dejaPaye) {
      var btnStripe  = document.getElementById('evend-btn-stripe');
      var btnPaypal  = document.getElementById('evend-btn-paypal');

      if (btnStripe) {
        btnStripe.addEventListener('click', function () {
          lancerPaiement(orderId, orderName, 'stripe', btnStripe);
        });
      }

      if (btnPaypal) {
        btnPaypal.addEventListener('click', function () {
          lancerPaiement(orderId, orderName, 'paypal', btnPaypal);
        });
      }
    }
  }

  // ── Point d'entrée principal ────────────────────────────────────────────
  function init() {
    if (!estPageRemerciement()) return;

    var orderId   = getOrderId();
    var orderName = getOrderName();

    if (!orderId) {
      console.warn('[e-Vend] Impossible de détecter l\'ID de commande');
      return;
    }

    console.log('[e-Vend] Page remerciement détectée — Commande:', orderId, orderName);

    // Afficher un loader pendant la vérification
    injecterStyles();
    var loader = document.createElement('div');
    loader.id  = 'evend-checkout-widget';
    loader.innerHTML = '<div id="evend-checkout-loading">⏳ Vérification du paiement...</div>';
    document.body.insertBefore(loader, document.body.firstChild);

    // Vérifier si déjà payé
    verifierStatut(orderId, function (err, data) {
      // Supprimer le loader
      var loaderEl = document.getElementById('evend-checkout-widget');
      if (loaderEl) loaderEl.parentNode.removeChild(loaderEl);

      if (err) {
        // Erreur de vérification — afficher quand même les boutons
        afficherWidget(orderId, orderName, false);
        return;
      }

      afficherWidget(orderId, orderName, data.paye === true);
    });
  }

  // ── Lancer quand le DOM est prêt ───────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM déjà prêt
    setTimeout(init, 500); // petit délai pour laisser Shopify charger ses vars
  }

})();