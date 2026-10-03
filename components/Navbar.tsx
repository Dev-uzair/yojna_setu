import Link from "next/link";

export default function Navbar({
  showBackToHome = false,
  showAddScheme = true,
}: {
  showBackToHome?: boolean;
  showAddScheme?: boolean;
}) {
  return (
    <header className="bg-[#1F5F4A] text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 text-white no-underline">
          <div className="w-8 h-8 rounded-full bg-[#E0A100] flex items-center justify-center text-[#1F5F4A] font-bold text-lg shadow-sm">
            य
          </div>
          <div>
            <div className="font-bold text-lg leading-tight tracking-tight">Yojana Setu</div>
            <div className="text-xs text-emerald-100 font-light hidden sm:block">
              Right benefits • Before deadline
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {showBackToHome && (
            <Link
              href="/"
              className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-md bg-emerald-800 hover:bg-emerald-900 text-emerald-100 transition-colors"
            >
              ← Edit family
            </Link>
          )}

          {showAddScheme && (
            <Link
              href="/add-scheme"
              className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-md bg-[#E0A100] hover:bg-[#c99000] text-emerald-950 transition-colors font-semibold"
            >
              + Add scheme
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
