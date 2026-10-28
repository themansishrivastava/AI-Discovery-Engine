import { NextRequest, NextResponse } from "next/server";
import {
  HELPER_CONFIG,
  HELPER_TEMPLATES,
  HelperIntent,
  HelperLang,
  TemplateOutput,
  redactPiiText,
} from "@/config/sipHelperConfig";

export interface GateTrace {
  detected_intent: HelperIntent;
  confidence: number;
  language: HelperLang;
  gate_decision: "answer" | "fallback";
  reason: string;
  classifier_source: "claude-haiku-5-5" | "deterministic_classifier" | "selected_chip_fallback";
}

export interface HelperApiResponse {
  gate_trace: GateTrace;
  template: TemplateOutput;
  rate_limited?: boolean;
  message?: string;
}

// Basic in-memory rate limiter (20 requests per minute per IP)
const ipRequestMap = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const timestamps = (ipRequestMap.get(ip) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= HELPER_CONFIG.RATE_LIMIT_MAX_PER_MIN) {
    ipRequestMap.set(ip, timestamps);
    return false;
  }
  timestamps.push(now);
  ipRequestMap.set(ip, timestamps);
  return true;
}

// Feedback telemetry store (in-memory, redacted only)
export interface FeedbackLogEntry {
  timestamp: string;
  intent: HelperIntent;
  confidence: number;
  gate_decision: "answer" | "fallback";
  redacted_text: string;
  thumbs: "up" | "down";
}

const feedbackLogs: FeedbackLogEntry[] = [];

function detectLanguage(text: string): HelperLang {
  // Check Devanagari script range
  if (/[\u0900-\u097F]/.test(text)) {
    return "hi";
  }
  return "en";
}

function deterministicClassify(text: string): {
  intent: HelperIntent;
  confidence: number;
  language: HelperLang;
} {
  const t = text.trim().toLowerCase();
  const language = detectLanguage(text);

  if (!t || t.length < 4 || /^(asdf|qwerty|hello|test|123)/i.test(t)) {
    return { intent: "unclear", confidence: 0.35, language };
  }

  // 1. Market prediction
  if (
    /(will the market|will nifty|market fall next|go up next|predict|crash next|sensex target|market tomorrow|बाज़ार गिरेगा|मार्केट ऊपर जाएगा)/i.test(
      text
    )
  ) {
    return { intent: "market_prediction", confidence: 0.95, language };
  }

  // 2. Fund advice
  if (
    /(should i switch|which fund|which mutual fund|best fund|better fund|bandhan|small cap|mid cap|parag parikh|quant|recommend|suggest a fund|top fund|buy or sell|should i sell|कौन सा म्यूचुअल फंड|किस फंड में|स्विच करना चाहिए)/i.test(
      text
    )
  ) {
    return { intent: "fund_advice", confidence: 0.96, language };
  }

  // 3. Failed autopay
  if (
    /(autopay|auto-debit|auto debit|mandate|missed instalment|missed installment|failed|bounce|nach|ऑटो-पे|किस्त फेल|डेबिट फेल|मिस हो गई)/i.test(
      text
    )
  ) {
    return { intent: "failed_autopay", confidence: 0.92, language };
  }

  // 4. Red return worry
  if (
    /(red|negative|-2\.42%|return number|worried about|down|loss|tension|लाल|नेगेटिव|रिटर्न कम)/i.test(
      text
    )
  ) {
    return { intent: "red_return_worry", confidence: 0.91, language };
  }

  // 5. Tight money
  if (
    /(tight|salary|delayed|late|medical|bill|expense|600|500|lower|reduce|skip|pause|kharcha|kam hai|सैलरी|पैसे कम|किस्त कम|रोक सकते)/i.test(
      text
    )
  ) {
    return { intent: "tight_money", confidence: 0.93, language };
  }

  // 6. General SIP question
  if (/(sip|instalment|installment|days before|date|update|change|किस्त|तारीख)/i.test(text)) {
    return { intent: "general_sip_question", confidence: 0.82, language };
  }

  return { intent: "unclear", confidence: 0.45, language };
}

async function classifyWithClaudeHaiku(text: string): Promise<{
  intent: HelperIntent;
  confidence: number;
  language: HelperLang;
  source: "claude-haiku-5-5" | "deterministic_classifier";
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const det = deterministicClassify(text);
    return { ...det, source: "deterministic_classifier" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "claude-haiku-5-5",
        max_tokens: 150,
        temperature: 0,
        system:
          'You are an intent classifier for a mutual fund SIP helper. Read the user text in English, Hindi, or Hinglish, and return JSON ONLY with no extra text: {"intent": "tight_money" | "failed_autopay" | "red_return_worry" | "fund_advice" | "market_prediction" | "general_sip_question" | "unclear", "confidence": number between 0 and 1, "language": "en" | "hi"}. Never generate advice text. If the input is in Devanagari Hindi, set language to "hi".',
        messages: [{ role: "user", content: redactPiiText(text) }],
      }),
    });

    clearTimeout(timeout);
    if (!res.ok) {
      const det = deterministicClassify(text);
      return { ...det, source: "deterministic_classifier" };
    }

    const data = await res.json();
    const rawText: string = data?.content?.[0]?.text || "";
    const parsed = JSON.parse(rawText);
    const validIntents: HelperIntent[] = [
      "tight_money",
      "failed_autopay",
      "red_return_worry",
      "fund_advice",
      "market_prediction",
      "general_sip_question",
      "unclear",
    ];
    const intent: HelperIntent = validIntents.includes(parsed.intent)
      ? parsed.intent
      : "unclear";
    const confidence =
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5;
    const language: HelperLang =
      parsed.language === "hi" || detectLanguage(text) === "hi" ? "hi" : "en";

    return { intent, confidence, language, source: "claude-haiku-5-5" };
  } catch {
    clearTimeout(timeout);
    const det = deterministicClassify(text);
    return { ...det, source: "deterministic_classifier" };
  }
}

function runDeterministicGate(
  classified: {
    intent: HelperIntent;
    confidence: number;
    language: HelperLang;
    source: "claude-haiku-5-5" | "deterministic_classifier" | "selected_chip_fallback";
  },
  preferredLang?: HelperLang
): HelperApiResponse {
  const lang: HelperLang =
    classified.language === "hi" ? "hi" : preferredLang || "en";

  // Gate Rule 1: fund_advice or market_prediction -> Safe Fallback (decline advice, link to AMFI)
  if (classified.intent === "fund_advice" || classified.intent === "market_prediction") {
    return {
      gate_trace: {
        detected_intent: classified.intent,
        confidence: classified.confidence,
        language: lang,
        gate_decision: "fallback",
        reason:
          classified.intent === "fund_advice"
            ? "Declined fund recommendation/comparison request; pointed to official AMFI resource."
            : "Declined market prediction request; pointed to official AMFI resource.",
        classifier_source: classified.source,
      },
      template: HELPER_TEMPLATES.safe_fallback_advice[lang],
    };
  }

  // Gate Rule 2: confidence < 0.7 or intent === "unclear" -> "I'm not sure" fallback
  if (
    classified.confidence < HELPER_CONFIG.MIN_CONFIDENCE_THRESHOLD ||
    classified.intent === "unclear"
  ) {
    return {
      gate_trace: {
        detected_intent: classified.intent,
        confidence: classified.confidence,
        language: lang,
        gate_decision: "fallback",
        reason: `Confidence (${classified.confidence.toFixed(
          2
        )}) below ${HELPER_CONFIG.MIN_CONFIDENCE_THRESHOLD} or intent unclear; asked user to rephrase and linked to Groww Help.`,
        classifier_source: classified.source,
      },
      template: HELPER_TEMPLATES.safe_fallback_unclear[lang],
    };
  }

  // Gate Rule 3: Allowed operational intents -> Fixed template in user's language
  const templateKey =
    classified.intent === "failed_autopay"
      ? "failed_autopay"
      : classified.intent === "red_return_worry"
      ? "red_return_worry"
      : classified.intent === "general_sip_question"
      ? "general_sip_question"
      : "tight_money";

  return {
    gate_trace: {
      detected_intent: classified.intent,
      confidence: classified.confidence,
      language: lang,
      gate_decision: "answer",
      reason: `Passed safety gate for operational SIP intent (${classified.intent}); served fixed template in ${lang.toUpperCase()}.`,
      classifier_source: classified.source,
    },
    template: HELPER_TEMPLATES[templateKey][lang],
  };
}

export async function POST(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const ip = forwarded.split(",")[0].trim();

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        rate_limited: true,
        message:
          "You have reached the limit of 20 requests per minute. Please wait a moment and try again.",
        gate_trace: {
          detected_intent: "tight_money",
          confidence: 1,
          language: "en",
          gate_decision: "fallback",
          reason: "Rate limit exceeded (20 requests/minute).",
          classifier_source: "selected_chip_fallback",
        },
        template: HELPER_TEMPLATES.tight_money.en,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();

    // Handle thumbs up/down feedback logging (Step 7)
    if (body.action === "feedback") {
      const entry: FeedbackLogEntry = {
        timestamp: new Date().toISOString(),
        intent: body.intent || "unclear",
        confidence: typeof body.confidence === "number" ? body.confidence : 0,
        gate_decision: body.gate_decision === "fallback" ? "fallback" : "answer",
        redacted_text: redactPiiText(String(body.text || "")).slice(0, 240),
        thumbs: body.thumbs === "down" ? "down" : "up",
      };
      feedbackLogs.push(entry);
      return NextResponse.json({ ok: true, logged: entry });
    }

    const rawText = String(body.text || "");
    const selectedChip: "tight_money" | "failed_autopay" | "red_return_worry" =
      body.selectedChip === "failed_autopay" || body.selectedChip === "red_return_worry"
        ? body.selectedChip
        : "tight_money";
    const preferredLang: HelperLang = body.language === "hi" ? "hi" : "en";

    const classified = await classifyWithClaudeHaiku(rawText);
    const response = runDeterministicGate(classified, preferredLang);
    return NextResponse.json(response);
  } catch {
    // Step 3: If the AI call fails or times out, return fixed options for the selected chip; never show a raw error
    return NextResponse.json({
      gate_trace: {
        detected_intent: "tight_money",
        confidence: 1,
        language: "en",
        gate_decision: "answer",
        reason: "Returned fixed options for selected chip after fallback.",
        classifier_source: "selected_chip_fallback",
      },
      template: HELPER_TEMPLATES.tight_money.en,
    });
  }
}
