import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-guard";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireRole("admin");
  if (error) return error;

  const body = await request.json();
  const { role } = body;

  if (!role || !["user", "mod", "admin"].includes(role)) {
    return NextResponse.json(
      { error: 'role must be "user", "mod", or "admin"' },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({ id: users.id, role: users.role, name: users.name });

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user: updated });
}
