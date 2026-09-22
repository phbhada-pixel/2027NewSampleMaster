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
import { Building2, Phone, ShieldCheck, HeartPulse, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(clientStore.getCurrentUser());
  const [users, setUsers] = useState<User[]>(clientStore.getUsers());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Dynamic filter state for navigation jumps
  const [navigationFilter, setNavigationFilter] = useState<{
    sampleTypeId?: string;
    villageId?: string;
  }>({});

  const handleSwitchUser = (user: User) => {
    clientStore.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleNavigate = (tab: string, filter?: Record<string, string>) => {
    if (filter) {
      setNavigationFilter(filter);
    } else {
      setNavigationFilter({});
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans selection:bg-emerald-200">
      {/* Top Government Ribbon & Nav */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setNavigationFilter({});
          setActiveTab(tab);
        }}
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5">
        {/* 1. Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardModule onNavigate={handleNavigate} currentUser={currentUser} />
        )}

        {/* 2. Sample Entry Form */}
        {activeTab === 'sample-entry' && (
          <SampleEntryModule
            currentUser={currentUser}
            initialSampleTypeId={navigationFilter.sampleTypeId}
            onNavigate={handleNavigate}
            onSampleCreated={(sample) => {
              // Option to jump or keep adding
            }}
          />
        )}

        {/* 3. Sending Letters & Bottle Stickers */}
        {activeTab === 'sending-letters' && (
          <SendingLetterModule currentUser={currentUser} />
        )}

        {/* 3b. Dengue / Chikungunya Documentation (NIV Pune & GMC Latur) */}
        {activeTab === 'dengue-docs' && (
          <DengueDocumentationModule currentUser={currentUser} />
        )}

        {/* 4. Report Update */}
        {activeTab === 'report-update' && (
          <ReportUpdateModule currentUser={currentUser} />
        )}

        {/* 5. Master Register */}
        {activeTab === 'master-register' && (
          <MasterRegisterModule
            currentUser={currentUser}
            initialFilter={navigationFilter}
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
