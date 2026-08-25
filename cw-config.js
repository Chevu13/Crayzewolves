/* ==========================================================================
   CRAZYWOLVES — PODEŠAVANJA
   --------------------------------------------------------------------------
   JEDINO mesto gde stoje ključevi. Ne traži ih po drugim fajlovima.

   Učitava se prvi, pre svih ostalih skripti.

   ---------------------------------------------------------------------------
   KAKO SE POPUNJAVA
   ---------------------------------------------------------------------------
   1. Napravi projekat na supabase.com (Region: Frankfurt — najbliži)
   2. Supabase → Settings → API
   3. Prekopiraj dve stvari:

        Project URL      →  url
        anon public key  →  anonKey

   4. Sačuvaj ovaj fajl i osveži sajt.

   Dok su polja prazna, sajt radi sa ugrađenim sadržajem, a admin panel radi
   lokalno (izmene se čuvaju u tvom pregledaču, posetioci ih ne vide).

   ---------------------------------------------------------------------------
   ZAŠTO anon KLJUČ SME DA STOJI OVDE
   ---------------------------------------------------------------------------
   Zato što je javan po nameni — svako ko otvori sajt može da ga pročita iz
   koda, i tako je zamišljeno. Zaštita nisu ključevi nego pravila (RLS) u
   bazi: anon sme da čita objavljene objave i aktivne proizvode, i ništa da
   ne piše.

   Ključ `service_role` NIKADA ne sme u ovaj fajl. On zaobilazi sva pravila
   i ko ga dobije može da obriše celu bazu. On živi samo u Supabase Edge
   funkcijama, gde ga Supabase sam ubacuje.
   ========================================================================== */

window.CW = window.CW || {};

CW.CONFIG = {
  supabase: {
    url: 'https://qesosyszxnzlnmwuhbaq.supabase.co',

    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlc29zeXN6eG56bG5td3VoYmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODg4OTQsImV4cCI6MjEwMzI2NDg5NH0.C4VqClYrUN6791MmlIgkwYe2iRTOBaCLi4_oDL4y88M',

    /* Bucket za slike koje se otpremaju iz panela. Napravi ga SQL skripta. */
    bucket: 'media'
  },

  /* Koliko sajt čeka bazu pre nego što se iscrta sa ugrađenim sadržajem.
     Bolje malo stariji sadržaj nego prazan ekran. */
  hydrateTimeoutMs: 2000
};
