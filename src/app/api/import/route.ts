import { db } from "@/db";
import { documents, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import mammoth from "mammoth";

async function getActiveUser(request: Request) {
  const email = request.headers.get("x-user-email");
  if (!email) return null;
  const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return found[0] || null;
}

function convertMarkdownToHtml(md: string): string {
  // Convert standard markdown structures into raw HTML for TipTap
  let html = md
    .replace(/^# (.*?)$/gm, "<h1>$1</h1>")
    .replace(/^## (.*?)$/gm, "<h2>$1</h2>")
    .replace(/^### (.*?)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^\s*\-\s+(.*?)$/gm, "<li>$1</li>")
    .replace(/^\s*\*\s+(.*?)$/gm, "<li>$1</li>");

  // Group contiguous <li> tags into a <ul>
  html = html.replace(/(<li>[\s\S]*?<\/li>)+/g, (match) => `<ul>${match}</ul>`);

  // Wrap lines that don't start with block HTML elements in <p>
  html = html
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<li") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("</ul")
      ) {
        return trimmed;
      }
      return `<p>${trimmed}</p>`;
    })
    .join("");

  return html;
}

export async function POST(request: Request) {
  try {
    const activeUser = await getActiveUser(request);
    if (!activeUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    const filename = file.name;
    const extension = filename.split(".").pop()?.toLowerCase();
    const title = filename.substring(0, filename.lastIndexOf(".")) || filename;
    
    let content = "";

    if (extension === "txt") {
      const text = await file.text();
      // Convert line breaks to paragraphs
      content = text
        .split("\n")
        .map((paragraph) => `<p>${paragraph.trim()}</p>`)
        .filter((p) => p !== "<p></p>")
        .join("");
    } else if (extension === "md") {
      const text = await file.text();
      content = convertMarkdownToHtml(text);
    } else if (extension === "docx") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.convertToHtml({ buffer });
      content = result.value;
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Only .txt, .md, and .docx files are allowed." },
        { status: 400 }
      );
    }

    // Save as a new document
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
    console.error("POST /api/import error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
