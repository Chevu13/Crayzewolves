/* ==========================================================================
   CRAZYWOLVES — ADMIN: ADAPTER ZA SUPABASE
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
      categoryId: r.category_id || '',
      status: (r.status || 'draft').toUpperCase(),
      isFeatured: Boolean(r.is_featured),
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
    if (p.categoryId !== undefined) out.category_id = p.categoryId || null;
    if (p.status !== undefined)     out.status = String(p.status).toLowerCase();
    if (p.isFeatured !== undefined) out.is_featured = Boolean(p.isFeatured);
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
      stock: r.stock || 0,
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
    if (p.isActive !== undefined)     out.is_active = Boolean(p.isActive);
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
        return { email: s.user.email, name: (s.user.email || '').split('@')[0] };
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
      create: function (data) {
        return CW.sb.from(table).insert(toDb(data)).then(fromDb);
      },
      update: function (id, patch) {
        return CW.sb.from(table).eq('id', id).update(toDb(patch)).then(fromDb);
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

  api.categories = {
    all: function () {
      return CW.sb.from('shop_categories').select('*').order('sort_order').get()
        .then(function (rows) {
          return (rows || []).map(function (r) {
            return { id: r.id, name: r.name, slug: r.slug, icon: r.icon, blurb: r.blurb };
          });
        });
    },
    get: function (id) {
      return CW.sb.from('shop_categories').select('*').eq('id', id).limit(1).get()
        .then(function (rows) {
          if (!rows || !rows.length) throw new Error('Kategorija nije pronađena.');
          return rows[0];
        });
    },
    update: function (id, patch) {
      return CW.sb.from('shop_categories').eq('id', id).update(patch);
    },
    create: function () { return Promise.reject(new Error('Kategorije se dodaju kroz Supabase.')); },
    remove: function () { return Promise.reject(new Error('Kategorije se brišu kroz Supabase.')); },
    reset: function () { return Promise.reject(new Error('Nije dostupno kada je sadržaj u bazi.')); }
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
    pending_payment: 'Čeka uplatu',
    confirmed:       'Potvrđena',
    processing:      'U pripremi',
    shipped:         'Poslata',
    delivered:       'Isporučena',
    cancelled:       'Otkazana',
    refunded:        'Vraćen novac'
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
