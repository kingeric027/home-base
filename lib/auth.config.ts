import type { NextAuthConfig } from "next-auth";

const PUBLIC_PATHS = ["/", "/login", "/register"];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isPublicPath = PUBLIC_PATHS.includes(request.nextUrl.pathname);

      if (isPublicPath) return true;
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
