import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "BiasBoost — Decision Intelligence Assessment",
  description:
    "A structured reflection of how experienced professionals make decisions under uncertainty.",
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
