import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { Providers } from "@/app/providers";
import "./globals.css";

/**
 * The same face the public site uses. A Latin-only font here would fall back to
 * whatever the OS supplies for Arabic, and the admin would stop looking like the
 * site the moment a single word was rendered.
 */
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "لوحة تحكم الدكتور محمد البحراوي",
    template: "%s — لوحة التحكم",
  },
  description: "إدارة الموقع والرد على الأسئلة والفتاوى والتعليقات.",
  // An admin surface must never be indexed.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${arabic.variable} h-full`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
