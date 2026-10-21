import React from 'react';
import {
  CreditCard,
  ArrowLeftRight,
  RotateCcw,
  BookOpen,
  Webhook,
  Terminal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { NavTab } from './Header';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile: boolean;
  onCloseMobile: () => void;
  backendOnline: boolean | null;
  onOpenLookup: () => void;
  onGoToLanding?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  isMobile,
  onCloseMobile,
  backendOnline,
  onOpenLookup,
  onGoToLanding,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'checkout', label: 'Checkout Terminal', icon: CreditCard, badge: '99900' },
    { id: 'transactions', label: 'Transactions Desk', icon: ArrowLeftRight, badge: 'IDEM' },
    { id: 'refunds', label: 'Refunds Matrix', icon: RotateCcw, badge: 'LOCK' },
    { id: 'ledger', label: 'Double-Entry Journal', icon: BookOpen, badge: 'BALANCED' },
    { id: 'webhooks', label: 'Webhook Outbox', icon: Webhook, badge: 'HMAC' },
  ];

  const handleSelect = (tab: NavTab) => {
    onTabChange(tab);
    if (isMobile) onCloseMobile();
  };

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-40 bg-[#0c1017] border-r border-[#182030] flex flex-col h-full transition-all duration-200 ease-in-out select-none ${
        isMobile ? 'w-64' : isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center px-4 border-b border-[#182030] justify-between">
        <div
          onClick={onGoToLanding}
          className={`flex items-center gap-2.5 overflow-hidden ${
            onGoToLanding ? 'cursor-pointer group' : ''
          }`}
          title={onGoToLanding ? 'Return to Landing Page' : undefined}
        >
          <div className="w-8 h-8 rounded-sm bg-[#141d2d] border border-cyan-500/30 group-hover:border-cyan-400 flex items-center justify-center shrink-0 shadow-sm shadow-cyan-500/20 transition-colors">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="font-mono font-bold text-sm tracking-wider text-white flex items-center gap-1.5 group-hover:text-cyan-300 transition-colors">
                PAYFLOW <span className="text-cyan-400 text-xs px-1 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/40">SANDBOX</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-mono">
                INSTITUTIONAL v1.0
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="hidden md:flex p-1 rounded text-slate-400 hover:text-white hover:bg-[#121824] transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-mono transition-all duration-150 group relative cursor-pointer text-left ${
                isActive
                  ? 'bg-[#141d2d] text-white font-bold border-l-2 border-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#101622]'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              {(!isCollapsed || isMobile) && (
                <span className="flex-1 truncate tracking-wide">{item.label}</span>
              )}
              {(!isCollapsed || isMobile) && item.badge && (
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm border ${
                  isActive
                    ? 'bg-[#092218] text-emerald-400 border-emerald-800/50'
                    : 'bg-[#121926] text-slate-400 border-[#1c273a]'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Audit Tooling & Bottom Status */}
      <div className="p-2 border-t border-[#182030] space-y-2">
        <button
          onClick={onOpenLookup}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-sm text-xs font-mono text-slate-300 hover:text-white hover:bg-[#121824] border border-[#1b253b] transition-colors cursor-pointer"
        >
          <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center justify-between flex-1">
              <span>Audit Terminal</span>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-[#162032] border border-[#233148] rounded-sm">
                Ctrl K
              </kbd>
            </div>
          )}
        </button>

        {(!isCollapsed || isMobile) && (
          <div className="px-2 py-2 rounded-sm bg-[#090d14] border border-[#141a26] text-[10px] font-mono flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-slate-400" />
              <span>CORE GATEWAY</span>
            </span>
            <span className={`inline-flex items-center gap-1 font-bold ${
              backendOnline ? 'text-emerald-400' : backendOnline === false ? 'text-rose-400' : 'text-amber-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                backendOnline ? 'bg-emerald-400 animate-pulse' : backendOnline === false ? 'bg-rose-400' : 'bg-amber-400'
              }`} />
              {backendOnline ? 'ONLINE' : backendOnline === false ? 'OFFLINE' : 'CHECKING'}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
