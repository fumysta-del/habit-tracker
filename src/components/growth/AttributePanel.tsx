interface Props {
  focus: number; discipline: number;
  energy: number; creativity: number;
}
const bar = (label: string, val: number, color: string) => (
  <div key={label} className="attr-row">
    <span className="attr-label">{label}</span>
    <div className="attr-track">
      <div className="attr-fill" style={{ width: Math.min(val, 100) + "%", background: color }} />
    </div>
    <span className="attr-value">{Math.min(val, 100)}</span>
  </div>
);
export function AttributePanel(p: Props) {
  return (
    <div className="attr-panel">
      <h3 className="panel-title">属性</h3>
      {bar("专注", p.focus, "var(--color-primary)")}
      {bar("自律", p.discipline, "var(--color-accent)")}
      {bar("精力", p.energy, "var(--color-energy-normal)")}
      {bar("创造力", p.creativity, "var(--color-energy-high)")}
    </div>
  );
}