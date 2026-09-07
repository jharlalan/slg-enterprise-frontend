/**
 * Centralized API client.
 *
 * - Injects the JWT (from wherever the app stores the current session).
 * - Attaches a fresh X-Correlation-ID per request for end-to-end tracing.
 * - Unwraps the backend's standard error envelope into a typed
 *   ApiError, so calling code can just `catch (err: ApiError)` instead
 *   of parsing `error.response.data.error.code` inline everywhere.
 */
import axios, { AxiosError, AxiosInstance } from "axios";
import { tokenStorage } from "@/services/tokenStorage";

export type ApiErrorEnvelope = {
  success: false;
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
    correlation_id: string;
    timestamp: string;
  };
};

export class ApiError extends Error {
  code: string;
  correlationId: string;
  details: Record<string, unknown>;

  constructor(envelope: ApiErrorEnvelope["error"]) {
    super(envelope.message);
    this.code = envelope.code;
    this.correlationId = envelope.correlation_id;
    this.details = envelope.details;
  }
}

function getStoredToken(): string | null {
  return tokenStorage.getToken();
}

function generateCorrelationId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `cid-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createApiClient(baseURL: string): AxiosInstance {
  const client = axios.create({ baseURL, timeout: 15000 });

  client.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["X-Correlation-ID"] = generateCorrelationId();
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorEnvelope>) => {
      const envelope = error.response?.data;
      const status = error.response?.status;

      if (envelope && envelope.success === false) {
        const apiError = new ApiError(envelope.error);

        // Two distinct ways "you're not properly logged in" shows up:
        //   401 -> our own AuthException family (expired/invalid token)
        //   422 with an "authorization" message -> the Authorization
        //     header was missing from the request entirely (no token
        //     stored at all) — a raw FastAPI validation error, not one
        //     of our AppException codes, so it has to be matched on
        //     the message text rather than a clean error code.
        // Either way, showing the raw backend text to the user isn't
        // useful — redirecting straight to login is the correct
        // recovery for both cases. NOT done for 403 (INSUFFICIENT_PERMISSION):
        // that means logged in but wrong role, which is a real message
        // worth showing, not a session problem to redirect away from.
        const sessionIsMissingOrInvalid =
          status === 401 || (status === 422 && /authorization/i.test(apiError.message));

        if (sessionIsMissingOrInvalid && typeof window !== "undefined") {
          const authPages = ["/login", "/portal/login", "/portal/register"];
          const alreadyOnAuthPage = authPages.includes(window.location.pathname);
          if (!alreadyOnAuthPage) {
            tokenStorage.clear();
            const loginPath = window.location.pathname.startsWith("/portal") ? "/portal/login" : "/login";
            window.location.href = loginPath;
          }
        }

        return Promise.reject(apiError);
      }
      // Network error, timeout, or a non-standard error shape
      return Promise.reject(
        new ApiError({
          code: "NETWORK_ERROR",
          message: "Could not reach the server. Please check your connection.",
          details: {},
          correlation_id: "",
          timestamp: new Date().toISOString(),
        })
      );
    }
  );

  return client;
}

export const apiClient = createApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1"
);
