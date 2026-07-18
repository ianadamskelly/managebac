import { mypFinalGrade } from "./myp";

// Map an MYP final grade (1–7) to an achievement bucket.
export function achievementBucket(finalGrade: number): "concern" | "onTrack" | "excellent" {
  if (finalGrade <= 3) return "concern";
  if (finalGrade <= 5) return "onTrack";
  return "excellent";
}

export function finalFromCriteria(
  criteriaLevels: Record<string, number> | null,
  storedFinal: number | null
): number | null {
  if (storedFinal != null) return storedFinal;
  if (criteriaLevels && Object.keys(criteriaLevels).length === 4) {
    return mypFinalGrade(Object.values(criteriaLevels).reduce((a, b) => a + b, 0));
  }
  return null;
}

// Engagement bucket from submission completion rate and login recency.
export function engagementBucket(opts: {
  totalTasks: number;
  submitted: number;
  lastAccessAt: Date | null;
}): { key: string; label: string; badge: string } {
  const { totalTasks, submitted, lastAccessAt } = opts;
  const daysSinceLogin = lastAccessAt
    ? (Date.now() - lastAccessAt.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;
  const rate = totalTasks > 0 ? submitted / totalTasks : null;

  // No engagement signal at all
  if ((rate === null || rate === 0) && daysSinceLogin > 30) {
    return { key: "not", label: "Not Engaged", badge: "bg-red-100 text-red-700" };
  }
  if (rate !== null && rate < 0.5) {
    return { key: "risk", label: "At-Risk", badge: "bg-amber-100 text-amber-800" };
  }
  if (rate !== null && rate <= 0.85) {
    return { key: "ontrack", label: "On-Track", badge: "bg-blue-100 text-blue-800" };
  }
  if (rate !== null && rate > 0.85) {
    return { key: "high", label: "Highly Engaged", badge: "bg-emerald-100 text-emerald-800" };
  }
  // No tasks planned but has logged in recently
  return { key: "ontrack", label: "On-Track", badge: "bg-blue-100 text-blue-800" };
}
