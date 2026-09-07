/**
 * Root layout.
 *
 * Next.js auto-generated a placeholder layout.tsx on first run because
 * one wasn't provided — this is the real one, replacing it, so we
 * control font loading (Devanagari + Latin, per the bilingual design
 * requirement) and page metadata explicitly rather than relying on
 * Next's bare-bones default.
 */
import type { Metadata } from "next";
import { Poppins, Noto_Sans_Devanagari } from "next/font/google";
import { AppHeader } from "@/components/layout/AppHeader";
import { colors } from "@/theme/tokens";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-latin",
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "700"],
  variable: "--font-devanagari",
});

export const metadata: Metadata = {
  title: "SLG Enterprise",
  description: "खाद, बीज, अनाज और डिजिटल सेवा | Fertilizer, Seeds, Grain & Digital Services",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi">
      <body
        className={`${poppins.variable} ${notoDevanagari.variable}`}
        style={{ margin: 0, background: colors.huskCream }}
      >
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
