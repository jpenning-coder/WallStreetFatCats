import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FeatureRail } from "@/components/home/feature-rail";
import { MarketTape } from "@/components/home/market-tape";
import { buttonVariants } from "@/components/ui/button";
import { heroConfig } from "@/config/homepage";
import { cn } from "@/lib/cn";

export function Hero() {
  return (
    <section aria-labelledby="homepage-title" className="home-hero">
      <div className="hero-art-shell">
        <Image
          src={heroConfig.image.src}
          alt={heroConfig.image.alt}
          fill
          preload
          quality={92}
          sizes="100vw"
          className="hero-art-image"
        />

        <div aria-hidden="true" className="hero-color-grade" />
        <div aria-hidden="true" className="hero-top-shade" />
        <div aria-hidden="true" className="hero-left-scrim" />
        <div aria-hidden="true" className="hero-copy-cleanup" />
        <div aria-hidden="true" className="hero-bottom-shade" />
        <div aria-hidden="true" className="hero-vignette" />
      </div>

      <div className="hero-content-shell">
        <div className="hero-copy">
          <h1 id="homepage-title" className="hero-title">
            <span>{heroConfig.headline[0]}</span>
            <span>{heroConfig.headline[1]}</span>
          </h1>

          <p className="hero-description">
            {heroConfig.description.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>

          <div className="hero-actions">
            <Link
              href={heroConfig.primaryCta.href}
              className={cn(
                buttonVariants({ variant: "primary", size: "lg" }),
                "group min-w-[12.6rem] justify-between",
              )}
            >
              {heroConfig.primaryCta.label}
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>

            <Link
              href={heroConfig.secondaryCta.href}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "min-w-[12rem]",
              )}
            >
              {heroConfig.secondaryCta.label}
            </Link>
          </div>
        </div>
      </div>

      <FeatureRail />
      <MarketTape />
    </section>
  );
}