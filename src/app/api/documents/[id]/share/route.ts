import { db } from "@/db";
import { documents, documentShares, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

async function getActiveUser(request: Request) {
  const email = request.headers.get("x-user-email");
  if (!email) return null;
  const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return found[0] || null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activeUser = await getActiveUser(request);
    if (!activeUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check document ownership (only owner can view/manage list of shares)
    const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    if (doc.ownerId !== activeUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // List all shared users
    const sharesList = await db
      .select({
        id: documentShares.id,
        userId: users.id,
        name: users.name,
        email: users.email,
        accessLevel: documentShares.accessLevel,
        createdAt: documentShares.createdAt,
      })
      .from(documentShares)
      .innerJoin(users, eq(documentShares.userId, users.id))
      .where(eq(documentShares.documentId, id));

    return NextResponse.json(sharesList);
  } catch (error) {
    console.error("GET /api/documents/[id]/share error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activeUser = await getActiveUser(request);
    if (!activeUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check document ownership
    const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    if (doc.ownerId !== activeUser.id) {
      return NextResponse.json({ error: "Forbidden: Only owner can share" }, { status: 403 });
    }

    const body = await request.json();
    const { email, accessLevel } = body;
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const role = accessLevel || "WRITE"; // "READ" or "WRITE"

    // Find the target user to share with
    const [targetUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!targetUser) {
      return NextResponse.json({ error: `User with email "${email}" not found in our database.` }, { status: 404 });
    }

    // Can't share with self (the owner)
    if (targetUser.id === activeUser.id) {
      return NextResponse.json({ error: "Cannot share document with yourself (the owner)" }, { status: 400 });
    }

    // Check if share already exists
    const [existingShare] = await db
      .select()
      .from(documentShares)
      .where(
        and(
          eq(documentShares.documentId, id),
          eq(documentShares.userId, targetUser.id)
        )
      )
      .limit(1);

    if (existingShare) {
      // Update access level
      const [updated] = await db
        .update(documentShares)
        .set({ accessLevel: role, createdAt: new Date() })
        .where(eq(documentShares.id, existingShare.id))
        .returning();
      return NextResponse.json(updated);
    } else {
      // Create new share
      const [newShare] = await db
        .insert(documentShares)
        .values({
          documentId: id,
          userId: targetUser.id,
          accessLevel: role,
        })
        .returning();
      return NextResponse.json(newShare);
    }
  } catch (error) {
    console.error("POST /api/documents/[id]/share error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activeUser = await getActiveUser(request);
    if (!activeUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check document ownership
    const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    if (doc.ownerId !== activeUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId query parameter is required" }, { status: 400 });
    }

    await db
      .delete(documentShares)
      .where(
        and(
          eq(documentShares.documentId, id),
          eq(documentShares.userId, userId)
        )
      );

    return NextResponse.json({ success: true, message: "Share revoked successfully" });
  } catch (error) {
    console.error("DELETE /api/documents/[id]/share error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
