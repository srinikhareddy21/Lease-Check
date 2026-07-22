import type {
  DashboardStats,
  DemoDoc,
  Document,
  DocumentListResponse,
  Notification,
  Settings,
  User,
} from "./types";
import { notifyUnauthorized } from "./authEvents";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const TOKEN_KEY = "leasecheck_token";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Refresh-token scaffold.
 *
 * The backend does not currently expose a refresh-token endpoint — access
 * tokens are long-lived (14 days) instead of short-lived + refreshable.
 * Once the backend adds one (e.g. `POST /api/auth/refresh` returning a new
 * `access_token`, backed by an httpOnly refresh cookie or a stored refresh
 * token), wire it in here. `apiFetch` already calls this before giving up on
 * a 401, so no other code needs to change when refresh becomes available.
 */
export async function tryRefreshToken(): Promise<boolean> {
  // TODO: once available —
  // const res = await fetch(`${API_BASE}/api/auth/refresh`, { method: "POST", credentials: "include" });
  // if (res.ok) { const { access_token } = await res.json(); setToken(access_token); return true; }
  return false;
}

async function apiFetch<T>(path: string, options: RequestInit = {}, _retried = false): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    // Only treat this as a *session* problem when a token was actually sent —
    // a 401 from /auth/login with a bad password is just a form error, not
    // an expired session, and shouldn't force a logout/redirect.
    if (res.status === 401 && token) {
      if (!_retried && (await tryRefreshToken())) {
        return apiFetch<T>(path, options, true);
      }
      notifyUnauthorized();
    }
    const message = isJson ? (body as any)?.detail || "Something went wrong." : (body as string);
    throw new ApiError(typeof message === "string" ? message : "Something went wrong.", res.status);
  }
  return body as T;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const authApi = {
  signup: (data: { name: string; email: string; password: string }) =>
    apiFetch<{ access_token: string; user: User }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    apiFetch<{ access_token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  logout: () => apiFetch<void>("/api/auth/logout", { method: "POST" }),
  me: () => apiFetch<User>("/api/auth/me"),
  forgotPassword: (email: string) =>
    apiFetch<{ message: string; dev_reset_link?: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, new_password: string) =>
    apiFetch<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    }),
};

// ---------------------------------------------------------------------------
// Users / profile / settings
// ---------------------------------------------------------------------------

export const usersApi = {
  updateProfile: (data: { name?: string; avatar_url?: string }) =>
    apiFetch<User>("/api/users/me", { method: "PATCH", body: JSON.stringify(data) }),
  changePassword: (data: { current_password: string; new_password: string }) =>
    apiFetch<void>("/api/users/me/change-password", { method: "POST", body: JSON.stringify(data) }),
  deleteAccount: (password: string) =>
    apiFetch<void>("/api/users/me/delete", { method: "POST", body: JSON.stringify({ password }) }),
  getSettings: () => apiFetch<Settings>("/api/users/me/settings"),
  updateSettings: (data: Partial<Settings>) =>
    apiFetch<Settings>("/api/users/me/settings", { method: "PATCH", body: JSON.stringify(data) }),
};

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export interface DocumentListParams {
  q?: string;
  favorite?: boolean;
  risk_level?: string;
  sort?: "created_at" | "filename" | "risk";
  order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

export const documentsApi = {
  listDemoDocuments: () => apiFetch<DemoDoc[]>("/api/demo-documents"),

  list: (params: DocumentListParams = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") search.set(k, String(v));
    });
    return apiFetch<DocumentListResponse>(`/api/documents?${search.toString()}`);
  },

  get: (id: string) => apiFetch<Document>(`/api/documents/${id}`),

  rename: (id: string, filename: string) =>
    apiFetch<Document>(`/api/documents/${id}`, { method: "PATCH", body: JSON.stringify({ filename }) }),

  toggleFavorite: (id: string) => apiFetch<Document>(`/api/documents/${id}/favorite`, { method: "POST" }),

  remove: (id: string) => apiFetch<void>(`/api/documents/${id}`, { method: "DELETE" }),
  restore: (id: string) => apiFetch<Document>(`/api/documents/${id}/restore`, { method: "POST" }),
  purge: (id: string) => apiFetch<void>(`/api/documents/${id}/permanent`, { method: "DELETE" }),

  analysisHistory: (id: string) => apiFetch<Notification[]>(`/api/documents/${id}/analyses`),

  exports: (id: string) => apiFetch<{ id: string; format: string; created_at: string }[]>(`/api/documents/${id}/exports`),

  async export(id: string, format: "pdf" | "markdown" | "text", filenameHint: string) {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/documents/${id}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ format }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(body.detail || "Export failed.", res.status);
    }
    const blob = await res.blob();
    const ext = format === "markdown" ? "md" : format === "text" ? "txt" : "pdf";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameHint.replace(/\.[^.]+$/, "")}-report.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notificationsApi = {
  list: () => apiFetch<{ items: Notification[]; unread_count: number }>("/api/notifications"),
  markRead: (id: string) => apiFetch<Notification>(`/api/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () => apiFetch<void>("/api/notifications/read-all", { method: "POST" }),
  remove: (id: string) => apiFetch<void>(`/api/notifications/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const dashboardApi = {
  stats: () => apiFetch<DashboardStats>("/api/dashboard/stats"),
};

export { API_BASE };
