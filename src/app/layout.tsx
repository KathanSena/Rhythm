import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rhythm — Retention, in time",
  description:
    "See which repeat shoppers have passed their usual reorder interval, review the purchase history, and prepare a follow-up.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
