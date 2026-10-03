"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import TotalCard from "@/components/TotalCard";
import Timeline from "@/components/Timeline";
import SchemeDrawer from "@/components/SchemeDrawer";
import type { Household, Match, MatchResult, Scheme } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [household, setHousehold] = useState<Household | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDrawerMatch, setActiveDrawerMatch] = useState<(Match & { scheme: Scheme }) | null>(null);

  const fetchMatches = async (h: Household) => {
    setLoading(true);
    setError(null);

    try {
      // Check session storage cache
      const cached = sessionStorage.getItem("ys_last_match");
      const householdHash = JSON.stringify(h);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.householdHash === householdHash && parsed.result) {
            setMatchResult(parsed.result);
            setLoading(false);
            return;
          }
        } catch {
          // ignore cache error
        }
      }

      // Read extra schemes if any
      let extraSchemes: Scheme[] = [];
      const extraSaved = localStorage.getItem("ys_extra_schemes");
      if (extraSaved) {
        try {
          extraSchemes = JSON.parse(extraSaved);
        } catch {
          extraSchemes = [];
        }
      }

      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ household: h, extraSchemes }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Failed to match schemes`);
      }

      const data: MatchResult = await res.json();
      setMatchResult(data);

      // Save to cache
      sessionStorage.setItem(
        "ys_last_match",
        JSON.stringify({ householdHash, result: data })
      );
    } catch (err: unknown) {
      console.error("Match error:", err);
      setError(err instanceof Error ? err.message : "Failed to calculate matches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Read household from localStorage
    const saved = localStorage.getItem("ys_household");
    if (!saved) {
      router.push("/");
      return;
    }

    try {
      const parsed = JSON.parse(saved) as Household;
      if (!parsed.members || parsed.members.length === 0) {
        router.push("/");
        return;
      }
      setHousehold(parsed);
      fetchMatches(parsed);
    } catch {
      router.push("/");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Navbar showBackToHome={true} showAddScheme={true} />

        <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Family Benefits &amp; Timeline
              </h1>
              {household && (
                <div className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  Showing results for {household.state} • {household.area === "rural" ? "Rural Village" : "Urban"} • {household.category.toUpperCase()} • {household.members.length} members
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => household && fetchMatches(household)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 bg-white text-gray-700 text-xs font-semibold shadow-xs hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>

              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg border border-[#1F5F4A] bg-[#EBF3EE] text-[#1F5F4A] text-xs font-bold hover:bg-[#dce9df] transition-colors"
              >
                ✏️ Edit Family
              </Link>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white border border-[#DCE5E0] rounded-xl p-10 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 border-4 border-[#1F5F4A] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">
                  Checking schemes for each family member...
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Analyzing central and state welfare rules, income limits, student fee waivers, and upcoming deadlines.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3">
              <div className="text-2xl">⚠️</div>
              <h3 className="font-bold text-red-900 text-base">
                Could not load scheme matches
              </h3>
              <p className="text-xs text-red-700 max-w-md mx-auto">{error}</p>
              <button
                type="button"
                onClick={() => household && fetchMatches(household)}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Success State */}
          {!loading && !error && matchResult && household && (
            <>
              {/* Passbook Total Card */}
              <TotalCard
                totalAnnualValue={matchResult.totalAnnualValue}
                schemeCount={matchResult.matches.length}
                memberCount={household.members.length}
              />

              {/* Timeline Section */}
              <Timeline
                matches={matchResult.matches}
                members={household.members}
                onOpenDetails={(m) => setActiveDrawerMatch(m)}
              />
            </>
          )}
        </main>
      </div>

      {/* Drawer */}
      {household && (
        <SchemeDrawer
          match={activeDrawerMatch}
          members={household.members}
          onClose={() => setActiveDrawerMatch(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-4xl mx-auto px-4 space-y-1">
          <p>
            <strong>Yojana Setu</strong> • Central and State Government Scheme Eligibility
          </p>
          <p>
            Rules and amounts can change. Always check the official government portal before applying.
          </p>
        </div>
      </footer>
    </div>
  );
}
