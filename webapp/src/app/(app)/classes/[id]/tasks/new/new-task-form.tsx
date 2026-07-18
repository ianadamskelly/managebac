"use client";

import { useState } from "react";

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

export type TaskFormInitial = {
  title: string;
  type: string;
  categoryId: string | null;
  model: string;
  maxPoints: number | null;
  criteria: string[];
  unitId: string | null;
  dueAt: string; // datetime-local value: YYYY-MM-DDTHH:mm
  description: string;
  dropboxEnabled: boolean;
};

export function NewTaskForm({
  action,
  categories,
  units,
  isMyp,
  initial,
  submitLabel = "Create Task",
}: {
  action: (formData: FormData) => Promise<void>;
  categories: { id: string; name: string }[];
  units: { id: string; title: string }[];
  isMyp: boolean;
  initial?: TaskFormInitial;
  submitLabel?: string;
}) {
  const [model, setModel] = useState(initial?.model ?? "POINTS");
  const criteria = initial?.criteria ?? [];

  return (
    <form action={action} className="space-y-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div>
        <label className={labelCls}>
          Title <span className="text-red-500">*</span>
        </label>
        <input name="title" required maxLength={200} defaultValue={initial?.title} className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Type</label>
          <select name="type" className={inputCls} defaultValue={initial?.type ?? "SUMMATIVE"}>
            <option value="SUMMATIVE">Summative</option>
            <option value="FORMATIVE">Formative</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <select name="categoryId" className={inputCls} defaultValue={initial?.categoryId ?? ""}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Assessment model</label>
          <select
            name="model"
            className={inputCls}
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="POINTS">Points</option>
            {isMyp && <option value="CRITERIA">Criteria (MYP)</option>}
            <option value="BINARY">Binary (Complete / Incomplete)</option>
            <option value="OBSERVATION">Observation (Comments only)</option>
          </select>
        </div>
        {model === "POINTS" && (
          <div>
            <label className={labelCls}>Max points</label>
            <input
              name="maxPoints"
              type="number"
              min={1}
              max={1000}
              defaultValue={initial?.maxPoints ?? 100}
              className={inputCls}
            />
          </div>
        )}
      </div>

      {isMyp && (model === "POINTS" || model === "CRITERIA") && (
        <div>
          <label className={labelCls}>MYP criteria assessed</label>
          <div className="flex gap-4">
            {(["A", "B", "C", "D"] as const).map((c) => (
              <label key={c} className="flex items-center gap-1.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="criteria"
                  value={c}
                  defaultChecked={criteria.includes(c)}
                  className="rounded"
                />
                Criterion {c}
              </label>
            ))}
          </div>
        </div>
      )}

      {units.length > 0 && (
        <div>
          <label className={labelCls}>Unit</label>
          <select name="unitId" className={inputCls} defaultValue={initial?.unitId ?? ""}>
            <option value="">Not linked to a unit</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={labelCls}>
          Due date <span className="text-red-500">*</span>
        </label>
        <input
          name="dueAt"
          type="datetime-local"
          required
          defaultValue={initial?.dueAt}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea
          name="description"
          rows={4}
          maxLength={5000}
          defaultValue={initial?.description}
          className={inputCls}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="dropboxEnabled"
          defaultChecked={initial ? initial.dropboxEnabled : true}
          className="rounded"
        />
        Enable Dropbox (students submit files)
      </label>

      <button
        type="submit"
        className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2"
      >
        {submitLabel}
      </button>
    </form>
  );
}
