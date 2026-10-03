import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yojana Setu - Know your family's government benefits",
  description: "Find every government scheme your family is owed, before the deadline. Instant matching for Indian families.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#FAFCFA] text-[#1B2430] antialiased">
        {children}
      </body>
    </html>
  );
}
