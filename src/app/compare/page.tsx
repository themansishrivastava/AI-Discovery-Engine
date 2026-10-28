"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export default function CompareOldVsNewPage() {
  const [showUnitsMode, setShowUnitsMode] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/groww-logo.png" alt="Groww" className="w-7 h-7 rounded-full object-cover" />
            <span className="font-display font-bold text-base text-slate-900">
              Old UI vs. New UI Comparison
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/mvp"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#00B386] text-white hover:bg-[#009973]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Main MVP (/mvp)
            </Link>
            <Link
              href="/"
              className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              Discovery Engine
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-900">
          This is a demo and not investment advice. Don&apos;t enter PAN, account numbers or portfolio details.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Old UI */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="font-display font-bold text-sm text-slate-900">
              Old UI (Current Groww Screens 1 &amp; 2)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-[11px] font-medium text-center text-slate-600">
                  1. Fund Screen (-2.42%)
                </div>
                <div className="bg-[#121316] rounded-[18px] border-[3px] border-slate-800 overflow-hidden">
                  <img
                    src="/groww-old-fund-screen.png"
                    alt="Groww Fund Screen"
                    className="w-full h-[310px] object-cover object-top"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-medium text-center text-slate-600">
                  2. SIP Date &amp; Amount
                </div>
                <div className="bg-[#121316] rounded-[18px] border-[3px] border-slate-800 overflow-hidden">
                  <img
                    src="/groww-old-date-screen.png"
                    alt="Groww SIP Date Screen"
                    className="w-full h-[310px] object-cover object-top"
                  />
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                • <strong>Screen 1:</strong> Displays -2.42% (1Y) return without an inline units-collected view or a Smart SIP Helper entry point.
              </div>
              <div>
                • <strong>Screen 2:</strong> Displays fixed amount and date selection without a one-tap option to lower this month&apos;s instalment to ₹500 or skip one instalment.
              </div>
            </div>
          </div>

          {/* New UI */}
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-1.5 font-display font-bold text-sm text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-[#00B386]" />
              <span>New UI (Added Smart SIP Helper Entry Point)</span>
            </div>

            <div className="bg-[#121316] text-white rounded-[22px] border-[4px] border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-white/10 pb-2">
                <span>← SBI Nifty Next 50 Index Fund</span>
                <span className="text-[#00D09C]">Active • ₹2,000/mo</span>
              </div>

              <div className="flex items-center justify-between bg-[#1B1D22] rounded-xl p-3 border border-white/10">
                <div>
                  {showUnitsMode ? (
                    <>
                      <div className="text-sm font-bold text-[#00D09C]">534.4 Units Collected</div>
                      <div className="text-[11px] text-slate-300">NAV: ₹18.71 • 5/12 instalments</div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-bold text-rose-400">-2.42% (1Y)</div>
                      <div className="text-[11px] text-slate-400">NAV: ₹18.71 • Min. SIP ₹500</div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setShowUnitsMode((v) => !v)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded bg-[#00D09C]/20 text-[#00D09C]"
                >
                  {showUnitsMode ? "% View" : "+ Units View"}
                </button>
              </div>

              <Link
                href="/mvp"
                className="w-full py-2.5 px-3 rounded-xl bg-[#00B386] text-white font-bold text-xs flex items-center justify-between"
              >
                <span>Open Smart SIP Helper (Main MVP Flow)</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
