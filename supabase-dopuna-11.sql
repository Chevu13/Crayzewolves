-- ============================================================================
--  WOLFPACK — DOPUNA 11: SAMO JEDNA GLAVNA VEST
--  ---------------------------------------------------------------------------
--  Pokreni u Supabase → SQL Editor. Sme da se pokrene više puta.
--
--  ---------------------------------------------------------------------------
--  ŠTA JE BILO POKVARENO
--
--  Kvačica „Glavna vest" (`is_featured`) nije bila ograničena, pa je više
--  objava moglo da je nosi istovremeno. Sajt prikazuje samo prvu, pa kad bi
--  prodavac označio novu objavu, na sajtu se ništa ne bi promenilo — glavna
--  je i dalje bila ona starija.
--
--  Sada okidač skida oznaku sa svih ostalih čim se jedna označi.
-- ============================================================================

create or replace function public.one_featured_post()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_featured then
    update public.posts set is_featured = false
     where id <> new.id and is_featured;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_posts_one_featured on public.posts;
create trigger trg_posts_one_featured
  after insert or update of is_featured on public.posts
  for each row when (new.is_featured)
  execute function public.one_featured_post();

-- Zatečeno stanje: ostaje poslednja koju je prodavac dirao.
update public.posts set is_featured = false
 where is_featured
   and id <> (select id from public.posts where is_featured order by updated_at desc limit 1);


-- ============================================================================
-- PROVERA — sme da vrati najviše jedan red
-- ============================================================================

select title, published_at from public.posts where is_featured;
