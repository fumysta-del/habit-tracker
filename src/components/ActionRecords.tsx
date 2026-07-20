import type { MinimalRecord } from "../storage";
function fmt(iso: string) { const d = new Date(iso); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }
export function ActionRecords({ records, onDelete }: { records: MinimalRecord[]; onDelete: (id: number) => void }) {
  if (!records.length) return null;
  return (
    <section className="records-section">
      <h2 className="section-title">今日最小行动记录<span className="records-count"> ({records.length})</span></h2>
      <div className="records-list">
        {records.map((r) => (
          <div key={r.id} className="record-item">
            <span className="record-time">{fmt(r.timestamp)}</span>
            <span className="record-action">{r.action}</span>
            <span className="record-xp">+{r.xp}XP</span>
            <button className="record-delete" onClick={() => onDelete(r.id)} title="撤销">&times;</button>
          </div>
        ))}
      </div>
    </section>
  );
}