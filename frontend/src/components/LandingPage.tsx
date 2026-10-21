import { useState, useEffect } from 'react';
import { LogoIcon } from './LogoIcon';
import {
  ArrowRight,
  Terminal,
  BookOpen,
  Lock,
  Server,
  Database,
  Building2,
  Smartphone,
  Play,
  Pause,
  Coins,
} from 'lucide-react';
import { NavTab } from './Header';

interface LandingPageProps {
  onEnterApp: (tab?: NavTab) => void;
  backendOnline: boolean | null;
}

const SINGLE_PAGE_CSS = `
  .cf-root { background: #000; }

  /* Minimal dark sub-pixel grid */
  .terminal-grid {
    background-image:
      linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px);
    background-size: 36px 36px;
    -webkit-mask-image: radial-gradient(ellipse at 50% 40%, #000 40%, transparent 85%);
            mask-image: radial-gradient(ellipse at 50% 40%, #000 40%, transparent 85%);
  }

  /* Animated traveling conduit pulse */
  .animate-pipe-flow {
    stroke-dasharray: 6 6;
    animation: pipe-flow 0.9s linear infinite;
  }
  @keyframes pipe-flow { to { stroke-dashoffset: -24; } }

  .animate-pipe-reverse {
    stroke-dasharray: 6 6;
    animation: pipe-flow 0.9s linear infinite reverse;
  }

  /* Traveling cash note chip */
  @keyframes packet-drift {
    0%   { transform: translateX(0px); opacity: 0; }
    15%  { opacity: 1; }
    85%  { opacity: 1; }
    100% { transform: translateX(100px); opacity: 0; }
  }

  .glow-box {
    transition: border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .glow-box:hover {
    border-color: rgba(255,255,255,0.3);
    box-shadow: 0 0 20px -5px rgba(255,255,255,0.08);
  }

  /* Node active pulse */
  @keyframes node-glow {
    0%, 100% { border-color: rgba(255,255,255,0.4); box-shadow: 0 0 15px -3px rgba(255,255,255,0.12); }
    50%      { border-color: rgba(255,255,255,0.7); box-shadow: 0 0 25px -2px rgba(255,255,255,0.22); }
  }
  .node-pulse {
    animation: node-glow 2.4s ease-in-out infinite;
  }
`;

export function LandingPage({ onEnterApp, backendOnline }: LandingPageProps) {
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [activeStage, setActiveStage] = useState<number>(2);
  const [direction, setDirection] = useState<'forward' | 'reverse'>('forward');

  // Live simulation counters
  const [stats, setStats] = useState({
    transactions: 28410,
    settledRupees: 28381590,
    variance: '0.0000',
  });

  // Cycle system stages continuously for aesthetic motion
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev % 4) + 1);
      setStats((prev) => ({
        transactions: prev.transactions + 1,
        settledRupees: prev.settledRupees + 999,
        variance: '0.0000',
      }));
    }, 2200);
    return () => clearInterval(interval);
  }, [isStreaming]);

  const toggleReverse = () => {
    setDirection((prev) => (prev === 'forward' ? 'reverse' : 'forward'));
    setActiveStage(3);
  };

  return (
    <div
      className="cf-root min-h-screen bg-black text-neutral-300 font-mono flex flex-col justify-between selection:bg-neutral-800 selection:text-white relative overflow-hidden"
      style={{ WebkitFontSmoothing: 'antialiased' }}
    >
      <style>{SINGLE_PAGE_CSS}</style>

      {/* Subtle Terminal Grid Background */}
      <div className="absolute inset-0 terminal-grid opacity-35 pointer-events-none" />

      {/* Top Header */}
      <header className="border-b border-neutral-900 sticky top-0 z-50 bg-black/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <LogoIcon className="w-5 h-5" />
            <span className="text-sm font-bold text-white tracking-wider font-mono">payflow</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 font-mono">
              v1.0
            </span>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-neutral-500 px-2.5 py-1 rounded bg-neutral-950 border border-neutral-900">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  backendOnline ? 'bg-white animate-pulse' : 'bg-neutral-600'
                }`}
              />
              <span>GATEWAY: {backendOnline ? 'ONLINE' : 'STANDBY'}</span>
            </div>

            <button
              onClick={() => onEnterApp('ledger')}
              className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 border border-neutral-850 hover:border-neutral-700 rounded transition-colors cursor-pointer"
            >
              general ledger
            </button>

            <button
              onClick={() => onEnterApp('checkout')}
              className="text-xs font-semibold text-black bg-white hover:bg-neutral-200 px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>launch terminal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Single-Screen Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 flex-1 flex flex-col justify-center py-6 sm:py-8 relative z-10 w-full space-y-8">
        {/* Title & Core Value */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400 uppercase tracking-widest">
            <span className="w-1 h-1 rounded-full bg-white" />
            <span>Deterministic Cash Flow Architecture</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight font-sans">
            Money flows across systems. Without drift.
          </h1>

          <p className="text-xs text-neutral-400 leading-relaxed max-w-xl mx-auto font-mono">
            Zero-float integer paise arithmetic, SHA-256 idempotency locks, and immutable
            double-entry ledger settlement across multi-system architectures.
          </p>
        </div>

        {/* ========================================================
            THE SYSTEM-TO-SYSTEM CASH FLOW TOPOLOGY
        ======================================================== */}
        <div className="border border-neutral-850 rounded-xl p-5 sm:p-7 bg-[#050505] shadow-2xl relative overflow-hidden">
          {/* Canvas Sub-Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-900 gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-bold text-white tracking-wider uppercase">
                Inter-System Cash Transfer Pipeline
              </span>
              <span className="text-[10px] text-neutral-500 font-mono hidden md:inline">
                • ₹999.00 (99,900 paise packet)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsStreaming(!isStreaming)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
                  isStreaming
                    ? 'bg-neutral-900 text-white border border-neutral-700'
                    : 'bg-black text-neutral-500 border border-neutral-850 hover:text-white'
                }`}
              >
                {isStreaming ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isStreaming ? 'STREAMING' : 'PAUSED'}</span>
              </button>

              <button
                type="button"
                onClick={toggleReverse}
                className="px-2.5 py-1 rounded bg-black hover:bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 text-[11px] font-mono transition-all cursor-pointer"
              >
                {direction === 'forward' ? 'Simulate Reversal ⟲' : 'Forward Flow ⟳'}
              </button>
            </div>
          </div>

          {/* System Nodes Mesh */}
          <div className="py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* SYSTEM A: Client Storefront (Origin) */}
              <div className="lg:col-span-3">
                <div
                  className={`p-4 rounded-lg border transition-all glow-box ${
                    activeStage === 1
                      ? 'border-white bg-[#0a0a0a] node-pulse text-white'
                      : 'border-neutral-850 bg-black text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="text-[10px] uppercase font-bold text-neutral-400">System A</span>
                    </div>
                    <span className="text-[9px] px-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                      ORIGIN
                    </span>
                  </div>

                  <div className="text-xs font-bold text-white">Client Storefront</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Order ord_9901 &bull; User Session</div>

                  <div className="mt-2.5 pt-2 border-t border-neutral-900 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Authorized:</span>
                      <span className="text-white font-bold tabular-nums">₹999.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Unit:</span>
                      <span className="text-neutral-300 font-mono">99,900 paise</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONDUIT 1: Animated Pipe with Cash Note */}
              <div className="lg:col-span-2 hidden lg:flex flex-col items-center justify-center relative py-2">
                <svg className="w-full h-8 overflow-visible" viewBox="0 0 140 32">
                  <line
                    x1="0"
                    y1="16"
                    x2="140"
                    y2="16"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeOpacity={activeStage >= 1 ? 0.75 : 0.2}
                    className={direction === 'reverse' ? 'animate-pipe-reverse' : 'animate-pipe-flow'}
                  />
                  {/* Traveling Cash Packet */}
                  <circle r="3.5" fill="#ffffff">
                    <animateMotion
                      dur="1.4s"
                      repeatCount="indefinite"
                      path={direction === 'reverse' ? 'M 140 16 L 0 16' : 'M 0 16 L 140 16'}
                    />
                  </circle>
                </svg>

                <div className="absolute px-2 py-0.5 rounded bg-black border border-neutral-700 text-[9px] text-neutral-300 font-bold shadow-sm flex items-center gap-1">
                  <span>₹999</span>
                  <span className="text-[8px] text-neutral-500">&rarr;</span>
                </div>
              </div>

              {/* SYSTEM B: PayFlow Gateway Core (Router) */}
              <div className="lg:col-span-3">
                <div
                  className={`p-4 rounded-lg border transition-all glow-box ${
                    activeStage === 2
                      ? 'border-white bg-[#0a0a0a] node-pulse text-white'
                      : 'border-neutral-850 bg-black text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="text-[10px] uppercase font-bold text-neutral-400">System B</span>
                    </div>
                    <span className="text-[9px] px-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                      GATEWAY
                    </span>
                  </div>

                  <div className="text-xs font-bold text-white">PayFlow Core Engine</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Idempotency &bull; State Machine</div>

                  <div className="mt-2.5 pt-2 border-t border-neutral-900 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">SHA-256 Key:</span>
                      <span className="text-neutral-300 font-mono truncate max-w-[90px]">req_89f02c...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">State:</span>
                      <span className="text-white font-bold">SUCCEEDED</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONDUIT 2: Dual Split Pipe */}
              <div className="lg:col-span-1 hidden lg:flex flex-col items-center justify-center relative py-2">
                <svg className="w-full h-28 overflow-visible" viewBox="0 0 60 112">
                  {/* Top Branch */}
                  <path
                    d="M 0 56 L 30 56 L 30 18 L 60 18"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.75"
                    strokeOpacity={activeStage >= 3 ? 0.75 : 0.2}
                    className="animate-pipe-flow"
                  />
                  {/* Bottom Branch */}
                  <path
                    d="M 0 56 L 30 56 L 30 94 L 60 94"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.75"
                    strokeOpacity={activeStage >= 3 ? 0.75 : 0.2}
                    className="animate-pipe-flow"
                  />
                  <circle r="3" fill="#ffffff">
                    <animateMotion dur="1.2s" repeatCount="indefinite" path="M 0 56 L 30 56 L 30 18 L 60 18" />
                  </circle>
                  <circle r="3" fill="#ffffff">
                    <animateMotion dur="1.2s" repeatCount="indefinite" path="M 0 56 L 30 56 L 30 94 L 60 94" />
                  </circle>
                </svg>
              </div>

              {/* SYSTEMS C & D: Double-Entry Destinations */}
              <div className="lg:col-span-3 space-y-2.5">
                {/* System C: PostgreSQL Ledger (Debit) */}
                <div
                  className={`p-3 rounded-lg border transition-all glow-box ${
                    activeStage === 3
                      ? 'border-white bg-[#0a0a0a] node-pulse'
                      : 'border-neutral-850 bg-black'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Database className="w-3 h-3 text-neutral-400" />
                      <span className="text-[10px] font-bold text-white">System C: Postgres Ledger</span>
                    </div>
                    <span className="text-[8px] font-mono text-neutral-300 bg-neutral-900 border border-neutral-800 px-1 rounded">
                      DEBIT (DR)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-neutral-500">Asset Clearing:</span>
                    <span className="font-bold text-white tabular-nums">+₹999.00</span>
                  </div>
                </div>

                {/* System D: Merchant Settlement Escrow (Credit) */}
                <div
                  className={`p-3 rounded-lg border transition-all glow-box ${
                    activeStage === 4
                      ? 'border-white bg-[#0a0a0a] node-pulse'
                      : 'border-neutral-850 bg-black'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-neutral-400" />
                      <span className="text-[10px] font-bold text-white">System D: Merchant Escrow</span>
                    </div>
                    <span className="text-[8px] font-mono text-neutral-300 bg-neutral-900 border border-neutral-800 px-1 rounded">
                      CREDIT (CR)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-neutral-500">Settled Reserve:</span>
                    <span className="font-bold text-white tabular-nums">+₹999.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry Footnote */}
          <div className="pt-3 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-[10px] text-neutral-500 gap-2">
            <div className="flex items-center gap-3">
              <span>Invariant: <strong className="text-white">∑ Dr ≡ ∑ Cr</strong></span>
              <span>&bull;</span>
              <span>Variance: <strong className="text-white">₹{stats.variance}</strong></span>
              <span>&bull;</span>
              <span>Lock: <strong className="text-neutral-300">FOR UPDATE (ACID)</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <span>Settled Volume: <strong className="text-white">₹{stats.settledRupees.toLocaleString('en-IN')}</strong></span>
              <span>&bull;</span>
              <span>Transactions: <strong className="text-white">{stats.transactions.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        {/* 3 Core Architecture Points (Compact, 1 Row) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg border border-neutral-900 bg-[#050505] space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Coins className="w-3.5 h-3.5 text-neutral-400" />
              <span>Strict Integer Paise</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed font-mono">
              Zero floating-point numbers. All currency operations are calculated in integer paise.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-neutral-900 bg-[#050505] space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>SHA-256 Idempotency</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed font-mono">
              Atomic request locks ensure network retries never double-charge customer accounts.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-neutral-900 bg-[#050505] space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
              <span>Double-Entry Balance</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed font-mono">
              Every captured payment and refund balance is posted transactionally into PostgreSQL.
            </p>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-neutral-900 py-3.5 bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-neutral-600 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-bold">payflow</span>
            <span>&copy; 2026 Core Gateway Architecture</span>
          </div>
          <div className="flex items-center gap-4">
            <span>engine: node.js / express</span>
            <span>storage: postgresql / prisma</span>
            <span>tests: 68 passing</span>
            <button
              onClick={() => onEnterApp('checkout')}
              className="text-white hover:underline cursor-pointer"
            >
              enter terminal &rarr;
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
