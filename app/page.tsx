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

const CATEGORIES: Array<{ key: FortuneCategory; label: string; hint: string }> = [
  { key: "love", label: "Love", hint: "Connection & feelings" },
  { key: "money", label: "Money", hint: "Spending & choices" },
  { key: "career", label: "Career", hint: "Work & progress" },
  { key: "health", label: "Health", hint: "Energy & recovery" }
];

function formatDisplayDate(input: string): string {
  const date = new Date(`${input}T00:00:00`);
  if (Number.isNaN(date.getTime())) return input;

  return date.toLocaleDateString("en-US", {
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
  const [notice, setNotice] = useState<string>("");

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

  const fetchDraw = useCallback(
    async (category: FortuneCategory) => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/draw?category=${category}`);
        if (!response.ok) {
          throw new Error("Could not load your fortune right now. Please try again.");
        }

        const result = (await response.json()) as DrawResponse;
        setDraw(result);
        setDeepUnlocked(false);
        updateStreak(result.dateKey);
      } catch (drawError) {
        setError(
          drawError instanceof Error
            ? drawError.message
            : "Unexpected error. Please try one more time."
        );
      } finally {
        setLoading(false);
      }
    },
    [updateStreak]
  );

  useEffect(() => {
    const stored = Number(localStorage.getItem("daily-orbit:streak-count") || "0");
    if (Number.isFinite(stored)) {
      setStreak(stored);
    }
    fetchDraw("love").catch(() => undefined);
  }, [fetchDraw]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 1800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const shareText = useMemo(() => {
    if (!draw) return "";
    return `Daily Orbit ${draw.categoryLabel}: ${draw.fortune.headline} | Lucky number ${draw.fortune.luckyNumber}`;
  }, [draw]);

  const handleShare = useCallback(async () => {
    if (!draw) return;

    const payload = {
      title: "Daily Orbit",
      text: shareText,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(payload);
        setNotice("Shared.");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`);
        setNotice("Copied to clipboard.");
        return;
      }

      setNotice("Sharing is not available on this device.");
    } catch {
      setNotice("Share canceled.");
    }
  }, [draw, shareText]);

  const displayDate = draw ? formatDisplayDate(draw.dateKey) : formatDisplayDate(toDateKey(new Date()));
  const selectedLabel = useMemo(
    () => CATEGORIES.find((item) => item.key === selectedCategory)?.label ?? "Love",
    [selectedCategory]
  );
  const heroHeadline = draw?.fortune.headline ?? "Check your daily flow in under a minute.";

  return (
    <main className="premium-root">
      <section className="app-frame">
        <header className="app-header">
          <div className="app-title-block">
            <p className="app-kicker">Daily Orbit</p>
            <h1 className="app-title">Daily Fortune</h1>
          </div>
          <div className="streak-token">Streak {streak}d</div>
        </header>

        <section className="insight-hero" aria-label="today insight">
          <p className="insight-kicker">Today&apos;s insight</p>
          <p className="insight-main">{heroHeadline}</p>
          <p className="insight-sub">A focused one-line read, then your next action.</p>
          <p className="insight-date">{displayDate}</p>
        </section>

        <section className="block-card">
          <div className="block-head">
            <h2 className="block-title">Select a category</h2>
            <span className="block-meta">Current: {selectedLabel}</span>
          </div>

          <div className="category-grid">
            {CATEGORIES.map((category) => (
              <button
                key={category.key}
                type="button"
                className={category.key === selectedCategory ? "category-item active" : "category-item"}
                onClick={() => setSelectedCategory(category.key)}
              >
                <span className="category-label">{category.label}</span>
                <span className="category-hint">{category.hint}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="primary-action"
            disabled={loading}
            onClick={() => fetchDraw(selectedCategory)}
          >
            {loading ? "Loading your fortune..." : "Check today's fortune"}
          </button>
        </section>

        <section className="block-card result-card">
          <div className="block-head">
            <h2 className="block-title">Your reading</h2>
            <span className="block-meta">{displayDate}</span>
          </div>

          {error ? <p className="error-copy">{error}</p> : null}

          {draw ? (
            <>
              <article>
                <p className="result-chip">{draw.categoryLabel}</p>
                <h3 className="result-title">{draw.fortune.headline}</h3>
                <p className="result-body">{draw.fortune.detail}</p>
              </article>

              <div className="metrics-grid">
                <div className="metric">
                  <small>Lucky color</small>
                  <strong>{draw.fortune.luckyColor}</strong>
                </div>
                <div className="metric">
                  <small>Lucky number</small>
                  <strong>{draw.fortune.luckyNumber}</strong>
                </div>
                <div className="metric">
                  <small>Mood tag</small>
                  <strong>{draw.fortune.moodTag}</strong>
                </div>
              </div>

              <div className="action-group">
                <button type="button" className="tertiary-action" onClick={handleShare}>
                  Share result
                </button>
                <button
                  type="button"
                  className="tertiary-action"
                  onClick={() => setDeepUnlocked((prev) => !prev)}
                >
                  Unlock deep reading (0.5 USDC demo)
                </button>
              </div>
            </>
          ) : (
            <p className="empty-copy">Pick a category and tap the button to load your reading.</p>
          )}

          {deepUnlocked ? (
            <section className="deep-card">
              <h4 className="deep-title">Deep reading</h4>
              <ul className="deep-list">
                <li>Opportunity: Start one meaningful conversation early today.</li>
                <li>Watch out: Don&apos;t rush decisions before checking context.</li>
                <li>Relationships: A clear and kind message can improve trust.</li>
                <li>Action: Spend ten minutes outlining your next step tonight.</li>
              </ul>
              <p className="tiny-note">
                This is currently a payment UX demo before live onchain settlement.
              </p>
            </section>
          ) : null}
        </section>
      </section>

      {notice ? <div className="toast">{notice}</div> : null}
    </main>
  );
}
