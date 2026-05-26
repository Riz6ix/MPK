-- Rename 'Pending Anggaran' status to 'Pending' in public.aspirations check constraint and existing rows

-- 1. Drop the old check constraint first so we can update existing records to 'Pending'
ALTER TABLE public.aspirations 
DROP CONSTRAINT IF EXISTS aspirations_status_check;

-- 2. Update any existing records to the new 'Pending' status
UPDATE public.aspirations 
SET status = 'Pending' 
WHERE status = 'Pending Anggaran';

-- 3. Establish the updated check constraint accepting 'Pending' instead of 'Pending Anggaran'
ALTER TABLE public.aspirations 
ADD CONSTRAINT aspirations_status_check 
CHECK (status = ANY (ARRAY['Belum Diproses'::text, 'Sedang Ditinjau'::text, 'Selesai'::text, 'Anomali'::text, 'Pending'::text, 'Birokrasi'::text]));
