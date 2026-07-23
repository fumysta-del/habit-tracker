export function CharacterCard({ level, xp }: { level: number; xp: number }) {
  return (
    <div className="char-card">
      <div className="char-avatar">
        <span className="char-avatar-letter">Y</span>
      </div>
      <div className="char-name">Yishu</div>
      <div className="char-level-row">
        <span className="char-level-label">Level</span>
        <span className="char-level-value">{level}</span>
      </div>
      <div className="char-xp">{xp} XP</div>
    </div>
  );
}
