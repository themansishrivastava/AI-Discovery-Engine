export type JourneyStage =
  | "onboarding_mandate"
  | "month_1_to_3_expectations"
  | "market_dip_reaction"
  | "cashflow_crunch"
  | "habit_decay_month_6_12";

export type ChurnType =
  | "voluntary_pause_stop"
  | "involuntary_payment_kyc_fail"
  | "at_risk_confusion"
  | "retained_habit";

export type PrimaryTheme =
  | "Autopay & Mandate Friction"
  | "Allotment & T+2 NAV Trust Gap"
  | "Early Returns Disappointment (Month 1–4)"
  | "Market Dip Panic & Loss Aversion"
  | "Rigid Cash-Flow / No Flexible Skip"
  | "Portfolio Clutter & Fund Selection Doubt"
  | "External Finfluencer / Family Noise"
  | "KYC / Bank / Folio Operational Block"
  | "Long-Term Habit & Goal Clarity";

export type DiscoveryQuestionId =
  | "Q1_why_start_expectations"
  | "Q2_behaviour_change_after_start"
  | "Q3_why_pause_reduce_stop"
  | "Q4_what_and_how_often_check"
  | "Q5_in_app_confusion_worry"
  | "Q6_outside_app_validation"
  | "Q7_continue_vs_quiet_dropoff"
  | "Q8_segment_differences"
  | "Q9_unmet_needs";

export interface EvidenceItem {
  id: string;
  source: string;
  platform: string;
  rating?: number | null;
  date: string;
  text: string;
  segment: string;
  monthsActiveEstimate: string;
  // AI Classified fields
  aiTheme: PrimaryTheme;
  aiStage: JourneyStage;
  aiChurnType: ChurnType;
  aiDiscoveryQuestions: DiscoveryQuestionId[];
  aiEvidenceQuality: "High" | "Medium" | "Low";
  aiConfidence: number;
  aiSummary: string;
  // Golden set & Human-in-the-loop fields
  isGoldenSet?: boolean;
  humanGoldenTheme?: PrimaryTheme;
  humanGoldenStage?: JourneyStage;
  humanGoldenChurnType?: ChurnType;
  pmOverrideStatus?: "accepted" | "corrected" | "rejected";
  pmOverrideTheme?: PrimaryTheme;
  pmOverrideStage?: JourneyStage;
  pmOverrideReason?: string;
}

export const DISCOVERY_QUESTIONS: {
  id: DiscoveryQuestionId;
  shortLabel: string;
  fullQuestion: string;
  bestSources: string;
}[] = [
  {
    id: "Q1_why_start_expectations",
    shortLabel: "Q1: Why Start & Expectations",
    fullQuestion: "Why do people start a SIP, and what do they expect to happen?",
    bestSources: "Reddit (r/MutualFundsIndia, r/personalfinanceindia), YouTube comments",
  },
  {
    id: "Q2_behaviour_change_after_start",
    shortLabel: "Q2: Behaviour Change (Months 1–6)",
    fullQuestion: "What changes in their behaviour in the months after starting?",
    bestSources: "Reddit 'X months in' posts, App Store reviews",
  },
  {
    id: "Q3_why_pause_reduce_stop",
    shortLabel: "Q3: Triggers to Pause / Reduce / Stop",
    fullQuestion: "What leads investors to pause, reduce or stop a SIP?",
    bestSources: "Play Store 1–3★ reviews, Reddit, TradingQ&A, AMFI stoppage benchmark",
  },
  {
    id: "Q4_what_and_how_often_check",
    shortLabel: "Q4: Checking Frequency & Obsession",
    fullQuestion: "What do investors check, and how often, once they have started?",
    bestSources: "Reddit beginner threads, App reviews",
  },
  {
    id: "Q5_in_app_confusion_worry",
    shortLabel: "Q5: In-App Confusion & Anxiety",
    fullQuestion: "What confuses or worries them inside the app?",
    bestSources: "Groww / Coin Play Store & App Store reviews, ConsumerComplaints, SCORES",
  },
  {
    id: "Q6_outside_app_validation",
    shortLabel: "Q6: Outside-App Validation Behaviour",
    fullQuestion: "What do they do outside the app when they feel unsure?",
    bestSources: "Reddit portfolio reviews, YouTube comments, Google Trends",
  },
  {
    id: "Q7_continue_vs_quiet_dropoff",
    shortLabel: "Q7: Continuers vs Quiet Drop-offs",
    fullQuestion: "What separates investors who continue from those who quietly drop off?",
    bestSources: "Reddit long-term vs 'I quit' posts, AMFI new vs discontinued SIPs",
  },
  {
    id: "Q8_segment_differences",
    shortLabel: "Q8: User Segment Differences",
    fullQuestion: "How do patterns differ across segments (income stability, age, source of money, influencers)?",
    bestSources: "r/developersIndia vs Hindi YouTube vs Bank/Payments app reviews",
  },
  {
    id: "Q9_unmet_needs",
    shortLabel: "Q9: Consistent Unmet Needs",
    fullQuestion: "What unmet needs emerge consistently across conversations?",
    bestSources: "Cross-source clustering of complaints & feature requests",
  },
];

export const JOURNEY_STAGE_LABELS: Record<JourneyStage, { label: string; months: string; description: string }> = {
  onboarding_mandate: {
    label: "Gate 1: Mandate & 1st Instalment",
    months: "Month 0–1",
    description: "UPI Autopay / OTM setup, T+2 unit allotment delay, KYC verification",
  },
  month_1_to_3_expectations: {
    label: "Gate 2: Early Returns Reality Check",
    months: "Month 1–3",
    description: "Daily NAV checking, comparing SIP with FD, confused by XIRR vs absolute gain",
  },
  market_dip_reaction: {
    label: "Gate 3: First Market Correction",
    months: "Month 3–6",
    description: "Portfolio turns red for the first time; panic pausing vs rupee-cost averaging",
  },
  cashflow_crunch: {
    label: "Gate 4: Cash-Flow & Salary Crunch",
    months: "Month 4–9",
    description: "Irregular expenses, wrong SIP date, bank bounce penalty fear, cancelling instead of skipping",
  },
  habit_decay_month_6_12: {
    label: "Gate 5: Habit Decay & Clutter",
    months: "Month 6–12",
    description: "Too many funds from finfluencer videos, goal ambiguity, silent lapse after 3 failed debits",
  },
};

export const SEED_EVIDENCE: EvidenceItem[] = [
  {
    id: "EV-001",
    source: "Google Play Store",
    platform: "Groww",
    rating: 2,
    date: "2026-09-14",
    text: "Started my first SIP of ₹2,000 on Groww. Money got deducted from my SBI account via autopay 3 days ago, still dashboard shows 0 units and order in progress. Support gives copy-paste reply about BSE Star MF cut-off. I cancelled my future SIP mandate right away because I cannot risk my salary getting stuck every month.",
    segment: "First-job salaried (22–26), Tier-2",
    monthsActiveEstimate: "Month 1",
    aiTheme: "Allotment & T+2 NAV Trust Gap",
    aiStage: "onboarding_mandate",
    aiChurnType: "voluntary_pause_stop",
    aiDiscoveryQuestions: ["Q3_why_pause_reduce_stop", "Q5_in_app_confusion_worry"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.94,
    aiSummary: "First-time investor cancelled SIP mandate in Month 1 because T+2/T+3 unit allotment delay felt like money was lost after bank debit.",
    isGoldenSet: true,
    humanGoldenTheme: "Allotment & T+2 NAV Trust Gap",
    humanGoldenStage: "onboarding_mandate",
    humanGoldenChurnType: "voluntary_pause_stop",
    pmOverrideStatus: "accepted",
  },
  {
    id: "EV-002",
    source: "Reddit r/MutualFundsIndia",
    platform: "Groww",
    rating: null,
    date: "2026-08-22",
    text: "23M software engineer, 4 months into my first SIP (₹5k in Nifty 50 + ₹5k in Midcap on Groww). Checked the app every single day at 10 PM after NAV update. Right now total gain is ₹140 in 4 months and yesterday it went -₹620 red. My father says FD gives guaranteed 7.25% without tension. Seriously thinking of stopping SIP and putting in FD.",
    segment: "Young salaried tech, family-influenced",
    monthsActiveEstimate: "Month 4",
    aiTheme: "Early Returns Disappointment (Month 1–4)",
    aiStage: "month_1_to_3_expectations",
    aiChurnType: "at_risk_confusion",
    aiDiscoveryQuestions: ["Q1_why_start_expectations", "Q2_behaviour_change_after_start", "Q4_what_and_how_often_check", "Q8_segment_differences"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.96,
    aiSummary: "Daily NAV checking at 10 PM combined with flat 4-month returns and parental FD comparison creates urge to quit early.",
    isGoldenSet: true,
    humanGoldenTheme: "Early Returns Disappointment (Month 1–4)",
    humanGoldenStage: "month_1_to_3_expectations",
    humanGoldenChurnType: "at_risk_confusion",
    pmOverrideStatus: "accepted",
  },
  {
    id: "EV-003",
    source: "Google Play Store",
    platform: "Groww",
    rating: 1,
    date: "2026-09-02",
    text: "My SIP date was 5th of every month but my company delayed salary to 10th. I wanted to pause SIP just for this month on the 4th, but Groww said pause request needs 3 working days before instalment! Autopay failed and my bank charged ₹295 + GST NACH bounce charge on a ₹1,000 SIP! Deleted autopay permanently.",
    segment: "Salaried with variable pay date",
    monthsActiveEstimate: "Month 5",
    aiTheme: "Autopay & Mandate Friction",
    aiStage: "onboarding_mandate",
    aiChurnType: "involuntary_payment_kyc_fail",
    aiDiscoveryQuestions: ["Q3_why_pause_reduce_stop", "Q5_in_app_confusion_worry", "Q9_unmet_needs"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.81,
    aiSummary: "User deleted autopay after T-3 day pause lock-in caused an unavoidable ₹295 bank NACH bounce fee when salary was delayed.",
    isGoldenSet: true,
    humanGoldenTheme: "Rigid Cash-Flow / No Flexible Skip",
    humanGoldenStage: "cashflow_crunch",
    humanGoldenChurnType: "voluntary_pause_stop",
    pmOverrideStatus: "corrected",
    pmOverrideTheme: "Rigid Cash-Flow / No Flexible Skip",
    pmOverrideStage: "cashflow_crunch",
    pmOverrideReason: "AI classified this as onboarding 'Autopay & Mandate Friction' (involuntary), but the root cause is Month-5 salary date mismatch + T-3 pause cutoff causing a ₹295 bank bounce penalty on a ₹1,000 SIP, which drove a deliberate permanent mandate deletion.",
  },
  {
    id: "EV-004",
    source: "Reddit r/personalfinanceindia",
    platform: "Groww / General",
    rating: null,
    date: "2026-07-19",
    text: "When I started my first SIP 6 months ago after watching 5 YouTube videos, I picked 7 different funds (small cap, defence thematic, momentum, PSU, flexi, nifty, gold) of ₹500 each. Now I have no clue which one is doing what, half are red, and managing 7 bank debits a month is annoying my bank statement. I stopped 5 of them last week.",
    segment: "Finfluencer-influenced beginner",
    monthsActiveEstimate: "Month 6",
    aiTheme: "Portfolio Clutter & Fund Selection Doubt",
    aiStage: "habit_decay_month_6_12",
    aiChurnType: "voluntary_pause_stop",
    aiDiscoveryQuestions: ["Q1_why_start_expectations", "Q2_behaviour_change_after_start", "Q3_why_pause_reduce_stop", "Q6_outside_app_validation"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.92,
    aiSummary: "Beginner started 7 tiny SIPs due to YouTube finfluencers; cognitive overload and multiple bank debits led to stopping 5 SIPs by Month 6.",
    isGoldenSet: true,
    humanGoldenTheme: "Portfolio Clutter & Fund Selection Doubt",
    humanGoldenStage: "habit_decay_month_6_12",
    humanGoldenChurnType: "voluntary_pause_stop",
    pmOverrideStatus: "accepted",
  },
  {
    id: "EV-005",
    source: "YouTube Comments (Hindi Finfluencer)",
    platform: "Groww",
    rating: null,
    date: "2026-08-11",
    text: "Sir maine 3 mahine pehle Groww pe ₹1500 ka SIP chalu kiya tha. Abhi market gira toh mera portfolio -4.8% dikha raha hai. Kya abhi SIP pause kar du aur jab market wapas upar jaye tab chalu karu? Dar lag raha hai paisa doob na jaye.",
    segment: "Tier-2/3 Hindi-speaking beginner",
    monthsActiveEstimate: "Month 3",
    aiTheme: "Market Dip Panic & Loss Aversion",
    aiStage: "market_dip_reaction",
    aiChurnType: "at_risk_confusion",
    aiDiscoveryQuestions: ["Q3_why_pause_reduce_stop", "Q6_outside_app_validation", "Q8_segment_differences", "Q9_unmet_needs"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.95,
    aiSummary: "First-time investor wants to pause SIP during a -4.8% market dip and resume when markets rise—classic misunderstanding of rupee-cost averaging.",
    isGoldenSet: true,
    humanGoldenTheme: "Market Dip Panic & Loss Aversion",
    humanGoldenStage: "market_dip_reaction",
    humanGoldenChurnType: "at_risk_confusion",
    pmOverrideStatus: "accepted",
  },
  {
    id: "EV-006",
    source: "Apple App Store (India)",
    platform: "Groww",
    rating: 2,
    date: "2026-09-29",
    text: "Why does Groww show XIRR as -18% when my actual loss is only ₹180 on ₹6,000 invested over 3 months?! Seeing -18% in big red font on the home screen gave me a mini heart attack. First time investors don't understand annualised XIRR for 90-day holdings.",
    segment: "Urban first-time investor (iOS)",
    monthsActiveEstimate: "Month 3",
    aiTheme: "Early Returns Disappointment (Month 1–4)",
    aiStage: "month_1_to_3_expectations",
    aiChurnType: "at_risk_confusion",
    aiDiscoveryQuestions: ["Q4_what_and_how_often_check", "Q5_in_app_confusion_worry", "Q9_unmet_needs"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.89,
    aiSummary: "Annualised XIRR (-18%) displayed on <6-month SIPs exaggerates tiny ₹180 fluctuations and triggers panic among beginners.",
    isGoldenSet: true,
    humanGoldenTheme: "Early Returns Disappointment (Month 1–4)",
    humanGoldenStage: "month_1_to_3_expectations",
    humanGoldenChurnType: "at_risk_confusion",
    pmOverrideStatus: "accepted",
  },
  {
    id: "EV-007",
    source: "TradingQ&A",
    platform: "Zerodha Coin / AMFI",
    rating: null,
    date: "2026-06-18",
    text: "After SEBI's new rule where 3 consecutive failed instalments automatically cancel the SIP registration, many beginners don't even realise their SIP is dead. Their UPI autopay notification expired or was swiped away during a busy week, and by month 7 the SIP is permanently ceased without a simple 1-tap restart.",
    segment: "DIY / Platform observer",
    monthsActiveEstimate: "Month 6–9",
    aiTheme: "Autopay & Mandate Friction",
    aiStage: "habit_decay_month_6_12",
    aiChurnType: "involuntary_payment_kyc_fail",
    aiDiscoveryQuestions: ["Q3_why_pause_reduce_stop", "Q7_continue_vs_quiet_dropoff", "Q9_unmet_needs"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.93,
    aiSummary: "SEBI's 3-consecutive-miss rule turns missed UPI autopay notifications into silent permanent SIP cancellation for passive beginners.",
    isGoldenSet: true,
    humanGoldenTheme: "Autopay & Mandate Friction",
    humanGoldenStage: "habit_decay_month_6_12",
    humanGoldenChurnType: "involuntary_payment_kyc_fail",
    pmOverrideStatus: "accepted",
  },
  {
    id: "EV-008",
    source: "Reddit r/MutualFundsIndia",
    platform: "Groww",
    rating: null,
    date: "2026-08-09",
    text: "I'm a college student investing ₹1,500/month from internship stipend. During exam months or semester fee month I only have ₹500 to spare. Groww makes editing SIP amount feel like cancelling the old SIP and creating a new one, losing my streak/history. So I paused it in May and honestly forgot to resume.",
    segment: "College student / irregular income",
    monthsActiveEstimate: "Month 5",
    aiTheme: "Rigid Cash-Flow / No Flexible Skip",
    aiStage: "cashflow_crunch",
    aiChurnType: "voluntary_pause_stop",
    aiDiscoveryQuestions: ["Q2_behaviour_change_after_start", "Q3_why_pause_reduce_stop", "Q7_continue_vs_quiet_dropoff", "Q8_segment_differences"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.95,
    aiSummary: "Student with irregular cash flow wanted to temporarily step down from ₹1,500 to ₹500; friction in editing amount led to an indefinite pause.",
    isGoldenSet: true,
    humanGoldenTheme: "Rigid Cash-Flow / No Flexible Skip",
    humanGoldenStage: "cashflow_crunch",
    humanGoldenChurnType: "voluntary_pause_stop",
    pmOverrideStatus: "accepted",
  },
  {
    id: "EV-009",
    source: "ConsumerComplaints.in",
    platform: "Groww",
    rating: 1,
    date: "2026-05-12",
    text: "My monthly SIP ran fine for 4 months. Suddenly in month 5 the order was rejected by AMC saying KYC status is 'On Hold' because of Aadhaar-PAN KRA validation rule. Groww never warned me before debiting the money! Money stayed stuck for 9 days before refund. I have stopped all my SIPs on Groww.",
    segment: "First-year retail investor",
    monthsActiveEstimate: "Month 5",
    aiTheme: "KYC / Bank / Folio Operational Block",
    aiStage: "cashflow_crunch",
    aiChurnType: "involuntary_payment_kyc_fail",
    aiDiscoveryQuestions: ["Q3_why_pause_reduce_stop", "Q5_in_app_confusion_worry"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.91,
    aiSummary: "Mid-journey KRA KYC hold caused SIP rejection after money was already debited, destroying platform trust in Month 5.",
    isGoldenSet: true,
    humanGoldenTheme: "KYC / Bank / Folio Operational Block",
    humanGoldenStage: "onboarding_mandate",
    humanGoldenChurnType: "involuntary_payment_kyc_fail",
    pmOverrideStatus: "accepted",
  },
  {
    id: "EV-010",
    source: "Reddit r/IndiaInvestments",
    platform: "General / Groww",
    rating: null,
    date: "2026-09-01",
    text: "Completed 12 months of my first ever SIP today! Honestly what kept me going through the March dip was two things: 1) My SIP date is 2nd of the month right after salary hits on 1st so I never see the money as spendable, and 2) I stopped looking at the % return tab and only tracked 'Total Units Accumulated' & '12/12 months consistency'.",
    segment: "Disciplined first-time salaried",
    monthsActiveEstimate: "Month 12",
    aiTheme: "Long-Term Habit & Goal Clarity",
    aiStage: "habit_decay_month_6_12",
    aiChurnType: "retained_habit",
    aiDiscoveryQuestions: ["Q2_behaviour_change_after_start", "Q4_what_and_how_often_check", "Q7_continue_vs_quiet_dropoff"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.97,
    aiSummary: "12-month continuer succeeded by aligning SIP date to salary day +1 and focusing on units accumulated & consistency rather than short-term % return.",
    isGoldenSet: true,
    humanGoldenTheme: "Long-Term Habit & Goal Clarity",
    humanGoldenStage: "habit_decay_month_6_12",
    humanGoldenChurnType: "retained_habit",
    pmOverrideStatus: "accepted",
  },
  {
    id: "EV-011",
    source: "Reddit r/MutualFundsIndia",
    platform: "Groww",
    rating: null,
    date: "2026-08-30",
    text: "Just noticed exit load and STCG tax when I tried to withdraw my 6-month SIP for buying a bike! Nobody told me when starting the SIP that equity mutual funds have 1% exit load before 1 year and 20% STCG tax. I thought SIP is like a recurring deposit I can break anytime.",
    segment: "First-time investor using SIP as short-term RD",
    monthsActiveEstimate: "Month 6",
    aiTheme: "KYC / Bank / Folio Operational Block",
    aiStage: "habit_decay_month_6_12",
    aiChurnType: "voluntary_pause_stop",
    aiDiscoveryQuestions: ["Q1_why_start_expectations", "Q5_in_app_confusion_worry", "Q9_unmet_needs"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.76,
    aiSummary: "User treated equity SIP like a 6-month bank Recurring Deposit (RD) and felt blindsided by 1% exit load and 20% STCG tax on redemption.",
    isGoldenSet: true,
    humanGoldenTheme: "Early Returns Disappointment (Month 1–4)",
    humanGoldenStage: "onboarding_mandate",
    humanGoldenChurnType: "voluntary_pause_stop",
    pmOverrideStatus: "corrected",
    pmOverrideTheme: "Early Returns Disappointment (Month 1–4)",
    pmOverrideStage: "onboarding_mandate",
    pmOverrideReason: "AI labelled this 'KYC / Bank / Folio Operational Block', which is wrong. This is a mental-model mismatch at SIP creation: the user thought an Equity SIP works like a 6-month liquid bank RD and was shocked by exit load & STCG.",
  },
  {
    id: "EV-012",
    source: "YouTube Comments (Pranjal Kamra)",
    platform: "General",
    rating: null,
    date: "2026-07-04",
    text: "Every YouTuber says 'start SIP and get 15% compounding'. I started ₹3,000/month 5 months ago and my ₹15,000 is sitting at ₹14,820. Where is the compounding? Feeling cheated, whenever I feel confused I watch 10 more YouTube videos and each one says my fund is bad and I should switch to another fund.",
    segment: "YouTube-driven retail beginner",
    monthsActiveEstimate: "Month 5",
    aiTheme: "External Finfluencer / Family Noise",
    aiStage: "month_1_to_3_expectations",
    aiChurnType: "at_risk_confusion",
    aiDiscoveryQuestions: ["Q1_why_start_expectations", "Q6_outside_app_validation", "Q9_unmet_needs"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.93,
    aiSummary: "Unrealistic '15% linear compounding' expectation from YouTube leads to disillusionment at Month 5 and constant fund-switching anxiety.",
    isGoldenSet: true,
    humanGoldenTheme: "External Finfluencer / Family Noise",
    humanGoldenStage: "month_1_to_3_expectations",
    humanGoldenChurnType: "at_risk_confusion",
    pmOverrideStatus: "accepted",
  },
  {
    id: "EV-013",
    source: "Google Play Store",
    platform: "PhonePe / Groww",
    rating: 3,
    date: "2026-08-15",
    text: "In GPay/PhonePe I kept seeing ₹15,000 max limit on UPI Autopay mandate when setting up my Groww SIP, even though my SIP is only ₹2,000! I thought Groww was trying to deduct ₹15,000 from my account so I declined the UPI mandate pin and abandoned the SIP.",
    segment: "UPI-first cautious beginner",
    monthsActiveEstimate: "Month 1",
    aiTheme: "Autopay & Mandate Friction",
    aiStage: "onboarding_mandate",
    aiChurnType: "involuntary_payment_kyc_fail",
    aiDiscoveryQuestions: ["Q3_why_pause_reduce_stop", "Q5_in_app_confusion_worry", "Q8_segment_differences"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.96,
    aiSummary: "Default ₹15,000 UPI Autopay maximum mandate limit scares ₹2,000 SIP beginners into declining the UPI PIN screen.",
    isGoldenSet: true,
    humanGoldenTheme: "Autopay & Mandate Friction",
    humanGoldenStage: "onboarding_mandate",
    humanGoldenChurnType: "involuntary_payment_kyc_fail",
    pmOverrideStatus: "accepted",
  },
  {
    id: "EV-014",
    source: "Reddit r/developersIndia",
    platform: "Groww / Zerodha Coin",
    rating: null,
    date: "2026-09-10",
    text: "Anyone else started SIP with first salary and then stopped around Diwali / wedding season? Had ₹10k SIP running for 7 months, paused it in October for festival travel + family gifts, and now 4 months later I still haven't restarted it because there's no 'auto-resume after 1 month' reminder that actually works.",
    segment: "Young salaried professional",
    monthsActiveEstimate: "Month 7",
    aiTheme: "Rigid Cash-Flow / No Flexible Skip",
    aiStage: "cashflow_crunch",
    aiChurnType: "voluntary_pause_stop",
    aiDiscoveryQuestions: ["Q2_behaviour_change_after_start", "Q3_why_pause_reduce_stop", "Q7_continue_vs_quiet_dropoff", "Q9_unmet_needs"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.94,
    aiSummary: "Temporary seasonal pause (Diwali/travel) in Month 7 turned into permanent drop-off because pausing lacked a built-in auto-resume/1-instalment skip flow.",
    isGoldenSet: true,
    humanGoldenTheme: "Rigid Cash-Flow / No Flexible Skip",
    humanGoldenStage: "cashflow_crunch",
    humanGoldenChurnType: "voluntary_pause_stop",
    pmOverrideStatus: "accepted",
  },
  {
    id: "EV-015",
    source: "Google Play Store",
    platform: "Groww",
    rating: 1,
    date: "2026-09-18",
    text: "Groww F&O options chart froze at 9:20 AM expiry day and I lost ₹18,000 in BankNifty calls!! Worst broker ever, uninstalling!",
    segment: "Intraday F&O Trader (Noise / Out of Target)",
    monthsActiveEstimate: "N/A",
    aiTheme: "Market Dip Panic & Loss Aversion",
    aiStage: "market_dip_reaction",
    aiChurnType: "voluntary_pause_stop",
    aiDiscoveryQuestions: ["Q3_why_pause_reduce_stop"],
    aiEvidenceQuality: "Low",
    aiConfidence: 0.62,
    aiSummary: "F&O options trader complaining about intraday chart lag during expiry.",
    isGoldenSet: true,
    humanGoldenTheme: "KYC / Bank / Folio Operational Block",
    humanGoldenStage: "onboarding_mandate",
    humanGoldenChurnType: "voluntary_pause_stop",
    pmOverrideStatus: "rejected",
    pmOverrideReason: "Rejected AI inclusion: This is an intraday BankNifty F&O options complaint, NOT a first-time mutual fund SIP investor. Our engine must filter out F&O/intraday noise so it doesn't pollute SIP retention insights.",
  },
  {
    id: "EV-016",
    source: "Reddit r/IndianStockMarket",
    platform: "Groww",
    rating: null,
    date: "2026-07-28",
    text: "When the market fell 3% on Budget day, I paid ₹2,000 extra via one-time lumpsum on my SIP fund at 1:30 PM thinking I'll get today's low NAV. Instead I got next day's higher NAV because bank transfer reached BSE after 2 PM! Apps never show live NAV cut-off timer clearly.",
    segment: "Active beginner trying to time dips",
    monthsActiveEstimate: "Month 4",
    aiTheme: "Allotment & T+2 NAV Trust Gap",
    aiStage: "market_dip_reaction",
    aiChurnType: "at_risk_confusion",
    aiDiscoveryQuestions: ["Q5_in_app_confusion_worry", "Q9_unmet_needs"],
    aiEvidenceQuality: "Medium",
    aiConfidence: 0.90,
    aiSummary: "Confusion around 2 PM BSE Star MF cut-off time and fund realization rules causes frustration over which day's NAV is allotted.",
    isGoldenSet: true,
    humanGoldenTheme: "Allotment & T+2 NAV Trust Gap",
    humanGoldenStage: "market_dip_reaction",
    humanGoldenChurnType: "at_risk_confusion",
    pmOverrideStatus: "accepted",
  },
  {
    id: "EV-017",
    source: "Google Play Store",
    platform: "MFCentral / CAMS",
    rating: 2,
    date: "2026-08-03",
    text: "Why am I getting two different emails from CAMS and KFintech with password-protected PDFs when I invested through Groww? As a first time investor I thought someone opened multiple accounts in my PAN. None of these statements match the simple screen in the app.",
    segment: "First-time MF investor confused by RTA emails",
    monthsActiveEstimate: "Month 2",
    aiTheme: "Allotment & T+2 NAV Trust Gap",
    aiStage: "onboarding_mandate",
    aiChurnType: "at_risk_confusion",
    aiDiscoveryQuestions: ["Q5_in_app_confusion_worry", "Q6_outside_app_validation"],
    aiEvidenceQuality: "Medium",
    aiConfidence: 0.88,
    aiSummary: "External RTA emails (CAMS/KFintech/BSE SMS) confuse new Groww investors who don't know how AMCs, RTAs, and brokers connect.",
    isGoldenSet: true,
    humanGoldenTheme: "Allotment & T+2 NAV Trust Gap",
    humanGoldenStage: "onboarding_mandate",
    humanGoldenChurnType: "at_risk_confusion",
    pmOverrideStatus: "accepted",
  },
  {
    id: "EV-018",
    source: "Reddit r/MutualFundsIndia",
    platform: "Groww / Kuvera",
    rating: null,
    date: "2026-09-21",
    text: "What separated my 2nd attempt at SIP (now at 14 months uninterrupted) from my 1st attempt (quit at 4 months) was linking my SIP to a named goal ('Emergency + Home Downpayment') and setting up a ₹500 micro-SIP fallback rule instead of pausing completely when money was tight.",
    segment: "Second-attempt retained investor",
    monthsActiveEstimate: "Month 12+",
    aiTheme: "Long-Term Habit & Goal Clarity",
    aiStage: "habit_decay_month_6_12",
    aiChurnType: "retained_habit",
    aiDiscoveryQuestions: ["Q7_continue_vs_quiet_dropoff", "Q9_unmet_needs"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.96,
    aiSummary: "Direct comparison from a repeat user: Goal tagging + stepping down to ₹500 instead of pausing solved their Month-4 drop-off.",
    isGoldenSet: true,
    humanGoldenTheme: "Long-Term Habit & Goal Clarity",
    humanGoldenStage: "habit_decay_month_6_12",
    humanGoldenChurnType: "retained_habit",
    pmOverrideStatus: "accepted",
  },
  {
    id: "EV-019",
    source: "YouTube Comments (Ankur Warikoo)",
    platform: "Groww",
    rating: null,
    date: "2026-06-25",
    text: "I started SIP because everyone in my office cafeteria was talking about mutual funds. First 2 months I checked Groww 5 times a day. By month 6 my portfolio was flat +1.2% while gold went up 15%. I paused my equity SIP and moved money to gold jewellery with my mom.",
    segment: "Peer-influenced first-time investor",
    monthsActiveEstimate: "Month 6",
    aiTheme: "External Finfluencer / Family Noise",
    aiStage: "habit_decay_month_6_12",
    aiChurnType: "voluntary_pause_stop",
    aiDiscoveryQuestions: ["Q1_why_start_expectations", "Q2_behaviour_change_after_start", "Q3_why_pause_reduce_stop", "Q8_segment_differences"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.91,
    aiSummary: "Started due to office peer buzz; obsessive checking in Months 1–2 gave way to Month-6 asset comparison (Gold vs flat Equity) and family influence.",
    isGoldenSet: true,
    humanGoldenTheme: "External Finfluencer / Family Noise",
    humanGoldenStage: "habit_decay_month_6_12",
    humanGoldenChurnType: "voluntary_pause_stop",
    pmOverrideStatus: "accepted",
  },
  {
    id: "EV-020",
    source: "Google Play Store",
    platform: "ET Money / Groww",
    rating: 3,
    date: "2026-09-05",
    text: "When my SIP is in negative returns during month 3, the app just shows red numbers without explaining that I actually bought more mutual fund units at a cheaper NAV this month! If the app showed 'You accumulated 14.2 extra units because NAV was lower', beginners wouldn't panic and cancel.",
    segment: "Self-aware retail investor",
    monthsActiveEstimate: "Month 3",
    aiTheme: "Market Dip Panic & Loss Aversion",
    aiStage: "market_dip_reaction",
    aiChurnType: "at_risk_confusion",
    aiDiscoveryQuestions: ["Q4_what_and_how_often_check", "Q5_in_app_confusion_worry", "Q7_continue_vs_quiet_dropoff", "Q9_unmet_needs"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.98,
    aiSummary: "Explicit user insight: Dashboards highlight red P&L instead of showing 'extra units accumulated at lower NAV' during early dips.",
    isGoldenSet: true,
    humanGoldenTheme: "Market Dip Panic & Loss Aversion",
    humanGoldenStage: "market_dip_reaction",
    humanGoldenChurnType: "at_risk_confusion",
    pmOverrideStatus: "accepted",
  },
  {
    id: "EV-021",
    source: "Reddit r/MutualFundsIndia",
    platform: "Groww",
    rating: null,
    date: "2026-09-12",
    text: "Every time I have a doubt about my SIP on Groww, I take a screenshot and post it on r/MutualFundsIndia asking 'Hold or Stop?'. Half the comments roast my fund choice and tell me to redeem immediately. It's exhausting for a beginner who just wanted a simple habit.",
    segment: "Anxious beginner seeking external validation",
    monthsActiveEstimate: "Month 3",
    aiTheme: "External Finfluencer / Family Noise",
    aiStage: "month_1_to_3_expectations",
    aiChurnType: "at_risk_confusion",
    aiDiscoveryQuestions: ["Q6_outside_app_validation", "Q9_unmet_needs"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.94,
    aiSummary: "Lack of in-app context during early months pushes users to post screenshots on Reddit, where conflicting advice triggers fund churn.",
    isGoldenSet: false,
  },
  {
    id: "EV-022",
    source: "Google Play Store",
    platform: "Groww",
    rating: 2,
    date: "2026-08-19",
    text: "My primary bank account ran low on balance on the 5th so my SIP instalment failed. On the 7th I got money in my account, why is there no 'Retry Failed SIP Instalment Now via UPI' button?! Instead I have to wait a whole month or do a separate one-time order which confuses my SIP tracking.",
    segment: "Salaried user with occasional balance miss",
    monthsActiveEstimate: "Month 4",
    aiTheme: "Autopay & Mandate Friction",
    aiStage: "cashflow_crunch",
    aiChurnType: "involuntary_payment_kyc_fail",
    aiDiscoveryQuestions: ["Q3_why_pause_reduce_stop", "Q5_in_app_confusion_worry", "Q9_unmet_needs"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.95,
    aiSummary: "Missing a '1-tap UPI Retry' after a failed auto-debit breaks the monthly SIP streak and contributes to 3-strike SEBI cancellation.",
    isGoldenSet: false,
  },
  {
    id: "EV-023",
    source: "TradingQ&A",
    platform: "Zerodha Coin / Groww",
    rating: null,
    date: "2026-08-27",
    text: "Look at the AMFI SIP stoppage ratio—it crossed 75%+ in recent months. A massive chunk of new SIP registrations are ₹500–₹1,000 SIPs opened by 20–25 year olds during bull market hype who stop within 4–6 months the moment smallcap indices sideways-correct for 90 days.",
    segment: "Market analyst / DIY community",
    monthsActiveEstimate: "Month 4–6",
    aiTheme: "Early Returns Disappointment (Month 1–4)",
    aiStage: "market_dip_reaction",
    aiChurnType: "voluntary_pause_stop",
    aiDiscoveryQuestions: ["Q1_why_start_expectations", "Q3_why_pause_reduce_stop", "Q7_continue_vs_quiet_dropoff", "Q8_segment_differences"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.92,
    aiSummary: "Connects AMFI macro stoppage data to young bull-market entrants quitting within 4–6 months when small-cap returns flatten.",
    isGoldenSet: false,
  },
  {
    id: "EV-024",
    source: "Reddit r/AskIndia",
    platform: "Groww / PhonePe",
    rating: null,
    date: "2026-07-14",
    text: "For people from non-finance families in Tier-3 towns, the word 'Mutual Fund is subject to market risk' still sounds like gambling to parents. When my mom saw ₹400 negative in my Groww app in month 2, she forced me to stop the SIP and open a Post Office RD.",
    segment: "Tier-3 young earner, family-controlled",
    monthsActiveEstimate: "Month 2",
    aiTheme: "External Finfluencer / Family Noise",
    aiStage: "month_1_to_3_expectations",
    aiChurnType: "voluntary_pause_stop",
    aiDiscoveryQuestions: ["Q3_why_pause_reduce_stop", "Q6_outside_app_validation", "Q8_segment_differences"],
    aiEvidenceQuality: "High",
    aiConfidence: 0.95,
    aiSummary: "Family distrust in Tier-3 households turns the first minor negative P&L in Month 2 into forced SIP termination.",
    isGoldenSet: false,
  },
];

export interface OpportunityArea {
  id: string;
  title: string;
  targetGate: string;
  linkedTheme: PrimaryTheme;
  metricLever: string;
  evidenceCount: number;
  highQualityRatio: string;
  impactScore: number; // 1-10
  confidenceScore: number; // 1-10
  effortScore: number; // 1-10 (lower is easier)
  problemStatement: string;
  productHypothesis: string;
  guardrailCheck: {
    noFundAdvice: boolean;
    noFearFomoUrgency: boolean;
    complianceNote: string;
  };
}

export const OPPORTUNITY_AREAS: OpportunityArea[] = [
  {
    id: "OPP-1",
    title: "Flexible Cash-Flow Shield (Skip 1 Month / Micro-Step-Down / Auto-Resume)",
    targetGate: "Gate 4: Month 4–9 Cash-Flow & Salary Crunch",
    linkedTheme: "Rigid Cash-Flow / No Flexible Skip",
    metricLever: "% of cash-strapped users who step down or auto-resume instead of cancelling mandate",
    evidenceCount: 5,
    highQualityRatio: "100% High-quality first-hand",
    impactScore: 9.5,
    confidenceScore: 9.2,
    effortScore: 4.0,
    problemStatement:
      "When salary is delayed, exams/festivals hit, or expenses spike, users face a rigid T-3 pause window and fear ₹295+ bank NACH bounce charges—causing them to delete their mandate or pause indefinitely without resuming.",
    productHypothesis:
      "If we introduce a 'Salary-Sync Date Picker (2nd–5th)', a 4-day pre-debit balance heads-up with 1-tap 'Drop this month to ₹500' or 'Pause for 1 month with guaranteed Auto-Resume date', and a '1-Tap UPI Retry' for missed debits (avoiding SEBI 3-strike cancellation), we will significantly reduce Month 4–9 drop-off.",
    guardrailCheck: {
      noFundAdvice: true,
      noFearFomoUrgency: true,
      complianceNote: "Purely operational cash-flow flexibility on the user's existing chosen SIP; zero fund advice or urgency tactics.",
    },
  },
  {
    id: "OPP-2",
    title: "First-180-Days 'Units & Habit View' (De-emphasize Early Annualised XIRR)",
    targetGate: "Gate 2 & 3: Month 1–6 Early Returns & First Market Dip",
    linkedTheme: "Early Returns Disappointment (Month 1–4)",
    metricLever: "% of Month 1–6 users surviving their first negative/flat return cycle",
    evidenceCount: 6,
    highQualityRatio: "92% High-quality first-hand",
    impactScore: 9.0,
    confidenceScore: 8.8,
    effortScore: 3.5,
    problemStatement:
      "First-time investors check the app daily and see volatile annualised XIRR (e.g., -18% on a ₹180 dip after 60 days) or flat gains vs FDs, triggering panic pauses during their first market dip.",
    productHypothesis:
      "If we replace annualised XIRR in the first 6 months with a 'First-Year Habit & Unit Tracker' (showing total instalments completed e.g. 4/12, total units accumulated, and an educational card showing how a lower NAV day bought +X extra units via rupee-cost averaging), we reframe market dips from 'money lost' to 'units accumulated'.",
    guardrailCheck: {
      noFundAdvice: true,
      noFearFomoUrgency: true,
      complianceNote: "Educational reframing of unit accumulation using the user's own transaction maths; calm, factual tone with zero FOMO.",
    },
  },
  {
    id: "OPP-3",
    title: "Live T+2 Allotment Tracker & UPI Autopay 'Max Limit' Demystifier",
    targetGate: "Gate 1: Month 0–1 Mandate Setup & First Instalment",
    linkedTheme: "Allotment & T+2 NAV Trust Gap",
    metricLever: "% of new SIP starters completing Instalment #1 & #2 with active Autopay",
    evidenceCount: 5,
    highQualityRatio: "85% High-quality first-hand",
    impactScore: 8.5,
    confidenceScore: 9.0,
    effortScore: 3.0,
    problemStatement:
      "New investors panic during the 2–3 day gap between bank debit and BSE/AMC unit allotment ('money deducted, 0 units shown'), and many decline UPI Autopay because the default ₹15,000 RBI mandate cap looks like an overcharge.",
    productHypothesis:
      "If we add a pizza-tracker style 'Where is my SIP money?' timeline (Bank Debited → Sent to BSE Star MF → AMC Allotting NAV on [Date] → CAMS/KFintech Email Explainer) and pre-explain the UPI ₹15,000 regulatory cap before redirecting to GPay/PhonePe, we eliminate Month-1 trust cancellations.",
    guardrailCheck: {
      noFundAdvice: true,
      noFearFomoUrgency: true,
      complianceNote: "Transparent order-settlement tracking and UPI mandate clarity.",
    },
  },
  {
    id: "OPP-4",
    title: "Pre-SIP Expectation Calibration & Anti-Clutter Guardrail",
    targetGate: "Gate 1 & Gate 5: Setup & Month 6–12 Portfolio Clutter",
    linkedTheme: "Portfolio Clutter & Fund Selection Doubt",
    metricLever: "% of beginners starting with 1–2 manageable SIP dates instead of 5–7 scattered debits",
    evidenceCount: 4,
    highQualityRatio: "90% High-quality first-hand",
    impactScore: 7.8,
    confidenceScore: 8.2,
    effortScore: 3.5,
    problemStatement:
      "Finfluencer-driven beginners start 5–7 small SIPs across different dates or treat Equity SIPs like a 6-month bank RD, leading to bank-statement fatigue, exit-load shock, and mass cancellations by Month 6.",
    productHypothesis:
      "If we show a 15-second 'How SIPs Actually Work' expectation check at setup (12+ month horizon, exit load/STCG basics, and consolidating multiple SIP dates into a single monthly debit date), users set realistic horizons and avoid debit fatigue.",
    guardrailCheck: {
      noFundAdvice: true,
      noFearFomoUrgency: true,
      complianceNote: "Does not recommend which fund to buy; only explains operational rules (exit load, tax, single debit date).",
    },
  },
];

export const AMFI_BENCHMARK_CONTEXT = [
  {
    metric: "AMFI Monthly SIP Contribution (Aug 2026)",
    value: "₹32,297 Cr",
    insight: "All-time high inflows across 10.02 Cr active SIP accounts, proving acquisition is not the bottleneck—early cohort retention is.",
  },
  {
    metric: "SEBI 3-Consecutive-Miss Cease Rule",
    value: "3 Missed Instalments = Auto-Terminated",
    insight: "Under SEBI guidelines, monthly SIPs that fail 3 consecutive instalments are automatically ceased/discontinued—making involuntary mandate failures a major driver of 12-month drop-off.",
  },
  {
    metric: "Industry SIP Stoppage / Discontinuation Ratio",
    value: "High early churn in 0–12M cohorts",
    insight: "Public forum + AMFI stoppage trends show first-time ₹500–₹2,000 SIP cohorts experience their steepest drop-off around Month 1 (mandate/allotment) and Months 3–6 (first market dip or cash crunch).",
  },
];
