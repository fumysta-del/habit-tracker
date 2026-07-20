const LEVELS = [
  { key: "low" as const, label: "低能量", color: "var(--color-energy-low)" },
  { key: "normal" as const, label: "普通", color: "var(--color-energy-normal)" },
  { key: "high" as const, label: "高能量", color: "var(--color-energy-high)" },
];

export function EnergyIndicator({ energy, onChange }: { energy: string; onChange: (e: "low" | "normal" | "high") => void }) {
  const cycle = () => {
    const idx = LEVELS.findIndex((l) => l.key === energy);
    onChange(LEVELS[(idx + 1) % LEVELS.length].key);
  };
  return (
    <div className="energy-indicator" onClick={cycle}>
      {LEVELS.map((l) => (
        <div key={l.key} className={`energy-indicator-dot${l.key === energy ? " active" : ""}`}
          style={{ background: l.key === energy ? l.color : "var(--color-border)" }}
        />
      ))}
    </div>
  );
}