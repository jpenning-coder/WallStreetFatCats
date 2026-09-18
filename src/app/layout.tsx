import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { siteConfig } from "@/config/site";

import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-wsfc-sans",
});

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-wsfc-display",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "WallStreetFatCats | Institutional Edge for Everyone",
    template: "%s | WallStreetFatCats",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: siteConfig.name,
    title: "WallStreetFatCats | Institutional Edge for Everyone",
    description: siteConfig.description,
    images: [
      {
        url: "/images/home/hero-trading-floor.webp",
        width: 1536,
        height: 780,
        alt: "WallStreetFatCats trading-floor artwork",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WallStreetFatCats | Institutional Edge for Everyone",
    description: siteConfig.description,
    images: ["/images/home/hero-trading-floor.webp"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020302",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}