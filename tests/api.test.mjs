import assert from "node:assert/strict";
import test from "node:test";

const { getTransactions } = await import("../lib/transactions-api.ts");

const rawTransaction = {
  Data: "2026-09-16",
  Hora: "08:30",
  Tipo: "expense",
  Categoria: "Mercado",
  "Descrição": "Compras da semana",
  Valor: "R$ 150,00",
  Conta: "Conta principal",
  Pagamento: "Cartão",
  Parcelamento: "1x",
  "Texto Original": "gastei 150 no mercado",
};

async function callRoute({
  url,
  secret,
  fetchImpl,
  email = "authorized@example.com",
  authorizedEmails = "authorized@example.com",
}) {
  const previousUrl = process.env.GOOGLE_SCRIPT_URL;
  const previousSecret = process.env.GOOGLE_SCRIPT_SECRET;
  const previousAuthorizedEmails = process.env.AUTHORIZED_EMAILS;
  const previousFetch = globalThis.fetch;

  if (url === undefined) delete process.env.GOOGLE_SCRIPT_URL;
  else process.env.GOOGLE_SCRIPT_URL = url;

  if (secret === undefined) delete process.env.GOOGLE_SCRIPT_SECRET;
  else process.env.GOOGLE_SCRIPT_SECRET = secret;

  process.env.AUTHORIZED_EMAILS = authorizedEmails;

  globalThis.fetch = fetchImpl;

  try {
    const response = await getTransactions(email);
    return { response, payload: await response.json() };
  } finally {
    if (previousUrl === undefined) delete process.env.GOOGLE_SCRIPT_URL;
    else process.env.GOOGLE_SCRIPT_URL = previousUrl;

    if (previousSecret === undefined) delete process.env.GOOGLE_SCRIPT_SECRET;
    else process.env.GOOGLE_SCRIPT_SECRET = previousSecret;

    if (previousAuthorizedEmails === undefined) delete process.env.AUTHORIZED_EMAILS;
    else process.env.AUTHORIZED_EMAILS = previousAuthorizedEmails;

    globalThis.fetch = previousFetch;
  }
}

test("contrato da rota de movimentações", async (suite) => {
  await suite.test("retorna 401 para e-mail fora da allowlist", async () => {
    const { response, payload } = await callRoute({
      url: "https://apps-script.example/exec",
      secret: "secret-de-teste",
      email: "intruder@example.com",
      fetchImpl: async () => {
        throw new Error("O Apps Script não deve ser consultado.");
      },
    });

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { ok: false, error: "Não autorizado." });
  });

  await suite.test("retorna 500 sem variáveis obrigatórias", async () => {
    const { response, payload } = await callRoute({
      url: undefined,
      secret: undefined,
      fetchImpl: async () => new Response(),
    });

    assert.equal(response.status, 500);
    assert.deepEqual(payload, { ok: false, error: "Configuração do servidor incompleta." });
  });

  await suite.test("retorna 502 quando o Apps Script está indisponível", async () => {
    const { response, payload } = await callRoute({
      url: "https://apps-script.example/exec",
      secret: "secret-de-teste",
      fetchImpl: async () => new Response(null, { status: 503 }),
    });

    assert.equal(response.status, 502);
    assert.deepEqual(payload, { ok: false, error: "Não foi possível consultar as movimentações." });
  });

  await suite.test("retorna 502 para resposta inválida do Apps Script", async () => {
    const { response, payload } = await callRoute({
      url: "https://apps-script.example/exec",
      secret: "secret-de-teste",
      fetchImpl: async () => Response.json({ ok: true, transactions: "inválido" }),
    });

    assert.equal(response.status, 502);
    assert.deepEqual(payload, { ok: false, error: "Resposta inválida do serviço." });
  });

  await suite.test("normaliza a resposta válida e não retorna o secret", async () => {
    let requestedEndpoint = "";
    const secret = "secret-de-teste";
    const { response, payload } = await callRoute({
      url: "https://apps-script.example/exec?source=dashboard",
      secret,
      fetchImpl: async (input) => {
        requestedEndpoint = String(input);
        return Response.json({ ok: true, transactions: [rawTransaction] });
      },
    });

    assert.equal(response.status, 200);
    assert.equal(new URL(requestedEndpoint).searchParams.get("secret"), secret);
    assert.deepEqual(payload, {
      ok: true,
      transactions: [{
        date: "2026-09-16",
        time: "08:30",
        type: "expense",
        category: "Mercado",
        description: "Compras da semana",
        amount: 150,
        account: "Conta principal",
        paymentMethod: "Cartão",
        installment: "1x",
        originalText: "gastei 150 no mercado",
      }],
    });
    assert.doesNotMatch(JSON.stringify(payload), new RegExp(secret));
  });
});
