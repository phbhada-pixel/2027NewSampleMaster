import React, { useState } from 'react';
import { clientStore } from '../services/clientStore';
import {
  SubcenterMaster,
  VillageMaster,
  SourceMaster,
  SampleTypeMaster,
  User,
  UserRole,
} from '../types';
import {
  Settings,
  MapPin,
  Building,
  Layers,
  Users,
  PlusCircle,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Database,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  Search,
  Check,
  Copy,
  Info,
} from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { MasterBulkImport } from './MasterBulkImport';

interface MasterAdminModuleProps {
  currentUser: User;
}

export const MasterAdminModule: React.FC<MasterAdminModuleProps> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'subcenters' | 'villages' | 'sources' | 'types' | 'users' | 'import' | 'database'
  >('subcenters');

  // Lists
  const [subcenters, setSubcenters] = useState<SubcenterMaster[]>(clientStore.getAllSubcenters());
  const [villages, setVillages] = useState<VillageMaster[]>(clientStore.getAllVillages());
  const [sampleTypes, setSampleTypes] = useState<SampleTypeMaster[]>(clientStore.getSampleTypes());
  const [users, setUsers] = useState<User[]>(clientStore.getUsers());
  const [sources, setSources] = useState<SourceMaster[]>(clientStore.getAllSources());

  // Filters
  const [villageSubcenterFilter, setVillageSubcenterFilter] = useState<string>('ALL');
  const [sourceVillageFilter, setSourceVillageFilter] = useState<string>('ALL');

  // Subcenter Modal State
  const [showSubcenterModal, setShowSubcenterModal] = useState<boolean>(false);
  const [editingSubcenterId, setEditingSubcenterId] = useState<string | null>(null);
  const [subcenterCode, setSubcenterCode] = useState<string>('');
  const [subcenterName, setSubcenterName] = useState<string>('');
  const [subcenterMarathiName, setSubcenterMarathiName] = useState<string>('');
  const [subcenterPhc, setSubcenterPhc] = useState<string>('भादा');
  const [subcenterTaluka, setSubcenterTaluka] = useState<string>('औसा');
  const [subcenterDistrict, setSubcenterDistrict] = useState<string>('लातूर');

  // Village Modal State
  const [showVillageModal, setShowVillageModal] = useState<boolean>(false);
  const [editingVillageId, setEditingVillageId] = useState<string | null>(null);
  const [villageName, setVillageName] = useState<string>('');
  const [villageEnglishName, setVillageEnglishName] = useState<string>('');
  const [villageCode, setVillageCode] = useState<string>('');
  const [villageSubcenterId, setVillageSubcenterId] = useState<string>(
    subcenters[0]?.id || ''
  );

  // Source Modal State
  const [showSourceModal, setShowSourceModal] = useState<boolean>(false);
  const [srcVillageId, setSrcVillageId] = useState<string>(villages[0]?.id || '');
  const [srcTypeId, setSrcTypeId] = useState<string>(sampleTypes[0]?.id || 'ST-001');
  const [srcName, setSrcName] = useState<string>('');
  const [srcType, setSrcType] = useState<string>('विहीर');
  const [srcLocation, setSrcLocation] = useState<string>('');

  // User Modal State
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<UserRole>('USER');
  const [userDesignation, setUserDesignation] = useState<string>('आरोग्य सेवक');
  const [userSubcenter, setUserSubcenter] = useState<string>('भादा');

  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [notification, setNotification] = useState<string>('');

  const refreshData = () => {
    setSubcenters(clientStore.getAllSubcenters());
    setVillages(clientStore.getAllVillages());
    setSources(clientStore.getAllSources());
    setUsers(clientStore.getUsers());
  };

  // ==========================================
  // SUBCENTER ACTIONS
  // ==========================================
  const handleOpenAddSubcenter = () => {
    setEditingSubcenterId(null);
    setSubcenterCode('');
    setSubcenterName('');
    setSubcenterMarathiName('');
    setSubcenterPhc('भादा');
    setSubcenterTaluka('औसा');
    setSubcenterDistrict('लातूर');
    setShowSubcenterModal(true);
  };

  const handleOpenEditSubcenter = (sc: SubcenterMaster) => {
    setEditingSubcenterId(sc.id);
    setSubcenterCode(sc.subcenterCode);
    setSubcenterName(sc.subcenterName);
    setSubcenterMarathiName(sc.marathiName || `उपकेंद्र ${sc.subcenterName}`);
    setSubcenterPhc(sc.phcName || 'भादा');
    setSubcenterTaluka(sc.taluka || 'औसा');
    setSubcenterDistrict(sc.district || 'लातूर');
    setShowSubcenterModal(true);
  };

  const handleSaveSubcenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subcenterCode.trim() || !subcenterName.trim()) {
      alert('कृपया उपकेंद्र कोड आणि नाव प्रविष्ट करा.');
      return;
    }

    if (editingSubcenterId) {
      const updated = clientStore.updateSubcenter(editingSubcenterId, {
        subcenterCode: subcenterCode.trim().toUpperCase(),
        subcenterName: subcenterName.trim(),
        marathiName: subcenterMarathiName.trim() || `उपकेंद्र ${subcenterName.trim()}`,
        phcName: subcenterPhc.trim() || 'भादा',
        taluka: subcenterTaluka.trim() || 'औसा',
        district: subcenterDistrict.trim() || 'लातूर',
      });
      if (updated) {
        setNotification(`उपकेंद्र "${updated.subcenterName}" अद्ययावत केले गेले.`);
      }
    } else {
      const created = clientStore.addSubcenter({
        subcenterCode: subcenterCode.trim().toUpperCase(),
        subcenterName: subcenterName.trim(),
        marathiName: subcenterMarathiName.trim() || `उपकेंद्र ${subcenterName.trim()}`,
        phcName: subcenterPhc.trim() || 'भादा',
        taluka: subcenterTaluka.trim() || 'औसा',
        district: subcenterDistrict.trim() || 'लातूर',
        isActive: true,
      });
      if (created) {
        setNotification(`नवीन उपकेंद्र "${created.subcenterName}" यशस्वीरीत्या जोडले गेले.`);
      } else {
        alert('उपकेंद्र कोड आधीपासून अस्तित्वात आहे किंवा त्रुटी आली.');
        return;
      }
    }

    setShowSubcenterModal(false);
    refreshData();
  };

  const handleToggleSubcenterActive = (sc: SubcenterMaster) => {
    if (sc.isActive) {
      const res = clientStore.deactivateSubcenter(sc.id);
      if (!res.success) {
        alert(res.message);
        return;
      }
      setNotification(res.message);
    } else {
      const res = clientStore.restoreSubcenter(sc.id);
      setNotification(res.message);
    }
    refreshData();
  };

  // ==========================================
  // VILLAGE ACTIONS
  // ==========================================
  const handleOpenAddVillage = () => {
    setEditingVillageId(null);
    setVillageName('');
    setVillageEnglishName('');
    setVillageCode('');
    setVillageSubcenterId(subcenters.find((s) => s.isActive)?.id || subcenters[0]?.id || '');
    setShowVillageModal(true);
  };

  const handleOpenEditVillage = (v: VillageMaster) => {
    setEditingVillageId(v.id);
    setVillageName(v.name);
    setVillageEnglishName(v.englishName || v.name);
    setVillageCode(v.code);
    setVillageSubcenterId(v.subcenterId || '');
    setShowVillageModal(true);
  };

  const handleSaveVillage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!villageName.trim() || !villageSubcenterId) {
      alert('कृपया गावाचे नाव व उपकेंद्र निवडा.');
      return;
    }

    const sc = subcenters.find((s) => s.id === villageSubcenterId);
    if (!sc) {
      alert('निवडलेले उपकेंद्र सापडले नाही.');
      return;
    }

    if (editingVillageId) {
      const updated = clientStore.updateVillage(editingVillageId, {
        name: villageName.trim(),
        englishName: villageEnglishName.trim() || villageName.trim(),
        code: (villageCode.trim() || villageName.trim().slice(0, 3)).toUpperCase(),
        subcenterId: sc.id,
        subcenterName: sc.subcenterName,
        subcenter: sc.subcenterName,
        phcName: sc.phcName || 'भादा',
        taluka: sc.taluka || 'औसा',
        district: sc.district || 'लातूर',
      });
      if (updated) {
        setNotification(`गाव "${updated.name}" अद्ययावत केले गेले.`);
      }
    } else {
      const created = clientStore.addVillage({
        name: villageName.trim(),
        englishName: villageEnglishName.trim() || villageName.trim(),
        code: (villageCode.trim() || villageName.trim().slice(0, 3)).toUpperCase(),
        subcenterId: sc.id,
        subcenterName: sc.subcenterName,
        subcenter: sc.subcenterName,
        phcName: sc.phcName || 'भादा',
        taluka: sc.taluka || 'औसा',
        district: sc.district || 'लातूर',
        isActive: true,
      });
      if (created) {
        setNotification(`नवीन गाव "${created.name}" यशस्वीरीत्या जोडले गेले.`);
      } else {
        alert('गाव कोड आधीपासून अस्तित्वात आहे किंवा त्रुटी आली.');
        return;
      }
    }

    setShowVillageModal(false);
    refreshData();
  };

  const handleToggleVillageActive = (v: VillageMaster) => {
    if (v.isActive) {
      const res = clientStore.deactivateVillage(v.id);
      setNotification(res.message);
    } else {
      const res = clientStore.restoreVillage(v.id);
      setNotification(res.message);
    }
    refreshData();
  };

  // ==========================================
  // SOURCE ACTIONS
  // ==========================================
  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!srcName.trim()) {
      alert('कृपया स्त्रोताचे नाव टाका.');
      return;
    }

    const v = villages.find((item) => item.id === srcVillageId) || villages[0];
    const st = sampleTypes.find((item) => item.id === srcTypeId) || sampleTypes[0];

    clientStore.addSource({
      villageId: v.id,
      villageName: v.name,
      sampleTypeId: st.id,
      sampleTypeName: st.name,
      sourceName: srcName.trim(),
      sourceCode: `SRC-${v.code}-${Math.floor(Math.random() * 900 + 100)}`,
      sourceType: srcType,
      locationAddress: srcLocation.trim() || v.name,
      isActive: true,
    });

    setSrcName('');
    setSrcLocation('');
    setShowSourceModal(false);
    refreshData();
    setNotification('नवीन पाणी स्त्रोत मास्टरमध्ये यशस्वीरित्या जोडला गेला!');
  };

  // ==========================================
  // USER ACTIONS
  // ==========================================
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      alert('कृपया कर्मचाऱ्याचे नाव टाका.');
      return;
    }

    clientStore.addUser({
      name: userName.trim(),
      email: userEmail.trim() || `${userName.toLowerCase().replace(/\s+/g, '')}@phcbhada.in`,
      role: userRole,
      designation: userDesignation,
      subcenter: userSubcenter,
      isActive: true,
    });

    setUserName('');
    setUserEmail('');
    setShowUserModal(false);
    refreshData();
    setNotification('नवीन वापरकर्ता व कर्मचारी यशस्वीरित्या जोडला गेला!');
  };

  // Filtered village list
  const filteredVillages = villages.filter((v) => {
    if (villageSubcenterFilter !== 'ALL' && v.subcenterId !== villageSubcenterFilter) {
      return false;
    }
    return true;
  });

  // Filtered sources list
  const filteredSources = sources.filter((s) => {
    if (sourceVillageFilter !== 'ALL' && s.villageId !== sourceVillageFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-700" />
              मास्टर प्रशासन व पदक्रम व्यवस्थापन (Master Administration)
            </h2>
            <p className="text-xs text-slate-500">
              उपकेंद्र, गावे, पाणी स्त्रोत, नमुना प्रकार, कर्मचारी व एक्सेल आयात व्यवस्थापन (Admin Role: {currentUser.name})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-bold uppercase border border-emerald-200">
              Admin Access Active
            </span>
          </div>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-50 border-l-4 border-emerald-600 p-3 rounded text-xs text-emerald-900 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-bold">{notification}</span>
          </div>
          <button onClick={() => setNotification('')} className="font-bold text-sm text-emerald-800 hover:text-emerald-950">
            ✕
          </button>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSubTab('subcenters')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'subcenters'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>१. उपकेंद्र मास्टर ({subcenters.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('villages')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'villages'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>२. गावे मास्टर ({villages.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sources')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'sources'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>३. पाणी स्त्रोत मास्टर ({sources.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('import')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'import'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>४. मास्टर आयात (Bulk CSV)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('types')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'types'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>५. नमुना प्रकार ({sampleTypes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'users'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>६. कर्मचारी व वापरकर्ते ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('database')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'database'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>७. Supabase / Cloud DB</span>
        </button>
      </div>

      {/* ========================================== */}
      {/* 1. SUBCENTERS MASTER TAB                   */}
      {/* ========================================== */}
      {activeSubTab === 'subcenters' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-700" />
                उपकेंद्र मास्टर यादी (Subcenter Master — PHC Bhada)
              </h3>
              <p className="text-xs text-slate-500">
                प्राथमिक आरोग्य केंद्र भादा अंतर्गत अधिकृत उपकेंद्रांची निर्मिती व नियंत्रण (FK Level Root)
              </p>
            </div>
            <button
              onClick={handleOpenAddSubcenter}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>नवीन उपकेंद्र जोडा</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-left">
                  <th className="border border-slate-200 p-2">उपकेंद्र कोड</th>
                  <th className="border border-slate-200 p-2">उपकेंद्र नाव (मराठी)</th>
                  <th className="border border-slate-200 p-2">प्रा.आ. केंद्र (PHC)</th>
                  <th className="border border-slate-200 p-2">तालुका / जिल्हा</th>
                  <th className="border border-slate-200 p-2 text-center">जोडलेली गावे</th>
                  <th className="border border-slate-200 p-2 text-center">स्थिती</th>
                  <th className="border border-slate-200 p-2 text-right">कृती (Actions)</th>
                </tr>
              </thead>
              <tbody>
                {subcenters.map((sc) => {
                  const linkedVillages = villages.filter((v) => v.subcenterId === sc.id);
                  return (
                    <tr
                      key={sc.id}
                      className={`hover:bg-slate-50 ${!sc.isActive ? 'bg-slate-50/60 opacity-75' : ''}`}
                    >
                      <td className="border border-slate-200 p-2 font-mono font-bold text-slate-900">
                        {sc.subcenterCode}
                      </td>
                      <td className="border border-slate-200 p-2 font-bold text-emerald-950">
                        {sc.subcenterName}
                        {sc.marathiName && sc.marathiName !== sc.subcenterName && (
                          <span className="block text-[11px] font-normal text-slate-500">
                            {sc.marathiName}
                          </span>
                        )}
                      </td>
                      <td className="border border-slate-200 p-2 font-medium text-slate-700">
                        {sc.phcName || 'भादा'}
                      </td>
                      <td className="border border-slate-200 p-2 text-slate-600">
                        {sc.taluka || 'औसा'}, {sc.district || 'लातूर'}
                      </td>
                      <td className="border border-slate-200 p-2 text-center font-mono font-bold text-emerald-800">
                        <span
                          className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded cursor-pointer hover:bg-emerald-100"
                          onClick={() => {
                            setVillageSubcenterFilter(sc.id);
                            setActiveSubTab('villages');
                          }}
                          title="या उपकेंद्रातील गावे पहा"
                        >
                          {linkedVillages.length} गावे
                        </span>
                      </td>
                      <td className="border border-slate-200 p-2 text-center">
                        {sc.isActive ? (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            सक्रिय (Active)
                          </span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            निष्क्रिय (Inactive)
                          </span>
                        )}
                      </td>
                      <td className="border border-slate-200 p-2 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditSubcenter(sc)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px]"
                        >
                          संपादित करा
                        </button>
                        <button
                          onClick={() => handleToggleSubcenterActive(sc)}
                          className={`px-2 py-1 rounded font-semibold text-[11px] ${
                            sc.isActive
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {sc.isActive ? 'निष्क्रिय करा' : 'सक्रिय करा'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. VILLAGES MASTER TAB                     */}
      {/* ========================================== */}
      {activeSubTab === 'villages' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                कार्यक्षेत्रातील गावे (Village Master — Subcenter Mapped)
              </h3>
              <p className="text-xs text-slate-500">
                प्रत्येक गाव एका अधिकृत उपकेंद्राशी (Foreign Key) थेट जोडलेले आहे.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter by Subcenter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-600">उपकेंद्र फिल्टर:</span>
                <select
                  value={villageSubcenterFilter}
                  onChange={(e) => setVillageSubcenterFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value="ALL">सर्व उपकेंद्रे ({subcenters.length})</option>
                  {subcenters.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.subcenterName} ({sc.subcenterCode})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleOpenAddVillage}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>नवीन गाव जोडा</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-left">
                  <th className="border border-slate-200 p-2">कोड</th>
                  <th className="border border-slate-200 p-2">गावाचे नाव (मराठी)</th>
                  <th className="border border-slate-200 p-2">English Name</th>
                  <th className="border border-slate-200 p-2">उपकेंद्र (Subcenter)</th>
                  <th className="border border-slate-200 p-2">तालुका / जिल्हा</th>
                  <th className="border border-slate-200 p-2 text-center">स्त्रोत संख्या</th>
                  <th className="border border-slate-200 p-2 text-center">स्थिती</th>
                  <th className="border border-slate-200 p-2 text-right">कृती</th>
                </tr>
              </thead>
              <tbody>
                {filteredVillages.map((v) => {
                  const srcCount = sources.filter((s) => s.villageId === v.id).length;
                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-slate-50 ${!v.isActive ? 'bg-slate-50/60 opacity-75' : ''}`}
                    >
                      <td className="border border-slate-200 p-2 font-mono font-bold text-slate-900">
                        {v.code}
                      </td>
                      <td className="border border-slate-200 p-2 font-bold text-slate-900">{v.name}</td>
                      <td className="border border-slate-200 p-2 text-slate-600">{v.englishName}</td>
                      <td className="border border-slate-200 p-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {v.subcenterName || v.subcenter}
                        </span>
                      </td>
                      <td className="border border-slate-200 p-2 text-slate-500">
                        {v.taluka || 'औसा'}, {v.district || 'लातूर'}
                      </td>
                      <td className="border border-slate-200 p-2 text-center font-mono font-bold text-slate-800">
                        {srcCount} स्त्रोत
                      </td>
                      <td className="border border-slate-200 p-2 text-center">
                        {v.isActive ? (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            Active
                          </span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="border border-slate-200 p-2 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditVillage(v)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px]"
                        >
                          संपादित करा
                        </button>
                        <button
                          onClick={() => handleToggleVillageActive(v)}
                          className={`px-2 py-1 rounded font-semibold text-[11px] ${
                            v.isActive
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {v.isActive ? 'निष्क्रिय करा' : 'सक्रिय करा'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. SOURCES MASTER TAB                      */}
      {/* ========================================== */}
      {activeSubTab === 'sources' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">गाव निहाय पाणी स्त्रोत मास्टर (Source Master)</h3>
              <p className="text-xs text-slate-500">
                प्रत्येक गावातील विहिरी, कूपनलिका, पाण्याच्या टाक्या व नळ योजना स्त्रोत
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sourceVillageFilter}
                onChange={(e) => setSourceVillageFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
              >
                <option value="ALL">सर्व गावे (All Villages)</option>
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.subcenterName || v.subcenter})
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowSourceModal(true)}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                <span>नवीन स्त्रोत जोडा</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full border-collapse border border-slate-200 text-xs">
              <thead className="sticky top-0 bg-slate-100">
                <tr className="text-slate-800 text-left">
                  <th className="border border-slate-200 p-2">स्त्रोत कोड</th>
                  <th className="border border-slate-200 p-2">गाव</th>
                  <th className="border border-slate-200 p-2">स्त्रोताचे नाव</th>
                  <th className="border border-slate-200 p-2">प्रकार</th>
                  <th className="border border-slate-200 p-2">पत्ता / स्थान</th>
                  <th className="border border-slate-200 p-2">लागू नमुना प्रकार</th>
                  <th className="border border-slate-200 p-2">स्थिती</th>
                </tr>
              </thead>
              <tbody>
                {filteredSources.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="border border-slate-200 p-2 font-mono font-bold text-slate-900">
                      {s.sourceCode}
                    </td>
                    <td className="border border-slate-200 p-2 font-semibold text-slate-900">{s.villageName}</td>
                    <td className="border border-slate-200 p-2 font-bold text-slate-800">{s.sourceName}</td>
                    <td className="border border-slate-200 p-2">
                      <span className="bg-cyan-50 text-cyan-900 px-2 py-0.5 rounded font-medium border border-cyan-200">
                        {s.sourceType}
                      </span>
                    </td>
                    <td className="border border-slate-200 p-2 text-slate-600">{s.locationAddress}</td>
                    <td className="border border-slate-200 p-2 text-slate-500">{s.sampleTypeName}</td>
                    <td className="border border-slate-200 p-2">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 4. MASTER BULK IMPORT TAB                  */}
      {/* ========================================== */}
      {activeSubTab === 'import' && (
        <MasterBulkImport onImportComplete={refreshData} />
      )}

      {/* ========================================== */}
      {/* 5. SAMPLE TYPES TAB                        */}
      {/* ========================================== */}
      {activeSubTab === 'types' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">प्रमाणित नमुना प्रकार (Sample Type Registry)</h3>
            <p className="text-xs text-slate-500">आरोग्य संचालनालय प्रमाणित ५ मुख्य नमुना विभाग</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sampleTypes.map((st) => (
              <div key={st.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {st.codePrefix} ({st.id})
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{st.department}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">{st.marathiName}</h4>
                <p className="text-xs text-slate-600">{st.name}</p>
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 flex justify-between">
                  <span>डीफॉल्ट लॅब: {st.defaultLaboratory}</span>
                  <span className="font-bold text-emerald-700">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 6. USERS TAB                               */}
      {/* ========================================== */}
      {activeSubTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">अधिकृत कर्मचारी व वापरकर्ते (Personnel & RBAC)</h3>
              <p className="text-xs text-slate-500">वैद्यकीय अधिकारी, आरोग्य सेवक व प्रयोगशाळा तंत्रज्ञ</p>
            </div>
            <button
              onClick={() => setShowUserModal(true)}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>नवीन कर्मचारी जोडा</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-left">
                  <th className="border border-slate-200 p-2">कर्मचारी नाव</th>
                  <th className="border border-slate-200 p-2">ईमेल आयडी</th>
                  <th className="border border-slate-200 p-2">पदनाम</th>
                  <th className="border border-slate-200 p-2">उपकेंद्र</th>
                  <th className="border border-slate-200 p-2">भूमिका (Role)</th>
                  <th className="border border-slate-200 p-2">स्थिती</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="border border-slate-200 p-2 font-bold text-slate-900">{u.name}</td>
                    <td className="border border-slate-200 p-2 text-slate-600 font-mono">{u.email}</td>
                    <td className="border border-slate-200 p-2 text-slate-800">{u.designation}</td>
                    <td className="border border-slate-200 p-2 font-medium text-emerald-800">
                      {u.subcenter || 'भादा'}
                    </td>
                    <td className="border border-slate-200 p-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'ADMIN' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="border border-slate-200 p-2">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 7. SUPABASE / CLOUD DB TAB                 */}
      {/* ========================================== */}
      {activeSubTab === 'database' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-700" />
                क्लाउड डेटाबेस संरचना व सिंक स्थिती (Supabase Production Database)
              </h3>
              <p className="text-xs text-slate-500">
                रिमोट पोस्टग्रेस डेटाबेस, उपकेंद्र फॉरेन की संबंध व RLS सुरक्षा मार्गदर्शक
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2.5 py-1 rounded font-bold border ${
                  isSupabaseConfigured
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {isSupabaseConfigured ? 'Supabase Connected' : 'Local Offline Mode'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-900">
              Supabase SQL Editor मध्ये उपकेंद्र व गाव मायग्रेशन चालवण्याबाबत:
            </h4>
            <p className="text-xs text-slate-600">
              प्रकल्पामध्ये उपकेंद्र मास्टर (<code className="bg-white px-1.5 py-0.5 rounded border text-emerald-800 font-bold">public.subcenters</code>), गाव फॉरेन की (<code className="bg-white px-1.5 py-0.5 rounded border text-emerald-800 font-bold">subcenter_id</code>), RLS धोरणे व स्वयंचलित ट्रिगर्स समाविष्ट आहेत.
            </p>
            <div className="text-xs text-slate-700 bg-white border border-slate-200 p-3 rounded space-y-1">
              <div className="font-bold text-slate-800">डेटाबेस मायग्रेशन फाईल:</div>
              <code className="text-emerald-800 font-bold block">/supabase/schema.sql</code>
              <div className="text-[11px] text-slate-500 mt-1">
                रिमोट Supabase डॅशबोर्ड मधील SQL Editor मध्ये सदर फाईल रन करून सर्व टेबल्स व RLS धोरणे त्वरित सक्रिय करता येतील.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SUBCENTER MODAL                            */}
      {/* ========================================== */}
      {showSubcenterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveSubcenter}
            className="bg-white rounded-xl max-w-md w-full p-5 space-y-3 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95"
          >
            <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-700" />
              <span>{editingSubcenterId ? 'उपकेंद्र संपादित करा' : 'नवीन उपकेंद्र जोडा (Add Subcenter)'}</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                उपकेंद्र कोड (Subcenter Code)*:
              </label>
              <input
                type="text"
                required
                placeholder="उदा. BHD, LKH, MLK, UTT"
                value={subcenterCode}
                onChange={(e) => setSubcenterCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border rounded-lg px-3 py-1.5 text-xs font-mono font-bold uppercase focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                उपकेंद्र नाव (मराठी)*:
              </label>
              <input
                type="text"
                required
                placeholder="उदा. भादा"
                value={subcenterName}
                onChange={(e) => setSubcenterName(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                विस्तारित मराठी नाव (पर्यायी):
              </label>
              <input
                type="text"
                placeholder="उदा. उपकेंद्र भादा"
                value={subcenterMarathiName}
                onChange={(e) => setSubcenterMarathiName(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">प्रा.आ. केंद्र:</label>
                <input
                  type="text"
                  value={subcenterPhc}
                  onChange={(e) => setSubcenterPhc(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">तालुका:</label>
                <input
                  type="text"
                  value={subcenterTaluka}
                  onChange={(e) => setSubcenterTaluka(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">जिल्हा:</label>
                <input
                  type="text"
                  value={subcenterDistrict}
                  onChange={(e) => setSubcenterDistrict(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowSubcenterModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm"
              >
                {editingSubcenterId ? 'बदल जतन करा' : 'उपकेंद्र जोडा'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================== */}
      {/* VILLAGE MODAL                              */}
      {/* ========================================== */}
      {showVillageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveVillage}
            className="bg-white rounded-xl max-w-md w-full p-5 space-y-3 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95"
          >
            <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>{editingVillageId ? 'गाव माहिती अद्ययावत करा' : 'नवीन गाव जोडा (Add Village)'}</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                उपकेंद्र निवडा (Subcenter)*:
              </label>
              <select
                required
                value={villageSubcenterId}
                onChange={(e) => setVillageSubcenterId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-emerald-900 focus:bg-white focus:outline-none"
              >
                <option value="">-- उपकेंद्र निवडा --</option>
                {subcenters
                  .filter((s) => s.isActive)
                  .map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.subcenterName} ({sc.subcenterCode})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                गावाचे नाव (मराठी)*:
              </label>
              <input
                type="text"
                required
                placeholder="उदा. बोरगाव"
                value={villageName}
                onChange={(e) => setVillageName(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                गावाचे इंग्रजी नाव (English Name):
              </label>
              <input
                type="text"
                placeholder="e.g. Borgaon"
                value={villageEnglishName}
                onChange={(e) => setVillageEnglishName(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                गाव कोड (Village Short Code)*:
              </label>
              <input
                type="text"
                required
                placeholder="उदा. BRG"
                value={villageCode}
                onChange={(e) => setVillageCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border rounded-lg px-3 py-1.5 text-xs uppercase font-mono font-bold focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowVillageModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm"
              >
                {editingVillageId ? 'बदल जतन करा' : 'गाव जोडा'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================== */}
      {/* SOURCE MODAL                               */}
      {/* ========================================== */}
      {showSourceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSource}
            className="bg-white rounded-xl max-w-md w-full p-5 space-y-3 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95"
          >
            <h3 className="font-bold text-sm text-slate-900 border-b pb-2">
              नवीन पाणी स्त्रोत जोडा (Add Source)
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">गाव निवडा*:</label>
              <select
                value={srcVillageId}
                onChange={(e) => setSrcVillageId(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.subcenterName || v.subcenter})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">स्त्रोताचे नाव*:</label>
              <input
                type="text"
                required
                placeholder="उदा. ग्रामपंचायत विहीर क्र. १"
                value={srcName}
                onChange={(e) => setSrcName(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg px-3 py-1.5 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">स्त्रोताचा प्रकार*:</label>
              <select
                value={srcType}
                onChange={(e) => setSrcType(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg px-3 py-1.5 text-xs"
              >
                <option value="विहीर">विहीर (Dug Well)</option>
                <option value="कूपनलिका">कूपनलिका (Borewell)</option>
                <option value="हातपंप">हातपंप (Handpump)</option>
                <option value="नळ योजना">नळ योजना (Tap Water Scheme)</option>
                <option value="सार्वजनिक टाकी">सार्वजनिक पाण्याची टाकी (ESR Tank)</option>
                <option value="इतर">इतर (Other)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">स्थळ / पत्ता वर्णन:</label>
              <input
                type="text"
                placeholder="उदा. मारुती मंदिराशेजारी"
                value={srcLocation}
                onChange={(e) => setSrcLocation(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg px-3 py-1.5 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowSourceModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                className="bg-emerald-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
              >
                जतन करा
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================== */}
      {/* USER MODAL                                 */}
      {/* ========================================== */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddUser}
            className="bg-white rounded-xl max-w-md w-full p-5 space-y-3 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95"
          >
            <h3 className="font-bold text-sm text-slate-900 border-b pb-2">
              नवीन कर्मचारी / वापरकर्ता जोडा
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">पूर्ण नाव*:</label>
              <input
                type="text"
                required
                placeholder="उदा. डॉ. सचिन कांबळे"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg px-3 py-1.5 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">पद / पदनाम*:</label>
              <input
                type="text"
                value={userDesignation}
                onChange={(e) => setUserDesignation(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg px-3 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                भूमिका व अधिकार (Role)*:
              </label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 border rounded-lg px-3 py-1.5 text-xs font-bold"
              >
                <option value="USER">USER (नमुना नोंदणी व अहवाल पाहणे)</option>
                <option value="ADMIN">ADMIN (मास्टर व्यवस्थापन व पूर्ण नियंत्रण)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">उपकेंद्र (Subcenter):</label>
              <select
                value={userSubcenter}
                onChange={(e) => setUserSubcenter(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                {subcenters.map((sc) => (
                  <option key={sc.id} value={sc.subcenterName}>
                    {sc.subcenterName} ({sc.subcenterCode})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                className="bg-emerald-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
              >
                जतन करा
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
