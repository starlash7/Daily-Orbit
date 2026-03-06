import { NextRequest, NextResponse } from "next/server";

function normalizeBaseUrl(rawBaseUrl: string): string {
  return rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
}

function buildAppUrl(baseUrl: string, path = ""): string {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  return `${normalizedBase}${path}`;
}

export function GET(request: NextRequest): NextResponse {
  const envBase = process.env.NEXT_PUBLIC_URL?.trim();
  const baseUrl = envBase ? normalizeBaseUrl(envBase) : request.nextUrl.origin;
  const isProduction = request.nextUrl.origin.includes("daily-orbit-ten.vercel.app");

  const iconUrl = buildAppUrl(baseUrl, "/miniapp/icon.png");
  const homeUrl = buildAppUrl(baseUrl, "/");
  const heroImageUrl = buildAppUrl(baseUrl, "/miniapp/cover.png");
  const splashImageUrl = buildAppUrl(baseUrl, "/miniapp/splash.png");
  const screenshotUrls = [
    buildAppUrl(baseUrl, "/miniapp/screenshot-1.png"),
    buildAppUrl(baseUrl, "/miniapp/screenshot-2.png"),
    buildAppUrl(baseUrl, "/miniapp/screenshot-3.png")
  ];

  const sharedMiniApp = {
    version: "1",
    name: "Daily Orbit",
    homeUrl,
    iconUrl,
    splashImageUrl,
    splashBackgroundColor: "#0E1C3F",
    subtitle: "Daily fortune on Base",
    description:
      "Check a premium daily reading, save your streak, and unlock the deeper card with a simple onchain action.",
    screenshotUrls,
    primaryCategory: "entertainment",
    tags: ["fortune", "dailyread", "wellbeing"],
    heroImageUrl,
    tagline: "Read today with calm clarity",
    ogTitle: "Daily Orbit",
    ogDescription: "A premium daily fortune with an optional onchain unlock on Base.",
    ogImageUrl: heroImageUrl,
    noindex: !isProduction
  };

  const manifest = {
    accountAssociation: {
      header: process.env.FARCASTER_HEADER || "",
      payload: process.env.FARCASTER_PAYLOAD || "",
      signature: process.env.FARCASTER_SIGNATURE || ""
    },
    frame: {
      version: "1",
      name: "Daily Orbit",
      iconUrl,
      homeUrl,
      imageUrl: heroImageUrl,
      buttonTitle: "Open Daily Orbit",
      splashImageUrl,
      splashBackgroundColor: "#0E1C3F"
    },
    miniapp: sharedMiniApp
  };

  return NextResponse.json(manifest, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
