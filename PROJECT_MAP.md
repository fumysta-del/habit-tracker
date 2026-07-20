# PROJECT MAP — 行动力助手 (Habit Tracker)

## 项目定位

**Personal Growth App（个人成长应用）**

核心方向融合三条设计线：

1. **Apple Fitness 风格** — 简洁、留白、大数字展示、清晰信息层级、柔和动画
2. **RPG 成长系统** — Level / XP / 属性 / 任务 / 成就
3. **个人媒体库**（未来）— 用户上传游戏截图、动漫图片、壁纸、视觉素材

---

## 当前已有功能

### 核心系统

| 功能 | 描述 | 数据来源 |
|------|------|----------|
| **XP 系统** | 完成任务获得 XP（固定任务表 + 自定义任务 10 XP），最小行动每次 +3 XP | `todayStats.xpGained` 实时计算 |
| **Level 系统** | `Math.floor(totalXp / 100) + 1`，每 100 XP 升一级，进度条显示当前级剩余 XP | `calculateTotalXp()` 从历史 + 今日实时数据计算 |
| **Energy 状态** | 三段式选择器：低能量 `(( _ _ ))..zzzZZ` / 普通 `＜コ:彡` / 高能量 `^ ^`，保存在 `daily_stats` | `userData.energy` → 云端同步 |

### 任务系统

| 功能 | 描述 |
|------|------|
| **默认任务** | 运动10分钟 (+20 XP)、学习30分钟 (+30 XP)、整理桌面 (+5 XP) |
| **自定义任务** | 通过输入框添加，+10 XP |
| **勾选完成** | 任务完成/取消联动加减 XP |
| **删除任务** | 删除已完成任务时扣除对应 XP |
| **云端同步** | 增删改直接操作 Supabase `tasks` 表 |

### 最小行动

| 功能 | 描述 |
|------|------|
| **四个快捷按钮** | 喝水、拉伸30秒、走到客厅、打开学习资料 |
| **事件记录** | 每次点击生成一条 `MinimalRecord`，含 action、timestamp、xp |
| **实时显示** | 今日记录列表：时间 / 行动名称 / +3XP / 撤销按钮 |
| **云端同步** | 嵌入 `daily_stats.time_minutes.__actions` JSONB 字段同步 |

### 时间记录

| 功能 | 描述 |
|------|------|
| **四个分类** | 🎮 游戏 / 📚 学习 / 🏃 运动 / 🛌 休息 |
| **开始/结束** | 点击"开始"记录时间，点击"结束"计算持续分钟数 |
| **今日累计** | 实时显示各分类今日总分钟数，运行中计时每 30s 刷新 |

### 历史

| 功能 | 描述 |
|------|------|
| **日期选择** | 通过 `<input type="date">` 查看任意一天 |
| **日报展示** | 当日状态、完成任务数、最小行动次数、获得 XP、时间分配 |
| **数据来源** | `dailyStats` 快照（每日自动保存，云端同步） |

### 周报

| 功能 | 描述 |
|------|------|
| **本周概览** | 完成任务总数、最小行动总次数、获得 XP 总量、连续行动天数 |
| **状态分析** | 7 天能量分布柱状图（低/普通/高） |
| **时间分配** | 四类累计时间（小时+分钟格式） |
| **每日趋势** | 7 天逐日 XP 和任务数列表 |

### 数据同步

| 功能 | 描述 |
|------|------|
| **localStorage** | 本地持久化，统一键 `habitData`，包含完整 `AppData` |
| **Supabase 同步** | `syncToSupabase()` 每日写入 `daily_stats` 表，`initFromCloud()` 启动时读取 |
| **跨设备** | 手机操作 → 云端同步 → 电脑加载后显示一致 |
| **离线优先** | 首次渲染使用 localStorage，云端数据异步覆盖 |

---

## 当前页面

所有页面都在 `App.tsx` 中通过 `activeTab` state (`"today" | "history" | "weekly"`) 条件渲染。

| 页面 | Tab 名称 | 功能 | 代码位置 |
|------|----------|------|----------|
| 今日 | 今日 | 所有操作主面板 | `App.tsx:245-468`（today 分支） |
| 历史 | 历史 | 按日期查看日报 | `App.tsx:469-527`（history 分支） |
| 周报 | 周报 | 7 天汇总统计 | `App.tsx:528-630`（weekly 分支） |
| 底部导航 | — | 页签切换 | `App.tsx:632-654` |

---

## 数据结构

### Supabase 表

| 表名 | 字段 | 用途 |
|------|------|------|
| `tasks` | `id, text, completed` | 任务增删改 |
| `daily_stats` | `date, energy, completed_tasks, minimal_actions, xp, time_minutes` | 每日摘要（含嵌入的 `__actions` JSON） |
| `time_records` | （表已创建，未启用同步） | 预留 |

### localStorage

| Key | 类型 | 用途 |
|-----|------|------|
| `habitData` | `AppData` JSON | 完整应用状态 |

### 数据同步流程

```
用户操作
    ↓
React state 更新
    ↓
useEffect（cloudReady 保护）
    ↓
saveData() → localStorage 写入
syncToSupabase() → Supabase daily_stats 写入
    ↓
另一设备加载
initFromCloud() → Supabase 读取 → setState 覆盖
    ↓
cloudReady = true → 同步开启
```

### 数据读取/保存位置

| 操作 | 函数 | 文件 |
|------|------|------|
| 读取 localStorage | `loadData()` | `storage.ts:97-132` |
| 写入 localStorage | `saveData()` | `storage.ts:136-140` |
| 读取 Supabase | `initFromCloud()` 内联 | `App.tsx:157-240` |
| 写入 Supabase | `syncToSupabase()` | `storage.ts:195-242` |
| 计算总 XP | `calculateTotalXp()` | `storage.ts:136-144` |

---

## 组件结构

当前所有 UI 都在 `App.tsx` 一个文件中，暂无拆分组件。

### 可拆分为独立组件的部分（未来建议）

| 潜在组件 | 描述 | 复用处 |
|----------|------|--------|
| `EnergySelector` | 三段式能量选择器 | 今日页面 |
| `LevelBar` | 等级 + XP 进度条 | 今日页面 |
| `DailySummary` | 每日总结四格卡片 | 今日页面 |
| `TimeTracker` | 时间记录区域 | 今日页面 |
| `MinimalActions` | 最小行动按钮组 | 今日页面 |
| `MinimalRecordsList` | 最小行动记录列表 | 今日页面 |
| `TaskInput` | 任务添加输入框 | 今日页面 |
| `TaskList` | 任务列表（含 checkbox） | 今日页面 |
| `HistoryPage` | 历史页面 | 历史 tab |
| `WeeklyPage` | 周报页面 | 周报 tab |
| `BottomNav` | 底部导航栏 | 全局 |
| `StatCard` | 统计数字卡片 | 摘要 / 周报 |
| `ProgressBar` | 进度条组件 | Level / 能量分布 |

---

## 关键文件清单

| 文件 | 大小 | 职责 |
|------|------|------|
| `src/App.tsx` | ~660 行 | 主组件：所有 UI 逻辑 + 状态管理 + 渲染 |
| `src/App.css` | ~620 行 | 全应用样式 |
| `src/storage.ts` | ~310 行 | 数据层：类型定义 + localStorage + Supabase 同步 |
| `src/supabase.ts` | 7 行 | Supabase 客户端初始化 |
| `src/index.css` | 17 行 | 全局 reset |
| `src/main.tsx` | 10 行 | React 入口 |

