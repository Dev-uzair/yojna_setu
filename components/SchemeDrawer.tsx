"use client";

import { useState, useEffect } from "react";
import { formatRupees } from "@/lib/format";
import type { Match, Member, Scheme } from "@/lib/types";

interface SchemeDrawerProps {
  match: (Match & { scheme: Scheme }) | null;
  members: Member[];
  onClose: () => void;
}

export default function SchemeDrawer({
  match,
  members,
  onClose,
}: SchemeDrawerProps) {
  const [tickedDocs, setTickedDocs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (match) {
      const storageKey = `ys_docs_${match.scheme.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setTickedDocs(JSON.parse(saved));
        } catch {
          setTickedDocs({});
        }
      } else {
        setTickedDocs({});
      }
    }
  }, [match]);

  const toggleDoc = (doc: string) => {
    if (!match) return;
    const next = { ...tickedDocs, [doc]: !tickedDocs[doc] };
    setTickedDocs(next);
    localStorage.setItem(`ys_docs_${match.scheme.id}`, JSON.stringify(next));
  };

  if (!match) return null;

  const { scheme, whenText, whyEligible, nextStep, memberId, window } = match;
  const recipient = memberId ? members.find((m) => m.id === memberId) : null;
  const recipientLabel = recipient
    ? `${recipient.name} (${recipient.relation === "self" ? "Head" : recipient.relation})`
    : "Whole family";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex justify-end">
      <div
        className="w-full max-w-lg bg-white min-h-screen shadow-2xl p-6 sm:p-7 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-[#1F5F4A]">
                  {scheme.level === "state" ? `${scheme.state || "State"} Scheme` : "Central Scheme"}
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                  Beneficiary: {recipientLabel}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                {scheme.name}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold shrink-0"
              aria-label="Close drawer"
            >
              ✕
            </button>
          </div>

          {/* Value Banner */}
          <div className="bg-[#EBF3EE] border border-[#DCE5E0] rounded-xl p-4 mb-5 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-600 font-medium">Annual Value</div>
              <div className="text-2xl font-black text-[#1F5F4A]">
                {scheme.annualValue > 0 ? formatRupees(scheme.annualValue) : "Non-cash Benefit"}
              </div>
            </div>
            <div className="text-xs text-right max-w-[200px] text-gray-700">
              {scheme.benefit}
            </div>
          </div>

          {/* Section: Why you qualify */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              1. Why your family qualifies
            </h3>
            <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 text-sm text-gray-800">
              {whyEligible}
            </div>
          </div>

          {/* Section: When to apply */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              2. When to apply &amp; deadlines
            </h3>
            <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3 text-sm text-gray-800 flex items-center gap-2">
              <span className="text-base">📅</span>
              <span>{whenText}</span>
            </div>
          </div>

          {/* Section: Next Step */}
          <div className="mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              3. Next concrete action
            </h3>
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 text-sm font-semibold text-[#1F5F4A] flex items-center gap-2">
              <span className="text-base">👉</span>
              <span>{nextStep}</span>
            </div>
          </div>

          {/* Section: Documents checklist */}
          <div className="mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center justify-between">
              <span>4. Documents Checklist (tick when ready)</span>
              <span className="text-[11px] font-normal text-emerald-800">
                {Object.values(tickedDocs).filter(Boolean).length} / {scheme.documents.length} ready
              </span>
            </h3>

            <div className="space-y-2">
              {scheme.documents.map((doc) => {
                const isChecked = !!tickedDocs[doc];
                return (
                  <label
                    key={doc}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                      isChecked
                        ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-medium"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleDoc(doc)}
                      className="w-4 h-4 rounded text-[#1F5F4A] focus:ring-[#1F5F4A] border-gray-300"
                    />
                    <span className={isChecked ? "line-through opacity-80" : ""}>
                      {doc}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section: How to apply */}
          <div className="mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              5. How to apply
            </h3>
            <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">
              {scheme.howToApply}
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
          {scheme.sourceUrl && (
            <a
              href={scheme.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 rounded-lg bg-[#1F5F4A] hover:bg-[#174838] text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow transition-colors"
            >
              <span>Visit Official Government Portal</span>
              <span>↗</span>
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
