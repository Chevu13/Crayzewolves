/* ==========================================================================
   CRAZYWOLVES — ADMIN: EKRANI
   --------------------------------------------------------------------------
   Panel deli dizajn-tokene sa javnim sajtom (cw-theme.css), ali ima svoj
   raspored: bočna navigacija + radna površina, bez zaglavlja i podnožja
   javnog sajta.

   Svaki ekran je funkcija koja vraća HTML. Podaci se dovlače kroz CW.api
   posle iscrtavanja, pa svaki ekran ima i stanje učitavanja.
   ========================================================================== */

window.CW = window.CW || {};
CW.admin = CW.admin || {};

(function () {
  'use strict';

  var A = CW.admin;

  /* ======================================================================
     ZAJEDNIČKI DELOVI
     ====================================================================== */

  var NAV = [
    { path: '/admin',            icon: 'grid',     label: 'Pregled' },
    { path: '/admin/objave',     icon: 'file',     label: 'Objave' },
    { path: '/admin/porudzbine', icon: 'package',  label: 'Porudžbine' },
    { path: '/admin/proizvodi',  icon: 'tag',      label: 'Proizvodi' },
    { path: '/admin/kategorije', icon: 'folder',   label: 'Kategorije' },
    { path: '/admin/podesavanja',icon: 'settings', label: 'Podešavanja' }
  ];

  A.shell = function (activePath, title, body, actions) {
    var s = CW.api.session.get();
    return '' +
      '<div class="adm">' +
        '<aside class="adm__side" id="adm-side">' +
          '<div class="adm__brand">' +
            CW.logoMark(30) +
            '<div>' +
              '<div class="adm__brand-name">CrazyWolves</div>' +
              '<div class="adm__brand-sub">Admin panel</div>' +
            '</div>' +
          '</div>' +

          '<nav class="adm__nav" aria-label="Administracija">' +
            NAV.map(function (n) {
              var on = activePath === n.path;
              return '<a class="adm__link' + (on ? ' is-active' : '') + '" href="#' + n.path + '"' +
                (on ? ' aria-current="page"' : '') + '>' +
                CW.icon(n.icon, 16) + '<span>' + n.label + '</span></a>';
            }).join('') +
          '</nav>' +

          '<div class="adm__side-foot">' +
            '<a class="adm__link adm__link--quiet" href="#/" target="_blank" rel="noopener">' +
              CW.icon('external', 15) + '<span>Otvori sajt</span></a>' +
            '<div class="adm__user">' +
              '<div class="adm__avatar">' + CW.esc((s && s.email ? s.email[0] : '?').toUpperCase()) + '</div>' +
              '<div class="adm__user-text">' +
                '<div class="adm__user-name">' + CW.esc(s ? s.email : '—') + '</div>' +
                '<div class="adm__user-role">Administrator</div>' +
              '</div>' +
            '</div>' +
            '<button class="adm__logout" type="button" data-act="adm-logout">' +
              CW.icon('logout', 13) + ' Odjava</button>' +
          '</div>' +
        '</aside>' +

        '<div class="adm__main">' +
          '<div class="adm__topbar">' +
            '<button class="adm__burger" type="button" data-act="adm-toggle-nav" aria-label="Meni">' +
              CW.icon('menu', 20) + '</button>' +
            '<h1 class="adm__title">' + CW.esc(title) + '</h1>' +
            '<div class="adm__actions">' + (actions || '') + '</div>' +
          '</div>' +
          '<div class="adm__body">' + body + '</div>' +
        '</div>' +
      '</div>';
  };

  /** Traka sa brojem — koristi se na početnom ekranu. */
  function statCard(label, value, hint, tone) {
    return '<div class="adm-stat' + (tone ? ' adm-stat--' + tone : '') + '">' +
      '<div class="adm-stat__label">' + CW.esc(label) + '</div>' +
      '<div class="adm-stat__value">' + CW.esc(String(value)) + '</div>' +
      (hint ? '<div class="adm-stat__hint">' + CW.esc(hint) + '</div>' : '') +
    '</div>';
  }

  function skeletonRows(n) {
    return '<div class="adm-skel">' + CW.times(n || 5, function () {
      return '<div class="adm-skel__row"></div>';
    }) + '</div>';
  }

  function empty(icon, text, action) {
    return '<div class="adm-empty">' + CW.icon(icon || 'file', 26) +
      '<p>' + CW.esc(text) + '</p>' + (action || '') + '</div>';
  }

  A.statusPill = function (status) {
    var map = {
      PUBLISHED:    ['Objavljeno', 'ok'],
      DRAFT:        ['Nacrt', 'neutral'],
      ARCHIVED:     ['Arhivirano', 'warn'],
      IN_STOCK:     ['Na stanju', 'ok'],
      OUT_OF_STOCK: ['Nema na stanju', 'bad'],
      COMING_SOON:  ['U pripremi', 'warn']
    };
    var m = map[status] || [status, 'neutral'];
    /* Uz boju ide i reč — status se nikad ne saopštava samo bojom. */
    return '<span class="adm-pill adm-pill--' + m[1] + '">' + CW.esc(m[0]) + '</span>';
  };

  /* ======================================================================
     PRIJAVA
     ====================================================================== */
  A.login = function () {
    return '' +
      '<div class="adm-login">' +
        '<div class="adm-login__card brackets">' +
          '<div class="adm-login__brand">' + CW.logoMark(44) + '</div>' +
          '<h1 class="t-h2 text-center">Admin panel</h1>' +
          '<p class="t-sm text-center mt-2">Prijava je potrebna za uređivanje sadržaja.</p>' +

          '<form class="stack stack-3 mt-4" data-form="adm-login" novalidate>' +
            '<div class="field">' +
              '<label class="field__label" for="adm-email">Imejl adresa</label>' +
              '<input class="input" id="adm-email" name="email" type="email" autocomplete="username" required>' +
              '<p class="field__error" data-error-for="email"></p>' +
            '</div>' +
            '<div class="field">' +
              '<label class="field__label" for="adm-pass">Lozinka</label>' +
              '<input class="input" id="adm-pass" name="password" type="password" autocomplete="current-password" required>' +
              '<p class="field__error" data-error-for="password"></p>' +
            '</div>' +
            '<button class="btn btn--primary btn--lg full" type="submit">Prijavi se</button>' +
          '</form>' +

          '<p class="adm-login__note">' +
            'Demo panel — prolazi svaka ispravna imejl adresa i lozinka od šest ili više znakova. ' +
            'Prava provera pripada backendu.' +
          '</p>' +
        '</div>' +
      '</div>';
  };

  /* ======================================================================
     PREGLED
     ====================================================================== */
  A.dashboard = function () {
    CW.onMount(function () {
      CW.api.stats().then(function (s) {
        var host = document.getElementById('adm-stats');
        if (!host) return;
        host.innerHTML =
          statCard('Objave', s.postsTotal, s.postsDraft + ' u nacrtu') +
          statCard('Objavljeno', s.postsPublished, 'vidljivo na sajtu', 'ok') +
          statCard('Proizvodi', s.productsTotal, s.productsActive + ' aktivnih') +
          statCard('Porudžbine', s.ordersTotal,
                   s.ordersTotal ? s.ordersNew + ' za obradu' : 'nema još nijedne',
                   s.ordersNew ? 'ok' : '') +
          statCard('Promet', CW.money(s.revenue || 0),
                   s.lowStock ? s.lowStock + ' proizvoda pri kraju' : 'sve na stanju');
      });

      CW.api.posts.all().then(function (rows) {
        var host = document.getElementById('adm-recent');
        if (!host) return;
        var recent = rows.slice(0, 5);
        host.innerHTML = recent.length
          ? recent.map(function (p) {
              return '<a class="adm-row" href="#/admin/objave/' + encodeURIComponent(p.id) + '">' +
                '<div class="adm-row__icon">' + CW.icon('file', 15) + '</div>' +
                '<div class="adm-row__main">' +
                  '<div class="adm-row__title">' + CW.esc(p.title) + '</div>' +
                  '<div class="adm-row__meta">' + CW.fmtDate(p.publishedAt || p.updatedAt) + '</div>' +
                '</div>' +
                A.statusPill(p.status) +
              '</a>';
            }).join('')
          : empty('file', 'Još nema objava.');
      });
    });

    return A.shell('/admin', 'Pregled',
      '<div class="adm-grid adm-grid--stats" id="adm-stats">' + skeletonRows(4) + '</div>' +

      '<div class="adm-panel mt-4">' +
        '<div class="adm-panel__head">' +
          '<h2 class="t-h3">Poslednje objave</h2>' +
          '<a class="link-arrow" href="#/admin/objave">Sve objave ' + CW.icon('arrow-right', 14) + '</a>' +
        '</div>' +
        '<div id="adm-recent">' + skeletonRows(4) + '</div>' +
      '</div>' +

      '<div class="adm-panel mt-4">' +
        '<div class="adm-panel__head"><h2 class="t-h3">Brze radnje</h2></div>' +
        '<div class="adm-quick">' +
          '<a class="adm-quick__item" href="#/admin/objave/nova">' +
            CW.icon('file', 18) + '<span>Nova objava</span></a>' +
          '<a class="adm-quick__item" href="#/admin/porudzbine">' +
            CW.icon('package', 18) + '<span>Porudžbine</span></a>' +
          '<a class="adm-quick__item" href="#/admin/proizvodi/novi">' +
            CW.icon('tag', 18) + '<span>Novi proizvod</span></a>' +
        '</div>' +
      '</div>'
    );
  };

  /* ======================================================================
     OBJAVE — lista
     ====================================================================== */
  A.posts = function (ctx) {
    var q = (ctx && ctx.query) || {};

    CW.onMount(function () {
      CW.api.posts.all().then(function (rows) {
        A._postRows = rows;
        renderPostList();
      });

      var search = document.getElementById('adm-post-search');
      if (search) search.addEventListener('input', CW.debounce(renderPostList, 200));
      CW.qsa('[data-post-filter]').forEach(function (el) {
        el.addEventListener('change', renderPostList);
      });
    });

    function renderPostList() {
      var host = document.getElementById('adm-post-list');
      if (!host || !A._postRows) return;

      var term = (document.getElementById('adm-post-search') || {}).value || '';
      var status = (document.querySelector('[data-post-filter="status"]') || {}).value || '';

      var rows = A._postRows.filter(function (p) {
        if (status && p.status !== status) return false;
        if (term) {
          var hay = (p.title + ' ' + (p.excerpt || '')).toLowerCase();
          if (hay.indexOf(term.toLowerCase()) === -1) return false;
        }
        return true;
      });

      var counter = document.getElementById('adm-post-count');
      if (counter) {
        counter.textContent = rows.length + ' ' +
          CW.plural(rows.length, 'objava', 'objave', 'objava');
      }

      host.innerHTML = rows.length
        ? rows.map(function (p) {
            return '<a class="adm-row" href="#/admin/objave/' + encodeURIComponent(p.id) + '">' +
              '<div class="adm-row__icon">' + CW.icon('file', 15) + '</div>' +
              '<div class="adm-row__main">' +
                '<div class="adm-row__title">' + CW.esc(p.title) +
                  (p.isFeatured ? ' <span class="adm-star" title="Istaknuto">' + CW.icon('star', 12) + '</span>' : '') +
                '</div>' +
                '<div class="adm-row__meta">' + CW.fmtDate(p.publishedAt || p.updatedAt) + '</div>' +
              '</div>' +
              A.statusPill(p.status) +
            '</a>';
          }).join('')
        : empty('search', term || type || status
            ? 'Nema objava za ove filtere.'
            : 'Još nema nijedne objave.',
            '<a class="btn btn--primary btn--sm mt-3" href="#/admin/objave/nova">Napiši prvu</a>');
    }

    return A.shell('/admin/objave', 'Objave',
      '<div class="adm-toolbar">' +
        '<div class="adm-search">' +
          CW.icon('search', 15) +
          '<input class="input" id="adm-post-search" type="search" placeholder="Pretraži objave" ' +
            'aria-label="Pretraži objave" value="' + CW.esc(q.q || '') + '">' +
        '</div>' +
        '<select class="input" data-post-filter="status" aria-label="Status">' +
          '<option value="">Svi statusi</option>' +
          '<option value="PUBLISHED">Objavljeno</option>' +
          '<option value="DRAFT">Nacrt</option>' +
          '<option value="ARCHIVED">Arhivirano</option>' +
        '</select>' +
      '</div>' +
      '<p class="t-sm mt-2" id="adm-post-count">&nbsp;</p>' +
      '<div class="adm-panel mt-2"><div id="adm-post-list">' + skeletonRows(5) + '</div></div>',

      '<a class="btn btn--primary btn--sm" href="#/admin/objave/nova">' +
        CW.icon('plus', 15) + ' Nova objava</a>'
    );
  };

  /* ======================================================================
     OBJAVA — editor (nova i izmena dele isti obrazac)
     ====================================================================== */
  A.postEdit = function (ctx) {
    var id = ctx.params.id;
    var isNew = !id || id === 'nova';

    CW.onMount(function () {
      if (isNew) {
        fillForm({
          title: '', excerpt: '', content: '', image: '',
          categoryId: '', tags: [], status: 'DRAFT', isFeatured: false
        });
        return;
      }
      CW.api.posts.get(id).then(fillForm).catch(function () {
        CW.toast('Objava nije pronađena.', 'error');
        window.location.hash = '#/admin/objave';
      });
    });

    function fillForm(p) {
      A._editing = p;
      var f = document.querySelector('[data-form="adm-post"]');
      if (!f) return;
      f.elements.title.value = p.title || '';
      f.elements.excerpt.value = p.excerpt || '';
      f.elements.content.value = p.content || '';
      f.elements.categoryId.value = p.categoryId || '';
      f.elements.status.value = p.status || 'DRAFT';
      f.elements.tags.value = (p.tags || []).join(', ');
      f.elements.isFeatured.checked = Boolean(p.isFeatured);
      CW.adm.setImage('adm-post-image', p.image || '');
      updatePreview();
      var del = document.getElementById('adm-post-delete');
      if (del) del.classList.toggle('hidden', isNew);
    }

    function updatePreview() {
      var out = document.getElementById('adm-post-preview');
      var src = document.querySelector('[name="content"]');
      if (out && src) out.innerHTML = CW.md(src.value);
    }

    /* Pregled slike više ne crta ovaj ekran — birač (cw-admin-media.js) se
       sam iscrtava kad mu se promeni vrednost. Ostaje samo upis vrednosti. */
    function updateImagePreview() {
      CW.adm.setImage('adm-post-image', (document.getElementById('adm-post-image') || {}).value);
    }

    A._updatePreview = updatePreview;
    A._updateImagePreview = updateImagePreview;

    var catOptions = ((CW.data.newsCategories) || []).map(function (c) {
      return '<option value="' + CW.esc(c.id) + '">' + CW.esc(c.name) + '</option>';
    }).join('');

    return A.shell('/admin/objave', isNew ? 'Nova objava' : 'Izmena objave',
      '<form class="adm-editor" data-form="adm-post" novalidate>' +
        '<div class="adm-editor__main">' +

          '<div class="adm-panel">' +
            '<div class="field">' +
              '<label class="field__label" for="adm-title">Naslov *</label>' +
              '<input class="input input--lg" id="adm-title" name="title" required ' +
                'placeholder="Nova era za CrazyWolves">' +
              '<p class="field__error" data-error-for="title"></p>' +
            '</div>' +
            '<div class="field mt-3">' +
              '<label class="field__label" for="adm-excerpt">Uvod</label>' +
              '<textarea class="input" id="adm-excerpt" name="excerpt" rows="2" ' +
                'placeholder="Ostavi prazno — popuniće se iz teksta."></textarea>' +
            '</div>' +
          '</div>' +

          '<div class="adm-panel mt-3">' +
            '<div class="adm-panel__head">' +
              '<label class="field__label" for="adm-content">Tekst *</label>' +
              '<div class="adm-tabs">' +
                '<button class="adm-tab is-active" type="button" data-editor-tab="write">Pisanje</button>' +
                '<button class="adm-tab" type="button" data-editor-tab="preview">Pregled</button>' +
              '</div>' +
            '</div>' +
            '<p class="t-xs mb-2">Markdown: ## naslov, **podebljano**, *kurziv*, - lista, &gt; citat, [tekst](adresa)</p>' +
            '<textarea class="input adm-code" id="adm-content" name="content" rows="18" ' +
              'data-editor-pane="write" placeholder="Piši ovde…"></textarea>' +
            '<div class="adm-preview hidden" id="adm-post-preview" data-editor-pane="preview"></div>' +
            '<p class="field__error" data-error-for="content"></p>' +
          '</div>' +
        '</div>' +

        '<aside class="adm-editor__side">' +
          '<div class="adm-panel">' +
            '<div class="field">' +
              '<label class="field__label" for="adm-status">Status</label>' +
              '<select class="input" id="adm-status" name="status">' +
                '<option value="DRAFT">Nacrt</option>' +
                '<option value="PUBLISHED">Objavljeno</option>' +
                '<option value="ARCHIVED">Arhivirano</option>' +
              '</select>' +
            '</div>' +

            '<div class="field mt-3">' +
              '<label class="field__label" for="adm-cat">Rubrika</label>' +
              '<select class="input" id="adm-cat" name="categoryId">' +
                '<option value="">Bez rubrike</option>' + catOptions +
              '</select>' +
            '</div>' +

            '<label class="adm-check mt-3">' +
              '<input type="checkbox" name="isFeatured"> <span>Istaknuto na sajtu</span>' +
            '</label>' +
          '</div>' +

          '<div class="adm-panel mt-3">' +
            '<span class="field__label">Naslovna slika</span>' +
            CW.adm.imagePicker({
              id: 'adm-post-image',
              name: 'image',
              groups: ['blog', 'brend', 'discord'],
              ratio: '3 / 2',
              recW: 1200, recH: 800, ratioLabel: 'odnos 3:2',
              note: 'Ako nemaš svoju sliku, uzmi jedan od šablona iz biblioteke.'
            }) +
          '</div>' +

          '<div class="adm-panel mt-3">' +
            '<label class="field__label" for="adm-tags">Oznake</label>' +
            '<input class="input" id="adm-tags" name="tags" placeholder="discord, cs2, shop">' +
            '<p class="t-xs mt-1">Razdvoji zarezom.</p>' +
          '</div>' +

          '<div class="adm-editor__buttons">' +
            '<button class="btn btn--primary btn--lg full" type="submit" data-save="stay">Sačuvaj</button>' +
            '<button class="btn btn--secondary full mt-2" type="button" data-save="publish">Sačuvaj i objavi</button>' +
            '<button class="btn btn--ghost full mt-2 hidden" type="button" id="adm-post-delete" ' +
              'data-act="adm-post-delete">' + CW.icon('trash', 14) + ' Obriši objavu</button>' +
          '</div>' +
        '</aside>' +
      '</form>',

      '<a class="btn btn--ghost btn--sm" href="#/admin/objave">' + CW.icon('arrow-left', 15) + ' Nazad</a>'
    );
  };

  /* ======================================================================
     PROIZVODI
     ====================================================================== */
  A.products = function () {
    CW.onMount(function () {
      Promise.all([CW.api.products.all(), CW.api.categories.all()]).then(function (r) {
        var rows = r[0], cats = r[1];
        var host = document.getElementById('adm-prod-list');
        if (!host) return;
        host.innerHTML = rows.length
          ? rows.map(function (p) {
              var cat = cats.filter(function (c) { return c.id === p.categoryId; })[0];
              return '<a class="adm-row" href="#/admin/proizvodi/' + encodeURIComponent(p.id) + '">' +
                '<div class="adm-row__thumb">' +
                  (p.image && CW.IMAGES[p.image]
                    ? CW.img(p.image, { ratio: '1 / 1', ph: p.name })
                    : '<div class="ph ph--1x1 ph--product" data-ph=""></div>') +
                '</div>' +
                '<div class="adm-row__main">' +
                  '<div class="adm-row__title">' + CW.esc(p.name) + '</div>' +
                  '<div class="adm-row__meta">' + CW.esc(cat ? cat.name : 'Bez kategorije') +
                    ' · ' + CW.money(p.price) + '</div>' +
                '</div>' +
                A.statusPill(p.stockStatus) +
              '</a>';
            }).join('')
          : empty('tag', 'Još nema proizvoda.');
      });
    });

    return A.shell('/admin/proizvodi', 'Proizvodi',
      '<div class="adm-panel"><div id="adm-prod-list">' + skeletonRows(4) + '</div></div>',
      '<a class="btn btn--primary btn--sm" href="#/admin/proizvodi/novi">' +
        CW.icon('plus', 15) + ' Novi proizvod</a>'
    );
  };

  A.productEdit = function (ctx) {
    var id = ctx.params.id;
    var isNew = !id || id === 'novi';

    CW.onMount(function () {
      var catSel = document.getElementById('adm-prod-cat');
      CW.api.categories.all().then(function (cats) {
        if (catSel) {
          catSel.innerHTML = cats.map(function (c) {
            return '<option value="' + CW.esc(c.id) + '">' + CW.esc(c.name) + '</option>';
          }).join('');
        }
        if (isNew) { A._editing = null; return; }
        CW.api.products.get(id).then(function (p) {
          A._editing = p;
          var f = document.querySelector('[data-form="adm-product"]');
          if (!f) return;
          f.elements.name.value = p.name || '';
          /* U bazi su pare i centi; korisniku prikazujemo cele iznose. */
          f.elements.price.value = p.price ? (p.price / 100) : '';
          f.elements.compareAt.value = p.compareAt ? (p.compareAt / 100) : '';
          f.elements.priceEur.value = p.priceEur ? (p.priceEur / 100) : '';
          f.elements.compareAtEur.value = p.compareAtEur ? (p.compareAtEur / 100) : '';
          f.elements.shortDesc.value = p.shortDesc || '';
          f.elements.description.value = p.description || '';
          f.elements.categoryId.value = p.categoryId || '';
          f.elements.stockStatus.value = p.stockStatus || 'IN_STOCK';
          CW.adm.setImage('adm-prod-image', p.image || '');
          var del = document.getElementById('adm-prod-delete');
          if (del) del.classList.remove('hidden');
        }).catch(function () {
          CW.toast('Proizvod nije pronađen.', 'error');
          window.location.hash = '#/admin/proizvodi';
        });
      });
    });

    return A.shell('/admin/proizvodi', isNew ? 'Novi proizvod' : 'Izmena proizvoda',
      '<form class="adm-editor" data-form="adm-product" novalidate>' +
        '<div class="adm-editor__main">' +
          '<div class="adm-panel">' +
            '<div class="field">' +
              '<label class="field__label" for="adm-prod-name">Naziv *</label>' +
              '<input class="input input--lg" id="adm-prod-name" name="name" required>' +
              '<p class="field__error" data-error-for="name"></p>' +
            '</div>' +
            '<div class="adm-cols mt-3">' +
              '<div class="field">' +
                '<label class="field__label" for="adm-prod-price">Cena u dinarima *</label>' +
                '<div class="adm-money"><input class="input" id="adm-prod-price" name="price" ' +
                  'type="number" min="0" step="1" required><span>RSD</span></div>' +
                '<p class="field__error" data-error-for="price"></p>' +
              '</div>' +
              '<div class="field">' +
                '<label class="field__label" for="adm-prod-compare">Stara cena (dinari)</label>' +
                '<div class="adm-money"><input class="input" id="adm-prod-compare" ' +
                  'name="compareAt" type="number" min="0" step="1"><span>RSD</span></div>' +
              '</div>' +
            '</div>' +

            /* Evro se upisuje ručno, ne računa se iz dinara — cena po zemlji
               sme da se razlikuje iz komercijalnih razloga. */
            '<div class="adm-cols mt-3">' +
              '<div class="field">' +
                '<label class="field__label" for="adm-prod-price-eur">Cena u evrima</label>' +
                '<div class="adm-money"><input class="input" id="adm-prod-price-eur" ' +
                  'name="priceEur" type="number" min="0" step="0.01"><span>EUR</span></div>' +
                '<p class="t-xs mt-1" id="adm-eur-hint">&nbsp;</p>' +
              '</div>' +
              '<div class="field">' +
                '<label class="field__label" for="adm-prod-compare-eur">Stara cena (evri)</label>' +
                '<div class="adm-money"><input class="input" id="adm-prod-compare-eur" ' +
                  'name="compareAtEur" type="number" min="0" step="0.01"><span>EUR</span></div>' +
              '</div>' +
            '</div>' +
            '<p class="t-xs mt-2">Evro pokriva Hrvatsku, Sloveniju, Crnu Goru i Kosovo. ' +
              'Ako ostane prazno, sajt preračuna iz dinarske cene.</p>' +
            '<div class="field mt-3">' +
              '<label class="field__label" for="adm-prod-short">Kratak opis</label>' +
              '<textarea class="input" id="adm-prod-short" name="shortDesc" rows="2"></textarea>' +
            '</div>' +
            '<div class="field mt-3">' +
              '<label class="field__label" for="adm-prod-desc">Opis</label>' +
              '<textarea class="input" id="adm-prod-desc" name="description" rows="8"></textarea>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<aside class="adm-editor__side">' +
          '<div class="adm-panel">' +
            '<div class="field">' +
              '<label class="field__label" for="adm-prod-cat">Kategorija</label>' +
              '<select class="input" id="adm-prod-cat" name="categoryId"></select>' +
            '</div>' +
            '<div class="field mt-3">' +
              '<label class="field__label" for="adm-prod-stock">Dostupnost</label>' +
              '<select class="input" id="adm-prod-stock" name="stockStatus">' +
                '<option value="IN_STOCK">Na stanju</option>' +
                '<option value="OUT_OF_STOCK">Nema na stanju</option>' +
                '<option value="COMING_SOON">U pripremi</option>' +
              '</select>' +
            '</div>' +
          '</div>' +

          '<div class="adm-panel mt-3">' +
            '<span class="field__label">Slika</span>' +
            CW.adm.imagePicker({
              id: 'adm-prod-image',
              name: 'image',
              groups: ['proizvod', 'brend'],
              ratio: '1 / 1',
              recW: 1200, recH: 1200, ratioLabel: 'kvadrat 1:1',
              note: 'Kartice proizvoda su kvadratne — široka slika se u njima svede na traku.'
            }) +
          '</div>' +

          '<div class="adm-editor__buttons">' +
            '<button class="btn btn--primary btn--lg full" type="submit">Sačuvaj</button>' +
            '<button class="btn btn--ghost full mt-2 hidden" type="button" id="adm-prod-delete" ' +
              'data-act="adm-prod-delete">' + CW.icon('trash', 14) + ' Obriši proizvod</button>' +
          '</div>' +
        '</aside>' +
      '</form>',

      '<a class="btn btn--ghost btn--sm" href="#/admin/proizvodi">' + CW.icon('arrow-left', 15) + ' Nazad</a>'
    );
  };

  /* ======================================================================
     KATEGORIJE
     ====================================================================== */
  A.categories = function () {
    CW.onMount(function () {
      Promise.all([CW.api.categories.all(), CW.api.products.all()]).then(function (r) {
        var cats = r[0], prods = r[1];
        var host = document.getElementById('adm-cat-list');
        if (!host) return;
        host.innerHTML = cats.length
          ? cats.map(function (c) {
              var n = prods.filter(function (p) { return p.categoryId === c.id; }).length;
              return '<div class="adm-row adm-row--static">' +
                '<div class="adm-row__icon">' + CW.icon(c.icon || 'folder', 15) + '</div>' +
                '<div class="adm-row__main">' +
                  '<div class="adm-row__title">' + CW.esc(c.name) + '</div>' +
                  '<div class="adm-row__meta">' + n + ' ' +
                    CW.plural(n, 'proizvod', 'proizvoda', 'proizvoda') + '</div>' +
                '</div>' +
                '<button class="btn btn--ghost btn--sm" type="button" ' +
                  'data-act="adm-cat-rename" data-id="' + CW.esc(c.id) + '">Preimenuj</button>' +
              '</div>';
            }).join('')
          : empty('folder', 'Nema kategorija.');
      });
    });

    return A.shell('/admin/kategorije', 'Kategorije',
      '<div class="adm-panel"><div id="adm-cat-list">' + skeletonRows(4) + '</div></div>' +
      '<p class="t-sm mt-3">Kategorije se koriste i u shopu i u filterima. ' +
        'Brisanje kategorije sa proizvodima nije dozvoljeno.</p>'
    );
  };

  /* ======================================================================
     PODEŠAVANJA
     ====================================================================== */
  A.settings = function () {
    CW.onMount(function () {
      CW.api.settings.get().then(function (s) {
        var f = document.querySelector('[data-form="adm-settings"]');
        if (!f) return;
        Object.keys(s).forEach(function (k) {
          if (f.elements[k]) f.elements[k].value = s[k];
        });
      });
    });

    return A.shell('/admin/podesavanja', 'Podešavanja',
      '<form class="adm-panel" data-form="adm-settings" novalidate>' +
        '<h2 class="t-h3">Sajt</h2>' +
        '<div class="adm-cols mt-3">' +
          '<div class="field">' +
            '<label class="field__label" for="set-name">Naziv</label>' +
            '<input class="input" id="set-name" name="siteName">' +
          '</div>' +
          '<div class="field">' +
            '<label class="field__label" for="set-tag">Slogan</label>' +
            '<input class="input" id="set-tag" name="tagline">' +
          '</div>' +
        '</div>' +

        '<h2 class="t-h3 mt-4">Kontakt i mreže</h2>' +
        '<div class="adm-cols mt-3">' +
          '<div class="field">' +
            '<label class="field__label" for="set-discord">Discord</label>' +
            '<input class="input" id="set-discord" name="discord">' +
          '</div>' +
          '<div class="field">' +
            '<label class="field__label" for="set-ig">Instagram</label>' +
            '<input class="input" id="set-ig" name="instagram">' +
          '</div>' +
        '</div>' +
        '<div class="field mt-3">' +
          '<label class="field__label" for="set-email">Imejl</label>' +
          '<input class="input" id="set-email" name="email" type="email">' +
        '</div>' +

        '<h2 class="t-h3 mt-4">Dostava</h2>' +
        '<div class="adm-cols mt-3">' +
          '<div class="field">' +
            '<label class="field__label" for="set-ship">Cena dostave (RSD)</label>' +
            '<input class="input" id="set-ship" name="shippingFlat" type="number" min="0">' +
          '</div>' +
          '<div class="field">' +
            '<label class="field__label" for="set-free">Besplatno preko (RSD)</label>' +
            '<input class="input" id="set-free" name="freeShippingOver" type="number" min="0">' +
          '</div>' +
        '</div>' +

        '<button class="btn btn--primary mt-4" type="submit">Sačuvaj podešavanja</button>' +
      '</form>' +

      '<div class="adm-panel mt-4">' +
        '<h2 class="t-h3">Podaci</h2>' +
        '<p class="t-sm mt-2">Izmene se čuvaju u ovom pregledaču. Izvezi ih da ih preneseš ' +
          'na drugi računar ili predaš programeru za ubacivanje u bazu.</p>' +
        '<div class="row row--wrap mt-3">' +
          '<button class="btn btn--secondary" type="button" data-act="adm-export">' +
            CW.icon('download', 15) + ' Izvezi sve</button>' +
          '<label class="btn btn--secondary" for="adm-import">' +
            CW.icon('upload', 15) + ' Uvezi</label>' +
          '<input id="adm-import" type="file" accept="application/json" class="visually-hidden" ' +
            'data-act="adm-import">' +
          '<button class="btn btn--ghost" type="button" data-act="adm-reset">Vrati na početno</button>' +
        '</div>' +
      '</div>'
    );
  };
})();
