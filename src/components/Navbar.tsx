import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import {
  Activity,
  ClipboardList,
  FileText,
  FileCheck,
  Table,
  BarChart3,
  Calendar,
  Settings,
  ShieldAlert,
  UserCheck,
  LogOut,
  ChevronDown,
  Building2,
  Database,
  Menu,
  X,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  HeartPulse,
} from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { clientStore } from '../services/clientStore';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  users,
  onSwitchUser,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(clientStore.getPendingSyncCount());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = clientStore.subscribe(() => {
      setPendingSyncCount(clientStore.getPendingSyncCount());
    });
    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await clientStore.processSyncQueue();
    } finally {
      setIsSyncing(false);
      setPendingSyncCount(clientStore.getPendingSyncCount());
    }
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'डॅशबोर्ड',
      subLabel: 'Dashboard',
      icon: <Activity className="w-4 h-4" />,
      adminOnly: false,
    },
    {
      id: 'sample-entry',
      label: 'नमुना नोंदणी',
      subLabel: 'New Sample',
      icon: <ClipboardList className="w-4 h-4" />,
      adminOnly: false,
      highlight: true,
    },
    {
      id: 'sending-letters',
      label: 'जावक पत्रे व स्टिकर्स',
      subLabel: 'Sending Letters',
      icon: <FileText className="w-4 h-4" />,
      adminOnly: false,
    },
    {
      id: 'dengue-docs',
      label: 'डेंग्यू दस्तऐवजीकरण',
      subLabel: 'NIV & GMC Latur',
      icon: <HeartPulse className="w-4 h-4 text-rose-500" />,
      adminOnly: false,
    },
    {
      id: 'report-update',
      label: 'अहवाल नोंदणी',
      subLabel: 'Report Update',
      icon: <FileCheck className="w-4 h-4" />,
      adminOnly: false,
    },
    {
      id: 'master-register',
      label: 'मास्टर नोंदवही',
      subLabel: 'Master Register',
      icon: <Table className="w-4 h-4" />,
      adminOnly: false,
    },
    {
      id: 'monthly-report',
      label: 'मासिक नमुना अहवाल',
      subLabel: 'Monthly Report',
      icon: <Calendar className="w-4 h-4" />,
      adminOnly: false,
    },
    {
      id: 'reports',
      label: 'अहवाल व आकडेवारी',
      subLabel: 'Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      adminOnly: false,
    },
    {
      id: 'master-admin',
      label: 'मास्टर व्यवस्थापन',
      subLabel: 'Master Admin',
      icon: <Settings className="w-4 h-4" />,
      adminOnly: true,
    },
    {
      id: 'audit-log',
      label: 'ऑडिट लॉग',
      subLabel: 'Audit Trail',
      icon: <ShieldAlert className="w-4 h-4" />,
      adminOnly: true,
    },
  ];

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || currentUser.role === 'ADMIN');

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm print:hidden">
      {/* Top Government Ribbon */}
      <div className="bg-slate-900 text-slate-100 text-xs px-3 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
          <span className="font-semibold text-emerald-300">महाराष्ट्र शासन - सार्वजनिक आरोग्य विभाग</span>
          <span className="text-slate-400 hidden md:inline">|</span>
          <span className="text-slate-300 hidden md:inline">प्राथमिक आरोग्य केंद्र भादा, ता. औसा, जि. लातूर</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>{isSupabaseConfigured ? 'Supabase Cloud Sync' : 'Local Indexed/Storage'}</span>
              {pendingSyncCount > 0 ? (
                <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded text-[10px] font-semibold border border-amber-500/30">
                  {pendingSyncCount} Pending
                </span>
              ) : (
                <span className="text-emerald-400 text-[10px] font-medium flex items-center gap-0.5">
                  ✓ Synced
                </span>
              )}
            </div>

            {pendingSyncCount > 0 && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                title="Sync pending changes now"
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-xs transition-colors border border-slate-700"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium truncate max-w-[120px] sm:max-w-[160px]">{currentUser.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                  currentUser.role === 'ADMIN'
                    ? 'bg-rose-900/80 text-rose-200 border border-rose-700'
                    : 'bg-blue-900/80 text-blue-200 border border-blue-700'
                }`}
              >
                {currentUser.role}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-1 w-72 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">सध्याचा वापरकर्ता (Active Session):</div>
                  <div className="font-bold text-sm text-slate-900">{currentUser.name}</div>
                  <div className="text-xs text-emerald-700 font-medium">{currentUser.designation}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">उपकेंद्र: {currentUser.subcenter || 'प्रा.आ.केंद्र'}</div>
                </div>

                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  वापरकर्ता बदला (Switch User Role):
                </div>

                <div className="max-h-56 overflow-y-auto">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u);
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 text-xs transition-colors ${
                        u.id === currentUser.id ? 'bg-emerald-50 text-emerald-900 font-semibold' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {u.id === currentUser.id && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        </div>
                        <div className="text-[11px] text-slate-500">{u.designation}</div>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          u.role === 'ADMIN'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Brand & Identity */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-white shadow-inner flex-shrink-0">
            <Building2 className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>PHC Bhada Sample Master &amp; Laboratory Reporting System</span>
            </h1>
            <p className="text-xs text-emerald-200/90 hidden sm:block">
              प्राथमिक आरोग्य केंद्र भादा — सर्व नमुना नोंदणी, जावक पत्रे, प्रयोगशाळा अहवाल व मास्टर नोंदवही प्रणाली
            </p>
          </div>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Navigation Tabs */}
      <nav className="hidden lg:flex items-center px-4 bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-thin">
        <div className="max-w-7xl flex space-x-1 py-1">
          {visibleNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-sm ring-1 ring-emerald-900'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                } ${item.highlight && !isActive ? 'border border-emerald-600/40 bg-emerald-50/60 text-emerald-800' : ''}`}
              >
                {item.icon}
                <div className="text-left leading-tight">
                  <div>{item.label}</div>
                  <div className={`text-[10px] font-normal ${isActive ? 'text-emerald-200' : 'text-slate-600'}`}>
                    {item.subLabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-100 border-b border-slate-300 p-2 space-y-1 animate-in slide-in-from-top-2">
          {visibleNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-800 bg-white hover:bg-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <span className={`text-[10px] ${isActive ? 'text-emerald-200' : 'text-slate-600'}`}>
                  {item.subLabel}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
