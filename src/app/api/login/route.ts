import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    // If user does not exist, create them in the DB!
    if (!user) {
      const cleanName = name?.trim() || cleanEmail.split("@")[0];
      [user] = await db
        .insert(users)
        .values({
          email: cleanEmail,
          name: cleanName,
        })
        .returning();
      console.log(`Auto-created user on login: ${cleanName} (${cleanEmail})`);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("POST /api/login error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
