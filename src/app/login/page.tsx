"use client";

import React, { useState } from "react";
import { useUser } from "@/context/UserContext";
import { FileText, Loader2, Key, Mail, Sparkles, UserPlus } from "lucide-react";

export default function LoginPage() {
  const { login } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Email is required");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name: isNewUser ? name : undefined,
        }),
      });

      if (res.ok) {
        const user = await res.json();
        login(user);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  const loginDemoAccount = async (demoEmail: string, demoName: string) => {
    setLoading(true);
    setErrorMsg("");
    setEmail(demoEmail);
    setPassword("password123");
    setIsNewUser(false);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: demoEmail, name: demoName }),
      });

      if (res.ok) {
        const user = await res.json();
        login(user);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[90vh] flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-200/60 bg-white p-8 shadow-xl">
        {/* Header Branding */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-100">
            <FileText className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome to Ajaia
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to start creating and sharing documents.
          </p>
        </div>

        {/* Demo Accounts Section */}
        <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100/60 p-5">
          <h3 className="text-xs font-bold text-indigo-800 tracking-wide uppercase flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            Quick Demo Accounts (Click to Auto-Login)
          </h3>
          <p className="mt-1 text-[11px] text-slate-500">
            Click any account to auto-fill details and log in instantly:
          </p>
          <div className="mt-4 flex flex-col gap-2.5">
            <button
              onClick={() => loginDemoAccount("alice@example.com", "Alice")}
              disabled={loading}
              className="flex items-center justify-between rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:border-indigo-400 hover:text-indigo-600 transition-all text-left"
            >
              <span>Alice <span className="font-normal text-slate-400">(alice@example.com)</span></span>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">Owner User</span>
            </button>
            <button
              onClick={() => loginDemoAccount("bob@example.com", "Bob")}
              disabled={loading}
              className="flex items-center justify-between rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:border-indigo-400 hover:text-indigo-600 transition-all text-left"
            >
              <span>Bob <span className="font-normal text-slate-400">(bob@example.com)</span></span>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">Editor User</span>
            </button>
            <button
              onClick={() => loginDemoAccount("charlie@example.com", "Charlie")}
              disabled={loading}
              className="flex items-center justify-between rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:border-indigo-400 hover:text-indigo-600 transition-all text-left"
            >
              <span>Charlie <span className="font-normal text-slate-400">(charlie@example.com)</span></span>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">Reader User</span>
            </button>
          </div>
        </div>

        {/* Separator */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-full border-t border-slate-200"></div>
          <span className="relative bg-white px-4 text-xs font-semibold text-slate-400 uppercase">
            Or Use Custom Email
          </span>
        </div>

        {/* Login Form */}
        <form className="space-y-4" onSubmit={handleLoginSubmit}>
          <div>
            <label htmlFor="email-address" className="text-xs font-bold text-slate-500 uppercase">
              Email address
            </label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password-field" className="text-xs font-bold text-slate-500 uppercase">
              Password (mock)
            </label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Key className="h-4 w-4" />
              </span>
              <input
                id="password-field"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Toggle New User */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="new-user-checkbox"
                name="isNewUser"
                type="checkbox"
                checked={isNewUser}
                onChange={(e) => setIsNewUser(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="new-user-checkbox" className="ml-2 text-xs font-semibold text-slate-600 select-none cursor-pointer">
                I am a new user (Create account)
              </label>
            </div>
          </div>

          {isNewUser && (
            <div className="animate-fadeIn">
              <label htmlFor="fullname-field" className="text-xs font-bold text-slate-500 uppercase">
                Full Name
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <UserPlus className="h-4 w-4" />
                </span>
                <input
                  id="fullname-field"
                  name="fullname"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : isNewUser ? (
              "Sign Up & Login"
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-400">
          Note: If you enter an email that does not exist and do not check &quot;Create account&quot;, we will still automatically create it with a default name for seamless testing.
        </p>
      </div>
    </div>
  );
}
