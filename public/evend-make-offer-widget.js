/**
 * evend-make-offer-widget.js
 * Widget "Make Offer / Faire une offre" — e-Vend
 *
 * Utilise window.evendProductId et window.evendCustomer (déjà définis dans theme.liquid)
 * Charge sa config depuis /api/admin/configuration/make-offer
 * Vérifie si le produit a Make Offer activé via /api/make-offer/produit/:id
 */

(function () {
  'use strict';

  const API_BASE = 'https://evend-multivendeur-api.onrender.com';

  // ── Attendre que le DOM soit prêt ────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  async function init() {
    const productId = window.evendProductId;
    if (!productId || productId === '0' || productId === '') return;

    try {
      // Charger config admin + statut produit en parallèle
      const [cfgRes, produitRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/configuration/make-offer`),
        fetch(`${API_BASE}/api/make-offer/produit/${productId}`),
      ]);

      if (!cfgRes.ok || !produitRes.ok) return;

      const cfgData    = await cfgRes.json();
      const produitData = await produitRes.json();

      const cfg    = cfgData?.config    || {};
      const produit = produitData;

      // Double vérification : admin actif + produit activé
      if (!cfg.make_offer_actif) return;
      if (!produit.actif)        return;

      injecterWidget(cfg, produit, productId);

    } catch (err) {
      // Silencieux — ne pas bloquer la page si l'API est indisponible
      console.warn('[e-Vend Make Offer] Erreur init:', err.message);
    }
  }

  // ── Injection du bloc dans la page ──────────────────────────────────────
  function injecterWidget(cfg, produit, productId) {
    // Éviter les doublons
    if (document.getElementById('evend-make-offer-bloc')) return;

    // Trouver le bon point d'ancrage — stratégie progressive
    // On cherche d'abord des conteneurs larges, puis on se rabat sur le bouton ATC lui-même
    const btnATC = document.querySelector('[name="add"]');
    const anchor =
      document.querySelector('[data-testid="Sticky-product-form-container"]') ||
      document.querySelector('.product-form__buttons') ||
      document.querySelector('.product-form__submit')?.closest('div') ||
      document.querySelector('.shopify-payment-button') ||
      document.querySelector('.product__info-container') ||
      document.querySelector('#product-form-' + productId) ||
      // Fallback : utiliser le bouton ATC lui-même comme référence
      btnATC?.closest('form') ||
      btnATC?.parentElement ||
      btnATC;

    if (!anchor) {
      console.warn('[e-Vend Make Offer] Aucun point d\'ancrage trouvé.');
      return;
    }

    const r = cfg.border_radius ?? 10;

    // ── Encadré Make Offer ────────────────────────────────────────────────
    const bloc = document.createElement('div');
    // id déjà défini dans styleBloc ci-dessus
    // Injecter une règle CSS strong pour résister au thème Shopify
    const styleBloc = document.createElement('style');
    styleBloc.textContent = `
      #evend-make-offer-bloc {
        margin-top: 12px !important;
        padding: 14px 16px !important;
        background: ${cfg.couleur_fond || '#ffffff'} !important;
        border: 1px solid ${cfg.couleur_bordure || '#e1e4e8'} !important;
        border-radius: ${r}px !important;
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 12px !important;
        box-sizing: border-box !important;
        width: 100% !important;
        float: none !important;
      }
      #evend-make-offer-bloc > div {
        flex: 1 !important;
        min-width: 0 !important;
        display: block !important;
        float: none !important;
      }
      #evend-make-offer-bloc p {
        margin: 0 !important;
        padding: 0 !important;
        display: block !important;
        float: none !important;
        line-height: 1.4 !important;
      }
      #evend-make-offer-btn {
        flex-shrink: 0 !important;
        white-space: nowrap !important;
        display: inline-flex !important;
        align-items: center !important;
        background: ${cfg.couleur_bouton || '#2d6a9f'} !important;
        color: ${cfg.couleur_bouton_texte || '#ffffff'} !important;
        border: none !important;
        border-radius: ${Math.max(r - 2, 4)}px !important;
        padding: 10px 16px !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        min-width: fit-content !important;
        width: auto !important;
      }
    `;
    document.head.appendChild(styleBloc);
    bloc.setAttribute('id', 'evend-make-offer-bloc');

    const texteBloc = document.createElement('div');
    texteBloc.innerHTML = `
      <p style="font-size:13px;font-weight:700;color:${cfg.couleur_texte || '#1a2332'};margin:0 0 2px;">Prix trop élevé ?</p>
      <p style="font-size:11px;color:${cfg.couleur_texte || '#1a2332'};opacity:0.7;margin:0;">Proposez votre prix au vendeur</p>
    `;

    const bouton = document.createElement('button');
    bouton.id = 'evend-make-offer-btn';
    bouton.textContent = cfg.texte_bouton || '💬 Faire une offre';
    // Style du bouton géré par CSS injecté ci-dessus
    bouton.onmouseenter = () => { bouton.style.opacity = '0.88'; };
    bouton.onmouseleave = () => { bouton.style.opacity = '1'; };
    bouton.onclick = () => ouvrirModal(cfg, produit, productId);

    bloc.appendChild(texteBloc);
    bloc.appendChild(bouton);

    // Insérer le bloc intelligemment selon le type d'ancre trouvé
    // Si c'est le bouton ATC lui-même → insérer après
    // Si c'est un conteneur (form, div) → insérer après aussi mais en dehors
    try {
      anchor.insertAdjacentElement('afterend', bloc);
    } catch (e) {
      // Fallback si insertAdjacentElement échoue (ex: body, html)
      anchor.parentElement?.insertBefore(bloc, anchor.nextSibling);
    }

    console.log('[e-Vend Make Offer] ✅ Widget injecté après', anchor.tagName, anchor.className || anchor.id || '');

    injecterStyles(cfg);
  }

  // ── Styles globaux (modal) ───────────────────────────────────────────────
  function injecterStyles(cfg) {
    if (document.getElementById('evend-make-offer-styles')) return;
    const style = document.createElement('style');
    style.id = 'evend-make-offer-styles';
    style.textContent = `
      #evend-mo-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.55);
        z-index: 99999;
        display: flex; align-items: center; justify-content: center;
        padding: 20px; box-sizing: border-box;
        animation: evend-fadeIn 0.18s ease;
      }
      #evend-mo-modal {
        background: white;
        border-radius: 14px;
        width: 100%; max-width: 440px;
        box-shadow: 0 16px 56px rgba(0,0,0,0.28);
        overflow: hidden;
        animation: evend-slideUp 0.22s ease;
        font-family: inherit;
      }
      @keyframes evend-fadeIn  { from { opacity: 0; } to { opacity: 1; } }
      @keyframes evend-slideUp { from { transform: translateY(20px); opacity:0; } to { transform: none; opacity: 1; } }
      #evend-mo-modal input,
      #evend-mo-modal textarea {
        width: 100%; padding: 10px 12px;
        border: 1px solid #e1e4e8; border-radius: 8px;
        font-size: 13px; font-family: inherit;
        box-sizing: border-box; outline: none;
        transition: border-color 0.15s;
      }
      #evend-mo-modal input:focus,
      #evend-mo-modal textarea:focus { border-color: ${cfg.couleur_bouton || '#2d6a9f'}; }
      #evend-mo-modal label {
        display: block; font-size: 11px; font-weight: 700;
        color: #6b7280; margin-bottom: 5px;
        text-transform: uppercase; letter-spacing: 0.5px;
      }
      .evend-mo-field { margin-bottom: 14px; }
      .evend-mo-btn-primary {
        background: ${cfg.couleur_bouton || '#2d6a9f'};
        color: ${cfg.couleur_bouton_texte || '#fff'};
        border: none; border-radius: 8px;
        padding: 12px; font-size: 13px; font-weight: 700;
        cursor: pointer; width: 100%; font-family: inherit;
        transition: opacity 0.15s;
      }
      .evend-mo-btn-primary:hover { opacity: 0.88; }
      .evend-mo-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
      .evend-mo-btn-secondary {
        background: white; color: #6b7280;
        border: 1px solid #e1e4e8; border-radius: 8px;
        padding: 12px; font-size: 13px; font-weight: 600;
        cursor: pointer; width: 100%; font-family: inherit;
      }
      .evend-mo-error {
        background: #fef2f2; border: 1px solid #fecaca;
        border-radius: 8px; padding: 10px 14px;
        font-size: 12px; color: #dc2626;
        margin-bottom: 12px;
      }
    `;
    document.head.appendChild(style);
  }

  // ── Ouvrir le modal ──────────────────────────────────────────────────────
  function ouvrirModal(cfg, produit, productId) {
    // Éviter les doublons
    const existing = document.getElementById('evend-mo-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'evend-mo-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) fermerModal(); };

    const modal = document.createElement('div');
    modal.id = 'evend-mo-modal';

    // Récupérer infos client Shopify si connecté
    const customer = window.evendCustomer || {};
    const emailPrefill = customer.email || '';
    const nomPrefill   = customer.nom   || '';

    // Prix actuel affiché sur la page
    const prixElement = document.querySelector('.price__regular .price-item--regular, .product__price .money, [class*="price"] .money, .price');
    let prixActuel = '';
    if (prixElement) {
      const match = prixElement.textContent.match(/[\d,. ]+/);
      if (match) prixActuel = match[0].trim().replace(/\s/g, '');
    }

    modal.innerHTML = `
      <div style="padding:18px 22px;border-bottom:1px solid #e1e4e8;display:flex;align-items:center;justify-content:space-between;">
        <h3 style="font-size:15px;font-weight:800;color:#1a2332;margin:0;">${cfg.texte_titre_modal || '💬 Faire une offre au vendeur'}</h3>
        <button id="evend-mo-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#9ca3af;line-height:1;padding:0 4px;">✕</button>
      </div>
      <div id="evend-mo-body" style="padding:22px;">
        <div id="evend-mo-form-step">
          <div id="evend-mo-error" class="evend-mo-error" style="display:none;"></div>

          <div class="evend-mo-field">
            <label>${cfg.texte_label_montant || 'Votre offre ($)'}</label>
            <div style="position:relative;">
              <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-weight:700;color:#6b7280;font-size:14px;">$</span>
              <input id="evend-mo-montant" type="number" min="0" step="0.01" placeholder="${cfg.texte_placeholder_montant || 'Ex : 45.00'}" style="padding-left:28px;" />
            </div>
            ${prixActuel ? `<p style="font-size:11px;color:#9ca3af;margin:4px 0 0;">Prix actuel : ${prixActuel}</p>` : ''}
            ${produit.prix_min ? `<p style="font-size:11px;color:#d97706;margin:4px 0 0;">⚠️ Offre minimum : ${produit.prix_min.toFixed(2)} $</p>` : ''}
          </div>

          <div class="evend-mo-field">
            <label>${cfg.texte_label_email || 'Votre courriel'}</label>
            <input id="evend-mo-email" type="email" placeholder="votre@courriel.com" value="${emailPrefill}" />
          </div>

          <div class="evend-mo-field">
            <label>${cfg.texte_label_nom || 'Votre nom'}</label>
            <input id="evend-mo-nom" type="text" placeholder="Votre nom" value="${nomPrefill}" />
          </div>

          <div class="evend-mo-field">
            <label>${cfg.texte_label_message || 'Message au vendeur (optionnel)'}</label>
            <textarea id="evend-mo-message" rows="3" placeholder="${cfg.texte_placeholder_message || 'Ex : Je suis très intéressé...'}" style="resize:vertical;"></textarea>
          </div>

          <div style="display:flex;gap:10px;">
            <button class="evend-mo-btn-secondary" onclick="document.getElementById('evend-mo-overlay').remove()" style="flex:1;">
              ${cfg.texte_bouton_annuler || 'Annuler'}
            </button>
            <button class="evend-mo-btn-primary" id="evend-mo-submit" style="flex:2;">
              ${cfg.texte_bouton_envoyer || 'Envoyer mon offre'}
            </button>
          </div>
        </div>

        <div id="evend-mo-success-step" style="display:none;text-align:center;padding:12px 0;">
          <div style="font-size:48px;margin-bottom:12px;" id="evend-mo-success-icon">📤</div>
          <p style="font-size:15px;font-weight:700;margin:0 0 8px;" id="evend-mo-success-msg"></p>
          <p style="font-size:12px;color:#6b7280;margin:0 0 20px;" id="evend-mo-success-sub"></p>
          <button class="evend-mo-btn-secondary" onclick="document.getElementById('evend-mo-overlay').remove()">Fermer</button>
        </div>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Bouton fermer
    document.getElementById('evend-mo-close').onclick = fermerModal;

    // Soumettre
    document.getElementById('evend-mo-submit').onclick = () => soumettreOffre(cfg, produit, productId);
  }

  function fermerModal() {
    const overlay = document.getElementById('evend-mo-overlay');
    if (overlay) overlay.remove();
  }

  // ── Soumettre l'offre ────────────────────────────────────────────────────
  async function soumettreOffre(cfg, produit, productId) {
    const montantEl = document.getElementById('evend-mo-montant');
    const emailEl   = document.getElementById('evend-mo-email');
    const nomEl     = document.getElementById('evend-mo-nom');
    const messageEl = document.getElementById('evend-mo-message');
    const erreurEl  = document.getElementById('evend-mo-error');
    const submitBtn = document.getElementById('evend-mo-submit');

    const montant = parseFloat(montantEl.value);
    const email   = emailEl.value.trim();
    const nom     = nomEl.value.trim();
    const message = messageEl.value.trim();

    // Validation côté client
    erreurEl.style.display = 'none';

    if (!montant || montant <= 0) {
      afficherErreur(erreurEl, '⚠️ Veuillez entrer un montant valide.');
      montantEl.focus(); return;
    }
    if (produit.prix_min && montant < produit.prix_min) {
      afficherErreur(erreurEl, `⚠️ Votre offre est trop basse. Le minimum est ${produit.prix_min.toFixed(2)} $.`);
      montantEl.focus(); return;
    }
    if (!email || !email.includes('@')) {
      afficherErreur(erreurEl, '⚠️ Veuillez entrer un courriel valide.');
      emailEl.focus(); return;
    }

    // Récupérer infos produit depuis la page
    const produitTitre = document.querySelector('h1.product__title, h1[class*="product"], .product-single__title, h1')?.textContent?.trim() || '';
    const produitUrl   = window.location.href;

    // ── Détecter la variante sélectionnée ────────────────────────────────
    let varianteInfo = null;
    try {
      // Shopify expose la variante sélectionnée via window.ShopifyAnalytics ou le sélecteur de variante
      const varianteId =
        window.ShopifyAnalytics?.meta?.selectedVariantId ||
        document.querySelector('[name="id"]')?.value ||
        document.querySelector('input[name="id"]:checked')?.value ||
        document.querySelector('.product-form__input select')?.value ||
        null;

      if (varianteId) {
        // Lire le titre de la variante depuis les options sélectionnées
        const optionEls = document.querySelectorAll('.product-form__input .form__label, .variant-input-wrap input:checked + label');
        const optionsTitres = Array.from(optionEls).map(el => el.textContent?.trim()).filter(Boolean);

        // Chercher l'image de la variante (Shopify change l'image principale quand on sélectionne une variante)
        const imgVariante = document.querySelector('.product__media-item--active img, .product-single__photo--active img, [data-media-type="image"] img')?.src || null;

        varianteInfo = {
          variante_id: String(varianteId),
          titre:       optionsTitres.length > 0 ? optionsTitres.join(' / ') : null,
          image_url:   imgVariante,
        };
      }
    } catch (e) {
      // Silencieux — la variante est optionnelle
    }

    // Envoyer
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Envoi en cours...';

    try {
      const response = await fetch(`${API_BASE}/api/make-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annonce_id:    productId,
          acheteur_email: email,
          acheteur_nom:  nom,
          montant:       montant,
          message:       message,
          produit_titre: produitTitre,
          produit_url:   produitUrl,
          variante_info: varianteInfo,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Afficher le step succès
        document.getElementById('evend-mo-form-step').style.display    = 'none';
        document.getElementById('evend-mo-success-step').style.display = 'block';

        const iconEl = document.getElementById('evend-mo-success-icon');
        const msgEl  = document.getElementById('evend-mo-success-msg');
        const subEl  = document.getElementById('evend-mo-success-sub');

        if (data.auto_accepte) {
          iconEl.textContent = '🎉';
          msgEl.textContent  = cfg.texte_offre_acceptee || '🎉 Offre acceptée !';
          msgEl.style.color  = '#16a34a';
          subEl.textContent  = 'Votre offre a été automatiquement acceptée. Vous recevrez un courriel de confirmation.';
        } else {
          iconEl.textContent = '📤';
          msgEl.textContent  = cfg.texte_offre_envoyee || '✅ Votre offre a été envoyée au vendeur !';
          msgEl.style.color  = '#15803d';
          subEl.textContent  = 'Le vendeur recevra une notification. Vous serez informé(e) par courriel de sa réponse.';
        }
      } else {
        afficherErreur(erreurEl, `❌ ${data.message || 'Erreur lors de l\'envoi. Veuillez réessayer.'}`);
        submitBtn.disabled = false;
        submitBtn.textContent = cfg.texte_bouton_envoyer || 'Envoyer mon offre';
      }

    } catch (err) {
      afficherErreur(erreurEl, '❌ Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
      submitBtn.disabled = false;
      submitBtn.textContent = cfg.texte_bouton_envoyer || 'Envoyer mon offre';
    }
  }

  function afficherErreur(el, message) {
    el.textContent     = message;
    el.style.display   = 'block';
  }

})();