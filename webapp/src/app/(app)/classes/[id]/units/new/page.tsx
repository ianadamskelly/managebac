import { notFound } from "next/navigation";
import { getClassContext } from "@/lib/class-access";
import { createUnit } from "../actions";

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

export default async function NewUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { cls, canManage } = await getClassContext(id);
  if (!canManage) notFound();
  const action = createUnit.bind(null, cls.id);

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Add Unit</h2>
      <form action={action} className="space-y-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div>
          <label className={labelCls}>
            Unit title <span className="text-red-500">*</span>
          </label>
          <input name="title" required maxLength={200} className={inputCls} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Start date</label>
            <input name="startsOn" type="date" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Duration (weeks)</label>
            <input name="durationWeeks" type="number" min={1} max={52} defaultValue={6} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select name="status" defaultValue="ACTIVE" className={inputCls}>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea name="description" rows={4} maxLength={5000} className={inputCls} />
        </div>
        <button
          type="submit"
          className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2"
        >
          Create Unit
        </button>
      </form>
    </div>
  );
}
