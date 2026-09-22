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
} from 'lucide-react';

interface ReportUpdateModuleProps {
  currentUser: User;
}

export const ReportUpdateModule: React.FC<ReportUpdateModuleProps> = ({ currentUser }) => {
  const sampleTypes = clientStore.getSampleTypes();
  const villages = clientStore.getVillages();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeId, setSelectedTypeId] = useState<string>('ALL');
  const [selectedVillageId, setSelectedVillageId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Currently Editing Sample
  const [editingSample, setEditingSample] = useState<SampleRecord | null>(null);

  // Form Fields for Lab Report Update
  const [reportReceivedDate, setReportReceivedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reportNumber, setReportNumber] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [laboratoryName, setLaboratoryName] = useState<string>('');
  const [reportRemarks, setReportRemarks] = useState<string>('');

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

  const samples = clientStore.getSamples({
    sampleTypeId: selectedTypeId,
    villageId: selectedVillageId,
    status: statusFilter,
    searchQuery: searchQuery,
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

  const getResultOptions = (sample: SampleRecord): string[] => {
    const st = sampleTypes.find((t) => t.id === sample.sampleTypeId);
    return st?.resultOptions || ['पिण्यास योग्य', 'पिण्यास अयोग्य', 'प्रमाणित', 'अप्रमाणित', 'पॉझिटिव्ह', 'निगेटिव्ह'];
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-700" />
              प्रयोगशाळा अहवाल नोंदणी मॉड्यूल (Lab Report Update)
            </h2>
            <p className="text-xs text-slate-500">
              प्राप्त प्रयोगशाळा अहवाल दिनांक, संदर्भ क्रमांक, तपासणी निकाल व गुणवत्ता शेरा नोंदवा
            </p>
          </div>
          <div className="text-xs font-semibold bg-emerald-50 text-emerald-900 px-3 py-1 rounded-lg border border-emerald-200">
            एकूण नमुने: {samples.length}
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

      {/* Multi-Criteria Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Global Search */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              शोध (Search ID/गाव/रुग्ण/पत्र क्र.):
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

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">अहवाल स्थिती:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="ALL">सर्व स्थिती (All Status)</option>
              <option value="Collected">Collected (संकलित)</option>
              <option value="Dispatched">Dispatched (पाठविलेले)</option>
              <option value="Report Pending">Report Pending (प्रलंबित)</option>
              <option value="Report Received">Report Received (प्राप्त)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sample Select List */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>अहवाल अद्ययावत करण्यासाठी नमुना निवडा:</span>
            <span className="text-[11px] text-slate-500 font-mono">({samples.length} नमुने)</span>
          </div>

          <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 space-y-1">
            {samples.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                शोध निकषानुसार कोणतेही नमुने आढळले नाहीत.
              </div>
            ) : (
              samples.map((sample) => {
                const isSelected = editingSample?.id === sample.id;
                const hasReport = Boolean(sample.reportReceivedDate && sample.result);
                return (
                  <div
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className={`p-3 rounded-lg cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">{sample.id}</span>
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
                          {sample.sendingDate && <span>• पाठवले: {sample.sendingDate}</span>}
                          {sample.sendingLetterNumber && (
                            <span className="font-mono text-emerald-800 truncate max-w-[150px]">
                              • {sample.sendingLetterNumber}
                            </span>
                          )}
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

        {/* Lab Report Update Form */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              <span>प्रयोगशाळा अहवाल तपशील नोंदवा</span>
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
      </div>
    </div>
  );
};
