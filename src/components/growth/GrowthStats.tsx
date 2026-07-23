export function GrowthStats({ level, xp, streak, completed }: { level: number; xp: number; streak: number; completed: number }) {
  return (
    <div className="growth-stats">
      <div className="gs-item"><span className="gs-value">{level}</span><span className="gs-label">等级</span></div>
      <div className="gs-item"><span className="gs-value">{xp}</span><span className="gs-label">总经验</span></div>
      <div className="gs-item"><span className="gs-value">{streak}</span><span className="gs-label">连续</span></div>
      <div className="gs-item"><span className="gs-value">{completed}</span><span className="gs-label">完成</span></div>
    </div>
  );
}