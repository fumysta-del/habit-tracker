import { AchievementSeal } from "./AchievementSeal";

export function SealWall({ seals }: { seals: { id: string; title: string; icon: string; unlocked: boolean }[] }) {
  return (
    <div className="seal-wall">
      <h3 className="profile-section-title">成长印章</h3>
      <div className="seal-grid">
        {seals.map((s) => (
          <AchievementSeal key={s.id} icon={s.icon} title={s.title} unlocked={s.unlocked} />
        ))}
      </div>
    </div>
  );
}
