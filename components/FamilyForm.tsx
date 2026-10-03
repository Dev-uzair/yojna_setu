"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DEMO_HOUSEHOLD } from "@/lib/demo";
import type { Household, Member } from "@/lib/types";
import MemberRow from "./MemberRow";

const STATES = [
  "Madhya Pradesh",
  "Uttar Pradesh",
  "Rajasthan",
  "Bihar",
  "Maharashtra",
  "Gujarat",
  "Chhattisgarh",
  "Jharkhand",
  "Haryana",
  "Punjab",
  "West Bengal",
  "Odisha",
  "Andhra Pradesh",
  "Karnataka",
  "Tamil Nadu",
  "Telangana",
  "Kerala",
  "Assam",
  "Delhi",
];

const DEFAULT_HOUSEHOLD: Household = {
  state: "Madhya Pradesh",
  area: "rural",
  category: "obc",
  annualIncome: 200000,
  ownsFarmland: true,
  rationCard: "bpl",
  members: [
    {
      id: "mem-1",
      relation: "self",
      name: "",
      age: 40,
      gender: "male",
      maritalStatus: "married",
      education: "class_10",
      occupation: "farmer",
    },
  ],
};

export default function FamilyForm() {
  const router = useRouter();
  const [household, setHousehold] = useState<Household>(DEFAULT_HOUSEHOLD);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user already entered a household previously
    const saved = localStorage.getItem("ys_household");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.members && parsed.members.length > 0) {
          setHousehold(parsed);
        }
      } catch (e) {
        console.error("Failed to load saved household", e);
      }
    }
  }, []);

  const handleUseDemo = () => {
    setHousehold(JSON.parse(JSON.stringify(DEMO_HOUSEHOLD)));
  };

  const handleAddMember = () => {
    const newMember: Member = {
      id: `mem-${Date.now()}`,
      relation: "son",
      name: "",
      age: 18,
      gender: "male",
      maritalStatus: "single",
      education: "class_12",
      occupation: "student",
      currentCourse: "Class 12",
    };
    setHousehold((prev) => ({
      ...prev,
      members: [...prev.members, newMember],
    }));
  };

  const handleUpdateMember = (index: number, updated: Member) => {
    setHousehold((prev) => {
      const copy = [...prev.members];
      copy[index] = updated;
      return { ...prev, members: copy };
    });
  };

  const handleRemoveMember = (index: number) => {
    setHousehold((prev) => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Save to localStorage
    localStorage.setItem("ys_household", JSON.stringify(household));

    // Clear previous match cache so fresh results are calculated
    sessionStorage.removeItem("ys_last_match");

    // Navigate to dashboard
    router.push("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Banner: Quick Demo Button */}
      <div className="bg-[#FFF8E7] border border-[#F7D488] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div>
          <span className="font-bold text-[#8A5A00] block text-base">
            Want to see how it works instantly?
          </span>
          <span className="text-xs text-[#8A5A00]/80">
            Loads Ramesh &amp; Sunita&apos;s 5-member farming family from Sehore, MP.
          </span>
        </div>
        <button
          type="button"
          onClick={handleUseDemo}
          className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#E0A100] hover:bg-[#c99000] text-emerald-950 font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0"
        >
          ✨ Use Demo Family (5 members)
        </button>
      </div>

      {/* Household Overview Section */}
      <div className="bg-white border border-[#DCE5E0] rounded-xl p-5 sm:p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#1F5F4A] border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
          <span>🏡</span>
          <span>1. Household Details</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* State */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
            <select
              value={household.state}
              onChange={(e) => setHousehold({ ...household, state: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-[#1F5F4A]"
            >
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Area */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Area</label>
            <select
              value={household.area}
              onChange={(e) =>
                setHousehold({ ...household, area: e.target.value as Household["area"] })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-[#1F5F4A]"
            >
              <option value="rural">Rural (Village / Gram Panchayat)</option>
              <option value="urban">Urban (Town / City)</option>
            </select>
          </div>

          {/* Social Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Social Category (Caste / Category)
            </label>
            <select
              value={household.category}
              onChange={(e) =>
                setHousehold({ ...household, category: e.target.value as Household["category"] })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-[#1F5F4A]"
            >
              <option value="obc">OBC (Other Backward Class)</option>
              <option value="general">General</option>
              <option value="ews">EWS (Economically Weaker Section)</option>
              <option value="sc">SC (Scheduled Caste)</option>
              <option value="st">ST (Scheduled Tribe)</option>
            </select>
          </div>

          {/* Annual Family Income */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Annual Family Income (₹ per year)
            </label>
            <input
              type="number"
              min="0"
              step="10000"
              required
              value={household.annualIncome}
              onChange={(e) =>
                setHousehold({ ...household, annualIncome: parseInt(e.target.value) || 0 })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-[#1F5F4A]"
            />
            <span className="text-[11px] text-gray-500 mt-0.5 block">
              Combined income of all members (e.g. 200000 for 2 Lakh)
            </span>
          </div>

          {/* Ration Card */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Ration Card</label>
            <select
              value={household.rationCard}
              onChange={(e) =>
                setHousehold({ ...household, rationCard: e.target.value as Household["rationCard"] })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-[#1F5F4A]"
            >
              <option value="bpl">BPL (Below Poverty Line / Yellow/Pink Card)</option>
              <option value="apl">APL (Above Poverty Line)</option>
              <option value="none">No Ration Card</option>
            </select>
          </div>

          {/* Owns Farmland */}
          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={household.ownsFarmland}
                onChange={(e) =>
                  setHousehold({ ...household, ownsFarmland: e.target.checked })
                }
                className="w-5 h-5 rounded text-[#1F5F4A] focus:ring-[#1F5F4A] border-gray-300"
              />
              <span className="text-sm font-medium text-gray-800">
                Family owns agricultural farmland
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div className="bg-white border border-[#DCE5E0] rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 pb-2 mb-4 gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#1F5F4A] flex items-center gap-2">
              <span>👨‍👩‍👧‍👦</span>
              <span>2. Family Members ({household.members.length})</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Add every member living together. AI matches individual schemes for each.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddMember}
            className="text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg border border-[#1F5F4A] text-[#1F5F4A] hover:bg-[#EBF3EE] transition-colors flex items-center gap-1"
          >
            + Add Another Member
          </button>
        </div>

        <div className="space-y-3">
          {household.members.map((member, index) => (
            <MemberRow
              key={member.id}
              member={member}
              index={index}
              isOnlyMember={household.members.length === 1}
              onChange={(updated) => handleUpdateMember(index, updated)}
              onRemove={() => handleRemoveMember(index)}
            />
          ))}
        </div>
      </div>

      {/* Submit Card */}
      <div className="bg-[#EBF3EE] border border-[#DCE5E0] rounded-xl p-5 text-center space-y-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto min-w-[280px] h-12 px-8 rounded-xl bg-[#1F5F4A] hover:bg-[#174838] text-white font-bold text-base shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          {isSubmitting ? "Calculating..." : "🔍 Show my family's benefits →"}
        </button>

        <p className="text-xs text-gray-600 flex items-center justify-center gap-1">
          <span>🔒</span>
          <span>Your data stays on your phone. No document uploads.</span>
        </p>
      </div>
    </form>
  );
}
