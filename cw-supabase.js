/* ==========================================================================
   CRAZYWOLVES — SUPABASE KLIJENT
   --------------------------------------------------------------------------
   Namerno bez zvanične biblioteke: sajt nema build korak, a ovde nam treba
   samo prijava, čitanje/pisanje tabela i otpremanje slika. To je nekoliko
   fetch poziva, pa dodavanje ~40 KB spoljne skripte ne bi ništa dobilo.

   Anon ključ sme da stoji ovde. On je javan po nameni — zaštita su pravila
   (RLS) u bazi, ne tajnost ključa. Service role ključ NIKADA ne sme ovde.
   ========================================================================== */

window.CW = window.CW || {};

(function () {
  'use strict';

  /* Ključevi žive u cw-config.js — jedno mesto, da se ne traže po fajlovima.
     Raniji projekat (fhwctgnendvbkwhoevbi) je obrisan; njegov URL se više ni
     ne rezolvuje, pa je svaki poziv padao na mreži i prijava u panel nije
     mogla da prođe. */
  var CFG = (CW.CONFIG && CW.CONFIG.supabase) || { url: '', anonKey: '', bucket: 'media' };

  var SESSION_KEY = 'cw.sb.session';

  /* Bez fetch-a nema ni baze. Umesto da svaki poziv puca, gasimo se odmah
     i sajt radi sa ugrađenim sadržajem. */
  var hasFetch = typeof window.fetch === 'function';
  var sb = { config: CFG, enabled: Boolean(CFG.url && CFG.anonKey && hasFetch) };
  if (!hasFetch) console.warn('[CW] Pregledač nema fetch — baza je isključena.');

  /* ---------------------------------------------------------------- sesija */
  function readSession() {
    try {
      var raw = window.localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      /* Token traje sat vremena; 60 s zazora da ne istekne usred zahteva. */
      if (s.expires_at && Date.now() > (s.expires_at * 1000 - 60000)) return s;
      return s;
    } catch (e) { return null; }
  }

  function writeSession(s) {
    try {
      if (s) window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else window.localStorage.removeItem(SESSION_KEY);
    } catch (e) { /* privatni prozor — sesija tada traje do zatvaranja kartice */ }
    sb._session = s;
  }

  sb.session = function () { return sb._session || readSession(); };

  function expired(s) {
    return !s || !s.expires_at || Date.now() > (s.expires_at * 1000 - 60000);
  }

  /* Osvežavanje tokena. Više paralelnih poziva deli isti Promise, da se ne
     pokrene pet osvežavanja za pet zahteva pokrenutih istovremeno. */
  var refreshing = null;
  function refresh() {
    var s = sb.session();
    if (!s || !s.refresh_token) return Promise.resolve(null);
    if (refreshing) return refreshing;

    refreshing = fetch(CFG.url + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { apikey: CFG.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.access_token) { writeSession(d); return d; }
        writeSession(null);
        return null;
      })
      .catch(function () { return null; })
      .then(function (r) { refreshing = null; return r; });

    return refreshing;
  }

  sb.auth = {
    signIn: function (email, password) {
      return fetch(CFG.url + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { apikey: CFG.anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      }).then(function (r) {
        return r.json().then(function (d) {
          if (!r.ok) {
            /* Supabase vraća engleske poruke; prevodimo one česte. */
            var msg = d.error_description || d.msg || d.message || '';
            if (/invalid login/i.test(msg)) msg = 'Pogrešna imejl adresa ili lozinka.';
            else if (/email not confirmed/i.test(msg)) msg = 'Nalog nije potvrđen — proveri mejl.';
            else if (!msg) msg = 'Prijava nije uspela.';
            throw new Error(msg);
          }
          writeSession(d);
          return d;
        });
      });
    },

    signOut: function () {
      var s = sb.session();
      writeSession(null);
      if (!s) return Promise.resolve();
      return fetch(CFG.url + '/auth/v1/logout', {
        method: 'POST',
        headers: { apikey: CFG.anonKey, Authorization: 'Bearer ' + s.access_token }
      }).catch(function () { /* odjava lokalno je već obavljena */ });
    },

    user: function () {
      var s = sb.session();
      return s && s.user ? s.user : null;
    }
  };

  /* --------------------------------------------------------------- zahtevi */
  function headers(extra) {
    var s = sb.session();
    var h = { apikey: CFG.anonKey, 'Content-Type': 'application/json' };
    h.Authorization = 'Bearer ' + (s && s.access_token ? s.access_token : CFG.anonKey);
    return Object.assign(h, extra || {});
  }

  function request(path, opts, retried) {
    var s = sb.session();
    /* Ako je token istekao, prvo ga osveži pa onda šalji — inače bi svaki
       zahtev posle sat vremena rada vraćao 401. */
    if (s && expired(s) && !retried) {
      return refresh().then(function () { return request(path, opts, true); });
    }

    return fetch(CFG.url + path, opts).then(function (r) {
      if (r.status === 401 && !retried) {
        return refresh().then(function (n) {
          if (!n) throw new Error('Sesija je istekla. Prijavi se ponovo.');
          opts.headers = headers(opts._extra);
          return request(path, opts, true);
        });
      }
      if (r.status === 204) return null;
      return r.text().then(function (t) {
        var d = null;
        try { d = t ? JSON.parse(t) : null; } catch (e) { d = t; }
        if (!r.ok) {
          var msg = (d && (d.message || d.error || d.hint)) || ('Greška ' + r.status);
          if (r.status === 403 || /row-level security/i.test(String(msg))) {
            msg = 'Nemaš dozvolu za ovu izmenu. Prijavi se ponovo.';
          }
          throw new Error(msg);
        }
        return d;
      });
    });
  }

  /* Mali upitnik nad PostgREST-om. Pokriva ono što panel koristi. */
  sb.from = function (table) {
    var q = [];
    var api = {
      select: function (cols) { q.push('select=' + encodeURIComponent(cols || '*')); return api; },
      eq:     function (col, val) { q.push(col + '=eq.' + encodeURIComponent(val)); return api; },
      order:  function (col, desc) { q.push('order=' + col + '.' + (desc ? 'desc' : 'asc') + '.nullslast'); return api; },
      limit:  function (n) { q.push('limit=' + n); return api; },

      get: function () {
        return request('/rest/v1/' + table + (q.length ? '?' + q.join('&') : ''),
          { method: 'GET', headers: headers() });
      },

      insert: function (row) {
        return request('/rest/v1/' + table, {
          method: 'POST',
          headers: headers({ Prefer: 'return=representation' }),
          _extra: { Prefer: 'return=representation' },
          body: JSON.stringify(row)
        }).then(function (d) { return Array.isArray(d) ? d[0] : d; });
      },

      update: function (patch) {
        return request('/rest/v1/' + table + '?' + q.join('&'), {
          method: 'PATCH',
          headers: headers({ Prefer: 'return=representation' }),
          _extra: { Prefer: 'return=representation' },
          body: JSON.stringify(patch)
        }).then(function (d) { return Array.isArray(d) ? d[0] : d; });
      },

      /* upsert — za podešavanja, gde ne znamo unapred da li red postoji */
      upsert: function (row) {
        return request('/rest/v1/' + table, {
          method: 'POST',
          headers: headers({ Prefer: 'resolution=merge-duplicates,return=representation' }),
          _extra: { Prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify(row)
        });
      },

      remove: function () {
        return request('/rest/v1/' + table + '?' + q.join('&'),
          { method: 'DELETE', headers: headers() });
      }
    };
    return api;
  };

  /* -------------------------------------------------------------- skladište */
  sb.upload = function (file, folder) {
    var s = sb.session();
    if (!s) return Promise.reject(new Error('Za otpremanje je potrebna prijava.'));

    /* Ime fajla se prečišćava: ćirilica, razmaci i navodnici u putanji
       prave probleme kod nekih CDN-ova. */
    var clean = file.name.toLowerCase()
      .replace(/[^a-z0-9.\-_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    var path = (folder || 'objave') + '/' + Date.now().toString(36) + '-' + clean;

    return fetch(CFG.url + '/storage/v1/object/' + CFG.bucket + '/' + path, {
      method: 'POST',
      headers: {
        apikey: CFG.anonKey,
        Authorization: 'Bearer ' + s.access_token,
        'x-upsert': 'true'
      },
      body: file
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) {
          throw new Error('Otpremanje nije uspelo: ' + (t || r.status));
        });
      }
      return CFG.url + '/storage/v1/object/public/' + CFG.bucket + '/' + path;
    });
  };

  CW.sb = sb;
})();
