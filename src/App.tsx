import { useState, useEffect, useMemo, useRef } from "react";
import "./App.css";
import { supabase } from "./supabase";
(window as any).supabase = supabase;
import {
  loadData,
  saveData,
  syncToSupabase,
  DEFAULT_USERNAME,
  getLocalDateString,
  type Task,
  type MinimalRecord,
  type DayStats,
  type TimeRecord,
  type DailyTaskRecord,
} from "./storage";
import { HomePage } from "./pages/HomePage";
import { TasksPage } from "./pages/TasksPage";
import { GrowthPage } from "./pages/GrowthPage";
import { ProfilePage } from "./pages/ProfilePage";
import { DecorativeBg } from "./components/DecorativeBg";
import { BottomNav } from "./components/BottomNav";
import { HamburgerMenu } from "./components/HamburgerMenu";
import { evaluateAction, getAttrTotalFromLog, type EvalResult, type EvalLogEntry } from "./utils/actionEvaluator";
import { ActionEvaluationModal } from "./components/action/ActionEvaluationModal";

// 鈹€鈹€ Constants 鈹€鈹€
const TASK_XP_MAP: Record<string, number> = {
  "运动10分钟": 20,
  "学习30分钟": 30,
  "整理桌面": 5,
};
const CUSTOM_TASK_XP = 10;
const MINIMAL_ACTION_XP = 3;
const EVAL_LOG_KEY = "actionEvalLog";

const TIME_CATEGORIES = [
  { type: "游戏", icon: "🎮" },
  { type: "学习", icon: "📚" },
  { type: "运动", icon: "🏃" },
  { type: "休息", icon: "🛌" },
];

// 鈹€鈹€ Helpers 鈹€鈹€

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

function mergeDailyTaskRecords(
  localRecords: DailyTaskRecord[],
  cloudRecords: DailyTaskRecord[],
): DailyTaskRecord[] {
  const merged = new Map(cloudRecords.map((record) => [record.taskId, record]));
  localRecords.forEach((record) => merged.set(record.taskId, record));
  return Array.from(merged.values());
}

// 鈹€鈹€ Component 鈹€鈹€
function App() {
  // 鈹€鈹€ State 鈹€鈹€
  const [tasks, setTasks] = useState<Task[]>(() => loadData().tasks);
  const [xp, setXp] = useState(() => loadData().xp);
  const [energy, setEnergy] = useState<"low" | "normal" | "high">(() => loadData().energy);
  const [dailyRecords, setDailyRecords] = useState<Record<string, MinimalRecord[]>>(() => loadData().actions);
  const [dailyTaskRecords, setDailyTaskRecords] = useState<Record<string, DailyTaskRecord[]>>(() => loadData().dailyTaskRecords ?? {});
  const [dailyStats, setDailyStats] = useState<Record<string, DayStats>>(() => loadData().history);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>(() => loadData().timeRecords ?? []);
  const [evalLog, setEvalLog] = useState<EvalLogEntry[]>(() => {
    try {
      const raw = localStorage.getItem(EVAL_LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [pendingEval, setPendingEval] = useState<EvalResult | null>(null);

  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"home" | "tasks" | "growth" | "profile" | "settings">("home");
  const [menuOpen, setMenuOpen] = useState(false);

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
        if (tasksResult.data && tasksResult.data.length > 0) {
          const cloudTasks = tasksResult.data.map((t: any) => ({ id: t.id, text: t.text, xp: TASK_XP_MAP[t.text as string] ?? CUSTOM_TASK_XP }));
          console.log("[TASK CLOUD]", cloudTasks);
          console.log("[TASK LOCAL]", tasks);
          const merged = [...tasks];
          for (const ct of cloudTasks) {
            const idx = merged.findIndex((t) => t.id === ct.id);
            if (idx >= 0) {
              merged[idx] = ct;
            } else {
              merged.push(ct);
            }
          }
          console.log("[TASK FINAL]", merged);
          setTasks(merged);
        }
        let fallbackTaskIds: number[] | null = null;
        if (statsResult.data && statsResult.data.length > 0) {
          const history: Record<string, DayStats> = {};
          let maxCloudXp = 0;
          for (const item of statsResult.data) {
            const key = new Date(item.date).toDateString();
            const itemXp = item.xp ?? 0;
            if (itemXp > maxCloudXp) maxCloudXp = itemXp;
            history[key] = {
              completedTasks: item.completed_tasks ?? 0,
              minimalActionCount: item.minimal_actions ?? 0,
              xpGained: itemXp,
              energy: item.energy ?? "normal",
              timeMinutes: item.time_minutes ?? {},
            };
          }
          setDailyStats(history);
          console.log("[SYNC] daily_stats rows:", statsResult.data.length, "| max cloud xp:", maxCloudXp);
          if (maxCloudXp > 0) setXp(maxCloudXp);
  const todayDate = getLocalDateString();
          const todayRow = statsResult.data.find((s: any) => s.date === todayDate);
                    if (todayRow) {
            setEnergy(todayRow.energy ?? "normal");
            if (todayRow.time_minutes?.__actions) {
              const ca = todayRow.time_minutes.__actions;
              if (Array.isArray(ca) && ca.length > 0) {
                setDailyRecords(p => ({ ...p, [new Date().toDateString()]: ca }));
              }
            }
            if (todayRow.time_minutes?.__task_completions) {
              const ids = todayRow.time_minutes.__task_completions;
              if (Array.isArray(ids) && ids.length > 0) {
                fallbackTaskIds = ids;
              }
            }
          }
        }

        // Load time_records from cloud
        try {
          const trResult = await supabase.from("time_records").select("*");
          if (trResult.data && trResult.data.length > 0) {
            setTimeRecords(trResult.data.map((r: any) => ({
              id: r.id,
              type: r.type,
              startTime: r.start_time,
              endTime: r.end_time,
              duration: r.duration,
            })));
          }
          console.log("[SYNC] cloud time_records", trResult.data?.length ?? 0, "records");
        } catch (e) { console.error("[SYNC] time_records load failed:", e); }

                // Load daily_tasks for today (primary)
        try {
          const td = getLocalDateString();
          const dtResult = await supabase.from("daily_tasks").select("*").eq("date", td);
          if (dtResult.data && dtResult.data.length > 0) {
            const cloudRecords = dtResult.data.map((r: any) => ({
              taskId: r.task_id,
              date: r.date,
              completed: r.completed,
            }));
            setDailyTaskRecords((prev) => ({
              ...prev,
              [td]: mergeDailyTaskRecords(prev[td] ?? [], cloudRecords),
            }));
          } else if (fallbackTaskIds && fallbackTaskIds.length > 0) {
            const fallbackRecords = fallbackTaskIds.map((taskId) => ({ taskId, date: td, completed: true }));
            setDailyTaskRecords((prev) => ({
              ...prev,
              [td]: mergeDailyTaskRecords(prev[td] ?? [], fallbackRecords),
            }));
          }
          console.log("[SYNC] cloud daily_tasks", dtResult.data?.length ?? 0, "records");
        } catch (e) { console.error("[SYNC] daily_tasks load failed:", e); }

            } catch (err) {
        console.error("[cloud] Failed to load from Supabase:", err);
      } finally {
        if (!cancelled) {
          console.log("[SYNC] Init complete, cloudReady set to true");
          setCloudReady(true);
        }
      }
    }
    initFromCloud();
    return () => { cancelled = true; };
  }, []);

  // 鈹€鈹€ Unified persistence 鈹€鈹€
    useEffect(() => {
    const newData = {
      username: DEFAULT_USERNAME, level: 0, xp, energy, tasks,
      actions: dailyRecords, history: dailyStats, timeRecords,
      dailyTaskRecords,
       updatedAt: "",
    };
    saveData(newData);
    if (!cloudReady) return;
    if (!initialSyncDone.current) { initialSyncDone.current = true; }
    console.log("[SYNC] Syncing - xp:", xp, "tasks:", tasks.length, "records:", Object.keys(dailyRecords).length);
    syncToSupabase(newData);
  }, [tasks, xp, energy, dailyRecords, dailyStats, timeRecords,
       dailyTaskRecords, cloudReady]);

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

  const todayStrISO = getLocalDateString();
  const todayCompletionRecords = useMemo(
    () => dailyTaskRecords[todayStrISO] ?? [],
    [dailyTaskRecords, todayStrISO],
  );

  const todayTimeRecords = useMemo(
    () => timeRecords.filter((r) => {
      const d = new Date(r.startTime);
      return !isNaN(d.getTime()) && d.toDateString() === todayKey();
    }),
    [timeRecords],
  );

  const todayStats = useMemo<DayStats>(() => {
    const nowMs = Date.now();
    const minutes: Record<string, number> = {};
    for (const cat of TIME_CATEGORIES) minutes[cat.type] = 0;
    for (const r of todayTimeRecords) {
  if (!Object.prototype.hasOwnProperty.call(minutes, r.type)) {
    console.warn("未知计时类型：", r.type);
    continue;
  }

  let value = 0;

  if (r.endTime) {
    value =
      Number.isFinite(r.duration) && r.duration >= 0
        ? r.duration
        : 0;
  } else {
    const startMs = new Date(r.startTime).getTime();

    if (Number.isFinite(startMs)) {
      value = Math.max(0, Math.round((nowMs - startMs) / 60000));
    }
  }

  minutes[r.type] = (minutes[r.type] ?? 0) + value;
}
    return {
      completedTasks: todayCompletionRecords.filter((r) => r.completed).length,
      minimalActionCount: todayRecords.length,
      xpGained:
        todayCompletionRecords.filter((r) => r.completed).reduce((s, r) => s + (tasks.find((t) => t.id === r.taskId)?.xp ?? 0), 0) +
        todayRecords.reduce((s, r) => s + r.xp, 0),
      energy,
      timeMinutes: minutes,
    };
  }, [tasks, todayRecords, todayCompletionRecords, energy, todayTimeRecords, tick]);

  const streak = useMemo(() => calculateStreak(dailyStats), [dailyStats]);

  // 鈹€鈹€ Weekly stats 鈹€鈹€
  const weeklyStats = useMemo(() => {
    const last7 = getLast7Days();
    const entries = last7.map((k) => ({ key: k, stat: dailyStats[k] ?? null }));
    const hasData = entries.some((e) => e.stat !== null);
    const totalTasks = entries.reduce((s, e) => s + (e.stat?.completedTasks ?? 0), 0);
    const totalActions = entries.reduce((s, e) => s + (e.stat?.minimalActionCount ?? 0), 0);
    const eCounts = { low: 0, normal: 0, high: 0 };
    entries.forEach((e) => { if (e.stat?.energy) eCounts[e.stat.energy]++; });
    const totalTime: Record<string, number> = {};
    for (const cat of TIME_CATEGORIES) totalTime[cat.type] = 0;
    entries.forEach((e) => {
      if (e.stat?.timeMinutes) {
        for (const cat of TIME_CATEGORIES) { totalTime[cat.type] += e.stat.timeMinutes[cat.type] ?? 0; }
      }
    });
    return { totalTasks, totalActions, energyCounts: eCounts, totalTime, hasData };
  }, [dailyStats]);

  // 鈹€鈹€ Daily stats snapshot 鈹€鈹€
  useEffect(() => {
    const key = todayKey();
    setDailyStats((prev) => ({ ...prev, [key]: todayStats }));
  }, [todayStats]);

  // 鈹€鈹€ Derived: UI 鈹€鈹€
  const attrTotals = useMemo(() => getAttrTotalFromLog(evalLog), [evalLog]);
  const level = Math.floor(xp / 100) + 1;
  const currentLevelXp = xp % 100;
  const progressPercent = Math.min(currentLevelXp, 100);

  const isRunning = (type: string) =>
    todayTimeRecords.some((r) => r.type === type && !r.endTime);

  // 鈹€鈹€ Handlers 鈹€鈹€
  const addTask = async () => {
    if (!input.trim()) return;
    const xpVal = TASK_XP_MAP[input.trim()] ?? CUSTOM_TASK_XP;
    const { data, error } = await supabase.from("tasks").insert({ text: input.trim() }).select().single();
    if (error) { console.error("浠诲姟淇濆瓨澶辫触:", error); return; }
    const newTask: Task = { id: data.id, text: data.text, xp: xpVal };
    setTasks([...tasks, newTask]);
    setInput("");
  };

    const toggleTask = (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const todayStr = getLocalDateString();
    const currentRecord = todayCompletionRecords.find((record) => record.taskId === id);
    const nextCompleted = currentRecord ? !currentRecord.completed : true;
    setDailyTaskRecords((prev) => {
      const list = prev[todayStr] ?? [];
      const idx = list.findIndex((r) => r.taskId === id);
      if (idx >= 0) {
        const rec = list[idx];
        const upd = [...list];
        upd[idx] = { ...rec, completed: nextCompleted };
        return { ...prev, [todayStr]: upd };
      } else {
        return { ...prev, [todayStr]: [...list, { taskId: id, date: todayStr, completed: true }] };
      }
    });
    setXp((prev) => nextCompleted ? prev + task.xp : Math.max(0, prev - task.xp));
  };
  const deleteTask = (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
  const todayStr = getLocalDateString();
    const record = todayCompletionRecords.find((r) => r.taskId === id);
    if (record?.completed) setXp((p) => Math.max(0, p - task.xp));
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setDailyTaskRecords((prev: Record<string, DailyTaskRecord[]>) => ({
      ...prev, [todayStr]: (prev[todayStr] ?? []).filter((r) => r.taskId !== id),
    }));
    supabase.from("tasks").delete().eq("id", id)
      .then(({ error }) => { if (error) console.error("任务删除失败:", error); });
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
          const startMs = new Date(r.startTime).getTime();
          if (isNaN(startMs)) return prev;
          const duration = Math.max(1, Math.round((n - startMs) / 60000));
          const u = [...prev];
          u[i] = { ...r, endTime, duration };
          return u;
        }
      }
      return prev;
    });
  };
  // Action Evaluation handlers
  const handleEvaluateAction = (text: string) => {
    const result = evaluateAction(text);
    setPendingEval(result);
  };
  const handleClaimReward = () => {
    const ev = pendingEval;
    if (!ev) return;
    setXp((p) => p + ev.totalXP);
    const entry = { id: Date.now(), action: ev.action, category: ev.category, xp: ev.totalXP, attrBonus: ev.attrBonus, timestamp: new Date().toISOString() };
    setEvalLog((prev) => { const next = [entry].concat(prev); localStorage.setItem("actionEvalLog", JSON.stringify(next)); return next; });
    const nowMs = new Date();
    const key = nowMs.toDateString();
    setDailyRecords((prev) => {
      const recs = prev[key] || [];
      return Object.assign({}, prev, { [key]: recs.concat([{ id: nowMs.getTime(), action: ev.action, timestamp: nowMs.toISOString(), xp: ev.totalXP }]) });
    });
    setPendingEval(null);
  };
  const handleCloseEval = () => setPendingEval(null);

  // 鈹€鈹€ Render 鈹€鈹€
  return (
    <><DecorativeBg />
      <HamburgerMenu
        isOpen={menuOpen}
        onToggle={() => setMenuOpen((p) => !p)}
        activeTab={activeTab}
        onNavigate={setActiveTab}
      />
    <div className="app">
      {activeTab === "home" ? (<>
        <HomePage
          energy={energy} setEnergy={setEnergy}
                    level={level} currentLevelXp={currentLevelXp} progressPercent={progressPercent}
          todayStats={todayStats} streak={streak} totalTasks={tasks.length}
          tasks={tasks} toggleTask={toggleTask}
          dailyTaskRecords={dailyTaskRecords}
          doMinimalAction={doMinimalAction} input={input} setInput={setInput} addTask={addTask}
          todayRecords={dailyRecords[todayKey()] ?? []} deleteRecord={deleteRecord}
          isRunning={isRunning} startTimer={startTimer} stopTimer={stopTimer}
          onEvaluateAction={handleEvaluateAction}
        />
        {pendingEval && <ActionEvaluationModal result={pendingEval} onClaim={handleClaimReward} onClose={handleCloseEval} />}
      </>
      ) : activeTab === "tasks" ? (
        <TasksPage
          tasks={tasks}
          dailyTaskRecords={dailyTaskRecords}
          growthEvents={evalLog}
          toggleTask={toggleTask} deleteTask={deleteTask}
        />
      ) : activeTab === "growth" ? (
        <GrowthPage
          dailyStats={dailyStats}
          tasks={tasks} dailyTaskRecords={dailyTaskRecords} dailyRecords={dailyRecords}
          historyDate={historyDate} setHistoryDate={setHistoryDate}
          todayStr={todayStr}
          xp={xp} level={level} streak={streak}
        />
      ) : activeTab === "profile" ? (
        <ProfilePage
          level={level} xp={xp} streak={streak}
          dailyStats={dailyStats} weeklyStats={weeklyStats}
          attrBonuses={attrTotals}
        />
      ) : activeTab === "settings" ? (
        <div className="settings-page" style={{ padding: "40px 0", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, color: "var(--color-text-primary)", marginBottom: 12 }}>设置</div>
          <div style={{ fontFamily: "var(--font-number)", fontSize: 15, color: "var(--color-text-tertiary)" }}>设置 - 开发中</div>
        </div>
      ) : null}
      <BottomNav activeTab={activeTab} onChange={(t: any) => setActiveTab(t)} />
    </div>
    </>
  );
}

export default App;
