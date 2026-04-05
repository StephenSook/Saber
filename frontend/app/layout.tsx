import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { LanguageProvider } from "@/components/LanguageProvider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Saber — Know What They Know",
  description:
    "AI-powered diagnostics that separate language barriers from knowledge gaps for English Language Learners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.className}>
      <body className="min-h-screen bg-offwhite text-navy antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
