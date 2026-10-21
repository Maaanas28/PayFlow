import { useState, useEffect } from 'react';
import { LogoIcon } from './LogoIcon';
import {
  ArrowRight,
  Terminal,
  ShieldCheck,
  RotateCcw,
  BookOpen,
  Lock,
  Copy,
  Check,
  Zap,
  Code2,
  Coins,
  Cpu,
} from 'lucide-react';
import { NavTab } from './Header';

interface LandingPageProps {
  onEnterApp: (tab?: NavTab) => void;
  backendOnline: boolean | null;
}

type FlowMode = 'idle' | 'charging' | 'settled' | 'refunding' | 'refunded' | 'idempotent';

export function LandingPage({ onEnterApp, backendOnline }: LandingPageProps) {
  // Cash Flow Simulator Interactive State
  const [flowMode, setFlowMode] = useState<FlowMode>('idle');
  const [flowStep, setFlowStep] = useState<number>(0);
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'sdk' | 'webhook'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);

  // Live simulation counter for visual dynamism
  const [liveCounter, setLiveCounter] = useState({
    transactions: 14820,
    volumeMinor: 1480518000,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveCounter((prev) => ({
        transactions: prev.transactions + 1,
        volumeMinor: prev.volumeMinor + 99900,
      }));
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Trigger cash flow sequence animation
  const triggerFlow = (mode: 'charge' | 'refund' | 'idempotent') => {
    if (mode === 'charge') {
      setFlowMode('charging');
      setFlowStep(1);
      setTimeout(() => setFlowStep(2), 700);
      setTimeout(() => setFlowStep(3), 1500);
      setTimeout(() => {
        setFlowStep(4);
        setFlowMode('settled');
      }, 2300);
    } else if (mode === 'refund') {
      setFlowMode('refunding');
      setFlowStep(1);
      setTimeout(() => setFlowStep(2), 800);
      setTimeout(() => {
        setFlowStep(3);
        setFlowMode('refunded');
      }, 1800);
    } else {
      setFlowMode('idempotent');
      setFlowStep(1);
      setTimeout(() => setFlowStep(2), 700);
      setTimeout(() => {
        setFlowStep(3);
        setFlowMode('settled');
      }, 1500);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const curlSnippet = `curl -X POST https://payflow.internal/api/v1/payments \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: pay_req_89f02c91a4b" \\
  -d '{
    "orderId": "ord_990184",
    "amountMinor": 99900,
    "currency": "INR",
    "simulatedOutcome": "SUCCESS"
  }'`;

  const sdkSnippet = `import { PayFlowClient } from '@payflow/node';

const client = new PayFlowClient({ secretKey: process.env.PAYFLOW_SECRET });

// Guaranteed zero float calculation (Paise integers)
const payment = await client.payments.create({
  orderId: 'ord_990184',
  amountMinor: 99900, // ₹999.00
  currency: 'INR',
  idempotencyKey: 'idemp_key_' + crypto.randomUUID(),
});

console.log(payment.status); // 'SUCCEEDED'`;

  const webhookSnippet = `// HMAC-SHA256 Constant-Time Signature Verification
import crypto from 'crypto';

function verifyPayflowWebhook(payload: string, headerSig: string, secret: string) {
  const [tPart, v1Part] = headerSig.split(',');
  const timestamp = tPart.split('=')[1];
  const signature = v1Part.split('=')[1];

  const expected = crypto
    .createHmac('sha256', secret)
    .update(\`\${timestamp}.\${payload}\`)
    .digest('hex');

  // Defense against timing attacks
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}`;

  return (
    <div
      className="min-h-screen bg-[#080a0f] text-neutral-300 font-mono relative overflow-hidden selection:bg-cyan-500/20 selection:text-cyan-300"
      style={{ WebkitFontSmoothing: 'antialiased' }}
    >
      {/* Background Subtle Gradient Grid */}
      <div className="absolute inset-0 terminal-grid opacity-40 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Institutional Header */}
      <header className="border-b border-neutral-800/60 sticky top-0 z-50 bg-[#080a0f]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoIcon className="w-6 h-6" />
            <span className="text-sm font-bold text-white tracking-wider font-mono">payflow</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono">
              v1.0 SANDBOX
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Gateway Telemetry Beacon */}
            <div className="hidden md:flex items-center gap-2 text-[11px] text-neutral-400 px-2.5 py-1 rounded bg-[#0c1017] border border-neutral-800/80">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span className="text-neutral-500">GATEWAY:</span>
              <span className={`font-semibold ${backendOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                {backendOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            {/* Quick Desk Navigation Links */}
            <button
              onClick={() => onEnterApp('ledger')}
              className="hidden sm:inline-flex text-xs text-neutral-400 hover:text-neutral-200 px-3 py-1.5 border border-neutral-800 hover:border-neutral-700 rounded transition-colors cursor-pointer"
            >
              general ledger
            </button>

            <button
              onClick={() => onEnterApp('checkout')}
              className="text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>launch terminal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* ========================================================
            HERO SECTION: Headline + Real-Time Cash Flow Pipeline
        ======================================================== */}
        <section className="pt-12 sm:pt-20 pb-16 border-b border-neutral-800/60">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Mission & Core Value */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#0d131f] border border-[#1b253b] text-[10px] text-cyan-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>Deterministic Cash Flow Engine</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight font-sans">
                Real-time cash flow orchestration &amp;{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
                  double-entry ledger.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-mono">
                Engineered for fintech infrastructure with strict zero-float integer paise arithmetic,
                replay-safe SHA-256 idempotency locks, pessimistic row-level refund concurrency, and
                cryptographic HMAC-SHA256 webhooks.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  onClick={() => onEnterApp('checkout')}
                  className="inline-flex items-center px-4 py-2 bg-emerald-400 text-slate-950 text-xs font-bold rounded hover:bg-emerald-300 transition-all shadow-sm cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 mr-1.5" />
                  launch terminal
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </button>
                <button
                  onClick={() => onEnterApp('ledger')}
                  className="inline-flex items-center px-4 py-2 border border-neutral-800 text-xs font-medium rounded text-neutral-300 hover:text-white hover:border-neutral-700 bg-[#0a0a0c] transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                  explore balanced ledger
                </button>
                <button
                  onClick={() => onEnterApp('refunds')}
                  className="inline-flex items-center px-4 py-2 border border-neutral-800 text-xs font-medium rounded text-neutral-400 hover:text-neutral-300 hover:border-neutral-700 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                  refund escrow
                </button>
              </div>

              {/* Micro-telemetry Strip */}
              <div className="pt-2 flex items-center gap-6 text-[11px] text-neutral-500 font-mono">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Integer Paise (0 Float)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>∑ Dr === ∑ Cr Invariant</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ACID Row Lock</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Live Cash Flow Animation Pipeline */}
            <div className="lg:col-span-6">
              <div className="border border-neutral-800/80 rounded-lg p-5 bg-[#0a0a0c] shadow-2xl relative overflow-hidden">
                {/* Pipeline Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800/70 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="font-semibold text-white tracking-wider">LIVE CASH FLOW PIPELINE</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">PAISE CHANNEL • ₹999.00</span>
                </div>

                {/* Animated Pipeline Nodes Diagram */}
                <div className="py-6 space-y-4 relative">
                  {/* Node 1: Customer Source Vault */}
                  <div className="flex items-center justify-between p-3 rounded border border-neutral-800 bg-[#0d121c]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-[#131b2c] border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs font-bold">
                        C1
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Buyer Vault (Order ord_9901)</div>
                        <div className="text-[10px] text-neutral-500 font-mono">Debited Account • ₹999.00</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        flowStep >= 1 ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {flowStep >= 1 ? 'AUTHORIZED' : 'READY'}
                    </span>
                  </div>

                  {/* Flow Stream SVG 1: Connecting Node 1 to Node 2 */}
                  <div className="h-8 flex items-center justify-center relative">
                    <svg className="w-8 h-full" viewBox="0 0 32 32">
                      <line
                        x1="16"
                        y1="0"
                        x2="16"
                        y2="32"
                        stroke={flowStep >= 1 ? '#06b6d4' : '#262626'}
                        strokeWidth="2.5"
                        className={flowStep >= 1 ? 'animate-flow' : ''}
                      />
                    </svg>
                    {flowStep >= 1 && (
                      <span className="absolute px-2 py-0.5 bg-[#080b10] border border-cyan-500/40 rounded text-[9px] text-cyan-300 font-mono animate-pulse">
                        99,900 paise &darr;
                      </span>
                    )}
                  </div>

                  {/* Node 2: PayFlow Idempotency Gateway Guard */}
                  <div
                    className={`p-3.5 rounded border transition-all ${
                      flowStep >= 2
                        ? 'border-cyan-500/50 bg-[#0e1626]'
                        : 'border-neutral-800 bg-[#0d121c]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-[#10192a] border border-cyan-500/50 flex items-center justify-center text-cyan-300">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>PayFlow Gateway Engine</span>
                            {flowMode === 'idempotent' && (
                              <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                CACHED HIT
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono truncate max-w-xs">
                            Idempotency Key: <span className="text-cyan-400">req_9fa18c2...</span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          flowStep >= 2
                            ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {flowStep >= 2 ? 'LOCKED & ROUTED' : 'AWAITING'}
                      </span>
                    </div>
                  </div>

                  {/* Flow Stream SVG 2: Splitting Node 2 into Node 3A and 3B */}
                  <div className="h-8 flex items-center justify-center relative">
                    <svg className="w-full h-full" viewBox="0 0 300 32">
                      <path
                        d="M 150 0 L 150 16 L 80 16 L 80 32"
                        fill="none"
                        stroke={flowStep >= 3 ? '#10b981' : '#262626'}
                        strokeWidth="2"
                        className={flowStep >= 3 ? 'animate-flow' : ''}
                      />
                      <path
                        d="M 150 0 L 150 16 L 220 16 L 220 32"
                        fill="none"
                        stroke={flowStep >= 3 ? '#a855f7' : '#262626'}
                        strokeWidth="2"
                        className={flowStep >= 3 ? 'animate-flow' : ''}
                      />
                    </svg>
                  </div>

                  {/* Dual Balanced Settlement Nodes */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Node 3A: Merchant Escrow (Credit) */}
                    <div
                      className={`p-3 rounded border text-left transition-all ${
                        flowStep >= 4
                          ? 'border-emerald-500/50 bg-[#091b15]'
                          : 'border-neutral-800 bg-[#0d121c]'
                      }`}
                    >
                      <div className="text-[10px] text-neutral-400 uppercase font-mono">Credit (Cr)</div>
                      <div className="text-xs font-bold text-white mt-0.5">Merchant Escrow</div>
                      <div className="text-sm font-black text-emerald-400 font-mono mt-1 tabular-nums">
                        +₹999.00
                      </div>
                      <div className="text-[9px] text-neutral-500 mt-0.5">Account #2010</div>
                    </div>

                    {/* Node 3B: Gateway Clearing Ledger (Debit) */}
                    <div
                      className={`p-3 rounded border text-left transition-all ${
                        flowStep >= 4
                          ? 'border-purple-500/50 bg-[#170e24]'
                          : 'border-neutral-800 bg-[#0d121c]'
                      }`}
                    >
                      <div className="text-[10px] text-neutral-400 uppercase font-mono">Debit (Dr)</div>
                      <div className="text-xs font-bold text-white mt-0.5">Gateway Clearing</div>
                      <div className="text-sm font-black text-purple-400 font-mono mt-1 tabular-nums">
                        -₹999.00
                      </div>
                      <div className="text-[9px] text-neutral-500 mt-0.5">Account #1010</div>
                    </div>
                  </div>
                </div>

                {/* Interactive Simulation Controls */}
                <div className="pt-3 border-t border-neutral-800/70 space-y-2.5">
                  <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                    Interactive Stream Harness:
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => triggerFlow('charge')}
                      className="px-2.5 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold transition-colors cursor-pointer text-center"
                    >
                      Authorize ₹999
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerFlow('refund')}
                      className="px-2.5 py-1.5 rounded bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-[11px] font-semibold transition-colors cursor-pointer text-center"
                    >
                      Simulate Reversal
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerFlow('idempotent')}
                      className="px-2.5 py-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[11px] font-semibold transition-colors cursor-pointer text-center"
                    >
                      Replay Hash
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            REAL-TIME INVARIANT TICKER STRIP
        ======================================================== */}
        <section className="py-10 border-b border-neutral-800/60">
          <div className="p-4 rounded-lg bg-[#0a0a0c] border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>DOUBLE-ENTRY ACCOUNTING INVARIANT</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                    VERIFIED
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  Mathematical proof: Total Debits &minus; Total Credits = ₹0.00 (Zero Drift Guarantee)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs">
              <div className="text-right">
                <span className="text-[10px] text-neutral-500 block uppercase">Network Txs</span>
                <span className="font-bold text-white tabular-nums">
                  {liveCounter.transactions.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-neutral-500 block uppercase">Settled Volume</span>
                <span className="font-bold text-emerald-400 tabular-nums">
                  ₹{(liveCounter.volumeMinor / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <button
                onClick={() => onEnterApp('ledger')}
                className="px-3 py-1.5 bg-[#141d2d] hover:bg-[#1a263c] border border-cyan-500/30 text-cyan-300 rounded text-xs transition-colors cursor-pointer"
              >
                Inspect Ledger &rarr;
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================
            FOUR PILLARS OF PAYFLOW INFRASTRUCTURE
        ======================================================== */}
        <section className="py-16 border-b border-neutral-800/60">
          <div className="mb-8">
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1.5">
              Financial Engineering Pillars
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
              Precision architecture for zero-loss payment systems
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pillar 1: Integer Arithmetic vs Floating Point */}
            <div className="p-6 rounded-lg bg-[#0a0a0c] border border-neutral-800/80 glow-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Strict Integer Paise Arithmetic</h3>
                </div>
                <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
                  ZERO FLOAT
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-mono">
                Floating-point math causes rounding drift in financial databases. PayFlow enforces integer paise
                across orders, payments, fees, and refunds.
              </p>
              <div className="p-3 rounded bg-[#080b10] border border-neutral-800 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-rose-400">
                  <span>Float JS: 0.1 + 0.2</span>
                  <span>0.30000000000000004 ✕</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold border-t border-neutral-800/80 pt-1.5">
                  <span>PayFlow Paise: 10 + 20</span>
                  <span>30 paise (₹0.30) ✓</span>
                </div>
              </div>
            </div>

            {/* Pillar 2: Pessimistic Row-Level Refund Locks */}
            <div className="p-6 rounded-lg bg-[#0a0a0c] border border-neutral-800/80 glow-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">Pessimistic Concurrency Escrow</h3>
                </div>
                <span className="text-[10px] text-purple-400 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded">
                  FOR UPDATE
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-mono">
                Simultaneous refund requests trigger database row-level locking. Eliminates race conditions
                where overlapping requests exceed the captured transaction amount.
              </p>
              <div className="p-3 rounded bg-[#080b10] border border-neutral-800 space-y-1 text-xs font-mono text-neutral-400">
                <div className="text-purple-300 font-semibold">PostgreSQL ACID Transaction:</div>
                <code className="text-[11px] text-neutral-300 block truncate">
                  SELECT * FROM payments WHERE id = $1 FOR UPDATE;
                </code>
              </div>
            </div>

            {/* Pillar 3: Replay-Safe Idempotency Key Shield */}
            <div className="p-6 rounded-lg bg-[#0a0a0c] border border-neutral-800/80 glow-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">SHA-256 Idempotency Shield</h3>
                </div>
                <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                  REPLAY SAFE
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-mono">
                Network timeouts often cause client retries. Every request is locked by an Idempotency-Key
                and payload hash. Replays immediately receive the cached response without double charges.
              </p>
              <div className="p-3 rounded bg-[#080b10] border border-neutral-800 flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">Conflict Detection:</span>
                <span className="text-cyan-300 font-bold">409 Mismatched Payload Block</span>
              </div>
            </div>

            {/* Pillar 4: Cryptographic Webhook Outbox */}
            <div className="p-6 rounded-lg bg-[#0a0a0c] border border-neutral-800/80 glow-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Cryptographic Outbox Matrix</h3>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                  HMAC-SHA256
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-mono">
                Transactional outbox pattern guarantees delivery. Events are signed with SHA-256 HMAC and
                verified via constant-time byte comparisons to defeat timing attacks.
              </p>
              <div className="p-3 rounded bg-[#080b10] border border-neutral-800 flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">Header:</span>
                <span className="text-emerald-300 font-semibold truncate max-w-[200px]">
                  X-PayFlow-Signature: t=...,v1=...
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            INTERACTIVE DEVELOPER CONSOLE & SDK MATRIX
        ======================================================== */}
        <section className="py-16 border-b border-neutral-800/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">
                Developer Integration Harness
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
                Native API requests &amp; cryptographic verification
              </h2>
            </div>

            {/* Code Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded bg-[#0a0a0c] border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveCodeTab('curl')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  activeCodeTab === 'curl' ? 'bg-[#141d2d] text-cyan-300 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                cURL
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('sdk')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  activeCodeTab === 'sdk' ? 'bg-[#141d2d] text-cyan-300 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Node.js SDK
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('webhook')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  activeCodeTab === 'webhook' ? 'bg-[#141d2d] text-cyan-300 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                HMAC Verify
              </button>
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="rounded-lg border border-neutral-800 bg-[#0a0a0c] overflow-hidden shadow-2xl relative">
            <div className="px-4 py-2.5 border-b border-neutral-800/80 bg-[#07090e] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>
                  {activeCodeTab === 'curl'
                    ? 'POST /api/v1/payments'
                    : activeCodeTab === 'sdk'
                    ? 'payments.service.ts'
                    : 'webhook.crypto.ts'}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    activeCodeTab === 'curl'
                      ? curlSnippet
                      : activeCodeTab === 'sdk'
                      ? sdkSnippet
                      : webhookSnippet
                  )
                }
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-2 py-1 rounded bg-[#0d121c] border border-neutral-800 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <pre className="p-5 text-xs text-neutral-300 font-mono overflow-x-auto leading-relaxed bg-[#080b10]">
              <code>
                {activeCodeTab === 'curl' && curlSnippet}
                {activeCodeTab === 'sdk' && sdkSnippet}
                {activeCodeTab === 'webhook' && webhookSnippet}
              </code>
            </pre>
          </div>
        </section>

        {/* ========================================================
            ENTERPRISE TRANSPARENCY & RUNTIME AUDIT
        ======================================================== */}
        <section className="py-16">
          <div className="border border-neutral-800 rounded-lg p-6 sm:p-8 bg-[#0a0a0c]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Ready to simulate transactions live?
                  </h3>
                </div>
                <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed font-mono">
                  Access the full interactive PayFlow terminal desk. Test multi-outcome payment authorizations,
                  review balanced double-entry ledger transactions, execute partial row-locked refunds, and
                  inspect cryptographically signed webhook dispatches.
                </p>
              </div>

              <button
                onClick={() => onEnterApp('checkout')}
                className="shrink-0 inline-flex items-center px-5 py-2.5 bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-bold rounded transition-colors shadow-sm cursor-pointer"
              >
                <span>launch terminal desk</span>
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/60 py-6 bg-[#06080c]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-neutral-600 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-bold">payflow</span>
            <span>&copy; 2026 Core Gateway Architecture</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>engine: node.js / express</span>
            <span>storage: postgresql / prisma</span>
            <span>tests: 68 passing</span>
            <button
              onClick={() => onEnterApp('checkout')}
              className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              enter terminal &rarr;
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
