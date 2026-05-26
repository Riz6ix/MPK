-- Add performance indexes for highly-executed Edge SSR and relational queries

-- 1. Compound index on public.members(status, order_index) for active roster ordering
CREATE INDEX IF NOT EXISTS idx_members_status_order 
ON public.members(status, order_index);

-- 2. Descending index on public.aspirations(created_at DESC) for timeline sorting
CREATE INDEX IF NOT EXISTS idx_aspirations_created_at_desc 
ON public.aspirations(created_at DESC);

-- 3. Relational index on public.alumni(generation_id) for generation-based filtering
CREATE INDEX IF NOT EXISTS idx_alumni_generation_id 
ON public.alumni(generation_id);
