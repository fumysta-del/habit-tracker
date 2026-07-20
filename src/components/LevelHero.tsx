export function LevelHero({ level, currentLevelXp, progressPercent }: { level: number; currentLevelXp: number; progressPercent: number }) {
  return (
    <div className="level-hero">
      <div className="level-hero-bg">
        <div className="level-hero-content">
          <div className="level-hero-label">Level</div>
          <div className="level-hero-number">{level}</div>
          <div className="level-hero-bar">
            <div className="level-hero-bar-track">
              <div className="level-hero-bar-fill" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
            </div>
          </div>
          <div className="level-hero-xp">{currentLevelXp} / 100 XP</div>
        </div>
      </div>
    </div>
  );
}