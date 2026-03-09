import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

import { getBaseUrl } from "@/lib/manifest";

import "./globals.css";
import { Providers } from "./providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk"
});

const normalizedBaseUrl = getBaseUrl();
const heroImageUrl = `${normalizedBaseUrl}/miniapp/cover.png`;

export const metadata: Metadata = {
  title: "Daily Orbit",
  description: "A premium daily fortune read with an optional onchain unlock on Base.",
  openGraph: {
    title: "Daily Orbit",
    description: "Check a clean daily reading, save your streak, and unlock the deeper card on Base.",
    images: [heroImageUrl]
  },
  other: {
    "base:app_id": "69a98a0a0050dd24efcc1e8c",
    "fc:miniapp": JSON.stringify({
      version: "next",
      imageUrl: heroImageUrl,
      button: {
        title: "Open Daily Orbit",
        action: {
          type: "launch_miniapp",
          name: "Daily Orbit",
          url: normalizedBaseUrl,
          splashImageUrl: `${normalizedBaseUrl}/miniapp/splash.png`,
          splashBackgroundColor: "#0E1C3F"
        }
      }
    })
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
