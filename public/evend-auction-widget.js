(function () {
  'use strict';

  // Éviter les doublons entre local et Render
  if (window.evendWidgetLoaded) {
    console.log('⚠️ Widget déjà chargé, ignoré');
    return;
  }
  window.evendWidgetLoaded = true;

  var API_BASE = 'https://evend-multivendeur-api.onrender.com/api';
  var POLL_INTERVAL = 30000;
  var pollTimer = null;
  var enchereId = null;

  // ── 1. Verifier si la page est une page produit avec enchère active ─────────
  function getProduitId() {
    try {
      var AUCTION_TAGS = ['evend_on_auction', 'evend_upcoming_auction'];

      if (window.evendProductId && window.evendProductTags) {
        var tags = window.evendProductTags;
        if (typeof tags === 'string') tags = tags.split(',').map(function(t){ return t.trim(); });
        for (var i = 0; i < AUCTION_TAGS.length; i++) {
          if (tags.indexOf(AUCTION_TAGS[i]) !== -1) return String(window.evendProductId);
        }
        return null;
      }

      if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product) {
        var meta = window.ShopifyAnalytics.meta.product;
        var mtags = meta.tags || [];
        if (typeof mtags === 'string') mtags = mtags.split(',').map(function(t){ return t.trim(); });
        for (var j = 0; j < AUCTION_TAGS.length; j++) {
          if (mtags.indexOf(AUCTION_TAGS[j]) !== -1) return String(meta.id);
        }
      }

      if (window.location.pathname.indexOf('/products/') !== -1) {
        var scripts = document.querySelectorAll('script[type="application/json"]');
        for (var k = 0; k < scripts.length; k++) {
          try {
            var data = JSON.parse(scripts[k].textContent);
            if (data.product && data.product.id) {
              var ptags = data.product.tags || [];
              if (typeof ptags === 'string') ptags = ptags.split(',').map(function(t){ return t.trim(); });
              for (var l = 0; l < AUCTION_TAGS.length; l++) {
                if (ptags.indexOf(AUCTION_TAGS[l]) !== -1) return String(data.product.id);
              }
            }
          } catch(e) {}
        }
      }
    } catch(e) {}
    return null;
  }

  function chargerEnchere(produitId, callback) {
    fetch(API_BASE + '/encheres/publique/' + produitId)
      .then(function(res) {
        if (!res.ok) throw new Error('Pas d\'enchere active');
        return res.json();
      })
      .then(function(data) { callback(null, data); })
      .catch(function(err) { callback(err, null); });
  }

  function chargerConfig(callback) {
    fetch(API_BASE + '/admin/encheres/vendeur-config')
      .then(function(res) { return res.json(); })
      .then(function(data) { callback(null, data); })
      .catch(function() {
        callback(null, {
          selected_layout: 'Layout 1',
          display_current_bid: true,
          display_bid_count: true,
          display_highest_bidder: true,
          show_reserved_price: false,
          show_min_bid_amount: true,
          inform_bidders: true,
          display_seconds: true,
          autofill_min_bid: true,
          currency: 'CAD'
        });
      });
  }

  function chargerMises(encId, callback) {
    fetch(API_BASE + '/encheres/' + encId + '/mises')
      .then(function(res) { return res.json(); })
      .then(function(data) { callback(null, data); })
      .catch(function() { callback(null, []); });
  }

  function formatTimer(dateFin, avecSecondes) {
    var diff = Math.max(0, new Date(dateFin).getTime() - Date.now());
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    var pad = function(n) { return String(n).padStart(2, '0'); };
    return { d: pad(d), h: pad(h), m: pad(m), s: pad(s), fini: diff <= 0 };
  }

  function formatMontant(montant, devise) {
    return parseFloat(montant || 0).toFixed(2).replace('.', ',') + ' ' + (devise || 'CAD') + ' $';
  }

  function getMiseMin(enchere) {
    var base = parseFloat(enchere.mise_courante || enchere.prix_base || 0);
    var incr = parseFloat(enchere.increment_min || 1);
    return base > 0 ? (base + incr) : parseFloat(enchere.prix_base || 0);
  }

  function injecterCSS() {
    if (document.getElementById('evend-widget-css')) return;
    var css = document.createElement('style');
    css.id = 'evend-widget-css';
    css.textContent = [
      '#evend-widget{margin:16px 0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
      '#evend-widget *{box-sizing:border-box}',
      '.evend-timer{display:flex;gap:4px;align-items:flex-end}',
      '.evend-td{display:inline-flex;flex-direction:column;align-items:center;min-width:32px}',
      '.evend-td .n{font-size:20px;font-weight:800;line-height:1}',
      '.evend-td .u{font-size:9px;text-transform:uppercase;letter-spacing:.06em;opacity:.6;margin-top:2px}',
      '.evend-tsep{font-size:18px;font-weight:300;opacity:.35;margin:0 2px;padding-bottom:5px}',
      '.evend-bdr{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;margin:8px 0}',
      '.evend-av{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex-shrink:0}',
      '.evend-btn{display:block;width:100%;padding:13px;margin-top:10px;border:none;border-radius:10px;font-size:15px;font-weight:800;cursor:pointer;transition:filter .15s;letter-spacing:.02em}',
      '.evend-btn:hover{filter:brightness(.88)}',
      '.evend-btn:disabled{opacity:.5;cursor:not-allowed}',
      '.evend-input{width:100%;border-radius:8px;padding:10px 14px;font-size:14px;font-weight:500;margin-top:10px;outline:none}',
      '.evend-msg{text-align:center;font-size:12px;margin-top:8px;padding:6px 10px;border-radius:6px}',
      '.evend-msg.ok{background:#f0fdf4;color:#166534}',
      '.evend-msg.err{background:#fef2f2;color:#dc2626}',
      '.evend-upcom{display:flex;align-items:center;gap:8px;padding:10px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;font-size:13px;color:#1e40af;margin:8px 0}',
      '.ev-l1{background:#fff;border:1.5px solid #e5e7eb;border-radius:12px;padding:18px}',
      '.ev-l1 .evend-td .n{color:#111827}',
      '.ev-l1 .ev-divl{height:1px;background:#f3f4f6;margin:10px 0}',
      '.ev-l1 .ev-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0}',
      '.ev-l1 .ev-k{font-size:12px;color:#6b7280}',
      '.ev-l1 .ev-v{font-size:14px;font-weight:700;color:#111827}',
      '.ev-l1 .ev-badge{background:#f0fdf4;color:#166534;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;margin-left:6px}',
      '.ev-l1 .evend-bdr{background:#f9fafb;border:1px solid #e5e7eb}',
      '.ev-l1 .evend-av{background:#e5e7eb;color:#374151}',
      '.ev-l1 .evend-input{border:1.5px solid #d1d5db;background:#f9fafb;color:#111827}',
      '.ev-l1 .evend-btn{background:#111827;color:#fff}',
      '.ev-l2{background:#fff;border-radius:16px;overflow:hidden;border:1px solid #ccfbf1}',
      '.ev-l2 .ev-hd{background:#0d9488;padding:16px 18px;color:#fff}',
      '.ev-l2 .ev-ey{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.75;margin-bottom:4px}',
      '.ev-l2 .ev-am{font-size:26px;font-weight:900;letter-spacing:-.5px}',
      '.ev-l2 .ev-bs{font-size:11px;opacity:.75;margin-top:3px}',
      '.ev-l2 .ev-bd{padding:16px 18px}',
      '.ev-l2 .ev-ts{display:flex;justify-content:center;gap:2px;background:#f0fdfa;border-radius:10px;padding:10px;margin-bottom:12px}',
      '.ev-l2 .ev-ts .evend-td .n{color:#0f766e;font-weight:900}',
      '.ev-l2 .ev-ts .evend-tsep{color:#5eead4}',
      '.ev-l2 .ev-ir{display:flex;justify-content:space-between;font-size:11px;color:#6b7280;margin-bottom:10px}',
      '.ev-l2 .ev-ir strong{color:#0f766e;font-weight:700}',
      '.ev-l2 .evend-bdr{background:#f0fdfa;border:1px solid #99f6e4}',
      '.ev-l2 .evend-av{background:#99f6e4;color:#0f766e}',
      '.ev-l2 .ev-bl{font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#0d9488;margin-bottom:1px}',
      '.ev-l2 .ev-bn{font-size:12px;font-weight:700;color:#0f766e}',
      '.ev-l2 .evend-input{border:2px solid #d1fae5;background:#f0fdfa;color:#134e4a}',
      '.ev-l2 .evend-btn{background:#0d9488;color:#fff}',
      '.ev-l3{background:#18181b;border-radius:18px;overflow:hidden;border:1px solid #27272a}',
      '.ev-l3 .ev-tb{background:#27272a;padding:10px 18px;display:flex;justify-content:space-between;align-items:center}',
      '.ev-l3 .ev-lv{display:flex;align-items:center;gap:6px;font-size:11px;color:#a1a1aa;font-weight:700}',
      '.ev-l3 .ev-ldot{width:7px;height:7px;border-radius:50%;background:#22c55e}',
      '.ev-l3 .ev-el{font-size:11px;color:#52525b}',
      '.ev-l3 .ev-bd{padding:18px}',
      '.ev-l3 .ev-ml{font-size:10px;color:#71717a;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px}',
      '.ev-l3 .ev-ma{font-size:36px;font-weight:900;color:#fff;letter-spacing:-1.5px;line-height:1}',
      '.ev-l3 .ev-mc{font-size:11px;color:#71717a;margin-top:4px;margin-bottom:16px}',
      '.ev-l3 .ev-trow{display:flex;gap:6px;margin-bottom:16px}',
      '.ev-l3 .ev-tbl{flex:1;background:#27272a;border-radius:10px;padding:10px 4px;text-align:center}',
      '.ev-l3 .ev-tbl .n{font-size:20px;font-weight:900;color:#fff}',
      '.ev-l3 .ev-tbl .u{font-size:8px;color:#71717a;text-transform:uppercase;letter-spacing:.06em;margin-top:2px}',
      '.ev-l3 .ev-res-row{font-size:11px;color:#a1a1aa;display:flex;justify-content:space-between;margin-bottom:8px}',
      '.ev-l3 .evend-bdr{background:#27272a;border:1px solid #3f3f46}',
      '.ev-l3 .evend-av{background:#3f3f46;color:#a1a1aa}',
      '.ev-l3 .ev-bl{font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#71717a;margin-bottom:1px}',
      '.ev-l3 .ev-bn{font-size:12px;font-weight:700;color:#e4e4e7}',
      '.ev-l3 .evend-input{background:#27272a;border:1.5px solid #3f3f46;color:#fff}',
      '.ev-l3 .evend-input::placeholder{color:#52525b}',
      '.ev-l3 .evend-btn{background:#7c3aed;color:#fff}',
      '.ev-l4{background:#fefce8;border:1.5px solid #fde047;border-radius:20px;overflow:hidden}',
      '.ev-l4 .ev-hd{background:#78350f;padding:18px 20px}',
      '.ev-l4 .ev-ey{font-size:10px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:#fde68a;margin-bottom:6px}',
      '.ev-l4 .ev-am{font-size:32px;font-weight:900;color:#fef3c7;letter-spacing:-1px}',
      '.ev-l4 .ev-bs{font-size:11px;color:#fde68a;margin-top:4px}',
      '.ev-l4 .ev-bd{padding:16px 20px}',
      '.ev-l4 .ev-ts{display:flex;justify-content:center;gap:8px;background:#fffbeb;border:1.5px solid #fde047;border-radius:12px;padding:10px;margin-bottom:14px}',
      '.ev-l4 .ev-ts .evend-td .n{color:#92400e;font-size:22px}',
      '.ev-l4 .ev-ts .evend-td .u{color:#d97706}',
      '.ev-l4 .ev-ts .evend-tsep{color:#fbbf24;font-size:20px}',
      '.ev-l4 .ev-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}',
      '.ev-l4 .ev-mi{background:#fffbeb;border:1px solid #fde047;border-radius:10px;padding:9px 12px}',
      '.ev-l4 .ev-mk{font-size:10px;color:#92400e;font-weight:700;text-transform:uppercase;letter-spacing:.06em}',
      '.ev-l4 .ev-mv{font-size:14px;color:#78350f;font-weight:800;margin-top:2px}',
      '.ev-l4 .evend-bdr{background:#fffbeb;border:1.5px solid #fde047}',
      '.ev-l4 .evend-av{background:#fde68a;color:#78350f}',
      '.ev-l4 .ev-bl{font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#92400e;margin-bottom:1px}',
      '.ev-l4 .ev-bn{font-size:12px;font-weight:700;color:#78350f}',
      '.ev-l4 .evend-input{background:#fff;border:2px solid #d97706;color:#78350f}',
      '.ev-l4 .evend-btn{background:#78350f;color:#fef3c7;border-radius:12px;font-weight:900}',
      '.ev-l5{background:#0a0a0f;border-radius:20px;overflow:hidden;border:1px solid #1e1b4b}',
      '.ev-l5 .ev-gb{height:3px;background:linear-gradient(90deg,#818cf8,#c084fc,#f472b6)}',
      '.ev-l5 .ev-bd{padding:20px}',
      '.ev-l5 .ev-lr{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}',
      '.ev-l5 .ev-lp{display:flex;align-items:center;gap:6px;background:#1e1b4b;border-radius:20px;padding:4px 10px;font-size:11px;color:#a5b4fc;font-weight:800}',
      '.ev-l5 .ev-ldot{width:6px;height:6px;border-radius:50%;background:#818cf8}',
      '.ev-l5 .ev-el{font-size:11px;color:#4b5563}',
      '.ev-l5 .ev-bdd{text-align:center;margin-bottom:16px}',
      '.ev-l5 .ev-bl2{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px}',
      '.ev-l5 .ev-amw{font-size:44px;font-weight:900;color:#fff;letter-spacing:-2px;line-height:1}',
      '.ev-l5 .ev-amw sup{font-size:20px;color:#818cf8;font-weight:700;vertical-align:super}',
      '.ev-l5 .ev-bc{font-size:11px;color:#6366f1;margin-top:4px}',
      '.ev-l5 .ev-trow{display:flex;gap:5px;margin-bottom:14px}',
      '.ev-l5 .ev-tbl{flex:1;background:#13131f;border:1px solid #312e81;border-radius:10px;padding:10px 4px;text-align:center}',
      '.ev-l5 .ev-tbl .n{font-size:20px;font-weight:900;color:#a5b4fc}',
      '.ev-l5 .ev-tbl .u{font-size:8px;color:#4f46e5;text-transform:uppercase;letter-spacing:.08em;margin-top:2px}',
      '.ev-l5 .ev-info-row{display:flex;gap:8px;margin-bottom:12px}',
      '.ev-l5 .ev-info-box{flex:1;background:#13131f;border:1px solid #312e81;border-radius:9px;padding:8px 10px}',
      '.ev-l5 .ev-ik{font-size:9px;color:#6366f1;text-transform:uppercase;letter-spacing:.08em}',
      '.ev-l5 .ev-iv{font-size:13px;font-weight:800;color:#a5b4fc}',
      '.ev-l5 .evend-bdr{background:#13131f;border:1px solid #312e81}',
      '.ev-l5 .evend-av{background:#1e1b4b;color:#a5b4fc}',
      '.ev-l5 .ev-bl{font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#6366f1;margin-bottom:1px}',
      '.ev-l5 .ev-bn{font-size:12px;font-weight:700;color:#c7d2fe}',
      '.ev-l5 .evend-input{background:#13131f;border:1.5px solid #312e81;color:#fff;font-size:15px;font-weight:600}',
      '.ev-l5 .evend-input::placeholder{color:#374151}',
      '.ev-l5 .evend-btn{background:#4f46e5;color:#fff;border-radius:12px;letter-spacing:.06em}',
      '.ev-l5 .ev-mn{text-align:center;font-size:10px;color:#4b5563;margin-top:8px}',
      '.evend-price-alert-btn{display:block;width:100%;padding:12px 20px;margin-top:10px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:transform 0.2s,filter 0.15s;text-align:center}',
      '.evend-price-alert-btn:hover{transform:scale(1.02);filter:brightness(0.95)}',
      '.price-alert-button:not(#evend-price-alert-btn){display:none !important}'
    ].join('');
    document.head.appendChild(css);
  }

  function buildWidget(enchere, config, mises) {
    var layout = (config.selected_layout || 'Layout 1').replace('Layout ', '').trim();
    var devise = config.currency || 'CAD';
    var miseMin = getMiseMin(enchere);
    var miseCourante = parseFloat(enchere.mise_courante || 0);
    var topBidder = mises && mises.length > 0 ? mises[0] : null;
    var initiales = topBidder && topBidder.acheteur_nom
      ? topBidder.acheteur_nom.split(' ').map(function(w){return w[0];}).join('').toUpperCase().slice(0,2)
      : 'MC';
    var nomBidder = topBidder && topBidder.acheteur_nom
      ? topBidder.acheteur_nom.split(' ')[0] + ' ' + (topBidder.acheteur_nom.split(' ')[1]||'')[0] + '.'
      : '--';
    var reserveMsg = config.inform_bidders
      ? (enchere.reserve_atteinte ? ' · Reserve atteinte' : ' · Reserve non atteinte')
      : '';

    var timerHtml = buildTimerHtml(layout, enchere.date_fin, config.display_seconds);
    var bidderHtml = config.display_highest_bidder && topBidder ? buildBidderHtml(layout, initiales, nomBidder, topBidder.montant, devise) : '';

    switch(layout) {
      case '1': return buildL1(enchere, config, devise, miseMin, miseCourante, timerHtml, bidderHtml, reserveMsg);
      case '2': return buildL2(enchere, config, devise, miseMin, miseCourante, timerHtml, bidderHtml, reserveMsg);
      case '3': return buildL3(enchere, config, devise, miseMin, miseCourante, timerHtml, bidderHtml, reserveMsg);
      case '4': return buildL4(enchere, config, devise, miseMin, miseCourante, timerHtml, bidderHtml, reserveMsg);
      case '5': return buildL5(enchere, config, devise, miseMin, miseCourante, timerHtml, bidderHtml, reserveMsg);
      default:  return buildL1(enchere, config, devise, miseMin, miseCourante, timerHtml, bidderHtml, reserveMsg);
    }
  }

  function timerBloc(d, h, m, s, avecSecondes, sep) {
    sep = sep || '<span class="evend-tsep">:</span>';
    var html = '<div class="evend-td"><span class="n" data-timer="d">' + d + '</span><span class="u">j</span></div>' + sep +
               '<div class="evend-td"><span class="n" data-timer="h">' + h + '</span><span class="u">h</span></div>' + sep +
               '<div class="evend-td"><span class="n" data-timer="m">' + m + '</span><span class="u">m</span></div>';
    if (avecSecondes) {
      html += sep + '<div class="evend-td"><span class="n" data-timer="s">' + s + '</span><span class="u">s</span></div>';
    }
    return html;
  }

  function buildTimerHtml(layout, dateFin, avecSecondes) {
    var t = formatTimer(dateFin, avecSecondes);
    return timerBloc(t.d, t.h, t.m, t.s, avecSecondes);
  }

  function buildBidderHtml(layout, initiales, nom, montant, devise) {
    return '<div class="evend-bdr" id="evend-bidder-row">' +
      '<div class="evend-av">' + initiales + '</div>' +
      '<div style="flex:1"><div class="ev-bl">Plus haut encherisseur</div><div class="ev-bn">' + nom + '</div></div>' +
      '<span style="font-size:13px;font-weight:800">' + formatMontant(montant, devise) + '</span>' +
    '</div>';
  }

  function inputHtml(miseMin, autofill, devise) {
    var val = autofill ? miseMin.toFixed(2) : '';
    var placeholder = 'Min. ' + miseMin.toFixed(2).replace('.', ',') + ' ' + devise + ' $';
    return '<input type="number" class="evend-input" id="evend-input" step="0.01" min="' + miseMin.toFixed(2) + '" value="' + val + '" placeholder="' + placeholder + '">';
  }

  function btnHtml(texte) {
    return '<button class="evend-btn" id="evend-btn-miser">' + texte + '</button>' +
           '<div class="evend-msg" id="evend-msg" style="display:none"></div>';
  }

  function buildL1(e, c, devise, miseMin, miseCourante, timerHtml, bidderHtml, reserveMsg) {
    var rows = '';
    if (c.display_current_bid) rows += '<div class="ev-row"><span class="ev-k">Mise courante</span><span class="ev-v">' + formatMontant(miseCourante||e.prix_base, devise) + (c.display_bid_count ? ' <span class="ev-badge">' + (e.nb_mises||0) + ' mises</span>' : '') + '</span></div>';
    if (c.show_reserved_price && e.prix_reserve) rows += '<div class="ev-row"><span class="ev-k">Prix de reserve</span><span class="ev-v">' + formatMontant(e.prix_reserve, devise) + '</span></div>';
    if (c.show_min_bid_amount) rows += '<div class="ev-row"><span class="ev-k">Increment min.</span><span class="ev-v">' + formatMontant(e.increment_min, devise) + '</span></div>';
    if (c.inform_bidders) rows += '<div style="font-size:10px;color:' + (e.reserve_atteinte ? '#16a34a' : '#dc2626') + ';padding:3px 0">' + (e.reserve_atteinte ? 'Reserve atteinte' : 'Reserve non atteinte') + '</div>';
    return '<div class="ev-l1">' +
      '<div style="font-size:10px;color:#9ca3af;margin-bottom:8px">Fin : <span id="evend-edate">' + new Date(e.date_fin).toLocaleDateString('fr-CA', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) + '</span></div>' +
      '<div class="evend-timer" style="padding:4px 0 10px">' + timerHtml + '</div>' +
      '<div class="ev-divl"></div>' + rows + bidderHtml +
      inputHtml(miseMin, c.autofill_min_bid, devise) + btnHtml('Placer ma mise') + '</div>';
  }

  function buildL2(e, c, devise, miseMin, miseCourante, timerHtml, bidderHtml, reserveMsg) {
    var bsText = (c.display_bid_count ? (e.nb_mises||0) + ' mises' : '') + (c.inform_bidders ? (e.nb_mises && c.display_bid_count ? ' · ' : '') + (e.reserve_atteinte ? 'Reserve atteinte' : 'Reserve non atteinte') : '');
    var irHtml = '';
    if (c.show_reserved_price && e.prix_reserve) irHtml += '<span>Reserve : <strong>' + formatMontant(e.prix_reserve, devise) + '</strong></span>';
    if (c.show_min_bid_amount) irHtml += '<span>Min. : <strong>' + formatMontant(miseMin, devise) + '</strong></span>';
    return '<div class="ev-l2">' +
      '<div class="ev-hd"><div class="ev-ey">Mise courante</div><div class="ev-am" id="evend-cur-amt">' + formatMontant(miseCourante||e.prix_base, devise) + '</div>' +
      (bsText ? '<div class="ev-bs">' + bsText + '</div>' : '') + '</div>' +
      '<div class="ev-bd"><div class="ev-ts evend-timer">' + timerHtml + '</div>' +
      (irHtml ? '<div class="ev-ir">' + irHtml + '</div>' : '') +
      bidderHtml + inputHtml(miseMin, c.autofill_min_bid, devise) + btnHtml('Placer ma mise →') + '</div></div>';
  }

  function buildL3(e, c, devise, miseMin, miseCourante, timerHtml, bidderHtml, reserveMsg) {
    var mcText = (c.display_bid_count ? e.nb_mises + ' encherisseurs' : '') + (c.show_min_bid_amount ? ' · min. ' + miseMin.toFixed(2) + ' $' : '') + (c.inform_bidders ? ' · ' + (e.reserve_atteinte ? 'Reserve atteinte' : 'Reserve non atteinte') : '');
    var resHtml = (c.show_reserved_price && e.prix_reserve) ? '<div class="ev-res-row"><span>Reserve :</span><span style="color:#fff;font-weight:700">' + formatMontant(e.prix_reserve, devise) + '</span></div>' : '';
    return '<div class="ev-l3">' +
      '<div class="ev-tb"><div class="ev-lv"><div class="ev-ldot"></div>En direct</div>' +
      '<div class="ev-el">Fin <span id="evend-edate">' + new Date(e.date_fin).toLocaleDateString('fr-CA',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) + '</span></div></div>' +
      '<div class="ev-bd"><div class="ev-ml">Mise courante</div>' +
      '<div class="ev-ma" id="evend-cur-amt">' + (miseCourante||e.prix_base).toFixed(2).replace('.', ',') + ' <span style="font-size:18px;color:#a1a1aa;font-weight:400">$</span></div>' +
      (mcText ? '<div class="ev-mc">' + mcText + '</div>' : '') +
      '<div class="ev-trow evend-timer">' + timerHtml.replace(/class="evend-td"/g,'class="evend-td"').replace(/<span class="evend-tsep">/g,'') + buildL3Timer(e.date_fin, c.display_seconds) + '</div>' +
      resHtml + bidderHtml +
      inputHtml(miseMin, c.autofill_min_bid, devise) + btnHtml('Encherir maintenant') + '</div></div>';
  }

  function buildL3Timer(dateFin, avecSecondes) {
    var t = formatTimer(dateFin, avecSecondes);
    var items = [['d','j',t.d],['h','h',t.h],['m','m',t.m]];
    if (avecSecondes) items.push(['s','s',t.s]);
    return items.map(function(item) {
      return '<div class="ev-tbl"><div class="n" data-timer="' + item[0] + '">' + item[2] + '</div><div class="u">' + item[1] + '</div></div>';
    }).join('');
  }

  function buildL4(e, c, devise, miseMin, miseCourante, timerHtml, bidderHtml, reserveMsg) {
    var bsText = (c.display_bid_count ? (e.nb_mises||0) + ' mises' : '') + (c.inform_bidders ? (c.display_bid_count ? ' · ' : '') + (e.reserve_atteinte ? 'Reserve atteinte' : 'Reserve non atteinte') : '');
    var metaHtml = '';
    if (c.show_reserved_price && e.prix_reserve) metaHtml += '<div class="ev-mi"><div class="ev-mk">Reserve</div><div class="ev-mv">' + formatMontant(e.prix_reserve, devise) + '</div></div>';
    if (c.show_min_bid_amount) metaHtml += '<div class="ev-mi"><div class="ev-mk">Increment min.</div><div class="ev-mv">' + formatMontant(e.increment_min, devise) + '</div></div>';
    return '<div class="ev-l4">' +
      '<div class="ev-hd"><div class="ev-ey">Vente aux encheres</div><div class="ev-am" id="evend-cur-amt">' + formatMontant(miseCourante||e.prix_base, devise) + '</div>' +
      (bsText ? '<div class="ev-bs">' + bsText + '</div>' : '') + '</div>' +
      '<div class="ev-bd"><div class="ev-ts evend-timer">' + timerHtml + '</div>' +
      (metaHtml ? '<div class="ev-meta">' + metaHtml + '</div>' : '') +
      bidderHtml + inputHtml(miseMin, c.autofill_min_bid, devise) + btnHtml('Soumettre mon offre') + '</div></div>';
  }

  function buildL5(e, c, devise, miseMin, miseCourante, timerHtml, bidderHtml, reserveMsg) {
    var t = formatTimer(e.date_fin, c.display_seconds);
    var items = [['d','j',t.d],['h','h',t.h],['m','m',t.m]];
    if (c.display_seconds) items.push(['s','s',t.s]);
    var tblHtml = items.map(function(it){ return '<div class="ev-tbl"><div class="n" data-timer="'+it[0]+'">'+it[2]+'</div><div class="u">'+it[1]+'</div></div>'; }).join('');
    var infoHtml = '';
    if (c.show_reserved_price && e.prix_reserve) infoHtml += '<div class="ev-info-box"><div class="ev-ik">Reserve</div><div class="ev-iv">' + formatMontant(e.prix_reserve, devise) + '</div></div>';
    if (c.show_min_bid_amount) infoHtml += '<div class="ev-info-box"><div class="ev-ik">Increment min.</div><div class="ev-iv">' + formatMontant(e.increment_min, devise) + '</div></div>';
    return '<div class="ev-l5"><div class="ev-gb"></div><div class="ev-bd">' +
      '<div class="ev-lr"><div class="ev-lp"><div class="ev-ldot"></div>LIVE</div><span class="ev-el">Fin dans <span id="evend-edate">' + t.d + 'j ' + t.h + 'h ' + t.m + 'm</span></span></div>' +
      (c.display_current_bid ? '<div class="ev-bdd"><div class="ev-bl2">Mise courante</div><div class="ev-amw"><sup>$</sup><span id="evend-cur-amt">' + (miseCourante||e.prix_base).toFixed(2).replace('.', ',') + '</span></div>' + (c.display_bid_count ? '<div class="ev-bc">' + (e.nb_mises||0) + ' encherisseurs actifs</div>' : '') + '</div>' : '') +
      '<div class="ev-trow">' + tblHtml + '</div>' +
      (infoHtml ? '<div class="ev-info-row">' + infoHtml + '</div>' : '') +
      bidderHtml + inputHtml(miseMin, c.autofill_min_bid, devise) + btnHtml('ENCHERIR MAINTENANT') +
      (c.show_min_bid_amount ? '<div class="ev-mn">Mise minimum : ' + formatMontant(miseMin, devise) + '</div>' : '') +
      '</div></div>';
  }

  function demarrerTimer(dateFin, avecSecondes) {
    var widget = document.getElementById('evend-widget');
    if (!widget) return;
    var layout = widget.getAttribute('data-layout');
    var isL3orL5 = layout === '3' || layout === '5';

    setInterval(function() {
      var t = formatTimer(dateFin, avecSecondes);
      if (isL3orL5) {
        var els = {d: widget.querySelectorAll('[data-timer="d"]'), h: widget.querySelectorAll('[data-timer="h"]'), m: widget.querySelectorAll('[data-timer="m"]'), s: widget.querySelectorAll('[data-timer="s"]')};
        ['d','h','m','s'].forEach(function(k){ els[k].forEach(function(el){ el.textContent = t[k]; }); });
      } else {
        widget.querySelectorAll('[data-timer="d"]').forEach(function(el){ el.textContent = t.d; });
        widget.querySelectorAll('[data-timer="h"]').forEach(function(el){ el.textContent = t.h; });
        widget.querySelectorAll('[data-timer="m"]').forEach(function(el){ el.textContent = t.m; });
        widget.querySelectorAll('[data-timer="s"]').forEach(function(el){ el.textContent = t.s; });
      }
      var edateEl5 = widget.querySelector('#evend-edate');
      if (edateEl5 && (layout === '5')) edateEl5.textContent = t.d + 'j ' + t.h + 'h ' + t.m + 'm';
      if (t.fini) {
        var btn = document.getElementById('evend-btn-miser');
        if (btn) { btn.disabled = true; btn.textContent = 'Enchere terminee'; }
      }
    }, 1000);
  }

  function configurerBoutonMise(enchereData, config) {
    var btn = document.getElementById('evend-btn-miser');
    var input = document.getElementById('evend-input');
    var msgEl = document.getElementById('evend-msg');
    if (!btn || !input) return;

    btn.addEventListener('click', function() {
      var montant = parseFloat(input.value);
      var miseMin = getMiseMin(enchereData);
      if (!montant || montant < miseMin) {
        msgEl.textContent = 'Mise minimum : ' + formatMontant(miseMin, config.currency||'CAD');
        msgEl.className = 'evend-msg err';
        msgEl.style.display = 'block';
        return;
      }

      var customer = (window.evendCustomer && window.evendCustomer.id && window.evendCustomer.id !== '')
        ? window.evendCustomer
        : null;
      if (!customer) {
        msgEl.textContent = 'Vous devez etre connecte pour encherir.';
        msgEl.className = 'evend-msg err';
        msgEl.style.display = 'block';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Envoi...';
      msgEl.style.display = 'none';

      fetch(API_BASE + '/encheres/' + enchereData.id + '/mises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acheteur_id:    String(customer.id),
          acheteur_email: customer.email,
          acheteur_nom:   customer.nom || '',
          montant:        montant,
        })
      })
      .then(function(res) { return res.json().then(function(d){ return {ok:res.ok, data:d}; }); })
      .then(function(r) {
        if (!r.ok) throw new Error(r.data.error || 'Erreur lors de la mise');
        var d = r.data;
        msgEl.textContent = 'Votre mise de ' + formatMontant(d.mise.montant, config.currency) + ' a ete enregistree!';
        msgEl.className = 'evend-msg ok';
        msgEl.style.display = 'block';
        var curEl = document.getElementById('evend-cur-amt');
        if (curEl) curEl.textContent = formatMontant(d.mise_courante, config.currency);
        btn.disabled = false;
        btn.textContent = btn.textContent.includes('ENCHERIR') ? 'ENCHERIR MAINTENANT' : btn.textContent.includes('offre') ? 'Soumettre mon offre' : btn.textContent.includes('→') ? 'Placer ma mise →' : 'Placer ma mise';
        setTimeout(function(){ rafraichir(enchereData.produit_id || enchereData.id, config); }, 2000);
      })
      .catch(function(err) {
        msgEl.textContent = err.message;
        msgEl.className = 'evend-msg err';
        msgEl.style.display = 'block';
        btn.disabled = false;
      });
    });
  }

  function rafraichir(produitId, config) {
    chargerEnchere(produitId, function(err, enchere) {
      if (err || !enchere) return;
      var curEl = document.getElementById('evend-cur-amt');
      if (curEl) curEl.textContent = formatMontant(enchere.mise_courante || enchere.prix_base, config.currency);
      chargerMises(enchere.id, function(err2, mises) {
        if (!err2 && mises && mises.length > 0 && config.display_highest_bidder) {
          var top = mises[0];
          var nom = top.acheteur_nom ? top.acheteur_nom.split(' ')[0] + ' ' + (top.acheteur_nom.split(' ')[1]||'')[0] + '.' : '--';
          var bdrEl = document.getElementById('evend-bidder-row');
          if (bdrEl) {
            var bnEl = bdrEl.querySelector('.ev-bn');
            if (bnEl) bnEl.textContent = nom;
            var amtEl = bdrEl.querySelector('span[style]');
            if (amtEl) amtEl.textContent = formatMontant(top.montant, config.currency);
          }
        }
      });
    });
  }

  function trouverPointInjection() {
    var selecteurs = [
      '[data-product-form]',
      '.product-form',
      '.product__form',
      '#product-form-' ,
      '.product-form__submit',
      '[name="add"]',
      'form[action*="/cart/add"]',
      '.shopify-payment-button',
      '.product__info-container',
      '.product-single__meta',
      '#product-description',
    ];
    for (var i = 0; i < selecteurs.length; i++) {
      var el = document.querySelector(selecteurs[i]);
      if (el) return el;
    }
    return null;
  }

  // =====================================================
  // BOUTON ALERTE PRIX
  // =====================================================

  function isPriceDropEnabled() {
    return fetch(API_BASE + '/wishlist/config')
      .then(function(res) { return res.json(); })
      .then(function(data) { return data && data.priceDropAlert && data.priceDropAlert.enabled === true; })
      .catch(function() { return false; });
  }

  function getPriceAlertConfig() {
    return fetch(API_BASE + '/wishlist/config')
      .then(function(res) { return res.json(); })
      .then(function(data) { return (data && data.priceDropAlert) || {}; })
      .catch(function() { return {}; });
  }

  // VERSION CORRIGÉE AVEC TOUS LES STYLES
  function createPriceAlertButton(config) {
    var button = document.createElement('button');
    button.className = 'evend-price-alert-btn';
    button.textContent = (config && config.texteBouton) || '💰 Alerte de baisse de prix';
    button.id = 'evend-price-alert-btn';
    
    // Couleurs
    button.style.backgroundColor = (config && config.couleurFondBouton) || '#2d6a9f';
    button.style.color = (config && config.couleurTexteBouton) || '#ffffff';
    
    // Marges
    button.style.marginTop = (config && config.marginTop !== undefined) ? config.marginTop + 'px' : '10px';
    button.style.marginBottom = (config && config.marginBottom !== undefined) ? config.marginBottom + 'px' : '10px';
    button.style.marginLeft = (config && config.marginLeft !== undefined) ? config.marginLeft + 'px' : '0px';
    button.style.marginRight = (config && config.marginRight !== undefined) ? config.marginRight + 'px' : '0px';
    
    // Bordures et arrondis
    var borderRadius = (config && config.borderRadius !== undefined) ? config.borderRadius : 8;
    var borderWidth = (config && config.borderWidth !== undefined) ? config.borderWidth : 0;
    var borderColor = (config && config.borderColor) || '#000000';
    
    button.style.borderRadius = borderRadius + 'px';
    
    if (borderWidth > 0) {
      button.style.border = borderWidth + 'px solid ' + borderColor;
    } else {
      button.style.border = 'none';
    }
    
    // Police
    button.style.fontSize = (config && config.fontSize !== undefined) ? config.fontSize + 'px' : '14px';
    button.style.fontWeight = (config && config.fontWeight) || '600';
    
    button.style.padding = '12px 20px';
    button.style.cursor = 'pointer';
    button.style.width = '100%';
    button.style.transition = 'transform 0.2s, filter 0.15s';
    
    button.onmouseenter = function() { button.style.transform = 'scale(1.02)'; };
    button.onmouseleave = function() { button.style.transform = 'scale(1)'; };
    
    return button;
  }

  // Charger le modal si non disponible
  function loadModalAndOpen() {
    if (typeof window.showPriceAlertModal === 'function') {
      window.showPriceAlertModal();
      return;
    }
    
    console.log('📥 Chargement du modal...');
    var script = document.createElement('script');
    script.src = 'https://evend-multivendeur-api.onrender.com/js/price-drop-modal.js';
    script.onload = function() {
      console.log('✅ Modal chargé');
      setTimeout(function() {
        if (typeof window.showPriceAlertModal === 'function') {
          window.showPriceAlertModal();
        } else {
          alert('Erreur: fonctionnalité temporairement indisponible');
        }
      }, 200);
    };
    script.onerror = function() {
      console.log('❌ Erreur chargement modal');
      alert('Impossible de charger la fonctionnalité');
    };
    document.head.appendChild(script);
  }

  function setupPriceAlertButton() {
    var button = document.getElementById('evend-price-alert-btn');
    if (!button) return;
    
    var newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    newButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('🖱️ Clic sur alerte prix');
      loadModalAndOpen();
    });
  }

  function injectPriceAlertButton() {
    var isProductPage = document.querySelector('form[action="/cart/add"]') !== null;
    if (!isProductPage) return;
    if (document.getElementById('evend-price-alert-btn')) return;
    
    isPriceDropEnabled().then(function(enabled) {
      if (!enabled) return;
      
      getPriceAlertConfig().then(function(config) {
        var button = createPriceAlertButton(config);
        var position = config.positionDesktop || 'apresPrix';
        var cartButton = document.querySelector('form[action="/cart/add"]');
        var priceElement = document.querySelector('.price, [data-price], .product__price, .product-single__price');
        
        switch(position) {
          case 'avantPanier':
            if (cartButton && cartButton.parentNode) {
              cartButton.parentNode.insertBefore(button, cartButton);
            } else if (priceElement && priceElement.parentNode) {
              priceElement.insertAdjacentElement('afterend', button);
            }
            break;
          case 'apresPrix':
          default:
            if (priceElement && priceElement.parentNode) {
              priceElement.insertAdjacentElement('afterend', button);
            } else if (cartButton && cartButton.parentNode) {
              cartButton.parentNode.insertBefore(button, cartButton);
            }
            break;
        }
        
        setupPriceAlertButton();
        console.log('✅ Bouton alerte prix injecté (position: ' + position + ')');
      });
    });
  }

  // ── 12. Point d'entree principal ──────────────────────────────────────────
  function init() {
    injecterCSS();
    injectPriceAlertButton();
    
    var produitId = getProduitId();
    if (!produitId) return;

    chargerConfig(function(errCfg, config) {
      chargerEnchere(produitId, function(errEnc, enchere) {
        if (errEnc || !enchere) return;

        chargerMises(enchere.id, function(errMises, mises) {
          var html = buildWidget(enchere, config, mises || []);
          var layout = (config.selected_layout || 'Layout 1').replace('Layout ', '').trim();

          var container = document.createElement('div');
          container.id = 'evend-widget';
          container.setAttribute('data-layout', layout);
          container.innerHTML = html;

          var point = trouverPointInjection();
          if (point) {
            point.parentNode.insertBefore(container, point);
          } else {
            document.body.appendChild(container);
          }

          var addToCartBtns = document.querySelectorAll('[name="add"], .product-form__submit, .btn--add-to-cart');
          addToCartBtns.forEach(function(btn) { btn.style.display = 'none'; });

          demarrerTimer(enchere.date_fin, config.display_seconds !== false);
          configurerBoutonMise(enchere, config);

          pollTimer = setInterval(function() {
            rafraichir(produitId, config);
          }, POLL_INTERVAL);
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();