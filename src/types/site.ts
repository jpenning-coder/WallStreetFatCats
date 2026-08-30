import type { LucideIcon } from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  current?: boolean;
};

export type FeatureItem = {
  title: string;
  lines: readonly string[];
  icon: LucideIcon;
};

export type MarketTapeItem = {
  symbol: string;
  price: string;
  change: string;
  direction: "up" | "down" | "flat";
};