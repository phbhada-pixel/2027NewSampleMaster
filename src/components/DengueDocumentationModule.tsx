import React, { useState, useEffect, useMemo } from 'react';
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
  FileCheck2,
  ListFilter,
  Activity,
  Download,
} from 'lucide-react';
import { DengueCaseHistoryPrint } from './dengue/DengueCaseHistoryPrint';
import { DengueForwardingLetterPrint } from './dengue/DengueForwardingLetterPrint';
import { DengueEntrySubModule } from './dengue/DengueEntrySubModule';
import { DengueLabReportSubModule } from './dengue/DengueLabReportSubModule';
import { DengueRegisterSubModule } from './dengue/DengueRegisterSubModule';

interface DengueDocumentationModuleProps {
  currentUser: User;
  onNavigateToRegister?: () => void;
}

export const DengueDocumentationModule: React.FC<DengueDocumentationModuleProps> = ({
  currentUser,
  onNavigateToRegister,
}) => {
  // Main Module Tab State
  const [activeTab, setActiveTab] = useState<'DOCS' | 'ENTRY' | 'LAB_REPORT' | 'REGISTER'>('DOCS');

  // Reactive store subscription
  const [allDengueSamples, setAllDengueSamples] = useState<SampleRecord[]>(() =>
    clientStore.getSamples({ sampleTypeId: 'ST-006' })
  );

  useEffect(() => {
    const unsubscribe = clientStore.subscribe(() => {
      setAllDengueSamples(clientStore.getSamples({ sampleTypeId: 'ST-006' }));
    });
    return unsubscribe;
  }, []);

  const villages = clientStore.getVillages();

  // Selected sample IDs for document generation
  const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>(() => {
    return allDengueSamples
      .filter((s) => s.status !== 'Report Received')
      .slice(0, 5)
      .map((s) => s.id);
  });

  // Filter state for selection
  const [filterVillage, setFilterVillage] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');

  // Document View Mode: 'BOTH' | 'FORWARDING_LETTER' | 'CASE_HISTORY'
  const [viewMode, setViewMode] = useState<'BOTH' | 'FORWARDING_LETTER' | 'CASE_HISTORY'>('BOTH');

  // Forwarding Letter Form Controls
  const currentYear = new Date().getFullYear();
  const [letterNumber, setLetterNumber] = useState<string>(() => {
    const existingCount =
      clientStore.getSendingLetters().filter((l) => l.sampleTypeId === 'ST-006').length + 1;
    return `प्राआकें/भादा/डेंगी-नमुने/${String(existingCount).padStart(2, '0')}/${currentYear}`;
  });
  const [letterDate, setLetterDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [doctorName, setDoctorName] = useState<string>('Dr. Patil S.S.');
  const [doctorMobile, setDoctorMobile] = useState<string>('9689686901');

  // Feedback Notification
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Quick Edit Sample Modal for missing clinical details
  const [editingSample, setEditingSample] = useState<SampleRecord | null>(null);

  // Filtered samples for selection list
  const selectableSamples = useMemo(() => {
    return allDengueSamples.filter((sample) => {
      const matchVillage = filterVillage === 'ALL' || sample.villageId === filterVillage;
      let matchStatus = true;
      if (filterStatus === 'PENDING') {
        matchStatus =
          sample.status === 'Draft' ||
          sample.status === 'Collected' ||
          sample.status === 'Ready for Dispatch';
      } else if (filterStatus === 'DISPATCHED') {
        matchStatus = sample.status === 'Dispatched';
      } else if (filterStatus === 'REPORT_RECEIVED') {
        matchStatus = sample.status === 'Report Received';
      }
      return matchVillage && matchStatus;
    });
  }, [allDengueSamples, filterVillage, filterStatus]);

  // Selected sample objects in exact selection order
  const selectedSamples = useMemo(() => {
    return selectedSampleIds
      .map((id) => allDengueSamples.find((s) => s.id === id))
      .filter((s): s is SampleRecord => s !== undefined);
  }, [selectedSampleIds, allDengueSamples]);

  // Validation logic
  const validationResults = useMemo(() => {
    const issues: { sampleId: string; patientName: string; missingFields: string[] }[] = [];
    selectedSamples.forEach((sample) => {
      const missing: string[] = [];
      if (!sample.patientName || sample.patientName.trim() === '')
        missing.push('रुग्णाचे नाव (Patient Name)');
      if (!sample.villageName || sample.villageName.trim() === '')
        missing.push('गाव (Village)');
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

  const handleSelectQuick = (count: number) => {
    const pending = selectableSamples.filter((s) => s.status !== 'Report Received');
    setSelectedSampleIds(pending.slice(0, count).map((s) => s.id));
  };

  const handleSelectAll = () => {
    if (selectedSampleIds.length === selectableSamples.length) {
      setSelectedSampleIds([]);
    } else {
      setSelectedSampleIds(selectableSamples.map((s) => s.id));
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
        message: `काही नमुन्यांमध्ये आवश्यक माहिती अपूर्ण आहे (${validationResults
          .map((v) => v.patientName)
          .join(', ')}). कृपया आधी माहिती पूर्ण करा.`,
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
        reference:
          'महाराष्ट्र शासन मार्गदर्शक सूचना व राष्ट्रीय कीटकजन्य रोग नियंत्रण कार्यक्रम (NVBDCP)',
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

      setNotification({
        type: 'success',
        message: `अधिकृत जावक पत्र '${outwardNumber}' यशस्वीरीत्या नोंदवले व ${selectedSampleIds.length} नमुने '${
          statusToSet === 'Dispatched' ? 'Dispatched' : 'Generated'
        }' स्थितीत अद्ययावत केले!`,
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
      {/* SCREEN-ONLY TOP HEADER */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm print:hidden">
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

          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-200">
              एकूण नमुने: {allDengueSamples.length}
            </span>
          </div>
        </div>

        {/* WORKFLOW SUB-NAVIGATION TABS */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-xs font-bold">
          <button
            onClick={() => setActiveTab('DOCS')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'DOCS'
                ? 'bg-rose-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>२. केस हिस्ट्री व जावक पत्र (Case History &amp; Forwarding Letter)</span>
          </button>

          <button
            onClick={() => setActiveTab('ENTRY')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'ENTRY'
                ? 'bg-rose-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>१. नवीन नमुना नोंदणी (New Sample Entry)</span>
          </button>

          <button
            onClick={() => setActiveTab('LAB_REPORT')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'LAB_REPORT'
                ? 'bg-rose-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>३. प्रयोगशाळा अहवाल नोंदणी (Lab Report Entry)</span>
          </button>

          <button
            onClick={() => setActiveTab('REGISTER')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'REGISTER'
                ? 'bg-rose-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>४. डेंग्यू नमुना नोंदवही (Dengue Register)</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {notification && (
        <div
          className={`p-4 rounded-lg flex items-start justify-between gap-3 text-xs print:hidden ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
              : 'bg-rose-50 text-rose-900 border border-rose-300'
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
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SAMPLE DATA ENTRY SUB-MODULE                                      */}
      {/* ========================================================================= */}
      {activeTab === 'ENTRY' && (
        <DengueEntrySubModule
          currentUser={currentUser}
          onSampleCreated={(sample) => {
            setSelectedSampleIds([sample.id]);
            setNotification({
              type: 'success',
              message: `डेंग्यू नमुना ${sample.id} (${sample.patientName}) यशस्वीरीत्या तयार झाला!`,
            });
          }}
          onSwitchToDocs={(sampleId) => {
            setSelectedSampleIds([sampleId]);
            setActiveTab('DOCS');
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LAB REPORT SUB-MODULE                                             */}
      {/* ========================================================================= */}
      {activeTab === 'LAB_REPORT' && (
        <DengueLabReportSubModule
          currentUser={currentUser}
          onReportSaved={(sample) => {
            setNotification({
              type: 'success',
              message: `नमुना ${sample.id} चा अहवाल यशस्वीरीत्या नोंदवला गेला! निकाल: ${sample.result}`,
            });
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REGISTER SUB-MODULE                                               */}
      {/* ========================================================================= */}
      {activeTab === 'REGISTER' && (
        <DengueRegisterSubModule
          currentUser={currentUser}
          onSelectForDocs={(sampleId) => {
            setSelectedSampleIds([sampleId]);
            setActiveTab('DOCS');
          }}
          onSelectForReport={(sampleId) => {
            setActiveTab('LAB_REPORT');
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CASE HISTORY & FORWARDING LETTER ENGINE                           */}
      {/* ========================================================================= */}
      {activeTab === 'DOCS' && (
        <div className="space-y-6">
          {/* Top Controls Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm print:hidden space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="text-xs font-bold text-slate-800">
                दस्तऐवज निर्मिती प्रकार (Document View Mode):
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-generate-both"
                  onClick={() => setViewMode('BOTH')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    viewMode === 'BOTH'
                      ? 'bg-rose-800 text-white border-rose-900 shadow-sm ring-2 ring-rose-400/40'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  [Generate Both (दोन्ही पत्रके)]
                </button>
                <button
                  id="btn-generate-forwarding-letter"
                  onClick={() => setViewMode('FORWARDING_LETTER')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    viewMode === 'FORWARDING_LETTER'
                      ? 'bg-rose-800 text-white border-rose-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  [Generate Forwarding Letter]
                </button>
                <button
                  id="btn-generate-case-sheets"
                  onClick={() => setViewMode('CASE_HISTORY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    viewMode === 'CASE_HISTORY'
                      ? 'bg-rose-800 text-white border-rose-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  [Generate Case History Sheets]
                </button>
              </div>
            </div>

            {/* Selection & Outward Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1: Sample Picker */}
              <div className="md:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-rose-700" />
                    <span>नमुने निवडा (Select Samples for Documents):</span>
                  </span>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      onClick={() => handleSelectQuick(1)}
                      className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-slate-700 font-semibold"
                    >
                      १ नमुना
                    </button>
                    <button
                      onClick={() => handleSelectQuick(5)}
                      className="px-2 py-0.5 bg-rose-50 border border-rose-300 hover:bg-rose-100 rounded text-rose-800 font-bold"
                    >
                      पहिले ५ नमुने
                    </button>
                    <button
                      onClick={handleSelectAll}
                      className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-slate-700 font-semibold"
                    >
                      {selectedSampleIds.length === selectableSamples.length ? 'रद्द' : 'सर्व'}
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <select
                    value={filterVillage}
                    onChange={(e) => setFilterVillage(e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1 bg-white text-slate-800 text-xs"
                  >
                    <option value="ALL">सर्व गावे (All Villages)</option>
                    {villages.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1 bg-white text-slate-800 text-xs"
                  >
                    <option value="PENDING">केवळ प्रलंबित नमुने (Pending)</option>
                    <option value="DISPATCHED">पाठवलेले (Dispatched)</option>
                    <option value="REPORT_RECEIVED">अहवाल प्राप्त (Report Received)</option>
                  </select>
                </div>

                {/* Checkbox List */}
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100 bg-white">
                  {selectableSamples.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      निवडीसाठी डेंग्यू नमुना आढळला नाही.
                    </div>
                  ) : (
                    selectableSamples.map((sample) => {
                      const isChecked = selectedSampleIds.includes(sample.id);
                      return (
                        <div
                          key={sample.id}
                          className="flex items-center justify-between p-2 hover:bg-slate-50 transition-colors text-xs"
                        >
                          <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSample(sample.id)}
                              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                            />
                            <div className="truncate">
                              <span className="font-mono font-bold text-rose-900 mr-2">
                                {sample.id}
                              </span>
                              <span className="font-semibold text-slate-900 uppercase mr-2">
                                {sample.patientName || 'अनामिक रुग्ण'}
                              </span>
                              <span className="text-slate-500">
                                ({sample.villageName}, {sample.age} वर्षे, {sample.sex})
                              </span>
                            </div>
                          </label>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                sample.status === 'Dispatched'
                                  ? 'bg-blue-100 text-blue-800'
                                  : sample.status === 'Report Received'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {sample.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingSample(sample)}
                              className="text-slate-400 hover:text-rose-700 p-1"
                              title="वैद्यकीय माहिती तपासा किंवा दुरुस्त करा"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Column 2: Outward & Signatory Config */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-800 block">
                  जावक पत्र तपशील (GMC Latur Outward):
                </span>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    जावक क्रमांक:
                  </label>
                  <input
                    type="text"
                    value={letterNumber}
                    onChange={(e) => setLetterNumber(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-semibold text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    पत्र दिनांक:
                  </label>
                  <input
                    type="date"
                    value={letterDate}
                    onChange={(e) => setLetterDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    वैद्यकीय अधिकारी नाव:
                  </label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    मोबाईल क्रमांक:
                  </label>
                  <input
                    type="text"
                    value={doctorMobile}
                    onChange={(e) => setDoctorMobile(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono text-slate-800 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-600">
                निवडलेले नमुने: <strong className="text-rose-800">{selectedSamples.length}</strong>{' '}
                {viewMode === 'BOTH' && (
                  <span>
                    (१ जावक पत्र + {selectedSamples.length} NIV पुणे केस हिस्ट्री पत्रके)
                  </span>
                )}
                {viewMode === 'FORWARDING_LETTER' && <span>(१ जावक पत्र)</span>}
                {viewMode === 'CASE_HISTORY' && (
                  <span>({selectedSamples.length} NIV पुणे केस हिस्ट्री पत्रके)</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveAndDispatch('Dispatched')}
                  className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>GMC लातूर कडे पाठवणी (Dispatch)</span>
                </button>

                <button
                  type="button"
                  id="btn-print-official-documents"
                  onClick={handlePrint}
                  className="px-5 py-2 bg-rose-800 hover:bg-rose-900 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>दस्तऐवज प्रिंट करा (Print Documents)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Validation Warnings if any */}
          {validationResults.length > 0 && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded text-xs text-amber-900 print:hidden space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>काही निवडलेल्या नमुन्यांमध्ये माहिती अपूर्ण आहे (Missing Information):</span>
              </div>
              <ul className="list-disc list-inside pl-2 space-y-0.5 text-amber-800">
                {validationResults.map((v) => (
                  <li key={v.sampleId}>
                    <strong>{v.patientName}</strong>: {v.missingFields.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ========================================================================= */}
          {/* DOCUMENT PREVIEW & PRINT ENGINE                                          */}
          {/* ========================================================================= */}
          <div className="bg-slate-200/60 p-2 sm:p-6 rounded-xl border border-slate-300 shadow-inner">
            {selectedSamples.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-lg shadow max-w-lg mx-auto">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-sm">कोणताही नमुना निवडलेला नाही</h3>
                <p className="text-xs text-slate-500 mt-1">
                  दस्तऐवज पाहण्यासाठी व प्रिंट करण्यासाठी वरील यादीतून किमान एक डेंग्यू/चिकनगुनिया
                  नमुना निवडा.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* 1. OFFICIAL GMC LATUR FORWARDING LETTER */}
                {(viewMode === 'BOTH' || viewMode === 'FORWARDING_LETTER') && (
                  <DengueForwardingLetterPrint
                    samples={selectedSamples}
                    letterNumber={letterNumber}
                    letterDate={letterDate}
                    doctorName={doctorName}
                    doctorMobile={doctorMobile}
                    isStandalone={viewMode === 'FORWARDING_LETTER'}
                  />
                )}

                {/* 2. INDIVIDUAL CASE HISTORY SHEETS (NIV PUNE FORMAT) */}
                {(viewMode === 'BOTH' || viewMode === 'CASE_HISTORY') &&
                  selectedSamples.map((sample) => (
                    <DengueCaseHistoryPrint
                      key={`case-sheet-${sample.id}`}
                      sample={sample}
                      medicalOfficerName={doctorName}
                      medicalOfficerMobile={doctorMobile}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK EDIT SAMPLE MODAL (For clinical correction before dispatch) */}
      {editingSample && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-rose-700" />
                  <span>वैद्यकीय तपशील दुरुस्ती: {editingSample.id}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {editingSample.patientName} ({editingSample.villageName})
                </p>
              </div>
              <button
                onClick={() => setEditingSample(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedSample} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">रुग्णाचे नाव:</label>
                  <input
                    type="text"
                    value={editingSample.patientName || ''}
                    onChange={(e) =>
                      setEditingSample({ ...editingSample, patientName: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">मोबाईल क्र:</label>
                  <input
                    type="text"
                    value={editingSample.mobile || editingSample.contactNumber || ''}
                    onChange={(e) =>
                      setEditingSample({
                        ...editingSample,
                        mobile: e.target.value,
                        contactNumber: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">वय:</label>
                  <input
                    type="number"
                    value={editingSample.age || ''}
                    onChange={(e) =>
                      setEditingSample({ ...editingSample, age: Number(e.target.value) })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">लिंग:</label>
                  <select
                    value={editingSample.sex || 'पुरुष'}
                    onChange={(e) =>
                      setEditingSample({
                        ...editingSample,
                        sex: e.target.value as 'पुरुष' | 'स्त्री' | 'इतर',
                      })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  >
                    <option value="पुरुष">पुरुष (Male)</option>
                    <option value="स्त्री">स्त्री (Female)</option>
                    <option value="इतर">इतर (Other)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">घर क्र.:</label>
                  <input
                    type="text"
                    value={editingSample.houseNo || ''}
                    onChange={(e) =>
                      setEditingSample({ ...editingSample, houseNo: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    ताप सुरुवात दिनांक:
                  </label>
                  <input
                    type="date"
                    value={editingSample.feverOnsetDate || editingSample.symptomOnsetDate || ''}
                    onChange={(e) =>
                      setEditingSample({
                        ...editingSample,
                        feverOnsetDate: e.target.value,
                        symptomOnsetDate: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    नमुना संकलन दिनांक:
                  </label>
                  <input
                    type="date"
                    value={editingSample.collectionDate || ''}
                    onChange={(e) =>
                      setEditingSample({ ...editingSample, collectionDate: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              {/* Duration in Days */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block">
                  ९. क्लिनिकल लक्षणे - कालावधी दिवस (Clinical Findings):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">ताप (दिवस):</label>
                    <input
                      type="text"
                      placeholder="उदा. 1 Day"
                      value={editingSample.feverDuration || editingSample.fever || ''}
                      onChange={(e) =>
                        setEditingSample({
                          ...editingSample,
                          feverDuration: e.target.value,
                          fever: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300 rounded px-2 py-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">डोकेदुखी (दिवस):</label>
                    <input
                      type="text"
                      placeholder="उदा. 0 Days"
                      value={editingSample.headacheDuration || editingSample.headache || ''}
                      onChange={(e) =>
                        setEditingSample({
                          ...editingSample,
                          headacheDuration: e.target.value,
                          headache: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300 rounded px-2 py-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">अंगदुखी (दिवस):</label>
                    <input
                      type="text"
                      placeholder="उदा. 0 Days"
                      value={editingSample.bodyacheDuration || editingSample.bodyache || ''}
                      onChange={(e) =>
                        setEditingSample({
                          ...editingSample,
                          bodyacheDuration: e.target.value,
                          bodyache: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300 rounded px-2 py-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">सांधेदुखी (दिवस):</label>
                    <input
                      type="text"
                      placeholder="उदा. 0 Days"
                      value={editingSample.jointPainDuration || editingSample.jointPain || ''}
                      onChange={(e) =>
                        setEditingSample({
                          ...editingSample,
                          jointPainDuration: e.target.value,
                          jointPain: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300 rounded px-2 py-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">डोळ्यांमागे (दिवस):</label>
                    <input
                      type="text"
                      placeholder="उदा. 0 Days"
                      value={
                        editingSample.retroOrbitalPainDuration ||
                        editingSample.retroOrbitalPain ||
                        ''
                      }
                      onChange={(e) =>
                        setEditingSample({
                          ...editingSample,
                          retroOrbitalPainDuration: e.target.value,
                          retroOrbitalPain: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300 rounded px-2 py-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">पुरळ (दिवस):</label>
                    <input
                      type="text"
                      placeholder="उदा. 0 Days"
                      value={editingSample.rashDuration || editingSample.rash || ''}
                      onChange={(e) =>
                        setEditingSample({
                          ...editingSample,
                          rashDuration: e.target.value,
                          rash: e.target.value,
                        })
                      }
                      className="w-full border border-slate-300 rounded px-2 py-1 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Haemorrhagic Manifestations */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block">
                  १०. रक्तस्राव लक्षणे (Haemorrhagic Manifestations):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        editingSample.hematemesis === 'होय' ||
                        editingSample.hematemesis === 'Yes'
                      }
                      onChange={(e) =>
                        setEditingSample({
                          ...editingSample,
                          hematemesis: e.target.checked ? 'होय' : 'नाही',
                        })
                      }
                    />
                    <span>रक्तातून उलटी</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        editingSample.epistaxis === 'होय' || editingSample.epistaxis === 'Yes'
                      }
                      onChange={(e) =>
                        setEditingSample({
                          ...editingSample,
                          epistaxis: e.target.checked ? 'होय' : 'नाही',
                        })
                      }
                    />
                    <span>नाकातून रक्त</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        editingSample.melena === 'होय' || editingSample.melena === 'Yes'
                      }
                      onChange={(e) =>
                        setEditingSample({
                          ...editingSample,
                          melena: e.target.checked ? 'होय' : 'नाही',
                        })
                      }
                    />
                    <span>काळे शौचास</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(
                        editingSample.otherHaemorrhagic &&
                          editingSample.otherHaemorrhagic !== 'None'
                      )}
                      onChange={(e) =>
                        setEditingSample({
                          ...editingSample,
                          otherHaemorrhagic: e.target.checked ? 'उपस्थित' : 'None',
                        })
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
