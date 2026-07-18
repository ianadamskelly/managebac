import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { addBehaviourType } from "./actions";
import { DeleteTypeButton } from "./delete-type-button";

export default async function BehaviourSettingsPage() {
  const session = (await getSession())!;
  if (session.role !== "ADMIN") redirect("/home");

  const types = await db.behaviourType.findMany({
    where: { schoolId: session.schoolId },
    orderBy: [{ positive: "desc" }, { title: "asc" }],
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/settings" className="text-sm text-blue-600 hover:underline">
          ← Settings
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-2">Behaviour Types</h1>
        <p className="text-sm text-slate-500">
          Define the behaviour taxonomy staff use when adding notes to student profiles.
        </p>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {types.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500 text-center">No behaviour types yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {types.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-5 py-3">
                <span className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      t.positive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {t.positive ? "Positive" : "Needs attention"}
                  </span>
                  <span className="text-sm text-slate-800">{t.title}</span>
                </span>
                <DeleteTypeButton typeId={t.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <form
        action={addBehaviourType}
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3"
      >
        <h2 className="font-semibold text-slate-800">Add Type</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
          <input
            name="title"
            required
            maxLength={100}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="positive" className="rounded" />
          Positive behaviour
        </label>
        <button
          type="submit"
          className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2"
        >
          Add Type
        </button>
      </form>
    </div>
  );
}
