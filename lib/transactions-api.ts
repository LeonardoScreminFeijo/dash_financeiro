import { isAuthorizedEmail } from "@/lib/auth-allowlist";
import { normalizeTransactions } from "@/lib/normalize";
import { isAppsScriptTransactionsResponse } from "@/types/transaction";
import { NextResponse } from "next/server";

export async function getTransactions(email: string | null | undefined): Promise<NextResponse> {
  if (!isAuthorizedEmail(email)) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const url = process.env.GOOGLE_SCRIPT_URL;
  const secret = process.env.GOOGLE_SCRIPT_SECRET;

  if (!url || !secret) {
    return NextResponse.json(
      { ok: false, error: "Configuração do servidor incompleta." },
      { status: 500 },
    );
  }

  try {
    const endpoint = new URL(url);
    endpoint.searchParams.set("secret", secret);
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: "Não foi possível consultar as movimentações." },
        { status: 502 },
      );
    }

    const data: unknown = await response.json();
    if (!isAppsScriptTransactionsResponse(data) || !data.ok || !Array.isArray(data.transactions)) {
      return NextResponse.json(
        { ok: false, error: "Resposta inválida do serviço." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, transactions: normalizeTransactions(data.transactions) });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro de rede ao consultar as movimentações." },
      { status: 502 },
    );
  }
}
