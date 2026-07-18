"use client";

import { useState } from "react";
import { createActivity } from "../actions";

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

export function AddActivityForm({
  yearGroupId,
  studentId,
  strands,
  outcomes,
}: {
  yearGroupId: string;
  studentId: string;
  strands: { key: string; label: string }[];
  outcomes: { key: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const action = createActivity.bind(null, yearGroupId, studentId);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2"
      >
        Add Experience
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="font-semibold text-slate-800">New Experience</h3>
      <div>
        <label className={labelCls}>
          Name <span className="text-red-500">*</span>
        </label>
        <input name="name" required maxLength={200} className={inputCls} />
      </div>

      {strands.length > 0 && (
        <div>
          <label className={labelCls}>Strands</label>
          <div className="flex gap-4">
            {strands.map((s) => (
              <label key={s.key} className="flex items-center gap-1.5 text-sm text-slate-700">
                <input type="checkbox" name="categories" value={s.key} className="rounded" />
                {s.label}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Start date</label>
          <input name="startsOn" type="date" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>End date</label>
          <input name="endsOn" type="date" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Hours</label>
          <input name="hours" type="number" min={0} step={0.5} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Supervisor name</label>
          <input name="supervisorName" maxLength={200} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Supervisor e-mail</label>
          <input name="supervisorEmail" type="email" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea name="description" rows={3} maxLength={5000} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Learning outcomes</label>
        <div className="space-y-1.5">
          {outcomes.map((o) => (
            <label key={o.key} className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" name="outcomes" value={o.key} className="rounded mt-0.5" />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2"
        >
          Add Experience
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
