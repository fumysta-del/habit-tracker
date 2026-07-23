export function GrowthTree({ xp }: { xp: number }) {
  const branches = [
    { id: "knowledge", name: "Knowledge", icon: "📚", unlock: 100, leaves: [
      { id: "read", name: "Reading", unlock: 200 },
      { id: "learn", name: "Learning", unlock: 400 },
      { id: "deepwork", name: "Deep Work", unlock: 700 },
    ]},
    { id: "health", name: "Health", icon: "🏃", unlock: 100, leaves: [
      { id: "exercise", name: "Exercise", unlock: 200 },
      { id: "sleep", name: "Sleep", unlock: 400 },
      { id: "nutrition", name: "Nutrition", unlock: 700 },
    ]},
    { id: "discipline", name: "Discipline", icon: "⚡", unlock: 100, leaves: [
      { id: "habit", name: "Habit Streak", unlock: 200 },
      { id: "time", name: "Time Mgmt", unlock: 400 },
      { id: "consist", name: "Consistency", unlock: 700 },
    ]},
  ];

  const node = (id: string, name: string, unlocked: boolean, leaf = false) => (
    <div key={id} className={"snode" + (unlocked ? " unlocked" : " locked") + (leaf ? " leaf" : "")}>
      <div className="snode-circle">
        {unlocked ? "✦" : "🔒"}
      </div>
      <span className="snode-name">{name}</span>
    </div>
  );

  return (
    <div className="growth-tree">
      <div className="tree-header">
        <div className="tree-root unlocked">
          <div className="snode-circle root-circle">◎</div>
          <span className="snode-name">Self Growth</span>
        </div>
      </div>
      <div className="tree-branches">
        {branches.map((b) => (
          <div key={b.id} className="tree-branch">
            {node(b.id, b.name, xp >= b.unlock)}
            <div className="branch-leaves">
              {b.leaves.map((l) => node(l.id, l.name, xp >= l.unlock, true))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}