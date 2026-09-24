import React, { useState } from 'react';
import { clientStore } from '../services/clientStore';
import {
  Activity,
  Droplets,
  TestTube,
  Sparkles,
  FlaskConical,
  Bug,
  HeartPulse,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  Building2,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  ShieldCheck,
  Send,
  Calendar,
  AlertTriangle,
  Layers,
  UploadCloud,
  X,
  Printer,
  ChevronRight,
  ExternalLink,
  Edit,
  Search,
  Check,
} from 'lucide-react';
import { SampleRecord, SampleTypeMaster, SourceMaster, User, VillageMaster } from '../types';

interface DashboardModuleProps {
  onNavigate: (tab: string, filter?: Record<string, string>) => void;
  currentUser: User;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({ onNavigate, currentUser }) => {
  const stats = clientStore.getDashboardStats();
  const sampleTypes = clientStore.getSampleTypes();
  const allSamples = clientStore.getSamples();
  const recentSamples = allSamples.slice(0, 6);
  const auditLogs = clientStore.getAuditLogs().slice(0, 5);
  const villages = clientStore.getVillages();
  const subcenters = clientStore.getSubcenters();

  // Water surveillance status
  const waterDueReport = clientStore.getWaterSourcesBiologicalDueReport();
  const monthlyWaterPlan = clientStore.getMonthlySubcenterWaterPlan(2026, 9);

  // Modals state for interactive click-throughs
  const [selectedSample, setSelectedSample] = useState<SampleRecord | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<VillageMaster | null>(null);
  const [showTodaySamplesModal, setShowTodaySamplesModal] = useState<boolean>(false);
  const [showPendingModal, setShowPendingModal] = useState<boolean>(false);

  // Today's date string
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySamplesList = allSamples.filter((s) => s.collectionDate === todayStr);
  const pendingSamplesList = allSamples.filter(
    (s) => s.status !== 'Report Received' && s.status !== 'Report Updated'
  );

  const getSampleIcon = (codePrefix: string) => {
    switch (codePrefix) {
      case 'WS-BIO':
        return <Droplets className="w-5 h-5 text-cyan-600" />;
      case 'WS-CHM':
        return <TestTube className="w-5 h-5 text-emerald-600" />;
      case 'SLT':
        return <Sparkles className="w-5 h-5 text-indigo-600" />;
      case 'TCL':
        return <FlaskConical className="w-5 h-5 text-amber-600" />;
      case 'MSL':
        return <HeartPulse className="w-5 h-5 text-purple-600" />;
      case 'DNG':
        return <Bug className="w-5 h-5 text-rose-600" />;
      default:
        return <Activity className="w-5 h-5 text-slate-600" />;
    }
  };

  // Helper to get water sources for selected village
  const getVillageSources = (villageId: string) => {
    return clientStore.getSources(villageId);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-xl p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            प्राथमिक आरोग्य केंद्र भादा — तालुका औसा, जिल्हा लातूर
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            नमुना व्यवस्थापन व प्रयोगशाळा अहवाल केंद्र
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5 max-w-2xl">
            सर्व पाणी जैविक/रासायनिक, मीठ, ब्लिचिंग पावडर (TCL), गोवर व डेंग्यू/चिकनगुनिया सीरम नमुने, जावक पत्रे व अहवाल नोंदवही
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => onNavigate('sample-entry')}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-white text-emerald-900 hover:bg-emerald-50 px-4 py-2.5 rounded-lg font-bold text-xs shadow transition-all active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-700" />
            <span>नवीन नमुना नोंदवा</span>
          </button>
          <button
            onClick={() => onNavigate('sending-letters')}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-emerald-700/80 hover:bg-emerald-700 text-white border border-emerald-500/50 px-3.5 py-2.5 rounded-lg font-semibold text-xs shadow transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 text-emerald-200" />
            <span>जावक पत्र तयार करा</span>
          </button>
          <button
            onClick={() => onNavigate('report-update')}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-emerald-950/70 hover:bg-emerald-950 text-white px-3.5 py-2.5 rounded-lg font-semibold text-xs shadow transition-all border border-emerald-700/60 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>अहवाल नोंदणी</span>
          </button>
          <button
            onClick={() => onNavigate('monthly-report')}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-lg font-bold text-xs shadow transition-all border border-emerald-400/60 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-emerald-100" />
            <span>मासिक नमुना अहवाल</span>
          </button>
          <button
            onClick={() => onNavigate('data-migration')}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-teal-900 hover:bg-teal-950 text-emerald-200 border border-teal-600/60 px-3.5 py-2.5 rounded-lg font-bold text-xs shadow transition-all cursor-pointer"
            title="Upload old samples, water sources, subcenters & villages"
          >
            <UploadCloud className="w-4 h-4 text-emerald-300" />
            <span>जुना डेटा आयात</span>
          </button>
        </div>
      </div>

      {/* KPI Grid - All Clickable with Interactive Details & Workflows */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total Samples */}
        <div
          onClick={() => onNavigate('master-register', { statusFilter: 'ALL' })}
          className="group bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md hover:bg-emerald-50/20 transition-all cursor-pointer relative overflow-hidden"
          title="सर्व नमुने पाहण्यासाठी क्लिक करा"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-emerald-800">एकूण नमुने</span>
            <Activity className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900 group-hover:text-emerald-900">{stats.totalSamples}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center justify-between">
            <span>नोंदवहीत पहा</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* 2. Today's Samples */}
        <div
          onClick={() => {
            if (stats.todaySamples > 0) {
              setShowTodaySamplesModal(true);
            } else {
              onNavigate('sample-entry');
            }
          }}
          className="group bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md hover:bg-blue-50/20 transition-all cursor-pointer relative overflow-hidden"
          title="आजच्या नमुन्यांची यादी व कारवाईसाठी क्लिक करा"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-blue-800">आजचे नमुने</span>
            <Clock className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-blue-900">{stats.todaySamples}</div>
          <div className="text-[10px] text-blue-700 font-semibold mt-1 flex items-center justify-between">
            <span>{stats.todaySamples > 0 ? 'तपशील / जावक पत्र' : '+ नवीन नोंदवा'}</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* 3. This Month */}
        <div
          onClick={() => onNavigate('monthly-report', { initialTab: 'monthly' })}
          className="group bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-purple-500 hover:shadow-md hover:bg-purple-50/20 transition-all cursor-pointer relative overflow-hidden"
          title="चालू महिन्याचा नमुना अहवाल पाहण्यासाठी क्लिक करा"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-purple-800">चालू महिना</span>
            <TrendingUp className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-purple-900">{stats.monthSamples}</div>
          <div className="text-[10px] text-purple-700 font-semibold mt-1 flex items-center justify-between">
            <span>मासिक अहवाल पहा</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* 4. Dispatched */}
        <div
          onClick={() => onNavigate('sending-letters')}
          className="group bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-amber-500 hover:shadow-md hover:bg-amber-50/20 transition-all cursor-pointer relative overflow-hidden"
          title="पाठविलेले नमुने व जावक पत्रे पाहण्यासाठी क्लिक करा"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-amber-800">पाठविलेले</span>
            <Send className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-amber-900">{stats.dispatchedCount}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1 flex items-center justify-between">
            <span>जावक पत्र नोंदवही</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* 5. Reports Pending */}
        <div
          onClick={() => {
            if (stats.reportPendingCount > 0) {
              setShowPendingModal(true);
            } else {
              onNavigate('report-update');
            }
          }}
          className="group bg-white p-3.5 rounded-xl border border-rose-200 shadow-sm hover:border-rose-500 hover:shadow-md hover:bg-rose-50/30 transition-all cursor-pointer relative overflow-hidden"
          title="प्रलंबित अहवाल पाहण्यासाठी व नोंदणी करण्यासाठी क्लिक करा"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-rose-800">अहवाल प्रलंबित</span>
            <AlertCircle className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-rose-800">{stats.reportPendingCount}</div>
          <div className="text-[10px] text-rose-700 font-bold mt-1 flex items-center justify-between">
            <span>अहवाल नोंदवा →</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* 6. Reports Received */}
        <div
          onClick={() => onNavigate('master-register', { statusFilter: 'Report Received' })}
          className="group bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md hover:bg-emerald-50/20 transition-all cursor-pointer relative overflow-hidden"
          title="प्राप्त अहवाल पाहण्यासाठी क्लिक करा"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-emerald-800">अहवाल प्राप्त</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-emerald-800">{stats.reportReceivedCount}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center justify-between">
            <span>निकाल पहा</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* Special Water Surveillance Quick Alert Banner */}
      <div className="bg-gradient-to-r from-cyan-950 via-teal-900 to-slate-900 rounded-xl p-4 text-white shadow-md border border-cyan-800/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/40 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                जल सुरक्षा संनियंत्रण
              </span>
              <span className="text-xs text-cyan-200/80">पाणी नमुना अनुजीव (बायोलॉजिकल) तपासणी ट्रॅकर</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              मागील ३ महिन्यांपासून न तपासलेले स्रोत व उपकेंद्रनिहाय मासिक नियोजन
            </h3>
            <p className="text-xs text-slate-300 max-w-3xl">
              पीएचसी भादा कार्यक्षेत्रातील सर्व {waterDueReport.stats.totalWaterSources} पाणी स्त्रोतांचे संनियंत्रण. 
              {waterDueReport.stats.overdue3MonthsCount + waterDueReport.stats.overdue6MonthsCount + waterDueReport.stats.neverTestedCount > 0 && (
                <span className="text-rose-300 font-bold ml-1">
                  ({waterDueReport.stats.overdue3MonthsCount + waterDueReport.stats.overdue6MonthsCount + waterDueReport.stats.neverTestedCount} स्रोत ३+ महिने प्रलंबित आहेत!)
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('monthly-report', { initialTab: 'water-overdue-3m' })}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>३ महिने प्रलंबित स्रोत यादी ({waterDueReport.stats.overdue3MonthsCount + waterDueReport.stats.overdue6MonthsCount + waterDueReport.stats.neverTestedCount})</span>
            </button>
            <button
              onClick={() => onNavigate('monthly-report', { initialTab: 'monthly-water-subcenter' })}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 border border-teal-400/40 cursor-pointer"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>उपकेंद्रनिहाय मासिक नियोजन ({monthlyWaterPlan.overall.totalSources} स्रोत)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Sample Types Matrix - Interactive with Sub-badges */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-700" />
              नमुन्यांचा प्रकारानुसार तपशील (Sample Types Breakdown)
            </h3>
            <p className="text-xs text-slate-500">
              संबंधित नमुना प्रकारावर किंवा प्रलंबित/प्राप्त बटनावर क्लिक करून थेट अहवाल व नोंदवही उघडा
            </p>
          </div>
          <button
            onClick={() => onNavigate('master-register')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 self-start sm:self-center cursor-pointer"
          >
            <span>मास्टर नोंदवहीत सर्व पहा</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {stats.byTypeSummary.map((item) => (
            <div
              key={item.id}
              onClick={() => onNavigate('master-register', { sampleTypeId: item.id })}
              className="group p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 group-hover:border-emerald-400 shadow-2xs">
                      {getSampleIcon(item.codePrefix)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-900 leading-snug">
                        {item.name}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">{item.codePrefix}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900">{item.total}</div>
                    <div className="text-[10px] text-slate-500">एकूण</div>
                  </div>
                </div>
              </div>

              {/* Actionable Sub-Pills */}
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-200 text-center text-xs">
                {/* Pending */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.pending > 0) {
                      onNavigate('report-update', { sampleTypeId: item.id, statusFilter: 'Pending' });
                    } else {
                      onNavigate('master-register', { sampleTypeId: item.id });
                    }
                  }}
                  className="bg-amber-50 hover:bg-amber-100 p-1.5 rounded border border-amber-200 text-left transition-colors cursor-pointer"
                  title="या नमुन्यांचे प्रलंबित अहवाल भरा"
                >
                  <div className="text-[10px] text-amber-800 font-medium">प्रलंबित</div>
                  <div className="font-bold text-amber-900 flex items-center justify-between">
                    <span>{item.pending}</span>
                    {item.pending > 0 && <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded font-normal">भरा</span>}
                  </div>
                </button>

                {/* Received */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('master-register', { sampleTypeId: item.id, statusFilter: 'Report Received' });
                  }}
                  className="bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded border border-emerald-200 text-left transition-colors cursor-pointer"
                  title="प्राप्त अहवाल पहा"
                >
                  <div className="text-[10px] text-emerald-800 font-medium">प्राप्त</div>
                  <div className="font-bold text-emerald-900 flex items-center justify-between">
                    <span>{item.received}</span>
                    <span className="text-[9px] text-emerald-700 font-normal">पहा</span>
                  </div>
                </button>

                {/* Fit */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('master-register', { sampleTypeId: item.id, resultFilter: 'FIT' });
                  }}
                  className="bg-blue-50 hover:bg-blue-100 p-1.5 rounded border border-blue-200 text-left transition-colors cursor-pointer"
                  title="योग्य व प्रमाणित निकाल पहा"
                >
                  <div className="text-[10px] text-blue-800 font-medium">योग्य/प्रमाणित</div>
                  <div className="font-bold text-blue-900 flex items-center justify-between">
                    <span>{item.fitCount}</span>
                    <span className="text-[9px] text-blue-700 font-normal">पहा</span>
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Columns: Recent Samples & Village Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Samples List (Clickable with full details & workflows) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                अलीकडील नमुना नोंदी (Recent Samples)
              </h3>
              <p className="text-xs text-slate-500">तपशील पाहण्यासाठी व पुढील कारवाईसाठी कोणत्याही नमुन्यावर क्लिक करा</p>
            </div>
            <button
              onClick={() => onNavigate('master-register')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <span>सर्व पहा</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentSamples.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">कोणतेही नमुने नोंदवलेले नाहीत.</div>
            ) : (
              recentSamples.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => setSelectedSample(sample)}
                  className="py-2.5 px-2 rounded-lg hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="px-2 py-1 bg-slate-100 group-hover:bg-emerald-100 text-slate-800 group-hover:text-emerald-900 text-[11px] font-mono font-bold rounded border border-slate-300 group-hover:border-emerald-300 transition-colors">
                      {sample.id}
                    </span>
                    <div>
                      <div className="font-semibold text-xs text-slate-900 group-hover:text-emerald-800 transition-colors">
                        {sample.villageName} — {sample.sourceName || sample.patientName || sample.shopOrInstitutionName || sample.sampleTypeName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>दिनांक: {sample.collectionDate}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">{sample.sampleTypeName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        sample.status === 'Report Received' || sample.status === 'Report Updated'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : sample.status === 'Dispatched'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {sample.status}
                    </span>
                    {sample.result && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          sample.result.includes('योग्य') || sample.result.includes('प्रमाणित') || sample.result === 'निगेटिव्ह'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {sample.result}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Village Master Quick View (Clickable to open Village Workflow Modal) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                गाव निहाय स्थिती (Villages)
              </h3>
              <p className="text-xs text-slate-500">{stats.activeVillagesCount} कार्यरत गावे (क्लिक करून तपशील पहा)</p>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {stats.byVillageSummary.map((v) => {
              const villageObj = villages.find((item) => item.id === v.id);
              return (
                <div
                  key={v.id}
                  onClick={() => {
                    if (villageObj) {
                      setSelectedVillage(villageObj);
                    } else {
                      onNavigate('master-register', { villageId: v.id });
                    }
                  }}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all cursor-pointer flex items-center justify-between text-xs group"
                  title="गावातील जलस्त्रोत व नमुना कारवाई पाहण्यासाठी क्लिक करा"
                >
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-emerald-900 flex items-center gap-1.5">
                      <span>{v.name}</span>
                      <span className="text-[10px] text-slate-400 group-hover:text-emerald-600 font-normal">({v.subcenter})</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{v.totalSources} जलस्त्रोत नोंदणीकृत</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{v.totalSamples} नमुने</div>
                    <div className="text-[10px] text-amber-700 font-semibold">{v.pendingReports} प्रलंबित</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Audit Snippet */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>ऑडिट नोंदी (Recent Activity):</span>
              </span>
              <button
                onClick={() => onNavigate('audit-log')}
                className="text-[10px] text-emerald-700 hover:underline cursor-pointer"
              >
                सर्व पहा
              </button>
            </div>
            <div className="space-y-1.5">
              {auditLogs.map((log) => (
                <div key={log.id} className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200">
                  <div className="font-medium text-slate-800 truncate">{log.summary}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {log.userName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SAMPLE DETAILS & WORKFLOW ACTION MODAL */}
      {/* ========================================================================= */}
      {selectedSample && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between rounded-t-xl sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-base">नमुना तपशील व पुढील कारवाई (Sample Details)</h3>
                  <div className="text-xs text-slate-300 font-mono">ID: {selectedSample.id}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedSample(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs text-slate-700">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">नमुना प्रकार</div>
                  <div className="font-bold text-slate-900 text-sm">{selectedSample.sampleTypeName}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">सद्यस्थिती</div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                      selectedSample.status === 'Report Received' || selectedSample.status === 'Report Updated'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedSample.status === 'Dispatched'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedSample.status}
                  </span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px]">गाव / उपकेंद्र:</span>
                  <span className="font-bold text-slate-900">{selectedSample.villageName} ({selectedSample.subcenterName})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">स्त्रोत / रुग्ण / ठिकाण:</span>
                  <span className="font-bold text-slate-900">
                    {selectedSample.sourceName || selectedSample.patientName || selectedSample.shopOrInstitutionName || '—'}
                  </span>
                  {selectedSample.sourceId && (
                    <span className="block text-[10px] text-emerald-700 font-mono">ID: {selectedSample.sourceId}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">संकलन दिनांक व बाटली क्र.:</span>
                  <span className="font-semibold text-slate-800">{selectedSample.collectionDate} | बाटली: {selectedSample.bottleNumber || selectedSample.sampleCodeOrBottleNo || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">संकलक अधिकारी/कर्मचारी:</span>
                  <span className="font-semibold text-slate-800">{selectedSample.sampleCollector || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">जावक पत्र क्रमांक:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedSample.sendingLetterNumber ? `${selectedSample.sendingLetterNumber}` : 'जावक पत्र प्रलंबित'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">प्रयोगशाळा निकाल (Result):</span>
                  <span className="font-bold text-slate-900">
                    {selectedSample.result ? (
                      <span className={selectedSample.result.includes('योग्य') || selectedSample.result.includes('प्रमाणित') ? 'text-emerald-700' : 'text-rose-700'}>
                        {selectedSample.result} (अहवाल क्र. {selectedSample.reportNumber || '—'})
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium">प्रयोगशाळा अहवाल प्रलंबित</span>
                    )}
                  </span>
                </div>
              </div>

              {selectedSample.reportRemarks && (
                <div className="bg-amber-50 p-2.5 rounded border border-amber-200">
                  <span className="font-bold text-amber-900">अहवाल शेरा / टिप: </span>
                  <span className="text-amber-800">{selectedSample.reportRemarks}</span>
                </div>
              )}

              {/* Action Workflows */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 text-xs mb-2">पुढील आवश्यक कारवाईसाठी वर्कफ्लो (Next Action Workflows):</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* 1. Enter/Update Report */}
                  <button
                    onClick={() => {
                      setSelectedSample(null);
                      onNavigate('report-update', {
                        sampleId: selectedSample.id,
                        sampleTypeId: selectedSample.sampleTypeId,
                        villageId: selectedSample.villageId,
                      });
                    }}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>१. अहवाल नोंदणी करा / निकाल भरा</span>
                  </button>

                  {/* 2. Dispatch Letter */}
                  <button
                    onClick={() => {
                      setSelectedSample(null);
                      onNavigate('sending-letters', {
                        sampleTypeId: selectedSample.sampleTypeId,
                        villageId: selectedSample.villageId,
                      });
                    }}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>२. जावक पत्र तयार करा / जोडा</span>
                  </button>

                  {/* 3. Open in Master Register */}
                  <button
                    onClick={() => {
                      setSelectedSample(null);
                      onNavigate('master-register', {
                        sampleTypeId: selectedSample.sampleTypeId,
                        searchQuery: selectedSample.id,
                      });
                    }}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition-all border border-slate-300 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span>३. मास्टर नोंदवहीत पहा</span>
                  </button>

                  {/* 4. New Sample from same village */}
                  <button
                    onClick={() => {
                      setSelectedSample(null);
                      onNavigate('sample-entry', {
                        villageId: selectedSample.villageId,
                        subcenterId: selectedSample.subcenterId || '',
                        sampleTypeId: selectedSample.sampleTypeId,
                        sourceId: selectedSample.sourceId || '',
                      });
                    }}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 font-semibold transition-all border border-teal-300 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-teal-700" />
                    <span>४. या गावाचा नवीन नमुना नोंदवा</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedSample(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-xs transition-colors cursor-pointer"
              >
                बंद करा (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VILLAGE WORKFLOW & WATER SOURCES HUB MODAL */}
      {/* ========================================================================= */}
      {selectedVillage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 bg-emerald-900 text-white flex items-center justify-between rounded-t-xl sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-base">गाव माहिती व जलस्त्रोत संनियंत्रण (Village Hub)</h3>
                  <div className="text-xs text-emerald-200 font-semibold">
                    गाव: {selectedVillage.name} | उपकेंद्र: {selectedVillage.subcenterName} | ता. औसा, जि. लातूर
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedVillage(null)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs text-slate-700">
              {/* Village Overview Stats */}
              {(() => {
                const villageSources = getVillageSources(selectedVillage.id);
                const villageSamples = allSamples.filter((s) => s.villageId === selectedVillage.id);
                const pendingCount = villageSamples.filter((s) => s.status !== 'Report Received' && s.status !== 'Report Updated').length;

                return (
                  <>
                    <div className="grid grid-cols-3 gap-3 bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 text-center">
                      <div>
                        <div className="text-lg font-bold text-slate-800">{villageSources.length}</div>
                        <div className="text-[11px] text-slate-600 font-medium">एकूण नोंदणीकृत स्त्रोत</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-emerald-800">{villageSamples.length}</div>
                        <div className="text-[11px] text-emerald-700 font-medium">एकूण संकलित नमुने</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-amber-800">{pendingCount}</div>
                        <div className="text-[11px] text-amber-700 font-medium">अहवाल प्रलंबित</div>
                      </div>
                    </div>

                    {/* Water Sources Table */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                          <span>या गावातील पाणी स्त्रोत ({villageSources.length}):</span>
                        </span>
                        <span className="text-[10px] text-slate-500">स्त्रोतावर क्लिक करून थेट नमुना नोंदवा</span>
                      </div>

                      <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-52">
                        {villageSources.length === 0 ? (
                          <div className="p-4 text-center text-slate-500 text-xs">
                            या गावासाठी कोणताही पाणी स्त्रोत नोंदवलेला नाही.
                          </div>
                        ) : (
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200">
                              <tr>
                                <th className="p-2">स्त्रोत आयडी</th>
                                <th className="p-2">स्त्रोत नाव / ठिकाण</th>
                                <th className="p-2">प्रकार</th>
                                <th className="p-2 text-right">कारवाई</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {villageSources.map((src) => (
                                <tr key={src.id} className="hover:bg-slate-50">
                                  <td className="p-2 font-mono text-[11px] text-emerald-800 font-bold">{src.sourceCode || src.id}</td>
                                  <td className="p-2 font-semibold text-slate-900">{src.sourceName} <span className="text-[10px] text-slate-500 font-normal">({src.locationAddress || '—'})</span></td>
                                  <td className="p-2 text-slate-600">{src.sourceType}</td>
                                  <td className="p-2 text-right">
                                    <button
                                      onClick={() => {
                                        setSelectedVillage(null);
                                        onNavigate('sample-entry', {
                                          villageId: selectedVillage.id,
                                          subcenterId: selectedVillage.subcenterId,
                                          sourceId: src.id,
                                          sampleTypeId: 'ST-001',
                                        });
                                      }}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                                    >
                                      + नमुना घ्या
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                    {/* Action Workflows for this Village */}
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <div className="font-bold text-slate-800 text-xs">या गावासाठी त्वरित कारवाई वर्कफ्लो:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setSelectedVillage(null);
                            onNavigate('sample-entry', {
                              villageId: selectedVillage.id,
                              subcenterId: selectedVillage.subcenterId,
                              sampleTypeId: 'ST-001',
                            });
                          }}
                          className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <Droplets className="w-4 h-4 text-emerald-200" />
                          <span>१. नवीन पाणी नमुना नोंदवा</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedVillage(null);
                            onNavigate('sample-entry', {
                              villageId: selectedVillage.id,
                              subcenterId: selectedVillage.subcenterId,
                              sampleTypeId: 'ST-005',
                            });
                          }}
                          className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <Bug className="w-4 h-4 text-rose-200" />
                          <span>२. डेंग्यू / सीरम नमुना नोंदवा</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedVillage(null);
                            onNavigate('master-register', {
                              villageId: selectedVillage.id,
                              subcenterId: selectedVillage.subcenterId,
                            });
                          }}
                          className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold border border-slate-300 transition-all cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-slate-600" />
                          <span>३. या गावाचे सर्व नमुने पहा</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedVillage(null);
                            onNavigate('sending-letters', {
                              villageId: selectedVillage.id,
                              subcenterId: selectedVillage.subcenterId,
                            });
                          }}
                          className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold border border-blue-300 transition-all cursor-pointer"
                        >
                          <Send className="w-4 h-4 text-blue-700" />
                          <span>४. या गावाचे जावक पत्र बनवा</span>
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedVillage(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-xs transition-colors cursor-pointer"
              >
                बंद करा (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TODAY'S SAMPLES QUICK WORKFLOW MODAL */}
      {/* ========================================================================= */}
      {showTodaySamplesModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-4 bg-blue-900 text-white flex items-center justify-between rounded-t-xl sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-300" />
                <div>
                  <h3 className="font-bold text-base">आज संकलित केलेले नमुने ({todaySamplesList.length})</h3>
                  <div className="text-xs text-blue-200">दिनांक: {todayStr}</div>
                </div>
              </div>
              <button
                onClick={() => setShowTodaySamplesModal(false)}
                className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2">आयडी</th>
                      <th className="p-2">प्रकार</th>
                      <th className="p-2">गाव</th>
                      <th className="p-2">स्त्रोत / ठिकाण</th>
                      <th className="p-2">स्थिती</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {todaySamplesList.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { setShowTodaySamplesModal(false); setSelectedSample(s); }}>
                        <td className="p-2 font-mono font-bold text-slate-900">{s.id}</td>
                        <td className="p-2 text-slate-700">{s.sampleTypeName}</td>
                        <td className="p-2 font-semibold text-slate-900">{s.villageName}</td>
                        <td className="p-2 text-slate-600">{s.sourceName || s.patientName || s.shopOrInstitutionName || '—'}</td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Workflow Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowTodaySamplesModal(false);
                    onNavigate('sending-letters');
                  }}
                  className="p-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-center transition-colors cursor-pointer"
                >
                  ✉️ जावक पत्र तयार करा
                </button>
                <button
                  onClick={() => {
                    setShowTodaySamplesModal(false);
                    onNavigate('sample-entry');
                  }}
                  className="p-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-center transition-colors cursor-pointer"
                >
                  ➕ आणखी नमुना जोडा
                </button>
                <button
                  onClick={() => {
                    setShowTodaySamplesModal(false);
                    onNavigate('master-register', { fromDate: todayStr, toDate: todayStr });
                  }}
                  className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold border border-slate-300 text-center transition-colors cursor-pointer"
                >
                  📋 नोंदवहीत सर्व पहा
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowTodaySamplesModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-xs cursor-pointer"
              >
                बंद करा
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PENDING REPORTS QUICK WORKFLOW MODAL */}
      {/* ========================================================================= */}
      {showPendingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-4 bg-rose-900 text-white flex items-center justify-between rounded-t-xl sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-300" />
                <div>
                  <h3 className="font-bold text-base">प्रयोगशाळा अहवाल प्रलंबित नमुने ({pendingSamplesList.length})</h3>
                  <div className="text-xs text-rose-200">अहवाल भरण्यासाठी खालील नमुन्यावर क्लिक करा किंवा नोंदणी स्क्रीनवर जा</div>
                </div>
              </div>
              <button
                onClick={() => setShowPendingModal(false)}
                className="text-rose-200 hover:text-white p-1 rounded-lg hover:bg-rose-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2">आयडी</th>
                      <th className="p-2">प्रकार</th>
                      <th className="p-2">गाव</th>
                      <th className="p-2">संकलन दिनांक</th>
                      <th className="p-2 text-right">कारवाई</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingSamplesList.slice(0, 20).map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-2 font-mono font-bold text-slate-900">{s.id}</td>
                        <td className="p-2 text-slate-700">{s.sampleTypeName}</td>
                        <td className="p-2 font-semibold text-slate-900">{s.villageName}</td>
                        <td className="p-2 text-slate-600">{s.collectionDate}</td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => {
                              setShowPendingModal(false);
                              onNavigate('report-update', {
                                sampleId: s.id,
                                sampleTypeId: s.sampleTypeId,
                                villageId: s.villageId,
                              });
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            अहवाल भरा
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Direct Jump Button */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setShowPendingModal(false);
                    onNavigate('report-update', { statusFilter: 'Pending' });
                  }}
                  className="w-full p-2.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-center transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>सर्व प्रलंबित अहवाल नोंदणी स्क्रीनवर उघडा</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowPendingModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-xs cursor-pointer"
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
