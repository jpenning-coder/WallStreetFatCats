# GORDON — change manifest

All paths are relative to the **existing** project root. No original files are deleted. Dependency versions and `package-lock.json` are unchanged. No second app root, static replica, Python code, or n8n workflow was created.

## New production files

| File | Purpose |
| --- | --- |
| `src/app/gordon/page.tsx` | Existing `/gordon` destination: branded introduction, shared header, analysis workspace, mandate, risk disclosure and metadata. |
| `src/app/gordon/gordon.css` | Scoped responsive page and report styles using existing design tokens and fonts. |
| `src/app/api/gordon/route.ts` | Thin same-origin POST route: bounded request parsing, ticker validation, private upstream request, no-store envelopes and safe errors. |
| `src/components/gordon/analysis-workspace.tsx` | Accessible form, validation, per-instance single-flight lifecycle, idle/loading/error/result states, retry and reset. |
| `src/components/gordon/analysis-result.tsx` | Completed report header, optional real metadata, focus transfer, copy and new-analysis controls. |
| `src/components/gordon/report-content.tsx` | Safe text-only Markdown subset and tables; no HTML execution or calculated market fields. |
| `src/types/gordon.ts` | Explicit request, report, final webhook compatibility and website response types. |
| `src/lib/gordon/ticker.ts` | Shared format validation and trim/uppercase normalization. |
| `src/lib/gordon/errors.ts` | Public allowlisted error codes/messages and HTTP status mappings. |
| `src/lib/gordon/contract.ts` | Isolated defensive parsing of final narrative/JSON reports and optional metadata. |
| `src/lib/gordon/read-body.ts` | Bounded UTF-8 stream reading with cancellation. |
| `src/lib/gordon/config.server.ts` | Private endpoint, optional Header Auth key and timeout configuration. |
| `src/lib/gordon/upstream.server.ts` | Server-only n8n request, timeout, no redirects/retries, response normalization. |
| `src/lib/gordon/request.ts` | Browser-to-same-origin API helper, cancellation, deadline and safe response checks. |

## New verification and documentation files

| File | Purpose |
| --- | --- |
| `tests/gordon.test.cjs` | Ticker/parser/config/route/client helper/error/timeout/isolation tests. |
| `tests/render.test.cjs` | Safe report-rendering and data-preservation tests. |
| `tests/security.test.cjs` | Client import boundary, server-only and private-config checks. |
| `tests/support/load-source.cjs` | Test-only TypeScript loader using the already-installed TypeScript package. |
| `tests/browser_test.py` | Reusable Playwright UI checks with explicit non-market fixtures; default target is a running Next server. |
| `docs/GORDON.md` | Architecture, exact configuration/contracts, n8n settings, launch security and live test guide. |
| `docs/GORDON-VERIFICATION.md` | Test results and precise runtime/build/live-integration limitations. |
| `docs/GORDON-CHANGES.md` | This manifest. |

## Modified original files

| File | Change |
| --- | --- |
| `.env.example` | Retains the existing public canonical origin; adds blank private webhook/key placeholders and timeout documentation. |
| `.gitignore` | Retains existing exclusions; adds test output, TypeScript build info and Python test-environment/cache exclusions. |
| `package.json` | Adds `npm test` only. No dependencies changed or added. |
| `eslint.config.mjs` | Allows CommonJS require only in `tests/**/*.cjs`; keeps existing Next lint rules. |
| `src/components/layout/site-header.tsx` | Accepts a current path so Gordon is marked active; reuses the existing links, logo, layout and actions. |
| `src/components/layout/mobile-menu.tsx` | Same current-path support plus focus/Escape/closed-menu behavior and existing-header-token positioning. |
| `src/components/ui/button.tsx` | Extends existing button props to accept a React 19 ref for the menu toggle. Styling and variants unchanged. |
| `README.md` | Adds GORDON and verification links, clean-install guidance and a historical-documentation note. Original homepage documentation retained. |
| `ALL_CODE.md` | Adds a historical-snapshot warning directing readers to current source; does not replace the original snapshot. |

## Applying the handoff

`gordon.patch` is a git-format patch against the supplied clean source. Use it from the existing project root on a working branch:

```bash
git apply --check /path/to/gordon.patch
git apply /path/to/gordon.patch
```

The changed-files ZIP is an alternative overlay of the same new/modified files. The complete-source ZIP is the cleaned uploaded project plus those changes, not a replacement for any additional unprovided production pages. Do not apply both overlay and patch twice. Review conflicts rather than forcing an overwrite if the repository has evolved.

No archive includes `.git`, `node_modules`, `.next`, real `.env` values, generated TypeScript caches, or font files. Install dependencies normally from the retained lockfile.
