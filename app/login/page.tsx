import { auth, signIn } from "@/auth";
import { isAuthorizedEmail } from "@/lib/auth-allowlist";
import { ArrowRight, LockKeyhole, WalletCards } from "lucide-react";
import { redirect } from "next/navigation";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (isAuthorizedEmail(session?.user?.email)) redirect("/dashboard");

  const { error } = await searchParams;

  return (
    <main className="grid min-h-[100dvh] place-items-center px-4 py-10 sm:px-6">
      <section className="dashboard-card w-full max-w-md overflow-hidden p-7 sm:p-9">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-primary text-white shadow-[0_8px_20px_rgba(37,99,235,0.2)]">
            <WalletCards className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-ink dark:text-stone-100">Finanças do casal</p>
            <p className="text-xs text-stone-500">Acesso privado</p>
          </div>
        </div>

        <div className="mt-10">
          <div className="mb-4 grid size-10 place-items-center rounded-xl bg-blue-50 text-primary dark:bg-blue-400/10 dark:text-blue-200">
            <LockKeyhole className="size-[18px]" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-[-0.035em] text-ink dark:text-stone-100">
            Entre para acessar o dashboard
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">
            Use uma das contas Google autorizadas para visualizar os dados financeiros.
          </p>
        </div>

        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
            Esta conta não tem permissão para acessar o dashboard.
          </p>
        )}

        <form
          className="mt-7"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.2)] hover:bg-blue-700"
          >
            Continuar com Google
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </form>

        <p className="mt-5 text-center text-xs leading-5 text-stone-400">
          O acesso é limitado às contas previamente autorizadas.
        </p>
      </section>
    </main>
  );
}
