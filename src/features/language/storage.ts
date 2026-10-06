import { durationLabels, languageLabels, platformLabels, topicLabels, type Duration, type Language, type Topic } from './recommendations';
export type QuickFeedbackReason =
  | 'not_target_language'
  | 'topic_mismatch'
  | 'low_quality'
  | 'dislike_type';

export interface LanguageLearningRecord {
  id: string; createdAt: string; startedAt: string; completedAt?: string;
  language: Exclude<Language, 'both'>; plannedDuration: Duration; contentId: string;
  title: string; creator?: string; platform: keyof typeof platformLabels; topic: Topic; url: string; bvid?: string;
  status: 'listening' | 'completed'; rating?: 1 | 2 | 3 | 4 | 5;
  feedbackOnly?: boolean;
  feedbackReason?: QuickFeedbackReason;
}
export type LanguageSession = { language: Language; duration: Duration; topic: Topic; updatedAt: string };
export const HISTORY_KEY = 'languageLearningHistory';
function validRecord(value: unknown): value is LanguageLearningRecord {
  if (!value || typeof value !== 'object') return false;
  const r = value as LanguageLearningRecord;
  return ['id', 'createdAt', 'startedAt', 'contentId', 'title', 'url'].every(key => typeof r[key as keyof LanguageLearningRecord] === 'string')
    && ['english', 'cantonese'].includes(r.language) && Object.hasOwn(durationLabels, r.plannedDuration)
    && Object.hasOwn(platformLabels, r.platform) && Object.hasOwn(topicLabels, r.topic)
    && ['listening', 'completed'].includes(r.status)
    && (r.status !== 'completed' || typeof r.completedAt === 'string')
    && (r.rating === undefined || (r.status === 'completed' && Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5))
    && (r.feedbackOnly === undefined || typeof r.feedbackOnly === 'boolean')
    && (r.feedbackReason === undefined || ['not_target_language', 'topic_mismatch', 'low_quality', 'dislike_type'].includes(r.feedbackReason))
    && /^https:\/\//.test(r.url);
}
function readHistory(): LanguageLearningRecord[] {
  const parsed: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  if (!Array.isArray(parsed) || !parsed.every(validRecord)) throw new Error('学习记录无法读取，原始数据已保留。');
  return parsed;
}
export function loadLanguageLearningHistory(): LanguageLearningRecord[] { return readHistory(); }
export function saveLanguageLearningRecord(record: LanguageLearningRecord): LanguageLearningRecord {
  if (!validRecord(record)) throw new Error('学习记录格式无效');
  let history = readHistory();

  // 正式开始收听时，移除同一内容之前的“候选阶段快速评分”；
  // 这样听完后的正式评分会自然成为唯一有效评分。
  if (!record.feedbackOnly) {
    history = history.filter(item => !(
      item.feedbackOnly
      && item.language === record.language
      && item.platform === record.platform
      && item.contentId === record.contentId
    ));
  }

  const existing = history.find(item =>
    item.id === record.id
    || (
      item.language === record.language
      && item.platform === record.platform
      && item.contentId === record.contentId
      && item.status === 'listening'
      && !item.feedbackOnly
    )
  );
  if (existing) return existing;

  localStorage.setItem(HISTORY_KEY, JSON.stringify([...history, record]));
  return record;
}

export function saveQuickLanguageFeedback({
  language,
  plannedDuration,
  contentId,
  title,
  creator,
  platform,
  topic,
  url,
  bvid,
  rating,
  reason,
}: {
  language: Exclude<Language, 'both'>;
  plannedDuration: Duration;
  contentId: string;
  title: string;
  creator?: string;
  platform: keyof typeof platformLabels;
  topic: Topic;
  url: string;
  bvid?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  reason?: QuickFeedbackReason;
}): LanguageLearningRecord {
  const now = new Date().toISOString();
  const id = `feedback:${language}:${platform}:${contentId}`;
  const record: LanguageLearningRecord = {
    id,
    createdAt: now,
    startedAt: now,
    completedAt: now,
    language,
    plannedDuration,
    contentId,
    title,
    creator,
    platform,
    topic,
    url,
    ...(bvid ? { bvid } : {}),
    status: 'completed',
    rating,
    feedbackOnly: true,
    ...(reason ? { feedbackReason: reason } : {}),
  };

  if (!validRecord(record)) throw new Error('快速评分格式无效');

  const history = readHistory();
  const index = history.findIndex(item =>
    item.feedbackOnly
    && item.language === language
    && item.platform === platform
    && item.contentId === contentId
  );

  if (index >= 0) {
    const previous = history[index];
    const next: LanguageLearningRecord = {
      ...previous,
      ...record,
      createdAt: previous.createdAt,
    };
    history[index] = next;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return next;
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify([...history, record]));
  return record;
}
export function updateLanguageLearningRecord(id: string, patch: { status?: 'completed'; rating?: LanguageLearningRecord['rating'] }): LanguageLearningRecord {
  const history = readHistory(), index = history.findIndex(item => item.id === id);
  if (index < 0) throw new Error('找不到这条学习记录');
  const previous = history[index];
  if (patch.rating !== undefined && previous.status !== 'completed') throw new Error('请先点击听完了');
  const next = { ...previous, ...patch, ...(patch.status === 'completed' ? { completedAt: previous.completedAt ?? new Date().toISOString() } : {}) };
  if (!validRecord(next)) throw new Error('评分应为 1 至 5 星');
  history[index] = next;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return next;
}
export function readLanguagePreferences() {
  let language: Language = 'both', duration: Duration = '10', topic: Topic = 'daily', last: LanguageSession | null = null;
  try {
    const l = localStorage.getItem('languagePreference'), d = localStorage.getItem('durationPreference');
    if (l && Object.hasOwn(languageLabels, l)) language = l as Language;
    if (d && Object.hasOwn(durationLabels, d)) duration = d as Duration;
    const t = localStorage.getItem('topicPreference');
    if (t && Object.hasOwn(topicLabels, t)) topic = t as Topic;
    const session = JSON.parse(localStorage.getItem('lastLanguageSession') || 'null');
    if (session && Object.hasOwn(languageLabels, session.language) && Object.hasOwn(durationLabels, session.duration) && typeof session.updatedAt === 'string') {
      // Older sessions did not have a topic; migrate them without touching history.
      last = { language: session.language, duration: session.duration, topic: Object.hasOwn(topicLabels, session.topic) ? session.topic : topic, updatedAt: session.updatedAt };
    }
  } catch { /* Defaults keep selectors usable when storage is unavailable. */ }
  return { language, duration, topic, last };
}
export function saveTopicPreference(topic: Topic) { localStorage.setItem('topicPreference', topic); }
export function saveLanguagePreferences(session: LanguageSession) {
  localStorage.setItem('languagePreference', session.language);
  localStorage.setItem('durationPreference', session.duration);
  saveTopicPreference(session.topic);
  localStorage.setItem('lastLanguageSession', JSON.stringify(session));
}


export type RecommendationMemoryItem = {
  id: string;
  url: string;
  bvid?: string;
  platform?: string;
  title?: string;
  seenAt: string;
};

export const RECENT_RECOMMENDATIONS_KEY = 'languageRecentRecommendations';
export const DISMISSED_RECOMMENDATIONS_KEY = 'languageDismissedRecommendations';

function recommendationKey(item: Pick<RecommendationMemoryItem, 'id' | 'url' | 'bvid' | 'platform'>) {
  if (item.platform && item.id) return `${item.platform}:${item.id}`;
  if (item.bvid) return `bvid:${item.bvid}`;
  return `url:${item.url}`;
}

function readRecommendationMemory(key: string): RecommendationMemoryItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is RecommendationMemoryItem => {
      if (!item || typeof item !== 'object') return false;
      const value = item as RecommendationMemoryItem;
      return typeof value.id === 'string'
        && typeof value.url === 'string'
        && typeof value.seenAt === 'string';
    });
  } catch {
    return [];
  }
}

function writeRecommendationMemory(key: string, items: RecommendationMemoryItem[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

export function rememberRecentRecommendations(
  items: Array<{
    id: string;
    url: string;
    bvid?: string;
    platform?: string;
    title?: string;
  }>,
) {
  const previous = readRecommendationMemory(RECENT_RECOMMENDATIONS_KEY);
  const now = new Date().toISOString();

  const incoming: RecommendationMemoryItem[] = items
    .filter(item => item.id && item.url)
    .map(item => ({
      id: item.id,
      url: item.url,
      ...(item.bvid ? { bvid: item.bvid } : {}),
      ...(item.platform ? { platform: item.platform } : {}),
      ...(item.title ? { title: item.title } : {}),
      seenAt: now,
    }));

  const merged = [...incoming, ...previous];
  const seen = new Set<string>();
  const unique: RecommendationMemoryItem[] = [];

  for (const item of merged) {
    const key = recommendationKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
    if (unique.length >= 10) break;
  }

  writeRecommendationMemory(RECENT_RECOMMENDATIONS_KEY, unique);
  return unique;
}

export function dismissRecommendation(
  item: {
    id: string;
    url: string;
    bvid?: string;
    platform?: string;
    title?: string;
  },
) {
  const previous = readRecommendationMemory(DISMISSED_RECOMMENDATIONS_KEY);
  const nextItem: RecommendationMemoryItem = {
    id: item.id,
    url: item.url,
    ...(item.bvid ? { bvid: item.bvid } : {}),
    ...(item.platform ? { platform: item.platform } : {}),
    ...(item.title ? { title: item.title } : {}),
    seenAt: new Date().toISOString(),
  };

  const key = recommendationKey(nextItem);
  const next = [
    nextItem,
    ...previous.filter(existing => recommendationKey(existing) !== key),
  ].slice(0, 200);

  writeRecommendationMemory(DISMISSED_RECOMMENDATIONS_KEY, next);
  return nextItem;
}

export function readRecommendationExclusions(): string[] {
  const recent = readRecommendationMemory(RECENT_RECOMMENDATIONS_KEY);
  const dismissed = readRecommendationMemory(DISMISSED_RECOMMENDATIONS_KEY);
  const values = new Set<string>();

  for (const item of [...recent, ...dismissed]) {
    if (item.id) values.add(item.id);
    if (item.url) values.add(item.url);
    if (item.bvid) values.add(item.bvid);
  }

  return [...values];
}
