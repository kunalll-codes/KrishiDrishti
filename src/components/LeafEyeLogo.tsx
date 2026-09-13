interface LeafEyeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  tagline?: boolean;
}

export function LeafEyeLogo({ size = 'md', showText = true, tagline = false }: LeafEyeLogoProps) {
  const iconDimensions = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }[size];

  const titleSize = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size];

  return (
    <div className="flex items-center gap-2.5 select-none" id="brand-logo-container">
      {/* Minimal Leaf + Vision Eye Glyph */}
      <div
        className={`${iconDimensions} rounded-lg bg-emerald-800 text-emerald-100 flex items-center justify-center p-1.5 shadow-xs border border-emerald-900/10 shrink-0`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
          {/* Outer leaf contour */}
          <path d="M12 2C6.5 2 2 6.5 2 12c0 5 4 9 10 10 6.5 0 10-4.5 10-10 0-5.5-4.5-10-10-10z" className="stroke-emerald-300" strokeWidth="1.8" />
          {/* Central vein / eye slit */}
          <path d="M2 12c3.5-3 6.5-4.5 10-4.5s6.5 1.5 10 4.5c-3.5 3-6.5 4.5-10 4.5S5.5 15 2 12z" className="stroke-white" strokeWidth="1.6" />
          {/* Inner pupil / seed */}
          <circle cx="12" cy="12" r="2.2" className="fill-emerald-200 stroke-none" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-semibold tracking-tight text-stone-900 ${titleSize}`}>
              Krishi Drishti
            </span>
          </div>
          {tagline && (
            <span className="text-xs text-stone-700 font-normal">
              Vision for Agriculture
            </span>
          )}
        </div>
      )}
    </div>
  );
}
