/* ==========================================================================
   CRAZYWOLVES — ADMIN: BIRAČ SLIKE
   --------------------------------------------------------------------------
   Jedna komponenta za sva mesta u panelu gde se bira slika (objava,
   proizvod, kasnije i digitalni proizvodi). Tri načina, svi vode do istog
   polja:

     1. prevlačenje slike na okvir
     2. biranje fajla sa računara
     3. biranje gotove slike iz biblioteke (ono što je i do sada radilo)

   ŠTA SE DEŠAVA SA OTPREMLJENOM SLIKOM
   ------------------------------------
   Fajl se NE šalje takav kakav jeste. Telefoni prave slike od 4–8 MB i
   4000 px širine; takva slika u kartici proizvoda od 300 px samo troši
   podatke posetiocu i ruši ocenu brzine. Zato se u pregledaču, pre svakog
   slanja, slika smanji na razumnu meru i prekodira u WebP.

   Gde završi zavisi od toga da li je baza povezana:

     baza povezana   →  Supabase Storage, vraća se javna adresa
     baza nije       →  `data:` zapis u pregledaču

   Drugi slučaj je namerno dozvoljen da panel može da se isproba pre nego
   što baza postoji, ali nosi ograničenje koje korisnik MORA da vidi:
   slika tada živi samo u tom pregledaču. Zato ide izričito upozorenje, a
   ne tiho čuvanje koje bi kasnije ispalo kao izgubljen rad.
   ========================================================================== */

window.CW = window.CW || {};
CW.adm = CW.adm || {};

(function () {
  'use strict';

  /* Iznad ovoga ni jedna slika na sajtu nema svrhu — najveći slot je hero
     baner od 1983 px. Zaokruženo naviše, da ostane prostora za retinu. */
  var MAX_SIDE = 2000;

  /* Ulazni fajl. Deset megabajta je više nego dovoljno za fotografiju sa
     telefona; preko toga je skoro sigurno greška (RAW, skener, video). */
  var MAX_INPUT_BYTES = 10 * 1024 * 1024;

  /* Kad nema baze, slika ide u localStorage kao tekst. Prostora ima oko
     5 MB za CEO panel, pa jedna slika ne sme da pojede više od ovoga. */
  var MAX_DATAURL_BYTES = 900 * 1024;

  var ALLOWED = /^image\/(jpeg|png|webp|gif|avif)$/i;

  /* ======================================================================
     OBRADA SLIKE
     ====================================================================== */

  /** Učitava fajl u <img>, da bismo znali prave dimenzije. */
  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('Fajl nije slika ili je oštećen.'));
      };
      img.src = url;
    });
  }

  /** Crta u canvas na zadatoj najdužoj strani i vraća blob. */
  function encode(img, maxSide, quality) {
    var w = img.naturalWidth || img.width;
    var h = img.naturalHeight || img.height;
    var scale = Math.min(1, maxSide / Math.max(w, h));
    w = Math.max(1, Math.round(w * scale));
    h = Math.max(1, Math.round(h * scale));

    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    /* Bez ovoga smanjivanje daje nazubljene ivice na logotipima. */
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);

    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) return resolve({ blob: blob, w: w, h: h });
        /* Stariji Safari ne ume WebP iz canvas-a — vraća null umesto greške. */
        canvas.toBlob(function (jpg) {
          if (jpg) resolve({ blob: jpg, w: w, h: h });
          else reject(new Error('Pregledač ne ume da prekodira ovu sliku.'));
        }, 'image/jpeg', quality);
      }, 'image/webp', quality);
    });
  }

  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(new Error('Čitanje fajla nije uspelo.')); };
      r.readAsDataURL(blob);
    });
  }

  /**
   * Fajl -> adresa slike koja se upisuje u polje.
   *
   * Kad baze nema, slika mora da stane u localStorage, pa se kvalitet i
   * veličina spuštaju u koracima dok ne stane. Bolje malo mekša slika nego
   * poruka „nema više mesta" posle deset minuta pisanja objave.
   */
  function fileToSource(file) {
    if (!ALLOWED.test(file.type || '')) {
      return Promise.reject(new Error('Dozvoljene su slike: JPG, PNG, WebP, GIF ili AVIF.'));
    }
    if (file.size > MAX_INPUT_BYTES) {
      return Promise.reject(new Error(
        'Slika je prevelika (' + Math.round(file.size / 1048576) + ' MB). Najviše 10 MB.'
      ));
    }

    var canUpload = Boolean(CW.sb && CW.sb.enabled && CW.sb.session());

    return loadImage(file).then(function (img) {
      if (canUpload) {
        return encode(img, MAX_SIDE, 0.86).then(function (r) {
          var named = new File([r.blob], renameFor(file, r.blob.type), { type: r.blob.type });
          return CW.sb.upload(named, 'panel').then(function (url) {
            return { src: url, w: r.w, h: r.h, bytes: r.blob.size, kept: 'baza' };
          });
        });
      }

      /* Bez baze: probaj redom sve manje varijante dok ne stane u pregledač. */
      var steps = [
        [1600, 0.82], [1280, 0.78], [1024, 0.74], [800, 0.70]
      ];

      function attempt(i) {
        var s = steps[i];
        return encode(img, s[0], s[1]).then(function (r) {
          return blobToDataUrl(r.blob).then(function (dataUrl) {
            if (dataUrl.length <= MAX_DATAURL_BYTES || i === steps.length - 1) {
              return { src: dataUrl, w: r.w, h: r.h, bytes: r.blob.size, kept: 'pregledac' };
            }
            return attempt(i + 1);
          });
        });
      }
      return attempt(0);
    });
  }

  function renameFor(file, mime) {
    var base = String(file.name || 'slika').replace(/\.[^.]+$/, '');
    var ext = mime === 'image/webp' ? '.webp' : '.jpg';
    return base + ext;
  }

  /* ======================================================================
     MARKUP
     ====================================================================== */

  /**
   * @param {object} o
   *   id        id skrivenog polja (ostaje isti kao ranije, npr. adm-post-image)
   *   name      ime polja u obrascu — po njemu ga čita čuvanje
   *   groups    grupe iz CW.IMAGES koje ulaze u biblioteku
   *   ratio     odnos okvira za pregled, npr. '3 / 2'
   *   recW/recH preporučene dimenzije, samo tekst ispod
   *   note      dodatna rečenica ispod preporuke
   */
  CW.adm.imagePicker = function (o) {
    var libOptions = CW.adm._imageOptions(o.groups || ['blog', 'brend']);

    return '' +
    '<div class="adm-media" data-media data-ratio="' + CW.esc(o.ratio || '3 / 2') + '">' +

      '<input type="hidden" id="' + CW.esc(o.id) + '" name="' + CW.esc(o.name) + '" value="">' +

      /* Okvir je istovremeno pregled slike i zona za prevlačenje. Dok je
         prazan pokazuje uputstvo, kad ima sliku pokazuje sliku. */
      '<div class="adm-media__drop" data-media-drop tabindex="0" role="button" ' +
           'aria-label="Prevuci sliku ovde ili pritisni da izabereš sa računara" ' +
           'style="aspect-ratio:' + CW.esc(o.ratio || '3 / 2') + '">' +

        '<div class="adm-media__prev" data-media-prev></div>' +

        '<div class="adm-media__empty" data-media-empty>' +
          CW.icon('package', 26) +
          '<b>Prevuci sliku ovde</b>' +
          '<span>ili pritisni da je izabereš sa računara</span>' +
          '<span class="adm-media__types">JPG · PNG · WebP — najviše 10 MB</span>' +
        '</div>' +

        '<div class="adm-media__busy hidden" data-media-busy>' +
          '<span class="spinner"></span><span>Obrađujem sliku…</span>' +
        '</div>' +
      '</div>' +

      '<input type="file" accept="image/*" hidden data-media-file>' +

      '<div class="adm-media__actions">' +
        '<button class="btn btn--ghost btn--sm" type="button" data-act="media-browse">' +
          CW.icon('inbox', 15) + 'Izaberi fajl' +
        '</button>' +
        '<button class="btn btn--quiet btn--sm hidden" type="button" data-act="media-clear" data-media-clear>' +
          CW.icon('trash', 15) + 'Ukloni' +
        '</button>' +
      '</div>' +

      '<div class="adm-media__meta hidden" data-media-meta></div>' +

      /* Biblioteka je i dalje tu, samo sklopljena — otpremanje je sada
         glavni put, a gotove slike izuzetak. */
      '<details class="adm-media__lib">' +
        '<summary>…ili uzmi gotovu sliku iz biblioteke</summary>' +
        '<select class="input mt-2" data-media-lib aria-label="Slika iz biblioteke">' +
          libOptions +
        '</select>' +
      '</details>' +

      (o.recW
        ? '<p class="t-xs mt-2">Preporučeno <strong>' + o.recW + ' × ' + o.recH + ' px</strong>' +
          (o.ratioLabel ? ' (' + CW.esc(o.ratioLabel) + ')' : '') + '. ' +
          (o.note ? CW.esc(o.note) : '') + '</p>'
        : '') +
    '</div>';
  };

  /* ======================================================================
     STANJE
     ====================================================================== */

  function root(el) { return el.closest('[data-media]'); }
  function hidden(box) { return box.querySelector('input[type=hidden]'); }

  /** Iscrtava okvir prema trenutnoj vrednosti polja. */
  function refresh(box) {
    var value = hidden(box).value;
    var prev = box.querySelector('[data-media-prev]');
    var empty = box.querySelector('[data-media-empty]');
    var clear = box.querySelector('[data-media-clear]');
    var meta = box.querySelector('[data-media-meta]');
    var ratio = box.getAttribute('data-ratio') || '3 / 2';

    if (!value) {
      prev.innerHTML = '';
      empty.classList.remove('hidden');
      clear.classList.add('hidden');
      meta.classList.add('hidden');
      meta.innerHTML = '';
      return;
    }

    empty.classList.add('hidden');
    clear.classList.remove('hidden');
    prev.innerHTML = CW.img(value, { ratio: ratio, fit: 'contain', ph: 'Pregled' });

    /* Otkud je slika — da korisnik zna da li je posetioci vide. */
    if (CW.isUploaded(value)) {
      var uDb = /^https?:/i.test(value);
      meta.classList.remove('hidden');
      meta.innerHTML = uDb
        ? '<span class="adm-media__ok">' + CW.icon('check', 14) + 'Otpremljeno — vide je posetioci.</span>'
        : '<span class="adm-media__warn">' + CW.icon('alert', 14) +
          '<b>Slika je samo u ovom pregledaču.</b> Baza još nije povezana, pa je ' +
          'posetioci ne vide i nestaje ako obrišeš podatke pregledača.</span>';
    } else {
      meta.classList.add('hidden');
      meta.innerHTML = '';
    }
  }

  /** Upisuje vrednost i javlja obrascu (čuvanje čita `change`). */
  function setValue(box, value) {
    var input = hidden(box);
    input.value = value || '';
    var lib = box.querySelector('[data-media-lib]');
    /* Ako je vrednost ključ iz biblioteke, neka se i padajući spisak slaže. */
    if (lib) lib.value = (value && !CW.isUploaded(value)) ? value : '';
    refresh(box);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  CW.adm.setImage = function (fieldId, value) {
    var input = document.getElementById(fieldId);
    if (!input) return;
    var box = root(input);
    if (box) setValue(box, value || '');
    else input.value = value || '';
  };

  function busy(box, on) {
    box.querySelector('[data-media-busy]').classList.toggle('hidden', !on);
    box.querySelector('[data-media-drop]').classList.toggle('is-busy', on);
  }

  function handleFile(box, file) {
    if (!file) return;
    busy(box, true);
    fileToSource(file)
      .then(function (r) {
        setValue(box, r.src);
        CW.toast(
          r.kept === 'baza'
            ? 'Slika je otpremljena (' + r.w + '×' + r.h + ', ' + Math.round(r.bytes / 1024) + ' KB).'
            : 'Slika je učitana (' + r.w + '×' + r.h + '). Čuva se u pregledaču dok baza nije povezana.',
          r.kept === 'baza' ? 'success' : 'warning'
        );
      })
      .catch(function (e) {
        CW.toast(e.message || 'Učitavanje slike nije uspelo.', 'error');
      })
      .then(function () { busy(box, false); });
  }

  /* ======================================================================
     DOGAĐAJI
     Delegirano na dokument: panel se iscrtava iznova pri svakoj promeni
     rute, pa vezivanje po elementu ne bi preživelo.
     ====================================================================== */

  document.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-act]') : null;
    var act = t && t.getAttribute('data-act');

    if (act === 'media-browse') {
      root(t).querySelector('[data-media-file]').click();
      return;
    }
    if (act === 'media-clear') {
      setValue(root(t), '');
      return;
    }

    /* Pritisak na sam okvir otvara birač fajlova — osim ako se cilja
       dugme unutar njega. */
    var drop = ev.target.closest ? ev.target.closest('[data-media-drop]') : null;
    if (drop && !ev.target.closest('[data-act]')) {
      root(drop).querySelector('[data-media-file]').click();
    }
  });

  /* Tastatura: okvir je role="button", pa mora da reaguje na Enter i razmak. */
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    var drop = ev.target.closest ? ev.target.closest('[data-media-drop]') : null;
    if (!drop) return;
    ev.preventDefault();
    root(drop).querySelector('[data-media-file]').click();
  });

  document.addEventListener('change', function (ev) {
    var el = ev.target;

    if (el.matches && el.matches('[data-media-file]')) {
      handleFile(root(el), el.files && el.files[0]);
      el.value = '';               /* isti fajl mora da može opet */
      return;
    }

    if (el.matches && el.matches('[data-media-lib]')) {
      setValue(root(el), el.value);
    }
  });

  /* ---- prevlačenje ----
     Pregledač podrazumevano OTVARA prevučeni fajl i napušta stranicu, čime
     bi se izgubio nesačuvan tekst objave. Zato se dragover gasi i na celom
     dokumentu, ne samo nad okvirom. */
  ['dragenter', 'dragover'].forEach(function (type) {
    document.addEventListener(type, function (ev) {
      if (!document.querySelector('[data-media]')) return;
      ev.preventDefault();
      var drop = ev.target.closest ? ev.target.closest('[data-media-drop]') : null;
      CW.qsa('[data-media-drop]').forEach(function (d) {
        d.classList.toggle('is-over', d === drop);
      });
    });
  });

  document.addEventListener('dragleave', function (ev) {
    var drop = ev.target.closest ? ev.target.closest('[data-media-drop]') : null;
    if (drop) drop.classList.remove('is-over');
  });

  document.addEventListener('drop', function (ev) {
    if (!document.querySelector('[data-media]')) return;
    ev.preventDefault();
    CW.qsa('[data-media-drop]').forEach(function (d) { d.classList.remove('is-over'); });

    var drop = ev.target.closest ? ev.target.closest('[data-media-drop]') : null;
    if (!drop) return;

    var dt = ev.dataTransfer;
    if (!dt) return;

    /* Prevučena može biti i slika sa druge stranice — tada nema fajla nego
       adresa. Primamo i to, jer je korisniku svejedno šta je prevukao. */
    var file = dt.files && dt.files[0];
    if (file) { handleFile(root(drop), file); return; }

    var url = dt.getData('text/uri-list') || dt.getData('text/plain');
    if (url && /^https?:\/\//i.test(url.trim())) {
      setValue(root(drop), url.trim());
      CW.toast('Slika je povezana sa druge adrese. Ako ta stranica obriše sliku, nestaće i ovde.', 'warning');
    }
  });

  /* ======================================================================
     BIBLIOTEKA — spisak gotovih slika
     Isti spisak koji je panel i ranije nudio; izdvojen ovde da ga birač
     nosi sa sobom umesto da ga svaki ekran gradi sam.
     ====================================================================== */
  CW.adm._imageOptions = function (groups) {
    var LABEL = {
      proizvod: 'Proizvodi',
      blog: 'Objave i baneri',
      brend: 'Brend',
      discord: 'Discord snimci'
    };
    var out = '<option value="">Bez slike iz biblioteke</option>';
    groups.forEach(function (g) {
      var keys = Object.keys(CW.IMAGES).filter(function (k) { return CW.IMAGES[k].group === g; });
      if (!keys.length) return;
      out += '<optgroup label="' + CW.esc(LABEL[g] || g) + '">';
      keys.forEach(function (k) {
        var m = CW.IMAGES[k];
        out += '<option value="' + CW.esc(k) + '">' + CW.esc(k) +
               (m.w ? '  (' + m.w + '×' + m.h + ')' : '') + '</option>';
      });
      out += '</optgroup>';
    });
    return out;
  };
})();
