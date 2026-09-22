import React, { useState, useEffect } from 'react';
import { clientStore } from '../services/clientStore';
import {
  SampleTypeMaster,
  SubcenterMaster,
  VillageMaster,
  SourceMaster,
  User,
  SampleRecord,
} from '../types';
import {
  ClipboardList,
  Droplets,
  TestTube,
  Sparkles,
  FlaskConical,
  Bug,
  HeartPulse,
  PlusCircle,
  Save,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Building,
  UserCheck,
  RotateCcw,
  Sparkle,
  Layers,
} from 'lucide-react';

interface SampleEntryModuleProps {
  currentUser: User;
  onSampleCreated?: (sample: SampleRecord) => void;
  initialSampleTypeId?: string;
}

export const SampleEntryModule: React.FC<SampleEntryModuleProps> = ({
  currentUser,
  onSampleCreated,
  initialSampleTypeId,
}) => {
  const sampleTypes = clientStore.getSampleTypes();
  const subcenters = clientStore.getSubcenters();
  const villages = clientStore.getVillages();

  const [selectedTypeId, setSelectedTypeId] = useState<string>(
    initialSampleTypeId || sampleTypes[0]?.id || 'ST-001'
  );
  const [selectedSubcenterId, setSelectedSubcenterId] = useState<string>('ALL');
  const [selectedVillageId, setSelectedVillageId] = useState<string>(villages[0]?.id || '');
  
  // Filtered villages strictly based on selected subcenter
  const filteredVillages =
    selectedSubcenterId === 'ALL'
      ? villages
      : villages.filter((v) => v.subcenterId === selectedSubcenterId);
  
  // Available sources for current village + sample type
  const [availableSources, setAvailableSources] = useState<SourceMaster[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');

  // Form Fields State
  const [collectionDate, setCollectionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dispatchDate, setDispatchDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [sampleCollector, setSampleCollector] = useState<string>(currentUser.name);
  const [sampleQuantity, setSampleQuantity] = useState<string>('250 ml');
  const [sampleCodeOrBottleNo, setSampleCodeOrBottleNo] = useState<string>('');
  const [laboratoryName, setLaboratoryName] = useState<string>(
    'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर'
  );
  const [remarks, setRemarks] = useState<string>('');

  // Salt / TCL specifics
  const [shopOrInstitutionName, setShopOrInstitutionName] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [manufacturerName, setManufacturerName] = useState<string>('');
  const [mfdDate, setMfdDate] = useState<string>('');
  const [expDate, setExpDate] = useState<string>('');
  const [sampleDescription, setSampleDescription] = useState<string>('');

  // Patient Serum specifics
  const [patientId, setPatientId] = useState<string>(`PT-${Date.now().toString().slice(-4)}`);
  const [patientName, setPatientName] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [sex, setSex] = useState<'पुरुष' | 'स्त्री' | 'इतर'>('पुरुष');
  const [patientAddress, setPatientAddress] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [feverOnsetDate, setFeverOnsetDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [testRequested, setTestRequested] = useState<string>('डेंग्यू (NS1/IgM)');

  // NIV Pune & GMC Latur Dengue Case History Fields
  const [houseNo, setHouseNo] = useState<string>('');
  const [registrationNo, setRegistrationNo] = useState<string>('');
  const [wardNo, setWardNo] = useState<string>('');
  const [bedNo, setBedNo] = useState<string>('');
  const [natureOfSample, setNatureOfSample] = useState<'Serum' | 'Whole Blood' | 'Plasma'>('Serum');
  const [hasFever, setHasFever] = useState<boolean>(true);
  const [hasHeadache, setHasHeadache] = useState<boolean>(true);
  const [hasBodyache, setHasBodyache] = useState<boolean>(true);
  const [hasJointPain, setHasJointPain] = useState<boolean>(false);
  const [hasRetroOrbitalPain, setHasRetroOrbitalPain] = useState<boolean>(false);
  const [hasRash, setHasRash] = useState<boolean>(false);
  const [hasHematemesis, setHasHematemesis] = useState<boolean>(false);
  const [hasEpistaxis, setHasEpistaxis] = useState<boolean>(false);
  const [hasPetechiae, setHasPetechiae] = useState<boolean>(false);
  const [hasMelena, setHasMelena] = useState<boolean>(false);

  // Status & Alerts
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [previewSampleId, setPreviewSampleId] = useState<string>('');

  // Quick Add Source Modal
  const [showAddSourceModal, setShowAddSourceModal] = useState<boolean>(false);
  const [newSourceName, setNewSourceName] = useState<string>('');
  const [newSourceType, setNewSourceType] = useState<string>('विहीर');
  const [newSourceAddress, setNewSourceAddress] = useState<string>('');

  const currentSampleType = sampleTypes.find((st) => st.id === selectedTypeId) || sampleTypes[0];
  const currentVillage = villages.find((v) => v.id === selectedVillageId) || filteredVillages[0] || villages[0];

  // Cascading Handlers
  const handleSubcenterChange = (newScId: string) => {
    setSelectedSubcenterId(newScId);
    const validVillages =
      newScId === 'ALL'
        ? villages
        : villages.filter((v) => v.subcenterId === newScId);

    // If current village doesn't belong to the newly chosen subcenter, reset to first valid village
    if (!validVillages.some((v) => v.id === selectedVillageId)) {
      const nextVil = validVillages[0];
      setSelectedVillageId(nextVil ? nextVil.id : '');
      setSelectedSourceId('');
    }
  };

  const handleVillageChange = (newVilId: string) => {
    setSelectedVillageId(newVilId);
    setSelectedSourceId('');
  };

  // Update available sources whenever village or sample type changes
  useEffect(() => {
    if (selectedVillageId && selectedTypeId) {
      const srcList = clientStore.getSources(selectedVillageId, selectedTypeId);
      setAvailableSources(srcList);
      if (srcList.length > 0) {
        setSelectedSourceId(srcList[0].id);
      } else {
        setSelectedSourceId('');
      }
    }
  }, [selectedVillageId, selectedTypeId]);

  // Update default lab and preview ID
  useEffect(() => {
    if (currentSampleType) {
      setLaboratoryName(currentSampleType.defaultLaboratory);
      setPreviewSampleId(clientStore.generateSampleId(currentSampleType.id));

      if (currentSampleType.codePrefix === 'SLT') {
        setSampleQuantity('500 gm');
      } else if (currentSampleType.codePrefix === 'TCL') {
        setSampleQuantity('250 gm');
      } else if (currentSampleType.codePrefix.startsWith('WS')) {
        setSampleQuantity('250 ml');
      } else {
        setSampleQuantity('2 ml Serum');
      }
    }
  }, [currentSampleType]);

  const resetForm = () => {
    setSampleCodeOrBottleNo('');
    setRemarks('');
    setShopOrInstitutionName('');
    setBatchNumber('');
    setManufacturerName('');
    setMfdDate('');
    setExpDate('');
    setSampleDescription('');
    setPatientName('');
    setAge('');
    setPatientAddress('');
    setContactNumber('');
    setHouseNo('');
    setRegistrationNo('');
    setWardNo('');
    setBedNo('');
    setNatureOfSample('Serum');
    setHasFever(true);
    setHasHeadache(true);
    setHasBodyache(true);
    setHasJointPain(false);
    setHasRetroOrbitalPain(false);
    setHasRash(false);
    setHasHematemesis(false);
    setHasEpistaxis(false);
    setHasPetechiae(false);
    setHasMelena(false);
    setPatientId(`PT-${Date.now().toString().slice(-4)}`);
    setPreviewSampleId(clientStore.generateSampleId(selectedTypeId));
  };

  const handleSaveSample = (saveAndNew = false) => {
    if (isSubmitting) return;
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedVillageId) {
      setErrorMessage('कृपया गाव निवडा.');
      return;
    }

    if (!collectionDate) {
      setErrorMessage('कृपया नमुना संकलन दिनांक भरा.');
      return;
    }

    // Validation by type
    const isWater = currentSampleType.codePrefix.startsWith('WS');
    const isSalt = currentSampleType.codePrefix === 'SLT';
    const isTCL = currentSampleType.codePrefix === 'TCL';
    const isSerum = currentSampleType.codePrefix === 'MSL' || currentSampleType.codePrefix === 'DNG';

    if (isWater && !selectedSourceId && availableSources.length > 0) {
      setErrorMessage('कृपया पाण्याचा स्त्रोत निवडा.');
      return;
    }

    // Salt / TCL MFD < EXP validation
    if ((isSalt || isTCL) && mfdDate && expDate && mfdDate >= expDate) {
      setErrorMessage('उत्पादन दिनांक (MFD) हा समाप्ती दिनांकापेक्षा (EXP Date) आधीचा असणे अनिवार्य आहे.');
      return;
    }

    if (isSerum) {
      if (!patientName.trim() || !age) {
        setErrorMessage('कृपया रुग्णाचे नाव आणि वय अचूक भरा.');
        return;
      }
      const numAge = Number(age);
      if (isNaN(numAge) || numAge <= 0 || numAge > 125) {
        setErrorMessage('कृपया रुग्णाचे वय १ ते १२५ दरम्यान अचूक टाका.');
        return;
      }
      if (feverOnsetDate && collectionDate && feverOnsetDate > collectionDate) {
        setErrorMessage('ताप सुरू झाल्याचा दिनांक हा नमुना संकलन दिनांकापेक्षा नंतरचा असू शकत नाही.');
        return;
      }
    }

    setIsSubmitting(true);
    const selectedSource = availableSources.find((s) => s.id === selectedSourceId);

    try {
      const samplePayload: Omit<
        SampleRecord,
        'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdByName' | 'isActive'
      > = {
        sampleTypeId: selectedTypeId,
        sampleTypeName: currentSampleType.name,
        collectionDate,
        dispatchDate,
        villageId: currentVillage.id,
        villageName: currentVillage.name,
        subcenterId: currentVillage.subcenterId,
        subcenterName: currentVillage.subcenterName || currentVillage.subcenter || 'भादा',
        subcenter: currentVillage.subcenterName || currentVillage.subcenter || 'भादा',
        phcName: currentVillage.phcName || 'भादा',
        taluka: currentVillage.taluka || 'औसा',
        district: currentVillage.district || 'लातूर',
        laboratoryName,
        remarks,
        status: 'Collected',
        // Water
        ...(isWater
          ? {
              sourceId: selectedSource?.id,
              sourceName: selectedSource?.sourceName || 'पाणी स्त्रोत',
              sourceType: selectedSource?.sourceType || 'विहीर',
              sampleCollector,
              sampleQuantity,
              sampleCodeOrBottleNo: sampleCodeOrBottleNo || `BTL-${Math.floor(Math.random() * 900 + 100)}`,
            }
          : {}),
        // Salt
        ...(isSalt
          ? {
              shopOrInstitutionName: shopOrInstitutionName || 'स्थानिक किराणा दुकान',
              sampleDescription: sampleDescription || 'आयोडाइज्ड मीठ नमुना',
              batchNumber: batchNumber || 'NA',
              manufacturerName: manufacturerName || 'स्थानिक उत्पादक',
              mfdDate,
              expDate,
              sampleQuantity,
            }
          : {}),
        // TCL
        ...(isTCL
          ? {
              sourceName: shopOrInstitutionName || `${currentVillage.name} ग्रामपंचायत साठा`,
              batchNumber: batchNumber || 'TCL-BATCH',
              manufacturerName: manufacturerName || 'प्रमाणित रासायनिक कंपनी',
              mfdDate,
              expDate,
              sampleQuantity,
            }
          : {}),
        // Serum
        ...(isSerum
          ? {
              patientId,
              patientName: patientName.trim(),
              age: Number(age) || 0,
              sex,
              patientAddress: patientAddress || currentVillage.name,
              contactNumber,
              feverOnsetDate,
              testRequested:
                currentSampleType.codePrefix === 'MSL'
                  ? 'गोवर (Measles IgM)'
                  : testRequested,
              sampleCodeOrBottleNo: sampleCodeOrBottleNo || `SRM-${Math.floor(Math.random() * 900 + 100)}`,
              sampleQuantity,
              ...(currentSampleType.codePrefix === 'DNG'
                ? {
                    houseNo,
                    registrationNo,
                    wardNo,
                    bedNo,
                    natureOfSample,
                    clinicalFindings: {
                      fever: hasFever,
                      headache: hasHeadache,
                      bodyache: hasBodyache,
                      jointPain: hasJointPain,
                      retroOrbitalPain: hasRetroOrbitalPain,
                      rash: hasRash,
                    },
                    haemorrhagicManifestations: {
                      hematemesis: hasHematemesis,
                      epistaxis: hasEpistaxis,
                      petechiae: hasPetechiae,
                      melena: hasMelena,
                    },
                  }
                : {}),
            }
          : {}),
      };

      const savedSample = clientStore.addSample(samplePayload);
      setSuccessMessage(`नमुना ${savedSample.id} यशस्वीरित्या नोंदविला गेला आहे!`);

      if (onSampleCreated) {
        onSampleCreated(savedSample);
      }

      if (saveAndNew) {
        resetForm();
      } else {
        setPreviewSampleId(clientStore.generateSampleId(selectedTypeId));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'नमुना जतन करताना त्रुटी आली.';
      setErrorMessage(`नमुना नोंदणी पूर्ण झाली नाही: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAddSource = () => {
    if (!newSourceName.trim()) {
      alert('कृपया स्त्रोताचे नाव टाका.');
      return;
    }

    const createdSource = clientStore.addSource({
      villageId: currentVillage.id,
      villageName: currentVillage.name,
      sampleTypeId: selectedTypeId,
      sampleTypeName: currentSampleType.name,
      sourceName: newSourceName.trim(),
      sourceCode: `SRC-${currentVillage.code}-${Math.floor(Math.random() * 900 + 100)}`,
      sourceType: newSourceType,
      locationAddress: newSourceAddress.trim() || currentVillage.name,
      isActive: true,
      remarks: 'वापरकर्त्याने त्वरित जोडलेला नवीन स्त्रोत',
    });

    const updated = clientStore.getSources(currentVillage.id, selectedTypeId);
    setAvailableSources(updated);
    setSelectedSourceId(createdSource.id);

    setNewSourceName('');
    setNewSourceAddress('');
    setShowAddSourceModal(false);
    alert(`नवीन स्त्रोत '${createdSource.sourceName}' यशस्वीरित्या जोडला गेला!`);
  };

  const getSampleIcon = (prefix: string) => {
    switch (prefix) {
      case 'WS-BIO':
        return <Droplets className="w-4 h-4 text-cyan-600" />;
      case 'WS-CHM':
        return <TestTube className="w-4 h-4 text-emerald-600" />;
      case 'SLT':
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      case 'TCL':
        return <FlaskConical className="w-4 h-4 text-amber-600" />;
      case 'MSL':
        return <HeartPulse className="w-4 h-4 text-purple-600" />;
      case 'DNG':
        return <Bug className="w-4 h-4 text-rose-600" />;
      default:
        return <Layers className="w-4 h-4 text-slate-600" />;
    }
  };

  const isWater = currentSampleType.codePrefix.startsWith('WS');
  const isSalt = currentSampleType.codePrefix === 'SLT';
  const isTCL = currentSampleType.codePrefix === 'TCL';
  const isSerum = currentSampleType.codePrefix === 'MSL' || currentSampleType.codePrefix === 'DNG';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-700" />
              नमुना नोंदणी फॉर्म (Sample Entry Form)
            </h2>
            <p className="text-xs text-slate-500">
              प्राथमिक आरोग्य केंद्र भादा — नमुना संकलन, स्त्रोत मॅपिंग व अचूक आयडी निर्मिती
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs text-emerald-900 font-mono">
            <span className="font-bold">अपेक्षित नमुना क्रमांक:</span>
            <span className="bg-white px-2 py-0.5 rounded border border-emerald-300 font-black text-emerald-800">
              {previewSampleId}
            </span>
          </div>
        </div>
      </div>

      {/* 1. Sample Type Selector Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          १. नमुन्याचा प्रकार निवडा (Select Sample Type):
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {sampleTypes.map((st) => {
            const isSelected = st.id === selectedTypeId;
            return (
              <button
                key={st.id}
                onClick={() => setSelectedTypeId(st.id)}
                className={`p-2.5 rounded-lg text-left transition-all border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm ring-2 ring-emerald-600/30'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`p-1 rounded ${isSelected ? 'bg-white/20' : 'bg-white shadow-2xs'}`}>
                    {getSampleIcon(st.codePrefix)}
                  </span>
                  <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                    {st.codePrefix}
                  </span>
                </div>
                <div className="font-bold text-xs leading-tight line-clamp-2">{st.marathiName}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Success / Error Messages */}
      {successMessage && (
        <div className="bg-emerald-50 border-l-4 border-emerald-600 p-3 rounded text-xs text-emerald-900 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-700 hover:text-emerald-900 font-bold text-sm">
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-3 rounded text-xs text-rose-900 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-700 hover:text-rose-900 font-bold text-sm">
            ✕
          </button>
        </div>
      )}

      {/* 2. Main Entry Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
              २
            </span>
            <span>नमुना तपशील प्रविष्ट करा ({currentSampleType.marathiName})</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            विभाग: {currentSampleType.department}
          </span>
        </div>

        {/* Administrative Cascade Hierarchy (PHC -> Subcenter -> Village) & Dates */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700" />
              प्रशासकीय पदक्रम निवड (Administrative Cascade: उपकेंद्र → गाव → स्त्रोत)
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded">
                PHC: भादा (भादा प्राथमिक आरोग्य केंद्र)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Subcenter Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-emerald-700" />
                १. उपकेंद्र निवडा (Subcenter)*:
              </label>
              <select
                value={selectedSubcenterId}
                onChange={(e) => handleSubcenterChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="ALL">सर्व उपकेंद्रे ({subcenters.length})</option>
                {subcenters.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.subcenterName} ({sc.subcenterCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Village Dropdown (Cascaded by Subcenter) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                २. गाव निवडा (Village)*:
              </label>
              <select
                value={selectedVillageId}
                onChange={(e) => handleVillageChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                {filteredVillages.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.englishName}) — {v.subcenterName || v.subcenter}
                  </option>
                ))}
              </select>
            </div>

            {/* Collection Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                संकलन दिनांक (Collection Date)*:
              </label>
              <input
                type="date"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Dispatch Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                प्रेषण दिनांक (Dispatch Date):
              </label>
              <input
                type="date"
                value={dispatchDate}
                onChange={(e) => setDispatchDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Authoritative Hierarchy Automatic Read-only Summary */}
          {currentVillage && (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-emerald-950">
              <span className="font-bold text-emerald-900 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                स्वयंचलित पदक्रम तपशील:
              </span>
              <span>
                <strong className="text-slate-600 font-medium">प्रा.आ. केंद्र:</strong> {currentVillage.phcName || 'भादा'}
              </span>
              <span>
                <strong className="text-slate-600 font-medium">उपकेंद्र:</strong>{' '}
                <span className="font-bold text-emerald-800">
                  {currentVillage.subcenterName || currentVillage.subcenter}
                </span>
              </span>
              <span>
                <strong className="text-slate-600 font-medium">गाव:</strong>{' '}
                <span className="font-bold text-emerald-800">
                  {currentVillage.name} ({currentVillage.englishName})
                </span>
              </span>
              <span>
                <strong className="text-slate-600 font-medium">तालुका:</strong> {currentVillage.taluka || 'औसा'}
              </span>
              <span>
                <strong className="text-slate-600 font-medium">जिल्हा:</strong> {currentVillage.district || 'लातूर'}
              </span>
            </div>
          )}
        </div>

        {/* ---------------------------------------------------- */}
        {/* SPECIFIC FIELDS FOR WATER (Bacteriological & Chemical) */}
        {/* ---------------------------------------------------- */}
        {isWater && (
          <div className="bg-cyan-50/50 border border-cyan-200/80 rounded-xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-200/60 pb-2">
              <div className="text-xs font-bold text-cyan-950 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-cyan-700" />
                गाव निहाय पाणी स्त्रोत तपशील ({currentVillage.name}):
              </div>
              <button
                type="button"
                onClick={() => setShowAddSourceModal(true)}
                className="flex items-center gap-1.5 bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm self-start sm:self-center transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>नवीन स्त्रोत जोडा (Add Source)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Source Dropdown */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  पाणी स्त्रोत निवडा (Source)*:
                </label>
                {availableSources.length === 0 ? (
                  <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded border border-rose-200 flex items-center justify-between">
                    <span>या गावात अद्याप कोणताही स्त्रोत नोंदवलेला नाही.</span>
                    <button
                      type="button"
                      onClick={() => setShowAddSourceModal(true)}
                      className="underline font-bold text-xs"
                    >
                      आता जोडा +
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedSourceId}
                    onChange={(e) => setSelectedSourceId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                  >
                    {availableSources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.sourceName} — [{s.sourceType}] ({s.locationAddress})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Sample Bottle No */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  बाटली क्रमांक / कोड (Bottle No)*:
                </label>
                <input
                  type="text"
                  placeholder="उदा. BTL-01 / LKH-01"
                  value={sampleCodeOrBottleNo}
                  onChange={(e) => setSampleCodeOrBottleNo(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                />
              </div>

              {/* Sample Collector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  नमुना संकलक कर्मचारी (Collector)*:
                </label>
                <input
                  type="text"
                  value={sampleCollector}
                  onChange={(e) => setSampleCollector(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  नमुना प्रमाण (Quantity):
                </label>
                <input
                  type="text"
                  value={sampleQuantity}
                  onChange={(e) => setSampleQuantity(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                />
              </div>

              {/* Lab */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  तपासणी प्रयोगशाळा (Laboratory):
                </label>
                <input
                  type="text"
                  value={laboratoryName}
                  onChange={(e) => setLaboratoryName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* SPECIFIC FIELDS FOR SALT SAMPLE                      */}
        {/* ---------------------------------------------------- */}
        {isSalt && (
          <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-4 space-y-4">
            <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 border-b border-indigo-200/60 pb-2">
              <Sparkles className="w-4 h-4 text-indigo-700" />
              मीठ नमुना व दुकान तपशील (Salt Sample &amp; Batch Details):
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  दुकान / संस्था / स्त्रोताचे नाव (Shop / Institution)*:
                </label>
                <input
                  type="text"
                  placeholder="उदा. जय भवानी किराणा स्टोअर्स, मेन रोड"
                  value={shopOrInstitutionName}
                  onChange={(e) => setShopOrInstitutionName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  नमुना वर्णन (Sample Description):
                </label>
                <input
                  type="text"
                  placeholder="उदा. पॅक आयोडाइज्ड मीठ / सुट्टे मीठ"
                  value={sampleDescription}
                  onChange={(e) => setSampleDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  बॅच क्रमांक (Batch Number)*:
                </label>
                <input
                  type="text"
                  placeholder="उदा. B-2026-088"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  उत्पादकाचे नाव (Manufacturer):
                </label>
                <input
                  type="text"
                  placeholder="उदा. टाटा केमिकल्स / निरमा"
                  value={manufacturerName}
                  onChange={(e) => setManufacturerName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  नमुना प्रमाण (Quantity):
                </label>
                <input
                  type="text"
                  value={sampleQuantity}
                  onChange={(e) => setSampleQuantity(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  उत्पादन दिनांक (MFD Date):
                </label>
                <input
                  type="date"
                  value={mfdDate}
                  onChange={(e) => setMfdDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  समाप्ती दिनांक (Expiry Date):
                </label>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* SPECIFIC FIELDS FOR TCL SAMPLE                       */}
        {/* ---------------------------------------------------- */}
        {isTCL && (
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4 space-y-4">
            <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5 border-b border-amber-200/60 pb-2">
              <FlaskConical className="w-4 h-4 text-amber-700" />
              ब्लिचिंग पावडर (TCL) नमुना व बॅच तपशील:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  साठा / स्त्रोत / ग्रामपंचायत साठा नाव*:
                </label>
                <input
                  type="text"
                  placeholder="उदा. ग्रामपंचायत लखनगाव पाणीपुरवठा साठा"
                  value={shopOrInstitutionName}
                  onChange={(e) => setShopOrInstitutionName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  बॅच क्रमांक (Batch / Lot No)*:
                </label>
                <input
                  type="text"
                  placeholder="उदा. TCL-2026-B8"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  उत्पादक कंपनी (Manufacturer):
                </label>
                <input
                  type="text"
                  placeholder="उदा. ग्रेस केमिकल्स / महाराष्ट्र उत्पादक"
                  value={manufacturerName}
                  onChange={(e) => setManufacturerName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  उत्पादन दिनांक (MFD):
                </label>
                <input
                  type="date"
                  value={mfdDate}
                  onChange={(e) => setMfdDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  समाप्ती दिनांक (Expiry):
                </label>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* SPECIFIC FIELDS FOR PATIENT SERUM (Measles & Dengue) */}
        {/* ---------------------------------------------------- */}
        {isSerum && (
          <div className="bg-purple-50/50 border border-purple-200/80 rounded-xl p-4 space-y-4">
            <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5 border-b border-purple-200/60 pb-2">
              <HeartPulse className="w-4 h-4 text-purple-700" />
              रुग्ण व रक्तनमुना तपशील (Patient &amp; Serum Clinical Details):
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Patient Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  रुग्णाचे पूर्ण नाव (Patient Name)*:
                </label>
                <input
                  type="text"
                  placeholder="उदा. सचिन मारुती पाटील"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  वय (Age in Years)*:
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  placeholder="उदा. 28"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              {/* Sex */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  लिंग (Sex)*:
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as 'पुरुष' | 'स्त्री' | 'इतर')}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                >
                  <option value="पुरुष">पुरुष (Male)</option>
                  <option value="स्त्री">स्त्री (Female)</option>
                  <option value="इतर">इतर (Other)</option>
                </select>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  पत्ता (Patient Address):
                </label>
                <input
                  type="text"
                  placeholder="उदा. वार्ड क्र. २, हनुमान मंदिराजवळ"
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              {/* Contact */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  मोबाईल क्रमांक (Contact):
                </label>
                <input
                  type="tel"
                  placeholder="उदा. 9822114455"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              {/* Fever Onset Date */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ताप सुरुवात दिनांक (Fever Onset Date)*:
                </label>
                <input
                  type="date"
                  value={feverOnsetDate}
                  onChange={(e) => setFeverOnsetDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              {/* Test Requested (Dengue specific) */}
              {currentSampleType.codePrefix === 'DNG' && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    मागणी केलेली तपासणी (Test Requested)*:
                  </label>
                  <select
                    value={testRequested}
                    onChange={(e) => setTestRequested(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  >
                    <option value="डेंग्यू (NS1/IgM)">डेंग्यू (Dengue NS1/IgM)</option>
                    <option value="चिकनगुनिया (IgM)">चिकनगुनिया (Chikungunya IgM)</option>
                    <option value="डेंग्यू व चिकनगुनिया">डेंग्यू व चिकनगुनिया (दोन्ही)</option>
                  </select>
                </div>
              )}
            </div>

            {/* NIV Pune & GMC Latur Case History Details */}
            {currentSampleType.codePrefix === 'DNG' && (
              <div className="mt-4 pt-4 border-t border-purple-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    NIV पुणे केस हिस्ट्री व रुग्णालय तपशील (NIV Pune &amp; GMC Latur Specifics)
                  </div>
                  <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-medium">
                    अधिकृत फॉरमॅट आवश्यकता
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-purple-100">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">घर क्र. (House No):</label>
                    <input
                      type="text"
                      placeholder="उदा. H-42"
                      value={houseNo}
                      onChange={(e) => setHouseNo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">नोंदणी क्र. (Reg. No):</label>
                    <input
                      type="text"
                      placeholder="उदा. OPD-1044 / IPD-88"
                      value={registrationNo}
                      onChange={(e) => setRegistrationNo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">वॉर्ड क्र. (Ward No):</label>
                    <input
                      type="text"
                      placeholder="उदा. Ward-2 / Male Medical"
                      value={wardNo}
                      onChange={(e) => setWardNo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">बेड क्र. (Bed No):</label>
                    <input
                      type="text"
                      placeholder="उदा. Bed 05"
                      value={bedNo}
                      onChange={(e) => setBedNo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                {/* Nature of Specimen */}
                <div className="bg-white p-3 rounded-lg border border-purple-100 flex flex-wrap items-center gap-4">
                  <span className="text-xs font-bold text-slate-800">नमुन्याचे स्वरूप (Nature of Sample):</span>
                  {(['Serum', 'Whole Blood', 'Plasma'] as const).map((nat) => (
                    <label key={nat} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="natureOfSample"
                        value={nat}
                        checked={natureOfSample === nat}
                        onChange={() => setNatureOfSample(nat)}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span>{nat === 'Serum' ? 'Serum (सीरम)' : nat === 'Whole Blood' ? 'Whole Blood (रक्त)' : 'Plasma (प्लाझ्मा)'}</span>
                    </label>
                  ))}
                </div>

                {/* Clinical Findings Checkboxes */}
                <div className="bg-white p-3 rounded-lg border border-purple-100 space-y-2">
                  <div className="text-xs font-bold text-slate-800">क्लिनिकल लक्षणे (Clinical Findings):</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasFever}
                        onChange={(e) => setHasFever(e.target.checked)}
                        className="rounded text-purple-600"
                      />
                      <span>ताप (Fever)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasHeadache}
                        onChange={(e) => setHasHeadache(e.target.checked)}
                        className="rounded text-purple-600"
                      />
                      <span>डोकेदुखी (Headache)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasBodyache}
                        onChange={(e) => setHasBodyache(e.target.checked)}
                        className="rounded text-purple-600"
                      />
                      <span>अंगदुखी (Bodyache)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasJointPain}
                        onChange={(e) => setHasJointPain(e.target.checked)}
                        className="rounded text-purple-600"
                      />
                      <span>सांधेदुखी (Joint Pain)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasRetroOrbitalPain}
                        onChange={(e) => setHasRetroOrbitalPain(e.target.checked)}
                        className="rounded text-purple-600"
                      />
                      <span>डोळ्यांमागे दुखणे</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasRash}
                        onChange={(e) => setHasRash(e.target.checked)}
                        className="rounded text-purple-600"
                      />
                      <span>पुरळ (Rash)</span>
                    </label>
                  </div>
                </div>

                {/* Haemorrhagic Manifestations */}
                <div className="bg-white p-3 rounded-lg border border-purple-100 space-y-2">
                  <div className="text-xs font-bold text-slate-800">रक्तस्त्राव लक्षणे (Haemorrhagic Manifestations):</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasHematemesis}
                        onChange={(e) => setHasHematemesis(e.target.checked)}
                        className="rounded text-rose-600"
                      />
                      <span>रक्तउलटी (Hematemesis)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasEpistaxis}
                        onChange={(e) => setHasEpistaxis(e.target.checked)}
                        className="rounded text-rose-600"
                      />
                      <span>नाकातून रक्त (Epistaxis)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasPetechiae}
                        onChange={(e) => setHasPetechiae(e.target.checked)}
                        className="rounded text-rose-600"
                      />
                      <span>त्वचेवर ठिपके (Petechiae)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasMelena}
                        onChange={(e) => setHasMelena(e.target.checked)}
                        className="rounded text-rose-600"
                      />
                      <span>काळी विष्ठा (Melena)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Remarks Row */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            शेरा / अतिरिक्त माहिती (Remarks):
          </label>
          <input
            type="text"
            placeholder="उदा. पावसाळ्यानंतरची नियमित तपासणी / ताप रुग्ण सर्वेक्षण"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={resetForm}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>फॉर्म साफ करा (Reset)</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveSample(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-900 px-4 py-2.5 rounded-lg text-xs font-bold border border-emerald-300 transition-all active:scale-95"
            >
              <Save className="w-4 h-4 text-emerald-700" />
              <span>{isSubmitting ? 'जतन होत आहे...' : 'जतन करा व नवीन जोडा (Save & New)'}</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveSample(false)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>{isSubmitting ? 'जतन होत आहे...' : 'नमुना जतन करा (Save Sample)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ADD SOURCE MODAL */}
      {showAddSourceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-cyan-700" />
                <span>नवीन पाणी स्त्रोत नोंदणी (Add Source)</span>
              </div>
              <button
                onClick={() => setShowAddSourceModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  गाव: <span className="text-emerald-700">{currentVillage.name}</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  स्त्रोताचे नाव (Source Name)*:
                </label>
                <input
                  type="text"
                  placeholder="उदा. ग्रामपंचायत विहीर / शाळा टाकी"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  स्त्रोताचा प्रकार (Source Type)*:
                </label>
                <select
                  value={newSourceType}
                  onChange={(e) => setNewSourceType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                >
                  <option value="विहीर">विहीर (Dug Well)</option>
                  <option value="कूपनलिका">कूपनलिका (Borewell)</option>
                  <option value="हातपंप">हातपंप (Handpump)</option>
                  <option value="नळ योजना">नळ योजना (Tap Water Scheme)</option>
                  <option value="सार्वजनिक टाकी">सार्वजनिक पाण्याची टाकी (ESR / GSR Tank)</option>
                  <option value="इतर">इतर (Other Source)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  स्थळ / पत्ता वर्णन (Location):
                </label>
                <input
                  type="text"
                  placeholder="उदा. मारुती मंदिराशेजारी, वार्ड क्र. १"
                  value={newSourceAddress}
                  onChange={(e) => setNewSourceAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddSourceModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                रद्द करा
              </button>
              <button
                type="button"
                onClick={handleQuickAddSource}
                className="bg-cyan-700 hover:bg-cyan-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm"
              >
                स्त्रोत जोडा
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
