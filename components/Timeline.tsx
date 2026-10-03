"use client";

import { useState } from "react";
import type { Match, Member, Scheme } from "@/lib/types";
import MatchCard from "./MatchCard";

interface TimelineProps {
  matches: (Match & { scheme: Scheme })[];
  members: Member[];
  onOpenDetails: (match: Match & { scheme: Scheme }) => void;
}

export default function Timeline({
  matches,
  members,
  onOpenDetails,
}: TimelineProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Filter matches based on selected filter
  const filteredMatches = matches.filter((m) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "household") return m.memberId === null;
    return m.memberId === selectedFilter;
  });

  const actNowMatches = filteredMatches.filter((m) => m.window === "now");
  const soonMatches = filteredMatches.filter((m) => m.window === "soon");
  const laterMatches = filteredMatches.filter((m) => m.window === "later");

  return (
    <div className="space-y-6">
      {/* Member Filter Chips */}
      <div className="bg-white border border-[#DCE5E0] rounded-xl p-3 sm:p-4 shadow-xs">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Filter by family member:
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedFilter === "all"
                ? "bg-[#1F5F4A] text-white shadow-xs"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            All Benefits ({matches.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter("household")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedFilter === "household"
                ? "bg-[#1F5F4A] text-white shadow-xs"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            🏡 Whole Family ({matches.filter((m) => m.memberId === null).length})
          </button>

          {members.map((member) => {
            const count = matches.filter((m) => m.memberId === member.id).length;
            const isSelected = selectedFilter === member.id;
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedFilter(member.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-[#1F5F4A] text-white shadow-xs"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                👤 {member.name} ({member.relation === "self" ? "Head" : member.relation})
                {count > 0 && <span className="ml-1 opacity-75">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3-Column Timeline: Act now / Next 3 months / Coming up */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Column 1: Act Now (Haldi) */}
        <div className="bg-[#FFFDF7] border-2 border-[#F7D488] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
          <div className="border-b border-[#F7D488] pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#E0A100] text-emerald-950 font-bold flex items-center justify-center text-sm shadow-xs">
                  ⚡
                </span>
                <h3 className="font-extrabold text-base sm:text-lg text-[#8A5A00]">
                  Act Now
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#E0A100]/20 text-[#8A5A00]">
                {actNowMatches.length} schemes
              </span>
            </div>
            <p className="text-xs text-[#8A5A00]/80 mt-1">
              Apply today or within 30 days. Don&apos;t miss open windows!
            </p>
          </div>

          <div className="space-y-4">
            {actNowMatches.length > 0 ? (
              actNowMatches.map((match) => (
                <MatchCard
                  key={`${match.schemeId}-${match.memberId ?? "fam"}`}
                  match={match}
                  members={members}
                  onOpenDetails={onOpenDetails}
                />
              ))
            ) : (
              <div className="text-center py-8 text-xs text-gray-400 bg-white rounded-lg border border-dashed border-gray-200">
                No immediate deadlines in this filter.
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Next 3 Months (River Blue) */}
        <div className="bg-[#F8FAFD] border-2 border-[#ADCDEC] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
          <div className="border-b border-[#ADCDEC] pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#2F6FB0] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  🗓️
                </span>
                <h3 className="font-extrabold text-base sm:text-lg text-[#205E9E]">
                  Next 3 Months
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#2F6FB0]/15 text-[#205E9E]">
                {soonMatches.length} schemes
              </span>
            </div>
            <p className="text-xs text-[#205E9E]/80 mt-1">
              Upcoming camps and seasonal cycles opening soon.
            </p>
          </div>

          <div className="space-y-4">
            {soonMatches.length > 0 ? (
              soonMatches.map((match) => (
                <MatchCard
                  key={`${match.schemeId}-${match.memberId ?? "fam"}`}
                  match={match}
                  members={members}
                  onOpenDetails={onOpenDetails}
                />
              ))
            ) : (
              <div className="text-center py-8 text-xs text-gray-400 bg-white rounded-lg border border-dashed border-gray-200">
                No schemes opening in the next 3 months for this filter.
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Coming Up (Stone Grey) */}
        <div className="bg-[#FAFBFB] border-2 border-[#E5E7EB] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
          <div className="border-b border-[#E5E7EB] pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#6B7280] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  ⏳
                </span>
                <h3 className="font-extrabold text-base sm:text-lg text-[#374151]">
                  Coming Up
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-200 text-gray-700">
                {laterMatches.length} schemes
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Future life events, college admissions, and counselling windows.
            </p>
          </div>

          <div className="space-y-4">
            {laterMatches.length > 0 ? (
              laterMatches.map((match) => (
                <MatchCard
                  key={`${match.schemeId}-${match.memberId ?? "fam"}`}
                  match={match}
                  members={members}
                  onOpenDetails={onOpenDetails}
                />
              ))
            ) : (
              <div className="text-center py-8 text-xs text-gray-400 bg-white rounded-lg border border-dashed border-gray-200">
                No long-term schemes in this filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
