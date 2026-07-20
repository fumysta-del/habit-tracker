import { LevelHero } from "../components/LevelHero";
import { ActivityRing } from "../components/ActivityRing";
import { EnergyIndicator } from "../components/EnergyIndicator";
import type { DayStats } from "../storage";

interface HomePageProps {
  energy: string; setEnergy: (e: "low" | "normal" | "high") => void;
  level: number; currentLevelXp: number; progressPercent: number;
  todayStats: DayStats; streak: number; totalTasks: number;
}

export function HomePage(p: HomePageProps) {
  const totalMinutes = Object.values(p.todayStats.timeMinutes ?? {}).reduce((a: number, b: number) => a + b, 0);
  return (
    <>
      <LevelHero level={p.level} currentLevelXp={p.currentLevelXp} progressPercent={p.progressPercent} />
      <EnergyIndicator energy={p.energy} onChange={p.setEnergy} />
      <ActivityRing
        completedTasks={p.todayStats.completedTasks}
        totalCount={p.totalTasks}
        minimalActionCount={p.todayStats.minimalActionCount}
        totalMinutes={totalMinutes}
      />
    </>
  );
}