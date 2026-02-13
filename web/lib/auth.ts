import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "database" },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    // Dev-only credentials provider: auto-creates user by email
    ...(process.env.NODE_ENV !== "production"
      ? [
          Credentials({
            name: "Dev Login",
            credentials: {
              email: { label: "Email", type: "email" },
            },
            async authorize(credentials) {
              const email = credentials?.email as string;
              if (!email) return null;

              // Find or create user
              const existing = await db
                .select()
                .from(users)
                .where(eq(users.email, email))
                .limit(1);

              if (existing.length > 0) {
                return {
                  id: existing[0].id,
                  email: existing[0].email,
                  name: existing[0].name,
                  role: existing[0].role,
                };
              }

              // Auto-create for dev
              const [created] = await db
                .insert(users)
                .values({
                  email,
                  name: email.split("@")[0],
                  role: "user",
                })
                .returning();

              return {
                id: created.id,
                email: created.email,
                name: created.name,
                role: created.role,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // Fetch role from DB (adapter user doesn't include custom fields)
        const [dbUser] = await db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1);
        session.user.role = dbUser?.role ?? "user";
      }
      return session;
    },
  },
});
