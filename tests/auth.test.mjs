import assert from "node:assert/strict";
import test from "node:test";

const { getAuthorizedEmails, isAuthorizedEmail, normalizeEmail } = await import(
  "../lib/auth-allowlist.ts"
);

test("allowlist de autenticação", async (suite) => {
  await suite.test("normaliza caixa e espaços", () => {
    assert.equal(normalizeEmail("  User@Example.COM "), "user@example.com");
  });

  await suite.test("aceita apenas e-mails configurados", () => {
    const allowlist = "first@example.com, second@example.com";

    assert.equal(isAuthorizedEmail("FIRST@example.com", allowlist), true);
    assert.equal(isAuthorizedEmail("third@example.com", allowlist), false);
  });

  await suite.test("nega acesso quando a configuração está vazia", () => {
    assert.equal(isAuthorizedEmail("first@example.com", ""), false);
    assert.equal(getAuthorizedEmails("").size, 0);
  });
});
