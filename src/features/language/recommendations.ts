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

function normalizedEvidence(item: SupabaseListeningRow) {
  // 只使用原始可见元信息；绝不使用 reason/topic 等由旧规则推断出来的字段，
  // 否则会出现“旧标签证明旧标签正确”的自我验证。
  return [
    item.title,
    item.description ?? '',
  ]
    .join(' ')
    .toLowerCase();
}

function titleEvidence(item: SupabaseListeningRow) {
  return item.title.toLowerCase();
}

function hasAny(text: string, patterns: RegExp[]) {
  return patterns.some(pattern => pattern.test(text));
}

function matchesLanguageEvidence(
  item: SupabaseListeningRow,
  language: Exclude<Language, 'both'>,
) {
  // 语言证据只认标题本身，避免 description/search keyword/旧标签污染。
  const title = titleEvidence(item);

  if (language === 'cantonese') {
    const positive = [
      /全程粤语/i,
      /全粤语/i,
      /粤语/i,
      /广东话/i,
      /广州话/i,
      /cantonese/i,
    ];

    const negative = [
      /粤语字幕/i,
      /粤语教学/i,
      /学粤语/i,
      /粤语教程/i,
      /粤语配音/i,
      /ai.?配音/i,
      /ai.?粤语/i,
      /tts/i,
      /语音克隆/i,
    ];

    return hasAny(title, positive) && !hasAny(title, negative);
  }

  const positive = [
    /\benglish\b/i,
    /全程英文/i,
    /全英文/i,
    /英文/i,
    /英语/i,
  ];

  const negative = [
    /英文字幕/i,
    /英语字幕/i,
    /中英字幕/i,
    /双语字幕/i,
    /英语教学/i,
    /英文教学/i,
    /学英语/i,
    /英语教程/i,
  ];

  return hasAny(title, positive) && !hasAny(title, negative);
}

function matchesTopicEvidence(item: SupabaseListeningRow, topic: Topic) {
  const text = normalizedEvidence(item);
  const title = titleEvidence(item);

  const rules: Record<Topic, RegExp[]> = {
    daily: [
      /vlog/i, /日常/i, /一天/i, /生活/i, /routine/i, /day in my life/i,
    ],
    study: [
      /校园/i, /大学/i, /学生/i, /学习/i, /留学/i, /课堂/i, /study/i, /school/i, /college/i, /university/i,
    ],
    conversation: [
      /访谈/i,
      /采访/i,
      /对谈/i,
      /聊天/i,
      /播客/i,
      /podcast/i,
      /interview/i,
      /conversation/i,
      /\bchat\b/i,
      /talk show/i,
    ],
    food_travel: [
      /美食/i, /吃/i, /餐厅/i, /探店/i, /旅行/i, /旅游/i, /trip/i, /travel/i, /food/i, /restaurant/i,
    ],
    entertainment: [
      /电影/i, /电视剧/i, /综艺/i, /影视/i, /音乐/i, /明星/i, /娱乐/i, /movie/i, /film/i, /music/i,
    ],
    culture_society: [
      /文化/i, /社会/i, /城市/i, /历史/i, /民俗/i, /公共/i, /culture/i, /society/i, /history/i,
    ],
    tech_media: [
      /科技/i, /人工智能/i, /\bai\b/i, /互联网/i, /媒体/i, /新闻/i, /传播/i, /technology/i, /tech/i, /media/i,
    ],
    personal: [
      /经历/i, /成长/i, /故事/i, /人生/i, /经验/i, /我的/i, /experience/i, /story/i, /journey/i,
    ],
  };

  // “聊天访谈”要求标题本身能证明是对话型内容。
  // 不能依赖 description/reason 里的搜索词或旧分类标签。
  if (topic === 'conversation') {
    if (!hasAny(title, rules.conversation)) return false;
    const obviousNonConversation = [
      /人物故事/i,
      /明星故事/i,
      /故事会/i,
      /故事解说/i,
      /剧情解说/i,
      /电影解说/i,
      /纪录片解说/i,
      /盘点/i,
      /混剪/i,
    ];
    if (hasAny(title, obviousNonConversation)) return false;
    return true;
  }

  return hasAny(text, rules[topic]);
}

function passesStrictMetadataGuard(
  item: SupabaseListeningRow,
  language: Exclude<Language, 'both'>,
  topic: Topic,
) {
  return (
    matchesLanguageEvidence(item, language) &&
    matchesTopicEvidence(item, topic)
  );
}

async function fetchPool(
  language: Exclude<Language, 'both'>,
  topic: Topic,
  minDuration?: number,
  maxDuration?: number,
) {
  const { url, anonKey } = getSupabaseConfig();

  const params = new URLSearchParams();
  params.set(
    'select',
    'id,language,title,platform,creator,duration,url,bvid,description,reason,topic,is_active,created_at',
  );
  params.set('language', `eq.${language}`);
  params.set('topic', `eq.${topic}`);

  if (typeof minDuration === 'number') {
    params.set('duration', `gte.${minDuration}`);
  }

  if (typeof maxDuration === 'number' && Number.isFinite(maxDuration)) {
    params.append('duration', `lte.${maxDuration}`);
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
  language: Exclude<Language, 'both'>,
  topic: Topic,
  duration: Duration,
  history: readonly LanguageLearningRecord[],
  excludedIds: readonly string[],
  count: number,
) {
  const [, , target] = durationRanges[duration];
  const excluded = buildExcludedValues(history, excludedIds);

  return rows
    .filter(item => !isExcluded(item, excluded))
    .filter(item => passesStrictMetadataGuard(item, language, topic))
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
        const [strictMin, strictMax] = durationRanges[duration];

        // 第一层：严格匹配语言 + 主题 + 时长。
        const strictRows = await fetchPool(
          currentLanguage,
          topic,
          strictMin,
          Number.isFinite(strictMax) ? strictMax : undefined,
        );

        let items = rankPool(
          strictRows,
          currentLanguage,
          topic,
          duration,
          history,
          excludedIds,
          safeCount,
        );

        let relaxedDuration = false;

        // 第二层：如果严格时长完全没有结果，只放宽时长，绝不放宽主题。
        // 这样“科技媒体”不会再混进 vlog/生活日常。
        if (items.length === 0) {
          const broaderRows = await fetchPool(
            currentLanguage,
            topic,
            60,
            duration === '30plus' ? undefined : 3600,
          );

          items = rankPool(
            broaderRows,
            currentLanguage,
            topic,
            duration,
            history,
            excludedIds,
            safeCount,
          );
          relaxedDuration = items.length > 0;
        }

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
            relaxedDuration
              ? ['严格时长暂无结果，已保留语言和主题，仅放宽时长。']
              : items.length >= safeCount
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
              message: relaxedDuration
                ? '从 Supabase 素材池筛选；仅放宽时长'
                : '从 Supabase 听学素材池严格筛选',
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
