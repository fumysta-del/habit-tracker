import { getLocalDateString } from "../storage";
import { QuestRoadmap } from "../components/tasks/QuestRoadmap";
import { type EvalLogEntry } from "../utils/actionEvaluator";
import type { Task, DailyTaskRecord } from "../storage";

interface TasksPageProps {
  growthEvents: EvalLogEntry[];
  tasks: Task[];
  dailyTaskRecords: Record<string, DailyTaskRecord[]>;
  toggleTask: (id: number) => void; deleteTask: (id: number) => void;
}

export function TasksPage(p: TasksPageProps) {
  const today = getLocalDateString();
  const todayCompletions = p.dailyTaskRecords[today] ?? [];
  const completedCount = todayCompletions.filter((r) => r.completed).length;
  const pct = p.tasks.length > 0 ? Math.round((completedCount / p.tasks.length) * 100) : 0;

  return (
    <div className="quest-page">
      <header className="quest-header">
        <div className="quest-header-top">
          <span className="quest-badge">今日任务</span>
          <span className="quest-chapter">第 05 章</span>
        </div>
        <div className="quest-progress">
          <span className="quest-progress-text">{completedCount}/{p.tasks.length} 任务完成</span>
          <div className="quest-progress-bar">
            <div className="quest-progress-fill" style={{ width: pct + "%" }} />
          </div>
        </div>
      </header>
      <QuestRoadmap tasks={p.tasks} completions={todayCompletions} growthEvents={p.growthEvents} onToggle={p.toggleTask} onDelete={p.deleteTask} />
    </div>
  );
}
