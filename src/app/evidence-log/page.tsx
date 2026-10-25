"use client";

import React, { useState } from "react";
import { SEED_EVIDENCE, JOURNEY_STAGE_LABELS } from "@/data/seedData";
import { Copy, Check, ArrowLeft, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import Link from "next/link";

export default function StandaloneEvidenceLogPage() {
  const [copied, setCopied] = useState(false);

  const golden = SEED_EVIDENCE.filter((i) => i.isGoldenSet);
  const matches = golden.filter(
    (i) => i.aiTheme === i.humanGoldenTheme && i.pmOverrideStatus !== "rejected"
  );
  const overrides = SEED_EVIDENCE.filter(
    (i) => i.pmOverrideStatus === "corrected" || i.pmOverrideStatus === "rejected"
  );

  // Source counts across both seed + live collected CSV (24 curated + 63 scraped = 87 total)
  const sourceSummary = [
    { source: "Google Play Store Reviews (Groww Direct Dump: 1,472 scanned → 150 SIP/MF items)", count: 154, method: "Direct Groww Play Store review dump (`google_logo Play.md`) + 1–3 star SIP reviews" },
    { source: "Apple App Store Reviews (Groww, ET Money, Kuvera, MFCentral)", count: 48, method: "iTunes India Public RSS JSON API" },
    { source: "TradingQ&A (Zerodha Investing Forum)", count: 21, method: "Discourse Public Search JSON API (`SIP stopped`, `SIP pause`)" },
    { source: "Reddit Indian Investing Communities (r/MutualFundsIndia, r/IndiaInvestments, r/personalfinanceindia, r/developersIndia, r/AskIndia)", count: 8, method: "Public Reddit threads on early SIP pauses & portfolio reviews" },
    { source: "Quora (India SIP & Groww Q&A Threads)", count: 3, method: "Public Quora threads on ₹1L e-mandate fear, ECS bounce charges & falling NAV" },
    { source: "Moneycontrol (MF Help, Personal Finance & MMB Forum)", count: 3, method: "Public Moneycontrol SIP modification, 10–15d pause lead time & 3-bounce cancellation data" },
    { source: "YouTube Comments (Personal Finance Creators — Hindi & English)", count: 3, method: "Public comments on beginner SIP & market dip videos" },
    { source: "ConsumerComplaints.in / SEBI SCORES Context", count: 1, method: "Public SIP allotment & KYC hold complaint threads" },
  ];

  const totalAnalysed = sourceSummary.reduce((acc, s) => acc + s.count, 0);

  function handleCopyText() {
    const el = document.getElementById("evidence-doc-content");
    if (!el) return;
    navigator.clipboard.writeText(el.innerText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to AI Discovery Engine
          </Link>

          <button
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00B386] text-white hover:bg-[#009973] transition shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied for Google Docs!" : "Copy Document"}
          </button>
        </div>

        {/* Clean Document Surface */}
        <article
          id="evidence-doc-content"
          className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8 text-slate-800"
        >
          <header className="border-b border-slate-200 pb-5">
            <div className="text-xs font-mono uppercase tracking-wider text-[#00B386] font-semibold">
              Deliverable Document • Public View Access
            </div>
            <h1 className="font-display font-bold text-2xl text-slate-900 mt-1">
              AI Evidence Log — Groww SIP Discovery Engine
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Validation of AI-powered user feedback analysis for 12-month SIP continuation among first-time mutual fund investors.
            </p>
          </header>

          {/* SECTION 1: SOURCES AND VOLUME */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-base text-slate-900">
              1. Sources and Volume Analysed
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              The discovery engine analysed <strong>{totalAnalysed} public items</strong> across 6 source categories (24 deep-labelled benchmark items across all channels + 63 verbatim scraped items from Apple App Store India RSS and TradingQ&amp;A APIs), supplemented by AMFI monthly SIP stoppage data and SEBI SCORES categories. All usernames, emails, PANs, and folio IDs were stripped before analysis.
            </p>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-4">Public Source</th>
                    <th className="py-2.5 px-4">Volume Analysed</th>
                    <th className="py-2.5 px-4">Collection Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sourceSummary.map((row) => (
                    <tr key={row.source}>
                      <td className="py-2.5 px-4 font-medium text-slate-900">{row.source}</td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-[#00B386]">{row.count}</td>
                      <td className="py-2.5 px-4 text-slate-600">{row.method}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-semibold">
                    <td className="py-2.5 px-4 text-slate-900">Total Analysed</td>
                    <td className="py-2.5 px-4 font-mono text-slate-900">{totalAnalysed} items</td>
                    <td className="py-2.5 px-4 text-slate-500">+ AMFI / SEBI macro benchmarks</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 2: 20-ITEM GOLDEN SET */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-base text-slate-900">
              2. Golden Set of 20 Hand-Labelled Items (Agreement &amp; Failure Modes)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-slate-500">Golden Set Size</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{golden.length} items</div>
                <div className="text-[11px] text-slate-500">Labelled by hand before AI run</div>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3">
                <div className="text-emerald-800">Engine Agreement Rate</div>
                <div className="text-lg font-bold text-[#00B386] mt-0.5">
                  {Math.round((matches.length / golden.length) * 100)}% ({matches.length}/{golden.length})
                </div>
                <div className="text-[11px] text-emerald-700">Exact theme match with hand label</div>
              </div>
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3">
                <div className="text-amber-900">Disagreements / Failures</div>
                <div className="text-lg font-bold text-amber-700 mt-0.5">
                  15% ({golden.length - matches.length}/{golden.length})
                </div>
                <div className="text-[11px] text-amber-800">2 corrected + 1 rejected as noise</div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1.5">
              <div className="font-semibold text-slate-900">Where the Engine Failed:</div>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>
                  <strong>Symptom vs. Root Cause Confusion (`EV-003`):</strong> When a user mentioned both &ldquo;Autopay failed&rdquo; and &ldquo;salary delayed to 10th + 3-day pause cutoff + ₹295 bank NACH bounce fee&rdquo;, the engine tagged the surface keyword (<em>Autopay &amp; Mandate Friction</em>) instead of the underlying behavioural cause (<em>Rigid Cash-Flow / No Flexible Skip</em>).
                </li>
                <li>
                  <strong>Mental-Model Mismatch vs. Operational Block (`EV-011`):</strong> When a 6-month investor complained about 1% exit load and 20% STCG tax while trying to withdraw for a bike, the engine tagged <em>KYC / Bank Operational Block</em> instead of recognizing that the user treated an Equity SIP like a short-term bank Recurring Deposit (<em>Early Expectations Gap</em>).
                </li>
                <li>
                  <strong>Product Surface Bleed (`EV-015`):</strong> On app stores, Groww reviews mix F&amp;O intraday complaints with Mutual Fund SIP reviews. The AI initially mapped an F&amp;O loss review to <em>Market Dip Panic</em> before our human review rejected it as out-of-scope noise.
                </li>
              </ul>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2 px-3">ID</th>
                    <th className="py-2 px-3">Source</th>
                    <th className="py-2 px-3">Comment Snippet</th>
                    <th className="py-2 px-3">Hand Label (PM)</th>
                    <th className="py-2 px-3">AI Engine Output</th>
                    <th className="py-2 px-3">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {golden.map((g) => {
                    const agreed =
                      g.aiTheme === g.humanGoldenTheme && g.pmOverrideStatus !== "rejected";
                    return (
                      <tr key={g.id}>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-700">{g.id}</td>
                        <td className="py-2 px-3 text-slate-600">{g.source}</td>
                        <td className="py-2 px-3 text-slate-600 max-w-xs truncate" title={g.text}>
                          &ldquo;{g.text.slice(0, 75)}...&rdquo;
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900">
                          {g.pmOverrideStatus === "rejected"
                            ? "Out-of-Scope Noise (F&O Trading)"
                            : g.pmOverrideTheme || g.humanGoldenTheme}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{g.aiTheme}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {g.pmOverrideStatus === "rejected" ? (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                              <XCircle className="w-3.5 h-3.5" /> Rejected
                            </span>
                          ) : agreed ? (
                            <span className="inline-flex items-center gap-1 text-[#00B386] font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Match
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5" /> Disagreed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 3: 3 PLACES WHERE AI OUTPUT WAS REJECTED OR CORRECTED */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-base text-slate-900">
              3. Places Where AI Output Was Rejected or Corrected (and Why)
            </h2>

            <div className="space-y-3">
              {overrides.map((o, idx) => (
                <div
                  key={o.id}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-slate-900">
                      Case #{idx + 1}: {o.id} ({o.source})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-semibold uppercase text-[11px] ${
                        o.pmOverrideStatus === "rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      PM {o.pmOverrideStatus}
                    </span>
                  </div>

                  <p className="text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
                    &ldquo;{o.text}&rdquo;
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">
                        AI Original Output
                      </span>
                      <span className="font-medium text-slate-700">
                        {o.aiTheme} ({JOURNEY_STAGE_LABELS[o.aiStage].months})
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">
                        PM Decision
                      </span>
                      <span className="font-semibold text-slate-900">
                        {o.pmOverrideStatus === "rejected"
                          ? "Rejected from SIP dataset (Out-of-scope F&O trader review)"
                          : `${o.pmOverrideTheme} (${
                              o.pmOverrideStage ? JOURNEY_STAGE_LABELS[o.pmOverrideStage].months : ""
                            })`}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-800 pt-1">
                    <strong>Why:</strong> {o.pmOverrideReason}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
