import { TaskInput } from "../components/TaskInput";
import { TaskList } from "../components/TaskList";
import { DailyActions } from "../components/DailyActions";
import type { Task } from "../storage";

interface TasksPageProps {
  tasks: Task[]; input: string; setInput: (v: string) => void;
  addTask: () => void; toggleTask: (id: number) => void; deleteTask: (id: number) => void;
  getTaskXp: (t: string) => number;
  doMinimalAction: (a: string) => void;
}

export function TasksPage(p: TasksPageProps) {
  return (
    <>
      <header className="header"><h1>今日任务</h1><p className="subtitle">{p.tasks.filter(t=>t.completed).length}/{p.tasks.length} 已完成</p></header>
      <DailyActions onClick={p.doMinimalAction} />
      <TaskInput value={p.input} onChange={p.setInput} onAdd={p.addTask} />
      <TaskList tasks={p.tasks} onToggle={p.toggleTask} onDelete={p.deleteTask} getTaskXp={p.getTaskXp} />
    </>
  );
}