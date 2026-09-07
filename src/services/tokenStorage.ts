const TOKEN_KEY = "slg_auth_token";
const ROLES_KEY = "slg_auth_roles";

export const tokenStorage = {
  setToken(token: string) {
    if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
  },
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  setRoles(roles: string[]) {
    if (typeof window !== "undefined") window.localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
  },
  getRoles(): string[] {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(ROLES_KEY);
    return raw ? JSON.parse(raw) : [];
  },
  clear() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(ROLES_KEY);
    }
  },
};

/** Base URL for the backend's file server (e.g. uploaded payment
 * screenshots), distinct from the /api/v1-prefixed API base URL. */
export function fileUrl(relativePath: string): string {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
  const serverRoot = apiBase.replace(/\/api\/v1\/?$/, "");
  return `${serverRoot}${relativePath}`;
}
