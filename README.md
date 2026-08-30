# WallStreetFatCats Homepage

Production-oriented Next.js implementation of the supplied WallStreetFatCats homepage composition.

## Included

* Next.js App Router
* TypeScript with strict checking
* Tailwind CSS v4
* shadcn/ui-compatible project configuration and reusable button primitive
* Responsive desktop, tablet, and mobile navigation
* Cinematic hero artwork and live HTML copy/controls
* Reusable feature-card rail
* Accessible static presentation market tape
* Metadata, Open Graph configuration, favicon, focus states, and reduced-motion handling

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production checks

```bash
npm run typecheck
npm run lint
npm run build
npm run start
```

## Important implementation note

The supplied reference was a flattened composition containing baked-in navigation, copy, controls, feature cards, and market values. The project crops the trading-floor portion and uses layered cinematic scrims to suppress the baked copy while rebuilding every interactive interface element as accessible HTML.

For the final production launch, replace `public/images/home/hero-trading-floor.webp` with a clean, high-resolution artwork master containing no baked interface text.

The market tape in `src/config/homepage.ts` is static presentation data because backend and market API work are explicitly outside this homepage milestone. It is labeled accordingly for assistive technology. Replace it only when a later backend milestone is authorized.

