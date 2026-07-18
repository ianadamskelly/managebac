"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentSchool } from "@/lib/tenant";
import { createSession } from "@/lib/session";

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Please enter a valid e-mail and password." };

  const school = await currentSchool();
  if (!school) return { error: "School not found. Run the database seed first." };

  const user = await db.user.findUnique({
    where: { schoolId_email: { schoolId: school.id, email: parsed.data.email } },
  });
  if (!user || !user.passwordHash || user.archived) {
    return { error: "Invalid login or password." };
  }
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return { error: "Invalid login or password." };

  await db.user.update({ where: { id: user.id }, data: { lastAccessAt: new Date() } });
  await createSession({
    userId: user.id,
    schoolId: school.id,
    role: user.role,
    name: `${user.firstName} ${user.lastName}`,
  });
  redirect("/home");
}
