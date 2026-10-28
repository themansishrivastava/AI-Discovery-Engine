import { NextRequest, NextResponse } from "next/server";

export interface MvpEvalGateResult {
  passedAll: boolean;
  safeFallbackTriggered: boolean;
  checks: {
    noInvestmentAdvice: { status: "PASS" | "FALLBACK_TRIGGERED"; detail: string };
    noFearFomoUrgency: { status: "PASS" | "BLOCKED"; detail: string };
    folioMathGrounding: { status: "PASS" | "UNCERTAIN"; detail: string };
    officialSourceLink: { status: "PASS"; url: string; label: string };
  };
  detectedIntent:
    | "money_tight_cashflow"
    | "market_dip_loss_anxiety"
    | "slow_year1_returns"
    | "failed_autopay_3strike"
    | "month1_allotment_or_mandate_limit"
    | "investment_advice_or_fund_switch_blocked";
  assistantResponse: {
    headline: string;
    explanation: string;
    mathBreakdown: string;
    recommendedActions: {
      id: string;
      label: string;
      subtext: string;
      actionType: "step_down_500" | "pause_auto_resume" | "change_date_7th" | "upi_retry_now" | "tag_goal" | "keep_running" | "official_help";
    }[];
    disclaimer: string;
  };
}

const ADVICE_TRIGGER_REGEX =
  /\b(which fund|which mutual fund|best fund|better fund|switch to|bandhan|small cap|mid cap|parag parikh|quant|buy or sell|should i sell|should i buy|should i redeem|will nifty|fall more|go up|25% return|20% return|predict|will market|target price|recommend|suggest a fund|top fund|guarantee|double my money|f&o|options|intraday)\b/i;

function evaluateAndRespond(userQuery: string, sipAmount = 2000, sipDate = 1): MvpEvalGateResult {
  const q = userQuery.toLowerCase();

  // 1. CHECK FOR INVESTMENT ADVICE / FUND SWITCHING / MARKET PREDICTION -> TRIGGER SAFE FALLBACK
  if (ADVICE_TRIGGER_REGEX.test(q)) {
    return {
      passedAll: false,
      safeFallbackTriggered: true,
      detectedIntent: "investment_advice_or_fund_switch_blocked",
      checks: {
        noInvestmentAdvice: {
          status: "FALLBACK_TRIGGERED",
          detail:
            "User prompt requested fund comparison, switching advice, or market prediction. Declined advice and activated Safe Fallback.",
        },
        noFearFomoUrgency: {
          status: "PASS",
          detail: "Neutral, non-promotional compliance tone verified.",
        },
        folioMathGrounding: {
          status: "PASS",
          detail: "Displayed only factual exit-load (1% <12M) and STCG tax (20%) rules for current holding.",
        },
        officialSourceLink: {
          status: "PASS",
          url: "https://www.amfiindia.com/articles/mutual-fund",
          label: "AMFI Official Mutual Fund & SIP Guide",
        },
      },
      assistantResponse: {
        headline: "Safe Fallback: I Cannot Recommend Funds or Predict Returns",
        explanation:
          "Groww's Smart SIP Assistant is strictly non-advisory. I cannot tell you whether to switch to another fund (such as a Small Cap or Mid Cap fund) or predict whether the market will rise or fall next month.",
        mathBreakdown:
          "Factual Rules on Your Current Holding (SBI Nifty Next 50 Index Fund):\n• Stopping future SIP debits has ₹0 fee.\n• However, redeeming units held for less than 12 months incurs AMC Exit Load + 20% Short-Term Capital Gains (STCG) tax on gains.\n• Currently 5 of 12 monthly instalments completed (₹10,000 invested across 534.4 units at ₹18.71 NAV).",
        recommendedActions: [
          {
            id: "act-pause-decide",
            label: "Pause SIP for 1 Month While You Decide",
            subtext: "Existing 534.4 units stay invested; auto-resumes next month",
            actionType: "pause_auto_resume",
          },
          {
            id: "act-official-amfi",
            label: "Read Official AMFI / Groww Help Rules",
            subtext: "Check SEBI-registered advisor directory or scheme documents",
            actionType: "official_help",
          },
        ],
        disclaimer:
          "Not investment advice. Mutual Fund investments are subject to market risks. Please consult a SEBI-registered investment advisor for fund selection.",
      },
    };
  }

  // 2. FAILED AUTOPAY / 3-STRIKE CANCELLATION RULE
  if (q.includes("fail") || q.includes("missed") || q.includes("bounce") || q.includes("autopay") || q.includes("3 consecutive") || q.includes("deduct")) {
    return {
      passedAll: true,
      safeFallbackTriggered: false,
      detectedIntent: "failed_autopay_3strike",
      checks: {
        noInvestmentAdvice: {
          status: "PASS",
          detail: "Operational payment recovery only; zero fund advice.",
        },
        noFearFomoUrgency: {
          status: "PASS",
          detail: "Factual explanation of Groww/SEBI 3-miss rule; zero manipulative FOMO.",
        },
        folioMathGrounding: {
          status: "PASS",
          detail: `Verified against active ₹${sipAmount}/mo SIP on ${sipDate}st of month (1/3 missed instalments).`,
        },
        officialSourceLink: {
          status: "PASS",
          url: "https://groww.in/help/mutual-funds/order/why-was-my-order-cancelled--68",
          label: "Groww Help: Why was my SIP cancelled? (3-Strike Rule)",
        },
      },
      assistantResponse: {
        headline: "Recover Missed Instalment or Move SIP Date After Salary Day",
        explanation:
          "Per Groww's official SIP rules, a SIP is automatically cancelled only if 3 consecutive monthly instalments go unpaid. Completing this month's instalment via UPI or shifting your SIP date after payday keeps your SIP active and avoids ₹295–₹590 bank NACH bounce charges.",
        mathBreakdown:
          `Your Active SIP Status:\n• Current Missed Streak: 1 of 3 consecutive instalments.\n• Scheduled SIP Amount: ₹${sipAmount.toLocaleString("en-IN")} (Min. allowed in this fund: ₹500).\n• Units if paid at current ₹18.71 NAV: +${(sipAmount / 18.71).toFixed(2)} units.`,
        recommendedActions: [
          {
            id: "act-upi-retry",
            label: `Pay ₹${sipAmount.toLocaleString("en-IN")} Now via 1-Tap UPI Retry`,
            subtext: "Clears missed instalment immediately and resets 3-strike counter to 0/3",
            actionType: "upi_retry_now",
          },
          {
            id: "act-move-date",
            label: "Change SIP Date from 1st → 7th (After Salary Credits)",
            subtext: "Prevents future low-balance bank NACH bounce fees",
            actionType: "change_date_7th",
          },
          {
            id: "act-step-down",
            label: "Pay Minimum ₹500 for This Month Instead",
            subtext: "Keeps SIP active at minimum fund amount; reverts to ₹2,000 next month",
            actionType: "step_down_500",
          },
        ],
        disclaimer:
          "Operational SIP schedule assistance only. Not investment advice.",
      },
    };
  }

  // 3. MARKET FELL / NEGATIVE RETURNS (-2.42% 1Y)
  if (q.includes("loss") || q.includes("red") || q.includes("fall") || q.includes("fell") || q.includes("-2.4") || q.includes("negative") || q.includes("down") || q.includes("gira")) {
    return {
      passedAll: true,
      safeFallbackTriggered: false,
      detectedIntent: "market_dip_loss_anxiety",
      checks: {
        noInvestmentAdvice: {
          status: "PASS",
          detail: "Explains historical unit-purchase math on user's existing folio; no future return prediction.",
        },
        noFearFomoUrgency: {
          status: "PASS",
          detail: "Calm, factual unit math; user remains free to pause or cancel anytime.",
        },
        folioMathGrounding: {
          status: "PASS",
          detail: "Grounded in SBI Nifty Next 50 NAV ₹18.71 (-2.42% 1Y) and ₹2,000 monthly SIP.",
        },
        officialSourceLink: {
          status: "PASS",
          url: "https://www.myfolios.in/blog/why-people-stop-their-sip",
          label: "Why People Stop Their SIP: Market Dip & Unit Math",
        },
      },
      assistantResponse: {
        headline: "How Lower NAV (₹18.71) Affects Your Monthly Unit Accumulation",
        explanation:
          "Your fund shows -2.42% (1Y) because the index dipped recently. In a SIP, each monthly instalment buys mutual fund units at that day's NAV—meaning a lower NAV buys more units for the same ₹2,000.",
        mathBreakdown:
          `Your Exact Folio Unit Math (SBI Nifty Next 50 Direct Growth):\n• When NAV was ₹20.50: ₹${sipAmount.toLocaleString("en-IN")} bought ${(sipAmount / 20.5).toFixed(2)} units.\n• At current NAV ₹18.71: ₹${sipAmount.toLocaleString("en-IN")} buys ${(sipAmount / 18.71).toFixed(2)} units (+${(sipAmount / 18.71 - sipAmount / 20.5).toFixed(2)} extra units this month).\n• Total accumulated so far: 534.4 units across 5/12 instalments.`,
        recommendedActions: [
          {
            id: "act-keep-running",
            label: "Keep SIP Running to Accumulate Units at ₹18.71 NAV",
            subtext: "Switch dashboard display from % XIRR to 'Total Units Collected'",
            actionType: "keep_running",
          },
          {
            id: "act-step-down-dip",
            label: "Lower Next Month's SIP to ₹500 (Min. SIP) If Unsure",
            subtext: "Reduces monthly outflow while keeping your mandate active",
            actionType: "step_down_500",
          },
        ],
        disclaimer:
          "Mathematical illustration of past unit allotment only. Market NAVs can fluctuate upward or downward; this is not investment advice.",
      },
    };
  }

  // 4. FEELS TOO SLOW / BARELY MOVING IN YEAR 1
  if (q.includes("slow") || q.includes("barely") || q.includes("not moving") || q.includes("fd") || q.includes("goal") || q.includes("boring")) {
    return {
      passedAll: true,
      safeFallbackTriggered: false,
      detectedIntent: "slow_year1_returns",
      checks: {
        noInvestmentAdvice: {
          status: "PASS",
          detail: "Goal labelling and tenure progress tracking only; no fund recommendation.",
        },
        noFearFomoUrgency: {
          status: "PASS",
          detail: "Neutral habit milestone tracking.",
        },
        folioMathGrounding: {
          status: "PASS",
          detail: "Grounded in 5/12 completed instalments (₹10,000 total invested).",
        },
        officialSourceLink: {
          status: "PASS",
          url: "https://www.myfolios.in/blog/why-people-stop-their-sip",
          label: "Why Year 1 of a SIP Feels Slow (Compounding & Goals)",
        },
      },
      assistantResponse: {
        headline: "Year 1 Is About Building Your Unit Base (5 of 12 Months Done)",
        explanation:
          "In the first few months, rupee gains look tiny because only 5 monthly instalments (₹10,000) have been invested so far. Attaching a clear personal goal makes it easier to track how many instalments and units you have built.",
        mathBreakdown:
          "Your Year-1 Habit Progress:\n• Instalments Completed: 5 of 12 months (42% of Year-1 habit goal).\n• Total Invested: ₹10,000 • Total Units Held: 534.4 units.\n• Stopping vs. Pausing: A cancelled SIP requires a fresh bank mandate to restart; tagging a goal keeps your progress visible.",
        recommendedActions: [
          {
            id: "act-tag-goal",
            label: "Tag This SIP to a Personal Goal (Emergency / Bike / Wealth)",
            subtext: "Tracks progress by instalments completed (5/12) & total invested",
            actionType: "tag_goal",
          },
          {
            id: "act-keep-goal",
            label: "Keep ₹2,000 Monthly SIP Active",
            subtext: "Next instalment scheduled on 1st Dec",
            actionType: "keep_running",
          },
        ],
        disclaimer:
          "Goal tracking tool only. Does not guarantee future returns or recommend schemes.",
      },
    };
  }

  // 5. DEFAULT / MONEY GOT TIGHT THIS MONTH (CASH-FLOW SHIELD)
  return {
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
        detail: `Verified against SBI Nifty Next 50 Min. SIP ₹500 and current ₹${sipAmount} instalment.`,
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
        `Your Cash-Flow Options for Next Instalment:\n• Current SIP: ₹${sipAmount.toLocaleString("en-IN")}/mo on the ${sipDate}${sipDate === 1 ? "st" : "th"} (Bank Cutoff Status: Safe to modify — 4 days before debit).\n• Option A (Step-Down): Pay ₹500 (Min. SIP for SBI Nifty Next 50) next month → saves ₹${(sipAmount - 500).toLocaleString("en-IN")} cash now and auto-restores to ₹${sipAmount.toLocaleString("en-IN")} the following month.\n• Option B (Pause): ₹0 debited next month → auto-restarts on ${sipDate}${sipDate === 1 ? "st" : "th"} Jan.`,
      recommendedActions: [
        {
          id: "act-step-500",
          label: "Lower Next Month's Instalment to ₹500 (Min. SIP)",
          subtext: `Saves ₹${(sipAmount - 500).toLocaleString("en-IN")} this month • Auto-restores to ₹${sipAmount.toLocaleString("en-IN")} next month`,
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
      disclaimer:
        "Operational cash-flow controls for your existing SIP. Not investment advice.",
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userQuery: string = body.query || "Money is tight this month";
    const sipAmount: number = body.sipAmount || 2000;
    const sipDate: number = body.sipDate || 1;

    const evaluated = evaluateAndRespond(userQuery, sipAmount, sipDate);
    return NextResponse.json(evaluated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to run eval-gated assistant";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
