const RINGS = [
  { key: "tasks", label: "完成任务", color: "var(--color-ring-task)", max: 5 },
  { key: "actions", label: "最小行动", color: "var(--color-ring-action)", max: 8 },
  { key: "time", label: "专注时间", color: "var(--color-ring-time)", max: 480 },
];

function fmtMin(m: number) {
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rest = m % 60;
    return rest > 0 ? h + "h" + rest + "m" : h + "h";
  }
  return m + "m";
}

export function ActivityRing({ completedTasks, totalCount, minimalActionCount, totalMinutes }: {
  completedTasks: number; totalCount: number; minimalActionCount: number; totalMinutes: number;
}) {
  const values: Record<string, { value: number; max: number; display: string }> = {
    tasks: { value: completedTasks, max: Math.max(totalCount, 1), display: String(completedTasks) },
    actions: { value: minimalActionCount, max: RINGS[1].max, display: String(minimalActionCount) },
    time: { value: totalMinutes, max: RINGS[2].max, display: fmtMin(totalMinutes) },
  };

  return (
    <div className="activity-rings-card">
      <div className="activity-rings">
        {RINGS.map((ring) => {
          const v = values[ring.key];
          const pct = Math.min((v.value / v.max) * 100, 100);
          const circumference = 2 * Math.PI * 36;
          const offset = circumference - (pct / 100) * circumference;
          return (
            <div key={ring.key} className="activity-ring">
              <div className="activity-ring-visual">
                <svg width="88" height="88" viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r="36" fill="none" stroke="var(--color-divider)" strokeWidth="6" />
                  <circle cx="44" cy="44" r="36" fill="none" stroke={ring.color} strokeWidth="6"
                    strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                    transform="rotate(-90 44 44)" style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                </svg>
                <span className="activity-ring-value">{v.display}</span>
              </div>
              <span className="activity-ring-label">{ring.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}