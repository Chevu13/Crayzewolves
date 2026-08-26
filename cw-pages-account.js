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
  var orderCount = CW.data.demoAccount.orders.length;

  var links = [
    { path: '/nalog',             label: 'Pregled',        icon: 'home' },
    { path: '/nalog/podaci',      label: 'Lični podaci',   icon: 'user' },
    { path: '/nalog/adrese',      label: 'Sačuvane adrese',icon: 'pin' },
    { path: '/nalog/porudzbine',  label: 'Porudžbine',     icon: 'package', count: orderCount },
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

      '<div class="alert alert--info mt-3">' + CW.icon('info', 16) +
        '<span>Demo verzija — prijavljuje te svaka ispravna imejl adresa i lozinka od šest ili više znakova.</span></div>' +

      '<div class="divider"><span class="divider__mark"></span></div>' +

      '<p class="t-sm text-center">New here? <a class="link-underline" href="#/account/register">Napravi nalog</a></p>' +
      '<p class="t-xs text-center mt-2">Nalog nije obavezan za kupovinu, ali olakšava praćenje porudžbina.</p>' +
    '</div>' +
  '</section>';
};

/* ==========================================================================
   REGISTER
   ========================================================================== */
CW.pages.register = function () {
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
            '<label class="field__label" for="rg-first">First name <span class="field__req">*</span></label>' +
            '<input class="input" id="rg-first" name="firstName" type="text" autocomplete="given-name" required>' +
            '<div class="field__error hidden" data-error-for="rg-first"></div>' +
          '</div>' +
          '<div class="field">' +
            '<label class="field__label" for="rg-last">Last name <span class="field__req">*</span></label>' +
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
          '<label class="field__label" for="rg-pass">Password <span class="field__req">*</span></label>' +
          '<input class="input" id="rg-pass" name="password" type="password" autocomplete="new-password" required>' +
          '<div class="field__hint">At least eight characters. Longer is better than complicated.</div>' +
          '<div class="field__error hidden" data-error-for="rg-pass"></div>' +
        '</div>' +

        '<div class="field">' +
          '<label class="field__label" for="rg-confirm">Confirm password <span class="field__req">*</span></label>' +
          '<input class="input" id="rg-confirm" name="confirm" type="password" autocomplete="new-password" required>' +
          '<div class="field__error hidden" data-error-for="rg-confirm"></div>' +
        '</div>' +

        '<label class="check">' +
          '<input type="checkbox" name="terms" required>' +
          '<span class="check__box">' + CW.icon('check', 13) + '</span>' +
          '<span class="check__label">I accept the <a class="link-underline" href="#/terms">Terms &amp; Conditions</a> and the <a class="link-underline" href="#/privacy">Privacy Policy</a>. <span class="field__req">*</span></span>' +
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
        '<h1 class="t-h2 mt-3">Reset your password</h1>' +
        '<p class="t-sm mt-2">Enter the email on your account and we will send a reset link. It expires in one hour.</p>' +
      '</div>' +

      '<form class="stack stack-3 mt-4" data-act="forgot-form" novalidate>' +
        '<div class="field">' +
          '<label class="field__label" for="fp-email">Imejl adresa <span class="field__req">*</span></label>' +
          '<input class="input" id="fp-email" name="email" type="email" autocomplete="email" required>' +
          '<div class="field__error hidden" data-error-for="fp-email"></div>' +
        '</div>' +
        '<button class="btn btn--primary btn--lg btn--full" type="submit">Send reset link</button>' +
        '<div data-form-status role="status" aria-live="polite"></div>' +
      '</form>' +

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

  var demo = CW.data.demoAccount;
  var recent = demo.orders.slice(0, 2);
  var wish = CW.store.wishlist().map(CW.product).filter(Boolean);
  var addr = demo.addresses.filter(function (a) { return a.isDefault; })[0];

  var body =
    '<div class="stack stack-4">' +

      '<div class="alert alert--gold">' + CW.icon('discord', 18) +
        '<span>Your Discord handle is linked as <b>' + CW.esc(demo.discordHandle) + '</b>. ' +
        'Member since ' + CW.fmtDate(demo.memberSince, 'short') + '.</span></div>' +

      '<div class="grid grid--3">' +
        '<div class="stat-cell card"><div class="stat-cell__num">' + demo.orders.length + '</div><div class="stat-cell__lbl">Orders placed</div></div>' +
        '<div class="stat-cell card"><div class="stat-cell__num">' + wish.length + '</div><div class="stat-cell__lbl">Wishlist items</div></div>' +
        '<div class="stat-cell card"><div class="stat-cell__num">' + demo.addresses.length + '</div><div class="stat-cell__lbl">Saved addresses</div></div>' +
      '</div>' +

      '<div>' +
        '<div class="row row--between mb-3">' +
          '<h2 class="t-h3">Recent orders</h2>' +
          '<a class="link-arrow" href="#/account/orders">All orders ' + CW.icon('arrowR', 15) + '</a>' +
        '</div>' +
        '<div class="stack stack-2">' + recent.map(CW.pages._orderRow).join('') + '</div>' +
      '</div>' +

      '<div class="grid grid--2">' +
        '<div class="card"><div class="card__body">' +
          '<div class="row row--between">' +
            '<div class="t-eyebrow t-eyebrow--gold">Default address</div>' +
            '<a class="t-xs link-underline" href="#/account/addresses">Edit</a>' +
          '</div>' +
          (addr ?
            '<div class="t-sm mt-2">' +
              '<div class="t-offwhite">' + CW.esc(addr.name) + '</div>' +
              '<div>' + CW.esc(addr.line1) + '</div>' +
              (addr.line2 ? '<div>' + CW.esc(addr.line2) + '</div>' : '') +
              '<div>' + CW.esc(addr.postcode + ' ' + addr.city) + '</div>' +
              '<div>' + CW.esc(addr.country) + '</div>' +
            '</div>' : '<p class="t-sm mt-2">No address saved yet.</p>') +
        '</div></div>' +

        '<div class="card"><div class="card__body">' +
          '<div class="row row--between">' +
            '<div class="t-eyebrow t-eyebrow--gold">Personal information</div>' +
            '<a class="t-xs link-underline" href="#/account/details">Edit</a>' +
          '</div>' +
          '<div class="spec-list mt-2">' +
            '<div class="spec-list__row"><span class="spec-list__k">Name</span><span class="spec-list__v">' + CW.esc(user.firstName + ' ' + user.lastName) + '</span></div>' +
            '<div class="spec-list__row"><span class="spec-list__k">Email</span><span class="spec-list__v">' + CW.esc(user.email) + '</span></div>' +
            '<div class="spec-list__row"><span class="spec-list__k">Phone</span><span class="spec-list__v">' + CW.esc(demo.phone) + '</span></div>' +
          '</div>' +
        '</div></div>' +
      '</div>' +

      (wish.length ?
      '<div>' +
        '<div class="row row--between mb-3">' +
          '<h2 class="t-h3">From your wishlist</h2>' +
          '<a class="link-arrow" href="#/account/wishlist">View all ' + CW.icon('arrowR', 15) + '</a>' +
        '</div>' +
        '<div class="product-grid">' + wish.slice(0, 3).map(CW.c.productCard).join('') + '</div>' +
      '</div>' : '') +
    '</div>';

  return CW.pages._accountShell('/nalog', 'Moj nalog', body);
};

CW.pages._orderRow = function (o) {
  var statusMap = {
    delivered:  { cls: 'order-status--delivered',  label: 'Delivered',  icon: 'check' },
    transit:    { cls: 'order-status--transit',    label: 'In transit', icon: 'truck' },
    processing: { cls: 'order-status--processing', label: 'Processing', icon: 'clock' },
    cancelled:  { cls: 'order-status--cancelled',  label: 'Cancelled',  icon: 'x' }
  };
  var s = statusMap[o.status] || statusMap.processing;

  return '<a class="card card--link" href="#/account/orders/' + o.id + '">' +
    '<div class="card__body" style="gap:var(--space-2)">' +
      '<div class="row row--between row--wrap" style="gap:12px">' +
        '<div>' +
          '<div class="t-h4">' + CW.esc(o.id) + '</div>' +
          '<div class="t-xs mt-1">Placed ' + CW.fmtDate(o.date, 'short') + ' · ' + o.items.length + ' item' + (o.items.length === 1 ? '' : 's') + '</div>' +
        '</div>' +
        '<div class="row" style="gap:16px">' +
          '<span class="order-status ' + s.cls + '">' + CW.icon(s.icon, 14) + CW.esc(s.label) + '</span>' +
          '<span class="t-price" style="font-size:1.25rem">' + CW.money(o.total) + '</span>' +
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
  var demo = CW.data.demoAccount;

  var body =
    '<form class="card" data-act="details-form" novalidate>' +
      '<div class="card__body" style="padding:var(--space-4);gap:var(--space-3)">' +
        '<fieldset class="fieldset">' +
          '<legend class="fieldset__legend">Your details</legend>' +
          '<div class="field-row">' +
            '<div class="field">' +
              '<label class="field__label" for="ad-first">First name <span class="field__req">*</span></label>' +
              '<input class="input" id="ad-first" name="firstName" type="text" required value="' + CW.esc(user.firstName) + '">' +
              '<div class="field__error hidden" data-error-for="ad-first"></div>' +
            '</div>' +
            '<div class="field">' +
              '<label class="field__label" for="ad-last">Last name <span class="field__req">*</span></label>' +
              '<input class="input" id="ad-last" name="lastName" type="text" required value="' + CW.esc(user.lastName) + '">' +
              '<div class="field__error hidden" data-error-for="ad-last"></div>' +
            '</div>' +
          '</div>' +
          '<div class="field">' +
            '<label class="field__label" for="ad-email">Imejl adresa <span class="field__req">*</span></label>' +
            '<input class="input" id="ad-email" name="email" type="email" required value="' + CW.esc(user.email) + '">' +
            '<div class="field__error hidden" data-error-for="ad-email"></div>' +
          '</div>' +
          '<div class="field">' +
            '<label class="field__label" for="ad-phone">Phone</label>' +
            '<input class="input" id="ad-phone" name="phone" type="tel" value="' + CW.esc(demo.phone) + '">' +
          '</div>' +
          '<div class="field">' +
            '<label class="field__label" for="ad-discord">Discord handle</label>' +
            '<input class="input" id="ad-discord" name="discord" type="text" value="' + CW.esc(demo.discordHandle) + '">' +
            '<div class="field__hint">Linking your handle lets us match community rewards to your account.</div>' +
          '</div>' +
        '</fieldset>' +

        '<hr class="divider-line">' +

        '<fieldset class="fieldset">' +
          '<legend class="fieldset__legend">Change password</legend>' +
          '<div class="field">' +
            '<label class="field__label" for="ad-current">Current password</label>' +
            '<input class="input" id="ad-current" name="current" type="password" autocomplete="current-password">' +
          '</div>' +
          '<div class="field-row">' +
            '<div class="field">' +
              '<label class="field__label" for="ad-new">New password</label>' +
              '<input class="input" id="ad-new" name="new" type="password" autocomplete="new-password">' +
            '</div>' +
            '<div class="field">' +
              '<label class="field__label" for="ad-confirm">Confirm new password</label>' +
              '<input class="input" id="ad-confirm" name="confirm" type="password" autocomplete="new-password">' +
            '</div>' +
          '</div>' +
        '</fieldset>' +

        '<hr class="divider-line">' +

        '<fieldset class="fieldset">' +
          '<legend class="fieldset__legend">Email preferences</legend>' +
          '<label class="check">' +
            '<input type="checkbox" name="marketing" checked>' +
            '<span class="check__box">' + CW.icon('check', 13) + '</span>' +
            '<span class="check__label">Weekly newsletter — drops, results and open nights</span></label>' +
          '<label class="check">' +
            '<input type="checkbox" name="drops" checked>' +
            '<span class="check__box">' + CW.icon('check', 13) + '</span>' +
            '<span class="check__label">Limited drop alerts — sent the moment a drop goes live</span></label>' +
          '<label class="check">' +
            '<input type="checkbox" name="restock">' +
            '<span class="check__box">' + CW.icon('check', 13) + '</span>' +
            '<span class="check__label">Restock notifications for wishlist items</span></label>' +
        '</fieldset>' +

        '<div class="row form-actions" style="gap:10px">' +
          '<button class="btn btn--primary btn--lg" type="submit">Save changes</button>' +
          '<button class="btn btn--ghost" type="reset">Cancel</button>' +
        '</div>' +
        '<div data-form-status role="status" aria-live="polite"></div>' +
      '</div>' +
    '</form>' +

    '<div class="card mt-4"><div class="card__body">' +
      '<div class="t-eyebrow" style="color:var(--color-error)">Danger zone</div>' +
      '<p class="t-sm mt-2">Deleting your account removes your saved addresses and wishlist. Order records are retained for the period required by tax law.</p>' +
      '<button class="btn btn--danger mt-2" type="button" data-act="delete-account">Delete my account</button>' +
    '</div></div>';

  return CW.pages._accountShell('/account/details', 'Personal information', body);
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

  return CW.pages._accountShell('/account/addresses', 'Saved addresses', body);
};

/* ==========================================================================
   ORDER HISTORY
   ========================================================================== */
CW.pages.accountOrders = function () {
  var user = CW.store.user();
  if (!user) return CW.pages._requireAuth('/account/orders');
  var orders = CW.data.demoAccount.orders.slice();

  var live = CW.store.lastOrder();
  if (live) {
    orders.unshift({
      id: live.id, date: live.date, status: 'processing',
      total: live.totals.total, shipping: live.totals.shipping, discount: live.totals.discount,
      method: (live.details || {}).shippingName || 'Standard Delivery',
      tracking: null, addressId: null,
      items: live.items.map(function (l) {
        return { productId: l.productId, variantId: l.variantId, qty: l.qty, price: CW.product(l.productId).price };
      })
    });
  }

  var body = orders.length
    ? '<div class="stack stack-2">' + orders.map(CW.pages._orderRow).join('') + '</div>'
    : CW.c.empty({
        icon: 'package', title: 'No orders yet',
        text: 'When you place an order it will appear here, with tracking.',
        actions: '<a class="btn btn--primary" href="#/shop">Otvori shop</a>'
      });

  return CW.pages._accountShell('/account/orders', 'Order history', body);
};

/* ==========================================================================
   ORDER DETAIL
   ========================================================================== */
CW.pages.accountOrder = function (ctx) {
  var user = CW.store.user();
  if (!user) return CW.pages._requireAuth('/account/orders');

  var orders = CW.data.demoAccount.orders.slice();
  var live = CW.store.lastOrder();
  if (live) {
    orders.unshift({
      id: live.id, date: live.date, status: 'processing', total: live.totals.total,
      shipping: live.totals.shipping, discount: live.totals.discount,
      method: (live.details || {}).shippingName || 'Standard Delivery', tracking: null, addressId: null,
      items: live.items.map(function (l) {
        return { productId: l.productId, variantId: l.variantId, qty: l.qty, price: CW.product(l.productId).price };
      })
    });
  }

  var o = orders.filter(function (x) { return x.id === ctx.params.id; })[0];
  if (!o) return CW.pages._accountShell('/account/orders', 'Order not found',
    CW.c.empty({ icon: 'package', title: 'Order not found', text: 'We could not find that order number on your account.',
      actions: '<a class="btn btn--primary" href="#/nalog/porudzbine">Nazad na porudžbine</a>' }));

  var addr = CW.data.demoAccount.addresses.filter(function (a) { return a.id === o.addressId; })[0] || CW.data.demoAccount.addresses[0];
  var subtotal = o.items.reduce(function (n, i) { return n + i.price * i.qty; }, 0);

  var steps = [
    { key: 'processing', label: 'Order placed', icon: 'check' },
    { key: 'packed',     label: 'Packed',       icon: 'package' },
    { key: 'transit',    label: 'In transit',   icon: 'truck' },
    { key: 'delivered',  label: 'Delivered',    icon: 'home' }
  ];
  var reached = { processing: 1, packed: 2, transit: 3, delivered: 4 }[o.status] || 1;

  var body =
    '<div class="stack stack-4">' +
      '<a class="link-arrow" href="#/nalog/porudzbine">' + CW.icon('arrowL', 15) + ' Nazad na porudžbine</a>' +

      '<div class="card"><div class="card__body" style="padding:var(--space-4)">' +
        '<div class="row row--between row--wrap" style="gap:12px">' +
          '<div><h2 class="t-h2">' + CW.esc(o.id) + '</h2>' +
          '<div class="t-sm mt-1">Placed ' + CW.fmtDate(o.date, 'long') + '</div></div>' +
          '<div class="text-center"><div class="t-price" style="font-size:1.75rem">' + CW.money(o.total) + '</div>' +
          '<div class="t-label mt-1">Total paid</div></div>' +
        '</div>' +

        '<hr class="divider-line">' +

        '<div class="stepper" style="flex-wrap:wrap;gap:var(--space-2)">' +
          steps.map(function (s, i) {
            var state = i + 1 < reached ? 'is-done' : i + 1 === reached ? 'is-active' : '';
            return '<div class="stepper__step ' + state + '">' +
              '<span class="stepper__num">' + (i + 1 < reached ? CW.icon('check', 13) : (i + 1)) + '</span>' +
              '<span class="stepper__label">' + CW.esc(s.label) + '</span></div>' +
              (i < steps.length - 1 ? '<span class="stepper__bar"></span>' : '');
          }).join('') +
        '</div>' +

        (o.tracking
          ? '<div class="alert alert--gold mt-3">' + CW.icon('truck', 18) +
            '<span>Tracking number <b>' + CW.esc(o.tracking) + '</b> — ' + CW.esc(o.method) + '. ' +
            '<a class="link-underline" href="#">Track this parcel</a></span></div>'
          : '<div class="alert alert--info mt-3">' + CW.icon('clock', 18) +
            '<span>Not dispatched yet. A tracking number will appear here and arrive by email once it ships.</span></div>') +
      '</div></div>' +

      '<div class="cart-layout">' +
        '<div class="card"><div style="padding:0 var(--space-3)">' +
          o.items.map(function (i) {
            var p = CW.product(i.productId);
            if (!p) return '';
            var v = null;
            p.variants.forEach(function (x) { if (x.id === i.variantId) v = x; });
            var c = v ? CW.shopOptions.colors[v.colorId] : null;
            return '<div class="line-item">' +
              '<a class="line-item__media" href="#/product/' + p.slug + '"></a>' +
              '<div class="stack stack-1">' +
                '<a class="line-item__title" href="#/product/' + p.slug + '">' + CW.esc(p.name) + '</a>' +
                '<div class="line-item__variant">' + [CW.variantLabel(p, i.variantId), 'Količina ' + i.qty].filter(Boolean).map(CW.esc).join(' · ') + '</div>' +
                '<div class="line-item__actions">' +
                  '<a class="line-item__action" href="#/product/' + p.slug + '">Buy again</a>' +
                  '<a class="line-item__action" href="#/returns">Return this item</a>' +
                '</div>' +
              '</div>' +
              '<div class="line-item__right"><div class="t-price" style="font-size:1.125rem">' + CW.money(i.price * i.qty) + '</div></div>' +
            '</div>';
          }).join('') +
        '</div></div>' +

        '<aside class="stack stack-3">' +
          '<div class="card"><div class="card__body">' +
            '<div class="t-eyebrow t-eyebrow--gold">Payment summary</div>' +
            '<div class="spec-list mt-2">' +
              '<div class="spec-list__row"><span class="spec-list__k">Cena</span><span class="spec-list__v">' + CW.money(subtotal) + '</span></div>' +
              (o.discount ? '<div class="spec-list__row"><span class="spec-list__k">Discount</span><span class="spec-list__v t-gold">−' + CW.money(o.discount) + '</span></div>' : '') +
              '<div class="spec-list__row"><span class="spec-list__k">Shipping</span><span class="spec-list__v">' + (o.shipping === 0 ? 'Free' : CW.money(o.shipping)) + '</span></div>' +
              '<div class="spec-list__row spec-list__row--total"><span class="spec-list__k">Total</span><span class="spec-list__v">' + CW.money(o.total) + '</span></div>' +
            '</div>' +
          '</div></div>' +

          '<div class="card"><div class="card__body">' +
            '<div class="t-eyebrow t-eyebrow--gold">Delivery address</div>' +
            '<div class="t-sm mt-2">' +
              '<div class="t-offwhite">' + CW.esc(addr.name) + '</div>' +
              '<div>' + CW.esc(addr.line1) + '</div>' +
              (addr.line2 ? '<div>' + CW.esc(addr.line2) + '</div>' : '') +
              '<div>' + CW.esc(addr.postcode + ' ' + addr.city) + '</div>' +
              '<div>' + CW.esc(addr.country) + '</div>' +
            '</div>' +
          '</div></div>' +

          '<div class="card"><div class="card__body">' +
            '<div class="t-eyebrow t-eyebrow--gold">Need help?</div>' +
            '<p class="t-sm mt-2">Quote order number ' + CW.esc(o.id) + ' and we can find it instantly.</p>' +
            '<a class="btn btn--quiet btn--full mt-2" href="#/contact?topic=merch">Contact the shop</a>' +
            '<a class="btn btn--ghost btn--full mt-1" href="#/returns">Start a return</a>' +
          '</div></div>' +
        '</aside>' +
      '</div>' +
    '</div>';

  return CW.pages._accountShell('/account/orders', 'Order ' + o.id, body);
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

  return CW.pages._accountShell('/account/wishlist', 'Lista želja', body);
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
