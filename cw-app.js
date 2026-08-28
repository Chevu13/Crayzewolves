/* ==========================================================================
   CRAZYWOLVES — APPLICATION
   Route table, page-level behaviour, form validation, boot sequence.
   ========================================================================== */

(function () {
  'use strict';

  /* ==========================================================================
     ROUTES
     ========================================================================== */
  CW.router
    /* --- shop (početna) i blog ---
       Ova faza ima samo dve celine. Stranice zajednice, usluga, CS2 tima,
       događaja, partnera i „o nama" su sklonjene iz navigacije; njihov kod
       je ostao netaknut u cw-pages-community.js, pa se vraćaju dodavanjem
       jednog reda ovde kada zatrebaju. */
    .add('',                    CW.pages.home,      { title: function () { return 'Zvanični shop'; } })
    .add('vesti',               CW.pages.news,      { title: function () { return 'Blog'; } })
    .add('vesti/:id',           CW.pages.article,   { title: function (c) { var n = CW.find('news', c.params.id); return n ? n.title : 'Objava'; } })
    .add('kontakt',             CW.pages.contact,   { title: function () { return 'Kontakt'; } })

    /* --- shop --- */
    .add('shop',                CW.pages.shop,         { title: function () { return 'Zvanični shop'; } })
    .add('shop/:category',      CW.pages.catalog,      { title: function (c) { var k = CW.find('categories', c.params.category); return k ? k.name : 'Svi proizvodi'; } })
    .add('proizvod/:slug',      CW.pages.product,      { title: function (c) { var p = CW.productBySlug(c.params.slug); return p ? p.name : 'Proizvod'; } })
    .add('korpa',               CW.pages.cart,         { title: function () { return 'Korpa'; } })
    .add('placanje',            CW.pages.checkout,     { title: function () { return 'Plaćanje'; } })
    .add('potvrda',             CW.pages.confirmation, { title: function () { return 'Porudžbina potvrđena'; } })

    /* --- nalog --- */
    .add('nalog',                 CW.pages.account,          { title: function () { return 'Nalog'; } })
    .add('nalog/prijava',         CW.pages.login,            { title: function () { return 'Prijava'; } })
    .add('nalog/registracija',    CW.pages.register,         { title: function () { return 'Registracija'; } })
    .add('nalog/zaboravljena',    CW.pages.forgot,           { title: function () { return 'Zaboravljena lozinka'; } })
    .add('nalog/podaci',          CW.pages.accountDetails,   { title: function () { return 'Lični podaci'; } })
    .add('nalog/adrese',          CW.pages.accountAddresses, { title: function () { return 'Sačuvane adrese'; } })
    .add('nalog/porudzbine',      CW.pages.accountOrders,    { title: function () { return 'Moje porudžbine'; } })
    .add('nalog/porudzbine/:id',  CW.pages.accountOrder,     { title: function (c) { return 'Porudžbina ' + c.params.id; } })
    .add('nalog/lista-zelja',     CW.pages.wishlist,         { title: function () { return 'Lista želja'; } })

    /* --- pravno i podrška --- */
    .add('pitanja',     CW.pages.faq,                { title: function () { return 'Česta pitanja'; } })
    .add('dostava',     CW.pages.policy('shipping'), { title: function () { return 'Dostava'; } })
    .add('povracaj',    CW.pages.policy('returns'),  { title: function () { return 'Reklamacije i povraćaj'; } })
    .add('privatnost',  CW.pages.policy('privacy'),  { title: function () { return 'Politika privatnosti'; } })
    .add('uslovi',      CW.pages.policy('terms'),    { title: function () { return 'Uslovi korišćenja'; } })
    .add('kolacici',    CW.pages.policy('cookies'),  { title: function () { return 'Kolačići'; } })

    /* --- admin panel ---
       Sve rute prolaze kroz CW.admin.guard: bez sesije se prikazuje prijava.
       To je udobnost, ne zaštita — pravu proveru radi server kada dođe. */
    .add('admin',                  CW.admin.guard(CW.admin.dashboard),  { title: function () { return 'Admin — pregled'; } })
    .add('admin/objave',           CW.admin.guard(CW.admin.posts),      { title: function () { return 'Admin — objave'; } })
    .add('admin/objave/nova',      CW.admin.guard(CW.admin.postEdit),   { title: function () { return 'Admin — nova objava'; } })
    .add('admin/objave/:id',       CW.admin.guard(CW.admin.postEdit),   { title: function () { return 'Admin — izmena objave'; } })
    .add('admin/porudzbine',       CW.admin.guard(CW.admin.orders),      { title: function () { return 'Admin — porudžbine'; } })
    .add('admin/porudzbine/:id',   CW.admin.guard(CW.admin.orderDetail), { title: function () { return 'Admin — porudžbina'; } })
    .add('admin/proizvodi',        CW.admin.guard(CW.admin.products),   { title: function () { return 'Admin — proizvodi'; } })
    .add('admin/proizvodi/novi',   CW.admin.guard(CW.admin.productEdit),{ title: function () { return 'Admin — novi proizvod'; } })
    .add('admin/proizvodi/:id',    CW.admin.guard(CW.admin.productEdit),{ title: function () { return 'Admin — izmena proizvoda'; } })
    .add('admin/kategorije',       CW.admin.guard(CW.admin.categories), { title: function () { return 'Admin — kategorije'; } })
    .add('admin/podesavanja',      CW.admin.guard(CW.admin.settings),   { title: function () { return 'Admin — podešavanja'; } })

    .setNotFound(CW.pages.notFound);

  /* --------------------------------------------------------------------
     Aliasi sa ranijih engleskih putanja.
     Stranice shopa i naloga još sadrže deo linkova na starim adresama;
     ovi aliasi drže sajt bez 404 dok se i ti fajlovi ne prevedu.
     -------------------------------------------------------------------- */
  [
    ['news', 'vesti'], ['contact', 'kontakt'],
    /* Stranice sklonjene iz ove faze vode na početnu umesto na 404 —
       stari linkovi sa Discorda i Instagrama i dalje negde vode. */
    ['zajednica', ''], ['usluge', ''], ['cs2', ''], ['dogadjaji', ''],
    ['partneri', ''], ['o-nama', ''],
    ['community', ''], ['events', ''], ['about', ''], ['partners', ''], ['services', ''],
    ['cart', 'korpa'], ['checkout', 'placanje'], ['order-confirmation', 'potvrda'],
    ['faq', 'pitanja'], ['shipping', 'dostava'], ['returns', 'povracaj'],
    ['privacy', 'privatnost'], ['terms', 'uslovi'], ['cookies', 'kolacici'],
    ['account', 'nalog'], ['account/login', 'nalog/prijava'],
    ['account/register', 'nalog/registracija'], ['account/forgot', 'nalog/zaboravljena'],
    ['account/details', 'nalog/podaci'], ['account/addresses', 'nalog/adrese'],
    ['account/orders', 'nalog/porudzbine'], ['account/wishlist', 'nalog/lista-zelja']
  ].forEach(function (pair) {
    CW.router.add(pair[0], function () {
      CW.router.go(pair[1] ? '/' + pair[1] : '/');
      return '<div class="loading-block"><span class="spinner"></span></div>';
    }, { title: function () { return 'Preusmeravanje'; } });
  });

  CW.router.add('product/:slug', function (c) {
    CW.router.go('/proizvod/' + c.params.slug);
    return '<div class="loading-block"><span class="spinner"></span></div>';
  }, { title: function () { return 'Preusmeravanje'; } });

  CW.router.add('news/:id', function (c) {
    CW.router.go('/vesti/' + c.params.id);
    return '<div class="loading-block"><span class="spinner"></span></div>';
  }, { title: function () { return 'Preusmeravanje'; } });

  /* ==========================================================================
     VALIDATION HELPERS
     ========================================================================== */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* Error boxes are matched by element id first, then by field name — the
     latter covers checkboxes (terms, consent) whose message sits outside
     the <label> wrapper and which have no id of their own. */
  function errorBoxFor(input) {
    var field = input.closest('.field') || input.closest('.check');
    return (input.id ? document.querySelector('[data-error-for="' + input.id + '"]') : null) ||
           (input.name ? document.querySelector('[data-error-for="' + input.name + '"]') : null) ||
           (field ? field.querySelector('.field__error') : null);
  }

  function setError(input, message) {
    var field = input.closest('.field') || input.closest('.check');
    var box = errorBoxFor(input);
    if (field) field.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
    if (box) {
      box.innerHTML = CW.icon('alert', 14) + ' ' + CW.esc(message);
      box.classList.remove('hidden');
    }
  }

  function clearError(input) {
    var field = input.closest('.field') || input.closest('.check');
    var box = errorBoxFor(input);
    if (field) field.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    if (box) box.classList.add('hidden');
  }

  /** Validate a form. Returns { ok, values, firstInvalid }. */
  function validate(form, rules) {
    var ok = true, values = {}, firstInvalid = null;

    Object.keys(rules).forEach(function (name) {
      var input = form.querySelector('[name="' + name + '"]');
      if (!input) return;
      var rule = rules[name];
      var value = input.type === 'checkbox' ? input.checked : (input.value || '').trim();
      values[name] = value;
      clearError(input);

      var message = null;
      if (rule.required && (input.type === 'checkbox' ? !value : !value)) {
        message = rule.requiredMsg || 'This field is required';
      } else if (value && rule.email && !EMAIL_RE.test(value)) {
        message = 'Enter a valid email address';
      } else if (value && rule.min && String(value).length < rule.min) {
        message = 'Must be at least ' + rule.min + ' characters';
      } else if (rule.match && value !== (form.querySelector('[name="' + rule.match + '"]') || {}).value) {
        message = 'Passwords do not match';
      }

      if (message) {
        ok = false;
        setError(input, message);
        if (!firstInvalid) firstInvalid = input;
      }
    });

    return { ok: ok, values: values, firstInvalid: firstInvalid };
  }

  function formStatus(form, type, text) {
    var host = form.querySelector('[data-form-status]');
    if (!host) return;
    host.innerHTML = '<div class="alert alert--' + type + ' mt-2">' +
      CW.icon(type === 'success' ? 'check' : 'alert', 18) + '<span>' + CW.esc(text) + '</span></div>';
  }

  function submitting(form, on) {
    var btn = form.querySelector('button[type=submit]');
    if (btn) btn.classList.toggle('is-loading', !!on);
    CW.qsa('input, select, textarea, button', form).forEach(function (el) { el.disabled = !!on; });
  }

  /* ==========================================================================
     PDP STATE — variant selection, validation, sticky bar
     ========================================================================== */
  var pdp = { productId: null, size: null, color: null, qty: 1 };

  function pdpProduct() { return pdp.productId ? CW.product(pdp.productId) : null; }

  function pdpVariant() {
    var p = pdpProduct();
    if (!p) return null;
    var found = null;
    p.variants.forEach(function (v) {
      if (v.size === pdp.size && v.colorId === pdp.color) found = v;
    });
    return found;
  }

  /** Disable size buttons that have no stock in the chosen colour, and vice versa. */
  function pdpSync() {
    var p = pdpProduct();
    if (!p) return;

    CW.qsa('[data-act="pick-size"]').forEach(function (btn) {
      var size = btn.getAttribute('data-size');
      var available = p.variants.some(function (v) {
        return v.size === size && v.stock > 0 && (!pdp.color || v.colorId === pdp.color);
      });
      btn.disabled = !available;
      btn.classList.toggle('is-selected', pdp.size === size);
      btn.setAttribute('aria-pressed', String(pdp.size === size));
      if (!available) btn.title = 'Sold out in this colour';
    });

    CW.qsa('[data-act="pick-color"]').forEach(function (btn) {
      var c = btn.getAttribute('data-color');
      var available = p.variants.some(function (v) {
        return v.colorId === c && v.stock > 0 && (!pdp.size || v.size === pdp.size);
      });
      btn.disabled = !available;
      btn.classList.toggle('is-selected', pdp.color === c);
      btn.setAttribute('aria-pressed', String(pdp.color === c));
    });

    var sizeLabel = document.querySelector('[data-size-label]');
    if (sizeLabel) sizeLabel.textContent = pdp.size || 'Izaberi veličinu';
    var colorLabel = document.querySelector('[data-color-label]');
    if (colorLabel) colorLabel.textContent = pdp.color ? CW.shopOptions.colors[pdp.color].name : 'Izaberi boju';

    /* Stock line reflects the selected variant, not the product total */
    var line = document.querySelector('[data-stock-line]');
    var v = pdpVariant();
    if (line) {
      if (!pdp.size || !pdp.color) {
        line.innerHTML = '<div class="status status--upcoming"><span class="status__dot"></span>Izaberi opciju da vidiš dostupnost</div>';
      } else if (!v || v.stock === 0) {
        line.innerHTML = '<div class="status status--offline"><span class="status__dot"></span>Sold out in this combination</div>';
      } else if (v.stock <= CW.shopConfig.lowStockThreshold) {
        line.innerHTML = '<div class="status status--soon"><span class="status__dot"></span>Only ' + v.stock + ' left in this size</div>';
      } else {
        line.innerHTML = '<div class="status status--live"><span class="status__dot"></span>In stock, ships in 1 working day</div>';
      }
    }

    var sticky = document.querySelector('[data-sticky-variant]');
    if (sticky) {
      sticky.textContent = (pdp.size && pdp.color)
        ? pdp.size + ' · ' + CW.shopOptions.colors[pdp.color].name
        : 'Izaberi opciju';
    }

    /* Quantity cannot exceed the selected variant's stock */
    var qtyInput = document.querySelector('[data-pdp-qty]');
    if (qtyInput) {
      if (v && pdp.qty > v.stock) pdp.qty = Math.max(1, v.stock);
      qtyInput.value = pdp.qty;
      var inc = document.querySelector('[data-act="pdp-qty-inc"]');
      if (inc) inc.disabled = !!(v && pdp.qty >= v.stock);
      var dec = document.querySelector('[data-act="pdp-qty-dec"]');
      if (dec) dec.disabled = pdp.qty <= 1;
    }
  }

  function pdpInit() {
    var host = document.querySelector('[data-pdp]');
    if (!host) { pdp.productId = null; return; }

    pdp.productId = host.getAttribute('data-pdp');
    pdp.size = null;
    pdp.color = null;
    pdp.qty = 1;

    /* Auto-select where there is genuinely no choice to make */
    var singleColor = document.querySelector('[data-single-color]');
    if (singleColor) pdp.color = singleColor.getAttribute('data-single-color');
    var singleSize = document.querySelector('[data-single-size]');
    if (singleSize) pdp.size = singleSize.getAttribute('data-single-size');

    pdpSync();
  }

  function flagVariantError(kind) {
    var group = document.querySelector('[data-variant-group="' + kind + '"]');
    if (!group) return;
    group.classList.add('is-invalid');
    var err = group.querySelector('[data-error="' + kind + '"]');
    if (err) err.classList.remove('hidden');
    group.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(function () { group.classList.remove('is-invalid'); }, 500);
  }

  function clearVariantErrors() {
    CW.qsa('[data-error="size"], [data-error="color"]').forEach(function (e) { e.classList.add('hidden'); });
  }

  /* ==========================================================================
     COUNTDOWN
     ========================================================================== */
  var countdownTimer = null;

  function startCountdowns() {
    if (countdownTimer) clearInterval(countdownTimer);
    var nodes = CW.qsa('[data-countdown]');
    if (!nodes.length) return;

    function tick() {
      nodes.forEach(function (node) {
        var target = new Date(node.getAttribute('data-countdown')).getTime();
        var diff = Math.max(0, target - Date.now());
        var d = Math.floor(diff / 86400000);
        var h = Math.floor(diff % 86400000 / 3600000);
        var m = Math.floor(diff % 3600000 / 60000);
        var s = Math.floor(diff % 60000 / 1000);
        var map = { days: d, hrs: h, min: m, sec: s };
        Object.keys(map).forEach(function (k) {
          var el = node.querySelector('[data-unit="' + k + '"]');
          if (el) el.textContent = String(map[k]).padStart(2, '0');
        });
      });
    }
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  /* ==========================================================================
     CATALOG FILTERS
     ========================================================================== */
  function collectFilters(form) {
    var q = {};
    var text = form.querySelector('[name=q]');
    q.q = text && text.value.trim() ? text.value.trim() : null;

    ['collection', 'size', 'color', 'avail'].forEach(function (name) {
      var vals = CW.qsa('[name="' + name + '"]:checked', form).map(function (i) { return i.value; });
      q[name] = vals.length ? vals.join(',') : null;
    });

    var range = form.querySelector('[name=max]');
    q.max = range && range.value !== range.max ? range.value : null;
    q.page = null;
    return q;
  }

  function currentCatalogBase() {
    var loc = CW.router.current();
    return '#/' + (loc ? loc.path : 'shop/all');
  }

  /** Live feedback inside a filter panel — works for the rail and the drawer. */
  function wireFilterControls(root) {
    if (!root) return;

    CW.qsa('[name=max]', root).forEach(function (range) {
      if (range.dataset.wired) return;
      range.dataset.wired = '1';
      range.addEventListener('input', function () {
        var wrap = range.closest('.range');
        var out = wrap ? wrap.querySelector('[data-price-out]') : null;
        if (out) out.textContent = 'Up to ' + CW.shopConfig.currencySymbol + range.value;
      });
    });

    /* Size chips and colour swatches are checkboxes styled as buttons —
       reflect their checked state the instant they change. */
    CW.qsa('.variant-btn input[type=checkbox]', root).forEach(function (cb) {
      if (cb.dataset.wired) return;
      cb.dataset.wired = '1';
      cb.addEventListener('change', function () {
        cb.closest('.variant-btn').classList.toggle('is-selected', cb.checked);
      });
    });

    CW.qsa('.variant-color', root).forEach(function (span) {
      var cb = span.parentNode.querySelector('input[type=checkbox]');
      if (!cb || cb.dataset.wired) return;
      cb.dataset.wired = '1';
      cb.addEventListener('change', function () { span.classList.toggle('is-selected', cb.checked); });
    });
  }

  /* ==========================================================================
     FORM VALUE PRESERVATION
     Changing the delivery method or applying a coupon re-renders the checkout.
     Without this, everything already typed would be wiped — so values are
     snapshotted before the re-render and restored after it.
     ========================================================================== */
  var pendingRestore = null;

  function snapshotForm(form) {
    if (!form) return null;
    var out = {};
    CW.qsa('input, select, textarea', form).forEach(function (el) {
      if (!el.name) return;
      if (el.type === 'checkbox') out[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
      else out[el.name] = el.value;
    });
    return out;
  }

  function restoreForm(form, values) {
    if (!form || !values) return;
    Object.keys(values).forEach(function (name) {
      var els = CW.qsa('[name="' + name + '"]', form);
      els.forEach(function (el) {
        if (el.type === 'checkbox') el.checked = !!values[name];
        else if (el.type === 'radio') el.checked = (el.value === values[name]);
        else if (values[name] !== undefined && !el.readOnly) el.value = values[name];
      });
    });
  }

  function wirePage() {
    pdpInit();
    startCountdowns();

    if (pendingRestore) {
      restoreForm(document.querySelector('[data-act="checkout-form"]'), pendingRestore);
      pendingRestore = null;
      syncPaymentFields();
    }

    wireFilterControls(document);

    /* --- sort select --- */
    var sort = document.querySelector('[data-act="sort"]');
    if (sort) sort.addEventListener('change', function () { CW.router.setQuery({ sort: sort.value, page: null }); });

    /* --- streamer filter --- */
    var streamer = document.querySelector('[data-act="filter-streamer"]');
    if (streamer) streamer.addEventListener('change', function () {
      CW.router.setQuery({ player: streamer.value === 'all' ? null : streamer.value });
    });

    /* --- shipping estimate on the cart page (kept in the URL so the choice
           survives the re-render and can be deep-linked) --- */
    var shipEst = document.querySelector('[data-act="shipping-estimate"]');
    if (shipEst) shipEst.addEventListener('change', function () {
      CW.router.setQuery({ ship: shipEst.value });
    });

    /* --- checkout: card fields only for the card method --- */
    syncPaymentFields();
  }

  function syncPaymentFields() {
    var selected = document.querySelector('[name=payment]:checked');
    var cardFields = document.querySelector('[data-card-fields]');
    if (cardFields) cardFields.classList.toggle('hidden', !selected || selected.value !== 'card');
  }

  /* ==========================================================================
     DELEGATED PAGE-LEVEL CLICKS
     ========================================================================== */
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-act]') : null;
    if (!t) return;
    var act = t.getAttribute('data-act');

    switch (act) {

      /* ---------- PDP ---------- */
      case 'pick-size':
        ev.preventDefault();
        pdp.size = t.getAttribute('data-size');
        clearVariantErrors();
        pdpSync();
        break;

      case 'pick-color':
        ev.preventDefault();
        pdp.color = t.getAttribute('data-color');
        clearVariantErrors();
        pdpSync();
        break;

      case 'pick-image': {
        ev.preventDefault();
        var idx = parseInt(t.getAttribute('data-index'), 10);
        var p = pdpProduct();
        CW.qsa('.gallery__thumb').forEach(function (b) { b.classList.remove('is-active'); });
        t.classList.add('is-active');
        var main = document.querySelector('[data-gallery-main]');
        if (main && p) main.setAttribute('data-ph', p.images[idx]);
        break;
      }

      case 'pdp-qty-inc':
        ev.preventDefault();
        pdp.qty += 1;
        pdpSync();
        break;

      case 'pdp-qty-dec':
        ev.preventDefault();
        pdp.qty = Math.max(1, pdp.qty - 1);
        pdpSync();
        break;

      case 'size-guide':
        ev.preventDefault();
        CW.ui.openOverlay(CW.c.sizeGuideModal(t.getAttribute('data-guide')));
        break;

      /* ---------- IN-PAGE NAVIGATION ---------- */
      case 'scroll-to': {
        ev.preventDefault();
        var section = document.getElementById(t.getAttribute('data-target'));
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          section.setAttribute('tabindex', '-1');
          section.focus({ preventScroll: true });
        }
        CW.qsa('.legal-toc__link').forEach(function (l) { l.classList.remove('is-active'); });
        t.classList.add('is-active');
        break;
      }

      case 'add-to-cart': {
        ev.preventDefault();
        var prod = CW.product(t.getAttribute('data-pid'));
        if (!prod) break;

        /* Explicit validation when a required variation is missing */
        if (!pdp.color) { flagVariantError('color'); CW.toast({ type: 'warning', title: 'Choose a colour', text: 'Pick a colour before adding to cart.' }); break; }
        if (!pdp.size)  { flagVariantError('size');  CW.toast({ type: 'warning', title: 'Izaberi veličinu', text: 'Pick a size before adding to cart.' }); break; }

        var variant = pdpVariant();
        if (!variant || variant.stock === 0) {
          CW.toast({ type: 'error', title: 'Sold out', text: 'That size and colour combination is not available.' });
          break;
        }

        t.classList.add('is-loading');
        setTimeout(function () {
          t.classList.remove('is-loading');
          var res = CW.store.addToCart(prod.id, variant.id, pdp.qty);
          if (!res.ok) {
            CW.toast({
              type: 'warning',
              title: res.reason === 'stock-limit' ? 'Stock limit reached' : 'Could not add to cart',
              text: res.reason === 'stock-limit' ? 'Only ' + res.max + ' available in this size.' : 'Please try again.'
            });
            return;
          }
          CW.toast({
            type: 'success', thumb: true,
            title: 'Added to cart',
            text: prod.name + ' · ' + pdp.size + ' · ' + CW.shopOptions.colors[pdp.color].name
          });
          CW.ui.refreshHeader();
          pdpSync();
        }, 420);
        break;
      }

      /* ---------- CATALOG FILTERS ---------- */
      case 'open-filters': {
        ev.preventDefault();
        var panel = document.querySelector('.catalog__filters');
        /* The desktop panel is cloned into the drawer, so ids are re-prefixed
           to avoid duplicates in the document and keep every label bound to
           the control it actually describes. */
        var markup = panel ? panel.innerHTML
          .replace(/id="([^"]+)"/g, 'id="m-$1"')
          .replace(/for="([^"]+)"/g, 'for="m-$1"') : '';
        CW.ui.openOverlay(
          '<div class="drawer drawer--left" role="dialog" aria-modal="true" aria-label="Filters">' +
            '<div class="drawer__head">' +
              '<span class="drawer__title">Filters</span>' +
              '<button class="btn-icon" type="button" data-act="close-overlays" aria-label="Close filters">' + CW.icon('x', 22) + '</button>' +
            '</div>' +
            '<div class="drawer__body">' + markup + '</div>' +
          '</div>');
        /* Wire only the cloned controls — re-running the full page wiring
           would double-bind the listeners on the desktop panel. */
        wireFilterControls(document.getElementById('overlay-root'));
        break;
      }

      case 'clear-filters':
        ev.preventDefault();
        CW.ui.closeAllOverlays();
        window.location.hash = currentCatalogBase();
        break;

      case 'remove-filter': {
        ev.preventDefault();
        var key = t.getAttribute('data-key');
        var val = t.getAttribute('data-val');
        var loc = CW.router.current();
        var existing = (loc.query[key] || '').split(',').filter(Boolean);
        var next = existing.filter(function (x) { return x !== val; });
        var upd = {};
        upd[key] = next.length ? next.join(',') : null;
        upd.page = null;
        CW.router.setQuery(upd);
        break;
      }

      /* ---------- CART / CHECKOUT ---------- */
      case 'remove-coupon': {
        ev.preventDefault();
        var rcForm = document.querySelector('[data-act="checkout-form"]');
        if (rcForm) pendingRestore = snapshotForm(rcForm);
        CW.store.removeCoupon();
        CW.toast({ type: 'info', title: 'Discount removed' });
        CW.router.refresh();
        break;
      }

      case 'pick-shipping': {
        CW.qsa('.radio-card').forEach(function (c) {
          if (c.querySelector('[name=shipping]')) c.classList.toggle('is-selected', c.contains(t));
        });
        var coForm = document.querySelector('[data-act="checkout-form"]');
        if (coForm) pendingRestore = snapshotForm(coForm);
        CW.router.setQuery({ ship: t.value });
        break;
      }

      case 'pick-payment':
        CW.qsa('.radio-card').forEach(function (c) {
          if (c.querySelector('[name=payment]')) c.classList.toggle('is-selected', c.contains(t));
        });
        syncPaymentFields();
        break;

      case 'toggle-billing': {
        var billing = document.querySelector('[data-billing-fields]');
        if (billing) billing.classList.toggle('hidden', t.checked);
        break;
      }

      /* ---------- ACCOUNT (demo affordances) ---------- */
      case 'add-address':
      case 'edit-address':
        ev.preventDefault();
        CW.toast({ type: 'info', title: 'Address editor', text: 'Address management connects to the customer API in the next phase.' });
        break;

      case 'set-default-address':
        ev.preventDefault();
        CW.toast({ type: 'success', title: 'Default address updated' });
        break;

      case 'delete-address':
        ev.preventDefault();
        CW.toast({ type: 'info', title: 'Address removed' });
        break;

      case 'delete-account':
        ev.preventDefault();
        CW.ui.openOverlay(
          '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="del-t">' +
            '<div class="modal__head">' +
              '<h2 class="modal__title" id="del-t">Delete your account?</h2>' +
              '<button class="btn-icon" type="button" data-act="close-overlays" aria-label="Close">' + CW.icon('x', 22) + '</button>' +
            '</div>' +
            '<div class="modal__body">' +
              '<div class="alert alert--error">' + CW.icon('alert', 18) +
                '<span>This removes your saved addresses and wishlist immediately and cannot be undone.</span></div>' +
              '<p class="t-sm mt-3">Order records are retained for the period required by tax and accounting law, as described in the Privacy Policy.</p>' +
            '</div>' +
            '<div class="modal__foot">' +
              '<button class="btn btn--quiet" type="button" data-act="close-overlays">Keep my account</button>' +
              '<button class="btn btn--danger" type="button" data-act="close-overlays">Delete account</button>' +
            '</div>' +
          '</div>');
        break;
    }
  });

  /* ==========================================================================
     DELEGATED FORM SUBMISSIONS
     ========================================================================== */
  document.addEventListener('submit', function (ev) {
    var form = ev.target;
    var act = form.getAttribute('data-act');
    if (!act) return;

    switch (act) {

      /* ---------- search forms ---------- */
      case 'news-search':
        ev.preventDefault();
        CW.router.setQuery({ q: form.querySelector('[name=q]').value.trim() || null, page: null });
        break;

      case 'player-search':
        ev.preventDefault();
        CW.router.setQuery({ q: form.querySelector('[name=q]').value.trim() || null });
        break;

      case 'faq-search':
        ev.preventDefault();
        CW.router.setQuery({ q: form.querySelector('[name=q]').value.trim() || null });
        break;

      /* ---------- catalog filters ---------- */
      case 'filter-form': {
        ev.preventDefault();
        CW.ui.closeAllOverlays();
        CW.router.setQuery(collectFilters(form));
        break;
      }

      /* ---------- coupon ---------- */
      case 'coupon-form': {
        ev.preventDefault();
        var input = form.querySelector('[name=code]');
        var res = CW.store.applyCoupon(input.value);
        if (res.ok) {
          var cpForm = document.querySelector('[data-act="checkout-form"]');
          if (cpForm) pendingRestore = snapshotForm(cpForm);
          CW.toast({ type: 'success', title: 'Discount applied', text: res.coupon.label });
          CW.router.refresh();
        } else {
          var msg = res.reason === 'empty' ? 'Enter a discount code first.'
            : res.reason === 'min-spend' ? 'This code needs a minimum spend of ' + CW.money(res.min) + '.'
            : 'That code is not valid or has expired.';
          setError(input, msg);
          CW.toast({ type: 'error', title: 'Code not applied', text: msg });
        }
        break;
      }

      /* ---------- contact ---------- */
      case 'contact-form': {
        ev.preventDefault();
        var v = validate(form, {
          name:    { required: true, requiredMsg: 'Tell us who you are' },
          email:   { required: true, email: true },
          message: { required: true, min: 10, requiredMsg: 'A message helps us help you' },
          consent: { required: true, requiredMsg: 'We need your consent to reply' }
        });
        if (!v.ok) {
          formStatus(form, 'error', 'Please correct the highlighted fields and try again.');
          if (v.firstInvalid) v.firstInvalid.focus();
          CW.toast({ type: 'error', title: 'Check the form', text: 'Some required fields need attention.' });
          break;
        }
        submitting(form, true);
        setTimeout(function () {
          submitting(form, false);
          form.reset();
          formStatus(form, 'success', 'Message sent. We reply within two working days — partnership enquiries usually get a same-day acknowledgement.');
          CW.toast({ type: 'success', title: 'Message sent', text: 'We will be in touch shortly.' });
        }, 800);
        break;
      }

      /* ---------- auth ---------- */
      case 'login-form': {
        ev.preventDefault();
        var lv = validate(form, {
          email:    { required: true, email: true },
          password: { required: true, min: 6, requiredMsg: 'Enter your password' }
        });
        if (!lv.ok) {
          formStatus(form, 'error', 'Check your email address and password.');
          if (lv.firstInvalid) lv.firstInvalid.focus();
          break;
        }
        submitting(form, true);
        CW.sb.auth.signIn(lv.values.email, lv.values.password).then(function () {
          submitting(form, false);
          CW.ui.refreshHeader();
          CW.toast({ type: 'success', title: 'Dobro došao nazad', text: 'Prijavljen kao ' + lv.values.email });
          CW.router.go(form.getAttribute('data-next') || '/account');
        }).catch(function (e) {
          submitting(form, false);
          formStatus(form, 'error', e.message);
          CW.toast({ type: 'error', title: 'Prijava nije uspela', text: e.message });
        });
        break;
      }

      case 'register-form': {
        ev.preventDefault();
        var rv = validate(form, {
          firstName: { required: true },
          lastName:  { required: true },
          email:     { required: true, email: true },
          password:  { required: true, min: 8 },
          confirm:   { required: true, match: 'password' },
          terms:     { required: true, requiredMsg: 'You must accept the terms to create an account' }
        });
        if (!rv.ok) {
          formStatus(form, 'error', 'Please correct the highlighted fields.');
          if (rv.firstInvalid) rv.firstInvalid.focus();
          break;
        }
        submitting(form, true);
        CW.sb.auth.signUp(rv.values.email, rv.values.password, rv.values.firstName, rv.values.lastName)
          .then(function (d) {
            submitting(form, false);
            if (d.access_token) {
              CW.ui.refreshHeader();
              CW.toast({ type: 'success', title: 'Dobro došao u čopor', text: 'Nalog je spreman.' });
              CW.router.go('/account');
            } else {
              /* Supabase traži potvrdu mejlom (Authentication → Providers →
                 Email → "Confirm email") — nalog postoji, prijava još ne radi. */
              CW.toast({ type: 'success', title: 'Skoro gotovo', text: 'Proveri mejl i potvrdi nalog pre prijave.' });
              CW.router.go('/account/login');
            }
          }).catch(function (e) {
            submitting(form, false);
            formStatus(form, 'error', e.message);
            CW.toast({ type: 'error', title: 'Registracija nije uspela', text: e.message });
          });
        break;
      }

      case 'forgot-form': {
        ev.preventDefault();
        var fv = validate(form, { email: { required: true, email: true } });
        if (!fv.ok) break;
        submitting(form, true);
        setTimeout(function () {
          submitting(form, false);
          formStatus(form, 'success', 'If an account exists for that address, a reset link is on its way. It expires in one hour.');
          CW.toast({ type: 'success', title: 'Reset link sent' });
        }, 700);
        break;
      }

      case 'details-form': {
        ev.preventDefault();
        var dv = validate(form, {
          firstName: { required: true },
          lastName:  { required: true }
        });
        if (!dv.ok) {
          formStatus(form, 'error', 'Ispravi označena polja.');
          break;
        }

        /* Lozinka je opciona — samo ako je "Nova lozinka" popunjena. */
        var pwNew = (form.elements.new || {}).value || '';
        var pwConfirm = (form.elements.confirm || {}).value || '';
        var pwCurrent = (form.elements.current || {}).value || '';
        var changingPassword = Boolean(pwNew || pwConfirm || pwCurrent);
        if (changingPassword) {
          if (!pwCurrent) { formStatus(form, 'error', 'Unesi trenutnu lozinku.'); break; }
          if (pwNew.length < 6) { formStatus(form, 'error', 'Nova lozinka mora imati najmanje šest znakova.'); break; }
          if (pwNew !== pwConfirm) { formStatus(form, 'error', 'Nova lozinka i potvrda se ne poklapaju.'); break; }
        }

        var patch = {
          first_name: dv.values.firstName,
          last_name: dv.values.lastName,
          phone: (form.elements.phone || {}).value || null,
          address_line: (form.elements.address || {}).value || null,
          city: (form.elements.city || {}).value || null,
          postcode: (form.elements.postcode || {}).value || null,
          country: (form.elements.country || {}).value || 'RS',
          marketing_ok: Boolean(form.elements.marketing && form.elements.marketing.checked)
        };

        var user = CW.store.user();
        submitting(form, true);

        /* user_metadata (ime/prezime) se drži u koraku sa customers — inače
           bi zaglavlje i dalje pokazivalo staro ime dok se token sam ne
           osveži posle sat vremena. */
        var authPatch = { data: { first_name: patch.first_name, last_name: patch.last_name } };
        var chain = changingPassword
          ? CW.sb.auth.signIn(user.email, pwCurrent).catch(function () {
              throw new Error('Trenutna lozinka nije tačna.');
            }).then(function () {
              authPatch.password = pwNew;
              return CW.sb.auth.updateAuthUser(authPatch);
            })
          : CW.sb.auth.updateAuthUser(authPatch);

        chain
          .then(function () { return CW.sb.from('customers').eq('id', user.id).update(patch); })
          .then(function () {
            submitting(form, false);
            form.elements.current.value = '';
            form.elements.new.value = '';
            form.elements.confirm.value = '';
            formStatus(form, 'success', changingPassword
              ? 'Podaci su sačuvani i lozinka je promenjena.'
              : 'Podaci su sačuvani.');
            CW.toast({ type: 'success', title: 'Sačuvano' });
            CW.ui.refreshHeader();
          })
          .catch(function (e) {
            submitting(form, false);
            formStatus(form, 'error', e.message || 'Čuvanje nije uspelo.');
            CW.toast({ type: 'error', title: 'Greška', text: e.message || 'Pokušaj ponovo.' });
          });
        break;
      }

      /* ---------- checkout ---------- */
      case 'checkout-form': {
        ev.preventDefault();
        var cv = validate(form, {
          email:     { required: true, email: true },
          firstName: { required: true },
          lastName:  { required: true },
          line1:     { required: true, requiredMsg: 'We need a street address to deliver to' },
          city:      { required: true },
          postcode:  { required: true },
          terms:     { required: true, requiredMsg: 'You must accept the terms to place an order' }
        });

        /* Card fields are only required when card is the chosen method */
        var pay = form.querySelector('[name=payment]:checked');
        if (pay && pay.value === 'card') {
          var num = form.querySelector('[name=cardNumber]');
          if (num && num.value.replace(/\s/g, '').length < 12) {
            setError(num, 'Enter a valid card number');
            cv.ok = false;
            if (!cv.firstInvalid) cv.firstInvalid = num;
          }
        }

        if (!cv.ok) {
          formStatus(form, 'error', 'Neka polja nisu popunjena ili nisu ispravna.');
          if (cv.firstInvalid) { cv.firstInvalid.focus(); cv.firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
          CW.toast({ type: 'error', title: 'Porudžbina nije poslata', text: 'Popuni označena polja.' });
          break;
        }

        submitting(form, true);
        formStatus(form, 'info', 'Šaljemo porudžbinu — ne osvežavaj stranicu.');

        var shipId = (form.querySelector('[name=shipping]:checked') || {}).value || 'kurir';
        var shipMethod = CW.data.shippingMethods.filter(function (m) { return m.id === shipId; })[0];
        var payId = (pay || {}).value || 'pouzece';
        var payMethod = CW.data.paymentMethods.filter(function (m) { return m.id === payId; })[0];

        CW.orders.place({
          email: cv.values.email,
          firstName: cv.values.firstName,
          lastName: cv.values.lastName,
          phone: (form.querySelector('[name=phone]') || {}).value,
          line1: cv.values.line1,
          city: cv.values.city,
          postcode: cv.values.postcode,
          country: (form.querySelector('[name=country]') || {}).value || 'RS',
          shippingName: shipMethod ? shipMethod.name : null,
          paymentId: payId,
          notes: (form.querySelector('[name=notes]') || {}).value
        }).then(function (res) {
          /* Iznose upisujemo one koje je vratio server, ne one koje je sajt
             prikazivao — merodavan je server. */
          CW.store.recordOrder({
            id: res.orderNumber,
            totals: res.totals,
            currency: res.currency,
            status: res.status,
            /* Mejl potvrde jos ne salje niko - porudzbina je u bazi i vidi se
               u panelu. Kad Edge funkcija bude postavljena, ovde se vraca. */
            emailSent: false,
            details: {
              email: cv.values.email,
              firstName: cv.values.firstName,
              lastName: cv.values.lastName,
              line1: cv.values.line1,
              city: cv.values.city,
              postcode: cv.values.postcode,
              shippingName: shipMethod ? shipMethod.name : '',
              paymentName: payMethod ? payMethod.name : ''
            },
            items: res.items || []
          });

          submitting(form, false);
          CW.ui.refreshHeader();
          CW.toast({
            type: 'success',
            title: 'Porudžbina primljena',
            text: res.email === 'poslato'
              ? res.orderNumber + ' — potvrda je poslata na mejl.'
              : res.orderNumber + ' — javljamo se uskoro.'
          });
          CW.router.go('/potvrda');
        }).catch(function (err) {
          submitting(form, false);
          formStatus(form, 'error', err.message);
          CW.toast({ type: 'error', title: 'Porudžbina nije prošla', text: err.message });
        });
        break;
      }
    }
  });

  /* Clear a field's error the moment the person starts fixing it */
  document.addEventListener('input', function (ev) {
    if (ev.target.matches('.input, .select, .textarea')) clearError(ev.target);
  });
  document.addEventListener('change', function (ev) {
    if (ev.target.matches('input[type=checkbox]')) clearError(ev.target);
  });

  /* ==========================================================================
     BOOT
     ========================================================================== */
  function boot() {
    /* Mount into a dedicated root rather than replacing <body>, so the
       pre-boot shell and <noscript> block are left intact. */
    var root = document.createElement('div');
    root.id = 'cw-root';
    document.body.insertBefore(root, document.body.firstChild);

    /* The skip link is a button, not an anchor: an href="#main" would be
       swallowed by the hash router and navigate away. */
    root.innerHTML =
      '<button class="skip-link" type="button" data-act="skip-to-content">Skip to main content</button>' +
      '<div class="route-progress" id="route-progress" style="width:0;opacity:0"></div>' +
      '<div id="header-root"></div>' +
      '<main id="app" tabindex="-1"></main>' +
      '<div id="footer-root"></div>' +
      '<div id="overlay-root"></div>' +
      '<div class="toast-region" id="toast-region" role="status" aria-live="polite"></div>' +
      '<div id="cookie-root"></div>';

    document.getElementById('header-root').innerHTML = CW.c.header();
    document.getElementById('footer-root').innerHTML = CW.c.footer();
    document.getElementById('cookie-root').innerHTML = CW.c.cookieBanner();

    CW.ui.bind();

    /* wirePage is invoked by the router at the end of every render — see
       CW.wirePage assignment below — so no hashchange listener is needed. */
    /* Sadržaj se povlači iz baze PRE prvog crtanja — inače bi posetilac
       na trenutak video ugrađene podatke pa onda skok na prave.

       Ruter se pokreće TAČNO JEDNOM, šta god da se desi sa bazom:
       greška, spora mreža ili nedostatak fetch-a ne smeju da ostave
       posetioca pred praznom stranicom. */
    var started = false;
    function startOnce() {
      if (started) return;
      started = true;
      CW.router.start();
    }

    if (CW.hydrate) {
      /* Ako baza ćuti duže od dve sekunde, crtamo sa ugrađenim sadržajem.
         Bolje malo stariji sadržaj nego prazan ekran. */
      var guard = setTimeout(startOnce, (CW.CONFIG && CW.CONFIG.hydrateTimeoutMs) || 2000);
      try {
        CW.hydrate()
          .then(function () { clearTimeout(guard); startOnce(); })
          .catch(function () { clearTimeout(guard); startOnce(); });
      } catch (e) {
        clearTimeout(guard);
        startOnce();
      }
    } else {
      startOnce();
    }

    /* Checkout hides the global chrome — it has its own lean header */
    window.addEventListener('hashchange', syncChrome);
    syncChrome();
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-act="skip-to-content"]') : null;
    if (!t) return;
    ev.preventDefault();
    var main = document.getElementById('app');
    if (main) { main.focus(); main.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });

  function syncChrome() {
    var path = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    /* Kasa ima svoje uže zaglavlje; admin panel ima sopstvenu navigaciju,
       pa mu zaglavlje i podnožje javnog sajta samo smetaju. */
    var isAdmin = path === 'admin' || path.indexOf('admin/') === 0;
    var lean = path === 'checkout' || isAdmin;
    document.body.classList.toggle('is-admin', isAdmin);
    var header = document.getElementById('header-root');
    var footer = document.getElementById('footer-root');
    if (header) header.classList.toggle('hidden', lean);
    if (footer) footer.classList.toggle('hidden', lean);
  }

  /* Expose for the loading-state re-render path */
  CW.wirePage = wirePage;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
