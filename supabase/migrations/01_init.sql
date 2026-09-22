-- ====================================================================
-- PHC Bhada Health Reporting & Water Quality Management System
-- Primary Health Centre, Bhada, Taluka Ausa, District Latur
-- Database Schema for Supabase / PostgreSQL
-- ====================================================================

-- 1. DataSetMaster Table
CREATE TABLE IF NOT EXISTS dataset_master (
    dataset_id SERIAL PRIMARY KEY,
    dataset_name VARCHAR(255) NOT NULL,
    active_status VARCHAR(20) DEFAULT 'Active' CHECK (active_status IN ('Active', 'Inactive')),
    dropdown_options TEXT NOT NULL,
    subject_template TEXT NOT NULL
);

-- 2. ReportMaster Table (Dynamic metadata schema)
CREATE TABLE IF NOT EXISTS report_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id INTEGER NOT NULL REFERENCES dataset_master(dataset_id) ON DELETE CASCADE,
    dataset_indicators VARCHAR(255) NOT NULL,
    dataentry_form VARCHAR(10) DEFAULT 'Yes' CHECK (dataentry_form IN ('Yes', 'No')),
    report_update_form VARCHAR(10) DEFAULT 'Yes' CHECK (report_update_form IN ('Yes', 'No')),
    letter_form VARCHAR(10) DEFAULT 'Yes' CHECK (letter_form IN ('Yes', 'No')),
    record_form VARCHAR(10) DEFAULT 'Yes' CHECK (record_form IN ('Yes', 'No')),
    data_type VARCHAR(50) DEFAULT 'Text' CHECK (data_type IN ('Text', 'Number', 'Date', 'Dropdown')),
    dropdown_options TEXT,
    order_index INTEGER DEFAULT 0
);

-- 3. VillageMaster Table (Cascading location hierarchy)
CREATE TABLE IF NOT EXISTS village_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcenter VARCHAR(100) NOT NULL,
    grampanchayat VARCHAR(100) NOT NULL,
    village VARCHAR(100) NOT NULL,
    CONSTRAINT uq_village_hierarchy UNIQUE (subcenter, grampanchayat, village)
);

-- 4. SourceMaster Table (Drinking water sources)
CREATE TABLE IF NOT EXISTS source_master (
    source_id VARCHAR(50) PRIMARY KEY,
    subcenter VARCHAR(100) NOT NULL,
    grampanchayat VARCHAR(100) NOT NULL,
    village VARCHAR(100) NOT NULL,
    source_type VARCHAR(100) NOT NULL,
    location_description TEXT NOT NULL,
    registration_date VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DatasetRecords Table (All sample batches, lab results, and file attachments)
CREATE TABLE IF NOT EXISTS dataset_records (
    id VARCHAR(50) PRIMARY KEY,
    dataset_id INTEGER NOT NULL REFERENCES dataset_master(dataset_id),
    send_id INTEGER NOT NULL,
    batch_id VARCHAR(100) NOT NULL,
    sample_date VARCHAR(20) NOT NULL,
    sample_date_formatted VARCHAR(20),
    subcenter VARCHAR(100) NOT NULL,
    grampanchayat VARCHAR(100) NOT NULL,
    village VARCHAR(100) NOT NULL,
    source_id VARCHAR(50) REFERENCES source_master(source_id) ON DELETE SET NULL,
    source_type VARCHAR(100),
    location_description TEXT,
    previous_sample_date VARCHAR(50),
    sequence_number INTEGER,
    field_values JSONB DEFAULT '{}'::jsonb,
    lab_result VARCHAR(100),
    lab_ref_no VARCHAR(100),
    received_date VARCHAR(20),
    remarks TEXT,
    report_file_url TEXT,
    report_file_name VARCHAR(255),
    report_mime_type VARCHAR(100),
    report_uploaded_at TIMESTAMPTZ,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DengueSurvey Table (Epidemic survey form & entomological actions)
CREATE TABLE IF NOT EXISTS dengue_surveys (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    disease_type VARCHAR(50) NOT NULL CHECK (disease_type IN ('डेंग्यू', 'चिकनगुनिया')),
    patient_name VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('पुरुष', 'स्त्री', 'इतर')),
    address TEXT,
    mobile VARCHAR(50),
    subcenter VARCHAR(100) NOT NULL,
    village_ward VARCHAR(100) NOT NULL,
    prior_patients VARCHAR(100),
    symptoms_info TEXT,
    total_members INTEGER DEFAULT 1,
    others_fever VARCHAR(20) DEFAULT 'नाही',
    total_containers INTEGER DEFAULT 0,
    dirty_containers INTEGER DEFAULT 0,
    terrace_waste VARCHAR(20) DEFAULT 'नाही',
    fridge_cooler_status VARCHAR(50) DEFAULT 'स्वच्छ',
    vase_larvae VARCHAR(20) DEFAULT 'नाही',
    blood_samples INTEGER DEFAULT 0,
    construction_nearby VARCHAR(20) DEFAULT 'नाही',
    stagnant_water VARCHAR(20) DEFAULT 'नाही',
    notice_given VARCHAR(20) DEFAULT 'होय',
    health_notice_given VARCHAR(20) DEFAULT 'नाही',
    actions JSONB DEFAULT '[]'::jsonb,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AuditLogs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    username VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_records_dataset ON dataset_records(dataset_id);
CREATE INDEX IF NOT EXISTS idx_records_sample_date ON dataset_records(sample_date);
CREATE INDEX IF NOT EXISTS idx_records_subcenter ON dataset_records(subcenter);
CREATE INDEX IF NOT EXISTS idx_records_batch ON dataset_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_sources_village ON source_master(village);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
