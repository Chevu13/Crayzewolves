/* ==========================================================================
   CRAZYWOLVES — ADMIN: SLOJ PODATAKA
   --------------------------------------------------------------------------
   Sve što admin panel čita i piše ide kroz CW.api. Metode su namerno
   asinhrone (vraćaju Promise) iako trenutni adapter radi sinhrono — kada
   se zameni pravim backendom, pozivi u ekranima ostaju nepromenjeni.

   Trenutni adapter: localStorage.
   To znači da izmene vidi SAMO taj pregledač, na tom računaru. Posetioci
   sajta ih ne vide. Za pravu redakciju treba backend — vidi ADMIN.md.

   Zamena adaptera je izmena jednog objekta na dnu ovog fajla.
   ========================================================================== */

window.CW = window.CW || {};

(function () {
  'use strict';

  var NS = 'cw.admin.';
  var SESSION_KEY = NS + 'session';

  /* ----------------------------------------------------------------------
     ADAPTER — localStorage sa ispravkom na memoriju
     Privatni prozor i neka podešavanja blokiraju localStorage; tada panel
     i dalje radi, samo se izmene gube pri osvežavanju.
     ---------------------------------------------------------------------- */
  var mem = {};
  var canPersist = (function () {
    try {
      window.localStorage.setItem(NS + 'probe', '1');
      window.localStorage.removeItem(NS + 'probe');
      return true;
    } catch (e) { return false; }
  })();

  function readRaw(key) {
    try { return canPersist ? window.localStorage.getItem(key) : (mem[key] || null); }
    catch (e) { return mem[key] || null; }
  }
  function writeRaw(key, val) {
    try { if (canPersist) window.localStorage.setItem(key, val); else mem[key] = val; }
    catch (e) { mem[key] = val; }
  }

  /* Kolekcija se učitava iz skladišta; ako je nema, uzima se početni
     sadržaj iz CW.data — tako panel odmah ima realne podatke za rad. */
  function load(name, seed) {
    var raw = readRaw(NS + name);
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { /* pokvaren zapis — pada na seed */ }
    }
    var copy = JSON.parse(JSON.stringify(seed || []));
    writeRaw(NS + name, JSON.stringify(copy));
    return copy;
  }
  function save(name, rows) {
    writeRaw(NS + name, JSON.stringify(rows));
    return rows;
  }

  function delay(v) {
    /* Kratko kašnjenje da se stanja učitavanja u ekranima stvarno vide i
       da se ponašanje poklopi sa mrežnim pozivom koji dolazi kasnije. */
    return new Promise(function (res) { setTimeout(function () { res(v); }, 120); });
  }

  function uid(prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function nowIso() { return new Date().toISOString(); }

  /* ----------------------------------------------------------------------
     POČETNI SADRŽAJ
     Vesti sa javnog sajta se prevode u oblik objave, da admin od prvog
     otvaranja uređuje ono što posetilac stvarno vidi.
     ---------------------------------------------------------------------- */
  function seedPosts() {
    var news = (CW.data && CW.data.news) || [];
    return news.map(function (n) {
      return {
        id: n.id,
        title: n.title,
        slug: n.id,
        excerpt: n.dek || '',
        /* Blokovi članka se spajaju u Markdown, jer editor radi sa tekstom.
           Tipovi blokova prate cw-data-community.js: p, h2, quote, list. */
        content: (n.body || [])
          .map(function (b) {
            if (b.type === 'h2')    return '## ' + (b.text || '');
            if (b.type === 'quote') return '> '  + (b.text || '');
            if (b.type === 'list')  return (b.items || []).map(function (x) { return '- ' + x; }).join('\n');
            return b.text || '';
          })
          .filter(Boolean)
          .join('\n\n'),
        image: n.image || null,
        categoryId: n.categoryId || '',
        author: n.author || '',
        readMin: n.readMin || null,
        tags: n.tags || [],
        status: 'PUBLISHED',
        isFeatured: Boolean(n.featured),
        /* Javni sajt čuva datume kao pomak u danima da bi demo uvek bio
           svež; ovde ga pretvaramo u stvarni datum, jer editor prikazuje
           i menja konkretan dan. */
        publishedAt: (typeof CW.resolveDate === 'function' && n.dayOffset != null)
          ? new Date(CW.resolveDate(n.dayOffset)).toISOString()
          : nowIso(),
        updatedAt: nowIso()
      };
    });
  }

  function seedProducts() {
    return ((CW.data && CW.data.products) || []).map(function (p) {
      var stock = (p.variants || []).reduce(function (s, v) { return s + (v.stock || 0); }, 0);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        categoryId: p.categoryId,
        collectionId: p.collectionId || '',
        price: p.price,
        compareAt: p.compareAt || null,
        shortDesc: p.shortDesc || '',
        description: p.description || '',
        image: p.image || null,
        badges: p.badges || [],
        /* `comingSoon` na javnom sajtu znači da se ne može kupiti; u panelu
           to prikazujemo kao stanje zaliha, jer je to isto pitanje. */
        stockStatus: p.comingSoon ? 'COMING_SOON' : (stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK'),
        stock: stock,
        isActive: !p.comingSoon,
        updatedAt: nowIso()
      };
    });
  }

  /* ----------------------------------------------------------------------
     JAVNI API
     ---------------------------------------------------------------------- */
  var api = {};

  api.persistent = canPersist;

  /* ---- sesija ---- */
  api.session = {
    get: function () {
      var raw = readRaw(SESSION_KEY);
      if (!raw) return null;
      try {
        var s = JSON.parse(raw);
        if (s.expires && Date.now() > s.expires) { api.session.clear(); return null; }
        return s;
      } catch (e) { return null; }
    },
    /* Demo provera. Pravi backend proverava lozinku na serveru i vraća
       kolačić — ovo ovde NIJE zaštita i ne sme se tako tretirati. */
    login: function (email, password) {
      if (!email || !password || password.length < 6) {
        return Promise.reject(new Error('Pogrešna imejl adresa ili lozinka.'));
      }
      var s = { email: email, name: email.split('@')[0], expires: Date.now() + 7 * 864e5 };
      writeRaw(SESSION_KEY, JSON.stringify(s));
      return delay(s);
    },
    clear: function () { writeRaw(SESSION_KEY, ''); }
  };

  /* ---- generička kolekcija ---- */
  function collection(name, seedFn, prefix) {
    var self = {
      all: function () { return delay(load(name, seedFn())); },

      get: function (id) {
        var rows = load(name, seedFn());
        var hit = rows.filter(function (r) { return r.id === id; })[0];
        return hit ? delay(hit) : Promise.reject(new Error('Zapis nije pronađen.'));
      },

      create: function (data) {
        var rows = load(name, seedFn());
        var row = Object.assign({ id: uid(prefix), updatedAt: nowIso() }, data);
        rows.unshift(row);
        save(name, rows);
        return delay(row);
      },

      update: function (id, patch) {
        var rows = load(name, seedFn());
        var i = -1;
        rows.forEach(function (r, k) { if (r.id === id) i = k; });
        if (i === -1) return Promise.reject(new Error('Zapis nije pronađen.'));
        rows[i] = Object.assign({}, rows[i], patch, { updatedAt: nowIso() });
        save(name, rows);
        return delay(rows[i]);
      },

      remove: function (id) {
        var rows = load(name, seedFn()).filter(function (r) { return r.id !== id; });
        save(name, rows);
        return delay(true);
      },

      /* Vraća kolekciju na početni sadržaj — korisno posle probe. */
      reset: function () {
        writeRaw(NS + name, '');
        return delay(load(name, seedFn()));
      }
    };
    return self;
  }

  api.posts      = collection('posts',      seedPosts,    'post');
  api.products   = collection('products',   seedProducts, 'prod');
  api.orders     = collection('orders',     function () { return (CW.data && CW.data.orders) || []; }, 'ord');
  api.categories = collection('categories', function () { return (CW.data && CW.data.categories) || []; }, 'cat');

  /* ---- podešavanja ---- */
  api.settings = {
    get: function () {
      var raw = readRaw(NS + 'settings');
      var base = {
        siteName: 'CrazyWolves Community',
        tagline: 'The hunt never ends.',
        discord: 'https://discord.gg/crazywolves',
        instagram: 'https://instagram.com/crazywolves.rs',
        email: 'info.crazywolves@gmail.com',
        shippingFlat: 390,
        freeShippingOver: 6000
      };
      if (!raw) return delay(base);
      try { return delay(Object.assign(base, JSON.parse(raw))); }
      catch (e) { return delay(base); }
    },
    save: function (patch) {
      return api.settings.get().then(function (cur) {
        var next = Object.assign({}, cur, patch);
        writeRaw(NS + 'settings', JSON.stringify(next));
        return next;
      });
    }
  };

  /* ---- brojevi za početni ekran ---- */

  /* ======================================================================
     BROJEVI O PORUDZBINAMA — jedno mesto za oba sloja podataka
     ----------------------------------------------------------------------
     Panel ih racuna isto bez obzira na to da li cita iz baze ili lokalno,
     pa je racun ovde a ne dvaput.

     „Danas" je od ponoci po lokalnom vremenu, ne poslednja 24 sata —
     vlasnik shopa gleda dan, ne prozor od 24h.

     Promet se sabira SAMO u dinarima. Sabrati dinare i evre u jedan broj
     znacilo bi izmisliti kurs i prikazati iznos koji ne postoji; evro
     porudzbine se broje posebno.
  ====================================================================== */
  CW.adminOrderStats = function (orders) {
    var list = orders || [];
    var ponoc = new Date(); ponoc.setHours(0, 0, 0, 0);
    var odKada = ponoc.getTime();

    function kada(o) {
      var d = new Date(o.created_at || o.createdAt || o.date || 0);
      return isNaN(d) ? 0 : d.getTime();
    }
    /* Otkazana porudzbina nije promet. */
    function seRacuna(o) {
      return ['cancelled', 'refunded'].indexOf(o.status) === -1;
    }
    function iznos(o) {
      return (o.currency || 'RSD') === 'RSD' ? (o.total || 0) : 0;
    }

    var danas = list.filter(function (o) { return kada(o) >= odKada; });

    return {
      ordersTotal:   list.length,
      ordersToday:   danas.length,
      revenueTotal:  list.filter(seRacuna).reduce(function (s, o) { return s + iznos(o); }, 0),
      revenueToday:  danas.filter(seRacuna).reduce(function (s, o) { return s + iznos(o); }, 0),
      ordersNew:     list.filter(function (o) { return o.status === 'new' || o.status === 'ORDERED'; }).length,
      ordersEur:     list.filter(function (o) { return o.currency === 'EUR'; }).length
    };
  };
  api.stats = function () {
    return Promise.all([api.posts.all(), api.products.all(), api.orders.all()])
      .then(function (r) {
        var posts = r[0], products = r[1], orders = r[2];
        return Object.assign({
          postsTotal:     posts.length,
          postsDraft:     posts.filter(function (p) { return p.status === 'DRAFT'; }).length,
          postsPublished: posts.filter(function (p) { return p.status === 'PUBLISHED'; }).length,
          productsTotal:  products.length,
          productsActive: products.filter(function (p) { return p.isActive !== false; }).length
        }, CW.adminOrderStats(orders));
      });
  };

  /* ---- izvoz / uvoz ----
     Dok nema backenda, ovo je način da se rad prenese na drugi računar
     ili preda programeru za ubacivanje u bazu. */
  api.exportAll = function () {
    return Promise.all([api.posts.all(), api.products.all(), api.categories.all(), api.settings.get()])
      .then(function (r) {
        return {
          exportedAt: nowIso(),
          version: 1,
          posts: r[0], products: r[1], categories: r[2], settings: r[3]
        };
      });
  };

  api.importAll = function (payload) {
    if (!payload || typeof payload !== 'object') return Promise.reject(new Error('Neispravan fajl.'));
    ['posts', 'products', 'categories'].forEach(function (k) {
      if (Array.isArray(payload[k])) save(k, payload[k]);
    });
    if (payload.settings) writeRaw(NS + 'settings', JSON.stringify(payload.settings));
    return delay(true);
  };

  api.uid = uid;
  CW.api = api;
})();
