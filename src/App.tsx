import React, { useState, useEffect } from 'react';
import { User } from './types';
import { clientStore } from './services/clientStore';
import { Navbar } from './components/Navbar';
import { DashboardModule } from './components/DashboardModule';
import { SampleEntryModule } from './components/SampleEntryModule';
import { SendingLetterModule } from './components/SendingLetterModule';
import { ReportUpdateModule } from './components/ReportUpdateModule';
import { MasterRegisterModule } from './components/MasterRegisterModule';
import { AnalyticsModule } from './components/AnalyticsModule';
import { MonthlySampleReportModule } from './components/MonthlySampleReportModule';
import { MasterAdminModule } from './components/MasterAdminModule';
import { AuditLogModule } from './components/AuditLogModule';
import { DengueDocumentationModule } from './components/DengueDocumentationModule';
import { DataMigrationUploadModule } from './components/DataMigrationUploadModule';
import {
  Building2,
  Phone,
  ShieldCheck,
  HeartPulse,
  RefreshCw,
  ArrowLeft,
  Home,
  ChevronRight,
  PlusCircle,
  FileCheck,
  Send,
  ClipboardList,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface NavHistoryEntry {
  tab: string;
  filter?: Record<string, string>;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(clientStore.getCurrentUser());
  const [users, setUsers] = useState<User[]>(clientStore.getUsers());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Navigation stack to support Back button across screens
  const [navHistory, setNavHistory] = useState<NavHistoryEntry[]>([]);

  // Dynamic filter state for navigation jumps
  const [navigationFilter, setNavigationFilter] = useState<{
    sampleTypeId?: string;
    villageId?: string;
    subcenterId?: string;
    sourceId?: string;
    sampleId?: string;
    statusFilter?: string;
    resultFilter?: string;
    fromDate?: string;
    toDate?: string;
    searchQuery?: string;
    initialTab?: string;
  }>({});

  const handleSwitchUser = (user: User) => {
    clientStore.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleNavigate = (tab: string, filter?: Record<string, string>) => {
    // Push current screen to history before navigating away
    setNavHistory((prev) => [...prev, { tab: activeTab, filter: navigationFilter }]);
    if (filter) {
      setNavigationFilter(filter);
    } else {
      setNavigationFilter({});
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (navHistory.length > 0) {
      const prev = navHistory[navHistory.length - 1];
      setNavHistory((prevStack) => prevStack.slice(0, -1));
      setActiveTab(prev.tab);
      setNavigationFilter(prev.filter || {});
    } else {
      setActiveTab('dashboard');
      setNavigationFilter({});
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Human-readable Marathi title for each tab
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'sample-entry':
        return 'नवीन नमुना नोंदणी (New Sample Entry)';
      case 'sending-letters':
        return 'जावक पत्र व स्टिकर्स तयार करा (Sending Letters & Stickers)';
      case 'dengue-docs':
        return 'डेंग्यू / चिकनगुनिया दस्तऐवजीकरण (NIV Pune / GMC Docs)';
      case 'report-update':
        return 'प्रयोगशाळा अहवाल नोंदणी (Lab Report Update)';
      case 'master-register':
        return 'सर्व नमुना मास्टर नोंदवही (Master Sample Register)';
      case 'monthly-report':
        return 'मासिक नमुना अहवाल व जल सुरक्षा संनियंत्रण (Monthly Reports & Plan)';
      case 'reports':
        return 'अहवाल व विश्लेषण (Analytics & Charts)';
      case 'data-migration':
        return 'जुना डेटा व मास्टर आयात (Historical Data Migration)';
      case 'master-admin':
        return 'मास्टर डेटा व्यवस्थापन (Master Administration)';
      case 'audit-log':
        return 'ऑडिट लॉग (System Audit Trail)';
      default:
        return 'मुख्य डॅशबोर्ड (Dashboard)';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans selection:bg-emerald-200">
      {/* Top Government Ribbon & Nav */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setNavHistory((prev) => [...prev, { tab: activeTab, filter: navigationFilter }]);
          setNavigationFilter({});
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5">
        
        {/* ========================================================================= */}
        {/* GLOBAL DEDICATED BACK BUTTON & BREADCRUMB BAR (Shown on all inner screens) */}
        {/* ========================================================================= */}
        {activeTab !== 'dashboard' && (
          <div className="mb-4 bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-3">
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg font-bold text-xs shadow transition-all active:scale-95 cursor-pointer group"
                title="मागील पृष्ठावर परत जा"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
                <span>मागे जा (Back)</span>
              </button>

              {/* Breadcrumb Info */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <button
                  onClick={() => {
                    setNavHistory([]);
                    setNavigationFilter({});
                    setActiveTab('dashboard');
                  }}
                  className="font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>डॅशबोर्ड</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
                  {getTabTitle(activeTab)}
                </span>
              </div>
            </div>

            {/* Quick Action Shortcuts on Header */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              {activeTab !== 'sample-entry' && (
                <button
                  onClick={() => handleNavigate('sample-entry')}
                  className="text-xs bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ नवीन नमुना</span>
                </button>
              )}
              {activeTab !== 'report-update' && (
                <button
                  onClick={() => handleNavigate('report-update')}
                  className="text-xs bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>अहवाल नोंदणी</span>
                </button>
              )}
              <button
                onClick={() => {
                  setNavHistory([]);
                  setNavigationFilter({});
                  setActiveTab('dashboard');
                }}
                className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">मुख्य पान</span>
              </button>
            </div>
          </div>
        )}

        {/* 1. Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardModule onNavigate={handleNavigate} currentUser={currentUser} />
        )}

        {/* 2. Sample Entry Form */}
        {activeTab === 'sample-entry' && (
          <SampleEntryModule
            currentUser={currentUser}
            initialSampleTypeId={navigationFilter.sampleTypeId}
            initialVillageId={navigationFilter.villageId}
            initialSubcenterId={navigationFilter.subcenterId}
            initialSourceId={navigationFilter.sourceId}
            onNavigate={handleNavigate}
            onBack={handleBack}
            onSampleCreated={(sample) => {
              // Option to jump or keep adding
            }}
          />
        )}

        {/* 3. Sending Letters & Bottle Stickers */}
        {activeTab === 'sending-letters' && (
          <SendingLetterModule
            currentUser={currentUser}
            initialFilter={navigationFilter}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        )}

        {/* 3b. Dengue / Chikungunya Documentation (NIV Pune & GMC Latur) */}
        {activeTab === 'dengue-docs' && (
          <DengueDocumentationModule currentUser={currentUser} />
        )}

        {/* 4. Report Update */}
        {activeTab === 'report-update' && (
          <ReportUpdateModule
            currentUser={currentUser}
            initialFilter={navigationFilter}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        )}

        {/* 5. Master Register */}
        {activeTab === 'master-register' && (
          <MasterRegisterModule
            currentUser={currentUser}
            initialFilter={navigationFilter}
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        )}

        {/* 6. Monthly & Progressive Sample Reporting */}
        {activeTab === 'monthly-report' && (
          <MonthlySampleReportModule
            currentUser={currentUser}
            initialTab={(navigationFilter as any)?.initialTab || 'monthly'}
            onNavigateToSampleEntry={(sourceInfo) => {
              handleNavigate('sample-entry', {
                sampleTypeId: sourceInfo.sampleTypeId,
                subcenterId: sourceInfo.subcenterId,
                villageId: sourceInfo.villageId,
                sourceId: sourceInfo.sourceId,
              });
            }}
          />
        )}

        {/* 7. Reports & Analytics */}
        {activeTab === 'reports' && (
          <AnalyticsModule currentUser={currentUser} />
        )}

        {/* 7b. Old Data Upload & Migration Facility */}
        {activeTab === 'data-migration' && (
          <DataMigrationUploadModule
            currentUser={currentUser}
            onNavigate={handleNavigate}
          />
        )}

        {/* 8. Master Administration (Admin Only) */}
        {activeTab === 'master-admin' && (
          <MasterAdminModule currentUser={currentUser} />
        )}

        {/* 9. Audit Log (Admin Only) */}
        {activeTab === 'audit-log' && (
          <AuditLogModule currentUser={currentUser} />
        )}
      </main>

      {/* Official Government Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-100 font-bold mb-1">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              सार्वजनिक आरोग्य विभाग, जिल्हा परिषद लातूर • महाराष्ट्र शासन | शासकीय नमुना नोंदणी व प्रयोगशाळा अहवाल प्रणाली
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              आरोग्य हेल्पलाईन: १०४ / १०८
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              PostgreSQL / RLS Secured
            </span>
            <span>•</span>
            <span>PHC Bhada v3.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
