import React, { useState } from 'react';
import { clientStore } from '../services/clientStore';
import {
  SampleRecord,
  SendingLetter,
  User,
  SampleTypeMaster,
} from '../types';
import {
  FileText,
  Send,
  Printer,
  CheckCircle2,
  Calendar,
  Building2,
  Building,
  CheckSquare,
  Square,
  QrCode,
  Tag,
  AlertCircle,
  Clock,
  ArrowRight,
  Eye,
  HeartPulse,
} from 'lucide-react';
import { DengueDocumentationModule } from './DengueDocumentationModule';

interface SendingLetterModuleProps {
  currentUser: User;
}

export const SendingLetterModule: React.FC<SendingLetterModuleProps> = ({ currentUser }) => {
  const sampleTypes = clientStore.getSampleTypes();
  const [activeTabMode, setActiveTabMode] = useState<'STANDARD' | 'DENGUE'>('STANDARD');
  const [selectedTypeId, setSelectedTypeId] = useState<string>(sampleTypes[0]?.id || 'ST-001');
  const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>([]);

  // Letter Fields
  const [letterNumber, setLetterNumber] = useState<string>(
    clientStore.generateLetterNumber(sampleTypes[0]?.id || 'ST-001')
  );
  const [letterDate, setLetterDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [toAuthority, setToAuthority] = useState<string>(
    'मा. वरिष्ठ वैज्ञानिक अधिकारी, जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा, लातूर'
  );
  const [subject, setSubject] = useState<string>(
    'प्राथमिक आरोग्य केंद्र भादा कार्यक्षेत्रातील नमुने प्रयोगशाळा रासायनिक/जैविक तपासणीसाठी पाठविणेबाबत.'
  );
  const [reference, setReference] = useState<string>(
    'महाराष्ट्र शासन परिपत्रक क्रमांक: पापू-२०२६/प्र.क्र.४४/आरोग्य-५'
  );
  const [laboratoryName, setLaboratoryName] = useState<string>(
    'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर'
  );
  const [dispatchMode, setDispatchMode] = useState<string>('विशेष दूत');
  const [remarks, setRemarks] = useState<string>('');

  // Generated Letter View
  const [activeLetter, setActiveLetter] = useState<SendingLetter | null>(null);
  const [showStickers, setShowStickers] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  const currentSampleType = sampleTypes.find((st) => st.id === selectedTypeId) || sampleTypes[0];

  // Eligible samples for dispatch (Collected or Ready for Dispatch)
  const availableSamples = clientStore.getSamples({
    sampleTypeId: selectedTypeId,
  }).filter((s) => s.status === 'Collected' || s.status === 'Ready for Dispatch' || s.status === 'Draft');

  const existingLetters = clientStore.getSendingLetters();

  const handleTypeChange = (typeId: string) => {
    setSelectedTypeId(typeId);
    if (typeId === 'ST-006') {
      setActiveTabMode('DENGUE');
      return;
    }
    setSelectedSampleIds([]);
    setLetterNumber(clientStore.generateLetterNumber(typeId));
    const st = sampleTypes.find((t) => t.id === typeId);
    if (st) {
      setLaboratoryName(st.defaultLaboratory);
      setSubject(`प्राथमिक आरोग्य केंद्र भादा कार्यक्षेत्रातील ${st.marathiName} तपासणीसाठी पाठविणेबाबत.`);
    }
  };

  const handleSelectAll = () => {
    if (selectedSampleIds.length === availableSamples.length) {
      setSelectedSampleIds([]);
    } else {
      setSelectedSampleIds(availableSamples.map((s) => s.id));
    }
  };

  const handleToggleSample = (id: string) => {
    if (selectedSampleIds.includes(id)) {
      setSelectedSampleIds(selectedSampleIds.filter((item) => item !== id));
    } else {
      setSelectedSampleIds([...selectedSampleIds, id]);
    }
  };

  const handleGenerateLetter = () => {
    if (isSubmitting) return;
    if (selectedSampleIds.length === 0) {
      alert('कृपया पत्रात जोडण्यासाठी किमान एक नमुना निवडा.');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdLetter = clientStore.createSendingLetter({
        letterNumber,
        letterDate,
        sampleTypeId: selectedTypeId,
        sampleTypeName: currentSampleType.name,
        toAuthority,
        subject,
        reference,
        laboratoryName,
        dispatchMode,
        sampleIds: selectedSampleIds,
        sampleCount: selectedSampleIds.length,
        remarks,
        signatoryTitle: 'वैद्यकीय अधिकारी, प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर',
      });

      setActiveLetter(createdLetter);
      setSuccessMsg(`जावक पत्र '${createdLetter.letterNumber}' यशस्वीरित्या तयार करण्यात आले!`);
      setSelectedSampleIds([]);
      setLetterNumber(clientStore.generateLetterNumber(selectedTypeId));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSampleRecords: SampleRecord[] = activeLetter
    ? activeLetter.sampleIds
        .map((id) => clientStore.getSampleById(id))
        .filter((s): s is SampleRecord => s !== null)
    : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Mode Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 print:hidden">
        <button
          onClick={() => setActiveTabMode('STANDARD')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTabMode === 'STANDARD'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>सामान्य नमुने पाठवणी पत्रे व स्टिकर्स (General Lab Letters)</span>
        </button>

        <button
          onClick={() => setActiveTabMode('DENGUE')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTabMode === 'DENGUE'
              ? 'bg-rose-800 text-white shadow-sm ring-2 ring-rose-400/40'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
          }`}
        >
          <HeartPulse className="w-4 h-4 text-rose-500" />
          <span>डेंग्यू / चिकनगुनिया विशेष दस्तऐवजीकरण (NIV Pune Case History &amp; GMC Latur Letter)</span>
        </button>
      </div>

      {activeTabMode === 'DENGUE' ? (
        <DengueDocumentationModule currentUser={currentUser} />
      ) : (
        <>
          {/* Header */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-700" />
              शासकीय नमुना पाठवणी जावक पत्र व स्टिकर्स (Sending Letter &amp; Stickers)
            </h2>
            <p className="text-xs text-slate-500">
              महाराष्ट्र शासन अधिकृत नमुना अग्रेषित पत्र, जावक क्रमांक व बाटली लेबल निर्मिती
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeLetter && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>पत्र / स्टिकर्स प्रिंट करा (Print)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-600 p-3 rounded text-xs text-emerald-900 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Letter Creator vs Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Select Samples & Letter Details */}
        <div className="lg:col-span-5 space-y-4 print:hidden">
          {/* Sample Type Selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              १. नमुना प्रकार निवडा:
            </label>
            <select
              value={selectedTypeId}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              {sampleTypes.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.marathiName} ({st.codePrefix})
                </option>
              ))}
            </select>
          </div>

          {/* Sample Selection List */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  २. पाठविण्यासाठी नमुने निवडा:
                </div>
                <div className="text-[11px] text-slate-500">
                  उपलब्ध नमुने: {availableSamples.length}
                </div>
              </div>

              {availableSamples.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                >
                  {selectedSampleIds.length === availableSamples.length ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>सर्व काढा</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>सर्व निवडा</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 space-y-1">
              {availableSamples.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  या प्रकारातील पाठविण्यासाठी कोणतेही प्रलंबित नमुने नाहीत. नवीन नमुना नोंदणी करा.
                </div>
              ) : (
                availableSamples.map((sample) => {
                  const isChecked = selectedSampleIds.includes(sample.id);
                  return (
                    <div
                      key={sample.id}
                      onClick={() => handleToggleSample(sample.id)}
                      className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                        isChecked ? 'bg-emerald-50 border border-emerald-300 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="font-mono text-emerald-950 font-bold">{sample.id}</div>
                          <div className="text-[11px] text-slate-600">
                            {sample.villageName} — {sample.sourceName || sample.patientName || sample.shopOrInstitutionName}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-slate-500">
                        <div>{sample.collectionDate}</div>
                        <div className="text-emerald-700 font-medium">{sample.sampleQuantity}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="text-xs font-bold text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 flex items-center justify-between">
              <span>निवडलेले एकूण नमुने:</span>
              <span className="text-emerald-800 font-mono text-sm">{selectedSampleIds.length}</span>
            </div>
          </div>

          {/* Letter Meta Inputs */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
              ३. शासकीय जावक पत्र तपशील:
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                जावक क्रमांक (Outward No)*:
              </label>
              <input
                type="text"
                value={letterNumber}
                onChange={(e) => setLetterNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  पत्र दिनांक (Date)*:
                </label>
                <input
                  type="date"
                  value={letterDate}
                  onChange={(e) => setLetterDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  प्रेषण माध्यम (Dispatch Mode):
                </label>
                <select
                  value={dispatchMode}
                  onChange={(e) => setDispatchMode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="विशेष दूत">विशेष दूत (Special Messenger)</option>
                  <option value="कोल्ड चेन बॉक्स">कोल्ड चेन बॉक्स (Cold Chain)</option>
                  <option value="टपाल / स्पीड पोस्ट">टपाल / स्पीड पोस्ट</option>
                  <option value="स्वतः जमा">स्वतः जमा</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                प्रति / कोणास (To Authority)*:
              </label>
              <input
                type="text"
                value={toAuthority}
                onChange={(e) => setToAuthority(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                विषय (Subject)*:
              </label>
              <textarea
                rows={2}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateLetter}
              disabled={isSubmitting || selectedSampleIds.length === 0}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 ${
                !isSubmitting && selectedSampleIds.length > 0
                  ? 'bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'पत्र तयार होत आहे...' : `जावक पत्र तयार करा (${selectedSampleIds.length} नमुने)`}</span>
            </button>
          </div>

          {/* Previous Letters History */}
          {existingLetters.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>पूर्वी तयार केलेली जावक पत्रे:</span>
                <span className="text-[10px] text-slate-500 font-mono">{existingLetters.length}</span>
              </div>
              <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
                {existingLetters.map((ltr) => (
                  <button
                    key={ltr.id}
                    onClick={() => setActiveLetter(ltr)}
                    className="w-full text-left py-2 px-1 hover:bg-slate-50 rounded flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900">{ltr.letterNumber}</div>
                      <div className="text-[10px] text-slate-500">{ltr.letterDate} — {ltr.sampleCount} नमुने</div>
                    </div>
                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Output: A4 Official Government Letter Preview & Stickers */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm print:hidden">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStickers(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !showStickers ? 'bg-emerald-800 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 inline mr-1" />
                शासकीय जावक पत्र (Official Letter)
              </button>
              <button
                onClick={() => setShowStickers(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  showStickers ? 'bg-emerald-800 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Tag className="w-3.5 h-3.5 inline mr-1" />
                बाटली/पॅकेट स्टिकर्स (Bottle Stickers)
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट (Print)</span>
            </button>
          </div>

          {!activeLetter ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-3 shadow-sm print:hidden">
              <FileText className="w-12 h-12 mx-auto text-slate-300" />
              <div className="font-bold text-slate-700">कोणतेही जावक पत्र निवडलेले नाही</div>
              <p className="text-xs max-w-sm mx-auto text-slate-500">
                डाव्या बाजूला नमुने निवडून "जावक पत्र तयार करा" बटणावर क्लिक करा किंवा खालील यादीतून पूर्वीचे पत्र निवडा.
              </p>
            </div>
          ) : showStickers ? (
            /* STICKERS PRINT SHEET */
            <div className="bg-white rounded-xl border border-slate-300 p-6 shadow-md print:border-none print:shadow-none print:p-0">
              <div className="text-center font-bold text-xs text-slate-700 mb-4 print:hidden border-b pb-2">
                नमुना बाटली/पॅकेट स्टिकर्स (Sample Bottle / Packet Stickers)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedSampleRecords.map((sample) => (
                  <div
                    key={sample.id}
                    className="border-2 border-slate-900 rounded-lg p-3 bg-white space-y-2 text-xs text-slate-900 shadow-2xs break-inside-avoid"
                  >
                    <div className="text-center border-b border-slate-400 pb-1">
                      <div className="font-bold text-[11px]">प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर</div>
                      <div className="text-[10px] text-slate-600">प्रयोगशाळा नमुना लेबल / Sticker</div>
                    </div>

                    <div className="flex items-center justify-between font-mono font-bold bg-slate-100 p-1 rounded border border-slate-300">
                      <span>नमुना क्र: {sample.id}</span>
                      <span>{sample.sampleCodeOrBottleNo || sample.batchNumber || 'SMP'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <div>
                        <span className="font-semibold text-slate-600">गाव:</span> {sample.villageName}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-600">संकलन:</span> {sample.collectionDate}
                      </div>
                      <div className="col-span-2 truncate">
                        <span className="font-semibold text-slate-600">स्त्रोत/रुग्ण:</span>{' '}
                        {sample.sourceName || sample.patientName || sample.shopOrInstitutionName}
                      </div>
                      <div className="col-span-2 text-[10px] text-slate-600">
                        प्रकार: {sample.sampleTypeName} ({sample.sampleQuantity || 'Standard'})
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-300 text-[10px] flex items-center justify-between text-slate-500">
                      <span>जावक क्र: {sample.sendingLetterNumber || activeLetter.letterNumber}</span>
                      <span>स्वाक्षरी: ________</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* OFFICIAL A4 GOVERNMENT SENDING LETTER */
            <div className="bg-white rounded-xl border border-slate-300 p-8 shadow-md text-slate-900 space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 font-serif leading-relaxed">
              {/* Government Header */}
              <div className="text-center border-b-2 border-slate-800 pb-4 space-y-1">
                <div className="text-xs uppercase tracking-widest font-sans font-bold text-slate-600">
                  महाराष्ट्र शासन — सार्वजनिक आरोग्य विभाग
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  आयुष्यमान आरोग्य मंदिर लखनगाव
                </div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950">
                  प्राथमिक आरोग्य केंद्र भादा
                </h1>
                <div className="text-xs font-semibold text-slate-700">
                  तालुका औसा, जिल्हा लातूर — ४१३५२०
                </div>
              </div>

              {/* Outward & Date Row */}
              <div className="flex items-center justify-between text-xs sm:text-sm font-sans font-semibold border-b border-slate-200 pb-2">
                <div>जावक क्रमांक: <span className="font-mono font-bold text-slate-950">{activeLetter.letterNumber}</span></div>
                <div>दिनांक: <span className="font-mono font-bold text-slate-950">{activeLetter.letterDate}</span></div>
              </div>

              {/* To Authority */}
              <div className="text-xs sm:text-sm space-y-1 font-sans">
                <div className="font-bold">प्रति,</div>
                <div className="pl-4 font-semibold text-slate-900">{activeLetter.toAuthority}</div>
              </div>

              {/* Subject & Reference */}
              <div className="bg-slate-50/80 p-3 rounded border border-slate-200 text-xs sm:text-sm space-y-1.5 font-sans">
                <div>
                  <span className="font-bold">विषय:</span> {activeLetter.subject}
                </div>
                {activeLetter.reference && (
                  <div>
                    <span className="font-bold">संदर्भ:</span> {activeLetter.reference}
                  </div>
                )}
              </div>

              {/* Letter Body */}
              <div className="text-xs sm:text-sm leading-relaxed text-justify">
                <p>
                  महोदय/महोदया,
                </p>
                <p className="indent-8 mt-2">
                  उपरोक्त विषयान्वये सविनय सादर करण्यात येते की, प्राथमिक आरोग्य केंद्र भादा कार्यक्षेत्रातील खालील नमूद गावातील {activeLetter.sampleTypeName} तपासणीकरिता सोबत पाठविण्यात येत आहेत. सदर नमुन्यांची विहित मानकांनुसार प्रयोगशाळा तपासणी करून त्याचा अधिकृत अहवाल या कार्यालयास त्वरित पाठवून सहकार्य करावे, ही नम्र विनंती.
                </p>
              </div>

              {/* Table of Samples */}
              <div className="space-y-1 font-sans">
                <div className="text-xs font-bold text-slate-800">सोबत जोडलेल्या नमुन्यांचा तपशील (एकूण: {selectedSampleRecords.length} नमुने):</div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-800 text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 text-center font-bold">
                        <th className="border border-slate-700 p-1.5">अ.क्र.</th>
                        <th className="border border-slate-700 p-1.5">नमुना क्रमांक</th>
                        <th className="border border-slate-700 p-1.5">गाव / उपकेंद्र</th>
                        <th className="border border-slate-700 p-1.5">स्त्रोत / रुग्ण / दुकान</th>
                        <th className="border border-slate-700 p-1.5">बाटली/बॅच क्र.</th>
                        <th className="border border-slate-700 p-1.5">संकलन दिनांक</th>
                        <th className="border border-slate-700 p-1.5">प्रमाण</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSampleRecords.map((s, idx) => (
                        <tr key={s.id} className="text-center">
                          <td className="border border-slate-700 p-1.5">{idx + 1}</td>
                          <td className="border border-slate-700 p-1.5 font-mono font-bold text-slate-950">{s.id}</td>
                          <td className="border border-slate-700 p-1.5">{s.villageName}</td>
                          <td className="border border-slate-700 p-1.5 text-left pl-2">
                            {s.sourceName || s.patientName || s.shopOrInstitutionName || '-'}
                          </td>
                          <td className="border border-slate-700 p-1.5 font-mono">
                            {s.sampleCodeOrBottleNo || s.batchNumber || '-'}
                          </td>
                          <td className="border border-slate-700 p-1.5 font-mono">{s.collectionDate}</td>
                          <td className="border border-slate-700 p-1.5">{s.sampleQuantity || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mode & Remarks */}
              <div className="text-xs text-slate-700 space-y-1 font-sans">
                <div><span className="font-bold">प्रेषण माध्यम:</span> {activeLetter.dispatchMode}</div>
                {activeLetter.remarks && <div><span className="font-bold">शेरा:</span> {activeLetter.remarks}</div>}
              </div>

              {/* Signature Block */}
              <div className="pt-12 flex justify-end font-sans">
                <div className="text-center space-y-1 text-xs sm:text-sm">
                  <div className="font-bold text-slate-900">आपला विश्वासू,</div>
                  <div className="h-12"></div>
                  <div className="font-bold text-slate-950 border-t border-slate-400 pt-1">
                    वैद्यकीय अधिकारी
                  </div>
                  <div className="text-slate-800 text-xs">
                    प्राथमिक आरोग्य केंद्र भादा
                  </div>
                  <div className="text-slate-700 text-xs">
                    ता. औसा, जि. लातूर
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
};
