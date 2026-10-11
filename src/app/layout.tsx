import type { Metadata } from "next";
import { Sora, Manrope, Space_Grotesk } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://yugantar2026.pce.ac.in"),
  title: "YUGANTAR 2026 — Engineering the Next Era",
  description:
    "Official portal for YUGANTAR 2026, the premier intercollegiate technical festival organized by the Department of Electronics and Telecommunication Engineering at Priyadarshini College of Engineering, Nagpur. 22 October 2026.",
  keywords: [
    "YUGANTAR",
    "YUGANTAR 2026",
    "Priyadarshini College of Engineering",
    "PCE Nagpur",
    "Electronics and Telecommunication Engineering",
    "TELE-ERA",
    "IETE",
    "Technical Festival Nagpur",
  ],
  authors: [{ name: "Department of Electronics and Telecommunication Engineering, PCE Nagpur" }],
  openGraph: {
    title: "YUGANTAR 2026 — Engineering the Next Era",
    description:
      "Join us on 22 October 2026 at Priyadarshini College of Engineering, Nagpur for eight flagship competitions across hardware, research, strategy, and esports.",
    url: "https://yugantar2026.pce.ac.in",
    siteName: "YUGANTAR 2026",
    images: [
      {
        url: "/images/nexus-city/hero-panoramic-city.webp",
        width: 1947,
        height: 808,
        alt: "YUGANTAR 2026 — Engineering the Next Era",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: "/images/nexus-city/yugantar-logo-isolated.webp",
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
      className={`${sora.variable} ${manrope.variable} ${spaceGrotesk.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-[#F5F6FA] text-[#15294A] font-sans antialiased selection:bg-[#FF874D] selection:text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
