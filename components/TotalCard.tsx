import { formatRupees } from "@/lib/format";

interface TotalCardProps {
  totalAnnualValue: number;
  schemeCount: number;
  memberCount: number;
}

export default function TotalCard({
  totalAnnualValue,
  schemeCount,
  memberCount,
}: TotalCardProps) {
  return (
    <div className="passbook-card p-6 sm:p-7 text-center sm:text-left bg-gradient-to-br from-white to-[#F8FAF9]">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
            <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#1F5F4A] text-white">
              Family Benefit Passbook
            </span>
            <span className="text-xs text-gray-500">• Official Welfare Entitlements</span>
          </div>

          <div className="text-sm sm:text-base text-gray-700 font-medium">
            Your family can claim about
          </div>

          <div className="text-3xl sm:text-5xl font-black text-[#1F5F4A] tracking-tight my-1">
            {formatRupees(totalAnnualValue)}
            <span className="text-sm sm:text-lg font-semibold text-gray-600 ml-2">
              per year
            </span>
          </div>

          <div className="text-xs text-gray-500 mt-1 max-w-xl">
            * Estimated cash transfers and tuition fee waivers. Health insurance cover (₹5L Ayushman Bharat) and girl child savings (SSY) are additional.
          </div>
        </div>

        <div className="shrink-0 bg-[#EBF3EE] border border-[#DCE5E0] rounded-xl px-5 py-4 text-center">
          <div className="text-2xl sm:text-3xl font-extrabold text-[#1F5F4A]">
            {schemeCount}
          </div>
          <div className="text-xs font-semibold text-gray-700">
            Eligible Schemes
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">
            For {memberCount} family members
          </div>
        </div>
      </div>
    </div>
  );
}
