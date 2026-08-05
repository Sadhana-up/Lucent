import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
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
      className={`${plusJakarta.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ background: "#FAF6F0" }}>
        {children}
      </body>
    </html>
  );
}
