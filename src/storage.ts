import { supabase } from "./supabase";

export interface Task {
  id: number;
  text: string;
  xp: number;
}

export interface DailyTaskRecord {
  taskId: number;
  date: string;
  completed: boolean;
}

export interface MinimalRecord {
  id: number;
  action: string;
  timestamp: string;
  xp: number;
}

export interface DayStats {
  completedTasks: number;
  minimalActionCount: number;
  xpGained: number;
  energy: "low" | "normal" | "high";
  timeMinutes: Record<string, number>;
}

export interface TimeRecord {
  id: number;
  type: string;
  startTime: string;
  endTime: string;
  duration: number;
}

export interface AppData {
  username: string;
  level: number;
  xp: number;
  energy: "low" | "normal" | "high";
  tasks: Task[];
  actions: Record<string, MinimalRecord[]>;
  history: Record<string, DayStats>;
  timeRecords: TimeRecord[];
  dailyTaskRecords: Record<string, DailyTaskRecord[]>;
  updatedAt: string;
}

const STORAGE_KEY = "habitData";
const OLD_KEYS = ["tasks", "userData", "minimalRecords", "dailyStats"];

export const DEFAULT_USERNAME = "Yishu";

export const DEFAULT_TASKS: Task[] = [
  { id: 1, text: "运动10分钟", xp: 20 },
  { id: 2, text: "学习30分钟", xp: 30 },
  { id: 3, text: "整理桌面", xp: 5 },
];

function calculateLevel(xp: number): number {
  let level = 1;
  let xpForNext = 100;
  let remaining = xp;
  while (remaining >= xpForNext) {
    remaining -= xpForNext;
    level++;
    xpForNext = 100 * level;
  }
  return level;
}

function createDefaultData(): AppData {
  return {
    username: DEFAULT_USERNAME,
    level: 1,
    xp: 0,
    energy: "normal",
    tasks: [...DEFAULT_TASKS],
    actions: {},
    history: {},
    timeRecords: [],
    dailyTaskRecords: {},
    updatedAt: new Date().toISOString(),
  };
}

function migrateOldData(): Partial<AppData> | null {
  const partial: Partial<AppData> = {};
  let found = false;
  const rawTasks = localStorage.getItem("tasks");
  if (rawTasks) {
    try {
      const parsed = JSON.parse(rawTasks);
      partial.tasks = Array.isArray(parsed) && parsed.length > 0
        ? parsed.map((t: any) => ({ id: t.id, text: t.text, xp: { "运动10分钟": 20, "学习30分钟": 30, "整理桌面": 5 }[(t.text as string)] ?? 10 }))
        : [...DEFAULT_TASKS];
    } catch { }
    found = true;
  }
  const rawUser = localStorage.getItem("userData");
  if (rawUser) { try { const p = JSON.parse(rawUser); partial.xp = p.xp ?? 0; partial.energy = p.energy ?? "normal"; } catch { } found = true; }
  const rawActions = localStorage.getItem("minimalRecords");
  if (rawActions) { try { partial.actions = JSON.parse(rawActions); } catch { } found = true; }
  const rawHistory = localStorage.getItem("dailyStats");
  if (rawHistory) { try { partial.history = JSON.parse(rawHistory); } catch { } found = true; }
  return found ? partial : null;
}

function clearOldKeys(): void { OLD_KEYS.forEach((k) => { try { localStorage.removeItem(k); } catch { } }); }

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as AppData;
      console.log("[LOAD] before merge tasks:", data.tasks);
      if (!Number.isFinite(data.xp)) {
        data.xp = Math.max(0, ...Object.values(data.history ?? {}).map((day) => Number.isFinite(day.xpGained) ? day.xpGained : 0));
      }
      data.level = calculateLevel(data.xp);
      if (!data.tasks) {
          data.tasks = [...DEFAULT_TASKS];
        } else {
          data.tasks = data.tasks.map((task) => ({
            ...task,
            xp: Number.isFinite(task.xp) ? task.xp : DEFAULT_TASKS.find((item) => item.text === task.text)?.xp ?? 10,
          }));
          console.log("[TASKS] After merge:", data.tasks.length, "tasks");
          console.log("[LOAD] after merge tasks:", data.tasks);
          console.log("[LOAD] final tasks:", data.tasks);
       }
      if (!data.timeRecords) data.timeRecords = [];
      if (!data.dailyTaskRecords) data.dailyTaskRecords = {};
      // Dedup: remove duplicate taskId entries per day
      for (const key of Object.keys(data.dailyTaskRecords)) {
        const seen = new Set<number>();
        data.dailyTaskRecords[key] = data.dailyTaskRecords[key].filter((r) => {
          if (seen.has(r.taskId)) return false;
          seen.add(r.taskId);
          return true;
        });
      }
      return data;
    }
  } catch { }
  const migrated = migrateOldData();
  if (migrated) {
    const data: AppData = {
      username: DEFAULT_USERNAME, level: calculateLevel(migrated.xp ?? 0), xp: migrated.xp ?? 0,
      energy: migrated.energy ?? "normal", tasks: migrated.tasks ?? [...DEFAULT_TASKS],
      actions: migrated.actions ?? {}, history: migrated.history ?? {}, timeRecords: [],
      dailyTaskRecords: {}, updatedAt: new Date().toISOString(),
    };
    saveData(data);
    clearOldKeys();
    return data;
  }
  const data = createDefaultData();
  saveData(data);
  return data;
}

export function getLocalDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function saveData(data: AppData): void {
  data.level = calculateLevel(data.xp);
  data.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function calculateTotalXp(history: Record<string, DayStats>, liveXpGained?: number): number {
  const total = Object.values(history).reduce((sum, day) => sum + (day.xpGained ?? 0), 0);
  if (liveXpGained !== undefined) {
    const todayKey = new Date().toDateString();
    const snapshotXp = history[todayKey]?.xpGained ?? 0;
    return total - snapshotXp + liveXpGained;
  }
  return total;
}

export interface SyncResult { success: boolean; timestamp: string; }

export async function syncToSupabase(data: AppData): Promise<SyncResult> {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayKey = now.toDateString();
  const todayActions = data.actions[todayKey] ?? [];
  const todayTaskCompletions = data.dailyTaskRecords?.[today] ?? [];

  // Today must not include study minutes from previous calendar dates.
  const timeMinutesPayload = data.timeRecords
    .filter((item) => new Date(item.startTime).toDateString() === todayKey)
    .reduce((acc, item) => {
      acc[item.type] = (acc[item.type] ?? 0) + item.duration;
      return acc;
    }, {} as Record<string, any>);
  if (todayActions.length > 0) timeMinutesPayload["__actions"] = todayActions;
  if (todayTaskCompletions.length > 0) timeMinutesPayload["__task_completions"] = todayTaskCompletions.filter((r) => r.completed).map((r) => r.taskId);

    const payload = {
    date: today,
    energy: data.energy,
    completed_tasks: todayTaskCompletions.filter((r) => r.completed).length,
    minimal_actions: todayActions.length,
    xp: data.xp,
    time_minutes: timeMinutesPayload,
  };
  console.log("[SYNC] Upserting daily_stats:", JSON.stringify({ date: payload.date, xp: payload.xp, tasks: payload.completed_tasks, actions: payload.minimal_actions }));
  const { error } = await supabase.from("daily_stats").upsert(payload, { onConflict: "date" });

  if (error) {
    console.error("[SYNC] Upsert failed:", error);
    return { success: false, timestamp: new Date().toISOString() };
  }
  console.log("[SYNC] Upsert successful for", today, "xp:", data.xp);

    // Sync daily_tasks
  for (const record of todayTaskCompletions) {
    const dtPayload = {
      user_id: DEFAULT_USERNAME,
      task_id: record.taskId,
      date: record.date,
      completed: record.completed,
    };
    console.log("[SYNC] daily_tasks payload", dtPayload);
    const { error: dtError } = await supabase.from("daily_tasks").upsert(dtPayload, {
      onConflict: "user_id,task_id,date",
    });
    if (dtError) {
      console.error("[SYNC] daily_tasks error:", dtError);
    } else {
      console.log("[SYNC] daily_tasks success:", record.taskId, record.completed);
    }
  }
// Sync time_records
  if (data.timeRecords.length > 0) {
    const timeRecordsPayload = data.timeRecords.map((r) => ({
      id: r.id,
      type: r.type,
      start_time: r.startTime,
      end_time: r.endTime,
      duration: r.duration,
    }));
    const { error: trError } = await supabase.from("time_records").upsert(
      timeRecordsPayload,
      { onConflict: "id" }
    );
    if (trError) {
      console.error("[SYNC] time_records upsert error:", trError);
    } else {
      console.log("[SYNC] time_records upsert success:", timeRecordsPayload.length, "records");
    }
  }

  return { success: true, timestamp: new Date().toISOString() };
}

export async function syncToCloud(data: AppData): Promise<SyncResult> {
  console.log("[storage] syncToCloud: not configured", data.username);
  return { success: false, timestamp: "" };
}
export async function loadFromCloud(username: string): Promise<AppData | null> {
  console.log("[storage] loadFromCloud: not configured", username);
  return null;
}

