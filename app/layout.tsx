import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";

import { LanguageProvider } from "../frontend/components/LanguageProvider";
import "../frontend/app/globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Saber — Know What They Know",
  description:
    "AI-powered diagnostics that separate language barriers from knowledge gaps for English Language Learners.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * Provides the unified application shell for all pages and API routes.
 */
export default function RootLayout({
  children,
}: Readonly<RootLayoutProps>): React.JSX.Element {
  return (
    <html lang="en" className={dmSans.className}>
      <body className="min-h-screen bg-offwhite text-navy antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
