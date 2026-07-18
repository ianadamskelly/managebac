"use client";

import { useState } from "react";
import type { UnitSectionGroup } from "@/lib/units";
import { saveUnitSection } from "../actions";

export function UnitPlanner({
  classId,
  unitId,
  template,
  initialSections,
  readOnly,
}: {
  classId: string;
  unitId: string;
  template: UnitSectionGroup[];
  initialSections: Record<string, string>;
  readOnly: boolean;
}) {
  const [sections, setSections] = useState(initialSections);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  async function persist(key: string, content: string) {
    if ((sections[key] ?? "") === content) return;
    setSections((s) => ({ ...s, [key]: content }));
    setSavingKey(key);
    try {
      await saveUnitSection(classId, unitId, key, content);
      setSavedKey(key);
      setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 1500);
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      {!readOnly && (
        <p className="text-xs text-slate-400">
          Auto-save: sections are saved when you click away.{" "}
          {savingKey ? "Saving…" : savedKey ? "Saved." : ""}
        </p>
      )}
      {template.map((group) => {
        const visible = readOnly
          ? group.sections.filter((s) => (sections[s.key] ?? "").trim() !== "")
          : group.sections;
        if (visible.length === 0) return null;
        return (
          <section key={group.title} className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <header className="px-5 py-3 border-b border-slate-100 bg-slate-50 rounded-t-xl">
              <h3 className="font-semibold text-slate-700 uppercase text-xs tracking-wide">
                {group.title}
              </h3>
            </header>
            <div className="p-5 space-y-5">
              {visible.map((s) => (
                <div key={s.key}>
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    {s.title}
                    {savedKey === s.key && (
                      <span className="ml-2 text-xs text-emerald-600">Saved</span>
                    )}
                  </label>
                  {s.hint && !readOnly && (
                    <p className="text-xs text-slate-400 mb-1">{s.hint}</p>
                  )}
                  {readOnly ? (
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {sections[s.key]}
                    </p>
                  ) : (
                    <textarea
                      defaultValue={sections[s.key] ?? ""}
                      rows={Math.max(2, Math.min(8, (sections[s.key] ?? "").split("\n").length + 1))}
                      onBlur={(e) => persist(s.key, e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
