import { headers } from "next/headers";
import { db } from "./db";

/**
 * Resolve the current school (tenant) from the request host.
 * demo.localhost:3000 → subdomain "demo"; plain localhost falls back to "demo"
 * so local development works without DNS setup.
 */
export async function currentSchool() {
  const host = (await headers()).get("host") ?? "";
  const hostname = host.split(":")[0];
  const parts = hostname.split(".");
  let subdomain = "demo";
  if (parts.length > 1 && parts[0] !== "www" && parts[0] !== "localhost") {
    subdomain = parts[0];
  }
  const school = await db.school.findUnique({ where: { subdomain } });
  if (school) return school;
  return db.school.findUnique({ where: { subdomain: "demo" } });
}
