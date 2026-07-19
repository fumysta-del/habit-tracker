import { supabase } from "./supabase";
// ── Centralized Storage for 行动力助手 ──
// All localStorage operations go through this module.
// Prepares for future Supabase migration: swap loadData/saveData
// with Supabase client calls without touching the component.

// ── Types (exported for component use and future Supabase schema) ──

export interface Task {
  id: number;
  text: string;
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
  updatedAt: string;
}

// ── Constants ──

const STORAGE_KEY = "habitData";
const OLD_KEYS = ["tasks", "userData", "minimalRecords", "dailyStats"];

export const DEFAULT_USERNAME = "Yishu";

export const DEFAULT_TASKS: Task[] = [
  { id: 1, text: "运动10分钟", completed: false },
  { id: 2, text: "学习30分钟", completed: false },
  { id: 3, text: "整理桌面", completed: false },
];

// ── Internal helpers ──

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
    updatedAt: new Date().toISOString(),
  };
}

// Migrate from old separate localStorage keys to unified format.
function migrateOldData(): Partial<AppData> | null {
  const partial: Partial<AppData> = {};
  let found = false;

  const rawTasks = localStorage.getItem("tasks");
  if (rawTasks) {
    try {
      const parsed = JSON.parse(rawTasks);
      partial.tasks = Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_TASKS];
    } catch { /* ignore corrupt data */ }
    found = true;
  }

  const rawUser = localStorage.getItem("userData");
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      partial.xp = parsed.xp ?? 0;
      partial.energy = parsed.energy ?? "normal";
    } catch { /* ignore */ }
    found = true;
  }

  const rawActions = localStorage.getItem("minimalRecords");
  if (rawActions) {
    try {
      partial.actions = JSON.parse(rawActions);
    } catch { /* ignore */ }
    found = true;
  }

  const rawHistory = localStorage.getItem("dailyStats");
  if (rawHistory) {
    try {
      partial.history = JSON.parse(rawHistory);
    } catch { /* ignore */ }
    found = true;
  }

  return found ? partial : null;
}

function clearOldKeys(): void {
  OLD_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch { /* ignore */ }
  });
}

// ── Public API ──

export function loadData(): AppData {
  // 1. Try unified key first
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as AppData;
      data.level = calculateLevel(data.xp); // keep consistent
      if (!data.timeRecords) data.timeRecords = []; // backward compat
      return data;
    }
  } catch { /* fall through to migration */ }

  // 2. Migrate from old storage keys
  const migrated = migrateOldData();
  if (migrated) {
    const data: AppData = {
      username: DEFAULT_USERNAME,
      level: calculateLevel(migrated.xp ?? 0),
      xp: migrated.xp ?? 0,
      energy: migrated.energy ?? "normal",
      tasks: migrated.tasks ?? [...DEFAULT_TASKS],
      actions: migrated.actions ?? {},
      history: migrated.history ?? {},
      timeRecords: [],
      updatedAt: new Date().toISOString(),
    };
    saveData(data);
    clearOldKeys();
    return data;
  }

  // 3. Fresh start
  const data = createDefaultData();
  saveData(data);
  return data;
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

export function saveData(data: AppData): void {
  data.level = calculateLevel(data.xp);
  data.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ── Future: Supabase sync stubs ──
// These will be replaced with actual Supabase client calls.
// The AppData type is already designed to map to a Supabase table row.

export interface SyncResult {
  success: boolean;
  timestamp: string;
}
export async function syncToSupabase(data: AppData): Promise<SyncResult> {

  const now = new Date();

  const today = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;

  const todayKey = now.toDateString();
  const todayActions = data.actions[todayKey] ?? [];

  const timeMinutesPayload = data.timeRecords.reduce(
    (acc, item) => {
      acc[item.type] = (acc[item.type] ?? 0) + item.duration;
      return acc;
    },
    {} as Record<string, any>
  );
  if (todayActions.length > 0) {
    timeMinutesPayload["__actions"] = todayActions;
  }

  const { error } = await supabase.from("daily_stats").upsert(
    {
      date: today,
      energy: data.energy,
      completed_tasks: data.tasks.filter((t) => t.completed).length,
      minimal_actions: todayActions.length,
      xp: data.xp,
      time_minutes: timeMinutesPayload,
    },
    { onConflict: "date" }
  );

  if (error) {
    console.error("Supabase同步失败:", error);
    return { success: false, timestamp: new Date().toISOString() };
  }

  return { success: true, timestamp: new Date().toISOString() };
}export async function syncToCloud(data: AppData): Promise<SyncResult> {
  // TODO: const { error } = await supabase.from("user_data").upsert({
  //   id:    data.username,
  //   data:  data,
  //   updated_at: data.updatedAt,
  // });
  console.log("[storage] syncToCloud: not configured — would push", data.username);
  return { success: false, timestamp: "" };
}

/** Download cloud data for a user (future: Supabase select). */
export async function loadFromCloud(username: string): Promise<AppData | null> {
  // TODO: const { data, error } = await supabase.from("user_data")
  //   .select("*").eq("id", username).single();
  console.log("[storage] loadFromCloud: not configured — would fetch for", username);
  return null;
}











