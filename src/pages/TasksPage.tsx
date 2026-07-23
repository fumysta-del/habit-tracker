import { getLocalDateString } from "../storage";
import { QuestRoadmap } from "../components/tasks/QuestRoadmap";
import { DailyActions } from "../components/DailyActions";
import { ActionRecords } from "../components/ActionRecords";
import { TimeTracker } from "../components/TimeTracker";
import { TaskInput } from "../components/TaskInput";
import type { Task, DailyTaskRecord, MinimalRecord, DayStats } from "../storage";

interface TasksPageProps {
  tasks: Task[]; input: string; setInput: (v: string) => void;
  addTask: () => void; toggleTask: (id: number) => void; deleteTask: (id: number) => void;
  doMinimalAction: (a: string) => void;
  dailyTaskRecords: Record<string, DailyTaskRecord[]>;
  todayRecords: MinimalRecord[]; deleteRecord: (id: number) => void;
  todayStats: DayStats;
  isRunning: (t: string) => boolean; startTimer: (t: string) => void; stopTimer: (t: string) => void;
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
          <span className="quest-badge">TODAY'S QUEST</span>
          <span className="quest-chapter">Chapter 05</span>
        </div>
        <div className="quest-progress">
          <span className="quest-progress-text">{completedCount}/{p.tasks.length} Quests Complete</span>
          <div className="quest-progress-bar">
            <div className="quest-progress-fill" style={{ width: pct + "%" }} />
          </div>
        </div>
      </header>

      <QuestRoadmap tasks={p.tasks} completions={todayCompletions} onToggle={p.toggleTask} />

      <div className="quest-actions-section">
        <h3 className="quest-section-title">Quick Actions</h3>
        <DailyActions onClick={p.doMinimalAction} />
        <ActionRecords records={p.todayRecords} onDelete={p.deleteRecord} />
      </div>

      <div className="quest-add-section">
        <h3 className="quest-section-title">Create New Quest</h3>
        <TaskInput value={p.input} onChange={p.setInput} onAdd={p.addTask} />
      </div>

      <div className="quest-time-section">
        <TimeTracker timeMinutes={p.todayStats.timeMinutes} isRunning={p.isRunning} onStart={p.startTimer} onStop={p.stopTimer} />
      </div>
    </div>
  );
}