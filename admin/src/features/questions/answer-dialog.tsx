"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionDto } from "@/types/api";

const MAX = 2000;

/**
 * Publish or correct the answer to a question.
 *
 * Editing an existing answer matters more than it looks: this site publishes
 * religious and legal rulings, and the backend has always allowed the answer to
 * be updated (`edit-response` is an upsert). A UI that only allowed a first
 * answer would make a typo in a fatwa permanent.
 */
export function AnswerDialog({
  question,
  open,
  onOpenChange,
  onSubmit,
  isSaving,
}: {
  question: QuestionDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (response: string) => void;
  isSaving: boolean;
}) {
  const [value, setValue] = useState(question?.response ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState(question?._id ?? null);

  // Reload the draft whenever a *different* question is opened. Keyed on the id
  // rather than object identity, so a background refetch that returns an equal
  // question does not wipe out an answer the admin is halfway through typing.
  const currentId = question?._id ?? null;
  if (currentId !== loadedId) {
    setLoadedId(currentId);
    setValue(question?.response ?? "");
    setError(null);
  }

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      // An empty answer would previously "publish" and then lock the question
      // out of the form entirely.
      setError("لا يمكن حفظ رد فارغ.");
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{question?.response ? "تعديل الرد" : "الرد على السؤال"}</DialogTitle>
          <DialogDescription>
            يُنشر الرد علنًا أسفل السؤال على الموقع.
          </DialogDescription>
        </DialogHeader>

        {question && (
          <div className="bg-muted/50 rounded-lg border p-4">
            <p className="text-muted-foreground text-xs font-medium">{question.name} كتب</p>
            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line">{question.question}</p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="answer">ردّك</Label>
            <span className="text-muted-foreground text-xs tabular-nums">
              {value.length} / {MAX}
            </span>
          </div>
          <Textarea
            id="answer"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
            maxLength={MAX}
            rows={8}
            placeholder="اكتب الرد الشرعي على السؤال…"
            aria-invalid={Boolean(error)}
            disabled={isSaving}
          />
          {error && (
            <p role="alert" className="text-destructive text-xs font-medium">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            إلغاء
          </Button>
          <Button onClick={submit} disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            {question?.response ? "حفظ التعديل" : "نشر الرد"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
