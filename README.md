# WallStreetFatCats — Homepage and GORDON

The original homepage is preserved. The complete public GORDON page is at `/gordon`, with a same-origin `/api/gordon` route that forwards normalized ticker requests to n8n. No Python calculations or credentials are shipped to the browser.

Read **[docs/GORDON.md](docs/GORDON.md)** for exact environment variables, request/response contracts, n8n configuration, launch security requirements, and the live integration test. Read **[docs/GORDON-VERIFICATION.md](docs/GORDON-VERIFICATION.md)** for checks performed and checks still blocked. **[docs/GORDON-CHANGES.md](docs/GORDON-CHANGES.md)** lists every changed file.

Use `npm ci` for a clean installation from the unchanged lockfile. Do not reuse the original ZIP's Windows `node_modules` on another platform. The website implementation is delivered, but neither a successful production build in this environment nor a live n8n round trip is claimed.

`src/` contains the current implementation. `ALL_CODE.md` is a historical homepage snapshot, not the current source of truth. The original documentation below is retained as context; the actual supplied art is `public/images/home/frenzied-cat-traders.png`, not the historical `.webp` filename.

---

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

