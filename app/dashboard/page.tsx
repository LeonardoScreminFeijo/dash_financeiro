import { auth } from "@/auth";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { isAuthorizedEmail } from "@/lib/auth-allowlist";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email || !isAuthorizedEmail(email)) redirect("/login");

  return <Dashboard userEmail={email} />;
}
