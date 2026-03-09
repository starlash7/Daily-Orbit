import { NextRequest, NextResponse } from "next/server";

import {
  getAccountAssociation,
  getBaseUrl,
  getCanonicalDomain,
  hasAccountAssociation,
  normalizeBaseUrl
} from "@/lib/manifest";

function buildAppUrl(baseUrl: string, path = ""): string {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  return `${normalizedBase}${path}`;
}

export function GET(request: NextRequest): NextResponse {
  const baseUrl = getBaseUrl(request.nextUrl.origin);
  const accountAssociation = getAccountAssociation();
  const hasAssociation = hasAccountAssociation(accountAssociation);
  const canonicalDomain = getCanonicalDomain(baseUrl);
  const shouldIndex = process.env.VERCEL_ENV === "production" && hasAssociation;

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
    canonicalDomain,
    screenshotUrls,
    primaryCategory: "entertainment",
    requiredChains: ["eip155:8453"],
    tags: ["fortune", "dailyread", "wellbeing"],
    heroImageUrl,
    tagline: "Read today with calm clarity",
    ogTitle: "Daily Orbit",
    ogDescription: "A premium daily fortune with an optional onchain unlock on Base.",
    ogImageUrl: heroImageUrl,
    requiredCapabilities: ["actions.ready"],
    noindex: !shouldIndex
  };

  const manifest = {
    accountAssociation,
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
      "Cache-Control": "no-store",
      "X-MiniApp-Account-Association": hasAssociation ? "configured" : "missing"
    }
  });
}
