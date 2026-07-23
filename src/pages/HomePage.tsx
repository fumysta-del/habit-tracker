import { EnergyStatusCard } from "../components/EnergyStatusCard";
import { DailyActions } from "../components/DailyActions";
import { ActionRecords } from "../components/ActionRecords";
import { TaskInput } from "../components/TaskInput";
import { TimeTracker } from "../components/TimeTracker";
import { useState } from "react";
import { ActionHintMarquee } from "../components/action/ActionHintMarquee";
import type { Task, DayStats, DailyTaskRecord, MinimalRecord } from "../storage";

interface HomePageProps {
  energy: string; setEnergy: (e: "low" | "normal" | "high") => void;
  level: number; currentLevelXp: number; progressPercent: number;
  todayStats: DayStats; streak: number; totalTasks: number;
  tasks: Task[]; toggleTask: (id: number) => void;
  dailyTaskRecords: Record<string, DailyTaskRecord[]>;
  doMinimalAction: (a: string) => void;
  input: string; setInput: (v: string) => void; addTask: () => void;
  todayRecords: MinimalRecord[]; deleteRecord: (id: number) => void;
  onEvaluateAction: (text: string) => void;
  isRunning: (t: string) => boolean; startTimer: (t: string) => void; stopTimer: (t: string) => void;
}

function fmtDate(): string {
  const d = new Date();
  const w = ["日","一","二","三","四","五","六"];
  return (d.getMonth()+1) + "月" + d.getDate() + "日 星期" + w[d.getDay()];
}

export function HomePage(p: HomePageProps) {
  const [evalInput, setEvalInput] = useState("");
  const [evalFocused, setEvalFocused] = useState(false);
  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-date">{fmtDate()}</div>
        <EnergyStatusCard energy={p.energy} onChange={p.setEnergy} />
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

      <section className="eval-section">
        <h3 className="section-title">璁板綍浠婃棩琛屽姩</h3>
        <ActionHintMarquee isFocused={evalFocused} hasInput={evalInput.length > 0} />
        <div className="eval-input-row">
          <input
            type="text"
            className="eval-input"
            placeholder="浠婂ぉ瀹屾垚浜嗕粈涔堬紵"
            value={evalInput}
            onChange={(e) => setEvalInput(e.target.value)}
            onFocus={() => setEvalFocused(true)}
            onBlur={() => setEvalFocused(false)}
            onKeyDown={(e) => { if (e.key === "Enter" && evalInput.trim()) { p.onEvaluateAction(evalInput.trim()); setEvalInput(""); } }}
          />
          <button
            className="eval-submit-btn"
            disabled={!evalInput.trim()}
            onClick={() => { if (evalInput.trim()) { p.onEvaluateAction(evalInput.trim()); setEvalInput(""); } }}
          >
            琛屽姩璇勪及
          </button>
        </div>
      </section>

      <section className="home-quick">
        <h3 className="section-title">快速操作</h3>
        <DailyActions onClick={p.doMinimalAction} />
        <ActionRecords records={p.todayRecords} onDelete={p.deleteRecord} />
        <TaskInput value={p.input} onChange={p.setInput} onAdd={p.addTask} />
        <TimeTracker timeMinutes={p.todayStats.timeMinutes} isRunning={p.isRunning} onStart={p.startTimer} onStop={p.stopTimer} />
      </section>
    </div>
  );
}