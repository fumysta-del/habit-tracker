export function EnergyCard({ energy, onChange }: { energy: string; onChange: (e: "low" | "normal" | "high") => void }) {
  const OPTIONS = [
    { key: "low" as const, label: "低能量", icon: "(( _ _ ))..zzzZZ" },
    { key: "normal" as const, label: "普通", icon: "＜コ:彡" },
    { key: "high" as const, label: "高能量", icon: "^ ^" },
  ];
  return (
    <section className="energy-section">
      <div className="energy-options">
        {OPTIONS.map((opt) => (
          <button key={opt.key} className={`energy-btn ${energy === opt.key ? "active" : ""}`} onClick={() => onChange(opt.key)}>
            <span className="energy-icon">{opt.icon}</span>
            <span className="energy-label">{opt.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}