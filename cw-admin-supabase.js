/* ==========================================================================
   WOLFPACK — ADMIN: ADAPTER ZA SUPABASE
   --------------------------------------------------------------------------
   Preuzima CW.api i preusmerava ga na bazu. Učitava se POSLE
   cw-admin-data.js, pa se svi ekrani panela ne menjaju — oni i dalje zovu
   iste metode, samo one sada idu do servera.

   Ako Supabase nije podešen ili je nedostupan, ostaje raniji adapter koji
   piše u pregledač, da panel nikad ne ostane bez ičega.

   Baza koristi snake_case, panel camelCase. Prevod je na jednom mestu
   (fromDb / toDb) da se ne rasipa po ekranima.
   ========================================================================== */

window.CW = window.CW || {};

(function () {
  'use strict';

  if (!CW.sb || !CW.sb.enabled) {
    console.info('[CW] Supabase nije podešen — panel radi lokalno.');
    return;
  }

  var api = CW.api;
  var local = {
    posts: api.posts, products: api.products,
    categories: api.categories, settings: api.settings,
    session: api.session
  };

  /* ====================================================================
     PREVOD IZMEĐU BAZE I PANELA
     ==================================================================== */

  function postFromDb(r) {
    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      excerpt: r.excerpt || '',
      content: r.content || '',
      image: r.image || '',
      imageAlt: r.image_alt || '',
      imageMobile: r.image_mobile || '',
      imageMobileAlt: r.image_mobile_alt || '',
      imageBanner: r.image_banner || '',
      imageBannerMobile: r.image_banner_mobile || '',
      categoryId: r.category_id || '',
      status: (r.status || 'draft').toUpperCase(),
      isFeatured: Boolean(r.is_featured),
      inHero: Boolean(r.in_hero),
      tags: r.tags || [],
      author: r.author || '',
      readMin: r.read_min || null,
      publishedAt: r.published_at,
      updatedAt: r.updated_at
    };
  }

  function postToDb(p) {
    var out = {};
    if (p.title !== undefined)      out.title = p.title;
    if (p.slug !== undefined)       out.slug = p.slug;
    if (p.excerpt !== undefined)    out.excerpt = p.excerpt || null;
    if (p.content !== undefined)    out.content = p.content || '';
    if (p.image !== undefined)      out.image = p.image || null;
    if (p.imageAlt !== undefined)   out.image_alt = p.imageAlt || null;
    if (p.imageMobile !== undefined)     out.image_mobile = p.imageMobile || null;
    if (p.imageMobileAlt !== undefined)  out.image_mobile_alt = p.imageMobileAlt || null;
    if (p.imageBanner !== undefined)        out.image_banner = p.imageBanner || null;
    if (p.imageBannerMobile !== undefined)  out.image_banner_mobile = p.imageBannerMobile || null;
    if (p.categoryId !== undefined) out.category_id = p.categoryId || null;
    if (p.status !== undefined)     out.status = String(p.status).toLowerCase();
    if (p.isFeatured !== undefined) out.is_featured = Boolean(p.isFeatured);
    if (p.inHero !== undefined)     out.in_hero = Boolean(p.inHero);
    if (p.tags !== undefined)       out.tags = p.tags || [];
    if (p.publishedAt !== undefined) out.published_at = p.publishedAt || null;
    return out;
  }

  function productFromDb(r) {
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      categoryId: r.category_id || '',
      collectionId: r.collection_id || '',
      price: r.price,
      compareAt: r.compare_at,
      priceEur: r.price_eur,
      compareAtEur: r.compare_at_eur,
      shortDesc: r.short_desc || '',
      description: r.description || '',
      image: r.image || '',
      badges: r.badges || [],
      stockStatus: (r.stock_status || 'in_stock').toUpperCase(),
      /* Panel radi sa jednim poljem „vrsta", baza sa tri kolone. */
      kind: r.shop === 'digital' ? 'DIGITAL' : 'MERCH',
      stock: r.stock || 0,
      sortOrder: r.sort_order || 0,
      featuredSlot: r.featured_slot || 0,
      isActive: r.is_active !== false,
      updatedAt: r.updated_at
    };
  }

  function productToDb(p) {
    var out = {};
    if (p.name !== undefined)         out.name = p.name;
    if (p.slug !== undefined)         out.slug = p.slug;
    if (p.categoryId !== undefined)   out.category_id = p.categoryId || null;
    if (p.price !== undefined)        out.price = p.price;
    if (p.compareAt !== undefined)    out.compare_at = p.compareAt || null;
    if (p.priceEur !== undefined)     out.price_eur = p.priceEur || null;
    if (p.compareAtEur !== undefined) out.compare_at_eur = p.compareAtEur || null;
    if (p.shortDesc !== undefined)    out.short_desc = p.shortDesc || null;
    if (p.description !== undefined)  out.description = p.description || null;
    if (p.image !== undefined)        out.image = p.image || null;
    if (p.stockStatus !== undefined)  out.stock_status = String(p.stockStatus).toLowerCase();
    if (p.stock !== undefined)        out.stock = p.stock;
    /* Digitalni proizvod nema lager u komadima — zaliha mu je broj
       slobodnih kodova, pa mu se `track_stock` gasi. */
    if (p.kind !== undefined) {
      var dig = p.kind === 'DIGITAL';
      out.shop = dig ? 'digital' : 'merch';
      out.fulfillment = dig ? 'digital' : 'physical';
      out.track_stock = !dig;
    }
    if (p.isActive !== undefined)     out.is_active = Boolean(p.isActive);
    if (p.sortOrder !== undefined)    out.sort_order = p.sortOrder;
    if (p.featuredSlot !== undefined) out.featured_slot = p.featuredSlot;
    return out;
  }

  /* ====================================================================
     SESIJA
     ==================================================================== */
  api.session = {
    get: function () {
      var s = CW.sb.session();
      if (!s || !s.user) return null;
      return { email: s.user.email, name: (s.user.email || '').split('@')[0] };
    },
    login: function (email, password) {
      return CW.sb.auth.signIn(email, password).then(function (s) {
        /* Prijava je samo pola posla. Panel je dosad puštao unutra svakog
           prijavljenog — i kupca — pa bi se otvorio, a onda bi RLS odbio
           svaki upis. Izgledalo je kao da panel ne radi.
           Zato se ovde pita baza je li taj nalog stvarno admin. */
        return CW.sb.rpc('is_admin').then(function (jeAdmin) {
          if (!jeAdmin) {
            CW.sb.auth.signOut();
            throw new Error('Ovaj nalog nema prava administratora.');
          }
          return { email: s.user.email, name: (s.user.email || '').split('@')[0] };
        });
      });
    },
    clear: function () { CW.sb.auth.signOut(); }
  };

  /* ====================================================================
     KOLEKCIJE
     ==================================================================== */

  function collection(table, fromDb, toDb, orderCol, desc) {
    return {
      all: function () {
        return CW.sb.from(table).select('*').order(orderCol, desc).get()
          .then(function (rows) { return (rows || []).map(fromDb); });
      },
      get: function (id) {
        return CW.sb.from(table).select('*').eq('id', id).limit(1).get()
          .then(function (rows) {
            if (!rows || !rows.length) throw new Error('Zapis nije pronađen.');
            return fromDb(rows[0]);
          });
      },
      /* Kad RLS ne pusti upis, PostgREST ne vraća grešku nego praznu listu
         — nula izmenjenih redova. Bez ove provere panel je na to pucao
         („Cannot read properties of undefined"), umesto da kaže šta je. */
      create: function (data) {
        return CW.sb.from(table).insert(toDb(data)).then(function (row) {
          if (!row) throw new Error('Zapis nije napravljen — ovaj nalog nema prava administratora. Odjavi se i prijavi admin nalogom.');
          return fromDb(row);
        });
      },
      update: function (id, patch) {
        return CW.sb.from(table).eq('id', id).update(toDb(patch)).then(function (row) {
          if (!row) throw new Error('Izmena nije sačuvana — ovaj nalog nema prava administratora ili zapis više ne postoji.');
          return fromDb(row);
        });
      },
      remove: function (id) {
        return CW.sb.from(table).eq('id', id).remove().then(function () { return true; });
      },
      /* Vraćanje na početno se ne radi iz pregledača — u bazi bi to značilo
         brisanje pravog sadržaja. Ostavljamo jasnu poruku umesto tihe
         radnje koja ne uradi ništa. */
      reset: function () {
        return Promise.reject(new Error(
          'Sadržaj je sada u bazi. Vraćanje na početno se radi kroz Supabase, ne odavde.'));
      }
    };
  }

  api.posts = collection('posts', postFromDb, postToDb, 'published_at', true);
  api.products = collection('products', productFromDb, productToDb, 'sort_order', false);

  /* Redosled proizvoda važi UNUTAR kategorije -- tako ga urednik i vidi u
     prodavnici. Kao i kod kategorija, ceo niz se prenumeriše od nule i
     upisuju se samo redovi kojima se broj promenio; nasleđeni sort_order je
     kod većine proizvoda nula, pa bi zamena dva broja vrtela u mestu. */
  api.products.reorder = function (id, smer) {
    return api.products.all().then(function (sve) {
      var meta = null;
      sve.forEach(function (p) { if (p.id === id) meta = p; });
      if (!meta) throw new Error('Proizvod nije pronađen.');

      var red = sve.filter(function (p) { return (p.categoryId || '') === (meta.categoryId || ''); })
                   .sort(function (a, b) {
                     return (a.sortOrder || 0) - (b.sortOrder || 0) ||
                            a.name.localeCompare(b.name, 'sr');
                   });

      var i = -1;
      red.forEach(function (p, idx) { if (p.id === id) i = idx; });
      var j = smer < 0 ? i - 1 : i + 1;
      if (j < 0 || j >= red.length) return null;

      red.splice(j, 0, red.splice(i, 1)[0]);

      return Promise.all(red.map(function (p, idx) {
        if ((p.sortOrder || 0) === idx) return null;
        return CW.sb.from('products').eq('id', p.id).update({ sort_order: idx });
      }).filter(Boolean));
    });
  };

  /* Premeštanje u drugu kategoriju iz spiska. Novi proizvod ide na kraj
     odredišne police, da ne upadne nasumično u sredinu. */
  api.products.setCategory = function (id, categoryId) {
    return api.products.all().then(function (sve) {
      var uCilju = sve.filter(function (p) { return p.categoryId === categoryId && p.id !== id; });
      var poslednji = uCilju.reduce(function (m, p) { return Math.max(m, p.sortOrder || 0); }, -1);
      return CW.sb.from('products').eq('id', id).update({
        category_id: categoryId || null,
        sort_order: poslednji + 1,
        updated_at: new Date().toISOString()
      });
    });
  };

  /* Kategorija pripada JEDNOJ prodavnici. To nije ukras nego uslov iz baze:
     `products_shop_matches_fulfillment` ne da da digitalan proizvod sedne u
     merch kategoriju. Zato panel prvo pita koja je prodavnica, pa onda naziv. */
  function catFromDb(r) {
    return {
      id: r.id, name: r.name, slug: r.slug,
      shop: r.shop,
      kind: r.shop === 'digital' ? 'DIGITAL' : 'MERCH',
      icon: r.icon || '', blurb: r.blurb || '',
      sortOrder: r.sort_order || 0,
      isActive: r.is_active !== false
    };
  }

  function catToDb(c) {
    var out = {};
    if (c.name !== undefined)      out.name = c.name;
    if (c.slug !== undefined)      out.slug = c.slug;
    if (c.icon !== undefined)      out.icon = c.icon || null;
    if (c.blurb !== undefined)     out.blurb = c.blurb || null;
    if (c.sortOrder !== undefined) out.sort_order = c.sortOrder;
    if (c.isActive !== undefined)  out.is_active = c.isActive;
    if (c.kind !== undefined)      out.shop = c.kind === 'DIGITAL' ? 'digital' : 'merch';
    if (c.shop !== undefined)      out.shop = c.shop;
    out.updated_at = new Date().toISOString();
    return out;
  }

  api.categories = {
    all: function () {
      return CW.sb.from('shop_categories').select('*').order('sort_order').get()
        .then(function (rows) { return (rows || []).map(catFromDb); });
    },

    get: function (id) {
      return CW.sb.from('shop_categories').select('*').eq('id', id).limit(1).get()
        .then(function (rows) {
          if (!rows || !rows.length) throw new Error('Kategorija nije pronađena.');
          return catFromDb(rows[0]);
        });
    },

    update: function (id, patch) {
      return CW.sb.from('shop_categories').eq('id', id).update(catToDb(patch))
        .then(function (row) {
          if (!row) throw new Error('Izmena nije sačuvana — ovaj nalog nema prava administratora.');
          return row;
        });
    },

    /* `id` i `slug` se izvode iz naziva, jer su u bazi tekst bez podrazumevane
       vrednosti. Oba su jedinstvena, pa ako naziv već postoji dodajemo broj —
       inače bi baza odbila upis porukom koju urednik ne ume da protumači. */
    create: function (data) {
      var naziv = String(data && data.name || '').trim();
      if (!naziv) return Promise.reject(new Error('Kategorija mora imati naziv.'));
      var kind = data.kind === 'DIGITAL' ? 'DIGITAL' : 'MERCH';

      return api.categories.all().then(function (sve) {
        var zauzeto = {};
        sve.forEach(function (c) { zauzeto[c.id] = true; zauzeto[c.slug] = true; });

        var osnova = CW.slug(naziv) || 'kategorija';
        var kljuc = osnova, n = 2;
        while (zauzeto[kljuc]) { kljuc = osnova + '-' + n; n++; }

        /* Nova kategorija ide na kraj SVOJE prodavnice, ne na kraj svega. */
        var uIstoj = sve.filter(function (c) { return c.kind === kind; });
        var poslednji = uIstoj.reduce(function (m, c) { return Math.max(m, c.sortOrder); }, -1);

        var red = catToDb({
          name: naziv, kind: kind,
          icon: data.icon || '', blurb: data.blurb || '',
          sortOrder: poslednji + 1, isActive: true
        });
        red.id = kljuc;
        red.slug = kljuc;

        return CW.sb.from('shop_categories').insert(red).then(function (row) {
          if (!row) throw new Error('Kategorija nije napravljena — ovaj nalog nema prava administratora.');
          return catFromDb(row);
        });
      });
    },

    /* Strani ključ je ON DELETE SET NULL: baza bi brisanje propustila, a
       proizvodi bi tiho ostali bez kategorije i ispali iz filtera. Zato se
       pitanje postavlja ovde, dok se još ima šta reći korisniku. */
    remove: function (id) {
      return api.products.all().then(function (prods) {
        var koliko = prods.filter(function (p) { return p.categoryId === id; }).length;
        if (koliko) {
          throw new Error('U kategoriji je ' + koliko + ' ' +
            CW.plural(koliko, 'proizvod', 'proizvoda', 'proizvoda') +
            '. Prvo ih premesti, pa onda briši kategoriju.');
        }
        return CW.sb.from('shop_categories').eq('id', id).remove();
      });
    },

    /* Pomeranje za jedno mesto gore/dole unutar svoje prodavnice. Umesto
       zamene dva broja, ceo niz se prenumeriše od nule i upisuju se samo
       redovi kojima se broj stvarno promenio — tako se iz nasleđenih
       vrednosti (0, 1, 2, 10, 11, 12, 13) izlazi bez sudara. */
    reorder: function (id, smer) {
      return api.categories.all().then(function (sve) {
        var meta = null;
        sve.forEach(function (c) { if (c.id === id) meta = c; });
        if (!meta) throw new Error('Kategorija nije pronađena.');

        var red = sve.filter(function (c) { return c.kind === meta.kind; })
                     .sort(function (a, b) { return a.sortOrder - b.sortOrder; });
        var i = -1;
        red.forEach(function (c, idx) { if (c.id === id) i = idx; });
        var j = smer < 0 ? i - 1 : i + 1;
        if (j < 0 || j >= red.length) return null;

        red.splice(j, 0, red.splice(i, 1)[0]);

        return Promise.all(red.map(function (c, idx) {
          if (c.sortOrder === idx) return null;
          return CW.sb.from('shop_categories').eq('id', c.id).update({ sort_order: idx });
        }).filter(Boolean));
      });
    },

    reset: function () { return Promise.reject(new Error('Nije dostupno kada je sadržaj u bazi.')); }
  };

  /* Newsletter. Spisak pretplatnika čita samo admin (RLS), a slanje ide kroz
     Edge funkciju `send-newsletter` — pregledač nema čime da pošalje mejl. */
  api.newsletter = {
    all: function () {
      return CW.sb.from('newsletter_subscribers')
        .select('email,status,source,created_at,confirmed_at')
        .order('created_at', true).get()
        .then(function (rows) { return rows || []; });
    },

    /* Proba ide na jednu adresu, pravo slanje svima koji su potvrdili.
       Oba prolaze kroz isti šablon, pa proba zaista pokazuje šta ljudi
       dobijaju. */
    /* `jeProba` je svoj argument, ne izvedeno iz toga da li je adresa upisana.
       Da se zaključuje iz adrese, proba sa praznim poljem (= pošalji meni)
       pretvorila bi se u slanje SVIMA — greška koja se ne može povući. */
    send: function (naslov, telo, jeProba, probaNa) {
      return CW.sb.mail({
        kind: jeProba ? 'test' : 'send',
        subject: naslov,
        body: telo,
        testTo: (jeProba && probaNa) ? probaNa : null
      }, 'send-newsletter', true);
    }
  };

  /* Rubrike bloga — panel ih do sada nije čitao iz baze. */
  api.postCategories = {
    all: function () {
      return CW.sb.from('post_categories').select('*').order('sort_order').get()
        .then(function (rows) { return rows || []; });
    }
  };

  /* ====================================================================
     PODEŠAVANJA — u bazi su ključ/vrednost, u panelu jedan objekat
     ==================================================================== */
  var SETTING_MAP = {
    siteName: 'site_name', tagline: 'tagline', discord: 'discord',
    instagram: 'instagram', email: 'email',
    shippingFlat: 'shipping_flat', freeShippingOver: 'free_shipping_over',
    shippingFlatEur: 'shipping_flat_eur', freeShippingOverEur: 'free_shipping_over_eur',
    defaultCurrency: 'default_currency'
  };
  var NUMERIC = ['shippingFlat', 'freeShippingOver', 'shippingFlatEur', 'freeShippingOverEur'];

  api.settings = {
    get: function () {
      return CW.sb.from('settings').select('*').get().then(function (rows) {
        var byKey = {};
        (rows || []).forEach(function (r) { byKey[r.key] = r.value; });
        var out = {};
        Object.keys(SETTING_MAP).forEach(function (k) {
          var v = byKey[SETTING_MAP[k]];
          out[k] = NUMERIC.indexOf(k) !== -1 ? (parseInt(v, 10) || 0) : (v || '');
        });
        return out;
      });
    },
    save: function (patch) {
      var rows = Object.keys(patch)
        .filter(function (k) { return SETTING_MAP[k]; })
        .map(function (k) { return { key: SETTING_MAP[k], value: String(patch[k]) }; });
      if (!rows.length) return Promise.resolve(patch);
      return CW.sb.from('settings').upsert(rows).then(function () { return patch; });
    }
  };


  /* ====================================================================
     PORUDŽBINE
     ==================================================================== */
  var ORDER_STATUS = {
    /* Mora se poklapati sa enumom order_status u bazi — nepoznat status
       baza odbija, pa čuvanje u panelu pada. */
    new:       'Nova',
    confirmed: 'Potvrđena',
    shipped:   'Poslata',
    picked_up: 'Preuzeta',
    cancelled: 'Otkazana'
  };
  var PAY_LABEL = { card: 'Kartica', cod: 'Pouzeće', bank: 'Uplata na račun' };

  api.orderStatuses = ORDER_STATUS;
  api.payLabels = PAY_LABEL;

  api.orders = {
    all: function () {
      return CW.sb.from('orders').select('*').order('created_at', true).get()
        .then(function (rows) { return rows || []; });
    },
    get: function (id) {
      return Promise.all([
        CW.sb.from('orders').select('*').eq('id', id).limit(1).get(),
        CW.sb.from('order_items').select('*').eq('order_id', id).get()
      ]).then(function (r) {
        if (!r[0] || !r[0].length) throw new Error('Porudžbina nije pronađena.');
        var o = r[0][0];
        o.items = r[1] || [];
        return o;
      });
    },
    update: function (id, patch) {
      return CW.sb.from('orders').eq('id', id).update(patch);
    },
    events: function (id) {
      return CW.sb.from('order_events').select('*').eq('order_id', id)
        .order('created_at', false).get().then(function (r) { return r || []; });
    }
  };

  /* ====================================================================
     NALOZI
     --------------------------------------------------------------------
     Pogled `customer_accounts` spaja profil kupca sa podacima o prijavi
     (poslednja prijava, način prijave) i sam proverava da je pozivalac
     admin — tabela `auth.users` ostaje zatvorena.
     ==================================================================== */
  api.customers = {
    all: function () {
      return CW.sb.from('customer_accounts').select('*').order('created_at', true).get()
        .then(function (rows) { return rows || []; });
    }
  };

  /* ====================================================================
     STEAM KODOVI
     --------------------------------------------------------------------
     Kod je roba: tabelu `product_keys` vidi samo admin (RLS). Kupcu kod
     stiže tek kad porudžbina bude plaćena — tada ga okidač u bazi sam
     dodeli prvoj porudžbini na redu.
     ==================================================================== */
  api.keys = {
    all: function () {
      return CW.sb.from('product_keys').select('*').order('created_at').get()
        .then(function (rows) { return rows || []; });
    },
    forProduct: function (productId) {
      return CW.sb.from('product_keys').select('*')
        .eq('product_id', productId).order('created_at').get()
        .then(function (rows) { return rows || []; });
    },
    forOrder: function (orderId) {
      return CW.sb.from('product_keys').select('*').eq('order_id', orderId).get()
        .then(function (rows) { return rows || []; });
    },
    /* Vraća koliko je ubačeno; duplikate baza odbija (jedinstven indeks
       na kodu), pa se isti kod ne može prodati dvaput. */
    add: function (productId, codes) {
      if (!codes.length) return Promise.resolve(0);
      return CW.sb.from('product_keys').insert(codes.map(function (c) {
        return { product_id: productId, code: c };
      })).then(function () { return codes.length; });
    },
    remove: function (id) {
      return CW.sb.from('product_keys').eq('id', id).remove();
    }
  };

  /* ====================================================================
     BROJEVI I IZVOZ
     ==================================================================== */
  api.stats = function () {
    return Promise.all([api.posts.all(), api.products.all(), api.orders.all()]).then(function (r) {
      var posts = r[0], products = r[1], orders = r[2];
      /* Brojevi o porudzbinama dolaze iz CW.adminOrderStats — isti racun i
         za lokalni sloj i za bazu. Ranije je `ordersNew` ovde brojao status
         `pending_payment`, koji vise ne postoji: statusi su new / confirmed /
         shipped / picked_up / cancelled. */
      return Object.assign({
        postsTotal: posts.length,
        postsDraft: posts.filter(function (p) { return p.status === 'DRAFT'; }).length,
        postsPublished: posts.filter(function (p) { return p.status === 'PUBLISHED'; }).length,
        productsTotal: products.length,
        productsActive: products.filter(function (p) { return p.isActive; }).length,
        lowStock: products.filter(function (p) {
          return p.stock > 0 && p.stock <= 5;
        }).length
      }, CW.adminOrderStats(orders));
    });
  };

  api.exportAll = function () {
    return Promise.all([api.posts.all(), api.products.all(), api.categories.all(), api.settings.get()])
      .then(function (r) {
        return {
          exportedAt: new Date().toISOString(), version: 2, source: 'supabase',
          posts: r[0], products: r[1], categories: r[2], settings: r[3]
        };
      });
  };

  api.importAll = function () {
    return Promise.reject(new Error(
      'Uvoz u bazu se radi kroz Supabase, da se ne pregazi sadržaj greškom.'));
  };

  api.upload = function (file, folder) { return CW.sb.upload(file, folder); };
  api.backend = 'supabase';
  api.persistent = true;

  console.info('[CW] Admin panel je povezan sa Supabase bazom.');
})();
