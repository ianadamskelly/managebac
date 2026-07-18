import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getYearGroupContext } from "@/lib/year-group-access";
import { YgCommentForm } from "./comment-form";

export default async function YgDiscussionThreadPage({
  params,
}: {
  params: Promise<{ id: string; discussionId: string }>;
}) {
  const { id, discussionId } = await params;
  const { yg } = await getYearGroupContext(id);

  const discussion = await db.discussion.findFirst({
    where: { id: discussionId, yearGroupId: yg.id },
    include: {
      author: true,
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!discussion) notFound();

  return (
    <div className="space-y-4">
      <Link href={`/year-groups/${yg.id}/discussions`} className="text-sm text-blue-600 hover:underline">
        ← All Discussions
      </Link>

      <article className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h1 className="text-lg font-semibold text-slate-900">{discussion.title}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {discussion.author.firstName} {discussion.author.lastName} ·{" "}
          {discussion.createdAt.toLocaleString()}
        </p>
        <p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap">{discussion.body}</p>
      </article>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <header className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Replies ({discussion.comments.length})</h2>
        </header>
        <ul className="divide-y divide-slate-100">
          {discussion.comments.map((c) => (
            <li key={c.id} className="px-5 py-3">
              <p className="text-xs text-slate-500 mb-1">
                {c.author.firstName} {c.author.lastName} · {c.createdAt.toLocaleString()}
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
          {discussion.comments.length === 0 && (
            <li className="px-5 py-6 text-sm text-slate-500 text-center">No replies yet.</li>
          )}
        </ul>
        <div className="px-5 py-4 border-t border-slate-100">
          <YgCommentForm yearGroupId={yg.id} discussionId={discussion.id} />
        </div>
      </section>
    </div>
  );
}
