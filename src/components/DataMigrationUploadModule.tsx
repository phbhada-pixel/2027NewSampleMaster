import React, { useState } from 'react';
import { clientStore } from '../services/clientStore';
import {
  User,
  WaterSourceImportRow,
  WaterSourceImportSummary,
  SampleImportRow,
  SampleImportSummary,
  SubcenterVillageImportRow,
  SubcenterVillageImportSummary,
} from '../types';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  RotateCcw,
  Database,
  Droplets,
  Bug,
  Sparkles,
  FlaskConical,
  Building2,
  MapPin,
  FileDown,
  RefreshCw,
  FolderArchive,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  HelpCircle,
  Trash2,
} from 'lucide-react';

// ============================================================================
// SAMPLE TEMPLATES FOR DIFFERENT IMPORT MODES
// ============================================================================

const SAMPLE_WATER_CSV = `collection_date,village_name,source_id,source_name,source_type,sample_type,bottle_no,sending_letter_no,sending_date,lab_name,report_date,result,remarks
2026-08-10,भादा,SRC-BHD-001,ग्रामपंचायत विहीर क्र. १,विहीर,जैविक,1,जा.क्र./प्राआकेंद्राभादा/पाणी/२०२६/१२,2026-08-10,जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर,2026-08-14,पिण्यास योग्य,पावसाळ्यातील नियमित तपासणी
2026-08-10,भादा,SRC-BHD-002,मारुती गल्ली हातपंप,हातपंप,जैविक,2,जा.क्र./प्राआकेंद्राभादा/पाणी/२०२६/१२,2026-08-10,जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर,2026-08-14,पिण्यास अयोग्य,कॉलरा प्रतिबंधक उपाययोजना केली
2026-08-12,लखनगाव,SRC-LKH-001,जि.प. शाळा बोअरवेल,कूपनलिका,जैविक,1,जा.क्र./प्राआकेंद्राभादा/पाणी/२०२६/१४,2026-08-12,जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर,2026-08-16,पिण्यास योग्य,शाळा सुरू असताना तपासणी
2026-08-12,लखनगाव,SRC-LKH-002,मुख्य नळ पाणीपुरवठा विहीर,विहीर,रासायनिक,2,जा.क्र./प्राआकेंद्राभादा/पाणी/२०२६/१४,2026-08-12,जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर,2026-08-18,पिण्यास योग्य,रासायनिक घटक मानकानुसार
2026-08-15,उटी बु.,SRC-UTI-001,उपकेंद्र सार्वजनिक टाकी,सार्वजनिक टाकी,जैविक,1,जा.क्र./प्राआकेंद्राभादा/पाणी/२०२६/१६,2026-08-15,जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर,2026-08-19,पिण्यास योग्य,टी.सी.एल. डोस दिला`;

const SAMPLE_DENGUE_MALARIA_CSV = `sample_type,collection_date,village_name,patient_name,age,sex,mobile,patient_address,fever_onset_days,symptoms_summary,sending_letter_no,lab_name,report_date,result,remarks
डेंग्यू,2026-08-05,भादा,रमेश दत्तात्रय माने,35,पुरुष,9823123456,वार्ड क्र. २ भादा,4,ताप (4 दिवस) डोकेदुखी अंगदुखी,जा.क्र./प्राआकेंद्राभादा/डेंग्यू/२०२६/०८,शासकीय वैद्यकीय महाविद्यालय व रुग्णालय प्रयोगशाळा लातूर,2026-08-08,पॉझिटिव्ह (NS1),रुग्ण बरा झाला
डेंग्यू,2026-08-08,लखनगाव,सुनीता विलास गायकवाड,28,स्त्री,9876543210,माता मंदिर गल्ली लखनगाव,3,ताप (3 दिवस) सांधेदुखी पुरळ,जा.क्र./प्राआकेंद्राभादा/डेंग्यू/२०२६/०९,शासकीय वैद्यकीय महाविद्यालय व रुग्णालय प्रयोगशाळा लातूर,2026-08-11,निगेटिव्ह,उपचार सुरू
हिवताप,2026-08-10,आशिव,अशोक गणपत शिंदे,42,पुरुष,9421098765,आशिव ता. औसा,2,थंडी वाजून तीव्र ताप,जा.क्र./प्राआकेंद्राभादा/हिवताप/२०२६/१५,प्राथमिक आरोग्य केंद्र प्रयोगशाळा भादा,2026-08-10,निगेटिव्ह (MP-Negative),रक्तपट तपासणी पूर्ण
गोवर,2026-08-14,उजनी,आरव सचिन कदम,4,पुरुष,9922334455,उजनी गावठाण,5,ताप आणि लालसर पुरळ,जा.क्र./प्राआकेंद्राभादा/गोवर/२०२६/०३,हाफकिन संस्था मुंबई,2026-08-20,निगेटिव्ह,व्हिटॅमिन ए डोस दिला`;

const SAMPLE_TCL_SALT_CSV = `sample_type,collection_date,village_name,sample_location,available_chlorine_percent,iodine_ppm,sending_letter_no,result,remarks
TCL,2026-08-02,भादा,ग्रामपंचायत पाणीपुरवठा गोडाऊन भादा,34.5,,जा.क्र./प्राआकेंद्राभादा/TCL/२०२६/०५,मानक (३३% पेक्षा जास्त),ब्लिचिंग पावडर शुद्ध
TCL,2026-08-02,लखनगाव,ग्रामपंचायत कार्यालय लखनगाव,28.2,,जा.क्र./प्राआकेंद्राभादा/TCL/२०२६/०५,अमानक (३३% पेक्षा कमी),नवीन साठा वापरण्याच्या सूचना दिल्या
मीठ,2026-08-04,आशिव,किराणा दुकान - मारुती चौक आशिव,,28.0,जा.क्र./प्राआकेंद्राभादा/मीठ/२०२६/०२,मानक (१५ PPM पेक्षा जास्त),टाटा आयोडाइज्ड मीठ
मीठ,2026-08-04,उटी बु.,स्थानिक आठवडी बाजार उटी,,12.5,जा.क्र./प्राआकेंद्राभादा/मीठ/२०२६/०२,अमानक (१५ PPM पेक्षा कमी),खडे मीठ तपासणी`;

const SAMPLE_WATER_SOURCES_CSV = `village_name_or_code,source_id,source_name,source_type,sample_type,location_address,remarks
भादा,SRC-BHD-001,ग्रामपंचायत मुख्य सार्वजनिक विहीर क्र. १,विहीर,BOTH,मारुती मंदिराशेजारी वार्ड क्र. १,मुख्य गाव पाणीपुरवठा स्त्रोत
भादा,SRC-BHD-002,हनुमान मंदिर हातपंप,हातपंप,ST-001,हनुमान मंदिर चौक,सार्वजनिक पिण्याचे पाणी
भादा,SRC-BHD-003,जि. प. प्राथमिक शाळा बोअरवेल,कूपनलिका,ST-001,शाळा परिसर भादा,विद्यार्थ्यांसाठी पाणी
लखनगाव,SRC-LKH-001,मुख्य नळ पाणीपुरवठा विहीर,विहीर,BOTH,नदी काठ लखनगाव,नळ योजना स्त्रोत
लखनगाव,SRC-LKH-002,उपकेंद्र हातपंप क्र. २,हातपंप,ST-001,उपकेंद्र आवार लखनगाव,उपकेंद्र कर्मचारी व रुग्ण
उटी बु.,SRC-UTI-001,सार्वजनिक पिण्याची विहीर,विहीर,BOTH,गावठाण उटी बु.,सार्वजनिक विहीर
आशिव,SRC-ASH-001,जि. प. शाळा हातपंप,हातपंप,ST-001,प्राथमिक शाळा आशिव,शाळा हातपंप
उजनी,SRC-UJN-001,ग्रामपंचायत विहीर,विहीर,BOTH,उजनी गाववेशीजवळ,पिण्याचे पाणी
लोहटा,SRC-LHT-001,सार्वजनिक हातपंप,हातपंप,ST-001,लोहटा चौक,सार्वजनिक वापर
बोरगाव,SRC-BRG-001,मुख्य विहीर बोरगाव,विहीर,BOTH,बोरगाव पाणवठा,पिण्याचे पाणी`;

const SAMPLE_SUBCENTERS_VILLAGES_CSV = `subcenter_code,subcenter_name,village_code,village_name,english_name,taluka,district
BHD,भादा,BHD,भादा,Bhada,औसा,लातूर
BHD,भादा,KND,खंडाळा,Khandala,औसा,लातूर
LKH,लखनगाव,LKH,लखनगाव,Lakhangaon,औसा,लातूर
LKH,लखनगाव,KOR,कोराळा,Korala,औसा,लातूर
UTI,उटी बु.,UTI,उटी बु.,Uti Budruk,औसा,लातूर
UTI,उटी बु.,WNG,वानगाव,Wangaon,औसा,लातूर
ASH,आशिव,ASH,आशिव,Ashiv,औसा,लातूर
ASH,आशिव,SHV,शिवली,Shivli,औसा,लातूर
UJN,उजनी,UJN,उजनी,Ujani,औसा,लातूर
LHT,लोहटा,LHT,लोहटा,Lohta,औसा,लातूर
BRG,बोरगाव,BRG,बोरगाव,Borgaon,औसा,लातूर`;

interface DataMigrationUploadModuleProps {
  currentUser: User;
  onNavigate?: (tab: string, filter?: Record<string, string>) => void;
}

export const DataMigrationUploadModule: React.FC<DataMigrationUploadModuleProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<
    'water-samples' | 'dengue-samples' | 'tcl-salt-samples' | 'water-sources' | 'subcenters-villages' | 'backup-restore'
  >('water-samples');

  // Input states
  const [csvText, setCsvText] = useState<string>(SAMPLE_WATER_CSV);
  const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Validation results
  const [waterSampleSummary, setWaterSampleSummary] = useState<SampleImportSummary | null>(null);
  const [dengueSampleSummary, setDengueSampleSummary] = useState<SampleImportSummary | null>(null);
  const [tclSaltSummary, setTclSaltSummary] = useState<SampleImportSummary | null>(null);
  const [waterSourceSummary, setWaterSourceSummary] = useState<WaterSourceImportSummary | null>(null);
  const [subcenterVillageSummary, setSubcenterVillageSummary] = useState<SubcenterVillageImportSummary | null>(null);

  // Water source lookup & reference state
  const [selectedLookupVillageId, setSelectedLookupVillageId] = useState<string>('ALL');
  const [copiedSourceId, setCopiedSourceId] = useState<string | null>(null);
  const [showSourceLookupWidget, setShowSourceLookupWidget] = useState<boolean>(true);

  // Backup restore state
  const [restoreMode, setRestoreMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [restoreJsonText, setRestoreJsonText] = useState<string>('');
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  // Handle Tab Switch
  const handleTabSwitch = (
    tab: 'water-samples' | 'dengue-samples' | 'tcl-salt-samples' | 'water-sources' | 'subcenters-villages' | 'backup-restore'
  ) => {
    setActiveTab(tab);
    setNotification(null);
    if (tab === 'water-samples') {
      setCsvText(SAMPLE_WATER_CSV);
      setWaterSampleSummary(null);
    } else if (tab === 'dengue-samples') {
      setCsvText(SAMPLE_DENGUE_MALARIA_CSV);
      setDengueSampleSummary(null);
    } else if (tab === 'tcl-salt-samples') {
      setCsvText(SAMPLE_TCL_SALT_CSV);
      setTclSaltSummary(null);
    } else if (tab === 'water-sources') {
      setCsvText(SAMPLE_WATER_SOURCES_CSV);
      setWaterSourceSummary(null);
    } else if (tab === 'subcenters-villages') {
      setCsvText(SAMPLE_SUBCENTERS_VILLAGES_CSV);
      setSubcenterVillageSummary(null);
    }
  };

  const handleCopySourceId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedSourceId(id);
    setTimeout(() => setCopiedSourceId(null), 2500);
  };

  const handleExportAllSourcesWithIdsCsv = () => {
    const allSources = clientStore.getAllSources();
    const allVillages = clientStore.getAllVillages();

    if (allSources.length === 0) {
      alert('सिस्टीममध्ये कोणतेही पाणी स्त्रोत नोंदवलेले नाहीत. आधी "गावनिहाय पाणी स्त्रोत आयात" करा.');
      return;
    }

    const headers = ['village_name', 'village_code', 'subcenter_name', 'source_id', 'source_code', 'source_name', 'source_type', 'location_address'];
    const rows = allSources.map((s) => {
      const v = allVillages.find((vil) => vil.id === s.villageId);
      return [
        `"${s.villageName || v?.name || ''}"`,
        `"${v?.code || ''}"`,
        `"${v?.subcenterName || ''}"`,
        `"${s.id}"`,
        `"${s.sourceCode || s.id}"`,
        `"${s.sourceName.replace(/"/g, '""')}"`,
        `"${s.sourceType}"`,
        `"${(s.locationAddress || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    handleDownloadCsv('registered_water_source_ids_list.csv', csvContent);
  };

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Helper: Copy text
  const handleCopyTemplate = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedTemplate(true);
    showNotification('टेम्पलेट क्लिपबोर्डवर कॉपी केले!', 'info');
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  // Helper: Download CSV template file
  const handleDownloadCsv = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`CSV फाइल "${filename}" डाऊनलोड झाली!`, 'success');
  };

  // Helper: File upload reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isJson: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (isJson) {
        setRestoreJsonText(text);
        showNotification(`बॅकअप फाइल "${file.name}" लोड झाली!`, 'info');
      } else {
        setCsvText(text);
        showNotification(`CSV फाइल "${file.name}" लोड झाली! कृपया 'डेटा तपासा' बटनावर क्लिक करा.`, 'info');
      }
    };
    reader.readAsText(file);
  };

  // ============================================================================
  // 1. WATER SAMPLES PARSER & VALIDATOR
  // ============================================================================
  const parseWaterSamplesCsv = (text: string): SampleImportRow[] => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) return [];

    const headerLine = lines[0].toLowerCase();
    const hasHeader =
      headerLine.includes('collection_date') ||
      headerLine.includes('तारीख') ||
      headerLine.includes('village') ||
      headerLine.includes('गाव');
    const startIndex = hasHeader ? 1 : 0;
    const headers = hasHeader ? lines[0].split(',').map((h) => h.trim().toLowerCase()) : [];
    const hasSourceIdHeader = headers.some(
      (h) => h.includes('source_id') || h.includes('sourceid') || h.includes('स्त्रोत_id') || h.includes('source_code')
    );

    const rows: SampleImportRow[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const collectionDate = parts[0] || new Date().toISOString().split('T')[0];
        const villageName = parts[1] || '';
        let sourceId: string | undefined = undefined;
        let sourceName = 'सार्वजनिक विहीर';
        let sourceType = 'विहीर';
        let sampleTypeRaw = 'जैविक';
        let bottleNumber: string | number = i - startIndex + 1;
        let sendingLetterNumber: string | undefined = undefined;
        let sendingDate = parts[0];
        let laboratoryName = 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर';
        let reportReceivedDate: string | undefined = undefined;
        let result: string | undefined = undefined;
        let remarks = 'जुना पाणी नमुना तपासणी डेटा';

        // Check if 3rd column is source_id
        const isColumn2SourceId =
          hasSourceIdHeader ||
          parts.length >= 13 ||
          (parts[2] && (parts[2].toUpperCase().startsWith('SRC') || parts[2].toUpperCase().startsWith('W-') || parts[2].includes('-')) && parts[3]);

        if (isColumn2SourceId) {
          sourceId = parts[2] || undefined;
          sourceName = parts[3] || 'सार्वजनिक विहीर';
          sourceType = parts[4] || 'विहीर';
          sampleTypeRaw = parts[5] || 'जैविक';
          bottleNumber = parts[6] || (i - startIndex + 1);
          sendingLetterNumber = parts[7] || undefined;
          sendingDate = parts[8] || parts[0];
          laboratoryName = parts[9] || 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर';
          reportReceivedDate = parts[10] || undefined;
          result = parts[11] || undefined;
          remarks = parts[12] || 'जुना पाणी नमुना तपासणी डेटा';
        } else {
          sourceName = parts[2] || 'सार्वजनिक विहीर';
          sourceType = parts[3] || 'विहीर';
          sampleTypeRaw = parts[4] || 'जैविक';
          bottleNumber = parts[5] || (i - startIndex + 1);
          sendingLetterNumber = parts[6] || undefined;
          sendingDate = parts[7] || parts[0];
          laboratoryName = parts[8] || 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर';
          reportReceivedDate = parts[9] || undefined;
          result = parts[10] || undefined;
          remarks = parts[11] || 'जुना पाणी नमुना तपासणी डेटा';
        }

        const isChem =
          sampleTypeRaw.includes('रासायनिक') ||
          sampleTypeRaw.includes('CHM') ||
          sampleTypeRaw === 'ST-002';

        rows.push({
          rowNumber: i,
          collectionDate,
          villageName,
          sourceId,
          sourceCode: sourceId,
          sourceName,
          sourceType,
          sampleTypeId: isChem ? 'ST-002' : 'ST-001',
          bottleNumber,
          sendingLetterNumber,
          sendingDate,
          laboratoryName,
          reportReceivedDate,
          result,
          remarks,
        });
      }
    }
    return rows;
  };

  const handleValidateWaterSamples = () => {
    const rows = parseWaterSamplesCsv(csvText);
    if (rows.length === 0) {
      alert('कृपया वैध CSV डेटा प्रविष्ट करा.');
      return;
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

    const villages = clientStore.getAllVillages();
    const existingSources = clientStore.getAllSources();

    rows.forEach((r, idx) => {
      const rowNum = idx + 1;
      const issues: string[] = [];

      if (!r.collectionDate || isNaN(Date.parse(r.collectionDate))) {
        issues.push('अवैध संकलन तारीख (YYYY-MM-DD आवश्यक)');
      }

      let matchedVillage = villages.find(
        (vil) =>
          vil.name.toLowerCase() === (r.villageName || '').toLowerCase() ||
          vil.code.toLowerCase() === (r.villageName || '').toLowerCase() ||
          (vil.englishName && vil.englishName.toLowerCase() === (r.villageName || '').toLowerCase())
      );

      if (!r.villageName) {
        issues.push('गाव नाव आवश्यक आहे');
      } else if (!matchedVillage) {
        issues.push(`गाव "${r.villageName}" सिस्टीममध्ये उपलब्ध नाही`);
      }

      // Check source ID linkage
      let matchedSource = existingSources.find(
        (s) =>
          (r.sourceId && (s.id.toLowerCase() === r.sourceId.toLowerCase() || s.sourceCode.toLowerCase() === r.sourceId.toLowerCase())) ||
          (matchedVillage && s.villageId === matchedVillage.id && r.sourceName && s.sourceName.toLowerCase() === r.sourceName.toLowerCase())
      );

      let status: 'VALID' | 'INVALID' | 'DUPLICATE' = 'VALID';
      if (issues.length > 0) {
        status = 'INVALID';
        summary.invalidRows++;
        summary.errors.push(`ओळ ${rowNum}: ${issues.join(', ')}`);
      } else {
        status = 'VALID';
        summary.validRows++;
      }

      summary.previewRows.push({
        ...r,
        rowNumber: rowNum,
        sourceId: matchedSource?.id || r.sourceId,
        sourceName: matchedSource?.sourceName || r.sourceName,
        sourceType: matchedSource?.sourceType || r.sourceType,
        sampleTypeName: r.sampleTypeId === 'ST-002' ? 'Water Sample – Chemical' : 'Water Sample – Bacteriological',
        status,
        issues,
      });
    });

    setWaterSampleSummary(summary);
  };

  const handleExecuteWaterSamplesImport = () => {
    const rows = parseWaterSamplesCsv(csvText);
    if (rows.length === 0) return;

    setIsProcessing(true);
    try {
      const res = clientStore.importHistoricalSamples(rows);
      setWaterSampleSummary(res);
      showNotification(`अभिनंदन! ${res.samplesCreated} पाणी नमुने यशस्वीरीत्या डेटाबेसमध्ये जतन झाले.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'आयात करताना त्रुटी आली';
      alert(`त्रुटी: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================================
  // 2. DENGUE & MALARIA SAMPLES PARSER & VALIDATOR
  // ============================================================================
  const parseDengueMalariaCsv = (text: string): SampleImportRow[] => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) return [];

    const rows: SampleImportRow[] = [];
    const startIndex = lines[0].toLowerCase().includes('sample_type') || lines[0].toLowerCase().includes('नमुना') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 4) {
        rows.push({
          rowNumber: i,
          sampleTypeId: parts[0] || 'ST-006',
          collectionDate: parts[1] || new Date().toISOString().split('T')[0],
          villageName: parts[2] || '',
          patientName: parts[3] || '',
          age: parts[4] ? Number(parts[4]) : 30,
          sex: parts[5] || 'पुरुष',
          mobile: parts[6] || '',
          patientAddress: parts[7] || `${parts[2] || ''}, ता. औसा`,
          feverOnsetDays: parts[8] ? Number(parts[8]) : 3,
          symptomsSummary: parts[9] || 'ताप, डोकेदुखी',
          sendingLetterNumber: parts[10] || undefined,
          laboratoryName: parts[11] || 'शासकीय वैद्यकीय महाविद्यालय व रुग्णालय प्रयोगशाळा लातूर',
          reportReceivedDate: parts[12] || undefined,
          result: parts[13] || undefined,
          remarks: parts[14] || 'जुना सीरम/रक्त नमुना डेटा',
        });
      }
    }
    return rows;
  };

  const handleValidateDengueSamples = () => {
    const rows = parseDengueMalariaCsv(csvText);
    if (rows.length === 0) {
      alert('कृपया वैध CSV डेटा प्रविष्ट करा.');
      return;
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

    const villages = clientStore.getAllVillages();

    rows.forEach((r, idx) => {
      const rowNum = idx + 1;
      const issues: string[] = [];

      if (!r.collectionDate || isNaN(Date.parse(r.collectionDate))) {
        issues.push('अवैध संकलन तारीख');
      }
      if (!r.villageName) {
        issues.push('गाव नाव आवश्यक');
      } else {
        const v = villages.find(
          (vil) =>
            vil.name.toLowerCase() === r.villageName.toLowerCase() ||
            vil.code.toLowerCase() === r.villageName.toLowerCase()
        );
        if (!v) issues.push(`गाव "${r.villageName}" उपलब्ध नाही`);
      }
      if (!r.patientName) {
        issues.push('रुग्णाचे नाव आवश्यक आहे');
      }

      let status: 'VALID' | 'INVALID' | 'DUPLICATE' = 'VALID';
      if (issues.length > 0) {
        status = 'INVALID';
        summary.invalidRows++;
        summary.errors.push(`ओळ ${rowNum}: ${issues.join(', ')}`);
      } else {
        status = 'VALID';
        summary.validRows++;
      }

      summary.previewRows.push({
        ...r,
        rowNumber: rowNum,
        sampleTypeName: r.sampleTypeId,
        status,
        issues,
      });
    });

    setDengueSampleSummary(summary);
  };

  const handleExecuteDengueSamplesImport = () => {
    const rows = parseDengueMalariaCsv(csvText);
    if (rows.length === 0) return;

    setIsProcessing(true);
    try {
      const res = clientStore.importHistoricalSamples(rows);
      setDengueSampleSummary(res);
      showNotification(`अभिनंदन! ${res.samplesCreated} डेंग्यू / हिवताप नमुने यशस्वीरीत्या जतन झाले.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'आयात करताना त्रुटी आली';
      alert(`त्रुटी: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================================
  // 3. TCL POWDER & SALT SAMPLES PARSER & VALIDATOR
  // ============================================================================
  const parseTclSaltCsv = (text: string): SampleImportRow[] => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) return [];

    const rows: SampleImportRow[] = [];
    const startIndex = lines[0].toLowerCase().includes('sample_type') || lines[0].toLowerCase().includes('नमुना') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 3) {
        const isTcl = (parts[0] || '').toUpperCase().includes('TCL') || (parts[0] || '').includes('पावडर');

        rows.push({
          rowNumber: i,
          sampleTypeId: isTcl ? 'ST-004' : 'ST-005',
          collectionDate: parts[1] || new Date().toISOString().split('T')[0],
          villageName: parts[2] || '',
          sourceName: parts[3] || 'स्थानिक साठा',
          sourceType: isTcl ? 'ब्लिचिंग पावडर साठा' : 'मीठ नमुना',
          availableChlorinePercent: parts[4] ? Number(parts[4]) : undefined,
          iodinePpm: parts[5] ? Number(parts[5]) : undefined,
          sendingLetterNumber: parts[6] || undefined,
          result: parts[7] || (isTcl ? 'मानक' : 'मानक'),
          remarks: parts[8] || 'जुना TCL / मीठ नमुना तपासणी डेटा',
        });
      }
    }
    return rows;
  };

  const handleValidateTclSalt = () => {
    const rows = parseTclSaltCsv(csvText);
    if (rows.length === 0) {
      alert('कृपया वैध CSV डेटा प्रविष्ट करा.');
      return;
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

    const villages = clientStore.getAllVillages();

    rows.forEach((r, idx) => {
      const rowNum = idx + 1;
      const issues: string[] = [];

      if (!r.collectionDate || isNaN(Date.parse(r.collectionDate))) issues.push('अवैध तारीख');
      if (!r.villageName) issues.push('गाव नाव आवश्यक');
      else {
        const v = villages.find((vil) => vil.name.toLowerCase() === r.villageName.toLowerCase());
        if (!v) issues.push(`गाव "${r.villageName}" उपलब्ध नाही`);
      }

      let status: 'VALID' | 'INVALID' | 'DUPLICATE' = 'VALID';
      if (issues.length > 0) {
        status = 'INVALID';
        summary.invalidRows++;
        summary.errors.push(`ओळ ${rowNum}: ${issues.join(', ')}`);
      } else {
        status = 'VALID';
        summary.validRows++;
      }

      summary.previewRows.push({
        ...r,
        rowNumber: rowNum,
        sampleTypeName: r.sampleTypeId === 'ST-004' ? 'Bleaching Powder (TCL)' : 'Salt Iodine',
        status,
        issues,
      });
    });

    setTclSaltSummary(summary);
  };

  const handleExecuteTclSaltImport = () => {
    const rows = parseTclSaltCsv(csvText);
    if (rows.length === 0) return;

    setIsProcessing(true);
    try {
      const res = clientStore.importHistoricalSamples(rows);
      setTclSaltSummary(res);
      showNotification(`अभिनंदन! ${res.samplesCreated} TCL / मीठ नमुने यशस्वीरीत्या जतन झाले.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'आयात करताना त्रुटी आली';
      alert(`त्रुटी: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================================
  // 4. WATER SOURCES BULK IMPORT PARSER & VALIDATOR
  // ============================================================================
  const parseWaterSourcesCsv = (text: string): WaterSourceImportRow[] => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) return [];

    const headerLine = lines[0].toLowerCase();
    const hasHeader =
      headerLine.includes('source_name') ||
      headerLine.includes('village') ||
      headerLine.includes('गाव') ||
      headerLine.includes('स्त्रोत');
    const startIndex = hasHeader ? 1 : 0;
    const headers = hasHeader ? lines[0].split(',').map((h) => h.trim().toLowerCase()) : [];
    const hasSourceIdHeader = headers.some(
      (h) => h.includes('source_id') || h.includes('sourceid') || h.includes('स्त्रोत_id') || h.includes('source_code')
    );

    const rows: WaterSourceImportRow[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        let villageNameOrCode = parts[0] || '';
        let sourceId: string | undefined = undefined;
        let sourceName = '';
        let sourceType = 'विहीर';
        let sampleType = 'BOTH';
        let locationAddress = '';
        let remarks = 'पाणी स्त्रोत मास्टर आयात';

        const isColumn1SourceId =
          hasSourceIdHeader ||
          parts.length >= 7 ||
          (parts[1] && (parts[1].toUpperCase().startsWith('SRC') || parts[1].toUpperCase().startsWith('W-') || parts[1].includes('-')) && parts[2]);

        if (isColumn1SourceId) {
          sourceId = parts[1] || undefined;
          sourceName = parts[2] || '';
          sourceType = parts[3] || 'विहीर';
          sampleType = parts[4] || 'BOTH';
          locationAddress = parts[5] || `${parts[0] || ''}, ता. औसा`;
          remarks = parts[6] || 'पाणी स्त्रोत मास्टर आयात';
        } else {
          sourceName = parts[1] || '';
          sourceType = parts[2] || 'विहीर';
          sampleType = parts[3] || 'BOTH';
          locationAddress = parts[4] || `${parts[0] || ''}, ता. औसा`;
          remarks = parts[5] || 'पाणी स्त्रोत मास्टर आयात';
        }

        rows.push({
          rowNumber: i,
          sourceId,
          sourceCode: sourceId,
          villageNameOrCode,
          sourceName,
          sourceType,
          sampleType,
          locationAddress,
          remarks,
        });
      }
    }
    return rows;
  };

  const handleValidateWaterSources = () => {
    const rows = parseWaterSourcesCsv(csvText);
    if (rows.length === 0) {
      alert('कृपया वैध CSV डेटा प्रविष्ट करा.');
      return;
    }

    const villages = clientStore.getAllVillages();
    const existingSources = clientStore.getAllSources();

    const summary: WaterSourceImportSummary = {
      totalRows: rows.length,
      validRows: 0,
      invalidRows: 0,
      duplicateRows: 0,
      sourcesCreated: 0,
      errors: [],
      previewRows: [],
    };

    rows.forEach((r, idx) => {
      const rowNum = idx + 1;
      const issues: string[] = [];

      if (!r.villageNameOrCode) issues.push('गाव नाव आवश्यक');
      if (!r.sourceName) issues.push('स्त्रोत नाव आवश्यक');

      const village = villages.find(
        (v) =>
          v.name.toLowerCase() === r.villageNameOrCode.toLowerCase() ||
          v.code.toLowerCase() === r.villageNameOrCode.toLowerCase() ||
          (v.englishName && v.englishName.toLowerCase() === r.villageNameOrCode.toLowerCase())
      );

      if (!village && r.villageNameOrCode) {
        issues.push(`गाव "${r.villageNameOrCode}" सिस्टीममध्ये उपलब्ध नाही`);
      }

      const customId = (r.sourceId || '').trim();
      const isDuplicate = village
        ? existingSources.some(
            (s) =>
              (customId && s.id.toLowerCase() === customId.toLowerCase()) ||
              (s.villageId === village.id &&
                s.sourceName.toLowerCase() === r.sourceName.toLowerCase() &&
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
        issues.push(customId ? `स्त्रोत आयडी "${customId}" आधीपासून अस्तित्वात आहे` : 'या गावामध्ये हा स्त्रोत आधीपासून अस्तित्वात आहे');
      } else {
        status = 'VALID';
        summary.validRows++;
      }

      summary.previewRows.push({
        ...r,
        rowNumber: rowNum,
        resolvedVillageId: village?.id,
        resolvedVillageName: village?.name,
        resolvedSubcenterName: village?.subcenterName,
        status,
        issues,
      });
    });

    setWaterSourceSummary(summary);
  };

  const handleExecuteWaterSourcesImport = () => {
    const rows = parseWaterSourcesCsv(csvText);
    if (rows.length === 0) return;

    setIsProcessing(true);
    try {
      const res = clientStore.importWaterSources(rows);
      setWaterSourceSummary(res);
      showNotification(`अभिनंदन! ${res.sourcesCreated} नवीन पाणी स्त्रोत यशस्वीरीत्या तयार झाले.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'आयात करताना त्रुटी आली';
      alert(`त्रुटी: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================================
  // 5. SUBCENTERS & VILLAGES MASTER PARSER & VALIDATOR
  // ============================================================================
  const parseSubcentersVillagesCsv = (text: string): SubcenterVillageImportRow[] => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) return [];

    const rows: SubcenterVillageImportRow[] = [];
    const startIndex = lines[0].toLowerCase().includes('subcenter') || lines[0].toLowerCase().includes('उपकेंद्र') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 4) {
        rows.push({
          rowNumber: i,
          subcenterCode: parts[0] || '',
          subcenterName: parts[1] || '',
          villageCode: parts[2] || '',
          villageName: parts[3] || '',
          englishName: parts[4] || parts[3],
          taluka: parts[5] || 'औसा',
          district: parts[6] || 'लातूर',
        });
      }
    }
    return rows;
  };

  const handleValidateSubcentersVillages = () => {
    const rows = parseSubcentersVillagesCsv(csvText);
    if (rows.length === 0) {
      alert('कृपया वैध CSV डेटा प्रविष्ट करा.');
      return;
    }

    const existingVillages = clientStore.getAllVillages();
    const existingVillageCodes = new Set(existingVillages.map((v) => v.code.toUpperCase()));
    const batchCodes = new Set<string>();

    const summary: SubcenterVillageImportSummary = {
      totalRows: rows.length,
      validRows: 0,
      subcentersCreated: 0,
      villagesCreated: 0,
      duplicatesFound: 0,
      errors: [],
      previewRows: [],
    };

    rows.forEach((r, idx) => {
      const rowNum = idx + 1;
      const issues: string[] = [];
      const scCode = (r.subcenterCode || '').trim().toUpperCase();
      const scName = (r.subcenterName || '').trim();
      const vilCode = (r.villageCode || '').trim().toUpperCase();
      const vilName = (r.villageName || '').trim();

      if (!scCode) issues.push('उपकेंद्र कोड आवश्यक आहे');
      if (!scName) issues.push('उपकेंद्र नाव आवश्यक आहे');
      if (!vilCode) issues.push('गाव कोड आवश्यक आहे');
      if (!vilName) issues.push('गाव नाव आवश्यक आहे');

      let status: 'VALID' | 'DUPLICATE' | 'INVALID' = 'VALID';

      if (issues.length > 0) {
        status = 'INVALID';
        summary.errors.push(`ओळ ${rowNum}: ${issues.join(', ')}`);
      } else if (existingVillageCodes.has(vilCode) || batchCodes.has(vilCode)) {
        status = 'DUPLICATE';
        summary.duplicatesFound++;
        issues.push(`गाव कोड "${vilCode}" आधीपासून अस्तित्वात आहे`);
      } else {
        batchCodes.add(vilCode);
        summary.validRows++;
      }

      summary.previewRows.push({
        rowNumber: rowNum,
        subcenterCode: scCode,
        subcenterName: scName,
        villageCode: vilCode,
        villageName: vilName,
        englishName: r.englishName || vilName,
        taluka: r.taluka || 'औसा',
        district: r.district || 'लातूर',
        status,
        issues,
      });
    });

    setSubcenterVillageSummary(summary);
  };

  const handleExecuteSubcentersVillagesImport = () => {
    const rows = parseSubcentersVillagesCsv(csvText);
    if (rows.length === 0) return;

    setIsProcessing(true);
    try {
      const res = clientStore.importSubcentersAndVillages(rows as any);
      setSubcenterVillageSummary(res);
      showNotification(
        `अभिनंदन! ${res.subcentersCreated} नवीन उपकेंद्रे व ${res.villagesCreated} नवीन गावे तयार झाली.`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'आयात करताना त्रुटी आली';
      alert(`त्रुटी: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================================
  // 6. FULL SYSTEM BACKUP & RESTORE ACTIONS
  // ============================================================================
  const handleExportFullSystemBackup = () => {
    const jsonStr = clientStore.exportFullSystemBackup();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `PHC_Bhada_Full_Backup_${dateStr}.json`;

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(`संपूर्ण डेटा बॅकअप फाइल "${filename}" डाऊनलोड झाली!`, 'success');
  };

  const handleExecuteRestore = () => {
    if (!restoreJsonText.trim()) {
      alert('कृपया बॅकअप JSON मजकूर पेस्ट करा किंवा .json फाइल अपलोड करा.');
      return;
    }

    const confirmMsg =
      restoreMode === 'REPLACE'
        ? 'सावधान! "संपूर्ण पुनर्स्थित करा (Replace All)" मोड निवडल्यास सध्याचा सर्व डेटा बदलला जाईल. पुढे जायचे का?'
        : 'तुम्ही बॅकअपमधील डेटा सध्याच्या डेटाबेसमध्ये समाविष्ट (Merge) करू इच्छिता का?';

    if (!window.confirm(confirmMsg)) return;

    setIsProcessing(true);
    try {
      const res = clientStore.restoreFullSystemBackup(restoreJsonText, restoreMode);
      if (res.success) {
        setRestoreStatus(res.message);
        showNotification(res.message, 'success');
      } else {
        alert(`त्रुटी: ${res.message}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'रिस्टोअर करताना त्रुटी आली';
      alert(`त्रुटी: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurgeAllDummyData = () => {
    const confirmMsg =
      'सावधान: सिस्टीममधील सर्व डमी/चाचणी नमुने (Samples) आणि जावक पत्रे कायमस्वरूपी काढून टाकण्यात येतील. तुमचे उपकेंद्र, गाव आणि पाणी स्त्रोत मास्टर डेटा सुरक्षित राहील.\n\nतुम्हाला खात्री आहे का?';

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = clientStore.purgeAllDummyAndTemporaryData(currentUser);
      showNotification(
        `यशस्वी: सर्व डमी नमुने काढून टाकले (${res.samplesDeleted} नमुने, ${res.lettersDeleted} जावक पत्रे हटवली). सिस्टीम आता पूर्णपणे स्वच्छ आहे.`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'डेटा हटवताना त्रुटी आली';
      alert(`त्रुटी: ${msg}`);
    }
  };

  const handlePurgeAllMasters = () => {
    const confirmMsg =
      'सावधान: सिस्टीममधील सर्व उपकेंद्रे, गावे आणि पाणी स्त्रोत मास्टर नोंदी काढून टाकल्या जातील, जेणेकरून तुम्ही नवीन CSV द्वारे सर्व माहिती नव्याने भरू शकता.\n\nतुम्हाला खात्री आहे का?';

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = clientStore.purgeAllDummyMasters(currentUser);
      showNotification(
        `यशस्वी: सर्व उपकेंद्रे (${res.subcentersDeleted}), गावे (${res.villagesDeleted}), व पाणी स्त्रोत (${res.sourcesDeleted}) काढून टाकण्यात आले. आता तुम्ही नवीन CSV द्वारे डेटा आयात करू शकता.`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'मास्टर डेटा हटवताना त्रुटी आली';
      alert(`त्रुटी: ${msg}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-indigo-900/50">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <UploadCloud className="w-4 h-4 text-emerald-400" />
            डेटा स्थलांतर व जुना डेटा आयात व्यवस्थापन (Old Data Upload & Bulk Migration Suite)
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            सर्व जुने नमुने, गावनिहाय पाणी स्त्रोत, उपकेंद्रे व गावे बल्क आयात
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
            मागील वर्षांचे/महिन्यांचे सर्व पाणी नमुने (जैविक/रासायनिक), डेंग्यू/चिकनगुनिया, हिवताप, गोवर, TCL, मीठ नमुने, पाणी स्त्रोत व संपूर्ण डेटा बॅकअप एकाच क्लिकवर आयात करा.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportFullSystemBackup}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
            title="Download Full JSON Backup"
          >
            <Download className="w-4 h-4" />
            <span>संपूर्ण सिस्टीम बॅकअप (JSON)</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 border shadow-sm transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : notification.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-300'
              : 'bg-indigo-50 text-indigo-900 border-indigo-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{notification.text}</span>
        </div>
      )}

      {/* Main Multi-Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/80 px-3 py-2 flex flex-wrap gap-1.5 overflow-x-auto">
          <button
            onClick={() => handleTabSwitch('water-samples')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'water-samples'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Droplets className="w-4 h-4" />
            <span>१. जुने पाणी नमुने आयात (Water Samples)</span>
          </button>

          <button
            onClick={() => handleTabSwitch('dengue-samples')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'dengue-samples'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Bug className="w-4 h-4" />
            <span>२. डेंग्यू / हिवताप / गोवर नमुने (Serum & Blood)</span>
          </button>

          <button
            onClick={() => handleTabSwitch('tcl-salt-samples')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'tcl-salt-samples'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>३. TCL पावडर व मीठ नमुने (TCL & Salt)</span>
          </button>

          <button
            onClick={() => handleTabSwitch('water-sources')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'water-sources'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>४. गावनिहाय पाणी स्त्रोत आयात (Water Sources Master)</span>
          </button>

          <button
            onClick={() => handleTabSwitch('subcenters-villages')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'subcenters-villages'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>५. उपकेंद्रे व गावे मास्टर (Subcenters & Villages)</span>
          </button>

          <button
            onClick={() => handleTabSwitch('backup-restore')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'backup-restore'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>६. संपूर्ण सिस्टीम बॅकअप व रिस्टोअर (Backup & Restore)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* TAB 1: WATER SAMPLES */}
          {activeTab === 'water-samples' && (
            <div className="space-y-5">
              <div className="bg-cyan-50/70 border border-cyan-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-cyan-950 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-cyan-700" />
                    मागील जुने पाणी नमुने (जैविक व रासायनिक) बल्क आयात
                  </h3>
                  <p className="text-xs text-cyan-800 mt-0.5">
                    संकलन तारीख, गाव, <strong>स्त्रोत आयडी (Source ID)</strong> किंवा नाव, तपासणी प्रकार (जैविक/रासायनिक), बाटली क्र., प्रयोगशाळा जावक पत्र क्र., निकाल (पिण्यास योग्य/अयोग्य) आणि शेरा.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleDownloadCsv('old_water_samples_template.csv', SAMPLE_WATER_CSV)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-white border border-cyan-300 hover:bg-cyan-100 text-cyan-900 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV टेम्पलेट डाऊनलोड</span>
                  </button>
                  <button
                    onClick={() => handleCopyTemplate(SAMPLE_WATER_CSV)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-cyan-700 hover:bg-cyan-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                  >
                    {copiedTemplate ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>कॉपी नमुना</span>
                  </button>
                </div>
              </div>

              {/* Source ID Helper Widget */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-cyan-100 text-cyan-800 text-xs font-bold px-2 py-0.5 rounded">
                      स्त्रोत आयडी संदर्भ (Source ID Lookup)
                    </span>
                    <span className="text-xs text-slate-600">
                      ओल्ड डेटा अपलोड करताना अचूक स्त्रोत जोडण्यासाठी खालील आयडी वापरा:
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportAllSourcesWithIdsCsv}
                      className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-3 h-3 text-cyan-700" />
                      <span>सर्व स्त्रोत आयडी CSV डाऊनलोड</span>
                    </button>
                    <button
                      onClick={() => setShowSourceLookupWidget(!showSourceLookupWidget)}
                      className="text-xs text-slate-600 hover:text-slate-900 font-medium underline"
                    >
                      {showSourceLookupWidget ? 'लपवा' : 'पहा'}
                    </button>
                  </div>
                </div>

                {showSourceLookupWidget && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-700 font-medium">गाव निवडा:</label>
                      <select
                        value={selectedLookupVillageId}
                        onChange={(e) => setSelectedLookupVillageId(e.target.value)}
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="ALL">सर्व गावे ({clientStore.getAllSources().length} स्त्रोत)</option>
                        {clientStore.getAllVillages().map((v) => {
                          const count = clientStore.getAllSources().filter((s) => s.villageId === v.id).length;
                          return (
                            <option key={v.id} value={v.id}>
                              {v.name} ({count} स्त्रोत)
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                      {clientStore
                        .getAllSources()
                        .filter((s) => selectedLookupVillageId === 'ALL' || s.villageId === selectedLookupVillageId)
                        .map((src) => (
                          <div
                            key={src.id}
                            className="bg-white border border-slate-200 rounded p-2 flex items-center justify-between text-xs hover:border-cyan-400 transition-colors shadow-2xs"
                          >
                            <div className="truncate mr-2">
                              <div className="font-mono font-bold text-cyan-900 flex items-center gap-1">
                                <span>{src.sourceCode || src.id}</span>
                                <span className="text-[10px] text-slate-500 font-normal">({src.villageName})</span>
                              </div>
                              <div className="text-[11px] text-slate-600 truncate">{src.sourceName}</div>
                            </div>
                            <button
                              onClick={() => handleCopySourceId(src.sourceCode || src.id)}
                              title="स्त्रोत ID कॉपी करा"
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-cyan-700 flex-shrink-0"
                            >
                              {copiedSourceId === (src.sourceCode || src.id) ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Input and Editor */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                    CSV मजकूर पेस्ट करा किंवा फाइल निवडा:
                  </label>
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
                    <span>फाइल अपलोड (.csv / .txt)</span>
                    <input type="file" accept=".csv,.txt" onChange={(e) => handleFileUpload(e, false)} className="hidden" />
                  </label>
                </div>

                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={7}
                  className="w-full font-mono text-xs p-3 bg-slate-900 text-emerald-400 rounded-lg border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  placeholder="collection_date,village_name,source_id,source_name,source_type,sample_type,bottle_no,sending_letter_no,sending_date,lab_name,report_date,result,remarks..."
                />

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setCsvText(SAMPLE_WATER_CSV)}
                    className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>मूळ नमुना लोड करा</span>
                  </button>
                  <button
                    onClick={handleValidateWaterSamples}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold text-xs shadow transition-all"
                  >
                    १. डेटा तपासा (Validate)
                  </button>
                </div>
              </div>

              {/* Validation Summary Table */}
              {waterSampleSummary && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-slate-800">{waterSampleSummary.totalRows}</div>
                      <div className="text-[11px] text-slate-600">एकूण ओळी (Total Rows)</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-emerald-700">{waterSampleSummary.validRows}</div>
                      <div className="text-[11px] text-emerald-700 font-semibold">वैध नमुने (Valid)</div>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-rose-700">{waterSampleSummary.invalidRows}</div>
                      <div className="text-[11px] text-rose-700 font-semibold">अवैध ओळी (Invalid)</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-blue-700">{waterSampleSummary.samplesCreated}</div>
                      <div className="text-[11px] text-blue-700 font-semibold">जतन झालेले (Created)</div>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-72">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="p-2 border-r border-slate-200">क्र.</th>
                          <th className="p-2 border-r border-slate-200">स्थिती</th>
                          <th className="p-2 border-r border-slate-200">तारीख</th>
                          <th className="p-2 border-r border-slate-200">गाव</th>
                          <th className="p-2 border-r border-slate-200">स्त्रोत आयडी</th>
                          <th className="p-2 border-r border-slate-200">स्त्रोत नाव</th>
                          <th className="p-2 border-r border-slate-200">प्रकार</th>
                          <th className="p-2 border-r border-slate-200">बाटली क्र.</th>
                          <th className="p-2 border-r border-slate-200">निकाल (Result)</th>
                          <th className="p-2">त्रुटी / शेरा</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {waterSampleSummary.previewRows.map((r, i) => (
                          <tr key={i} className={r.status === 'VALID' ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                            <td className="p-2 font-mono text-slate-500 border-r border-slate-200">{r.rowNumber}</td>
                            <td className="p-2 border-r border-slate-200">
                              {r.status === 'VALID' ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 w-max">
                                  <Check className="w-3 h-3 text-emerald-600" /> वैध
                                </span>
                              ) : (
                                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 w-max">
                                  <XCircle className="w-3 h-3 text-rose-600" /> अवैध
                                </span>
                              )}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-medium">{r.collectionDate}</td>
                            <td className="p-2 border-r border-slate-200 font-bold text-slate-800">{r.villageName}</td>
                            <td className="p-2 border-r border-slate-200 font-mono text-cyan-800 font-semibold">{r.sourceId || '—'}</td>
                            <td className="p-2 border-r border-slate-200">{r.sourceName}</td>
                            <td className="p-2 border-r border-slate-200 text-slate-600">{r.sampleTypeId === 'ST-002' ? 'रासायनिक' : 'जैविक'}</td>
                            <td className="p-2 border-r border-slate-200 font-bold">{r.bottleNumber}</td>
                            <td className="p-2 border-r border-slate-200">
                              {r.result ? (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  r.result.includes('अयोग्य') ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {r.result}
                                </span>
                              ) : (
                                <span className="text-slate-400">प्रलंबित</span>
                              )}
                            </td>
                            <td className="p-2 text-rose-600 text-[11px]">
                              {r.issues && r.issues.length > 0 ? r.issues.join(', ') : r.remarks || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {waterSampleSummary.validRows > 0 && waterSampleSummary.samplesCreated === 0 && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleExecuteWaterSamplesImport}
                        disabled={isProcessing}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-bold text-xs shadow-md transition-all flex items-center gap-2"
                      >
                        {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>२. डेटाबेसमध्ये जतन करा ({waterSampleSummary.validRows} नमुने)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DENGUE & BLOOD SAMPLES */}
          {activeTab === 'dengue-samples' && (
            <div className="space-y-5">
              <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                    <Bug className="w-4 h-4 text-rose-700" />
                    जुने डेंग्यू / चिकनगुनिया, हिवताप व गोवर सीरम नमुने आयात
                  </h3>
                  <p className="text-xs text-rose-800 mt-0.5">
                    नमुना प्रकार, संकलन तारीख, गाव, रुग्णाचे नाव, वय, लिंग, लक्षणे, कालावधी, प्रयोगशाळा जावक पत्र क्र. व निकाल.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleDownloadCsv('dengue_malaria_samples_template.csv', SAMPLE_DENGUE_MALARIA_CSV)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-900 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV टेम्पलेट डाऊनलोड</span>
                  </button>
                  <button
                    onClick={() => handleCopyTemplate(SAMPLE_DENGUE_MALARIA_CSV)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                  >
                    {copiedTemplate ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>कॉपी नमुना</span>
                  </button>
                </div>
              </div>

              {/* Editor */}
              <div className="space-y-3">
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={7}
                  className="w-full font-mono text-xs p-3 bg-slate-900 text-rose-300 rounded-lg border border-slate-700 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  placeholder="sample_type,collection_date,village_name,patient_name,age,sex,mobile,patient_address,fever_onset_days,symptoms_summary,sending_letter_no,lab_name,report_date,result,remarks..."
                />

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setCsvText(SAMPLE_DENGUE_MALARIA_CSV)}
                    className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>मूळ नमुना लोड करा</span>
                  </button>
                  <button
                    onClick={handleValidateDengueSamples}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-lg font-bold text-xs shadow transition-all"
                  >
                    १. डेटा तपासा (Validate)
                  </button>
                </div>
              </div>

              {/* Dengue Summary */}
              {dengueSampleSummary && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-slate-800">{dengueSampleSummary.totalRows}</div>
                      <div className="text-[11px] text-slate-600">एकूण ओळी (Total Rows)</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-emerald-700">{dengueSampleSummary.validRows}</div>
                      <div className="text-[11px] text-emerald-700 font-semibold">वैध नमुने (Valid)</div>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-rose-700">{dengueSampleSummary.invalidRows}</div>
                      <div className="text-[11px] text-rose-700 font-semibold">अवैध ओळी (Invalid)</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-blue-700">{dengueSampleSummary.samplesCreated}</div>
                      <div className="text-[11px] text-blue-700 font-semibold">जतन झालेले (Created)</div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-72">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="p-2 border-r border-slate-200">क्र.</th>
                          <th className="p-2 border-r border-slate-200">स्थिती</th>
                          <th className="p-2 border-r border-slate-200">प्रकार</th>
                          <th className="p-2 border-r border-slate-200">तारीख</th>
                          <th className="p-2 border-r border-slate-200">गाव</th>
                          <th className="p-2 border-r border-slate-200">रुग्णाचे नाव</th>
                          <th className="p-2 border-r border-slate-200">वय/लिंग</th>
                          <th className="p-2 border-r border-slate-200">लक्षणे</th>
                          <th className="p-2 border-r border-slate-200">निकाल (Result)</th>
                          <th className="p-2">शेरा</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dengueSampleSummary.previewRows.map((r, i) => (
                          <tr key={i} className={r.status === 'VALID' ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                            <td className="p-2 font-mono text-slate-500 border-r border-slate-200">{r.rowNumber}</td>
                            <td className="p-2 border-r border-slate-200">
                              {r.status === 'VALID' ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">वैध</span>
                              ) : (
                                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded">अवैध</span>
                              )}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-bold text-purple-700">{r.sampleTypeId}</td>
                            <td className="p-2 border-r border-slate-200">{r.collectionDate}</td>
                            <td className="p-2 border-r border-slate-200 font-bold text-slate-800">{r.villageName}</td>
                            <td className="p-2 border-r border-slate-200 font-semibold">{r.patientName}</td>
                            <td className="p-2 border-r border-slate-200 text-slate-600">{r.age} वर्षे / {r.sex}</td>
                            <td className="p-2 border-r border-slate-200 text-slate-600 text-[11px]">{r.symptomsSummary}</td>
                            <td className="p-2 border-r border-slate-200">
                              {r.result ? (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  r.result.includes('पॉझिटिव्ह') ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {r.result}
                                </span>
                              ) : (
                                <span className="text-slate-400">प्रलंबित</span>
                              )}
                            </td>
                            <td className="p-2 text-slate-600 text-[11px]">{r.remarks || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {dengueSampleSummary.validRows > 0 && dengueSampleSummary.samplesCreated === 0 && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleExecuteDengueSamplesImport}
                        disabled={isProcessing}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-lg font-bold text-xs shadow-md transition-all flex items-center gap-2"
                      >
                        {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>२. डेटाबेसमध्ये जतन करा ({dengueSampleSummary.validRows} नमुने)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TCL & SALT */}
          {activeTab === 'tcl-salt-samples' && (
            <div className="space-y-5">
              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-amber-700" />
                    जुने टी.सी.एल. पावडर व मीठ आयोडीन नमुने आयात
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    नमुना प्रकार (TCL / मीठ), संकलन तारीख, गाव, ठिकाण, उपलब्ध क्लोरीन प्रमाण %, आयोडीन PPM व निष्कर्ष.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleDownloadCsv('tcl_salt_samples_template.csv', SAMPLE_TCL_SALT_CSV)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV टेम्पलेट डाऊनलोड</span>
                  </button>
                  <button
                    onClick={() => handleCopyTemplate(SAMPLE_TCL_SALT_CSV)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                  >
                    {copiedTemplate ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>कॉपी नमुना</span>
                  </button>
                </div>
              </div>

              {/* Editor */}
              <div className="space-y-3">
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={7}
                  className="w-full font-mono text-xs p-3 bg-slate-900 text-amber-300 rounded-lg border border-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="sample_type,collection_date,village_name,sample_location,available_chlorine_percent,iodine_ppm,sending_letter_no,result,remarks..."
                />

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setCsvText(SAMPLE_TCL_SALT_CSV)}
                    className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>मूळ नमुना लोड करा</span>
                  </button>
                  <button
                    onClick={handleValidateTclSalt}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg font-bold text-xs shadow transition-all"
                  >
                    १. डेटा तपासा (Validate)
                  </button>
                </div>
              </div>

              {/* TCL Summary */}
              {tclSaltSummary && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-slate-800">{tclSaltSummary.totalRows}</div>
                      <div className="text-[11px] text-slate-600">एकूण ओळी (Total Rows)</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-emerald-700">{tclSaltSummary.validRows}</div>
                      <div className="text-[11px] text-emerald-700 font-semibold">वैध नमुने (Valid)</div>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-rose-700">{tclSaltSummary.invalidRows}</div>
                      <div className="text-[11px] text-rose-700 font-semibold">अवैध ओळी (Invalid)</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-blue-700">{tclSaltSummary.samplesCreated}</div>
                      <div className="text-[11px] text-blue-700 font-semibold">जतन झालेले (Created)</div>
                    </div>
                  </div>

                  {tclSaltSummary.validRows > 0 && tclSaltSummary.samplesCreated === 0 && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleExecuteTclSaltImport}
                        disabled={isProcessing}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-lg font-bold text-xs shadow-md transition-all flex items-center gap-2"
                      >
                        {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>२. डेटाबेसमध्ये जतन करा ({tclSaltSummary.validRows} नमुने)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WATER SOURCES MASTER */}
          {activeTab === 'water-sources' && (
            <div className="space-y-5">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    गावनिहाय सर्व पाणी स्त्रोत (Water Sources Master) बल्क आयात
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    गावाचे नाव/कोड, स्त्रोताचे नाव (उदा. विहीर क्र.१, हातपंप, शाळा बोअरवेल), स्त्रोत प्रकार, तपासणी प्रकार (जैविक/रासायनिक/दोन्ही) व ठिकाण.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleDownloadCsv('village_water_sources_template.csv', SAMPLE_WATER_SOURCES_CSV)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV टेम्पलेट डाऊनलोड</span>
                  </button>
                  <button
                    onClick={() => handleCopyTemplate(SAMPLE_WATER_SOURCES_CSV)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                  >
                    {copiedTemplate ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>कॉपी नमुना</span>
                  </button>
                </div>
              </div>

              {/* Editor */}
              <div className="space-y-3">
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={7}
                  className="w-full font-mono text-xs p-3 bg-slate-900 text-emerald-300 rounded-lg border border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="village_name_or_code,source_name,source_type,sample_type,location_address,remarks..."
                />

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setCsvText(SAMPLE_WATER_SOURCES_CSV)}
                    className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>मूळ नमुना लोड करा</span>
                  </button>
                  <button
                    onClick={handleValidateWaterSources}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-lg font-bold text-xs shadow transition-all"
                  >
                    १. डेटा तपासा (Validate)
                  </button>
                </div>
              </div>

              {/* Water Sources Summary */}
              {waterSourceSummary && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-slate-800">{waterSourceSummary.totalRows}</div>
                      <div className="text-[11px] text-slate-600">एकूण ओळी (Total Rows)</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-emerald-700">{waterSourceSummary.validRows}</div>
                      <div className="text-[11px] text-emerald-700 font-semibold">वैध स्त्रोत (Valid)</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-amber-700">{waterSourceSummary.duplicateRows}</div>
                      <div className="text-[11px] text-amber-700 font-semibold">आधीच अस्तित्वात (Duplicate)</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-blue-700">{waterSourceSummary.sourcesCreated}</div>
                      <div className="text-[11px] text-blue-700 font-semibold">तयार केलेले (Created)</div>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-72">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="p-2 border-r border-slate-200">क्र.</th>
                          <th className="p-2 border-r border-slate-200">स्थिती</th>
                          <th className="p-2 border-r border-slate-200">गाव</th>
                          <th className="p-2 border-r border-slate-200">उपकेंद्र</th>
                          <th className="p-2 border-r border-slate-200">स्त्रोत आयडी</th>
                          <th className="p-2 border-r border-slate-200">स्त्रोत नाव</th>
                          <th className="p-2 border-r border-slate-200">प्रकार</th>
                          <th className="p-2 border-r border-slate-200">तपासणी प्रकार</th>
                          <th className="p-2">पत्ता / शेरा</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {waterSourceSummary.previewRows.map((r, i) => (
                          <tr key={i} className={r.status === 'VALID' ? 'hover:bg-slate-50' : r.status === 'DUPLICATE' ? 'bg-amber-50/50' : 'bg-rose-50/50'}>
                            <td className="p-2 font-mono text-slate-500 border-r border-slate-200">{r.rowNumber}</td>
                            <td className="p-2 border-r border-slate-200">
                              {r.status === 'VALID' ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">वैध</span>
                              ) : r.status === 'DUPLICATE' ? (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">अस्तित्वात</span>
                              ) : (
                                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded">अवैध</span>
                              )}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-bold text-slate-800">{r.resolvedVillageName || r.villageNameOrCode}</td>
                            <td className="p-2 border-r border-slate-200 text-slate-600">{r.resolvedSubcenterName || '—'}</td>
                            <td className="p-2 border-r border-slate-200 font-mono text-cyan-800 font-semibold">{r.sourceId || 'स्वयंचलित'}</td>
                            <td className="p-2 border-r border-slate-200 font-semibold">{r.sourceName}</td>
                            <td className="p-2 border-r border-slate-200">{r.sourceType}</td>
                            <td className="p-2 border-r border-slate-200 text-emerald-700 font-medium">{r.sampleType}</td>
                            <td className="p-2 text-slate-600 text-[11px]">{r.locationAddress}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {waterSourceSummary.validRows > 0 && waterSourceSummary.sourcesCreated === 0 && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleExecuteWaterSourcesImport}
                        disabled={isProcessing}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-lg font-bold text-xs shadow-md transition-all flex items-center gap-2"
                      >
                        {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>२. डेटाबेसमध्ये जतन करा ({waterSourceSummary.validRows} स्त्रोत)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SUBCENTERS & VILLAGES */}
          {activeTab === 'subcenters-villages' && (
            <div className="space-y-5">
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-700" />
                    उपकेंद्रे व गावे मास्टर (Subcenters & Villages Master) आयात
                  </h3>
                  <p className="text-xs text-indigo-800 mt-0.5">
                    उपकेंद्र कोड, उपकेंद्र नाव, गाव कोड, गाव नाव, इंग्रजी नाव, तालुका व जिल्हा.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleDownloadCsv('subcenters_villages_template.csv', SAMPLE_SUBCENTERS_VILLAGES_CSV)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-white border border-indigo-300 hover:bg-indigo-100 text-indigo-900 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV टेम्पलेट डाऊनलोड</span>
                  </button>
                  <button
                    onClick={() => handleCopyTemplate(SAMPLE_SUBCENTERS_VILLAGES_CSV)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                  >
                    {copiedTemplate ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>कॉपी नमुना</span>
                  </button>
                </div>
              </div>

              {/* Editor */}
              <div className="space-y-3">
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={7}
                  className="w-full font-mono text-xs p-3 bg-slate-900 text-indigo-300 rounded-lg border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="subcenter_code,subcenter_name,village_code,village_name,english_name,taluka,district..."
                />

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setCsvText(SAMPLE_SUBCENTERS_VILLAGES_CSV)}
                    className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>मूळ नमुना लोड करा</span>
                  </button>
                  <button
                    onClick={handleValidateSubcentersVillages}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold text-xs shadow transition-all"
                  >
                    १. डेटा तपासा (Validate)
                  </button>
                </div>
              </div>

              {/* Subcenter Village Summary */}
              {subcenterVillageSummary && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-slate-800">{subcenterVillageSummary.totalRows}</div>
                      <div className="text-[11px] text-slate-600">एकूण ओळी (Total Rows)</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-emerald-700">{subcenterVillageSummary.validRows}</div>
                      <div className="text-[11px] text-emerald-700 font-semibold">नवीन गावे (Valid)</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-amber-700">{subcenterVillageSummary.duplicatesFound}</div>
                      <div className="text-[11px] text-amber-700 font-semibold">आधीच अस्तित्वात (Duplicate)</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-blue-700">
                        {subcenterVillageSummary.subcentersCreated + subcenterVillageSummary.villagesCreated}
                      </div>
                      <div className="text-[11px] text-blue-700 font-semibold">तयार झालेले रेकॉर्ड्स</div>
                    </div>
                  </div>

                  {subcenterVillageSummary.validRows > 0 && subcenterVillageSummary.villagesCreated === 0 && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleExecuteSubcentersVillagesImport}
                        disabled={isProcessing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold text-xs shadow-md transition-all flex items-center gap-2"
                      >
                        {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>२. डेटाबेसमध्ये जतन करा ({subcenterVillageSummary.validRows} गावे)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: BACKUP & RESTORE */}
          {activeTab === 'backup-restore' && (
            <div className="space-y-6">
              <div className="bg-purple-50/80 border border-purple-200 rounded-lg p-5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                      <FolderArchive className="w-4 h-4 text-purple-700" />
                      संपूर्ण सिस्टीम डेटा बॅकअप व रिस्टोअर (Full System Backup & Restore)
                    </h3>
                    <p className="text-xs text-purple-800 mt-1">
                      सध्याचा संपूर्ण डेटाबेस (सर्व उपकेंद्रे, गावे, पाणी स्त्रोत, सर्व नमुने, जावक पत्रे व ऑडिट लॉग) JSON फाइल स्वरूपात सुरक्षित डाऊनलोड करा किंवा पूर्वीचा बॅकअप रिस्टोअर करा.
                    </p>
                  </div>
                  <button
                    onClick={handleExportFullSystemBackup}
                    className="flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white px-5 py-2.5 rounded-lg font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>संपूर्ण बॅकअप डाऊनलोड करा (.JSON)</span>
                  </button>
                </div>
              </div>

              {/* Restore Section */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-purple-600" />
                      बॅकअप फाइलमधून डेटा रिस्टोअर करा (Restore from Backup File)
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      पूर्वी डाऊनलोड केलेली .json बॅकअप फाइल निवडा किंवा खालील बॉक्समध्ये कोड पेस्ट करा.
                    </span>
                  </div>

                  {/* Mode Toggle */}
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                    <button
                      onClick={() => setRestoreMode('MERGE')}
                      className={`px-3 py-1 rounded font-bold transition-all ${
                        restoreMode === 'MERGE' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      समाविष्ट करा (Merge Data)
                    </button>
                    <button
                      onClick={() => setRestoreMode('REPLACE')}
                      className={`px-3 py-1 rounded font-bold transition-all ${
                        restoreMode === 'REPLACE' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      पुनर्स्थित करा (Replace All)
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-700">बॅकअप JSON फाइल किंवा मजकूर:</span>
                  <label className="cursor-pointer bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-800 px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <UploadCloud className="w-3.5 h-3.5 text-purple-600" />
                    <span>.JSON फाइल निवडा</span>
                    <input type="file" accept=".json" onChange={(e) => handleFileUpload(e, true)} className="hidden" />
                  </label>
                </div>

                <textarea
                  value={restoreJsonText}
                  onChange={(e) => setRestoreJsonText(e.target.value)}
                  rows={6}
                  className="w-full font-mono text-xs p-3 bg-slate-900 text-purple-300 rounded-lg border border-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder='{"system": "PHC_BHADA_SAMPLE_MASTER", "data": { ... }}'
                />

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>सुरक्षितता: रिस्टोअर केलेल्या प्रत्येक क्रियेची नोंद ऑडिट लॉगमध्ये ठेवली जाते.</span>
                  </div>
                  <button
                    onClick={handleExecuteRestore}
                    disabled={isProcessing || !restoreJsonText.trim()}
                    className={`px-6 py-2.5 rounded-lg font-bold text-xs shadow-md transition-all flex items-center gap-2 ${
                      restoreMode === 'REPLACE'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-purple-700 hover:bg-purple-800 text-white'
                    } disabled:opacity-50`}
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>डेटा रिस्टोअर करा ({restoreMode === 'REPLACE' ? 'Replace' : 'Merge'})</span>
                  </button>
                </div>

                {restoreStatus && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{restoreStatus}</span>
                  </div>
                )}
              </div>

              {/* Danger Zone: Purge Dummy & Temporary Test Data */}
              <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-rose-200">
                  <div>
                    <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      सर्व तात्पुरते व डमी नमुने काढून टाका (Purge Dummy Samples & Letters)
                    </h4>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      चाचणीसाठी तयार केलेले सर्व जुने डमी नमुने (Samples) आणि जावक पत्रे सिस्टीममधून कायमस्वरूपी काढून टाकले जातील.
                    </p>
                  </div>
                  <button
                    onClick={handlePurgeAllDummyData}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition-all active:scale-95 whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>डमी नमुने डिलीट करा</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      सर्व डमी उपकेंद्रे, गावे व पाणी स्त्रोत काढून टाका (Purge Dummy Masters)
                    </h4>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      सिस्टीममधील सर्व उपकेंद्रे, गावे आणि पाणी स्त्रोत मास्टर नोंदी काढून टाकल्या जातील, जेणेकरून तुम्ही नवीन CSV द्वारे तुमचा खरा डेटा अपलोड करू शकता.
                    </p>
                  </div>
                  <button
                    onClick={handlePurgeAllMasters}
                    className="flex items-center gap-2 bg-rose-800 hover:bg-rose-900 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition-all active:scale-95 whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>सर्व मास्टर डेटा साफ करा</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
