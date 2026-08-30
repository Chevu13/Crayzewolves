/* ==========================================================================
   CRAZYWOLVES — CUSTOMER ACCOUNT + LEGAL / SUPPORT PAGES
   Customer-facing only. No admin surfaces.
   ========================================================================== */

window.CW = window.CW || {};
CW.pages = CW.pages || {};

/* ==========================================================================
   ACCOUNT SHELL
   ========================================================================== */
CW.pages._accountShell = function (activePath, title, body) {
  var user = CW.store.user();
  var wishCount = CW.store.wishlist().length;

  var links = [
    { path: '/nalog',             label: 'Pregled',        icon: 'home' },
    { path: '/nalog/podaci',      label: 'Lični podaci',   icon: 'user' },
    { path: '/nalog/adrese',      label: 'Sačuvane adrese',icon: 'pin' },
    { path: '/nalog/porudzbine',  label: 'Porudžbine',     icon: 'package' },
    { path: '/nalog/lista-zelja', label: 'Lista želja',    icon: 'heart',   count: wishCount }
  ];

  return '' +
  '<section class="page-hero">' +
    '<div class="container container--wide page-hero__inner">' +
      CW.c.crumbs([{ label: 'Početna', path: '/' }, { label: 'Account', path: '/account' }, { label: title, path: '' }]) +
      '<div class="row row--between row--wrap mt-3" style="gap:var(--space-3)">' +
        '<div>' +
          '<h1 class="t-h1">' + CW.esc(title) + '</h1>' +
          (user ? '<p class="t-lead mt-2">Prijavljen kao ' + CW.esc(user.email) + '</p>' : '') +
        '</div>' +
        (user ? '<div class="row" style="gap:12px">' +
          '<span class="avatar avatar--lg">' + CW.esc((user.firstName[0] || '') + (user.lastName[0] || '')) + '</span>' +
        '</div>' : '') +
      '</div>' +
    '</div>' +
  '</section>' +

  '<section class="section container container--wide">' +
    '<div class="account">' +
      '<nav class="account-nav" aria-label="Account">' +
        links.map(function (l) {
          return '<a class="account-nav__link' + (activePath === l.path ? ' is-active' : '') + '" href="#' + l.path + '"' +
            (activePath === l.path ? ' aria-current="page"' : '') + '>' +
            CW.icon(l.icon, 17) + '<span>' + CW.esc(l.label) + '</span>' +
            (l.count ? '<span class="spacer"></span><span class="badge badge--neutral">' + l.count + '</span>' : '') +
          '</a>';
        }).join('') +
        '<hr class="divider-line" style="margin-block:var(--space-2)">' +
        '<button class="account-nav__link" type="button" data-act="sign-out" style="text-align:left">' +
          CW.icon('logout', 17) + '<span>Log out</span></button>' +
      '</nav>' +
      '<div>' + body + '</div>' +
    '</div>' +
  '</section>';
};

/* Guard: send signed-out visitors to login with a return path */
CW.pages._requireAuth = function (returnTo) {
  return '<section class="section container container--wide">' +
    '<div class="auth-card text-center">' +
      '<div class="empty__icon mx-auto">' + CW.icon('lock', 26) + '</div>' +
      '<h1 class="t-h2 mt-3">Prijavi se da nastaviš</h1>' +
      '<p class="t-sm mt-2">Za ovu stranicu je potrebna prijava.</p>' +
      '<a class="btn btn--primary btn--full btn--lg mt-4" href="#/account/login?next=' + encodeURIComponent(returnTo) + '">Prijavi se</a>' +
      '<a class="btn btn--ghost btn--full mt-1" href="#/account/register">Napravi nalog</a>' +
    '</div>' +
  '</section>';
};

/* ==========================================================================
   LOGIN
   ========================================================================== */
CW.pages.login = function (ctx) {
  var next = ctx.query.next || '/account';

  /* Već prijavljen kupac ne treba da vidi formu za prijavu — samo ga
     prebaci na nalog umesto da mu traži mejl i lozinku ponovo. */
  if (CW.store.user()) {
    CW.onMount(function () { CW.router.go(next); });
    return '<section class="section container container--wide">' +
      '<div class="auth-card text-center"><p class="t-sm">Već si prijavljen — prebacujem te…</p></div>' +
    '</section>';
  }

  return '' +
  '<section class="section container container--wide">' +
    '<div class="auth-card">' +
      '<div class="text-center">' +
        CW.logoMark(44) +
        '<h1 class="t-h2 mt-3">Dobro došao nazad</h1>' +
        '<p class="t-sm mt-2">Prijavi se za porudžbine, listu želja i sačuvane adrese.</p>' +
      '</div>' +

      '<form class="stack stack-3 mt-4" data-act="login-form" data-next="' + CW.esc(next) + '" novalidate>' +
        '<div class="field">' +
          '<label class="field__label" for="li-email">Imejl adresa <span class="field__req">*</span></label>' +
          '<input class="input" id="li-email" name="email" type="email" autocomplete="email" required placeholder="ime@primer.com">' +
          '<div class="field__error hidden" data-error-for="li-email"></div>' +
        '</div>' +

        '<div class="field">' +
          '<div class="row row--between">' +
            '<label class="field__label" for="li-pass">Password <span class="field__req">*</span></label>' +
            '<a class="t-xs link-underline" href="#/account/forgot">Forgot?</a>' +
          '</div>' +
          '<input class="input" id="li-pass" name="password" type="password" autocomplete="current-password" required>' +
          '<div class="field__error hidden" data-error-for="li-pass"></div>' +
        '</div>' +

        '<label class="check">' +
          '<input type="checkbox" name="remember" checked>' +
          '<span class="check__box">' + CW.icon('check', 13) + '</span>' +
          '<span class="check__label">Ostani prijavljen na ovom uređaju</span>' +
        '</label>' +

        '<button class="btn btn--primary btn--lg btn--full" type="submit">Prijavi se</button>' +
        '<div data-form-status role="status" aria-live="polite"></div>' +
      '</form>' +

      '<div class="divider mt-3"><span class="divider__mark"></span></div>' +

      '<p class="t-sm text-center">New here? <a class="link-underline" href="#/account/register">Napravi nalog</a></p>' +
      '<p class="t-xs text-center mt-2">Nalog nije obavezan za kupovinu, ali olakšava praćenje porudžbina.</p>' +
    '</div>' +
  '</section>';
};

/* ==========================================================================
   REGISTER
   ========================================================================== */
CW.pages.register = function () {
  if (CW.store.user()) {
    CW.onMount(function () { CW.router.go('/account'); });
    return '<section class="section container container--wide">' +
      '<div class="auth-card text-center"><p class="t-sm">Već si prijavljen — prebacujem te…</p></div>' +
    '</section>';
  }

  return '' +
  '<section class="section container container--wide">' +
    '<div class="auth-card">' +
      '<div class="text-center">' +
        CW.logoMark(44) +
        '<h1 class="t-h2 mt-3">Uđi u čopor</h1>' +
        '<p class="t-sm mt-2">Nalog čuva porudžbine, listu želja i adrese na jednom mestu.</p>' +
      '</div>' +

      '<form class="stack stack-3 mt-4" data-act="register-form" novalidate>' +
        '<div class="field-row">' +
          '<div class="field">' +
            '<label class="field__label" for="rg-first">Ime <span class="field__req">*</span></label>' +
            '<input class="input" id="rg-first" name="firstName" type="text" autocomplete="given-name" required>' +
            '<div class="field__error hidden" data-error-for="rg-first"></div>' +
          '</div>' +
          '<div class="field">' +
            '<label class="field__label" for="rg-last">Prezime <span class="field__req">*</span></label>' +
            '<input class="input" id="rg-last" name="lastName" type="text" autocomplete="family-name" required>' +
            '<div class="field__error hidden" data-error-for="rg-last"></div>' +
          '</div>' +
        '</div>' +

        '<div class="field">' +
          '<label class="field__label" for="rg-email">Imejl adresa <span class="field__req">*</span></label>' +
          '<input class="input" id="rg-email" name="email" type="email" autocomplete="email" required>' +
          '<div class="field__error hidden" data-error-for="rg-email"></div>' +
        '</div>' +

        '<div class="field">' +
          '<label class="field__label" for="rg-pass">Lozinka <span class="field__req">*</span></label>' +
          '<input class="input" id="rg-pass" name="password" type="password" autocomplete="new-password" required>' +
          '<div class="field__hint">Najmanje osam znakova. Duža je bolja nego komplikovana.</div>' +
          '<div class="field__error hidden" data-error-for="rg-pass"></div>' +
        '</div>' +

        '<div class="field">' +
          '<label class="field__label" for="rg-confirm">Ponovi lozinku <span class="field__req">*</span></label>' +
          '<input class="input" id="rg-confirm" name="confirm" type="password" autocomplete="new-password" required>' +
          '<div class="field__error hidden" data-error-for="rg-confirm"></div>' +
        '</div>' +

        '<label class="check">' +
          '<input type="checkbox" name="terms" required>' +
          '<span class="check__box">' + CW.icon('check', 13) + '</span>' +
          '<span class="check__label">Prihvatam <a class="link-underline" href="#/uslovi">uslove korišćenja</a> i <a class="link-underline" href="#/privatnost">politiku privatnosti</a>. <span class="field__req">*</span></span>' +
        '</label>' +
        '<div class="field__error hidden" data-error-for="terms"></div>' +

        '<label class="check">' +
          '<input type="checkbox" name="marketing">' +
          '<span class="check__box">' + CW.icon('check', 13) + '</span>' +
          '<span class="check__label">Obaveštavaj me o novim proizvodima i dešavanjima. Jednom nedeljno, odjava u svakom trenutku.</span>' +
        '</label>' +

        '<button class="btn btn--primary btn--lg btn--full" type="submit">Napravi nalog</button>' +
        '<div data-form-status role="status" aria-live="polite"></div>' +
      '</form>' +

      '<div class="divider"><span class="divider__mark"></span></div>' +
      '<p class="t-sm text-center">Već imaš nalog? <a class="link-underline" href="#/account/login">Prijavi se</a></p>' +
    '</div>' +
  '</section>';
};

/* ==========================================================================
   FORGOT PASSWORD
   ========================================================================== */
CW.pages.forgot = function () {
  return '' +
  '<section class="section container container--wide">' +
    '<div class="auth-card">' +
      '<div class="text-center">' +
        '<div class="empty__icon mx-auto">' + CW.icon('mail', 26) + '</div>' +
        '<h1 class="t-h2 mt-3">Zaboravljena lozinka</h1>' +
        '<p class="t-sm mt-2">Upiši adresu sa svog naloga i poslacemo link za promenu lozinke. Važi jedan sat.</p>' +
      '</div>' +

      '<form class="stack stack-3 mt-4" data-act="forgot-form" novalidate>' +
        '<div class="field">' +
          '<label class="field__label" for="fp-email">Imejl adresa <span class="field__req">*</span></label>' +
          '<input class="input" id="fp-email" name="email" type="email" autocomplete="email" required>' +
          '<div class="field__error hidden" data-error-for="fp-email"></div>' +
        '</div>' +
        '<button class="btn btn--primary btn--lg btn--full" type="submit">Pošalji link</button>' +
        '<div data-form-status role="status" aria-live="polite"></div>' +
      '</form>' +

      '<div class="divider"><span class="divider__mark"></span></div>' +
      '<p class="t-sm text-center"><a class="link-underline" href="#/nalog/prijava">Nazad na prijavu</a></p>' +
    '</div>' +
  '</section>';
};

/* ==========================================================================
   NOVA LOZINKA
   --------------------------------------------------------------------------
   Otvara se klikom na link iz mejla. Token iz tog linka je do ovog trenutka
   vec pretvoren u sesiju (cw-app.js boot -> establishFromCallback), pa ovde
   nema nikakvog tokena u vidokrugu — obican upis nove lozinke na nalog koji
   je vec prijavljen tim tokenom.

   Stranica se namerno ne krije iza provere prijave: ako neko dodje ovde bez
   vazeceg linka, treba da vidi zasto ne moze da nastavi, a ne prazan ekran.
   ========================================================================== */
CW.pages.newPassword = function () {
  var ima = Boolean(CW.sb && CW.sb.enabled && CW.sb.session());
  var user = ima ? CW.sb.auth.user() : null;

  return '' +
  '<section class="section container container--wide">' +
    '<div class="auth-card">' +
      '<div class="text-center">' +
        '<div class="empty__icon mx-auto">' + CW.icon('lock', 26) + '</div>' +
        '<h1 class="t-h2 mt-3">Nova lozinka</h1>' +
        (ima
          ? '<p class="t-sm mt-2">Upiši novu lozinku za nalog <b>' + CW.esc((user && user.email) || '') + '</b>.</p>'
          : '') +
      '</div>' +

      (ima
        ? '<form class="stack stack-3 mt-4" data-act="new-password-form" novalidate>' +
            '<div class="field">' +
              '<label class="field__label" for="np-pass">Nova lozinka <span class="field__req">*</span></label>' +
              '<input class="input" id="np-pass" name="password" type="password" autocomplete="new-password" minlength="6" required>' +
              '<div class="field__hint">Najmanje šest znakova.</div>' +
              '<div class="field__error hidden" data-error-for="np-pass"></div>' +
            '</div>' +
            '<div class="field">' +
              '<label class="field__label" for="np-pass2">Ponovi novu lozinku <span class="field__req">*</span></label>' +
              '<input class="input" id="np-pass2" name="password2" type="password" autocomplete="new-password" minlength="6" required>' +
              '<div class="field__error hidden" data-error-for="np-pass2"></div>' +
            '</div>' +
            '<button class="btn btn--primary btn--lg btn--full" type="submit">Sačuvaj lozinku</button>' +
            '<div data-form-status role="status" aria-live="polite"></div>' +
          '</form>'

        : '<div class="alert alert--warning mt-4">' + CW.icon('alert', 18) +
            '<div><b>Link je istekao ili je već iskorišćen.</b>' +
            '<div class="mt-1">Linkovi za promenu lozinke važe jedan sat i mogu se upotrebiti jednom. ' +
            'Zatraži nov ispod.</div></div>' +
          '</div>' +
          '<a class="btn btn--primary btn--full mt-3" href="#/nalog/zaboravljena">Zatraži nov link</a>') +

      '<div class="divider"><span class="divider__mark"></span></div>' +
      '<p class="t-sm text-center"><a class="link-underline" href="#/nalog/prijava">Nazad na prijavu</a></p>' +
    '</div>' +
  '</section>';
};


/* ==========================================================================
   ACCOUNT OVERVIEW
   ========================================================================== */
CW.pages.account = function () {
  var user = CW.store.user();
  if (!user) return CW.pages._requireAuth('/account');

  var wish = CW.store.wishlist().map(CW.product).filter(Boolean);

  CW.onMount(function () {
    var host = document.getElementById('acc-recent-orders');
    if (host) {
      CW.api.orders.all().then(function (rows) {
        var recent = rows.slice(0, 2);
        host.innerHTML = recent.length
          ? '<div class="stack stack-2">' + recent.map(CW.pages._orderRow).join('') + '</div>'
          : '<p class="t-sm">Još nema porudžbina.</p>';
      }).catch(function () {
        host.innerHTML = '<p class="t-sm">Ne mogu da učitam porudžbine.</p>';
      });
    }

    CW.sb.auth.customer().then(function (c) {
      if (!c) return;
      var nameLine = document.getElementById('acc-name-line');
      if (nameLine && (c.first_name || c.last_name)) {
        nameLine.textContent = ((c.first_name || '') + ' ' + (c.last_name || '')).trim();
      }
      var addrBox = document.getElementById('acc-addr-box');
      if (addrBox && c.address_line) {
        addrBox.innerHTML =
          '<div>' + CW.esc(c.address_line) + '</div>' +
          '<div>' + CW.esc((c.postcode || '') + ' ' + (c.city || '')) + '</div>';
      }
    }).catch(function () { /* kartice ostaju na onome što JWT zna */ });
  });

  var body =
    '<div class="stack stack-4">' +

      '<div>' +
        '<div class="row row--between mb-3">' +
          '<h2 class="t-h3">Nedavne porudžbine</h2>' +
          '<a class="link-arrow" href="#/nalog/porudzbine">Sve porudžbine ' + CW.icon('arrowR', 15) + '</a>' +
        '</div>' +
        '<div id="acc-recent-orders" class="stack stack-2">' +
          '<div class="card"><div class="card__body"><div class="skeleton skeleton--line" style="width:40%"></div></div></div>' +
        '</div>' +
      '</div>' +

      '<div class="grid grid--2">' +
        '<div class="card"><div class="card__body">' +
          '<div class="row row--between">' +
            '<div class="t-eyebrow t-eyebrow--gold">Adresa za dostavu</div>' +
            '<a class="t-xs link-underline" href="#/nalog/podaci">Izmeni</a>' +
          '</div>' +
          '<p class="t-sm mt-2" id="acc-addr-box">Još nema sačuvane adrese.</p>' +
        '</div></div>' +

        '<div class="card"><div class="card__body">' +
          '<div class="row row--between">' +
            '<div class="t-eyebrow t-eyebrow--gold">Lični podaci</div>' +
            '<a class="t-xs link-underline" href="#/nalog/podaci">Izmeni</a>' +
          '</div>' +
          '<div class="spec-list mt-2">' +
            '<div class="spec-list__row"><span class="spec-list__k">Ime</span><span class="spec-list__v" id="acc-name-line">' + CW.esc((user.firstName + ' ' + user.lastName).trim() || '—') + '</span></div>' +
            '<div class="spec-list__row"><span class="spec-list__k">Imejl</span><span class="spec-list__v">' + CW.esc(user.email) + '</span></div>' +
          '</div>' +
        '</div></div>' +
      '</div>' +

      (wish.length ?
      '<div>' +
        '<div class="row row--between mb-3">' +
          '<h2 class="t-h3">Sa liste želja</h2>' +
          '<a class="link-arrow" href="#/nalog/lista-zelja">Vidi sve ' + CW.icon('arrowR', 15) + '</a>' +
        '</div>' +
        '<div class="product-grid">' + wish.slice(0, 3).map(CW.c.productCard).join('') + '</div>' +
      '</div>' : '') +
    '</div>';

  return CW.pages._accountShell('/nalog', 'Moj nalog', body);
};

/* Iznos je u parama/centima; formatira se po valuti PORUDŽBINE, ne po
   valuti sajta — jedan kupac može imati porudžbinu u RSD i drugu u EUR. */
CW.pages._orderMoney = function (minor, currency) {
  var v = ((minor || 0) / 100).toFixed(2).split('.');
  var whole = v[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return currency === 'EUR' ? '€' + whole + ',' + v[1] : whole + ',' + v[1] + ' RSD';
};

/* Realni statusi (pending_payment/confirmed/processing/shipped/delivered/
   cancelled/refunded) mapiraju se na četiri postojeća CSS tona — nema
   posebne boje za svaki, pa se najbliži ton ponovo koristi. */
CW.pages._orderTone = {
  pending_payment: 'order-status--processing',
  confirmed:       'order-status--processing',
  processing:      'order-status--processing',
  shipped:         'order-status--transit',
  delivered:        'order-status--delivered',
  cancelled:        'order-status--cancelled',
  refunded:         'order-status--cancelled'
};

CW.pages._orderRow = function (o) {
  var label = (CW.api.orderStatuses && CW.api.orderStatuses[o.status]) || o.status;
  var cls = CW.pages._orderTone[o.status] || 'order-status--processing';

  return '<a class="card card--link" href="#/nalog/porudzbine/' + encodeURIComponent(o.id) + '">' +
    '<div class="card__body" style="gap:var(--space-2)">' +
      '<div class="row row--between row--wrap" style="gap:12px">' +
        '<div>' +
          '<div class="t-h4">' + CW.esc(o.order_number) + '</div>' +
          '<div class="t-xs mt-1">' + CW.fmtDate(o.created_at, 'short') + '</div>' +
        '</div>' +
        '<div class="row" style="gap:16px">' +
          '<span class="order-status ' + cls + '">' + CW.esc(label) + '</span>' +
          '<span class="t-price" style="font-size:1.25rem">' + CW.pages._orderMoney(o.total, o.currency) + '</span>' +
          CW.icon('chevronR', 18) +
        '</div>' +
      '</div>' +
    '</div>' +
  '</a>';
};

/* ==========================================================================
   PERSONAL INFORMATION
   ========================================================================== */
CW.pages.accountDetails = function () {
  var user = CW.store.user();
  if (!user) return CW.pages._requireAuth('/account/details');

  /* Ime/prezime sa JWT-a (ako ih ima) su samo početna vrednost — pravi
     izvor je red u customers, koji stiže tek posle prijave (async). */
  CW.onMount(function () {
    var form = document.querySelector('[data-form="account-details"]');
    if (!form) return;
    CW.sb.auth.customer().then(function (c) {
      if (!c) return;
      if (form.elements.firstName) form.elements.firstName.value = c.first_name || '';
      if (form.elements.lastName) form.elements.lastName.value = c.last_name || '';
      if (form.elements.phone) form.elements.phone.value = c.phone || '';
      if (form.elements.address) form.elements.address.value = c.address_line || '';
      if (form.elements.city) form.elements.city.value = c.city || '';
      if (form.elements.postcode) form.elements.postcode.value = c.postcode || '';
      if (form.elements.country) form.elements.country.value = c.country || 'RS';
      if (form.elements.marketing) form.elements.marketing.checked = Boolean(c.marketing_ok);
    }).catch(function () { /* forma ostaje sa onim što je već upisano */ });
  });

  var body =
    '<form class="card" data-act="details-form" data-form="account-details" novalidate>' +
      '<div class="card__body" style="padding:var(--space-4);gap:var(--space-3)">' +
        '<fieldset class="fieldset">' +
          '<legend class="fieldset__legend">Tvoji podaci</legend>' +
          '<div class="field-row">' +
            '<div class="field">' +
              '<label class="field__label" for="ad-first">Ime <span class="field__req">*</span></label>' +
              '<input class="input" id="ad-first" name="firstName" type="text" required value="' + CW.esc(user.firstName) + '">' +
              '<div class="field__error hidden" data-error-for="ad-first"></div>' +
            '</div>' +
            '<div class="field">' +
              '<label class="field__label" for="ad-last">Prezime <span class="field__req">*</span></label>' +
              '<input class="input" id="ad-last" name="lastName" type="text" required value="' + CW.esc(user.lastName) + '">' +
              '<div class="field__error hidden" data-error-for="ad-last"></div>' +
            '</div>' +
          '</div>' +
          '<div class="field">' +
            '<label class="field__label" for="ad-email">Imejl adresa</label>' +
            '<input class="input" id="ad-email" name="email" type="email" value="' + CW.esc(user.email) + '" disabled>' +
            '<div class="field__hint">Za promenu imejla obrati se podršci.</div>' +
          '</div>' +
          '<div class="field">' +
            '<label class="field__label" for="ad-phone">Telefon</label>' +
            '<input class="input" id="ad-phone" name="phone" type="tel" autocomplete="tel">' +
          '</div>' +
        '</fieldset>' +

        '<hr class="divider-line">' +

        '<fieldset class="fieldset">' +
          '<legend class="fieldset__legend">Adresa za dostavu</legend>' +
          '<p class="t-xs mb-2">Ovo se koristi da se kasa sama popuni pri sledećoj porudžbini.</p>' +
          '<div class="field">' +
            '<label class="field__label" for="ad-addr">Adresa</label>' +
            '<input class="input" id="ad-addr" name="address" type="text" autocomplete="address-line1">' +
          '</div>' +
          '<div class="field-row--3 field-row">' +
            '<div class="field">' +
              '<label class="field__label" for="ad-city">Grad</label>' +
              '<input class="input" id="ad-city" name="city" type="text" autocomplete="address-level2">' +
            '</div>' +
            '<div class="field">' +
              '<label class="field__label" for="ad-post">Poštanski broj</label>' +
              '<input class="input" id="ad-post" name="postcode" type="text" autocomplete="postal-code">' +
            '</div>' +
            '<div class="field">' +
              '<label class="field__label" for="ad-country">Država</label>' +
              '<select class="select" id="ad-country" name="country" autocomplete="country">' +
                [['RS', 'Srbija'], ['HR', 'Hrvatska'], ['BA', 'Bosna i Hercegovina'], ['ME', 'Crna Gora'],
                 ['MK', 'Severna Makedonija'], ['SI', 'Slovenija']].map(function (c) {
                  return '<option value="' + c[0] + '">' + CW.esc(c[1]) + '</option>';
                }).join('') +
              '</select>' +
            '</div>' +
          '</div>' +
        '</fieldset>' +

        '<hr class="divider-line">' +

        '<fieldset class="fieldset">' +
          '<legend class="fieldset__legend">Promena lozinke</legend>' +
          '<p class="t-xs mb-2">Ostavi prazno ako ne menjaš lozinku.</p>' +
          '<div class="field">' +
            '<label class="field__label" for="ad-current">Trenutna lozinka</label>' +
            '<input class="input" id="ad-current" name="current" type="password" autocomplete="current-password">' +
          '</div>' +
          '<div class="field-row">' +
            '<div class="field">' +
              '<label class="field__label" for="ad-new">Nova lozinka</label>' +
              '<input class="input" id="ad-new" name="new" type="password" autocomplete="new-password">' +
            '</div>' +
            '<div class="field">' +
              '<label class="field__label" for="ad-confirm">Potvrdi novu lozinku</label>' +
              '<input class="input" id="ad-confirm" name="confirm" type="password" autocomplete="new-password">' +
            '</div>' +
          '</div>' +
        '</fieldset>' +

        '<hr class="divider-line">' +

        '<fieldset class="fieldset">' +
          '<legend class="fieldset__legend">Mejl obaveštenja</legend>' +
          '<label class="check">' +
            '<input type="checkbox" name="marketing">' +
            '<span class="check__box">' + CW.icon('check', 13) + '</span>' +
            '<span class="check__label">Obaveštavaj me o novim proizvodima i dešavanjima</span></label>' +
        '</fieldset>' +

        '<div class="row form-actions" style="gap:10px">' +
          '<button class="btn btn--primary btn--lg" type="submit">Sačuvaj izmene</button>' +
        '</div>' +
        '<div data-form-status role="status" aria-live="polite"></div>' +
      '</div>' +
    '</form>';

  return CW.pages._accountShell('/nalog/podaci', 'Lični podaci', body);
};

/* ==========================================================================
   ADDRESSES
   ========================================================================== */
CW.pages.accountAddresses = function () {
  var user = CW.store.user();
  if (!user) return CW.pages._requireAuth('/account/addresses');
  var addrs = CW.data.demoAccount.addresses;

  var body =
    '<div class="stack stack-3">' +
      '<div class="row row--between">' +
        '<h2 class="t-h3">Saved addresses</h2>' +
        '<button class="btn btn--secondary" type="button" data-act="add-address">' + CW.icon('plus', 16) + 'Add address</button>' +
      '</div>' +

      (addrs.length
        ? '<div class="grid grid--2">' + addrs.map(function (a) {
            return '<div class="card' + (a.isDefault ? ' card--featured' : '') + '"><div class="card__body">' +
              '<div class="row row--between">' +
                '<span class="badge ' + (a.isDefault ? 'badge--gold' : 'badge--neutral') + '">' + CW.esc(a.label) + (a.isDefault ? ' · Default' : '') + '</span>' +
              '</div>' +
              '<div class="t-sm mt-2">' +
                '<div class="t-offwhite" style="font-weight:600">' + CW.esc(a.name) + '</div>' +
                '<div>' + CW.esc(a.line1) + '</div>' +
                (a.line2 ? '<div>' + CW.esc(a.line2) + '</div>' : '') +
                '<div>' + CW.esc(a.postcode + ' ' + a.city) + '</div>' +
                '<div>' + CW.esc(a.country) + '</div>' +
                '<div class="mt-1">' + CW.esc(a.phone) + '</div>' +
              '</div>' +
              '<div class="row mt-3" style="gap:8px">' +
                '<button class="btn btn--quiet btn--sm" type="button" data-act="edit-address">Edit</button>' +
                (a.isDefault ? '' : '<button class="btn btn--ghost btn--sm" type="button" data-act="set-default-address">Set as default</button>') +
                (a.isDefault ? '' : '<button class="btn btn--ghost btn--sm" type="button" data-act="delete-address" style="color:var(--color-error)">Delete</button>') +
              '</div>' +
            '</div></div>';
          }).join('') + '</div>'
        : CW.c.empty({
            icon: 'pin', title: 'No saved addresses',
            text: 'Save an address and checkout gets a lot faster next time.',
            actions: '<button class="btn btn--primary" type="button" data-act="add-address">Add your first address</button>'
          })) +
    '</div>';

  return CW.pages._accountShell('/nalog/adrese', 'Sačuvane adrese', body);
};

/* ==========================================================================
   ORDER HISTORY
   ========================================================================== */
CW.pages.accountOrders = function () {
  var user = CW.store.user();
  if (!user) return CW.pages._requireAuth('/account/orders');

  CW.onMount(function () {
    var host = document.getElementById('acc-ord-list');
    if (!host) return;
    CW.api.orders.all().then(function (rows) {
      host.innerHTML = rows.length
        ? '<div class="stack stack-2">' + rows.map(CW.pages._orderRow).join('') + '</div>'
        : CW.c.empty({
            icon: 'package', title: 'Još nema porudžbina',
            text: 'Kad naručiš, porudžbina će se pojaviti ovde, sa statusom i praćenjem.',
            actions: '<a class="btn btn--primary" href="#/shop">Otvori shop</a>'
          });
    }).catch(function (e) {
      host.innerHTML = CW.c.empty({ icon: 'alert', title: 'Ne mogu da učitam porudžbine', text: e.message });
    });
  });

  var skelRow = '<div class="card"><div class="card__body">' +
    '<div class="skeleton skeleton--line" style="width:40%"></div>' +
    '<div class="skeleton skeleton--line-short mt-2"></div>' +
  '</div></div>';

  var body = '<div id="acc-ord-list" class="stack stack-2">' + skelRow + skelRow + '</div>';

  return CW.pages._accountShell('/nalog/porudzbine', 'Porudžbine', body);
};

/* ==========================================================================
   ORDER DETAIL
   ========================================================================== */
CW.pages.accountOrder = function (ctx) {
  var user = CW.store.user();
  if (!user) return CW.pages._requireAuth('/account/orders');
  var id = ctx.params.id;

  CW.onMount(function () {
    var host = document.getElementById('acc-ord-body');
    if (!host) return;

    CW.api.orders.get(id).then(function (o) {
      paint(o);
      return CW.api.orders.events(id);
    }).then(function (events) {
      var h = document.getElementById('acc-ord-events');
      if (!h) return;
      h.innerHTML = events && events.length
        ? events.map(function (e) {
            var lbl = (CW.api.orderStatuses && CW.api.orderStatuses[e.to_status]) || e.to_status;
            return '<div class="row row--between" style="padding:4px 0">' +
              '<span class="t-sm">' + CW.esc(lbl) + '</span>' +
              '<span class="t-xs t-muted">' + CW.fmtDate(e.created_at, 'short') + '</span></div>';
          }).join('')
        : '<p class="t-sm">Nema promena statusa.</p>';
    }).catch(function (e) {
      host.innerHTML = CW.c.empty({
        icon: 'package', title: 'Porudžbina nije pronađena',
        text: e.message || 'Proveri da li je adresa tačna.',
        actions: '<a class="btn btn--primary" href="#/nalog/porudzbine">Nazad na porudžbine</a>'
      });
    });

    function paint(o) {
      var money = CW.pages._orderMoney;
      var cls = CW.pages._orderTone[o.status] || 'order-status--processing';
      var label = (CW.api.orderStatuses && CW.api.orderStatuses[o.status]) || o.status;

      var items = (o.items || []).map(function (i) {
        return '<div class="line-item">' +
          '<div class="stack stack-1">' +
            '<div class="line-item__title">' + CW.esc(i.name) +
              (i.variant ? ' <span class="t-muted">· ' + CW.esc(i.variant) + '</span>' : '') + '</div>' +
            '<div class="line-item__variant">Količina ' + i.quantity + '</div>' +
          '</div>' +
          '<div class="line-item__right"><div class="t-price" style="font-size:1.125rem">' + money(i.line_total, o.currency) + '</div></div>' +
        '</div>';
      }).join('');

      host.innerHTML =
        '<div class="stack stack-4">' +
          '<a class="link-arrow" href="#/nalog/porudzbine">' + CW.icon('arrowL', 15) + ' Nazad na porudžbine</a>' +

          '<div class="card"><div class="card__body" style="padding:var(--space-4)">' +
            '<div class="row row--between row--wrap" style="gap:12px">' +
              '<div><h2 class="t-h2">' + CW.esc(o.order_number) + '</h2>' +
              '<div class="t-sm mt-1">' + CW.fmtDate(o.created_at, 'long') + '</div></div>' +
              '<div class="text-center">' +
                '<span class="order-status ' + cls + '">' + CW.esc(label) + '</span>' +
                '<div class="t-price mt-1" style="font-size:1.75rem">' + money(o.total, o.currency) + '</div>' +
              '</div>' +
            '</div>' +

            (o.tracking_number
              ? '<div class="alert alert--gold mt-3">' + CW.icon('truck', 18) +
                '<span>Broj pošiljke <b>' + CW.esc(o.tracking_number) + '</b></span></div>'
              : (o.status === 'shipped' || o.status === 'delivered' ? '' :
                 '<div class="alert alert--info mt-3">' + CW.icon('clock', 18) +
                 '<span>Još nije poslata. Broj pošiljke će se pojaviti ovde čim krene.</span></div>')) +

            '<hr class="divider-line">' +
            '<div class="t-eyebrow t-eyebrow--gold">Istorija</div>' +
            '<div class="mt-2" id="acc-ord-events"><p class="t-sm">Učitavanje…</p></div>' +
          '</div></div>' +

          '<div class="cart-layout">' +
            '<div class="card"><div style="padding:0 var(--space-3)">' + items + '</div></div>' +

            '<aside class="stack stack-3">' +
              '<div class="card"><div class="card__body">' +
                '<div class="t-eyebrow t-eyebrow--gold">Iznos</div>' +
                '<div class="spec-list mt-2">' +
                  '<div class="spec-list__row"><span class="spec-list__k">Međuzbir</span><span class="spec-list__v">' + money(o.subtotal, o.currency) + '</span></div>' +
                  (o.discount ? '<div class="spec-list__row"><span class="spec-list__k">Popust</span><span class="spec-list__v t-gold">−' + money(o.discount, o.currency) + '</span></div>' : '') +
                  '<div class="spec-list__row"><span class="spec-list__k">Dostava</span><span class="spec-list__v">' + (o.shipping_cost ? money(o.shipping_cost, o.currency) : 'Besplatno') + '</span></div>' +
                  '<div class="spec-list__row spec-list__row--total"><span class="spec-list__k">Ukupno</span><span class="spec-list__v">' + money(o.total, o.currency) + '</span></div>' +
                '</div>' +
              '</div></div>' +

              '<div class="card"><div class="card__body">' +
                '<div class="t-eyebrow t-eyebrow--gold">Dostava</div>' +
                '<div class="t-sm mt-2">' +
                  (o.address_line
                    ? '<div class="t-offwhite">' + CW.esc(o.first_name + ' ' + o.last_name) + '</div>' +
                      '<div>' + CW.esc(o.address_line) + '</div>' +
                      '<div>' + CW.esc((o.postcode || '') + ' ' + (o.city || '')) + '</div>' +
                      '<div>' + CW.esc(o.country || '') + '</div>'
                    : '<span class="t-muted">Digitalna isporuka — na imejl.</span>') +
                '</div>' +
              '</div></div>' +

              '<div class="card"><div class="card__body">' +
                '<div class="t-eyebrow t-eyebrow--gold">Treba ti pomoć?</div>' +
                '<p class="t-sm mt-2">Navedi broj porudžbine ' + CW.esc(o.order_number) + ' i brzo je nalazimo.</p>' +
                '<a class="btn btn--quiet btn--full mt-2" href="#/contact?topic=merch">Kontaktiraj prodavnicu</a>' +
              '</div></div>' +
            '</aside>' +
          '</div>' +
        '</div>';
    }
  });

  var body = '<div id="acc-ord-body"><div class="card"><div class="card__body">' +
    '<div class="skeleton skeleton--line" style="width:30%"></div>' +
    '<div class="skeleton skeleton--line-short mt-2"></div>' +
  '</div></div></div>';

  return CW.pages._accountShell('/nalog/porudzbine', 'Porudžbina', body);
};

/* ==========================================================================
   WISHLIST
   ========================================================================== */
CW.pages.wishlist = function () {
  var items = CW.store.wishlist().map(CW.product).filter(Boolean);

  var body = items.length
    ? '<div class="stack stack-3">' +
        '<div class="row row--between row--wrap" style="gap:12px">' +
          '<span class="toolbar__count">' + items.length + ' saved item' + (items.length === 1 ? '' : 's') + '</span>' +
          '<a class="btn btn--quiet btn--sm" href="#/shop">Continue shopping</a>' +
        '</div>' +
        '<div class="product-grid">' + items.map(CW.c.productCard).join('') + '</div>' +
      '</div>'
    : CW.c.empty({
        icon: 'heart', title: 'Lista želja je prazna',
        text: 'Klikni na srce na proizvodu da ga sačuvaš ovde.',
        actions: '<a class="btn btn--primary btn--lg" href="#/shop">Otvori shop</a>'
      });

  /* Wishlist is intentionally readable while signed out — it lives in the
     browser until the visitor creates an account. */
  if (!CW.store.user()) {
    return '' +
      '<section class="page-hero"><div class="container container--wide page-hero__inner">' +
        CW.c.crumbs([{ label: 'Početna', path: '/' }, { label: 'Lista želja', path: '/account/wishlist' }]) +
        '<h1 class="t-h1 mt-2">Lista želja</h1>' +
        '<p class="t-lead mt-2">Saved on this device. <a class="link-underline" href="#/account/register">Napravi nalog</a> to keep it across devices.</p>' +
      '</div></section>' +
      '<section class="section container container--wide">' + body + '</section>';
  }

  return CW.pages._accountShell('/nalog/lista-zelja', 'Lista želja', body);
};

/* ==========================================================================
   FAQ
   ========================================================================== */
CW.pages.faq = function (ctx) {
  var catF = ctx.query.category || 'all';
  var term = (ctx.query.q || '').toLowerCase();

  var list = CW.data.faqs.filter(function (f) {
    if (catF !== 'all' && f.categoryId !== catF) return false;
    if (term && (f.q + ' ' + f.a).toLowerCase().indexOf(term) === -1) return false;
    return true;
  });

  var byCat = {};
  list.forEach(function (f) { (byCat[f.categoryId] = byCat[f.categoryId] || []).push(f); });

  return '' +
  '<section class="page-hero">' +
    '<div class="container container--wide page-hero__inner">' +
      CW.c.crumbs([{ label: 'Početna', path: '/' }, { label: 'Help & FAQ', path: '/faq' }]) +
      '<h1 class="t-h1 mt-2">Help &amp; FAQ</h1>' +
      '<p class="t-lead mt-2">Orders, sizing, returns and how the community works. If it is not here, the Discord answers faster than email.</p>' +

      '<form class="input-wrap mt-4" data-act="faq-search" style="max-width:460px">' +
        CW.icon('search', 18) +
        '<label class="visually-hidden" for="faq-q">Search help articles</label>' +
        '<input class="input" id="faq-q" name="q" type="search" placeholder="Search for an answer…" value="' + CW.esc(ctx.query.q || '') + '">' +
      '</form>' +
    '</div>' +
  '</section>' +

  '<section class="section container container--wide">' +
    '<div class="faq-layout">' +
      '<aside class="legal-toc">' +
        '<div class="t-eyebrow t-eyebrow--gold mb-2">Categories</div>' +
        '<a class="legal-toc__link' + (catF === 'all' ? ' is-active' : '') + '" href="#/faq"' +
          (catF === 'all' ? ' style="color:var(--color-gold);border-color:var(--color-gold)"' : '') + '>All questions</a>' +
        CW.data.faqCategories.map(function (c) {
          var on = catF === c.id;
          return '<a class="legal-toc__link" href="#/faq?category=' + c.id + '"' +
            (on ? ' style="color:var(--color-gold);border-color:var(--color-gold)"' : '') + '>' + CW.esc(c.name) + '</a>';
        }).join('') +

        '<div class="card mt-4"><div class="card__body">' +
          '<div class="t-eyebrow t-eyebrow--gold">Still stuck?</div>' +
          '<p class="t-sm mt-2">Two working days by email, minutes in the Discord.</p>' +
          '<a class="btn btn--secondary btn--full mt-2" href="#/contact">Contact us</a>' +
        '</div></div>' +
      '</aside>' +

      '<div>' +
        (!list.length
          ? CW.c.empty({
              icon: 'search', title: 'No answers found',
              text: 'Nothing matches “' + (ctx.query.q || '') + '”. Try a different word, or ask us directly.',
              actions: '<a class="btn btn--secondary" href="#/faq">Clear search</a><a class="btn btn--primary" href="#/contact">Contact us</a>'
            })
          : Object.keys(byCat).map(function (cid) {
              var c = CW.find('faqCategories', cid) || { name: '' };
              return '<div class="mb-5">' +
                '<h2 class="t-h2 mb-3">' + CW.esc(c.name) + '</h2>' +
                CW.pages._accordion(byCat[cid]) +
              '</div>';
            }).join('')) +

        '<div class="mt-5">' +
          '<h2 class="t-h2 mb-3">Size guides</h2>' +
          Object.keys(CW.data.sizeGuides).map(function (key) {
            var g = CW.data.sizeGuides[key];
            return '<div class="mb-4">' +
              '<h3 class="t-h3 mb-2">' + CW.esc(g.label) + '</h3>' +
              '<div class="table__wrap"><table class="table">' +
                '<thead><tr>' + g.cols.map(function (col) { return '<th>' + CW.esc(col) + '</th>'; }).join('') + '</tr></thead>' +
                '<tbody>' + g.rows.map(function (r) {
                  return '<tr>' + r.map(function (cell, i) {
                    return '<td' + (i === 0 ? ' class="t-offwhite"' : '') + '>' + CW.esc(cell) + '</td>';
                  }).join('') + '</tr>';
                }).join('') + '</tbody>' +
              '</table></div>' +
              '<p class="t-xs mt-2">' + CW.esc(g.note) + '</p>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</div>' +
  '</section>';
};

/* ==========================================================================
   POLICY PAGES (shipping, returns, privacy, terms, cookies)
   ========================================================================== */
CW.pages.policy = function (key) {
  return function () {
    var p = CW.data.policies[key];
    if (!p) return CW.pages.notFound();

    return '' +
    '<section class="page-hero">' +
      '<div class="container container--wide page-hero__inner">' +
        CW.c.crumbs([{ label: 'Početna', path: '/' }, { label: p.title, path: '' }]) +
        '<h1 class="t-h1 mt-2">' + CW.esc(p.title) + '</h1>' +
        '<p class="t-lead mt-2">' + CW.esc(p.intro) + '</p>' +
        '<div class="row row--wrap mt-3" style="gap:10px">' +
          '<span class="badge badge--neutral">Last updated ' + CW.fmtDate(p.updated, 'short') + '</span>' +
          (p.needsReview ? '<span class="review-flag">' + CW.icon('alert', 14) + 'Requires legal review before launch</span>' : '') +
        '</div>' +
      '</div>' +
    '</section>' +

    '<section class="section container container--wide">' +
      '<div class="legal-layout">' +
        '<aside class="legal-toc">' +
          '<div class="t-eyebrow t-eyebrow--gold mb-2">On this page</div>' +
          /* Buttons rather than anchors: an in-page #hash would be captured
             by the hash router and navigate away from this page. */
          p.sections.map(function (s) {
            return '<button class="legal-toc__link" type="button" data-act="scroll-to" data-target="' + s.id + '" ' +
              'style="text-align:left;width:100%">' + CW.esc(s.title) + '</button>';
          }).join('') +

          '<div class="card mt-4"><div class="card__body">' +
            '<div class="t-eyebrow t-eyebrow--gold">Questions?</div>' +
            '<p class="t-sm mt-2">If anything here is unclear, ask — we would rather explain it than have you guess.</p>' +
            '<a class="btn btn--secondary btn--full mt-2" href="#/contact">Contact us</a>' +
          '</div></div>' +
        '</aside>' +

        '<div>' +
          (p.needsReview ?
          '<div class="alert alert--warning mb-4">' + CW.icon('alert', 18) +
            '<div><b>Placeholder content — legal review required.</b>' +
            '<div class="mt-1">' + CW.esc(p.reviewNote) + '</div></div></div>' : '') +

          '<div class="prose">' +
            p.sections.map(function (s) {
              return '<h2 id="' + s.id + '">' + CW.esc(s.title) + '</h2>' +
                s.body.map(function (b) {
                  var isPlaceholder = b.indexOf('PLACEHOLDER') === 0;
                  return isPlaceholder
                    ? '<p><span class="review-flag">' + CW.icon('alert', 13) + 'To be completed</span> ' +
                      CW.esc(b.replace(/^PLACEHOLDER:\s*/, '')) + '</p>'
                    : '<p>' + CW.esc(b) + '</p>';
                }).join('');
            }).join('') +
          '</div>' +

          '<div class="mt-5">' +
            '<div class="grid grid--2">' +
              '<a class="card card--link" href="#/faq"><div class="card__body">' +
                '<div class="t-eyebrow t-eyebrow--gold">Related</div>' +
                '<h3 class="t-h3">Help &amp; FAQ</h3>' +
                '<p class="t-sm">Most questions are answered there first.</p></div></a>' +
              '<a class="card card--link" href="#/contact"><div class="card__body">' +
                '<div class="t-eyebrow t-eyebrow--gold">Related</div>' +
                '<h3 class="t-h3">Contact us</h3>' +
                '<p class="t-sm">Two working days by email.</p></div></a>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>';
  };
};

/* ==========================================================================
   404
   ========================================================================== */
CW.pages.notFound = function () {
  return '' +
  '<section class="container container--wide">' +
    '<div class="notfound">' +
      '<div class="notfound__code">404</div>' +
      '<div class="t-eyebrow t-eyebrow--gold">Stranica nije pronađena</div>' +
      '<h1 class="t-h1 mt-2">Trag se ohladio.</h1>' +
      '<p class="t-lead mx-auto mt-3" style="max-width:48ch">Stranica koju tražiš ne postoji, premeštena je, ili nikad nije izašla iz draft kanala. Evo puta nazad.</p>' +
      '<div class="notfound__links">' +
        '<a class="btn btn--primary btn--lg" href="#/">Nazad na početnu</a>' +
        '<a class="btn btn--secondary btn--lg" href="#/shop">Otvori shop</a>' +
        '<button class="btn btn--quiet btn--lg" type="button" data-act="open-search">' + CW.icon('search', 17) + 'Pretraži sajt</button>' +
      '</div>' +
    '</div>' +
  '</section>' +

  '<section class="section container container--wide">' +
    '<div class="grid grid--4">' +
      [
        { t: 'Usluge',    p: '/usluge',    d: 'Sedam oblasti u kojima radimo', i: 'zap' },
        { t: 'Zajednica', p: '/zajednica', d: 'Discord, pravila i kako se uključiti', i: 'discord' },
        { t: 'CS2 tim',   p: '/cs2',       d: 'Prijave su otvorene', i: 'target' },
        { t: 'Vesti',     p: '/vesti',     d: 'Objave i najave', i: 'book' }
      ].map(function (l) {
        return '<a class="card card--link" href="#' + l.p + '"><div class="card__body">' +
          '<div class="benefit__icon">' + CW.icon(l.i, 20) + '</div>' +
          '<h3 class="t-h3">' + CW.esc(l.t) + '</h3>' +
          '<p class="t-sm">' + CW.esc(l.d) + '</p></div></a>';
      }).join('') +
    '</div>' +
  '</section>';
};
