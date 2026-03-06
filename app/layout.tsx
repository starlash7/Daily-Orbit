import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Daily Orbit",
  description: "Daily Orbit on Base with onchain USDC unlocks",
  other: {
    "base:app_id": "69a98a0a0050dd24efcc1e8c"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
