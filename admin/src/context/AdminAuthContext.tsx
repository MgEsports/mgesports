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

export const MASTER_ADMIN_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ0MTA4NWRkLWJiMjctNGJjNC05OTVhLWZjMzlhNDliODFhOCIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImVtYWlsIjoiYWRtaW5AbWdlc3BvcnRzLmluIn0.lrG5uJG-EKpT3kiQFiqG5UJg4kvKaO9FBWfGpM-QGQY";

export const MASTER_ADMIN_USER: AdminUser = {
  id: "441085dd-bb27-4bc4-995a-fc39a49b81a8",
  email: "admin@mgesports.in",
  role: "SUPER_ADMIN",
  fullName: "MG Administrator",
  ign: "MG_OVERLORD",
};

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
  const [user, setUser] = useState<AdminUser | null>(() => {
    try {
      const storedUser = localStorage.getItem("lordz_admin_user");
      if (storedUser) return JSON.parse(storedUser);
      const storedToken = localStorage.getItem("lordz_admin_token");
      if (storedToken === MASTER_ADMIN_JWT || storedToken === "admin-master-session-token") {
        return MASTER_ADMIN_USER;
      }
    } catch {}
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem("lordz_admin_token");
      if (raw === "admin-master-session-token" || raw === "demo-admin-token") {
        localStorage.setItem("lordz_admin_token", MASTER_ADMIN_JWT);
        localStorage.setItem("lordz_admin_user", JSON.stringify(MASTER_ADMIN_USER));
        return MASTER_ADMIN_JWT;
      }
      return raw;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      let storedToken = localStorage.getItem("lordz_admin_token");
      let storedUser = localStorage.getItem("lordz_admin_user");

      // Auto-upgrade legacy mock tokens
      if (storedToken === "admin-master-session-token" || storedToken === "demo-admin-token") {
        storedToken = MASTER_ADMIN_JWT;
        localStorage.setItem("lordz_admin_token", MASTER_ADMIN_JWT);
        localStorage.setItem("lordz_admin_user", JSON.stringify(MASTER_ADMIN_USER));
        setToken(MASTER_ADMIN_JWT);
        setUser(MASTER_ADMIN_USER);
        setIsLoading(false);
        return;
      }

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      // Master admin token is permanent and bypasses expiry checks
      if (storedToken === MASTER_ADMIN_JWT) {
        setToken(MASTER_ADMIN_JWT);
        setUser(storedUser ? JSON.parse(storedUser) : MASTER_ADMIN_USER);
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

      // Dev tokens are persistent
      if (storedToken.startsWith("demo-") || storedToken.startsWith("master-")) {
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
