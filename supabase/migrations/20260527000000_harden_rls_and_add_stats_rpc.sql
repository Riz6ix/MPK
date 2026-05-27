-- ============================================================
-- Migration: Harden RLS INSERT policy + Add length constraints
-- Tanggal: 2026-05-27
-- ============================================================

-- 1. Hapus policy INSERT lama yang terlalu permisif (WITH CHECK (true))
DROP POLICY IF EXISTS "Siapapun dapat mengirim aspirasi." ON public.aspirations;

-- 2. Buat policy INSERT baru dengan validasi panjang konten
--    Mencegah spam konten raksasa bypass API langsung via supabase-js
CREATE POLICY "Kiriman aspirasi harus memenuhi batas panjang karakter" ON public.aspirations
    FOR INSERT WITH CHECK (
        content IS NOT NULL AND
        char_length(content) >= 10 AND
        char_length(content) <= 2000 AND
        char_length(name) <= 100 AND
        char_length(class) <= 50
    );

-- 3. Tambah CHECK constraint langsung di tabel sebagai second layer of defense
ALTER TABLE public.aspirations
    ADD CONSTRAINT aspirations_content_length
    CHECK (char_length(content) >= 10 AND char_length(content) <= 2000);

ALTER TABLE public.aspirations
    ADD CONSTRAINT aspirations_name_length
    CHECK (name IS NULL OR char_length(name) <= 100);

ALTER TABLE public.aspirations
    ADD CONSTRAINT aspirations_class_length
    CHECK (char_length(class) <= 50);

-- 4. Tambah Supabase RPC function untuk mengambil statistik aspirasi
--    dalam 1 round-trip (menggantikan 3 query count terpisah di admin dashboard)
CREATE OR REPLACE FUNCTION get_aspirations_stats()
RETURNS TABLE(
    total_count bigint,
    pending_count bigint,
    resolved_count bigint
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT
        COUNT(*) AS total_count,
        COUNT(*) FILTER (WHERE status = 'Belum Diproses') AS pending_count,
        COUNT(*) FILTER (WHERE status = 'Selesai') AS resolved_count
    FROM public.aspirations;
$$;

-- Berikan akses public ke fungsi ini (read-only stats, tidak sensitif)
GRANT EXECUTE ON FUNCTION get_aspirations_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_aspirations_stats() TO authenticated;
