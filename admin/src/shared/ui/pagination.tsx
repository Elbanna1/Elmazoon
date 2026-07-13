"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Paging over an API that reports total pages but not always total rows.
 *
 * The row count is shown only when the server actually gave us one — the
 * articles endpoint returns pages but no row total, and printing a derived
 * "about 60 articles" would be a number we made up.
 */
export function Pagination({
  page,
  totalPages,
  totalCount,
  showCount = true,
  isFetching,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalCount?: number;
  showCount?: boolean;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  // A window of pages around the current one, so 40 pages does not render 40
  // buttons.
  const window = 1;
  const pages: Array<number | "gap"> = [];
  for (let p = 1; p <= totalPages; p += 1) {
    const isEdge = p === 1 || p === totalPages;
    const isNear = Math.abs(p - page) <= window;
    if (isEdge || isNear) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "gap") {
      pages.push("gap");
    }
  }

  return (
    <nav
      className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row"
      aria-label="ترقيم الصفحات"
    >
      <p className="text-muted-foreground text-sm tabular-nums">
        صفحة <span className="ltr-nums">{page}</span> من <span className="ltr-nums">{totalPages}</span>
        {showCount && typeof totalCount === "number" && totalCount > 0 && (
          <> · {totalCount.toLocaleString("ar-EG")} إجمالاً</>
        )}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isFetching}
          aria-label="الصفحة السابقة"
        >
          <ChevronRight className="size-4" />
        </Button>

        {pages.map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="text-muted-foreground px-2 text-sm">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "ghost"}
              size="icon"
              onClick={() => onPageChange(p)}
              disabled={isFetching}
              aria-current={p === page ? "page" : undefined}
              className="tabular-nums"
            >
              {p}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isFetching}
          aria-label="الصفحة التالية"
        >
          <ChevronLeft className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
