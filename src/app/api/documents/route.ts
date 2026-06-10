import { db } from "@/db";
import { documents, documentShares, users } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { NextResponse } from "next/server";

async function getActiveUser(request: Request) {
  const email = request.headers.get("x-user-email");
  if (!email) return null;
  const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return found[0] || null;
}

export async function GET(request: Request) {
  try {
    const activeUser = await getActiveUser(request);
    if (!activeUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userDocs = await db
      .select({
        id: documents.id,
        title: documents.title,
        content: documents.content,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        ownerId: documents.ownerId,
        ownerName: users.name,
        ownerEmail: users.email,
        accessLevel: documentShares.accessLevel,
      })
      .from(documents)
      .innerJoin(users, eq(documents.ownerId, users.id))
      .leftJoin(
        documentShares,
        and(
          eq(documents.id, documentShares.documentId),
          eq(documentShares.userId, activeUser.id)
        )
      )
      .where(
        or(
          eq(documents.ownerId, activeUser.id),
          eq(documentShares.userId, activeUser.id)
        )
      );

    // Format results to make it clear if owner or shared
    const formatted = userDocs.map((doc) => ({
      ...doc,
      role: doc.ownerId === activeUser.id ? "owner" : doc.accessLevel || "viewer",
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/documents error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const activeUser = await getActiveUser(request);
    if (!activeUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = body.title || "Untitled Document";
    const content = body.content || "";

    const [newDoc] = await db
      .insert(documents)
      .values({
        title,
        content,
        ownerId: activeUser.id,
      })
      .returning();

    return NextResponse.json({
      ...newDoc,
      role: "owner",
    });
  } catch (error) {
    console.error("POST /api/documents error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
