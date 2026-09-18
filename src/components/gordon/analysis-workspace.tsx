"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, ArrowRight, FileText, LoaderCircle, Search, ShieldCheck, TrendingUp } from "lucide-react";

import { AnalysisResult } from "@/components/gordon/analysis-result";
import { Button } from "@/components/ui/button";
import { GordonError } from "@/lib/gordon/errors";
import { requestGordonAnalysis } from "@/lib/gordon/request";
import { MAX_TICKER_LENGTH, normalizeTicker } from "@/lib/gordon/ticker";
import type { GordonReport } from "@/types/gordon";

type AnalysisState =
  | { status: "idle" }
  | { status: "loading"; ticker: string }
  | { status: "success"; analysis: GordonReport }
  | { status: "error"; ticker: string; error: GordonError };

export function AnalysisWorkspace() {
  const [ticker, setTicker] = useState("");
  const [inputError, setInputError] = useState("");
  const [state, setState] = useState<AnalysisState>({ status: "idle" });
  const input = useRef<HTMLInputElement>(null);
  // A synchronous guard also blocks two clicks before React has re-rendered.
  const activeRequest = useRef<AbortController | null>(null);
  const busy = state.status === "loading";

  useEffect(() => () => { activeRequest.current?.abort(); }, []);

  async function analyze(rawTicker: string) {
    if (activeRequest.current) return;
    const normalized = normalizeTicker(rawTicker);
    if (!normalized) {
      setInputError(rawTicker.trim() ? "Use a stock ticker of up to 12 characters, such as AAPL or BRK.B. Do not enter a company name." : "Enter a stock ticker to begin.");
      input.current?.focus();
      return;
    }
    setTicker(normalized);
    setInputError("");
    const controller = new AbortController();
    activeRequest.current = controller;
    setState({ status: "loading", ticker: normalized });
    try {
      const analysis = await requestGordonAnalysis(normalized, controller.signal);
      if (!controller.signal.aborted && activeRequest.current === controller) {
        setState({ status: "success", analysis });
      }
    } catch (error) {
      if (!controller.signal.aborted && activeRequest.current === controller) {
        setState({ status: "error", ticker: normalized, error: error instanceof GordonError ? error : new GordonError("NETWORK_ERROR") });
      }
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void analyze(ticker);
  }

  function reset() {
    if (activeRequest.current) return;
    setState({ status: "idle" });
    setTicker("");
    setInputError("");
    input.current?.focus();
  }

  const announcement = state.status === "loading"
    ? `GORDON is preparing the ${state.ticker} report. Please keep this page open.`
    : state.status === "success" ? `${state.analysis.ticker} report received.` : "";

  return (
    <section className="gordon-workspace" aria-labelledby="gordon-workspace-title">
      <div className="gordon-request-panel">
        <div className="gordon-request-heading">
          <div>
            <p className="gordon-eyebrow">Your next move starts with context</p>
            <h2 id="gordon-workspace-title">Put a ticker on the desk.</h2>
          </div>
          <p className="gordon-private-note"><ShieldCheck size={17} aria-hidden="true" /> Analysis only. No trades.</p>
        </div>
        <form onSubmit={submit} noValidate aria-label="GORDON ticker analysis" aria-busy={busy}>
          <label className="gordon-input-label" htmlFor="gordon-ticker">Stock ticker</label>
          <div className="gordon-input-row">
            <div className={`gordon-input-shell${inputError ? " gordon-input-invalid" : ""}`}>
              <Search size={21} aria-hidden="true" />
              <input
                id="gordon-ticker"
                name="ticker"
                type="text"
                ref={input}
                value={ticker}
                onChange={(event) => { setTicker(event.target.value.toUpperCase()); setInputError(""); }}
                onBlur={() => setTicker((value) => value.trim().toUpperCase())}
                placeholder="e.g. AAPL"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={MAX_TICKER_LENGTH + 8}
                required
                disabled={busy}
                aria-invalid={Boolean(inputError)}
                aria-describedby={`gordon-ticker-help${inputError ? " gordon-ticker-error" : ""}`}
              />
              <span className="gordon-input-hint" aria-hidden="true">TICKER</span>
            </div>
            <Button type="submit" size="lg" disabled={busy} className="gordon-run-button">
              {busy ? <><LoaderCircle size={18} className="gordon-spinner" aria-hidden="true" /> Analyzing</> : <>Run GORDON <ArrowRight size={18} aria-hidden="true" /></>}
            </Button>
          </div>
          <div className="gordon-form-bottom">
            <p id="gordon-ticker-help">One stock at a time. A complete report, right here.</p>
            <div className="gordon-examples" aria-label="Example tickers">
              <span>Try</span>
              {["AAPL", "NVDA", "TSLA"].map((symbol) => <button key={symbol} type="button" disabled={busy} aria-label={`Use ticker ${symbol}`} onClick={() => { setTicker(symbol); setInputError(""); input.current?.focus(); }}>{symbol}</button>)}
            </div>
          </div>
          {inputError && <p id="gordon-ticker-error" className="gordon-input-error" role="alert"><AlertCircle size={16} aria-hidden="true" /> {inputError}</p>}
        </form>
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>

      <div className="gordon-output" aria-busy={busy}>
        {state.status === "idle" && (
          <div className="gordon-empty-state">
            <div className="gordon-empty-intro"><FileText size={24} strokeWidth={1.3} aria-hidden="true" /><div><h3>A sharper read on the near term.</h3><p>Your ticker-specific report will appear here once the analysis is complete.</p></div></div>
            <div className="gordon-coverage-grid">
              <div><span className="gordon-coverage-number" aria-hidden="true">01</span><h4>Read the setup</h4><p>Momentum, trend structure, volume, and tactical signals.</p></div>
              <div><span className="gordon-coverage-number" aria-hidden="true">02</span><h4>Weigh the context</h4><p>Recent news alongside the quantitative analysis.</p></div>
              <div><span className="gordon-coverage-number" aria-hidden="true">03</span><h4>Respect the risk</h4><p>Invalidation and levels only where the analysis supports them.</p></div>
            </div>
          </div>
        )}
        {state.status === "loading" && (
          <div className="gordon-loading-state">
            <div className="gordon-loading-symbol" aria-hidden="true"><LoaderCircle size={35} strokeWidth={1.2} className="gordon-spinner" /></div>
            <p className="gordon-eyebrow">Analysis in progress</p>
            <h3>GORDON is on <span>{state.ticker}.</span></h3>
            <p>The workflow combines market analysis and recent news into your report. Keep this page open while it completes.</p>
            <div className="gordon-loading-rule" aria-hidden="true"><span /></div>
            <p className="gordon-loading-note">Your report will appear here. No need to submit again.</p>
          </div>
        )}
        {state.status === "error" && (
          <div className="gordon-error-state">
            <div role="alert">
              <AlertCircle size={27} aria-hidden="true" />
              <p className="gordon-eyebrow">{state.ticker} · Report unavailable</p>
              <h3>Let’s take another look.</h3>
              <p>{state.error.message}</p>
            </div>
            <div className="gordon-error-actions">
              <Button variant="outline" onClick={() => void analyze(state.ticker)}>Retry {state.ticker} <ArrowRight size={15} aria-hidden="true" /></Button>
              <Button variant="ghost" onClick={reset}>Use another ticker</Button>
            </div>
          </div>
        )}
        {state.status === "success" && <AnalysisResult key={state.analysis.ticker} analysis={state.analysis} onReset={reset} />}
      </div>
      <div className="gordon-method-note"><TrendingUp size={16} aria-hidden="true" /><p>Data-driven analysis. Context-aware interpretation. Not a promise of performance.</p></div>
    </section>
  );
}
