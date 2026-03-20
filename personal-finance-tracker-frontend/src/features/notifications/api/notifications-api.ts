import { apiClient } from "@/services/api/client";
import type { NotificationState } from "@/types/domain";

export async function getNotificationState(): Promise<NotificationState> {
  return (await apiClient.get("/notifications/state")).data;
}

export async function markNotificationsSeen(notificationIds: string[]): Promise<NotificationState> {
  return (await apiClient.post("/notifications/seen", { notificationIds })).data;
}

export async function dismissNotifications(notificationIds: string[]): Promise<NotificationState> {
  return (await apiClient.post("/notifications/dismiss", { notificationIds })).data;
}
