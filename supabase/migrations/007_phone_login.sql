-- Phone login: nomor HP sebagai alias untuk mencari email akun
-- Tidak memakai Supabase Phone Auth / SMS. Nomor HP disimpan di profiles.phone.

-- 1. Jadikan nilai phone unik (append -dup1, -dup2, dst) agar bisa bikin unique index
-- tanpa hapus baris yg masih punya FK (orders, dll)
DO $$
DECLARE
  v_phone text;
  r record;
  dup_num integer;
BEGIN
  FOR v_phone IN (
    SELECT phone
    FROM public.profiles
    WHERE phone IS NOT NULL
    GROUP BY phone
    HAVING count(*) > 1
  ) LOOP
    dup_num := 0;
    FOR r IN (
      SELECT id FROM public.profiles
      WHERE phone = v_phone
      ORDER BY ctid  -- keep oldest unchanged
    ) LOOP
      dup_num := dup_num + 1;
      IF dup_num > 1 THEN
        UPDATE public.profiles
        SET phone = v_phone || '-dup' || (dup_num - 1)
        WHERE id = r.id;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 2. Unique index: 1 nomor HP = 1 akun aktif
create unique index if not exists profiles_phone_unique_idx
  on public.profiles (phone)
  where phone is not null;

-- RPC: cari email berdasarkan nomor HP (untuk login sebelum autentikasi)
-- security definer diperlukan karena RLS profiles membatasi akses own-profile/admin,
-- sedangkan lookup dilakukan oleh user anonim saat login.
create or replace function public.get_email_by_phone(p_phone text)
returns text
language plpgsql
security definer
set search_path = public
as $$
  select u.email
  from auth.users u
  join public.profiles p on p.id = u.id
  where p.phone = p_phone
    and p.deleted_at is null
  limit 1;
$$;

grant execute on function public.get_email_by_phone(text) to anon, authenticated;

-- Trigger handle_new_user ikut menyimpan nomor HP dari signup metadata
-- (options.data: { name, phone } pada supabase.auth.signUp)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone)
  values (
    new.id,
    new.email,
    case
      when new.raw_user_meta_data->>'phone' is not null
        and new.raw_user_meta_data->>'phone' <> ''
      then public.normalize_phone(new.raw_user_meta_data->>'phone')
      else null
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Normalisasi nomor HP di sisi database (08xx / 62xx / +62xx -> +62xxxxxxxxxx)
create or replace function public.normalize_phone(p_input text)
returns text
language plpgsql
immutable
as $$
declare
  v text := regexp_replace(trim(coalesce(p_input, '')), '[\s\-()]', '', 'g');
begin
  if v = '' then return null; end if;
  if v like '+%' then return v; end if;
  if v like '0%' then return '+62' || substr(v, 2); end if;
  if v like '62%' then return '+' || v; end if;
  return v;
end;
$$;
