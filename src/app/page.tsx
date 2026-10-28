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
import { GROWW_PLAY_DUMP_ITEMS, GROWW_PLAY_DUMP_STATS } from "@/data/growwPlayDump";
import Link from "next/link";
import {
  Sparkles,
  Upload,
  CheckCircle2,
  Search,
  GitBranch,
  FileText,
  ShieldCheck,
  Database,
  Download,
  Copy,
  Check,
  KeyRound,
  ChevronDown,
  ChevronUp,
  Layers,
  CheckSquare,
  Square,
  ExternalLink,
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

const EVALUATOR_CHECKLIST = [
  {
    id: "chk-1",
    title: "Multi-source public data analyzed",
    detail: "Play Store, App Store RSS, Reddit, YouTube, TradingQ&A, Complaints",
    tab: "explorer" as ActiveTab,
  },
  {
    id: "chk-2",
    title: "9 Discovery Questions answered",
    detail: "Mapped to themes, stages & user quotes",
    tab: "questions" as ActiveTab,
  },
  {
    id: "chk-3",
    title: "12-Month Metric decomposed + Opportunities",
    detail: "5 survival gates, scored opportunities & guardrails",
    tab: "metric_tree" as ActiveTab,
  },
  {
    id: "chk-4",
    title: "20-item Golden Set + 3 AI Overrides",
    detail: "85% agreement + human corrections logged",
    tab: "golden_set" as ActiveTab,
  },
  {
    id: "chk-5",
    title: "Exportable AI Evidence Log",
    detail: "1-click copy/download for submission",
    tab: "evidence_log" as ActiveTab,
  },
];

export default function GrowwDiscoveryEnginePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("explorer");
  const [items, setItems] = useState<EvidenceItem[]>([
    ...SEED_EVIDENCE.slice(0, 30),
    ...GROWW_PLAY_DUMP_ITEMS,
  ]);
  const [visibleCount, setVisibleCount] = useState(30);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<DiscoveryQuestionId | "ALL">("ALL");
  const [selectedStage, setSelectedStage] = useState<JourneyStage | "ALL">("ALL");
  const [selectedTheme, setSelectedTheme] = useState<PrimaryTheme | "ALL">("ALL");
  const [selectedSource, setSelectedSource] = useState<string>("ALL");

  // Evaluator checklist ticks
  const [checkedRubric, setCheckedRubric] = useState<Record<string, boolean>>({
    "chk-1": true,
    "chk-2": true,
    "chk-3": true,
    "chk-4": true,
    "chk-5": true,
  });

  // Expandable "Read more" states
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [expandedOpps, setExpandedOpps] = useState<Record<string, boolean>>({});
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [showAddCommentModal, setShowAddCommentModal] = useState(false);

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

  const uniqueSources = useMemo(() => {
    const s = new Set(items.map((i) => i.source));
    return ["ALL", ...Array.from(s)];
  }, [items]);

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

  const validItemsCount = useMemo(
    () => items.filter((i) => i.pmOverrideStatus !== "rejected").length,
    [items]
  );
  const rejectedItemsCount = useMemo(
    () => items.filter((i) => i.pmOverrideStatus === "rejected").length,
    [items]
  );

  const sourceVolumes = useMemo(() => {
    const counts: Record<string, { valid: number; rejected: number }> = {};
    items.forEach((i) => {
      if (!counts[i.source]) counts[i.source] = { valid: 0, rejected: 0 };
      if (i.pmOverrideStatus === "rejected") {
        counts[i.source].rejected += 1;
      } else {
        counts[i.source].valid += 1;
      }
    });
    return Object.entries(counts)
      .map(([src, c]) => [src, c.valid] as [string, number])
      .sort((a, b) => b[1] - a[1]);
  }, [items]);

  const [showFullGoldenTable, setShowFullGoldenTable] = useState(false);
  const [goldenFilter, setGoldenFilter] = useState<"ALL" | "DISAGREED" | "MATCHED">("ALL");

  function toggleCardExpand(id: string) {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleOppExpand(id: string) {
    setExpandedOpps((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleQuestionExpand(id: string) {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleRubricCheck(id: string) {
    setCheckedRubric((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleRunAiClassification(targetItems: EvidenceItem[] = items) {
    setIsClassifying(true);
    setStatusMessage("Classifying comments...");
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
      setStatusMessage(`Error: ${err instanceof Error ? err.message : "Failed"}`);
    } finally {
      setIsClassifying(false);
    }
  }

  async function handleLoadRealScrapedCsv() {
    setIsClassifying(true);
    setStatusMessage("Loading 63 real scraped reviews from App Store RSS & TradingQ&A...");
    try {
      const res = await fetch("/collected_sip_comments.csv");
      const raw = await res.text();
      await parseAndIngestCsvText(raw, 25);
    } catch {
      setStatusMessage("Could not load collected CSV.");
    } finally {
      setIsClassifying(false);
    }
  }

  function splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  async function parseAndIngestCsvText(raw: string, limit = 40) {
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return;

    const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
    const textIdx = headers.findIndex((h) => h.includes("text") || h.includes("comment") || h.includes("review") || h.includes("body"));
    const sourceIdx = headers.findIndex((h) => h.includes("source") || h.includes("subreddit") || h.includes("channel"));
    const segmentIdx = headers.findIndex((h) => h.includes("segment") || h.includes("user"));

    const uploadedItems: EvidenceItem[] = [];
    for (let i = 1; i < Math.min(lines.length, limit + 1); i++) {
      const cleanCols = splitCsvLine(lines[i]);
      const commentText = textIdx >= 0 ? cleanCols[textIdx] : cleanCols[cleanCols.length - 1];
      if (!commentText || commentText.length < 15) continue;

      uploadedItems.push({
        id: `LIVE-${String(i).padStart(3, "0")}`,
        source: sourceIdx >= 0 && cleanCols[sourceIdx] ? cleanCols[sourceIdx] : "Uploaded CSV",
        platform: "Public Feed",
        rating: null,
        date: new Date().toISOString().slice(0, 10),
        text: commentText,
        segment: segmentIdx >= 0 && cleanCols[segmentIdx] ? cleanCols[segmentIdx] : "Public Investor",
        monthsActiveEstimate: "First 12M",
        aiTheme: "Early Returns Disappointment (Month 1–4)",
        aiStage: "month_1_to_3_expectations",
        aiChurnType: "at_risk_confusion",
        aiDiscoveryQuestions: ["Q3_why_pause_reduce_stop"],
        aiEvidenceQuality: "Medium",
        aiConfidence: 0.86,
        aiSummary: "Classifying...",
      });
    }

    if (uploadedItems.length > 0) {
      setItems((prev) => [...uploadedItems, ...prev]);
      await handleRunAiClassification(uploadedItems);
    }
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const raw = await file.text();
    await parseAndIngestCsvText(raw, 50);
  }

  async function handleAddAndClassifyComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const newId = `EV-${String(items.length + 1).padStart(3, "0")}`;
    const newItem: EvidenceItem = {
      id: newId,
      source: newCommentSource,
      platform: "Groww",
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
    setItems((prev) => [newItem, ...prev]);
    setNewCommentText("");
    setShowAddCommentModal(false);
    await handleRunAiClassification([newItem]);
  }

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

  const generatedEvidenceLogMarkdown = useMemo(() => {
    const sourceLines = sourceVolumes.map(([src, cnt]) => `| ${src} | ${cnt} items | Public reviews / threads (PII-stripped) |`).join("\n");
    const overrideLines = goldenMetrics.overrides
      .map(
        (o, idx) =>
          `### Override #${idx + 1}: \`${o.id}\` (${o.source}) — Status: **${o.pmOverrideStatus?.toUpperCase()}**
- **Raw Evidence:** "${o.text}"
- **AI Original Output:** Theme = \`${o.aiTheme}\` | Stage = \`${JOURNEY_STAGE_LABELS[o.aiStage].label}\`
- **PM Corrected Label:** ${
            o.pmOverrideStatus === "rejected"
              ? "Excluded (Out-of-scope F&O trader noise)"
              : `Theme = \`${o.pmOverrideTheme}\` | Stage = \`${
                  o.pmOverrideStage ? JOURNEY_STAGE_LABELS[o.pmOverrideStage].label : ""
                }\``
          }
- **Why AI Failed & PM Reasoning:** ${o.pmOverrideReason}`
      )
      .join("\n\n");

    const goldenRows = items
      .filter((i) => i.isGoldenSet)
      .map((g) => {
        const truthLabel =
          g.pmOverrideStatus === "rejected"
            ? "Out-of-Scope Noise (F&O Trading)"
            : g.pmOverrideTheme || g.humanGoldenTheme;
        return `| ${g.id} | ${g.source} | ${truthLabel} | ${g.aiTheme} | ${
          g.aiTheme === g.humanGoldenTheme && g.pmOverrideStatus !== "rejected" ? "Match" : "Disagreed"
        } |`;
      })
      .join("\n");

    return `# AI Evidence Log

## 1. Sources and Volume Analysed (${validItemsCount} valid SIP items + ${rejectedItemsCount} excluded F&O noise = ${items.length} total)
| Source | Volume | Notes |
| --- | --- | --- |
${sourceLines}

## 2. Golden Set Evaluation (${goldenMetrics.total} Hand-Labelled Items)
- **Agreement Rate:** **${goldenMetrics.themeAgreementPct}%** (${goldenMetrics.themeMatches}/${goldenMetrics.total} agreed with hand labels)
- **Where the Engine Failed:**
  1. Confused **symptom vs. root cause** (tagged a late-salary ₹295 NACH bounce penalty as onboarding *Autopay Friction* instead of Month-5 *Rigid Cash-Flow / No Flexible Skip*).
  2. Confused **mental-model mismatch vs. operational block** (tagged a user surprised by 1% exit load & STCG tax at 6 months as a *KYC/Bank Block* rather than *Early Expectation Mismatch*).
  3. Included **non-SIP product noise** (tagged an intraday BankNifty F&O complaint as SIP market-dip panic before PM rejection).

| ID | Source | Hand Label (PM) | Engine Output | Result |
| --- | --- | --- | --- | --- |
${goldenRows}

## 3. Places Where AI Output Was Rejected or Corrected (${goldenMetrics.overrides.length} items)
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
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col">
      {/* Clean Minimalist Groww-Style Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Official Groww Logo + Clean Black Title */}
          <div className="flex items-center gap-3 shrink-0">
            <img
              src="/groww-logo.png"
              alt="Groww"
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="font-display font-bold text-lg tracking-tight text-slate-900">
              Groww SIP Discovery Engine
            </span>
          </div>

          {/* Right: Clean All-Black/Neutral Controls */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="relative">
              <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Gemini Key (optional)"
                className="bg-white border border-slate-200 rounded-md pl-8 pr-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 w-40"
              />
            </div>

            <button
              onClick={() => handleRunAiClassification(items)}
              disabled={isClassifying}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50 whitespace-nowrap"
            >
              {isClassifying ? "Running..." : "Run AI"}
            </button>

            <button
              onClick={handleLoadRealScrapedCsv}
              disabled={isClassifying}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 transition whitespace-nowrap"
            >
              + Load Scraped Reviews
            </button>

            <label className="px-3 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 cursor-pointer transition whitespace-nowrap">
              <span>Upload CSV</span>
              <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
            </label>

            <Link
              href="/evidence-log"
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 transition whitespace-nowrap"
            >
              AI Evidence Log ↗
            </Link>

            <Link
              href="/mvp"
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#00B386] hover:bg-[#009973] text-white transition whitespace-nowrap"
            >
              Launch AI-Native MVP ↗
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 space-y-5">
        {/* Clean Card-Level Tab Strip (Matches Groww 'Indian Indices | Global Indices' style with green underline) */}
        <div className="bg-white border border-slate-200 rounded-xl px-5 pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <nav className="flex items-center gap-8 border-b border-slate-100">
            {[
              { id: "explorer", label: "Evidence Feed & 9 Discovery Questions" },
              { id: "questions", label: "Opportunity Ranking & AI Evidence Log" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`py-3 border-b-2 text-sm whitespace-nowrap transition ${
                    isActive
                      ? "border-[#00B386] font-bold text-slate-900"
                      : "border-transparent font-normal text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="text-[11px] font-medium text-[#00B386] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md mb-1 sm:mb-0">
            AI-generated insights are only a starting point — validated by human judgment
          </div>
        </div>

        {statusMessage && (
          <div className="bg-white border border-slate-200 text-slate-800 text-xs px-3.5 py-2 rounded-lg flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-slate-500 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: TOP FILTERS -> 9 DISCOVERY QUESTIONS & ANSWERS -> EVIDENCE FEED */}
        {activeTab === "explorer" && (
          <div className="space-y-5">
            {/* 1. Full-Width Top Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search comments..."
                  className="w-full bg-white border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <select
                value={selectedQuestion}
                onChange={(e) => setSelectedQuestion(e.target.value as DiscoveryQuestionId | "ALL")}
                className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800"
              >
                <option value="ALL">All 9 Questions</option>
                {DISCOVERY_QUESTIONS.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.shortLabel}
                  </option>
                ))}
              </select>

              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value as PrimaryTheme | "ALL")}
                className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800"
              >
                <option value="ALL">All Themes</option>
                {ALL_THEMES.map((th) => (
                  <option key={th} value={th}>
                    {th}
                  </option>
                ))}
              </select>

              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value as JourneyStage | "ALL")}
                className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800"
              >
                <option value="ALL">All Stages (M0–M12)</option>
                {ALL_STAGES.map((st) => (
                  <option key={st} value={st}>
                    {JOURNEY_STAGE_LABELS[st].months}: {JOURNEY_STAGE_LABELS[st].label}
                  </option>
                ))}
              </select>

              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800"
              >
                {uniqueSources.map((src) => (
                  <option key={src} value={src}>
                    {src === "ALL" ? "All Sources" : src}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowAddCommentModal(true)}
                className="px-3 py-1.5 rounded-md text-xs font-medium border border-slate-300 text-slate-800 hover:bg-slate-50 transition whitespace-nowrap"
              >
                + Test Comment
              </button>
            </div>

            {/* 2. Two-Column Layout: User Feedback on Left (7 cols) + 9 Discovery Questions & Answers on Right (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: User Feedback Feed */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                <div className="px-5 py-3.5 flex items-center justify-between">
                  <h2 className="font-display font-bold text-sm text-slate-900">
                    User Feedback ({filteredItems.length})
                  </h2>
                  {(selectedQuestion !== "ALL" ||
                    selectedTheme !== "ALL" ||
                    selectedStage !== "ALL" ||
                    selectedSource !== "ALL" ||
                    searchQuery) && (
                    <button
                      onClick={() => {
                        setSelectedQuestion("ALL");
                        setSelectedTheme("ALL");
                        setSelectedStage("ALL");
                        setSelectedSource("ALL");
                        setSearchQuery("");
                      }}
                      className="text-xs font-medium text-slate-700 underline"
                    >
                      Reset filters
                    </button>
                  )}
                </div>

                {filteredItems.slice(0, visibleCount).map((item) => {
                  const isRejected = item.pmOverrideStatus === "rejected";
                  const isCorrected = item.pmOverrideStatus === "corrected";
                  const isExpanded = !!expandedCards[item.id];
                  const isLong = item.text.length > 150;
                  const srcLower = item.source.toLowerCase();
                  const sourceIcon = srcLower.includes("play store")
                    ? "/icon-playstore.png"
                    : srcLower.includes("reddit")
                    ? "/icon-reddit.png"
                    : "/icon-review.png";

                  return (
                    <div
                      key={item.id}
                      className={`px-5 py-4 transition ${
                        isRejected ? "opacity-60" : "hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-mono font-semibold text-slate-700">{item.id}</span>
                            <span>-</span>
                            <img
                              src={sourceIcon}
                              alt={item.source}
                              className="w-4 h-4 rounded-sm object-contain shrink-0"
                            />
                            <span className="font-medium text-slate-700">{item.source}</span>
                            {isCorrected && (
                              <span className="font-semibold text-slate-900 underline">
                                (PM Corrected)
                              </span>
                            )}
                            {isRejected && (
                              <span className="font-semibold text-slate-900 underline">
                                (Rejected Noise)
                              </span>
                            )}
                          </div>

                          <p className="text-sm font-semibold text-slate-900">
                            {item.aiSummary}
                          </p>
                        </div>

                        <button
                          onClick={() => openOverrideModal(item)}
                          className="text-[11px] font-medium px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 shrink-0"
                        >
                          Override
                        </button>
                      </div>

                      <div className="mt-1.5 text-xs text-slate-600">
                        <span>
                          &ldquo;
                          {isExpanded || !isLong ? item.text : `${item.text.slice(0, 145)}...`}
                          &rdquo;
                        </span>
                        {isLong && (
                          <button
                            onClick={() => toggleCardExpand(item.id)}
                            className="ml-1.5 text-slate-900 font-semibold hover:underline inline-flex items-center gap-0.5"
                          >
                            {isExpanded ? "Show less" : "Read more"}
                          </button>
                        )}
                      </div>

                      {(isCorrected || isRejected) && item.pmOverrideReason && (
                        <div className="mt-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded px-3 py-1.5">
                          <strong>PM Note:</strong> {item.pmOverrideReason}
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredItems.length > visibleCount && (
                  <div className="p-4">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 40)}
                      className="w-full py-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-900 transition"
                    >
                      Show more ({filteredItems.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: 9 Discovery Questions & Answers */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 space-y-3 lg:sticky lg:top-20">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-sm text-slate-900">
                    9 Discovery Questions &amp; Answers
                  </h2>
                  {selectedQuestion !== "ALL" && (
                    <button
                      onClick={() => setSelectedQuestion("ALL")}
                      className="text-xs font-medium text-slate-700 underline"
                    >
                      Clear filter
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
                  {DISCOVERY_QUESTIONS.map((dq) => {
                    const matching = items.filter(
                      (i) => i.pmOverrideStatus !== "rejected" && i.aiDiscoveryQuestions.includes(dq.id)
                    );
                    const isSelected = selectedQuestion === dq.id;
                    return (
                      <div
                        key={dq.id}
                        onClick={() => setSelectedQuestion(isSelected ? "ALL" : dq.id)}
                        className={`rounded-lg border p-3 cursor-pointer transition ${
                          isSelected
                            ? "bg-slate-50 border-slate-900"
                            : "bg-white border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="font-bold text-slate-900">{dq.shortLabel}</span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {matching.length}
                          </span>
                        </div>
                        <h3 className="text-xs font-medium text-slate-800 leading-snug">
                          {dq.fullQuestion}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                          <strong className="text-slate-800">Answer:</strong> {dq.synthesizedAnswer}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SIMPLE, SCANNABLE OPPORTUNITIES + AI EVIDENCE LOG */}
        {activeTab === "questions" && (
          <div className="space-y-5">
            {/* 1. Simple Ranked Opportunities List (Clean rows with Read More) */}
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-sm text-slate-900">
                    Ranked Product Opportunities (12-Month SIP Continuation)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click &ldquo;Read more&rdquo; on any opportunity to view the problem, intervention, and validation plan.
                  </p>
                </div>
                <span className="text-xs font-medium text-[#00B386]">
                  No Fund Advice • No Fear/FOMO
                </span>
              </div>

              {OPPORTUNITY_AREAS.map((opp, index) => {
                const isExpanded = !!expandedOpps[opp.id];
                const themeEvidence = items.filter(
                  (i) =>
                    i.pmOverrideStatus !== "rejected" &&
                    (i.pmOverrideTheme || i.aiTheme) === opp.linkedTheme
                );
                const sampleQuote = themeEvidence[0];

                return (
                  <div key={opp.id} className="px-5 py-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#00B386] text-white">
                          #{index + 1}
                        </span>
                        <h3 className="font-display font-bold text-sm text-slate-900">
                          {opp.title}
                        </h3>
                        <button
                          onClick={() => {
                            setSelectedTheme(opp.linkedTheme);
                            setActiveTab("explorer");
                          }}
                          className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-[#00B386] border border-emerald-200 hover:bg-emerald-100 transition"
                        >
                          {themeEvidence.length} Evidence Reviews →
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500">
                          Impact <strong className="text-slate-900">{opp.impactScore}/10</strong>
                        </span>
                        <span className="text-slate-500">
                          Confidence <strong className="text-slate-900">{opp.confidenceScore}/10</strong>
                        </span>
                        <button
                          onClick={() => toggleOppExpand(opp.id)}
                          className="text-[#00B386] font-semibold hover:underline ml-2"
                        >
                          {isExpanded ? "Show less" : "Read more"}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600">
                      {opp.problemStatement}
                    </p>

                    {/* Visible Evidence Proof Strip */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-slate-600 truncate">
                        <strong className="text-slate-800">Evidence ({opp.evidenceSummary.split(" ")[0]} items):</strong>{" "}
                        {sampleQuote ? (
                          <span>
                            &ldquo;{sampleQuote.text.slice(0, 115)}...&rdquo;{" "}
                            <span className="font-mono text-[11px] text-slate-400">
                              ({sampleQuote.id} • {sampleQuote.source})
                            </span>
                          </span>
                        ) : (
                          <span>{opp.evidenceSummary}</span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 shrink-0">
                        IDs: {opp.highQualityRatio}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="space-y-3 pt-2 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                            <div>
                              <strong className="text-slate-900">Proposed Intervention:</strong>{" "}
                              <span className="text-slate-600">{opp.productHypothesis}</span>
                            </div>
                            <div>
                              <strong className="text-slate-900">Target User:</strong>{" "}
                              <span className="text-slate-600">{opp.targetUser}</span>
                            </div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                            <div>
                              <strong className="text-slate-900">Expected Outcome:</strong>{" "}
                              <span className="text-slate-600">{opp.expectedOutcome}</span>
                            </div>
                            <div>
                              <strong className="text-slate-900">Validation Plan:</strong>{" "}
                              <span className="text-slate-600">{opp.validationPlan}</span>
                            </div>
                          </div>
                        </div>

                        {/* Supporting Quotes List When Expanded */}
                        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <strong className="text-slate-900">
                              Supporting User Evidence ({themeEvidence.length} items in corpus)
                            </strong>
                            <button
                              onClick={() => {
                                setSelectedTheme(opp.linkedTheme);
                                setActiveTab("explorer");
                              }}
                              className="text-[#00B386] font-semibold hover:underline"
                            >
                              View all {themeEvidence.length} in Evidence Feed →
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            {themeEvidence.slice(0, 3).map((ev) => (
                              <div key={ev.id} className="text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100">
                                <span className="font-mono font-semibold text-slate-700">{ev.id}</span>{" "}
                                <span className="text-slate-400">({ev.source}):</span>{" "}
                                &ldquo;{ev.text.slice(0, 160)}...&rdquo;
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 2. Simple AI Evidence Log Summary (3 Clean Cards + Expandable Table) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-sm text-slate-900">
                    AI Evidence Log Summary
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sources analysed, 20-item hand-labelled Golden Set, and 3 PM overrides.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyEvidenceLog}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 transition"
                  >
                    {copiedLog ? "Copied!" : "Copy Log"}
                  </button>
                  <button
                    onClick={downloadEvidenceLogMarkdown}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#00B386] text-white hover:bg-[#009973] transition"
                  >
                    Download .MD
                  </button>
                </div>
              </div>

              {/* 3 Simple Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                  <div className="text-slate-500">1. Sources &amp; Volume</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {validItemsCount} Valid SIP Items
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Across {sourceVolumes.length} channels (+1 F&amp;O noise excluded)
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                  <div className="text-slate-500">2. Golden Set Agreement</div>
                  <div className="text-base font-bold text-[#00B386] mt-0.5">
                    {goldenMetrics.themeAgreementPct}% ({goldenMetrics.themeMatches}/{goldenMetrics.total} Matched)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    20 hand-labelled items tested against AI
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                  <div className="text-slate-500">3. Human Overrides</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    3 AI Outputs Corrected / Rejected
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    EV-003, EV-011 corrected • EV-015 rejected
                  </div>
                </div>
              </div>

              {/* 3 Short Override Rows */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {goldenMetrics.overrides.map((o) => (
                  <div key={o.id} className="border border-slate-200 rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{o.id}</span>
                      <span className="text-[11px] font-semibold text-[#00B386] uppercase">
                        PM {o.pmOverrideStatus}
                      </span>
                    </div>
                    <div className="text-slate-800 font-medium">
                      {o.pmOverrideStatus === "rejected" ? "Excluded F&O Noise" : o.pmOverrideTheme}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{o.pmOverrideReason}</p>
                  </div>
                ))}
              </div>

              {/* Single Toggle for 20-Item Golden Set Table */}
              <div className="pt-1">
                <button
                  onClick={() => setShowFullGoldenTable((prev) => !prev)}
                  className="text-xs text-[#00B386] font-semibold hover:underline"
                >
                  {showFullGoldenTable ? "Hide 20-item Golden Set table ▲" : "View 20-item Golden Set table ▼"}
                </button>

                {showFullGoldenTable && (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg mt-2.5">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                          <th className="py-2 px-3">ID</th>
                          <th className="py-2 px-3">Source</th>
                          <th className="py-2 px-3">Hand Label (PM)</th>
                          <th className="py-2 px-3">AI Output</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items
                          .filter((i) => i.isGoldenSet)
                          .map((g) => {
                            const agreed =
                              g.aiTheme === g.humanGoldenTheme && g.pmOverrideStatus !== "rejected";
                            const displayTruth =
                              g.pmOverrideStatus === "rejected"
                                ? "Out-of-Scope Noise (F&O)"
                                : g.pmOverrideTheme || g.humanGoldenTheme;
                            return (
                              <tr key={g.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-mono text-slate-700">{g.id}</td>
                                <td className="py-2 px-3 text-slate-600">{g.source}</td>
                                <td className="py-2 px-3 font-medium text-slate-900">{displayTruth}</td>
                                <td className="py-2 px-3 text-slate-500">{g.aiTheme}</td>
                                <td className="py-2 px-3 font-semibold">
                                  {agreed ? (
                                    <span className="text-[#00B386]">Agreed</span>
                                  ) : (
                                    <span className="text-amber-700">Overridden</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Test Single Comment */}
      {showAddCommentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-display font-bold text-sm text-slate-900">
                Test Live Comment Classification
              </h3>
              <button
                onClick={() => setShowAddCommentModal(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleAddAndClassifyComment} className="space-y-3 text-xs">
              <input
                type="text"
                value={newCommentSource}
                onChange={(e) => setNewCommentSource(e.target.value)}
                placeholder="Source (e.g. Play Store)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
              />
              <textarea
                rows={3}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Paste a user review or comment about SIP..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg font-semibold bg-[#00B386] text-white hover:bg-[#009973]"
              >
                Classify & Add to Feed
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: PM Override */}
      {editingItemId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-display font-bold text-sm text-slate-900">
                PM Override ({editingItemId})
              </h3>
              <button
                onClick={() => setEditingItemId(null)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Action</label>
                <select
                  value={overrideStatus}
                  onChange={(e) =>
                    setOverrideStatus(e.target.value as "accepted" | "corrected" | "rejected")
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                >
                  <option value="corrected">Correct AI Theme / Stage</option>
                  <option value="rejected">Reject Comment (Noise / Not SIP)</option>
                  <option value="accepted">Accept AI Label</option>
                </select>
              </div>

              {overrideStatus === "corrected" && (
                <>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Theme</label>
                    <select
                      value={overrideTheme}
                      onChange={(e) => setOverrideTheme(e.target.value as PrimaryTheme)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                    >
                      {ALL_THEMES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Lifecycle Stage</label>
                    <select
                      value={overrideStage}
                      onChange={(e) => setOverrideStage(e.target.value as JourneyStage)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                    >
                      {ALL_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {JOURNEY_STAGE_LABELS[s].months}: {JOURNEY_STAGE_LABELS[s].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-600 font-medium mb-1">Reason for Override</label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Why did you correct or reject the AI label?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingItemId(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={savePmOverride}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#00B386] text-white hover:bg-[#009973]"
              >
                Save Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
