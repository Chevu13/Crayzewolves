/* ==========================================================================
   CRAZYWOLVES — SLANJE PORUDŽBINE
   --------------------------------------------------------------------------
   Pregledač šalje samo ono što sme da odredi: šta je poručeno, koliko
   komada i ko poručuje. Cene, dostavu i pravila plaćanja računa Edge
   funkcija iz baze.

   Zato ovde nema nijednog sabiranja koje bi završilo u porudžbini —
   iznosi koje sajt prikazuje su za oko kupca, a merodavni su oni koje
   funkcija vrati.
   ========================================================================== */

window.CW = window.CW || {};

(function () {
  'use strict';

  /* Nazivi načina plaćanja na sajtu -> vrednosti koje baza poznaje. */
  var PAY = { pouzece: 'cod', racun: 'bank', kartica: 'card' };

  CW.orders = {
    /* Da li korpa sadrži digitalnu robu — određuje koja plaćanja nudimo. */
    hasDigital: function () {
      return CW.store.cart().some(function (line) {
        var p = CW.product(line.productId);
        return p && (p.categoryId === 'digital' || p.fulfillment === 'digital');
      });
    },

    /* Načini plaćanja dozvoljeni za trenutnu korpu. */
    availablePayments: function () {
      var digital = CW.orders.hasDigital();
      return CW.data.paymentMethods.filter(function (m) {
        /* Digitalna roba se ne plaća pouzećem — nema kurira koji bi
           naplatio kod poslat mejlom. */
        if (digital && m.id === 'pouzece') return false;
        return true;
      });
    },

    place: function (payload) {
      if (!CW.sb || !CW.sb.enabled) {
        return Promise.reject(new Error('Porudžbine trenutno nisu dostupne. Piši nam na Discordu.'));
      }

      var items = CW.store.cart().map(function (line) {
        return {
          productId: line.productId,
          quantity: line.qty,
          variant: line.variantId || null
        };
      });

      if (!items.length) return Promise.reject(new Error('Korpa je prazna.'));

      var body = {
        customer: {
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
          phone: payload.phone || null,
          addressLine: payload.line1 || null,
          city: payload.city || null,
          postcode: payload.postcode || null,
          country: payload.country || 'RS'
        },
        items: items,
        paymentMethod: PAY[payload.paymentId] || 'cod',
        /* ID, ne naziv. Cenu dostave odredjuje baza iz tabele
           shipping_methods — ranije je slat samo naziv, pa je baza
           naplacivala kurirsku dostavu i za licno preuzimanje. */
        shippingMethodId: payload.shippingId || null,
        shippingMethod: payload.shippingName || null,
        currency: payload.currency || 'RSD',
        notes: payload.notes || null
      };

      return CW.orders.send(body);
    },

    /**
     * Šalje porudžbinu bazi.
     *
     * Ranije je ovo išlo na Edge funkciju `create-order`. Ona nikad nije bila
     * deployovana, pa je svaka porudžbina padala na mreži. Sada ide na
     * funkciju `create_order` u samoj bazi — ista zaštita, bez zasebnog
     * deploy-a: funkcija je `security definer` i cenu čita iz tabele, pa
     * iznos koji pregledač pošalje nema nikakav uticaj.
     *
     * Ako je kupac prijavljen, ide njegov token — porudžbina se tada veže za
     * nalog i pojavi mu se u profilu. Ako nije, ide anon ključ.
     */
    send: function (body) {
      var sess = CW.sb.session && CW.sb.session();
      var token = (sess && sess.access_token) || CW.sb.config.anonKey;

      return fetch(CW.sb.config.url + '/rest/v1/rpc/create_order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: CW.sb.config.anonKey,
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ payload: body })
      }).then(function (res) {
        return res.text().then(function (text) {
          var data = null;
          try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }

          if (!res.ok) {
            /* Postgres poruke iz RAISE stižu u polju `message` i već su na
               srpskom — „Nema dovoljno na stanju.", „Digitalna roba se ne
               plaća pouzećem." — pa se prosleđuju kupcu takve kakve jesu. */
            var msg = (data && (data.message || data.hint || data.details)) || '';
            if (/function .*create_order.* does not exist/i.test(msg)) {
              msg = 'Porudžbine još nisu uključene u bazi. Pokreni supabase-porudzbine.sql.';
            }
            throw new Error(msg || 'Porudžbina nije prošla. Pokušaj ponovo.');
          }

          if (!data || !data.orderNumber) {
            throw new Error('Porudžbina nije prošla. Pokušaj ponovo.');
          }

          /* Mejl potvrde ide ODVOJENO, i namerno se ne ceka.
             Porudzbina je vec u bazi; ako Resend nije podesen ili ne
             odgovori, kupac svejedno mora da vidi potvrdu. Zato .catch koji
             cuti — pad mejla nije pad porudzbine. */
          CW.orders.sendEmail(data.orderNumber);

          /* Iznosi koje sajt prikazuje na potvrdi su OVI — iz baze, ne oni
             koje je korpa sabrala u pregledaču. */
          return {
            id: data.orderNumber,
            orderNumber: data.orderNumber,
            currency: data.currency,
            status: data.status,
            items: data.items || [],
            totals: {
              subtotal: data.subtotal,
              shipping: data.shipping,
              discount: 0,
              total: data.total
            }
          };
        });
      });
    },

    /**
     * Trazi slanje mejla potvrde. Best-effort: nikad ne baca.
     *
     * Funkcija `send-order-email` salje najvise JEDAN mejl po porudzbini
     * (proverava `email_sent_at`), pa ponovljeni poziv — osvezavanje
     * stranice potvrde, dupli klik — ne pravi drugi mejl.
     */
    sendEmail: function (orderNumber) {
      if (!orderNumber || !CW.sb || !CW.sb.enabled) return Promise.resolve(false);
      return fetch(CW.sb.config.url + '/functions/v1/send-order-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: CW.sb.config.anonKey,
          Authorization: 'Bearer ' + CW.sb.config.anonKey
        },
        body: JSON.stringify({ orderNumber: orderNumber })
      })
        .then(function (r) { return r.json().catch(function () { return null; }); })
        .then(function (d) {
          if (d && d.sent === false && d.reason) {
            /* Ne prikazuje se kupcu — porudzbina je prosla. Stoji u konzoli
               da se vidi zasto mejl nije otisao. */
            console.warn('[CW] Mejl potvrde nije poslat:', d.reason);
          }
          return Boolean(d && d.sent);
        })
        .catch(function (e) {
          console.warn('[CW] Mejl potvrde nije poslat:', e && e.message);
          return false;
        });
    }
  };
})();
