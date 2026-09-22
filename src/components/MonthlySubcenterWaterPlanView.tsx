import React, { useState, useMemo } from 'react';
import { clientStore } from '../services/clientStore';
import { User, SubcenterMonthlyWaterPlan, WaterSourceMonthlyStatusItem } from '../types';
import {
  Calendar,
  Building2,
  Droplets,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  PlusCircle,
  Eye,
  Percent,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MonthlySubcenterWaterPlanViewProps {
  currentUser: User;
  onNavigateToSampleEntry?: (sourceInfo: {
    sampleTypeId: string;
    subcenterId: string;
    villageId: string;
    sourceId: string;
    sourceName: string;
  }) => void;
}

const MONTHS_MARATHI = [
  { value: 1, label: 'जानेवारी (Jan)', name: 'जानेवारी' },
  { value: 2, label: 'फेब्रुवारी (Feb)', name: 'फेब्रुवारी' },
  { value: 3, label: 'मार्च (Mar)', name: 'मार्च' },
  { value: 4, label: 'एप्रिल (Apr)', name: 'एप्रिल' },
  { value: 5, label: 'मे (May)', name: 'मे' },
  { value: 6, label: 'जून (Jun)', name: 'जून' },
  { value: 7, label: 'जुलै (Jul)', name: 'जुलै' },
  { value: 8, label: 'ऑगस्ट (Aug)', name: 'ऑगस्ट' },
  { value: 9, label: 'सप्टेंबर (Sep)', name: 'सप्टेंबर' },
  { value: 10, label: 'ऑक्टोबर (Oct)', name: 'ऑक्टोबर' },
  { value: 11, label: 'नोव्हेंबर (Nov)', name: 'नोव्हेंबर' },
  { value: 12, label: 'डिसेंबर (Dec)', name: 'डिसेंबर' },
];

export const MonthlySubcenterWaterPlanView: React.FC<MonthlySubcenterWaterPlanViewProps> = ({
  currentUser,
  onNavigateToSampleEntry,
}) => {
  const subcenters = clientStore.getSubcenters();

  // Filters
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // September default
  const [selectedSubcenterId, setSelectedSubcenterId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TESTED_ONLY' | 'PENDING_ONLY' | 'OVERDUE_ONLY'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Accordion open states
  const [expandedSubcenters, setExpandedSubcenters] = useState<Record<string, boolean>>({
    'SC-LKH-01': true,
    'SC-BHD-01': true,
    'SC-UTI-01': true,
    'SC-ASH-01': true,
    'SC-UJN-01': true,
    'SC-LHT-01': true,
    'SC-BRG-01': true,
  });

  const toggleSubcenter = (id: string) => {
    setExpandedSubcenters((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    subcenters.forEach((sc) => {
      next[sc.id] = true;
    });
    setExpandedSubcenters(next);
  };

  const collapseAll = () => {
    setExpandedSubcenters({});
  };

  // Query subcenter monthly water plan from store
  const planData = useMemo(() => {
    return clientStore.getMonthlySubcenterWaterPlan(
      selectedYear,
      selectedMonth,
      selectedSubcenterId
    );
  }, [selectedYear, selectedMonth, selectedSubcenterId]);

  // Selected month object
  const selectedMonthObj = MONTHS_MARATHI.find((m) => m.value === selectedMonth) || MONTHS_MARATHI[8];

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'अ.क्र.',
      'उपकेंद्र कोड',
      'उपकेंद्र नाव',
      'गाव',
      'पाणी स्त्रोताचे नाव',
      'प्रकार',
      'स्त्रोत कोड',
      'पत्ता / जागा',
      `${selectedMonthObj.name} ${selectedYear} स्थिती`,
      'संकलन दिनांक',
      'बाटली क्र. / नमुना क्रमांक',
      'प्रयोगशाळा निकाल',
      'मागील तपासणी दिनांक',
      '३ महिने प्रलंबित कालावधी',
    ];

    let rowIdx = 1;
    const rows: (string | number)[][] = [];

    planData.plans.forEach((plan) => {
      plan.sourcesList.forEach((src) => {
        if (statusFilter === 'TESTED_ONLY' && !src.testedThisMonth) return;
        if (statusFilter === 'PENDING_ONLY' && src.testedThisMonth) return;
        if (statusFilter === 'OVERDUE_ONLY' && !src.isOverdue3Months) return;

        rows.push([
          rowIdx++,
          `"${plan.subcenterCode}"`,
          `"${plan.subcenterName}"`,
          `"${src.villageName}"`,
          `"${src.sourceName}"`,
          `"${src.sourceType}"`,
          `"${src.sourceCode}"`,
          `"${src.locationAddress}"`,
          src.testedThisMonth ? 'संकलित (Tested)' : 'संकलन बाकी (Pending)',
          src.thisMonthSample?.collectionDate || '-',
          `"${src.thisMonthSample?.sampleCodeOrBottleNo || src.thisMonthSample?.id || '-'}"`,
          `"${src.thisMonthSample?.result || src.lastResult || '-'}"`,
          src.lastTestedDate || 'कधीही नाही',
          src.isOverdue3Months ? 'होय (>३ महिने प्रलंबित)' : 'नाही (वेळेवर)',
        ]);
      });
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `PHC_Bhada_Monthly_Subcenter_Water_List_${selectedMonthObj.name}_${selectedYear}.csv`
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
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white rounded-xl p-5 shadow-sm border border-teal-800/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-200 text-xs font-bold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4 text-teal-300" />
              मासिक पाणी नमुने संकलन व तपासणी कृती आराखडा
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              दरमहा उपकेंद्रनिहाय पाणी नमुने यादी व प्रगती — {selectedMonthObj.name} {selectedYear}
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/90 mt-1 max-w-3xl">
              प्राथमिक आरोग्य केंद्र भादा कार्यक्षेत्रातील सर्व ७ उपकेंद्रांमधील पाणी स्त्रोतांचे मासिक संकलन नियोजन, संकलित नमुने व उर्वरित प्रलंबित स्त्रोतांची माहिती.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
              title="मासिक यादी प्रिंट करा"
            >
              <Printer className="w-4 h-4 text-teal-200" />
              <span>प्रिंट अहवाल</span>
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

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Subcenters */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase">उपकेंद्र संख्या</span>
            <Building2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{planData.plans.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">कार्यक्षेत्रातील उपकेंद्रे</div>
        </div>

        {/* Total Registered Sources */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase">एकूण पाणी स्त्रोत</span>
            <Droplets className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{planData.overall.totalSources}</div>
          <div className="text-[10px] text-slate-500 mt-1">सर्व उपकेंद्रांतील स्त्रोत</div>
        </div>

        {/* Tested This Month */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'TESTED_ONLY' ? 'ALL' : 'TESTED_ONLY')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'TESTED_ONLY'
              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300'
              : 'bg-white border-slate-200 hover:bg-emerald-50/40'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-bold uppercase">या महिन्यात संकलित</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800">{planData.overall.totalTestedThisMonth}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">
            {selectedMonthObj.name} मधील नमुने
          </div>
        </div>

        {/* Pending This Month */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'PENDING_ONLY' ? 'ALL' : 'PENDING_ONLY')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'PENDING_ONLY'
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-300'
              : 'bg-white border-slate-200 hover:bg-amber-50/40'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-bold uppercase">संकलन बाकी</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-800">{planData.overall.totalPendingThisMonth}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">या महिन्यात बाकी स्रोत</div>
        </div>

        {/* Overall Coverage Percentage */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase">मासिक कव्हरेज</span>
            <Percent className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900">
            {planData.overall.overallCoveragePercentage}%
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${planData.overall.overallCoveragePercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Month Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-700" />
              महिना निवडा:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              {MONTHS_MARATHI.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-700" />
              वर्ष निवडा:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value={2026}>२०२६ (2026)</option>
              <option value={2025}>२०२५ (2025)</option>
              <option value={2027}>२०२७ (2027)</option>
            </select>
          </div>

          {/* Subcenter Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-teal-700" />
              उपकेंद्र निवडा:
            </label>
            <select
              value={selectedSubcenterId}
              onChange={(e) => setSelectedSubcenterId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="ALL">सर्व ७ उपकेंद्रे</option>
              {subcenters.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.subcenterName} ({sc.subcenterCode})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-teal-700" />
              स्त्रोत स्थिती:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="ALL">सर्व स्त्रोत</option>
              <option value="TESTED_ONLY">या महिन्यात संकलित झालेले</option>
              <option value="PENDING_ONLY">या महिन्यात संकलन बाकी</option>
              <option value="OVERDUE_ONLY">&gt; ३ महिने प्रलंबित स्रोत</option>
            </select>
          </div>
        </div>

        {/* Search and Layout Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="स्त्रोत नाव, कोड, गाव किंवा पत्ता शोधा..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('CARDS')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  viewMode === 'CARDS'
                    ? 'bg-white text-teal-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                उपकेंद्रनिहाय गट
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-teal-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                एकत्रित यादी
              </button>
            </div>

            {viewMode === 'CARDS' && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
                <button
                  onClick={expandAll}
                  className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 font-bold"
                >
                  सर्व उघडा
                </button>
                <span>|</span>
                <button
                  onClick={collapseAll}
                  className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 font-bold"
                >
                  सर्व बंद करा
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VIEW A: Subcenter-by-Subcenter Cards / Accordion */}
      {viewMode === 'CARDS' && (
        <div className="space-y-4">
          {planData.plans.map((plan) => {
            const isExpanded = Boolean(expandedSubcenters[plan.subcenterId]);

            // Filter sources of this subcenter
            const subcenterSources = plan.sourcesList.filter((src) => {
              if (statusFilter === 'TESTED_ONLY' && !src.testedThisMonth) return false;
              if (statusFilter === 'PENDING_ONLY' && src.testedThisMonth) return false;
              if (statusFilter === 'OVERDUE_ONLY' && !src.isOverdue3Months) return false;

              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                return (
                  src.sourceName.toLowerCase().includes(q) ||
                  src.sourceCode.toLowerCase().includes(q) ||
                  src.villageName.toLowerCase().includes(q) ||
                  src.sourceType.toLowerCase().includes(q) ||
                  src.locationAddress.toLowerCase().includes(q)
                );
              }
              return true;
            });

            return (
              <div
                key={plan.subcenterId}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all"
              >
                {/* Header / Accordion trigger */}
                <div
                  onClick={() => toggleSubcenter(plan.subcenterId)}
                  className="p-4 bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 select-none"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-teal-700" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {plan.subcenterCode}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base">
                          उपकेंद्र: {plan.subcenterName}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        एकूण पिण्याचे स्त्रोत: <strong>{plan.totalSources}</strong> | चालू महिन्यात संकलित:{' '}
                        <strong className="text-emerald-700">{plan.testedThisMonthCount}</strong> | बाकी:{' '}
                        <strong className="text-amber-700">{plan.pendingThisMonthCount}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="w-28 sm:w-36">
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span className="text-slate-600">प्रगती</span>
                        <span className="text-teal-900">{plan.coveragePercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            plan.coveragePercentage === 100
                              ? 'bg-emerald-500'
                              : plan.coveragePercentage >= 50
                              ? 'bg-teal-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${plan.coveragePercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        plan.pendingThisMonthCount === 0
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      {plan.pendingThisMonthCount === 0 ? 'पूर्ण (100%)' : `${plan.pendingThisMonthCount} बाकी`}
                    </span>
                  </div>
                </div>

                {/* Expanded Source List */}
                {isExpanded && (
                  <div className="border-t border-slate-200 overflow-x-auto">
                    {subcenterSources.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        निवडलेल्या निकषानुसार या उपकेंद्रामध्ये कोणतेही पाणी स्त्रोत सापडले नाहीत.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                            <th className="py-2.5 px-3 w-10 text-center">अ.क्र.</th>
                            <th className="py-2.5 px-3">गाव</th>
                            <th className="py-2.5 px-3">पाणी स्त्रोताचे नाव व प्रकार</th>
                            <th className="py-2.5 px-3">स्त्रोत कोड व पत्ता</th>
                            <th className="py-2.5 px-3 text-center">
                              {selectedMonthObj.name} {selectedYear} संकलन स्थिती
                            </th>
                            <th className="py-2.5 px-3 text-center">मागील तपासणी दिनांक</th>
                            <th className="py-2.5 px-3 text-center">३ महिने स्थिती</th>
                            <th className="py-2.5 px-3 text-center print:hidden">कृती</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {subcenterSources.map((src, idx) => (
                            <tr
                              key={src.source.id}
                              className={`hover:bg-slate-50 transition-colors ${
                                src.testedThisMonth
                                  ? 'bg-emerald-50/20'
                                  : src.isOverdue3Months
                                  ? 'bg-rose-50/25'
                                  : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                                {idx + 1}
                              </td>

                              <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                                {src.villageName}
                              </td>

                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">{src.sourceName}</div>
                                <div className="text-[11px] text-slate-500">
                                  प्रकार: <span className="font-semibold text-slate-700">{src.sourceType}</span>
                                </div>
                              </td>

                              <td className="py-2.5 px-3 max-w-[200px]">
                                <div className="font-mono text-[11px] font-bold text-slate-700">
                                  {src.sourceCode}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {src.locationAddress || '-'}
                                </div>
                              </td>

                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                {src.testedThisMonth ? (
                                  <div>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      संकलित (दि. {src.thisMonthSample?.collectionDate})
                                    </span>
                                    {src.thisMonthSample?.sampleCodeOrBottleNo && (
                                      <div className="text-[10px] text-slate-500 mt-0.5">
                                        बाटली क्र: <strong>{src.thisMonthSample.sampleCodeOrBottleNo}</strong>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    या महिन्यात संकलन बाकी
                                  </span>
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                {src.lastTestedDate ? (
                                  <div>
                                    <span className="font-semibold text-slate-800">{src.lastTestedDate}</span>
                                    {src.lastResult && src.lastResult !== '-' && (
                                      <div className="text-[10px] text-slate-500">
                                        निकाल: <strong className={src.lastResult.includes('योग्य') ? 'text-emerald-700' : 'text-rose-700'}>{src.lastResult}</strong>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-purple-700 font-bold italic">कधीही नाही</span>
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                {src.isOverdue3Months ? (
                                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                    &gt; ३ महिने प्रलंबित
                                  </span>
                                ) : (
                                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                    वेळेवर
                                  </span>
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-center whitespace-nowrap print:hidden">
                                {onNavigateToSampleEntry ? (
                                  <button
                                    onClick={() =>
                                      onNavigateToSampleEntry({
                                        sampleTypeId: 'ST-001',
                                        subcenterId: plan.subcenterId,
                                        villageId: src.villageId,
                                        sourceId: src.source.id,
                                        sourceName: src.sourceName,
                                      })
                                    }
                                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 ${
                                      src.testedThisMonth
                                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                                        : 'bg-teal-700 hover:bg-teal-800 text-white'
                                    }`}
                                  >
                                    <PlusCircle className="w-3.5 h-3.5" />
                                    <span>{src.testedThisMonth ? 'पुन्हा नमुना' : 'नमुना नोंदवा'}</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-xs">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW B: Unified Master Table */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              सर्व उपकेंद्रांमधील पाणी स्त्रोत मास्टर यादी — {selectedMonthObj.name} {selectedYear}
            </h3>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              एकूण स्त्रोत: {planData.overall.totalSources}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">अ.क्र.</th>
                  <th className="py-3 px-3">उपकेंद्र</th>
                  <th className="py-3 px-3">गाव</th>
                  <th className="py-3 px-3">पाणी स्त्रोताचे नाव</th>
                  <th className="py-3 px-3">प्रकार व कोड</th>
                  <th className="py-3 px-3 text-center">{selectedMonthObj.name} स्थिती</th>
                  <th className="py-3 px-3 text-center">मागील तपासणी दिनांक</th>
                  <th className="py-3 px-3 text-center">३ महिने स्थिती</th>
                  <th className="py-3 px-3 text-center print:hidden">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(() => {
                  let allItems: { plan: SubcenterMonthlyWaterPlan; src: WaterSourceMonthlyStatusItem }[] = [];
                  planData.plans.forEach((p) => {
                    p.sourcesList.forEach((s) => {
                      if (statusFilter === 'TESTED_ONLY' && !s.testedThisMonth) return;
                      if (statusFilter === 'PENDING_ONLY' && s.testedThisMonth) return;
                      if (statusFilter === 'OVERDUE_ONLY' && !s.isOverdue3Months) return;

                      if (searchQuery.trim()) {
                        const q = searchQuery.toLowerCase().trim();
                        const match =
                          s.sourceName.toLowerCase().includes(q) ||
                          s.sourceCode.toLowerCase().includes(q) ||
                          s.villageName.toLowerCase().includes(q) ||
                          p.subcenterName.toLowerCase().includes(q);
                        if (!match) return;
                      }

                      allItems.push({ plan: p, src: s });
                    });
                  });

                  if (allItems.length === 0) {
                    return (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-xs text-slate-500">
                          कोणतीही नोंद सापडली नाही.
                        </td>
                      </tr>
                    );
                  }

                  return allItems.map(({ plan, src }, idx) => (
                    <tr
                      key={`${plan.subcenterId}-${src.source.id}`}
                      className={`hover:bg-slate-50 transition-colors ${
                        src.testedThisMonth ? 'bg-emerald-50/15' : src.isOverdue3Months ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {plan.subcenterName}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {src.villageName}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{src.sourceName}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[11px] text-slate-700">{src.sourceCode}</span>{' '}
                        <span className="text-slate-500">({src.sourceType})</span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {src.testedThisMonth ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            संकलित (दि. {src.thisMonthSample?.collectionDate})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            संकलन बाकी
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {src.lastTestedDate || <span className="text-purple-700 italic">कधीही नाही</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {src.isOverdue3Months ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            &gt; ३ महिने प्रलंबित
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">वेळेवर</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap print:hidden">
                        {onNavigateToSampleEntry && (
                          <button
                            onClick={() =>
                              onNavigateToSampleEntry({
                                sampleTypeId: 'ST-001',
                                subcenterId: plan.subcenterId,
                                villageId: src.villageId,
                                sourceId: src.source.id,
                                sourceName: src.sourceName,
                              })
                            }
                            className="text-xs font-bold text-teal-700 hover:text-teal-900 underline"
                          >
                            नमुना नोंदवा
                          </button>
                        )}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official Government Submission Letterhead (Shown on Print) */}
      <div className="hidden print:block mt-8 pt-6 border-t-2 border-slate-800 text-slate-900 text-xs">
        <div className="text-center space-y-1 mb-4">
          <div className="font-bold text-sm uppercase tracking-wider">महाराष्ट्र शासन — सार्वजनिक आरोग्य विभाग</div>
          <div className="font-black text-base">प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर</div>
          <div className="font-bold text-xs underline">
            उपकेंद्रनिहाय मासिक पाणी नमुने संकलन कृती आराखडा व गुणवत्ता अहवाल — महिना: {selectedMonthObj.name} {selectedYear}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 mt-16 text-center pt-8 border-t border-slate-400">
          <div>
            <div className="font-bold">आरोग्य कर्मचारी / सहाय्यक</div>
            <div className="text-[10px] text-slate-600">उपकेंद्र पाणी संकलन प्रमुख</div>
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
    </div>
  );
};
