import { useState, useEffect, useRef } from "react";

const W = 520;
const H = 320;
const N = 120;

const STAGES = [
  { key: "sprout", label: "萌芽", desc: "缓慢蓄力" },
  { key: "grow",   label: "成长", desc: "稳定提升" },
  { key: "break",  label: "突破", desc: "加速跃升" },
  { key: "bloom",  label: "绽放", desc: "圆满展现" },
];

// ── Control points for each growth stage ──
// Each curve is defined by key (x, y) points, then interpolated with smoothstep.
// No standard mathematical functions — purely organic shape.

const POINTS: Record<string, number[][]> = {
  sprout: [[0,0],[0.10,0.004],[0.25,0.01],[0.42,0.03],[0.58,0.1],[0.72,0.28],[0.86,0.55],[1,1]],
  grow:   [[0,0],[0.10,0.05],[0.25,0.16],[0.42,0.30],[0.58,0.47],[0.72,0.65],[0.86,0.83],[1,1]],
  break:  [[0,0],[0.12,0.004],[0.30,0.012],[0.48,0.04],[0.62,0.15],[0.76,0.40],[0.88,0.68],[1,1]],
  bloom:  [[0,0],[0.08,0.025],[0.22,0.10],[0.38,0.25],[0.55,0.46],[0.72,0.68],[0.88,0.86],[1,1]],
};

function interpolateY(pts: number[][], x: number): number {
  if (x <= pts[0][0]) return pts[0][1];
  if (x >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i++) {
    if (x >= pts[i][0] && x <= pts[i + 1][0]) {
      const t = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
      const s = t * t * (3 - 2 * t);
      return pts[i][1] + s * (pts[i + 1][1] - pts[i][1]);
    }
  }
  return pts[pts.length - 1][1];
}

function computeYs(key: string): number[] {
  const pts = POINTS[key] ?? POINTS.sprout;
  return Array.from({ length: N }, (_, i) => {
    const x = i / (N - 1);
    const y = interpolateY(pts, x);
    const env = 1 - Math.pow(Math.abs(x - 0.5) * 2, 3);
    const noise = 0.006 * Math.sin(x * Math.PI * 13.1) * Math.sin(x * Math.PI * 4.7) * env;
    return Math.max(0, Math.min(1, y + noise));
  });
}

function buildPath(ys: number[]): string {
  const PL = 20, PT = 25;
  const uW = W - 2 * PL, uH = H - 2 * PT;
  return ys.map((y, i) => {
    const x = PL + (i / (N - 1)) * uW;
    const sy = PT + (1 - y) * uH;
    return (i === 0 ? "M" : "L") + x.toFixed(1) + " " + sy.toFixed(1);
  }).join("");
}

function getPos(prog: number, ys: number[]): { x: number; y: number } {
  const di = prog * (N - 1);
  const idx = Math.floor(di);
  const frac = di - idx;
  const ni = Math.min(idx + 1, N - 1);
  const yVal = ys[idx] * (1 - frac) + ys[ni] * frac;
  const PL = 20, PT = 25;
  const uW = W - 2 * PL, uH = H - 2 * PT;
  return { x: PL + prog * uW, y: PT + (1 - yVal) * uH };
}

const PARTICLE_CFG = [
  { cx: 80,  cy: 265, cls: "p1" },
  { cx: 210, cy: 240, cls: "p2" },
  { cx: 340, cy: 250, cls: "p3" },
  { cx: 460, cy: 230, cls: "p4" },
];

export function GrowthCurveDemo() {
  const [stage, setStage] = useState("sprout");
  const [pathD, setPathD] = useState("");
  const [dot, setDot] = useState({ x: 0, y: H });
  const [trail1, setTrail1] = useState({ x: 0, y: H });
  const [trail2, setTrail2] = useState({ x: 0, y: H });
  const [autoPlay, setAutoPlay] = useState(false);

  const displayRef = useRef(computeYs("sprout"));
  const targetRef = useRef(computeYs("sprout"));
  const rAF = useRef(0);
  const dotTime = useRef(0);
  const autoTimer = useRef(0);
  const autoIdx = useRef(0);
  const mounted = useRef(false);

  // Entry animation marker
  useEffect(() => { mounted.current = true; }, []);

  useEffect(() => {
    targetRef.current = computeYs(stage);
  }, [stage]);

  // Main loop: morph curve + move dot + trail
  useEffect(() => {
    const tick = () => {
      const disp = displayRef.current;
      const tgt = targetRef.current;
      for (let i = 0; i < N; i++) {
        const diff = tgt[i] - disp[i];
        if (Math.abs(diff) > 0.0003) {
          disp[i] += diff * 0.025;
        } else {
          disp[i] = tgt[i];
        }
      }
      setPathD(buildPath(disp));

      dotTime.current = (dotTime.current + 1) % 999999;
      const prog = (dotTime.current * 0.002) % 1;
      const p0 = getPos(prog, disp);
      const p1 = getPos(Math.max(0, prog - 0.025), disp);
      const p2 = getPos(Math.max(0, prog - 0.05), disp);
      setDot(p0);
      setTrail1(p1);
      setTrail2(p2);

      rAF.current = requestAnimationFrame(tick);
    };
    rAF.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rAF.current);
  }, []);

  // Auto-play
  useEffect(() => {
    if (!autoPlay) { clearTimeout(autoTimer.current); return; }
    autoIdx.current = STAGES.findIndex((s) => s.key === stage);
    const tick = () => {
      autoIdx.current = (autoIdx.current + 1) % STAGES.length;
      setStage(STAGES[autoIdx.current].key);
      autoTimer.current = setTimeout(tick, 3000) as unknown as number;
    };
    autoTimer.current = setTimeout(tick, 3000) as unknown as number;
    return () => clearTimeout(autoTimer.current);
  }, [autoPlay]);

  const cur = STAGES.find((s) => s.key === stage) ?? STAGES[0];
  const demoLevel = 3;

  // Position level label adaptively
  const labelX = dot.x < W * 0.7 ? dot.x + 14 : dot.x - 52;
  const labelY = Math.max(25, dot.y - 14);

  return (
    <section className="growth-demo">
      <h2 className="section-title">成长轨迹</h2>

      <div className="growth-demo-card">
        <svg viewBox="0 0 520 320" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="bgGlow" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#c4956a" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#c4956a" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="cg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c4956a" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#d4a853" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f0d07a" stopOpacity="1" />
            </linearGradient>
            <filter id="dotGlow">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Layer 1: Background glow */}
          <rect width={W} height={H} fill="url(#bgGlow)" rx="12" />

          {/* Layer 2: Particles (CSS animated float) */}
          {PARTICLE_CFG.map((p) => (
            <g key={p.cls} className={"particle " + p.cls}>
              <circle cx={p.cx} cy={p.cy} r="1.5" fill="#c4956a" />
            </g>
          ))}

          {/* Layer 3: Curve */}
          <path d={pathD} fill="none" stroke="url(#cg)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />

          {/* Layer 4: Dot trail */}
          <circle cx={trail2.x} cy={trail2.y} r="3" fill="#c4956a" opacity="0.08" />
          <circle cx={trail1.x} cy={trail1.y} r="4" fill="#c4956a" opacity="0.2" />

          {/* Layer 5: Main dot */}
          <circle cx={dot.x} cy={dot.y} r="5" fill="#f0d07a" filter="url(#dotGlow)" opacity="0.9" />

          {/* Layer 6: Level label */}
          <rect x={labelX - 4} y={labelY - 8} width={44} height={16}
            rx={4} fill="rgba(255,255,255,0.9)" stroke="rgba(196,149,106,0.15)" strokeWidth="0.5" />
          <text x={labelX} y={labelY} fill="#c4956a" fontSize="10" fontWeight="600"
            fontFamily="JetBrains Mono,SF Mono,monospace">
            Lv.0{demoLevel}
          </text>
        </svg>
      </div>

      <div className="growth-demo-info">{cur.label} · {cur.desc}</div>

      <div className="growth-demo-stages">
        {STAGES.map((s) => (
          <button key={s.key}
            className={"gd-btn" + (stage === s.key ? " active" : "")}
            onClick={() => { setStage(s.key); setAutoPlay(false); }}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="growth-demo-autoplay">
        <button className={"gd-play" + (autoPlay ? " active" : "")}
          onClick={() => setAutoPlay(!autoPlay)}>
          {autoPlay ? "⏸ 暂停" : "▶ 自动演示"}
        </button>
      </div>
    </section>
  );
}