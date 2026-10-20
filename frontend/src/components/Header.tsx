import React, { useState } from 'react';
import {
  ShieldCheck,
  Terminal,
  CreditCard,
  ArrowLeftRight,
  RotateCcw,
  BookOpen,
  Webhook,
  Menu,
  X,
} from 'lucide-react';

export type NavTab = 'checkout' | 'transactions' | 'refunds' | 'ledger' | 'webhooks';

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  backendOnline: boolean | null;
  onOpenLookup: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  backendOnline,
  onOpenLookup,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'checkout', label: 'Checkout', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'transactions', label: 'Transactions', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { id: 'refunds', label: 'Refunds', icon: <RotateCcw className="w-4 h-4" /> },
    { id: 'ledger', label: 'Ledger', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'webhooks', label: 'Webhooks', icon: <Webhook className="w-4 h-4" /> },
  ];

  const handleSelectTab = (tab: NavTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Logo & Platform Info */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleSelectTab('checkout')}
              className="flex items-center space-x-3 text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                    PayFlow
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Fintech Sandbox
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <span className={isActive ? 'text-teal-400' : 'text-slate-500'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Lookup & Connection Status */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={onOpenLookup}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all cursor-pointer"
              title="Search payment by ID or Reference"
            >
              <Terminal className="w-3.5 h-3.5 text-teal-400" />
              <span>Audit</span>
            </button>

            {/* Health Status Pill */}
            <div className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <span className="relative flex h-2 w-2">
                {backendOnline === true && (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                )}
                {backendOnline === false && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                )}
                {backendOnline === null && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                )}
              </span>
              <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                {backendOnline === true ? (
                  <span className="text-emerald-400 font-medium">PostgreSQL Live</span>
                ) : backendOnline === false ? (
                  <span className="text-rose-400 font-medium">Offline</span>
                ) : (
                  'Checking...'
                )}
              </span>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/80 bg-slate-950 px-4 pt-3 pb-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span className={isActive ? 'text-teal-400' : 'text-slate-500'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-900">
            <button
              onClick={() => {
                onOpenLookup();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-900"
            >
              <Terminal className="w-4 h-4 text-teal-400" />
              <span>Audit Payment Lookup</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
