import React, { useState } from 'react';
import { clientStore } from '../services/clientStore';
import { SubcenterVillageImportRow, SubcenterVillageImportSummary } from '../types';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';

const SAMPLE_CSV = `subcenter_code,subcenter_name,village_code,village_name,english_name,taluka,district
BHD,भादा,BHD,भादा,Bhada,औसा,लातूर
BHD,भादा,KND,खंडाळा,Khandala,औसा,लातूर
LKH,लखनगाव,LKH,लखनगाव,Lakhangaon,औसा,लातूर
LKH,लखनगाव,KOR,कोराळा,Korala,औसा,लातूर
MLK,मलकापूर,MLK,मलकापूर,Malkapur,औसा,लातूर
MLK,मलकापूर,SHV,शिवली,Shivli,औसा,लातूर
UTT,उत्तमा,UTT,उत्तमा,Uttama,औसा,लातूर
UTT,उत्तमा,WNG,वानगाव,Wangaon,औसा,लातूर`;

interface MasterBulkImportProps {
  onImportComplete?: () => void;
}

export const MasterBulkImport: React.FC<MasterBulkImportProps> = ({ onImportComplete }) => {
  const [csvText, setCsvText] = useState<string>(SAMPLE_CSV);
  const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);
  const [previewSummary, setPreviewSummary] = useState<SubcenterVillageImportSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [commitResult, setCommitResult] = useState<SubcenterVillageImportSummary | null>(null);

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(SAMPLE_CSV);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'subcenters_villages_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvToRows = (text: string): SubcenterVillageImportRow[] => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) return [];

    const rows: SubcenterVillageImportRow[] = [];
    const startIndex = lines[0].toLowerCase().includes('subcenter') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 4) {
        rows.push({
          subcenterCode: parts[0],
          subcenterName: parts[1],
          villageCode: parts[2],
          villageName: parts[3],
          englishName: parts[4] || parts[3],
          taluka: parts[5] || 'औसा',
          district: parts[6] || 'लातूर',
        });
      }
    }
    return rows;
  };

  const handleValidate = () => {
    setCommitResult(null);
    const rows = parseCsvToRows(csvText);
    if (rows.length === 0) {
      alert('कृपया वैध CSV डेटा प्रविष्ट करा (किमान १ डेटा ओळ आवश्यक).');
      return;
    }

    const existingVillages = clientStore.getAllVillages();
    const existingVillageCodes = new Set(existingVillages.map((v) => v.code.toUpperCase()));
    const batchCodes = new Set<string>();

    const summary: SubcenterVillageImportSummary = {
      totalRows: rows.length,
      validRows: 0,
      subcentersCreated: 0,
      villagesCreated: 0,
      duplicatesFound: 0,
      errors: [],
      previewRows: [],
    };

    rows.forEach((r, idx) => {
      const rowNum = idx + 1;
      const issues: string[] = [];
      const scCode = (r.subcenterCode || '').trim().toUpperCase();
      const scName = (r.subcenterName || '').trim();
      const vilCode = (r.villageCode || '').trim().toUpperCase();
      const vilName = (r.villageName || '').trim();

      if (!scCode) issues.push('उपकेंद्र कोड आवश्यक आहे.');
      if (!scName) issues.push('उपकेंद्र नाव आवश्यक आहे.');
      if (!vilCode) issues.push('गाव कोड आवश्यक आहे.');
      if (!vilName) issues.push('गाव नाव आवश्यक आहे.');

      let status: 'VALID' | 'DUPLICATE' | 'INVALID' = 'VALID';

      if (issues.length > 0) {
        status = 'INVALID';
        summary.errors.push(`ओळ ${rowNum}: ${issues.join(', ')}`);
      } else if (existingVillageCodes.has(vilCode) || batchCodes.has(vilCode)) {
        status = 'DUPLICATE';
        summary.duplicatesFound++;
        issues.push(`गाव कोड "${vilCode}" आधीपासून अस्तित्वात आहे.`);
      } else {
        batchCodes.add(vilCode);
        summary.validRows++;
      }

      summary.previewRows.push({
        rowNumber: rowNum,
        subcenterCode: scCode,
        subcenterName: scName,
        villageCode: vilCode,
        villageName: vilName,
        englishName: r.englishName || vilName,
        taluka: r.taluka || 'औसा',
        district: r.district || 'लातूर',
        status,
        issues,
      });
    });

    setPreviewSummary(summary);
  };

  const handleExecuteImport = () => {
    const rows = parseCsvToRows(csvText);
    if (rows.length === 0) return;

    setIsProcessing(true);
    try {
      const summary = clientStore.importSubcentersAndVillages(rows);
      setCommitResult(summary);
      setPreviewSummary(null);
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'आयात अयशस्वी झाली.';
      alert(`त्रुटी: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setCsvText(content);
        setPreviewSummary(null);
        setCommitResult(null);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              एक्सेल / सीएसव्ही द्वारे उपकेंद्र व गाव मास्टर घाऊक आयात (Bulk CSV Import)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              एकाच वेळी एकाधिक उपकेंद्रे व त्या अंतर्गत येणारी गावे संबंधांसह (FK Mapping) आयात करा.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs"
            >
              {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedTemplate ? 'कॉपी झाले!' : 'नमुना कॉपी करा'}</span>
            </button>
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV नमुना डाउनलोड</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">CSV फॉरमॅट नियम:</p>
          <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px] text-slate-700">
            <li>हेडर: subcenter_code,subcenter_name,village_code,village_name,english_name,taluka,district</li>
            <li>उपकेंद्र अस्तित्वात नसल्यास सिस्टीम आपोआप नवीन उपकेंद्र तयार करेल.</li>
            <li>गाव कोड आधीपासून अस्तित्वात असल्यास डुप्लिकेट म्हणून वगळले जाईल.</li>
          </ul>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-800">
            CSV डेटा पेस्ट करा किंवा फाईल निवडा:
          </label>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
          />
        </div>

        <textarea
          rows={8}
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value);
            setPreviewSummary(null);
            setCommitResult(null);
          }}
          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          placeholder="subcenter_code,subcenter_name,village_code,village_name..."
        />

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setCsvText(SAMPLE_CSV)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            डीफॉल्ट नमुना डेटा भरा
          </button>

          <button
            type="button"
            onClick={handleValidate}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            <span>डेटा तपासा व पूर्वावलोकन करा (Validate & Preview)</span>
          </button>
        </div>
      </div>

      {/* Validation Preview Card */}
      {previewSummary && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                आयात पूर्व तपासणी निकाल (Import Preview & Dry-Run)
              </h4>
              <p className="text-xs text-slate-500">
                डेटाबेसमध्ये समाविष्ट करण्यापूर्वी नोंदींची खात्री करा.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800">
                एकूण ओळी: {previewSummary.totalRows}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800">
                वैध ओळी: {previewSummary.validRows}
              </span>
              {previewSummary.duplicatesFound > 0 && (
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-100 text-amber-800">
                  डुप्लिकेट कोड: {previewSummary.duplicatesFound}
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full border-collapse border border-slate-200 text-xs">
              <thead className="sticky top-0 bg-slate-100">
                <tr className="text-left text-slate-800">
                  <th className="border border-slate-200 p-2">#</th>
                  <th className="border border-slate-200 p-2">उपकेंद्र कोड</th>
                  <th className="border border-slate-200 p-2">उपकेंद्र नाव</th>
                  <th className="border border-slate-200 p-2">गाव कोड</th>
                  <th className="border border-slate-200 p-2">गावाचे नाव</th>
                  <th className="border border-slate-200 p-2">इंग्रजी नाव</th>
                  <th className="border border-slate-200 p-2">स्थिती</th>
                  <th className="border border-slate-200 p-2">नोंद / त्रुटी</th>
                </tr>
              </thead>
              <tbody>
                {previewSummary.previewRows.map((r) => (
                  <tr
                    key={r.rowNumber}
                    className={`hover:bg-slate-50 ${
                      r.status === 'INVALID'
                        ? 'bg-rose-50/50'
                        : r.status === 'DUPLICATE'
                        ? 'bg-amber-50/50'
                        : ''
                    }`}
                  >
                    <td className="border border-slate-200 p-2 font-mono">{r.rowNumber}</td>
                    <td className="border border-slate-200 p-2 font-mono font-bold text-slate-800">
                      {r.subcenterCode}
                    </td>
                    <td className="border border-slate-200 p-2 font-semibold text-emerald-800">
                      {r.subcenterName}
                    </td>
                    <td className="border border-slate-200 p-2 font-mono font-bold text-slate-800">
                      {r.villageCode}
                    </td>
                    <td className="border border-slate-200 p-2 font-bold text-slate-900">
                      {r.villageName}
                    </td>
                    <td className="border border-slate-200 p-2 text-slate-600">{r.englishName}</td>
                    <td className="border border-slate-200 p-2">
                      {r.status === 'VALID' && (
                        <span className="flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> वैध
                        </span>
                      )}
                      {r.status === 'DUPLICATE' && (
                        <span className="flex items-center gap-1 text-amber-700 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" /> डुप्लिकेट
                        </span>
                      )}
                      {r.status === 'INVALID' && (
                        <span className="flex items-center gap-1 text-rose-700 font-bold">
                          <XCircle className="w-3.5 h-3.5" /> अवैध
                        </span>
                      )}
                    </td>
                    <td className="border border-slate-200 p-2 text-[11px] text-slate-600">
                      {(r.issues || []).join(' | ') || 'समाविष्ट करण्यासाठी तयार'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-slate-500">
              * केवळ वैध असलेल्या ओळी डेटाबेसमध्ये समाविष्ट केल्या जातील.
            </span>
            <button
              type="button"
              disabled={isProcessing || previewSummary.validRows === 0}
              onClick={handleExecuteImport}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold shadow-sm ${
                previewSummary.validRows > 0
                  ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isProcessing
                  ? 'प्रक्रिया सुरू आहे...'
                  : `${previewSummary.validRows} वैध नोंदी आयात करा (Commit)`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Success Summary Result */}
      {commitResult && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-5 shadow-sm space-y-3 animate-in zoom-in-95">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <span>मास्टर डेटा यशस्वीरित्या आयात करण्यात आला!</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white border border-emerald-200 rounded-lg p-3">
              <span className="text-slate-500 block">एकूण तपासलेल्या ओळी:</span>
              <strong className="text-base text-slate-800">{commitResult.totalRows}</strong>
            </div>
            <div className="bg-white border border-emerald-200 rounded-lg p-3">
              <span className="text-slate-500 block">नवीन उपकेंद्रे तयार केली:</span>
              <strong className="text-base text-emerald-700 font-bold">
                {commitResult.subcentersCreated}
              </strong>
            </div>
            <div className="bg-white border border-emerald-200 rounded-lg p-3">
              <span className="text-slate-500 block">नवीन गावे जोडली:</span>
              <strong className="text-base text-emerald-700 font-bold">
                {commitResult.villagesCreated}
              </strong>
            </div>
            <div className="bg-white border border-emerald-200 rounded-lg p-3">
              <span className="text-slate-500 block">वगळलेले डुप्लिकेट:</span>
              <strong className="text-base text-amber-700 font-bold">
                {commitResult.duplicatesFound}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
