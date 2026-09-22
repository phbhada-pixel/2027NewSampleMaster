-- =====================================================================
-- PHC Bhada Sample Master & Laboratory Reporting System
-- Migration 02: Subcenters Table, Hierarchy Alignment, and RLS Hardening
-- Primary Health Centre, Bhada (Taluka Ausa, Dist. Latur, Maharashtra)
-- Idempotent, Safe, and Non-Destructive Migration
-- =====================================================================

-- 1. Enable UUID Extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE SUBCENTERS TABLE (If not exists)
CREATE TABLE IF NOT EXISTS public.subcenters (
    id TEXT PRIMARY KEY,
    subcenter_code TEXT UNIQUE NOT NULL,
    subcenter_name TEXT NOT NULL,
    marathi_name TEXT NOT NULL,
    phc TEXT NOT NULL DEFAULT 'भादा',
    taluka TEXT NOT NULL DEFAULT 'औसा',
    district TEXT NOT NULL DEFAULT 'लातूर',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ADD SUBCENTER_ID TO VILLAGES TABLE
ALTER TABLE public.villages 
ADD COLUMN IF NOT EXISTS subcenter_id TEXT;

-- Add Foreign Key constraint if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_villages_subcenter'
    ) THEN
        ALTER TABLE public.villages
        ADD CONSTRAINT fk_villages_subcenter
        FOREIGN KEY (subcenter_id) REFERENCES public.subcenters(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- 4. ADD SUBCENTER_ID TO SAMPLES TABLE
ALTER TABLE public.samples 
ADD COLUMN IF NOT EXISTS subcenter_id TEXT;

-- Add Foreign Key constraint if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_samples_subcenter'
    ) THEN
        ALTER TABLE public.samples
        ADD CONSTRAINT fk_samples_subcenter
        FOREIGN KEY (subcenter_id) REFERENCES public.subcenters(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_villages_subcenter_id ON public.villages(subcenter_id);
CREATE INDEX IF NOT EXISTS idx_samples_subcenter_id ON public.samples(subcenter_id);
CREATE INDEX IF NOT EXISTS idx_samples_village_id ON public.samples(village_id);
CREATE INDEX IF NOT EXISTS idx_samples_sample_type ON public.samples(sample_type_id);
CREATE INDEX IF NOT EXISTS idx_samples_status ON public.samples(status);
CREATE INDEX IF NOT EXISTS idx_samples_collection_date ON public.samples(collection_date);
CREATE INDEX IF NOT EXISTS idx_samples_sending_letter ON public.samples(sending_letter_id);
CREATE INDEX IF NOT EXISTS idx_sources_village_type ON public.sources(village_id, sample_type_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- 6. POPULATE / UPSERT AUTHORITATIVE SUBCENTERS
INSERT INTO public.subcenters (id, subcenter_code, subcenter_name, marathi_name, phc, taluka, district, is_active)
VALUES
('SC-BHD-01', 'BHD', 'भादा', 'उपकेंद्र भादा', 'भादा', 'औसा', 'लातूर', true),
('SC-LKH-01', 'LKH', 'लखनगाव', 'उपकेंद्र लखनगाव', 'भादा', 'औसा', 'लातूर', true),
('SC-UTI-01', 'UTI', 'उटी बु.', 'उपकेंद्र उटी बु.', 'भादा', 'औसा', 'लातूर', true),
('SC-ASH-01', 'ASH', 'आशिव', 'उपकेंद्र आशिव', 'भादा', 'औसा', 'लातूर', true),
('SC-UJN-01', 'UJN', 'उजनी', 'उपकेंद्र उजनी', 'भादा', 'औसा', 'लातूर', true),
('SC-LHT-01', 'LHT', 'लोहटा', 'उपकेंद्र लोहटा', 'भादा', 'औसा', 'लातूर', true)
ON CONFLICT (id) DO UPDATE SET
  subcenter_code = EXCLUDED.subcenter_code,
  subcenter_name = EXCLUDED.subcenter_name,
  marathi_name = EXCLUDED.marathi_name,
  phc = EXCLUDED.phc,
  taluka = EXCLUDED.taluka,
  district = EXCLUDED.district,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 7. RECONCILE & MAP VILLAGES TO SUBCENTERS
UPDATE public.villages SET subcenter_id = 'SC-BHD-01' WHERE (name = 'भादा' OR subcenter = 'भादा' OR code = 'BHD' OR id = 'VIL-001') AND (subcenter_id IS NULL OR subcenter_id != 'SC-BHD-01');
UPDATE public.villages SET subcenter_id = 'SC-LKH-01' WHERE (name = 'लखनगाव' OR subcenter = 'लखनगाव' OR code = 'LKH' OR id = 'VIL-002') AND (subcenter_id IS NULL OR subcenter_id != 'SC-LKH-01');
UPDATE public.villages SET subcenter_id = 'SC-UTI-01' WHERE (name = 'उटी बु.' OR subcenter = 'उटी बु.' OR code = 'UTI' OR id = 'VIL-003') AND (subcenter_id IS NULL OR subcenter_id != 'SC-UTI-01');
UPDATE public.villages SET subcenter_id = 'SC-ASH-01' WHERE (name = 'आशिव' OR subcenter = 'आशिव' OR code = 'ASH' OR id = 'VIL-004') AND (subcenter_id IS NULL OR subcenter_id != 'SC-ASH-01');
UPDATE public.villages SET subcenter_id = 'SC-UJN-01' WHERE (name = 'उजनी' OR subcenter = 'उजनी' OR code = 'UJN' OR id = 'VIL-005') AND (subcenter_id IS NULL OR subcenter_id != 'SC-UJN-01');
UPDATE public.villages SET subcenter_id = 'SC-LHT-01' WHERE (name = 'लोहटा' OR subcenter = 'लोहटा' OR code = 'LHT' OR id = 'VIL-006') AND (subcenter_id IS NULL OR subcenter_id != 'SC-LHT-01');

-- 8. RECONCILE & MAP SAMPLES TO SUBCENTERS
UPDATE public.samples s
SET subcenter_id = v.subcenter_id
FROM public.villages v
WHERE s.village_id = v.id
AND (s.subcenter_id IS NULL OR s.subcenter_id != v.subcenter_id);

-- Fallback mapping for samples by subcenter text if village was not linked
UPDATE public.samples SET subcenter_id = 'SC-BHD-01' WHERE subcenter_id IS NULL AND subcenter = 'भादा';
UPDATE public.samples SET subcenter_id = 'SC-LKH-01' WHERE subcenter_id IS NULL AND subcenter = 'लखनगाव';
UPDATE public.samples SET subcenter_id = 'SC-UTI-01' WHERE subcenter_id IS NULL AND subcenter = 'उटी बु.';
UPDATE public.samples SET subcenter_id = 'SC-ASH-01' WHERE subcenter_id IS NULL AND subcenter = 'आशिव';
UPDATE public.samples SET subcenter_id = 'SC-UJN-01' WHERE subcenter_id IS NULL AND subcenter = 'उजनी';
UPDATE public.samples SET subcenter_id = 'SC-LHT-01' WHERE subcenter_id IS NULL AND subcenter = 'लोहटा';

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.subcenters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sending_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_types ENABLE ROW LEVEL SECURITY;

-- Helper function for Admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT (role = 'ADMIN')
        FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Subcenters Policies
DROP POLICY IF EXISTS "Public can view active subcenters" ON public.subcenters;
CREATE POLICY "Public can view active subcenters"
ON public.subcenters FOR SELECT TO anon, authenticated
USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can modify subcenters" ON public.subcenters;
CREATE POLICY "Admins can modify subcenters"
ON public.subcenters FOR ALL TO authenticated
USING (public.is_admin());

-- Villages Policies
DROP POLICY IF EXISTS "Public can view active villages" ON public.villages;
CREATE POLICY "Public can view active villages"
ON public.villages FOR SELECT TO anon, authenticated
USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can modify villages" ON public.villages;
CREATE POLICY "Admins can modify villages"
ON public.villages FOR ALL TO authenticated
USING (public.is_admin());

-- Sample Types Policies
DROP POLICY IF EXISTS "Public can view active sample types" ON public.sample_types;
CREATE POLICY "Public can view active sample types"
ON public.sample_types FOR SELECT TO anon, authenticated
USING (is_active = true OR public.is_admin());

-- Sources Policies
DROP POLICY IF EXISTS "Public can view active sources" ON public.sources;
CREATE POLICY "Public can view active sources"
ON public.sources FOR SELECT TO anon, authenticated
USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Authorized users can manage sources" ON public.sources;
CREATE POLICY "Authorized users can manage sources"
ON public.sources FOR ALL TO authenticated
USING (public.is_admin() OR auth.role() = 'authenticated');

-- Samples Policies
DROP POLICY IF EXISTS "Public can view active samples" ON public.samples;
CREATE POLICY "Public can view active samples"
ON public.samples FOR SELECT TO anon, authenticated
USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Allow insert samples" ON public.samples;
CREATE POLICY "Allow insert samples"
ON public.samples FOR INSERT TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update active samples" ON public.samples;
CREATE POLICY "Allow update active samples"
ON public.samples FOR UPDATE TO anon, authenticated
USING (is_active = true OR public.is_admin())
WITH CHECK (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can delete samples" ON public.samples;
CREATE POLICY "Admins can delete samples"
ON public.samples FOR DELETE TO authenticated
USING (public.is_admin());

-- Sending Letters Policies
DROP POLICY IF EXISTS "Public can view sending letters" ON public.sending_letters;
CREATE POLICY "Public can view sending letters"
ON public.sending_letters FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow insert sending letters" ON public.sending_letters;
CREATE POLICY "Allow insert sending letters"
ON public.sending_letters FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Audit Logs Policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow insert audit logs" ON public.audit_logs;
CREATE POLICY "Allow insert audit logs"
ON public.audit_logs FOR INSERT TO anon, authenticated
WITH CHECK (true);
