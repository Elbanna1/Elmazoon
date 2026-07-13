"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { setSessionExpiredHandler } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { authService } from "@/services/auth.service";
import type { LoginRequest } from "@/types/api";

interface AuthContextValue {
  isAuthenticated: boolean;
  isAdmin: boolean;
  /** True only on the very first check, so the shell can hold rather than flash. */
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  isLoggingIn: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: qk.auth,
    queryFn: authService.status,
    staleTime: 60_000,
    retry: false,
  });

  /**
   * The axios interceptor cannot navigate — it has no router. When a refresh
   * fails it calls this, which is the one place a dead session turns into a
   * redirect. Registered as an effect so it is torn down with the provider.
   */
  useEffect(() => {
    setSessionExpiredHandler(() => {
      queryClient.setQueryData(qk.auth, { isAuthenticated: false, isAdmin: false });
      queryClient.clear();
      toast.error("انتهت صلاحية الجلسة. برجاء تسجيل الدخول من جديد.");
      router.replace("/admin/login");
    });
    return () => setSessionExpiredHandler(null);
  }, [queryClient, router]);

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async () => {
      // The `jwt` cookie is set. Re-check rather than assume, so the app's idea
      // of "signed in" always comes from the server.
      await queryClient.invalidateQueries({ queryKey: qk.auth });
    },
  });

  const login = useCallback(
    async (credentials: LoginRequest) => {
      await loginMutation.mutateAsync(credentials);
    },
    [loginMutation],
  );

  const signOut = useCallback(async () => {
    try {
      await authService.signOut();
    } catch {
      // Even if revoking server-side fails, get the user off the admin surface.
    } finally {
      queryClient.clear();
      router.replace("/admin/login");
    }
  }, [queryClient, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: data?.isAuthenticated ?? false,
      isAdmin: data?.isAdmin ?? false,
      isLoading: isPending,
      login,
      isLoggingIn: loginMutation.isPending,
      signOut,
    }),
    [data, isPending, login, loginMutation.isPending, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}
