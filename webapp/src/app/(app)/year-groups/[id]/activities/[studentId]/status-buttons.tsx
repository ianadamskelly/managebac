"use client";

import { useTransition } from "react";
import { updateActivityStatus } from "../actions";

const NEXT: Record<string, { to: "APPROVED" | "COMPLETED" | "REJECTED"; label: string; cls: string }[]> = {
  PROPOSED: [
    { to: "APPROVED", label: "Approve", cls: "bg-blue-600 hover:bg-blue-700 text-white" },
    { to: "REJECTED", label: "Reject", cls: "border border-red-300 text-red-600 hover:bg-red-50" },
  ],
  APPROVED: [
    { to: "COMPLETED", label: "Mark Complete", cls: "bg-emerald-600 hover:bg-emerald-700 text-white" },
  ],
  REJECTED: [
    { to: "APPROVED", label: "Approve", cls: "bg-blue-600 hover:bg-blue-700 text-white" },
  ],
  COMPLETED: [],
};

export function StatusButtons({
  yearGroupId,
  activityId,
  current,
}: {
  yearGroupId: string;
  activityId: string;
  current: string;
}) {
  const [pending, startTransition] = useTransition();
  const options = NEXT[current] ?? [];
  if (options.length === 0) return null;

  return (
    <div className="flex gap-2 shrink-0">
      {options.map((o) => (
        <button
          key={o.to}
          disabled={pending}
          onClick={() =>
            startTransition(() => updateActivityStatus(yearGroupId, activityId, o.to))
          }
          className={`rounded-md text-xs font-medium px-3 py-1.5 disabled:opacity-60 ${o.cls}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
