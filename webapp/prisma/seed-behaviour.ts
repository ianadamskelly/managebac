import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const TYPES = [
  { title: "Excellent participation", positive: true, order: 1 },
  { title: "Helping others", positive: true, order: 2 },
  { title: "Academic improvement", positive: true, order: 3 },
  { title: "Late to class", positive: false, order: 4 },
  { title: "Missing homework", positive: false, order: 5 },
  { title: "Disruptive behaviour", positive: false, order: 6 },
];

async function main() {
  const school = await db.school.findUniqueOrThrow({ where: { subdomain: "demo" } });
  const schoolId = school.id;

  // Types (idempotent)
  const typeByTitle: Record<string, string> = {};
  for (const t of TYPES) {
    const row = await db.behaviourType.upsert({
      where: { schoolId_title: { schoolId, title: t.title } },
      update: { positive: t.positive, order: t.order },
      create: { schoolId, ...t },
    });
    typeByTitle[t.title] = row.id;
  }

  if ((await db.behaviourNote.count({ where: { schoolId } })) > 0) {
    console.log("Behaviour notes already present — types ensured, skipping sample notes.");
    return;
  }

  const teacher = await db.user.findFirst({ where: { schoolId, email: "t.homeroom9@demo.school" } });
  const admin = await db.user.findFirst({ where: { schoolId, role: "ADMIN" } });
  const author = teacher ?? admin;
  if (!author) throw new Error("No author found");

  // A few notes for the first couple of Grade 9 students (incl. Amina for parent demo)
  const amina = await db.user.findFirst({
    where: { schoolId, firstName: "Amina", lastName: "Abdi", role: "STUDENT" },
  });
  const others = await db.user.findMany({
    where: { schoolId, role: "STUDENT", gradeLevel: { name: "Grade 9" } },
    take: 3,
  });

  const sampleNotes = [
    {
      title: "Excellent participation",
      positive: true,
      note: "Led the group discussion in humanities and encouraged quieter peers to contribute.",
      nextStep: null,
      daysAgo: 12,
    },
    {
      title: "Missing homework",
      positive: false,
      note: "Did not submit the assigned reading response. Second occurrence this month.",
      nextStep: "Meet with homeroom advisor to agree a homework plan.",
      daysAgo: 5,
    },
    {
      title: "Academic improvement",
      positive: true,
      note: "Noticeable improvement in end-of-unit assessment results this term.",
      nextStep: null,
      daysAgo: 2,
    },
  ];

  const targets = [amina, ...others].filter(Boolean).slice(0, 3) as { id: string }[];
  let created = 0;
  for (let i = 0; i < targets.length; i++) {
    const s = sampleNotes[i % sampleNotes.length];
    await db.behaviourNote.create({
      data: {
        schoolId,
        studentId: targets[i].id,
        typeId: typeByTitle[s.title],
        title: s.title,
        positive: s.positive,
        note: s.note,
        nextStep: s.nextStep,
        authorId: author.id,
        incidentOn: new Date(Date.now() - s.daysAgo * 24 * 60 * 60 * 1000),
      },
    });
    created++;
  }
  // Give Amina an extra positive note so the parent demo shows two.
  if (amina) {
    await db.behaviourNote.create({
      data: {
        schoolId,
        studentId: amina.id,
        typeId: typeByTitle["Helping others"],
        title: "Helping others",
        positive: true,
        note: "Volunteered to tutor a classmate struggling with algebra.",
        authorId: author.id,
        incidentOn: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    });
    created++;
  }

  console.log(`Seeded ${TYPES.length} behaviour types and ${created} sample notes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
