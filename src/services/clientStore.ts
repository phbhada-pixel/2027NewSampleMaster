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
  WaterSourceImportRow,
  WaterSourceImportSummary,
  SampleImportRow,
  SampleImportSummary,
  SubcenterVillageImportRow,
  SubcenterVillageImportSummary,
  PendingSyncOperation,
  DispatchSampleRecord,
  WaterSourceOverdueItem,
  WaterSourceMonthlyStatusItem,
  SubcenterMonthlyWaterPlan,
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
  USERS: 'phc_bhada_users_v4',
  CURRENT_USER: 'phc_bhada_current_user_v4',
  SAMPLE_TYPES: 'phc_bhada_sample_types_v4',
  SUBCENTERS: 'phc_bhada_subcenters_v4',
  VILLAGES: 'phc_bhada_villages_v4',
  SOURCES: 'phc_bhada_sources_v4',
  SAMPLES: 'phc_bhada_samples_v4',
  SENDING_LETTERS: 'phc_bhada_letters_v4',
  DISPATCH_SAMPLES: 'phc_bhada_dispatch_samples_v4',
  AUDIT_LOGS: 'phc_bhada_audit_logs_v4',
  SYNC_QUEUE: 'phc_bhada_sync_queue_v4',
};

// INITIAL SEED DATA
const DEFAULT_SUBCENTERS: SubcenterMaster[] = [];

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

const DEFAULT_VILLAGES: VillageMaster[] = [];

const DEFAULT_SOURCES: SourceMaster[] = [];

const DEFAULT_SAMPLES: SampleRecord[] = [];

const DEFAULT_LETTERS: SendingLetter[] = [];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [];

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
  private dispatchSamples: DispatchSampleRecord[] = [];
  private auditLogs: AuditLog[] = [];
  private syncQueue: PendingSyncOperation[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.init();
    this.setupSyncEngine();
  }

  private init() {
    // Purge any legacy dummy data from previous iterations in localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        [
          'phc_bhada_subcenters_v3',
          'phc_bhada_villages_v3',
          'phc_bhada_sources_v3',
          'phc_bhada_samples_v3',
          'phc_bhada_letters_v3',
          'phc_bhada_dispatch_samples_v3',
          'phc_bhada_audit_logs_v3',
          'phc_bhada_sync_queue_v3',
          'phc_bhada_samples_v2',
          'phc_bhada_subcenters_v2',
          'phc_bhada_villages_v2',
          'phc_bhada_sources_v2',
          'phc_bhada_letters_v2',
          'phc_bhada_dispatch_samples_v2',
          'phc_bhada_audit_logs_v2',
          'phc_bhada_samples',
          'phc_bhada_subcenters',
          'phc_bhada_villages',
          'phc_bhada_sources',
          'phc_bhada_letters',
        ].forEach((key) => localStorage.removeItem(key));
      } catch (e) {
        console.error('Legacy storage purge error:', e);
      }
    }

    this.users = getFromStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
    this.currentUser = getFromStorage(STORAGE_KEYS.CURRENT_USER, DEFAULT_USERS[0]);
    this.sampleTypes = getFromStorage(STORAGE_KEYS.SAMPLE_TYPES, DEFAULT_SAMPLE_TYPES);
    this.subcenters = getFromStorage(STORAGE_KEYS.SUBCENTERS, DEFAULT_SUBCENTERS);
    this.villages = getFromStorage(STORAGE_KEYS.VILLAGES, DEFAULT_VILLAGES);
    this.sources = getFromStorage(STORAGE_KEYS.SOURCES, DEFAULT_SOURCES);
    // Deduplicate sources by ID to guarantee unique React keys across updates
    const seenSourceIds = new Set<string>();
    let sourcesModified = false;
    this.sources = this.sources.filter((s) => {
      if (!s.id || seenSourceIds.has(s.id)) {
        sourcesModified = true;
        return false;
      }
      seenSourceIds.add(s.id);
      return true;
    });
    if (sourcesModified) {
      saveToStorage(STORAGE_KEYS.SOURCES, this.sources);
    }
    this.samples = getFromStorage(STORAGE_KEYS.SAMPLES, DEFAULT_SAMPLES);
    this.sendingLetters = getFromStorage(STORAGE_KEYS.SENDING_LETTERS, DEFAULT_LETTERS);
    this.dispatchSamples = getFromStorage(STORAGE_KEYS.DISPATCH_SAMPLES, []);
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

    // 1b. Ensure all default sources exist in this.sources
    let sourcesModified = false;
    for (const defSrc of DEFAULT_SOURCES) {
      if (!this.sources.some((s) => s.id === defSrc.id)) {
        this.sources.push({ ...defSrc });
        sourcesModified = true;
      }
    }
    if (sourcesModified) {
      saveToStorage(STORAGE_KEYS.SOURCES, this.sources);
    }

    // 2. Ensure all default samples exist in this.samples
    for (const defSmp of DEFAULT_SAMPLES) {
      if (!this.samples.some((s) => s.id === defSmp.id)) {
        this.samples.push({ ...defSmp });
        samplesModified = true;
      }
    }

    // Deduplicate this.samples by unique authoritative id
    const seenSampleIds = new Set<string>();
    const uniqueSamples: SampleRecord[] = [];
    for (const s of this.samples) {
      if (!seenSampleIds.has(s.id)) {
        seenSampleIds.add(s.id);
        uniqueSamples.push(s);
      } else {
        samplesModified = true;
      }
    }
    this.samples = uniqueSamples;

    // 2b. Ensure dispatch_samples association records exist with UNIQUE(dispatch_id, sample_id)
    if (this.dispatchSamples.length === 0 && this.sendingLetters.length > 0) {
      for (const letter of this.sendingLetters) {
        if (Array.isArray(letter.sampleIds)) {
          const uniqueIds = Array.from(new Set(letter.sampleIds));
          for (const sId of uniqueIds) {
            const sample = this.samples.find((s) => s.id === sId);
            this.dispatchSamples.push({
              id: `DSP-${letter.id}-${sId}`,
              dispatchId: letter.id,
              sampleId: sId,
              sampleTypeId: letter.sampleTypeId,
              collectionDate: sample?.collectionDate || letter.letterDate,
              subcenterName: sample?.subcenterName || sample?.subcenter,
              villageName: sample?.villageName || '',
              sourceName: sample?.sourceName || sample?.patientName,
              createdAt: letter.createdAt || new Date().toISOString(),
            });
          }
        }
      }
      saveToStorage(STORAGE_KEYS.DISPATCH_SAMPLES, this.dispatchSamples);
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
    let seq = this.sources.filter((s) => s.villageId === sourceData.villageId).length + 1;
    let newId = `SRC-${prefix}-${String(seq).padStart(3, '0')}`;
    while (this.sources.some((s) => s.id === newId)) {
      seq++;
      newId = `SRC-${prefix}-${String(seq).padStart(3, '0')}`;
    }

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
  // BULK IMPORT FOR VILLAGE-WISE WATER SOURCES
  // ==========================================
  importWaterSources(rows: WaterSourceImportRow[]): WaterSourceImportSummary {
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      return {
        totalRows: rows.length,
        validRows: 0,
        invalidRows: rows.length,
        duplicateRows: 0,
        sourcesCreated: 0,
        errors: ['केवळ प्रशासक (Admin) पाणी स्त्रोत आयात करू शकतात.'],
        previewRows: [],
      };
    }

    const summary: WaterSourceImportSummary = {
      totalRows: rows.length,
      validRows: 0,
      invalidRows: 0,
      duplicateRows: 0,
      sourcesCreated: 0,
      errors: [],
      previewRows: [],
    };

    const existingSources = this.sources;
    const validatedEntries: Array<{
      village: VillageMaster;
      sourceId?: string;
      sourceCode?: string;
      sourceName: string;
      sourceType: string;
      sampleTypeIds: string[];
      locationAddress: string;
      remarks?: string;
    }> = [];

    rows.forEach((r, idx) => {
      const rowNum = idx + 1;
      const issues: string[] = [];
      const vilIdentifier = (r.villageNameOrCode || '').trim();
      const srcName = (r.sourceName || '').trim();
      const rawSrcType = (r.sourceType || 'विहीर').trim();
      const rawSampleType = (r.sampleType || 'BOTH').trim().toUpperCase();
      const loc = (r.locationAddress || '').trim();
      const customId = (r.sourceId || '').trim();
      const customCode = (r.sourceCode || r.sourceId || '').trim();

      if (!vilIdentifier) issues.push('गाव नाव किंवा कोड आवश्यक आहे.');
      if (!srcName) issues.push('स्त्रोत नाव आवश्यक आहे.');

      // Find Village
      const village = this.villages.find(
        (v) =>
          v.name.toLowerCase() === vilIdentifier.toLowerCase() ||
          v.code.toLowerCase() === vilIdentifier.toLowerCase() ||
          (v.englishName && v.englishName.toLowerCase() === vilIdentifier.toLowerCase())
      );

      if (!village && vilIdentifier) {
        issues.push(`गाव "${vilIdentifier}" सिस्टीममध्ये सापडले नाही. आधी गाव जोडा किंवा बरोबर नाव प्रविष्ट करा.`);
      }

      // Check duplicates by ID or by village + name
      const isDuplicate = village
        ? existingSources.some(
            (s) =>
              (customId && s.id.toLowerCase() === customId.toLowerCase()) ||
              (s.villageId === village.id &&
                s.sourceName.toLowerCase() === srcName.toLowerCase() &&
                s.isActive)
          )
        : false;

      let status: 'VALID' | 'INVALID' | 'DUPLICATE' = 'VALID';

      if (issues.length > 0) {
        status = 'INVALID';
        summary.invalidRows++;
        summary.errors.push(`ओळ ${rowNum}: ${issues.join(', ')}`);
      } else if (isDuplicate) {
        status = 'DUPLICATE';
        summary.duplicateRows++;
        issues.push(customId ? `स्त्रोत आयडी "${customId}" किंवा नाव आधीपासून अस्तित्वात आहे.` : `या गावामध्ये "${srcName}" नावाचा स्त्रोत आधीपासून अस्तित्वात आहे.`);
      } else if (village) {
        summary.validRows++;
        let targetTypeIds: string[] = ['ST-001', 'ST-002'];
        if (rawSampleType === 'ST-001' || rawSampleType.includes('BIO') || rawSampleType.includes('जैविक')) {
          targetTypeIds = ['ST-001'];
        } else if (rawSampleType === 'ST-002' || rawSampleType.includes('CHM') || rawSampleType.includes('रासायनिक')) {
          targetTypeIds = ['ST-002'];
        }

        validatedEntries.push({
          village,
          sourceId: customId || undefined,
          sourceCode: customCode || undefined,
          sourceName: srcName,
          sourceType: rawSrcType,
          sampleTypeIds: targetTypeIds,
          locationAddress: loc || `${village.name}, ता. औसा`,
          remarks: r.remarks?.trim() || 'जुना डेटा आयात द्वारे नोंदणीकृत',
        });
      }

      summary.previewRows.push({
        rowNumber: rowNum,
        sourceId: customId || undefined,
        sourceCode: customCode || undefined,
        villageNameOrCode: vilIdentifier,
        subcenterName: village?.subcenterName || r.subcenterName || '',
        sourceName: srcName,
        sourceType: rawSrcType,
        sampleType: rawSampleType,
        locationAddress: loc,
        remarks: r.remarks,
        status,
        issues,
        resolvedVillageId: village?.id,
        resolvedVillageName: village?.name,
        resolvedSubcenterId: village?.subcenterId,
        resolvedSubcenterName: village?.subcenterName,
      });
    });

    // Execute atomic creation
    if (validatedEntries.length > 0) {
      for (const entry of validatedEntries) {
        for (const stId of entry.sampleTypeIds) {
          const sampleType = this.sampleTypes.find((st) => st.id === stId);
          const prefix = entry.village.code || 'SRC';
          let seq = this.sources.filter((s) => s.villageId === entry.village.id).length + 1;
          
          let newId = entry.sourceId;
          if (!newId) {
            newId = `SRC-${prefix}-${String(seq).padStart(3, '0')}`;
            while (this.sources.some((s) => s.id === newId)) {
              seq++;
              newId = `SRC-${prefix}-${String(seq).padStart(3, '0')}`;
            }
          }

          let newCode = entry.sourceCode || (entry.sourceId ? entry.sourceId : `SRC-${seq}`);

          const newSource: SourceMaster = {
            id: newId,
            villageId: entry.village.id,
            villageName: entry.village.name,
            sampleTypeId: stId,
            sampleTypeName: sampleType ? sampleType.name : (stId === 'ST-001' ? 'Water Sample – Bacteriological Examination' : 'Water Sample – Chemical Examination'),
            sourceName: entry.sourceName,
            sourceCode: newCode,
            sourceType: entry.sourceType,
            locationAddress: entry.locationAddress,
            remarks: entry.remarks,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          this.sources.push(newSource);
          summary.sourcesCreated++;
        }
      }

      saveToStorage(STORAGE_KEYS.SOURCES, this.sources);

      this.logAudit({
        action: 'CREATE',
        tableName: 'sources',
        recordId: 'BULK-WATER-SOURCES',
        summary: `पाणी स्त्रोत बल्क आयात: ${summary.sourcesCreated} नवीन स्त्रोत रेकॉर्ड्स तयार केले.`,
        newData: { sourcesCreated: summary.sourcesCreated },
      });

      this.notifyListeners();
    }

    return summary;
  }

  // ==========================================
  // BULK IMPORT FOR HISTORICAL SAMPLES (ALL TYPES)
  // ==========================================
  importHistoricalSamples(rows: SampleImportRow[]): SampleImportSummary {
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      return {
        totalRows: rows.length,
        validRows: 0,
        invalidRows: rows.length,
        duplicateRows: 0,
        samplesCreated: 0,
        errors: ['केवळ प्रशासक (Admin) जुने नमुने आयात करू शकतात.'],
        previewRows: [],
      };
    }

    const summary: SampleImportSummary = {
      totalRows: rows.length,
      validRows: 0,
      invalidRows: 0,
      duplicateRows: 0,
      samplesCreated: 0,
      errors: [],
      previewRows: [],
    };

    const validatedSamples: SampleRecord[] = [];

    rows.forEach((r, idx) => {
      const rowNum = idx + 1;
      const issues: string[] = [];

      // Determine sample type
      let sampleTypeId = (r.sampleTypeId || '').trim();
      if (!sampleTypeId) {
        issues.push('नमुना प्रकार आवश्यक आहे.');
      } else {
        // Map common aliases
        const stLower = sampleTypeId.toLowerCase();
        if (stLower.includes('bio') || stLower.includes('जैविक') || stLower === 'st-001' || stLower === 'ws-bio') {
          sampleTypeId = 'ST-001';
        } else if (stLower.includes('chm') || stLower.includes('chem') || stLower.includes('रासायनिक') || stLower === 'st-002' || stLower === 'ws-chm') {
          sampleTypeId = 'ST-002';
        } else if (stLower.includes('malaria') || stLower.includes('हिवताप') || stLower.includes('smear') || stLower === 'st-003' || stLower === 'bs') {
          sampleTypeId = 'ST-003';
        } else if (stLower.includes('tcl') || stLower.includes('bleaching') || stLower.includes('पावडर') || stLower === 'st-004') {
          sampleTypeId = 'ST-004';
        } else if (stLower.includes('salt') || stLower.includes('मीठ') || stLower.includes('iodine') || stLower === 'st-005') {
          sampleTypeId = 'ST-005';
        } else if (stLower.includes('dengue') || stLower.includes('डेंग्यू') || stLower.includes('chikungunya') || stLower === 'st-006') {
          sampleTypeId = 'ST-006';
        } else if (stLower.includes('measles') || stLower.includes('गोवर') || stLower.includes('rubella') || stLower === 'st-007') {
          sampleTypeId = 'ST-007';
        }
      }

      const sampleType = this.sampleTypes.find((st) => st.id === sampleTypeId);
      if (!sampleType && sampleTypeId) {
        issues.push(`अवैध नमुना प्रकार: ${sampleTypeId}`);
      }

      // Date
      const dateStr = (r.collectionDate || '').trim();
      if (!dateStr || isNaN(Date.parse(dateStr))) {
        issues.push('वैध संकलन तारीख (YYYY-MM-DD) आवश्यक आहे.');
      }

      // Village
      const vilNameInput = (r.villageName || '').trim();
      if (!vilNameInput) {
        issues.push('गाव नाव आवश्यक आहे.');
      }

      const village = this.villages.find(
        (v) =>
          v.name.toLowerCase() === vilNameInput.toLowerCase() ||
          v.code.toLowerCase() === vilNameInput.toLowerCase() ||
          (v.englishName && v.englishName.toLowerCase() === vilNameInput.toLowerCase())
      );

      if (!village && vilNameInput) {
        issues.push(`गाव "${vilNameInput}" सिस्टीममध्ये उपलब्ध नाही.`);
      }

      // Check duplicates
      let isDuplicate = false;
      if (r.sampleId && this.samples.some((s) => s.id === r.sampleId)) {
        isDuplicate = true;
        issues.push(`नमुना आयडी "${r.sampleId}" आधीपासून नोंदवलेला आहे.`);
      }

      let status: 'VALID' | 'INVALID' | 'DUPLICATE' = 'VALID';

      if (issues.length > 0) {
        status = 'INVALID';
        summary.invalidRows++;
        summary.errors.push(`ओळ ${rowNum}: ${issues.join(', ')}`);
      } else if (isDuplicate) {
        status = 'DUPLICATE';
        summary.duplicateRows++;
      } else if (sampleType && village) {
        summary.validRows++;

        const newId = r.sampleId || this.generateSampleId(sampleType.id);

        // Find matching water source if applicable
        let matchedSource: SourceMaster | undefined;
        const targetSourceId = (r.sourceId || r.sourceCode || '').trim();

        if (targetSourceId) {
          // 1. First priority: match by exact Source ID or sourceCode
          matchedSource = this.sources.find(
            (s) =>
              s.id.toLowerCase() === targetSourceId.toLowerCase() ||
              s.sourceCode.toLowerCase() === targetSourceId.toLowerCase()
          );
        }

        // 2. Second priority: match by village + sourceName
        if (!matchedSource && r.sourceName) {
          matchedSource = this.sources.find(
            (s) =>
              s.villageId === village.id &&
              s.sourceName.toLowerCase() === r.sourceName!.trim().toLowerCase()
          );
        }

        // 3. If sourceId is given or water sample needs a source, but doesn't exist yet, auto-register it
        if (!matchedSource && (sampleType.id === 'ST-001' || sampleType.id === 'ST-002') && (targetSourceId || r.sourceName)) {
          const finalSrcId = targetSourceId || `SRC-${village.code || 'BHD'}-${String(this.sources.filter(s => s.villageId === village.id).length + 1).padStart(3, '0')}`;
          const finalSrcName = r.sourceName?.trim() || `पाणी स्त्रोत (${targetSourceId})`;
          const finalSrcType = r.sourceType?.trim() || 'विहीर';

          matchedSource = {
            id: finalSrcId,
            villageId: village.id,
            villageName: village.name,
            sampleTypeId: sampleType.id,
            sampleTypeName: sampleType.name,
            sourceName: finalSrcName,
            sourceCode: targetSourceId || finalSrcId,
            sourceType: finalSrcType,
            locationAddress: `${village.name}, ता. औसा`,
            remarks: 'जुना नमुना डेटा आयातीदरम्यान स्वयंचलित जोडला',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.sources.push(matchedSource);
          saveToStorage(STORAGE_KEYS.SOURCES, this.sources);
        }

        const subcenter = this.subcenters.find((sc) => sc.id === village.subcenterId);

        // Determine status
        let finalStatus: SampleRecord['status'] = 'Ready for Dispatch';
        if (r.result && r.result.trim().length > 0) {
          finalStatus = 'Report Updated';
        } else if (r.sendingLetterNumber) {
          finalStatus = 'Dispatched';
        }

        let parsedSex: SampleRecord['sex'] = undefined;
        if (r.sex) {
          const s = r.sex.trim().toLowerCase();
          if (s === 'male' || s === 'पुरुष' || s === 'm') parsedSex = 'पुरुष';
          else if (s === 'female' || s === 'स्त्री' || s === 'f') parsedSex = 'स्त्री';
          else parsedSex = 'इतर';
        } else if (r.patientName) {
          parsedSex = 'पुरुष';
        }

        const sampleRecord: SampleRecord = {
          id: newId,
          sampleTypeId: sampleType.id,
          sampleTypeName: sampleType.name,
          collectionDate: dateStr,
          sendingDate: r.sendingDate || dateStr,
          reportReceivedDate: r.reportReceivedDate || (r.result ? dateStr : undefined),
          reportDate: r.reportReceivedDate || (r.result ? dateStr : undefined),
          reportUpdateDate: r.result ? (r.reportReceivedDate || dateStr) : undefined,

          villageId: village.id,
          villageName: village.name,
          subcenterId: village.subcenterId,
          subcenterName: village.subcenterName,
          subcenter: village.subcenterName,
          phcName: 'भादा',
          taluka: village.taluka || 'औसा',
          district: village.district || 'लातूर',

          sourceId: matchedSource?.id || targetSourceId || undefined,
          sourceName: r.sourceName?.trim() || matchedSource?.sourceName || (sampleType.id === 'ST-001' || sampleType.id === 'ST-002' ? 'सार्वजनिक स्त्रोत' : undefined),
          sourceType: r.sourceType?.trim() || matchedSource?.sourceType || (sampleType.id === 'ST-001' || sampleType.id === 'ST-002' ? 'विहीर' : undefined),
          bottleNumber: r.bottleNumber !== undefined ? r.bottleNumber : undefined,
          sampleCodeOrBottleNo: r.bottleNumber ? `BTL-${r.bottleNumber}` : undefined,

          patientName: r.patientName?.trim(),
          age: r.age ? Number(r.age) : undefined,
          sex: parsedSex,
          mobile: r.mobile?.trim(),
          contactNumber: r.mobile?.trim(),
          patientAddress: r.patientAddress?.trim() || (r.patientName ? `${village.name}, ता. औसा` : undefined),

          availableChlorinePercent: r.availableChlorinePercent ? Number(r.availableChlorinePercent) : undefined,
          chlorineContentPercent: r.availableChlorinePercent ? Number(r.availableChlorinePercent) : undefined,
          iodinePpm: r.iodinePpm ? Number(r.iodinePpm) : undefined,

          sendingLetterNumber: r.sendingLetterNumber?.trim(),
          laboratoryName: r.laboratoryName?.trim() || sampleType.defaultLaboratory,
          status: finalStatus,
          result: r.result?.trim(),
          remarks: r.remarks?.trim() || 'जुना ऐतिहासिक डेटा आयात (Historical Data Import)',

          createdBy: user.id,
          createdByName: user.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
        };

        validatedSamples.push(sampleRecord);
      }

      summary.previewRows.push({
        ...r,
        rowNumber: rowNum,
        sampleTypeName: sampleType?.name || r.sampleTypeId,
        status,
        issues,
      });
    });

    // Execute bulk insertion
    if (validatedSamples.length > 0) {
      this.samples.push(...validatedSamples);
      saveToStorage(STORAGE_KEYS.SAMPLES, this.samples);

      summary.samplesCreated = validatedSamples.length;

      this.logAudit({
        action: 'CREATE',
        tableName: 'samples',
        recordId: 'BULK-HISTORICAL-SAMPLES',
        summary: `जुना डेटा आयात: ${validatedSamples.length} नमुने यशस्वीरित्या नोंदवले.`,
        newData: { count: validatedSamples.length },
      });

      this.notifyListeners();
    }

    return summary;
  }

  // ==========================================
  // FULL SYSTEM BACKUP & RESTORE
  // ==========================================
  exportFullSystemBackup(): string {
    const backupData = {
      system: 'PHC_BHADA_SAMPLE_MASTER',
      version: '3.0',
      exportedAt: new Date().toISOString(),
      exportedBy: this.currentUser?.name || 'Admin',
      data: {
        users: this.users,
        subcenters: this.subcenters,
        villages: this.villages,
        sources: this.sources,
        sampleTypes: this.sampleTypes,
        samples: this.samples,
        sendingLetters: this.sendingLetters,
        dispatchSamples: this.dispatchSamples,
        auditLogs: this.auditLogs,
      },
    };

    return JSON.stringify(backupData, null, 2);
  }

  restoreFullSystemBackup(
    backupJsonString: string,
    mode: 'MERGE' | 'REPLACE' = 'MERGE'
  ): { success: boolean; message: string; counts: Record<string, number> } {
    const user = this.getCurrentUser();
    if (user.role !== 'ADMIN') {
      return { success: false, message: 'केवळ प्रशासक (Admin) बॅकअप रिस्टोअर करू शकतात.', counts: {} };
    }

    try {
      const parsed = JSON.parse(backupJsonString);
      if (!parsed || !parsed.data) {
        return { success: false, message: 'अवैध बॅकअप फाइल स्वरूप. "data" ऑब्जेक्ट आढळला नाही.', counts: {} };
      }

      const { data } = parsed;
      const counts: Record<string, number> = {
        subcenters: 0,
        villages: 0,
        sources: 0,
        samples: 0,
        sendingLetters: 0,
      };

      if (mode === 'REPLACE') {
        if (Array.isArray(data.subcenters)) this.subcenters = data.subcenters;
        if (Array.isArray(data.villages)) this.villages = data.villages;
        if (Array.isArray(data.sources)) this.sources = data.sources;
        if (Array.isArray(data.samples)) this.samples = data.samples;
        if (Array.isArray(data.sendingLetters)) this.sendingLetters = data.sendingLetters;
        if (Array.isArray(data.sampleTypes)) this.sampleTypes = data.sampleTypes;
        if (Array.isArray(data.users)) this.users = data.users;

        counts.subcenters = this.subcenters.length;
        counts.villages = this.villages.length;
        counts.sources = this.sources.length;
        counts.samples = this.samples.length;
        counts.sendingLetters = this.sendingLetters.length;
      } else {
        // MERGE Mode
        if (Array.isArray(data.subcenters)) {
          for (const sc of data.subcenters) {
            if (!this.subcenters.some((s) => s.id === sc.id || s.subcenterCode === sc.subcenterCode)) {
              this.subcenters.push(sc);
              counts.subcenters++;
            }
          }
        }

        if (Array.isArray(data.villages)) {
          for (const vil of data.villages) {
            if (!this.villages.some((v) => v.id === vil.id || v.code === vil.code)) {
              this.villages.push(vil);
              counts.villages++;
            }
          }
        }

        if (Array.isArray(data.sources)) {
          for (const src of data.sources) {
            if (!this.sources.some((s) => s.id === src.id)) {
              this.sources.push(src);
              counts.sources++;
            }
          }
        }

        if (Array.isArray(data.samples)) {
          for (const smp of data.samples) {
            if (!this.samples.some((s) => s.id === smp.id)) {
              this.samples.push(smp);
              counts.samples++;
            }
          }
        }

        if (Array.isArray(data.sendingLetters)) {
          for (const ltr of data.sendingLetters) {
            if (!this.sendingLetters.some((l) => l.id === ltr.id)) {
              this.sendingLetters.push(ltr);
              counts.sendingLetters++;
            }
          }
        }
      }

      saveToStorage(STORAGE_KEYS.SUBCENTERS, this.subcenters);
      saveToStorage(STORAGE_KEYS.VILLAGES, this.villages);
      saveToStorage(STORAGE_KEYS.SOURCES, this.sources);
      saveToStorage(STORAGE_KEYS.SAMPLES, this.samples);
      saveToStorage(STORAGE_KEYS.SENDING_LETTERS, this.sendingLetters);
      saveToStorage(STORAGE_KEYS.SAMPLE_TYPES, this.sampleTypes);
      saveToStorage(STORAGE_KEYS.USERS, this.users);

      this.logAudit({
        action: 'RESTORE',
        tableName: 'samples',
        recordId: 'SYSTEM-BACKUP-RESTORE',
        summary: `संपूर्ण सिस्टीम बॅकअप रिस्टोअर (${mode}): ${counts.samples} नमुने, ${counts.sources} स्त्रोत, ${counts.villages} गावे आयात झाली.`,
        newData: counts,
      });

      this.notifyListeners();

      return {
        success: true,
        message: `बॅकअप यशस्वीरीत्या रिस्टोअर झाला! (${counts.samples} नमुने, ${counts.sources} पाणी स्त्रोत, ${counts.villages} गावे, ${counts.subcenters} उपकेंद्रे)`,
        counts,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'बॅकअप फाइल प्रक्रिया करताना त्रुटी आली.';
      return { success: false, message: `त्रुटी: ${msg}`, counts: {} };
    }
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

  /**
   * Generates the next date-wise automatic Bottle Number for a given collection date.
   * Requirement 3 & 4:
   * Bottle Number sequence is independent for each collection date.
   * Starts from 1 (Bottle No. 1, Bottle No. 2, ...) and continues 1, 2, 3, 4, 5...
   * Concurrency-safe and duplicate-safe: inspects both in-memory samples and pending sync queue.
   */
  getNextBottleNumber(collectionDate: string, sampleTypeId?: string): string {
    const targetDate = collectionDate || new Date().toISOString().split('T')[0];

    // For water samples (ST-001 / ST-002), sequence is tracked across water samples on that date
    const isWaterType = !sampleTypeId || sampleTypeId === 'ST-001' || sampleTypeId === 'ST-002';

    const sameDateSamples = this.samples.filter((s) => {
      if (!s.isActive) return false;
      if (s.collectionDate !== targetDate) return false;
      if (isWaterType) {
        return s.sampleTypeId === 'ST-001' || s.sampleTypeId === 'ST-002';
      }
      return sampleTypeId ? s.sampleTypeId === sampleTypeId : true;
    });

    // Also inspect pending sync queue for samples on the same date
    const pendingSameDateSamples = this.syncQueue
      .filter((op) => op.entityType === 'sample' && op.payload && (op.payload as any).collectionDate === targetDate)
      .map((op) => op.payload as any);

    const allSamplesOnDate = [...sameDateSamples, ...pendingSameDateSamples];

    const usedNumbers = new Set<number>();

    for (const s of allSamplesOnDate) {
      const btlStr = s.sampleCodeOrBottleNo || '';
      if (!btlStr) continue;
      const matches = btlStr.match(/\d+/g);
      if (matches && matches.length > 0) {
        const num = parseInt(matches[matches.length - 1], 10);
        if (!isNaN(num) && num > 0) {
          usedNumbers.add(num);
        }
      }
    }

    // Starting from 1 and continuing 1, 2, 3, 4, 5... (अनुक्रमांक)
    let nextNum = 1;
    while (usedNumbers.has(nextNum)) {
      nextNum++;
    }

    return `${nextNum}`;
  }

  getSamples(filter?: {
    sampleTypeId?: string;
    subcenterId?: string;
    villageId?: string;
    sourceId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    collectionDate?: string;
    sendingDate?: string;
    dispatchDate?: string;
    sendingLetterNumber?: string;
    sendingLetterId?: string;
    reportNumber?: string;
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

    if (filter?.collectionDate && filter.collectionDate !== 'ALL') {
      list = list.filter((s) => s.collectionDate === filter.collectionDate);
    }

    if (filter?.startDate) {
      list = list.filter((s) => s.collectionDate >= filter.startDate!);
    }

    if (filter?.endDate) {
      list = list.filter((s) => s.collectionDate <= filter.endDate!);
    }

    if (filter?.sendingDate && filter.sendingDate !== 'ALL') {
      list = list.filter((s) => s.sendingDate === filter.sendingDate || s.dispatchDate === filter.sendingDate);
    }

    if (filter?.dispatchDate && filter.dispatchDate !== 'ALL') {
      list = list.filter((s) => s.dispatchDate === filter.dispatchDate || s.sendingDate === filter.dispatchDate);
    }

    if (filter?.sendingLetterNumber && filter.sendingLetterNumber !== 'ALL') {
      list = list.filter((s) => s.sendingLetterNumber === filter.sendingLetterNumber);
    }

    if (filter?.sendingLetterId && filter.sendingLetterId !== 'ALL') {
      list = list.filter((s) => s.sendingLetterId === filter.sendingLetterId);
    }

    if (filter?.reportNumber && filter.reportNumber !== 'ALL') {
      list = list.filter((s) => s.reportNumber === filter.reportNumber);
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
          (s.sampleCodeOrBottleNo && s.sampleCodeOrBottleNo.toLowerCase().includes(q)) ||
          (s.batchNumber && s.batchNumber.toLowerCase().includes(q))
      );
    }

    // Ensure distinct rows by authoritative sample id
    const seenIds = new Set<string>();
    const deduplicatedList: SampleRecord[] = [];
    for (const item of list) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        deduplicatedList.push(item);
      }
    }

    return deduplicatedList.sort((a, b) => new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime());
  }

  getSampleById(id: string): SampleRecord | null {
    return this.samples.find((s) => s.id === id) || null;
  }

  /**
   * Returns a comprehensive list and analysis of water sources regarding biological examination (ST-001 / WS-BIO),
   * highlighting sources that have not been tested in the last 3 months (90 days) or never tested.
   */
  getWaterSourcesBiologicalDueReport(options?: {
    subcenterId?: string;
    villageId?: string;
    referenceDate?: string; // YYYY-MM-DD, defaults to current date
    filterCategory?: 'ALL' | 'OVERDUE_ONLY' | 'OVERDUE_3M' | 'OVERDUE_6M' | 'CRITICAL_NEVER' | 'TIMELY';
  }): {
    items: WaterSourceOverdueItem[];
    stats: {
      totalWaterSources: number;
      testedIn3MonthsCount: number;
      overdue3MonthsCount: number;
      overdue6MonthsCount: number;
      neverTestedCount: number;
      testedThisMonthCount: number;
      complianceRate: number;
    };
  } {
    const refDateStr = options?.referenceDate || new Date().toISOString().split('T')[0];
    const refDate = new Date(refDateStr);
    const refYear = refDate.getFullYear();
    const refMonth = refDate.getMonth() + 1;

    // Filter water sources
    const activeSources = this.sources.filter((src) => {
      if (!src.isActive) return false;
      if (options?.villageId && options.villageId !== 'ALL' && src.villageId !== options.villageId) return false;
      if (options?.subcenterId && options.subcenterId !== 'ALL') {
        const v = this.villages.find((vil) => vil.id === src.villageId);
        if (v && v.subcenterId !== options.subcenterId) return false;
      }
      return true;
    });

    // Biological water samples (ST-001)
    const bioSamples = this.samples.filter(
      (s) => s.isActive && (s.sampleTypeId === 'ST-001' || s.sampleTypeName?.includes('Bacteriological') || s.sampleTypeName?.includes('जैविक'))
    );

    const items: WaterSourceOverdueItem[] = [];

    let totalWaterSources = 0;
    let testedIn3MonthsCount = 0;
    let overdue3MonthsCount = 0;
    let overdue6MonthsCount = 0;
    let neverTestedCount = 0;
    let testedThisMonthCount = 0;

    for (const src of activeSources) {
      const v = this.villages.find((vil) => vil.id === src.villageId);
      const sc = v?.subcenterId ? this.subcenters.find((s) => s.id === v.subcenterId) : null;
      const subcenterId = v?.subcenterId || '';
      const subcenterName = sc?.subcenterName || v?.subcenterName || v?.subcenter || 'भादा';

      // Find all biological samples for this source
      const matchedSamples = bioSamples.filter(
        (s) => (s.sourceId && s.sourceId === src.id) || (s.villageId === src.villageId && s.sourceName === src.sourceName)
      ).sort((a, b) => new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime());

      const latestBioSample = matchedSamples[0] || null;
      const lastTestedDate = latestBioSample?.collectionDate || null;

      let daysSinceLastTest: number | null = null;
      let monthsSinceLastTest: number | null = null;

      if (lastTestedDate) {
        const testDate = new Date(lastTestedDate);
        const diffMs = refDate.getTime() - testDate.getTime();
        daysSinceLastTest = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        monthsSinceLastTest = Number((daysSinceLastTest / 30.4).toFixed(1));
      }

      const isNeverTested = !latestBioSample;
      const isOverdue3Months = isNeverTested || (daysSinceLastTest !== null && daysSinceLastTest > 90);
      const isOverdue6Months = isNeverTested || (daysSinceLastTest !== null && daysSinceLastTest > 180);

      let overdueCategory: 'CRITICAL_NEVER' | 'OVERDUE_6M' | 'OVERDUE_3M' | 'TIMELY' = 'TIMELY';
      if (isNeverTested) {
        overdueCategory = 'CRITICAL_NEVER';
      } else if (daysSinceLastTest !== null && daysSinceLastTest > 180) {
        overdueCategory = 'OVERDUE_6M';
      } else if (daysSinceLastTest !== null && daysSinceLastTest > 90) {
        overdueCategory = 'OVERDUE_3M';
      } else {
        overdueCategory = 'TIMELY';
      }

      // Check if tested in reference month
      const thisMonthSample = matchedSamples.find((s) => {
        const d = new Date(s.collectionDate);
        return d.getFullYear() === refYear && d.getMonth() + 1 === refMonth;
      });
      const testedThisMonth = Boolean(thisMonthSample);

      totalWaterSources++;
      if (testedThisMonth) testedThisMonthCount++;
      if (isNeverTested) {
        neverTestedCount++;
        overdue3MonthsCount++;
        overdue6MonthsCount++;
      } else if (daysSinceLastTest !== null && daysSinceLastTest > 180) {
        overdue6MonthsCount++;
        overdue3MonthsCount++;
      } else if (daysSinceLastTest !== null && daysSinceLastTest > 90) {
        overdue3MonthsCount++;
      } else {
        testedIn3MonthsCount++;
      }

      const item: WaterSourceOverdueItem = {
        source: src,
        subcenterId,
        subcenterName,
        villageId: src.villageId,
        villageName: src.villageName || v?.name || '',
        sourceName: src.sourceName,
        sourceCode: src.sourceCode,
        sourceType: src.sourceType,
        locationAddress: src.locationAddress,
        latestBioSample,
        lastTestedDate,
        daysSinceLastTest,
        monthsSinceLastTest,
        isOverdue3Months,
        isOverdue6Months,
        isNeverTested,
        overdueCategory,
        lastResult: latestBioSample?.result || '-',
        testedThisMonth,
        thisMonthSample,
      };

      // Apply category filter if given
      if (options?.filterCategory === 'OVERDUE_ONLY' && !isOverdue3Months) continue;
      if (options?.filterCategory === 'OVERDUE_3M' && overdueCategory !== 'OVERDUE_3M' && overdueCategory !== 'OVERDUE_6M' && overdueCategory !== 'CRITICAL_NEVER') continue;
      if (options?.filterCategory === 'OVERDUE_6M' && overdueCategory !== 'OVERDUE_6M' && overdueCategory !== 'CRITICAL_NEVER') continue;
      if (options?.filterCategory === 'CRITICAL_NEVER' && overdueCategory !== 'CRITICAL_NEVER') continue;
      if (options?.filterCategory === 'TIMELY' && overdueCategory !== 'TIMELY') continue;

      items.push(item);
    }

    // Sort items: Most critical (Never tested -> longest overdue -> recent)
    items.sort((a, b) => {
      if (a.isNeverTested && !b.isNeverTested) return -1;
      if (!a.isNeverTested && b.isNeverTested) return 1;
      const daysA = a.daysSinceLastTest ?? 99999;
      const daysB = b.daysSinceLastTest ?? 99999;
      return daysB - daysA;
    });

    const complianceRate = totalWaterSources > 0 ? Math.round((testedIn3MonthsCount / totalWaterSources) * 100) : 0;

    return {
      items,
      stats: {
        totalWaterSources,
        testedIn3MonthsCount,
        overdue3MonthsCount,
        overdue6MonthsCount,
        neverTestedCount,
        testedThisMonthCount,
        complianceRate,
      },
    };
  }

  /**
   * Subcenter-wise Monthly Water Sampling Plan & Status
   */
  getMonthlySubcenterWaterPlan(year: number, month: number, subcenterId?: string): {
    plans: SubcenterMonthlyWaterPlan[];
    overall: {
      totalSources: number;
      totalTestedThisMonth: number;
      totalPendingThisMonth: number;
      totalOverdue3Months: number;
      overallCoveragePercentage: number;
    };
  } {
    const plans: SubcenterMonthlyWaterPlan[] = [];
    const subcentersList = subcenterId && subcenterId !== 'ALL'
      ? this.subcenters.filter((s) => s.id === subcenterId)
      : this.subcenters;

    const dueReport = this.getWaterSourcesBiologicalDueReport({
      referenceDate: `${year}-${String(month).padStart(2, '0')}-01`,
    });

    let totalSources = 0;
    let totalTestedThisMonth = 0;
    let totalPendingThisMonth = 0;
    let totalOverdue3Months = 0;

    for (const sc of subcentersList) {
      const scSources = dueReport.items.filter((item) => item.subcenterId === sc.id);

      const sourcesList: WaterSourceMonthlyStatusItem[] = scSources.map((item) => ({
        source: item.source,
        subcenterId: sc.id,
        subcenterName: sc.subcenterName,
        villageId: item.villageId,
        villageName: item.villageName,
        sourceName: item.sourceName,
        sourceCode: item.sourceCode,
        sourceType: item.sourceType,
        locationAddress: item.locationAddress,
        testedThisMonth: item.testedThisMonth,
        thisMonthSample: item.thisMonthSample,
        lastTestedDate: item.lastTestedDate,
        daysSinceLastTest: item.daysSinceLastTest,
        monthsSinceLastTest: item.monthsSinceLastTest,
        isOverdue3Months: item.isOverdue3Months,
        lastResult: item.lastResult,
      }));

      const scTotal = sourcesList.length;
      const scTested = sourcesList.filter((s) => s.testedThisMonth).length;
      const scPending = scTotal - scTested;
      const scOverdue = sourcesList.filter((s) => s.isOverdue3Months).length;
      const scCoverage = scTotal > 0 ? Math.round((scTested / scTotal) * 100) : 0;

      totalSources += scTotal;
      totalTestedThisMonth += scTested;
      totalPendingThisMonth += scPending;
      totalOverdue3Months += scOverdue;

      plans.push({
        subcenterId: sc.id,
        subcenterCode: sc.subcenterCode,
        subcenterName: sc.subcenterName,
        marathiName: sc.marathiName,
        totalSources: scTotal,
        testedThisMonthCount: scTested,
        pendingThisMonthCount: scPending,
        overdue3MonthsCount: scOverdue,
        coveragePercentage: scCoverage,
        sourcesList,
      });
    }

    const overallCoveragePercentage = totalSources > 0 ? Math.round((totalTestedThisMonth / totalSources) * 100) : 0;

    return {
      plans,
      overall: {
        totalSources,
        totalTestedThisMonth,
        totalPendingThisMonth,
        totalOverdue3Months,
        overallCoveragePercentage,
      },
    };
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

    // Automatic Date-wise Bottle Numbering for Water Samples (ST-001 & ST-002)
    let sampleCodeOrBottleNo = sampleData.sampleCodeOrBottleNo;
    const isWaterSample = sampleData.sampleTypeId === 'ST-001' || sampleData.sampleTypeId === 'ST-002';
    if (isWaterSample) {
      const targetDate = sampleData.collectionDate || new Date().toISOString().split('T')[0];
      const isDuplicateOnDate = Boolean(
        sampleCodeOrBottleNo &&
        this.samples.some(
          (s) => s.isActive && s.collectionDate === targetDate && s.sampleCodeOrBottleNo === sampleCodeOrBottleNo
        )
      );

      // If empty, random placeholder like BTL-xxx, or duplicate on this date:
      if (!sampleCodeOrBottleNo || sampleCodeOrBottleNo.startsWith('BTL-') || isDuplicateOnDate) {
        sampleCodeOrBottleNo = this.getNextBottleNumber(targetDate, sampleData.sampleTypeId);
      }
    }

    const newSample: SampleRecord = {
      ...sampleData,
      id: newId,
      uuid: internalUuid,
      ...(sampleCodeOrBottleNo ? { sampleCodeOrBottleNo } : {}),
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

  /**
   * Requirement 5: ONE REPORT REFERENCE FOR MANY SOURCES
   * Links one Laboratory Report Reference Number to multiple sample records.
   * Updates the authoritative state of each selected sample.
   */
  updateBatchSampleReports(
    sampleIds: string[],
    commonReport: {
      reportNumber: string;
      reportReceivedDate: string;
      laboratoryName?: string;
      result?: string;
      reportRemarks?: string;
      resultQuantitative?: Record<string, string | number>;
    },
    individualOverrides?: Record<
      string,
      {
        result?: string;
        reportRemarks?: string;
        resultQuantitative?: Record<string, string | number>;
      }
    >
  ): SampleRecord[] {
    const user = this.getCurrentUser();
    const updatedSamples: SampleRecord[] = [];
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    for (const id of sampleIds) {
      const idx = this.samples.findIndex((s) => s.id === id);
      if (idx === -1) continue;

      const override = individualOverrides ? individualOverrides[id] : undefined;
      const finalResult = override?.result || commonReport.result || this.samples[idx].result || 'पिण्यास योग्य';
      const finalRemarks = override?.reportRemarks || commonReport.reportRemarks || this.samples[idx].reportRemarks || '';
      const finalQuant = {
        ...(commonReport.resultQuantitative || {}),
        ...(override?.resultQuantitative || {}),
      };

      const oldData = { ...this.samples[idx] };

      this.samples[idx] = {
        ...this.samples[idx],
        reportNumber: commonReport.reportNumber,
        reportReceivedDate: commonReport.reportReceivedDate,
        reportDate: commonReport.reportReceivedDate,
        reportUpdateDate: today,
        laboratoryName: commonReport.laboratoryName || this.samples[idx].laboratoryName,
        result: finalResult,
        reportRemarks: finalRemarks,
        resultQuantitative: Object.keys(finalQuant).length > 0 ? finalQuant : this.samples[idx].resultQuantitative,
        status: 'Report Received',
        syncStatus: 'PENDING_SYNC',
        updatedBy: user.id,
        updatedByName: user.name,
        updatedAt: now,
      };

      updatedSamples.push(this.samples[idx]);

      // Enqueue sync operation
      const syncOp: PendingSyncOperation = {
        localId: `OP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        operationType: 'UPDATE',
        entityType: 'sample',
        entityId: id,
        payload: this.samples[idx] as unknown as Record<string, unknown>,
        createdTime: now,
        syncStatus: 'PENDING',
        retryCount: 0,
        idempotencyKey: `sample_batch_report_${id}_${commonReport.reportNumber}_${Date.now()}`,
      };
      this.enqueueSyncOperation(syncOp);

      this.logAudit({
        action: 'REPORT_UPDATE',
        tableName: 'samples',
        recordId: id,
        summary: `एकत्रित अहवाल संदर्भ क्र. ${commonReport.reportNumber} जोडला (${this.samples[idx].villageName} - ${this.samples[idx].sourceName || id}), निकाल: ${finalResult}`,
        oldData: oldData as unknown as Record<string, unknown>,
        newData: this.samples[idx] as unknown as Record<string, unknown>,
      });
    }

    saveToStorage(STORAGE_KEYS.SAMPLES, this.samples);
    this.notifyListeners();
    return updatedSamples;
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

    // 1. Enforce deduplication by authoritative sample_id
    const uniqueSampleIds = Array.from(new Set((letterData.sampleIds || []).filter(Boolean)));
    if (uniqueSampleIds.length === 0) {
      throw new Error('पत्रात जोडण्यासाठी किमान एक वैध नमुना निवडणे आवश्यक आहे.');
    }

    // 2. Validate eligibility and prevent double dispatch
    for (const sampleId of uniqueSampleIds) {
      const sample = this.samples.find((s) => s.id === sampleId && s.isActive);
      if (!sample) {
        throw new Error(`नमुना आयडी '${sampleId}' सिस्टीममध्ये उपलब्ध नाही.`);
      }
      if (sample.status === 'Dispatched' && sample.sendingLetterNumber) {
        throw new Error(
          `नमुना '${sampleId}' (${sample.sourceName || sample.villageName}) आधीच जावक पत्र क्र. ${sample.sendingLetterNumber} मध्ये पाठवला गेला आहे. दुहेरी पाठवणी अनुमत नाही.`
        );
      }
    }

    const newId = `LTR-${new Date().getFullYear()}-${String(this.sendingLetters.length + 1).padStart(4, '0')}`;

    const newLetter: SendingLetter = {
      ...letterData,
      id: newId,
      sampleIds: uniqueSampleIds,
      sampleCount: uniqueSampleIds.length,
      dispatchDate: letterData.letterDate,
      dispatchStatus: 'Dispatched',
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.sendingLetters.unshift(newLetter);
    saveToStorage(STORAGE_KEYS.SENDING_LETTERS, this.sendingLetters);

    // 3. Link each sample permanently to this letter & update sendingDate + status
    // and maintain dispatch_samples association with strict UNIQUE(dispatch_id, sample_id)
    for (const sampleId of uniqueSampleIds) {
      const idx = this.samples.findIndex((s) => s.id === sampleId);
      if (idx !== -1) {
        this.samples[idx].sendingLetterId = newLetter.id;
        this.samples[idx].sendingLetterNumber = newLetter.letterNumber;
        this.samples[idx].sendingDate = newLetter.letterDate;
        this.samples[idx].dispatchDate = this.samples[idx].dispatchDate || newLetter.letterDate;
        this.samples[idx].laboratoryName = newLetter.laboratoryName;
        this.samples[idx].dispatchMode = newLetter.dispatchMode;
        if (
          this.samples[idx].status === 'Collected' ||
          this.samples[idx].status === 'Ready for Dispatch' ||
          this.samples[idx].status === 'Draft'
        ) {
          this.samples[idx].status = 'Dispatched';
        }
        this.samples[idx].updatedBy = user.id;
        this.samples[idx].updatedByName = user.name;
        this.samples[idx].updatedAt = new Date().toISOString();
      }

      // Enforce UNIQUE(dispatch_id, sample_id)
      const existingAssoc = this.dispatchSamples.find(
        (ds) => ds.dispatchId === newLetter.id && ds.sampleId === sampleId
      );
      if (!existingAssoc) {
        const sampleRecord = idx !== -1 ? this.samples[idx] : null;
        this.dispatchSamples.push({
          id: `DSP-${newLetter.id}-${sampleId}`,
          dispatchId: newLetter.id,
          sampleId,
          sampleTypeId: newLetter.sampleTypeId,
          collectionDate: sampleRecord?.collectionDate || newLetter.letterDate,
          subcenterName: sampleRecord?.subcenterName || sampleRecord?.subcenter,
          villageName: sampleRecord?.villageName || '',
          sourceName: sampleRecord?.sourceName || sampleRecord?.patientName,
          createdAt: new Date().toISOString(),
        });
      }
    }
    saveToStorage(STORAGE_KEYS.SAMPLES, this.samples);
    saveToStorage(STORAGE_KEYS.DISPATCH_SAMPLES, this.dispatchSamples);

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

  getDispatchSamples(dispatchId?: string): DispatchSampleRecord[] {
    if (dispatchId) {
      return this.dispatchSamples.filter((ds) => ds.dispatchId === dispatchId);
    }
    return [...this.dispatchSamples];
  }

  isSampleDispatched(sampleId: string): boolean {
    const s = this.samples.find((item) => item.id === sampleId);
    if (!s) return false;
    if (s.status === 'Dispatched' || Boolean(s.sendingLetterNumber) || Boolean(s.sendingLetterId)) {
      return true;
    }
    return this.dispatchSamples.some((ds) => ds.sampleId === sampleId);
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

  // Purge all dummy, temporary, test sample records and dispatch letters
  purgeAllDummyAndTemporaryData(user?: User): { samplesDeleted: number; lettersDeleted: number } {
    const samplesCount = this.samples.length;
    const lettersCount = this.sendingLetters.length;

    this.samples = [];
    this.sendingLetters = [];
    this.dispatchSamples = [];
    this.auditLogs = [];
    this.syncQueue = [];

    saveToStorage(STORAGE_KEYS.SAMPLES, []);
    saveToStorage(STORAGE_KEYS.SENDING_LETTERS, []);
    saveToStorage(STORAGE_KEYS.DISPATCH_SAMPLES, []);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, []);
    saveToStorage(STORAGE_KEYS.SYNC_QUEUE, []);

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('phc_bhada_samples_v2');
        localStorage.removeItem('phc_bhada_letters_v2');
        localStorage.removeItem('phc_bhada_dispatch_samples_v2');
        localStorage.removeItem('phc_bhada_audit_logs_v2');
        localStorage.removeItem('phc_bhada_sync_queue_v2');
        localStorage.removeItem('phc_bhada_samples');
        localStorage.removeItem('phc_bhada_letters');
      } catch (e) {
        console.error('Storage clear error:', e);
      }
    }

    this.logAudit({
      action: 'DELETE',
      tableName: 'samples',
      recordId: 'PURGE_ALL_DUMMY',
      summary: `सर्व तात्पुरते व डमी नमुने आणि जावक पत्रे यशस्वीरित्या हटवण्यात आली (${samplesCount} नमुने, ${lettersCount} पत्रे)`,
    });

    this.notifyListeners();
    return { samplesDeleted: samplesCount, lettersDeleted: lettersCount };
  }

  // Purge all subcenters, villages, and water sources masters
  purgeAllDummyMasters(user?: User): { subcentersDeleted: number; villagesDeleted: number; sourcesDeleted: number } {
    const scCount = this.subcenters.length;
    const vilCount = this.villages.length;
    const srcCount = this.sources.length;

    this.subcenters = [];
    this.villages = [];
    this.sources = [];

    saveToStorage(STORAGE_KEYS.SUBCENTERS, []);
    saveToStorage(STORAGE_KEYS.VILLAGES, []);
    saveToStorage(STORAGE_KEYS.SOURCES, []);

    this.logAudit({
      action: 'DELETE',
      tableName: 'subcenters',
      recordId: 'PURGE_ALL_MASTERS',
      summary: `सर्व उपकेंद्रे, गावे आणि पाणी स्त्रोत मास्टर डेटाबेस मधून काढून टाकण्यात आले (${scCount} उपकेंद्रे, ${vilCount} गावे, ${srcCount} स्त्रोत)`,
    });

    this.notifyListeners();
    return { subcentersDeleted: scCount, villagesDeleted: vilCount, sourcesDeleted: srcCount };
  }
}

export const clientStore = new ClientDataStore();
