"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { formatRupees } from "@/lib/format";
import type { Scheme } from "@/lib/types";

const SAMPLE_GAON_KI_BETI = `Gaon Ki Beti Yojana - Madhya Pradesh
Government of Madhya Pradesh provides financial assistance to rural girl students who pass Class 12 with 60% or higher marks from a village school and enroll in a government or recognized private college. 
Eligible girls receive financial assistance of ₹500 per month for 10 months in an academic year (total ₹5,000 per year) directly in their bank account.
Documents needed: Class 12 marksheet, College admission fee receipt, Gaon Ki Beti certificate from Gram Panchayat, Samagra ID, Aadhaar Card, Bank passbook.
Apply online through the MP State Scholarship Portal (scholarshipportal.mp.nic.in) after college admission.`;

export default function AddSchemePage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedScheme, setExtractedScheme] = useState<Scheme | null>(null);

  const handleSampleFill = () => {
    setText(SAMPLE_GAON_KI_BETI);
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to process scheme text");
      }

      const data = await res.json();
      setExtractedScheme(data.scheme);

      // Save to localStorage
      const existingStr = localStorage.getItem("ys_extra_schemes");
      let existing: Scheme[] = [];
      if (existingStr) {
        try {
          existing = JSON.parse(existingStr);
        } catch {
          existing = [];
        }
      }

      // Avoid duplicate by id
      const filtered = existing.filter((s) => s.id !== data.scheme.id);
      filtered.push(data.scheme);
      localStorage.setItem("ys_extra_schemes", JSON.stringify(filtered));

      // Clear match cache
      sessionStorage.removeItem("ys_last_match");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to parse scheme");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Navbar showBackToHome={true} showAddScheme={false} />

        <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <div className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-[#FFF9ED] text-[#8A5A00] border border-[#F7D488] mb-2">
              ✨ Live AI Ingestion Demo
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Add New Scheme From Any Government Notification
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Paste the raw text of any official notification, circular, or news clipping. AI will extract the eligibility criteria, cash benefits, deadlines, and documents checklist.
            </p>
          </div>

          <form onSubmit={handleIngest} className="bg-white border border-[#DCE5E0] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                Paste Official Scheme Guidelines:
              </label>
              <button
                type="button"
                onClick={handleSampleFill}
                className="text-xs text-[#1F5F4A] hover:underline font-semibold"
              >
                📋 Paste Sample (Gaon Ki Beti Yojana)
              </button>
            </div>

            <textarea
              required
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste scheme description, government press release, or website text here..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-900 focus:outline-[#1F5F4A] font-mono leading-relaxed"
            />

            {error && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="w-full h-11 rounded-lg bg-[#1F5F4A] hover:bg-[#174838] text-white font-bold text-sm shadow transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Extracting Scheme with AI...</span>
                </>
              ) : (
                <span>⚡ Read &amp; Structure this scheme with AI</span>
              )}
            </button>
          </form>

          {/* Extracted Card Preview */}
          {extractedScheme && (
            <div className="bg-[#FAFDFB] border-2 border-[#1F5F4A] rounded-xl p-6 shadow-md space-y-4 animate-in fade-in duration-300">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-[#1F5F4A] inline-block mb-1">
                    ✓ Successfully Structured Scheme
                  </span>
                  <h3 className="text-xl font-extrabold text-gray-900">
                    {extractedScheme.name}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {extractedScheme.summary}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-black text-[#1F5F4A]">
                    {extractedScheme.annualValue > 0
                      ? formatRupees(extractedScheme.annualValue) + " / yr"
                      : "Non-cash"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white border border-[#DCE5E0] rounded-lg p-3">
                <div>
                  <strong className="block text-gray-900">Eligibility:</strong>
                  <span className="text-gray-700">{extractedScheme.eligibility}</span>
                </div>
                <div>
                  <strong className="block text-gray-900">Application Mode:</strong>
                  <span className="text-gray-700">{extractedScheme.howToApply}</span>
                </div>
              </div>

              <div>
                <strong className="block text-xs font-bold text-gray-900 mb-1">
                  Required Documents:
                </strong>
                <div className="flex flex-wrap gap-1.5">
                  {extractedScheme.documents.map((d, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-800 rounded text-xs"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoToDashboard}
                className="w-full h-11 rounded-lg bg-[#E0A100] hover:bg-[#c99000] text-emerald-950 font-bold text-sm shadow transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Check My Family Against This Scheme →</span>
              </button>
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-gray-200 bg-white py-6 mt-12 text-center text-xs text-gray-500">
        <p>Yojana Setu • AI-Powered Welfare Scheme Intake</p>
      </footer>
    </div>
  );
}
