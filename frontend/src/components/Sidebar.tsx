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
  Activity,
} from 'lucide-react';
import { NavTab } from './Header';
import { LogoIcon } from './LogoIcon';

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
      className={`fixed md:static inset-y-0 left-0 z-40 bg-black border-r border-neutral-900 flex flex-col h-full transition-all duration-200 ease-in-out select-none ${
        isMobile ? 'w-64' : isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center px-4 border-b border-neutral-900 justify-between">
        <div
          onClick={onGoToLanding}
          className={`flex items-center gap-2.5 overflow-hidden ${
            onGoToLanding ? 'cursor-pointer group' : ''
          }`}
          title={onGoToLanding ? 'Return to Landing Page' : undefined}
        >
          <LogoIcon className="w-6 h-6 shrink-0" />
          {(!isCollapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="font-mono font-bold text-sm tracking-wider text-white flex items-center gap-1.5 group-hover:text-neutral-300 transition-colors">
                PAYFLOW <span className="text-neutral-400 text-xs px-1 py-0.2 rounded bg-neutral-900 border border-neutral-800">SANDBOX</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-mono">
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
            className="hidden md:flex p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-mono transition-all duration-150 group relative cursor-pointer text-left ${
                isActive
                  ? 'bg-neutral-900 text-white font-bold border-l-2 border-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-950'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
              {(!isCollapsed || isMobile) && (
                <span className="flex-1 truncate tracking-wide">{item.label}</span>
              )}
              {(!isCollapsed || isMobile) && item.badge && (
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                  isActive
                    ? 'bg-neutral-800 text-white border-neutral-700'
                    : 'bg-black text-neutral-500 border-neutral-850'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Audit Tooling & Bottom Status */}
      <div className="p-2 border-t border-neutral-900 space-y-2">
        <button
          onClick={onOpenLookup}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-mono text-neutral-300 hover:text-white hover:bg-neutral-900 border border-neutral-850 transition-colors cursor-pointer"
        >
          <Terminal className="w-4 h-4 text-neutral-400 shrink-0" />
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center justify-between flex-1">
              <span>Audit Terminal</span>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 rounded">
                Ctrl K
              </kbd>
            </div>
          )}
        </button>

        {(!isCollapsed || isMobile) && (
          <div className="px-2 py-2 rounded bg-black border border-neutral-900 text-[10px] font-mono flex items-center justify-between">
            <span className="text-neutral-500 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-neutral-400" />
              <span>CORE GATEWAY</span>
            </span>
            <span className={`inline-flex items-center gap-1 font-bold ${
              backendOnline ? 'text-white' : backendOnline === false ? 'text-neutral-500' : 'text-neutral-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                backendOnline ? 'bg-white animate-pulse' : 'bg-neutral-600'
              }`} />
              {backendOnline ? 'ONLINE' : backendOnline === false ? 'OFFLINE' : 'CHECKING'}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
