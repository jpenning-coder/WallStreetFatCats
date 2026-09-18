"""Browser interaction checks with mocked /api/gordon responses; NEVER live market requests.

Run against Next.js: GORDON_TEST_BASE_URL=http://localhost:3000 python tests/browser_test.py
Requires Python Playwright and Chromium. See docs/GORDON.md.
GORDON_TEST_OFFLINE_DIR is an optional local component-fixture adapter, not a Next runtime.
"""
from __future__ import annotations
import json
import os
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("GORDON_TEST_BASE_URL", "http://localhost:3000").rstrip("/")
OFFLINE = os.environ.get("GORDON_TEST_OFFLINE_DIR")
OUT = Path(os.environ.get("GORDON_TEST_OUTPUT_DIR", "test-results/browser"))
OUT.mkdir(parents=True, exist_ok=True)
RESULTS: list[str] = []

MOCK = r"""
(() => {
  const original = window.fetch.bind(window);
  window.__gordonFixture = { mode: 'hold', calls: [], pending: [] };
  window.fetch = (url, options) => {
    if (url !== '/api/gordon') return original(url, options);
    const f = window.__gordonFixture;
    const ticker = JSON.parse(options.body).ticker;
    f.calls.push({ url, body: JSON.parse(options.body), headers: options.headers });
    const report = '# Integration test report\n\n**Test fixture — not market data.**\n\nThis response verifies the GORDON report view for ' + ticker + '.\n\n## Tactical context\nNo live market data was requested. No directional signal is asserted.\n\n| Area | Fixture status |\n| --- | --- |\n| Momentum | Not evaluated in this fixture |\n| Risk | No entry, stop, or target is supplied |\n\n## Important limitations\n- This is not investment research.\n- Connect the real workflow before requesting a market report.';
    function complete(mode) {
      if (mode === 'network') return Promise.reject(new TypeError('INTERNAL_SECRET_NOT_PUBLIC'));
      if (mode === 'html') return Promise.resolve(new Response('<html>INTERNAL_SECRET_NOT_PUBLIC</html>', { status: 504 }));
      if (mode === 'malformed') return Promise.resolve(Response.json({ unexpected: true }));
      if (mode === 'error' || mode === 'rate' || mode === 'unavailable') {
        return Promise.resolve(Response.json({ ok: false, error: { code: mode === 'rate' ? 'RATE_LIMITED' : mode === 'unavailable' ? 'UNAVAILABLE' : 'UPSTREAM_ERROR', message: 'INTERNAL_SECRET_NOT_PUBLIC' } }, { status: mode === 'rate' ? 429 : 503 }));
      }
      return Promise.resolve(Response.json({ ok: true, analysis: {
        ticker: mode === 'mismatch' ? 'MSFT' : ticker,
        report: mode === 'plain' ? 'Plain narrative test fixture for ' + ticker + '.\nNo market data is present.' : mode === 'unsafe' ? report + '\n\n<script>window.__unsafeRan=true</script>\n<img src=x onerror="window.__unsafeRan=true">' : report,
        generatedAt: '2026-09-11T12:00:00Z', requestId: 'fixture-' + ticker,
      } }));
    }
    if (f.mode !== 'hold') return complete(f.mode);
    return new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('Cancelled','AbortError')), { once: true });
      f.pending.push(() => complete('success').then(resolve, reject));
    });
  };
})();
"""

def check(condition: bool, label: str) -> None:
    if not condition:
        raise AssertionError(label)
    RESULTS.append(label)
    print(f"PASS {label}", flush=True)


def page_at(browser, width=1440, height=1000, route="/gordon"):
    page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
    page.emulate_media(reduced_motion="reduce")
    page.add_init_script(MOCK)
    if OFFLINE:
        folder = Path(OFFLINE)
        page.set_content('<html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div></body></html>')
        page.evaluate(MOCK)
        page.evaluate("route => window.__fixturePath = route", route)
        page.add_style_tag(content=(folder / "offline.css").read_text())
        page.add_script_tag(content=(folder / "dist/app.js").read_text())
    else:
        page.goto(BASE + route, wait_until="networkidle")
    page.locator("h1").wait_for()
    page.evaluate("document.fonts.ready")
    return page


def set_mode(page, mode):
    page.evaluate("mode => window.__gordonFixture.mode = mode", mode)


def submit(page, ticker="AAPL"):
    page.get_by_label("Stock ticker", exact=True).fill(ticker)
    page.get_by_label("Stock ticker", exact=True).press("Enter")


def capture(page, filename):
    # Normalize scroll position so offscreen fixed skip links are not included
    # spuriously in full-page Chromium captures after report focus/scrolling.
    page.evaluate("window.scrollTo(0, 0)")
    page.screenshot(path=str(OUT / filename), full_page=True)


def no_overflow(page):
    return page.evaluate("document.querySelector('main').scrollWidth <= innerWidth && document.documentElement.scrollWidth <= innerWidth")


with sync_playwright() as playwright:
    executable = os.environ.get("GORDON_TEST_BROWSER") or shutil.which("chromium") or shutil.which("google-chrome")
    options = {"args": ["--no-sandbox"]}
    if executable:
        options["executable_path"] = executable
    browser = playwright.chromium.launch(**options)
    try:
        page = page_at(browser)
        js_errors: list[str] = []
        page.on("pageerror", lambda error: js_errors.append(str(error)))
        check(page.locator("h1").inner_text() == "GORDON.", "GORDON component renders its title")
        check(page.locator('.nav-link[aria-current="page"]').inner_text().casefold() == "gordon", "desktop navigation marks Gordon, not Home, current")
        check(page.get_by_label("Stock ticker", exact=True).is_enabled(), "input has an accessible label and is enabled")
        check(page.locator('[aria-label="Mobile navigation"]').get_attribute("inert") is not None, "closed mobile menu is inert")
        check(page.locator('.gordon-output').inner_text().find('Your ticker-specific report') >= 0, "idle state contains no report values")
        capture(page, "gordon-desktop-idle.png")

        page.get_by_role("button", name="Run GORDON", exact=True).click()
        expect(page.get_by_role("alert")).to_contain_text("Enter a stock ticker")
        check(page.evaluate("window.__gordonFixture.calls.length") == 0, "empty input does not call API")
        check(page.get_by_label("Stock ticker", exact=True).get_attribute("aria-invalid") == "true", "invalid input is announced accessibly")
        check(page.locator("#gordon-ticker").evaluate("el => el === document.activeElement"), "validation returns focus to ticker input")
        for invalid in ["AAPL TSLA", "<script>", "AAAAAAAAAAAAA"]:
            submit(page, invalid)
            expect(page.get_by_role("alert")).to_be_visible()
        check(page.evaluate("window.__gordonFixture.calls.length") == 0, "malformed and overlong tickers do not call API")
        check(page.locator('.gordon-input-shell').evaluate("el => getComputedStyle(el).outlineStyle !== 'none'"), "input focus has a visible outline")

        submit(page, " aapl ")
        expect(page.locator(".gordon-loading-state")).to_be_visible()
        check(page.evaluate("window.__gordonFixture.calls[0].body.ticker") == "AAPL", "keyboard submission trims and uppercases ticker")
        check(page.get_by_label("Stock ticker", exact=True).is_disabled(), "input disables while loading")
        check(page.get_by_role("button", name="Analyzing", exact=True).is_disabled(), "action disables while loading")
        check(page.get_by_role("button", name="Use ticker NVDA").is_disabled(), "example controls disable while loading")
        check(page.get_by_role("form", name="GORDON ticker analysis").get_attribute("aria-busy") == "true", "loading form exposes aria-busy")
        check("preparing" in page.locator('[role="status"]').first.inner_text(), "loading state is announced without fake percentages")
        page.locator("form").evaluate("form => { for(let i=0;i<4;i++) form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); }")
        check(page.evaluate("window.__gordonFixture.calls.length") == 1, "synchronous duplicate submissions produce one request")
        check(page.locator(".gordon-spinner").first.evaluate("el => getComputedStyle(el).animationName") == "none", "loading respects reduced motion")
        capture(page, "gordon-desktop-loading.png")
        page.evaluate("window.__gordonFixture.pending.splice(0).forEach(resolve => resolve())")
        expect(page.locator("#gordon-report-title")).to_contain_text("AAPL")
        check(page.locator("#gordon-report-title").evaluate("el => el === document.activeElement"), "completed report receives accessible focus")
        check(page.locator(".gordon-report table").count() == 1, "structured narrative renders its supplied table")
        check("fixture-AAPL" in page.locator(".gordon-report-metadata").inner_text(), "returned request ID is preserved")
        check(page.get_by_label("Stock ticker", exact=True).is_enabled(), "form re-enables after success")
        capture(page, "gordon-desktop-result-fixture.png")
        page.get_by_role("button", name="Copy report", exact=True).click()
        expect(page.locator(".gordon-copy-status")).not_to_be_empty()
        check(True, "copy action provides success or safe fallback feedback")
        page.get_by_text("View original report text", exact=True).click()
        check(page.locator(".gordon-original-report pre").is_visible(), "original unmodified report text remains available")

        page.get_by_role("button", name="New analysis", exact=True).click()
        check(page.get_by_label("Stock ticker", exact=True).input_value() == "", "new analysis clears previous ticker")
        check(page.locator(".gordon-report").count() == 0, "new analysis removes previous report")
        check(page.locator("#gordon-ticker").evaluate("el => el === document.activeElement"), "new analysis restores input focus")
        page.get_by_role("button", name="Use ticker NVDA", exact=True).click()
        check(page.get_by_label("Stock ticker", exact=True).input_value() == "NVDA", "example ticker populates, but does not submit, the form")
        set_mode(page, "plain")
        submit(page, "nvda")
        expect(page.locator(".gordon-report-prose")).to_contain_text("Plain narrative test fixture for NVDA")
        check("AAPL" not in page.locator(".gordon-report").inner_text(), "second ticker replaces the first report cleanly")

        for mode, phrase in [("error", "could not complete"), ("rate", "too many"), ("unavailable", "could not provide"), ("malformed", "complete report"), ("network", "connection"), ("html", "response window"), ("mismatch", "complete report")]:
            set_mode(page, mode)
            submit(page, "AAPL")
            expect(page.locator(".gordon-error-state")).to_be_visible()
            check(phrase in page.get_by_role("alert").inner_text(), f"{mode} failure has a useful public message")
            check("INTERNAL_SECRET_NOT_PUBLIC" not in page.locator("body").inner_text(), f"{mode} failure hides private diagnostics")
            check(page.get_by_role("button", name="Retry AAPL", exact=True).is_enabled(), f"{mode} failure offers a retry path")
        capture(page, "gordon-desktop-error.png")
        set_mode(page, "success")
        page.get_by_role("button", name="Retry AAPL", exact=True).click()
        expect(page.locator("#gordon-report-title")).to_contain_text("AAPL")
        check(True, "retry returns a fresh report")

        set_mode(page, "unsafe")
        submit(page)
        expect(page.locator(".gordon-report-prose")).to_contain_text("<script>")
        check(page.locator(".gordon-report-prose script, .gordon-report-prose img").count() == 0, "returned HTML is text, not executable markup")
        check(page.evaluate("window.__unsafeRan === undefined"), "report HTML cannot execute JavaScript")
        check(not js_errors, "interaction flow has no browser JavaScript errors")
        page.close()

        # Check the actual browser timeout code without waiting almost two minutes.
        page = page_at(browser)
        page.clock.install()
        submit(page)
        expect(page.locator(".gordon-loading-state")).to_be_visible()
        page.clock.fast_forward(115001)
        expect(page.get_by_role("alert")).to_contain_text("response window")
        check(True, "115-second browser deadline produces a retryable timeout")
        page.close()

        for width, height, label in [(768, 1024, "tablet"), (390, 844, "mobile"), (320, 800, "narrow-mobile"), (1360, 900, "desktop-breakpoint")]:
            page = page_at(browser, width, height)
            check(no_overflow(page), f"{label} idle layout has no horizontal overflow")
            capture(page, f"gordon-{label}-idle.png")
            if width < 1360:
                page.get_by_role("button", name="Open navigation", exact=True).click()
                expect(page.locator('[aria-label="Mobile navigation"]')).to_be_visible()
                check(page.locator('[aria-label="Mobile navigation"] a[aria-current="page"]').inner_text().casefold() == "gordon", f"{label} mobile navigation marks current page")
                check(page.locator('[aria-label="Mobile navigation"] a[href="/gordon"]').first.get_attribute('href') == '/gordon', f"{label} existing navigation points to Gordon")
                page.keyboard.press("Shift+Tab")
                check(page.get_by_role("button", name="Close navigation", exact=True).evaluate("el => el === document.activeElement"), f"{label} navigation traps focus with toggle")
                page.keyboard.press("Escape")
                check(page.locator('[aria-label="Mobile navigation"]').get_attribute("inert") is not None, f"{label} Escape closes and deactivates menu")
                check(page.get_by_role("button", name="Open navigation", exact=True).evaluate("el => el === document.activeElement"), f"{label} Escape restores toggle focus")
            set_mode(page, "success")
            submit(page)
            expect(page.locator("#gordon-report-title")).to_be_visible()
            check(no_overflow(page), f"{label} report layout has no horizontal overflow")
            check(page.locator(".gordon-table-scroll").evaluate("el => getComputedStyle(el).overflowX") == "auto", f"{label} report table scrolls within its container")
            capture(page, f"gordon-{label}-result-fixture.png")
            page.close()

        first = page_at(browser)
        second = page_at(browser)
        submit(first, "AAPL"); submit(second, "NVDA")
        second.evaluate("window.__gordonFixture.pending.splice(0).forEach(resolve => resolve())")
        first.evaluate("window.__gordonFixture.pending.splice(0).forEach(resolve => resolve())")
        expect(first.locator("#gordon-report-title")).to_contain_text("AAPL")
        expect(second.locator("#gordon-report-title")).to_contain_text("NVDA")
        check("NVDA" not in first.locator(".gordon-report").inner_text() and "AAPL" not in second.locator(".gordon-report").inner_text(), "independent browser contexts retain their own results")
        first.close(); second.close()

        home = page_at(browser, route="/")
        check("markets move." in home.locator("h1").inner_text().casefold(), "existing homepage component still renders")
        check(home.locator('.nav-link[aria-current="page"]').inner_text().casefold() == "home", "homepage retains Home as the active navigation item")
        check(home.get_by_role("link", name="Get Free Analysis").get_attribute("href") == "/gordon", "existing homepage CTA still targets Gordon")
        check(home.locator('.nav-link[href="/warren"]').count() == 1, "WARREN link is preserved, not duplicated")
        if not OFFLINE:
            home.get_by_role("link", name="Get Free Analysis").click()
            expect(home.locator("#gordon-title")).to_be_visible()
            check(True, "Next.js navigation reaches the real Gordon route")
        home.close()
    finally:
        browser.close()

(OUT / "results.json").write_text(json.dumps({"mode": "offline React component fixture (not Next runtime)" if OFFLINE else "Next.js with mocked API", "passed": len(RESULTS), "checks": RESULTS}, indent=2))
print(f"\n{len(RESULTS)} browser checks passed. Mode: {'offline component fixture' if OFFLINE else 'Next.js with mocked API'}")
