const RINGS = [
  { key: "tasks", label: "完成任务", color: "var(--color-teal)", max: 5 },
  { key: "actions", label: "最小行动", color: "var(--color-gold)", max: 8 },
  { key: "time", label: "专注时间", color: "var(--color-energy-high)", max: 480 },
];

function fmtMin(m: number) {
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rest = m % 60;
    return h + "h" + (rest > 0 ? rest + "m" : "");
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
          const r = 33;
          const circumference = 2 * Math.PI * r;
          const offset = circumference - (pct / 100) * circumference;
          return (
            <div key={ring.key} className="activity-ring">
              <div className="activity-ring-visual">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-divider)" strokeWidth="5" />
                  <circle cx="40" cy="40" r={r} fill="none" stroke={ring.color} strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 40 40)"
                    className="activity-ring-arc"
                  />
                </svg>
                <span className="activity-ring-value number-mono">{v.display}</span>
              </div>
              <span className="activity-ring-label">{ring.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}