import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lucent — AI Skincare Advisor",
  description: "Your skin, finally understood. AI-powered skincare analysis, personalized routines, and curated products — all in one place.",
  keywords: ["skincare", "AI", "skin analysis", "personalized routine", "dermatologist", "beauty"],
  openGraph: {
    title: "Lucent — AI Skincare Advisor",
    description: "AI-powered skincare analysis and personalized routines.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ background: "#FAFBFC" }}>
        {children}
      </body>
    </html>
  );
}
