const EICON: Record<string, string> = { low: "(( _ _ ))..zzzZZ", normal: "＜コ:彡", high: "^ ^" };
const ELABEL: Record<string, string> = { low: "低能量", normal: "普通", high: "高能量" };
const TCATS = [{ t: "游戏", i: "🎮" }, { t: "学习", i: "📚" }, { t: "运动", i: "🏃" }, { t: "休息", i: "🛌" }];
function fmtMin(m: number) { const h = Math.floor(m / 60); const r = m % 60; return h > 0 ? `${h}小时${r}分钟` : `${r}分钟`; }
interface WData { dateRange: string; totalTasks: number; totalActions: number; totalXp: number; streak: number; dominantEnergy: string; energyCounts: Record<string,number>; energyPct: Record<string,number>; totalTime: Record<string,number>; trends: Array<{ dateKey: string; date: string; xp: number; tasks: number; hasData: boolean }>; hasData: boolean }
export function WeeklyPage({ weeklyStats: w }: { weeklyStats: WData }) {
  if (!w.hasData) return <><header className="header"><h1>周报</h1></header><p className="weekly-empty">暂无历史数据</p></>;
  return (<>
    <header className="header"><h1>周报</h1></header>
    <section className="weekly-period">{w.dateRange}</section>
    <section className="weekly-card"><h2 className="weekly-card-title">本周概览</h2>
      <div className="weekly-grid">
        <div className="weekly-stat"><span className="weekly-stat-value">{w.totalTasks}</span><span className="weekly-stat-label">完成任务</span></div>
        <div className="weekly-stat"><span className="weekly-stat-value">{w.totalActions}</span><span className="weekly-stat-label">最小行动</span></div>
        <div className="weekly-stat"><span className="weekly-stat-value">+{w.totalXp}</span><span className="weekly-stat-label">获得 XP</span></div>
        <div className="weekly-stat"><span className="weekly-stat-value">{w.streak} 天</span><span className="weekly-stat-label">连续行动</span></div>
      </div></section>
    <section className="weekly-card"><h2 className="weekly-card-title">状态分析</h2>
      <div className="weekly-energy-row"><span className="weekly-energy-icon">{EICON[w.dominantEnergy]}</span><span>本周平均：{ELABEL[w.dominantEnergy]}</span></div>
      <div className="weekly-energy-bars">{["low","normal","high"].map((k) => (<div key={k} className="weekly-energy-bar-row">
        <span className="weekly-energy-bar-label">{ELABEL[k]}</span>
        <div className="weekly-energy-bar-track"><div className={`weekly-energy-bar-fill ${k}`} style={{width: w.energyPct[k] + "%"}} /></div>
        <span className="weekly-energy-bar-num">{w.energyCounts[k]}天</span>
      </div>))}</div></section>
    <section className="weekly-card"><h2 className="weekly-card-title">时间分配</h2>
      <div className="weekly-time-list">{TCATS.map((c) => (<div key={c.t} className="weekly-time-item"><span className="weekly-time-cat">{c.i} {c.t}</span><span className="weekly-time-value">{fmtMin(w.totalTime[c.t] ?? 0)}</span></div>))}</div></section>
    <section className="weekly-card"><h2 className="weekly-card-title">每日趋势</h2>
      <div className="weekly-trend-list">{w.trends.map((t) => (<div key={t.dateKey} className={"weekly-trend-item" + (t.hasData ? "" : " empty")}><span className="weekly-trend-date">{t.date}</span><span className="weekly-trend-xp">+{t.xp}XP</span><span className="weekly-trend-tasks">{t.tasks}个任务</span></div>))}</div></section>
  </>);
}