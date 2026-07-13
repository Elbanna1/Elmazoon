"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";

/**
 * Gate in front of every dashboard route.
 *
 * This is a UX gate, not a security boundary — the real protection is the API
 * rejecting unauthenticated requests, which it does with a 401 on every admin
 * endpoint (verified). It exists so an expired session lands you on the login
 * screen instead of on a dashboard full of error states.
 *
 * It must never render children before the check resolves, or the admin surface
 * flashes on screen for a signed-out visitor.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  const allowed = isAuthenticated && isAdmin;

  useEffect(() => {
    if (!isLoading && !allowed) router.replace("/admin/login");
  }, [isLoading, allowed, router]);

  if (isLoading || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
        <span className="sr-only">جارٍ التحقق من الصلاحيات…</span>
      </div>
    );
  }

  return <>{children}</>;
}
