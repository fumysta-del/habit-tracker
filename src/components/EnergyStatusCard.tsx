const OPTIONS = [
  { key: "low" as const, icon: "(( _ _ ))..zzzZZ", label: "低能量" },
  { key: "normal" as const, icon: "＜コ:彡", label: "普通" },
  { key: "high" as const, icon: "^ ^", label: "高能量" },
];

export function EnergyStatusCard({ energy, onChange }: { energy: string; onChange: (e: "low" | "normal" | "high") => void }) {
  return (
    <div className="energy-status-card">
      <div className="energy-status-title">今日状态</div>
      <div className="energy-options-row">
        {OPTIONS.map((opt) => (
          <div key={opt.key}
            className={"energy-option" + (energy === opt.key ? " active" : "")}
            onClick={() => onChange(opt.key)}>
            <span className="energy-option-icon">{opt.icon}</span>
            <span className="energy-option-label">{opt.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}