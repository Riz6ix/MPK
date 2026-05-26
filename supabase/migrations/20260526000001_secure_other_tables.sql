-- Secure database tables with RLS and Policies in Indonesian style

-- ==========================================
-- 1. members Table Security
-- ==========================================
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Siapapun dapat melihat data pengurus." ON public.members;
DROP POLICY IF EXISTS "Hanya admin terotentikasi yang dapat memodifikasi data pengurus" ON public.members;

CREATE POLICY "Siapapun dapat melihat data pengurus." ON public.members
    FOR SELECT USING (true);

CREATE POLICY "Hanya admin terotentikasi yang dapat memodifikasi data pengurus" ON public.members
    FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- 2. alumni Table Security
-- ==========================================
ALTER TABLE public.alumni ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Siapapun dapat melihat data alumni." ON public.alumni;
DROP POLICY IF EXISTS "Hanya admin terotentikasi yang dapat memodifikasi data alumni" ON public.alumni;

CREATE POLICY "Siapapun dapat melihat data alumni." ON public.alumni
    FOR SELECT USING (true);

CREATE POLICY "Hanya admin terotentikasi yang dapat memodifikasi data alumni" ON public.alumni
    FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- 3. positions Table Security
-- ==========================================
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Siapapun dapat melihat data jabatan." ON public.positions;
DROP POLICY IF EXISTS "Hanya admin terotentikasi yang dapat memodifikasi data jabatan" ON public.positions;

CREATE POLICY "Siapapun dapat melihat data jabatan." ON public.positions
    FOR SELECT USING (true);

CREATE POLICY "Hanya admin terotentikasi yang dapat memodifikasi data jabatan" ON public.positions
    FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- 4. generations Table Security
-- ==========================================
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Siapapun dapat melihat data angkatan." ON public.generations;
DROP POLICY IF EXISTS "Hanya admin terotentikasi yang dapat memodifikasi data angkatan" ON public.generations;

CREATE POLICY "Siapapun dapat melihat data angkatan." ON public.generations
    FOR SELECT USING (true);

CREATE POLICY "Hanya admin terotentikasi yang dapat memodifikasi data angkatan" ON public.generations
    FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- 5. memos Table Security
-- ==========================================
ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Siapapun dapat melihat memo." ON public.memos;
DROP POLICY IF EXISTS "Hanya admin terotentikasi yang dapat memodifikasi memo" ON public.memos;

CREATE POLICY "Siapapun dapat melihat memo." ON public.memos
    FOR SELECT USING (true);

CREATE POLICY "Hanya admin terotentikasi yang dapat memodifikasi memo" ON public.memos
    FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- 6. aspirations Table Security
-- ==========================================
ALTER TABLE public.aspirations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Siapapun dapat melihat data aspirasi." ON public.aspirations;
DROP POLICY IF EXISTS "Siapapun dapat mengirim aspirasi." ON public.aspirations;
DROP POLICY IF EXISTS "Hanya admin terotentikasi yang dapat memodifikasi data aspirasi" ON public.aspirations;

CREATE POLICY "Siapapun dapat melihat data aspirasi." ON public.aspirations
    FOR SELECT USING (true);

CREATE POLICY "Siapapun dapat mengirim aspirasi." ON public.aspirations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Hanya admin terotentikasi yang dapat memodifikasi data aspirasi" ON public.aspirations
    FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- 7. Automated updated_at Triggers
-- ==========================================

-- Trigger for members table
DROP TRIGGER IF EXISTS update_members_updated_at ON public.members;
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for alumni table
DROP TRIGGER IF EXISTS update_alumni_updated_at ON public.alumni;
CREATE TRIGGER update_alumni_updated_at
    BEFORE UPDATE ON public.alumni
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for generations table
DROP TRIGGER IF EXISTS update_generations_updated_at ON public.generations;
CREATE TRIGGER update_generations_updated_at
    BEFORE UPDATE ON public.generations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for aspirations table
DROP TRIGGER IF EXISTS update_aspirations_updated_at ON public.aspirations;
CREATE TRIGGER update_aspirations_updated_at
    BEFORE UPDATE ON public.aspirations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
