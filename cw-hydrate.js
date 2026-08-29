/* ==========================================================================
   CRAZYWOLVES — PUNJENJE SAJTA IZ BAZE
   --------------------------------------------------------------------------
   Sajt i dalje ima ugrađene podatke u cw-data-*.js. Oni sada služe kao
   rezerva: ako baza odgovori, sadržaj se zamenjuje; ako ne odgovori
   (nema mreže, Supabase pao), posetilac i dalje vidi pun sajt umesto
   praznih stranica.

   Čita se samo objavljeno — o tome brine RLS u bazi, ne ovaj fajl.
   ========================================================================== */

window.CW = window.CW || {};

(function () {
  'use strict';

  if (!CW.sb || !CW.sb.enabled) return;

  /* Markdown iz baze -> blokovi kakve članak očekuje.
     Suprotan smer od onog u panelu, gde se blokovi spajaju u Markdown. */
  function toBlocks(md) {
    var out = [];
    var para = [];
    var list = null;

    function flush() {
      if (para.length) { out.push({ type: 'p', text: para.join(' ') }); para = []; }
    }
    function closeList() {
      if (list) { out.push({ type: 'list', items: list }); list = null; }
    }

    String(md || '').split('\n').forEach(function (raw) {
      var line = raw.trim();
      if (!line) { flush(); closeList(); return; }

      var h = line.match(/^#{2,4}\s+(.*)$/);
      if (h) { flush(); closeList(); out.push({ type: 'h2', text: h[1] }); return; }

      var q = line.match(/^>\s?(.*)$/);
      if (q) { flush(); closeList(); out.push({ type: 'quote', text: q[1] }); return; }

      var li = line.match(/^[-*]\s+(.*)$/) || line.match(/^\d+\.\s+(.*)$/);
      if (li) { flush(); list = list || []; list.push(li[1]); return; }

      closeList();
      para.push(line);
    });

    flush(); closeList();
    return out.length ? out : [{ type: 'p', text: String(md || '') }];
  }

  function daysAgo(iso) {
    if (!iso) return 0;
    return Math.round((new Date(iso) - Date.now()) / 864e5);
  }

  function words(md) {
    return String(md || '').trim().split(/\s+/).filter(Boolean).length;
  }

  /* Slika može biti ključ iz registra ('product-mug') ili puna adresa iz
     Storage-a. Pune adrese upisujemo u registar u letu, da CW.img radi
     jednako u oba slučaja. */
  function resolveImage(value, alt, ratioW, ratioH) {
    if (!value) return null;
    if (!/^https?:\/\//i.test(value)) return CW.IMAGES[value] ? value : null;

    var key = 'db-' + value.split('/').pop().replace(/\.[a-z0-9]+$/i, '');
    if (!CW.IMAGES[key]) {
      CW.IMAGES[key] = {
        local: value,
        w: ratioW, h: ratioH,
        crop: 'none',
        group: 'db',
        alt: alt || 'CrazyWolves'
      };
    }
    return key;
  }

  CW.hydrate = function () {
    /* Svaki sinhroni izuzetak (nema fetch-a, CSP blokira zahtev) pretvara se
       u odbijeni Promise, da pozivalac ima jedan način da reaguje. */
    try {
      return load();
    } catch (e) {
      CW.dataSource = 'ugradjeni';
      return Promise.resolve(false);
    }
  };

  function load() {
    var posts = CW.sb.from('posts').select('*').eq('status', 'published')
      .order('published_at', true).get();
    var products = CW.sb.from('products').select('*').order('sort_order').get();
    var cats = CW.sb.from('post_categories').select('*').order('sort_order').get();

    /* Zaliha digitalnog proizvoda NIJE kolona `stock` nego broj slobodnih
       Steam kodova. Kodove posetilac ne sme da čita — kod je roba — pa
       postoji pogled `product_availability` koji pušta samo cifru.

       Ako pogled još nije napravljen (nije pokrenuta dopuna 01), ostaje
       prazan spisak i digitalni proizvodi se ponašaju kao da nemaju zalihu —
       umesto da ceo sajt padne na jednom nedostajućem pogledu. */
    var availability = CW.sb.from('product_availability').select('*').get()
      .catch(function () { return []; });

    /* Nacini dostave i njihove cene zive u bazi, jer ih baza i naplacuje.
       Dok je cenovnik stajao samo u cw-data-shop.js, sajt je za licno
       preuzimanje pokazivao 0 a baza naplacivala 390 — kupac je video jedno
       na kasi, drugo na potvrdi. */
    var shipping = CW.sb.from('shipping_methods').select('*')
      .eq('is_active', true).order('sort_order').get()
      .catch(function () { return []; });

    return Promise.all([posts, products, cats, availability, shipping]).then(function (r) {
      var dbPosts = r[0] || [], dbProducts = r[1] || [], dbCats = r[2] || [];

      var slobodnoKodova = {};
      (r[3] || []).forEach(function (a) { slobodnoKodova[a.product_id] = a.available; });

      var dbShipping = r[4] || [];
      if (dbShipping.length) {
        CW.data.shippingMethods = dbShipping.map(function (m) {
          return {
            id: m.id,
            name: m.name,
            eta: m.eta || '',
            desc: m.description || '',
            price: m.price,
            priceEur: m.price_eur,
            freeOverApplies: m.free_over_applies !== false
          };
        });
      }

      if (dbCats.length) {
        CW.data.newsCategories = dbCats.map(function (c) {
          return { id: c.id, name: c.name };
        });
      }

      if (dbPosts.length) {
        CW.data.news = dbPosts.map(function (p) {
          return {
            id: p.slug || p.id,
            title: p.title,
            dek: p.excerpt || '',
            categoryId: p.category_id || 'objave',
            author: p.author || 'CrazyWolves',
            dayOffset: daysAgo(p.published_at),
            readMin: p.read_min || Math.max(1, Math.round(words(p.content) / 200)),
            featured: Boolean(p.is_featured),
            trending: false,
            image: resolveImage(p.image, p.image_alt, 1200, 800),
            imageMobile: resolveImage(p.image_mobile, p.image_mobile_alt, 1080, 1920),
            tags: p.tags || [],
            body: toBlocks(p.content),
            relatedIds: []
          };
        });
      }

      if (dbProducts.length) {
        /* Zadržavamo varijante i galerije iz ugrađenih podataka — panel ih
           još ne uređuje, pa bi ih prepisivanje iz baze obrisalo. */
        var oldById = {};
        (CW.data.products || []).forEach(function (p) { oldById[p.id] = p; });

        CW.data.products = dbProducts.map(function (p) {
          var old = oldById[p.id] || {};

          /* Koliko komada stvarno ima. Kod merch robe to je `stock`; kod
             digitalne je broj slobodnih kodova, a `stock` se ne prati. */
          var naStanju = p.shop === 'digital'
            ? (slobodnoKodova[p.id] || 0)
            : (p.stock || 0);

          /* Ceo sajt računa zalihu preko VARIJANTI (CW.stockOf sabira
             v.stock). Proizvod unet kroz panel nema varijante, pa bi bez
             ovoga svaki proizvod iz baze pisao „Rasprodato" — i dugme za
             kupovinu se ne bi ni pojavilo.

             Zato proizvod bez varijanti dobija jednu, podrazumevanu, koja
             nosi pravu zalihu. Postojeće varijante (veličine majice) se ne
             diraju — panel ih još ne uređuje. */
          var variants = (old.variants && old.variants.length)
            ? old.variants
            : [{ id: p.id + '-default', name: 'Standard', stock: naStanju }];

          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            shop: p.shop || 'merch',
            fulfillment: p.fulfillment || 'physical',
            trackStock: p.track_stock !== false,
            stock: naStanju,
            categoryId: p.category_id,
            collectionId: p.collection_id || old.collectionId || '',
            price: p.price,
            compareAt: p.compare_at,
            priceEur: p.price_eur,
            compareAtEur: p.compare_at_eur,
            badges: p.badges && p.badges.length ? p.badges : (old.badges || []),
            comingSoon: p.stock_status === 'coming_soon',
            image: resolveImage(p.image, p.name, 1200, 1200) || old.image,
            shortDesc: p.short_desc || '',
            description: p.description || '',
            materials: old.materials || [],
            care: old.care || [],
            story: old.story || '',
            highlights: old.highlights || [],
            sizeGuide: old.sizeGuide || null,
            images: old.images || [],
            variants: variants
          };
        });
      }

      CW.dataSource = 'supabase';
      return true;
    }).catch(function (e) {
      /* Tiho pada na ugrađene podatke — posetilac ne treba da vidi grešku
         baze, a sajt i dalje radi. */
      console.warn('[CW] Baza nije dostupna, koristim ugrađeni sadržaj.', e && e.message);
      CW.dataSource = 'ugradjeni';
      return false;
    });
  }
})();
