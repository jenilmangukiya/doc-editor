"use client";

import React from "react";
import { useUser } from "@/context/UserContext";
import { FileText, ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const { activeUser, logout } = useUser();
  const pathname = usePathname();
  const isDocPage = pathname.startsWith("/documents/");
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return null; // Don't show header on login page
  }

  return (
    <header className="border-b border-slate-200/80 bg-white px-6 py-3.5 shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-4">
          {isDocPage && (
            <Link
              href="/"
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-100">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-lg font-bold tracking-tight text-transparent">
                Ajaia
              </span>
              <span className="text-[10px] font-bold text-slate-400 ml-1">DOCS</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {activeUser && (
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 leading-3">
                  {activeUser.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {activeUser.email}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                title="Log out of account"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
