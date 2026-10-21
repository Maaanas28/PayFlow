import { LogoIcon } from './LogoIcon';
import {
  TrendingUp,
  Briefcase,
  ShieldAlert,
  Cpu,
  ArrowRight,
  Terminal,
  Layers,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { NavTab } from './Header';

interface LandingPageProps {
  onEnterApp: (tab?: NavTab) => void;
  backendOnline: boolean | null;
}

export function LandingPage({ onEnterApp, backendOnline }: LandingPageProps) {
  return (
    <div
      className="min-h-screen bg-[#09090b] text-neutral-300"
      style={{ fontFamily: "'JetBrains Mono', monospace", WebkitFontSmoothing: 'antialiased' }}
    >
      {/* Header */}
      <header className="border-b border-neutral-800/60 sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <LogoIcon className="w-6 h-6" />
              <span className="text-sm font-semibold text-white tracking-tight">payflow</span>
              <span className="hidden sm:inline-block text-[10px] text-neutral-600">v1.0</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 text-[11px] text-neutral-600 mr-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    backendOnline ? 'bg-emerald-500/80 animate-pulse' : 'bg-rose-500/80'
                  }`}
                />
                <span>ENGINE: {backendOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </div>
              <button
                onClick={() => onEnterApp('ledger')}
                className="text-xs text-neutral-400 hover:text-neutral-200 px-3 py-1.5 border border-neutral-800 hover:border-neutral-700 rounded transition-colors cursor-pointer"
              >
                audit ledger
              </button>
              <button
                onClick={() => onEnterApp('checkout')}
                className="text-xs font-medium text-neutral-900 bg-neutral-100 hover:bg-white px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                launch terminal
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <section className="pt-16 sm:pt-24 pb-14">
          <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-4">
            institutional payment gateway infrastructure
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white leading-snug mb-5 max-w-2xl">
            Deterministic payment orchestration &amp;
            <br />
            double-entry ledger architecture.
          </h1>
          <p className="text-sm text-neutral-500 max-w-xl mb-8 leading-relaxed">
            Real-time payment authorization, zero-float integer paise arithmetic,
            replay-safe SHA-256 idempotency locks, pessimistic row-level refund concurrency,
            and cryptographic HMAC-SHA256 webhooks for mission-critical financial applications.
          </p>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onEnterApp('checkout')}
              className="inline-flex items-center px-4 py-2 bg-neutral-100 text-neutral-900 text-xs font-medium rounded hover:bg-white transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 mr-1.5" />
              launch terminal
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
            <button
              onClick={() => onEnterApp('ledger')}
              className="inline-flex items-center px-4 py-2 border border-neutral-800 text-xs font-medium rounded text-neutral-400 hover:text-neutral-300 hover:border-neutral-700 transition-colors cursor-pointer"
            >
              audit ledger
            </button>
            <button
              onClick={() => onEnterApp('refunds')}
              className="inline-flex items-center px-4 py-2 border border-neutral-800 text-xs font-medium rounded text-neutral-400 hover:text-neutral-300 hover:border-neutral-700 transition-colors cursor-pointer"
            >
              refund desk
            </button>
          </div>

          {/* Stats strip */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border border-neutral-800/60 rounded-lg p-4 bg-[#0a0a0c]">
              <div className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2">Paise Arithmetic</div>
              <div className="text-lg font-semibold text-white">Zero Float</div>
              <div className="text-[10px] text-neutral-600 mt-0.5">Strict minor units (₹1 = 100p)</div>
            </div>
            <div className="border border-neutral-800/60 rounded-lg p-4 bg-[#0a0a0c]">
              <div className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2">General Ledger</div>
              <div className="text-lg font-semibold text-white">∑ Dr ≡ ∑ Cr</div>
              <div className="text-[10px] text-neutral-600 mt-0.5">balanced double-entry</div>
            </div>
            <div className="border border-neutral-800/60 rounded-lg p-4 bg-[#0a0a0c]">
              <div className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2">Idempotency</div>
              <div className="text-lg font-semibold text-white">SHA-256</div>
              <div className="text-[10px] text-neutral-600 mt-0.5">atomic replay defense</div>
            </div>
            <div className="border border-neutral-800/60 rounded-lg p-4 bg-[#0a0a0c]">
              <div className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2">Refund Locking</div>
              <div className="text-lg font-semibold text-white">ACID Row Lock</div>
              <div className="text-[10px] text-neutral-600 mt-0.5">FOR UPDATE concurrency</div>
            </div>
          </div>
        </section>

        {/* Core modules */}
        <section className="pb-14">
          <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-5">core platform modules</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Module 1: Deterministic Simulator */}
            <div
              onClick={() => onEnterApp('checkout')}
              className="border border-neutral-800/60 rounded-lg p-5 bg-[#0a0a0c] hover:border-neutral-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-500/80" />
                <h3 className="text-xs font-medium text-white">Deterministic Checkout Desk</h3>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed mb-3">
                Deterministic payment authorization simulator. Test SUCCESS, DECLINE, and network TIMEOUT scenarios with strict integer paise math.
              </p>
              <ul className="space-y-1.5 text-[11px] text-neutral-500">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-neutral-700 shrink-0" />
                  <span>Integer paise currency rounding</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-neutral-700 shrink-0" />
                  <span>State machine lifecycle tracking</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-neutral-700 shrink-0" />
                  <span>Safe inquiry reconciliation for timeouts</span>
                </li>
              </ul>
            </div>

            {/* Module 2: Double-Entry Ledger */}
            <div
              onClick={() => onEnterApp('ledger')}
              className="border border-neutral-800/60 rounded-lg p-5 bg-[#0a0a0c] hover:border-neutral-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-neutral-400" />
                <h3 className="text-xs font-medium text-white">Portfolio Analytics &amp; Ledger</h3>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed mb-3">
                Immutable financial accounting ledger. Each transaction posts balanced debits and credits across user and holding accounts.
              </p>
              <ul className="space-y-1.5 text-[11px] text-neutral-500">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-neutral-700 shrink-0" />
                  <span>Double-entry balanced accounting</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-neutral-700 shrink-0" />
                  <span>Transactional integrity in PostgreSQL</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-neutral-700 shrink-0" />
                  <span>Real-time debit/credit audit trail</span>
                </li>
              </ul>
            </div>

            {/* Module 3: Refund Concurrency */}
            <div
              onClick={() => onEnterApp('refunds')}
              className="border border-neutral-800/60 rounded-lg p-5 bg-[#0a0a0c] hover:border-neutral-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-neutral-400" />
                <h3 className="text-xs font-medium text-white">Refund Concurrency Escrow</h3>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed mb-3">
                Prevent over-refunding and race conditions. PostgreSQL row-level locks (FOR UPDATE) guarantee sequential balance deductions.
              </p>
              <ul className="space-y-1.5 text-[11px] text-neutral-500">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-neutral-700 shrink-0" />
                  <span>Multi-attempt partial refund balance</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-neutral-700 shrink-0" />
                  <span>Balanced ledger reversal entries</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-neutral-700 shrink-0" />
                  <span>Pessimistic concurrency isolation</span>
                </li>
              </ul>
            </div>

            {/* Module 4: Webhook Outbox */}
            <div
              onClick={() => onEnterApp('webhooks')}
              className="border border-neutral-800/60 rounded-lg p-5 bg-[#0a0a0c] hover:border-neutral-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4 text-neutral-400" />
                <h3 className="text-xs font-medium text-white">Cryptographic Webhook Outbox</h3>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed mb-3">
                Transactional outbox pattern with HMAC-SHA256 signatures. Guaranteed at-least-once delivery with exponential backoff retries.
              </p>
              <ul className="space-y-1.5 text-[11px] text-neutral-500">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-neutral-700 shrink-0" />
                  <span>X-PayFlow-Signature header signing</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-neutral-700 shrink-0" />
                  <span>Constant-time timing attack defense</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-neutral-700 shrink-0" />
                  <span>Interactive test payload delivery</span>
                </li>
              </ul>
            </div>

            {/* Module 5: Idempotency Keys */}
            <div
              onClick={() => onEnterApp('transactions')}
              className="border border-neutral-800/60 rounded-lg p-5 bg-[#0a0a0c] hover:border-neutral-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-neutral-400" />
                <h3 className="text-xs font-medium text-white">Idempotency Execution Guard</h3>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed mb-3">
                Every payment attempt is guarded by a client Idempotency-Key and SHA-256 payload hash, preventing duplicate charges.
              </p>
              <ul className="space-y-1.5 text-[11px] text-neutral-500">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-neutral-700 shrink-0" />
                  <span>Cached response replay on retry</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-neutral-700 shrink-0" />
                  <span>Payload mutation conflict detection</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-neutral-700 shrink-0" />
                  <span>Concurrent race-condition protection</span>
                </li>
              </ul>
            </div>

            {/* Module 6: Institutional Terminal UI */}
            <div
              onClick={() => onEnterApp('checkout')}
              className="border border-neutral-800/60 rounded-lg p-5 bg-[#0a0a0c] hover:border-neutral-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-neutral-400" />
                <h3 className="text-xs font-medium text-white">System Design &amp; Terminal UX</h3>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed mb-3">
                Low-latency dark terminal interface tailored for financial engineering desks. Collapsible sidebar and global hotkeys.
              </p>
              <ul className="space-y-1.5 text-[11px] text-neutral-500">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-neutral-700 shrink-0" />
                  <span>Global Ctrl + K audit lookup</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-neutral-700 shrink-0" />
                  <span>Pure Node.js + React architecture</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-neutral-700 shrink-0" />
                  <span>68 automated vitest test suites</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data transparency banner */}
        <section className="pb-20">
          <div className="border border-neutral-800/60 rounded-lg p-5 bg-[#0a0a0c]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-medium text-white mb-1">Data Transparency Standard</h3>
                  <p className="text-[11px] text-neutral-600 leading-relaxed max-w-2xl">
                    PayFlow demarcates data provenance across all telemetry panels:&nbsp;
                    <span className="text-emerald-500/80">LIVE</span> (PostgreSQL persistent ledger),&nbsp;
                    <span className="text-neutral-400">IDEMPOTENT</span> (SHA-256 cached replay), and&nbsp;
                    <span className="text-neutral-500">SIMULATED</span> (sandbox mock gateway). Floating-point arithmetic is strictly prohibited.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onEnterApp('checkout')}
                className="shrink-0 inline-flex items-center px-4 py-2 border border-neutral-800 text-xs font-medium rounded text-neutral-400 hover:text-neutral-300 hover:border-neutral-700 transition-colors cursor-pointer"
              >
                access gateway
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/40 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-neutral-700">
          <span>payflow &copy; 2026</span>
          <div className="flex items-center gap-4">
            <span>engine: node.js / express</span>
            <span>storage: postgresql / prisma</span>
            <span>tests: 68 passing</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
