/**
 * Comprehensive Type Definitions for PHC Bhada Sample Master & Laboratory Reporting System
 * Government of Maharashtra - Primary Health Centre, Bhada (Taluka Ausa, Dist. Latur)
 */

export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  designation: string;
  subcenter?: string;
  isActive: boolean;
  createdAt: string;
}

export type SampleStatus =
  | 'Draft'
  | 'Collected'
  | 'Ready for Dispatch'
  | 'Dispatched'
  | 'Report Pending'
  | 'Report Received'
  | 'Report Updated'
  | 'Closed';

export interface SampleTypeMaster {
  id: string; // e.g. 'ST-001'
  name: string; // e.g. 'Water Sample – Bacteriological Examination'
  marathiName: string; // e.g. 'पाण्याचे नमुने (जैविक/OT तपासणी)'
  codePrefix: string; // e.g. 'WS-BIO', 'WS-CHM', 'SLT', 'TCL', 'MSL', 'DNG'
  department: string; // e.g. 'Water Quality Surveillance', 'Vector Borne Diseases', 'Nutrition & Iodine', 'IDSP'
  examinationType: string; // e.g. 'Bacteriological / Biological', 'Chemical', 'Iodine Titration', 'Available Chlorine', 'ELISA Serology'
  defaultLaboratory: string; // e.g. 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर'
  requiredFields: string[]; // List of specific field identifiers required
  resultOptions: string[]; // e.g. ['पिण्यास योग्य', 'पिण्यास अयोग्य'] or ['प्रमाणित', 'अप्रमाणित'] or ['पॉझिटिव्ह', 'निगेटिव्ह', 'इक्वीव्होकल']
  isActive: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubcenterMaster {
  id: string; // e.g. 'SC-BHD-01'
  subcenterCode: string; // e.g. 'BHD'
  subcenterName: string; // e.g. 'भादा'
  marathiName: string; // e.g. 'उपकेंद्र भादा'
  phcName: string; // e.g. 'भादा'
  taluka: string; // e.g. 'औसा'
  district: string; // e.g. 'लातूर'
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VillageMaster {
  id: string; // e.g. 'VIL-001'
  name: string; // e.g. 'लखनगाव'
  englishName: string; // e.g. 'Lakhanagaon'
  code: string; // e.g. 'LKH'
  subcenterId: string; // FK to SubcenterMaster.id
  subcenterName: string; // e.g. 'लखनगाव' or 'भादा'
  subcenter?: string; // backwards compatibility alias
  phcName: string; // e.g. 'भादा'
  taluka: string; // e.g. 'औसा'
  district: string; // e.g. 'लातूर'
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SourceMaster {
  id: string; // e.g. 'SRC-LKH-001'
  villageId: string;
  villageName: string;
  sampleTypeId: string; // e.g. 'ST-001' (Water Bio) or 'ST-002' (Water Chem)
  sampleTypeName?: string;
  sourceName: string; // e.g. 'मुख्य ग्रामपंचायत विहीर'
  sourceCode: string; // e.g. 'W-01'
  sourceType: string; // 'विहीर' | 'कूपनलिका' | 'हातपंप' | 'नळ योजना' | 'सार्वजनिक टाकी' | 'इतर'
  locationAddress: string; // e.g. 'मारुती मंदिराशेजारी, वार्ड क्र. २'
  isActive: boolean;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SampleRecord {
  id: string; // Unique Sample ID, e.g. 'WS-BIO-2026-0001'
  sampleTypeId: string; // links to SampleTypeMaster
  sampleTypeName: string;
  
  // Dates
  collectionDate: string; // YYYY-MM-DD
  dispatchDate?: string; // YYYY-MM-DD
  sendingDate?: string; // YYYY-MM-DD (Official sending letter date)
  reportReceivedDate?: string; // YYYY-MM-DD
  reportDate?: string; // YYYY-MM-DD (Alias for reportReceivedDate)
  reportUpdateDate?: string; // YYYY-MM-DD
  
  // Location (Authoritative Hierarchy: PHC -> Subcenter -> Village -> Source)
  villageId: string;
  villageName: string;
  subcenterId?: string; // Foreign Key -> SubcenterMaster.id
  subcenterName?: string;
  subcenter: string; // Display/backwards compatibility string
  phcName?: string;
  taluka?: string;
  district?: string;
  
  // Water specific (if applicable)
  sourceId?: string;
  sourceName?: string;
  sourceType?: string;
  sampleCollector?: string;
  sampleQuantity?: string; // e.g. '250 ml', '1 Litre', '100 gm'
  sampleCodeOrBottleNo?: string; // e.g. 'BTL-101'
  bottleNumber?: string | number; // Date-wise bottle sequence number e.g. 1, 2, 'BTL-1'
  
  // Salt / TCL specific (if applicable)
  shopOrInstitutionName?: string;
  batchNumber?: string;
  manufacturerName?: string;
  mfdDate?: string;
  expDate?: string;
  sampleDescription?: string;
  
  // Patient Serum specific (Measles / Dengue / Chikungunya)
  patientId?: string;
  patientName?: string;
  age?: number;
  sex?: 'पुरुष' | 'स्त्री' | 'इतर' | 'Male' | 'Female' | 'Other';
  patientAddress?: string;
  contactNumber?: string;
  mobile?: string; // Patient mobile number
  houseNo?: string; // Residential House Number
  hospitalAddress?: string; // Hospital Address
  patientRegNo?: string; // Hospital Patient Registration Number
  registrationNo?: string; // Hospital Patient Registration Number (alias)
  wardNo?: string; // Ward Number
  bedNo?: string; // Bed Number
  feverOnsetDate?: string; // Date Of Onset of First Symptom
  symptomOnsetDate?: string; // Alias for Date Of Onset of First Symptom
  natureOfSample?: 'Serum' | 'Blood' | 'CSF' | string; // Nature of sample
  testRequested?: 'डेंग्यू (NS1/IgM)' | 'चिकनगुनिया (IgM)' | 'डेंग्यू व चिकनगुनिया' | 'गोवर (Measles IgM)' | string;
  testType?: string; // e.g. 'Dengue NS1 Antigen ELISA'
  
  // Dengue / Chikungunya Clinical Findings (NIV Pune Format)
  clinicalFindings?: {
    fever?: boolean | string;
    headache?: boolean | string;
    bodyache?: boolean | string;
    jointPain?: boolean | string;
    retroOrbitalPain?: boolean | string;
    rash?: boolean | string;
    [key: string]: boolean | string | undefined;
  };
  fever?: string; // 'होय' | 'नाही' | 'Yes' | 'No'
  feverDuration?: string; // Duration e.g. '५ दिवस'
  headache?: string;
  headacheDuration?: string;
  bodyache?: string;
  bodyacheDuration?: string;
  jointPain?: string;
  jointPainDuration?: string;
  retroOrbitalPain?: string;
  retroOrbitalPainDuration?: string;
  rash?: string;
  rashDuration?: string;

  // Dedicated Three-Logical-Value Clinical Findings
  feverPresent?: boolean | 'Yes' | 'No' | 'होय' | 'नाही';
  feverDurationDays?: number | null;
  headachePresent?: boolean | 'Yes' | 'No' | 'होय' | 'नाही';
  headacheDurationDays?: number | null;
  bodyachePresent?: boolean | 'Yes' | 'No' | 'होय' | 'नाही';
  bodyacheDurationDays?: number | null;
  jointPainPresent?: boolean | 'Yes' | 'No' | 'होय' | 'नाही';
  jointPainDurationDays?: number | null;
  retroOrbitalPainPresent?: boolean | 'Yes' | 'No' | 'होय' | 'नाही';
  retroOrbitalPainDurationDays?: number | null;
  rashPresent?: boolean | 'Yes' | 'No' | 'होय' | 'नाही';
  rashDurationDays?: number | null;
  
  // Haemorrhagic Manifestations
  haemorrhagicManifestations?: {
    hematemesis?: boolean | string;
    epistaxis?: boolean | string;
    petechiae?: boolean | string;
    melena?: boolean | string;
    other?: string;
    [key: string]: boolean | string | undefined;
  };
  haemorrhagicManifestation?: string; // 'नाही' | 'होय'
  hematemesis?: string; // 'नाही' | 'होय' | 'No' | 'Yes'
  epistaxis?: string; // 'नाही' | 'होय' | 'No' | 'Yes'
  melena?: string; // 'नाही' | 'होय' | 'No' | 'Yes'
  otherHaemorrhagic?: string; // Details if other
  hematemesisPresent?: boolean | 'Yes' | 'No' | 'होय' | 'नाही';
  hematemesisDurationDays?: number | null;
  epistaxisPresent?: boolean | 'Yes' | 'No' | 'होय' | 'नाही';
  epistaxisDurationDays?: number | null;
  melenaPresent?: boolean | 'Yes' | 'No' | 'होय' | 'नाही';
  melenaDurationDays?: number | null;
  otherHemorrhagicPresent?: boolean | 'Yes' | 'No' | 'होय' | 'नाही';
  otherHemorrhagicDescription?: string;
  otherHemorrhagicDurationDays?: number | null;
  otherHaemorrhagicPresent?: boolean | 'Yes' | 'No' | 'होय' | 'नाही';
  otherHaemorrhagicDescription?: string;
  otherHaemorrhagicDurationDays?: number | null;
  medicalOfficerName?: string; // e.g. 'Dr. Patil S.S.'
  medicalOfficerMobile?: string; // e.g. '9689686901'
  
  // Sending & Lab details
  sendingLetterNumber?: string; // Outward number
  sendingLetterId?: string; // links to SendingLetter
  laboratoryName: string;
  dispatchMode?: string; // 'विशेष दूत', 'टपाल', 'स्वतः जमा'
  
  // Status & Report Results
  status: SampleStatus;
  reportNumber?: string; // Lab reference/outward no
  result?: string; // e.g. 'पिण्यास योग्य', 'पिण्यास अयोग्य', 'प्रमाणित', 'अप्रमाणित', 'पॉझिटिव्ह', 'निगेटिव्ह'
  resultQuantitative?: Record<string, string | number>; // e.g. { turbidity: 1.2, residualChlorine: 0.5, iodinePpm: 30, tclChlorinePercent: 32 }
  reportRemarks?: string;
  reportAttachmentUrl?: string;
  reportFileName?: string;
  
  // General Remarks
  remarks?: string;
  
  // Audit & Metadata
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt: string;
  isActive: boolean; // For soft delete
  uuid?: string; // Immutable internal UUID v4 for database primary key
  syncStatus?: 'SYNCED' | 'PENDING_SYNC' | 'FAILED' | 'CONFLICT';
  conflictData?: {
    remote: Record<string, unknown>;
    local: Record<string, unknown>;
    message: string;
  };
}

export interface PendingSyncOperation {
  localId: string;
  operationType: 'INSERT' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE' | 'RESTORE';
  entityType: 'sample' | 'sending_letter' | 'village' | 'source' | 'audit_log';
  entityId: string;
  payload: Record<string, unknown>;
  createdTime: string;
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
  retryCount: number;
  lastError?: string;
  idempotencyKey: string;
  remoteUpdatedAt?: string;
}

export interface SendingLetter {
  id: string; // e.g. 'LTR-2026-0001'
  letterNumber: string; // e.g. 'जा.क्र./प्राआकेंद्राभादा/पाणी/२०२६/४५'
  letterDate: string; // YYYY-MM-DD
  sampleTypeId: string;
  sampleTypeName: string;
  toAuthority: string; // e.g. 'मा. वरिष्ठ वैज्ञानिक अधिकारी, जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा, लातूर'
  subject: string; // Official Subject line
  reference: string; // Reference government orders / letter
  laboratoryName: string;
  dispatchMode: string;
  sampleIds: string[]; // List of linked Sample IDs
  sampleCount: number;
  remarks?: string;
  signatoryTitle: string; // e.g. 'वैद्यकीय अधिकारी, प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर'
  signatoryName?: string; // e.g. 'Dr. Patil S.S.'
  signatoryMobile?: string; // e.g. '9689686901'
  recipientName?: string; // e.g. 'प्रयोगशाळा अधिकारी, शासकीय वैद्यकीय महाविद्यालय (GMC), लातूर'
  status?: 'Draft' | 'Generated' | 'Dispatched' | 'Report Received';
  dispatchStatus?: string;
  dispatchDate?: string;
  letterType?: 'STANDARD' | 'DENGUE_CHIKUNGUNYA';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'DEACTIVATE' | 'RESTORE' | 'DISPATCH' | 'REPORT_UPDATE' | 'LOGIN';
  tableName: string; // 'samples' | 'villages' | 'subcenters' | 'sources' | 'sample_types' | 'sending_letters' | 'users'
  recordId: string;
  entityType?: string; // alias for tableName
  entityId?: string; // alias for recordId
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  summary: string; // Human-readable Marathi/English summary
  timestamp: string;
  ipAddress?: string;
}

export interface MasterImportRow {
  villageName: string;
  sampleTypeName: string;
  sourceName: string;
  sourceCode: string;
  sourceType: string;
  locationAddress: string;
  status: 'VALID' | 'INVALID' | 'DUPLICATE';
  errorMessage?: string;
}

export interface MasterImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  rows: MasterImportRow[];
}

export interface SubcenterVillageImportRow {
  rowNumber?: number;
  subcenterCode: string;
  subcenterName: string;
  villageCode: string;
  villageName: string;
  englishName?: string;
  taluka?: string;
  district?: string;
  status?: 'VALID' | 'INVALID' | 'DUPLICATE';
  issues?: string[];
  errorMessage?: string;
}

export interface SubcenterVillageImportSummary {
  totalRows: number;
  validRows: number;
  subcentersCreated: number;
  villagesCreated: number;
  duplicatesFound: number;
  errors: string[];
  previewRows: SubcenterVillageImportRow[];
  invalidRows?: number;
  duplicateRows?: number;
  rows?: SubcenterVillageImportRow[];
}

export interface DispatchSampleRecord {
  id: string; // e.g. 'DSP-LTR-001-WS-001'
  dispatchId: string;
  sampleId: string;
  sampleTypeId: string;
  collectionDate: string;
  subcenterName?: string;
  villageName: string;
  sourceName?: string;
  createdAt: string;
}

