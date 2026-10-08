-- ============================================================================
--  WOLFPACK — DOPUNA 07: ZATVARANJE UNUTRAŠNJIH FUNKCIJA
--  ---------------------------------------------------------------------------
--  Pokreni u Supabase → SQL Editor. Sme da se pokrene više puta.
--
--  ---------------------------------------------------------------------------
--  ŠTA JE BILO OTVORENO
--
--  Supabase svaku funkciju iz šeme `public` objavljuje kao REST poziv
--  (/rest/v1/rpc/ime). Među njima su bile i one koje nikad ne sme da zove
--  posetilac:
--
--    assign_keys(order_id)   — dodeljuje Steam kodove porudžbini.
--                              Ko zna broj porudžbine, mogao je da potroši
--                              kodove bez ijedne uplate. (Pročitati ih ne bi
--                              mogao — `my_order_keys` traži plaćenu
--                              porudžbinu — ali roba bi bila zaključana.)
--    assign_keys_on_paid()   — okidač, nema šta da se zove spolja.
--    handle_new_user()       — okidač nad auth.users.
--    rls_auto_enable()       — pomoćna, iz postavke.
--
--  Ostaju otvorene samo one koje sajtu stvarno trebaju:
--    create_order   (kupovina),  is_admin   (panel),
--    my_order_keys  (kupac vidi svoje kodove),  setting_int (cene dostave).
--
--  Uz to: pet funkcija nije imalo fiksiran `search_path`, pa ih Supabase
--  linter prijavljuje kao rizik (podmetanje šeme). Sada ga imaju.
-- ============================================================================

revoke all on function public.assign_keys(uuid)        from public, anon, authenticated;
revoke all on function public.assign_keys_on_paid()    from public, anon, authenticated;
revoke all on function public.handle_new_user()        from public, anon, authenticated;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end $$;

-- Okidači rade kao vlasnik tabele, pa im oduzeta prava ništa ne smetaju.

alter function public.release_stock(uuid)              set search_path = public;
alter function public.reserve_stock(text, integer)     set search_path = public;
alter function public.log_order_status()               set search_path = public;
alter function public.touch_updated_at()               set search_path = public;
alter function public.next_order_number()              set search_path = public;


-- ============================================================================
-- PROVERA — ko sme šta da zove
-- ============================================================================

select p.proname,
       has_function_privilege('anon',          p.oid, 'execute') as anon,
       has_function_privilege('authenticated', p.oid, 'execute') as prijavljen
  from pg_proc p
 where p.pronamespace = 'public'::regnamespace
   and p.proname in ('assign_keys','assign_keys_on_paid','handle_new_user',
                     'create_order','is_admin','my_order_keys','setting_int')
 order by 1;
