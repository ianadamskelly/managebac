"use client";

import { useTransition } from "react";
import { updateProjectStatus } from "../actions";
import { PROJECT_STATUSES } from "@/lib/projects";

export function StatusSelect({
  yearGroupId,
  enrollmentId,
  current,
}: {
  yearGroupId: string;
  enrollmentId: string;
  current: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      value={current}
      disabled={pending}
      onChange={(e) =>
        startTransition(() =>
          updateProjectStatus(
            yearGroupId,
            enrollmentId,
            e.target.value as "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "COMPLETED"
          )
        )
      }
      className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium disabled:opacity-60"
    >
      {PROJECT_STATUSES.map((s) => (
        <option key={s.key} value={s.key}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
