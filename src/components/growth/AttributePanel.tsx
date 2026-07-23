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

const card = (imgKey: string, val: number) => (
  <div key={imgKey} className="attr-card">
    <img src={IMGS[imgKey]} alt="" className="attr-badge" />
    <span className="attr-value">{Math.min(val, 100)}</span>
  </div>
);

export function AttributePanel(p: Props) {
  return (
    <div className="attr-panel">
      <h3 className="panel-title">属性</h3>
      <div className="attr-grid">
        {card("focus", p.focus)}
        {card("discipline", p.discipline)}
        {card("energy", p.energy)}
        {card("creativity", p.creativity)}
      </div>
    </div>
  );
}