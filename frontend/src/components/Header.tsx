import React, { useState } from 'react';
import {
  Search,
  Terminal,
  ChevronDown,
  Menu,
  Coins,
  Home,
} from 'lucide-react';

export type NavTab = 'checkout' | 'transactions' | 'refunds' | 'ledger' | 'webhooks';

interface HeaderProps {
  backendOnline: boolean | null;
  onOpenLookup: () => void;
  onToggleMobileMenu?: () => void;
  onGoToLanding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  backendOnline,
  onOpenLookup,
  onToggleMobileMenu,
  onGoToLanding,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-14 bg-[#0c1017] border-b border-[#182030] px-4 flex items-center justify-between gap-4 select-none z-30 sticky top-0">
      {/* Mobile Menu Button + Title / Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden text-slate-400 hover:text-white p-1.5 rounded hover:bg-[#121824] focus:outline-none cursor-pointer"
            title="Open Mobile Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Global Audit Command Bar */}
        <button
          onClick={onOpenLookup}
          className="w-full flex items-center justify-between bg-[#101520] hover:bg-[#151c2a] border border-[#182030] hover:border-[#222d42] text-xs font-mono text-slate-300 pl-3 pr-2.5 py-1.5 rounded-sm transition-all cursor-pointer text-left group"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            <span className="text-slate-400 text-[11px] truncate">
              Lookup payment by ID / Reference (e.g. <span className="text-slate-300">pay_</span> or <span className="text-slate-300">ref_</span>)...
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-[#141b28] border border-[#202c40] rounded-sm">
              Ctrl K
            </kbd>
          </div>
        </button>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* Overview Landing Page Link */}
        {onGoToLanding && (
          <button
            onClick={onGoToLanding}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#0d131f] hover:bg-[#151c2a] border border-[#1b253b] hover:border-[#222d42] text-[10px] font-mono text-slate-300 transition-colors cursor-pointer"
            title="Return to Landing Page"
          >
            <Home className="w-3.5 h-3.5 text-cyan-400" />
            <span>OVERVIEW</span>
          </button>
        )}

        {/* Currency & Arithmetic Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#0d131f] border border-[#1b253b] text-[10px] font-mono text-slate-300">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span>INR</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400 font-semibold">INTEGER PAISE</span>
        </div>

        {/* Gateway Beacon */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-sm bg-[#0d131f] border border-[#1b253b] text-[10px] font-mono">
          <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          <span className="text-slate-400">ENGINE:</span>
          <span className={`font-bold ${backendOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
            {backendOnline ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>

        <div className="h-5 w-[1px] bg-[#182030] mx-0.5 hidden sm:block" />

        {/* User Profile / Merchant Identity Pill */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 pl-2 hover:bg-[#121824] border border-transparent hover:border-[#182030] rounded-sm transition-colors text-left cursor-pointer"
          >
            <div className="w-7 h-7 rounded-sm bg-[#141d2d] border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs font-bold font-mono">
              PF
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-slate-200 font-mono leading-tight">
                Sandbox Merchant
              </div>
              <div className="text-[10px] font-mono text-cyan-400 leading-tight uppercase">
                TEST DESK
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-[#101520] border border-[#182030] rounded-sm shadow-2xl py-1 z-50 font-mono text-xs">
              <div className="px-3 py-2 border-b border-[#182030]">
                <p className="text-slate-200 font-semibold truncate">PayFlow Fintech Desk</p>
                <p className="text-[11px] text-slate-400 truncate">sandbox@payflow.internal</p>
              </div>
              <div className="px-3 py-2 space-y-1 text-[11px] text-slate-400 border-b border-[#182030]">
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <span className="text-emerald-400 font-bold">MOCK_SANDBOX</span>
                </div>
                <div className="flex justify-between">
                  <span>Ledger Invariant:</span>
                  <span className="text-cyan-400 font-bold">∑ Debits === ∑ Credits</span>
                </div>
                <div className="flex justify-between">
                  <span>Idempotency:</span>
                  <span className="text-slate-200">SHA-256 Request Hash</span>
                </div>
              </div>
              <div className="px-2 py-1.5 space-y-1">
                {onGoToLanding && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onGoToLanding();
                    }}
                    className="w-full text-left px-2 py-1.5 text-slate-300 hover:text-white hover:bg-[#162032] rounded-sm flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Home className="w-3.5 h-3.5 text-slate-400" />
                    <span>Return to Landing Page</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenLookup();
                  }}
                  className="w-full text-left px-2 py-1.5 text-cyan-400 hover:bg-[#162032] rounded-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Open Audit Terminal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
