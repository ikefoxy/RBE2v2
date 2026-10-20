import type { Metadata } from "next";
import "./theme.css";

export const metadata: Metadata = {
  title: "RBE 2v2 · Fall 2026 | Royal Blue Esports",
  description: "The home of BYU Royal Blue Esports 2v2. Standings, schedules, teams, match recordings and the LAN finals.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
