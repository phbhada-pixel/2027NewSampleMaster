import React from 'react';
import { SampleRecord } from '../../types';

interface DengueForwardingLetterPrintProps {
  samples: SampleRecord[];
  letterNumber: string;
  letterDate: string;
  doctorName?: string;
  doctorMobile?: string;
  isStandalone?: boolean;
}

export const DengueForwardingLetterPrint: React.FC<DengueForwardingLetterPrintProps> = ({
  samples,
  letterNumber,
  letterDate,
  doctorName = 'Dr. Patil S.S.',
  doctorMobile = '9689686901',
  isStandalone = false,
}) => {
  const formatDateDMY = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const [y, m, d] = dateStr.split('-');
      if (y && m && d) return `${d}-${m}-${y}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const outwardDisplay = letterNumber.startsWith('जा.क्र.')
    ? letterNumber
    : `जा.क्र. ${letterNumber}`;

  return (
    <div
      id="gmc-latur-forwarding-letter"
      className="a4-print-page bg-white text-slate-900 p-8 sm:p-12 max-w-4xl mx-auto shadow-md border border-slate-300 rounded-sm font-serif print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none leading-relaxed"
      style={{
        pageBreakAfter: isStandalone ? 'auto' : 'always',
        breakAfter: isStandalone ? 'auto' : 'page',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {/* Government Letterhead */}
      <div className="text-center space-y-1 border-b-2 border-slate-900 pb-3">
        <h1 className="text-base sm:text-lg font-bold tracking-wide">महाराष्ट्र शासन</h1>
        <h2 className="text-lg sm:text-xl font-black">प्राथमिक आरोग्य केंद्र, भादा, ता. औसा, जि. लातूर</h2>
        <p className="text-xs font-sans text-slate-700">
          पत्ता: मु. पो. भादा, ता. औसा, जि. लातूर - ४१३५२० | ईमेल: phcbhada@gmail.com
        </p>
      </div>

      {/* Outward Number & Date */}
      <div className="flex justify-between items-center text-xs sm:text-sm font-semibold mt-4">
        <div>{outwardDisplay}</div>
        <div>दिनांक: {formatDateDMY(letterDate)}</div>
      </div>

      {/* Recipient */}
      <div className="mt-6 text-xs sm:text-sm space-y-0.5 leading-relaxed">
        <div className="font-bold">प्रति,</div>
        <div className="font-bold">प्रयोगशाळा अधिकारी,</div>
        <div>शासकीय वैद्यकीय महाविद्यालय (GMC),</div>
        <div>लातूर.</div>
      </div>

      {/* Subject */}
      <div className="mt-5 text-xs sm:text-sm font-bold text-center underline tracking-wide">
        विषय : डेंगी व चिकनगुनिया सिरम नमुने तपासणीसाठी पाठविणेबाबत.
      </div>

      {/* Letter Body */}
      <div className="mt-4 text-xs sm:text-sm leading-relaxed text-justify indent-8">
        महोदय,
        <br />
        <span className="inline-block mt-1 indent-8">
          उपरोक्त विषयी विनंती की, प्राथमिक आरोग्य केंद्र भादा अंतर्गत खालील रुग्णांचे डेंगी व चिकनगुनिया संशयित सिरम नमुने तपासणीसाठी या पत्रासोबत पाठविण्यात येत आहेत. तरी कृपया सदर नमुने तपासून अहवाल मिळावा, ही विनंती.
        </span>
      </div>

      {/* Forwarding Letter Table (Strict format per Reference PDF) */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse border border-slate-900 text-xs sm:text-sm text-left">
          <thead>
            <tr className="bg-slate-100 font-bold text-slate-900 border-b border-slate-900 text-center">
              <th className="border border-slate-900 px-2 py-2 w-12">अ.क्र.</th>
              <th className="border border-slate-900 px-3 py-2 text-left">रुग्णाचे नाव</th>
              <th className="border border-slate-900 px-3 py-2">गाव</th>
              <th className="border border-slate-900 px-2 py-2 w-16">वय</th>
              <th className="border border-slate-900 px-2 py-2 w-20">लिंग</th>
              <th className="border border-slate-900 px-3 py-2 w-32">नमुना घेतल्याचा दिनांक</th>
            </tr>
          </thead>
          <tbody>
            {samples.map((sample, idx) => (
              <tr key={sample.id} className="border-b border-slate-800">
                <td className="border border-slate-900 px-2 py-2 text-center font-mono">
                  {idx + 1}
                </td>
                <td className="border border-slate-900 px-3 py-2 font-bold uppercase">
                  {sample.patientName || '-'}
                </td>
                <td className="border border-slate-900 px-3 py-2 text-center">
                  {sample.villageName || '-'}
                </td>
                <td className="border border-slate-900 px-2 py-2 text-center font-mono">
                  {sample.age || '-'}
                </td>
                <td className="border border-slate-900 px-2 py-2 text-center">
                  {sample.sex === 'पुरुष' || sample.sex === 'Male'
                    ? 'MALE'
                    : sample.sex === 'स्त्री' || sample.sex === 'Female'
                    ? 'FEMALE'
                    : sample.sex || '-'}
                </td>
                <td className="border border-slate-900 px-3 py-2 text-center font-mono">
                  {formatDateDMY(sample.collectionDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Official Signatory (Bottom-Right) */}
      <div className="mt-16 flex justify-end">
        <div className="text-center text-xs sm:text-sm font-semibold space-y-1 min-w-[200px]">
          <div className="font-bold">वैद्यकीय अधिकारी</div>
          <div className="text-slate-900 font-bold mt-1">{doctorName}</div>
          <div className="text-slate-800">प्राथमिक आरोग्य केंद्र, भादा</div>
          <div className="text-[11px] text-slate-500 font-sans">मोबाईल क्र. {doctorMobile}</div>
        </div>
      </div>
    </div>
  );
};
