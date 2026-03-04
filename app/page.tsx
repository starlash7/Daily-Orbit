"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { FortuneCategory } from "@/lib/fortune";

type DrawResponse = {
  drawId: string;
  dateKey: string;
  category: FortuneCategory;
  categoryLabel: string;
  fortune: {
    headline: string;
    detail: string;
    luckyColor: string;
    luckyNumber: number;
    moodTag: string;
  };
};

const CATEGORIES: Array<{ key: FortuneCategory; label: string }> = [
  { key: "love", label: "연애" },
  { key: "money", label: "금전" },
  { key: "career", label: "커리어" },
  { key: "health", label: "건강" }
];

function formatKoreanDate(input: string): string {
  const date = new Date(`${input}T00:00:00`);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short"
  });
}

function toDateKey(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

function toPreviousDateKey(todayKey: string): string {
  const base = new Date(`${todayKey}T00:00:00`);
  base.setDate(base.getDate() - 1);
  return toDateKey(base);
}

export default function HomePage(): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<FortuneCategory>("love");
  const [draw, setDraw] = useState<DrawResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [streak, setStreak] = useState<number>(0);
  const [deepUnlocked, setDeepUnlocked] = useState<boolean>(false);

  const updateStreak = useCallback((dateKey: string) => {
    const streakDateKey = "daily-orbit:last-draw-date";
    const streakCountKey = "daily-orbit:streak-count";

    const previousDate = localStorage.getItem(streakDateKey);
    const previousCount = Number(localStorage.getItem(streakCountKey) || "0");

    if (previousDate === dateKey) {
      setStreak(previousCount);
      return;
    }

    const yesterday = toPreviousDateKey(dateKey);
    const nextCount = previousDate === yesterday ? previousCount + 1 : 1;

    localStorage.setItem(streakDateKey, dateKey);
    localStorage.setItem(streakCountKey, String(nextCount));
    setStreak(nextCount);
  }, []);

  const fetchDraw = useCallback(async (category: FortuneCategory) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/draw?category=${category}`);
      if (!response.ok) throw new Error("운세를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");

      const result = (await response.json()) as DrawResponse;
      setDraw(result);
      setDeepUnlocked(false);
      updateStreak(result.dateKey);
    } catch (drawError) {
      setError(drawError instanceof Error ? drawError.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [updateStreak]);

  useEffect(() => {
    const stored = Number(localStorage.getItem("daily-orbit:streak-count") || "0");
    if (Number.isFinite(stored)) {
      setStreak(stored);
    }
    fetchDraw(selectedCategory).catch(() => undefined);
  }, [fetchDraw, selectedCategory]);

  const shareText = useMemo(() => {
    if (!draw) return "";
    return `Daily Orbit ${draw.categoryLabel} 운세: ${draw.fortune.headline} | 행운 숫자 ${draw.fortune.luckyNumber}`;
  }, [draw]);

  const handleShare = useCallback(async () => {
    if (!draw) return;

    const payload = {
      title: "Daily Orbit",
      text: shareText,
      url: window.location.href
    };

    if (navigator.share) {
      await navigator.share(payload);
      return;
    }

    await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`);
    window.alert("결과가 클립보드에 복사되었어요.");
  }, [draw, shareText]);

  return (
    <main className="page-shell">
      <div className="ambient-layer" aria-hidden />

      <section className="hero card">
        <p className="eyebrow">Base Mini App</p>
        <h1>Daily Orbit</h1>
        <p className="hero-copy">
          하루 1분, 오늘의 운세를 뽑고 공유하세요. 캐릭터 톤은 <strong>신비한 귀여움</strong>으로
          설계되어 있어요.
        </p>
        <div className="streak-pill">현재 streak: {streak}일</div>
      </section>

      <section className="card controls">
        <h2>카테고리 선택</h2>
        <div className="category-grid">
          {CATEGORIES.map((category) => (
            <button
              key={category.key}
              type="button"
              className={category.key === selectedCategory ? "chip active" : "chip"}
              onClick={() => setSelectedCategory(category.key)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="primary-button"
          disabled={loading}
          onClick={() => fetchDraw(selectedCategory)}
        >
          {loading ? "운세 확인 중..." : "오늘의 운세 다시 뽑기"}
        </button>
      </section>

      <section className="card result">
        <header className="result-header">
          <h2>오늘의 결과</h2>
          <span>{draw ? formatKoreanDate(draw.dateKey) : formatKoreanDate(toDateKey(new Date()))}</span>
        </header>

        {error ? <p className="error-text">{error}</p> : null}

        {draw ? (
          <>
            <p className="category-tag">{draw.categoryLabel}</p>
            <h3 className="headline">{draw.fortune.headline}</h3>
            <p className="detail">{draw.fortune.detail}</p>

            <div className="luck-grid">
              <div>
                <small>행운 컬러</small>
                <strong>{draw.fortune.luckyColor}</strong>
              </div>
              <div>
                <small>행운 숫자</small>
                <strong>{draw.fortune.luckyNumber}</strong>
              </div>
              <div>
                <small>무드 태그</small>
                <strong>{draw.fortune.moodTag}</strong>
              </div>
            </div>

            <div className="action-row">
              <button type="button" className="secondary-button" onClick={handleShare}>
                결과 공유하기
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeepUnlocked((prev) => !prev)}
              >
                심화 해석 열기 (0.5 USDC 데모)
              </button>
            </div>

            {deepUnlocked ? (
              <article className="deep-reading">
                <h4>심화 해석</h4>
                <ul>
                  <li>기회: 오늘은 작게 시작한 대화가 좋은 연결로 확장됩니다.</li>
                  <li>주의: 빠른 결정보다 맥락 확인을 먼저 해보세요.</li>
                  <li>관계: 먼저 연락하면 생각보다 따뜻한 반응을 얻을 수 있어요.</li>
                  <li>행동: 저녁 전에 10분만 오늘 계획을 정리해 보세요.</li>
                </ul>
                <p className="disclaimer">현재는 결제 UX 데모이며, 실제 온체인 결제 연동 전 단계입니다.</p>
              </article>
            ) : null}
          </>
        ) : (
          <p className="empty-text">운세를 불러오면 결과가 여기에 표시됩니다.</p>
        )}
      </section>
    </main>
  );
}
