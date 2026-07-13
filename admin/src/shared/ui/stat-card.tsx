"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A single figure, in the site's card.
 *
 * No count-up animation: on a dashboard the number is read, not watched, and an
 * operator refreshing to check a pending count should not have to wait for it to
 * finish spinning up from zero.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "gold" | "success" | "warning";
}) {
  const tones = {
    default: "bg-ink-50 text-ink-500",
    gold: "bg-gold-50 text-gold-600",
    success: "bg-success/10 text-success",
    warning: "bg-gold-100 text-gold-700",
  } as const;

  return (
    <Card className="group border-ink-100 shadow-subtle transition-shadow duration-300 ease-premium hover:shadow-card">
      <CardContent className="flex items-start gap-4 p-5">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 ease-premium group-hover:scale-105",
            tones[tone],
          )}
        >
          <Icon className="size-[1.125rem]" />
        </span>

        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">
            <span className="ltr-nums">{value.toLocaleString("ar-EG")}</span>
          </p>
          {hint && <p className="mt-0.5 text-xs text-ink-400">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
