"use client";

import { useRef } from "react";
import { addYgComment } from "../actions";

export function YgCommentForm({
  yearGroupId,
  discussionId,
}: {
  yearGroupId: string;
  discussionId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = addYgComment.bind(null, yearGroupId, discussionId);
  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await action(fd);
        formRef.current?.reset();
      }}
      className="flex items-start gap-2"
    >
      <textarea
        name="body"
        required
        rows={2}
        placeholder="Write a reply…"
        className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2"
      >
        Reply
      </button>
    </form>
  );
}
