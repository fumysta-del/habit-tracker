import { useState, useEffect, useRef } from "react";

const W = 320;
const H = 200;
const N = 120;

const STAGES = [
  { key: "sprout", label: "萌芽", desc: "缓慢起步" },
  { key: "grow",   label: "成长", desc: "稳定上升" },
  { key: "break",  label: "突破", desc: "加速突破" },
  { key: "bloom",  label: "绽放", desc: "圆满绽放" },
];

function getY(x: number, key: string): number {
  switch (key) {
    case "sprout":
      return 0.35 * x * x + 0.65 * (1 - Math.cos(x * Math.PI / 2));
    case "grow":
      return Math.pow(x, 1.3);
    case "break":
      return Math.pow(x, 0.7);
    case "bloom":
      return (1 - Math.cos(x * Math.PI)) / 2;
    default:
      return x * x;
  }
}

function computeYs(key: string): number[] {
  return Array.from({ length: N }, (_, i) => {
    const x = i / (N - 1);
    const y = getY(x, key);
    const env = 1 - Math.pow(Math.abs(x - 0.5) * 2, 2);
    const noise = 0.01 * Math.sin(x * Math.PI * 7.1) * Math.sin(x * Math.PI * 2.3) * env;
    return Math.max(0, Math.min(1, y + noise));
  });
}

function buildPath(ys: number[]): string {
  const step = W / (N - 1);
  return ys.map((y, i) =>
    "" + (i === 0 ? "M" : "L") + (i * step).toFixed(1) + " " + (H - y * H).toFixed(1)
  ).join("");
}

export function GrowthCurveDemo() {
  const [stage, setStage] = useState("sprout");
  const [pathD, setPathD] = useState("");
  const [dotX, setDotX] = useState(0);
  const [dotY, setDotY] = useState(H);
  const [autoPlay, setAutoPlay] = useState(false);

  const displayRef = useRef(computeYs("sprout"));
  const targetRef = useRef(computeYs("sprout"));
  const rAF = useRef(0);
  const dotTime = useRef(0);
  const autoTimer = useRef(0);
  const autoIdx = useRef(0);

  // Set target when stage changes
  useEffect(() => {
    targetRef.current = computeYs(stage);
  }, [stage]);

  // Main animation loop: morph + dot
  useEffect(() => {
    const tick = () => {
      const disp = displayRef.current;
      const tgt = targetRef.current;
      for (let i = 0; i < N; i++) {
        const diff = tgt[i] - disp[i];
        if (Math.abs(diff) > 0.0005) {
          disp[i] += diff * 0.035;
        } else {
          disp[i] = tgt[i];
        }
      }
      setPathD(buildPath(disp));

      dotTime.current = (dotTime.current + 1) % 99999;
      const prog = ((dotTime.current * 0.003) % 1);
      const di = prog * (N - 1);
      const idx = Math.floor(di);
      const frac = di - idx;
      const ni = Math.min(idx + 1, N - 1);
      const yVal = disp[idx] * (1 - frac) + disp[ni] * frac;
      setDotX(prog * W);
      setDotY(H - yVal * H);

      rAF.current = requestAnimationFrame(tick);
    };
    rAF.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rAF.current);
  }, []);

  // Auto play
  useEffect(() => {
    if (!autoPlay) {
      clearTimeout(autoTimer.current);
      return;
    }
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

  return (
    <section className="growth-demo">
      <h2 className="section-title">成长轨迹</h2>
      <div className="growth-demo-chart">
        <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c4956a" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#e0c4a8" stopOpacity="1" />
            </linearGradient>
            <filter id="dotGlow">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <path d={pathD} fill="none" stroke="url(#cg)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={dotX} cy={dotY} r="4" fill="#c4956a" filter="url(#dotGlow)" opacity="0.85" />
        </svg>
      </div>
      <div className="growth-demo-info">{cur.label} — {cur.desc}</div>
      <div className="growth-demo-buttons">
        {STAGES.map((s) => (
          <button key={s.key}
            className={"gd-btn" + (stage === s.key ? " active" : "")}
            onClick={() => { setStage(s.key); setAutoPlay(false); }}>
            {s.label}
          </button>
        ))}
        <button className={"gd-btn gd-auto" + (autoPlay ? " active" : "")}
          onClick={() => setAutoPlay(!autoPlay)}>
          {autoPlay ? "⏹" : "▶"} 自动
        </button>
      </div>
    </section>
  );
}