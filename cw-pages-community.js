/* ==========================================================================
   CRAZYWOLVES — STRANICE ZAJEDNICE
   Početna · Usluge · Zajednica · CS2 tim · Vesti · Članak · Događaji ·
   Partneri · O nama · Kontakt
   ========================================================================== */

window.CW = window.CW || {};
CW.pages = CW.pages || {};

var DISCORD = function () { return CW.data.socials[0].url; };

/* Zajednički akordeon */
CW.pages._accordion = function (items) {
  return '<div class="accordion">' +
    items.map(function (f, i) {
      return '<div class="accordion__item' + (i === 0 ? ' is-open' : '') + '">' +
        '<button class="accordion__trigger" type="button" data-act="accordion" aria-expanded="' + (i === 0) + '">' +
          '<span>' + CW.esc(f.q) + '</span>' +
          '<span class="accordion__icon">' + CW.icon('plus', 18) + '</span>' +
        '</button>' +
        '<div class="accordion__panel"><div class="accordion__inner">' +
          '<p class="accordion__body">' + CW.esc(f.a) + '</p>' +
        '</div></div>' +
      '</div>';
    }).join('') +
  '</div>';
};

/* ==========================================================================
   POČETNA
   ========================================================================== */
CW.pages.home = function () {
  var news = CW.data.news.slice().sort(function (a, b) { return b.dayOffset - a.dayOffset; });
  var featured = news.filter(function (n) { return n.featured; })[0] || news[0];
  var rest = news.filter(function (n) { return n.id !== featured.id; }).slice(0, 3);
  var services = CW.data.services.filter(function (s) { return s.featured; });
  var mug = CW.product('solja-zvanicna');
  /* Ostatak asortimana, bez izdvojenog proizvoda da se ne ponovi. */
  var otherProducts = CW.data.products.filter(function (p) {
    return !mug || p.id !== mug.id;
  }).slice(0, 3);
  var events = CW.data.events.slice().sort(function (a, b) { return a.dayOffset - b.dayOffset; }).slice(0, 3);

  return '' +
  /* ---------- HERO ----------
     Preko cele širine: fotografija ide iza teksta, ne pored njega. Raniji
     raspored je stavljao naslov levo, a lockup baner desno — pa se ime
     CRAZYWOLVES pojavljivalo dvaput, a široka slika stisnuta u pola
     stupca ispadala sitna na monitoru. */
  '<section class="hero home-hero">' +
    '<div class="home-hero__bg">' +
      CW.img('banner-nova-era', { ratio: '21 / 9', eager: true, fit: 'cover', ph: 'CRAZYWOLVES' }) +
      '<div class="home-hero__scrim"></div>' +
    '</div>' +

    '<div class="container container--wide home-hero__content">' +
      '<div class="home-hero__copy">' +
        '<div class="t-eyebrow">' + CW.esc(CW.brand.positioningSr) + '</div>' +
        '<h1 class="home-hero__title mt-2">Lov se<br>nikad ne<br><em>završava.</em></h1>' +
        '<p class="t-lead home-hero__lede">Zvanična CrazyWolves oprema.</p>' +

        /* Shop je primarno dugme; Discord ostaje, ali kao sporedno —
           sajt prvo prodaje, pa poziva u zajednicu. */
        '<div class="home-hero__actions">' +
          '<a class="btn btn--primary btn--lg" href="#/shop">' + CW.icon('tag', 18) + 'U shop</a>' +
          '<a class="btn btn--secondary btn--lg" href="' + DISCORD() + '">' + CW.icon('discord', 18) + 'Discord</a>' +
        '</div>' +
      '</div>' +

      /* Traka poverenja umesto brojeva zajednice: kupca zanima dostava i
         povraćaj, a ne koliko nas je na Discordu. */
      '<div class="home-hero__meta">' +
        '<div class="home-hero__stat"><div class="t-stat">3–5</div>' +
          '<div class="t-label mt-1">radnih dana</div></div>' +
        '<div class="home-hero__stat"><div class="t-stat">' + CW.money(CW.shopConfig.freeShippingThreshold) + '</div>' +
          '<div class="t-label mt-1">besplatna dostava preko</div></div>' +
        '<div class="home-hero__stat"><div class="t-stat">14</div>' +
          '<div class="t-label mt-1">dana za povraćaj</div></div>' +
        '<div class="home-hero__stat"><div class="t-stat">700+</div>' +
          '<div class="t-label mt-1">članova zajednice</div></div>' +
      '</div>' +
    '</div>' +
  '</section>' +

  /* ---------- SHOP ----------
     Prodaja je glavni posao sajta, pa ide odmah ispod heroja. Ranije je
     bila šesta sekcija, iza igara, usluga, CS2 tima i vesti. */
  '<section class="section container container--wide">' +
    CW.c.sectionHead({
      eyebrow: '01 — Zvanični shop',
      title: 'Napravljeno za vukove',
      action: '<a class="btn btn--quiet" href="#/shop">Ceo shop ' + CW.icon('arrowR', 15) + '</a>'
    }) +

    /* Izdvojeni proizvod stoji na svom baneru preko cele širine, a naziv,
       cena i dugme su u traci ispod. Ranije je poster šolje bio stisnut u
       stubac od 300px pored teksta — pola ekrana je bilo prazno, a slika
       koja nosi ceo brend izgledala je kao sličica. */
    (mug ?
    '<div class="feature-drop">' +
      '<a class="card__media feature-drop__media" href="#/proizvod/' + mug.slug + '" aria-label="' + CW.esc(mug.name) + '">' +
        CW.img('banner-solja', { ratio: '5 / 2', eager: true, fit: 'cover', ph: 'ZVANIČNA ŠOLJA' }) +
        '<span class="badge badge--limited feature-drop__badge">Limitirano izdanje</span>' +
      '</a>' +
      '<div class="feature-drop__bar">' +
        '<div class="feature-drop__text">' +
          '<h3 class="t-h2">' + CW.esc(mug.name) + '</h3>' +
          '<p class="t-body mt-1">' + CW.esc(mug.shortDesc) + '</p>' +
        '</div>' +
        '<div class="feature-drop__buy">' +
          '<span class="t-price feature-drop__price">' + CW.money(mug.price) + '</span>' +
          '<a class="btn btn--primary btn--lg" href="#/proizvod/' + mug.slug + '">Poruči</a>' +
        '</div>' +
      '</div>' +
    '</div>' : '') +

    /* Ostatak asortimana odmah ispod izdvojenog proizvoda — posetilac koji
       nije došao po šolju vidi da ima još toga, bez odlaska na drugu stranu. */
    (otherProducts.length
      ? '<div class="product-grid mt-5">' + otherProducts.map(CW.c.productCard).join('') + '</div>'
      : '') +

    '<div class="grid grid--4 mt-4">' +
      CW.nav.shopMenu.slice(1).map(function (c) {
        return '<a class="cat-tile" href="#' + c.path + '">' +
          '<span class="cat-tile__name">' + CW.esc(c.label) + '</span>' +
          CW.icon('arrowR', 16) +
        '</a>';
      }).join('') +
    '</div>' +
  '</section>' +

  /* ---------- BROJEVI ----------
     Igre, Discord, Instagram i boostovi — jedan red ispod shopa, da se
     vidi da iza prodavnice stoji živa zajednica. */
  '<section class="section--tight section--surface">' +
    '<div class="container container--wide">' +
      CW.c.statGrid(CW.data.communityStats, 6) +
    '</div>' +
  '</section>' +

  /* ---------- BLOG ----------
     U drugom planu: tri kartice bez izdvojenog velikog članka, koji je
     ranije zauzimao ceo ekran i takmičio se sa proizvodom. */
  '<section class="section container container--wide">' +
    CW.c.sectionHead({
      eyebrow: '02 — Blog',
      title: 'Najnovije',
      action: '<a class="btn btn--quiet" href="#/vesti">Sve objave ' + CW.icon('arrowR', 15) + '</a>'
    }) +
    '<div class="grid grid--2">' +
      [featured].concat(rest).slice(0, 2).map(CW.c.newsCard).join('') +
    '</div>' +
  '</section>' +

  /* ---------- SARADNJA ----------
     Jedan partner, pa ide u punom formatu umesto u mrežu kartica. */
  (function () {
    var p = CW.data.partners[0];
    if (!p) return '';
    return '<section class="section container container--wide">' +
      CW.c.sectionHead({ eyebrow: '03 — Saradnja', title: 'Zvanični partner' }) +
      /* Isti oblik kao izdvojeni proizvod: baner preko cele širine, podaci
         u traci ispod. Baner saradnje je 2.5:1 kao i ostali. */
      '<div class="feature-drop">' +
        '<div class="card__media feature-drop__media">' +
          CW.img(p.image, { ratio: '5 / 2', fit: 'cover', ph: CW.esc(p.name) }) +
        '</div>' +
        '<div class="feature-drop__bar">' +
          '<div class="feature-drop__text">' +
            '<div class="row row--wrap" style="gap:8px">' +
              '<span class="badge badge--gold">' + CW.esc(p.tier || 'Partner') + '</span>' +
              (p.since ? '<span class="badge badge--neutral">Od ' + CW.esc(p.since) + '</span>' : '') +
            '</div>' +
            '<h3 class="t-h2 mt-2">' + CW.esc(p.name) + '</h3>' +
            '<p class="t-body mt-1">' + CW.esc(p.blurb) + '</p>' +
          '</div>' +
          (p.url
            ? '<div class="feature-drop__buy">' +
                '<a class="btn btn--secondary btn--lg" href="' + p.url + '" target="_blank" rel="noopener">' +
                'Pogledaj kanal ' + CW.icon('external', 15) + '</a>' +
              '</div>'
            : '') +
        '</div>' +
      '</div>' +
    '</section>';
  })() +

  /* ---------- ZAVRŠNI CTA ----------
     Vodi u shop, ne na Discord — sajt prvo prodaje. */
  '<section class="section--tight container container--wide">' +
    '<div class="cta-band text-center">' +
      '<div class="t-eyebrow t-eyebrow--gold">Zvanična oprema</div>' +
      '<h2 class="t-h1 mt-2">Nosi grb.</h2>' +
      '<div class="row mt-4" style="justify-content:center;gap:12px;flex-wrap:wrap">' +
        '<a class="btn btn--primary btn--lg" href="#/shop">U shop</a>' +
        '<a class="btn btn--secondary btn--lg" href="' + DISCORD() + '">' + CW.icon('discord', 18) + 'Discord</a>' +
      '</div>' +
    '</div>' +
  '</section>';
};

/* ==========================================================================
   USLUGE
   ========================================================================== */
CW.pages.services = function () {
  return '' +
  '<section class="page-hero">' +
    '<div class="container container--wide page-hero__inner">' +
      CW.c.crumbs([{ label: 'Početna', path: '/' }, { label: 'Usluge', path: '/usluge' }]) +
      '<div class="grid grid--2 mt-3" style="align-items:center;gap:var(--space-5)">' +
        '<div>' +
          '<div class="t-eyebrow">Profesionalne usluge</div>' +
          '<h1 class="t-h1 mt-2">Rešenja za gejmere i online zajednice</h1>' +
          '<p class="t-lead mt-3">Naš tim pruža pouzdana, brza i profesionalna rešenja. ' +
            'Kvalitet kojem se veruje, brza isporuka — od gejmera, za gejmere.</p>' +
          '<div class="row row--wrap mt-4" style="gap:12px">' +
            '<a class="btn btn--primary btn--lg" href="' + DISCORD() + '">Otvori ticket</a>' +
            '<a class="btn btn--secondary btn--lg" href="#/kontakt">Pošalji upit</a>' +
          '</div>' +
        '</div>' +
        '<div style="border:var(--border);border-radius:var(--radius-card);overflow:hidden">' +
          CW.img('banner-services', { eager: true, ph: 'SERVICES' }) +
        '</div>' +
      '</div>' +
    '</div>' +
  '</section>' +

  '<section class="section container container--wide">' +
    CW.c.sectionHead({ eyebrow: 'Naše usluge', title: 'Sedam oblasti', desc: 'Sve što je potrebno da zajednica ili brend stanu na noge i porastu.' }) +
    '<div class="grid grid--4">' + CW.data.services.map(CW.c.serviceCard).join('') + '</div>' +
  '</section>' +

  '<section class="section--tight container container--wide">' +
    '<div style="border:var(--border);border-radius:var(--radius-card);overflow:hidden">' +
      CW.img('services-overview', { ph: 'PREGLED USLUGA' }) +
    '</div>' +
  '</section>' +

  '<section class="section section--surface">' +
    '<div class="container container--wide">' +
      CW.c.sectionHead({ eyebrow: 'Zašto mi', title: 'Šta dobijaš' }) +
      CW.c.trustStrip(CW.data.serviceTrust) +

      '<div class="mt-5 cta-band">' +
        '<div class="cta-band__inner">' +
          '<div class="cta-band__text">' +
            '<div class="t-eyebrow t-eyebrow--gold">Kako se počinje</div>' +
            '<h2 class="t-h2 mt-1">Otvori ticket ili piši staff timu</h2>' +
            '<p class="t-lead mt-2">Javiš šta ti treba, dobijaš ponudu i rok. Bez obaveze i bez naguravanja.</p>' +
          '</div>' +
          '<div class="cta-band__actions">' +
            '<a class="btn btn--primary btn--lg" href="' + DISCORD() + '">' + CW.icon('discord', 18) + 'Otvori ticket</a>' +
            '<a class="btn btn--secondary btn--lg" href="#/kontakt">Kontakt forma</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</section>' +

  '<section class="section container container--wide">' +
    '<div class="container container--text" style="padding:0">' +
      CW.c.sectionHead({ eyebrow: 'Pitanja', title: 'Često pitano o uslugama' }) +
      CW.pages._accordion(CW.data.faqs.filter(function (f) { return f.categoryId === 'usluge'; })) +
    '</div>' +
  '</section>';
};

/* ==========================================================================
   CS2 TIM
   ========================================================================== */
CW.pages.cs2 = function () {
  var t = CW.data.cs2Team;

  return '' +
  '<section class="page-hero">' +
    '<div class="container container--wide page-hero__inner">' +
      CW.c.crumbs([{ label: 'Početna', path: '/' }, { label: 'CS2 tim', path: '/cs2' }]) +
      '<div class="row row--wrap mt-3" style="gap:8px">' +
        '<span class="badge badge--gold">Prijave otvorene</span>' +
        '<span class="chip"><span class="chip__dot" style="background:' + CW.game('cs2').color + '"></span>Counter-Strike 2</span>' +
      '</div>' +
      '<h1 class="t-h1 mt-3">' + CW.esc(t.headline) + '</h1>' +
      '<p class="t-lead mt-2">' + CW.esc(t.subline) + ' ' + CW.esc(t.intro) + '</p>' +
    '</div>' +
  '</section>' +

  '<section class="section--tight container container--wide">' +
    '<div class="brackets" style="border:var(--border);border-radius:var(--radius-card);overflow:hidden">' +
      CW.img('banner-cs2-team', { eager: true, ph: 'CRAZYWOLVES CS2 TIM' }) +
    '</div>' +
  '</section>' +

  '<section class="section container container--wide">' +
    CW.c.sectionHead({ eyebrow: 'Šta nudimo igračima', title: 'Sedam razloga da se prijaviš' }) +
    '<div class="grid grid--4">' +
      t.offer.map(function (o) {
        return '<div class="benefit">' +
          '<div class="benefit__icon">' + CW.icon(o.icon, 20) + '</div>' +
          '<h3 class="t-h3">' + CW.esc(o.title) + '</h3>' +
          '<p class="t-sm">' + CW.esc(o.text) + '</p></div>';
      }).join('') +
    '</div>' +
  '</section>' +

  '<section class="section section--surface">' +
    '<div class="container container--wide">' +
      '<div class="cta-band text-center">' +
        '<div class="t-eyebrow t-eyebrow--gold">Prijava</div>' +
        '<h2 class="t-h1 mt-2">Misliš da imaš šta treba?</h2>' +
        '<p class="t-lead mx-auto mt-3" style="max-width:52ch">' + CW.esc(t.cta) + '</p>' +
        '<div class="row mt-4" style="justify-content:center;gap:12px;flex-wrap:wrap">' +
          '<a class="btn btn--primary btn--lg" href="' + DISCORD() + '">' + CW.icon('discord', 18) + 'Otvori ticket i prijavi se</a>' +
          '<a class="btn btn--secondary btn--lg" href="#/kontakt">Pitaj nešto pre prijave</a>' +
        '</div>' +
      '</div>' +

      '<div class="mt-5 container container--text" style="padding:0">' +
        CW.pages._accordion(CW.data.faqs.filter(function (f) { return f.categoryId === 'timovi'; })) +
      '</div>' +
    '</div>' +
  '</section>';
};

/* ==========================================================================
   ZAJEDNICA
   ========================================================================== */
CW.pages.community = function () {
  return '' +
  '<section class="hero">' +
    '<div class="container container--wide hero__inner">' +
      CW.c.crumbs([{ label: 'Početna', path: '/' }, { label: 'Zajednica', path: '/zajednica' }]) +
      '<div class="grid grid--2 mt-4" style="align-items:center;gap:var(--space-5)">' +
        '<div>' +
          '<div class="t-eyebrow">Čopor</div>' +
          '<h1 class="t-hero mt-2">Svaki čopor<br>je počeo od<br><span class="t-gold">jednog vuka.</span></h1>' +
          '<p class="t-lead mt-3">Preko 700 članova. Bez prijave i bez uslova.</p>' +
          '<div class="row row--wrap mt-4" style="gap:12px">' +
            '<a class="btn btn--primary btn--lg" href="' + DISCORD() + '">' + CW.icon('discord', 18) + 'Uđi na Discord</a>' +
            '<a class="btn btn--secondary btn--lg" href="#/dogadjaji">Šta se dešava</a>' +
          '</div>' +
        '</div>' +
        '<div class="brackets" style="border:var(--border);border-radius:var(--radius-card);overflow:hidden">' +
          CW.img('hero-flag-hills', { ratio: '16 / 9', eager: true, ph: 'CRAZYWOLVES ZASTAVA' }) +
        '</div>' +
      '</div>' +
    '</div>' +
  '</section>' +

  '<section class="section--tight container container--wide">' +
    CW.c.statGrid(CW.data.communityStats, 6) +
  '</section>' +

  /* ---------- DISCORD STRUKTURA ---------- */
  '<section class="section section--surface">' +
    '<div class="container container--wide">' +
      CW.c.sectionHead({
        eyebrow: '01 — Kako izgleda server',
        title: 'Šta te čeka unutra',
        desc: 'U #choose-roles biraš šta te zanima i vidiš samo te kanale.'
      }) +
      '<div class="grid grid--3">' +
        CW.data.discordSections.map(function (s) {
          return '<article class="card">' +
            (s.image ? '<div class="card__media">' + CW.img(s.image, { ratio: '4 / 3', ph: s.name }) + '</div>' : '') +
            '<div class="card__body">' +
              '<h3 class="t-h3">' + CW.esc(s.name) + '</h3>' +
              '<p class="t-sm">' + CW.esc(s.blurb) + '</p>' +
              '<div class="row row--wrap mt-1" style="gap:6px">' +
                s.channels.map(function (c) { return '<span class="badge badge--neutral">' + CW.esc(c) + '</span>'; }).join('') +
              '</div>' +
            '</div>' +
          '</article>';
        }).join('') +
      '</div>' +
    '</div>' +
  '</section>' +

  /* ---------- ŠTA DOBIJAŠ ---------- */
  '<section class="section container container--wide">' +
    CW.c.sectionHead({ eyebrow: '02 — Članstvo', title: 'Šta članstvo stvarno znači' }) +
    '<div class="philosophy-grid">' +
      CW.data.communityBenefits.map(function (b) {
        return '<div class="benefit">' +
          '<div class="benefit__icon">' + CW.icon(b.icon, 20) + '</div>' +
          '<h3 class="t-h3">' + CW.esc(b.title) + '</h3>' +
          '<p class="t-sm">' + CW.esc(b.text) + '</p></div>';
      }).join('') +
    '</div>' +
  '</section>' +

  /* ---------- PRAVILA ---------- */
  '<section class="section container container--wide">' +
    '<div class="grid grid--2" style="gap:var(--space-6)">' +
      '<div>' +
        '<div class="t-eyebrow">05 — Pravila</div>' +
        '<h2 class="t-h2 mt-1">Osam pravila, i mislimo ozbiljno</h2>' +
        
        '<div class="alert alert--gold mt-4">' + CW.icon('shield', 18) +
          '<span>Staff tim je prisutan. Prijave se rešavaju istog dana.</span></div>' +
        '<div class="mt-4" style="border:var(--border);border-radius:var(--radius-card);overflow:hidden">' +
          CW.img('banner-server-guide', { ph: 'SERVER GUIDE' }) +
        '</div>' +
      '</div>' +
      '<div class="rules-list">' +
        CW.data.communityRules.map(function (r) {
          return '<div class="rule-item"><div>' +
            '<div class="t-h4">' + CW.esc(r.title) + '</div>' +
            '<div class="t-sm mt-1">' + CW.esc(r.text) + '</div></div></div>';
        }).join('') +
      '</div>' +
    '</div>' +
  '</section>' +

  /* ---------- DRUŠTVENE MREŽE ---------- */
  '<section class="section section--surface">' +
    '<div class="container container--wide">' +
      CW.c.sectionHead({ eyebrow: '04 — Prati nas', title: 'Sve mreže na jednom mestu' }) +
      '<div class="grid grid--2" style="gap:var(--space-5);align-items:center">' +
        '<div style="border:var(--border);border-radius:var(--radius-card);overflow:hidden">' +
          CW.img('promo-instagram', { ph: 'INSTAGRAM PROMO' }) +
        '</div>' +
        '<div>' +
          '<div class="stack stack-2">' +
            CW.data.socials.map(function (s) {
              return '<a class="member" href="' + s.url + '">' +
                '<span class="avatar">' + CW.icon(CW.socialIcon(s.id), 20) + '</span>' +
                '<span style="min-width:0"><span class="t-h4" style="display:block">' + CW.esc(s.name) + '</span>' +
                '<span class="t-xs">' + CW.esc(s.handle) + '</span></span>' +
                '<span class="spacer"></span>' + CW.icon('arrowUR', 16) + '</a>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</section>' +

  '<section class="section--tight container container--wide">' + CW.c.ctaBand({
    eyebrow: 'Poslednja stvar',
    title: 'Tvoje mesto je već tu',
    text: 'Prihvatiš pravila i unutra si.',
    secondary: { label: 'Česta pitanja', path: '/pitanja' }
  }) + '</section>';
};

/* ==========================================================================
   VESTI
   ========================================================================== */
CW.pages.news = function (ctx) {
  var cat = ctx.query.category || 'all';
  var term = (ctx.query.q || '').toLowerCase();
  var page = parseInt(ctx.query.page || '1', 10);
  var perPage = 6;

  var all = CW.data.news.slice().sort(function (a, b) { return b.dayOffset - a.dayOffset; });
  var filtered = all.filter(function (n) {
    if (cat !== 'all' && n.categoryId !== cat) return false;
    if (term && (n.title + ' ' + n.dek).toLowerCase().indexOf(term) === -1) return false;
    return true;
  });

  var featured = (cat === 'all' && !term) ? filtered.filter(function (n) { return n.featured; })[0] : null;
  var list = featured ? filtered.filter(function (n) { return n.id !== featured.id; }) : filtered;
  var totalPages = Math.ceil(list.length / perPage) || 1;
  var pageItems = list.slice((page - 1) * perPage, page * perPage);
  var trending = all.filter(function (n) { return n.trending; }).slice(0, 5);

  var skeleton = '<div class="grid grid--2">' + CW.times(4, CW.c.newsSkeleton) + '</div>';

  var content = function () {
    if (!pageItems.length) {
      return CW.c.empty({
        icon: 'search',
        title: 'Nema objava',
        text: term ? 'Ništa ne odgovara pojmu „' + term + '".' : 'U ovoj kategoriji još nema objava.',
        actions: '<a class="btn btn--secondary" href="#/vesti">Poništi filtere</a>'
      });
    }
    return '<div class="grid grid--2">' + pageItems.map(CW.c.newsCard).join('') + '</div>' +
      (totalPages > 1 ? '<div class="mt-5">' + CW.c.pagination(page, totalPages) + '</div>' : '');
  };

  return '' +
  '<section class="page-hero">' +
    '<div class="container container--wide page-hero__inner">' +
      CW.c.crumbs([{ label: 'Početna', path: '/' }, { label: 'Blog', path: '/vesti' }]) +
      '<h1 class="t-h1 mt-2">Blog</h1>' +
      '<p class="t-lead mt-2">Najave, saradnje i šta se dešava u čoporu.</p>' +
    '</div>' +
  '</section>' +

  '<section class="section container container--wide">' +
    '<div class="news-layout">' +
      '<div>' +
        '<form class="row row--wrap mb-3" data-act="news-search" style="gap:8px" novalidate>' +
          '<div class="input-wrap" style="flex:1;min-width:220px">' +
            CW.icon('search', 18) +
            '<label class="visually-hidden" for="news-q">Pretraži objave</label>' +
            '<input class="input" id="news-q" name="q" type="search" placeholder="Pretraži objave…" value="' + CW.esc(ctx.query.q || '') + '">' +
          '</div>' +
          '<button class="btn btn--secondary" type="submit">Traži</button>' +
        '</form>' +

        '<div class="row row--wrap mb-4" style="gap:8px" role="group" aria-label="Filtriraj po kategoriji">' +
          '<a class="filter-chip' + (cat === 'all' ? ' is-active' : '') + '" href="#/vesti">Sve</a>' +
          CW.data.newsCategories.map(function (c) {
            var count = all.filter(function (n) { return n.categoryId === c.id; }).length;
            if (!count) return '';
            return '<a class="filter-chip' + (cat === c.id ? ' is-active' : '') + '" href="#/vesti?category=' + c.id + '">' +
              CW.esc(c.name) + '<span class="filter-chip__count">' + count + '</span></a>';
          }).join('') +
        '</div>' +

        '<div class="row row--between mb-3">' +
          '<span class="toolbar__count">' + list.length + ' ' +
            CW.plural(list.length, 'objava', 'objave', 'objava') + '</span>' +
        '</div>' +

        '<div data-loading-key="news" aria-busy="' + (CW.loaded.news ? 'false' : 'true') + '">' +
          CW.withLoading('news', skeleton, content) +
        '</div>' +
      '</div>' +

      '<aside class="news-rail">' +
        '<div>' +
          '<div class="t-eyebrow t-eyebrow--gold mb-2">Najčitanije</div>' +
          '<div class="trending-list">' +
            trending.map(function (n, i) {
              return '<a class="trending-item" href="#/vesti/' + n.id + '">' +
                '<span class="trending-item__rank">' + String(i + 1).padStart(2, '0') + '</span>' +
                '<span><span class="trending-item__title">' + CW.esc(n.title) + '</span>' +
                '<span class="t-xs" style="display:block;margin-top:4px">' + CW.relative(CW.resolveDate(n.dayOffset, '10:00')) + '</span></span>' +
              '</a>';
            }).join('') +
          '</div>' +
        '</div>' +

        '<div class="cta-band" style="padding:var(--space-3)">' +
          '<div class="t-eyebrow t-eyebrow--gold">Newsletter</div>' +
          '<h3 class="t-h3 mt-1">Jedan mejl nedeljno</h3>' +
          '<p class="t-sm mt-1">Najave, drops i događaji. Ništa više.</p>' +
          '<form class="stack stack-1 mt-3" data-act="newsletter" novalidate>' +
            '<label class="visually-hidden" for="rail-nl">Email adresa</label>' +
            '<input class="input" id="rail-nl" name="email" type="email" placeholder="ti@primer.rs" required>' +
            '<button class="btn btn--primary btn--full" type="submit">Prijavi se</button>' +
          '</form>' +
        '</div>' +
      '</aside>' +
    '</div>' +
  '</section>';
};

/* ==========================================================================
   ČLANAK
   ========================================================================== */
CW.pages.article = function (ctx) {
  var n = CW.find('news', ctx.params.id);
  if (!n) return CW.pages.notFound();

  var cat = CW.find('newsCategories', n.categoryId) || { name: '' };
  var iso = CW.resolveDate(n.dayOffset, '10:00');
  var sorted = CW.data.news.slice().sort(function (a, b) { return b.dayOffset - a.dayOffset; });
  var idx = sorted.findIndex(function (x) { return x.id === n.id; });
  var prev = sorted[idx + 1];
  var next = sorted[idx - 1];
  var related = (n.relatedIds || []).map(function (id) { return CW.find('news', id); }).filter(Boolean);

  var body = n.body.map(function (b) {
    if (b.type === 'p') return '<p>' + CW.esc(b.text) + '</p>';
    if (b.type === 'h2') return '<h2>' + CW.esc(b.text) + '</h2>';
    if (b.type === 'h3') return '<h3>' + CW.esc(b.text) + '</h3>';
    if (b.type === 'quote') return '<blockquote>„' + CW.esc(b.text) + '"</blockquote>';
    if (b.type === 'list') return '<ul>' + b.items.map(function (i) { return '<li>' + CW.esc(i) + '</li>'; }).join('') + '</ul>';
    return '';
  }).join('');

  return '' +
  '<article>' +
    '<section class="section--tight container container--wide">' +
      CW.c.crumbs([
        { label: 'Početna', path: '/' }, { label: 'Blog', path: '/vesti' },
        { label: cat.name, path: '/vesti?category=' + n.categoryId }, { label: n.title, path: '' }
      ]) +
    '</section>' +

    '<header class="container container--wide">' +
      '<div class="article-head text-center">' +
        '<span class="tag tag--solid">' + CW.esc(cat.name) + '</span>' +
        '<h1 class="t-h1 mt-3">' + CW.esc(n.title) + '</h1>' +
        '<p class="t-lead mt-3 mx-auto">' + CW.esc(n.dek) + '</p>' +
      '</div>' +
    '</header>' +

    '<div class="container container--wide mt-4">' +
      '<div class="article-hero">' +
        (n.image ? CW.imgPost(n, { fit: 'contain', cls: 'article-hero__img', eager: true, ph: n.title })
                 : '<div class="ph" style="height:100%;aspect-ratio:auto" data-ph="SLIKA ČLANKA"></div>') +
      '</div>' +
    '</div>' +

    '<div class="container container--wide section">' +
      '<div class="article-body">' +
        '<div class="article-meta">' +
          '<div class="article-author">' +
            '<span class="avatar">' + CW.icon('shield', 20) + '</span>' +
            '<div><div class="t-h4">' + CW.esc(n.author) + '</div>' +
            '<div class="t-xs">' + CW.fmtDate(iso, 'long') + ' · ' + n.readMin + ' min čitanja</div></div>' +
          '</div>' +
          '<span class="spacer"></span>' +
          '<div class="share">' +
            '<span class="t-label" style="margin-right:4px">Podeli</span>' +
            '<button class="btn-icon btn-icon--sm btn-icon--bordered" type="button" data-act="share" data-net="Instagram" aria-label="Podeli na Instagramu">' + CW.icon('instagram', 16) + '</button>' +
            '<button class="btn-icon btn-icon--sm btn-icon--bordered" type="button" data-act="share" data-net="Discord" aria-label="Podeli na Discordu">' + CW.icon('discord', 16) + '</button>' +
            '<button class="btn-icon btn-icon--sm btn-icon--bordered" type="button" data-act="copy-link" aria-label="Kopiraj link">' + CW.icon('link', 16) + '</button>' +
          '</div>' +
        '</div>' +

        '<div class="prose mt-4">' + body + '</div>' +

        '<div class="mt-5">' + CW.c.ctaBand({
          eyebrow: 'Dopalo ti se?',
          title: 'Sve stiže prvo na Discord',
          text: 'Najave, drops i događaji objavljuju se u zajednici pre nego bilo gde drugde.'
        }) + '</div>' +

        '<nav class="pagenav mt-5" aria-label="Još objava">' +
          (prev ? '<a class="pagenav__item" href="#/vesti/' + prev.id + '">' +
            '<span class="pagenav__dir">' + CW.icon('arrowL', 14) + ' Prethodna</span>' +
            '<span class="pagenav__title">' + CW.esc(prev.title) + '</span></a>'
            : '<span class="pagenav__item" style="opacity:.45"><span class="pagenav__dir">Prethodna</span><span class="pagenav__title t-muted">Ovo je najstarija objava</span></span>') +
          (next ? '<a class="pagenav__item pagenav__item--next" href="#/vesti/' + next.id + '">' +
            '<span class="pagenav__dir">Sledeća ' + CW.icon('arrowR', 14) + '</span>' +
            '<span class="pagenav__title">' + CW.esc(next.title) + '</span></a>'
            : '<span class="pagenav__item pagenav__item--next" style="opacity:.45"><span class="pagenav__dir">Sledeća</span><span class="pagenav__title t-muted">Ovo je najnovija objava</span></span>') +
        '</nav>' +
      '</div>' +
    '</div>' +

    (related.length ?
    '<section class="section section--surface">' +
      '<div class="container container--wide">' +
        CW.c.sectionHead({ eyebrow: 'Nastavi da čitaš', title: 'Povezane objave' }) +
        '<div class="grid grid--' + Math.min(3, related.length) + '">' + related.map(CW.c.newsCard).join('') + '</div>' +
      '</div>' +
    '</section>' : '') +
  '</article>';
};

/* ==========================================================================
   DOGAĐAJI
   ========================================================================== */
CW.pages.events = function () {
  var upcoming = CW.data.events.slice().sort(function (a, b) { return a.dayOffset - b.dayOffset; });
  var featured = upcoming.filter(function (e) { return e.featured; })[0];
  var rest = upcoming.filter(function (e) { return !featured || e.id !== featured.id; });

  return '' +
  '<section class="page-hero">' +
    '<div class="container container--wide page-hero__inner">' +
      CW.c.crumbs([{ label: 'Početna', path: '/' }, { label: 'Događaji', path: '/dogadjaji' }]) +
      '<h1 class="t-h1 mt-2">Događaji</h1>' +
      '<p class="t-lead mt-2">Community Week, giveaway i squad night. Sve je besplatno i otvoreno za sve članove.</p>' +
    '</div>' +
  '</section>' +

  (featured ?
  '<section class="section--tight container container--wide">' +
    '<div class="event-hero">' +
      '<div>' +
        '<div class="row row--wrap" style="gap:8px">' +
          '<span class="badge badge--gold">Izdvojeno</span>' +
          '<span class="badge badge--neutral">' + (featured.kind === 'offline' ? 'Uživo' : 'Online') + '</span>' +
        '</div>' +
        '<h2 class="t-h1 mt-2">' + CW.esc(featured.title) + '</h2>' +
        '<p class="t-lead mt-3">' + CW.esc(featured.blurb) + '</p>' +

        '<div class="spec-list mt-4" style="max-width:440px">' +
          '<div class="spec-list__row"><span class="spec-list__k">Kada</span><span class="spec-list__v">' + CW.fmtDate(CW.resolveDate(featured.dayOffset, featured.time), 'long') + '</span></div>' +
          '<div class="spec-list__row"><span class="spec-list__k">Vreme</span><span class="spec-list__v">' + featured.time + ' – ' + featured.endTime + '</span></div>' +
          '<div class="spec-list__row"><span class="spec-list__k">Gde</span><span class="spec-list__v">' + CW.esc(featured.location) + '</span></div>' +
          '<div class="spec-list__row"><span class="spec-list__k">Ulaz</span><span class="spec-list__v">' + CW.esc(featured.price) + '</span></div>' +
        '</div>' +

        '<ul class="prose mt-3" style="font-size:var(--fs-sm)">' +
          featured.details.map(function (d) { return '<li>' + CW.esc(d) + '</li>'; }).join('') +
        '</ul>' +

        '<div class="row row--wrap mt-4" style="gap:10px">' +
          '<a class="btn btn--primary btn--lg" href="' + DISCORD() + '">' + CW.icon('discord', 18) + 'Pridruži se</a>' +
        '</div>' +
      '</div>' +
      '<div style="border:var(--border);border-radius:var(--radius-card);overflow:hidden">' +
        (featured.image ? CW.img(featured.image, { ratio: '4 / 3', ph: featured.title })
                        : '<div class="ph ph--4x3" data-ph="DOGAĐAJ"></div>') +
      '</div>' +
    '</div>' +
  '</section>' : '') +

  '<section class="section container container--wide">' +
    CW.c.sectionHead({ eyebrow: 'U kalendaru', title: 'Redovni događaji' }) +
    (rest.length ? '<div class="grid grid--3">' + rest.map(CW.c.eventCard).join('') + '</div>'
      : CW.c.empty({ icon: 'calendar', title: 'Nema zakazanih događaja',
        text: 'Trenutno ništa nije u kalendaru. Novi događaji se najavljuju prvo na Discordu.',
        actions: '<a class="btn btn--primary" href="' + DISCORD() + '">Uđi na Discord</a>' })) +
  '</section>' +

  '<section class="section--tight container container--wide">' + CW.c.ctaBand({
    eyebrow: 'Ne propusti',
    title: 'Sve najave idu na Discord',
    text: 'Raspored, uslovi i izmene objavljuju se u #announcement kanalu.'
  }) + '</section>';
};

/* ==========================================================================
   PARTNERI
   ========================================================================== */
CW.pages.partners = function () {
  var p = CW.data.partners[0];

  return '' +
  '<section class="page-hero">' +
    '<div class="container container--wide page-hero__inner">' +
      CW.c.crumbs([{ label: 'Početna', path: '/' }, { label: 'Partneri', path: '/partneri' }]) +
      '<h1 class="t-h1 mt-2">Partneri i saradnje</h1>' +
      '<p class="t-lead mt-2">Sa kim sarađujemo i kako izgleda saradnja sa CrazyWolves zajednicom.</p>' +
    '</div>' +
  '</section>' +

  '<section class="section container container--wide">' +
    '<div class="tier-head">' +
      '<span class="t-eyebrow t-eyebrow--gold">Zvanični partner</span>' +
      '<span class="tier-head__line"></span>' +
    '</div>' +

    '<div class="grid grid--2" style="gap:var(--space-5);align-items:center">' +
      '<div class="brackets" style="border:1px solid rgba(212,162,78,0.45);border-radius:var(--radius-card);overflow:hidden">' +
        CW.img('partner-wolf3tv', { eager: true, ph: 'PARTNERSTVO — WOLF3TV' }) +
      '</div>' +
      '<div>' +
        '<div class="row row--wrap" style="gap:8px">' +
          '<span class="badge badge--gold">Zvanična saradnja</span>' +
          '<span class="badge badge--neutral">' + CW.esc(p.category) + '</span>' +
          '<span class="t-label">Od ' + CW.esc(p.since) + '.</span>' +
        '</div>' +
        '<h2 class="t-h1 mt-2">' + CW.esc(p.name) + '</h2>' +
        '<p class="t-lead mt-3">' + CW.esc(p.blurb) + '</p>' +
        '<div class="grid grid--2 mt-4" style="gap:var(--space-2)">' +
          p.values.map(function (v) {
            return '<div class="value-item"><div class="value-item__title" style="font-size:1rem">' + CW.esc(v) + '</div></div>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</div>' +
  '</section>' +

  '<section class="section section--surface">' +
    '<div class="container container--wide">' +
      CW.c.sectionHead({ eyebrow: 'Zašto CrazyWolves', title: 'Šta dobija partner' }) +
      '<div class="grid grid--2">' +
        CW.data.partnerBenefits.map(function (b) {
          return '<div class="benefit">' +
            '<div class="benefit__icon">' + CW.icon(b.icon, 20) + '</div>' +
            '<h3 class="t-h3">' + CW.esc(b.title) + '</h3>' +
            '<p class="t-sm">' + CW.esc(b.text) + '</p></div>';
        }).join('') +
      '</div>' +

      '<div class="mt-5">' + CW.c.statGrid(CW.data.communityStats.slice(0, 4), 4) + '</div>' +
    '</div>' +
  '</section>' +

  '<section class="section container container--wide">' +
    '<div class="cta-band brackets">' +
      '<div class="cta-band__inner">' +
        '<div class="cta-band__text">' +
          '<div class="t-eyebrow t-eyebrow--gold">Otvoreno za saradnju</div>' +
          '<h2 class="t-h2 mt-1">Hajde da pričamo</h2>' +
          '<p class="t-lead mt-2">Reci nam šta želiš da postigneš i javljamo se sa predlogom. Bez naguravanja.</p>' +
        '</div>' +
        '<div class="cta-band__actions">' +
          '<a class="btn btn--primary btn--lg" href="#/kontakt?topic=partnerstvo">Pošalji upit</a>' +
          '<a class="btn btn--secondary btn--lg" href="' + DISCORD() + '">Otvori ticket</a>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</section>';
};

/* ==========================================================================
   O NAMA
   ========================================================================== */
CW.pages.about = function () {
  var a = CW.data.about;
  var statusMap = {
    active:  { cls: 'badge--success', label: 'Aktivno' },
    wip:     { cls: 'badge--low',     label: 'U izradi' },
    planned: { cls: 'badge--neutral', label: 'Planirano' }
  };

  return '' +
  '<section class="hero">' +
    '<div class="container container--wide hero__inner">' +
      CW.c.crumbs([{ label: 'Početna', path: '/' }, { label: 'O nama', path: '/o-nama' }]) +
      '<div class="grid grid--2 mt-4" style="align-items:center;gap:var(--space-5)">' +
        '<div>' +
          '<div class="t-eyebrow">O CrazyWolves</div>' +
          '<h1 class="t-hero mt-2">Napravljeno<br>od čopora,<br><span class="t-gold">za čopor.</span></h1>' +
          '<p class="t-lead mt-3">' + CW.esc(a.positioning) + '</p>' +
        '</div>' +
        '<div class="brackets" style="border:var(--border);border-radius:var(--radius-card);overflow:hidden">' +
          CW.img('hero-flag-city', { ratio: '16 / 9', eager: true, ph: 'CRAZYWOLVES' }) +
        '</div>' +
      '</div>' +
    '</div>' +
  '</section>' +

  '<section class="section container container--wide">' +
    '<div class="grid grid--2" style="gap:var(--space-6)">' +
      '<div>' +
        '<div class="t-eyebrow">01 — Priča</div>' +
        '<h2 class="t-h2 mt-1">Kako je počelo</h2>' +
        '<div class="prose mt-3">' + a.story.map(function (p) { return '<p>' + CW.esc(p) + '</p>'; }).join('') + '</div>' +
      '</div>' +
      '<div class="grid" style="gap:var(--space-2);align-content:start">' +
        [['Misija', a.mission], ['Vizija', a.vision], ['Obećanje', a.promise]].map(function (pair) {
          return '<div class="card"><div class="card__body">' +
            '<div class="t-eyebrow t-eyebrow--gold">' + pair[0] + '</div>' +
            '<p class="t-body-lg">' + CW.esc(pair[1]) + '</p></div></div>';
        }).join('') +
      '</div>' +
    '</div>' +
  '</section>' +

  '<section class="section section--surface">' +
    '<div class="container container--wide">' +
      CW.c.sectionHead({ eyebrow: '02 — Vrednosti', title: 'Pet stvari koje se ne menjaju' }) +
      '<div class="grid grid--5">' +
        a.values.map(function (v) {
          return '<div class="value-item"><div class="value-item__title">' + CW.esc(v.title) + '</div>' +
            '<div class="value-item__text">' + CW.esc(v.text) + '</div></div>';
        }).join('') +
      '</div>' +
    '</div>' +
  '</section>' +

  '<section class="section container container--wide">' +
    CW.c.sectionHead({
      eyebrow: '03 — Dugoročna vizija',
      title: 'Kompletan gaming ekosistem',
      desc: 'Cilj nije još jedan Discord server, nego povezan sistem u kome svaki deo hrani ostale.'
    }) +
    '<div class="grid grid--3">' +
      a.ecosystem.map(function (e) {
        var s = statusMap[e.status];
        return '<div class="card"><div class="card__body" style="gap:10px">' +
          '<div class="row row--between">' +
            '<span class="benefit__icon" style="width:38px;height:38px">' + CW.icon(e.icon, 18) + '</span>' +
            '<span class="badge ' + s.cls + '">' + s.label + '</span>' +
          '</div>' +
          '<h3 class="t-h4">' + CW.esc(e.name) + '</h3>' +
          '<p class="t-sm">' + CW.esc(e.note) + '</p>' +
        '</div></div>';
      }).join('') +
    '</div>' +
  '</section>' +

  '<section class="section section--surface">' +
    '<div class="container container--wide">' +
      CW.c.sectionHead({ eyebrow: '04 — Brojevi', title: 'Gde smo sada' }) +
      CW.c.statGrid(CW.data.communityStats, 6) +
    '</div>' +
  '</section>' +

  '<section class="section--tight container container--wide">' +
    '<div class="cta-band text-center">' +
      '<div class="t-eyebrow t-eyebrow--gold">Javi nam se</div>' +
      '<h2 class="t-h1 mt-2">Pitanja, saradnje,<br>ili samo pozdrav</h2>' +
      '<div class="row mt-4" style="justify-content:center;gap:12px;flex-wrap:wrap">' +
        '<a class="btn btn--primary btn--lg" href="#/kontakt">Kontakt</a>' +
        '<a class="btn btn--secondary btn--lg" href="' + DISCORD() + '">Uđi na Discord</a>' +
      '</div>' +
    '</div>' +
  '</section>';
};

/* ==========================================================================
   KONTAKT
   ========================================================================== */
CW.pages.contact = function (ctx) {
  var topic = ctx.query.topic || 'opste';

  return '' +
  '<section class="page-hero">' +
    '<div class="container container--wide page-hero__inner">' +
      CW.c.crumbs([{ label: 'Početna', path: '/' }, { label: 'Kontakt', path: '/kontakt' }]) +
      '<h1 class="t-h1 mt-2">Kontakt</h1>' +
      '<p class="t-lead mt-2">Opšta pitanja, usluge, saradnje ili podrška za porudžbine — izaberi temu i javljamo se brže.</p>' +
    '</div>' +
  '</section>' +

  '<section class="section container container--wide">' +
    '<div class="contact-layout">' +

      '<form class="card" data-act="contact-form" novalidate>' +
        '<div class="card__body" style="padding:var(--space-4);gap:var(--space-3)">' +
          '<div class="fieldset">' +
            '<h2 class="fieldset__legend">Pošalji poruku</h2>' +

            '<div class="field">' +
              '<label class="field__label" for="c-topic">Tema <span class="field__req">*</span></label>' +
              '<select class="select" id="c-topic" name="topic" required>' +
                '<option value="opste"' + (topic === 'opste' ? ' selected' : '') + '>Opšte pitanje</option>' +
                '<option value="usluge"' + (topic === 'usluge' ? ' selected' : '') + '>Upit za uslugu</option>' +
                '<option value="partnerstvo"' + (topic === 'partnerstvo' ? ' selected' : '') + '>Saradnja i partnerstvo</option>' +
                '<option value="shop"' + (topic === 'shop' ? ' selected' : '') + '>Podrška za porudžbinu</option>' +
                '<option value="cs2">Prijava za CS2 tim</option>' +
              '</select>' +
            '</div>' +

            '<div class="field-row">' +
              '<div class="field">' +
                '<label class="field__label" for="c-name">Ime <span class="field__req">*</span></label>' +
                '<input class="input" id="c-name" name="name" type="text" autocomplete="name" required>' +
                '<div class="field__error hidden" data-error-for="c-name"></div>' +
              '</div>' +
              '<div class="field">' +
                '<label class="field__label" for="c-email">Email <span class="field__req">*</span></label>' +
                '<input class="input" id="c-email" name="email" type="email" autocomplete="email" required>' +
                '<div class="field__error hidden" data-error-for="c-email"></div>' +
              '</div>' +
            '</div>' +

            '<div class="field">' +
              '<label class="field__label" for="c-discord">Discord handle <span class="t-muted">(opciono)</span></label>' +
              '<input class="input" id="c-discord" name="discord" type="text" placeholder="tvoj.handle">' +
              '<div class="field__hint">Ako si na serveru, ovako te brže nađemo.</div>' +
            '</div>' +

            '<div class="field">' +
              '<label class="field__label" for="c-msg">Poruka <span class="field__req">*</span></label>' +
              '<textarea class="textarea" id="c-msg" name="message" required placeholder="Reci šta ti treba. Što više detalja, to brže možemo da pomognemo."></textarea>' +
              '<div class="field__hint">Odgovaramo u roku od dva radna dana. Preko Discord ticketa je obično brže.</div>' +
              '<div class="field__error hidden" data-error-for="c-msg"></div>' +
            '</div>' +

            '<label class="check">' +
              '<input type="checkbox" name="consent" required>' +
              '<span class="check__box">' + CW.icon('check', 13) + '</span>' +
              '<span class="check__label">Saglasan sam da CrazyWolves čuva i koristi moje podatke radi odgovora na ovaj upit, kako je opisano u <a class="link-underline" href="#/privatnost">Politici privatnosti</a>. <span class="field__req">*</span></span>' +
            '</label>' +
            '<div class="field__error hidden" data-error-for="consent"></div>' +

            '<div class="row form-actions" style="gap:10px">' +
              '<button class="btn btn--primary btn--lg" type="submit">Pošalji poruku</button>' +
              '<button class="btn btn--ghost" type="reset">Očisti</button>' +
            '</div>' +

            '<div data-form-status role="status" aria-live="polite"></div>' +
          '</div>' +
        '</div>' +
      '</form>' +

      '<aside class="stack stack-3">' +
        '<div class="contact-method">' + CW.icon('discord', 20) +
          '<div><b class="t-h4">Najbrži način</b>' +
          '<div class="t-sm mt-1">Otvori ticket na Discordu</div>' +
          '<div class="t-xs mt-1">Odgovor obično stiže isti dan.</div>' +
          '<a class="btn btn--secondary btn--sm mt-2" href="' + DISCORD() + '">Uđi na Discord</a></div></div>' +

        '<div class="contact-method">' + CW.icon('zap', 20) +
          '<div><b class="t-h4">Usluge</b>' +
          '<div class="t-sm mt-1">Ponuda i rok na osnovu tvog upita.</div>' +
          '<a class="link-arrow mt-2" href="#/shop">Pogledaj shop ' + CW.icon('arrowR', 14) + '</a></div></div>' +

        '<div class="contact-method">' + CW.icon('package', 20) +
          '<div><b class="t-h4">Porudžbine</b>' +
          '<div class="t-sm mt-1">Pripremi broj porudžbine.</div>' +
          '<a class="link-arrow mt-2" href="#/pitanja">Česta pitanja ' + CW.icon('arrowR', 14) + '</a></div></div>' +

        '<div class="card"><div class="card__body">' +
          '<div class="t-eyebrow t-eyebrow--gold">Prati nas</div>' +
          '<div class="socials mt-2">' +
            CW.data.socials.map(function (s) {
              return '<a class="social" href="' + s.url + '" aria-label="' + CW.esc(s.name) + '">' + CW.icon(CW.socialIcon(s.id), 18) + '</a>';
            }).join('') +
          '</div>' +
          '<div class="spec-list mt-3">' +
            '<div class="spec-list__row"><span class="spec-list__k">Sajt</span><span class="spec-list__v">' + CW.esc(CW.brand.website) + '</span></div>' +
            '<div class="spec-list__row"><span class="spec-list__k">Discord</span><span class="spec-list__v">' + CW.esc(CW.brand.discord) + '</span></div>' +
            '<div class="spec-list__row"><span class="spec-list__k">Instagram</span><span class="spec-list__v">' + CW.esc(CW.brand.instagram) + '</span></div>' +
          '</div>' +
        '</div></div>' +
      '</aside>' +
    '</div>' +
  '</section>';
};
