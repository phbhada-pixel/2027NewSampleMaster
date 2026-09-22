import React, { useState, useMemo } from 'react';
import { clientStore } from '../../services/clientStore';
import { SampleRecord, User } from '../../types';
import {
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Search,
  Building,
  Save,
  ShieldCheck,
} from 'lucide-react';

interface DengueLabReportSubModuleProps {
  currentUser: User;
  onReportSaved?: (sample: SampleRecord) => void;
}

export const DengueLabReportSubModule: React.FC<DengueLabReportSubModuleProps> = ({
  currentUser,
  onReportSaved,
}) => {
  const allDengueSamples = clientStore.getSamples({ sampleTypeId: 'ST-006' });
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedSampleId, setSelectedSampleId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterPendingOnly, setFilterPendingOnly] = useState<boolean>(true);

  // Form Fields
  const [reportNumber, setReportNumber] = useState<string>('');
  const [reportDate, setReportDate] = useState<string>(todayStr);
  const [laboratoryName, setLaboratoryName] = useState<string>(
    'शासकीय वैद्यकीय महाविद्यालय (GMC) प्रयोगशाळा, लातूर'
  );
  const [testType, setTestType] = useState<string>('डेंग्यू NS1 Antigen ELISA');
  const [result, setResult] = useState<'पॉझिटिव्ह' | 'निगेटिव्ह' | 'इक्वीव्होकल'>('निगेटिव्ह');
  const [remarks, setRemarks] = useState<string>('');

  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtered samples
  const eligibleSamples = useMemo(() => {
    return allDengueSamples.filter((s) => {
      if (filterPendingOnly && s.status === 'Report Received') return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        s.id.toLowerCase().includes(term) ||
        (s.patientName && s.patientName.toLowerCase().includes(term)) ||
        (s.villageName && s.villageName.toLowerCase().includes(term)) ||
        (s.sendingLetterNumber && s.sendingLetterNumber.toLowerCase().includes(term))
      );
    });
  }, [allDengueSamples, filterPendingOnly, searchTerm]);

  const activeSample = useMemo(() => {
    return allDengueSamples.find((s) => s.id === selectedSampleId);
  }, [allDengueSamples, selectedSampleId]);

  const handleSelectSample = (sample: SampleRecord) => {
    setSelectedSampleId(sample.id);
    setSaveSuccess(null);
    setErrorMessage(null);
    if (sample.reportNumber) setReportNumber(sample.reportNumber);
    else setReportNumber(`GMC/VRDL/DNG/${new Date().getFullYear()}/${sample.id.split('-').pop() || '101'}`);

    if (sample.reportReceivedDate) setReportDate(sample.reportReceivedDate);
    if (sample.laboratoryName) setLaboratoryName(sample.laboratoryName);
    if (sample.testRequested) setTestType(sample.testRequested);
    if (sample.result === 'पॉझिटिव्ह' || sample.result === 'निगेटिव्ह' || sample.result === 'इक्वीव्होकल') {
      setResult(sample.result);
    }
    if (sample.remarks) setRemarks(sample.remarks);
  };

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(null);
    setErrorMessage(null);

    if (!activeSample) {
      setErrorMessage('कृपया प्रथम नमुना निवडा.');
      return;
    }

    if (!reportNumber.trim()) {
      setErrorMessage('प्रयोगशाळा अहवाल क्रमांक (Report Number) आवश्यक आहे.');
      return;
    }

    if (!reportDate) {
      setErrorMessage('अहवाल प्राप्त दिनांक (Report Date) आवश्यक आहे.');
      return;
    }

    try {
      const updated = clientStore.updateSample(activeSample.id, {
        reportNumber: reportNumber.trim(),
        reportReceivedDate: reportDate,
        reportDate: reportDate,
        laboratoryName: laboratoryName.trim(),
        testType: testType.trim(),
        result,
        status: 'Report Received',
        remarks: remarks.trim() || `अहवाल प्राप्त: ${result}`,
      });

      if (updated) {
        setSaveSuccess(`नमुना ${updated.id} चा प्रयोगशाळा अहवाल यशस्वीरीत्या नोंदवला गेला!`);
        if (onReportSaved) {
          onReportSaved(updated);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'अहवाल जतन करताना त्रुटी आली.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-indigo-700" />
          डेंग्यू / चिकनगुनिया प्रयोगशाळा अहवाल नोंदणी (Lab Report Entry)
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          GMC लातूर कडून प्राप्त झालेल्या चाचणी अहवालांची अधिकृत नोंदणी व निकाल वर्गीकरण
        </p>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border-l-4 border-emerald-600 p-3 rounded-r text-xs text-emerald-900 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-3 rounded-r text-xs text-rose-900 font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sample Selection List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">१. नमुना निवडा (Select Sample):</span>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={filterPendingOnly}
                onChange={(e) => setFilterPendingOnly(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>केवळ प्रलंबित (Pending Only)</span>
            </label>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Sample ID किंवा रुग्णाचे नाव शोधा..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="max-h-[380px] overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50/50">
            {eligibleSamples.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                कोणतेही नमुने आढळले नाहीत.
              </div>
            ) : (
              eligibleSamples.map((s) => {
                const isSelected = s.id === selectedSampleId;
                const isReceived = s.status === 'Report Received';

                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSample(s)}
                    className={`p-3 cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? 'bg-indigo-50 border-l-4 border-indigo-600 text-indigo-950 font-medium'
                        : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-bold">
                      <span>{s.id}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          isReceived
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.sendingLetterNumber
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <div className="mt-1 font-bold text-slate-900 uppercase">
                      {s.patientName || 'अनामिक रुग्ण'} ({s.age || '-'} वर्षे, {s.sex || '-'})
                    </div>
                    <div className="mt-0.5 text-slate-500 text-[11px] flex justify-between">
                      <span>गाव: {s.villageName || '-'}</span>
                      <span>संकलन: {s.collectionDate}</span>
                    </div>
                    {s.sendingLetterNumber && (
                      <div className="mt-0.5 text-[10px] text-blue-700 font-mono truncate">
                        जावक: {s.sendingLetterNumber} ({s.sendingDate || '-'})
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Lab Report Entry Form */}
        <div className="lg:col-span-7 bg-slate-50 p-4 rounded-xl border border-slate-200">
          {!activeSample ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Clock className="w-10 h-10 mb-2 opacity-50" />
              <div className="text-sm font-bold text-slate-600">डावीकडील यादीतून नमुना निवडा</div>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                नमुना निवडल्यानंतर त्याचा अहवाल क्रमांक, दिनांक आणि निकाल प्रविष्ट करा.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSaveReport} className="space-y-4 text-xs">
              {/* Selected Sample Overview */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-mono font-bold text-indigo-900 text-sm">
                    {activeSample.id}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600">
                    संकलन: {activeSample.collectionDate}
                  </span>
                </div>
                <div className="text-slate-800 font-bold uppercase text-xs pt-0.5">
                  रुग्ण: {activeSample.patientName} ({activeSample.age} वर्षे, {activeSample.sex})
                </div>
                <div className="text-slate-600 text-[11px]">
                  गाव: {activeSample.villageName} | उपकेंद्र: {activeSample.subcenterName} | पत्ता: {activeSample.patientAddress}
                </div>
                {activeSample.sendingLetterNumber && (
                  <div className="text-[11px] text-blue-800 font-mono">
                    जावक पत्र क्र: {activeSample.sendingLetterNumber} (दिनांक: {activeSample.sendingDate || '-'})
                  </div>
                )}
              </div>

              {/* Lab Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    अहवाल क्रमांक (Report Number)*:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. GMC/VRDL/DNG/2026/894"
                    value={reportNumber}
                    onChange={(e) => setReportNumber(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    अहवाल प्राप्त दिनांक (Report Date)*:
                  </label>
                  <input
                    type="date"
                    required
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  प्रयोगशाळेचे नाव (Laboratory):
                </label>
                <input
                  type="text"
                  value={laboratoryName}
                  onChange={(e) => setLaboratoryName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    चाचणी प्रकार (Test Type):
                  </label>
                  <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-slate-800"
                  >
                    <option value="डेंग्यू NS1 Antigen ELISA">डेंग्यू NS1 Antigen ELISA</option>
                    <option value="डेंग्यू IgM ELISA">डेंग्यू IgM ELISA</option>
                    <option value="चिकनगुनिया IgM ELISA">चिकनगुनिया IgM ELISA</option>
                    <option value="डेंग्यू NS1 + IgM ELISA">डेंग्यू NS1 + IgM ELISA</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    चाचणी निकाल (Test Result)*:
                  </label>
                  <select
                    value={result}
                    onChange={(e) =>
                      setResult(e.target.value as 'पॉझिटिव्ह' | 'निगेटिव्ह' | 'इक्वीव्होकल')
                    }
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-900"
                  >
                    <option value="निगेटिव्ह">निगेटिव्ह (Negative / प्रमाणित)</option>
                    <option value="पॉझिटिव्ह">पॉझिटिव्ह (Positive / अप्रमाणित)</option>
                    <option value="इक्वीव्होकल">इक्वीव्होकल (Equivocal / अप्राप्त)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  शेरा / टिपणी (Remarks):
                </label>
                <input
                  type="text"
                  placeholder="उदा. उपचार सुरू / सर्वेक्षण पूर्ण"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
                />
              </div>

              {/* Classification Info Box */}
              <div className="p-2.5 rounded bg-indigo-50/70 border border-indigo-200 text-[11px] text-indigo-900 space-y-0.5">
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
                  <span>स्वयंचलित निकाल वर्गीकरण (Automated Classification):</span>
                </div>
                <div>
                  • <strong>{result}</strong> निकाल आपोआप{' '}
                  <span className="font-bold">
                    {result === 'निगेटिव्ह'
                      ? 'प्रमाणित (Negative)'
                      : result === 'पॉझिटिव्ह'
                      ? 'अप्रमाणित (Positive)'
                      : 'अप्राप्त (Pending)'}
                  </span>{' '}
                  म्हणून वर्गीकृत केला जाईल व मासिक अहवालात नोंद होईल.
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg shadow flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>अहवाल जतन करा (Save Lab Report)</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
