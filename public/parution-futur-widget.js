/**
 * e-Vend | Widget Parution Future
 * ================================
 * Chargé depuis theme.liquid juste après le widget enchères.
 * Utilise window.evendProductTags et window.evendProductId
 * déjà injectés par le bloc enchères dans theme.liquid.
 *
 * FONCTIONNEMENT :
 *  1. Vérifie si le produit a le tag "parution_future" via window.evendProductTags
 *  2. Si oui → appelle l'API pour obtenir la date exacte
 *  3. Injecte le bloc countdown + bloque le bouton "Ajouter au panier"
 *  4. Quand le countdown atteint 0 → débloque le panier, feux d'artifice 🎉
 */

(function () {
  'use strict';

  const EVEND_API_BASE = 'https://evend-multivendeur-api.onrender.com';

  // Utiliser window.evendProductId injecté par theme.liquid
  const shopifyProductId = window.evendProductId || null;
  if (!shopifyProductId) return;

  // Utiliser window.evendProductTags injecté par theme.liquid
  function hasFuturTag() {
    const tags = window.evendProductTags;
    if (Array.isArray(tags)) return tags.includes('parution_future');
    return 'unknown';
  }

  async function init() {
    const tagCheck = hasFuturTag();

    // Si le tag est clairement absent → sortir sans appel API
    if (tagCheck === false) return;

    // Charger en parallèle : date de parution + config du widget
    let apiData = null;
    let widgetConfig = null;

    try {
      const [parutionResp, configResp] = await Promise.all([
        fetch(`${EVEND_API_BASE}/api/creer-annonce/${shopifyProductId}/parution`, { cache: 'no-store' }),
        fetch(`${EVEND_API_BASE}/api/admin/configuration/parution-futur`, { cache: 'no-store' })
      ]);

      if (!parutionResp.ok) return;
      apiData = await parutionResp.json();

      if (configResp.ok) {
        const configData = await configResp.json();
        widgetConfig = configData.config || null;
      }
    } catch (e) {
      console.warn('[e-Vend] Erreur fetch parution/config:', e);
      return;
    }

    if (!apiData?.success || !apiData?.est_parution_future) return;

    const dateParution = new Date(apiData.date_parution);
    if (isNaN(dateParution.getTime())) return;

    // ===== À partir d'ici, on a une vraie date future =====
    injectStyles(widgetConfig);
    injectCountdown(dateParution, shopifyProductId, widgetConfig);
  }

  // ============================================================
  // INJECTION CSS
  // ============================================================
  function injectStyles(cfg) {
    const c = cfg || {};

    // Toujours recréer le style pour appliquer la nouvelle config
    const existing = document.getElementById('evend-parution-styles');
    if (existing) existing.remove();

    const fondDebut     = c.couleur_fond_debut        || '#0d2b5d';
    const fondFin       = c.couleur_fond_fin           || '#0a1a3d';
    const couleurTxt    = c.couleur_texte              || '#e2ebff';
    const couleurTitres = c.couleur_titres             || '#b7c9ff';
    const bordure       = c.couleur_bordure            || '#000000';
    const radius        = (c.border_radius             ?? 14) + 'px';
    const bWidth        = (c.border_width              ?? 3) + 'px';
    const fondMobD      = c.couleur_fond_mobile_debut  || fondDebut;
    const fondMobF      = c.couleur_fond_mobile_fin    || fondFin;
    const ombre         = c.ombre_active
      ? `0 0 ${c.ombre_intensite || 35}px rgba(0,0,0,0.4)` : 'none';
    const vitVague      = c.vitesse_vague === 'lente'  ? '18s'
                        : c.vitesse_vague === 'rapide' ? '6s' : '12s';
    const effetVague    = c.effet_vague   !== false;
    const effetBordure  = c.effet_bordure !== false;

    const style = document.createElement('style');
    style.id = 'evend-parution-styles';
    style.textContent = `
      .evend-countdown-wrapper {
        position: relative; overflow: hidden;
        margin-top: 16px; margin-bottom: 16px; padding: 20px;
        background: linear-gradient(135deg, ${fondDebut}, ${fondFin});
        border-radius: ${radius};
        color: ${couleurTxt};
        text-align: center;
        border: ${bWidth} solid ${bordure};
        box-shadow: ${ombre};
        animation: none;
      }
      .evend-countdown-wrapper::before {
        content: ""; position: absolute;
        top: -40%; left: -40%; width: 180%; height: 180%;
        background: radial-gradient(circle at 50% 50%, rgba(129,205,255,0.26), transparent 55%);
        filter: blur(10px); animation: none; opacity: 0;
      }
      .evend-countdown-wrapper.is-ended::before { animation: none; }
      @keyframes evend-wave {
        0%   { transform: translateX(-15%) translateY(0) scale(1); }
        50%  { transform: translateX(15%) translateY(6%) scale(1.02); }
        100% { transform: translateX(-15%) translateY(0) scale(1); }
      }
      @keyframes evend-borderDouble {
        0%,100% { box-shadow: 0 0 0 2px rgba(0,0,0,0.15), 0 0 25px rgba(0,0,0,0.35); }
        50%      { box-shadow: 0 0 0 6px rgba(0,0,0,0.22), 0 0 35px rgba(0,0,0,0.45); }
      }
      @media (min-width: 768px) {
        .evend-countdown-wrapper {
          animation: ${effetBordure ? 'evend-borderDouble 4s ease-in-out infinite' : 'none'};
        }
        .evend-countdown-wrapper::before {
          animation: ${effetVague ? 'evend-wave ' + vitVague + ' ease-in-out infinite' : 'none'};
          opacity: ${effetVague ? '1' : '0'};
        }
      }
      @media (max-width: 767px) {
        .evend-countdown-wrapper {
          background: linear-gradient(135deg, ${fondMobD}, ${fondMobF});
          border: 2px solid ${bordure}; box-shadow: none;
        }
        .evend-countdown-wrapper::before { display: none; }
      }
      .evend-sale-date       { font-size: 0.95rem; font-weight: 600; color: ${couleurTxt}; }
      .evend-timezone        { font-size: 0.7rem; opacity: 0.7; margin-bottom: 10px; color: ${couleurTxt}; }
      .evend-countdown-title { font-size: 0.85rem; margin-bottom: 12px; color: ${couleurTitres}; }
      .evend-countdown-timer { display: flex; justify-content: center; gap: 12px; }
      .evend-time-box        { border-radius: 10px; padding: 10px 12px; min-width: 62px; }
      .evend-time-value      { font-weight: 700; }
      .evend-time-label      { font-size: 0.7rem; text-transform: uppercase; opacity: 0.75; }
      .evend-sale-open       { font-weight: 700; font-size: 1.05rem; color: #9affc7; padding: 10px 0; margin-bottom: 28px; }
      .evend-seo-text        { font-size: 0.8rem; opacity: 0.85; margin-bottom: 10px; color: ${couleurTxt}; }
      @keyframes evendFadeUp {
        from { opacity:0; transform: translateY(18px) scale(0.96); }
        to   { opacity:1; transform: translateY(0) scale(1); }
      }
      @keyframes evendFadeOut { from { opacity:1; } to { opacity:0; } }
      .evend-fade-in  { animation: evendFadeUp 0.7s ease-out forwards; }
      .evend-fade-out { animation: evendFadeOut 0.6s ease-out forwards; }
      body.evend-sale-future [data-action="add-to-cart"],
      body.evend-sale-future .shopify-payment-button,
      body.evend-sale-future form[action="/cart/add"] button[type="submit"],
      body.evend-sale-future .product-form__cart-submit {
        pointer-events: none !important; opacity: 0.4 !important; cursor: not-allowed !important;
      }
      @media (min-width: 768px) {
        .evend-fireworks { position:absolute; top:50%; left:50%; width:260px; height:260px; transform:translate(-50%,-50%); pointer-events:none; overflow:visible; z-index:0; }
        .evend-fireworks span { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:4px; height:4px; border-radius:50%; animation:evend-explode 1.8s infinite ease-out; opacity:0; }
        .evend-fireworks span:nth-child(odd)  { background:#ff0044; }
        .evend-fireworks span:nth-child(even) { background:#00d4ff; }
        @keyframes evend-explode {
          0%   { transform:translate(-50%,-50%) translate(0,0) scale(1); opacity:1; }
          100% { transform:translate(-50%,-50%) translate(calc(var(--x)*1px),calc(var(--y)*1px)) scale(0.8); opacity:0; }
        }
      }
    `;
    document.head.appendChild(style);
  }
  // ============================================================
  // INJECTION DU BLOC COUNTDOWN DANS LE DOM
  // ============================================================
  function injectCountdown(dateParution, productId, cfg) {
    const c = cfg || {};
    // Trouver l'anchor d'injection — le formulaire "Ajouter au panier"
    const anchor = findAtcAnchor();
    if (!anchor) {
      console.warn('[e-Vend] Impossible de trouver le formulaire ATC pour injecter le countdown');
      return;
    }

    const wrapperId = `evend-countdown-${productId}`;
    if (document.getElementById(wrapperId)) return; // déjà injecté

    // Formater la date en français
    const txtDatePrefix  = c.texte_date_prefix  || '🗓️ Mise en vente le';
    const txtTimezone    = c.texte_timezone    || '(Heure de Montréal — EST/EDT)';
    const txtTitre       = c.texte_titre       || '⏳ Disponible dans :';
    const txtSeo         = c.texte_seo         || 'Ce produit sera disponible à la vente dès la fin du compte à rebours.';
    const txtVenteOuverte = c.texte_vente_ouverte || '🎉 La vente est ouverte !!!';
    const affTimezone    = c.afficher_timezone !== false;
    const affSeo         = c.afficher_seo      !== false;
    const dureeDispMs    = ((c.duree_disparition_bloc || 5) * 1000);
    const dureeOuverteMs = ((c.duree_vente_ouverte   || 24) * 3600 * 1000);
    const cBloqWish      = c.bloquer_wishlist !== false;
    const cAffMsgAtc     = c.afficher_message_atc === true;
    const cTxtAtc        = c.texte_atc_bloque || '';
    const cFeux          = c.afficher_feux_artifice !== false;
    const cBoiteFond     = c.couleur_boite_fond    || '#1a3a6e';
    const cBoiteBord     = c.couleur_boite_bordure || '#3a6aaf';
    const cChiffres      = c.couleur_chiffres      || '#ffffff';
    const cTitres        = c.couleur_titres        || '#b7c9ff';
    const cTxt           = c.couleur_texte         || '#e2ebff';
    const cTailleChiffres = ((c.taille_chiffres || 140) / 100) + 'rem';

    const dateFormatee = dateParution.toLocaleString('fr-CA', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const box = document.createElement('div');
    box.id = wrapperId;
    box.className = 'evend-countdown-wrapper';
    box.dataset.future = Math.floor(dateParution.getTime() / 1000);

    // Génération des spans pour les feux d'artifice (PC)
    const fireworkSpans = Array.from({ length: 55 }, (_, i) => {
      const angle = (i / 55) * 2 * Math.PI;
      const r = 60 + Math.random() * 30;
      const x = Math.round(Math.cos(angle) * r);
      const y = Math.round(Math.sin(angle) * r);
      return `<span style="--x:${x};--y:${y};--i:${i};animation-delay:${(i * 0.03).toFixed(2)}s"></span>`;
    }).join('');

    box.innerHTML = `
      <p class="evend-sale-date">${txtDatePrefix} <strong>${dateFormatee}</strong></p>
      ${affTimezone ? `<p class="evend-timezone">${txtTimezone}</p>` : ''}
      <p class="evend-countdown-title">${txtTitre}</p>
      <div class="evend-countdown-timer">
        <div class="evend-time-box" style="background:${cBoiteFond};border-color:${cBoiteBord}"><div class="evend-time-value" data-evend-days style="font-size:${cTailleChiffres};color:${cChiffres}">--</div><div class="evend-time-label" style="color:${cTxt}">jours</div></div>
        <div class="evend-time-box" style="background:${cBoiteFond};border-color:${cBoiteBord}"><div class="evend-time-value" data-evend-hours style="font-size:${cTailleChiffres};color:${cChiffres}">--</div><div class="evend-time-label" style="color:${cTxt}">heures</div></div>
        <div class="evend-time-box" style="background:${cBoiteFond};border-color:${cBoiteBord}"><div class="evend-time-value" data-evend-minutes style="font-size:${cTailleChiffres};color:${cChiffres}">--</div><div class="evend-time-label" style="color:${cTxt}">min</div></div>
        <div class="evend-time-box" style="background:${cBoiteFond};border-color:${cBoiteBord}"><div class="evend-time-value" data-evend-seconds style="font-size:${cTailleChiffres};color:${cChiffres}">--</div><div class="evend-time-label" style="color:${cTxt}">sec</div></div>
      </div>
      ${affSeo ? `<p class="evend-seo-text">${txtSeo}</p>` : ''}
      ${cAffMsgAtc && cTxtAtc ? `<p class="evend-atc-msg" style="margin-top:10px;padding:10px;background:rgba(255,255,255,0.1);border-radius:8px;font-size:0.85rem;color:${cTxt}">${cTxtAtc}</p>` : ''}
    `;

    // Insérer avant le formulaire ATC
    anchor.parentNode.insertBefore(box, anchor);

    // Bloquer le bouton ATC via classe sur body
    document.body.classList.add('evend-sale-future');

    // Démarrer le tick
    const futureMs = dateParution.getTime();
    const storageKey = `evend_open_expire_${productId}`;

    const elD = box.querySelector('[data-evend-days]');
    const elH = box.querySelector('[data-evend-hours]');
    const elM = box.querySelector('[data-evend-minutes]');
    const elS = box.querySelector('[data-evend-seconds]');

    let saleOpened = false;

    function showOpenedState() {
      saleOpened = true;
      box.classList.add('is-ended');
      box.innerHTML = `
        <div class="evend-sale-open">🎉 La vente est ouverte !!!</div>
        <div class="evend-fireworks"><div class="fireworks-ultra">${fireworkSpans}</div></div>
      `;
      document.body.classList.remove('evend-sale-future');
      document.body.classList.add('evend-sale-open');

      // Sauvegarder pour 24h
      const expireAt = Date.now() + dureeOuverteMs;
      try { localStorage.setItem(storageKey, JSON.stringify({ expireAt })); } catch(e){}

      // Faire disparaître le bloc après 24h (ou au prochain chargement)
      setTimeout(() => {
        box.classList.add('evend-fade-out');
        setTimeout(() => { box.style.display = 'none'; }, 700);
      }, dureeOuverteMs);
    }

    function tick() {
      if (saleOpened) return;

      const diff = futureMs - Date.now();

      if (diff <= 0) {
        showOpenedState();
        return;
      }

      elD.textContent = Math.floor(diff / 86400000);
      elH.textContent = Math.floor((diff % 86400000) / 3600000);
      elM.textContent = Math.floor((diff % 3600000) / 60000);
      elS.textContent = Math.floor((diff % 60000) / 1000);
    }

    // Vérifier si la vente s'est ouverte pendant qu'on était ailleurs
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expireAt && Date.now() < parsed.expireAt) {
          showOpenedState();
          return;
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (e) {}

    tick();
    setInterval(tick, 1000);
  }

  // ============================================================
  // TROUVER LE FORMULAIRE ATC (compatible multi-thèmes Shopify)
  // ============================================================
  function findAtcAnchor() {
    const selectors = [
      // Ordre de priorité — du plus spécifique au plus générique
      'form[action="/cart/add"]',
      '.product-form',
      '.product__form',
      '[data-product-form]',
      '.shopify-payment-button',
      '.product-form__cart-submit',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  // ============================================================
  // LANCEMENT
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();