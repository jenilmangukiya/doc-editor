"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Search,
  Lock,
  Share2,
  Trash2,
  UploadCloud,
  FileUp,
  FolderKanban,
  RefreshCw,
} from "lucide-react";

interface DocumentItem {
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

export default function Home() {
  const { activeUser } = useUser();
  const router = useRouter();

  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "owned" | "shared">("all");

  // Create Document States
  const [creating, setCreating] = useState(false);

  // File Upload States
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchDocuments = async () => {
    if (!activeUser) return;
    setLoadingDocs(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/documents", {
        headers: {
          "x-user-email": activeUser.email,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDocs(data);
      } else {
        setErrorMsg("Failed to fetch documents.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred while fetching documents.");
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments();
    }, 0);
    if (typeof window !== "undefined") {
      window.addEventListener("user-changed", fetchDocuments);
    }
    return () => {
      clearTimeout(timer);
      if (typeof window !== "undefined") {
        window.removeEventListener("user-changed", fetchDocuments);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUser]);

  const handleCreateDocument = async () => {
    if (!activeUser || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": activeUser.email,
        },
        body: JSON.stringify({
          title: `Untitled Document (${new Date().toLocaleDateString()})`,
          content: "",
        }),
      });

      if (res.ok) {
        const newDoc = await res.json();
        router.push(`/documents/${newDoc.id}`);
      } else {
        alert("Failed to create document.");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating document.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering open card
    if (!activeUser) return;

    if (!confirm("Are you sure you want to delete this document? This action is permanent.")) {
      return;
    }

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-email": activeUser.email,
        },
      });

      if (res.ok) {
        setDocs(docs.filter((doc) => doc.id !== id));
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete document.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting document.");
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    if (!activeUser) return;

    // Check extension
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "txt" && ext !== "md" && ext !== "docx") {
      setErrorMsg("Unsupported file type. Only .txt, .md, and .docx files are allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: {
          "x-user-email": activeUser.email,
        },
        body: formData,
      });

      if (res.ok) {
        const newDoc = await res.json();
        router.push(`/documents/${newDoc.id}`);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to import file.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred during file upload.");
    } finally {
      setUploading(false);
    }
  };

  // Filters and queries
  const filteredDocs = docs
    .filter((doc) => {
      if (activeTab === "owned") return doc.role === "owner";
      if (activeTab === "shared") return doc.role === "write" || doc.role === "read";
      return true;
    })
    .filter((doc) => doc.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Banner */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            My Workspace
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Create, edit, import and manage your documents collaboratively.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchDocuments}
            className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
            title="Refresh list"
            aria-label="Refresh document list"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            onClick={handleCreateDocument}
            disabled={creating}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-100 transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-indigo-200 disabled:opacity-50"
          >
            <Plus className="h-5 w-5" />
            {creating ? "Creating..." : "New Document"}
          </button>
        </div>
      </div>

      {/* Main Grid: Upload Area & Document List */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: Document Section */}
        <div className="lg:col-span-2">
          {/* Controls */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Tabs */}
            <div className="flex rounded-lg bg-slate-100 p-1">
              <button
                onClick={() => setActiveTab("all")}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "all" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("owned")}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "owned" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Owned
              </button>
              <button
                onClick={() => setActiveTab("shared")}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "shared" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Shared with Me
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents by title..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                aria-label="Search documents by title"
              />
            </div>
          </div>

          {/* Document Grid */}
          {loadingDocs ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="h-6 w-3/4 rounded bg-slate-200"></div>
                  <div className="mt-4 h-4 w-1/2 rounded bg-slate-100"></div>
                  <div className="mt-6 flex justify-between">
                    <div className="h-5 w-16 rounded bg-slate-100"></div>
                    <div className="h-5 w-20 rounded bg-slate-100"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDocs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => router.push(`/documents/${doc.id}`)}
                  className="group relative flex flex-col justify-between cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:scale-[1.01] hover:border-indigo-400 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                        <FileText className="h-5 w-5" />
                      </div>
                      
                      {/* Owner controls deletion */}
                      {doc.role === "owner" ? (
                        <button
                          onClick={(e) => handleDeleteDocument(doc.id, e)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Delete document"
                          aria-label={`Delete document ${doc.title}`}
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-100">
                          <Share2 className="h-3 w-3" /> Shared
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-1">
                      {doc.title}
                    </h3>
                    
                    <p className="mt-1 text-xs text-slate-400 font-medium">
                      Last edited: {new Date(doc.updatedAt).toLocaleDateString()} at {new Date(doc.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4 text-xs font-semibold">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Lock className="h-3 w-3 text-slate-400" />
                      {doc.role === "owner" ? "Private" : `Access: ${doc.role.toUpperCase()}`}
                    </span>
                    <span className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                      Edit document &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
              <div className="rounded-full bg-slate-50 p-4 text-slate-400">
                <FolderKanban className="h-10 w-10" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">No documents found</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm">
                Try searching for another term, changing filters, or create/import a new document to get started.
              </p>
              <button
                onClick={handleCreateDocument}
                className="mt-6 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
              >
                Create Document
              </button>
            </div>
          )}
        </div>

        {/* Right 1 Col: Drag & Drop Import File */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <FileUp className="h-5 w-5 text-indigo-600" />
              Import Document
            </h2>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              Upload an existing file. We support **Word Documents (`.docx`)**, **Markdown (`.md`)**, and **Plain Text (`.txt`)**. Your formatting will be automatically parsed!
            </p>

            <form
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
              className={`mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? "border-indigo-500 bg-indigo-50/50"
                  : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/30"
              }`}
            >
              <input
                id="file-input"
                type="file"
                className="hidden"
                onChange={handleFileInput}
                accept=".txt,.md,.docx"
              />
              <div className="rounded-full bg-indigo-50 p-3 text-indigo-600">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">
                {uploading ? "Parsing and importing..." : "Drag and drop or click to upload"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                TXT, MD, or DOCX up to 5MB
              </p>
            </form>

            {errorMsg && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">
                {errorMsg}
              </div>
            )}
          </div>


        </div>
      </div>
    </div>
  );
}
