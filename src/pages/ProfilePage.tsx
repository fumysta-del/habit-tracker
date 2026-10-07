import type { DayStats } from "../storage";
import { LanguageLearningCard } from "../components/profile/LanguageLearningCard";
import { ParticleColorSetting } from "../components/profile/ParticleColorSetting";
import { AttributePanel } from "../components/growth/AttributePanel";
import { CharacterCard } from "../components/profile/CharacterCard";

interface ProfilePageProps {
  level: number; xp: number; streak: number;
  dailyStats: Record<string, DayStats>;
  weeklyStats: { totalTime: Record<string,number>; totalTasks: number; totalActions: number; energyCounts: Record<string,number>; hasData: boolean };
  attrBonuses: Record<string,number>;
}

export function ProfilePage(p: ProfilePageProps) {
  const w = p.weeklyStats;

  const focus = Math.min(100, Math.round(((w.totalTime["学习"] ?? 0) / 420) * 100));
  const focusBonus = p.attrBonuses?.focus ?? 0;
  const disciplineBonus = p.attrBonuses?.discipline ?? 0;
  const energyBonus = p.attrBonuses?.energy ?? 0;
  const creativityBonus = p.attrBonuses?.creativity ?? 0;
  const eLow = w.energyCounts.low ?? 0;
  const eNorm = w.energyCounts.normal ?? 0;
  const eHigh = w.energyCounts.high ?? 0;
  const eTotal = eLow + eNorm + eHigh;
  const energy = eTotal > 0 ? Math.round((eLow * 30 + eNorm * 60 + eHigh * 90) / eTotal) : 50;
  const creativity = Math.min(100, Math.round(w.totalActions * 5));
  const discipline = Math.round(Math.min(100, w.totalTasks * 10) * 0.5 + Math.min(100, p.streak * 5) * 0.5);


  return (
    <div className="profile-page">
      <header className="profile-header">
        <span className="profile-badge">角色档案</span>
      </header>
      <CharacterCard level={p.level} xp={p.xp} />
      <AttributePanel title="能力值" focus={Math.min(100, focus + focusBonus)} discipline={Math.min(100, discipline + disciplineBonus)} energy={Math.min(100, energy + energyBonus)} creativity={Math.min(100, creativity + creativityBonus)} />
      <LanguageLearningCard />
      <ParticleColorSetting />
    </div>
  );
}
