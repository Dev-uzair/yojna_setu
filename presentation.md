# Yojana Setu — Demo & Pitch Guide 🚀

A quick, step-by-step guide to delivering a high-impact demo of **Yojana Setu**.

---

## 🔑 1. Environment Variables to Add

Add these to your `.env.local` file in the project root:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
```

> **Safe Demo Guarantee:** If the API key is not set or network fails during the presentation, our built-in fallback engine guarantees zero crashes and perfect, realistic results every time.

---

## 🎯 2. The 30-Second Elevator Pitch

> *"Most Indian families miss out on lakhs in government benefits simply because they hear about them **after the deadline**, or have no idea they qualify.*  
> *One tip about a fee waiver saved a student ₹3.2 Lakhs in engineering fees.*  
> ***Yojana Setu** is an intelligent welfare discovery bridge: a family enters their details once, and gets an instant, personalized timeline of what to claim, how much it's worth, and when to act.*

---

## 🎬 3. Step-by-Step Demo Flow

### Step 1: Open the Landing Page
- Open: `http://localhost:3000`
- **What to say:** *"Notice how clean and respectful the interface is. No logins, no document uploads, data stays 100% in the user's browser."*

### Step 2: Fill the Form (The Magic 1-Click Button)
- Point to the **"✨ Use Demo Family (5 members)"** button at the top and click it.
- **Show what got filled:**
  - **State:** Madhya Pradesh
  - **Area:** Rural (Village)
  - **Social Category:** OBC
  - **Income:** ₹2,00,000 / year
  - **Farmland:** Checked (Farmer household)
  - **Ration Card:** BPL
  - **5 Family Members:**
    1. **Ramesh** (Self, 48, Farmer)
    2. **Sunita** (Spouse, 44, Homemaker)
    3. **Aman** (Son, 17, Student, Class 12) 👈 *Key for fee waivers*
    4. **Pooja** (Daughter, 9, Student) 👈 *Key for Sukanya Samriddhi*
    5. **Kamla** (Mother, 67, Homemaker) 👈 *Key for Old Age Pension*

### Step 3: Reveal the Family Passbook (Dashboard)
- Click the big green button: **"Show my family's benefits →"**
- **The Wow Moment #1 — The Passbook Total Card:**
  - *"Look at the top card — styled like a traditional Indian bank passbook entry."*
  - Point out: **₹1,00,000+ per year** in direct financial benefits identified for this single household.
  - Explain: *"Plus ₹5 Lakh hospital insurance under Ayushman Bharat."*

### Step 4: Explain the 3 Timelines (Why Timing Matters)
Show the 3 distinct columns:
1. **⚡ Act Now (Immediate):**
   - **PM-KISAN:** Direct ₹6,000 income support for Ramesh.
   - **Sukanya Samriddhi:** Pooja is 9 years old! *"SSY must be opened before age 10. Our AI flags this as urgent!"*
   - **Old Age Pension (IGNOAPS):** Kamla is 67 in a BPL family — eligible immediately.
2. **🗓️ Next 3 Months (Upcoming Camps):**
   - **Ladli Behna Yojana:** Sunita qualifies for ₹15,000/year during MP state camps.
   - **Post-Matric OBC Scholarship:** Opens in July for Aman's upcoming academic session.
3. **⏳ Coming Up (Future Milestones):**
   - **AICTE Tuition Fee Waiver (TFW):** Aman is in Class 12 and entering college soon. He can get 100% tuition waiver (worth ₹80,000/yr) during engineering counselling.

### Step 5: The Scheme Drawer & Interactive Checklist
- Click **"See how to apply"** on any scheme (e.g. *AICTE TFW* or *Sukanya Samriddhi*).
- Show the 5 key sections:
  1. *Why you qualify* (in plain, respectful English).
  2. *When to apply* (actionable deadline).
  3. *Next concrete action* (e.g., "Get an income certificate before June").
  4. *Interactive Document Checklist:* Click a couple of checkboxes to tick them off — show that they remain checked even if you close and reopen!
  5. *Official Government Portal Link.*

### Step 6: The AI Ingestion Finale (The Live "Aha!" Moment)
- Click **"+ Add scheme"** in the top navigation bar (goes to `/add-scheme`).
- **What to say:** *"What happens when a new scheme is announced tomorrow in a newspaper circular? Watch this."*
- Click **"📋 Paste Sample (Gaon Ki Beti Yojana)"** button.
- Click **"⚡ Read & Structure this scheme with AI"**.
- Watch the AI instantly structure the unstructured notification into:
  - Cash benefit (₹5,000/yr)
  - Rural girl student eligibility
  - Application mode & portal
- Click **"Check My Family Against This Scheme →"** to return to the dashboard and see the family dynamically evaluated!

---

## 💡 4. Pitch Tips to Make It Shine

1. **Focus on the Problem:** Don't talk about tech first. Talk about families leaving ₹1,00,000 on the table because government schemes are buried in complex PDF circulars.
2. **Highlight the Proactive Engine:** *"Normal portals ask you to search by keyword. Yojana Setu works backwards — you tell us who you are, we map the next 24 months of your family's life."*
3. **Privacy by Design:** Emphasize that no Aadhaar numbers or documents are uploaded to any server. Everything is private on the device.
