import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "InsightForge Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@sturvixa.ai" },
        password: { label: "Access Token / Password", type: "password" }
      },
      async authorize(credentials) {
        // Mock DB lookup for the Enterprise Demo
        if (credentials?.email === "admin@sturvixa.ai" && credentials?.password === "admin") {
          return {
            id: "1",
            name: "Enterprise Admin",
            email: "admin@sturvixa.ai",
            role: "executive"
          };
        }
        
        // Return null if user data could not be retrieved
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/", // Since our login modal is on the homepage
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_only_do_not_use_in_prod_123456",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
