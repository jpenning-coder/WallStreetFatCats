import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock3, ShieldCheck } from "lucide-react";

import { AnalysisWorkspace } from "@/components/gordon/analysis-workspace";
import { SiteHeader } from "@/components/layout/site-header";
import { siteConfig } from "@/config/site";

import "./gordon.css";

const description = "Meet GORDON, Wall Street FAT CATS’ short-horizon tactical analyst. Enter a stock ticker for momentum, market context, and risk analysis over approximately 1 day to 2 weeks.";

export const metadata: Metadata = {
  title: "GORDON | Tactical Stock Analysis",
  description,
  alternates: { canonical: "/gordon" },
  openGraph: {
    type: "website",
    url: "/gordon",
    siteName: siteConfig.name,
    title: "GORDON | The Tactical Desk",
    description,
    images: [{ url: "/images/home/frenzied-cat-traders.png", alt: "Wall Street FAT CATS trading floor" }],
  },
  twitter: { card: "summary_large_image", title: "GORDON | The Tactical Desk", description, images: ["/images/home/frenzied-cat-traders.png"] },
};

export default function GordonPage() {
  return (
    <div className="gordon-page">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <SiteHeader currentPath="/gordon" />
      <main id="main-content" className="gordon-main">
        <section className="gordon-intro" aria-labelledby="gordon-title">
          <div className="gordon-intro-art" aria-hidden="true" />
          <div className="gordon-container gordon-intro-inner">
            <div className="gordon-intro-copy">
              <p className="gordon-eyebrow"><span className="gordon-kicker-rule" aria-hidden="true" /> Wall Street FAT CATS / The tactical desk</p>
              <h1 id="gordon-title">GORDON<span>.</span></h1>
              <p className="gordon-intro-tagline">The move matters.<br /><em>So does the setup.</em></p>
              <p className="gordon-intro-description">Your short-horizon tactical analyst. Momentum, market context, and risk — distilled into a focused report for the days ahead.</p>
            </div>
            <div className="gordon-horizon">
              <Clock3 size={18} strokeWidth={1.4} aria-hidden="true" />
              <span className="gordon-eyebrow">The analytical horizon</span>
              <p>1 day <span>—</span> 2 weeks</p>
              <span className="gordon-horizon-caption">Tactical perspective.<br />Not a long-term valuation.</span>
            </div>
          </div>
        </section>

        <div className="gordon-container">
          <AnalysisWorkspace />
          <section className="gordon-mandate" aria-labelledby="gordon-mandate-title">
            <div><p className="gordon-eyebrow">The mandate</p><h2 id="gordon-mandate-title">A disciplined lens.<br />{" "}<em>Not a crystal ball.</em></h2></div>
            <div className="gordon-mandate-body">
              <p>GORDON examines opening-range breakouts, VWAP, RSI, MACD, EMA structure, relative volume, volatility, relative strength, and the quality of a trend. The report connects the available analysis with recent news.</p>
              <p>Entry, stop, and target levels appear only when supported by the analysis. Data gaps and uncertainty matter as much as a strong setup.</p>
              <div className="gordon-archetypes" aria-label="Strategy archetypes"><span>Momentum</span><span>ORB</span><span>Mean Reversion</span><span>Straddle</span><span>Swing</span></div>
            </div>
          </section>
          <aside className="gordon-disclaimer" aria-label="Risk disclosure"><ShieldCheck size={22} strokeWidth={1.4} aria-hidden="true" /><p><strong>Research, not a recommendation.</strong> GORDON provides informational analysis, not personalized investment advice or trade execution. Market data may be delayed or incomplete, and AI-generated interpretation can be wrong. Markets can move against any setup; losses are possible. Verify the information and make your own decisions.</p></aside>
          <footer className="gordon-footer"><span>Wall Street intelligence. Main Street access.</span><Link href="/">Back to Wall Street FAT CATS <ArrowUpRight size={15} aria-hidden="true" /></Link></footer>
        </div>
      </main>
    </div>
  );
}
