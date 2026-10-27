-- ============================================================================
--  WOLFPACK — DOPUNA 12: OBJAVE NA GLAVNOM BANERU
--  ---------------------------------------------------------------------------
--  Pokreni u Supabase → SQL Editor. Sme da se pokrene više puta.
--
--  ---------------------------------------------------------------------------
--  ŠTA DODAJE
--
--  Vrh početne strane više nije jedna statična slika nego slajder objava.
--  Prodavac u panelu, u objavi, čekira „Na glavnom baneru" i ta objava ulazi
--  u slajder — sa svojim banerom, naslovom i linkom na ceo tekst.
--
--  Zašto nova kolona, a ne postojeća „Glavna vest" (`is_featured`): glavna
--  vest je po pravilu samo JEDNA (dopuna 11), a na baneru ih se smenjuje
--  više. To su dve različite odluke, pa su i dve kvačice.
--
--  Saradnje u dnu početne ne traže ništa novo: tamo se listaju objave iz
--  rubrike „partneri" (`category_id = 'partneri'`) koje imaju baner.
-- ============================================================================

alter table public.posts
  add column if not exists in_hero boolean not null default false;

comment on column public.posts.in_hero is
  'Objava se vrti na glavnom baneru početne strane (slajder).';


-- ============================================================================
-- PROVERA — šta se trenutno vrti na baneru
-- ============================================================================

select title, status, in_hero, is_featured, category_id
  from public.posts
 where in_hero or category_id = 'partneri'
 order by published_at desc nulls last;
