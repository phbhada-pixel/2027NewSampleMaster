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

  const formatSymptomsSummary = (sample: SampleRecord) => {
    const list: string[] = [];
    if (sample.feverPresent === 'Yes' || sample.fever === 'होय' || (sample.feverDuration && sample.feverDuration !== '0 Days')) {
      const d = sample.feverDurationDays || sample.feverDuration || '1 दिवस';
      list.push(`ताप (${typeof d === 'number' ? `${d} दिवस` : d})`);
    }
    if (sample.headachePresent === 'Yes' || sample.headache === 'होय' || (sample.headacheDuration && sample.headacheDuration !== '0 Days')) {
      const d = sample.headacheDurationDays || sample.headacheDuration || '1 दिवस';
      list.push(`डोकेदुखी (${typeof d === 'number' ? `${d} दिवस` : d})`);
    }
    if (sample.bodyachePresent === 'Yes' || sample.bodyache === 'होय' || (sample.bodyacheDuration && sample.bodyacheDuration !== '0 Days')) {
      const d = sample.bodyacheDurationDays || sample.bodyacheDuration || '1 दिवस';
      list.push(`अंगदुखी (${typeof d === 'number' ? `${d} दिवस` : d})`);
    }
    if (sample.jointPainPresent === 'Yes' || sample.jointPain === 'होय' || (sample.jointPainDuration && sample.jointPainDuration !== '0 Days')) {
      const d = sample.jointPainDurationDays || sample.jointPainDuration || '1 दिवस';
      list.push(`सांधेदुखी (${typeof d === 'number' ? `${d} दिवस` : d})`);
    }
    if (sample.retroOrbitalPainPresent === 'Yes' || sample.retroOrbitalPain === 'होय' || (sample.retroOrbitalPainDuration && sample.retroOrbitalPainDuration !== '0 Days')) {
      const d = sample.retroOrbitalPainDurationDays || sample.retroOrbitalPainDuration || '1 दिवस';
      list.push(`डोळ्यांमागे दुखणे (${typeof d === 'number' ? `${d} दिवस` : d})`);
    }
    if (sample.rashPresent === 'Yes' || sample.rash === 'होय' || (sample.rashDuration && sample.rashDuration !== '0 Days')) {
      const d = sample.rashDurationDays || sample.rashDuration || '1 दिवस';
      list.push(`पुरळ (${typeof d === 'number' ? `${d} दिवस` : d})`);
    }
    // Haemorrhagic Manifestations
    if (sample.hematemesisPresent === 'Yes' || sample.hematemesis === 'होय') {
      const d = sample.hematemesisDurationDays || sample.hematemesisDuration || '1 दिवस';
      list.push(`रक्तउलटी (${typeof d === 'number' ? `${d} दिवस` : d})`);
    }
    if (sample.epistaxisPresent === 'Yes' || sample.epistaxis === 'होय') {
      const d = sample.epistaxisDurationDays || sample.epistaxisDuration || '1 दिवस';
      list.push(`नाकातून रक्त (${typeof d === 'number' ? `${d} दिवस` : d})`);
    }
    if (sample.petechiaePresent === 'Yes' || sample.petechiae === 'होय') {
      const d = sample.petechiaeDurationDays || sample.petechiaeDuration || '1 दिवस';
      list.push(`त्वचेवर ठिपके (${typeof d === 'number' ? `${d} दिवस` : d})`);
    }
    if (sample.melenaPresent === 'Yes' || sample.melena === 'होय') {
      const d = sample.melenaDurationDays || sample.melenaDuration || '1 दिवस';
      list.push(`काळी विष्ठा (${typeof d === 'number' ? `${d} दिवस` : d})`);
    }
    if (sample.otherHemorrhagicPresent === 'Yes' || sample.otherHaemorrhagicPresent === 'Yes') {
      const desc = sample.otherHemorrhagicDescription || sample.otherHaemorrhagicDescription || 'इतर रक्तस्राव';
      const d = sample.otherHemorrhagicDurationDays || sample.otherHaemorrhagicDurationDays || 1;
      list.push(`${desc} (${d} दिवस)`);
    }
    return list.length > 0 ? list.join(', ') : '-';
  };

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
              <th className="border border-slate-900 px-2 py-2 w-10">अ.क्र.</th>
              <th className="border border-slate-900 px-3 py-2 text-left">रुग्णाचे नाव</th>
              <th className="border border-slate-900 px-3 py-2">गाव</th>
              <th className="border border-slate-900 px-2 py-2 w-14">वय</th>
              <th className="border border-slate-900 px-2 py-2 w-16">लिंग</th>
              <th className="border border-slate-900 px-3 py-2 text-left">क्लिनिकल लक्षणे (कालावधी दिवस)</th>
              <th className="border border-slate-900 px-3 py-2 w-28">नमुना दिनांक</th>
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
                <td className="border border-slate-900 px-3 py-2 text-xs">
                  {formatSymptomsSummary(sample)}
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
