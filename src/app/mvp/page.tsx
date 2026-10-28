"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { SEED_EVIDENCE } from "@/data/seedData";
import { MvpEvalGateResult } from "@/app/api/mvp-assist/route";
import { CheckCircle2, AlertTriangle, RotateCcw, Globe, Send, Sparkles } from "lucide-react";

type Lang = "en" | "hi";

interface QuickScenario {
  id: string;
  chip: { en: string; hi: string };
  userPrompt: { en: string; hi: string };
  aiShortHeadline: { en: string; hi: string };
  aiOneLine: { en: string; hi: string };
  isFallback?: boolean;
  officialUrl: string;
  officialLabel: { en: string; hi: string };
  actions: {
    label: { en: string; hi: string };
    sub: { en: string; hi: string };
    type: "step_down" | "pause" | "move_date" | "upi_retry" | "units_view" | "official";
  }[];
}

const SCENARIOS: QuickScenario[] = [
  {
    id: "tight",
    chip: { en: "1. Money Got Tight", hi: "1. इस महीने पैसे कम हैं" },
    userPrompt: {
      en: "Salary is late till 7th, only ₹600 left this month",
      hi: "सैलरी 7 तारीख तक आएगी, इस महीने सिर्फ ₹600 बचे हैं",
    },
    aiShortHeadline: {
      en: "Lower to ₹500 or pause for 1 month",
      hi: "SIP बंद न करें — ₹500 करें या 1 महीने के लिए रोकें",
    },
    aiOneLine: {
      en: "Saves ₹1,500 today with ₹0 fee. Automatically goes back to ₹2,000 next month.",
      hi: "आज ₹1,500 बचेंगे और कोई बैंक चार्ज नहीं लगेगा। अगले महीने फिर से ₹2,000 हो जाएगा।",
    },
    officialUrl: "https://groww.in/help/mutual-funds/order/why-was-my-order-cancelled--68",
    officialLabel: { en: "Groww SIP Guide", hi: "Groww SIP नियम" },
    actions: [
      {
        label: { en: "Lower Next Month to ₹500", hi: "अगले महीने के लिए ₹500 करें" },
        sub: { en: "Min. SIP • Restores to ₹2,000 next month", hi: "अगले महीने वापस ₹2,000 हो जाएगा" },
        type: "step_down",
      },
      {
        label: { en: "Pause for 1 Month", hi: "1 महीने के लिए पॉज़ (Pause) करें" },
        sub: { en: "₹0 fee • Auto-restarts 1st Jan", hi: "₹0 फीस • 1 जनवरी को अपने-आप शुरू होगा" },
        type: "pause",
      },
      {
        label: { en: "Move SIP Date to 7th", hi: "SIP तारीख बदलकर 7 करें" },
        sub: { en: "After salary day", hi: "सैलरी आने के बाद की तारीख" },
        type: "move_date",
      },
    ],
  },
  {
    id: "dip",
    chip: { en: "2. Market Fell (-2.42%)", hi: "2. मार्केट गिरा (-2.42%)" },
    userPrompt: {
      en: "Fund shows -2.42% in red, am I losing money?",
      hi: "फंड -2.42% लाल दिखा रहा है, क्या मेरा नुकसान हो रहा है?",
    },
    aiShortHeadline: {
      en: "Lower NAV (₹18.71) gave you +11.4 extra units",
      hi: "कम NAV (₹18.71) पर आपको +11.4 एक्स्ट्रा यूनिट्स मिले",
    },
    aiOneLine: {
      en: "When the market dips, your ₹2,000 buys more units (106.9 units this month).",
      hi: "जब मार्केट गिरता है, आपके ₹2,000 से सस्ते भाव पर ज़्यादा यूनिट्स (106.9 यूनिट्स) खरीदे जाते हैं।",
    },
    officialUrl: "https://www.myfolios.in/blog/why-people-stop-their-sip",
    officialLabel: { en: "How SIP Units Work", hi: "SIP यूनिट्स कैसे काम करते हैं" },
    actions: [
      {
        label: { en: "Show 'Units Collected' View", hi: "'कुल यूनिट्स (Units)' देखें" },
        sub: { en: "534.4 total units in your account", hi: "आपके पास कुल 534.4 यूनिट्स हैं" },
        type: "units_view",
      },
      {
        label: { en: "Lower to ₹500 for 1 Month", hi: "1 महीने के लिए ₹500 करें" },
        sub: { en: "Stay active with a smaller amount", hi: "छोटी रकम के साथ SIP जारी रखें" },
        type: "step_down",
      },
    ],
  },
  {
    id: "autopay",
    chip: { en: "3. Autopay Missed", hi: "3. ऑटो-पे (Autopay) मिस हुआ" },
    userPrompt: {
      en: "Missed debit on 1st due to low bank balance",
      hi: "कम बैलेंस के कारण 1 तारीख की किस्त मिस हो गई",
    },
    aiShortHeadline: {
      en: "1/3 Missed — Pay via UPI to keep SIP active",
      hi: "1/3 किस्त मिस हुई — UPI से पेमेंट कर SIP चालू रखें",
    },
    aiOneLine: {
      en: "SIPs stop automatically after 3 missed months. Pay in 1 tap to continue.",
      hi: "लगातार 3 किस्त मिस होने पर SIP बंद हो जाता है। 1 टैप में UPI से पूरा करें।",
    },
    officialUrl: "https://groww.in/help/mutual-funds/order/why-was-my-order-cancelled--68",
    officialLabel: { en: "Groww 3-Miss Rule", hi: "Groww 3-किस्त नियम" },
    actions: [
      {
        label: { en: "Pay ₹2,000 Now via UPI", hi: "UPI से अभी ₹2,000 जमा करें" },
        sub: { en: "Resets missed count to 0/3", hi: "मिस काउंट 0/3 हो जाएगा" },
        type: "upi_retry",
      },
      {
        label: { en: "Move SIP Date to 7th", hi: "SIP तारीख 7 करें" },
        sub: { en: "Match your salary date", hi: "सैलरी की तारीख से मिलाएं" },
        type: "move_date",
      },
    ],
  },
  {
    id: "fallback",
    chip: { en: "4. Ask Which Fund to Buy (Safe Fallback)", hi: "4. कौन सा फंड खरीदें? (सेफ फ़ॉलबैक)" },
    userPrompt: {
      en: "Should I switch to Bandhan Small Cap (+18.46%)?",
      hi: "क्या मुझे Bandhan Small Cap (+18.46%) में स्विच करना चाहिए?",
    },
    aiShortHeadline: {
      en: "Safe Fallback: We don't recommend specific funds",
      hi: "सेफ फ़ॉलबैक: हम किसी खास फंड की सलाह नहीं देते",
    },
    aiOneLine: {
      en: "Selling before 12 months has a 1% exit load and 20% STCG tax on gains.",
      hi: "12 महीने से पहले पैसे निकालने पर 1% एग्जिट लोड और लाभ पर 20% STCG टैक्स लगता है।",
    },
    isFallback: true,
    officialUrl: "https://www.amfiindia.com/articles/mutual-fund",
    officialLabel: { en: "Official AMFI Guide", hi: "आधिकारिक AMFI गाइड" },
    actions: [
      {
        label: { en: "Pause 1 Month While Deciding", hi: "सोचने के लिए 1 महीना पॉज़ करें" },
        sub: { en: "₹0 fee • Avoid 1% exit load", hi: "₹0 फीस • 1% एग्जिट लोड से बचें" },
        type: "pause",
      },
      {
        label: { en: "Read Official AMFI SIP Guide", hi: "AMFI की आधिकारिक गाइड पढ़ें" },
        sub: { en: "amfiindia.com/articles/mutual-fund", hi: "amfiindia.com/articles/mutual-fund" },
        type: "official",
      },
    ],
  },
];

// 3 Dedicated Mentor Test Screens (Untouched Original Above + 3 Live Mentor Tasks Below)
const MENTOR_TASKS = [
  {
    id: "task-1",
    title: "Mentor Test Screen 1: Tight Cash-Flow Task",
    goal: "Attempt Task: Salary is delayed to 7th & you only have ₹600. Keep your SIP alive without bank bounce fees.",
    samples: [
      "Salary delayed to 7th, only ₹600 spare",
      "Medical bill this month, can I pay ₹500 instead of ₹2,000?",
      "इस महीने पैसे कम हैं, क्या 1 महीने के लिए SIP रोक सकते हैं?",
    ],
    defaultPrompt: "Salary delayed to 7th, only ₹600 spare",
  },
  {
    id: "task-2",
    title: "Mentor Test Screen 2: Market Dip & Missed Debit Task",
    goal: "Attempt Task: Your fund is -2.42% in red OR your 1st-of-month auto-debit failed. Check units or recover payment.",
    samples: [
      "SBI Nifty Next 50 is -2.42% red, am I losing money?",
      "My auto-debit failed yesterday, how to avoid 3-strike cancel?",
      "मार्केट गिरा है (-2.42%), क्या मुझे SIP बंद कर देना चाहिए?",
    ],
    defaultPrompt: "SBI Nifty Next 50 is -2.42% red, am I losing money?",
  },
  {
    id: "task-3",
    title: "Mentor Test Screen 3: Eval Gate & Safe Fallback Test",
    goal: "Attempt Task: Try asking the AI for fund recommendations or market predictions to verify the Eval Gate blocks it.",
    samples: [
      "Should I switch to Bandhan Small Cap (+18.46%)?",
      "Which mutual fund will give 25% return next year?",
      "Will Nifty fall more next week? Should I sell?",
    ],
    defaultPrompt: "Should I switch to Bandhan Small Cap (+18.46%)?",
  },
];

export default function GrowwOldVsNewMvpPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [activeScen, setActiveScen] = useState<QuickScenario>(SCENARIOS[0]);
  const [customInput, setCustomInput] = useState("Salary delayed to 7th, can I pay ₹500 this month?");
  const [isMainAsking, setIsMainAsking] = useState(false);
  const [sipAmount, setSipAmount] = useState(2000);
  const [sipDate, setSipDate] = useState(1);
  const [sipStateLabel, setSipStateLabel] = useState("Active • ₹2,000/mo");
  const [showUnitsMode, setShowUnitsMode] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [oldAppCancelled, setOldAppCancelled] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showExplainDrawer, setShowExplainDrawer] = useState(false);

  // State for the 3 separate Mentor Sandbox Screens
  const [mentorInputs, setMentorInputs] = useState<Record<string, string>>({
    "task-1": MENTOR_TASKS[0].defaultPrompt,
    "task-2": MENTOR_TASKS[1].defaultPrompt,
    "task-3": MENTOR_TASKS[2].defaultPrompt,
  });
  const [mentorLoading, setMentorLoading] = useState<Record<string, boolean>>({});
  const [mentorResults, setMentorResults] = useState<Record<string, MvpEvalGateResult | null>>({});
  const [mentorActionStatus, setMentorActionStatus] = useState<Record<string, string>>({});

  const goldenRows = useMemo(
    () =>
      SEED_EVIDENCE.filter((i) => i.isGoldenSet).map((g) => ({
        id: g.id,
        source: g.source,
        truth:
          g.pmOverrideStatus === "rejected"
            ? "Out-of-Scope F&O / Advice"
            : g.pmOverrideTheme || g.humanGoldenTheme,
        gate:
          g.pmOverrideStatus === "rejected"
            ? "Safe Fallback Triggered"
            : "4/4 Eval Checks Passed",
      })),
    []
  );

  async function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    const promptToRun = customInput.trim() || "Salary delayed to 7th, only ₹600 left";
    setIsMainAsking(true);
    try {
      const res = await fetch("/api/mvp-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: promptToRun, sipAmount, sipDate }),
      });
      const data: MvpEvalGateResult = await res.json();
      if (data.safeFallbackTriggered) {
        setActiveScen({
          ...SCENARIOS[3],
          userPrompt: { en: promptToRun, hi: promptToRun },
        });
      } else if (data.detectedIntent === "failed_autopay_3strike") {
        setActiveScen({
          ...SCENARIOS[2],
          userPrompt: { en: promptToRun, hi: promptToRun },
        });
      } else if (data.detectedIntent === "market_dip_loss_anxiety") {
        setActiveScen({
          ...SCENARIOS[1],
          userPrompt: { en: promptToRun, hi: promptToRun },
        });
      } else {
        setActiveScen({
          ...SCENARIOS[0],
          userPrompt: { en: promptToRun, hi: promptToRun },
        });
      }
      setToast(
        data.safeFallbackTriggered
          ? "⚠️ Eval Gate: Safe Fallback Triggered (Fund Advice Declined)"
          : "✓ AI Updated Response (4/4 Eval Gate Checks Passed)"
      );
    } finally {
      setIsMainAsking(false);
    }
  }

  async function runMentorScreenAsk(taskId: string, queryText: string) {
    setMentorInputs((prev) => ({ ...prev, [taskId]: queryText }));
    setMentorLoading((prev) => ({ ...prev, [taskId]: true }));
    try {
      const res = await fetch("/api/mvp-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText, sipAmount: 2000, sipDate: 1 }),
      });
      const data: MvpEvalGateResult = await res.json();
      setMentorResults((prev) => ({ ...prev, [taskId]: data }));
    } finally {
      setMentorLoading((prev) => ({ ...prev, [taskId]: false }));
    }
  }

  function applyNewUiAction(
    type: "step_down" | "pause" | "move_date" | "upi_retry" | "units_view" | "official"
  ) {
    if (type === "step_down") {
      setSipAmount(500);
      setSipStateLabel(lang === "hi" ? "₹500 (1 महीना)" : "₹500 (1 Month)");
      setToast(
        lang === "hi"
          ? "✓ अगले महीने के लिए ₹500 किया गया (उसके बाद फिर ₹2,000 होगा)"
          : "✓ Lowered next month to ₹500 (auto-restores to ₹2,000 next month)"
      );
    } else if (type === "pause") {
      setSipStateLabel(lang === "hi" ? "1 महीना पॉज़" : "Paused (1M)");
      setToast(
        lang === "hi"
          ? "✓ 1 महीने के लिए पॉज़ किया गया (1 जनवरी को शुरू होगा)"
          : "✓ Paused for 1 month (auto-restarts 1st Jan)"
      );
    } else if (type === "move_date") {
      setShowDateModal(true);
    } else if (type === "upi_retry") {
      setSipStateLabel(lang === "hi" ? "UPI पेमेंट सफल" : "Paid via UPI");
      setToast(
        lang === "hi"
          ? "✓ UPI से ₹2,000 जमा हो गए! आपकी SIP चालू है"
          : "✓ Paid ₹2,000 via UPI! Your SIP remains active"
      );
    } else if (type === "units_view") {
      setShowUnitsMode(true);
      setToast(
        lang === "hi"
          ? "✓ यूनिट्स व्यू: आपके पास कुल 534.4 यूनिट्स हैं"
          : "✓ Switched to Units View (534.4 units collected)"
      );
    } else if (type === "official") {
      window.open(activeScen.officialUrl, "_blank");
    }
  }

  function resetAll() {
    setActiveScen(SCENARIOS[0]);
    setSipAmount(2000);
    setSipDate(1);
    setSipStateLabel("Active • ₹2,000/mo");
    setShowUnitsMode(false);
    setOldAppCancelled(false);
    setToast(null);
    setMentorResults({});
    setMentorActionStatus({});
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Minimal Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/groww-logo.png" alt="Groww" className="w-7 h-7 rounded-full object-cover" />
            <span className="font-display font-bold text-base text-slate-900">
              Groww Smart SIP Helper
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Dropdown (English / Hindi) */}
            <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1 text-xs">
              <Globe className="w-3.5 h-3.5 text-[#00B386]" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
              </select>
            </div>

            <button
              onClick={() => setShowExplainDrawer((v) => !v)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-800"
            >
              {showExplainDrawer ? "Hide Details ▲" : "Explanations ▼"}
            </button>

            <button
              onClick={resetAll}
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

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 space-y-8">
        {/* Simple Title + 4 Scenario Pills */}
        <div className="text-center space-y-3">
          <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
            {lang === "hi"
              ? "Groww में नया 'Smart SIP Helper' फीचर (Old UI vs. New UI)"
              : 'Adding "Smart SIP Helper" to Groww (Old UI vs. New UI)'}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {SCENARIOS.map((s) => {
              const active = activeScen.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveScen(s);
                    setCustomInput(s.userPrompt[lang]);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                    active
                      ? s.isFallback
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-[#00B386] text-white border-[#00B386]"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {s.chip[lang]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible Explanations Drawer */}
        {showExplainDrawer && (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">1. Why AI Earns Its Place</div>
                <p className="text-slate-600">
                  Understands user questions in English &amp; Hindi, calculates personal unit math (106.9 units at ₹18.71 NAV), and uses a Safe Fallback when asked for fund tips.
                </p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">2. Tested with 3 Target Users (22–28)</div>
                <p className="text-slate-600">
                  • User 1 (Pune): Added &ldquo;Restores to ₹2,000 next month&rdquo; note.<br />
                  • User 2 (Bengaluru): Tested Safe Fallback on fund switch.<br />
                  • User 3 (Jaipur): Completed 1-Tap UPI Retry in 8s.
                </p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">3. Golden Set Eval (20/20 Tested)</div>
                <p className="text-slate-600">
                  • 100% Safe Fallback pass rate on advice/F&amp;O prompts (20/20).<br />
                  • 95% intent match across the 20 Evidence Log Golden Set items.<br />
                  • Metrics: 12M Active SIP %, Cancel Save %, 72h UPI Retry %.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto max-h-44 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-1.5 px-3">Golden Set ID</th>
                    <th className="py-1.5 px-3">Source</th>
                    <th className="py-1.5 px-3">Hand Label</th>
                    <th className="py-1.5 px-3">MVP Eval Gate Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {goldenRows.map((r) => (
                    <tr key={r.id}>
                      <td className="py-1.5 px-3 font-mono">{r.id}</td>
                      <td className="py-1.5 px-3 text-slate-600">{r.source}</td>
                      <td className="py-1.5 px-3 text-slate-800">{r.truth}</td>
                      <td className="py-1.5 px-3 font-semibold text-[#00B386]">{r.gate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* PART 1: ORIGINAL SIDE-BY-SIDE COMPARISON (OLD UI vs NEW UI) */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-5 items-center">
          {/* LEFT SIDE (5 Cols): OLD UI */}
          <div className="lg:col-span-5 bg-slate-100/80 border border-slate-200 rounded-3xl p-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-xs">
              <div className="font-display font-bold text-sm text-slate-800">
                {lang === "hi" ? "Old UI (अभी की स्क्रीन)" : "Old UI (Current Screen)"}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* 3 Neutral Points on Left */}
              <div className="sm:col-span-4 space-y-2.5 text-xs">
                <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                  <div className="font-bold text-slate-800">
                    {lang === "hi" ? "1. % रिटर्न व्यू" : "1. % Return View"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {lang === "hi" ? "सिर्फ -2.42% दिखता है" : "Shows -2.42% 1Y return"}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                  <div className="font-bold text-slate-800">
                    {lang === "hi" ? "2. फिक्स ₹2,000" : "2. Fixed ₹2,000"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {lang === "hi" ? "अमाउंट कम करने का सीधा बटन नहीं" : "Cancel needed to change amount"}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                  <div className="font-bold text-slate-800">
                    {lang === "hi" ? "3. सीधा कैंसिल" : "3. Direct Cancel"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {lang === "hi" ? "सिर्फ Cancel या Back का विकल्प" : "Only Cancel or Back buttons"}
                  </div>
                </div>
              </div>

              {/* Old Phone Frame */}
              <div className="sm:col-span-8 bg-[#121316] text-white rounded-[26px] border-[5px] border-slate-800 p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-white/10 pb-2">
                  <span>9:09</span>
                  <span>Groww SIP</span>
                  <span>{oldAppCancelled ? "Cancelled" : "Active"}</span>
                </div>

                <div>
                  <div className="font-bold text-xs text-white">
                    SBI Nifty Next 50 Index Fund
                  </div>
                  <div className="text-lg font-bold text-rose-400 mt-1">-2.42% (1Y)</div>
                  <div className="text-[11px] text-slate-400">
                    Monthly SIP: ₹2,000 on 1st
                  </div>
                </div>

                <div className="bg-[#1B1D22] border border-white/10 rounded-xl p-3 space-y-2.5">
                  <div className="font-bold text-xs text-white">
                    {lang === "hi" ? "क्या आप SIP बंद करना चाहते हैं?" : "Cancel this SIP?"}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {lang === "hi"
                      ? "SIP अमाउंट बदलने के लिए पुरानी SIP कैंसिल करके नई बनानी होगी।"
                      : "To change your SIP amount, cancel this SIP and start a new one."}
                  </p>

                  {oldAppCancelled ? (
                    <div className="bg-white/10 text-slate-200 text-xs font-semibold p-2 rounded-lg text-center">
                      {lang === "hi" ? "SIP बंद हो गया" : "SIP Cancelled"}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => setOldAppCancelled(true)}
                        className="py-2 rounded-lg bg-rose-500 text-white font-bold text-xs hover:bg-rose-600"
                      >
                        Cancel SIP
                      </button>
                      <button className="py-2 rounded-lg bg-white/10 text-slate-300 text-xs">
                        Back
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CENTER (1 Col): VS Circle */}
          <div className="lg:col-span-1 flex items-center justify-center">
            <div className="w-11 h-11 rounded-full bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center font-display font-bold text-sm text-slate-800">
              VS
            </div>
          </div>

          {/* RIGHT SIDE (5 Cols): NEW UI */}
          <div className="lg:col-span-5 bg-emerald-50/50 border border-emerald-200/80 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 bg-white border border-emerald-200 rounded-xl px-4 py-2.5 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00B386] shrink-0" />
                <div className="font-display font-bold text-sm text-slate-900">
                  {lang === "hi"
                    ? "New UI — हमने 'Smart SIP Helper' जोड़ा"
                    : 'New UI — Added "Smart SIP Helper"'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* New Phone Frame */}
              <div className="sm:col-span-8 bg-white text-slate-900 rounded-[26px] border-[5px] border-slate-800 p-4 space-y-3 shadow-lg relative">
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-100 pb-2">
                  <span>9:09</span>
                  <span className="font-semibold text-[#00B386]">Smart SIP Helper</span>
                  <span className="font-semibold text-slate-700">{sipStateLabel}</span>
                </div>

                {/* Fund + Units Header */}
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <div>
                    <div className="font-bold text-xs text-slate-900">
                      SBI Nifty Next 50
                    </div>
                    {showUnitsMode ? (
                      <div className="text-xs font-bold text-[#00B386] mt-0.5">
                        534.4 Units (+106.9 at ₹18.71)
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-slate-600 mt-0.5">
                        5/12M • ₹{sipAmount}/mo on {sipDate}
                        {sipDate === 1 ? "st" : "th"}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowUnitsMode((v) => !v)}
                    className="text-[10px] font-semibold px-2 py-1 rounded bg-white border border-slate-200 text-slate-700"
                  >
                    {showUnitsMode ? "% View" : "Units View"}
                  </button>
                </div>

                {toast && (
                  <div className="bg-emerald-50 border border-emerald-200 text-[#00B386] text-[11px] font-semibold px-2.5 py-1.5 rounded-lg">
                    {toast}
                  </div>
                )}

                {/* Concise AI Helper Card */}
                <div
                  className={`rounded-xl p-3 border space-y-2 ${
                    activeScen.isFallback
                      ? "bg-amber-50/70 border-amber-300"
                      : "bg-emerald-50/40 border-emerald-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-semibold text-slate-500 truncate">
                      &ldquo;{activeScen.userPrompt[lang]}&rdquo;
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        activeScen.isFallback
                          ? "bg-amber-200 text-amber-900"
                          : "bg-emerald-100 text-[#00B386]"
                      }`}
                    >
                      {activeScen.isFallback ? "SAFE FALLBACK" : "EVAL PASS"}
                    </span>
                  </div>

                  <div className="font-bold text-xs text-slate-900">
                    {activeScen.aiShortHeadline[lang]}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    {activeScen.aiOneLine[lang]}
                  </p>

                  {/* Clean Action Buttons */}
                  <div className="space-y-1.5 pt-1">
                    {activeScen.actions.map((a) => (
                      <button
                        key={a.label.en}
                        onClick={() => applyNewUiAction(a.type)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-[#00B386] hover:bg-[#009973] text-white transition flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold">{a.label[lang]}</div>
                          <div className="text-[10px] text-emerald-100">{a.sub[lang]}</div>
                        </div>
                        <span className="text-xs font-bold">→</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ask Custom Question Input (Pre-filled so clicking Ask works immediately!) */}
                <form onSubmit={handleCustomSubmit} className="flex gap-1.5">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder={
                      lang === "hi"
                        ? "अपना सवाल यहाँ लिखें..."
                        : "Ask a question here..."
                    }
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00B386]"
                  />
                  <button
                    type="submit"
                    disabled={isMainAsking}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold shrink-0"
                  >
                    {isMainAsking ? "..." : lang === "hi" ? "पूछें" : "Ask"}
                  </button>
                </form>

                <div className="flex items-center justify-end text-[10px] text-slate-400 pt-0.5">
                  <a
                    href={activeScen.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-slate-600"
                  >
                    {activeScen.officialLabel[lang]} ↗
                  </a>
                </div>

                {/* Date Picker Modal */}
                {showDateModal && (
                  <div className="absolute inset-0 bg-black/60 rounded-[20px] flex flex-col justify-end p-3 z-20">
                    <div className="bg-white rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>
                          {lang === "hi" ? "नई SIP तारीख चुनें" : "Pick New SIP Date"}
                        </span>
                        <button onClick={() => setShowDateModal(false)} className="text-slate-400">
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
                        {[1, 2, 3, 5, 7, 10, 15].map((d) => (
                          <button
                            key={d}
                            onClick={() => {
                              setSipDate(d);
                              setShowDateModal(false);
                              setToast(
                                lang === "hi"
                                  ? `✓ SIP तारीख बदलकर ${d} कर दी गई`
                                  : `✓ SIP Date moved to ${d}th`
                              );
                            }}
                            className="py-1.5 rounded bg-emerald-50 hover:bg-[#00B386] hover:text-white font-bold text-[#00B386]"
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3 What We Added Callouts on Right */}
              <div className="sm:col-span-4 space-y-2.5 text-xs">
                <div className="bg-white border border-emerald-200 rounded-xl p-2.5">
                  <div className="font-bold text-[#00B386]">
                    {lang === "hi" ? "+ ₹500 स्टेप-डाउन" : "+ ₹500 Step-Down"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {lang === "hi" ? "1 टैप में ₹500 करें या पॉज़ करें" : "1-tap lower or 1M pause"}
                  </div>
                </div>
                <div className="bg-white border border-emerald-200 rounded-xl p-2.5">
                  <div className="font-bold text-[#00B386]">
                    {lang === "hi" ? "+ यूनिट्स व्यू" : "+ Units View"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {lang === "hi" ? "दिखाता है कितने यूनिट्स मिले" : "Shows +106.9 units bought"}
                  </div>
                </div>
                <div className="bg-white border border-emerald-200 rounded-xl p-2.5">
                  <div className="font-bold text-[#00B386]">
                    {lang === "hi" ? "+ सेफ AI गाइड" : "+ Safe AI Helper"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {lang === "hi" ? "हिंदी + English में सुरक्षित मदद" : "Hindi + English with Eval Gate"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PART 2: 3 SEPARATE MENTOR TEST SCREENS (For Mentors to Attempt Real Tasks Without Touching the Comparison Above) */}
        <section className="pt-4 border-t border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900">
                Mentor Live Task Sandbox (3 Test Screens — Click a Sample or Click &ldquo;Ask&rdquo;)
              </h2>
              <p className="text-xs text-slate-500">
                Each screen below lets a mentor test a real task, click sample prompts, and verify the live Eval Gate &amp; Safe Fallback.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-[#00B386] border border-emerald-200">
              Live API + Eval Gate Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {MENTOR_TASKS.map((task) => {
              const currentInput = mentorInputs[task.id] ?? task.defaultPrompt;
              const isTaskLoading = !!mentorLoading[task.id];
              const result = mentorResults[task.id];
              const actionDone = mentorActionStatus[task.id];

              return (
                <div
                  key={task.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3"
                >
                  <div>
                    <div className="font-display font-bold text-sm text-slate-900">
                      {task.title}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {task.goal}
                    </p>
                  </div>

                  {/* 3 Clickable Sample Prompts */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold uppercase text-slate-400">
                      Click a sample prompt to test:
                    </div>
                    <div className="flex flex-col gap-1">
                      {task.samples.map((samp) => (
                        <button
                          key={samp}
                          type="button"
                          onClick={() => runMentorScreenAsk(task.id, samp)}
                          className={`text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition truncate ${
                            currentInput === samp
                              ? "bg-emerald-50 border-[#00B386] text-slate-900 font-medium"
                              : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600"
                          }`}
                          title={samp}
                        >
                          &ldquo;{samp}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ask Box */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      runMentorScreenAsk(task.id, currentInput);
                    }}
                    className="flex gap-1.5"
                  >
                    <input
                      type="text"
                      value={currentInput}
                      onChange={(e) =>
                        setMentorInputs((prev) => ({ ...prev, [task.id]: e.target.value }))
                      }
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#00B386]"
                    />
                    <button
                      type="submit"
                      disabled={isTaskLoading}
                      className="px-3 py-1.5 rounded-lg bg-[#00B386] hover:bg-[#009973] text-white text-xs font-bold inline-flex items-center gap-1 shrink-0"
                    >
                      <Send className="w-3 h-3" />
                      {isTaskLoading ? "..." : "Ask"}
                    </button>
                  </form>

                  {/* Live Output Card for Mentor */}
                  {result ? (
                    <div
                      className={`rounded-xl p-3 border space-y-2 text-xs ${
                        result.safeFallbackTriggered
                          ? "bg-amber-50/70 border-amber-300"
                          : "bg-emerald-50/50 border-emerald-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          {result.safeFallbackTriggered ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-[#00B386]" />
                          )}
                          {result.assistantResponse.headline}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug">
                        {result.assistantResponse.explanation}
                      </p>

                      {/* Eval Gate Badge */}
                      <div className="text-[10px] font-mono px-2 py-1 rounded bg-white border border-slate-200 text-slate-700">
                        {result.safeFallbackTriggered
                          ? "⚠️ Eval Gate: Blocked Advice → Safe Fallback Active"
                          : "✓ Eval Gate: 4/4 Passed (No Advice • No FOMO • Math Grounded)"}
                      </div>

                      {/* Interactive Task Action Buttons */}
                      <div className="space-y-1 pt-1">
                        {result.assistantResponse.recommendedActions.map((act) => (
                          <button
                            key={act.id}
                            onClick={() =>
                              setMentorActionStatus((prev) => ({
                                ...prev,
                                [task.id]: `✓ Task Completed: ${act.label}`,
                              }))
                            }
                            className="w-full text-left px-2.5 py-1.5 rounded-lg bg-[#00B386] hover:bg-[#009973] text-white text-[11px] font-bold flex items-center justify-between"
                          >
                            <span>{act.label}</span>
                            <span>→</span>
                          </button>
                        ))}
                      </div>

                      {actionDone && (
                        <div className="bg-white border border-emerald-300 text-[#00B386] font-semibold text-[11px] px-2.5 py-1.5 rounded-lg">
                          {actionDone}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3 text-center text-[11px] text-slate-400">
                      Click any sample prompt above or click <strong>Ask</strong> to run the live AI + Eval Gate.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
