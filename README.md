# 🇮🇳 Yojana Setu (योजना सेतु)

> **Know your family's government benefits — before the deadline.**

Yojana Setu is an AI-powered welfare discovery bridge for Indian families. Instead of forcing citizens to search across hundreds of fragmented government portals using complex bureaucratic jargon, a family enters its household details once. Yojana Setu automatically matches each member against Central and State schemes, calculates total annual rupee entitlements, and provides a clear 24-month timeline of when to act.

---

## 🌟 Why Yojana Setu?

- **The Problem:** One tip about an AICTE Tuition Fee Waiver (TFW) can save a farming family ₹3,20,000 in college engineering fees. Yet, millions of eligible Indian families miss out every year simply because notification windows close before they ever hear about them.
- **The Solution:** A proactive timeline that maps out:
  1. ⚡ **Act Now:** Urgent opportunities (e.g. Sukanya Samriddhi before a daughter turns 10, open PM-KISAN registrations).
  2. 🗓️ **Next 3 Months:** Seasonal state welfare camps (e.g. MP Ladli Behna camps, post-matric scholarship cycles).
  3. ⏳ **Coming Up:** Future milestones (e.g. engineering entrance counselling fee waivers for Class 12 students).

---

## ✨ Key Features

- **Bank Passbook Total Card:** Styled with a traditional passbook aesthetic displaying total annual cash claims (e.g., ₹1,00,000+/yr) plus non-cash coverage (₹5 Lakh Ayushman Bharat health insurance).
- **Proactive Timeline Engine:** Categorizes benefits by urgency so families never miss an application deadline.
- **Individual & Family Filtering:** Filter entitlements by individual members (Head, Spouse, Son, Daughter, Elderly Parents) or whole-household schemes.
- **Actionable Scheme Drawer:**
  - Plain-language explanation of why the family qualifies.
  - Concrete next step (e.g., *"Procure an updated family Income Certificate from the Tehsildar before counselling starts"*).
  - **Interactive Document Checklist:** Check off required documents with persistent local state.
  - Direct links to official government portals.
- **⚡ Live AI Notification Ingestion:** Paste any unstructured government notification, circular, or news clipping. Gemini (`gemini-3.5-flash-lite`) instantly structures it into eligibility rules, cash value, and document requirements.
- **🔒 Privacy-First by Design:** No phone numbers, no Aadhaar uploads, and zero database storage. All family data stays securely inside the user's browser (`localStorage`).
- **🛡️ Bulletproof Demo Fallback:** Equipped with a built-in deterministic rule engine that ensures flawless operation and zero crashes even if offline or without an API key.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS (Custom Indian welfare palette: Neem Green `#1F5F4A`, Haldi `#E0A100`, River Blue `#2F6FB0`)
- **AI Engine:** Google Gemini via `@google/genai` (Model: `gemini-3.5-flash-lite`)
- **Validation:** Zod

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/Dev-uzair/yojna_setu.git
cd yojna_setu
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the project root:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎬 How to Demo in 60 Seconds

1. Open [http://localhost:3000](http://localhost:3000).
2. Click **"✨ Use Demo Family (5 members)"** — automatically pre-fills Ramesh and Sunita's family from Sehore, MP.
3. Click **"Show my family's benefits →"**.
4. Show the **Passbook Total Card** (₹1,00,000+ per year identified).
5. Walk through the 3 timelines:
   - **Act Now:** PM-KISAN, Sukanya Samriddhi (daughter is 9!), IGNOAPS Old Age Pension.
   - **Next 3 Months:** Ladli Behna Yojana camp, Post-Matric OBC scholarship.
   - **Coming Up:** AICTE Tuition Fee Waiver (TFW) for son Aman in Class 12.
6. Open any card to show the **Document Checklist**.
7. Click **"+ Add scheme"** in the top bar and paste *Gaon Ki Beti Yojana* to demonstrate live AI circular parsing!

*(See [presentation.md](presentation.md) for full pitch notes and scripts).*

---

## 📜 License
MIT License. Built for social good and citizen welfare enablement across India.
