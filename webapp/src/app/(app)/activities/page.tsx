import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

// Entry point for the nav link: students go straight to their own worksheet,
// staff go to the year-group list to pick a cohort.
export default async function ActivitiesEntryPage() {
  const session = (await getSession())!;

  if (session.role === "STUDENT") {
    const membership = await db.yearGroupMembership.findFirst({
      where: { userId: session.userId, role: "STUDENT", yearGroup: { archived: false } },
    });
    if (membership) {
      redirect(`/year-groups/${membership.yearGroupId}/activities/${session.userId}`);
    }
    redirect("/home");
  }
  redirect("/year-groups");
}
