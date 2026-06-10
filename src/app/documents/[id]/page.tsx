"use client";

import React, { use, useState, useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo,
  Redo,
  Share2,
  Lock,
  Unlock,
  Trash2,
  Loader2,
  Cloud,
  AlertCircle,
  Eye,
  Edit2,
  X,
  FileDown,
} from "lucide-react";

interface DocData {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  role: "owner" | "write" | "read";
}

interface ShareItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  accessLevel: "READ" | "WRITE";
  createdAt: string;
}

export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { activeUser, usersList } = useUser();
  const router = useRouter();

  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");

  // Share Modal States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [shareEmail, setShareEmail] = useState("");
  const [shareAccess, setShareAccess] = useState<"READ" | "WRITE">("WRITE");
  const [shareError, setShareError] = useState("");
  const [shareLoading, setShareLoading] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const titleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  // Initialize TipTap
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
    ],
    content: "",
    onUpdate: ({ editor }) => {
      if (doc && (doc.role === "owner" || doc.role === "write")) {
        triggerAutoSave(editor.getHTML());
      }
    },
  });

  // Fetch document details
  const fetchDoc = async () => {
    if (!activeUser) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/documents/${id}`, {
        headers: {
          "x-user-email": activeUser.email,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setDoc(data);
        setTitleInput(data.title);
        
        // Populate editor content if not loaded
        if (editor) {
          editor.commands.setContent(data.content);
          editor.setEditable(data.role === "owner" || data.role === "write");
        }
        setDocumentLoaded(true);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to load document.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to connect to the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDoc();
    }, 0);
    
    if (typeof window !== "undefined") {
      window.addEventListener("user-changed", fetchDoc);
    }
    return () => {
      clearTimeout(timer);
      if (typeof window !== "undefined") {
        window.removeEventListener("user-changed", fetchDoc);
      }
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, activeUser, editor]);

  // Set editor properties when elements are ready
  useEffect(() => {
    if (editor && doc && documentLoaded) {
      editor.setEditable(doc.role === "owner" || doc.role === "write");
    }
  }, [editor, doc, documentLoaded]);

  // Debounced auto-save content
  const triggerAutoSave = (newContent: string) => {
    setSaveStatus("saving");
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (!activeUser) return;
      try {
        const res = await fetch(`/api/documents/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-email": activeUser.email,
          },
          body: JSON.stringify({ content: newContent }),
        });

        if (res.ok) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("error");
        }
      } catch (err) {
        console.error(err);
        setSaveStatus("error");
      }
    }, 1200);
  };

  // Handle title rename (local update & debounced database sync)
  const handleTitleChange = (newTitle: string) => {
    setTitleInput(newTitle);
    if (!doc || (doc.role !== "owner" && doc.role !== "write")) return;

    setSaveStatus("saving");
    if (titleTimeoutRef.current) {
      clearTimeout(titleTimeoutRef.current);
    }

    titleTimeoutRef.current = setTimeout(async () => {
      if (!activeUser) return;
      try {
        const res = await fetch(`/api/documents/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-email": activeUser.email,
          },
          body: JSON.stringify({ title: newTitle }),
        });

        if (res.ok) {
          setSaveStatus("saved");
          setDoc((prev) => prev ? { ...prev, title: newTitle } : null);
        } else {
          setSaveStatus("error");
        }
      } catch (err) {
        console.error(err);
        setSaveStatus("error");
      }
    }, 1000);
  };

  // Fetch share permissions
  const fetchShares = async () => {
    if (!activeUser || !doc || doc.role !== "owner") return;
    try {
      const res = await fetch(`/api/documents/${id}/share`, {
        headers: {
          "x-user-email": activeUser.email,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setShares(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isShareModalOpen) {
      const timer = setTimeout(() => {
        fetchShares();
      }, 0);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShareModalOpen]);

  // Handle grant access
  const handleAddShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser || !shareEmail.trim()) return;

    setShareLoading(true);
    setShareError("");

    try {
      const res = await fetch(`/api/documents/${id}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": activeUser.email,
        },
        body: JSON.stringify({
          email: shareEmail.trim(),
          accessLevel: shareAccess,
        }),
      });

      if (res.ok) {
        setShareEmail("");
        fetchShares();
      } else {
        const err = await res.json();
        setShareError(err.error || "Failed to share document.");
      }
    } catch (err) {
      console.error("Add share error:", err);
      setShareError("An error occurred. Please try again.");
    } finally {
      setShareLoading(false);
    }
  };

  // Handle revoke access
  const handleRemoveShare = async (userId: string) => {
    if (!activeUser) return;
    try {
      const res = await fetch(`/api/documents/${id}/share?userId=${userId}`, {
        method: "DELETE",
        headers: {
          "x-user-email": activeUser.email,
        },
      });

      if (res.ok) {
        fetchShares();
      } else {
        alert("Failed to remove access.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const exportToMarkdown = () => {
    if (!editor || !doc) return;
    const html = editor.getHTML();
    
    let markdown = html
      .replace(/<h1>(.*?)<\/h1>/gi, "# $1\n\n")
      .replace(/<h2>(.*?)<\/h2>/gi, "## $1\n\n")
      .replace(/<h3>(.*?)<\/h3>/gi, "### $1\n\n")
      .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
      .replace(/<b>(.*?)<\/b>/gi, "**$1**")
      .replace(/<em>(.*?)<\/em>/gi, "*$1*")
      .replace(/<i>(.*?)<\/i>/gi, "*$1*")
      .replace(/<u>(.*?)<\/u>/gi, "$1")
      .replace(/<li>(.*?)<\/li>/gi, "- $1\n")
      .replace(/<\/li>/gi, "")
      .replace(/<ul>/gi, "")
      .replace(/<\/ul>/gi, "\n")
      .replace(/<ol>/gi, "")
      .replace(/<\/ol>/gi, "\n")
      .replace(/<p>(.*?)<\/p>/gi, "$1\n\n")
      .replace(/<br\s*\/?>/gi, "\n");

    markdown = markdown.replace(/<[^>]*>/g, "");
    markdown = markdown.replace(/\n{3,}/g, "\n\n").trim();

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${doc.title}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="mt-4 text-sm font-semibold text-slate-500">Loading document...</p>
      </div>
    );
  }

  if (errorMsg || !doc) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-bold text-slate-900">Access Denied / Error</h3>
          <p className="mt-2 text-sm text-slate-600">
            {errorMsg || "The document you are looking for does not exist or you don't have access to view it."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const canWrite = doc.role === "owner" || doc.role === "write";

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      {/* Editor Sub-Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-2">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 sm:flex-row sm:items-center">
          {/* Document Title Control */}
          <div className="flex flex-1 items-center gap-3">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={!canWrite}
              className="text-lg font-bold text-slate-800 bg-transparent border-b border-transparent outline-none transition-all focus:border-indigo-500 hover:border-slate-200 px-1 py-0.5 rounded max-w-md w-full disabled:hover:border-transparent"
              placeholder="Untitled Document"
              aria-label="Document Title"
            />
            {/* Permission Badge */}
            {doc.role === "owner" ? (
              <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100">
                <Unlock className="h-3 w-3" /> Owner
              </span>
            ) : canWrite ? (
              <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 border border-green-100">
                <Edit2 className="h-3 w-3" /> Can Edit
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-100">
                <Eye className="h-3 w-3" /> Read Only
              </span>
            )}
          </div>

          {/* Controls / States */}
          <div className="flex items-center gap-4">
            {/* Auto-Save Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Cloud className="h-3.5 w-3.5 text-green-500" />
                  <span>Saved</span>
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-red-600">Save failed</span>
                </>
              )}
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-xs hover:bg-slate-50 hover:text-slate-800 transition-all"
                title="Export document"
                aria-label="Export options"
              >
                <FileDown className="h-3.5 w-3.5" />
                Export
              </button>

              {isExportDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsExportDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 z-50 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg animate-fadeIn">
                    <button
                      onClick={() => {
                        setIsExportDropdownOpen(false);
                        window.print();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                    >
                      Export as PDF (.pdf)
                    </button>
                    <button
                      onClick={() => {
                        setIsExportDropdownOpen(false);
                        exportToMarkdown();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                    >
                      Export as Markdown (.md)
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Sharing Trigger (Owners only) */}
            {doc.role === "owner" ? (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
            ) : (
              <button
                disabled
                className="flex items-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed"
                title="Only owners can share documents"
              >
                <Lock className="h-3.5 w-3.5" />
                Shared
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-sm min-h-[600px]">
          {/* Editor Formatting Toolbar */}
          {editor && (
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/50 p-2 rounded-t-2xl">
              {/* Bold */}
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!canWrite}
                className={`rounded p-1.5 transition-colors ${
                  editor.isActive("bold") ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-200/50"
                } disabled:opacity-40`}
                title="Bold"
                aria-label="Toggle Bold"
              >
                <Bold className="h-4 w-4" />
              </button>
              {/* Italic */}
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!canWrite}
                className={`rounded p-1.5 transition-colors ${
                  editor.isActive("italic") ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-200/50"
                } disabled:opacity-40`}
                title="Italic"
                aria-label="Toggle Italic"
              >
                <Italic className="h-4 w-4" />
              </button>
              {/* Underline */}
              <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                disabled={!canWrite}
                className={`rounded p-1.5 transition-colors ${
                  editor.isActive("underline") ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-200/50"
                } disabled:opacity-40`}
                title="Underline"
                aria-label="Toggle Underline"
              >
                <UnderlineIcon className="h-4 w-4" />
              </button>

              <div className="h-4 w-px bg-slate-200 mx-1.5"></div>

              {/* Heading 1 */}
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                disabled={!canWrite}
                className={`rounded p-1.5 transition-colors ${
                  editor.isActive("heading", { level: 1 }) ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-200/50"
                } disabled:opacity-40`}
                title="Heading 1"
                aria-label="Toggle Heading 1"
              >
                <Heading1 className="h-4 w-4" />
              </button>
              {/* Heading 2 */}
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                disabled={!canWrite}
                className={`rounded p-1.5 transition-colors ${
                  editor.isActive("heading", { level: 2 }) ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-200/50"
                } disabled:opacity-40`}
                title="Heading 2"
                aria-label="Toggle Heading 2"
              >
                <Heading2 className="h-4 w-4" />
              </button>
              {/* Heading 3 */}
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                disabled={!canWrite}
                className={`rounded p-1.5 transition-colors ${
                  editor.isActive("heading", { level: 3 }) ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-200/50"
                } disabled:opacity-40`}
                title="Heading 3"
                aria-label="Toggle Heading 3"
              >
                <Heading3 className="h-4 w-4" />
              </button>

              <div className="h-4 w-px bg-slate-200 mx-1.5"></div>

              {/* Bullet List */}
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                disabled={!canWrite}
                className={`rounded p-1.5 transition-colors ${
                  editor.isActive("bulletList") ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-200/50"
                } disabled:opacity-40`}
                title="Bullet List"
                aria-label="Toggle Bullet List"
              >
                <List className="h-4 w-4" />
              </button>
              {/* Ordered List */}
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                disabled={!canWrite}
                className={`rounded p-1.5 transition-colors ${
                  editor.isActive("orderedList") ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-200/50"
                } disabled:opacity-40`}
                title="Ordered List"
                aria-label="Toggle Ordered List"
              >
                <ListOrdered className="h-4 w-4" />
              </button>

              <div className="h-4 w-px bg-slate-200 mx-1.5 font-light"></div>

              {/* Undo */}
              <button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!canWrite || !editor.can().undo()}
                className="rounded p-1.5 text-slate-600 hover:bg-slate-200/50 disabled:opacity-40"
                title="Undo"
                aria-label="Undo last change"
              >
                <Undo className="h-4 w-4" />
              </button>
              {/* Redo */}
              <button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!canWrite || !editor.can().redo()}
                className="rounded p-1.5 text-slate-600 hover:bg-slate-200/50 disabled:opacity-40"
                title="Redo"
                aria-label="Redo last change"
              >
                <Redo className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Editor Content Area */}
          <div className="flex-1 p-8 overflow-y-auto prose prose-indigo max-w-none focus:outline-none">
            <EditorContent editor={editor} className="min-h-[500px]" />
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="h-5 w-5 text-indigo-600" />
                Share Document
              </h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Grant access form */}
            <form onSubmit={handleAddShare} className="mt-4">
              <label htmlFor="share-email-input" className="block text-xs font-bold text-slate-500 uppercase">
                Grant access to user:
              </label>
              <div className="mt-2 flex gap-2">
                <select
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  id="share-email-input"
                >
                  <option value="">Select a user email...</option>
                  {usersList
                    .filter((u) => u.id !== doc.ownerId) // hide owner
                    .map((u) => (
                      <option key={u.id} value={u.email}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                </select>

                <select
                  value={shareAccess}
                  onChange={(e) => setShareAccess(e.target.value as "READ" | "WRITE")}
                  className="rounded-xl border border-slate-200 px-2 py-2 text-sm outline-none focus:border-indigo-500"
                  aria-label="Choose permission level"
                >
                  <option value="WRITE">Can Edit</option>
                  <option value="READ">Can View</option>
                </select>

                <button
                  type="submit"
                  disabled={shareLoading || !shareEmail}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-40"
                >
                  {shareLoading ? "Adding..." : "Add"}
                </button>
              </div>

              {shareError && (
                <p className="mt-2 text-xs font-semibold text-red-600">{shareError}</p>
              )}
            </form>

            {/* Access List */}
            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Who has access:
              </h4>
              <div className="mt-3 flex flex-col gap-2 max-h-[220px] overflow-y-auto">
                {/* Document Owner */}
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">{doc.ownerName} (Owner)</span>
                    <span className="text-[10px] text-slate-400 font-medium">{doc.ownerEmail}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Full Control</span>
                </div>

                {/* Shared users */}
                {shares.length > 0 ? (
                  shares.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">{share.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{share.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {share.accessLevel === "WRITE" ? "Can Edit" : "Can View"}
                        </span>
                        <button
                          onClick={() => handleRemoveShare(share.userId)}
                          className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Revoke access"
                          aria-label={`Revoke access for ${share.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-xs font-medium text-slate-400">
                    Not shared with anyone else yet.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 flex justify-end">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
