import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Orbit",
  description: "Base Mini App fortune experience with a mysterious-cute vibe"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
