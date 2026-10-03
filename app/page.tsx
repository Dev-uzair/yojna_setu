import Navbar from "@/components/Navbar";
import FamilyForm from "@/components/FamilyForm";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Navbar showBackToHome={false} showAddScheme={true} />

        <main className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
          {/* Hero Section */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF3EE] text-[#1F5F4A] font-semibold text-xs mb-3 border border-[#DCE5E0]">
              <span>🇮🇳</span>
              <span>Central &amp; State Welfare Benefit Discovery</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
              Find every government scheme your family is owed,{" "}
              <span className="text-[#1F5F4A] underline decoration-[#E0A100] decoration-wavy decoration-2">
                before the deadline.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-normal">
              One tip about an AICTE fee waiver saved a farmer&apos;s son ₹3,20,000 in college fees.
              Most Indian families never hear these tips in time.{" "}
              <strong className="text-[#1F5F4A]">Yojana Setu tells you what to claim and when.</strong>
            </p>
          </div>

          {/* Form */}
          <FamilyForm />
        </main>
      </div>

      <footer className="border-t border-gray-200 bg-white py-6 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-4xl mx-auto px-4 space-y-1">
          <p>
            <strong>Yojana Setu</strong> • Designed for Indian families across towns &amp; villages.
          </p>
          <p>
            Rules and amounts can change. Always check the official government portal before applying.
          </p>
        </div>
      </footer>
    </div>
  );
}
