import React, { useState, useMemo } from 'react';
import { clientStore } from '../services/clientStore';
import { User, SubcenterMaster, VillageMaster, WaterSourceOverdueItem } from '../types';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  Printer,
  Download,
  Droplets,
  Calendar,
  Building2,
  Layers,
  ArrowRight,
  ShieldAlert,
  PlusCircle,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Eye,
  AlertTriangle,
  BadgeAlert,
} from 'lucide-react';
import { OfficialReportPdfModal } from './OfficialReportPdfModal';

interface WaterBiologicalOverdueReportViewProps {
  currentUser: User;
  onNavigateToSampleEntry?: (sourceInfo: {
    sampleTypeId: string;
    subcenterId: string;
    villageId: string;
    sourceId: string;
    sourceName: string;
  }) => void;
}

export const WaterBiologicalOverdueReportView: React.FC<WaterBiologicalOverdueReportViewProps> = ({
  currentUser,
  onNavigateToSampleEntry,
}) => {
  const subcenters = clientStore.getSubcenters();
  const villages = clientStore.getVillages();

  // Filters
  const [selectedSubcenterId, setSelectedSubcenterId] = useState<string>('ALL');
  const [selectedVillageId, setSelectedVillageId] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<
    'ALL' | 'OVERDUE_ONLY' | 'OVERDUE_3M' | 'OVERDUE_6M' | 'CRITICAL_NEVER' | 'TIMELY'
  >('OVERDUE_ONLY');
  const [referenceDate, setReferenceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  // Cascading village filter
  const availableVillages = useMemo(() => {
    if (selectedSubcenterId === 'ALL') return villages;
    return villages.filter((v) => v.subcenterId === selectedSubcenterId);
  }, [villages, selectedSubcenterId]);

  const handleSubcenterChange = (scId: string) => {
    setSelectedSubcenterId(scId);
    if (scId !== 'ALL') {
      const vils = villages.filter((v) => v.subcenterId === scId);
      if (selectedVillageId !== 'ALL' && !vils.some((v) => v.id === selectedVillageId)) {
        setSelectedVillageId('ALL');
      }
    }
  };

  // Get due report from clientStore
  const reportData = useMemo(() => {
    return clientStore.getWaterSourcesBiologicalDueReport({
      subcenterId: selectedSubcenterId,
      villageId: selectedVillageId,
      referenceDate,
      filterCategory: filterCategory === 'OVERDUE_ONLY' ? undefined : filterCategory,
    });
  }, [selectedSubcenterId, selectedVillageId, referenceDate, filterCategory]);

  // Filter items by search query and overdue toggle
  const filteredItems = useMemo(() => {
    let list = reportData.items;

    if (filterCategory === 'OVERDUE_ONLY') {
      list = list.filter((item) => item.isOverdue3Months);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.sourceName.toLowerCase().includes(q) ||
          item.sourceCode.toLowerCase().includes(q) ||
          item.villageName.toLowerCase().includes(q) ||
          item.subcenterName.toLowerCase().includes(q) ||
          item.sourceType.toLowerCase().includes(q) ||
          item.locationAddress.toLowerCase().includes(q)
      );
    }

    return list;
  }, [reportData.items, filterCategory, searchQuery]);

  // Overall PHC stats (unfiltered by category to give complete picture)
  const fullPhcStats = useMemo(() => {
    const raw = clientStore.getWaterSourcesBiologicalDueReport({
      subcenterId: selectedSubcenterId,
      villageId: selectedVillageId,
      referenceDate,
    });
    return raw.stats;
  }, [selectedSubcenterId, selectedVillageId, referenceDate]);

  // Handle Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'अ.क्र.',
      'उपकेंद्र',
      'गाव',
      'पाणी स्त्रोताचे नाव',
      'स्त्रोत प्रकार',
      'स्त्रोत कोड',
      'पत्ता / जागा',
      'शेवटचा जैविक तपासणी दिनांक',
      'शेवटचा निकाल',
      'प्रलंबित दिवस',
      'प्रलंबित महिने',
      'तपासणी स्थिती',
      'या महिन्यात तपासणी झाली का',
    ];

    const rows = filteredItems.map((item, idx) => [
      idx + 1,
      `"${item.subcenterName}"`,
      `"${item.villageName}"`,
      `"${item.sourceName}"`,
      `"${item.sourceType}"`,
      `"${item.sourceCode}"`,
      `"${item.locationAddress}"`,
      item.lastTestedDate || 'कधीही नाही',
      `"${item.lastResult || '-'}"`,
      item.daysSinceLastTest !== null ? item.daysSinceLastTest : 'कधीही नाही',
      item.monthsSinceLastTest !== null ? item.monthsSinceLastTest : 'कधीही नाही',
      item.isNeverTested
        ? 'कधीही तपासणी नाही'
        : item.isOverdue6Months
        ? '> ६ महिने प्रलंबित'
        : item.isOverdue3Months
        ? '> ३ महिने प्रलंबित'
        : 'वेळेवर तपासलेले',
      item.testedThisMonth ? 'होय' : 'नाही',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `PHC_Bhada_Water_Bio_Overdue_3Months_${referenceDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Context Info */}
      <div className="bg-gradient-to-r from-rose-900 via-amber-900 to-rose-950 text-white rounded-xl p-5 shadow-sm border border-rose-800/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-200 text-xs font-bold uppercase tracking-wider mb-1">
              <BadgeAlert className="w-4 h-4 text-rose-300 animate-pulse" />
              पाणी गुणवत्ता संनियंत्रण — अनुजीव (Bacteriological) तपासणी दक्षता
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              मागील ३ महिन्यांपासून अनुजीव तपासणी न झालेले पाणी स्रोत
            </h2>
            <p className="text-xs sm:text-sm text-rose-100/90 mt-1 max-w-3xl">
              पिण्याच्या पाण्याच्या स्त्रोतांची दर ३ महिन्यांनी किमान एकदा जैविक/OT (Bacteriological MPN) तपासणी करणे बंधनकारक आहे. मागील ९० दिवसांत न पाठविलेल्या स्त्रोतांची उपकेंद्रनिहाय यादी खालीलप्रमाणे आहे.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ring-1 ring-rose-400/50"
              title="अधिकृत शासकीय नमुना अहवाल PDF स्वरूपात जनरेट करा"
            >
              <FileText className="w-4 h-4 text-rose-100" />
              <span>शासकीय अहवाल PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
              title="अहवाल प्रिंट करा"
            >
              <Printer className="w-4 h-4 text-rose-200" />
              <span>प्रिंट (A4)</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
              title="एक्सेल / CSV डाउनलोड करा"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>CSV / Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Sources */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase">एकूण पाणी स्त्रोत</span>
            <Droplets className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{fullPhcStats.totalWaterSources}</div>
          <div className="text-[10px] text-slate-500 mt-1">नोंदणीकृत पिण्याचे स्त्रोत</div>
        </div>

        {/* 3 Months Overdue Alert */}
        <div
          onClick={() => setFilterCategory('OVERDUE_3M')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            filterCategory === 'OVERDUE_3M'
              ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-300'
              : 'bg-white border-rose-200 hover:bg-rose-50/50'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[11px] font-bold uppercase">&gt; ३ महिने प्रलंबित</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700">{fullPhcStats.overdue3MonthsCount}</div>
          <div className="text-[10px] text-rose-600 font-semibold mt-1">तात्काळ नमुना पाठवा</div>
        </div>

        {/* > 6 Months Overdue Alert */}
        <div
          onClick={() => setFilterCategory('OVERDUE_6M')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            filterCategory === 'OVERDUE_6M'
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-300'
              : 'bg-white border-amber-200 hover:bg-amber-50/50'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-bold uppercase">&gt; ६ महिने प्रलंबित</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-800">{fullPhcStats.overdue6MonthsCount}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">अति प्रलंबित स्त्रोत</div>
        </div>

        {/* Never Tested Alert */}
        <div
          onClick={() => setFilterCategory('CRITICAL_NEVER')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            filterCategory === 'CRITICAL_NEVER'
              ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-300'
              : 'bg-white border-purple-200 hover:bg-purple-50/50'
          }`}
        >
          <div className="flex items-center justify-between text-purple-700 mb-1">
            <span className="text-[11px] font-bold uppercase">कधीही तपासणी नाही</span>
            <ShieldAlert className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900">{fullPhcStats.neverTestedCount}</div>
          <div className="text-[10px] text-purple-700 font-semibold mt-1">प्राधान्याने नोंदणी हवी</div>
        </div>

        {/* Tested in 3 Months (Compliant) */}
        <div
          onClick={() => setFilterCategory('TIMELY')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            filterCategory === 'TIMELY'
              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300'
              : 'bg-white border-emerald-200 hover:bg-emerald-50/50'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-bold uppercase">३ महिन्यांत तपासलेले</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800">{fullPhcStats.testedIn3MonthsCount}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">नियमित तपासणी चालू</div>
        </div>

        {/* Tested This Month */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase">चालू महिना संकलन</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900">{fullPhcStats.testedThisMonthCount}</div>
          <div className="text-[10px] text-blue-600 font-semibold mt-1">या महिन्यात पाठविलेले</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Subcenter Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              उपकेंद्र निवडा:
            </label>
            <select
              value={selectedSubcenterId}
              onChange={(e) => handleSubcenterChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">सर्व उपकेंद्र ({subcenters.length})</option>
              {subcenters.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.subcenterName} ({sc.subcenterCode})
                </option>
              ))}
            </select>
          </div>

          {/* Village Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              गाव निवडा:
            </label>
            <select
              value={selectedVillageId}
              onChange={(e) => setSelectedVillageId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">सर्व गावे ({availableVillages.length})</option>
              {availableVillages.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.subcenterName})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-700" />
              तपासणी स्थिती:
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="OVERDUE_ONLY">फक्त प्रलंबित स्रोत (मागील ३ महिने न झालेले)</option>
              <option value="ALL">सर्व स्त्रोत (प्रलंबित + वेळेवर)</option>
              <option value="CRITICAL_NEVER">कधीही तपासणी न झालेले स्रोत</option>
              <option value="OVERDUE_6M">&gt; ६ महिने प्रलंबित स्रोत</option>
              <option value="OVERDUE_3M">&gt; ३ महिने प्रलंबित स्रोत</option>
              <option value="TIMELY">वेळेवर तपासलेले (३ महिन्यांच्या आत)</option>
            </select>
          </div>

          {/* Reference Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              कालावधी मोजणी दिनांक:
            </label>
            <input
              type="date"
              value={referenceDate}
              onChange={(e) => setReferenceDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Search and Reset Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="स्त्रोत नाव, कोड, गाव, उपकेंद्र किंवा ठिकाण शोधा..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs font-bold text-slate-600">
              एकूण सापडलेले स्त्रोत: <span className="text-rose-700 font-black">{filteredItems.length}</span>
            </span>

            {(selectedSubcenterId !== 'ALL' ||
              selectedVillageId !== 'ALL' ||
              filterCategory !== 'OVERDUE_ONLY' ||
              searchQuery) && (
              <button
                onClick={() => {
                  setSelectedSubcenterId('ALL');
                  setSelectedVillageId('ALL');
                  setFilterCategory('OVERDUE_ONLY');
                  setSearchQuery('');
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold underline px-2 py-1"
              >
                फिल्टर रीसेट करा
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table of Overdue Water Sources */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Droplets className="w-4 h-4 text-rose-600" />
              <span>अनुजीव तपासणी प्रलंबित पाणी स्त्रोत यादी (Water Sources Due for Biological Examination)</span>
            </h3>
            <p className="text-xs text-slate-500">
              {filterCategory === 'OVERDUE_ONLY'
                ? 'मागील ३ महिन्यांपासून (९० दिवस) अनुजीव तपासणीसाठी न पाठविलेले स्त्रोत दर्शवित आहे.'
                : 'निवडलेल्या निकषानुसार सर्व स्त्रोत दर्शवित आहे.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-200">
              प्रलंबित संख्या: {filteredItems.filter((i) => i.isOverdue3Months).length}
            </span>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">
              अभिनंदन! कोणतेही प्रलंबित स्त्रोत सापडले नाहीत.
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              निवडलेल्या निकषामध्ये सर्व पाणी स्त्रोतांची अनुजीव तपासणी वेळेवर झालेली आहे किंवा फिल्टरचे निकष बदलून पहा.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">अ.क्र.</th>
                  <th className="py-3 px-3">उपकेंद्र</th>
                  <th className="py-3 px-3">गाव</th>
                  <th className="py-3 px-3">पाणी स्त्रोत नाव व प्रकार</th>
                  <th className="py-3 px-3">स्त्रोत कोड व पत्ता</th>
                  <th className="py-3 px-3 text-center">शेवटची तपासणी दिनांक</th>
                  <th className="py-3 px-3 text-center">शेवटचा निकाल</th>
                  <th className="py-3 px-3 text-center">प्रलंबित कालावधी</th>
                  <th className="py-3 px-3 text-center">तपासणी स्थिती</th>
                  <th className="py-3 px-3 text-center print:hidden">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredItems.map((item, idx) => {
                  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  let statusText = 'वेळेवर तपासलेले';

                  if (item.isNeverTested) {
                    badgeColor = 'bg-purple-100 text-purple-900 border-purple-300 font-black';
                    statusText = 'कधीही तपासणी नाही';
                  } else if (item.isOverdue6Months) {
                    badgeColor = 'bg-rose-100 text-rose-900 border-rose-300 font-black';
                    statusText = '> ६ महिने प्रलंबित';
                  } else if (item.isOverdue3Months) {
                    badgeColor = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
                    statusText = '> ३ महिने प्रलंबित';
                  }

                  return (
                    <tr
                      key={item.source.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        item.isNeverTested
                          ? 'bg-purple-50/20'
                          : item.isOverdue6Months
                          ? 'bg-rose-50/20'
                          : item.isOverdue3Months
                          ? 'bg-amber-50/15'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {item.subcenterName}
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {item.villageName}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{item.sourceName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {item.sourceType}
                          </span>
                          {item.testedThisMonth && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                              चालू महिना संकलित
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="font-mono text-[11px] font-bold text-slate-700">
                          {item.sourceCode}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate" title={item.locationAddress}>
                          {item.locationAddress || '-'}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {item.lastTestedDate ? (
                          <span className="font-semibold text-slate-800">
                            {item.lastTestedDate}
                          </span>
                        ) : (
                          <span className="text-purple-700 font-bold italic">
                            कधीही नाही
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {item.lastResult && item.lastResult !== '-' ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              item.lastResult.includes('योग्य')
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.lastResult}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {item.daysSinceLastTest !== null ? (
                          <div>
                            <span
                              className={`font-black ${
                                item.daysSinceLastTest > 180
                                  ? 'text-rose-700'
                                  : item.daysSinceLastTest > 90
                                  ? 'text-amber-700'
                                  : 'text-slate-700'
                              }`}
                            >
                              {item.daysSinceLastTest} दिवस
                            </span>
                            <div className="text-[10px] text-slate-500">
                              ({item.monthsSinceLastTest} महिने)
                            </div>
                          </div>
                        ) : (
                          <span className="text-purple-700 font-bold">नोंद नाही</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-[10px] border ${badgeColor}`}
                        >
                          {statusText}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap print:hidden">
                        {onNavigateToSampleEntry ? (
                          <button
                            onClick={() =>
                              onNavigateToSampleEntry({
                                sampleTypeId: 'ST-001',
                                subcenterId: item.subcenterId,
                                villageId: item.villageId,
                                sourceId: item.source.id,
                                sourceName: item.sourceName,
                              })
                            }
                            className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                            title="या स्त्रोताचा पाणी नमुना नोंदवा"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>नमुना नोंदवा</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>
              एकूण प्रलंबित स्त्रोत: <strong>{filteredItems.filter((i) => i.isOverdue3Months).length}</strong> / एकूण स्त्रोत:{' '}
              <strong>{reportData.stats.totalWaterSources}</strong> (अनुपालन दर:{' '}
              <strong>{reportData.stats.complianceRate}%</strong>)
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
              कधीही तपासणी नाही
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              &gt; ६ महिने प्रलंबित
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              &gt; ३ महिने प्रलंबित
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              वेळेवर (&lt; ९० दिवस)
            </span>
          </div>
        </div>
      </div>

      {/* Official Government Print Letterhead Section (Shown on Print) */}
      <div className="hidden print:block mt-8 pt-6 border-t-2 border-slate-800 text-slate-900 text-xs">
        <div className="text-center space-y-1 mb-4">
          <div className="font-bold text-sm uppercase tracking-wider">महाराष्ट्र शासन — सार्वजनिक आरोग्य विभाग</div>
          <div className="font-black text-base">प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर</div>
          <div className="font-bold text-xs underline">
            मागील ३ महिन्यांपासून अनुजीव (Bacteriological) तपासणी न झालेल्या पाणी स्त्रोतांची यादी व कृती अहवाल
          </div>
          <div className="text-[11px] text-slate-600">दिनांक: {referenceDate} रोजीची स्थिती</div>
        </div>

        <div className="grid grid-cols-3 gap-8 mt-16 text-center pt-8 border-t border-slate-400">
          <div>
            <div className="font-bold">आरोग्य कर्मचारी / सहाय्यक</div>
            <div className="text-[10px] text-slate-600">पाणी नमुना संकलन पथक</div>
          </div>
          <div>
            <div className="font-bold">औषध निर्माण अधिकारी / प्रयोगशाळा सहाय्यक</div>
            <div className="text-[10px] text-slate-600">प्रा.आ.केंद्र भादा</div>
          </div>
          <div>
            <div className="font-bold">वैद्यकीय अधिकारी वर्ग-१</div>
            <div className="text-[10px] text-slate-600">प्राथमिक आरोग्य केंद्र भादा</div>
          </div>
        </div>
      </div>

      {/* Official Government Formatted PDF Modal */}
      <OfficialReportPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        reportTitle="३ महिने जैविक पाणी नमुना प्रलंबित स्त्रोत अहवाल"
        reportSubtitle="प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर — सार्वजनिक आरोग्य विभाग"
        documentNumber={`जा.क्र./प्राआकेंभादा/पाणी-विलंब/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`}
        periodText={`संदर्भ दिनांक: ${referenceDate}`}
        filterDetails={[
          {
            label: 'उपकेंद्र',
            value:
              selectedSubcenterId === 'ALL'
                ? 'सर्व उपकेंद्रे'
                : subcenters.find((s) => s.id === selectedSubcenterId)?.subcenterName || selectedSubcenterId,
          },
          {
            label: 'गाव',
            value:
              selectedVillageId === 'ALL'
                ? 'सर्व गावे'
                : villages.find((v) => v.id === selectedVillageId)?.name || selectedVillageId,
          },
          {
            label: 'वर्गवारी',
            value:
              filterCategory === 'OVERDUE_ONLY'
                ? 'प्रलंबित स्त्रोत'
                : filterCategory === 'OVERDUE_3M'
                ? '३ ते ६ महिने'
                : filterCategory === 'OVERDUE_6M'
                ? '> ६ महिने'
                : filterCategory === 'CRITICAL_NEVER'
                ? 'कधीही तपासणी नाही'
                : 'सर्व',
          },
        ]}
        summaryStats={[
          { label: 'एकूण स्त्रोत', value: reportData.stats.totalWaterSources, colorClass: 'text-slate-900' },
          { label: '३+ महिने प्रलंबित', value: reportData.stats.overdue3MonthsCount, colorClass: 'text-rose-700' },
          { label: '६+ महिने प्रलंबित', value: reportData.stats.overdue6MonthsCount, colorClass: 'text-purple-700' },
          { label: 'कधीही न तपासलेले', value: reportData.stats.neverTestedCount, colorClass: 'text-red-800' },
          { label: 'वेळेवर तपासलेले', value: reportData.stats.testedIn3MonthsCount, colorClass: 'text-emerald-700' },
        ]}
        columns={[
          { header: 'स्त्रोत कोड', accessor: 'sourceCode', align: 'center', width: '85px' },
          { header: 'स्त्रोत नाव व पत्ता', accessor: 'sourceName', width: '160px' },
          { header: 'उपकेंद्र', accessor: 'subcenterName', width: '110px' },
          { header: 'गाव', accessor: 'villageName', width: '100px' },
          { header: 'स्त्रोत प्रकार', accessor: 'sourceType', width: '100px' },
          { header: 'शेवटचा नमुना दिनांक', accessor: 'lastTestedDate', align: 'center', width: '100px' },
          { header: 'विलंब (दिवस)', accessor: 'daysSinceLastTest', align: 'center', width: '85px' },
          { header: 'जोखीम वर्गवारी', accessor: 'riskCategory', align: 'center', width: '100px' },
        ]}
        data={filteredItems.map((item) => ({
          sourceCode: item.sourceCode,
          sourceName: `${item.sourceName}${item.locationAddress ? ` (${item.locationAddress})` : ''}`,
          subcenterName: item.subcenterName,
          villageName: item.villageName,
          sourceType: item.sourceType,
          lastTestedDate: item.lastTestedDate || 'कधीही नाही',
          daysSinceLastTest: item.daysSinceLastTest !== null ? `${item.daysSinceLastTest} दिवस` : 'कधीही नाही',
          riskCategory: item.isNeverTested
            ? 'अत्यंत गंभीर'
            : item.isOverdue6Months
            ? 'उच्च जोखीम (>६ महिने)'
            : item.isOverdue3Months
            ? 'मध्यम जोखीम (>३ महिने)'
            : 'सामान्य',
        }))}
        orientationDefault="landscape"
        currentUser={currentUser}
        customRemarks="सदर अहवालानुसार ३ महिन्यांपेक्षा अधिक काळ तपासणी न झालेल्या सर्व पाणी स्त्रोतांचे तात्काळ नमुने संकलित करून जिल्हा प्रयोगशाळेत पाठविण्याचे आदेश देण्यात येत आहेत."
      />
    </div>
  );
};
