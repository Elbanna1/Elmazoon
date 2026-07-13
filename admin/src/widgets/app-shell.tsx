"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/widgets/notification-bell";
import { NAV_ITEMS, PUBLIC_SITE_URL } from "@/widgets/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";

/**
 * The admin shell, wearing the public site's chrome.
 *
 * Paper background, hairline borders, the site's wordmark, the site's gold. The
 * intent is that someone who clicks through from almaazoon.com should feel they
 * are still on it — not that they have been handed off to a separate product.
 */

function Wordmark() {
  return (
    <Link href="/admin/dashboard" className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-ink-900 text-sm font-bold text-gold-300">
        م
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[0.9375rem] font-semibold text-ink-900">لوحة التحكم</span>
        <span className="mt-1 text-[0.6875rem] font-medium text-ink-400">
          الدكتور محمد البحراوي
        </span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="التنقل الرئيسي" className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[0.9375rem] font-medium transition-colors duration-200",
              active
                ? "bg-ink-900 text-white"
                : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
            )}
          >
            <item.icon className="size-[1.125rem] shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  const { signOut } = useAuth();

  return (
    <div className="space-y-1 border-t border-ink-100 pt-4">
      <a
        href={PUBLIC_SITE_URL}
        className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[0.9375rem] font-medium text-ink-600 transition-colors duration-200 hover:bg-ink-50 hover:text-ink-900"
      >
        <ExternalLink className="size-[1.125rem] shrink-0" />
        عرض الموقع
      </a>

      <button
        type="button"
        onClick={() => void signOut()}
        className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-[0.9375rem] font-medium text-danger transition-colors duration-200 hover:bg-danger/5"
      >
        <LogOut className="size-[1.125rem] shrink-0" />
        تسجيل الخروج
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper">
      {/* Sidebar — RTL, so it sits on the right. `start` is the logical side. */}
      <aside className="fixed inset-y-0 start-0 hidden w-64 flex-col border-e border-ink-100 bg-surface lg:flex">
        <div className="flex h-[4.5rem] items-center px-5">
          <Wordmark />
        </div>
        <div className="flex-1 overflow-y-auto border-t border-ink-100 p-4">
          <NavLinks />
        </div>
        <div className="p-4">
          <SidebarFooter />
        </div>
      </aside>

      <div className="lg:ps-64">
        <header className="sticky top-0 z-30 flex h-[4.5rem] items-center gap-3 border-b border-ink-100 bg-paper/80 px-5 backdrop-blur-xl sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="فتح القائمة"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>

            {/* RTL: the drawer comes in from the right, the side the nav lives on. */}
            <SheetContent side="right" className="w-72 border-ink-100 bg-surface p-0">
              <SheetTitle className="sr-only">القائمة</SheetTitle>
              <div className="flex h-[4.5rem] items-center px-5">
                <Wordmark />
              </div>
              <div className="border-t border-ink-100 p-4">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
                <div className="mt-4">
                  <SidebarFooter />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="lg:hidden">
            <Wordmark />
          </div>

          <div className="ms-auto">
            <NotificationBell />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
