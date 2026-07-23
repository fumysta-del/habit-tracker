export function AchievementSeal({ icon, title, unlocked }: { icon: string; title: string; unlocked: boolean }) {
  const c = unlocked ? "var(--color-primary)" : "var(--color-text-muted)";
  const bg = unlocked ? "rgba(196,149,106,0.06)" : "transparent";
  return (
    <div className={"seal-wrap" + (unlocked ? "" : " locked")}>
      <svg viewBox="0 0 100 100" className="seal-svg">
        <circle cx="50" cy="50" r="46" fill={bg} stroke={c} strokeWidth="1.5" />
        <circle cx="50" cy="50" r="41" fill="none" stroke={c} strokeWidth="0.8" strokeDasharray="2.5,2.5" />
        <circle cx="50" cy="50" r="37" fill="none" stroke={c} strokeWidth="0.4" />
        <text x="50" y="38" textAnchor="middle" fontSize="22" fill={c}>{unlocked ? icon : "🔒"}</text>
        <text x="50" y="60" textAnchor="middle" fontSize="8.5" fontWeight="600" fill={c}>{title}</text>
      </svg>
    </div>
  );
}
