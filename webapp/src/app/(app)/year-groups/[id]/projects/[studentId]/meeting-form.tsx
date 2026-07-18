"use client";

import { useRef, useState } from "react";
import { addMeeting } from "../actions";

export function MeetingForm({
  yearGroupId,
  enrollmentId,
}: {
  yearGroupId: string;
  enrollmentId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const action = addMeeting.bind(null, yearGroupId, enrollmentId);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-slate-300 text-slate-600 text-sm font-medium px-3 py-1.5 hover:bg-slate-50"
      >
        Log Meeting
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
      className="space-y-2 border border-slate-200 rounded-lg p-3"
    >
      <input
        name="meetingDate"
        type="date"
        required
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <textarea
        name="notes"
        required
        rows={3}
        placeholder="Meeting notes…"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5"
        >
          Save Meeting
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 text-slate-600 text-sm font-medium px-3 py-1.5 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
