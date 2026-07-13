"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Drag-and-drop image picker with a live preview.
 *
 * `accept="image/*"` on an <input> is a hint the OS file picker is free to
 * ignore, and a drag-and-drop payload never passes through the picker at all —
 * so the type and size are validated here rather than trusted.
 */
export function ImageUploader({
  file,
  existingUrl,
  onChange,
  onRemoveExisting,
  error,
  disabled,
}: {
  file: File | null;
  /** The already-published image, when editing. */
  existingUrl?: string | null;
  onChange: (file: File | null, error?: string) => void;
  onRemoveExisting?: () => void;
  error?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // Derived, not stored: creating the URL in an effect and pushing it into state
  // renders one frame with no preview, then re-renders with it.
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  // An object URL that is never revoked leaks for the lifetime of the tab.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const accept = useCallback(
    (selected: File | null) => {
      if (!selected) return onChange(null);

      if (!ACCEPTED.includes(selected.type)) {
        return onChange(null, "الصيغة غير مدعومة. استخدم JPG أو PNG أو WebP.");
      }
      if (selected.size > MAX_BYTES) {
        return onChange(null, "حجم الصورة أكبر من ٥ ميجابايت.");
      }
      onChange(selected);
    },
    [onChange],
  );

  const shown = preview ?? existingUrl ?? null;

  return (
    <div className="space-y-2">
      <Label htmlFor="article-image">صورة الفتوى (اختيارية)</Label>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (disabled) return;
          accept(event.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          "rounded-xl border border-dashed p-4 transition-colors",
          dragging && "border-primary bg-primary/5",
          error && "border-destructive/50",
          disabled && "opacity-60",
        )}
      >
        {shown ? (
          <div className="flex items-center gap-4">
            <div className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-lg border">
              <Image
                src={shown}
                alt="معاينة الصورة"
                fill
                sizes="80px"
                className="object-cover"
                // A blob: preview and a remote upload host are both outside the
                // optimizer's remit here.
                unoptimized
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {file ? file.name : "الصورة الحالية"}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                  : "اختر ملفًا جديدًا لاستبدالها."}
              </p>

              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => inputRef.current?.click()}
                >
                  استبدال
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() => {
                    onChange(null);
                    if (inputRef.current) inputRef.current.value = "";
                    // Only an already-published image needs an explicit removal
                    // flag sent to the server; an unsent File just disappears.
                    if (!file && existingUrl) onRemoveExisting?.();
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  إزالة
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 py-8 text-center"
          >
            <span className="bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-full">
              {dragging ? <UploadCloud className="size-5" /> : <ImageIcon className="size-5" />}
            </span>
            <span className="text-sm font-medium">
              {dragging ? "أفلت الصورة هنا" : "اسحب صورة هنا، أو اضغط للاختيار"}
            </span>
            <span className="text-muted-foreground text-xs">
              JPG أو PNG أو WebP — حتى ٥ ميجابايت. الصورة اختيارية.
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        id="article-image"
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => accept(event.target.files?.[0] ?? null)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "article-image-error" : undefined}
      />

      {error && (
        <p id="article-image-error" role="alert" className="text-destructive text-xs font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
