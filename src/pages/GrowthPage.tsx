import type { DailyTaskRecord, DayStats, MinimalRecord, Task } from "../storage";
import { GrowthStats } from "../components/growth/GrowthStats";
import { WeeklyGrowth } from "../components/growth/WeeklyGrowth";

const EICON: Record<string, string> = { low: "(( _ _ ))..zzzZZ", normal: "＜コ:彡", high: "^ ^" };
const ELABEL: Record<string, string> = { low: "低能量", normal: "普通", high: "高能量" };
const TCATS = [{ t: "游戏", i: "🎮" }, { t: "学习", i: "📚" }, { t: "运动", i: "🏃" }, { t: "休息", i: "🛌" }];
function d2k(i: string) { const [y,m,d] = i.split("-").map(Number); return new Date(y,m-1,d).toDateString(); }
function formatHistoryDate(input: string) {
  const [year, month, day] = input.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });
}

interface GrowthPageProps {
  dailyStats: Record<string, DayStats>; historyDate: string; setHistoryDate: (d: string) => void; todayStr: string;
  tasks: Task[]; dailyTaskRecords: Record<string, DailyTaskRecord[]>; dailyRecords: Record<string, MinimalRecord[]>;
  xp: number; level: number; streak: number;
}

export function GrowthPage(p: GrowthPageProps) {
  const historyKey = d2k(p.historyDate);
  const hs = p.dailyStats[historyKey] ?? null;
  const todayKey = new Date().toDateString();
  const todayDone = p.dailyStats[todayKey]?.completedTasks ?? 0;
  const completedTaskRecords = (p.dailyTaskRecords[p.historyDate] ?? []).filter((record) => record.completed);
  const selectedActions = p.dailyRecords[historyKey] ?? [];
  const completedTasks = completedTaskRecords
    .map((record) => p.tasks.find((task) => task.id === record.taskId))
    .filter((task): task is Task => Boolean(task));
  const hasDetails = completedTasks.length > 0 || selectedActions.length > 0;
  const hasHistory = Boolean(hs) || completedTaskRecords.length > 0 || selectedActions.length > 0;
  const hasCompleteTaskDetails = completedTasks.length === completedTaskRecords.length
    && completedTaskRecords.length === (hs?.completedTasks ?? completedTaskRecords.length);
  const hasCompleteActionDetails = selectedActions.length === (hs?.minimalActionCount ?? selectedActions.length);
  const canCalculateDayXp = hasDetails && hasCompleteTaskDetails && hasCompleteActionDetails;
  const exactDayXp = completedTasks.reduce((sum, task) => sum + task.xp, 0)
    + selectedActions.reduce((sum, record) => sum + record.xp, 0);
  const displayedTaskCount = hs?.completedTasks ?? completedTaskRecords.length;
  const displayedActionCount = hs?.minimalActionCount ?? selectedActions.length;

  return (
    <div className="growth-root">
      <header className="growth-header">
        <span className="growth-badge">角色成长</span>
      </header>

      <div className="growth-rank" aria-label={`当前等级 ${p.level}，总经验 ${p.xp} XP`}>
        <span className="growth-rank-level">Lv. {p.level}</span>
        <span className="growth-rank-xp">{p.xp} XP</span>
      </div>

      <GrowthStats level={p.level} xp={p.xp} streak={p.streak} completed={todayDone} />

      <WeeklyGrowth dailyStats={p.dailyStats} selectedDate={p.historyDate} onSelectDate={p.setHistoryDate} />

      <h2 className="section-title">历史回顾</h2>
      <div className="history-date-picker">
        <input type="date" value={p.historyDate} onChange={(e) => p.setHistoryDate(e.target.value)} max={p.todayStr} />
      </div>
      {hasHistory ? (
        <section className="history-card">
          <div className="history-card-date">{formatHistoryDate(p.historyDate)}</div>
          {hs && <div className="history-energy"><span className="history-energy-icon">{EICON[hs.energy]}</span><span className="history-energy-label">{ELABEL[hs.energy]}</span></div>}
          {hasDetails && (
            <div className="history-record-list">
              {completedTasks.map((task) => (
                <div key={`task-${task.id}`} className="history-record-item"><span className="history-record-check">✓</span><span>{task.text}</span></div>
              ))}
              {selectedActions.map((record) => (
                <div key={`action-${record.id}`} className="history-record-item"><span className="history-record-check">✓</span><span>{record.action}</span></div>
              ))}
            </div>
          )}
          <div className={`history-stats-grid${canCalculateDayXp ? "" : " two"}`}>
            <div className="history-stat"><span className="history-stat-value">{displayedTaskCount}</span><span className="history-stat-label">完成任务</span></div>
            <div className="history-stat"><span className="history-stat-value">{displayedActionCount}</span><span className="history-stat-label">完成行动</span></div>
            {canCalculateDayXp && <div className="history-stat"><span className="history-stat-value">+{exactDayXp}</span><span className="history-stat-label">获得 XP</span></div>}
          </div>
          {hs?.timeMinutes && (
            <div className="history-time-dist">
              <div className="history-time-title">时间分配</div>
              <div className="history-time-grid">{TCATS.map((c) => (
                <div key={c.t} className="history-time-cell"><span className="history-time-cell-icon">{c.i} {c.t}</span><span className="history-time-cell-value">{hs.timeMinutes[c.t] ?? 0} 分钟</span></div>
              ))}</div>
            </div>
          )}
        </section>
      ) : (<p className="history-empty">这一天还没有成长记录</p>)}
    </div>
  );
}
