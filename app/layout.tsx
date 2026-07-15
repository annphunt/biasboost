import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const SITE_TITLE = "BiasBoost | Think More Clearly. Make Better Decisions.";
const SITE_DESCRIPTION =
  "Sharpen your thinking through short, interactive Boosts that reveal your blind spots and improve your judgement over time.";

export const metadata: Metadata = {
  metadataBase: new URL("https://biasboost.boostcamp.io"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "https://biasboost.boostcamp.io",
    siteName: "BiasBoost",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="bg-white text-slate-800 antialiased min-h-screen font-[family-name:var(--font-geist)]">
        {children}
      </body>
    </html>
  );
}
