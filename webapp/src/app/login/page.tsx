import { redirect } from "next/navigation";
import { currentSchool } from "@/lib/tenant";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/home");
  const school = await currentSchool();

  return (
    <main className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-blue-700 text-white flex items-center justify-center text-2xl font-bold shadow-md">
            {(school?.name ?? "S").charAt(0)}
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">
            {school?.name ?? "School Portal"}
          </h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Demo logins: admin@demo.school · t.biology@demo.school · dia9001@student.demo.school — password Demo123!
        </p>
      </div>
    </main>
  );
}
