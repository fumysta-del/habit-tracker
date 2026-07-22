import { useState, useEffect, useRef } from "react";

const W = 300;
const H = 200;
const N = 100;

const LABELS: Record<string, string> = {
  quadratic: "二次函数",
  sine: "正弦波",
  mixed: "混合过渡",
  complex: "复杂曲线",
};

function getY(x: number, type: string, t: number): number {
  const q = x * x;
  const s = (Math.sin(x * Math.PI * 4) + 1) / 2;
  switch (type) {
    case "quadratic": return q;
    case "sine": return s;
    case "mixed": return (1 - t) * q + t * s;
    case "complex":
      return (Math.sin(x * Math.PI * 4) + 0.5 * Math.sin(x * Math.PI * 8) + 0.25 * Math.sin(x * Math.PI * 12)) / 1.75;
    default: return q;
  }
}

function computeYs(type: string, t: number): number[] {
  return Array.from({ length: N }, (_, i) => getY(i / (N - 1), type, t));
}

function buildPath(ys: number[]): string {
  const step = W / (ys.length - 1);
  return ys.map((y, i) =>
    `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${(H - y * H).toFixed(1)}`
  ).join(" ");
}

export function GrowthCurveDemo() {
  const [curve, setCurve] = useState("quadratic");
  const [mixT, setMixT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [path, setPath] = useState(() => buildPath(computeYs("quadratic", 0)));

  const displayRef = useRef(computeYs("quadratic", 0));
  const targetRef = useRef(computeYs("quadratic", 0));
  const rafRef = useRef(0);

  useEffect(() => {
    targetRef.current = computeYs(curve, mixT);
  }, [curve, mixT]);

  useEffect(() => {
    const animate = () => {
      const disp = displayRef.current;
      const tgt = targetRef.current;
      let changed = false;
      for (let i = 0; i < N; i++) {
        const diff = tgt[i] - disp[i];
        if (Math.abs(diff) > 0.001) {
          disp[i] += diff * 0.06;
          changed = true;
        } else {
          disp[i] = tgt[i];
        }
      }
      if (changed) {
        setPath(buildPath(disp));
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [curve, mixT]);

  useEffect(() => {
    if (!playing) return;
    const stages: { type: string; t?: number }[] = [
      { type: "quadratic" },
      { type: "mixed", t: 0.3 },
      { type: "mixed", t: 0.7 },
      { type: "sine" },
      { type: "complex" },
    ];
    let idx = 0;
    const tick = () => {
      const s = stages[idx % stages.length];
      setCurve(s.type);
      if (s.t !== undefined) setMixT(s.t);
      idx++;
      rafRef.current = setTimeout(tick, 2500) as unknown as number;
    };
    tick();
    return () => clearTimeout(rafRef.current);
  }, [playing]);

  return (
    <section className="growth-demo">
      <h2 className="section-title">成长轨迹曲线 Demo</h2>
      <div className="growth-demo-chart">
        <svg viewBox={"0 0 " + W + " " + H} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c4956a" />
              <stop offset="100%" stopColor="#e0c4a8" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <line key={v} x1={0} y1={H - v * H} x2={W} y2={H - v * H}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          ))}
          <path d={path} fill="none" stroke="url(#curveGrad)" strokeWidth="2.5"
            filter="url(#glow)" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="growth-demo-info">
        {LABELS[curve]}{curve === "mixed" ? " (t = " + mixT.toFixed(2) + ")" : ""}
      </div>
      <div className="growth-demo-buttons">
        {Object.entries(LABELS).map(([key, label]) => (
          <button key={key} className={"growth-demo-btn" + (curve === key ? " active" : "")}
            onClick={() => { setCurve(key); setPlaying(false); }}>
            {label}
          </button>
        ))}
      </div>
      <div className="growth-demo-row">
        {curve === "mixed" && (
          <input type="range" min="0" max="1" step="0.02" value={mixT}
            onChange={(e) => setMixT(+e.target.value)} className="growth-demo-slider" />
        )}
        <button className={"growth-demo-btn demo-play" + (playing ? " active" : "")}
          onClick={() => setPlaying(!playing)}>
          {playing ? "⏹ 停止" : "▶ 自动播放"}
        </button>
      </div>
    </section>
  );
}