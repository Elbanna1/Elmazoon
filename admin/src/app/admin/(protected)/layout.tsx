import type { ReactNode } from "react";
import { RequireAdmin } from "@/features/auth/require-admin";
import { AppShell } from "@/widgets/app-shell";

/**
 * Everything in this route group is behind the admin gate. Putting the guard in
 * the group layout rather than on each page means a new page cannot be added
 * unprotected by accident.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAdmin>
      <AppShell>{children}</AppShell>
    </RequireAdmin>
  );
}
