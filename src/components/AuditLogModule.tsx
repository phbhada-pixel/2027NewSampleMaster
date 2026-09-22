import React, { useState } from 'react';
import { clientStore } from '../services/clientStore';
import { AuditLog, User } from '../types';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  UserCheck,
  Tag,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';

interface AuditLogModuleProps {
  currentUser: User;
}

export const AuditLogModule: React.FC<AuditLogModuleProps> = ({ currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const logs = clientStore.getAuditLogs();

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.summary.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        (log.recordId && log.recordId.toLowerCase().includes(q)) ||
        (log.tableName && log.tableName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">CREATE</span>;
      case 'UPDATE':
        return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">UPDATE</span>;
      case 'DISPATCH':
        return <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold">DISPATCH</span>;
      case 'REPORT_UPDATE':
        return <span className="bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded text-[10px] font-bold">REPORT</span>;
      case 'DELETE':
        return <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">DELETE</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">{action}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-700" />
              सिस्टम ऑडिट ट्रेल व सुरक्षितता नोंदी (System Audit Trail)
            </h2>
            <p className="text-xs text-slate-500">
              प्रत्येक नमुना नोंदणी, जावक पत्र, अहवाल अद्ययावतीकरण व बदलांचा अचूक टाइमस्टॅम्प इतिहास
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-100 text-slate-800 px-3 py-1 rounded-lg font-mono font-bold border border-slate-200">
              एकूण ऑडिट नोंदी: {logs.length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="वापरकर्ता, नमुना आयडी, किंवा बदलांचे वर्णन शोधा..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          >
            <option value="ALL">सर्व कृती (All Actions)</option>
            <option value="CREATE">CREATE (नवीन नोंद)</option>
            <option value="UPDATE">UPDATE (बदल)</option>
            <option value="DISPATCH">DISPATCH (जावक पत्र)</option>
            <option value="REPORT_UPDATE">REPORT_UPDATE (अहवाल)</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 text-left border-b border-slate-200">
                <th className="p-3">तारीख व वेळ</th>
                <th className="p-3">कृती प्रकार</th>
                <th className="p-3">मॉड्यूल / टेबल</th>
                <th className="p-3">रेकॉर्ड आयडी</th>
                <th className="p-3">तपशील व सारांश</th>
                <th className="p-3">वापरकर्ता नाव</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    कोणतेही ऑडिट रेकॉर्ड्स आढळले नाहीत.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {new Date(log.timestamp).toLocaleString('mr-IN')}
                    </td>
                    <td className="p-3">{getActionBadge(log.action)}</td>
                    <td className="p-3 font-semibold text-slate-700">{log.entityType}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{log.entityId}</td>
                    <td className="p-3 text-slate-800">{log.summary}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{log.userName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.userId}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
