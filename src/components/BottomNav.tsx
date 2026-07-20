export function BottomNav({ activeTab, onChange }: { activeTab: string; onChange: (t: "today" | "history" | "weekly") => void }) {
  return (
    <nav className="bottom-nav">
      <button className={`nav-btn ${activeTab === "today" ? "active" : ""}`} onClick={() => onChange("today")}>今日</button>
      <button className={`nav-btn ${activeTab === "weekly" ? "active" : ""}`} onClick={() => onChange("weekly")}>周报</button>
      <button className={`nav-btn ${activeTab === "history" ? "active" : ""}`} onClick={() => onChange("history")}>历史</button>
    </nav>
  );
}
