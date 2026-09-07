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
      if (envelope && envelope.success === false) {
        return Promise.reject(new ApiError(envelope.error));
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
