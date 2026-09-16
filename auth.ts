import { isAuthorizedEmail } from "@/lib/auth-allowlist";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    signIn({ account, profile, user }) {
      if (account?.provider !== "google") return false;

      const email = profile?.email ?? user.email;
      const hasVerifiedEmail = profile?.email_verified === true;
      return hasVerifiedEmail && isAuthorizedEmail(email);
    },
    authorized({ auth: session, request }) {
      // A rota responde 401 em JSON; deixá-la chegar ao handler evita redirect HTML para o login.
      if (request.nextUrl.pathname === "/api/transactions") return true;
      return isAuthorizedEmail(session?.user?.email);
    },
  },
});
