export function GrowthTree({ xp }: { xp: number }) {
  const branches = [
    { id: "knowledge", name: "知识", icon: "📚", unlock: 100, leaves: [
      { id: "read", name: "阅读", unlock: 200 },
      { id: "learn", name: "学习", unlock: 400 },
      { id: "deepwork", name: "深度工作", unlock: 700 },
    ]},
    { id: "health", name: "健康", icon: "🏃", unlock: 100, leaves: [
      { id: "exercise", name: "运动", unlock: 200 },
      { id: "sleep", name: "睡眠", unlock: 400 },
      { id: "nutrition", name: "营养", unlock: 700 },
    ]},
    { id: "discipline", name: "自律", icon: "⚡", unlock: 100, leaves: [
      { id: "habit", name: "习惯坚持", unlock: 200 },
      { id: "time", name: "时间管理", unlock: 400 },
      { id: "consist", name: "持续力", unlock: 700 },
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