import { notFound } from "next/navigation";
import { getViewableReport, type ReportContent } from "@/lib/reports";
import { currentSchool } from "@/lib/tenant";
import { ReportCardView } from "./report-card-view";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewable = await getViewableReport(id);
  if (!viewable) notFound();
  const { report } = viewable;
  const school = await currentSchool();

  return (
    <ReportCardView
      content={report.content as ReportContent}
      title={report.title}
      preparedOn={report.preparedOn.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
      schoolName={school?.name ?? "School"}
      draft={!report.publishedAt}
    />
  );
}
