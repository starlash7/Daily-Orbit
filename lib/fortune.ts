export type FortuneCategory = "love" | "money" | "career" | "health";

export type Fortune = {
  headline: string;
  detail: string;
  luckyColor: string;
  luckyNumber: number;
  moodTag: string;
};

const CATEGORY_LABELS: Record<FortuneCategory, string> = {
  love: "Love",
  money: "Money",
  career: "Career",
  health: "Health"
};

const LUCKY_COLORS = [
  "Moonlight Blue",
  "Rose Quartz",
  "Mint Aura",
  "Starlight Silver",
  "Sunrise Gold",
  "Midnight Indigo",
  "Cloud White",
  "Aurora Teal"
];

const MOOD_TAGS = [
  "calm",
  "spark",
  "focused",
  "steady",
  "bold",
  "gentle",
  "clear",
  "uplift",
  "grounded",
  "flow"
];

const HEADLINE_SUFFIXES = [
  "for today.",
  "in your next move.",
  "before the day ends.",
  "in small moments.",
  "when you stay intentional."
];

type CategoryTemplate = {
  baseHeadlines: string[];
  insightSeeds: string[];
  actionSeeds: string[];
};

const CATEGORY_TEMPLATES: Record<FortuneCategory, CategoryTemplate> = {
  love: {
    baseHeadlines: [
      "A calm conversation opens the right door",
      "Soft honesty creates stronger chemistry",
      "Patience makes your feelings easier to read",
      "A small compliment shifts the whole mood",
      "Warmth speaks louder than perfect timing",
      "Listening deeply brings unexpected closeness",
      "Simple gestures carry real meaning",
      "Clear boundaries protect your peace",
      "A gentle check-in can change your day",
      "Trust grows through consistent attention"
    ],
    insightSeeds: [
      "People around you respond better to sincerity than speed.",
      "One thoughtful message can reset a stale connection.",
      "A slower pace helps you notice what matters most.",
      "A little emotional clarity prevents unnecessary misunderstandings.",
      "You gain more by asking than by assuming.",
      "Kind words land best when they are specific and brief.",
      "Your tone matters as much as your timing today.",
      "Shared routines can feel surprisingly comforting right now.",
      "A grounded response will strengthen trust.",
      "When you stay present, connection follows naturally."
    ],
    actionSeeds: [
      "Send one thoughtful message before noon.",
      "Ask one genuine question and pause for the answer.",
      "Choose clarity over mixed signals in your next chat.",
      "Give one clear compliment without overexplaining.",
      "End the day with a short, warm check-in."
    ]
  },
  money: {
    baseHeadlines: [
      "Small discipline increases your financial calm",
      "Comparison beats impulse today",
      "A clear limit protects your flexibility",
      "Practical choices unlock better value",
      "Consistency matters more than intensity",
      "A tiny adjustment can improve your whole week",
      "Your budget works best when it stays visible",
      "Intentional spending creates better confidence",
      "A short review reveals hidden leaks",
      "Simple planning gives you more freedom"
    ],
    insightSeeds: [
      "Your best move is reducing one low-value expense.",
      "A quick second check can prevent avoidable waste.",
      "Spending feels easier when you pre-commit a limit.",
      "Short-term comfort is less useful than long-term control.",
      "You are likely to benefit from delaying one non-urgent purchase.",
      "Keeping choices simple helps you stay on track.",
      "Smaller transactions deserve the same attention as bigger ones.",
      "A daily cap improves both confidence and clarity.",
      "What you skip today creates options later.",
      "Focused spending beats broad restriction."
    ],
    actionSeeds: [
      "Review one subscription and remove what you do not use.",
      "Wait ten minutes before any non-essential purchase.",
      "Set a hard cap for discretionary spending today.",
      "Track every small payment for one full day.",
      "Move a tiny amount into savings before evening."
    ]
  },
  career: {
    baseHeadlines: [
      "One clear priority unlocks momentum",
      "Focused execution beats perfect planning",
      "Short updates can move teams faster",
      "A clean start beats a delayed start",
      "Clarity creates better collaboration",
      "Your consistency is your strongest signal",
      "Smaller wins build bigger confidence",
      "Intentional communication lowers friction",
      "Progress accelerates when scope is narrow",
      "The next step is simpler than it looks"
    ],
    insightSeeds: [
      "Your highest-value task should be first, not later.",
      "A concise status update can remove hidden blockers.",
      "Reducing scope often improves output quality.",
      "You gain speed by finishing before starting something new.",
      "Clear asks make teamwork smoother today.",
      "A quick draft now is better than a perfect draft tomorrow.",
      "Focus windows are more important than total hours.",
      "Direct communication saves revision cycles.",
      "Closing one open loop will free up mental energy.",
      "Steady progress wins over dramatic bursts."
    ],
    actionSeeds: [
      "Define one must-finish task before checking messages.",
      "Share a concise update with your team in two lines.",
      "Block a 30-minute focus session with notifications off.",
      "Close one overdue task before starting anything new.",
      "Write your next step as a single sentence."
    ]
  },
  health: {
    baseHeadlines: [
      "Rhythm supports your energy better than intensity",
      "Gentle consistency lifts your baseline",
      "Recovery is productive, not optional",
      "Small habits shape bigger outcomes",
      "A calmer pace improves your focus",
      "Your body responds well to predictable routines",
      "Hydration and sleep are your quiet advantage",
      "Lower pressure creates better balance",
      "Steady routines reduce hidden fatigue",
      "Tiny resets can change your day"
    ],
    insightSeeds: [
      "Your energy improves when basics come first.",
      "A short reset is more useful than pushing through.",
      "Stability today creates momentum tomorrow.",
      "Lowering intensity can improve consistency.",
      "Your focus depends on rest more than motivation.",
      "A little movement can clear mental fog quickly.",
      "Hydration timing matters as much as quantity.",
      "A clean evening routine will improve tomorrow's start.",
      "Steady breathing can reduce stress faster than expected.",
      "You perform better when recovery is planned."
    ],
    actionSeeds: [
      "Take a five-minute stretch break before lunch.",
      "Drink water first, then caffeine.",
      "Set a realistic sleep target and protect it.",
      "Walk for ten minutes after your longest sitting block.",
      "End the day with a short digital cooldown."
    ]
  }
};

const CATEGORY_OFFSETS: Record<FortuneCategory, number> = {
  love: 3,
  money: 11,
  career: 19,
  health: 27
};

const FORTUNES_PER_CATEGORY = 50;
const FALLBACK_CATEGORY: FortuneCategory = "love";

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getDateKey(date = new Date()): string {
  return date.toISOString().split("T")[0] ?? "1970-01-01";
}

function makeFortunes(category: FortuneCategory): Fortune[] {
  const template = CATEGORY_TEMPLATES[category];
  const offset = CATEGORY_OFFSETS[category];
  const fortunes: Fortune[] = [];

  for (let i = 0; i < FORTUNES_PER_CATEGORY; i += 1) {
    const headlineIndex = Math.floor(i / template.actionSeeds.length);
    const actionIndex = i % template.actionSeeds.length;
    const insightIndex = Math.floor(i / template.actionSeeds.length);

    const baseHeadline = template.baseHeadlines[headlineIndex] ?? template.baseHeadlines[0];
    const suffix = HEADLINE_SUFFIXES[actionIndex] ?? HEADLINE_SUFFIXES[0];
    const insight = template.insightSeeds[insightIndex] ?? template.insightSeeds[0];
    const action = template.actionSeeds[actionIndex] ?? template.actionSeeds[0];

    fortunes.push({
      headline: `${baseHeadline} ${suffix}`,
      detail: `${insight} ${action}`,
      luckyColor: LUCKY_COLORS[(i + offset) % LUCKY_COLORS.length] ?? "Moonlight Blue",
      luckyNumber: ((offset + i * 7) % 49) + 1,
      moodTag: MOOD_TAGS[(i + offset) % MOOD_TAGS.length] ?? "calm"
    });
  }

  return fortunes;
}

const FORTUNE_POOL: Record<FortuneCategory, Fortune[]> = {
  love: makeFortunes("love"),
  money: makeFortunes("money"),
  career: makeFortunes("career"),
  health: makeFortunes("health")
};

export function isFortuneCategory(value: string): value is FortuneCategory {
  return value === "love" || value === "money" || value === "career" || value === "health";
}

export function getCategoryLabel(category: FortuneCategory): string {
  return CATEGORY_LABELS[category];
}

export function getSupportedCategories(): FortuneCategory[] {
  return Object.keys(CATEGORY_LABELS) as FortuneCategory[];
}

export function getFortuneCounts(): Record<FortuneCategory, number> {
  return {
    love: FORTUNE_POOL.love.length,
    money: FORTUNE_POOL.money.length,
    career: FORTUNE_POOL.career.length,
    health: FORTUNE_POOL.health.length
  };
}

export function drawDailyFortune(params: {
  category?: string;
  wallet?: string;
  date?: Date;
}): {
  drawId: string;
  dateKey: string;
  category: FortuneCategory;
  categoryLabel: string;
  fortune: Fortune;
} {
  const dateKey = getDateKey(params.date);
  const rawCategory = params.category ?? "";
  const category: FortuneCategory = isFortuneCategory(rawCategory)
    ? rawCategory
    : FALLBACK_CATEGORY;
  const wallet = params.wallet?.trim().toLowerCase() || "guest";

  const options = FORTUNE_POOL[category];
  const index = hashString(`${dateKey}:${wallet}:${category}`) % options.length;
  const fortune = options[index] as Fortune;

  return {
    drawId: `${dateKey}-${category}-${index}`,
    dateKey,
    category,
    categoryLabel: getCategoryLabel(category),
    fortune
  };
}
