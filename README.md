# AI Discovery Engine

Research tool for a Product Management assignment on **Groww**.

## Problem

Groww helps many people in India start mutual fund investing through a SIP (Systematic Investment Plan). For first-time investors, **starting the first SIP is not enough**. If they pause, reduce, or stop that SIP within the first 12 months, Groww does not keep the long-term relationship those users came for: a simple, trusted investing habit.

The business problem is **early SIP drop-off among first-time mutual fund investors**.

The research problem is that **the reason is not known in advance**. Public discussions may mention money stress, surprise at market movement, confusion about gains, failed auto-debit, distrust, or advice from family. Any of those could matter, or none of them might be the main driver. A PM should not pick a root cause from intuition and then only look for quotes that match it.

This project does not have access to Groww’s internal SIP retention data. It also does not search the entire internet. It starts from **uploaded, lawfully accessible public comments** and treats each comment as one piece of evidence, not as a population statistic.

## Goal

**Groww goal (north-star for the assignment):** increase the percentage of first-time mutual fund investors who still have an **active SIP 12 months after starting their first SIP**.

**Tool goal:** help a researcher discover *why* first-time SIP investors may pause, reduce, or stop within 12 months, by classifying public comments into themes, journey stages, and evidence quality, then comparing possible product opportunities.

The app will not:

- measure Groww’s real 12-month SIP rate
- claim that a theme *causes* drop-off
- treat how often a theme is mentioned as how common it is among all investors
- give personalised investment advice or recommend funds

## Discovery question

Among public conversations about SIP investing in India, what evidence appears about first-time investors pausing, reducing, or stopping a SIP in the first year, and which of those themes are strong enough to inform a Groww product hypothesis?

## Scope for this assignment

- **In:** uploaded CSV comments drawn from the source list below, Gemini classification when an API key is available, dashboard, human review, golden-set evaluation, export.
- **Out (for now):** live scraping inside the app, login/paywall bypass, Groww production data, personalised advice.
- **Later:** extra data connectors can be added without changing the discovery question.

Package IDs, subreddit names, and store URLs change. Re-check before collecting a new batch. Collection must stay inside each platform’s terms, rate limits, and public-access rules. Strip usernames and other PII before analysis.

## Ethics

Use only public, lawfully accessible text. Do not collect personal identifiers or sensitive financial details beyond what is needed for research. Do not use fear, FOMO, or urgency nudges.

## Source list

Priority for this assignment: **Play Store / App Store reviews**, **Reddit**, **complaint sites**, and **AMFI/SEBI benchmark files**. Other sources are optional if a lawful public export is available.

Suggested search terms across conversation sources: `SIP stopped`, `SIP paused`, `first SIP`, `SIP not giving returns`, `should I stop SIP`, `SIP in market crash`, `SIP returns negative`.

### 1. App store reviews

Play Store URL pattern: `https://play.google.com/store/apps/details?id=<package_id>` (use `country=in` / `hl=en_IN` in the scraper).

App Store URL pattern: `https://apps.apple.com/in/app/<slug>/id<APP_ID>`.

Public App Store RSS (India, most recent): `https://itunes.apple.com/in/rss/customerreviews/id=<APP_ID>/sortby=mostrecent/json`.

Libraries to use **outside** this app, then upload a CSV: `google-play-scraper`, `app-store-scraper`.

IDs below were checked in October 2026.

#### Beginner-heavy and DIY investing apps

| App | Segment | Play package ID | App Store ID |
| --- | --- | --- | --- |
| Groww | Beginner / all-in-one | `com.nextbillion.groww` | `1404871703` |
| ET Money | Beginner / planning | `com.smartspends` | `1212752482` |
| Paytm Money | Payments-adjacent DIY | `com.paytmmoney` | `1344431352` |
| INDmoney | DIY / net-worth | `in.indwealth` | `1450178837` |
| Kuvera by CRED | DIY / goal-based | `com.gooogle.android.kuvera.app` (three o’s; this is the live ID) | `1329701793` |
| Scripbox | Guided / beginner | `com.scripbox.takecharge` | `1137375075` |
| Fisdom | Guided / beginner | `com.finwizard.fisdom` | `1099148115` |
| Coin by Zerodha | DIY mutual funds | `com.zerodha.coin` | `1392892554` |
| Upstox | DIY broker | `in.upstox.app` | `1584953620` |
| Angel One | DIY broker | `com.msf.angelmobile` | `1060530981` |
| 5paisa | DIY broker | `com.fivepaisa.trade` | re-check before use |
| Dhan | DIY broker | `com.dhan.live` | `1575318726` |

#### Bank, AMC, and payments-app SIP

Use these for the “SIP inside a bank/AMC/payments app” segment, not as a substitute for Groww reviews.

| App | Play package ID | App Store ID |
| --- | --- | --- |
| HDFC Mutual Fund | `com.hdfcfund.investor` | `1380088205` |
| ICICI Prudential i-Invest | `com.iPruAMC` | re-check before use |
| SBI Mutual Fund InvesTap Nxt | `com.sbi.mf` | re-check before use |
| Axis Mutual Fund | `com.axismf.investorapp` | re-check before use |
| PhonePe | `com.phonepe.app` | re-check before use |
| Google Pay (India UPI) | `com.google.android.apps.nbu.paisa.user` | re-check before use |
| CRED | `com.dreamplug.androidapp` | re-check before use |

#### Registrar apps (statement / KYC confusion)

| App | Play package ID | App Store ID |
| --- | --- | --- |
| MFCentral (CAMS + KFintech) | `com.mfcentral.app` | `1600859014` |
| myCAMS | `com.KCamsApp` | `877565416` |
| KFinKart Investor | `com.karvy` | re-check before use |

Filter uploaded reviews to **1–3 star** plus any 4–5 star reviews that mention pause, stop, debit failure, KYC, or first SIP.

### 2. Reddit (Indian investing communities)

Use the official Reddit API (PRAW). Pushshift is restricted; do not rely on it.

Checked and active:

| Community | URL | Why it is useful |
| --- | --- | --- |
| r/IndiaInvestments | https://www.reddit.com/r/IndiaInvestments/ | Core India investing community; SIP and first-fund questions often sit in advice threads |
| r/IndianStockMarket | https://www.reddit.com/r/IndianStockMarket/ | Market-move reactions that can trigger pause/stop talk |
| r/personalfinanceindia | https://www.reddit.com/r/personalfinanceindia/ | Cash-flow, family, and first-job money decisions |
| r/IndianStreetBets | https://www.reddit.com/r/IndianStreetBets/ | High volume; noisy and trading-skewed, still has “I quit SIP” posts |
| r/FIREIndia | https://www.reddit.com/r/FIREIndia/ | Longer-horizon investors; not a beginner SIP forum |
| r/mutualfunds | https://www.reddit.com/r/mutualfunds/ | Not officially India-only, but India SIP talk is common |
| r/MutualFundsIndia | https://www.reddit.com/r/MutualFundsIndia/ | Active India MF / SIP / beginner portfolio reviews (~100k members as of Oct 2026) |
| r/StockMarketIndia | https://www.reddit.com/r/StockMarketIndia/ | Beginner market and MF questions |
| r/india | https://www.reddit.com/r/india/ | Broader culture and family-money context |
| r/AskIndia | https://www.reddit.com/r/AskIndia/ | Everyday money questions |
| r/IndianTeenagers | https://www.reddit.com/r/IndianTeenagers/ | Early money habits |
| r/developersIndia | https://www.reddit.com/r/developersIndia/ | Salaried / young-professional money questions |
| r/CAIndia | https://www.reddit.com/r/CAIndia/ | Tax, salary, and first-investment questions from CA students and professionals |

Not confirmed as active (no reliable public listing during this check): **r/investingindia**, **r/Indiancollege**. Skip them unless a later check shows an active community. Do not invent a substitute subreddit.

### 3. Investing forums and communities

| Source | URL | Notes |
| --- | --- | --- |
| TradingQ&A (Zerodha) | https://tradingqna.com | Strong for product/process confusion and Coin/SIP ops |
| Zerodha Varsity | https://zerodha.com/varsity/ | Use comment threads on SIP / mutual-fund modules |
| ValuePickr | https://forum.valuepickr.com | Stock-heavy; use only threads about first investing or SIP behaviour |
| Value Research | https://www.valueresearchonline.com | Research plus Q&A; forum surface has changed over time |
| Moneycontrol Market Master / forum | https://mmb.moneycontrol.com | Noisy; still useful for complaint language |
| Quora | search `SIP India`, `mutual fund beginner` | Optional; quality varies |
| Capitalmind | https://www.capitalmind.in | Comment sections on SIP / behaviour pieces |
| Freefincal | https://freefincal.com | Comment sections on SIP discipline and stoppage |
| Finshots | https://finshots.in | Short explainers; comments if public |

Telegram public groups/channels and Facebook public groups are optional and access-limited. Treat them as later connectors, not as a requirement for this assignment.

### 4. Social media (optional / limited access)

- **X/Twitter:** search `SIP India`, `stopped my SIP`, `mutual fund app`; handles of Groww, Zerodha Coin, ET Money, AMFI, SEBI. API access is paid or limited.
- **Instagram / Reels comments:** hard to collect lawfully; skip unless a public export exists.
- **LinkedIn:** “first investment” posts (salaried skew).
- **Threads:** younger-user skew; same access caution.

Do not build these into the app until terms and a lawful export path are clear.

### 5. YouTube comments

API: [YouTube Data API v3](https://developers.google.com/youtube/v3).

Search queries: `SIP for beginners`, `SIP stop or continue`, `SIP in market crash`, `SIP returns negative`, `best SIP 2025`, `best SIP 2026`. Include Hindi-language results for Tier 2 / 3 segments.

Channels to start with (verified where linked):

| Channel | URL or handle |
| --- | --- |
| Pranjal Kamra | https://www.youtube.com/c/pranjalkamra |
| CA Rachana Ranade | search official channel; Hindi + English beginner SIP videos |
| Ankur Warikoo | search official channel |
| Labour Law Advisor | search official channel |
| Asset Yogi | search official channel |
| FinnovationZ | search official channel |
| Finance With Sharan (Sharan Hegde) | search official channel |
| Shankar Nath | https://www.youtube.com/@shankarnath |
| Akshat Shrivastava | search official channel |
| Zerodha Varsity | https://www.youtube.com/@varsitybyzerodha (also `@VarsityMF`, `@ZerodhaVarsityHindi`) |
| Groww and ET Money official channels | search official channels; comments on SIP how-tos |

Video comments are evidence of **belief and confusion**, not of how common a behaviour is.

### 6. Complaint and review sites

| Source | URL | Use for |
| --- | --- | --- |
| MouthShut | https://www.mouthshut.com | App / SIP / KYC complaints |
| consumercomplaints.in | https://www.consumercomplaints.in | Failed debit, refund, KYC, SIP not allotted (Groww example: https://www.consumercomplaints.in/bycompany/groww-a512287.html) |
| Trustpilot | search each brand | Limited India coverage; use only as a weak extra signal |
| SEBI SCORES | https://scores.sebi.gov.in | Public complaint categories against intermediaries; old `scores.gov.in` was closed 28 Mar 2024 |

### 7. Context and benchmark data (not conversations)

These files are for interpreting comments, not for counting as qualitative evidence.

| Source | URL | What to take |
| --- | --- | --- |
| AMFI | https://www.amfiindia.com | Monthly SIP inflows, contributing accounts, new vs discontinued SIPs |
| AMFI monthly packs | https://www.amfiindia.com/research-information/amfi-monthly | PDF / Excel time series |
| AMFI SIP explainer + monthly SIP table | https://www.amfiindia.com/articles/mutual-fund | Includes discontinued / ceased SIP definition |
| SEBI | https://www.sebi.gov.in | Investor Survey and circulars |
| NCFE | https://www.ncfe.org.in | Financial literacy survey context |
| NSE / BSE | official research pages | Investor demographic reports |
| CAMS / KFintech | official sites | Industry / CAS / KYC process reports |
| Google Trends | https://trends.google.com/trends/explore?geo=IN&q=SIP | Also compare `stop SIP`, `SIP pause` against market-fall months |
| Groww Help Center — Why was my SIP cancelled? | https://groww.in/help/mutual-funds/order/why-was-my-order-cancelled--68 | Official Groww rule: SIPs end via (1) User Cancellation Request or (2) Automatic Cancellation after 3 consecutive unpaid instalments |
| Myfolios — Why People Stop Their SIP (And How Not To) | https://www.myfolios.in/blog/why-people-stop-their-sip | Behavioural breakdown: 1) Market fell, 2) Felt too slow in Year 1, 3) Money got tight (pause vs cancel), 4) Friend's fund did better, 5) Failed mandate, 6) No clear goal |
| Press comment sections | Economic Times, Moneycontrol, Mint | Optional; same ethics rules |

AMFI stoppage data is an **industry** benchmark. It does not measure Groww’s 12-month SIP rate.

### 8. Technical tooling (collection, not in-app)

- PRAW for Reddit
- `google-play-scraper` and `app-store-scraper`
- YouTube Data API v3
- Apify or similar only for gaps, and only if the source is public and allowed
- Strip usernames, emails, phone numbers, folio numbers, and account identifiers before CSV upload

## Mapping sources to discovery questions

| Question | Best sources |
| --- | --- |
| Why start, what they expect | Reddit, YouTube comments, Quora |
| Behaviour change after starting | Reddit “X months in” posts, X/Twitter if available |
| Why pause or stop | Reddit, app reviews (1–3 star), TradingQ&A, AMFI stoppage data |
| What they check and how often | App reviews, Reddit threads |
| In-app confusion | Play Store and App Store reviews, SCORES, registrar-app reviews |
| What they do outside the app | Reddit, TradingQ&A, YouTube, Google Trends |
| Continue vs drop off | Reddit long-term posters vs “I quit” posts; AMFI new vs discontinued SIPs |
| Segment differences | Subreddit mix, Hindi vs English YouTube, bank/AMC/payments-app vs fintech-app reviews |
| Unmet needs | Cross-source clustering of feature requests and complaints |

## AI Evidence Log

Keep one document with view access for anyone with the link. It should record:

- Sources and volume this discovery engine analysed
- A golden set of about 20 items labelled by hand, how often the engine agreed, and where it failed
- 2 to 3 places where AI output was rejected or corrected, and why
