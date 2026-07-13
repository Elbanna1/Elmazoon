"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChartPoint } from "@/types/api";

/**
 * The one chart on the dashboard.
 *
 * Deliberately small and deliberately conditional: it renders nothing at all when
 * every point is zero. A flat line along the floor of an axis is not information —
 * it is a chart-shaped hole that makes the page look busy while saying nothing.
 */
export function WeeklyChart({
  title,
  data,
  isLoading,
}: {
  title: string;
  data: ChartPoint[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="border-ink-100 shadow-subtle">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // Last seven points, and only if there is anything in them.
  const week = (data ?? []).slice(-7);
  if (week.length === 0 || week.every((point) => point.value === 0)) return null;

  return (
    <Card className="border-ink-100 shadow-subtle">
      <CardHeader className="pb-2">
        <CardTitle className="text-[0.9375rem] font-semibold text-ink-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={week} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="weekly-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a67c3d" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#a67c3d" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* RTL: time reads right-to-left, like the rest of the page. */}
              <XAxis
                dataKey="label"
                reversed
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="#8c8880"
              />

              <Tooltip
                cursor={{ stroke: "#e8e4dd" }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="rounded-lg border border-ink-100 bg-surface px-3 py-2 shadow-card">
                      <p className="text-xs text-ink-400">{label}</p>
                      <p className="ltr-nums text-sm font-semibold text-ink-900">
                        {Number(payload[0]!.value).toLocaleString("ar-EG")}
                      </p>
                    </div>
                  ) : null
                }
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke="#a67c3d"
                strokeWidth={2}
                fill="url(#weekly-fill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
