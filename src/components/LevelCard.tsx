export function LevelCard({ level, currentLevelXp, progressPercent }: { level: number; currentLevelXp: number; progressPercent: number }) {
  return (
    <section className="level-section">
      <div className="level-header">
        <span className="level-badge">Lv.{level}</span>
        <span className="xp-text">{currentLevelXp} / 100 XP</span>
      </div>
      <div className="xp-bar">
        <div className="xp-bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>
    </section>
  );
}