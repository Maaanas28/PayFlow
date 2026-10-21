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
    <header className="h-14 bg-black border-b border-neutral-900 px-4 flex items-center justify-between gap-4 select-none z-30 sticky top-0 font-mono">
      {/* Mobile Menu Button + Title / Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden text-neutral-400 hover:text-white p-1.5 rounded hover:bg-neutral-900 focus:outline-none cursor-pointer"
            title="Open Mobile Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Global Audit Command Bar */}
        <button
          onClick={onOpenLookup}
          className="w-full flex items-center justify-between bg-neutral-950 hover:bg-neutral-900 border border-neutral-850 hover:border-neutral-700 text-xs font-mono text-neutral-300 pl-3 pr-2.5 py-1.5 rounded transition-all cursor-pointer text-left group"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
            <span className="text-neutral-400 text-[11px] truncate">
              Lookup payment by ID / Reference (e.g. <span className="text-neutral-300">pay_</span> or <span className="text-neutral-300">ref_</span>)...
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-neutral-400 bg-black border border-neutral-800 rounded">
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
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-950 hover:bg-neutral-900 border border-neutral-850 hover:border-neutral-700 text-[10px] font-mono text-neutral-300 transition-colors cursor-pointer"
            title="Return to Landing Page"
          >
            <Home className="w-3.5 h-3.5 text-neutral-400" />
            <span>OVERVIEW</span>
          </button>
        )}

        {/* Currency & Arithmetic Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-950 border border-neutral-850 text-[10px] font-mono text-neutral-300">
          <Coins className="w-3.5 h-3.5 text-neutral-400" />
          <span>INR</span>
          <span className="text-neutral-600">|</span>
          <span className="text-white font-semibold">INTEGER PAISE</span>
        </div>

        {/* Gateway Beacon */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-neutral-950 border border-neutral-850 text-[10px] font-mono">
          <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-white animate-pulse' : 'bg-neutral-600'}`} />
          <span className="text-neutral-500">GATEWAY:</span>
          <span className={`font-semibold ${backendOnline ? 'text-white' : 'text-neutral-500'}`}>
            {backendOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        <div className="h-4 w-[1px] bg-neutral-900 mx-0.5 hidden sm:block" />

        {/* User Profile / Merchant Identity Pill */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 pl-2 hover:bg-neutral-950 border border-transparent hover:border-neutral-850 rounded transition-colors text-left cursor-pointer"
          >
            <div className="w-7 h-7 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white text-xs font-bold font-mono">
              PF
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-white font-mono leading-tight">
                Sandbox Merchant
              </div>
              <div className="text-[10px] font-mono text-neutral-400 leading-tight uppercase">
                TEST DESK
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-black border border-neutral-850 rounded shadow-2xl py-1 z-50 font-mono text-xs">
              <div className="px-3 py-2 border-b border-neutral-900">
                <p className="text-white font-semibold truncate">PayFlow Fintech Desk</p>
                <p className="text-[11px] text-neutral-400 truncate">sandbox@payflow.internal</p>
              </div>
              <div className="px-3 py-2 space-y-1 text-[11px] text-neutral-400 border-b border-neutral-900">
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <span className="text-white font-bold">MOCK_SANDBOX</span>
                </div>
                <div className="flex justify-between">
                  <span>Ledger Invariant:</span>
                  <span className="text-white font-bold">∑ Dr === ∑ Cr</span>
                </div>
                <div className="flex justify-between">
                  <span>Idempotency:</span>
                  <span className="text-neutral-300">SHA-256 Hash</span>
                </div>
              </div>
              <div className="px-2 py-1.5 space-y-1">
                {onGoToLanding && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onGoToLanding();
                    }}
                    className="w-full text-left px-2 py-1.5 text-neutral-300 hover:text-white hover:bg-neutral-900 rounded flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Home className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Return to Landing Page</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenLookup();
                  }}
                  className="w-full text-left px-2 py-1.5 text-white hover:bg-neutral-900 rounded flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 text-neutral-400" />
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
