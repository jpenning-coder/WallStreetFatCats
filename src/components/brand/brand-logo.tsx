import Link from "next/link";

import { cn } from "@/lib/cn";

function LaurelLeaf({
  x,
  y,
  rotate,
}: {
  x: number;
  y: number;
  rotate: number;
}) {
  return (
    <ellipse
      cx={x}
      cy={y}
      rx="2.15"
      ry="4.6"
      transform={`rotate(${rotate} ${x} ${y})`}
      fill="currentColor"
      opacity="0.88"
    />
  );
}

function CatCrest({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className={cn("shrink-0", className)}
      fill="none"
    >
      <path
        d="M50 4.5 53.2 8 50 11.5 46.8 8 50 4.5Z"
        fill="currentColor"
      />
      <path
        d="M17.7 79.5C7.8 69.8 4.5 56.7 8.4 43.9M82.3 79.5c9.9-9.7 13.2-22.8 9.3-35.6"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.76"
      />

      <g>
        <LaurelLeaf x={12.3} y={68.4} rotate={-42} />
        <LaurelLeaf x={9.2} y={59.7} rotate={-68} />
        <LaurelLeaf x={8.8} y={50.4} rotate={-88} />
        <LaurelLeaf x={11.5} y={41.3} rotate={-108} />
        <LaurelLeaf x={16.1} y={33.4} rotate={-128} />
        <LaurelLeaf x={22.2} y={27.2} rotate={-142} />
        <LaurelLeaf x={87.7} y={68.4} rotate={42} />
        <LaurelLeaf x={90.8} y={59.7} rotate={68} />
        <LaurelLeaf x={91.2} y={50.4} rotate={88} />
        <LaurelLeaf x={88.5} y={41.3} rotate={108} />
        <LaurelLeaf x={83.9} y={33.4} rotate={128} />
        <LaurelLeaf x={77.8} y={27.2} rotate={142} />
      </g>

      <circle cx="50" cy="50" r="34.8" stroke="currentColor" strokeWidth="1.6" />
      <circle
        cx="50"
        cy="50"
        r="30.6"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.56"
      />

      <path
        d="m34.1 37.2-1.7-15.6 12.2 8.2c1.8-.55 3.6-.82 5.4-.82s3.6.27 5.4.82l12.2-8.2-1.7 15.6c3.4 3.9 5.2 8.7 5.2 13.9 0 12.1-9.4 21.6-21.1 21.6s-21.1-9.5-21.1-21.6c0-5.2 1.8-10 5.2-13.9Z"
        fill="#070907"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M34.5 34.6 42 31.2M65.5 34.6 58 31.2"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.82"
      />
      <path
        d="m38.2 45.2 6.2 1.8-5.1 3M61.8 45.2 55.6 47l5.1 3"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m46.5 55.8 3.5 2.5 3.5-2.5M50 58.3v5.1M44.1 64.1c3.8 2.6 8 2.6 11.8 0"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40.2 55.8 25.4 58M40.9 59.2 27.5 63M59.8 55.8 74.6 58M59.1 59.2 72.5 63"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.72"
      />
      <path
        d="M39.4 74.3 50 80l10.6-5.7M43.3 72.4 50 76l6.7-3.6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M30.8 81.8H69.2"
        stroke="currentColor"
        strokeWidth="1.15"
        opacity="0.85"
      />
    </svg>
  );
}

export function BrandLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="WallStreetFatCats homepage"
      className={cn(
        "group inline-flex min-w-0 items-center gap-2.5 text-wsfc-gold sm:gap-3",
        className,
      )}
    >
      <CatCrest className="size-[4.1rem] sm:size-[4.8rem] xl:size-[5.2rem]" />

      <span className="min-w-0 pt-0.5 leading-none">
        <span className="block whitespace-nowrap font-sans text-[0.62rem] font-semibold uppercase tracking-[0.52em] text-wsfc-gold-light sm:text-[0.73rem] xl:text-[0.82rem]">
          WallStreet
        </span>
        <span className="mt-0.5 block whitespace-nowrap font-display text-[2.2rem] font-bold uppercase leading-[0.82] tracking-[-0.035em] text-wsfc-gold sm:text-[2.65rem] xl:text-[3.05rem]">
          Fat Cat$
        </span>
        <span
          aria-hidden="true"
          className="mt-1 block h-px w-full bg-gradient-to-r from-wsfc-gold via-wsfc-gold/75 to-transparent"
        />
        <span className="mt-1.5 hidden whitespace-nowrap font-sans text-[0.47rem] font-semibold uppercase tracking-[0.08em] text-wsfc-gold-light/85 sm:block xl:text-[0.53rem]">
          Institutional Edge. Everyone&apos;s Access.
        </span>
      </span>
    </Link>
  );
}