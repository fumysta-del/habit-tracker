import type { DayStats } from "../storage";
const EICON: Record<string, string> = { low: "(( _ _ ))..zzzZZ", normal: "＜コ:彡", high: "^ ^" };
const ELABEL: Record<string, string> = { low: "低能量", normal: "普通", high: "高能量" };
const TCATS = [{ t: "游戏", i: "🎮" }, { t: "学习", i: "📚" }, { t: "运动", i: "🏃" }, { t: "休息", i: "🛌" }];
function d2k(i: string) { const [y, m, d] = i.split("-").map(Number); return new Date(y, m - 1, d).toDateString(); }
export function HistoryPage({ dailyStats, historyDate, setHistoryDate, todayStr }: { dailyStats: Record<string, DayStats>; historyDate: string; setHistoryDate: (d: string) => void; todayStr: string }) {
  const hs = dailyStats[d2k(historyDate)] ?? null;
  return (
    <>
      <header className="header"><h1>历史记录</h1></header>
      <div className="history-date-picker">
        <input type="date" value={historyDate} onChange={(e) => setHistoryDate(e.target.value)} max={todayStr} />
      </div>
      {hs ? (
        <section className="history-card">
          <div className="history-energy"><span className="history-energy-icon">{EICON[hs.energy]}</span><span className="history-energy-label">{ELABEL[hs.energy]}</span></div>
          <div className="history-stats-grid">
            <div className="history-stat"><span className="history-stat-value">{hs.completedTasks}</span><span className="history-stat-label">完成任务</span></div>
            <div className="history-stat"><span className="history-stat-value">{hs.minimalActionCount}</span><span className="history-stat-label">最小行动</span></div>
            <div className="history-stat"><span className="history-stat-value">+{hs.xpGained}</span><span className="history-stat-label">获得 XP</span></div>
          </div>
          {hs.timeMinutes && (
            <div className="history-time-dist">
              <div className="history-time-title">时间分配</div>
              <div className="history-time-grid">{TCATS.map((c) => (
                <div key={c.t} className="history-time-cell"><span className="history-time-cell-icon">{c.i} {c.t}</span><span className="history-time-cell-value">{hs.timeMinutes[c.t] ?? 0} 分钟</span></div>
              ))}</div>
            </div>
          )}
        </section>
      ) : (
        <p className="history-empty">该日期暂无数据</p>
      )}
    </>
  );
}