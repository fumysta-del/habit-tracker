import type { EvalResult } from "../../utils/actionEvaluator";

interface Props {
  result: EvalResult;
  onClaim: () => void;
  onClose: () => void;
}

function Stars(n: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={`eval-star ${i < n ? "filled" : ""}`}>★</span>
  ));
}

function attrLabel(k: string): string {
  const map: Record<string, string> = {
    focus: "专注", knowledge: "知识", discipline: "自律",
    energy: "精力", creativity: "创造力", social: "社交", money: "财富",
  };
  return map[k] ?? k;
}

const ATTR_COLORS: Record<string, string> = {
  focus: "#c4956a", knowledge: "#8fb0a0", discipline: "#7a7166",
  energy: "#e8836a", creativity: "#a67c52", social: "#e8c47a", money: "#cc5a4a",
};

export function ActionEvaluationModal({ result, onClaim, onClose }: Props) {
  return (
    <div className="eval-overlay" onClick={onClose}>
      <div className="eval-modal glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="eval-header">
          <span className="eval-badge">✨ 行动鉴定完成</span>
        </div>

        <div className="eval-body">
          <div className="eval-action-display">
            <span className="eval-action-icon">{result.categoryIcon}</span>
            <span className="eval-action-text">{result.action}</span>
          </div>

          <div className="eval-meta">
            <span className="eval-tag">{result.categoryIcon} {result.categoryLabel}</span>
            {result.durationMinutes > 0 && (
              <span className="eval-tag">⏱ {result.durationMinutes}分钟</span>
            )}
          </div>

          <div className="eval-rating">
            <div className="eval-stars">{Stars(result.rating)}</div>
            <span className="eval-rating-label">{result.ratingLabel}</span>
          </div>

          <div className="eval-analysis">
            <p>{result.analysis}</p>
          </div>

          <div className="eval-rewards">
            <div className="eval-xp-reward">
              <span className="eval-xp-label">获得奖励</span>
              <span className="eval-xp-value">+{result.totalXP} XP</span>
            </div>
          </div>

          {Object.keys(result.attrBonus).length > 0 && (
            <div className="eval-attr-bonus">
              <span className="eval-attr-title">属性提升</span>
              <div className="eval-attr-list">
                {Object.entries(result.attrBonus).map(([k, v]) => (
                  <div key={k} className="eval-attr-item" style={{ color: ATTR_COLORS[k] ?? "#7a7166" }}>
                    <span className="eval-attr-name">{attrLabel(k)}</span>
                    <span className="eval-attr-val">+{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="eval-footer">
          <button className="eval-btn eval-btn-primary" onClick={onClaim}>
            领取奖励
          </button>
          <button className="eval-btn eval-btn-secondary" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
