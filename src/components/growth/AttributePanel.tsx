interface Props {
  title?: string;
  focus: number; discipline: number;
  energy: number; creativity: number;
}

const ASSET_BASE = import.meta.env.BASE_URL;

const IMGS: Record<string, string> = {
  focus: `${ASSET_BASE}assets/badges/badge-knowledge.webp?v=3`,
  discipline: `${ASSET_BASE}assets/badges/badge-discipline.webp?v=3`,
  energy: `${ASSET_BASE}assets/badges/badge-sport.webp?v=3`,
  creativity: `${ASSET_BASE}assets/badges/badge-creativity.webp?v=3`,
};

const card = (imgKey: string, label: string, val: number) => (
  <div key={imgKey} className="attr-card">
    <div className="attr-image-box">
      <img src={IMGS[imgKey]} alt={label} className="attr-badge" />
    </div>
    <span className="attr-label">{label}</span>
    <span className="attr-value">{Math.min(val, 100)}</span>
  </div>
);

export function AttributePanel(p: Props) {
  return (
    <div className="attr-panel">
      <h3 className="panel-title">{p.title ?? '属性'}</h3>
      <div className="attr-grid">
        {card("focus", "专注", p.focus)}
        {card("discipline", "自律", p.discipline)}
        {card("energy", "精力", p.energy)}
        {card("creativity", "创造力", p.creativity)}
      </div>
    </div>
  );
}
