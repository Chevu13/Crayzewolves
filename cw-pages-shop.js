/* ==========================================================================
   CRAZYWOLVES — SHOP PAGES
   Shop landing · Category listing · Product detail · Cart · Checkout ·
   Order confirmation
   ========================================================================== */

window.CW = window.CW || {};
CW.pages = CW.pages || {};

/* ==========================================================================
   SHOP LANDING
   ========================================================================== */
CW.pages.shop = function () {
  var newArrivals = CW.data.products.filter(function (p) { return (p.badges || []).indexOf('new') !== -1; });
  var bestSellers = CW.data.products.filter(function (p) { return (p.badges || []).indexOf('bestseller') !== -1; });
  var limited = CW.data.products.filter(function (p) { return p.collectionId === 'limited'; });
  var drop = limited[0];
  var esports = CW.data.products.filter(function (p) { return p.collectionId === 'esports'; });
  var lifestyle = CW.data.products.filter(function (p) { return p.collectionId === 'lifestyle'; });
  var essentials = CW.data.products.filter(function (p) { return p.collectionId === 'essential'; });
  var recents = CW.store.recentlyViewed().map(CW.product).filter(Boolean);

  function rail(title, eyebrow, items, href, desc) {
    if (!items.length) return '';
    return '<section class="section container container--wide">' +
      CW.c.sectionHead({
        eyebrow: eyebrow, title: title, desc: desc,
        action: '<a class="btn btn--quiet" href="' + href + '">View all ' + CW.icon('arrowR', 15) + '</a>'
      }) +
      '<div class="product-grid product-grid--4">' + items.slice(0, 4).map(CW.c.productCard).join('') + '</div>' +
    '</section>';
  }

  return '' +
  /* ---------- HERO ---------- */
  '<section class="shop-hero">' +
    '<div class="container container--wide">' +
      '<div class="shop-hero__grid">' +
        '<div>' +
          CW.c.crumbs([{ label: 'Početna', path: '/' }, { label: 'Shop', path: '/shop' }]) +
          '<div class="t-eyebrow mt-3">Official Merchandise</div>' +
          '<h1 class="t-hero mt-2">Nosi<br><span class="t-gold">grb.</span></h1>' +
          '<p class="t-lead mt-3">Duksevi, majice i dresovi sa zvaničnim grbom. Šije se u regionu, po našoj specifikaciji.</p>' +
          '<div class="row row--wrap mt-4" style="gap:12px">' +
            '<a class="btn btn--primary btn--lg" href="#/shop/all">Svi proizvodi</a>' +
            '<a class="btn btn--secondary btn--lg" href="#/shop/all?collection=limited">Limitirana izdanja</a>' +
          '</div>' +
        '</div>' +
        '<div class="brackets" style="border:var(--border);border-radius:var(--radius-card);overflow:hidden">' +
          CW.img('product-mug', { ratio: '4 / 3', ph: 'IZDVOJENA KOLEKCIJA' }) + '</div>' +
      '</div>' +
    '</div>' +
  '</section>' +

  /* ---------- CATEGORIES ---------- */
  '<section class="section--tight container container--wide">' +
    '<div class="category-tiles">' +
      CW.data.categories.map(function (c) {
        var count = CW.data.products.filter(function (p) { return p.categoryId === c.id; }).length;
        return '<a class="category-tile" href="#/shop/' + c.id + '">' +
          '<span class="category-tile__icon">' + CW.icon(c.icon, 24) + '</span>' +
          '<span class="category-tile__name">' + CW.esc(c.name) + '</span>' +
          '<span class="category-tile__count">' + count + ' ' + CW.plural(count, 'artikal', 'artikla', 'artikala') + '</span>' +
        '</a>';
      }).join('') +
    '</div>' +
  '</section>' +

  /* ---------- LIMITED DROP ---------- */
  (drop ?
  '<section class="section--tight container container--wide">' +
    '<div class="drop-banner brackets">' +
      '<div>' +
        '<div class="row row--wrap" style="gap:8px">' +
          '<span class="badge badge--limited">Limited Drop</span>' +
          '<span class="badge badge--low">' + drop.dropInfo.remaining + ' of ' + drop.dropInfo.total + ' left</span>' +
          '<span class="badge badge--neutral">Ends in ' + drop.dropInfo.endsInDays + ' days</span>' +
        '</div>' +
        '<h2 class="t-h1 mt-2">' + CW.esc(drop.name) + '</h2>' +
        '<p class="t-lead mt-2">' + CW.esc(drop.shortDesc) + '</p>' +
        '<div class="row row--wrap mt-3" style="gap:12px;align-items:center">' +
          '<span class="t-price" style="font-size:2rem">' + CW.money(drop.price) + '</span>' +
          '<a class="btn btn--primary btn--lg" href="#/product/' + drop.slug + '">Shop the drop</a>' +
        '</div>' +
      '</div>' +
      '<div class="text-center">' +
        '<div class="drop-banner__num">' + drop.dropInfo.remaining + '</div>' +
        '<div class="t-label mt-2">pieces remaining</div>' +
        '<div class="capacity mt-3">' +
          '<div class="capacity__bar"><div class="capacity__fill" style="width:' +
            Math.round((1 - drop.dropInfo.remaining / drop.dropInfo.total) * 100) + '%"></div></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</section>' : '') +

  rail('New arrivals', '01 — Just landed', newArrivals, '#/shop/all?sort=new') +
  rail('Best sellers', '02 — Proven', bestSellers, '#/shop/all?sort=popular', 'The pieces people buy first, then buy again.') +

  /* ---------- COLLECTIONS ---------- */
  '<section class="section section--surface">' +
    '<div class="container container--wide">' +
      CW.c.sectionHead({ eyebrow: '03 — Collections', title: 'Four lines, four jobs',
        desc: 'Svaka kolekcija ima svoj razlog.' }) +
      '<div class="collection-tiles">' +
        CW.data.collections.filter(function (c) { return c.id !== 'limited'; }).map(function (c) {
          return '<a class="collection-tile" href="#/shop/all?collection=' + c.id + '">' +
            '<div class="scrim"></div>' +
            '<div class="collection-tile__content">' +
              '<div class="t-label" style="color:var(--color-gold)">' + CW.esc(c.tagline) + '</div>' +
              '<h3 class="collection-tile__title mt-1">' + CW.esc(c.name) + '</h3>' +
              '<p class="t-sm mt-2 clamp-3">' + CW.esc(c.blurb) + '</p>' +
              '<span class="link-arrow mt-2">Shop the line ' + CW.icon('arrowR', 15) + '</span>' +
            '</div>' +
          '</a>';
        }).join('') +
      '</div>' +
    '</div>' +
  '</section>' +

  rail('Esports collection', '04 — Roster-ready', esports, '#/shop/all?collection=esports', 'What the players actually compete in — same fabric, same cut, same print.') +

  /* ---------- PROMO ---------- */
  '<section class="section--tight container container--wide">' +
    '<div class="promo">' +
      '<a class="promo__panel" href="#/shop/all?collection=lifestyle">' +
        '<div class="t-eyebrow t-eyebrow--gold">Lifestyle</div>' +
        '<h3 class="t-h2 mt-1">Subtle mark.<br>Heavy fabric.</h3>' +
        '<p class="t-body mt-2" style="max-width:40ch">Ton na ton, fleece 380 g/m². Napravljeno da izdrži i pranje i zimu.</p>' +
        '<span class="link-arrow mt-2">Shop lifestyle ' + CW.icon('arrowR', 15) + '</span>' +
      '</a>' +
      '<a class="promo__panel" href="#/shop/all?collection=essential">' +
        '<div class="t-eyebrow t-eyebrow--gold">Community Essentials</div>' +
        '<h3 class="t-h2 mt-1">Symbol only.<br>Everyday.</h3>' +
        '<p class="t-body mt-2" style="max-width:40ch">Najtiša linija koju pravimo. Za one koji već znaju.</p>' +
        '<span class="link-arrow mt-2">Shop essentials ' + CW.icon('arrowR', 15) + '</span>' +
      '</a>' +
    '</div>' +
  '</section>' +

  rail('Community essentials', '05 — Everyday', essentials, '#/shop/all?collection=essential') +
  rail('Lifestyle collection', '06 — Off duty', lifestyle, '#/shop/all?collection=lifestyle') +

  (recents.length ?
  '<section class="section container container--wide">' +
    CW.c.sectionHead({ eyebrow: 'Pick up where you left off', title: 'Recently viewed' }) +
    '<div class="product-grid product-grid--4">' + recents.slice(0, 4).map(CW.c.productCard).join('') + '</div>' +
  '</section>' : '') +

  /* ---------- TRUST + NEWSLETTER ---------- */
  '<section class="section section--surface">' +
    '<div class="container container--wide">' +
      CW.c.trustStrip() +
      '<div class="mt-5 cta-band">' +
        '<div class="cta-band__inner">' +
          '<div class="cta-band__text">' +
            '<div class="t-eyebrow t-eyebrow--gold">Drop alerts</div>' +
            '<h2 class="t-h2 mt-1">Know before it sells out</h2>' +
            '<p class="t-lead mt-2">Limitirana izdanja se prvo najavljuju na Discordu.</p>' +
          '</div>' +
          '<form class="newsletter" data-act="newsletter" style="min-width:300px" novalidate>' +
            '<label class="visually-hidden" for="shop-nl">Imejl adresa</label>' +
            '<input class="input" id="shop-nl" name="email" type="email" placeholder="ime@primer.com" required>' +
            '<button class="btn btn--primary" type="submit">Notify me</button>' +
          '</form>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</section>';
};

/* ==========================================================================
   CATEGORY / PRODUCT LISTING
   ========================================================================== */
CW.pages.catalog = function (ctx) {
  var catId = ctx.params.category;
  var cat = catId === 'all' ? null : CW.find('categories', catId);
  if (catId !== 'all' && !cat) return CW.pages.notFound();

  var q = ctx.query;
  var sort = q.sort || 'featured';
  var page = parseInt(q.page || '1', 10);
  var perPage = 9;

  var filters = {
    collection: q.collection ? q.collection.split(',') : [],
    size: q.size ? q.size.split(',') : [],
    color: q.color ? q.color.split(',') : [],
    avail: q.avail ? q.avail.split(',') : [],
    max: q.max ? parseInt(q.max, 10) : null,
    q: q.q || ''
  };

  /* ---- filtering ---- */
  var base = CW.data.products.filter(function (p) {
    return catId === 'all' || p.categoryId === catId;
  });

  var list = base.filter(function (p) {
    if (filters.collection.length && filters.collection.indexOf(p.collectionId) === -1) return false;
    if (filters.max !== null && p.price > filters.max * 100) return false;
    if (filters.q && (p.name + ' ' + p.shortDesc).toLowerCase().indexOf(filters.q.toLowerCase()) === -1) return false;

    if (filters.size.length && !p.variants.some(function (v) { return filters.size.indexOf(v.size) !== -1 && v.stock > 0; })) return false;
    if (filters.color.length && !p.variants.some(function (v) { return filters.color.indexOf(v.colorId) !== -1; })) return false;

    var stock = CW.stockOf(p);
    if (filters.avail.indexOf('in') !== -1 && stock === 0) return false;
    if (filters.avail.indexOf('sale') !== -1 && !p.compareAt) return false;
    return true;
  });

  /* ---- sorting ---- */
  var sorters = {
    featured:  function (a, b) { return (b.badges || []).length - (a.badges || []).length; },
    'price-asc':  function (a, b) { return a.price - b.price; },
    'price-desc': function (a, b) { return b.price - a.price; },
    name:      function (a, b) { return a.name.localeCompare(b.name); },
    new:       function (a, b) { return ((b.badges || []).indexOf('new') !== -1) - ((a.badges || []).indexOf('new') !== -1); },
    popular:   function (a, b) { return ((b.badges || []).indexOf('bestseller') !== -1) - ((a.badges || []).indexOf('bestseller') !== -1); }
  };
  list = list.slice().sort(sorters[sort] || sorters.featured);

  var totalPages = Math.ceil(list.length / perPage) || 1;
  var pageItems = list.slice((page - 1) * perPage, page * perPage);

  /* ---- available option sets, derived from the current category ---- */
  var allSizes = [];
  var allColors = [];
  base.forEach(function (p) {
    /* Filter po veličini ima smisla samo za odeću — ostali proizvodi nemaju
       pravu veličinu, samo podrazumevanu varijantu (vidi cw-hydrate.js). */
    if (p.categoryId === 'apparel') {
      p.variants.forEach(function (v) {
        if (allSizes.indexOf(v.size) === -1) allSizes.push(v.size);
      });
    }
    p.variants.forEach(function (v) {
      if (allColors.indexOf(v.colorId) === -1) allColors.push(v.colorId);
    });
  });
  allSizes.sort(function (a, b) {
    var order = CW.shopOptions.apparelSizes.concat(['One Size', 'L', 'XL']);
    return order.indexOf(a) - order.indexOf(b);
  });

  var maxPrice = Math.ceil(Math.max.apply(null, base.map(function (p) { return p.price; })) / 100);

  /* ---- active filter tokens ---- */
  var tokens = [];
  filters.collection.forEach(function (c) {
    var col = CW.find('collections', c);
    tokens.push({ label: col ? col.name : c, key: 'collection', val: c });
  });
  filters.size.forEach(function (s) { tokens.push({ label: 'Size ' + s, key: 'size', val: s }); });
  filters.color.forEach(function (c) {
    tokens.push({ label: (CW.shopOptions.colors[c] || {}).name || c, key: 'color', val: c });
  });
  filters.avail.forEach(function (a) { tokens.push({ label: a === 'in' ? 'In stock' : 'Na sniženju', key: 'avail', val: a }); });
  if (filters.max !== null) tokens.push({ label: 'Under ' + CW.money(filters.max * 100), key: 'max', val: filters.max });
  if (filters.q) tokens.push({ label: '“' + filters.q + '”', key: 'q', val: filters.q });

  var filterPanel = CW.pages._filterPanel(filters, allSizes, allColors, maxPrice, base);

  var skeleton = '<div class="product-grid">' + CW.times(6, CW.c.productSkeleton) + '</div>';

  var results = function () {
    if (!pageItems.length) {
      return CW.c.empty({
        icon: 'search',
        title: 'No products match those filters',
        text: 'Nothing in this category fits every filter you have applied. Try removing one, or browse everything.',
        actions: '<button class="btn btn--secondary" type="button" data-act="clear-filters">Clear all filters</button>' +
                 '<a class="btn btn--quiet" href="#/shop/all">Browse all products</a>'
      });
    }
    return '<div class="product-grid">' + pageItems.map(CW.c.productCard).join('') + '</div>' +
      (totalPages > 1 ? '<div class="mt-5">' + CW.c.pagination(page, totalPages) + '</div>' : '');
  };

  return '' +
  '<div class="shop-page">' +
  '<section class="page-hero">' +
    '<div class="container container--wide page-hero__inner">' +
      CW.c.crumbs([
        { label: 'Početna', path: '/' }, { label: 'Shop', path: '/shop' },
        { label: cat ? cat.name : 'Svi proizvodi', path: '' }
      ]) +
      '<h1 class="t-h1 mt-2">' + CW.esc(cat ? cat.name : 'Svi proizvodi') + '</h1>' +
      '<p class="t-lead mt-2">' + CW.esc(cat ? cat.blurb : 'Sve iz zvaničnog CrazyWolves shopa — odeća, oprema i sitnice.') + '</p>' +
    '</div>' +
  '</section>' +

  '<section class="section container container--wide">' +
    '<div class="catalog">' +

      '<aside class="catalog__filters" aria-label="Product filters">' + filterPanel + '</aside>' +

      '<div>' +
        '<div class="toolbar">' +
          '<button class="btn btn--quiet filter-trigger" type="button" data-act="open-filters">' +
            CW.icon('filter', 16) + 'Filters' + (tokens.length ? ' (' + tokens.length + ')' : '') +
          '</button>' +
          '<span class="toolbar__count">' + list.length + ' product' + (list.length === 1 ? '' : 's') + '</span>' +
          '<span class="spacer"></span>' +
          '<label class="visually-hidden" for="sort">Sortiranje</label>' +
          '<select class="select" id="sort" style="max-width:210px" data-act="sort">' +
            '<option value="featured"' + (sort === 'featured' ? ' selected' : '') + '>Featured</option>' +
            '<option value="new"' + (sort === 'new' ? ' selected' : '') + '>Newest first</option>' +
            '<option value="popular"' + (sort === 'popular' ? ' selected' : '') + '>Best selling</option>' +
            '<option value="price-asc"' + (sort === 'price-asc' ? ' selected' : '') + '>Cena: rastuće</option>' +
            '<option value="price-desc"' + (sort === 'price-desc' ? ' selected' : '') + '>Cena: opadajuće</option>' +
            '<option value="name"' + (sort === 'name' ? ' selected' : '') + '>Name A–Z</option>' +
          '</select>' +
        '</div>' +

        (tokens.length ?
        '<div class="active-filters">' +
          '<span class="t-label" style="margin-right:4px">Active</span>' +
          tokens.map(function (t) {
            return '<span class="token">' + CW.esc(t.label) +
              '<button class="token__x" type="button" data-act="remove-filter" data-key="' + t.key + '" data-val="' + CW.esc(t.val) + '" ' +
              'aria-label="Remove filter ' + CW.esc(t.label) + '">' + CW.icon('x', 12) + '</button></span>';
          }).join('') +
          '<button class="btn btn--ghost btn--sm" type="button" data-act="clear-filters">Clear all</button>' +
        '</div>' : '') +

        '<div class="mt-3" data-loading-key="catalog" aria-busy="' + (CW.loaded.catalog ? 'false' : 'true') + '">' +
          CW.withLoading('catalog', skeleton, results) +
        '</div>' +
      '</div>' +
    '</div>' +
  '</section>' +

  '<section class="section--tight container container--wide">' + CW.c.trustStrip() + '</section>' +
  '</div>';
};

/* Filter panel — reused by the desktop rail and the mobile drawer */
CW.pages._filterPanel = function (filters, sizes, colors, maxPrice, base) {
  function countFor(fn) { return base.filter(fn).length; }

  return '' +
  '<form data-act="filter-form">' +
    '<div class="filter-group" style="padding-top:0">' +
      '<div class="input-wrap">' + CW.icon('search', 18) +
        '<label class="visually-hidden" for="cat-q">Pretraga u kategoriji</label>' +
        '<input class="input" id="cat-q" name="q" type="search" placeholder="Pretraži proizvode…" value="' + CW.esc(filters.q) + '">' +
      '</div>' +
    '</div>' +

    '<div class="filter-group">' +
      '<div class="filter-group__title">Collection</div>' +
      CW.data.collections.map(function (c) {
        var n = countFor(function (p) { return p.collectionId === c.id; });
        if (!n) return '';
        return '<label class="check">' +
          '<input type="checkbox" name="collection" value="' + c.id + '"' + (filters.collection.indexOf(c.id) !== -1 ? ' checked' : '') + '>' +
          '<span class="check__box">' + CW.icon('check', 13) + '</span>' +
          '<span class="check__label">' + CW.esc(c.name) + ' <span class="t-muted">(' + n + ')</span></span>' +
        '</label>';
      }).join('') +
    '</div>' +

    '<div class="filter-group">' +
      '<div class="filter-group__title">Veličina</div>' +
      '<div class="row row--wrap" style="gap:6px">' +
        sizes.map(function (s) {
          return '<label class="variant-btn' + (filters.size.indexOf(s) !== -1 ? ' is-selected' : '') + '" style="cursor:pointer">' +
            '<input type="checkbox" name="size" value="' + CW.esc(s) + '" class="visually-hidden"' + (filters.size.indexOf(s) !== -1 ? ' checked' : '') + '>' +
            CW.esc(s) + '</label>';
        }).join('') +
      '</div>' +
    '</div>' +

    '<div class="filter-group">' +
      '<div class="filter-group__title">Boja</div>' +
      '<div class="row row--wrap" style="gap:10px">' +
        colors.map(function (c) {
          var col = CW.shopOptions.colors[c];
          if (!col) return '';
          var on = filters.color.indexOf(c) !== -1;
          return '<label style="cursor:pointer" title="' + CW.esc(col.name) + '">' +
            '<input type="checkbox" name="color" value="' + c + '" class="visually-hidden"' + (on ? ' checked' : '') + '>' +
            '<span class="variant-color' + (on ? ' is-selected' : '') + '" style="background:' + col.hex + ';display:block;width:32px;height:32px"></span>' +
            '<span class="visually-hidden">' + CW.esc(col.name) + '</span>' +
          '</label>';
        }).join('') +
      '</div>' +
    '</div>' +

    '<div class="filter-group">' +
      '<div class="filter-group__title">Cena</div>' +
      '<div class="range">' +
        '<label class="visually-hidden" for="price-max">Najviša cena</label>' +
        '<input type="range" id="price-max" name="max" min="5" max="' + maxPrice + '" step="5" value="' + (filters.max || maxPrice) + '">' +
        '<div class="row row--between">' +
          '<span class="t-xs">' + CW.shopConfig.currencySymbol + '0</span>' +
          '<span class="t-xs t-gold" data-price-out>Up to ' + CW.shopConfig.currencySymbol + (filters.max || maxPrice) + '</span>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="filter-group">' +
      '<div class="filter-group__title">Availability</div>' +
      '<label class="check">' +
        '<input type="checkbox" name="avail" value="in"' + (filters.avail.indexOf('in') !== -1 ? ' checked' : '') + '>' +
        '<span class="check__box">' + CW.icon('check', 13) + '</span>' +
        '<span class="check__label">Samo dostupno</span></label>' +
      '<label class="check">' +
        '<input type="checkbox" name="avail" value="sale"' + (filters.avail.indexOf('sale') !== -1 ? ' checked' : '') + '>' +
        '<span class="check__box">' + CW.icon('check', 13) + '</span>' +
        '<span class="check__label">Na sniženju</span></label>' +
    '</div>' +

    '<div class="stack stack-1" style="padding-top:var(--space-3)">' +
      '<button class="btn btn--primary btn--full" type="submit">Primeni filtere</button>' +
      '<button class="btn btn--ghost btn--full" type="button" data-act="clear-filters">Clear all</button>' +
    '</div>' +
  '</form>';
};

/* ==========================================================================
   PRODUCT DETAIL
   ========================================================================== */
CW.pages.product = function (ctx) {
  var p = CW.productBySlug(ctx.params.slug);
  if (!p) return CW.pages.notFound();

  CW.store.recordView(p.id);

  var cat = CW.find('categories', p.categoryId) || { name: '' };
  var col = CW.find('collections', p.collectionId);
  var stock = CW.stockOf(p);
  var soldout = stock === 0;
  var low = !soldout && stock <= CW.shopConfig.lowStockThreshold;
  var wished = CW.store.inWishlist(p.id);

  var sizes = [];
  var colors = [];
  p.variants.forEach(function (v) {
    if (sizes.indexOf(v.size) === -1) sizes.push(v.size);
    if (colors.indexOf(v.colorId) === -1) colors.push(v.colorId);
  });
  /* Veličina se bira samo kod odeće. Ostali proizvodi (šolje, dodaci,
     tastature...) dobijaju jednu podrazumevanu varijantu bez biranja —
     ranije se ovo oslanjalo na varijantu doslovno nazvanu "One Size", pa
     je svaki proizvod unet kroz panel (podrazumevana varijanta bez `size`
     polja, vidi cw-hydrate.js) ipak dobijao birač sa jednim praznim dugmetom. */
  var showSizePicker = p.categoryId === 'apparel';

  var related = CW.data.products.filter(function (x) {
    return x.id !== p.id && (x.categoryId === p.categoryId || x.collectionId === p.collectionId);
  }).slice(0, 4);

  var recents = CW.store.recentlyViewed().filter(function (id) { return id !== p.id; }).map(CW.product).filter(Boolean).slice(0, 4);
  var guide = p.sizeGuide ? CW.data.sizeGuides[p.sizeGuide] : null;

  var infoBlock =
    '<div class="stack stack-3">' +
      '<div>' +
        '<div class="row row--wrap" style="gap:8px">' +
          CW.c.badges(p) +
          (soldout ? '<span class="badge badge--soldout">Sold Out</span>' : '') +
          (low ? '<span class="badge badge--low">Only ' + stock + ' left</span>' : '') +
        '</div>' +
        '<div class="t-eyebrow mt-2">' + CW.esc(cat.name) + (col ? ' · ' + CW.esc(col.name) : '') + '</div>' +
        '<h1 class="t-h1 mt-1">' + CW.esc(p.name) + '</h1>' +
      '</div>' +

      '<div class="pdp__price-row">' +
        '<span class="t-price' + (p.compareAt ? ' t-price--sale' : '') + '" style="font-size:2rem">' + CW.money(p.price) + '</span>' +
        (p.compareAt ? '<span class="t-price--was" style="font-size:1.25rem">' + CW.money(p.compareAt) + '</span>' +
          '<span class="badge badge--sale">Save ' + CW.money(p.compareAt - p.price) + '</span>' : '') +
        '<span class="t-xs">Sa PDV-om</span>' +
      '</div>' +

      '<p class="t-body-lg">' + CW.esc(p.shortDesc) + '</p>' +

      (p.dropInfo ?
      '<div class="alert alert--gold">' + CW.icon('flame', 18) +
        '<span><b>' + p.dropInfo.remaining + ' of ' + p.dropInfo.total + ' remaining</b> — this colourway will not be restocked. Drop closes in ' + p.dropInfo.endsInDays + ' days.</span></div>' : '') +

      /* ---- colour ---- */
      (colors.length > 1 ?
      '<div class="variant-group" data-variant-group="color">' +
        '<div class="variant-head">' +
          '<span class="field__label">Boja: <span class="t-offwhite" data-color-label>Izaberi boju</span></span>' +
        '</div>' +
        '<div class="variant-options" role="group" aria-label="Izaberi boju">' +
          colors.map(function (c) {
            var cObj = CW.shopOptions.colors[c];
            var avail = p.variants.some(function (v) { return v.colorId === c && v.stock > 0; });
            return '<button class="variant-color" type="button" data-act="pick-color" data-color="' + c + '" ' +
              'style="background:' + cObj.hex + '" aria-label="' + CW.esc(cObj.name) + '" aria-pressed="false"' +
              (avail ? '' : ' disabled title="Sold out"') + '></button>';
          }).join('') +
        '</div>' +
        '<div class="field__error hidden" data-error="color">' + CW.icon('alert', 14) + ' Please choose a colour</div>' +
      '</div>' : '<div data-variant-group="color" data-single-color="' + colors[0] + '"></div>') +

      /* ---- size ---- */
      (!showSizePicker ? '<div data-variant-group="size" data-single-size="' + CW.esc(sizes[0] || 'Standard') + '"></div>' :
      '<div class="variant-group" data-variant-group="size">' +
        '<div class="variant-head">' +
          '<span class="field__label">Size: <span class="t-offwhite" data-size-label>Izaberi veličinu</span></span>' +
          (guide ? '<button class="link-arrow" type="button" data-act="size-guide" data-guide="' + p.sizeGuide + '">' +
            CW.icon('sliders', 14) + ' Size guide</button>' : '') +
        '</div>' +
        '<div class="variant-options" role="group" aria-label="Izaberi veličinu">' +
          sizes.map(function (s) {
            return '<button class="variant-btn" type="button" data-act="pick-size" data-size="' + CW.esc(s) + '" aria-pressed="false">' + CW.esc(s) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="field__error hidden" data-error="size">' + CW.icon('alert', 14) + ' Please choose a size</div>' +
      '</div>') +

      /* ---- stock line ---- */
      '<div data-stock-line>' +
        (soldout
          ? '<div class="status status--offline"><span class="status__dot"></span>Out of stock</div>'
          : '<div class="status status--live"><span class="status__dot"></span>In stock</div>') +
      '</div>' +

      /* ---- qty + actions ---- */
      '<div class="row" style="gap:12px;align-items:flex-end">' +
        '<div class="field" style="flex:none">' +
          '<span class="field__label">Količina</span>' +
          '<div class="qty">' +
            '<button class="qty__btn" type="button" data-act="pdp-qty-dec" aria-label="Smanji količinu">' + CW.icon('minus', 15) + '</button>' +
            '<input class="qty__val" type="text" value="1" readonly data-pdp-qty aria-label="Količina">' +
            '<button class="qty__btn" type="button" data-act="pdp-qty-inc" aria-label="Povećaj količinu">' + CW.icon('plus', 15) + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="pdp__actions pdp__actions--inline" style="flex:1">' +
          '<button class="btn btn--primary btn--lg" type="button" data-act="add-to-cart" data-pid="' + p.id + '"' + (soldout ? ' disabled' : '') + '>' +
            (soldout ? 'Sold out' : CW.icon('cart', 17) + 'Dodaj u korpu') + '</button>' +
          '<button class="btn btn--secondary btn--lg' + (wished ? ' is-active' : '') + '" type="button" style="flex:none;width:52px;padding:0" ' +
            'data-act="toggle-wishlist" data-pid="' + p.id + '" aria-label="' + (wished ? 'Ukloni iz liste želja' : 'Dodaj u listu želja') + '" aria-pressed="' + wished + '">' +
            CW.icon('heart', 18) + '</button>' +
        '</div>' +
      '</div>' +

      (soldout ? '<div class="alert alert--warning">' + CW.icon('bell', 18) +
        '<span>This piece is sold out. Add it to your wishlist and we will email you if it returns.</span></div>' : '') +

      /* ---- delivery + returns ---- */
      '<div class="spec-list">' +
        '<div class="spec-list__row"><span class="spec-list__k">Dostava</span>' +
          '<span class="spec-list__v">3–5 radnih dana · besplatno preko ' + CW.money(CW.shopConfig.freeShippingThreshold) + '</span></div>' +
        '<div class="spec-list__row"><span class="spec-list__k">Povraćaj</span>' +
          '<span class="spec-list__v">14 dana, nenošeno sa etiketom</span></div>' +
        '<div class="spec-list__row"><span class="spec-list__k">Proizvođač</span>' +
          '<span class="spec-list__v">Terrain Apparel, in-region</span></div>' +
      '</div>' +

      /* ---- accordions ---- */
      '<div class="accordion">' +
        [
          { q: 'Detalji proizvoda', a: p.description },
          { q: 'Materials', a: p.materials },
          { q: 'Care instructions', a: p.care },
          { q: 'Dostava i povraćaj', a: 'Standardna dostava 3–5 radnih dana (' + CW.money(CW.shopConfig.defaultShipping) + '), ekspresna 1–2 radna dana. Besplatno preko ' + CW.money(CW.shopConfig.freeShippingThreshold) + '. Returns accepted within 14 days on unworn items with original tags, limited drops included.' }
        ].map(function (item, i) {
          return '<div class="accordion__item' + (i === 0 ? ' is-open' : '') + '">' +
            '<button class="accordion__trigger" type="button" data-act="accordion" aria-expanded="' + (i === 0) + '">' +
              '<span>' + CW.esc(item.q) + '</span>' +
              '<span class="accordion__icon">' + CW.icon('plus', 18) + '</span></button>' +
            '<div class="accordion__panel"><div class="accordion__inner">' +
              '<div class="accordion__body">' + item.a.split('\n\n').map(function (para) {
                return '<p style="margin-bottom:10px">' + CW.esc(para) + '</p>';
              }).join('') + '</div>' +
            '</div></div></div>';
        }).join('') +
      '</div>';

  return '' +
  '<div class="shop-page pdp-page">' +
    '<section class="section--tight container container--wide">' +
      CW.c.crumbs([
        { label: 'Početna', path: '/' }, { label: 'Shop', path: '/shop' },
        { label: cat.name, path: '/shop/' + p.categoryId }, { label: p.name, path: '' }
      ]) +
    '</section>' +

    '<section class="container container--wide" data-pdp="' + p.id + '">' +
      '<div class="pdp">' +

        /* ---------- GALLERY ---------- */
        '<div class="gallery">' +
          '<div class="gallery__thumbs" role="group" aria-label="Slike proizvoda">' +
            p.images.map(function (img, i) {
              return '<button class="gallery__thumb' + (i === 0 ? ' is-active' : '') + '" type="button" ' +
                'data-act="pick-image" data-index="' + i + '" aria-label="Slika ' + (i + 1) + ': ' + CW.esc(img) + '"></button>';
            }).join('') +
          '</div>' +
          '<div class="gallery__main">' +
            '<div class="card__badges">' + CW.c.badges(p) + '</div>' +
            /* Kada proizvod ima pravu sliku, prikazujemo nju; placeholder
               ostaje samo za artikle koji još nisu fotografisani. */
            (p.image
              ? CW.img(p.image, { eager: true, cls: 'pdp__photo', ph: p.name })
              : '<div class="ph ph--1x1 ph--product" style="border:0;width:100%" data-ph="' + CW.esc(p.images[0]) + '" data-gallery-main></div>') +
          '</div>' +
        '</div>' +

        /* ---------- INFO ---------- */
        '<div class="pdp__info">' + infoBlock + '</div>' +
      '</div>' +
    '</section>' +

    /* ---------- COLLECTION STORY ---------- */
    (p.story ?
    '<section class="section container container--wide">' +
      '<div class="story-panel brackets">' +
        '<div class="grid grid--2" style="gap:var(--space-5);align-items:center">' +
          '<div>' +
            '<div class="t-eyebrow t-eyebrow--gold">' + CW.esc(col ? col.name : 'Priča') + '</div>' +
            '<h2 class="t-h2 mt-2">' + CW.esc(col ? col.tagline : 'Zašto ovo postoji') + '</h2>' +
            '<p class="t-lead mt-3">' + CW.esc(p.story) + '</p>' +
            (col ? '<a class="link-arrow mt-3" href="#/shop/all?collection=' + col.id + '">Cela kolekcija ' + CW.icon('arrowR', 15) + '</a>' : '') +
          '</div>' +
          (p.image
            ? '<div style="border:var(--border);border-radius:var(--radius-card);overflow:hidden">' +
                CW.img(p.image, { ratio: '4 / 3', ph: p.name }) + '</div>'
            : '<div class="ph ph--4x3" data-ph="ATMOSFERA"></div>') +
        '</div>' +
      '</div>' +
    '</section>' : '') +

    '<section class="section--tight container container--wide">' + CW.c.trustStrip() + '</section>' +

    (related.length ?
    '<section class="section container container--wide">' +
      CW.c.sectionHead({ eyebrow: 'Goes with this', title: 'Related products' }) +
      '<div class="product-grid product-grid--4">' + related.map(CW.c.productCard).join('') + '</div>' +
    '</section>' : '') +

    (recents.length ?
    '<section class="section section--surface">' +
      '<div class="container container--wide">' +
        CW.c.sectionHead({ eyebrow: 'You looked at', title: 'Recently viewed' }) +
        '<div class="product-grid product-grid--4">' + recents.map(CW.c.productCard).join('') + '</div>' +
      '</div>' +
    '</section>' : '') +

    /* ---------- STICKY MOBILE ADD TO CART ---------- */
    '<div class="sticky-atc">' +
      '<div class="sticky-atc__price">' +
        '<div class="t-price">' + CW.money(p.price) + '</div>' +
        '<div class="t-xs" data-sticky-variant>Izaberi opciju</div>' +
      '</div>' +
      '<button class="btn btn--primary btn--lg" style="flex:1" type="button" data-act="add-to-cart" data-pid="' + p.id + '"' + (soldout ? ' disabled' : '') + '>' +
        (soldout ? 'Sold out' : 'Dodaj u korpu') + '</button>' +
    '</div>' +
  '</div>';
};

/* ---------- SIZE GUIDE MODAL ---------- */
CW.c.sizeGuideModal = function (key) {
  var g = CW.data.sizeGuides[key];
  if (!g) return '';
  return '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="sg-title">' +
    '<div class="modal__head">' +
      '<h2 class="modal__title" id="sg-title">Size Guide</h2>' +
      '<button class="btn-icon" type="button" data-act="close-overlays" aria-label="Close size guide">' + CW.icon('x', 22) + '</button>' +
    '</div>' +
    '<div class="modal__body">' +
      '<p class="t-sm mb-3">' + CW.esc(g.label) + '</p>' +
      '<div class="table__wrap"><table class="table">' +
        '<thead><tr>' + g.cols.map(function (c) { return '<th>' + CW.esc(c) + '</th>'; }).join('') + '</tr></thead>' +
        '<tbody>' + g.rows.map(function (r) {
          return '<tr>' + r.map(function (cell, i) {
            return '<td' + (i === 0 ? ' class="t-offwhite"' : '') + '>' + CW.esc(cell) + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody>' +
      '</table></div>' +
      '<div class="alert alert--info mt-3">' + CW.icon('info', 18) + '<span>' + CW.esc(g.note) + '</span></div>' +
    '</div>' +
    '<div class="modal__foot">' +
      '<button class="btn btn--primary" type="button" data-act="close-overlays">Got it</button>' +
    '</div>' +
  '</div>';
};

/* ==========================================================================
   CART PAGE
   ========================================================================== */
CW.pages.cart = function (ctx) {
  var cart = CW.store.cart();
  var shipId = (ctx && ctx.query.ship) || 'standard';
  var t = CW.store.totals(shipId);
  var coupon = CW.store.coupon();
  var recs = CW.data.products.filter(function (p) {
    return !cart.some(function (l) { return l.productId === p.id; });
  }).slice(0, 4);

  if (!cart.length) {
    return '<div class="shop-page">' +
      '<section class="section--tight container container--wide">' +
        CW.c.crumbs([{ label: 'Početna', path: '/' }, { label: 'Shop', path: '/shop' }, { label: 'Korpa', path: '' }]) +
      '</section>' +
      '<section class="section container container--wide">' +
        '<h1 class="t-h1 mb-4">Tvoja korpa</h1>' +
        CW.c.empty({
          icon: 'cart',
          title: 'Korpa je prazna',
          text: 'Korpa je još prazna. Počni od onoga što je na stanju.',
          actions: '<a class="btn btn--primary btn--lg" href="#/shop">Otvori shop</a>' +
                   '<a class="btn btn--quiet btn--lg" href="#/account/wishlist">Lista želja</a>'
        }) +
      '</section>' +
      '<section class="section container container--wide">' +
        CW.c.sectionHead({ eyebrow: 'Start here', title: 'Best sellers' }) +
        '<div class="product-grid product-grid--4">' + recs.map(CW.c.productCard).join('') + '</div>' +
      '</section></div>';
  }

  return '' +
  '<div class="shop-page">' +
  '<section class="section--tight container container--wide">' +
    CW.c.crumbs([{ label: 'Početna', path: '/' }, { label: 'Shop', path: '/shop' }, { label: 'Korpa', path: '' }]) +
  '</section>' +

  '<section class="section container container--wide">' +
    '<h1 class="t-h1 mb-4">Tvoja korpa <span class="t-muted" style="font-family:var(--font-condensed);font-size:1.5rem">(' + CW.store.cartCount() + ' items)</span></h1>' +

    '<div class="cart-layout">' +
      '<div>' +
        '<div class="card"><div style="padding:0 var(--space-3)">' +
          cart.map(function (l) { return CW.c.lineItem(l, false); }).join('') +
        '</div></div>' +

        '<div class="row row--between mt-3 row--wrap" style="gap:12px">' +
          '<a class="btn btn--quiet" href="#/shop">' + CW.icon('arrowL', 15) + 'Continue shopping</a>' +
          '<span class="t-sm">Prices include VAT. Shipping calculated at checkout.</span>' +
        '</div>' +
      '</div>' +

      '<aside class="summary-card">' +
        '<h2 class="t-h3 mb-3">Tvoja porudžbina</h2>' +

        '<form class="coupon-row mb-3" data-act="coupon-form" novalidate>' +
          '<label class="visually-hidden" for="coupon">Kod za popust</label>' +
          '<input class="input" id="coupon" name="code" type="text" placeholder="Kod za popust" ' +
            'value="' + (coupon ? CW.esc(coupon.code) : '') + '"' + (coupon ? ' readonly' : '') + '>' +
          (coupon
            ? '<button class="btn btn--quiet" type="button" data-act="remove-coupon">Ukloni</button>'
            : '<button class="btn btn--secondary" type="submit">Primeni</button>') +
        '</form>' +

        (coupon ? '<div class="alert alert--success mb-3">' + CW.icon('check', 16) +
          '<span><b>' + CW.esc(coupon.code) + '</b> applied — ' + CW.esc(coupon.label) + '</span></div>' : '') +

        '<div class="field mb-3">' +
          '<label class="field__label" for="ship-est">Shipping estimate</label>' +
          '<select class="select" id="ship-est" data-act="shipping-estimate">' +
            CW.data.shippingMethods.map(function (m) {
              return '<option value="' + m.id + '"' + (shipId === m.id ? ' selected' : '') + '>' +
                CW.esc(m.name) + ' — ' + (m.price === 0 ? 'Free' : CW.money(m.price)) + '</option>';
            }).join('') +
          '</select>' +
          '<div class="field__hint">Final cost is confirmed at checkout once we have your address.</div>' +
        '</div>' +

        '<div class="spec-list">' +
          '<div class="spec-list__row"><span class="spec-list__k">Cena</span><span class="spec-list__v">' + CW.money(t.subtotal) + '</span></div>' +
          (t.discount ? '<div class="spec-list__row"><span class="spec-list__k">Popust</span><span class="spec-list__v t-gold">−' + CW.money(t.discount) + '</span></div>' : '') +
          '<div class="spec-list__row"><span class="spec-list__k">Dostava</span><span class="spec-list__v">' + (t.shipping === 0 ? 'Free' : CW.money(t.shipping)) + '</span></div>' +
          '<div class="spec-list__row spec-list__row--total"><span class="spec-list__k">Ukupno</span><span class="spec-list__v">' + CW.money(t.total) + '</span></div>' +
        '</div>' +

        (t.freeShippingGap > 0
          ? '<div class="alert alert--info mt-3">' + CW.icon('truck', 16) +
            '<span>Add ' + CW.money(t.freeShippingGap) + ' more for free shipping.</span></div>'
          : '<div class="alert alert--success mt-3">' + CW.icon('check', 16) + '<span>Free shipping unlocked.</span></div>') +

        '<a class="btn btn--primary btn--full btn--lg mt-3" href="#/checkout">Proceed to checkout</a>' +

        '<div class="row mt-3" style="gap:8px;justify-content:center">' +
          CW.icon('lock', 15) + '<span class="t-xs">Secure checkout — card details handled by our payment processor</span>' +
        '</div>' +
      '</aside>' +
    '</div>' +
  '</section>' +

  '<section class="section container container--wide">' +
    CW.c.sectionHead({ eyebrow: 'Complete the kit', title: 'Recommended for you' }) +
    '<div class="product-grid product-grid--4">' + recs.map(CW.c.productCard).join('') + '</div>' +
  '</section>' +
  '</div>';
};

/* ==========================================================================
   CHECKOUT
   ========================================================================== */
CW.pages.checkout = function (ctx) {
  var cart = CW.store.cart();
  if (!cart.length) {
    return '<section class="section container container--wide">' +
      CW.c.empty({
        icon: 'cart', title: 'Nema šta da se plati',
        text: 'Korpa je prazna. Dodaj nešto pre plaćanja.',
        actions: '<a class="btn btn--primary" href="#/shop">Otvori shop</a>'
      }) + '</section>';
  }

  var shipId = ctx.query.ship || 'standard';
  var t = CW.store.totals(shipId);
  var coupon = CW.store.coupon();
  var user = CW.store.user();
  /* Sačuvane adrese još nisu povezane na pravi nalog (BAZA.md) — kasa kreće
     prazna za svakog, prijavljenog ili ne, umesto da prikaže izmišljenu
     adresu koja ne pripada kupcu. */
  var addr = null;

  return '' +
  '<div class="shop-page">' +
  /* Distraction-free header — the only place the global nav is replaced */
  '<div class="checkout-header">' +
    '<div class="container container--wide checkout-header__inner">' +
      '<a class="logo" href="#/">' + CW.logoMark(34) + '<span class="logo__word">CRAZY<em>WOLVES</em></span></a>' +
      '<div class="stepper" aria-label="Checkout progress">' +
        '<div class="stepper__step is-done"><span class="stepper__num">' + CW.icon('check', 14) + '</span><span class="stepper__label">Cart</span></div>' +
        '<span class="stepper__bar"></span>' +
        '<div class="stepper__step is-active"><span class="stepper__num">2</span><span class="stepper__label">Details</span></div>' +
        '<span class="stepper__bar"></span>' +
        '<div class="stepper__step"><span class="stepper__num">3</span><span class="stepper__label">Confirm</span></div>' +
      '</div>' +
      '<a class="btn btn--ghost btn--sm" href="#/korpa">' + CW.icon('arrowL', 15) + 'Nazad u korpu</a>' +
    '</div>' +
  '</div>' +

  '<section class="section container container--wide">' +
    '<div class="checkout-layout">' +

      '<form class="stack stack-5" data-act="checkout-form" novalidate>' +

        /* ---------- CONTACT ---------- */
        '<fieldset class="fieldset">' +
          '<legend class="fieldset__legend">1 — Podaci za kontakt</legend>' +
          (user ? '' :
            '<div class="alert alert--info">' + CW.icon('user', 18) +
            '<span>Već imaš nalog? <a class="link-underline" href="#/account/login">Prijavi se</a> to fill this in automatically.</span></div>') +
          '<div class="field">' +
            '<label class="field__label" for="co-email">Imejl adresa <span class="field__req">*</span></label>' +
            '<input class="input" id="co-email" name="email" type="email" autocomplete="email" required value="' + (user ? CW.esc(user.email) : '') + '">' +
            '<div class="field__hint">Ovde stižu potvrda porudžbine i broj za praćenje.</div>' +
            '<div class="field__error hidden" data-error-for="co-email"></div>' +
          '</div>' +
          '<div class="field">' +
            '<label class="field__label" for="co-phone">Telefon <span class="t-muted">(za kurira)</span></label>' +
            '<input class="input" id="co-phone" name="phone" type="tel" autocomplete="tel" value="' + (addr ? CW.esc(addr.phone) : '') + '">' +
          '</div>' +
        '</fieldset>' +

        /* ---------- SHIPPING ADDRESS ---------- */
        '<fieldset class="fieldset">' +
          '<legend class="fieldset__legend">2 — Adresa za dostavu</legend>' +
          '<div class="field-row">' +
            '<div class="field">' +
              '<label class="field__label" for="co-first">First name <span class="field__req">*</span></label>' +
              '<input class="input" id="co-first" name="firstName" type="text" autocomplete="given-name" required value="' + (user ? CW.esc(user.firstName) : '') + '">' +
              '<div class="field__error hidden" data-error-for="co-first"></div>' +
            '</div>' +
            '<div class="field">' +
              '<label class="field__label" for="co-last">Last name <span class="field__req">*</span></label>' +
              '<input class="input" id="co-last" name="lastName" type="text" autocomplete="family-name" required value="' + (user ? CW.esc(user.lastName) : '') + '">' +
              '<div class="field__error hidden" data-error-for="co-last"></div>' +
            '</div>' +
          '</div>' +
          '<div class="field">' +
            '<label class="field__label" for="co-addr">Address <span class="field__req">*</span></label>' +
            '<input class="input" id="co-addr" name="line1" type="text" autocomplete="address-line1" required value="' + (addr ? CW.esc(addr.line1) : '') + '">' +
            '<div class="field__error hidden" data-error-for="co-addr"></div>' +
          '</div>' +
          '<div class="field">' +
            '<label class="field__label" for="co-addr2">Apartment, floor, etc. <span class="t-muted">(optional)</span></label>' +
            '<input class="input" id="co-addr2" name="line2" type="text" autocomplete="address-line2" value="' + (addr ? CW.esc(addr.line2) : '') + '">' +
          '</div>' +
          '<div class="field-row--3 field-row">' +
            '<div class="field">' +
              '<label class="field__label" for="co-city">City <span class="field__req">*</span></label>' +
              '<input class="input" id="co-city" name="city" type="text" autocomplete="address-level2" required value="' + (addr ? CW.esc(addr.city) : '') + '">' +
              '<div class="field__error hidden" data-error-for="co-city"></div>' +
            '</div>' +
            '<div class="field">' +
              '<label class="field__label" for="co-post">Postcode <span class="field__req">*</span></label>' +
              '<input class="input" id="co-post" name="postcode" type="text" autocomplete="postal-code" required value="' + (addr ? CW.esc(addr.postcode) : '') + '">' +
              '<div class="field__error hidden" data-error-for="co-post"></div>' +
            '</div>' +
            '<div class="field">' +
              '<label class="field__label" for="co-country">Country <span class="field__req">*</span></label>' +
              '<select class="select" id="co-country" name="country" autocomplete="country-name" required>' +
                ['Serbia', 'Croatia', 'Bosnia & Herzegovina', 'Montenegro', 'North Macedonia', 'Slovenia', 'Other (EU)'].map(function (c) {
                  return '<option' + (addr && addr.country === c ? ' selected' : '') + '>' + c + '</option>';
                }).join('') +
              '</select>' +
            '</div>' +
          '</div>' +
        '</fieldset>' +

        /* ---------- DELIVERY ---------- */
        '<fieldset class="fieldset">' +
          '<legend class="fieldset__legend">3 — Delivery method</legend>' +
          '<div class="stack stack-1">' +
            CW.data.shippingMethods.map(function (m) {
              var free = t.subtotal - t.discount >= CW.shopConfig.freeShippingThreshold && m.id !== 'pickup';
              return '<label class="radio-card' + (shipId === m.id ? ' is-selected' : '') + '">' +
                '<input type="radio" name="shipping" value="' + m.id + '"' + (shipId === m.id ? ' checked' : '') + ' data-act="pick-shipping">' +
                '<span class="radio-card__mark"></span>' +
                '<span class="radio-card__body">' +
                  '<span class="radio-card__title">' + CW.esc(m.name) + '</span>' +
                  '<span class="radio-card__desc">' + CW.esc(m.eta) + ' — ' + CW.esc(m.desc) + '</span>' +
                '</span>' +
                '<span class="radio-card__price">' + (m.price === 0 || free ? 'Free' : CW.money(m.price)) + '</span>' +
              '</label>';
            }).join('') +
          '</div>' +
        '</fieldset>' +

        /* ---------- PAYMENT ---------- */
        '<fieldset class="fieldset">' +
          '<legend class="fieldset__legend">4 — Payment</legend>' +
          '<div class="alert alert--info">' + CW.icon('lock', 18) +
            '<span>This is a front-end demonstration. No payment is processed and no card details are stored or transmitted.</span></div>' +

          '<div class="stack stack-1">' +
            CW.data.paymentMethods.map(function (m, i) {
              /* Kartica je najavljena ali još ne radi — onemogućena, ne samo
                 opisana kao "u pripremi". Disabled input i ne prima klik, pa
                 se ne može ni izabrati ni slučajno poslati porudžbina na nju. */
              var off = m.id === 'kartica';
              return '<label class="radio-card' + (i === 0 ? ' is-selected' : '') + (off ? ' is-disabled' : '') + '">' +
                '<input type="radio" name="payment" value="' + m.id + '"' + (i === 0 ? ' checked' : '') +
                  (off ? ' disabled aria-disabled="true"' : '') + ' data-act="pick-payment">' +
                '<span class="radio-card__mark"></span>' +
                '<span class="radio-card__body">' +
                  '<span class="radio-card__title">' + CW.esc(m.name) + '</span>' +
                  '<span class="radio-card__desc">' + CW.esc(m.desc) + '</span>' +
                '</span>' +
                (m.id === 'kartica' ? '<span class="row" style="gap:4px">' + CW.icon('card', 20) + '</span>' : '') +
              '</label>';
            }).join('') +
          '</div>' +

          '<div class="card" data-card-fields>' +
            '<div class="card__body">' +
              '<div class="field">' +
                '<label class="field__label" for="cc-num">Card number <span class="field__req">*</span></label>' +
                '<input class="input" id="cc-num" name="cardNumber" type="text" inputmode="numeric" placeholder="4242 4242 4242 4242" autocomplete="cc-number">' +
                '<div class="field__error hidden" data-error-for="cc-num"></div>' +
              '</div>' +
              '<div class="field-row mt-2">' +
                '<div class="field">' +
                  '<label class="field__label" for="cc-exp">Expiry <span class="field__req">*</span></label>' +
                  '<input class="input" id="cc-exp" name="cardExpiry" type="text" placeholder="MM / YY" autocomplete="cc-exp">' +
                '</div>' +
                '<div class="field">' +
                  '<label class="field__label" for="cc-cvc">Security code <span class="field__req">*</span></label>' +
                  '<input class="input" id="cc-cvc" name="cardCvc" type="text" inputmode="numeric" placeholder="123" autocomplete="cc-csc">' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<label class="check">' +
            '<input type="checkbox" name="sameBilling" checked data-act="toggle-billing">' +
            '<span class="check__box">' + CW.icon('check', 13) + '</span>' +
            '<span class="check__label">Billing address is the same as my shipping address</span>' +
          '</label>' +

          '<div class="hidden" data-billing-fields>' +
            '<div class="field">' +
              '<label class="field__label" for="bill-addr">Billing address</label>' +
              '<input class="input" id="bill-addr" name="billingLine1" type="text">' +
            '</div>' +
            '<div class="field-row mt-2">' +
              '<div class="field"><label class="field__label" for="bill-city">City</label>' +
                '<input class="input" id="bill-city" name="billingCity" type="text"></div>' +
              '<div class="field"><label class="field__label" for="bill-post">Postcode</label>' +
                '<input class="input" id="bill-post" name="billingPostcode" type="text"></div>' +
            '</div>' +
          '</div>' +
        '</fieldset>' +

        /* ---------- NOTES + TERMS ---------- */
        '<fieldset class="fieldset">' +
          '<legend class="fieldset__legend">5 — Finish</legend>' +
          '<div class="field">' +
            '<label class="field__label" for="co-notes">Order notes <span class="t-muted">(optional)</span></label>' +
            '<textarea class="textarea" id="co-notes" name="notes" style="min-height:88px" placeholder="Delivery instructions, a buzzer code, anything the courier should know."></textarea>' +
          '</div>' +

          '<label class="check">' +
            '<input type="checkbox" name="terms" required>' +
            '<span class="check__box">' + CW.icon('check', 13) + '</span>' +
            '<span class="check__label">I have read and accept the <a class="link-underline" href="#/terms">Terms &amp; Conditions</a>, the <a class="link-underline" href="#/returns">Returns Policy</a> and the <a class="link-underline" href="#/privacy">Privacy Policy</a>. <span class="field__req">*</span></span>' +
          '</label>' +
          '<div class="field__error hidden" data-error-for="terms"></div>' +

          '<label class="check">' +
            '<input type="checkbox" name="marketing">' +
            '<span class="check__box">' + CW.icon('check', 13) + '</span>' +
            '<span class="check__label">Email me about drops and results. One email a week, unsubscribe any time.</span>' +
          '</label>' +

          '<button class="btn btn--primary btn--lg btn--full mt-2" type="submit" data-place-order>' +
            CW.icon('lock', 17) + 'Poruči — ' + CW.money(t.total) +
          '</button>' +

          '<div data-form-status role="status" aria-live="polite"></div>' +
        '</fieldset>' +
      '</form>' +

      /* ---------- ORDER SUMMARY ---------- */
      '<aside class="summary-card">' +
        '<h2 class="t-h3 mb-3">Tvoja porudžbina</h2>' +

        '<div class="stack stack-2 mb-3">' +
          cart.map(function (l) {
            var p = CW.product(l.productId);
            return '<div class="row row--top" style="gap:12px">' +
              '<div class="line-item__media" style="width:56px;position:relative">' +
                (p.image ? CW.img(p.image, { ratio: '1 / 1', ph: p.name }) : '') +
                '<span class="btn-icon__count" style="top:-6px;right:-6px">' + l.qty + '</span></div>' +
              '<div style="flex:1;min-width:0">' +
                '<div class="t-sm t-offwhite" style="font-weight:600">' + CW.esc(p.name) + '</div>' +
                '<div class="line-item__variant">' + CW.esc(CW.variantLabel(p, l.variantId)) + '</div>' +
              '</div>' +
              '<div class="t-sm t-offwhite tnum">' + CW.money(p.price * l.qty) + '</div>' +
            '</div>';
          }).join('') +
        '</div>' +

        '<form class="coupon-row mb-3" data-act="coupon-form" novalidate>' +
          '<label class="visually-hidden" for="co-coupon">Kod za popust</label>' +
          '<input class="input" id="co-coupon" name="code" type="text" placeholder="Kod za popust" ' +
            'value="' + (coupon ? CW.esc(coupon.code) : '') + '"' + (coupon ? ' readonly' : '') + '>' +
          (coupon
            ? '<button class="btn btn--quiet" type="button" data-act="remove-coupon">Ukloni</button>'
            : '<button class="btn btn--secondary" type="submit">Primeni</button>') +
        '</form>' +

        '<div class="spec-list">' +
          '<div class="spec-list__row"><span class="spec-list__k">Cena</span><span class="spec-list__v">' + CW.money(t.subtotal) + '</span></div>' +
          (t.discount ? '<div class="spec-list__row"><span class="spec-list__k">Discount' + (coupon ? ' (' + CW.esc(coupon.code) + ')' : '') + '</span>' +
            '<span class="spec-list__v t-gold">−' + CW.money(t.discount) + '</span></div>' : '') +
          '<div class="spec-list__row"><span class="spec-list__k">Dostava</span><span class="spec-list__v">' + (t.shipping === 0 ? 'Free' : CW.money(t.shipping)) + '</span></div>' +
          '<div class="spec-list__row spec-list__row--total"><span class="spec-list__k">Ukupno</span><span class="spec-list__v">' + CW.money(t.total) + '</span></div>' +
        '</div>' +

        '<div class="t-xs mt-2">Cene su sa PDV-om.</div>' +

        '<div class="stack stack-1 mt-3">' +
          '<div class="row" style="gap:8px">' + CW.icon('lock', 15) + '<span class="t-xs">Secure checkout</span></div>' +
          '<div class="row" style="gap:8px">' + CW.icon('refresh', 15) + '<span class="t-xs">14-day returns, limited drops included</span></div>' +
          '<div class="row" style="gap:8px">' + CW.icon('truck', 15) + '<span class="t-xs">Tracked delivery on every order</span></div>' +
        '</div>' +
      '</aside>' +
    '</div>' +
  '</section>' +
  '</div>';
};

/* ==========================================================================
   ORDER CONFIRMATION
   ========================================================================== */
CW.pages.confirmation = function () {
  var order = CW.store.lastOrder();
  if (!order) {
    return '<section class="section container container--wide">' +
      CW.c.empty({
        icon: 'package', title: 'No recent order',
        text: 'There is no order to show. If you have just ordered, check your email for the confirmation.',
        actions: '<a class="btn btn--primary" href="#/shop">Nazad u shop</a>'
      }) + '</section>';
  }

  var d = order.details || {};
  var eta = new Date(Date.now() + 4 * 86400000);

  return '' +
  '<div class="shop-page">' +
  '<section class="container container--wide">' +
    '<div class="confirm-hero">' +
      '<div class="confirm-seal">' + CW.icon('check', 42) + '</div>' +
      '<div class="t-eyebrow t-eyebrow--gold">Order confirmed</div>' +
      '<h1 class="t-h1 mt-2">Dobro došao u čopor.</h1>' +
      '<p class="t-lead mx-auto mt-3" style="max-width:52ch">Your order is in. A confirmation is on its way to ' +
        '<strong class="t-offwhite">' + CW.esc(d.email || 'your email address') + '</strong>, and tracking follows the moment it ships.</p>' +
      '<div class="row mt-4" style="justify-content:center;gap:10px;flex-wrap:wrap">' +
        '<span class="badge badge--gold">Order ' + CW.esc(order.id) + '</span>' +
        '<span class="badge badge--neutral">' + CW.money(order.totals.total) + '</span>' +
        '<span class="badge badge--neutral">Est. delivery ' + CW.fmtDate(eta.toISOString(), 'short') + '</span>' +
      '</div>' +
    '</div>' +
  '</section>' +

  '<section class="section--tight container container--wide">' +
    '<div class="cart-layout">' +
      '<div class="card"><div class="card__body" style="padding:var(--space-4)">' +
        '<h2 class="t-h3 mb-3">What you ordered</h2>' +
        '<div style="border-top:var(--border)">' +
          order.items.map(function (l) {
            var p = CW.product(l.productId);
            return '<div class="line-item">' +
              '<div class="line-item__media">' + (p.image ? CW.img(p.image, { ratio: '1 / 1', ph: p.name }) : '') + '</div>' +
              '<div class="stack stack-1">' +
                '<a class="line-item__title" href="#/product/' + p.slug + '">' + CW.esc(p.name) + '</a>' +
                '<div class="line-item__variant">' + [CW.variantLabel(p, l.variantId), 'Količina ' + l.qty].filter(Boolean).map(CW.esc).join(' · ') + '</div>' +
              '</div>' +
              '<div class="line-item__right"><div class="t-price" style="font-size:1.125rem">' + CW.money(p.price * l.qty) + '</div></div>' +
            '</div>';
          }).join('') +
        '</div>' +

        '<div class="spec-list mt-3">' +
          '<div class="spec-list__row"><span class="spec-list__k">Cena</span><span class="spec-list__v">' + CW.money(order.totals.subtotal) + '</span></div>' +
          (order.totals.discount ? '<div class="spec-list__row"><span class="spec-list__k">Popust</span>' +
            '<span class="spec-list__v t-gold">−' + CW.money(order.totals.discount) + '</span></div>' : '') +
          '<div class="spec-list__row"><span class="spec-list__k">Dostava</span><span class="spec-list__v">' + (order.totals.shipping === 0 ? 'Free' : CW.money(order.totals.shipping)) + '</span></div>' +
          '<div class="spec-list__row spec-list__row--total"><span class="spec-list__k">Total paid</span><span class="spec-list__v">' + CW.money(order.totals.total) + '</span></div>' +
        '</div>' +
      '</div></div>' +

      '<aside class="stack stack-3">' +
        '<div class="card"><div class="card__body">' +
          '<div class="t-eyebrow t-eyebrow--gold">Dostava</div>' +
          '<div class="spec-list mt-2">' +
            '<div class="spec-list__row"><span class="spec-list__k">Name</span><span class="spec-list__v">' + CW.esc((d.firstName || '') + ' ' + (d.lastName || '')) + '</span></div>' +
            '<div class="spec-list__row"><span class="spec-list__k">Address</span><span class="spec-list__v">' + CW.esc(d.line1 || '—') + '</span></div>' +
            '<div class="spec-list__row"><span class="spec-list__k">City</span><span class="spec-list__v">' + CW.esc((d.postcode || '') + ' ' + (d.city || '')) + '</span></div>' +
            '<div class="spec-list__row"><span class="spec-list__k">Country</span><span class="spec-list__v">' + CW.esc(d.country || '—') + '</span></div>' +
            '<div class="spec-list__row"><span class="spec-list__k">Method</span><span class="spec-list__v">' + CW.esc(d.shippingName || 'Standard Delivery') + '</span></div>' +
            '<div class="spec-list__row"><span class="spec-list__k">Payment</span><span class="spec-list__v">' + CW.esc(d.paymentName || 'Card') + '</span></div>' +
          '</div>' +
        '</div></div>' +

        '<div class="card"><div class="card__body">' +
          '<div class="t-eyebrow t-eyebrow--gold">Need to change something?</div>' +
          '<p class="t-sm mt-2">If your order has not shipped we can still amend it. Email the shop with your order number as soon as possible.</p>' +
          '<a class="btn btn--quiet btn--full mt-2" href="#/contact?topic=merch">Contact the shop</a>' +
        '</div></div>' +
      '</aside>' +
    '</div>' +
  '</section>' +

  '<section class="section container container--wide">' +
    CW.c.sectionHead({ eyebrow: 'What happens now', title: 'Next steps' }) +
    '<div class="next-steps">' +
      '<div class="next-step">' +
        '<div class="benefit__icon">' + CW.icon('mail', 20) + '</div>' +
        '<h3 class="t-h4">1. Check your email</h3>' +
        '<p class="t-sm">A confirmation with your full order details is on its way. Check spam if it has not landed in ten minutes.</p>' +
      '</div>' +
      '<div class="next-step">' +
        '<div class="benefit__icon">' + CW.icon('package', 20) + '</div>' +
        '<h3 class="t-h4">2. We pack it</h3>' +
        '<p class="t-sm">Orders are picked and packed Monday to Friday. Yours goes out within one working day.</p>' +
      '</div>' +
      '<div class="next-step">' +
        '<div class="benefit__icon">' + CW.icon('truck', 20) + '</div>' +
        '<h3 class="t-h4">3. Track it</h3>' +
        '<p class="t-sm">A tracking number arrives the moment the parcel leaves the warehouse. It also shows in your account.</p>' +
      '</div>' +
    '</div>' +

    '<div class="row mt-4" style="gap:12px;flex-wrap:wrap">' +
      '<a class="btn btn--primary" href="#/shop">Continue shopping</a>' +
      '<a class="btn btn--secondary" href="#/account/orders">View order history</a>' +
    '</div>' +
  '</section>' +

  '<section class="section--tight container container--wide">' + CW.c.ctaBand({
    eyebrow: 'While you wait',
    title: 'Come meet the people who wear the same thing',
    text: 'Post a fit check in the Den. Somebody will absolutely tell you which size they took.'
  }) + '</section>' +
  '</div>';
};
