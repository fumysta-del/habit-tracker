import type { DayStats } from "../storage";
import { CharacterCard } from "../components/profile/CharacterCard";
import { SealWall } from "../components/profile/SealWall";
import { ProfileStats } from "../components/profile/ProfileStats";
import { AttributePanel } from "../components/growth/AttributePanel";

interface ProfilePageProps {
  level: number; xp: number; streak: number;
  dailyStats: Record<string, DayStats>;
  weeklyStats: { totalTime: Record<string,number>; totalTasks: number; totalActions: number; energyCounts: Record<string,number>; hasData: boolean };
}

export function ProfilePage(p: ProfilePageProps) {
  const w = p.weeklyStats;
  const totalCompleted = Object.values(p.dailyStats).reduce((s, d) => s + (d.completedTasks ?? 0), 0);

  const focus = Math.min(100, Math.round(((w.totalTime["学习"] ?? 0) / 420) * 100));
  const eLow = w.energyCounts.low ?? 0;
  const eNorm = w.energyCounts.normal ?? 0;
  const eHigh = w.energyCounts.high ?? 0;
  const eTotal = eLow + eNorm + eHigh;
  const energy = eTotal > 0 ? Math.round((eLow * 30 + eNorm * 60 + eHigh * 90) / eTotal) : 50;
  const creativity = Math.min(100, Math.round(w.totalActions * 5));
  const discipline = Math.round(Math.min(100, w.totalTasks * 10) * 0.5 + Math.min(100, p.streak * 5) * 0.5);

  const seals = [
    { id: "persist", title: "坚持者", icon: "🔥", unlocked: p.streak >= 7 },
    { id: "actor", title: "行动者", icon: "⚡", unlocked: totalCompleted >= 50 },
    { id: "learner", title: "深度学习", icon: "📚", unlocked: focus >= 80 },
    { id: "energy", title: "高能状态", icon: "✦", unlocked: energy >= 80 },
    { id: "grower", title: "成长者", icon: "🌱", unlocked: p.level >= 10 },
    { id: "creator", title: "创造者", icon: "💡", unlocked: false },
  ];

  return (
    <div className="profile-page">
      <header className="profile-header">
        <span className="profile-badge">角色档案</span>
      </header>
      <CharacterCard level={p.level} xp={p.xp} />
      <AttributePanel focus={focus} discipline={discipline} energy={energy} creativity={creativity} />
      <SealWall seals={seals} />
      <ProfileStats streak={p.streak} completed={totalCompleted} focus={focus} discipline={discipline} />
    </div>
  );
}