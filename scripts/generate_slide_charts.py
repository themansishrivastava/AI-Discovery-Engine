#!/usr/bin/env python3
"""
Generates TWO separate, clean, standalone PNG/SVG charts (no 'Reason 1/5' numbering, no '[CHOSEN]' labels):
1. `public/chart_user_segments.png` — User Segments Breakdown from Scraped SIP Reviews
2. `public/chart_dropoff_themes.png` — Why Users Pause or Stop SIPs (Scraped Data Breakdown)
"""

import html
import math


def polar_to_cartesian(cx: float, cy: float, r: float, angle_deg: float):
    rad = math.radians(angle_deg - 90)
    return cx + r * math.cos(rad), cy + r * math.sin(rad)


def donut_slice_path(
    cx: float,
    cy: float,
    r_outer: float,
    r_inner: float,
    start_deg: float,
    end_deg: float,
):
    mid_deg = (start_deg + end_deg) / 2.0
    x1, y1 = polar_to_cartesian(cx, cy, r_outer, end_deg)
    x2, y2 = polar_to_cartesian(cx, cy, r_outer, start_deg)
    x3, y3 = polar_to_cartesian(cx, cy, r_inner, start_deg)
    x4, y4 = polar_to_cartesian(cx, cy, r_inner, end_deg)

    large_arc = 1 if (end_deg - start_deg) > 180 else 0

    d = [
        f"M {x1:.2f} {y1:.2f}",
        f"A {r_outer} {r_outer} 0 {large_arc} 0 {x2:.2f} {y2:.2f}",
        f"L {x3:.2f} {y3:.2f}",
        f"A {r_inner} {r_inner} 0 {large_arc} 1 {x4:.2f} {y4:.2f}",
        "Z",
    ]
    lx, ly = polar_to_cartesian(cx, cy, (r_outer + r_inner) / 2.0, mid_deg)
    return " ".join(d), lx, ly


def build_single_chart_svg(title: str, subtitle: str, data: list[dict]) -> str:
    width = 620
    height = 560
    cx = 310
    cy = 215
    r_outer = 128
    r_inner = 64

    svg = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        f'<rect width="{width}" height="{height}" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>',
        f'<text x="{cx}" y="42" text-anchor="middle" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="18" font-weight="700" fill="#0F172A">{html.escape(title)}</text>',
        f'<text x="{cx}" y="64" text-anchor="middle" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="12.5" font-weight="500" fill="#64748B">{html.escape(subtitle)}</text>',
    ]

    angle = 0.0
    for idx, item in enumerate(data):
        pct = item["pct"]
        sweep = (pct / 100.0) * 360.0
        path_d, lx, ly = donut_slice_path(cx, cy, r_outer, r_inner, angle, angle + sweep)
        svg.append(
            f'<path d="{path_d}" fill="{item["color"]}" stroke="#FFFFFF" stroke-width="3" />'
        )
        txt_color = "#FFFFFF" if idx in (0, 1) else "#0F172A"
        svg.append(
            f'<text x="{lx:.1f}" y="{ly + 5:.1f}" text-anchor="middle" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="700" fill="{txt_color}">{pct}%</text>'
        )
        angle += sweep

    # Center text
    svg.append(
        f'<text x="{cx}" y="{cy - 2}" text-anchor="middle" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="800" fill="#0F172A">241</text>'
    )
    svg.append(
        f'<text x="{cx}" y="{cy + 16}" text-anchor="middle" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="600" fill="#64748B">Reviews</text>'
    )

    # Clean Legend Table
    leg_y = cy + r_outer + 32
    leg_x = 45
    leg_w = 530
    for idx, item in enumerate(data):
        y = leg_y + idx * 34
        svg.append(
            f'<rect x="{leg_x}" y="{y - 19}" width="{leg_w}" height="28" rx="6" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />'
        )
        svg.append(
            f'<circle cx="{leg_x + 16}" cy="{y - 5}" r="6" fill="{item["color"]}" />'
        )
        svg.append(
            f'<text x="{leg_x + 32}" y="{y}" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="12.5" font-weight="500" fill="#0F172A">{html.escape(item["label"])}</text>'
        )
        svg.append(
            f'<text x="{leg_x + leg_w - 14}" y="{y}" text-anchor="end" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="12.5" font-weight="700" fill="#0F172A">{item["pct"]}% ({item["count"]})</text>'
        )

    svg.append("</svg>")
    return "\n".join(svg)


segments_data = [
    {
        "label": "Young Salaried Beginners (Age 22–28, ₹1k–₹5k SIP)",
        "pct": 38,
        "count": "92",
        "color": "#00B386",
    },
    {
        "label": "YouTube / Finfluencer-Driven Beginners (Multi-fund)",
        "pct": 22,
        "count": "53",
        "color": "#5367FF",
    },
    {
        "label": "Tier-2/3 Family-Influenced Beginners (FD vs SIP)",
        "pct": 16,
        "count": "39",
        "color": "#38BDF8",
    },
    {
        "label": "College Students & Interns (₹300–₹1,500 Micro-SIP)",
        "pct": 12,
        "count": "29",
        "color": "#F59E0B",
    },
    {
        "label": "Experienced DIY Investors (3+ yrs tenure)",
        "pct": 12,
        "count": "28",
        "color": "#94A3B8",
    },
]

themes_data = [
    {
        "label": "Money Got Tight (Skip / Pause / Edit Amount Friction)",
        "pct": 22,
        "count": "53",
        "color": "#00B386",
    },
    {
        "label": "Month-1 '0 Units' Allotment Delay & ₹1L Mandate Fear",
        "pct": 21,
        "count": "51",
        "color": "#5367FF",
    },
    {
        "label": "Returns Felt Too Slow in Year 1 (No Goal Clarity)",
        "pct": 18,
        "count": "43",
        "color": "#38BDF8",
    },
    {
        "label": "Market Fell & Portfolio Showed Negative Returns",
        "pct": 15,
        "count": "36",
        "color": "#F59E0B",
    },
    {
        "label": "Autopay / Bank Debit Failed (3-Miss Auto-Cancel)",
        "pct": 13,
        "count": "31",
        "color": "#EC4899",
    },
    {
        "label": "Friend's Fund Did Better (Early Switching / Clutter)",
        "pct": 11,
        "count": "27",
        "color": "#94A3B8",
    },
]

svg1 = build_single_chart_svg(
    "User Segments in Scraped SIP Reviews",
    "Distribution across 241 public reviews & forum posts",
    segments_data,
)
with open("public/chart_user_segments.svg", "w", encoding="utf-8") as f:
    f.write(svg1)

svg2 = build_single_chart_svg(
    "Why Users Pause or Stop SIPs (Scraped Data)",
    "Distribution of drop-off triggers across 241 public reviews",
    themes_data,
)
with open("public/chart_dropoff_themes.svg", "w", encoding="utf-8") as f:
    f.write(svg2)

print("Generated both separate SVG files.")
