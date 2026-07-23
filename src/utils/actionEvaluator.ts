// ════════════════════════════════════════
// Action Evaluation Engine
// ════════════════════════════════════════

export interface EvalResult {
  action: string;
  durationMinutes: number;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  rating: number;
  ratingLabel: string;
  baseXP: number;
  totalXP: number;
  attrBonus: Record<string, number>;
  analysis: string;
}

interface CategoryRule {
  name: string;
  label: string;
  icon: string;
  keywords: string[];
  baseXP: number;
  attrBonus: Record<string, number>;
  analysis: string;
}

const CATEGORIES: CategoryRule[] = [
  {
    name: "knowledge",
    label: "知识学习",
    icon: "📚",
    keywords: ["学习", "看书", "阅读", "读书", "刷题", "做题", "复习", "预习", "背单词", "英语", "韩语", "雅思", "语言", "语法", "词汇", "网课", "课程", "公开课", "论文", "查资料", "笔记", "教程", "编程", "Python", "Java", "前端", "网页开发", "算法", "数学", "高数", "线代"],
    baseXP: 20,
    attrBonus: { knowledge: 3, focus: 2 },
    analysis: "持续学习新知识，对长期能力提升非常有效。",
  },
  {
    name: "focus",
    label: "专注工作",
    icon: "🎯",
    keywords: ["深度工作", "专注", "番茄", "25分钟", "50分钟", "计时", "完成计划", "完成任务", "作业", "报告", "写论文", "项目", "开发", "代码", "调试", "研究"],
    baseXP: 25,
    attrBonus: { focus: 3, discipline: 1, knowledge: 1 },
    analysis: "保持深度专注是提升效率的关键能力。",
  },
  {
    name: "discipline",
    label: "自律养成",
    icon: "🌱",
    keywords: ["早起", "早睡", "计划", "规划", "执行", "打卡", "坚持", "整理房间", "收拾", "整理", "衣柜", "洗衣服", "家务", "清洁", "打扫", "拖延", "手机", "时间管理"],
    baseXP: 15,
    attrBonus: { discipline: 3, focus: 1 },
    analysis: "日常自律正在塑造更好的自己。",
  },
  {
    name: "energy",
    label: "运动健康",
    icon: "🏋️",
    keywords: ["游泳", "跑步", "慢跑", "快走", "散步", "健身", "力量", "瑜伽", "拉伸", "跳绳", "篮球", "足球", "羽毛球", "网球", "骑车", "爬山", "运动", "锻炼"],
    baseXP: 20,
    attrBonus: { energy: 3, discipline: 1 },
    analysis: "保持运动习惯，为成长提供充沛精力。",
  },
  {
    name: "creativity",
    label: "创造表达",
    icon: "🎨",
    keywords: ["画画", "绘画", "素描", "设计", "UI", "网页设计", "摄影", "拍照", "修图", "剪辑", "视频", "文章", "写作", "创作", "PPT", "海报", "排版", "动画", "AE", "灵感"],
    baseXP: 25,
    attrBonus: { creativity: 3, focus: 2 },
    analysis: "创造力的每次实践都在拓展思维边界。",
  },
  {
    name: "money",
    label: "财富积累",
    icon: "💰",
    keywords: ["赚钱", "兼职", "家教", "辅导", "讲课", "备课", "批改", "接单", "项目", "自媒体", "收入", "记账", "商业"],
    baseXP: 25,
    attrBonus: { money: 3, social: 2, creativity: 1 },
    analysis: "财富增长是能力价值的外部体现。",
  },
  {
    name: "social",
    label: "社交互动",
    icon: "🤝",
    keywords: ["聊天", "交流", "认识", "朋友", "活动", "社团", "志愿", "帮助", "教学", "分享", "团队", "沟通"],
    baseXP: 15,
    attrBonus: { social: 3, discipline: 1 },
    analysis: "良好的社交关系是成长的重要支撑。",
  },
  {
    name: "life",
    label: "生活照料",
    icon: "🌿",
    keywords: ["做饭", "喝水", "护肤", "洗澡", "睡觉", "午休", "休息", "冥想", "放松", "旅行"],
    baseXP: 10,
    attrBonus: { energy: 1, discipline: 1 },
    analysis: "照顾好自己才能持续成长。",
  },
];

function getDurationMult(minutes: number): number {
  if (minutes <= 0) return 1;
  if (minutes <= 10) return 1;
  if (minutes <= 30) return 1.5;
  if (minutes <= 60) return 2;
  if (minutes <= 120) return 2.5;
  return 3;
}

function getRating(baseXP: number, mult: number): { stars: number; label: string } {
  const effective = baseXP * mult;
  if (effective >= 60) return { stars: 5, label: "卓越" };
  if (effective >= 40) return { stars: 4, label: "优秀" };
  if (effective >= 25) return { stars: 3, label: "良好" };
  if (effective >= 15) return { stars: 2, label: "一般" };
  return { stars: 1, label: "基础" };
}

function extractDuration(text: string): number {
  const patterns = [
    /(\d+)\s*小[时時]/,
    /(\d+)\s*分钟/,
    /(\d+)\s*分/,
    /(\d+)\s*[hH]/,
    /(\d+)\s*[mM]/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const val = parseInt(m[1], 10);
      const ps = p.toString();
      if (ps.includes("小") || ps.includes("时") || ps.includes("時") || ps.includes("h")) {
        return val * 60;
      }
      return val;
    }
  }
  return 0;
}

function extractPages(text: string): number {
  const m = text.match(/(\d+)\s*页/);
  return m ? parseInt(m[1], 10) : 0;
}

interface SpecialRule {
  pattern: RegExp;
  getResult: (text: string, duration: number) => Partial<EvalResult> | null;
}

const SPECIAL_RULES: SpecialRule[] = [
  {
    pattern: /家教|辅导学生|讲课|备课/,
    getResult: (_text, dur) => ({
      category: "money",
      categoryLabel: "财富积累",
      categoryIcon: "💰",
      baseXP: 25,
      totalXP: Math.min(80, Math.round(25 * getDurationMult(dur))),
      attrBonus: { money: 3, social: 2, creativity: 1 },
      analysis: "教学相长，传授知识的同时也在巩固自己的能力。",
    }),
  },
  {
    pattern: /网页|网站|前端|代码|开发|编程/,
    getResult: (_text, dur) => ({
      category: "creativity",
      categoryLabel: "创造表达",
      categoryIcon: "🎨",
      baseXP: 30,
      totalXP: Math.min(90, Math.round(30 * getDurationMult(dur))),
      attrBonus: { creativity: 3, focus: 2, knowledge: 2 },
      analysis: "把想法变成产品，是创造力的最佳实践。",
    }),
  },
  {
    pattern: /英语|韩语|雅思|语言/,
    getResult: (_text, dur) => ({
      category: "knowledge",
      categoryLabel: "知识学习",
      categoryIcon: "📚",
      baseXP: 25,
      totalXP: Math.min(70, Math.round(25 * getDurationMult(dur))),
      attrBonus: { knowledge: 3, focus: 2 },
      analysis: "语言学习拓展视野，打开更多可能性。",
    }),
  },
  {
    pattern: /游泳/,
    getResult: (_text, dur) => ({
      category: "energy",
      categoryLabel: "运动健康",
      categoryIcon: "🏋️",
      baseXP: 20,
      totalXP: Math.min(60, Math.round(20 * getDurationMult(dur))),
      attrBonus: { energy: 3, discipline: 1 },
      analysis: "游泳是全身运动，对体力和意志都是很好的锻炼。",
    }),
  },
  {
    pattern: /阅读|看书/,
    getResult: (_text, dur) => {
      const pages = extractPages(_text);
      const baseXP = pages > 0 ? Math.min(30, 10 + pages) : 15;
      return {
        category: "knowledge",
        categoryLabel: "知识学习",
        categoryIcon: "📚",
        baseXP,
        totalXP: Math.min(50, Math.round(baseXP * getDurationMult(dur))),
        attrBonus: { knowledge: 2, focus: 1 },
        analysis: pages > 0 ? `阅读 ${pages} 页，持续积累知识。` : "阅读是最持久的成长方式。",
      };
    },
  },
];

export function evaluateAction(text: string): EvalResult {
  const trimmed = text.trim();
  const duration = extractDuration(trimmed);

  for (const rule of SPECIAL_RULES) {
    if (rule.pattern.test(trimmed)) {
      const override = rule.getResult(trimmed, duration);
      if (override) {
        const rating = getRating(override.baseXP ?? 20, getDurationMult(duration));
        return {
          action: trimmed,
          durationMinutes: duration,
          category: override.category ?? "life",
          categoryLabel: override.categoryLabel ?? "生活",
          categoryIcon: override.categoryIcon ?? "🌿",
          rating: rating.stars,
          ratingLabel: rating.label,
          baseXP: override.baseXP ?? 20,
          totalXP: override.totalXP ?? Math.min(50, Math.round(20 * getDurationMult(duration))),
          attrBonus: override.attrBonus ?? { energy: 1, discipline: 1 },
          analysis: override.analysis ?? "持续行动，不断成长。",
        };
      }
    }
  }

  for (const cat of CATEGORIES) {
    for (const kw of cat.keywords) {
      if (trimmed.includes(kw)) {
        const mult = getDurationMult(duration);
        const totalXP = Math.min(60, Math.round(cat.baseXP * mult));
        const rating = getRating(cat.baseXP, mult);
        return {
          action: trimmed,
          durationMinutes: duration,
          category: cat.name,
          categoryLabel: cat.label,
          categoryIcon: cat.icon,
          rating: rating.stars,
          ratingLabel: rating.label,
          baseXP: cat.baseXP,
          totalXP,
          attrBonus: { ...cat.attrBonus },
          analysis: cat.analysis,
        };
      }
    }
  }

  const mult = getDurationMult(duration);
  return {
    action: trimmed,
    durationMinutes: duration,
    category: "life",
    categoryLabel: "日常行动",
    categoryIcon: "✨",
    rating: 1,
    ratingLabel: "基础",
    baseXP: 5,
    totalXP: Math.min(20, Math.round(5 * mult)),
    attrBonus: { discipline: 1 },
    analysis: "每个行动都在推动成长，继续记录更多有价值的行动吧。",
  };
}

export function getMarqueeHints(): string[] {
  return [
    "学英语30分钟", "游泳40分钟", "家教2小时",
    "修改网页代码", "阅读20页", "跑步30分钟",
    "画画1小时", "整理房间", "写作",
  ];
}

export function getAttrTotalFromLog(
  log: { attrBonus: Record<string, number> }[]
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const entry of log) {
    for (const [key, val] of Object.entries(entry.attrBonus)) {
      totals[key] = (totals[key] ?? 0) + val;
    }
  }
  return totals;
}

export type EvalLogEntry = {
  id: number;
  action: string;
  category: string;
  xp: number;
  attrBonus: Record<string, number>;
  timestamp: string;
};
