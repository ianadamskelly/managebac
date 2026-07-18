"use client";

import { useTransition } from "react";
import { deleteBehaviourType } from "./actions";

export function DeleteTypeButton({ typeId }: { typeId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => deleteBehaviourType(typeId))}
      className="text-xs text-slate-400 hover:text-red-600 disabled:opacity-60"
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}
