export function LogoIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* Outer Hexagonal Shield SVG in Monochrome Zinc/White */}
      <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">
        <defs>
          <linearGradient id="payflowLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#71717a" />
          </linearGradient>
          <linearGradient id="payflowGlowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#27272a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#52525b" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Hexagon Border */}
        <polygon
          points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
          fill="url(#payflowGlowGrad)"
          stroke="url(#payflowLogoGrad)"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Ledger Balance Symbol / Step Trace */}
        <path
          d="M 28 50 L 44 64 L 72 36"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Glowing Node Dot */}
        <circle cx="72" cy="36" r="3.5" fill="#ffffff" />
        <circle cx="72" cy="36" r="6" stroke="#a1a1aa" strokeWidth="1" opacity="0.6" />
      </svg>
    </div>
  );
}
