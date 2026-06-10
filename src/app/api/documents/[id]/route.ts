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

// Helper to check user access level
async function getDocAccess(docId: string, userId: string) {
  const [doc] = await db.select().from(documents).where(eq(documents.id, docId)).limit(1);
  if (!doc) return { exists: false };
  
  if (doc.ownerId === userId) {
    return { exists: true, hasAccess: true, role: "owner" };
  }

  const [share] = await db
    .select()
    .from(documentShares)
    .where(
      and(
        eq(documentShares.documentId, docId),
        eq(documentShares.userId, userId)
      )
    )
    .limit(1);

  if (share) {
    return { exists: true, hasAccess: true, role: share.accessLevel.toLowerCase() };
  }

  return { exists: true, hasAccess: false, role: null };
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

    const { exists, hasAccess, role } = await getDocAccess(id, activeUser.id);
    if (!exists) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    if (!hasAccess || !role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [doc] = await db
      .select({
        id: documents.id,
        title: documents.title,
        content: documents.content,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        ownerId: documents.ownerId,
        ownerName: users.name,
        ownerEmail: users.email,
      })
      .from(documents)
      .innerJoin(users, eq(documents.ownerId, users.id))
      .where(eq(documents.id, id))
      .limit(1);

    return NextResponse.json({
      ...doc,
      role,
    });
  } catch (error) {
    console.error("GET /api/documents/[id] error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activeUser = await getActiveUser(request);
    if (!activeUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { exists, hasAccess, role } = await getDocAccess(id, activeUser.id);
    if (!exists) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    if (!hasAccess || !role || (role !== "owner" && role !== "write")) {
      return NextResponse.json({ error: "Forbidden: Write access required" }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Partial<typeof documents.$inferInsert> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    updateData.updatedAt = new Date();

    const [updatedDoc] = await db
      .update(documents)
      .set(updateData)
      .where(eq(documents.id, id))
      .returning();

    return NextResponse.json({
      ...updatedDoc,
      role,
    });
  } catch (error) {
    console.error("PUT /api/documents/[id] error:", error);
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

    const { exists, role } = await getDocAccess(id, activeUser.id);
    if (!exists) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    if (role !== "owner") {
      return NextResponse.json({ error: "Forbidden: Only owner can delete document" }, { status: 403 });
    }

    await db.delete(documents).where(eq(documents.id, id));

    return NextResponse.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/documents/[id] error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
