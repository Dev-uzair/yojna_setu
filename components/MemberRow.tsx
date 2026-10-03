"use client";

import type { Member } from "@/lib/types";

interface MemberRowProps {
  member: Member;
  index: number;
  isOnlyMember: boolean;
  onChange: (updated: Member) => void;
  onRemove: () => void;
}

export default function MemberRow({
  member,
  index,
  isOnlyMember,
  onChange,
  onRemove,
}: MemberRowProps) {
  const isSelf = member.relation === "self";

  return (
    <div className="bg-white border border-[#DCE5E0] rounded-lg p-4 shadow-sm relative">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#EBF3EE] text-[#1F5F4A] font-bold text-xs flex items-center justify-center">
            {index + 1}
          </span>
          <span className="font-semibold text-sm text-[#1F5F4A]">
            {isSelf ? "Self (Head of household)" : `${member.name || "Family Member"}`}
          </span>
        </div>

        {!isSelf && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
        {/* Relation */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Relation</label>
          <select
            value={member.relation}
            disabled={isSelf}
            onChange={(e) =>
              onChange({ ...member, relation: e.target.value as Member["relation"] })
            }
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white text-gray-900 disabled:bg-gray-100"
          >
            <option value="self">Self (Head)</option>
            <option value="spouse">Spouse (Wife/Husband)</option>
            <option value="son">Son</option>
            <option value="daughter">Daughter</option>
            <option value="father">Father</option>
            <option value="mother">Mother</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Name <span className="text-gray-400 font-normal">(for you only)</span>
          </label>
          <input
            type="text"
            required
            value={member.name}
            onChange={(e) => onChange({ ...member, name: e.target.value })}
            placeholder="e.g. Ramesh"
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-900 focus:outline-[#1F5F4A]"
          />
        </div>

        {/* Age */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Age</label>
          <input
            type="number"
            min="0"
            max="120"
            required
            value={member.age || ""}
            onChange={(e) => onChange({ ...member, age: parseInt(e.target.value) || 0 })}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-900 focus:outline-[#1F5F4A]"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
          <select
            value={member.gender}
            onChange={(e) =>
              onChange({ ...member, gender: e.target.value as Member["gender"] })
            }
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white text-gray-900 focus:outline-[#1F5F4A]"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        {/* Marital Status */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Marital Status</label>
          <select
            value={member.maritalStatus}
            onChange={(e) =>
              onChange({ ...member, maritalStatus: e.target.value as Member["maritalStatus"] })
            }
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white text-gray-900 focus:outline-[#1F5F4A]"
          >
            <option value="single">Single / Unmarried</option>
            <option value="married">Married</option>
            <option value="widowed">Widowed / Widower</option>
          </select>
        </div>

        {/* Education */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Education</label>
          <select
            value={member.education}
            onChange={(e) =>
              onChange({ ...member, education: e.target.value as Member["education"] })
            }
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white text-gray-900 focus:outline-[#1F5F4A]"
          >
            <option value="none">No formal schooling</option>
            <option value="primary">Primary school (Up to Class 8)</option>
            <option value="class_10">Class 10 passed</option>
            <option value="class_12">Class 12 passed</option>
            <option value="graduate">College Graduate / Diploma</option>
          </select>
        </div>

        {/* Occupation */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Occupation</label>
          <select
            value={member.occupation}
            onChange={(e) =>
              onChange({ ...member, occupation: e.target.value as Member["occupation"] })
            }
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white text-gray-900 focus:outline-[#1F5F4A]"
          >
            <option value="farmer">Farmer / Agriculture</option>
            <option value="student">Student</option>
            <option value="homemaker">Homemaker</option>
            <option value="daily_wage">Daily Wage Laborer</option>
            <option value="self_employed">Small Business / Self-employed</option>
            <option value="salaried">Salaried Job</option>
            <option value="unemployed">Unemployed</option>
          </select>
        </div>

        {/* Current Course (if student) */}
        {member.occupation === "student" && (
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Current Class / Course <span className="text-[#1F5F4A] font-semibold">(e.g. Class 12, Class 3, B.Tech)</span>
            </label>
            <input
              type="text"
              value={member.currentCourse || ""}
              onChange={(e) => onChange({ ...member, currentCourse: e.target.value })}
              placeholder="e.g. Class 12"
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-900 focus:outline-[#1F5F4A]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
