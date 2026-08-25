/* ==========================================================================
   CRAZYWOLVES — PODACI ZA SHOP I PODRŠKU
   --------------------------------------------------------------------------
   Ranija verzija je sadržala 16 izmišljenih proizvoda. Uklonjeni su.

   Ovde je samo ono što stvarno postoji:
     • Zvanična šolja — jedini fizički proizvod trenutno u ponudi
     • Gaming Store — digitalni proizvodi koji idu preko Discord ticketa
     • Najavljeni artikli — jasno označeni kao "uskoro", ne mogu se kupiti

   ⚠ CENE: iznosi ispod su predlog i moraju se potvrditi pre puštanja uživo.
     Traži `PROVERI CENU` kroz fajl.
   ========================================================================== */

window.CW = window.CW || {};
CW.data = CW.data || {};

CW.shopConfig = {
  currency: 'RSD',
  currencySymbol: 'RSD',
  currencyAfter: true,            /* 1.490 RSD, a ne RSD 1.490 */
  freeShippingThreshold: 400000,  /* 4.000 RSD */
  defaultShipping: 39000,         /* 390 RSD */
  taxIncluded: true,
  lowStockThreshold: 6,
  orderChannel: 'Discord ticket'
};

/* ==========================================================================
   KATEGORIJE
   ========================================================================== */
CW.data.categories = [
  { id: 'drinkware',   name: 'Šolje',              icon: 'mug',     blurb: 'Za 4 ujutru kad se niko nije javio da preuzme smenu.' },
  { id: 'apparel',     name: 'Odeća',              icon: 'shirt',   blurb: 'Majice i duksevi sa grbom. U pripremi.' },
  { id: 'accessories', name: 'Dodaci',             icon: 'sticker', blurb: 'Stikeri, podloge i sitnice. U pripremi.' },
  { id: 'digital',     name: 'Digitalni proizvodi',icon: 'zap',     blurb: 'Igre, DLC, in-game valuta i boosting preko Gaming Store-a.' }
];

CW.data.collections = [
  { id: 'zvanicno', name: 'Zvanična kolekcija', tagline: 'Napravljeno za vukove.',
    blurb: 'Proizvodi sa zvaničnim CrazyWolves grbom i porukom zajednice.' },
  { id: 'uskoro',   name: 'Uskoro',              tagline: 'U pripremi.',
    blurb: 'Artikli koji se pripremaju. Najava ide prvo na Discord i Instagram.' }
];

/* ==========================================================================
   OPCIJE VARIJANTI
   ========================================================================== */
CW.shopOptions = {
  colors: {
    black:    { id: 'black',    name: 'Crna',        hex: '#0B0B0A' },
    charcoal: { id: 'charcoal', name: 'Antracit',    hex: '#1C1712' },
    green:    { id: 'green',    name: 'Tamnozelena', hex: '#1E3226' },
    bone:     { id: 'bone',     name: 'Bela',        hex: '#E4DCC9' }
  },
  apparelSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  oneSize: ['Univerzalna']
};

CW.data.sizeGuides = {
  tee: {
    label: 'Majice i duksevi — mere u cm, odevni predmet položen ravno',
    cols: ['Veličina', 'Grudi', 'Dužina', 'Rukav'],
    rows: [
      ['S',   '51', '69', '20'],
      ['M',   '54', '72', '21'],
      ['L',   '57', '74', '22'],
      ['XL',  '60', '76', '23'],
      ['XXL', '63', '78', '24']
    ],
    note: 'Tabela je orijentaciona i biće potvrđena kada odeća uđe u proizvodnju.'
  }
};

/* ==========================================================================
   PROIZVODI
   ========================================================================== */
CW.data.products = [
  {
    /* ---- JEDINI STVARNI PROIZVOD ---- */
    id: 'solja-zvanicna',
    slug: 'zvanicna-solja',
    name: 'Zvanična CrazyWolves šolja',
    categoryId: 'drinkware',
    collectionId: 'zvanicno',
    price: 149000,          /* 1.490 RSD — PROVERI CENU */
    compareAt: null,
    badges: ['limited'],
    comingSoon: false,
    image: 'product-mug',
    shortDesc: 'Keramička šolja sa zvaničnim grbom i porukom zajednice. Limitirano izdanje — napravljeno za vukove.',
    description:
      'Prvi zvanični CrazyWolves proizvod. Grb i ime zajednice odštampani po celom obimu.' +
      'Kvalitetna keramika za svakodnevnu upotrebu i štampa koja ne bledi pranjem. Poklon koji ima smisla za gejmera, stratega ili vuka.',
    materials: 'Glazirana keramika. Zapremina oko 330 ml.',
    care: 'Može u mašinu za sudove. Ne koristiti abrazivna sredstva preko štampe.',
    story: 'Zašto baš šolja kao prvi proizvod? Jer je prva stvar koju uzmeš ujutru i poslednja pre noćne sesije.',
    highlights: [
      { icon: 'star',   title: 'Vrhunski kvalitet', text: 'Kvalitetna keramika za svakodnevnu upotrebu.' },
      { icon: 'shield', title: 'Trajna štampa',     text: 'Dugotrajna štampa koja ne bledi.' },
      { icon: 'gift',   title: 'Savršen poklon',    text: 'Za gejmere, ratnike i vukove.' }
    ],
    sizeGuide: null,
    images: ['Zvanična šolja — limitirano izdanje'],
    variants: [
      { id: 'solja-crna', size: 'Univerzalna', colorId: 'black', stock: 25 }
    ]
  },

  /* ---- NAJAVLJENO — ne može se kupiti, jasno označeno ---- */
  {
    id: 'majica-grb',
    slug: 'majica-grb',
    name: 'Majica sa grbom',
    categoryId: 'apparel',
    collectionId: 'uskoro',
    price: 0,
    compareAt: null,
    badges: [],
    comingSoon: true,
    image: null,
    shortDesc: 'Majica sa zvaničnim grbom na grudima. U pripremi — najava ide prvo na Discord.',
    description: 'Priprema se. Detalji o materijalu, veličinama i ceni biće objavljeni pre puštanja u prodaju.',
    materials: 'Biće objavljeno.',
    care: 'Biće objavljeno.',
    story: null,
    sizeGuide: 'tee',
    images: ['Majica — u pripremi'],
    variants: []
  },
  {
    id: 'duks-grb',
    slug: 'duks-grb',
    name: 'Duks sa grbom',
    categoryId: 'apparel',
    collectionId: 'uskoro',
    price: 0,
    compareAt: null,
    badges: [],
    comingSoon: true,
    image: null,
    shortDesc: 'Duks sa vezenim grbom. U pripremi.',
    description: 'Priprema se. Detalji o materijalu, veličinama i ceni biće objavljeni pre puštanja u prodaju.',
    materials: 'Biće objavljeno.',
    care: 'Biće objavljeno.',
    story: null,
    sizeGuide: 'tee',
    images: ['Duks — u pripremi'],
    variants: []
  },
  {
    id: 'stikeri',
    slug: 'stikeri',
    name: 'Set stikera',
    categoryId: 'accessories',
    collectionId: 'uskoro',
    price: 0,
    compareAt: null,
    badges: [],
    comingSoon: true,
    image: null,
    shortDesc: 'Die-cut stikeri sa grbom i wordmarkom. U pripremi.',
    description: 'Priprema se. Najava ide prvo na Discord i Instagram.',
    materials: 'Biće objavljeno.',
    care: 'Biće objavljeno.',
    story: null,
    sizeGuide: null,
    images: ['Stikeri — u pripremi'],
    variants: []
  }
];

/* ==========================================================================
   GAMING STORE — digitalni proizvodi, poručuju se preko Discord ticketa
   ========================================================================== */
CW.data.gamingStore = {
  intro: 'Digitalni proizvodi i in-game predmeti za sve što igraš. Poručuje se ' +
         'preko ticketa na Discordu — javi šta ti treba i dobijaš ponudu.',
  groups: [
    { id: 'igre',     icon: 'zap',    name: 'Igre i DLC',        text: 'Ključevi za igre i dodatni sadržaj.' },
    { id: 'valuta',   icon: 'tag',    name: 'In-game valuta',    text: 'Valuta i krediti za popularne naslove.' },
    { id: 'nalozi',   icon: 'user',   name: 'Nalozi i boosting', text: 'Nalozi i podizanje ranga.' },
    { id: 'ponude',   icon: 'gift',   name: 'Ekskluzivne ponude',text: 'Popusti dostupni članovima zajednice.' }
  ],
  cta: 'Otvori ticket na Discordu'
};

/* ==========================================================================
   KUPONI — demonstracija; u produkciji se proverava na serveru
   ========================================================================== */
CW.data.coupons = [
  { code: 'COPOR10',  type: 'percent',  value: 10,    minSpend: 0,      label: '10% popusta na porudžbinu' },
  { code: 'DOSTAVA',  type: 'shipping', value: 0,     minSpend: 200000, label: 'Besplatna dostava preko 2.000 RSD' }
];

/* ==========================================================================
   DOSTAVA I PLAĆANJE
   ⚠ PROVERI: kuriri, cene i rokovi moraju se potvrditi pre puštanja uživo.
   ========================================================================== */
CW.data.shippingMethods = [
  { id: 'kurir',   name: 'Kurirska dostava',  eta: '2–4 radna dana', price: 39000, desc: 'Dostava na adresu, praćenje pošiljke.' },
  { id: 'licno',   name: 'Lično preuzimanje', eta: 'Po dogovoru',    price: 0,     desc: 'Dogovara se preko Discorda.' }
];

CW.data.paymentMethods = [
  { id: 'pouzece', name: 'Plaćanje pouzećem', desc: 'Plaćaš kuriru pri preuzimanju.' },
  { id: 'racun',   name: 'Uplata na račun',   desc: 'Šaljemo predračun, roba ide po evidentiranoj uplati.' },
  { id: 'kartica', name: 'Kartica',           desc: 'U pripremi — biće dostupno uskoro.' }
];

/* ==========================================================================
   DEMO NALOG — za prikaz stranica naloga
   ========================================================================== */
CW.data.demoAccount = {
  firstName: 'Vuk',
  lastName: 'Rajović',
  email: 'vuk@primer.rs',
  phone: '+381 60 000 0000',
  memberSince: '2025-11-02',
  discordHandle: 'vuk.rs',
  addresses: [
    { id: 'a1', label: 'Kuća', name: 'Vuk Rajović', line1: 'Bulevar kralja Aleksandra 73', line2: 'Stan 12',
      city: 'Beograd', postcode: '11000', country: 'Srbija', phone: '+381 60 000 0000', isDefault: true }
  ],
  orders: []
};

/* ==========================================================================
   ČESTA PITANJA
   ========================================================================== */
CW.data.faqCategories = [
  { id: 'zajednica', name: 'Zajednica i Discord' },
  { id: 'timovi',    name: 'Timovi i prijave' },
  { id: 'usluge',    name: 'Usluge' },
  { id: 'shop',      name: 'Shop i porudžbine' }
];

CW.data.faqs = [
  { id: 'f1', categoryId: 'zajednica', q: 'Kako da se pridružim zajednici?',
    a: 'Klikni na „Uđi u čopor“ bilo gde na sajtu. Nema prijave ni provere — unutra si odmah.' },
  { id: 'f2', categoryId: 'zajednica', q: 'Moram li da budem dobar u igrama?',
    a: 'Ne. Veliki deo servera uopšte ne igra takmičarski. Da samo čitaš i pratiš je potpuno legitiman način da budeš deo ovoga.' },
  { id: 'f3', categoryId: 'zajednica', q: 'Kako da nađem ekipu za igranje?',
    a: 'Svaka igra ima svoje glasovne kanale — Duo, Squad, Trio ili Playing. Uđeš u kanal i igraš. Ne treba nikakva najava.' },
  { id: 'f4', categoryId: 'zajednica', q: 'Šta je Premium Area?',
    a: 'Deo servera za boostere i premium članove: poseban chat, nagrade i sopstveni glasovni kanal.' },
  { id: 'f5', categoryId: 'zajednica', q: 'Kako biram koje kanale vidim?',
    a: 'U kanalu #choose-roles biraš igre koje te zanimaju. Server ti prikazuje samo te sekcije, pa lista ostaje pregledna.' },

  { id: 'f6', categoryId: 'timovi', q: 'Kako da se prijavim za CS2 tim?',
    a: 'Otvori ticket na Discordu i prijavi se. Prijave su otvorene svima — tim se trenutno gradi i traži igrače.' },
  { id: 'f7', categoryId: 'timovi', q: 'Šta dobijam kao član tima?',
    a: 'Treninge i analizu, učešće na turnirima pod CrazyWolves imenom, podršku sponzora i nagrade za rezultate.' },
  { id: 'f8', categoryId: 'timovi', q: 'Da li postoje timovi za druge igre?',
    a: 'Trenutno se formira samo CS2 tim. Ostale igre imaju aktivne zajednice i glasovne kanale, a timovi se otvaraju kako zajednica raste.' },

  { id: 'f9', categoryId: 'usluge', q: 'Koje usluge nudite?',
    a: 'Sedam — od Gaming Store-a i Discord setupa do izrade sajtova i marketinga. Ceo spisak je na stranici Usluge.' },
  { id: 'f10', categoryId: 'usluge', q: 'Kako da naručim uslugu?',
    a: 'Otvori ticket na Discordu ili nam piši preko stranice Kontakt. Javljamo se u roku od dva radna dana.' },
  { id: 'f11', categoryId: 'usluge', q: 'Radite li i za zajednice van gaminga?',
    a: 'Da. Community management, dizajn i izrada sajtova ne zavise od teme zajednice.' },

  { id: 'f12', categoryId: 'shop', q: 'Šta je trenutno u prodaji?',
    a: 'Zvanična CrazyWolves šolja. Majice, duksevi i stikeri su u pripremi i biće najavljeni prvo na Discordu i Instagramu.' },
  { id: 'f13', categoryId: 'shop', q: 'Kako naručujem?',
    a: 'Preko korpe na sajtu ili preko ticketa na Discordu — kako ti je lakše.' },
  { id: 'f14', categoryId: 'shop', q: 'Kako se plaća?',
    a: 'Pouzećem kuriru ili uplatom na račun. Plaćanje karticom je u pripremi.' },
  { id: 'f15', categoryId: 'shop', q: 'Koliko traje dostava?',
    a: 'Kurirska dostava je 2–4 radna dana. Lično preuzimanje se dogovara preko Discorda.' },
  { id: 'f16', categoryId: 'shop', q: 'Mogu li da vratim proizvod?',
    a: 'Da, u roku od 14 dana od prijema, ako je proizvod nekorišćen i u originalnom pakovanju. Detalji su na stranici Reklamacije i povraćaj.' }
];

/* ==========================================================================
   PRAVNI TEKSTOVI
   ⚠ Sve označeno sa needsReview mora proći pravnu proveru pre puštanja uživo.
   ========================================================================== */
CW.data.policies = {
  shipping: {
    title: 'Dostava',
    updated: '2026-07-31',
    needsReview: true,
    reviewNote: 'Kuriri, cene dostave, rokovi i teritorija isporuke moraju se potvrditi pre puštanja sajta uživo.',
    intro: 'Kako, kada i gde stiže tvoja porudžbina.',
    sections: [
      { id: 'obrada', title: 'Obrada porudžbine', body: [
        'Porudžbine se pakuju radnim danima. Porudžbina primljena do 14 časova ide istog dana, sve posle toga sledećeg radnog dana.',
        'PROVERI: tačno radno vreme magacina i dane pakovanja.'
      ] },
      { id: 'nacini', title: 'Načini i cena dostave', body: [
        'Kurirska dostava — 2–4 radna dana, 390 RSD, sa praćenjem pošiljke.',
        'Lično preuzimanje — besplatno, termin se dogovara preko Discorda.',
        'Dostava je besplatna za porudžbine preko 4.000 RSD.',
        'PROVERI: naziv kurirske službe i tačne cene.'
      ] },
      { id: 'inostranstvo', title: 'Slanje van Srbije', body: [
        'PROVERI: da li se šalje u region i pod kojim uslovima. Ako se šalje, ovde ide rok, cena i ko snosi carinske troškove.'
      ] },
      { id: 'pracenje', title: 'Praćenje pošiljke', body: [
        'Broj za praćenje stiže na email čim pošiljka napusti magacin. Ako imaš nalog, vidiš ga i na stranici porudžbine.'
      ] },
      { id: 'problemi', title: 'Izgubljene ili oštećene pošiljke', body: [
        'Ako kurir potvrdi da je pošiljka izgubljena, šaljemo zamenu ili vraćamo novac — po tvom izboru.',
        'Ako proizvod stigne oštećen, pošalji fotografiju u roku od 48 sati i rešavamo zamenu o našem trošku.'
      ] }
    ]
  },

  returns: {
    title: 'Reklamacije i povraćaj',
    updated: '2026-07-31',
    needsReview: true,
    reviewNote: 'Rokovi i prava potrošača moraju se uskladiti sa Zakonom o zaštiti potrošača Republike Srbije. Obavezna provera kod pravnika pre puštanja uživo.',
    intro: 'Ako ti ne odgovara ili nije ono čemu si se nadao — vrati.',
    sections: [
      { id: 'rok', title: 'Rok za povraćaj', body: [
        'Imaš 14 dana od dana prijema da pokreneš povraćaj. Proizvod mora biti nekorišćen i u originalnom pakovanju.',
        'PROVERI: zakonski rok i uslovi prema važećem Zakonu o zaštiti potrošača.'
      ] },
      { id: 'kako', title: 'Kako se pokreće', body: [
        'Pošalji poruku sa brojem porudžbine preko stranice Kontakt ili preko Discord ticketa.',
        'Dobijaš referentni broj i adresu za slanje. Referentni broj obavezno stavi u paket.',
        'Novac se vraća na isti način plaćanja u roku od 14 dana od prijema i provere robe.'
      ] },
      { id: 'trosak', title: 'Trošak vraćanja', body: [
        'Trošak vraćanja snosi kupac, osim ako je proizvod stigao neispravan, oštećen ili pogrešan — tada trošak snosimo mi.'
      ] },
      { id: 'reklamacija', title: 'Reklamacija na saobraznost', body: [
        'PROVERI: rok saobraznosti i postupak reklamacije prema važećem zakonu.',
        'Ništa u ovom dokumentu ne umanjuje tvoja zakonska prava.'
      ] }
    ]
  },

  privacy: {
    title: 'Politika privatnosti',
    updated: '2026-07-31',
    needsReview: true,
    reviewNote: 'Obavezna provera kod pravnika prema Zakonu o zaštiti podataka o ličnosti RS i GDPR-u. Moraju se potvrditi pravni osnov obrade, rokovi čuvanja, spisak obrađivača i postupak po zahtevu lica.',
    intro: 'Šta prikupljamo, zašto, i šta možeš da tražiš od nas.',
    sections: [
      { id: 'rukovalac', title: 'Ko smo mi', body: [
        'CrazyWolves Community je rukovalac podacima prikupljenim preko ovog sajta.',
        'PROVERI: pun naziv pravnog lica, adresa sedišta i matični broj moraju se upisati pre puštanja uživo.'
      ] },
      { id: 'sta', title: 'Šta prikupljamo', body: [
        'Podaci naloga — ime, email adresa, lozinka u kriptovanom obliku i adrese za dostavu koje sačuvaš.',
        'Podaci porudžbine — šta si naručio, adresa dostave, iznos i status plaćanja. Podatke platne kartice ne vidimo niti čuvamo.',
        'Komunikacija — poruke poslate preko kontakt forme i prepiska sa podrškom.',
        'Tehnički podaci — IP adresa, tip pregledača i posećene stranice, radi održavanja sajta.'
      ] },
      { id: 'zasto', title: 'Zašto to prikupljamo', body: [
        'Da bismo izvršili porudžbinu i pružili podršku — neophodno za izvršenje ugovora sa tobom.',
        'Za slanje newslettera, ako si se izričito prijavio. Odjava je moguća u svakom trenutku.',
        'Radi ispunjenja zakonskih i računovodstvenih obaveza.'
      ] },
      { id: 'kome', title: 'Kome prosleđujemo', body: [
        'Kurirskoj službi, isključivo radi isporuke.',
        'Pružaocu usluge slanja email-a, ako si prijavljen na newsletter.',
        'Podatke ne prodajemo.',
        'PROVERI: pun spisak obrađivača i lokacija obrade mora se objaviti pre puštanja uživo.'
      ] },
      { id: 'prava', title: 'Tvoja prava', body: [
        'Možeš tražiti pristup podacima koje čuvamo, ispravku netačnih podataka, brisanje, ograničenje obrade, prigovor na obradu ili prenos podataka drugom rukovaocu.',
        'Zahtev šalješ preko stranice Kontakt. Odgovaramo u roku od 30 dana.'
      ] },
      { id: 'cuvanje', title: 'Koliko čuvamo', body: [
        'PROVERI: tačni rokovi čuvanja moraju se potvrditi pravnom proverom.'
      ] }
    ]
  },

  terms: {
    title: 'Uslovi korišćenja',
    updated: '2026-07-31',
    needsReview: true,
    reviewNote: 'Merodavno pravo, nadležnost suda, ograničenje odgovornosti i uslovi potrošačkog ugovora moraju se sastaviti ili proveriti kod pravnika.',
    intro: 'Pravila koja važe kad koristiš ovaj sajt ili kupuješ iz shopa.',
    sections: [
      { id: 'prihvatanje', title: 'Prihvatanje uslova', body: [
        'Korišćenjem sajta ili slanjem porudžbine prihvataš ove uslove. Ako se ne slažeš sa njima, molimo te da ne koristiš sajt.'
      ] },
      { id: 'nalog', title: 'Tvoj nalog', body: [
        'Odgovoran si za čuvanje pristupnih podataka i za sve što se dešava pod tvojim nalogom.',
        'Podaci moraju biti tačni. Nalozi sa lažnim podacima ili korišćeni za lažne porudžbine mogu biti suspendovani.'
      ] },
      { id: 'porudzbine', title: 'Porudžbine i cene', body: [
        'Porudžbina je ponuda za kupovinu koju prihvatamo slanjem robe. Možemo odbiti porudžbinu — na primer ako artikla nema na stanju ili je cena greškom pogrešno prikazana.',
        'Cene su u dinarima. Troškovi dostave se prikazuju odvojeno pre plaćanja.'
      ] },
      { id: 'zig', title: 'Intelektualna svojina', body: [
        'Naziv CrazyWolves, grb sa vukom, wordmark i sav sadržaj sajta pripadaju CrazyWolves zajednici.',
        'Članovi zajednice smeju da koriste grb u avatarima, stream overlay-ima i klipovima uz navođenje izvora. Nije dozvoljena prodaja proizvoda sa našim znakom niti predstavljanje kao zvanični partner bez pisanog dogovora.'
      ] },
      { id: 'ponasanje', title: 'Ponašanje u zajednici', body: [
        'Discord i ostali kanali zajednice podležu pravilima objavljenim na stranici Zajednica. Teže povrede — uznemiravanje, uvrede i ciljano vređanje — vode trenutnom uklanjanju.'
      ] },
      { id: 'odgovornost', title: 'Ograničenje odgovornosti', body: [
        'PROVERI: klauzulu o ograničenju odgovornosti mora sastaviti pravnik. Ništa u ovim uslovima ne isključuje odgovornost koja se po zakonu ne može isključiti.'
      ] },
      { id: 'pravo', title: 'Merodavno pravo', body: [
        'PROVERI: merodavno pravo i nadležnost suda moraju se potvrditi pre puštanja uživo.'
      ] }
    ]
  },

  cookies: {
    title: 'Kolačići',
    updated: '2026-07-31',
    needsReview: true,
    reviewNote: 'Kategorije kolačića i mehanizam pristanka moraju se uskladiti sa propisima i sa kolačićima koje produkciona verzija stvarno postavlja.',
    intro: 'Šta čuvamo u tvom pregledaču i čemu služi.',
    sections: [
      { id: 'sta', title: 'Šta su kolačići', body: [
        'Kolačići su male datoteke koje sajt čuva u tvom pregledaču. Neki su neophodni da bi sajt uopšte radio, drugi pomažu da razumemo kako se sajt koristi.'
      ] },
      { id: 'kategorije', title: 'Koje koristimo', body: [
        'Neophodni — sesija, korpa i pamćenje da si prijavljen. Ovi se ne mogu isključiti.',
        'Preferencije — pamćenje izbora filtera i sortiranja u shopu, i tvoje odluke o kolačićima.',
        'Analitika — anonimno merenje posete, samo uz tvoj pristanak.',
        'Ne koristimo kolačiće za oglašavanje niti za praćenje između sajtova.'
      ] },
      { id: 'kontrola', title: 'Upravljanje kolačićima', body: [
        'Izbor možeš promeniti u svakom trenutku preko linka u podnožju sajta, ili brisanjem kolačića kroz podešavanja pregledača.',
        'Blokiranje neophodnih kolačića onemogućava korpu i prijavu.'
      ] }
    ]
  }
};

/* ==========================================================================
   POVERENJE — prikazuje se u shopu
   ========================================================================== */
CW.data.shopTrust = [
  { icon: 'truck',  title: 'Dostava 2–4 radna dana', text: 'Kurirska služba, sa praćenjem pošiljke.' },
  { icon: 'refresh',title: 'Povraćaj u roku od 14 dana', text: 'Nekorišćeno, u originalnom pakovanju.' },
  { icon: 'discord',title: 'Podrška na Discordu',    text: 'Otvori ticket — odgovor stiže isti dan.' },
  { icon: 'shield', title: 'Zvanični proizvodi',     text: 'Direktno od CrazyWolves zajednice.' }
];
