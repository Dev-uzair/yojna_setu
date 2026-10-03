export type Member = {
  id: string;
  relation: "self" | "spouse" | "son" | "daughter" | "father" | "mother" | "other";
  name: string;             // UI only, never sent to Gemini
  age: number;
  gender: "male" | "female";
  maritalStatus: "single" | "married" | "widowed";
  education: "none" | "primary" | "class_10" | "class_12" | "graduate";
  occupation: "student" | "farmer" | "salaried" | "self_employed" | "daily_wage" | "homemaker" | "unemployed";
  currentCourse?: string;   // e.g. "Class 12"
};

export type Household = {
  state: string;            // default "Madhya Pradesh"
  area: "rural" | "urban";
  category: "general" | "ews" | "obc" | "sc" | "st";
  annualIncome: number;     // rupees per year
  ownsFarmland: boolean;
  rationCard: "none" | "apl" | "bpl";
  members: Member[];
};

export type Scheme = {
  id: string;
  name: string;
  level: "central" | "state";
  state?: string;
  summary: string;
  benefit: string;
  annualValue: number;      // rupees per beneficiary per year, 0 if not cash
  beneficiaryType: "individual" | "household";
  eligibility: string;
  documents: string[];
  howToApply: string;       // e.g. "Online at pmkisan.gov.in" or "At gram panchayat"
  timing: string;           // e.g. "Always open", "During MP DTE counselling after Class 12"
  sourceUrl: string;
};

export type Match = {
  schemeId: string;
  memberId: string | null;  // null for household schemes
  window: "now" | "soon" | "later";
  whenText: string;
  whyEligible: string;
  nextStep: string;
};

export type MatchResult = {
  matches: (Match & { scheme: Scheme })[];
  totalAnnualValue: number;
};
