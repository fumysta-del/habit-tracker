import type { Task, DailyTaskRecord } from "../../storage";

interface QNode {
  id: number;
  title: string;
  xp: number;
  status: "completed" | "current" | "available";
}

interface Props {
  tasks: Task[];
  completions: DailyTaskRecord[];
  onToggle: (id: number) => void;
}

export function QuestRoadmap({ tasks, completions, onToggle }: Props) {
  const todayDone = completions.filter((r) => r.completed);


  const nodes: QNode[] = tasks.map((t) => {
    const done = todayDone.some((r) => r.taskId === t.id);
    return { id: t.id, title: t.text, xp: t.xp, status: done ? "completed" : "available" };
  });

  const firstAvail = nodes.findIndex((n) => n.status === "available");
  if (firstAvail >= 0) nodes[firstAvail].status = "current";


  if (nodes.length === 0) return <p className="quest-empty">还没有任务，开始你的冒险吧</p>;

  return (
    <div className="quest-roadmap">
      {nodes.map((n, i) => (
        <div key={n.id} className={"quest-row" + (i % 2 === 0 ? " left" : " right")}>
          <div className="quest-line" />
          <div className={"quest-node " + n.status} onClick={() => onToggle(n.id)}>
            <div className="quest-circle">
              {n.status === "completed" && (
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M6 13l3 3 9-9" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {n.status === "current" && <span className="quest-current-icon">✦</span>}
              {n.status === "available" && <span className="quest-avail-dot" />}
            </div>
            <div className="quest-label">{n.title}</div>
            <div className="quest-xp-badge">+{n.xp} XP</div>
          </div>
        </div>
      ))}
    </div>
  );
}