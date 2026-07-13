import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { BFF_PREFIX, REQUEST_TIMEOUT_MS } from "@/lib/config";
import { toApiError } from "@/lib/errors";
import { endpoints } from "@/services/endpoints";

/**
 * The HTTP client.
 *
 * baseURL is this app's own proxy, not the API — see `lib/config.ts` for why.
 * The proxy forwards to API_BASE_URL, so the rule still holds: exactly one place
 * in the codebase knows the backend's origin, and changing NEXT_PUBLIC_API_URL
 * repoints the entire dashboard.
 */
export const api: AxiosInstance = axios.create({
  baseURL: BFF_PREFIX,
  // Auth is a cookie. Without this axios sends none, and every admin call 401s.
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: "application/json" },
});

/** Config we tag so a retried request cannot itself trigger another refresh. */
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
  /** Opt a call out of the refresh dance (login, refresh, sign-out). */
  _skipRefresh?: boolean;
}

/**
 * Access tokens are short-lived, so a 401 mid-session is expected, not
 * exceptional. When one arrives we refresh once and replay the original request.
 *
 * The subtlety is concurrency: a dashboard fires stats, analytics and charts in
 * parallel, so an expired token produces three simultaneous 401s. Refreshing
 * three times would be wrong — the backend *rotates* refresh tokens and treats a
 * replayed one as theft, revoking every session for that admin. So the first 401
 * starts the refresh and the rest await the same promise.
 */
let refreshing: Promise<void> | null = null;

async function refreshOnce(): Promise<void> {
  if (!refreshing) {
    refreshing = api
      // Through the endpoint map, not a literal — a hardcoded path here is a path
      // that will not be found when someone greps for every route this app calls.
      .post(endpoints.auth.refresh, null, { _skipRefresh: true } as RetriableConfig)
      .then(() => undefined)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

/** Set by the auth provider so a dead session can bounce the user to login. */
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    const shouldTryRefresh =
      error.response?.status === 401 && config && !config._retried && !config._skipRefresh;

    if (shouldTryRefresh) {
      config._retried = true;
      try {
        await refreshOnce();
        // The refresh set a new `jwt` cookie; replaying the request now sends it.
        return await api.request(config);
      } catch {
        // The refresh token is gone or already revoked. This session is over.
        onSessionExpired?.();
        return Promise.reject(toApiError(error));
      }
    }

    return Promise.reject(toApiError(error));
  },
);

/**
 * Questions returns its pagination in headers rather than in the body, and the
 * header names are lowercased by the browser's Headers implementation.
 */
export function readTotals(
  headers: unknown,
  fallbackCount: number,
): { totalCount: number; totalPages: number } {
  const get = (name: string): string | undefined => {
    if (typeof headers !== "object" || headers === null) return undefined;
    const bag = headers as Record<string, unknown>;
    const raw = bag[name] ?? bag[name.toLowerCase()];
    return typeof raw === "string" ? raw : undefined;
  };

  const count = Number(get("X-Total-Count"));
  const pages = Number(get("X-Total-Pages"));

  return {
    totalCount: Number.isFinite(count) ? count : fallbackCount,
    totalPages: Number.isFinite(pages) && pages > 0 ? pages : 1,
  };
}
