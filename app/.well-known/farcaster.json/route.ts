import { NextRequest, NextResponse } from "next/server";

function normalizeBaseUrl(rawBaseUrl: string): string {
  return rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
}

function buildAppUrl(baseUrl: string, path = ""): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBase}${path}`;
}

export function GET(request: NextRequest): NextResponse {
  const envBase = process.env.NEXT_PUBLIC_URL?.trim();
  const baseUrl = envBase ? normalizeBaseUrl(envBase) : request.nextUrl.origin;

  const iconUrl = buildAppUrl(baseUrl, "/miniapp/icon.svg");
  const homeUrl = buildAppUrl(baseUrl, "/");
  const imageUrl = buildAppUrl(baseUrl, "/miniapp/og.svg");
  const splashImageUrl = buildAppUrl(baseUrl, "/miniapp/splash.svg");

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
      imageUrl,
      buttonTitle: "Open Daily Orbit",
      splashImageUrl,
      splashBackgroundColor: "#1D2A52"
    }
  };

  return NextResponse.json(manifest, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
