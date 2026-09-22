-- =====================================================================
-- PHC Bhada Sample Master & Laboratory Reporting System
-- Comprehensive PostgreSQL Schema with Row Level Security (RLS)
-- Primary Health Centre, Bhada (Taluka Ausa, Dist. Latur, Maharashtra)
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES & PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'USER')),
    designation TEXT NOT NULL DEFAULT 'आरोग्य कर्मचारी / Health Worker',
    subcenter TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SUBCENTER MASTER
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

-- 3. VILLAGE MASTER
CREATE TABLE IF NOT EXISTS public.villages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    english_name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    subcenter_id TEXT REFERENCES public.subcenters(id) ON DELETE RESTRICT,
    subcenter TEXT NOT NULL,
    taluka TEXT NOT NULL DEFAULT 'औसा',
    district TEXT NOT NULL DEFAULT 'लातूर',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SAMPLE TYPE MASTER
CREATE TABLE IF NOT EXISTS public.sample_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    marathi_name TEXT NOT NULL,
    code_prefix TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    examination_type TEXT NOT NULL,
    default_laboratory TEXT NOT NULL,
    required_fields TEXT[] NOT NULL DEFAULT '{}',
    result_options TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    order_index INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SOURCE MASTER (Village-specific & Sample-Type-specific)
CREATE TABLE IF NOT EXISTS public.sources (
    id TEXT PRIMARY KEY,
    village_id TEXT NOT NULL REFERENCES public.villages(id) ON DELETE RESTRICT,
    sample_type_id TEXT NOT NULL REFERENCES public.sample_types(id) ON DELETE RESTRICT,
    source_name TEXT NOT NULL,
    source_code TEXT NOT NULL,
    source_type TEXT NOT NULL,
    location_address TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_village_source UNIQUE (village_id, sample_type_id, source_code)
);

-- 6. SENDING LETTERS MASTER
CREATE TABLE IF NOT EXISTS public.sending_letters (
    id TEXT PRIMARY KEY,
    letter_number TEXT UNIQUE NOT NULL,
    letter_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sample_type_id TEXT NOT NULL REFERENCES public.sample_types(id) ON DELETE RESTRICT,
    to_authority TEXT NOT NULL,
    subject TEXT NOT NULL,
    reference TEXT,
    laboratory_name TEXT NOT NULL,
    dispatch_mode TEXT NOT NULL DEFAULT 'विशेष दूत',
    sample_count INT NOT NULL DEFAULT 0,
    remarks TEXT,
    signatory_title TEXT NOT NULL DEFAULT 'वैद्यकीय अधिकारी, प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. SAMPLES MASTER (One authoritative record)
CREATE TABLE IF NOT EXISTS public.samples (
    id TEXT PRIMARY KEY,
    sample_type_id TEXT NOT NULL REFERENCES public.sample_types(id) ON DELETE RESTRICT,
    
    -- Dates
    collection_date DATE NOT NULL,
    dispatch_date DATE,
    sending_date DATE,
    report_received_date DATE,
    report_update_date DATE,
    
    -- Location (Authoritative Hierarchy: PHC -> Subcenter -> Village -> Source)
    subcenter_id TEXT REFERENCES public.subcenters(id) ON DELETE RESTRICT,
    village_id TEXT NOT NULL REFERENCES public.villages(id) ON DELETE RESTRICT,
    subcenter TEXT NOT NULL,
    
    -- Water Specific
    source_id TEXT REFERENCES public.sources(id) ON DELETE RESTRICT,
    source_name TEXT,
    source_type TEXT,
    sample_collector TEXT,
    sample_quantity TEXT,
    sample_code_bottle_no TEXT,
    
    -- Salt / TCL Specific
    shop_or_institution_name TEXT,
    batch_number TEXT,
    manufacturer_name TEXT,
    mfd_date DATE,
    exp_date DATE,
    sample_description TEXT,
    
    -- Patient Serum Specific
    patient_id TEXT,
    patient_name TEXT,
    age INT,
    sex TEXT,
    patient_address TEXT,
    contact_number TEXT,
    fever_onset_date DATE,
    test_requested TEXT,
    
    -- Sending Letter Link
    sending_letter_id TEXT REFERENCES public.sending_letters(id) ON DELETE SET NULL,
    sending_letter_number TEXT,
    laboratory_name TEXT NOT NULL,
    dispatch_mode TEXT,
    
    -- Status & Laboratory Report
    status TEXT NOT NULL DEFAULT 'Collected' CHECK (status IN (
        'Draft', 'Collected', 'Ready for Dispatch', 'Dispatched',
        'Report Pending', 'Report Received', 'Report Updated', 'Closed'
    )),
    report_number TEXT,
    result TEXT,
    result_quantitative JSONB DEFAULT '{}'::jsonb,
    report_remarks TEXT,
    report_attachment_url TEXT,
    report_file_name TEXT,
    
    remarks TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by_name TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    summary TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT
);

-- INDEXES for Ultra-Fast Queries
CREATE INDEX IF NOT EXISTS idx_samples_village_id ON public.samples(village_id);
CREATE INDEX IF NOT EXISTS idx_samples_sample_type ON public.samples(sample_type_id);
CREATE INDEX IF NOT EXISTS idx_samples_status ON public.samples(status);
CREATE INDEX IF NOT EXISTS idx_samples_collection_date ON public.samples(collection_date);
CREATE INDEX IF NOT EXISTS idx_samples_sending_letter ON public.samples(sending_letter_id);
CREATE INDEX IF NOT EXISTS idx_sources_village_type ON public.sources(village_id, sample_type_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sending_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is Admin
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

-- Profiles Policies
CREATE POLICY "Public profiles can be viewed by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert and update profiles"
ON public.profiles FOR ALL TO authenticated USING (public.is_admin());

-- Subcenters Policies
CREATE POLICY "Anyone authenticated can view active subcenters"
ON public.subcenters FOR SELECT TO authenticated USING (is_active = true OR public.is_admin());

CREATE POLICY "Only admins can modify subcenters"
ON public.subcenters FOR ALL TO authenticated USING (public.is_admin());

-- Villages Policies
CREATE POLICY "Anyone authenticated can view active villages"
ON public.villages FOR SELECT TO authenticated USING (is_active = true OR public.is_admin());

CREATE POLICY "Only admins can modify villages"
ON public.villages FOR ALL TO authenticated USING (public.is_admin());

-- Sample Types Policies
CREATE POLICY "Anyone authenticated can view active sample types"
ON public.sample_types FOR SELECT TO authenticated USING (is_active = true OR public.is_admin());

CREATE POLICY "Only admins can modify sample types"
ON public.sample_types FOR ALL TO authenticated USING (public.is_admin());

-- Sources Policies
CREATE POLICY "Anyone authenticated can view active sources"
ON public.sources FOR SELECT TO authenticated USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins or authorized users can add/update sources"
ON public.sources FOR ALL TO authenticated USING (public.is_admin() OR auth.role() = 'authenticated');

-- Samples Policies
CREATE POLICY "Authenticated users can view non-deleted samples"
ON public.samples FOR SELECT TO authenticated USING (is_active = true OR public.is_admin());

CREATE POLICY "Authenticated users can create samples"
ON public.samples FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update active samples"
ON public.samples FOR UPDATE TO authenticated
USING (is_active = true OR public.is_admin())
WITH CHECK ((is_active = true) OR public.is_admin());

CREATE POLICY "Only Admins can delete samples"
ON public.samples FOR DELETE TO authenticated USING (public.is_admin());

-- Sending Letters Policies
CREATE POLICY "Authenticated users can view sending letters"
ON public.sending_letters FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create sending letters"
ON public.sending_letters FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Only Admins can delete sending letters"
ON public.sending_letters FOR DELETE TO authenticated USING (public.is_admin());

-- Audit Logs Policies
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "System and users can insert audit logs"
ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- =====================================================================
-- INITIAL MASTER SEED DATA
-- =====================================================================

-- Subcenters
INSERT INTO public.subcenters (id, subcenter_code, subcenter_name, marathi_name, phc, taluka, district, is_active)
VALUES
('SC-BHD-01', 'BHD', 'भादा', 'उपकेंद्र भादा', 'भादा', 'औसा', 'लातूर', true),
('SC-LKH-01', 'LKH', 'लखनगाव', 'उपकेंद्र लखनगाव', 'भादा', 'औसा', 'लातूर', true),
('SC-UTI-01', 'UTI', 'उटी बु.', 'उपकेंद्र उटी बु.', 'भादा', 'औसा', 'लातूर', true),
('SC-ASH-01', 'ASH', 'आशिव', 'उपकेंद्र आशिव', 'भादा', 'औसा', 'लातूर', true),
('SC-UJN-01', 'UJN', 'उजनी', 'उपकेंद्र उजनी', 'भादा', 'औसा', 'लातूर', true),
('SC-LHT-01', 'LHT', 'लोहटा', 'उपकेंद्र लोहटा', 'भादा', 'औसा', 'लातूर', true)
ON CONFLICT (id) DO NOTHING;

-- Sample Types
INSERT INTO public.sample_types (id, name, marathi_name, code_prefix, department, examination_type, default_laboratory, required_fields, result_options, is_active, order_index)
VALUES
('ST-001', 'Water Sample – Bacteriological Examination', 'पाण्याचे नमुने (जैविक/OT तपासणी)', 'WS-BIO', 'Water Quality Surveillance', 'Bacteriological Examination (MPN / OT / H2S)', 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर', '{"collectionDate", "village", "source", "sourceType", "sampleCollector", "sampleQuantity", "sampleCodeOrBottleNo"}', '{"पिण्यास योग्य", "पिण्यास अयोग्य"}', true, 1),
('ST-002', 'Water Sample – Chemical Examination', 'पाण्याचे नमुने (रासायनिक तपासणी)', 'WS-CHM', 'Water Quality Surveillance', 'Chemical Examination (pH, TDS, Hardness, Nitrate, Fluoride)', 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर', '{"collectionDate", "village", "source", "sourceType", "sampleCollector", "sampleQuantity", "sampleCodeOrBottleNo"}', '{"पिण्यास योग्य", "पिण्यास अयोग्य"}', true, 2),
('ST-003', 'Salt Sample', 'मीठ नमुने (आयोडीन तपासणी)', 'SLT', 'Nutrition & Iodine Deficiency', 'Iodine Titration / Spot Test (PPM)', 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर', '{"collectionDate", "village", "shopOrInstitutionName", "sampleDescription", "batchNumber", "manufacturerName"}', '{"प्रमाणित", "अप्रमाणित"}', true, 3),
('ST-004', 'TCL Sample', 'ब्लिचिंग पावडर (TCL नमुने)', 'TCL', 'Water Disinfection & Sanitation', 'Available Chlorine Percentage Test', 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर', '{"collectionDate", "village", "sourceName", "batchNumber", "manufacturerName", "sampleQuantity"}', '{"प्रमाणित", "अप्रमाणित"}', true, 4),
('ST-005', 'Measles Patient – Serum Sample', 'गोवर संशयित रुग्ण - सीरम नमुना', 'MSL', 'IDSP / Measles-Rubella Surveillance', 'Measles IgM ELISA Examination', 'जिल्हा रुग्णालय प्रयोगशाळा / एनआयव्ही पुणे', '{"patientName", "age", "sex", "village", "patientAddress", "feverOnsetDate", "collectionDate"}', '{"पॉझिटिव्ह", "निगेटिव्ह", "इक्वीव्होकल"}', true, 5),
('ST-006', 'Dengue / Chikungunya – Serum Sample', 'डेंग्यू / चिकनगुनिया - सीरम नमुना', 'DNG', 'National Vector Borne Disease Control', 'Dengue NS1 / IgM & Chikungunya IgM ELISA', 'जिल्हा रुग्णालय / शासकीय वैद्यकीय महाविद्यालय, लातूर', '{"patientName", "age", "sex", "village", "feverOnsetDate", "testRequested", "collectionDate"}', '{"पॉझिटिव्ह", "निगेटिव्ह", "इक्वीव्होकल"}', true, 6)
ON CONFLICT (id) DO NOTHING;

-- Villages
INSERT INTO public.villages (id, name, english_name, code, subcenter_id, subcenter, taluka, district, is_active)
VALUES
('VIL-001', 'भादा', 'Bhada', 'BHD', 'SC-BHD-01', 'भादा', 'औसा', 'लातूर', true),
('VIL-002', 'लखनगाव', 'Lakhanagaon', 'LKH', 'SC-LKH-01', 'लखनगाव', 'औसा', 'लातूर', true),
('VIL-003', 'उटी बु.', 'Uti Bk', 'UTI', 'SC-UTI-01', 'उटी बु.', 'औसा', 'लातूर', true),
('VIL-004', 'आशिव', 'Ashiv', 'ASH', 'SC-ASH-01', 'आशिव', 'औसा', 'लातूर', true),
('VIL-005', 'उजनी', 'Ujani', 'UJN', 'SC-UJN-01', 'उजनी', 'औसा', 'लातूर', true),
('VIL-006', 'लोहटा', 'Lohata', 'LHT', 'SC-LHT-01', 'लोहटा', 'औसा', 'लातूर', true)
ON CONFLICT (id) DO NOTHING;

-- Pre-populated Village-Specific Sources
INSERT INTO public.sources (id, village_id, sample_type_id, source_name, source_code, source_type, location_address, is_active)
VALUES
-- Lakhanagaon Sources
('SRC-LKH-001', 'VIL-002', 'ST-001', 'मुख्य ग्रामपंचायत विहीर', 'LKH-W01', 'विहीर', 'मारुती मंदिराशेजारी, वार्ड १', true),
('SRC-LKH-002', 'VIL-002', 'ST-001', 'जि.प. शाळा हातपंप', 'LKH-HP01', 'हातपंप', 'प्राथमिक शाळा परिसर', true),
('SRC-LKH-003', 'VIL-002', 'ST-001', 'सार्वजनिक पाण्याची टाकी', 'LKH-TK01', 'सार्वजनिक टाकी', 'गावठाण मध्यवर्ती टाकी', true),
('SRC-LKH-004', 'VIL-002', 'ST-001', 'दलित वस्ती कूपनलिका', 'LKH-BW01', 'कूपनलिका', 'वार्ड क्र. ३', true),
('SRC-LKH-005', 'VIL-002', 'ST-002', 'मुख्य ग्रामपंचायत विहीर', 'LKH-W01', 'विहीर', 'मारुती मंदिराशेजारी, वार्ड १', true),
('SRC-LKH-006', 'VIL-002', 'ST-002', 'जि.प. शाळा हातपंप', 'LKH-HP01', 'हातपंप', 'प्राथमिक शाळा परिसर', true),

-- Bhada Sources
('SRC-BHD-001', 'VIL-001', 'ST-001', 'मुख्य पाणीपुरवठा नळ योजना विहीर', 'BHD-W01', 'नळ योजना', 'नदीकाठ, भादा', true),
('SRC-BHD-002', 'VIL-001', 'ST-001', 'प्राथमिक आरोग्य केंद्र टाकी', 'BHD-TK01', 'सार्वजनिक टाकी', 'प्रा.आ. केंद्र परिसर', true),
('SRC-BHD-003', 'VIL-001', 'ST-001', 'बस स्टँड जवळील हातपंप', 'BHD-HP01', 'हातपंप', 'बस स्टँड चौक', true),
('SRC-BHD-004', 'VIL-001', 'ST-002', 'मुख्य पाणीपुरवठा नळ योजना विहीर', 'BHD-W01', 'नळ योजना', 'नदीकाठ, भादा', true)
ON CONFLICT (id) DO NOTHING;
