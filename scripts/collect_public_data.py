#!/usr/bin/env python3
"""
Groww SIP Discovery Engine — Lawful Public Data Collector
=========================================================
Collects public comments/reviews about SIPs & first-time mutual fund investing in India,
strips usernames & PII (phone numbers, emails, PAN, folio IDs), and writes a clean CSV
ready to upload into the Discovery Engine UI.

Supported sources out-of-the-box (standard library only, zero API keys needed):
  1. Apple App Store India Public RSS JSON (Groww, Coin, ET Money, INDmoney, Kuvera, MFCentral)
  2. TradingQ&A Discourse Public Search JSON (SIP pause/stop/mandate threads)

Optional libraries if installed:
  3. Google Play Store (`pip install google-play-scraper`)
  4. Reddit (`pip install praw` with Reddit API credentials)

Usage:
  python3 scripts/collect_public_data.py --output public/collected_sip_comments.csv
"""

import argparse
import csv
import json
import re
import ssl
import urllib.parse
import urllib.request
from datetime import datetime

APPLE_APPS = {
    "Groww (App Store)": "1404871703",
    "Zerodha Coin (App Store)": "1392892554",
    "ET Money (App Store)": "1212752482",
    "INDmoney (App Store)": "1450178837",
    "Kuvera (App Store)": "1329701793",
    "MFCentral (App Store)": "1600859014",
}

PLAY_APPS = {
    "Groww (Play Store)": "com.nextbillion.groww",
    "Zerodha Coin (Play Store)": "com.zerodha.coin",
    "ET Money (Play Store)": "com.smartspends",
    "MFCentral (Play Store)": "com.mfcentral.app",
}

SIP_KEYWORDS = re.compile(
    r"\b(sip|mutual fund|autopay|mandate|nav|allot|pause|stop|cancel|xirr|returns|kyc|instalment|installment|folio|elss|nifty|small\s*cap|deduct)\b",
    re.IGNORECASE,
)


def strip_pii(text: str) -> str:
    """Remove emails, Indian phone numbers, PAN numbers, and potential folio/order numbers."""
    if not text:
        return ""
    text = re.sub(r"[\w\.-]+@[\w\.-]+\.\w+", "[EMAIL_REDACTED]", text)
    text = re.sub(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b", "[PAN_REDACTED]", text)
    text = re.sub(r"\b(?:\+91[\-\s]?)?[6-9]\d{9}\b", "[PHONE_REDACTED]", text)
    text = re.sub(r"\b\d{8,16}\b", "[ID_REDACTED]", text)
    return re.sub(r"\s+", " ", text).strip()


def fetch_json(url: str):
    ctx = ssl.create_default_context()
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) SIPResearchBot/1.0"
        },
    )
    with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
        return json.loads(resp.read().decode("utf-8", errors="replace"))


def collect_app_store_rss() -> list[dict]:
    rows = []
    for source_label, app_id in APPLE_APPS.items():
        url = f"https://itunes.apple.com/in/rss/customerreviews/id={app_id}/sortby=mostrecent/json"
        try:
            data = fetch_json(url)
            entries = data.get("feed", {}).get("entry", [])
            if isinstance(entries, dict):
                entries = [entries]
            for idx, entry in enumerate(entries):
                title = entry.get("title", {}).get("label", "")
                content = entry.get("content", {}).get("label", "")
                rating_str = entry.get("im:rating", {}).get("label", "")
                updated = entry.get("updated", {}).get("label", "")[:10]
                full_text = strip_pii(f"{title}. {content}".strip(". "))
                if not full_text or not SIP_KEYWORDS.search(full_text):
                    continue
                rows.append(
                    {
                        "id": f"IOS-{app_id}-{idx}",
                        "source": source_label,
                        "platform": source_label.split(" (")[0],
                        "rating": rating_str,
                        "date": updated or datetime.now().strftime("%Y-%m-%d"),
                        "text": full_text,
                        "segment_hint": "App Store reviewer (India)",
                    }
                )
        except Exception as exc:
            print(f"[warn] App Store RSS skipped for {source_label}: {exc}")
    return rows


def collect_tradingqna() -> list[dict]:
    rows = []
    queries = ["SIP stopped", "SIP pause", "first SIP mutual fund", "SIP mandate failed"]
    for q in queries:
        encoded = urllib.parse.quote(q)
        url = f"https://tradingqna.com/search.json?q={encoded}"
        try:
            data = fetch_json(url)
            for post in data.get("posts", [])[:10]:
                blurb = strip_pii(post.get("blurb", ""))
                if len(blurb) < 40:
                    continue
                rows.append(
                    {
                        "id": f"TQNA-{post.get('id', '')}",
                        "source": "TradingQ&A",
                        "platform": "Zerodha / General",
                        "rating": "",
                        "date": (post.get("created_at") or "")[:10],
                        "text": blurb,
                        "segment_hint": "DIY Forum Investor",
                    }
                )
        except Exception as exc:
            print(f"[warn] TradingQ&A query '{q}' skipped: {exc}")
    return rows


def collect_play_store_if_available() -> list[dict]:
    try:
        from google_play_scraper import Sort, reviews  # type: ignore
    except ImportError:
        print("[info] google-play-scraper not installed. Skipping live Play Store scrape (pip install google-play-scraper).")
        return []

    rows = []
    for source_label, pkg in PLAY_APPS.items():
        try:
            result, _ = reviews(pkg, lang="en", country="in", sort=Sort.NEWEST, count=60)
            for r in result:
                body = strip_pii(r.get("content", ""))
                if not body or not SIP_KEYWORDS.search(body):
                    continue
                at_dt = r.get("at")
                rows.append(
                    {
                        "id": f"PLAY-{pkg}-{r.get('reviewId', '')[:8]}",
                        "source": source_label,
                        "platform": source_label.split(" (")[0],
                        "rating": str(r.get("score", "")),
                        "date": at_dt.strftime("%Y-%m-%d") if at_dt else "",
                        "text": body,
                        "segment_hint": "Play Store reviewer (India)",
                    }
                )
        except Exception as exc:
            print(f"[warn] Play Store scrape skipped for {pkg}: {exc}")
    return rows


def main():
    parser = argparse.ArgumentParser(description="Collect public SIP comments for Discovery Engine")
    parser.add_argument(
        "--output",
        default="public/collected_sip_comments.csv",
        help="Output CSV path",
    )
    args = parser.parse_args()

    print("Collecting public SIP feedback (PII-stripped)...")
    items = []
    items.extend(collect_app_store_rss())
    items.extend(collect_tradingqna())
    items.extend(collect_play_store_if_available())

    # Deduplicate by text
    seen = set()
    unique_items = []
    for item in items:
        key = item["text"][:120].lower()
        if key not in seen:
            seen.add(key)
            unique_items.append(item)

    fieldnames = ["id", "source", "platform", "rating", "date", "text", "segment_hint"]
    with open(args.output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(unique_items)

    print(f"Saved {len(unique_items)} public SIP items to {args.output}")


if __name__ == "__main__":
    main()
