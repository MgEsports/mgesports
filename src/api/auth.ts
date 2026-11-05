import { apiRequest } from "./client";

export interface PlayerUser {
  id: string;
  username: string;
  email: string;
  role: string;
  ign: string;
  gameUid?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  discord?: string | null;
  gamingExperience?: string | null;
  primaryGame?: string | null;
  device?: string | null;
  bio?: string | null;
  status: string;
  createdAt: string;
}

export interface LoginPayload {
  identifier: string; // username or email or IGN
  password: string;
}

export interface RegisterPayload {
  username: string;
  fullName: string;
  email: string;
  password: string;
  phone: string;
  gamingExperience?: string;
  primaryGame?: string;
  ign?: string;
  discord?: string;
  device?: string;
  bio?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: PlayerUser;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  verifyResetOtp: async (email: string, otp: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  },

  resetPassword: async (
    email: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },

  googleLogin: async (payload: { token?: string; credential?: string; email?: string; name?: string; picture?: string }): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getMe: async (): Promise<{ success: boolean; user: PlayerUser }> => {
    return apiRequest<{ success: boolean; user: PlayerUser }>("/auth/me");
  },

  updateProfile: async (
    data: Partial<Omit<PlayerUser, "id" | "email" | "role" | "status" | "createdAt">>
  ): Promise<{ success: boolean; message: string; user: PlayerUser }> => {
    return apiRequest<{ success: boolean; message: string; user: PlayerUser }>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  logout: async (): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>("/auth/logout", {
      method: "POST",
    });
  },
};
