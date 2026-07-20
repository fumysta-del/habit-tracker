export function DecorativeBg() {
  return (
    <div className="decorative-bg" aria-hidden="true">
      <svg viewBox="0 0 400 800" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMin slice">
        <defs>
          <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="g2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <path d="M0,120 C60,80 160,160 400,95 340,200 180,175 0,220 Z" fill="url(#g1)" />
        <path d="M400,280 C300,240 140,340 0,270 C70,370 240,350 400,320 Z" fill="url(#g2)" />
        <path d="M0,480 C100,440 250,530 400,460" fill="none" stroke="var(--color-primary)" strokeWidth="0.5" opacity="0.06" />
        <path d="M400,580 C220,540 80,640 0,580" fill="none" stroke="var(--color-accent)" strokeWidth="0.5" opacity="0.04" />
      </svg>
    </div>
  );
}