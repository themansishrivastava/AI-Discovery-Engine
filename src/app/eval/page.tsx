"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import goldenSetData from "../../../data/golden_set.json";
import { HelperIntent } from "@/config/sipHelperConfig";
import { ArrowLeft, CheckCircle2, AlertTriangle, Play } from "lucide-react";

interface GoldenSetItem {
  id: string;
  text: string;
  expected_intent: HelperIntent;
  expected_gate: "answer" | "fallback";
  example?: boolean;
}

interface EvalRowResult extends GoldenSetItem {
  actual_intent: HelperIntent;
  actual_gate: "answer" | "fallback";
  confidence: number;
  language: string;
  intent_match: boolean;
  gate_match: boolean;
}

export default function EvalQualityPage() {
  const [results, setResults] = useState<EvalRowResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  async function runGoldenEvaluation() {
    setIsRunning(true);
    const items = goldenSetData as GoldenSetItem[];
    const evaluated: EvalRowResult[] = [];

    for (const item of items) {
      try {
        const res = await fetch("/api/helper", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: item.text }),
        });
        const data = await res.json();
        const actualIntent: HelperIntent = data?.gate_trace?.detected_intent || "unclear";
        const actualGate: "answer" | "fallback" = data?.gate_trace?.gate_decision || "fallback";
        const confidence: number = data?.gate_trace?.confidence ?? 0;
        const language: string = data?.gate_trace?.language || "en";

        evaluated.push({
          ...item,
          actual_intent: actualIntent,
          actual_gate: actualGate,
          confidence,
          language,
          intent_match: actualIntent === item.expected_intent,
          gate_match: actualGate === item.expected_gate,
        });
      } catch {
        evaluated.push({
          ...item,
          actual_intent: "unclear",
          actual_gate: "fallback",
          confidence: 0,
          language: "en",
          intent_match: item.expected_intent === "unclear",
          gate_match: item.expected_gate === "fallback",
        });
      }
    }

    setResults(evaluated);
    setIsRunning(false);
  }

  useEffect(() => {
    runGoldenEvaluation();
  }, []);

  const total = results.length;
  const intentMatches = results.filter((r) => r.intent_match).length;
  const gateMatches = results.filter((r) => r.gate_match).length;
  const intentAccuracyPct = total ? Math.round((intentMatches / total) * 100) : 0;
  const gateAccuracyPct = total ? Math.round((gateMatches / total) * 100) : 0;
  const failures = results.filter((r) => !r.intent_match || !r.gate_match);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/groww-logo.png" alt="Groww" className="w-7 h-7 rounded-full object-cover" />
            <span className="font-display font-bold text-base text-slate-900">
              How We Check Quality (/eval)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runGoldenEvaluation}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#00B386] text-white hover:bg-[#009973] disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {isRunning ? "Running Pipeline..." : "Re-run Evaluation"}
            </button>
            <Link
              href="/mvp"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to MVP (/mvp)
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-900">
          Evaluating <code>data/golden_set.json</code> through <code>/api/helper</code> (example entries marked <code>&quot;example&quot;: true</code>, including English, Hindi, and Hinglish test cases).
        </div>

        {/* Summary Scorecards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500">Overall Intent Accuracy</div>
            <div className="text-2xl font-bold text-[#00B386] mt-1">
              {intentAccuracyPct}% ({intentMatches}/{total})
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Exact match on expected_intent
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500">Gate Accuracy (Safety &amp; Fallback)</div>
            <div className="text-2xl font-bold text-[#00B386] mt-1">
              {gateAccuracyPct}% ({gateMatches}/{total})
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Advice &amp; prediction prompts declined
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500">Failures Detected</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{failures.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Items where intent or gate differed
            </div>
          </div>
        </section>

        {/* Failures Table */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h2 className="font-display font-bold text-sm text-slate-900">
            Table of Failures ({failures.length})
          </h2>
          {failures.length === 0 ? (
            <div className="text-xs text-[#00B386] bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>0 failures across all {total} golden set items.</span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 px-3">ID</th>
                    <th className="py-2 px-3">Text</th>
                    <th className="py-2 px-3">Expected Result</th>
                    <th className="py-2 px-3">Actual Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {failures.map((f) => (
                    <tr key={f.id}>
                      <td className="py-2 px-3 font-mono">{f.id}</td>
                      <td className="py-2 px-3 text-slate-700">{f.text}</td>
                      <td className="py-2 px-3">
                        {f.expected_intent} ({f.expected_gate})
                      </td>
                      <td className="py-2 px-3 text-amber-700 font-semibold">
                        {f.actual_intent} ({f.actual_gate})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* All Golden Set Items Table */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h2 className="font-display font-bold text-sm text-slate-900">
            All Golden Set Items ({total})
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Input Text</th>
                  <th className="py-2 px-3">Lang</th>
                  <th className="py-2 px-3">Expected (Intent / Gate)</th>
                  <th className="py-2 px-3">Actual (Intent / Gate)</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r) => {
                  const ok = r.intent_match && r.gate_match;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-medium">
                        {r.id}
                        {r.example && (
                          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                            example
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-700">{r.text}</td>
                      <td className="py-2 px-3 font-mono uppercase">{r.language}</td>
                      <td className="py-2 px-3">
                        <span className="font-medium">{r.expected_intent}</span> /{" "}
                        <span className="font-mono text-slate-500">{r.expected_gate}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-medium">{r.actual_intent}</span> /{" "}
                        <span className="font-mono text-slate-500">{r.actual_gate}</span>
                      </td>
                      <td className="py-2 px-3 font-semibold">
                        {ok ? (
                          <span className="text-[#00B386] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                          </span>
                        ) : (
                          <span className="text-amber-700 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Mismatch
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
      </main>
    </div>
  );
}
