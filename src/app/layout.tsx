import type { Metadata } from "next";
import { Sora, Manrope, Space_Grotesk } from "next/font/google";
import TurboBitsObserver from "@/components/organizers/TurboBitsObserver";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["500", "600", "700"],
});

import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "YUGANTAR 2026 — Engineering the Next Era | PCE Nagpur",
    template: "%s | YUGANTAR 2026",
  },
  description:
    "Official portal for YUGANTAR 2026, the premier intercollegiate technical festival organized by the Department of Electronics and Telecommunication Engineering & TELE-ERA at Priyadarshini College of Engineering, Nagpur. 21 October 2026.",
  keywords: [
    "YUGANTAR",
    "YUGANTAR 2026",
    "Priyadarshini College of Engineering",
    "PCE Nagpur",
    "Electronics and Telecommunication Engineering",
    "ETC Department PCE",
    "TELE-ERA",
    "Technical Festival Nagpur",
    "Engineering Competitions",
    "Ideathon Nagpur",
    "Hardware Hackathon",
  ],
  authors: [{ name: "Department of Electronics and Telecommunication Engineering, PCE Nagpur" }],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "YUGANTAR 2026 — Engineering the Next Era",
    description:
      "Join us on 21 October 2026 at Priyadarshini College of Engineering, Nagpur for flagship engineering competitions across hardware, research, strategy, and esports.",
    url: siteUrl,
    siteName: "YUGANTAR 2026",
    images: [
      {
        url: "/images/nexus-city/hero-panoramic-city.webp",
        width: 1947,
        height: 808,
        alt: "YUGANTAR 2026 — Engineering the Next Era",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YUGANTAR 2026 — Engineering the Next Era",
    description:
      "Join us on 21 October 2026 at Priyadarshini College of Engineering, Nagpur for flagship engineering competitions.",
    images: ["/images/nexus-city/hero-panoramic-city.webp"],
  },
  verification: {
    google: "8yZFxb5LHYz6W9WRu4YK0SKYtma1TTLBCZqg1_0IN8I",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo-schema";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgSchema = buildOrganizationSchema();
  const webSiteSchema = buildWebSiteSchema();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${sora.variable} ${manrope.variable} ${spaceGrotesk.variable} scroll-smooth`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      </head>
      <body className="min-h-screen bg-[#F5F6FA] text-[#15294A] font-sans antialiased selection:bg-[#FF874D] selection:text-white overflow-x-hidden">
        <TurboBitsObserver />
        {children}
      </body>
    </html>
  );
}
