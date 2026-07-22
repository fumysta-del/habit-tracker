import { getLocalDateString } from "../storage";
import { TaskInput } from "../components/TaskInput";
import { TaskList } from "../components/TaskList";
import { DailyActions } from "../components/DailyActions";
import { ActionRecords } from "../components/ActionRecords";
import { TimeTracker } from "../components/TimeTracker";
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
  const todayTaskRecords = p.dailyTaskRecords[today] ?? [];
  const tasksWithCompletion = p.tasks.map((t) => ({
    ...t,
    completed: todayTaskRecords.some((r) => r.taskId === t.id && r.completed),
  }));
  const completedCount = tasksWithCompletion.filter((t) => t.completed).length;

  return (
    <>
      <header className="header"><h1>今日任务</h1><p className="subtitle">{completedCount}/{p.tasks.length} 已完成</p></header>
      <DailyActions onClick={p.doMinimalAction} />
      <ActionRecords records={p.todayRecords} onDelete={p.deleteRecord} />
      <TaskInput value={p.input} onChange={p.setInput} onAdd={p.addTask} />
      <TaskList tasks={tasksWithCompletion} onToggle={p.toggleTask} onDelete={p.deleteTask} />
      <TimeTracker timeMinutes={p.todayStats.timeMinutes} isRunning={p.isRunning} onStart={p.startTimer} onStop={p.stopTimer} />
    </>
  );
}