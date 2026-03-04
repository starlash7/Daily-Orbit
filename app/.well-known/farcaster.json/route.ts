import { NextResponse } from "next/server";

function buildAppUrl(path = ""): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBase}${path}`;
}

export function GET(): NextResponse {
  const iconUrl = buildAppUrl("/miniapp/icon.svg");
  const homeUrl = buildAppUrl("/");
  const imageUrl = buildAppUrl("/miniapp/og.svg");
  const splashImageUrl = buildAppUrl("/miniapp/splash.svg");

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
