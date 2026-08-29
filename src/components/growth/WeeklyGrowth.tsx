import type { DayStats } from "../../storage";

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

function toInputDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

interface WeeklyGrowthProps {
  dailyStats: Record<string, DayStats>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function WeeklyGrowth({ dailyStats, selectedDate, onSelectDate }: WeeklyGrowthProps) {
  const today = new Date();
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(localToday);
    date.setDate(localToday.getDate() - (6 - index));
    const stats = dailyStats[date.toDateString()];
    const completed = (stats?.completedTasks ?? 0) + (stats?.minimalActionCount ?? 0);

    return {
      date,
      dateKey: toInputDate(date),
      completed,
      isToday: index === 6,
    };
  });

  const weeklyCompleted = days.reduce((sum, day) => sum + day.completed, 0);
  const growthDays = days.filter((day) => day.completed > 0).length;
  const scaleMax = Math.max(4, ...days.map((day) => day.completed));

  return (
    <section className="weekly-growth-card" aria-labelledby="weekly-growth-title">
      <div className="weekly-growth-header">
        <h2 id="weekly-growth-title" className="weekly-growth-title">本周成长</h2>
        <span className="weekly-growth-total">完成 {weeklyCompleted} 项</span>
      </div>

      <div className="weekly-growth-chart" aria-label="最近 7 天成长记录">
        {days.map((day) => {
          const selected = day.dateKey === selectedDate;
          const barHeight = day.completed === 0
            ? 5
            : Math.max(8, Math.round((day.completed / scaleMax) * 66));
          const dateLabel = `${day.date.getMonth() + 1}月${day.date.getDate()}日`;

          return (
            <button
              key={day.dateKey}
              type="button"
              className={`weekly-growth-day${selected ? " selected" : ""}${day.isToday ? " today" : ""}`}
              onClick={() => onSelectDate(day.dateKey)}
              aria-pressed={selected}
              aria-label={`${dateLabel}，完成 ${day.completed} 项${day.isToday ? "，今天" : ""}`}
            >
              <span className="weekly-growth-track" aria-hidden="true">
                <span className="weekly-growth-bar" style={{ height: `${barHeight}px` }} />
              </span>
              <span className="weekly-growth-weekday">{WEEKDAY_LABELS[day.date.getDay()]}</span>
              <span className="weekly-growth-date">{day.date.getMonth() + 1}/{day.date.getDate()}</span>
            </button>
          );
        })}
      </div>

      <p className="weekly-growth-summary">本周完成 {weeklyCompleted} 项 · 成长 {growthDays} 天</p>
    </section>
  );
}
