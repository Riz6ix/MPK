-- Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    grade text NOT NULL CHECK (grade IN ('X', 'XI', 'XII')),
    order_index integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_classes_grade_order ON public.classes(grade, order_index);
CREATE INDEX IF NOT EXISTS idx_classes_is_active ON public.classes(is_active);

-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to prevent duplicates)
DROP POLICY IF EXISTS "Siapapun dapat melihat data kelas." ON public.classes;
DROP POLICY IF EXISTS "Hanya admin terotentikasi yang dapat memodifikasi data kelas" ON public.classes;

-- RLS Policies in Indonesian style
CREATE POLICY "Siapapun dapat melihat data kelas." ON public.classes
    FOR SELECT USING (is_active = true OR (auth.role() = 'authenticated'));

CREATE POLICY "Hanya admin terotentikasi yang dapat memodifikasi data kelas" ON public.classes
    FOR ALL USING (auth.role() = 'authenticated');

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_classes_updated_at ON public.classes;
CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON public.classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
