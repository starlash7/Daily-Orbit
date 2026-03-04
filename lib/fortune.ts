export type FortuneCategory = "love" | "money" | "career" | "health";

export type Fortune = {
  headline: string;
  detail: string;
  luckyColor: string;
  luckyNumber: number;
  moodTag: string;
};

const CATEGORY_LABELS: Record<FortuneCategory, string> = {
  love: "연애",
  money: "금전",
  career: "커리어",
  health: "건강"
};

const FORTUNE_POOL: Record<FortuneCategory, Fortune[]> = {
  love: [
    {
      headline: "조용한 대화가 관계를 부드럽게 만들어요.",
      detail: "오늘은 빠른 결론보다 상대의 말을 끝까지 듣는 태도가 호감으로 이어집니다.",
      luckyColor: "Rose Dust",
      luckyNumber: 6,
      moodTag: "soft"
    },
    {
      headline: "가벼운 칭찬 한마디가 분위기를 바꿔요.",
      detail: "부담 없는 응원 메시지가 생각보다 큰 신뢰를 만듭니다.",
      luckyColor: "Moon Glow",
      luckyNumber: 18,
      moodTag: "warm"
    },
    {
      headline: "조급함을 놓으면 더 정확한 마음이 보여요.",
      detail: "답을 재촉하기보다 오늘의 감정을 정리하면 오해를 줄일 수 있습니다.",
      luckyColor: "Mystic Blue",
      luckyNumber: 27,
      moodTag: "calm"
    }
  ],
  money: [
    {
      headline: "작은 절약이 오늘의 안정감을 만들어요.",
      detail: "구독/소액 지출 하나만 정리해도 이번 주 소비 흐름이 개선됩니다.",
      luckyColor: "Lucky Mint",
      luckyNumber: 4,
      moodTag: "steady"
    },
    {
      headline: "충동구매보다 비교가 이득을 줘요.",
      detail: "가격을 한 번만 더 확인해도 만족도가 크게 높아질 가능성이 큽니다.",
      luckyColor: "Moon Glow",
      luckyNumber: 13,
      moodTag: "smart"
    },
    {
      headline: "계획한 범위 안에서 충분히 즐길 수 있어요.",
      detail: "예산을 정해두면 지출 후 후회가 줄고 선택이 훨씬 명확해집니다.",
      luckyColor: "Primary Night",
      luckyNumber: 21,
      moodTag: "balanced"
    }
  ],
  career: [
    {
      headline: "우선순위 1개만 정해도 성과가 보입니다.",
      detail: "할 일을 줄여 집중하면 체감 진척이 커지고 피로감은 줄어듭니다.",
      luckyColor: "Mystic Blue",
      luckyNumber: 8,
      moodTag: "focus"
    },
    {
      headline: "짧은 공유가 팀의 속도를 높여요.",
      detail: "완벽한 문서보다 현재 상태를 빠르게 공유하는 것이 오늘은 더 효과적입니다.",
      luckyColor: "Lucky Mint",
      luckyNumber: 16,
      moodTag: "team"
    },
    {
      headline: "미뤄둔 작은 작업 하나가 흐름을 엽니다.",
      detail: "가벼운 태스크를 먼저 끝내면 큰 작업에 진입하는 진입장벽이 낮아집니다.",
      luckyColor: "Moon Glow",
      luckyNumber: 25,
      moodTag: "momentum"
    }
  ],
  health: [
    {
      headline: "오늘은 속도보다 리듬이 중요해요.",
      detail: "짧은 스트레칭과 수분 보충만 지켜도 컨디션이 안정될 가능성이 높습니다.",
      luckyColor: "Lucky Mint",
      luckyNumber: 2,
      moodTag: "refresh"
    },
    {
      headline: "수면 루틴을 30분만 앞당겨 보세요.",
      detail: "내일의 집중력이 달라지는 변화를 체감할 수 있습니다.",
      luckyColor: "Primary Night",
      luckyNumber: 11,
      moodTag: "recover"
    },
    {
      headline: "무리한 계획보다 꾸준한 작은 습관이 유리해요.",
      detail: "오늘 가능한 수준의 목표를 지키는 것이 장기적으로 더 큰 성과를 냅니다.",
      luckyColor: "Rose Dust",
      luckyNumber: 20,
      moodTag: "gentle"
    }
  ]
};

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

export function isFortuneCategory(value: string): value is FortuneCategory {
  return value === "love" || value === "money" || value === "career" || value === "health";
}

export function getCategoryLabel(category: FortuneCategory): string {
  return CATEGORY_LABELS[category];
}

export function getSupportedCategories(): FortuneCategory[] {
  return Object.keys(CATEGORY_LABELS) as FortuneCategory[];
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
