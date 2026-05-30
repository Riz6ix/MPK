-- ============================================================
-- Migration: Create homepage_config table for Dynamic CMS
-- Tanggal: 2026-05-30
-- ============================================================

-- 1. Buat tabel konfigurasi beranda
CREATE TABLE IF NOT EXISTS public.homepage_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    json_value JSONB,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Berikan komentar pada tabel
COMMENT ON TABLE public.homepage_config IS 'Menampung konfigurasi dinamis teks, gambar, dan daftar program kerja beranda publik.';

-- 2. Aktifkan Row-Level Security (RLS)
ALTER TABLE public.homepage_config ENABLE ROW LEVEL SECURITY;

-- 3. Hapus policy lama jika ada
DROP POLICY IF EXISTS "Siapapun dapat membaca konfigurasi beranda." ON public.homepage_config;
DROP POLICY IF EXISTS "Hanya admin dan super_admin yang dapat mengubah konfigurasi beranda." ON public.homepage_config;

-- 4. Buat policy SELECT (Publik)
CREATE POLICY "Siapapun dapat membaca konfigurasi beranda." ON public.homepage_config
    FOR SELECT USING (true);

-- 5. Buat policy ALL (Hanya Admin terotentikasi kesiswaan)
CREATE POLICY "Hanya admin terotentikasi yang dapat mengubah konfigurasi beranda." ON public.homepage_config
    FOR ALL TO authenticated
    USING (
        auth.role() = 'authenticated'
    )
    WITH CHECK (
        auth.role() = 'authenticated'
    );

-- 6. Berikan akses kueri dasar ke peran publik
GRANT SELECT ON public.homepage_config TO anon;
GRANT SELECT ON public.homepage_config TO authenticated;
GRANT ALL ON public.homepage_config TO service_role;
