import React, { useState, useMemo } from 'react';
import { clientStore } from '../services/clientStore';
import { SampleRecord, SendingLetter, User } from '../types';
import {
  FileText,
  Printer,
  CheckCircle2,
  Calendar,
  Building2,
  CheckSquare,
  Square,
  AlertCircle,
  Eye,
  Send,
  UserCheck,
  Edit3,
  X,
  Save,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';

interface DengueDocumentationModuleProps {
  currentUser: User;
  onNavigateToRegister?: () => void;
}

export const DengueDocumentationModule: React.FC<DengueDocumentationModuleProps> = ({
  currentUser,
  onNavigateToRegister,
}) => {
  // All samples of type ST-006 (Dengue / Chikungunya)
  const allDengueSamples = clientStore.getSamples({ sampleTypeId: 'ST-006' });
  const villages = clientStore.getVillages();

  // Selected sample IDs for document generation
  const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>(() => {
    // By default, select pending samples (Draft, Collected, or Ready for Dispatch)
    return allDengueSamples
      .filter((s) => s.status !== 'Report Received')
      .slice(0, 5)
      .map((s) => s.id);
  });

  // Filter state for selection
  const [filterVillage, setFilterVillage] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');

  // Generation Mode: 'BOTH' | 'FORWARDING_LETTER' | 'CASE_HISTORY'
  const [viewMode, setViewMode] = useState<'BOTH' | 'FORWARDING_LETTER' | 'CASE_HISTORY'>('BOTH');

  // Forwarding Letter Form Controls
  const currentYear = new Date().getFullYear();
  const [letterNumber, setLetterNumber] = useState<string>(() => {
    const existingCount = clientStore.getSendingLetters().filter((l) => l.sampleTypeId === 'ST-006').length + 1;
    return `प्राआकें/भादा/डेंगी-नमुने/${String(existingCount).padStart(2, '0')}/${currentYear}`;
  });
  const [letterDate, setLetterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dispatchStatus, setDispatchStatus] = useState<'Draft' | 'Generated' | 'Dispatched' | 'Report Received'>('Generated');
  const [doctorName, setDoctorName] = useState<string>('Dr. Patil S.S.');
  const [doctorMobile, setDoctorMobile] = useState<string>('9689686901');

  // Success / Error Feedback
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Quick Edit Sample Modal for missing clinical details
  const [editingSample, setEditingSample] = useState<SampleRecord | null>(null);

  // Filtered samples for selection list
  const selectableSamples = useMemo(() => {
    return allDengueSamples.filter((sample) => {
      const matchVillage = filterVillage === 'ALL' || sample.villageId === filterVillage;
      let matchStatus = true;
      if (filterStatus === 'PENDING') {
        matchStatus = sample.status === 'Draft' || sample.status === 'Collected' || sample.status === 'Ready for Dispatch';
      } else if (filterStatus === 'DISPATCHED') {
        matchStatus = sample.status === 'Dispatched';
      } else if (filterStatus === 'REPORT_RECEIVED') {
        matchStatus = sample.status === 'Report Received';
      }
      return matchVillage && matchStatus;
    });
  }, [allDengueSamples, filterVillage, filterStatus]);

  // Selected sample objects in exact order
  const selectedSamples = useMemo(() => {
    return selectedSampleIds
      .map((id) => allDengueSamples.find((s) => s.id === id))
      .filter((s): s is SampleRecord => s !== undefined);
  }, [selectedSampleIds, allDengueSamples]);

  // Validation logic (Part 8)
  const validationResults = useMemo(() => {
    const issues: { sampleId: string; patientName: string; missingFields: string[] }[] = [];
    selectedSamples.forEach((sample) => {
      const missing: string[] = [];
      if (!sample.patientName || sample.patientName.trim() === '') missing.push('रुग्णाचे नाव (Patient Name)');
      if (!sample.villageName || sample.villageName.trim() === '') missing.push('गाव (Village)');
      if (!sample.age || isNaN(Number(sample.age))) missing.push('वय (Age)');
      if (!sample.sex) missing.push('लिंग (Sex)');
      if (!sample.collectionDate) missing.push('नमुना संकलन दिनांक (Collection Date)');
      if (missing.length > 0) {
        issues.push({
          sampleId: sample.id,
          patientName: sample.patientName || sample.id,
          missingFields: missing,
        });
      }
    });
    return issues;
  }, [selectedSamples]);

  const handleToggleSample = (id: string) => {
    setSelectedSampleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedSampleIds.length === selectableSamples.length) {
      setSelectedSampleIds([]);
    } else {
      setSelectedSampleIds(selectableSamples.map((s) => s.id));
    }
  };

  // Helper date format: DD-MM-YYYY
  const formatDateDMY = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const [y, m, d] = dateStr.split('-');
      if (y && m && d) return `${d}-${m}-${y}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Dispatch / Save Letter Action
  const handleSaveAndDispatch = (statusToSet: 'Generated' | 'Dispatched') => {
    if (selectedSamples.length === 0) {
      setNotification({
        type: 'error',
        message: 'कृपया पत्रात जोडण्यासाठी किमान एक डेंग्यू/चिकनगुनिया नमुना निवडा.',
      });
      return;
    }

    if (validationResults.length > 0) {
      setNotification({
        type: 'error',
        message: `काही नमुन्यांमध्ये आवश्यक माहिती अपूर्ण आहे (${validationResults.map((v) => v.patientName).join(', ')}). कृपया आधी माहिती पूर्ण करा.`,
      });
      return;
    }

    try {
      const outwardNumber = letterNumber.startsWith('जा.क्र.')
        ? letterNumber
        : `जा.क्र. ${letterNumber}`;

      clientStore.createSendingLetter({
        letterNumber: outwardNumber,
        letterDate: letterDate,
        sampleTypeId: 'ST-006',
        sampleTypeName: 'Dengue / Chikungunya – Serum Sample',
        toAuthority: 'प्रयोगशाळा अधिकारी, शासकीय वैद्यकीय महाविद्यालय (GMC), लातूर.',
        subject: 'डेंगी व चिकनगुनिया सिरम नमुने तपासणीसाठी पाठविणेबाबत.',
        reference: 'महाराष्ट्र शासन मार्गदर्शक सूचना व राष्ट्रीय कीटकजन्य रोग नियंत्रण कार्यक्रम (NVBDCP)',
        laboratoryName: 'शासकीय वैद्यकीय महाविद्यालय (GMC) प्रयोगशाळा, लातूर',
        dispatchMode: 'विशेष दूत (कोल्ड चेन बॉक्स)',
        sampleIds: selectedSampleIds,
        sampleCount: selectedSampleIds.length,
        remarks: `डेंग्यू/चिकनगुनिया ${selectedSampleIds.length} संशयित सिरम नमुने NIV पुणे फॉरमॅट केस हिस्ट्री पत्रकासह GMC लातूरकडे पाठविले.`,
        signatoryTitle: 'वैद्यकीय अधिकारी, प्राथमिक आरोग्य केंद्र, भादा',
        signatoryName: doctorName,
        signatoryMobile: doctorMobile,
        recipientName: 'प्रयोगशाळा अधिकारी, शासकीय वैद्यकीय महाविद्यालय (GMC), लातूर.',
        status: statusToSet,
        letterType: 'DENGUE_CHIKUNGUNYA',
      });

      setDispatchStatus(statusToSet);
      setNotification({
        type: 'success',
        message: `अधिकृत जावक पत्र '${outwardNumber}' यशस्वीरीत्या नोंदवले व ${selectedSampleIds.length} नमुने '${statusToSet === 'Dispatched' ? 'Dispatched' : 'Generated'}' स्थितीत अद्ययावत केले!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'जावक पत्र तयार करताना त्रुटी आली.';
      setNotification({ type: 'error', message: msg });
    }
  };

  // Quick edit sample save handler
  const handleSaveEditedSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSample) return;

    clientStore.updateSample(editingSample.id, {
      patientName: editingSample.patientName,
      age: Number(editingSample.age) || undefined,
      sex: editingSample.sex,
      patientAddress: editingSample.patientAddress,
      contactNumber: editingSample.contactNumber,
      mobile: editingSample.mobile || editingSample.contactNumber,
      houseNo: editingSample.houseNo,
      hospitalAddress: editingSample.hospitalAddress,
      patientRegNo: editingSample.patientRegNo,
      wardNo: editingSample.wardNo,
      bedNo: editingSample.bedNo,
      feverOnsetDate: editingSample.feverOnsetDate,
      symptomOnsetDate: editingSample.symptomOnsetDate || editingSample.feverOnsetDate,
      natureOfSample: editingSample.natureOfSample || 'Serum',
      fever: editingSample.fever,
      feverDuration: editingSample.feverDuration,
      headache: editingSample.headache,
      headacheDuration: editingSample.headacheDuration,
      bodyache: editingSample.bodyache,
      bodyacheDuration: editingSample.bodyacheDuration,
      jointPain: editingSample.jointPain,
      jointPainDuration: editingSample.jointPainDuration,
      retroOrbitalPain: editingSample.retroOrbitalPain,
      retroOrbitalPainDuration: editingSample.retroOrbitalPainDuration,
      rash: editingSample.rash,
      rashDuration: editingSample.rashDuration,
      haemorrhagicManifestation: editingSample.haemorrhagicManifestation,
      hematemesis: editingSample.hematemesis,
      epistaxis: editingSample.epistaxis,
      melena: editingSample.melena,
      otherHaemorrhagic: editingSample.otherHaemorrhagic,
      collectionDate: editingSample.collectionDate,
    });

    setEditingSample(null);
    setNotification({
      type: 'success',
      message: `नमुना '${editingSample.id}' चा वैद्यकीय तपशील अद्ययावत झाला.`,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* SCREEN-ONLY TOOLBAR & CONTROLS */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Official Reference Standard
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
              <FileText className="w-5 h-5 text-rose-700" />
              डेंग्यू / चिकनगुनिया सिरम नमुना दस्तऐवजीकरण (Dengue &amp; Chikungunya Documentation)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              NIV पुणे केस हिस्ट्री पत्रक व GMC लातूर अधिकृत जावक पत्र — मूळ PDF फॉरमॅटनुसार अचूक निर्मिती
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-generate-case-sheets"
              onClick={() => setViewMode('CASE_HISTORY')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                viewMode === 'CASE_HISTORY'
                  ? 'bg-rose-800 text-white border-rose-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              [Generate Case History Sheets]
            </button>
            <button
              id="btn-generate-forwarding-letter"
              onClick={() => setViewMode('FORWARDING_LETTER')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                viewMode === 'FORWARDING_LETTER'
                  ? 'bg-rose-800 text-white border-rose-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              [Generate Forwarding Letter]
            </button>
            <button
              id="btn-generate-both"
              onClick={() => setViewMode('BOTH')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                viewMode === 'BOTH'
                  ? 'bg-rose-800 text-white border-rose-900 shadow-sm ring-2 ring-rose-400/40'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              [Generate Both]
            </button>

            <button
              id="btn-print-dengue-docs"
              onClick={handlePrint}
              disabled={selectedSamples.length === 0}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow transition-all ml-1"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट करा (Print A4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between print:hidden border-l-4 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
              : 'bg-rose-50 border-rose-600 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="font-bold text-slate-500 hover:text-slate-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* WORKFLOW CONTROLS ACCORDION (SCREEN-ONLY) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
        {/* Left Column: Sample Selector & Validation */}
        <div className="lg:col-span-5 space-y-4">
          {/* Sample Selection Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-xs font-bold text-slate-900">
                  [Select Samples for Forwarding Letter]
                </span>
                <p className="text-[11px] text-slate-500">
                  निवडलेले नमुने: <span className="font-bold text-rose-700">{selectedSampleIds.length}</span> / {selectableSamples.length}
                </p>
              </div>
              <button
                onClick={handleSelectAll}
                className="text-xs text-rose-700 font-bold hover:underline"
              >
                {selectedSampleIds.length === selectableSamples.length ? 'सर्व काढा' : 'सर्व निवडा'}
              </button>
            </div>

            {/* Quick Filters */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">गाव निवडा:</label>
                <select
                  value={filterVillage}
                  onChange={(e) => setFilterVillage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs font-medium"
                >
                  <option value="ALL">सर्व गावे (All)</option>
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">स्थिती:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs font-medium"
                >
                  <option value="PENDING">प्रलंबित (Pending/Collected)</option>
                  <option value="DISPATCHED">पाठविलेले (Dispatched)</option>
                  <option value="REPORT_RECEIVED">अहवाल प्राप्त (Reported)</option>
                </select>
              </div>
            </div>

            {/* Samples List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-lg">
              {selectableSamples.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  कोणतेही नमुने उपलब्ध नाहीत. कृपया नमुना नोंदणी करा.
                </div>
              ) : (
                selectableSamples.map((sample) => {
                  const isChecked = selectedSampleIds.includes(sample.id);
                  const hasIssue = validationResults.some((v) => v.sampleId === sample.id);

                  return (
                    <div
                      key={sample.id}
                      className={`p-2.5 flex items-start gap-2.5 transition-colors cursor-pointer text-xs ${
                        isChecked ? 'bg-rose-50/60' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => handleToggleSample(sample.id)}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSample(sample.id);
                        }}
                        className="mt-0.5 text-rose-700"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 fill-rose-100" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 truncate">
                            {sample.patientName || 'नाव नोंदवलेले नाही'}
                          </span>
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1 rounded">
                            {sample.id}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center gap-2 mt-0.5">
                          <span>{sample.villageName}</span>
                          <span>•</span>
                          <span>{sample.age ? `${sample.age} वर्षे` : 'वय -'}</span>
                          <span>•</span>
                          <span>{sample.sex || 'लिंग -'}</span>
                          <span>•</span>
                          <span>{formatDateDMY(sample.collectionDate)}</span>
                        </div>

                        {hasIssue && (
                          <div className="text-[10px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            <span>माहिती अपूर्ण</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSample({ ...sample });
                              }}
                              className="text-rose-700 underline font-bold ml-1"
                            >
                              पूर्ण करा ↗
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Validation Status Block */}
          {validationResults.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>आवश्यक माहिती पडताळणी चेतावणी (Data Validation):</span>
              </div>
              <p className="text-[11px] text-amber-800">
                खालील निवडलेल्या नमुन्यांमध्ये शासकीय जावक पत्रासाठी आवश्यक असलेले काही तपशील रिक्त आहेत:
              </p>
              <ul className="list-disc list-inside text-[11px] space-y-1">
                {validationResults.map((v) => (
                  <li key={v.sampleId}>
                    <span className="font-bold">{v.patientName}</span> ({v.sampleId}): {v.missingFields.join(', ')}
                    <button
                      onClick={() => {
                        const s = allDengueSamples.find((item) => item.id === v.sampleId);
                        if (s) setEditingSample({ ...s });
                      }}
                      className="ml-2 font-bold underline text-amber-950"
                    >
                      संपादन करा
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Outward & Dispatch Configuration */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Send className="w-4 h-4 text-rose-700" />
              शासकीय जावक पत्र व पाठवणी तपशील (Outward &amp; Dispatch Settings):
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  जावक क्रमांक (Outward Letter No)*:
                </label>
                <input
                  type="text"
                  value={letterNumber}
                  onChange={(e) => setLetterNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  जावक दिनांक (Letter Date)*:
                </label>
                <input
                  type="date"
                  value={letterDate}
                  onChange={(e) => setLetterDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  स्वाक्षरी अधिकारी (Medical Officer)*:
                </label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  वैद्यकीय अधिकारी मोबाईल क्र.*:
                </label>
                <input
                  type="text"
                  value={doctorMobile}
                  onChange={(e) => setDoctorMobile(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div>
                <span className="font-bold text-slate-800">प्रति (Recipient):</span> प्रयोगशाळा अधिकारी, शासकीय वैद्यकीय महाविद्यालय (GMC), लातूर.
              </div>
              <div>
                <span className="font-bold text-slate-800">विषय (Subject):</span> डेंगी व चिकनगुनिया सिरम नमुने तपासणीसाठी पाठविणेबाबत.
              </div>
              <div>
                <span className="font-bold text-slate-800">पाठविण्याची पद्धत:</span> विशेष दूत (कोल्ड चेन बॉक्समध्ये ४°C तापमानात सुरक्षित)
              </div>
            </div>

            {/* Dispatch Status Tracking Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="font-bold text-slate-800">वर्तमान स्थिती:</span>
                <span className="bg-rose-100 text-rose-900 font-bold px-2 py-0.5 rounded text-[11px]">
                  {dispatchStatus}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveAndDispatch('Generated')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-1.5 rounded transition-all"
                >
                  पत्र जतन करा (Save Generated)
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAndDispatch('Dispatched')}
                  className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs px-4 py-1.5 rounded shadow-sm transition-all"
                >
                  नमुने पाठविले (Mark Dispatched)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DOCUMENT PREVIEW & PRINT ENGINE                                          */}
      {/* ========================================================================= */}
      <div className="bg-slate-200/60 p-2 sm:p-6 rounded-xl border border-slate-300 shadow-inner">
        {selectedSamples.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-lg shadow max-w-lg mx-auto">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-sm">कोणताही नमुना निवडलेला नाही</h3>
            <p className="text-xs text-slate-500 mt-1">
              दस्तऐवज पाहण्यासाठी व प्रिंट करण्यासाठी वरील यादीतून किमान एक डेंग्यू/चिकनगुनिया नमुना निवडा.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* ------------------------------------------------------------------- */}
            {/* 1. OFFICIAL GMC LATUR FORWARDING LETTER                             */}
            {/* ------------------------------------------------------------------- */}
            {(viewMode === 'BOTH' || viewMode === 'FORWARDING_LETTER') && (
              <div
                id="gmc-latur-forwarding-letter"
                className="bg-white text-slate-900 p-8 sm:p-12 max-w-4xl mx-auto shadow-md border border-slate-300 rounded-sm font-serif print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none"
                style={{ breakAfter: viewMode === 'BOTH' ? 'page' : 'auto', pageBreakAfter: viewMode === 'BOTH' ? 'always' : 'auto' }}
              >
                {/* Government Letterhead */}
                <div className="text-center space-y-1 border-b-2 border-slate-900 pb-3">
                  <h1 className="text-base sm:text-lg font-bold tracking-wide">महाराष्ट्र शासन</h1>
                  <h2 className="text-lg sm:text-xl font-black">प्राथमिक आरोग्य केंद्र, भादा, ता. औसा, जि. लातूर</h2>
                  <p className="text-xs font-sans text-slate-700">
                    पत्ता: मु. पो. भादा, ता. औसा, जि. लातूर - ४१३५२० | ईमेल: phcbhada@gmail.com
                  </p>
                </div>

                {/* Outward Number & Date */}
                <div className="flex justify-between items-center text-xs sm:text-sm font-semibold mt-4">
                  <div>
                    {letterNumber.startsWith('जा.क्र.') ? letterNumber : `जा.क्र. ${letterNumber}`}
                  </div>
                  <div>दिनांक: {formatDateDMY(letterDate)}</div>
                </div>

                {/* Recipient */}
                <div className="mt-6 text-xs sm:text-sm space-y-0.5 leading-relaxed">
                  <div className="font-bold">प्रति,</div>
                  <div className="font-bold">प्रयोगशाळा अधिकारी,</div>
                  <div>शासकीय वैद्यकीय महाविद्यालय (GMC),</div>
                  <div>लातूर.</div>
                </div>

                {/* Subject */}
                <div className="mt-5 text-xs sm:text-sm font-bold text-center underline tracking-wide">
                  विषय : डेंगी व चिकनगुनिया सिरम नमुने तपासणीसाठी पाठविणेबाबत.
                </div>

                {/* Letter Body */}
                <div className="mt-4 text-xs sm:text-sm leading-relaxed text-justify indent-8">
                  महोदय,
                  <br />
                  <span className="inline-block mt-1 indent-8">
                    उपरोक्त विषयी विनंती की, प्राथमिक आरोग्य केंद्र भादा अंतर्गत खालील रुग्णांचे डेंगी व चिकनगुनिया संशयित सिरम नमुने तपासणीसाठी या पत्रासोबत पाठविण्यात येत आहेत. तरी कृपया सदर नमुने तपासून अहवाल मिळावा, ही विनंती.
                  </span>
                </div>

                {/* Forwarding Letter Table (Strict format per Reference) */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-900 text-xs sm:text-sm text-left">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-900 border-b border-slate-900 text-center">
                        <th className="border border-slate-900 px-2 py-2 w-12">अ.क्र.</th>
                        <th className="border border-slate-900 px-3 py-2 text-left">रुग्णाचे नाव</th>
                        <th className="border border-slate-900 px-3 py-2">गाव</th>
                        <th className="border border-slate-900 px-2 py-2 w-16">वय</th>
                        <th className="border border-slate-900 px-2 py-2 w-20">लिंग</th>
                        <th className="border border-slate-900 px-3 py-2 w-32">नमुना घेतल्याचा दिनांक</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSamples.map((sample, idx) => (
                        <tr key={sample.id} className="border-b border-slate-800">
                          <td className="border border-slate-900 px-2 py-2 text-center font-mono">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-900 px-3 py-2 font-bold uppercase">
                            {sample.patientName || '-'}
                          </td>
                          <td className="border border-slate-900 px-3 py-2 text-center">
                            {sample.villageName || '-'}
                          </td>
                          <td className="border border-slate-900 px-2 py-2 text-center font-mono">
                            {sample.age || '-'}
                          </td>
                          <td className="border border-slate-900 px-2 py-2 text-center">
                            {sample.sex === 'पुरुष' || sample.sex === 'Male'
                              ? 'MALE'
                              : sample.sex === 'स्त्री' || sample.sex === 'Female'
                              ? 'FEMALE'
                              : sample.sex || '-'}
                          </td>
                          <td className="border border-slate-900 px-3 py-2 text-center font-mono">
                            {formatDateDMY(sample.collectionDate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Official Signatory (Bottom-Right) */}
                <div className="mt-16 flex justify-end">
                  <div className="text-center text-xs sm:text-sm font-semibold space-y-1">
                    <div className="font-bold">वैद्यकीय अधिकारी</div>
                    <div className="text-slate-900 font-bold">{doctorName}</div>
                    <div className="text-slate-800">प्राथमिक आरोग्य केंद्र, भादा</div>
                    <div className="text-[11px] text-slate-500 font-sans">मोबाईल क्र. {doctorMobile}</div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* 2. INDIVIDUAL CASE HISTORY SHEETS (NIV PUNE FORMAT)                 */}
            {/* ------------------------------------------------------------------- */}
            {(viewMode === 'BOTH' || viewMode === 'CASE_HISTORY') &&
              selectedSamples.map((sample, index) => {
                const sVillage = villages.find((v) => v.id === sample.villageId);
                const talukaName = sample.taluka || sVillage?.taluka || 'औसा';
                const distName = sample.district || sVillage?.district || 'लातूर';

                return (
                  <div
                    key={`case-sheet-${sample.id}`}
                    id={`niv-case-sheet-${sample.id}`}
                    className="bg-white text-slate-950 p-8 sm:p-12 max-w-4xl mx-auto shadow-md border border-slate-300 rounded-sm font-serif print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none text-xs sm:text-sm leading-relaxed"
                    style={{ breakAfter: 'page', pageBreakAfter: 'always' }}
                  >
                    {/* Reference Header */}
                    <div className="text-center space-y-0.5">
                      <div className="text-base sm:text-lg font-bold tracking-wide">
                        National Institute of Virology
                      </div>
                      <div className="text-xs text-slate-700">20 A Dr. Ambedkar Road</div>
                      <div className="text-xs text-slate-700">Post Box No 11</div>
                      <div className="text-xs text-slate-700 font-bold">Pune 411 001</div>
                    </div>

                    {/* Official Title */}
                    <div className="text-center font-bold text-sm sm:text-base underline mt-4 tracking-wide uppercase">
                      Case history sheet for Dengue / Chikungunya fever
                    </div>

                    {/* Section Header */}
                    <div className="font-bold underline mt-5 text-xs sm:text-sm">
                      Information Required to Accompany Specimen:-
                    </div>

                    {/* Strict 1 to 10 Sequential Fields per Reference PDF */}
                    <div className="mt-4 space-y-2.5">
                      {/* 1. Full name */}
                      <div className="flex items-baseline">
                        <span className="font-bold w-48 shrink-0">1. Full name of patient</span>
                        <span className="font-bold mr-2">:</span>
                        <span className="border-b border-dotted border-slate-900 flex-1 font-bold uppercase tracking-wide">
                          {sample.patientName || '_________________________________'}
                        </span>
                      </div>

                      {/* 2. Residential Address */}
                      <div className="space-y-1">
                        <div className="font-bold">2. Residential address of patient</div>
                        <div className="pl-6 space-y-1">
                          <div className="flex items-baseline">
                            <span className="w-40 shrink-0 font-medium">Mobile</span>
                            <span className="font-bold mr-2">:</span>
                            <span className="border-b border-dotted border-slate-900 flex-1 font-mono font-medium">
                              {sample.mobile || sample.contactNumber || '____________________'}
                            </span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-40 shrink-0 font-medium">A. House No</span>
                            <span className="font-bold mr-2">:</span>
                            <span className="border-b border-dotted border-slate-900 flex-1">
                              {sample.houseNo || sample.patientAddress || '____________________'}
                            </span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-40 shrink-0 font-medium">B. Village</span>
                            <span className="font-bold mr-2">:</span>
                            <span className="border-b border-dotted border-slate-900 flex-1 font-bold">
                              {sample.villageName || '____________________'}
                            </span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-40 shrink-0 font-medium">C. Taluka</span>
                            <span className="font-bold mr-2">:</span>
                            <span className="border-b border-dotted border-slate-900 flex-1">
                              {talukaName}
                            </span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-40 shrink-0 font-medium">D. District</span>
                            <span className="font-bold mr-2">:</span>
                            <span className="border-b border-dotted border-slate-900 flex-1">
                              {distName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 3. Hospital Address */}
                      <div className="space-y-1">
                        <div className="flex items-baseline">
                          <span className="font-bold w-48 shrink-0">3. Hospital address</span>
                          <span className="font-bold mr-2">:</span>
                          <span className="border-b border-dotted border-slate-900 flex-1 font-medium">
                            {sample.hospitalAddress || 'Primary Health Centre, Bhada, Tal. Ausa, Dist. Latur'}
                          </span>
                        </div>
                        <div className="pl-6 space-y-1">
                          <div className="flex items-baseline">
                            <span className="w-40 shrink-0 font-medium">A. Patient Reg No</span>
                            <span className="font-bold mr-2">:</span>
                            <span className="border-b border-dotted border-slate-900 flex-1 font-mono">
                              {sample.patientRegNo || sample.patientId || sample.id}
                            </span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-40 shrink-0 font-medium">B. Ward No</span>
                            <span className="font-bold mr-2">:</span>
                            <span className="border-b border-dotted border-slate-900 flex-1">
                              {sample.wardNo || 'OPD / Day Care'}
                            </span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-40 shrink-0 font-medium">C. Bed No</span>
                            <span className="font-bold mr-2">:</span>
                            <span className="border-b border-dotted border-slate-900 flex-1">
                              {sample.bedNo || 'Day Care - 01'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 4. Age */}
                      <div className="flex items-baseline">
                        <span className="font-bold w-48 shrink-0">4. Age</span>
                        <span className="font-bold mr-2">:</span>
                        <span className="border-b border-dotted border-slate-900 flex-1 font-mono font-bold">
                          {sample.age ? `${sample.age} Yrs` : '______ Yrs'}
                        </span>
                      </div>

                      {/* 5. Sex */}
                      <div className="flex items-baseline">
                        <span className="font-bold w-48 shrink-0">5. Sex</span>
                        <span className="font-bold mr-2">:</span>
                        <span className="border-b border-dotted border-slate-900 flex-1 uppercase font-bold">
                          {sample.sex === 'पुरुष' || sample.sex === 'Male'
                            ? 'MALE'
                            : sample.sex === 'स्त्री' || sample.sex === 'Female'
                            ? 'FEMALE'
                            : sample.sex || '______'}
                        </span>
                      </div>

                      {/* 6. Date Of Onset of First Symptom */}
                      <div className="flex items-baseline">
                        <span className="font-bold w-64 shrink-0">6. Date Of Onset of First Symptom</span>
                        <span className="font-bold mr-2">:</span>
                        <span className="border-b border-dotted border-slate-900 flex-1 font-mono font-medium">
                          {formatDateDMY(sample.symptomOnsetDate || sample.feverOnsetDate)}
                        </span>
                      </div>

                      {/* 7. Nature of sample */}
                      <div className="flex items-baseline">
                        <span className="font-bold w-64 shrink-0">7. Nature of sample Serum/Blood/CSF</span>
                        <span className="font-bold mr-2">:</span>
                        <span className="border-b border-dotted border-slate-900 flex-1 font-bold">
                          {sample.natureOfSample || 'Serum'}
                        </span>
                      </div>

                      {/* 8. Date of sample collection */}
                      <div className="flex items-baseline">
                        <span className="font-bold w-64 shrink-0">8. Date of sample collection</span>
                        <span className="font-bold mr-2">:</span>
                        <span className="border-b border-dotted border-slate-900 flex-1 font-mono font-bold">
                          {formatDateDMY(sample.collectionDate)}
                        </span>
                      </div>

                      {/* 9. Clinical finding */}
                      <div className="space-y-1">
                        <div className="font-bold">9. Clinical finding</div>
                        <div className="pl-6 space-y-1">
                          <div className="flex items-baseline">
                            <span className="w-48 shrink-0 font-medium">1. Fever</span>
                            <span className="font-bold mr-2">:</span>
                            <span className="border-b border-dotted border-slate-900 flex-1 font-medium">
                              {sample.fever || sample.feverDuration || 'Yes'}
                            </span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-48 shrink-0 font-medium">2. Headache</span>
                            <span className="font-bold mr-2">:</span>
                            <span className="border-b border-dotted border-slate-900 flex-1 font-medium">
                              {sample.headache || sample.headacheDuration || 'Yes'}
                            </span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-48 shrink-0 font-medium">3. Bodyache</span>
                            <span className="font-bold mr-2">:</span>
                            <span className="border-b border-dotted border-slate-900 flex-1 font-medium">
                              {sample.bodyache || sample.bodyacheDuration || 'Yes'}
                            </span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-48 shrink-0 font-medium">4. Joint Pain</span>
                            <span className="font-bold mr-2">:</span>
                            <span className="border-b border-dotted border-slate-900 flex-1 font-medium">
                              {sample.jointPain || sample.jointPainDuration || 'Yes'}
                            </span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-48 shrink-0 font-medium">5. Retro Orbital Pain</span>
                            <span className="font-bold mr-2">:</span>
                            <span className="border-b border-dotted border-slate-900 flex-1 font-medium">
                              {sample.retroOrbitalPain || sample.retroOrbitalPainDuration || 'No'}
                            </span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-48 shrink-0 font-medium">6. Rash</span>
                            <span className="font-bold mr-2">:</span>
                            <span className="border-b border-dotted border-slate-900 flex-1 font-medium">
                              {sample.rash || sample.rashDuration || 'No'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 10. Haemorrhagic Manifestation */}
                      <div className="space-y-1">
                        <div className="font-bold">10. Haemorrhagic Manifestation</div>
                        <div className="pl-6 space-y-1">
                          <div className="flex items-baseline">
                            <span className="w-40 shrink-0 font-medium">a. Hematemesis</span>
                            <span className="font-bold mr-2">:</span>
                            <span className="border-b border-dotted border-slate-900 flex-1">
                              {sample.hematemesis || 'No'}
                            </span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-40 shrink-0 font-medium">b. Epistaxis</span>
                            <span className="font-bold mr-2">:</span>
                            <span className="border-b border-dotted border-slate-900 flex-1">
                              {sample.epistaxis || 'No'}
                            </span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-40 shrink-0 font-medium">c. Melena</span>
                            <span className="font-bold mr-2">:</span>
                            <span className="border-b border-dotted border-slate-900 flex-1">
                              {sample.melena || 'No'}
                            </span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-40 shrink-0 font-medium">d. Other</span>
                            <span className="font-bold mr-2">:</span>
                            <span className="border-b border-dotted border-slate-900 flex-1">
                              {sample.otherHaemorrhagic || 'None'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Official Signatory Box (Part 1 Reference Format) */}
                    <div className="mt-14 flex justify-end">
                      <div className="text-center space-y-1 text-xs sm:text-sm font-semibold">
                        <div className="font-bold">Signature of Medical Officer</div>
                        <div className="font-bold text-slate-900 mt-2">{sample.medicalOfficerName || doctorName}</div>
                        <div className="text-slate-800 font-mono text-xs">
                          Mobile No: {sample.medicalOfficerMobile || doctorMobile}
                        </div>
                        <div className="text-[11px] text-slate-500 italic mt-3">(Seal / Stamp)</div>
                      </div>
                    </div>

                    {/* Footer Sample Ref (Screen indicator) */}
                    <div className="mt-6 text-[10px] text-slate-400 font-sans border-t border-slate-200 pt-2 flex justify-between print:hidden">
                      <span>PHC Bhada Dengue Master Record Ref: {sample.id}</span>
                      <span>Page {index + 1} of {selectedSamples.length}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* QUICK EDIT MODAL TO COMPLETE CLINICAL FIELDS                               */}
      {/* ========================================================================= */}
      {editingSample && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-5 my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-rose-700" />
                <span>रुग्ण व केस हिस्ट्री तपशील पूर्ण करा (Edit Clinical Details)</span>
              </div>
              <button
                onClick={() => setEditingSample(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedSample} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">१. रुग्णाचे पूर्ण नाव*:</label>
                  <input
                    type="text"
                    required
                    value={editingSample.patientName || ''}
                    onChange={(e) =>
                      setEditingSample({ ...editingSample, patientName: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">२. मोबाईल क्रमांक:</label>
                  <input
                    type="text"
                    value={editingSample.mobile || editingSample.contactNumber || ''}
                    onChange={(e) =>
                      setEditingSample({ ...editingSample, mobile: e.target.value, contactNumber: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">A. घर क्रमांक (House No):</label>
                  <input
                    type="text"
                    placeholder="उदा. घर क्र. १२"
                    value={editingSample.houseNo || ''}
                    onChange={(e) =>
                      setEditingSample({ ...editingSample, houseNo: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">B. रुग्णालय नोंदणी क्र. (Reg No):</label>
                  <input
                    type="text"
                    placeholder="उदा. OPD-1402"
                    value={editingSample.patientRegNo || ''}
                    onChange={(e) =>
                      setEditingSample({ ...editingSample, patientRegNo: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">४. वय (Age)*:</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={editingSample.age || ''}
                    onChange={(e) =>
                      setEditingSample({ ...editingSample, age: Number(e.target.value) })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">५. लिंग (Sex)*:</label>
                  <select
                    value={editingSample.sex || 'पुरुष'}
                    onChange={(e) =>
                      setEditingSample({
                        ...editingSample,
                        sex: e.target.value as 'पुरुष' | 'स्त्री' | 'इतर',
                      })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-bold"
                  >
                    <option value="पुरुष">पुरुष (Male)</option>
                    <option value="स्त्री">स्त्री (Female)</option>
                    <option value="इतर">इतर (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">६. लक्षण सुरुवात दिनांक*:</label>
                  <input
                    type="date"
                    value={editingSample.symptomOnsetDate || editingSample.feverOnsetDate || ''}
                    onChange={(e) =>
                      setEditingSample({
                        ...editingSample,
                        symptomOnsetDate: e.target.value,
                        feverOnsetDate: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">८. नमुना संकलन दिनांक*:</label>
                  <input
                    type="date"
                    required
                    value={editingSample.collectionDate || ''}
                    onChange={(e) =>
                      setEditingSample({ ...editingSample, collectionDate: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-bold"
                  />
                </div>
              </div>

              {/* Clinical findings checkboxes */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block">९. वैद्यकीय लक्षणे (Clinical Findings):</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={editingSample.fever !== 'नाही' && editingSample.fever !== 'No'}
                      onChange={(e) =>
                        setEditingSample({ ...editingSample, fever: e.target.checked ? 'होय (Yes)' : 'नाही (No)' })
                      }
                    />
                    <span>१. ताप (Fever)</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={editingSample.headache !== 'नाही' && editingSample.headache !== 'No'}
                      onChange={(e) =>
                        setEditingSample({ ...editingSample, headache: e.target.checked ? 'होय (Yes)' : 'नाही (No)' })
                      }
                    />
                    <span>२. डोकेदुखी (Headache)</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={editingSample.bodyache !== 'नाही' && editingSample.bodyache !== 'No'}
                      onChange={(e) =>
                        setEditingSample({ ...editingSample, bodyache: e.target.checked ? 'होय (Yes)' : 'नाही (No)' })
                      }
                    />
                    <span>३. अंगदुखी (Bodyache)</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={editingSample.jointPain !== 'नाही' && editingSample.jointPain !== 'No'}
                      onChange={(e) =>
                        setEditingSample({ ...editingSample, jointPain: e.target.checked ? 'होय (Yes)' : 'नाही (No)' })
                      }
                    />
                    <span>४. सांधेदुखी (Joint Pain)</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={editingSample.retroOrbitalPain === 'होय' || editingSample.retroOrbitalPain === 'Yes'}
                      onChange={(e) =>
                        setEditingSample({ ...editingSample, retroOrbitalPain: e.target.checked ? 'होय (Yes)' : 'नाही (No)' })
                      }
                    />
                    <span>५. डोळ्यामागील दुखणे</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={editingSample.rash === 'होय' || editingSample.rash === 'Yes'}
                      onChange={(e) =>
                        setEditingSample({ ...editingSample, rash: e.target.checked ? 'होय (Yes)' : 'नाही (No)' })
                      }
                    />
                    <span>६. अंगावर पुरळ (Rash)</span>
                  </label>
                </div>
              </div>

              {/* Haemorrhagic Manifestations */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block">१०. रक्तस्राव लक्षणे (Haemorrhagic Manifestations):</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={editingSample.hematemesis === 'होय' || editingSample.hematemesis === 'Yes'}
                      onChange={(e) =>
                        setEditingSample({ ...editingSample, hematemesis: e.target.checked ? 'होय' : 'नाही' })
                      }
                    />
                    <span>रक्तातून उलटी</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={editingSample.epistaxis === 'होय' || editingSample.epistaxis === 'Yes'}
                      onChange={(e) =>
                        setEditingSample({ ...editingSample, epistaxis: e.target.checked ? 'होय' : 'नाही' })
                      }
                    />
                    <span>नाकातून रक्त</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={editingSample.melena === 'होय' || editingSample.melena === 'Yes'}
                      onChange={(e) =>
                        setEditingSample({ ...editingSample, melena: e.target.checked ? 'होय' : 'नाही' })
                      }
                    />
                    <span>काळे शौचास</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={Boolean(editingSample.otherHaemorrhagic && editingSample.otherHaemorrhagic !== 'None')}
                      onChange={(e) =>
                        setEditingSample({ ...editingSample, otherHaemorrhagic: e.target.checked ? 'उपस्थित' : 'None' })
                      }
                    />
                    <span>इतर रक्तस्राव</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSample(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="bg-rose-700 hover:bg-rose-800 text-white px-4 py-1.5 rounded font-bold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>जतन करा</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
