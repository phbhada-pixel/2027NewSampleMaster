import React, { useState } from 'react';
import { clientStore } from '../services/clientStore';
import {
  SampleRecord,
  User,
  SampleTypeMaster,
} from '../types';
import {
  Table,
  Search,
  Printer,
  Download,
  Filter,
  Eye,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Droplets,
  TestTube,
  Sparkles,
  FlaskConical,
  HeartPulse,
  Bug,
  ShieldCheck,
  Building2,
  X,
  Edit,
  Trash2,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface MasterRegisterModuleProps {
  currentUser: User;
  initialFilter?: {
    sampleTypeId?: string;
    villageId?: string;
  };
  onEditSample?: (sample: SampleRecord) => void;
}

export const MasterRegisterModule: React.FC<MasterRegisterModuleProps> = ({
  currentUser,
  initialFilter,
  onEditSample,
}) => {
  const sampleTypes = clientStore.getSampleTypes();
  const villages = clientStore.getVillages();
  const subcenters = clientStore.getSubcenters();

  const [activeTypeId, setActiveTypeId] = useState<string>(
    initialFilter?.sampleTypeId || sampleTypes[0]?.id || 'ST-001'
  );
  const [selectedSubcenterId, setSelectedSubcenterId] = useState<string>('ALL');
  const [selectedVillageId, setSelectedVillageId] = useState<string>(
    initialFilter?.villageId || 'ALL'
  );
  const [selectedSourceId, setSelectedSourceId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [resultFilter, setResultFilter] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [includeInactive, setIncludeInactive] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [sortField, setSortField] = useState<'collectionDate' | 'id' | 'villageName' | 'reportReceivedDate'>('collectionDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Selected sample for detailed view modal
  const [viewingSample, setViewingSample] = useState<SampleRecord | null>(null);

  const currentSampleType = sampleTypes.find((t) => t.id === activeTypeId) || sampleTypes[0];

  // Cascading hierarchy calculations:
  // 1. Subcenter -> Villages
  const availableVillages = selectedSubcenterId === 'ALL'
    ? villages
    : villages.filter((v) => v.subcenterId === selectedSubcenterId);

  // 2. Village -> Sources
  const availableSources = clientStore.getSources(
    selectedVillageId === 'ALL' ? undefined : selectedVillageId,
    activeTypeId === 'ALL' ? undefined : activeTypeId,
    selectedSubcenterId === 'ALL' ? undefined : selectedSubcenterId
  );

  const handleSubcenterChange = (newScId: string) => {
    setSelectedSubcenterId(newScId);
    if (newScId !== 'ALL') {
      const vils = villages.filter((v) => v.subcenterId === newScId);
      if (selectedVillageId !== 'ALL' && !vils.some((v) => v.id === selectedVillageId)) {
        setSelectedVillageId('ALL');
        setSelectedSourceId('ALL');
      }
    }
  };

  const handleVillageChange = (newVilId: string) => {
    setSelectedVillageId(newVilId);
    if (newVilId !== 'ALL') {
      const v = villages.find((item) => item.id === newVilId);
      if (v && v.subcenterId && selectedSubcenterId === 'ALL') {
        setSelectedSubcenterId(v.subcenterId);
      }
      setSelectedSourceId('ALL');
    }
  };

  const rawSamples = clientStore.getSamples({
    sampleTypeId: activeTypeId === 'ALL' ? undefined : activeTypeId,
    subcenterId: selectedSubcenterId === 'ALL' ? undefined : selectedSubcenterId,
    villageId: selectedVillageId === 'ALL' ? undefined : selectedVillageId,
    sourceId: selectedSourceId === 'ALL' ? undefined : selectedSourceId,
    status: statusFilter,
    startDate: fromDate,
    endDate: toDate,
    searchQuery,
    includeInactive: currentUser.role === 'ADMIN' ? includeInactive : false,
  });

  const filteredSamples = rawSamples.filter((s) => {
    if (resultFilter === 'FIT') {
      return (
        s.result &&
        (s.result.includes('योग्य') || s.result.includes('प्रमाणित') || s.result === 'निगेटिव्ह')
      );
    }
    if (resultFilter === 'UNFIT') {
      return (
        s.result &&
        (s.result.includes('अयोग्य') || s.result.includes('अप्रमाणित') || s.result === 'पॉझिटिव्ह')
      );
    }
    if (resultFilter === 'PENDING') {
      return !s.result;
    }
    return true;
  });

  const sortedSamples = [...filteredSamples].sort((a, b) => {
    const aVal = a[sortField] || '';
    const bVal = b[sortField] || '';
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: 'collectionDate' | 'id' | 'villageName' | 'reportReceivedDate') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSoftDelete = (sample: SampleRecord) => {
    if (currentUser.role !== 'ADMIN') return;
    const reason = prompt(
      `नमुना '${sample.id}' निष्क्रिय (Soft Delete) करण्याचे कारण नोंदवा:`,
      'चुकीची नोंद / नमुना निकामी'
    );
    if (reason !== null) {
      const res = clientStore.softDeleteSample(sample.id, reason || undefined);
      alert(res.message);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleRestore = (sample: SampleRecord) => {
    if (currentUser.role !== 'ADMIN') return;
    if (confirm(`नमुना '${sample.id}' पूर्ववत (Restore) करावयाचा आहे का?`)) {
      const res = clientStore.restoreSample(sample.id);
      alert(res.message);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleExportExcel = () => {
    if (sortedSamples.length === 0) {
      alert('डाउनलोड करण्यासाठी कोणताही डेटा उपलब्ध नाही.');
      return;
    }

    const tableRows = sortedSamples
      .map(
        (s, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${s.id}</td>
          <td>${s.sampleTypeName}</td>
          <td>${s.villageName}</td>
          <td>${s.subcenter || ''}</td>
          <td>${s.sourceName || s.patientName || s.shopOrInstitutionName || ''}</td>
          <td>${s.sampleCodeOrBottleNo || s.batchNumber || ''}</td>
          <td>${s.collectionDate}</td>
          <td>${s.dispatchDate || ''}</td>
          <td>${s.sendingLetterNumber || ''}</td>
          <td>${s.laboratoryName || ''}</td>
          <td>${s.reportReceivedDate || ''}</td>
          <td>${s.reportNumber || ''}</td>
          <td>${s.result || 'Pending'}</td>
          <td>${s.remarks || ''}</td>
          <td>${s.status}</td>
        </tr>
      `
      )
      .join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th { background-color: #065f46; color: #ffffff; font-weight: bold; border: 1px solid #000; padding: 6px; }
            td { border: 1px solid #ccc; padding: 5px; font-size: 11px; }
            .header-title { font-size: 14px; font-weight: bold; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header-title">महाराष्ट्र शासन — प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर</div>
          <div class="header-title">${currentSampleType.marathiName} — मास्टर नोंदवही</div>
          <br/>
          <table>
            <thead>
              <tr>
                <th>अ.क्र.</th>
                <th>Sample ID</th>
                <th>Sample Type</th>
                <th>गाव (Village)</th>
                <th>उपकेंद्र</th>
                <th>स्त्रोत / रुग्ण / संस्था</th>
                <th>बाटली / बॅच क्र.</th>
                <th>संकलन दिनांक</th>
                <th>प्रेषण दिनांक</th>
                <th>जावक पत्र क्र.</th>
                <th>प्रयोगशाळा</th>
                <th>अहवाल दिनांक</th>
                <th>अहवाल क्र.</th>
                <th>निकाल (Result)</th>
                <th>शेरा</th>
                <th>स्थिती</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PHC_Bhada_${currentSampleType.codePrefix}_Register_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSampleIcon = (codePrefix: string) => {
    switch (codePrefix) {
      case 'WS-BIO':
        return <Droplets className="w-4 h-4 text-cyan-600" />;
      case 'WS-CHM':
        return <TestTube className="w-4 h-4 text-emerald-600" />;
      case 'SLT':
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      case 'TCL':
        return <FlaskConical className="w-4 h-4 text-amber-600" />;
      case 'MSL':
        return <HeartPulse className="w-4 h-4 text-purple-600" />;
      case 'DNG':
        return <Bug className="w-4 h-4 text-rose-600" />;
      default:
        return <Table className="w-4 h-4 text-slate-600" />;
    }
  };

  const handleExportCSV = () => {
    if (sortedSamples.length === 0) {
      alert('डाउनलोड करण्यासाठी कोणताही डेटा उपलब्ध नाही.');
      return;
    }

    const headers = [
      'Sample ID',
      'Sample Type',
      'Subcenter',
      'Village',
      'Source / Patient / Shop',
      'Bottle/Batch No',
      'Collection Date',
      'Dispatch Date',
      'Sending Letter No',
      'Lab Name',
      'Report Received Date',
      'Report Number',
      'Result',
      'Remarks',
      'Status',
    ];

    const rows = sortedSamples.map((s) => [
      `"${s.id}"`,
      `"${s.sampleTypeName}"`,
      `"${s.subcenterName || s.subcenter || ''}"`,
      `"${s.villageName}"`,
      `"${s.sourceName || s.patientName || s.shopOrInstitutionName || ''}"`,
      `"${s.sampleCodeOrBottleNo || s.batchNumber || ''}"`,
      `"${s.collectionDate}"`,
      `"${s.dispatchDate || ''}"`,
      `"${s.sendingLetterNumber || ''}"`,
      `"${s.laboratoryName || ''}"`,
      `"${s.reportReceivedDate || ''}"`,
      `"${s.reportNumber || ''}"`,
      `"${s.result || 'Pending'}"`,
      `"${s.remarks || ''}"`,
      `"${s.status}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `PHC_Bhada_${currentSampleType.codePrefix}_Register_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const isWater = currentSampleType?.codePrefix.startsWith('WS');
  const isSalt = currentSampleType?.codePrefix === 'SLT';
  const isTCL = currentSampleType?.codePrefix === 'TCL';
  const isSerum = currentSampleType?.codePrefix === 'MSL' || currentSampleType?.codePrefix === 'DNG';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Table className="w-5 h-5 text-emerald-700" />
              शासकीय मास्टर नोंदवही (Official Master Register)
            </h2>
            <p className="text-xs text-slate-500">
              प्राथमिक आरोग्य केंद्र भादा — नमुना संकलन, प्रेषण व प्रयोगशाळा अहवाल नोंदवही
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-2 rounded-lg text-xs font-bold shadow transition-all active:scale-95"
              title="अधिकृत शासकीय Excel (.xls) स्वरूपात डाऊनलोड करा"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Export (.xls)</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-2 rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95"
              title="CSV स्वरूपात डाऊनलोड करा"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>CSV Export</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>नोंदवही प्रिंट करा (Print Register)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Register Section Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm print:hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {sampleTypes.map((st) => {
            const isActive = activeTypeId === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setActiveTypeId(st.id)}
                className={`p-2.5 rounded-lg text-left transition-all border flex items-center gap-2.5 ${
                  isActive
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm ring-1 ring-emerald-600'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded ${isActive ? 'bg-white/20' : 'bg-white shadow-2xs'}`}>
                  {getSampleIcon(st.codePrefix)}
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-xs truncate leading-snug">{st.marathiName}</div>
                  <div className={`text-[10px] font-mono ${isActive ? 'text-emerald-200' : 'text-slate-500'}`}>
                    {st.codePrefix}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Comprehensive Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Subcenter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">१. उपकेंद्र निवडा (Subcenter):</label>
            <select
              value={selectedSubcenterId}
              onChange={(e) => handleSubcenterChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="ALL">सर्व उपकेंद्रे (All Subcenters)</option>
              {subcenters.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.subcenterName} {sc.subcenterCode ? `(${sc.subcenterCode})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Village (Cascaded) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">२. गाव निवडा (Village):</label>
            <select
              value={selectedVillageId}
              onChange={(e) => handleVillageChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="ALL">
                {selectedSubcenterId === 'ALL' ? 'सर्व गावे (All Villages)' : 'उपकेंद्रातील सर्व गावे'}
              </option>
              {availableVillages.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Source (Cascaded) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">३. स्त्रोत / संस्था निवडा (Source):</label>
            <select
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="ALL">सर्व स्त्रोत (All Sources)</option>
              {availableSources.map((src) => (
                <option key={src.id} value={src.id}>
                  {src.sourceName} ({src.villageName})
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              शोध (Search ID / नाव / बॅच):
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="नमुना क्र., गाव, रुग्ण, बाटली क्र..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">स्थिती (Status):</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="ALL">सर्व स्थिती (All)</option>
              <option value="Collected">Collected (संकलित)</option>
              <option value="Dispatched">Dispatched (पाठवले)</option>
              <option value="Report Received">Report Received (अहवाल प्राप्त)</option>
            </select>
          </div>

          {/* Result Quality */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">निकाल वर्गवारी:</label>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="ALL">सर्व निकाल (All)</option>
              <option value="FIT">योग्य / प्रमाणित / निगेटिव्ह</option>
              <option value="UNFIT">अयोग्य / अप्रमाणित / पॉझिटिव्ह</option>
              <option value="PENDING">अहवाल प्रलंबित (Pending)</option>
            </select>
          </div>

          {/* From - To Date */}
          <div className="flex items-center gap-1">
            <div className="w-1/2">
              <label className="block text-[10px] font-bold text-slate-700 mb-1">दिनांक पासून:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-[11px]"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-[10px] font-bold text-slate-700 mb-1">दिनांक पर्यंत:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-[11px]"
              />
            </div>
          </div>

          {/* Reset Filters Action */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedSubcenterId('ALL');
                setSelectedVillageId('ALL');
                setSelectedSourceId('ALL');
                setSearchQuery('');
                setStatusFilter('ALL');
                setResultFilter('ALL');
                setFromDate('');
                setToDate('');
              }}
              className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              फिल्टर्स पूर्ववत करा (Reset)
            </button>
          </div>
        </div>

        {currentUser.role === 'ADMIN' && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <span>रद्द / निष्क्रिय नमुने दाखवा (Show Deleted/Inactive Samples)</span>
            </label>
          </div>
        )}
      </div>

      {/* 3. Official Master Register Sheet */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-4 sm:p-6 space-y-4 print:border-none print:shadow-none print:p-0">
        {/* Printable Header */}
        <div className="text-center border-b-2 border-slate-800 pb-3 space-y-0.5">
          <div className="text-xs uppercase tracking-wider font-bold text-slate-600">
            महाराष्ट्र शासन — सार्वजनिक आरोग्य विभाग
          </div>
          <div className="text-sm font-semibold text-slate-800">
            आयुष्यमान आरोग्य मंदिर लखनगाव | प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर
          </div>
          <h1 className="text-base sm:text-lg font-black text-slate-900">
            {currentSampleType.marathiName} — अधिकृत शासकीय मास्टर नोंदवही
          </h1>
          <div className="text-[11px] text-slate-600 flex items-center justify-center gap-4 pt-1">
            <span>नोंदवही कोड: <strong className="font-mono">{currentSampleType.codePrefix}</strong></span>
            <span>एकूण नोंदी: <strong>{sortedSamples.length}</strong></span>
            <span>तारीख: <strong>{new Date().toLocaleDateString('mr-IN')}</strong></span>
          </div>
        </div>

        {/* Dynamic Table By Sample Type */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-700 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900 text-center font-bold">
                <th className="border border-slate-700 p-2">अ.क्र.</th>
                <th
                  onClick={() => handleSort('id')}
                  className="border border-slate-700 p-2 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                  title="नमुना क्रमांकाने क्रम लावा"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>नमुना क्र. (Sample ID)</span>
                    {sortField === 'id' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-700" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th className="border border-slate-700 p-2">
                  <span>उपकेंद्र (Subcenter)</span>
                </th>
                <th
                  onClick={() => handleSort('villageName')}
                  className="border border-slate-700 p-2 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                  title="गावाच्या नावाने क्रम लावा"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>गाव (Village)</span>
                    {sortField === 'villageName' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-700" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                
                {/* Specific Columns */}
                {isWater && (
                  <>
                    <th className="border border-slate-700 p-2">पाणी स्त्रोत व प्रकार</th>
                    <th className="border border-slate-700 p-2">बाटली क्र.</th>
                    <th className="border border-slate-700 p-2">संकलक कर्मचारी</th>
                  </>
                )}

                {isSalt && (
                  <>
                    <th className="border border-slate-700 p-2">दुकान / संस्था नाव</th>
                    <th className="border border-slate-700 p-2">बॅच क्र. (Batch No)</th>
                    <th className="border border-slate-700 p-2">उत्पादक / MFD / Exp</th>
                    <th className="border border-slate-700 p-2">आयोडीन (PPM)</th>
                  </>
                )}

                {isTCL && (
                  <>
                    <th className="border border-slate-700 p-2">साठा / स्त्रोत</th>
                    <th className="border border-slate-700 p-2">बॅच क्र. (Batch No)</th>
                    <th className="border border-slate-700 p-2">उत्पादक / MFD / Exp</th>
                    <th className="border border-slate-700 p-2">उपलब्ध क्लोरीन %</th>
                  </>
                )}

                {isSerum && (
                  <>
                    <th className="border border-slate-700 p-2">रुग्णाचे नाव व पत्ता</th>
                    <th className="border border-slate-700 p-2">वय / लिंग</th>
                    <th className="border border-slate-700 p-2">ताप सुरुवात दिनांक</th>
                    <th className="border border-slate-700 p-2">चाचणी</th>
                  </>
                )}

                <th
                  onClick={() => handleSort('collectionDate')}
                  className="border border-slate-700 p-2 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                  title="संकलन दिनांकाने क्रम लावा"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>संकलन दिनांक</span>
                    {sortField === 'collectionDate' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-700" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th className="border border-slate-700 p-2">जावक पत्र क्र. व दिनांक</th>
                <th
                  onClick={() => handleSort('reportReceivedDate')}
                  className="border border-slate-700 p-2 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                  title="अहवाल दिनांकाने क्रम लावा"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>अहवाल दिनांक व क्र.</span>
                    {sortField === 'reportReceivedDate' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-700" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th className="border border-slate-700 p-2">तपासणी निकाल (Result)</th>
                <th className="border border-slate-700 p-2 print:hidden">कृती (Action)</th>
              </tr>
            </thead>
            <tbody>
              {sortedSamples.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-8 text-slate-500 text-xs">
                    कोणत्याही नोंदी आढळल्या नाहीत.
                  </td>
                </tr>
              ) : (
                sortedSamples.map((sample, idx) => (
                  <tr
                    key={sample.id}
                    className={`text-center hover:bg-slate-50 transition-colors ${
                      sample.isActive === false ? 'bg-slate-100 text-slate-500 opacity-75' : ''
                    }`}
                  >
                    <td className="border border-slate-700 p-2">{idx + 1}</td>
                    <td className="border border-slate-700 p-2 font-mono font-bold text-slate-950">
                      <span>{sample.id}</span>
                      {sample.isActive === false && (
                        <span className="block mt-0.5 px-1 py-0.2 rounded text-[9px] bg-rose-100 text-rose-800 font-sans font-bold">
                          रद्द (Soft-Deleted)
                        </span>
                      )}
                    </td>
                    <td className="border border-slate-700 p-2 font-medium text-slate-800">
                      <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                        {sample.subcenterName || sample.subcenter || '—'}
                      </span>
                    </td>
                    <td className="border border-slate-700 p-2 font-semibold text-slate-900">
                      {sample.villageName}
                    </td>

                    {/* Water Fields */}
                    {isWater && (
                      <>
                        <td className="border border-slate-700 p-2 text-left pl-2">
                          <div className="font-semibold text-slate-900">{sample.sourceName || '-'}</div>
                          <div className="text-[10px] text-slate-500">प्रकार: {sample.sourceType || 'विहीर'}</div>
                        </td>
                        <td className="border border-slate-700 p-2 font-mono">
                          {sample.sampleCodeOrBottleNo || '-'}
                        </td>
                        <td className="border border-slate-700 p-2">{sample.sampleCollector || '-'}</td>
                      </>
                    )}

                    {/* Salt Fields */}
                    {isSalt && (
                      <>
                        <td className="border border-slate-700 p-2 text-left pl-2">
                          {sample.shopOrInstitutionName || '-'}
                        </td>
                        <td className="border border-slate-700 p-2 font-mono font-semibold">
                          {sample.batchNumber || '-'}
                        </td>
                        <td className="border border-slate-700 p-2 text-[10px]">
                          <div>{sample.manufacturerName || '-'}</div>
                          <div className="text-slate-500">
                            MFD: {sample.mfdDate || '-'} | EXP: {sample.expDate || '-'}
                          </div>
                        </td>
                        <td className="border border-slate-700 p-2 font-bold font-mono">
                          {sample.resultQuantitative?.iodinePpm ? `${sample.resultQuantitative.iodinePpm} PPM` : '-'}
                        </td>
                      </>
                    )}

                    {/* TCL Fields */}
                    {isTCL && (
                      <>
                        <td className="border border-slate-700 p-2 text-left pl-2">
                          {sample.sourceName || sample.shopOrInstitutionName || '-'}
                        </td>
                        <td className="border border-slate-700 p-2 font-mono font-semibold">
                          {sample.batchNumber || '-'}
                        </td>
                        <td className="border border-slate-700 p-2 text-[10px]">
                          <div>{sample.manufacturerName || '-'}</div>
                          <div className="text-slate-500">
                            MFD: {sample.mfdDate || '-'} | EXP: {sample.expDate || '-'}
                          </div>
                        </td>
                        <td className="border border-slate-700 p-2 font-bold font-mono text-emerald-800">
                          {sample.resultQuantitative?.availableChlorinePercent ? `${sample.resultQuantitative.availableChlorinePercent}%` : '-'}
                        </td>
                      </>
                    )}

                    {/* Serum Fields */}
                    {isSerum && (
                      <>
                        <td className="border border-slate-700 p-2 text-left pl-2">
                          <div className="font-bold text-slate-900">{sample.patientName || '-'}</div>
                          <div className="text-[10px] text-slate-500">{sample.patientAddress || sample.villageName}</div>
                        </td>
                        <td className="border border-slate-700 p-2">
                          {sample.age ? `${sample.age} वर्ष / ${sample.sex}` : '-'}
                        </td>
                        <td className="border border-slate-700 p-2 font-mono">
                          {sample.feverOnsetDate || '-'}
                        </td>
                        <td className="border border-slate-700 p-2 text-[11px] font-semibold">
                          {sample.testRequested || sample.sampleTypeName}
                        </td>
                      </>
                    )}

                    <td className="border border-slate-700 p-2 font-mono">{sample.collectionDate}</td>
                    
                    <td className="border border-slate-700 p-2 text-[11px]">
                      {sample.sendingLetterNumber ? (
                        <div>
                          <div className="font-mono font-bold text-emerald-900">{sample.sendingLetterNumber}</div>
                          <div className="text-[10px] text-slate-500">{sample.sendingDate}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">पाठवले नाही</span>
                      )}
                    </td>

                    <td className="border border-slate-700 p-2 text-[11px]">
                      {sample.reportReceivedDate ? (
                        <div>
                          <div className="font-semibold text-slate-900">{sample.reportReceivedDate}</div>
                          <div className="text-[10px] font-mono text-slate-500">{sample.reportNumber}</div>
                        </div>
                      ) : (
                        <span className="text-amber-700 font-medium">प्रलंबित</span>
                      )}
                    </td>

                    <td className="border border-slate-700 p-2">
                      {sample.result ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            sample.result.includes('योग्य') || sample.result.includes('प्रमाणित') || sample.result === 'निगेटिव्ह'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          {sample.result}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">अहवाल बाकी</span>
                      )}
                    </td>

                    <td className="border border-slate-700 p-2 print:hidden whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingSample(sample)}
                          className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                          title="तपशील पहा (View Details)"
                        >
                          <Eye className="w-4 h-4 text-emerald-700" />
                        </button>
                        {currentUser.role === 'ADMIN' && (
                          <>
                            {sample.isActive === false ? (
                              <button
                                onClick={() => handleRestore(sample)}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded transition-colors"
                                title="पूर्ववत करा (Restore Sample)"
                              >
                                <RotateCcw className="w-4 h-4 text-emerald-700" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSoftDelete(sample)}
                                className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded transition-colors"
                                title="निष्क्रिय करा (Soft Delete Sample)"
                              >
                                <Trash2 className="w-4 h-4 text-rose-600" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Register Footer with Official Seals & Signature for Print */}
        <div className="pt-8 grid grid-cols-3 text-center text-xs font-serif leading-normal border-t border-slate-300">
          <div>
            <div className="font-bold">नमुना संकलक / आरोग्य सेवक</div>
            <div className="text-slate-600 text-[11px] mt-1">प्रा.आ.केंद्र भादा, ता. औसा</div>
          </div>
          <div>
            <div className="font-bold">आरोग्य पर्यवेक्षक</div>
            <div className="text-slate-600 text-[11px] mt-1">प्रा.आ.केंद्र भादा, ता. औसा</div>
          </div>
          <div>
            <div className="font-bold">वैद्यकीय अधिकारी</div>
            <div className="text-slate-600 text-[11px] mt-1">प्राथमिक आरोग्य केंद्र भादा</div>
          </div>
        </div>
      </div>

      {/* SAMPLE DETAILS MODAL */}
      {viewingSample && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 rounded text-emerald-800 font-mono font-black text-sm">
                  {viewingSample.id}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{viewingSample.sampleTypeName}</h3>
                  <div className="text-[11px] text-slate-500">गाव: {viewingSample.villageName}</div>
                </div>
              </div>
              <button
                onClick={() => setViewingSample(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-base"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500">संकलन दिनांक:</span>{' '}
                <span className="font-bold text-slate-900">{viewingSample.collectionDate}</span>
              </div>
              <div>
                <span className="text-slate-500">प्रेषण दिनांक:</span>{' '}
                <span className="font-bold text-slate-900">{viewingSample.dispatchDate || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">जावक पत्र क्र:</span>{' '}
                <span className="font-mono font-bold text-emerald-900">{viewingSample.sendingLetterNumber || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">जावक दिनांक:</span>{' '}
                <span className="font-bold text-slate-900">{viewingSample.sendingDate || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">स्त्रोत / रुग्ण / संस्था:</span>{' '}
                <span className="font-bold text-slate-900">
                  {viewingSample.sourceName || viewingSample.patientName || viewingSample.shopOrInstitutionName || '-'}
                </span>
              </div>
              {viewingSample.batchNumber && (
                <div>
                  <span className="text-slate-500">बॅच क्रमांक:</span>{' '}
                  <span className="font-mono font-bold text-slate-900">{viewingSample.batchNumber}</span>
                </div>
              )}
              {viewingSample.manufacturerName && (
                <div>
                  <span className="text-slate-500">उत्पादक:</span>{' '}
                  <span className="font-medium text-slate-900">{viewingSample.manufacturerName}</span>
                </div>
              )}
              {viewingSample.mfdDate && (
                <div>
                  <span className="text-slate-500">उत्पादन दिनांक (MFD):</span>{' '}
                  <span className="font-medium text-slate-900">{viewingSample.mfdDate}</span>
                </div>
              )}
              {viewingSample.expDate && (
                <div>
                  <span className="text-slate-500">समाप्ती दिनांक (EXP):</span>{' '}
                  <span className="font-medium text-slate-900">{viewingSample.expDate}</span>
                </div>
              )}
            </div>

            {/* NIV Pune / Dengue Clinical Details if present */}
            {(viewingSample.sampleTypeId === 'ST-006' || viewingSample.clinicalFindings || viewingSample.registrationNo) && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-xs space-y-2">
                <div className="font-bold text-purple-950 flex items-center justify-between">
                  <span>NIV पुणे केस हिस्ट्री तपशील (NIV Case History Details):</span>
                  <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-mono">
                    {viewingSample.testRequested || 'Dengue/Chikungunya'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white p-2 rounded border border-purple-100">
                  <div>
                    <span className="text-slate-500 block text-[10px]">घर क्रमांक:</span>
                    <strong className="text-slate-900">{viewingSample.houseNo || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">नोंदणी क्र. (Reg. No):</span>
                    <strong className="text-slate-900">{viewingSample.registrationNo || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">वॉर्ड / बेड क्र.:</span>
                    <strong className="text-slate-900">
                      {viewingSample.wardNo ? `W: ${viewingSample.wardNo}` : ''} {viewingSample.bedNo ? `B: ${viewingSample.bedNo}` : '-'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">नमुना स्वरूप:</span>
                    <strong className="text-slate-900">{viewingSample.natureOfSample || 'Serum'}</strong>
                  </div>
                </div>

                {(viewingSample.feverPresent === 'Yes' ||
                  viewingSample.headachePresent === 'Yes' ||
                  viewingSample.bodyachePresent === 'Yes' ||
                  viewingSample.jointPainPresent === 'Yes' ||
                  viewingSample.retroOrbitalPainPresent === 'Yes' ||
                  viewingSample.rashPresent === 'Yes' ||
                  viewingSample.clinicalFindings) && (
                  <div className="bg-white p-2 rounded border border-purple-100">
                    <span className="text-slate-500 block text-[10px] mb-1 font-semibold">क्लिनिकल लक्षणे (कालावधीसह):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {viewingSample.feverPresent === 'Yes' ? (
                        <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          ताप: {viewingSample.feverDurationDays ? `${viewingSample.feverDurationDays} दिवस` : 'होय'}
                        </span>
                      ) : viewingSample.clinicalFindings?.fever ? (
                        <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">ताप (Fever)</span>
                      ) : null}

                      {viewingSample.headachePresent === 'Yes' ? (
                        <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          डोकेदुखी: {viewingSample.headacheDurationDays ? `${viewingSample.headacheDurationDays} दिवस` : 'होय'}
                        </span>
                      ) : viewingSample.clinicalFindings?.headache ? (
                        <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">डोकेदुखी (Headache)</span>
                      ) : null}

                      {viewingSample.bodyachePresent === 'Yes' ? (
                        <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          अंगदुखी: {viewingSample.bodyacheDurationDays ? `${viewingSample.bodyacheDurationDays} दिवस` : 'होय'}
                        </span>
                      ) : viewingSample.clinicalFindings?.bodyache ? (
                        <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">अंगदुखी (Bodyache)</span>
                      ) : null}

                      {viewingSample.jointPainPresent === 'Yes' ? (
                        <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          सांधेदुखी: {viewingSample.jointPainDurationDays ? `${viewingSample.jointPainDurationDays} दिवस` : 'होय'}
                        </span>
                      ) : viewingSample.clinicalFindings?.jointPain ? (
                        <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">सांधेदुखी (Joint Pain)</span>
                      ) : null}

                      {viewingSample.retroOrbitalPainPresent === 'Yes' ? (
                        <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          डोळ्यांमागे: {viewingSample.retroOrbitalPainDurationDays ? `${viewingSample.retroOrbitalPainDurationDays} दिवस` : 'होय'}
                        </span>
                      ) : viewingSample.clinicalFindings?.retroOrbitalPain ? (
                        <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">डोळ्यांमागे दुखणे</span>
                      ) : null}

                      {viewingSample.rashPresent === 'Yes' ? (
                        <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          पुरळ: {viewingSample.rashDurationDays ? `${viewingSample.rashDurationDays} दिवस` : 'होय'}
                        </span>
                      ) : viewingSample.clinicalFindings?.rash ? (
                        <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">पुरळ (Rash)</span>
                      ) : null}
                    </div>
                  </div>
                )}

                {(viewingSample.hematemesisPresent === 'Yes' ||
                  viewingSample.epistaxisPresent === 'Yes' ||
                  viewingSample.melenaPresent === 'Yes' ||
                  viewingSample.otherHemorrhagicPresent === 'Yes' ||
                  viewingSample.haemorrhagicManifestations) && (
                  <div className="bg-white p-2 rounded border border-rose-100">
                    <span className="text-slate-500 block text-[10px] mb-1 font-semibold">रक्तस्त्राव लक्षणे (कालावधीसह):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {viewingSample.hematemesisPresent === 'Yes' ? (
                        <span className="bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          रक्तउलटी: {viewingSample.hematemesisDurationDays ? `${viewingSample.hematemesisDurationDays} दिवस` : 'होय'}
                        </span>
                      ) : viewingSample.haemorrhagicManifestations?.hematemesis ? (
                        <span className="bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">रक्तउलटी</span>
                      ) : null}

                      {viewingSample.epistaxisPresent === 'Yes' ? (
                        <span className="bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          नाकातून रक्त: {viewingSample.epistaxisDurationDays ? `${viewingSample.epistaxisDurationDays} दिवस` : 'होय'}
                        </span>
                      ) : viewingSample.haemorrhagicManifestations?.epistaxis ? (
                        <span className="bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">नाकातून रक्त</span>
                      ) : null}

                      {viewingSample.melenaPresent === 'Yes' ? (
                        <span className="bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          काळी विष्ठा: {viewingSample.melenaDurationDays ? `${viewingSample.melenaDurationDays} दिवस` : 'होय'}
                        </span>
                      ) : viewingSample.haemorrhagicManifestations?.melena ? (
                        <span className="bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">काळी विष्ठा (Melena)</span>
                      ) : null}

                      {(viewingSample.otherHemorrhagicPresent === 'Yes' || viewingSample.otherHaemorrhagicPresent === 'Yes') && (
                        <span className="bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          इतर: {viewingSample.otherHemorrhagicDescription || 'होय'} ({viewingSample.otherHemorrhagicDurationDays || 1} दिवस)
                        </span>
                      )}

                      {viewingSample.haemorrhagicManifestations?.petechiae && (
                        <span className="bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">ठिपके (Petechiae)</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Report Details */}
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs space-y-2">
              <div className="font-bold text-emerald-950 flex items-center justify-between">
                <span>प्रयोगशाळा अहवाल तपशील (Laboratory Report):</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    viewingSample.result?.includes('योग्य') || viewingSample.result?.includes('प्रमाणित') || viewingSample.result === 'निगेटिव्ह'
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-rose-200 text-rose-900'
                  }`}
                >
                  {viewingSample.result || 'प्रलंबित'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-600">प्रयोगशाळा:</span>{' '}
                  <span className="font-medium text-slate-900">{viewingSample.laboratoryName || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-600">अहवाल दिनांक:</span>{' '}
                  <span className="font-medium text-slate-900">{viewingSample.reportReceivedDate || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-600">अहवाल क्रमांक:</span>{' '}
                  <span className="font-mono font-semibold text-slate-900">{viewingSample.reportNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-600">शेरा:</span>{' '}
                  <span className="text-slate-800">{viewingSample.reportRemarks || viewingSample.remarks || '-'}</span>
                </div>
              </div>

              {/* Detailed Quantitative Parameters Display */}
              {viewingSample.resultQuantitative && Object.keys(viewingSample.resultQuantitative).length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-emerald-300">
                  <div className="text-[11px] font-bold text-emerald-950 mb-1.5 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
                    <span>प्रयोगशाळा मोजमाप / परिमाणात्मक चाचणी निष्कर्ष (Quantitative Lab Parameters):</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-white p-2.5 rounded border border-emerald-200 shadow-2xs">
                    {viewingSample.resultQuantitative.residualChlorine !== undefined && (
                      <div className="bg-slate-50 p-1.5 rounded">
                        <span className="text-slate-500 block text-[10px]">उर्वरित क्लोरीन (Residual Chlorine):</span>
                        <strong className="text-slate-900 font-mono">{viewingSample.resultQuantitative.residualChlorine} mg/L (PPM)</strong>
                      </div>
                    )}
                    {viewingSample.resultQuantitative.turbidity !== undefined && (
                      <div className="bg-slate-50 p-1.5 rounded">
                        <span className="text-slate-500 block text-[10px]">गढूळपणा (Turbidity):</span>
                        <strong className="text-slate-900 font-mono">{viewingSample.resultQuantitative.turbidity} NTU</strong>
                      </div>
                    )}
                    {viewingSample.resultQuantitative.pH !== undefined && (
                      <div className="bg-slate-50 p-1.5 rounded">
                        <span className="text-slate-500 block text-[10px]">सामू (pH):</span>
                        <strong className="text-slate-900 font-mono">{viewingSample.resultQuantitative.pH}</strong>
                      </div>
                    )}
                    {viewingSample.resultQuantitative.tds !== undefined && (
                      <div className="bg-slate-50 p-1.5 rounded">
                        <span className="text-slate-500 block text-[10px]">एकूण विरघळलेले घटक (TDS):</span>
                        <strong className="text-slate-900 font-mono">{viewingSample.resultQuantitative.tds} mg/L</strong>
                      </div>
                    )}
                    {viewingSample.resultQuantitative.totalHardness !== undefined && (
                      <div className="bg-slate-50 p-1.5 rounded">
                        <span className="text-slate-500 block text-[10px]">कठीणता (Total Hardness):</span>
                        <strong className="text-slate-900 font-mono">{viewingSample.resultQuantitative.totalHardness} mg/L</strong>
                      </div>
                    )}
                    {viewingSample.resultQuantitative.fluoride !== undefined && (
                      <div className="bg-slate-50 p-1.5 rounded">
                        <span className="text-slate-500 block text-[10px]">फ्लोराईड (Fluoride):</span>
                        <strong className="text-slate-900 font-mono">{viewingSample.resultQuantitative.fluoride} mg/L</strong>
                      </div>
                    )}
                    {viewingSample.resultQuantitative.nitrate !== undefined && (
                      <div className="bg-slate-50 p-1.5 rounded">
                        <span className="text-slate-500 block text-[10px]">नायट्रेट (Nitrate):</span>
                        <strong className="text-slate-900 font-mono">{viewingSample.resultQuantitative.nitrate} mg/L</strong>
                      </div>
                    )}
                    {viewingSample.resultQuantitative.chlorides !== undefined && (
                      <div className="bg-slate-50 p-1.5 rounded">
                        <span className="text-slate-500 block text-[10px]">क्लोराईड्स (Chlorides):</span>
                        <strong className="text-slate-900 font-mono">{viewingSample.resultQuantitative.chlorides} mg/L</strong>
                      </div>
                    )}
                    {viewingSample.resultQuantitative.iron !== undefined && (
                      <div className="bg-slate-50 p-1.5 rounded">
                        <span className="text-slate-500 block text-[10px]">लोह (Iron):</span>
                        <strong className="text-slate-900 font-mono">{viewingSample.resultQuantitative.iron} mg/L</strong>
                      </div>
                    )}
                    {viewingSample.resultQuantitative.iodinePpm !== undefined && (
                      <div className="bg-slate-50 p-1.5 rounded">
                        <span className="text-slate-500 block text-[10px]">आयोडीन प्रमाण:</span>
                        <strong className="text-slate-900 font-mono">{viewingSample.resultQuantitative.iodinePpm} PPM</strong>
                      </div>
                    )}
                    {viewingSample.resultQuantitative.availableChlorinePercent !== undefined && (
                      <div className="bg-slate-50 p-1.5 rounded">
                        <span className="text-slate-500 block text-[10px]">उपलब्ध क्लोरीन (Available Chlorine):</span>
                        <strong className="text-slate-900 font-mono">{viewingSample.resultQuantitative.availableChlorinePercent}%</strong>
                      </div>
                    )}
                    {viewingSample.resultQuantitative.measlesIgmResult && (
                      <div className="bg-slate-50 p-1.5 rounded">
                        <span className="text-slate-500 block text-[10px]">Measles IgM निकाल:</span>
                        <strong className="text-slate-900">{viewingSample.resultQuantitative.measlesIgmResult}</strong>
                      </div>
                    )}
                    {viewingSample.resultQuantitative.ns1Result && (
                      <div className="bg-slate-50 p-1.5 rounded">
                        <span className="text-slate-500 block text-[10px]">Dengue NS1 Antigen:</span>
                        <strong className="text-slate-900">{viewingSample.resultQuantitative.ns1Result}</strong>
                      </div>
                    )}
                    {viewingSample.resultQuantitative.dengueIgmResult && (
                      <div className="bg-slate-50 p-1.5 rounded">
                        <span className="text-slate-500 block text-[10px]">Dengue IgM Antibody:</span>
                        <strong className="text-slate-900">{viewingSample.resultQuantitative.dengueIgmResult}</strong>
                      </div>
                    )}
                    {viewingSample.resultQuantitative.chikungunyaIgmResult && (
                      <div className="bg-slate-50 p-1.5 rounded">
                        <span className="text-slate-500 block text-[10px]">Chikungunya IgM Antibody:</span>
                        <strong className="text-slate-900">{viewingSample.resultQuantitative.chikungunyaIgmResult}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Audit Trail info */}
            <div className="text-[10px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-200">
              <span>नोंदणीकर्ता: {viewingSample.createdByName || 'Admin'}</span>
              <span>नोंदणी वेळ: {new Date(viewingSample.createdAt).toLocaleString('mr-IN')}</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingSample(null)}
                className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-semibold"
              >
                बंद करा
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
