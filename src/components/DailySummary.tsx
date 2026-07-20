export function DailySummary({ completedTasks, minimalActionCount, xpGained, streak }: { completedTasks: number; minimalActionCount: number; xpGained: number; streak: number }) {
  return (
    <section className="summary-section">
      <h2 className="section-title">每日总结</h2>
      <div className="summary-grid">
        <div className="summary-item"><span className="summary-value">{completedTasks}</span><span className="summary-label">完成任务</span></div>
        <div className="summary-item"><span className="summary-value">{minimalActionCount}</span><span className="summary-label">最小行动</span></div>
        <div className="summary-item"><span className="summary-value">+{xpGained}</span><span className="summary-label">获得 XP</span></div>
        <div className="summary-item"><span className="summary-value">{streak} 天</span><span className="summary-label">连续行动</span></div>
      </div>
    </section>
  );
}