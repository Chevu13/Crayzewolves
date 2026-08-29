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
    sb._customerCache = null; /* profil pripada prošloj sesiji, ne važi više */
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

    /* Registracija. `handle_new_user()` u bazi (supabase-postavka.sql) čita
       baš ova dva polja iz raw_user_meta_data i njima puni customers.
       Supabase vraća sesiju odmah AKO je "Confirm email" isključeno u
       Authentication → Providers → Email; inače vraća korisnika bez
       sesije i traži potvrdu mejlom — pozivalac to prepoznaje po tome što
       resolved objekat nema `access_token`. */
    signUp: function (email, password, firstName, lastName) {
      /* Bez ovoga link u mejlu potvrde vodi na Supabase-ov podrazumevani
         Site URL — ako je taj podešen na koren domena, tokeni završe na
         pokaznoj stranici (index.html), koja ništa ne radi sa njima, i
         izgleda kao da link ne vodi nigde. Ovako uvek vodi tačno tu gde je
         sajt trenutno pokrenut (radi i pre i posle skidanja "u izradi"
         režima, jer se sam prilagođava trenutnoj putanji).

         VAŽNO: ova adresa mora biti i u Supabase → Authentication →
         URL Configuration → Redirect URLs, inače je Supabase ignoriše i
         vraća se na podrazumevani Site URL. */
      var redirectTo = window.location.origin + window.location.pathname;
      return fetch(CFG.url + '/auth/v1/signup?redirect_to=' + encodeURIComponent(redirectTo), {
        method: 'POST',
        headers: { apikey: CFG.anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password,
          data: { first_name: firstName, last_name: lastName }
        })
      }).then(function (r) {
        return r.json().then(function (d) {
          if (!r.ok) {
            var msg = d.error_description || d.msg || d.message || '';
            if (/already registered|user already exists/i.test(msg)) msg = 'Nalog sa ovim imejlom već postoji.';
            else if (/password/i.test(msg) && /least|short|weak/i.test(msg)) msg = 'Lozinka mora imati najmanje šest znakova.';
            else if (!msg) msg = 'Registracija nije uspela.';
            throw new Error(msg);
          }
          if (d.access_token) writeSession(d);
          return d;
        });
      });
    },

    /* Menja lozinku i/ili user_metadata (ime, prezime — isto što
       handle_new_user() čita pri registraciji). Odgovor je ceo korisnik,
       bez novog tokena, pa ručno upisujemo u keširanu sesiju da
       CW.store.user() odmah vidi novo ime — inače bi zaglavlje i dalje
       pokazivalo staro dok se token sam ne osveži.

       Supabase ne traži staru lozinku da bi upisao novu — ko god ima važeći
       token može da je promeni. Zato pozivalac (details-form u cw-app.js)
       prvo proveri staru lozinku kroz signIn(), pa tek onda zove ovo. */
    /**
     * Trazi mejl za promenu lozinke.
     *
     * `redirectTo` NAMERNO nema #hash: Supabase svoje tokene lepi kao
     * fragment na kraj te adrese. Da smo ovde poslali adresu koja vec ima
     * hash, dobili bismo dva fragmenta u jednom URL-u i ruter ne bi znao
     * sta je putanja a sta token. Ovako stigne cist
     * `.../app.html#access_token=...&type=recovery`, boot to uhvati i
     * prebaci korisnika na stranicu za novu lozinku.
     *
     * Odgovor je UVEK uspesan, i kad adresa ne postoji — inace bi svako
     * mogao da kroz ovu formu proverava koje adrese imaju nalog.
     */
    requestPasswordReset: function (email) {
      var base = window.location.origin + window.location.pathname;
      return fetch(CFG.url + '/auth/v1/recover', {
        method: 'POST',
        headers: { apikey: CFG.anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, redirect_to: base })
      }).then(function (r) {
        if (r.ok) return true;
        return r.json().catch(function () { return {}; }).then(function (d) {
          var msg = d.error_description || d.msg || d.message || '';
          /* Prečesto slanje je jedina greska koju kupcu vredi pokazati. */
          if (/rate|too many|seconds/i.test(msg)) {
            throw new Error('Previše pokušaja. Sačekaj minut pa probaj ponovo.');
          }
          throw new Error('Slanje nije uspelo. Pokušaj ponovo.');
        });
      });
    },

    updateAuthUser: function (patch) {
      var s = sb.session();
      if (!s) return Promise.reject(new Error('Nisi prijavljen.'));
      return fetch(CFG.url + '/auth/v1/user', {
        method: 'PUT',
        headers: { apikey: CFG.anonKey, Authorization: 'Bearer ' + s.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      }).then(function (r) {
        return r.json().then(function (d) {
          if (!r.ok) {
            var msg = d.error_description || d.msg || d.message || '';
            if (/password/i.test(msg) && /least|short|weak/i.test(msg)) msg = 'Lozinka mora imati najmanje šest znakova.';
            throw new Error(msg || 'Izmena naloga nije uspela.');
          }
          writeSession(Object.assign({}, sb.session(), { user: d }));
          return d;
        });
      });
    },

    /* Link iz mejla potvrde (i budući reset lozinke) ne vraća JSON — Supabase
       preusmerava pregledač na Site URL sa tokenima u #hash-u
       (#access_token=...&refresh_token=...&type=signup...). cw-app.js boot()
       to hvata PRE nego što ruter pokuša da taj hash pročita kao putanju
       (inače ispada „link nigde ne vodi" — ruter ne prepoznaje rutu i
       tokeni samo sede neiskorišćeni u adresi). Ovde se ti već raščlanjeni
       parametri pretvaraju u pravu sesiju: /auth/v1/user vrati korisnika za
       taj token (odgovor iz hash-a ne nosi ceo user objekat, samo tokene). */
    establishFromCallback: function (params) {
      if (!params || !params.access_token) return Promise.resolve(false);
      return fetch(CFG.url + '/auth/v1/user', {
        headers: { apikey: CFG.anonKey, Authorization: 'Bearer ' + params.access_token }
      }).then(function (r) {
        if (!r.ok) return false;
        return r.json().then(function (u) {
          var expiresIn = Number(params.expires_in) || 3600;
          writeSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
            expires_in: expiresIn,
            expires_at: Math.floor(Date.now() / 1000) + expiresIn,
            token_type: params.token_type || 'bearer',
            user: u
          });
          return { type: params.type || '' };
        });
      }).catch(function () { return false; });
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
    },

    /* Ime/prezime/adresa nisu na JWT-u, samo u public.customers. Jedan
       zahtev po sesiji — keš se prazni u writeSession() pri svakoj promeni
       sesije (prijava, odjava, druga prijava). */
    customer: function () {
      var u = sb.auth.user();
      if (!u) return Promise.resolve(null);
      if (sb._customerCache) return sb._customerCache;
      sb._customerCache = sb.from('customers').select('*').eq('id', u.id).limit(1).get()
        .then(function (rows) { return (rows && rows[0]) || null; })
        .catch(function () { return null; });
      return sb._customerCache;
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
