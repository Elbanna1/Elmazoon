"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";

/**
 * `/admin` is a switch, not a page.
 *
 *   authenticated admin -> /admin/dashboard
 *   anyone else         -> /admin/login
 *
 * It cannot be a server redirect: the decision depends on an HttpOnly cookie that
 * only the API can validate, and `check-authentication` is the only thing that can
 * say whether it is still good. So the check runs on the client and this route
 * holds a spinner — never a blank page, never a 404 — until it resolves.
 *
 * `router.replace`, not `push`: a `push` would leave `/admin` in the history, so
 * the back button from the dashboard would land here and immediately bounce the
 * user forward again — a trap they cannot escape with the back button.
 *
 * There is no redirect loop: `/admin/login` and `/admin/dashboard` are both
 * outside this route, and neither ever sends the user back to `/admin`.
 */
export default function AdminIndexPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isAuthenticated && isAdmin ? "/admin/dashboard" : "/admin/login");
  }, [isLoading, isAuthenticated, isAdmin, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="text-muted-foreground size-6 animate-spin" />
      <span className="sr-only">جارٍ التحقق من الجلسة…</span>
    </div>
  );
}
