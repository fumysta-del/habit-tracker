export function ProfileStats({ streak, completed, focus, discipline }: {
  streak: number; completed: number; focus: number; discipline: number;
}) {
  const items = [
    { label: "连续天数", value: streak },
    { label: "完成任务", value: completed },
    { label: "专注", value: focus },
    { label: "自律", value: discipline },
  ];
  return (
    <div className="profile-stats">
      <h3 className="profile-section-title">数据统计</h3>
      <div className="ps-grid">
        {items.map((it) => (
          <div key={it.label} className="ps-item">
            <span className="ps-value">{it.value}</span>
            <span className="ps-label">{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
