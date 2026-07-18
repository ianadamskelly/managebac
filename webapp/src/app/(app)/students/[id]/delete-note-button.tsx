"use client";

import { useTransition } from "react";
import { deleteBehaviourNote } from "./actions";

export function DeleteNoteButton({
  studentId,
  noteId,
}: {
  studentId: string;
  noteId: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => deleteBehaviourNote(studentId, noteId))}
      className="text-xs text-slate-400 hover:text-red-600 disabled:opacity-60"
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}
