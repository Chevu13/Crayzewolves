-- ============================================================================
--  WOLFPACK — DOPUNA 13: BANER OBJAVE (PC I MOBILNI)
--  ---------------------------------------------------------------------------
--  Pokreni u Supabase → SQL Editor. Sme da se pokrene više puta.
--
--  ---------------------------------------------------------------------------
--  ŠTA DODAJE
--
--  Objava sada ima do četiri slike, dva para:
--
--    1. NASLOVNA  — kartica na blogu i vrh članka
--         image               PC        1200 × 800 px   (3:2)
--         image_mobile        mobilni   1080 × 1920 px  (9:16)
--
--    2. BANER     — slajder na vrhu početne i sekcija „Saradnja"
--         image_banner        PC        2400 × 1000 px  (12:5)
--         image_banner_mobile mobilni   1080 × 1350 px  (4:5)
--
--  Zašto odvojeno: naslovna je 3:2, a baner je širok. Dok je slajder uzimao
--  naslovnu sliku, sajt ju je sekao po vrhu i dnu — natpis sa slike bi
--  ispao iz kadra i sudarao se sa naslovom koji sajt ispisuje preko nje.
--  Kad objava ima svoj baner, on ide ceo i bez naslova preko slike.
--
--  Polja za baner se u panelu otvaraju tek kad objava ide na slajder:
--  kvačica „Na glavnom baneru" ili rubrika „Partneri".
-- ============================================================================

alter table public.posts
  add column if not exists image_banner             text,
  add column if not exists image_banner_alt         text,
  add column if not exists image_banner_mobile      text,
  add column if not exists image_banner_mobile_alt  text;

comment on column public.posts.image_banner is
  'Široki baner za slajder na početnoj — PC, 2400 × 1000 px (12:5).';
comment on column public.posts.image_banner_mobile is
  'Baner za slajder na telefonu — 1080 × 1350 px (4:5).';


-- ============================================================================
-- PROVERA — ko ide na baner i ima li sliku za njega
-- ============================================================================

select title,
       in_hero,
       category_id,
       (image_banner is not null)        as baner_pc,
       (image_banner_mobile is not null) as baner_mobilni
  from public.posts
 where in_hero or category_id = 'partneri'
 order by published_at desc nulls last;
