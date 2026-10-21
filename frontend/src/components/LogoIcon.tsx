export function LogoIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* Outer Hexagonal Shield SVG with Cyan-Emerald Gradient */}
      <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">
        <defs>
          <linearGradient id="payflowLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="payflowGlowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Hexagon Border */}
        <polygon
          points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
          fill="url(#payflowGlowGrad)"
          stroke="url(#payflowLogoGrad)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Ledger Balance Symbol / Step Trace */}
        <path
          d="M 28 50 L 44 64 L 72 36"
          stroke="#38bdf8"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Glowing Node Dot */}
        <circle cx="72" cy="36" r="4" fill="#67e8f9" className="animate-pulse" />
        <circle cx="72" cy="36" r="7" stroke="#38bdf8" strokeWidth="1.5" opacity="0.8" />
      </svg>
    </div>
  );
}
