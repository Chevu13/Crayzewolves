/* ==========================================================================
   CRAZYWOLVES — ADMIN: PORUDŽBINE
   Lista i pojedinačna porudžbina. Učitava se posle cw-admin-pages.js.
   ========================================================================== */

window.CW = window.CW || {};
CW.admin = CW.admin || {};

(function () {
  'use strict';

  var A = CW.admin;

  var TONE = {
    pending_payment: 'warn',
    confirmed:       'ok',
    processing:      'ok',
    shipped:         'ok',
    delivered:       'ok',
    cancelled:       'bad',
    refunded:        'bad'
  };

  function label(status) {
    return (CW.api.orderStatuses && CW.api.orderStatuses[status]) || status;
  }

  function pill(status) {
    return '<span class="adm-pill adm-pill--' + (TONE[status] || 'neutral') + '">' +
      CW.esc(label(status)) + '</span>';
  }

  /* Iznosi su u parama/centima; formatiramo po valuti porudžbine, jer
     jedna porudžbina može biti u RSD a druga u EUR. */
  function money(minor, currency) {
    var v = (minor / 100).toFixed(2).split('.');
    var whole = v[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return currency === 'EUR' ? '€' + whole + ',' + v[1] : whole + ',' + v[1] + ' RSD';
  }

  function dt(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return d.toLocaleDateString('sr-RS', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' });
  }

  /* ======================================================================
     LISTA
     ====================================================================== */
  A.orders = function () {
    CW.onMount(function () {
      CW.api.orders.all().then(function (rows) {
        A._orders = rows;
        render();
      }).catch(function (e) {
        var host = document.getElementById('adm-ord-list');
        if (host) host.innerHTML = '<div class="adm-empty">' + CW.icon('alert', 24) +
          '<p>' + CW.esc(e.message) + '</p></div>';
      });

      CW.qsa('[data-ord-filter]').forEach(function (el) {
        el.addEventListener('change', render);
      });
      var q = document.getElementById('adm-ord-search');
      if (q) q.addEventListener('input', CW.debounce(render, 200));
    });

    function render() {
      var host = document.getElementById('adm-ord-list');
      if (!host || !A._orders) return;

      var term = ((document.getElementById('adm-ord-search') || {}).value || '').toLowerCase();
      var st = (document.querySelector('[data-ord-filter="status"]') || {}).value || '';

      var rows = A._orders.filter(function (o) {
        if (st && o.status !== st) return false;
        if (term) {
          var hay = (o.order_number + ' ' + o.email + ' ' + o.first_name + ' ' + o.last_name).toLowerCase();
          if (hay.indexOf(term) === -1) return false;
        }
        return true;
      });

      var count = document.getElementById('adm-ord-count');
      if (count) {
        count.textContent = rows.length + ' ' +
          CW.plural(rows.length, 'porudžbina', 'porudžbine', 'porudžbina');
      }

      host.innerHTML = rows.length
        ? rows.map(function (o) {
            return '<a class="adm-row" href="#/admin/porudzbine/' + encodeURIComponent(o.id) + '">' +
              '<div class="adm-row__icon">' + CW.icon('package', 15) + '</div>' +
              '<div class="adm-row__main">' +
                '<div class="adm-row__title">' + CW.esc(o.order_number) +
                  ' <span class="t-muted">· ' + CW.esc(o.first_name + ' ' + o.last_name) + '</span></div>' +
                '<div class="adm-row__meta">' + dt(o.created_at) +
                  ' · ' + CW.esc((CW.api.payLabels || {})[o.payment_method] || o.payment_method) +
                  (o.email_sent_at ? '' : ' · <span class="t-error">mejl nije poslat</span>') +
                '</div>' +
              '</div>' +
              '<div class="adm-row__amount">' + money(o.total, o.currency) + '</div>' +
              pill(o.status) +
            '</a>';
          }).join('')
        : '<div class="adm-empty">' + CW.icon('package', 26) +
          '<p>' + (term || st ? 'Nema porudžbina za ove filtere.' : 'Još nema nijedne porudžbine.') + '</p></div>';
    }

    var opts = Object.keys(CW.api.orderStatuses || {}).map(function (k) {
      return '<option value="' + k + '">' + CW.esc(CW.api.orderStatuses[k]) + '</option>';
    }).join('');

    return A.shell('/admin/porudzbine', 'Porudžbine',
      '<div class="adm-toolbar">' +
        '<div class="adm-search">' + CW.icon('search', 15) +
          '<input class="input" id="adm-ord-search" type="search" ' +
            'placeholder="Broj, ime ili imejl" aria-label="Pretraži porudžbine">' +
        '</div>' +
        '<select class="input" data-ord-filter="status" aria-label="Status">' +
          '<option value="">Svi statusi</option>' + opts +
        '</select>' +
      '</div>' +
      '<p class="t-sm mt-2" id="adm-ord-count">&nbsp;</p>' +
      '<div class="adm-panel mt-2"><div id="adm-ord-list">' +
        '<div class="adm-skel"><div class="adm-skel__row"></div><div class="adm-skel__row"></div>' +
        '<div class="adm-skel__row"></div></div></div></div>'
    );
  };

  /* ======================================================================
     POJEDINAČNA PORUDŽBINA
     ====================================================================== */
  A.orderDetail = function (ctx) {
    var id = ctx.params.id;

    CW.onMount(function () {
      CW.api.orders.get(id).then(function (o) {
        A._order = o;
        paint(o);
        return CW.api.orders.events(id);
      }).then(function (events) {
        var host = document.getElementById('adm-ord-events');
        if (!host) return;
        host.innerHTML = events && events.length
          ? events.map(function (e) {
              return '<div class="adm-event">' +
                '<div class="adm-event__dot"></div>' +
                '<div><div class="adm-row__title">' + CW.esc(label(e.to_status)) + '</div>' +
                '<div class="adm-row__meta">' + dt(e.created_at) + '</div></div>' +
              '</div>';
            }).join('')
          : '<p class="t-sm">Nema promena statusa.</p>';
      }).catch(function (e) {
        var h = document.getElementById('adm-ord-body');
        if (h) h.innerHTML = '<div class="adm-empty">' + CW.icon('alert', 24) +
          '<p>' + CW.esc(e.message) + '</p></div>';
      });
    });

    function paint(o) {
      var host = document.getElementById('adm-ord-body');
      if (!host) return;

      var items = (o.items || []).map(function (i) {
        return '<div class="adm-row adm-row--static">' +
          '<div class="adm-row__main">' +
            '<div class="adm-row__title">' + CW.esc(i.name) +
              (i.variant ? ' <span class="t-muted">· ' + CW.esc(i.variant) + '</span>' : '') + '</div>' +
            '<div class="adm-row__meta">' + money(i.unit_price, o.currency) + ' × ' + i.quantity +
              (i.fulfillment === 'digital' ? ' · digitalno' : '') + '</div>' +
          '</div>' +
          '<div class="adm-row__amount">' + money(i.line_total, o.currency) + '</div>' +
        '</div>';
      }).join('');

      var sum = function (l, v, gold) {
        return '<div class="row row--between" style="padding:6px 0">' +
          '<span class="' + (gold ? 't-offwhite' : 't-sm') + '">' + CW.esc(l) + '</span>' +
          '<span class="' + (gold ? 't-price t-price--sale' : 't-sm') + '">' + v + '</span></div>';
      };

      host.innerHTML =
        '<div class="adm-editor">' +
          '<div class="adm-editor__main">' +

            '<div class="adm-panel">' +
              '<div class="adm-panel__head">' +
                '<div><h2 class="t-h3">' + CW.esc(o.order_number) + '</h2>' +
                  '<p class="t-sm mt-1">' + dt(o.created_at) + '</p></div>' +
                pill(o.status) +
              '</div>' +
              items +
              '<div class="mt-3" style="border-top:var(--border);padding-top:12px">' +
                sum('Međuzbir', money(o.subtotal, o.currency)) +
                sum('Dostava', o.shipping_cost ? money(o.shipping_cost, o.currency) : 'Besplatno') +
                (o.discount ? sum('Popust', '− ' + money(o.discount, o.currency)) : '') +
                sum('Ukupno', money(o.total, o.currency), true) +
              '</div>' +
            '</div>' +

            '<div class="adm-panel mt-3">' +
              '<h2 class="t-h3">Kupac</h2>' +
              '<div class="adm-kv mt-2">' +
                '<span>Ime</span><span>' + CW.esc(o.first_name + ' ' + o.last_name) + '</span>' +
                '<span>Imejl</span><span><a href="mailto:' + CW.esc(o.email) + '">' + CW.esc(o.email) + '</a></span>' +
                (o.phone ? '<span>Telefon</span><span>' + CW.esc(o.phone) + '</span>' : '') +
                (o.address_line
                  ? '<span>Adresa</span><span>' + CW.esc(o.address_line) + ', ' +
                    CW.esc((o.postcode || '') + ' ' + (o.city || '')) + ', ' + CW.esc(o.country) + '</span>'
                  : '<span>Adresa</span><span class="t-muted">Digitalna isporuka</span>') +
                (o.notes ? '<span>Napomena</span><span>' + CW.esc(o.notes) + '</span>' : '') +
              '</div>' +
            '</div>' +

            '<div class="adm-panel mt-3">' +
              '<h2 class="t-h3">Istorija</h2>' +
              '<div class="mt-2" id="adm-ord-events"><p class="t-sm">Učitavanje…</p></div>' +
            '</div>' +
          '</div>' +

          '<aside class="adm-editor__side">' +
            '<div class="adm-panel">' +
              '<label class="field__label" for="adm-ord-status">Status</label>' +
              '<select class="input" id="adm-ord-status">' +
                Object.keys(CW.api.orderStatuses).map(function (k) {
                  return '<option value="' + k + '"' + (k === o.status ? ' selected' : '') + '>' +
                    CW.esc(CW.api.orderStatuses[k]) + '</option>';
                }).join('') +
              '</select>' +
              '<p class="t-xs mt-2">Otkazivanje vraća robu na lager.</p>' +

              '<label class="field__label mt-3" for="adm-ord-track">Broj pošiljke</label>' +
              '<input class="input" id="adm-ord-track" value="' + CW.esc(o.tracking_number || '') + '" ' +
                'placeholder="npr. BX123456789">' +

              '<button class="btn btn--primary full mt-3" type="button" data-act="adm-ord-save">' +
                'Sačuvaj</button>' +
            '</div>' +

            '<div class="adm-panel mt-3">' +
              '<h2 class="t-h3">Plaćanje</h2>' +
              '<div class="adm-kv mt-2">' +
                '<span>Način</span><span>' +
                  CW.esc((CW.api.payLabels || {})[o.payment_method] || o.payment_method) + '</span>' +
                '<span>Stanje</span><span>' + (o.payment_status === 'paid' ? 'Plaćeno' : 'Nije plaćeno') + '</span>' +
                '<span>Valuta</span><span>' + CW.esc(o.currency) + '</span>' +
                '<span>Potvrda</span><span>' +
                  (o.email_sent_at ? 'Poslata' : '<span class="t-error">Nije poslata</span>') + '</span>' +
              '</div>' +
            '</div>' +
          '</aside>' +
        '</div>';
    }

    return A.shell('/admin/porudzbine', 'Porudžbina',
      '<div id="adm-ord-body"><div class="adm-skel"><div class="adm-skel__row"></div>' +
      '<div class="adm-skel__row"></div></div></div>',
      '<a class="btn btn--ghost btn--sm" href="#/admin/porudzbine">' +
        CW.icon('arrowL', 15) + ' Nazad</a>'
    );
  };
})();
