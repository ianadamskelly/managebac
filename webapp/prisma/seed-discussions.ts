import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const school = await db.school.findUniqueOrThrow({ where: { subdomain: "demo" } });
  const schoolId = school.id;

  if ((await db.discussion.count({ where: { schoolId } })) > 0) {
    console.log("Discussions already present — skipping.");
    return;
  }

  const bioB = await db.class.findFirst({
    where: { schoolId, externalId: "MYP9-BIO-B" },
    include: {
      memberships: { include: { user: true } },
    },
  });
  if (!bioB) throw new Error("MYP9-BIO-B not found");

  const teacher = bioB.memberships.find((m) => m.role === "TEACHER")?.user;
  const students = bioB.memberships.filter((m) => m.role === "STUDENT").map((m) => m.user);
  if (!teacher || students.length < 2) throw new Error("Need a teacher + students");

  const d1 = await db.discussion.create({
    data: {
      schoolId,
      classId: bioB.id,
      authorId: teacher.id,
      title: "Revision questions for the end-of-semester exam",
      body: "Post any questions about cell division, reproduction or genetics here and I'll answer before the exam. Let's help each other revise!",
    },
  });
  await db.discussionComment.create({
    data: {
      discussionId: d1.id,
      authorId: students[0].id,
      body: "Could you explain the difference between mitosis and meiosis one more time?",
    },
  });
  await db.discussionComment.create({
    data: {
      discussionId: d1.id,
      authorId: teacher.id,
      body: "Great question — mitosis produces two identical diploid cells for growth/repair; meiosis produces four genetically varied haploid gametes for reproduction. Review the diagram on page 42.",
    },
  });

  await db.discussion.create({
    data: {
      schoolId,
      classId: bioB.id,
      authorId: students[1].id,
      title: "Lab group for the transport systems investigation",
      body: "Looking for one more person to join our lab group for the transport systems practical. Reply if interested!",
    },
  });

  console.log("Seeded 2 discussions with replies in MYP9-BIO-B.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
