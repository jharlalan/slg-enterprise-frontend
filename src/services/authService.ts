import { apiClient } from "@/services/apiClient";
import { tokenStorage } from "@/services/tokenStorage";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  roles: string[];
  username: string;
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>("/auth/login", { username, password });
    tokenStorage.setToken(data.access_token);
    tokenStorage.setRoles(data.roles);
    tokenStorage.setDisplayName(data.username);
    return data;
  },

  logout(): void {
    tokenStorage.clear();
  },

  getRoles(): string[] {
    return tokenStorage.getRoles();
  },

  isLoggedIn(): boolean {
    return Boolean(tokenStorage.getToken());
  },
};
