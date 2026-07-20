import { EnergyCard } from "../components/EnergyCard";
import { LevelCard } from "../components/LevelCard";
import { DailySummary } from "../components/DailySummary";
import { TimeTracker } from "../components/TimeTracker";
import { DailyActions } from "../components/DailyActions";
import { ActionRecords } from "../components/ActionRecords";
import { TaskInput } from "../components/TaskInput";
import { TaskList } from "../components/TaskList";
import type { Task, MinimalRecord, DayStats } from "../storage";
interface TodayPageProps {
  energy: string; setEnergy: (e: "low" | "normal" | "high") => void;
  level: number; currentLevelXp: number; progressPercent: number;
  todayStats: DayStats; streak: number;
  isRunning: (t: string) => boolean; startTimer: (t: string) => void; stopTimer: (t: string) => void;
  todayRecords: MinimalRecord[]; deleteRecord: (id: number) => void;
  doMinimalAction: (a: string) => void;
  tasks: Task[]; input: string; setInput: (v: string) => void;
  addTask: () => void; toggleTask: (id: number) => void; deleteTask: (id: number) => void;
  getTaskXp: (t: string) => number;
}
export function TodayPage(p: TodayPageProps) {
  return (
    <>
      <header className="header"><h1>今日行动</h1><p className="subtitle">{p.todayStats.completedTasks}/{p.tasks.length} 已完成</p></header>
      <EnergyCard energy={p.energy} onChange={p.setEnergy} />
      <LevelCard level={p.level} currentLevelXp={p.currentLevelXp} progressPercent={p.progressPercent} />
      <DailySummary completedTasks={p.todayStats.completedTasks} minimalActionCount={p.todayStats.minimalActionCount} xpGained={p.todayStats.xpGained} streak={p.streak} />
      <TimeTracker timeMinutes={p.todayStats.timeMinutes} isRunning={p.isRunning} onStart={p.startTimer} onStop={p.stopTimer} />
      <DailyActions onClick={p.doMinimalAction} />
      <ActionRecords records={p.todayRecords} onDelete={p.deleteRecord} />
      <TaskInput value={p.input} onChange={p.setInput} onAdd={p.addTask} />
      <TaskList tasks={p.tasks} onToggle={p.toggleTask} onDelete={p.deleteTask} getTaskXp={p.getTaskXp} />
    </>
  );
}