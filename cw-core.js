/* ==========================================================================
   CRAZYWOLVES — CORE
   Utilities · icon set · formatting · state store · router · toasts
   Framework-free by design: this layer is what a React/Next port would
   replace, while the data files and CSS carry over untouched.
   ========================================================================== */

window.CW = window.CW || {};

/* ==========================================================================
   1. UTILITIES
   ========================================================================== */
/**
 * Srpski ima tri oblika množine, ne dva kao engleski:
 *   1, 21, 101      -> jednina        (1 artikal)
 *   2–4, 22–24      -> paukal         (2 artikla)
 *   0, 5–20, 25–30  -> množina        (5 artikala)
 * Izuzetak su brojevi 11–14, koji uvek idu u množinu.
 */
CW.plural = function (n, one, few, many) {
  n = Math.abs(Math.floor(n));
  var d = n % 10, dd = n % 100;
  if (dd >= 11 && dd <= 14) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
};

/**
 * Opis varijante uz naziv proizvoda — „M · Crna".
 *
 * Vraća prazno kad proizvod ima JEDNU varijantu. Šolja, stikeri i sve
 * uneto kroz panel imaju tačno jednu, pa je ispisivati „Univerzalna · Crna"
 * znači saopštiti kupcu izbor koji ne postoji. Veličina se tiče odeće.
 *
 * Uslov je broj varijanti, a ne kategorija, jer se kategorije dodaju kroz
 * panel — pravilo vezano za `apparel` bi puklo kod prve nove kategorije.
 */
CW.variantLabel = function (product, variantId) {
  if (!product || !product.variants || product.variants.length <= 1) return '';
  var v = null;
  product.variants.forEach(function (x) { if (x.id === variantId) v = x; });
  if (!v) return '';
  var color = v.colorId && CW.shopOptions ? CW.shopOptions.colors[v.colorId] : null;
  return [v.size, color ? color.name : ''].filter(Boolean).join(' · ');
};

/**
 * Inicijali korisnika, za dugme naloga u zaglavlju.
 *
 * Ime + prezime daju dva slova; ako imena nema (nalog napravljen samo
 * imejlom), uzima se prvo slovo imejla — jedno slovo je bolje od praznog
 * kruga, a nikad se ne ispisuje cela adresa.
 */
CW.initialsOf = function (user) {
  if (!user) return '';
  var a = String(user.firstName || '').trim();
  var b = String(user.lastName || '').trim();
  if (a || b) return ((a.charAt(0) || '') + (b.charAt(0) || '')).toUpperCase();
  var mail = String(user.email || '').trim();
  return mail ? mail.charAt(0).toUpperCase() : '';
};

CW.esc = function (v) {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

/* Meta opis za pretragu — Google seče posle otprilike 155-160 znakova, pa
   seče na razmaku umesto usred reči. Bez HTML taga, taj se sam upisuje kroz
   setAttribute (nema CW.esc potrebe). */
CW.metaDesc = function (text, max) {
  var s = String(text || '').replace(/\s+/g, ' ').trim();
  var limit = max || 155;
  if (s.length <= limit) return s;
  var cut = s.slice(0, limit + 1);
  var lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut.slice(0, limit)).trim() + '…';
};

/* ==========================================================================
   STRUKTURIRANI PODACI (JSON-LD)
   Upisuje/menja <script type="application/ld+json"> po id-ju u <head>-u.
   Jedan tag po vrsti podatka — ruter ga zamenjuje pri svakoj promeni
   stranice, ne gomila ih. Otklanja tag kad podatak više ne važi (npr.
   BreadcrumbList van stranice koja ima traku), da stara ruta ne ostavi
   pogrešnu šemu na sledećoj.
   ========================================================================== */
CW.jsonLd = function (id, data) {
  var existing = document.getElementById(id);
  if (!data) {
    if (existing) existing.remove();
    return;
  }
  if (!existing) {
    existing = document.createElement('script');
    existing.type = 'application/ld+json';
    existing.id = id;
    document.head.appendChild(existing);
  }
  existing.textContent = JSON.stringify(data);
};

/* items: isti spisak koji CW.c.crumbs iscrtava — { label, path }[].
   path je '#/...' relativna putanja; prazan path (poslednja stavka, tekuća
   stranica) pada na trenutnu adresu pregledača. */
CW.jsonLdBreadcrumbs = function (items) {
  if (!items || items.length < 2) { CW.jsonLd('ld-breadcrumbs', null); return; }
  var base = window.location.origin + window.location.pathname;
  CW.jsonLd('ld-breadcrumbs', {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(function (c, i) {
      return {
        '@type': 'ListItem',
        position: i + 1,
        name: c.label,
        item: c.path ? base + '#' + c.path : window.location.href
      };
    })
  });
};

/* p: proizvod u obliku koji CW.pages.product već koristi (price je u
   parama/centima, kao svuda na sajtu). */
CW.jsonLdProduct = function (p, stock) {
  if (!p) { CW.jsonLd('ld-product', null); return; }
  CW.jsonLd('ld-product', {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.shortDesc || p.description || undefined,
    image: p.image ? CW.imgSrc(p.image) : undefined,
    sku: p.id,
    offers: {
      '@type': 'Offer',
      url: window.location.origin + window.location.pathname + '#/proizvod/' + p.slug,
      priceCurrency: CW.shopConfig.currency,
      price: (p.price / 100).toFixed(2),
      availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    }
  });
};

CW.qs  = function (sel, root) { return (root || document).querySelector(sel); };
CW.qsa = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

CW.slug = function (s) {
  return String(s).toLowerCase()
    .replace(/[čćç]/g, 'c').replace(/[šş]/g, 's').replace(/[žz]/g, 'z')
    .replace(/đ/g, 'dj').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

CW.debounce = function (fn, wait) {
  var t;
  return function () {
    var args = arguments, ctx = this;
    clearTimeout(t);
    t = setTimeout(function () { fn.apply(ctx, args); }, wait || 200);
  };
};

/** Repeat a template n times — used for skeleton rows. */
CW.times = function (n, fn) {
  var out = '';
  for (var i = 0; i < n; i++) out += fn(i);
  return out;
};

/** Look-ups by id across the mock collections. */
CW.find = function (collection, id) {
  var list = CW.data[collection] || [];
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
};
CW.game   = function (id) { return CW.find('games', id) || { name: 'Unknown', short: '—', color: '#9C927E' }; };
CW.player = function (id) { return CW.find('players', id); };
CW.team   = function (id) { return CW.find('teams', id); };
CW.product= function (id) { return CW.find('products', id); };

CW.productBySlug = function (slug) {
  var list = CW.data.products;
  for (var i = 0; i < list.length; i++) if (list[i].slug === slug) return list[i];
  return null;
};

/* ==========================================================================
   2. FORMATTING
   ========================================================================== */
/* Dinar se piše sa tačkom kao separatorom hiljada i valutom iza iznosa. */
CW.money = function (minor) {
  var v = Math.round((minor || 0) / 100);
  var s = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return CW.shopConfig.currencyAfter
    ? s + ' ' + CW.shopConfig.currencySymbol
    : CW.shopConfig.currencySymbol + s;
};

CW.DAYS   = ['nedelja', 'ponedeljak', 'utorak', 'sreda', 'četvrtak', 'petak', 'subota'];
CW.DAYS_S = ['NED', 'PON', 'UTO', 'SRE', 'ČET', 'PET', 'SUB'];
CW.MONTHS = ['januar','februar','mart','april','maj','jun','jul','avgust','septembar','oktobar','novembar','decembar'];
CW.MONTHS_S = ['JAN','FEB','MAR','APR','MAJ','JUN','JUL','AVG','SEP','OKT','NOV','DEC'];

CW.fmtDate = function (iso, style) {
  var d = new Date(iso);
  if (isNaN(d)) return '';
  if (style === 'long')  return CW.DAYS[d.getDay()] + ', ' + d.getDate() + '. ' + CW.MONTHS[d.getMonth()] + ' ' + d.getFullYear() + '.';
  if (style === 'short') return d.getDate() + '. ' + CW.MONTHS_S[d.getMonth()] + ' ' + d.getFullYear() + '.';
  if (style === 'day')   return CW.DAYS[d.getDay()];
  return d.getDate() + '. ' + CW.MONTHS_S[d.getMonth()];
};

CW.fmtTime = function (iso) {
  var d = new Date(iso);
  if (isNaN(d)) return '';
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};

CW.relative = function (iso) {
  var diff = Date.now() - new Date(iso).getTime();
  var mins = Math.round(diff / 60000);
  if (mins < 1) return 'upravo sada';
  if (mins < 60) return 'pre ' + mins + ' min';
  var hrs = Math.round(mins / 60);
  if (hrs < 24) return 'pre ' + hrs + (hrs === 1 ? ' sat' : hrs < 5 ? ' sata' : ' sati');
  var days = Math.round(hrs / 24);
  if (days === 1) return 'juče';
  if (days < 30) return 'pre ' + days + ' dana';
  return CW.fmtDate(iso, 'short');
};

CW.isSameDay = function (a, b) {
  var x = new Date(a), y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
};

/* ==========================================================================
   3. ICONS — outline-first, 2px stroke, 2px corner radius (brand spec)
   ========================================================================== */
CW.ICONS = {
  search:   '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  user:     '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  heart:    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z"/>',
  cart:     '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h2.2l2.4 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 7H5"/>',
  menu:     '<path d="M3 6h18M3 12h18M3 18h18"/>',
  x:        '<path d="M18 6L6 18M6 6l12 12"/>',
  plus:     '<path d="M12 5v14M5 12h14"/>',
  minus:    '<path d="M5 12h14"/>',
  check:    '<path d="M20 6L9 17l-5-5"/>',
  chevronD: '<path d="M6 9l6 6 6-6"/>',
  chevronU: '<path d="M18 15l-6-6-6 6"/>',
  chevronR: '<path d="M9 18l6-6-6-6"/>',
  chevronL: '<path d="M15 18l-6-6 6-6"/>',
  arrowR:   '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowL:   '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  arrowUR:  '<path d="M7 17L17 7M8 7h9v9"/>',
  play:     '<path d="M7 4l13 8-13 8z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  clock:    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  trophy:   '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  users:    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  monitor:  '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  gift:     '<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 13h18M12 9v12"/><path d="M12 9S9.5 4 7.5 4a2.5 2.5 0 0 0 0 5M12 9s2.5-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  shield:   '<path d="M12 2l8 3.5v6c0 4.8-3.4 9-8 10.5-4.6-1.5-8-5.7-8-10.5v-6z"/>',
  truck:    '<path d="M3 6h11v10H3z"/><path d="M14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/>',
  refresh:  '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4v5h-5"/>',
  lock:     '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  alert:    '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/>',
  info:     '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/>',
  trash:    '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>',
  filter:   '<path d="M4 5h16l-6.5 8v6l-3 2v-8z"/>',
  sliders:  '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="7" cy="18" r="2"/>',
  mail:     '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  phone:    '<path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  pin:      '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
  star:     '<path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z"/>',
  share:    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
  copy:     '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  link:     '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
  logout:   '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  package:  '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  home:     '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  card:     '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  bell:     '<path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7z"/><path d="M10.5 21a1.8 1.8 0 0 0 3 0"/>',
  zap:      '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  target:   '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
  flame:    '<path d="M12 22c4 0 7-2.8 7-7 0-4.5-4-6.5-4-11 0 0-3 2-3 5.5C12 7 10 5 10 5S8 7.5 8 10c0 1.5-3 1.5-3 5 0 4.2 3 7 7 7z"/>',
  tag:      '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
  shirt:    '<path d="M9 3l3 2 3-2 6 3-2 4-2-1v12H7V9L5 10 3 6z"/>',
  cap:      '<path d="M4 15a8 8 0 0 1 16 0"/><path d="M2 15h20v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>',
  mouse:    '<rect x="6" y="3" width="12" height="18" rx="6"/><path d="M12 7v4"/>',
  mug:      '<path d="M4 5h13v9a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 8h2.5a2.5 2.5 0 0 1 0 5H17"/>',
  sticker:  '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8l6-6V5a2 2 0 0 0-2-2z"/><path d="M14 21v-4a2 2 0 0 1 2-2h4"/>',
  discord:  '<path d="M8.5 8.5c2.3-.9 4.7-.9 7 0M8 16c2.6 1.1 5.4 1.1 8 0"/><path d="M9 4.5S5.5 5 4 8s-1 8 .5 10.5c0 0 2 1.5 4 1L9.5 18M15 4.5s3.5.5 5 3.5.9 8-.5 10.5c0 0-2 1.5-4 1L14.5 18"/><circle cx="9.5" cy="12" r="1.2"/><circle cx="14.5" cy="12" r="1.2"/>',
  twitch:   '<path d="M4 3h16v11l-4 4h-3l-3 3H8v-3H4z"/><path d="M11 8v4M15 8v4"/>',
  youtube:  '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 9l5 3-5 3z"/>',
  instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/>',
  xsocial:  '<path d="M4 4l16 16M20 4L4 20"/>',
  tiktok:   '<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c.6 2.6 2.4 4 5 4"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  inbox:    '<path d="M3 12h5l2 3h4l2-3h5"/><path d="M4 5h16l1 7v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z"/>',
  book:     '<path d="M4 4h9a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4z"/><path d="M20 4h-4a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H20z"/>',
  compass:  '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  eye:      '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'
};

CW.icon = function (name, size, cls) {
  var path = CW.ICONS[name];
  if (!path) return '';
  var s = size || 20;
  return '<svg class="' + (cls || '') + '" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
         'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
         'aria-hidden="true" focusable="false">' + path + '</svg>';
};

/**
 * Grb — PRAVI logo, kao slika.
 *
 * Ranije je ovde stajao crtani SVG: gruba silueta vuka u štitu, napravljena
 * dok prava slika nije postojala. Pojavljivala se u panelu, na prijavi, na
 * registraciji i na kasi — svuda gde nije išao pun lockup — i pored pravog
 * logoa je izgledala kao njegova bleda senka.
 *
 * Crtež ostaje kao POSLEDNJA odbrana, u `CW.logoMarkSvg`: ako slika ne
 * stigne, bolje gruba silueta nego prazan kvadrat.
 */
CW.logoMark = function (size) {
  var s = size || 38;
  return '<img class="logo__mark" src="images/logo-mark.webp" alt="" ' +
    'width="' + s + '" height="' + s + '" decoding="async" ' +
    'style="width:' + s + 'px;height:' + s + 'px;object-fit:contain;border-radius:3px;flex:none" ' +
    'onerror="this.onerror=null;this.outerHTML=CW.logoMarkSvg(' + s + ');">';
};

/* Crtani grb — samo kao rezerva kad slika ne stigne. Ne koristiti direktno. */
CW.logoMarkSvg = function (size) {
  var s = size || 38;
  return '<svg class="logo__mark" width="' + (s * 0.9) + '" height="' + s + '" viewBox="0 0 36 40" fill="none" aria-hidden="true" focusable="false">' +
    '<path d="M18 1.5 34 7v13.5C34 29.4 27.2 36.4 18 38.5 8.8 36.4 2 29.4 2 20.5V7z" stroke="#D4A24E" stroke-width="1.6" fill="#0B0B0A"/>' +
    '<path d="M10.5 12.5l2.6 4.2 4.9-2.6 4.9 2.6 2.6-4.2v7.8c0 4-3.4 7.4-7.5 8.8-4.1-1.4-7.5-4.8-7.5-8.8z" fill="#D4A24E"/>' +
    '<path d="M14.6 19.6h1.9M19.5 19.6h1.9" stroke="#0B0B0A" stroke-width="1.8" stroke-linecap="round"/>' +
    '<path d="M18 22.4l-1.5 1.8h3z" fill="#0B0B0A"/>' +
    '</svg>';
};

/* ==========================================================================
   4. STORAGE ADAPTER
   Tries localStorage, degrades to in-memory so nothing breaks in restricted
   contexts. Swap this for a server-backed session at integration time.
   ========================================================================== */
CW.storage = (function () {
  var mem = {};
  var ok = false;
  try {
    var k = '__cw_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    ok = true;
  } catch (e) { ok = false; }

  return {
    available: ok,
    get: function (key, fallback) {
      try {
        var raw = ok ? window.localStorage.getItem(key) : mem[key];
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      var raw = JSON.stringify(value);
      try { if (ok) window.localStorage.setItem(key, raw); else mem[key] = raw; }
      catch (e) { mem[key] = raw; }
    },
    remove: function (key) {
      try { if (ok) window.localStorage.removeItem(key); else delete mem[key]; }
      catch (e) { delete mem[key]; }
    }
  };
})();

/* ==========================================================================
   5. STORE — cart, wishlist, session, recently viewed
   ========================================================================== */
CW.store = (function () {
  var KEY = 'cw.state.v1';
  var listeners = [];

  var state = CW.storage.get(KEY, null) || {
    cart: [],            /* { productId, variantId, qty } */
    wishlist: [],        /* productId[] */
    recentlyViewed: [],  /* productId[] */
    coupon: null,        /* { code, type, value } */
    lastOrder: null,
    cookiesAccepted: false
  };

  function persist() { CW.storage.set(KEY, state); }
  function emit() { persist(); listeners.forEach(function (fn) { fn(state); }); }

  /* --- derived helpers --- */
  function variantOf(productId, variantId) {
    var p = CW.product(productId);
    if (!p) return null;
    for (var i = 0; i < p.variants.length; i++) if (p.variants[i].id === variantId) return p.variants[i];
    return null;
  }

  function lineTotal(line) {
    var p = CW.product(line.productId);
    return p ? p.price * line.qty : 0;
  }

  return {
    get: function () { return state; },
    on: function (fn) { listeners.push(fn); },

    /* ---------- CART ---------- */
    cart: function () { return state.cart; },

    cartCount: function () {
      return state.cart.reduce(function (n, l) { return n + l.qty; }, 0);
    },

    cartSubtotal: function () {
      return state.cart.reduce(function (n, l) { return n + lineTotal(l); }, 0);
    },

    addToCart: function (productId, variantId, qty) {
      var v = variantOf(productId, variantId);
      if (!v || v.stock <= 0) return { ok: false, reason: 'out-of-stock' };

      var existing = null;
      for (var i = 0; i < state.cart.length; i++) {
        if (state.cart[i].productId === productId && state.cart[i].variantId === variantId) existing = state.cart[i];
      }
      var want = (existing ? existing.qty : 0) + (qty || 1);
      if (want > v.stock) return { ok: false, reason: 'stock-limit', max: v.stock };

      if (existing) existing.qty = want;
      else state.cart.push({ productId: productId, variantId: variantId, qty: qty || 1 });

      emit();
      return { ok: true };
    },

    updateQty: function (productId, variantId, qty) {
      var v = variantOf(productId, variantId);
      for (var i = 0; i < state.cart.length; i++) {
        var l = state.cart[i];
        if (l.productId === productId && l.variantId === variantId) {
          if (qty <= 0) { state.cart.splice(i, 1); emit(); return { ok: true, removed: true }; }
          if (v && qty > v.stock) { l.qty = v.stock; emit(); return { ok: false, reason: 'stock-limit', max: v.stock }; }
          l.qty = qty; emit(); return { ok: true };
        }
      }
      return { ok: false };
    },

    removeFromCart: function (productId, variantId) {
      state.cart = state.cart.filter(function (l) {
        return !(l.productId === productId && l.variantId === variantId);
      });
      emit();
    },

    clearCart: function () { state.cart = []; state.coupon = null; emit(); },

    /* ---------- TOTALS ---------- */
    totals: function (shippingId) {
      var subtotal = this.cartSubtotal();
      var discount = 0;
      var c = state.coupon;

      if (c && subtotal >= (c.minSpend || 0)) {
        if (c.type === 'percent') discount = Math.round(subtotal * c.value / 100);
        else if (c.type === 'fixed') discount = Math.min(c.value, subtotal);
      }

      var method = null;
      var methods = CW.data.shippingMethods;
      for (var i = 0; i < methods.length; i++) if (methods[i].id === shippingId) method = methods[i];
      if (!method) method = methods[0];

      var shipping = method.price;
      if (subtotal - discount >= CW.shopConfig.freeShippingThreshold) shipping = 0;
      if (c && c.type === 'shipping' && subtotal >= (c.minSpend || 0)) shipping = 0;
      if (state.cart.length === 0) shipping = 0;

      return {
        subtotal: subtotal,
        discount: discount,
        shipping: shipping,
        total: Math.max(0, subtotal - discount + shipping),
        freeShippingGap: Math.max(0, CW.shopConfig.freeShippingThreshold - (subtotal - discount))
      };
    },

    /* ---------- COUPON ---------- */
    applyCoupon: function (code) {
      var input = String(code || '').trim().toUpperCase();
      if (!input) return { ok: false, reason: 'empty' };
      var found = null;
      CW.data.coupons.forEach(function (c) { if (c.code === input) found = c; });
      if (!found) return { ok: false, reason: 'invalid' };
      if (this.cartSubtotal() < found.minSpend) return { ok: false, reason: 'min-spend', min: found.minSpend };
      state.coupon = found;
      emit();
      return { ok: true, coupon: found };
    },
    removeCoupon: function () { state.coupon = null; emit(); },
    coupon: function () { return state.coupon; },

    /* ---------- WISHLIST ---------- */
    wishlist: function () { return state.wishlist; },
    inWishlist: function (id) { return state.wishlist.indexOf(id) !== -1; },
    toggleWishlist: function (id) {
      var i = state.wishlist.indexOf(id);
      if (i === -1) state.wishlist.push(id); else state.wishlist.splice(i, 1);
      emit();
      return i === -1;
    },

    /* ---------- RECENTLY VIEWED ---------- */
    recordView: function (id) {
      state.recentlyViewed = [id].concat(state.recentlyViewed.filter(function (x) { return x !== id; })).slice(0, 8);
      persist();
    },
    recentlyViewed: function () {
      return state.recentlyViewed.filter(function (id) { return CW.product(id); });
    },

    /* ---------- SESSION ----------
       Pravi nalog živi u Supabase Auth (CW.sb), ne ovde — prijava,
       registracija i odjava idu direktno na CW.sb.auth iz cw-app.js i
       cw-components.js. Ovo ostaje samo kao ČITANJE, u istom obliku kao
       ranije ({firstName,lastName,email}|null), da se ekrani koji ga već
       koriste (zaglavlje, nalog, čuvari ruta) ne moraju menjati.
       Ime/prezime dolaze iz user_metadata upisanog pri registraciji
       (cw-supabase.js signUp) — vraća ih Supabase uz svaku sesiju. */
    user: function () {
      var u = CW.sb && CW.sb.enabled && CW.sb.auth.user();
      if (!u) return null;
      var meta = u.user_metadata || {};
      return {
        id: u.id,
        email: u.email,
        firstName: meta.first_name || '',
        lastName: meta.last_name || ''
      };
    },

    /* ---------- ORDER ---------- */
    placeOrder: function (details) {
      var t = this.totals(details.shippingId);
      var num = 'CW-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 8999));
      state.lastOrder = {
        id: num,
        date: new Date().toISOString(),
        items: state.cart.slice(),
        totals: t,
        details: details,
        status: 'processing'
      };
      state.cart = [];
      state.coupon = null;
      emit();
      return state.lastOrder;
    },
    /* Upisuje porudžbinu koju je server već primio i potvrdio.
       Korpa se prazni TEK ovde — ako slanje padne, kupac zatekne svoje
       stavke na mestu umesto prazne korpe i izgubljene porudžbine. */
    recordOrder: function (order) {
      state.lastOrder = {
        id: order.id,
        date: new Date().toISOString(),
        items: state.cart.slice(),
        serverItems: order.items || [],
        totals: order.totals,
        currency: order.currency || 'RSD',
        details: order.details,
        emailSent: Boolean(order.emailSent),
        status: order.status || 'confirmed'
      };
      state.cart = [];
      state.coupon = null;
      emit();
      return state.lastOrder;
    },

    lastOrder: function () { return state.lastOrder; },

    acceptCookies: function () { state.cookiesAccepted = true; emit(); }
  };
})();

/* ==========================================================================
   6. TOASTS
   ========================================================================== */
CW.toast = (function () {
  var region;

  function ensure() {
    region = document.getElementById('toast-region');
    if (!region) {
      region = document.createElement('div');
      region.id = 'toast-region';
      region.className = 'toast-region';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    return region;
  }

  var iconFor = { success: 'check', error: 'alert', warning: 'alert', info: 'info' };

  return function (opts, maybeType) {
    /* Dva oblika poziva, jer se u praksi koriste oba:
         CW.toast({ title: 'Dodato u korpu', text: '…', type: 'success' })
         CW.toast('Sačuvano.', 'success')

       Javni sajt zove prvi, admin panel drugi. Do sada je prolazio samo
       prvi — kratak oblik je davao objekat bez `title`, pa su se sve
       poruke u panelu iscrtavale kao PRAZAN pravougaonik. Zato „Sačuvano",
       „Objavljeno" i sve greške pri čuvanju nisu imale tekst. */
    var o = (typeof opts === 'string') ? { title: opts, type: maybeType } : (opts || {});
    var type = o.type || 'info';
    var el = document.createElement('div');
    el.className = 'toast toast--' + type;

    el.innerHTML =
      (o.thumb ? '<div class="toast__thumb" aria-hidden="true"></div>' :
        '<span class="toast__icon">' + CW.icon(iconFor[type] || 'info', 18) + '</span>') +
      '<div class="toast__body">' +
        '<div class="toast__title">' + CW.esc(o.title || '') + '</div>' +
        (o.text ? '<div class="toast__text">' + CW.esc(o.text) + '</div>' : '') +
      '</div>' +
      '<button class="toast__close" type="button" aria-label="Dismiss notification">' + CW.icon('x', 16) + '</button>';

    ensure().appendChild(el);

    var timer = setTimeout(close, o.duration || 4200);
    function close() {
      clearTimeout(timer);
      el.classList.add('is-leaving');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
    }
    el.querySelector('.toast__close').addEventListener('click', close);
  };
})();

/* ==========================================================================
   7. ROUTER — hash based, so the site runs from the file system with no server
   ========================================================================== */
CW.router = (function () {
  var routes = [];
  var notFound = null;
  var current = null;

  function parse() {
    var raw = window.location.hash.replace(/^#\/?/, '');
    var qIndex = raw.indexOf('?');
    var path = qIndex === -1 ? raw : raw.slice(0, qIndex);
    var queryStr = qIndex === -1 ? '' : raw.slice(qIndex + 1);

    var query = {};
    queryStr.split('&').forEach(function (pair) {
      if (!pair) return;
      var kv = pair.split('=');
      query[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' '));
    });

    return { path: path.replace(/\/$/, ''), segments: path ? path.split('/').filter(Boolean) : [], query: query };
  }

  function match(loc) {
    for (var i = 0; i < routes.length; i++) {
      var r = routes[i];
      var parts = r.pattern.split('/').filter(Boolean);
      if (parts.length !== loc.segments.length) continue;

      var params = {}, ok = true;
      for (var j = 0; j < parts.length; j++) {
        if (parts[j].charAt(0) === ':') params[parts[j].slice(1)] = loc.segments[j];
        else if (parts[j] !== loc.segments[j]) { ok = false; break; }
      }
      if (ok) return { route: r, params: params };
    }
    return null;
  }

  function showProgress() {
    var bar = document.getElementById('route-progress');
    if (!bar) return;
    bar.style.opacity = '1';
    bar.style.width = '35%';
    setTimeout(function () { bar.style.width = '80%'; }, 90);
    setTimeout(function () {
      bar.style.width = '100%';
      setTimeout(function () { bar.style.opacity = '0'; bar.style.width = '0'; }, 220);
    }, 260);
  }

  /* Upamćeno pri prvom crtanju — vraća se rutama koje ne daju svoj opis, da
     meta opis nikad ne ostane prazan ili sa opisom prošle stranice. */
  var defaultDescription = null;

  function syncMeta(hit, ctx) {
    var descTag = document.querySelector('meta[name="description"]');
    if (!descTag) return;
    if (defaultDescription === null) defaultDescription = descTag.getAttribute('content') || '';

    var desc = (hit && hit.route.description ? hit.route.description(ctx) : '') || defaultDescription;
    descTag.setAttribute('content', desc);

    /* Isti tekst ide i u Open Graph/Twitter opis — čita ih Google-ov
       renderer (izvršava JS), ne i botovi za pregled linka (Discord,
       WhatsApp...), koji fragment adrese ni ne vide jer ga pregledač nikad
       ne šalje serveru. Statične vrednosti u <head>-u i dalje pokrivaju te
       botove. */
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', desc);
  }

  function render() {
    var loc = parse();
    var hit = match(loc);
    var outlet = document.getElementById('app');
    if (!outlet) return;

    showProgress();
    CW.ui.closeAllOverlays();

    /* Product/BreadcrumbList JSON-LD se dodaju SAMO na stranice koje ih
       pozovu (vidi CW.jsonLdProduct, CW.c.crumbs) — ali stranica na koju se
       prelazi možda ih ne poziva uopšte, pa bi stari tag ostao u <head>-u i
       opisivao pogrešnu stranicu. Čisti se pre svakog crtanja; ko treba, ga
       odmah ponovo upiše. */
    CW.jsonLd('ld-product', null);
    CW.jsonLd('ld-breadcrumbs', null);

    var view = hit ? hit.route.view : notFound;
    var ctx = { params: hit ? hit.params : {}, query: loc.query, path: loc.path };
    current = ctx;

    /* Render, then run any post-render wiring the page registered. */
    CW.pendingMount = [];
    outlet.innerHTML = view(ctx);
    outlet.className = hit && hit.route.bodyClass ? hit.route.bodyClass : '';
    document.title = (hit && hit.route.title ? hit.route.title(ctx) : 'Page Not Found') + ' — CrazyWolves';
    syncMeta(hit, ctx);

    CW.pendingMount.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
    CW.pendingMount = [];

    CW.ui.syncHeader(loc.path);

    /* Page-level behaviour is re-attached on every render, including the
       in-place re-renders triggered by setQuery() and refresh(). */
    if (CW.wirePage) { try { CW.wirePage(); } catch (e) { console.error(e); } }

    /* Preserve scroll on in-page tab/filter changes, reset on true navigation */
    if (!loc.query.keepScroll) window.scrollTo({ top: 0, behavior: 'auto' });
  }

  return {
    add: function (pattern, view, opts) {
      routes.push({
        pattern: pattern, view: view,
        title: (opts || {}).title, description: (opts || {}).description,
        bodyClass: (opts || {}).bodyClass
      });
      return this;
    },
    setNotFound: function (view) { notFound = view; return this; },
    start: function () {
      window.addEventListener('hashchange', render);
      if (!window.location.hash) {
        /* Postavljanje hash-a NE okida hashchange pouzdano — ni na svim
           browserima, ni na file:// protokolu. Ranije se prvo crtanje
           oslanjalo na taj događaj, pa je <main> ostajao prazan pri
           otvaranju bez #hash-a. Zato hash upisujemo tiho, kroz
           replaceState (bez novog unosa u istoriji), i crtamo sami. */
        try {
          window.history.replaceState(null, '', window.location.pathname + window.location.search + '#/');
        } catch (e) {
          window.location.hash = '#/';   /* file:// ume da zabrani replaceState */
        }
      }
      render();
    },
    go: function (path) {
      if (window.location.hash === '#' + path) render();
      else window.location.hash = path;
    },
    refresh: render,
    current: function () { return current; },
    /** Update query params without a full scroll reset. */
    setQuery: function (updates) {
      var loc = parse();
      var q = Object.assign({}, loc.query, updates);
      var parts = [];
      Object.keys(q).forEach(function (k) {
        if (q[k] === null || q[k] === undefined || q[k] === '') return;
        parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(q[k]));
      });
      var next = '#/' + loc.path + (parts.length ? '?' + parts.join('&') : '');
      if (window.location.hash === next) render(); else window.location.hash = next;
    }
  };
})();

/* ==========================================================================
   8. LOADING SIMULATION
   Views call CW.withLoading(key, render) to demonstrate skeleton states on
   first visit. Real data fetching replaces this wholesale.
   ========================================================================== */
CW.loaded = {};
CW.withLoading = function (key, skeletonHTML, contentFn) {
  if (CW.loaded[key]) return contentFn();
  CW.onMount(function () {
    setTimeout(function () {
      CW.loaded[key] = true;
      var host = document.querySelector('[data-loading-key="' + key + '"]');
      if (host) {
        host.innerHTML = contentFn();
        host.removeAttribute('aria-busy');
        CW.pendingMount = CW.pendingMount || [];
        var queued = CW.pendingMount.splice(0);
        queued.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
      }
    }, 520);
  });
  return skeletonHTML;
};

/** Queue a function to run after the current render commits to the DOM. */
CW.onMount = function (fn) {
  CW.pendingMount = CW.pendingMount || [];
  CW.pendingMount.push(fn);
};
