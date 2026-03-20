import axios from "axios";
import type { Session } from "@/types/domain";
import { useAuthStore } from "@/store/auth-store";
import { routes } from "@/utils/routes";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";
let refreshPromise: Promise<Session | null> | null = null;
let redirectingToLogin = false;

function isNonRefreshAuthRoute(url?: string) {
  return Boolean(url && url.includes("/auth/") && !url.includes("/auth/refresh"));
}

function clearSessionAndRedirect() {
  const authStore = useAuthStore.getState();
  authStore.setExpiredMessage("Your session expired. Please sign in again.");
  authStore.setSession(null);
  redirectToLogin();
}

function redirectToLogin() {
  if (typeof window === "undefined" || redirectingToLogin) {
    return;
  }

  redirectingToLogin = true;
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const target = currentPath.startsWith(routes.login)
    ? routes.login
    : `${routes.login}?from=${encodeURIComponent(currentPath)}`;

  window.location.replace(target);
}

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().session?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url as string | undefined;

    if (status === 401 && requestUrl?.includes("/auth/refresh")) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    if (status !== 401 || originalRequest?._retry || isNonRefreshAuthRoute(requestUrl)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      const currentSession = useAuthStore.getState().session;
      refreshPromise = currentSession?.refreshToken
        ? apiClient
            .post("/auth/refresh", {
              refreshToken: currentSession.refreshToken,
            })
            .then((response) => response.data as Session)
            .catch(() => null)
            .finally(() => {
              refreshPromise = null;
            })
        : Promise.resolve(null).finally(() => {
            refreshPromise = null;
          });
    }

    const refreshedSession = await refreshPromise;

    if (!refreshedSession) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    useAuthStore.getState().setSession(refreshedSession);
    originalRequest.headers.Authorization = `Bearer ${refreshedSession.accessToken}`;

    return apiClient(originalRequest);
  },
);
