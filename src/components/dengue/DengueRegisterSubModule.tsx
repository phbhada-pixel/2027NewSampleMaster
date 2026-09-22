import React, { useState, useMemo } from 'react';
import { clientStore } from '../../services/clientStore';
import { SampleRecord, User } from '../../types';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Eye,
  Edit2,
  Download,
} from 'lucide-react';

interface DengueRegisterSubModuleProps {
  currentUser: User;
  onSelectForDocs?: (sampleId: string) => void;
  onSelectForReport?: (sampleId: string) => void;
}

export const DengueRegisterSubModule: React.FC<DengueRegisterSubModuleProps> = ({
  currentUser,
  onSelectForDocs,
  onSelectForReport,
}) => {
  const allSamples = clientStore.getSamples({ sampleTypeId: 'ST-006' });
  const villages = clientStore.getVillages();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [villageFilter, setVillageFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredSamples = useMemo(() => {
    return allSamples.filter((s) => {
      if (villageFilter !== 'ALL' && s.villageId !== villageFilter) return false;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'COLLECTED' && s.status !== 'Collected') return false;
        if (statusFilter === 'DISPATCHED' && s.status !== 'Dispatched') return false;
        if (statusFilter === 'REPORT_RECEIVED' && s.status !== 'Report Received') return false;
      }
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        s.id.toLowerCase().includes(term) ||
        (s.patientName && s.patientName.toLowerCase().includes(term)) ||
        (s.villageName && s.villageName.toLowerCase().includes(term)) ||
        (s.sendingLetterNumber && s.sendingLetterNumber.toLowerCase().includes(term)) ||
        (s.reportNumber && s.reportNumber.toLowerCase().includes(term))
      );
    });
  }, [allSamples, villageFilter, statusFilter, searchTerm]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-700" />
            डेंग्यू / चिकनगुनिया नमुना नोंदवही (Dengue Serum Master Register)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            सर्व डेंग्यू व चिकनगुनिया सिरम नमुन्यांची अधिकृत मास्टर नोंदवही (एक नमुना = एक अधिकृत नोंद)
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-1 rounded-lg">
            एकूण नमुने: {allSamples.length}
          </span>
          <span className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1 rounded-lg">
            पाठवलेले: {allSamples.filter((s) => s.status === 'Dispatched').length}
          </span>
          <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-lg">
            अहवाल प्राप्त: {allSamples.filter((s) => s.status === 'Report Received').length}
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Sample ID, रुग्णाचे नाव, जावक क्र. किंवा अहवाल क्र. शोधा..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white"
          />
        </div>

        <div>
          <select
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 bg-slate-50"
          >
            <option value="ALL">सर्व गावे (All Villages)</option>
            {villages.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 bg-slate-50"
          >
            <option value="ALL">सर्व स्थिती (All Status)</option>
            <option value="COLLECTED">संकलित / तयार (Collected)</option>
            <option value="DISPATCHED">पाठवलेले (Dispatched)</option>
            <option value="REPORT_RECEIVED">अहवाल प्राप्त (Report Received)</option>
          </select>
        </div>
      </div>

      {/* Authoritative Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-inner">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 whitespace-nowrap">
              <th className="p-2 border-r border-slate-200">Sample ID</th>
              <th className="p-2 border-r border-slate-200">रुग्णाचे नाव</th>
              <th className="p-2 border-r border-slate-200">उपकेंद्र</th>
              <th className="p-2 border-r border-slate-200">गाव</th>
              <th className="p-2 border-r border-slate-200 text-center">वय</th>
              <th className="p-2 border-r border-slate-200 text-center">लिंग</th>
              <th className="p-2 border-r border-slate-200">क्लिनिकल लक्षणे (Clinical Findings)</th>
              <th className="p-2 border-r border-slate-200">नमुना प्रकार</th>
              <th className="p-2 border-r border-slate-200 text-center">संकलन दिनांक</th>
              <th className="p-2 border-r border-slate-200">जावक पत्र क्र.</th>
              <th className="p-2 border-r border-slate-200 text-center">पत्र दिनांक</th>
              <th className="p-2 border-r border-slate-200 text-center">पाठवणी स्थिती</th>
              <th className="p-2 border-r border-slate-200">अहवाल क्र.</th>
              <th className="p-2 border-r border-slate-200 text-center">अहवाल दिनांक</th>
              <th className="p-2 border-r border-slate-200 text-center">निकाल</th>
              <th className="p-2 border-r border-slate-200 text-center">स्थिती</th>
              <th className="p-2 text-center">कृती</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {filteredSamples.length === 0 ? (
              <tr>
                <td colSpan={16} className="p-8 text-center text-slate-400 font-medium">
                  नोंदवहीत कोणताही नमुना आढळला नाही.
                </td>
              </tr>
            ) : (
              filteredSamples.map((sample) => {
                const isDispatched = sample.status === 'Dispatched' || Boolean(sample.sendingLetterNumber);
                const isReported = sample.status === 'Report Received';

                return (
                  <tr key={sample.id} className="hover:bg-slate-50 transition-colors whitespace-nowrap">
                    {/* 1. Sample ID */}
                    <td className="p-2 border-r border-slate-200 font-mono font-bold text-rose-900">
                      {sample.id}
                    </td>
                    {/* 2. Patient Name */}
                    <td className="p-2 border-r border-slate-200 font-bold uppercase text-slate-900">
                      {sample.patientName || '-'}
                    </td>
                    {/* 3. Subcenter */}
                    <td className="p-2 border-r border-slate-200 text-slate-700">
                      {sample.subcenterName || sample.subcenter || '-'}
                    </td>
                    {/* 4. Village */}
                    <td className="p-2 border-r border-slate-200 text-slate-700 font-medium">
                      {sample.villageName || '-'}
                    </td>
                    {/* 5. Age */}
                    <td className="p-2 border-r border-slate-200 text-center font-mono font-medium">
                      {sample.age || '-'}
                    </td>
                    {/* 6. Sex */}
                    <td className="p-2 border-r border-slate-200 text-center">
                      {sample.sex || '-'}
                    </td>
                    {/* 6b. Clinical Findings */}
                    <td className="p-2 border-r border-slate-200 text-[11px]">
                      <div className="flex flex-wrap gap-1 max-w-[240px]">
                        {sample.feverPresent === 'Yes' && (
                          <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[10px] font-medium">
                            ताप: {sample.feverDurationDays ? `${sample.feverDurationDays}d` : 'Yes'}
                          </span>
                        )}
                        {sample.headachePresent === 'Yes' && (
                          <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-medium">
                            डोकेदुखी: {sample.headacheDurationDays ? `${sample.headacheDurationDays}d` : 'Yes'}
                          </span>
                        )}
                        {sample.bodyachePresent === 'Yes' && (
                          <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-[10px] font-medium">
                            अंगदुखी: {sample.bodyacheDurationDays ? `${sample.bodyacheDurationDays}d` : 'Yes'}
                          </span>
                        )}
                        {sample.jointPainPresent === 'Yes' && (
                          <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-[10px] font-medium">
                            सांधेदुखी: {sample.jointPainDurationDays ? `${sample.jointPainDurationDays}d` : 'Yes'}
                          </span>
                        )}
                        {sample.retroOrbitalPainPresent === 'Yes' && (
                          <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded text-[10px] font-medium">
                            डोळ्यांमागे: {sample.retroOrbitalPainDurationDays ? `${sample.retroOrbitalPainDurationDays}d` : 'Yes'}
                          </span>
                        )}
                        {sample.rashPresent === 'Yes' && (
                          <span className="bg-pink-100 text-pink-800 px-1.5 py-0.5 rounded text-[10px] font-medium">
                            पुरळ: {sample.rashDurationDays ? `${sample.rashDurationDays}d` : 'Yes'}
                          </span>
                        )}
                        {sample.hematemesisPresent === 'Yes' && (
                          <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                            रक्तउलटी: {sample.hematemesisDurationDays ? `${sample.hematemesisDurationDays}d` : 'Yes'}
                          </span>
                        )}
                        {sample.epistaxisPresent === 'Yes' && (
                          <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                            नाकातून रक्त: {sample.epistaxisDurationDays ? `${sample.epistaxisDurationDays}d` : 'Yes'}
                          </span>
                        )}
                        {sample.petechiaePresent === 'Yes' && (
                          <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                            त्वचेवर ठिपके: {sample.petechiaeDurationDays ? `${sample.petechiaeDurationDays}d` : 'Yes'}
                          </span>
                        )}
                        {sample.melenaPresent === 'Yes' && (
                          <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                            काळी विष्ठा: {sample.melenaDurationDays ? `${sample.melenaDurationDays}d` : 'Yes'}
                          </span>
                        )}
                        {(sample.otherHemorrhagicPresent === 'Yes' || sample.otherHaemorrhagicPresent === 'Yes') && (
                          <span className="bg-red-200 text-red-900 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            इतर रक्तस्राव: {sample.otherHemorrhagicDurationDays || sample.otherHaemorrhagicDurationDays ? `${sample.otherHemorrhagicDurationDays || sample.otherHaemorrhagicDurationDays}d` : 'Yes'}
                          </span>
                        )}
                        {!sample.feverPresent &&
                          !sample.headachePresent &&
                          !sample.bodyachePresent &&
                          !sample.jointPainPresent &&
                          !sample.retroOrbitalPainPresent &&
                          !sample.rashPresent &&
                          !sample.hematemesisPresent &&
                          !sample.epistaxisPresent &&
                          !sample.petechiaePresent &&
                          !sample.melenaPresent && (
                            <span className="text-slate-400 text-[10px]">
                              {sample.clinicalFindings?.fever && sample.clinicalFindings.fever !== '0 Days'
                                ? `ताप: ${sample.clinicalFindings.fever}`
                                : 'लक्षणे नाहीत'}
                            </span>
                          )}
                      </div>
                    </td>
                    {/* 7. Sample Type */}
                    <td className="p-2 border-r border-slate-200 text-slate-600 text-[11px]">
                      Dengue/Chikungunya Serum
                    </td>
                    {/* 8. Collection Date */}
                    <td className="p-2 border-r border-slate-200 text-center font-mono">
                      {sample.collectionDate || '-'}
                    </td>
                    {/* 9. Letter Number */}
                    <td className="p-2 border-r border-slate-200 font-mono text-[11px] text-blue-900">
                      {sample.sendingLetterNumber || '-'}
                    </td>
                    {/* 10. Letter Date */}
                    <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px]">
                      {sample.sendingDate || '-'}
                    </td>
                    {/* 11. Dispatch Status */}
                    <td className="p-2 border-r border-slate-200 text-center">
                      {isDispatched ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          पाठवले (Dispatched)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                          प्रलंबित (Pending)
                        </span>
                      )}
                    </td>
                    {/* 12. Report Number */}
                    <td className="p-2 border-r border-slate-200 font-mono text-[11px]">
                      {sample.reportNumber || '-'}
                    </td>
                    {/* 13. Report Date */}
                    <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px]">
                      {sample.reportReceivedDate || sample.reportDate || '-'}
                    </td>
                    {/* 14. Result */}
                    <td className="p-2 border-r border-slate-200 text-center font-bold">
                      {sample.result ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            sample.result === 'निगेटिव्ह'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sample.result === 'पॉझिटिव्ह'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sample.result}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">अप्राप्त</span>
                      )}
                    </td>
                    {/* 15. Status */}
                    <td className="p-2 border-r border-slate-200 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isReported
                            ? 'bg-emerald-100 text-emerald-800'
                            : isDispatched
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {sample.status}
                      </span>
                    </td>
                    {/* 16. Actions */}
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onSelectForDocs && (
                          <button
                            onClick={() => onSelectForDocs(sample.id)}
                            title="दस्तऐवज पहा"
                            className="p-1 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onSelectForReport && (
                          <button
                            onClick={() => onSelectForReport(sample.id)}
                            title="अहवाल नोंदवा"
                            className="p-1 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
