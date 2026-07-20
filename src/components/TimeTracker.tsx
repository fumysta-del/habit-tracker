const CATEGORIES = [{ type: "游戏", icon: "🎮" }, { type: "学习", icon: "📚" }, { type: "运动", icon: "🏃" }, { type: "休息", icon: "🛌" }];
export function TimeTracker({ timeMinutes, isRunning, onStart, onStop }: { timeMinutes: Record<string, number>; isRunning: (t: string) => boolean; onStart: (t: string) => void; onStop: (t: string) => void }) {
  return (
    <section className="time-section">
      <h2 className="section-title">时间记录</h2>
      <div className="time-list">
        {CATEGORIES.map((cat) => (
          <div key={cat.type} className="time-item">
            <span className="time-category">{cat.icon} {cat.type}</span>
            <span className="time-duration">{timeMinutes[cat.type]} 分钟</span>
            {isRunning(cat.type) ? (
              <button className="time-btn stop" onClick={() => onStop(cat.type)}>结束</button>
            ) : (
              <button className="time-btn start" onClick={() => onStart(cat.type)}>开始</button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}