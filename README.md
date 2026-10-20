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

- **In:** uploaded CSV comments, Gemini classification when an API key is available, dashboard, human review, golden-set evaluation, export.
- **Out (for now):** live scraping, login/paywall bypass, Groww production data, personalised advice.
- **Later:** extra data connectors can be added without changing the discovery question.

## Ethics

Use only public, lawfully accessible text. Do not collect personal identifiers or sensitive financial details beyond what is needed for research. Do not use fear, FOMO, or urgency nudges.


##
AI Evidence Log (one document, view access for anyone with the link)
- Sources and volume your discovery engine analysed
- A golden set of about 20 items you labelled by hand, how often your engine agreed with you, and where it failed
- 2 to 3 places where you rejected or corrected AI output, and why