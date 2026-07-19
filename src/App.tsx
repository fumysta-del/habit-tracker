import { useState, useEffect, useMemo } from "react";
import "./App.css";
import { supabase } from "./supabase";
import {
  loadData,
  saveData,
  syncToSupabase,
  DEFAULT_USERNAME,
  type Task,
  type MinimalRecord,
  type DayStats,
  type TimeRecord,
} from "./storage";

// ── Constants ──
const TASK_XP_MAP: Record<string, number> = {
  "运动10分钟": 20,
  "学习30分钟": 30,
  "整理桌面": 5,
};
const CUSTOM_TASK_XP = 10;
const MINIMAL_ACTION_XP = 3;

const ENERGY_OPTIONS = [
  { key: "low" as const, label: "低能量", icon: "(( _ _ ))..zzzZZ" },
  { key: "normal" as const, label: "普通", icon: "＜コ:彡" },
  { key: "high" as const, label: "高能量", icon: "^ ^" },
];

const MINIMAL_ACTIONS = ["喝水", "拉伸30秒", "走到客厅", "打开学习资料"];

const ENERGY_ICON_MAP: Record<string, string> = {
  low: "(( _ _ ))..zzzZZ",
  normal: "＜コ:彡",
  high: "^ ^",
};

const ENERGY_LABEL_MAP: Record<string, string> = {
  low: "低能量",
  normal: "普通",
  high: "高能量",
};

const TIME_CATEGORIES = [
  { type: "游戏", icon: "🎮" },
  { type: "学习", icon: "📚" },
  { type: "运动", icon: "🏃" },
  { type: "休息", icon: "🛌" },
];

// ── Helpers ──
function getTaskXp(text: string): number {
  return TASK_XP_MAP[text] ?? CUSTOM_TASK_XP;
}

function getLevelInfo(totalXp: number) {
  let level = 1;
  let xpForNext = 100;
  let remaining = totalXp;
  while (remaining >= xpForNext) {
    remaining -= xpForNext;
    level++;
    xpForNext = 100 * level;
  }
  return { level, currentXp: remaining, xpForNext };
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function todayKey() {
  return new Date().toDateString();
}

function dateInputToKey(input: string): string {
  const [y, m, d] = input.split("-").map(Number);
  return new Date(y, m - 1, d).toDateString();
}

function calculateStreak(stats: Record<string, DayStats>): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const entry = stats[date.toDateString()];
    if (entry && (entry.completedTasks > 0 || entry.minimalActionCount > 0)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ── Weekly helpers ──
function getLast7Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push(date.toDateString());
  }
  return days;
}

function formatShortDate(dateKey: string): string {
  const d = new Date(dateKey);
  if (isNaN(d.getTime())) return dateKey;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDateRange(days: string[]): string {
  const fmt = (d: string) => {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
  };
  return `${fmt(days[0])} - ${fmt(days[days.length - 1])}`;
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0) return `${hours}小时${mins}分钟`;
  return `${mins}分钟`;
}

// ── Component ──
function App() {
  useEffect(() => {
  async function testConnection() {
    const { data, error } = await supabase
      .from("tasks")
      .select("*");

    console.log("数据库数据:", data);
    console.log("错误:", error);
  }

  testConnection();
}, []);
  // ── State ──
  const [tasks, setTasks] = useState<Task[]>(() => loadData().tasks);
  const [xp, setXp] = useState(() => loadData().xp);
  const [energy, setEnergy] = useState<"low" | "normal" | "high">(() => loadData().energy);
  const [dailyRecords, setDailyRecords] = useState<Record<string, MinimalRecord[]>>(() => loadData().actions);
  const [dailyStats, setDailyStats] = useState<Record<string, DayStats>>(() => loadData().history);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>(() => loadData().timeRecords ?? []);

  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"today" | "history" | "weekly">("today");

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [historyDate, setHistoryDate] = useState(todayStr);
// ── Load tasks from Supabase ──
useEffect(() => {
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("id");

    if (error) {
      console.error("读取任务失败:", error);
      return;
    }

    if (data) {
      console.log("Supabase任务:", data);
      setTasks(data);
    }
  };

  fetchTasks();
}, []);
  // ── Unified persistence ──
  useEffect(() => {
    const newData = {
  username: DEFAULT_USERNAME,
  level: 0,
  xp,
  energy,
  tasks,
  actions: dailyRecords,
  history: dailyStats,
  timeRecords,
  updatedAt: "",
};

saveData(newData);
syncToSupabase(newData);
  }, [tasks, xp, energy, dailyRecords, dailyStats, timeRecords]);

  // ── Live timer tick ──
  const [tick, setTick] = useState(0);
  const hasRunningTimer = useMemo(
    () => timeRecords.some((r) => !r.endTime && new Date(r.startTime).toDateString() === todayKey()),
    [timeRecords],
  );
  useEffect(() => {
    if (!hasRunningTimer) return;
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, [hasRunningTimer]);

  // ── Derived: today stats ──
  const todayRecords = useMemo(
    () => dailyRecords[todayKey()] ?? [],
    [dailyRecords]
  );

  const todayTimeRecords = useMemo(
    () => timeRecords.filter((r) => new Date(r.startTime).toDateString() === todayKey()),
    [timeRecords],
  );

  const todayStats = useMemo<DayStats>(() => {
    const nowMs = Date.now();
    const minutes: Record<string, number> = {};
    for (const cat of TIME_CATEGORIES) minutes[cat.type] = 0;
    for (const r of todayTimeRecords) {
      if (r.endTime) {
        minutes[r.type] += r.duration;
      } else {
        minutes[r.type] += Math.max(0, Math.round((nowMs - new Date(r.startTime).getTime()) / 60000));
      }
    }
    return {
      completedTasks: tasks.filter((t) => t.completed).length,
      minimalActionCount: todayRecords.length,
      xpGained:
        tasks.filter((t) => t.completed).reduce((s, t) => s + getTaskXp(t.text), 0) +
        todayRecords.reduce((s, r) => s + r.xp, 0),
      energy,
      timeMinutes: minutes,
    };
  }, [tasks, todayRecords, energy, todayTimeRecords, tick]);

  const streak = useMemo(() => calculateStreak(dailyStats), [dailyStats]);

  // ── Weekly stats ──
  const weeklyStats = useMemo(() => {
    const last7 = getLast7Days();
    const entries = last7.map((k) => ({ key: k, stat: dailyStats[k] ?? null }));
    const hasData = entries.some((e) => e.stat !== null);

    const totalTasks = entries.reduce((s, e) => s + (e.stat?.completedTasks ?? 0), 0);
    const totalActions = entries.reduce((s, e) => s + (e.stat?.minimalActionCount ?? 0), 0);
    const totalXp = entries.reduce((s, e) => s + (e.stat?.xpGained ?? 0), 0);

    const eCounts = { low: 0, normal: 0, high: 0 };
    entries.forEach((e) => {
      if (e.stat?.energy) eCounts[e.stat.energy]++;
    });

    let dominant = "normal" as "low" | "normal" | "high";
    let maxC = 0;
    for (const [k, c] of Object.entries(eCounts)) {
      if (c > maxC) { maxC = c; dominant = k as "low" | "normal" | "high"; }
    }

    const totalPts = Object.values(eCounts).reduce((a, b) => a + b, 0) || 1;
    const energyPct = {
      low: Math.round((eCounts.low / totalPts) * 100),
      normal: Math.round((eCounts.normal / totalPts) * 100),
      high: Math.round((eCounts.high / totalPts) * 100),
    };

    const totalTime: Record<string, number> = {};
    for (const cat of TIME_CATEGORIES) totalTime[cat.type] = 0;
    entries.forEach((e) => {
      if (e.stat?.timeMinutes) {
        for (const cat of TIME_CATEGORIES) {
          totalTime[cat.type] += e.stat.timeMinutes[cat.type] ?? 0;
        }
      }
    });

    const trends = entries.map((e) => ({
      dateKey: e.key,
      date: formatShortDate(e.key),
      xp: e.stat?.xpGained ?? 0,
      tasks: e.stat?.completedTasks ?? 0,
      hasData: e.stat !== null,
    }));

    return {
      dateRange: formatDateRange(last7),
      totalTasks, totalActions, totalXp,
      streak: calculateStreak(dailyStats),
      dominantEnergy: dominant,
      energyCounts: eCounts,
      energyPct,
      totalTime,
      trends,
      hasData,
    };
  }, [dailyStats]);

  // ── Daily stats snapshot ──
  useEffect(() => {
    const key = todayKey();
    setDailyStats((prev) => ({ ...prev, [key]: todayStats }));
  }, [todayStats]);

  // ── Derived: UI ──
  const completedCount = todayStats.completedTasks;
  const totalCount = tasks.length;
  const { level, currentXp, xpForNext } = getLevelInfo(xp);
  const progressPercent = Math.min((currentXp / xpForNext) * 100, 100);

  const historyKey = dateInputToKey(historyDate);
  const historyStats = dailyStats[historyKey] ?? null;

  // ── Handlers ──
  const addTask = async () => {
  if (!input.trim()) return;

  const newTask = {
    id: Date.now(),
    text: input.trim(),
    completed: false,
  };

  setTasks([...tasks, newTask]);

  const { error } = await supabase
    .from("tasks")
    .insert(newTask);

  if (error) {
    console.error("任务保存失败:", error);
  }

  setInput("");
};
  const toggleTask = (id: number) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === id);
      if (!task) return prev;
      const delta = task.completed ? -getTaskXp(task.text) : getTaskXp(task.text);
      const newCompleted = !task.completed;
      console.log("更新任务id:", id);
      console.log(
  "当前状态:",
  task.completed,
  "准备更新:",
  newCompleted
);

supabase
  .from("tasks")
  .update({
    completed: newCompleted,
  })
  .eq("id", id)
  .select()
  .then(({ data, error }) => {
    console.log("更新返回:", data, error);

    if (error) {
      console.error("任务更新失败:", error);
    }
  });
      setXp((p) => Math.max(0, p + delta));
      return prev.map((t) =>
  t.id === id ? { ...t, completed: newCompleted } : t
);
    });
  };

  const deleteTask = (id: number) => {
    console.log("准备删除任务:", id);
  setTasks((prev) => {
    const task = prev.find((t) => t.id === id);

    supabase
  .from("tasks")
  .delete()
  .eq("id", id)
  .then(({ data, error }) => {
    console.log("删除返回:", data, error);

    if (error) {
      console.error("任务删除失败:", error);
    }
  });

    if (task?.completed) {
      setXp((p) => Math.max(0, p - getTaskXp(task.text)));
    }

    return prev.filter((t) => t.id !== id);
  });
};

  const doMinimalAction = (action: string) => {
    const now = new Date();
    const key = now.toDateString();
    setDailyRecords((prev) => ({
      ...prev,
      [key]: [
        ...(prev[key] ?? []),
        { id: now.getTime(), action, timestamp: now.toISOString(), xp: MINIMAL_ACTION_XP },
      ],
    }));
    setXp((p) => p + MINIMAL_ACTION_XP);
  };

  const deleteRecord = (id: number) => {
    const key = todayKey();
    setDailyRecords((prev) => {
      const records = prev[key] ?? [];
      const record = records.find((r) => r.id === id);
      if (record) setXp((p) => Math.max(0, p - record.xp));
      return { ...prev, [key]: records.filter((r) => r.id !== id) };
    });
  };

  const startTimer = (type: string) => {
    if (todayTimeRecords.some((r) => r.type === type && !r.endTime)) return;
    const now = new Date();
    setTimeRecords((prev) => [...prev, { id: now.getTime(), type, startTime: now.toISOString(), endTime: "", duration: 0 }]);
  };

  const stopTimer = (type: string) => {
    const nowMs = Date.now();
    setTimeRecords((prev) => {
      for (let i = prev.length - 1; i >= 0; i--) {
        const r = prev[i];
        if (r.type === type && !r.endTime) {
          const endTime = new Date(nowMs).toISOString();
          const duration = Math.max(1, Math.round((nowMs - new Date(r.startTime).getTime()) / 60000));
          const updated = [...prev];
          updated[i] = { ...r, endTime, duration };
          return updated;
        }
      }
      return prev;
    });
  };

  const isRunning = (type: string) =>
    todayTimeRecords.some((r) => r.type === type && !r.endTime);

  // ── Render ──
  return (
    <div className="app">
      {activeTab === "today" ? (
        <>
          <header className="header">
            <h1>今日行动</h1>
            <p className="subtitle">{completedCount}/{totalCount} 已完成</p>
          </header>

          <section className="energy-section">
            <div className="energy-options">
              {ENERGY_OPTIONS.map((opt) => (
                <button key={opt.key} className={`energy-btn ${energy === opt.key ? "active" : ""}`}
                  onClick={() => setEnergy(opt.key)}>
                  <span className="energy-icon">{opt.icon}</span>
                  <span className="energy-label">{opt.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="level-section">
            <div className="level-header">
              <span className="level-badge">Lv.{level}</span>
              <span className="xp-text">{currentXp} / {xpForNext} XP</span>
            </div>
            <div className="xp-bar">
              <div className="xp-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </section>

          <section className="summary-section">
            <h2 className="section-title">每日总结</h2>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-value">{todayStats.completedTasks}</span>
                <span className="summary-label">完成任务</span>
              </div>
              <div className="summary-item">
                <span className="summary-value">{todayStats.minimalActionCount}</span>
                <span className="summary-label">最小行动</span>
              </div>
              <div className="summary-item">
                <span className="summary-value">+{todayStats.xpGained}</span>
                <span className="summary-label">获得 XP</span>
              </div>
              <div className="summary-item">
                <span className="summary-value">{streak} 天</span>
                <span className="summary-label">连续行动</span>
              </div>
            </div>
          </section>

          <section className="time-section">
            <h2 className="section-title">时间记录</h2>
            <div className="time-list">
              {TIME_CATEGORIES.map((cat) => (
                <div key={cat.type} className="time-item">
                  <span className="time-category">{cat.icon} {cat.type}</span>
                  <span className="time-duration">{todayStats.timeMinutes[cat.type]} 分钟</span>
                  {isRunning(cat.type) ? (
                    <button className="time-btn stop" onClick={() => stopTimer(cat.type)}>结束</button>
                  ) : (
                    <button className="time-btn start" onClick={() => startTimer(cat.type)}>开始</button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="minimal-section">
            <h2 className="section-title">立即开始一个最小行动</h2>
            <div className="minimal-grid">
              {MINIMAL_ACTIONS.map((action) => (
                <button key={action} className="minimal-btn" onClick={() => doMinimalAction(action)}>
                  {action} +{MINIMAL_ACTION_XP}
                </button>
              ))}
            </div>
          </section>

          {todayRecords.length > 0 && (
            <section className="records-section">
              <h2 className="section-title">
                今日最小行动记录
                <span className="records-count"> ({todayRecords.length})</span>
              </h2>
              <div className="records-list">
                {todayRecords.map((record) => (
                  <div key={record.id} className="record-item">
                    <span className="record-time">{formatTime(record.timestamp)}</span>
                    <span className="record-action">{record.action}</span>
                    <span className="record-xp">+{record.xp}XP</span>
                    <button className="record-delete" onClick={() => deleteRecord(record.id)} title="撤销">&times;</button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="add-task">
            <input type="text" placeholder="添加新行动..." value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()} />
            <button onClick={addTask}>添加</button>
          </div>

          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className={task.completed ? "completed" : ""}>
                <label>
                  <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} />
                  <span className="task-text">{task.text}</span>
                  <span className="task-xp">+{getTaskXp(task.text)}</span>
                </label>
                <button className="delete" onClick={() => deleteTask(task.id)} title="删除任务">&times;</button>
              </li>
            ))}
          </ul>
        </>
      ) : activeTab === "history" ? (
        <>
          <header className="header">
            <h1>历史记录</h1>
          </header>

          <div className="history-date-picker">
            <input type="date" value={historyDate}
              onChange={(e) => setHistoryDate(e.target.value)}
              max={todayStr} />
          </div>

          {historyStats ? (
            <section className="history-card">
              <div className="history-energy">
                <span className="history-energy-icon">{ENERGY_ICON_MAP[historyStats.energy]}</span>
                <span className="history-energy-label">{ENERGY_LABEL_MAP[historyStats.energy]}</span>
              </div>
              <div className="history-stats-grid">
                <div className="history-stat">
                  <span className="history-stat-value">{historyStats.completedTasks}</span>
                  <span className="history-stat-label">完成任务</span>
                </div>
                <div className="history-stat">
                  <span className="history-stat-value">{historyStats.minimalActionCount}</span>
                  <span className="history-stat-label">最小行动</span>
                </div>
                <div className="history-stat">
                  <span className="history-stat-value">+{historyStats.xpGained}</span>
                  <span className="history-stat-label">获得 XP</span>
                </div>
              </div>
              {historyStats.timeMinutes && (
                <div className="history-time-dist">
                  <div className="history-time-title">时间分配</div>
                  <div className="history-time-grid">
                    {TIME_CATEGORIES.map((cat) => (
                      <div key={cat.type} className="history-time-cell">
                        <span className="history-time-cell-icon">{cat.icon} {cat.type}</span>
                        <span className="history-time-cell-value">{historyStats.timeMinutes[cat.type] ?? 0} 分钟</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          ) : (
            <p className="history-empty">该日期暂无数据</p>
          )}
        </>
      ) : (
        <>
          <header className="header">
            <h1>周报</h1>
          </header>

          {weeklyStats.hasData ? (
            <>
              <section className="weekly-period">{weeklyStats.dateRange}</section>

              <section className="weekly-card">
                <h2 className="weekly-card-title">本周概览</h2>
                <div className="weekly-grid">
                  <div className="weekly-stat">
                    <span className="weekly-stat-value">{weeklyStats.totalTasks}</span>
                    <span className="weekly-stat-label">完成任务</span>
                  </div>
                  <div className="weekly-stat">
                    <span className="weekly-stat-value">{weeklyStats.totalActions}</span>
                    <span className="weekly-stat-label">最小行动</span>
                  </div>
                  <div className="weekly-stat">
                    <span className="weekly-stat-value">+{weeklyStats.totalXp}</span>
                    <span className="weekly-stat-label">获得 XP</span>
                  </div>
                  <div className="weekly-stat">
                    <span className="weekly-stat-value">{weeklyStats.streak} 天</span>
                    <span className="weekly-stat-label">连续行动</span>
                  </div>
                </div>
              </section>

              <section className="weekly-card">
                <h2 className="weekly-card-title">状态分析</h2>
                <div className="weekly-energy-row">
                  <span className="weekly-energy-icon">{ENERGY_ICON_MAP[weeklyStats.dominantEnergy]}</span>
                  <span>本周平均：{ENERGY_LABEL_MAP[weeklyStats.dominantEnergy]}</span>
                </div>
                <div className="weekly-energy-bars">
                  <div className="weekly-energy-bar-row">
                    <span className="weekly-energy-bar-label">低能量</span>
                    <div className="weekly-energy-bar-track">
                      <div className="weekly-energy-bar-fill low" style={{width: `${weeklyStats.energyPct.low}%`}} />
                    </div>
                    <span className="weekly-energy-bar-num">{weeklyStats.energyCounts.low}天</span>
                  </div>
                  <div className="weekly-energy-bar-row">
                    <span className="weekly-energy-bar-label">普通</span>
                    <div className="weekly-energy-bar-track">
                      <div className="weekly-energy-bar-fill normal" style={{width: `${weeklyStats.energyPct.normal}%`}} />
                    </div>
                    <span className="weekly-energy-bar-num">{weeklyStats.energyCounts.normal}天</span>
                  </div>
                  <div className="weekly-energy-bar-row">
                    <span className="weekly-energy-bar-label">高能量</span>
                    <div className="weekly-energy-bar-track">
                      <div className="weekly-energy-bar-fill high" style={{width: `${weeklyStats.energyPct.high}%`}} />
                    </div>
                    <span className="weekly-energy-bar-num">{weeklyStats.energyCounts.high}天</span>
                  </div>
                </div>
              </section>

              <section className="weekly-card">
                <h2 className="weekly-card-title">时间分配</h2>
                <div className="weekly-time-list">
                  {TIME_CATEGORIES.map((cat) => (
                    <div key={cat.type} className="weekly-time-item">
                      <span className="weekly-time-cat">{cat.icon} {cat.type}</span>
                      <span className="weekly-time-value">{formatMinutes(weeklyStats.totalTime[cat.type])}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="weekly-card">
                <h2 className="weekly-card-title">每日趋势</h2>
                <div className="weekly-trend-list">
                  {weeklyStats.trends.map((t) => (
                    <div key={t.dateKey} className={`weekly-trend-item${t.hasData ? "" : " empty"}`}>
                      <span className="weekly-trend-date">{t.date}</span>
                      <span className="weekly-trend-xp">+{t.xp}XP</span>
                      <span className="weekly-trend-tasks">{t.tasks}个任务</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <p className="weekly-empty">暂无历史数据</p>
          )}
        </>
      )}

      <nav className="bottom-nav">
        <button className={`nav-btn ${activeTab === "today" ? "active" : ""}`}
          onClick={() => setActiveTab("today")}>
          今日
        </button>
        <button className={`nav-btn ${activeTab === "weekly" ? "active" : ""}`}
          onClick={() => setActiveTab("weekly")}>
          周报
        </button>
        <button className={`nav-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}>
          历史
        </button>
      </nav>
    </div>
  );
}

export default App;
