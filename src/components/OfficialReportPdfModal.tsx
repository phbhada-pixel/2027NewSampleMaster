import React, { useState } from 'react';
import {
  Printer,
  Download,
  X,
  FileText,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { User } from '../types';

export interface PdfTableColumn {
  header: string;
  accessor?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: any, index: number) => React.ReactNode;
}

export interface OfficialReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle: string;
  reportSubtitle?: string;
  documentNumber?: string;
  periodText?: string;
  filterDetails?: { label: string; value: string }[];
  columns: PdfTableColumn[];
  data: any[];
  summaryStats?: { label: string; value: string | number; colorClass?: string }[];
  currentUser: User;
  orientationDefault?: 'portrait' | 'landscape';
  customRemarks?: string;
}

export const OfficialReportPdfModal: React.FC<OfficialReportPdfModalProps> = ({
  isOpen,
  onClose,
  reportTitle,
  reportSubtitle,
  documentNumber,
  periodText,
  filterDetails = [],
  columns,
  data,
  summaryStats = [],
  currentUser,
  orientationDefault = 'landscape',
  customRemarks,
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(orientationDefault);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [officerName, setOfficerName] = useState<string>(currentUser.name || 'डॉ. वैद्यकीय अधिकारी');
  const [officerDesignation, setOfficerDesignation] = useState<string>(
    currentUser.designation || 'वैद्यकीय अधिकारी (गट-अ)'
  );
  const [signatory2Name, setSignatory2Name] = useState<string>('आरोग्य सहाय्यक / प्रयोगशाळा तंत्रज्ञ');
  const [docRefNo, setDocRefNo] = useState<string>(
    documentNumber || `जा.क्र./प्राआकेंभादा/आरोग्य/नमुना-अहवाल/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`
  );
  const [customTitle, setCustomTitle] = useState<string>(reportTitle);
  const [officialRemark, setOfficialRemark] = useState<string>(
    customRemarks || 'सदर अहवाल प्राथमिक आरोग्य केंद्र भादा अंतर्गत अधिकृत शासकीय नमुना नोंदवही व प्रयोगशाळा तपासणी निकालांवर आधारित तयार करण्यात आला आहे.'
  );

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDateStr = new Date().toLocaleDateString('mr-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible">
      <div className={`bg-white rounded-xl shadow-2xl w-full border border-slate-300 flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:rounded-none ${
        orientation === 'landscape' ? 'max-w-6xl' : 'max-w-4xl'
      }`}>
        {/* Modal Toolbar (Hidden during print) */}
        <div className="p-3.5 bg-slate-900 text-white rounded-t-xl flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">शासकीय अहवाल PDF प्रिव्ह्यू (Official PDF Export)</h3>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded font-mono font-bold">
                  {data.length} नोंदी
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                महाराष्ट्र शासन मानकानुसार अधिकृत लेआउट, शीर्षलेख व स्वाक्षरी ब्लॉक
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Orientation Switcher */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  orientation === 'landscape' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Landscape (आडवे)
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  orientation === 'portrait' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Portrait (उभे)
              </button>
            </div>

            {/* Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                showSettings ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="स्वाक्षरी व जावक क्रमांक सेटिंग्ज"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">सेटिंग्ज</span>
            </button>

            {/* Print / Save as PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>PDF सेव्ह / प्रिंट करा</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Customization Drawer (Hidden during print) */}
        {showSettings && (
          <div className="bg-slate-100 p-3.5 border-b border-slate-300 text-xs text-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">अहवाल शीर्षक:</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">जावक / संदर्भ क्रमांक:</label>
              <input
                type="text"
                value={docRefNo}
                onChange={(e) => setDocRefNo(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">मान्यवर वैद्यकीय अधिकारी:</label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">अधिकारी पदनाम:</label>
              <input
                type="text"
                value={officerDesignation}
                onChange={(e) => setOfficerDesignation(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">तयार करणार स्वाक्षरी पदनाम:</label>
              <input
                type="text"
                value={signatory2Name}
                onChange={(e) => setSignatory2Name(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">अहवाल शेरा / टीप:</label>
              <input
                type="text"
                value={officialRemark}
                onChange={(e) => setOfficialRemark(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
              />
            </div>
          </div>
        )}

        {/* Scrollable Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50 print:bg-white print:p-0 print:overflow-visible">
          {/* Printable Page Wrapper */}
          <div
            className={`mx-auto bg-white p-6 sm:p-8 border border-slate-300 shadow-lg rounded print:border-none print:shadow-none print:p-0 print:m-0 ${
              orientation === 'landscape' ? 'w-full print:landscape-page' : 'max-w-[210mm] print:portrait-page'
            }`}
          >
            {/* 1. OFFICIAL MAHARASHTRA GOVERNMENT HEADER */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center relative">
              <div className="text-[13px] font-bold tracking-wider text-slate-900 uppercase">
                महाराष्ट्र शासन — सार्वजनिक आरोग्य विभाग
              </div>
              <div className="text-[12px] font-semibold text-slate-800">
                जिल्हा परिषद लातूर | तालुका आरोग्य अधिकारी कार्यालय, औसा
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5 tracking-tight">
                प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर (पिन: ४१३५२०)
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5">
                ईमेल: phcbhada@gmail.com • दुरध्वनी क्र.: ०२३८२-XXXXXX • शासकीय आरोग्य नमुना व प्रयोगशाळा संनियंत्रण प्रणाली
              </div>

              {/* Horizontal line separation */}
              <div className="mt-2 pt-1 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-700 font-mono">
                <div>
                  <span className="font-bold">संदर्भ / जावक क्र.: </span>
                  <span>{docRefNo}</span>
                </div>
                <div>
                  <span className="font-bold">दिनांक: </span>
                  <span>{currentDateStr}</span>
                </div>
              </div>
            </div>

            {/* 2. REPORT TITLE & PERIOD BANNER */}
            <div className="bg-slate-100 border border-slate-300 p-2.5 rounded-lg mb-4 text-center">
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-wide uppercase">
                {customTitle}
              </h1>
              {reportSubtitle && (
                <div className="text-[11px] font-semibold text-slate-700 mt-0.5">
                  {reportSubtitle}
                </div>
              )}
              {periodText && (
                <div className="inline-block mt-1 bg-white border border-slate-300 px-3 py-0.5 rounded-full text-[10px] font-bold text-slate-800">
                  कालावधी: {periodText}
                </div>
              )}
            </div>

            {/* 3. ACTIVE FILTERS BADGES (If any) */}
            {filterDetails.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-3 text-[10px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                <span className="font-bold text-slate-900">लागू असलेले फिल्टर्स:</span>
                {filterDetails.map((f, i) => (
                  <span key={i} className="bg-white px-2 py-0.5 rounded border border-slate-300 font-medium">
                    <strong className="text-slate-900">{f.label}:</strong> {f.value}
                  </span>
                ))}
              </div>
            )}

            {/* 4. SUMMARY METRICS CARDS (If provided) */}
            {summaryStats.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
                {summaryStats.map((st, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-300 p-2 rounded text-center">
                    <div className="text-[9px] font-bold text-slate-600 uppercase tracking-tight truncate">{st.label}</div>
                    <div className={`text-base font-black ${st.colorClass || 'text-slate-900'}`}>{st.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. OFFICIAL DATA TABLE */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left text-[10px] sm:text-[11px] border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 font-bold">
                    <th className="p-1.5 border-r border-slate-400 text-center w-8">अ.क्र.</th>
                    {columns.map((col, idx) => (
                      <th
                        key={idx}
                        style={{ width: col.width }}
                        className={`p-1.5 border-r border-slate-400 ${
                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                        } ${idx === columns.length - 1 ? 'border-r-0' : ''}`}
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="p-4 text-center text-slate-500 font-medium">
                        कोणताही डेटा उपलब्ध नाही.
                      </td>
                    </tr>
                  ) : (
                    data.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                      >
                        <td className="p-1.5 border-r border-slate-300 text-center font-mono font-medium text-slate-600">
                          {rowIdx + 1}
                        </td>
                        {columns.map((col, colIdx) => (
                          <td
                            key={colIdx}
                            className={`p-1.5 border-r border-slate-300 text-slate-800 ${
                              col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                            } ${colIdx === columns.length - 1 ? 'border-r-0' : ''}`}
                          >
                            {col.render
                              ? col.render(row, rowIdx)
                              : col.accessor
                              ? row[col.accessor] ?? '—'
                              : '—'}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 6. OFFICIAL REMARKS & DECLARATION */}
            <div className="bg-slate-50 border border-slate-300 p-2.5 rounded text-[10px] text-slate-700 mb-8">
              <span className="font-bold text-slate-900">प्रमाणपत्र / शेरा: </span>
              <span>{officialRemark}</span>
            </div>

            {/* 7. OFFICIAL SIGNATURE & STAMP BLOCK */}
            <div className="pt-6 border-t border-slate-400 break-inside-avoid">
              <div className="grid grid-cols-3 gap-4 text-center text-[10px] sm:text-[11px] text-slate-900">
                {/* Left Signatory */}
                <div className="flex flex-col justify-between h-28 p-2 border border-dashed border-slate-300 rounded bg-slate-50/50">
                  <div className="text-[9px] text-slate-500 font-semibold uppercase">तयार करणार / संकलक</div>
                  <div className="border-t border-slate-400 pt-1">
                    <div className="font-bold text-slate-900">{signatory2Name}</div>
                    <div className="text-[9px] text-slate-600">प्रा.आ.केंद्र भादा</div>
                  </div>
                </div>

                {/* Center Seal Stamp */}
                <div className="flex flex-col justify-center items-center h-28 p-2 border border-slate-400 rounded bg-slate-50">
                  <div className="w-16 h-16 rounded-full border-2 border-slate-400 border-dashed flex items-center justify-center text-[9px] font-bold text-slate-500 text-center leading-tight">
                    शासकीय<br />गोल शिक्का<br />(Office Seal)
                  </div>
                </div>

                {/* Right Signatory */}
                <div className="flex flex-col justify-between h-28 p-2 border border-dashed border-slate-300 rounded bg-slate-50/50">
                  <div className="text-[9px] text-slate-500 font-semibold uppercase">मान्यवर / सक्षम अधिकारी</div>
                  <div className="border-t border-slate-400 pt-1">
                    <div className="font-black text-slate-900">{officerName}</div>
                    <div className="text-[10px] font-bold text-slate-800">{officerDesignation}</div>
                    <div className="text-[9px] text-slate-600">प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर</div>
                  </div>
                </div>
              </div>

              {/* Security & System stamp */}
              <div className="flex items-center justify-between text-[9px] text-slate-400 mt-4 font-mono">
                <div>सिस्टीम जनरेटेड शासकीय नमुना अहवाल • प्राथमिक आरोग्य केंद्र भादा</div>
                <div>पृष्ठ १ / १ • दिनांक: {currentDateStr}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
