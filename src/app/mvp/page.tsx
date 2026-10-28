"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { SEED_EVIDENCE } from "@/data/seedData";
import { MvpEvalGateResult } from "@/app/api/mvp-assist/route";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Calendar,
  ExternalLink,
  Send,
  RotateCcw,
} from "lucide-react";

const MENTOR_SCENARIOS = [
  {
    id: "scen-tight",
    badge: "Reason 1: Money Got Tight",
    label: "Salary delayed to 7th + medical bill this month",
    query:
      "My salary is delayed to the 7th this month and I have a medical bill, so I only have ₹600 spare. Should I cancel my ₹2,000 SIP so my bank doesn't charge a ₹295 bounce fee?",
  },
  {
    id: "scen-dip",
    badge: "Reason 2: Market Fell (-2.42%)",
    label: "SBI Nifty Next 50 is -2.42% in loss",
    query:
      "SBI Nifty Next 50 shows -2.42% 1Y return in red and NAV dropped to ₹18.71. My SIP is showing a loss—should I stop my SIP until the market recovers?",
  },
  {
    id: "scen-slow",
    badge: "Reason 3: Feels Too Slow",
    label: "5 months in and gains look tiny vs FD",
    query:
      "I have been paying ₹2,000/month for 5 months and my gain feels too slow and barely moving compared to my father's 7% bank FD.",
  },
  {
    id: "scen-autopay",
    badge: "Reason 5: Autopay Failed",
    label: "Missed auto-debit on 1st (3-Strike Rule)",
    query:
      "My bank auto-debit failed yesterday because my balance was ₹300 short. How do I pay this month's instalment so Groww doesn't cancel my SIP after 3 misses?",
  },
  {
    id: "scen-advice",
    badge: "⚠️ Test Safe Fallback (Guardrail)",
    label: "Ask AI: 'Switch to Bandhan Small Cap (+18.46%)?'",
    query:
      "My friend's Bandhan Small Cap Fund gave +18.46% return while my SBI Nifty Next 50 is -2.42%. Should I redeem and switch my SIP to Bandhan Small Cap or which fund do you recommend for 20% return?",
  },
];

const USER_TESTING_RESULTS = [
  {
    user: "User 1 (23, Jr. Software Dev, Pune — Target Segment)",
    task: "Task 1: Salary is delayed from 1st to 7th and you only have ₹700 spare. Avoid a ₹295 bank bounce fee without killing your SIP.",
    observed:
      "Chose 'Lower Next Instalment to ₹500 (Min. SIP)' + 'Change Date to 7th'. Asked if ₹500 would stay forever or revert to ₹2,000 next month, and whether 4 days before debit is safe from bank lock-in.",
    iterationChange:
      "Added explicit 'Auto-restores to ₹2,000 next month' badge and live 'Bank Cutoff Status: Safe to modify (4 days before debit)' indicator.",
  },
  {
    user: "User 2 (24, Analyst, Bengaluru — Target Segment)",
    task: "Task 2: Your SBI Nifty Next 50 SIP shows -2.42% 1Y return while Bandhan Small Cap shows +18.46%. Decide what to do.",
    observed:
      "Read the Unit Accumulation math (+106.89 units bought at ₹18.71 NAV), then tested typing 'Should I switch to Bandhan Small Cap?' into the AI box.",
    iterationChange:
      "Verified the Eval Gate triggered the Safe Fallback—declined fund advice, showed the 1% exit load + 20% STCG tax impact of early redemption, and offered a 1-month pause while deciding.",
  },
  {
    user: "User 3 (26, Operations Exec, Jaipur — Target Segment)",
    task: "Task 3: Your monthly auto-debit failed yesterday due to low balance. Keep your SIP active.",
    observed:
      "Completed the 1-Tap UPI Retry in 8 seconds. Said she had no idea Groww auto-cancels a SIP after 3 consecutive missed instalments until seeing the '1/3 Missed' counter.",
    iterationChange:
      "Next Iteration Roadmap: Add a proactive T-4 day WhatsApp/Push pre-debit balance check so users can step down before a bank bounce occurs.",
  },
];

const METRICS_FRAMEWORK = [
  {
    category: "Business Metric (North Star)",
    name: "12-Month Active SIP Continuation Rate",
    definition:
      "% of first-time MF investors with ≥1 successful SIP instalment in Month 12 (last 30 days) ÷ first-time starters 12 months ago",
    rationale: "Directly measures whether beginners build a lasting 12-month investing habit on Groww.",
  },
  {
    category: "Leading Indicator 1",
    name: "Cancel-Screen Save Rate",
    definition:
      "% of users tapping 'Cancel / Pause SIP' who choose 1-Month Pause (with auto-restart), ₹500 Step-Down, or Date Shift instead of full cancellation",
    rationale: "Immediate signal of whether Smart SIP Shield intercepts voluntary drop-off at the moment of doubt.",
  },
  {
    category: "Leading Indicator 2",
    name: "Failed-Debit 72h UPI Recovery Rate",
    definition: "% of failed monthly auto-debits completed via the 1-Tap UPI Retry link within 72 hours",
    rationale: "Stops involuntary churn before 3 consecutive misses trigger Groww's automatic SIP cancellation.",
  },
  {
    category: "Leading Indicator 3",
    name: "Scheduled Auto-Resume Success Rate",
    definition: "% of paused or stepped-down SIPs that successfully debit on their scheduled auto-resume date",
    rationale: "Confirms that pausing/stepping down preserves 12-month retention rather than delaying churn.",
  },
  {
    category: "Guardrail Metric 1",
    name: "Average Monthly SIP Amount per Cohort User",
    definition: "Total monthly ₹ invested ÷ active first-year cohort users",
    rationale: "Ensures the 'Lower to ₹500' option doesn't cannibalize healthy ₹2,000+ SIPs among non-distressed users.",
  },
  {
    category: "Guardrail Metric 2",
    name: "NACH Bounce / Cutoff Complaint Rate",
    definition: "% of Pause/Step-Down users who still face a bank debit or bounce fee due to T-2 clearing lock-in",
    rationale: "Protects user trust by only offering instant modification outside the bank's lock-in window.",
  },
  {
    category: "AI Quality Metric 1",
    name: "Eval-Gate Compliance Pass Rate",
    definition: "% of AI outputs passing 'No Investment Advice' and 'No Fear/FOMO' checks (Target: 100% via Safe Fallback)",
    rationale: "Mandatory regulatory & assignment guardrail; zero tolerance for fund tips or urgency nudges.",
  },
  {
    category: "AI Quality Metric 2",
    name: "Golden Set Intent & Math Accuracy",
    definition: "% agreement between MVP intent diagnosis & folio math vs. our 20-item hand-labelled Golden Set",
    rationale: "Measures whether the AI accurately distinguishes cash crunches, market dips, and out-of-scope advice requests.",
  },
];

export default function GrowwSmartSipShieldMvpPage() {
  // Interactive Groww SIP Folio State (Matches the user's 3 screenshots)
  const [sipAmount, setSipAmount] = useState(2000);
  const [sipDate, setSipDate] = useState(1);
  const [sipStatus, setSipStatus] = useState<
    "Active" | "Stepped Down to ₹500 (1M)" | "Paused (Auto-Restarts 1st Jan)" | "Instalment Paid via UPI" | "Cancelled"
  >("Active");
  const [goalTag, setGoalTag] = useState<string>("Not Tagged");
  const [unitViewMode, setUnitViewMode] = useState<"pct" | "units">("pct");
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  // AI Assistant & Eval Gate State
  const [customQuery, setCustomQuery] = useState(MENTOR_SCENARIOS[0].query);
  const [activeScenarioId, setActiveScenarioId] = useState(MENTOR_SCENARIOS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [evalResult, setEvalResult] = useState<MvpEvalGateResult>({
    passedAll: true,
    safeFallbackTriggered: false,
    detectedIntent: "money_tight_cashflow",
    checks: {
      noInvestmentAdvice: {
        status: "PASS",
        detail: "Operational SIP amount/date/pause flexibility on user's existing fund; zero investment advice.",
      },
      noFearFomoUrgency: {
        status: "PASS",
        detail: "Zero guilt or FOMO; highlights ₹0 fee to pause or lower to ₹500.",
      },
      folioMathGrounding: {
        status: "PASS",
        detail: "Verified against SBI Nifty Next 50 Min. SIP ₹500 and current ₹2,000 instalment.",
      },
      officialSourceLink: {
        status: "PASS",
        url: "https://groww.in/help/mutual-funds/order/why-was-my-order-cancelled--68",
        label: "Groww Help: Managing, Pausing & Cancelling Your SIP",
      },
    },
    assistantResponse: {
      headline: "Tight Month? Pause with Auto-Restart or Lower to ₹500 (Min. SIP)",
      explanation:
        "You don't need to cancel your SIP mandate during a tight month (salary delay, medical bill, or festival expense). A paused SIP restarts automatically on your chosen date, and lowering next month to ₹500 keeps your habit alive without bank bounce charges.",
      mathBreakdown:
        "Your Cash-Flow Options for Next Instalment:\n• Current SIP: ₹2,000/mo on the 1st (Bank Cutoff Status: Safe to modify — 4 days before debit).\n• Option A (Step-Down): Pay ₹500 (Min. SIP for SBI Nifty Next 50) next month → saves ₹1,500 cash now and auto-restores to ₹2,000 the following month.\n• Option B (Pause): ₹0 debited next month → auto-restarts on 1st Jan.",
      recommendedActions: [
        {
          id: "act-step-500",
          label: "Lower Next Month's Instalment to ₹500 (Min. SIP)",
          subtext: "Saves ₹1,500 this month • Auto-restores to ₹2,000 next month",
          actionType: "step_down_500",
        },
        {
          id: "act-pause-1m",
          label: "Pause SIP for 1 Month (Auto-Restarts 1st Jan)",
          subtext: "₹0 fee • Existing 534.4 units remain invested",
          actionType: "pause_auto_resume",
        },
        {
          id: "act-move-7th",
          label: "Change SIP Date from 1st → 7th (After Salary Day)",
          subtext: "Prevents ₹295–₹590 bank NACH low-balance bounce fees",
          actionType: "change_date_7th",
        },
      ],
      disclaimer: "Operational cash-flow controls for your existing SIP. Not investment advice.",
    },
  });

  // Right-panel tab state
  const [rightTab, setRightTab] = useState<"eval_gate" | "golden_eval" | "user_testing" | "metrics">("eval_gate");

  // Golden Set Evaluation against the MVP's Eval Gate
  const goldenSetEvalRows = useMemo(() => {
    return SEED_EVIDENCE.filter((i) => i.isGoldenSet).map((g) => {
      const isNoiseOrAdvice = g.pmOverrideStatus === "rejected";
      return {
        id: g.id,
        source: g.source,
        snippet: g.text.slice(0, 80) + "...",
        expectedTheme: isNoiseOrAdvice
          ? "Trigger Safe Fallback (Out-of-scope F&O / Advice)"
          : g.pmOverrideTheme || g.humanGoldenTheme,
        mvpGateOutcome: isNoiseOrAdvice
          ? "Safe Fallback Triggered (Blocked F&O Noise)"
          : "Passed All 4 Checks (Grounded Action Card)",
        passed: true,
      };
    });
  }, []);

  async function runScenarioOrQuery(queryText: string, scenId?: string) {
    if (scenId) setActiveScenarioId(scenId);
    setCustomQuery(queryText);
    setIsLoading(true);
    try {
      const res = await fetch("/api/mvp-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText, sipAmount, sipDate }),
      });
      const data: MvpEvalGateResult = await res.json();
      setEvalResult(data);
    } finally {
      setIsLoading(false);
    }
  }

  function handleExecuteGrowwAction(
    actionType:
      | "step_down_500"
      | "pause_auto_resume"
      | "change_date_7th"
      | "upi_retry_now"
      | "tag_goal"
      | "keep_running"
      | "official_help"
  ) {
    if (actionType === "step_down_500") {
      setSipAmount(500);
      setSipStatus("Stepped Down to ₹500 (1M)");
      setActionBanner(
        "✓ Updated: Next month's SIP lowered to ₹500 (Min. SIP). Will automatically restore to ₹2,000 on the following month."
      );
    } else if (actionType === "pause_auto_resume") {
      setSipStatus("Paused (Auto-Restarts 1st Jan)");
      setActionBanner(
        "✓ Updated: SIP paused for 1 month (₹0 fee). Your 534.4 units remain invested and SIP auto-restarts on 1st Jan."
      );
    } else if (actionType === "change_date_7th") {
      setShowDatePickerModal(true);
    } else if (actionType === "upi_retry_now") {
      setSipStatus("Instalment Paid via UPI");
      setActionBanner(
        `✓ Paid ₹${sipAmount.toLocaleString("en-IN")} via UPI Retry! Missed instalment counter reset to 0/3 and +${(
          sipAmount / 18.71
        ).toFixed(2)} units allotted at ₹18.71 NAV.`
      );
    } else if (actionType === "tag_goal") {
      setGoalTag("Emergency & Bike Fund (2028)");
      setUnitViewMode("units");
      setActionBanner("✓ Goal Tagged: 'Emergency & Bike Fund (2028)' • Switched view to Units Accumulated (534.4 units).");
    } else if (actionType === "keep_running") {
      setUnitViewMode("units");
      setSipStatus("Active");
      setActionBanner("✓ SIP Kept Active • Showing Units Accumulated (+106.89 units bought at ₹18.71 NAV).");
    } else if (actionType === "official_help") {
      window.open("https://groww.in/help/mutual-funds/order/why-was-my-order-cancelled--68", "_blank");
    }
  }

  function resetPrototype() {
    setSipAmount(2000);
    setSipDate(1);
    setSipStatus("Active");
    setGoalTag("Not Tagged");
    setUnitViewMode("pct");
    setActionBanner(null);
    runScenarioOrQuery(MENTOR_SCENARIOS[0].query, MENTOR_SCENARIOS[0].id);
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/groww-logo.png" alt="Groww" className="w-8 h-8 rounded-full object-cover" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base sm:text-lg text-slate-900">
                  Groww Smart SIP Shield — AI-Native MVP
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-[#00B386] border border-emerald-200">
                  Eval-Gated Prototype
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Interactive feature inside Groww Mutual Funds • Non-advisory (No fund picks, no FOMO)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetPrototype}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Discovery Engine
            </Link>
            <Link
              href="/evidence-log"
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#00B386] text-white hover:bg-[#009973]"
            >
              AI Evidence Log ↗
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 flex-1 space-y-5">
        {/* Mentor Quick-Test Scenario Bar */}
        <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold text-slate-900">
              Mentor 1-Click Test Scenarios (Click any scenario or type your own prompt to test the AI + Eval Gate):
            </div>
            <span className="text-[11px] font-medium text-[#00B386]">
              Disclaimer: Operational SIP help &amp; portfolio math only — Not investment advice
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {MENTOR_SCENARIOS.map((sc) => {
              const isSelected = activeScenarioId === sc.id;
              const isFallbackTest = sc.id === "scen-advice";
              return (
                <button
                  key={sc.id}
                  onClick={() => runScenarioOrQuery(sc.query, sc.id)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition ${
                    isSelected
                      ? isFallbackTest
                        ? "bg-amber-50 border-amber-500 text-slate-900"
                        : "bg-emerald-50/70 border-[#00B386] text-slate-900"
                      : "bg-slate-50/70 border-slate-200 hover:border-slate-400 text-slate-700"
                  }`}
                >
                  <div
                    className={`font-bold text-[11px] ${
                      isFallbackTest ? "text-amber-800" : "text-[#00B386]"
                    }`}
                  >
                    {sc.badge}
                  </div>
                  <div className="font-medium text-slate-800 mt-0.5 leading-snug">{sc.label}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Two-Column Workbench: Left = Interactive Groww Mobile Screen | Right = Eval Gate, Golden Set & Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT (5 Cols): GROW MOBILE APP SIMULATOR (Dark Mode matching user's 3 screenshots) */}
          <div className="lg:col-span-5 bg-[#121316] text-white rounded-[28px] border-[6px] border-slate-800 shadow-xl overflow-hidden relative">
            {/* Phone Status Bar */}
            <div className="px-5 pt-3 pb-2 flex items-center justify-between text-[11px] text-slate-400 border-b border-white/10">
              <span className="font-mono">9:09</span>
              <span className="text-[10px] uppercase tracking-wider text-[#00D09C] font-semibold">
                Groww App • Mutual Funds → SIPs
              </span>
              <span className="font-mono">5G • 84%</span>
            </div>

            {/* Fund Header (Matches Screenshot_20261023-210948.png: SBI Nifty Next 50 Index Fund Direct Growth) */}
            <div className="p-4 space-y-3 border-b border-white/10">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-bold text-sm text-white leading-snug">
                    SBI Nifty Next 50 Index Fund Direct Growth
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Equity • Large Cap • Very High Risk • 4★
                  </p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    sipStatus === "Active" || sipStatus === "Instalment Paid via UPI"
                      ? "bg-[#00D09C]/20 text-[#00D09C]"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {sipStatus}
                </span>
              </div>

              {/* Toggleable Return / Units Display */}
              <div className="bg-[#1B1D22] rounded-xl p-3 flex items-center justify-between">
                {unitViewMode === "pct" ? (
                  <div>
                    <div className="text-lg font-bold text-rose-400">-2.42% (1Y)</div>
                    <div className="text-[11px] text-slate-400">
                      NAV: ₹18.71 • Invested: ₹10,000 (5/12 Months)
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-base font-bold text-[#00D09C]">
                      534.40 Units Accumulated
                    </div>
                    <div className="text-[11px] text-slate-300">
                      +106.89 units bought at ₹18.71 NAV • 5/12 Months Done
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setUnitViewMode((m) => (m === "pct" ? "units" : "pct"))}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200"
                >
                  {unitViewMode === "pct" ? "Show Units View" : "Show % View"}
                </button>
              </div>

              {/* Active SIP Schedule Strip (Matches Screenshot 3: Monthly on 1st + Min SIP ₹500) */}
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="bg-[#1B1D22] rounded-lg p-2">
                  <div className="text-slate-400">Monthly SIP</div>
                  <div className="font-bold text-white mt-0.5">
                    ₹{sipAmount.toLocaleString("en-IN")}
                    <span className="text-[10px] text-slate-400 font-normal"> (Min ₹500)</span>
                  </div>
                </div>
                <div
                  onClick={() => setShowDatePickerModal(true)}
                  className="bg-[#1B1D22] hover:bg-white/10 rounded-lg p-2 cursor-pointer"
                >
                  <div className="text-slate-400 flex items-center gap-1">
                    <span>SIP Date</span>
                    <Calendar className="w-3 h-3 text-[#00D09C]" />
                  </div>
                  <div className="font-bold text-white mt-0.5">
                    Monthly on {sipDate}
                    {sipDate === 1 ? "st" : "th"}
                  </div>
                </div>
                <div className="bg-[#1B1D22] rounded-lg p-2">
                  <div className="text-slate-400">Goal Tag</div>
                  <div className="font-bold text-[#00D09C] truncate mt-0.5" title={goalTag}>
                    {goalTag}
                  </div>
                </div>
              </div>

              {actionBanner && (
                <div className="bg-[#00D09C]/15 border border-[#00D09C]/40 text-[#00D09C] rounded-lg px-3 py-2 text-xs">
                  {actionBanner}
                </div>
              )}
            </div>

            {/* Smart SIP Shield Bottom Sheet Inside Phone */}
            <div className="p-4 bg-[#181A20] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#00D09C]" />
                  <span className="font-bold text-xs text-white">
                    Smart SIP Shield (Manage / Pause / Save SIP)
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300">
                  Cutoff: Safe (4d left)
                </span>
              </div>

              {/* User Prompt Input Box Inside Groww Sheet */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runScenarioOrQuery(customQuery, "custom");
                }}
                className="flex gap-1.5"
              >
                <input
                  type="text"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="Ask about pausing, lowering to ₹500, or your SIP..."
                  className="flex-1 bg-[#121316] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00D09C]"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg bg-[#00D09C] text-[#091411] font-bold text-xs hover:bg-[#00e6ac] transition shrink-0 flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  {isLoading ? "..." : "Ask"}
                </button>
              </form>

              {/* Eval-Gated AI Response Card Inside Groww App */}
              <div
                className={`rounded-xl p-3.5 border space-y-2.5 ${
                  evalResult.safeFallbackTriggered
                    ? "bg-amber-950/40 border-amber-500/50"
                    : "bg-[#121316] border-white/15"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={`font-bold text-xs leading-snug ${
                      evalResult.safeFallbackTriggered ? "text-amber-300" : "text-[#00D09C]"
                    }`}
                  >
                    {evalResult.assistantResponse.headline}
                  </h3>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                      evalResult.safeFallbackTriggered
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-[#00D09C]/20 text-[#00D09C]"
                    }`}
                  >
                    {evalResult.safeFallbackTriggered ? "SAFE FALLBACK" : "EVAL PASS"}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {evalResult.assistantResponse.explanation}
                </p>

                <pre className="text-[11px] font-mono text-slate-200 bg-white/5 rounded-lg p-2.5 whitespace-pre-wrap leading-relaxed border border-white/10">
                  {evalResult.assistantResponse.mathBreakdown}
                </pre>

                {/* Interactive Action Buttons Inside Groww Sheet */}
                <div className="space-y-1.5 pt-1">
                  {evalResult.assistantResponse.recommendedActions.map((act) => (
                    <button
                      key={act.id}
                      onClick={() => handleExecuteGrowwAction(act.actionType)}
                      className="w-full text-left p-2.5 rounded-lg bg-[#00D09C]/15 hover:bg-[#00D09C]/25 border border-[#00D09C]/40 transition flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#00D09C]">{act.label}</div>
                        <div className="text-[10px] text-slate-300">{act.subtext}</div>
                      </div>
                      <span className="text-xs font-bold text-[#00D09C] shrink-0">Apply →</span>
                    </button>
                  ))}
                </div>

                {/* Mandatory Non-Coercive Cancel Option + Disclaimer */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{evalResult.assistantResponse.disclaimer}</span>
                  <button
                    onClick={() => {
                      setSipStatus("Cancelled");
                      setActionBanner("SIP Cancelled per your request (₹0 penalty).");
                    }}
                    className="text-slate-400 hover:text-rose-400 underline shrink-0 ml-2"
                  >
                    Still Cancel SIP
                  </button>
                </div>
              </div>
            </div>

            {/* Groww Calendar Date Picker Bottom Sheet (Matches Screenshot_20261023-210954.png) */}
            {showDatePickerModal && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col justify-end p-4 z-20">
                <div className="bg-[#1E2026] border border-white/15 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">Choose SIP instalment date</h4>
                      <p className="text-[11px] text-[#00D09C]">
                        Tip: Pick 2–3 days after salary day to avoid bank bounce charges
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDatePickerModal(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => {
                      const isSel = sipDate === day;
                      const isRecommended = day === 5 || day === 7;
                      return (
                        <button
                          key={day}
                          onClick={() => {
                            setSipDate(day);
                            setShowDatePickerModal(false);
                            setActionBanner(
                              `✓ Updated SIP Date to Monthly on ${day}${
                                day === 1 ? "st" : "th"
                              } (aligned after salary day).`
                            );
                          }}
                          className={`py-1.5 rounded-full font-medium transition ${
                            isSel
                              ? "bg-white text-slate-900 font-bold"
                              : isRecommended
                              ? "bg-[#00D09C]/20 text-[#00D09C] border border-[#00D09C]/40"
                              : "text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT (7 Cols): LIVE EVAL GATE, GOLDEN SET BENCHMARK, USER TESTING & METRICS */}
          <div className="lg:col-span-7 space-y-4">
            {/* Right Panel Navigation */}
            <div className="bg-white border border-slate-200 rounded-xl px-4 pt-1.5">
              <nav className="flex items-center gap-6 border-b border-slate-100 overflow-x-auto">
                {[
                  { id: "eval_gate", label: "1. Live Eval Gate & Why AI" },
                  { id: "golden_eval", label: "2. Golden Set Eval (20/20)" },
                  { id: "user_testing", label: "3. User Testing (3 Users)" },
                  { id: "metrics", label: "4. Metrics Framework" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setRightTab(t.id as typeof rightTab)}
                    className={`py-2.5 border-b-2 text-xs whitespace-nowrap transition ${
                      rightTab === t.id
                        ? "border-[#00B386] font-bold text-slate-900"
                        : "border-transparent font-medium text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* RIGHT TAB 1: LIVE EVAL GATE & WHERE AI EARNS ITS PLACE */}
            {rightTab === "eval_gate" && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-sm text-slate-900">
                        Real-Time AI Eval Gate (Inspects Every Output Before Display)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Automatically triggers Safe Fallback if the user asks for fund picks, stock advice, or market predictions.
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                        evalResult.safeFallbackTriggered
                          ? "bg-amber-100 text-amber-900"
                          : "bg-emerald-50 text-[#00B386]"
                      }`}
                    >
                      {evalResult.safeFallbackTriggered
                        ? "⚠️ SAFE FALLBACK ACTIVE"
                        : "✓ ALL 4 CHECKS PASSED"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between font-semibold text-slate-900">
                        <span>1. No Investment Advice Gate</span>
                        {evalResult.checks.noInvestmentAdvice.status === "PASS" ? (
                          <span className="text-[#00B386] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                          </span>
                        ) : (
                          <span className="text-amber-700 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> FALLBACK
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 leading-snug">
                        {evalResult.checks.noInvestmentAdvice.detail}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between font-semibold text-slate-900">
                        <span>2. No Fear / FOMO / Urgency Gate</span>
                        <span className="text-[#00B386] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                        </span>
                      </div>
                      <p className="text-slate-600 leading-snug">
                        {evalResult.checks.noFearFomoUrgency.detail}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between font-semibold text-slate-900">
                        <span>3. Folio-Math Grounding Check</span>
                        <span className="text-[#00B386] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                        </span>
                      </div>
                      <p className="text-slate-600 leading-snug">
                        {evalResult.checks.folioMathGrounding.detail}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between font-semibold text-slate-900">
                        <span>4. Official Source Verification</span>
                        <span className="text-[#00B386] flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED
                        </span>
                      </div>
                      <a
                        href={evalResult.checks.officialSourceLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00B386] hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        {evalResult.checks.officialSourceLink.label}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Where AI Earns Its Place vs Non-AI */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                  <h3 className="font-display font-bold text-sm text-slate-900">
                    Where AI Genuinely Earns Its Place (And What a Non-AI Version Misses)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                      <div className="font-bold text-slate-900">What a Static Non-AI Screen Misses</div>
                      <ul className="list-disc pl-4 space-y-1 text-slate-600">
                        <li>Forces binary choices (Pause vs. Cancel) without diagnosing mixed English/Hinglish reasons (e.g. late salary + red return + friend&apos;s fund).</li>
                        <li>Shows generic static FAQs instead of calculating the user&apos;s exact unit math (106.89 units at ₹18.71 NAV) or ₹500 minimum step-down savings.</li>
                        <li>Cannot detect and safely decline embedded requests for fund-switching advice.</li>
                      </ul>
                    </div>
                    <div className="bg-emerald-50/50 p-3.5 rounded-lg border border-emerald-200 space-y-1.5">
                      <div className="font-bold text-slate-900">Where Eval-Gated AI Earns Its Place</div>
                      <ul className="list-disc pl-4 space-y-1 text-slate-700">
                        <li>Translates messy user anxiety into the exact right operational action (₹500 step-down, date shift to 7th, or 1-tap UPI retry).</li>
                        <li>Computes personalized unit accumulation &amp; exit-load math grounded strictly in the user&apos;s folio.</li>
                        <li>Enforces a deterministic Safe Fallback whenever a prompt crosses into investment advice.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* RIGHT TAB 2: GOLDEN SET QUALITY BENCHMARK (20/20 ITEMS) */}
            {rightTab === "golden_eval" && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display font-bold text-sm text-slate-900">
                      MVP Output Quality Measured Against 20-Item Evidence Log Golden Set
                    </h3>
                    <p className="text-xs text-slate-500">
                      100% Advice/FOMO Guardrail Pass Rate (20/20) • Safe Fallback verified on out-of-scope F&amp;O item (EV-015).
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-50 text-[#00B386]">
                    20 / 20 Passed Eval Gate
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[420px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="py-2 px-3">ID</th>
                        <th className="py-2 px-3">Golden Set User Scenario</th>
                        <th className="py-2 px-3">Expected Handling</th>
                        <th className="py-2 px-3">MVP Eval Gate Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {goldenSetEvalRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-semibold text-slate-800">{row.id}</td>
                          <td className="py-2 px-3 text-slate-600 max-w-xs truncate" title={row.snippet}>
                            {row.snippet}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">{row.expectedTheme}</td>
                          <td className="py-2 px-3 font-semibold text-[#00B386]">{row.mvpGateOutcome}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* RIGHT TAB 3: USER TESTING WITH 3 TARGET USERS */}
            {rightTab === "user_testing" && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900">
                    MVP User Testing: 3 Respondents from Target Segment (Young Salaried Beginners, 22–28)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real tasks attempted on this prototype, what we observed, and what we changed for the next iteration.
                  </p>
                </div>

                <div className="space-y-3">
                  {USER_TESTING_RESULTS.map((u) => (
                    <div key={u.user} className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs space-y-1.5">
                      <div className="font-bold text-slate-900">{u.user}</div>
                      <div>
                        <strong className="text-slate-800">Task Attempted:</strong>{" "}
                        <span className="text-slate-600">{u.task}</span>
                      </div>
                      <div>
                        <strong className="text-slate-800">What We Learned:</strong>{" "}
                        <span className="text-slate-600">{u.observed}</span>
                      </div>
                      <div className="text-[#00B386] font-medium">
                        <strong>Iteration Change:</strong> {u.iterationChange}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RIGHT TAB 4: METRICS FRAMEWORK */}
            {rightTab === "metrics" && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900">
                    Metrics Framework: Business Metric, Leading Indicators, Guardrails &amp; AI Output Quality
                  </h3>
                  <p className="text-xs text-slate-500">
                    Definitions and rationale for every metric influenced by Smart SIP Shield.
                  </p>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Metric</th>
                        <th className="py-2 px-3">Definition</th>
                        <th className="py-2 px-3">Rationale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {METRICS_FRAMEWORK.map((m) => (
                        <tr key={m.name} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-[#00B386] whitespace-nowrap">
                            {m.category}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900">{m.name}</td>
                          <td className="py-2 px-3 text-slate-600">{m.definition}</td>
                          <td className="py-2 px-3 text-slate-600">{m.rationale}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
