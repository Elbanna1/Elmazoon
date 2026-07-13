"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Debounced so that typing "marriage" fires one request, not eight.
 *
 * `value` is the committed term the caller queries with; the box keeps its own
 * draft. Keeping them separate is what lets the caller reset the search (page
 * change, filter change) without fighting the input.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "ابحث…",
  delayMs = 350,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delayMs?: number;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [committed, setCommitted] = useState(value);

  // Re-sync when the caller changes the term from outside (a "clear filters"
  // button, say). Adjusting state during render is React's own prescription for
  // this; doing it in an effect renders once with the stale term first, which is
  // exactly what `react-hooks/set-state-in-effect` is pointing at.
  if (value !== committed) {
    setCommitted(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onChange(draft), delayMs);
    return () => clearTimeout(timer);
  }, [draft, value, delayMs, onChange]);

  return (
    <div className={className}>
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          className="ps-9 pe-9"
          aria-label={placeholder}
        />
        {draft && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setDraft("");
              onChange("");
            }}
            className="absolute end-1 top-1/2 size-7 -translate-y-1/2"
            aria-label="مسح البحث"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
