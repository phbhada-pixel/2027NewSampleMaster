import React from 'react';
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
} from 'lucide-react';
import { SampleTypeMaster, User } from '../types';

interface DashboardModuleProps {
  onNavigate: (tab: string, filter?: Record<string, string>) => void;
  currentUser: User;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({ onNavigate, currentUser }) => {
  const stats = clientStore.getDashboardStats();
  const sampleTypes = clientStore.getSampleTypes();
  const recentSamples = clientStore.getSamples().slice(0, 6);
  const auditLogs = clientStore.getAuditLogs().slice(0, 5);

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
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-white text-emerald-900 hover:bg-emerald-50 px-4 py-2.5 rounded-lg font-bold text-xs shadow transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-emerald-700" />
            <span>नवीन नमुना नोंदवा</span>
          </button>
          <button
            onClick={() => onNavigate('sending-letters')}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-emerald-700/80 hover:bg-emerald-700 text-white border border-emerald-500/50 px-3.5 py-2.5 rounded-lg font-semibold text-xs shadow transition-all"
          >
            <Send className="w-4 h-4 text-emerald-200" />
            <span>जावक पत्र तयार करा</span>
          </button>
          <button
            onClick={() => onNavigate('report-update')}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-emerald-950/70 hover:bg-emerald-950 text-white px-3.5 py-2.5 rounded-lg font-semibold text-xs shadow transition-all border border-emerald-700/60"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>अहवाल नोंदणी</span>
          </button>
          <button
            onClick={() => onNavigate('monthly-report')}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-lg font-bold text-xs shadow transition-all border border-emerald-400/60"
          >
            <Calendar className="w-4 h-4 text-emerald-100" />
            <span>मासिक नमुना अहवाल</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">एकूण नमुने</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalSamples}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-700 font-semibold">Total Samples</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">आजचे नमुने</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900">{stats.todaySamples}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            <span>Today's Collected</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">चालू महिना</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900">{stats.monthSamples}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            <span>This Month Total</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">पाठविलेले</span>
            <Send className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">{stats.dispatchedCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            <span>Dispatched</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">अहवाल प्रलंबित</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-800">{stats.reportPendingCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            <span>Pending Lab Result</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">अहवाल प्राप्त</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800">{stats.reportReceivedCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            <span>Reports Updated</span>
          </div>
        </div>
      </div>

      {/* 6 Sample Types Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-700" />
              नमुन्यांचा प्रकारानुसार तपशील (Sample Types Breakdown)
            </h3>
            <p className="text-xs text-slate-500">
              प्रत्येक नमुना प्रकाराची सद्यस्थिती, प्रलंबित व प्राप्त अहवाल
            </p>
          </div>
          <button
            onClick={() => onNavigate('master-register')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 self-start sm:self-center"
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
              className="group p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer"
            >
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

              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-200 text-center text-xs">
                <div className="bg-amber-50/80 p-1.5 rounded border border-amber-200/60">
                  <div className="text-[10px] text-amber-800 font-medium">प्रलंबित</div>
                  <div className="font-bold text-amber-900">{item.pending}</div>
                </div>
                <div className="bg-emerald-50/80 p-1.5 rounded border border-emerald-200/60">
                  <div className="text-[10px] text-emerald-800 font-medium">प्राप्त</div>
                  <div className="font-bold text-emerald-900">{item.received}</div>
                </div>
                <div className="bg-blue-50/80 p-1.5 rounded border border-blue-200/60">
                  <div className="text-[10px] text-blue-800 font-medium">योग्य/प्रमाणित</div>
                  <div className="font-bold text-blue-900">{item.fitCount}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Columns: Recent Samples & Village Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Samples List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                अलीकडील नमुना नोंदी (Recent Samples)
              </h3>
              <p className="text-xs text-slate-500">नुकतेच संकलित केलेले व अद्ययावत केलेले नमुने</p>
            </div>
            <button
              onClick={() => onNavigate('master-register')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
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
                <div key={sample.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="px-2 py-1 bg-slate-100 text-slate-800 text-[11px] font-mono font-bold rounded border border-slate-300">
                      {sample.id}
                    </span>
                    <div>
                      <div className="font-semibold text-xs text-slate-900">
                        {sample.villageName} — {sample.sourceName || sample.patientName || sample.shopOrInstitutionName || sample.sampleTypeName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>दिनांक: {sample.collectionDate}</span>
                        <span>•</span>
                        <span>{sample.sampleTypeName}</span>
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
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Village Master Quick View */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                गाव निहाय स्थिती (Villages)
              </h3>
              <p className="text-xs text-slate-500">{stats.activeVillagesCount} कार्यरत गावे</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {stats.byVillageSummary.map((v) => (
              <div
                key={v.id}
                onClick={() => onNavigate('master-register', { villageId: v.id })}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition-colors cursor-pointer flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{v.name}</div>
                  <div className="text-[10px] text-slate-500">उपकेंद्र: {v.subcenter} | {v.totalSources} स्त्रोत</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{v.totalSamples} नमुने</div>
                  <div className="text-[10px] text-amber-700 font-semibold">{v.pendingReports} प्रलंबित</div>
                </div>
              </div>
            ))}
          </div>

          {/* Audit Snippet */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>ऑडिट नोंदी (Recent System Activity):</span>
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
    </div>
  );
};
