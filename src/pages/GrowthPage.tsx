import type { DayStats } from "../storage";
import { GrowthTree } from "../components/growth/GrowthTree";
import { GrowthStats } from "../components/growth/GrowthStats";

const EICON: Record<string, string> = { low: "(( _ _ ))..zzzZZ", normal: "＜コ:彡", high: "^ ^" };
const ELABEL: Record<string, string> = { low: "低能量", normal: "普通", high: "高能量" };
const TCATS = [{ t: "游戏", i: "🎮" }, { t: "学习", i: "📚" }, { t: "运动", i: "🏃" }, { t: "休息", i: "🛌" }];
function d2k(i: string) { const [y,m,d] = i.split("-").map(Number); return new Date(y,m-1,d).toDateString(); }
function fmtMin(m: number) { const h = Math.floor(m/60); const r = m%60; return h > 0 ? h+"小时"+r+"分钟" : r+"分钟"; }

interface WData { dateRange: string; totalTasks: number; totalActions: number; totalXp: number; streak: number; dominantEnergy: string; energyCounts: Record<string,number>; energyPct: Record<string,number>; totalTime: Record<string,number>; trends: Array<{dateKey:string;date:string;xp:number;tasks:number;hasData:boolean}>; hasData: boolean }

interface GrowthPageProps {
  dailyStats: Record<string, DayStats>; historyDate: string; setHistoryDate: (d: string) => void; todayStr: string;
  weeklyStats: WData;
  xp: number; level: number; streak: number;
}

export function GrowthPage(p: GrowthPageProps) {
  const w = p.weeklyStats;
  const hs = p.dailyStats[d2k(p.historyDate)] ?? null;
  const todayKey = new Date().toDateString();
  const todayDone = p.dailyStats[todayKey]?.completedTasks ?? 0;

  return (
    <div className="growth-root">
      <header className="growth-header">
        <span className="growth-badge">角色成长</span>
      </header>

      <GrowthStats level={p.level} xp={p.xp} streak={p.streak} completed={todayDone} />

      <GrowthTree xp={p.xp}  />

      <div className="growth-separator" />

      <h2 className="section-title">历史回顾</h2>
      <div className="history-date-picker">
        <input type="date" value={p.historyDate} onChange={(e) => p.setHistoryDate(e.target.value)} max={p.todayStr} />
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
      ) : (<p className="history-empty">该日期暂无数据</p>)}

      {w.hasData && (
        <>
          <h2 className="section-title">周报</h2>
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
              <div className="weekly-energy-bar-track"><div className={"weekly-energy-bar-fill "+k} style={{width:w.energyPct[k]+"%"}} /></div>
              <span className="weekly-energy-bar-num">{w.energyCounts[k]}天</span>
            </div>))}</div></section>
          <section className="weekly-card"><h2 className="weekly-card-title">时间分配</h2>
            <div className="weekly-time-list">{TCATS.map((c) => (<div key={c.t} className="weekly-time-item"><span className="weekly-time-cat">{c.i} {c.t}</span><span className="weekly-time-value">{fmtMin(w.totalTime[c.t] ?? 0)}</span></div>))}</div></section>
          <section className="weekly-card"><h2 className="weekly-card-title">每日趋势</h2>
            <div className="weekly-trend-list">{w.trends.map((t) => (<div key={t.dateKey} className={"weekly-trend-item"+(t.hasData?"":" empty")}><span className="weekly-trend-date">{t.date}</span><span className="weekly-trend-xp">+{t.xp}XP</span><span className="weekly-trend-tasks">{t.tasks}个任务</span></div>))}</div></section>
        </>
      )}
    </div>
  );
}