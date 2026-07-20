export function BottomNav({ activeTab, onChange }: { activeTab: string; onChange: (t: "home" | "tasks" | "growth" | "profile") => void }) {
  const tabs = [
    { key: "home" as const, label: "首页" },
    { key: "tasks" as const, label: "任务" },
    { key: "growth" as const, label: "成长" },
    { key: "profile" as const, label: "个人" },
  ];
  return (
    <nav className="bottom-nav">
      {tabs.map((t) => (
        <button key={t.key} className={"nav-btn" + (activeTab === t.key ? " active" : "")} onClick={() => onChange(t.key)}>
          {t.label}
        </button>
      ))}
    </nav>
  );
}