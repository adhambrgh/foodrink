-- Add notification preferences and soft delete to profiles table

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notify_order boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_promo boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_system boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Index untuk soft delete
CREATE INDEX IF NOT EXIST

S profiles_deleted_at_idx ON public.profiles (deleted_at)
WHERE deleted_at IS NOT NULL;