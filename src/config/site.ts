import type { NavigationItem } from "@/types/site";

export const siteConfig = {
  name: "WallStreetFatCats",
  shortName: "WSFC",
  description:
    "Institutional-grade stock analysis and disciplined investment strategies presented with clarity, transparency, and personality.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://wallstreetfatcats.com",
} as const;

export const primaryNavigation: readonly NavigationItem[] = [
  { label: "Home", href: "/", current: true },
  { label: "Gordon", href: "/gordon" },
  { label: "Warren", href: "/warren" },
  { label: "Double Down", href: "/double-down" },
  { label: "Double Barrel", href: "/double-barrel" },
  { label: "Top Gainerz", href: "/top-gainerz" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
] as const;