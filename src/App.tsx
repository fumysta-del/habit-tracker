import { useState, useEffect, useMemo, useRef } from "react";
import "./App.css";
import { supabase } from "./supabase";
(window as any).supabase = supabase;
import {
  loadData,
  saveData,
  syncToSupabase,
  calculateTotalXp,
  DEFAULT_USERNAME,
  type Task,
  type MinimalRecord,
  type DayStats,
  type TimeRecord,
} from "./storage";
import { HomePage } from "./pages/HomePage";
import { TasksPage } from "./pages/TasksPage";
import { GrowthPage } from "./pages/GrowthPage";
import { ProfilePage } from "./pages/ProfilePage";
import { BottomNav } from "./components/BottomNav";

// 鈹€鈹€ Constants 鈹€鈹€
const TASK_XP_MAP: Record<string, number> = {
  "杩愬姩10鍒嗛挓": 20,
  "瀛︿範30鍒嗛挓": 30,
  "鏁寸悊妗岄潰": 5,
};
const CUSTOM_TASK_XP = 10;
const MINIMAL_ACTION_XP = 3;

const TIME_CATEGORIES = [
  { type: "娓告垙", icon: "馃幃" },
  { type: "瀛︿範", icon: "馃摎" },
  { type: "杩愬姩", icon: "馃弮" },
  { type: "浼戞伅", icon: "馃泴" },
];

// 鈹€鈹€ Helpers 鈹€鈹€
function getTaskXp(text: string): number {
  return TASK_XP_MAP[text] ?? CUSTOM_TASK_XP;
}

function todayKey() {
  return new Date().toDateString();
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

// 鈹€鈹€ Component 鈹€鈹€
function App() {
  // 鈹€鈹€ State 鈹€鈹€
  const [tasks, setTasks] = useState<Task[]>(() => loadData().tasks);
  const [xp, setXp] = useState(() => loadData().xp);
  const [energy, setEnergy] = useState<"low" | "normal" | "high">(() => loadData().energy);
  const [dailyRecords, setDailyRecords] = useState<Record<string, MinimalRecord[]>>(() => loadData().actions);
  const [dailyStats, setDailyStats] = useState<Record<string, DayStats>>(() => loadData().history);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>(() => loadData().timeRecords ?? []);

  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"home" | "tasks" | "growth" | "profile">("home");

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [historyDate, setHistoryDate] = useState(todayStr);

  // 鈹€鈹€ Cloud sync guard 鈹€鈹€
  const [cloudReady, setCloudReady] = useState(false);
  const initialSyncDone = useRef(false);

  // 鈹€鈹€ Consolidated Supabase load 鈹€鈹€
  useEffect(() => {
    let cancelled = false;
    async function initFromCloud() {
      try {
        const [tasksResult, statsResult] = await Promise.all([
          supabase.from("tasks").select("*").order("id"),
          supabase.from("daily_stats").select("*").order("date"),
        ]);
        if (cancelled) return;
        let cloudDataApplied = false;
        if (tasksResult.data && tasksResult.data.length > 0) {
          setTasks(tasksResult.data.map((t: any) => ({ id: t.id, text: t.text, completed: t.completed })));
          cloudDataApplied = true;
        }
        if (statsResult.data && statsResult.data.length > 0) {
          const history: Record<string, DayStats> = {};
          for (const item of statsResult.data) {
            const key = new Date(item.date).toDateString();
            history[key] = {
              completedTasks: item.completed_tasks ?? 0,
              minimalActionCount: item.minimal_actions ?? 0,
              xpGained: item.xp ?? 0,
              energy: item.energy ?? "normal",
              timeMinutes: item.time_minutes ?? {},
            };
          }
          setDailyStats(history);
          const todayDate = new Date().toISOString().split("T")[0];
          const todayRow = statsResult.data.find((s: any) => s.date === todayDate);
          if (todayRow) {
            setXp(todayRow.xp ?? 0);
            setEnergy(todayRow.energy ?? "normal");
            if (todayRow.time_minutes?.__actions) {
              const ca = todayRow.time_minutes.__actions;
              if (Array.isArray(ca) && ca.length > 0) {
                setDailyRecords(p => ({ ...p, [new Date().toDateString()]: ca }));
              }
            }
          }
          cloudDataApplied = true;
        }
        if (cloudDataApplied) {
          const local = loadData();
          saveData({
            username: DEFAULT_USERNAME, level: 0, xp: local.xp, energy: local.energy,
            tasks: local.tasks, actions: local.actions, history: local.history, timeRecords: local.timeRecords, updatedAt: "",
          });
        }
      } catch (err) {
        console.error("[cloud] Failed to load from Supabase:", err);
      } finally {
        if (!cancelled) setCloudReady(true);
      }
    }
    initFromCloud();
    return () => { cancelled = true; };
  }, []);

  // 鈹€鈹€ Unified persistence 鈹€鈹€
  useEffect(() => {
    if (!cloudReady) return;
    if (!initialSyncDone.current) { initialSyncDone.current = true; }
    const newData = {
      username: DEFAULT_USERNAME, level: 0, xp, energy, tasks,
      actions: dailyRecords, history: dailyStats, timeRecords, updatedAt: "",
    };
    saveData(newData);
    syncToSupabase(newData);
  }, [tasks, xp, energy, dailyRecords, dailyStats, timeRecords, cloudReady]);

  // 鈹€鈹€ Live timer tick 鈹€鈹€
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

  // 鈹€鈹€ Derived: today stats 鈹€鈹€
  const todayRecords = useMemo(() => dailyRecords[todayKey()] ?? [], [dailyRecords]);

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

  // 鈹€鈹€ Weekly stats 鈹€鈹€
  const weeklyStats = useMemo(() => {
    const last7 = getLast7Days();
    const entries = last7.map((k) => ({ key: k, stat: dailyStats[k] ?? null }));
    const hasData = entries.some((e) => e.stat !== null);
    const totalTasks = entries.reduce((s, e) => s + (e.stat?.completedTasks ?? 0), 0);
    const totalActions = entries.reduce((s, e) => s + (e.stat?.minimalActionCount ?? 0), 0);
    const totalXp = entries.reduce((s, e) => s + (e.stat?.xpGained ?? 0), 0);
    const eCounts = { low: 0, normal: 0, high: 0 };
    entries.forEach((e) => { if (e.stat?.energy) eCounts[e.stat.energy]++; });
    let dominant = "normal" as "low" | "normal" | "high";
    let maxC = 0;
    for (const [k, c] of Object.entries(eCounts)) { if (c > maxC) { maxC = c; dominant = k as "low" | "normal" | "high"; } }
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
        for (const cat of TIME_CATEGORIES) { totalTime[cat.type] += e.stat.timeMinutes[cat.type] ?? 0; }
      }
    });
    const trends = entries.map((e) => ({
      dateKey: e.key, date: formatShortDate(e.key),
      xp: e.stat?.xpGained ?? 0, tasks: e.stat?.completedTasks ?? 0, hasData: e.stat !== null,
    }));
    return {
      dateRange: formatDateRange(last7), totalTasks, totalActions, totalXp,
      streak: calculateStreak(dailyStats), dominantEnergy: dominant,
      energyCounts: eCounts, energyPct, totalTime, trends, hasData,
    };
  }, [dailyStats]);

  // 鈹€鈹€ Daily stats snapshot 鈹€鈹€
  useEffect(() => {
    if (!cloudReady) return;
    const key = todayKey();
    setDailyStats((prev) => ({ ...prev, [key]: todayStats }));
  }, [todayStats, cloudReady]);

  // 鈹€鈹€ Derived: UI 鈹€鈹€
  const totalXp = calculateTotalXp(dailyStats, todayStats.xpGained);
  const level = Math.floor(totalXp / 100) + 1;
  const currentLevelXp = totalXp % 100;
  const progressPercent = Math.min(currentLevelXp, 100);

  const isRunning = (type: string) =>
    todayTimeRecords.some((r) => r.type === type && !r.endTime);

  // 鈹€鈹€ Handlers 鈹€鈹€
  const addTask = async () => {
    if (!input.trim()) return;
    const newTask = { id: Date.now(), text: input.trim(), completed: false };
    setTasks([...tasks, newTask]);
    const { error } = await supabase.from("tasks").insert(newTask);
    if (error) console.error("浠诲姟淇濆瓨澶辫触:", error);
    setInput("");
  };

  const toggleTask = (id: number) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === id);
      if (!task) return prev;
      const delta = task.completed ? -getTaskXp(task.text) : getTaskXp(task.text);
      const newCompleted = !task.completed;
      supabase.from("tasks").update({ completed: newCompleted }).eq("id", id)
        .then(({ error }) => { if (error) console.error("浠诲姟鏇存柊澶辫触:", error); });
      setXp((p) => Math.max(0, p + delta));
      return prev.map((t) => t.id === id ? { ...t, completed: newCompleted } : t);
    });
  };

  const deleteTask = (id: number) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === id);
      supabase.from("tasks").delete().eq("id", id)
        .then(({ error }) => { if (error) console.error("浠诲姟鍒犻櫎澶辫触:", error); });
      if (task?.completed) setXp((p) => Math.max(0, p - getTaskXp(task.text)));
      return prev.filter((t) => t.id !== id);
    });
  };

  const doMinimalAction = (action: string) => {
    const nowMs = new Date();
    const key = nowMs.toDateString();
    setDailyRecords((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), { id: nowMs.getTime(), action, timestamp: nowMs.toISOString(), xp: MINIMAL_ACTION_XP }],
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
    const n = new Date();
    setTimeRecords((prev) => [...prev, { id: n.getTime(), type, startTime: n.toISOString(), endTime: "", duration: 0 }]);
  };

  const stopTimer = (type: string) => {
    const n = Date.now();
    setTimeRecords((prev) => {
      for (let i = prev.length - 1; i >= 0; i--) {
        const r = prev[i];
        if (r.type === type && !r.endTime) {
          const endTime = new Date(n).toISOString();
          const duration = Math.max(1, Math.round((n - new Date(r.startTime).getTime()) / 60000));
          const u = [...prev];
          u[i] = { ...r, endTime, duration };
          return u;
        }
      }
      return prev;
    });
  };

  // 鈹€鈹€ Render 鈹€鈹€
  return (
    <div className="app">
      {activeTab === "home" ? (
        <HomePage
          energy={energy} setEnergy={setEnergy}
          level={level} currentLevelXp={currentLevelXp} progressPercent={progressPercent}
          todayStats={todayStats} streak={streak}
        />
      ) : activeTab === "tasks" ? (
        <TasksPage
          tasks={tasks} input={input} setInput={setInput}
          addTask={addTask} toggleTask={toggleTask} deleteTask={deleteTask}
          getTaskXp={getTaskXp}
          doMinimalAction={doMinimalAction}
        />
      ) : activeTab === "growth" ? (
        <GrowthPage
          todayRecords={todayRecords} deleteRecord={deleteRecord}
          todayStats={todayStats}
          isRunning={isRunning} startTimer={startTimer} stopTimer={stopTimer}
          dailyStats={dailyStats}
          historyDate={historyDate} setHistoryDate={setHistoryDate}
          todayStr={todayStr}
          weeklyStats={weeklyStats}
        />
      ) : (
        <ProfilePage />
      )}
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export default App;

