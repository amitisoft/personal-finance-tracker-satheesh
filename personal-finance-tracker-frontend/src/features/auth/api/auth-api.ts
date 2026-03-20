import type { Session } from "@/types/domain";
import { apiClient } from "@/services/api/client";

export async function login(payload: { email: string; password: string }): Promise<Session> {
  return (await apiClient.post("/auth/login", payload)).data;
}

export async function register(payload: { displayName: string; email: string; password: string }): Promise<Session> {
  return (await apiClient.post("/auth/register", payload)).data;
}

export async function forgotPassword(payload: { email: string }): Promise<{ success: boolean; resetUrl?: string | null }> {
  return (await apiClient.post("/auth/forgot-password", payload)).data;
}

export async function resetPassword(payload: { token?: string; email?: string; currentPassword?: string; password: string }) {
  return (await apiClient.post("/auth/reset-password", payload)).data;
}

export async function changePassword(payload: { currentPassword: string; password: string }) {
  return (await apiClient.post("/auth/change-password", payload)).data;
}
