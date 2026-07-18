import { PrismaClient } from "@prisma/client";
import { mypFinalGrade } from "../src/lib/myp";

const db = new PrismaClient();

const COMMENTS = [
  "has made strong progress this term, engaging consistently with challenging material.",
  "shows solid understanding and should focus on extending analytical depth next term.",
  "is developing well; more consistent completion of formative work will help further.",
  "has demonstrated excellent commitment and collaboration throughout the term.",
  "is encouraged to seek feedback earlier in the drafting process to lift achievement.",
];

async function main() {
  const school = await db.school.findUniqueOrThrow({ where: { subdomain: "demo" } });
  const schoolId = school.id;

  const s1 = await db.term.findFirst({
    where: {
      name: "Semester 1",
      academicYear: { schoolId, isCurrent: true, programme: { code: "myp" } },
    },
  });
  if (!s1) throw new Error("MYP Semester 1 term not found");

  const classes = await db.class.findMany({
    where: { schoolId, externalId: { startsWith: "MYP9" } },
    include: {
      subject: true,
      memberships: { where: { role: "STUDENT" } },
    },
  });

  let created = 0;
  for (const c of classes) {
    for (let i = 0; i < c.memberships.length; i++) {
      const studentId = c.memberships[i].userId;
      const exists = await db.termGrade.findUnique({
        where: { classId_termId_studentId: { classId: c.id, termId: s1.id, studentId } },
      });
      if (exists) continue;

      // Deterministic spread of criteria levels 3..8
      const base = 3 + ((i * 7 + c.subject.name.length) % 6);
      const levels: Record<string, number> = {
        A: Math.min(8, base),
        B: Math.min(8, base + 1),
        C: Math.min(8, Math.max(0, base - 1)),
        D: Math.min(8, base),
      };
      const sum = Object.values(levels).reduce((a, b) => a + b, 0);
      await db.termGrade.create({
        data: {
          classId: c.id,
          termId: s1.id,
          studentId,
          criteriaLevels: levels,
          finalGrade: mypFinalGrade(sum),
          atl: { Communication: "Meeting", "Self-Management": "Approaching" },
          comment: `${c.subject.name}: The student ${COMMENTS[i % COMMENTS.length]}`,
        },
      });
      created++;
    }
  }
  console.log(`Seeded ${created} Semester 1 term grades across ${classes.length} Grade 9 classes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
