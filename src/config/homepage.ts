import {
  BrainCircuit,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";

import type { FeatureItem, MarketTapeItem } from "@/types/site";

export const heroConfig = {
  eyebrow: "Wall Street intelligence, without the velvet rope.",
  headline: ["Markets Move.", "We Move Faster."],
  description: [
    "Real-time data. AI-powered analysis.",
    "Automated strategies. Built for every market condition.",
  ],
  primaryCta: {
    label: "Get Free Analysis",
    href: "/gordon",
  },
  secondaryCta: {
    label: "Explore Strategies",
    href: "#strategies",
  },
  image: {
    src: "/images/home/frenzied-cat-traders.png",
    alt: "A cinematic stock exchange trading floor filled with anthropomorphic cats in tailored suits, surrounded by market screens and flying reports.",
  },
} as const;

export const features: readonly FeatureItem[] = [
  {
    title: "Real-Time Edge",
    lines: ["Live data. Instant analysis.", "Never miss a move."],
    icon: Zap,
  },
  {
    title: "AI Analysts",
    lines: ["Gordon. Warren.", "Institutional-grade insights."],
    icon: BrainCircuit,
  },
  {
    title: "Automated Strategies",
    lines: ["Double Down. Double Barrel.", "Top Gainerz. Execute 24/7."],
    icon: Target,
  },
  {
    title: "Risk Managed",
    lines: ["Discipline. Protection.", "Consistency over hype."],
    icon: ShieldCheck,
  },
] as const;

/**
 * Presentation-only tape matching the supplied homepage artwork.
 * Replace these values with a real market-data source in a future backend phase.
 */
export const marketTape: readonly MarketTapeItem[] = [
  { symbol: "SPY", price: "495.74", change: "-4.91%", direction: "down" },
  { symbol: "QQQ", price: "423.57", change: "-5.26%", direction: "down" },
  { symbol: "DIA", price: "382.11", change: "-4.35%", direction: "down" },
  { symbol: "IWM", price: "196.34", change: "-6.14%", direction: "down" },
  { symbol: "AAPL", price: "181.79", change: "-4.23%", direction: "down" },
  { symbol: "TSLA", price: "173.21", change: "-6.87%", direction: "down" },
  { symbol: "NVDA", price: "949.50", change: "-7.32%", direction: "down" },
  { symbol: "AMZN", price: "168.55", change: "-3.91%", direction: "down" },
  { symbol: "META", price: "474.12", change: "-4.02%", direction: "down" },
] as const;