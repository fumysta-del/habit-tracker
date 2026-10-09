import type { ReactNode } from "react";
import {
  HomeIcon,
  TasksIcon,
  GrowthIcon,
  ProfileIcon,
  SettingsIcon,
  TreeclockIcon,
  ClassNoteIcon
} from "./icons/AppIcons";
const MENU_ITEMS: { key: "home" | "tasks" | "growth" | "profile" | "settings"; label: string; icon: ReactNode }[] = [
  { key: "home" as const, label: "首页", icon: <HomeIcon size={20} /> },
  { key: "tasks" as const, label: "任务", icon: <TasksIcon size={20} /> },
  { key: "growth" as const, label: "成长", icon: <GrowthIcon size={20} /> },
  { key: "profile" as const, label: "个人", icon: <ProfileIcon size={20} /> },
  { key: "settings" as const, label: "设置", icon: <SettingsIcon size={20} /> },
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
          <li>
            <a className="hamburger-item" href={`${import.meta.env.BASE_URL}pomodoro.html`}
               style={{ textDecoration: "none" }}>
              <span className="hamburger-item-icon"><TreeclockIcon size={20} /></span>
              <span className="hamburger-item-label">专注养树</span>
            </a>
          </li>          <li>
            <a className="hamburger-item" href={`${import.meta.env.BASE_URL}voice-asr/class.html`}
               style={{ textDecoration: "none" }}>
              <span className="hamburger-item-icon"><ClassNoteIcon size={20} /></span>
              <span className="hamburger-item-label">课堂记录</span>
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
}
