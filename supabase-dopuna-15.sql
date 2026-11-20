-- ============================================================================
--  WOLFPACK — DOPUNA 15: KATEGORIJE NA DVA NIVOA
--  ---------------------------------------------------------------------------
--  Pokreni u Supabase → SQL Editor. Sme da se pokrene više puta.
--
--  ---------------------------------------------------------------------------
--  ŠTA DODAJE
--
--  Police u prodavnici su do sada bile ravan spisak. Katalog je u međuvremenu
--  narastao — računari, monitori, periferija, audio, konzole, igre, kablovi,
--  nameštaj — i ravan spisak od trideset stavki u levom meniju niko ne čita.
--
--  Zato kategorija dobija roditelja: `parent_id`. Dva nivoa, ne više:
--
--      Gejming periferija            ← nadkategorija
--        Miševi                      ← podkategorija
--        Tastature
--        Kompleti miša i tastature
--        Podloge za miš i sto
--
--  Proizvod se vezuje za PODkategoriju. Nadkategorija ga pokupi sama — njena
--  strana pokazuje sve iz svojih polica. Bez toga bi urednik morao da svaki
--  proizvod upiše dvaput, pa bi se dve liste razišle prvom sledećom izmenom.
--
--  ---------------------------------------------------------------------------
--  ZAŠTO BAŠ DVA NIVOA
--
--  Treći nivo bi tražio rekurzivni upit za nešto što se u meniju ionako ne
--  vidi. Kad zatreba, dodaje se bez izmene šeme — `parent_id` to već trpi.
--
--  ---------------------------------------------------------------------------
--  STARE KATEGORIJE
--
--  Ova dopuna NE BRIŠE ništa. Stare police (Dodaci, Odeća, Lifestyle…) ostaju
--  dok se proizvodi iz njih ne premeste, jer bi brisanje kategorije sa
--  proizvodima ostavilo šezdeset artikala bez police. Kad se isprazne, brišu
--  se iz panela, dugmetom.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. RODITELJ
-- ----------------------------------------------------------------------------
alter table public.shop_categories
  add column if not exists parent_id text references public.shop_categories(id) on delete set null;

create index if not exists shop_categories_parent_idx
  on public.shop_categories (parent_id);

-- Kategorija ne sme da bude sama sebi roditelj. Dublje petlje (A→B→A) ovde
-- ne proveravamo: panel nudi za roditelja samo kategorije bez roditelja, pa
-- se drugi nivo ne može ulančati.
alter table public.shop_categories
  drop constraint if exists shop_categories_parent_not_self;
alter table public.shop_categories
  add constraint shop_categories_parent_not_self check (parent_id is null or parent_id <> id);

-- ----------------------------------------------------------------------------
-- 2. NOVE POLICE
--
-- `on conflict do nothing` — ponovno pokretanje ne dira ono što je urednik
-- u međuvremenu preimenovao ili pomerio.
-- ----------------------------------------------------------------------------

-- Nadkategorije -------------------------------------------------------------
insert into public.shop_categories (id, name, slug, shop, icon, blurb, sort_order, parent_id) values
  ('racunari',   'Računari i laptopovi',      'racunari',   'merch', 'monitor', 'Gejming mašine, sklopljene i spremne.',      100, null),
  ('monitori',   'Monitori',                  'monitori',   'merch', 'monitor', 'Brzi paneli za takmičarsku igru.',           101, null),
  ('periferija', 'Gejming periferija',        'periferija', 'merch', 'mouse',   'Miševi, tastature i podloge.',               102, null),
  ('audio',      'Audio i striming oprema',   'audio',      'merch', 'zap',     'Slušalice, mikrofoni i kamere.',             103, null),
  ('konzole',    'Konzole i oprema',          'konzole',    'merch', 'package', 'Konzole, kontroleri i dodaci.',              104, null),
  ('video-igre', 'Video-igre',                'video-igre', 'merch', 'star',    'Fizička izdanja i ključevi.',                105, null),
  ('drustvene',  'Društvene igre',            'drustvene',  'merch', 'book',    'Igre za sto, za ekipu.',                     106, null),
  ('kablovi',    'Kablovi, adapteri i napajanje', 'kablovi','merch', 'zap',     'Ono bez čega ostalo ne radi.',               107, null),
  ('namestaj',   'Gejming nameštaj',          'namestaj',   'merch', 'package', 'Stolice i stolovi za duge sesije.',          108, null)
on conflict (id) do nothing;

-- Podkategorije -------------------------------------------------------------
insert into public.shop_categories (id, name, slug, shop, icon, blurb, sort_order, parent_id) values
  -- Računari i laptopovi
  ('racunari-desktop',  'Gejming računari',              'gejming-racunari',       'merch', 'monitor', null, 0, 'racunari'),
  ('racunari-laptop',   'Gejming laptopovi',             'gejming-laptopovi',      'merch', 'monitor', null, 1, 'racunari'),

  -- Monitori
  ('monitori-gejming',  'Gejming monitori',              'gejming-monitori',       'merch', 'monitor', null, 0, 'monitori'),

  -- Gejming periferija
  ('misevi',            'Miševi',                        'misevi',                 'merch', 'mouse',   null, 0, 'periferija'),
  ('tastature',         'Tastature',                     'tastature',              'merch', 'tag',     null, 1, 'periferija'),
  ('kompleti',          'Kompleti miša i tastature',     'kompleti-mis-tastatura', 'merch', 'package', null, 2, 'periferija'),
  ('podloge',           'Podloge za miš i sto',          'podloge',                'merch', 'sticker', null, 3, 'periferija'),

  -- Audio i striming oprema
  ('slusalice-mik',     'Gejming slušalice sa mikrofonom','gejming-slusalice',     'merch', 'zap',     null, 0, 'audio'),
  ('slusalice-bezicne', 'Bežične slušalice i bubice',    'bezicne-slusalice',      'merch', 'zap',     null, 1, 'audio'),
  ('mikrofoni',         'Mikrofoni',                     'mikrofoni',              'merch', 'zap',     null, 2, 'audio'),
  ('zvucnici',          'Zvučnici',                      'zvucnici',               'merch', 'zap',     null, 3, 'audio'),
  ('web-kamere',        'Web kamere',                    'web-kamere',             'merch', 'monitor', null, 4, 'audio'),

  -- Konzole i oprema
  ('konzole-uredjaji',  'Konzole',                       'konzole-uredjaji',       'merch', 'package', null, 0, 'konzole'),
  ('kontroleri',        'Kontroleri',                    'kontroleri',             'merch', 'package', null, 1, 'konzole'),
  ('punjaci-kontroler', 'Stanice za punjenje kontrolera','punjaci-kontrolera',     'merch', 'zap',     null, 2, 'konzole'),
  ('navlake-palice',    'Navlake za analogne palice',    'navlake-palice',         'merch', 'sticker', null, 3, 'konzole'),

  -- Video-igre
  ('igre-fizicke',      'Fizička izdanja',               'fizicka-izdanja',        'merch',   'star',  null, 0, 'video-igre'),
  ('igre-digitalne',    'Digitalna izdanja i ključevi',  'digitalna-izdanja',      'digital', 'zap',   null, 1, 'video-igre'),

  -- Društvene igre
  ('gospodari-magije',  'Gospodari magije',              'gospodari-magije',       'merch', 'book',    null, 0, 'drustvene'),

  -- Kablovi, adapteri i napajanje
  ('kabl-hdmi',         'HDMI i DisplayPort kablovi',    'hdmi-displayport',       'merch', 'zap',     null, 0, 'kablovi'),
  ('kabl-usb',          'USB i USB-C kablovi',           'usb-kablovi',            'merch', 'zap',     null, 1, 'kablovi'),
  ('adapteri',          'Adapteri i konverteri',         'adapteri',               'merch', 'zap',     null, 2, 'kablovi'),
  ('punjaci-zidni',     'Zidni punjači',                 'zidni-punjaci',          'merch', 'zap',     null, 3, 'kablovi'),
  ('produzni',          'Produžni kablovi',              'produzni-kablovi',       'merch', 'zap',     null, 4, 'kablovi'),

  -- Gejming nameštaj
  ('stolice',           'Gejming stolice',               'gejming-stolice',        'merch', 'package', null, 0, 'namestaj'),
  ('stolovi',           'Gejming stolovi',               'gejming-stolovi',        'merch', 'package', null, 1, 'namestaj')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 3. PROVERA
-- ----------------------------------------------------------------------------
do $$
declare
  v_nad integer;
  v_pod integer;
begin
  select count(*) into v_nad from public.shop_categories where parent_id is null;
  select count(*) into v_pod from public.shop_categories where parent_id is not null;
  raise notice 'Kategorije: % nadkategorija, % podkategorija.', v_nad, v_pod;
end;
$$;
