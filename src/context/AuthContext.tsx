import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, type PlayerUser, type LoginPayload, type RegisterPayload } from "../api/auth";

interface AuthContextType {
  user: PlayerUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<PlayerUser>;
  loginWithGoogle: (payload: { token?: string; credential?: string; email?: string; name?: string; picture?: string }) => Promise<PlayerUser>;
  register: (payload: RegisterPayload) => Promise<PlayerUser>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<PlayerUser>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "lordz_player_token";
const USER_KEY = "lordz_player_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<PlayerUser | null>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveAuthSession = (newToken: string, newUser: PlayerUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  };

  const clearAuthSession = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res && res.user) {
        setUser(res.user);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      }
    } catch (error) {
      console.warn("[Auth] Session expired or invalid:", error);
      clearAuthSession();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if redirected from Google OAuth with success token
    const urlParams = new URLSearchParams(window.location.search);
    const googleAuthStatus = urlParams.get("google_auth");
    const tokenParam = urlParams.get("token");
    const userParam = urlParams.get("user");
    const codeParam = urlParams.get("code");

    if (googleAuthStatus === "success" && tokenParam && userParam) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userParam));
        saveAuthSession(tokenParam, parsedUser);

        // Clean query parameters from URL without reloading page
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("google_auth");
        cleanUrl.searchParams.delete("token");
        cleanUrl.searchParams.delete("user");
        window.history.replaceState(null, "", cleanUrl.pathname + cleanUrl.hash);
      } catch (e) {
        console.warn("Failed to parse Google user from URL:", e);
      }
    } else if (codeParam) {
      // Exchange authorization code with backend if returned directly to client
      fetch("/api/auth/google/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeParam,
          redirectUri: window.location.origin + window.location.pathname,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.token && data.user) {
            saveAuthSession(data.token, data.user);
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete("code");
            cleanUrl.searchParams.delete("scope");
            cleanUrl.searchParams.delete("authuser");
            cleanUrl.searchParams.delete("prompt");
            cleanUrl.searchParams.delete("state");
            window.history.replaceState(null, "", cleanUrl.pathname + cleanUrl.hash);
          }
        })
        .catch((err) => console.warn("Google code exchange failed:", err));
    }

    refreshUser();
  }, [refreshUser]);

  const login = async (payload: LoginPayload): Promise<PlayerUser> => {
    const res = await authApi.login(payload);
    saveAuthSession(res.token, res.user);
    return res.user;
  };

  const loginWithGoogle = async (payload: { token?: string; credential?: string; email?: string; name?: string; picture?: string }): Promise<PlayerUser> => {
    const res = await authApi.googleLogin(payload);
    saveAuthSession(res.token, res.user);
    return res.user;
  };

  const register = async (payload: RegisterPayload): Promise<PlayerUser> => {
    const res = await authApi.register(payload);
    saveAuthSession(res.token, res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      clearAuthSession();
    }
  };

  const updateUser = (data: Partial<PlayerUser>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
