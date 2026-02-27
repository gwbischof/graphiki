import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      image: users.image,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return NextResponse.json({ users: rows });
}
