import React from 'react';
import { SampleRecord } from '../../types';

interface DengueCaseHistoryPrintProps {
  sample: SampleRecord;
  medicalOfficerName?: string;
  medicalOfficerMobile?: string;
}

export const DengueCaseHistoryPrint: React.FC<DengueCaseHistoryPrintProps> = ({
  sample,
  medicalOfficerName = 'Dr. Patil S.S.',
  medicalOfficerMobile = '9689686901',
}) => {
  const formatDateDMY = (dateStr?: string) => {
    if (!dateStr) return '____________________';
    try {
      const [y, m, d] = dateStr.split('-');
      if (y && m && d) return `${d}-${m}-${y}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Helper for duration in days formatting
  const formatSymptomFinding = (
    present?: 'Yes' | 'No' | string | boolean,
    days?: number | null,
    legacyDuration?: string | boolean | number
  ): string => {
    if (present === 'Yes' || present === true) {
      if (days !== null && days !== undefined && days > 0) {
        return `Yes (${days} ${days === 1 ? 'Day' : 'Days'})`;
      }
      return 'Yes';
    }
    if (present === 'No' || present === false) {
      return 'No';
    }
    // Fallback to legacy field
    if (legacyDuration !== undefined && legacyDuration !== null && legacyDuration !== '') {
      const lower = String(legacyDuration).toLowerCase().trim();
      if (lower === 'no' || lower === 'नाही' || lower === '0 days' || lower === '0 day' || lower === 'false') {
        return 'No';
      }
      const match = lower.match(/\d+/);
      if (match && parseInt(match[0], 10) > 0) {
        const d = parseInt(match[0], 10);
        return `Yes (${d} ${d === 1 ? 'Day' : 'Days'})`;
      }
      return String(legacyDuration);
    }
    return 'No';
  };

  const talukaName = sample.taluka || 'औसा';
  const distName = sample.district || 'लातूर';
  const hospAddress = sample.hospitalAddress || 'प्राथमिक आरोग्य केंद्र, भादा, ता. औसा, जि. लातूर';

  // Haemorrhagic Manifestation logic
  const isHaemorrhagicYes =
    sample.hematemesisPresent === 'Yes' ||
    sample.epistaxisPresent === 'Yes' ||
    sample.petechiaePresent === 'Yes' ||
    sample.melenaPresent === 'Yes' ||
    sample.otherHemorrhagicPresent === 'Yes' ||
    sample.otherHaemorrhagicPresent === 'Yes' ||
    sample.haemorrhagicManifestation === 'होय' ||
    sample.haemorrhagicManifestation === 'Yes' ||
    Boolean(sample.hematemesis && sample.hematemesis !== 'नाही' && sample.hematemesis !== 'No') ||
    Boolean(sample.epistaxis && sample.epistaxis !== 'नाही' && sample.epistaxis !== 'No') ||
    Boolean(sample.petechiae && sample.petechiae !== 'नाही' && sample.petechiae !== 'No') ||
    Boolean(sample.melena && sample.melena !== 'नाही' && sample.melena !== 'No') ||
    Boolean(
      sample.otherHaemorrhagic &&
        sample.otherHaemorrhagic !== 'None' &&
        sample.otherHaemorrhagic !== 'नाही' &&
        sample.otherHaemorrhagic !== '-'
    );

  return (
    <div
      id={`niv-case-sheet-${sample.id}`}
      className="a4-print-page bg-white text-slate-950 p-8 sm:p-10 max-w-4xl mx-auto shadow-md border border-slate-300 rounded-sm font-serif print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none text-xs sm:text-sm leading-relaxed"
      style={{ pageBreakAfter: 'always', breakAfter: 'page', pageBreakInside: 'avoid', breakInside: 'avoid' }}
    >
      {/* Reference Header */}
      <div className="text-center space-y-0.5">
        <div className="text-base sm:text-lg font-bold tracking-wide">
          National Institute of Virology
        </div>
        <div className="text-xs text-slate-700">20 A Dr. Ambedkar Road</div>
        <div className="text-xs text-slate-700">Post Box No 11</div>
        <div className="text-xs text-slate-700 font-bold">Pune 411 001</div>
      </div>

      {/* Official Title */}
      <div className="text-center font-bold text-sm sm:text-base underline mt-4 tracking-wide uppercase">
        Case history sheet for Dengue / Chikungunya fever
      </div>

      {/* Section Header */}
      <div className="font-bold underline mt-4 text-xs sm:text-sm">
        Information Required to Accompany Specimen:-
      </div>

      {/* Strict 1 to 10 Sequential Fields per Reference PDF */}
      <div className="mt-3.5 space-y-2 text-xs sm:text-[13px]">
        {/* 1. Full name */}
        <div className="flex items-baseline">
          <span className="font-bold w-52 shrink-0">1. Full name of patient</span>
          <span className="font-bold mr-2">:</span>
          <span className="border-b border-dotted border-slate-900 flex-1 font-bold uppercase tracking-wide">
            {sample.patientName || '_________________________________'}
          </span>
        </div>

        {/* 2. Residential Address */}
        <div className="space-y-1">
          <div className="font-bold">2. Residential address of patient</div>
          <div className="pl-6 space-y-1">
            <div className="flex items-baseline">
              <span className="w-40 shrink-0 font-medium">Mobile</span>
              <span className="font-bold mr-2">:</span>
              <span className="border-b border-dotted border-slate-900 flex-1 font-mono font-medium">
                {sample.mobile || sample.contactNumber || '____________________'}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-40 shrink-0 font-medium">A. House No</span>
              <span className="font-bold mr-2">:</span>
              <span className="border-b border-dotted border-slate-900 flex-1">
                {sample.houseNo || '-'}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-40 shrink-0 font-medium">B. Village</span>
              <span className="font-bold mr-2">:</span>
              <span className="border-b border-dotted border-slate-900 flex-1 font-bold">
                {sample.villageName || '____________________'}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-40 shrink-0 font-medium">C. Taluka</span>
              <span className="font-bold mr-2">:</span>
              <span className="border-b border-dotted border-slate-900 flex-1">
                {talukaName}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-40 shrink-0 font-medium">D. District</span>
              <span className="font-bold mr-2">:</span>
              <span className="border-b border-dotted border-slate-900 flex-1">
                {distName}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Hospital Address */}
        <div className="space-y-1">
          <div className="flex items-baseline">
            <span className="font-bold w-52 shrink-0">3. Hospital address</span>
            <span className="font-bold mr-2">:</span>
            <span className="border-b border-dotted border-slate-900 flex-1 font-medium">
              {hospAddress}
            </span>
          </div>
          <div className="pl-6 space-y-1">
            <div className="flex items-baseline">
              <span className="w-40 shrink-0 font-medium">A. Patient Reg No</span>
              <span className="font-bold mr-2">:</span>
              <span className="border-b border-dotted border-slate-900 flex-1 font-mono font-bold">
                {sample.patientRegNo || sample.registrationNo || sample.patientId || sample.id}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-40 shrink-0 font-medium">B. Ward No</span>
              <span className="font-bold mr-2">:</span>
              <span className="border-b border-dotted border-slate-900 flex-1">
                {sample.wardNo || '-'}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-40 shrink-0 font-medium">C. Bed No</span>
              <span className="font-bold mr-2">:</span>
              <span className="border-b border-dotted border-slate-900 flex-1">
                {sample.bedNo || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Age */}
        <div className="flex items-baseline">
          <span className="font-bold w-52 shrink-0">4. Age</span>
          <span className="font-bold mr-2">:</span>
          <span className="border-b border-dotted border-slate-900 flex-1 font-mono font-bold">
            {sample.age ? `${sample.age} Yrs` : '______ Yrs'}
          </span>
        </div>

        {/* 5. Sex */}
        <div className="flex items-baseline">
          <span className="font-bold w-52 shrink-0">5. Sex</span>
          <span className="font-bold mr-2">:</span>
          <span className="border-b border-dotted border-slate-900 flex-1 uppercase font-bold">
            {sample.sex === 'पुरुष' || sample.sex === 'Male'
              ? 'MALE'
              : sample.sex === 'स्त्री' || sample.sex === 'Female'
              ? 'FEMALE'
              : sample.sex || '______'}
          </span>
        </div>

        {/* 6. Date Of Onset of First Symptom */}
        <div className="flex items-baseline">
          <span className="font-bold w-64 shrink-0">6. Date Of Onset of First Symptom</span>
          <span className="font-bold mr-2">:</span>
          <span className="border-b border-dotted border-slate-900 flex-1 font-mono font-medium">
            {formatDateDMY(sample.symptomOnsetDate || sample.feverOnsetDate)}
          </span>
        </div>

        {/* 7. Nature of sample */}
        <div className="flex items-baseline">
          <span className="font-bold w-64 shrink-0">7. Nature of sample Serum/Blood/CSF</span>
          <span className="font-bold mr-2">:</span>
          <span className="border-b border-dotted border-slate-900 flex-1 font-bold">
            {sample.natureOfSample || 'Serum'}
          </span>
        </div>

        {/* 8. Date of sample collection */}
        <div className="flex items-baseline">
          <span className="font-bold w-64 shrink-0">8. Date of sample collection</span>
          <span className="font-bold mr-2">:</span>
          <span className="border-b border-dotted border-slate-900 flex-1 font-mono font-bold">
            {formatDateDMY(sample.collectionDate)}
          </span>
        </div>

        {/* 9. Clinical finding */}
        <div className="space-y-1">
          <div className="font-bold">9. Clinical finding</div>
          <div className="pl-6 space-y-1">
            <div className="flex items-baseline">
              <span className="w-48 shrink-0 font-medium">1. Fever</span>
              <span className="font-bold mr-2">:</span>
              <span className="border-b border-dotted border-slate-900 flex-1 font-medium">
                {formatSymptomFinding(sample.feverPresent, sample.feverDurationDays, sample.feverDuration || sample.fever || '1 Day')}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-48 shrink-0 font-medium">2. Headache</span>
              <span className="font-bold mr-2">:</span>
              <span className="border-b border-dotted border-slate-900 flex-1 font-medium">
                {formatSymptomFinding(sample.headachePresent, sample.headacheDurationDays, sample.headacheDuration || sample.headache)}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-48 shrink-0 font-medium">3. Bodyache</span>
              <span className="font-bold mr-2">:</span>
              <span className="border-b border-dotted border-slate-900 flex-1 font-medium">
                {formatSymptomFinding(sample.bodyachePresent, sample.bodyacheDurationDays, sample.bodyacheDuration || sample.bodyache)}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-48 shrink-0 font-medium">4. Joint Pain</span>
              <span className="font-bold mr-2">:</span>
              <span className="border-b border-dotted border-slate-900 flex-1 font-medium">
                {formatSymptomFinding(sample.jointPainPresent, sample.jointPainDurationDays, sample.jointPainDuration || sample.jointPain)}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-48 shrink-0 font-medium">5. Retro Orbital Pain</span>
              <span className="font-bold mr-2">:</span>
              <span className="border-b border-dotted border-slate-900 flex-1 font-medium">
                {formatSymptomFinding(sample.retroOrbitalPainPresent, sample.retroOrbitalPainDurationDays, sample.retroOrbitalPainDuration || sample.retroOrbitalPain)}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="w-48 shrink-0 font-medium">6. Rash</span>
              <span className="font-bold mr-2">:</span>
              <span className="border-b border-dotted border-slate-900 flex-1 font-medium">
                {formatSymptomFinding(sample.rashPresent, sample.rashDurationDays, sample.rashDuration || sample.rash)}
              </span>
            </div>
          </div>
        </div>

        {/* 10. Haemorrhagic Manifestation */}
        <div className="space-y-1">
          <div className="flex items-baseline">
            <span className="font-bold w-64 shrink-0">10. Haemorrhagic Manifestation</span>
            <span className="font-bold mr-2">:</span>
            <span className="border-b border-dotted border-slate-900 flex-1 font-bold">
              {isHaemorrhagicYes ? 'Yes' : 'No'}
            </span>
          </div>
          {isHaemorrhagicYes && (
            <div className="pl-6 space-y-1">
              <div className="flex items-baseline">
                <span className="w-40 shrink-0 font-medium">a. Hematemesis</span>
                <span className="font-bold mr-2">:</span>
                <span className="border-b border-dotted border-slate-900 flex-1">
                  {formatSymptomFinding(sample.hematemesisPresent, sample.hematemesisDurationDays, sample.hematemesisDuration || sample.hematemesis)}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="w-40 shrink-0 font-medium">b. Epistaxis</span>
                <span className="font-bold mr-2">:</span>
                <span className="border-b border-dotted border-slate-900 flex-1">
                  {formatSymptomFinding(sample.epistaxisPresent, sample.epistaxisDurationDays, sample.epistaxisDuration || sample.epistaxis)}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="w-40 shrink-0 font-medium">c. Petechiae</span>
                <span className="font-bold mr-2">:</span>
                <span className="border-b border-dotted border-slate-900 flex-1">
                  {formatSymptomFinding(sample.petechiaePresent, sample.petechiaeDurationDays, sample.petechiaeDuration || sample.petechiae)}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="w-40 shrink-0 font-medium">d. Melena</span>
                <span className="font-bold mr-2">:</span>
                <span className="border-b border-dotted border-slate-900 flex-1">
                  {formatSymptomFinding(sample.melenaPresent, sample.melenaDurationDays, sample.melenaDuration || sample.melena)}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="w-40 shrink-0 font-medium">e. Other</span>
                <span className="font-bold mr-2">:</span>
                <span className="border-b border-dotted border-slate-900 flex-1">
                  {sample.otherHemorrhagicPresent === 'Yes' || sample.otherHaemorrhagicPresent === 'Yes'
                    ? `${sample.otherHemorrhagicDescription || sample.otherHaemorrhagicDescription || 'Yes'} (${sample.otherHemorrhagicDurationDays || sample.otherHaemorrhagicDurationDays || 1} Days)`
                    : sample.otherHaemorrhagic && sample.otherHaemorrhagic !== 'None' && sample.otherHaemorrhagic !== '-'
                    ? sample.otherHaemorrhagic
                    : 'No'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Official Signatory Box (Bottom Right per format) */}
      <div className="mt-8 pt-4 flex justify-end">
        <div className="text-center space-y-1 text-xs sm:text-sm font-semibold min-w-[200px]">
          <div className="font-bold">Signature of Medical Officer</div>
          <div className="font-bold text-slate-900 mt-2">{sample.medicalOfficerName || medicalOfficerName}</div>
          <div className="text-slate-800 font-mono text-xs">
            Mobile No: {sample.medicalOfficerMobile || medicalOfficerMobile}
          </div>
          <div className="text-[11px] text-slate-500 italic mt-2">(Seal / Stamp)</div>
        </div>
      </div>
    </div>
  );
};
