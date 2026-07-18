"use client";

import { useState, useTransition } from "react";
import { deleteTask } from "../../actions";

export function DeleteTaskButton({ classId, taskId }: { classId: string; taskId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">Delete?</span>
        <button
          disabled={pending}
          onClick={() => startTransition(() => deleteTask(classId, taskId))}
          className="text-red-600 hover:underline font-medium disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-slate-500 hover:underline"
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-sm text-slate-400 hover:text-red-600">
      Delete
    </button>
  );
}
