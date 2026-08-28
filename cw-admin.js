/* ==========================================================================
   CRAZYWOLVES — ADMIN: PONAŠANJE
   --------------------------------------------------------------------------
   Rute panela, zaštita pristupa, čuvanje i brisanje, Markdown render.
   Učitava se posle admin ekrana, a pre cw-app.js koji registruje rute.
   ========================================================================== */

window.CW = window.CW || {};

(function () {
  'use strict';

  /* ======================================================================
     IKONE KOJE PANEL KORISTI, A JAVNI SAJT NEMA
     ====================================================================== */
  Object.assign(CW.ICONS, {
    grid:      '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>' +
               '<rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    file:      '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>' +
               '<path d="M9 13h6M9 17h4"/>',
    folder:    '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    settings:  '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 8.5a4 4 0 0 1 0 7"/>' +
               '<path d="M18 5.5a8 8 0 0 1 0 13"/>',
    download:  '<path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 21h16"/>',
    upload:    '<path d="M12 21V9"/><path d="M7 13l5-5 5 5"/><path d="M4 3h16"/>'
  });

  /* Aliasi, da imena u ekranima ostanu čitljiva. */
  CW.ICONS['arrow-right'] = CW.ICONS.arrowR;
  CW.ICONS['arrow-left']  = CW.ICONS.arrowL;

  /* ======================================================================
     MARKDOWN
     Isti pristup kao svuda gde se pravi HTML iz korisničkog teksta:
     PRVO se sve eskejpuje, pa se tek onda ubacuju dozvoljeni tagovi.
     Obrnut redosled bi otvorio ubacivanje skripti kroz telo objave.
     ====================================================================== */
  function safeUrl(u) {
    var t = String(u || '').trim();
    return /^(https?:\/\/|\/|#|mailto:)/i.test(t) ? t : '#';
  }

  function inlineMd(t) {
    return t
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (m, alt, src) {
        return '<img src="' + safeUrl(src) + '" alt="' + alt + '" loading="lazy">';
      })
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, label, href) {
        var u = safeUrl(href);
        var ext = /^https?:\/\//i.test(u);
        return '<a href="' + u + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + label + '</a>';
      })
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  }

  CW.md = function (src) {
    if (!src) return '<p class="t-muted">Ništa još nije napisano.</p>';
    var lines = CW.esc(src).replace(/\r\n/g, '\n').split('\n');
    var out = [], list = null, para = [];

    function closeList() { if (list) { out.push('</' + list + '>'); list = null; } }
    function flush() { if (para.length) { out.push('<p>' + inlineMd(para.join(' ')) + '</p>'); para = []; } }

    lines.forEach(function (raw) {
      var line = raw.trimEnd();
      if (!line.trim()) { flush(); closeList(); return; }

      var h = line.match(/^(#{1,4})\s+(.*)$/);
      if (h) { flush(); closeList(); out.push('<h' + (h[1].length + 1) + '>' + inlineMd(h[2]) + '</h' + (h[1].length + 1) + '>'); return; }

      if (/^(-{3,})$/.test(line.trim())) { flush(); closeList(); out.push('<hr>'); return; }

      /* Citat: '>' je već pretvoren u &gt; jer je ulaz eskejpovan. */
      var q = line.match(/^&gt;\s?(.*)$/);
      if (q) { flush(); closeList(); out.push('<blockquote>' + inlineMd(q[1]) + '</blockquote>'); return; }

      var ul = line.match(/^\s*[-*]\s+(.*)$/);
      var ol = line.match(/^\s*\d+\.\s+(.*)$/);
      if (ul || ol) {
        flush();
        var want = ul ? 'ul' : 'ol';
        if (list !== want) { closeList(); out.push('<' + want + '>'); list = want; }
        out.push('<li>' + inlineMd((ul || ol)[1]) + '</li>');
        return;
      }
      para.push(line.trim());
    });

    flush(); closeList();
    return out.join('\n');
  };

  function autoExcerpt(src, max) {
    var plain = String(src || '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[#>*`_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    max = max || 150;
    if (plain.length <= max) return plain;
    var cut = plain.slice(0, max);
    return cut.slice(0, cut.lastIndexOf(' ')) + '…';
  }

  /* ======================================================================
     ZAŠTITA PRISTUPA
     Panel nije javno mesto: bez sesije svaka ruta osim prijave vodi na
     prijavu. Ovo je udobnost, ne bezbednost — pravu zaštitu radi server,
     jer se ovo ovde može zaobići u pregledaču.
     ====================================================================== */
  CW.admin.guard = function (view) {
    return function (ctx) {
      if (!CW.api.session.get()) return CW.admin.login(ctx);
      return view(ctx);
    };
  };

  /* ======================================================================
     PONAŠANJE
     ====================================================================== */
  function form(name) { return document.querySelector('[data-form="' + name + '"]'); }

  function fieldError(f, field, message) {
    var box = f.querySelector('[data-error-for="' + field + '"]');
    var input = f.elements[field];
    if (box) box.textContent = message || '';
    if (input) {
      input.classList.toggle('is-invalid', Boolean(message));
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
    }
    return !message;
  }

  function collectPost() {
    var f = form('adm-post');
    if (!f) return null;
    var title = f.elements.title.value.trim();
    var content = f.elements.content.value.trim();

    var ok = fieldError(f, 'title', title ? '' : 'Naslov je obavezan.');
    ok = fieldError(f, 'content', content ? '' : 'Tekst je obavezan.') && ok;
    if (!ok) {
      var bad = f.querySelector('.is-invalid');
      if (bad) bad.focus();
      return null;
    }

    return {
      title: title,
      slug: CW.slug(title),
      content: content,
      excerpt: f.elements.excerpt.value.trim() || autoExcerpt(content),
      categoryId: f.elements.categoryId.value,
      status: f.elements.status.value,
      image: f.elements.image.value || null,
      imageMobile: f.elements.imageMobile.value || null,
      isFeatured: f.elements.isFeatured.checked,
      tags: f.elements.tags.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean)
    };
  }

  function savePost(publish) {
    var data = collectPost();
    if (!data) { CW.toast('Popuni obavezna polja.', 'error'); return; }

    if (publish) data.status = 'PUBLISHED';
    var editing = CW.admin._editing;

    /* Datum objave se upisuje samo pri PRVOM objavljivanju — vraćanje u
       nacrt pa ponovno objavljivanje ne sme da pomeri objavu na vrh. */
    if (data.status === 'PUBLISHED' && (!editing || !editing.publishedAt)) {
      data.publishedAt = new Date().toISOString();
    }

    var isNew = !editing || !editing.id;
    var op = isNew ? CW.api.posts.create(data) : CW.api.posts.update(editing.id, data);

    op.then(function (saved) {
      CW.admin._editing = saved;
      CW.toast(publish ? 'Objavljeno.' : 'Sačuvano.', 'success');
      if (isNew) window.location.hash = '#/admin/objave/' + encodeURIComponent(saved.id);
      else {
        var del = document.getElementById('adm-post-delete');
        if (del) del.classList.remove('hidden');
      }
    }).catch(function (e) {
      CW.toast(e.message || 'Čuvanje nije uspelo.', 'error');
    });
  }

  function saveProduct() {
    var f = form('adm-product');
    if (!f) return;
    var name = f.elements.name.value.trim();
    var priceInput = parseFloat(String(f.elements.price.value).replace(',', '.'));
    var price = isFinite(priceInput) ? Math.round(priceInput * 100) : 0;

    var ok = fieldError(f, 'name', name ? '' : 'Naziv je obavezan.');
    ok = fieldError(f, 'price', (price > 0) ? '' : 'Cena mora biti veća od nule.') && ok;
    if (!ok) {
      var bad = f.querySelector('.is-invalid');
      if (bad) bad.focus();
      CW.toast('Popuni obavezna polja.', 'error');
      return;
    }

    /* Korisnik kuca dinare i evre, baza čuva pare i cente. Množenje sa 100
       je jedino mesto gde se ta razlika prevodi — zato ide ovde, a ne po
       ekranima. */
    var toMinor = function (v) {
      var n = parseFloat(String(v).replace(',', '.'));
      return isFinite(n) && n > 0 ? Math.round(n * 100) : null;
    };
    var compare = toMinor(f.elements.compareAt.value);
    var priceEur = toMinor(f.elements.priceEur ? f.elements.priceEur.value : '');
    var compareEur = toMinor(f.elements.compareAtEur ? f.elements.compareAtEur.value : '');

    if (compare !== null && compare <= price) {
      fieldError(f, 'price', 'Stara cena mora biti veća od nove.');
      CW.toast('Stara cena mora biti veća od nove.', 'error');
      return;
    }

    var data = {
      name: name,
      slug: CW.slug(name),
      price: price,
      compareAt: compare,
      priceEur: priceEur,
      compareAtEur: compareEur,
      shortDesc: f.elements.shortDesc.value.trim(),
      description: f.elements.description.value.trim(),
      categoryId: f.elements.categoryId.value,
      stockStatus: f.elements.stockStatus.value,
      image: f.elements.image.value || null,
      isActive: f.elements.stockStatus.value !== 'COMING_SOON'
    };

    var editing = CW.admin._editing;
    var isNew = !editing || !editing.id;
    var op = isNew ? CW.api.products.create(data) : CW.api.products.update(editing.id, data);

    op.then(function (saved) {
      CW.admin._editing = saved;
      CW.toast('Sačuvano.', 'success');
      if (isNew) window.location.hash = '#/admin/proizvodi/' + encodeURIComponent(saved.id);
    }).catch(function (e) { CW.toast(e.message || 'Čuvanje nije uspelo.', 'error'); });
  }

  /* ---- delegirani događaji ---- */
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-act], [data-editor-tab], [data-save]') : null;
    if (!t) return;

    var act = t.getAttribute('data-act');

    if (t.hasAttribute('data-editor-tab')) {
      ev.preventDefault();
      var tab = t.getAttribute('data-editor-tab');
      CW.qsa('[data-editor-tab]').forEach(function (b) { b.classList.toggle('is-active', b === t); });
      CW.qsa('[data-editor-pane]').forEach(function (p) {
        p.classList.toggle('hidden', p.getAttribute('data-editor-pane') !== tab);
      });
      if (tab === 'preview' && CW.admin._updatePreview) CW.admin._updatePreview();
      return;
    }

    if (t.hasAttribute('data-save')) {
      ev.preventDefault();
      savePost(t.getAttribute('data-save') === 'publish');
      return;
    }

    if (act === 'adm-logout') {
      ev.preventDefault();
      CW.api.session.clear();
      CW.toast('Odjavljen si.', 'info');
      window.location.hash = '#/admin';
      return;
    }

    if (act === 'adm-toggle-nav') {
      ev.preventDefault();
      var side = document.getElementById('adm-side');
      if (side) side.classList.toggle('is-open');
      return;
    }

    if (act === 'adm-post-delete') {
      ev.preventDefault();
      var p = CW.admin._editing;
      if (!p || !p.id) return;
      if (!window.confirm('Obrisati objavu „' + p.title + '“? Ovo se ne može poništiti.')) return;
      CW.api.posts.remove(p.id).then(function () {
        CW.toast('Objava je obrisana.', 'success');
        window.location.hash = '#/admin/objave';
      });
      return;
    }

    if (act === 'adm-prod-delete') {
      ev.preventDefault();
      var pr = CW.admin._editing;
      if (!pr || !pr.id) return;
      if (!window.confirm('Obrisati proizvod „' + pr.name + '“?')) return;
      CW.api.products.remove(pr.id).then(function () {
        CW.toast('Proizvod je obrisan.', 'success');
        window.location.hash = '#/admin/proizvodi';
      });
      return;
    }

    if (act === 'adm-cat-rename') {
      ev.preventDefault();
      var id = t.getAttribute('data-id');
      CW.api.categories.get(id).then(function (c) {
        var name = window.prompt('Novi naziv kategorije:', c.name);
        if (!name || !name.trim() || name === c.name) return;
        CW.api.categories.update(id, { name: name.trim() }).then(function () {
          CW.toast('Preimenovano.', 'success');
          CW.router.refresh();
        });
      });
      return;
    }

    if (act === 'adm-ord-save') {
      ev.preventDefault();
      var o = CW.admin._order;
      if (!o) return;
      var status = (document.getElementById('adm-ord-status') || {}).value;
      var track = (document.getElementById('adm-ord-track') || {}).value || null;

      var patch = { status: status, tracking_number: track };
      /* Kada porudžbina ide na put, pamtimo i kada — kupcu treba datum
         slanja, ne datum poslednje izmene. */
      if (status === 'shipped' && o.status !== 'shipped') {
        patch.shipped_at = new Date().toISOString();
      }
      if (status === 'delivered') patch.payment_status = 'paid';

      t.disabled = true;
      CW.api.orders.update(o.id, patch).then(function () {
        CW.toast('Porudžbina je sačuvana.', 'success');
        CW.router.refresh();
      }).catch(function (e) {
        t.disabled = false;
        CW.toast(e.message || 'Čuvanje nije uspelo.', 'error');
      });
      return;
    }

    if (act === 'adm-export') {
      ev.preventDefault();
      CW.api.exportAll().then(function (data) {
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'crazywolves-sadrzaj-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        /* Oslobađanje odmah bi u nekim pregledačima prekinulo preuzimanje. */
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        CW.toast('Fajl je preuzet.', 'success');
      });
      return;
    }

    if (act === 'adm-reset') {
      ev.preventDefault();
      if (!window.confirm('Vratiti sav sadržaj na početno stanje? Tvoje izmene se gube.')) return;
      Promise.all([
        CW.api.posts.reset(), CW.api.products.reset(), CW.api.categories.reset()
      ]).then(function () {
        CW.toast('Vraćeno na početno.', 'success');
        CW.router.refresh();
      });
      return;
    }
  });

  document.addEventListener('change', function (ev) {
    var el = ev.target;

    /* Pregled slike je ranije crtao ovaj fajl, jer je polje bilo običan
       <select>. Sada je birač (cw-admin-media.js) sam sebi nadležan —
       iscrtava se kad mu se promeni vrednost, bez obzira da li je slika
       stigla prevlačenjem, iz fajla ili iz biblioteke. */

    if (el.getAttribute && el.getAttribute('data-act') === 'adm-import') {
      var file = el.files && el.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          CW.api.importAll(JSON.parse(reader.result)).then(function () {
            CW.toast('Sadržaj je uvezen.', 'success');
            CW.router.refresh();
          });
        } catch (e) {
          CW.toast('Fajl nije ispravan JSON.', 'error');
        }
      };
      reader.readAsText(file);
    }
  });

  document.addEventListener('submit', function (ev) {
    var f = ev.target;

    if (f.matches('[data-form="adm-login"]')) {
      ev.preventDefault();
      var email = f.elements.email.value.trim();
      var pass = f.elements.password.value;

      var ok = fieldError(f, 'email', /.+@.+\..+/.test(email) ? '' : 'Unesi ispravnu imejl adresu.');
      ok = fieldError(f, 'password', pass.length >= 6 ? '' : 'Lozinka mora imati bar šest znakova.') && ok;
      if (!ok) { var bad = f.querySelector('.is-invalid'); if (bad) bad.focus(); return; }

      CW.api.session.login(email, pass).then(function () {
        CW.toast('Dobro došao.', 'success');
        CW.router.refresh();
      }).catch(function (e) {
        fieldError(f, 'password', e.message);
      });
      return;
    }

    if (f.matches('[data-form="adm-post"]')) { ev.preventDefault(); savePost(false); return; }
    if (f.matches('[data-form="adm-product"]')) { ev.preventDefault(); saveProduct(); return; }

    if (f.matches('[data-form="adm-settings"]')) {
      ev.preventDefault();
      var patch = {};
      ['siteName', 'tagline', 'discord', 'instagram', 'email'].forEach(function (k) {
        if (f.elements[k]) patch[k] = f.elements[k].value.trim();
      });
      ['shippingFlat', 'freeShippingOver'].forEach(function (k) {
        if (f.elements[k]) patch[k] = parseInt(f.elements[k].value, 10) || 0;
      });
      CW.api.settings.save(patch).then(function () {
        CW.toast('Podešavanja su sačuvana.', 'success');
      });
    }
  });

  /* Dok kucaš dinarsku cenu, ispod polja za evro piše koliko bi ispalo po
     kursu — kao orijentir, ne kao automatska cena. */
  document.addEventListener('input', function (ev) {
    if (!ev.target || ev.target.name !== 'price') return;
    var hint = document.getElementById('adm-eur-hint');
    if (!hint) return;
    var rsd = parseFloat(String(ev.target.value).replace(',', '.'));
    hint.innerHTML = isFinite(rsd) && rsd > 0
      ? 'Po kursu bi bilo oko &euro;' + (rsd * 0.008547).toFixed(2).replace('.', ',')
      : '&nbsp;';
  });

  /* Živi pregled dok se kuca, bez čekanja na prelazak na karticu pregleda. */
  document.addEventListener('input', CW.debounce(function (ev) {
    if (ev.target && ev.target.name === 'content' && CW.admin._updatePreview) {
      CW.admin._updatePreview();
    }
  }, 250));
})();
