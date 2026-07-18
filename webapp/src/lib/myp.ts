// MYP assessment constants and conversions.

export const MYP_CRITERIA = ["A", "B", "C", "D"] as const;
export type MypCriterion = (typeof MYP_CRITERIA)[number];

// Generic criterion labels; per-subject-group labels (from the IB guides) for the
// subject groups we seed. Fallback is the generic label.
const CRITERION_LABELS: Record<string, Record<MypCriterion, string>> = {
  Sciences: {
    A: "Knowing and understanding",
    B: "Inquiring and designing",
    C: "Processing and evaluating",
    D: "Reflecting on the impacts of science",
  },
  "Language and Literature": {
    A: "Analysing",
    B: "Organizing",
    C: "Producing text",
    D: "Using language",
  },
  Mathematics: {
    A: "Knowing and understanding",
    B: "Investigating patterns",
    C: "Communicating",
    D: "Applying mathematics in real-life contexts",
  },
  "Individuals and Societies": {
    A: "Knowing and understanding",
    B: "Investigating",
    C: "Communicating",
    D: "Thinking critically",
  },
};

export function criterionLabel(subjectGroup: string, criterion: string): string {
  return CRITERION_LABELS[subjectGroup]?.[criterion as MypCriterion] ?? `Criterion ${criterion}`;
}

// IB MYP published grade boundaries: criteria sum (0–32) → final grade 1–7
export function mypFinalGrade(sum: number): number {
  if (sum >= 28) return 7;
  if (sum >= 24) return 6;
  if (sum >= 19) return 5;
  if (sum >= 15) return 4;
  if (sum >= 10) return 3;
  if (sum >= 6) return 2;
  return 1;
}

// Local equivalents as configured in Settings > Final Grades
const LOCAL_EQUIVALENTS: Record<number, string> = {
  7: "A+",
  6: "A",
  5: "B+",
  4: "B",
  3: "C",
  2: "D",
  1: "E",
};

export function localEquivalent(finalGrade: number): string {
  return LOCAL_EQUIVALENTS[finalGrade] ?? "—";
}

export const ATL_SKILLS = [
  "Communication",
  "Social",
  "Self-Management",
  "Research",
  "Thinking",
] as const;

export const ATL_RATINGS = ["Exceeding", "Meeting", "Approaching", "Below"] as const;
