/* ==========================================================================
   CRAZYWOLVES — PODACI ZAJEDNICE
   --------------------------------------------------------------------------
   SVE ISPOD JE STVARNO. Ranija verzija ovog fajla sadržala je izmišljene
   igrače, trofeje, turnire i sponzore — to je uklonjeno.

   Izvor istine: brand guide v1.0 + zvanični Discord, Instagram (@crazywolves.rs)
   i objavljeni materijali brenda.

   Sve kolekcije su oblikovane kao API odgovori:
     CW.data.services  ->  GET /api/services
     CW.data.games     ->  GET /api/games
   Relacije idu preko ID-a, datumi su ISO stringovi.
   ========================================================================== */

window.CW = window.CW || {};
CW.data = CW.data || {};

/* ---------- pomoćne funkcije za datume ---------- */
(function () {
  var startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  CW.resolveDate = function (dayOffset, time) {
    var d = new Date(startOfToday.getTime());
    d.setDate(d.getDate() + (dayOffset || 0));
    if (time) {
      var parts = String(time).split(':');
      d.setHours(parseInt(parts[0], 10), parseInt(parts[1] || '0', 10), 0, 0);
    }
    return d.toISOString();
  };

  CW.today = startOfToday;
})();

/* ==========================================================================
   IDENTITET BRENDA
   ========================================================================== */
CW.brand = {
  name: 'CrazyWolves',
  full: 'CrazyWolves Community',
  hub: 'CrazyWolves Gaming Hub',
  tagline: 'The hunt never ends.',
  taglineSr: 'Lov se nikad ne završava.',
  /* Nasleđena poruka sa lockup grafike; ostaje kao potpis, ne kao slogan. */
  taglineLegacy: 'Jedan čopor. Jedan cilj. Bezbroj pobeda.',
  secondary: 'The hunt never ends.',
  positioning: 'The Home of Balkan Gamers',
  positioningSr: 'Dom balkanskih gejmera',
  positioningEn: 'The Home of Balkan Gamers',
  website: 'crazywolves.rs',
  discord: 'discord.gg/crazywolves',
  instagram: '@crazywolves.rs',
  status: 'Sajt je u izradi — Discord i Instagram su aktivni.'
};

/* ==========================================================================
   IGRE — tačno onako kako su podeljene na Discordu
   ========================================================================== */
CW.data.games = [
  { id: 'cs2',     name: 'Counter-Strike 2', short: 'CS2',     color: '#D4A24E', category: 'FPS',
    channels: ['latest-news', 'chat-and-memes', 'looking-for-squad', 'Duo', 'Squad'], hasTeam: true },
  { id: 'dota2',   name: 'Dota 2',           short: 'DOTA 2',  color: '#B4423A', category: 'MOBA',
    channels: ['latest-news', 'chat-and-play', 'Playing'], hasTeam: false },
  { id: 'lol',     name: 'League of Legends',short: 'LOL',     color: '#5B7C99', category: 'MOBA',
    channels: ['latest-news', 'chat-and-play', 'Playing'], hasTeam: false },
  { id: 'arc',     name: 'Arc Raiders',      short: 'ARC',     color: '#7CC00A', category: 'Extraction',
    channels: ['latest-news', 'chat-and-memes', 'searching-for-team', 'Duo', 'Trio'], hasTeam: false },
  { id: 'travian', name: 'Travian Legends',  short: 'TRAVIAN', color: '#B8752E', category: 'Strategija',
    channels: ['vesti-events', 'duals-sitters', 'official-travian', 'Travian Voice'], hasTeam: false },
  { id: 'gta',     name: 'GTA World / GTA 6',short: 'GTA',     color: '#8C5A34', category: 'Open world',
    channels: ['leonida-news', 'gta6-chat-and-memes', 'leonida-map', 'rumors-and-theories'], hasTeam: false }
];

/* ==========================================================================
   USLUGE — stvarna poslovna grana (izvor: zvanični Services materijal)
   ========================================================================== */
CW.data.services = [
  {
    id: 'gaming-store',
    icon: 'cart',
    name: 'CrazyWolves Gaming Store',
    blurb: 'Digitalni proizvodi i in-game predmeti za sve što igraš.',
    items: ['Igre i DLC', 'In-game valuta', 'Nalozi i boosting', 'Ekskluzivne ponude'],
    featured: true
  },
  {
    id: 'community-management',
    icon: 'users',
    name: 'Community Management',
    blurb: 'Gradimo, razvijamo i održavamo jake i aktivne zajednice.',
    items: ['Angažovanje članova', 'Moderatorska podrška', 'Rast zajednice', 'Organizacija događaja'],
    featured: true
  },
  {
    id: 'graphic-design',
    icon: 'sticker',
    name: 'Grafički dizajn i brending',
    blurb: 'Profesionalni dizajn koji predstavlja tvoj brend i ostavlja utisak.',
    items: ['Logotipi i baneri', 'Dizajn za društvene mreže', 'Brend identitet', 'Custom ilustracije'],
    featured: true
  },
  {
    id: 'discord-setup',
    icon: 'discord',
    name: 'Discord setup i automatizacija',
    blurb: 'Custom Discord serveri sa alatima i automatizacijom po meri zajednice.',
    items: ['Postavljanje servera', 'Botovi i automatizacija', 'Custom komande', 'Role i dozvole'],
    featured: true
  },
  {
    id: 'web-development',
    icon: 'monitor',
    name: 'Web i digitalna rešenja',
    blurb: 'Moderna, brza i sigurna rešenja za tvoje prisustvo na internetu.',
    items: ['Izrada sajtova', 'Landing stranice', 'E-commerce rešenja', 'Održavanje i podrška'],
    featured: false
  },
  {
    id: 'marketing',
    icon: 'zap',
    name: 'Marketing i promocija',
    blurb: 'Ciljane strategije za promociju brenda i rast publike.',
    items: ['Marketing na društvenim mrežama', 'Influenser promocije', 'Reklamne kampanje', 'Kreiranje sadržaja'],
    featured: false
  },
  {
    id: 'custom',
    icon: 'target',
    name: 'Custom zahtevi',
    blurb: 'Imaš specifičnu ideju? Fleksibilni smo i spremni da je realizujemo.',
    items: ['Rešenja po meri', 'Prilagođeno tvojim potrebama', 'Brza i pouzdana isporuka', 'Realizujemo ideju'],
    featured: false
  }
];

CW.data.serviceTrust = [
  { icon: 'shield',  title: 'Poverenje gejmera',  text: 'Razumemo gaming svet jer smo deo njega.' },
  { icon: 'zap',     title: 'Brzo i pouzdano',    text: 'Brzi odgovori i isporuka na vreme.' },
  { icon: 'users',   title: 'Posvećen tim',       text: 'Iskusni ljudi koji su tu da pomognu.' },
  { icon: 'star',    title: 'Garantovan kvalitet',text: 'Vrhunski kvalitet u svakoj usluzi.' }
];

/* ==========================================================================
   CS2 TIM — sponzorisani tim koji trenutno traži igrače
   Nema izmišljenog rostera. Ovo je otvoren poziv.
   ========================================================================== */
CW.data.cs2Team = {
  status: 'recruiting',
  headline: 'Ponosno sponzorišemo CS2 tim',
  subline: 'Gradimo ekipu. Jedan cilj. Pobeda.',
  intro: 'Pridruži se CrazyWolves CS2 timu i postani deo nečeg većeg.',
  offer: [
    { icon: 'shield',  title: 'Profesionalno okruženje', text: 'Treninzi, analiza i podrška za tvoj napredak.' },
    { icon: 'users',   title: 'Iskusan tim i podrška',   text: 'Rad sa iskusnim igračima i staff timom.' },
    { icon: 'zap',     title: 'Razvoj i napredak igrača',text: 'Fokus na tvoj individualni rast i zajednički uspeh.' },
    { icon: 'trophy',  title: 'Učešće na turnirima i ligama', text: 'Predstavljaj CrazyWolves na turnirima i ligama.' },
    { icon: 'target',  title: 'Konkurentna atmosfera',   text: 'Disciplina, komunikacija i timski duh.' },
    { icon: 'gift',    title: 'Podrška sponzora',        text: 'Oprema, uslovi i podrška za vrhunske rezultate.' },
    { icon: 'star',    title: 'Nagrade i benefiti',      text: 'Nagrade za uspeh i dodatni benefiti za članove tima.' }
  ],
  cta: 'Misliš da imaš šta treba? Otvori ticket na Discordu i prijavi se.'
};

/* Ostale igre još nemaju formirane timove — prikazuje se kao prazno stanje. */
CW.data.teams = [];
CW.data.players = [];

/* ==========================================================================
   PARTNERI — samo stvarni
   ========================================================================== */
CW.data.partnerTiers = [
  { id: 'official',  name: 'Zvanični partneri' },
  { id: 'open',      name: 'Otvoreno za saradnju' }
];

CW.data.partners = [
  {
    id: 'wolf3tv',
    name: 'WOLF3TV',
    tier: 'official',
    category: 'Streamer',
    since: '2026',
    image: 'partner-wolf3tv',
    blurb: 'Zvanična saradnja sa streamerom WOLF3TV — zajednički sadržaj, gostovanja i uzajamna podrška.' +
           'gostovanja i uzajamna podrška zajednica — jaka zajednica, gaming ' +
           'strast, uzajamna podrška, jedan cilj i pobeda.',
    values: ['Jaka zajednica', 'Gaming strast', 'Uzajamna podrška', 'Jedan cilj — pobeda', 'Jači zajedno'],
    url: '#'
  }
];

CW.data.partnerBenefits = [
  { icon: 'users',  title: 'Aktivna zajednica, ne broj pratilaca',
    text: 'Preko 700 članova na Discordu i 1.719 pratilaca na Instagramu. Ljudi koji se pojave u sredu uveče, ne kupljena lista.' },
  { icon: 'monitor',title: 'Integracija kroz ceo sistem',
    text: 'Discord objave, Instagram, TikTok, YouTube, Twitch i sajt — jedan identitet na svakoj površini.' },
  { icon: 'gift',   title: 'Deo koji ide zajednici',
    text: 'Svaka saradnja uključuje nešto što članovi stvarno dobiju — giveaway, popust ili pristup.' },
  { icon: 'zap',    title: 'Organizovano i bez haosa',
    text: 'Jedan kontakt, jasni rokovi, materijali stižu kad kažemo da stižu.' }
];

/* ==========================================================================
   STATISTIKA ZAJEDNICE — stvarni brojevi
   ========================================================================== */
CW.data.communityStats = [
  { id: 'discord',   value: '700+',   label: 'Članova na Discordu' },
  { id: 'instagram', value: '1.719',  label: 'Pratilaca na Instagramu' },
  { id: 'games',     value: '6',      label: 'Igara sa svojim kanalima' },
  { id: 'boosts',    value: '14/33',  label: 'Server boostova' },
  { id: 'services',  value: '7',      label: 'Usluga u ponudi' },
  { id: 'active',    value: '24/7',   label: 'Aktivna zajednica' }
];

/* ==========================================================================
   DISCORD — stvarna struktura servera
   ========================================================================== */
CW.data.discordSections = [
  {
    id: 'welcome', name: 'DOBRODOŠLI / WELCOME', image: 'discord-sidebar',
    blurb: 'Prvo što vidiš kad uđeš. Pravila, uloge i objašnjenje kako sve funkcioniše.',
    channels: ['welcome', 'rules', 'announcement', 'choose-roles', 'how-it-works', 'suggestions']
  },
  {
    id: 'business', name: 'Business & Marketing', image: 'discord-business',
    blurb: 'Poslovni deo servera — promocije partnera, usluge i wolfpack-store.',
    channels: ['partner-promotions', 'advertisements', 'services', 'wolfpack-store', 'discounts']
  },
  {
    id: 'community', name: 'Community', image: null,
    blurb: 'Srce servera. Ovde se priča, deli i organizuje.',
    channels: ['community-chat', 'community-week-x2', 'giveaways', 'veteran-lounge-bar', 'support']
  },
  {
    id: 'games', name: 'Kanali po igrama', image: 'discord-games',
    blurb: 'Svaka igra ima svoje vesti, chat i glasovne kanale za traženje ekipe.',
    channels: ['CS2', 'Dota 2', 'League of Legends', 'Arc Raiders', 'Travian Legends', 'GTA World']
  },
  {
    id: 'social', name: 'Social media', image: null,
    blurb: 'Sve objave sa Instagrama, YouTube-a, Twitch-a i TikTok-a na jednom mestu.',
    channels: ['website', 'instagram', 'youtube', 'streams', 'tik-tok']
  },
  {
    id: 'premium', name: 'Premium Area', image: 'discord-premium',
    blurb: 'Za boostere i premium članove — poseban chat, nagrade i glasovni kanal.',
    channels: ['premium-chat', 'premium-rewards', 'booster-chat', 'Premium voice']
  }
];

/* ==========================================================================
   VESTI — stvarne objave zajednice
   ========================================================================== */
CW.data.newsCategories = [
  { id: 'objave',    name: 'Objave' },
  { id: 'zajednica', name: 'Zajednica' },
  { id: 'usluge',    name: 'Usluge' },
  { id: 'shop',      name: 'Shop' },
  { id: 'partneri',  name: 'Partneri' },
  { id: 'timovi',    name: 'Timovi' }
];

CW.data.news = [
  {
    id: 'nova-era',
    title: 'Stiže nova era',
    dek: 'Kapije se zatvaraju. Vukovi se okupljaju. Gradi se nešto veće nego ikada pre.',
    categoryId: 'objave',
    author: 'CrazyWolves Team',
    dayOffset: -9,
    readMin: 3,
    featured: true,
    trending: true,
    image: 'discord-announce',
    tags: ['discord', 'objave'],
    body: [
      { type: 'p', text: 'CrazyWolves Discord je trenutno u rekonstrukciji. Tokom tog procesa pojedini delovi servera ostaju potpuno aktivni — zajednica ne staje.' },
      { type: 'h2', text: 'Ne pravimo još jedan server' },
      { type: 'p', text: 'Ovo je projekat koji menja način na koji se naša zajednica povezuje, igra i raste. Mesto gde se okupljaju gejmeri, stratezi, kreatori i takmičari.' },
      { type: 'quote', text: 'The hunt never ends.' },
      { type: 'p', text: 'Šta stiže? Ostani u toku — sve se najavljuje prvo na Discordu.' }
    ],
    relatedIds: ['sajt-u-izradi', 'partnerstvo-wolf3tv']
  },
  {
    id: 'sajt-u-izradi',
    title: 'Web sajt je u izradi',
    dek: 'CrazyWolves dobija svoj dom na internetu. Ovo je prva faza.',
    categoryId: 'objave',
    author: 'CrazyWolves Team',
    dayOffset: -4,
    readMin: 2,
    featured: false,
    trending: true,
    image: 'banner-website-soon',
    tags: ['sajt', 'objave'],
    body: [
      { type: 'p', text: 'Do sada je sve živelo na Discordu i Instagramu. Sajt je sledeći korak — jedno mesto gde stoje usluge, shop, zajednica i sve što radimo.' },
      { type: 'h2', text: 'Šta je već tu' },
      { type: 'list', items: [
        'Pregled svih sedam usluga koje nudimo.',
        'Zvanični shop sa prvim proizvodom.',
        'Poziv igračima za CS2 tim.',
        'Prikaz Discord servera i svega što u njemu ima.'
      ] },
      { type: 'p', text: 'Sadržaj se dopunjava kako zajednica raste. Predlozi idu u #suggestions.' }
    ],
    relatedIds: ['nova-era', 'usluge-otvorene']
  },
  {
    id: 'partnerstvo-wolf3tv',
    title: 'Zvanična saradnja sa WOLF3TV',
    dek: 'Jači zajedno — CrazyWolves i WOLF3TV potpisuju partnerstvo.',
    categoryId: 'partneri',
    author: 'CrazyWolves Team',
    dayOffset: -14,
    readMin: 2,
    featured: false,
    trending: true,
    image: 'partner-wolf3tv',
    tags: ['partneri'],
    body: [
      { type: 'p', text: 'WOLF3TV postaje zvanični partner CrazyWolves zajednice. Saradnja je nastala iz onoga što nam je zajedničko: jaka zajednica, gaming strast i uzajamna podrška.' },
      { type: 'h2', text: 'Šta to znači u praksi' },
      { type: 'p', text: 'Zajednički sadržaj, gostovanja i uzajamna promocija. Jedan cilj — pobeda. Jači zajedno.' },
      { type: 'p', text: 'Zainteresovan za saradnju? Otvori ticket ili piši preko stranice Kontakt.' }
    ],
    relatedIds: ['nova-era', 'usluge-otvorene']
  },
  {
    id: 'usluge-otvorene',
    title: 'Sedam usluga, jedan tim',
    dek: 'Gaming store, community management, dizajn, Discord setup, sajtovi, marketing i custom zahtevi.',
    categoryId: 'usluge',
    author: 'CrazyWolves Team',
    dayOffset: -20,
    readMin: 4,
    featured: false,
    trending: false,
    image: 'services-overview',
    tags: ['usluge'],
    body: [
      { type: 'p', text: 'Naš tim pruža pouzdana, brza i profesionalna rešenja prilagođena gejmerima i online zajednicama.' },
      { type: 'h2', text: 'Šta radimo' },
      { type: 'list', items: [
        'CrazyWolves Gaming Store — igre, DLC, in-game valuta, nalozi i boosting.',
        'Community Management — rast i održavanje aktivnih zajednica.',
        'Grafički dizajn i brending — logotipi, baneri, brend identitet.',
        'Discord setup i automatizacija — serveri, botovi, role i dozvole.',
        'Web i digitalna rešenja — sajtovi, landing stranice, e-commerce.',
        'Marketing i promocija — kampanje, influenseri, sadržaj.',
        'Custom zahtevi — sve ostalo što ti treba.'
      ] },
      { type: 'p', text: 'Za početak otvori support ticket na Discordu ili kontaktiraj člana staff tima.' }
    ],
    relatedIds: ['sajt-u-izradi', 'nova-era']
  },
  {
    id: 'cs2-prijave',
    title: 'Tražimo igrače za CS2 tim',
    dek: 'Gradimo ekipu. Prijave su otvorene preko Discord ticketa.',
    categoryId: 'timovi',
    author: 'CrazyWolves Team',
    dayOffset: -26,
    readMin: 3,
    featured: false,
    trending: false,
    image: 'banner-cs2-team',
    tags: ['cs2', 'timovi'],
    body: [
      { type: 'p', text: 'CrazyWolves ponosno sponzoriše CS2 tim i trenutno traži igrače. Nema zatvorenog kruga — prijava je otvorena svima koji misle da imaju šta treba.' },
      { type: 'h2', text: 'Šta nudimo igračima' },
      { type: 'list', items: [
        'Profesionalno okruženje — treninzi, analiza i podrška.',
        'Rad sa iskusnim igračima i staff timom.',
        'Fokus na individualni rast i zajednički uspeh.',
        'Učešće na turnirima i ligama pod CrazyWolves imenom.',
        'Disciplina, komunikacija i timski duh.',
        'Oprema, uslovi i podrška sponzora.',
        'Nagrade za uspeh i dodatni benefiti.'
      ] },
      { type: 'p', text: 'Otvori ticket i prijavi se odmah.' }
    ],
    relatedIds: ['nova-era', 'usluge-otvorene']
  },
  {
    id: 'solja-drop',
    title: 'Zvanična šolja je stigla',
    dek: 'Prvi proizvod u CrazyWolves shopu. Limitirano izdanje, napravljeno za vukove.',
    categoryId: 'shop',
    author: 'CrazyWolves Shop',
    dayOffset: -31,
    readMin: 2,
    featured: false,
    trending: false,
    image: 'product-mug',
    tags: ['shop'],
    body: [
      { type: 'p', text: 'Prvi zvanični CrazyWolves proizvod: keramička šolja sa grbom i porukom zajednice.' },
      { type: 'h2', text: 'Zašto baš šolja' },
      { type: 'p', text: 'Jer je prva stvar koju uzmeš ujutru i poslednja pre noćne sesije. Kvalitetna keramika za svakodnevnu upotrebu, dugotrajna štampa koja ne bledi, i poklon koji ima smisla za gejmera.' },
      { type: 'p', text: 'Limitirano izdanje. Naruči preko Discorda ili stranice proizvoda.' }
    ],
    relatedIds: ['sajt-u-izradi', 'usluge-otvorene']
  }
];

/* ==========================================================================
   DOGAĐAJI — stvarni, ponavljajući
   ========================================================================== */
CW.data.events = [
  {
    id: 'community-week',
    title: 'Community Week',
    kind: 'online',
    dayOffset: 3,
    time: '20:00',
    endTime: '23:59',
    location: 'CrazyWolves Discord',
    city: 'Online',
    capacity: 0,
    registered: 0,
    price: 'Besplatno',
    registrationOpen: true,
    featured: true,
    image: 'banner-server-guide',
    blurb: 'Nedelja zajednice — igranje, druženje i takmičenja kroz sve kanale servera. Najavljuje se u #community-week-x2.',
    details: [
      'Aktivnosti kroz sve igre na serveru.',
      'Otvoreno za sve članove, bez uslova.',
      'Raspored se objavljuje u #announcement.',
      'Nagrade za najaktivnije članove.'
    ]
  },
  {
    id: 'giveaway',
    title: 'Giveaway',
    kind: 'online',
    dayOffset: 7,
    time: '21:00',
    endTime: '22:00',
    location: '#giveaways na Discordu',
    city: 'Online',
    capacity: 0,
    registered: 0,
    price: 'Besplatno',
    registrationOpen: true,
    featured: false,
    image: null,
    blurb: 'Redovni giveaway za članove zajednice — igre, in-game predmeti i CrazyWolves proizvodi.',
    details: [
      'Učestvuju svi članovi Discorda.',
      'Uslovi se objavljuju uz svaki giveaway.',
      'Izvlačenje je javno, u glasovnom kanalu.',
      'Nagrade obezbeđuju CrazyWolves i partneri.'
    ]
  },
  {
    id: 'squad-night',
    title: 'Squad Night — traženje ekipe',
    kind: 'online',
    dayOffset: 1,
    time: '20:00',
    endTime: '00:00',
    location: 'Glasovni kanali po igrama',
    city: 'Online',
    capacity: 0,
    registered: 0,
    price: 'Besplatno',
    registrationOpen: true,
    featured: false,
    image: 'discord-games',
    blurb: 'Uđi u Duo ili Squad kanal svoje igre i nađi ekipu. Bez uslova, bez ranga, bez prijave.',
    details: [
      'CS2 — Duo i Squad kanali.',
      'Arc Raiders — Duo i Trio kanali.',
      'Dota 2 i LoL — Playing kanali.',
      'Travian — Travian Voice.'
    ]
  }
];

/* ==========================================================================
   O NAMA
   ========================================================================== */
CW.data.about = {
  mission: 'Da gejmerima damo pravi čopor kome pripadaju — mesto za takmičenje, napredak, vidljivost i zajedničke pobede.',
  vision: 'Da CrazyWolves preraste u kompletan gaming ekosistem i postane prepoznatljiv regionalni brend.',
  promise: 'Nikad ne loviš sam. Svaki član dobija svoje mesto u čoporu — podršku, priznanje i pravu priliku.',
  positioning: 'Centralno mesto koje okuplja gejmere — za igru, druženje i takmičenje.',
  story: [
    'Počeli smo kao Discord server za grupu gejmera. Danas nas je preko 700, kroz šest igara.',
    'Vuk preživljava kroz čopor, ne kroz samostalnu snagu. To je i cela ideja.'
  ],
  values: [
    { title: 'Snaga',      text: 'Takmičimo se da pobedimo, svaki put.' },
    { title: 'Odanost',    text: 'Čopor brine o svojima.' },
    { title: 'Disciplina', text: 'Priprema pre pompe.' },
    { title: 'Pripadnost', text: 'Svako nađe svoje mesto.' },
    { title: 'Ambicija',   text: 'Uvek gradimo ka nečem većem.' }
  ],
  /* Dugoročna vizija — kompletan gaming ekosistem */
  ecosystem: [
    { icon: 'discord',  name: 'Discord zajednica', status: 'active',  note: 'Preko 700 članova, šest igara.' },
    { icon: 'monitor',  name: 'Web sajt',          status: 'wip',     note: 'U izradi — ovo što gledaš.' },
    { icon: 'cart',     name: 'Gaming shop',       status: 'active',  note: 'Prvi proizvodi u ponudi.' },
    { icon: 'instagram',name: 'Instagram',         status: 'active',  note: '1.719 pratilaca.' },
    { icon: 'tiktok',   name: 'TikTok',            status: 'active',  note: 'Kratki sadržaj i klipovi.' },
    { icon: 'youtube',  name: 'YouTube',           status: 'active',  note: 'Duži sadržaj i highlights.' },
    { icon: 'twitch',   name: 'Twitch',            status: 'active',  note: 'Streamovi zajednice.' },
    { icon: 'book',     name: 'Gaming portal',     status: 'planned', note: 'Vesti i vodiči.' },
    { icon: 'link',     name: 'Affiliate mreža',   status: 'planned', note: 'Saradnja sa brendovima.' },
    { icon: 'trophy',   name: 'Organizacija turnira', status: 'planned', note: 'Sopstveni turniri.' },
    { icon: 'users',    name: 'Agencija za community management', status: 'active', note: 'Već deo usluga.' }
  ]
};

/* ==========================================================================
   PRAVILA ZAJEDNICE
   ========================================================================== */
CW.data.communityRules = [
  { title: 'Bez gatekeepinga, u bilo kom smeru', text: 'Niko nije previše nov ni previše dobar da bi pripadao. Sramoćenje zbog ranga ne prolazi.' },
  { title: 'Igraj da se takmičiš, ne da ponižavaš', text: 'Zezanje među svojima je u redu. Napadanje nekog ko tek uči nije.' },
  { title: 'Jedan glas u komunikaciji', text: 'Tokom meča drži kanal čistim. Između rundi može haos.' },
  { title: 'Bez uvreda, uznemiravanja i ciljanog vređanja', text: 'Trenutno uklanjanje. Za ovo ne postoji sistem od tri upozorenja.' },
  { title: 'Samopromocija ide u svoj kanal', text: 'Postoji kanal tačno za to.' },
  { title: 'Odluke staff tima se komentarišu, ne napadaju', text: 'Ne slažeš se? Piši u #suggestions.' },
  { title: 'Što se deli u serveru, ostaje u serveru', text: 'Bez slikanja tuđih poruka i iznošenja iz konteksta na druge servere.' },
  { title: 'Imaj razlog da si ovde', text: 'Da samo čitaš je u redu. Da si tu samo da prodaš — nije.' }
];

CW.data.communityBenefits = [
  { icon: 'users',    title: 'Prava zajednica, ne grupni chat', text: 'Glasovni kanali skoro svako veče i ljudi koji primete kad te nema.' },
  { icon: 'target',   title: 'Ekipa za svaku igru',   text: 'Duo, Squad i Trio kanali za svih šest igara. Uđeš i igraš.' },
  { icon: 'trophy',   title: 'Put do tima',           text: 'CS2 tim aktivno traži igrače. Prijava ide preko ticketa, otvorena je svima.' },
  { icon: 'gift',     title: 'Giveaway i nagrade',    text: 'Redovni giveaway za članove — igre, in-game predmeti i CrazyWolves proizvodi.' },
  { icon: 'star',     title: 'Premium Area',          text: 'Za boostere i premium članove: poseban chat, nagrade i glasovni kanal.' },
  { icon: 'shield',   title: 'Moderacija koja je tu', text: 'Staff tim je prisutan. Prijave se rešavaju istog dana, ne za nedelju dana.' }
];

CW.data.communityWays = [
  { title: 'Uđi u glasovni kanal',      text: 'Najlakši ulaz. Otvori Duo ili Squad kanal svoje igre i igraj.' },
  { title: 'Uzmi svoje uloge',          text: 'U #choose-roles biraš igre koje te zanimaju i vidiš samo te kanale.' },
  { title: 'Prijavi se za CS2 tim',     text: 'Otvori ticket ako misliš da imaš šta treba.' },
  { title: 'Učestvuj u giveaway-u',     text: 'Redovno u #giveaways, uslovi idu uz svaku objavu.' },
  { title: 'Predloži nešto',            text: 'Server se menja na osnovu #suggestions kanala.' },
  { title: 'Samo čitaj neko vreme',     text: 'Potpuno legitiman način da budeš deo ovoga. Bez pritiska.' }
];

/* ==========================================================================
   DRUŠTVENE MREŽE — stvarni nalozi
   ========================================================================== */
CW.data.socials = [
  { id: 'discord',   name: 'Discord',   handle: 'discord.gg/crazywolves', url: 'https://discord.gg/crazywolves' },
  { id: 'instagram', name: 'Instagram', handle: '@crazywolves.rs',        url: '#' },
  { id: 'tiktok',    name: 'TikTok',    handle: '@crazywolves.rs',        url: '#' },
  { id: 'youtube',   name: 'YouTube',   handle: 'CrazyWolves',            url: '#' },
  { id: 'twitch',    name: 'Twitch',    handle: 'CrazyWolves',            url: '#' }
];

/* ==========================================================================
   PRAZNE KOLEKCIJE
   Stranice za njih postoje i imaju uređena prazna stanja. Popunjavaju se
   iz admin panela u fazi 2 — ništa se ovde ne izmišlja.
   ========================================================================== */
CW.data.streams = [];
CW.data.matches = [];
CW.data.tournaments = [];
CW.data.achievements = [];
CW.data.memberHighlights = [];
CW.data.ugc = [];
