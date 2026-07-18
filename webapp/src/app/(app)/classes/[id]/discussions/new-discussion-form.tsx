"use client";

import { useState } from "react";
import { createDiscussion } from "./actions";

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export function NewDiscussionForm({ classId }: { classId: string }) {
  const [open, setOpen] = useState(false);
  const action = createDiscussion.bind(null, classId);

  if (!open) {
    return (
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2"
        >
          New Discussion
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
      <h2 className="font-semibold text-slate-800">New Discussion</h2>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
        <input name="title" required maxLength={200} className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
        <textarea name="body" required rows={4} maxLength={20000} className={inputCls} />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2"
        >
          Post Discussion
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
