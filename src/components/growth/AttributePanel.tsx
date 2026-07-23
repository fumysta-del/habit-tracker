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
      <h3 className="panel-title">Attributes</h3>
      {bar("Focus", p.focus, "var(--color-primary)")}
      {bar("Discipline", p.discipline, "var(--color-accent)")}
      {bar("Energy", p.energy, "var(--color-energy-normal)")}
      {bar("Creativity", p.creativity, "var(--color-energy-high)")}
    </div>
  );
}