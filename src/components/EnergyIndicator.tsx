const LEVELS = [
  { key: "low" as const, label: "低能量", color: "var(--color-energy-low)" },
  { key: "normal" as const, label: "普通", color: "var(--color-energy-normal)" },
  { key: "high" as const, label: "高能量", color: "var(--color-energy-high)" },
];

export function EnergyIndicator({ energy, onChange }: { energy: string; onChange: (e: "low" | "normal" | "high") => void }) {
  const current = LEVELS.find((l) => l.key === energy) ?? LEVELS[1];
  const cycle = () => {
    const idx = LEVELS.findIndex((l) => l.key === energy);
    onChange(LEVELS[(idx + 1) % LEVELS.length].key);
  };
  return (
    <div className="energy-indicator" onClick={cycle} title="点击切换">
      <span className="energy-indicator-dot" style={{ background: current.color }} />
      <span className="energy-indicator-text">{current.label}</span>
    </div>
  );
}