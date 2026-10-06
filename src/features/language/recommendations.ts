import type { LanguageLearningRecord } from './storage';

export const topicLabels = {
  daily: '生活日常', study: '校园学习', conversation: '聊天访谈', food_travel: '美食旅行',
  entertainment: '影视娱乐', culture_society: '文化社会', tech_media: '科技媒体', personal: '个人经历',
};

export type Topic = keyof typeof topicLabels;
export type Language = 'cantonese' | 'english' | 'both';
export type Duration = '5' | '10' | '20' | '30' | '30plus';

export interface LanguageContentItem {
  id: string;
  language: Exclude<Language, 'both'>;
  title: string;
  platform: 'bilibili' | 'xiaohongshu' | 'douyin';
  creator: string;
  duration: number;
  url: string;
  bvid?: string;
  description: string;
  reason?: string;
  topic: Topic;
}

export const languageLabels: Record<Language, string> = {
  cantonese: '粤语',
  english: '英语',
  both: '粤语 + 英语',
};

export const durationLabels: Record<Duration, string> = {
  '5': '5 分钟',
  '10': '10 分钟',
  '20': '20 分钟',
  '30': '30 分钟',
  '30plus': '30 分钟以上',
};

export const platformLabels = {
  bilibili: 'B站',
  xiaohongshu: '小红书',
  douyin: '抖音',
};

export const formatDuration = (seconds: number) =>
  `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60)
    .toString()
    .padStart(2, '0')}`;

export const durationRanges: Record<Duration, [number, number, number]> = {
  '5': [120, 420, 300],
  '10': [300, 720, 600],
  '20': [600, 1320, 1200],
  '30': [1080, 2100, 1800],
  '30plus': [2100, Infinity, 2400],
};

export function filterByDuration(
  items: LanguageContentItem[],
  preference: Duration,
) {
  const [min, max, target] = durationRanges[preference];

  return items
    .filter(item => item.duration >= min && item.duration <= max)
    .sort(
      (a, b) =>
        Math.abs(a.duration - target) - Math.abs(b.duration - target),
    );
}

export interface RecommendationGroup {
  language: Exclude<Language, 'both'>;
  items: LanguageContentItem[];
  status: 'ready' | 'partial' | 'empty' | 'unavailable';
  warnings: string[];
  steps: {
    platform: string;
    status: string;
    keyword?: string;
    matched?: number;
    message?: string;
  }[];
}

type SupabaseListeningRow = {
  id: string;
  language: Exclude<Language, 'both'>;
  title: string;
  platform: LanguageContentItem['platform'];
  creator: string;
  duration: number;
  url: string;
  bvid?: string | null;
  description?: string | null;
  reason?: string | null;
  topic: Topic;
  is_active?: boolean | null;
  created_at?: string | null;
};

function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase 环境变量未配置，请检查 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。',
    );
  }

  return {
    url: url.replace(/\/+$/, ''),
    anonKey,
  };
}

function wantedLanguages(language: Language): Array<Exclude<Language, 'both'>> {
  return language === 'both'
    ? ['cantonese', 'english']
    : [language];
}

function buildExcludedValues(
  history: readonly LanguageLearningRecord[],
  excludedIds: readonly string[],
) {
  const values = new Set(
    excludedIds.filter(value => typeof value === 'string' && value.trim()),
  );

  for (const record of history) {
    if (record.contentId) values.add(record.contentId);
    if (record.url) values.add(record.url);
    if (record.bvid) values.add(record.bvid);
  }

  return values;
}

function isExcluded(
  item: SupabaseListeningRow,
  excluded: ReadonlySet<string>,
) {
  return (
    excluded.has(item.id) ||
    excluded.has(item.url) ||
    (!!item.bvid && excluded.has(item.bvid))
  );
}

async function fetchPool(
  language: Exclude<Language, 'both'>,
  duration: Duration,
  topic: Topic,
) {
  const { url, anonKey } = getSupabaseConfig();
  const [min, max] = durationRanges[duration];

  const params = new URLSearchParams();
  params.set(
    'select',
    'id,language,title,platform,creator,duration,url,bvid,description,reason,topic,is_active,created_at',
  );
  params.set('language', `eq.${language}`);
  params.set('topic', `eq.${topic}`);
  params.set('duration', `gte.${min}`);

  if (Number.isFinite(max)) {
    params.append('duration', `lte.${max}`);
  }

  params.set('is_active', 'eq.true');
  params.set('order', 'created_at.desc');
  params.set('limit', '100');

  const response = await fetch(
    `${url}/rest/v1/listening_items?${params.toString()}`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    },
  );

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(
      `素材池读取失败（${response.status}）${
        message ? `：${message.slice(0, 150)}` : ''
      }`,
    );
  }

  return (await response.json()) as SupabaseListeningRow[];
}

function rankPool(
  rows: SupabaseListeningRow[],
  duration: Duration,
  history: readonly LanguageLearningRecord[],
  excludedIds: readonly string[],
  count: number,
) {
  const [, , target] = durationRanges[duration];
  const excluded = buildExcludedValues(history, excludedIds);

  return rows
    .filter(item => !isExcluded(item, excluded))
    .sort((a, b) => {
      const durationDelta =
        Math.abs(a.duration - target) - Math.abs(b.duration - target);

      if (durationDelta !== 0) return durationDelta;

      const aTime = a.created_at ? Date.parse(a.created_at) : 0;
      const bTime = b.created_at ? Date.parse(b.created_at) : 0;
      return bTime - aTime;
    })
    .slice(0, count)
    .map<LanguageContentItem>(item => ({
      id: item.id,
      language: item.language,
      title: item.title,
      platform: item.platform,
      creator: item.creator,
      duration: item.duration,
      url: item.url,
      ...(item.bvid ? { bvid: item.bvid } : {}),
      description: item.description ?? '',
      ...(item.reason ? { reason: item.reason } : {}),
      topic: item.topic,
    }));
}

/**
 * Vercel 版本：
 * 浏览器直接读取 Supabase listening_items 素材池，
 * 不再依赖 Vite dev-server API、Python 或本机 MediaCrawler。
 *
 * 这样本地 npm run dev 和 Vercel 静态部署都能使用同一套推荐逻辑。
 */
export async function getLanguageRecommendations({
  language,
  duration,
  topic,
  history = [],
  excludedIds = [],
  count = 2,
}: {
  language: Language;
  duration: Duration;
  topic: Topic;
  history?: readonly LanguageLearningRecord[];
  excludedIds?: string[];
  count?: number;
}): Promise<RecommendationGroup[]> {
  const safeCount = Math.max(1, Math.min(count, 8));

  return Promise.all(
    wantedLanguages(language).map(async currentLanguage => {
      try {
        const rows = await fetchPool(currentLanguage, duration, topic);
        const items = rankPool(
          rows,
          duration,
          history,
          excludedIds,
          safeCount,
        );

        return {
          language: currentLanguage,
          items,
          status:
            items.length >= safeCount
              ? 'ready'
              : items.length > 0
                ? 'partial'
                : 'empty',
          warnings:
            items.length >= safeCount
              ? []
              : [
                  items.length
                    ? '当前素材池中符合条件的内容不足。'
                    : '当前素材池中暂时没有符合条件的内容。',
                ],
          steps: [
            {
              platform: 'supabase',
              status: 'ready',
              matched: items.length,
              message: '从 Supabase 听学素材池筛选',
            },
          ],
        } satisfies RecommendationGroup;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Supabase 素材池暂时不可用。';

        return {
          language: currentLanguage,
          items: [],
          status: 'unavailable',
          warnings: [message],
          steps: [
            {
              platform: 'supabase',
              status: 'error',
              message,
            },
          ],
        } satisfies RecommendationGroup;
      }
    }),
  );
}

// Extension point only: no rating-based reordering at this stage.
export function getRecommendationScore(
  _item: LanguageContentItem,
  _history: readonly LanguageLearningRecord[],
): number {
  return 0;
}

export async function handleCopy({
  text,
  successMessage,
}: {
  text: string;
  successMessage: string;
}) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const previous = document.activeElement as HTMLElement | null;
    const field = document.createElement('textarea');

    field.value = text;
    field.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.append(field);
    field.select();

    try {
      if (!document.execCommand('copy')) {
        throw new Error('复制失败，请手动复制链接');
      }
    } finally {
      field.remove();
      previous?.focus();
    }
  }

  return successMessage;
}
