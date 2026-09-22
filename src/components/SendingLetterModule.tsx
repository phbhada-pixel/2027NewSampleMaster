import React, { useState, useMemo, useEffect } from 'react';
import { clientStore } from '../services/clientStore';
import {
  SampleRecord,
  SendingLetter,
  User,
  SampleTypeMaster,
} from '../types';
import {
  FileText,
  Send,
  Printer,
  CheckCircle2,
  Calendar,
  Building2,
  Building,
  CheckSquare,
  Square,
  QrCode,
  Tag,
  AlertCircle,
  Clock,
  ArrowRight,
  Eye,
  HeartPulse,
  ChevronDown,
  ChevronRight,
  MapPin,
  Layers,
  ListFilter,
  Check,
  MinusSquare,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { DengueDocumentationModule } from './DengueDocumentationModule';

interface SendingLetterModuleProps {
  currentUser: User;
}

export const SendingLetterModule: React.FC<SendingLetterModuleProps> = ({ currentUser }) => {
  const sampleTypes = clientStore.getSampleTypes();
  const subcenters = clientStore.getSubcenters();
  const villages = clientStore.getVillages();
  const sources = clientStore.getSources();

  const [activeTabMode, setActiveTabMode] = useState<'STANDARD' | 'DENGUE'>('STANDARD');
  const [selectedTypeId, setSelectedTypeId] = useState<string>(sampleTypes[0]?.id || 'ST-001');
  const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>([]);

  // Multi-Centre / Multi-Village / Multi-Source Dispatch Filters
  const [filterCollectionDate, setFilterCollectionDate] = useState<string>('');
  const [filterSubcenterId, setFilterSubcenterId] = useState<string>('ALL');
  const [filterVillageId, setFilterVillageId] = useState<string>('ALL');
  const [filterSourceId, setFilterSourceId] = useState<string>('ALL');
  const [filterDispatchStatus, setFilterDispatchStatus] = useState<'PENDING' | 'DISPATCHED' | 'ALL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Letter Fields
  const [letterNumber, setLetterNumber] = useState<string>(
    clientStore.generateLetterNumber(sampleTypes[0]?.id || 'ST-001')
  );
  const [letterDate, setLetterDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [toAuthority, setToAuthority] = useState<string>(
    'मा. वरिष्ठ वैज्ञानिक अधिकारी, जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा, लातूर'
  );
  const [subject, setSubject] = useState<string>(
    'प्राथमिक आरोग्य केंद्र भादा कार्यक्षेत्रातील नमुने प्रयोगशाळा रासायनिक/जैविक तपासणीसाठी पाठविणेबाबत.'
  );
  const [reference, setReference] = useState<string>(
    'महाराष्ट्र शासन परिपत्रक क्रमांक: पापू-२०२६/प्र.क्र.४४/आरोग्य-५'
  );
  const [laboratoryName, setLaboratoryName] = useState<string>(
    'जिल्हा सार्वजनिक आरोग्य प्रयोगशाळा (DPHL), लातूर'
  );
  const [dispatchMode, setDispatchMode] = useState<string>('विशेष दूत');
  const [remarks, setRemarks] = useState<string>('');

  // Generated Letter View
  const [activeLetter, setActiveLetter] = useState<SendingLetter | null>(null);
  const [showStickers, setShowStickers] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const currentSampleType = sampleTypes.find((st) => st.id === selectedTypeId) || sampleTypes[0];

  // Cascading villages based on subcenter
  const availableVillages = filterSubcenterId === 'ALL'
    ? villages
    : villages.filter((v) => v.subcenterId === filterSubcenterId || v.subcenterName === filterSubcenterId);

  // Cascading sources based on village with deduplication
  const availableSources = useMemo(() => {
    const list = filterVillageId === 'ALL'
      ? sources
      : sources.filter((s) => s.villageId === filterVillageId);
    const seen = new Set<string>();
    return list.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [sources, filterVillageId]);

  // Store update subscription for reactivity
  const [storeVersion, setStoreVersion] = useState(0);
  useEffect(() => {
    return clientStore.subscribe(() => setStoreVersion((v) => v + 1));
  }, []);

  // Hierarchical view state (default expanded, so user does NOT have to reopen)
  const [collapsedSubcenters, setCollapsedSubcenters] = useState<Record<string, boolean>>({});
  const [collapsedVillages, setCollapsedVillages] = useState<Record<string, boolean>>({});

  const toggleSubcenterCollapse = (scId: string) => {
    setCollapsedSubcenters((prev) => ({ ...prev, [scId]: !prev[scId] }));
  };

  const toggleVillageCollapse = (vilId: string) => {
    setCollapsedVillages((prev) => ({ ...prev, [vilId]: !prev[vilId] }));
  };

  // Authoritative Set lookup for O(1) checks and continuous multi-selection
  const selectedSampleIdsSet = useMemo(() => new Set(selectedSampleIds), [selectedSampleIds]);

  // Query eligible samples for dispatch according to all multi-dimensional filters
  const allFilteredSamples = useMemo(() => {
    return clientStore.getSamples({
      sampleTypeId: selectedTypeId,
      subcenterId: filterSubcenterId !== 'ALL' ? filterSubcenterId : undefined,
      villageId: filterVillageId !== 'ALL' ? filterVillageId : undefined,
      sourceId: filterSourceId !== 'ALL' ? filterSourceId : undefined,
      collectionDate: filterCollectionDate && filterCollectionDate !== 'ALL' ? filterCollectionDate : undefined,
      searchQuery: searchQuery.trim() || undefined,
    });
  }, [selectedTypeId, filterSubcenterId, filterVillageId, filterSourceId, filterCollectionDate, searchQuery, storeVersion]);

  const availableSamples = useMemo(() => {
    return allFilteredSamples.filter((s) => {
      if (filterDispatchStatus === 'PENDING') {
        return (
          s.status === 'Collected' ||
          s.status === 'Ready for Dispatch' ||
          s.status === 'Draft' ||
          (!s.sendingLetterNumber && s.status !== 'Dispatched')
        );
      }
      if (filterDispatchStatus === 'DISPATCHED') {
        return s.status === 'Dispatched' || Boolean(s.sendingLetterNumber);
      }
      return true;
    });
  }, [allFilteredSamples, filterDispatchStatus]);

  // Hierarchical Grouping: Subcenter -> Village -> Sources/Samples
  const hierarchicalGroups = useMemo(() => {
    const scMap = new Map<
      string,
      {
        subcenterId: string;
        subcenterName: string;
        villageMap: Map<string, { villageId: string; villageName: string; samples: SampleRecord[] }>;
        allSamples: SampleRecord[];
      }
    >();

    for (const sample of availableSamples) {
      const scId = sample.subcenterId || 'SC-BHD-01';
      const scName = sample.subcenterName || sample.subcenter || 'भादा';
      const vilId = sample.villageId || 'VIL-001';
      const vilName = sample.villageName || 'भादा';

      if (!scMap.has(scId)) {
        scMap.set(scId, {
          subcenterId: scId,
          subcenterName: scName,
          villageMap: new Map(),
          allSamples: [],
        });
      }

      const scObj = scMap.get(scId)!;
      scObj.allSamples.push(sample);

      if (!scObj.villageMap.has(vilId)) {
        scObj.villageMap.set(vilId, {
          villageId: vilId,
          villageName: vilName,
          samples: [],
        });
      }

      scObj.villageMap.get(vilId)!.samples.push(sample);
    }

    return Array.from(scMap.values()).map((sc) => ({
      subcenterId: sc.subcenterId,
      subcenterName: sc.subcenterName,
      allSamples: sc.allSamples,
      villages: Array.from(sc.villageMap.values()),
    }));
  }, [availableSamples]);

  const expandAll = () => {
    setCollapsedSubcenters({});
    setCollapsedVillages({});
  };

  const collapseAll = () => {
    const newCollapsedSc: Record<string, boolean> = {};
    const newCollapsedVil: Record<string, boolean> = {};
    for (const group of hierarchicalGroups) {
      newCollapsedSc[group.subcenterId] = true;
      for (const vil of group.villages) {
        newCollapsedVil[vil.villageId] = true;
      }
    }
    setCollapsedSubcenters(newCollapsedSc);
    setCollapsedVillages(newCollapsedVil);
  };

  const existingLetters = clientStore.getSendingLetters();

  // Selected sample records objects (from clientStore) - guaranteed unique rows
  const selectedSamplesList: SampleRecord[] = useMemo(() => {
    return Array.from(selectedSampleIdsSet)
      .map((id) => clientStore.getSampleById(id))
      .filter((s): s is SampleRecord => s !== null);
  }, [selectedSampleIdsSet]);

  // Metrics for multi-selection across centers/villages
  const uniqueSelectedSubcenters = Array.from(
    new Set(selectedSamplesList.map((s) => s.subcenter || s.subcenterName || 'भादा').filter(Boolean))
  );
  const uniqueSelectedVillages = Array.from(
    new Set(selectedSamplesList.map((s) => s.villageName).filter(Boolean))
  );
  const uniqueSelectedSources = Array.from(
    new Set(selectedSamplesList.map((s) => s.sourceName || s.patientName || s.id).filter(Boolean))
  );

  const handleTypeChange = (typeId: string) => {
    setSelectedTypeId(typeId);
    if (typeId === 'ST-006') {
      setActiveTabMode('DENGUE');
      return;
    }
    setSelectedSampleIds([]);
    setLetterNumber(clientStore.generateLetterNumber(typeId));
    const st = sampleTypes.find((t) => t.id === typeId);
    if (st) {
      setLaboratoryName(st.defaultLaboratory);
      setSubject(`प्राथमिक आरोग्य केंद्र भादा कार्यक्षेत्रातील ${st.marathiName} तपासणीसाठी पाठविणेबाबत.`);
    }
  };

  // Bulk selection: Global Select All
  const handleSelectAll = () => {
    const selectableIds = availableSamples
      .filter((s) => s.status !== 'Dispatched' || !s.sendingLetterNumber)
      .map((s) => s.id);

    if (selectableIds.length === 0) return;

    const allSelected = selectableIds.every((id) => selectedSampleIdsSet.has(id));
    setSelectedSampleIds((prev) => {
      const nextSet = new Set(prev);
      if (allSelected) {
        selectableIds.forEach((id) => nextSet.delete(id));
      } else {
        selectableIds.forEach((id) => nextSet.add(id));
      }
      return Array.from(nextSet);
    });
  };

  // Bulk selection: Subcenter-level Select All
  const handleToggleSubcenter = (scSampleIds: string[]) => {
    const selectableIds = scSampleIds.filter((id) => {
      const s = clientStore.getSampleById(id);
      return !s || s.status !== 'Dispatched' || !s.sendingLetterNumber;
    });

    if (selectableIds.length === 0) return;

    const allSelected = selectableIds.every((id) => selectedSampleIdsSet.has(id));
    setSelectedSampleIds((prev) => {
      const nextSet = new Set(prev);
      if (allSelected) {
        selectableIds.forEach((id) => nextSet.delete(id));
      } else {
        selectableIds.forEach((id) => nextSet.add(id));
      }
      return Array.from(nextSet);
    });
  };

  // Bulk selection: Village-level Select All
  const handleSelectAllVillage = (vilSampleIds: string[]) => {
    const selectableIds = vilSampleIds.filter((id) => {
      const s = clientStore.getSampleById(id);
      return !s || s.status !== 'Dispatched' || !s.sendingLetterNumber;
    });

    if (selectableIds.length === 0) return;

    setSelectedSampleIds((prev) => {
      const nextSet = new Set(prev);
      selectableIds.forEach((id) => nextSet.add(id));
      return Array.from(nextSet);
    });
  };

  // Bulk selection: Village-level Deselect All
  const handleDeselectAllVillage = (vilSampleIds: string[]) => {
    setSelectedSampleIds((prev) => {
      const nextSet = new Set(prev);
      vilSampleIds.forEach((id) => nextSet.delete(id));
      return Array.from(nextSet);
    });
  };

  const handleClearAllSelected = () => {
    setSelectedSampleIds([]);
  };

  const handleOpenConfirmModal = () => {
    if (selectedSampleIds.length === 0) {
      alert('कृपया पाठविण्यासाठी किमान एक नमुना निवडा.');
      return;
    }
    setShowConfirmModal(true);
  };

  // Single sample selection: strictly tracked by authoritative sample_id
  const handleToggleSample = (id: string) => {
    const sample = clientStore.getSampleById(id);
    if (sample && sample.status === 'Dispatched' && sample.sendingLetterNumber) {
      alert(`नमुना क्र. '${id}' आधीच जावक पत्र क्र. ${sample.sendingLetterNumber} मध्ये पाठविला गेला आहे.`);
      return;
    }

    setSelectedSampleIds((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) {
        nextSet.delete(id);
      } else {
        nextSet.add(id);
      }
      return Array.from(nextSet);
    });
  };

  const handleRemoveSelectedSample = (id: string) => {
    setSelectedSampleIds((prev) => {
      const nextSet = new Set(prev);
      nextSet.delete(id);
      return Array.from(nextSet);
    });
  };

  const handleGenerateLetter = () => {
    if (isSubmitting) return;
    const distinctSampleIds = Array.from(new Set(selectedSampleIds));
    if (distinctSampleIds.length === 0) {
      alert('कृपया पत्रात जोडण्यासाठी किमान एक नमुना निवडा.');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdLetter = clientStore.createSendingLetter({
        letterNumber,
        letterDate,
        sampleTypeId: selectedTypeId,
        sampleTypeName: currentSampleType.name,
        toAuthority,
        subject,
        reference,
        laboratoryName,
        dispatchMode,
        sampleIds: distinctSampleIds,
        sampleCount: distinctSampleIds.length,
        remarks,
        signatoryTitle: 'वैद्यकीय अधिकारी, प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर',
      });

      setActiveLetter(createdLetter);
      setSuccessMsg(
        `जावक पत्र '${createdLetter.letterNumber}' यशस्वीरित्या तयार करण्यात आले! (${createdLetter.sampleCount} नमुने - ${uniqueSelectedVillages.length} गावे)`
      );
      setSelectedSampleIds([]);
      setLetterNumber(clientStore.generateLetterNumber(selectedTypeId));
    } catch (err: any) {
      alert(err.message || 'जावक पत्र तयार करताना त्रुटी आढळली.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSampleRecords: SampleRecord[] = activeLetter
    ? activeLetter.sampleIds
        .map((id) => clientStore.getSampleById(id))
        .filter((s): s is SampleRecord => s !== null)
    : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Mode Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 print:hidden">
        <button
          onClick={() => setActiveTabMode('STANDARD')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTabMode === 'STANDARD'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>सामान्य नमुने पाठवणी पत्रे व स्टिकर्स (General Lab Letters)</span>
        </button>

        <button
          onClick={() => setActiveTabMode('DENGUE')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTabMode === 'DENGUE'
              ? 'bg-rose-800 text-white shadow-sm ring-2 ring-rose-400/40'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
          }`}
        >
          <HeartPulse className="w-4 h-4 text-rose-500" />
          <span>डेंग्यू / चिकनगुनिया विशेष दस्तऐवजीकरण (NIV Pune Case History &amp; GMC Latur Letter)</span>
        </button>
      </div>

      {activeTabMode === 'DENGUE' ? (
        <DengueDocumentationModule currentUser={currentUser} />
      ) : (
        <>
          {/* Header */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-700" />
              पाणी नमुने पाठविणे (Water Sample Dispatch)
            </h2>
            <p className="text-xs text-slate-500">
              उपकेंद्र → गाव → स्त्रोत बहु-निवड व थेट जावक पत्र निर्मिती
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeLetter && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>पत्र / स्टिकर्स प्रिंट करा (Print)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-600 p-3 rounded text-xs text-emerald-900 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Letter Creator vs Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Select Samples & Letter Details */}
        <div className="lg:col-span-5 space-y-4 print:hidden">
          {/* 1. Sample Type Selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                १. नमुना प्रकार निवडा:
              </label>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {currentSampleType.codePrefix}
              </span>
            </div>
            <select
              value={selectedTypeId}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              {sampleTypes.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.marathiName} ({st.codePrefix})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Multi-Centre / Multi-Village / Multi-Source Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>२. नमुना शोध व गाळणी (Filters):</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilterCollectionDate('');
                  setFilterSubcenterId('ALL');
                  setFilterVillageId('ALL');
                  setFilterSourceId('ALL');
                  setFilterDispatchStatus('PENDING');
                  setSearchQuery('');
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline"
              >
                रिसेट करा
              </button>
            </div>

            {/* Subcenter & Village filter row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  उपकेंद्र (Subcenter):
                </label>
                <select
                  value={filterSubcenterId}
                  onChange={(e) => {
                    setFilterSubcenterId(e.target.value);
                    setFilterVillageId('ALL');
                    setFilterSourceId('ALL');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="ALL">सर्व उपकेंद्रे (All)</option>
                  {subcenters.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.subcenterName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  गाव (Village):
                </label>
                <select
                  value={filterVillageId}
                  onChange={(e) => {
                    setFilterVillageId(e.target.value);
                    setFilterSourceId('ALL');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="ALL">सर्व गावे (All)</option>
                  {availableVillages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Source & Date filter row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  पाणी स्त्रोत (Source):
                </label>
                <select
                  value={filterSourceId}
                  onChange={(e) => setFilterSourceId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="ALL">सर्व स्त्रोत (All)</option>
                  {availableSources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.sourceName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  संकलन दिनांक:
                </label>
                <input
                  type="date"
                  value={filterCollectionDate}
                  onChange={(e) => setFilterCollectionDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Dispatch Status & Search */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  पाठवणी स्थिती (Status):
                </label>
                <select
                  value={filterDispatchStatus}
                  onChange={(e) => setFilterDispatchStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="PENDING">प्रलंबित (Pending Dispatch)</option>
                  <option value="DISPATCHED">पाठवलेले (Dispatched)</option>
                  <option value="ALL">सर्व नमुने (All)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  शोध (Search):
                </label>
                <input
                  type="text"
                  placeholder="गाव / बाटली क्र. / ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Sample Selection List - Hierarchical Subcenter -> Village -> Sources */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-800" />
                  <span>३. पाठविण्यासाठी नमुने निवडा (Hierarchical Selection):</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  एकूण उपलब्ध: <span className="font-bold text-slate-800">{availableSamples.length} नमुने</span>
                  {' • '}
                  उपकेंद्रे: <span className="font-bold text-slate-800">{hierarchicalGroups.length}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={collapseAll}
                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-800 px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                  title="सर्व विभाग मिटवा"
                >
                  सर्व मिटवा
                </button>
                <button
                  type="button"
                  onClick={expandAll}
                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-800 px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                  title="सर्व विभाग उघडा"
                >
                  सर्व उघडा
                </button>

                {availableSamples.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-300 transition-colors"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>
                      {availableSamples.length > 0 && availableSamples.every((s) => selectedSampleIdsSet.has(s.id))
                        ? 'सर्व काढा'
                        : 'सर्व निवडा'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Hierarchical Tree Body */}
            <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1">
              {hierarchicalGroups.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  निवडलेल्या निकषांनुसार कोणतेही नमुने सापडले नाहीत.
                </div>
              ) : (
                hierarchicalGroups.map((scGroup) => {
                  const isScCollapsed = Boolean(collapsedSubcenters[scGroup.subcenterId]);
                  const scSampleIds = scGroup.allSamples.map((s) => s.id);
                  const scSelectedCount = scSampleIds.filter((id) => selectedSampleIdsSet.has(id)).length;
                  const isScAllSelected = scSampleIds.length > 0 && scSelectedCount === scSampleIds.length;
                  const isScPartiallySelected = scSelectedCount > 0 && !isScAllSelected;

                  return (
                    <div
                      key={scGroup.subcenterId}
                      className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs"
                    >
                      {/* Subcenter Header */}
                      <div className="bg-slate-100/90 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                        <div
                          className="flex items-center gap-2 cursor-pointer select-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSubcenterCollapse(scGroup.subcenterId);
                          }}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSubcenterCollapse(scGroup.subcenterId);
                            }}
                            className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200 transition-colors"
                            aria-label="उपकेंद्र उघडा/मिटवा"
                          >
                            {isScCollapsed ? (
                              <ChevronRight className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <Building2 className="w-4 h-4 text-emerald-800" />
                          <span className="font-bold text-xs text-slate-900">
                            उपकेंद्र: {scGroup.subcenterName}
                          </span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                            {scGroup.villages.length} गावे • {scGroup.allSamples.length} नमुने
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-600">
                            {scSelectedCount}/{scGroup.allSamples.length} निवडले
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSubcenter(scSampleIds);
                            }}
                            className={`text-xs font-bold flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                              isScAllSelected
                                ? 'bg-emerald-800 text-white hover:bg-emerald-900'
                                : isScPartiallySelected
                                ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300'
                                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                            }`}
                          >
                            {isScAllSelected ? (
                              <CheckSquare className="w-3.5 h-3.5" />
                            ) : isScPartiallySelected ? (
                              <MinusSquare className="w-3.5 h-3.5 text-emerald-700" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className="text-[11px]">
                              {isScAllSelected ? 'उपकेंद्र काढा' : 'उपकेंद्र निवडा'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Subcenter Body: Villages */}
                      {!isScCollapsed && (
                        <div className="p-2 space-y-2.5 bg-slate-50/50">
                          {scGroup.villages.map((vilGroup) => {
                            const isVilCollapsed = Boolean(collapsedVillages[vilGroup.villageId]);
                            const vilSampleIds = vilGroup.samples.map((s) => s.id);
                            const vilSelectedCount = vilSampleIds.filter((id) => selectedSampleIdsSet.has(id)).length;
                            const isVilAllSelected = vilSampleIds.length > 0 && vilSelectedCount === vilSampleIds.length;
                            const isVilPartiallySelected = vilSelectedCount > 0 && !isVilAllSelected;

                            return (
                              <div
                                key={vilGroup.villageId}
                                className="border border-slate-200/90 rounded-lg overflow-hidden bg-white shadow-2xs"
                              >
                                {/* Village Header */}
                                <div className="bg-slate-100/60 border-b border-slate-200 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2">
                                  <div
                                    className="flex items-center gap-1.5 cursor-pointer select-none"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleVillageCollapse(vilGroup.villageId);
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleVillageCollapse(vilGroup.villageId);
                                      }}
                                      className="p-0.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200 transition-colors"
                                      aria-label="गावातील नमुने उघडा/मिटवा"
                                    >
                                      {isVilCollapsed ? (
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <MapPin className="w-3.5 h-3.5 text-blue-700" />
                                    <span className="font-bold text-xs text-slate-900">
                                      गाव: {vilGroup.villageName}
                                    </span>
                                    <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.2 rounded font-medium">
                                      {vilGroup.samples.length} स्त्रोत/नमुने
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleVillageCollapse(vilGroup.villageId);
                                      }}
                                      className="text-[11px] font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                                    >
                                      <span>स्त्रोत ({vilGroup.samples.length})</span>
                                      {isVilCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectAllVillage(vilSampleIds);
                                      }}
                                      className="text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded transition-colors"
                                    >
                                      सर्व स्त्रोत निवडा
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeselectAllVillage(vilSampleIds);
                                      }}
                                      className="text-[11px] font-medium text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 px-2 py-0.5 rounded transition-colors"
                                    >
                                      निवड रद्द करा
                                    </button>
                                  </div>
                                </div>

                                {/* Village Body: Sources/Samples list */}
                                {!isVilCollapsed && (
                                  <div className="p-2 space-y-1.5 divide-y divide-slate-100">
                                    {vilGroup.samples.map((sample) => {
                                      const isChecked = selectedSampleIdsSet.has(sample.id);
                                      const isDispatched = sample.status === 'Dispatched' || Boolean(sample.sendingLetterNumber);

                                      return (
                                        <div
                                          key={sample.id}
                                          id={`sample-card-${sample.id}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isDispatched) {
                                              handleToggleSample(sample.id);
                                            }
                                          }}
                                          className={`p-2.5 rounded-lg flex items-center justify-between text-xs transition-all select-none ${
                                            isDispatched
                                              ? 'bg-slate-100/70 border border-slate-200 opacity-60 cursor-not-allowed'
                                              : isChecked
                                              ? 'bg-emerald-50/90 border border-emerald-400 font-semibold shadow-2xs cursor-pointer'
                                              : 'hover:bg-slate-50 border border-slate-200/60 cursor-pointer'
                                          }`}
                                        >
                                          <div className="flex items-start gap-2.5">
                                            <div className="pt-0.5">
                                              <input
                                                type="checkbox"
                                                id={`checkbox-${sample.id}`}
                                                checked={isChecked}
                                                disabled={isDispatched}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => {
                                                  e.stopPropagation();
                                                  if (!isDispatched) {
                                                    handleToggleSample(sample.id);
                                                  }
                                                }}
                                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                                              />
                                            </div>
                                            <div className="space-y-0.5">
                                              <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="font-mono text-emerald-950 font-bold text-[11px]">
                                                  {sample.id}
                                                </span>
                                                {sample.sampleCodeOrBottleNo && (
                                                  <span className="text-[10px] font-mono font-bold bg-cyan-100 text-cyan-900 px-1.5 py-0.2 rounded border border-cyan-200">
                                                    बाटली क्र: {sample.sampleCodeOrBottleNo}
                                                  </span>
                                                )}
                                                {sample.sourceType && (
                                                  <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                                                    {sample.sourceType}
                                                  </span>
                                                )}
                                              </div>
                                              <div className="text-[11px] text-slate-800">
                                                <span className="font-semibold">
                                                  {sample.sourceName || sample.patientName || sample.shopOrInstitutionName || 'पाणी स्त्रोत'}
                                                </span>
                                                {sample.sampleDescription && (
                                                  <span className="text-slate-500 text-[10px]"> — {sample.sampleDescription}</span>
                                                )}
                                              </div>
                                              {isDispatched && (
                                                <div className="text-[10px] text-amber-800 font-semibold">
                                                  आधीच पाठवले (जावक क्र. {sample.sendingLetterNumber})
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          <div className="text-right text-[10px] text-slate-500 shrink-0 ml-2">
                                            <div className="font-mono font-medium text-slate-700">
                                              दिनांक: {sample.collectionDate}
                                            </div>
                                            <div className="text-emerald-800 font-semibold">
                                              {sample.sampleQuantity || 'प्रमाण: Standard'}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Selection Metrics & Direct Dispatch Footer */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">निवडलेले नमुने:</span>
                  <span className="text-emerald-800 font-mono text-base font-black bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                    {selectedSampleIds.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                  <span>उपकेंद्रे: <strong className="text-slate-900">{uniqueSelectedSubcenters.length}</strong></span>
                  <span>•</span>
                  <span>गावे: <strong className="text-slate-900">{uniqueSelectedVillages.length}</strong></span>
                  <span>•</span>
                  <span>स्त्रोत: <strong className="text-slate-900">{uniqueSelectedSources.length}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClearAllSelected}
                  disabled={selectedSampleIds.length === 0}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  निवड रद्द करा
                </button>

                <button
                  type="button"
                  onClick={handleOpenConfirmModal}
                  disabled={selectedSampleIds.length === 0}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 px-4 py-1.5 rounded-lg shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>पाठवा ({selectedSampleIds.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Letter Meta Inputs */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
              ४. शासकीय जावक पत्र तपशील (Forwarding Details):
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                जावक क्रमांक (Outward No)*:
              </label>
              <input
                type="text"
                value={letterNumber}
                onChange={(e) => setLetterNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  पत्र दिनांक (Date)*:
                </label>
                <input
                  type="date"
                  value={letterDate}
                  onChange={(e) => setLetterDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  प्रेषण माध्यम (Dispatch Mode):
                </label>
                <select
                  value={dispatchMode}
                  onChange={(e) => setDispatchMode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="विशेष दूत">विशेष दूत (Special Messenger)</option>
                  <option value="कोल्ड चेन बॉक्स">कोल्ड चेन बॉक्स (Cold Chain)</option>
                  <option value="टपाल / स्पीड पोस्ट">टपाल / स्पीड पोस्ट</option>
                  <option value="स्वतः जमा">स्वतः जमा</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                प्रयोगशाळा (Laboratory)*:
              </label>
              <input
                type="text"
                value={laboratoryName}
                onChange={(e) => setLaboratoryName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                प्रति / कोणास (To Authority)*:
              </label>
              <input
                type="text"
                value={toAuthority}
                onChange={(e) => setToAuthority(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                विषय (Subject)*:
              </label>
              <textarea
                rows={2}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenConfirmModal}
              disabled={isSubmitting || selectedSampleIds.length === 0}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 ${
                !isSubmitting && selectedSampleIds.length > 0
                  ? 'bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'पत्र तयार होत आहे...'
                  : `पाठवा - एकत्रित जावक पत्र तयार करा (${selectedSampleIds.length} नमुने)`}
              </span>
            </button>
          </div>

          {/* Previous Letters History */}
          {existingLetters.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>पूर्वी तयार केलेली जावक पत्रे:</span>
                <span className="text-[10px] text-slate-500 font-mono">{existingLetters.length}</span>
              </div>
              <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
                {existingLetters.map((ltr) => (
                  <button
                    key={ltr.id}
                    onClick={() => setActiveLetter(ltr)}
                    className="w-full text-left py-2 px-1 hover:bg-slate-50 rounded flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900">{ltr.letterNumber}</div>
                      <div className="text-[10px] text-slate-500">{ltr.letterDate} — {ltr.sampleCount} नमुने</div>
                    </div>
                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Selected Samples Review Table OR Letter Preview */}
        <div className="lg:col-span-7 space-y-4">
          {/* Header Controls when reviewing or viewing letter */}
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm print:hidden">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowStickers(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !showStickers && activeLetter
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 inline mr-1" />
                शासकीय जावक पत्र (Official Letter)
              </button>
              {activeLetter && (
                <button
                  onClick={() => setShowStickers(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    showStickers ? 'bg-emerald-800 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 inline mr-1" />
                  बाटली स्टिकर्स (Bottle Stickers)
                </button>
              )}
              {activeLetter && (
                <button
                  onClick={() => setActiveLetter(null)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  नवीन पाठवणी (New Dispatch)
                </button>
              )}
            </div>

            {activeLetter && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>प्रिंट (Print)</span>
              </button>
            )}
          </div>

          {/* Review Table of Selected Samples BEFORE dispatch (Requirement 1) */}
          {!activeLetter && selectedSamplesList.length > 0 && (
            <div className="bg-white rounded-xl border border-emerald-300 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    निवडलेल्या नमुन्यांची तपासणी (Selected Samples for Dispatch Review)
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    सदर सर्व नमुने एकाच जावक पत्रासोबत प्रयोगशाळेत पाठविले जातील.
                  </div>
                </div>

                {/* Summary Metrics */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-full border border-emerald-200">
                    एकूण: {selectedSamplesList.length} नमुने
                  </span>
                  <span className="text-xs font-bold bg-blue-100 text-blue-900 px-2.5 py-1 rounded-full border border-blue-200">
                    उपकेंद्रे: {uniqueSelectedSubcenters.length}
                  </span>
                  <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full border border-amber-200">
                    गावे: {uniqueSelectedVillages.length}
                  </span>
                  <span className="text-xs font-bold bg-purple-100 text-purple-900 px-2.5 py-1 rounded-full border border-purple-200">
                    स्त्रोत: {uniqueSelectedSources.length}
                  </span>
                </div>
              </div>

              {/* Requirement Table:
                  Sr.No | Subcenter | Village | Source | Sample Type | Collection Date | Bottle No.
              */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 text-center font-bold">
                      <th className="p-2 border-b border-slate-200">Sr.No</th>
                      <th className="p-2 border-b border-slate-200">Subcenter</th>
                      <th className="p-2 border-b border-slate-200">Village</th>
                      <th className="p-2 border-b border-slate-200">Source</th>
                      <th className="p-2 border-b border-slate-200">Sample Type</th>
                      <th className="p-2 border-b border-slate-200">Collection Date</th>
                      <th className="p-2 border-b border-slate-200">Bottle No.</th>
                      <th className="p-2 border-b border-slate-200">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedSamplesList.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50 text-center">
                        <td className="p-2 font-mono">{idx + 1}</td>
                        <td className="p-2 text-slate-700 font-medium">{s.subcenter || s.subcenterName || '-'}</td>
                        <td className="p-2 font-bold text-slate-900">{s.villageName}</td>
                        <td className="p-2 text-left pl-3 text-slate-800">
                          {s.sourceName || s.patientName || s.shopOrInstitutionName || '-'}
                        </td>
                        <td className="p-2 text-slate-600">{s.sampleTypeName}</td>
                        <td className="p-2 font-mono text-slate-800">{s.collectionDate}</td>
                        <td className="p-2 font-mono font-bold text-cyan-950">
                          {s.sampleCodeOrBottleNo || s.batchNumber || '-'}
                        </td>
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveSelectedSample(s.id)}
                            className="text-red-600 hover:text-red-800 text-[11px] font-bold px-1.5 py-0.5 rounded hover:bg-red-50"
                          >
                            काढा
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  कृपया डाव्या बाजूला जावक क्रमांक व प्रेषण माहिती तपासून "एकत्रित पाठवणी नोंद करा व जावक पत्र तयार करा" वर क्लिक करा.
                </span>
                <button
                  type="button"
                  onClick={handleGenerateLetter}
                  disabled={isSubmitting}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2 rounded-lg shadow transition-all"
                >
                  {isSubmitting ? 'पत्र तयार होत आहे...' : 'जावक पत्र तयार करा'}
                </button>
              </div>
            </div>
          )}

          {!activeLetter && selectedSamplesList.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-3 shadow-sm print:hidden">
              <FileText className="w-12 h-12 mx-auto text-slate-300" />
              <div className="font-bold text-slate-700">कोणतेही नमुने निवडलेले नाहीत</div>
              <p className="text-xs max-w-sm mx-auto text-slate-500">
                डाव्या बाजूला उपकेंद्र, गाव, पाणी स्त्रोत किंवा संकलन दिनांकानुसार फिल्टर करून पाठविण्यासाठी नमुने निवडा. एकाच पावतीमध्ये अनेक उपकेंद्रे व गावे निवडता येतात.
              </p>
            </div>
          )}

          {/* Letter Preview & Print when activeLetter exists */}
          {activeLetter && showStickers && (
            /* STICKERS PRINT SHEET */
            <div className="bg-white rounded-xl border border-slate-300 p-6 shadow-md print:border-none print:shadow-none print:p-0">
              <div className="text-center font-bold text-xs text-slate-700 mb-4 print:hidden border-b pb-2">
                नमुना बाटली/पॅकेट स्टिकर्स (Sample Bottle / Packet Stickers)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedSampleRecords.map((sample) => (
                  <div
                    key={sample.id}
                    className="border-2 border-slate-900 rounded-lg p-3 bg-white space-y-2 text-xs text-slate-900 shadow-2xs break-inside-avoid"
                  >
                    <div className="text-center border-b border-slate-400 pb-1">
                      <div className="font-bold text-[11px]">प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर</div>
                      <div className="text-[10px] text-slate-600">प्रयोगशाळा नमुना लेबल / Sticker</div>
                    </div>

                    <div className="flex items-center justify-between font-mono font-bold bg-slate-100 p-1 rounded border border-slate-300">
                      <span>नमुना क्र: {sample.id}</span>
                      <span>{sample.sampleCodeOrBottleNo || sample.batchNumber || 'SMP'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <div>
                        <span className="font-semibold text-slate-600">गाव:</span> {sample.villageName}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-600">संकलन:</span> {sample.collectionDate}
                      </div>
                      <div className="col-span-2 truncate">
                        <span className="font-semibold text-slate-600">स्त्रोत/रुग्ण:</span>{' '}
                        {sample.sourceName || sample.patientName || sample.shopOrInstitutionName}
                      </div>
                      <div className="col-span-2 text-[10px] text-slate-600">
                        प्रकार: {sample.sampleTypeName} ({sample.sampleQuantity || 'Standard'})
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-300 text-[10px] flex items-center justify-between text-slate-500">
                      <span>जावक क्र: {sample.sendingLetterNumber || activeLetter.letterNumber}</span>
                      <span>स्वाक्षरी: ________</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeLetter && !showStickers && (
            /* OFFICIAL A4 GOVERNMENT SENDING LETTER */
            <div className="bg-white rounded-xl border border-slate-300 p-8 shadow-md text-slate-900 space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 font-serif leading-relaxed">
              {/* Government Header */}
              <div className="text-center border-b-2 border-slate-800 pb-4 space-y-1">
                <div className="text-xs uppercase tracking-widest font-sans font-bold text-slate-600">
                  महाराष्ट्र शासन — सार्वजनिक आरोग्य विभाग
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  आयुष्यमान आरोग्य मंदिर लखनगाव
                </div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950">
                  प्राथमिक आरोग्य केंद्र भादा
                </h1>
                <div className="text-xs font-semibold text-slate-700">
                  तालुका औसा, जिल्हा लातूर — ४१३५२०
                </div>
              </div>

              {/* Outward & Date Row */}
              <div className="flex items-center justify-between text-xs sm:text-sm font-sans font-semibold border-b border-slate-200 pb-2">
                <div>जावक क्रमांक: <span className="font-mono font-bold text-slate-950">{activeLetter.letterNumber}</span></div>
                <div>दिनांक: <span className="font-mono font-bold text-slate-950">{activeLetter.letterDate}</span></div>
              </div>

              {/* To Authority */}
              <div className="text-xs sm:text-sm space-y-1 font-sans">
                <div className="font-bold">प्रति,</div>
                <div className="pl-4 font-semibold text-slate-900">{activeLetter.toAuthority}</div>
              </div>

              {/* Subject & Reference */}
              <div className="bg-slate-50/80 p-3 rounded border border-slate-200 text-xs sm:text-sm space-y-1.5 font-sans">
                <div>
                  <span className="font-bold">विषय:</span> {activeLetter.subject}
                </div>
                {activeLetter.reference && (
                  <div>
                    <span className="font-bold">संदर्भ:</span> {activeLetter.reference}
                  </div>
                )}
              </div>

              {/* Letter Body */}
              <div className="text-xs sm:text-sm leading-relaxed text-justify">
                <p>
                  महोदय/महोदया,
                </p>
                <p className="indent-8 mt-2">
                  उपरोक्त विषयान्वये सविनय सादर करण्यात येते की, प्राथमिक आरोग्य केंद्र भादा कार्यक्षेत्रातील खालील नमूद विविध उपकेंद्रे व गावांमधील {activeLetter.sampleTypeName} तपासणीकरिता सोबत पाठविण्यात येत आहेत. सदर नमुन्यांची विहित मानकांनुसार प्रयोगशाळा तपासणी करून त्याचा अधिकृत अहवाल या कार्यालयास त्वरित पाठवून सहकार्य करावे, ही नम्र विनंती.
                </p>
              </div>

              {/* Table of Samples */}
              <div className="space-y-1 font-sans">
                <div className="text-xs font-bold text-slate-800">
                  सोबत जोडलेल्या नमुन्यांचा तपशील (एकूण: {selectedSampleRecords.length} नमुने):
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-800 text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 text-center font-bold">
                        <th className="border border-slate-700 p-1.5">अ.क्र.</th>
                        <th className="border border-slate-700 p-1.5">उपकेंद्र</th>
                        <th className="border border-slate-700 p-1.5">गाव</th>
                        <th className="border border-slate-700 p-1.5">पाणी स्त्रोत / रुग्ण</th>
                        <th className="border border-slate-700 p-1.5">बाटली क्र. (अनुक्रमांक)</th>
                        <th className="border border-slate-700 p-1.5">संकलन दिनांक</th>
                        <th className="border border-slate-700 p-1.5">प्रमाण</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSampleRecords.map((s, idx) => (
                        <tr key={s.id} className="text-center">
                          <td className="border border-slate-700 p-1.5">{idx + 1}</td>
                          <td className="border border-slate-700 p-1.5">{s.subcenter || s.subcenterName || '-'}</td>
                          <td className="border border-slate-700 p-1.5 font-bold text-slate-950">{s.villageName}</td>
                          <td className="border border-slate-700 p-1.5 text-left pl-2">
                            {s.sourceName || s.patientName || s.shopOrInstitutionName || '-'}
                          </td>
                          <td className="border border-slate-700 p-1.5 font-mono font-bold text-slate-900">
                            {s.sampleCodeOrBottleNo || s.batchNumber || '-'}
                          </td>
                          <td className="border border-slate-700 p-1.5 font-mono">{s.collectionDate}</td>
                          <td className="border border-slate-700 p-1.5">{s.sampleQuantity || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mode & Remarks */}
              <div className="text-xs text-slate-700 space-y-1 font-sans">
                <div><span className="font-bold">प्रेषण माध्यम:</span> {activeLetter.dispatchMode}</div>
                {activeLetter.remarks && <div><span className="font-bold">शेरा:</span> {activeLetter.remarks}</div>}
              </div>

              {/* Signature Block */}
              <div className="pt-12 flex justify-end font-sans">
                <div className="text-center space-y-1 text-xs sm:text-sm">
                  <div className="font-bold text-slate-900">आपला विश्वासू,</div>
                  <div className="h-12"></div>
                  <div className="font-bold text-slate-950 border-t border-slate-400 pt-1">
                    वैद्यकीय अधिकारी
                  </div>
                  <div className="text-slate-800 text-xs">
                    प्राथमिक आरोग्य केंद्र भादा
                  </div>
                  <div className="text-slate-700 text-xs">
                    ता. औसा, जि. लातूर
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dispatch Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold">
                    एकूण {selectedSamplesList.length} पाणी नमुने पाठविण्यासाठी निवडले आहेत.
                  </h3>
                  <p className="text-xs text-slate-300">
                    खालील तपशील तपासून जावक पत्र व पाठवणी निश्चित करा.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Details and Table */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">जावक क्रमांक:</span>
                  <span className="font-mono font-bold text-slate-800">{letterNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">दिनांक:</span>
                  <span className="font-bold text-slate-800">{letterDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">नमुना प्रकार:</span>
                  <span className="font-bold text-slate-800">{currentSampleType.marathiName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">प्रयोगशाळा:</span>
                  <span className="font-semibold text-slate-800 text-[11px] truncate block" title={laboratoryName}>
                    {laboratoryName}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-center">
                      <th className="p-2.5">अ.क्र.</th>
                      <th className="p-2.5">उपकेंद्र</th>
                      <th className="p-2.5">गाव</th>
                      <th className="p-2.5 text-left pl-3">स्त्रोत</th>
                      <th className="p-2.5">नमुना प्रकार</th>
                      <th className="p-2.5">संकलन दिनांक</th>
                      <th className="p-2.5">बाटली क्र.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-center">
                    {selectedSamplesList.map((sample, idx) => (
                      <tr key={sample.id} className="hover:bg-slate-50">
                        <td className="p-2 font-mono text-slate-600">{idx + 1}</td>
                        <td className="p-2 font-medium text-slate-700">{sample.subcenter || sample.subcenterName || 'भादा'}</td>
                        <td className="p-2 font-bold text-slate-900">{sample.villageName}</td>
                        <td className="p-2 text-left pl-3 text-slate-800">
                          <div className="font-semibold">{sample.sourceName || sample.patientName || sample.id}</div>
                          {sample.sourceType && (
                            <span className="text-[10px] text-slate-500 font-normal">{sample.sourceType}</span>
                          )}
                        </td>
                        <td className="p-2 text-slate-700">{sample.sampleTypeName || currentSampleType.marathiName}</td>
                        <td className="p-2 font-mono text-slate-800">{sample.collectionDate}</td>
                        <td className="p-2 font-mono font-bold text-cyan-900 bg-cyan-50/50">
                          {sample.sampleCodeOrBottleNo || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-200 transition-colors"
              >
                रद्द करा
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  handleGenerateLetter();
                }}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 shadow-md transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'पाठवणी होत आहे...' : `पाठवा (${selectedSamplesList.length} नमुने)`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
