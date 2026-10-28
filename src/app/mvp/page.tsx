"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  HELPER_TEMPLATES,
  HelperLang,
  TemplateOutput,
  redactPiiText,
} from "@/config/sipHelperConfig";
import { GateTrace, HelperApiResponse } from "@/app/api/helper/route";
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Globe,
  Send,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

const SAMPLE_PROMPTS = [
  "My salary is delayed to the 7th and I have extra expenses before my SIP date.",
  "My autopay failed yesterday. What should I check and how do I pay this missed instalment?",
  "I'm worried about the red return number (-2.42%) on my SIP screen.",
  "इस महीने सैलरी लेट है और खर्च ज़्यादा हैं, मैं अपनी SIP किस्त कैसे मैनेज करूं?",
];

const TRY_TO_BREAK_IT_PROMPTS = [
  "Should I switch to Bandhan Small Cap Fund?",
  "Will the market fall next week?",
  "कौन सा म्यूचुअल फंड सबसे ज़्यादा रिटर्न देगा?",
];

export default function GrowwMainMvpPage() {
  const [lang, setLang] = useState<HelperLang>("en");
  const [inputText, setInputText] = useState(SAMPLE_PROMPTS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitMsg, setRateLimitMsg] = useState<string | null>(null);

  // Phone UI state
  const [sipAmount, setSipAmount] = useState(2000);
  const [sipStatusText, setSipStatusText] = useState("Active • ₹2,000/mo");
  const [showUnitsView, setShowUnitsView] = useState(false);
  const [helperSheetOpen, setHelperSheetOpen] = useState(true);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Thumbs feedback state
  const [thumbsGiven, setThumbsGiven] = useState<"up" | "down" | null>(null);
  const [lastLoggedFeedback, setLastLoggedFeedback] = useState<string | null>(null);

  // Current gate trace + deterministic template output
  const [gateTrace, setGateTrace] = useState<GateTrace>({
    detected_intent: "tight_money",
    confidence: 0.95,
    language: "en",
    gate_decision: "answer",
    reason: "Passed safety gate for operational SIP intent (tight_money); served fixed template in EN.",
    classifier_source: "deterministic_classifier",
  });
  const [currentTemplate, setCurrentTemplate] = useState<TemplateOutput>(
    HELPER_TEMPLATES.tight_money.en
  );

  async function runHelperPipeline(textToClassify: string, langOverride?: HelperLang) {
    const activeLang = langOverride || lang;
    setInputText(textToClassify);
    setHelperSheetOpen(true);
    setThumbsGiven(null);
    setLastLoggedFeedback(null);
    setRateLimitMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToClassify,
          selectedChip: "tight_money",
          language: activeLang,
        }),
      });
      const data: HelperApiResponse = await res.json();
      if (res.status === 429 || data.rate_limited) {
        setRateLimitMsg(
          data.message ||
            "You have reached the limit of 20 requests per minute. Please wait a moment and try again."
        );
      }
      if (data.gate_trace && data.template) {
        setGateTrace(data.gate_trace);
        setCurrentTemplate(data.template);
        if (data.gate_trace.language === "hi") {
          setLang("hi");
        }
      }
    } catch {
      setGateTrace({
        detected_intent: "tight_money",
        confidence: 1,
        language: activeLang,
        gate_decision: "answer",
        reason: "Returned fixed options after fallback.",
        classifier_source: "selected_chip_fallback",
      });
      setCurrentTemplate(HELPER_TEMPLATES.tight_money[activeLang]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleLanguageChange(newLang: HelperLang) {
    setLang(newLang);
    const defaultPrompt = newLang === "hi" ? SAMPLE_PROMPTS[3] : SAMPLE_PROMPTS[0];
    runHelperPipeline(defaultPrompt, newLang);
  }

  function handleActionClick(
    actionType: "lower_amount" | "skip_one" | "keep_as_is" | "pay_one_time" | "units_view" | "official_link",
    href?: string
  ) {
    if (actionType === "lower_amount") {
      setSipAmount(500);
      setSipStatusText("Updated • ₹500 (1 Month)");
      setActionToast("Updated this month's instalment to ₹500 (verify in app).");
    } else if (actionType === "skip_one") {
      setSipStatusText("Skipped 1 Instalment");
      setActionToast(
        "Skipped 1 instalment. Note: Skipping may mean the SIP is not counted as active that month."
      );
    } else if (actionType === "keep_as_is") {
      setSipAmount(2000);
      setSipStatusText("Active • ₹2,000/mo");
      setActionToast("Kept your scheduled ₹2,000 instalment as is.");
    } else if (actionType === "pay_one_time") {
      setSipStatusText("One-time Payment Step");
      setActionToast("Opened one-time missed instalment payment step in app.");
    } else if (actionType === "units_view") {
      setShowUnitsView(true);
      setActionToast("Showing units collected (534.4 units) alongside return percentage.");
    } else if (actionType === "official_link" && href) {
      window.open(href, "_blank");
    }
  }

  async function handleThumbsFeedback(thumbs: "up" | "down") {
    setThumbsGiven(thumbs);
    const redacted = redactPiiText(inputText);
    try {
      const res = await fetch("/api/helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "feedback",
          intent: gateTrace.detected_intent,
          confidence: gateTrace.confidence,
          gate_decision: gateTrace.gate_decision,
          text: redacted,
          thumbs,
        }),
      });
      const data = await res.json();
      if (data?.logged) {
        setLastLoggedFeedback(
          `Logged: ${data.logged.thumbs} | intent=${data.logged.intent} | gate=${data.logged.gate_decision}`
        );
      }
    } catch {
      setLastLoggedFeedback(`Logged locally: ${thumbs}`);
    }
  }

  function resetDemo() {
    setLang("en");
    setSipAmount(2000);
    setSipStatusText("Active • ₹2,000/mo");
    setShowUnitsView(false);
    setHelperSheetOpen(true);
    setActionToast(null);
    runHelperPipeline(SAMPLE_PROMPTS[0], "en");
  }

  const isFallback = gateTrace.gate_decision === "fallback";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Visible Top Disclaimer Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs font-medium text-amber-950">
        This is a demo and not investment advice. Don&apos;t enter PAN, account numbers or portfolio details.
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/groww-logo.png" alt="Groww" className="w-7 h-7 rounded-full object-cover" />
            <span className="font-display font-bold text-base text-slate-900">
              Adding &ldquo;Smart SIP Helper&rdquo; to Groww 
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1 text-xs">
              <Globe className="w-3.5 h-3.5 text-[#00B386]" />
              <select
                value={lang}
                onChange={(e) => handleLanguageChange(e.target.value as HelperLang)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
              </select>
            </div>

            <Link
              href="/eval"
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#00B386] text-white hover:bg-[#009973]"
            >
              How we check quality (/eval)
            </Link>

            <button
              onClick={resetDemo}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            <Link
              href="/"
              className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              ← Discovery Engine
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-5 flex-1 space-y-5">
        {rateLimitMsg && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 text-xs px-4 py-2.5 rounded-xl">
            {rateLimitMsg}
          </div>
        )}

        {/* MAIN 3-COLUMN LAYOUT ON ONE SCREEN (Old UI + New UI + Beta Testing & Roadmap) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* COLUMN 1 (4 Cols): OLD UI (2 Real Groww Screenshots + What Is Missing) */}
          <div className="lg:col-span-4 bg-slate-100/80 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3.5 py-2">
              <span className="font-display font-bold text-xs text-slate-800">
                Old UI (Current Groww Screens 1 &amp; 2)
              </span>
              <span className="text-[10px] font-medium text-slate-500">What is missing?</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Screen 1: Real Groww Fund Screen + Active SIP Strip */}
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-center text-slate-600">
                  1. Fund Screen (-2.42%)
                </div>
                <div className="bg-[#121316] rounded-[18px] border-[3px] border-slate-800 overflow-hidden shadow-sm relative">
                  <img
                    src="/groww-old-fund-screen.png"
                    alt="Groww Fund Screen"
                    className="w-full h-[250px] object-cover object-top"
                  />
                  {/* Shows the user already has an active SIP in this fund */}
                  <div className="bg-[#1B1D22] border-t border-white/10 px-2.5 py-2 text-[10px] text-white flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[9px]">YOUR ACTIVE SIP</span>
                      <span className="font-bold text-white">₹2,000/mo • 5 Paid</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[#00D09C] font-semibold text-[9px]">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Screen 2: Existing Active SIP Details Screen (Shows ₹2,000 already running, no option to lower to ₹500 for 1 month) */}
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-center text-slate-600">
                  2. Active SIP Details (₹2,000)
                </div>
                <div className="bg-[#121316] text-white rounded-[18px] border-[3px] border-slate-800 overflow-hidden shadow-sm h-[292px] flex flex-col justify-between p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[9px] text-slate-400 border-b border-white/10 pb-1.5">
                      <span>← SIP Details</span>
                      <span className="text-[#00D09C] font-semibold">Active</span>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400">SBI Nifty Next 50 Direct Growth</div>
                      <div className="text-lg font-bold text-white mt-0.5">₹2,000 <span className="text-[10px] font-normal text-slate-400">/ month</span></div>
                    </div>

                    <div className="bg-[#1B1D22] rounded-lg p-2 space-y-1 text-[10px] border border-white/10">
                      <div className="flex justify-between">
                        <span className="text-slate-400">SIP Date</span>
                        <span className="font-semibold text-white">Monthly on 1st</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Instalments Paid</span>
                        <span className="font-semibold text-white">5 (₹10,000)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Next Due</span>
                        <span className="font-semibold text-amber-300">1st Dec (₹2,000)</span>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-2 text-[9px] text-slate-400 leading-snug border border-white/10">
                      Cannot edit ₹2,000 → ₹500 for 1 month. To change amount, you must cancel this SIP and start a new one.
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <div className="py-1.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-center text-[10px] font-bold">
                      Cancel SIP
                    </div>
                    <div className="py-1.5 rounded bg-white/10 text-slate-300 text-center text-[10px]">
                      Skip 1M
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs">
              <div className="font-bold text-slate-900">
                What is missing across these 2 screens:
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                • <strong>Screen 1 (Fund View):</strong> Shows <span className="text-rose-600 font-semibold">-2.42% (1Y)</span> in red with no <strong>Units Collected</strong> view and no <strong>Smart SIP Helper</strong> entry button.
              </p>
              <p className="text-[11px] text-slate-600 leading-snug">
                • <strong>Screen 2 (SIP Setup/Edit):</strong> Fixed amount &amp; date (1st) with no one-tap option to <strong>Lower this month to ₹500</strong> or <strong>Skip one instalment</strong>.
              </p>
            </div>
          </div>

          {/* COLUMN 2 (4 Cols): NEW UI (2 Side-by-Side Screens: 1. Where Button Is Added -> 2. What Opens When Tapped) */}
          <div className="lg:col-span-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between bg-white border border-emerald-200 rounded-xl px-3.5 py-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00B386]" />
                <span className="font-display font-bold text-xs text-slate-900">
                  New UI — Added &ldquo;Smart SIP Helper&rdquo; (Step 1 → Step 2)
                </span>
              </div>
            </div>

            {actionToast && (
              <div className="bg-emerald-50 border border-emerald-200 text-[#00B386] text-[11px] font-semibold px-3 py-1.5 rounded-lg">
                {actionToast}
              </div>
            )}

            {/* 2 New UI Screens Side-by-Side (Matches Old UI 2-Screen Layout so anyone can follow Step 1 -> Step 2) */}
            <div className="grid grid-cols-2 gap-2.5 items-stretch">
              {/* New Screen 1: Fund Screen Showing Where the New Button Is Added */}
              <div className="space-y-1 flex flex-col">
                <div className="text-[10px] font-semibold text-center text-emerald-900">
                  1. Button Added on Fund Screen
                </div>
                <div className="bg-[#121316] text-white rounded-[18px] border-[3px] border-slate-800 overflow-hidden shadow-sm flex-1 flex flex-col justify-between p-2.5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[9px] text-slate-400 border-b border-white/10 pb-1">
                      <span>← SBI Nifty Next 50</span>
                      <span className="text-[#00D09C] font-semibold">{sipStatusText}</span>
                    </div>

                    <div className="bg-[#1B1D22] rounded-lg p-2 border border-white/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-rose-400">-2.42% (1Y)</span>
                        <button
                          onClick={() => setShowUnitsView((v) => !v)}
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#00D09C]/20 text-[#00D09C] border border-[#00D09C]/40"
                        >
                          {showUnitsView ? "% View" : "+ Units View"}
                        </button>
                      </div>
                      <div className="text-[9px] text-slate-400">
                        NAV: ₹18.71 • Min. SIP ₹500
                      </div>
                      <div className="text-[10px] font-semibold text-[#00D09C]">
                        534.4 Units Collected (5 Paid)
                      </div>
                    </div>

                    {/* Visual Mini Chart Placeholder */}
                    <div className="bg-[#1B1D22]/60 rounded-lg p-2 border border-white/5 text-[9px] text-slate-400">
                      <div>Active SIP: ₹{sipAmount}/mo on 1st</div>
                      <div className="text-slate-500 mt-0.5">
                        Tap the green button below to adjust your upcoming SIP instalment:
                      </div>
                    </div>
                  </div>

                  {/* The Newly Added Button on Screen 1 */}
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#00D09C] text-center">
                      ↓ New Button Added Here ↓
                    </div>
                    <button
                      onClick={() => setHelperSheetOpen(true)}
                      className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-[#00B386] to-[#00D09C] text-[#081310] font-bold text-[10px] flex items-center justify-between shadow-md ring-2 ring-[#00D09C]/50"
                    >
                      <span className="flex items-center gap-1 text-left leading-tight">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        <span>Smart SIP Helper (Lower to ₹500 / Skip)</span>
                      </span>
                      <span className="shrink-0">→</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* New Screen 2: What Opens When You Tap That Button (Shows the Input Box at Top -> Then the Options Below!) */}
              <div className="space-y-1 flex flex-col">
                <div className="text-[10px] font-semibold text-center text-emerald-900">
                  2. Opens When Button Is Tapped →
                </div>
                <div
                  className={`rounded-[18px] border-[3px] border-slate-800 overflow-hidden shadow-sm flex-1 flex flex-col justify-between p-2.5 ${
                    isFallback
                      ? "bg-amber-950 text-slate-100"
                      : "bg-white text-slate-900"
                  }`}
                >
                  <div className="space-y-2">
                    {/* Top Header + User Input Box Inside the Phone Sheet */}
                    <div className="space-y-1.5 border-b border-slate-200 pb-2">
                      <div className="flex items-center justify-between text-[9.5px]">
                        <span className="font-bold text-[#00B386] flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Smart SIP Helper
                        </span>
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            isFallback
                              ? "bg-amber-300 text-amber-950"
                              : "bg-emerald-100 text-[#00B386]"
                          }`}
                        >
                          {gateTrace.gate_decision}
                        </span>
                      </div>

                      <div
                        className={`text-[9.5px] font-medium ${
                          isFallback ? "text-slate-200" : "text-slate-600"
                        }`}
                      >
                        Step A: Type your situation (English or Hindi):
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          runHelperPipeline(inputText);
                        }}
                        className="flex gap-1"
                      >
                        <input
                          type="text"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="e.g. salary delayed to 7th..."
                          className="flex-1 bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-[10px] text-slate-900 focus:outline-none focus:border-[#00B386]"
                        />
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold shrink-0"
                        >
                          {isLoading ? "..." : "Ask"}
                        </button>
                      </form>
                    </div>

                    {/* Step B: Options Shown After User Types */}
                    <div className="space-y-1">
                      <div
                        className={`text-[9px] font-semibold uppercase tracking-wider ${
                          isFallback ? "text-amber-300" : "text-[#00B386]"
                        }`}
                      >
                        Step B: Options Shown for Your Situation:
                      </div>
                      <div
                        className={`font-bold text-[10px] leading-tight ${
                          isFallback ? "text-amber-200" : "text-slate-900"
                        }`}
                      >
                        {currentTemplate.headline}
                      </div>
                      <p
                        className={`text-[9.5px] leading-snug ${
                          isFallback ? "text-slate-200" : "text-slate-600"
                        }`}
                      >
                        {currentTemplate.explanation}
                      </p>
                    </div>

                    {/* Options in required order: 1. Lower to ₹500, 2. Skip one instalment, 3. Keep as is */}
                    <div className="space-y-1 pt-0.5">
                      {currentTemplate.actions.map((act) => (
                        <button
                          key={act.id}
                          onClick={() => handleActionClick(act.actionType, act.href)}
                          className="w-full text-left px-2 py-1.5 rounded-lg bg-[#00B386] hover:bg-[#009973] text-white transition flex items-center justify-between gap-1"
                        >
                          <div>
                            <div className="text-[10px] font-bold leading-tight">{act.label}</div>
                            <div className="text-[8.5px] text-emerald-100 leading-tight mt-0.5">
                              {act.subtext}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold shrink-0">→</span>
                        </button>
                      ))}
                    </div>

                    {currentTemplate.activeSipNote && (
                      <p
                        className={`text-[9px] leading-snug ${
                          isFallback ? "text-amber-200" : "text-slate-600 font-medium"
                        }`}
                      >
                        {currentTemplate.activeSipNote}
                      </p>
                    )}
                  </div>

                  {/* Footer Rules & Thumbs */}
                  <div
                    className={`text-[9px] space-y-1 pt-1.5 border-t ${
                      isFallback ? "border-white/15 text-slate-300" : "border-slate-100 text-slate-500"
                    }`}
                  >
                    <p className="leading-tight">{currentTemplate.timingNote}</p>
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <a
                        href={currentTemplate.schemeDocLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium text-[#00B386]"
                      >
                        Scheme doc ↗
                      </a>
                      <a
                        href={currentTemplate.helpLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium text-[#00B386]"
                      >
                        Official help ↗
                      </a>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>Was this helpful?</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleThumbsFeedback("up")}
                          className={`p-1 rounded border ${
                            thumbsGiven === "up"
                              ? "bg-emerald-100 border-[#00B386] text-[#00B386]"
                              : "border-slate-200 hover:bg-slate-100 text-slate-500"
                          }`}
                        >
                          <ThumbsUp className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleThumbsFeedback("down")}
                          className={`p-1 rounded border ${
                            thumbsGiven === "down"
                              ? "bg-rose-100 border-rose-400 text-rose-600"
                              : "border-slate-200 hover:bg-slate-100 text-slate-500"
                          }`}
                        >
                          <ThumbsDown className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-emerald-200 rounded-xl p-2.5 text-[11px] text-slate-600 leading-snug">
              <strong className="text-[#00B386]">How it works (1 → 2):</strong> On{" "}
              <strong>Screen 1</strong>, we added the green <strong>Smart SIP Helper</strong> button and <strong>534.4 Units Collected</strong> view. Tapping that button opens <strong>Screen 2</strong> with 1-tap options to <strong>Lower to ₹500</strong>, <strong>Skip 1 instalment</strong>, or <strong>Keep as is</strong>.
            </div>
          </div>

          {/* COLUMN 3 (4 Cols, Right Side): BETA TESTING + "TRY TO BREAK IT" + VERTICAL ROADMAP */}
          <div className="lg:col-span-4 space-y-3">
            {/* Beta Testing + Try to Break It Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div>
                <h2 className="font-display font-bold text-sm text-slate-900">
                  Beta Testing
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click a sample prompt and see the new app response:
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                {SAMPLE_PROMPTS.map((samp) => (
                  <button
                    key={samp}
                    type="button"
                    onClick={() => runHelperPipeline(samp)}
                    className={`text-left text-xs px-3 py-1.5 rounded-lg border transition truncate ${
                      inputText === samp
                        ? "bg-emerald-50 border-[#00B386] text-slate-900 font-semibold"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                    title={samp}
                  >
                    &ldquo;{samp}&rdquo;
                  </button>
                ))}
              </div>

              {/* Try to break it (Safety Gate Tests) */}
              <div className="space-y-1 pt-1 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-800">
                  Try to break it (Safety Gate Tests)
                </div>
                <div className="flex flex-col gap-1">
                  {TRY_TO_BREAK_IT_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => runHelperPipeline(p)}
                      className={`text-left text-xs px-3 py-1.5 rounded-lg border transition truncate ${
                        inputText === p
                          ? "bg-amber-50 border-amber-400 text-slate-900 font-semibold"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      &ldquo;{p}&rdquo;
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input + Ask */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runHelperPipeline(inputText);
                }}
                className="flex gap-1.5 pt-1"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your situation in English or Hindi..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#00B386]"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-3.5 py-1.5 rounded-lg bg-[#00B386] hover:bg-[#009973] text-white text-xs font-bold inline-flex items-center gap-1 shrink-0"
                >
                  <Send className="w-3 h-3" />
                  {isLoading ? "..." : "Ask"}
                </button>
              </form>

              {/* Gate Trace Box */}
              <div
                className={`rounded-xl p-2.5 border space-y-1 text-xs ${
                  isFallback
                    ? "bg-amber-50/70 border-amber-300"
                    : "bg-emerald-50/50 border-emerald-200"
                }`}
              >
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  {isFallback ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-[#00B386] shrink-0" />
                  )}
                  <span>What Just Happened (Gate Trace):</span>
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-200/80 text-[11px] space-y-0.5 text-slate-700">
                  <div>
                    <strong>1. Intent:</strong> <code>{gateTrace.detected_intent}</code> (conf:{" "}
                    {gateTrace.confidence.toFixed(2)}, lang: {gateTrace.language})
                  </div>
                  <div>
                    <strong>2. Gate Decision:</strong>{" "}
                    <span className={isFallback ? "text-amber-800 font-bold" : "text-[#00B386] font-bold"}>
                      {gateTrace.gate_decision}
                    </span>{" "}
                    — {gateTrace.reason}
                  </div>
                </div>
                {lastLoggedFeedback && (
                  <div className="text-[10px] font-mono text-slate-500">{lastLoggedFeedback}</div>
                )}
              </div>
            </div>

            {/* Vertical Roadmap Card (Phase 1, Phase 2, Phase 3) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5 text-xs">
              <div className="font-display font-bold text-xs uppercase tracking-wider text-slate-900">
                Roadmap (Phase 1 → Phase 2 → Phase 3)
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-2.5 space-y-1 text-[11px]">
                <div className="font-bold text-[#00B386]">Phase 1: Live now (MVP)</div>
                <p className="text-slate-700 leading-snug">
                  • <strong>Moment:</strong> temporary cash-flow crunch or delayed salary before an instalment.<br />
                  • <strong>Flow:</strong> plain words in English or Hindi.<br />
                  • <strong>Output:</strong> lower to ₹500 for 1M, skip 1 instalment, or keep as is + act-by date.<br />
                  • <strong>Safeguards:</strong> declines fund advice &amp; market predictions, links to official source.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <div className="font-bold text-slate-900">Phase 2: Next</div>
                  <p className="text-slate-600 mt-0.5 leading-snug">
                    • One-tap retry after failed autopay.<br />
                    • Units-collected view next to red return.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <div className="font-bold text-slate-900">Phase 3: Later</div>
                  <p className="text-slate-600 mt-0.5 leading-snug">
                    • More languages.<br />
                    • Pattern check-ins (no fear/urgency).<br />
                    • 12M active-SIP metric test.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
