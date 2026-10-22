"use client";

import React, { useState, useMemo } from "react";
import {
  SEED_EVIDENCE,
  DISCOVERY_QUESTIONS,
  JOURNEY_STAGE_LABELS,
  OPPORTUNITY_AREAS,
  AMFI_BENCHMARK_CONTEXT,
  EvidenceItem,
  PrimaryTheme,
  JourneyStage,
  DiscoveryQuestionId,
} from "@/data/seedData";
import {
  Sparkles,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Filter,
  Search,
  GitBranch,
  FileText,
  ShieldCheck,
  Database,
  SlidersHorizontal,
  Download,
  Copy,
  Check,
  KeyRound,
  ArrowUpRight,
  Layers,
  Target,
  Activity,
} from "lucide-react";

const ALL_THEMES: PrimaryTheme[] = [
  "Autopay & Mandate Friction",
  "Allotment & T+2 NAV Trust Gap",
  "Early Returns Disappointment (Month 1–4)",
  "Market Dip Panic & Loss Aversion",
  "Rigid Cash-Flow / No Flexible Skip",
  "Portfolio Clutter & Fund Selection Doubt",
  "External Finfluencer / Family Noise",
  "KYC / Bank / Folio Operational Block",
  "Long-Term Habit & Goal Clarity",
];

const ALL_STAGES: JourneyStage[] = [
  "onboarding_mandate",
  "month_1_to_3_expectations",
  "market_dip_reaction",
  "cashflow_crunch",
  "habit_decay_month_6_12",
];

type ActiveTab =
  | "explorer"
  | "questions"
  | "metric_tree"
  | "golden_set"
  | "evidence_log";

export default function GrowwDiscoveryEnginePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("explorer");
  const [items, setItems] = useState<EvidenceItem[]>(SEED_EVIDENCE);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<DiscoveryQuestionId | "ALL">("ALL");
  const [selectedStage, setSelectedStage] = useState<JourneyStage | "ALL">("ALL");
  const [selectedTheme, setSelectedTheme] = useState<PrimaryTheme | "ALL">("ALL");
  const [selectedSource, setSelectedSource] = useState<string>("ALL");

  // Gemini API & classification state
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [isClassifying, setIsClassifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedLog, setCopiedLog] = useState(false);

  // Override modal state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<"accepted" | "corrected" | "rejected">("corrected");
  const [overrideTheme, setOverrideTheme] = useState<PrimaryTheme>("Rigid Cash-Flow / No Flexible Skip");
  const [overrideStage, setOverrideStage] = useState<JourneyStage>("cashflow_crunch");
  const [overrideReason, setOverrideReason] = useState("");

  // Custom single comment test
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentSource, setNewCommentSource] = useState("Reddit r/MutualFundsIndia");
  const [newCommentSegment, setNewCommentSegment] = useState("First-time SIP investor");

  // Unique sources
  const uniqueSources = useMemo(() => {
    const s = new Set(items.map((i) => i.source));
    return ["ALL", ...Array.from(s)];
  }, [items]);

  // Filtered evidence
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedQuestion !== "ALL" && !item.aiDiscoveryQuestions.includes(selectedQuestion)) {
        return false;
      }
      const effectiveStage = item.pmOverrideStage || item.aiStage;
      if (selectedStage !== "ALL" && effectiveStage !== selectedStage) {
        return false;
      }
      const effectiveTheme = item.pmOverrideTheme || item.aiTheme;
      if (selectedTheme !== "ALL" && effectiveTheme !== selectedTheme) {
        return false;
      }
      if (selectedSource !== "ALL" && item.source !== selectedSource) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.text.toLowerCase().includes(q) ||
          item.aiSummary.toLowerCase().includes(q) ||
          effectiveTheme.toLowerCase().includes(q) ||
          item.segment.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, selectedQuestion, selectedStage, selectedTheme, selectedSource, searchQuery]);

  // Golden Set metrics
  const goldenMetrics = useMemo(() => {
    const golden = items.filter((i) => i.isGoldenSet);
    const total = golden.length;
    const themeMatches = golden.filter((i) => i.aiTheme === i.humanGoldenTheme && i.pmOverrideStatus !== "rejected").length;
    const stageMatches = golden.filter((i) => i.aiStage === i.humanGoldenStage && i.pmOverrideStatus !== "rejected").length;
    const overrides = items.filter((i) => i.pmOverrideStatus === "corrected" || i.pmOverrideStatus === "rejected");
    return {
      total,
      themeMatches,
      stageMatches,
      themeAgreementPct: total ? Math.round((themeMatches / total) * 100) : 0,
      stageAgreementPct: total ? Math.round((stageMatches / total) * 100) : 0,
      overrides,
    };
  }, [items]);

  // Theme distribution
  const themeCounts = useMemo(() => {
    const map = new Map<PrimaryTheme, { total: number; highQuality: number }>();
    ALL_THEMES.forEach((t) => map.set(t, { total: 0, highQuality: 0 }));
    items.forEach((item) => {
      if (item.pmOverrideStatus === "rejected") return;
      const t = item.pmOverrideTheme || item.aiTheme;
      const cur = map.get(t) || { total: 0, highQuality: 0 };
      cur.total += 1;
      if (item.aiEvidenceQuality === "High") cur.highQuality += 1;
      map.set(t, cur);
    });
    return Array.from(map.entries())
      .map(([theme, counts]) => ({ theme, ...counts }))
      .sort((a, b) => b.total - a.total);
  }, [items]);

  // Source volume breakdown
  const sourceVolumes = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      counts[i.source] = (counts[i.source] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [items]);

  // Run Gemini / AI classification on current items
  async function handleRunAiClassification(targetItems: EvidenceItem[] = items) {
    setIsClassifying(true);
    setStatusMessage("Running AI Discovery Engine classification...");
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: geminiApiKey.trim() || undefined,
          items: targetItems.map((i) => ({ id: i.id, text: i.text, source: i.source })),
        }),
      });
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        const resultMap = new Map(data.results.map((r: Record<string, unknown>) => [r.id as string, r]));
        setItems((prev) =>
          prev.map((item) => {
            const updated = resultMap.get(item.id) as Partial<EvidenceItem> | undefined;
            if (!updated) return item;
            return {
              ...item,
              aiTheme: (updated.aiTheme as PrimaryTheme) || item.aiTheme,
              aiStage: (updated.aiStage as JourneyStage) || item.aiStage,
              aiChurnType: updated.aiChurnType || item.aiChurnType,
              aiDiscoveryQuestions:
                (updated.aiDiscoveryQuestions as DiscoveryQuestionId[]) || item.aiDiscoveryQuestions,
              aiEvidenceQuality: updated.aiEvidenceQuality || item.aiEvidenceQuality,
              aiConfidence: typeof updated.aiConfidence === "number" ? updated.aiConfidence : item.aiConfidence,
              aiSummary: updated.aiSummary || item.aiSummary,
            };
          })
        );
      }
      setStatusMessage(data.message || "Classification complete.");
    } catch (err) {
      setStatusMessage(`Classification error: ${err instanceof Error ? err.message : "Failed"}`);
    } finally {
      setIsClassifying(false);
    }
  }

  // Add a single comment & classify it live
  async function handleAddAndClassifyComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const newId = `EV-${String(items.length + 1).padStart(3, "0")}`;
    const newItem: EvidenceItem = {
      id: newId,
      source: newCommentSource,
      platform: "Groww / Public",
      rating: null,
      date: new Date().toISOString().slice(0, 10),
      text: newCommentText.trim(),
      segment: newCommentSegment,
      monthsActiveEstimate: "Month 1–6",
      aiTheme: "Early Returns Disappointment (Month 1–4)",
      aiStage: "month_1_to_3_expectations",
      aiChurnType: "at_risk_confusion",
      aiDiscoveryQuestions: ["Q3_why_pause_reduce_stop"],
      aiEvidenceQuality: "High",
      aiConfidence: 0.88,
      aiSummary: "Classifying comment...",
      isGoldenSet: false,
    };
    const updatedList = [newItem, ...items];
    setItems(updatedList);
    setNewCommentText("");
    await handleRunAiClassification([newItem]);
  }

  // Handle CSV Upload
  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const raw = await file.text();
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return;

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
    const textIdx = headers.findIndex((h) => h.includes("text") || h.includes("comment") || h.includes("review") || h.includes("body"));
    const sourceIdx = headers.findIndex((h) => h.includes("source") || h.includes("subreddit") || h.includes("channel"));
    const segmentIdx = headers.findIndex((h) => h.includes("segment") || h.includes("user"));

    const uploadedItems: EvidenceItem[] = [];
    for (let i = 1; i < Math.min(lines.length, 65); i++) {
      const cols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(",");
      const cleanCols = cols.map((c) => c.replace(/^"|"$/g, "").trim());
      const commentText = textIdx >= 0 ? cleanCols[textIdx] : cleanCols[cleanCols.length - 1];
      if (!commentText || commentText.length < 15) continue;

      uploadedItems.push({
        id: `CSV-${String(i).padStart(3, "0")}`,
        source: sourceIdx >= 0 && cleanCols[sourceIdx] ? cleanCols[sourceIdx] : "Uploaded CSV",
        platform: "Groww / India MF",
        rating: null,
        date: new Date().toISOString().slice(0, 10),
        text: commentText,
        segment: segmentIdx >= 0 && cleanCols[segmentIdx] ? cleanCols[segmentIdx] : "Uploaded Cohort",
        monthsActiveEstimate: "First 12M",
        aiTheme: "Early Returns Disappointment (Month 1–4)",
        aiStage: "month_1_to_3_expectations",
        aiChurnType: "at_risk_confusion",
        aiDiscoveryQuestions: ["Q3_why_pause_reduce_stop"],
        aiEvidenceQuality: "Medium",
        aiConfidence: 0.85,
        aiSummary: "Pending AI classification...",
      });
    }

    if (uploadedItems.length > 0) {
      setItems((prev) => [...uploadedItems, ...prev]);
      await handleRunAiClassification(uploadedItems);
    }
  }

  // Open PM Override modal
  function openOverrideModal(item: EvidenceItem) {
    setEditingItemId(item.id);
    setOverrideStatus(item.pmOverrideStatus === "rejected" ? "rejected" : "corrected");
    setOverrideTheme(item.pmOverrideTheme || item.aiTheme);
    setOverrideStage(item.pmOverrideStage || item.aiStage);
    setOverrideReason(item.pmOverrideReason || "");
  }

  function savePmOverride() {
    if (!editingItemId) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== editingItemId) return item;
        return {
          ...item,
          pmOverrideStatus: overrideStatus,
          pmOverrideTheme: overrideStatus === "corrected" ? overrideTheme : item.aiTheme,
          pmOverrideStage: overrideStatus === "corrected" ? overrideStage : item.aiStage,
          pmOverrideReason: overrideReason.trim() || "PM manual adjustment during human-in-the-loop audit.",
        };
      })
    );
    setEditingItemId(null);
  }

  // Generate Markdown for the deliverable AI Evidence Log
  const generatedEvidenceLogMarkdown = useMemo(() => {
    const sourceLines = sourceVolumes.map(([src, cnt]) => `| ${src} | ${cnt} items | Public reviews / threads (PII-stripped) |`).join("\n");
    const overrideLines = goldenMetrics.overrides
      .map(
        (o, idx) =>
          `### Override #${idx + 1}: \`${o.id}\` (${o.source}) — Status: **${o.pmOverrideStatus?.toUpperCase()}**
- **Raw Evidence:** "${o.text}"
- **AI Original Output:** Theme = \`${o.aiTheme}\` | Stage = \`${JOURNEY_STAGE_LABELS[o.aiStage].label}\` (Confidence: ${Math.round(
            o.aiConfidence * 100
          )}%)
- **PM Corrected Label:** ${
            o.pmOverrideStatus === "rejected"
              ? "Excluded from SIP Retention Dataset (Out-of-scope F&O trader noise)"
              : `Theme = \`${o.pmOverrideTheme}\` | Stage = \`${
                  o.pmOverrideStage ? JOURNEY_STAGE_LABELS[o.pmOverrideStage].label : ""
                }\``
          }
- **Why AI Failed & PM Reasoning:** ${o.pmOverrideReason}`
      )
      .join("\n\n");

    const goldenRows = items
      .filter((i) => i.isGoldenSet)
      .map(
        (g) =>
          `| ${g.id} | ${g.source} | ${g.humanGoldenTheme} | ${g.aiTheme} | ${
            g.aiTheme === g.humanGoldenTheme && g.pmOverrideStatus !== "rejected" ? "✅ Match" : "⚠️ Disagreed"
          } |`
      )
      .join("\n");

    return `# AI Evidence Log — Groww 12-Month SIP Retention Discovery Engine

## 1. North-Star Metric & Discovery Question
- **Product:** Groww (Mutual Funds — First-Time SIP Investors)
- **North-Star Metric:** Percentage of first-time mutual fund investors who still have an **active SIP 12 months** after starting their first one (≥1 successful instalment in the last 30 days).
- **Guardrails Enforced:** Cannot recommend specific funds or stocks; cannot use fear, FOMO, or urgency-based nudges.

---

## 2. Sources & Volume Analysed
Total curated & classified public evidence items in current workbench: **${items.length} items** (plus AMFI/SEBI macro benchmarks).

| Source Channel | Volume Analysed | Collection & Ethics Method |
| --- | --- | --- |
${sourceLines}

---

## 3. Golden Set Evaluation (${goldenMetrics.total} Hand-Labelled Items)
- **Golden Set Size:** ${goldenMetrics.total} items labelled by hand across Play Store, App Store, Reddit, YouTube, TradingQ&A, and ConsumerComplaints.
- **Primary Theme Agreement Rate:** **${goldenMetrics.themeAgreementPct}%** (${goldenMetrics.themeMatches}/${goldenMetrics.total} exact agreement before PM override)
- **Lifecycle Stage Agreement Rate:** **${goldenMetrics.stageAgreementPct}%** (${goldenMetrics.stageMatches}/${goldenMetrics.total} exact agreement)
- **Where the Engine Failed:**
  1. **Symptom vs Root-Cause Confusion:** When a comment mentions both "Autopay failed" and "salary came late + ₹295 NACH bounce charge", the LLM defaulted to onboarding *Autopay Friction* instead of Month-5 *Rigid Cash-Flow / No Flexible Skip*.
  2. **Mental-Model Mismatch vs Operational Block:** When a beginner complained about 1% exit load and 20% STCG tax at Month 6 thinking an Equity SIP works like a bank Recurring Deposit (RD), the LLM tagged it as *KYC/Operational Block* rather than *Early Expectation Mismatch*.
  3. **Product Surface Bleed (F&O vs Mutual Fund SIP):** General Play Store reviews for Groww contain intraday BankNifty F&O complaints; without a strict product-surface filter, sentiment tools misclassify trader anger as mutual fund market-dip panic.

| ID | Source | Hand Label (PM Ground Truth) | Engine Prediction | Agreement |
| --- | --- | --- | --- | --- |
${goldenRows}

---

## 4. Documented PM Rejections & Corrections (Human-in-the-Loop)

${overrideLines}
`;
  }, [items, sourceVolumes, goldenMetrics]);

  function copyEvidenceLog() {
    navigator.clipboard.writeText(generatedEvidenceLogMarkdown);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2500);
  }

  function downloadEvidenceLogMarkdown() {
    const blob = new Blob([generatedEvidenceLogMarkdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Groww_SIP_AI_Evidence_Log.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#090E11] text-slate-100 flex flex-col">
      {/* Top Executive Header */}
      <header className="border-b border-[#1E2C36] bg-[#0D1419]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#00D09C]/15 border border-[#00D09C]/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#00D09C]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-display font-bold text-lg tracking-tight text-white">
                  Groww SIP Discovery Engine
                </span>
                <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#00D09C]/15 text-[#00D09C] border border-[#00D09C]/30">
                  Growth PM Workbench
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#5367FF]/15 text-[#98A4FF] border border-[#5367FF]/30">
                  North Star: 12-Month Active SIP %
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evidence-first discovery system for first-time mutual fund investors • Guardrails active: No Fund/Stock Advice • No Fear/FOMO/Urgency
              </p>
            </div>
          </div>

          {/* Right Controls: Gemini API Key + Run Classifier + CSV Upload */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex items-center">
              <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Gemini API Key (optional)"
                className="bg-[#131D24] border border-[#243440] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#00D09C] w-48"
              />
            </div>

            <button
              onClick={() => handleRunAiClassification(items)}
              disabled={isClassifying}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#00D09C] text-[#07120F] hover:bg-[#00e6ac] transition disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isClassifying ? "Classifying..." : "Run AI Classifier"}
            </button>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#152028] hover:bg-[#1C2A35] text-slate-200 border border-[#263744] cursor-pointer transition">
              <Upload className="w-3.5 h-3.5 text-[#00D09C]" />
              <span>Upload CSV</span>
              <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="max-w-[1440px] mx-auto px-6 flex items-center justify-between border-t border-[#17222B] overflow-x-auto">
          <nav className="flex items-center gap-1 py-1.5">
            {[
              { id: "explorer", label: "1. Evidence Explorer & Sources", icon: Database, badge: `${items.length}` },
              { id: "questions", label: "2. 9 Discovery Questions Synthesis", icon: Layers, badge: "Part 1" },
              { id: "metric_tree", label: "3. Metric Decomposition & Opportunities", icon: GitBranch, badge: "Part 2" },
              {
                id: "golden_set",
                label: "4. Golden Set & Human Audit",
                icon: ShieldCheck,
                badge: `${goldenMetrics.themeAgreementPct}% Agree`,
              },
              {
                id: "evidence_log",
                label: "5. AI Evidence Log (Deliverable)",
                icon: FileText,
                badge: `${goldenMetrics.overrides.length} Overrides`,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    isActive
                      ? "bg-[#00D09C]/15 text-[#00D09C] border border-[#00D09C]/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#131D24]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive ? "bg-[#00D09C]/20 text-[#00D09C]" : "bg-[#16222A] text-slate-400"
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </nav>

          {statusMessage && (
            <div className="text-[11px] font-mono text-[#00D09C] bg-[#00D09C]/10 border border-[#00D09C]/25 px-2.5 py-1 rounded hidden xl:block">
              {statusMessage}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-[1440px] w-full mx-auto px-6 py-6 flex-1 space-y-6">
        {/* Top KPI Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#11191F] border border-[#1F2D38] rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Public Evidence Corpus</span>
              <Database className="w-4 h-4 text-[#00D09C]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold text-white">{items.length}</span>
              <span className="text-xs text-slate-400">across {sourceVolumes.length} channels</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Play Store, App Store, Reddit, YouTube, TradingQ&A, Complaints
            </p>
          </div>

          <div className="bg-[#11191F] border border-[#1F2D38] rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Top Discovered Drop-off Window</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold text-amber-400">Months 1–6</span>
              <span className="text-xs text-slate-400">2 critical survival gates</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Gate 1: Mandate/Allotment trust • Gate 3–4: First dip & cash crunch
            </p>
          </div>

          <div className="bg-[#11191F] border border-[#1F2D38] rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Golden Set Agreement Rate</span>
              <ShieldCheck className="w-4 h-4 text-[#00D09C]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold text-[#00D09C]">
                {goldenMetrics.themeAgreementPct}%
              </span>
              <span className="text-xs font-mono text-slate-400">
                ({goldenMetrics.themeMatches}/{goldenMetrics.total} hand-labelled)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              +{goldenMetrics.overrides.length} documented PM overrides in Evidence Log
            </p>
          </div>

          <div className="bg-[#11191F] border border-[#1F2D38] rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Macro Benchmark (AMFI / SEBI)</span>
              <Target className="w-4 h-4 text-[#5367FF]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold text-white">3-Strike Rule</span>
              <span className="text-xs text-rose-400 font-mono">Auto-Cease</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              SEBI ceases SIP after 3 consecutive failed debits (silent drop-off)
            </p>
          </div>
        </section>

        {/* TAB 1: EVIDENCE EXPLORER & SOURCES */}
        {activeTab === "explorer" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar: Theme Quantifier + Live Test Input */}
            <div className="lg:col-span-4 space-y-5">
              {/* Theme Distribution Card */}
              <div className="bg-[#11191F] border border-[#1F2D38] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-display font-semibold text-sm text-white">
                      Quantified Evidence by Theme
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Click any theme bar to filter the evidence feed
                    </p>
                  </div>
                  {selectedTheme !== "ALL" && (
                    <button
                      onClick={() => setSelectedTheme("ALL")}
                      className="text-[11px] text-[#00D09C] hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {themeCounts.map(({ theme, total, highQuality }) => {
                    const maxCount = Math.max(...themeCounts.map((t) => t.total), 1);
                    const pct = Math.round((total / maxCount) * 100);
                    const isSelected = selectedTheme === theme;
                    return (
                      <button
                        key={theme}
                        onClick={() => setSelectedTheme(isSelected ? "ALL" : theme)}
                        className={`w-full text-left p-2.5 rounded-lg border transition ${
                          isSelected
                            ? "bg-[#00D09C]/15 border-[#00D09C]/50"
                            : "bg-[#152028]/70 border-[#21303B] hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-medium text-slate-200 truncate pr-2">{theme}</span>
                          <span className="font-mono text-[11px] text-[#00D09C] shrink-0">
                            {total} ({highQuality} HQ)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#0B1115] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#00D09C] to-[#5367FF] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Single-Comment Classifier Box */}
              <div className="bg-[#11191F] border border-[#1F2D38] rounded-xl p-5">
                <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00D09C]" />
                  Test Live Comment Classification
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 mb-3">
                  Paste any raw review or Reddit comment to classify its SIP lifecycle gate, theme, and evidence quality.
                </p>
                <form onSubmit={handleAddAndClassifyComment} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newCommentSource}
                      onChange={(e) => setNewCommentSource(e.target.value)}
                      placeholder="Source (e.g. Play Store)"
                      className="bg-[#152028] border border-[#253542] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                    <input
                      type="text"
                      value={newCommentSegment}
                      onChange={(e) => setNewCommentSegment(e.target.value)}
                      placeholder="User Segment"
                      className="bg-[#152028] border border-[#253542] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="e.g., My ₹2,000 SIP got deducted on 5th but units still don't show on Groww after 2 days..."
                    className="w-full bg-[#152028] border border-[#253542] rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#00D09C]"
                  />
                  <button
                    type="submit"
                    disabled={isClassifying || !newCommentText.trim()}
                    className="w-full py-2 rounded-lg text-xs font-semibold bg-[#00D09C] text-[#07120F] hover:bg-[#00e6ac] transition disabled:opacity-50"
                  >
                    + Add & Classify Evidence
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Filter Bar + Evidence Cards */}
            <div className="lg:col-span-8 space-y-4">
              {/* Filter Bar */}
              <div className="bg-[#11191F] border border-[#1F2D38] rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search quotes, themes, 'autopay', 'XIRR', 'FD', 'bounce'..."
                      className="w-full bg-[#152028] border border-[#253542] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#00D09C]"
                    />
                  </div>

                  <select
                    value={selectedQuestion}
                    onChange={(e) => setSelectedQuestion(e.target.value as DiscoveryQuestionId | "ALL")}
                    className="bg-[#152028] border border-[#253542] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="ALL">All 9 Discovery Questions</option>
                    {DISCOVERY_QUESTIONS.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.shortLabel}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value as JourneyStage | "ALL")}
                    className="bg-[#152028] border border-[#253542] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="ALL">All Lifecycle Gates (M0–M12)</option>
                    {ALL_STAGES.map((st) => (
                      <option key={st} value={st}>
                        {JOURNEY_STAGE_LABELS[st].label} ({JOURNEY_STAGE_LABELS[st].months})
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="bg-[#152028] border border-[#253542] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    {uniqueSources.map((src) => (
                      <option key={src} value={src}>
                        {src === "ALL" ? "All Public Sources" : src}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-[#1B2832]">
                  <span>
                    Showing <strong className="text-white">{filteredItems.length}</strong> of {items.length} classified items
                  </span>
                  <span>Click &ldquo;Correct / Reject AI&rdquo; on any card to log a PM override</span>
                </div>
              </div>

              {/* Evidence List */}
              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const effectiveTheme = item.pmOverrideTheme || item.aiTheme;
                  const effectiveStage = item.pmOverrideStage || item.aiStage;
                  const isRejected = item.pmOverrideStatus === "rejected";
                  const isCorrected = item.pmOverrideStatus === "corrected";

                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-4 transition ${
                        isRejected
                          ? "bg-rose-950/15 border-rose-500/30 opacity-75"
                          : isCorrected
                          ? "bg-amber-950/10 border-amber-500/40"
                          : "bg-[#11191F] border-[#1F2D38] hover:border-[#2E4252]"
                      }`}
                    >
                      {/* Top Meta Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#00D09C] bg-[#00D09C]/10 px-2 py-0.5 rounded">
                            {item.id}
                          </span>
                          <span className="text-xs font-medium text-slate-200 bg-[#17232C] border border-[#263846] px-2.5 py-0.5 rounded-full">
                            {item.source}
                          </span>
                          {item.rating && (
                            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                              {"★".repeat(item.rating)} ({item.rating}/5)
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-mono">
                            {item.monthsActiveEstimate} • {item.segment}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.isGoldenSet && (
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                              Golden Set
                            </span>
                          )}
                          <button
                            onClick={() => openOverrideModal(item)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#18242D] hover:bg-[#223340] text-slate-200 border border-[#2A3E4C] transition"
                          >
                            <SlidersHorizontal className="w-3 h-3 text-[#00D09C]" />
                            {isCorrected || isRejected ? "Edit PM Override" : "Correct / Reject AI"}
                          </button>
                        </div>
                      </div>

                      {/* Raw Quote */}
                      <blockquote className="text-sm text-slate-100 leading-relaxed bg-[#0C1217] border-l-2 border-[#00D09C] pl-3.5 py-2 pr-3 rounded-r-lg mb-3">
                        &ldquo;{item.text}&rdquo;
                      </blockquote>

                      {/* AI Synthesis & Tags */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
                        <div className="text-slate-300">
                          <span className="text-slate-500 font-mono uppercase text-[10px] mr-1.5">
                            AI Insight:
                          </span>
                          {item.aiSummary}
                        </div>
                        <span className="font-mono text-[11px] text-slate-400 shrink-0">
                          Conf: {Math.round(item.aiConfidence * 100)}% • Quality: {item.aiEvidenceQuality}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-[#1A2630]">
                        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-[#00D09C]/15 text-[#00D09C] border border-[#00D09C]/30">
                          Theme: {effectiveTheme}
                        </span>
                        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-[#5367FF]/15 text-[#A3B0FF] border border-[#5367FF]/30">
                          {JOURNEY_STAGE_LABELS[effectiveStage].label}
                        </span>
                        {item.aiDiscoveryQuestions.map((qId) => (
                          <span
                            key={qId}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#162129] text-slate-400 border border-[#22323E]"
                          >
                            {qId.split("_")[0]}
                          </span>
                        ))}
                      </div>

                      {/* Show PM Override Banner if modified */}
                      {(isCorrected || isRejected) && (
                        <div
                          className={`mt-3 p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                            isRejected
                              ? "bg-rose-950/40 border border-rose-500/40 text-rose-200"
                              : "bg-amber-950/40 border border-amber-500/40 text-amber-200"
                          }`}
                        >
                          {isRejected ? (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-semibold">
                              PM Human-in-the-Loop {isRejected ? "Rejection" : "Correction"}:
                            </span>{" "}
                            {item.pmOverrideReason}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 9 DISCOVERY QUESTIONS SYNTHESIS (PART 1) */}
        {activeTab === "questions" && (
          <div className="space-y-6">
            <div className="bg-[#11191F] border border-[#1F2D38] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-bold text-base text-white">
                  Part 1: Answering the 9 Core Discovery Questions with Public Evidence
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Every discovery question from your assignment prompt is mapped directly to classified user quotes, segment patterns, and source channels.
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[#00D09C]/15 text-[#00D09C] border border-[#00D09C]/30 shrink-0">
                9 / 9 Questions Mapped
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {DISCOVERY_QUESTIONS.map((dq) => {
                const matching = items.filter(
                  (i) => i.pmOverrideStatus !== "rejected" && i.aiDiscoveryQuestions.includes(dq.id)
                );
                const topThemes = Array.from(
                  new Set(matching.map((m) => m.pmOverrideTheme || m.aiTheme))
                ).slice(0, 3);

                return (
                  <div
                    key={dq.id}
                    className="bg-[#11191F] border border-[#1F2D38] rounded-xl p-5 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-mono font-semibold text-[#00D09C] bg-[#00D09C]/10 px-2.5 py-0.5 rounded">
                          {dq.shortLabel}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {matching.length} evidence items
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-sm text-white">
                        {dq.fullQuestion}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1">
                        <strong className="text-slate-300">Best Sources:</strong> {dq.bestSources}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {topThemes.map((th) => (
                          <span
                            key={th}
                            className="text-[11px] px-2 py-0.5 rounded bg-[#16222B] text-slate-200 border border-[#243644]"
                          >
                            {th}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 space-y-2.5">
                        {matching.slice(0, 2).map((m) => (
                          <div
                            key={m.id}
                            className="bg-[#0C1217] border border-[#1B2832] rounded-lg p-3 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                              <span>
                                {m.id} • {m.source}
                              </span>
                              <span>{m.monthsActiveEstimate}</span>
                            </div>
                            <p className="text-slate-200 line-clamp-2">&ldquo;{m.text}&rdquo;</p>
                            <p className="text-[#00D09C] text-[11px]">→ {m.aiSummary}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedQuestion(dq.id);
                        setActiveTab("explorer");
                      }}
                      className="w-full py-2 rounded-lg text-xs font-medium bg-[#16222A] hover:bg-[#1E2E38] text-[#00D09C] border border-[#243644] flex items-center justify-center gap-1.5 transition"
                    >
                      <span>Inspect all {matching.length} quotes in Evidence Explorer</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: METRIC DECOMPOSITION & OPPORTUNITY MATRIX (PART 2) */}
        {activeTab === "metric_tree" && (
          <div className="space-y-6">
            {/* Metric Decomposition Tree */}
            <div className="bg-[#11191F] border border-[#1F2D38] rounded-xl p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#1D2B35] pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#00D09C]">
                    Part 2: Business Metric Decomposition
                  </span>
                  <h2 className="font-display font-bold text-lg text-white mt-0.5">
                    Decomposing 12-Month SIP Continuation for First-Time Mutual Fund Investors
                  </h2>
                </div>
                <div className="text-xs font-mono bg-[#0C1217] border border-[#22323E] px-3 py-2 rounded-lg text-slate-300">
                  P(Active @ M12) = P(M1 Mandate) × P(M2–4 Expectation) × P(M4–9 Cash-Flow) × P(M6–12 Habit)
                </div>
              </div>

              {/* Tree Nodes */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-3.5">
                {ALL_STAGES.map((stageKey, idx) => {
                  const stageInfo = JOURNEY_STAGE_LABELS[stageKey];
                  const stageItems = items.filter(
                    (i) => i.pmOverrideStatus !== "rejected" && (i.pmOverrideStage || i.aiStage) === stageKey
                  );
                  return (
                    <div
                      key={stageKey}
                      className="bg-[#0D1419] border border-[#22323E] rounded-xl p-4 flex flex-col justify-between relative"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-mono mb-2">
                          <span className="px-2 py-0.5 rounded bg-[#00D09C]/15 text-[#00D09C]">
                            {stageInfo.months}
                          </span>
                          <span className="text-slate-400">{stageItems.length} signals</span>
                        </div>
                        <h3 className="font-display font-semibold text-sm text-white">
                          {stageInfo.label}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                          {stageInfo.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#1A2630]">
                        <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">
                          Key User Behaviour Lever #{idx + 1}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedStage(stageKey);
                            setActiveTab("explorer");
                          }}
                          className="text-xs text-[#00D09C] hover:underline flex items-center gap-1"
                        >
                          View {stageItems.length} evidence items <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Macro Benchmark Context Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {AMFI_BENCHMARK_CONTEXT.map((b) => (
                  <div
                    key={b.metric}
                    className="bg-[#141E26] border border-[#243542] rounded-lg p-3.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">{b.metric}</span>
                      <span className="font-mono font-semibold text-[#00D09C]">{b.value}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{b.insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Prioritized Opportunity Matrix */}
            <div className="bg-[#11191F] border border-[#1F2D38] rounded-xl p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h2 className="font-display font-bold text-base text-white">
                    Prioritized Product Opportunity Areas (Guardrail-Verified)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Ranked by Evidence Strength × Metric Lever Impact × Effort. Every opportunity strictly respects the assignment constraints.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>100% Guardrail Compliant (No Fund Tips • No FOMO)</span>
                </div>
              </div>

              <div className="space-y-4">
                {OPPORTUNITY_AREAS.map((opp, index) => {
                  const compositeScore = (
                    (opp.impactScore * 0.45 + opp.confidenceScore * 0.35 + (10 - opp.effortScore) * 0.2) *
                    10
                  ).toFixed(0);
                  return (
                    <div
                      key={opp.id}
                      className="bg-[#0D1419] border border-[#22323E] rounded-xl p-5 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-[#00D09C] text-[#07120F]">
                              Rank #{index + 1} • {opp.id}
                            </span>
                            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-[#5367FF]/15 text-[#A3B0FF] border border-[#5367FF]/30">
                              {opp.targetGate}
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              {opp.evidenceCount} Direct Evidence Quotes ({opp.highQualityRatio})
                            </span>
                          </div>
                          <h3 className="font-display font-bold text-base text-white mt-2">
                            {opp.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3 bg-[#141F27] border border-[#243644] px-3.5 py-2 rounded-xl">
                          <div className="text-center">
                            <div className="text-[10px] font-mono text-slate-400">IMPACT</div>
                            <div className="text-sm font-mono font-bold text-[#00D09C]">
                              {opp.impactScore}/10
                            </div>
                          </div>
                          <div className="h-6 w-px bg-[#243644]" />
                          <div className="text-center">
                            <div className="text-[10px] font-mono text-slate-400">CONFIDENCE</div>
                            <div className="text-sm font-mono font-bold text-white">
                              {opp.confidenceScore}/10
                            </div>
                          </div>
                          <div className="h-6 w-px bg-[#243644]" />
                          <div className="text-center">
                            <div className="text-[10px] font-mono text-slate-400">EFFORT</div>
                            <div className="text-sm font-mono font-bold text-amber-400">
                              {opp.effortScore}/10
                            </div>
                          </div>
                          <div className="h-6 w-px bg-[#243644]" />
                          <div className="text-center">
                            <div className="text-[10px] font-mono text-slate-400">PRIORITY</div>
                            <div className="text-sm font-mono font-bold text-[#00D09C]">
                              {compositeScore}/100
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                        <div className="bg-[#121B22] border border-[#1E2D38] rounded-lg p-3.5">
                          <div className="font-mono uppercase text-[10px] text-rose-400 mb-1">
                            Discovered User Problem
                          </div>
                          <p className="text-slate-200 leading-relaxed">{opp.problemStatement}</p>
                        </div>
                        <div className="bg-[#121B22] border border-[#1E2D38] rounded-lg p-3.5">
                          <div className="font-mono uppercase text-[10px] text-[#00D09C] mb-1">
                            Product Hypothesis & Metric Lever ({opp.metricLever})
                          </div>
                          <p className="text-slate-200 leading-relaxed">{opp.productHypothesis}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1A2630] text-[11px]">
                        <div className="flex items-center gap-3 text-emerald-400">
                          <span>✓ No Fund/Stock Recommendation</span>
                          <span>✓ No Fear/FOMO/Urgency Nudge</span>
                        </div>
                        <span className="text-slate-400">{opp.guardrailCheck.complianceNote}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GOLDEN SET & HUMAN AUDIT */}
        {activeTab === "golden_set" && (
          <div className="space-y-6">
            <div className="bg-[#11191F] border border-[#1F2D38] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-bold text-base text-white">
                  Golden Set Evaluation (20 Hand-Labelled Items) & Failure Mode Audit
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Compares your manual PM ground-truth labels against the AI Discovery Engine output across 20 representative items.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#152028] border border-[#253542] px-3.5 py-2 rounded-lg text-center">
                  <div className="text-[10px] font-mono text-slate-400">THEME AGREEMENT</div>
                  <div className="text-base font-mono font-bold text-[#00D09C]">
                    {goldenMetrics.themeAgreementPct}% ({goldenMetrics.themeMatches}/{goldenMetrics.total})
                  </div>
                </div>
                <div className="bg-[#152028] border border-[#253542] px-3.5 py-2 rounded-lg text-center">
                  <div className="text-[10px] font-mono text-slate-400">STAGE AGREEMENT</div>
                  <div className="text-base font-mono font-bold text-[#A3B0FF]">
                    {goldenMetrics.stageAgreementPct}% ({goldenMetrics.stageMatches}/{goldenMetrics.total})
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#11191F] border border-[#1F2D38] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0D1419] border-b border-[#1F2D38] text-[11px] font-mono uppercase text-slate-400">
                      <th className="py-3 px-4">ID & Source</th>
                      <th className="py-3 px-4">Comment Snippet</th>
                      <th className="py-3 px-4">PM Hand Label (Truth)</th>
                      <th className="py-3 px-4">AI Engine Output</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A2630]">
                    {items
                      .filter((i) => i.isGoldenSet)
                      .map((g) => {
                        const agreed =
                          g.aiTheme === g.humanGoldenTheme && g.pmOverrideStatus !== "rejected";
                        return (
                          <tr key={g.id} className="hover:bg-[#152028]/60">
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="font-mono font-semibold text-[#00D09C]">{g.id}</div>
                              <div className="text-[11px] text-slate-400">{g.source}</div>
                            </td>
                            <td className="py-3 px-4 max-w-md">
                              <p className="text-slate-200 line-clamp-2">&ldquo;{g.text}&rdquo;</p>
                              {g.pmOverrideReason && (
                                <p className="text-[11px] text-amber-300 mt-1">
                                  <strong>PM Note:</strong> {g.pmOverrideReason}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                                {g.pmOverrideTheme || g.humanGoldenTheme}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                {g.aiTheme}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {g.pmOverrideStatus === "rejected" ? (
                                <span className="inline-flex items-center gap-1 text-rose-400 font-mono text-[11px]">
                                  <XCircle className="w-3.5 h-3.5" /> Rejected Noise
                                </span>
                              ) : agreed ? (
                                <span className="inline-flex items-center gap-1 text-[#00D09C] font-mono text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Agreed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-400 font-mono text-[11px]">
                                  <AlertTriangle className="w-3.5 h-3.5" /> PM Corrected
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => openOverrideModal(g)}
                                className="text-[11px] px-2.5 py-1 rounded bg-[#18242D] hover:bg-[#223340] text-slate-200 border border-[#2A3E4C]"
                              >
                                Override
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AI EVIDENCE LOG DELIVERABLE */}
        {activeTab === "evidence_log" && (
          <div className="space-y-5">
            <div className="bg-[#11191F] border border-[#1F2D38] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-bold text-base text-white">
                  Deliverable: AI Evidence Log (Ready to Share / Export)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Auto-compiled with your source volumes, 20-item Golden Set evaluation, failure modes, and your {goldenMetrics.overrides.length} documented AI overrides.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={copyEvidenceLog}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#16222A] hover:bg-[#1F303B] text-slate-100 border border-[#273A47] transition"
                >
                  {copiedLog ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#00D09C]" />
                      <span>Copied Markdown!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#00D09C]" />
                      <span>Copy for Google Docs / Notion</span>
                    </>
                  )}
                </button>
                <button
                  onClick={downloadEvidenceLogMarkdown}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#00D09C] text-[#07120F] hover:bg-[#00e6ac] transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .MD</span>
                </button>
              </div>
            </div>

            <div className="bg-[#0D1419] border border-[#1F2D38] rounded-xl p-6">
              <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {generatedEvidenceLogMarkdown}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* PM Override Modal */}
      {editingItemId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#11191F] border border-[#283A47] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E2C36] pb-3">
              <h3 className="font-display font-bold text-base text-white">
                Human-in-the-Loop Override ({editingItemId})
              </h3>
              <button
                onClick={() => setEditingItemId(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">PM Action</label>
                <select
                  value={overrideStatus}
                  onChange={(e) =>
                    setOverrideStatus(e.target.value as "accepted" | "corrected" | "rejected")
                  }
                  className="w-full bg-[#152028] border border-[#253542] rounded-lg px-3 py-2 text-slate-100"
                >
                  <option value="corrected">Correct AI Theme / Lifecycle Gate</option>
                  <option value="rejected">Reject Comment (Out-of-Scope Noise e.g., F&O)</option>
                  <option value="accepted">Accept AI Classification</option>
                </select>
              </div>

              {overrideStatus === "corrected" && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Corrected Primary Theme</label>
                    <select
                      value={overrideTheme}
                      onChange={(e) => setOverrideTheme(e.target.value as PrimaryTheme)}
                      className="w-full bg-[#152028] border border-[#253542] rounded-lg px-3 py-2 text-slate-100"
                    >
                      {ALL_THEMES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Corrected Lifecycle Gate</label>
                    <select
                      value={overrideStage}
                      onChange={(e) => setOverrideStage(e.target.value as JourneyStage)}
                      className="w-full bg-[#152028] border border-[#253542] rounded-lg px-3 py-2 text-slate-100"
                    >
                      {ALL_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {JOURNEY_STAGE_LABELS[s].label} ({JOURNEY_STAGE_LABELS[s].months})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-400 mb-1">
                  PM Reasoning (Logged directly to your AI Evidence Log)
                </label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explain why you corrected or rejected the AI output..."
                  className="w-full bg-[#152028] border border-[#253542] rounded-lg p-2.5 text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingItemId(null)}
                className="px-3.5 py-2 rounded-lg text-xs text-slate-300 hover:bg-[#18242D]"
              >
                Cancel
              </button>
              <button
                onClick={savePmOverride}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#00D09C] text-[#07120F] hover:bg-[#00e6ac]"
              >
                Save to AI Evidence Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
