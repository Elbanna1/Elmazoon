import { api } from "@/lib/api";
import { endpoints } from "@/services/endpoints";
import type { AuthStatus, LoginRequest, LoginResponse } from "@/types/api";

/**
 * The JWT never touches JavaScript. `login` returns only `{ success, message }`;
 * the token itself arrives as an HttpOnly `jwt` cookie which the browser stores
 * and replays automatically. There is deliberately nothing here that reads,
 * writes, or persists a token — an XSS payload on this dashboard would find
 * nothing to steal.
 */
export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>(endpoints.auth.login, credentials, {
      // A failed login must surface as a 401 to the caller, not kick off a
      // refresh attempt against a session that does not exist.
      _skipRefresh: true,
    } as never);
    return data;
  },

  async status(): Promise<AuthStatus> {
    const { data } = await api.get<AuthStatus>(endpoints.auth.checkAuthentication);
    return data;
  },

  async signOut(): Promise<void> {
    await api.post(endpoints.auth.signOut, null, { _skipRefresh: true } as never);
  },
};
