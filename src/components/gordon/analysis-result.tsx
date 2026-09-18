"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, Copy, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ReportContent } from "@/components/gordon/report-content";
import type { GordonReport } from "@/types/gordon";

export function AnalysisResult({ analysis, onReset }: { analysis: GordonReport; onReset: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, []);

  async function copyReport() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(analysis.report);
      setCopyStatus("copied");
    } catch { setCopyStatus("failed"); }
  }

  return (
    <article className="gordon-report" aria-labelledby="gordon-report-title">
      <div className="gordon-report-topline">
        <span className="gordon-eyebrow">The tactical brief</span>
        <span className="gordon-report-confirmation"><CheckCircle2 size={15} aria-hidden="true" /> Report received</span>
      </div>
      <div className="gordon-report-header">
        <div>
          <h2 id="gordon-report-title" className="gordon-report-title" ref={heading} tabIndex={-1}>
            {analysis.ticker}<span> / GORDON</span>
          </h2>
          <p className="gordon-report-subtitle">Short-horizon analysis · Approximately 1 day–2 weeks</p>
        </div>
        <div className="gordon-report-actions">
          <Button variant="outline" size="sm" onClick={copyReport} aria-label="Copy report">
            {copyStatus === "copied" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
            {copyStatus === "copied" ? "Copied" : "Copy report"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset}><RotateCcw size={15} aria-hidden="true" /> New analysis</Button>
        </div>
      </div>
      <p className="gordon-copy-status" role="status">
        {copyStatus === "copied" ? "Report copied to clipboard." : copyStatus === "failed" ? "Copy is unavailable in this browser. You can select the report text to copy it." : ""}
      </p>
      {(analysis.generatedAt || analysis.requestId) && (
        <dl className="gordon-report-metadata">
          {analysis.generatedAt && <div><dt>Generated</dt><dd><time dateTime={analysis.generatedAt}>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(analysis.generatedAt))} UTC</time></dd></div>}
          {analysis.requestId && <div><dt>Reference</dt><dd>{analysis.requestId}</dd></div>}
        </dl>
      )}
      <ReportContent report={analysis.report} />
      <details className="gordon-original-report">
        <summary>View original report text</summary>
        <pre>{analysis.report}</pre>
      </details>
      <div className="gordon-report-footnote">
        This report reflects the data available to the analysis workflow, not a streaming quote. Check the report’s timestamps and verify prices before making a decision.
      </div>
    </article>
  );
}
