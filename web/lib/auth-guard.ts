import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

type Role = "guest" | "user" | "mod" | "admin";

const ROLE_LEVEL: Record<Role, number> = {
  guest: 0,
  user: 1,
  mod: 2,
  admin: 3,
};

export async function requireRole(minimumRole: Role) {
  if (minimumRole === "guest") {
    // No auth required
    const session = await auth();
    return { session, user: session?.user ?? null };
  }

  const session = await auth();

  if (!session?.user) {
    return {
      session: null,
      user: null,
      error: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  const userRole = (session.user.role ?? "user") as Role;
  if (ROLE_LEVEL[userRole] < ROLE_LEVEL[minimumRole]) {
    return {
      session,
      user: session.user,
      error: NextResponse.json(
        {
          error: "Insufficient permissions",
          required: minimumRole,
          current: userRole,
        },
        { status: 403 }
      ),
    };
  }

  return { session, user: session.user };
}
