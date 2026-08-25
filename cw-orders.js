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
        shippingMethod: payload.shippingName || null,
        currency: payload.currency || 'RSD',
        notes: payload.notes || null
      };

      return fetch(CW.sb.config.url + '/functions/v1/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: CW.sb.config.anonKey,
          Authorization: 'Bearer ' + CW.sb.config.anonKey
        },
        body: JSON.stringify(body)
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok || data.error) {
            throw new Error(data.error || 'Porudžbina nije prošla. Pokušaj ponovo.');
          }
          return data;
        });
      });
    }
  };
})();
