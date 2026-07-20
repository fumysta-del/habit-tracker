import { TaskInput } from "../components/TaskInput";
import { TaskList } from "../components/TaskList";
import { DailyActions } from "../components/DailyActions";
import type { Task, DailyTaskRecord } from "../storage";

interface TasksPageProps {
  tasks: Task[]; input: string; setInput: (v: string) => void;
  addTask: () => void; toggleTask: (id: number) => void; deleteTask: (id: number) => void;
  doMinimalAction: (a: string) => void;
  dailyTaskRecords: Record<string, DailyTaskRecord[]>;
}

export function TasksPage(p: TasksPageProps) {
  const today = new Date().toISOString().split("T")[0];
  const todayRecords = p.dailyTaskRecords[today] ?? [];
  const tasksWithCompletion = p.tasks.map((t) => ({
    ...t,
    completed: todayRecords.some((r) => r.taskId === t.id && r.completed),
  }));
  const completedCount = tasksWithCompletion.filter((t) => t.completed).length;

  return (
    <>
      <header className="header"><h1>今日任务</h1><p className="subtitle">{completedCount}/{p.tasks.length} 已完成</p></header>
      <DailyActions onClick={p.doMinimalAction} />
      <TaskInput value={p.input} onChange={p.setInput} onAdd={p.addTask} />
      <TaskList tasks={tasksWithCompletion} onToggle={p.toggleTask} onDelete={p.deleteTask} />
    </>
  );
}