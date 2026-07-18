"use client";

import { useState } from "react";
import { saveGoals } from "../actions";

export function GoalsEditor({
  yearGroupId,
  enrollmentId,
  learningGoal,
  productGoal,
  readOnly,
}: {
  yearGroupId: string;
  enrollmentId: string;
  learningGoal: string;
  productGoal: string;
  readOnly: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const [current, setCurrent] = useState({ learningGoal, productGoal });

  async function persist(next: { learningGoal: string; productGoal: string }) {
    if (next.learningGoal === current.learningGoal && next.productGoal === current.productGoal)
      return;
    setCurrent(next);
    await saveGoals(yearGroupId, enrollmentId, next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">Goals</h3>
        {saved && <span className="text-xs text-emerald-600">Saved</span>}
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Learning Goal</label>
          {readOnly ? (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {learningGoal || <span className="text-slate-400">Not set</span>}
            </p>
          ) : (
            <textarea
              defaultValue={learningGoal}
              rows={3}
              onBlur={(e) => persist({ ...current, learningGoal: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Product Goal</label>
          {readOnly ? (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {productGoal || <span className="text-slate-400">Not set</span>}
            </p>
          ) : (
            <textarea
              defaultValue={productGoal}
              rows={3}
              onBlur={(e) => persist({ ...current, productGoal: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      </div>
    </section>
  );
}
