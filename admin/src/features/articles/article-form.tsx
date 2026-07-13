"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUploader } from "@/shared/ui/image-uploader";
import { RichEditor } from "@/shared/ui/rich-editor";
import { articleImageUrl } from "@/lib/uploads";
import type { ArticleDto, ArticleFormValues } from "@/types/api";

const schema = z.object({
  title: z.string().trim().min(3, "برجاء كتابة عنوان الفتوى.").max(200, "العنوان طويل جدًا."),
  content: z.string().trim().min(20, "محتوى الفتوى قصير جدًا."),
});

type FormValues = z.infer<typeof schema>;

/**
 * Used by both "new" and "edit".
 *
 * The image is deliberately outside the Zod schema, and deliberately optional:
 * a fatwa is text, and requiring a picture before it can be published would put
 * an image-sourcing chore between the Ma'zoun and answering a question. The
 * validation an image actually needs (MIME type, size, drag-and-drop payloads)
 * is the uploader's job; Zod could only say "this is a File".
 */
export function ArticleForm({
  article,
  onSubmit,
  isSubmitting,
  submitLabel,
}: {
  article?: ArticleDto;
  onSubmit: (values: ArticleFormValues) => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | undefined>();
  const [removeImage, setRemoveImage] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: article?.title ?? "",
      content: article?.content ?? "",
    },
  });

  const existingUrl = removeImage || !article ? null : articleImageUrl(article);

  const submit = handleSubmit((values) => {
    onSubmit({
      title: values.title,
      content: values.content,
      image: file,
      removeImage,
    });
  });

  const nothingChanged = Boolean(article) && !isDirty && !file && !removeImage;

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Card className="border-ink-100 shadow-subtle">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان الفتوى</Label>
            <Input
              id="title"
              placeholder="مثال: شروط صحة عقد الزواج"
              aria-invalid={Boolean(errors.title)}
              {...register("title")}
            />
            {errors.title && (
              <p role="alert" className="text-xs font-medium text-danger">
                {errors.title.message}
              </p>
            )}
          </div>

          <ImageUploader
            file={file}
            existingUrl={existingUrl}
            error={imageError}
            disabled={isSubmitting}
            onChange={(next, error) => {
              setFile(next);
              setImageError(error);
              // Choosing a new file supersedes a pending removal.
              if (next) setRemoveImage(false);
            }}
            onRemoveExisting={() => setRemoveImage(true)}
          />

          <Controller
            control={control}
            name="content"
            render={({ field }) => (
              <RichEditor
                value={field.value}
                onChange={field.onChange}
                error={errors.content?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/articles")}
          disabled={isSubmitting}
        >
          إلغاء
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting || nothingChanged}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "جارٍ الحفظ…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
