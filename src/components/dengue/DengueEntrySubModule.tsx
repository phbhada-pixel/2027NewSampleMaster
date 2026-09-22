import React, { useState, useMemo } from 'react';
import { clientStore } from '../../services/clientStore';
import { SampleRecord, User, VillageMaster, SubcenterMaster } from '../../types';
import {
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Activity,
  User as UserIcon,
  Home,
  Thermometer,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface DengueEntrySubModuleProps {
  currentUser: User;
  onSampleCreated?: (sample: SampleRecord) => void;
  onSwitchToDocs?: (sampleId: string) => void;
}

export const DengueEntrySubModule: React.FC<DengueEntrySubModuleProps> = ({
  currentUser,
  onSampleCreated,
  onSwitchToDocs,
}) => {
  const villages = clientStore.getVillages();
  const subcenters = clientStore.getSubcenters();
  const todayStr = new Date().toISOString().split('T')[0];

  // System-generated / Identification
  const [previewSampleId, setPreviewSampleId] = useState<string>(() =>
    clientStore.generateSampleId('ST-006')
  );
  const [testRequested, setTestRequested] = useState<string>('डेंग्यू (NS1/IgM)');
  const [collectionDate, setCollectionDate] = useState<string>(todayStr);

  // Patient Info
  const [patientName, setPatientName] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [sex, setSex] = useState<'पुरुष' | 'स्त्री' | 'इतर'>('पुरुष');
  const [registrationNo, setRegistrationNo] = useState<string>('');
  const [wardNo, setWardNo] = useState<string>('-');
  const [bedNo, setBedNo] = useState<string>('-');

  // Address & Hierarchy
  const [selectedVillageId, setSelectedVillageId] = useState<string>(
    villages.length > 0 ? villages[0].id : ''
  );
  const [houseNo, setHouseNo] = useState<string>('-');
  const [hospitalAddress, setHospitalAddress] = useState<string>(
    'प्राथमिक आरोग्य केंद्र, भादा, ता. औसा, जि. लातूर'
  );

  // Symptom / Specimen
  const [feverOnsetDate, setFeverOnsetDate] = useState<string>(todayStr);
  const [natureOfSample, setNatureOfSample] = useState<'Serum' | 'Blood' | 'CSF'>('Serum');

  // Clinical Findings: Yes / No + Duration in Days
  const [feverPresent, setFeverPresent] = useState<boolean>(true);
  const [feverDurationDays, setFeverDurationDays] = useState<string>('1');

  const [headachePresent, setHeadachePresent] = useState<boolean>(false);
  const [headacheDurationDays, setHeadacheDurationDays] = useState<string>('');

  const [bodyachePresent, setBodyachePresent] = useState<boolean>(false);
  const [bodyacheDurationDays, setBodyacheDurationDays] = useState<string>('');

  const [jointPainPresent, setJointPainPresent] = useState<boolean>(false);
  const [jointPainDurationDays, setJointPainDurationDays] = useState<string>('');

  const [retroOrbitalPainPresent, setRetroOrbitalPainPresent] = useState<boolean>(false);
  const [retroOrbitalPainDurationDays, setRetroOrbitalPainDurationDays] = useState<string>('');

  const [rashPresent, setRashPresent] = useState<boolean>(false);
  const [rashDurationDays, setRashDurationDays] = useState<string>('');

  // Haemorrhagic Manifestations: Yes / No + Duration in Days
  const [hematemesisPresent, setHematemesisPresent] = useState<boolean>(false);
  const [hematemesisDurationDays, setHematemesisDurationDays] = useState<string>('');

  const [epistaxisPresent, setEpistaxisPresent] = useState<boolean>(false);
  const [epistaxisDurationDays, setEpistaxisDurationDays] = useState<string>('');

  const [melenaPresent, setMelenaPresent] = useState<boolean>(false);
  const [melenaDurationDays, setMelenaDurationDays] = useState<string>('');

  const [otherHemorrhagicPresent, setOtherHemorrhagicPresent] = useState<boolean>(false);
  const [otherHemorrhagicDescription, setOtherHemorrhagicDescription] = useState<string>('');
  const [otherHemorrhagicDurationDays, setOtherHemorrhagicDurationDays] = useState<string>('');

  const [remarks, setRemarks] = useState<string>('');

  // UI state
  const [missingErrors, setMissingErrors] = useState<string[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<SampleRecord | null>(null);
  const [successSample, setSuccessSample] = useState<SampleRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Resolved hierarchy
  const currentVillage = useMemo(() => {
    return villages.find((v) => v.id === selectedVillageId) || villages[0];
  }, [selectedVillageId, villages]);

  const currentSubcenter = useMemo(() => {
    if (!currentVillage) return null;
    return (
      subcenters.find((s) => s.id === currentVillage.subcenterId) || {
        subcenterName: currentVillage.subcenterName || currentVillage.subcenter || 'भादा',
      }
    );
  }, [currentVillage, subcenters]);

  // Symptom toggle helper: Changing Yes -> No clears duration, Changing No -> Yes requires new duration
  const handleSymptomToggle = (
    key: 'fever' | 'headache' | 'bodyache' | 'jointPain' | 'retroOrbital' | 'rash',
    present: boolean
  ) => {
    if (key === 'fever') {
      setFeverPresent(present);
      if (!present) setFeverDurationDays('');
    } else if (key === 'headache') {
      setHeadachePresent(present);
      if (!present) setHeadacheDurationDays('');
    } else if (key === 'bodyache') {
      setBodyachePresent(present);
      if (!present) setBodyacheDurationDays('');
    } else if (key === 'jointPain') {
      setJointPainPresent(present);
      if (!present) setJointPainDurationDays('');
    } else if (key === 'retroOrbital') {
      setRetroOrbitalPainPresent(present);
      if (!present) setRetroOrbitalPainDurationDays('');
    } else if (key === 'rash') {
      setRashPresent(present);
      if (!present) setRashDurationDays('');
    }
  };

  // Haemorrhagic toggle helper
  const handleHaemorrhagicToggle = (
    key: 'hematemesis' | 'epistaxis' | 'melena' | 'other',
    present: boolean
  ) => {
    if (key === 'hematemesis') {
      setHematemesisPresent(present);
      if (!present) setHematemesisDurationDays('');
    } else if (key === 'epistaxis') {
      setEpistaxisPresent(present);
      if (!present) setEpistaxisDurationDays('');
    } else if (key === 'melena') {
      setMelenaPresent(present);
      if (!present) setMelenaDurationDays('');
    } else if (key === 'other') {
      setOtherHemorrhagicPresent(present);
      if (!present) {
        setOtherHemorrhagicDescription('');
        setOtherHemorrhagicDurationDays('');
      }
    }
  };

  const resetForm = () => {
    setPreviewSampleId(clientStore.generateSampleId('ST-006'));
    setPatientName('');
    setContactNumber('');
    setAge('');
    setSex('पुरुष');
    setRegistrationNo('');
    setWardNo('-');
    setBedNo('-');
    setHouseNo('-');
    setFeverOnsetDate(todayStr);
    setCollectionDate(todayStr);
    setNatureOfSample('Serum');

    // Reset symptoms
    setFeverPresent(true);
    setFeverDurationDays('1');
    setHeadachePresent(false);
    setHeadacheDurationDays('');
    setBodyachePresent(false);
    setBodyacheDurationDays('');
    setJointPainPresent(false);
    setJointPainDurationDays('');
    setRetroOrbitalPainPresent(false);
    setRetroOrbitalPainDurationDays('');
    setRashPresent(false);
    setRashDurationDays('');

    // Reset haemorrhagic
    setHematemesisPresent(false);
    setHematemesisDurationDays('');
    setEpistaxisPresent(false);
    setEpistaxisDurationDays('');
    setMelenaPresent(false);
    setMelenaDurationDays('');
    setOtherHemorrhagicPresent(false);
    setOtherHemorrhagicDescription('');
    setOtherHemorrhagicDurationDays('');

    setRemarks('');
    setMissingErrors([]);
    setDuplicateWarning(null);
    setSuccessSample(null);
  };

  const handleValidateAndSubmit = (bypassDuplicateCheck = false) => {
    setMissingErrors([]);
    setDuplicateWarning(null);
    setSuccessSample(null);

    const missing: string[] = [];

    if (!patientName.trim()) {
      missing.push('रुग्णाचे संपूर्ण नाव (Patient Full Name)');
    }

    if (!selectedVillageId || !currentVillage) {
      missing.push('गाव (Village)');
    }

    const numAge = Number(age);
    if (!age.trim() || isNaN(numAge) || numAge <= 0 || numAge > 125) {
      missing.push('अचूक वय १ ते १२५ दरम्यान (Valid Age 1-125)');
    }

    if (!sex) {
      missing.push('लिंग (Sex: Male/Female/Other)');
    }

    if (!feverOnsetDate) {
      missing.push('ताप सुरू झाल्याचा दिनांक (Date Of Onset of First Symptom)');
    }

    if (!natureOfSample) {
      missing.push('नमुन्याचे स्वरूप (Nature of Sample)');
    }

    if (!collectionDate) {
      missing.push('नमुना संकलन दिनांक (Date of Sample Collection)');
    }

    if (feverOnsetDate && collectionDate && feverOnsetDate > collectionDate) {
      missing.push('ताप सुरुवात दिनांक हा संकलन दिनांकापेक्षा नंतरचा असू शकत नाही');
    }

    if (contactNumber.trim() && !/^\d{10}$/.test(contactNumber.trim())) {
      missing.push('मोबाईल क्रमांक १० अंकी असणे आवश्यक आहे');
    }

    // Clinical Findings Validations: If Yes, positive integer duration is REQUIRED
    if (feverPresent) {
      const d = parseInt(feverDurationDays, 10);
      if (!feverDurationDays || isNaN(d) || d <= 0) {
        missing.push('ताप (Fever): किती दिवसांपासून आहे त्याचा वैध कालावधी (दिवस) प्रविष्ट करा (उदा. १ किंवा अधिक).');
      }
    }

    if (headachePresent) {
      const d = parseInt(headacheDurationDays, 10);
      if (!headacheDurationDays || isNaN(d) || d <= 0) {
        missing.push('डोकेदुखी (Headache): किती दिवसांपासून आहे त्याचा वैध कालावधी (दिवस) प्रविष्ट करा.');
      }
    }

    if (bodyachePresent) {
      const d = parseInt(bodyacheDurationDays, 10);
      if (!bodyacheDurationDays || isNaN(d) || d <= 0) {
        missing.push('अंगदुखी (Bodyache): किती दिवसांपासून आहे त्याचा वैध कालावधी (दिवस) प्रविष्ट करा.');
      }
    }

    if (jointPainPresent) {
      const d = parseInt(jointPainDurationDays, 10);
      if (!jointPainDurationDays || isNaN(d) || d <= 0) {
        missing.push('सांधेदुखी (Joint Pain): किती दिवसांपासून आहे त्याचा वैध कालावधी (दिवस) प्रविष्ट करा.');
      }
    }

    if (retroOrbitalPainPresent) {
      const d = parseInt(retroOrbitalPainDurationDays, 10);
      if (!retroOrbitalPainDurationDays || isNaN(d) || d <= 0) {
        missing.push('डोळ्यांमागे दुखणे (Retro Orbital Pain): किती दिवसांपासून आहे त्याचा वैध कालावधी (दिवस) प्रविष्ट करा.');
      }
    }

    if (rashPresent) {
      const d = parseInt(rashDurationDays, 10);
      if (!rashDurationDays || isNaN(d) || d <= 0) {
        missing.push('पुरळ (Rash): किती दिवसांपासून आहे त्याचा वैध कालावधी (दिवस) प्रविष्ट करा.');
      }
    }

    // Haemorrhagic Manifestations Validations
    if (hematemesisPresent) {
      const d = parseInt(hematemesisDurationDays, 10);
      if (!hematemesisDurationDays || isNaN(d) || d <= 0) {
        missing.push('रक्तउलटी (Hematemesis): किती दिवसांपासून आहे त्याचा वैध कालावधी (दिवस) प्रविष्ट करा.');
      }
    }

    if (epistaxisPresent) {
      const d = parseInt(epistaxisDurationDays, 10);
      if (!epistaxisDurationDays || isNaN(d) || d <= 0) {
        missing.push('नाकातून रक्त (Epistaxis): किती दिवसांपासून आहे त्याचा वैध कालावधी (दिवस) प्रविष्ट करा.');
      }
    }

    if (melenaPresent) {
      const d = parseInt(melenaDurationDays, 10);
      if (!melenaDurationDays || isNaN(d) || d <= 0) {
        missing.push('काळी विष्ठा (Melena): किती दिवसांपासून आहे त्याचा वैध कालावधी (दिवस) प्रविष्ट करा.');
      }
    }

    if (otherHemorrhagicPresent) {
      if (!otherHemorrhagicDescription.trim()) {
        missing.push('इतर रक्तस्राव (Other Manifestation): लक्षण तपशील प्रविष्ट करा.');
      }
      const d = parseInt(otherHemorrhagicDurationDays, 10);
      if (!otherHemorrhagicDurationDays || isNaN(d) || d <= 0) {
        missing.push('इतर रक्तस्राव (Other Manifestation): किती दिवसांपासून आहे त्याचा वैध कालावधी (दिवस) प्रविष्ट करा.');
      }
    }

    if (missing.length > 0) {
      setMissingErrors(missing);
      return;
    }

    // Duplicate Check
    if (!bypassDuplicateCheck) {
      const duplicate = clientStore.checkDuplicateSample({
        patientName: patientName.trim(),
        patientRegNo: registrationNo.trim(),
        villageId: currentVillage.id,
        collectionDate: collectionDate,
        sampleTypeId: 'ST-006',
      });

      if (duplicate) {
        setDuplicateWarning(duplicate);
        return;
      }
    }

    // Execute Save
    setIsSubmitting(true);
    try {
      // Numerical values: positive integer if Yes, null if No (NEVER store 0 when No)
      const feverNum = feverPresent ? parseInt(feverDurationDays, 10) : null;
      const headacheNum = headachePresent ? parseInt(headacheDurationDays, 10) : null;
      const bodyacheNum = bodyachePresent ? parseInt(bodyacheDurationDays, 10) : null;
      const jointPainNum = jointPainPresent ? parseInt(jointPainDurationDays, 10) : null;
      const retroOrbitalNum = retroOrbitalPainPresent ? parseInt(retroOrbitalPainDurationDays, 10) : null;
      const rashNum = rashPresent ? parseInt(rashDurationDays, 10) : null;

      const hematemesisNum = hematemesisPresent ? parseInt(hematemesisDurationDays, 10) : null;
      const epistaxisNum = epistaxisPresent ? parseInt(epistaxisDurationDays, 10) : null;
      const melenaNum = melenaPresent ? parseInt(melenaDurationDays, 10) : null;
      const otherNum = otherHemorrhagicPresent ? parseInt(otherHemorrhagicDurationDays, 10) : null;

      const hasAnyHaemorrhagic =
        hematemesisPresent || epistaxisPresent || melenaPresent || otherHemorrhagicPresent;

      const created = clientStore.addSample({
        sampleTypeId: 'ST-006',
        sampleTypeName: 'Dengue / Chikungunya – Serum Sample',
        collectionDate,
        villageId: currentVillage.id,
        villageName: currentVillage.name,
        subcenterId: currentVillage.subcenterId,
        subcenterName: currentSubcenter ? currentSubcenter.subcenterName : 'भादा',
        subcenter: currentSubcenter ? currentSubcenter.subcenterName : 'भादा',
        phcName: currentVillage.phcName || 'भादा',
        taluka: currentVillage.taluka || 'औसा',
        district: currentVillage.district || 'लातूर',
        laboratoryName: 'शासकीय वैद्यकीय महाविद्यालय (GMC) प्रयोगशाळा, लातूर',
        status: 'Collected',
        patientName: patientName.trim(),
        age: numAge,
        sex,
        contactNumber: contactNumber.trim(),
        mobile: contactNumber.trim(),
        patientAddress: currentVillage.name,
        houseNo: houseNo.trim() || '-',
        hospitalAddress: hospitalAddress.trim(),
        patientRegNo: registrationNo.trim() || previewSampleId,
        registrationNo: registrationNo.trim() || previewSampleId,
        wardNo: wardNo.trim() || '-',
        bedNo: bedNo.trim() || '-',
        feverOnsetDate,
        symptomOnsetDate: feverOnsetDate,
        natureOfSample,
        testRequested,

        // Structured Clinical Findings Model
        feverPresent: feverPresent ? 'Yes' : 'No',
        feverDurationDays: feverNum,

        headachePresent: headachePresent ? 'Yes' : 'No',
        headacheDurationDays: headacheNum,

        bodyachePresent: bodyachePresent ? 'Yes' : 'No',
        bodyacheDurationDays: bodyacheNum,

        jointPainPresent: jointPainPresent ? 'Yes' : 'No',
        jointPainDurationDays: jointPainNum,

        retroOrbitalPainPresent: retroOrbitalPainPresent ? 'Yes' : 'No',
        retroOrbitalPainDurationDays: retroOrbitalNum,

        rashPresent: rashPresent ? 'Yes' : 'No',
        rashDurationDays: rashNum,

        // Structured Haemorrhagic Manifestations Model
        hematemesisPresent: hematemesisPresent ? 'Yes' : 'No',
        hematemesisDurationDays: hematemesisNum,

        epistaxisPresent: epistaxisPresent ? 'Yes' : 'No',
        epistaxisDurationDays: epistaxisNum,

        melenaPresent: melenaPresent ? 'Yes' : 'No',
        melenaDurationDays: melenaNum,

        otherHemorrhagicPresent: otherHemorrhagicPresent ? 'Yes' : 'No',
        otherHemorrhagicDescription: otherHemorrhagicPresent ? otherHemorrhagicDescription.trim() : '',
        otherHemorrhagicDurationDays: otherNum,

        otherHaemorrhagicPresent: otherHemorrhagicPresent ? 'Yes' : 'No',
        otherHaemorrhagicDescription: otherHemorrhagicPresent ? otherHemorrhagicDescription.trim() : '',
        otherHaemorrhagicDurationDays: otherNum,

        // Backward compatibility mappings
        clinicalFindings: {
          fever: feverNum !== null ? `${feverNum} Days` : '0 Days',
          headache: headacheNum !== null ? `${headacheNum} Days` : '0 Days',
          bodyache: bodyacheNum !== null ? `${bodyacheNum} Days` : '0 Days',
          jointPain: jointPainNum !== null ? `${jointPainNum} Days` : '0 Days',
          retroOrbitalPain: retroOrbitalNum !== null ? `${retroOrbitalNum} Days` : '0 Days',
          rash: rashNum !== null ? `${rashNum} Days` : '0 Days',
        },
        fever: feverPresent ? 'होय' : 'नाही',
        feverDuration: feverNum !== null ? `${feverNum} Days` : undefined,
        headache: headachePresent ? 'होय' : 'नाही',
        headacheDuration: headacheNum !== null ? `${headacheNum} Days` : undefined,
        bodyache: bodyachePresent ? 'होय' : 'नाही',
        bodyacheDuration: bodyacheNum !== null ? `${bodyacheNum} Days` : undefined,
        jointPain: jointPainPresent ? 'होय' : 'नाही',
        jointPainDuration: jointPainNum !== null ? `${jointPainNum} Days` : undefined,
        retroOrbitalPain: retroOrbitalPainPresent ? 'होय' : 'नाही',
        retroOrbitalPainDuration: retroOrbitalNum !== null ? `${retroOrbitalNum} Days` : undefined,
        rash: rashPresent ? 'होय' : 'नाही',
        rashDuration: rashNum !== null ? `${rashNum} Days` : undefined,

        haemorrhagicManifestation: hasAnyHaemorrhagic ? 'होय' : 'नाही',
        hematemesis: hematemesisPresent ? 'होय' : 'नाही',
        epistaxis: epistaxisPresent ? 'होय' : 'नाही',
        melena: melenaPresent ? 'होय' : 'नाही',
        otherHaemorrhagic: otherHemorrhagicPresent ? otherHemorrhagicDescription.trim() : 'None',

        remarks: remarks.trim() || 'डेंग्यू / चिकनगुनिया संशयित सिरम नमुना',
      });

      setSuccessSample(created);
      setPreviewSampleId(clientStore.generateSampleId('ST-006'));
      if (onSampleCreated) {
        onSampleCreated(created);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'नमुना जतन करताना त्रुटी आली.';
      setMissingErrors([`डेटाबेस त्रुटी: ${msg}`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-rose-700" />
            डेंग्यू / चिकनगुनिया सिरम नमुना नोंदणी (Dengue &amp; Chikungunya Serum Sample Entry)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            NIV पुणे केस हिस्ट्री पत्रक व GMC लातूर जावक पत्रासाठी आवश्यक सर्व तपशील
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-rose-50 border border-rose-200 text-rose-900 font-bold px-3 py-1.5 rounded-lg shadow-xs">
            Sample ID: {previewSampleId}
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {successSample && (
        <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">
                नमुना {successSample.id} यशस्वीरीत्या नोंदवला गेला आहे!
              </div>
              <p className="mt-0.5">
                रुग्ण: <strong>{successSample.patientName}</strong> | गाव: {successSample.villageName} | वय: {successSample.age} वर्षे ({successSample.sex}) | संकलन दिनांक: {successSample.collectionDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (onSwitchToDocs) onSwitchToDocs(successSample.id);
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded shadow flex items-center gap-1.5 text-xs"
            >
              <span>दस्तऐवज पहा (View Docs)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetForm}
              className="bg-white border border-emerald-300 text-emerald-800 font-bold px-3 py-1.5 rounded hover:bg-emerald-100"
            >
              नवीन नोंदणी (New)
            </button>
          </div>
        </div>
      )}

      {/* Missing Fields Error Alert */}
      {missingErrors.length > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-r-lg space-y-2">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>खालील आवश्यक माहिती अपूर्ण अथवा अवैध आहे (Exact Missing Fields):</span>
          </div>
          <ul className="list-disc list-inside text-xs text-rose-800 space-y-0.5 pl-2">
            {missingErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Duplicate Warning Dialog / Banner */}
      {duplicateWarning && (
        <div className="bg-amber-50 border-2 border-amber-500 p-4 rounded-xl space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-950 text-sm">
                या रुग्णाचा समान नमुना नोंदवलेला असण्याची शक्यता आहे.
              </div>
              <p className="text-xs text-amber-900 mt-1">
                डेटाबेसमध्ये समान नाव किंवा नोंदणी क्रमांक, गाव आणि संकलन दिनांक असलेला नमुना आधीच अस्तित्वात आहे:
              </p>
              <div className="mt-2 bg-white/80 p-2.5 rounded border border-amber-300 text-xs font-mono text-amber-950 space-y-1">
                <div>• अस्तित्वात असलेला Sample ID: <strong>{duplicateWarning.id}</strong></div>
                <div>• रुग्णाचे नाव: <strong>{duplicateWarning.patientName}</strong> (वय: {duplicateWarning.age})</div>
                <div>• गाव: {duplicateWarning.villageName} | संकलन दिनांक: {duplicateWarning.collectionDate}</div>
                <div>• स्थिती: {duplicateWarning.status} {duplicateWarning.sendingLetterNumber ? `(पत्र क्र: ${duplicateWarning.sendingLetterNumber})` : ''}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-amber-200 text-xs">
            <button
              onClick={() => setDuplicateWarning(null)}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-bold rounded hover:bg-slate-50"
            >
              तपशील तपासा / रद्द करा (Review &amp; Cancel)
            </button>
            <button
              onClick={() => handleValidateAndSubmit(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded shadow"
            >
              तरीही नोंदणी करा (Proceed Anyway)
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleValidateAndSubmit(false);
        }}
        className="space-y-6"
      >
        {/* A. SAMPLE / IDENTIFICATION */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-rose-700" />
            <span>भाग १: नमुना व चाचणी तपशील (Sample &amp; Test Information)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">नमुना प्रकार (Sample Type):</label>
              <input
                type="text"
                disabled
                value="Dengue / Chikungunya – Serum Sample"
                className="w-full bg-slate-200 border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">नोंदणी दिनांक (Entry Date):</label>
              <input
                type="date"
                disabled
                value={todayStr}
                className="w-full bg-slate-200 border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">नोंदणीकर्ता (Created By):</label>
              <input
                type="text"
                disabled
                value={currentUser.name}
                className="w-full bg-slate-200 border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 truncate"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                मागणी केलेली तपासणी (Test Requested)*:
              </label>
              <select
                value={testRequested}
                onChange={(e) => setTestRequested(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-rose-500"
              >
                <option value="डेंग्यू (NS1/IgM)">Dengue NS1 / IgM ELISA</option>
                <option value="चिकनगुनिया (IgM)">Chikungunya IgM</option>
                <option value="डेंग्यू व चिकनगुनिया">Dengue + Chikungunya (दोन्ही)</option>
                <option value="Dengue NS1">Dengue NS1</option>
                <option value="Dengue IgM ELISA">Dengue IgM ELISA</option>
              </select>
            </div>
          </div>
        </div>

        {/* B. PATIENT INFORMATION */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <UserIcon className="w-4 h-4 text-rose-700" />
            <span>भाग २: रुग्णाची माहिती (Patient Information)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">
                रुग्णाचे संपूर्ण नाव (Patient Full Name)*:
              </label>
              <input
                type="text"
                required
                placeholder="उदा. रमेश मारुती कांबळे"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-semibold focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">मोबाईल क्र. (Mobile):</label>
              <input
                type="tel"
                placeholder="उदा. 9822114455"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-800 focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">वय वर्षे (Age)*:</label>
              <input
                type="number"
                min="1"
                max="125"
                required
                placeholder="उदा. 34"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">लिंग (Sex)*:</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as 'पुरुष' | 'स्त्री' | 'इतर')}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-slate-800 focus:ring-2 focus:ring-rose-500"
              >
                <option value="पुरुष">पुरुष (Male)</option>
                <option value="स्त्री">स्त्री (Female)</option>
                <option value="इतर">इतर (Other)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">नोंदणी क्र. (Reg. No):</label>
              <input
                type="text"
                placeholder="उदा. OPD-1044 / IPD-88"
                value={registrationNo}
                onChange={(e) => setRegistrationNo(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-800 focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">वॉर्ड क्र. (Ward No):</label>
              <input
                type="text"
                placeholder="-"
                value={wardNo}
                onChange={(e) => setWardNo(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">बेड क्र. (Bed No):</label>
              <input
                type="text"
                placeholder="-"
                value={bedNo}
                onChange={(e) => setBedNo(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">घर क्रमांक (House No):</label>
              <input
                type="text"
                placeholder="उदा. H-22"
                value={houseNo}
                onChange={(e) => setHouseNo(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">रुग्णालय पत्ता (Hospital Address):</label>
              <input
                type="text"
                value={hospitalAddress}
                onChange={(e) => setHospitalAddress(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 truncate"
              />
            </div>
          </div>
        </div>

        {/* C. RESIDENTIAL ADDRESS & HIERARCHY */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Home className="w-4 h-4 text-rose-700" />
            <span>भाग ३: रहिवासी पत्ता व शासकीय रचना (Residential Address &amp; Master Hierarchy)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">गाव (Village)*:</label>
              <select
                value={selectedVillageId}
                onChange={(e) => setSelectedVillageId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-rose-500"
              >
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">उपकेंद्र (Subcenter):</label>
              <input
                type="text"
                disabled
                value={currentSubcenter ? currentSubcenter.subcenterName : 'भादा'}
                className="w-full bg-slate-200 border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">तालुका (Taluka):</label>
              <input
                type="text"
                disabled
                value={currentVillage ? currentVillage.taluka || 'औसा' : 'औसा'}
                className="w-full bg-slate-200 border border-slate-300 rounded px-2.5 py-1.5 text-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">जिल्हा (District):</label>
              <input
                type="text"
                disabled
                value={currentVillage ? currentVillage.district || 'लातूर' : 'लातूर'}
                className="w-full bg-slate-200 border border-slate-300 rounded px-2.5 py-1.5 text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* D. FEVER & SPECIMEN */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-rose-700" />
            <span>भाग ४: ताप व नमुना तपशील (Fever &amp; Specimen Details)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                ताप सुरुवात दिनांक (Date Of Onset of First Symptom)*:
              </label>
              <input
                type="date"
                required
                value={feverOnsetDate}
                onChange={(e) => setFeverOnsetDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                नमुन्याचे स्वरूप (Nature of Sample)*:
              </label>
              <select
                value={natureOfSample}
                onChange={(e) => setNatureOfSample(e.target.value as 'Serum' | 'Blood' | 'CSF')}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-rose-500"
              >
                <option value="Serum">Serum (सीरम - डीफॉल्ट)</option>
                <option value="Blood">Blood (रक्त)</option>
                <option value="CSF">CSF (सेरेब्रोस्पाइनल फ्लुइड)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                नमुना संकलन दिनांक (Date of Sample Collection)*:
              </label>
              <input
                type="date"
                required
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>

        {/* E. CLINICAL FINDINGS (Yes / No + Duration in Days) */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-rose-700" />
              भाग ५: क्लिनिकल लक्षणे (Clinical Findings: Yes/No + Duration)
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              Yes असल्यास कालावधी (दिवस) अनिवार्य आहे
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {/* 1. Fever */}
            <div className="p-3 bg-white rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">१. ताप (Fever)</span>
                <div className="inline-flex rounded-md shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleSymptomToggle('fever', true)}
                    className={`px-3 py-1 text-xs font-semibold rounded-l-md border transition-colors ${
                      feverPresent
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSymptomToggle('fever', false)}
                    className={`px-3 py-1 text-xs font-semibold rounded-r-md border border-l-0 transition-colors ${
                      !feverPresent
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
              {feverPresent && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-600">किती दिवसांपासून?</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="दिवस"
                      value={feverDurationDays}
                      onKeyDown={(e) => {
                        if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => setFeverDurationDays(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-16 bg-white border border-rose-300 rounded px-2 py-1 text-xs font-bold text-center font-mono focus:ring-2 focus:ring-rose-500"
                    />
                    <span className="text-[11px] text-slate-600 font-semibold">दिवस</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Headache */}
            <div className="p-3 bg-white rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">२. डोकेदुखी (Headache)</span>
                <div className="inline-flex rounded-md shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleSymptomToggle('headache', true)}
                    className={`px-3 py-1 text-xs font-semibold rounded-l-md border transition-colors ${
                      headachePresent
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSymptomToggle('headache', false)}
                    className={`px-3 py-1 text-xs font-semibold rounded-r-md border border-l-0 transition-colors ${
                      !headachePresent
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
              {headachePresent && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-600">किती दिवसांपासून?</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="दिवस"
                      value={headacheDurationDays}
                      onKeyDown={(e) => {
                        if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => setHeadacheDurationDays(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-16 bg-white border border-rose-300 rounded px-2 py-1 text-xs font-bold text-center font-mono focus:ring-2 focus:ring-rose-500"
                    />
                    <span className="text-[11px] text-slate-600 font-semibold">दिवस</span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Bodyache */}
            <div className="p-3 bg-white rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">३. अंगदुखी (Bodyache)</span>
                <div className="inline-flex rounded-md shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleSymptomToggle('bodyache', true)}
                    className={`px-3 py-1 text-xs font-semibold rounded-l-md border transition-colors ${
                      bodyachePresent
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSymptomToggle('bodyache', false)}
                    className={`px-3 py-1 text-xs font-semibold rounded-r-md border border-l-0 transition-colors ${
                      !bodyachePresent
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
              {bodyachePresent && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-600">किती दिवसांपासून?</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="दिवस"
                      value={bodyacheDurationDays}
                      onKeyDown={(e) => {
                        if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => setBodyacheDurationDays(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-16 bg-white border border-rose-300 rounded px-2 py-1 text-xs font-bold text-center font-mono focus:ring-2 focus:ring-rose-500"
                    />
                    <span className="text-[11px] text-slate-600 font-semibold">दिवस</span>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Joint Pain */}
            <div className="p-3 bg-white rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">४. सांधेदुखी (Joint Pain)</span>
                <div className="inline-flex rounded-md shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleSymptomToggle('jointPain', true)}
                    className={`px-3 py-1 text-xs font-semibold rounded-l-md border transition-colors ${
                      jointPainPresent
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSymptomToggle('jointPain', false)}
                    className={`px-3 py-1 text-xs font-semibold rounded-r-md border border-l-0 transition-colors ${
                      !jointPainPresent
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
              {jointPainPresent && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-600">किती दिवसांपासून?</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="दिवस"
                      value={jointPainDurationDays}
                      onKeyDown={(e) => {
                        if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => setJointPainDurationDays(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-16 bg-white border border-rose-300 rounded px-2 py-1 text-xs font-bold text-center font-mono focus:ring-2 focus:ring-rose-500"
                    />
                    <span className="text-[11px] text-slate-600 font-semibold">दिवस</span>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Retro Orbital Pain */}
            <div className="p-3 bg-white rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">५. डोळ्यांमागे दुखणे (Retro Orbital)</span>
                <div className="inline-flex rounded-md shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleSymptomToggle('retroOrbital', true)}
                    className={`px-3 py-1 text-xs font-semibold rounded-l-md border transition-colors ${
                      retroOrbitalPainPresent
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSymptomToggle('retroOrbital', false)}
                    className={`px-3 py-1 text-xs font-semibold rounded-r-md border border-l-0 transition-colors ${
                      !retroOrbitalPainPresent
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
              {retroOrbitalPainPresent && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-600">किती दिवसांपासून?</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="दिवस"
                      value={retroOrbitalPainDurationDays}
                      onKeyDown={(e) => {
                        if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => setRetroOrbitalPainDurationDays(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-16 bg-white border border-rose-300 rounded px-2 py-1 text-xs font-bold text-center font-mono focus:ring-2 focus:ring-rose-500"
                    />
                    <span className="text-[11px] text-slate-600 font-semibold">दिवस</span>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Rash */}
            <div className="p-3 bg-white rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">६. पुरळ (Rash)</span>
                <div className="inline-flex rounded-md shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleSymptomToggle('rash', true)}
                    className={`px-3 py-1 text-xs font-semibold rounded-l-md border transition-colors ${
                      rashPresent
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSymptomToggle('rash', false)}
                    className={`px-3 py-1 text-xs font-semibold rounded-r-md border border-l-0 transition-colors ${
                      !rashPresent
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
              {rashPresent && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-600">किती दिवसांपासून?</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="दिवस"
                      value={rashDurationDays}
                      onKeyDown={(e) => {
                        if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => setRashDurationDays(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-16 bg-white border border-rose-300 rounded px-2 py-1 text-xs font-bold text-center font-mono focus:ring-2 focus:ring-rose-500"
                    />
                    <span className="text-[11px] text-slate-600 font-semibold">दिवस</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* F. HAEMORRHAGIC MANIFESTATIONS (Yes / No + Duration in Days) */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-700" />
              भाग ६: रक्तस्राव लक्षणे (Haemorrhagic Manifestations: Yes/No + Duration)
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              रक्तस्राव असल्यास Yes निवडून कालावधी नोंदवा
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* a. Hematemesis */}
            <div className="p-3 bg-white rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">१. रक्तउलटी (Hematemesis)</span>
                <div className="inline-flex rounded-md shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleHaemorrhagicToggle('hematemesis', true)}
                    className={`px-3 py-1 text-xs font-semibold rounded-l-md border transition-colors ${
                      hematemesisPresent
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHaemorrhagicToggle('hematemesis', false)}
                    className={`px-3 py-1 text-xs font-semibold rounded-r-md border border-l-0 transition-colors ${
                      !hematemesisPresent
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
              {hematemesisPresent && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-600">किती दिवसांपासून?</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="दिवस"
                      value={hematemesisDurationDays}
                      onKeyDown={(e) => {
                        if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => setHematemesisDurationDays(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-16 bg-white border border-rose-300 rounded px-2 py-1 text-xs font-bold text-center font-mono focus:ring-2 focus:ring-rose-500"
                    />
                    <span className="text-[11px] text-slate-600 font-semibold">दिवस</span>
                  </div>
                </div>
              )}
            </div>

            {/* b. Epistaxis */}
            <div className="p-3 bg-white rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">२. नाकातून रक्त (Epistaxis)</span>
                <div className="inline-flex rounded-md shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleHaemorrhagicToggle('epistaxis', true)}
                    className={`px-3 py-1 text-xs font-semibold rounded-l-md border transition-colors ${
                      epistaxisPresent
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHaemorrhagicToggle('epistaxis', false)}
                    className={`px-3 py-1 text-xs font-semibold rounded-r-md border border-l-0 transition-colors ${
                      !epistaxisPresent
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
              {epistaxisPresent && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-600">किती दिवसांपासून?</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="दिवस"
                      value={epistaxisDurationDays}
                      onKeyDown={(e) => {
                        if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => setEpistaxisDurationDays(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-16 bg-white border border-rose-300 rounded px-2 py-1 text-xs font-bold text-center font-mono focus:ring-2 focus:ring-rose-500"
                    />
                    <span className="text-[11px] text-slate-600 font-semibold">दिवस</span>
                  </div>
                </div>
              )}
            </div>

            {/* c. Melena */}
            <div className="p-3 bg-white rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">३. काळी विष्ठा (Melena)</span>
                <div className="inline-flex rounded-md shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleHaemorrhagicToggle('melena', true)}
                    className={`px-3 py-1 text-xs font-semibold rounded-l-md border transition-colors ${
                      melenaPresent
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHaemorrhagicToggle('melena', false)}
                    className={`px-3 py-1 text-xs font-semibold rounded-r-md border border-l-0 transition-colors ${
                      !melenaPresent
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
              {melenaPresent && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-600">किती दिवसांपासून?</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="दिवस"
                      value={melenaDurationDays}
                      onKeyDown={(e) => {
                        if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => setMelenaDurationDays(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-16 bg-white border border-rose-300 rounded px-2 py-1 text-xs font-bold text-center font-mono focus:ring-2 focus:ring-rose-500"
                    />
                    <span className="text-[11px] text-slate-600 font-semibold">दिवस</span>
                  </div>
                </div>
              )}
            </div>

            {/* d. Other */}
            <div className="p-3 bg-white rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">४. इतर रक्तस्राव (Other)</span>
                <div className="inline-flex rounded-md shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleHaemorrhagicToggle('other', true)}
                    className={`px-3 py-1 text-xs font-semibold rounded-l-md border transition-colors ${
                      otherHemorrhagicPresent
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHaemorrhagicToggle('other', false)}
                    className={`px-3 py-1 text-xs font-semibold rounded-r-md border border-l-0 transition-colors ${
                      !otherHemorrhagicPresent
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
              {otherHemorrhagicPresent && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-2">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                      Other manifestation:
                    </label>
                    <input
                      type="text"
                      placeholder="उदा. Petechiae / हिरड्यांमधून रक्त"
                      value={otherHemorrhagicDescription}
                      onChange={(e) => setOtherHemorrhagicDescription(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-slate-600">किती दिवसांपासून?</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        placeholder="दिवस"
                        value={otherHemorrhagicDurationDays}
                        onKeyDown={(e) => {
                          if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                        }}
                        onChange={(e) => setOtherHemorrhagicDurationDays(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-16 bg-white border border-rose-300 rounded px-2 py-1 text-xs font-bold text-center font-mono focus:ring-2 focus:ring-rose-500"
                      />
                      <span className="text-[11px] text-slate-600 font-semibold">दिवस</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            शेरा / अतिरिक्त वैद्यकीय नोंद (Remarks):
          </label>
          <input
            type="text"
            placeholder="उदा. ताप सर्वेक्षण नमुना / तीव्र अंगदुखी"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={resetForm}
            className="w-full sm:w-auto px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>फॉर्म पूर्ववत करा (Reset)</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-rose-800 hover:bg-rose-900 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>नमुना जतन करा (Save Dengue Sample)</span>
          </button>
        </div>
      </form>
    </div>
  );
};
