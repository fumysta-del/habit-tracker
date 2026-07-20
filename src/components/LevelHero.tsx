export function LevelHero({ level, currentLevelXp, progressPercent }: { level: number; currentLevelXp: number; progressPercent: number }) {
  return (
    <div className="level-hero">
      <div className="level-hero-number">Lv.{level}</div>
      <div className="level-hero-bar">
        <div className="level-hero-bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="level-hero-xp">{currentLevelXp} / 100 XP</div>
    </div>
  );
}