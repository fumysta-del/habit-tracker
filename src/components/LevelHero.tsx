export function LevelHero({ level, currentLevelXp, progressPercent }: { level: number; currentLevelXp: number; progressPercent: number }) {
  return (
    <div className="level-hero">
      <div className="level-hero-glow" />
      <div className="level-hero-content">
        <span className="level-hero-label">L E V E L</span>
        <div className="level-hero-number number-mono">{level}</div>
        <div className="level-hero-bar">
          <div className="level-hero-bar-track">
            <div className="level-hero-bar-fill" style={{ width: Math.min(progressPercent, 100) + "%" }} />
            <div className="level-hero-bar-glow" style={{ left: Math.min(progressPercent, 100) + "%" }} />
          </div>
        </div>
        <span className="level-hero-xp number-mono">
          {currentLevelXp} <span className="level-hero-xp-label">/ 100 XP</span>
        </span>
      </div>
    </div>
  );
}