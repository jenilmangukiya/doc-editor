import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ajaia Docs - Collaborative Editor",
  description: "A lightweight, premium collaborative document editor powered by Next.js and Neon Postgres.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-50 antialiased">
      <body className={`${geistSans.variable} ${geistMono.variable} flex min-h-full flex-col font-sans text-slate-800`}>
        <UserProvider>
          <Header />
          <main className="flex-1 flex flex-col">{children}</main>
        </UserProvider>
      </body>
    </html>
  );
}

