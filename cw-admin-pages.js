/* ==========================================================================
   WOLFPACK — ADMIN: EKRANI
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
    { path: '/admin/kodovi',     icon: 'zap',      label: 'Steam kodovi' },
    { path: '/admin/nalozi',     icon: 'user',     label: 'Nalozi' },
    { path: '/admin/kategorije', icon: 'folder',   label: 'Kategorije' },
    { path: '/admin/newsletter', icon: 'mail',     label: 'Newsletter' },
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
              '<div class="adm__brand-name">Wolfpack</div>' +
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

  /* Slika proizvoda može biti ključ iz ugrađenog registra ('product-mug')
     ili puna adresa fajla otpremljenog kroz panel. Spisak je dosad crtao
     samo prvo, pa su otpremljene slike ostajale kao prazan kvadrat. */
  function thumb(value, alt) {
    if (value && CW.IMAGES[value]) return CW.img(value, { ratio: '1 / 1', ph: alt });
    if (value && /^https?:\/\//i.test(value)) {
      return '<img class="adm-thumb" src="' + CW.esc(value) + '" alt="" loading="lazy">';
    }
    return '<div class="ph ph--1x1 ph--product" data-ph=""></div>';
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
            /* Bez ovoga je ekran za prijavu slepa ulica: ko ne zna lozinku,
               odavde nema kuda. Reset zivi na javnom delu sajta. */
            '<p class="t-xs text-center"><a class="link-underline" href="#/nalog/zaboravljena">Zaboravljena lozinka?</a></p>' +
          '</form>' +

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
        /* Gornja traka je SAMO o porudzbinama — to je ono sto se gleda svaki
           dan. Objave i proizvodi imaju svoje ekrane i svoje brojeve; ovde
           su samo oduzimali paznju od jedinog broja koji se menja. */
        host.innerHTML =
          statCard('Porudžbine ukupno', s.ordersTotal,
                   s.ordersNew ? s.ordersNew + ' novih, čeka obradu' : 'nema novih za obradu',
                   s.ordersNew ? 'ok' : '') +
          statCard('Porudžbine danas', s.ordersToday,
                   s.ordersToday ? 'od ponoći' : 'još nijedna danas',
                   s.ordersToday ? 'ok' : '') +
          statCard('Promet ukupno', CW.money(s.revenueTotal || 0),
                   s.ordersEur ? s.ordersEur + ' u evrima nije sabrano' : 'bez otkazanih') +
          statCard('Promet danas', CW.money(s.revenueToday || 0),
                   s.revenueToday ? 'od ponoći' : 'još nema prometa danas');
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
          title: '', excerpt: '', content: '', image: '', imageMobile: '',
          categoryId: '', tags: [], status: 'DRAFT', isFeatured: false, inHero: false,
          imageBanner: '', imageBannerMobile: ''
        });
        return;
      }
      CW.api.posts.get(id).then(fillForm).catch(function () {
        CW.toast('Objava nije pronađena.', 'error');
        window.location.hash = '#/admin/objave';
      });
    });

    /* Dok baza nema kolone za baner, čuvanje objave puca na nerazumljivoj
       poruci iz PostgREST-a. Bolje da piše šta nedostaje, i to ovde gde se
       slika bira. */
    CW.onMount(function () {
      if (!CW.sb || !CW.sb.from) return;
      CW.sb.from('posts').select('image_banner').limit(1).get().catch(function (e) {
        if (String(e && e.message || e).indexOf('image_banner') < 0) return;
        var w = document.getElementById('adm-banner-upozorenje');
        if (w) w.classList.remove('hidden');
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
      f.elements.inHero.checked = Boolean(p.inHero);
      CW.adm.setImage('adm-post-image', p.image || '');
      CW.adm.setImage('adm-post-image-mobile', p.imageMobile || '');
      CW.adm.setImage('adm-post-image-banner', p.imageBanner || '');
      CW.adm.setImage('adm-post-image-banner-mobile', p.imageBannerMobile || '');
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
                'placeholder="Nova era za Wolfpack">' +
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
            /* Sajt od Markdowna prikazuje samo ova tri znaka — podebljano i linkovi
               bi na sajtu izašli kao zvezdice i zagrade. */
            '<p class="t-xs mb-2">Prazan red = novi pasus · ## podnaslov · - stavka liste · &gt; citat</p>' +
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
              '<input type="checkbox" name="isFeatured"> <span>Glavna vest</span>' +
            '</label>' +
            '<p class="t-xs mt-1">Stoji velika na vrhu bloga i prva na početnoj. ' +
              'Glavna vest je samo jedna — nova skida staru.</p>' +

            '<label class="adm-check mt-3">' +
              '<input type="checkbox" name="inHero"> <span>Na glavnom baneru</span>' +
            '</label>' +
            '<p class="t-xs mt-1">Objava ulazi u veliki slajder na vrhu početne strane. ' +
              'Može ih biti više, smenjuju se. Dok nijedna nije označena, na slajderu ' +
              'stoje tri najnovije objave.</p>' +
          '</div>' +

          '<div class="adm-panel mt-3">' +
            '<span class="field__label">Naslovna slika — PC</span>' +
            CW.adm.imagePicker({
              id: 'adm-post-image',
              name: 'image',
              groups: ['blog', 'brend', 'discord'],
              ratio: '3 / 2',
              recW: 1200, recH: 800, ratioLabel: 'odnos 3:2',
              note: 'Kartica na blogu i vrh članka — ne i slajder, on ima svoj baner ' +
                'niže. Ako nemaš svoju sliku, uzmi jedan od šablona iz biblioteke.'
            }) +
          '</div>' +

          '<div class="adm-panel mt-3">' +
            '<span class="field__label">Naslovna slika — mobilni</span>' +
            CW.adm.imagePicker({
              id: 'adm-post-image-mobile',
              name: 'imageMobile',
              groups: ['blog', 'brend', 'discord'],
              ratio: '9 / 16',
              recW: 1080, recH: 1920, ratioLabel: 'odnos 9:16',
              note: 'Nije obavezno — ako je ostaviš praznu, na mobilnom se prikazuje PC slika.'
            }) +
          '</div>' +

          /* Baner traži drugačiji izrez od naslovne slike (široko umesto 3:2).
             Polja stoje na svakoj objavi, jer na slajder ume da dođe i ona
             koja nije označena — dok nijedna nije, idu tri najnovije. */
          '<div class="adm-panel mt-3" id="adm-post-banner-wrap">' +
            '<div class="adm-panel__head">' +
              '<h2 class="t-h3">Baner za slajder</h2>' +
            '</div>' +
            '<p class="t-xs mt-1">Slika za veliki slajder na vrhu početne strane i za ' +
              'sekciju „Saradnja" u dnu. Drugačijeg je oblika od naslovne — široka ' +
              'umesto 3:2 — pa se otprema zasebno. Bez nje slajder prikazuje naslovnu ' +
              'sliku celu, sa zamućenim trakama sa strane.</p>' +

            '<div class="alert alert--warning mt-2 hidden" id="adm-banner-upozorenje">' +
              '<span>Baza još nema polja za baner — pusti <b>supabase-dopuna-13.sql</b> ' +
              'u Supabase → SQL Editor. Dotle čuvanje objave neće proći.</span>' +
            '</div>' +

            '<span class="field__label mt-3">Baner — PC</span>' +
            CW.adm.imagePicker({
              id: 'adm-post-image-banner',
              name: 'imageBanner',
              groups: ['blog', 'brend', 'discord'],
              ratio: '12 / 5',
              recW: 2400, recH: 1000, ratioLabel: 'odnos 12:5',
              note: 'Natpis drži u sredini, bar 150 px od ivica — po dnu slike stoji ' +
                'dugme „Pročitaj".'
            }) +

            '<span class="field__label mt-3">Baner — mobilni</span>' +
            CW.adm.imagePicker({
              id: 'adm-post-image-banner-mobile',
              name: 'imageBannerMobile',
              groups: ['blog', 'brend', 'discord'],
              ratio: '4 / 5',
              recW: 1080, recH: 1350, ratioLabel: 'odnos 4:5',
              note: 'Isti baner, samo uspravniji — širok baner bi na telefonu bio tanka ' +
                'traka. Ako je ostaviš praznu, na telefonu se seče PC baner.'
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
  A.products = function (ctx) {
    /* Izabrana kategorija stoji u adresi, ne u pamćenju panela. Tako se na
       spisak može doći linkom sa ekrana Kategorije, a izbor preživi i
       osvežavanje strane. */
    A._prodFilter = (ctx && ctx.query && ctx.query.cat) || '';
    CW.onMount(function () { A._reloadProds(); });

    return A.shell('/admin/proizvodi', 'Proizvodi',
      '<div class="adm-panel">' +
        '<div class="field">' +
          '<label class="field__label" for="adm-prod-filter">Kategorija</label>' +
          '<select class="select" id="adm-prod-filter">' +
            '<option value="">Sve kategorije</option>' +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div class="adm-panel mt-3"><div id="adm-prod-list">' + skeletonRows(4) + '</div></div>' +
      '<p class="t-sm mt-3">Strelice menjaju redosled unutar kategorije — tim redom ' +
        'proizvodi stoje u prodavnici. Padajući spisak u redu premešta proizvod u drugu ' +
        'kategoriju; proizvod tada ide na kraj nove police.</p>'
    );
  };

  /* Spisak se crta iz proizvoda i kategorija zajedno, pa je izdvojen: posle
     svakog pomeranja i premeštanja osvežava se samo on. Izabrana kategorija
     u filteru preživljava osvežavanje, inače bi urednik posle svake strelice
     ispadao nazad na "Sve kategorije". */
  A._reloadProds = function () {
    var host = document.getElementById('adm-prod-list');
    if (!host) return;

    Promise.all([CW.api.products.all(), CW.api.categories.all()]).then(function (r) {
      var prods = r[0], cats = r[1];
      A._cats = cats;

      var filter = document.getElementById('adm-prod-filter');
      if (filter) {
        var izabrano = A._prodFilter || '';
        filter.innerHTML = '<option value="">Sve kategorije</option>' +
          cats.map(function (c) {
            return '<option value="' + CW.esc(c.id) + '">' +
              (c.kind === 'DIGITAL' ? 'Digitalna: ' : 'Merch: ') + CW.esc(c.name) + '</option>';
          }).join('') +
          '<option value="__bez">Bez kategorije</option>';
        filter.value = izabrano;
      }

      host = document.getElementById('adm-prod-list');
      if (!host) return;
      if (!prods.length) { host.innerHTML = empty('tag', 'Još nema proizvoda.'); return; }

      /* Opcije za premeštanje — iste za svaki red, pa se prave jednom. */
      function catOpcije(trenutna, kind) {
        return '<option value="">Bez kategorije</option>' +
          cats.filter(function (c) { return c.kind === kind; })
              .map(function (c) {
                return '<option value="' + CW.esc(c.id) + '"' +
                  (c.id === trenutna ? ' selected' : '') + '>' + CW.esc(c.name) + '</option>';
              }).join('');
      }

      function grupa(cat) {
        var catId = cat ? cat.id : '';
        var red = prods.filter(function (p) { return (p.categoryId || '') === catId; })
                       .sort(function (a, b) {
                         return (a.sortOrder || 0) - (b.sortOrder || 0) ||
                                a.name.localeCompare(b.name, 'sr');
                       });
        if (!red.length) return '';
        if (A._prodFilter === '__bez' && cat) return '';
        if (A._prodFilter && A._prodFilter !== '__bez' && (!cat || cat.id !== A._prodFilter)) return '';

        var naslov = cat
          ? CW.esc(cat.name) + ' <span class="adm-pill adm-pill--neutral">' +
            (cat.kind === 'DIGITAL' ? 'digitalna' : 'merch') + '</span>'
          : 'Bez kategorije';

        return '<h3 class="t-h4 mt-3">' + naslov + ' <span class="t-xs">(' + red.length + ')</span></h3>' +
          red.map(function (p, i) {
            var veza = '#/admin/proizvodi/' + encodeURIComponent(p.id);
            return '<div class="adm-row adm-row--static">' +
              '<a class="adm-row__thumb" href="' + veza + '">' + thumb(p.image, p.name) + '</a>' +
              '<div class="adm-row__main">' +
                '<div class="adm-row__title"><a href="' + veza + '">' + CW.esc(p.name) + '</a></div>' +
                '<div class="adm-row__meta">' + CW.money(p.price) +
                  (p.isActive === false ? ' · skriven' : '') +
                  (p.featuredSlot ? ' · na početnoj ' + p.featuredSlot + '.' : '') + '</div>' +
              '</div>' +
              '<div class="adm-row__acts">' +
                '<select class="select select--sm" data-act="adm-prod-cat-set" ' +
                  'data-id="' + CW.esc(p.id) + '" title="Premesti u kategoriju">' +
                  catOpcije(p.categoryId, p.kind) +
                '</select>' +
                '<button class="btn btn--ghost btn--sm" type="button" title="Gore" ' +
                  'data-act="adm-prod-up" data-id="' + CW.esc(p.id) + '"' +
                  (i === 0 ? ' disabled' : '') + '>' + CW.icon('chevronU', 14) + '</button>' +
                '<button class="btn btn--ghost btn--sm" type="button" title="Dole" ' +
                  'data-act="adm-prod-down" data-id="' + CW.esc(p.id) + '"' +
                  (i === red.length - 1 ? ' disabled' : '') + '>' + CW.icon('chevronD', 14) + '</button>' +
              '</div>' +
              A.statusPill(p.stockStatus) +
            '</div>';
          }).join('');
      }

      var html = cats.filter(function (c) { return c.kind === 'MERCH'; }).map(grupa).join('') +
                 cats.filter(function (c) { return c.kind === 'DIGITAL'; }).map(grupa).join('') +
                 grupa(null);

      host.innerHTML = html || empty('tag', 'Nema proizvoda u ovoj kategoriji.');
    }).catch(function (e) {
      var h = document.getElementById('adm-prod-list');
      if (h) h.innerHTML = empty('alert', e.message || 'Učitavanje nije uspelo.');
    });
  };

  /* Digitalni proizvod nema lager u komadima — zaliha mu je broj slobodnih
     kodova. Polje tada postaje prikaz, ne unos: pokazuje pravo stanje i vodi
     na ekran gde se kodovi dosipaju. */
  /* Ponuda kategorija prati vrstu proizvoda. Baza (`products_shop_matches_
     fulfillment`) ne dozvoljava digitalan proizvod u merch kategoriji, pa
     nema svrhe nuditi izbor koji će upis odbiti. */
  A._syncCats = function () {
    var f = document.querySelector('[data-form="adm-product"]');
    var sel = document.getElementById('adm-prod-cat');
    if (!f || !sel || !A._cats) return;

    var kind = f.elements.kind ? f.elements.kind.value : 'MERCH';
    /* Pri izmeni se vrednost upisuje u polje PRE nego što ovaj spisak
       postoji, pa prazan select tu vrednost tiho proguta. Zato se traženi
       id cita i iz proizvoda koji se uređuje. */
    var zeljeno = sel.value || (A._editing && A._editing.categoryId) || '';
    var red = A._cats.filter(function (c) { return c.kind === kind && c.isActive; });

    sel.innerHTML = red.length
      ? red.map(function (c) {
          return '<option value="' + CW.esc(c.id) + '">' + CW.esc(c.name) + '</option>';
        }).join('')
      : '<option value="">Nema kategorija za ovu vrstu</option>';

    /* Ako je proizvod bio u kategoriji druge prodavnice, izbor pada na prvu
       ponuđenu -- to je i jedina vrednost koju će baza primiti. */
    var ima = red.some(function (c) { return c.id === zeljeno; });
    if (ima) sel.value = zeljeno;
  };

  A._syncKind = function (productId) {
    var f = document.querySelector('[data-form="adm-product"]');
    if (!f || !f.elements.kind) return;
    A._syncCats();
    var digitalno = f.elements.kind.value === 'DIGITAL';
    var polje = f.elements.stock;
    var hint = document.getElementById('adm-prod-qty-hint');

    polje.readOnly = digitalno;
    polje.classList.toggle('is-locked', digitalno);

    if (!digitalno) {
      if (hint) hint.innerHTML = 'Koliko komada sme da se proda. Svaka porudžbina skida komad.';
      return;
    }

    if (hint) hint.innerHTML = 'Zaliha je broj slobodnih Steam kodova — ne upisuje se ovde.';

    if (!productId || !CW.api.keys) { polje.value = 0; return; }
    CW.api.keys.forProduct(productId).then(function (keys) {
      var slobodno = keys.filter(function (k) { return k.status === 'available'; }).length;
      var prodato = keys.length - slobodno;
      polje.value = slobodno;
      if (hint) {
        hint.innerHTML = 'Slobodnih kodova: <b>' + slobodno + '</b>, prodatih: ' + prodato +
          '. <a class="link-underline" href="#/admin/kodovi/' + encodeURIComponent(productId) + '">Dodaj kodove</a>';
      }
    }).catch(function () { /* bez kodova ostaje samo objašnjenje */ });
  };

  /* Izbor mesta ima smisla samo ako je kvačica uključena. */
  A._syncFeatured = function () {
    var f = document.querySelector('[data-form="adm-product"]');
    if (!f || !f.elements.featured) return;
    var wrap = document.getElementById('adm-prod-slot-wrap');
    if (wrap) wrap.classList.toggle('hidden', !f.elements.featured.checked);
  };

  A.productEdit = function (ctx) {
    var id = ctx.params.id;
    var isNew = !id || id === 'novi';

    CW.onMount(function () {
      CW.api.categories.all().then(function (cats) {
        A._cats = cats;
        if (isNew) { A._editing = null; A._syncKind(null); A._syncFeatured(); return; }
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
          f.elements.stock.value = p.stock || 0;
          f.elements.kind.value = p.kind || 'MERCH';
          f.elements.sortOrder.value = p.sortOrder || 0;
          f.elements.hidden.checked = p.isActive === false;
          f.elements.featured.checked = Boolean(p.featuredSlot);
          f.elements.featuredSlot.value = String(p.featuredSlot || 1);
          A._syncFeatured();
          A._syncKind(p.id);
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
            /* Vrsta odlučuje sve ostalo: digitalni proizvod nema lager u
               komadima nego kodove, ne traži adresu i ne ide kurirom. */
            '<div class="field">' +
              '<label class="field__label" for="adm-prod-kind">Vrsta proizvoda</label>' +
              '<select class="input" id="adm-prod-kind" name="kind">' +
                '<option value="MERCH">Fizički — šalje se kurirom</option>' +
                '<option value="DIGITAL">Digitalni — Steam kod na mejl</option>' +
              '</select>' +
            '</div>' +
            '<div class="field mt-3">' +
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
            /* Bez ovog polja proizvod „Na stanju" sa lagerom 0 na sajtu piše
               „Rasprodato" — sajt kupovinu dozvoljava po broju komada. */
            /* Dva odvojena reda: gde stoji u shopu i da li je izdvojen na
               početnoj. Ranije je to bio jedan broj, pa se nije moglo
               izabrati jedno bez drugog. */
            '<div class="field mt-3">' +
              '<label class="adm-check">' +
                '<input type="checkbox" name="hidden" id="adm-prod-hidden"> ' +
                '<span>Sakrij sa sajta</span>' +
              '</label>' +
              '<p class="t-xs mt-1">Proizvod ostaje u panelu, ali ga posetilac ne vidi nigde. ' +
                '„U pripremi" ga NE skriva — tada se vidi sa oznakom <b>Uskoro</b>.</p>' +
            '</div>' +

            '<div class="field mt-3">' +
              '<label class="field__label" for="adm-prod-order">Redosled u shopu</label>' +
              '<input class="input" id="adm-prod-order" name="sortOrder" type="number" step="1" value="0">' +
              '<p class="t-xs mt-1">Manji broj ide napred u spisku proizvoda.</p>' +
            '</div>' +

            '<div class="field mt-3">' +
              '<label class="adm-check">' +
                '<input type="checkbox" name="featured" id="adm-prod-featured"> ' +
                '<span>Prikaži na početnoj („Izdvajamo iz shopa")</span>' +
              '</label>' +
              '<div class="row mt-2" id="adm-prod-slot-wrap" style="gap:8px;align-items:center">' +
                '<label class="field__label" for="adm-prod-slot" style="margin:0">Mesto</label>' +
                '<select class="input" id="adm-prod-slot" name="featuredSlot" style="max-width:110px">' +
                  '<option value="1">1.</option>' +
                  '<option value="2">2.</option>' +
                  '<option value="3">3.</option>' +
                '</select>' +
              '</div>' +
              '<p class="t-xs mt-1">Na početnoj stoje tri proizvoda. Merch i digitalno ' +
                'imaju svoja tri mesta — prekidač bira koja se polica vidi.</p>' +
            '</div>' +
            '<div class="field mt-3">' +
              '<label class="field__label" for="adm-prod-qty">Komada na lageru</label>' +
              '<input class="input" id="adm-prod-qty" name="stock" type="number" min="0" step="1">' +
              '<p class="t-xs mt-1" id="adm-prod-qty-hint">Koliko komada sme da se proda. ' +
                'Svaka porudžbina skida komad.</p>' +
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
     STEAM KODOVI
     ----------------------------------------------------------------------
     Jedan ekran po digitalnom proizvodu: nalepiš kodove, oni čekaju u redu
     i baza ih sama dodeljuje kupcima kojima je porudžbina plaćena.
     ====================================================================== */
  A.keys = function () {
    CW.onMount(function () {
      Promise.all([CW.api.products.all(), CW.api.keys.all()]).then(function (r) {
        var digital = r[0].filter(function (p) { return p.kind === 'DIGITAL'; });
        var keys = r[1];
        var host = document.getElementById('adm-keys-list');
        if (!host) return;

        host.innerHTML = digital.length
          ? digital.map(function (p) {
              var mine = keys.filter(function (k) { return k.product_id === p.id; });
              var free = mine.filter(function (k) { return k.status === 'available'; }).length;
              var sold = mine.filter(function (k) { return k.status === 'sold'; }).length;
              return '<a class="adm-row" href="#/admin/kodovi/' + encodeURIComponent(p.id) + '">' +
                '<div class="adm-row__icon">' + CW.icon('zap', 15) + '</div>' +
                '<div class="adm-row__main">' +
                  '<div class="adm-row__title">' + CW.esc(p.name) + '</div>' +
                  '<div class="adm-row__meta">' + sold + ' prodato · ' + CW.money(p.price) + '</div>' +
                '</div>' +
                '<span class="adm-pill adm-pill--' + (free ? 'ok' : 'bad') + '">' +
                  (free ? free + ' slobodno' : 'nema kodova') + '</span>' +
              '</a>';
            }).join('')
          : empty('zap', 'Nijedan proizvod nije označen kao digitalni.',
              '<a class="btn btn--primary btn--sm mt-3" href="#/admin/proizvodi">Otvori proizvode</a>');
      }).catch(function (e) {
        var host = document.getElementById('adm-keys-list');
        if (host) host.innerHTML = empty('alert', e.message);
      });
    });

    return A.shell('/admin/kodovi', 'Steam kodovi',
      '<p class="t-sm">Proizvod je u prodaji dok ima slobodnih kodova. Kad se potroše, ' +
        'sajt ga sam prikazuje kao rasprodat.</p>' +
      '<div class="adm-panel mt-3"><div id="adm-keys-list">' + skeletonRows(3) + '</div></div>'
    );
  };

  A.keysDetail = function (ctx) {
    var id = ctx.params.id;

    CW.onMount(function () {
      load();
      var back = document.getElementById('adm-keys-name');
      CW.api.products.get(id).then(function (p) {
        A._keyProduct = p;
        if (back) back.textContent = p.name;
        load();
      }).catch(function () { /* naziv nije presudan za rad ekrana */ });
    });

    function load() {
      /* Kodovi imaju smisla samo na digitalnom proizvodu — na fizičkom bi
         ostali neiskorišćeni, jer ih porudžbina nikad ne traži. */
      var warn = document.getElementById('adm-keys-warn');
      if (warn && A._keyProduct && A._keyProduct.kind !== 'DIGITAL') {
        warn.innerHTML = '<div class="adm-empty">' + CW.icon('alert', 22) +
          '<p>Ovaj proizvod nije označen kao digitalni, pa mu kodovi ništa ne znače. ' +
          'Promeni mu vrstu u <b>Proizvodi → izmena</b>.</p></div>';
      }

      Promise.all([CW.api.keys.forProduct(id), CW.api.orders.all()]).then(function (r) {
        var keys = r[0];
        var byId = {};
        (r[1] || []).forEach(function (o) { byId[o.id] = o.order_number; });

        var free = keys.filter(function (k) { return k.status === 'available'; }).length;
        var cnt = document.getElementById('adm-keys-count');
        if (cnt) {
          cnt.textContent = free + ' slobodno · ' + (keys.length - free) + ' prodato';
        }

        var host = document.getElementById('adm-key-rows');
        if (!host) return;
        host.innerHTML = keys.length
          ? keys.map(function (k) {
              var sold = k.status === 'sold';
              return '<div class="adm-row adm-row--static">' +
                '<div class="adm-row__main">' +
                  '<div class="adm-row__title adm-code">' + CW.esc(k.code) + '</div>' +
                  '<div class="adm-row__meta">' +
                    (sold
                      ? 'Prodato ' + CW.fmtDate(k.sold_at) +
                        (byId[k.order_id] ? ' · ' + CW.esc(byId[k.order_id]) : '')
                      : 'Čeka kupca') +
                  '</div>' +
                '</div>' +
                '<span class="adm-pill adm-pill--' + (sold ? 'neutral' : 'ok') + '">' +
                  (sold ? 'Prodat' : 'Slobodan') + '</span>' +
                (sold ? '' :
                  '<button class="btn btn--ghost btn--sm" type="button" data-act="adm-key-del" ' +
                    'data-id="' + CW.esc(k.id) + '">' + CW.icon('trash', 14) + '</button>') +
              '</div>';
            }).join('')
          : empty('zap', 'Još nema kodova za ovaj proizvod.');
      });
    }

    A._reloadKeys = load;

    return A.shell('/admin/kodovi', 'Kodovi proizvoda',
      '<div class="adm-panel">' +
        '<h2 class="t-h3" id="adm-keys-name">Učitavanje…</h2>' +
        '<p class="t-sm mt-1" id="adm-keys-count">&nbsp;</p>' +
        '<div id="adm-keys-warn"></div>' +
      '</div>' +

      '<form class="adm-panel mt-3" data-form="adm-keys" data-product="' + CW.esc(id) + '" novalidate>' +
        '<label class="field__label" for="adm-keys-new">Novi kodovi</label>' +
        '<p class="t-xs mb-2">Jedan kod u svaki red. Isti kod se ne može uneti dvaput.</p>' +
        '<textarea class="input adm-code" id="adm-keys-new" name="codes" rows="8" ' +
          'placeholder="XXXXX-YYYYY-ZZZZZ&#10;AAAAA-BBBBB-CCCCC"></textarea>' +
        '<button class="btn btn--primary mt-3" type="submit">Dodaj kodove</button>' +
      '</form>' +

      '<div class="adm-panel mt-3"><div id="adm-key-rows">' + skeletonRows(3) + '</div></div>',

      '<a class="btn btn--ghost btn--sm" href="#/admin/kodovi">' + CW.icon('arrow-left', 15) + ' Nazad</a>'
    );
  };

  /* ======================================================================
     NALOZI
     ====================================================================== */
  A.accounts = function () {
    CW.onMount(function () {
      CW.api.customers.all().then(function (rows) {
        A._accounts = rows;
        render();
      }).catch(function (e) {
        var host = document.getElementById('adm-acc-list');
        if (host) host.innerHTML = empty('alert', e.message);
      });

      var q = document.getElementById('adm-acc-search');
      if (q) q.addEventListener('input', CW.debounce(render, 200));
    });

    function render() {
      var host = document.getElementById('adm-acc-list');
      if (!host || !A._accounts) return;

      var term = ((document.getElementById('adm-acc-search') || {}).value || '').toLowerCase();
      var rows = A._accounts.filter(function (c) {
        if (!term) return true;
        return ((c.first_name || '') + ' ' + (c.last_name || '') + ' ' + c.email)
          .toLowerCase().indexOf(term) !== -1;
      });

      var count = document.getElementById('adm-acc-count');
      if (count) {
        count.textContent = rows.length + ' ' +
          CW.plural(rows.length, 'nalog', 'naloga', 'naloga');
      }

      host.innerHTML = rows.length
        ? rows.map(function (c) {
            var ime = ((c.first_name || '') + ' ' + (c.last_name || '')).trim();
            /* Google nalog i nalog sa lozinkom se drugačije rešavaju kad
               neko ne može da uđe — zato piše koji je koji. */
            var nacin = c.provider === 'google' ? 'Google' : 'Lozinka';
            return '<div class="adm-row adm-row--static">' +
              '<div class="adm-row__icon">' + CW.icon('user', 15) + '</div>' +
              '<div class="adm-row__main">' +
                '<div class="adm-row__title">' + CW.esc(ime || '—') +
                  (c.is_admin ? ' <span class="adm-pill adm-pill--ok">admin</span>' : '') +
                  (c.email_confirmed ? '' : ' <span class="adm-pill adm-pill--warn">mejl nije potvrđen</span>') +
                '</div>' +
                '<div class="adm-row__meta">' + CW.esc(c.email) +
                  (c.phone ? ' · ' + CW.esc(c.phone) : '') +
                  (c.city ? ' · ' + CW.esc(c.city) : '') +
                '</div>' +
                '<div class="adm-row__meta">Prijava: ' + nacin +
                  ' · Poslednja: ' + (c.last_sign_in_at ? CW.fmtDate(c.last_sign_in_at) : 'nikad') +
                  ' · Nalog od ' + CW.fmtDate(c.created_at) + '</div>' +
              '</div>' +
              '<div class="adm-row__amount">' +
                c.orders_count + ' ' + CW.plural(c.orders_count, 'porudžbina', 'porudžbine', 'porudžbina') +
                (c.spent_rsd ? '<div class="t-xs">' + CW.money(c.spent_rsd) + '</div>' : '') +
              '</div>' +
            '</div>';
          }).join('')
        : empty('user', term ? 'Nema naloga za tu pretragu.' : 'Još nema nijednog naloga.');
    }

    return A.shell('/admin/nalozi', 'Nalozi',
      '<div class="adm-toolbar">' +
        '<div class="adm-search">' + CW.icon('search', 15) +
          '<input class="input" id="adm-acc-search" type="search" ' +
            'placeholder="Ime ili imejl" aria-label="Pretraži naloge">' +
        '</div>' +
      '</div>' +
      '<p class="t-sm mt-2" id="adm-acc-count">&nbsp;</p>' +
      '<div class="adm-panel mt-2"><div id="adm-acc-list">' + skeletonRows(4) + '</div></div>' +
      '<p class="t-xs mt-3">Lozinke se ne vide nigde — ni ovde ni u bazi. Ko ne može da uđe, ' +
        'traži novu lozinku preko „Zaboravljena lozinka" na sajtu.</p>'
    );
  };

  /* ======================================================================
     KATEGORIJE
     ====================================================================== */
  /* Ikonice koje imaju smisla za policu u prodavnici. Lista je kratka
     namerno — urednik bira iz ponuđenog, pa ne može da upiše ime
     ikonice koja ne postoji i dobije prazan kvadrat u shopu. */
  var CAT_IKONE = ['tag', 'shirt', 'cap', 'mouse', 'monitor', 'mug', 'sticker',
                   'gift', 'card', 'zap', 'package', 'trophy', 'flame', 'star', 'book'];

  A.categories = function () {
    CW.onMount(function () { A._reloadCats(); });

    function ikonOpcije() {
      return CAT_IKONE.map(function (i) {
        return '<option value="' + i + '">' + i + '</option>';
      }).join('');
    }

    return A.shell('/admin/kategorije', 'Kategorije',
      '<form class="adm-panel" data-form="adm-cat" novalidate>' +
        '<h2 class="t-h3" id="adm-cat-naslov">Nova kategorija</h2>' +
        '<input type="hidden" name="id" id="adm-cat-id" value="">' +

        '<div class="adm-cols mt-3">' +
          '<div class="field">' +
            '<label class="field__label" for="adm-cat-kind">Prodavnica *</label>' +
            '<select class="select" id="adm-cat-kind" name="kind">' +
              '<option value="MERCH">Merch — fizički proizvodi</option>' +
              '<option value="DIGITAL">Digitalna — kodovi, gift kartice, pretplate</option>' +
            '</select>' +
            '<p class="t-xs mt-1">Digitalni proizvodi mogu da stoje samo u digitalnim ' +
              'kategorijama — tako traži baza.</p>' +
          '</div>' +
          '<div class="field">' +
            '<label class="field__label" for="adm-cat-name">Naziv *</label>' +
            '<input class="input" id="adm-cat-name" name="name" required ' +
              'placeholder="npr. Slušalice">' +
            '<p class="field__error hidden" data-error-for="name"></p>' +
          '</div>' +
        '</div>' +

        '<div class="adm-cols mt-3">' +
          '<div class="field">' +
            '<label class="field__label" for="adm-cat-icon">Ikonica</label>' +
            '<select class="select" id="adm-cat-icon" name="icon">' + ikonOpcije() + '</select>' +
          '</div>' +
          '<div class="field">' +
            '<label class="field__label" for="adm-cat-blurb">Kratak opis</label>' +
            '<input class="input" id="adm-cat-blurb" name="blurb" ' +
              'placeholder="Stoji ispod naziva u prodavnici.">' +
          '</div>' +
        '</div>' +

        '<div class="adm-actions mt-3">' +
          '<button class="btn btn--primary" type="submit" id="adm-cat-submit">Dodaj kategoriju</button>' +
          '<button class="btn btn--ghost hidden" type="button" id="adm-cat-cancel" ' +
            'data-act="adm-cat-cancel">Otkaži</button>' +
        '</div>' +
      '</form>' +

      '<div class="adm-panel mt-3"><div id="adm-cat-list">' + skeletonRows(4) + '</div></div>' +

      '<p class="t-sm mt-3">Strelicama nameštaš redosled kojim police stoje u ' +
        'prodavnici. Kategorija sa proizvodima ne može da se obriše — prvo premesti ' +
        'proizvode.</p>'
    );
  };

  /* Spisak se crta iz dva izvora (kategorije + brojač proizvoda), pa je
     izdvojen: posle svakog dodavanja, brisanja i pomeranja osvežava se
     samo on, bez ponovnog učitavanja cele strane. */
  A._reloadCats = function () {
    var host = document.getElementById('adm-cat-list');
    if (!host) return;

    Promise.all([CW.api.categories.all(), CW.api.products.all()]).then(function (r) {
      var cats = r[0], prods = r[1];
      host = document.getElementById('adm-cat-list');
      if (!host) return;

      if (!cats.length) { host.innerHTML = empty('folder', 'Nema kategorija.'); return; }

      function grupa(kind, naslov) {
        var red = cats.filter(function (c) { return c.kind === kind; })
                      .sort(function (a, b) { return a.sortOrder - b.sortOrder; });
        if (!red.length) return '';

        return '<h3 class="t-h4 mt-3">' + naslov + '</h3>' +
          red.map(function (c, i) {
            var n = prods.filter(function (p) { return p.categoryId === c.id; }).length;
            return '<div class="adm-row adm-row--static">' +
              '<div class="adm-row__icon">' + CW.icon(c.icon || 'tag', 15) + '</div>' +
              '<div class="adm-row__main">' +
                '<div class="adm-row__title">' + CW.esc(c.name) +
                  (c.isActive ? '' : ' <span class="adm-pill adm-pill--neutral">skrivena</span>') +
                '</div>' +
                '<div class="adm-row__meta">' + n + ' ' +
                  CW.plural(n, 'proizvod', 'proizvoda', 'proizvoda') +
                  (c.blurb ? ' · ' + CW.esc(c.blurb) : '') + '</div>' +
              '</div>' +
              '<div class="adm-row__acts">' +
                '<button class="btn btn--ghost btn--sm" type="button" title="Gore" ' +
                  'data-act="adm-cat-up" data-id="' + CW.esc(c.id) + '"' +
                  (i === 0 ? ' disabled' : '') + '>' + CW.icon('chevronU', 14) + '</button>' +
                '<button class="btn btn--ghost btn--sm" type="button" title="Dole" ' +
                  'data-act="adm-cat-down" data-id="' + CW.esc(c.id) + '"' +
                  (i === red.length - 1 ? ' disabled' : '') + '>' + CW.icon('chevronD', 14) + '</button>' +
                '<a class="btn btn--ghost btn--sm" ' +
                  'href="#/admin/proizvodi?cat=' + encodeURIComponent(c.id) + '">' +
                  (n ? 'Poređaj (' + n + ')' : 'Proizvodi') + '</a>' +
                '<button class="btn btn--ghost btn--sm" type="button" ' +
                  'data-act="adm-cat-edit" data-id="' + CW.esc(c.id) + '">Izmeni</button>' +
                '<button class="btn btn--ghost btn--sm" type="button" ' +
                  'data-act="adm-cat-toggle" data-id="' + CW.esc(c.id) + '">' +
                  (c.isActive ? 'Sakrij' : 'Prikaži') + '</button>' +
                '<button class="btn btn--ghost btn--sm" type="button" ' +
                  'data-act="adm-cat-del" data-id="' + CW.esc(c.id) + '">Obriši</button>' +
              '</div>' +
            '</div>';
          }).join('');
      }

      host.innerHTML = grupa('MERCH', 'Merch prodavnica') +
                       grupa('DIGITAL', 'Digitalna prodavnica');
    }).catch(function (e) {
      var h = document.getElementById('adm-cat-list');
      if (h) h.innerHTML = empty('alert', e.message || 'Učitavanje nije uspelo.');
    });
  };

  /* Jedna forma radi i dodavanje i izmenu — dve forme sa istim poljima bi
     se razišle prvom sledećom izmenom. */
  A._catForm = function (c) {
    var f = document.querySelector('[data-form="adm-cat"]');
    if (!f) return;
    f.elements.id.value = c ? c.id : '';
    f.elements.name.value = c ? c.name : '';
    f.elements.kind.value = c ? c.kind : 'MERCH';
    f.elements.icon.value = c ? (c.icon || 'tag') : 'tag';
    f.elements.blurb.value = c ? (c.blurb || '') : '';

    var naslov = document.getElementById('adm-cat-naslov');
    var dugme = document.getElementById('adm-cat-submit');
    var otkazi = document.getElementById('adm-cat-cancel');
    if (naslov) naslov.textContent = c ? ('Izmena: ' + c.name) : 'Nova kategorija';
    if (dugme) dugme.textContent = c ? 'Sačuvaj izmene' : 'Dodaj kategoriju';
    if (otkazi) otkazi.classList.toggle('hidden', !c);
    if (c) f.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ======================================================================
     NEWSLETTER
     ====================================================================== */
  A.newsletter = function () {
    CW.onMount(function () { A._reloadNews(); });

    return A.shell('/admin/newsletter', 'Newsletter',
      '<div class="adm-panel" id="adm-news-broj">' + skeletonRows(1) + '</div>' +

      '<form class="adm-panel mt-3" data-form="adm-news" novalidate>' +
        '<h2 class="t-h3">Nov mejl</h2>' +

        '<div class="field mt-3">' +
          '<label class="field__label" for="adm-news-subject">Naslov *</label>' +
          '<input class="input input--lg" id="adm-news-subject" name="subject" required ' +
            'placeholder="To vidi čovek u sandučetu, pre nego što otvori.">' +
          '<p class="field__error hidden" data-error-for="subject"></p>' +
        '</div>' +

        '<div class="field mt-3">' +
          '<label class="field__label" for="adm-news-body">Tekst *</label>' +
          '<textarea class="input" id="adm-news-body" name="body" rows="10" required ' +
            'placeholder="Piši običan tekst. Prazan red pravi nov pasus."></textarea>' +
          '<p class="field__error hidden" data-error-for="body"></p>' +
          '<p class="t-xs mt-1">Bez HTML-a — sve se ispisuje kao tekst. ' +
            'Dugme „Otvori shop" i link za odjavu sajt dodaje sam.</p>' +
        '</div>' +

        '<div class="field mt-3">' +
          '<label class="field__label" for="adm-news-test">Proba na adresu</label>' +
          '<input class="input" id="adm-news-test" name="testTo" type="email" ' +
            'placeholder="ostavi prazno pa ide na tvoju adresu">' +
        '</div>' +

        '<div class="adm-actions mt-3">' +
          '<button class="btn btn--secondary" type="button" data-act="adm-news-test">' +
            'Pošalji probu sebi</button>' +
          '<button class="btn btn--primary" type="submit">Pošalji svima</button>' +
        '</div>' +
      '</form>' +

      '<div class="adm-panel mt-3">' +
        '<h2 class="t-h3">Pretplatnici</h2>' +
        '<div id="adm-news-list" class="mt-3">' + skeletonRows(4) + '</div>' +
      '</div>' +

      '<p class="t-sm mt-3">Mejl ide samo onima koji su potvrdili prijavu iz svog ' +
        'sandučeta. Prijavljeni bez potvrde se ne broje — tako spisak ostaje čist i ' +
        'mejlovi ne završavaju u spamu.</p>'
    );
  };

  A._reloadNews = function () {
    /* Newsletter postoji samo u sloju koji priča sa bazom (cw-admin-supabase.js).
       Kad baza nije povezana, panel radi na demo podacima i ovog dela nema —
       bolje jedna rečenica nego TypeError koji obori ceo ekran. */
    if (!CW.api.newsletter) {
      var h = document.getElementById('adm-news-list');
      if (h) h.innerHTML = empty('mail', 'Newsletter radi tek kad je baza povezana.');
      var b = document.getElementById('adm-news-broj');
      if (b) b.innerHTML = '';
      return;
    }

    CW.api.newsletter.all().then(function (red) {
      var potvrdjeni = red.filter(function (r) { return r.status === 'confirmed'; });
      var cekaju = red.filter(function (r) { return r.status === 'pending'; });
      var odjavljeni = red.filter(function (r) { return r.status === 'unsubscribed'; });

      var broj = document.getElementById('adm-news-broj');
      if (broj) {
        broj.innerHTML = '<div class="adm-grid adm-grid--stats">' +
          statCard('Potvrđenih', potvrdjeni.length, 'njima ide slanje', potvrdjeni.length ? 'ok' : '') +
          statCard('Čekaju potvrdu', cekaju.length, cekaju.length ? 'nisu kliknuli link' : 'nema takvih') +
          statCard('Odjavljenih', odjavljeni.length, 'više ne primaju') +
        '</div>';
      }

      var host = document.getElementById('adm-news-list');
      if (!host) return;

      host.innerHTML = red.length
        ? red.map(function (r) {
            var pill = r.status === 'confirmed' ? 'ok' : (r.status === 'pending' ? 'warn' : 'neutral');
            var rec = r.status === 'confirmed' ? 'potvrđen'
                    : (r.status === 'pending' ? 'čeka potvrdu' : 'odjavljen');
            return '<div class="adm-row adm-row--static">' +
              '<div class="adm-row__icon">' + CW.icon('mail', 15) + '</div>' +
              '<div class="adm-row__main">' +
                '<div class="adm-row__title">' + CW.esc(r.email) + '</div>' +
                '<div class="adm-row__meta">' + CW.fmtDate(r.created_at) +
                  (r.source ? ' · ' + CW.esc(r.source) : '') + '</div>' +
              '</div>' +
              '<span class="adm-pill adm-pill--' + pill + '">' + rec + '</span>' +
            '</div>';
          }).join('')
        : empty('mail', 'Još nema nijedne prijave.');
    }).catch(function (e) {
      var host = document.getElementById('adm-news-list');
      if (host) host.innerHTML = empty('alert', e.message || 'Učitavanje nije uspelo.');
    });
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
        '<p class="t-sm mt-2">Izvezi sve preuzima rezervnu kopiju objava, proizvoda i ' +
          'podešavanja kao fajl. Sadržaj je u bazi — uvoz i vraćanje na početno radi programer.</p>' +
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
