import { db } from "@/db";
import { users } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const list = await db.select().from(users);
    return NextResponse.json(list);
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
