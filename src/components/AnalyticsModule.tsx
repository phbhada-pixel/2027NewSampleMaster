import React from 'react';
import { clientStore } from '../services/clientStore';
import { User } from '../types';
import {
  BarChart3,
  PieChart,
  Droplets,
  Sparkles,
  FlaskConical,
  HeartPulse,
  TrendingUp,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Award,
} from 'lucide-react';

interface AnalyticsModuleProps {
  currentUser: User;
}

export const AnalyticsModule: React.FC<AnalyticsModuleProps> = ({ currentUser }) => {
  const stats = clientStore.getDashboardStats();
  const sampleTypes = clientStore.getSampleTypes();
  const allSamples = clientStore.getSamples();
  const villages = clientStore.getVillages();

  // Water Samples Analytics
  const waterSamples = allSamples.filter((s) => s.sampleTypeId === 'ST-001' || s.sampleTypeId === 'ST-002');
  const waterFit = waterSamples.filter((s) => s.result?.includes('योग्य')).length;
  const waterUnfit = waterSamples.filter((s) => s.result?.includes('अयोग्य')).length;
  const waterPending = waterSamples.filter((s) => !s.result).length;

  // Salt Samples Analytics
  const saltSamples = allSamples.filter((s) => s.sampleTypeId === 'ST-003');
  const saltStandard = saltSamples.filter((s) => s.result?.includes('प्रमाणित')).length;
  const saltSubstandard = saltSamples.filter((s) => s.result?.includes('अप्रमाणित')).length;

  // TCL Samples Analytics
  const tclSamples = allSamples.filter((s) => s.sampleTypeId === 'ST-004');
  const tclStandard = tclSamples.filter((s) => s.result?.includes('प्रमाणित')).length;
  const tclSubstandard = tclSamples.filter((s) => s.result?.includes('अप्रमाणित')).length;

  // Zero-denominator-safe rates (Mathematical rigor: prevent NaN, Infinity, undefined)
  const waterTestedCount = waterFit + waterUnfit;
  const waterPotabilityRate = waterTestedCount > 0 ? `${Math.round((waterFit / waterTestedCount) * 100)}%` : '0%';

  const saltTestedCount = saltStandard + saltSubstandard;
  const saltComplianceRate = saltTestedCount > 0 ? `${Math.round((saltStandard / saltTestedCount) * 100)}%` : '0%';

  const tclTestedCount = tclStandard + tclSubstandard;
  const tclQualityRate = tclTestedCount > 0 ? `${Math.round((tclStandard / tclTestedCount) * 100)}%` : '0%';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-700" />
              प्रयोगशाळा गुणवत्ता विश्लेषण व आकडेवारी (Analytics &amp; Compliance)
            </h2>
            <p className="text-xs text-slate-500">
              पाणी शुद्धता निर्देशांक, मीठ व ब्लिचिंग पावडर गुणवत्ता आणि गाव निहाय सर्वेक्षण प्रगती
            </p>
          </div>
        </div>
      </div>

      {/* Top 3 Analytical Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Water Quality Index */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-cyan-50 rounded-lg text-cyan-700 border border-cyan-200">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-900">पाणी नमुने शुद्धता निर्देशांक</h3>
                <span className="text-[10px] text-slate-500">Water Potability Rate</span>
              </div>
            </div>
            <span className="text-xl font-black text-cyan-900">
              {waterPotabilityRate}
            </span>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>एकूण तपासलेले नमुने:</span>
              <span className="font-bold">{waterSamples.length}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>पिण्यास योग्य (Fit):</span>
              <span>{waterFit}</span>
            </div>
            <div className="flex justify-between text-rose-700 font-semibold">
              <span>पिण्यास अयोग्य (Unfit/Contaminated):</span>
              <span>{waterUnfit}</span>
            </div>
            <div className="flex justify-between text-amber-700">
              <span>अहवाल बाकी (Pending):</span>
              <span>{waterPending}</span>
            </div>
          </div>
        </div>

        {/* 2. Salt Iodine Compliance */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-700 border border-indigo-200">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-900">मीठ आयोडिन मानकता</h3>
                <span className="text-[10px] text-slate-500">Salt Iodine Compliance (&gt;15 PPM)</span>
              </div>
            </div>
            <span className="text-xl font-black text-indigo-900">
              {saltComplianceRate}
            </span>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>एकूण मीठ नमुने:</span>
              <span className="font-bold">{saltSamples.length}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>प्रमाणित (Adequate &gt;15 PPM):</span>
              <span>{saltStandard}</span>
            </div>
            <div className="flex justify-between text-rose-700 font-semibold">
              <span>अप्रमाणित (Substandard):</span>
              <span>{saltSubstandard}</span>
            </div>
          </div>
        </div>

        {/* 3. TCL Bleaching Powder Quality */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-700 border border-amber-200">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-900">TCL ब्लिचिंग पावडर गुणवत्ता</h3>
                <span className="text-[10px] text-slate-500">Active Chlorine &gt;33% Standard</span>
              </div>
            </div>
            <span className="text-xl font-black text-amber-900">
              {tclQualityRate}
            </span>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>एकूण TCL नमुने:</span>
              <span className="font-bold">{tclSamples.length}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>प्रमाणित (&gt;33% Chlorine):</span>
              <span>{tclStandard}</span>
            </div>
            <div className="flex justify-between text-rose-700 font-semibold">
              <span>अप्रमाणित (कमी क्लोरीन):</span>
              <span>{tclSubstandard}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subcenter-Wise Aggregation Report */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              उपकेंद्र निहाय नमुना संकलन व अहवाल अहवाल (Subcenter Wise Report)
            </h3>
            <p className="text-xs text-slate-500">
              प्राथमिक आरोग्य केंद्र भादा अंतर्गत प्रत्येक उपकेंद्राची एकत्रित नमुना स्थिती
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 text-left border-b border-slate-200">
                <th className="p-2.5">उपकेंद्र (Subcenter)</th>
                <th className="p-2.5">गावे संख्या</th>
                <th className="p-2.5">एकूण नमुने</th>
                <th className="p-2.5">जैविक पाणी (BIO)</th>
                <th className="p-2.5">रासायनिक पाणी (CHM)</th>
                <th className="p-2.5">मीठ (Salt)</th>
                <th className="p-2.5">TCL पावडर</th>
                <th className="p-2.5">सीरम (Serum)</th>
                <th className="p-2.5">अयोग्य / अप्रमाणित</th>
                <th className="p-2.5">अहवाल प्रलंबित</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientStore.getSubcenters().map((sc) => {
                const scVillages = villages.filter((v) => v.subcenterId === sc.id);
                const scVillageIds = scVillages.map((v) => v.id);
                const scSamples = allSamples.filter(
                  (s) => s.subcenterId === sc.id || scVillageIds.includes(s.villageId) || s.subcenter === sc.subcenterName
                );
                const bioWater = scSamples.filter((s) => s.sampleTypeId === 'ST-001').length;
                const chemWater = scSamples.filter((s) => s.sampleTypeId === 'ST-002').length;
                const salt = scSamples.filter((s) => s.sampleTypeId === 'ST-003').length;
                const tcl = scSamples.filter((s) => s.sampleTypeId === 'ST-004').length;
                const serum = scSamples.filter((s) => s.sampleTypeId === 'ST-005' || s.sampleTypeId === 'ST-006').length;
                const unfit = scSamples.filter(
                  (s) => s.result && (s.result.includes('अयोग्य') || s.result.includes('अप्रमाणित') || s.result === 'पॉझिटिव्ह')
                ).length;
                const pending = scSamples.filter((s) => !s.result).length;

                return (
                  <tr key={sc.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">
                      <span>{sc.subcenterName}</span>
                      {sc.subcenterCode && <span className="text-[10px] text-slate-500 ml-1 font-mono">({sc.subcenterCode})</span>}
                    </td>
                    <td className="p-2.5 font-semibold text-slate-700">{scVillages.length}</td>
                    <td className="p-2.5 font-bold text-slate-900 bg-slate-50">{scSamples.length}</td>
                    <td className="p-2.5 text-cyan-800 font-mono">{bioWater}</td>
                    <td className="p-2.5 text-emerald-800 font-mono">{chemWater}</td>
                    <td className="p-2.5 text-indigo-800 font-mono">{salt}</td>
                    <td className="p-2.5 text-amber-800 font-mono">{tcl}</td>
                    <td className="p-2.5 text-purple-800 font-mono">{serum}</td>
                    <td className="p-2.5 font-bold text-rose-700">{unfit}</td>
                    <td className="p-2.5 font-bold text-amber-700">{pending}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Village-Wise Progress Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              गाव निहाय नमुना संकलन व अहवाल प्रगती (Village Wise Matrix)
            </h3>
            <p className="text-xs text-slate-500">
              प्राथमिक आरोग्य केंद्र भादा कार्यक्षेत्रातील सर्व गावांची सर्वेक्षण स्थिती
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 text-left border-b border-slate-200">
                <th className="p-2.5">गाव (Village)</th>
                <th className="p-2.5">उपकेंद्र (Subcenter)</th>
                <th className="p-2.5">एकूण नमुने</th>
                <th className="p-2.5">जैविक पाणी</th>
                <th className="p-2.5">रासायनिक पाणी</th>
                <th className="p-2.5">मीठ नमुने</th>
                <th className="p-2.5">TCL नमुने</th>
                <th className="p-2.5">सीरम नमुने</th>
                <th className="p-2.5">अहवाल प्रलंबित</th>
                <th className="p-2.5">कार्यवाही स्थिती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {villages.map((v) => {
                const vSamples = allSamples.filter((s) => s.villageId === v.id);
                const bioWater = vSamples.filter((s) => s.sampleTypeId === 'ST-001').length;
                const chemWater = vSamples.filter((s) => s.sampleTypeId === 'ST-002').length;
                const salt = vSamples.filter((s) => s.sampleTypeId === 'ST-003').length;
                const tcl = vSamples.filter((s) => s.sampleTypeId === 'ST-004').length;
                const serum = vSamples.filter((s) => s.sampleTypeId === 'ST-005' || s.sampleTypeId === 'ST-006').length;
                const pending = vSamples.filter((s) => !s.result).length;

                return (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">{v.name}</td>
                    <td className="p-2.5 text-emerald-800 font-medium">{v.subcenter}</td>
                    <td className="p-2.5 font-bold text-slate-900">{vSamples.length}</td>
                    <td className="p-2.5 text-cyan-800 font-mono">{bioWater}</td>
                    <td className="p-2.5 text-emerald-800 font-mono">{chemWater}</td>
                    <td className="p-2.5 text-indigo-800 font-mono">{salt}</td>
                    <td className="p-2.5 text-amber-800 font-mono">{tcl}</td>
                    <td className="p-2.5 text-purple-800 font-mono">{serum}</td>
                    <td className="p-2.5 font-bold text-amber-700">{pending}</td>
                    <td className="p-2.5">
                      <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-bold">
                        समाधानकारक
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
