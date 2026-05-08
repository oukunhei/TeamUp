import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const { data } = await axios.post("/api/auth/refresh", { refreshToken });
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export const authApi = {
  register: (body: { email: string; password: string; name: string; studentId?: string }) =>
    api.post("/auth/register", body),
  login: (body: { email: string; password: string }) => api.post("/auth/login", body),
  refresh: (refreshToken: string) => api.post("/auth/refresh", { refreshToken }),
  me: () => api.get("/users/me"),
};

export const userApi = {
  me: () => api.get("/users/me"),
  updateMe: (body: Partial<{ name: string; bio: string; skills: string[]; avatar: string }>) =>
    api.patch("/users/me", body),
  getById: (id: string) => api.get(`/users/${id}`),
};

export const spaceApi = {
  list: (params?: { type?: string }) => api.get("/spaces", { params }),
  get: (id: string) => api.get(`/spaces/${id}`),
  create: (body: any) => api.post("/spaces", body),
  join: (id: string, joinCode: string) => api.post(`/spaces/${id}/join`, { joinCode }),
};

export const ideaApi = {
  list: (params?: any) => api.get("/ideas", { params }),
  get: (id: string) => api.get(`/ideas/${id}`),
  create: (body: any) => api.post("/ideas", body),
  update: (id: string, body: any) => api.patch(`/ideas/${id}`, body),
  publish: (id: string) => api.post(`/ideas/${id}/publish`),
  delete: (id: string) => api.delete(`/ideas/${id}`),
};

export const applicationApi = {
  create: (body: { ideaId: string; message?: string }) => api.post("/applications", body),
  sent: () => api.get("/applications/sent"),
  received: () => api.get("/applications/received"),
  review: (id: string, body: { status: "APPROVED" | "REJECTED" | "VIEWER"; reply?: string }) =>
    api.patch(`/applications/${id}`, body),
  promote: (id: string) => api.post(`/applications/${id}/promote`),
  withdraw: (id: string) => api.delete(`/applications/${id}`),
};

export const documentApi = {
  upload: (formData: FormData) =>
    api.post("/documents", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  listByIdea: (ideaId: string) => api.get(`/documents/idea/${ideaId}`),
  get: (id: string) => api.get(`/documents/${id}`),
  download: (id: string) => api.get(`/documents/${id}/download`, { responseType: "blob" }),
  preview: (id: string) => api.get(`/documents/${id}/preview`),
  versions: (id: string) => api.get(`/documents/${id}/versions`),
  rollback: (id: string, versionNumber: number) => api.post(`/documents/${id}/rollback`, { versionNumber }),
  delete: (id: string) => api.delete(`/documents/${id}`),
};

export const timestampApi = {
  get: (hash: string) => api.get(`/timestamps/${hash}`),
  verify: (body: any) => api.post("/timestamps/verify", body),
};

export const notificationApi = {
  list: (params?: { unreadOnly?: boolean }) => api.get("/notifications", { params }),
  unreadCount: () => api.get("/notifications/unread-count"),
  readAll: () => api.patch("/notifications/read-all"),
  read: (id: string) => api.patch(`/notifications/${id}/read`),
};
