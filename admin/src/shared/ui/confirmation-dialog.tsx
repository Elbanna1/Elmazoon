"use client";

import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The guard in front of anything irreversible.
 *
 * `AlertDialog` rather than `Dialog`: it focuses the *safe* action, and it cannot
 * be dismissed by clicking the backdrop — which is exactly the gesture someone
 * makes when they are about to delete the wrong thing.
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  destructive = false,
  loading = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              // Keep the dialog mounted while the request is in flight, so the
              // spinner is visible and a second click cannot land.
              event.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className={cn(destructive && buttonVariants({ variant: "destructive" }))}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** The common case: deleting a named thing. */
export function DeleteDialog({
  open,
  onOpenChange,
  name,
  kind,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Shown so the Ma'zoun can see exactly what he is about to lose. */
  name: string | null;
  kind: "article" | "question";
  loading?: boolean;
  onConfirm: () => void;
}) {
  const noun = kind === "article" ? "الفتوى" : "السؤال";

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`حذف ${noun}؟`}
      description={
        name
          ? `سيتم حذف «${name}» نهائيًا من الموقع، ولا يمكن التراجع عن هذا الإجراء.`
          : `سيتم حذف ${noun} نهائيًا، ولا يمكن التراجع عن هذا الإجراء.`
      }
      confirmLabel="نعم، احذف"
      destructive
      loading={loading}
      onConfirm={onConfirm}
    />
  );
}
