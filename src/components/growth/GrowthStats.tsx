export function GrowthStats({ level, xp, streak, completed }: { level: number; xp: number; streak: number; completed: number }) {
  return (
    <div className="growth-stats">
      <div className="gs-item"><span className="gs-value">{level}</span><span className="gs-label">Level</span></div>
      <div className="gs-item"><span className="gs-value">{xp}</span><span className="gs-label">Total XP</span></div>
      <div className="gs-item"><span className="gs-value">{streak}</span><span className="gs-label">Streak</span></div>
      <div className="gs-item"><span className="gs-value">{completed}</span><span className="gs-label">Done</span></div>
    </div>
  );
}