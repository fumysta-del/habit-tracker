const LEVELS = [
  { key: "low" as const, label: "低能量", gradient: "var(--gradient-energy-low)", color: "var(--color-energy-low)" },
  { key: "normal" as const, label: "普通", gradient: "var(--gradient-energy-normal)", color: "var(--color-energy-normal)" },
  { key: "high" as const, label: "高能量", gradient: "var(--gradient-energy-high)", color: "var(--color-energy-high)" },
];

export function EnergyIndicator({ energy, onChange }: { energy: string; onChange: (e: "low" | "normal" | "high") => void }) {
  const cycle = () => {
    const idx = LEVELS.findIndex((l) => l.key === energy);
    onChange(LEVELS[(idx + 1) % LEVELS.length].key);
  };
  const current = LEVELS.find((l) => l.key === energy) ?? LEVELS[1];
  return (
    <div className="energy-selector" onClick={cycle}>
      <div className="energy-dots">
        {LEVELS.map((l) => (
          <div
            key={l.key}
            className={"energy-dot" + (l.key === energy ? " active" : "")}
            style={{
              background: l.key === energy ? l.gradient : "var(--color-border)",
              boxShadow: l.key === energy ? "0 0 12px " + l.color : "none",
            }}
          />
        ))}
      </div>
      <span className="energy-label number-mono">{current.label}</span>
    </div>
  );
}