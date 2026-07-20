const ACTIONS = ["喝水", "拉伸30秒", "走到客厅", "打开学习资料"];
const XP = 3;
export function DailyActions({ onClick }: { onClick: (a: string) => void }) {
  return (
    <section className="minimal-section">
      <h2 className="section-title">立即开始一个最小行动</h2>
      <div className="minimal-grid">
        {ACTIONS.map((a) => (
          <button key={a} className="minimal-btn" onClick={() => onClick(a)}>{a} +{XP}</button>
        ))}
      </div>
    </section>
  );
}