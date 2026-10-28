export type HelperIntent =
  | "tight_money"
  | "failed_autopay"
  | "red_return_worry"
  | "fund_advice"
  | "market_prediction"
  | "general_sip_question"
  | "unclear";

export type HelperLang = "en" | "hi";

export interface TemplateAction {
  id: string;
  label: string;
  subtext: string;
  actionType: "lower_amount" | "skip_one" | "keep_as_is" | "pay_one_time" | "units_view" | "official_link";
  href?: string;
}

export interface TemplateOutput {
  headline: string;
  explanation: string;
  timingNote: string;
  activeSipNote?: string;
  conditionalPolicyNote: string;
  schemeDocLink: { label: string; url: string };
  helpLink: { label: string; url: string };
  actions: TemplateAction[];
}

export const HELPER_CONFIG = {
  ACTION_DAYS_BEFORE_INSTALMENT: 3,
  MIN_CONFIDENCE_THRESHOLD: 0.7,
  RATE_LIMIT_MAX_PER_MIN: 20,
  OFFICIAL_URLS: {
    amfi: "https://www.amfiindia.com/articles/mutual-fund",
    growwHelp: "https://groww.in/help/mutual-funds/order/why-was-my-order-cancelled--68",
    schemeDoc: "https://www.sbimf.com/en-us/index-funds/sbi-nifty-next-50-index-fund",
  },
};

const N = HELPER_CONFIG.ACTION_DAYS_BEFORE_INSTALMENT;

export const HELPER_TEMPLATES: Record<
  "tight_money" | "failed_autopay" | "red_return_worry" | "general_sip_question" | "safe_fallback_advice" | "safe_fallback_unclear",
  Record<HelperLang, TemplateOutput>
> = {
  tight_money: {
    en: {
      headline: "Options for a temporary cash-flow crunch before your instalment",
      explanation:
        "If you have unexpected expenses or a delayed salary this month, you can adjust your upcoming instalment in the app.",
      timingNote: `To change this month's instalment, update it at least ${N} days before your SIP date. Check the current timing in the app.`,
      activeSipNote:
        "Note: Skipping or pausing an instalment may mean the SIP is not counted as active that month.",
      conditionalPolicyNote:
        "An exit load may apply if you sell within a set period, and tax treatment depends on the fund and holding period (verify in app).",
      schemeDocLink: {
        label: "Check this fund's scheme document",
        url: HELPER_CONFIG.OFFICIAL_URLS.schemeDoc,
      },
      helpLink: {
        label: "Groww Help: SIP timing and changes",
        url: HELPER_CONFIG.OFFICIAL_URLS.growwHelp,
      },
      actions: [
        {
          id: "act-lower",
          label: "1. Lower this month's amount (e.g. to ₹500 minimum SIP)",
          subtext: "Keeps a monthly instalment running at a smaller amount (verify minimum in app)",
          actionType: "lower_amount",
        },
        {
          id: "act-skip",
          label: "2. Skip one instalment",
          subtext: "Pauses this month's debit; check restart date in the app",
          actionType: "skip_one",
        },
        {
          id: "act-keep",
          label: "3. Keep as is",
          subtext: "Continue with your scheduled ₹2,000 instalment",
          actionType: "keep_as_is",
        },
      ],
    },
    hi: {
      headline: "किस्त से पहले पैसे कम होने पर आपके विकल्प",
      explanation:
        "यदि इस महीने आपका बजट कम है, तो आप ऐप में अपनी अगली SIP किस्त में बदलाव कर सकते हैं।",
      timingNote: `इस महीने की किस्त बदलने के लिए, अपनी SIP तारीख से कम से कम ${N} दिन पहले अपडेट करें। ऐप में वर्तमान समय-सीमा जांचें।`,
      activeSipNote:
        "नोट: किस्त स्किप या पॉज़ करने से उस महीने आपकी SIP सक्रिय (active) के रूप में नहीं गिनी जा सकती है।",
      conditionalPolicyNote:
        "तय समय से पहले बेचने पर एग्जिट लोड लग सकता है, और टैक्स नियम फंड व होल्डिंग अवधि पर निर्भर करते हैं (ऐप में जांचें)।",
      schemeDocLink: {
        label: "इस फंड का स्कीम डॉक्यूमेंट देखें",
        url: HELPER_CONFIG.OFFICIAL_URLS.schemeDoc,
      },
      helpLink: {
        label: "Groww सहायता: SIP नियम और समय",
        url: HELPER_CONFIG.OFFICIAL_URLS.growwHelp,
      },
      actions: [
        {
          id: "act-lower",
          label: "1. इस महीने की रकम कम करें (जैसे ₹500 न्यूनतम SIP)",
          subtext: "छोटी रकम के साथ मासिक किस्त जारी रखता है (ऐप में न्यूनतम राशि जांचें)",
          actionType: "lower_amount",
        },
        {
          id: "act-skip",
          label: "2. एक किस्त स्किप (Skip) करें",
          subtext: "इस महीने की किस्त रोकता है; ऐप में अगली तारीख जांचें",
          actionType: "skip_one",
        },
        {
          id: "act-keep",
          label: "3. जैसा है वैसा ही रखें",
          subtext: "अपनी निर्धारित ₹2,000 किस्त जारी रखें",
          actionType: "keep_as_is",
        },
      ],
    },
  },

  failed_autopay: {
    en: {
      headline: "Steps to check after a failed autopay instalment",
      explanation:
        "If an autopay debit did not go through, check the following items in your app: (1) bank account balance on the debit date, (2) approved autopay limit, and (3) active bank mandate status.",
      timingNote: `To change a future instalment date or amount, update it at least ${N} days before your SIP date. Check the current timing in the app.`,
      conditionalPolicyNote:
        "Repeated unpaid instalments may affect your SIP registration status depending on AMC and platform rules (verify in app).",
      schemeDocLink: {
        label: "Check this fund's scheme document",
        url: HELPER_CONFIG.OFFICIAL_URLS.schemeDoc,
      },
      helpLink: {
        label: "Groww Help: Failed SIP instalments",
        url: HELPER_CONFIG.OFFICIAL_URLS.growwHelp,
      },
      actions: [
        {
          id: "act-pay-once",
          label: "1. Pay this missed instalment one time in the app",
          subtext: "Check the pending order or one-time payment option in Groww",
          actionType: "pay_one_time",
        },
        {
          id: "act-lower",
          label: "2. Lower next month's amount (e.g. to ₹500 minimum SIP)",
          subtext: "Adjust future instalment amount in the app",
          actionType: "lower_amount",
        },
        {
          id: "act-help",
          label: "3. View Groww Help on failed instalments",
          subtext: "Read official steps for mandate and payment status",
          actionType: "official_link",
          href: HELPER_CONFIG.OFFICIAL_URLS.growwHelp,
        },
      ],
    },
    hi: {
      headline: "ऑटो-पे (Autopay) किस्त फेल होने पर क्या जांचें",
      explanation:
        "यदि ऑटो-पे डेबिट पूरा नहीं हुआ, तो ऐप में ये 3 चीज़ें जांचें: (1) डेबिट तारीख पर बैंक बैलेंस, (2) स्वीकृत ऑटो-पे लिमिट, और (3) बैंक मैंडेट का स्टेटस।",
      timingNote: `भविष्य की किस्त बदलने के लिए, अपनी SIP तारीख से कम से कम ${N} दिन पहले अपडेट करें। ऐप में वर्तमान समय-सीमा जांचें।`,
      conditionalPolicyNote:
        "लगातार किस्तें न भरने पर AMC और प्लेटफॉर्म के नियमों के अनुसार SIP स्टेटस प्रभावित हो सकता है (ऐप में जांचें)।",
      schemeDocLink: {
        label: "इस फंड का स्कीम डॉक्यूमेंट देखें",
        url: HELPER_CONFIG.OFFICIAL_URLS.schemeDoc,
      },
      helpLink: {
        label: "Groww सहायता: फेल हुई SIP किस्तें",
        url: HELPER_CONFIG.OFFICIAL_URLS.growwHelp,
      },
      actions: [
        {
          id: "act-pay-once",
          label: "1. ऐप में इस छूटी हुई किस्त का वन-टाइम (One-time) भुगतान देखें",
          subtext: "Groww ऐप में पेंडिंग ऑर्डर या वन-टाइम विकल्प जांचें",
          actionType: "pay_one_time",
        },
        {
          id: "act-lower",
          label: "2. अगले महीने की रकम कम करें (जैसे ₹500 न्यूनतम SIP)",
          subtext: "ऐप में अगली किस्त की राशि समायोजित करें",
          actionType: "lower_amount",
        },
        {
          id: "act-help",
          label: "3. फेल किस्तों पर Groww सहायता पेज देखें",
          subtext: "मैंडेट और पेमेंट स्टेटस के आधिकारिक नियम पढ़ें",
          actionType: "official_link",
          href: HELPER_CONFIG.OFFICIAL_URLS.growwHelp,
        },
      ],
    },
  },

  red_return_worry: {
    en: {
      headline: "Understanding negative return numbers and unit accumulation",
      explanation:
        "Each SIP instalment purchases mutual fund units at the Net Asset Value (NAV) on the allotment date. When the NAV is lower, the same rupee instalment purchases more units.",
      timingNote: `To change this month's instalment, update it at least ${N} days before your SIP date. Check the current timing in the app.`,
      conditionalPolicyNote:
        "An exit load may apply if you sell within a set period. Check this fund's scheme document (verify in app).",
      schemeDocLink: {
        label: "Check this fund's scheme document",
        url: HELPER_CONFIG.OFFICIAL_URLS.schemeDoc,
      },
      helpLink: {
        label: "AMFI Official Mutual Fund & SIP Guide",
        url: HELPER_CONFIG.OFFICIAL_URLS.amfi,
      },
      actions: [
        {
          id: "act-units",
          label: "1. View units collected alongside return percentage",
          subtext: "See total units allotted across your completed instalments",
          actionType: "units_view",
        },
        {
          id: "act-lower",
          label: "2. Lower this month's amount (e.g. to ₹500 minimum SIP)",
          subtext: "Continue with a smaller monthly contribution if preferred",
          actionType: "lower_amount",
        },
        {
          id: "act-keep",
          label: "3. Keep as is",
          subtext: "Continue with your scheduled instalment",
          actionType: "keep_as_is",
        },
      ],
    },
    hi: {
      headline: "लाल (Negative) रिटर्न नंबर और यूनिट्स को समझें",
      explanation:
        "हर SIP किस्त आवंटन तिथि के NAV पर म्यूचुअल फंड यूनिट्स खरीदती है। जब NAV कम होता है, तो उतनी ही राशि में अधिक यूनिट्स मिलते हैं।",
      timingNote: `इस महीने की किस्त बदलने के लिए, अपनी SIP तारीख से कम से कम ${N} दिन पहले अपडेट करें। ऐप में वर्तमान समय-सीमा जांचें।`,
      conditionalPolicyNote:
        "तय समय से पहले बेचने पर एग्जिट लोड लग सकता है। इस फंड का स्कीम डॉक्यूमेंट देखें (ऐप में जांचें)।",
      schemeDocLink: {
        label: "इस फंड का स्कीम डॉक्यूमेंट देखें",
        url: HELPER_CONFIG.OFFICIAL_URLS.schemeDoc,
      },
      helpLink: {
        label: "AMFI आधिकारिक म्यूचुअल फंड और SIP गाइड",
        url: HELPER_CONFIG.OFFICIAL_URLS.amfi,
      },
      actions: [
        {
          id: "act-units",
          label: "1. रिटर्न प्रतिशत के साथ कुल जमा यूनिट्स देखें",
          subtext: "अपनी पूरी हुई किस्तों में मिले कुल यूनिट्स देखें",
          actionType: "units_view",
        },
        {
          id: "act-lower",
          label: "2. इस महीने की रकम कम करें (जैसे ₹500 न्यूनतम SIP)",
          subtext: "यदि आप चाहें तो छोटी मासिक राशि के साथ जारी रखें",
          actionType: "lower_amount",
        },
        {
          id: "act-keep",
          label: "3. जैसा है वैसा ही रखें",
          subtext: "अपनी निर्धारित किस्त जारी रखें",
          actionType: "keep_as_is",
        },
      ],
    },
  },

  general_sip_question: {
    en: {
      headline: "Managing your SIP instalment in the app",
      explanation:
        "You can review your SIP schedule, lower your monthly amount, or skip an instalment from your SIP details screen.",
      timingNote: `To change this month's instalment, update it at least ${N} days before your SIP date. Check the current timing in the app.`,
      conditionalPolicyNote:
        "An exit load may apply if you sell within a set period. Check this fund's scheme document (verify in app).",
      schemeDocLink: {
        label: "Check this fund's scheme document",
        url: HELPER_CONFIG.OFFICIAL_URLS.schemeDoc,
      },
      helpLink: {
        label: "Groww Help: SIP management",
        url: HELPER_CONFIG.OFFICIAL_URLS.growwHelp,
      },
      actions: [
        {
          id: "act-lower",
          label: "1. Lower this month's amount (e.g. to ₹500 minimum SIP)",
          subtext: "Adjust your monthly contribution in the app",
          actionType: "lower_amount",
        },
        {
          id: "act-skip",
          label: "2. Skip one instalment",
          subtext: "Note: Skipping may mean the SIP is not counted as active that month",
          actionType: "skip_one",
        },
        {
          id: "act-keep",
          label: "3. Keep as is",
          subtext: "Continue with your scheduled instalment",
          actionType: "keep_as_is",
        },
      ],
    },
    hi: {
      headline: "ऐप में अपनी SIP किस्त प्रबंधित करें",
      explanation:
        "आप अपनी SIP विवरण स्क्रीन से अपनी समय-सारणी देख सकते हैं, राशि कम कर सकते हैं, या एक किस्त स्किप कर सकते हैं।",
      timingNote: `इस महीने की किस्त बदलने के लिए, अपनी SIP तारीख से कम से कम ${N} दिन पहले अपडेट करें। ऐप में वर्तमान समय-सीमा जांचें।`,
      conditionalPolicyNote:
        "तय समय से पहले बेचने पर एग्जिट लोड लग सकता है। इस फंड का स्कीम डॉक्यूमेंट देखें (ऐप में जांचें)।",
      schemeDocLink: {
        label: "इस फंड का स्कीम डॉक्यूमेंट देखें",
        url: HELPER_CONFIG.OFFICIAL_URLS.schemeDoc,
      },
      helpLink: {
        label: "Groww सहायता: SIP प्रबंधन",
        url: HELPER_CONFIG.OFFICIAL_URLS.growwHelp,
      },
      actions: [
        {
          id: "act-lower",
          label: "1. इस महीने की रकम कम करें (जैसे ₹500 न्यूनतम SIP)",
          subtext: "ऐप में अपनी मासिक राशि समायोजित करें",
          actionType: "lower_amount",
        },
        {
          id: "act-skip",
          label: "2. एक किस्त स्किप (Skip) करें",
          subtext: "नोट: स्किप करने से उस महीने SIP सक्रिय (active) नहीं गिनी जा सकती है",
          actionType: "skip_one",
        },
        {
          id: "act-keep",
          label: "3. जैसा है वैसा ही रखें",
          subtext: "अपनी निर्धारित किस्त जारी रखें",
          actionType: "keep_as_is",
        },
      ],
    },
  },

  safe_fallback_advice: {
    en: {
      headline: "Safe Fallback: We do not recommend funds or predict markets",
      explanation:
        "This tool only helps with SIP operational options (such as lowering an instalment, skipping a month, or checking failed autopay steps). We cannot recommend specific mutual funds or stocks, compare fund returns, or predict market movements.",
      timingNote:
        "For fund selection or investment advice, please consult a SEBI-registered investment advisor or review official investor education resources.",
      conditionalPolicyNote:
        "An exit load may apply if you sell within a set period. Check this fund's scheme document (verify in app).",
      schemeDocLink: {
        label: "Check this fund's scheme document",
        url: HELPER_CONFIG.OFFICIAL_URLS.schemeDoc,
      },
      helpLink: {
        label: "Official AMFI Investor Education Page",
        url: HELPER_CONFIG.OFFICIAL_URLS.amfi,
      },
      actions: [
        {
          id: "act-amfi",
          label: "Open Official AMFI Investor Page",
          subtext: "amfiindia.com/articles/mutual-fund",
          actionType: "official_link",
          href: HELPER_CONFIG.OFFICIAL_URLS.amfi,
        },
        {
          id: "act-scheme",
          label: "Check this fund's scheme document",
          subtext: "Review official scheme details and exit-load terms",
          actionType: "official_link",
          href: HELPER_CONFIG.OFFICIAL_URLS.schemeDoc,
        },
      ],
    },
    hi: {
      headline: "सेफ फ़ॉलबैक: हम किसी फंड की सलाह या बाज़ार का अनुमान नहीं देते",
      explanation:
        "यह टूल केवल SIP संचालन विकल्पों (जैसे किस्त कम करना, एक महीना स्किप करना, या ऑटो-पे स्टेटस जांचना) में मदद करता है। हम किसी विशेष म्यूचुअल फंड या स्टॉक की सिफारिश नहीं करते हैं और न ही बाज़ार के उतार-चढ़ाव का अनुमान लगाते हैं।",
      timingNote:
        "निवेश सलाह के लिए कृपया SEBI-पंजीकृत निवेश सलाहकार से संपर्क करें या आधिकारिक AMFI जानकारी देखें।",
      conditionalPolicyNote:
        "तय समय से पहले बेचने पर एग्जिट लोड लग सकता है। इस फंड का स्कीम डॉक्यूमेंट देखें (ऐप में जांचें)।",
      schemeDocLink: {
        label: "इस फंड का स्कीम डॉक्यूमेंट देखें",
        url: HELPER_CONFIG.OFFICIAL_URLS.schemeDoc,
      },
      helpLink: {
        label: "आधिकारिक AMFI निवेशक शिक्षा पेज",
        url: HELPER_CONFIG.OFFICIAL_URLS.amfi,
      },
      actions: [
        {
          id: "act-amfi",
          label: "आधिकारिक AMFI निवेशक पेज खोलें",
          subtext: "amfiindia.com/articles/mutual-fund",
          actionType: "official_link",
          href: HELPER_CONFIG.OFFICIAL_URLS.amfi,
        },
        {
          id: "act-scheme",
          label: "इस फंड का स्कीम डॉक्यूमेंट देखें",
          subtext: "आधिकारिक स्कीम विवरण और शर्तें पढ़ें",
          actionType: "official_link",
          href: HELPER_CONFIG.OFFICIAL_URLS.schemeDoc,
        },
      ],
    },
  },

  safe_fallback_unclear: {
    en: {
      headline: "I'm not sure I understood your question",
      explanation:
        "Please rephrase your question about your SIP instalment (for example: 'My money is tight this month', 'My autopay failed', or 'I am worried about the negative return number').",
      timingNote: `To change this month's instalment, update it at least ${N} days before your SIP date. Check the current timing in the app.`,
      conditionalPolicyNote:
        "An exit load may apply if you sell within a set period. Check this fund's scheme document (verify in app).",
      schemeDocLink: {
        label: "Check this fund's scheme document",
        url: HELPER_CONFIG.OFFICIAL_URLS.schemeDoc,
      },
      helpLink: {
        label: "Groww Official Help Page",
        url: HELPER_CONFIG.OFFICIAL_URLS.growwHelp,
      },
      actions: [
        {
          id: "act-help-unclear",
          label: "Open Groww Official Help Page",
          subtext: "Browse official SIP support articles",
          actionType: "official_link",
          href: HELPER_CONFIG.OFFICIAL_URLS.growwHelp,
        },
      ],
    },
    hi: {
      headline: "मैं आपका सवाल पूरी तरह समझ नहीं पाया",
      explanation:
        "कृपया अपनी SIP किस्त से जुड़ा सवाल दूसरे शब्दों में लिखें (उदाहरण: 'इस महीने पैसे कम हैं', 'मेरा ऑटो-पे फेल हो गया', या 'मुझे नेगेटिव रिटर्न की चिंता है')।",
      timingNote: `इस महीने की किस्त बदलने के लिए, अपनी SIP तारीख से कम से कम ${N} दिन पहले अपडेट करें। ऐप में वर्तमान समय-सीमा जांचें।`,
      conditionalPolicyNote:
        "तय समय से पहले बेचने पर एग्जिट लोड लग सकता है। इस फंड का स्कीम डॉक्यूमेंट देखें (ऐप में जांचें)।",
      schemeDocLink: {
        label: "इस फंड का स्कीम डॉक्यूमेंट देखें",
        url: HELPER_CONFIG.OFFICIAL_URLS.schemeDoc,
      },
      helpLink: {
        label: "Groww आधिकारिक सहायता पेज",
        url: HELPER_CONFIG.OFFICIAL_URLS.growwHelp,
      },
      actions: [
        {
          id: "act-help-unclear",
          label: "Groww आधिकारिक सहायता पेज खोलें",
          subtext: "SIP सहायता लेख पढ़ें",
          actionType: "official_link",
          href: HELPER_CONFIG.OFFICIAL_URLS.growwHelp,
        },
      ],
    },
  },
};

export function redactPiiText(input: string): string {
  if (!input) return "";
  return input
    .replace(/\b[A-Za-z]{5}[0-9]{4}[A-Za-z]\b/g, "[REDACTED_PAN]")
    .replace(/\b\d{6,}\b/g, "[REDACTED_DIGITS]");
}
