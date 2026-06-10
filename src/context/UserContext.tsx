"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface User {
  id: string;
  name: string;
  email: string;
}

interface UserContextType {
  activeUser: User | null;
  usersList: User[];
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const list = await res.json();
          setUsersList(list);
          
          const savedEmail = typeof window !== "undefined" ? localStorage.getItem("active-user-email") : null;
          const found = list.find((u: User) => u.email === savedEmail) || null;
          
          if (found) {
            setActiveUser(found);
            if (pathname === "/login") {
              router.push("/");
            }
          } else {
            setActiveUser(null);
            if (pathname !== "/login") {
              router.push("/login");
            }
          }
        }
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [pathname, router]);

  const login = (user: User) => {
    setActiveUser(user);
    if (typeof window !== "undefined") {
      localStorage.setItem("active-user-email", user.email);
    }
    // Update usersList in case a new user was created
    if (!usersList.some((u) => u.email === user.email)) {
      setUsersList((prev) => [...prev, user]);
    }
    router.push("/");
  };

  const logout = () => {
    setActiveUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("active-user-email");
    }
    router.push("/login");
  };

  return (
    <UserContext.Provider value={{ activeUser, usersList, loading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
