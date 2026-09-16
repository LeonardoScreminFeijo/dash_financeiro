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
    <main className="relative grid min-h-[100dvh] place-items-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
      <div aria-hidden="true" className="absolute -left-24 top-12 size-72 rounded-full bg-blue-200/30 blur-3xl dark:bg-blue-500/10" />
      <div aria-hidden="true" className="absolute -bottom-28 -right-20 size-80 rounded-full bg-amber-100/45 blur-3xl dark:bg-amber-400/5" />

      <section className="dashboard-card relative w-full max-w-[29rem] overflow-hidden p-6 sm:p-10">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 via-primary to-blue-400" aria-hidden="true" />

        <div className="flex flex-col items-center text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-primary text-white shadow-[0_12px_28px_rgba(37,99,235,0.24)]">
            <WalletCards className="size-6" aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm font-bold tracking-[-0.01em] text-ink dark:text-stone-100">Finanças do casal</p>
          <div className="mt-7 grid size-10 place-items-center rounded-xl bg-blue-50 text-primary dark:bg-blue-400/10 dark:text-blue-200">
            <LockKeyhole className="size-[18px]" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-ink dark:text-stone-100 sm:text-[1.7rem]">
            Seu painel financeiro, em um só lugar
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-stone-500 dark:text-stone-400">
            Use uma das contas Google autorizadas para visualizar os dados financeiros.
          </p>
        </div>

        {error && (
          <p role="alert" className="mt-7 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
            Esta conta não tem permissão para acessar o dashboard.
          </p>
        )}

        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.2)] hover:bg-blue-700 focus-visible:outline-offset-4"
          >
            Continuar com Google
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </form>

        <p className="mt-5 text-center text-xs leading-5 text-stone-400 dark:text-stone-500">
          Acesso privado para contas previamente autorizadas.
        </p>
      </section>
    </main>
  );
}
