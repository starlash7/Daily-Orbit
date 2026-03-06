"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";
import { getPaymentStatus, pay } from "@base-org/account";
import { sdk } from "@farcaster/miniapp-sdk";
import { base } from "wagmi/chains";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract
} from "wagmi";
import { erc20Abi } from "viem";

import type { FortuneCategory } from "@/lib/fortune";
import {
  BASE_USDC_ADDRESS,
  getDeepReadingPriceLabel,
  getDeepReadingPriceUnits,
  getPaymentRecipient,
  hasValidPaymentRecipient,
  toBaseScanTxUrl
} from "@/lib/payments";

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

type ProfileState = {
  name: string;
  username: string;
  avatarUrl: string;
};

type MiniAppContextUser = {
  displayName?: string;
  username?: string;
  fid?: string | number;
  pfpUrl?: string;
  avatarUrl?: string;
};

type MiniAppContext = {
  user?: MiniAppContextUser;
};

type HistoryEntry = {
  drawId: string;
  dateKey: string;
  categoryLabel: string;
  headline: string;
  luckyNumber: number;
};

type ThemeMode = "light" | "dark";
type TabKey = "today" | "history" | "profile";

const CATEGORIES: Array<{ key: FortuneCategory; label: string; hint: string }> = [
  { key: "love", label: "Love", hint: "Connection and closeness" },
  { key: "money", label: "Money", hint: "Spending and timing" },
  { key: "career", label: "Career", hint: "Work and momentum" },
  { key: "health", label: "Health", hint: "Energy and balance" }
];

const ONBOARDING_STEPS = [
  {
    eyebrow: "Welcome",
    title: "A clean daily read in under a minute",
    description: "Pick one category, check the insight, and decide your next move without friction."
  },
  {
    eyebrow: "Onchain unlock",
    title: "Unlock the deeper read with 0.1 USDC",
    description: "The free card gives the headline. The paid card adds opportunity, caution, and action guidance."
  },
  {
    eyebrow: "Built for Base",
    title: "Save, return, and keep a gentle streak",
    description: "Use the bottom navigation to move between today, history, and your profile with one thumb."
  }
] as const;

const STORAGE_KEYS = {
  streakDate: "daily-orbit:last-draw-date",
  streakCount: "daily-orbit:streak-count",
  drawHistory: "daily-orbit:draw-history",
  onboarding: "daily-orbit:onboarding-complete",
  theme: "daily-orbit:theme"
} as const;

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
  const baseDate = new Date(`${todayKey}T00:00:00`);
  baseDate.setDate(baseDate.getDate() - 1);
  return toDateKey(baseDate);
}

function getUserFriendlyError(message: string): string {
  if (message.includes("User rejected")) return "Transaction was rejected in wallet.";
  if (message.includes("insufficient funds")) return "Insufficient balance for this transaction.";
  if (message.includes("connector")) return "Wallet connection failed. Please reconnect.";
  return "Payment failed. Please try again.";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getPreferredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(STORAGE_KEYS.theme);
  if (stored === "light" || stored === "dark") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getDefaultProfile(): ProfileState {
  return {
    name: "Orbit Guest",
    username: "Ready to start",
    avatarUrl: ""
  };
}

export default function HomePage(): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<FortuneCategory>("love");
  const [draw, setDraw] = useState<DrawResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [streak, setStreak] = useState<number>(0);
  const [deepUnlocked, setDeepUnlocked] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>("");
  const [paymentHash, setPaymentHash] = useState<`0x${string}` | undefined>(undefined);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [profile, setProfile] = useState<ProfileState>(getDefaultProfile);
  const [activeTab, setActiveTab] = useState<TabKey>("today");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [onboardingIndex, setOnboardingIndex] = useState<number>(0);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [autoConnectTried, setAutoConnectTried] = useState<boolean>(false);
  const [isInsideMiniApp, setIsInsideMiniApp] = useState<boolean>(false);
  const [paymentRequestId, setPaymentRequestId] = useState<string>("");
  const [isLaunchingSponsoredPayment, setIsLaunchingSponsoredPayment] = useState<boolean>(false);

  const { address, chainId, isConnected } = useAccount();
  const { connectAsync, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const { writeContractAsync, isPending: isSendingPayment } = useWriteContract();

  const {
    isLoading: isConfirmingPayment,
    isSuccess: isPaymentSuccess,
    error: paymentReceiptError
  } = useWaitForTransactionReceipt({
    chainId: base.id,
    hash: paymentHash,
    query: {
      enabled: Boolean(paymentHash)
    }
  });

  const paymentRecipient = getPaymentRecipient();
  const hasRecipient = hasValidPaymentRecipient();
  const deepReadingPriceLabel = getDeepReadingPriceLabel();
  const deepReadingPriceUnits = getDeepReadingPriceUnits();

  const updateHistory = useCallback((entry: HistoryEntry) => {
    const next = [entry, ...history.filter((item) => item.drawId !== entry.drawId)].slice(0, 8);
    setHistory(next);
    window.localStorage.setItem(STORAGE_KEYS.drawHistory, JSON.stringify(next));
  }, [history]);

  const updateStreak = useCallback((dateKey: string) => {
    const previousDate = window.localStorage.getItem(STORAGE_KEYS.streakDate);
    const previousCount = Number(window.localStorage.getItem(STORAGE_KEYS.streakCount) || "0");

    if (previousDate === dateKey) {
      setStreak(previousCount);
      return;
    }

    const yesterday = toPreviousDateKey(dateKey);
    const nextCount = previousDate === yesterday ? previousCount + 1 : 1;

    window.localStorage.setItem(STORAGE_KEYS.streakDate, dateKey);
    window.localStorage.setItem(STORAGE_KEYS.streakCount, String(nextCount));
    setStreak(nextCount);
  }, []);

  const fetchDraw = useCallback(
    async (category: FortuneCategory, walletAddress?: string) => {
      setLoading(true);
      setError("");

      try {
        const walletQuery = walletAddress ? `&wallet=${walletAddress}` : "";
        const response = await fetch(`/api/draw?category=${category}${walletQuery}`);
        if (!response.ok) {
          throw new Error("Could not load your fortune right now. Please try again.");
        }

        const result = (await response.json()) as DrawResponse;
        setDraw(result);
        setDeepUnlocked(false);
        setPaymentHash(undefined);
        setPaymentRequestId("");
        updateStreak(result.dateKey);
        updateHistory({
          drawId: result.drawId,
          dateKey: result.dateKey,
          categoryLabel: result.categoryLabel,
          headline: result.fortune.headline,
          luckyNumber: result.fortune.luckyNumber
        });
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
    [updateHistory, updateStreak]
  );

  useEffect(() => {
    const storedHistory = window.localStorage.getItem(STORAGE_KEYS.drawHistory);
    const storedStreak = Number(window.localStorage.getItem(STORAGE_KEYS.streakCount) || "0");

    if (Number.isFinite(storedStreak)) {
      setStreak(storedStreak);
    }

    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory) as HistoryEntry[];
        setHistory(parsed);
      } catch {
        window.localStorage.removeItem(STORAGE_KEYS.drawHistory);
      }
    }

    const nextTheme = getPreferredTheme();
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;

    const hasSeenOnboarding = window.localStorage.getItem(STORAGE_KEYS.onboarding) === "true";
    setShowOnboarding(!hasSeenOnboarding);

    void sdk.actions.ready().catch(() => undefined);

    void sdk.isInMiniApp().then(setIsInsideMiniApp).catch(() => setIsInsideMiniApp(false));

    void sdk.context
      .then((context: MiniAppContext) => {
        const user = context?.user ?? {};
        const displayName = user.displayName || user.username || "Orbit Explorer";
        const username = user.username ? `@${user.username}` : user.fid ? `Base user ${user.fid}` : "Base mini app member";
        const avatarUrl = user.pfpUrl || user.avatarUrl || "";

        setProfile({
          name: displayName,
          username,
          avatarUrl
        });
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (address) {
      setProfile((current) => {
        if (current.name !== "Orbit Guest") return current;
        return {
          name: "Base Explorer",
          username: "Wallet ready on Base",
          avatarUrl: current.avatarUrl
        };
      });
    }
  }, [address]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 2200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (isPaymentSuccess) {
      setDeepUnlocked(true);
      setNotice("Payment confirmed on Base. Deep reading unlocked.");
    }
  }, [isPaymentSuccess]);

  useEffect(() => {
    if (!paymentReceiptError) return;
    setError(getUserFriendlyError(paymentReceiptError.message));
  }, [paymentReceiptError]);

  useEffect(() => {
    if (!paymentRequestId || deepUnlocked) return undefined;

    let cancelled = false;
    let checks = 0;

    const pollPaymentStatus = async (): Promise<void> => {
      checks += 1;

      try {
        const status = await getPaymentStatus({
          id: paymentRequestId,
          telemetry: false
        });

        if (cancelled) return;

        if (status.status === "completed") {
          setDeepUnlocked(true);
          setPaymentRequestId("");
          setNotice("Sponsored payment confirmed. Deep reading unlocked.");
          return;
        }

        if (status.status === "failed") {
          setPaymentRequestId("");
          setError(status.reason || "Sponsored payment failed. Please try again.");
          return;
        }

        if (status.status === "not_found" && checks >= 5) {
          setPaymentRequestId("");
          setError("We could not verify the sponsored payment yet. Please try again.");
        }
      } catch (statusError) {
        if (cancelled) return;

        setPaymentRequestId("");
        setError(
          statusError instanceof Error
            ? getUserFriendlyError(statusError.message)
            : "Unable to confirm the sponsored payment."
        );
      }
    };

    void pollPaymentStatus();
    const interval = window.setInterval(() => {
      void pollPaymentStatus();
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [deepUnlocked, paymentRequestId]);

  useEffect(() => {
    if (autoConnectTried || isConnected || connectors.length === 0) return;

    let cancelled = false;

    void sdk.isInMiniApp()
      .then(async (insideMiniApp) => {
        if (!insideMiniApp || cancelled) return;
        const coinbaseConnector =
          connectors.find((connector) => connector.name.toLowerCase().includes("coinbase")) ?? connectors[0];

        if (!coinbaseConnector) return;

        try {
          await connectAsync({ connector: coinbaseConnector });
        } catch {
          // no-op: keep manual connect available
        } finally {
          if (!cancelled) setAutoConnectTried(true);
        }
      })
      .catch(() => {
        if (!cancelled) setAutoConnectTried(true);
      });

    return () => {
      cancelled = true;
    };
  }, [autoConnectTried, connectAsync, connectors, isConnected]);

  useEffect(() => {
    if (draw) return;
    void fetchDraw("love", address).catch(() => undefined);
  }, [address, draw, fetchDraw]);

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

  const handleConnectWallet = useCallback(async () => {
    setError("");

    try {
      const coinbaseConnector =
        connectors.find((connector) => connector.name.toLowerCase().includes("coinbase")) ?? connectors[0];

      if (!coinbaseConnector) {
        setError("No wallet connector is available.");
        return;
      }

      await connectAsync({ connector: coinbaseConnector });
      setNotice("Wallet connected.");
    } catch (connectError) {
      setError(
        connectError instanceof Error
          ? getUserFriendlyError(connectError.message)
          : "Wallet connection failed."
      );
    }
  }, [connectAsync, connectors]);

  const handleDisconnectWallet = useCallback(() => {
    disconnect();
    setNotice("Wallet disconnected.");
    setDeepUnlocked(false);
    setPaymentHash(undefined);
    setPaymentRequestId("");
  }, [disconnect]);

  const handleUnlockDeepReading = useCallback(async () => {
    if (deepUnlocked) return;

    if (!hasRecipient) {
      setError("Payment recipient is not configured. Set NEXT_PUBLIC_USDC_RECEIVER.");
      return;
    }

    setError("");

    try {
      if (isInsideMiniApp) {
        setIsLaunchingSponsoredPayment(true);

        const payment = await pay({
          amount: deepReadingPriceLabel,
          to: paymentRecipient,
          telemetry: false
        });

        setPaymentRequestId(payment.id);
        setNotice("Base Pay opened. Confirm the sponsored payment to unlock.");
        return;
      }

      if (!isConnected) {
        setNotice("Connect your wallet first.");
        return;
      }

      if (chainId !== base.id) {
        await switchChainAsync({ chainId: base.id });
      }

      const txHash = await writeContractAsync({
        address: BASE_USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "transfer",
        args: [paymentRecipient as `0x${string}`, deepReadingPriceUnits],
        chainId: base.id
      });

      setPaymentHash(txHash);
      setNotice("Transaction submitted.");
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? getUserFriendlyError(paymentError.message)
          : "Payment failed."
      );
    } finally {
      setIsLaunchingSponsoredPayment(false);
    }
  }, [
    chainId,
    deepReadingPriceUnits,
    deepReadingPriceLabel,
    deepUnlocked,
    hasRecipient,
    isConnected,
    isInsideMiniApp,
    paymentRecipient,
    switchChainAsync,
    writeContractAsync
  ]);

  const handleCloseOnboarding = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEYS.onboarding, "true");
    setShowOnboarding(false);
    setOnboardingIndex(0);
  }, []);

  const handleThemeToggle = useCallback(() => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      window.localStorage.setItem(STORAGE_KEYS.theme, next);
      return next;
    });
  }, []);

  const displayDate = draw ? formatDisplayDate(draw.dateKey) : formatDisplayDate(toDateKey(new Date()));
  const selectedLabel = CATEGORIES.find((item) => item.key === selectedCategory)?.label ?? "Love";
  const heroHeadline = draw?.fortune.headline ?? "Check your daily flow in under a minute.";

  const unlockButtonLabel = deepUnlocked
    ? "Deep reading unlocked"
    : isLaunchingSponsoredPayment
      ? "Opening Base Pay..."
    : isSwitchingChain
      ? "Switching to Base..."
      : paymentRequestId || isSendingPayment || isConfirmingPayment
        ? isInsideMiniApp
          ? "Waiting for sponsored payment..."
          : "Confirming payment..."
        : isInsideMiniApp
          ? `Unlock with Base Pay (${deepReadingPriceLabel} USDC)`
          : `Unlock deep reading (${deepReadingPriceLabel} USDC)`;

  const paymentEnabled = hasRecipient;
  const currentStep = ONBOARDING_STEPS[onboardingIndex];

  return (
    <main className="app-root">
      <div className="app-shell">
        <header className="topbar">
          <div>
            <p className="brand-label">Daily Orbit</p>
            <h1 className="brand-title">A premium daily read on Base</h1>
          </div>

          <div className="topbar-actions">
            <button type="button" className="theme-toggle" onClick={handleThemeToggle}>
              {theme === "light" ? "Dark" : "Light"}
            </button>
            <span className="streak-pill">{streak} day streak</span>
          </div>
        </header>

        <section className="profile-banner">
          <div className="avatar-shell">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="avatar-image" />
            ) : (
              <span>{getInitials(profile.name)}</span>
            )}
          </div>

          <div className="profile-copy">
            <p className="profile-name">{profile.name}</p>
            <p className="profile-username">{profile.username}</p>
          </div>

          <div className="profile-actions">
            {isConnected ? (
              <button type="button" className="secondary-button" onClick={handleDisconnectWallet}>
                Connected
              </button>
            ) : (
              <button
                type="button"
                className="secondary-button accent"
                onClick={handleConnectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting..." : "Connect Base"}
              </button>
            )}
          </div>
        </section>

        <nav className="bottom-nav" aria-label="Primary navigation">
          <button
            type="button"
            className={activeTab === "today" ? "nav-item active" : "nav-item"}
            onClick={() => setActiveTab("today")}
          >
            <span>Today</span>
            <small>Read</small>
          </button>
          <button
            type="button"
            className={activeTab === "history" ? "nav-item active" : "nav-item"}
            onClick={() => setActiveTab("history")}
          >
            <span>History</span>
            <small>Past cards</small>
          </button>
          <button
            type="button"
            className={activeTab === "profile" ? "nav-item active" : "nav-item"}
            onClick={() => setActiveTab("profile")}
          >
            <span>Profile</span>
            <small>Settings</small>
          </button>
        </nav>

        {activeTab === "today" ? (
          <>
            <section className="hero-card">
              <div>
                <p className="section-eyebrow">Today&apos;s insight</p>
                <h2 className="hero-headline">{heroHeadline}</h2>
                <p className="hero-caption">{displayDate}</p>
              </div>
              <p className="hero-note">Clear first action, no clutter, and one-thumb navigation.</p>
            </section>

            <section className="panel-card">
              <div className="panel-head">
                <div>
                  <p className="section-eyebrow">Step 1</p>
                  <h3 className="panel-title">Select a category</h3>
                </div>
                <span className="panel-meta">Current: {selectedLabel}</span>
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
                className="primary-button"
                disabled={loading}
                onClick={() => fetchDraw(selectedCategory, address)}
              >
                {loading ? "Loading your fortune..." : "Check today's fortune"}
              </button>
            </section>

            <section className="panel-card">
              <div className="panel-head">
                <div>
                  <p className="section-eyebrow">Step 2</p>
                  <h3 className="panel-title">Your reading</h3>
                </div>
                <span className="panel-meta">{displayDate}</span>
              </div>

              {error ? <p className="error-copy">{error}</p> : null}

              {draw ? (
                <>
                  <article className="reading-card">
                    <p className="result-chip">{draw.categoryLabel}</p>
                    <h4 className="reading-title">{draw.fortune.headline}</h4>
                    <p className="reading-body">{draw.fortune.detail}</p>
                  </article>

                  <div className="metrics-grid">
                    <div className="metric-card">
                      <small>Lucky color</small>
                      <strong>{draw.fortune.luckyColor}</strong>
                    </div>
                    <div className="metric-card">
                      <small>Lucky number</small>
                      <strong>{draw.fortune.luckyNumber}</strong>
                    </div>
                    <div className="metric-card">
                      <small>Mood tag</small>
                      <strong>{draw.fortune.moodTag}</strong>
                    </div>
                  </div>

                  <div className="action-group">
                    <button type="button" className="secondary-button" onClick={handleShare}>
                      Share result
                    </button>
                    <button
                      type="button"
                      className="secondary-button accent"
                      onClick={handleUnlockDeepReading}
                      disabled={
                        deepUnlocked ||
                        isLaunchingSponsoredPayment ||
                        isSwitchingChain ||
                        Boolean(paymentRequestId) ||
                        isSendingPayment ||
                        isConfirmingPayment ||
                        !paymentEnabled
                      }
                    >
                      {unlockButtonLabel}
                    </button>
                  </div>

                  {!paymentEnabled ? (
                    <p className="support-copy">Set NEXT_PUBLIC_USDC_RECEIVER to enable the paid unlock flow.</p>
                  ) : isInsideMiniApp ? (
                    <p className="support-copy">Inside Base mini app, unlocks use Base Pay for a sponsored checkout flow.</p>
                  ) : null}

                  {paymentHash ? (
                    <p className="support-copy">
                      Transaction submitted. <a href={toBaseScanTxUrl(paymentHash)} target="_blank" rel="noreferrer">View on BaseScan</a>
                    </p>
                  ) : null}

                  {paymentRequestId ? (
                    <p className="support-copy">Waiting for Base Pay confirmation. This usually takes a few seconds.</p>
                  ) : null}

                  {deepUnlocked ? (
                    <section className="deep-card">
                      <h4 className="deep-title">Deep reading</h4>
                      <ul className="deep-list">
                        <li>Opportunity: Start one meaningful conversation early today.</li>
                        <li>Watch out: Do not rush decisions before checking context.</li>
                        <li>Relationships: A kind message improves trust faster than silence.</li>
                        <li>Action: Give tonight ten minutes to plan your next move with calm intent.</li>
                      </ul>
                      <p className="tiny-note">Onchain payment confirmed on Base.</p>
                    </section>
                  ) : null}
                </>
              ) : (
                <p className="empty-copy">Pick a category and tap the button to load your reading.</p>
              )}
            </section>
          </>
        ) : null}

        {activeTab === "history" ? (
          <section className="panel-card tab-panel">
            <div className="panel-head">
              <div>
                <p className="section-eyebrow">Recent cards</p>
                <h3 className="panel-title">History</h3>
              </div>
              <span className="panel-meta">{history.length} saved</span>
            </div>

            {history.length > 0 ? (
              <div className="history-list">
                {history.map((item) => (
                  <article key={item.drawId} className="history-item">
                    <div>
                      <p className="history-label">{item.categoryLabel}</p>
                      <h4>{item.headline}</h4>
                      <p>{formatDisplayDate(item.dateKey)}</p>
                    </div>
                    <span className="history-number">#{item.luckyNumber}</span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-copy">Your recent cards will appear here after you check a few fortunes.</p>
            )}
          </section>
        ) : null}

        {activeTab === "profile" ? (
          <section className="panel-card tab-panel profile-panel">
            <div className="panel-head">
              <div>
                <p className="section-eyebrow">Profile and settings</p>
                <h3 className="panel-title">Your Base setup</h3>
              </div>
              <span className="panel-meta">{theme} mode</span>
            </div>

            <div className="profile-summary">
              <div className="avatar-shell large">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name} className="avatar-image" />
                ) : (
                  <span>{getInitials(profile.name)}</span>
                )}
              </div>
              <div>
                <p className="profile-name">{profile.name}</p>
                <p className="profile-username">{profile.username}</p>
                <p className="support-copy">Wallet status: {isConnected ? "Connected on Base" : "Not connected"}</p>
              </div>
            </div>

            <div className="settings-grid">
              <button type="button" className="settings-card" onClick={handleThemeToggle}>
                <span>Theme</span>
                <strong>Switch to {theme === "light" ? "dark" : "light"}</strong>
              </button>
              <button
                type="button"
                className="settings-card"
                onClick={() => {
                  setShowOnboarding(true);
                  setOnboardingIndex(0);
                }}
              >
                <span>Onboarding</span>
                <strong>Show intro again</strong>
              </button>
            </div>

            <div className="callout-card">
              <h4>Featured checklist progress</h4>
              <ul className="checklist-list">
                        <li>Bottom navigation and centered CTAs are in place.</li>
                        <li>Light and dark mode are both supported.</li>
                        <li>Wallet can auto-connect inside supported mini app clients.</li>
                        <li>Deep reading now uses Base Pay inside mini app for a sponsored checkout flow.</li>
                      </ul>
                    </div>
          </section>
        ) : null}
      </div>

      {showOnboarding ? (
        <div className="modal-backdrop" role="presentation">
          <section className="onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
            <p className="section-eyebrow">{currentStep.eyebrow}</p>
            <h2 id="onboarding-title" className="modal-title">{currentStep.title}</h2>
            <p className="modal-body">{currentStep.description}</p>

            <div className="step-indicators" aria-hidden>
              {ONBOARDING_STEPS.map((_, index) => (
                <span key={index} className={index === onboardingIndex ? "step-dot active" : "step-dot"} />
              ))}
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={handleCloseOnboarding}>
                Skip
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  if (onboardingIndex === ONBOARDING_STEPS.length - 1) {
                    handleCloseOnboarding();
                    return;
                  }
                  setOnboardingIndex((current) => current + 1);
                }}
              >
                {onboardingIndex === ONBOARDING_STEPS.length - 1 ? "Start" : "Next"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {notice ? <div className="toast">{notice}</div> : null}
    </main>
  );
}
