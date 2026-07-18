"use client";

import { useState, useTransition } from "react";
import { submitToDropbox } from "../../actions";

export function SubmitBox({
  classId,
  taskId,
  existing,
}: {
  classId: string;
  taskId: string;
  existing: { fileName: string; submittedAt: string; late: boolean } | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h2 className="font-semibold text-slate-800 mb-2">Your Submission</h2>
      {existing && (
        <p className="text-sm text-slate-600 mb-3">
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold mr-2 ${
              existing.late ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {existing.late ? "LATE" : "SUBMITTED"}
          </span>
          {existing.fileName} · {existing.submittedAt}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 mb-3 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}
      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            try {
              await submitToDropbox(classId, taskId, formData);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Upload failed");
            }
          });
        }}
        className="flex items-center gap-3"
      >
        <input type="file" name="file" required className="text-sm text-slate-600" />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2"
        >
          {pending ? "Uploading…" : existing ? "Replace File" : "Submit"}
        </button>
      </form>
      <p className="text-xs text-slate-400 mt-2">Max 20 MB. Re-uploading replaces your file.</p>
    </section>
  );
}
