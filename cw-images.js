/* ==========================================================================
   CRAZYWOLVES — REGISTAR SLIKA
   --------------------------------------------------------------------------
   Sve slike žive u images/ i putuju uz sajt.

     1. images/ime.png          — jedini izvor
     2. stilizovani placeholder — ako fajl nedostaje, raspored ostaje čitav

   Ranija verzija je imala i fallback na .project-cache folder sa lokalnog
   računara. Izbačen je: na serveru taj folder ne postoji, pa je svaka slika
   plaćala jedan uzaludan zahtev pre nego što odustane.
   ========================================================================== */

window.CW = window.CW || {};

CW.IMAGES = {
  /* ---------- LOGO I LOCKUP ---------- */
  'logo-shield': {
    local: 'images/logo-shield.webp',
    w: 1092, h: 1092, crop: 'none', group: 'brend',
    alt: 'CrazyWolves grb — zlatni vuk u štitu'
  },
  'banner-lockup': {
    local: 'images/banner-lockup.webp',
    w: 1568, h: 644, crop: 'none', group: 'brend',
    alt: 'CRAZYWOLVES COMMUNITY — zvanični lockup'
  },

  /* ---------- ŠIROKI BANERI ----------
     Svi su 1983×793 (2.5 : 1). To je namerno isti odnos za sve — kad svaki
     baner ima istu meru, blok na početnoj, kartica objave i hero ne moraju
     da imaju tri različita slota. Jedini izuzetak je CS2 (2 : 1), jer je
     tako i isporučen. */
  'banner-nova-era': {
    local: 'images/banner-nova-era.webp',
    w: 1983, h: 793, crop: 'none', group: 'brend',
    alt: 'Stiže nova era — CrazyWolves prodavnica se otvara uskoro'
  },
  'banner-wolfpack-store': {
    local: 'images/banner-wolfpack-store.webp',
    w: 1983, h: 793, crop: 'none', group: 'brend',
    alt: 'Dobrodošli u zvaničnu Wolfpack digitalnu prodavnicu'
  },
  'banner-wolfpack-brand': {
    local: 'images/banner-wolfpack-brand.webp',
    w: 1983, h: 793, crop: 'none', group: 'brend',
    alt: 'Wolfpack Store — igre, gift kartice, ključevi i pretplate'
  },
  'banner-solja': {
    local: 'images/banner-solja.webp',
    w: 1983, h: 793, crop: 'none', group: 'proizvod',
    alt: 'Zvanična CrazyWolves šolja — limitirano izdanje'
  },
  'banner-cs2': {
    local: 'images/banner-cs2.webp',
    w: 1774, h: 887, crop: 'none', group: 'blog',
    alt: 'CrazyWolves ponosno sponzoriše CS2 tim'
  },
  'banner-usluge': {
    local: 'images/banner-usluge.webp',
    w: 1983, h: 793, crop: 'none', group: 'blog',
    alt: 'CrazyWolves usluge — Wolfpack Store, Discord, marketing, dizajn i sajtovi'
  },
  'banner-construction-sr': {
    local: 'images/banner-construction-sr.webp',
    w: 1983, h: 793, crop: 'none', group: 'blog',
    alt: 'Sajt je trenutno u izradi — radimo na nečemu velikom'
  },
  'banner-construction-en': {
    local: 'images/banner-construction-en.webp',
    w: 1983, h: 793, crop: 'none', group: 'blog',
    alt: 'Website under construction — we are building something epic'
  },

  /* ---------- SARADNJA ---------- */
  'banner-saradnja-wolf3tv': {
    local: 'images/banner-saradnja-wolf3tv.webp',
    w: 1983, h: 793, crop: 'none', group: 'blog',
    alt: 'Zvanična saradnja — Wolfpack Store i WOLF3TV'
  },
  'banner-join-wolfpack': {
    local: 'images/banner-join-wolfpack.webp',
    w: 1983, h: 793, crop: 'none', group: 'blog',
    alt: 'WOLF3TV × CrazyWolves — Join the Wolfpack'
  },
  'banner-wolf3tv': {
    local: 'images/banner-wolf3tv.webp',
    w: 1983, h: 793, crop: 'none', group: 'blog',
    alt: 'WOLF3TV — zvanični brend predstavnik CrazyWolves zajednice'
  },

  /* ---------- PROIZVODI ----------
     Kartica proizvoda traži kvadrat. Baneri su 2.5 : 1 i u kvadratnom slotu
     bi se sveli na tanku traku, pa ove dve slike nisu baneri nego kvadratni
     isečci iz njih — šolja sa kutijom, i ekran Wolfpack Store-a. */
  'product-mug': {
    local: 'images/product-solja.webp',
    w: 1100, h: 1100, crop: 'safe', group: 'proizvod',
    alt: 'Zvanična CrazyWolves šolja sa kutijom — limitirano izdanje'
  },
  'product-wolfpack': {
    local: 'images/product-wolfpack.webp',
    w: 1100, h: 1100, crop: 'safe', group: 'proizvod',
    alt: 'Wolfpack Store — digitalna gaming prodavnica'
  },

  /* ---------- STARI KLJUČEVI ----------
     Stranice i početni sadržaj ih još pominju. Umesto da se menja dvadeset
     mesta, ključ pokazuje na novu sliku. Kad se sve preveže, mogu da odu. */
  'banner-website-soon': {
    local: 'images/banner-construction-sr.webp',
    w: 1983, h: 793, crop: 'none', group: 'blog',
    alt: 'Sajt je trenutno u izradi — radimo na nečemu velikom'
  },
  'banner-cs2-team': {
    local: 'images/banner-cs2.webp',
    w: 1774, h: 887, crop: 'none', group: 'blog',
    alt: 'CrazyWolves ponosno sponzoriše CS2 tim'
  },
  'banner-services': {
    local: 'images/banner-usluge.webp',
    w: 1983, h: 793, crop: 'none', group: 'blog',
    alt: 'CrazyWolves usluge — Wolfpack Store, Discord, marketing, dizajn i sajtovi'
  },
  'partner-wolf3tv': {
    local: 'images/banner-saradnja-wolf3tv.webp',
    w: 1983, h: 793, crop: 'none', group: 'blog',
    alt: 'Zvanična saradnja — Wolfpack Store i WOLF3TV'
  },
  'discord-announce': {
    local: 'images/banner-nova-era.webp',
    w: 1983, h: 793, crop: 'none', group: 'brend',
    alt: 'Stiže nova era — CrazyWolves prodavnica se otvara uskoro'
  },

  /* ---------- ZADRŽANO IZ PRVE FAZE ----------
     Snimci ekrana i uspravni posteri koje nove slike ne pokrivaju. */
  'banner-server-guide': {
    local: 'images/banner-server-guide.webp',
    w: 1568, h: 784, crop: 'none', group: 'blog',
    alt: 'CrazyWolves Server Guide'
  },
  'services-overview': {
    local: 'images/services-overview.webp',
    w: 896, h: 1344, crop: 'none', group: 'blog',
    alt: 'CrazyWolves usluge — pregled svih servisa'
  },
  'hero-flag-hills': {
    local: 'images/hero-flag-hills.webp',
    w: 1204, h: 560, crop: 'safe', group: 'brend',
    alt: 'CrazyWolves zastava iznad doline'
  },
  'hero-flag-city': {
    local: 'images/hero-flag-city.webp',
    w: 1260, h: 560, crop: 'safe', group: 'brend',
    alt: 'CrazyWolves zastava nad gradom'
  },
  'promo-instagram': {
    local: 'images/promo-instagram.webp',
    w: 1008, h: 1204, crop: 'none', group: 'blog',
    alt: 'Zaprati CrazyWolves na Instagramu'
  },
  'instagram-profile': {
    local: 'images/instagram-profile.webp',
    w: 728, h: 616, crop: 'none', group: 'blog',
    alt: 'CrazyWolves Instagram profil'
  },
  'discord-sidebar': {
    local: 'images/discord-sidebar-top.webp',
    w: 364, h: 952, crop: 'none', group: 'discord',
    alt: 'CrazyWolves Discord — kanali dobrodošlice'
  },
  'discord-business': {
    local: 'images/discord-channels-business.webp',
    w: 364, h: 812, crop: 'none', group: 'discord',
    alt: 'Discord — Business, Community i Social kanali'
  },
  'discord-games': {
    local: 'images/discord-channels-games.webp',
    w: 364, h: 756, crop: 'none', group: 'discord',
    alt: 'Discord — kanali po igrama'
  },
  'discord-travian': {
    local: 'images/discord-channels-travian.webp',
    w: 364, h: 420, crop: 'none', group: 'discord',
    alt: 'Discord — Travian i GTA kanali'
  },
  'discord-premium': {
    local: 'images/discord-channels-premium.webp',
    w: 364, h: 252, crop: 'none', group: 'discord',
    alt: 'Discord — Premium Area'
  },

  /* ---------- ŠABLONI ----------
     Prazne slike u tačnim dimenzijama, za objave i proizvode koji još
     nemaju svoju fotografiju. */
  'sablon-blog': {
    local: 'images/sablon-blog.webp',
    w: 1200, h: 800, crop: 'none', group: 'blog',
    alt: 'CrazyWolves — šablon za objavu'
  },
  'sablon-blog-2': {
    local: 'images/sablon-blog-2.webp',
    w: 1200, h: 800, crop: 'none', group: 'blog',
    alt: 'CrazyWolves — šablon za novost'
  },
  'sablon-blog-3': {
    local: 'images/sablon-blog-3.webp',
    w: 1200, h: 800, crop: 'none', group: 'blog',
    alt: 'CrazyWolves — šablon za najavu'
  },
  'sablon-proizvod': {
    local: 'images/sablon-proizvod.webp',
    w: 1200, h: 1200, crop: 'none', group: 'proizvod',
    alt: 'CrazyWolves — šablon za proizvod'
  },
  'sablon-proizvod-2': {
    local: 'images/sablon-proizvod-2.webp',
    w: 1200, h: 1200, crop: 'none', group: 'proizvod',
    alt: 'CrazyWolves — proizvod uskoro'
  }
};

/* Pretvara "16 / 9" ili "1.78" u broj. */
function toRatio(v) {
  if (!v || v === 'auto') return 0;
  var p = String(v).split('/');
  var n = p.length === 2 ? parseFloat(p[0]) / parseFloat(p[1]) : parseFloat(v);
  return isFinite(n) && n > 0 ? n : 0;
}

/**
 * Vraća <img> sa ispravnim kadriranjem.
 *
 * Odnos slota:  opts.ratio  ->  prirodni odnos slike  ->  16/9
 * Kadriranje:   opts.fit    ->  automatski:
 *     crop:'safe'  (fotografija)      -> cover, sme da se seče
 *     crop:'none'  (poster / snimak)  -> cover samo ako je slot praktično
 *                                        isti odnos (±6%), inače contain,
 *                                        da tekst na slici ostane čitav.
 *
 * width/height se uvek ispisuju iz registra — browser rezerviše prostor
 * pre učitavanja, pa nema poskakivanja rasporeda (CLS).
 *
 * @param {string} key    ključ iz CW.IMAGES
 * @param {object} [opts] { ratio, cls, ph, eager, fit }
 */
/**
 * Prepoznaje sliku koja NIJE u registru: otpremljena iz panela.
 *
 * Posle otpremanja u polju ne stoji ključ (`product-mug`) nego adresa —
 * puna adresa iz Supabase Storage-a, ili `data:` zapis dok baza nije
 * povezana. Bez ove provere bi svaka otpremljena slika svuda na sajtu
 * ispala kao stilizovan placeholder, jer je `CW.IMAGES[key]` prazno.
 */
function directSource(v) {
  if (typeof v !== 'string' || !v) return null;
  if (/^(https?:|data:|blob:|\/)/i.test(v)) return v;
  /* `images/nesto.webp` — putanja, a ne ključ (ključevi nemaju kosu crtu). */
  if (v.indexOf('/') !== -1) return v;
  return null;
}
CW.isUploaded = function (v) { return Boolean(directSource(v)); };

CW.img = function (key, opts) {
  var o = opts || {};
  var meta = CW.IMAGES[key];

  /* Otpremljena slika: dimenzije se ne znaju unapred, pa se ponaša kao
     fotografija — sme da se seče da popuni slot. */
  if (!meta) {
    var src = directSource(key);
    if (src) meta = { local: src, w: null, h: null, crop: 'safe', alt: o.ph || '' };
  }

  var phLabel = o.ph || (meta ? meta.alt : 'SLIKA');

  if (!meta) {
    return '<div class="ph ' + (o.cls || '') + '" style="aspect-ratio:' +
      (o.ratio && o.ratio !== 'auto' ? o.ratio : '16 / 9') +
      '" data-ph="' + CW.esc(phLabel) + '"></div>';
  }

  var natural = meta.w && meta.h ? (meta.w + ' / ' + meta.h) : '16 / 9';
  var ratio = (o.ratio && o.ratio !== 'auto') ? o.ratio : natural;

  var fit = o.fit;
  var pos = o.pos || 'center';
  if (!fit) {
    var a = toRatio(ratio), b = toRatio(natural);
    var same = a && b && Math.abs(a - b) / b <= 0.06;

    if (meta.crop === 'safe' || same) {
      /* Fotografija, ili je slot praktično istog odnosa — puni bez gubitka. */
      fit = 'cover';
    } else if (b > a) {
      /* Slika je ŠIRA od slota. Bočno sečenje bi odseklo grb ili kraj
         natpisa, pa je uklapamo celu. */
      fit = 'contain';
    } else {
      /* Slika je VIŠA od slota — uspravan poster u položenom slotu.
         Letterbox bi ga sveo na marku; umesto toga punimo slot i
         poravnavamo na vrh, gde poster nosi naslov. */
      fit = 'cover';
      pos = o.pos || 'top';
    }
  }

  /* Jedini fallback: stilizovani placeholder, da raspored ostane čitav */
  var onerr =
    "this.onerror=null;" +
    "var d=document.createElement('div');" +
    "d.className='ph '+this.getAttribute('data-cls');" +
    "d.style.aspectRatio=this.getAttribute('data-ratio');" +
    "d.setAttribute('data-ph',this.getAttribute('data-phlabel'));" +
    "this.replaceWith(d);";

  var cls = 'cw-img' + (fit === 'contain' ? ' cw-img--contain' : '') +
            (o.cls ? ' ' + o.cls : '');

  return '<img class="' + cls + '" ' +
    'src="' + meta.local + '" ' +
    'alt="' + CW.esc(meta.alt) + '" ' +
    (meta.w ? 'width="' + meta.w + '" height="' + meta.h + '" ' : '') +
    'loading="' + (o.eager ? 'eager' : 'lazy') + '" ' +
    (o.eager ? 'fetchpriority="high" ' : '') +
    'decoding="async" ' +
    'style="aspect-ratio:' + ratio + ';object-fit:' + fit +
      ';object-position:' + pos + ';width:100%;height:100%;display:block" ' +
    'data-cls="' + CW.esc(o.cls || '') + '" ' +
    'data-ratio="' + ratio + '" ' +
    'data-phlabel="' + CW.esc(phLabel) + '" ' +
    'onerror="' + onerr + '">';
};

/** Putanja za CSS background-image. */
CW.imgSrc = function (key) {
  var meta = CW.IMAGES[key];
  return meta ? meta.local : (directSource(key) || '');
};

/** Prirodni odnos slike, npr. za zadavanje slota u rasporedu. */
CW.imgRatio = function (key) {
  var meta = CW.IMAGES[key];
  return meta && meta.w ? meta.w + ' / ' + meta.h : '16 / 9';
};
