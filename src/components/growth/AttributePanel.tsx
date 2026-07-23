interface Props {
  focus: number; discipline: number;
  energy: number; creativity: number;
}

const IMGS: Record<string, string> = {
  focus: "/assets/badges/badge-knowledge.png",
  discipline: "/assets/badges/badge-discipline.png",
  energy: "/assets/badges/badge-sport.png",
  creativity: "/assets/badges/badge-creativity.png",
};

const bar = (label: string, val: number, color: string, imgKey: string) => (
  <div key={label} className="attr-row">
    <img src={IMGS[imgKey]} alt={label} className="attr-badge" />
    <div className="attr-info">
      <span className="attr-label">{label}</span>
      <div className="attr-track">
        <div className="attr-fill" style={{ width: Math.min(val, 100) + "%", background: color }} />
      </div>
      <span className="attr-value">{Math.min(val, 100)}</span>
    </div>
  </div>
);

export function AttributePanel(p: Props) {
  return (
    <div className="attr-panel">
      <h3 className="panel-title">属性</h3>
      {bar("专注", p.focus, "var(--color-primary)", "focus")}
      {bar("自律", p.discipline, "var(--color-accent)", "discipline")}
      {bar("精力", p.energy, "var(--color-energy-normal)", "energy")}
      {bar("创造力", p.creativity, "var(--color-energy-high)", "creativity")}
    </div>
  );
}