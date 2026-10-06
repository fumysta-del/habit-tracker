import { useEffect, useRef, useState } from 'react';
import { platformLabels, topicLabels } from '../../features/language/recommendations';
import { updateLanguageLearningRecord, type LanguageLearningRecord } from '../../features/language/storage';
export function LearningRecordCard({ record, onUpdate }: { record: LanguageLearningRecord; onUpdate: () => void }) {
  const [hover, setHover] = useState(0);
  const [fresh, setFresh] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  function complete() {
    try { updateLanguageLearningRecord(record.id, { status: 'completed' }); setError(''); onUpdate(); }
    catch { setError('未能保存完成状态，请重试。'); }
  }
  function rate(rating: NonNullable<LanguageLearningRecord['rating']>) {
    try {
      updateLanguageLearningRecord(record.id, { rating }); setError(''); onUpdate(); setFresh(true);
      clearTimeout(timer.current); timer.current = setTimeout(() => setFresh(false), 1600);
    } catch { setError('评分未能保存，请重试。'); }
  }
  return <article className="learning-record" data-record-id={record.id}>
    <div className="record-meta"><span>{record.status === 'listening' ? '正在听 · 待评价' : '已听完'}</span><span>{platformLabels[record.platform]} · {topicLabels[record.topic]}</span></div>
    <h4>{record.title}</h4>
    {record.status === 'listening' ? <div className="record-actions"><a href={record.url} target="_blank" rel="noopener noreferrer">返回内容 ↗</a><button onClick={complete}>听完了</button></div> : <div className="rating-area">
      <p>给今天这条内容打个分</p>
      <div className="rating-stars" role="group" aria-label="内容评分" onMouseLeave={() => setHover(0)}>
        {([1, 2, 3, 4, 5] as const).map(star => <button type="button" key={star} aria-label={`${star} 星`} aria-pressed={record.rating === star} className={(hover || record.rating || 0) >= star ? 'star-filled' : ''} onMouseEnter={() => setHover(star)} onFocus={() => setHover(star)} onBlur={() => setHover(0)} onClick={() => rate(star)}><span aria-hidden="true">{(hover || record.rating || 0) >= star ? '★' : '☆'}</span></button>)}
      </div>
      <span className={`rating-feedback${fresh ? ' is-fresh' : ''}`} role="status">{record.rating ? `已记录 · ${record.rating} 星` : '点击星星，即可保存'}</span>
    </div>}
    {error && <p className="record-error" role="alert">{error}</p>}
  </article>;
}
