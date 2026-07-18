// PBL project domain constants (Personal Project, Extended Essay, etc.).

export const PROJECT_TYPE_LABELS: Record<string, string> = {
  PERSONAL_PROJECT: "Personal Project",
  COMMUNITY_PROJECT: "Community Project",
  EXTENDED_ESSAY: "Extended Essay",
  TOK_ESSAY: "Theory of Knowledge Essay",
  EXHIBITION: "Exhibition",
};

// Criterion labels + max levels per project type (from the IB guides).
const PROJECT_CRITERIA: Record<
  string,
  { criteria: Record<string, string>; max: number }
> = {
  PERSONAL_PROJECT: {
    criteria: { A: "Planning", B: "Applying skills", C: "Reflecting" },
    max: 8,
  },
  COMMUNITY_PROJECT: {
    criteria: { A: "Investigating", B: "Planning", C: "Taking action", D: "Reflecting" },
    max: 8,
  },
  EXTENDED_ESSAY: {
    criteria: {
      A: "Focus and method",
      B: "Knowledge and understanding",
      C: "Critical thinking",
      D: "Presentation",
      E: "Engagement",
    },
    max: 6,
  },
  TOK_ESSAY: {
    criteria: { A: "Clear, coherent and critical exploration" },
    max: 10,
  },
  EXHIBITION: {
    criteria: { A: "Exhibition" },
    max: 10,
  },
};

export function projectCriterionLabel(type: string, criterion: string): string {
  return PROJECT_CRITERIA[type]?.criteria[criterion] ?? `Criterion ${criterion}`;
}

export function projectCriterionMax(type: string): number {
  return PROJECT_CRITERIA[type]?.max ?? 8;
}

export function defaultProjectCriteria(type: string): string[] {
  return Object.keys(PROJECT_CRITERIA[type]?.criteria ?? { A: "" });
}

export const PROJECT_STATUSES = [
  { key: "NOT_STARTED", label: "Not Started", badge: "bg-slate-100 text-slate-600" },
  { key: "IN_PROGRESS", label: "In Progress", badge: "bg-blue-100 text-blue-800" },
  { key: "SUBMITTED", label: "Submitted", badge: "bg-amber-100 text-amber-800" },
  { key: "COMPLETED", label: "Completed", badge: "bg-emerald-100 text-emerald-800" },
] as const;

export function projectStatusBadge(status: string): { label: string; badge: string } {
  return (
    PROJECT_STATUSES.find((s) => s.key === status) ?? {
      label: status,
      badge: "bg-slate-100 text-slate-600",
    }
  );
}
