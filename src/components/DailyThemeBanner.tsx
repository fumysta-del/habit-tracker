const THEMES = [
  { text: "安静专注", emoji: "🌿" },
  { text: "保持节奏", emoji: "🎵" },
  { text: "持续前进", emoji: "🚀" },
  { text: "享受过程", emoji: "☕" },
  { text: "小步快跑", emoji: "🏃" },
  { text: "深度工作", emoji: "🎯" },
  { text: "善待自己", emoji: "💚" },
  { text: "今日有风", emoji: "🍃" },
];

const INDEX = Math.floor(Date.now() / 86400000) % THEMES.length;

export function DailyThemeBanner() {
  return (
    <div className="theme-banner">
      <span className="theme-banner-emoji">{THEMES[INDEX].emoji}</span>
      <span className="theme-banner-text">今日主题：{THEMES[INDEX].text}</span>
    </div>
  );
}