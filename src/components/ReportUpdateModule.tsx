import React, { useState } from 'react';
import { clientStore } from '../services/clientStore';
import { SampleRecord, User, SampleTypeMaster } from '../types';
import {
  FileCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building,
  Save,
  FileText,
  Clock,
  Filter,
  Sparkles,
  Droplets,
  TestTube,
  Check,
  X,
  CheckSquare,
  Square,
  Layers,
  ListChecks,
} from 'lucide-react';

interface ReportUpdateModuleProps {
  currentUser: User;
  initialFilter?: {
    sampleTypeId?: string;
    villageId?: string;
    sampleId?: string;
    statusFilter?: string;
  };
  onNavigate?: (tab: string, filter?: Record<string, string>) => void;
  onBack?: () => void;
}

export const ReportUpdateModule: React.FC<ReportUpdateModuleProps> = ({
  currentUser,
  initialFilter,
  onNavigate,
  onBack,
}) => {
  const sampleTypes = clientStore.getSampleTypes();
  const villages = clientStore.getVillages();
  const existingLetters = clientStore.getSendingLetters();

  // Mode: SINGLE vs BATCH (1 Report Ref for Multiple Sources)
  const [entryMode, setEntryMode] = useState<'SINGLE' | 'BATCH'>('SINGLE');

  // Search & Filter State (including Sent Date based search)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeId, setSelectedTypeId] = useState<string>(initialFilter?.sampleTypeId || 'ALL');
  const [selectedVillageId, setSelectedVillageId] = useState<string>(initialFilter?.villageId || 'ALL');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter?.statusFilter || 'ALL');
  const [filterSentDate, setFilterSentDate] = useState<string>('');
  const [filterLetterNumber, setFilterLetterNumber] = useState<string>('ALL');

  // Currently Editing Sample (Single Mode)
  const [editingSample, setEditingSample] = useState<SampleRecord | null>(null);

  // Auto-select sample if provided in initialFilter
  React.useEffect(() => {
    if (initialFilter?.sampleId) {
      const allSamples = clientStore.getSamples();
      const target = allSamples.find((s) => s.id === initialFilter.sampleId);
      if (target) {
        setEditingSample(target);
        setReportReceivedDate(target.reportReceivedDate || new Date().toISOString().split('T')[0]);
        setReportNumber(target.reportNumber || '');
        setResult(target.result || '');
        setLaboratoryName(target.laboratoryName || 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर');
        setReportRemarks(target.reportRemarks || '');
      }
    }
    if (initialFilter?.sampleTypeId) {
      setSelectedTypeId(initialFilter.sampleTypeId);
    }
    if (initialFilter?.villageId) {
      setSelectedVillageId(initialFilter.villageId);
    }
    if (initialFilter?.statusFilter) {
      setStatusFilter(initialFilter.statusFilter);
    }
  }, [initialFilter]);

  // Form Fields for Lab Report Update (Single Mode)
  const [reportReceivedDate, setReportReceivedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reportNumber, setReportNumber] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [laboratoryName, setLaboratoryName] = useState<string>('');
  const [reportRemarks, setReportRemarks] = useState<string>('');

  // Batch Mode State (One Report Reference linked to Multiple Sample Records)
  const [selectedBatchSampleIds, setSelectedBatchSampleIds] = useState<string[]>([]);
  const [batchReportNumber, setBatchReportNumber] = useState<string>('');
  const [batchReceivedDate, setBatchReceivedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [batchLaboratoryName, setBatchLaboratoryName] = useState<string>(
    'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर'
  );
  const [batchCommonResult, setBatchCommonResult] = useState<string>('पिण्यास योग्य');
  const [batchCommonRemarks, setBatchCommonRemarks] = useState<string>('');
  const [individualOverrides, setIndividualOverrides] = useState<
    Record<string, { result?: string; reportRemarks?: string }>
  >({});

  // Quantitative parameters
  const [turbidity, setTurbidity] = useState<string>('');
  const [residualChlorine, setResidualChlorine] = useState<string>('');
  const [iodinePpm, setIodinePpm] = useState<string>('');
  const [tclChlorinePercent, setTclChlorinePercent] = useState<string>('');
  const [serologyTitre, setSerologyTitre] = useState<string>('');

  // Water Chemical Parameters (ST-002)
  const [pH, setPH] = useState<string>('');
  const [tds, setTds] = useState<string>('');
  const [totalHardness, setTotalHardness] = useState<string>('');
  const [fluoride, setFluoride] = useState<string>('');
  const [nitrate, setNitrate] = useState<string>('');
  const [chlorides, setChlorides] = useState<string>('');
  const [iron, setIron] = useState<string>('');

  // Serology Specifics (ST-005 Measles & ST-006 Dengue/Chikungunya)
  const [measlesIgmResult, setMeaslesIgmResult] = useState<string>('निगेटिव्ह');
  const [ns1Result, setNs1Result] = useState<string>('निगेटिव्ह');
  const [dengueIgmResult, setDengueIgmResult] = useState<string>('निगेटिव्ह');
  const [chikungunyaIgmResult, setChikungunyaIgmResult] = useState<string>('निगेटिव्ह');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sent Date based and multi-attribute search
  const samples = clientStore.getSamples({
    sampleTypeId: selectedTypeId,
    villageId: selectedVillageId,
    status: statusFilter,
    searchQuery: searchQuery,
    sendingDate: filterSentDate || undefined,
    sendingLetterNumber: filterLetterNumber !== 'ALL' ? filterLetterNumber : undefined,
  });

  const handleSelectSample = (sample: SampleRecord) => {
    setEditingSample(sample);
    setReportReceivedDate(sample.reportReceivedDate || new Date().toISOString().split('T')[0]);
    setReportNumber(sample.reportNumber || '');
    setResult(sample.result || '');
    setLaboratoryName(sample.laboratoryName || 'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर');
    setReportRemarks(sample.reportRemarks || '');

    // Fill quantitative if present
    const q = sample.resultQuantitative || {};
    setTurbidity(q.turbidity !== undefined ? String(q.turbidity) : '');
    setResidualChlorine(q.residualChlorine !== undefined ? String(q.residualChlorine) : '');
    setIodinePpm(q.iodinePpm !== undefined ? String(q.iodinePpm) : '');
    setTclChlorinePercent(q.availableChlorinePercent !== undefined ? String(q.availableChlorinePercent) : '');
    setSerologyTitre(q.serologyTitre !== undefined ? String(q.serologyTitre) : '');

    // Water Chemical
    setPH(q.pH !== undefined ? String(q.pH) : '');
    setTds(q.tds !== undefined ? String(q.tds) : '');
    setTotalHardness(q.totalHardness !== undefined ? String(q.totalHardness) : '');
    setFluoride(q.fluoride !== undefined ? String(q.fluoride) : '');
    setNitrate(q.nitrate !== undefined ? String(q.nitrate) : '');
    setChlorides(q.chlorides !== undefined ? String(q.chlorides) : '');
    setIron(q.iron !== undefined ? String(q.iron) : '');

    // Serology
    setMeaslesIgmResult(q.measlesIgmResult ? String(q.measlesIgmResult) : sample.result || 'निगेटिव्ह');
    setNs1Result(q.ns1Result ? String(q.ns1Result) : 'निगेटिव्ह');
    setDengueIgmResult(q.dengueIgmResult ? String(q.dengueIgmResult) : 'निगेटिव्ह');
    setChikungunyaIgmResult(q.chikungunyaIgmResult ? String(q.chikungunyaIgmResult) : 'निगेटिव्ह');
  };

  const handleSaveReport = () => {
    if (!editingSample || isSubmitting) return;

    if (!reportReceivedDate) {
      setNotification({ type: 'error', message: 'कृपया अहवाल प्राप्त दिनांक भरा.' });
      return;
    }

    if (!result) {
      setNotification({ type: 'error', message: 'कृपया प्रयोगशाळा तपासणी निकाल (Result) निवडा.' });
      return;
    }

    // Validation for pH (0 - 14)
    if (pH !== '') {
      const phNum = Number(pH);
      if (isNaN(phNum) || phNum < 0 || phNum > 14) {
        setNotification({ type: 'error', message: 'pH चे मूल्य ० ते १४ दरम्यान असणे अनिवार्य आहे.' });
        return;
      }
    }

    // Validation for numeric concentrations (cannot be negative)
    const numericFields = [
      { name: 'TDS', val: tds },
      { name: 'Total Hardness', val: totalHardness },
      { name: 'Fluoride', val: fluoride },
      { name: 'Nitrate', val: nitrate },
      { name: 'Chlorides', val: chlorides },
      { name: 'Iron', val: iron },
      { name: 'गढूळपणा (Turbidity)', val: turbidity },
      { name: 'अवशिष्ट क्लोरीन', val: residualChlorine },
      { name: 'आयोडीन (PPM)', val: iodinePpm },
      { name: 'उपलब्ध क्लोरीन %', val: tclChlorinePercent },
    ];

    for (const item of numericFields) {
      if (item.val !== '') {
        const n = Number(item.val);
        if (isNaN(n) || n < 0) {
          setNotification({ type: 'error', message: `${item.name} चे मूल्य वैध व ऋण नसलेली संख्या असणे आवश्यक आहे.` });
          return;
        }
      }
    }

    setIsSubmitting(true);

    const quantitative: Record<string, string | number> = {};
    if (turbidity) quantitative.turbidity = Number(turbidity) || turbidity;
    if (residualChlorine) quantitative.residualChlorine = Number(residualChlorine) || residualChlorine;
    if (iodinePpm) quantitative.iodinePpm = Number(iodinePpm) || iodinePpm;
    if (tclChlorinePercent) quantitative.availableChlorinePercent = Number(tclChlorinePercent) || tclChlorinePercent;
    if (serologyTitre) quantitative.serologyTitre = serologyTitre;

    // Water Chemical parameters
    if (pH !== '') quantitative.pH = Number(pH);
    if (tds !== '') quantitative.tds = Number(tds);
    if (totalHardness !== '') quantitative.totalHardness = Number(totalHardness);
    if (fluoride !== '') quantitative.fluoride = Number(fluoride);
    if (nitrate !== '') quantitative.nitrate = Number(nitrate);
    if (chlorides !== '') quantitative.chlorides = Number(chlorides);
    if (iron !== '') quantitative.iron = Number(iron);

    // Serology parameters
    if (editingSample.sampleTypeId === 'ST-005') {
      quantitative.measlesIgmResult = measlesIgmResult;
    }
    if (editingSample.sampleTypeId === 'ST-006') {
      quantitative.ns1Result = ns1Result;
      quantitative.dengueIgmResult = dengueIgmResult;
      quantitative.chikungunyaIgmResult = chikungunyaIgmResult;
    }

    const updated = clientStore.updateSample(editingSample.id, {
      reportReceivedDate,
      reportUpdateDate: new Date().toISOString().split('T')[0],
      reportNumber: reportNumber || `REP-${Math.floor(Math.random() * 9000 + 1000)}`,
      result,
      laboratoryName,
      reportRemarks,
      resultQuantitative: quantitative,
      status: 'Report Received',
    });

    setIsSubmitting(false);

    if (updated) {
      setNotification({
        type: 'success',
        message: `नमुना ${editingSample.id} चा प्रयोगशाळा अहवाल यशस्वीरित्या अद्ययावत केला गेला!`,
      });
      setEditingSample(null);
    } else {
      setNotification({ type: 'error', message: 'अहवाल जतन करताना त्रुटी आली.' });
    }
  };

  const handleSaveBatchReport = () => {
    if (selectedBatchSampleIds.length === 0 || isSubmitting) return;

    if (!batchReportNumber.trim()) {
      setNotification({ type: 'error', message: 'कृपया प्रयोगशाळा अहवाल संदर्भ क्रमांक (Report Reference Number) भरा.' });
      return;
    }

    if (!batchReceivedDate) {
      setNotification({ type: 'error', message: 'कृपया अहवाल प्राप्त दिनांक भरा.' });
      return;
    }

    if (!batchCommonResult) {
      setNotification({ type: 'error', message: 'कृपया प्रयोगशाळा तपासणी निकाल (Common Result) निवडा.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedList = clientStore.updateBatchSampleReports(
        selectedBatchSampleIds,
        {
          reportNumber: batchReportNumber.trim(),
          reportReceivedDate: batchReceivedDate,
          laboratoryName: batchLaboratoryName.trim(),
          result: batchCommonResult,
          reportRemarks: batchCommonRemarks.trim(),
        },
        individualOverrides
      );

      setIsSubmitting(false);

      if (updatedList.length > 0) {
        setNotification({
          type: 'success',
          message: `यशस्वी! संदर्भ क्र. ${batchReportNumber} अंतर्गत एकूण ${updatedList.length} नमुन्यांचा अहवाल अद्ययावत झाला!`,
        });
        setSelectedBatchSampleIds([]);
        setIndividualOverrides({});
      } else {
        setNotification({ type: 'error', message: 'अहवाल जतन करताना त्रुटी आली.' });
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setNotification({ type: 'error', message: err?.message || 'अहवाल जतन करताना त्रुटी आली.' });
    }
  };

  const toggleSelectAllBatch = () => {
    if (selectedBatchSampleIds.length === samples.length && samples.length > 0) {
      setSelectedBatchSampleIds([]);
    } else {
      setSelectedBatchSampleIds(samples.map((s) => s.id));
    }
  };

  const toggleSampleBatchSelection = (id: string) => {
    setSelectedBatchSampleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getResultOptions = (sample?: SampleRecord | null): string[] => {
    if (!sample) {
      return ['पिण्यास योग्य', 'पिण्यास अयोग्य', 'प्रमाणित', 'अप्रमाणित', 'पॉझिटिव्ह', 'निगेटिव्ह'];
    }
    const st = sampleTypes.find((t) => t.id === sample.sampleTypeId);
    return st?.resultOptions || ['पिण्यास योग्य', 'पिण्यास अयोग्य', 'प्रमाणित', 'अप्रमाणित', 'पॉझिटिव्ह', 'निगेटिव्ह'];
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header & Mode Switch */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-700" />
              प्रयोगशाळा अहवाल नोंदणी मॉड्यूल (Lab Report Update)
            </h2>
            <p className="text-xs text-slate-500">
              प्राप्त प्रयोगशाळा अहवाल दिनांक, संदर्भ क्रमांक, तपासणी निकाल व गुणवत्ता शेरा नोंदवा
            </p>
          </div>

          {/* Mode Switch: Single vs Batch */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setEntryMode('SINGLE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                entryMode === 'SINGLE'
                  ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>एकल नमुना (Single)</span>
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('BATCH')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                entryMode === 'BATCH'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>एकत्रित अहवाल (Batch Entry - 1 Ref No.)</span>
            </button>
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between animate-in fade-in border-l-4 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-600'
              : 'bg-rose-50 text-rose-900 border-rose-600'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span className="font-bold">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="font-bold text-sm">
            ✕
          </button>
        </div>
      )}

      {/* Multi-Criteria Filter Bar with Sent Date Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-4 h-4 text-emerald-700" />
            <span>शोध व गाळणी (Search & Filters)</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-500">
            उपलब्ध नमुने: <span className="font-bold text-emerald-800">{samples.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {/* Global Search */}
          <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              शोध (ID / गाव / रुग्ण / स्त्रोत):
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="नमुना क्र., रुग्ण, जावक क्र..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Sample Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">नमुना प्रकार:</label>
            <select
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="ALL">सर्व नमुना प्रकार (All Types)</option>
              {sampleTypes.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.marathiName}
                </option>
              ))}
            </select>
          </div>

          {/* Village Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">गाव:</label>
            <select
              value={selectedVillageId}
              onChange={(e) => setSelectedVillageId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="ALL">सर्व गावे (All Villages)</option>
              {villages.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sent Date Filter (User Requirement: Search/filter report updates based on sent date) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-700">
                पाठवलेला दिनांक (Sent Date):
              </label>
              {filterSentDate && (
                <button
                  type="button"
                  onClick={() => setFilterSentDate('')}
                  className="text-[10px] text-rose-600 hover:underline font-semibold"
                >
                  काढा ✕
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="date"
                value={filterSentDate}
                onChange={(e) => setFilterSentDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">अहवाल स्थिती:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="ALL">सर्व स्थिती (All Status)</option>
              <option value="Pending">प्रलंबित निकाल (Pending Lab Results - सर्व)</option>
              <option value="Dispatched">Dispatched (पाठविलेले)</option>
              <option value="Report Pending">Report Pending (प्रलंबित)</option>
              <option value="Report Received">Report Received (प्राप्त)</option>
              <option value="Collected">Collected (संकलित)</option>
            </select>
          </div>
        </div>

        {/* Optional Filter by Outward Sending Letter Number */}
        {existingLetters.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600">जावक पत्र क्र. नुसार गाळा:</span>
            <select
              value={filterLetterNumber}
              onChange={(e) => setFilterLetterNumber(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-mono font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none max-w-md"
            >
              <option value="ALL">सर्व जावक पत्रे (All Letters)</option>
              {existingLetters.map((l) => (
                <option key={l.id} value={l.letterNumber}>
                  {l.letterNumber} ({l.letterDate || l.dispatchDate} • {l.sampleCount || 0} नमुने)
                </option>
              ))}
            </select>
            {filterLetterNumber !== 'ALL' && (
              <button
                type="button"
                onClick={() => setFilterLetterNumber('ALL')}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                पत्र फिल्टर काढा ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sample Select List */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {entryMode === 'BATCH' && (
                <button
                  type="button"
                  onClick={toggleSelectAllBatch}
                  className="p-0.5 hover:bg-slate-100 rounded text-emerald-800"
                  title="सर्व निवडा / निवड रद्द करा"
                >
                  {selectedBatchSampleIds.length === samples.length && samples.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              )}
              <span>
                {entryMode === 'BATCH'
                  ? `एकत्रित नोंदणीसाठी नमुने निवडा (${selectedBatchSampleIds.length} निवडले):`
                  : 'अहवाल अद्ययावत करण्यासाठी नमुना निवडा:'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">({samples.length} नमुने)</span>
          </div>

          <div className="max-h-[560px] overflow-y-auto divide-y divide-slate-100 space-y-1 pr-1">
            {samples.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                शोध व पाठवलेल्या दिनांक निकषानुसार कोणतेही नमुने आढळले नाहीत.
              </div>
            ) : (
              samples.map((sample) => {
                const isSingleSelected = editingSample?.id === sample.id;
                const isBatchSelected = selectedBatchSampleIds.includes(sample.id);
                const hasReport = Boolean(sample.reportReceivedDate && sample.result);

                return (
                  <div
                    key={sample.id}
                    onClick={() => {
                      if (entryMode === 'BATCH') {
                        toggleSampleBatchSelection(sample.id);
                      } else {
                        handleSelectSample(sample);
                      }
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-all border ${
                      entryMode === 'BATCH'
                        ? isBatchSelected
                          ? 'bg-emerald-50/80 border-emerald-600 shadow-sm'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                        : isSingleSelected
                        ? 'bg-emerald-50 border-emerald-600 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        {entryMode === 'BATCH' && (
                          <div className="mt-0.5">
                            {isBatchSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-700" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900">{sample.id}</span>
                            {sample.bottleNumber && (
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1 rounded border border-slate-200">
                                बाटली क्र. {sample.bottleNumber}
                              </span>
                            )}
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                hasReport
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {hasReport ? 'अहवाल प्राप्त' : 'अहवाल प्रलंबित'}
                            </span>
                          </div>
                          <div className="font-semibold text-xs text-slate-800 mt-1">
                            {sample.villageName} — {sample.sourceName || sample.patientName || sample.shopOrInstitutionName}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span>संकलन: {sample.collectionDate}</span>
                            {sample.sendingDate && (
                              <span className="font-semibold text-indigo-900 bg-indigo-50 px-1 rounded">
                                पाठवले: {sample.sendingDate}
                              </span>
                            )}
                            {sample.sendingLetterNumber && (
                              <span className="font-mono text-emerald-800 truncate max-w-[150px]">
                                • {sample.sendingLetterNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        {sample.result ? (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              sample.result.includes('योग्य') || sample.result.includes('प्रमाणित') || sample.result === 'निगेटिव्ह'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sample.result}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            नोंद करा →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Lab Report Update Form (Single or Batch) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          {entryMode === 'BATCH' ? (
            /* BATCH REPORT UPDATE FORM */
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    <span>एकत्रित प्रयोगशाळा अहवाल नोंदवा (Batch Report Entry)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    एकाच अहवाल संदर्भ क्रमांकाने (1 Report Ref No.) अनेक स्त्रोतांचे अहवाल एकाच वेळी नोंदवा
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 self-start sm:self-auto">
                  {selectedBatchSampleIds.length} नमुने निवडले
                </span>
              </div>

              {selectedBatchSampleIds.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <Layers className="w-12 h-12 mx-auto text-slate-300" />
                  <div className="font-bold text-sm text-slate-700">
                    कोणतेही नमुने निवडलेले नाहीत
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    डाव्या बाजूच्या यादीतून एकाच प्रयोगशाळा अहवालाशी संलग्न असलेले १ किंवा अधिक नमुने निवडा
                    (उदा. एकाच जावक पत्राने तपासणीसाठी पाठवलेले विविध पाण्याचे स्त्रोत).
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  {/* Common Lab Report Fields */}
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-3">
                    <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>सामाईक प्रयोगशाळा अहवाल माहिती (Common Lab Report Details):</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          अहवाल प्राप्त दिनांक (Report Received Date)*:
                        </label>
                        <input
                          type="date"
                          value={batchReceivedDate}
                          onChange={(e) => setBatchReceivedDate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          प्रयोगशाळा अहवाल संदर्भ क्र. (Lab Ref / Outward No.)*:
                        </label>
                        <input
                          type="text"
                          placeholder="उदा. DPHL/LTR/2026/894"
                          value={batchReportNumber}
                          onChange={(e) => setBatchReportNumber(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          तपासणी प्रयोगशाळा (Laboratory Name)*:
                        </label>
                        <input
                          type="text"
                          value={batchLaboratoryName}
                          onChange={(e) => setBatchLaboratoryName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          सामाईक निकाल (Common Result for All Selected)*:
                        </label>
                        <select
                          value={batchCommonResult}
                          onChange={(e) => setBatchCommonResult(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        >
                          <option value="पिण्यास योग्य">पिण्यास योग्य (Potable / Fit)</option>
                          <option value="पिण्यास अयोग्य">पिण्यास अयोग्य (Non-Potable / Unfit)</option>
                          <option value="प्रमाणित">प्रमाणित (Standard)</option>
                          <option value="अप्रमाणित">अप्रमाणित (Sub-standard)</option>
                          <option value="निगेटिव्ह">निगेटिव्ह (Negative)</option>
                          <option value="पॉझिटिव्ह">पॉझिटिव्ह (Positive)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        सामाईक शेरा / सल्ला (Common Remarks):
                      </label>
                      <input
                        type="text"
                        placeholder="उदा. नमुने पिण्यास योग्य आहेत / सर्व स्त्रोत शुद्ध आढळले."
                        value={batchCommonRemarks}
                        onChange={(e) => setBatchCommonRemarks(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Table of Selected Samples with Per-Source Override Capability */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 text-xs">
                        निवडलेले नमुने व वैयक्तिक निकाल तपशील ({selectedBatchSampleIds.length}):
                      </label>
                      <span className="text-[11px] text-slate-500">
                        (एखाद्या स्त्रोताचा निकाल वेगळा असल्यास खाली बदलता येतो)
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] sticky top-0 z-10">
                          <tr>
                            <th className="p-2 border-b border-slate-200">क्र. / आयडी</th>
                            <th className="p-2 border-b border-slate-200">गाव व स्त्रोत</th>
                            <th className="p-2 border-b border-slate-200">पाठवले</th>
                            <th className="p-2 border-b border-slate-200">निकालाचा शेरा</th>
                            <th className="p-2 border-b border-slate-200 text-center">काढा</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedBatchSampleIds.map((sampleId) => {
                            const sample = samples.find((s) => s.id === sampleId);
                            if (!sample) return null;

                            const override = individualOverrides[sampleId];
                            const currentResult = override?.result ?? batchCommonResult;

                            return (
                              <tr key={sample.id} className="hover:bg-slate-50">
                                <td className="p-2 font-mono font-bold text-slate-900 whitespace-nowrap">
                                  {sample.id}
                                  {sample.bottleNumber && (
                                    <div className="text-[10px] text-slate-500 font-normal">
                                      बाटली: {sample.bottleNumber}
                                    </div>
                                  )}
                                </td>
                                <td className="p-2 text-slate-800">
                                  <div className="font-semibold">{sample.villageName}</div>
                                  <div className="text-[11px] text-slate-600 truncate max-w-[180px]">
                                    {sample.sourceName || sample.patientName || sample.shopOrInstitutionName}
                                  </div>
                                </td>
                                <td className="p-2 text-slate-500 text-[11px] whitespace-nowrap">
                                  {sample.sendingDate || sample.collectionDate}
                                  {sample.sendingLetterNumber && (
                                    <div className="font-mono text-[9px] text-emerald-800 truncate max-w-[110px]">
                                      {sample.sendingLetterNumber}
                                    </div>
                                  )}
                                </td>
                                <td className="p-2">
                                  <select
                                    value={currentResult}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setIndividualOverrides((prev) => ({
                                        ...prev,
                                        [sample.id]: {
                                          ...prev[sample.id],
                                          result: val,
                                        },
                                      }));
                                    }}
                                    className={`w-full text-xs font-bold rounded px-1.5 py-1 border ${
                                      currentResult.includes('अयोग्य') || currentResult.includes('अप्रमाणित')
                                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                                        : 'bg-white border-slate-300 text-slate-800'
                                    }`}
                                  >
                                    {getResultOptions(sample).map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => toggleSampleBatchSelection(sample.id)}
                                    className="text-rose-500 hover:text-rose-700 p-1"
                                    title="यादीतून काढा"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBatchSampleIds([]);
                        setIndividualOverrides({});
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      निवड साफ करा (Clear)
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting || selectedBatchSampleIds.length === 0}
                      onClick={handleSaveBatchReport}
                      className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-bold text-xs shadow transition-all active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      <span>
                        {isSubmitting
                          ? 'जतन करत आहे...'
                          : `सर्व ${selectedBatchSampleIds.length} नमुन्यांचा अहवाल जतन करा (Save Batch)`}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* SINGLE REPORT UPDATE FORM */
            <div>
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-700" />
                  <span>एकल प्रयोगशाळा अहवाल तपशील नोंदवा</span>
                </div>
                {editingSample && (
                  <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {editingSample.id}
                  </span>
                )}
              </div>

              {!editingSample ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <FileText className="w-10 h-10 mx-auto text-slate-300" />
                  <div className="font-semibold text-xs text-slate-600">
                    डाव्या बाजूच्या यादीतून अहवाल अद्ययावत करण्यासाठी नमुना निवडा.
                  </div>
                </div>
              ) : (
            <div className="space-y-4 text-xs">
              {/* Sample Meta Overview */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 font-medium">गाव:</span>{' '}
                  <span className="font-bold text-slate-800">{editingSample.villageName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">संकलन दिनांक:</span>{' '}
                  <span className="font-bold text-slate-800">{editingSample.collectionDate}</span>
                </div>
                <div className="col-span-2 truncate">
                  <span className="text-slate-500 font-medium">स्त्रोत/रुग्ण:</span>{' '}
                  <span className="font-bold text-slate-800">
                    {editingSample.sourceName || editingSample.patientName || editingSample.shopOrInstitutionName}
                  </span>
                </div>
                {editingSample.sendingLetterNumber && (
                  <div className="col-span-2">
                    <span className="text-slate-500 font-medium">जावक पत्र क्र:</span>{' '}
                    <span className="font-mono font-bold text-emerald-900">{editingSample.sendingLetterNumber}</span>
                  </div>
                )}
              </div>

              {/* Report Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    अहवाल प्राप्त दिनांक (Report Received Date)*:
                  </label>
                  <input
                    type="date"
                    value={reportReceivedDate}
                    onChange={(e) => setReportReceivedDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    प्रयोगशाळा अहवाल क्र. (Lab Ref / Outward No)*:
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. DPHL/LTR/2026/894"
                    value={reportNumber}
                    onChange={(e) => setReportNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Lab Name */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  तपासणी प्रयोगशाळा (Laboratory Name)*:
                </label>
                <input
                  type="text"
                  value={laboratoryName}
                  onChange={(e) => setLaboratoryName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              {/* Result Selector */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  प्रयोगशाळा निकाल (Lab Examination Result)*:
                </label>
                <select
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="">-- निकाल निवडा (Select Result) --</option>
                  {getResultOptions(editingSample).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantitative Parameters */}
              <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-200 space-y-2.5">
                <div className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>संख्यात्मक रासायनिक / जैविक चाचणी मूल्ये (Quantitative Values):</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Water Parameters */}
                  {editingSample.sampleTypeId === 'ST-001' && (
                    <>
                      <div>
                        <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                          अवशिष्ट क्लोरीन (Residual Chlorine - PPM):
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="उदा. 0.5"
                          value={residualChlorine}
                          onChange={(e) => setResidualChlorine(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                          गढूळपणा (Turbidity - NTU):
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="उदा. 1.2"
                          value={turbidity}
                          onChange={(e) => setTurbidity(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                      </div>
                    </>
                  )}

                  {/* Water Chemical Parameters */}
                  {editingSample.sampleTypeId === 'ST-002' && (
                    <>
                      <div>
                        <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                          सामू (pH Value: 6.5 - 8.5):
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="14"
                          placeholder="उदा. 7.4"
                          value={pH}
                          onChange={(e) => setPH(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                          एकूण विरघळलेले घटक (TDS - mg/L):
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="उदा. 450"
                          value={tds}
                          onChange={(e) => setTds(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                          एकूण कठीणता (Total Hardness - mg/L):
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="उदा. 220"
                          value={totalHardness}
                          onChange={(e) => setTotalHardness(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                          फ्लोराईड (Fluoride - mg/L):
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="उदा. 0.8"
                          value={fluoride}
                          onChange={(e) => setFluoride(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                          नायट्रेट (Nitrate - mg/L):
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="उदा. 25"
                          value={nitrate}
                          onChange={(e) => setNitrate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                          क्लोराईड्स (Chlorides - mg/L):
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="उदा. 150"
                          value={chlorides}
                          onChange={(e) => setChlorides(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                          लोह (Iron - mg/L):
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="उदा. 0.15"
                          value={iron}
                          onChange={(e) => setIron(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                      </div>
                    </>
                  )}

                  {/* Measles Serology Parameters */}
                  {editingSample.sampleTypeId === 'ST-005' && (
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                        गोवर सीरम चाचणी निकाल (Measles IgM ELISA Result):
                      </label>
                      <select
                        value={measlesIgmResult}
                        onChange={(e) => setMeaslesIgmResult(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                      >
                        <option value="निगेटिव्ह">निगेटिव्ह (Negative)</option>
                        <option value="पॉझिटिव्ह">पॉझिटिव्ह (Positive)</option>
                        <option value="इक्वीव्होकल">इक्वीव्होकल (Equivocal)</option>
                      </select>
                    </div>
                  )}

                  {/* Dengue & Chikungunya Serology Parameters */}
                  {editingSample.sampleTypeId === 'ST-006' && (
                    <>
                      <div>
                        <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                          डेंग्यू NS1 Antigen चाचणी:
                        </label>
                        <select
                          value={ns1Result}
                          onChange={(e) => setNs1Result(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                        >
                          <option value="निगेटिव्ह">निगेटिव्ह</option>
                          <option value="पॉझिटिव्ह">पॉझिटिव्ह</option>
                          <option value="चाचणी केली नाही">चाचणी केली नाही</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                          डेंग्यू IgM ELISA चाचणी:
                        </label>
                        <select
                          value={dengueIgmResult}
                          onChange={(e) => setDengueIgmResult(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                        >
                          <option value="निगेटिव्ह">निगेटिव्ह</option>
                          <option value="पॉझिटिव्ह">पॉझिटिव्ह</option>
                          <option value="चाचणी केली नाही">चाचणी केली नाही</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                          चिकनगुनिया IgM ELISA चाचणी:
                        </label>
                        <select
                          value={chikungunyaIgmResult}
                          onChange={(e) => setChikungunyaIgmResult(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                        >
                          <option value="निगेटिव्ह">निगेटिव्ह</option>
                          <option value="पॉझिटिव्ह">पॉझिटिव्ह</option>
                          <option value="चाचणी केली नाही">चाचणी केली नाही</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Salt Parameters */}
                  {editingSample.sampleTypeId === 'ST-003' && (
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                        आयोडीन प्रमाण (Iodine Concentration - PPM):
                      </label>
                      <input
                        type="number"
                        placeholder="उदा. 28"
                        value={iodinePpm}
                        onChange={(e) => setIodinePpm(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                      />
                    </div>
                  )}

                  {/* TCL Parameters */}
                  {editingSample.sampleTypeId === 'ST-004' && (
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                        उपलब्ध क्लोरीन टक्केवारी (Available Chlorine %):
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="उदा. 34.2"
                        value={tclChlorinePercent}
                        onChange={(e) => setTclChlorinePercent(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  प्रयोगशाळा शेरा / सल्ला (Lab Remarks / Recommendation):
                </label>
                <textarea
                  rows={2}
                  placeholder="उदा. नमुना पिण्यास योग्य आहे / विहिरीमध्ये टीसीएल पावडर टाकून ब्लिचिंग करावे."
                  value={reportRemarks}
                  onChange={(e) => setReportRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSample(null)}
                  className="px-3.5 py-2 rounded-lg font-semibold text-slate-600 hover:bg-slate-100"
                >
                  रद्द करा
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveReport}
                  className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-bold shadow transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'जतन करत आहे...' : 'अहवाल जतन करा (Save Report)'}</span>
                </button>
              </div>
            </div>
          )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
