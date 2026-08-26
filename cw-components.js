/* ==========================================================================
   CRAZYWOLVES — ZAJEDNIČKE KOMPONENTE
   Header, navigacija, footer, drawer-i, pretraga i biblioteka kartica.
   Svaka funkcija vraća HTML string; ponašanje se kači delegiranim
   [data-act] handlerima, pa se markup može slobodno ponovo iscrtavati.
   ========================================================================== */

window.CW = window.CW || {};
CW.c = {};
CW.ui = {};

/* ==========================================================================
   MODEL NAVIGACIJE — jedini izvor istine za header, mobilni meni i footer
   ========================================================================== */
/* Navigacija: shop je prvi i jedini razgranat, jer je prodaja glavni posao
   sajta. Zajednica, vesti i ostalo stoje iza njega, grupisani, da ne
   preuzimaju prostor od kategorija proizvoda. */
/* Navigacija ima samo dve stavke: sajt je shop, a blog stoji uz njega.
   Stranice zajednice, usluga, CS2 tima, događaja i partnera su sklonjene
   iz ove faze — njihov kod je ostao, samo se ne prikazuje. */
CW.nav = {
  primary: [
    /* `path` je gde vodi klik, `match` je koje adrese pale ovu stavku.
       Razdvojeni su namerno: SHOP vodi pravo u katalog (/shop/all), ali mora
       da ostane osvetljen i dok kupac gleda /shop/drinkware ili /shop.

       Ranije je i logo i SHOP vodilo na `/`, pa je dugme SHOP izgledalo kao
       da ne radi ništa — klik na njega je vraćao na istu stranicu. */
    { label: 'Shop', path: '/shop/all', match: '/shop', children: [
      { label: 'Sve iz shopa', path: '/shop/all',        desc: 'Ceo asortiman na jednom mestu' },
      { label: 'Šolje',        path: '/shop/drinkware',  desc: 'Keramika sa zvaničnim grbom' },
      { label: 'Odeća',        path: '/shop/apparel',    desc: 'Majice i duksevi — u pripremi' },
      { label: 'Dodaci',       path: '/shop/accessories',desc: 'Stikeri, podloge i sitnice' },
      { label: 'Gaming Store', path: '/shop/digital',    desc: 'Igre, DLC i in-game valuta' }
    ] },
    { label: 'Blog', path: '/vesti' }
  ],
  shopMenu: [
    { label: 'Sve iz shopa', path: '/shop/all' },
    { label: 'Šolje', path: '/shop/drinkware' },
    { label: 'Odeća', path: '/shop/apparel' },
    { label: 'Dodaci', path: '/shop/accessories' },
    { label: 'Gaming Store', path: '/shop/digital' }
  ]
};

/* Logo lockup — koristi pravu sliku grba, sa SVG fallback-om */
CW.c.logoLockup = function (size, withSub) {
  var s = size || 38;
  var meta = CW.IMAGES['logo-mark'] || CW.IMAGES['logo-shield'];
  var w = s;   /* isecen grb je kvadratan */

  /* Isti lanac kao CW.img: lokalna kopija -> crtani SVG grb */
  var mark = meta
    ? '<img class="logo__mark" src="' + meta.local + '" alt="" width="' + w + '" height="' + s + '" ' +
      'style="width:' + w + 'px;height:' + s + 'px;object-fit:contain;border-radius:3px" ' +
      'onerror="this.onerror=null;this.outerHTML=CW.logoMarkSvg(' + s + ');">'
    : CW.logoMarkSvg(s);

  return mark +
    '<span>' +
      '<span class="logo__word">CRAZY<em>WOLVES</em></span>' +
      (withSub === false ? '' : '<span class="logo__sub">COMMUNITY</span>') +
    '</span>';
};

/* ==========================================================================
   HEADER
   ========================================================================== */
CW.c.header = function () {
  var count = CW.store.cartCount();
  var wish = CW.store.wishlist().length;
  var user = CW.store.user();

  var primary = CW.nav.primary.map(function (item) {
    if (!item.children) {
      return '<a class="nav__link" href="#' + item.path + '" data-nav="' + (item.match || item.path) + '">' + CW.esc(item.label) + '</a>';
    }
    return '<div class="dropdown" data-dropdown>' +
        '<a class="nav__link" href="#' + item.path + '" data-nav="' + (item.match || item.path) + '" aria-haspopup="true" aria-expanded="false">' +
          CW.esc(item.label) + CW.icon('chevronD', 14) +
        '</a>' +
        '<div class="dropdown__panel dropdown__panel--wide hidden" data-dropdown-panel>' +
          item.children.map(function (c) {
            return '<a class="dropdown__item" href="#' + c.path + '"><b>' + CW.esc(c.label) + '</b><span>' + CW.esc(c.desc) + '</span></a>';
          }).join('') +
        '</div>' +
      '</div>';
  }).join('');

  return '' +
  '<div class="announce">' +
    'Sajt je u izradi — Discord i Instagram su aktivni. ' +
    '<a href="' + CW.data.socials[0].url + '">Uđi u čopor</a>' +
  '</div>' +

  '<header class="header" id="site-header">' +
    '<div class="container container--wide">' +
      '<div class="header__inner">' +

        '<a class="logo" href="#/" aria-label="CrazyWolves — početna">' + CW.c.logoLockup(38) + '</a>' +

        '<nav class="nav" aria-label="Glavna navigacija">' + primary + '</nav>' +

        '<div class="header__actions">' +


          '<button class="btn-icon" type="button" data-act="open-search" aria-label="Pretraži sajt">' +
            CW.icon('search', 20) +
          '</button>' +

          '<a class="btn-icon header__desktop-only" href="#/nalog/lista-zelja" aria-label="Lista želja' + (wish ? ' — ' + wish + ' artikala' : '') + '">' +
            CW.icon('heart', 20) +
            (wish ? '<span class="btn-icon__count">' + wish + '</span>' : '') +
          '</a>' +

          /* Prijavljen korisnik vidi svoje inicijale, ne ikonicu čoveka.
             Inicijali su jedini pokazatelj na ekranu da si uopšte prijavljen
             i pod kojim nalogom — ikonica izgleda isto u oba slučaja. */
          (user
            ? '<a class="btn-icon avatar-btn header__desktop-only" href="#/nalog" ' +
                'aria-label="Nalog — ' + CW.esc(CW.initialsOf(user)) + ', ' + CW.esc(user.email || '') + '" ' +
                'title="' + CW.esc(user.email || 'Tvoj nalog') + '">' +
                '<span class="avatar-btn__initials" aria-hidden="true">' + CW.esc(CW.initialsOf(user)) + '</span>' +
              '</a>'
            : '<a class="btn-icon header__desktop-only" href="#/nalog/prijava" aria-label="Prijava">' +
                CW.icon('user', 20) +
              '</a>') +

          '<button class="btn-icon" type="button" data-act="open-cart" aria-label="Korpa' + (count ? ' — ' + count + ' artikala' : ' — prazna') + '">' +
            CW.icon('cart', 20) +
            (count ? '<span class="btn-icon__count">' + count + '</span>' : '') +
          '</button>' +

          '<a class="btn btn--primary btn--sm header__desktop-only" href="' + CW.data.socials[0].url + '" style="margin-left:8px">' +
            CW.icon('discord', 16) + 'Uđi u čopor' +
          '</a>' +

          '<button class="btn-icon header__mobile-only hidden" type="button" data-act="open-menu" aria-label="Otvori meni" aria-expanded="false">' +
            CW.icon('menu', 22) +
          '</button>' +
        '</div>' +

      '</div>' +
    '</div>' +
  '</header>';
};

/* ==========================================================================
   MOBILNA NAVIGACIJA
   ========================================================================== */
CW.c.mobileNav = function () {
  var user = CW.store.user();

  var main = CW.nav.primary.map(function (item) {
    return '<a class="mobile-nav__link" href="#' + item.path + '" data-nav="' + (item.match || item.path) + '" data-act="close-overlays">' +
      CW.esc(item.label) + CW.icon('chevronR', 18) + '</a>';
  }).join('');

  return '' +
  '<div class="mobile-nav">' +
    '<div class="drawer__head">' +
      '<a class="logo" href="#/" data-act="close-overlays">' + CW.c.logoLockup(32, false) + '</a>' +
      '<button class="btn-icon" type="button" data-act="close-overlays" aria-label="Zatvori meni">' + CW.icon('x', 22) + '</button>' +
    '</div>' +

    '<div class="mobile-nav__body">' +
      '<a class="mobile-nav__link" href="#/" data-nav="/" data-act="close-overlays">Početna' + CW.icon('chevronR', 18) + '</a>' +
      main +
      /* Zaseban „Shop" red je izbačen: dok je stavka iz `primary` vodila na
         početnu, ovaj je bio jedini put do kataloga. Sada oba vode na isto
         mesto, pa bi stajala dva ista reda jedan ispod drugog. */

      '<div class="mobile-nav__section">Shop</div>' +
      CW.nav.shopMenu.map(function (c) {
        return '<a class="mobile-nav__sub" href="#' + c.path + '" data-act="close-overlays">' + CW.esc(c.label) + '</a>';
      }).join('') +

      '<div class="mobile-nav__section">Još</div>' +
      '<a class="mobile-nav__sub" href="#/vesti" data-act="close-overlays">Blog</a>' +
      '<a class="mobile-nav__sub" href="#/kontakt" data-act="close-overlays">Kontakt</a>' +
      '<a class="mobile-nav__sub" href="#/pitanja" data-act="close-overlays">Česta pitanja</a>' +

      '<div class="mobile-nav__section">Nalog</div>' +
      (user
        ? '<a class="mobile-nav__sub" href="#/nalog" data-act="close-overlays">Nalog — ' + CW.esc(user.firstName) + '</a>' +
          '<a class="mobile-nav__sub" href="#/nalog/porudzbine" data-act="close-overlays">Moje porudžbine</a>' +
          '<a class="mobile-nav__sub" href="#/nalog/lista-zelja" data-act="close-overlays">Lista želja</a>' +
          '<button class="mobile-nav__sub" type="button" data-act="sign-out" style="text-align:left;width:100%">Odjava</button>'
        : '<a class="mobile-nav__sub" href="#/nalog/prijava" data-act="close-overlays">Prijava</a>' +
          '<a class="mobile-nav__sub" href="#/nalog/registracija" data-act="close-overlays">Napravi nalog</a>' +
          '<a class="mobile-nav__sub" href="#/nalog/lista-zelja" data-act="close-overlays">Lista želja</a>') +

      '<div class="mobile-nav__section">Prati nas</div>' +
      '<div style="padding:0 var(--space-3) var(--space-3)"><div class="socials">' +
        CW.data.socials.map(function (s) {
          return '<a class="social" href="' + s.url + '" aria-label="' + CW.esc(s.name) + '">' + CW.icon(CW.socialIcon(s.id), 18) + '</a>';
        }).join('') +
      '</div></div>' +
    '</div>' +

    '<div class="mobile-nav__foot">' +
      '<a class="btn btn--primary btn--full" href="' + CW.data.socials[0].url + '" data-act="close-overlays">' +
        CW.icon('discord', 18) + 'Uđi u čopor' +
      '</a>' +
    '</div>' +
  '</div>';
};

CW.socialIcon = function (id) {
  return { discord: 'discord', twitch: 'twitch', instagram: 'instagram', youtube: 'youtube', tiktok: 'tiktok' }[id] || 'link';
};

/* ==========================================================================
   FOOTER
   ========================================================================== */
CW.c.footer = function () {
  function col(title, links) {
    return '<div><div class="footer__col-title">' + CW.esc(title) + '</div>' +
      links.map(function (l) {
        return '<a class="footer__link" href="' + (l.ext ? l.p : '#' + l.p) + '">' + CW.esc(l.t) + '</a>';
      }).join('') + '</div>';
  }

  return '' +
  '<footer class="footer">' +
    '<div class="container container--wide">' +
      '<div class="footer__top">' +
        '<div class="footer__grid">' +

          '<div class="footer__brand">' +
            '<a class="logo" href="#/">' + CW.c.logoLockup(40) + '</a>' +
            '<p class="footer__desc">CrazyWolves Gaming Hub — dom balkanskih gejmera. ' +
              'Preko 700 članova, šest igara sa svojim kanalima, zvanični shop i usluge za zajednice. ' +
              'Vuk sam preživi — čopor pobeđuje.</p>' +
            '<div class="socials mt-3">' +
              CW.data.socials.map(function (s) {
                return '<a class="social" href="' + s.url + '" aria-label="' + CW.esc(s.name) + ' — ' + CW.esc(s.handle) + '">' +
                  CW.icon(CW.socialIcon(s.id), 18) + '</a>';
              }).join('') +
            '</div>' +
          '</div>' +

          /* Shop je prva kolona — podnožje prati isti redosled kao
             navigacija, a ne obrnut. */
          col('Shop', [
            { t: 'Sve iz shopa', p: '/shop/all' }, { t: 'Šolje', p: '/shop/drinkware' },
            { t: 'Odeća', p: '/shop/apparel' }, { t: 'Dodaci', p: '/shop/accessories' },
            { t: 'Gaming Store', p: '/shop/digital' }
          ]) +

          col('Nalog', [
            { t: 'Moje porudžbine', p: '/nalog/porudzbine' }, { t: 'Lista želja', p: '/nalog/lista-zelja' },
            { t: 'Prijava', p: '/nalog/prijava' }, { t: 'Registracija', p: '/nalog/registracija' }
          ]) +

          col('Blog', [
            { t: 'Sve objave', p: '/vesti' },
            { t: 'Discord', p: CW.data.socials[0].url, ext: true },
            { t: 'Instagram', p: CW.data.socials[1] ? CW.data.socials[1].url : '#', ext: true }
          ]) +

          col('Podrška', [
            { t: 'Česta pitanja', p: '/pitanja' }, { t: 'Dostava', p: '/dostava' },
            { t: 'Reklamacije i povraćaj', p: '/povracaj' }, { t: 'Kontakt', p: '/kontakt' }
          ]) +

        '</div>' +

        '<div class="divider"><span class="divider__mark"></span></div>' +

        '<div class="grid grid--2" style="align-items:center">' +
          '<div>' +
            '<div class="t-eyebrow t-eyebrow--gold">Newsletter</div>' +
            '<h3 class="t-h3 mt-1">Najave, drops i događaji — jedan mejl nedeljno</h3>' +
            '<p class="t-sm mt-1">Bez spama. Odjava jednim klikom.</p>' +
          '</div>' +
          '<form class="newsletter" data-act="newsletter" novalidate>' +
            '<label class="visually-hidden" for="nl-email">Email adresa</label>' +
            '<input class="input" id="nl-email" name="email" type="email" placeholder="ti@primer.rs" autocomplete="email" required>' +
            '<button class="btn btn--primary" type="submit">Prijavi se</button>' +
          '</form>' +
        '</div>' +
      '</div>' +

      '<div class="footer__bottom">' +
        '<div class="footer__copy">© ' + new Date().getFullYear() + ' CrazyWolves Community · ' + CW.esc(CW.brand.website) + '</div>' +
        '<div class="footer__legal">' +
          '<a href="#/privatnost">Politika privatnosti</a>' +
          '<a href="#/uslovi">Uslovi korišćenja</a>' +
          '<a href="#/kolacici">Kolačići</a>' +
          '<a href="#/dostava">Dostava</a>' +
          '<a href="#/povracaj">Povraćaj</a>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</footer>';
};

/* ==========================================================================
   KORPA — drawer
   ========================================================================== */
CW.c.cartDrawer = function () {
  var cart = CW.store.cart();
  var t = CW.store.totals();

  var body;
  if (!cart.length) {
    body = CW.c.empty({
      icon: 'cart',
      title: 'Korpa je prazna',
      text: 'Još ništa nije ovde. Pogledaj šta ima u zvaničnom shopu.',
      actions: '<a class="btn btn--primary" href="#/shop" data-act="close-overlays">Otvori shop</a>'
    });
  } else {
    body = cart.map(function (l) { return CW.c.lineItem(l, true); }).join('');
  }

  var gapNote = '';
  if (cart.length && t.freeShippingGap > 0) {
    var pct = Math.min(100, Math.round((t.subtotal / CW.shopConfig.freeShippingThreshold) * 100));
    gapNote =
      '<div class="capacity mb-3">' +
        '<div class="row row--between"><span class="t-xs">Još ' + CW.money(t.freeShippingGap) + ' do besplatne dostave</span>' +
        '<span class="t-xs t-gold">' + pct + '%</span></div>' +
        '<div class="capacity__bar"><div class="capacity__fill" style="width:' + pct + '%"></div></div>' +
      '</div>';
  } else if (cart.length) {
    gapNote = '<div class="alert alert--success mb-3">' + CW.icon('check', 16) + '<span>Dostava je besplatna.</span></div>';
  }

  return '' +
  '<div class="drawer" role="dialog" aria-modal="true" aria-label="Korpa">' +
    '<div class="drawer__head">' +
      '<div class="drawer__title">Korpa ' + (cart.length ? '<span class="t-muted">(' + CW.store.cartCount() + ')</span>' : '') + '</div>' +
      '<button class="btn-icon" type="button" data-act="close-overlays" aria-label="Zatvori korpu">' + CW.icon('x', 22) + '</button>' +
    '</div>' +
    '<div class="drawer__body">' + body + '</div>' +
    (cart.length ?
    '<div class="drawer__foot">' +
      gapNote +
      '<div class="spec-list mb-2">' +
        '<div class="spec-list__row"><span class="spec-list__k">Cena</span><span class="spec-list__v">' + CW.money(t.subtotal) + '</span></div>' +
        (t.discount ? '<div class="spec-list__row"><span class="spec-list__k">Popust</span><span class="spec-list__v t-gold">−' + CW.money(t.discount) + '</span></div>' : '') +
        '<div class="spec-list__row"><span class="spec-list__k">Dostava</span><span class="spec-list__v">' + (t.shipping === 0 ? 'Besplatno' : CW.money(t.shipping)) + '</span></div>' +
        '<div class="spec-list__row spec-list__row--total"><span class="spec-list__k">Ukupno</span><span class="spec-list__v">' + CW.money(t.total) + '</span></div>' +
      '</div>' +
      '<a class="btn btn--primary btn--full btn--lg" href="#/placanje" data-act="close-overlays">Nastavi na plaćanje</a>' +
      '<a class="btn btn--ghost btn--full mt-1" href="#/korpa" data-act="close-overlays">Otvori korpu</a>' +
    '</div>' : '') +
  '</div>';
};

/* ==========================================================================
   STAVKA U KORPI
   ========================================================================== */
CW.c.lineItem = function (line, compact) {
  var p = CW.product(line.productId);
  if (!p) return '';

  /* `v` treba i dalje — ne za ispis naziva varijante (to radi
     CW.variantLabel), nego za zalihu: upozorenje „još N na stanju" i
     gašenje dugmeta „+" kad se dođe do poslednjeg komada. */
  var v = null;
  p.variants.forEach(function (x) { if (x.id === line.variantId) v = x; });

  var key = 'data-pid="' + p.id + '" data-vid="' + line.variantId + '"';

  var thumb = p.image
    ? '<a class="line-item__media" href="#/proizvod/' + p.slug + '" data-act="close-overlays" aria-label="' + CW.esc(p.name) + '" ' +
      'style="background-image:url(' + CW.imgSrc(p.image) + ');background-size:cover;background-position:center"></a>'
    : '<a class="line-item__media" href="#/proizvod/' + p.slug + '" data-act="close-overlays" aria-label="' + CW.esc(p.name) + '"></a>';

  return '' +
  '<div class="line-item">' +
    thumb +
    '<div class="stack stack-1" style="min-width:0">' +
      '<a class="line-item__title" href="#/proizvod/' + p.slug + '" data-act="close-overlays">' + CW.esc(p.name) + '</a>' +
      '<div class="line-item__variant">' +
        CW.esc(CW.variantLabel(p, line.variantId)) +
      '</div>' +
      (v && v.stock <= CW.shopConfig.lowStockThreshold && v.stock > 0
        ? '<div class="t-xs" style="color:var(--color-warning)">Još ' + v.stock + ' na stanju</div>' : '') +
      '<div class="line-item__actions">' +
        '<div class="qty qty--sm">' +
          '<button class="qty__btn" type="button" data-act="qty-dec" ' + key + ' aria-label="Smanji količinu">' + CW.icon('minus', 14) + '</button>' +
          '<span class="qty__val" role="status" aria-label="Količina">' + line.qty + '</span>' +
          '<button class="qty__btn" type="button" data-act="qty-inc" ' + key + ' aria-label="Povećaj količinu"' + (v && line.qty >= v.stock ? ' disabled' : '') + '>' + CW.icon('plus', 14) + '</button>' +
        '</div>' +
        (compact ? '' : '<button class="line-item__action" type="button" data-act="move-to-wishlist" ' + key + '>Sačuvaj</button>') +
        '<button class="line-item__action line-item__action--remove" type="button" data-act="remove-line" ' + key + '>Ukloni</button>' +
      '</div>' +
    '</div>' +
    '<div class="line-item__right">' +
      '<div class="t-price" style="font-size:1.125rem">' + CW.money(p.price * line.qty) + '</div>' +
      (line.qty > 1 ? '<div class="t-xs">' + CW.money(p.price) + ' po komadu</div>' : '') +
    '</div>' +
  '</div>';
};

/* ==========================================================================
   PRETRAGA
   ========================================================================== */
CW.c.searchOverlay = function () {
  return '' +
  '<div class="search-overlay" data-overlay>' +
    '<div class="search-panel" role="dialog" aria-modal="true" aria-label="Pretraga">' +
      '<label class="visually-hidden" for="site-search">Pretraži CrazyWolves</label>' +
      '<input class="search-panel__input" id="site-search" type="search" ' +
        'placeholder="Traži usluge, proizvode, vesti…" autocomplete="off" data-search-input>' +
      '<div class="search-results" data-search-results>' + CW.c.searchDefault() + '</div>' +
    '</div>' +
  '</div>';
};

CW.c.searchDefault = function () {
  var quick = [
    { kind: 'Usluge', label: 'Sve usluge', path: '/usluge' },
    { kind: 'Shop',   label: 'Zvanična šolja', path: '/proizvod/zvanicna-solja' },
    { kind: 'Timovi', label: 'CS2 tim — prijave', path: '/cs2' },
    { kind: 'Stranica', label: 'Zajednica i Discord', path: '/zajednica' },
    { kind: 'Stranica', label: 'Partneri', path: '/partneri' }
  ];
  return '<div class="search-section-label">Najtraženije</div>' +
    quick.map(function (q) {
      return '<a class="search-result" href="#' + q.path + '" data-act="close-overlays">' +
        '<span class="search-result__kind">' + q.kind + '</span>' +
        '<span class="t-body">' + CW.esc(q.label) + '</span>' +
        '<span class="spacer"></span>' + CW.icon('arrowUR', 16) + '</a>';
    }).join('');
};

CW.search = function (term) {
  var q = String(term || '').trim().toLowerCase();
  if (q.length < 2) return null;
  var out = [];

  CW.data.services.forEach(function (s) {
    if ((s.name + ' ' + s.blurb).toLowerCase().indexOf(q) !== -1) {
      out.push({ kind: 'Usluga', label: s.name, meta: '', path: '/usluge' });
    }
  });
  CW.data.products.forEach(function (p) {
    if ((p.name + ' ' + p.shortDesc).toLowerCase().indexOf(q) !== -1) {
      out.push({ kind: 'Shop', label: p.name, meta: p.comingSoon ? 'Uskoro' : CW.money(p.price), path: '/proizvod/' + p.slug });
    }
  });
  CW.data.news.forEach(function (n) {
    if ((n.title + ' ' + n.dek).toLowerCase().indexOf(q) !== -1) {
      out.push({ kind: 'Vest', label: n.title, meta: '', path: '/vesti/' + n.id });
    }
  });
  CW.data.games.forEach(function (g) {
    if (g.name.toLowerCase().indexOf(q) !== -1) out.push({ kind: 'Igra', label: g.name, meta: g.category, path: '/zajednica' });
  });
  CW.data.events.forEach(function (e) {
    if (e.title.toLowerCase().indexOf(q) !== -1) out.push({ kind: 'Događaj', label: e.title, meta: e.city, path: '/dogadjaji' });
  });
  CW.data.faqs.forEach(function (f) {
    if (f.q.toLowerCase().indexOf(q) !== -1) out.push({ kind: 'Pitanje', label: f.q, meta: '', path: '/pitanja' });
  });

  return out.slice(0, 10);
};

CW.c.searchResults = function (term) {
  var results = CW.search(term);
  if (results === null) return CW.c.searchDefault();
  if (!results.length) {
    return '<div class="empty empty--sm" style="border:0;background:none">' +
      '<div class="empty__icon">' + CW.icon('search', 26) + '</div>' +
      '<div class="empty__title">Nema rezultata</div>' +
      '<p class="empty__text">Ništa ne odgovara pojmu „' + CW.esc(term) + '". Probaj naziv usluge, proizvoda ili igre.</p>' +
      '</div>';
  }
  return '<div class="search-section-label">' + results.length + ' rezultat' + (results.length === 1 ? '' : 'a') + '</div>' +
    results.map(function (r) {
      return '<a class="search-result" href="#' + r.path + '" data-act="close-overlays">' +
        '<span class="search-result__kind">' + r.kind + '</span>' +
        '<span class="t-body truncate">' + CW.esc(r.label) + '</span>' +
        '<span class="spacer"></span>' +
        (r.meta ? '<span class="t-xs">' + CW.esc(r.meta) + '</span>' : '') + '</a>';
    }).join('');
};

/* ==========================================================================
   OPŠTI DELOVI
   ========================================================================== */
CW.c.sectionHead = function (o) {
  return '<div class="section-head">' +
    '<div class="section-head__text">' +
      (o.eyebrow ? '<div class="t-eyebrow">' + CW.esc(o.eyebrow) + '</div>' : '') +
      '<h2 class="t-h2 section-head__title">' + CW.esc(o.title) + '</h2>' +
      (o.desc ? '<p class="t-body section-head__desc">' + CW.esc(o.desc) + '</p>' : '') +
    '</div>' +
    (o.action ? '<div>' + o.action + '</div>' : '') +
  '</div>';
};

CW.c.crumbs = function (items) {
  return '<nav class="crumbs" aria-label="Putanja">' +
    items.map(function (c, i) {
      var last = i === items.length - 1;
      return (i ? '<span class="crumbs__sep" aria-hidden="true">/</span>' : '') +
        (last
          ? '<span class="crumbs__current" aria-current="page">' + CW.esc(c.label) + '</span>'
          : '<a href="#' + c.path + '">' + CW.esc(c.label) + '</a>');
    }).join('') +
  '</nav>';
};

CW.c.empty = function (o) {
  return '<div class="empty' + (o.small ? ' empty--sm' : '') + '">' +
    '<div class="empty__icon">' + CW.icon(o.icon || 'inbox', 28) + '</div>' +
    '<div class="empty__title">' + CW.esc(o.title) + '</div>' +
    '<p class="empty__text">' + CW.esc(o.text) + '</p>' +
    (o.actions ? '<div class="empty__actions">' + o.actions + '</div>' : '') +
  '</div>';
};

CW.c.pagination = function (page, totalPages) {
  if (totalPages <= 1) return '';
  var out = ['<nav class="pagination" aria-label="Straničenje">'];
  out.push('<button class="page-btn" type="button" data-act="page" data-page="' + (page - 1) + '"' +
    (page === 1 ? ' disabled' : '') + ' aria-label="Prethodna strana">' + CW.icon('chevronL', 16) + '</button>');

  var pages = [];
  for (var i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  pages.forEach(function (p) {
    if (p === '…') out.push('<span class="page-ellipsis">…</span>');
    else out.push('<button class="page-btn' + (p === page ? ' is-active' : '') + '" type="button" data-act="page" data-page="' + p +
      '"' + (p === page ? ' aria-current="page"' : '') + '>' + p + '</button>');
  });

  out.push('<button class="page-btn" type="button" data-act="page" data-page="' + (page + 1) + '"' +
    (page === totalPages ? ' disabled' : '') + ' aria-label="Sledeća strana">' + CW.icon('chevronR', 16) + '</button>');
  out.push('</nav>');
  return out.join('');
};

CW.c.statGrid = function (stats, cols) {
  return '<div class="stat-grid" style="grid-template-columns:repeat(' + (cols || stats.length) + ',minmax(0,1fr))">' +
    stats.map(function (s) {
      return '<div class="stat-cell">' +
        '<div class="stat-cell__num">' + CW.esc(s.value) + '</div>' +
        '<div class="stat-cell__lbl">' + CW.esc(s.label) + '</div>' +
      '</div>';
    }).join('') + '</div>';
};

CW.c.trustStrip = function (items) {
  var list = items || CW.data.shopTrust;
  return '<div class="trust-strip">' +
    list.map(function (t) {
      return '<div class="trust-item">' + CW.icon(t.icon, 20) +
        '<div><b>' + CW.esc(t.title) + '</b><span>' + CW.esc(t.text) + '</span></div></div>';
    }).join('') + '</div>';
};

CW.c.divider = function () {
  return '<div class="divider"><span class="divider__mark"></span></div>';
};

/* ==========================================================================
   ZNAČKE
   ========================================================================== */
CW.c.badges = function (product) {
  var map = {
    limited:    { cls: 'badge--limited',    label: 'Limitirano' },
    new:        { cls: 'badge--new',        label: 'Novo' },
    sale:       { cls: 'badge--sale',       label: 'Akcija' },
    bestseller: { cls: 'badge--bestseller', label: 'Najprodavanije' }
  };
  return (product.badges || []).map(function (b) {
    var m = map[b];
    return m ? '<span class="badge ' + m.cls + '">' + m.label + '</span>' : '';
  }).join('');
};

CW.stockOf = function (product) {
  return (product.variants || []).reduce(function (n, v) { return n + v.stock; }, 0);
};

/* ==========================================================================
   KARTICA PROIZVODA
   ========================================================================== */
CW.c.productCard = function (p) {
  var soon = p.comingSoon;
  var stock = CW.stockOf(p);
  var soldout = !soon && stock === 0;
  var low = !soon && !soldout && stock <= CW.shopConfig.lowStockThreshold;
  var wished = CW.store.inWishlist(p.id);
  var cat = CW.find('categories', p.categoryId) || { name: '' };

  var media = p.image
    ? CW.img(p.image, { ratio: '1 / 1', pos: 'center', ph: p.name })
    : '<div class="ph ph--1x1 ph--product" data-ph="' + CW.esc(p.name) + '"></div>';

  return '' +
  '<article class="card product-card' + (soldout ? ' is-soldout' : '') + (soon ? ' is-soon' : '') + '">' +
    '<div class="card__media">' +
      '<div class="card__badges">' + CW.c.badges(p) +
        (soon ? '<span class="badge badge--neutral">Uskoro</span>' : '') +
        (soldout ? '<span class="badge badge--soldout">Rasprodato</span>' : '') +
        (low ? '<span class="badge badge--low">Poslednji komadi</span>' : '') +
      '</div>' +
      (soon ? '' :
      '<div class="card__badges card__badges--right">' +
        '<button class="btn-icon btn-icon--sm' + (wished ? ' is-active' : '') + '" type="button" ' +
          'data-act="toggle-wishlist" data-pid="' + p.id + '" ' +
          'aria-label="' + (wished ? 'Ukloni sa liste želja' : 'Dodaj na listu želja') + '" aria-pressed="' + wished + '">' +
          CW.icon('heart', 18) + '</button>' +
      '</div>') +
      '<a href="#/proizvod/' + p.slug + '" aria-label="' + CW.esc(p.name) + '">' + media + '</a>' +
      (soon || soldout ? '' :
        '<div class="product-card__quick">' +
          '<a class="btn btn--primary btn--sm btn--full" href="#/proizvod/' + p.slug + '">Pogledaj</a>' +
        '</div>') +
    '</div>' +
    '<div class="card__body">' +
      '<div class="product-card__meta">' + CW.esc(cat.name) + '</div>' +
      '<a href="#/proizvod/' + p.slug + '"><h3 class="product-card__title">' + CW.esc(p.name) + '</h3></a>' +
      '<div class="product-card__price-row">' +
        (soon
          ? '<span class="t-label" style="color:var(--color-gold)">Najava uskoro</span>'
          : '<span class="t-price">' + CW.money(p.price) + '</span>') +
      '</div>' +
    '</div>' +
  '</article>';
};

CW.c.productSkeleton = function () {
  return '<div class="card"><div class="skeleton skeleton--square"></div>' +
    '<div class="card__body"><div class="skeleton skeleton--line-short"></div>' +
    '<div class="skeleton skeleton--title"></div><div class="skeleton skeleton--line" style="width:40%"></div></div></div>';
};

/* ==========================================================================
   KARTICA VESTI
   ========================================================================== */
CW.c.newsCard = function (n) {
  var cat = CW.find('newsCategories', n.categoryId) || { name: '' };
  var date = CW.resolveDate(n.dayOffset, '10:00');
  var media = n.image
    ? CW.img(n.image, { ratio: '3 / 2', ph: n.title })
    : '<div class="ph ph--16x9" data-ph="' + CW.esc(n.title) + '"></div>';

  return '' +
  '<a class="card news-card" href="#/vesti/' + n.id + '">' +
    '<div class="card__media">' + media +
      '<div class="card__badges"><span class="tag">' + CW.esc(cat.name) + '</span></div>' +
    '</div>' +
    '<div class="card__body">' +
      '<h3 class="news-card__title">' + CW.esc(n.title) + '</h3>' +
      '<p class="news-card__dek clamp-2">' + CW.esc(n.dek) + '</p>' +
      '<div class="news-card__meta">' +
        '<span>' + CW.relative(date) + '</span><i></i>' +
        '<span>' + n.readMin + ' min čitanja</span>' +
      '</div>' +
    '</div>' +
  '</a>';
};

CW.c.newsFeature = function (n) {
  var cat = CW.find('newsCategories', n.categoryId) || { name: '' };
  var date = CW.resolveDate(n.dayOffset, '10:00');
  var media = n.image
    ? CW.img(n.image, { ratio: 'auto', cls: 'is-fill', ph: n.title, eager: true })
    : '<div class="ph" style="height:100%;min-height:340px" data-ph="' + CW.esc(n.title) + '"></div>';

  return '' +
  '<a class="card news-feature card--featured" href="#/vesti/' + n.id + '">' +
    '<div class="card__media" style="min-height:320px">' + media +
      '<div class="card__badges"><span class="tag tag--solid">Izdvojeno</span><span class="tag">' + CW.esc(cat.name) + '</span></div>' +
    '</div>' +
    '<div class="card__body">' +
      '<h3 class="news-feature__title">' + CW.esc(n.title) + '</h3>' +
      '<p class="t-body">' + CW.esc(n.dek) + '</p>' +
      '<div class="news-card__meta" style="margin-top:0">' +
        '<span>' + CW.esc(n.author) + '</span><i></i>' +
        '<span>' + CW.relative(date) + '</span><i></i>' +
        '<span>' + n.readMin + ' min čitanja</span>' +
      '</div>' +
      '<span class="link-arrow mt-2">Pročitaj ' + CW.icon('arrowR', 16) + '</span>' +
    '</div>' +
  '</a>';
};

CW.c.newsSkeleton = function () {
  return '<div class="card"><div class="skeleton skeleton--media"></div>' +
    '<div class="card__body"><div class="skeleton skeleton--title"></div>' +
    '<div class="skeleton skeleton--line"></div><div class="skeleton skeleton--line-short"></div></div></div>';
};

/* ==========================================================================
   KARTICA DOGAĐAJA
   ========================================================================== */
CW.c.eventCard = function (e) {
  var iso = CW.resolveDate(e.dayOffset, e.time);
  var media = e.image
    ? CW.img(e.image, { ratio: '3 / 2', ph: e.title })
    : '<div class="ph ph--16x9" data-ph="' + CW.esc(e.title) + '"></div>';

  return '' +
  '<article class="card event-card">' +
    '<div class="card__media">' + media +
      '<div class="card__badges">' +
        '<span class="tag">' + (e.kind === 'offline' ? 'Uživo' : 'Online') + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="card__body">' +
      '<div class="event-card__when">' + CW.icon('calendar', 14) +
        CW.fmtDate(iso, 'short') + ' · ' + CW.fmtTime(iso) + '</div>' +
      '<h3 class="t-h3">' + CW.esc(e.title) + '</h3>' +
      '<div class="row t-sm" style="gap:6px">' + CW.icon('pin', 14) + CW.esc(e.location) + '</div>' +
      '<p class="t-sm clamp-2">' + CW.esc(e.blurb) + '</p>' +
    '</div>' +
    '<div class="card__foot">' +
      '<a class="btn btn--secondary btn--sm btn--full" href="' + CW.data.socials[0].url + '">' +
        CW.icon('discord', 15) + 'Pridruži se na Discordu</a>' +
    '</div>' +
  '</article>';
};

/* ==========================================================================
   KARTICA USLUGE
   ========================================================================== */
CW.c.serviceCard = function (s) {
  return '' +
  '<article class="card benefit" style="border-radius:var(--radius-card)">' +
    '<div class="benefit__icon">' + CW.icon(s.icon, 22) + '</div>' +
    '<h3 class="t-h3">' + CW.esc(s.name) + '</h3>' +
    '<p class="t-sm">' + CW.esc(s.blurb) + '</p>' +
    '<ul class="stack stack-1 mt-1">' +
      s.items.map(function (i) {
        return '<li class="row t-sm" style="gap:8px;align-items:flex-start">' +
          '<span style="color:var(--color-gold);flex:none;margin-top:2px">' + CW.icon('check', 14) + '</span>' +
          '<span>' + CW.esc(i) + '</span></li>';
      }).join('') +
    '</ul>' +
  '</article>';
};

/* ==========================================================================
   KARTICA IGRE
   ========================================================================== */
CW.c.gameCard = function (g) {
  return '' +
  '<article class="card"><div class="card__body">' +
    '<div class="row row--between">' +
      '<span class="chip"><span class="chip__dot" style="background:' + g.color + '"></span>' + CW.esc(g.short) + '</span>' +
      (g.hasTeam ? '<span class="badge badge--gold">Ima tim</span>' : '') +
    '</div>' +
    '<h3 class="t-h3">' + CW.esc(g.name) + '</h3>' +
    '<div class="t-label">' + CW.esc(g.category) + '</div>' +
    '<hr class="rule-gold">' +
    '<div class="t-eyebrow t-eyebrow--gold" style="font-size:10px">Kanali na Discordu</div>' +
    '<div class="row row--wrap mt-1" style="gap:6px">' +
      g.channels.map(function (c) {
        return '<span class="badge badge--neutral">' + CW.esc(c) + '</span>';
      }).join('') +
    '</div>' +
  '</div></article>';
};

/* ==========================================================================
   KARTICA PARTNERA
   ========================================================================== */
CW.c.partnerCard = function (p) {
  return '<a class="partner-card" href="' + p.url + '" title="' + CW.esc(p.name) + '">' +
    '<div class="stack stack-1" style="align-items:center">' +
      '<span class="partner-logo">' + CW.esc(p.name) + '</span>' +
      '<span class="t-label">' + CW.esc(p.category) + '</span>' +
    '</div></a>';
};

/* ==========================================================================
   CTA TRAKA
   ========================================================================== */
CW.c.ctaBand = function (o) {
  o = o || {};
  return '<div class="cta-band brackets">' +
    '<div class="cta-band__inner">' +
      '<div class="cta-band__text">' +
        '<div class="t-eyebrow t-eyebrow--gold">' + CW.esc(o.eyebrow || 'Uđi u čopor') + '</div>' +
        '<h2 class="t-h2 mt-1">' + CW.esc(o.title || 'Svaki čopor je počeo od jednog vuka') + '</h2>' +
        '<p class="t-lead mt-2">' + CW.esc(o.text || 'Preko 700 članova. Bez prijave i bez uslova.') + '</p>' +
      '</div>' +
      '<div class="cta-band__actions">' +
        '<a class="btn btn--primary btn--lg" href="' + CW.data.socials[0].url + '">' + CW.icon('discord', 18) + 'Uđi na Discord</a>' +
        '<a class="btn btn--secondary btn--lg" href="#' + (o.secondary ? o.secondary.path : '/zajednica') + '">' +
          CW.esc(o.secondary ? o.secondary.label : 'O zajednici') + '</a>' +
      '</div>' +
    '</div>' +
  '</div>';
};

/* ==========================================================================
   PONAŠANJE LJUSKE
   ========================================================================== */
CW.ui.openOverlay = function (html, kind) {
  CW.ui.closeAllOverlays();
  var host = document.getElementById('overlay-root');
  host.innerHTML = (kind === 'search' ? '' : '<div class="overlay overlay--drawer" data-act="close-overlays"></div>') + html;
  document.body.classList.add('is-locked');

  var focusable = host.querySelector('input, button, a[href]');
  if (focusable) setTimeout(function () { focusable.focus(); }, 60);
};

CW.ui.closeAllOverlays = function () {
  var host = document.getElementById('overlay-root');
  if (host) host.innerHTML = '';
  document.body.classList.remove('is-locked');
  CW.qsa('[data-dropdown-panel]').forEach(function (p) { p.classList.add('hidden'); });
};

CW.ui.refreshHeader = function () {
  var host = document.getElementById('header-root');
  if (host) host.innerHTML = CW.c.header();
  var loc = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  CW.ui.syncHeader(loc);
};

CW.ui.syncHeader = function (path) {
  var p = '/' + String(path || '').replace(/^\//, '');
  CW.qsa('[data-nav]').forEach(function (el) {
    var target = el.getAttribute('data-nav');
    var active = target === '/' ? p === '/' : p.indexOf(target.replace(/^\//, '')) === 1;
    el.classList.toggle('is-active', active);
  });
};

/* ---------- globalni delegirani događaji ---------- */
CW.ui.bind = function () {

  document.addEventListener('click', function (ev) {
    var trigger = ev.target.closest ? ev.target.closest('[data-act]') : null;

    var dd = ev.target.closest ? ev.target.closest('[data-dropdown]') : null;
    CW.qsa('[data-dropdown]').forEach(function (node) {
      var panel = node.querySelector('[data-dropdown-panel]');
      var link = node.querySelector('.nav__link');
      if (node !== dd && panel) { panel.classList.add('hidden'); if (link) link.setAttribute('aria-expanded', 'false'); }
    });

    if (!trigger) return;
    var act = trigger.getAttribute('data-act');
    var pid = trigger.getAttribute('data-pid');
    var vid = trigger.getAttribute('data-vid');

    switch (act) {
      case 'open-menu':
        ev.preventDefault();
        CW.ui.openOverlay('<div class="drawer drawer--left" role="dialog" aria-modal="true" aria-label="Meni">' + CW.c.mobileNav() + '</div>');
        break;

      case 'open-cart':
        ev.preventDefault();
        CW.ui.openOverlay(CW.c.cartDrawer());
        break;

      case 'open-search':
        ev.preventDefault();
        CW.ui.openOverlay(CW.c.searchOverlay(), 'search');
        break;

      case 'close-overlays':
        if (trigger.tagName !== 'A') ev.preventDefault();
        setTimeout(CW.ui.closeAllOverlays, trigger.tagName === 'A' ? 10 : 0);
        break;

      case 'toggle-wishlist': {
        ev.preventDefault();
        var added = CW.store.toggleWishlist(pid);
        var prod = CW.product(pid);
        trigger.classList.toggle('is-active', added);
        trigger.setAttribute('aria-pressed', String(added));
        CW.toast({
          type: added ? 'success' : 'info',
          title: added ? 'Sačuvano na listu želja' : 'Uklonjeno sa liste želja',
          text: prod ? prod.name : ''
        });
        CW.ui.refreshHeader();
        break;
      }

      case 'qty-inc':
      case 'qty-dec': {
        ev.preventDefault();
        var line = null;
        CW.store.cart().forEach(function (l) { if (l.productId === pid && l.variantId === vid) line = l; });
        if (!line) break;
        var res = CW.store.updateQty(pid, vid, line.qty + (act === 'qty-inc' ? 1 : -1));
        if (!res.ok && res.reason === 'stock-limit') {
          CW.toast({ type: 'warning', title: 'Nema više na stanju', text: 'Dostupno je još ' + res.max + ' komada.' });
        }
        CW.ui.afterCartChange();
        break;
      }

      case 'remove-line': {
        ev.preventDefault();
        var rp = CW.product(pid);
        CW.store.removeFromCart(pid, vid);
        CW.toast({ type: 'info', title: 'Uklonjeno iz korpe', text: rp ? rp.name : '' });
        CW.ui.afterCartChange();
        break;
      }

      case 'move-to-wishlist': {
        ev.preventDefault();
        if (!CW.store.inWishlist(pid)) CW.store.toggleWishlist(pid);
        CW.store.removeFromCart(pid, vid);
        CW.toast({ type: 'success', title: 'Prebačeno na listu želja', text: (CW.product(pid) || {}).name || '' });
        CW.ui.afterCartChange();
        break;
      }

      case 'sign-out':
        ev.preventDefault();
        CW.store.signOut();
        CW.ui.closeAllOverlays();
        CW.toast({ type: 'info', title: 'Odjavljen si', text: 'Vidimo se na Discordu.' });
        CW.ui.refreshHeader();
        CW.router.go('/');
        break;

      case 'accordion': {
        ev.preventDefault();
        var item = trigger.closest('.accordion__item');
        var open = item.classList.toggle('is-open');
        trigger.setAttribute('aria-expanded', String(open));
        break;
      }

      case 'copy-link':
        ev.preventDefault();
        CW.toast({ type: 'success', title: 'Link kopiran' });
        break;

      case 'share':
        ev.preventDefault();
        CW.toast({ type: 'info', title: 'Podeli', text: 'Deljenje na ' + (trigger.getAttribute('data-net') || 'mreži') + '.' });
        break;

      case 'accept-cookies': {
        ev.preventDefault();
        CW.store.acceptCookies();
        var banner = document.getElementById('cookie-banner');
        if (banner) banner.remove();
        break;
      }

      case 'page': {
        ev.preventDefault();
        var page = parseInt(trigger.getAttribute('data-page'), 10);
        CW.router.setQuery({ page: page > 1 ? page : null });
        break;
      }
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') CW.ui.closeAllOverlays();

    if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
      ev.preventDefault();
      CW.ui.openOverlay(CW.c.searchOverlay(), 'search');
    }

    if (ev.key === 'Tab') {
      var host = document.getElementById('overlay-root');
      if (!host || !host.firstChild) return;
      var items = CW.qsa('a[href], button:not([disabled]), input, select, textarea', host)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    }
  });

  document.addEventListener('input', function (ev) {
    if (!ev.target.matches('[data-search-input]')) return;
    var results = document.querySelector('[data-search-results]');
    if (results) results.innerHTML = CW.c.searchResults(ev.target.value);
  });

  document.addEventListener('submit', function (ev) {
    var form = ev.target;
    if (form.getAttribute('data-act') === 'newsletter') {
      ev.preventDefault();
      var input = form.querySelector('input[type=email]');
      var val = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) {
        CW.toast({ type: 'error', title: 'Proveri email adresu', text: 'Ovo ne izgleda kao ispravna adresa.' });
        input.focus();
        return;
      }
      var btn = form.querySelector('button[type=submit]');
      btn.classList.add('is-loading');
      setTimeout(function () {
        btn.classList.remove('is-loading');
        form.reset();
        CW.toast({ type: 'success', title: 'Prijavljen si', text: 'Jedan mejl nedeljno. Odjava u svakom trenutku.' });
      }, 700);
    }
  });

  window.addEventListener('scroll', function () {
    var h = document.getElementById('site-header');
    if (h) h.classList.toggle('is-scrolled', window.scrollY > 8);
  }, { passive: true });
};

CW.ui.afterCartChange = function () {
  CW.ui.refreshHeader();
  var host = document.getElementById('overlay-root');
  if (host && host.querySelector('.drawer')) {
    host.innerHTML = '<div class="overlay overlay--drawer" data-act="close-overlays"></div>' + CW.c.cartDrawer();
  }
  var path = (CW.router.current() || {}).path || '';
  if (path === 'korpa' || path === 'placanje') CW.router.refresh();
};

/* ==========================================================================
   TRAKA ZA KOLAČIĆE
   ========================================================================== */
CW.c.cookieBanner = function () {
  if (CW.store.get().cookiesAccepted) return '';
  return '<div class="drawer drawer--bottom" id="cookie-banner" style="position:fixed;z-index:var(--z-sticky);animation:none;max-height:none">' +
    '<div class="drawer__body" style="padding:var(--space-3)">' +
      '<div class="row row--between row--wrap" style="gap:var(--space-3)">' +
        '<div style="flex:1;min-width:260px">' +
          '<b class="t-h4">Koristimo mali broj kolačića</b>' +
          '<p class="t-sm mt-1" style="max-width:64ch">Neophodni kolačići drže korpu i prijavu. ' +
          'Analitika se postavlja samo ako prihvatiš. Bez oglašavanja i praćenja između sajtova. ' +
          '<a class="link-underline" href="#/kolacici">Detaljnije</a>.</p>' +
        '</div>' +
        '<div class="row" style="gap:8px">' +
          '<button class="btn btn--quiet" type="button" data-act="accept-cookies">Samo neophodni</button>' +
          '<button class="btn btn--primary" type="button" data-act="accept-cookies">Prihvati sve</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
};
