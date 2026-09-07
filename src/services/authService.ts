import { apiClient } from "@/services/apiClient";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  roles: string[];
  username: string;
}

const TOKEN_KEY = "slg_auth_token";
const ROLES_KEY = "slg_auth_roles";

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>("/auth/login", { username, password });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_KEY, data.access_token);
      window.localStorage.setItem(ROLES_KEY, JSON.stringify(data.roles));
    }
    return data;
  },

  logout(): void {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(ROLES_KEY);
    }
  },

  getRoles(): string[] {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(ROLES_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  isLoggedIn(): boolean {
    if (typeof window === "undefined") return false;
    return Boolean(window.localStorage.getItem(TOKEN_KEY));
  },
};
