import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { durationLabels, formatDuration, getLanguageRecommendations, handleCopy, languageLabels, platformLabels, topicLabels, type Duration, type Language, type LanguageContentItem, type Topic, type RecommendationGroup } from '../../features/language/recommendations';
import { loadLanguageLearningHistory, readLanguagePreferences, saveLanguagePreferences, saveTopicPreference, saveLanguageLearningRecord, saveQuickLanguageFeedback, HISTORY_KEY, type LanguageLearningRecord, type QuickFeedbackReason } from '../../features/language/storage';
import { LearningRecordCard } from './LearningRecordCard';
import './ProfileSettings.css';
function recordId(item: LanguageContentItem) {
  const today = new Date();
  const date = [today.getFullYear(), today.getMonth() + 1, today.getDate()].join('-');
  return `${date}:${item.language}:${item.platform}:${item.id}`;
}
export function LanguageLearningCard() {
  const [preferences] = useState(readLanguagePreferences);
  const [language, setLanguage] = useState<Language>(preferences.language);
  const [duration, setDuration] = useState<Duration>(preferences.duration);
  const [topic, setTopic] = useState<Topic>(preferences.topic);
  const [last, setLast] = useState(preferences.last);
  const [results, setResults] = useState<RecommendationGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);
  const querying = useRef(false);
  const shown = useRef(new Set<string>());
  const successfulSelection = useRef<{ language: Language; duration: Duration; topic: Topic } | null>(null);
  useEffect(() => () => { requestId.current += 1; }, []);
  const [resultDuration, setResultDuration] = useState<Duration>(preferences.last?.duration ?? duration);
  const [selected, setSelected] = useState<Partial<Record<Exclude<Language, 'both'>, string>>>({});
  const [history, setHistory] = useState<LanguageLearningRecord[]>([]);
  const [active, setActive] = useState<{ item: LanguageContentItem; anchor: HTMLButtonElement } | null>(null);
  const [notice, setNotice] = useState('');
  function refreshHistory() {
    try { setHistory(loadLanguageLearningHistory()); }
    catch { setNotice('学习记录暂时无法读取，原始数据已保留。'); }
  }
  useEffect(() => {
    refreshHistory();
    const sync = (event: StorageEvent) => { if (event.key === HISTORY_KEY || event.key === null) refreshHistory(); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  async function handleStartLanguageSession(changeBatch = false) {
  if (querying.current) return;

  querying.current = true;

  const id = ++requestId.current;

  const criteria =
    changeBatch && successfulSelection.current
      ? successfulSelection.current
      : { language, duration, topic };

  const session = {
    ...criteria,
    updatedAt: new Date().toISOString(),
  };

  setLast(session);
  setNotice('');
  setLoading(true);

  try {
    saveLanguagePreferences(session);
  } catch {
    setNotice('浏览器未允许保存，当前选择仍可使用。');
  }

  try {
    const next = await getLanguageRecommendations({
      ...criteria,
      history,
      excludedIds: [...shown.current],
      count: 2,
    });

    if (id !== requestId.current) return;

    const hasNewItems = next.some(
      group => group.items.length > 0,
    );

    // 第一次搜索完全没有结果：正常报提示。
    if (!changeBatch && !hasNewItems) {
      throw new Error(
        next
          .flatMap(group => group.warnings)
          .join('；') ||
          '暂时没有找到符合当前条件的内容。',
      );
    }

    // 换一批时两个语言都没搜到新的：
    // 保留原来的推荐，不清空页面。
    if (changeBatch && !hasNewItems) {
      const message =
        next
          .flatMap(group => group.warnings)
          .filter(Boolean)[0] ||
        '暂时没有更多符合当前条件的内容。';

      setNotice(message);
      return;
    }

    /*
     * 换一批时按语言分别处理：
     *
     * - 该语言找到了新内容 → 使用新内容
     * - 该语言一条都没找到 → 保留上一批
     *
     * 这样不会出现“英语换成功了，
     * 粤语整个消失”的情况。
     */
    const finalResults = changeBatch
      ? next.map(group => {
          if (group.items.length > 0) {
            return group;
          }

          return (
            results.find(
              previous =>
                previous.language === group.language,
            ) ?? group
          );
        })
      : next;

    // 记录真正新出现的项目，下一次继续排除。
    next.forEach(group =>
      group.items.forEach(item =>
        [item.id, item.url, item.bvid].forEach(key => {
          if (key) shown.current.add(key);
        }),
      ),
    );

    successfulSelection.current = criteria;

    setResults(finalResults);
    setSelected({});
    setActive(null);
    setResultDuration(criteria.duration);

    // 如果其中一个语言没换成功，给个很轻的提示。
    if (
      changeBatch &&
      next.some(group => group.items.length === 0)
    ) {
      setNotice(
        '部分语言暂时没有更多合适内容，已保留上一批。',
      );
    } else {
      setNotice('');
    }
  } catch (error) {
    if (id === requestId.current) {
      setNotice(
        error instanceof Error
          ? error.message
          : '补搜未完成，请稍后重试。',
      );
    }
  } finally {
    querying.current = false;

    if (id === requestId.current) {
      setLoading(false);
    }
  }
}

  function existingRecord(item: LanguageContentItem) {
    return history.find(record =>
      !record.feedbackOnly
      && (
        record.id === recordId(item)
        || (
          record.language === item.language
          && record.platform === item.platform
          && record.contentId === item.id
          && record.status === 'listening'
        )
      )
    );
  }

  function quickFeedback(item: LanguageContentItem) {
    return history.find(record =>
      record.feedbackOnly
      && record.language === item.language
      && record.platform === item.platform
      && record.contentId === item.id
    );
  }

  function rateCandidate(
    item: LanguageContentItem,
    rating: 1 | 2 | 3 | 4 | 5,
    reason?: QuickFeedbackReason,
  ) {
    try {
      saveQuickLanguageFeedback({
        language: item.language,
        plannedDuration: resultDuration,
        contentId: item.id,
        title: item.title,
        creator: item.creator,
        platform: item.platform,
        topic: item.topic,
        url: item.url,
        ...(item.bvid ? { bvid: item.bvid } : {}),
        rating,
        ...(reason ? { reason } : {}),
      });

      refreshHistory();

      setNotice(
        rating <= 2
          ? '已记下这条不太合适，后续推荐会避开这条内容。'
          : '已保存你的快速评分。',
      );
    } catch {
      setNotice('快速评分保存失败，请稍后再试。');
    }
  }

  function startListening(item: LanguageContentItem) {
    try {
      const now = new Date().toISOString();
      saveLanguageLearningRecord({ id: recordId(item), createdAt: now, startedAt: now, language: item.language, plannedDuration: resultDuration, contentId: item.id, title: item.title, creator: item.creator, platform: item.platform, topic: item.topic, url: item.url, ...(item.bvid ? { bvid: item.bvid } : {}), status: 'listening' });
      refreshHistory(); setNotice('');
      window.open(item.url, '_blank', 'noopener,noreferrer');
    } catch { setNotice('学习记录未能保存，请检查浏览器存储后重试。'); }
  }
  const groups = results.length ? results : (['cantonese', 'english'] as const).filter(value => history.some(record => record.language === value)).map(value => ({ language: value, items: [] as LanguageContentItem[], status: 'ready' as const, warnings: [], steps: [] }));
  return <section className="listening-card" aria-labelledby="listening-title">
    <div className="settings-eyebrow">DAILY LISTENING</div><h2 id="listening-title">语言学习</h2>
    <fieldset disabled={loading}><legend>今天想听什么？</legend><div className="choice-pills">{(Object.keys(languageLabels) as Language[]).map(value => <button type="button" key={value} aria-pressed={language === value} onClick={() => setLanguage(value)}>{languageLabels[value]}</button>)}</div></fieldset>
    <fieldset disabled={loading}><legend>今天有多少时间？</legend><div className="choice-pills duration-pills">{(Object.keys(durationLabels) as Duration[]).map(value => <button type="button" key={value} aria-pressed={duration === value} onClick={() => setDuration(value)}>{durationLabels[value]}</button>)}</div></fieldset>
    <fieldset disabled={loading}><legend>今天想听什么类型？</legend><div className="choice-pills topic-pills">{(Object.keys(topicLabels) as Topic[]).map(value => <button type="button" key={value} aria-pressed={topic === value} onClick={() => { setTopic(value); try { saveTopicPreference(value); } catch { setNotice('浏览器未允许保存分类，当前选择仍可使用。'); } }}>{topicLabels[value]}</button>)}</div></fieldset>
    <div className="recent-choice"><span>最近选择</span><strong>{last ? `${languageLabels[last.language]} · ${durationLabels[last.duration]} · ${topicLabels[last.topic]}` : '还没有记录，选一个舒服的节奏吧'}</strong></div>
    <button className="warm-primary start-listening" disabled={loading} onClick={() => handleStartLanguageSession()}>{loading ? '正在为你找新的内容…' : '开始今日学习'} <span aria-hidden="true">↗</span></button>
    {loading && (
  <p className="source-note" role="status">
    正在为你找新的内容…
  </p>
)}
    {!!results.length && <button className="candidate-details" disabled={loading} onClick={() => handleStartLanguageSession(true)}>换一批</button>}
    {notice && <p role="status">{notice}</p>}
    <div>{groups.map(group => {
      const choice = group.items.find(item => item.id === selected[group.language]);
      const current = choice && existingRecord(choice);
      const records = history.filter(record => record.language === group.language && !record.feedbackOnly).slice().reverse();
      return <section className="recommendation-group" key={group.language} aria-label={`${languageLabels[group.language]}学习`}>
        <h3>{languageLabels[group.language]}<span>{results.length ? (group.items.length === 2 ? '两个候选，选一个开始' : '匹配内容不足') : '收听与评价'}</span></h3>
        {results.length > 0 && group.items.length < 2 && <p className="source-note" role="status">{group.status === 'unavailable' ? '本地内容不足，部分平台补搜未完成；暂时无法确认是否有足够匹配内容。' : group.items.length ? '本地检索与补搜后，仅找到 1 条符合当前条件的内容。' : '暂时没有找到符合当前条件的内容。'}</p>}
        {!!group.warnings.length && <p className="source-note">{group.warnings.join('；')}</p>}
        {!!group.items.length && <>
          <div className="recommendation-grid" role="radiogroup" aria-label={`${languageLabels[group.language]}候选`}>{group.items.map(item => {
            const feedback = quickFeedback(item);
            return <div className="candidate-wrap" key={item.id}>
              <label className={`recommendation-option${selected[group.language] === item.id ? ' is-selected' : ''}`}>
                <input className="candidate-radio" type="radio" name={`candidate-${group.language}`} checked={selected[group.language] === item.id} onChange={() => setSelected(previous => ({ ...previous, [group.language]: item.id }))} aria-label={item.title} />
                <span className="candidate-tags"><span className="recommendation-platform">{platformLabels[item.platform]}</span><span className="topic-tag">{topicLabels[item.topic]}</span></span>
                <strong>{item.title}</strong><span className="recommendation-duration">{formatDuration(item.duration)}<span className="radio-indicator" aria-hidden="true" /></span>
              </label>

              <CandidateQuickRating
                item={item}
                feedback={feedback}
                onRate={rateCandidate}
              />

              <button className="candidate-details" aria-label={`查看详情：${item.title}`} aria-haspopup="dialog" aria-expanded={active?.item.id === item.id} onClick={e => setActive(active?.item.id === item.id ? null : { item, anchor: e.currentTarget })}>查看详情 ↗</button>
            </div>;
          })}</div>
          <button className="warm-primary confirm-listening" disabled={!choice || !!current} onClick={() => choice && startListening(choice)}>就听这个了</button>
          {current && <p className="source-note">{current.status === 'listening' ? '这条内容正在听，回来后可点击「听完了」。' : '今天已经记录过这条内容，可在下方修改评分。'}</p>}
        </>}
        {records.length > 0 && <div className="listening-records" aria-label={`${languageLabels[group.language]}收听记录`}>{records.map(record => <LearningRecordCard key={record.id} record={record} onUpdate={refreshHistory} />)}</div>}
      </section>;
    })}</div>
    {!!results.length && <p className="source-note">由原听学 Skill 筛选推荐 · 语言与主题依据公开元信息，未逐条试听。</p>}
    {active && <RecommendationPopover item={active.item} anchor={active.anchor} onClose={() => setActive(null)} />}
  </section>;
}

const QUICK_RATING_OPTIONS = [
  { rating: 5 as const, label: '很喜欢', short: '5 星' },
  { rating: 4 as const, label: '不错', short: '4 星' },
  { rating: 3 as const, label: '一般', short: '3 星' },
  { rating: 2 as const, label: '不太合适', short: '2 星' },
  { rating: 1 as const, label: '不想再看到', short: '1 星' },
];

const QUICK_REASON_OPTIONS: { value: QuickFeedbackReason; label: string }[] = [
  { value: 'not_target_language', label: '不是目标语言 / 只有字幕是目标语言' },
  { value: 'topic_mismatch', label: '主题不相关' },
  { value: 'low_quality', label: '内容质量一般' },
  { value: 'dislike_type', label: '不喜欢这类内容' },
];

function CandidateQuickRating({
  item,
  feedback,
  onRate,
}: {
  item: LanguageContentItem;
  feedback?: LanguageLearningRecord;
  onRate: (
    item: LanguageContentItem,
    rating: 1 | 2 | 3 | 4 | 5,
    reason?: QuickFeedbackReason,
  ) => void;
}) {
  const [ratingOpen, setRatingOpen] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedRating = QUICK_RATING_OPTIONS.find(
    option => option.rating === feedback?.rating,
  );
  const selectedReason = QUICK_REASON_OPTIONS.find(
    option => option.value === feedback?.feedbackReason,
  );
  const lowScore = !!feedback?.rating && feedback.rating <= 2;

  useEffect(() => {
    function outside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setRatingOpen(false);
        setReasonOpen(false);
      }
    }

    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setRatingOpen(false);
        setReasonOpen(false);
      }
    }

    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', key);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="candidate-feedback"
      aria-label={`快速评价：${item.title}`}
    >
      <div className="candidate-feedback-row">
        <div className="candidate-popup">
          <button
            type="button"
            className={`candidate-popup-trigger${feedback?.rating ? ' has-value' : ''}`}
            aria-haspopup="menu"
            aria-expanded={ratingOpen}
            onClick={() => {
              setRatingOpen(open => !open);
              setReasonOpen(false);
            }}
          >
            <span>{selectedRating ? selectedRating.label : '快速评分'}</span>
            {selectedRating && <small>{selectedRating.short}</small>}
            <span className="popup-chevron" aria-hidden="true">⌄</span>
          </button>

          {ratingOpen && (
            <div className="candidate-popup-menu" role="menu">
              {QUICK_RATING_OPTIONS.map(option => (
                <button
                  type="button"
                  key={option.rating}
                  className={feedback?.rating === option.rating ? 'is-current' : ''}
                  role="menuitemradio"
                  aria-checked={feedback?.rating === option.rating}
                  onClick={() => {
                    onRate(
                      item,
                      option.rating,
                      feedback?.rating === option.rating
                        ? feedback?.feedbackReason
                        : undefined,
                    );
                    setRatingOpen(false);
                    if (option.rating <= 2) {
                      setReasonOpen(true);
                    }
                  }}
                >
                  <span>{option.label}</span>
                  <span className="popup-meta">{option.short}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {lowScore && (
          <div className="candidate-popup reason-popup">
            <button
              type="button"
              className={`candidate-popup-trigger reason-trigger${feedback?.feedbackReason ? ' has-value' : ''}`}
              aria-haspopup="menu"
              aria-expanded={reasonOpen}
              onClick={() => {
                setReasonOpen(open => !open);
                setRatingOpen(false);
              }}
            >
              <span>{selectedReason ? selectedReason.label : '为什么不合适'}</span>
              <span className="popup-chevron" aria-hidden="true">⌄</span>
            </button>

            {reasonOpen && (
              <div className="candidate-popup-menu reason-menu" role="menu">
                {QUICK_REASON_OPTIONS.map(option => (
                  <button
                    type="button"
                    key={option.value}
                    className={feedback?.feedbackReason === option.value ? 'is-current' : ''}
                    role="menuitemradio"
                    aria-checked={feedback?.feedbackReason === option.value}
                    onClick={() => {
                      if (feedback?.rating) {
                        onRate(item, feedback.rating, option.value);
                      }
                      setReasonOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RecommendationPopover({ item, anchor, onClose }: { item: LanguageContentItem; anchor: HTMLButtonElement; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 12, top: 12 });
  const [feedback, setFeedback] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useLayoutEffect(() => {
    function place() {
      if (!ref.current) return;
      const a = anchor.getBoundingClientRect(), p = ref.current.getBoundingClientRect();
      const below = a.bottom + 8;
      setPosition({ left: Math.max(12, Math.min(a.left, window.innerWidth - p.width - 12)), top: Math.max(12, Math.min(below + p.height <= window.innerHeight - 12 ? below : a.top - p.height - 8, window.innerHeight - p.height - 12)) });
    }
    place(); window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [anchor, item]);
  useEffect(() => {
    setFeedback(''); clearTimeout(timer.current);
    ref.current?.focus({ preventScroll: true });
    function outside(e: PointerEvent) { if (!ref.current?.contains(e.target as Node) && !(e.target as Element).closest('.candidate-details')) onClose(); }
    function key(e: KeyboardEvent) { if (e.key === 'Escape') { onClose(); anchor.focus({ preventScroll: true }); } }
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', key); clearTimeout(timer.current); };
  }, [item, anchor, onClose]);
  async function copy(text: string, successMessage: string) {
    try { setFeedback(await handleCopy({ text, successMessage })); } catch { setFeedback('复制失败，请手动复制链接'); }
    clearTimeout(timer.current); timer.current = setTimeout(() => setFeedback(''), 1800);
  }
  return createPortal(<div ref={ref} className="recommendation-popover" style={position} role="dialog" aria-label={item.title} tabIndex={-1}>
    <button className="popover-close" aria-label="关闭推荐详情" onClick={onClose}>×</button>
    <div className="settings-eyebrow">{platformLabels[item.platform]} · {formatDuration(item.duration)}</div><h3>{item.title}</h3><p className="creator-name">{item.creator}</p><p>{item.reason || item.description}</p>
    <div className="popover-actions"><a href={item.url} target="_blank" rel="noopener noreferrer">打开{platformLabels[item.platform]} ↗</a>{item.platform === 'bilibili' && <button disabled={!item.bvid} title={item.bvid ? undefined : '素材未提供 BV 号，可复制链接'} onClick={() => item.bvid && copy(item.bvid, '已复制BV号')}>复制BV号</button>}<button onClick={() => copy(item.url, '已复制链接')}>复制链接</button></div><div className="copy-feedback" role="status">{feedback}</div>
  </div>, document.body);
}



