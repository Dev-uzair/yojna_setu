export function formatRupees(amount: number): string {
  return "₹" + new Intl.NumberFormat("en-IN").format(amount);
}

export function formatRelation(relation: string): string {
  const map: Record<string, string> = {
    self: "You (Head)",
    spouse: "Spouse",
    son: "Son",
    daughter: "Daughter",
    father: "Father",
    mother: "Mother",
    other: "Other Family Member",
  };
  return map[relation] || relation;
}

export function formatOccupation(occupation: string): string {
  const map: Record<string, string> = {
    student: "Student",
    farmer: "Farmer",
    salaried: "Salaried Job",
    self_employed: "Self-employed",
    daily_wage: "Daily Wage Earner",
    homemaker: "Homemaker",
    unemployed: "Unemployed",
  };
  return map[occupation] || occupation;
}

export function formatEducation(education: string): string {
  const map: Record<string, string> = {
    none: "No formal schooling",
    primary: "Primary school",
    class_10: "Class 10 passed",
    class_12: "Class 12 passed",
    graduate: "College Graduate",
  };
  return map[education] || education;
}
