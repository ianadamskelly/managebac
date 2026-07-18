// CAS (DP) / Service as Action (MYP) / Service Learning (PYP) domain constants.

export type ActivityProgramme = {
  /** Tab / page title, e.g. "CAS" */
  shortName: string;
  fullName: string;
  /** DP CAS strands; empty = no strand picker */
  strands: { key: string; label: string }[];
  outcomes: { key: string; label: string }[];
};

const CAS: ActivityProgramme = {
  shortName: "CAS",
  fullName: "Creativity, Activity & Service",
  strands: [
    { key: "creativity", label: "Creativity" },
    { key: "activity", label: "Activity" },
    { key: "service", label: "Service" },
  ],
  outcomes: [
    { key: "strengths", label: "Identify own strengths and develop areas for growth" },
    { key: "challenge", label: "Demonstrate that challenges have been undertaken, developing new skills" },
    { key: "initiate", label: "Demonstrate how to initiate and plan a CAS experience" },
    { key: "commitment", label: "Show commitment to and perseverance in CAS experiences" },
    { key: "collaboration", label: "Demonstrate the skills and recognise the benefits of working collaboratively" },
    { key: "global", label: "Demonstrate engagement with issues of global significance" },
    { key: "ethics", label: "Recognise and consider the ethics of choices and actions" },
  ],
};

const SA: ActivityProgramme = {
  shortName: "SA",
  fullName: "Service as Action",
  strands: [],
  outcomes: [
    { key: "awareness", label: "Become more aware of own strengths and areas for growth" },
    { key: "challenge", label: "Undertake challenges that develop new skills" },
    { key: "initiate", label: "Discuss, evaluate and plan student-initiated activities" },
    { key: "persevere", label: "Persevere in action" },
    { key: "collaboration", label: "Work collaboratively with others" },
    { key: "international", label: "Develop international-mindedness through global engagement" },
    { key: "ethics", label: "Consider the ethical implications of actions" },
  ],
};

const SL: ActivityProgramme = {
  shortName: "SL",
  fullName: "Service Learning",
  strands: [],
  outcomes: [
    { key: "awareness", label: "Grow awareness of self and others" },
    { key: "skills", label: "Develop new skills through action" },
    { key: "collaboration", label: "Work and learn together with others" },
    { key: "care", label: "Show care for the community and environment" },
  ],
};

export function activityProgramme(programmeCode: string): ActivityProgramme {
  if (programmeCode === "diploma") return CAS;
  if (programmeCode === "myp") return SA;
  return SL;
}

export const ACTIVITY_STATUSES = [
  { key: "PROPOSED", label: "Proposed", badge: "bg-amber-100 text-amber-800" },
  { key: "APPROVED", label: "Approved", badge: "bg-blue-100 text-blue-800" },
  { key: "COMPLETED", label: "Completed", badge: "bg-emerald-100 text-emerald-800" },
  { key: "REJECTED", label: "Rejected", badge: "bg-red-100 text-red-700" },
] as const;

export function statusBadge(status: string): { label: string; badge: string } {
  return (
    ACTIVITY_STATUSES.find((s) => s.key === status) ?? {
      label: status,
      badge: "bg-slate-100 text-slate-600",
    }
  );
}

// ManageBac-style progress buckets for the advisor roster
export function worksheetStatus(counts: {
  activities: number;
  completed: number;
  outcomes: number;
  reflections: number;
  totalOutcomes: number;
}): { label: string; badge: string } {
  if (counts.activities === 0)
    return { label: "To Be Determined", badge: "bg-slate-100 text-slate-600" };
  if (counts.completed >= 2 && counts.outcomes >= counts.totalOutcomes && counts.reflections >= 3)
    return { label: "Excellent", badge: "bg-emerald-100 text-emerald-800" };
  if (counts.reflections === 0)
    return { label: "Concern", badge: "bg-red-100 text-red-700" };
  return { label: "On-track", badge: "bg-blue-100 text-blue-800" };
}
