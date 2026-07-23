const MENU_ITEMS: { key: "home" | "tasks" | "growth" | "profile" | "settings"; label: string; icon: string }[] = [
  { key: "home" as const, label: "首页", icon: "⌂" },
  { key: "tasks" as const, label: "任务", icon: "⚔" },
  { key: "growth" as const, label: "成长", icon: "✦" },
  { key: "profile" as const, label: "个人", icon: "◉" },
  { key: "settings" as const, label: "设置", icon: "⚙" },
];

interface HamburgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: string;
  onNavigate: (tab: "home" | "tasks" | "growth" | "profile" | "settings") => void;
}

export function HamburgerMenu({ isOpen, onToggle, activeTab, onNavigate }: HamburgerMenuProps) {
  return (
    <>
      {/* hamburger button */}
      <button
        className={`hamburger-btn ${isOpen ? "open" : ""}`}
        onClick={onToggle}
        aria-label="菜单"
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      {/* overlay */}
      <div
        className={`hamburger-overlay ${isOpen ? "visible" : ""}`}
        onClick={onToggle}
      />

      {/* drawer */}
      <nav className={`hamburger-drawer ${isOpen ? "open" : ""}`}>
        <div className="hamburger-header">
          <span className="hamburger-title">导航</span>
        </div>
        <ul className="hamburger-list">
          {MENU_ITEMS.map((item) => (
            <li key={item.key}>
              <button
                className={`hamburger-item ${activeTab === item.key ? "active" : ""}`}
                onClick={() => {
                  onNavigate(item.key);
                  onToggle();
                }}
              >
                <span className="hamburger-item-icon">{item.icon}</span>
                <span className="hamburger-item-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
