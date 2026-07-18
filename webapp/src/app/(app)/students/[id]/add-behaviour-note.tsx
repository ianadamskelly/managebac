"use client";

import { useRef, useState } from "react";
import { addBehaviourNote } from "./actions";

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export function AddBehaviourNote({
  studentId,
  types,
}: {
  studentId: string;
  types: { id: string; title: string; positive: boolean }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const action = addBehaviourNote.bind(null, studentId);
  const today = new Date().toISOString().slice(0, 10);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2"
      >
        Add Behaviour Note
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await action(fd);
        formRef.current?.reset();
        setOpen(false);
      }}
      className="border border-slate-200 rounded-lg p-4 space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
          <select name="typeId" className={inputCls} defaultValue="">
            <option value="">— No type —</option>
            <optgroup label="Positive">
              {types.filter((t) => t.positive).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </optgroup>
            <optgroup label="Needs attention">
              {types.filter((t) => !t.positive).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
          <input name="incidentOn" type="date" defaultValue={today} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
        <textarea name="note" required rows={3} maxLength={5000} className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Next step (optional)</label>
        <input name="nextStep" maxLength={2000} className={inputCls} />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2"
        >
          Save Note
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
