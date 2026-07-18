"use client";

import { useMemo, useState } from "react";
import { generateReports } from "./actions";

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

export function GenerateForm({
  yearGroups,
  terms,
}: {
  yearGroups: { id: string; name: string; programmeId: string }[];
  terms: { id: string; programmeId: string; label: string }[];
}) {
  const [ygId, setYgId] = useState(yearGroups[0]?.id ?? "");
  const selectedYg = yearGroups.find((y) => y.id === ygId);
  // Only show terms for the selected year group's programme.
  const termOptions = useMemo(
    () => terms.filter((t) => t.programmeId === selectedYg?.programmeId),
    [terms, selectedYg]
  );
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={generateReports}
      className="space-y-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5 max-w-2xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Year Group</label>
          <select
            name="yearGroupId"
            value={ygId}
            onChange={(e) => setYgId(e.target.value)}
            className={inputCls}
          >
            {yearGroups.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Academic Term</label>
          <select name="termId" className={inputCls} key={ygId}>
            {termOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Report Title</label>
          <input
            name="title"
            required
            defaultValue="Semester Report"
            maxLength={200}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Preparation Date</label>
          <input name="preparedOn" type="date" defaultValue={today} className={inputCls} />
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Generates a report card for every student in the year group, snapshotting their
        current term grades. Reports start as drafts &mdash; publish them from Reports History.
      </p>
      <button
        type="submit"
        className="rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2"
      >
        Generate Reports
      </button>
    </form>
  );
}
