import Link from "next/link";
import { db } from "@/lib/db";
import { getYearGroupContext } from "@/lib/year-group-access";
import { NewYgDiscussionForm } from "./new-discussion-form";

export default async function YgDiscussionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { yg } = await getYearGroupContext(id);

  const discussions = await db.discussion.findMany({
    where: { yearGroupId: yg.id },
    include: { author: true, _count: { select: { comments: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <NewYgDiscussionForm yearGroupId={yg.id} />

      {discussions.length === 0 ? (
        <p className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-8 text-sm text-slate-500 text-center">
          No discussions yet. Start the first thread above.
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {discussions.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/year-groups/${yg.id}/discussions/${d.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{d.title}</p>
                    <p className="text-xs text-slate-500">
                      {d.author.firstName} {d.author.lastName} · {d.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">
                    {d._count.comments} {d._count.comments === 1 ? "reply" : "replies"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
