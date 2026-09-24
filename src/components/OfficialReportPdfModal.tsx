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
  Award,
  FlaskConical,
} from 'lucide-react';
import { User, SampleRecord } from '../types';

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
  singleSampleRecord?: SampleRecord;
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
  singleSampleRecord,
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    singleSampleRecord ? 'portrait' : orientationDefault
  );
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

  const handleDownloadOfflineDoc = () => {
    const tableHeaderHtml = columns
      .map(
        (c) =>
          `<th style="border:1px solid #333;padding:6px;background:#f1f5f9;font-size:11px;text-align:${c.align || 'left'}">${c.header}</th>`
      )
      .join('');

    const tableRowsHtml = data
      .map((row, idx) => {
        const cells = columns
          .map((c) => {
            const val = c.accessor ? row[c.accessor] ?? '—' : '—';
            return `<td style="border:1px solid #ccc;padding:5px;font-size:10px;text-align:${c.align || 'left'}">${val}</td>`;
          })
          .join('');
        return `<tr><td style="border:1px solid #ccc;padding:5px;text-align:center;font-size:10px;">${idx + 1}</td>${cells}</tr>`;
      })
      .join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="utf-8">
  <title>${customTitle} — प्राथमिक आरोग्य केंद्र भादा</title>
  <style>
    @page { size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'}; margin: 10mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 0; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; }
    .gov-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #0f172a; }
    .phc-title { font-size: 16px; font-weight: 900; color: #0f172a; margin: 3px 0; }
    .meta-bar { display: flex; justify-content: space-between; font-size: 10px; font-family: monospace; border-top: 1px solid #e2e8f0; padding-top: 5px; margin-top: 5px; }
    .report-title-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; border-radius: 6px; text-align: center; margin-bottom: 15px; }
    .report-title { font-size: 14px; font-weight: 800; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
    th { background-color: #e2e8f0; border: 1px solid #475569; padding: 6px; font-weight: bold; }
    td { border: 1px solid #cbd5e1; padding: 5px; }
    .stats-grid { display: flex; gap: 8px; margin-bottom: 15px; }
    .stat-card { flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px; text-align: center; border-radius: 4px; }
    .stat-val { font-size: 14px; font-weight: bold; }
    .stat-lbl { font-size: 9px; color: #64748b; }
    .signature-grid { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #94a3b8; }
    .sig-box { width: 28%; text-align: center; border: 1px dashed #cbd5e1; padding: 10px; border-radius: 6px; }
    .seal-box { width: 28%; text-align: center; border: 1px solid #94a3b8; border-radius: 6px; padding: 10px; }
    .seal-circle { width: 65px; height: 65px; border-radius: 50%; border: 2px dashed #64748b; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; }
    .footer-note { font-size: 9px; color: #94a3b8; text-align: center; margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="gov-title">महाराष्ट्र शासन — सार्वजनिक आरोग्य विभाग</div>
    <div>जिल्हा परिषद लातूर | तालुका आरोग्य अधिकारी कार्यालय, औसा</div>
    <div class="phc-title">प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर (पिन: ४१३५२०)</div>
    <div style="font-size:10px;color:#64748b;">ईमेल: phcbhada@gmail.com • अधिकृत आरोग्य नमुना नोंदवही व प्रयोगशाळा संनियंत्रण प्रणाली</div>
    <div class="meta-bar">
      <div><strong>जावक क्र.:</strong> ${docRefNo}</div>
      <div><strong>दिनांक:</strong> ${currentDateStr}</div>
    </div>
  </div>

  <div class="report-title-box">
    <div class="report-title">${customTitle}</div>
    ${reportSubtitle ? `<div style="font-size:11px;color:#475569;margin-top:2px;">${reportSubtitle}</div>` : ''}
    ${periodText ? `<div style="font-size:10px;font-weight:bold;margin-top:3px;">कालावधी: ${periodText}</div>` : ''}
  </div>

  ${
    summaryStats.length > 0
      ? `<div class="stats-grid">${summaryStats
          .map(
            (st) => `<div class="stat-card"><div class="stat-lbl">${st.label}</div><div class="stat-val">${st.value}</div></div>`
          )
          .join('')}</div>`
      : ''
  }

  <table>
    <thead>
      <tr>
        <th style="width:35px;text-align:center;">अ.क्र.</th>
        ${tableHeaderHtml}
      </tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
    </tbody>
  </table>

  <div style="background:#f8fafc;border:1px solid #cbd5e1;padding:8px;border-radius:4px;font-size:10px;margin-bottom:15px;">
    <strong>प्रमाणपत्र / शेरा:</strong> ${officialRemark}
  </div>

  <div class="signature-grid">
    <div class="sig-box">
      <div style="font-size:9px;color:#64748b;margin-bottom:25px;">तयार करणार / संकलक</div>
      <div style="font-weight:bold;font-size:11px;">${signatory2Name}</div>
      <div style="font-size:9px;color:#64748b;">प्रा.आ.केंद्र भादा</div>
    </div>
    <div class="seal-box">
      <div class="seal-circle">शासकीय गोल शिक्का</div>
      <div style="font-size:9px;color:#64748b;margin-top:4px;">Office Seal</div>
    </div>
    <div class="sig-box">
      <div style="font-size:9px;color:#64748b;margin-bottom:25px;">मान्यवर / सक्षम अधिकारी</div>
      <div style="font-weight:bold;font-size:11px;">${officerName}</div>
      <div style="font-size:10px;color:#0f172a;font-weight:600;">${officerDesignation}</div>
      <div style="font-size:9px;color:#64748b;">प्रा.आ.केंद्र भादा, ता. औसा</div>
    </div>
  </div>

  <div class="footer-note">
    सिस्टीम जनरेटेड अधिकृत शासकीय नमुना अहवाल • प्राथमिक आरोग्य केंद्र भादा • दिनांक: ${currentDateStr}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Official_PHC_Bhada_Report_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Dynamic Print @page CSS for exact PDF page size & orientation */}
      <style>{`
        @media print {
          @page {
            size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'} !important;
            margin: 8mm 10mm 10mm 10mm !important;
          }
          body {
            background: white !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div
        className={`bg-white rounded-xl shadow-2xl w-full border border-slate-300 flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:rounded-none ${
          orientation === 'landscape' ? 'max-w-6xl' : 'max-w-4xl'
        }`}
      >
        {/* Modal Toolbar (Hidden during print) */}
        <div className="p-3.5 bg-slate-900 text-white rounded-t-xl flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 print:hidden shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  शासकीय अहवाल PDF प्रिव्ह्यू (Official PDF Export)
                </h3>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded font-mono font-bold">
                  {singleSampleRecord ? '१ नमुना प्रमाणपत्र' : `${data.length} नोंदी`}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                महाराष्ट्र शासन मानकानुसार अधिकृत लेआउट, शीर्षलेख, मुद्रण व स्वाक्षरी ब्लॉक
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

            {/* Offline Doc Download */}
            <button
              type="button"
              onClick={handleDownloadOfflineDoc}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3 py-2 rounded-lg font-bold text-xs shadow transition-all active:scale-95 cursor-pointer"
              title="ऑफलाईन दस्तऐवज (.html / .doc) स्वरूपात सेव्ह करा"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">दस्तऐवज सेव्ह करा</span>
            </button>

            {/* Print / Save as PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              title="ब्राउझर प्रिंट डायलॉग उघडून 'Save as PDF' करा"
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
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                अहवाल शीर्षक:
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-semibold focus:outline-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                जावक / संदर्भ क्रमांक:
              </label>
              <input
                type="text"
                value={docRefNo}
                onChange={(e) => setDocRefNo(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono focus:outline-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                मान्यवर वैद्यकीय अधिकारी:
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-semibold focus:outline-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                अधिकारी पदनाम:
              </label>
              <input
                type="text"
                value={officerDesignation}
                onChange={(e) => setOfficerDesignation(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs focus:outline-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                तयार करणार स्वाक्षरी पदनाम:
              </label>
              <input
                type="text"
                value={signatory2Name}
                onChange={(e) => setSignatory2Name(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs focus:outline-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                अहवाल शेरा / टीप:
              </label>
              <input
                type="text"
                value={officialRemark}
                onChange={(e) => setOfficialRemark(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs focus:outline-emerald-600"
              />
            </div>
          </div>
        )}

        {/* Scrollable Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
          {/* Printable Page Wrapper */}
          <div
            className={`mx-auto bg-white p-6 sm:p-8 border border-slate-300 shadow-lg rounded print:border-none print:shadow-none print:p-0 print:m-0 ${
              orientation === 'landscape' ? 'w-full print:landscape-page' : 'max-w-[210mm] print:portrait-page'
            }`}
          >
            {/* 1. OFFICIAL MAHARASHTRA GOVERNMENT HEADER */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center relative">
              {/* Ashoka Emblem / Maharashtra Seal Graphical Motif */}
              <div className="flex justify-center items-center mb-1">
                <div className="w-10 h-10 rounded-full border-2 border-amber-700 bg-amber-50 flex items-center justify-center shadow-xs">
                  <Building2 className="w-5 h-5 text-amber-900" />
                </div>
              </div>

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
                ईमेल: phcbhada@gmail.com • अधिकृत आरोग्य नमुना नोंदवही व प्रयोगशाळा संनियंत्रण प्रणाली
              </div>

              {/* Horizontal line separation */}
              <div className="mt-2 pt-1 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-700 font-mono">
                <div>
                  <span className="font-bold">संदर्भ / जावक क्र.: </span>
                  <span className="text-emerald-950 font-bold">{docRefNo}</span>
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
                <div className="inline-block mt-1 bg-white border border-slate-300 px-3 py-0.5 rounded-full text-[10px] font-bold text-slate-800 shadow-2xs">
                  कालावधी: {periodText}
                </div>
              )}
            </div>

            {/* 3. ACTIVE FILTERS BADGES (If any) */}
            {filterDetails.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-3 text-[10px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                <span className="font-bold text-slate-900">लागू असलेले फिल्टर्स:</span>
                {filterDetails.map((f, i) => (
                  <span
                    key={i}
                    className="bg-white px-2 py-0.5 rounded border border-slate-300 font-medium"
                  >
                    <strong className="text-slate-900">{f.label}:</strong> {f.value}
                  </span>
                ))}
              </div>
            )}

            {/* 4. SUMMARY METRICS CARDS (If provided) */}
            {summaryStats.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
                {summaryStats.map((st, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 border border-slate-300 p-2 rounded text-center shadow-2xs"
                  >
                    <div className="text-[9px] font-bold text-slate-600 uppercase tracking-tight truncate">
                      {st.label}
                    </div>
                    <div className={`text-base font-black ${st.colorClass || 'text-slate-900'}`}>
                      {st.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. SINGLE SAMPLE CERTIFICATE MODE (If provided) */}
            {singleSampleRecord ? (
              <div className="border border-slate-300 rounded-lg p-4 mb-6 bg-slate-50/50 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-700" />
                    <span className="font-bold text-slate-900 text-sm">
                      नमुना तपासणी व गुणवत्ता प्रमाणपत्र (Sample Analysis Certificate)
                    </span>
                  </div>
                  <span className="font-mono font-black text-emerald-950 px-2 py-0.5 bg-emerald-100 border border-emerald-300 rounded">
                    {singleSampleRecord.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded border border-slate-200">
                  <div>
                    <span className="text-slate-500 text-[10px] block">नमुना प्रकार:</span>
                    <strong className="text-slate-900">{singleSampleRecord.sampleTypeName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">गाव व उपकेंद्र:</span>
                    <strong className="text-slate-900">
                      {singleSampleRecord.villageName} ({singleSampleRecord.subcenter || singleSampleRecord.subcenterName})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">स्त्रोत / संस्था / रुग्ण:</span>
                    <strong className="text-slate-900">
                      {singleSampleRecord.sourceName ||
                        singleSampleRecord.patientName ||
                        singleSampleRecord.shopOrInstitutionName ||
                        '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">बाटली / बॅच क्र.:</span>
                    <strong className="text-slate-900 font-mono">
                      {singleSampleRecord.sampleCodeOrBottleNo || singleSampleRecord.batchNumber || '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">संकलन दिनांक:</span>
                    <strong className="text-slate-900">{singleSampleRecord.collectionDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">जावक पत्र क्र. व दिनांक:</span>
                    <strong className="text-slate-900">
                      {singleSampleRecord.sendingLetterNumber
                        ? `${singleSampleRecord.sendingLetterNumber} (${singleSampleRecord.sendingDate || singleSampleRecord.dispatchDate || ''})`
                        : '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">प्रयोगशाळा नाव:</span>
                    <strong className="text-slate-900">{singleSampleRecord.laboratoryName || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">प्रयोगशाळा अहवाल क्र. व दिनांक:</span>
                    <strong className="text-slate-900">
                      {singleSampleRecord.reportNumber
                        ? `${singleSampleRecord.reportNumber} (दि. ${singleSampleRecord.reportReceivedDate || ''})`
                        : '—'}
                    </strong>
                  </div>
                </div>

                {/* Laboratory Parameters If Present */}
                {singleSampleRecord.resultQuantitative &&
                  Object.keys(singleSampleRecord.resultQuantitative).length > 0 && (
                    <div className="bg-white p-3 rounded border border-emerald-200">
                      <div className="font-bold text-emerald-950 mb-2 flex items-center gap-1.5">
                        <FlaskConical className="w-4 h-4 text-emerald-700" />
                        <span>प्रयोगशाळा तपासणी निकाल व मापदंड (Quantitative Lab Findings):</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        {singleSampleRecord.resultQuantitative.residualChlorine !== undefined && (
                          <div className="bg-slate-50 p-2 rounded border border-slate-200">
                            <span className="text-slate-500 text-[10px] block">उर्वरित क्लोरीन:</span>
                            <strong className="font-mono text-slate-900">
                              {singleSampleRecord.resultQuantitative.residualChlorine} mg/L (PPM)
                            </strong>
                          </div>
                        )}
                        {singleSampleRecord.resultQuantitative.turbidity !== undefined && (
                          <div className="bg-slate-50 p-2 rounded border border-slate-200">
                            <span className="text-slate-500 text-[10px] block">गढूळपणा (Turbidity):</span>
                            <strong className="font-mono text-slate-900">
                              {singleSampleRecord.resultQuantitative.turbidity} NTU
                            </strong>
                          </div>
                        )}
                        {singleSampleRecord.resultQuantitative.pH !== undefined && (
                          <div className="bg-slate-50 p-2 rounded border border-slate-200">
                            <span className="text-slate-500 text-[10px] block">सामू (pH):</span>
                            <strong className="font-mono text-slate-900">
                              {singleSampleRecord.resultQuantitative.pH}
                            </strong>
                          </div>
                        )}
                        {singleSampleRecord.resultQuantitative.tds !== undefined && (
                          <div className="bg-slate-50 p-2 rounded border border-slate-200">
                            <span className="text-slate-500 text-[10px] block">TDS:</span>
                            <strong className="font-mono text-slate-900">
                              {singleSampleRecord.resultQuantitative.tds} mg/L
                            </strong>
                          </div>
                        )}
                        {singleSampleRecord.resultQuantitative.iodinePpm !== undefined && (
                          <div className="bg-slate-50 p-2 rounded border border-slate-200">
                            <span className="text-slate-500 text-[10px] block">आयोडीन प्रमाण:</span>
                            <strong className="font-mono text-slate-900">
                              {singleSampleRecord.resultQuantitative.iodinePpm} PPM
                            </strong>
                          </div>
                        )}
                        {singleSampleRecord.resultQuantitative.availableChlorinePercent !== undefined && (
                          <div className="bg-slate-50 p-2 rounded border border-slate-200">
                            <span className="text-slate-500 text-[10px] block">उपलब्ध क्लोरीन:</span>
                            <strong className="font-mono text-slate-900">
                              {singleSampleRecord.resultQuantitative.availableChlorinePercent}%
                            </strong>
                          </div>
                        )}
                        {singleSampleRecord.resultQuantitative.measlesIgmResult && (
                          <div className="bg-slate-50 p-2 rounded border border-slate-200">
                            <span className="text-slate-500 text-[10px] block">Measles IgM:</span>
                            <strong className="text-slate-900">
                              {singleSampleRecord.resultQuantitative.measlesIgmResult}
                            </strong>
                          </div>
                        )}
                        {singleSampleRecord.resultQuantitative.ns1Result && (
                          <div className="bg-slate-50 p-2 rounded border border-slate-200">
                            <span className="text-slate-500 text-[10px] block">Dengue NS1:</span>
                            <strong className="text-slate-900">
                              {singleSampleRecord.resultQuantitative.ns1Result}
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Final Verdict Banner */}
                <div
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    singleSampleRecord.result?.includes('योग्य') ||
                    singleSampleRecord.result?.includes('प्रमाणित') ||
                    singleSampleRecord.result === 'निगेटिव्ह'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  <div>
                    <span className="text-[11px] block font-semibold text-slate-600">
                      अंतिम अधिकृत निकाल / निष्कर्ष:
                    </span>
                    <strong className="text-sm">
                      {singleSampleRecord.result || 'निकाल प्रलंबित (Pending)'}
                    </strong>
                  </div>
                  <div className="text-[11px] text-right">
                    <span className="text-slate-500 block">शेरा:</span>
                    <strong>{singleSampleRecord.remarks || singleSampleRecord.reportRemarks || 'कोणताही शेरा नाही'}</strong>
                  </div>
                </div>
              </div>
            ) : (
              /* 5. OFFICIAL DATA TABLE */
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
                            col.align === 'center'
                              ? 'text-center'
                              : col.align === 'right'
                              ? 'text-right'
                              : 'text-left'
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
                        <td
                          colSpan={columns.length + 1}
                          className="p-4 text-center text-slate-500 font-medium"
                        >
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
                                col.align === 'center'
                                  ? 'text-center'
                                  : col.align === 'right'
                                  ? 'text-right'
                                  : 'text-left'
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
            )}

            {/* 6. OFFICIAL REMARKS & DECLARATION */}
            <div className="bg-slate-50 border border-slate-300 p-2.5 rounded text-[10px] text-slate-700 mb-8 shadow-2xs">
              <span className="font-bold text-slate-900">प्रमाणपत्र / शेरा: </span>
              <span>{officialRemark}</span>
            </div>

            {/* 7. OFFICIAL SIGNATURE & STAMP BLOCK */}
            <div className="pt-6 border-t border-slate-400 break-inside-avoid">
              <div className="grid grid-cols-3 gap-4 text-center text-[10px] sm:text-[11px] text-slate-900">
                {/* Left Signatory */}
                <div className="flex flex-col justify-between h-28 p-2 border border-dashed border-slate-300 rounded bg-slate-50/50">
                  <div className="text-[9px] text-slate-500 font-semibold uppercase">
                    तयार करणार / संकलक
                  </div>
                  <div className="border-t border-slate-400 pt-1">
                    <div className="font-bold text-slate-900">{signatory2Name}</div>
                    <div className="text-[9px] text-slate-600">प्रा.आ.केंद्र भादा</div>
                  </div>
                </div>

                {/* Center Seal Stamp */}
                <div className="flex flex-col justify-center items-center h-28 p-2 border border-slate-400 rounded bg-slate-50 shadow-2xs">
                  <div className="w-16 h-16 rounded-full border-2 border-slate-400 border-dashed flex items-center justify-center text-[9px] font-bold text-slate-600 text-center leading-tight">
                    शासकीय<br />गोल शिक्का<br />(Office Seal)
                  </div>
                </div>

                {/* Right Signatory */}
                <div className="flex flex-col justify-between h-28 p-2 border border-dashed border-slate-300 rounded bg-slate-50/50">
                  <div className="text-[9px] text-slate-500 font-semibold uppercase">
                    मान्यवर / सक्षम अधिकारी
                  </div>
                  <div className="border-t border-slate-400 pt-1">
                    <div className="font-black text-slate-900">{officerName}</div>
                    <div className="text-[10px] font-bold text-slate-800">{officerDesignation}</div>
                    <div className="text-[9px] text-slate-600">
                      प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर
                    </div>
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
