import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a Principal Product Research AI at Groww working on the North Star Goal:
"Increase the percentage of first-time mutual fund investors who still have an active SIP 12 months after starting their first one."

Analyze each public user comment about SIPs / mutual fund investing in India and return a JSON array where each object has:
- "id": string (matching input id)
- "aiTheme": one of [
    "Autopay & Mandate Friction",
    "Allotment & T+2 NAV Trust Gap",
    "Early Returns Disappointment (Month 1–4)",
    "Market Dip Panic & Loss Aversion",
    "Rigid Cash-Flow / No Flexible Skip",
    "Portfolio Clutter & Fund Selection Doubt",
    "External Finfluencer / Family Noise",
    "KYC / Bank / Folio Operational Block",
    "Long-Term Habit & Goal Clarity"
  ]
- "aiStage": one of [
    "onboarding_mandate",
    "month_1_to_3_expectations",
    "market_dip_reaction",
    "cashflow_crunch",
    "habit_decay_month_6_12"
  ]
- "aiChurnType": one of [
    "voluntary_pause_stop",
    "involuntary_payment_kyc_fail",
    "at_risk_confusion",
    "retained_habit"
  ]
- "aiDiscoveryQuestions": array of 1 to 3 IDs from [
    "Q1_why_start_expectations",
    "Q2_behaviour_change_after_start",
    "Q3_why_pause_reduce_stop",
    "Q4_what_and_how_often_check",
    "Q5_in_app_confusion_worry",
    "Q6_outside_app_validation",
    "Q7_continue_vs_quiet_dropoff",
    "Q8_segment_differences",
    "Q9_unmet_needs"
  ]
- "aiEvidenceQuality": "High" | "Medium" | "Low" (Mark "Low" if the comment is about intraday F&O/stocks or generic UI rants and NOT mutual fund SIPs)
- "aiConfidence": number between 0.55 and 0.99
- "aiSummary": 1-sentence PM synthesis of the root cause or user behaviour (no investment advice, no FOMO).

Return ONLY valid JSON.`;

function heuristicClassify(item: { id: string; text: string }) {
  const t = item.text.toLowerCase();

  if (t.includes("f&o") || t.includes("banknifty") || t.includes("intraday") || t.includes("options")) {
    return {
      id: item.id,
      aiTheme: "Market Dip Panic & Loss Aversion",
      aiStage: "market_dip_reaction",
      aiChurnType: "voluntary_pause_stop",
      aiDiscoveryQuestions: ["Q3_why_pause_reduce_stop"],
      aiEvidenceQuality: "Low",
      aiConfidence: 0.61,
      aiSummary: "Non-SIP trading/F&O complaint; low relevance to first-time mutual fund SIP retention.",
    };
  }

  if (t.includes("modifying sip") || t.includes("update amount") || t.includes("skip") || t.includes("pause") || t.includes("salary") || t.includes("bounce") || t.includes("stipend") || t.includes("diwali") || t.includes("3 working days")) {
    return {
      id: item.id,
      aiTheme: "Rigid Cash-Flow / No Flexible Skip",
      aiStage: "cashflow_crunch",
      aiChurnType: "voluntary_pause_stop",
      aiDiscoveryQuestions: ["Q3_why_pause_reduce_stop", "Q5_in_app_confusion_worry", "Q9_unmet_needs"],
      aiEvidenceQuality: "High",
      aiConfidence: 0.92,
      aiSummary: "Friction in pausing, skipping an instalment, or modifying SIP amount forces users to stop the SIP completely.",
    };
  }

  if (t.includes("cutoff") || t.includes("cut-off") || t.includes("allot") || t.includes("0 units") || t.includes("bse") || t.includes("2 pm") || t.includes("cams") || t.includes("3-4 days")) {
    return {
      id: item.id,
      aiTheme: "Allotment & T+2 NAV Trust Gap",
      aiStage: "onboarding_mandate",
      aiChurnType: "at_risk_confusion",
      aiDiscoveryQuestions: ["Q5_in_app_confusion_worry", "Q3_why_pause_reduce_stop", "Q9_unmet_needs"],
      aiEvidenceQuality: "High",
      aiConfidence: 0.91,
      aiSummary: "Lack of cut-off time warnings and T+2/T+3 NAV allotment delays make users distrust when units will be credited.",
    };
  }

  if (t.includes("autopay") || t.includes("mandate") || t.includes("emandate") || t.includes("e mandate") || t.includes("15,000") || t.includes("3 consecutive") || t.includes("retry")) {
    return {
      id: item.id,
      aiTheme: "Autopay & Mandate Friction",
      aiStage: "onboarding_mandate",
      aiChurnType: "involuntary_payment_kyc_fail",
      aiDiscoveryQuestions: ["Q3_why_pause_reduce_stop", "Q5_in_app_confusion_worry", "Q9_unmet_needs"],
      aiEvidenceQuality: "High",
      aiConfidence: 0.91,
      aiSummary: "eMandate / UPI Autopay linking failures or bank mandate confusion blocks recurring SIP instalments.",
    };
  }

  if (t.includes("kyc") || t.includes("kra") || t.includes("digilocker") || t.includes("folio") || t.includes("pan")) {
    return {
      id: item.id,
      aiTheme: "KYC / Bank / Folio Operational Block",
      aiStage: "onboarding_mandate",
      aiChurnType: "involuntary_payment_kyc_fail",
      aiDiscoveryQuestions: ["Q3_why_pause_reduce_stop", "Q5_in_app_confusion_worry"],
      aiEvidenceQuality: "High",
      aiConfidence: 0.9,
      aiSummary: "KYC verification loops, DigiLocker failures, or folio-linking blocks prevent SIP onboarding and execution.",
    };
  }

  if (t.includes("nav chart") || t.includes("xirr") || t.includes("p&l") || t.includes("redeemable units")) {
    return {
      id: item.id,
      aiTheme: "Allotment & T+2 NAV Trust Gap",
      aiStage: "month_1_to_3_expectations",
      aiChurnType: "at_risk_confusion",
      aiDiscoveryQuestions: ["Q4_what_and_how_often_check", "Q5_in_app_confusion_worry", "Q9_unmet_needs"],
      aiEvidenceQuality: "Medium",
      aiConfidence: 0.87,
      aiSummary: "Missing or confusing NAV charts, XIRR vs absolute return labels, or locked-unit displays create in-app anxiety.",
    };
  }

  if (t.includes("step-up") || t.includes("step up") || t.includes("12 months") || t.includes("14 months") || t.includes("goal") || t.includes("consistency")) {
    return {
      id: item.id,
      aiTheme: "Long-Term Habit & Goal Clarity",
      aiStage: "habit_decay_month_6_12",
      aiChurnType: "retained_habit",
      aiDiscoveryQuestions: ["Q7_continue_vs_quiet_dropoff", "Q2_behaviour_change_after_start", "Q9_unmet_needs"],
      aiEvidenceQuality: "High",
      aiConfidence: 0.93,
      aiSummary: "Goal tracking, salary-day alignment, and automated SIP step-up options support long-term SIP continuation.",
    };
  }

  if (t.includes("youtube") || t.includes("7 different") || t.includes("too many funds") || t.includes("genius")) {
    return {
      id: item.id,
      aiTheme: "Portfolio Clutter & Fund Selection Doubt",
      aiStage: "habit_decay_month_6_12",
      aiChurnType: "voluntary_pause_stop",
      aiDiscoveryQuestions: ["Q1_why_start_expectations", "Q6_outside_app_validation", "Q3_why_pause_reduce_stop"],
      aiEvidenceQuality: "Medium",
      aiConfidence: 0.86,
      aiSummary: "Feature bloat, paid advisory upsells, or holding too many funds creates decision fatigue and app switching.",
    };
  }

  if (t.includes("bear") || t.includes("red") || t.includes("crash") || t.includes("gira") || t.includes("-4.8%") || t.includes("extra units")) {
    return {
      id: item.id,
      aiTheme: "Market Dip Panic & Loss Aversion",
      aiStage: "market_dip_reaction",
      aiChurnType: "at_risk_confusion",
      aiDiscoveryQuestions: ["Q3_why_pause_reduce_stop", "Q5_in_app_confusion_worry", "Q7_continue_vs_quiet_dropoff"],
      aiEvidenceQuality: "High",
      aiConfidence: 0.92,
      aiSummary: "Market corrections trigger SIP stoppages among retail investors who react to short-term negative returns.",
    };
  }

  return {
    id: item.id,
    aiTheme: "Early Returns Disappointment (Month 1–4)",
    aiStage: "month_1_to_3_expectations",
    aiChurnType: "at_risk_confusion",
    aiDiscoveryQuestions: ["Q1_why_start_expectations", "Q2_behaviour_change_after_start", "Q5_in_app_confusion_worry"],
    aiEvidenceQuality: "Medium",
    aiConfidence: 0.84,
    aiSummary: "Early-stage dissatisfaction with returns, fees, or complex UX after starting a mutual fund SIP.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: { id: string; text: string; source?: string }[] = body.items || [];
    const clientKey: string | undefined = body.apiKey;
    const apiKey = clientKey || process.env.GEMINI_API_KEY;

    if (!items.length) {
      return NextResponse.json({ results: [], mode: "empty" });
    }

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      const results = items.map(heuristicClassify);
      return NextResponse.json({
        results,
        mode: "deterministic_fallback",
        message: `Classified ${items.length} comments (add Gemini API key for live LLM inference).`,
      });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
      apiKey
    )}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Classify these ${items.length} user comments:\n${JSON.stringify(
                  items.map((i) => ({ id: i.id, source: i.source, text: i.text })),
                  null,
                  2
                )}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      const fallbackResults = items.map(heuristicClassify);
      return NextResponse.json({
        results: fallbackResults,
        mode: "deterministic_fallback",
        message: `Gemini API returned ${response.status} (${errText.slice(0, 80)}). Used built-in classifier.`,
      });
    }

    const data = await response.json();
    const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const parsed = JSON.parse(rawJson);

    return NextResponse.json({
      results: Array.isArray(parsed) ? parsed : items.map(heuristicClassify),
      mode: "gemini_live",
      message: `Classified ${items.length} comments using live Gemini 2.5 Flash.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
