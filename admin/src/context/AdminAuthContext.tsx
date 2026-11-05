import React, { createContext, useContext, useState, useEffect } from "react";
import { getApiUrl } from "../api/client";

export interface AdminUser {
  id: string;
  email: string;
  role: "ADMIN" | "PLAYER" | string;
  ign?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("lordz_admin_token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("lordz_admin_token");
      const storedUser = localStorage.getItem("lordz_admin_user");

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // ignore
        }
      }

      // Master admin tokens or local dev tokens are persistent
      if (
        storedToken.startsWith("demo-") ||
        storedToken.startsWith("admin-") ||
        storedToken.startsWith("master-")
      ) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(getApiUrl("/auth/me"), {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem("lordz_admin_user", JSON.stringify(data.user));
          }
        } else if (res.status === 401) {
          // Token expired
          localStorage.removeItem("lordz_admin_token");
          localStorage.removeItem("lordz_admin_user");
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        // Offline or dev fallback: if stored user exists, keep it
        console.warn("Backend auth verification check offline, using local cached session.");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (newToken: string, newUser: AdminUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("lordz_admin_token", newToken);
    localStorage.setItem("lordz_admin_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("lordz_admin_token");
    localStorage.removeItem("lordz_admin_user");
    fetch(getApiUrl("/auth/logout"), { method: "POST" }).catch(() => {});
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
