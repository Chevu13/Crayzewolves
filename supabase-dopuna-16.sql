-- ============================================================================
--  WOLFPACK — DOPUNA 16: RAZVRSTAVANJE ZATEČENOG KATALOGA
--  ---------------------------------------------------------------------------
--  Pokreni u Supabase → SQL Editor. Već je pokrenuto 20. novembra 2026.
--
--  ---------------------------------------------------------------------------
--  ŠTA RADI
--
--  Dopuna 15 je napravila police na dva nivoa, ali su svih 59 merch artikala
--  i dalje stajali u staroj kategoriji „Dodaci". Ovo ih raspoređuje.
--
--  Spisak je izveden iz naziva i opisa svakog artikla i ZAPISAN RUČNO, par
--  po par. Namerno nije napisan kao pretraga po ključnim rečima: takav upit
--  bi na svakom sledećom pokretanju mogao da razvrsta drugačije, a „Charge
--  Stand" i „Charge Cable" se razlikuju u jednoj reči i idu u dve police.
--
--  ---------------------------------------------------------------------------
--  ŠTA NIJE DIRANO
--
--  „WOLFPACK — Digital Start" ostaje u staroj polici „Igre". To nije igra
--  nego usluga, pa ne pripada ni novoj polici „Digitalna izdanja i ključevi".
--  Gde tačno ide, zna samo prodavac.
--
--  ---------------------------------------------------------------------------
--  POVRATAK
--
--      update public.products set category_id = 'accessories' where shop = 'merch';
--
--  Pre ove dopune su svi merch artikli stajali u „Dodaci" (accessories), pa
--  je povratak jedan red.
-- ============================================================================

update public.products p
   set category_id = m.cat,
       updated_at = now()
  from (values
    -- Podloge za miš i sto ---------------------------------------------- 22
    ('ba17894b-fbd9-474e-a8a4-5cce6ffd7c4b','podloge'),  -- ABYstyle Batman XXL
    ('6828b9bd-11a1-4106-b999-d1231b51c1ea','podloge'),  -- ABYstyle One Piece XXL
    ('44a40e03-dd38-40a5-bc6b-c96949ec8aac','podloge'),  -- ASUS ROG Scabbard II
    ('e6a86680-c797-4c35-b8c6-0130b03b7a76','podloge'),  -- Call of Duty Oversize
    ('08301acd-d857-4309-93a7-9d70d9ec1b95','podloge'),  -- Defender Ultra Light
    ('a15f7d63-e209-4c5c-a94f-8a468b1ea590','podloge'),  -- Diablo IV Heroes XL
    ('770593f1-e291-42ef-b3ac-d69c260beeb6','podloge'),  -- Jujutsu Kaisen XL
    ('5768e74a-f53d-46e1-8260-af4891c9c69d','podloge'),  -- Logitech Desk Mat
    ('edb2b5d9-ec73-4111-96e6-5715c0cd7307','podloge'),  -- Lord of the Rings XL
    ('332388ba-63dd-4360-8a36-af55ee861fba','podloge'),  -- Razer Goliathus 3XL
    ('1c0a8d01-372b-4798-b586-58459e6a2be6','podloge'),  -- Rick and Morty XL
    ('1f8931a6-c2f7-4f18-bd8f-1ce03dca5504','podloge'),  -- South Park XL
    ('0cf2e08d-d88a-4d32-be69-877039573075','podloge'),  -- White Shark STORMBRINGER
    ('ed0bd809-a94c-4db4-befd-6c471449586f','podloge'),  -- White Shark DARKWATER
    ('d5958f27-44e9-4929-a289-65f9ff07dad3','podloge'),  -- White Shark LEVIATHAN
    ('0d4f273d-113d-4b59-a0a2-9132dc02eaaf','podloge'),  -- Wolfpack.rs Tactical
    ('8247ced6-8166-4611-b457-7bffe7d4f9a3','podloge'),  -- World of Tanks Mountain Fox
    ('e9da96da-92a3-4552-bc7a-29160afaa5cc','podloge'),  -- World of Tanks Out of the Woods
    ('e1fe540d-2b68-4b25-93c4-ab0d43778c98','podloge'),  -- World of Tanks TVP
    ('f1a217b6-5dfb-45ae-9696-62c45d641e71','podloge'),  -- WoW Alexstrasza and Dragon
    ('70b109f3-5bd1-42b9-a58d-39b6bd477910','podloge'),  -- WoW Dragonflight Clouds
    ('5dd5371d-fe7b-4e39-b37c-a2a97e422634','podloge'),  -- WoW Alexstrasza XL

    -- Bežične slušalice i bubice ----------------------------------------- 6
    ('0c486833-8374-49f1-9eb3-69fa1ad9f4eb','slusalice-bezicne'),  -- Canyon TWS-5
    ('e4e95795-b02f-49c6-b9f1-5b80cb090a91','slusalice-bezicne'),  -- Energy Chargeview TWS
    ('85d6d51e-579c-426f-b2ee-bac4d4b4ea7f','slusalice-bezicne'),  -- Genius HS-M920BT
    ('31b61596-55c2-4fb0-9c9f-07ade964b763','slusalice-bezicne'),  -- Transformers T51
    ('4479af5d-09bd-4de0-adda-8298f705b75c','slusalice-bezicne'),  -- Redmi Buds 6 Black
    ('7749c6ac-a436-4753-8eaa-da0f571568f7','slusalice-bezicne'),  -- Redmi Buds 6 White

    -- Mikrofoni ---------------------------------------------------------- 4
    ('8754455b-ef40-44a4-90e3-d27e0a56cd51','mikrofoni'),  -- HyperX QuadCast 2 S
    ('115ea2d8-2e0e-4e7d-ac06-a78c4ac5a88a','mikrofoni'),  -- Redragon Blazar GM300
    ('42e8417a-2f7f-4bb7-8b04-dcffd5a3f598','mikrofoni'),  -- Redragon Seyfert GM100
    ('f130ebc6-16ac-4e96-8c71-ff909ac1030e','mikrofoni'),  -- Trust GXT 232 Mantis

    -- Zvučnici ----------------------------------------------------------- 3
    ('8d515c2a-ad58-4d90-80ac-c36e6a03291e','zvucnici'),  -- Defender Crashboom
    ('b6846658-0b63-4909-ba34-6583db859a23','zvucnici'),  -- Energy Tower 5 MAX
    ('10368e98-f8d7-4913-b89d-1b5de6a08174','zvucnici'),  -- Redragon Stentor GS500

    -- Web kamere --------------------------------------------------------- 4
    ('94ccadb6-0e1a-4423-92b5-5d5651ad213d','web-kamere'),  -- Genius FaceCam 2000X2
    ('b14cde56-a0c7-4702-9149-249f742246d2','web-kamere'),  -- Logitech C920e
    ('80cdf704-868a-4853-bd26-db3af23222aa','web-kamere'),  -- Razer Kiyo V2 X
    ('8419fad9-9169-4e44-bb80-72d8e5471cff','web-kamere'),  -- White Shark GWC-005 BAT

    -- Gejming stolice ---------------------------------------------------- 3
    ('a807a763-8a68-454c-bdd9-2d056a8dc353','stolice'),  -- Cougar Armor One V2
    ('1319c607-e1c9-407e-b109-c1a040df8b11','stolice'),  -- Defender Dayto
    ('2f20bc21-1434-424c-853b-0ccd25260364','stolice'),  -- Defender Factor X

    -- Gejming stolovi ---------------------------------------------------- 1
    ('054fef5f-308d-459f-b29a-dfacbb56efa5','stolovi'),  -- Defender Spirit

    -- Kontroleri --------------------------------------------------------- 4
    ('acf6d1a3-a886-4934-87a7-eede96246230','kontroleri'),  -- DualSense Chroma Pearl
    ('378a2999-6464-45ce-ae2e-0d23894eedec','kontroleri'),  -- DualSense Midnight Black
    ('980ffa4a-09eb-4575-bc88-19c500841ad5','kontroleri'),  -- DualSense Nova Pink
    ('ab8ec1d9-e2d3-471d-a65e-e004dd826e90','kontroleri'),  -- DualSense Starlight Blue

    -- Stanice za punjenje kontrolera ------------------------------------- 4
    ('16d8790e-3150-4790-970e-47283fd79f82','punjaci-kontroler'),  -- Bigben PS5 stalak
    ('8d71135a-483e-4374-93ea-33064ab19330','punjaci-kontroler'),  -- Trust GXT 255
    ('8750664a-1390-45b2-b1be-6c8759c4f783','punjaci-kontroler'),  -- White Shark TAKEDOWN
    ('43824271-eb0c-4f50-b098-5c30f02eb9bf','punjaci-kontroler'),  -- White Shark CLINCH

    -- Navlake za analogne palice ----------------------------------------- 2
    ('ee71cf6b-3d84-4445-9fc0-f33c0bac7b82','navlake-palice'),  -- Trust Thumb Grips PS5
    ('1c58f9cd-c02c-423d-a754-ce9d9c6d95dc','navlake-palice'),  -- Trust Thumb Grips Xbox

    -- HDMI i DisplayPort kablovi ----------------------------------------- 2
    ('9bf7027d-f733-4835-8ee4-95063c19646b','kabl-hdmi'),  -- Gembird HDMI-DVI 1,8 m
    ('1c29dfce-baa3-4363-b0b1-e11825ac5c4c','kabl-hdmi'),  -- Stars Solutions HDMI 3 m

    -- USB i USB-C kablovi ------------------------------------------------ 1
    ('2aaa5aa2-bc75-4466-9dac-9ec62a8b769e','kabl-usb'),  -- Apple 60W USB-C 1 m

    -- Produžni kablovi --------------------------------------------------- 1
    ('c5758bdd-f8e6-4e78-adb4-8566a23e67cb','produzni'),  -- Gembird SPG6-B-10

    -- Zidni punjači ------------------------------------------------------ 2
    ('c589d696-f24c-4e54-9638-740006ef73e5','punjaci-zidni'),  -- Wekome WP-U25 GaN 35W
    ('3996a00c-7dd3-41ba-bece-af317151e0f6','punjaci-zidni')   -- Xiaomi Mi 67W Combo
  ) as m(pid, cat)
 where p.id = m.pid;

-- ----------------------------------------------------------------------------
-- REDOSLED
--
-- Svi artikli su do sada stajali na nuli, pa su strelice u panelu nizale iz
-- praznog. Ovim svaka polica dobija redosled po azbuci kao polaznu tačku —
-- odatle prodavac pomera šta hoće.
-- ----------------------------------------------------------------------------
with poredak as (
  select id, row_number() over (partition by category_id order by name) - 1 as n
    from public.products
   where is_active
)
update public.products p
   set sort_order = poredak.n
  from poredak
 where p.id = poredak.id;

-- ----------------------------------------------------------------------------
-- PROVERA
-- ----------------------------------------------------------------------------
do $$
declare v_ostalo integer;
begin
  select count(*) into v_ostalo
    from public.products where is_active and category_id = 'accessories';
  raise notice 'U staroj polici „Dodaci" je ostalo % artikala.', v_ostalo;
end;
$$;
