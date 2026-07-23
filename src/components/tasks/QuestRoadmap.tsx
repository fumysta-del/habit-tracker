import type { Task, DailyTaskRecord } from "../../storage";

interface Props {
  tasks: Task[];
  completions: DailyTaskRecord[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

export function QuestRoadmap({ tasks, completions, onToggle, onDelete }: Props) {
  // Stable identity: compute status from props only, no internal state
  const doneIds = new Set(completions.filter((r) => r.completed).map((r) => r.taskId));
  const nodes = tasks.map((t) => ({ id: t.id, title: t.text, xp: t.xp, done: doneIds.has(t.id) }));
  const firstAvail = nodes.findIndex((n) => !n.done);

  if (nodes.length === 0) {
    return <p className="quest-empty">还没有任务，开始你的冒险吧</p>;
  }

  return (
    <div className="quest-roadmap">
      {nodes.map((n, i) => {
        const status = n.done ? "completed" : i === firstAvail ? "current" : "available";
        // Only allow delete for non-default tasks (DEFAULT_TASKS use ids 1,2,3)
        const canDelete = n.id > 3;

        return (
          <div key={n.id} className={"quest-row" + (i % 2 === 0 ? " left" : " right")}>
            <div className="quest-line" />
            <div className={"quest-node " + status} onClick={() => onToggle(n.id)}>
              <div className="quest-circle">
                {status === "completed" && (
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M6 13l3 3 9-9" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {status === "current" && <span className="quest-current-icon">✦</span>}
                {status === "available" && <span className="quest-avail-dot" />}
              </div>
              <div className="quest-label-row">
                <span className="quest-label">{n.title}</span>
                {canDelete && (
                  <button className="quest-delete" onClick={(e) => { e.stopPropagation(); onDelete(n.id); }} title="删除任务">×</button>
                )}
              </div>
              <div className="quest-xp-badge">+{n.xp} XP</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}