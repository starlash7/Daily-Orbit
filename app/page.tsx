"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

import {
  BASE_USDC_ADDRESS,
  getDeepReadingPriceLabel,
  getDeepReadingPriceUnits,
  getPaymentRecipient,
  hasValidPaymentRecipient,
  toBaseScanTxUrl
} from "@/lib/payments";
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
  const baseDate = new Date(`${todayKey}T00:00:00`);
  baseDate.setDate(baseDate.getDate() - 1);
  return toDateKey(baseDate);
}

function shortenAddress(address?: string): string {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getUserFriendlyError(message: string): string {
  if (message.includes("User rejected")) return "Transaction was rejected in wallet.";
  if (message.includes("insufficient funds")) return "Insufficient balance for this transaction.";
  if (message.includes("connector")) return "Wallet connection failed. Please reconnect.";
  return "Payment failed. Please try again.";
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
    fetchDraw("love", address).catch(() => undefined);
  }, [address, fetchDraw]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 1800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (isPaymentSuccess) {
      setDeepUnlocked(true);
      setNotice("Payment confirmed. Deep reading unlocked.");
    }
  }, [isPaymentSuccess]);

  useEffect(() => {
    if (!paymentReceiptError) return;
    setError(getUserFriendlyError(paymentReceiptError.message));
  }, [paymentReceiptError]);

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
        connectors.find((connector) =>
          connector.name.toLowerCase().includes("coinbase")
        ) ?? connectors[0];

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
  }, [disconnect]);

  const handleUnlockDeepReading = useCallback(async () => {
    if (deepUnlocked) {
      return;
    }

    if (!isConnected) {
      setNotice("Connect your wallet first.");
      return;
    }

    if (!hasRecipient) {
      setError("Payment recipient is not configured. Set NEXT_PUBLIC_USDC_RECEIVER.");
      return;
    }

    setError("");

    try {
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
    }
  }, [
    chainId,
    deepReadingPriceUnits,
    deepUnlocked,
    hasRecipient,
    isConnected,
    paymentRecipient,
    switchChainAsync,
    writeContractAsync
  ]);

  const displayDate = draw ? formatDisplayDate(draw.dateKey) : formatDisplayDate(toDateKey(new Date()));
  const selectedLabel = useMemo(
    () => CATEGORIES.find((item) => item.key === selectedCategory)?.label ?? "Love",
    [selectedCategory]
  );
  const heroHeadline = draw?.fortune.headline ?? "Check your daily flow in under a minute.";

  const unlockButtonLabel = deepUnlocked
    ? "Deep reading unlocked"
    : isSwitchingChain
      ? "Switching to Base..."
      : isSendingPayment || isConfirmingPayment
        ? "Confirming payment..."
        : `Unlock deep reading (${deepReadingPriceLabel} USDC)`;

  return (
    <main className="premium-root">
      <section className="app-frame">
        <header className="app-header">
          <div className="app-title-block">
            <p className="app-kicker">Daily Orbit</p>
            <h1 className="app-title">Daily Fortune</h1>
          </div>

          <div className="wallet-panel">
            <p className="wallet-address">{shortenAddress(address)}</p>
            {isConnected ? (
              <button type="button" className="wallet-button secondary" onClick={handleDisconnectWallet}>
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                className="wallet-button"
                onClick={handleConnectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting..." : "Connect Base"}
              </button>
            )}
          </div>
        </header>

        <section className="insight-hero" aria-label="today insight">
          <p className="insight-kicker">Today&apos;s insight</p>
          <p className="insight-main">{heroHeadline}</p>
          <p className="insight-sub">A focused one-line read, then your next action.</p>
          <p className="insight-streak">Current streak: {streak} days</p>
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
            onClick={() => fetchDraw(selectedCategory, address)}
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
                  onClick={handleUnlockDeepReading}
                  disabled={
                    deepUnlocked ||
                    isSwitchingChain ||
                    isSendingPayment ||
                    isConfirmingPayment ||
                    !hasRecipient
                  }
                >
                  {unlockButtonLabel}
                </button>
              </div>

              {!hasRecipient ? (
                <p className="config-warning">Set NEXT_PUBLIC_USDC_RECEIVER to enable onchain unlock.</p>
              ) : null}

              {paymentHash ? (
                <p className="tx-line">
                  Transaction submitted. <a href={toBaseScanTxUrl(paymentHash)} target="_blank" rel="noreferrer">View on BaseScan</a>
                </p>
              ) : null}
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
              <p className="tiny-note">Onchain payment confirmed on Base.</p>
            </section>
          ) : null}
        </section>
      </section>

      {notice ? <div className="toast">{notice}</div> : null}
    </main>
  );
}
