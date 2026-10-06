import type { Task, DailyTaskRecord } from "../../storage";
import { type EvalLogEntry, CATEGORY_MAP } from "../../utils/actionEvaluator";

interface Props {
  tasks: Task[];
  completions: DailyTaskRecord[];
  growthEvents: EvalLogEntry[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

const ATTR_NAMES: Record<string, string> = {
  knowledge: "知识", focus: "专注", discipline: "自律",
  energy: "精力", creativity: "创造力", social: "社交", money: "财富",
};

export function QuestRoadmap({ tasks, completions, growthEvents, onToggle, onDelete }: Props) {
  // Task nodes
  const doneIds = new Set(completions.filter((r) => r.completed).map((r) => r.taskId));
  const nodes = tasks.map((t) => ({ id: t.id, title: t.text, xp: t.xp, done: doneIds.has(t.id) }));
  const firstAvail = nodes.findIndex((n) => !n.done);

  // Growth events tree
  const grouped: Record<string, EvalLogEntry[]> = {};
  for (const ev of growthEvents) {
    const cat = ev.category || "life";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(ev);
  }
  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  const sortedCats = Object.keys(grouped).sort((a, b) => {
    const aT = grouped[a][0]?.timestamp || "";
    const bT = grouped[b][0]?.timestamp || "";
    return bT.localeCompare(aT);
  });
  const hasGrowth = growthEvents.length > 0;

  if (nodes.length === 0 && !hasGrowth) {
    return <p className="quest-empty">还没有任务，开始你的冒险吧</p>;
  }

  return (
    <div className="quest-roadmap">
      {/* Task nodes */}
      {nodes.map((n, i) => {
        const status = n.done ? "completed" : i === firstAvail ? "current" : "available";
        const canDelete = n.id > 3;
        return (
          <div key={"t-" + n.id} className={"quest-row" + (i % 2 === 0 ? " left" : " right")}>
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
                  <button className="quest-delete" onClick={(e) => { e.stopPropagation(); onDelete(n.id); }} title="删除任务">&times;</button>
                )}
              </div>
              <div className="quest-xp-badge">+{n.xp} XP</div>
            </div>
          </div>
        );
      })}

      {/* Growth Events Tree */}
      {hasGrowth && (
        <div className="gtree-section">
          <h3 className="gtree-section-title">成长足迹</h3>
          <div className="gtree-container">
            {sortedCats.map((cat) => {
              const info = CATEGORY_MAP[cat] || { label: cat, icon: "✨" };
              const items = grouped[cat];
              return (
                <div key={cat} className="gtree-branch">
                  <div className="gtree-branch-header">
                    <span className="gtree-branch-icon">{info.icon}</span>
                    <span className="gtree-branch-label">{info.label}</span>
                    <span className="gtree-branch-count">{items.length}</span>
                  </div>
                  <div className="gtree-nodes">
                    {items.map((ev) => {
                      const bonusStr = Object.entries(ev.attrBonus || {})
                        .filter(([, v]) => v > 0)
                        .map(([k, v]) => {
                          const n = ATTR_NAMES[k] || k;
                          return n + " +" + v;
                        })
                        .join("  ");
                      return (
                        <div key={"g-" + ev.id} className="gtree-node">
                          <div className="gtree-connector" />
                          <div className="gtree-node-body">
                            <span className="gtree-node-title">{ev.action}</span>
                            <div className="gtree-node-meta">
                              <span className="gtree-node-xp">+{ev.xp} XP</span>
                              {bonusStr && <span className="gtree-node-attr">{bonusStr}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}