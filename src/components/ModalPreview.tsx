import React from 'react';
import { X, Printer, Download } from 'lucide-react';

interface ModalPreviewProps {
  isOpen: boolean;
  title: string;
  htmlContent: string;
  onClose: () => void;
}

export const ModalPreview: React.FC<ModalPreviewProps> = ({
  isOpen,
  title,
  htmlContent,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  const handleDownloadHTML = () => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[\s/\\:]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate mr-4">
            <h3 className="font-bold text-sm sm:text-base tracking-tight truncate">{title}</h3>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={handleDownloadHTML}
              className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
              title="HTML दस्तऐवज डाउनलोड करा"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">डाउनलोड</span>
            </button>
            <button
              onClick={handlePrint}
              id="btn-print-document"
              className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg shadow-sm transition-colors"
              title="दस्तऐवज मुद्रित करा (Print / PDF)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="बंद करा"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Preview Body */}
        <div className="flex-1 overflow-auto bg-slate-100 p-3 sm:p-6">
          <div className="bg-white mx-auto shadow-md rounded-lg overflow-hidden max-w-4xl p-2 sm:p-6">
            <div
              className="preview-container text-slate-900"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <div>प्राथमिक आरोग्य केंद्र, भादा • अधिकृत शासकीय अहवाल दस्तऐवज</div>
          <div>मुद्रणासाठी वरील &apos;प्रिंट / PDF&apos; बटण वापरा</div>
        </div>
      </div>
    </div>
  );
};
