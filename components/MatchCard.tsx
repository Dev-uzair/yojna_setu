import { formatRupees } from "@/lib/format";
import type { Match, Member, Scheme } from "@/lib/types";

interface MatchCardProps {
  match: Match & { scheme: Scheme };
  members: Member[];
  onOpenDetails: (match: Match & { scheme: Scheme }) => void;
}

export default function MatchCard({
  match,
  members,
  onOpenDetails,
}: MatchCardProps) {
  const { scheme, window, whenText, whyEligible, nextStep, memberId } = match;

  // Find recipient member name
  const recipient = memberId
    ? members.find((m) => m.id === memberId)
    : null;

  const recipientLabel = recipient
    ? `${recipient.name} (${recipient.relation === "self" ? "Head" : recipient.relation})`
    : "Whole family";

  const windowBadgeStyles = {
    now: "bg-[#FFF9ED] text-[#B87800] border-[#F7D488]",
    soon: "bg-[#F0F6FF] text-[#205E9E] border-[#ADCDEC]",
    later: "bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB]",
  }[window];

  const windowLabel = {
    now: "⚡ Act Now",
    soon: "🗓️ Next 3 Months",
    later: "⏳ Coming Up",
  }[window];

  return (
    <div className="bg-white border border-[#DCE5E0] hover:border-[#1F5F4A] rounded-xl p-4 sm:p-5 shadow-sm transition-all hover:shadow flex flex-col justify-between">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EBF3EE] text-[#1F5F4A] border border-[#DCE5E0]">
            👤 {recipientLabel}
          </span>
          <span
            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${windowBadgeStyles}`}
          >
            {windowLabel}
          </span>
        </div>

        {/* Scheme Name */}
        <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-snug mb-1">
          {scheme.name}
        </h3>

        {/* Value or Benefit Tag */}
        <div className="mb-3">
          {scheme.annualValue > 0 ? (
            <span className="text-base sm:text-lg font-extrabold text-[#1F5F4A]">
              {formatRupees(scheme.annualValue)}
              <span className="text-xs font-medium text-gray-500 ml-1">/ year</span>
            </span>
          ) : (
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded inline-block">
              {scheme.benefit.length > 55 ? scheme.benefit.slice(0, 52) + "..." : scheme.benefit}
            </span>
          )}
        </div>

        {/* Why eligible */}
        <div className="bg-[#FAFCFA] border border-gray-100 rounded-lg p-2.5 mb-3 text-xs text-gray-700">
          <strong className="text-gray-900 block mb-0.5">Why you qualify:</strong>
          {whyEligible}
        </div>

        {/* Timeline clue */}
        <div className="text-xs text-gray-600 mb-3 flex items-start gap-1.5">
          <span className="shrink-0 mt-0.5">⏰</span>
          <span>
            <strong>When:</strong> {whenText}
          </span>
        </div>
      </div>

      {/* Button to open drawer */}
      <button
        type="button"
        onClick={() => onOpenDetails(match)}
        className="w-full mt-2 h-10 rounded-lg bg-[#EBF3EE] hover:bg-[#1F5F4A] text-[#1F5F4A] hover:text-white font-bold text-xs sm:text-sm border border-[#DCE5E0] hover:border-[#1F5F4A] transition-all flex items-center justify-center gap-1.5"
      >
        <span>See how to apply</span>
        <span>→</span>
      </button>
    </div>
  );
}
