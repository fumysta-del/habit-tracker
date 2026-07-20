export function DecorativeBg() {
  return (
    <>
      <div className="mesh-layer mesh-layer-1" aria-hidden="true" />
      <div className="mesh-layer mesh-layer-2" aria-hidden="true" />
      <div className="mesh-layer mesh-layer-3" aria-hidden="true" />
      <div className="decorative-bg" aria-hidden="true">
        <svg viewBox="0 0 400 800" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMin slice">
          <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.06" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="g2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <path className="deco-curve-a" d="M0,180 C60,130 180,210 400,140 340,250 180,220 0,260 Z" fill="url(#g1)" />
          <path className="deco-curve-b" d="M400,320 C280,270 140,380 0,300 C80,410 250,390 400,360 Z" fill="url(#g2)" />
          <path className="deco-curve-c" d="M0,520 C120,470 280,580 400,500" fill="none" stroke="var(--color-primary)" strokeWidth="0.5" opacity="0.06" />
          <path className="deco-curve-d" d="M400,620 C200,570 80,680 0,600" fill="none" stroke="var(--color-accent)" strokeWidth="0.5" opacity="0.05" />
          <circle className="particle p1" cx="80" cy="300" r="1.5" fill="var(--color-primary)" opacity="0.15" />
          <circle className="particle p2" cx="320" cy="200" r="1" fill="var(--color-accent)" opacity="0.12" />
          <circle className="particle p3" cx="150" cy="450" r="2" fill="var(--color-energy-normal)" opacity="0.1" />
          <circle className="particle p4" cx="250" cy="150" r="1.5" fill="var(--color-accent)" opacity="0.08" />
          <circle className="particle p5" cx="50" cy="550" r="1" fill="var(--color-primary)" opacity="0.12" />
          <circle className="particle p6" cx="350" cy="400" r="2" fill="var(--color-energy-high)" opacity="0.08" />
        </svg>
      </div>
    </>
  );
}