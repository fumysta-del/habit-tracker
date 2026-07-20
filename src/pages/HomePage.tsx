import { EnergyCard } from "../components/EnergyCard";
import { LevelCard } from "../components/LevelCard";
import { DailySummary } from "../components/DailySummary";
import type { DayStats } from "../storage";

interface HomePageProps {
  energy: string; setEnergy: (e: "low" | "normal" | "high") => void;
  level: number; currentLevelXp: number; progressPercent: number;
  todayStats: DayStats; streak: number;
}

export function HomePage(p: HomePageProps) {
  return (
    <>
      <header className="header">
        <h1>今日行动</h1>
        <p className="subtitle">{p.streak > 0 ? p.streak + "天持续行动" : "开始今天的行动吧"}</p>
      </header>
      <EnergyCard energy={p.energy} onChange={p.setEnergy} />
      <LevelCard level={p.level} currentLevelXp={p.currentLevelXp} progressPercent={p.progressPercent} />
      <DailySummary
        completedTasks={p.todayStats.completedTasks}
        minimalActionCount={p.todayStats.minimalActionCount}
        xpGained={p.todayStats.xpGained}
        streak={p.streak}
      />
      {/* Placeholder: DailyThemeBanner (future) */}
      {/* Placeholder: ProgressArc (future) */}
      {/* Placeholder: Personal Media Background (future) */}
    </>
  );
}