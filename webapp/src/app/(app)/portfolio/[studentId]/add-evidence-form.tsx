"use client";

import { useState, useTransition } from "react";
import { addPortfolioEntry } from "../actions";

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

export function AddEvidenceForm({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("NOTE");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const action = addPortfolioEntry.bind(null, studentId);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2"
      >
        Add Evidence of Learning
      </button>
    );
  }

  const isFile = type === "FILE" || type === "PHOTO";

  return (
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          try {
            await action(fd);
            setOpen(false);
            setType("NOTE");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to add");
          }
        });
      }}
      className="space-y-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5"
    >
      <h3 className="font-semibold text-slate-800">Add Evidence of Learning</h3>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Type</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputCls}
          >
            <option value="NOTE">Note</option>
            <option value="WEBSITE">Website</option>
            <option value="FILE">File</option>
            <option value="PHOTO">Photo</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>
            Title <span className="text-red-500">*</span>
          </label>
          <input name="title" required maxLength={200} className={inputCls} />
        </div>
      </div>

      {type === "WEBSITE" && (
        <div>
          <label className={labelCls}>URL</label>
          <input name="url" type="url" placeholder="https://…" className={inputCls} />
        </div>
      )}

      {isFile && (
        <div>
          <label className={labelCls}>File</label>
          <input name="file" type="file" required className="text-sm text-slate-600" />
        </div>
      )}

      {(type === "NOTE" || type === "PHOTO" || type === "WEBSITE") && (
        <div>
          <label className={labelCls}>{type === "NOTE" ? "Note" : "Caption"}</label>
          <textarea name="content" rows={3} maxLength={20000} className={inputCls} />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2"
        >
          {pending ? "Adding…" : "Add"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 text-slate-600 text-sm font-medium px-4 py-2 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
