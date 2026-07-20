const RINGS = [
  { key: "tasks", label: "完成任务", color: "var(--color-ring-task)", max: 5 },
  { key: "actions", label: "最小行动", color: "var(--color-ring-action)", max: 8 },
  { key: "time", label: "专注时间", color: "var(--color-ring-time)", max: 480 },
];

function fmtMin(m: number) {
  if (m >= 60) return Math.floor(m / 60) + "h";
  return m + "m";
}

export function ActivityRing({ completedTasks, totalCount, minimalActionCount, totalMinutes }: {
  completedTasks: number; totalCount: number; minimalActionCount: number; totalMinutes: number;
}) {
  const values: Record<string, { value: number; max: number; display: string }> = {
    tasks: { value: completedTasks, max: Math.max(totalCount, 1), display: `${completedTasks}/${totalCount}` },
    actions: { value: minimalActionCount, max: RINGS[1].max, display: String(minimalActionCount) },
    time: { value: totalMinutes, max: RINGS[2].max, display: fmtMin(totalMinutes) },
  };

  return (
    <div className="activity-rings">
      {RINGS.map((ring) => {
        const v = values[ring.key];
        const pct = Math.min(Math.round((v.value / v.max) * 100), 100);
        return (
          <div key={ring.key} className="activity-ring">
            <div className="activity-ring-outer" style={{ background: `conic-gradient(${ring.color} 0% ${pct}%, var(--color-border) ${pct}% 100%)` }}>
              <div className="activity-ring-inner">
                <span className="activity-ring-value">{v.display}</span>
              </div>
            </div>
            <span className="activity-ring-label">{ring.label}</span>
          </div>
        );
      })}
    </div>
  );
}