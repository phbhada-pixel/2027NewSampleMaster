/**
 * Comprehensive Client Data Store & API Service for PHC Bhada Sample Master System
 * Handles unified Supabase cloud sync + durable local storage + audit logging + master caching
 */

import {
  User,
  SampleTypeMaster,
  SubcenterMaster,
  VillageMaster,
  SourceMaster,
  SampleRecord,
  SendingLetter,
  AuditLog,
  MasterImportSummary,
  MasterImportRow,
  SubcenterVillageImportRow,
  SubcenterVillageImportSummary,
  PendingSyncOperation,
} from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// Helper for cryptographic UUID v4 generation (primary key for database records)
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// STORAGE KEYS
const STORAGE_KEYS = {
  USERS: 'phc_bhada_users_v2',
  CURRENT_USER: 'phc_bhada_current_user_v2',
  SAMPLE_TYPES: 'phc_bhada_sample_types_v2',
  SUBCENTERS: 'phc_bhada_subcenters_v2',
  VILLAGES: 'phc_bhada_villages_v2',
  SOURCES: 'phc_bhada_sources_v2',
  SAMPLES: 'phc_bhada_samples_v2',
  SENDING_LETTERS: 'phc_bhada_letters_v2',
  AUDIT_LOGS: 'phc_bhada_audit_logs_v2',
  SYNC_QUEUE: 'phc_bhada_sync_queue_v2',
};

// INITIAL SEED DATA
const DEFAULT_SUBCENTERS: SubcenterMaster[] = [
  {
    id: 'SC-BHD-01',
    subcenterCode: 'BHD',
    subcenterName: 'भादा',
    marathiName: 'उपकेंद्र भादा',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'SC-LKH-01',
    subcenterCode: 'LKH',
    subcenterName: 'लखनगाव',
    marathiName: 'उपकेंद्र लखनगाव',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'SC-UTI-01',
    subcenterCode: 'UTI',
    subcenterName: 'उटी बु.',
    marathiName: 'उपकेंद्र उटी बु.',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'SC-ASH-01',
    subcenterCode: 'ASH',
    subcenterName: 'आशिव',
    marathiName: 'उपकेंद्र आशिव',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'SC-UJN-01',
    subcenterCode: 'UJN',
    subcenterName: 'उजनी',
    marathiName: 'उपकेंद्र उजनी',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'SC-LHT-01',
    subcenterCode: 'LHT',
    subcenterName: 'लोहटा',
    marathiName: 'उपकेंद्र लोहटा',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const DEFAULT_USERS: User[] = [
  {
    id: 'USR-001',
    email: 'mo.bhada@gmail.com',
    name: 'डॉ. वैद्यकीय अधिकारी (Dr. Medical Officer)',
    role: 'ADMIN',
    designation: 'वैद्यकीय अधिकारी वर्ग-१ (Medical Officer Gr-1)',
    subcenter: 'प्रा.आ.केंद्र भादा',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'USR-002',
    email: 'hw.lakhanagaon@gmail.com',
    name: 'श्री. आरोग्य सहाय्यक (Health Worker)',
    role: 'USER',
    designation: 'आरोग्य कर्मचारी / Health Supervisor',
    subcenter: 'लखनगाव',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'USR-003',
    email: 'hw.uti@gmail.com',
    name: 'श्रीमती. आरोग्य सेविका (MPW / ANM)',
    role: 'USER',
    designation: 'आरोग्य सेविका (ANM / MPW)',
    subcenter: 'उटी बु.',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const DEFAULT_SAMPLE_TYPES: SampleTypeMaster[] = [
  {
    id: 'ST-001',
    name: 'Water Sample – Bacteriological / Microbiological Examination',
    marathiName: 'पाण्याचे नमुने (जैविक/OT तपासणी)',
    codePrefix: 'WS-BIO',
    department: 'Water Quality Surveillance',
    examinationType: 'Bacteriological Examination (MPN / OT / H2S)',
    defaultLaboratory: 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर',
    requiredFields: [
      'collectionDate',
      'village',
      'source',
      'sourceType',
      'sampleCollector',
      'sampleQuantity',
      'sampleCodeOrBottleNo',
    ],
    resultOptions: ['पिण्यास योग्य', 'पिण्यास अयोग्य'],
    isActive: true,
    orderIndex: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ST-002',
    name: 'Water Sample – Chemical Examination',
    marathiName: 'पाण्याचे नमुने (रासायनिक तपासणी)',
    codePrefix: 'WS-CHM',
    department: 'Water Quality Surveillance',
    examinationType: 'Chemical Examination (pH, TDS, Hardness, Nitrate, Fluoride)',
    defaultLaboratory: 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर',
    requiredFields: [
      'collectionDate',
      'village',
      'source',
      'sourceType',
      'sampleCollector',
      'sampleQuantity',
      'sampleCodeOrBottleNo',
    ],
    resultOptions: ['पिण्यास योग्य', 'पिण्यास अयोग्य'],
    isActive: true,
    orderIndex: 2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ST-003',
    name: 'Salt Sample',
    marathiName: 'मीठ नमुने (आयोडीन तपासणी)',
    codePrefix: 'SLT',
    department: 'Nutrition & Iodine Deficiency',
    examinationType: 'Iodine Titration / Spot Test (PPM)',
    defaultLaboratory: 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर',
    requiredFields: [
      'collectionDate',
      'village',
      'shopOrInstitutionName',
      'sampleDescription',
      'batchNumber',
      'manufacturerName',
    ],
    resultOptions: ['प्रमाणित (Adequate Iodine)', 'अप्रमाणित (Inadequate Iodine)'],
    isActive: true,
    orderIndex: 3,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ST-004',
    name: 'TCL Sample',
    marathiName: 'ब्लिचिंग पावडर (TCL नमुने)',
    codePrefix: 'TCL',
    department: 'Water Disinfection & Sanitation',
    examinationType: 'Available Chlorine Percentage Test',
    defaultLaboratory: 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर',
    requiredFields: [
      'collectionDate',
      'village',
      'sourceName',
      'batchNumber',
      'manufacturerName',
      'sampleQuantity',
    ],
    resultOptions: ['प्रमाणित (>=33% Chlorine)', 'अप्रमाणित (<33% Chlorine)'],
    isActive: true,
    orderIndex: 4,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ST-005',
    name: 'Measles Patient – Serum Sample',
    marathiName: 'गोवर संशयित रुग्ण - सीरम नमुना',
    codePrefix: 'MSL',
    department: 'IDSP / Measles-Rubella Surveillance',
    examinationType: 'Measles IgM ELISA Serology',
    defaultLaboratory: 'जिल्हा रुग्णालय प्रयोगशाळा / एनआयव्ही (NIV) पुणे',
    requiredFields: [
      'patientName',
      'age',
      'sex',
      'village',
      'patientAddress',
      'feverOnsetDate',
      'collectionDate',
    ],
    resultOptions: ['पॉझिटिव्ह', 'निगेटिव्ह', 'इक्वीव्होकल'],
    isActive: true,
    orderIndex: 5,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ST-006',
    name: 'Dengue / Chikungunya – Serum Sample',
    marathiName: 'डेंग्यू / चिकनगुनिया - सीरम नमुना',
    codePrefix: 'DNG',
    department: 'National Vector Borne Disease Control',
    examinationType: 'Dengue NS1/IgM & Chikungunya IgM ELISA',
    defaultLaboratory: 'जिल्हा रुग्णालय / शासकीय वैद्यकीय महाविद्यालय, लातूर',
    requiredFields: [
      'patientName',
      'age',
      'sex',
      'village',
      'feverOnsetDate',
      'testRequested',
      'collectionDate',
    ],
    resultOptions: ['पॉझिटिव्ह', 'निगेटिव्ह', 'इक्वीव्होकल'],
    isActive: true,
    orderIndex: 6,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const DEFAULT_VILLAGES: VillageMaster[] = [
  {
    id: 'VIL-001',
    name: 'भादा',
    englishName: 'Bhada',
    code: 'BHD',
    subcenterId: 'SC-BHD-01',
    subcenterName: 'भादा',
    subcenter: 'भादा',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'VIL-002',
    name: 'लखनगाव',
    englishName: 'Lakhanagaon',
    code: 'LKH',
    subcenterId: 'SC-LKH-01',
    subcenterName: 'लखनगाव',
    subcenter: 'लखनगाव',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'VIL-003',
    name: 'उटी बु.',
    englishName: 'Uti Bk',
    code: 'UTI',
    subcenterId: 'SC-UTI-01',
    subcenterName: 'उटी बु.',
    subcenter: 'उटी बु.',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'VIL-004',
    name: 'आशिव',
    englishName: 'Ashiv',
    code: 'ASH',
    subcenterId: 'SC-ASH-01',
    subcenterName: 'आशिव',
    subcenter: 'आशिव',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'VIL-005',
    name: 'उजनी',
    englishName: 'Ujani',
    code: 'UJN',
    subcenterId: 'SC-UJN-01',
    subcenterName: 'उजनी',
    subcenter: 'उजनी',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'VIL-006',
    name: 'लोहटा',
    englishName: 'Lohata',
    code: 'LHT',
    subcenterId: 'SC-LHT-01',
    subcenterName: 'लोहटा',
    subcenter: 'लोहटा',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const DEFAULT_SOURCES: SourceMaster[] = [
  // Lakhanagaon Sources
  {
    id: 'SRC-LKH-001',
    villageId: 'VIL-002',
    villageName: 'लखनगाव',
    sampleTypeId: 'ST-001',
    sampleTypeName: 'Water Sample – Bacteriological Examination',
    sourceName: 'मुख्य ग्रामपंचायत विहीर',
    sourceCode: 'LKH-W01',
    sourceType: 'विहीर',
    locationAddress: 'मारुती मंदिराशेजारी, वार्ड क्र. १',
    isActive: true,
    remarks: 'ग्रामपंचायत सार्वजनिक पिण्याचे पाण्याचा मुख्य स्त्रोत',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'SRC-LKH-002',
    villageId: 'VIL-002',
    villageName: 'लखनगाव',
    sampleTypeId: 'ST-001',
    sampleTypeName: 'Water Sample – Bacteriological Examination',
    sourceName: 'जि.प. शाळा हातपंप',
    sourceCode: 'LKH-HP01',
    sourceType: 'हातपंप',
    locationAddress: 'प्राथमिक शाळा परिसर, लखनगाव',
    isActive: true,
    remarks: 'विद्यार्थी पिण्याचे पाणी',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'SRC-LKH-003',
    villageId: 'VIL-002',
    villageName: 'लखनगाव',
    sampleTypeId: 'ST-001',
    sampleTypeName: 'Water Sample – Bacteriological Examination',
    sourceName: 'सार्वजनिक पाण्याची टाकी',
    sourceCode: 'LKH-TK01',
    sourceType: 'सार्वजनिक टाकी',
    locationAddress: 'गावठाण मध्यवर्ती टाकी, लखनगाव',
    isActive: true,
    remarks: 'ईएसआर टाकी नळ वितरण',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'SRC-LKH-004',
    villageId: 'VIL-002',
    villageName: 'लखनगाव',
    sampleTypeId: 'ST-001',
    sampleTypeName: 'Water Sample – Bacteriological Examination',
    sourceName: 'दलित वस्ती कूपनलिका',
    sourceCode: 'LKH-BW01',
    sourceType: 'कूपनलिका',
    locationAddress: 'डॉ. आंबेडकर नगर, वार्ड क्र. ३',
    isActive: true,
    remarks: 'सार्वजनिक कूपनलिका',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'SRC-LKH-005',
    villageId: 'VIL-002',
    villageName: 'लखनगाव',
    sampleTypeId: 'ST-002',
    sampleTypeName: 'Water Sample – Chemical Examination',
    sourceName: 'मुख्य ग्रामपंचायत विहीर',
    sourceCode: 'LKH-W01',
    sourceType: 'विहीर',
    locationAddress: 'मारुती मंदिराशेजारी, वार्ड क्र. १',
    isActive: true,
    remarks: 'रासायनिक तपासणी स्त्रोत',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'SRC-LKH-006',
    villageId: 'VIL-002',
    villageName: 'लखनगाव',
    sampleTypeId: 'ST-002',
    sampleTypeName: 'Water Sample – Chemical Examination',
    sourceName: 'जि.प. शाळा हातपंप',
    sourceCode: 'LKH-HP01',
    sourceType: 'हातपंप',
    locationAddress: 'प्राथमिक शाळा परिसर, लखनगाव',
    isActive: true,
    remarks: 'रासायनिक तपासणी स्त्रोत',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  // Bhada Sources
  {
    id: 'SRC-BHD-001',
    villageId: 'VIL-001',
    villageName: 'भादा',
    sampleTypeId: 'ST-001',
    sampleTypeName: 'Water Sample – Bacteriological Examination',
    sourceName: 'मुख्य पाणीपुरवठा नळ योजना विहीर',
    sourceCode: 'BHD-W01',
    sourceType: 'नळ योजना',
    locationAddress: 'नदीकाठ, भादा',
    isActive: true,
    remarks: 'प्राथमिक पाणी योजना',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'SRC-BHD-002',
    villageId: 'VIL-001',
    villageName: 'भादा',
    sampleTypeId: 'ST-001',
    sampleTypeName: 'Water Sample – Bacteriological Examination',
    sourceName: 'प्राथमिक आरोग्य केंद्र टाकी',
    sourceCode: 'BHD-TK01',
    sourceType: 'सार्वजनिक टाकी',
    locationAddress: 'प्रा.आ. केंद्र परिसर, भादा',
    isActive: true,
    remarks: 'आरोग्य केंद्र पिण्याचे पाणी',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'SRC-BHD-003',
    villageId: 'VIL-001',
    villageName: 'भादा',
    sampleTypeId: 'ST-001',
    sampleTypeName: 'Water Sample – Bacteriological Examination',
    sourceName: 'बस स्टँड जवळील हातपंप',
    sourceCode: 'BHD-HP01',
    sourceType: 'हातपंप',
    locationAddress: 'बस स्टँड चौक, भादा',
    isActive: true,
    remarks: 'सार्वजनिक हातपंप',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'SRC-BHD-004',
    villageId: 'VIL-001',
    villageName: 'भादा',
    sampleTypeId: 'ST-002',
    sampleTypeName: 'Water Sample – Chemical Examination',
    sourceName: 'मुख्य पाणीपुरवठा नळ योजना विहीर',
    sourceCode: 'BHD-W01',
    sourceType: 'नळ योजना',
    locationAddress: 'नदीकाठ, भादा',
    isActive: true,
    remarks: 'रासायनिक तपासणी',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const DEFAULT_SAMPLES: SampleRecord[] = [
  {
    id: 'WS-BIO-2026-0001',
    sampleTypeId: 'ST-001',
    sampleTypeName: 'Water Sample – Bacteriological / Microbiological Examination',
    collectionDate: '2026-09-18',
    dispatchDate: '2026-09-18',
    sendingDate: '2026-09-18',
    reportReceivedDate: '2026-09-20',
    reportUpdateDate: '2026-09-20',
    subcenterId: 'SC-LKH-01',
    subcenterName: 'लखनगाव',
    subcenter: 'लखनगाव',
    villageId: 'VIL-002',
    villageName: 'लखनगाव',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    sourceId: 'SRC-LKH-001',
    sourceName: 'मुख्य ग्रामपंचायत विहीर',
    sourceType: 'विहीर',
    sampleCollector: 'श्री. आरोग्य सहाय्यक',
    sampleQuantity: '250 ml',
    sampleCodeOrBottleNo: 'LKH-B01',
    sendingLetterId: 'LTR-2026-0001',
    sendingLetterNumber: 'जा.क्र./प्राआकेंद्राभादा/पाणी/२०२६/४५',
    laboratoryName: 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर',
    dispatchMode: 'विशेष दूत',
    status: 'Report Received',
    reportNumber: 'DPHL/LTR/BIO/2026/894',
    result: 'पिण्यास योग्य',
    resultQuantitative: {
      turbidity: 1.1,
      residualChlorine: 0.5,
      h2sResult: 'Negative',
    },
    reportRemarks: 'नमुना पिण्यास योग्य आहे. क्लोरीनेशन समाधानकारक.',
    createdBy: 'USR-002',
    createdByName: 'श्री. आरोग्य सहाय्यक (Health Worker)',
    createdAt: '2026-09-18T09:30:00Z',
    updatedBy: 'USR-001',
    updatedByName: 'डॉ. वैद्यकीय अधिकारी',
    updatedAt: '2026-09-20T14:15:00Z',
    isActive: true,
  },
  {
    id: 'WS-BIO-2026-0002',
    sampleTypeId: 'ST-001',
    sampleTypeName: 'Water Sample – Bacteriological / Microbiological Examination',
    collectionDate: '2026-09-18',
    dispatchDate: '2026-09-18',
    sendingDate: '2026-09-18',
    subcenterId: 'SC-LKH-01',
    subcenterName: 'लखनगाव',
    subcenter: 'लखनगाव',
    villageId: 'VIL-002',
    villageName: 'लखनगाव',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    sourceId: 'SRC-LKH-002',
    sourceName: 'जि.प. शाळा हातपंप',
    sourceType: 'हातपंप',
    sampleCollector: 'श्री. आरोग्य सहाय्यक',
    sampleQuantity: '250 ml',
    sampleCodeOrBottleNo: 'LKH-B02',
    sendingLetterId: 'LTR-2026-0001',
    sendingLetterNumber: 'जा.क्र./प्राआकेंद्राभादा/पाणी/२०२६/४५',
    laboratoryName: 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर',
    dispatchMode: 'विशेष दूत',
    status: 'Dispatched',
    createdBy: 'USR-002',
    createdByName: 'श्री. आरोग्य सहाय्यक (Health Worker)',
    createdAt: '2026-09-18T09:40:00Z',
    updatedBy: 'USR-002',
    updatedAt: '2026-09-18T10:00:00Z',
    isActive: true,
  },
  {
    id: 'WS-CHM-2026-0001',
    sampleTypeId: 'ST-002',
    sampleTypeName: 'Water Sample – Chemical Examination',
    collectionDate: '2026-09-14',
    dispatchDate: '2026-09-15',
    sendingDate: '2026-09-15',
    reportReceivedDate: '2026-09-19',
    reportUpdateDate: '2026-09-19',
    subcenterId: 'SC-BHD-01',
    subcenterName: 'भादा',
    subcenter: 'भादा',
    villageId: 'VIL-001',
    villageName: 'भादा',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    sourceId: 'SRC-BHD-004',
    sourceName: 'मुख्य पाणीपुरवठा नळ योजना विहीर',
    sourceType: 'नळ योजना',
    sampleCollector: 'श्री. आरोग्य सहाय्यक',
    sampleQuantity: '2 Ltr',
    sampleCodeOrBottleNo: 'BHD-CHM-01',
    laboratoryName: 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर',
    dispatchMode: 'विशेष दूत',
    status: 'Report Received',
    reportNumber: 'DPHL/CHM/2026/512',
    result: 'पिण्यास योग्य',
    resultQuantitative: {
      ph: 7.4,
      tds: 340,
      totalHardness: 210,
    },
    reportRemarks: 'रासायनिक घटक विहित मर्यादेत आहेत. पाणी पिण्यास योग्य.',
    createdBy: 'USR-001',
    createdByName: 'डॉ. वैद्यकीय अधिकारी',
    createdAt: '2026-09-14T10:00:00Z',
    updatedBy: 'USR-001',
    updatedAt: '2026-09-19T15:30:00Z',
    isActive: true,
  },
  {
    id: 'WS-CHM-2026-0002',
    sampleTypeId: 'ST-002',
    sampleTypeName: 'Water Sample – Chemical Examination',
    collectionDate: '2026-09-14',
    dispatchDate: '2026-09-15',
    sendingDate: '2026-09-15',
    reportReceivedDate: '2026-09-19',
    reportUpdateDate: '2026-09-19',
    subcenterId: 'SC-LKH-01',
    subcenterName: 'लखनगाव',
    subcenter: 'लखनगाव',
    villageId: 'VIL-002',
    villageName: 'लखनगाव',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    sourceId: 'SRC-LKH-005',
    sourceName: 'मुख्य ग्रामपंचायत विहीर',
    sourceType: 'विहीर',
    sampleCollector: 'श्री. आरोग्य सहाय्यक',
    sampleQuantity: '2 Ltr',
    sampleCodeOrBottleNo: 'LKH-CHM-01',
    laboratoryName: 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर',
    dispatchMode: 'विशेष दूत',
    status: 'Report Received',
    reportNumber: 'DPHL/CHM/2026/513',
    result: 'पिण्यास अयोग्य',
    resultQuantitative: {
      ph: 8.6,
      tds: 1450,
      totalHardness: 680,
    },
    reportRemarks: 'टीडीएस व हार्डनेस विहित मर्यादेपेक्षा जास्त. पाणी पिण्यास अयोग्य.',
    createdBy: 'USR-002',
    createdByName: 'श्री. आरोग्य सहाय्यक',
    createdAt: '2026-09-14T10:30:00Z',
    updatedBy: 'USR-001',
    updatedAt: '2026-09-19T15:45:00Z',
    isActive: true,
  },
  {
    id: 'SLT-2026-0001',
    sampleTypeId: 'ST-003',
    sampleTypeName: 'Salt Sample',
    collectionDate: '2026-09-15',
    dispatchDate: '2026-09-16',
    sendingDate: '2026-09-16',
    reportReceivedDate: '2026-09-19',
    reportUpdateDate: '2026-09-19',
    subcenterId: 'SC-BHD-01',
    subcenterName: 'भादा',
    subcenter: 'भादा',
    villageId: 'VIL-001',
    villageName: 'भादा',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    shopOrInstitutionName: 'जय भवानी किराणा स्टोअर, मेन रोड भादा',
    sampleDescription: 'टाटा आयोडाइज्ड मीठ (पॅक नमुना)',
    batchNumber: 'B-260814',
    manufacturerName: 'टाटा सॉल्ट्स लि.',
    mfdDate: '2026-08-01',
    expDate: '2028-07-31',
    sampleQuantity: '500 gm',
    sendingLetterId: 'LTR-2026-0002',
    sendingLetterNumber: 'जा.क्र./प्राआकेंद्राभादा/मीठ/२०२६/१२',
    laboratoryName: 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर',
    dispatchMode: 'विशेष दूत',
    status: 'Report Received',
    reportNumber: 'DPHL/SALT/2026/304',
    result: 'प्रमाणित (Adequate Iodine)',
    resultQuantitative: {
      iodinePpm: 28,
    },
    reportRemarks: 'आयोडीन प्रमाण २८ PPM (किमान १५ PPM पेक्षा जास्त)',
    createdBy: 'USR-001',
    createdByName: 'डॉ. वैद्यकीय अधिकारी',
    createdAt: '2026-09-15T11:00:00Z',
    updatedBy: 'USR-001',
    updatedAt: '2026-09-19T16:00:00Z',
    isActive: true,
  },
  {
    id: 'TCL-2026-0001',
    sampleTypeId: 'ST-004',
    sampleTypeName: 'TCL Sample',
    collectionDate: '2026-09-15',
    dispatchDate: '2026-09-16',
    sendingDate: '2026-09-16',
    reportReceivedDate: '2026-09-19',
    reportUpdateDate: '2026-09-19',
    subcenterId: 'SC-LKH-01',
    subcenterName: 'लखनगाव',
    subcenter: 'लखनगाव',
    villageId: 'VIL-002',
    villageName: 'लखनगाव',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    sourceName: 'ग्रामपंचायत लखनगाव पाणीपुरवठा साठा',
    batchNumber: 'TCL-2026-L8',
    manufacturerName: 'महाराष्ट्र केमिकल्स प्रा. लि.',
    mfdDate: '2026-07-15',
    expDate: '2027-01-15',
    sampleQuantity: '250 gm',
    sendingLetterId: 'LTR-2026-0003',
    sendingLetterNumber: 'जा.क्र./प्राआकेंद्राभादा/TCL/२०२६/०८',
    laboratoryName: 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर',
    dispatchMode: 'विशेष दूत',
    status: 'Report Received',
    reportNumber: 'DPHL/TCL/2026/188',
    result: 'प्रमाणित (>=33% Chlorine)',
    resultQuantitative: {
      availableChlorinePercent: 34.2,
    },
    reportRemarks: 'उपलब्ध क्लोरीन ३४.२% - प्रमाणित दर्जा',
    createdBy: 'USR-002',
    createdByName: 'श्री. आरोग्य सहाय्यक',
    createdAt: '2026-09-15T11:30:00Z',
    updatedBy: 'USR-001',
    updatedAt: '2026-09-19T16:20:00Z',
    isActive: true,
  },
  {
    id: 'DNG-2026-0001',
    sampleTypeId: 'ST-006',
    sampleTypeName: 'Dengue / Chikungunya – Serum Sample',
    collectionDate: '2026-09-19',
    dispatchDate: '2026-09-19',
    sendingDate: '2026-09-19',
    subcenterId: 'SC-BHD-01',
    subcenterName: 'भादा',
    subcenter: 'भादा',
    villageId: 'VIL-001',
    villageName: 'भादा',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    patientId: 'PT-2026-081',
    patientName: 'सचिन मारुती पाटील',
    age: 28,
    sex: 'पुरुष',
    patientAddress: 'वार्ड क्र. २, हनुमान मंदिराजवळ, भादा',
    contactNumber: '9822114455',
    mobile: '9822114455',
    houseNo: '142',
    hospitalAddress: 'प्राथमिक आरोग्य केंद्र, भादा',
    patientRegNo: 'OPD-8941',
    wardNo: 'OPD Ward 1',
    bedNo: 'Bed-04',
    natureOfSample: 'Serum',
    feverOnsetDate: '2026-09-14',
    symptomOnsetDate: '2026-09-14',
    testRequested: 'डेंग्यू (NS1/IgM)',
    fever: 'होय',
    feverDuration: '5 Days',
    feverPresent: 'Yes',
    feverDurationDays: 5,
    headache: 'होय',
    headacheDuration: '4 Days',
    headachePresent: 'Yes',
    headacheDurationDays: 4,
    bodyache: 'होय',
    bodyacheDuration: '4 Days',
    bodyachePresent: 'Yes',
    bodyacheDurationDays: 4,
    jointPain: 'होय',
    jointPainDuration: '3 Days',
    jointPainPresent: 'Yes',
    jointPainDurationDays: 3,
    retroOrbitalPain: 'नाही',
    retroOrbitalPainDuration: '0 Days',
    retroOrbitalPainPresent: 'No',
    retroOrbitalPainDurationDays: null,
    rash: 'नाही',
    rashDuration: '0 Days',
    rashPresent: 'No',
    rashDurationDays: null,
    haemorrhagicManifestation: 'नाही',
    hematemesis: 'नाही',
    hematemesisPresent: 'No',
    hematemesisDurationDays: null,
    epistaxis: 'नाही',
    epistaxisPresent: 'No',
    epistaxisDurationDays: null,
    melena: 'नाही',
    melenaPresent: 'No',
    melenaDurationDays: null,
    otherHaemorrhagic: 'None',
    otherHemorrhagicPresent: 'No',
    otherHemorrhagicDescription: '',
    otherHemorrhagicDurationDays: null,
    sendingLetterId: 'LTR-2026-0004',
    sendingLetterNumber: 'जा.क्र./प्राआकेंद्राभादा/डेंग्यू/२०२६/२२',
    laboratoryName: 'शासकीय वैद्यकीय महाविद्यालय व रुग्णालय प्रयोगशाळा, लातूर',
    dispatchMode: 'विशेष दूत (कोल्ड चेन बॉक्स)',
    status: 'Ready for Dispatch',
    remarks: 'तीव्र ताप, सांधेदुखी व डोकेदुखी. कोल्ड चेनमध्ये सीरम नमुना सुरक्षित.',
    createdBy: 'USR-001',
    createdByName: 'डॉ. वैद्यकीय अधिकारी',
    createdAt: '2026-09-19T10:00:00Z',
    updatedBy: 'USR-001',
    updatedAt: '2026-09-19T10:00:00Z',
    isActive: true,
  },
  {
    id: 'DNG-2026-0002',
    sampleTypeId: 'ST-006',
    sampleTypeName: 'Dengue / Chikungunya – Serum Sample',
    collectionDate: '2026-09-20',
    subcenterId: 'SC-BHD-01',
    subcenterName: 'भादा',
    subcenter: 'भादा',
    villageId: 'VIL-001',
    villageName: 'भादा',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    patientId: 'PT-2026-082',
    patientName: 'राहुल ज्ञानोबा सूर्यवंशी',
    age: 32,
    sex: 'पुरुष',
    patientAddress: 'गल्ली क्र. ३, बस स्टँडजवळ, भादा',
    contactNumber: '9850123456',
    mobile: '9850123456',
    houseNo: '58',
    hospitalAddress: 'प्राथमिक आरोग्य केंद्र, भादा',
    patientRegNo: 'OPD-8952',
    wardNo: 'OPD Ward 1',
    bedNo: 'Bed-02',
    natureOfSample: 'Serum',
    feverOnsetDate: '2026-09-17',
    symptomOnsetDate: '2026-09-17',
    testRequested: 'डेंग्यू (NS1/IgM)',
    fever: 'होय',
    feverDuration: '3 Days',
    feverPresent: 'Yes',
    feverDurationDays: 3,
    headache: 'होय',
    headacheDuration: '3 Days',
    headachePresent: 'Yes',
    headacheDurationDays: 3,
    bodyache: 'होय',
    bodyacheDuration: '2 Days',
    bodyachePresent: 'Yes',
    bodyacheDurationDays: 2,
    jointPain: 'नाही',
    jointPainDuration: '0 Days',
    jointPainPresent: 'No',
    jointPainDurationDays: null,
    retroOrbitalPain: 'होय',
    retroOrbitalPainDuration: '2 Days',
    retroOrbitalPainPresent: 'Yes',
    retroOrbitalPainDurationDays: 2,
    rash: 'नाही',
    rashDuration: '0 Days',
    rashPresent: 'No',
    rashDurationDays: null,
    haemorrhagicManifestation: 'नाही',
    hematemesis: 'नाही',
    hematemesisPresent: 'No',
    hematemesisDurationDays: null,
    epistaxis: 'नाही',
    epistaxisPresent: 'No',
    epistaxisDurationDays: null,
    melena: 'नाही',
    melenaPresent: 'No',
    melenaDurationDays: null,
    otherHaemorrhagic: 'None',
    otherHemorrhagicPresent: 'No',
    otherHemorrhagicDescription: '',
    otherHemorrhagicDurationDays: null,
    laboratoryName: 'शासकीय वैद्यकीय महाविद्यालय (GMC) प्रयोगशाळा, लातूर',
    dispatchMode: 'विशेष दूत (कोल्ड चेन बॉक्स)',
    status: 'Ready for Dispatch',
    remarks: 'डोळ्यांमागे तीव्र वेदना व ताप.',
    createdBy: 'USR-001',
    createdByName: 'डॉ. वैद्यकीय अधिकारी',
    createdAt: '2026-09-20T09:15:00Z',
    updatedBy: 'USR-001',
    updatedAt: '2026-09-20T09:15:00Z',
    isActive: true,
  },
  {
    id: 'DNG-2026-0003',
    sampleTypeId: 'ST-006',
    sampleTypeName: 'Dengue / Chikungunya – Serum Sample',
    collectionDate: '2026-09-20',
    subcenterId: 'SC-LKH-01',
    subcenterName: 'लखनगाव',
    subcenter: 'लखनगाव',
    villageId: 'VIL-002',
    villageName: 'लखनगाव',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    patientId: 'PT-2026-083',
    patientName: 'सुनिता अशोक कांबळे',
    age: 45,
    sex: 'स्त्री',
    patientAddress: 'अशोक नगर, लखनगाव, ता. औसा',
    contactNumber: '9764556677',
    mobile: '9764556677',
    houseNo: '210',
    hospitalAddress: 'प्राथमिक आरोग्य केंद्र, भादा',
    patientRegNo: 'OPD-8960',
    wardNo: 'Female Ward',
    bedNo: 'Bed-07',
    natureOfSample: 'Serum',
    feverOnsetDate: '2026-09-16',
    symptomOnsetDate: '2026-09-16',
    testRequested: 'डेंग्यू व चिकनगुनिया',
    fever: 'होय',
    feverDuration: '4 Days',
    feverPresent: 'Yes',
    feverDurationDays: 4,
    headache: 'होय',
    headacheDuration: '4 Days',
    headachePresent: 'Yes',
    headacheDurationDays: 4,
    bodyache: 'होय',
    bodyacheDuration: '4 Days',
    bodyachePresent: 'Yes',
    bodyacheDurationDays: 4,
    jointPain: 'होय',
    jointPainDuration: '4 Days',
    jointPainPresent: 'Yes',
    jointPainDurationDays: 4,
    retroOrbitalPain: 'नाही',
    retroOrbitalPainDuration: '0 Days',
    retroOrbitalPainPresent: 'No',
    retroOrbitalPainDurationDays: null,
    rash: 'नाही',
    rashDuration: '0 Days',
    rashPresent: 'No',
    rashDurationDays: null,
    haemorrhagicManifestation: 'नाही',
    hematemesis: 'नाही',
    hematemesisPresent: 'No',
    hematemesisDurationDays: null,
    epistaxis: 'नाही',
    epistaxisPresent: 'No',
    epistaxisDurationDays: null,
    melena: 'नाही',
    melenaPresent: 'No',
    melenaDurationDays: null,
    otherHaemorrhagic: 'None',
    otherHemorrhagicPresent: 'No',
    otherHemorrhagicDescription: '',
    otherHemorrhagicDurationDays: null,
    laboratoryName: 'शासकीय वैद्यकीय महाविद्यालय (GMC) प्रयोगशाळा, लातूर',
    dispatchMode: 'विशेष दूत (कोल्ड चेन बॉक्स)',
    status: 'Ready for Dispatch',
    remarks: 'तीव्र सांधेदुखी व उच्च ताप - संशयित चिकनगुनिया.',
    createdBy: 'USR-002',
    createdByName: 'श्री. आरोग्य सहाय्यक',
    createdAt: '2026-09-20T10:45:00Z',
    updatedBy: 'USR-002',
    updatedAt: '2026-09-20T10:45:00Z',
    isActive: true,
  },
  {
    id: 'DNG-2026-0004',
    sampleTypeId: 'ST-006',
    sampleTypeName: 'Dengue / Chikungunya – Serum Sample',
    collectionDate: '2026-09-21',
    subcenterId: 'SC-UTI-01',
    subcenterName: 'उटी बु.',
    subcenter: 'उटी बु.',
    villageId: 'VIL-003',
    villageName: 'उटी बु.',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    patientId: 'PT-2026-084',
    patientName: 'विकास भागवत जाधव',
    age: 19,
    sex: 'पुरुष',
    patientAddress: 'शाळा परिसर, उटी बु., ता. औसा',
    contactNumber: '9421889900',
    mobile: '9421889900',
    houseNo: '84',
    hospitalAddress: 'प्राथमिक आरोग्य केंद्र, भादा',
    patientRegNo: 'OPD-8975',
    wardNo: 'OPD Ward 2',
    bedNo: 'Bed-01',
    natureOfSample: 'Serum',
    feverOnsetDate: '2026-09-18',
    symptomOnsetDate: '2026-09-18',
    testRequested: 'डेंग्यू (NS1/IgM)',
    fever: 'होय',
    feverDuration: '3 Days',
    feverPresent: 'Yes',
    feverDurationDays: 3,
    headache: 'होय',
    headacheDuration: '3 Days',
    headachePresent: 'Yes',
    headacheDurationDays: 3,
    bodyache: 'होय',
    bodyacheDuration: '2 Days',
    bodyachePresent: 'Yes',
    bodyacheDurationDays: 2,
    jointPain: 'नाही',
    jointPainDuration: '0 Days',
    jointPainPresent: 'No',
    jointPainDurationDays: null,
    retroOrbitalPain: 'होय',
    retroOrbitalPainDuration: '2 Days',
    retroOrbitalPainPresent: 'Yes',
    retroOrbitalPainDurationDays: 2,
    rash: 'नाही',
    rashDuration: '0 Days',
    rashPresent: 'No',
    rashDurationDays: null,
    haemorrhagicManifestation: 'नाही',
    hematemesis: 'नाही',
    hematemesisPresent: 'No',
    hematemesisDurationDays: null,
    epistaxis: 'नाही',
    epistaxisPresent: 'No',
    epistaxisDurationDays: null,
    melena: 'नाही',
    melenaPresent: 'No',
    melenaDurationDays: null,
    otherHaemorrhagic: 'None',
    otherHemorrhagicPresent: 'No',
    otherHemorrhagicDescription: '',
    otherHemorrhagicDurationDays: null,
    laboratoryName: 'शासकीय वैद्यकीय महाविद्यालय (GMC) प्रयोगशाळा, लातूर',
    dispatchMode: 'विशेष दूत (कोल्ड चेन बॉक्स)',
    status: 'Ready for Dispatch',
    remarks: 'एनएस1 अँटीजेन संशयित.',
    createdBy: 'USR-003',
    createdByName: 'श्रीमती. आरोग्य सेविका',
    createdAt: '2026-09-21T09:00:00Z',
    updatedBy: 'USR-003',
    updatedAt: '2026-09-21T09:00:00Z',
    isActive: true,
  },
  {
    id: 'DNG-2026-0005',
    sampleTypeId: 'ST-006',
    sampleTypeName: 'Dengue / Chikungunya – Serum Sample',
    collectionDate: '2026-09-21',
    subcenterId: 'SC-YLW-01',
    subcenterName: 'येळवट',
    subcenter: 'येळवट',
    villageId: 'VIL-004',
    villageName: 'येळवट',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    patientId: 'PT-2026-085',
    patientName: 'संगीता पांडुरंग माने',
    age: 38,
    sex: 'स्त्री',
    patientAddress: 'ग्रामपंचायत गल्ली, येळवट, ता. औसा',
    contactNumber: '9604334455',
    mobile: '9604334455',
    houseNo: '112',
    hospitalAddress: 'प्राथमिक आरोग्य केंद्र, भादा',
    patientRegNo: 'OPD-8982',
    wardNo: 'Female Ward',
    bedNo: 'Bed-03',
    natureOfSample: 'Serum',
    feverOnsetDate: '2026-09-17',
    symptomOnsetDate: '2026-09-17',
    testRequested: 'डेंग्यू (NS1/IgM)',
    fever: 'होय',
    feverDuration: '4 Days',
    feverPresent: 'Yes',
    feverDurationDays: 4,
    headache: 'होय',
    headacheDuration: '4 Days',
    headachePresent: 'Yes',
    headacheDurationDays: 4,
    bodyache: 'होय',
    bodyacheDuration: '4 Days',
    bodyachePresent: 'Yes',
    bodyacheDurationDays: 4,
    jointPain: 'नाही',
    jointPainDuration: '0 Days',
    jointPainPresent: 'No',
    jointPainDurationDays: null,
    retroOrbitalPain: 'नाही',
    retroOrbitalPainDuration: '0 Days',
    retroOrbitalPainPresent: 'No',
    retroOrbitalPainDurationDays: null,
    rash: 'होय',
    rashDuration: '1 Day',
    rashPresent: 'Yes',
    rashDurationDays: 1,
    haemorrhagicManifestation: 'नाही',
    hematemesis: 'नाही',
    hematemesisPresent: 'No',
    hematemesisDurationDays: null,
    epistaxis: 'नाही',
    epistaxisPresent: 'No',
    epistaxisDurationDays: null,
    melena: 'नाही',
    melenaPresent: 'No',
    melenaDurationDays: null,
    otherHaemorrhagic: 'None',
    otherHemorrhagicPresent: 'No',
    otherHemorrhagicDescription: '',
    otherHemorrhagicDurationDays: null,
    laboratoryName: 'शासकीय वैद्यकीय महाविद्यालय (GMC) प्रयोगशाळा, लातूर',
    dispatchMode: 'विशेष दूत (कोल्ड चेन बॉक्स)',
    status: 'Ready for Dispatch',
    remarks: 'अंगावर बारीक पुरळ व ताप.',
    createdBy: 'USR-001',
    createdByName: 'डॉ. वैद्यकीय अधिकारी',
    createdAt: '2026-09-21T11:20:00Z',
    updatedBy: 'USR-001',
    updatedAt: '2026-09-21T11:20:00Z',
    isActive: true,
  },
  {
    id: 'DNG-2026-0006',
    sampleTypeId: 'ST-006',
    sampleTypeName: 'Dengue / Chikungunya – Serum Sample',
    collectionDate: '2026-09-22',
    subcenterId: 'SC-BHD-01',
    subcenterName: 'भादा',
    subcenter: 'भादा',
    villageId: 'VIL-001',
    villageName: 'भादा',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    patientId: 'PT-2026-086',
    patientName: 'अमोल दिगंबर गायकवाड',
    age: 26,
    sex: 'पुरुष',
    patientAddress: 'डॉ. बाबासाहेब आंबेडकर चौक, भादा',
    contactNumber: '9158778899',
    mobile: '9158778899',
    houseNo: '29',
    hospitalAddress: 'प्राथमिक आरोग्य केंद्र, भादा',
    patientRegNo: 'OPD-8991',
    wardNo: 'OPD Ward 1',
    bedNo: 'Bed-05',
    natureOfSample: 'Serum',
    feverOnsetDate: '2026-09-19',
    symptomOnsetDate: '2026-09-19',
    testRequested: 'डेंग्यू (NS1/IgM)',
    fever: 'होय',
    feverDuration: '3 Days',
    feverPresent: 'Yes',
    feverDurationDays: 3,
    headache: 'होय',
    headacheDuration: '3 Days',
    headachePresent: 'Yes',
    headacheDurationDays: 3,
    bodyache: 'होय',
    bodyacheDuration: '2 Days',
    bodyachePresent: 'Yes',
    bodyacheDurationDays: 2,
    jointPain: 'नाही',
    jointPainDuration: '0 Days',
    jointPainPresent: 'No',
    jointPainDurationDays: null,
    retroOrbitalPain: 'होय',
    retroOrbitalPainDuration: '1 Day',
    retroOrbitalPainPresent: 'Yes',
    retroOrbitalPainDurationDays: 1,
    rash: 'नाही',
    rashDuration: '0 Days',
    rashPresent: 'No',
    rashDurationDays: null,
    haemorrhagicManifestation: 'नाही',
    hematemesis: 'नाही',
    hematemesisPresent: 'No',
    hematemesisDurationDays: null,
    epistaxis: 'नाही',
    epistaxisPresent: 'No',
    epistaxisDurationDays: null,
    melena: 'नाही',
    melenaPresent: 'No',
    melenaDurationDays: null,
    otherHaemorrhagic: 'None',
    otherHemorrhagicPresent: 'No',
    otherHemorrhagicDescription: '',
    otherHemorrhagicDurationDays: null,
    laboratoryName: 'शासकीय वैद्यकीय महाविद्यालय (GMC) प्रयोगशाळा, लातूर',
    dispatchMode: 'विशेष दूत (कोल्ड चेन बॉक्स)',
    status: 'Ready for Dispatch',
    remarks: 'कोल्ड चेन बॉक्समध्ये सीरम नमुना तयार.',
    createdBy: 'USR-001',
    createdByName: 'डॉ. वैद्यकीय अधिकारी',
    createdAt: '2026-09-22T08:30:00Z',
    updatedBy: 'USR-001',
    updatedAt: '2026-09-22T08:30:00Z',
    isActive: true,
  },
  {
    id: 'MSL-2026-0001',
    sampleTypeId: 'ST-005',
    sampleTypeName: 'Measles Patient – Serum Sample',
    collectionDate: '2026-09-17',
    dispatchDate: '2026-09-17',
    sendingDate: '2026-09-17',
    reportReceivedDate: '2026-09-20',
    reportUpdateDate: '2026-09-20',
    subcenterId: 'SC-UTI-01',
    subcenterName: 'उटी बु.',
    subcenter: 'उटी बु.',
    villageId: 'VIL-003',
    villageName: 'उटी बु.',
    phcName: 'भादा',
    taluka: 'औसा',
    district: 'लातूर',
    patientId: 'PT-2026-079',
    patientName: 'कु. वैष्णवी गजानन शिंदे',
    age: 4,
    sex: 'स्त्री',
    patientAddress: 'उटी बु., ता. औसा',
    contactNumber: '9423112233',
    feverOnsetDate: '2026-09-12',
    testRequested: 'गोवर (Measles IgM)',
    sendingLetterId: 'LTR-2026-0005',
    sendingLetterNumber: 'जा.क्र./प्राआकेंद्राभादा/गोवर/२०२६/०५',
    laboratoryName: 'जिल्हा रुग्णालय प्रयोगशाळा / एनआयव्ही (NIV) पुणे',
    dispatchMode: 'विशेष दूत',
    status: 'Report Received',
    reportNumber: 'NIV/PUN/MSL/2026/410',
    result: 'निगेटिव्ह',
    reportRemarks: 'Measles IgM Negative (गोवर विषाणू आढळला नाही)',
    createdBy: 'USR-003',
    createdByName: 'श्रीमती. आरोग्य सेविका (MPW / ANM)',
    createdAt: '2026-09-17T11:00:00Z',
    updatedBy: 'USR-001',
    updatedAt: '2026-09-20T17:00:00Z',
    isActive: true,
  },
];

const DEFAULT_LETTERS: SendingLetter[] = [
  {
    id: 'LTR-2026-0001',
    letterNumber: 'जा.क्र./प्राआकेंद्राभादा/पाणी/२०२६/४५',
    letterDate: '2026-09-18',
    sampleTypeId: 'ST-001',
    sampleTypeName: 'Water Sample – Bacteriological Examination',
    toAuthority: 'मा. वरिष्ठ वैज्ञानिक अधिकारी, जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा, लातूर',
    subject: 'लखनगाव गावातील पिण्याच्या पाण्याचे जैविक नमुने रासायनिक/जैविक तपासणीसाठी पाठविणेबाबत.',
    reference: 'महाराष्ट्र शासन परिपत्रक क्रमांक: पापू-२०२६/प्र.क्र.४४/आरोग्य-५',
    laboratoryName: 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर',
    dispatchMode: 'विशेष दूत',
    sampleIds: ['WS-BIO-2026-0001', 'WS-BIO-2026-0002'],
    sampleCount: 2,
    remarks: 'पावसाळ्यानंतरची नियमित पाणी गुणवत्ता तपासणी.',
    signatoryTitle: 'वैद्यकीय अधिकारी, प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर',
    createdBy: 'USR-001',
    createdAt: '2026-09-18T10:00:00Z',
    updatedAt: '2026-09-18T10:00:00Z',
  },
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-001',
    userId: 'USR-001',
    userName: 'डॉ. वैद्यकीय अधिकारी',
    userRole: 'ADMIN',
    action: 'CREATE',
    tableName: 'samples',
    recordId: 'WS-BIO-2026-0001',
    summary: 'नवीन पाणी जैविक नमुना (WS-BIO-2026-0001) लखनगाव विहीर नोंदविला',
    timestamp: '2026-09-18T09:30:00Z',
  },
  {
    id: 'AUD-002',
    userId: 'USR-001',
    userName: 'डॉ. वैद्यकीय अधिकारी',
    userRole: 'ADMIN',
    action: 'DISPATCH',
    tableName: 'sending_letters',
    recordId: 'LTR-2026-0001',
    summary: 'जावक पत्र क्र. जा.क्र./प्राआकेंद्राभादा/पाणी/२०२६/४५ तयार केले (२ नमुने समाविष्ट)',
    timestamp: '2026-09-18T10:00:00Z',
  },
  {
    id: 'AUD-003',
    userId: 'USR-001',
    userName: 'डॉ. वैद्यकीय अधिकारी',
    userRole: 'ADMIN',
    action: 'REPORT_UPDATE',
    tableName: 'samples',
    recordId: 'WS-BIO-2026-0001',
    summary: 'प्रयोगशाळा अहवाल नोंदविला: पिण्यास योग्य (DPHL/LTR/BIO/2026/894)',
    timestamp: '2026-09-20T14:15:00Z',
  },
];

// Helper Functions for Local Storage
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return defaultValue;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

// CLIENT STORE CLASS
class ClientDataStore {
  private users: User[] = [];
  private currentUser: User | null = null;
  private sampleTypes: SampleTypeMaster[] = [];
  private subcenters: SubcenterMaster[] = [];
  private villages: VillageMaster[] = [];
  private sources: SourceMaster[] = [];
  private samples: SampleRecord[] = [];
  private sendingLetters: SendingLetter[] = [];
  private auditLogs: AuditLog[] = [];
  private syncQueue: PendingSyncOperation[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.init();
    this.setupSyncEngine();
  }

  private init() {
    this.users = getFromStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
    this.currentUser = getFromStorage(STORAGE_KEYS.CURRENT_USER, DEFAULT_USERS[0]);
    this.sampleTypes = getFromStorage(STORAGE_KEYS.SAMPLE_TYPES, DEFAULT_SAMPLE_TYPES);
    this.subcenters = getFromStorage(STORAGE_KEYS.SUBCENTERS, DEFAULT_SUBCENTERS);
    this.villages = getFromStorage(STORAGE_KEYS.VILLAGES, DEFAULT_VILLAGES);
    this.sources = getFromStorage(STORAGE_KEYS.SOURCES, DEFAULT_SOURCES);
    this.samples = getFromStorage(STORAGE_KEYS.SAMPLES, DEFAULT_SAMPLES);
    this.sendingLetters = getFromStorage(STORAGE_KEYS.SENDING_LETTERS, DEFAULT_LETTERS);
    this.auditLogs = getFromStorage(STORAGE_KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS);
    this.syncQueue = getFromStorage(STORAGE_KEYS.SYNC_QUEUE, []);

    // Perform backward-compatibility migration for existing Villages & Samples
    this.migrateSubcenterHierarchy();
  }

  private migrateSubcenterHierarchy(): void {
    let villagesModified = false;
    let samplesModified = false;

    // Ensure all subcenters in DEFAULT_SUBCENTERS exist
    for (const defSc of DEFAULT_SUBCENTERS) {
      if (!this.subcenters.some((s) => s.id === defSc.id || s.subcenterCode === defSc.subcenterCode)) {
        this.subcenters.push({ ...defSc });
      }
    }

    // 1. Migrate Villages: assign subcenterId, subcenterName, phcName, taluka, district
    for (const v of this.villages) {
      if (!v.subcenterId) {
        const match = this.subcenters.find(
          (sc) =>
            sc.subcenterName === v.subcenter ||
            sc.subcenterName === v.name ||
            sc.marathiName.includes(v.subcenter || '')
        );
        if (match) {
          v.subcenterId = match.id;
          v.subcenterName = match.subcenterName;
          v.subcenter = match.subcenterName;
          v.phcName = match.phcName || 'भादा';
          v.taluka = match.taluka || 'औसा';
          v.district = match.district || 'लातूर';
          villagesModified = true;
        } else {
          console.warn(`[Subcenter Migration Notice] Village ${v.name} (${v.id}) requires Subcenter mapping.`);
          const defSc = this.subcenters[0];
          if (defSc) {
            v.subcenterId = defSc.id;
            v.subcenterName = defSc.subcenterName;
            v.subcenter = defSc.subcenterName;
            v.phcName = defSc.phcName;
            v.taluka = defSc.taluka;
            v.district = defSc.district;
            villagesModified = true;
          }
        }
      } else {
        const sc = this.subcenters.find((s) => s.id === v.subcenterId);
        if (sc) {
          if (!v.subcenterName || v.subcenterName !== sc.subcenterName) {
            v.subcenterName = sc.subcenterName;
            v.subcenter = sc.subcenterName;
            villagesModified = true;
          }
          if (!v.phcName) {
            v.phcName = sc.phcName;
            villagesModified = true;
          }
          if (!v.taluka) {
            v.taluka = sc.taluka;
            villagesModified = true;
          }
          if (!v.district) {
            v.district = sc.district;
            villagesModified = true;
          }
        }
      }
    }

    if (villagesModified) {
      saveToStorage(STORAGE_KEYS.VILLAGES, this.villages);
    }
    saveToStorage(STORAGE_KEYS.SUBCENTERS, this.subcenters);

    // 2. Ensure all default samples exist in this.samples
    for (const defSmp of DEFAULT_SAMPLES) {
      if (!this.samples.some((s) => s.id === defSmp.id)) {
        this.samples.push({ ...defSmp });
        samplesModified = true;
      }
    }

    // 3. Migrate Samples: assign subcenterId, subcenterName, phcName, taluka, district
    for (const s of this.samples) {
      if (!s.subcenterId) {
        const v = this.villages.find((vil) => vil.id === s.villageId);
        if (v && v.subcenterId) {
          s.subcenterId = v.subcenterId;
          s.subcenterName = v.subcenterName || v.subcenter || 'भादा';
          s.subcenter = v.subcenterName || v.subcenter || 'भादा';
          s.phcName = v.phcName || 'भादा';
          s.taluka = v.taluka || 'औसा';
          s.district = v.district || 'लातूर';
          samplesModified = true;
        } else {
          const sc = this.subcenters.find((item) => item.subcenterName === s.subcenter);
          if (sc) {
            s.subcenterId = sc.id;
            s.subcenterName = sc.subcenterName;
            s.subcenter = sc.subcenterName;
            s.phcName = sc.phcName;
            s.taluka = sc.taluka;
            s.district = sc.district;
            samplesModified = true;
          }
        }
      } else {
        const sc = this.subcenters.find((item) => item.id === s.subcenterId);
        if (sc) {
          if (!s.subcenterName || s.subcenterName !== sc.subcenterName) {
            s.subcenterName = sc.subcenterName;
            s.subcenter = sc.subcenterName;
            samplesModified = true;
          }
          if (!s.phcName) {
            s.phcName = sc.phcName;
            samplesModified = true;
          }
        }
      }

      // 4. Migrate Dengue/Chikungunya samples to structured clinical findings
      if (s.sampleTypeId === 'ST-006' || s.natureOfSample === 'Serum') {
        if (s.feverPresent === undefined && (s.fever || s.feverDuration)) {
          const feverDaysMatch = (s.feverDuration || s.fever || '').match(/\d+/);
          const feverDays = feverDaysMatch ? parseInt(feverDaysMatch[0], 10) : 0;
          s.feverPresent = feverDays > 0 ? 'Yes' : (s.fever === 'होय' ? 'Yes' : 'No');
          s.feverDurationDays = feverDays > 0 ? feverDays : (s.feverPresent === 'Yes' ? 1 : null);

          const hDaysMatch = (s.headacheDuration || s.headache || '').match(/\d+/);
          const hDays = hDaysMatch ? parseInt(hDaysMatch[0], 10) : 0;
          s.headachePresent = hDays > 0 ? 'Yes' : (s.headache === 'होय' ? 'Yes' : 'No');
          s.headacheDurationDays = hDays > 0 ? hDays : (s.headachePresent === 'Yes' ? 1 : null);

          const bDaysMatch = (s.bodyacheDuration || s.bodyache || '').match(/\d+/);
          const bDays = bDaysMatch ? parseInt(bDaysMatch[0], 10) : 0;
          s.bodyachePresent = bDays > 0 ? 'Yes' : (s.bodyache === 'होय' ? 'Yes' : 'No');
          s.bodyacheDurationDays = bDays > 0 ? bDays : (s.bodyachePresent === 'Yes' ? 1 : null);

          const jDaysMatch = (s.jointPainDuration || s.jointPain || '').match(/\d+/);
          const jDays = jDaysMatch ? parseInt(jDaysMatch[0], 10) : 0;
          s.jointPainPresent = jDays > 0 ? 'Yes' : (s.jointPain === 'होय' ? 'Yes' : 'No');
          s.jointPainDurationDays = jDays > 0 ? jDays : (s.jointPainPresent === 'Yes' ? 1 : null);

          const rDaysMatch = (s.retroOrbitalPainDuration || s.retroOrbitalPain || '').match(/\d+/);
          const rDays = rDaysMatch ? parseInt(rDaysMatch[0], 10) : 0;
          s.retroOrbitalPainPresent = rDays > 0 ? 'Yes' : (s.retroOrbitalPain === 'होय' ? 'Yes' : 'No');
          s.retroOrbitalPainDurationDays = rDays > 0 ? rDays : (s.retroOrbitalPainPresent === 'Yes' ? 1 : null);

          const rashDaysMatch = (s.rashDuration || s.rash || '').match(/\d+/);
          const rashDays = rashDaysMatch ? parseInt(rashDaysMatch[0], 10) : 0;
          s.rashPresent = rashDays > 0 ? 'Yes' : (s.rash === 'होय' ? 'Yes' : 'No');
          s.rashDurationDays = rashDays > 0 ? rashDays : (s.rashPresent === 'Yes' ? 1 : null);

          s.hematemesisPresent = s.hematemesis === 'होय' || s.hematemesis === 'Yes' ? 'Yes' : 'No';
          s.hematemesisDurationDays = s.hematemesisPresent === 'Yes' ? 1 : null;

          s.epistaxisPresent = s.epistaxis === 'होय' || s.epistaxis === 'Yes' ? 'Yes' : 'No';
          s.epistaxisDurationDays = s.epistaxisPresent === 'Yes' ? 1 : null;

          s.melenaPresent = s.melena === 'होय' || s.melena === 'Yes' ? 'Yes' : 'No';
          s.melenaDurationDays = s.melenaPresent === 'Yes' ? 1 : null;

          s.otherHemorrhagicPresent = s.otherHaemorrhagic && s.otherHaemorrhagic !== 'None' ? 'Yes' : 'No';
          s.otherHemorrhagicDescription = s.otherHemorrhagicPresent === 'Yes' ? (s.otherHaemorrhagic || '') : '';
          s.otherHemorrhagicDurationDays = s.otherHemorrhagicPresent === 'Yes' ? 1 : null;

          samplesModified = true;
        }
      }
    }

    if (samplesModified) {
      saveToStorage(STORAGE_KEYS.SAMPLES, this.samples);
    }
  }

  private setupSyncEngine() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.processSyncQueue().catch((err) => console.warn('Auto-sync on reconnect error:', err));
      });
      // Periodic background synchronizer check every 30s
      setInterval(() => {
        if (navigator.onLine && this.getPendingSyncCount() > 0) {
          this.processSyncQueue().catch(() => {});
        }
      }, 30000);
    }
  }

  // Observer Pattern for Live Reactive UI Updates
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('Error in store listener:', err);
      }
    }
  }

  // ==========================================
  // AUTH & USER MANAGEMENT
  // ==========================================
  getCurrentUser(): User {
    if (!this.currentUser) {
      this.currentUser = this.users[0];
      saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    }
    return this.currentUser;
  }

  setCurrentUser(user: User): void {
    this.currentUser = user;
    saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
    this.logAudit({
      action: 'LOGIN',
      tableName: 'users',
      recordId: user.id,
      summary: `वापरकर्ता लॉगिन: ${user.name} (${user.role})`,
    });
  }

  getUsers(): User[] {
    return [...this.users];
  }

  addUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: `USR-${String(this.users.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, this.users);

    this.logAudit({
      action: 'CREATE',
      tableName: 'users',
      recordId: newUser.id,
      summary: `नवीन वापरकर्ता तयार केला: ${newUser.name} (${newUser.role})`,
      newData: newUser as unknown as Record<string, unknown>,
    });

    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const user = this.getCurrentUser();
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;

    // Security Check: Only Admins can modify user roles or edit other users
    if (user.role !== 'ADMIN' && (updates.role && updates.role !== this.users[idx].role)) {
      console.warn('Security Violation: Only Admins can modify user roles');
      return null;
    }

    const old = { ...this.users[idx] };
    this.users[idx] = { ...this.users[idx], ...updates };
    saveToStorage(STORAGE_KEYS.USERS, this.users);

    if (this.currentUser?.id === id) {
      this.currentUser = this.users[idx];
      saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    }

    this.logAudit({
      action: 'UPDATE',
      tableName: 'users',
      recordId: id,
      summary: `वापरकर्ता माहिती अद्ययावत केली: ${this.users[idx].name}`,
      oldData: old as unknown as Record<string, unknown>,
      newData: this.users[idx] as unknown as Record<string, unknown>,
    });

    return this.users[idx];
  }

  // ==========================================
  // SAMPLE TYPES
  // ==========================================
  getSampleTypes(): SampleTypeMaster[] {
    return this.sampleTypes.filter((st) => st.isActive).sort((a, b) => a.orderIndex - b.orderIndex);
  }

  getAllSampleTypes(): SampleTypeMaster[] {
    return [...this.sampleTypes].sort((a, b) => a.orderIndex - b.orderIndex);
  }

  addSampleType(typeData: Omit<SampleTypeMaster, 'id' | 'createdAt' | 'updatedAt'>): SampleTypeMaster {
    const newId = `ST-${String(this.sampleTypes.length + 1).padStart(3, '0')}`;
    const newSampleType: SampleTypeMaster = {
      ...typeData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.sampleTypes.push(newSampleType);
    saveToStorage(STORAGE_KEYS.SAMPLE_TYPES, this.sampleTypes);

    this.logAudit({
      action: 'CREATE',
      tableName: 'sample_types',
      recordId: newId,
      summary: `नवीन नमुना प्रकार जोडला: ${newSampleType.marathiName} (${newSampleType.codePrefix})`,
      newData: newSampleType as unknown as Record<string, unknown>,
    });

    return newSampleType;
  }

  updateSampleType(id: string, updates: Partial<SampleTypeMaster>): SampleTypeMaster | null {
    const idx = this.sampleTypes.findIndex((st) => st.id === id);
    if (idx === -1) return null;

    const old = { ...this.sampleTypes[idx] };
    this.sampleTypes[idx] = {
      ...this.sampleTypes[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.SAMPLE_TYPES, this.sampleTypes);

    this.logAudit({
      action: 'UPDATE',
      tableName: 'sample_types',
      recordId: id,
      summary: `नमुना प्रकार सुधारित केला: ${this.sampleTypes[idx].marathiName}`,
      oldData: old as unknown as Record<string, unknown>,
      newData: this.sampleTypes[idx] as unknown as Record<string, unknown>,
    });

    return this.sampleTypes[idx];
  }

  // ==========================================
  // SUBCENTERS
  // ==========================================
  getSubcenters(): SubcenterMaster[] {
    return this.subcenters
      .filter((s) => s.isActive)
      .sort((a, b) => a.subcenterName.localeCompare(b.subcenterName));
  }

  getAllSubcenters(): SubcenterMaster[] {
    return [...this.subcenters].sort((a, b) => a.subcenterName.localeCompare(b.subcenterName));
  }

  getSubcenterById(id: string): SubcenterMaster | null {
    return this.subcenters.find((s) => s.id === id) || null;
  }

  addSubcenter(
    subcenterData: Omit<SubcenterMaster, 'id' | 'createdAt' | 'updatedAt'>
  ): SubcenterMaster | null {
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      console.warn('Security Violation: Only Admins can add subcenters');
      return null;
    }

    const cleanCode = subcenterData.subcenterCode.trim().toUpperCase();
    const cleanName = subcenterData.subcenterName.trim();

    // Prevent duplicate codes or names
    if (this.subcenters.some((s) => s.subcenterCode.toUpperCase() === cleanCode)) {
      console.warn(`Subcenter code "${cleanCode}" already exists.`);
      return null;
    }

    const newId = `SC-${cleanCode}-${String(this.subcenters.length + 1).padStart(2, '0')}`;
    const newSubcenter: SubcenterMaster = {
      ...subcenterData,
      id: newId,
      subcenterCode: cleanCode,
      subcenterName: cleanName,
      marathiName: subcenterData.marathiName?.trim() || `उपकेंद्र ${cleanName}`,
      phcName: subcenterData.phcName?.trim() || 'भादा',
      taluka: subcenterData.taluka?.trim() || 'औसा',
      district: subcenterData.district?.trim() || 'लातूर',
      isActive: subcenterData.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.subcenters.push(newSubcenter);
    saveToStorage(STORAGE_KEYS.SUBCENTERS, this.subcenters);

    this.logAudit({
      action: 'CREATE',
      tableName: 'subcenters',
      recordId: newId,
      summary: `नवीन उपकेंद्र जोडले: ${newSubcenter.subcenterName} (${newSubcenter.subcenterCode})`,
      newData: newSubcenter as unknown as Record<string, unknown>,
    });

    this.notifyListeners();
    return newSubcenter;
  }

  updateSubcenter(id: string, updates: Partial<SubcenterMaster>): SubcenterMaster | null {
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      console.warn('Security Violation: Only Admins can update subcenters');
      return null;
    }

    const idx = this.subcenters.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    const old = { ...this.subcenters[idx] };
    const updatedName = updates.subcenterName?.trim() || old.subcenterName;
    const nameChanged = updatedName !== old.subcenterName;

    this.subcenters[idx] = {
      ...this.subcenters[idx],
      ...updates,
      subcenterName: updatedName,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.SUBCENTERS, this.subcenters);

    // If subcenter name was updated, propagate down to linked villages and samples
    if (nameChanged) {
      let villagesChanged = false;
      for (const v of this.villages) {
        if (v.subcenterId === id) {
          v.subcenterName = updatedName;
          v.subcenter = updatedName;
          villagesChanged = true;
        }
      }
      if (villagesChanged) {
        saveToStorage(STORAGE_KEYS.VILLAGES, this.villages);
      }

      let samplesChanged = false;
      for (const s of this.samples) {
        if (s.subcenterId === id) {
          s.subcenterName = updatedName;
          s.subcenter = updatedName;
          samplesChanged = true;
        }
      }
      if (samplesChanged) {
        saveToStorage(STORAGE_KEYS.SAMPLES, this.samples);
      }
    }

    this.logAudit({
      action: 'UPDATE',
      tableName: 'subcenters',
      recordId: id,
      summary: `उपकेंद्र माहिती अद्ययावत केली: ${this.subcenters[idx].subcenterName}`,
      oldData: old as unknown as Record<string, unknown>,
      newData: this.subcenters[idx] as unknown as Record<string, unknown>,
    });

    this.notifyListeners();
    return this.subcenters[idx];
  }

  deactivateSubcenter(id: string): { success: boolean; message: string } {
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      return { success: false, message: 'केवळ प्रशासक (Admin) उपकेंद्र निष्क्रिय करू शकतात.' };
    }

    const sc = this.subcenters.find((s) => s.id === id);
    if (!sc) {
      return { success: false, message: 'उपकेंद्र सापडले नाही.' };
    }

    // Check if any active villages are currently mapped to this subcenter
    const activeVillages = this.villages.filter((v) => v.subcenterId === id && v.isActive);
    if (activeVillages.length > 0) {
      return {
        success: false,
        message: `या उपकेंद्राशी ${activeVillages.length} सक्रिय गावे (${activeVillages.map((v) => v.name).join(', ')}) जोडलेली आहेत. कृपया आधी गावांचे उपकेंद्र बदला.`,
      };
    }

    sc.isActive = false;
    sc.updatedAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.SUBCENTERS, this.subcenters);

    this.logAudit({
      action: 'DEACTIVATE',
      tableName: 'subcenters',
      recordId: id,
      summary: `उपकेंद्र निष्क्रिय केले: ${sc.subcenterName}`,
      newData: { isActive: false },
    });

    this.notifyListeners();
    return { success: true, message: `उपकेंद्र "${sc.subcenterName}" यशस्वीरीत्या निष्क्रिय केले.` };
  }

  restoreSubcenter(id: string): { success: boolean; message: string } {
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      return { success: false, message: 'केवळ प्रशासक (Admin) उपकेंद्र पुनर्संचयित करू शकतात.' };
    }

    const sc = this.subcenters.find((s) => s.id === id);
    if (!sc) {
      return { success: false, message: 'उपकेंद्र सापडले नाही.' };
    }

    sc.isActive = true;
    sc.updatedAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.SUBCENTERS, this.subcenters);

    this.logAudit({
      action: 'RESTORE',
      tableName: 'subcenters',
      recordId: id,
      summary: `उपकेंद्र पुनर्संचयित केले: ${sc.subcenterName}`,
      newData: { isActive: true },
    });

    this.notifyListeners();
    return { success: true, message: `उपकेंद्र "${sc.subcenterName}" सक्रिय केले.` };
  }

  // ==========================================
  // VILLAGES
  // ==========================================
  getVillages(subcenterId?: string): VillageMaster[] {
    return this.villages.filter((v) => {
      if (!v.isActive) return false;
      if (subcenterId && subcenterId !== 'ALL' && v.subcenterId !== subcenterId) {
        return false;
      }
      return true;
    });
  }

  getAllVillages(subcenterId?: string): VillageMaster[] {
    return this.villages.filter((v) => {
      if (subcenterId && subcenterId !== 'ALL' && v.subcenterId !== subcenterId) {
        return false;
      }
      return true;
    });
  }

  getVillageById(id: string): VillageMaster | null {
    return this.villages.find((v) => v.id === id) || null;
  }

  addVillage(villageData: Omit<VillageMaster, 'id' | 'createdAt' | 'updatedAt'>): VillageMaster | null {
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      console.warn('Security Violation: Only Admins can add villages');
      return null;
    }

    // Require valid subcenterId
    if (!villageData.subcenterId) {
      console.warn('Subcenter selection is required for adding a village');
      return null;
    }

    const sc = this.subcenters.find((s) => s.id === villageData.subcenterId);
    if (!sc) {
      console.warn(`Subcenter not found for id: ${villageData.subcenterId}`);
      return null;
    }

    const cleanCode = villageData.code.trim().toUpperCase();
    if (this.villages.some((v) => v.code.toUpperCase() === cleanCode)) {
      console.warn(`Village code "${cleanCode}" already exists.`);
      return null;
    }

    const newId = `VIL-${String(this.villages.length + 1).padStart(3, '0')}`;
    const newVillage: VillageMaster = {
      ...villageData,
      id: newId,
      code: cleanCode,
      subcenterId: sc.id,
      subcenterName: sc.subcenterName,
      subcenter: sc.subcenterName,
      phcName: sc.phcName || villageData.phcName || 'भादा',
      taluka: sc.taluka || villageData.taluka || 'औसा',
      district: sc.district || villageData.district || 'लातूर',
      isActive: villageData.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.villages.push(newVillage);
    saveToStorage(STORAGE_KEYS.VILLAGES, this.villages);

    this.logAudit({
      action: 'CREATE',
      tableName: 'villages',
      recordId: newId,
      summary: `नवीन गाव जोडले: ${newVillage.name} (उपकेंद्र: ${newVillage.subcenterName})`,
      newData: newVillage as unknown as Record<string, unknown>,
    });

    this.notifyListeners();
    return newVillage;
  }

  updateVillage(id: string, updates: Partial<VillageMaster>): VillageMaster | null {
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      console.warn('Security Violation: Only Admins can update villages');
      return null;
    }

    const idx = this.villages.findIndex((v) => v.id === id);
    if (idx === -1) return null;

    const old = { ...this.villages[idx] };
    let subcenterUpdates: Partial<VillageMaster> = {};

    if (updates.subcenterId && updates.subcenterId !== old.subcenterId) {
      const sc = this.subcenters.find((s) => s.id === updates.subcenterId);
      if (sc) {
        subcenterUpdates = {
          subcenterId: sc.id,
          subcenterName: sc.subcenterName,
          subcenter: sc.subcenterName,
          phcName: sc.phcName,
          taluka: sc.taluka,
          district: sc.district,
        };
      }
    }

    this.villages[idx] = {
      ...this.villages[idx],
      ...updates,
      ...subcenterUpdates,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.VILLAGES, this.villages);

    // If village subcenter or name changed, update linked samples
    const updatedVillage = this.villages[idx];
    if (subcenterUpdates.subcenterId || updates.name) {
      let samplesModified = false;
      for (const s of this.samples) {
        if (s.villageId === id) {
          if (updates.name) s.villageName = updates.name;
          if (updatedVillage.subcenterId) {
            s.subcenterId = updatedVillage.subcenterId;
            s.subcenterName = updatedVillage.subcenterName;
            s.subcenter = updatedVillage.subcenterName || s.subcenter;
            s.phcName = updatedVillage.phcName;
            s.taluka = updatedVillage.taluka;
            s.district = updatedVillage.district;
          }
          samplesModified = true;
        }
      }
      if (samplesModified) {
        saveToStorage(STORAGE_KEYS.SAMPLES, this.samples);
      }
    }

    this.logAudit({
      action: 'UPDATE',
      tableName: 'villages',
      recordId: id,
      summary: `गाव माहिती अद्ययावत केली: ${this.villages[idx].name} (उपकेंद्र: ${this.villages[idx].subcenterName || this.villages[idx].subcenter})`,
      oldData: old as unknown as Record<string, unknown>,
      newData: this.villages[idx] as unknown as Record<string, unknown>,
    });

    this.notifyListeners();
    return this.villages[idx];
  }

  deactivateVillage(id: string): { success: boolean; message: string } {
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      return { success: false, message: 'केवळ प्रशासक (Admin) गाव निष्क्रिय करू शकतात.' };
    }

    const vil = this.villages.find((v) => v.id === id);
    if (!vil) {
      return { success: false, message: 'गाव सापडले नाही.' };
    }

    // ON DELETE RESTRICT check: prevent deactivating village if active sources exist
    const activeSources = this.sources.filter((s) => s.villageId === id && s.isActive);
    if (activeSources.length > 0) {
      return {
        success: false,
        message: `या गावाशी ${activeSources.length} सक्रिय स्त्रोत (${activeSources.map((s) => s.sourceName).slice(0, 3).join(', ')}) जोडलेले आहेत. कृपया आधी संबंधित स्त्रोत निष्क्रिय करा.`,
      };
    }

    vil.isActive = false;
    vil.updatedAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.VILLAGES, this.villages);

    this.logAudit({
      action: 'DEACTIVATE',
      tableName: 'villages',
      recordId: id,
      summary: `गाव निष्क्रिय केले: ${vil.name}`,
      newData: { isActive: false },
    });

    this.notifyListeners();
    return { success: true, message: `गाव "${vil.name}" यशस्वीरीत्या निष्क्रिय केले.` };
  }

  restoreVillage(id: string): { success: boolean; message: string } {
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      return { success: false, message: 'केवळ प्रशासक (Admin) गाव पुनर्संचयित करू शकतात.' };
    }

    const vil = this.villages.find((v) => v.id === id);
    if (!vil) {
      return { success: false, message: 'गाव सापडले नाही.' };
    }

    vil.isActive = true;
    vil.updatedAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.VILLAGES, this.villages);

    this.logAudit({
      action: 'RESTORE',
      tableName: 'villages',
      recordId: id,
      summary: `गाव पुनर्संचयित केले: ${vil.name}`,
      newData: { isActive: true },
    });

    this.notifyListeners();
    return { success: true, message: `गाव "${vil.name}" सक्रिय केले.` };
  }

  // ==========================================
  // BULK IMPORT FOR SUBCENTERS & VILLAGES
  // ==========================================
  importSubcentersAndVillages(
    rows: Array<{
      subcenterCode: string;
      subcenterName: string;
      villageCode: string;
      villageName: string;
      englishName?: string;
      taluka?: string;
      district?: string;
    }>
  ): SubcenterVillageImportSummary {
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      return {
        totalRows: rows.length,
        validRows: 0,
        subcentersCreated: 0,
        villagesCreated: 0,
        duplicatesFound: 0,
        errors: ['केवळ प्रशासक (Admin) मास्टर आयात करू शकतात.'],
        previewRows: [],
      };
    }

    const summary: SubcenterVillageImportSummary = {
      totalRows: rows.length,
      validRows: 0,
      subcentersCreated: 0,
      villagesCreated: 0,
      duplicatesFound: 0,
      errors: [],
      previewRows: [],
    };

    const seenVillageCodes = new Set(this.villages.map((v) => v.code.toUpperCase()));
    const batchVillageCodes = new Set<string>();

    const validatedItems: Array<{
      scCode: string;
      scName: string;
      vilCode: string;
      vilName: string;
      engName: string;
      taluka: string;
      dist: string;
    }> = [];

    for (let index = 0; index < rows.length; index++) {
      const r = rows[index];
      const rowNum = index + 1;
      const scCode = (r.subcenterCode || '').trim().toUpperCase();
      const scName = (r.subcenterName || '').trim();
      const vilCode = (r.villageCode || '').trim().toUpperCase();
      const vilName = (r.villageName || '').trim();
      const engName = (r.englishName || '').trim() || vilName;
      const taluka = (r.taluka || '').trim() || 'औसा';
      const dist = (r.district || '').trim() || 'लातूर';

      const rowIssues: string[] = [];

      if (!scCode) rowIssues.push('उपकेंद्र कोड आवश्यक आहे.');
      if (!scName) rowIssues.push('उपकेंद्र नाव आवश्यक आहे.');
      if (!vilCode) rowIssues.push('गाव कोड आवश्यक आहे.');
      if (!vilName) rowIssues.push('गाव नाव आवश्यक आहे.');

      let status: 'VALID' | 'DUPLICATE' | 'INVALID' = 'VALID';

      if (rowIssues.length > 0) {
        status = 'INVALID';
        summary.errors.push(`ओळ ${rowNum}: ${rowIssues.join(', ')}`);
      } else if (seenVillageCodes.has(vilCode) || batchVillageCodes.has(vilCode)) {
        status = 'DUPLICATE';
        summary.duplicatesFound++;
        rowIssues.push(`गाव कोड "${vilCode}" आधीपासून अस्तित्वात आहे.`);
      } else {
        batchVillageCodes.add(vilCode);
        summary.validRows++;
        validatedItems.push({
          scCode,
          scName,
          vilCode,
          vilName,
          engName,
          taluka,
          dist,
        });
      }

      summary.previewRows.push({
        rowNumber: rowNum,
        subcenterCode: scCode,
        subcenterName: scName,
        villageCode: vilCode,
        villageName: vilName,
        englishName: engName,
        taluka,
        district: dist,
        status,
        issues: rowIssues,
      });
    }

    // Atomic execution for validated rows
    if (validatedItems.length > 0) {
      for (const item of validatedItems) {
        // 1. Find or create Subcenter
        let sc = this.subcenters.find(
          (s) => s.subcenterCode.toUpperCase() === item.scCode || s.subcenterName === item.scName
        );

        if (!sc) {
          const scId = `SC-${item.scCode}-${String(this.subcenters.length + 1).padStart(2, '0')}`;
          sc = {
            id: scId,
            subcenterCode: item.scCode,
            subcenterName: item.scName,
            marathiName: `उपकेंद्र ${item.scName}`,
            phcName: 'भादा',
            taluka: item.taluka,
            district: item.dist,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.subcenters.push(sc);
          summary.subcentersCreated++;
        }

        // 2. Create Village
        const vilId = `VIL-${String(this.villages.length + 1).padStart(3, '0')}`;
        const newVillage: VillageMaster = {
          id: vilId,
          code: item.vilCode,
          name: item.vilName,
          englishName: item.engName,
          subcenterId: sc.id,
          subcenterName: sc.subcenterName,
          subcenter: sc.subcenterName,
          phcName: sc.phcName || 'भादा',
          taluka: item.taluka,
          district: item.dist,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.villages.push(newVillage);
        summary.villagesCreated++;
      }

      saveToStorage(STORAGE_KEYS.SUBCENTERS, this.subcenters);
      saveToStorage(STORAGE_KEYS.VILLAGES, this.villages);

      this.logAudit({
        action: 'CREATE',
        tableName: 'villages',
        recordId: 'BULK-IMPORT',
        summary: `मास्टर डेटा आयात: ${summary.subcentersCreated} नवीन उपकेंद्रे, ${summary.villagesCreated} नवीन गावे.`,
        newData: { subcentersCreated: summary.subcentersCreated, villagesCreated: summary.villagesCreated },
      });

      this.notifyListeners();
    }

    return summary;
  }

  // ==========================================
  // SOURCES (Village & Sample-Type specific)
  // ==========================================
  getSources(villageId?: string, sampleTypeId?: string, subcenterId?: string): SourceMaster[] {
    let list = this.sources.filter((s) => s.isActive);

    if (subcenterId && subcenterId !== 'ALL') {
      const allowedVillageIds = new Set(
        this.villages.filter((v) => v.subcenterId === subcenterId).map((v) => v.id)
      );
      list = list.filter((s) => allowedVillageIds.has(s.villageId));
    }

    if (villageId && villageId !== 'ALL') {
      list = list.filter((s) => s.villageId === villageId);
    }

    if (sampleTypeId && sampleTypeId !== 'ALL') {
      list = list.filter((s) => s.sampleTypeId === sampleTypeId);
    }

    return list;
  }

  getAllSources(): SourceMaster[] {
    return [...this.sources];
  }

  addSource(sourceData: Omit<SourceMaster, 'id' | 'createdAt' | 'updatedAt'>): SourceMaster {
    const village = this.villages.find((v) => v.id === sourceData.villageId);
    const sampleType = this.sampleTypes.find((st) => st.id === sourceData.sampleTypeId);

    const prefix = village ? village.code : 'SRC';
    const count = this.sources.filter((s) => s.villageId === sourceData.villageId).length + 1;
    const newId = `SRC-${prefix}-${String(count).padStart(3, '0')}`;

    const newSource: SourceMaster = {
      ...sourceData,
      id: newId,
      villageName: village ? village.name : sourceData.villageName,
      sampleTypeName: sampleType ? sampleType.name : sourceData.sampleTypeName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.sources.push(newSource);
    saveToStorage(STORAGE_KEYS.SOURCES, this.sources);

    this.logAudit({
      action: 'CREATE',
      tableName: 'sources',
      recordId: newId,
      summary: `नवीन पाणी स्त्रोत नोंदवला: ${newSource.sourceName} (${newSource.villageName}, ${newSource.sourceType})`,
      newData: newSource as unknown as Record<string, unknown>,
    });

    return newSource;
  }

  updateSource(id: string, updates: Partial<SourceMaster>): SourceMaster | null {
    const user = this.getCurrentUser();
    const idx = this.sources.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    // Only Admins can deactivate or reactivate historical sources
    if (updates.isActive !== undefined && updates.isActive !== this.sources[idx].isActive && user.role !== 'ADMIN') {
      console.warn('Security Violation: Only Admins can change source activation status');
      return null;
    }

    const old = { ...this.sources[idx] };
    this.sources[idx] = {
      ...this.sources[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.SOURCES, this.sources);

    this.logAudit({
      action: 'UPDATE',
      tableName: 'sources',
      recordId: id,
      summary: `स्त्रोत माहिती अद्ययावत केली: ${this.sources[idx].sourceName}`,
      oldData: old as unknown as Record<string, unknown>,
      newData: this.sources[idx] as unknown as Record<string, unknown>,
    });

    this.notifyListeners();
    return this.sources[idx];
  }

  deactivateSource(id: string): { success: boolean; message: string } {
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      return { success: false, message: 'केवळ प्रशासक (Admin) स्त्रोत निष्क्रिय करू शकतात.' };
    }

    const src = this.sources.find((s) => s.id === id);
    if (!src) {
      return { success: false, message: 'स्त्रोत सापडला नाही.' };
    }

    src.isActive = false;
    src.updatedAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.SOURCES, this.sources);

    this.logAudit({
      action: 'DEACTIVATE',
      tableName: 'sources',
      recordId: id,
      summary: `स्त्रोत निष्क्रिय केला: ${src.sourceName} (${src.villageName})`,
      newData: { isActive: false },
    });

    this.notifyListeners();
    return { success: true, message: `स्त्रोत "${src.sourceName}" यशस्वीरीत्या निष्क्रिय केला.` };
  }

  restoreSource(id: string): { success: boolean; message: string } {
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      return { success: false, message: 'केवळ प्रशासक (Admin) स्त्रोत पुनर्संचयित करू शकतात.' };
    }

    const src = this.sources.find((s) => s.id === id);
    if (!src) {
      return { success: false, message: 'स्त्रोत सापडला नाही.' };
    }

    src.isActive = true;
    src.updatedAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.SOURCES, this.sources);

    this.logAudit({
      action: 'RESTORE',
      tableName: 'sources',
      recordId: id,
      summary: `स्त्रोत पुनर्संचयित केला: ${src.sourceName} (${src.villageName})`,
      newData: { isActive: true },
    });

    this.notifyListeners();
    return { success: true, message: `स्त्रोत "${src.sourceName}" सक्रिय केला.` };
  }

  // ==========================================
  // SAMPLES (One Authoritative Record)
  // ==========================================
  generateSampleId(sampleTypeId: string): string {
    const sampleType = this.sampleTypes.find((st) => st.id === sampleTypeId);
    const prefix = sampleType ? sampleType.codePrefix : 'SMP';
    const year = new Date().getFullYear();

    const existingInYear = this.samples.filter((s) => s.id.startsWith(`${prefix}-${year}`));
    const seq = existingInYear.length + 1;

    let candidate = `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
    let nextSeq = seq;
    // Prevent sequential collisions across local store and pending sync queue
    while (
      this.samples.some((s) => s.id === candidate) ||
      this.syncQueue.some((op) => op.entityId === candidate)
    ) {
      nextSeq++;
      candidate = `${prefix}-${year}-${String(nextSeq).padStart(4, '0')}`;
    }
    return candidate;
  }

  getSamples(filter?: {
    sampleTypeId?: string;
    subcenterId?: string;
    villageId?: string;
    sourceId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    searchQuery?: string;
    includeInactive?: boolean;
  }): SampleRecord[] {
    let list = this.samples.filter((s) => filter?.includeInactive || s.isActive);

    if (filter?.sampleTypeId && filter.sampleTypeId !== 'ALL') {
      list = list.filter((s) => s.sampleTypeId === filter.sampleTypeId);
    }

    if (filter?.subcenterId && filter.subcenterId !== 'ALL') {
      list = list.filter((s) => s.subcenterId === filter.subcenterId || s.subcenter === filter.subcenterId);
    }

    if (filter?.villageId && filter.villageId !== 'ALL') {
      list = list.filter((s) => s.villageId === filter.villageId);
    }

    if (filter?.sourceId && filter.sourceId !== 'ALL') {
      list = list.filter((s) => s.sourceId === filter.sourceId);
    }

    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter((s) => s.status === filter.status);
    }

    if (filter?.startDate) {
      list = list.filter((s) => s.collectionDate >= filter.startDate!);
    }

    if (filter?.endDate) {
      list = list.filter((s) => s.collectionDate <= filter.endDate!);
    }

    if (filter?.searchQuery) {
      const q = filter.searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.villageName.toLowerCase().includes(q) ||
          (s.subcenterName && s.subcenterName.toLowerCase().includes(q)) ||
          (s.subcenter && s.subcenter.toLowerCase().includes(q)) ||
          (s.sourceName && s.sourceName.toLowerCase().includes(q)) ||
          (s.patientName && s.patientName.toLowerCase().includes(q)) ||
          (s.sendingLetterNumber && s.sendingLetterNumber.toLowerCase().includes(q)) ||
          (s.reportNumber && s.reportNumber.toLowerCase().includes(q)) ||
          (s.batchNumber && s.batchNumber.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime());
  }

  getSampleById(id: string): SampleRecord | null {
    return this.samples.find((s) => s.id === id) || null;
  }

  checkDuplicateSample(params: {
    patientName?: string;
    patientRegNo?: string;
    registrationNo?: string;
    villageId?: string;
    collectionDate?: string;
    sampleTypeId?: string;
    excludeSampleId?: string;
  }): SampleRecord | null {
    const normName = (params.patientName || '').trim().toLowerCase();
    const normReg = (params.patientRegNo || params.registrationNo || '').trim().toLowerCase();
    if (!normName && !normReg) return null;

    return (
      this.samples.find((s) => {
        if (!s.isActive) return false;
        if (params.excludeSampleId && s.id === params.excludeSampleId) return false;
        if (params.sampleTypeId && s.sampleTypeId !== params.sampleTypeId) return false;
        if (params.villageId && s.villageId !== params.villageId) return false;
        if (params.collectionDate && s.collectionDate !== params.collectionDate) return false;

        const sName = (s.patientName || '').trim().toLowerCase();
        const sReg = (s.patientRegNo || s.registrationNo || '').trim().toLowerCase();

        const nameMatch = Boolean(normName && sName && normName === sName);
        const regMatch = Boolean(normReg && sReg && normReg === sReg);

        return nameMatch || regMatch;
      }) || null
    );
  }

  addSample(sampleData: Omit<SampleRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdByName' | 'isActive'>): SampleRecord {
    const user = this.getCurrentUser();
    const newId = this.generateSampleId(sampleData.sampleTypeId);
    const internalUuid = sampleData.uuid || generateUUID();

    // Resolve authoritative hierarchy from Village and Subcenter masters
    const vil = this.villages.find((v) => v.id === sampleData.villageId);
    if (!vil) {
      throw new Error(`अवैध गाव निवड: Village ID "${sampleData.villageId}" मास्टर डेटाबेसमध्ये सापडले नाही.`);
    }

    // Defensive Hierarchy Validation 1: Subcenter -> Village constraint
    if (sampleData.subcenterId && vil.subcenterId && sampleData.subcenterId !== vil.subcenterId) {
      throw new Error(`अवैध संबंध (Invalid Hierarchy): गाव "${vil.name}" हे निवडलेल्या उपकेंद्रात समाविष्ट नाही.`);
    }

    // Defensive Hierarchy Validation 2: Village -> Source constraint
    if (sampleData.sourceId) {
      const src = this.sources.find((s) => s.id === sampleData.sourceId);
      if (src && src.villageId !== sampleData.villageId) {
        throw new Error(`अवैध संबंध (Invalid Hierarchy): निवडलेला स्त्रोत "${src.sourceName}" हा निवडलेल्या गावाशी (${vil.name}) संबंधित नाही.`);
      }
    }

    const subcenterId = vil.subcenterId || sampleData.subcenterId;
    const sc = subcenterId ? this.subcenters.find((s) => s.id === subcenterId) : null;
    const subcenterName = (sc ? sc.subcenterName : (vil.subcenterName || vil.subcenter)) || sampleData.subcenterName;
    const phcName = vil.phcName || (sc ? sc.phcName : 'भादा');
    const taluka = vil.taluka || (sc ? sc.taluka : 'औसा');
    const district = vil.district || (sc ? sc.district : 'लातूर');

    const newSample: SampleRecord = {
      ...sampleData,
      id: newId,
      uuid: internalUuid,
      subcenterId,
      subcenterName,
      subcenter: subcenterName || sampleData.subcenter || '',
      phcName,
      taluka,
      district,
      status: sampleData.status || 'Collected',
      syncStatus: 'PENDING_SYNC',
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date().toISOString(),
      updatedBy: user.id,
      updatedByName: user.name,
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    this.samples.unshift(newSample);
    saveToStorage(STORAGE_KEYS.SAMPLES, this.samples);

    // Enqueue Idempotent Sync Operation
    const syncOp: PendingSyncOperation = {
      localId: `OP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      operationType: 'INSERT',
      entityType: 'sample',
      entityId: newSample.id,
      payload: newSample as unknown as Record<string, unknown>,
      createdTime: new Date().toISOString(),
      syncStatus: 'PENDING',
      retryCount: 0,
      idempotencyKey: `sample_insert_${newSample.id}`,
    };
    this.enqueueSyncOperation(syncOp);

    this.logAudit({
      action: 'CREATE',
      tableName: 'samples',
      recordId: newId,
      summary: `नवीन नमुना नोंदणी: ${newId} (${newSample.villageName}, ${newSample.sampleTypeName})`,
      newData: newSample as unknown as Record<string, unknown>,
    });

    this.notifyListeners();
    return newSample;
  }

  addBatchSamples(samplesList: Array<Omit<SampleRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdByName' | 'isActive'>>): SampleRecord[] {
    const created: SampleRecord[] = [];
    for (const data of samplesList) {
      const sample = this.addSample(data);
      created.push(sample);
    }
    return created;
  }

  updateSample(id: string, updates: Partial<SampleRecord>): SampleRecord | null {
    const user = this.getCurrentUser();
    const idx = this.samples.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    // Security check: USER cannot update inactive/soft-deleted record
    if (!this.samples[idx].isActive && user.role !== 'ADMIN') {
      console.warn('Security Violation: Inactive records can only be modified by Admins');
      return null;
    }

    // Security check: USER cannot modify isActive directly via updateSample
    if (updates.isActive !== undefined && updates.isActive !== this.samples[idx].isActive && user.role !== 'ADMIN') {
      console.warn('Security Violation: Soft-delete or restore requires Admin privileges');
      return null;
    }

    const old = { ...this.samples[idx] };
    this.samples[idx] = {
      ...this.samples[idx],
      ...updates,
      syncStatus: 'PENDING_SYNC',
      updatedBy: user.id,
      updatedByName: user.name,
      updatedAt: new Date().toISOString(),
    };

    saveToStorage(STORAGE_KEYS.SAMPLES, this.samples);

    // Enqueue Idempotent Sync Operation
    const syncOp: PendingSyncOperation = {
      localId: `OP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      operationType: 'UPDATE',
      entityType: 'sample',
      entityId: id,
      payload: this.samples[idx] as unknown as Record<string, unknown>,
      createdTime: new Date().toISOString(),
      syncStatus: 'PENDING',
      retryCount: 0,
      idempotencyKey: `sample_update_${id}_${Date.now()}`,
    };
    this.enqueueSyncOperation(syncOp);

    this.logAudit({
      action: updates.reportNumber || updates.result ? 'REPORT_UPDATE' : 'UPDATE',
      tableName: 'samples',
      recordId: id,
      summary: `नमुना अद्ययावत केला (${id}): ${updates.result ? `निकाल: ${updates.result}` : 'माहिती बदलली'}`,
      oldData: old as unknown as Record<string, unknown>,
      newData: this.samples[idx] as unknown as Record<string, unknown>,
    });

    this.notifyListeners();
    return this.samples[idx];
  }

  softDeleteSample(id: string, reason?: string): { success: boolean; message: string } {
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      return { success: false, message: 'केवळ ॲडमिनला नमुना नष्ट (Soft Delete) करण्याचा अधिकार आहे.' };
    }

    const idx = this.samples.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, message: 'नमुना सापडला नाही.' };

    const sample = this.samples[idx];
    const old = { ...sample };

    // Set isActive to false
    this.samples[idx].isActive = false;
    this.samples[idx].syncStatus = 'PENDING_SYNC';
    this.samples[idx].updatedBy = user.id;
    this.samples[idx].updatedByName = user.name;
    this.samples[idx].updatedAt = new Date().toISOString();
    this.samples[idx].remarks = `${sample.remarks || ''} [नमुना ॲडमिनद्वारे निष्क्रिय केला: ${reason || 'कारण नमूद नाही'}]`.trim();

    saveToStorage(STORAGE_KEYS.SAMPLES, this.samples);

    // Enqueue Soft Delete Sync Operation
    const syncOp: PendingSyncOperation = {
      localId: `OP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      operationType: 'SOFT_DELETE',
      entityType: 'sample',
      entityId: id,
      payload: { id, is_active: false, updated_at: this.samples[idx].updatedAt },
      createdTime: new Date().toISOString(),
      syncStatus: 'PENDING',
      retryCount: 0,
      idempotencyKey: `sample_soft_delete_${id}`,
    };
    this.enqueueSyncOperation(syncOp);

    this.logAudit({
      action: 'DELETE',
      tableName: 'samples',
      recordId: id,
      summary: `ॲडमिनद्वारे नमुना निष्क्रिय केला (Soft Delete): ${id} (${reason || 'कोणतेही कारण नाही'})`,
      oldData: old as unknown as Record<string, unknown>,
      newData: this.samples[idx] as unknown as Record<string, unknown>,
    });

    this.notifyListeners();
    return { success: true, message: `नमुना ${id} यशस्वीरित्या निष्क्रिय (Soft Deleted) केला आहे.` };
  }

  restoreSample(id: string): { success: boolean; message: string } {
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      return { success: false, message: 'केवळ ॲडमिनला नमुना पूर्ववत (Restore) करण्याचा अधिकार आहे.' };
    }

    const idx = this.samples.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, message: 'नमुना सापडला नाही.' };

    this.samples[idx].isActive = true;
    this.samples[idx].syncStatus = 'PENDING_SYNC';
    this.samples[idx].updatedBy = user.id;
    this.samples[idx].updatedByName = user.name;
    this.samples[idx].updatedAt = new Date().toISOString();

    saveToStorage(STORAGE_KEYS.SAMPLES, this.samples);

    // Enqueue Restore Sync Operation
    const syncOp: PendingSyncOperation = {
      localId: `OP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      operationType: 'RESTORE',
      entityType: 'sample',
      entityId: id,
      payload: { id, is_active: true, updated_at: this.samples[idx].updatedAt },
      createdTime: new Date().toISOString(),
      syncStatus: 'PENDING',
      retryCount: 0,
      idempotencyKey: `sample_restore_${id}`,
    };
    this.enqueueSyncOperation(syncOp);

    this.logAudit({
      action: 'RESTORE',
      tableName: 'samples',
      recordId: id,
      summary: `ॲडमिनद्वारे नमुना पूर्ववत (Restored) केला: ${id}`,
      newData: this.samples[idx] as unknown as Record<string, unknown>,
    });

    this.notifyListeners();
    return { success: true, message: `नमुना ${id} पूर्ववत (Restored) केला आहे.` };
  }

  // ==========================================
  // SENDING LETTERS
  // ==========================================
  getSendingLetters(): SendingLetter[] {
    return [...this.sendingLetters].sort(
      (a, b) => new Date(b.letterDate).getTime() - new Date(a.letterDate).getTime()
    );
  }

  generateLetterNumber(sampleTypeId: string): string {
    const sampleType = this.sampleTypes.find((st) => st.id === sampleTypeId);
    const shortName = sampleType?.codePrefix || 'SMP';
    const year = new Date().getFullYear();
    const count = this.sendingLetters.length + 1;
    return `जा.क्र./प्राआकेंद्राभादा/${shortName}/${year}/${String(count).padStart(2, '0')}`;
  }

  createSendingLetter(
    letterData: Omit<SendingLetter, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): SendingLetter {
    const user = this.getCurrentUser();
    const newId = `LTR-${new Date().getFullYear()}-${String(this.sendingLetters.length + 1).padStart(4, '0')}`;

    const newLetter: SendingLetter = {
      ...letterData,
      id: newId,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.sendingLetters.unshift(newLetter);
    saveToStorage(STORAGE_KEYS.SENDING_LETTERS, this.sendingLetters);

    // Link each sample permanently to this letter & update sendingDate + status
    for (const sampleId of newLetter.sampleIds) {
      const idx = this.samples.findIndex((s) => s.id === sampleId);
      if (idx !== -1) {
        this.samples[idx].sendingLetterId = newLetter.id;
        this.samples[idx].sendingLetterNumber = newLetter.letterNumber;
        this.samples[idx].sendingDate = newLetter.letterDate;
        this.samples[idx].dispatchDate = this.samples[idx].dispatchDate || newLetter.letterDate;
        this.samples[idx].laboratoryName = newLetter.laboratoryName;
        this.samples[idx].dispatchMode = newLetter.dispatchMode;
        if (this.samples[idx].status === 'Collected' || this.samples[idx].status === 'Ready for Dispatch') {
          this.samples[idx].status = 'Dispatched';
        }
        this.samples[idx].updatedBy = user.id;
        this.samples[idx].updatedByName = user.name;
        this.samples[idx].updatedAt = new Date().toISOString();
      }
    }
    saveToStorage(STORAGE_KEYS.SAMPLES, this.samples);

    this.logAudit({
      action: 'DISPATCH',
      tableName: 'sending_letters',
      recordId: newId,
      summary: `नमुना पाठवणी पत्र तयार केले: ${newLetter.letterNumber} (${newLetter.sampleCount} नमुने जोडले)`,
      newData: newLetter as unknown as Record<string, unknown>,
    });

    // Enqueue Sending Letter Sync Operation
    const syncOp: PendingSyncOperation = {
      localId: `OP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      operationType: 'INSERT',
      entityType: 'sending_letter',
      entityId: newId,
      payload: newLetter as unknown as Record<string, unknown>,
      createdTime: new Date().toISOString(),
      syncStatus: 'PENDING',
      retryCount: 0,
      idempotencyKey: `letter_insert_${newLetter.letterNumber}`,
    };
    this.enqueueSyncOperation(syncOp);

    this.notifyListeners();
    return newLetter;
  }

  // ==========================================
  // AUDIT LOGGING (Append-Only & Immutable)
  // ==========================================
  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Strict immutability: Updates and Deletions strictly forbidden
  deleteAuditLog(): never {
    throw new Error('Security Violation: Audit logs are immutable and cannot be deleted.');
  }

  updateAuditLog(): never {
    throw new Error('Security Violation: Audit logs are immutable and cannot be updated.');
  }

  logAudit(entry: {
    action: AuditLog['action'];
    tableName: string;
    recordId: string;
    summary: string;
    oldData?: Record<string, unknown> | null;
    newData?: Record<string, unknown> | null;
  }): void {
    const user = this.getCurrentUser();
    const log: AuditLog = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: entry.action,
      tableName: entry.tableName,
      recordId: entry.recordId,
      oldData: entry.oldData,
      newData: entry.newData,
      summary: entry.summary,
      timestamp: new Date().toISOString(),
    };

    this.auditLogs.unshift(log);
    // Keep max 500 logs locally
    if (this.auditLogs.length > 500) {
      this.auditLogs = this.auditLogs.slice(0, 500);
    }
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);

    // Enqueue Audit Log Sync Operation (Cloud append-only)
    const syncOp: PendingSyncOperation = {
      localId: `OP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      operationType: 'INSERT',
      entityType: 'audit_log',
      entityId: log.id,
      payload: {
        id: log.id,
        user_id: log.userId,
        user_name: log.userName,
        user_role: log.userRole,
        action: log.action,
        table_name: log.tableName,
        record_id: log.recordId,
        old_data: log.oldData || null,
        new_data: log.newData || null,
        summary: log.summary,
        created_at: log.timestamp,
      },
      createdTime: new Date().toISOString(),
      syncStatus: 'PENDING',
      retryCount: 0,
      idempotencyKey: `audit_log_insert_${log.id}`,
    };
    this.enqueueSyncOperation(syncOp);
  }

  // ==========================================
  // CSV / EXCEL MASTER IMPORT VALIDATION
  // ==========================================
  validateAndImportMasterData(csvText: string): MasterImportSummary {
    const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);
    const resultRows: MasterImportRow[] = [];
    let valid = 0;
    let invalid = 0;
    let duplicate = 0;

    // Header index mapping
    const header = lines[0]?.toLowerCase() || '';
    const isHeaderPresent = header.includes('village') || header.includes('गाव') || header.includes('source') || header.includes('स्त्रोत');
    const dataLines = isHeaderPresent ? lines.slice(1) : lines;

    for (const line of dataLines) {
      const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length < 3) {
        resultRows.push({
          villageName: parts[0] || 'Unknown',
          sampleTypeName: parts[1] || 'Unknown',
          sourceName: parts[2] || '',
          sourceCode: parts[3] || '',
          sourceType: parts[4] || '',
          locationAddress: parts[5] || '',
          status: 'INVALID',
          errorMessage: 'कमीत कमी ३ आवश्यक स्तंभ (गाव, नमुना प्रकार, स्त्रोताचे नाव) आवश्यक आहेत.',
        });
        invalid++;
        continue;
      }

      const villageName = parts[0];
      const sampleTypeName = parts[1];
      const sourceName = parts[2];
      const sourceCode = parts[3] || `SRC-${Math.floor(Math.random() * 900 + 100)}`;
      const sourceType = parts[4] || 'विहीर';
      const locationAddress = parts[5] || villageName;

      // Find village
      const village = this.villages.find(
        (v) =>
          v.name.toLowerCase() === villageName.toLowerCase() ||
          v.englishName.toLowerCase() === villageName.toLowerCase()
      );

      if (!village) {
        resultRows.push({
          villageName,
          sampleTypeName,
          sourceName,
          sourceCode,
          sourceType,
          locationAddress,
          status: 'INVALID',
          errorMessage: `गाव '${villageName}' गाव मास्टरमध्ये अस्तित्वात नाही.`,
        });
        invalid++;
        continue;
      }

      // Check duplicate
      const isDuplicate = this.sources.some(
        (s) =>
          s.villageId === village.id &&
          s.sourceName.toLowerCase() === sourceName.toLowerCase()
      );

      if (isDuplicate) {
        resultRows.push({
          villageName,
          sampleTypeName,
          sourceName,
          sourceCode,
          sourceType,
          locationAddress,
          status: 'DUPLICATE',
          errorMessage: `हा स्त्रोत '${sourceName}' या गावात आधीच अस्तित्वात आहे.`,
        });
        duplicate++;
        continue;
      }

      // Valid: Create source
      const sampleType = this.sampleTypes.find(
        (st) =>
          st.name.toLowerCase().includes(sampleTypeName.toLowerCase()) ||
          st.marathiName.toLowerCase().includes(sampleTypeName.toLowerCase()) ||
          st.codePrefix.toLowerCase() === sampleTypeName.toLowerCase()
      ) || this.sampleTypes[0];

      this.addSource({
        villageId: village.id,
        villageName: village.name,
        sampleTypeId: sampleType.id,
        sampleTypeName: sampleType.name,
        sourceName,
        sourceCode,
        sourceType,
        locationAddress,
        isActive: true,
      });

      resultRows.push({
        villageName,
        sampleTypeName: sampleType.marathiName,
        sourceName,
        sourceCode,
        sourceType,
        locationAddress,
        status: 'VALID',
      });
      valid++;
    }

    return {
      totalRows: dataLines.length,
      validRows: valid,
      invalidRows: invalid,
      duplicateRows: duplicate,
      rows: resultRows,
    };
  }

  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================
  getDashboardStats() {
    const todayStr = new Date().toISOString().split('T')[0];
    const thisMonthStr = todayStr.substring(0, 7); // YYYY-MM

    const activeSamples = this.samples.filter((s) => s.isActive);
    const todaySamples = activeSamples.filter((s) => s.collectionDate === todayStr);
    const monthSamples = activeSamples.filter((s) => s.collectionDate.startsWith(thisMonthStr));

    const dispatchedCount = activeSamples.filter(
      (s) => s.status === 'Dispatched' || s.status === 'Report Pending'
    ).length;
    const reportPendingCount = activeSamples.filter(
      (s) => s.status === 'Dispatched' || s.status === 'Report Pending' || s.status === 'Ready for Dispatch'
    ).length;
    const reportReceivedCount = activeSamples.filter(
      (s) => s.status === 'Report Received' || s.status === 'Report Updated' || s.status === 'Closed'
    ).length;

    // By sample type
    const byTypeSummary = this.sampleTypes.map((st) => {
      const typeSamples = activeSamples.filter((s) => s.sampleTypeId === st.id);
      const pending = typeSamples.filter(
        (s) => s.status === 'Collected' || s.status === 'Ready for Dispatch' || s.status === 'Dispatched' || s.status === 'Report Pending'
      ).length;
      const received = typeSamples.filter(
        (s) => s.status === 'Report Received' || s.status === 'Report Updated' || s.status === 'Closed'
      ).length;
      const fitCount = typeSamples.filter((s) => s.result === 'पिण्यास योग्य' || s.result?.includes('प्रमाणित')).length;
      const unfitCount = typeSamples.filter((s) => s.result === 'पिण्यास अयोग्य' || s.result?.includes('अप्रमाणित') || s.result === 'पॉझिटिव्ह').length;

      return {
        id: st.id,
        name: st.marathiName,
        englishName: st.name,
        codePrefix: st.codePrefix,
        total: typeSamples.length,
        pending,
        received,
        fitCount,
        unfitCount,
      };
    });

    // By village
    const byVillageSummary = this.villages.map((v) => {
      const vSamples = activeSamples.filter((s) => s.villageId === v.id);
      const vSources = this.sources.filter((s) => s.villageId === v.id && s.isActive);
      return {
        id: v.id,
        name: v.name,
        subcenter: v.subcenter,
        totalSamples: vSamples.length,
        totalSources: vSources.length,
        pendingReports: vSamples.filter((s) => !s.reportReceivedDate).length,
      };
    });

    return {
      totalSamples: activeSamples.length,
      todaySamples: todaySamples.length,
      monthSamples: monthSamples.length,
      dispatchedCount,
      reportPendingCount,
      reportReceivedCount,
      activeVillagesCount: this.villages.filter((v) => v.isActive).length,
      activeSourcesCount: this.sources.filter((s) => s.isActive).length,
      byTypeSummary,
      byVillageSummary,
    };
  }

  // ==========================================
  // SYNC ENGINE & RECONCILIATION API
  // ==========================================
  getSyncQueue(): PendingSyncOperation[] {
    return [...this.syncQueue];
  }

  getPendingSyncCount(): number {
    return this.syncQueue.filter((op) => op.syncStatus === 'PENDING' || op.syncStatus === 'FAILED').length;
  }

  getConflictCount(): number {
    return this.syncQueue.filter((op) => op.syncStatus === 'CONFLICT').length;
  }

  enqueueSyncOperation(op: PendingSyncOperation): void {
    this.syncQueue.unshift(op);
    saveToStorage(STORAGE_KEYS.SYNC_QUEUE, this.syncQueue);
    this.notifyListeners();

    // Trigger background sync if online
    if (typeof window !== 'undefined' && navigator.onLine) {
      setTimeout(() => {
        this.processSyncQueue().catch((err) => console.warn('Background sync error:', err));
      }, 50);
    }
  }

  mapSampleToSupabaseRow(s: SampleRecord, includeSubcenterId: boolean = true): Record<string, unknown> {
    const row: Record<string, unknown> = {
      id: s.id,
      sample_type_id: s.sampleTypeId,
      collection_date: s.collectionDate,
      dispatch_date: s.dispatchDate || null,
      sending_date: s.sendingDate || null,
      report_received_date: s.reportReceivedDate || null,
      report_update_date: s.reportUpdateDate || null,
      village_id: s.villageId,
      subcenter: s.subcenter,
      source_id: s.sourceId || null,
      source_name: s.sourceName || null,
      source_type: s.sourceType || null,
      sample_collector: s.sampleCollector || null,
      sample_quantity: s.sampleQuantity || null,
      sample_code_bottle_no: s.sampleCodeOrBottleNo || null,
      shop_or_institution_name: s.shopOrInstitutionName || null,
      batch_number: s.batchNumber || null,
      manufacturer_name: s.manufacturerName || null,
      mfd_date: s.mfdDate || null,
      exp_date: s.expDate || null,
      sample_description: s.sampleDescription || null,
      patient_id: s.patientId || null,
      patient_name: s.patientName || null,
      age: s.age || null,
      sex: s.sex || null,
      patient_address: s.patientAddress || null,
      contact_number: s.contactNumber || null,
      fever_onset_date: s.feverOnsetDate || null,
      test_requested: s.testRequested || null,
      sending_letter_id: s.sendingLetterId || null,
      sending_letter_number: s.sendingLetterNumber || null,
      laboratory_name: s.laboratoryName,
      dispatch_mode: s.dispatchMode || null,
      status: s.status,
      report_number: s.reportNumber || null,
      result: s.result || null,
      result_quantitative: s.resultQuantitative || {},
      report_remarks: s.reportRemarks || null,
      report_attachment_url: s.reportAttachmentUrl || null,
      report_file_name: s.reportFileName || null,
      remarks: s.remarks || null,
      is_active: s.isActive,
      created_by_name: s.createdByName,
      updated_by_name: s.updatedByName || null,
      updated_at: s.updatedAt || new Date().toISOString(),
    };

    if (includeSubcenterId && s.subcenterId) {
      row.subcenter_id = s.subcenterId;
    }

    return row;
  }

  mapSupabaseRowToSample(row: Record<string, any>): SampleRecord {
    const subcenterId = row.subcenter_id || undefined;
    const matchedSc = subcenterId ? this.subcenters.find((sc) => sc.id === subcenterId) : undefined;
    const subcenterName = matchedSc?.subcenterName || row.subcenter || '';

    return {
      id: row.id,
      sampleTypeId: row.sample_type_id,
      sampleTypeName: this.sampleTypes.find((st) => st.id === row.sample_type_id)?.name || '',
      collectionDate: row.collection_date,
      dispatchDate: row.dispatch_date || undefined,
      sendingDate: row.sending_date || undefined,
      reportReceivedDate: row.report_received_date || undefined,
      reportUpdateDate: row.report_update_date || undefined,
      subcenterId,
      subcenterName,
      subcenter: subcenterName,
      villageId: row.village_id,
      villageName: this.villages.find((v) => v.id === row.village_id)?.name || '',
      phcName: 'भादा',
      taluka: 'औसा',
      district: 'लातूर',
      sourceId: row.source_id || undefined,
      sourceName: row.source_name || undefined,
      sourceType: row.source_type || undefined,
      sampleCollector: row.sample_collector || undefined,
      sampleQuantity: row.sample_quantity || undefined,
      sampleCodeOrBottleNo: row.sample_code_bottle_no || undefined,
      shopOrInstitutionName: row.shop_or_institution_name || undefined,
      batchNumber: row.batch_number || undefined,
      manufacturerName: row.manufacturer_name || undefined,
      mfdDate: row.mfd_date || undefined,
      expDate: row.exp_date || undefined,
      sampleDescription: row.sample_description || undefined,
      patientId: row.patient_id || undefined,
      patientName: row.patient_name || undefined,
      age: row.age || undefined,
      sex: row.sex || undefined,
      patientAddress: row.patient_address || undefined,
      contactNumber: row.contact_number || undefined,
      feverOnsetDate: row.fever_onset_date || undefined,
      testRequested: row.test_requested || undefined,
      sendingLetterId: row.sending_letter_id || undefined,
      sendingLetterNumber: row.sending_letter_number || undefined,
      laboratoryName: row.laboratory_name || '',
      dispatchMode: row.dispatch_mode || undefined,
      status: row.status || 'Collected',
      reportNumber: row.report_number || undefined,
      result: row.result || undefined,
      resultQuantitative: row.result_quantitative || undefined,
      reportRemarks: row.report_remarks || undefined,
      reportAttachmentUrl: row.report_attachment_url || undefined,
      reportFileName: row.report_file_name || undefined,
      remarks: row.remarks || undefined,
      isActive: row.is_active !== false,
      createdBy: row.created_by || 'USR-001',
      createdByName: row.created_by_name || 'System',
      updatedByName: row.updated_by_name || undefined,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  }

  async processSyncQueue(): Promise<{ synced: number; failed: number; conflicts: number }> {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      return { synced: 0, failed: 0, conflicts: 0 };
    }

    let synced = 0;
    let failed = 0;
    let conflicts = 0;

    const pendingOps = this.syncQueue.filter((op) => op.syncStatus === 'PENDING' || op.syncStatus === 'FAILED');

    for (const op of pendingOps) {
      op.syncStatus = 'SYNCING';
      try {
        if (op.entityType === 'sample') {
          // If live Supabase connection is configured, execute remote operations
          if (isSupabaseConfigured && supabase) {
            // Check for concurrent conflict
            if (op.operationType === 'UPDATE' || op.operationType === 'INSERT') {
              const { data: remoteData, error: remoteErr } = await supabase
                .from('samples')
                .select('id, updated_at, status, result, result_quantitative')
                .eq('id', op.entityId)
                .maybeSingle();

              if (!remoteErr && remoteData && remoteData.updated_at) {
                const remoteTime = new Date(remoteData.updated_at).getTime();
                const opTime = new Date(op.createdTime).getTime();

                // If remote modified concurrently with differing report/status
                const payload = op.payload as Record<string, unknown>;
                if (
                  remoteTime > opTime &&
                  (remoteData.result !== payload.result || remoteData.status !== payload.status)
                ) {
                  op.syncStatus = 'CONFLICT';
                  op.lastError = 'Data conflict detected: Cloud database has newer conflicting report.';
                  const localSample = this.samples.find((s) => s.id === op.entityId);
                  if (localSample) {
                    localSample.syncStatus = 'CONFLICT';
                    localSample.conflictData = {
                      remote: remoteData as Record<string, unknown>,
                      local: payload,
                      message: 'Data conflict detected: Remote record modified recently.',
                    };
                  }
                  conflicts++;
                  continue;
                }
              }
            }

            const sample = this.samples.find((s) => s.id === op.entityId) || (op.payload as unknown as SampleRecord);
            let dbRow = this.mapSampleToSupabaseRow(sample, true);
            let { error: upsertErr } = await supabase.from('samples').upsert(dbRow, { onConflict: 'id' });

            // If subcenter_id column does not exist on remote schema yet, fallback defensively
            if (upsertErr && (upsertErr.message.includes('subcenter_id') || upsertErr.message.includes('schema cache'))) {
              dbRow = this.mapSampleToSupabaseRow(sample, false);
              const retryRes = await supabase.from('samples').upsert(dbRow, { onConflict: 'id' });
              upsertErr = retryRes.error;
            }

            if (upsertErr) {
              op.retryCount++;
              op.syncStatus = 'FAILED';
              op.lastError = upsertErr.message;
              failed++;
              continue;
            }
          }

          op.syncStatus = 'SYNCED';
          const localSample = this.samples.find((s) => s.id === op.entityId);
          if (localSample) {
            localSample.syncStatus = 'SYNCED';
            delete localSample.conflictData;
          }
          synced++;
        } else if (op.entityType === 'sending_letter') {
          if (isSupabaseConfigured && supabase) {
            const { error: letterErr } = await supabase.from('sending_letters').upsert(op.payload, { onConflict: 'id' });
            if (letterErr) {
              op.retryCount++;
              op.syncStatus = 'FAILED';
              op.lastError = letterErr.message;
              failed++;
              continue;
            }
          }
          op.syncStatus = 'SYNCED';
          synced++;
        } else if (op.entityType === 'audit_log') {
          if (isSupabaseConfigured && supabase) {
            const { error: auditErr } = await supabase.from('audit_logs').insert(op.payload);
            if (auditErr) {
              op.retryCount++;
              op.syncStatus = 'FAILED';
              op.lastError = auditErr.message;
              failed++;
              continue;
            }
          }
          op.syncStatus = 'SYNCED';
          synced++;
        } else {
          op.syncStatus = 'SYNCED';
          synced++;
        }
      } catch (err: unknown) {
        op.retryCount++;
        op.syncStatus = 'FAILED';
        op.lastError = err instanceof Error ? err.message : 'Unknown sync error';
        failed++;
      }
    }

    // Keep last 150 operations in local queue
    if (this.syncQueue.length > 150) {
      this.syncQueue = this.syncQueue.slice(0, 150);
    }

    saveToStorage(STORAGE_KEYS.SYNC_QUEUE, this.syncQueue);
    saveToStorage(STORAGE_KEYS.SAMPLES, this.samples);
    this.notifyListeners();

    return { synced, failed, conflicts };
  }

  async retryFailedSync(localId: string): Promise<boolean> {
    const op = this.syncQueue.find((o) => o.localId === localId);
    if (!op) return false;

    op.syncStatus = 'PENDING';
    op.retryCount = 0;
    saveToStorage(STORAGE_KEYS.SYNC_QUEUE, this.syncQueue);
    this.notifyListeners();

    const res = await this.processSyncQueue();
    return res.synced > 0;
  }

  resolveConflict(sampleId: string, resolution: 'KEEP_LOCAL' | 'ACCEPT_REMOTE'): boolean {
    const s = this.samples.find((x) => x.id === sampleId);
    if (!s || !s.conflictData) return false;

    if (resolution === 'ACCEPT_REMOTE') {
      const remote = s.conflictData.remote;
      if (remote.result) s.result = remote.result as string;
      if (remote.status) s.status = remote.status as SampleRecord['status'];
      s.syncStatus = 'SYNCED';
      delete s.conflictData;

      const op = this.syncQueue.find((o) => o.entityId === sampleId);
      if (op) {
        op.syncStatus = 'SYNCED';
      }
    } else {
      // Force keep local and schedule re-sync
      s.syncStatus = 'PENDING_SYNC';
      delete s.conflictData;

      const op = this.syncQueue.find((o) => o.entityId === sampleId);
      if (op) {
        op.syncStatus = 'PENDING';
        op.createdTime = new Date().toISOString();
      }
    }

    saveToStorage(STORAGE_KEYS.SAMPLES, this.samples);
    saveToStorage(STORAGE_KEYS.SYNC_QUEUE, this.syncQueue);
    this.notifyListeners();

    if (resolution === 'KEEP_LOCAL') {
      this.processSyncQueue().catch(() => {});
    }

    return true;
  }

  // Bidirectional Cloud Synchronization: Pull remote records
  async loadFromSupabase(): Promise<{ success: boolean; message: string; counts: Record<string, number> }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Supabase is not configured', counts: {} };
    }

    try {
      const counts: Record<string, number> = {};

      // 1. Pull Subcenters
      try {
        const { data: scData, error: scErr } = await supabase
          .from('subcenters')
          .select('*')
          .order('created_at', { ascending: true });
        if (!scErr && scData && scData.length > 0) {
          for (const row of scData) {
            const existing = this.subcenters.find((s) => s.id === row.id);
            if (!existing) {
              this.subcenters.push({
                id: row.id,
                subcenterCode: row.subcenter_code,
                subcenterName: row.subcenter_name,
                marathiName: row.marathi_name,
                phcName: row.phc || 'भादा',
                taluka: row.taluka || 'औसा',
                district: row.district || 'लातूर',
                isActive: row.is_active !== false,
                createdAt: row.created_at || new Date().toISOString(),
                updatedAt: row.updated_at || new Date().toISOString(),
              });
            }
          }
          counts.subcenters = scData.length;
          saveToStorage(STORAGE_KEYS.SUBCENTERS, this.subcenters);
        }
      } catch {
        // Table may not yet be created on cloud
      }

      // 2. Pull Villages
      try {
        const { data: vilData, error: vilErr } = await supabase.from('villages').select('*');
        if (!vilErr && vilData && vilData.length > 0) {
          for (const row of vilData) {
            const existing = this.villages.find((v) => v.id === row.id);
            if (!existing) {
              this.villages.push({
                id: row.id,
                name: row.name,
                englishName: row.english_name || row.name,
                code: row.code,
                subcenterId: row.subcenter_id || undefined,
                subcenterName: row.subcenter,
                subcenter: row.subcenter,
                phcName: 'भादा',
                taluka: row.taluka || 'औसा',
                district: row.district || 'लातूर',
                isActive: row.is_active !== false,
                createdAt: row.created_at || new Date().toISOString(),
                updatedAt: row.updated_at || new Date().toISOString(),
              });
            } else if (row.subcenter_id && !existing.subcenterId) {
              existing.subcenterId = row.subcenter_id;
            }
          }
          counts.villages = vilData.length;
          saveToStorage(STORAGE_KEYS.VILLAGES, this.villages);
        }
      } catch {
        // Ignored
      }

      // 3. Pull Samples
      try {
        const { data: smpData, error: smpErr } = await supabase.from('samples').select('*');
        if (!smpErr && smpData && smpData.length > 0) {
          for (const row of smpData) {
            const existing = this.samples.find((s) => s.id === row.id);
            const sampleObj = this.mapSupabaseRowToSample(row);
            if (!existing) {
              this.samples.push(sampleObj);
            } else if (new Date(row.updated_at).getTime() > new Date(existing.updatedAt).getTime()) {
              Object.assign(existing, sampleObj);
            }
          }
          counts.samples = smpData.length;
          saveToStorage(STORAGE_KEYS.SAMPLES, this.samples);
        }
      } catch {
        // Ignored
      }

      this.migrateSubcenterHierarchy();
      this.notifyListeners();
      return { success: true, message: 'Cloud data synchronized successfully', counts };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown sync error';
      return { success: false, message: msg, counts: {} };
    }
  }

  // Push all local authoritative master and sample records to cloud
  async syncAllToCloud(): Promise<{ success: boolean; synced: Record<string, number>; errors: string[] }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, synced: {}, errors: ['Supabase not configured'] };
    }

    const synced: Record<string, number> = { subcenters: 0, villages: 0, sources: 0, samples: 0 };
    const errors: string[] = [];

    // Push Subcenters
    for (const sc of this.subcenters) {
      try {
        const { error } = await supabase.from('subcenters').upsert({
          id: sc.id,
          subcenter_code: sc.subcenterCode,
          subcenter_name: sc.subcenterName,
          marathi_name: sc.marathiName,
          phc: sc.phcName || 'भादा',
          taluka: sc.taluka || 'औसा',
          district: sc.district || 'लातूर',
          is_active: sc.isActive,
          updated_at: sc.updatedAt || new Date().toISOString(),
        }, { onConflict: 'id' });
        if (error) {
          errors.push(`Subcenter ${sc.id}: ${error.message}`);
        } else {
          synced.subcenters++;
        }
      } catch (err) {
        errors.push(`Subcenter ${sc.id}: ${err instanceof Error ? err.message : 'Error'}`);
      }
    }

    // Push Villages
    for (const v of this.villages) {
      try {
        const row: Record<string, unknown> = {
          id: v.id,
          name: v.name,
          english_name: v.englishName,
          code: v.code,
          subcenter: v.subcenter,
          taluka: v.taluka,
          district: v.district,
          is_active: v.isActive,
        };
        if (v.subcenterId) {
          row.subcenter_id = v.subcenterId;
        }
        let { error } = await supabase.from('villages').upsert(row, { onConflict: 'id' });
        if (error && error.message.includes('subcenter_id')) {
          delete row.subcenter_id;
          const retry = await supabase.from('villages').upsert(row, { onConflict: 'id' });
          error = retry.error;
        }
        if (error) {
          errors.push(`Village ${v.id}: ${error.message}`);
        } else {
          synced.villages++;
        }
      } catch (err) {
        errors.push(`Village ${v.id}: ${err instanceof Error ? err.message : 'Error'}`);
      }
    }

    // Push Sources
    for (const src of this.sources) {
      try {
        const row = {
          id: src.id,
          village_id: src.villageId,
          sample_type_id: src.sampleTypeId,
          source_name: src.sourceName,
          source_code: src.sourceCode,
          source_type: src.sourceType,
          location_address: src.locationAddress || null,
          is_active: src.isActive,
          remarks: src.remarks || null,
        };
        const { error } = await supabase.from('sources').upsert(row, { onConflict: 'id' });
        if (error) {
          errors.push(`Source ${src.id}: ${error.message}`);
        } else {
          synced.sources++;
        }
      } catch (err) {
        errors.push(`Source ${src.id}: ${err instanceof Error ? err.message : 'Error'}`);
      }
    }

    // Push Samples
    for (const s of this.samples) {
      try {
        let dbRow = this.mapSampleToSupabaseRow(s, true);
        let { error } = await supabase.from('samples').upsert(dbRow, { onConflict: 'id' });
        if (error && (error.message.includes('subcenter_id') || error.message.includes('schema cache'))) {
          dbRow = this.mapSampleToSupabaseRow(s, false);
          const retry = await supabase.from('samples').upsert(dbRow, { onConflict: 'id' });
          error = retry.error;
        }
        if (error) {
          errors.push(`Sample ${s.id}: ${error.message}`);
        } else {
          synced.samples++;
        }
      } catch (err) {
        errors.push(`Sample ${s.id}: ${err instanceof Error ? err.message : 'Error'}`);
      }
    }

    return { success: errors.length === 0, synced, errors };
  }

  // Authoritative Audit: Check that every sample has valid village and subcenter mapping
  auditSampleSubcenterIntegrity(): {
    totalSamples: number;
    validMappedSamples: number;
    unmappedSamples: Array<{
      sampleId: string;
      villageId: string;
      villageName: string;
      missingSubcenterMapping: boolean;
      reason: string;
    }>;
  } {
    const unmapped: Array<{
      sampleId: string;
      villageId: string;
      villageName: string;
      missingSubcenterMapping: boolean;
      reason: string;
    }> = [];

    let validCount = 0;
    for (const s of this.samples) {
      const v = this.villages.find((vil) => vil.id === s.villageId);
      if (!v) {
        unmapped.push({
          sampleId: s.id,
          villageId: s.villageId,
          villageName: s.villageName,
          missingSubcenterMapping: true,
          reason: `गाव आयडी "${s.villageId}" मास्टरमध्ये अस्तित्वात नाही.`,
        });
        continue;
      }
      if (!v.subcenterId) {
        unmapped.push({
          sampleId: s.id,
          villageId: s.villageId,
          villageName: s.villageName,
          missingSubcenterMapping: true,
          reason: `गाव "${v.name}" ला कोणतेही उपकेंद्र जोडलेले नाही.`,
        });
        continue;
      }
      const sc = this.subcenters.find((sub) => sub.id === v.subcenterId);
      if (!sc) {
        unmapped.push({
          sampleId: s.id,
          villageId: s.villageId,
          villageName: s.villageName,
          missingSubcenterMapping: true,
          reason: `उपकेंद्र आयडी "${v.subcenterId}" उपकेंद्र मास्टरमध्ये सापडले नाही.`,
        });
        continue;
      }
      validCount++;
    }

    return {
      totalSamples: this.samples.length,
      validMappedSamples: validCount,
      unmappedSamples: unmapped,
    };
  }
}

export const clientStore = new ClientDataStore();
