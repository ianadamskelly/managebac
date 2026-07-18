"use client";

import { useRef } from "react";
import { addReflection } from "../actions";

export function ReflectionForm({
  yearGroupId,
  activityId,
}: {
  yearGroupId: string;
  activityId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = addReflection.bind(null, yearGroupId, activityId);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await action(fd);
        formRef.current?.reset();
      }}
      className="mt-3 flex items-start gap-2"
    >
      <textarea
        name="content"
        required
        rows={2}
        placeholder="Write a reflection…"
        className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2"
      >
        Add
      </button>
    </form>
  );
}
