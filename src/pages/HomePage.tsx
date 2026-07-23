import type { Task, DayStats, DailyTaskRecord } from "../storage";

interface HomePageProps {
  level: number; currentLevelXp: number; progressPercent: number;
  todayStats: DayStats; streak: number; totalTasks: number;
  tasks: Task[]; toggleTask: (id: number) => void;
  dailyTaskRecords: Record<string, DailyTaskRecord[]>;
}

function fmtDate(): string {
  const d = new Date();
  const w = ["日","一","二","三","四","五","六"];
  return (d.getMonth()+1) + "月" + d.getDate() + "日 星期" + w[d.getDay()];
}

export function HomePage(p: HomePageProps) {
  const today = new Date();
  const todayKey = today.getFullYear() + "-" +
    String(today.getMonth()+1).padStart(2,"0") + "-" +
    String(today.getDate()).padStart(2,"0");
  const todayCompletion = p.dailyTaskRecords[todayKey] ?? [];
  const defaults = ["运动10分钟","学习30分钟","整理桌面"];

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-date">{fmtDate()}</div>
        <div className="home-level-area">
          <span className="home-level-label">L E V E L</span>
          <div className="home-level-number">{p.level}</div>
          <div className="home-xp-bar">
            <div className="home-xp-track">
              <div className="home-xp-fill" style={{ width: Math.min(p.progressPercent, 100) + "%" }} />
            </div>
          </div>
          <div className="home-xp-text">{p.currentLevelXp} / 100 XP</div>
        </div>
        <div className="home-streak">🔥 {p.streak} 天连续</div>
      </header>

      <div className="home-tasks">
        <h3 className="home-tasks-title">今日行动</h3>
        {p.tasks.filter((t) => defaults.indexOf(t.text) >= 0).map((task) => {
          const done = todayCompletion.some((r) => r.taskId === task.id && r.completed);
          return (
            <div key={task.id} className={"home-task-card" + (done ? " done" : "")}
              onClick={() => p.toggleTask(task.id)}>
              <div className="home-task-info">
                <span className="home-task-name">{task.text}</span>
                <span className="home-task-xp">+{task.xp} XP</span>
              </div>
              <div className={"home-task-circle" + (done ? " checked" : "")}>
                {done && <svg width="14" height="14" viewBox="0 0 14 14">
                  <path d="M3 7L6 10L11 4" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}