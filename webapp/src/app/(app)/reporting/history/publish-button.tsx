"use client";

import { useTransition } from "react";
import { setBatchPublished } from "../actions";

export function PublishButton({
  yearGroupId,
  termId,
  title,
  publish,
}: {
  yearGroupId: string;
  termId: string;
  title: string;
  publish: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(() => setBatchPublished(yearGroupId, termId, title, publish))
      }
      className={`rounded-md text-xs font-medium px-3 py-1.5 disabled:opacity-60 ${
        publish
          ? "bg-blue-600 hover:bg-blue-700 text-white"
          : "border border-slate-300 text-slate-600 hover:bg-slate-50"
      }`}
    >
      {pending ? "…" : publish ? "Publish" : "Unpublish"}
    </button>
  );
}
